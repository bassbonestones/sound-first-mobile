/**
 * Session Context Reducer
 *
 * Pure reducer function for managing session context state transitions.
 */

import type {
  SessionContextState,
  SessionContextAction,
  SessionCoreState,
  SessionTimerState,
  SessionReflectionState,
  SessionCurriculumState,
  SessionHelpState,
} from "./sessionContextTypes";
import {
  initialSessionReflectionState,
  initialSessionCurriculumState,
} from "./sessionContextTypes";

// =============================================================================
// Slice Reducers
// =============================================================================

function coreReducer(
  state: SessionCoreState,
  action: SessionContextAction,
): SessionCoreState {
  switch (action.type) {
    case "SET_SESSION":
      return {
        ...state,
        session: action.payload,
        isLoading: false,
      };

    case "APPEND_MINI_SESSIONS":
      if (!state.session) return state;
      return {
        ...state,
        session: {
          ...state.session,
          mini_sessions: [
            ...state.session.mini_sessions,
            ...action.payload.mini_sessions,
          ],
        },
      };

    case "SET_CURRENT_INDEX":
      return {
        ...state,
        currentIndex: action.payload,
      };

    case "INCREMENT_CURRENT_INDEX":
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    default:
      return state;
  }
}

function timerReducer(
  state: SessionTimerState,
  action: SessionContextAction,
): SessionTimerState {
  switch (action.type) {
    case "SET_SESSION_START_TIME":
      return {
        ...state,
        sessionStartTime: action.payload,
      };

    case "UPDATE_TIMER":
      return {
        ...state,
        elapsedSeconds: action.payload.elapsedSeconds,
        currentTime: action.payload.currentTime,
      };

    case "SHOW_TIME_UP_MODAL":
      return {
        ...state,
        showTimeUpModal: true,
      };

    case "DISMISS_TIME_UP_MODAL":
      return {
        ...state,
        showTimeUpModal: false,
      };

    case "MARK_TIME_UP_SHOWN":
      return {
        ...state,
        hasShownTimeUpModal: true,
      };

    default:
      return state;
  }
}

function reflectionReducer(
  state: SessionReflectionState,
  action: SessionContextAction,
): SessionReflectionState {
  switch (action.type) {
    case "SHOW_REFLECTION":
      return {
        ...state,
        showReflection: true,
      };

    case "HIDE_REFLECTION":
      return {
        ...state,
        showReflection: false,
      };

    case "SET_REFLECTION_TEXT":
      return {
        ...state,
        reflectionText: action.payload,
      };

    case "SET_EXTENDED":
      return {
        ...state,
        isExtended: action.payload,
      };

    case "SET_FATIGUE_INPUT":
      return {
        ...state,
        fatigueInput: action.payload,
      };

    case "SET_RATING":
      return {
        ...state,
        rating: action.payload,
      };

    case "SET_SUBMITTING":
      return {
        ...state,
        isSubmitting: action.payload,
      };

    case "RESET_REFLECTION":
      return initialSessionReflectionState;

    default:
      return state;
  }
}

function curriculumReducer(
  state: SessionCurriculumState,
  action: SessionContextAction,
): SessionCurriculumState {
  switch (action.type) {
    case "SET_CURRICULUM_STEPS":
      return {
        ...state,
        curriculumSteps: action.payload,
      };

    case "SET_CURRENT_STEP_INDEX":
      return {
        ...state,
        currentStepIndex: action.payload,
      };

    case "UPDATE_STEP_COMPLETED":
      return {
        ...state,
        curriculumSteps: state.curriculumSteps.map((step, index) =>
          index === action.payload.stepIndex
            ? {
                ...step,
                is_completed: true,
                rating: action.payload.rating ?? step.rating,
              }
            : step,
        ),
      };

    case "SET_CURRICULUM_LOADING":
      return {
        ...state,
        isCurriculumLoading: action.payload,
      };

    case "SET_STRAIN_DETECTED":
      return {
        ...state,
        strainDetected: action.payload,
      };

    case "SET_RANGE_ATTEMPT_COUNT":
      return {
        ...state,
        rangeAttemptCount: action.payload,
      };

    case "RESET_CURRICULUM":
      return initialSessionCurriculumState;

    default:
      return state;
  }
}

function helpReducer(
  state: SessionHelpState,
  action: SessionContextAction,
): SessionHelpState {
  switch (action.type) {
    case "SHOW_HELP_MENU":
      return {
        ...state,
        showHelpMenu: true,
      };

    case "HIDE_HELP_MENU":
      return {
        ...state,
        showHelpMenu: false,
      };

    case "TOGGLE_HELP_MENU":
      return {
        ...state,
        showHelpMenu: !state.showHelpMenu,
      };

    case "SHOW_MINI_LESSON":
      return {
        ...state,
        showMiniLesson: true,
        selectedCapabilityId: action.payload,
      };

    case "HIDE_MINI_LESSON":
      return {
        ...state,
        showMiniLesson: false,
      };

    case "SET_SELECTED_CAPABILITY_ID":
      return {
        ...state,
        selectedCapabilityId: action.payload,
      };

    default:
      return state;
  }
}

// =============================================================================
// Root Reducer
// =============================================================================

/**
 * Main reducer for SessionContext state.
 * Combines slice reducers for each state category.
 */
export function sessionContextReducer(
  state: SessionContextState,
  action: SessionContextAction,
): SessionContextState {
  return {
    core: coreReducer(state.core, action),
    timer: timerReducer(state.timer, action),
    reflection: reflectionReducer(state.reflection, action),
    curriculum: curriculumReducer(state.curriculum, action),
    help: helpReducer(state.help, action),
  };
}
