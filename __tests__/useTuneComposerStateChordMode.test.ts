/**
 * useTuneComposerState Chord Mode Tests
 *
 * Tests for chord mode functionality in the tune composer state hook.
 */

import { renderHook, act } from "@testing-library/react-native";
import { useTuneComposerState } from "../src/features/tune-composer/hooks/useTuneComposerState";
import { createScore } from "../src/features/tune-composer/types";

describe("useTuneComposerState - Chord Mode", () => {
  describe("chord mode toggle", () => {
    it("should initialize with chord mode off", () => {
      const { result } = renderHook(() => useTuneComposerState());

      expect(result.current.chordMode).toBe(false);
      expect(result.current.chordCursor).toBeNull();
    });

    it("should enable chord mode and set cursor to first beat", () => {
      const { result } = renderHook(() => useTuneComposerState());

      act(() => {
        result.current.toggleChordMode();
      });

      expect(result.current.chordMode).toBe(true);
      expect(result.current.chordCursor).toEqual({
        measureIndex: 0,
        beatPosition: 0,
      });
    });

    it("should disable chord mode and clear cursor", () => {
      const { result } = renderHook(() => useTuneComposerState());

      // Enable first
      act(() => {
        result.current.toggleChordMode();
      });
      expect(result.current.chordMode).toBe(true);

      // Then disable
      act(() => {
        result.current.toggleChordMode();
      });
      expect(result.current.chordMode).toBe(false);
      expect(result.current.chordCursor).toBeNull();
    });
  });

  describe("chord cursor navigation", () => {
    it("should move cursor to next beat within measure", () => {
      const { result } = renderHook(() => useTuneComposerState());

      act(() => {
        result.current.toggleChordMode();
      });

      act(() => {
        result.current.moveChordCursorNext();
      });

      expect(result.current.chordCursor).toEqual({
        measureIndex: 0,
        beatPosition: 1,
      });
    });

    it("should move cursor to next measure when at end of current", () => {
      const { result } = renderHook(() => useTuneComposerState());

      // Add a second measure
      act(() => {
        result.current.addMeasure();
      });

      act(() => {
        result.current.toggleChordMode();
      });

      // Move through all 4 beats of first measure
      for (let i = 0; i < 4; i++) {
        act(() => {
          result.current.moveChordCursorNext();
        });
      }

      // Should be at measure 1, beat 0
      expect(result.current.chordCursor).toEqual({
        measureIndex: 1,
        beatPosition: 0,
      });
    });

    it("should not move past last beat of last measure", () => {
      const { result } = renderHook(() => useTuneComposerState());

      act(() => {
        result.current.toggleChordMode();
      });

      // Move to end of first (only) measure
      for (let i = 0; i < 3; i++) {
        act(() => {
          result.current.moveChordCursorNext();
        });
      }
      expect(result.current.chordCursor?.beatPosition).toBe(3);

      // Try to move past end
      act(() => {
        result.current.moveChordCursorNext();
      });

      // Should stay at beat 3
      expect(result.current.chordCursor).toEqual({
        measureIndex: 0,
        beatPosition: 3,
      });
    });

    it("should move cursor to previous beat", () => {
      const { result } = renderHook(() => useTuneComposerState());

      act(() => {
        result.current.toggleChordMode();
      });

      // Move forward first
      act(() => {
        result.current.moveChordCursorNext();
        result.current.moveChordCursorNext();
      });

      expect(result.current.chordCursor?.beatPosition).toBe(2);

      // Move back
      act(() => {
        result.current.moveChordCursorPrev();
      });

      expect(result.current.chordCursor).toEqual({
        measureIndex: 0,
        beatPosition: 1,
      });
    });

    it("should move to previous measure when at first beat", () => {
      const { result } = renderHook(() => useTuneComposerState());

      // Add a second measure
      act(() => {
        result.current.addMeasure();
      });

      act(() => {
        result.current.toggleChordMode();
      });

      // Move to second measure
      for (let i = 0; i < 4; i++) {
        act(() => {
          result.current.moveChordCursorNext();
        });
      }

      expect(result.current.chordCursor?.measureIndex).toBe(1);

      // Move back to previous measure
      act(() => {
        result.current.moveChordCursorPrev();
      });

      expect(result.current.chordCursor).toEqual({
        measureIndex: 0,
        beatPosition: 3,
      });
    });

    it("should not move before first beat of first measure", () => {
      const { result } = renderHook(() => useTuneComposerState());

      act(() => {
        result.current.toggleChordMode();
      });

      act(() => {
        result.current.moveChordCursorPrev();
      });

      // Should stay at beat 0
      expect(result.current.chordCursor).toEqual({
        measureIndex: 0,
        beatPosition: 0,
      });
    });
  });

  describe("canGoPrev and canGoNext", () => {
    it("should report canGoPrev=false at beginning", () => {
      const { result } = renderHook(() => useTuneComposerState());

      act(() => {
        result.current.toggleChordMode();
      });

      expect(result.current.canChordCursorGoPrev).toBe(false);
    });

    it("should report canGoPrev=true when not at beginning", () => {
      const { result } = renderHook(() => useTuneComposerState());

      act(() => {
        result.current.toggleChordMode();
      });

      act(() => {
        result.current.moveChordCursorNext();
      });

      expect(result.current.canChordCursorGoPrev).toBe(true);
    });

    it("should report canGoNext=false at end of last measure", () => {
      const { result } = renderHook(() => useTuneComposerState());

      act(() => {
        result.current.toggleChordMode();
      });

      // Move to end
      for (let i = 0; i < 3; i++) {
        act(() => {
          result.current.moveChordCursorNext();
        });
      }

      expect(result.current.canChordCursorGoNext).toBe(false);
    });

    it("should report canGoNext=true when not at end", () => {
      const { result } = renderHook(() => useTuneComposerState());

      act(() => {
        result.current.toggleChordMode();
      });

      expect(result.current.canChordCursorGoNext).toBe(true);
    });
  });

  describe("chord CRUD operations", () => {
    it("should set chord at current position", () => {
      const { result } = renderHook(() => useTuneComposerState());

      act(() => {
        result.current.toggleChordMode();
      });

      act(() => {
        result.current.setChordAtCursor("Cmaj7");
      });

      expect(result.current.currentChordSymbol).toBe("Cmaj7");
      expect(result.current.activeProgression?.chords).toHaveLength(1);
      expect(result.current.activeProgression?.chords[0].symbol).toBe("Cmaj7");
      expect(result.current.activeProgression?.chords[0].measureIndex).toBe(0);
      expect(result.current.activeProgression?.chords[0].beatPosition).toBe(0);
    });

    it("should update existing chord at position", () => {
      const { result } = renderHook(() => useTuneComposerState());

      act(() => {
        result.current.toggleChordMode();
      });

      // Set initial chord
      act(() => {
        result.current.setChordAtCursor("Cmaj7");
      });

      // Update chord
      act(() => {
        result.current.setChordAtCursor("Dm7");
      });

      expect(result.current.currentChordSymbol).toBe("Dm7");
      // Should still have only one chord (updated, not added)
      expect(result.current.activeProgression?.chords).toHaveLength(1);
    });

    it("should remove chord at current position", () => {
      const { result } = renderHook(() => useTuneComposerState());

      act(() => {
        result.current.toggleChordMode();
      });

      act(() => {
        result.current.setChordAtCursor("G7");
      });

      expect(result.current.currentChordSymbol).toBe("G7");

      act(() => {
        result.current.removeChordAtCursor();
      });

      expect(result.current.currentChordSymbol).toBe("");
      expect(result.current.activeProgression?.chords).toHaveLength(0);
    });

    it("should add multiple chords at different positions", () => {
      const { result } = renderHook(() => useTuneComposerState());

      act(() => {
        result.current.toggleChordMode();
      });

      // Add C at beat 0
      act(() => {
        result.current.setChordAtCursor("C");
      });

      // Move to beat 2 and add Am
      act(() => {
        result.current.moveChordCursorNext();
        result.current.moveChordCursorNext();
      });

      act(() => {
        result.current.setChordAtCursor("Am");
      });

      expect(result.current.activeProgression?.chords).toHaveLength(2);

      // Check first chord
      const firstChord = result.current.activeProgression?.chords.find(
        (c) => c.beatPosition === 0,
      );
      expect(firstChord?.symbol).toBe("C");

      // Check second chord
      const secondChord = result.current.activeProgression?.chords.find(
        (c) => c.beatPosition === 2,
      );
      expect(secondChord?.symbol).toBe("Am");
    });
  });

  describe("currentChordSymbol", () => {
    it("should return empty string when no chord at position", () => {
      const { result } = renderHook(() => useTuneComposerState());

      act(() => {
        result.current.toggleChordMode();
      });

      expect(result.current.currentChordSymbol).toBe("");
    });

    it("should return chord symbol when chord exists at position", () => {
      const { result } = renderHook(() => useTuneComposerState());

      act(() => {
        result.current.toggleChordMode();
      });

      act(() => {
        result.current.setChordAtCursor("Fmaj7");
      });

      expect(result.current.currentChordSymbol).toBe("Fmaj7");
    });

    it("should update when cursor moves to position with chord", () => {
      const { result } = renderHook(() => useTuneComposerState());

      act(() => {
        result.current.toggleChordMode();
      });

      // Add chord at beat 2
      act(() => {
        result.current.moveChordCursorNext();
        result.current.moveChordCursorNext();
      });

      act(() => {
        result.current.setChordAtCursor("Bb7");
      });

      // Move back to beat 0 (no chord)
      act(() => {
        result.current.moveChordCursorPrev();
        result.current.moveChordCursorPrev();
      });

      expect(result.current.currentChordSymbol).toBe("");

      // Move back to beat 2
      act(() => {
        result.current.moveChordCursorNext();
        result.current.moveChordCursorNext();
      });

      expect(result.current.currentChordSymbol).toBe("Bb7");
    });
  });

  describe("chord symbol visibility", () => {
    it("should initialize showChordSymbols as true", () => {
      const { result } = renderHook(() => useTuneComposerState());

      expect(result.current.showChordSymbols).toBe(true);
    });

    it("should toggle chord symbol visibility", () => {
      const { result } = renderHook(() => useTuneComposerState());

      expect(result.current.showChordSymbols).toBe(true);

      act(() => {
        result.current.toggleChordSymbolVisibility();
      });

      expect(result.current.showChordSymbols).toBe(false);

      act(() => {
        result.current.toggleChordSymbolVisibility();
      });

      expect(result.current.showChordSymbols).toBe(true);
    });
  });

  describe("active progression", () => {
    it("should return default progression", () => {
      const { result } = renderHook(() => useTuneComposerState());

      expect(result.current.activeProgression).not.toBeNull();
      expect(result.current.activeProgression?.isDefault).toBe(true);
      expect(result.current.activeProgression?.name).toBe("Default");
    });

    it("should use first progression if no default", () => {
      const customScore = createScore();
      // Mark the only progression as not default for this edge case test
      customScore.chordProgressions[0].isDefault = false;

      const { result } = renderHook(() => useTuneComposerState(customScore));

      // Should fall back to first progression
      expect(result.current.activeProgression).not.toBeNull();
    });
  });

  describe("dirty flag with chord operations", () => {
    it("should mark dirty when adding chord", () => {
      const { result } = renderHook(() => useTuneComposerState());

      expect(result.current.isDirty).toBe(false);

      act(() => {
        result.current.toggleChordMode();
      });

      act(() => {
        result.current.setChordAtCursor("C");
      });

      expect(result.current.isDirty).toBe(true);
    });

    it("should mark dirty when removing chord", () => {
      const { result } = renderHook(() => useTuneComposerState());

      act(() => {
        result.current.toggleChordMode();
      });

      act(() => {
        result.current.setChordAtCursor("C");
      });

      // Reset dirty flag
      act(() => {
        result.current.markClean();
      });

      expect(result.current.isDirty).toBe(false);

      act(() => {
        result.current.removeChordAtCursor();
      });

      expect(result.current.isDirty).toBe(true);
    });

    it("should mark dirty when toggling visibility", () => {
      const { result } = renderHook(() => useTuneComposerState());

      expect(result.current.isDirty).toBe(false);

      act(() => {
        result.current.toggleChordSymbolVisibility();
      });

      expect(result.current.isDirty).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle operations when chord mode is off", () => {
      const { result } = renderHook(() => useTuneComposerState());

      // These should not throw when chord mode is off
      act(() => {
        result.current.setChordAtCursor("C");
      });

      act(() => {
        result.current.removeChordAtCursor();
      });

      act(() => {
        result.current.moveChordCursorNext();
      });

      act(() => {
        result.current.moveChordCursorPrev();
      });

      // No chords should have been added
      expect(result.current.activeProgression?.chords).toHaveLength(0);
    });

    it("should handle time signature with different beat counts", () => {
      const score3_4 = createScore({
        timeSignature: { beats: 3, beatUnit: 4 },
      });

      const { result } = renderHook(() => useTuneComposerState(score3_4));

      act(() => {
        result.current.toggleChordMode();
      });

      // Move through 3 beats
      for (let i = 0; i < 2; i++) {
        act(() => {
          result.current.moveChordCursorNext();
        });
      }

      expect(result.current.chordCursor?.beatPosition).toBe(2);
      expect(result.current.canChordCursorGoNext).toBe(false);
    });
  });
});
