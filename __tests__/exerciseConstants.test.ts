/**
 * Tests for exerciseConstants
 * Tests exercise phase definitions and configuration constants
 */
import {
  LESSON_PHASES,
  ACCIDENTAL_PHASES,
  RHYTHM_PHASES,
  PITCH_DETECTION_OPTIONS,
  SUSTAINED_PITCH_DETECTION_OPTIONS,
  TIMING_TOLERANCES,
} from "../src/screens/Session/components/exercises/shared/exerciseConstants";

describe("exerciseConstants", () => {
  describe("LESSON_PHASES", () => {
    it("has FOCUS_CARD phase", () => {
      expect(LESSON_PHASES.FOCUS_CARD).toBe("focus_card");
    });

    it("has LISTEN phase", () => {
      expect(LESSON_PHASES.LISTEN).toBe("listen");
    });

    it("has SING phase", () => {
      expect(LESSON_PHASES.SING).toBe("sing");
    });

    it("has IMAGINE phase", () => {
      expect(LESSON_PHASES.IMAGINE).toBe("imagine");
    });

    it("has PLAY phase", () => {
      expect(LESSON_PHASES.PLAY).toBe("play");
    });

    it("has FEEDBACK phase", () => {
      expect(LESSON_PHASES.FEEDBACK).toBe("feedback");
    });

    it("has 6 phases", () => {
      expect(Object.keys(LESSON_PHASES).length).toBe(6);
    });
  });

  describe("ACCIDENTAL_PHASES", () => {
    it("has INTRO phase", () => {
      expect(ACCIDENTAL_PHASES.INTRO).toBe("intro");
    });

    it("has COMPARE phase", () => {
      expect(ACCIDENTAL_PHASES.COMPARE).toBe("compare");
    });

    it("has KEYBOARD phase", () => {
      expect(ACCIDENTAL_PHASES.KEYBOARD).toBe("keyboard");
    });

    it("has EXAMPLES phase", () => {
      expect(ACCIDENTAL_PHASES.EXAMPLES).toBe("examples");
    });

    it("has HEAR_IT phase", () => {
      expect(ACCIDENTAL_PHASES.HEAR_IT).toBe("hear_it");
    });

    it("has QUIZ phase", () => {
      expect(ACCIDENTAL_PHASES.QUIZ).toBe("quiz");
    });

    it("has RESULT phase", () => {
      expect(ACCIDENTAL_PHASES.RESULT).toBe("result");
    });

    it("has 7 phases", () => {
      expect(Object.keys(ACCIDENTAL_PHASES).length).toBe(7);
    });
  });

  describe("RHYTHM_PHASES", () => {
    it("has INTRO phase", () => {
      expect(RHYTHM_PHASES.INTRO).toBe("intro");
    });

    it("has LISTENING phase", () => {
      expect(RHYTHM_PHASES.LISTENING).toBe("listening");
    });

    it("has SILENT phase", () => {
      expect(RHYTHM_PHASES.SILENT).toBe("silent");
    });

    it("has TAP phase", () => {
      expect(RHYTHM_PHASES.TAP).toBe("tap");
    });

    it("has REVEAL phase", () => {
      expect(RHYTHM_PHASES.REVEAL).toBe("reveal");
    });

    it("has RESULT phase", () => {
      expect(RHYTHM_PHASES.RESULT).toBe("result");
    });

    it("has 6 phases", () => {
      expect(Object.keys(RHYTHM_PHASES).length).toBe(6);
    });
  });

  describe("PITCH_DETECTION_OPTIONS", () => {
    it("has volumeThreshold", () => {
      expect(PITCH_DETECTION_OPTIONS.volumeThreshold).toBeDefined();
      expect(typeof PITCH_DETECTION_OPTIONS.volumeThreshold).toBe("number");
    });

    it("has silenceDuration", () => {
      expect(PITCH_DETECTION_OPTIONS.silenceDuration).toBe(150);
    });

    it("has soundingFrequencyRange", () => {
      expect(PITCH_DETECTION_OPTIONS.soundingFrequencyRange).toBeDefined();
      expect(PITCH_DETECTION_OPTIONS.soundingFrequencyRange.min).toBe(60);
      expect(PITCH_DETECTION_OPTIONS.soundingFrequencyRange.max).toBe(1200);
    });
  });

  describe("SUSTAINED_PITCH_DETECTION_OPTIONS", () => {
    it("has longer silenceDuration", () => {
      expect(SUSTAINED_PITCH_DETECTION_OPTIONS.silenceDuration).toBe(300);
    });

    it("has same volumeThreshold as default", () => {
      expect(SUSTAINED_PITCH_DETECTION_OPTIONS.volumeThreshold).toBe(
        PITCH_DETECTION_OPTIONS.volumeThreshold,
      );
    });

    it("has same frequency range as default", () => {
      expect(SUSTAINED_PITCH_DETECTION_OPTIONS.soundingFrequencyRange.min).toBe(
        PITCH_DETECTION_OPTIONS.soundingFrequencyRange.min,
      );
      expect(SUSTAINED_PITCH_DETECTION_OPTIONS.soundingFrequencyRange.max).toBe(
        PITCH_DETECTION_OPTIONS.soundingFrequencyRange.max,
      );
    });
  });

  describe("TIMING_TOLERANCES", () => {
    it("has PERFECT tolerance", () => {
      expect(TIMING_TOLERANCES.PERFECT).toBe(50);
    });

    it("has GOOD tolerance", () => {
      expect(TIMING_TOLERANCES.GOOD).toBe(100);
    });

    it("has ACCEPTABLE tolerance", () => {
      expect(TIMING_TOLERANCES.ACCEPTABLE).toBe(150);
    });

    it("has LENIENT tolerance", () => {
      expect(TIMING_TOLERANCES.LENIENT).toBe(200);
    });

    it("tolerances are in ascending order", () => {
      expect(TIMING_TOLERANCES.PERFECT).toBeLessThan(TIMING_TOLERANCES.GOOD);
      expect(TIMING_TOLERANCES.GOOD).toBeLessThan(TIMING_TOLERANCES.ACCEPTABLE);
      expect(TIMING_TOLERANCES.ACCEPTABLE).toBeLessThan(
        TIMING_TOLERANCES.LENIENT,
      );
    });
  });
});
