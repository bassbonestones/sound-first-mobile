/**
 * Tests for Onboarding instruments data
 * Tests instrument families, defaults, and helper functions
 */
import {
  instrumentFamilies,
  noteNames,
  instrumentDefaults,
  getClefForInstrument,
  getIconForInstrument,
} from "../src/screens/Onboarding/data/instruments";

describe("Onboarding instruments data", () => {
  describe("instrumentFamilies", () => {
    it("contains all instrument families", () => {
      expect(instrumentFamilies).toHaveProperty("Brass");
      expect(instrumentFamilies).toHaveProperty("Woodwinds");
      expect(instrumentFamilies).toHaveProperty("Strings");
      expect(instrumentFamilies).toHaveProperty("Keyboard");
      expect(instrumentFamilies).toHaveProperty("Voice");
      expect(instrumentFamilies).toHaveProperty("Other");
    });

    it("Brass family has correct structure", () => {
      expect(instrumentFamilies.Brass.icon).toBe("🎺");
      expect(instrumentFamilies.Brass.instruments.length).toBeGreaterThan(0);
      expect(
        instrumentFamilies.Brass.instruments.some((i) => i.name === "Trumpet"),
      ).toBe(true);
    });

    it("Woodwinds family has correct structure", () => {
      expect(instrumentFamilies.Woodwinds.icon).toBe("🎷");
      expect(
        instrumentFamilies.Woodwinds.instruments.some(
          (i) => i.name === "Flute",
        ),
      ).toBe(true);
    });

    it("each instrument has name, icon, and clef", () => {
      Object.values(instrumentFamilies).forEach((family) => {
        family.instruments.forEach((inst) => {
          expect(inst).toHaveProperty("name");
          expect(inst).toHaveProperty("icon");
          expect(inst).toHaveProperty("clef");
          expect(["treble", "bass"]).toContain(inst.clef);
        });
      });
    });
  });

  describe("noteNames", () => {
    it("contains all 12 chromatic notes", () => {
      expect(noteNames).toHaveLength(12);
      expect(noteNames).toContain("C");
      expect(noteNames).toContain("C#");
      expect(noteNames).toContain("D");
      expect(noteNames).toContain("D#");
      expect(noteNames).toContain("E");
      expect(noteNames).toContain("F");
      expect(noteNames).toContain("F#");
      expect(noteNames).toContain("G");
      expect(noteNames).toContain("G#");
      expect(noteNames).toContain("A");
      expect(noteNames).toContain("A#");
      expect(noteNames).toContain("B");
    });
  });

  describe("instrumentDefaults", () => {
    it("has defaults for piano", () => {
      expect(instrumentDefaults.Piano).toEqual({
        startingNote: "C4",
        clef: "treble",
      });
    });

    it("has defaults for trumpet", () => {
      expect(instrumentDefaults.Trumpet).toEqual({
        startingNote: "Bb4",
        clef: "treble",
      });
    });

    it("has defaults for cello", () => {
      expect(instrumentDefaults.Cello).toEqual({
        startingNote: "G3",
        clef: "bass",
      });
    });

    it("has defaults for all common instruments", () => {
      expect(instrumentDefaults["Tenor Trombone"]).toBeDefined();
      expect(instrumentDefaults["Alto Saxophone"]).toBeDefined();
      expect(instrumentDefaults.Violin).toBeDefined();
      expect(instrumentDefaults.Flute).toBeDefined();
    });

    it("each default has startingNote and clef", () => {
      Object.values(instrumentDefaults).forEach((defaults) => {
        expect(defaults).toHaveProperty("startingNote");
        expect(defaults).toHaveProperty("clef");
        expect(["treble", "bass"]).toContain(defaults.clef);
      });
    });
  });

  describe("getClefForInstrument", () => {
    it("returns treble for null instrument", () => {
      expect(getClefForInstrument(null, "Brass")).toBe("treble");
    });

    it("returns treble for null family", () => {
      expect(getClefForInstrument("Trumpet", null)).toBe("treble");
    });

    it("returns correct clef from family instruments", () => {
      expect(getClefForInstrument("Trumpet", "Brass")).toBe("treble");
      expect(getClefForInstrument("Tenor Trombone", "Brass")).toBe("bass");
      expect(getClefForInstrument("Flute", "Woodwinds")).toBe("treble");
      expect(getClefForInstrument("Cello", "Strings")).toBe("bass");
    });

    it("falls back to instrumentDefaults for unknown family", () => {
      expect(getClefForInstrument("Trumpet", "Unknown")).toBe("treble");
    });

    it("returns treble as default for completely unknown instrument", () => {
      expect(getClefForInstrument("Unknown", "Unknown")).toBe("treble");
    });
  });

  describe("getIconForInstrument", () => {
    it("returns default icon for null instrument", () => {
      expect(getIconForInstrument(null, "Brass")).toBe("🎵");
    });

    it("returns default icon for null family", () => {
      expect(getIconForInstrument("Trumpet", null)).toBe("🎵");
    });

    it("returns correct icon from family instruments", () => {
      expect(getIconForInstrument("Trumpet", "Brass")).toBe("🎺");
      expect(getIconForInstrument("Flute", "Woodwinds")).toBe("🪈");
      expect(getIconForInstrument("Violin", "Strings")).toBe("🎻");
      expect(getIconForInstrument("Piano", "Keyboard")).toBe("🎹");
    });

    it("returns default icon for unknown family", () => {
      expect(getIconForInstrument("Trumpet", "Unknown")).toBe("🎵");
    });

    it("returns default icon for unknown instrument", () => {
      expect(getIconForInstrument("Unknown", "Brass")).toBe("🎵");
    });
  });
});
