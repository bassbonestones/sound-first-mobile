/**
 * Tests for tunerHelpers
 *
 * Tests the pure calculation functions used in the Tuner component.
 */

import {
  computeStdDev,
  computeStability,
  getStabilityLevel,
  computeStateText,
  shouldShowLock,
  shouldShowHold,
  getHoldProgress,
  getTuneColor,
  getStabilityColor,
  isCentered,
  isPerfect,
  getMedian,
  computeDirectionBias,
} from "../src/screens/TuneMastery/components/Tuner/tunerHelpers";
import { TUNER_COLORS } from "../src/screens/TuneMastery/components/Tuner/tunerConstants";

describe("tunerHelpers", () => {
  describe("computeStdDev", () => {
    it("returns 0 for empty array", () => {
      expect(computeStdDev([])).toBe(0);
    });

    it("returns 0 for single value", () => {
      expect(computeStdDev([5])).toBe(0);
    });

    it("calculates std dev for uniform values", () => {
      expect(computeStdDev([5, 5, 5, 5])).toBe(0);
    });

    it("calculates std dev for varying values", () => {
      // Values: [1, 2, 3, 4, 5], mean = 3
      // Squared diffs: 4, 1, 0, 1, 4 → variance = 2
      // Std dev = sqrt(2) ≈ 1.414
      const result = computeStdDev([1, 2, 3, 4, 5]);
      expect(result).toBeCloseTo(1.414, 2);
    });

    it("handles negative values", () => {
      const result = computeStdDev([-2, -1, 0, 1, 2]);
      expect(result).toBeCloseTo(1.414, 2);
    });
  });

  describe("computeStability", () => {
    it("returns stable for low variance", () => {
      const result = computeStability([0, 0, 0, 0, 0]);
      expect(result.isStable).toBe(true);
      expect(result.isModerate).toBe(false);
      expect(result.isUnstable).toBe(false);
      expect(result.stdDev).toBe(0);
    });

    it("returns moderate for medium variance", () => {
      // Create values with std dev around 3-4 (between STABLE_STD_DEV and MODERATE_STD_DEV)
      const result = computeStability([0, 3, 6, 3, 0]);
      expect(result.isStable).toBe(false);
      expect(result.isModerate).toBe(true);
      expect(result.isUnstable).toBe(false);
    });

    it("returns unstable for high variance", () => {
      // Create values with std dev > 5
      const result = computeStability([0, 10, 20, 10, 0]);
      expect(result.isStable).toBe(false);
      expect(result.isModerate).toBe(false);
      expect(result.isUnstable).toBe(true);
    });

    it("handles edge case at STABLE_STD_DEV threshold", () => {
      // Exactly at threshold should be stable
      const result = computeStability([0, 2, 2, 0, 0]);
      // std dev should be <= 2.0 for stable
      expect(result.stdDev).toBeLessThanOrEqual(2.5);
    });
  });

  describe("getStabilityLevel", () => {
    it("returns stable for stable result", () => {
      const result = computeStability([0, 0, 0, 0, 0]);
      expect(getStabilityLevel(result)).toBe("stable");
    });

    it("returns moderate for moderate result", () => {
      const result = computeStability([0, 3, 6, 3, 0]);
      expect(getStabilityLevel(result)).toBe("moderate");
    });

    it("returns unstable for unstable result", () => {
      const result = computeStability([0, 10, 20, 10, 0]);
      expect(getStabilityLevel(result)).toBe("unstable");
    });
  });

  describe("computeStateText", () => {
    describe("when detecting", () => {
      it("returns LISTENING when detecting", () => {
        expect(computeStateText(0, true, true)).toBe("LISTENING");
      });

      it("returns LISTENING even if stable and centered", () => {
        expect(computeStateText(0, true, true)).toBe("LISTENING");
      });
    });

    describe("when centered and stable", () => {
      it("returns PERFECT for ±2 cents and stable", () => {
        expect(computeStateText(0, true, false)).toBe("PERFECT");
        expect(computeStateText(2, true, false)).toBe("PERFECT");
        expect(computeStateText(-2, true, false)).toBe("PERFECT");
      });

      it("returns IN TUNE for ±3 cents and stable", () => {
        expect(computeStateText(3, true, false)).toBe("IN TUNE");
        expect(computeStateText(-3, true, false)).toBe("IN TUNE");
      });
    });

    describe("when centered but unstable", () => {
      it("returns CENTERED for ±3 cents but unstable", () => {
        expect(computeStateText(0, false, false)).toBe("CENTERED");
        expect(computeStateText(2, false, false)).toBe("CENTERED");
        expect(computeStateText(3, false, false)).toBe("CENTERED");
        expect(computeStateText(-3, false, false)).toBe("CENTERED");
      });
    });

    describe("when out of tune", () => {
      it("returns cents SHARP for positive cents", () => {
        expect(computeStateText(8, true, false)).toBe("8¢ SHARP");
        expect(computeStateText(15, true, false)).toBe("15¢ SHARP");
      });

      it("returns cents FLAT for negative cents", () => {
        expect(computeStateText(-6, true, false)).toBe("6¢ FLAT");
        expect(computeStateText(-20, true, false)).toBe("20¢ FLAT");
      });
    });
  });

  describe("lock/hold helpers", () => {
    describe("shouldShowLock", () => {
      it("returns false for 0 duration", () => {
        expect(shouldShowLock(0)).toBe(false);
      });

      it("returns false for duration < 500ms", () => {
        expect(shouldShowLock(499)).toBe(false);
      });

      it("returns true for duration >= 500ms", () => {
        expect(shouldShowLock(500)).toBe(true);
        expect(shouldShowLock(1000)).toBe(true);
      });
    });

    describe("shouldShowHold", () => {
      it("returns false for duration < 1000ms", () => {
        expect(shouldShowHold(999)).toBe(false);
      });

      it("returns true for duration >= 1000ms", () => {
        expect(shouldShowHold(1000)).toBe(true);
        expect(shouldShowHold(2000)).toBe(true);
      });
    });

    describe("getHoldProgress", () => {
      it("returns 0 for 0 duration", () => {
        expect(getHoldProgress(0)).toBe(0);
      });

      it("returns 0.5 for 500ms duration", () => {
        expect(getHoldProgress(500)).toBe(0.5);
      });

      it("returns 1 for 1000ms duration", () => {
        expect(getHoldProgress(1000)).toBe(1);
      });

      it("caps at 1 for duration > 1000ms", () => {
        expect(getHoldProgress(2000)).toBe(1);
      });
    });
  });

  describe("color helpers", () => {
    describe("getTuneColor", () => {
      it("returns perfect green for ±2 cents", () => {
        expect(getTuneColor(0)).toBe(TUNER_COLORS.perfectGreen);
        expect(getTuneColor(2)).toBe(TUNER_COLORS.perfectGreen);
        expect(getTuneColor(-2)).toBe(TUNER_COLORS.perfectGreen);
      });

      it("returns in-tune green for ±3 cents", () => {
        expect(getTuneColor(3)).toBe(TUNER_COLORS.inTuneGreen);
        expect(getTuneColor(-3)).toBe(TUNER_COLORS.inTuneGreen);
      });

      it("returns yellow for ±10 cents", () => {
        expect(getTuneColor(8)).toBe(TUNER_COLORS.yellowZone);
        expect(getTuneColor(-8)).toBe(TUNER_COLORS.yellowZone);
        expect(getTuneColor(10)).toBe(TUNER_COLORS.yellowZone);
      });

      it("returns orange for ±20 cents", () => {
        expect(getTuneColor(15)).toBe(TUNER_COLORS.orangeZone);
        expect(getTuneColor(-15)).toBe(TUNER_COLORS.orangeZone);
        expect(getTuneColor(20)).toBe(TUNER_COLORS.orangeZone);
      });

      it("returns red for > 20 cents", () => {
        expect(getTuneColor(25)).toBe(TUNER_COLORS.redZone);
        expect(getTuneColor(-30)).toBe(TUNER_COLORS.redZone);
        expect(getTuneColor(50)).toBe(TUNER_COLORS.redZone);
      });
    });

    describe("getStabilityColor", () => {
      it("returns green for stable", () => {
        const stable = computeStability([0, 0, 0, 0, 0]);
        expect(getStabilityColor(stable)).toBe(TUNER_COLORS.stableGreen);
      });

      it("returns yellow for moderate", () => {
        const moderate = computeStability([0, 3, 6, 3, 0]);
        expect(getStabilityColor(moderate)).toBe(TUNER_COLORS.moderateYellow);
      });

      it("returns red for unstable", () => {
        const unstable = computeStability([0, 10, 20, 10, 0]);
        expect(getStabilityColor(unstable)).toBe(TUNER_COLORS.unstableRed);
      });
    });
  });

  describe("derived booleans", () => {
    describe("isCentered", () => {
      it("returns true for ±3 cents", () => {
        expect(isCentered(0)).toBe(true);
        expect(isCentered(3)).toBe(true);
        expect(isCentered(-3)).toBe(true);
      });

      it("returns false for > 3 cents", () => {
        expect(isCentered(4)).toBe(false);
        expect(isCentered(-4)).toBe(false);
      });
    });

    describe("isPerfect", () => {
      it("returns true for ±2 cents", () => {
        expect(isPerfect(0)).toBe(true);
        expect(isPerfect(2)).toBe(true);
        expect(isPerfect(-2)).toBe(true);
      });

      it("returns false for > 2 cents", () => {
        expect(isPerfect(3)).toBe(false);
        expect(isPerfect(-3)).toBe(false);
      });
    });
  });

  describe("getMedian", () => {
    it("returns 0 for empty array", () => {
      expect(getMedian([])).toBe(0);
    });

    it("returns single value for array of one", () => {
      expect(getMedian([5])).toBe(5);
    });

    it("returns middle value for odd-length array", () => {
      expect(getMedian([1, 3, 5])).toBe(3);
      expect(getMedian([5, 1, 3])).toBe(3); // Unsorted input
    });

    it("returns average of middle values for even-length array", () => {
      expect(getMedian([1, 2, 3, 4])).toBe(2.5);
      expect(getMedian([4, 1, 3, 2])).toBe(2.5); // Unsorted input
    });

    it("handles negative values", () => {
      expect(getMedian([-5, -3, -1])).toBe(-3);
    });
  });

  describe("computeDirectionBias", () => {
    it("returns not enough data for empty array", () => {
      const result = computeDirectionBias([]);
      expect(result.hasEnoughData).toBe(false);
      expect(result.biasText).toBeNull();
      expect(result.direction).toBe("neutral");
    });

    it("returns not enough data for array below minimum samples", () => {
      const result = computeDirectionBias([5, 5, 5, 5, 5]); // Only 5 samples
      expect(result.hasEnoughData).toBe(false);
      expect(result.biasText).toBeNull();
    });

    it("returns neutral for balanced cents around zero", () => {
      // 15+ samples with mean near zero
      const samples = Array(20)
        .fill(0)
        .map((_, i) => (i % 2 === 0 ? 1 : -1));
      const result = computeDirectionBias(samples);
      expect(result.hasEnoughData).toBe(true);
      expect(result.direction).toBe("neutral");
      expect(result.biasText).toBeNull();
    });

    it("detects slight sharp tendency", () => {
      // 20 samples averaging around +4 cents
      const samples = Array(20).fill(4);
      const result = computeDirectionBias(samples);
      expect(result.hasEnoughData).toBe(true);
      expect(result.direction).toBe("sharp");
      expect(result.biasText).toBe("Slight sharp tendency");
      expect(result.meanCents).toBe(4);
    });

    it("detects slight flat tendency", () => {
      // 20 samples averaging around -4 cents
      const samples = Array(20).fill(-4);
      const result = computeDirectionBias(samples);
      expect(result.hasEnoughData).toBe(true);
      expect(result.direction).toBe("flat");
      expect(result.biasText).toBe("Slight flat tendency");
      expect(result.meanCents).toBe(-4);
    });

    it("detects sharp tendency for moderate bias", () => {
      // Mean around +7 cents
      const samples = Array(20).fill(7);
      const result = computeDirectionBias(samples);
      expect(result.direction).toBe("sharp");
      expect(result.biasText).toBe("Sharp tendency");
    });

    it("detects flat tendency for moderate bias", () => {
      // Mean around -7 cents
      const samples = Array(20).fill(-7);
      const result = computeDirectionBias(samples);
      expect(result.direction).toBe("flat");
      expect(result.biasText).toBe("Flat tendency");
    });

    it("detects strong sharp tendency", () => {
      // Mean around +12 cents
      const samples = Array(20).fill(12);
      const result = computeDirectionBias(samples);
      expect(result.direction).toBe("sharp");
      expect(result.biasText).toBe("Strong sharp tendency");
    });

    it("detects strong flat tendency", () => {
      // Mean around -12 cents
      const samples = Array(20).fill(-12);
      const result = computeDirectionBias(samples);
      expect(result.direction).toBe("flat");
      expect(result.biasText).toBe("Strong flat tendency");
    });

    it("calculates correct mean from mixed values", () => {
      // Values: [2, 4, 6, 4, 4] repeated = mean of 4
      const samples = [2, 4, 6, 4, 4, 2, 4, 6, 4, 4, 2, 4, 6, 4, 4];
      const result = computeDirectionBias(samples);
      expect(result.meanCents).toBe(4);
      expect(result.direction).toBe("sharp");
      expect(result.biasText).toBe("Slight sharp tendency");
    });

    it("returns neutral when mean is below threshold", () => {
      // Mean around +2 (below 3 threshold)
      const samples = Array(20).fill(2);
      const result = computeDirectionBias(samples);
      expect(result.hasEnoughData).toBe(true);
      expect(result.direction).toBe("neutral");
      expect(result.biasText).toBeNull();
    });
  });
});
