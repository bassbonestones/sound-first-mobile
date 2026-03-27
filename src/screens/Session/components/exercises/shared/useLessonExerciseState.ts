/**
 * useLessonExerciseState - Core state management for lesson-style exercises
 *
 * Extracts common state patterns from:
 * - WholeNoteLessonExercise
 * - HalfNoteLessonExercise
 * - QuarterNoteLessonExercise
 * - WholeRestLessonExercise
 * - HalfRestLessonExercise
 * - QuarterRestLessonExercise
 * - Fragment2LessonExercise
 *
 * These exercises all follow the same phase flow:
 * Focus Card → Listen → Sing → Imagine → Play → Feedback
 *
 * And share common state patterns for:
 * - Phase management
 * - Playback state (isPlaying, currentBeat)
 * - Result tracking (singResult, playResult, attempts)
 * - Attestation flow
 * - UI state (showNotation, showCursor)
 *
 * State is managed via useReducer for predictable transitions.
 */
import { useReducer, useCallback, useRef, useEffect, useMemo } from "react";
import { LESSON_PHASES } from "./exerciseConstants";
import {
  lessonExerciseStateReducer,
  createInitialState,
} from "./lessonExerciseStateReducer";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Standard lesson phase type
 */
export type LessonPhase = (typeof LESSON_PHASES)[keyof typeof LESSON_PHASES];

/**
 * Exercise phase configuration - can extend base phases
 */
export interface PhaseConfig {
  /** Starting phase (defaults to FOCUS_CARD) */
  startPhase?: LessonPhase | string;
  /** Additional phases beyond standard LESSON_PHASES */
  additionalPhases?: Record<string, string>;
  /** Phase order for navigation (if not using standard order) */
  phaseOrder?: string[];
}

/**
 * Performance result from pitch/rhythm analysis
 */
export interface PerformanceResult {
  success: boolean;
  pitchOk?: boolean;
  rhythmOk?: boolean;
  message?: string;
  /** Whether user self-attested success */
  attested?: boolean;
}

/**
 * Pattern configuration for multi-pattern exercises (e.g., Fragment2)
 */
export interface PatternConfig {
  /** Unique pattern identifier */
  id: string;
  /** Display name */
  name: string;
  /** Pattern description (e.g., "1 → 2" for scale degrees) */
  description: string;
}

/**
 * Progress tracking for exercises with multiple rounds or patterns
 */
export interface ProgressState {
  /** Current pattern/round index */
  currentIndex: number;
  /** Completed pattern IDs or round numbers */
  completedItems: Record<string, boolean>;
  /** Total items to complete */
  totalItems: number;
  /** Whether exercise is complete */
  isComplete: boolean;
}

/**
 * Focus card configuration
 */
export interface FocusCard {
  category: string;
  name: string;
  description: string;
  cue: string;
}

/**
 * Configuration options for useLessonExerciseState
 */
export interface LessonExerciseStateConfig {
  /** Phase configuration */
  phases?: PhaseConfig;
  /** Number of successful rounds needed (default: 3) */
  masteryStreak?: number;
  /** Pattern definitions for multi-pattern exercises */
  patterns?: PatternConfig[];
  /** Focus cards for rotation */
  focusCards?: FocusCard[];
  /** Custom phase transition logic */
  onPhaseChange?: (newPhase: string, prevPhase: string) => void;
}

/**
 * Return type for useLessonExerciseState hook
 */
export interface LessonExerciseStateReturn {
  // Phase state
  phase: string;
  setPhase: (phase: string) => void;
  goToNextPhase: () => void;
  goToPrevPhase: () => void;
  resetPhase: () => void;

  // Playback state
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentBeat: number;
  setCurrentBeat: (beat: number) => void;
  isSubdivision: boolean;
  setIsSubdivision: (isSub: boolean) => void;

  // UI state
  showNotation: boolean;
  setShowNotation: (show: boolean) => void;
  showCursor: boolean;
  setShowCursor: (show: boolean) => void;
  hasHeardPattern: boolean;
  setHasHeardPattern: (heard: boolean) => void;

  // Sing phase state
  singResult: PerformanceResult | null;
  setSingResult: (result: PerformanceResult | null) => void;
  singAttempts: number;
  incrementSingAttempts: () => void;
  resetSingAttempts: () => void;

  // Play phase state
  playResult: PerformanceResult | null;
  setPlayResult: (result: PerformanceResult | null) => void;
  playAttempts: number;
  incrementPlayAttempts: () => void;
  resetPlayAttempts: () => void;

