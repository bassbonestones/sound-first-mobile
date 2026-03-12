/**
 * Tests for constants index barrel exports
 * Verifies all public exports are accessible
 */
import {
  // Colors
  colors,
  spacing,
  fontSizes,
  borderRadius,
  colorsDefault,
  // Notes
  noteNames,
  enharmonicNames,
  A4_FREQUENCY,
  frequencyToNote,
  noteToFrequency,
  getCentsDeviation,
  isInTune,
  parseNoteName,
  formatNoteName,
  notesDefault,
  // Instruments
  instrumentFamilies,
  instrumentDefaults,
  getAllInstruments,
  getInstrument,
  getInstrumentFamily,
  instrumentsDefault,
  // Timing
  ANIMATION,
  DELAY,
  AUDIO,
  SESSION,
  PITCH_DETECTION,
  timingDefault,
  // API
  API_CONFIG,
  ENDPOINTS,
  HTTP_STATUS,
  CONTENT_TYPE,
  apiDefault,
  // Navigation
  DEV_NAV_ITEMS,
} from "../src/constants";

// Range patterns exported differently
import {
  PATTERNS_UP,
  PATTERNS_DOWN,
} from "../src/constants/rangeExpansionPatterns";

describe("constants index exports", () => {
  describe("color exports", () => {
    it("exports colors object", () => {
      expect(colors).toBeDefined();
      expect(colors.primary).toBeDefined();
    });

    it("exports spacing object", () => {
      expect(spacing).toBeDefined();
      expect(typeof spacing.sm).toBe("number");
    });

    it("exports fontSizes object", () => {
      expect(fontSizes).toBeDefined();
      expect(typeof fontSizes.base).toBe("number");
    });

    it("exports borderRadius object", () => {
      expect(borderRadius).toBeDefined();
    });

    it("exports colorsDefault", () => {
      expect(colorsDefault).toBe(colors);
    });
  });

  describe("notes exports", () => {
    it("exports noteNames array", () => {
      expect(Array.isArray(noteNames)).toBe(true);
      expect(noteNames).toContain("C");
    });

    it("exports enharmonicNames object", () => {
      expect(enharmonicNames).toBeDefined();
    });

    it("exports A4_FREQUENCY constant", () => {
      expect(A4_FREQUENCY).toBe(440);
    });

    it("exports frequency conversion functions", () => {
      expect(typeof frequencyToNote).toBe("function");
      expect(typeof noteToFrequency).toBe("function");
    });

    it("exports pitch utility functions", () => {
      expect(typeof getCentsDeviation).toBe("function");
      expect(typeof isInTune).toBe("function");
    });

    it("exports note parsing functions", () => {
      expect(typeof parseNoteName).toBe("function");
      expect(typeof formatNoteName).toBe("function");
    });

    it("exports notesDefault", () => {
      expect(notesDefault).toBeDefined();
    });
  });

  describe("instrument exports", () => {
    it("exports instrumentFamilies", () => {
      expect(instrumentFamilies).toBeDefined();
    });

    it("exports instrumentDefaults", () => {
      expect(instrumentDefaults).toBeDefined();
    });

    it("exports instrument getter functions", () => {
      expect(typeof getAllInstruments).toBe("function");
      expect(typeof getInstrument).toBe("function");
      expect(typeof getInstrumentFamily).toBe("function");
    });

    it("exports instrumentsDefault", () => {
      expect(instrumentsDefault).toBeDefined();
    });
  });

  describe("timing exports", () => {
    it("exports ANIMATION timings", () => {
      expect(ANIMATION).toBeDefined();
      expect(ANIMATION.fast).toBeDefined();
    });

    it("exports DELAY timings", () => {
      expect(DELAY).toBeDefined();
      expect(DELAY.debounce).toBeDefined();
    });

    it("exports AUDIO timings", () => {
      expect(AUDIO).toBeDefined();
      expect(AUDIO.noteDuration).toBeDefined();
    });

    it("exports SESSION timings", () => {
      expect(SESSION).toBeDefined();
    });

    it("exports PITCH_DETECTION settings", () => {
      expect(PITCH_DETECTION).toBeDefined();
    });

    it("exports timingDefault", () => {
      expect(timingDefault).toBeDefined();
      expect(timingDefault.ANIMATION).toBe(ANIMATION);
    });
  });

  describe("API exports", () => {
    it("exports API_CONFIG", () => {
      expect(API_CONFIG).toBeDefined();
      expect(API_CONFIG.timeout).toBeDefined();
    });

    it("exports ENDPOINTS", () => {
      expect(ENDPOINTS).toBeDefined();
      expect(ENDPOINTS.login).toBeDefined();
    });

    it("exports HTTP_STATUS codes", () => {
      expect(HTTP_STATUS).toBeDefined();
      expect(HTTP_STATUS.OK).toBe(200);
    });

    it("exports CONTENT_TYPE headers", () => {
      expect(CONTENT_TYPE).toBeDefined();
      expect(CONTENT_TYPE.JSON).toBe("application/json");
    });

    it("exports apiDefault", () => {
      expect(apiDefault).toBeDefined();
    });
  });

  describe("navigation exports", () => {
    it("exports DEV_NAV_ITEMS", () => {
      expect(Array.isArray(DEV_NAV_ITEMS)).toBe(true);
      expect(DEV_NAV_ITEMS.length).toBeGreaterThan(0);
    });
  });

  describe("range pattern exports", () => {
    it("exports PATTERNS_UP from rangeExpansionPatterns", () => {
      expect(Array.isArray(PATTERNS_UP)).toBe(true);
      expect(PATTERNS_UP.length).toBeGreaterThan(0);
    });

    it("exports PATTERNS_DOWN from rangeExpansionPatterns", () => {
      expect(Array.isArray(PATTERNS_DOWN)).toBe(true);
      expect(PATTERNS_DOWN.length).toBeGreaterThan(0);
    });
  });
});
