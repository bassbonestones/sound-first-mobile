/**
 * ScorePreview Component
 *
 * Renders MusicXML as visual music notation using OpenSheetMusicDisplay (OSMD)
 * inside a WebView (native) or iframe (web). Supports zoom, pan, and measure highlighting.
 *
 * Features:
 * - Renders MusicXML/MXL content as sheet music
 * - Pinch-to-zoom and pan gestures
 * - Measure highlighting for uncertain regions
 * - Loading and error states
 * - Responsive sizing
 * - Cross-platform: WebView on native, iframe on web
 */

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
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
import { generateOsmdHtml } from "./scorePreviewHtml";
import type { HighlightedMeasure, WebViewMessage } from "./scorePreviewTypes";

// Conditionally import WebView only on native platforms
let WebView: typeof import("react-native-webview").WebView | null = null;

if (Platform.OS !== "web") {
  const webViewModule = require("react-native-webview");
  WebView = webViewModule.WebView;
}

// Web-specific styles (can't use StyleSheet for iframe)
// Use visibility: hidden instead of width/height: 1 so OSMD has proper dimensions for layout
const webIframeHiddenStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  visibility: "hidden",
  border: "none",
};

const webIframeVisibleStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  visibility: "visible",
  border: "none",
  backgroundColor: "white",
};

// Re-export types for external use
export type { HighlightedMeasure } from "./scorePreviewTypes";

// ============================================================================
// Types
// ============================================================================

export interface ScorePreviewProps {
  /** MusicXML content to render */
  readonly musicXml: string;
  /** Measures to highlight (e.g., uncertain measures from OMR) */
  readonly highlightMeasures?: readonly HighlightedMeasure[];
  /** Handler when a measure is tapped */
  readonly onMeasureTap?: (measureNumber: number, partIndex: number) => void;
  /** Handler for errors during rendering */
  readonly onError?: (error: string) => void;
  /** Handler when rendering completes */
  readonly onRenderComplete?: () => void;
  /** Initial zoom level (default: 1.0) */
  readonly initialZoom?: number;
  /** Minimum zoom level (default: 0.5) */
  readonly minZoom?: number;
  /** Maximum zoom level (default: 3.0) */
  readonly maxZoom?: number;
  /** Show zoom controls (default: true) */
  readonly showZoomControls?: boolean;
  /** Enable cursor for practice mode (default: false) */
  readonly enableCursor?: boolean;
  /** Called when cursor should advance (each beat) */
  readonly onCursorNext?: () => void;
  /** Fixed render width in pixels for horizontal scrolling (0 = auto-fit) */
  readonly fixedWidth?: number;
  /** Auto-scroll to keep cursor visible during playback (default: false) */
  readonly autoScrollToCursor?: boolean;
  /** Render all measures in a single horizontal line for scrollable practice (default: false) */
  readonly horizontalStaffline?: boolean;
  /** Container height (default: 400) */
  readonly height?: number;
  /** Test ID */
  readonly testID?: string;
}

/**
 * Ref handle for imperative cursor control
 */
export interface ScorePreviewRef {
  /** Show the cursor */
  showCursor: () => void;
  /** Hide the cursor */
  hideCursor: () => void;
  /** Reset cursor to beginning */
  resetCursor: () => void;
  /** Move cursor to next note/beat */
  cursorNext: () => void;
  /** Advance cursor by one beat (uses time signature's beat unit) - for metronome sync */
  advanceCursorByBeat: () => void;
  /** Move cursor to specific measure */
  cursorToMeasure: (measureNumber: number) => void;
  /** Start playback with tempo-synced cursor (uses requestAnimationFrame for accuracy) */
  startPlayback: (tempo: number, startMeasure?: number) => void;
  /** Pause playback */
  pausePlayback: () => void;
  /** Resume playback */
  resumePlayback: () => void;
  /** Stop playback and reset cursor */
  stopPlayback: () => void;
}

type RenderState = "loading" | "rendering" | "ready" | "error";

// ============================================================================
// Component
// ============================================================================

