/**
 * PracticeScoreViewport Component
 *
 * A read-only score viewport for displaying generated practice content
 * (scales, arpeggios, guide tones over chord changes).
 * Uses OpenSheetMusicDisplay (OSMD) for rendering.
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
import type { WebViewRef } from "../../../types/webview";
import { practiceContentToMusicXml } from "../services/pitchEventsToMusicXml";
import type {
  GeneratedChordSegment,
  GeneratedPitchEvent,
  TimeSignature,
  KeySignature,
  Clef,
} from "../types";

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

export interface PracticeScoreViewportProps {
  /** Generated content segments */
  segments: GeneratedChordSegment[];
  /** All generated pitch events */
  events: GeneratedPitchEvent[];
  /** Total duration in beats */
  totalBeats: number;
  /** Exercise title */
  title?: string;
  /** Time signature (from source tune) */
  timeSignature?: TimeSignature;
  /** Key signature (from source tune) */
  keySignature?: KeySignature;
  /** Clef (from source tune) */
  clef?: Clef;
  /** Tempo for display */
  tempo?: number;
  /** Whether the viewport is collapsed */
  collapsed?: boolean;
  /** Callback to toggle collapsed state */
  onToggleCollapse?: () => void;
  /** Called when rendering completes */
  onRenderComplete?: () => void;
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// Component
// =============================================================================

function PracticeScoreViewportComponent({
  segments,
  events,
  totalBeats,
  title = "Practice Exercise",
  timeSignature = { beats: 4, beatUnit: 4 },
  keySignature = 0,
  clef = "treble",
  tempo = 120,
  collapsed = false,
  onToggleCollapse,
  onRenderComplete,
  testID,
}: PracticeScoreViewportProps): React.ReactElement {
  const webViewRef = useRef<WebViewRef | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate MusicXML from events
  const musicXml = useMemo(() => {
    if (events.length === 0) return "";

    try {
      return practiceContentToMusicXml({
        segments,
        events,
        totalBeats,
        title,
        timeSignature,
        keySignature,
        clef,
        tempo,
      });
    } catch (_err) {
      return "";
    }
  }, [
    segments,
    events,
    totalBeats,
    title,
    timeSignature,
    keySignature,
    clef,
    tempo,
  ]);

  // Generate HTML with embedded MusicXML for OSMD
  const html = useMemo(() => {
    if (!musicXml) return "";

    // Escape MusicXML for embedding in HTML
    const escapedXml = musicXml
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$/g, "\\$");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Practice Score</title>
  <script src="https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.8.6/build/opensheetmusicdisplay.min.js"></script>
  <style>
    body { margin: 0; padding: 8px; background: #fff; }
    #osmd { width: 100%; }
  </style>
</head>
<body>
  <div id="osmd"></div>
  <script>
    (async function() {
      try {
        const osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay("osmd", {
          autoResize: false,
          drawTitle: false,
          drawComposer: false,
          drawPartNames: false,
          renderSingleHorizontalStaffline: true,
        });
        await osmd.load(\`${escapedXml}\`);
        osmd.zoom = 0.7;
        await osmd.render();
        window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "rendered" }));
        window.parent?.postMessage(JSON.stringify({ type: "rendered" }), "*");
      } catch (err) {
        window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "error", payload: { message: err.message } }));
        window.parent?.postMessage(JSON.stringify({ type: "error", payload: { message: err.message } }), "*");
      }
    })();
  </script>
</body>
</html>`;
  }, [musicXml]);

  // Handle WebView message (for loading state)
  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === "ready" || data.type === "rendered") {
          setIsLoading(false);
          onRenderComplete?.();
        } else if (data.type === "error") {
          setError(data.payload?.message || "Render failed");
          setIsLoading(false);
        }
      } catch {
        // Ignore parse errors
      }
    },
    [onRenderComplete],
  );

  // Reset loading state when content changes
  useEffect(() => {
    if (musicXml) {
      setIsLoading(true);
      setError(null);
    }
  }, [musicXml]);

  // Web platform: use iframe
  useEffect(() => {
    if (Platform.OS === "web" && iframeRef.current) {
      const iframe = iframeRef.current;
      const handleIframeMessage = (event: MessageEvent) => {
        if (event.source !== iframe.contentWindow) return;
        try {
          const data =
            typeof event.data === "string"
              ? JSON.parse(event.data)
              : event.data;
          if (data.type === "ready" || data.type === "rendered") {
            setIsLoading(false);
            onRenderComplete?.();
          } else if (data.type === "error") {
            setError(data.payload?.message || "Render failed");
            setIsLoading(false);
          }
        } catch {
          // Ignore
        }
      };
      window.addEventListener("message", handleIframeMessage);
      return () => window.removeEventListener("message", handleIframeMessage);
    }
  }, [onRenderComplete]);

  // If no content, show placeholder
  if (events.length === 0) {
    return (
      <View style={styles.container} testID={testID}>
        <View style={styles.emptyState}>
          <Feather name="music" size={24} color={colors.textSecondary} />
          <Text style={styles.emptyText}>
            Generated content will appear here
          </Text>
        </View>
      </View>
    );
  }

  // Collapsed state
  if (collapsed) {
    return (
      <View style={styles.container} testID={testID}>
        <TouchableOpacity
          style={styles.collapsedHeader}
          onPress={onToggleCollapse}
          accessibilityRole="button"
          accessibilityLabel="Expand practice score"
        >
          <Feather name="music" size={16} color={colors.primary} />
          <Text style={styles.collapsedTitle}>
            {title} ({segments.length} chords)
          </Text>
          <Feather name="chevron-down" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="music" size={14} color={colors.primary} />
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        {onToggleCollapse && (
          <TouchableOpacity
            style={styles.collapseButton}
            onPress={onToggleCollapse}
            accessibilityRole="button"
            accessibilityLabel="Collapse practice score"
          >
            <Feather name="chevron-up" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Score viewport */}
      <View style={styles.viewportContainer}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {Platform.OS === "web" ? (
          <iframe
            ref={iframeRef}
            srcDoc={html}
            style={{
              width: "100%",
              height: 150,
              border: "none",
              backgroundColor: colors.surface,
            }}
            title="Practice Score"
          />
        ) : WebView ? (
          <WebView
            ref={webViewRef}
            source={{ html }}
            style={styles.webView}
            onMessage={handleMessage}
            scrollEnabled={true}
            bounces={false}
            showsHorizontalScrollIndicator={true}
            showsVerticalScrollIndicator={false}
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            testID="practice-webview"
          />
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>WebView not available</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  emptyState: {
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
  collapsedHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    gap: spacing.xs,
  },
  collapsedTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.primaryLight,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  collapseButton: {
    padding: spacing.xs,
  },
  viewportContainer: {
    height: 150,
    position: "relative",
  },
  webView: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    gap: spacing.xs,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    textAlign: "center",
  },
});

// =============================================================================
// Export
// =============================================================================

export const PracticeScoreViewport = memo(PracticeScoreViewportComponent);
