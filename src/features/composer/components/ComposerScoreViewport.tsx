/**
 * ComposerScoreViewport Component
 *
 * Renders the composer score using OpenSheetMusicDisplay (OSMD) in a WebView.
 * Supports:
 * - Score rendering from ComposerScore data model
 * - Selected note highlighting
 * - Tap-to-select notes
 * - Auto-scroll to cursor position
 * - Zoom controls
 */

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";
import { generateComposerOsmdHtml } from "./composerScoreHtml";
import { generateMusicXml } from "../services/musicXmlGenerator";
import type { ComposerScore, CursorPosition } from "../types";

// Conditionally import WebView
let WebView: typeof import("react-native-webview").WebView | null = null;

if (Platform.OS !== "web") {
  try {
    const webViewModule = require("react-native-webview");
    WebView = webViewModule.WebView;
  } catch {
    // WebView not available
  }
}

// =============================================================================
// Types
// =============================================================================

export interface ComposerScoreViewportProps {
  /** The score to render */
  score: ComposerScore;
  /** Current cursor position */
  cursor: CursorPosition;
  /** ID of selected note (for highlighting) */
  selectedNoteId?: string | null;
  /** Called when a note is tapped */
  onNoteTap?: (measureIndex: number, noteIndex: number) => void;
  /** Called when rendering completes */
  onRenderComplete?: () => void;
  /** Called on error */
  onError?: (error: string) => void;
  /** Show zoom controls (default: true) */
  showZoomControls?: boolean;
  /** Initial zoom level */
  initialZoom?: number;
  /** Minimum zoom */
  minZoom?: number;
  /** Maximum zoom */
  maxZoom?: number;
  /** Playback state: stopped, playing, paused */
  playbackState?: "stopped" | "playing" | "paused";
  /** Current playback measure index (for auto-scroll during playback) */
  playbackMeasureIndex?: number;
  /** Called when play is pressed */
  onPlay?: () => void;
  /** Called when pause is pressed */
  onPause?: () => void;
  /** Called when stop is pressed */
  onStop?: () => void;
  /** Test ID for testing */
  testID?: string;
}

interface WebViewMessage {
  type: string;
  payload?: unknown;
}

// =============================================================================
// Component
// =============================================================================

