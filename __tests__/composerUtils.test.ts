/**
 * Composer Utils Tests
 *
 * Tests for pitch, duration, and cursor utilities.
 */

import {
  // Pitch utils
  midiToNoteName,
  midiToOctave,
  noteToMidi,
  formatMidiNote,
  getNextDiatonicPitch,
  getPreviousDiatonicPitch,
  shiftOctave,
  getPitchInKey,
  getDefaultMidiForPitch,
  isValidMidi,
  clampMidi,
  MIN_MIDI,
  MAX_MIDI,
} from "../src/features/composer/utils/pitchUtils";

import {
  // Duration utils
  DURATION_OPTIONS,
  getShorterDuration,
  getLongerDuration,
  getDurationDisplayName,
  getDurationSymbol,
  getRemainingDuration,
  getDurationsThatFit,
  getLargestFittingDuration,
  generateRestsToFill,
  getDurationFromKey,
} from "../src/features/composer/utils/durationUtils";

import {
  // Cursor utils
  moveCursorRight,
  moveCursorLeft,
  moveCursorToStart,
  moveCursorToEnd,
  getNoteAtCursor,
  getNoteBefore,
  isAtStart,
  isAtEnd,
  isAtMeasureStart,
  isAtMeasureEnd,
  clampCursor,
  cursorsEqual,
  findNotePosition,
} from "../src/features/composer/utils/cursorUtils";

import {
  createScore,
  createMeasure,
  createNote,
  DURATION,
} from "../src/features/composer/types";

describe("Pitch Utils", () => {
  describe("midiToNoteName", () => {
    it("should convert MIDI to note name", () => {
      expect(midiToNoteName(60)).toBe("C");
      expect(midiToNoteName(62)).toBe("D");
      expect(midiToNoteName(64)).toBe("E");
      expect(midiToNoteName(65)).toBe("F");
      expect(midiToNoteName(67)).toBe("G");
      expect(midiToNoteName(69)).toBe("A");
      expect(midiToNoteName(71)).toBe("B");
    });

    it("should handle sharps/flats by returning base note", () => {
      expect(midiToNoteName(61)).toBe("C"); // C#/Db
      expect(midiToNoteName(63)).toBe("D"); // D#/Eb
    });

    it("should work across octaves", () => {
      expect(midiToNoteName(48)).toBe("C"); // C3
      expect(midiToNoteName(72)).toBe("C"); // C5
    });
  });

  describe("midiToOctave", () => {
    it("should return correct octave", () => {
      expect(midiToOctave(60)).toBe(4); // C4
      expect(midiToOctave(48)).toBe(3); // C3
      expect(midiToOctave(72)).toBe(5); // C5
      expect(midiToOctave(21)).toBe(0); // A0
    });
  });

  describe("noteToMidi", () => {
    it("should convert note name and octave to MIDI", () => {
      expect(noteToMidi("C", 4)).toBe(60);
      expect(noteToMidi("A", 4)).toBe(69);
      expect(noteToMidi("C", 3)).toBe(48);
    });

    it("should apply accidentals", () => {
      expect(noteToMidi("C", 4, "sharp")).toBe(61);
      expect(noteToMidi("D", 4, "flat")).toBe(61);
      expect(noteToMidi("C", 4, "natural")).toBe(60);
    });
  });

  describe("formatMidiNote", () => {
    it("should format MIDI as note name", () => {
      expect(formatMidiNote(60)).toBe("C4");
      expect(formatMidiNote(69)).toBe("A4");
    });

    it("should include accidental symbols", () => {
      expect(formatMidiNote(61, "sharp")).toBe("C♯4");
      expect(formatMidiNote(61, "flat")).toBe("C♭4");
    });
  });

  describe("getNextDiatonicPitch", () => {
    it("should return next diatonic pitch", () => {
      expect(getNextDiatonicPitch(60)).toBe(62); // C -> D
      expect(getNextDiatonicPitch(62)).toBe(64); // D -> E
      expect(getNextDiatonicPitch(64)).toBe(65); // E -> F
    });

    it("should wrap to next octave after B", () => {
      expect(getNextDiatonicPitch(71)).toBe(72); // B4 -> C5
    });
  });

  describe("getPreviousDiatonicPitch", () => {
    it("should return previous diatonic pitch", () => {
      expect(getPreviousDiatonicPitch(62)).toBe(60); // D -> C
      expect(getPreviousDiatonicPitch(65)).toBe(64); // F -> E
    });

    it("should wrap to previous octave before C", () => {
      expect(getPreviousDiatonicPitch(60)).toBe(59); // C4 -> B3
    });
  });

  describe("shiftOctave", () => {
    it("should shift octave up", () => {
      expect(shiftOctave(60, "up")).toBe(72);
    });

    it("should shift octave down", () => {
      expect(shiftOctave(60, "down")).toBe(48);
    });
  });

  describe("getPitchInKey", () => {
    it("should return natural in C major", () => {
      const result = getPitchInKey("C", 4, 0);
      expect(result.midi).toBe(60);
      expect(result.accidental).toBeUndefined();
    });

    it("should add sharp in G major for F", () => {
      const result = getPitchInKey("F", 4, 1);
      expect(result.midi).toBe(66); // F#
      expect(result.accidental).toBe("sharp");
    });

    it("should add flat in F major for B", () => {
      const result = getPitchInKey("B", 4, -1);
      expect(result.midi).toBe(70); // Bb
      expect(result.accidental).toBe("flat");
    });
  });

  describe("isValidMidi", () => {
    it("should return true for valid MIDI range", () => {
      expect(isValidMidi(60)).toBe(true);
      expect(isValidMidi(MIN_MIDI)).toBe(true);
      expect(isValidMidi(MAX_MIDI)).toBe(true);
    });

    it("should return false for invalid MIDI", () => {
      expect(isValidMidi(MIN_MIDI - 1)).toBe(false);
      expect(isValidMidi(MAX_MIDI + 1)).toBe(false);
    });
  });

  describe("clampMidi", () => {
    it("should clamp to valid range", () => {
      expect(clampMidi(60)).toBe(60);
      expect(clampMidi(0)).toBe(MIN_MIDI);
      expect(clampMidi(200)).toBe(MAX_MIDI);
    });
  });
});

