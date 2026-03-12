/**
 * Tests for notes.js constants and utilities
 * Covers note conversion, frequency calculation, and tuning functions
 */
import {
  noteNames,
  enharmonicNames,
  A4_FREQUENCY,
  frequencyToNote,
  noteToFrequency,
  getCentsDeviation,
  isInTune,
  parseNoteName,
  formatNoteName,
} from "../src/constants/notes";

describe("notes constants", () => {
  describe("noteNames", () => {
    it("contains 12 notes", () => {
      expect(noteNames).toHaveLength(12);
    });

    it("starts with C", () => {
      expect(noteNames[0]).toBe("C");
    });

    it("ends with B", () => {
      expect(noteNames[11]).toBe("B");
    });

    it("contains all chromatic notes", () => {
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

  describe("enharmonicNames", () => {
    it("maps C# to Db", () => {
      expect(enharmonicNames["C#"]).toBe("Db");
    });

    it("maps D# to Eb", () => {
      expect(enharmonicNames["D#"]).toBe("Eb");
    });

    it("maps F# to Gb", () => {
      expect(enharmonicNames["F#"]).toBe("Gb");
    });

    it("maps G# to Ab", () => {
      expect(enharmonicNames["G#"]).toBe("Ab");
    });

    it("maps A# to Bb", () => {
      expect(enharmonicNames["A#"]).toBe("Bb");
    });

    it("has 5 enharmonic pairs", () => {
      expect(Object.keys(enharmonicNames)).toHaveLength(5);
    });
  });

  describe("A4_FREQUENCY", () => {
    it("is standard 440 Hz", () => {
      expect(A4_FREQUENCY).toBe(440);
    });
  });
});

describe("frequencyToNote", () => {
  it("returns A4 for 440 Hz", () => {
    expect(frequencyToNote(440)).toBe("A4");
  });

  it("returns C4 for ~262 Hz", () => {
    expect(frequencyToNote(261.63)).toBe("C4");
  });

  it("returns A5 for 880 Hz (octave up)", () => {
    expect(frequencyToNote(880)).toBe("A5");
  });

  it("returns A3 for 220 Hz (octave down)", () => {
    expect(frequencyToNote(220)).toBe("A3");
  });

  it("returns E4 for ~330 Hz", () => {
    expect(frequencyToNote(329.63)).toBe("E4");
  });

  it("returns null for 0 frequency", () => {
    expect(frequencyToNote(0)).toBeNull();
  });

  it("returns null for negative frequency", () => {
    expect(frequencyToNote(-100)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(frequencyToNote(undefined)).toBeNull();
  });

  it("returns null for null", () => {
    expect(frequencyToNote(null)).toBeNull();
  });

  it("handles high frequencies", () => {
    expect(frequencyToNote(1760)).toBe("A6");
  });

  it("handles low frequencies", () => {
    expect(frequencyToNote(55)).toBe("A1");
  });
});

describe("noteToFrequency", () => {
  it("returns 440 for A4", () => {
    expect(noteToFrequency("A4")).toBeCloseTo(440, 1);
  });

  it("returns ~262 for C4", () => {
    expect(noteToFrequency("C4")).toBeCloseTo(261.63, 1);
  });

  it("returns 880 for A5", () => {
    expect(noteToFrequency("A5")).toBeCloseTo(880, 1);
  });

  it("returns 220 for A3", () => {
    expect(noteToFrequency("A3")).toBeCloseTo(220, 1);
  });

  it("handles sharps", () => {
    expect(noteToFrequency("C#4")).toBeCloseTo(277.18, 1);
  });

  it("handles flats", () => {
    expect(noteToFrequency("Bb4")).toBeCloseTo(466.16, 1);
  });

  it("returns null for invalid note name", () => {
    expect(noteToFrequency("X4")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(noteToFrequency("")).toBeNull();
  });

  it("returns null for null", () => {
    expect(noteToFrequency(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(noteToFrequency(undefined)).toBeNull();
  });

  it("converts back correctly from frequency", () => {
    const freq = noteToFrequency("G4");
    expect(frequencyToNote(freq)).toBe("G4");
  });
});

describe("getCentsDeviation", () => {
  it("returns 0 for matching frequencies", () => {
    expect(getCentsDeviation(440, 440)).toBe(0);
  });

  it("returns ~100 cents for one semitone up", () => {
    // A4 to A#4 is one semitone = 100 cents
    const a4 = 440;
    const aSharp4 = a4 * Math.pow(2, 1 / 12);
    expect(getCentsDeviation(aSharp4, a4)).toBeCloseTo(100, 0);
  });

  it("returns ~-100 cents for one semitone down", () => {
    const a4 = 440;
    const gSharp4 = a4 * Math.pow(2, -1 / 12);
    expect(getCentsDeviation(gSharp4, a4)).toBeCloseTo(-100, 0);
  });

  it("returns 0 for zero frequency", () => {
    expect(getCentsDeviation(0, 440)).toBe(0);
  });

  it("returns 0 for zero target", () => {
    expect(getCentsDeviation(440, 0)).toBe(0);
  });

  it("returns 0 for null inputs", () => {
    expect(getCentsDeviation(null, 440)).toBe(0);
    expect(getCentsDeviation(440, null)).toBe(0);
  });

  it("returns positive for flat pitch", () => {
    // Slightly sharp frequency
    expect(getCentsDeviation(445, 440)).toBeGreaterThan(0);
  });

  it("returns negative for sharp pitch", () => {
    // Slightly flat frequency
    expect(getCentsDeviation(435, 440)).toBeLessThan(0);
  });
});

describe("isInTune", () => {
  it("returns true for perfect pitch", () => {
    expect(isInTune(440, "A4")).toBe(true);
  });

  it("returns true for within threshold", () => {
    // 10 cents off is within default 50 cents threshold
    const slightlyOff = 440 * Math.pow(2, 10 / 1200);
    expect(isInTune(slightlyOff, "A4")).toBe(true);
  });

  it("returns false for outside threshold", () => {
    // 60 cents off is outside default 50 cents threshold
    const tooFarOff = 440 * Math.pow(2, 60 / 1200);
    expect(isInTune(tooFarOff, "A4")).toBe(false);
  });

  it("respects custom threshold", () => {
    const slightlyOff = 440 * Math.pow(2, 30 / 1200);
    expect(isInTune(slightlyOff, "A4", 50)).toBe(true);
    expect(isInTune(slightlyOff, "A4", 20)).toBe(false);
  });

  it("returns false for invalid note", () => {
    expect(isInTune(440, "X4")).toBe(false);
  });

  it("returns false for null note", () => {
    expect(isInTune(440, null)).toBe(false);
  });

  it("works with various notes", () => {
    expect(isInTune(261.63, "C4")).toBe(true);
    expect(isInTune(329.63, "E4")).toBe(true);
    expect(isInTune(392.0, "G4")).toBe(true);
  });
});

describe("parseNoteName", () => {
  it("parses simple note", () => {
    expect(parseNoteName("A4")).toEqual({
      letter: "A",
      accidental: "",
      octave: 4,
    });
  });

  it("parses note with sharp", () => {
    expect(parseNoteName("C#4")).toEqual({
      letter: "C",
      accidental: "#",
      octave: 4,
    });
  });

  it("parses note with flat", () => {
    expect(parseNoteName("Bb3")).toEqual({
      letter: "B",
      accidental: "b",
      octave: 3,
    });
  });

  it("parses high octave", () => {
    expect(parseNoteName("C7")).toEqual({
      letter: "C",
      accidental: "",
      octave: 7,
    });
  });

  it("parses low octave", () => {
    expect(parseNoteName("E1")).toEqual({
      letter: "E",
      accidental: "",
      octave: 1,
    });
  });

  it("returns null for invalid input", () => {
    expect(parseNoteName("X4")).toBeNull();
    expect(parseNoteName("")).toBeNull();
    expect(parseNoteName(null)).toBeNull();
    expect(parseNoteName(undefined)).toBeNull();
  });

  it("returns null for missing octave", () => {
    expect(parseNoteName("A")).toBeNull();
  });

  it("returns null for invalid accidental", () => {
    expect(parseNoteName("A@4")).toBeNull();
  });
});

describe("formatNoteName", () => {
  it("returns same note for sharp style with sharp", () => {
    expect(formatNoteName("C#4", "sharp")).toBe("C#4");
  });

  it("returns same note for flat style with flat", () => {
    expect(formatNoteName("Bb4", "flat")).toBe("Bb4");
  });

  it("converts sharp to flat", () => {
    expect(formatNoteName("C#4", "flat")).toBe("Db4");
    expect(formatNoteName("D#4", "flat")).toBe("Eb4");
    expect(formatNoteName("F#4", "flat")).toBe("Gb4");
    expect(formatNoteName("G#4", "flat")).toBe("Ab4");
    expect(formatNoteName("A#4", "flat")).toBe("Bb4");
  });

  it("returns original for natural notes", () => {
    expect(formatNoteName("C4", "flat")).toBe("C4");
    expect(formatNoteName("D4", "sharp")).toBe("D4");
  });

  it("returns empty string for null", () => {
    expect(formatNoteName(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatNoteName(undefined)).toBe("");
  });

  it("defaults to sharp style", () => {
    expect(formatNoteName("C#4")).toBe("C#4");
  });

  it("returns original for invalid note", () => {
    expect(formatNoteName("invalid")).toBe("invalid");
  });
});
