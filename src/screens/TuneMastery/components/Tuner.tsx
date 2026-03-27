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
  Animated,
  Modal,
  ScrollView,
  useWindowDimensions,
  Platform,
} from "react-native";
import Svg, { Path, Line, Text as SvgText, Circle } from "react-native-svg";
import { usePitchDetection } from "../../../hooks/usePitchDetection";
import { devLog } from "../../../utils/devLogger";

// Import extracted styles
import { tunerStyles as styles } from "./Tuner/tunerStyles";
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
  isCentered,
  computeDirectionBias,
  computeDirectionalGuidance,
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
  NEEDLE_SPRING_TENSION,
  NEEDLE_SPRING_FRICTION,
  DRIFT_TRAIL_DURATION_MS,
  DRIFT_TRAIL_SAMPLES,
  DRIFT_TRAIL_INTERVAL_MS,
  DIRECTION_BIAS_WINDOW_MS,
} from "./Tuner/tunerConstants";

// Import session stats for Phase 2A
import {
  createInitialSessionStats,
  recordSessionSample,
  resetSessionStats,
  calculateSessionScores,
  calculateAttackSummary,
  type SessionStats,
} from "./Tuner/tunerSessionStats";

// Import challenge mode for Phase 2A
import {
  createInitialChallengeState,
  createRandomChallenge,
  createChallengeTarget,
  startChallenge,
  updateChallengeState,
  cancelChallenge,
  resetAfterSuccess,
  getChallengeInstructionText,
  getChallengeStatusText,
  getChallengeProgressColor,
  DEFAULT_CHALLENGE_NOTES,
  type ChallengeState,
  type ChallengeDifficulty,
} from "./Tuner/tunerChallenge";
import { CHALLENGE_DIFFICULTIES } from "./Tuner/tunerConstants";

// Import shared tuning settings component and types
import TuningSettingsButton, {
  type Minor7System,
  type Temperament,
  MINOR_7TH_RATIOS,
  MINOR_7TH_LABELS,
  KEY_DISPLAY_NAMES,
} from "../../../components/TuningSettingsButton";

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
  devLog(
    `[JUST] note=${noteName}, key=${keyName}, noteIdx=${noteIndex}, keyIdx=${keyIndex}, semitones=${semitonesAboveTonic}, ratio=${justRatio.toFixed(4)}, tonicFreq=${tonicFreq.toFixed(2)}, equalTemp=${equalTempFreq?.toFixed(2)}, justFreq=${justFreq.toFixed(2)}${m7Info}`,
  );

  return justFreq;
}

export type TunerMode = "needle" | "text";