describe("Duration Utils", () => {
  describe("DURATION_OPTIONS", () => {
    it("should be in descending order", () => {
      expect(DURATION_OPTIONS[0]).toBeGreaterThan(DURATION_OPTIONS[1]);
      expect(DURATION_OPTIONS[1]).toBeGreaterThan(DURATION_OPTIONS[2]);
    });
  });

  describe("getShorterDuration", () => {
    it("should return next shorter duration", () => {
      expect(getShorterDuration(DURATION.WHOLE)).toBe(DURATION.HALF);
      expect(getShorterDuration(DURATION.HALF)).toBe(DURATION.QUARTER);
      expect(getShorterDuration(DURATION.QUARTER)).toBe(DURATION.EIGHTH);
    });

    it("should return null for shortest", () => {
      expect(getShorterDuration(DURATION.SIXTEENTH)).toBeNull();
    });
  });

  describe("getLongerDuration", () => {
    it("should return next longer duration", () => {
      expect(getLongerDuration(DURATION.HALF)).toBe(DURATION.WHOLE);
      expect(getLongerDuration(DURATION.QUARTER)).toBe(DURATION.HALF);
    });

    it("should return null for longest", () => {
      expect(getLongerDuration(DURATION.WHOLE)).toBeNull();
    });
  });

  describe("getDurationDisplayName", () => {
    it("should return display names", () => {
      expect(getDurationDisplayName(DURATION.WHOLE)).toBe("Whole");
      expect(getDurationDisplayName(DURATION.QUARTER)).toBe("Quarter");
      expect(getDurationDisplayName(DURATION.SIXTEENTH)).toBe("16th");
    });
  });

  describe("getDurationSymbol", () => {
    it("should return note symbols", () => {
      expect(getDurationSymbol(DURATION.QUARTER)).toBe("♩");
      expect(getDurationSymbol(DURATION.EIGHTH)).toBe("♪");
    });
  });

  describe("getRemainingDuration", () => {
    it("should calculate remaining space in measure", () => {
      expect(getRemainingDuration(2, { beats: 4, beatUnit: 4 })).toBe(2);
      expect(getRemainingDuration(4, { beats: 4, beatUnit: 4 })).toBe(0);
      expect(getRemainingDuration(5, { beats: 4, beatUnit: 4 })).toBe(0);
    });
  });

  describe("getDurationsThatFit", () => {
    it("should return durations that fit", () => {
      const fitting = getDurationsThatFit(1);
      expect(fitting).toContain(DURATION.QUARTER);
      expect(fitting).toContain(DURATION.EIGHTH);
      expect(fitting).not.toContain(DURATION.HALF);
    });
  });

  describe("getLargestFittingDuration", () => {
    it("should return largest fitting duration", () => {
      expect(getLargestFittingDuration(4)).toBe(DURATION.WHOLE);
      expect(getLargestFittingDuration(2)).toBe(DURATION.HALF);
      expect(getLargestFittingDuration(0.5)).toBe(DURATION.EIGHTH);
    });

    it("should return null if nothing fits", () => {
      expect(getLargestFittingDuration(0.1)).toBeNull();
    });
  });

  describe("generateRestsToFill", () => {
    it("should generate rests to fill remaining duration", () => {
      const rests = generateRestsToFill(2);
      expect(rests).toEqual([DURATION.HALF]);
    });

    it("should break into multiple rests if needed", () => {
      const rests = generateRestsToFill(1.5);
      expect(rests).toEqual([DURATION.QUARTER, DURATION.EIGHTH]);
    });
  });

  describe("getDurationFromKey", () => {
    it("should map keyboard keys to durations", () => {
      expect(getDurationFromKey("1")).toBe(DURATION.WHOLE);
      expect(getDurationFromKey("3")).toBe(DURATION.QUARTER);
      expect(getDurationFromKey("5")).toBe(DURATION.SIXTEENTH);
    });

    it("should return null for invalid keys", () => {
      expect(getDurationFromKey("x")).toBeNull();
      expect(getDurationFromKey("0")).toBeNull();
    });
  });
});

