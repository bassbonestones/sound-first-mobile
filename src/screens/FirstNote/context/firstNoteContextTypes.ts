/**
 * FirstNoteContext Types
 *
 * State and action types for the FirstNote (Day 0) flow reducer.
 * Groups related state: navigation/flow, explorer, focus card, and UI.
 */

import { DEFAULT_PITCH_EXPLORER_INDEX } from "../data";

// =============================================================================
// State Slices
// =============================================================================

/** Navigation and flow state - tracks progress through stages */
export interface FirstNoteFlowState {
  /** Current major stage (0-N) */
  stage: number;
  /** Sub-step within current stage */
  subStep: number;
  /** Stages that can be skipped (for returning users) */
  skippableStages: number[];
}

/** Explorer state - pitch and accidental explorer positions */
export interface FirstNoteExplorerState {
  /** Current pitch explorer index */
  pitchExplorerIndex: number;
  /** Current accidental selection: "natural" | "sharp" | "flat" */
  accidentalExplorer: "natural" | "sharp" | "flat";
}

/** Focus card state - the focus card exercise */
export interface FirstNoteFocusCardState {
  /** Current focus card index */
  focusCardIndex: number;
  /** Array of ratings for completed focus cards */
  focusCardRatings: number[];
  /** Which steps are completed within current focus card */
  focusStepsDone: {
    listen: boolean;
    sing: boolean;
    imagine: boolean;
    play: boolean;
  };
  /** Currently active step (0-3) */
  focusActiveStep: number;
}

/** UI state - loading, errors, volume, and display flags */
export interface FirstNoteUIState {
  /** Whether to show the summary screen */
  showSummary: boolean;
  /** Loading indicator */
  isLoading: boolean;
  /** Error message, if any */
  error: string | null;
  /** Audio volume level (0-1) */
  volume: number;
  /** Pitch accuracy result: "correct" | "off" | null */
  pitchAccuracy: "correct" | "off" | null;
  /** Current rating for an exercise */
  rating: number | null;
}

// =============================================================================
// Combined State
// =============================================================================

/** Complete FirstNoteContext state */
export interface FirstNoteContextState {
  flow: FirstNoteFlowState;
  explorer: FirstNoteExplorerState;
  focusCard: FirstNoteFocusCardState;
  ui: FirstNoteUIState;
}

// =============================================================================
// Initial State
// =============================================================================

export const initialFirstNoteFlowState: FirstNoteFlowState = {
  stage: 0,
  subStep: 0,
  skippableStages: [],
};

export const initialFirstNoteExplorerState: FirstNoteExplorerState = {
  pitchExplorerIndex: DEFAULT_PITCH_EXPLORER_INDEX,
  accidentalExplorer: "natural",
};

export const initialFirstNoteFocusCardState: FirstNoteFocusCardState = {
  focusCardIndex: 0,
  focusCardRatings: [],
  focusStepsDone: {
    listen: false,
    sing: false,
    imagine: false,
    play: false,
  },
  focusActiveStep: 0,
};

export const initialFirstNoteUIState: FirstNoteUIState = {
  showSummary: false,
  isLoading: false,
  error: null,
  volume: 0,
  pitchAccuracy: null,
  rating: null,
};

export const initialFirstNoteContextState: FirstNoteContextState = {
  flow: initialFirstNoteFlowState,
  explorer: initialFirstNoteExplorerState,
  focusCard: initialFirstNoteFocusCardState,
  ui: initialFirstNoteUIState,
};

// =============================================================================
// Actions
// =============================================================================

/** All possible FirstNoteContext actions */
export type FirstNoteContextAction =
  // Flow actions
  | { type: "SET_STAGE"; payload: number }
  | { type: "SET_SUB_STEP"; payload: number }
  | { type: "SET_SKIPPABLE_STAGES"; payload: number[] }
  | { type: "ADVANCE_STAGE" }
  | { type: "RESET_SUB_STEP" }

  // Explorer actions
  | { type: "SET_PITCH_EXPLORER_INDEX"; payload: number }
  | { type: "SET_ACCIDENTAL_EXPLORER"; payload: "natural" | "sharp" | "flat" }

  // Focus card actions
  | { type: "SET_FOCUS_CARD_INDEX"; payload: number }
  | { type: "ADD_FOCUS_CARD_RATING"; payload: number }
  | { type: "SET_FOCUS_CARD_RATINGS"; payload: number[] }
  | {
      type: "SET_FOCUS_STEP_DONE";
      payload: keyof FirstNoteFocusCardState["focusStepsDone"];
    }
  | { type: "RESET_FOCUS_STEPS_DONE" }
  | {
      type: "SET_FOCUS_STEPS_DONE";
      payload: FirstNoteFocusCardState["focusStepsDone"];
    }
  | { type: "SET_FOCUS_ACTIVE_STEP"; payload: number }

  // UI actions
  | { type: "SET_SHOW_SUMMARY"; payload: boolean }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_VOLUME"; payload: number }
  | { type: "SET_PITCH_ACCURACY"; payload: "correct" | "off" | null }
  | { type: "SET_RATING"; payload: number | null }

  // Combined/batch actions
  | { type: "RESET_FOR_NEW_STAGE" }
  | { type: "RESET_FOR_NEW_FOCUS_CARD" };