  // Attestation state
  showAttestModal: boolean;
  attestPhase: "sing" | "play" | null;
  openAttestModal: (phase: "sing" | "play") => void;
  closeAttestModal: () => void;
  confirmAttestation: () => void;

  // Success state
  showSuccess: boolean;
  setShowSuccess: (show: boolean) => void;
  successfulRounds: number;
  incrementSuccessfulRounds: () => void;
  resetSuccessfulRounds: () => void;

  // Progress state (for multi-pattern exercises)
  progress: ProgressState;
  markItemComplete: (itemId: string) => void;
  goToNextItem: () => void;
  goToItem: (index: number) => void;
  resetProgress: () => void;

  // Focus card state
  currentFocusCard: FocusCard | null;
  focusCardIndex: number;
  rotateFocusCard: () => void;

  // Refs for external access
  scrollViewRef: React.RefObject<{
    scrollTo: (options: { y: number; animated: boolean }) => void;
  } | null>;
  unmountedRef: React.RefObject<boolean>;

  // Combined reset
  resetForNewRound: () => void;
  resetAll: () => void;
}

// -----------------------------------------------------------------------------
// Default Values
// -----------------------------------------------------------------------------

const DEFAULT_PHASE_ORDER = [
  LESSON_PHASES.FOCUS_CARD,
  LESSON_PHASES.LISTEN,
  LESSON_PHASES.SING,
  LESSON_PHASES.IMAGINE,
  LESSON_PHASES.PLAY,
  LESSON_PHASES.FEEDBACK,
];

const DEFAULT_FOCUS_CARDS: FocusCard[] = [
  {
    category: "pitch",
    name: "Pitch Center",
    description: "Lock your ear onto the exact center of each pitch.",
    cue: "Hear the center. Sing the center. Play the center.",
  },
  {
    category: "projection",
    name: "Projection Intent",
    description: "Aim your sound at a point beyond the room.",
    cue: "Pick a target. Direct the sound. Fill the space.",
  },
  {
    category: "core_sound",
    name: "Core Sound",
    description: "Focus on the fundamental, centered tone.",
    cue: "Hear the fundamental. Center the tone. Maintain the core.",
  },
  {
    category: "rhythm",
    name: "Internal Pulse",
    description: "Feel the pulse inside you—steady and independent.",
    cue: "Find your pulse. Lock in. Trust your time.",
  },
];

// -----------------------------------------------------------------------------
// Hook Implementation
// -----------------------------------------------------------------------------

/**
 * Core state management hook for lesson-style exercises
 *
 * @example
 * ```tsx
 * const exercise = useLessonExerciseState({
 *   masteryStreak: 3,
 *   patterns: [
 *     { id: 'linear_up', name: 'Linear Up', description: '1 → 2' },
 *     { id: 'linear_down', name: 'Linear Down', description: '2 → 1' },
 *   ],
 * });
 *
 * // Phase management
 * exercise.goToNextPhase();
 *
 * // Result tracking
 * exercise.setSingResult({ success: true, pitchOk: true, rhythmOk: true });
 *
 * // Progress tracking
 * exercise.markItemComplete('linear_up');
 * ```
 */
