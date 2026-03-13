/**
 * Tests for tunerStateMachine
 *
 * Tests the state machine that manages tuner state transitions.
 */

import {
  tunerReducer,
  initialContext,
  isDetectingPhase,
  isLocked,
  isInTune,
  getCenteredStableDuration,
  type TunerStateContext,
  type TunerAction,
} from "../src/screens/TuneMastery/components/Tuner/tunerStateMachine";
import {
  DETECTION_WARMUP_MS,
  CENTER_LOCK_MS,
} from "../src/screens/TuneMastery/components/Tuner/tunerConstants";

describe("tunerStateMachine", () => {
  describe("initialContext", () => {
    it("starts with NO_SIGNAL state", () => {
      expect(initialContext.state).toBe("NO_SIGNAL");
    });

    it("has null timing values", () => {
      expect(initialContext.signalStartTime).toBeNull();
      expect(initialContext.centeredStableStartTime).toBeNull();
    });

    it("has no signal", () => {
      expect(initialContext.hasSignal).toBe(false);
    });
  });

  describe("SIGNAL_DETECTED action", () => {
    describe("warmup phase", () => {
      it("transitions to DETECTING when signal first detected", () => {
        const action: TunerAction = {
          type: "SIGNAL_DETECTED",
          cents: 0,
          centsHistory: [0],
          timestamp: 1000,
        };
        const result = tunerReducer(initialContext, action);

        expect(result.state).toBe("DETECTING");
        expect(result.signalStartTime).toBe(1000);
        expect(result.warmupComplete).toBe(false);
      });

      it("stays in DETECTING during warmup period", () => {
        const firstAction: TunerAction = {
          type: "SIGNAL_DETECTED",
          cents: 0,
          centsHistory: [0],
          timestamp: 1000,
        };
        const afterFirst = tunerReducer(initialContext, firstAction);

        // 100ms later (still within 200ms warmup)
        const secondAction: TunerAction = {
          type: "SIGNAL_DETECTED",
          cents: 0,
          centsHistory: [0, 0],
          timestamp: 1100,
        };
        const result = tunerReducer(afterFirst, secondAction);

        expect(result.state).toBe("DETECTING");
        expect(result.warmupComplete).toBe(false);
      });

      it("completes warmup after DETECTION_WARMUP_MS", () => {
        const firstAction: TunerAction = {
          type: "SIGNAL_DETECTED",
          cents: 0,
          centsHistory: [0],
          timestamp: 1000,
        };
        const afterFirst = tunerReducer(initialContext, firstAction);

        // DETECTION_WARMUP_MS later
        const secondAction: TunerAction = {
          type: "SIGNAL_DETECTED",
          cents: 0,
          centsHistory: [0, 0, 0, 0, 0], // Stable history
          timestamp: 1000 + DETECTION_WARMUP_MS,
        };
        const result = tunerReducer(afterFirst, secondAction);

        expect(result.warmupComplete).toBe(true);
        expect(result.state).not.toBe("DETECTING");
      });
    });

    describe("after warmup - out of tune", () => {
      it("transitions to OUT_OF_TUNE when not centered", () => {
        let context = initialContext;

        // First signal
        context = tunerReducer(context, {
          type: "SIGNAL_DETECTED",
          cents: 10, // Not centered (> 3)
          centsHistory: [10],
          timestamp: 1000,
        });

        // After warmup
        context = tunerReducer(context, {
          type: "SIGNAL_DETECTED",
          cents: 10,
          centsHistory: [10, 10, 10, 10, 10],
          timestamp: 1000 + DETECTION_WARMUP_MS,
        });

        expect(context.state).toBe("OUT_OF_TUNE");
        expect(context.centeredStableStartTime).toBeNull();
      });
    });

    describe("after warmup - centered but unstable", () => {
      it("transitions to IN_TUNE_UNSTABLE when centered but unstable", () => {
        let context = initialContext;

        // First signal
        context = tunerReducer(context, {
          type: "SIGNAL_DETECTED",
          cents: 0,
          centsHistory: [0],
          timestamp: 1000,
        });

        // After warmup with high variance history (unstable)
        context = tunerReducer(context, {
          type: "SIGNAL_DETECTED",
          cents: 0,
          centsHistory: [0, 10, -10, 10, -10], // High std dev > 5
          timestamp: 1000 + DETECTION_WARMUP_MS,
        });

        expect(context.state).toBe("IN_TUNE_UNSTABLE");
        expect(context.centeredStableStartTime).toBeNull();
      });
    });

    describe("after warmup - centered and stable", () => {
      it("transitions to IN_TUNE_STABLE when centered and stable", () => {
        let context = initialContext;

        // First signal
        context = tunerReducer(context, {
          type: "SIGNAL_DETECTED",
          cents: 0,
          centsHistory: [0],
          timestamp: 1000,
        });

        // After warmup with stable history
        context = tunerReducer(context, {
          type: "SIGNAL_DETECTED",
          cents: 0,
          centsHistory: [0, 0, 0, 0, 0], // Low std dev
          timestamp: 1000 + DETECTION_WARMUP_MS,
        });

        expect(context.state).toBe("IN_TUNE_STABLE");
        expect(context.centeredStableStartTime).toBe(
          1000 + DETECTION_WARMUP_MS,
        );
      });

      it("transitions to PERFECT_LOCKED after CENTER_LOCK_MS", () => {
        let context = initialContext;
        const startTime = 1000;

        // First signal
        context = tunerReducer(context, {
          type: "SIGNAL_DETECTED",
          cents: 0,
          centsHistory: [0],
          timestamp: startTime,
        });

        // After warmup - becomes IN_TUNE_STABLE
        context = tunerReducer(context, {
          type: "SIGNAL_DETECTED",
          cents: 0,
          centsHistory: [0, 0, 0, 0, 0],
          timestamp: startTime + DETECTION_WARMUP_MS,
        });

        expect(context.state).toBe("IN_TUNE_STABLE");

        // After CENTER_LOCK_MS of being centered and stable
        context = tunerReducer(context, {
          type: "SIGNAL_DETECTED",
          cents: 0,
          centsHistory: [0, 0, 0, 0, 0],
          timestamp: startTime + DETECTION_WARMUP_MS + CENTER_LOCK_MS,
        });

        expect(context.state).toBe("PERFECT_LOCKED");
      });
    });

    describe("state transitions from locked back to other states", () => {
      it("transitions from PERFECT_LOCKED to OUT_OF_TUNE when pitch moves away", () => {
        // Start with locked state
        const lockedContext: TunerStateContext = {
          ...initialContext,
          state: "PERFECT_LOCKED",
          hasSignal: true,
          warmupComplete: true,
          signalStartTime: 1000,
          centeredStableStartTime: 1200,
          cents: 0,
          stability: {
            stdDev: 0,
            isStable: true,
            isModerate: false,
            isUnstable: false,
          },
        };

        const result = tunerReducer(lockedContext, {
          type: "SIGNAL_DETECTED",
          cents: 15, // Far from center
          centsHistory: [15, 15, 15, 15, 15],
          timestamp: 2000,
        });

        expect(result.state).toBe("OUT_OF_TUNE");
        expect(result.centeredStableStartTime).toBeNull();
      });

      it("transitions from PERFECT_LOCKED to IN_TUNE_UNSTABLE when stability is lost", () => {
        const lockedContext: TunerStateContext = {
          ...initialContext,
          state: "PERFECT_LOCKED",
          hasSignal: true,
          warmupComplete: true,
          signalStartTime: 1000,
          centeredStableStartTime: 1200,
          cents: 0,
          stability: {
            stdDev: 0,
            isStable: true,
            isModerate: false,
            isUnstable: false,
          },
        };

        const result = tunerReducer(lockedContext, {
          type: "SIGNAL_DETECTED",
          cents: 0, // Still centered
          centsHistory: [0, 10, -10, 10, -10], // But unstable
          timestamp: 2000,
        });

        expect(result.state).toBe("IN_TUNE_UNSTABLE");
      });
    });
  });

  describe("SIGNAL_LOST action", () => {
    it("resets to initial state", () => {
      const activeContext: TunerStateContext = {
        ...initialContext,
        state: "PERFECT_LOCKED",
        hasSignal: true,
        warmupComplete: true,
        signalStartTime: 1000,
        centeredStableStartTime: 1200,
        cents: 0,
        stability: {
          stdDev: 0,
          isStable: true,
          isModerate: false,
          isUnstable: false,
        },
      };

      const result = tunerReducer(activeContext, { type: "SIGNAL_LOST" });

      expect(result.state).toBe("NO_SIGNAL");
      expect(result.signalStartTime).toBeNull();
      expect(result.centeredStableStartTime).toBeNull();
      expect(result.hasSignal).toBe(false);
    });
  });

  describe("TICK action", () => {
    it("transitions IN_TUNE_STABLE to PERFECT_LOCKED when time passes", () => {
      const stableContext: TunerStateContext = {
        ...initialContext,
        state: "IN_TUNE_STABLE",
        hasSignal: true,
        warmupComplete: true,
        signalStartTime: 1000,
        centeredStableStartTime: 1200,
        cents: 0,
        stability: {
          stdDev: 0,
          isStable: true,
          isModerate: false,
          isUnstable: false,
        },
      };

      const result = tunerReducer(stableContext, {
        type: "TICK",
        timestamp: 1200 + CENTER_LOCK_MS,
      });

      expect(result.state).toBe("PERFECT_LOCKED");
    });

    it("does not change state if not enough time has passed", () => {
      const stableContext: TunerStateContext = {
        ...initialContext,
        state: "IN_TUNE_STABLE",
        hasSignal: true,
        warmupComplete: true,
        signalStartTime: 1000,
        centeredStableStartTime: 1200,
        cents: 0,
        stability: {
          stdDev: 0,
          isStable: true,
          isModerate: false,
          isUnstable: false,
        },
      };

      const result = tunerReducer(stableContext, {
        type: "TICK",
        timestamp: 1200 + CENTER_LOCK_MS - 100, // 100ms before lock
      });

      expect(result.state).toBe("IN_TUNE_STABLE");
    });
  });

  describe("selector helpers", () => {
    describe("isDetectingPhase", () => {
      it("returns true for DETECTING state", () => {
        const context: TunerStateContext = {
          ...initialContext,
          state: "DETECTING",
        };
        expect(isDetectingPhase(context)).toBe(true);
      });

      it("returns false for other states", () => {
        const states = [
          "NO_SIGNAL",
          "OUT_OF_TUNE",
          "IN_TUNE_UNSTABLE",
          "IN_TUNE_STABLE",
          "PERFECT_LOCKED",
        ];
        states.forEach((state) => {
          const context: TunerStateContext = {
            ...initialContext,
            state: state as any,
          };
          expect(isDetectingPhase(context)).toBe(false);
        });
      });
    });

    describe("isLocked", () => {
      it("returns true for PERFECT_LOCKED state", () => {
        const context: TunerStateContext = {
          ...initialContext,
          state: "PERFECT_LOCKED",
        };
        expect(isLocked(context)).toBe(true);
      });

      it("returns false for other states", () => {
        const states = [
          "NO_SIGNAL",
          "DETECTING",
          "OUT_OF_TUNE",
          "IN_TUNE_UNSTABLE",
          "IN_TUNE_STABLE",
        ];
        states.forEach((state) => {
          const context: TunerStateContext = {
            ...initialContext,
            state: state as any,
          };
          expect(isLocked(context)).toBe(false);
        });
      });
    });

    describe("isInTune", () => {
      it("returns true for IN_TUNE_UNSTABLE", () => {
        const context: TunerStateContext = {
          ...initialContext,
          state: "IN_TUNE_UNSTABLE",
        };
        expect(isInTune(context)).toBe(true);
      });

      it("returns true for IN_TUNE_STABLE", () => {
        const context: TunerStateContext = {
          ...initialContext,
          state: "IN_TUNE_STABLE",
        };
        expect(isInTune(context)).toBe(true);
      });

      it("returns true for PERFECT_LOCKED", () => {
        const context: TunerStateContext = {
          ...initialContext,
          state: "PERFECT_LOCKED",
        };
        expect(isInTune(context)).toBe(true);
      });

      it("returns false for out of tune states", () => {
        const states = ["NO_SIGNAL", "DETECTING", "OUT_OF_TUNE"];
        states.forEach((state) => {
          const context: TunerStateContext = {
            ...initialContext,
            state: state as any,
          };
          expect(isInTune(context)).toBe(false);
        });
      });
    });

    describe("getCenteredStableDuration", () => {
      it("returns 0 when centeredStableStartTime is null", () => {
        expect(getCenteredStableDuration(initialContext, 1000)).toBe(0);
      });

      it("returns duration since centeredStableStartTime", () => {
        const context: TunerStateContext = {
          ...initialContext,
          centeredStableStartTime: 1000,
        };
        expect(getCenteredStableDuration(context, 1500)).toBe(500);
        expect(getCenteredStableDuration(context, 2000)).toBe(1000);
      });
    });
  });
});
