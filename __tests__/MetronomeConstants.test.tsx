/**
 * Tests for Metronome constants and utilities
 * Covers subdivision patterns and label generation
 */
import {
  NOTE_VALUES,
  NOTE_VALUE_NAMES,
  SUBDIVISIONS,
  getSubdivisionLabel,
} from "../src/components/Metronome/constants";

describe("Metronome constants", () => {
  describe("NOTE_VALUES", () => {
    it("contains standard note values", () => {
      expect(NOTE_VALUES).toContain(1);
      expect(NOTE_VALUES).toContain(2);
      expect(NOTE_VALUES).toContain(4);
      expect(NOTE_VALUES).toContain(8);
      expect(NOTE_VALUES).toContain(16);
      expect(NOTE_VALUES).toContain(32);
    });

    it("has 6 note values", () => {
      expect(NOTE_VALUES).toHaveLength(6);
    });

    it("has values in ascending order", () => {
      for (let i = 1; i < NOTE_VALUES.length; i++) {
        expect(NOTE_VALUES[i]).toBeGreaterThan(NOTE_VALUES[i - 1]);
      }
    });
  });

  describe("NOTE_VALUE_NAMES", () => {
    it("has name for whole note", () => {
      expect(NOTE_VALUE_NAMES[1]).toBe("whole");
    });

    it("has name for half note", () => {
      expect(NOTE_VALUE_NAMES[2]).toBe("half");
    });

    it("has name for quarter note", () => {
      expect(NOTE_VALUE_NAMES[4]).toBe("quarter");
    });

    it("has name for eighth note", () => {
      expect(NOTE_VALUE_NAMES[8]).toBe("eighth");
    });

    it("has name for sixteenth note", () => {
      expect(NOTE_VALUE_NAMES[16]).toBe("sixteenth");
    });

    it("has name for thirty-second note", () => {
      expect(NOTE_VALUE_NAMES[32]).toBe("thirty-second");
    });

    it("has names for all note values", () => {
      NOTE_VALUES.forEach((value) => {
        expect(NOTE_VALUE_NAMES[value]).toBeDefined();
        expect(typeof NOTE_VALUE_NAMES[value]).toBe("string");
      });
    });
  });

  describe("SUBDIVISIONS", () => {
    it("has none subdivision", () => {
      expect(SUBDIVISIONS.none).toBeDefined();
      expect(SUBDIVISIONS.none.key).toBe("none");
      expect(SUBDIVISIONS.none.pattern).toEqual([0]);
    });

    it("has halves subdivision with 2 clicks", () => {
      expect(SUBDIVISIONS.halves).toBeDefined();
      expect(SUBDIVISIONS.halves.pattern).toEqual([0, 0.5]);
      expect(SUBDIVISIONS.halves.accent).toHaveLength(2);
    });

    it("has triplet subdivision with 3 clicks", () => {
      expect(SUBDIVISIONS.triplet).toBeDefined();
      expect(SUBDIVISIONS.triplet.pattern).toHaveLength(3);
      expect(SUBDIVISIONS.triplet.pattern[0]).toBe(0);
    });

    it("has quarters subdivision with 4 clicks", () => {
      expect(SUBDIVISIONS.quarters).toBeDefined();
      expect(SUBDIVISIONS.quarters.pattern).toEqual([0, 0.25, 0.5, 0.75]);
      expect(SUBDIVISIONS.quarters.accent).toHaveLength(4);
    });

    it("has compound patterns", () => {
      expect(SUBDIVISIONS.halfTwoQuarters).toBeDefined();
      expect(SUBDIVISIONS.twoQuartersHalf).toBeDefined();
      expect(SUBDIVISIONS.dottedHalfQuarter).toBeDefined();
      expect(SUBDIVISIONS.quarterHalfQuarter).toBeDefined();
      expect(SUBDIVISIONS.quarterDottedHalf).toBeDefined();
    });

    it("has swing subdivision", () => {
      expect(SUBDIVISIONS.swing).toBeDefined();
      expect(SUBDIVISIONS.swing.swingOnly).toBe(true);
    });

    it("all patterns have matching accent arrays", () => {
      Object.values(SUBDIVISIONS).forEach((sub) => {
        expect(sub.pattern.length).toBe(sub.accent.length);
      });
    });

    it("all patterns start at 0", () => {
      Object.values(SUBDIVISIONS).forEach((sub) => {
        expect(sub.pattern[0]).toBe(0);
      });
    });

    it("all pattern values are between 0 and 1", () => {
      Object.values(SUBDIVISIONS).forEach((sub) => {
        sub.pattern.forEach((pos) => {
          expect(pos).toBeGreaterThanOrEqual(0);
          expect(pos).toBeLessThanOrEqual(1);
        });
      });
    });

    it("all accent values are between 0 and 1", () => {
      Object.values(SUBDIVISIONS).forEach((sub) => {
        sub.accent.forEach((vol) => {
          expect(vol).toBeGreaterThanOrEqual(0);
          expect(vol).toBeLessThanOrEqual(1);
        });
      });
    });

    it("has required properties on each subdivision", () => {
      Object.values(SUBDIVISIONS).forEach((sub) => {
        expect(sub).toHaveProperty("key");
        expect(sub).toHaveProperty("description");
        expect(sub).toHaveProperty("pattern");
        expect(sub).toHaveProperty("accent");
        expect(sub).toHaveProperty("swingOnly");
      });
    });
  });
});