export function useLessonExerciseState(
  config: LessonExerciseStateConfig = {},
): LessonExerciseStateReturn {
  const {
    phases = {},
    masteryStreak = 3,
    patterns = [],
    focusCards = DEFAULT_FOCUS_CARDS,
    onPhaseChange,
  } = config;

  // Compute phase order
  const phaseOrder = phases.phaseOrder ?? DEFAULT_PHASE_ORDER;
  const startPhase = phases.startPhase ?? LESSON_PHASES.FOCUS_CARD;

  // ---------------------------------------------------------------------------
  // Reducer State
  // ---------------------------------------------------------------------------
  const initialState = useMemo(
    () => createInitialState(startPhase),
    [startPhase],
  );
  const [state, dispatch] = useReducer(
    lessonExerciseStateReducer,
    initialState,
  );

  // Track previous phase for onPhaseChange callback
  const prevPhaseRef = useRef(state.phase);
  useEffect(() => {
    if (prevPhaseRef.current !== state.phase && onPhaseChange) {
      onPhaseChange(state.phase, prevPhaseRef.current);
    }
    prevPhaseRef.current = state.phase;
  }, [state.phase, onPhaseChange]);

  // ---------------------------------------------------------------------------
  // Phase Actions
  // ---------------------------------------------------------------------------
  const setPhase = useCallback((newPhase: string) => {
    dispatch({ type: "SET_PHASE", payload: newPhase });
  }, []);

  const goToNextPhase = useCallback(() => {
    dispatch({ type: "GO_TO_NEXT_PHASE", payload: { phaseOrder } });
  }, [phaseOrder]);

  const goToPrevPhase = useCallback(() => {
    dispatch({ type: "GO_TO_PREV_PHASE", payload: { phaseOrder } });
  }, [phaseOrder]);

  const resetPhase = useCallback(() => {
    dispatch({ type: "RESET_PHASE", payload: startPhase });
  }, [startPhase]);

  // ---------------------------------------------------------------------------
  // Playback Actions
  // ---------------------------------------------------------------------------
  const setIsPlaying = useCallback((playing: boolean) => {
    dispatch({ type: "SET_IS_PLAYING", payload: playing });
  }, []);

  const setCurrentBeat = useCallback((beat: number) => {
    dispatch({ type: "SET_CURRENT_BEAT", payload: beat });
  }, []);

  const setIsSubdivision = useCallback((isSub: boolean) => {
    dispatch({ type: "SET_IS_SUBDIVISION", payload: isSub });
  }, []);

  // ---------------------------------------------------------------------------
  // UI Actions
  // ---------------------------------------------------------------------------
  const setShowNotation = useCallback((show: boolean) => {
    dispatch({ type: "SET_SHOW_NOTATION", payload: show });
  }, []);

  const setShowCursor = useCallback((show: boolean) => {
    dispatch({ type: "SET_SHOW_CURSOR", payload: show });
  }, []);

  const setHasHeardPattern = useCallback((heard: boolean) => {
    dispatch({ type: "SET_HAS_HEARD_PATTERN", payload: heard });
  }, []);

  // Reset notation visibility on phase change
  useEffect(() => {
    dispatch({ type: "SET_SHOW_NOTATION", payload: false });
  }, [state.phase]);

  // ---------------------------------------------------------------------------
  // Sing Phase Actions
  // ---------------------------------------------------------------------------
  const setSingResult = useCallback((result: PerformanceResult | null) => {
    dispatch({ type: "SET_SING_RESULT", payload: result });
  }, []);

  const incrementSingAttempts = useCallback(() => {
    dispatch({ type: "INCREMENT_SING_ATTEMPTS" });
  }, []);

  const resetSingAttempts = useCallback(() => {
    dispatch({ type: "RESET_SING_ATTEMPTS" });
  }, []);

  // ---------------------------------------------------------------------------
  // Play Phase Actions
  // ---------------------------------------------------------------------------
  const setPlayResult = useCallback((result: PerformanceResult | null) => {
    dispatch({ type: "SET_PLAY_RESULT", payload: result });
  }, []);

  const incrementPlayAttempts = useCallback(() => {
    dispatch({ type: "INCREMENT_PLAY_ATTEMPTS" });
  }, []);

  const resetPlayAttempts = useCallback(() => {
    dispatch({ type: "RESET_PLAY_ATTEMPTS" });
  }, []);

  // ---------------------------------------------------------------------------
  // Attestation Actions
  // ---------------------------------------------------------------------------
  const openAttestModal = useCallback((phaseType: "sing" | "play") => {
    dispatch({ type: "OPEN_ATTEST_MODAL", payload: phaseType });
  }, []);

  const closeAttestModal = useCallback(() => {
    dispatch({ type: "CLOSE_ATTEST_MODAL" });
  }, []);

  const confirmAttestation = useCallback(() => {
    dispatch({ type: "CONFIRM_ATTESTATION" });
  }, []);

  // ---------------------------------------------------------------------------
  // Success Actions
  // ---------------------------------------------------------------------------
  const setShowSuccess = useCallback((show: boolean) => {
    dispatch({ type: "SET_SHOW_SUCCESS", payload: show });
  }, []);

  const incrementSuccessfulRounds = useCallback(() => {
    dispatch({ type: "INCREMENT_SUCCESSFUL_ROUNDS" });
  }, []);

  const resetSuccessfulRounds = useCallback(() => {
    dispatch({ type: "RESET_SUCCESSFUL_ROUNDS" });
  }, []);

  // ---------------------------------------------------------------------------
  // Progress Actions (Multi-Pattern Exercises)
  // ---------------------------------------------------------------------------
  const setCurrentPatternIndex = useCallback((index: number) => {
    dispatch({ type: "SET_CURRENT_PATTERN_INDEX", payload: index });
  }, []);

  const markItemComplete = useCallback((itemId: string) => {
    dispatch({ type: "MARK_ITEM_COMPLETE", payload: itemId });
  }, []);

  const progress: ProgressState = useMemo(
    () => ({
      currentIndex: state.currentPatternIndex,
      completedItems: state.completedPatterns,
      totalItems: patterns.length || masteryStreak,
      isComplete:
        patterns.length > 0
          ? patterns.every((p) => state.completedPatterns[p.id])
          : state.successfulRounds >= masteryStreak,
    }),
    [
      state.currentPatternIndex,
      state.completedPatterns,
      state.successfulRounds,
      patterns,
      masteryStreak,
    ],
  );

  const goToNextItem = useCallback(() => {
    if (patterns.length === 0) return;

    // Find next incomplete pattern
    const nextIncomplete = patterns.findIndex(
      (p, idx) =>
        idx > state.currentPatternIndex && !state.completedPatterns[p.id],
    );
    if (nextIncomplete !== -1) {
      dispatch({ type: "SET_CURRENT_PATTERN_INDEX", payload: nextIncomplete });
      return;
    }
    // Wrap to first incomplete
    const firstIncomplete = patterns.findIndex(
      (p) => !state.completedPatterns[p.id],
    );
    if (firstIncomplete !== -1) {
      dispatch({ type: "SET_CURRENT_PATTERN_INDEX", payload: firstIncomplete });
    }
  }, [patterns, state.currentPatternIndex, state.completedPatterns]);

  const goToItem = useCallback(
    (index: number) => {
      if (index >= 0 && index < patterns.length) {
        dispatch({ type: "SET_CURRENT_PATTERN_INDEX", payload: index });
      }
    },
    [patterns.length],
  );

  const resetProgress = useCallback(() => {
    dispatch({ type: "RESET_PROGRESS" });
  }, []);

  // ---------------------------------------------------------------------------
  // Focus Card Actions
  // ---------------------------------------------------------------------------
  const currentFocusCard = useMemo(
    () =>
      focusCards.length > 0
        ? focusCards[state.focusCardIndex % focusCards.length]
        : null,
    [focusCards, state.focusCardIndex],
  );

  const rotateFocusCard = useCallback(() => {
    dispatch({ type: "ROTATE_FOCUS_CARD" });
  }, []);

  const setFocusCardIndex = useCallback((index: number) => {
    dispatch({ type: "SET_FOCUS_CARD_INDEX", payload: index });
  }, []);

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  const scrollViewRef = useRef<{
    scrollTo: (options: { y: number; animated: boolean }) => void;
  } | null>(null);
  const unmountedRef = useRef(false);

  // Mark unmounted on cleanup
  useEffect(() => {
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Combined Reset Functions
  // ---------------------------------------------------------------------------
  const resetForNewRound = useCallback(() => {
    dispatch({ type: "RESET_FOR_NEW_ROUND" });
  }, []);

  const resetAll = useCallback(() => {
    dispatch({ type: "RESET_ALL", payload: { startPhase } });
  }, [startPhase]);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    // Phase state
    phase: state.phase,
    setPhase,
    goToNextPhase,
    goToPrevPhase,
    resetPhase,

    // Playback state
    isPlaying: state.isPlaying,
    setIsPlaying,
    currentBeat: state.currentBeat,
    setCurrentBeat,
    isSubdivision: state.isSubdivision,
    setIsSubdivision,

    // UI state
    showNotation: state.showNotation,
    setShowNotation,
    showCursor: state.showCursor,
    setShowCursor,
    hasHeardPattern: state.hasHeardPattern,
    setHasHeardPattern,

    // Sing phase state
    singResult: state.singResult,
    setSingResult,
    singAttempts: state.singAttempts,
    incrementSingAttempts,
    resetSingAttempts,

    // Play phase state
    playResult: state.playResult,
    setPlayResult,
    playAttempts: state.playAttempts,
    incrementPlayAttempts,
    resetPlayAttempts,

    // Attestation state
    showAttestModal: state.showAttestModal,
    attestPhase: state.attestPhase,
    openAttestModal,
    closeAttestModal,
    confirmAttestation,

    // Success state
    showSuccess: state.showSuccess,
    setShowSuccess,
    successfulRounds: state.successfulRounds,
    incrementSuccessfulRounds,
    resetSuccessfulRounds,

    // Progress state
    progress,
    markItemComplete,
    goToNextItem,
    goToItem,
    resetProgress,

    // Focus card state
    currentFocusCard,
    focusCardIndex: state.focusCardIndex,
    rotateFocusCard,

    // Refs
    scrollViewRef,
    unmountedRef,

    // Combined reset
    resetForNewRound,
    resetAll,
  };
}

export default useLessonExerciseState;
