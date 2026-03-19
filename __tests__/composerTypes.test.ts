/**
 * Composer Types Tests
 *
 * Tests for the core data model and type utilities.
 */

import {
  createMeasure,
  createNote,
  createRest,
  createScore,
  createInitialState,
  DEFAULT_SCORE_VALUES,
  DURATION,
  getBeatsPerMeasure,
  getMeasureDuration,
  isRest,
  validateMeasure,
  wouldOverflow,
  formatTimeSignature,
  DURATION_NAME_TO_VALUE,
  DURATION_VALUE_TO_NAME,
  KEY_SIGNATURE_NAMES,
} from "../src/features/composer/types";

describe("Composer Types", () => {
  describe("Duration constants", () => {
    it("should have correct duration values", () => {
      expect(DURATION.WHOLE).toBe(4);
      expect(DURATION.HALF).toBe(2);
      expect(DURATION.QUARTER).toBe(1);
      expect(DURATION.EIGHTH).toBe(0.5);
      expect(DURATION.SIXTEENTH).toBe(0.25);
    });

    it("should map duration names to values", () => {
      expect(DURATION_NAME_TO_VALUE.whole).toBe(4);
      expect(DURATION_NAME_TO_VALUE.quarter).toBe(1);
      expect(DURATION_NAME_TO_VALUE.sixteenth).toBe(0.25);
    });

    it("should map duration values to names", () => {
      expect(DURATION_VALUE_TO_NAME[4]).toBe("whole");
      expect(DURATION_VALUE_TO_NAME[1]).toBe("quarter");
      expect(DURATION_VALUE_TO_NAME[0.25]).toBe("sixteenth");
    });
  });

  describe("Key signature names", () => {
    it("should have names for all key signatures", () => {
      expect(KEY_SIGNATURE_NAMES[0]).toBe("C Major / A minor");
      expect(KEY_SIGNATURE_NAMES[1]).toBe("G Major / E minor");
      expect(KEY_SIGNATURE_NAMES[-1]).toBe("F Major / D minor");
      expect(KEY_SIGNATURE_NAMES[7]).toBe("C♯ Major / A♯ minor");
      expect(KEY_SIGNATURE_NAMES[-7]).toBe("C♭ Major / A♭ minor");
    });
  });

  describe("createNote", () => {
    it("should create a note with required fields", () => {
      const note = createNote(60, DURATION.QUARTER);
      expect(note.midi).toBe(60);
      expect(note.duration).toBe(1);
      expect(note.id).toBeDefined();
      expect(note.accidental).toBeUndefined();
      expect(note.tieStart).toBeUndefined();
      expect(note.tieEnd).toBeUndefined();
    });

    it("should create a note with optional fields", () => {
      const note = createNote(60, DURATION.HALF, {
        accidental: "sharp",
        tieStart: true,
      });
      expect(note.accidental).toBe("sharp");
      expect(note.tieStart).toBe(true);
    });

    it("should generate unique IDs", () => {
      const note1 = createNote(60, DURATION.QUARTER);
      const note2 = createNote(60, DURATION.QUARTER);
      expect(note1.id).not.toBe(note2.id);
    });
  });

  describe("createRest", () => {
    it("should create a rest (midi = null)", () => {
      const rest = createRest(DURATION.QUARTER);
      expect(rest.midi).toBeNull();
      expect(rest.duration).toBe(1);
    });
  });

  describe("isRest", () => {
    it("should return true for rests", () => {
      const rest = createRest(DURATION.QUARTER);
      expect(isRest(rest)).toBe(true);
    });

    it("should return false for notes", () => {
      const note = createNote(60, DURATION.QUARTER);
      expect(isRest(note)).toBe(false);
    });
  });

  describe("createMeasure", () => {
    it("should create an empty measure", () => {
      const measure = createMeasure();
      expect(measure.notes).toHaveLength(0);
      expect(measure.id).toBeDefined();
    });
  });

  describe("getMeasureDuration", () => {
    it("should return 0 for empty measure", () => {
      const measure = createMeasure();
      expect(getMeasureDuration(measure)).toBe(0);
    });

    it("should sum durations of all notes", () => {
      const measure = createMeasure();
      measure.notes = [
        createNote(60, DURATION.QUARTER),
        createNote(62, DURATION.HALF),
        createRest(DURATION.QUARTER),
      ];
      expect(getMeasureDuration(measure)).toBe(4); // 1 + 2 + 1
    });
  });

  describe("createScore", () => {
    it("should create score with defaults", () => {
      const score = createScore();
      expect(score.title).toBe(DEFAULT_SCORE_VALUES.title);
      expect(score.clef).toBe("treble");
      expect(score.keySignature).toBe(0);
      expect(score.timeSignature).toEqual({ beats: 4, beatUnit: 4 });
      expect(score.tempo).toBe(120);
      expect(score.measures).toHaveLength(1);
      expect(score.id).toBeDefined();
      expect(score.createdAt).toBeDefined();
      expect(score.updatedAt).toBeDefined();
    });

    it("should allow overriding defaults", () => {
      const score = createScore({
        title: "My Exercise",
        clef: "bass",
        tempo: 80,
      });
      expect(score.title).toBe("My Exercise");
      expect(score.clef).toBe("bass");
      expect(score.tempo).toBe(80);
    });
  });

  describe("createInitialState", () => {
    it("should create state with new score", () => {
      const state = createInitialState();
      expect(state.score).toBeDefined();
      expect(state.cursor).toEqual({ measureIndex: 0, noteIndex: 0 });
      expect(state.selectedDuration).toBe(DURATION.QUARTER);
      expect(state.selectedOctave).toBe(60); // Treble clef default
      expect(state.selectedNoteId).toBeNull();
      expect(state.isPlaying).toBe(false);
      expect(state.isDirty).toBe(false);
    });

    it("should use bass clef octave when appropriate", () => {
      const score = createScore({ clef: "bass" });
      const state = createInitialState(score);
      expect(state.selectedOctave).toBe(48); // Bass clef default
    });
  });

  describe("getBeatsPerMeasure", () => {
    it("should return 4 for 4/4", () => {
      expect(getBeatsPerMeasure({ beats: 4, beatUnit: 4 })).toBe(4);
    });

    it("should return 3 for 3/4", () => {
      expect(getBeatsPerMeasure({ beats: 3, beatUnit: 4 })).toBe(3);
    });

    it("should return 3 for 6/8", () => {
      // 6 eighth notes = 3 quarter notes
      expect(getBeatsPerMeasure({ beats: 6, beatUnit: 8 })).toBe(3);
    });

    it("should return 4 for 2/2", () => {
      // 2 half notes = 4 quarter notes
      expect(getBeatsPerMeasure({ beats: 2, beatUnit: 2 })).toBe(4);
    });
  });

  describe("validateMeasure", () => {
    it("should validate complete measure", () => {
      const measure = createMeasure();
      measure.notes = [
        createNote(60, DURATION.QUARTER),
        createNote(62, DURATION.QUARTER),
        createNote(64, DURATION.QUARTER),
        createNote(65, DURATION.QUARTER),
      ];
      const result = validateMeasure(measure, { beats: 4, beatUnit: 4 });
      expect(result.isComplete).toBe(true);
      expect(result.difference).toBeCloseTo(0);
    });

    it("should detect incomplete measure", () => {
      const measure = createMeasure();
      measure.notes = [createNote(60, DURATION.HALF)];
      const result = validateMeasure(measure, { beats: 4, beatUnit: 4 });
      expect(result.isComplete).toBe(false);
      expect(result.difference).toBeCloseTo(-2);
      expect(result.actualDuration).toBe(2);
      expect(result.expectedDuration).toBe(4);
    });

    it("should detect overfull measure", () => {
      const measure = createMeasure();
      measure.notes = [
        createNote(60, DURATION.WHOLE),
        createNote(62, DURATION.QUARTER),
      ];
      const result = validateMeasure(measure, { beats: 4, beatUnit: 4 });
      expect(result.isComplete).toBe(false);
      expect(result.difference).toBeCloseTo(1);
    });
  });

  describe("wouldOverflow", () => {
    it("should return false when note fits", () => {
      const measure = createMeasure();
      measure.notes = [createNote(60, DURATION.HALF)];
      expect(
        wouldOverflow(measure, DURATION.HALF, { beats: 4, beatUnit: 4 }),
      ).toBe(false);
    });

    it("should return true when note would overflow", () => {
      const measure = createMeasure();
      measure.notes = [createNote(60, DURATION.WHOLE)];
      expect(
        wouldOverflow(measure, DURATION.QUARTER, { beats: 4, beatUnit: 4 }),
      ).toBe(true);
    });
  });

  describe("formatTimeSignature", () => {
    it("should format time signature as string", () => {
      expect(formatTimeSignature({ beats: 4, beatUnit: 4 })).toBe("4/4");
      expect(formatTimeSignature({ beats: 3, beatUnit: 4 })).toBe("3/4");
      expect(formatTimeSignature({ beats: 6, beatUnit: 8 })).toBe("6/8");
    });
  });
});
