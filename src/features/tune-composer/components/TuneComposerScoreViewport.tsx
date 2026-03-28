/**
 * TuneComposerScoreViewport Component
 *
 * Renders the tune composer score using OpenSheetMusicDisplay (OSMD) in a WebView.
 * Extended from ComposerScoreViewport with support for:
 * - Lyrics display
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
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";
import { devLog, devError } from "../../../utils/devLogger";
import type { WebViewRef } from "../../../types/webview";
import { generateComposerOsmdHtml } from "../../composer/components/composerScoreHtml";
import { generateMusicXml } from "../services/tuneComposerMusicXmlGenerator";
import type { TuneComposerScore, Note } from "../types";
import { getNoteDuration, getBeatUnitDuration } from "../types";
import type { CursorPosition } from "../../composer/types";
import { useOptionalPlaybackContext } from "../contexts";

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

export interface TuneComposerScoreViewportProps {
  /** The score to render */
  score: TuneComposerScore;
  /** Current cursor position */
  cursor: CursorPosition;
  /** ID of selected note (for highlighting) */
  selectedNoteId?: string | null;
  /** Chord cursor position (for chord entry mode) */
  chordCursor?: { measureIndex: number; beatPosition: number } | null;
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
  /** Controlled zoom level (overrides internal state) */
  zoom?: number;
  /** Called when zoom changes (for controlled mode) */
  onZoomChange?: (zoom: number) => void;
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

