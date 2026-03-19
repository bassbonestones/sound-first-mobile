/**
 * Practice Types Tests
 *
 * Tests for practice session utilities and type functions.
 */

import {
  midiToNoteName,
  noteNameToMidi,
  midiToFrequency,
  calculateCents,
  isPitchMatch,
  createEmptyStats,
  calculateStats,
} from "../src/features/importMusic/types/practiceTypes";
import type { NotePerformance } from "../src/features/importMusic/types/practiceTypes";

describe("practiceTypes", () => {
  describe("midiToNoteName", () => {
    it("converts C4 (60) correctly", () => {
      expect(midiToNoteName(60)).toBe("C4");
    });

    it("converts A4 (69) correctly", () => {
      expect(midiToNoteName(69)).toBe("A4");
    });

    it("converts C#4 (61) correctly", () => {
      expect(midiToNoteName(61)).toBe("C#4");
    });

    it("converts B3 (59) correctly", () => {
      expect(midiToNoteName(59)).toBe("B3");
    });

    it("converts high notes", () => {
      expect(midiToNoteName(84)).toBe("C6");
    });

    it("converts low notes", () => {
      expect(midiToNoteName(36)).toBe("C2");
    });
  });

  describe("noteNameToMidi", () => {
    it("converts C4 correctly", () => {
      expect(noteNameToMidi("C4")).toBe(60);
    });

    it("converts A4 correctly", () => {
      expect(noteNameToMidi("A4")).toBe(69);
    });

    it("handles sharps", () => {
      expect(noteNameToMidi("C#4")).toBe(61);
      expect(noteNameToMidi("F#5")).toBe(78);
    });

    it("handles flats", () => {
      expect(noteNameToMidi("Bb4")).toBe(70);
      expect(noteNameToMidi("Eb3")).toBe(51);
    });

    it("is case insensitive", () => {
      expect(noteNameToMidi("c4")).toBe(60);
      expect(noteNameToMidi("a#4")).toBe(70);
    });

    it("returns 60 for invalid input", () => {
      expect(noteNameToMidi("invalid")).toBe(60);
      expect(noteNameToMidi("")).toBe(60);
    });
  });

  describe("midiToFrequency", () => {
    it("returns 440 for A4 (69)", () => {
      expect(midiToFrequency(69)).toBeCloseTo(440, 1);
    });

    it("returns ~261.6 for C4 (60)", () => {
      expect(midiToFrequency(60)).toBeCloseTo(261.63, 1);
    });

    it("returns ~880 for A5 (81)", () => {
      expect(midiToFrequency(81)).toBeCloseTo(880, 1);
    });
  });

  describe("calculateCents", () => {
    it("returns 0 for same frequency", () => {
      expect(calculateCents(440, 440)).toBeCloseTo(0, 1);
    });

    it("returns ~100 for one semitone higher", () => {
      // A4 (440) to A#4 (466.16)
      expect(calculateCents(466.16, 440)).toBeCloseTo(100, 0);
    });

    it("returns ~-100 for one semitone lower", () => {
      // A4 (440) to G#4 (415.3)
      expect(calculateCents(415.3, 440)).toBeCloseTo(-100, 0);
    });

    it("returns ~1200 for one octave higher", () => {
      expect(calculateCents(880, 440)).toBeCloseTo(1200, 0);
    });
  });

  describe("isPitchMatch", () => {
    it("returns true for exact match", () => {
      expect(isPitchMatch(60, 60, 0)).toBe(true);
    });

    it("returns true within tolerance", () => {
      expect(isPitchMatch(60, 60, 25)).toBe(true);
      expect(isPitchMatch(60, 60, -25)).toBe(true);
    });

    it("returns false outside tolerance", () => {
      expect(isPitchMatch(60, 60, 60)).toBe(false);
      expect(isPitchMatch(60, 60, -60)).toBe(false);
    });

    it("handles octave equivalents", () => {
      // C4 and C5 are octave equivalent
      expect(isPitchMatch(72, 60, 0, { allowOctaveEquivalent: true })).toBe(
        true,
      );
      expect(isPitchMatch(72, 60, 0, { allowOctaveEquivalent: false })).toBe(
        false,
      );
    });

    it("respects custom tolerance", () => {
      expect(isPitchMatch(60, 60, 30, { centsTolerance: 25 })).toBe(false);
      expect(isPitchMatch(60, 60, 30, { centsTolerance: 35 })).toBe(true);
    });
  });

  describe("createEmptyStats", () => {
    it("returns zeroed stats", () => {
      const stats = createEmptyStats();
      expect(stats.totalNotes).toBe(0);
      expect(stats.correctNotes).toBe(0);
      expect(stats.accuracy).toBe(0);
      expect(stats.averageCentsDeviation).toBe(0);
    });
  });

  describe("calculateStats", () => {
    it("returns empty stats for empty array", () => {
      const stats = calculateStats([], 10, 120);
      expect(stats.totalNotes).toBe(0);
      expect(stats.accuracy).toBe(0);
    });

    it("calculates accuracy correctly", () => {
      const performances: NotePerformance[] = [
        {
          targetMidiNote: 60,
          playedMidiNote: 60,
          centsDeviation: 5,
          wasCorrect: true,
          noteIndex: 0,
          measureNumber: 1,
          beatNumber: 1,
          expectedTime: 0,
          detectedTime: 100,
        },
        {
          targetMidiNote: 62,
          playedMidiNote: 62,
          centsDeviation: 10,
          wasCorrect: true,
          noteIndex: 1,
          measureNumber: 1,
          beatNumber: 2,
          expectedTime: 500,
          detectedTime: 600,
        },
        {
          targetMidiNote: 64,
          playedMidiNote: 65,
          centsDeviation: 100,
          wasCorrect: false,
          noteIndex: 2,
          measureNumber: 1,
          beatNumber: 3,
          expectedTime: 1000,
          detectedTime: 1100,
        },
        {
          targetMidiNote: 65,
          playedMidiNote: null,
          centsDeviation: null,
          wasCorrect: false,
          noteIndex: 3,
          measureNumber: 1,
          beatNumber: 4,
          expectedTime: 1500,
          detectedTime: null,
        },
      ];

      const stats = calculateStats(performances, 5, 120);

      expect(stats.totalNotes).toBe(4);
      expect(stats.correctNotes).toBe(2);
      expect(stats.incorrectNotes).toBe(1);
      expect(stats.missedNotes).toBe(1);
      expect(stats.accuracy).toBe(50); // 2/4 = 50%
      expect(stats.tempoBpm).toBe(120);
      expect(stats.practiceTimeSeconds).toBe(5);
      expect(stats.measuresRange.start).toBe(1);
      expect(stats.measuresRange.end).toBe(1);
    });

    it("calculates average cents deviation", () => {
      const performances: NotePerformance[] = [
        {
          targetMidiNote: 60,
          playedMidiNote: 60,
          centsDeviation: 10,
          wasCorrect: true,
          noteIndex: 0,
          measureNumber: 1,
          beatNumber: 1,
          expectedTime: 0,
          detectedTime: 100,
        },
        {
          targetMidiNote: 62,
          playedMidiNote: 62,
          centsDeviation: -20,
          wasCorrect: true,
          noteIndex: 1,
          measureNumber: 1,
          beatNumber: 2,
          expectedTime: 500,
          detectedTime: 600,
        },
        {
          targetMidiNote: 64,
          playedMidiNote: 64,
          centsDeviation: 30,
          wasCorrect: true,
          noteIndex: 2,
          measureNumber: 1,
          beatNumber: 3,
          expectedTime: 1000,
          detectedTime: 1100,
        },
      ];

      const stats = calculateStats(performances, 5, 120);

      // Average of |10|, |-20|, |30| = (10 + 20 + 30) / 3 = 20
      expect(stats.averageCentsDeviation).toBe(20);
    });
  });
});
