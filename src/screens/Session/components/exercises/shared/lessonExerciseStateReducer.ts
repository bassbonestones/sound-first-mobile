/**
 * lessonExerciseStateReducer - Reducer for lesson exercise state management
 *
 * Consolidates 17 useState calls from useLessonExerciseState into a single
 * useReducer with typed actions for predictable state transitions.
 */

import type { PerformanceResult } from "./useLessonExerciseState";

// =============================================================================
// State Type
// =============================================================================

/**
 * Combined state for lesson exercises
 */
export interface LessonExerciseState {
  // Phase state
  phase: string;

  // Playback state
  isPlaying: boolean;
  currentBeat: number;
  isSubdivision: boolean;

  // UI state
  showNotation: boolean;
  showCursor: boolean;
  hasHeardPattern: boolean;

  // Sing phase state
  singResult: PerformanceResult | null;
  singAttempts: number;

  // Play phase state
  playResult: PerformanceResult | null;
  playAttempts: number;

  // Attestation state
  showAttestModal: boolean;
  attestPhase: "sing" | "play" | null;

  // Success state
  showSuccess: boolean;
  successfulRounds: number;

  // Progress state
  currentPatternIndex: number;
  completedPatterns: Record<string, boolean>;

  // Focus card state
  focusCardIndex: number;
}

// =============================================================================
// Action Types
// =============================================================================

export type LessonExerciseAction =
  // Phase actions
  | { type: "SET_PHASE"; payload: string }
  | { type: "RESET_PHASE"; payload: string }
  | { type: "GO_TO_NEXT_PHASE"; payload: { phaseOrder: string[] } }
  | { type: "GO_TO_PREV_PHASE"; payload: { phaseOrder: string[] } }

  // Playback actions
  | { type: "SET_IS_PLAYING"; payload: boolean }
  | { type: "SET_CURRENT_BEAT"; payload: number }
  | { type: "SET_IS_SUBDIVISION"; payload: boolean }

  // UI actions
  | { type: "SET_SHOW_NOTATION"; payload: boolean }
  | { type: "SET_SHOW_CURSOR"; payload: boolean }
  | { type: "SET_HAS_HEARD_PATTERN"; payload: boolean }

  // Sing phase actions
  | { type: "SET_SING_RESULT"; payload: PerformanceResult | null }
  | { type: "INCREMENT_SING_ATTEMPTS" }
  | { type: "RESET_SING_ATTEMPTS" }

  // Play phase actions
  | { type: "SET_PLAY_RESULT"; payload: PerformanceResult | null }
  | { type: "INCREMENT_PLAY_ATTEMPTS" }
  | { type: "RESET_PLAY_ATTEMPTS" }

  // Attestation actions
  | { type: "OPEN_ATTEST_MODAL"; payload: "sing" | "play" }
  | { type: "CLOSE_ATTEST_MODAL" }
  | { type: "CONFIRM_ATTESTATION" }

  // Success actions
  | { type: "SET_SHOW_SUCCESS"; payload: boolean }
  | { type: "INCREMENT_SUCCESSFUL_ROUNDS" }
  | { type: "RESET_SUCCESSFUL_ROUNDS" }

  // Progress actions
  | { type: "SET_CURRENT_PATTERN_INDEX"; payload: number }
  | { type: "MARK_ITEM_COMPLETE"; payload: string }
  | { type: "RESET_PROGRESS" }

  // Focus card actions
  | { type: "SET_FOCUS_CARD_INDEX"; payload: number }
  | { type: "ROTATE_FOCUS_CARD" }

  // Combined actions
  | { type: "RESET_FOR_NEW_ROUND" }
  | { type: "RESET_ALL"; payload: { startPhase: string } };

// =============================================================================
// Initial State Factory
// =============================================================================

/**
 * Create initial state for lesson exercise
 * @param startPhase - Starting phase
 */
export function createInitialState(startPhase: string): LessonExerciseState {
  return {
    // Phase state
    phase: startPhase,

    // Playback state
    isPlaying: false,
    currentBeat: 0,
    isSubdivision: false,

    // UI state
    showNotation: false,
    showCursor: false,
    hasHeardPattern: false,

    // Sing phase state
    singResult: null,
    singAttempts: 0,

    // Play phase state
    playResult: null,
    playAttempts: 0,

    // Attestation state
    showAttestModal: false,
    attestPhase: null,

    // Success state
    showSuccess: false,
    successfulRounds: 0,

    // Progress state
    currentPatternIndex: 0,
    completedPatterns: {},

    // Focus card state
    focusCardIndex: 0,
  };
}

// =============================================================================
// Reducer
// =============================================================================

/**
 * Reducer for lesson exercise state
 */