function TuneComposerScoreViewportComponent({
  score,
  cursor,
  selectedNoteId,
  chordCursor,
  onNoteTap,
  onRenderComplete,
  onError,
  showZoomControls = true,
  initialZoom = 1.0,
  zoom: controlledZoom,
  onZoomChange,
  minZoom = 0.5,
  maxZoom = 2.5,
  playbackState: propPlaybackState,
  playbackMeasureIndex: propPlaybackMeasureIndex,
  onPlay: propOnPlay,
  onPause: propOnPause,
  onStop: propOnStop,
  testID,
}: TuneComposerScoreViewportProps): React.ReactElement {
  // Get playback context (optional - props take precedence)
  const playbackContext = useOptionalPlaybackContext();

  // Resolve playback values: props override context
  const playbackState =
    propPlaybackState ?? playbackContext?.playbackState ?? "stopped";
  const playbackMeasureIndex =
    propPlaybackMeasureIndex ?? playbackContext?.playbackMeasureIndex;
  const onPlay = propOnPlay ?? playbackContext?.onPlay;
  const onPause = propOnPause ?? playbackContext?.onPause;
  const onStop = propOnStop ?? playbackContext?.onStop;

  const webViewRef = useRef<WebViewRef | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const savedScrollPositionRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [internalZoom, setInternalZoom] = useState(initialZoom);
  const [measurePositions, setMeasurePositions] = useState<
    {
      measureIndex: number;
      x: number;
      width: number;
      noteStartX?: number;
      noteEndX?: number;
      beatPositions?: { beat: number; x: number }[];
    }[]
  >([]);
  const [contentWidth, setContentWidth] = useState(2000);
  const [osmdZoom, setOsmdZoom] = useState(1);
  const lastScrolledMeasureRef = useRef(-1);

  // Use controlled zoom if provided, otherwise internal state
  const zoom = controlledZoom ?? internalZoom;
  const setZoom = onZoomChange ?? setInternalZoom;

  // Calculate chord cursor x position for overlay
  const chordCursorX = useMemo(() => {
    devLog(
      "[ChordCursor] useMemo triggered, measurePositions:",
      measurePositions.length,
      "chordCursor:",
      chordCursor,
    );

    if (!chordCursor || measurePositions.length === 0) return null;

    const measurePos = measurePositions.find(
      (m) => m.measureIndex === chordCursor.measureIndex,
    );
    if (!measurePos) {
      devLog(
        "[ChordCursor] No measure position found for index:",
        chordCursor.measureIndex,
      );
      return null;
    }

    // Get x positions from OSMD
    const xPositions = measurePos.beatPositions ?? [];
    let xPosition: number;

    // Convert beat position (beat unit index) to quarter notes
    const beatUnitDuration = getBeatUnitDuration(score.timeSignature);
    const targetBeatInQuarters = chordCursor.beatPosition * beatUnitDuration;
    const beatsPerMeasure = score.timeSignature.beats;

    // Calculate beat positions from our score model (in quarter notes)
    const measure = score.measures[chordCursor.measureIndex];
    const noteBeatPositions: { beat: number; x: number }[] = [];

    if (measure && xPositions.length > 0) {
      let currentBeat = 0;
      for (let i = 0; i < measure.notes.length && i < xPositions.length; i++) {
        const note = measure.notes[i];
        const x = xPositions[i].x;
        noteBeatPositions.push({ beat: currentBeat, x });
        currentBeat += getNoteDuration(note);
      }
    }

    devLog(
      "[ChordCursor] Looking for beat index:",
      chordCursor.beatPosition,
      "in quarters:",
      targetBeatInQuarters,
      "beatUnitDuration:",
      beatUnitDuration,
      "beatsPerMeasure:",
      beatsPerMeasure,
      "Note positions:",
      JSON.stringify(noteBeatPositions),
    );

    // Total measure duration in quarter notes
    const measureDurationInQuarters = beatsPerMeasure * beatUnitDuration;

    if (noteBeatPositions.length === 0) {
      // No notes - use proportional fallback
      const noteStartX = measurePos.noteStartX ?? measurePos.x + 50;
      const measureWidth = measurePos.width ?? 100;
      xPosition =
        noteStartX +
        (targetBeatInQuarters / measureDurationInQuarters) * measureWidth;
    } else {
      // Find exact match first (comparing in quarter notes)
      const exactMatch = noteBeatPositions.find(
        (bp) => Math.abs(bp.beat - targetBeatInQuarters) < 0.01,
      );

      if (exactMatch) {
        // Target beat has a note - cursor falls directly on it
        xPosition = exactMatch.x;
        devLog(
          "[ChordCursor] Exact match at beat",
          targetBeatInQuarters,
          "x:",
          xPosition,
        );
      } else {
        // Find surrounding notes and interpolate
        const before = noteBeatPositions
          .filter((bp) => bp.beat < targetBeatInQuarters)
          .pop();
        const after = noteBeatPositions.find(
          (bp) => bp.beat > targetBeatInQuarters,
        );

        devLog(
          "[ChordCursor] Interpolating - before:",
          before,
          "after:",
          after,
        );

        if (before && after) {
          // Interpolate between the two surrounding notes
          const beatRange = after.beat - before.beat;
          const beatOffset = targetBeatInQuarters - before.beat;
          const fraction = beatOffset / beatRange;
          xPosition = before.x + fraction * (after.x - before.x);
        } else if (before) {
          // Target is after all notes - extrapolate using note spacing
          const beatsAfterLastNote = targetBeatInQuarters - before.beat;

          if (noteBeatPositions.length >= 2) {
            // Use spacing from existing notes to extrapolate
            const firstNote = noteBeatPositions[0];
            const lastNote = noteBeatPositions[noteBeatPositions.length - 1];
            const totalNoteBeatSpan = lastNote.beat - firstNote.beat;
            const totalNoteXSpan = lastNote.x - firstNote.x;

            if (totalNoteBeatSpan > 0) {
              const pixelsPerBeat = totalNoteXSpan / totalNoteBeatSpan;
              xPosition = before.x + beatsAfterLastNote * pixelsPerBeat;
            } else {
              // All notes at same beat - use measure width estimate
              const estimatedPixelsPerBeat =
                (measurePos.width ?? 100) / measureDurationInQuarters;
              xPosition =
                before.x + beatsAfterLastNote * estimatedPixelsPerBeat;
            }
          } else {
            // Only one note - estimate spacing from measure width
            const estimatedPixelsPerBeat =
              (measurePos.width ?? 100) / measureDurationInQuarters;
            xPosition = before.x + beatsAfterLastNote * estimatedPixelsPerBeat;
          }

          devLog(
            "[ChordCursor] Extrapolating after last note - lastNoteBeat:",
            before.beat,
            "targetBeat:",
            targetBeatInQuarters,
            "beatsAfter:",
            beatsAfterLastNote,
            "x:",
            xPosition,
          );
        } else if (after) {
          // Target is before all notes (shouldn't happen normally)
          if (noteBeatPositions.length >= 2) {
            const firstTwo = noteBeatPositions.slice(0, 2);
            const beatRange = firstTwo[1].beat - firstTwo[0].beat;
            if (beatRange > 0) {
              const spacingPerBeat =
                (firstTwo[1].x - firstTwo[0].x) / beatRange;
              xPosition =
                after.x - (after.beat - targetBeatInQuarters) * spacingPerBeat;
            } else {
              const measureWidth = measurePos.width ?? 100;
              xPosition =
                after.x -
                ((after.beat - targetBeatInQuarters) /
                  measureDurationInQuarters) *
                  measureWidth;
            }
          } else {
            const measureWidth = measurePos.width ?? 100;
            xPosition =
              after.x -
              ((after.beat - targetBeatInQuarters) /
                measureDurationInQuarters) *
                measureWidth;
          }
        } else {
          xPosition = measurePos.noteStartX ?? measurePos.x + 50;
        }
      }
    }

    devLog(
      "[ChordCursor] Calculated position - beat index:",
      chordCursor.beatPosition,
      "in quarters:",
      targetBeatInQuarters,
      "x:",
      xPosition,
    );

    const result = xPosition * osmdZoom;

    devLog("[ChordCursor] Final position:", {
      measure: chordCursor.measureIndex,
      beat: chordCursor.beatPosition,
      xPosition,
      result,
    });

    return result;
  }, [
    chordCursor?.measureIndex,
    chordCursor?.beatPosition,
    measurePositions,
    score.measures,
    score.timeSignature.beats,
    osmdZoom,
  ]);

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
      // Scroll position is tracked via onScroll handler and restored in "rendered" message handler
      const escapedXml = musicXml.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
      executeScript(`window.renderMusicXML(\`${escapedXml}\`)`);
    }
  }, [isReady, musicXml, executeScript]);

  // Scroll the parent ScrollView during playback
  useEffect(() => {
    if (playbackState === "playing" && playbackMeasureIndex !== undefined) {
      // Skip if we've already scrolled to this measure
      if (playbackMeasureIndex === lastScrolledMeasureRef.current) return;
      lastScrolledMeasureRef.current = playbackMeasureIndex;

      // Find the position for this measure
      const measurePos = measurePositions.find(
        (m) => m.measureIndex === playbackMeasureIndex,
      );
      if (measurePos && scrollViewRef.current) {
        // Calculate scroll position - keep measure ~15% from left edge
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

  // Scroll to cursor when not playing (for editing)
  useEffect(() => {
    if (playbackState === "playing") return;

    const measurePos = measurePositions.find(
      (m) => m.measureIndex === cursor.measureIndex,
    );
    if (measurePos && scrollViewRef.current) {
      const scrollX = measurePos.x * osmdZoom - 50;
      scrollViewRef.current.scrollTo({
        x: Math.max(0, scrollX),
        animated: false,
      });
    }
  }, [cursor.measureIndex, playbackState, measurePositions, osmdZoom]);

  // Scroll to chord cursor when in chord entry mode
  useEffect(() => {
    if (!chordCursor || playbackState === "playing") return;

    const measurePos = measurePositions.find(
      (m) => m.measureIndex === chordCursor.measureIndex,
    );
    if (measurePos && scrollViewRef.current) {
      // Calculate position with beat offset
      const beatsPerMeasure = score.timeSignature.beats;
      const beatFraction = chordCursor.beatPosition / beatsPerMeasure;
      const xInMeasure = measurePos.x + beatFraction * measurePos.width;
      const scrollX = xInMeasure * osmdZoom - 80; // Keep cursor centered-ish
      scrollViewRef.current.scrollTo({
        x: Math.max(0, scrollX),
        animated: true,
      });
    }
  }, [
    chordCursor,
    playbackState,
    measurePositions,
    osmdZoom,
    score.timeSignature.beats,
  ]);

  // Apply zoom when controlled zoom changes
  useEffect(() => {
    if (isReady && controlledZoom !== undefined) {
      executeScript(`window.setZoom(${controlledZoom})`);
    }
  }, [isReady, controlledZoom, executeScript]);

  // Track scroll position so we can restore it after re-render
  const handleScroll = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      savedScrollPositionRef.current = event.nativeEvent.contentOffset.x;
    },
    [],
  );

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
            // Restore scroll position after render if we saved one
            if (savedScrollPositionRef.current !== null && scrollViewRef.current) {
              scrollViewRef.current.scrollTo({
                x: savedScrollPositionRef.current,
                animated: false,
              });
              savedScrollPositionRef.current = null;
            }
            onRenderComplete?.();
            break;

          case "measurePositions": {
            const {
              positions,
              contentWidth: width,
              zoom: reportedZoom,
            } = data.payload as {
              positions: {
                measureIndex: number;
                x: number;
                width: number;
                noteStartX?: number;
                noteEndX?: number;
                beatPositions?: { beat: number; x: number }[];
              }[];
              contentWidth: number;
              zoom: number;
            };
            devLog("[MeasurePositions] Received:", JSON.stringify(positions));
            devLog(
              "[MeasurePositions] Measure 0 beatPositions:",
              positions[0]?.beatPositions,
            );
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

          case "consoleLog": {
            // Debug logging from WebView
            const log = data.payload as { level: string; message: string };
            if (__DEV__) {
              if (log.level === "error") {
                devError("[OSMD]", log.message);
              } else {
                devLog("[OSMD]", log.message);
              }
            }
            break;
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    },
    [onNoteTap, onRenderComplete, onError, executeScript],
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
      {/* Score viewport with parent scrolling */}
      <View style={styles.viewportContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator
          style={styles.scrollView}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            width: contentWidth * osmdZoom,
            height: "100%",
          }}
        >
          {/* Wrapper for WebView + chord cursor overlay */}
          <View
            style={{
              width: contentWidth * osmdZoom,
              height: "100%",
              position: "relative",
            }}
          >
            {Platform.OS === "web" ? (
              <iframe
                ref={iframeRef as React.RefObject<HTMLIFrameElement>}
                srcDoc={html}
                style={{
                  width: contentWidth * osmdZoom,
                  height: "100%",
                  border: "none",
                  backgroundColor: "white",
                }}
                sandbox="allow-scripts"
              />
            ) : WebView ? (
              <WebView
                ref={
                  webViewRef as React.RefObject<InstanceType<typeof WebView>>
                }
                source={{ html }}
                style={[styles.webView, { width: contentWidth * osmdZoom }]}
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

            {/* Chord cursor overlay - shows beat position for chord entry */}
            {chordCursorX !== null && (
              <View
                style={[styles.chordCursorOverlay, { left: chordCursorX }]}
                pointerEvents="none"
                testID="chord-cursor-overlay"
              >
                <View style={styles.chordCursorLine} />
                <View style={styles.chordCursorDiamond} />
              </View>
            )}
          </View>
        </ScrollView>

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
  scrollView: {
    flex: 1,
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
  chordCursorOverlay: {
    position: "absolute",
    top: 10,
    bottom: 40,
    width: 20,
    alignItems: "center",
    zIndex: 10,
  },
  chordCursorLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.primary,
    opacity: 0.8,
  },
  chordCursorDiamond: {
    position: "absolute",
    top: -6,
    width: 12,
    height: 12,
    backgroundColor: colors.primary,
    transform: [{ rotate: "45deg" }],
    borderRadius: 2,
  },
});

// =============================================================================
// Export
// =============================================================================

// Note: Not using memo for now to ensure chordCursor prop changes trigger re-render
export const TuneComposerScoreViewport = TuneComposerScoreViewportComponent;
