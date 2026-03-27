/**
 * useTimingExerciseState - State management for timing-based exercises
 *
 * Designed for exercises like StartOnCueExercise that focus on:
 * - Playing on a specific beat
 * - Timing accuracy
 * - Rhythm entry
 *
 * Phase flow: ready → counting → listening → feedback → (repeat or complete)
 *
 * Unlike useLessonExerciseState (for sing/play lesson exercises), this hook
 * is optimized for metronome-based timing drills.
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { Animated } from "react-native";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Timing exercise phases */
export type TimingExercisePhase =
  | "ready"
  | "counting"
  | "listening"
  | "feedback";

/** Feedback types for timing exercises */
export type TimingFeedback =
  | "perfect"
  | "good"
  | "early"
  | "late"
  | "missed"
  | "wrong_note"
  | null;

/** Wrong note information */
export interface WrongNoteInfo {
  detectedNote: string;
  direction: "higher" | "lower";
}

/** Configuration for useTimingExerciseState */
export interface TimingExerciseConfig {
  /** BPM for metronome (default: 60) */
  bpm?: number;
  /** Beats per measure (default: 4) */
  beatsPerMeasure?: number;
  /** Number of prep/count-in beats (default: 4) */
  prepBeats?: number;
  /** Correct streak needed for mastery (default: 8) */
  masteryStreak?: number;
  /** Timing tolerance in ms (default: 450) */
  timingToleranceMs?: number;
  /** Target beat to play on (default: 1) */
  targetBeat?: number;
}

/** Progress update sent to parent */
export interface TimingProgressUpdate {
  streak: number;
  masteryRequired: number;
  totalAttempts: number;
}

/** Completion result sent to parent */
export interface TimingCompletionResult {
  success: boolean;
  streak: number;
  totalAttempts: number;
  correctCount: number;
}

/** Return type for useTimingExerciseState */
export interface TimingExerciseStateReturn {
  // Phase state
  phase: TimingExercisePhase;
  setPhase: (phase: TimingExercisePhase) => void;

  // Metronome state
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentBeat: number;
  setCurrentBeat: (beat: number) => void;
  prepCount: number;
  setPrepCount: (count: number) => void;

  // Configuration values (computed from config)
  bpm: number;
  beatsPerMeasure: number;
  prepBeats: number;
  masteryStreak: number;
  timingToleranceMs: number;
  targetBeat: number;
  beatIntervalMs: number;

  // Progress state
  streak: number;
  totalAttempts: number;
  masteryReached: boolean;

  // Feedback state
  lastFeedback: TimingFeedback;
  wrongNoteInfo: WrongNoteInfo | null;
  feedbackColor: string;
  feedbackText: string;

  // Entry state
  waitingForEntry: boolean;
  setWaitingForEntry: (waiting: boolean) => void;
  isPlayingNote: boolean;
  setIsPlayingNote: (playing: boolean) => void;

  // Animation values
  pulseAnim: Animated.Value;
  feedbackOpacity: Animated.Value;

  // Refs for external access
  unmountedRef: React.MutableRefObject<boolean>;
  hasEnteredRef: React.MutableRefObject<boolean>;
  lastBeatOneTimeRef: React.MutableRefObject<number>;
  measureCountRef: React.MutableRefObject<number>;
  currentBeatRef: React.MutableRefObject<number>;

  // Actions
  handleCorrectEntry: (quality: "perfect" | "good") => void;
  handleIncorrectTiming: (timing: "early" | "late" | "missed") => void;
  handleWrongNote: (
    detectedNote: string,
    direction: "higher" | "lower",
  ) => void;
  startExercise: () => void;
  resetForNewRound: () => void;
  resetAll: () => void;

  // Animation helpers
  animatePulse: (isBeatOne?: boolean) => void;
  showFeedback: (feedback: TimingFeedback) => void;
}

// -----------------------------------------------------------------------------
// Default Values
// -----------------------------------------------------------------------------

const DEFAULT_CONFIG: Required<TimingExerciseConfig> = {
  bpm: 60,
  beatsPerMeasure: 4,
  prepBeats: 4,
  masteryStreak: 8,
  timingToleranceMs: 450,
  targetBeat: 1,
};