export function lessonExerciseStateReducer(
  state: LessonExerciseState,
  action: LessonExerciseAction,
): LessonExerciseState {
  switch (action.type) {
    // -------------------------------------------------------------------------
    // Phase actions
    // -------------------------------------------------------------------------
    case "SET_PHASE":
      return { ...state, phase: action.payload };

    case "RESET_PHASE":
      return { ...state, phase: action.payload };

    case "GO_TO_NEXT_PHASE": {
      const { phaseOrder } = action.payload;
      const currentIndex = phaseOrder.indexOf(state.phase);
      if (currentIndex === -1 || currentIndex >= phaseOrder.length - 1) {
        return state;
      }
      return { ...state, phase: phaseOrder[currentIndex + 1] };
    }

    case "GO_TO_PREV_PHASE": {
      const { phaseOrder } = action.payload;
      const currentIndex = phaseOrder.indexOf(state.phase);
      if (currentIndex <= 0) {
        return state;
      }
      return { ...state, phase: phaseOrder[currentIndex - 1] };
    }

    // -------------------------------------------------------------------------
    // Playback actions
    // -------------------------------------------------------------------------
    case "SET_IS_PLAYING":
      return { ...state, isPlaying: action.payload };

    case "SET_CURRENT_BEAT":
      return { ...state, currentBeat: action.payload };

    case "SET_IS_SUBDIVISION":
      return { ...state, isSubdivision: action.payload };

    // -------------------------------------------------------------------------
    // UI actions
    // -------------------------------------------------------------------------
    case "SET_SHOW_NOTATION":
      return { ...state, showNotation: action.payload };

    case "SET_SHOW_CURSOR":
      return { ...state, showCursor: action.payload };

    case "SET_HAS_HEARD_PATTERN":
      return { ...state, hasHeardPattern: action.payload };

    // -------------------------------------------------------------------------
    // Sing phase actions
    // -------------------------------------------------------------------------
    case "SET_SING_RESULT":
      return { ...state, singResult: action.payload };

    case "INCREMENT_SING_ATTEMPTS":
      return { ...state, singAttempts: state.singAttempts + 1 };

    case "RESET_SING_ATTEMPTS":
      return { ...state, singAttempts: 0 };

    // -------------------------------------------------------------------------
    // Play phase actions
    // -------------------------------------------------------------------------
    case "SET_PLAY_RESULT":
      return { ...state, playResult: action.payload };

    case "INCREMENT_PLAY_ATTEMPTS":
      return { ...state, playAttempts: state.playAttempts + 1 };

    case "RESET_PLAY_ATTEMPTS":
      return { ...state, playAttempts: 0 };

    // -------------------------------------------------------------------------
    // Attestation actions
    // -------------------------------------------------------------------------
    case "OPEN_ATTEST_MODAL":
      return {
        ...state,
        attestPhase: action.payload,
        showAttestModal: true,
      };

    case "CLOSE_ATTEST_MODAL":
      return {
        ...state,
        showAttestModal: false,
        attestPhase: null,
      };

    case "CONFIRM_ATTESTATION":
      if (state.attestPhase === "sing") {
        return {
          ...state,
          singResult: { success: true, attested: true },
          singAttempts: 0,
          showAttestModal: false,
          attestPhase: null,
        };
      } else if (state.attestPhase === "play") {
        return {
          ...state,
          playResult: { success: true, attested: true },
          playAttempts: 0,
          showAttestModal: false,
          attestPhase: null,
        };
      }
      return state;

    // -------------------------------------------------------------------------
    // Success actions
    // -------------------------------------------------------------------------
    case "SET_SHOW_SUCCESS":
      return { ...state, showSuccess: action.payload };

    case "INCREMENT_SUCCESSFUL_ROUNDS":
      return { ...state, successfulRounds: state.successfulRounds + 1 };

    case "RESET_SUCCESSFUL_ROUNDS":
      return { ...state, successfulRounds: 0 };

    // -------------------------------------------------------------------------
    // Progress actions
    // -------------------------------------------------------------------------
    case "SET_CURRENT_PATTERN_INDEX":
      return { ...state, currentPatternIndex: action.payload };

    case "MARK_ITEM_COMPLETE":
      return {
        ...state,
        completedPatterns: {
          ...state.completedPatterns,
          [action.payload]: true,
        },
      };

    case "RESET_PROGRESS":
      return {
        ...state,
        currentPatternIndex: 0,
        completedPatterns: {},
      };

    // -------------------------------------------------------------------------
    // Focus card actions
    // -------------------------------------------------------------------------
    case "SET_FOCUS_CARD_INDEX":
      return { ...state, focusCardIndex: action.payload };

    case "ROTATE_FOCUS_CARD":
      return { ...state, focusCardIndex: state.focusCardIndex + 1 };

    // -------------------------------------------------------------------------
    // Combined actions
    // -------------------------------------------------------------------------
    case "RESET_FOR_NEW_ROUND":
      return {
        ...state,
        singResult: null,
        playResult: null,
        hasHeardPattern: false,
        showNotation: false,
        showCursor: false,
      };

    case "RESET_ALL":
      return createInitialState(action.payload.startPhase);

    default:
      return state;
  }
}
