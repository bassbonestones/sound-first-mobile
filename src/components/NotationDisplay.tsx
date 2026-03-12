import React, { useEffect, useRef, useState, useMemo, RefObject } from "react";
import {
  View,
  Text,
  Platform,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { devError } from "../utils/devLogger";

// Conditionally import WebView for native platforms
interface WebViewType {
  postMessage: (message: string) => void;
}

interface WebViewProps {
  ref?: RefObject<WebViewType>;
  source: { html: string };
  style: ViewStyle | ViewStyle[];
  scrollEnabled?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  showsVerticalScrollIndicator?: boolean;
  originWhitelist?: string[];
  javaScriptEnabled?: boolean;
  domStorageEnabled?: boolean;
  mixedContentMode?: "always" | "never" | "compatibility";
}

type WebViewComponent = React.ComponentType<WebViewProps>;

let WebView: WebViewComponent | null = null;
if (Platform?.OS && Platform.OS !== "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const RNWebView = require("react-native-webview");
    WebView = RNWebView?.WebView || null;
  } catch (e) {
    // WebView not available, that's OK
  }
}

// Global type for OSMD
interface OSMDCursor {
  hide: () => void;
  show: () => void;
  reset: () => void;
  next: () => void;
  Iterator: { EndReached: boolean };
}

interface OSMDEngravingRules {
  PageBackgroundColor: string;
  PageLeftMargin: number;
  PageRightMargin: number;
  PageTopMargin: number;
  PageBottomMargin: number;
  SheetMinimumDistanceBetweenSystems: number;
  MinimumDistanceBetweenSystems: number;
  FixedMeasureWidth: boolean;
  FixedMeasureWidthFixedValue: number;
}

interface OSMDInstance {
  cursor: OSMDCursor;
  EngravingRules: OSMDEngravingRules;
  zoom: number;
  load: (musicxml: string) => Promise<void>;
  render: () => void;
}

declare global {
  interface Window {
    opensheetmusicdisplay?: {
      OpenSheetMusicDisplay: new (
        container: HTMLElement,
        options: Record<string, unknown>,
      ) => OSMDInstance;
    };
  }
}

/**
 * NotationDisplay Component
 *
 * Renders MusicXML notation using OpenSheetMusicDisplay (OSMD).
 * Uses WebView on mobile, direct DOM on web.
 */

interface NotationDisplayProps {
  musicxml?: string;
  width?: number;
  height?: number;
  showTitle?: boolean;
  showTimeSignature?: boolean;
  fixedMeasureWidthPixels?: number | null;
  zoom?: number;
  currentNoteIndex?: number | null;
}

