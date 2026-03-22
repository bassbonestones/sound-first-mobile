/**
 * ScoreViewport Component
 *
 * Reusable score display using OpenSheetMusicDisplay (OSMD).
 * Used by both Composer and GenerationPreviewScreen.
 *
 * Features:
 * - MusicXML rendering via WebView/iframe
 * - Horizontal scrolling
 * - Note highlighting via CSS color attribute
 * - Playback measure auto-scroll
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
  Platform,
  ScrollView,
} from "react-native";

import { colors } from "../constants";

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

export interface ScoreViewportProps {
  /** MusicXML string to render */
  musicXml: string;
  /** Height of the viewport */
  height?: number;
  /** Fixed width for horizontal scrolling (default: 1200) */
  fixedWidth?: number;
  /** Initial zoom level */
  initialZoom?: number;
  /** Playback state: stopped, playing, paused */
  playbackState?: "stopped" | "playing" | "paused";
  /** Current playback measure index (for auto-scroll during playback) */
  playbackMeasureIndex?: number;
  /** Index of note to highlight (0-based, for playback cursor) */
  highlightedNoteIndex?: number;
  /** Called when rendering completes */
  onRenderComplete?: () => void;
  /** Called on error */
  onError?: (error: string) => void;
  /** Test ID for testing */
  testID?: string;
}

interface WebViewMessage {
  type: string;
  payload?: unknown;
}

// =============================================================================
// HTML Generator (inline for simplicity, mirrors composerScoreHtml)
// =============================================================================

