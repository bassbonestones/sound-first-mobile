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
import { devError } from "../../../utils/devLogger";
import type { WebViewRef } from "../../../types/webview";
import { generateComposerOsmdHtml } from "../../composer/components/composerScoreHtml";
import {
  generateMusicXml,
  applyOsmdPickupWorkaround,
} from "../services/tuneComposerMusicXmlGenerator";
import type { TuneComposerScore, Note } from "../types";
import {
  getNoteDuration,
  getBeatUnitDuration,
  getMeasureDuration,
  getDefaultProgression,
} from "../types";
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
  /** Lyrics cursor position (for lyrics entry mode) - converted to measure/note position */
  lyricsCursorPosition?: CursorPosition | null;
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
  /** Current playback note index within measure (for scroll checking on every note) */
  playbackNoteIndex?: number;
  /** Current playback beat position within measure */
  playbackBeat?: number;
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
  lyricsCursorPosition,
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
  playbackNoteIndex: propPlaybackNoteIndex,
  playbackBeat: propPlaybackBeat,
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
  const playbackNoteIndex = propPlaybackNoteIndex;
  const playbackBeat = propPlaybackBeat;
  const onPlay = propOnPlay ?? playbackContext?.onPlay;
  const onPause = propOnPause ?? playbackContext?.onPause;
  const onStop = propOnStop ?? playbackContext?.onStop;

  const webViewRef = useRef<WebViewRef | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const currentScrollXRef = useRef<number>(0);
  const prevCursorRef = useRef<{ measureIndex: number; noteIndex: number }>({
    measureIndex: 0,
    noteIndex: 0,
  });
  const prevChordCursorRef = useRef<{
    measureIndex: number;
    beatPosition: number;
  } | null>(null);
  const prevLyricsCursorRef = useRef<{
    measureIndex: number;
    noteIndex: number;
  } | null>(null);
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
      barlineX?: number;
      beatPositions?: { beat: number; x: number }[];
    }[]
  >([]);
  const [contentWidth, setContentWidth] = useState(2000);
  const [osmdZoom, setOsmdZoom] = useState(1);
  // Track scroll position as state so chord cursor overlay re-renders during scroll
  const [scrollX, setScrollX] = useState(0);
  const viewportWidthRef = useRef(400);
  // Refs for values used in playback scroll effect (to avoid dependency on state changes)
  const measurePositionsRef = useRef(measurePositions);
  const osmdZoomRef = useRef(osmdZoom);
  measurePositionsRef.current = measurePositions;
  osmdZoomRef.current = osmdZoom;

  // Use controlled zoom if provided, otherwise internal state
  const zoom = controlledZoom ?? internalZoom;
  const setZoom = onZoomChange ?? setInternalZoom;

  // Calculate chord cursor x position for overlay
  const chordCursorX = useMemo(() => {
    if (!chordCursor || measurePositions.length === 0) return null;

    const measurePos = measurePositions.find(
      (m) => m.measureIndex === chordCursor.measureIndex,
    );
    if (!measurePos) {
      return null;
    }

    // Get next measure's position to find the barline
    const nextMeasurePos = measurePositions.find(
      (m) => m.measureIndex === chordCursor.measureIndex + 1,
    );

    // Get X positions from OSMD (one per note, in order)
    const osmdPositions = measurePos.beatPositions ?? [];
    let xPosition: number;

    // Convert beat position (beat unit index) to quarter notes
    const beatUnitDuration = getBeatUnitDuration(score.timeSignature);
    const targetBeatInQuarters = chordCursor.beatPosition * beatUnitDuration;
    const beatsPerMeasure = score.timeSignature.beats;

    const measure = score.measures[chordCursor.measureIndex];

    // Total measure duration in quarter notes
    const measureDurationInQuarters = beatsPerMeasure * beatUnitDuration;

    // For pickup measures, use actual duration
    const actualMeasureDuration = measure?.isPickup
      ? (score.pickupDuration ?? getMeasureDuration(measure))
      : measureDurationInQuarters;

    // Use OSMD's beat positions directly - they already have correct beat values
    // and X positions from the rendered score
    const noteBeatPositions: { beat: number; x: number }[] = [];

    if (osmdPositions.length > 0) {
      // OSMD positions are already sorted by X and have correct beat values
      for (const pos of osmdPositions) {
        noteBeatPositions.push({ beat: pos.beat, x: pos.x });
      }

      // Add a virtual endpoint at the measure end (barline position)
      // Next measure's X position IS the barline position
      const measureEndBeat = actualMeasureDuration;
      let barlineX: number;

      if (nextMeasurePos) {
        // Next measure starts at the barline - use with small margin
        barlineX = nextMeasurePos.x - 10;
      } else if (noteBeatPositions.length >= 2) {
        // Last measure - extrapolate using spacing between last two notes
        const lastTwo = noteBeatPositions.slice(-2);
        const beatRange = lastTwo[1].beat - lastTwo[0].beat;
        const spacingPerBeat =
          beatRange > 0 ? (lastTwo[1].x - lastTwo[0].x) / beatRange : 30; // fallback spacing
        const remainingBeats = measureEndBeat - lastTwo[1].beat;
        barlineX = lastTwo[1].x + remainingBeats * spacingPerBeat;
      } else {
        // Fallback
        barlineX = measurePos.x + (measurePos.width ?? 100);
      }

      noteBeatPositions.push({ beat: measureEndBeat, x: barlineX });

      // DEBUG: Log barline calculation
      console.log("[ChordCursor] Barline debug:", {
        measureIndex: chordCursor.measureIndex,
        targetBeat: chordCursor.beatPosition,
        nextMeasureX: nextMeasurePos?.x,
        barlineX,
        lastNoteX: noteBeatPositions[noteBeatPositions.length - 2]?.x,
        lastNoteBeat: noteBeatPositions[noteBeatPositions.length - 2]?.beat,
        allPositions: noteBeatPositions.map((p) => ({
          beat: p.beat.toFixed(2),
          x: Math.round(p.x),
        })),
      });
    }

    if (noteBeatPositions.length === 0) {
      // No notes - use proportional fallback
      const noteStartX = measurePos.noteStartX ?? measurePos.x + 50;
      const measureWidth = measurePos.width ?? 100;
      xPosition =
        noteStartX +
        (targetBeatInQuarters / actualMeasureDuration) * measureWidth;
    } else {
      // Find exact match first (comparing in quarter notes)
      const exactMatch = noteBeatPositions.find(
        (bp) => Math.abs(bp.beat - targetBeatInQuarters) < 0.01,
      );

      if (exactMatch) {
        // Target beat has a note - cursor falls directly on it
        xPosition = exactMatch.x;
      } else {
        // Find surrounding notes and interpolate
        const before = noteBeatPositions
          .filter((bp) => bp.beat < targetBeatInQuarters)
          .pop();
        const after = noteBeatPositions.find(
          (bp) => bp.beat > targetBeatInQuarters,
        );

        if (before && after) {
          // Interpolate between the two surrounding positions (notes or barline)
          const beatRange = after.beat - before.beat;
          const beatOffset = targetBeatInQuarters - before.beat;
          const fraction = beatOffset / beatRange;
          xPosition = before.x + fraction * (after.x - before.x);

          // DEBUG: Log interpolation when near barline
          const isNearBarline = after.beat === actualMeasureDuration;
          if (isNearBarline) {
            console.log("[ChordCursor] Barline interpolation:", {
              targetBeatInQuarters,
              beforeBeat: before.beat,
              afterBeat: after.beat,
              beforeX: before.x,
              afterX: after.x,
              beatRange,
              beatOffset,
              fraction: fraction.toFixed(3),
              resultX: xPosition,
            });
          }
        } else if (before) {
          // Fallback: target is past the measure end (shouldn't happen with virtual endpoint)
          xPosition = before.x;
        } else if (after) {
          // Target is before all notes - extrapolate backwards
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

    const result = xPosition * osmdZoom;
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

  // Send chord positions to WebView after measure positions are available
  // This fixes OSMD's bug of rendering all chords at measure start
  useEffect(() => {
    if (!isReady || measurePositions.length === 0) return;

    // Get default chord progression
    const progression = getDefaultProgression(score.chordProgressions);
    // console.log(
    //   "[ChordReposition] Progression:",
    //   progression?.name,
    //   "chords:",
    //   progression?.chords.length,
    // );
    if (!progression || progression.chords.length === 0) return;

    // Find the last measure with chords for repositioning logic
    const lastMeasureWithChords = Math.max(
      ...progression.chords.map((c) => c.measureIndex),
    );

    // Calculate X positions for each chord
    const chordPositions: {
      measureIndex: number;
      beatPosition: number;
      x: number;
      needsRepositioning: boolean;
    }[] = [];
    const beatUnitDuration = getBeatUnitDuration(score.timeSignature);
    const beatsPerMeasure = score.timeSignature.beats;
    const measureDurationInQuarters = beatsPerMeasure * beatUnitDuration;

    for (const chord of progression.chords) {
      const measurePos = measurePositions.find(
        (m) => m.measureIndex === chord.measureIndex,
      );
      if (!measurePos) {
        // console.log(
        //   "[ChordReposition] No measurePos for measure",
        //   chord.measureIndex,
        // );
        continue;
      }

      // Get next measure for barline position
      const nextMeasurePos = measurePositions.find(
        (m) => m.measureIndex === chord.measureIndex + 1,
      );

      // Convert beat position (beat unit index) to quarter notes
      const targetBeatInQuarters = chord.beatPosition * beatUnitDuration;

      const measure = score.measures[chord.measureIndex];
      const osmdPositions = measurePos.beatPositions ?? [];

      // For pickup measures, use actual duration
      const actualMeasureDuration = measure?.isPickup
        ? (score.pickupDuration ?? getMeasureDuration(measure))
        : measureDurationInQuarters;

      // Build beat positions - use OSMD's beat values if they look valid,
      // otherwise fall back to calculating from the score model
      const noteBeatPositions: { beat: number; x: number }[] = [];

      if (osmdPositions.length > 0) {
        // Check if OSMD's beat values are valid (have distinct values)
        const distinctBeats = new Set(
          osmdPositions.map((p) => Math.round(p.beat * 100)),
        );
        const useOsmdBeats = distinctBeats.size >= osmdPositions.length;

        if (useOsmdBeats) {
          // OSMD beat values are valid - use them directly
          for (const pos of osmdPositions) {
            noteBeatPositions.push({ beat: pos.beat, x: pos.x });
          }
        } else if (measure) {
          // Fall back to calculating beats from score model
          let currentBeat = 0;
          const noteCount = Math.min(measure.notes.length, osmdPositions.length);
          for (let i = 0; i < noteCount; i++) {
            const note = measure.notes[i];
            const x = osmdPositions[i].x;
            noteBeatPositions.push({ beat: currentBeat, x });
            currentBeat += getNoteDuration(note);
          }
        }

        // Add endpoint at barline
        const measureEndBeat = actualMeasureDuration;
        let barlineX: number;

        if (nextMeasurePos) {
          barlineX = nextMeasurePos.x - 10;
        } else if (noteBeatPositions.length >= 2) {
          const lastTwo = noteBeatPositions.slice(-2);
          const beatRange = lastTwo[1].beat - lastTwo[0].beat;
          const spacingPerBeat =
            beatRange > 0 ? (lastTwo[1].x - lastTwo[0].x) / beatRange : 30;
          const remainingBeats = measureEndBeat - lastTwo[1].beat;
          barlineX = lastTwo[1].x + remainingBeats * spacingPerBeat;
        } else {
          barlineX = measurePos.x + (measurePos.width ?? 100);
        }

        noteBeatPositions.push({ beat: measureEndBeat, x: barlineX });
      }

      // Calculate X position for this chord's beat (same logic as chordCursorX)
      let xPosition: number | null = null;

      if (noteBeatPositions.length >= 2) {
        // Interpolate between beat positions
        for (let i = 0; i < noteBeatPositions.length - 1; i++) {
          const bp1 = noteBeatPositions[i];
          const bp2 = noteBeatPositions[i + 1];
          if (
            targetBeatInQuarters >= bp1.beat &&
            targetBeatInQuarters <= bp2.beat
          ) {
            const beatRange = bp2.beat - bp1.beat;
            if (beatRange > 0) {
              const fraction = (targetBeatInQuarters - bp1.beat) / beatRange;
              xPosition = bp1.x + fraction * (bp2.x - bp1.x);
            }
            break;
          }
        }

        // If before first position, use first
        if (
          xPosition === null &&
          targetBeatInQuarters <= noteBeatPositions[0].beat
        ) {
          xPosition = noteBeatPositions[0].x;
        }

        // If after last position, extrapolate
        if (
          xPosition === null &&
          targetBeatInQuarters >
            noteBeatPositions[noteBeatPositions.length - 1].beat
        ) {
          const lastTwo = noteBeatPositions.slice(-2);
          const beatRange = lastTwo[1].beat - lastTwo[0].beat;
          if (beatRange > 0) {
            const spacingPerBeat = (lastTwo[1].x - lastTwo[0].x) / beatRange;
            xPosition =
              lastTwo[1].x +
              (targetBeatInQuarters - lastTwo[1].beat) * spacingPerBeat;
          }
        }
      }

      // Fallback - use first note position
      if (xPosition === null) {
        xPosition = measurePos.noteStartX ?? measurePos.x + 50;
      }

      // Check if this chord needs repositioning:
      // 1. Last measure always uses interleaving (OSMD workaround)
      // 2. Mid-note chords: OSMD places at forward position, ignoring offset
      const isLastMeasure = chord.measureIndex === lastMeasureWithChords;
      const isMidNoteChord = !noteBeatPositions.some(
        (bp) => Math.abs(bp.beat - targetBeatInQuarters) < 0.001,
      );

      // Convert to OSMD units (divide by 10 since OSMD multiplies by 10)
      chordPositions.push({
        measureIndex: chord.measureIndex,
        beatPosition: chord.beatPosition,
        x: xPosition / 10,
        needsRepositioning: isLastMeasure || isMidNoteChord,
      });
      // console.log(
      //   `[ChordReposition] Chord m${chord.measureIndex} beat${chord.beatPosition} -> x=${(xPosition / 10).toFixed(1)}`,
      // );
    }

    // Send to WebView
    if (chordPositions.length > 0) {
      // console.log(
      //   "[ChordReposition] Sending",
      //   chordPositions.length,
      //   "positions to WebView",
      // );
      const json = JSON.stringify(chordPositions);
      executeScript(`window.repositionChordSymbols(${json})`);
    }
  }, [
    isReady,
    measurePositions,
    score.chordProgressions,
    score.measures,
    score.timeSignature,
    score.pickupDuration,
    executeScript,
  ]);

  // Render MusicXML when ready
  useEffect(() => {
    if (isReady && musicXml) {
      // Apply OSMD pickup measure workaround for metronome rendering
      const xmlForOsmd = applyOsmdPickupWorkaround(musicXml);

      // Scroll position is tracked via onScroll handler and restored in "rendered" message handler
      const escapedXml = xmlForOsmd.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
      executeScript(`window.renderMusicXML(\`${escapedXml}\`)`);
    }
  }, [isReady, musicXml, executeScript]);

  // Handle viewport layout to track actual width
  const handleViewportLayout = useCallback(
    (event: { nativeEvent: { layout: { width: number } } }) => {
      viewportWidthRef.current = event.nativeEvent.layout.width;
    },
    [],
  );

  // Scroll the parent ScrollView during playback
  // Rule: Scroll at 70% if next measure is NOT fully visible,
  //       otherwise wait until entering that next measure
  useEffect(() => {
    if (playbackState === "playing" && playbackMeasureIndex !== undefined) {
      // If starting at measure 0, note 0, always scroll to the beginning
      if (
        playbackMeasureIndex === 0 &&
        playbackNoteIndex === 0 &&
        scrollViewRef.current
      ) {
        scrollViewRef.current.scrollTo({ x: 0, animated: true });
        return;
      }

      // Get current measure position info
      const currentMeasurePos = measurePositionsRef.current.find(
        (m) => m.measureIndex === playbackMeasureIndex,
      );
      if (!currentMeasurePos) {
        return;
      }

      const zoom = osmdZoomRef.current;
      const vw = viewportWidthRef.current;
      const currentScrollX = currentScrollXRef.current;

      // Calculate the X position of the current note
      // Use beatPositions if available, otherwise interpolate within measure
      let currentNoteX: number;

      if (
        currentMeasurePos.beatPositions &&
        currentMeasurePos.beatPositions.length > 0 &&
        playbackBeat !== undefined
      ) {
        // Find the beat position closest to our current beat
        const beatPositions = currentMeasurePos.beatPositions;
        let closestBeatPos = beatPositions[0];
        for (const bp of beatPositions) {
          if (bp.beat <= playbackBeat) {
            closestBeatPos = bp;
          } else {
            break;
          }
        }
        currentNoteX = closestBeatPos.x * zoom;
      } else {
        // Fallback: interpolate based on note index within measure
        // This is approximate but better than nothing
        const measureWidth = currentMeasurePos.width || 100;
        const measureStartX = currentMeasurePos.x;
        // Assume notes are roughly evenly distributed (not perfect but works)
        currentNoteX = (measureStartX + measureWidth * 0.3) * zoom; // Start a bit into the measure
      }

      // Find next measure to check if it's fully visible
      const nextMeasurePos = measurePositionsRef.current.find(
        (m) => m.measureIndex === playbackMeasureIndex + 1,
      );

      // Check if next measure's right edge is within the viewport
      const viewportRightEdge = currentScrollX + vw;
      const nextMeasureFullyVisible = nextMeasurePos
        ? (nextMeasurePos.x + (nextMeasurePos.width || 100)) * zoom <=
          viewportRightEdge
        : false;

      // Decide whether to scroll
      // Rule: Scroll when past 70% threshold
      // - If next measure NOT visible: scroll immediately
      // - If next measure IS visible: wait until entering it, then scroll
      const threshold = currentScrollX + vw * 0.7;
      const isPast70 = currentNoteX > threshold;
      let shouldScroll = false;
      let targetScrollX = 0;

      if (isPast70) {
        if (!nextMeasureFullyVisible) {
          // Next measure not visible - scroll immediately
          shouldScroll = true;
          targetScrollX = Math.max(0, currentNoteX - vw * 0.15);
        } else if (playbackNoteIndex === 0 && playbackBeat === 0) {
          // Next measure is visible, but we just entered this measure - scroll now
          shouldScroll = true;
          targetScrollX = Math.max(0, currentNoteX - vw * 0.15);
        }
      }

      if (shouldScroll && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: targetScrollX,
          animated: true,
        });
      }
    }
  }, [playbackState, playbackMeasureIndex, playbackNoteIndex, playbackBeat]);

  // Scroll the parent ScrollView when cursor moves (not during playback)
  // Rule: Scroll at 70% if next measure is NOT fully visible,
  //       otherwise wait until entering that next measure
  useEffect(() => {
    // Only scroll for cursor when not playing and not in special modes
    if (playbackState === "playing") {
      return;
    }

    // Skip main cursor scroll when lyrics or chord mode is active
    // (they have their own scroll effects)
    if (lyricsCursorPosition || chordCursor) {
      return;
    }

    // Determine cursor movement direction
    const prevCursor = prevCursorRef.current;
    const movingLeft =
      cursor.measureIndex < prevCursor.measureIndex ||
      (cursor.measureIndex === prevCursor.measureIndex &&
        cursor.noteIndex < prevCursor.noteIndex);

    // Update prev cursor for next comparison
    prevCursorRef.current = {
      measureIndex: cursor.measureIndex,
      noteIndex: cursor.noteIndex,
    };

    // If at start, scroll to beginning
    if (cursor.measureIndex === 0 && cursor.noteIndex === 0) {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: 0, animated: true });
      }
      return;
    }

    // Get current measure position info
    const currentMeasurePos = measurePositionsRef.current.find(
      (m) => m.measureIndex === cursor.measureIndex,
    );
    if (!currentMeasurePos) {
      return;
    }

    const zoom = osmdZoomRef.current;
    const vw = viewportWidthRef.current;
    const currentScrollX = currentScrollXRef.current;

    // Calculate the X position of the cursor note
    let cursorNoteX: number;
    let cursorBeat = 0;

    if (
      currentMeasurePos.beatPositions &&
      currentMeasurePos.beatPositions.length > 0
    ) {
      // Calculate beat position from noteIndex by summing note durations
      const measure = score.measures[cursor.measureIndex];
      if (measure) {
        for (let i = 0; i < cursor.noteIndex && i < measure.notes.length; i++) {
          cursorBeat += getNoteDuration(measure.notes[i]);
        }
      }

      // Find the beat position closest to our cursor beat
      const beatPositions = currentMeasurePos.beatPositions;
      let closestBeatPos = beatPositions[0];
      for (const bp of beatPositions) {
        if (bp.beat <= cursorBeat) {
          closestBeatPos = bp;
        } else {
          break;
        }
      }
      cursorNoteX = closestBeatPos.x * zoom;
    } else {
      // Fallback: use measure start position
      cursorNoteX = currentMeasurePos.x * zoom;
    }

    // Find next measure to check if it's fully visible
    const nextMeasurePos = measurePositionsRef.current.find(
      (m) => m.measureIndex === cursor.measureIndex + 1,
    );

    // Check if next measure's right edge is within the viewport
    const viewportRightEdge = currentScrollX + vw;
    const nextMeasureFullyVisible = nextMeasurePos
      ? (nextMeasurePos.x + (nextMeasurePos.width || 100)) * zoom <=
        viewportRightEdge
      : false;

    // Decide whether to scroll
    // Right scroll (moving right): when past 70% threshold
    // - If next measure NOT visible: scroll immediately
    // - If next measure IS visible: wait until entering it, then scroll
    // Left scroll (moving left): when cursor is before 30% of viewport
    const rightThreshold = currentScrollX + vw * 0.7;
    const leftThreshold = currentScrollX + vw * 0.3;
    const isPast70 = cursorNoteX > rightThreshold;
    const isBefore30 = cursorNoteX < leftThreshold;
    let shouldScroll = false;
    let targetScrollX = 0;

    if (!movingLeft && isPast70) {
      // Moving right and past 70%
      if (!nextMeasureFullyVisible) {
        // Next measure not visible - scroll immediately
        shouldScroll = true;
        targetScrollX = Math.max(0, cursorNoteX - vw * 0.15);
      } else if (cursor.noteIndex === 0) {
        // Next measure is visible, but we just entered this measure - scroll now
        shouldScroll = true;
        targetScrollX = Math.max(0, cursorNoteX - vw * 0.15);
      }
    } else if (movingLeft && isBefore30 && currentScrollX > 0) {
      // Moving left and cursor is before 30%, scroll to put it at 70%
      shouldScroll = true;
      targetScrollX = Math.max(0, cursorNoteX - vw * 0.7);
    }

    if (shouldScroll && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: targetScrollX,
        animated: true,
      });
    }
  }, [
    cursor.measureIndex,
    cursor.noteIndex,
    playbackState,
    score.measures,
    lyricsCursorPosition,
    chordCursor,
  ]);

  // Scroll the parent ScrollView when chord cursor moves
  // Uses same 70%/30% threshold logic as main cursor
  useEffect(() => {
    // Only scroll for chord cursor when in chord mode
    if (!chordCursor) {
      prevChordCursorRef.current = null;
      return;
    }

    // Determine chord cursor movement direction
    const prevChordCursor = prevChordCursorRef.current;

    // Skip scrolling on initial entry to chord mode (no previous position to compare)
    if (!prevChordCursor) {
      prevChordCursorRef.current = {
        measureIndex: chordCursor.measureIndex,
        beatPosition: chordCursor.beatPosition,
      };
      return;
    }

    // Check if position actually changed
    const positionChanged =
      chordCursor.measureIndex !== prevChordCursor.measureIndex ||
      chordCursor.beatPosition !== prevChordCursor.beatPosition;

    if (!positionChanged) {
      return;
    }

    const movingLeft =
      chordCursor.measureIndex < prevChordCursor.measureIndex ||
      (chordCursor.measureIndex === prevChordCursor.measureIndex &&
        chordCursor.beatPosition < prevChordCursor.beatPosition);

    // Update prev chord cursor for next comparison
    prevChordCursorRef.current = {
      measureIndex: chordCursor.measureIndex,
      beatPosition: chordCursor.beatPosition,
    };

    // If at start, scroll to beginning
    if (chordCursor.measureIndex === 0 && chordCursor.beatPosition === 0) {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: 0, animated: true });
      }
      return;
    }

    // Get current measure position info
    const currentMeasurePos = measurePositionsRef.current.find(
      (m) => m.measureIndex === chordCursor.measureIndex,
    );
    if (!currentMeasurePos) {
      return;
    }

    const zoom = osmdZoomRef.current;
    const vw = viewportWidthRef.current;
    const currentScrollX = currentScrollXRef.current;

    // Calculate the X position of the chord cursor
    let chordCursorX: number;

    if (
      currentMeasurePos.beatPositions &&
      currentMeasurePos.beatPositions.length > 0
    ) {
      // Find the beat position closest to our chord beat
      const beatPositions = currentMeasurePos.beatPositions;
      let closestBeatPos = beatPositions[0];
      for (const bp of beatPositions) {
        if (bp.beat <= chordCursor.beatPosition) {
          closestBeatPos = bp;
        } else {
          break;
        }
      }
      chordCursorX = closestBeatPos.x * zoom;
    } else {
      // Fallback: use measure start position
      chordCursorX = currentMeasurePos.x * zoom;
    }

    // Find next measure to check if it's fully visible
    const nextMeasurePos = measurePositionsRef.current.find(
      (m) => m.measureIndex === chordCursor.measureIndex + 1,
    );

    // Check if next measure's right edge is within the viewport
    const viewportRightEdge = currentScrollX + vw;
    const nextMeasureFullyVisible = nextMeasurePos
      ? (nextMeasurePos.x + (nextMeasurePos.width || 100)) * zoom <=
        viewportRightEdge
      : false;

    // Decide whether to scroll
    const rightThreshold = currentScrollX + vw * 0.7;
    const leftThreshold = currentScrollX + vw * 0.3;
    const isPast70 = chordCursorX > rightThreshold;
    const isBefore30 = chordCursorX < leftThreshold;
    let shouldScroll = false;
    let targetScrollX = 0;

    if (!movingLeft && isPast70) {
      // Moving right and past 70%
      if (!nextMeasureFullyVisible) {
        // Next measure not visible - scroll immediately
        shouldScroll = true;
        targetScrollX = Math.max(0, chordCursorX - vw * 0.15);
      } else if (chordCursor.beatPosition === 0) {
        // Just entered this measure - scroll now
        shouldScroll = true;
        targetScrollX = Math.max(0, chordCursorX - vw * 0.15);
      }
    } else if (movingLeft && isBefore30 && currentScrollX > 0) {
      // Moving left and cursor is before 30%, scroll to put it at 70%
      shouldScroll = true;
      targetScrollX = Math.max(0, chordCursorX - vw * 0.7);
    }

    if (shouldScroll && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: targetScrollX,
        animated: true,
      });
    }
  }, [chordCursor?.measureIndex, chordCursor?.beatPosition]);

  // Scroll the parent ScrollView when lyrics cursor moves
  // Uses same 70%/30% threshold logic as main cursor
  useEffect(() => {
    // Only scroll when lyrics cursor is active
    if (!lyricsCursorPosition) {
      prevLyricsCursorRef.current = null;
      return;
    }

    // Determine lyrics cursor movement direction
    const prevLyricsCursor = prevLyricsCursorRef.current;

    // Skip scrolling on initial entry to lyrics mode (no previous position to compare)
    if (!prevLyricsCursor) {
      prevLyricsCursorRef.current = {
        measureIndex: lyricsCursorPosition.measureIndex,
        noteIndex: lyricsCursorPosition.noteIndex,
      };
      return;
    }

    // Check if position actually changed
    const positionChanged =
      lyricsCursorPosition.measureIndex !== prevLyricsCursor.measureIndex ||
      lyricsCursorPosition.noteIndex !== prevLyricsCursor.noteIndex;

    if (!positionChanged) {
      return;
    }

    const movingLeft =
      lyricsCursorPosition.measureIndex < prevLyricsCursor.measureIndex ||
      (lyricsCursorPosition.measureIndex === prevLyricsCursor.measureIndex &&
        lyricsCursorPosition.noteIndex < prevLyricsCursor.noteIndex);

    // Update prev lyrics cursor for next comparison
    prevLyricsCursorRef.current = {
      measureIndex: lyricsCursorPosition.measureIndex,
      noteIndex: lyricsCursorPosition.noteIndex,
    };

    // If at start, scroll to beginning
    if (
      lyricsCursorPosition.measureIndex === 0 &&
      lyricsCursorPosition.noteIndex === 0
    ) {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: 0, animated: true });
      }
      return;
    }

    // Get current measure position info
    const currentMeasurePos = measurePositionsRef.current.find(
      (m) => m.measureIndex === lyricsCursorPosition.measureIndex,
    );
    if (!currentMeasurePos) {
      return;
    }

    const zoom = osmdZoomRef.current;
    const vw = viewportWidthRef.current;
    const currentScrollX = currentScrollXRef.current;

    // Calculate the X position of the lyrics cursor note
    let lyricsCursorX: number;

    if (
      currentMeasurePos.beatPositions &&
      currentMeasurePos.beatPositions.length > 0
    ) {
      // Calculate beat position from noteIndex by summing note durations
      const measure = score.measures[lyricsCursorPosition.measureIndex];
      let lyricsBeat = 0;
      if (measure) {
        for (
          let i = 0;
          i < lyricsCursorPosition.noteIndex && i < measure.notes.length;
          i++
        ) {
          lyricsBeat += getNoteDuration(measure.notes[i]);
        }
      }

      // Find the beat position closest to our lyrics beat
      const beatPositions = currentMeasurePos.beatPositions;
      let closestBeatPos = beatPositions[0];
      for (const bp of beatPositions) {
        if (bp.beat <= lyricsBeat) {
          closestBeatPos = bp;
        } else {
          break;
        }
      }
      lyricsCursorX = closestBeatPos.x * zoom;
    } else {
      // Fallback: use measure start position
      lyricsCursorX = currentMeasurePos.x * zoom;
    }

    // Find next measure to check if it's fully visible
    const nextMeasurePos = measurePositionsRef.current.find(
      (m) => m.measureIndex === lyricsCursorPosition.measureIndex + 1,
    );

    // Check if next measure's right edge is within the viewport
    const viewportRightEdge = currentScrollX + vw;
    const nextMeasureFullyVisible = nextMeasurePos
      ? (nextMeasurePos.x + (nextMeasurePos.width || 100)) * zoom <=
        viewportRightEdge
      : false;

    // Decide whether to scroll
    const rightThreshold = currentScrollX + vw * 0.7;
    const leftThreshold = currentScrollX + vw * 0.3;
    const isPast70 = lyricsCursorX > rightThreshold;
    const isBefore30 = lyricsCursorX < leftThreshold;
    let shouldScroll = false;
    let targetScrollX = 0;

    if (!movingLeft && isPast70) {
      // Moving right and past 70%
      if (!nextMeasureFullyVisible) {
        // Next measure not visible - scroll immediately
        shouldScroll = true;
        targetScrollX = Math.max(0, lyricsCursorX - vw * 0.15);
      } else if (lyricsCursorPosition.noteIndex === 0) {
        // Just entered this measure - scroll now
        shouldScroll = true;
        targetScrollX = Math.max(0, lyricsCursorX - vw * 0.15);
      }
    } else if (movingLeft && isBefore30 && currentScrollX > 0) {
      // Moving left and cursor is before 30%, scroll to put it at 70%
      shouldScroll = true;
      targetScrollX = Math.max(0, lyricsCursorX - vw * 0.7);
    }

    if (shouldScroll && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: targetScrollX,
        animated: true,
      });
    }
  }, [
    lyricsCursorPosition?.measureIndex,
    lyricsCursorPosition?.noteIndex,
    score.measures,
  ]);

  // Apply zoom when controlled zoom changes
  useEffect(() => {
    if (isReady && controlledZoom !== undefined) {
      executeScript(`window.setZoom(${controlledZoom})`);
    }
  }, [isReady, controlledZoom, executeScript]);

  // Track scroll position so we can restore it after re-render
  // Also updates state for chord cursor overlay positioning
  const handleScroll = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      const newScrollX = event.nativeEvent.contentOffset.x;
      currentScrollXRef.current = newScrollX;
      setScrollX(newScrollX);
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
                barlineX?: number;
                beatPositions?: { beat: number; x: number }[];
              }[];
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

          case "wheel": {
            const { deltaX, deltaY } = data.payload as {
              deltaX: number;
              deltaY: number;
            };
            if (scrollViewRef.current) {
              // Get current scroll position and add delta (deltaY for horizontal on trackpad)
              const currentX = currentScrollXRef.current;
              const newX = Math.max(0, currentX + (deltaX || deltaY));
              currentScrollXRef.current = newX;
              scrollViewRef.current.scrollTo({ x: newX, animated: false });
            }
            break;
          }

          case "consoleLog": {
            // Log all messages from WebView in dev mode to help debug
            const log = data.payload as { level: string; message: string };
            if (__DEV__) {
              if (log.level === "error") {
                devError("[OSMD]", log.message);
              } else {
                console.log("[OSMD]", log.message);
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
          onLayout={handleViewportLayout}
          scrollEventThrottle={16}
          contentContainerStyle={{
            width: contentWidth * osmdZoom,
            height: "100%",
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
              ref={webViewRef as React.RefObject<InstanceType<typeof WebView>>}
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
        </ScrollView>

        {/* Chord cursor overlay - positioned absolutely over viewport */}
        {chordCursorX !== null && (
          <View
            style={[
              styles.chordCursorOverlay,
              { left: chordCursorX - scrollX },
            ]}
            pointerEvents="none"
            testID="chord-cursor-overlay"
          >
            <View style={styles.chordCursorLine} />
            <View style={styles.chordCursorDiamond} />
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