describe("Cursor Utils", () => {
  // Helper to create a test score
  const createTestScore = () => {
    const score = createScore();
    score.measures = [
      {
        id: "m1",
        notes: [
          createNote(60, DURATION.QUARTER),
          createNote(62, DURATION.QUARTER),
        ],
      },
      {
        id: "m2",
        notes: [createNote(64, DURATION.HALF)],
      },
      {
        id: "m3",
        notes: [],
      },
    ];
    return score;
  };

  describe("moveCursorRight", () => {
    it("should move to next note in measure", () => {
      const score = createTestScore();
      const result = moveCursorRight({ measureIndex: 0, noteIndex: 0 }, score);
      expect(result).toEqual({ measureIndex: 0, noteIndex: 1 });
    });

    it("should move to next measure when at end", () => {
      const score = createTestScore();
      const result = moveCursorRight({ measureIndex: 0, noteIndex: 2 }, score);
      expect(result).toEqual({ measureIndex: 1, noteIndex: 0 });
    });

    it("should stay at end when at last measure", () => {
      const score = createTestScore();
      const result = moveCursorRight({ measureIndex: 2, noteIndex: 0 }, score);
      expect(result).toEqual({ measureIndex: 2, noteIndex: 0 });
    });
  });

  describe("moveCursorLeft", () => {
    it("should move to previous note", () => {
      const score = createTestScore();
      const result = moveCursorLeft({ measureIndex: 0, noteIndex: 1 }, score);
      expect(result).toEqual({ measureIndex: 0, noteIndex: 0 });
    });

    it("should move to last note of previous measure when at start", () => {
      const score = createTestScore();
      const result = moveCursorLeft({ measureIndex: 1, noteIndex: 0 }, score);
      // Goes to last actual note (index 1), not end-of-measure position (index 2)
      expect(result).toEqual({ measureIndex: 0, noteIndex: 1 });
    });

    it("should stay at start", () => {
      const score = createTestScore();
      const result = moveCursorLeft({ measureIndex: 0, noteIndex: 0 }, score);
      expect(result).toEqual({ measureIndex: 0, noteIndex: 0 });
    });
  });

  describe("moveCursorToStart", () => {
    it("should return start position", () => {
      expect(moveCursorToStart()).toEqual({ measureIndex: 0, noteIndex: 0 });
    });
  });

  describe("moveCursorToEnd", () => {
    it("should return end position", () => {
      const score = createTestScore();
      const result = moveCursorToEnd(score);
      expect(result).toEqual({ measureIndex: 2, noteIndex: 0 });
    });
  });

  describe("getNoteAtCursor", () => {
    it("should return note at cursor", () => {
      const score = createTestScore();
      const note = getNoteAtCursor({ measureIndex: 0, noteIndex: 0 }, score);
      expect(note?.midi).toBe(60);
    });

    it("should return null when cursor at end", () => {
      const score = createTestScore();
      const note = getNoteAtCursor({ measureIndex: 0, noteIndex: 2 }, score);
      expect(note).toBeNull();
    });
  });

  describe("getNoteBefore", () => {
    it("should return previous note", () => {
      const score = createTestScore();
      const note = getNoteBefore({ measureIndex: 0, noteIndex: 1 }, score);
      expect(note?.midi).toBe(60);
    });

    it("should return note from previous measure", () => {
      const score = createTestScore();
      const note = getNoteBefore({ measureIndex: 1, noteIndex: 0 }, score);
      expect(note?.midi).toBe(62); // Last note of first measure
    });

    it("should return null at start", () => {
      const score = createTestScore();
      const note = getNoteBefore({ measureIndex: 0, noteIndex: 0 }, score);
      expect(note).toBeNull();
    });
  });

  describe("isAtStart", () => {
    it("should return true at start", () => {
      expect(isAtStart({ measureIndex: 0, noteIndex: 0 })).toBe(true);
    });

    it("should return false elsewhere", () => {
      expect(isAtStart({ measureIndex: 0, noteIndex: 1 })).toBe(false);
      expect(isAtStart({ measureIndex: 1, noteIndex: 0 })).toBe(false);
    });
  });

  describe("isAtEnd", () => {
    it("should return true at end", () => {
      const score = createTestScore();
      expect(isAtEnd({ measureIndex: 2, noteIndex: 0 }, score)).toBe(true);
    });

    it("should return false elsewhere", () => {
      const score = createTestScore();
      expect(isAtEnd({ measureIndex: 0, noteIndex: 0 }, score)).toBe(false);
    });
  });

  describe("clampCursor", () => {
    it("should clamp to valid bounds", () => {
      const score = createTestScore();
      expect(clampCursor({ measureIndex: -1, noteIndex: 0 }, score)).toEqual({
        measureIndex: 0,
        noteIndex: 0,
      });
      expect(clampCursor({ measureIndex: 10, noteIndex: 0 }, score)).toEqual({
        measureIndex: 2,
        noteIndex: 0,
      });
    });
  });

  describe("cursorsEqual", () => {
    it("should compare cursors", () => {
      expect(
        cursorsEqual(
          { measureIndex: 0, noteIndex: 0 },
          { measureIndex: 0, noteIndex: 0 },
        ),
      ).toBe(true);
      expect(
        cursorsEqual(
          { measureIndex: 0, noteIndex: 0 },
          { measureIndex: 0, noteIndex: 1 },
        ),
      ).toBe(false);
    });
  });

  describe("findNotePosition", () => {
    it("should find note by ID", () => {
      const score = createTestScore();
      const noteId = score.measures[0].notes[1].id;
      const position = findNotePosition(noteId, score);
      expect(position).toEqual({ measureIndex: 0, noteIndex: 1 });
    });

    it("should return null for unknown ID", () => {
      const score = createTestScore();
      expect(findNotePosition("unknown-id", score)).toBeNull();
    });
  });
});
