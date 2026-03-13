/**
 * Tests for CapabilityPath constants
 * Covers CATEGORIES, TYPE_OPTIONS, STORAGE_KEY, DEFAULT_NEW_ITEM
 */
import {
  CATEGORIES,
  TYPE_OPTIONS,
  STORAGE_KEY,
  DEFAULT_NEW_ITEM,
} from "../../src/screens/CapabilityPath/data/constants";

describe("CapabilityPath constants", () => {
  // ===========================================================================
  // CATEGORIES Tests
  // ===========================================================================
  describe("CATEGORIES", () => {
    it("is an array", () => {
      expect(Array.isArray(CATEGORIES)).toBe(true);
    });

    it("contains Fundamentals category", () => {
      expect(CATEGORIES).toContain("Fundamentals");
    });

    it("contains Clefs category", () => {
      expect(CATEGORIES).toContain("Clefs");
    });

    it("contains Time Signatures category", () => {
      expect(CATEGORIES).toContain("Time Signatures");
    });

    it("contains Key Signatures category", () => {
      expect(CATEGORIES).toContain("Key Signatures");
    });

    it("contains Note Values category", () => {
      expect(CATEGORIES).toContain("Note Values");
    });

    it("contains Rests category", () => {
      expect(CATEGORIES).toContain("Rests");
    });

    it("contains Melodic Intervals Asc category", () => {
      expect(CATEGORIES).toContain("Melodic Intervals Asc");
    });

    it("contains Melodic Intervals Desc category", () => {
      expect(CATEGORIES).toContain("Melodic Intervals Desc");
    });

    it("contains Harmonic Intervals category", () => {
      expect(CATEGORIES).toContain("Harmonic Intervals");
    });

    it("contains Dynamics category", () => {
      expect(CATEGORIES).toContain("Dynamics");
    });

    it("contains Dynamic Changes category", () => {
      expect(CATEGORIES).toContain("Dynamic Changes");
    });

    it("contains Articulations category", () => {
      expect(CATEGORIES).toContain("Articulations");
    });

    it("contains Ornaments category", () => {
      expect(CATEGORIES).toContain("Ornaments");
    });

    it("contains Tempo Terms category", () => {
      expect(CATEGORIES).toContain("Tempo Terms");
    });

    it("contains Expression Terms category", () => {
      expect(CATEGORIES).toContain("Expression Terms");
    });

    it("contains Repeat Structures category", () => {
      expect(CATEGORIES).toContain("Repeat Structures");
    });

    it("contains Tuplets category", () => {
      expect(CATEGORIES).toContain("Tuplets");
    });

    it("contains Other Notation category", () => {
      expect(CATEGORIES).toContain("Other Notation");
    });

    it("has expected count of categories", () => {
      expect(CATEGORIES.length).toBe(18);
    });

    it("has Fundamentals as first category", () => {
      expect(CATEGORIES[0]).toBe("Fundamentals");
    });
  });

  // ===========================================================================
  // TYPE_OPTIONS Tests
  // ===========================================================================
  describe("TYPE_OPTIONS", () => {
    it("is an array", () => {
      expect(Array.isArray(TYPE_OPTIONS)).toBe(true);
    });

    it("has two options", () => {
      expect(TYPE_OPTIONS.length).toBe(2);
    });

    it("has Prerequisite option", () => {
      const pOption = TYPE_OPTIONS.find((opt) => opt.value === "P");
      expect(pOption).toBeDefined();
      expect(pOption?.label).toBe("P - Prerequisite");
    });

    it("has Teachable in Context option", () => {
      const tOption = TYPE_OPTIONS.find((opt) => opt.value === "T");
      expect(tOption).toBeDefined();
      expect(tOption?.label).toBe("T - Teachable in Context");
    });

    it("each option has label and value", () => {
      TYPE_OPTIONS.forEach((option) => {
        expect(option.label).toBeDefined();
        expect(option.value).toBeDefined();
        expect(typeof option.label).toBe("string");
        expect(typeof option.value).toBe("string");
      });
    });
  });

  // ===========================================================================
  // STORAGE_KEY Tests
  // ===========================================================================
  describe("STORAGE_KEY", () => {
    it("is a string", () => {
      expect(typeof STORAGE_KEY).toBe("string");
    });

    it("has correct value", () => {
      expect(STORAGE_KEY).toBe("@capability_path_data");
    });

    it("starts with @ prefix", () => {
      expect(STORAGE_KEY.startsWith("@")).toBe(true);
    });
  });

  // ===========================================================================
  // DEFAULT_NEW_ITEM Tests
  // ===========================================================================
  describe("DEFAULT_NEW_ITEM", () => {
    it("is an object", () => {
      expect(typeof DEFAULT_NEW_ITEM).toBe("object");
      expect(DEFAULT_NEW_ITEM).not.toBeNull();
    });

    it("has capability property as empty string", () => {
      expect(DEFAULT_NEW_ITEM.capability).toBe("");
    });

    it("has display_name property as empty string", () => {
      expect(DEFAULT_NEW_ITEM.display_name).toBe("");
    });

    it("has category default to Fundamentals", () => {
      expect(DEFAULT_NEW_ITEM.category).toBe("Fundamentals");
    });

    it("has teaching_order default to 999", () => {
      expect(DEFAULT_NEW_ITEM.teaching_order).toBe(999);
    });

    it("has type default to P (Prerequisite)", () => {
      expect(DEFAULT_NEW_ITEM.type).toBe("P");
    });

    it("has mastery_count default to 1", () => {
      expect(DEFAULT_NEW_ITEM.mastery_count).toBe(1);
    });

    it("has teaching_materials property as empty string", () => {
      expect(DEFAULT_NEW_ITEM.teaching_materials).toBe("");
    });

    it("has notes property as empty string", () => {
      expect(DEFAULT_NEW_ITEM.notes).toBe("");
    });

    it("has all expected properties", () => {
      const expectedKeys = [
        "capability",
        "display_name",
        "category",
        "teaching_order",
        "type",
        "mastery_count",
        "teaching_materials",
        "notes",
      ];
      const actualKeys = Object.keys(DEFAULT_NEW_ITEM);
      expect(actualKeys.sort()).toEqual(expectedKeys.sort());
    });
  });
});
