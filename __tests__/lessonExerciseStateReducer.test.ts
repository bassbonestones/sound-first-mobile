/**
 * Tests for lessonExerciseStateReducer
 * Tests state management reducer for lesson exercises
 */
import {
  lessonExerciseStateReducer,
  createInitialState,
  LessonExerciseState,
  LessonExerciseAction,
} from "../src/screens/Session/components/exercises/shared/lessonExerciseStateReducer";

describe("lessonExerciseStateReducer", () => {
  describe("createInitialState", () => {
    it("creates state with specified start phase", () => {
      const state = createInitialState("focus_card");
      expect(state.phase).toBe("focus_card");
    });

    it("initializes playback state", () => {
      const state = createInitialState("focus_card");
      expect(state.isPlaying).toBe(false);
      expect(state.currentBeat).toBe(0);
      expect(state.isSubdivision).toBe(false);
    });

    it("initializes UI state", () => {
      const state = createInitialState("focus_card");
      expect(state.showNotation).toBe(false);
      expect(state.showCursor).toBe(false);
      expect(state.hasHeardPattern).toBe(false);
    });

    it("initializes sing state", () => {
      const state = createInitialState("focus_card");
      expect(state.singResult).toBeNull();
      expect(state.singAttempts).toBe(0);
    });

    it("initializes play state", () => {
      const state = createInitialState("focus_card");
      expect(state.playResult).toBeNull();
      expect(state.playAttempts).toBe(0);
    });

    it("initializes attestation state", () => {
      const state = createInitialState("focus_card");
      expect(state.showAttestModal).toBe(false);
      expect(state.attestPhase).toBeNull();
    });

    it("initializes success state", () => {
      const state = createInitialState("focus_card");
      expect(state.showSuccess).toBe(false);
      expect(state.successfulRounds).toBe(0);
    });

    it("initializes progress state", () => {
      const state = createInitialState("focus_card");
      expect(state.currentPatternIndex).toBe(0);
      expect(state.completedPatterns).toEqual({});
    });

    it("initializes focus card state", () => {
      const state = createInitialState("focus_card");
      expect(state.focusCardIndex).toBe(0);
    });
  });

  describe("phase actions", () => {
    it("SET_PHASE updates phase", () => {
      const state = createInitialState("focus_card");
      const newState = lessonExerciseStateReducer(state, {
        type: "SET_PHASE",
        payload: "listen",
      });
      expect(newState.phase).toBe("listen");
    });

    it("RESET_PHASE updates phase", () => {
      const state = { ...createInitialState("listen"), phase: "sing" };
      const newState = lessonExerciseStateReducer(state, {
        type: "RESET_PHASE",
        payload: "focus_card",
      });
      expect(newState.phase).toBe("focus_card");
    });

    it("GO_TO_NEXT_PHASE advances to next phase", () => {
      const state = createInitialState("focus_card");
      const phaseOrder = ["focus_card", "listen", "sing"];
      const newState = lessonExerciseStateReducer(state, {
        type: "GO_TO_NEXT_PHASE",
        payload: { phaseOrder },
      });
      expect(newState.phase).toBe("listen");
    });

    it("GO_TO_NEXT_PHASE does nothing at last phase", () => {
      const state = { ...createInitialState("focus_card"), phase: "sing" };
      const phaseOrder = ["focus_card", "listen", "sing"];
      const newState = lessonExerciseStateReducer(state, {
        type: "GO_TO_NEXT_PHASE",
        payload: { phaseOrder },
      });
      expect(newState.phase).toBe("sing");
    });

    it("GO_TO_NEXT_PHASE does nothing for unknown phase", () => {
      const state = { ...createInitialState("focus_card"), phase: "unknown" };
      const phaseOrder = ["focus_card", "listen", "sing"];
      const newState = lessonExerciseStateReducer(state, {
        type: "GO_TO_NEXT_PHASE",
        payload: { phaseOrder },
      });
      expect(newState.phase).toBe("unknown");
    });

    it("GO_TO_PREV_PHASE goes back to previous phase", () => {
      const state = { ...createInitialState("focus_card"), phase: "listen" };
      const phaseOrder = ["focus_card", "listen", "sing"];
      const newState = lessonExerciseStateReducer(state, {
        type: "GO_TO_PREV_PHASE",
        payload: { phaseOrder },
      });
      expect(newState.phase).toBe("focus_card");
    });

    it("GO_TO_PREV_PHASE does nothing at first phase", () => {
      const state = createInitialState("focus_card");
      const phaseOrder = ["focus_card", "listen", "sing"];
      const newState = lessonExerciseStateReducer(state, {
        type: "GO_TO_PREV_PHASE",
        payload: { phaseOrder },
      });
      expect(newState.phase).toBe("focus_card");
    });
  });

  describe("playback actions", () => {
    it("SET_IS_PLAYING updates isPlaying", () => {
      const state = createInitialState("focus_card");
      const newState = lessonExerciseStateReducer(state, {
        type: "SET_IS_PLAYING",
        payload: true,
      });
      expect(newState.isPlaying).toBe(true);
    });

    it("SET_CURRENT_BEAT updates currentBeat", () => {
      const state = createInitialState("focus_card");
      const newState = lessonExerciseStateReducer(state, {
        type: "SET_CURRENT_BEAT",
        payload: 3,
      });
      expect(newState.currentBeat).toBe(3);
    });

    it("SET_IS_SUBDIVISION updates isSubdivision", () => {
      const state = createInitialState("focus_card");
      const newState = lessonExerciseStateReducer(state, {
        type: "SET_IS_SUBDIVISION",
        payload: true,
      });
      expect(newState.isSubdivision).toBe(true);
    });
  });

  describe("UI actions", () => {
    it("SET_SHOW_NOTATION updates showNotation", () => {
      const state = createInitialState("focus_card");
      const newState = lessonExerciseStateReducer(state, {
        type: "SET_SHOW_NOTATION",
        payload: true,
      });
      expect(newState.showNotation).toBe(true);
    });

    it("SET_SHOW_CURSOR updates showCursor", () => {
      const state = createInitialState("focus_card");
      const newState = lessonExerciseStateReducer(state, {
        type: "SET_SHOW_CURSOR",
        payload: true,
      });
      expect(newState.showCursor).toBe(true);
    });

    it("SET_HAS_HEARD_PATTERN updates hasHeardPattern", () => {
      const state = createInitialState("focus_card");
      const newState = lessonExerciseStateReducer(state, {
        type: "SET_HAS_HEARD_PATTERN",
        payload: true,
      });
      expect(newState.hasHeardPattern).toBe(true);
    });
  });

  describe("sing phase actions", () => {
    it("SET_SING_RESULT updates singResult", () => {
      const state = createInitialState("focus_card");
      const result = { success: true, message: "Great!" };
      const newState = lessonExerciseStateReducer(state, {
        type: "SET_SING_RESULT",
        payload: result,
      });
      expect(newState.singResult).toEqual(result);
    });

    it("INCREMENT_SING_ATTEMPTS increments count", () => {
      const state = createInitialState("focus_card");
      let newState = lessonExerciseStateReducer(state, {
        type: "INCREMENT_SING_ATTEMPTS",
      });
      expect(newState.singAttempts).toBe(1);
      newState = lessonExerciseStateReducer(newState, {
        type: "INCREMENT_SING_ATTEMPTS",
      });
      expect(newState.singAttempts).toBe(2);
    });

    it("RESET_SING_ATTEMPTS resets count to 0", () => {
      const state = { ...createInitialState("focus_card"), singAttempts: 5 };
      const newState = lessonExerciseStateReducer(state, {
        type: "RESET_SING_ATTEMPTS",
      });
      expect(newState.singAttempts).toBe(0);
    });
  });

  describe("play phase actions", () => {
    it("SET_PLAY_RESULT updates playResult", () => {
      const state = createInitialState("focus_card");
      const result = { success: false, message: "Try again" };
      const newState = lessonExerciseStateReducer(state, {
        type: "SET_PLAY_RESULT",
        payload: result,
      });
      expect(newState.playResult).toEqual(result);
    });

    it("INCREMENT_PLAY_ATTEMPTS increments count", () => {
      const state = createInitialState("focus_card");
      const newState = lessonExerciseStateReducer(state, {
        type: "INCREMENT_PLAY_ATTEMPTS",
      });
      expect(newState.playAttempts).toBe(1);
    });

    it("RESET_PLAY_ATTEMPTS resets count to 0", () => {
      const state = { ...createInitialState("focus_card"), playAttempts: 3 };
      const newState = lessonExerciseStateReducer(state, {
        type: "RESET_PLAY_ATTEMPTS",
      });
      expect(newState.playAttempts).toBe(0);
    });
  });

  describe("attestation actions", () => {
    it("OPEN_ATTEST_MODAL opens modal with phase", () => {
      const state = createInitialState("focus_card");
      const newState = lessonExerciseStateReducer(state, {
        type: "OPEN_ATTEST_MODAL",
        payload: "sing",
      });
      expect(newState.showAttestModal).toBe(true);
      expect(newState.attestPhase).toBe("sing");
    });

    it("CLOSE_ATTEST_MODAL closes modal", () => {
      const state = {
        ...createInitialState("focus_card"),
        showAttestModal: true,
        attestPhase: "play" as const,
      };
      const newState = lessonExerciseStateReducer(state, {
        type: "CLOSE_ATTEST_MODAL",
      });
      expect(newState.showAttestModal).toBe(false);
      expect(newState.attestPhase).toBeNull();
    });

    it("CONFIRM_ATTESTATION for sing sets success result", () => {
      const state = {
        ...createInitialState("focus_card"),
        showAttestModal: true,
        attestPhase: "sing" as const,
        singAttempts: 3,
      };
      const newState = lessonExerciseStateReducer(state, {
        type: "CONFIRM_ATTESTATION",
      });
      expect(newState.singResult).toEqual({ success: true, attested: true });
      expect(newState.singAttempts).toBe(0);
      expect(newState.showAttestModal).toBe(false);
    });

    it("CONFIRM_ATTESTATION for play sets success result", () => {
      const state = {
        ...createInitialState("focus_card"),
        showAttestModal: true,
        attestPhase: "play" as const,
        playAttempts: 3,
      };
      const newState = lessonExerciseStateReducer(state, {
        type: "CONFIRM_ATTESTATION",
      });
      expect(newState.playResult).toEqual({ success: true, attested: true });
      expect(newState.playAttempts).toBe(0);
      expect(newState.showAttestModal).toBe(false);
    });

    it("CONFIRM_ATTESTATION does nothing without attestPhase", () => {
      const state = createInitialState("focus_card");
      const newState = lessonExerciseStateReducer(state, {
        type: "CONFIRM_ATTESTATION",
      });
      expect(newState).toEqual(state);
    });
  });

  describe("success actions", () => {
    it("SET_SHOW_SUCCESS updates showSuccess", () => {
      const state = createInitialState("focus_card");
      const newState = lessonExerciseStateReducer(state, {
        type: "SET_SHOW_SUCCESS",
        payload: true,
      });
      expect(newState.showSuccess).toBe(true);
    });

    it("INCREMENT_SUCCESSFUL_ROUNDS increments count", () => {
      const state = createInitialState("focus_card");
      const newState = lessonExerciseStateReducer(state, {
        type: "INCREMENT_SUCCESSFUL_ROUNDS",
      });
      expect(newState.successfulRounds).toBe(1);
    });

    it("RESET_SUCCESSFUL_ROUNDS resets count to 0", () => {
      const state = {
        ...createInitialState("focus_card"),
        successfulRounds: 5,
      };
      const newState = lessonExerciseStateReducer(state, {
        type: "RESET_SUCCESSFUL_ROUNDS",
      });
      expect(newState.successfulRounds).toBe(0);
    });
  });

  describe("progress actions", () => {
    it("SET_CURRENT_PATTERN_INDEX updates index", () => {
      const state = createInitialState("focus_card");
      const newState = lessonExerciseStateReducer(state, {
        type: "SET_CURRENT_PATTERN_INDEX",
        payload: 2,
      });
      expect(newState.currentPatternIndex).toBe(2);
    });

    it("MARK_ITEM_COMPLETE adds item to completed", () => {
      const state = createInitialState("focus_card");
      const newState = lessonExerciseStateReducer(state, {
        type: "MARK_ITEM_COMPLETE",
        payload: "pattern_1",
      });
      expect(newState.completedPatterns).toEqual({ pattern_1: true });
    });

    it("MARK_ITEM_COMPLETE preserves existing completed items", () => {
      const state = {
        ...createInitialState("focus_card"),
        completedPatterns: { pattern_1: true },
      };
      const newState = lessonExerciseStateReducer(state, {
        type: "MARK_ITEM_COMPLETE",
        payload: "pattern_2",
      });
      expect(newState.completedPatterns).toEqual({
        pattern_1: true,
        pattern_2: true,
      });
    });

    it("RESET_PROGRESS resets index and completed items", () => {
      const state = {
        ...createInitialState("focus_card"),
        currentPatternIndex: 3,
        completedPatterns: { pattern_1: true, pattern_2: true },
      };
      const newState = lessonExerciseStateReducer(state, {
        type: "RESET_PROGRESS",
      });
      expect(newState.currentPatternIndex).toBe(0);
      expect(newState.completedPatterns).toEqual({});
    });
  });

  describe("focus card actions", () => {
    it("SET_FOCUS_CARD_INDEX updates index", () => {
      const state = createInitialState("focus_card");
      const newState = lessonExerciseStateReducer(state, {
        type: "SET_FOCUS_CARD_INDEX",
        payload: 2,
      });
      expect(newState.focusCardIndex).toBe(2);
    });

    it("ROTATE_FOCUS_CARD increments index", () => {
      const state = createInitialState("focus_card");
      const newState = lessonExerciseStateReducer(state, {
        type: "ROTATE_FOCUS_CARD",
      });
      expect(newState.focusCardIndex).toBe(1);
    });
  });

  describe("combined actions", () => {
    it("RESET_FOR_NEW_ROUND resets phase-specific state", () => {
      const state = {
        ...createInitialState("sing"),
        singResult: { success: true },
        playResult: { success: true },
        hasHeardPattern: true,
        showNotation: true,
        showCursor: true,
      };
      const newState = lessonExerciseStateReducer(state, {
        type: "RESET_FOR_NEW_ROUND",
      });
      expect(newState.singResult).toBeNull();
      expect(newState.playResult).toBeNull();
      expect(newState.hasHeardPattern).toBe(false);
      expect(newState.showNotation).toBe(false);
      expect(newState.showCursor).toBe(false);
      // phase should not be reset
      expect(newState.phase).toBe("sing");
    });

    it("RESET_ALL creates new initial state", () => {
      const state = {
        ...createInitialState("feedback"),
        singResult: { success: true },
        successfulRounds: 3,
        completedPatterns: { p1: true },
      };
      const newState = lessonExerciseStateReducer(state, {
        type: "RESET_ALL",
        payload: { startPhase: "focus_card" },
      });
      expect(newState).toEqual(createInitialState("focus_card"));
    });
  });

  describe("unknown action", () => {
    it("returns current state for unknown action", () => {
      const state = createInitialState("focus_card");
      const newState = lessonExerciseStateReducer(state, {
        type: "UNKNOWN_ACTION" as any,
      });
      expect(newState).toBe(state);
    });
  });
});
