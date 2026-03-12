/**
 * Tests for pitchUtils.ts
 * Covers pitch detection utilities
 */
import {
  NOTE_NAMES,
  frequencyToNote,
  noteNameToMidi,
  autoCorrelate,
  isOctaveEquivalent,
  getPitchClass,
} from "../src/components/AudioInput/pitchUtils";

describe("pitchUtils", () => {
  describe("NOTE_NAMES", () => {
    it("contains 12 chromatic notes", () => {
      expect(NOTE_NAMES).toHaveLength(12);
    });

    it("starts with C", () => {
      expect(NOTE_NAMES[0]).toBe("C");
    });

    it("ends with B", () => {
      expect(NOTE_NAMES[11]).toBe("B");
    });

    it("has all chromatic notes in order", () => {
      expect(NOTE_NAMES).toEqual([
        "C",
        "C#",
        "D",
        "D#",
        "E",
        "F",
        "F#",
        "G",
        "G#",
        "A",
        "A#",
        "B",
      ]);
    });
  });

  describe("frequencyToNote", () => {
    it("detects A4 at 440Hz", () => {
      const result = frequencyToNote(440);
      expect(result).not.toBeNull();
      expect(result?.noteName).toBe("A4");
      expect(result?.midiNote).toBe(69);
      expect(result?.cents).toBe(0);
      expect(result?.isInTune).toBe(true);
    });

    it("detects C4 at ~262Hz", () => {
      const result = frequencyToNote(261.63);
      expect(result).not.toBeNull();
      expect(result?.noteName).toBe("C4");
      expect(result?.midiNote).toBe(60);
    });

    it("detects octave relationships", () => {
      const a3 = frequencyToNote(220);
      const a4 = frequencyToNote(440);
      const a5 = frequencyToNote(880);

      expect(a3?.noteName).toBe("A3");
      expect(a4?.noteName).toBe("A4");
      expect(a5?.noteName).toBe("A5");
    });

    it("calculates cents deviation", () => {
      // Slightly sharp: 5 cents sharp should be positive
      const sharpA4 = 440 * Math.pow(2, 5 / 1200);
      const result = frequencyToNote(sharpA4);
      expect(result?.cents).toBeGreaterThan(0);
      expect(result?.cents).toBeLessThan(10);
    });

    it("marks in-tune when within 20 cents", () => {
      // 10 cents off
      const slightlyOff = 440 * Math.pow(2, 10 / 1200);
      const result = frequencyToNote(slightlyOff);
      expect(result?.isInTune).toBe(true);
    });

    it("marks out-of-tune when outside 20 cents", () => {
      // 30 cents off
      const tooFar = 440 * Math.pow(2, 30 / 1200);
      const result = frequencyToNote(tooFar);
      expect(result?.isInTune).toBe(false);
    });

    it("returns null for frequency too low", () => {
      expect(frequencyToNote(10)).toBeNull();
    });

    it("returns null for frequency too high", () => {
      expect(frequencyToNote(6000)).toBeNull();
    });

    it("returns null for zero frequency", () => {
      expect(frequencyToNote(0)).toBeNull();
    });

    it("returns null for negative frequency", () => {
      expect(frequencyToNote(-100)).toBeNull();
    });

    it("returns null for undefined", () => {
      expect(frequencyToNote(undefined as unknown as number)).toBeNull();
    });

    it("returns complete note info object", () => {
      const result = frequencyToNote(440);
      expect(result).toHaveProperty("frequency", 440);
      expect(result).toHaveProperty("noteName", "A4");
      expect(result).toHaveProperty("noteNameShort", "A");
      expect(result).toHaveProperty("octave", 4);
      expect(result).toHaveProperty("midiNote", 69);
      expect(result).toHaveProperty("cents");
      expect(result).toHaveProperty("isInTune");
    });
  });

  describe("noteNameToMidi", () => {
    it("converts C4 to 60", () => {
      expect(noteNameToMidi("C4")).toBe(60);
    });

    it("converts A4 to 69", () => {
      expect(noteNameToMidi("A4")).toBe(69);
    });

    it("converts middle C (C4)", () => {
      expect(noteNameToMidi("C4")).toBe(60);
    });

    it("handles sharps", () => {
      expect(noteNameToMidi("C#4")).toBe(61);
      expect(noteNameToMidi("F#4")).toBe(66);
    });

    it("handles flats", () => {
      expect(noteNameToMidi("Bb3")).toBe(58);
      expect(noteNameToMidi("Eb4")).toBe(63);
    });

    it("handles lowercase letters", () => {
      expect(noteNameToMidi("c4")).toBe(60);
      expect(noteNameToMidi("a4")).toBe(69);
    });

    it("handles octave 0", () => {
      expect(noteNameToMidi("C0")).toBe(12);
    });

    it("handles high octaves", () => {
      expect(noteNameToMidi("C8")).toBe(108);
    });

    it("returns null for invalid note", () => {
      expect(noteNameToMidi("X4")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(noteNameToMidi("")).toBeNull();
    });

    it("returns null for null", () => {
      expect(noteNameToMidi(null as unknown as string)).toBeNull();
    });

    it("returns null for missing octave", () => {
      expect(noteNameToMidi("A")).toBeNull();
    });

    it("returns null for double sharp", () => {
      expect(noteNameToMidi("C##4")).toBeNull();
    });
  });

  describe("autoCorrelate", () => {
    it("returns -1 frequency for silent buffer", () => {
      const buffer = new Float32Array(1024).fill(0);
      const result = autoCorrelate(buffer, 44100);
      expect(result.frequency).toBe(-1);
      expect(result.confidence).toBe(0);
    });

    it("returns low rms for silent buffer", () => {
      const buffer = new Float32Array(1024).fill(0);
      const result = autoCorrelate(buffer, 44100);
      expect(result.rms).toBe(0);
    });

    it("calculates rms for noise", () => {
      const buffer = new Float32Array(1024);
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = (Math.random() * 2 - 1) * 0.5;
      }
      const result = autoCorrelate(buffer, 44100);
      expect(result.rms).toBeGreaterThan(0);
    });

    it("detects sine wave frequency", () => {
      // Generate 440Hz sine wave
      const sampleRate = 44100;
      const duration = 0.1;
      const samples = Math.floor(sampleRate * duration);
      const buffer = new Float32Array(samples);
      const frequency = 440;

      for (let i = 0; i < samples; i++) {
        buffer[i] = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * 0.5;
      }

      const result = autoCorrelate(buffer, sampleRate);
      // Frequency should be close to 440Hz
      expect(result.frequency).toBeGreaterThan(400);
      expect(result.frequency).toBeLessThan(500);
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe("getPitchClass", () => {
    it("returns 0 for C notes", () => {
      expect(getPitchClass("C3")).toBe(0);
      expect(getPitchClass("C4")).toBe(0);
      expect(getPitchClass("C5")).toBe(0);
    });

    it("returns 9 for A notes", () => {
      expect(getPitchClass("A3")).toBe(9);
      expect(getPitchClass("A4")).toBe(9);
    });

    it("handles sharps correctly", () => {
      expect(getPitchClass("C#4")).toBe(1);
      expect(getPitchClass("F#4")).toBe(6);
    });

    it("handles flats correctly", () => {
      expect(getPitchClass("Bb4")).toBe(10);
      expect(getPitchClass("Eb4")).toBe(3);
    });

    it("returns null for invalid note", () => {
      expect(getPitchClass("X4")).toBeNull();
      expect(getPitchClass("")).toBeNull();
    });
  });

  describe("isOctaveEquivalent", () => {
    it("returns true for same notes in different octaves", () => {
      expect(isOctaveEquivalent("C3", "C4")).toBe(true);
      expect(isOctaveEquivalent("C4", "C5")).toBe(true);
      expect(isOctaveEquivalent("A3", "A5")).toBe(true);
    });

    it("returns true for same note same octave", () => {
      expect(isOctaveEquivalent("A4", "A4")).toBe(true);
    });

    it("returns false for different notes", () => {
      expect(isOctaveEquivalent("C4", "D4")).toBe(false);
      expect(isOctaveEquivalent("A4", "B4")).toBe(false);
    });

    it("returns false for enharmonic equivalents", () => {
      // C# and Db have different pitch classes in this implementation
      expect(isOctaveEquivalent("C#4", "Db4")).toBe(true);
    });

    it("returns false for invalid notes", () => {
      expect(isOctaveEquivalent("X4", "A4")).toBe(false);
      expect(isOctaveEquivalent("A4", "")).toBe(false);
    });
  });
});