function ScorePreviewInner(
  {
    musicXml,
    highlightMeasures = [],
    onMeasureTap,
    onError,
    onRenderComplete,
    initialZoom = 1.0,
    minZoom = 0.5,
    maxZoom = 3.0,
    showZoomControls = true,
    enableCursor = false,
    onCursorNext,
    fixedWidth = 0,
    autoScrollToCursor = false,
    horizontalStaffline = false,
    height = 400,
    testID = "score-preview",
  }: ScorePreviewProps,
  ref: React.ForwardedRef<ScorePreviewRef>,
): React.ReactElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const webViewRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const hasSentMusicXml = useRef(false);
  const currentMusicXmlRef = useRef(musicXml);
  const [renderState, setRenderState] = useState<RenderState>("loading");
  const [currentZoom, setCurrentZoom] = useState(initialZoom);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset when musicXml changes
  useEffect(() => {
    if (musicXml !== currentMusicXmlRef.current) {
      currentMusicXmlRef.current = musicXml;
      hasSentMusicXml.current = false;
      setRenderState("loading");
    }
  }, [musicXml]);

  // Generate HTML with OSMD
  const html = useMemo(
    () =>
      generateOsmdHtml({
        initialZoom,
        highlightMeasures: highlightMeasures as HighlightedMeasure[],
        enableCursor,
        fixedWidth,
        autoScrollToCursor,
        horizontalStaffline,
      }),
    [
      initialZoom,
      highlightMeasures,
      enableCursor,
      fixedWidth,
      autoScrollToCursor,
      horizontalStaffline,
    ],
  );

  // Process message from WebView/iframe
  const processMessage = useCallback(
    (message: WebViewMessage) => {
      switch (message.type) {
        case "ready":
          // OSMD is loaded and ready - MusicXML will be sent/processed
          break;

        case "rendered":
          setRenderState("ready");
          onRenderComplete?.();
          break;

        case "error":
          setRenderState("error");
          setErrorMessage(message.payload as string);
          onError?.(message.payload as string);
          break;

        case "measureTap": {
          const { measureNumber, partIndex } = message.payload as {
            measureNumber: number;
            partIndex: number;
          };
          onMeasureTap?.(measureNumber, partIndex);
          break;
        }

        case "zoomChange":
          setCurrentZoom(message.payload as number);
          break;
      }
    },
    [onMeasureTap, onError, onRenderComplete],
  );

  // Handle messages from native WebView
  const handleWebViewMessage = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event: any) => {
      try {
        const message: WebViewMessage = JSON.parse(event.nativeEvent.data);
        processMessage(message);
      } catch {
        // Silently ignore malformed messages from WebView
      }
    },
    [processMessage],
  );

  // Web: Handle postMessage from iframe
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handleWindowMessage = (event: MessageEvent) => {
      try {
        // Verify origin if needed
        if (typeof event.data === "string") {
          const message: WebViewMessage = JSON.parse(event.data);
          processMessage(message);
        }
      } catch {
        // Silently ignore malformed messages
      }
    };

    window.addEventListener("message", handleWindowMessage);
    return () => window.removeEventListener("message", handleWindowMessage);
  }, [processMessage]);

  // Send MusicXML to WebView/iframe when loaded
  const handleWebViewLoad = useCallback(() => {
    // Prevent duplicate sends
    if (hasSentMusicXml.current) {
      return;
    }
    hasSentMusicXml.current = true;
    setRenderState("rendering");

    // Escape MusicXML for safe injection
    const escapedXml = musicXml
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r");

    const script = `window.renderMusicXML('${escapedXml}');`;

    if (Platform.OS === "web") {
      // Web: Post to iframe
      iframeRef.current?.contentWindow?.postMessage(
        { type: "execute", script },
        "*",
      );
      // Also try direct injection if same-origin
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (iframeRef.current?.contentWindow as any)?.eval(script);
      } catch {
        // Cross-origin, use postMessage (handled above)
      }
    } else {
      // Native: Use WebView injectJavaScript
      webViewRef.current?.injectJavaScript(`${script} true;`);
    }
  }, [musicXml]);

  // Inject JavaScript helper for both platforms
  const injectScript = useCallback((script: string) => {
    if (Platform.OS === "web") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (iframeRef.current?.contentWindow as any)?.eval(script);
      } catch {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "execute", script },
          "*",
        );
      }
    } else {
      webViewRef.current?.injectJavaScript(`${script} true;`);
    }
  }, []);

  // Expose cursor control methods via ref
  useImperativeHandle(
    ref,
    () => ({
      showCursor: () => injectScript("window.showCursor();"),
      hideCursor: () => injectScript("window.hideCursor();"),
      resetCursor: () => injectScript("window.resetCursor();"),
      cursorNext: () => injectScript("window.cursorNext();"),
      advanceCursorByBeat: () => injectScript("window.advanceCursorByBeat();"),
      cursorToMeasure: (measureNumber: number) =>
        injectScript(`window.cursorToMeasure(${measureNumber});`),
      startPlayback: (tempo: number, startMeasure?: number) =>
        injectScript(`window.startPlayback(${tempo}, ${startMeasure ?? 1});`),
      pausePlayback: () => injectScript("window.pausePlayback();"),
      resumePlayback: () => injectScript("window.resumePlayback();"),
      stopPlayback: () => injectScript("window.stopPlayback();"),
    }),
    [injectScript],
  );

  // Zoom control handlers
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(currentZoom + 0.25, maxZoom);
    injectScript(`window.setZoom(${newZoom});`);
    setCurrentZoom(newZoom);
  }, [currentZoom, maxZoom, injectScript]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(currentZoom - 0.25, minZoom);
    injectScript(`window.setZoom(${newZoom});`);
    setCurrentZoom(newZoom);
  }, [currentZoom, minZoom, injectScript]);

  const handleZoomReset = useCallback(() => {
    injectScript(`window.setZoom(1.0);`);
    setCurrentZoom(1.0);
  }, [injectScript]);

  const isLoading = renderState === "loading" || renderState === "rendering";
  const isError = renderState === "error";
  const isReady = renderState === "ready";

  // Unified render - always keep iframe/WebView mounted to prevent re-triggering onLoad
  // If height is undefined, use flex: 1 to fill parent container
  const containerStyle = height
    ? [styles.container, { height }]
    : [styles.container, { flex: 1 }];

  return (
    <View
      style={containerStyle}
      testID={testID}
      accessibilityLabel={
        isLoading
          ? "Score preview loading"
          : isError
            ? "Score preview error"
            : "Sheet music score"
      }
    >
      {/* WebView/iframe - always mounted */}
      {Platform.OS === "web" ? (
        <iframe
          ref={iframeRef as React.RefObject<HTMLIFrameElement>}
          srcDoc={html}
          style={isReady ? webIframeVisibleStyle : webIframeHiddenStyle}
          onLoad={handleWebViewLoad}
        />
      ) : (
        WebView && (
          <WebView
            ref={webViewRef}
            source={{ html }}
            style={isReady ? styles.webView : styles.hiddenWebView}
            onLoad={handleWebViewLoad}
            onMessage={handleWebViewMessage}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={["*"]}
            scrollEnabled={isReady}
            bounces={false}
            showsHorizontalScrollIndicator={isReady}
            showsVerticalScrollIndicator={isReady}
          />
        )
      )}

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {renderState === "loading"
              ? "Preparing renderer..."
              : "Rendering score..."}
          </Text>
        </View>
      )}

      {/* Error overlay */}
      {isError && (
        <View style={[styles.overlay, styles.errorContainer]}>
          <Feather name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>Failed to render score</Text>
          <Text style={styles.errorDetail}>{errorMessage}</Text>
        </View>
      )}

      {/* Zoom controls - only show when ready */}
      {showZoomControls && isReady && (
        <View style={styles.zoomControls}>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={handleZoomOut}
            disabled={currentZoom <= minZoom}
            accessibilityLabel="Zoom out"
            accessibilityRole="button"
            testID={`${testID}-zoom-out`}
          >
            <Feather
              name="zoom-out"
              size={20}
              color={
                currentZoom <= minZoom
                  ? colors.textTertiary
                  : colors.textPrimary
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.zoomButton}
            onPress={handleZoomReset}
            accessibilityLabel="Reset zoom"
            accessibilityRole="button"
            testID={`${testID}-zoom-reset`}
          >
            <Text style={styles.zoomText}>
              {Math.round(currentZoom * 100)}%
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.zoomButton}
            onPress={handleZoomIn}
            disabled={currentZoom >= maxZoom}
            accessibilityLabel="Zoom in"
            accessibilityRole="button"
            testID={`${testID}-zoom-in`}
          >
            <Feather
              name="zoom-in"
              size={20}
              color={
                currentZoom >= maxZoom
                  ? colors.textTertiary
                  : colors.textPrimary
              }
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const ScorePreviewComponent = forwardRef(ScorePreviewInner);

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  webView: {
    flex: 1,
    backgroundColor: "white",
  },
  hiddenWebView: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textTertiary,
    fontSize: 14,
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  errorText: {
    marginTop: spacing.md,
    color: colors.error,
    fontSize: 16,
    fontWeight: "600",
  },
  errorDetail: {
    marginTop: spacing.sm,
    color: colors.textTertiary,
    fontSize: 14,
    textAlign: "center",
  },
  zoomControls: {
    position: "absolute",
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 8,
    padding: spacing.xs,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  zoomButton: {
    padding: spacing.sm,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
    minWidth: 40,
    textAlign: "center",
  },
});

export const ScorePreview = memo(ScorePreviewComponent);