function generateScoreHtml(options: {
  initialZoom: number;
  fixedWidth: number;
}): string {
  const { initialZoom, fixedWidth } = options;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Score Display</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html, body {
      width: 100%;
      height: 100%;
      overflow: visible;
      background-color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    #container {
      width: fit-content;
      min-width: ${fixedWidth}px;
      height: 100%;
      overflow: visible;
    }
    
    #osmd-container {
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    
    .loading {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      padding: 20px;
      text-align: center;
      color: #666;
    }
    
    .error {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      padding: 20px;
      text-align: center;
      color: #d32f2f;
    }

    /* Highlight for playing notes */
    .highlighted-note {
      fill: #0066CC !important;
      stroke: #0066CC !important;
    }
  </style>
</head>
<body>
  <div id="container">
    <div id="osmd-container">
      <div class="loading" id="loading">Loading...</div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.8.6/build/opensheetmusicdisplay.min.js"></script>

  <script>
    let osmd = null;
    let currentZoom = ${initialZoom};
    let measurePositionsCache = [];

    function sendMessage(type, payload) {
      const message = JSON.stringify({ type, payload });
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(message);
      } else if (window.parent !== window) {
        window.parent.postMessage(message, '*');
      }
    }

    window.addEventListener('message', function(event) {
      if (event.data && typeof event.data === 'object' && event.data.type === 'execute') {
        try {
          eval(event.data.script);
        } catch (e) {
          console.error('Script execution error:', e);
        }
      }
    });

    async function initOSMD() {
      const container = document.getElementById('osmd-container');
      const loading = document.getElementById('loading');

      try {
        osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(container, {
          autoResize: false,
          drawTitle: true,
          drawSubtitle: false,
          drawComposer: false,
          drawLyricist: false,
          drawCredits: false,
          drawPartNames: false,
          drawPartAbbreviations: false,
          drawMeasureNumbers: false,
          drawTimeSignatures: true,
          renderSingleHorizontalStaffline: true,
          followCursor: false,
        });

        osmd.EngravingRules.PageBackgroundColor = 'transparent';
        osmd.EngravingRules.PageLeftMargin = 2;
        osmd.EngravingRules.PageRightMargin = 2;
        osmd.EngravingRules.PageTopMargin = 1;
        osmd.EngravingRules.PageBottomMargin = 1;

        loading.style.display = 'none';
        sendMessage('ready');
      } catch (e) {
        loading.innerHTML = '<div class="error">Failed to load notation library</div>';
        sendMessage('error', 'Failed to initialize OSMD: ' + e.message);
      }
    }

    window.renderMusicXML = async function(musicxml) {
      if (!osmd) return;

      try {
        await osmd.load(musicxml);
        osmd.zoom = currentZoom;
        osmd.render();

        // Calculate measure positions for auto-scroll
        calculateMeasurePositions();

        sendMessage('rendered');
      } catch (e) {
        console.error('Render error:', e);
        sendMessage('error', 'Failed to render: ' + e.message);
      }
    };

    window.setZoom = function(zoom) {
      currentZoom = zoom;
      if (osmd && osmd.IsReadyToRender) {
        osmd.zoom = zoom;
        osmd.render();
        calculateMeasurePositions();
      }
    };

    function calculateMeasurePositions() {
      measurePositionsCache = [];
      if (!osmd || !osmd.graphic) return;

      try {
        const measureList = osmd.graphic.measureList;
        for (let i = 0; i < measureList.length; i++) {
          const measureStaves = measureList[i];
          if (measureStaves && measureStaves.length > 0) {
            const stave = measureStaves[0];
            if (stave && stave.stave) {
              measurePositionsCache.push({
                measureIndex: i,
                x: stave.stave.x,
                width: stave.stave.width,
              });
            }
          }
        }

        const svg = document.querySelector('svg');
        const contentWidth = svg ? svg.getBoundingClientRect().width : ${fixedWidth};

        sendMessage('measurePositions', {
          positions: measurePositionsCache,
          contentWidth: contentWidth,
          zoom: currentZoom,
        });
      } catch (e) {
        console.error('Error calculating measure positions:', e);
      }
    }

    // Highlight a note by index (0-based)
    window.highlightNote = function(noteIndex) {
      if (!osmd || !osmd.graphic) return;
      
      try {
        const svg = document.querySelector('svg');
        if (!svg) return;
        
        // Clear previous highlights
        svg.querySelectorAll('.highlighted-note').forEach(el => {
          el.classList.remove('highlighted-note');
        });
        
        if (noteIndex === null || noteIndex === undefined || noteIndex < 0) return;
        
        // Method 1: Try to find VexFlow note elements directly from OSMD's graphic
        let currentNoteIdx = 0;
        const measureList = osmd.graphic.measureList;
        
        for (let m = 0; m < measureList.length; m++) {
          const measureStaves = measureList[m];
          if (!measureStaves || measureStaves.length === 0) continue;
          
          const graphicalMeasure = measureStaves[0];
          if (!graphicalMeasure || !graphicalMeasure.staffEntries) continue;
          
          for (let s = 0; s < graphicalMeasure.staffEntries.length; s++) {
            const staffEntry = graphicalMeasure.staffEntries[s];
            if (!staffEntry || !staffEntry.graphicalVoiceEntries) continue;
            
            for (let v = 0; v < staffEntry.graphicalVoiceEntries.length; v++) {
              const voiceEntry = staffEntry.graphicalVoiceEntries[v];
              if (!voiceEntry || !voiceEntry.notes) continue;
              
              for (let n = 0; n < voiceEntry.notes.length; n++) {
                const note = voiceEntry.notes[n];
                // Skip rests
                if (note.sourceNote && note.sourceNote.isRest && note.sourceNote.isRest()) {
                  currentNoteIdx++;
                  continue;
                }
                
                if (currentNoteIdx === noteIndex) {
                  // Try multiple paths to find the SVG element
                  let el = null;
                  
                  // Path 1: VexFlow note via vfnote
                  if (note.vfnote && note.vfnote[0]) {
                    const vfNote = note.vfnote[0];
                    if (vfNote.attrs && vfNote.attrs.el) {
                      el = vfNote.attrs.el;
                    } else if (vfNote.getAttribute) {
                      // Some VexFlow versions use different structure
                      el = vfNote;
                    }
                  }
                  
                  // Path 2: Try getting element via OSMD's getSVGGElement
                  if (!el && note.getSVGGElement) {
                    el = note.getSVGGElement();
                  }
                  
                  if (el) {
                    el.classList.add('highlighted-note');
                    // Highlight all child elements too
                    el.querySelectorAll('*').forEach(child => {
                      child.classList.add('highlighted-note');
                    });
                  }
                  return;
                }
                currentNoteIdx++;
              }
            }
          }
        }
        
        // Method 2 fallback: Find note by index among all vf-stavenote elements
        // This is less reliable but may work if OSMD structure is different
        const staveNotes = svg.querySelectorAll('.vf-stavenote');
        if (staveNotes.length > noteIndex) {
          const el = staveNotes[noteIndex];
          el.classList.add('highlighted-note');
          el.querySelectorAll('*').forEach(child => {
            child.classList.add('highlighted-note');
          });
        }
      } catch (e) {
        console.error('Error highlighting note:', e);
      }
    };

    initOSMD();
  </script>
