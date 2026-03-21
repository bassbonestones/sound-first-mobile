/**
 * useComposerUndo Tests
 *
 * Tests for the composer undo/redo hook and action reversal helpers.
 */

import { renderHook, act } from "@testing-library/react-native";

import {
  useComposerUndo,
  reverseAction,
  reapplyAction,
} from "../src/features/composer/hooks/useComposerUndo";
import {
  createScore,
  createMeasure,
  createNote,
  DURATION,
  type ComposerAction,
  type ComposerScore,
} from "../src/features/composer/types";

// =============================================================================
// useComposerUndo Hook Tests
// =============================================================================

describe("useComposerUndo", () => {
  const createTestAction = (type: string = "INSERT_NOTE"): ComposerAction => ({
    type: "INSERT_NOTE",
    note: createNote(60, DURATION.QUARTER),
    position: { measureIndex: 0, noteIndex: 0 },
  });

  describe("initial state", () => {
    it("should start with empty stacks", () => {
      const { result } = renderHook(() => useComposerUndo());

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.undoCount).toBe(0);
      expect(result.current.redoCount).toBe(0);
    });
  });

  describe("pushAction", () => {
    it("should enable canUndo after pushing action", () => {
      const { result } = renderHook(() => useComposerUndo());

      act(() => {
        result.current.pushAction(createTestAction());
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.undoCount).toBe(1);
    });

    it("should increment undoCount for each action", () => {
      const { result } = renderHook(() => useComposerUndo());

      act(() => {
        result.current.pushAction(createTestAction());
        result.current.pushAction(createTestAction());
        result.current.pushAction(createTestAction());
      });

      expect(result.current.undoCount).toBe(3);
    });

    it("should clear redo stack on new action", () => {
      const { result } = renderHook(() => useComposerUndo());

      // Push action, undo it, then push redo
      act(() => {
        result.current.pushAction(createTestAction());
      });

      act(() => {
        const action = result.current.popUndo();
        if (action) result.current.pushRedo(action);
      });

      expect(result.current.canRedo).toBe(true);

      // Push new action - should clear redo
      act(() => {
        result.current.pushAction(createTestAction());
      });

      expect(result.current.canRedo).toBe(false);
      expect(result.current.redoCount).toBe(0);
    });

    it("should respect maxSize limit", () => {
      const { result } = renderHook(() => useComposerUndo(3));

      act(() => {
        result.current.pushAction(createTestAction());
        result.current.pushAction(createTestAction());
        result.current.pushAction(createTestAction());
        result.current.pushAction(createTestAction());
        result.current.pushAction(createTestAction());
      });

      // Should be capped at 3
      expect(result.current.undoCount).toBe(3);
    });
  });

  describe("popUndo", () => {
    it("should return null when stack is empty", () => {
      const { result } = renderHook(() => useComposerUndo());

      let poppedAction: ComposerAction | null = null;
      act(() => {
        poppedAction = result.current.popUndo();
      });

      expect(poppedAction).toBeNull();
    });

    it("should return the most recent action", () => {
      const { result } = renderHook(() => useComposerUndo());

      const action1 = createTestAction();
      const action2: ComposerAction = {
        type: "CHANGE_TEMPO",
        previousTempo: 100,
        newTempo: 120,
      };

      act(() => {
        result.current.pushAction(action1);
        result.current.pushAction(action2);
      });

      let poppedAction: ComposerAction | null = null;
      act(() => {
        poppedAction = result.current.popUndo();
      });

      expect(poppedAction).toEqual(action2);
    });

    it("should decrement undoCount after pop", () => {
      const { result } = renderHook(() => useComposerUndo());

      act(() => {
        result.current.pushAction(createTestAction());
        result.current.pushAction(createTestAction());
      });

      expect(result.current.undoCount).toBe(2);

      act(() => {
        result.current.popUndo();
      });

      expect(result.current.undoCount).toBe(1);
    });

    it("should disable canUndo when last action is popped", () => {
      const { result } = renderHook(() => useComposerUndo());

      act(() => {
        result.current.pushAction(createTestAction());
      });

      act(() => {
        result.current.popUndo();
      });

      expect(result.current.canUndo).toBe(false);
    });
  });

  describe("pushRedo", () => {
    it("should enable canRedo after pushing", () => {
      const { result } = renderHook(() => useComposerUndo());

      act(() => {
        result.current.pushRedo(createTestAction());
      });

      expect(result.current.canRedo).toBe(true);
      expect(result.current.redoCount).toBe(1);
    });

    it("should respect maxSize limit", () => {
      const { result } = renderHook(() => useComposerUndo(2));

      act(() => {
        result.current.pushRedo(createTestAction());
        result.current.pushRedo(createTestAction());
        result.current.pushRedo(createTestAction());
      });

      expect(result.current.redoCount).toBe(2);
    });
  });

  describe("popRedo", () => {
    it("should return null when stack is empty", () => {
      const { result } = renderHook(() => useComposerUndo());

      let poppedAction: ComposerAction | null = null;
      act(() => {
        poppedAction = result.current.popRedo();
      });

      expect(poppedAction).toBeNull();
    });

    it("should return the most recent redo action", () => {
      const { result } = renderHook(() => useComposerUndo());

      const action: ComposerAction = {
        type: "CHANGE_TEMPO",
        previousTempo: 100,
        newTempo: 120,
      };

      act(() => {
        result.current.pushRedo(action);
      });

      let poppedAction: ComposerAction | null = null;
      act(() => {
        poppedAction = result.current.popRedo();
      });

      expect(poppedAction).toEqual(action);
    });

    it("should decrement redoCount after pop", () => {
      const { result } = renderHook(() => useComposerUndo());

      act(() => {
        result.current.pushRedo(createTestAction());
        result.current.pushRedo(createTestAction());
      });

      expect(result.current.redoCount).toBe(2);

      act(() => {
        result.current.popRedo();
      });

      expect(result.current.redoCount).toBe(1);
    });
  });

  describe("clearHistory", () => {
    it("should clear both stacks", () => {
      const { result } = renderHook(() => useComposerUndo());

      act(() => {
        result.current.pushAction(createTestAction());
        result.current.pushAction(createTestAction());
        result.current.pushRedo(createTestAction());
      });

      expect(result.current.undoCount).toBe(2);
      expect(result.current.redoCount).toBe(1);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.undoCount).toBe(0);
      expect(result.current.redoCount).toBe(0);
    });
  });

  describe("undo/redo workflow", () => {
    it("should support full undo/redo cycle", () => {
      const { result } = renderHook(() => useComposerUndo());

      const action1 = createTestAction();
      const action2: ComposerAction = {
        type: "CHANGE_TEMPO",
        previousTempo: 100,
        newTempo: 120,
      };

      // Push two actions
      act(() => {
        result.current.pushAction(action1);
        result.current.pushAction(action2);
      });

      expect(result.current.undoCount).toBe(2);
      expect(result.current.redoCount).toBe(0);

      // Undo action2, push to redo
      let undone: ComposerAction | null = null;
      act(() => {
        undone = result.current.popUndo();
        if (undone) result.current.pushRedo(undone);
      });

      expect(undone).toEqual(action2);
      expect(result.current.undoCount).toBe(1);
      expect(result.current.redoCount).toBe(1);

      // Redo action2
      let redone: ComposerAction | null = null;
      act(() => {
        redone = result.current.popRedo();
        if (redone) result.current.pushAction(redone);
      });

      expect(redone).toEqual(action2);
      expect(result.current.undoCount).toBe(2);
      expect(result.current.redoCount).toBe(0);
    });
  });
});

