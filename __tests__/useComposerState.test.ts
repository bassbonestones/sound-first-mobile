/**
 * useComposerState Hook Tests
 *
 * Tests for the main composer state management hook.
 */

import { renderHook, act } from "@testing-library/react-native";
import { useComposerState } from "../src/features/composer/hooks/useComposerState";
import { createScore, DURATION } from "../src/features/composer/types";

describe("useComposerState", () => {
  describe("initialization", () => {
    it("should initialize with default score", () => {
      const { result } = renderHook(() => useComposerState());

      expect(result.current.score).toBeDefined();
      expect(result.current.score.title).toBe("Untitled");
      expect(result.current.score.clef).toBe("treble");
      expect(result.current.score.measures).toHaveLength(1);
      expect(result.current.cursor).toEqual({ measureIndex: 0, noteIndex: 0 });
      expect(result.current.isDirty).toBe(false);
    });

    it("should initialize with provided score", () => {
      const customScore = createScore({
        title: "Custom Exercise",
        clef: "bass",
        tempo: 80,
      });
      const { result } = renderHook(() => useComposerState(customScore));

      expect(result.current.score.title).toBe("Custom Exercise");
      expect(result.current.score.clef).toBe("bass");
      expect(result.current.score.tempo).toBe(80);
    });
  });

  describe("note insertion", () => {
    it("should insert a note at cursor position", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.insertNote("C");
      });

      expect(result.current.score.measures[0].notes).toHaveLength(1);
      expect(result.current.score.measures[0].notes[0].midi).toBeDefined();
      expect(result.current.score.measures[0].notes[0].duration).toBe(
        DURATION.QUARTER,
      );
      expect(result.current.cursor.noteIndex).toBe(1);
      expect(result.current.isDirty).toBe(true);
    });

    it("should move cursor after insertion", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.insertNote("C");
      });

      expect(result.current.cursor).toEqual({ measureIndex: 0, noteIndex: 1 });
    });

    it("should use selected duration", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.setDuration(DURATION.HALF);
      });

      act(() => {
        result.current.insertNote("D");
      });

      expect(result.current.score.measures[0].notes[0].duration).toBe(
        DURATION.HALF,
      );
    });

    it("should reject insertion that would overflow measure", () => {
      const { result } = renderHook(() => useComposerState());

      // Fill the measure
      act(() => {
        result.current.setDuration(DURATION.WHOLE);
        result.current.insertNote("C");
      });

      // Try to insert another note
      let insertResult: boolean = false;
      act(() => {
        insertResult = result.current.insertNote("D");
      });

      expect(insertResult).toBe(false);
      expect(result.current.score.measures[0].notes).toHaveLength(1);
    });
  });

  describe("rest insertion", () => {
    it("should insert a rest", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.insertRest();
      });

      expect(result.current.score.measures[0].notes[0].midi).toBeNull();
      expect(result.current.score.measures[0].notes[0].duration).toBe(
        DURATION.QUARTER,
      );
    });
  });

  describe("note deletion", () => {
    it("should delete selected note", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.insertNote("C");
      });

      act(() => {
        result.current.moveCursor("left");
      });

      act(() => {
        result.current.deleteNote();
      });

      expect(result.current.score.measures[0].notes).toHaveLength(0);
    });

    it("should return false when no note to delete", () => {
      const { result } = renderHook(() => useComposerState());

      let deleteResult: boolean = false;
      act(() => {
        deleteResult = result.current.deleteNote();
      });

      expect(deleteResult).toBe(false);
    });
  });

  describe("navigation", () => {
    it("should move cursor left and right", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.insertNote("C");
        result.current.insertNote("D");
      });

      expect(result.current.cursor.noteIndex).toBe(2);

      act(() => {
        result.current.moveCursor("left");
      });
      expect(result.current.cursor.noteIndex).toBe(1);

      act(() => {
        result.current.moveCursor("left");
      });
      expect(result.current.cursor.noteIndex).toBe(0);

      act(() => {
        result.current.moveCursor("right");
      });
      expect(result.current.cursor.noteIndex).toBe(1);
    });

    it("should move to start and end", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.insertNote("C");
        result.current.insertNote("D");
        result.current.moveCursor("start");
      });

      expect(result.current.cursor).toEqual({ measureIndex: 0, noteIndex: 0 });

      act(() => {
        result.current.moveCursor("end");
      });

      expect(result.current.cursor.noteIndex).toBe(2);
    });
  });

  describe("duration", () => {
    it("should set selected duration", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.setDuration(DURATION.HALF);
      });

      expect(result.current.state.selectedDuration).toBe(DURATION.HALF);
    });

    it("should change duration of selected note", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.insertNote("C");
      });

      act(() => {
        result.current.moveCursor("left");
      });

      act(() => {
        result.current.changeDurationOfSelected(DURATION.HALF);
      });

      expect(result.current.score.measures[0].notes[0].duration).toBe(
        DURATION.HALF,
      );
    });
  });

  describe("measure operations", () => {
    it("should add a new measure", () => {
      const { result } = renderHook(() => useComposerState());

      expect(result.current.score.measures).toHaveLength(1);

      act(() => {
        result.current.addMeasure();
      });

      expect(result.current.score.measures).toHaveLength(2);
      expect(result.current.cursor.measureIndex).toBe(1);
    });

    it("should delete current measure", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.addMeasure();
      });

      act(() => {
        result.current.deleteMeasure();
      });

      expect(result.current.score.measures).toHaveLength(1);
    });

    it("should not delete last measure", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.deleteMeasure();
      });

      expect(result.current.score.measures).toHaveLength(1);
    });
  });

  describe("measure validation", () => {
    it("should validate incomplete measure", () => {
      const { result } = renderHook(() => useComposerState());

      expect(result.current.currentMeasureValidation.isComplete).toBe(false);
      expect(result.current.currentMeasureValidation.actualDuration).toBe(0);
      expect(result.current.currentMeasureValidation.expectedDuration).toBe(4);
    });

    it("should validate complete measure", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.setDuration(DURATION.WHOLE);
      });

      act(() => {
        result.current.insertNote("C");
      });

      expect(result.current.currentMeasureValidation.isComplete).toBe(true);
    });
  });

  describe("score settings", () => {
    it("should change clef", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.setClef("bass");
      });

      expect(result.current.score.clef).toBe("bass");
      expect(result.current.state.selectedOctave).toBe(48); // Bass clef octave
    });

    it("should change key signature", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.setKeySignature(2);
      });

      expect(result.current.score.keySignature).toBe(2);
    });

    it("should change time signature", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.setTimeSignature({ beats: 3, beatUnit: 4 });
      });

      expect(result.current.score.timeSignature).toEqual({
        beats: 3,
        beatUnit: 4,
      });
    });

    it("should change tempo", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.setTempo(100);
      });

      expect(result.current.score.tempo).toBe(100);
    });

    it("should change title", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.setTitle("My Exercise");
      });

      expect(result.current.score.title).toBe("My Exercise");
    });
  });

  describe("undo/redo", () => {
    it("should undo note insertion", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.insertNote("C");
      });

      expect(result.current.score.measures[0].notes).toHaveLength(1);
      expect(result.current.canUndo).toBe(true);

      act(() => {
        result.current.undo();
      });

      expect(result.current.score.measures[0].notes).toHaveLength(0);
      expect(result.current.canRedo).toBe(true);
    });

    it("should redo undone action", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.insertNote("C");
      });

      act(() => {
        result.current.undo();
      });

      act(() => {
        result.current.redo();
      });

      expect(result.current.score.measures[0].notes).toHaveLength(1);
    });

    it("should clear redo stack on new action", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.insertNote("C");
      });

      act(() => {
        result.current.undo();
      });

      act(() => {
        result.current.insertNote("D");
      });

      expect(result.current.canRedo).toBe(false);
    });
  });

  describe("score management", () => {
    it("should create new score", () => {
      const { result } = renderHook(() => useComposerState());

      const originalId = result.current.score.id;

      act(() => {
        result.current.insertNote("C");
      });

      act(() => {
        result.current.newScore();
      });

      expect(result.current.score.id).not.toBe(originalId);
      expect(result.current.score.measures[0].notes).toHaveLength(0);
      expect(result.current.isDirty).toBe(false);
    });

    it("should load score", () => {
      const { result } = renderHook(() => useComposerState());

      const customScore = createScore({ title: "Loaded Score" });

      act(() => {
        result.current.loadScore(customScore);
      });

      expect(result.current.score.title).toBe("Loaded Score");
      expect(result.current.isDirty).toBe(false);
    });

    it("should get current score", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.setTitle("Test");
      });

      const score = result.current.getScore();
      expect(score.title).toBe("Test");
    });

    it("should track dirty state", () => {
      const { result } = renderHook(() => useComposerState());

      expect(result.current.isDirty).toBe(false);

      act(() => {
        result.current.insertNote("C");
      });

      expect(result.current.isDirty).toBe(true);

      act(() => {
        result.current.markClean();
      });

      expect(result.current.isDirty).toBe(false);
    });
  });

  describe("pitch operations", () => {
    it("should change selectedOctave when no note is selected", () => {
      const { result } = renderHook(() => useComposerState());

      // Initially at octave 4 (MIDI 60) for treble clef
      expect(result.current.state.selectedOctave).toBe(60);
      expect(result.current.selectedNote).toBeNull();

      act(() => {
        result.current.changeOctave("up");
      });

      // Should now be at octave 5 (MIDI 72)
      expect(result.current.state.selectedOctave).toBe(72);

      act(() => {
        result.current.changeOctave("down");
      });

      // Should be back at octave 4 (MIDI 60)
      expect(result.current.state.selectedOctave).toBe(60);
    });

    it("should change pitch of selected note", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.insertNote("C");
        result.current.moveCursor("left");
      });

      const originalMidi = result.current.selectedNote?.midi;

      act(() => {
        result.current.changePitch("up");
      });

      expect(result.current.selectedNote?.midi).toBeGreaterThan(originalMidi!);
    });

    it("should change octave of selected note", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.insertNote("C");
        result.current.moveCursor("left");
      });

      const originalMidi = result.current.selectedNote?.midi;

      act(() => {
        result.current.changeOctave("up");
      });

      expect(result.current.selectedNote?.midi).toBe(originalMidi! + 12);
    });

    it("should apply accidental to selected note", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.insertNote("C");
      });

      act(() => {
        result.current.moveCursor("left");
      });

      act(() => {
        result.current.applyAccidental("sharp");
      });

      expect(result.current.selectedNote?.accidental).toBe("sharp");
    });

    it("should remove accidental", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.insertNote("C");
      });

      act(() => {
        result.current.moveCursor("left");
      });

      act(() => {
        result.current.applyAccidental("sharp");
      });

      act(() => {
        result.current.applyAccidental(undefined);
      });

      expect(result.current.selectedNote?.accidental).toBeUndefined();
    });
  });

  describe("ties", () => {
    it("should toggle tie on selected note", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.insertNote("C");
      });

      act(() => {
        result.current.moveCursor("left");
      });

      act(() => {
        result.current.toggleTie();
      });

      expect(result.current.selectedNote?.tieStart).toBe(true);

      act(() => {
        result.current.toggleTie();
      });

      expect(result.current.selectedNote?.tieStart).toBe(false);
    });
  });
});
