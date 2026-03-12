/**
 * Tests for timing constants
 * Verifies timing values used across the app
 */
import {
  ANIMATION,
  DELAY,
  AUDIO,
  SESSION,
  PITCH_DETECTION,
} from "../src/constants/timing";
import timingDefaults from "../src/constants/timing";

describe("timing constants", () => {
  describe("ANIMATION", () => {
    it("has expected duration values", () => {
      expect(ANIMATION.instant).toBe(0);
      expect(ANIMATION.fast).toBe(150);
      expect(ANIMATION.normal).toBe(200);
      expect(ANIMATION.slow).toBe(300);
      expect(ANIMATION.verySlow).toBe(400);
    });

    it("durations are in ascending order", () => {
      expect(ANIMATION.instant).toBeLessThan(ANIMATION.fast);
      expect(ANIMATION.fast).toBeLessThan(ANIMATION.normal);
      expect(ANIMATION.normal).toBeLessThan(ANIMATION.slow);
      expect(ANIMATION.slow).toBeLessThan(ANIMATION.verySlow);
    });

    it("all values are numbers", () => {
      Object.values(ANIMATION).forEach((value) => {
        expect(typeof value).toBe("number");
      });
    });
  });

  describe("DELAY", () => {
    it("has expected delay values", () => {
      expect(DELAY.debounce).toBe(200);
      expect(DELAY.autoAdvance).toBe(1000);
      expect(DELAY.resultDisplay).toBe(1000);
      expect(DELAY.fadeOut).toBe(300);
      expect(DELAY.loadingMin).toBe(200);
    });

    it("all values are positive numbers", () => {
      Object.values(DELAY).forEach((value) => {
        expect(typeof value).toBe("number");
        expect(value).toBeGreaterThan(0);
      });
    });

    it("debounce is reasonable (not too long)", () => {
      expect(DELAY.debounce).toBeLessThanOrEqual(500);
    });

    it("autoAdvance is at least 1 second", () => {
      expect(DELAY.autoAdvance).toBeGreaterThanOrEqual(1000);
    });
  });

  describe("AUDIO", () => {
    it("has expected audio timing values", () => {
      expect(AUDIO.noteDuration).toBe(800);
      expect(AUDIO.noteGap).toBe(300);
      expect(AUDIO.attackTime).toBe(20);
      expect(AUDIO.releaseTime).toBe(300);
      expect(AUDIO.metronomePrecount).toBe(4000);
    });

    it("attack time is shorter than release", () => {
      expect(AUDIO.attackTime).toBeLessThan(AUDIO.releaseTime);
    });

    it("note duration is longer than note gap", () => {
      expect(AUDIO.noteDuration).toBeGreaterThan(AUDIO.noteGap);
    });

    it("metronome precount is sufficient (at least 2 seconds)", () => {
      expect(AUDIO.metronomePrecount).toBeGreaterThanOrEqual(2000);
    });

    it("all values are positive numbers", () => {
      Object.values(AUDIO).forEach((value) => {
        expect(typeof value).toBe("number");
        expect(value).toBeGreaterThan(0);
      });
    });
  });

  describe("SESSION", () => {
    it("has expected session values", () => {
      expect(SESSION.inactivityWarning).toBe(300000); // 5 minutes
      expect(SESSION.sessionTimeout).toBe(600000); // 10 minutes
      expect(SESSION.autoSaveInterval).toBe(30000); // 30 seconds
    });

    it("inactivity warning comes before session timeout", () => {
      expect(SESSION.inactivityWarning).toBeLessThan(SESSION.sessionTimeout);
    });

    it("autoSave interval is reasonable", () => {
      expect(SESSION.autoSaveInterval).toBeGreaterThanOrEqual(10000); // At least 10s
      expect(SESSION.autoSaveInterval).toBeLessThanOrEqual(60000); // At most 1 min
    });

    it("all values are in milliseconds (reasonably large)", () => {
      Object.values(SESSION).forEach((value) => {
        expect(typeof value).toBe("number");
        expect(value).toBeGreaterThanOrEqual(1000);
      });
    });
  });

  describe("PITCH_DETECTION", () => {
    it("has expected pitch detection values", () => {
      expect(PITCH_DETECTION.smoothingWindow).toBe(5);
      expect(PITCH_DETECTION.stabilityThreshold).toBe(500);
      expect(PITCH_DETECTION.sampleInterval).toBe(50);
    });

    it("smoothing window is reasonably small", () => {
      expect(PITCH_DETECTION.smoothingWindow).toBeGreaterThanOrEqual(1);
      expect(PITCH_DETECTION.smoothingWindow).toBeLessThanOrEqual(20);
    });

    it("sample interval allows responsive pitch detection", () => {
      expect(PITCH_DETECTION.sampleInterval).toBeLessThanOrEqual(100);
    });

    it("stability threshold is reasonable", () => {
      expect(PITCH_DETECTION.stabilityThreshold).toBeGreaterThanOrEqual(100);
      expect(PITCH_DETECTION.stabilityThreshold).toBeLessThanOrEqual(2000);
    });
  });

  describe("default export", () => {
    it("contains all timing groups", () => {
      expect(timingDefaults.ANIMATION).toBe(ANIMATION);
      expect(timingDefaults.DELAY).toBe(DELAY);
      expect(timingDefaults.AUDIO).toBe(AUDIO);
      expect(timingDefaults.SESSION).toBe(SESSION);
      expect(timingDefaults.PITCH_DETECTION).toBe(PITCH_DETECTION);
    });
  });
});