describe("getSubdivisionLabel", () => {
  describe("with quarter note beat (4)", () => {
    it("returns None for none subdivision", () => {
      expect(getSubdivisionLabel("none", 4)).toBe("None");
    });

    it("returns two 8ths for halves", () => {
      expect(getSubdivisionLabel("halves", 4)).toBe("two 8ths");
    });

    it("returns 8th triplets for triplet", () => {
      expect(getSubdivisionLabel("triplet", 4)).toBe("8th triplets");
    });

    it("returns four 16ths for quarters", () => {
      expect(getSubdivisionLabel("quarters", 4)).toBe("four 16ths");
    });

    it("returns swung 8ths for swing", () => {
      expect(getSubdivisionLabel("swing", 4)).toBe("swung 8ths");
    });
  });

  describe("with half note beat (2)", () => {
    it("returns two quarters for halves", () => {
      expect(getSubdivisionLabel("halves", 2)).toBe("two quarters");
    });

    it("returns four 8ths for quarters", () => {
      expect(getSubdivisionLabel("quarters", 2)).toBe("four 8ths");
    });

    it("returns quarter triplets for triplet", () => {
      expect(getSubdivisionLabel("triplet", 2)).toBe("quarter triplets");
    });
  });

  describe("with eighth note beat (8)", () => {
    it("returns two 16ths for halves", () => {
      expect(getSubdivisionLabel("halves", 8)).toBe("two 16ths");
    });

    it("returns four 32nds for quarters", () => {
      expect(getSubdivisionLabel("quarters", 8)).toBe("four 32nds");
    });

    it("returns 16th triplets for triplet", () => {
      expect(getSubdivisionLabel("triplet", 8)).toBe("16th triplets");
    });
  });

  describe("with whole note beat (1)", () => {
    it("returns two halves for halves", () => {
      expect(getSubdivisionLabel("halves", 1)).toBe("two halves");
    });

    it("returns four quarters for quarters", () => {
      expect(getSubdivisionLabel("quarters", 1)).toBe("four quarters");
    });

    it("returns half triplets for triplet", () => {
      expect(getSubdivisionLabel("triplet", 1)).toBe("half triplets");
    });
  });

  describe("compound patterns", () => {
    it("generates label for halfTwoQuarters", () => {
      const label = getSubdivisionLabel("halfTwoQuarters", 4);
      expect(label).toContain("8th");
      expect(label).toContain("16th");
    });

    it("generates label for dottedHalfQuarter", () => {
      const label = getSubdivisionLabel("dottedHalfQuarter", 4);
      expect(label).toContain("dotted");
    });
  });

  describe("edge cases", () => {
    it("returns key for unknown subdivision", () => {
      expect(getSubdivisionLabel("unknown", 4)).toBe("unknown");
    });

    it("uses quarter note names for unknown note value", () => {
      const label = getSubdivisionLabel("halves", 3);
      // Should fall back to quarter note names
      expect(label).toBe("two 8ths");
    });
  });
});
