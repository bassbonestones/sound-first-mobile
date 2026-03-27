/**
 * Tests for noteUtils - shared note utility functions
 */
import {
  parseNoteName,
  noteToMidi,
  midiToNote,
  shouldUseSharps,
  midiToNoteInContext,
  midiToFrequency,
  noteToFrequency,
  formatNoteName,
} from "../src/screens/Session/components/exercises/shared/noteUtils";

describe("noteUtils", () => {
  describe("parseNoteName", () => {
    it("parses natural notes correctly", () => {
      const result = parseNoteName("C4");
      expect(result).toEqual({ letter: "C", accidental: "", octave: 4 });
    });

    it("parses sharp notes correctly", () => {
      const result = parseNoteName("F#3");
      expect(result).toEqual({ letter: "F", accidental: "#", octave: 3 });
    });

    it("parses flat notes correctly", () => {
      const result = parseNoteName("Bb5");
      expect(result).toEqual({ letter: "B", accidental: "b", octave: 5 });
    });

    it("returns null for empty string", () => {
      expect(parseNoteName("")).toBeNull();
    });

    it("returns null for invalid format", () => {
      expect(parseNoteName("invalid")).toBeNull();
    });

    it("handles lowercase note names", () => {
      const result = parseNoteName("c4");
      expect(result).toEqual({ letter: "C", accidental: "", octave: 4 });
    });
  });

  describe("noteToMidi", () => {
    it("converts C4 to 60", () => {
      expect(noteToMidi("C4")).toBe(60);
    });

    it("converts A4 to 69", () => {
      expect(noteToMidi("A4")).toBe(69);
    });

    it("converts C#4 to 61", () => {
      expect(noteToMidi("C#4")).toBe(61);
    });

    it("converts Db4 to 61", () => {
      expect(noteToMidi("Db4")).toBe(61);
    });

    it("returns 60 for invalid note", () => {
      expect(noteToMidi("invalid")).toBe(60);
    });
  });

  describe("midiToNote", () => {
    it("converts 60 to C4", () => {
      expect(midiToNote(60)).toBe("C4");
    });

    it("converts 61 to Db4 with preferFlats=true", () => {
      expect(midiToNote(61, true)).toBe("Db4");
    });

    it("converts 61 to C#4 with preferFlats=false", () => {
      expect(midiToNote(61, false)).toBe("C#4");
    });

    it("converts 69 to A4", () => {
      expect(midiToNote(69)).toBe("A4");
    });
  });

  describe("shouldUseSharps", () => {
    it("returns false for empty string", () => {
      expect(shouldUseSharps("")).toBe(false);
    });

    it("returns false for null-ish value", () => {
      expect(shouldUseSharps(null as unknown as string)).toBe(false);
    });

    it("returns true for notes with sharps", () => {
      expect(shouldUseSharps("F#")).toBe(true);
      expect(shouldUseSharps("C#4")).toBe(true);
    });

    it("returns true for sharp key root notes", () => {
      expect(shouldUseSharps("G")).toBe(true);
      expect(shouldUseSharps("D")).toBe(true);
      expect(shouldUseSharps("A")).toBe(true);
      expect(shouldUseSharps("E")).toBe(true);
      expect(shouldUseSharps("B")).toBe(true);
    });

    it("returns false for flat key root notes", () => {
      expect(shouldUseSharps("F")).toBe(false);
      expect(shouldUseSharps("C")).toBe(false);
    });

    it("returns true for B-based notes (sharp key)", () => {
      // B is in sharpRoots, so even Bb returns true (based on first letter)
      expect(shouldUseSharps("Bb")).toBe(true);
      expect(shouldUseSharps("B")).toBe(true);
    });
  });

  describe("midiToNoteInContext", () => {
    it("returns sharp for sharp reference note", () => {
      const result = midiToNoteInContext(61, "F#4");
      expect(result).toBe("C#4");
    });

    it("returns flat for flat key reference note", () => {
      // F is a flat key root, so use flats
      const result = midiToNoteInContext(61, "F4");
      expect(result).toBe("Db4");
    });

    it("returns natural notes unchanged", () => {
      const result = midiToNoteInContext(60, "C4");
      expect(result).toBe("C4");
    });

    it("uses B letter context for sharps", () => {
      // B is a sharp key, so even Bb reference would use sharps
      // based on first letter
      const result = midiToNoteInContext(61, "B4");
      expect(result).toBe("C#4");
    });
  });

  describe("midiToFrequency", () => {
    it("converts MIDI 69 (A4) to 440 Hz", () => {
      expect(midiToFrequency(69)).toBe(440);
    });

    it("converts MIDI 60 (C4) to ~261.63 Hz", () => {
      expect(midiToFrequency(60)).toBeCloseTo(261.63, 1);
    });

    it("converts MIDI 81 (A5) to 880 Hz", () => {
      expect(midiToFrequency(81)).toBeCloseTo(880, 0);
    });
  });

  describe("noteToFrequency", () => {
    it("converts A4 to 440 Hz", () => {
      expect(noteToFrequency("A4")).toBe(440);
    });

    it("converts C4 to ~261.63 Hz", () => {
      expect(noteToFrequency("C4")).toBeCloseTo(261.63, 1);
    });
  });

  describe("formatNoteName", () => {
    it("converts # to sharp symbol", () => {
      expect(formatNoteName("C#4")).toBe("C♯4");
    });

    it("converts b to flat symbol", () => {
      expect(formatNoteName("Bb4")).toBe("B♭4");
    });

    it("returns empty string for empty input", () => {
      expect(formatNoteName("")).toBe("");
    });

    it("leaves natural notes unchanged", () => {
      expect(formatNoteName("C4")).toBe("C4");
    });
  });
});