// =============================================================================
// reverseAction Tests
// =============================================================================

describe("reverseAction", () => {
  const createTestScore = (): ComposerScore => {
    const score = createScore();
    const measure = createMeasure();
    measure.notes = [
      createNote(60, DURATION.QUARTER),
      createNote(62, DURATION.QUARTER),
    ];
    score.measures = [measure];
    return score;
  };

  describe("INSERT_NOTE", () => {
    it("should remove the inserted note", () => {
      const score = createTestScore();
      const note = createNote(64, DURATION.HALF);
      score.measures[0].notes.push(note);

      const action: ComposerAction = {
        type: "INSERT_NOTE",
        note,
        position: { measureIndex: 0, noteIndex: 2 },
      };

      const result = reverseAction(score, action);

      expect(result.measures[0].notes).toHaveLength(2);
      expect(
        result.measures[0].notes.find((n) => n.id === note.id),
      ).toBeUndefined();
    });

    it("should handle invalid measure index gracefully", () => {
      const score = createTestScore();
      const action: ComposerAction = {
        type: "INSERT_NOTE",
        note: createNote(64, DURATION.HALF),
        position: { measureIndex: 99, noteIndex: 0 },
      };

      const result = reverseAction(score, action);

      // Should return score unchanged
      expect(result.measures[0].notes).toHaveLength(2);
    });
  });

  describe("DELETE_NOTE", () => {
    it("should restore the deleted note", () => {
      const score = createTestScore();
      const deletedNote = createNote(64, DURATION.HALF);

      const action: ComposerAction = {
        type: "DELETE_NOTE",
        deletedNote,
        position: { measureIndex: 0, noteIndex: 1 },
      };

      const result = reverseAction(score, action);

      expect(result.measures[0].notes).toHaveLength(3);
      expect(result.measures[0].notes[1]).toEqual(deletedNote);
    });

    it("should handle invalid measure index gracefully", () => {
      const score = createTestScore();
      const action: ComposerAction = {
        type: "DELETE_NOTE",
        deletedNote: createNote(64, DURATION.HALF),
        position: { measureIndex: 99, noteIndex: 0 },
      };

      const result = reverseAction(score, action);

      expect(result.measures[0].notes).toHaveLength(2);
    });
  });

  describe("CHANGE_PITCH", () => {
    it("should restore the previous pitch", () => {
      const score = createTestScore();
      const noteId = score.measures[0].notes[0].id;
      score.measures[0].notes[0].midi = 72; // Changed pitch

      const action: ComposerAction = {
        type: "CHANGE_PITCH",
        noteId,
        previousMidi: 60,
        newMidi: 72,
        position: { measureIndex: 0, noteIndex: 0 },
      };

      const result = reverseAction(score, action);

      expect(result.measures[0].notes[0].midi).toBe(60);
    });
  });

  describe("CHANGE_DURATION", () => {
    it("should restore the previous duration", () => {
      const score = createTestScore();
      const noteId = score.measures[0].notes[0].id;
      score.measures[0].notes[0].duration = DURATION.HALF;

      const action: ComposerAction = {
        type: "CHANGE_DURATION",
        noteId,
        previousDuration: DURATION.QUARTER,
        newDuration: DURATION.HALF,
        position: { measureIndex: 0, noteIndex: 0 },
      };

      const result = reverseAction(score, action);

      expect(result.measures[0].notes[0].duration).toBe(DURATION.QUARTER);
    });
  });

  describe("APPLY_ACCIDENTAL", () => {
    it("should restore the previous accidental and MIDI", () => {
      const score = createTestScore();
      const noteId = score.measures[0].notes[0].id;
      score.measures[0].notes[0].accidental = "sharp";
      score.measures[0].notes[0].midi = 61;

      const action: ComposerAction = {
        type: "APPLY_ACCIDENTAL",
        noteId,
        previousAccidental: undefined,
        newAccidental: "sharp",
        previousMidi: 60,
        newMidi: 61,
        position: { measureIndex: 0, noteIndex: 0 },
      };

      const result = reverseAction(score, action);

      expect(result.measures[0].notes[0].accidental).toBeUndefined();
      expect(result.measures[0].notes[0].midi).toBe(60);
    });
  });

  describe("TOGGLE_TIE", () => {
    it("should restore the previous tie start value", () => {
      const score = createTestScore();
      const noteId = score.measures[0].notes[0].id;
      score.measures[0].notes[0].tieStart = true;

      const action: ComposerAction = {
        type: "TOGGLE_TIE",
        noteId,
        tieType: "start",
        previousValue: false,
        newValue: true,
        position: { measureIndex: 0, noteIndex: 0 },
      };

      const result = reverseAction(score, action);

      expect(result.measures[0].notes[0].tieStart).toBe(false);
    });

    it("should restore the previous tie end value", () => {
      const score = createTestScore();
      const noteId = score.measures[0].notes[0].id;
      score.measures[0].notes[0].tieEnd = true;

      const action: ComposerAction = {
        type: "TOGGLE_TIE",
        noteId,
        tieType: "end",
        previousValue: false,
        newValue: true,
        position: { measureIndex: 0, noteIndex: 0 },
      };

      const result = reverseAction(score, action);

      expect(result.measures[0].notes[0].tieEnd).toBe(false);
    });
  });

  describe("ADD_MEASURE", () => {
    it("should remove the added measure", () => {
      const score = createTestScore();
      const addedMeasure = createMeasure();
      score.measures.push(addedMeasure);

      const action: ComposerAction = {
        type: "ADD_MEASURE",
        measure: addedMeasure,
        measureIndex: 1,
      };

      const result = reverseAction(score, action);

      expect(result.measures).toHaveLength(1);
    });
  });

  describe("DELETE_MEASURE", () => {
    it("should restore the deleted measure", () => {
      const score = createTestScore();
      const deletedMeasure = createMeasure();
      deletedMeasure.notes = [createNote(65, DURATION.WHOLE)];

      const action: ComposerAction = {
        type: "DELETE_MEASURE",
        deletedMeasure,
        measureIndex: 1,
      };

      const result = reverseAction(score, action);

      expect(result.measures).toHaveLength(2);
      expect(result.measures[1]).toEqual(deletedMeasure);
    });
  });

  describe("metadata changes", () => {
    it("should restore previous clef", () => {
      const score = createTestScore();
      score.clef = "bass";

      const action: ComposerAction = {
        type: "CHANGE_CLEF",
        previousClef: "treble",
        newClef: "bass",
      };

      const result = reverseAction(score, action);

      expect(result.clef).toBe("treble");
    });

    it("should restore previous key signature", () => {
      const score = createTestScore();
      score.keySignature = 2;

      const action: ComposerAction = {
        type: "CHANGE_KEY_SIGNATURE",
        previousKey: 0,
        newKey: 2,
      };

      const result = reverseAction(score, action);

      expect(result.keySignature).toBe(0);
    });

    it("should restore previous time signature", () => {
      const score = createTestScore();
      score.timeSignature = { beats: 3, beatUnit: 4 };

      const action: ComposerAction = {
        type: "CHANGE_TIME_SIGNATURE",
        previousTimeSig: { beats: 4, beatUnit: 4 },
        newTimeSig: { beats: 3, beatUnit: 4 },
      };

      const result = reverseAction(score, action);

      expect(result.timeSignature).toEqual({ beats: 4, beatUnit: 4 });
    });

    it("should restore previous tempo", () => {
      const score = createTestScore();
      score.tempo = 140;

      const action: ComposerAction = {
        type: "CHANGE_TEMPO",
        previousTempo: 120,
        newTempo: 140,
      };

      const result = reverseAction(score, action);

      expect(result.tempo).toBe(120);
    });

    it("should restore previous title", () => {
      const score = createTestScore();
      score.title = "New Title";

      const action: ComposerAction = {
        type: "CHANGE_TITLE",
        previousTitle: "Old Title",
        newTitle: "New Title",
      };

      const result = reverseAction(score, action);

      expect(result.title).toBe("Old Title");
    });
  });

  describe("unknown action type", () => {
    it("should return score unchanged for unknown action type", () => {
      const score = createTestScore();

      // Use type assertion to create an unknown action type
      const action = { type: "UNKNOWN_ACTION" } as unknown as ComposerAction;

      const result = reverseAction(score, action);

      // Measures should be unchanged
      expect(result.measures).toEqual(score.measures);
    });
  });
});