</body>
</html>
`;
}

// =============================================================================
// Component
// =============================================================================

function ScoreViewportComponent({
  musicXml,
  height = 200,
  fixedWidth = 1200,
  initialZoom = 1.0,
  playbackState = "stopped",
  playbackMeasureIndex,
  highlightedNoteIndex,
  onRenderComplete,
  onError,
  testID,
}: ScoreViewportProps): React.ReactElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const webViewRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [measurePositions, setMeasurePositions] = useState<
    { measureIndex: number; x: number; width: number }[]
  >([]);
  const [contentWidth, setContentWidth] = useState(fixedWidth);
  const [osmdZoom, setOsmdZoom] = useState(initialZoom);
  const lastScrolledMeasureRef = useRef(-1);

  // Generate HTML for WebView
  const html = useMemo(() => {
    return generateScoreHtml({ initialZoom, fixedWidth });
  }, [initialZoom, fixedWidth]);

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

  // Highlight note during playback
  useEffect(() => {
    if (isReady) {
      const index = highlightedNoteIndex ?? -1;
      executeScript(`window.highlightNote(${index})`);
    }
  }, [isReady, highlightedNoteIndex, executeScript]);

  // Scroll during playback
  useEffect(() => {
    if (playbackState === "playing" && playbackMeasureIndex !== undefined) {
      if (playbackMeasureIndex === lastScrolledMeasureRef.current) return;
      lastScrolledMeasureRef.current = playbackMeasureIndex;

      const measurePos = measurePositions.find(
        (m) => m.measureIndex === playbackMeasureIndex,
      );
      if (measurePos && scrollViewRef.current) {
        const scrollX = measurePos.x * osmdZoom - 50;
        scrollViewRef.current.scrollTo({
          x: Math.max(0, scrollX),
          animated: true,
        });
      }
    } else if (playbackState === "stopped") {
      lastScrolledMeasureRef.current = -1;
    }
  }, [playbackState, playbackMeasureIndex, measurePositions, osmdZoom]);

  // Handle messages from WebView
  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } } | MessageEvent) => {
      try {
        let data: WebViewMessage;
        if ("nativeEvent" in event) {
          data = JSON.parse(event.nativeEvent.data);
        } else {
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

          case "measurePositions": {
            const {
              positions,
              contentWidth: width,
              zoom: reportedZoom,
            } = data.payload as {
              positions: { measureIndex: number; x: number; width: number }[];
              contentWidth: number;
              zoom: number;
            };
            setMeasurePositions(positions);
            setContentWidth(width);
            setOsmdZoom(reportedZoom);
            break;
          }

          case "error":
            setError(data.payload as string);
            setIsLoading(false);
            onError?.(data.payload as string);
            break;
        }
      } catch {
        // Ignore parse errors
      }
    },
    [onRenderComplete, onError],
  );

  // Web iframe message listener
  useEffect(() => {
    if (Platform.OS === "web") {
      const listener = (event: MessageEvent) => {
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

  // Render error state
  if (error) {
    return (
      <View style={[styles.container, { height }]} testID={testID}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]} testID={testID}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator
        style={styles.scrollView}
        contentContainerStyle={{ minWidth: Math.max(fixedWidth, contentWidth) }}
      >
        {Platform.OS === "web" ? (
          <iframe
            ref={iframeRef as React.RefObject<HTMLIFrameElement>}
            srcDoc={html}
            style={{
              width: Math.max(fixedWidth, contentWidth),
              height: height,
              border: "none",
              backgroundColor: "white",
            }}
            sandbox="allow-scripts"
          />
        ) : WebView ? (
          <WebView
            ref={webViewRef as React.RefObject<InstanceType<typeof WebView>>}
            source={{ html }}
            style={[
              styles.webView,
              { width: Math.max(fixedWidth, contentWidth), height: height },
            ]}
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            onMessage={handleMessage}
            onError={() => {
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
      </ScrollView>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Rendering...</Text>
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
    backgroundColor: "#ffffff",
    borderRadius: 8,
    overflow: "hidden",
  },
  scrollView: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: "center",
  },
  noWebView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noWebViewText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
});

// =============================================================================
// Export
// =============================================================================

export const ScoreViewport = memo(ScoreViewportComponent);
export default ScoreViewport;