function ComposerScoreViewportComponent({
  score,
  cursor,
  selectedNoteId,
  onNoteTap,
  onRenderComplete,
  onError,
  showZoomControls = true,
  initialZoom = 1.0,
  minZoom = 0.5,
  maxZoom = 2.5,
  playbackState = "stopped",
  playbackMeasureIndex,
  onPlay,
  onPause,
  onStop,
  testID,
}: ComposerScoreViewportProps): React.ReactElement {
  const webViewRef = useRef<InstanceType<typeof WebView> | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(initialZoom);

  // Generate MusicXML from score
  const musicXml = useMemo(() => {
    return generateMusicXml(score, {
      selectedNoteId: selectedNoteId ?? undefined,
    });
  }, [score, selectedNoteId]);

  // Generate HTML for WebView (only once - zoom is controlled via script)
  const html = useMemo(() => {
    return generateComposerOsmdHtml({
      initialZoom: initialZoom,
      horizontalStaffline: true,
      fixedWidth: 2000, // Allow horizontal scrolling
    });
  }, [initialZoom]);

  // Execute script in WebView/iframe
  const executeScript = useCallback((script: string) => {
    if (Platform.OS === "web") {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { type: "execute", script },
          "*",
        );
      }
    } else if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`${script}; true;`);
    }
  }, []);

  // Render MusicXML when ready
  useEffect(() => {
    if (isReady && musicXml) {
      const escapedXml = musicXml.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
      executeScript(`window.renderMusicXML(\`${escapedXml}\`)`);
    }
  }, [isReady, musicXml, executeScript]);

  // Scroll to cursor or playback position
  useEffect(() => {
    if (isReady) {
      // During playback, scroll to playback position; otherwise cursor
      const measureToShow =
        playbackState === "playing" && playbackMeasureIndex !== undefined
          ? playbackMeasureIndex
          : cursor.measureIndex;
      executeScript(`window.scrollToMeasure(${measureToShow})`);
    }
  }, [
    isReady,
    cursor.measureIndex,
    playbackState,
    playbackMeasureIndex,
    executeScript,
  ]);

  // Handle messages from WebView
  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } } | MessageEvent) => {
      try {
        let data: WebViewMessage;
        if ("nativeEvent" in event) {
          // Native WebView sends string in nativeEvent.data
          data = JSON.parse(event.nativeEvent.data);
        } else {
          // Web iframe sends stringified JSON via postMessage
          data =
            typeof event.data === "string"
              ? JSON.parse(event.data)
              : event.data;
        }

        switch (data.type) {
          case "ready":
            setIsReady(true);
            break;

          case "rendered":
            setIsLoading(false);
            onRenderComplete?.();
            break;

          case "error":
            setError(data.payload as string);
            setIsLoading(false);
            onError?.(data.payload as string);
            break;

          case "noteTap": {
            const { measureIndex, noteIndex } = data.payload as {
              measureIndex: number;
              noteIndex: number;
            };
            onNoteTap?.(measureIndex, noteIndex);
            break;
          }

          case "zoomChange":
            setZoom(data.payload as number);
            break;

          case "consoleLog":
            // Debug logging from WebView
            const log = data.payload as { level: string; message: string };
            if (__DEV__) {
              if (log.level === "error") {
                console.error("[OSMD]", log.message);
              } else {
                console.log("[OSMD]", log.message);
              }
            }
            break;
        }
      } catch (e) {
        // Ignore parse errors
      }
    },
    [onNoteTap, onRenderComplete, onError],
  );

  // Web iframe message listener
  useEffect(() => {
    if (Platform.OS === "web") {
      const listener = (event: MessageEvent) => {
        // Without allow-same-origin, we can't verify event.source === contentWindow
        // Accept messages that look like our JSON format
        if (event.data && typeof event.data === "string") {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed && typeof parsed.type === "string") {
              handleMessage(event);
            }
          } catch {
            // Not our message
          }
        }
      };
      window.addEventListener("message", listener);
      return () => window.removeEventListener("message", listener);
    }
  }, [handleMessage]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoom + 0.25, maxZoom);
    setZoom(newZoom);
    executeScript(`window.setZoom(${newZoom})`);
  }, [zoom, maxZoom, executeScript]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoom - 0.25, minZoom);
    setZoom(newZoom);
    executeScript(`window.setZoom(${newZoom})`);
  }, [zoom, minZoom, executeScript]);

  const handleZoomReset = useCallback(() => {
    setZoom(1.0);
    executeScript("window.setZoom(1.0)");
  }, [executeScript]);

  // Render error state
  if (error) {
    return (
      <View style={styles.container} testID={testID}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      {/* Score viewport */}
      <View style={styles.viewportContainer}>
        {Platform.OS === "web" ? (
          <iframe
            ref={iframeRef as React.RefObject<HTMLIFrameElement>}
            srcDoc={html}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              backgroundColor: "white",
            }}
            sandbox="allow-scripts"
          />
        ) : WebView ? (
          <WebView
            ref={webViewRef as React.RefObject<InstanceType<typeof WebView>>}
            source={{ html }}
            style={styles.webView}
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false} // Container handles scrolling
            onMessage={handleMessage}
            onError={(e) => {
              setError("Failed to load renderer");
              onError?.("Failed to load renderer");
            }}
          />
        ) : (
          <View style={styles.noWebView}>
            <Text style={styles.noWebViewText}>
              WebView not available on this platform
            </Text>
          </View>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Rendering score...</Text>
          </View>
        )}
      </View>

      {/* Controls bar with playback and zoom */}
      {showZoomControls && (
        <View style={styles.controlsBar}>
          {/* Playback controls */}
          <View style={styles.playbackControls}>
            <TouchableOpacity
              style={[
                styles.playbackButton,
                playbackState === "stopped" && styles.playbackButtonDisabled,
              ]}
              onPress={onStop}
              disabled={playbackState === "stopped"}
              accessibilityLabel="Stop"
              accessibilityRole="button"
              testID="viewport-stop"
            >
              <Feather
                name="square"
                size={18}
                color={
                  playbackState !== "stopped"
                    ? colors.error
                    : colors.textSecondary
                }
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.playButton}
              onPress={playbackState === "playing" ? onPause : onPlay}
              accessibilityLabel={
                playbackState === "playing" ? "Pause" : "Play"
              }
              accessibilityRole="button"
              testID="viewport-play"
            >
              <Feather
                name={playbackState === "playing" ? "pause" : "play"}
                size={22}
                color={colors.white}
              />
            </TouchableOpacity>
          </View>

          {/* Spacer */}
          <View style={styles.controlsSpacer} />

          {/* Zoom controls */}
          <View style={styles.zoomControls}>
            <TouchableOpacity
              style={styles.zoomButton}
              onPress={handleZoomOut}
              accessibilityLabel="Zoom out"
              accessibilityRole="button"
            >
              <Feather name="minus" size={18} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.zoomLabelButton}
              onPress={handleZoomReset}
              accessibilityLabel={`Zoom ${Math.round(zoom * 100)}%. Tap to reset`}
              accessibilityRole="button"
            >
              <Text style={styles.zoomLabel}>{Math.round(zoom * 100)}%</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.zoomButton}
              onPress={handleZoomIn}
              accessibilityLabel="Zoom in"
              accessibilityRole="button"
            >
              <Feather name="plus" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  viewportContainer: {
    flex: 1,
    position: "relative",
  },
  webView: {
    flex: 1,
    backgroundColor: "white",
  },
  noWebView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  noWebViewText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  errorText: {
    marginTop: spacing.md,
    color: colors.error,
    fontSize: 14,
    textAlign: "center",
  },
  controlsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  playbackControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  playbackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  playbackButtonDisabled: {
    opacity: 0.4,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  controlsSpacer: {
    flex: 1,
  },
  zoomControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  zoomButton: {
    padding: spacing.xs,
    borderRadius: 6,
    backgroundColor: colors.background,
  },
  zoomLabelButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  zoomLabel: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: "500",
    minWidth: 40,
    textAlign: "center",
  },
});

// =============================================================================
// Export
// =============================================================================

export const ComposerScoreViewport = memo(ComposerScoreViewportComponent);
