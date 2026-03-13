/**
 * Tests for Target Tone Challenge (Phase 2A)
 */

import {
  createInitialChallengeState,
  createChallengeTarget,
  createRandomChallenge,
  isTargetNote,
  isWithinTolerance,
  matchesChallenge,
  calculateChallengeProgress,
  isChallengeComplete,
  startChallenge,
  updateChallengeState,
  cancelChallenge,
  resetAfterSuccess,
  getChallengeInstructionText,
  getChallengeStatusText,
  getChallengeProgressColor,
  DEFAULT_CHALLENGE_NOTES,
  type ChallengeState,
  type ChallengeTarget,
} from "../src/screens/TuneMastery/components/Tuner/tunerChallenge";

describe("tunerChallenge", () => {
  // ===========================================
  // createInitialChallengeState
  // ===========================================

  describe("createInitialChallengeState", () => {
    it("returns idle state with no target", () => {
      const state = createInitialChallengeState();

      expect(state.status).toBe("idle");
      expect(state.target).toBeNull();
      expect(state.holdStartTime).toBeNull();
      expect(state.progress).toBe(0);
      expect(state.completedCount).toBe(0);
      expect(state.attemptCount).toBe(0);
    });
  });

  // ===========================================
  // createChallengeTarget
  // ===========================================

  describe("createChallengeTarget", () => {
    it("creates target with medium difficulty by default", () => {
      const target = createChallengeTarget("C4");

      expect(target.note).toBe("C4");
      expect(target.tolerance).toBe(5); // medium = 5
      expect(target.durationMs).toBe(4000); // medium = 4000
      expect(target.difficulty).toBe("medium");
    });

    it("creates target with specified difficulty", () => {
      const easy = createChallengeTarget("A3", "easy");
      expect(easy.tolerance).toBe(10);
      expect(easy.durationMs).toBe(3000);

      const hard = createChallengeTarget("G4", "hard");
      expect(hard.tolerance).toBe(3);
      expect(hard.durationMs).toBe(5000);

      const expert = createChallengeTarget("E5", "expert");
      expect(expert.tolerance).toBe(2);
      expect(expert.durationMs).toBe(6000);
    });
  });

  // ===========================================
  // createRandomChallenge
  // ===========================================

  describe("createRandomChallenge", () => {
    it("creates challenge from provided note pool", () => {
      const notes = ["C4", "D4", "E4"];
      const target = createRandomChallenge(notes, "easy");

      expect(notes).toContain(target.note);
      expect(target.difficulty).toBe("easy");
    });

    it("uses default difficulty if not specified", () => {
      const target = createRandomChallenge(DEFAULT_CHALLENGE_NOTES);
      expect(target.difficulty).toBe("medium");
    });
  });

  // ===========================================
  // isTargetNote
  // ===========================================

  describe("isTargetNote", () => {
    it("returns true for exact match", () => {
      expect(isTargetNote("C4", "C4")).toBe(true);
      expect(isTargetNote("A#3", "A#3")).toBe(true);
    });

    it("returns false for different notes", () => {
      expect(isTargetNote("C4", "D4")).toBe(false);
      expect(isTargetNote("C4", "C5")).toBe(false); // Different octave
    });

    it("returns false for null current note", () => {
      expect(isTargetNote(null, "C4")).toBe(false);
    });
  });

  // ===========================================
  // isWithinTolerance
  // ===========================================

  describe("isWithinTolerance", () => {
    it("returns true when within tolerance", () => {
      expect(isWithinTolerance(0, 5)).toBe(true);
      expect(isWithinTolerance(3, 5)).toBe(true);
      expect(isWithinTolerance(-4, 5)).toBe(true);
      expect(isWithinTolerance(5, 5)).toBe(true); // Edge case
    });

    it("returns false when outside tolerance", () => {
      expect(isWithinTolerance(6, 5)).toBe(false);
      expect(isWithinTolerance(-7, 5)).toBe(false);
    });

    it("uses default tolerance of 5", () => {
      expect(isWithinTolerance(5)).toBe(true);
      expect(isWithinTolerance(6)).toBe(false);
    });
  });

  // ===========================================
  // matchesChallenge
  // ===========================================

  describe("matchesChallenge", () => {
    const target: ChallengeTarget = {
      note: "A4",
      tolerance: 5,
      durationMs: 4000,
      difficulty: "medium",
    };

    it("returns true when note and cents match", () => {
      expect(matchesChallenge("A4", 0, target)).toBe(true);
      expect(matchesChallenge("A4", 3, target)).toBe(true);
      expect(matchesChallenge("A4", -5, target)).toBe(true);
    });

    it("returns false when note is wrong", () => {
      expect(matchesChallenge("B4", 0, target)).toBe(false);
    });

    it("returns false when cents outside tolerance", () => {
      expect(matchesChallenge("A4", 8, target)).toBe(false);
    });

    it("returns false when no target", () => {
      expect(matchesChallenge("A4", 0, null)).toBe(false);
    });

    it("returns false when no current note", () => {
      expect(matchesChallenge(null, 0, target)).toBe(false);
    });
  });

  // ===========================================
  // calculateChallengeProgress
  // ===========================================

  describe("calculateChallengeProgress", () => {
    it("returns 0 when no hold start time", () => {
      expect(calculateChallengeProgress(null, 4000)).toBe(0);
    });

    it("returns 0 during minimum hold period", () => {
      const now = 1000;
      const holdStart = now - 50; // Only 50ms elapsed
      expect(calculateChallengeProgress(holdStart, 4000, now)).toBe(0);
    });

    it("returns partial progress during hold", () => {
      const now = 5000;
      const holdStart = now - 2000; // 2 seconds elapsed
      const progress = calculateChallengeProgress(holdStart, 4000, now);
      expect(progress).toBe(0.5);
    });

    it("clamps progress at 1", () => {
      const now = 10000;
      const holdStart = now - 6000; // 6 seconds elapsed, but only need 4
      const progress = calculateChallengeProgress(holdStart, 4000, now);
      expect(progress).toBe(1);
    });
  });

  // ===========================================
  // isChallengeComplete
  // ===========================================

  describe("isChallengeComplete", () => {
    it("returns true when progress >= 1", () => {
      expect(isChallengeComplete(1)).toBe(true);
      expect(isChallengeComplete(1.1)).toBe(true);
    });

    it("returns false when progress < 1", () => {
      expect(isChallengeComplete(0)).toBe(false);
      expect(isChallengeComplete(0.99)).toBe(false);
    });
  });

  // ===========================================
  // startChallenge
  // ===========================================

  describe("startChallenge", () => {
    it("sets status to waiting and stores target", () => {
      const state = createInitialChallengeState();
      const target = createChallengeTarget("C4");

      const newState = startChallenge(state, target);

      expect(newState.status).toBe("waiting");
      expect(newState.target).toBe(target);
      expect(newState.progress).toBe(0);
      expect(newState.holdStartTime).toBeNull();
      expect(newState.attemptCount).toBe(1);
    });

    it("increments attempt count", () => {
      let state = createInitialChallengeState();
      const target = createChallengeTarget("C4");

      state = startChallenge(state, target);
      expect(state.attemptCount).toBe(1);

      state = cancelChallenge(state);
      state = startChallenge(state, target);
      expect(state.attemptCount).toBe(2);
    });
  });

  // ===========================================
  // updateChallengeState
  // ===========================================

  describe("updateChallengeState", () => {
    it("does nothing when idle", () => {
      const state = createInitialChallengeState();
      const newState = updateChallengeState(state, "C4", 0);
      expect(newState.status).toBe("idle");
    });

    it("transitions to holding when matching", () => {
      let state = createInitialChallengeState();
      state = startChallenge(state, createChallengeTarget("C4"));

      const now = Date.now();
      const newState = updateChallengeState(state, "C4", 3, now);

      expect(newState.status).toBe("holding");
      expect(newState.holdStartTime).toBe(now);
    });

    it("resets progress when note no longer matches", () => {
      let state = createInitialChallengeState();
      state = startChallenge(state, createChallengeTarget("C4"));

      // Start holding
      const now = 1000;
      state = updateChallengeState(state, "C4", 0, now);
      expect(state.status).toBe("holding");

      // Stop matching
      state = updateChallengeState(state, "D4", 0, now + 500);
      expect(state.status).toBe("waiting");
      expect(state.progress).toBe(0);
      expect(state.holdStartTime).toBeNull();
    });

    it("transitions to success when held long enough", () => {
      let state = createInitialChallengeState();
      const target = createChallengeTarget("C4", "medium"); // 4 seconds
      state = startChallenge(state, target);

      const startTime = 1000;
      state = updateChallengeState(state, "C4", 0, startTime);

      // Simulate holding for full duration
      const endTime = startTime + 5000; // More than 4 seconds
      state = updateChallengeState(state, "C4", 0, endTime);

      expect(state.status).toBe("success");
      expect(state.progress).toBe(1);
      expect(state.completedCount).toBe(1);
    });

    it("accumulates progress over time", () => {
      let state = createInitialChallengeState();
      const target = createChallengeTarget("C4", "medium"); // 4 seconds
      state = startChallenge(state, target);

      const startTime = 1000;
      state = updateChallengeState(state, "C4", 0, startTime);

      // 2 seconds in = 50% progress
      state = updateChallengeState(state, "C4", 0, startTime + 2000);
      expect(state.progress).toBeCloseTo(0.5, 1);
    });
  });

  // ===========================================
  // cancelChallenge
  // ===========================================

  describe("cancelChallenge", () => {
    it("resets to idle state", () => {
      let state = createInitialChallengeState();
      state = startChallenge(state, createChallengeTarget("C4"));

      const cancelled = cancelChallenge(state);

      expect(cancelled.status).toBe("idle");
      expect(cancelled.target).toBeNull();
      expect(cancelled.progress).toBe(0);
    });

    it("preserves completed count", () => {
      let state = createInitialChallengeState();
      state = { ...state, completedCount: 3 };

      const cancelled = cancelChallenge(state);
      expect(cancelled.completedCount).toBe(3);
    });
  });

  // ===========================================
  // resetAfterSuccess
  // ===========================================

  describe("resetAfterSuccess", () => {
    it("resets to idle while preserving stats", () => {
      let state = createInitialChallengeState();
      state = {
        ...state,
        status: "success",
        completedCount: 5,
        attemptCount: 7,
      };

      const reset = resetAfterSuccess(state);

      expect(reset.status).toBe("idle");
      expect(reset.completedCount).toBe(5);
      expect(reset.attemptCount).toBe(7);
    });
  });

  // ===========================================
  // Display helpers
  // ===========================================

  describe("getChallengeInstructionText", () => {
    it("formats instruction text correctly", () => {
      const target = createChallengeTarget("A4", "medium");
      const text = getChallengeInstructionText(target);
      expect(text).toBe("Hold A4 within ±5¢ for 4s");
    });

    it("rounds duration to seconds", () => {
      const target = { ...createChallengeTarget("C4"), durationMs: 3500 };
      const text = getChallengeInstructionText(target);
      expect(text).toContain("4s"); // Rounds 3.5 to 4
    });
  });

  describe("getChallengeStatusText", () => {
    it("returns appropriate text for each status", () => {
      const idle = createInitialChallengeState();
      expect(getChallengeStatusText(idle)).toBe("Start a challenge!");

      const waiting = {
        ...idle,
        status: "waiting" as const,
        target: createChallengeTarget("C4"),
      };
      expect(getChallengeStatusText(waiting)).toBe("Play C4...");

      const holding = {
        ...waiting,
        status: "holding" as const,
        progress: 0.5,
      };
      expect(getChallengeStatusText(holding)).toBe("Hold it! 50%");

      const success = { ...holding, status: "success" as const };
      expect(getChallengeStatusText(success)).toContain("Success");
    });
  });

  describe("getChallengeProgressColor", () => {
    it("returns green when holding", () => {
      const state = {
        ...createInitialChallengeState(),
        status: "holding" as const,
      };
      expect(getChallengeProgressColor(state)).toBe("#4CAF50");
    });

    it("returns blue when success", () => {
      const state = {
        ...createInitialChallengeState(),
        status: "success" as const,
      };
      expect(getChallengeProgressColor(state)).toBe("#2196F3");
    });

    it("returns gray when waiting", () => {
      const state = {
        ...createInitialChallengeState(),
        status: "waiting" as const,
      };
      expect(getChallengeProgressColor(state)).toBe("#888");
    });
  });
});