// =============================================================================
// reapplyAction Tests
// =============================================================================

describe("reapplyAction", () => {
  const createTestScore = (): ComposerScore => {
    const score = createScore();
    const measure = createMeasure();
    measure.notes = [createNote(60, DURATION.QUARTER)];
    score.measures = [measure];
    return score;
  };

  describe("INSERT_NOTE", () => {
    it("should insert the note", () => {
      const score = createTestScore();
      const note = createNote(64, DURATION.HALF);

      const action: ComposerAction = {
        type: "INSERT_NOTE",
        note,
        position: { measureIndex: 0, noteIndex: 1 },
      };

      const result = reapplyAction(score, action);

      expect(result.measures[0].notes).toHaveLength(2);
      expect(result.measures[0].notes[1]).toEqual(note);
    });
  });

  describe("DELETE_NOTE", () => {
    it("should delete the note", () => {
      const score = createTestScore();
      const deletedNote = score.measures[0].notes[0];

      const action: ComposerAction = {
        type: "DELETE_NOTE",
        deletedNote,
        position: { measureIndex: 0, noteIndex: 0 },
      };

      const result = reapplyAction(score, action);

      expect(result.measures[0].notes).toHaveLength(0);
    });
  });

  describe("CHANGE_PITCH", () => {
    it("should apply the new pitch", () => {
      const score = createTestScore();
      const noteId = score.measures[0].notes[0].id;

      const action: ComposerAction = {
        type: "CHANGE_PITCH",
        noteId,
        previousMidi: 60,
        newMidi: 72,
        position: { measureIndex: 0, noteIndex: 0 },
      };

      const result = reapplyAction(score, action);

      expect(result.measures[0].notes[0].midi).toBe(72);
    });
  });

  describe("CHANGE_DURATION", () => {
    it("should apply the new duration", () => {
      const score = createTestScore();
      const noteId = score.measures[0].notes[0].id;

      const action: ComposerAction = {
        type: "CHANGE_DURATION",
        noteId,
        previousDuration: DURATION.QUARTER,
        newDuration: DURATION.HALF,
        position: { measureIndex: 0, noteIndex: 0 },
      };

      const result = reapplyAction(score, action);

      expect(result.measures[0].notes[0].duration).toBe(DURATION.HALF);
    });
  });

  describe("APPLY_ACCIDENTAL", () => {
    it("should apply the new accidental and MIDI", () => {
      const score = createTestScore();
      const noteId = score.measures[0].notes[0].id;

      const action: ComposerAction = {
        type: "APPLY_ACCIDENTAL",
        noteId,
        previousAccidental: undefined,
        newAccidental: "sharp",
        previousMidi: 60,
        newMidi: 61,
        position: { measureIndex: 0, noteIndex: 0 },
      };

      const result = reapplyAction(score, action);

      expect(result.measures[0].notes[0].accidental).toBe("sharp");
      expect(result.measures[0].notes[0].midi).toBe(61);
    });
  });

  describe("TOGGLE_TIE", () => {
    it("should apply the new tie start value", () => {
      const score = createTestScore();
      const noteId = score.measures[0].notes[0].id;

      const action: ComposerAction = {
        type: "TOGGLE_TIE",
        noteId,
        tieType: "start",
        previousValue: false,
        newValue: true,
        position: { measureIndex: 0, noteIndex: 0 },
      };

      const result = reapplyAction(score, action);

      expect(result.measures[0].notes[0].tieStart).toBe(true);
    });

    it("should apply the new tie end value", () => {
      const score = createTestScore();
      const noteId = score.measures[0].notes[0].id;

      const action: ComposerAction = {
        type: "TOGGLE_TIE",
        noteId,
        tieType: "end",
        previousValue: false,
        newValue: true,
        position: { measureIndex: 0, noteIndex: 0 },
      };

      const result = reapplyAction(score, action);

      expect(result.measures[0].notes[0].tieEnd).toBe(true);
    });
  });

  describe("ADD_MEASURE", () => {
    it("should add the measure", () => {
      const score = createTestScore();
      const newMeasure = createMeasure();

      const action: ComposerAction = {
        type: "ADD_MEASURE",
        measure: newMeasure,
        measureIndex: 1,
      };

      const result = reapplyAction(score, action);

      expect(result.measures).toHaveLength(2);
    });
  });

  describe("DELETE_MEASURE", () => {
    it("should delete the measure", () => {
      const score = createTestScore();
      score.measures.push(createMeasure());
      const deletedMeasure = score.measures[1];

      const action: ComposerAction = {
        type: "DELETE_MEASURE",
        deletedMeasure,
        measureIndex: 1,
      };

      const result = reapplyAction(score, action);

      expect(result.measures).toHaveLength(1);
    });
  });

  describe("metadata changes", () => {
    it("should apply new clef", () => {
      const score = createTestScore();

      const action: ComposerAction = {
        type: "CHANGE_CLEF",
        previousClef: "treble",
        newClef: "bass",
      };

      const result = reapplyAction(score, action);

      expect(result.clef).toBe("bass");
    });

    it("should apply new key signature", () => {
      const score = createTestScore();

      const action: ComposerAction = {
        type: "CHANGE_KEY_SIGNATURE",
        previousKey: 0,
        newKey: 3,
      };

      const result = reapplyAction(score, action);

      expect(result.keySignature).toBe(3);
    });

    it("should apply new time signature", () => {
      const score = createTestScore();

      const action: ComposerAction = {
        type: "CHANGE_TIME_SIGNATURE",
        previousTimeSig: { beats: 4, beatUnit: 4 },
        newTimeSig: { beats: 6, beatUnit: 8 },
      };

      const result = reapplyAction(score, action);

      expect(result.timeSignature).toEqual({ beats: 6, beatUnit: 8 });
    });

    it("should apply new tempo", () => {
      const score = createTestScore();

      const action: ComposerAction = {
        type: "CHANGE_TEMPO",
        previousTempo: 120,
        newTempo: 180,
      };

      const result = reapplyAction(score, action);

      expect(result.tempo).toBe(180);
    });

    it("should apply new title", () => {
      const score = createTestScore();

      const action: ComposerAction = {
        type: "CHANGE_TITLE",
        previousTitle: "Old",
        newTitle: "New",
      };

      const result = reapplyAction(score, action);

      expect(result.title).toBe("New");
    });
  });

  describe("unknown action type", () => {
    it("should return score unchanged for unknown action type", () => {
      const score = createTestScore();

      const action = { type: "UNKNOWN_ACTION" } as unknown as ComposerAction;

      const result = reapplyAction(score, action);

      expect(result.measures).toEqual(score.measures);
    });
  });
});
