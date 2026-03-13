/**
 * Tuner - Pitch detection display with needle or text mode
 *
 * Uses usePitchDetection hook for real-time pitch detection.
 * Displays current pitch with visual feedback for tuning accuracy.
 *
 * Phase 1 UX Improvements:
 * - State machine for proper state transitions
 * - Attack phase detection (ignores first 200ms)
 * - Stability indicator (🟢🟡🔴)
 * - State text (PERFECT/IN TUNE/CENTERED)
 * - Center lock + hold indicators
 */
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useReducer,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
} from "react-native";
import Svg, { Path, Line, Text as SvgText, Circle } from "react-native-svg";
import { usePitchDetection } from "../../../hooks/usePitchDetection";
import {
  frequencyToNote,
  getCentsDeviation,
  noteToFrequency,
  noteNames,
} from "../../../constants/notes";

// Import tuner state machine and helpers
import {
  tunerReducer,
  initialContext,
  isDetectingPhase,
  isLocked,
  getCenteredStableDuration,
  type TunerStateContext,
} from "./Tuner/tunerStateMachine";
import {
  computeStateText,
  getTuneColor,
  getStabilityColor,
  getHoldProgress,
  shouldShowHold,
  getMedian,
} from "./Tuner/tunerHelpers";
import {
  TUNER_FLAGS,
  TUNER_COLORS,
  NEEDLE_DEAD_ZONE,
  MIN_CENTS_CHANGE,
  FREQUENCY_SMOOTHING,
  CENTS_SMOOTHING,
  MEDIAN_WINDOW_SIZE,
  STABILITY_WINDOW_MS,
} from "./Tuner/tunerConstants";

// Minor 7th system options
export type Minor7System = "classical" | "pythagorean" | "harmonic";

const MINOR_7TH_RATIOS: Record<Minor7System, number> = {
  classical: 9 / 5, // ~1018 cents, +18 vs ET - Classical harmony
  pythagorean: 16 / 9, // ~996 cents, +4 vs ET - Modal/melodic
  harmonic: 7 / 4, // ~969 cents, -31 vs ET - Dominant 7 chords (natural harmonic series)
};

const MINOR_7TH_LABELS: Record<Minor7System, string> = {
  classical: "9:5",
  pythagorean: "16:9",
  harmonic: "7:4",
};

// Just intonation ratios for chromatic scale degrees relative to tonic
// Index corresponds to semitones above tonic
// Note: Index 10 (minor 7th) will be overridden by the selected m7 system
const JUST_RATIOS: number[] = [
  1, // 0: Unison (1/1)
  16 / 15, // 1: Minor 2nd
  9 / 8, // 2: Major 2nd
  6 / 5, // 3: Minor 3rd
  5 / 4, // 4: Major 3rd
  4 / 3, // 5: Perfect 4th
  45 / 32, // 6: Tritone (augmented 4th)
  3 / 2, // 7: Perfect 5th
  8 / 5, // 8: Minor 6th
  5 / 3, // 9: Major 6th
  9 / 5, // 10: Minor 7th (default - will be overridden)
  15 / 8, // 11: Major 7th
];

// Key display names with enharmonics
const KEY_DISPLAY_NAMES: string[] = [
  "C",
  "C#/Db",
  "D",
  "D#/Eb",
  "E",
  "F",
  "F#/Gb",
  "G",
  "G#/Ab",
  "A",
  "A#/Bb",
  "B",
];

/**
 * Get the just intonation frequency for a note in a given key
 * @param noteName - Note being played (e.g., "E4")
 * @param keyIndex - Index of the key (0=C, 1=C#, etc.)
 * @param a4Frequency - Reference frequency for A4 (default 440 Hz)
 * @returns Target frequency using just intonation ratios
 */
