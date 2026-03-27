/**
 * Tests for sessionContextReducer
 *
 * Tests reducer logic for session context state management:
 * - Core state (session, loading, error)
 * - Timer state
 * - Reflection state
 * - Curriculum state
 * - Help state
 */
import { sessionContextReducer } from "../src/screens/Session/context/sessionContextReducer";
import type { SessionContextState } from "../src/screens/Session/context/sessionContextTypes";
import {
  initialSessionReflectionState,
  initialSessionCurriculumState,
  createInitialSessionState,
} from "../src/screens/Session/context/sessionContextTypes";

describe("sessionContextReducer", () => {
  // Initial state for testing
  const initialState: SessionContextState = {
    core: {
      session: null,
      currentIndex: 0,
      isLoading: false,
      error: null,
    },
    timer: {
      sessionStartTime: null,
      elapsedSeconds: 0,
      currentTime: new Date(),
      showTimeUpModal: false,
      hasShownTimeUpModal: false,
    },
    reflection: initialSessionReflectionState,
    curriculum: initialSessionCurriculumState,
    help: {
      showHelpMenu: false,
      showMiniLesson: false,
      selectedCapabilityId: null,
    },
  };

  // ---------------------------------------------------------------------------
  // Core Reducer Tests
  // ---------------------------------------------------------------------------
  describe("core reducer", () => {
    it("handles SET_SESSION", () => {
      const mockSession = {
        id: 1,
        mini_sessions: [],
        is_active: true,
      };

      const result = sessionContextReducer(initialState, {
        type: "SET_SESSION",
        payload: mockSession as any,
      });

      expect(result.core.session).toEqual(mockSession);
      expect(result.core.isLoading).toBe(false);
    });

    it("handles APPEND_MINI_SESSIONS when session exists", () => {
      const stateWithSession: SessionContextState = {
        ...initialState,
        core: {
          ...initialState.core,
          session: {
            id: 1,
            mini_sessions: [{ id: 1 }],
          } as any,
        },
      };

      const result = sessionContextReducer(stateWithSession, {
        type: "APPEND_MINI_SESSIONS",
        payload: { mini_sessions: [{ id: 2 }, { id: 3 }] as any },
      });

      expect(result.core.session?.mini_sessions).toHaveLength(3);
    });

    it("handles APPEND_MINI_SESSIONS when session is null", () => {
      const result = sessionContextReducer(initialState, {
        type: "APPEND_MINI_SESSIONS",
        payload: { mini_sessions: [] },
      });

      expect(result.core.session).toBeNull();
    });

    it("handles INCREMENT_CURRENT_INDEX", () => {
      const result = sessionContextReducer(initialState, {
        type: "INCREMENT_CURRENT_INDEX",
      });

      expect(result.core.currentIndex).toBe(1);
    });

    it("handles SET_ERROR", () => {
      const result = sessionContextReducer(initialState, {
        type: "SET_ERROR",
        payload: "Something went wrong",
      });

      expect(result.core.error).toBe("Something went wrong");
      expect(result.core.isLoading).toBe(false);
    });

    it("returns unchanged state for unknown action", () => {
      const result = sessionContextReducer(initialState, {
        type: "UNKNOWN_ACTION" as any,
      });

      expect(result.core).toEqual(initialState.core);
    });
  });

  // ---------------------------------------------------------------------------
  // Reflection Reducer Tests
  // ---------------------------------------------------------------------------
  describe("reflection reducer", () => {
    it("handles SHOW_REFLECTION", () => {
      const result = sessionContextReducer(initialState, {
        type: "SHOW_REFLECTION",
      });

      expect(result.reflection.showReflection).toBe(true);
    });

    it("handles HIDE_REFLECTION", () => {
      const stateWithReflection: SessionContextState = {
        ...initialState,
        reflection: { ...initialState.reflection, showReflection: true },
      };

      const result = sessionContextReducer(stateWithReflection, {
        type: "HIDE_REFLECTION",
      });

      expect(result.reflection.showReflection).toBe(false);
    });

    it("handles SET_EXTENDED", () => {
      const result = sessionContextReducer(initialState, {
        type: "SET_EXTENDED",
        payload: true,
      });

      expect(result.reflection.isExtended).toBe(true);
    });

    it("handles SET_REFLECTION_TEXT", () => {
      const result = sessionContextReducer(initialState, {
        type: "SET_REFLECTION_TEXT",
        payload: "Today I practiced scales",
      });

      expect(result.reflection.reflectionText).toBe("Today I practiced scales");
    });

    it("handles SET_FATIGUE_INPUT", () => {
      const result = sessionContextReducer(initialState, {
        type: "SET_FATIGUE_INPUT",
        payload: 7,
      });

      expect(result.reflection.fatigueInput).toBe(7);
    });

    it("handles SET_RATING", () => {
      const result = sessionContextReducer(initialState, {
        type: "SET_RATING",
        payload: 4,
      });

      expect(result.reflection.rating).toBe(4);
    });

    it("handles SET_SUBMITTING", () => {
      const result = sessionContextReducer(initialState, {
        type: "SET_SUBMITTING",
        payload: true,
      });

      expect(result.reflection.isSubmitting).toBe(true);
    });

    it("handles RESET_REFLECTION", () => {
      const modifiedState: SessionContextState = {
        ...initialState,
        reflection: {
          showReflection: true,
          reflectionText: "Some text",
          isExtended: true,
          fatigueInput: 5,
          rating: 3,
          isSubmitting: true,
        },
      };

      const result = sessionContextReducer(modifiedState, {
        type: "RESET_REFLECTION",
      });

      expect(result.reflection).toEqual(initialSessionReflectionState);
    });
  });

  // ---------------------------------------------------------------------------
  // Curriculum Reducer Tests
  // ---------------------------------------------------------------------------
  describe("curriculum reducer", () => {
    it("handles SET_CURRICULUM_STEPS", () => {
      const steps = [
        { capability_id: 1, is_completed: false },
        { capability_id: 2, is_completed: false },
      ];

      const result = sessionContextReducer(initialState, {
        type: "SET_CURRICULUM_STEPS",
        payload: steps as any,
      });

      expect(result.curriculum.curriculumSteps).toEqual(steps);
    });

    it("handles SET_CURRENT_STEP_INDEX", () => {
      const result = sessionContextReducer(initialState, {
        type: "SET_CURRENT_STEP_INDEX",
        payload: 2,
      });

      expect(result.curriculum.currentStepIndex).toBe(2);
    });

    it("handles UPDATE_STEP_COMPLETED", () => {
      const stateWithSteps: SessionContextState = {
        ...initialState,
        curriculum: {
          ...initialState.curriculum,
          curriculumSteps: [
            { capability_id: 1, is_completed: false, rating: null },
            { capability_id: 2, is_completed: false, rating: null },
          ] as any,
        },
      };

      const result = sessionContextReducer(stateWithSteps, {
        type: "UPDATE_STEP_COMPLETED",
        payload: { stepIndex: 0, rating: 5 },
      });

      expect(result.curriculum.curriculumSteps[0].is_completed).toBe(true);
      expect(result.curriculum.curriculumSteps[0].rating).toBe(5);
      expect(result.curriculum.curriculumSteps[1].is_completed).toBe(false);
    });

    it("handles UPDATE_STEP_COMPLETED without rating", () => {
      const stateWithSteps: SessionContextState = {
        ...initialState,
        curriculum: {
          ...initialState.curriculum,
          curriculumSteps: [
            { capability_id: 1, is_completed: false, rating: 3 },
          ] as any,
        },
      };

      const result = sessionContextReducer(stateWithSteps, {
        type: "UPDATE_STEP_COMPLETED",
        payload: { stepIndex: 0 },
      });

      expect(result.curriculum.curriculumSteps[0].is_completed).toBe(true);
      expect(result.curriculum.curriculumSteps[0].rating).toBe(3); // Unchanged
    });

    it("handles SET_CURRICULUM_LOADING", () => {
      const result = sessionContextReducer(initialState, {
        type: "SET_CURRICULUM_LOADING",
        payload: true,
      });

      expect(result.curriculum.isCurriculumLoading).toBe(true);
    });

    it("handles SET_STRAIN_DETECTED", () => {
      const result = sessionContextReducer(initialState, {
        type: "SET_STRAIN_DETECTED",
        payload: true,
      });

      expect(result.curriculum.strainDetected).toBe(true);
    });

    it("handles SET_RANGE_ATTEMPT_COUNT", () => {
      const result = sessionContextReducer(initialState, {
        type: "SET_RANGE_ATTEMPT_COUNT",
        payload: 3,
      });

      expect(result.curriculum.rangeAttemptCount).toBe(3);
    });

    it("handles RESET_CURRICULUM", () => {
      const modifiedState: SessionContextState = {
        ...initialState,
        curriculum: {
          curriculumSteps: [{ capability_id: 1 }] as any,
          currentStepIndex: 5,
          isCurriculumLoading: true,
          strainDetected: true,
          rangeAttemptCount: 10,
        },
      };

      const result = sessionContextReducer(modifiedState, {
        type: "RESET_CURRICULUM",
      });

      expect(result.curriculum).toEqual(initialSessionCurriculumState);
    });
  });

  // ---------------------------------------------------------------------------
  // Help Reducer Tests
  // ---------------------------------------------------------------------------
  describe("help reducer", () => {
    it("handles SHOW_HELP_MENU", () => {
      const result = sessionContextReducer(initialState, {
        type: "SHOW_HELP_MENU",
      });

      expect(result.help.showHelpMenu).toBe(true);
    });

    it("handles HIDE_HELP_MENU", () => {
      const stateWithHelp: SessionContextState = {
        ...initialState,
        help: { ...initialState.help, showHelpMenu: true },
      };

      const result = sessionContextReducer(stateWithHelp, {
        type: "HIDE_HELP_MENU",
      });

      expect(result.help.showHelpMenu).toBe(false);
    });

    it("handles TOGGLE_HELP_MENU - opens when closed", () => {
      const result = sessionContextReducer(initialState, {
        type: "TOGGLE_HELP_MENU",
      });

      expect(result.help.showHelpMenu).toBe(true);
    });

    it("handles TOGGLE_HELP_MENU - closes when open", () => {
      const stateWithHelp: SessionContextState = {
        ...initialState,
        help: { ...initialState.help, showHelpMenu: true },
      };

      const result = sessionContextReducer(stateWithHelp, {
        type: "TOGGLE_HELP_MENU",
      });

      expect(result.help.showHelpMenu).toBe(false);
    });

    it("handles SHOW_MINI_LESSON", () => {
      const result = sessionContextReducer(initialState, {
        type: "SHOW_MINI_LESSON",
        payload: 42,
      });

      expect(result.help.showMiniLesson).toBe(true);
      expect(result.help.selectedCapabilityId).toBe(42);
    });

    it("handles HIDE_MINI_LESSON", () => {
      const stateWithLesson: SessionContextState = {
        ...initialState,
        help: {
          ...initialState.help,
          showMiniLesson: true,
          selectedCapabilityId: 42,
        },
      };

      const result = sessionContextReducer(stateWithLesson, {
        type: "HIDE_MINI_LESSON",
      });

      expect(result.help.showMiniLesson).toBe(false);
    });

    it("handles SET_SELECTED_CAPABILITY_ID", () => {
      const result = sessionContextReducer(initialState, {
        type: "SET_SELECTED_CAPABILITY_ID",
        payload: 99,
      });

      expect(result.help.selectedCapabilityId).toBe(99);
    });
  });

  // ---------------------------------------------------------------------------
  // Timer Reducer Tests
  // ---------------------------------------------------------------------------
  describe("timer reducer", () => {
    it("handles SET_SESSION_START_TIME", () => {
      const result = sessionContextReducer(initialState, {
        type: "SET_SESSION_START_TIME",
        payload: 1234567890,
      });

      expect(result.timer.sessionStartTime).toBe(1234567890);
    });

    it("handles UPDATE_TIMER", () => {
      const now = new Date();
      const result = sessionContextReducer(initialState, {
        type: "UPDATE_TIMER",
        payload: { elapsedSeconds: 120, currentTime: now },
      });

      expect(result.timer.elapsedSeconds).toBe(120);
      expect(result.timer.currentTime).toBe(now);
    });

    it("handles SHOW_TIME_UP_MODAL", () => {
      const result = sessionContextReducer(initialState, {
        type: "SHOW_TIME_UP_MODAL",
      });

      expect(result.timer.showTimeUpModal).toBe(true);
    });

    it("handles MARK_TIME_UP_SHOWN", () => {
      const result = sessionContextReducer(initialState, {
        type: "MARK_TIME_UP_SHOWN",
      });

      expect(result.timer.hasShownTimeUpModal).toBe(true);
    });

    it("handles DISMISS_TIME_UP_MODAL", () => {
      const stateWithModal: SessionContextState = {
        ...initialState,
        timer: {
          ...initialState.timer,
          showTimeUpModal: true,
        },
      };

      const result = sessionContextReducer(stateWithModal, {
        type: "DISMISS_TIME_UP_MODAL",
      });

      expect(result.timer.showTimeUpModal).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Root Reducer Integration
  // ---------------------------------------------------------------------------
  describe("root reducer", () => {
    it("combines all slice reducers", () => {
      // Actions affecting different slices
      let state = sessionContextReducer(initialState, {
        type: "SET_LOADING",
        payload: true,
      });

      state = sessionContextReducer(state, {
        type: "SHOW_REFLECTION",
      });

      state = sessionContextReducer(state, {
        type: "SHOW_HELP_MENU",
      });

      expect(state.core.isLoading).toBe(true);
      expect(state.reflection.showReflection).toBe(true);
      expect(state.help.showHelpMenu).toBe(true);
    });
  });
});

describe("createInitialSessionState", () => {
  it("returns initial state with default values", () => {
    const state = createInitialSessionState();

    expect(state.core.session).toBeNull();
    expect(state.core.currentIndex).toBe(0);
    expect(state.core.isLoading).toBe(true); // Default is true (loading)
    expect(state.timer.sessionStartTime).toBeNull();
    expect(state.reflection.showReflection).toBe(false);
    expect(state.help.showHelpMenu).toBe(false);
  });

  it("allows partial overrides", () => {
    const state = createInitialSessionState({
      core: {
        session: null,
        currentIndex: 5,
        isLoading: true,
        error: null,
      },
    });

    expect(state.core.currentIndex).toBe(5);
    expect(state.core.isLoading).toBe(true);
  });

  it("preserves other state slices when overriding one", () => {
    const state = createInitialSessionState({
      timer: {
        sessionStartTime: 12345,
        elapsedSeconds: 60,
        currentTime: new Date(),
        showTimeUpModal: false,
        hasShownTimeUpModal: false,
      },
    });

    // Timer was overridden
    expect(state.timer.sessionStartTime).toBe(12345);
    expect(state.timer.elapsedSeconds).toBe(60);

    // Other slices keep defaults
    expect(state.core.session).toBeNull();
    expect(state.reflection.showReflection).toBe(false);
    expect(state.help.showHelpMenu).toBe(false);
  });
});