const NotationDisplay: React.FC<NotationDisplayProps> = ({
  musicxml,
  width = 320,
  height = 200,
  showTitle = false,
  showTimeSignature = false,
  fixedMeasureWidthPixels = null,
  zoom = 0.7,
  currentNoteIndex = null,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const osmdRef = useRef<OSMDInstance | null>(null);
  const webViewRef = useRef<WebViewType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") {
      setLoading(false);
      return;
    }

    // Load OSMD script dynamically
    const loadOSMD = async (): Promise<void> => {
      if (typeof window === "undefined") return;

      // Check if OSMD is already loaded
      if (window.opensheetmusicdisplay) {
        initializeOSMD();
        return;
      }

      // Load OSMD from CDN
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.8.6/build/opensheetmusicdisplay.min.js";
      script.async = true;
      script.onload = () => {
        initializeOSMD();
      };
      script.onerror = () => {
        setError("Failed to load notation library");
        setLoading(false);
      };
      document.head.appendChild(script);
    };

    const initializeOSMD = async (): Promise<void> => {
      if (!containerRef.current || !window.opensheetmusicdisplay) {
        setLoading(false);
        return;
      }

      // Check again after any async operations - component may have unmounted
      if (!containerRef.current) {
        setLoading(false);
        return;
      }

      try {
        const { OpenSheetMusicDisplay } = window.opensheetmusicdisplay;

        // ALWAYS clear the container before creating a new instance
        // (This prevents concatenation of multiple staves on re-render)
        if (!containerRef.current) return; // Guard against unmount
        containerRef.current.innerHTML = "";
        osmdRef.current = null;

        // Create OSMD instance with fixed sizing
        osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, {
          autoResize: false,
          drawTitle: showTitle,
          drawSubtitle: false,
          drawComposer: false,
          drawLyricist: false,
          drawCredits: false,
          drawPartNames: false,
          drawPartAbbreviations: false,
          drawMeasureNumbers: false,
          drawTimeSignatures: showTimeSignature,
          renderSingleHorizontalStaffline: true,
          fixedMeasureWidth: !!fixedMeasureWidthPixels,
          followCursor: false,
          cursorsOptions: [
            {
              type: 3, // type 3 = highlight cursor (colors the notes)
              color: "#4CAF50",
              alpha: 0.7,
              follow: false,
            },
          ],
        });

        // Set rendering options for dark theme
        osmdRef.current.EngravingRules.PageBackgroundColor = "transparent";
        // Fix the staff size to prevent jumping
        osmdRef.current.EngravingRules.PageLeftMargin = 1;
        osmdRef.current.EngravingRules.PageRightMargin = 0;
        osmdRef.current.EngravingRules.PageTopMargin = 0;
        osmdRef.current.EngravingRules.PageBottomMargin = 0;
        osmdRef.current.EngravingRules.SheetMinimumDistanceBetweenSystems = 0;
        osmdRef.current.EngravingRules.MinimumDistanceBetweenSystems = 0;

        // Set fixed measure width if specified
        if (fixedMeasureWidthPixels) {
          osmdRef.current.EngravingRules.FixedMeasureWidth = true;
          osmdRef.current.EngravingRules.FixedMeasureWidthFixedValue =
            fixedMeasureWidthPixels / 10;
        }

        // Load and render with fixed width
        if (musicxml) {
          await osmdRef.current.load(musicxml);
          // Check if still mounted after async load
          if (!containerRef.current) {
            setLoading(false);
            return;
          }
          // Set a fixed zoom to stabilize rendering
          osmdRef.current.zoom = zoom;
          osmdRef.current.render();

          // Force consistent positioning by fixing the SVG
          if (!containerRef.current) return; // Guard after render
          const svgElement = containerRef.current.querySelector("svg");
          if (svgElement) {
            // Fix size - use full width, just small margins
            svgElement.style.width = `${width}px`;
            svgElement.style.height = `${height}px`;
            svgElement.style.maxWidth = `${width}px`;
            svgElement.style.maxHeight = `${height}px`;
          }
        }

        setLoading(false);
      } catch (err) {
        devError("OSMD error:", err);
        setError("Failed to render notation");
        setLoading(false);
      }
    };

    loadOSMD();

    return () => {
      if (osmdRef.current) {
        osmdRef.current = null;
      }
    };
  }, [
    musicxml,
    showTitle,
    showTimeSignature,
    fixedMeasureWidthPixels,
    zoom,
    width,
    height,
  ]);

  // Update cursor position when currentNoteIndex changes (web only)
  useEffect(() => {
    if (Platform.OS !== "web" || !osmdRef.current || !osmdRef.current.cursor)
      return;

    const cursor = osmdRef.current.cursor;

    if (currentNoteIndex === null || currentNoteIndex < 0) {
      cursor.hide();
      return;
    }

    // Reset cursor to start and advance to the target note
    cursor.reset();
    cursor.show();

    for (let i = 0; i < currentNoteIndex && !cursor.Iterator.EndReached; i++) {
      cursor.next();
    }
  }, [currentNoteIndex]);

  // Generate HTML for WebView (mobile)
  const webviewHtml = useMemo<string>(() => {
    if (Platform.OS === "web" || !musicxml) return "";

    // Escape the MusicXML for embedding in JavaScript
    const escapedXml = musicxml
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$/g, "\\$");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      background: transparent; 
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding-left: 8px;
    }
    #osmd-container { 
      width: 100%; 
      max-width: ${width}px;
    }
    #osmd-container svg {
      width: 100% !important;
      height: auto !important;
    }
    #loading {
      color: #bfa76a;
      font-family: sans-serif;
      font-size: 14px;
      text-align: center;
    }
    #error {
      color: #c0392b;
      font-family: sans-serif;
      font-size: 12px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div id="osmd-container">
    <div id="loading">Loading notation...</div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.8.6/build/opensheetmusicdisplay.min.js"></script>
  <script>
    (async function() {
      try {
        const container = document.getElementById('osmd-container');
        const loadingDiv = document.getElementById('loading');
        
        const osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(container, {
          autoResize: false,
          drawTitle: ${showTitle},
          drawSubtitle: false,
          drawComposer: false,
          drawLyricist: false,
          drawCredits: false,
          drawPartNames: false,
          drawPartAbbreviations: false,
          drawMeasureNumbers: false,
          drawTimeSignatures: ${showTimeSignature},
          renderSingleHorizontalStaffline: true,
          fixedMeasureWidth: ${!!fixedMeasureWidthPixels},
          followCursor: false,
          cursorsOptions: [{
            type: 3,
            color: "#4CAF50",
            alpha: 0.7,
            follow: false,
          }],
        });
        
        osmd.EngravingRules.PageBackgroundColor = "transparent";
        osmd.EngravingRules.PageLeftMargin = 1;
        osmd.EngravingRules.PageRightMargin = 0;
        osmd.EngravingRules.PageTopMargin = 0;
        osmd.EngravingRules.PageBottomMargin = 0;
        ${
          fixedMeasureWidthPixels
            ? `
        osmd.EngravingRules.FixedMeasureWidth = true;
        osmd.EngravingRules.FixedMeasureWidthFixedValue = ${fixedMeasureWidthPixels / 10};
        `
            : ""
        }
        const musicxml = \`${escapedXml}\`;
        await osmd.load(musicxml);
        osmd.zoom = ${zoom};
        osmd.render();
        
        // Listen for cursor commands from React Native
        window.osmdInstance = osmd;
        document.addEventListener('message', function(e) {
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'cursor' && osmd.cursor) {
              if (data.noteIndex === null || data.noteIndex < 0) {
                osmd.cursor.hide();
              } else {
                osmd.cursor.reset();
                osmd.cursor.show();
                for (let i = 0; i < data.noteIndex && !osmd.cursor.Iterator.EndReached; i++) {
                  osmd.cursor.next();
                }
              }
            }
          } catch (err) {}
        });
        window.addEventListener('message', function(e) {
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'cursor' && osmd.cursor) {
              if (data.noteIndex === null || data.noteIndex < 0) {
                osmd.cursor.hide();
              } else {
                osmd.cursor.reset();
                osmd.cursor.show();
                for (let i = 0; i < data.noteIndex && !osmd.cursor.Iterator.EndReached; i++) {
                  osmd.cursor.next();
                }
              }
            }
          } catch (err) {}
        });
        
        if (loadingDiv) loadingDiv.remove();
      } catch (e) {
        document.getElementById('osmd-container').innerHTML = 
          '<div id="error">Failed to render: ' + e.message + '</div>';
      }
    })();
  </script>
</body>
</html>`;
  }, [
    musicxml,
    width,
    showTitle,
    showTimeSignature,
    fixedMeasureWidthPixels,
    zoom,
  ]);

  // Update cursor position when currentNoteIndex changes (mobile WebView)
  useEffect(() => {
    if (Platform.OS === "web" || !webViewRef.current) return;

    const message = JSON.stringify({
      type: "cursor",
      noteIndex: currentNoteIndex,
    });
    webViewRef.current.postMessage(message);
  }, [currentNoteIndex]);

  // Mobile: use WebView
  if (Platform.OS !== "web") {
    if (!musicxml) {
      return (
        <View style={[styles.emptyContainer, { width, height }]}>
          <Text style={styles.emptyText}>No notation data</Text>
        </View>
      );
    }

    const WebViewComponent = WebView as React.ComponentType<{
      ref: React.RefObject<WebViewType>;
      source: { html: string };
      style: ViewStyle | ViewStyle[];
      scrollEnabled: boolean;
      showsHorizontalScrollIndicator: boolean;
      showsVerticalScrollIndicator: boolean;
      originWhitelist: string[];
      javaScriptEnabled: boolean;
      domStorageEnabled: boolean;
      mixedContentMode: "always" | "never" | "compatibility";
    }>;

    if (!WebViewComponent) {
      return (
        <View style={[styles.emptyContainer, { width, height }]}>
          <Text style={styles.emptyText}>WebView not available</Text>
        </View>
      );
    }

    return (
      <View style={[styles.webViewWrapper, { width, height }]}>
        <WebViewComponent
          ref={webViewRef as React.RefObject<WebViewType>}
          source={{ html: webviewHtml }}
          style={[styles.webView, { width, height }]}
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          originWhitelist={["*"]}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="always"
        />
      </View>
    );
  }

  // Web: use direct DOM (existing code)
  if (error) {
    return (
      <View style={[styles.errorContainer, { width }]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.mainContainer, { width, height }]}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#FFD700" />
          <Text style={styles.loadingText}>Loading notation...</Text>
        </View>
      )}
      <View
        ref={containerRef as unknown as React.RefObject<View>}
        style={[styles.notationContainer, { width, height }]}
      />
    </View>
  );
};