// Re-export types from shared component for convenience
export type { Minor7System, Temperament };

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
  // Responsive sizing - scales to fit screen
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Horizontal: gauge scaling
  const GAUGE_BASE_WIDTH = 360; // SVG width
  const GAUGE_BASE_HEIGHT = 180;
  // Visual width including -50/+50 labels that extend beyond SVG (~15px each side)
  const GAUGE_VISUAL_WIDTH = 390;
  // Account for tuner container padding (12px each side)
  const maxGaugeWidth = screenWidth - 48;
  const gaugeScale = Math.min(1, maxGaugeWidth / GAUGE_VISUAL_WIDTH);

  // Vertical: responsive gaps between stacked elements
  // Min screen: 568px -> gaps of 2px
  // Max comfortable: 700px+ -> gaps of 20px
  const MIN_HEIGHT = 568;
  const MAX_HEIGHT = 700;
  const MIN_GAP = 2;
  const MAX_GAP = 20;
  const heightRatio = Math.min(
    1,
    Math.max(0, (screenHeight - MIN_HEIGHT) / (MAX_HEIGHT - MIN_HEIGHT)),
  );
  const verticalGap = Math.round(MIN_GAP + heightRatio * (MAX_GAP - MIN_GAP));

  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [cents, setCents] = useState(0);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [activeTemperament, setActiveTemperament] =
    useState<Temperament>(initialTemperament);
  const [selectedKeyIndex, setSelectedKeyIndex] = useState(initialKeyIndex); // 0 = C
  const [concertA, setConcertA] = useState(String(initialConcertA));
  const [minor7System, setMinor7System] = useState<Minor7System>("pythagorean");
  // Feedback display mode: 0=Deviation, 1=Guidance, 2=Stability, 3=Tendency
  const [feedbackMode, setFeedbackMode] = useState(0);
  // Active panel: "stats", "challenge", or null (just buttons)
  const [activePanel, setActivePanel] = useState<"stats" | "challenge" | null>(
    null,
  );
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

  // Refs to avoid stale closure in handlePitchDetected (must be declared before useEffect)
  const warmupCompleteRef = useRef<boolean>(false);
  const stabilityStdDevRef = useRef<number>(0);

  // Keep refs in sync with tunerState for session stats (avoids stale closure)
  useEffect(() => {
    warmupCompleteRef.current = tunerState.warmupComplete;
    stabilityStdDevRef.current = tunerState.stability.stdDev;
  }, [tunerState.warmupComplete, tunerState.stability.stdDev]);

  // Lock glow animation (Phase 1 UX)
  const lockGlowAnim = useRef(new Animated.Value(0)).current;
  const wasLockedRef = useRef(false);

  // Spring needle animation (Phase 1C)
  const needleRotationAnim = useRef(new Animated.Value(0)).current;

  // Drift trail history (Phase 1C) - stores {cents, timestamp} for fading trail
  const driftTrailRef = useRef<Array<{ cents: number; timestamp: number }>>([]);
  const lastTrailSampleRef = useRef<number>(0);

  // Direction bias history (Phase 1C) - stores {cents, timestamp} for longer window
  const biasHistoryRef = useRef<Array<{ cents: number; timestamp: number }>>(
    [],
  );

  // Session stats tracking (Phase 2A)
  const [sessionStats, setSessionStats] = useState<SessionStats>(
    createInitialSessionStats,
  );
  // Track if next sample after warmup is an attack sample
  const isAttackSampleRef = useRef<boolean>(true);
  // Track last note for attack detection (new note = new attack)
  const attackNoteRef = useRef<string | null>(null);

  // Target tone challenge state (Phase 2A)
  const [challengeState, setChallengeState] = useState<ChallengeState>(
    createInitialChallengeState,
  );
  const [challengeDifficulty, setChallengeDifficulty] =
    useState<ChallengeDifficulty>("medium");

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
      // Reset attack sample tracking (next note will be an attack)
      isAttackSampleRef.current = true;
      attackNoteRef.current = null;
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

        // Track drift trail history (Phase 1C) - sample at lower rate for performance
        if (
          TUNER_FLAGS.driftTrail &&
          now - lastTrailSampleRef.current >= DRIFT_TRAIL_INTERVAL_MS
        ) {
          driftTrailRef.current.push({ cents: roundedCents, timestamp: now });
          lastTrailSampleRef.current = now;
          // Remove samples older than DRIFT_TRAIL_DURATION_MS
          const cutoffTime = now - DRIFT_TRAIL_DURATION_MS;
          while (
            driftTrailRef.current.length > 0 &&
            driftTrailRef.current[0].timestamp < cutoffTime
          ) {
            driftTrailRef.current.shift();
          }
          // Also cap at max samples
          while (driftTrailRef.current.length > DRIFT_TRAIL_SAMPLES) {
            driftTrailRef.current.shift();
          }
        }

        // Track direction bias history (Phase 1C) - longer window for tendency detection
        if (TUNER_FLAGS.directionBias) {
          biasHistoryRef.current.push({ cents: roundedCents, timestamp: now });
          // Remove samples older than DIRECTION_BIAS_WINDOW_MS
          const biasCutoffTime = now - DIRECTION_BIAS_WINDOW_MS;
          while (
            biasHistoryRef.current.length > 0 &&
            biasHistoryRef.current[0].timestamp < biasCutoffTime
          ) {
            biasHistoryRef.current.shift();
          }
        }

        // Dispatch to state machine
        dispatchTuner({
          type: "SIGNAL_DETECTED",
          cents: roundedCents,
          centsHistory: stabilityHistoryRef.current,
          timestamp: now,
        });
        lastPitchTimeRef.current = now;

        // Session stats recording (Phase 2A)
        // Only record after warmup is complete (read from ref to avoid stale closure)
        if (TUNER_FLAGS.sessionStats && warmupCompleteRef.current) {
          // Detect attack: new note or first sample after warmup
          const isNewNote = note !== attackNoteRef.current;
          const isAttack = isNewNote || isAttackSampleRef.current;

          if (isNewNote) {
            attackNoteRef.current = note;
          }
          isAttackSampleRef.current = false;

          setSessionStats((prev) =>
            recordSessionSample(prev, {
              cents: roundedCents,
              stdDev: stabilityStdDevRef.current,
              note,
              isAttackSample: isAttack,
            }),
          );
        }

        // Target tone challenge update (Phase 2A)
        if (TUNER_FLAGS.targetToneChallenge) {
          setChallengeState((prev) =>
            updateChallengeState(prev, note, roundedCents, now),
          );
        }

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
        // Clear drift trail when signal lost
        driftTrailRef.current = [];
        // Reset attack sample tracking (next note will be an attack)
        isAttackSampleRef.current = true;
        attackNoteRef.current = null;
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

  // Is centered for target circle coloring
  const centered = currentNote ? isCentered(cents) : false;

  // Direction bias (Phase 1C) - detect habitual sharp/flat tendency
  const directionBias = computeDirectionBias(
    biasHistoryRef.current.map((s) => s.cents),
  );

  // Directional guidance (Phase 1C) - convert measurement to instruction
  const directionalGuidance = computeDirectionalGuidance(cents);

  // Lock glow animation effect - triggers once when lock is first achieved
  useEffect(() => {
    if (showLock && !wasLockedRef.current) {
      // Lock just achieved - trigger glow animation
      // Brief pulse (0 -> 1) over 300ms, then settle to subtle glow (0.5)
      Animated.sequence([
        Animated.timing(lockGlowAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(lockGlowAnim, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    } else if (!showLock && wasLockedRef.current) {
      // Lock lost - reset glow
      lockGlowAnim.setValue(0);
    }
    wasLockedRef.current = showLock;
  }, [showLock, lockGlowAnim]);

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

  // Spring needle animation - gives physical feeling of inertia (Phase 1C)
  const targetRotation = getNeedleRotation();
  useEffect(() => {
    if (TUNER_FLAGS.springNeedle) {
      Animated.spring(needleRotationAnim, {
        toValue: targetRotation,
        tension: NEEDLE_SPRING_TENSION,
        friction: NEEDLE_SPRING_FRICTION,
        useNativeDriver: Platform.OS !== "web",
      }).start();
    } else {
      // Instant rotation when spring is disabled
      needleRotationAnim.setValue(targetRotation);
    }
  }, [targetRotation, needleRotationAnim]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.tunerScrollView}
        contentContainerStyle={[
          styles.tunerScrollContent,
          { paddingTop: verticalGap + 4 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Error Message */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Tuning Settings Button (shared component) */}
        <TuningSettingsButton
          temperament={activeTemperament}
          concertA={concertA}
          keyIndex={selectedKeyIndex}
          minor7System={minor7System}
          onTemperamentChange={setActiveTemperament}
          onConcertAChange={setConcertA}
          onKeyIndexChange={setSelectedKeyIndex}
          onMinor7SystemChange={setMinor7System}
          style={{ marginBottom: verticalGap + 2 }}
        />

        {/* Tuner Display */}
        <View style={styles.tunerDisplay}>
          {mode === "needle" ? (
            // Needle Mode - Semicircular gauge (responsive scaling)
            <View style={styles.needleContainer}>
              {/* Scaling container for responsive gauge */}
              <View
                style={[
                  styles.gaugeScalingContainer,
                  {
                    width: GAUGE_BASE_WIDTH * gaugeScale,
                    height: GAUGE_BASE_HEIGHT * gaugeScale,
                  },
                ]}
              >
                {/* Gauge arc and needle - scaled from top-left */}
                <View
                  style={[
                    styles.gaugeArc,
                    {
                      transform: [{ scale: gaugeScale }],
                      transformOrigin: "top left",
                    },
                  ]}
                >
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
                    {/* Drift Trail - faint ghost trail showing recent pitch movement (Phase 1C) */}
                    {TUNER_FLAGS.driftTrail &&
                      currentNote &&
                      driftTrailRef.current.map((sample, index) => {
                        const cx = 180;
                        const cy = 160;
                        const trailR = 105; // Slightly inside the gauge arc
                        // Clamp cents to -50/+50 range for angle calculation
                        const clampedCents = Math.max(
                          -50,
                          Math.min(50, sample.cents),
                        );
                        const angle = 270 + (clampedCents / 50) * 90;
                        const rad = (angle * Math.PI) / 180;
                        const x = cx + trailR * Math.cos(rad);
                        const y = cy + trailR * Math.sin(rad);
                        // Opacity fades from newest (last) to oldest (first)
                        const ageRatio =
                          index / Math.max(1, driftTrailRef.current.length - 1);
                        const opacity = 0.1 + 0.35 * (1 - ageRatio); // 0.45 newest → 0.1 oldest
                        return (
                          <Circle
                            key={`trail-${index}-${sample.timestamp}`}
                            cx={x}
                            cy={y}
                            r={3}
                            fill={`rgba(100, 200, 255, ${opacity})`}
                          />
                        );
                      })}
                    {/* Center Target Circle - visual aiming reference */}
                    {/* Position at top of arc (0 cents = 270° = (180, 40)) */}
                    <Circle
                      cx={180}
                      cy={40}
                      r={8}
                      fill={
                        showLock
                          ? "#4CAF50"
                          : centered
                            ? "rgba(76, 175, 80, 0.4)"
                            : "rgba(100, 100, 100, 0.3)"
                      }
                      stroke={
                        showLock
                          ? "#4CAF50"
                          : centered
                            ? "rgba(76, 175, 80, 0.6)"
                            : "rgba(150, 150, 150, 0.4)"
                      }
                      strokeWidth={showLock ? 2 : 1}
                    />
                    {/* Outer glow ring when locked */}
                    {showLock && (
                      <Circle
                        cx={180}
                        cy={40}
                        r={12}
                        fill="none"
                        stroke="rgba(76, 175, 80, 0.3)"
                        strokeWidth={3}
                      />
                    )}
                  </Svg>

                  {/* Needle - rotates around bottom center with spring physics */}
                  <View style={styles.needlePivotBase}>
                    <Animated.View
                      style={[
                        styles.needleRotator,
                        {
                          transform: [
                            {
                              rotate: needleRotationAnim.interpolate({
                                inputRange: [-90, 90],
                                outputRange: ["-90deg", "90deg"],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <View
                        style={[styles.needle, { backgroundColor: "#FFFFFF" }]}
                      />
                    </Animated.View>
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
                          <SvgText
                            x={6}
                            y={11}
                            fontSize={8}
                            textAnchor="middle"
                          >
                            ⭐
                          </SvgText>
                          <SvgText
                            x={18}
                            y={11}
                            fontSize={8}
                            textAnchor="middle"
                          >
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
              </View>

              {/* Note Display below gauge - fixed height container */}
              <View
                style={[styles.noteContainer, { marginTop: -8 + verticalGap }]}
              >
                {/* Note name row - always rendered with fixed height */}
                <View style={styles.noteNameRow}>
                  {/* Skip button - shown during active challenge */}
                  {activePanel === "challenge" && challengeState.isActive && (
                    <TouchableOpacity
                      onPress={() => {
                        const newChallenge = createRandomChallenge(
                          DEFAULT_CHALLENGE_NOTES,
                          challengeDifficulty,
                        );
                        setChallengeState(
                          startChallenge(
                            cancelChallenge(challengeState),
                            newChallenge,
                          ),
                        );
                      }}
                      style={styles.noteRowSkipButton}
                      accessibilityLabel="Skip to next note"
                      accessibilityRole="button"
                    >
                      <Text style={styles.noteRowSkipText}>Skip</Text>
                    </TouchableOpacity>
                  )}
                  {/* Spacer when no skip button */}
                  {!(
                    activePanel === "challenge" && challengeState.isActive
                  ) && <View style={styles.noteRowButtonSpacer} />}
                  {currentNote ? (
                    <Text style={[styles.noteName, { color: tuneColor }]}>
                      {currentNote}
                    </Text>
                  ) : (
                    <Text style={styles.micIcon}>🎤</Text>
                  )}
                  {/* Stop button - shown during active challenge */}
                  {activePanel === "challenge" && challengeState.isActive && (
                    <TouchableOpacity
                      onPress={() =>
                        setChallengeState(cancelChallenge(challengeState))
                      }
                      style={styles.noteRowStopButton}
                      accessibilityLabel="Stop challenge"
                      accessibilityRole="button"
                    >
                      <Text style={styles.noteRowStopText}>Stop</Text>
                    </TouchableOpacity>
                  )}
                  {/* Spacer when no stop button */}
                  {!(
                    activePanel === "challenge" && challengeState.isActive
                  ) && <View style={styles.noteRowButtonSpacer} />}
                </View>
                {/* Tappable feedback area - cycles through modes (hidden during challenge) */}
                {activePanel !== "challenge" && (
                  <TouchableOpacity
                    style={[styles.feedbackArea, { marginTop: verticalGap }]}
                    onPress={() => setFeedbackMode((prev) => (prev + 1) % 4)}
                    activeOpacity={0.7}
                    accessibilityLabel="Tap to cycle feedback display"
                    accessibilityRole="button"
                  >
                    <View style={styles.feedbackContent}>
                      {feedbackMode === 0 &&
                        currentNote &&
                        // Mode 0: Deviation (60¢ SHARP / PERFECT)
                        (TUNER_FLAGS.stateLanguage ? (
                          <Text
                            style={[styles.stateText, { color: tuneColor }]}
                          >
                            {stateText}
                          </Text>
                        ) : (
                          <Text style={styles.centsDisplay}>
                            {cents > 0 ? "+" : ""}
                            {cents} cents
                          </Text>
                        ))}
                      {feedbackMode === 1 &&
                        currentNote &&
                        !isDetectingPhase(tunerState) &&
                        // Mode 1: Guidance (Lower pitch a lot)
                        (directionalGuidance.text ? (
                          <Text
                            style={[
                              styles.guidanceText,
                              {
                                color:
                                  directionalGuidance.direction === "lower"
                                    ? "#FF9800"
                                    : "#2196F3",
                              },
                            ]}
                          >
                            {directionalGuidance.text}
                          </Text>
                        ) : (
                          <Text
                            style={[styles.guidanceText, { color: "#4CAF50" }]}
                          >
                            On target
                          </Text>
                        ))}
                      {feedbackMode === 2 &&
                        currentNote &&
                        !isDetectingPhase(tunerState) && (
                          // Mode 2: Stability (STABLE / DRIFTING / UNSTABLE)
                          <View style={styles.stabilityContent}>
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
                                  ? "DRIFTING"
                                  : "UNSTABLE"}
                            </Text>
                          </View>
                        )}
                      {feedbackMode === 3 &&
                        currentNote &&
                        !isDetectingPhase(tunerState) &&
                        // Mode 3: Tendency (Strong sharp tendency)
                        (directionBias.biasText ? (
                          <Text
                            style={[
                              styles.biasIndicator,
                              {
                                color:
                                  directionBias.direction === "sharp"
                                    ? "#FF9800"
                                    : "#2196F3",
                              },
                            ]}
                          >
                            {directionBias.biasText}
                          </Text>
                        ) : (
                          <Text
                            style={[styles.biasIndicator, { color: "#888" }]}
                          >
                            No tendency yet
                          </Text>
                        ))}
                      {!currentNote && (
                        <Text style={styles.feedbackPlaceholder}>
                          <Text style={styles.feedbackModeName}>
                            {
                              [
                                "Deviation",
                                "Guidance",
                                "Stability",
                                "Tendency",
                              ][feedbackMode]
                            }
                          </Text>
                          {" — Waiting for pitch..."}
                        </Text>
                      )}
                    </View>
                    {/* Dot indicators */}
                    <View style={styles.feedbackDots}>
                      {[0, 1, 2, 3].map((i) => (
                        <View
                          key={i}
                          style={[
                            styles.feedbackDot,
                            feedbackMode === i && styles.feedbackDotActive,
                          ]}
                        />
                      ))}
                    </View>
                  </TouchableOpacity>
                )}
                {/* Fixed-height row for Lock/Hold Indicator (Phase 1) - hidden during challenge */}
                <View style={styles.lockHoldRow}>
                  {currentNote &&
                    TUNER_FLAGS.holdIndicator &&
                    showLock &&
                    activePanel !== "challenge" && (
                      <Animated.View
                        style={[
                          styles.lockIndicator,
                          {
                            backgroundColor: lockGlowAnim.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [
                                "rgba(0, 200, 0, 0.9)",
                                "rgba(50, 220, 50, 0.95)",
                                "rgba(100, 255, 100, 1)",
                              ],
                            }),
                            borderColor: lockGlowAnim.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [
                                "rgba(0, 180, 0, 1)",
                                "rgba(100, 255, 100, 1)",
                                "rgba(200, 255, 200, 1)",
                              ],
                            }),
                            borderWidth: 2,
                            transform: [
                              {
                                scale: lockGlowAnim.interpolate({
                                  inputRange: [0, 0.5, 1],
                                  outputRange: [1, 1.05, 1.15],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        <Text style={styles.lockText}>✓ LOCKED</Text>
                      </Animated.View>
                    )}
                  {currentNote &&
                    TUNER_FLAGS.holdIndicator &&
                    !showLock &&
                    holdProgress > 0 &&
                    activePanel !== "challenge" && (
                      <View style={styles.holdProgressContainer}>
                        <View
                          style={[
                            styles.holdProgressBar,
                            { width: `${holdProgress * 100}%` },
                          ]}
                        />
                      </View>
                    )}
                </View>
              </View>
            </View>
          ) : (
            // Text Mode - Single fixed-height container for both mic and note states
            <View style={styles.textContainer}>
              {/* Note name or mic icon */}
              <View style={styles.textNoteRow}>
                {currentNote ? (
                  <Text style={[styles.textNote, { color: tuneColor }]}>
                    {currentNote}
                  </Text>
                ) : (
                  <Text style={styles.textMicIcon}>🎤</Text>
                )}
              </View>
              {/* Frequency row */}
              <View style={styles.textFreqRow}>
                {currentNote && (
                  <Text style={styles.textFreq}>
                    {frequency ? `${frequency.toFixed(1)} Hz` : ""}
                  </Text>
                )}
              </View>
              {/* Tappable feedback area - cycles through modes (hidden during challenge) */}
              {activePanel !== "challenge" && (
                <TouchableOpacity
                  style={[styles.feedbackArea, { marginTop: verticalGap }]}
                  onPress={() => setFeedbackMode((prev) => (prev + 1) % 4)}
                  activeOpacity={0.7}
                  accessibilityLabel="Tap to cycle feedback display"
                  accessibilityRole="button"
                >
                  <View style={styles.feedbackContent}>
                    {feedbackMode === 0 &&
                      currentNote &&
                      // Mode 0: Deviation
                      (TUNER_FLAGS.stateLanguage ? (
                        <Text style={[styles.textCents, { color: tuneColor }]}>
                          {stateText}
                        </Text>
                      ) : (
                        <Text style={[styles.textCents, { color: tuneColor }]}>
                          {cents > 0 ? "+" : ""}
                          {cents} cents
                        </Text>
                      ))}
                    {feedbackMode === 1 &&
                      currentNote &&
                      !isDetectingPhase(tunerState) &&
                      // Mode 1: Guidance
                      (directionalGuidance.text ? (
                        <Text
                          style={[
                            styles.guidanceText,
                            {
                              color:
                                directionalGuidance.direction === "lower"
                                  ? "#FF9800"
                                  : "#2196F3",
                            },
                          ]}
                        >
                          {directionalGuidance.text}
                        </Text>
                      ) : (
                        <Text
                          style={[styles.guidanceText, { color: "#4CAF50" }]}
                        >
                          On target
                        </Text>
                      ))}
                    {feedbackMode === 2 &&
                      currentNote &&
                      !isDetectingPhase(tunerState) && (
                        // Mode 2: Stability
                        <View style={styles.stabilityContent}>
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
                                ? "DRIFTING"
                                : "UNSTABLE"}
                          </Text>
                        </View>
                      )}
                    {feedbackMode === 3 &&
                      currentNote &&
                      !isDetectingPhase(tunerState) &&
                      // Mode 3: Tendency
                      (directionBias.biasText ? (
                        <Text
                          style={[
                            styles.biasIndicator,
                            {
                              color:
                                directionBias.direction === "sharp"
                                  ? "#FF9800"
                                  : "#2196F3",
                            },
                          ]}
                        >
                          {directionBias.biasText}
                        </Text>
                      ) : (
                        <Text style={[styles.biasIndicator, { color: "#888" }]}>
                          No tendency yet
                        </Text>
                      ))}
                    {!currentNote && (
                      <Text style={styles.feedbackPlaceholder}>
                        <Text style={styles.feedbackModeName}>
                          {
                            ["Deviation", "Guidance", "Stability", "Tendency"][
                              feedbackMode
                            ]
                          }
                        </Text>
                        {" — Waiting for pitch..."}
                      </Text>
                    )}
                  </View>
                  {/* Dot indicators */}
                  <View style={styles.feedbackDots}>
                    {[0, 1, 2, 3].map((i) => (
                      <View
                        key={i}
                        style={[
                          styles.feedbackDot,
                          feedbackMode === i && styles.feedbackDotActive,
                        ]}
                      />
                    ))}
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Panel Buttons - shown when no panel is expanded */}
        {(TUNER_FLAGS.sessionStats || TUNER_FLAGS.targetToneChallenge) &&
          activePanel === null && (
            <View style={styles.panelToggle}>
              {TUNER_FLAGS.sessionStats && (
                <TouchableOpacity
                  style={styles.panelToggleButton}
                  onPress={() => setActivePanel("stats")}
                  accessibilityLabel="Open stats panel"
                  accessibilityRole="button"
                >
                  <Text style={styles.panelToggleText} numberOfLines={1}>
                    📊 Stats
                  </Text>
                </TouchableOpacity>
              )}
              {TUNER_FLAGS.targetToneChallenge && (
                <TouchableOpacity
                  style={styles.panelToggleButton}
                  onPress={() => setActivePanel("challenge")}
                  accessibilityLabel="Open challenge panel"
                  accessibilityRole="button"
                >
                  <Text style={styles.panelToggleText} numberOfLines={1}>
                    🎯 Challenge
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

        {/* Session Stats Panel - shown when activePanel === "stats" */}
        {TUNER_FLAGS.sessionStats && activePanel === "stats" && (
          <View
            style={[styles.sessionStatsPanel, { marginTop: verticalGap - 5 }]}
          >
            <View style={styles.sessionStatsHeader}>
              <Text style={styles.sessionStatsTitle}>📊 Session Stats</Text>
              <View style={styles.panelHeaderButtons}>
                <TouchableOpacity
                  onPress={() => setSessionStats(resetSessionStats())}
                  style={styles.sessionStatsReset}
                  accessibilityLabel="Reset session stats"
                  accessibilityRole="button"
                >
                  <Text style={styles.sessionStatsResetText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setActivePanel(null)}
                  style={styles.panelCloseButton}
                  accessibilityLabel="Close stats panel"
                  accessibilityRole="button"
                >
                  <Text style={styles.panelCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
            {sessionStats.hasEnoughData ? (
              <>
                <View style={styles.sessionScoresRow}>
                  <View style={styles.sessionScoreItem}>
                    <Text style={styles.sessionScoreValue}>
                      {calculateSessionScores(sessionStats).accuracy}%
                    </Text>
                    <Text style={styles.sessionScoreLabel}>Accuracy</Text>
                  </View>
                  <View style={styles.sessionScoreItem}>
                    <Text style={styles.sessionScoreValue}>
                      {calculateSessionScores(sessionStats).stability}%
                    </Text>
                    <Text style={styles.sessionScoreLabel}>Stability</Text>
                  </View>
                  <View style={styles.sessionScoreItem}>
                    <Text style={styles.sessionScoreValue}>
                      {calculateSessionScores(sessionStats).control}%
                    </Text>
                    <Text style={styles.sessionScoreLabel}>Control</Text>
                  </View>
                </View>
                {/* Fixed-height row for attack summary to prevent layout jumps */}
                <View style={styles.attackSummaryRow}>
                  {TUNER_FLAGS.attackSummary &&
                    calculateAttackSummary(sessionStats).summaryText && (
                      <Text
                        style={[
                          styles.attackSummaryText,
                          {
                            color:
                              calculateAttackSummary(sessionStats)
                                .attackDirection === "sharp"
                                ? "#FF9800"
                                : "#2196F3",
                          },
                        ]}
                      >
                        {calculateAttackSummary(sessionStats).summaryText}
                      </Text>
                    )}
                </View>
              </>
            ) : (
              <View style={styles.sessionStatsPlaceholder}>
                <Text style={styles.sessionStatsPlaceholderText}>
                  Play for a few seconds to see stats...
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Target Tone Challenge Panel - shown when activePanel === "challenge" */}
        {TUNER_FLAGS.targetToneChallenge && activePanel === "challenge" && (
          <View style={[styles.challengePanel, { marginTop: verticalGap - 5 }]}>
            {/* Challenge header with close button */}
            <View style={styles.challengePanelHeader}>
              <Text style={styles.challengePanelTitle}>🎯 Challenge</Text>
              <TouchableOpacity
                onPress={() => setActivePanel(null)}
                style={styles.panelCloseButton}
                accessibilityLabel="Close challenge panel"
                accessibilityRole="button"
              >
                <Text style={styles.panelCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            {challengeState.status === "idle" ? (
              // Challenge start UI
              <View style={styles.challengeStartContent}>
                <View style={styles.challengeDifficultyRow}>
                  {(
                    Object.keys(CHALLENGE_DIFFICULTIES) as ChallengeDifficulty[]
                  ).map((difficulty) => (
                    <TouchableOpacity
                      key={difficulty}
                      onPress={() => {
                        if (difficulty !== challengeDifficulty) {
                          setChallengeDifficulty(difficulty);
                          setChallengeState(createInitialChallengeState());
                        }
                      }}
                      style={[
                        styles.challengeDifficultyButton,
                        challengeDifficulty === difficulty &&
                          styles.challengeDifficultyButtonActive,
                      ]}
                      accessibilityLabel={`${difficulty} difficulty${challengeDifficulty === difficulty ? ", selected" : ""}`}
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          styles.challengeDifficultyText,
                          challengeDifficulty === difficulty &&
                            styles.challengeDifficultyTextActive,
                        ]}
                      >
                        {difficulty.charAt(0).toUpperCase() +
                          difficulty.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  onPress={() => {
                    const newChallenge = createRandomChallenge(
                      DEFAULT_CHALLENGE_NOTES,
                      challengeDifficulty,
                    );
                    setChallengeState(
                      startChallenge(challengeState, newChallenge),
                    );
                  }}
                  style={styles.challengeStartButton}
                  accessibilityLabel="Start challenge"
                  accessibilityRole="button"
                >
                  <Text style={styles.challengeStartButtonText}>
                    Start Challenge
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Active challenge UI
              <View style={styles.challengeActiveContent}>
                {challengeState.status === "success" ? (
                  <View style={styles.challengeInstructionRow}>
                    <Text style={styles.challengeSuccessText}>🎉 Success!</Text>
                  </View>
                ) : challengeState.status === "failed" ? (
                  <View style={styles.challengeInstructionRow}>
                    <Text style={styles.challengeFailedText}>❌ Failed!</Text>
                  </View>
                ) : (
                  challengeState.target && (
                    <View style={styles.challengeInstructionRow}>
                      <Text style={styles.challengeInstructionText}>Hold </Text>
                      <View style={styles.challengeInlineNote}>
                        <Text style={styles.challengeInlineNoteText}>
                          {challengeState.target.note}
                        </Text>
                      </View>
                      <Text style={styles.challengeInstructionText}>
                        {" "}
                        ±{challengeState.target.tolerance}¢ for{" "}
                        {(challengeState.target.durationMs / 1000).toFixed(1)}s
                      </Text>
                    </View>
                  )
                )}

                {/* Skip and Stop buttons - shown when NOT successful or failed */}
                {challengeState.status !== "success" &&
                  challengeState.status !== "failed" && (
                    <View style={styles.challengeButtonRow}>
                      <TouchableOpacity
                        onPress={() => {
                          const newChallenge = createRandomChallenge(
                            DEFAULT_CHALLENGE_NOTES,
                            challengeDifficulty,
                          );
                          setChallengeState(
                            startChallenge(
                              cancelChallenge(challengeState),
                              newChallenge,
                            ),
                          );
                        }}
                        style={styles.challengeSkipButton}
                        accessibilityLabel="Skip to next note"
                        accessibilityRole="button"
                      >
                        <Text style={styles.challengeSkipText}>Skip</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          setChallengeState(cancelChallenge(challengeState))
                        }
                        style={styles.challengeStopButton}
                        accessibilityLabel="Stop challenge"
                        accessibilityRole="button"
                      >
                        <Text style={styles.challengeStopText}>Stop</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                {/* Stop and Next buttons - shown on success */}
                {challengeState.status === "success" && (
                  <View style={styles.challengeButtonRow}>
                    <TouchableOpacity
                      onPress={() =>
                        setChallengeState(cancelChallenge(challengeState))
                      }
                      style={styles.challengeStopButton}
                      accessibilityLabel="Stop challenge"
                      accessibilityRole="button"
                    >
                      <Text style={styles.challengeStopText}>Stop</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        const newChallenge = createRandomChallenge(
                          DEFAULT_CHALLENGE_NOTES,
                          challengeDifficulty,
                        );
                        setChallengeState((prev) =>
                          startChallenge(resetAfterSuccess(prev), newChallenge),
                        );
                      }}
                      style={[
                        styles.challengeNextButton,
                        styles.challengeNextButtonSuccess,
                      ]}
                      accessibilityLabel="Next challenge"
                      accessibilityRole="button"
                    >
                      <Text style={styles.challengeNextButtonText}>Next →</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Progress bar */}
                {challengeState.target &&
                  (challengeState.status === "waiting" ||
                    challengeState.status === "holding") && (
                    <View style={styles.challengeProgressBar}>
                      <View
                        style={[
                          styles.challengeProgressFill,
                          {
                            width: `${Math.min(100, challengeState.progress * 100)}%`,
                            backgroundColor:
                              getChallengeProgressColor(challengeState),
                          },
                        ]}
                      />
                    </View>
                  )}

                {/* Stop and Retry buttons - shown on failure */}
                {challengeState.status === "failed" && (
                  <View style={styles.challengeButtonRow}>
                    <TouchableOpacity
                      onPress={() =>
                        setChallengeState(cancelChallenge(challengeState))
                      }
                      style={styles.challengeStopButton}
                      accessibilityLabel="Stop challenge"
                      accessibilityRole="button"
                    >
                      <Text style={styles.challengeStopText}>Stop</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        // Retry same note
                        if (challengeState.target) {
                          setChallengeState((prev) =>
                            startChallenge(
                              cancelChallenge(prev),
                              createChallengeTarget(
                                prev.target!.note,
                                challengeDifficulty,
                              ),
                            ),
                          );
                        }
                      }}
                      style={[
                        styles.challengeNextButton,
                        styles.challengeNextButtonRetry,
                      ]}
                      accessibilityLabel="Try again"
                      accessibilityRole="button"
                    >
                      <Text style={styles.challengeNextButtonText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Score display */}
                <View style={styles.challengeScoreRow}>
                  <Text style={styles.challengeScoreLabel}>Completed:</Text>
                  <Text style={styles.challengeScoreValue}>
                    {challengeState.completedCount}
                  </Text>
                  <Text style={styles.challengeStreakLabel}>Attempts:</Text>
                  <Text style={styles.challengeStreakValue}>
                    {challengeState.attemptCount}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
});

export default Tuner;
