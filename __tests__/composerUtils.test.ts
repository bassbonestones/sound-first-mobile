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
  getNearestMidiForPitch,
  getAccidentalForMidi,
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

  describe("getNearestMidiForPitch", () => {
    it("should choose octave closest to reference - step up", () => {
      // Reference: C4 (60), target: E
      // E3=52, E4=64, E5=76
      // E4 (64) is closest to C4 (60) with distance 4
      const result = getNearestMidiForPitch("E", 60, 0);
      expect(result.midi).toBe(64); // E4
    });

    it("should choose octave closest to reference - step down", () => {
      // Reference: E4 (64), target: C
      // C3=48, C4=60, C5=72
      // C4 (60) is closest to E4 (64) with distance 4
      const result = getNearestMidiForPitch("C", 64, 0);
      expect(result.midi).toBe(60); // C4
    });

    it("should prefer lower octave when equidistant going down", () => {
      // Reference: F#4 (66), target: C
      // C4=60 (distance 6), C5=72 (distance 6)
      // Should pick lower C4 when equidistant
      const result = getNearestMidiForPitch("C", 66, 0);
      // Actually C4=60 is 6 away, C5=72 is 6 away - equal, should pick first found (C3 at 48, C4 at 60, C5 at 72)
      // With our algorithm checking octave-1, octave, octave+1, it finds C4 first with distance 6
      expect(result.midi).toBe(60); // C4
    });

    it("should apply key signature accidentals", () => {
      // Reference: G4 (67), target: F in key of G major (1 sharp = F#)
      const result = getNearestMidiForPitch("F", 67, 1);
      expect(result.midi).toBe(66); // F#4
      expect(result.accidental).toBe("sharp");
    });

    it("should handle octave leaps correctly", () => {
      // Reference: C5 (72), target: B
      // B3=59, B4=71, B5=83
      // B4 (71) is closest to C5 (72) with distance 1
      const result = getNearestMidiForPitch("B", 72, 0);
      expect(result.midi).toBe(71); // B4
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

  describe("getAccidentalForMidi", () => {
    it("should return undefined for diatonic notes in C major", () => {
      // C major has no sharps/flats
      expect(getAccidentalForMidi(60, 0)).toBeUndefined(); // C
      expect(getAccidentalForMidi(62, 0)).toBeUndefined(); // D
      expect(getAccidentalForMidi(64, 0)).toBeUndefined(); // E
      expect(getAccidentalForMidi(65, 0)).toBeUndefined(); // F
      expect(getAccidentalForMidi(67, 0)).toBeUndefined(); // G
      expect(getAccidentalForMidi(69, 0)).toBeUndefined(); // A
      expect(getAccidentalForMidi(71, 0)).toBeUndefined(); // B
    });

    it("should return sharp for chromatic notes in C major", () => {
      // In C major, prefer sharps for chromatic notes
      expect(getAccidentalForMidi(61, 0)).toBe("sharp"); // C#
      expect(getAccidentalForMidi(63, 0)).toBe("sharp"); // D#
      expect(getAccidentalForMidi(66, 0)).toBe("sharp"); // F#
      expect(getAccidentalForMidi(68, 0)).toBe("sharp"); // G#
      expect(getAccidentalForMidi(70, 0)).toBe("sharp"); // A#
    });

    it("should return undefined for diatonic notes in G major", () => {
      // G major has F#
      expect(getAccidentalForMidi(67, 1)).toBeUndefined(); // G
      expect(getAccidentalForMidi(66, 1)).toBeUndefined(); // F# (in key)
    });

    it("should return undefined for diatonic notes in Bb major", () => {
      // Bb major (key = -2) has Bb and Eb
      expect(getAccidentalForMidi(70, -2)).toBeUndefined(); // Bb (in key)
      expect(getAccidentalForMidi(63, -2)).toBeUndefined(); // Eb (in key)
      expect(getAccidentalForMidi(60, -2)).toBeUndefined(); // C
      expect(getAccidentalForMidi(62, -2)).toBeUndefined(); // D
      expect(getAccidentalForMidi(65, -2)).toBeUndefined(); // F
      expect(getAccidentalForMidi(67, -2)).toBeUndefined(); // G
      expect(getAccidentalForMidi(69, -2)).toBeUndefined(); // A
    });

    it("should return flat for chromatic notes in flat keys", () => {
      // In Bb major (key = -2), prefer flats for chromatic notes
      expect(getAccidentalForMidi(68, -2)).toBe("flat"); // Ab
      expect(getAccidentalForMidi(66, -2)).toBe("flat"); // Gb
    });

    it("should return natural for notes that cancel key signature flats", () => {
      // B natural (MIDI 71) in Bb major - B is flatted in key, natural raises it
      expect(getAccidentalForMidi(71, -2)).toBe("natural");

      // B natural (MIDI 71) in F major - B is flatted in key
      expect(getAccidentalForMidi(71, -1)).toBe("natural");

      // E natural (MIDI 64) in Eb major (3 flats: Bb, Eb, Ab)
      // E is flatted in key, natural raises it
      expect(getAccidentalForMidi(64, -3)).toBe("natural");
    });

    it("should return natural for notes that cancel key signature sharps", () => {
      // F natural (MIDI 65) in G major - F is sharped in key, natural lowers it
      expect(getAccidentalForMidi(65, 1)).toBe("natural");

      // C natural (MIDI 60) in D major (2 sharps: F#, C#)
      // C is sharped in key, natural lowers it
      expect(getAccidentalForMidi(60, 2)).toBe("natural");
    });

    it("should prefer natural over double accidentals", () => {
      // In C# major (7 sharps), MIDI 62 (D) could be:
      // - Cx (C double-sharp) - priority 3
      // - D natural (canceling D#) - priority 0
      // D natural wins
      expect(getAccidentalForMidi(62, 7)).toBe("natural");

      // In Gb major (6 flats), MIDI 69 (A) could be:
      // - Bbb (B double-flat) - priority 3
      // - A natural (canceling Ab) - priority 0
      // A natural wins
      expect(getAccidentalForMidi(69, -6)).toBe("natural");
    });
  });

  describe("noteToMidi with double accidentals", () => {
    it("should handle double-sharp", () => {
      // C double-sharp = D
      expect(noteToMidi("C", 4, "double-sharp")).toBe(62);
      // F double-sharp = G
      expect(noteToMidi("F", 4, "double-sharp")).toBe(67);
    });

    it("should handle double-flat", () => {
      // B double-flat = A
      expect(noteToMidi("B", 4, "double-flat")).toBe(69);
      // E double-flat = D
      expect(noteToMidi("E", 4, "double-flat")).toBe(62);
    });
  });

  describe("formatMidiNote with double accidentals", () => {
    it("should format double-sharp correctly", () => {
      // Note: formatMidiNote uses midiToNoteName which maps MIDI to the
      // "natural" letter. The accidental is added separately.
      // MIDI 62 maps to D, so formatMidiNote(62, "double-sharp") = "D𝄪4"
      const formatted = formatMidiNote(62, "double-sharp");
      expect(formatted).toContain("D");
      expect(formatted).toContain("𝄪"); // double-sharp symbol
    });

    it("should format double-flat correctly", () => {
      // MIDI 69 maps to A
      const formatted = formatMidiNote(69, "double-flat");
      expect(formatted).toContain("A");
      expect(formatted).toContain("𝄫"); // double-flat symbol
    });
  });
});