const FEEDBACK_COLORS: Record<TimingFeedback & string, string> = {
  perfect: "#4CAF50",
  good: "#8BC34A",
  early: "#FF9800",
  late: "#FF5722",
  missed: "#f44336",
  wrong_note: "#9C27B0",
};

// -----------------------------------------------------------------------------
// Hook Implementation
// -----------------------------------------------------------------------------

/**
 * State management hook for timing-based exercises
 *
 * @example
 * ```tsx
 * const timing = useTimingExerciseState({
 *   bpm: 60,
 *   masteryStreak: 8,
 *   prepBeats: 4,
 * });
 *
 * // Start the exercise
 * timing.startExercise();
 *
 * // Handle correct entry
 * timing.handleCorrectEntry('perfect');
 *
 * // Check mastery
 * if (timing.masteryReached) { onComplete(...) }
 * ```
 */
export function useTimingExerciseState(
  config: TimingExerciseConfig = {},
): TimingExerciseStateReturn {
  // Merge config with defaults
  const bpm = config.bpm ?? DEFAULT_CONFIG.bpm;
  const beatsPerMeasure =
    config.beatsPerMeasure ?? DEFAULT_CONFIG.beatsPerMeasure;
  const prepBeats = config.prepBeats ?? DEFAULT_CONFIG.prepBeats;
  const masteryStreak = config.masteryStreak ?? DEFAULT_CONFIG.masteryStreak;
  const timingToleranceMs =
    config.timingToleranceMs ?? DEFAULT_CONFIG.timingToleranceMs;
  const targetBeat = config.targetBeat ?? DEFAULT_CONFIG.targetBeat;

  // Computed values
  const beatIntervalMs = (60 / bpm) * 1000;

  // ---------------------------------------------------------------------------
  // Phase State
  // ---------------------------------------------------------------------------
  const [phase, setPhase] = useState<TimingExercisePhase>("ready");

  // ---------------------------------------------------------------------------
  // Metronome State
  // ---------------------------------------------------------------------------
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [prepCount, setPrepCount] = useState(prepBeats);

  // ---------------------------------------------------------------------------
  // Progress State
  // ---------------------------------------------------------------------------
  const [streak, setStreak] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);

  const masteryReached = streak >= masteryStreak;

  // ---------------------------------------------------------------------------
  // Feedback State
  // ---------------------------------------------------------------------------
  const [lastFeedback, setLastFeedback] = useState<TimingFeedback>(null);
  const [wrongNoteInfo, setWrongNoteInfo] = useState<WrongNoteInfo | null>(
    null,
  );

  const feedbackColor = lastFeedback ? FEEDBACK_COLORS[lastFeedback] : "#888";

  const getFeedbackText = useCallback((): string => {
    switch (lastFeedback) {
      case "perfect":
        return "Perfect! 🎯";
      case "good":
        return "Good!";
      case "early":
        return "Too early!";
      case "late":
        return "Too late!";
      case "missed":
        return "Missed!";
      case "wrong_note":
        if (wrongNoteInfo) {
          return `Wrong note! Heard ${wrongNoteInfo.detectedNote} - play ${wrongNoteInfo.direction}`;
        }
        return "Wrong note!";
      default:
        return "";
    }
  }, [lastFeedback, wrongNoteInfo]);

  // ---------------------------------------------------------------------------
  // Entry State
  // ---------------------------------------------------------------------------
  const [waitingForEntry, setWaitingForEntry] = useState(false);
  const [isPlayingNote, setIsPlayingNote] = useState(false);

  // ---------------------------------------------------------------------------
  // Animation Values
  // ---------------------------------------------------------------------------
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [feedbackOpacity] = useState(() => new Animated.Value(0));

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  const unmountedRef = useRef(false);
  const hasEnteredRef = useRef(false);
  const lastBeatOneTimeRef = useRef(0);
  const measureCountRef = useRef(0);
  const currentBeatRef = useRef(0);

  // Track unmount
  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Animation Helpers
  // ---------------------------------------------------------------------------
  const animatePulse = useCallback(
    (isBeatOne = false) => {
      const scale = isBeatOne ? 1.3 : 1.15;
      pulseAnim.setValue(scale);
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    },
    [pulseAnim],
  );

  const showFeedback = useCallback(
    (feedback: TimingFeedback) => {
      setLastFeedback(feedback);
      if (feedback !== "wrong_note") {
        setWrongNoteInfo(null);
      }
      feedbackOpacity.setValue(1);
      Animated.timing(feedbackOpacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start();
    },
    [feedbackOpacity],
  );

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const handleCorrectEntry = useCallback(
    (quality: "perfect" | "good") => {
      if (unmountedRef.current) return;

      setStreak((s) => s + 1);
      setTotalAttempts((t) => t + 1);
      setWrongNoteInfo(null);
      showFeedback(quality);
      setWaitingForEntry(false);
      setPhase("feedback");
    },
    [showFeedback],
  );

  const handleIncorrectTiming = useCallback(
    (timing: "early" | "late" | "missed") => {
      if (unmountedRef.current) return;

      setStreak(0);
      setTotalAttempts((t) => t + 1);
      setWrongNoteInfo(null);
      showFeedback(timing);
      setWaitingForEntry(false);
      setPhase("feedback");
    },
    [showFeedback],
  );

  const handleWrongNote = useCallback(
    (detectedNote: string, direction: "higher" | "lower") => {
      if (unmountedRef.current) return;

      setStreak(0);
      setTotalAttempts((t) => t + 1);
      setWrongNoteInfo({ detectedNote, direction });
      showFeedback("wrong_note");
      setWaitingForEntry(false);
      setPhase("feedback");
    },
    [showFeedback],
  );

  const startExercise = useCallback(() => {
    if (unmountedRef.current) return;

    setIsPlaying(true);
    setPhase("counting");
    setPrepCount(prepBeats);
    hasEnteredRef.current = false;
    measureCountRef.current = 0;
  }, [prepBeats]);

  const resetForNewRound = useCallback(() => {
    if (unmountedRef.current) return;

    setPhase("counting");
    setPrepCount(prepBeats);
    setCurrentBeat(0);
    setWaitingForEntry(false);
    hasEnteredRef.current = false;
    measureCountRef.current = 0;
  }, [prepBeats]);

  const resetAll = useCallback(() => {
    if (unmountedRef.current) return;

    setPhase("ready");
    setIsPlaying(false);
    setCurrentBeat(0);
    setPrepCount(prepBeats);
    setStreak(0);
    setTotalAttempts(0);
    setLastFeedback(null);
    setWrongNoteInfo(null);
    setWaitingForEntry(false);
    setIsPlayingNote(false);
    hasEnteredRef.current = false;
    measureCountRef.current = 0;
    currentBeatRef.current = 0;
    lastBeatOneTimeRef.current = 0;
    pulseAnim.setValue(1);
    feedbackOpacity.setValue(0);
  }, [prepBeats, pulseAnim, feedbackOpacity]);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    // Phase state
    phase,
    setPhase,

    // Metronome state
    isPlaying,
    setIsPlaying,
    currentBeat,
    setCurrentBeat,
    prepCount,
    setPrepCount,

    // Configuration values
    bpm,
    beatsPerMeasure,
    prepBeats,
    masteryStreak,
    timingToleranceMs,
    targetBeat,
    beatIntervalMs,

    // Progress state
    streak,
    totalAttempts,
    masteryReached,

    // Feedback state
    lastFeedback,
    wrongNoteInfo,
    feedbackColor,
    feedbackText: getFeedbackText(),

    // Entry state
    waitingForEntry,
    setWaitingForEntry,
    isPlayingNote,
    setIsPlayingNote,

    // Animation values
    pulseAnim,
    feedbackOpacity,

    // Refs
    unmountedRef,
    hasEnteredRef,
    lastBeatOneTimeRef,
    measureCountRef,
    currentBeatRef,

    // Actions
    handleCorrectEntry,
    handleIncorrectTiming,
    handleWrongNote,
    startExercise,
    resetForNewRound,
    resetAll,

    // Animation helpers
    animatePulse,
    showFeedback,
  };
}
