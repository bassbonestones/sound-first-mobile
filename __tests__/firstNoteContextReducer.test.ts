/**
 * Tests for firstNoteContextReducer
 *
 * Verifies state transitions for all action types.
 */
import { firstNoteContextReducer } from "../src/screens/FirstNote/context/firstNoteContextReducer";
import {
  initialFirstNoteContextState,
  FirstNoteContextState,
  FirstNoteContextAction,
} from "../src/screens/FirstNote/context/firstNoteContextTypes";

describe("firstNoteContextReducer", () => {
  let initialState: FirstNoteContextState;

  beforeEach(() => {
    initialState = { ...initialFirstNoteContextState };
  });

  // ==========================================================================
  // Flow Actions
  // ==========================================================================
  describe("flow actions", () => {
    it("SET_STAGE updates the stage", () => {
      const action: FirstNoteContextAction = { type: "SET_STAGE", payload: 3 };
      const result = firstNoteContextReducer(initialState, action);
      expect(result.flow.stage).toBe(3);
    });

    it("SET_SUB_STEP updates the sub-step", () => {
      const action: FirstNoteContextAction = {
        type: "SET_SUB_STEP",
        payload: 2,
      };
      const result = firstNoteContextReducer(initialState, action);
      expect(result.flow.subStep).toBe(2);
    });

    it("SET_SKIPPABLE_STAGES updates skippable stages array", () => {
      const action: FirstNoteContextAction = {
        type: "SET_SKIPPABLE_STAGES",
        payload: [1, 3, 5],
      };
      const result = firstNoteContextReducer(initialState, action);
      expect(result.flow.skippableStages).toEqual([1, 3, 5]);
    });

    it("ADVANCE_STAGE increments stage and resets subStep", () => {
      const stateWithStage = {
        ...initialState,
        flow: { ...initialState.flow, stage: 2, subStep: 2 },
      };
      const action: FirstNoteContextAction = { type: "ADVANCE_STAGE" };
      const result = firstNoteContextReducer(stateWithStage, action);
      expect(result.flow.stage).toBe(3);
      expect(result.flow.subStep).toBe(0);
    });

    it("RESET_SUB_STEP sets subStep to 0", () => {
      const stateWithSubStep = {
        ...initialState,
        flow: { ...initialState.flow, subStep: 5 },
      };
      const action: FirstNoteContextAction = { type: "RESET_SUB_STEP" };
      const result = firstNoteContextReducer(stateWithSubStep, action);
      expect(result.flow.subStep).toBe(0);
    });
  });

  // ==========================================================================
  // Explorer Actions
  // ==========================================================================
  describe("explorer actions", () => {
    it("SET_PITCH_EXPLORER_INDEX updates pitch explorer index", () => {
      const action: FirstNoteContextAction = {
        type: "SET_PITCH_EXPLORER_INDEX",
        payload: 5,
      };
      const result = firstNoteContextReducer(initialState, action);
      expect(result.explorer.pitchExplorerIndex).toBe(5);
    });

    it("SET_ACCIDENTAL_EXPLORER updates accidental to sharp", () => {
      const action: FirstNoteContextAction = {
        type: "SET_ACCIDENTAL_EXPLORER",
        payload: "sharp",
      };
      const result = firstNoteContextReducer(initialState, action);
      expect(result.explorer.accidentalExplorer).toBe("sharp");
    });

    it("SET_ACCIDENTAL_EXPLORER updates accidental to flat", () => {
      const action: FirstNoteContextAction = {
        type: "SET_ACCIDENTAL_EXPLORER",
        payload: "flat",
      };
      const result = firstNoteContextReducer(initialState, action);
      expect(result.explorer.accidentalExplorer).toBe("flat");
    });
  });

  // ==========================================================================
  // Focus Card Actions
  // ==========================================================================
  describe("focus card actions", () => {
    it("SET_FOCUS_CARD_INDEX updates focus card index", () => {
      const action: FirstNoteContextAction = {
        type: "SET_FOCUS_CARD_INDEX",
        payload: 2,
      };
      const result = firstNoteContextReducer(initialState, action);
      expect(result.focusCard.focusCardIndex).toBe(2);
    });

    it("ADD_FOCUS_CARD_RATING appends rating to array", () => {
      const stateWithRatings = {
        ...initialState,
        focusCard: { ...initialState.focusCard, focusCardRatings: [4, 5] },
      };
      const action: FirstNoteContextAction = {
        type: "ADD_FOCUS_CARD_RATING",
        payload: 3,
      };
      const result = firstNoteContextReducer(stateWithRatings, action);
      expect(result.focusCard.focusCardRatings).toEqual([4, 5, 3]);
    });

    it("SET_FOCUS_CARD_RATINGS replaces ratings array", () => {
      const action: FirstNoteContextAction = {
        type: "SET_FOCUS_CARD_RATINGS",
        payload: [1, 2, 3],
      };
      const result = firstNoteContextReducer(initialState, action);
      expect(result.focusCard.focusCardRatings).toEqual([1, 2, 3]);
    });

    it("SET_FOCUS_STEP_DONE marks a specific step as done", () => {
      const action: FirstNoteContextAction = {
        type: "SET_FOCUS_STEP_DONE",
        payload: "listen",
      };
      const result = firstNoteContextReducer(initialState, action);
      expect(result.focusCard.focusStepsDone.listen).toBe(true);
      expect(result.focusCard.focusStepsDone.sing).toBe(false);
    });

    it("SET_FOCUS_STEP_DONE marks sing step as done", () => {
      const action: FirstNoteContextAction = {
        type: "SET_FOCUS_STEP_DONE",
        payload: "sing",
      };
      const result = firstNoteContextReducer(initialState, action);
      expect(result.focusCard.focusStepsDone.sing).toBe(true);
    });

    it("RESET_FOCUS_STEPS_DONE resets all steps to false", () => {
      const stateWithSteps = {
        ...initialState,
        focusCard: {
          ...initialState.focusCard,
          focusStepsDone: {
            listen: true,
            sing: true,
            imagine: true,
            play: true,
          },
        },
      };
      const action: FirstNoteContextAction = { type: "RESET_FOCUS_STEPS_DONE" };
      const result = firstNoteContextReducer(stateWithSteps, action);
      expect(result.focusCard.focusStepsDone).toEqual({
        listen: false,
        sing: false,
        imagine: false,
        play: false,
      });
    });

    it("SET_FOCUS_STEPS_DONE replaces entire steps object", () => {
      const newSteps = {
        listen: true,
        sing: true,
        imagine: false,
        play: false,
      };
      const action: FirstNoteContextAction = {
        type: "SET_FOCUS_STEPS_DONE",
        payload: newSteps,
      };
      const result = firstNoteContextReducer(initialState, action);
      expect(result.focusCard.focusStepsDone).toEqual(newSteps);
    });

    it("SET_FOCUS_ACTIVE_STEP updates active step", () => {
      const action: FirstNoteContextAction = {
        type: "SET_FOCUS_ACTIVE_STEP",
        payload: 2,
      };
      const result = firstNoteContextReducer(initialState, action);
      expect(result.focusCard.focusActiveStep).toBe(2);
    });

    it("RESET_FOR_NEW_FOCUS_CARD resets focus card state", () => {
      const stateWithFocusData = {
        ...initialState,
        focusCard: {
          ...initialState.focusCard,
          focusStepsDone: {
            listen: true,
            sing: true,
            imagine: true,
            play: true,
          },
          focusActiveStep: 3,
        },
      };
      const action: FirstNoteContextAction = {
        type: "RESET_FOR_NEW_FOCUS_CARD",
      };
      const result = firstNoteContextReducer(stateWithFocusData, action);
      expect(result.focusCard.focusStepsDone).toEqual({
        listen: false,
        sing: false,
        imagine: false,
        play: false,
      });
      expect(result.focusCard.focusActiveStep).toBe(0);
    });
  });

  // ==========================================================================
  // UI Actions
  // ==========================================================================
  describe("ui actions", () => {
    it("SET_SHOW_SUMMARY updates showSummary", () => {
      const action: FirstNoteContextAction = {
        type: "SET_SHOW_SUMMARY",
        payload: true,
      };
      const result = firstNoteContextReducer(initialState, action);
      expect(result.ui.showSummary).toBe(true);
    });

    it("SET_LOADING updates isLoading", () => {
      const action: FirstNoteContextAction = {
        type: "SET_LOADING",
        payload: true,
      };
      const result = firstNoteContextReducer(initialState, action);
      expect(result.ui.isLoading).toBe(true);
    });

    it("SET_ERROR updates error and clears loading", () => {
      const stateWithLoading = {
        ...initialState,
        ui: { ...initialState.ui, isLoading: true },
      };
      const action: FirstNoteContextAction = {
        type: "SET_ERROR",
        payload: "Something went wrong",
      };
      const result = firstNoteContextReducer(stateWithLoading, action);
      expect(result.ui.error).toBe("Something went wrong");
      expect(result.ui.isLoading).toBe(false);
    });

    it("SET_ERROR clears error when null", () => {
      const stateWithError = {
        ...initialState,
        ui: { ...initialState.ui, error: "Old error" },
      };
      const action: FirstNoteContextAction = {
        type: "SET_ERROR",
        payload: null,
      };
      const result = firstNoteContextReducer(stateWithError, action);
      expect(result.ui.error).toBe(null);
    });

    it("SET_VOLUME updates volume", () => {
      const action: FirstNoteContextAction = {
        type: "SET_VOLUME",
        payload: 0.8,
      };
      const result = firstNoteContextReducer(initialState, action);
      expect(result.ui.volume).toBe(0.8);
    });

    it("SET_PITCH_ACCURACY updates pitch accuracy to correct", () => {
      const action: FirstNoteContextAction = {
        type: "SET_PITCH_ACCURACY",
        payload: "correct",
      };
      const result = firstNoteContextReducer(initialState, action);
      expect(result.ui.pitchAccuracy).toBe("correct");
    });

    it("SET_PITCH_ACCURACY updates pitch accuracy to off", () => {
      const action: FirstNoteContextAction = {
        type: "SET_PITCH_ACCURACY",
        payload: "off",
      };
      const result = firstNoteContextReducer(initialState, action);
      expect(result.ui.pitchAccuracy).toBe("off");
    });

    it("SET_RATING updates rating", () => {
      const action: FirstNoteContextAction = {
        type: "SET_RATING",
        payload: 4,
      };
      const result = firstNoteContextReducer(initialState, action);
      expect(result.ui.rating).toBe(4);
    });

    it("SET_RATING clears rating when null", () => {
      const stateWithRating = {
        ...initialState,
        ui: { ...initialState.ui, rating: 5 },
      };
      const action: FirstNoteContextAction = {
        type: "SET_RATING",
        payload: null,
      };
      const result = firstNoteContextReducer(stateWithRating, action);
      expect(result.ui.rating).toBe(null);
    });
  });

  // ==========================================================================
  // Combined Actions
  // ==========================================================================
  describe("combined actions", () => {
    it("RESET_FOR_NEW_STAGE resets focus card and UI state", () => {
      const stateWithData = {
        ...initialState,
        focusCard: {
          ...initialState.focusCard,
          focusStepsDone: {
            listen: true,
            sing: true,
            imagine: true,
            play: true,
          },
          focusActiveStep: 3,
        },
        ui: {
          ...initialState.ui,
          pitchAccuracy: "correct" as const,
          rating: 5,
        },
      };
      const action: FirstNoteContextAction = { type: "RESET_FOR_NEW_STAGE" };
      const result = firstNoteContextReducer(stateWithData, action);

      // Focus card should be reset
      expect(result.focusCard.focusStepsDone).toEqual({
        listen: false,
        sing: false,
        imagine: false,
        play: false,
      });
      expect(result.focusCard.focusActiveStep).toBe(0);

      // UI state should be reset
      expect(result.ui.pitchAccuracy).toBe(null);
      expect(result.ui.rating).toBe(null);
    });
  });

  // ==========================================================================
  // State Immutability
  // ==========================================================================
  describe("state immutability", () => {
    it("does not mutate original state", () => {
      const originalState = { ...initialFirstNoteContextState };
      const action: FirstNoteContextAction = { type: "SET_STAGE", payload: 5 };

      firstNoteContextReducer(initialState, action);

      expect(initialState).toEqual(originalState);
    });

    it("returns new state object on change", () => {
      const action: FirstNoteContextAction = { type: "SET_STAGE", payload: 5 };
      const result = firstNoteContextReducer(initialState, action);

      expect(result).not.toBe(initialState);
      expect(result.flow).not.toBe(initialState.flow);
    });
  });
});
