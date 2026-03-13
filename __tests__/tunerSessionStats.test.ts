/**
 * Tests for Tuner Session Stats (Phase 2A)
 *
 * Tests session-level tracking for pitch accuracy, stability, and control.
 */

import {
  createInitialSessionStats,
  recordSessionSample,
  resetSessionStats,
  calculateSessionScores,
  calculateAttackSummary,
  calculateDriftFromHistory,
  calculateStabilitySummary,
  type SessionStats,
  type SessionSample,
} from "../src/screens/TuneMastery/components/Tuner/tunerSessionStats";

describe("tunerSessionStats", () => {
  // ===========================================
  // createInitialSessionStats
  // ===========================================

  describe("createInitialSessionStats", () => {
    it("returns initial state with zero values", () => {
      const stats = createInitialSessionStats();

      expect(stats.totalSamples).toBe(0);
      expect(stats.accurateSamples).toBe(0);
      expect(stats.stabilitySum).toBe(0);
      expect(stats.attackSamples).toEqual([]);
      expect(stats.hasEnoughData).toBe(false);
      expect(typeof stats.startTime).toBe("number");
    });

    it("sets startTime to current time", () => {
      const before = Date.now();
      const stats = createInitialSessionStats();
      const after = Date.now();

      expect(stats.startTime).toBeGreaterThanOrEqual(before);
      expect(stats.startTime).toBeLessThanOrEqual(after);
    });
  });

  // ===========================================
  // recordSessionSample
  // ===========================================

  describe("recordSessionSample", () => {
    let stats: SessionStats;

    beforeEach(() => {
      stats = createInitialSessionStats();
    });

    it("increments totalSamples", () => {
      const newStats = recordSessionSample(stats, {
        cents: 0,
        stdDev: 1,
        note: "C4",
        isAttackSample: false,
      });

      expect(newStats.totalSamples).toBe(1);
    });

    it("increments accurateSamples when within tolerance (±5 cents)", () => {
      // Within tolerance
      let newStats = recordSessionSample(stats, {
        cents: 3,
        stdDev: 1,
        note: "C4",
        isAttackSample: false,
      });
      expect(newStats.accurateSamples).toBe(1);

      // Edge case: exactly at tolerance
      newStats = recordSessionSample(newStats, {
        cents: 5,
        stdDev: 1,
        note: "C4",
        isAttackSample: false,
      });
      expect(newStats.accurateSamples).toBe(2);

      // Negative within tolerance
      newStats = recordSessionSample(newStats, {
        cents: -4,
        stdDev: 1,
        note: "C4",
        isAttackSample: false,
      });
      expect(newStats.accurateSamples).toBe(3);
    });

    it("does NOT increment accurateSamples when outside tolerance", () => {
      const newStats = recordSessionSample(stats, {
        cents: 8,
        stdDev: 1,
        note: "C4",
        isAttackSample: false,
      });

      expect(newStats.accurateSamples).toBe(0);
      expect(newStats.totalSamples).toBe(1);
    });

    it("accumulates stability score (lower stdDev = higher score)", () => {
      // Perfect stability (stdDev = 0) should add 100
      let newStats = recordSessionSample(stats, {
        cents: 0,
        stdDev: 0,
        note: "C4",
        isAttackSample: false,
      });
      expect(newStats.stabilitySum).toBe(100);

      // Medium stability (stdDev = 5) should add 50 (divisor is 10)
      newStats = recordSessionSample(newStats, {
        cents: 0,
        stdDev: 5,
        note: "C4",
        isAttackSample: false,
      });
      expect(newStats.stabilitySum).toBe(150); // 100 + 50

      // High stdDev (10) should add 0
      newStats = recordSessionSample(newStats, {
        cents: 0,
        stdDev: 10,
        note: "C4",
        isAttackSample: false,
      });
      expect(newStats.stabilitySum).toBe(150); // 100 + 50 + 0
    });

    it("clamps stability score between 0 and 100", () => {
      // Very high stdDev should not go negative
      const newStats = recordSessionSample(stats, {
        cents: 0,
        stdDev: 20,
        note: "C4",
        isAttackSample: false,
      });
      expect(newStats.stabilitySum).toBe(0);
    });

    it("records attack samples when isAttackSample is true", () => {
      const newStats = recordSessionSample(stats, {
        cents: 5,
        stdDev: 2,
        note: "C4",
        isAttackSample: true,
      });

      expect(newStats.attackSamples).toHaveLength(1);
      expect(newStats.attackSamples[0].cents).toBe(5);
      expect(newStats.attackSamples[0].note).toBe("C4");
      expect(newStats.attackSamples[0].isAttackSample).toBe(true);
      expect(typeof newStats.attackSamples[0].timestamp).toBe("number");
    });

    it("does NOT record attack sample when isAttackSample is false", () => {
      const newStats = recordSessionSample(stats, {
        cents: 5,
        stdDev: 2,
        note: "C4",
        isAttackSample: false,
      });

      expect(newStats.attackSamples).toHaveLength(0);
    });

    it("sets hasEnoughData to true after SESSION_MIN_SAMPLES (30)", () => {
      let currentStats = stats;

      // Add 29 samples
      for (let i = 0; i < 29; i++) {
        currentStats = recordSessionSample(currentStats, {
          cents: 0,
          stdDev: 1,
          note: "C4",
          isAttackSample: false,
        });
      }
      expect(currentStats.hasEnoughData).toBe(false);

      // 30th sample triggers hasEnoughData
      currentStats = recordSessionSample(currentStats, {
        cents: 0,
        stdDev: 1,
        note: "C4",
        isAttackSample: false,
      });
      expect(currentStats.hasEnoughData).toBe(true);
      expect(currentStats.totalSamples).toBe(30);
    });

    it("does not mutate original stats", () => {
      const original = createInitialSessionStats();
      const newStats = recordSessionSample(original, {
        cents: 0,
        stdDev: 1,
        note: "C4",
        isAttackSample: false,
      });

      expect(original.totalSamples).toBe(0);
      expect(newStats.totalSamples).toBe(1);
    });
  });

  // ===========================================
  // resetSessionStats
  // ===========================================

  describe("resetSessionStats", () => {
    it("returns fresh initial state", () => {
      const reset = resetSessionStats();

      expect(reset.totalSamples).toBe(0);
      expect(reset.accurateSamples).toBe(0);
      expect(reset.hasEnoughData).toBe(false);
    });
  });

  // ===========================================
  // calculateSessionScores
  // ===========================================

  describe("calculateSessionScores", () => {
    it("returns invalid scores when not enough data", () => {
      const stats = createInitialSessionStats();
      const scores = calculateSessionScores(stats);

      expect(scores.isValid).toBe(false);
      expect(scores.accuracy).toBe(0);
      expect(scores.stability).toBe(0);
      expect(scores.control).toBe(0);
    });

    it("calculates 100% accuracy when all samples within tolerance", () => {
      let stats = createInitialSessionStats();
      // Manually set to simulate accumulated data
      stats = {
        ...stats,
        totalSamples: 50,
        accurateSamples: 50, // 100% accurate
        stabilitySum: 4000, // 80 avg (80 * 50)
        hasEnoughData: true,
      };

      const scores = calculateSessionScores(stats);

      expect(scores.isValid).toBe(true);
      expect(scores.accuracy).toBe(100);
    });

    it("calculates correct accuracy percentage", () => {
      let stats = createInitialSessionStats();
      stats = {
        ...stats,
        totalSamples: 100,
        accurateSamples: 70, // 70% accurate
        stabilitySum: 7000, // 70 avg
        hasEnoughData: true,
      };

      const scores = calculateSessionScores(stats);

      expect(scores.accuracy).toBe(70);
    });

    it("calculates stability as average of accumulated scores", () => {
      let stats = createInitialSessionStats();
      stats = {
        ...stats,
        totalSamples: 100,
        accurateSamples: 100,
        stabilitySum: 8500, // 85 avg
        hasEnoughData: true,
      };

      const scores = calculateSessionScores(stats);

      expect(scores.stability).toBe(85);
    });

    it("calculates control as geometric mean of accuracy and stability", () => {
      let stats = createInitialSessionStats();
      stats = {
        ...stats,
        totalSamples: 100,
        accurateSamples: 81, // 81% accuracy
        stabilitySum: 8100, // 81% stability
        hasEnoughData: true,
      };

      const scores = calculateSessionScores(stats);

      expect(scores.accuracy).toBe(81);
      expect(scores.stability).toBe(81);
      // sqrt(81 * 81) = 81
      expect(scores.control).toBe(81);
    });

    it("control penalizes low accuracy or stability", () => {
      let stats = createInitialSessionStats();
      stats = {
        ...stats,
        totalSamples: 100,
        accurateSamples: 100, // 100% accuracy
        stabilitySum: 2500, // 25% stability
        hasEnoughData: true,
      };

      const scores = calculateSessionScores(stats);

      expect(scores.accuracy).toBe(100);
      expect(scores.stability).toBe(25);
      // sqrt(100 * 25) = 50
      expect(scores.control).toBe(50);
    });

    it("rounds scores to integers", () => {
      let stats = createInitialSessionStats();
      stats = {
        ...stats,
        totalSamples: 100,
        accurateSamples: 77, // 77%
        stabilitySum: 8333, // 83.33%
        hasEnoughData: true,
      };

      const scores = calculateSessionScores(stats);

      expect(scores.accuracy).toBe(77);
      expect(scores.stability).toBe(83);
      // sqrt(77 * 83) ≈ 79.96 → 80
      expect(scores.control).toBe(80);
    });
  });

  // ===========================================
  // calculateAttackSummary
  // ===========================================

  describe("calculateAttackSummary", () => {
    it("returns neutral when fewer than 3 attack samples", () => {
      let stats = createInitialSessionStats();
      stats = {
        ...stats,
        attackSamples: [
          {
            cents: 5,
            stdDev: 1,
            timestamp: 1000,
            note: "C4",
            isAttackSample: true,
          },
          {
            cents: 3,
            stdDev: 1,
            timestamp: 2000,
            note: "C4",
            isAttackSample: true,
          },
        ],
      };

      const summary = calculateAttackSummary(stats);

      expect(summary.attackDirection).toBe("neutral");
      expect(summary.summaryText).toBeNull();
      expect(summary.sampleCount).toBe(2);
    });

    it("detects sharp attack tendency", () => {
      let stats = createInitialSessionStats();
      stats = {
        ...stats,
        attackSamples: [
          {
            cents: 5,
            stdDev: 1,
            timestamp: 1000,
            note: "C4",
            isAttackSample: true,
          },
          {
            cents: 4,
            stdDev: 1,
            timestamp: 2000,
            note: "D4",
            isAttackSample: true,
          },
          {
            cents: 6,
            stdDev: 1,
            timestamp: 3000,
            note: "E4",
            isAttackSample: true,
          },
        ],
      };

      const summary = calculateAttackSummary(stats);

      expect(summary.attackDirection).toBe("sharp");
      expect(summary.averageAttackCents).toBe(5);
      expect(summary.summaryText).toBe("Your attacks averaged +5¢ sharp");
    });

    it("detects flat attack tendency", () => {
      let stats = createInitialSessionStats();
      stats = {
        ...stats,
        attackSamples: [
          {
            cents: -4,
            stdDev: 1,
            timestamp: 1000,
            note: "C4",
            isAttackSample: true,
          },
          {
            cents: -5,
            stdDev: 1,
            timestamp: 2000,
            note: "D4",
            isAttackSample: true,
          },
          {
            cents: -3,
            stdDev: 1,
            timestamp: 3000,
            note: "E4",
            isAttackSample: true,
          },
        ],
      };

      const summary = calculateAttackSummary(stats);

      expect(summary.attackDirection).toBe("flat");
      expect(summary.averageAttackCents).toBe(-4);
      expect(summary.summaryText).toBe("Your attacks averaged -4¢ flat");
    });

    it("returns neutral when attacks are close to center", () => {
      let stats = createInitialSessionStats();
      stats = {
        ...stats,
        attackSamples: [
          {
            cents: 1,
            stdDev: 1,
            timestamp: 1000,
            note: "C4",
            isAttackSample: true,
          },
          {
            cents: 0,
            stdDev: 1,
            timestamp: 2000,
            note: "D4",
            isAttackSample: true,
          },
          {
            cents: -1,
            stdDev: 1,
            timestamp: 3000,
            note: "E4",
            isAttackSample: true,
          },
        ],
      };

      const summary = calculateAttackSummary(stats);

      expect(summary.attackDirection).toBe("neutral");
      expect(summary.summaryText).toBeNull();
    });
  });

  // ===========================================
  // calculateDriftFromHistory
  // ===========================================

  describe("calculateDriftFromHistory", () => {
    it("returns stable when fewer than 10 samples", () => {
      const history = [
        { cents: 0, timestamp: 0 },
        { cents: 5, timestamp: 100 },
      ];

      const drift = calculateDriftFromHistory(history);

      expect(drift.driftDirection).toBe("stable");
      expect(drift.summaryText).toBeNull();
    });

    it("detects sharp drift (pitch rising over time)", () => {
      // Pitch drifting sharp at ~2 cents per second
      const history: Array<{ cents: number; timestamp: number }> = [];
      for (let i = 0; i < 20; i++) {
        history.push({
          cents: i * 0.2, // 2 cents per second = 0.2 cents per 100ms
          timestamp: i * 100,
        });
      }

      const drift = calculateDriftFromHistory(history);

      expect(drift.driftDirection).toBe("sharp");
      expect(drift.driftRate).toBeGreaterThan(1);
      expect(drift.summaryText).toContain("sharp");
    });

    it("detects flat drift (pitch falling over time)", () => {
      const history: Array<{ cents: number; timestamp: number }> = [];
      for (let i = 0; i < 20; i++) {
        history.push({
          cents: -i * 0.2, // Drifting flat
          timestamp: i * 100,
        });
      }

      const drift = calculateDriftFromHistory(history);

      expect(drift.driftDirection).toBe("flat");
      expect(drift.driftRate).toBeLessThan(-1);
      expect(drift.summaryText).toContain("flat");
    });

    it("returns stable when drift rate is minimal", () => {
      const history: Array<{ cents: number; timestamp: number }> = [];
      for (let i = 0; i < 20; i++) {
        history.push({
          cents: Math.sin(i) * 0.5, // Small oscillation, no trend
          timestamp: i * 100,
        });
      }

      const drift = calculateDriftFromHistory(history);

      expect(drift.driftDirection).toBe("stable");
    });
  });

  // ===========================================
  // calculateStabilitySummary
  // ===========================================

  describe("calculateStabilitySummary", () => {
    it("returns unstable when scores are invalid", () => {
      const scores = {
        accuracy: 0,
        stability: 0,
        control: 0,
        isValid: false,
      };

      const summary = calculateStabilitySummary(scores);

      expect(summary.averageLevel).toBe("unstable");
      expect(summary.summaryText).toBeNull();
    });

    it("returns stable with encouragement for high stability", () => {
      const scores = {
        accuracy: 90,
        stability: 85,
        control: 87,
        isValid: true,
      };

      const summary = calculateStabilitySummary(scores);

      expect(summary.averageLevel).toBe("stable");
      expect(summary.summaryText).toContain("great breath control");
    });

    it("returns moderate with coaching for medium stability", () => {
      const scores = {
        accuracy: 70,
        stability: 60,
        control: 65,
        isValid: true,
      };

      const summary = calculateStabilitySummary(scores);

      expect(summary.averageLevel).toBe("moderate");
      expect(summary.summaryText).toContain("developing");
    });

    it("returns unstable with guidance for low stability", () => {
      const scores = {
        accuracy: 50,
        stability: 30,
        control: 38,
        isValid: true,
      };

      const summary = calculateStabilitySummary(scores);

      expect(summary.averageLevel).toBe("unstable");
      expect(summary.summaryText).toContain("long tones");
    });
  });
});
