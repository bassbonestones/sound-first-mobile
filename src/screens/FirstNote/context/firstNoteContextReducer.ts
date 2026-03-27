/**
 * FirstNoteContext Reducer
 *
 * Pure reducer function for managing FirstNote (Day 0) flow state transitions.
 * Uses slice reducers for organized state management.
 */

import type {
  FirstNoteContextState,
  FirstNoteContextAction,
  FirstNoteFlowState,
  FirstNoteExplorerState,
  FirstNoteFocusCardState,
  FirstNoteUIState,
} from "./firstNoteContextTypes";
import {
  initialFirstNoteFocusCardState,
  initialFirstNoteUIState,
} from "./firstNoteContextTypes";

// =============================================================================
// Slice Reducers
// =============================================================================

function flowReducer(
  state: FirstNoteFlowState,
  action: FirstNoteContextAction,
): FirstNoteFlowState {
  switch (action.type) {
    case "SET_STAGE":
      return {
        ...state,
        stage: action.payload,
      };

    case "SET_SUB_STEP":
      return {
        ...state,
        subStep: action.payload,
      };

    case "SET_SKIPPABLE_STAGES":
      return {
        ...state,
        skippableStages: action.payload,
      };

    case "ADVANCE_STAGE":
      return {
        ...state,
        stage: state.stage + 1,
        subStep: 0,
      };

    case "RESET_SUB_STEP":
      return {
        ...state,
        subStep: 0,
      };

    default:
      return state;
  }
}

function explorerReducer(
  state: FirstNoteExplorerState,
  action: FirstNoteContextAction,
): FirstNoteExplorerState {
  switch (action.type) {
    case "SET_PITCH_EXPLORER_INDEX":
      return {
        ...state,
        pitchExplorerIndex: action.payload,
      };

    case "SET_ACCIDENTAL_EXPLORER":
      return {
        ...state,
        accidentalExplorer: action.payload,
      };

    default:
      return state;
  }
}

function focusCardReducer(
  state: FirstNoteFocusCardState,
  action: FirstNoteContextAction,
): FirstNoteFocusCardState {
  switch (action.type) {
    case "SET_FOCUS_CARD_INDEX":
      return {
        ...state,
        focusCardIndex: action.payload,
      };

    case "ADD_FOCUS_CARD_RATING":
      return {
        ...state,
        focusCardRatings: [...state.focusCardRatings, action.payload],
      };

    case "SET_FOCUS_CARD_RATINGS":
      return {
        ...state,
        focusCardRatings: action.payload,
      };

    case "SET_FOCUS_STEP_DONE":
      return {
        ...state,
        focusStepsDone: {
          ...state.focusStepsDone,
          [action.payload]: true,
        },
      };

    case "RESET_FOCUS_STEPS_DONE":
      return {
        ...state,
        focusStepsDone: {
          listen: false,
          sing: false,
          imagine: false,
          play: false,
        },
      };

    case "SET_FOCUS_STEPS_DONE":
      return {
        ...state,
        focusStepsDone: action.payload,
      };

    case "SET_FOCUS_ACTIVE_STEP":
      return {
        ...state,
        focusActiveStep: action.payload,
      };

    case "RESET_FOR_NEW_FOCUS_CARD":
      return {
        ...state,
        focusStepsDone: initialFirstNoteFocusCardState.focusStepsDone,
        focusActiveStep: 0,
      };

    default:
      return state;
  }
}

function uiReducer(
  state: FirstNoteUIState,
  action: FirstNoteContextAction,
): FirstNoteUIState {
  switch (action.type) {
    case "SET_SHOW_SUMMARY":
      return {
        ...state,
        showSummary: action.payload,
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

    case "SET_VOLUME":
      return {
        ...state,
        volume: action.payload,
      };

    case "SET_PITCH_ACCURACY":
      return {
        ...state,
        pitchAccuracy: action.payload,
      };

    case "SET_RATING":
      return {
        ...state,
        rating: action.payload,
      };

    case "RESET_FOR_NEW_STAGE":
      return {
        ...state,
        pitchAccuracy: initialFirstNoteUIState.pitchAccuracy,
        rating: initialFirstNoteUIState.rating,
      };

    default:
      return state;
  }
}

// =============================================================================
// Root Reducer
// =============================================================================

export function firstNoteContextReducer(
  state: FirstNoteContextState,
  action: FirstNoteContextAction,
): FirstNoteContextState {
  // Handle combined actions that affect multiple slices
  if (action.type === "RESET_FOR_NEW_STAGE") {
    return {
      ...state,
      focusCard: focusCardReducer(state.focusCard, {
        type: "RESET_FOR_NEW_FOCUS_CARD",
      }),
      ui: uiReducer(state.ui, action),
    };
  }

  // Delegate to slice reducers
  return {
    flow: flowReducer(state.flow, action),
    explorer: explorerReducer(state.explorer, action),
    focusCard: focusCardReducer(state.focusCard, action),
    ui: uiReducer(state.ui, action),
  };
}

export default firstNoteContextReducer;