export default NotationDisplay;

/**
 * Simple notation placeholder when show_notation is false
 */
interface NotationPlaceholderProps {
  message?: string;
}

export const NotationPlaceholder: React.FC<NotationPlaceholderProps> = ({
  message = "Notation hidden - practice by ear",
}) => {
  return (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderIcon}>🎧</Text>
      <Text style={styles.placeholderText}>{message}</Text>
    </View>
  );
};

interface Styles {
  emptyContainer: ViewStyle;
  emptyText: TextStyle;
  webViewWrapper: ViewStyle;
  webView: ViewStyle;
  errorContainer: ViewStyle;
  errorText: TextStyle;
  mainContainer: ViewStyle;
  loadingOverlay: ViewStyle;
  loadingText: TextStyle;
  notationContainer: ViewStyle;
  placeholderContainer: ViewStyle;
  placeholderIcon: TextStyle;
  placeholderText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  // Empty/no data state
  emptyContainer: {
    backgroundColor: "#2d232e",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#5a4a3a",
  },
  emptyText: {
    color: "#666",
    fontSize: 12,
  },

  // WebView wrapper
  webViewWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  webView: {
    backgroundColor: "transparent",
  },

  // Error state
  errorContainer: {
    height: 60,
    backgroundColor: "#2d232e",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#c0392b",
  },
  errorText: {
    color: "#c0392b",
    fontSize: 12,
  },

  // Main container
  mainContainer: {
    overflow: "hidden",
    position: "relative",
  },

  // Loading overlay
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#2d232e",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingText: {
    color: "#bfa76a",
    fontSize: 12,
    marginTop: 8,
  },

  // Notation container
  notationContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "#fffbe6",
    borderRadius: 8,
    overflow: "visible",
  },

  // Placeholder component
  placeholderContainer: {
    backgroundColor: "#2d232e",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#5a4a3a",
  },
  placeholderIcon: {
    color: "#FFD700",
    fontSize: 24,
    marginBottom: 4,
  },
  placeholderText: {
    color: "#bfa76a",
    fontSize: 13,
    textAlign: "center",
  },
});

/**
 * Sample MusicXML for testing
 */
export const SAMPLE_MUSICXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Music</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>D</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>E</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>F</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
    </measure>
  </part>
</score-partwise>`;
