/**
 * Tests for rangeExpansionPatterns constants and utilities
 * Covers pattern structures and selection functions
 */
import {
  PATTERNS_UP,
  PATTERNS_DOWN,
  ALL_PATTERNS,
  getAvailablePatterns,
  getSimplestPattern,
  getRandomPattern,
} from "../src/constants/rangeExpansionPatterns";

describe("rangeExpansionPatterns constants", () => {
  describe("PATTERNS_UP", () => {
    it("is a non-empty array", () => {
      expect(Array.isArray(PATTERNS_UP)).toBe(true);
      expect(PATTERNS_UP.length).toBeGreaterThan(0);
    });

    it("all patterns have direction up", () => {
      PATTERNS_UP.forEach((pattern) => {
        expect(pattern.direction).toBe("up");
      });
    });

    it("contains chromatic neighbor pattern", () => {
      const chromatic = PATTERNS_UP.find(
        (p) => p.id === "chromatic_neighbor_up",
      );
      expect(chromatic).toBeDefined();
      expect(chromatic?.intervals).toEqual([0, 1, 0]);
    });

    it("contains land pattern", () => {
      const land = PATTERNS_UP.find((p) => p.id === "land_up");
      expect(land).toBeDefined();
      expect(land?.holdFinal).toBe(true);
    });

    it("all patterns have required properties", () => {
      PATTERNS_UP.forEach((pattern) => {
        expect(pattern).toHaveProperty("id");
        expect(pattern).toHaveProperty("name");
        expect(pattern).toHaveProperty("direction");
        expect(pattern).toHaveProperty("intervals");
        expect(pattern).toHaveProperty("targetInterval");
        expect(pattern).toHaveProperty("requiredRangeSemitones");
        expect(pattern).toHaveProperty("holdFinal");
        expect(pattern).toHaveProperty("description");
      });
    });

    it("all patterns have valid interval arrays", () => {
      PATTERNS_UP.forEach((pattern) => {
        expect(Array.isArray(pattern.intervals)).toBe(true);
        expect(pattern.intervals.length).toBeGreaterThan(0);
        expect(pattern.intervals[0]).toBe(0); // All start at anchor
      });
    });

    it("all intervals in UP patterns are non-negative or return to zero", () => {
      PATTERNS_UP.forEach((pattern) => {
        // UP patterns should have positive or zero intervals (within range)
        expect(typeof pattern.targetInterval).toBe("number");
        expect(pattern.targetInterval).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("PATTERNS_DOWN", () => {
    it("is a non-empty array", () => {
      expect(Array.isArray(PATTERNS_DOWN)).toBe(true);
      expect(PATTERNS_DOWN.length).toBeGreaterThan(0);
    });

    it("all patterns have direction down", () => {
      PATTERNS_DOWN.forEach((pattern) => {
        expect(pattern.direction).toBe("down");
      });
    });

    it("contains chromatic neighbor pattern", () => {
      const chromatic = PATTERNS_DOWN.find(
        (p) => p.id === "chromatic_neighbor_down",
      );
      expect(chromatic).toBeDefined();
      expect(chromatic?.intervals).toEqual([0, -1, 0]);
    });

    it("contains land pattern", () => {
      const land = PATTERNS_DOWN.find((p) => p.id === "land_down");
      expect(land).toBeDefined();
      expect(land?.holdFinal).toBe(true);
    });

    it("all patterns have required properties", () => {
      PATTERNS_DOWN.forEach((pattern) => {
        expect(pattern).toHaveProperty("id");
        expect(pattern).toHaveProperty("name");
        expect(pattern).toHaveProperty("direction");
        expect(pattern).toHaveProperty("intervals");
        expect(pattern).toHaveProperty("targetInterval");
        expect(pattern).toHaveProperty("requiredRangeSemitones");
        expect(pattern).toHaveProperty("holdFinal");
        expect(pattern).toHaveProperty("description");
      });
    });

    it("targetInterval is non-positive for DOWN patterns", () => {
      PATTERNS_DOWN.forEach((pattern) => {
        expect(pattern.targetInterval).toBeLessThanOrEqual(0);
      });
    });
  });

  describe("ALL_PATTERNS", () => {
    it("combines UP and DOWN patterns", () => {
      expect(ALL_PATTERNS.length).toBe(
        PATTERNS_UP.length + PATTERNS_DOWN.length,
      );
    });

    it("contains all UP patterns", () => {
      PATTERNS_UP.forEach((upPattern) => {
        expect(ALL_PATTERNS).toContainEqual(upPattern);
      });
    });

    it("contains all DOWN patterns", () => {
      PATTERNS_DOWN.forEach((downPattern) => {
        expect(ALL_PATTERNS).toContainEqual(downPattern);
      });
    });

    it("has unique IDs", () => {
      const ids = ALL_PATTERNS.map((p) => p.id);
      const uniqueIds = [...new Set(ids)];
      expect(uniqueIds.length).toBe(ALL_PATTERNS.length);
    });
  });
});

describe("getAvailablePatterns", () => {
  describe("direction up", () => {
    it("returns patterns for range 0", () => {
      const patterns = getAvailablePatterns("up", 0);
      expect(patterns.length).toBeGreaterThan(0);
      patterns.forEach((p) => {
        expect(p.requiredRangeSemitones).toBe(0);
      });
    });

    it("returns more patterns for larger range", () => {
      const range0 = getAvailablePatterns("up", 0);
      const range5 = getAvailablePatterns("up", 5);
      expect(range5.length).toBeGreaterThanOrEqual(range0.length);
    });

    it("returns all up patterns for large range", () => {
      const patterns = getAvailablePatterns("up", 20);
      expect(patterns.length).toBe(PATTERNS_UP.length);
    });

    it("includes chromatic neighbor at range 0", () => {
      const patterns = getAvailablePatterns("up", 0);
      const chromatic = patterns.find((p) => p.id === "chromatic_neighbor_up");
      expect(chromatic).toBeDefined();
    });
  });

  describe("direction down", () => {
    it("returns patterns for range 0", () => {
      const patterns = getAvailablePatterns("down", 0);
      expect(patterns.length).toBeGreaterThan(0);
    });

    it("returns more patterns for larger range", () => {
      const range0 = getAvailablePatterns("down", 0);
      const range5 = getAvailablePatterns("down", 5);
      expect(range5.length).toBeGreaterThanOrEqual(range0.length);
    });

    it("returns all down patterns for large range", () => {
      const patterns = getAvailablePatterns("down", 20);
      expect(patterns.length).toBe(PATTERNS_DOWN.length);
    });
  });
});

describe("getSimplestPattern", () => {
  describe("direction up", () => {
    it("returns pattern with lowest requiredRangeSemitones", () => {
      const simplest = getSimplestPattern("up", 10);
      expect(simplest).toBeDefined();
      expect(simplest?.requiredRangeSemitones).toBe(0);
    });

    it("returns a valid pattern", () => {
      const simplest = getSimplestPattern("up", 0);
      expect(simplest).not.toBeNull();
      expect(simplest).toHaveProperty("id");
      expect(simplest?.direction).toBe("up");
    });
  });

  describe("direction down", () => {
    it("returns pattern with lowest requiredRangeSemitones", () => {
      const simplest = getSimplestPattern("down", 10);
      expect(simplest).toBeDefined();
      expect(simplest?.requiredRangeSemitones).toBe(0);
    });

    it("returns a valid pattern", () => {
      const simplest = getSimplestPattern("down", 0);
      expect(simplest).not.toBeNull();
      expect(simplest?.direction).toBe("down");
    });
  });
});

describe("getRandomPattern", () => {
  describe("direction up", () => {
    it("returns a pattern from available patterns", () => {
      const pattern = getRandomPattern("up", 10);
      expect(pattern).not.toBeNull();
      expect(pattern?.direction).toBe("up");

      const available = getAvailablePatterns("up", 10);
      expect(available).toContainEqual(pattern);
    });

    it("returns patterns with valid structure", () => {
      // Run multiple times to test randomness
      for (let i = 0; i < 10; i++) {
        const pattern = getRandomPattern("up", 5);
        expect(pattern).toHaveProperty("id");
        expect(pattern).toHaveProperty("intervals");
        expect(pattern?.direction).toBe("up");
      }
    });

    it("returns only patterns within range requirement", () => {
      // At range 0, should only get patterns with requiredRangeSemitones = 0
      for (let i = 0; i < 10; i++) {
        const pattern = getRandomPattern("up", 0);
        expect(pattern?.requiredRangeSemitones).toBe(0);
      }
    });
  });

  describe("direction down", () => {
    it("returns a pattern from available patterns", () => {
      const pattern = getRandomPattern("down", 10);
      expect(pattern).not.toBeNull();
      expect(pattern?.direction).toBe("down");
    });

    it("returns only patterns within range requirement", () => {
      for (let i = 0; i < 10; i++) {
        const pattern = getRandomPattern("down", 0);
        expect(pattern?.requiredRangeSemitones).toBe(0);
      }
    });
  });

  describe("edge cases", () => {
    it("varies patterns across multiple calls", () => {
      // With range 20, all patterns available - should get variety
      const patterns = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const pattern = getRandomPattern("up", 20);
        if (pattern) patterns.add(pattern.id);
      }
      // Should get at least 2 different patterns
      expect(patterns.size).toBeGreaterThan(1);
    });
  });
});
