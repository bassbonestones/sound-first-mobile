/**
 * Tests for initialCapabilities data
 */
import {
  INITIAL_DATA,
  InitialCapability,
} from "../src/screens/CapabilityPath/data/initialCapabilities";

describe("initialCapabilities", () => {
  describe("INITIAL_DATA", () => {
    it("exports an array of capabilities", () => {
      expect(Array.isArray(INITIAL_DATA)).toBe(true);
      expect(INITIAL_DATA.length).toBeGreaterThan(0);
    });

    it("each capability has required properties", () => {
      INITIAL_DATA.forEach((cap: InitialCapability) => {
        expect(typeof cap.id).toBe("number");
        expect(typeof cap.capability).toBe("string");
        expect(typeof cap.display_name).toBe("string");
        expect(typeof cap.category).toBe("string");
        expect(typeof cap.teaching_order).toBe("number");
        expect(typeof cap.type).toBe("string");
        expect(typeof cap.mastery_count).toBe("number");
        expect(typeof cap.teaching_materials).toBe("string");
        expect(typeof cap.notes).toBe("string");
      });
    });

    it("has unique ids", () => {
      const ids = INITIAL_DATA.map((cap) => cap.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("has unique capability names", () => {
      const names = INITIAL_DATA.map((cap) => cap.capability);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it("has valid type values", () => {
      const validTypes = ["P", "T", "E", "R"];
      INITIAL_DATA.forEach((cap: InitialCapability) => {
        expect(validTypes).toContain(cap.type);
      });
    });

    it("has positive mastery counts", () => {
      INITIAL_DATA.forEach((cap: InitialCapability) => {
        expect(cap.mastery_count).toBeGreaterThan(0);
      });
    });

    it("has teaching orders starting from 1", () => {
      const orders = INITIAL_DATA.map((cap) => cap.teaching_order).sort(
        (a, b) => a - b,
      );
      expect(orders[0]).toBe(1);
      // All orders should be positive
      orders.forEach((order) => {
        expect(order).toBeGreaterThan(0);
      });
    });

    it("includes fundamental capabilities", () => {
      const fundamentals = INITIAL_DATA.filter(
        (cap) => cap.category === "Fundamentals",
      );
      expect(fundamentals.length).toBeGreaterThan(0);
    });

    it("includes staff notation capability", () => {
      const staff = INITIAL_DATA.find(
        (cap) => cap.capability === "notation_staff",
      );
      expect(staff).toBeDefined();
      expect(staff?.display_name).toContain("Staff");
    });

    it("includes bass clef capability", () => {
      const bassClef = INITIAL_DATA.find(
        (cap) => cap.capability === "clef_bass",
      );
      expect(bassClef).toBeDefined();
      expect(bassClef?.display_name).toContain("Bass Clef");
    });

    it("includes time signature capabilities", () => {
      const timeSigs = INITIAL_DATA.filter((cap) =>
        cap.capability.includes("time_sig"),
      );
      expect(timeSigs.length).toBeGreaterThan(0);
    });

    it("has categories defined", () => {
      const categories = new Set(INITIAL_DATA.map((cap) => cap.category));
      expect(categories.size).toBeGreaterThan(1);
    });
  });
});
