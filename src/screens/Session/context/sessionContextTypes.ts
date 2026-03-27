/**
 * SessionContext State and Action Types
 *
 * Defines typed state slices and actions for the session context reducer.
 */

import type { PracticeSession, CurriculumStep } from "../../../types/session";

// =============================================================================
// State Slices
// =============================================================================

/**
 * Core session data and navigation state
 */
export interface SessionCoreState {
  /** The loaded practice session data */
  session: PracticeSession | null;
  /** Current mini-session index */
  currentIndex: number;
  /** Whether session is loading */
  isLoading: boolean;
  /** Error message if session failed to load */
  error: string | null;
}

/**
 * Timer and time tracking state
 */
export interface SessionTimerState {
  /** Timestamp when session started (ms since epoch) */
  sessionStartTime: number | null;
  /** Elapsed time in seconds */
  elapsedSeconds: number;
  /** Current clock time for display */
  currentTime: Date;
  /** Whether time-up modal is visible */
  showTimeUpModal: boolean;
  /** Whether time-up modal has been shown (prevents re-showing) */
  hasShownTimeUpModal: boolean;
}

/**
 * Reflection modal and input state
 */
export interface SessionReflectionState {
  /** Whether reflection modal is visible */
  showReflection: boolean;
  /** User's reflection text */
  reflectionText: string;
  /** Whether extended reflection is active */
  isExtended: boolean;
  /** Fatigue input value (0-10) */
  fatigueInput: number;
  /** User's rating (1-5) */
  rating: number | null;
  /** Whether reflection is being submitted */
  isSubmitting: boolean;
}

/**
 * Curriculum steps and progress state
 */
export interface SessionCurriculumState {
  /** Array of curriculum steps for current mini-session */
  curriculumSteps: CurriculumStep[];
  /** Index of current step */
  currentStepIndex: number;
  /** Whether curriculum is loading */
  isCurriculumLoading: boolean;
  /** Whether strain has been detected (for range work) */
  strainDetected: boolean;
  /** Number of range attempts */
  rangeAttemptCount: number;
}

/**
 * Help menu and mini-lesson state
 */
export interface SessionHelpState {
  /** Whether help menu is visible */
  showHelpMenu: boolean;
  /** Whether mini-lesson modal is visible */
  showMiniLesson: boolean;
  /** Currently selected capability ID for help */
  selectedCapabilityId: number | null;
}

// =============================================================================
// Combined State
// =============================================================================

/**
 * Complete session context state
 */
export interface SessionContextState {
  core: SessionCoreState;
  timer: SessionTimerState;
  reflection: SessionReflectionState;
  curriculum: SessionCurriculumState;
  help: SessionHelpState;
}

// =============================================================================
// Actions
// =============================================================================

// Core actions
export type SessionCoreAction =
  | { type: "SET_SESSION"; payload: PracticeSession }
  | { type: "APPEND_MINI_SESSIONS"; payload: PracticeSession }
  | { type: "SET_CURRENT_INDEX"; payload: number }
  | { type: "INCREMENT_CURRENT_INDEX" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

// Timer actions
export type SessionTimerAction =
  | { type: "SET_SESSION_START_TIME"; payload: number }
  | {
      type: "UPDATE_TIMER";
      payload: { elapsedSeconds: number; currentTime: Date };
    }
  | { type: "SHOW_TIME_UP_MODAL" }
  | { type: "DISMISS_TIME_UP_MODAL" }
  | { type: "MARK_TIME_UP_SHOWN" };

// Reflection actions
export type SessionReflectionAction =
  | { type: "SHOW_REFLECTION" }
  | { type: "HIDE_REFLECTION" }
  | { type: "SET_REFLECTION_TEXT"; payload: string }
  | { type: "SET_EXTENDED"; payload: boolean }
  | { type: "SET_FATIGUE_INPUT"; payload: number }
  | { type: "SET_RATING"; payload: number | null }
  | { type: "SET_SUBMITTING"; payload: boolean }
  | { type: "RESET_REFLECTION" };

// Curriculum actions
export type SessionCurriculumAction =
  | { type: "SET_CURRICULUM_STEPS"; payload: CurriculumStep[] }
  | { type: "SET_CURRENT_STEP_INDEX"; payload: number }
  | {
      type: "UPDATE_STEP_COMPLETED";
      payload: { stepIndex: number; rating?: number | null };
    }
  | { type: "SET_CURRICULUM_LOADING"; payload: boolean }
  | { type: "SET_STRAIN_DETECTED"; payload: boolean }
  | { type: "SET_RANGE_ATTEMPT_COUNT"; payload: number }
  | { type: "RESET_CURRICULUM" };

// Help actions
export type SessionHelpAction =
  | { type: "SHOW_HELP_MENU" }
  | { type: "HIDE_HELP_MENU" }
  | { type: "TOGGLE_HELP_MENU" }
  | { type: "SHOW_MINI_LESSON"; payload: number }
  | { type: "HIDE_MINI_LESSON" }
  | { type: "SET_SELECTED_CAPABILITY_ID"; payload: number | null };

// Combined action type
export type SessionContextAction =
  | SessionCoreAction
  | SessionTimerAction
  | SessionReflectionAction
  | SessionCurriculumAction
  | SessionHelpAction;

// =============================================================================
// Initial State
// =============================================================================

export const initialSessionCoreState: SessionCoreState = {
  session: null,
  currentIndex: 0,
  isLoading: true,
  error: null,
};

export const initialSessionTimerState: SessionTimerState = {
  sessionStartTime: null,
  elapsedSeconds: 0,
  currentTime: new Date(),
  showTimeUpModal: false,
  hasShownTimeUpModal: false,
};

export const initialSessionReflectionState: SessionReflectionState = {
  showReflection: false,
  reflectionText: "",
  isExtended: false,
  fatigueInput: 2,
  rating: null,
  isSubmitting: false,
};

export const initialSessionCurriculumState: SessionCurriculumState = {
  curriculumSteps: [],
  currentStepIndex: 0,
  isCurriculumLoading: false,
  strainDetected: false,
  rangeAttemptCount: 0,
};

export const initialSessionHelpState: SessionHelpState = {
  showHelpMenu: false,
  showMiniLesson: false,
  selectedCapabilityId: null,
};

export const initialSessionContextState: SessionContextState = {
  core: initialSessionCoreState,
  timer: initialSessionTimerState,
  reflection: initialSessionReflectionState,
  curriculum: initialSessionCurriculumState,
  help: initialSessionHelpState,
};

/**
 * Factory to create initial state (useful for testing)
 */
export function createInitialSessionState(
  overrides?: Partial<SessionContextState>,
): SessionContextState {
  return {
    ...initialSessionContextState,
    ...overrides,
  };
}