function getJustIntonationFrequency(
  noteName: string | null,
  keyIndex: number,
  a4Frequency: number = 440,
  minor7System: Minor7System = "pythagorean",
): number | null {
  if (!noteName) return null;

  // Parse the note to get letter and octave
  const match = noteName.match(/^([A-G])([#b]?)(\d+)$/);
  if (!match) return null;

  let [, letter, accidental, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);

  // Find note index in chromatic scale
  let noteIndex = noteNames.indexOf(letter);
  if (noteIndex === -1) return null;
  if (accidental === "#") noteIndex += 1;
  else if (accidental === "b") noteIndex -= 1;
  noteIndex = ((noteIndex % 12) + 12) % 12;

  // Calculate semitones above the tonic (key root)
  const semitonesAboveTonic = (((noteIndex - keyIndex) % 12) + 12) % 12;

  // Get the just ratio for this scale degree
  // Use the selected m7 system for minor 7th (semitones = 10)
  const justRatio =
    semitonesAboveTonic === 10
      ? MINOR_7TH_RATIOS[minor7System]
      : JUST_RATIOS[semitonesAboveTonic];

  // Find the tonic frequency for the correct octave
  // First, get the base tonic frequency in octave 4
  const tonicSemitonesFromA4 = keyIndex - 9; // A is index 9
  const tonicOctave4Freq = a4Frequency * Math.pow(2, tonicSemitonesFromA4 / 12);

  // Determine which octave the tonic should be in
  // The note's octave might be above or below the tonic
  let tonicOctave = octave;
  // If the note is below the tonic in the chromatic scale,
  // the tonic reference should be from the octave below
  if (noteIndex < keyIndex) {
    tonicOctave = octave; // Note is in upper part of scale
  }
  // Adjust tonic to correct octave
  const tonicFreq = tonicOctave4Freq * Math.pow(2, tonicOctave - 4);

  // Apply just ratio (may need octave adjustment)
  let justFreq = tonicFreq * justRatio;

  // If the ratio pushed us into a different octave than expected, adjust
  // The detected note should be close to this frequency
  const equalTempFreq =
    a4Frequency *
    Math.pow(
      2,
      (noteNames.indexOf(letter) +
        (accidental === "#" ? 1 : accidental === "b" ? -1 : 0) +
        (octave - 4) * 12 -
        9) /
        12,
    );
  if (equalTempFreq) {
    // Ensure we're in the right octave (within half an octave)
    while (justFreq > equalTempFreq * 1.4) justFreq /= 2;
    while (justFreq < equalTempFreq * 0.7) justFreq *= 2;
  }

  // Debug logging
  const keyName = KEY_DISPLAY_NAMES[keyIndex].split("/")[0];
  const m7Info = semitonesAboveTonic === 10 ? `, m7=${minor7System}` : "";
  console.log(
    `[JUST] note=${noteName}, key=${keyName}, noteIdx=${noteIndex}, keyIdx=${keyIndex}, semitones=${semitonesAboveTonic}, ratio=${justRatio.toFixed(4)}, tonicFreq=${tonicFreq.toFixed(2)}, equalTemp=${equalTempFreq?.toFixed(2)}, justFreq=${justFreq.toFixed(2)}${m7Info}`,
  );

  return justFreq;
}

export type TunerMode = "needle" | "text";
export type Temperament = "equal" | "just";

export interface TunerProps {
  mode?: TunerMode;
  temperament?: Temperament;
  selectedKeyIndex?: number;
  concertA?: number;
}

const Tuner = React.memo(function Tuner({
  mode = "needle",
  temperament: initialTemperament = "equal",
  selectedKeyIndex: initialKeyIndex = 0,
  concertA: initialConcertA = 440,
}: TunerProps): React.JSX.Element {
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [cents, setCents] = useState(0);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [activeTemperament, setActiveTemperament] =
    useState<Temperament>(initialTemperament);
  const [selectedKeyIndex, setSelectedKeyIndex] = useState(initialKeyIndex); // 0 = C
  const [concertA, setConcertA] = useState(String(initialConcertA));
  const [minor7System, setMinor7System] = useState<Minor7System>("pythagorean");
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs for callback to read current values (avoids stale closure in requestAnimationFrame loop)
  const selectedKeyIndexRef = useRef(initialKeyIndex);
  const activeTemperamentRef = useRef<Temperament>(initialTemperament);
  const concertARef = useRef(String(initialConcertA));
  const minor7SystemRef = useRef<Minor7System>("pythagorean");

  // Keep refs in sync with state
  useEffect(() => {
    selectedKeyIndexRef.current = selectedKeyIndex;
  }, [selectedKeyIndex]);

  useEffect(() => {
    activeTemperamentRef.current = activeTemperament;
  }, [activeTemperament]);

  useEffect(() => {
    concertARef.current = concertA;
  }, [concertA]);

  useEffect(() => {
    minor7SystemRef.current = minor7System;
  }, [minor7System]);

  // State machine for tuner state tracking (Phase 1 UX improvements)
  const [tunerState, dispatchTuner] = useReducer(tunerReducer, initialContext);

  // Smoothing refs for reducing jitter
  const smoothedFrequencyRef = useRef<number | null>(null);
  const smoothedCentsRef = useRef<number>(0);
  const lastNoteRef = useRef<string | null>(null);
  const centsHistoryRef = useRef<number[]>([]); // For median filtering
  const stabilityHistoryRef = useRef<number[]>([]); // For stability calculation
  const lastPitchTimeRef = useRef<number>(0); // For timing state machine

  // Sync temperament from props when they change
  useEffect(() => {
    setActiveTemperament(initialTemperament);
  }, [initialTemperament]);

  // Note: Key is NOT synced from props after initial mount
  // This allows users to override the tune's key in the UI
  // The tune's key is only used as the initial default via useState

  useEffect(() => {
    setConcertA(String(initialConcertA));
  }, [initialConcertA]);

  // Clear note if no pitch detected for 300ms
  const clearNoteAfterSilence = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    silenceTimeoutRef.current = setTimeout(() => {
      setCurrentNote(null);
      setCents(0);
      setFrequency(null);
      // Reset smoothing refs on silence
      smoothedFrequencyRef.current = null;
      smoothedCentsRef.current = 0;
      lastNoteRef.current = null;
      centsHistoryRef.current = [];
      stabilityHistoryRef.current = [];
      // Dispatch signal lost to state machine
      dispatchTuner({ type: "SIGNAL_LOST" });
    }, 300);
  }, []);

  const handlePitchDetected = useCallback(
    (pitch: { frequency?: number } | null) => {
      if (pitch && pitch.frequency) {
        // Clear any pending silence timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }

        const rawFrequency = pitch.frequency;
        const note = frequencyToNote(rawFrequency);

        // Check if note changed - if so, reset smoothing for faster response
        const noteChanged = note !== lastNoteRef.current;
        if (noteChanged) {
          centsHistoryRef.current = []; // Reset median buffer on note change
        }
        lastNoteRef.current = note;

        // Apply exponential moving average smoothing to frequency
        let smoothedFreq: number;
        if (smoothedFrequencyRef.current === null || noteChanged) {
          // First reading or note change: use raw value
          smoothedFreq = rawFrequency;
        } else {
          // EMA: new = alpha * raw + (1 - alpha) * previous
          smoothedFreq =
            FREQUENCY_SMOOTHING * rawFrequency +
            (1 - FREQUENCY_SMOOTHING) * smoothedFrequencyRef.current;
        }
        smoothedFrequencyRef.current = smoothedFreq;

        // Get the reference A4 frequency (read from ref to avoid stale closure)
        const a4 = parseFloat(concertARef.current) || 440;

        // Calculate target frequency based on temperament (read from refs)
        const currentTemperament = activeTemperamentRef.current;
        const currentKeyIndex = selectedKeyIndexRef.current;

        let targetFreq: number | null = null;
        if (currentTemperament === "just") {
          // Use just intonation frequency based on selected key and m7 system
          const currentM7System = minor7SystemRef.current;
          targetFreq = getJustIntonationFrequency(
            note,
            currentKeyIndex,
            a4,
            currentM7System,
          );
        } else {
          // Use noteToFrequency for equal temperament, scaled for custom A4
          const stdFreq = noteToFrequency(note);
          targetFreq = stdFreq ? stdFreq * (a4 / 440) : null;
        }

        // Calculate cents deviation using smoothed frequency
        const rawDeviation = targetFreq
          ? getCentsDeviation(smoothedFreq, targetFreq)
          : 0;

        // Add to history for median filtering
        centsHistoryRef.current.push(rawDeviation);
        if (centsHistoryRef.current.length > MEDIAN_WINDOW_SIZE) {
          centsHistoryRef.current.shift();
        }

        // Use median of recent values to reject outliers
        const medianCents = getMedian(centsHistoryRef.current);

        // Apply EMA smoothing on top of median for extra stability
        let smoothedCents: number;
        if (noteChanged || centsHistoryRef.current.length < 3) {
          smoothedCents = medianCents;
        } else {
          smoothedCents =
            CENTS_SMOOTHING * medianCents +
            (1 - CENTS_SMOOTHING) * smoothedCentsRef.current;
        }
        smoothedCentsRef.current = smoothedCents;

        // Only update state if note changed or cents moved enough
        const roundedCents = Math.round(smoothedCents);
        if (noteChanged || Math.abs(roundedCents - cents) >= MIN_CENTS_CHANGE) {
          setFrequency(smoothedFreq);
          setCurrentNote(note);
          setCents(roundedCents);
        }

        // Track stability history for state machine (Phase 1)
        const now = Date.now();
        stabilityHistoryRef.current.push(roundedCents);
        // Keep ~750ms of history based on typical update rate (~60fps = 16ms/frame → ~47 samples)
        const maxSamples = Math.ceil(STABILITY_WINDOW_MS / 16);
        while (stabilityHistoryRef.current.length > maxSamples) {
          stabilityHistoryRef.current.shift();
        }

        // Dispatch to state machine
        dispatchTuner({
          type: "SIGNAL_DETECTED",
          cents: roundedCents,
          centsHistory: stabilityHistoryRef.current,
          timestamp: now,
        });
        lastPitchTimeRef.current = now;

        // Start silence detection timer
        clearNoteAfterSilence();
      } else {
        setCurrentNote(null);
        setCents(0);
        setFrequency(null);
        // Reset smoothing refs
        smoothedFrequencyRef.current = null;
        smoothedCentsRef.current = 0;
        lastNoteRef.current = null;
        centsHistoryRef.current = [];
        stabilityHistoryRef.current = [];
        // Dispatch signal lost to state machine
        dispatchTuner({ type: "SIGNAL_LOST" });
      }
    },
    // Note: Reading temperament/key/concertA from refs, so they're not deps
    [clearNoteAfterSilence, cents],
  );

  const {
    isListening,
    startListening,
    stopListening,
    error,
    permissionGranted,
  } = usePitchDetection({
    enabled: true,
    onPitchDetected: handlePitchDetected,
    onRealtimePitch: handlePitchDetected,
    volumeThreshold: 0.01,
  });

  // Auto-start listening on mount
  useEffect(() => {
    startListening();
  }, [startListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        stopListening();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, [isListening, stopListening]);

  // ============================================
  // COMPUTED VALUES FOR UI (Phase 1 Improvements)
  // ============================================

  // Get tuning quality color (now uses graduated zones from tunerHelpers)
  const tuneColor = getTuneColor(cents);

  // Get stability indicator color
  const stabilityColor = getStabilityColor(tunerState.stability);

  // Get state text (PERFECT/IN TUNE/CENTERED/Xcents SHARP/FLAT)
  const stateText = computeStateText(
    cents,
    tunerState.stability.isStable,
    isDetectingPhase(tunerState),
  );

  // Lock/hold progress
  const centeredStableDuration = getCenteredStableDuration(
    tunerState,
    Date.now(),
  );
  const holdProgress = getHoldProgress(centeredStableDuration);
  const showHold = shouldShowHold(centeredStableDuration);
  const showLock = isLocked(tunerState);

  // Calculate needle rotation (-50 to +50 cents = -90 to +90 degrees)
  // Returns 0 when no note is detected
  // Dead zone: needle snaps to center within ±3 cents for visual stability
  const getNeedleRotation = (): number => {
    if (!currentNote) return 0; // Return to center when no sound
    // Apply dead zone only for needle display (not cents number)
    const displayCents = Math.abs(cents) <= NEEDLE_DEAD_ZONE ? 0 : cents;
    const clampedCents = Math.max(-50, Math.min(50, displayCents));
    return (clampedCents / 50) * 90;
  };

  return (
    <View style={styles.container}>
      {/* Error Message */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Tuner Display */}
      <View style={styles.tunerDisplay}>
        {mode === "needle" ? (
          // Needle Mode - Semicircular gauge
          <View style={styles.needleContainer}>
            {/* Gauge arc and needle */}
            <View style={styles.gaugeArc}>
              {/* Smooth angular gradient using 180 SVG arc segments */}
              <Svg width={360} height={180} style={styles.svgContainer}>
                {/* Arc segments - 180 segments spanning 180° to 360° (left to right through top) */}
                {/* Center at (180, 160), fills entire semicircle from center to radius 120 */}
                {Array.from({ length: 180 }, (_, i) => {
                  const cx = 180;
                  const cy = 160;
                  const outerR = 120;
                  const segmentAngle = 180 / 180; // 1° per segment
                  // Start at 180° (left), go through 270° (top), end at 360° (right)
                  const startAngle = 180 + i * segmentAngle;
                  const endAngle = 180 + (i + 1) * segmentAngle;
                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;

                  // Interpolate color based on position (0 to 1 across the arc)
                  const t = i / 179; // 0 at left edge, 1 at right edge
                  // Color stops: red(0) -> orange(0.2) -> yellow(0.35) -> green(0.5) -> yellow(0.65) -> orange(0.8) -> red(1)
                  const getColor = (pos: number): string => {
                    const stops = [
                      { p: 0, r: 244, g: 67, b: 54 }, // red
                      { p: 0.2, r: 255, g: 152, b: 0 }, // orange
                      { p: 0.35, r: 255, g: 193, b: 7 }, // yellow
                      { p: 0.5, r: 76, g: 175, b: 80 }, // green
                      { p: 0.65, r: 255, g: 193, b: 7 }, // yellow
                      { p: 0.8, r: 255, g: 152, b: 0 }, // orange
                      { p: 1, r: 244, g: 67, b: 54 }, // red
                    ];
                    let lower = stops[0],
                      upper = stops[stops.length - 1];
                    for (let j = 0; j < stops.length - 1; j++) {
                      if (pos >= stops[j].p && pos <= stops[j + 1].p) {
                        lower = stops[j];
                        upper = stops[j + 1];
                        break;
                      }
                    }
                    const range = upper.p - lower.p;
                    const localT = range > 0 ? (pos - lower.p) / range : 0;
                    const r = Math.round(
                      lower.r + (upper.r - lower.r) * localT,
                    );
                    const g = Math.round(
                      lower.g + (upper.g - lower.g) * localT,
                    );
                    const b = Math.round(
                      lower.b + (upper.b - lower.b) * localT,
                    );
                    return `rgb(${r},${g},${b})`;
                  };

                  const color = getColor(t);

                  // Pie slice: from center to outer arc
                  const x1 = cx + outerR * Math.cos(startRad);
                  const y1 = cy + outerR * Math.sin(startRad);
                  const x2 = cx + outerR * Math.cos(endRad);
                  const y2 = cy + outerR * Math.sin(endRad);

                  // Path: center -> outer start -> arc -> outer end -> back to center
                  const d = `M ${cx} ${cy} L ${x1} ${y1} A ${outerR} ${outerR} 0 0 1 ${x2} ${y2} Z`;

                  return <Path key={i} d={d} fill={color} opacity={0.7} />;
                })}
                {/* Arc outline */}
                <Path
                  d="M 60 160 A 120 120 0 0 1 300 160"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  fill="none"
                />
                {/* Bottom line to complete the semicircle enclosure */}
                <Line
                  x1={60}
                  y1={160}
                  x2={300}
                  y2={160}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
                {/* Tick marks at 0, ±10, ±20, ±30, ±40, ±50 cents */}
                {[-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50].map(
                  (centsValue) => {
                    const cx = 180;
                    const cy = 160;
                    const innerR = 120; // Starts at the arc (radius 120)
                    const outerR = 134; // Extends outward
                    // Map cents to angle: 0 cents = 270° (top), ±50 cents = 180°/360°
                    const angle = 270 + (centsValue / 50) * 90;
                    const rad = (angle * Math.PI) / 180;
                    const x1 = cx + innerR * Math.cos(rad);
                    const y1 = cy + innerR * Math.sin(rad);
                    const x2 = cx + outerR * Math.cos(rad);
                    const y2 = cy + outerR * Math.sin(rad);
                    // Make the 0 tick slightly longer
                    const tickOuterR = centsValue === 0 ? 138 : outerR;
                    const x2Final = cx + tickOuterR * Math.cos(rad);
                    const y2Final = cy + tickOuterR * Math.sin(rad);
                    // Label position outside the tick
                    const labelR = centsValue === 0 ? 152 : 148;
                    const labelX = cx + labelR * Math.cos(rad);
                    const labelY = cy + labelR * Math.sin(rad);
                    const labelText =
                      centsValue === 0
                        ? "0"
                        : centsValue > 0
                          ? `+${centsValue}`
                          : `${centsValue}`;
                    return (
                      <React.Fragment key={centsValue}>
                        <Line
                          x1={x1}
                          y1={y1}
                          x2={x2Final}
                          y2={y2Final}
                          stroke={centsValue === 0 ? "#4CAF50" : "#FFFFFF"}
                          strokeWidth={centsValue === 0 ? 4 : 1.5}
                        />
                        <SvgText
                          x={labelX}
                          y={labelY}
                          fill={centsValue === 0 ? "#4CAF50" : "#FFFFFF"}
                          fontSize={centsValue === 0 ? 16 : 12}
                          fontWeight={centsValue === 0 ? "bold" : "normal"}
                          textAnchor="middle"
                          alignmentBaseline="middle"
                        >
                          {labelText}
                        </SvgText>
                      </React.Fragment>
                    );
                  },
                )}
                {/* Small tick marks at ±5, ±15, ±25, ±35, ±45 cents (half size) */}
                {[-45, -35, -25, -15, -5, 5, 15, 25, 35, 45].map(
                  (centsValue) => {
                    const cx = 180;
                    const cy = 160;
                    const innerR = 120;
                    const outerR = 129; // 9px length
                    const angle = 270 + (centsValue / 50) * 90;
                    const rad = (angle * Math.PI) / 180;
                    const x1 = cx + innerR * Math.cos(rad);
                    const y1 = cy + innerR * Math.sin(rad);
                    const x2 = cx + outerR * Math.cos(rad);
                    const y2 = cy + outerR * Math.sin(rad);
                    return (
                      <Line
                        key={`small-${centsValue}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#FFFFFF"
                        strokeWidth={1.2}
                      />
                    );
                  },
                )}
                {/* Tiny tick marks for every degree except 0, ±5, ±10, ±15, etc. */}
                {Array.from({ length: 101 }, (_, i) => i - 50)
                  .filter((v) => v % 5 !== 0) // Exclude multiples of 5 (already have ticks)
                  .map((centsValue) => {
                    const cx = 180;
                    const cy = 160;
                    const innerR = 120;
                    const outerR = 123; // 3px length
                    const angle = 270 + (centsValue / 50) * 90;
                    const rad = (angle * Math.PI) / 180;
                    const x1 = cx + innerR * Math.cos(rad);
                    const y1 = cy + innerR * Math.sin(rad);
                    const x2 = cx + outerR * Math.cos(rad);
                    const y2 = cy + outerR * Math.sin(rad);
                    return (
                      <Line
                        key={`tiny-${centsValue}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#FFFFFF"
                        strokeWidth={1}
                      />
                    );
                  })}
              </Svg>

              {/* Needle - rotates around bottom center */}
              <View style={styles.needlePivotBase}>
                <View
                  style={[
                    styles.needleRotator,
                    { transform: [{ rotate: `${getNeedleRotation()}deg` }] },
                  ]}
                >
                  <View
                    style={[styles.needle, { backgroundColor: "#FFFFFF" }]}
                  />
                </View>
                {Math.abs(cents) <= 5 && currentNote ? (
                  <View style={styles.smileyContainer}>
                    <Svg width={24} height={24}>
                      {/* Face background */}
                      <Circle cx={12} cy={12} r={11} fill="#FFD700" />
                      <Circle
                        cx={12}
                        cy={12}
                        r={11}
                        stroke="#DAA520"
                        strokeWidth={1}
                        fill="none"
                      />
                      {/* Star eyes */}
                      <SvgText x={6} y={11} fontSize={8} textAnchor="middle">
                        ⭐
                      </SvgText>
                      <SvgText x={18} y={11} fontSize={8} textAnchor="middle">
                        ⭐
                      </SvgText>
                      {/* Smile */}
                      <Path
                        d="M 6 14 Q 12 20 18 14"
                        stroke="#333"
                        strokeWidth={2}
                        fill="none"
                        strokeLinecap="round"
                      />
                    </Svg>
                  </View>
                ) : (
                  <View style={styles.pivotDot} />
                )}
              </View>
            </View>

            {/* Note Display below gauge */}
            <View style={styles.noteContainer}>
              {currentNote ? (
                <>
                  <Text style={[styles.noteName, { color: tuneColor }]}>
                    {currentNote}
                  </Text>
                  {/* State text with stability-aware display (Phase 1) */}
                  {TUNER_FLAGS.stateLanguage ? (
                    <Text style={[styles.stateText, { color: tuneColor }]}>
                      {stateText}
                    </Text>
                  ) : (
                    <Text style={styles.centsDisplay}>
                      {cents > 0 ? "+" : ""}
                      {cents} cents
                    </Text>
                  )}
                  {/* Stability Indicator (Phase 1) */}
                  {TUNER_FLAGS.stabilityIndicator &&
                    !isDetectingPhase(tunerState) && (
                      <View style={styles.stabilityRow}>
                        <View
                          style={[
                            styles.stabilityDot,
                            { backgroundColor: stabilityColor },
                          ]}
                        />
                        <Text
                          style={[
                            styles.stabilityLabel,
                            { color: stabilityColor },
                          ]}
                        >
                          {tunerState.stability.isStable
                            ? "STABLE"
                            : tunerState.stability.isModerate
                              ? "SETTLING"
                              : "UNSTABLE"}
                        </Text>
                      </View>
                    )}
                  {/* Lock/Hold Indicator (Phase 1) */}
                  {TUNER_FLAGS.holdIndicator && showLock && (
                    <View style={styles.lockIndicator}>
                      <Text style={styles.lockText}>✓ LOCKED</Text>
                    </View>
                  )}
                  {TUNER_FLAGS.holdIndicator &&
                    !showLock &&
                    holdProgress > 0 && (
                      <View style={styles.holdProgressContainer}>
                        <View
                          style={[
                            styles.holdProgressBar,
                            { width: `${holdProgress * 100}%` },
                          ]}
                        />
                      </View>
                    )}
                </>
              ) : (
                <Text style={styles.micIcon}>🎤</Text>
              )}
            </View>
          </View>
        ) : (
          // Text Mode
          <View style={styles.textContainer}>
            {currentNote ? (
              <>
                <Text style={[styles.textNote, { color: tuneColor }]}>
                  {currentNote}
                </Text>
                {TUNER_FLAGS.stateLanguage ? (
                  <Text style={[styles.textCents, { color: tuneColor }]}>
                    {stateText}
                  </Text>
                ) : (
                  <Text style={[styles.textCents, { color: tuneColor }]}>
                    {cents > 0 ? "+" : ""}
                    {cents} cents
                  </Text>
                )}
                <Text style={styles.textFreq}>
                  {frequency ? `${frequency.toFixed(1)} Hz` : ""}
                </Text>
                {/* Stability Indicator for text mode */}
                {TUNER_FLAGS.stabilityIndicator &&
                  !isDetectingPhase(tunerState) && (
                    <View style={styles.stabilityRow}>
                      <View
                        style={[
                          styles.stabilityDot,
                          { backgroundColor: stabilityColor },
                        ]}
                      />
                      <Text
                        style={[
                          styles.stabilityLabel,
                          { color: stabilityColor },
                        ]}
                      >
                        {tunerState.stability.isStable
                          ? "STABLE"
                          : tunerState.stability.isModerate
                            ? "SETTLING"
                            : "UNSTABLE"}
                      </Text>
                    </View>
                  )}
              </>
            ) : (
              <Text style={styles.textMicIcon}>🎤</Text>
            )}
          </View>
        )}
      </View>

      {/* Temperament & Concert A Row */}
      <View style={styles.settingsRow}>
        {/* Temperament Toggle - Renamed for clarity (Phase 1A) */}
        <View style={styles.temperamentToggle}>
          <TouchableOpacity
            onPress={() => setActiveTemperament("equal")}
            style={[
              styles.temperamentButtonLeft,
              activeTemperament === "equal"
                ? styles.temperamentButtonActive
                : styles.temperamentButtonInactive,
            ]}
            accessibilityLabel={`Standard equal temperament${activeTemperament === "equal" ? ", selected" : ""}`}
            accessibilityRole="button"
            accessibilityState={{ selected: activeTemperament === "equal" }}
          >
            <Text
              style={[
                styles.temperamentButtonText,
                activeTemperament === "equal"
                  ? styles.temperamentButtonTextActive
                  : styles.temperamentButtonTextInactive,
              ]}
            >
              Standard (ET)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTemperament("just")}
            style={[
              styles.temperamentButtonRight,
              activeTemperament === "just"
                ? styles.temperamentButtonActive
                : styles.temperamentButtonInactive,
            ]}
            accessibilityLabel={`Resonance just intonation${activeTemperament === "just" ? ", selected" : ""}`}
            accessibilityRole="button"
            accessibilityState={{ selected: activeTemperament === "just" }}
          >
            <Text
              style={[
                styles.temperamentButtonText,
                activeTemperament === "just"
                  ? styles.temperamentButtonTextActive
                  : styles.temperamentButtonTextInactive,
              ]}
            >
              Resonance (JI)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Concert A Input */}
        <View style={styles.concertARow}>
          <Text style={styles.concertALabel}>A=</Text>
          <TextInput
            value={concertA}
            onChangeText={setConcertA}
            keyboardType="numeric"
            style={styles.concertAInput}
            placeholder="440"
            placeholderTextColor="#666"
            accessibilityLabel="Concert A frequency"
          />
          <Text style={styles.concertAUnit}>Hz</Text>
        </View>
      </View>

      {/* Key Selector (shown when Just Intonation is selected) */}
      {activeTemperament === "just" && (
        <View style={styles.keySelector}>
          <Text style={styles.keySelectorLabel}>Key</Text>
          <View style={styles.keyGrid}>
            {[0, 1, 2].map((row) => (
              <View key={row} style={styles.keyRow}>
                {KEY_DISPLAY_NAMES.slice(row * 4, row * 4 + 4).map(
                  (keyName, colIndex) => {
                    const index = row * 4 + colIndex;
                    return (
                      <TouchableOpacity
                        key={keyName}
                        style={[
                          styles.keyOption,
                          selectedKeyIndex === index && styles.keyOptionActive,
                        ]}
                        onPress={() => {
                          console.log(
                            `[KEY_CLICK] User clicked key: ${index} (${KEY_DISPLAY_NAMES[index]?.split("/")[0]})`,
                          );
                          setSelectedKeyIndex(index);
                        }}
                        accessibilityLabel={`Key of ${keyName}`}
                        accessibilityRole="button"
                      >
                        <Text
                          style={[
                            styles.keyOptionText,
                            selectedKeyIndex === index &&
                              styles.keyOptionTextActive,
                          ]}
                        >
                          {keyName}
                        </Text>
                      </TouchableOpacity>
                    );
                  },
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Minor 7th System Toggle (shown when Just Intonation is selected) */}
      {activeTemperament === "just" && (
        <View style={styles.m7SystemContainer}>
          <Text style={styles.m7SystemLabel}>Minor 7th</Text>
          <View style={styles.m7SystemToggle}>
            <TouchableOpacity
              onPress={() => setMinor7System("classical")}
              style={[
                styles.m7ButtonLeft,
                minor7System === "classical"
                  ? styles.m7ButtonActive
                  : styles.m7ButtonInactive,
              ]}
              accessibilityLabel={`Classical 9:5${minor7System === "classical" ? ", selected" : ""}`}
              accessibilityRole="button"
              accessibilityState={{ selected: minor7System === "classical" }}
            >
              <Text
                style={[
                  styles.m7ButtonText,
                  minor7System === "classical"
                    ? styles.m7ButtonTextActive
                    : styles.m7ButtonTextInactive,
                ]}
              >
                9:5
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMinor7System("pythagorean")}
              style={[
                styles.m7ButtonMiddle,
                minor7System === "pythagorean"
                  ? styles.m7ButtonActive
                  : styles.m7ButtonInactive,
              ]}
              accessibilityLabel={`Pythagorean 16:9${minor7System === "pythagorean" ? ", selected" : ""}`}
              accessibilityRole="button"
              accessibilityState={{ selected: minor7System === "pythagorean" }}
            >
              <Text
                style={[
                  styles.m7ButtonText,
                  minor7System === "pythagorean"
                    ? styles.m7ButtonTextActive
                    : styles.m7ButtonTextInactive,
                ]}
              >
                16:9
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMinor7System("harmonic")}
              style={[
                styles.m7ButtonRight,
                minor7System === "harmonic"
                  ? styles.m7ButtonActive
                  : styles.m7ButtonInactive,
              ]}
              accessibilityLabel={`Harmonic 7:4${minor7System === "harmonic" ? ", selected" : ""}`}
              accessibilityRole="button"
              accessibilityState={{ selected: minor7System === "harmonic" }}
            >
              <Text
                style={[
                  styles.m7ButtonText,
                  minor7System === "harmonic"
                    ? styles.m7ButtonTextActive
                    : styles.m7ButtonTextInactive,
                ]}
              >
                7:4
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 12,
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 12,
    marginBottom: 8,
  },

  // Tuner Display
  tunerDisplay: {
    width: "100%",
    alignItems: "center",
  },

  // Needle Mode - Gauge design
  needleContainer: {
    alignItems: "center",
    width: "100%",
  },
  // GAUGE LAYOUT - all elements share pivot at (180, 20) from container bottom
  // Container: 360x180, Pivot: centerX=180, bottomOffset=20
  // SVG draws arcs and gradient, Needle: 115
  gaugeArc: {
    width: 360,
    height: 180,
    position: "relative",
  },
  // SVG container - positioned to align with gauge
  svgContainer: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  // Needle pivot - rotation center at (180, 20)
  // needleRotator is 230px, rotates around center (115px up from its bottom)
  // So position needlePivotBase at bottom: 20-115 = -95 to align rotation center with pivot
  needlePivotBase: {
    position: "absolute",
    bottom: -95, // Shifted so rotator center is at pivot (20px from container bottom)
    left: 174, // 180 - 6 (half of 12px width)
    width: 12,
    alignItems: "center",
  },
  // needleRotator is 2x needle height so center = needle bottom = pivot point
  needleRotator: {
    width: 12,
    height: 230, // 2x needle height (115)
    alignItems: "center",
    justifyContent: "flex-start", // Needle at top, bottom half is empty
  },
  needle: {
    width: 4,
    height: 115, // Almost reaches arc (radius 120)
    borderRadius: 2,
  },
  pivotDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#333",
    borderWidth: 2,
    borderColor: "#666",
    position: "absolute",
    bottom: 107, // At rotation center: 115 - 8 (half of dot height)
  },
  smileyContainer: {
    width: 24,
    height: 24,
    position: "absolute",
    bottom: 103, // At rotation center: 115 - 12 (half of smiley height)
    left: -6, // Center the larger smiley: (24 - 12) / 2 = -6
  },
  noteContainer: {
    alignItems: "center",
    marginTop: 8,
    minHeight: 60,
  },
  noteName: {
    fontSize: 36,
    fontWeight: "bold",
  },
  micIcon: {
    fontSize: 36,
    textShadowColor: "rgba(76, 175, 80, 1.0)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  centsDisplay: {
    color: "#888",
    fontSize: 14,
    marginTop: 4,
  },
  // Phase 1 UX Improvement Styles
  stateText: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 4,
    letterSpacing: 1,
  },
  stabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  stabilityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  stabilityLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  lockIndicator: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  lockText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  holdProgressContainer: {
    marginTop: 6,
    width: 60,
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    overflow: "hidden",
  },
  holdProgressBar: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 2,
  },
  listeningText: {
    color: "#666",
    fontSize: 16,
    fontStyle: "italic",
  },

  // Text Mode
  textContainer: {
    alignItems: "center",
  },
  textNote: {
    fontSize: 48,
    fontWeight: "bold",
  },
  textMicIcon: {
    fontSize: 48,
    textShadowColor: "rgba(76, 175, 80, 1.0)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  textCents: {
    fontSize: 24,
    marginTop: 4,
  },
  textFreq: {
    color: "#666",
    fontSize: 14,
    marginTop: 4,
  },
  tuningIndicator: {
    color: "#888",
    fontSize: 16,
    marginTop: 8,
    fontWeight: "600",
  },

  // Settings Row (Temperament + Concert A)
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
  },

  // Temperament Toggle (styled like PitchDrone)
  temperamentToggle: {
    flexDirection: "row",
  },
  temperamentButtonLeft: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderWidth: 1,
    borderColor: "#9C27B0",
  },
  temperamentButtonRight: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: "#9C27B0",
  },
  temperamentButtonActive: {
    backgroundColor: "#9C27B0",
  },
  temperamentButtonInactive: {
    backgroundColor: "#2d232e",
  },
  temperamentButtonText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  temperamentButtonTextActive: {
    color: "#fff",
  },
  temperamentButtonTextInactive: {
    color: "#9C27B0",
  },

  // Minor 7th System Toggle (blue themed, 3-part)
  m7SystemContainer: {
    alignItems: "center",
    marginTop: 12,
  },
  m7SystemLabel: {
    color: "#64B5F6",
    fontSize: 11,
    marginBottom: 4,
    fontWeight: "600",
  },
  m7SystemToggle: {
    flexDirection: "row",
  },
  m7ButtonLeft: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  m7ButtonMiddle: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: "#2196F3",
  },
  m7ButtonRight: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: "#2196F3",
  },
  m7ButtonActive: {
    backgroundColor: "#2196F3",
  },
  m7ButtonInactive: {
    backgroundColor: "#1a2a3e",
  },
  m7ButtonText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  m7ButtonTextActive: {
    color: "#fff",
  },
  m7ButtonTextInactive: {
    color: "#64B5F6",
  },

  // Concert A Input
  concertARow: {
    flexDirection: "row",
    alignItems: "center",
  },
  concertALabel: {
    color: "#bfa76a",
    fontSize: 12,
    marginRight: 4,
  },
  concertAInput: {
    backgroundColor: "#2d232e",
    color: "#FFD700",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    width: 60,
    textAlign: "center",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#444",
  },
  concertAUnit: {
    color: "#bfa76a",
    fontSize: 12,
    marginLeft: 4,
  },

  // Key Selector
  keySelector: {
    alignItems: "center",
    marginTop: 12,
  },
  keySelectorLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  keyGrid: {
    alignItems: "center",
    gap: 6,
  },
  keyRow: {
    flexDirection: "row",
    gap: 6,
  },
  keyOption: {
    width: 68,
    height: 32,
    borderRadius: 4,
    backgroundColor: "#2a2a3e",
    alignItems: "center",
    justifyContent: "center",
  },
  keyOptionActive: {
    backgroundColor: "#4CAF50",
  },
  keyOptionText: {
    color: "#888",
    fontSize: 11,
    fontWeight: "600",
  },
  keyOptionTextActive: {
    color: "#FFFFFF",
  },
});

export default Tuner;
