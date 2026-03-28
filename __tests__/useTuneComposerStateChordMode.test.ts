/**
 * useTuneComposerState Chord Mode Tests
 *
 * Tests for chord mode functionality in the tune composer state hook.
 */

import { renderHook, act } from "@testing-library/react-native";
import { useTuneComposerState } from "../src/features/tune-composer/hooks/useTuneComposerState";
import {
  createScore,
  resolveChordSymbol,
  createChordSymbol,
  type ChordSymbol,
} from "../src/features/tune-composer/types";

/**
 * Helper to resolve a chord to its display symbol for test assertions.
 * Uses key of C (0 fifths) by default.
 */
function chordSymbol(chord: ChordSymbol | undefined): string | undefined {
  if (!chord) return undefined;
  return resolveChordSymbol(chord, 0) ?? undefined;
}

/**
 * Helper to create test chords with proper format.
 * Uses key of C (0 fifths) by default.
 */
function testChord(
  symbol: string,
  measureIndex: number,
  beatPosition: number = 0,
): ChordSymbol {
  return createChordSymbol(symbol, 0, measureIndex, beatPosition)!;
}

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
      expect(chordSymbol(result.current.activeProgression?.chords[0])).toBe(
        "Cmaj7",
      );
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
      expect(chordSymbol(firstChord)).toBe("C");

      // Check second chord
      const secondChord = result.current.activeProgression?.chords.find(
        (c) => c.beatPosition === 2,
      );
      expect(chordSymbol(secondChord)).toBe("Am");
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

      // Note: In key of C (0 fifths), chord resolves to A#7 (sharp spelling by default)
      expect(result.current.currentChordSymbol).toBe("A#7");
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

  describe("progression management", () => {
    describe("selectProgression", () => {
      it("should switch active progression by ID", () => {
        const { result } = renderHook(() => useTuneComposerState());

        // Get the default progression ID
        const defaultId = result.current.chordProgressions[0].id;
        const defaultName = result.current.chordProgressions[0].name;

        // Verify initial state
        expect(result.current.chordProgressions).toHaveLength(1);
        expect(result.current.activeProgression?.id).toBe(defaultId);

        // Create a new progression
        let secondId: string = "";
        act(() => {
          secondId = result.current.createProgression("Second");
        });

        // Should have 2 progressions now
        expect(result.current.chordProgressions).toHaveLength(2);

        // Find the "Second" progression in the array
        const secondProg = result.current.chordProgressions.find(
          (p) => p.name === "Second",
        );
        expect(secondProg).toBeDefined();
        expect(secondProg?.id).toBe(secondId);

        // Second should be active (last created)
        expect(result.current.activeProgression?.name).toBe("Second");

        // Select default
        act(() => {
          result.current.selectProgression(defaultId);
        });

        expect(result.current.activeProgression?.name).toBe(defaultName);
      });

      it("should not change if progression ID does not exist", () => {
        const { result } = renderHook(() => useTuneComposerState());

        const currentId = result.current.activeProgression?.id;

        act(() => {
          result.current.selectProgression("nonexistent-id");
        });

        expect(result.current.activeProgression?.id).toBe(currentId);
      });
    });

    describe("createProgression", () => {
      it("should create a new empty progression", () => {
        const { result } = renderHook(() => useTuneComposerState());

        // Start with default
        expect(result.current.chordProgressions).toHaveLength(1);

        let newId: string = "";
        act(() => {
          newId = result.current.createProgression("My New Progression");
        });

        expect(newId).toBeTruthy();
        expect(result.current.chordProgressions).toHaveLength(2);
        expect(result.current.activeProgression?.name).toBe(
          "My New Progression",
        );
        expect(result.current.activeProgression?.chords).toEqual([]);
        expect(
          result.current.activeProgression?.isSystemDefined,
        ).toBeUndefined();
      });

      it("should auto-select newly created progression", () => {
        const { result } = renderHook(() => useTuneComposerState());

        let firstNewId: string = "";
        act(() => {
          firstNewId = result.current.createProgression("First New");
        });

        let secondNewId: string = "";
        act(() => {
          secondNewId = result.current.createProgression("Second New");
        });

        expect(result.current.activeProgression?.id).toBe(secondNewId);
        expect(result.current.chordProgressions).toHaveLength(3); // default + 2 new
      });
    });

    describe("duplicateProgression", () => {
      it("should create a copy of an existing progression", () => {
        const { result } = renderHook(() => useTuneComposerState());

        let originalId: string = "";
        act(() => {
          originalId = result.current.createProgression("Original");
        });

        // Add a chord to the original
        act(() => {
          result.current.toggleChordMode();
        });
        act(() => {
          result.current.setChordAtCursor("Cmaj7");
        });

        // Duplicate
        let copyId: string | null = null;
        act(() => {
          copyId = result.current.duplicateProgression(
            originalId,
            "Original (Copy)",
          );
        });

        expect(copyId).toBeTruthy();
        expect(result.current.chordProgressions).toHaveLength(3); // default + original + copy
        expect(result.current.activeProgression?.id).toBe(copyId);
        expect(result.current.activeProgression?.name).toBe("Original (Copy)");
        expect(result.current.activeProgression?.chords).toHaveLength(1);
        expect(result.current.activeProgression?.isSystemDefined).toBeFalsy();
      });

      it("should return null if source does not exist", () => {
        const { result } = renderHook(() => useTuneComposerState());

        let copyId: string | null = "initial";
        act(() => {
          copyId = result.current.duplicateProgression("nonexistent", "Copy");
        });

        expect(copyId).toBeNull();
      });

      it("should generate new IDs for copied chords", () => {
        const { result } = renderHook(() => useTuneComposerState());

        let originalId: string = "";
        act(() => {
          originalId = result.current.createProgression("Original");
        });

        act(() => {
          result.current.toggleChordMode();
        });
        act(() => {
          result.current.setChordAtCursor("Dm7");
        });

        const originalChordId = result.current.activeProgression?.chords[0]?.id;

        act(() => {
          result.current.duplicateProgression(originalId, "Copy");
        });

        const copiedChordId = result.current.activeProgression?.chords[0]?.id;
        expect(copiedChordId).not.toBe(originalChordId);
      });
    });

    describe("renameProgression", () => {
      it("should rename a user-created progression", () => {
        const { result } = renderHook(() => useTuneComposerState());

        let id: string = "";
        act(() => {
          id = result.current.createProgression("Old Name");
        });

        act(() => {
          result.current.renameProgression(id, "New Name");
        });

        expect(result.current.activeProgression?.name).toBe("New Name");
      });

      it("should rename a system-defined progression (admin tool)", () => {
        const { result } = renderHook(() => useTuneComposerState());

        // Add a system-defined progression via addChordProgression
        act(() => {
          result.current.addChordProgression({
            id: "system-prog",
            name: "System Progression",
            isDefault: false,
            isSystemDefined: true,
            chords: [],
          });
        });

        act(() => {
          result.current.selectProgression("system-prog");
        });

        act(() => {
          result.current.renameProgression("system-prog", "Renamed System");
        });

        // Admin can rename system-defined progressions
        expect(result.current.activeProgression?.name).toBe("Renamed System");
      });

      it("should not change state if progression does not exist", () => {
        const { result } = renderHook(() => useTuneComposerState());

        const nameBefore = result.current.activeProgression?.name;

        act(() => {
          result.current.renameProgression("nonexistent", "New Name");
        });

        expect(result.current.activeProgression?.name).toBe(nameBefore);
      });
    });

    describe("deleteProgression", () => {
      it("should delete a user-created progression", () => {
        const { result } = renderHook(() => useTuneComposerState());

        // Start with default + create one
        let newId: string = "";
        act(() => {
          newId = result.current.createProgression("New");
        });

        expect(result.current.chordProgressions).toHaveLength(2);

        act(() => {
          result.current.deleteProgression(newId);
        });

        expect(result.current.chordProgressions).toHaveLength(1);
        // Should fall back to default
        expect(result.current.activeProgression?.name).toBe("Default");
      });

      it("should delete a system-defined progression (admin tool)", () => {
        const { result } = renderHook(() => useTuneComposerState());

        act(() => {
          result.current.addChordProgression({
            id: "system-prog",
            name: "System Progression",
            isDefault: false,
            isSystemDefined: true,
            chords: [],
          });
        });

        const countBefore = result.current.chordProgressions.length;

        act(() => {
          result.current.deleteProgression("system-prog");
        });

        // Admin can delete system-defined progressions
        expect(result.current.chordProgressions).toHaveLength(countBefore - 1);
        // System progression should be gone
        expect(
          result.current.chordProgressions.find((p) => p.id === "system-prog"),
        ).toBeUndefined();
      });

      it("should switch to first progression when deleting active", () => {
        const { result } = renderHook(() => useTuneComposerState());

        const defaultId = result.current.chordProgressions[0].id;

        let secondId: string = "";
        act(() => {
          secondId = result.current.createProgression("Second");
        });

        // Verify second is active
        expect(result.current.activeProgression?.name).toBe("Second");

        act(() => {
          result.current.deleteProgression(secondId);
        });

        // Should switch to default
        expect(result.current.activeProgression?.id).toBe(defaultId);
      });

      it("should not change state if progression does not exist", () => {
        const { result } = renderHook(() => useTuneComposerState());

        const countBefore = result.current.chordProgressions.length;

        act(() => {
          result.current.deleteProgression("nonexistent");
        });

        expect(result.current.chordProgressions).toHaveLength(countBefore);
      });
    });

    describe("setActiveProgressionChords", () => {
      it("should replace chords in the active progression", () => {
        const { result } = renderHook(() => useTuneComposerState());

        // Active progression starts with no chords
        expect(result.current.activeProgression?.chords).toHaveLength(0);

        const newChords = [testChord("C", 0, 0), testChord("G", 1, 0)];

        act(() => {
          result.current.setActiveProgressionChords(newChords);
        });

        expect(result.current.activeProgression?.chords).toHaveLength(2);
        expect(chordSymbol(result.current.activeProgression?.chords[0])).toBe(
          "C",
        );
        expect(chordSymbol(result.current.activeProgression?.chords[1])).toBe(
          "G",
        );
      });

      it("should enable chord symbol visibility when setting chords", () => {
        const { result } = renderHook(() => useTuneComposerState());

        // Turn off visibility first
        act(() => {
          result.current.toggleChordSymbolVisibility();
        });
        expect(result.current.showChordSymbols).toBe(false);

        act(() => {
          result.current.setActiveProgressionChords([testChord("Dm", 0, 0)]);
        });

        // Should auto-enable visibility when chords are set
        expect(result.current.showChordSymbols).toBe(true);
      });
    });

    describe("clearActiveProgressionChords", () => {
      it("should remove all chords from the active progression", () => {
        const { result } = renderHook(() => useTuneComposerState());

        // Add some chords first
        const chords = [
          { id: "c1", symbol: "C", measureIndex: 0, beatPosition: 0 },
          { id: "c2", symbol: "G", measureIndex: 1, beatPosition: 0 },
          { id: "c3", symbol: "Am", measureIndex: 2, beatPosition: 0 },
        ];

        act(() => {
          result.current.setActiveProgressionChords(chords);
        });
        expect(result.current.activeProgression?.chords).toHaveLength(3);

        // Clear all chords
        act(() => {
          result.current.clearActiveProgressionChords();
        });

        expect(result.current.activeProgression?.chords).toHaveLength(0);
      });

      it("should work on an already empty progression", () => {
        const { result } = renderHook(() => useTuneComposerState());

        // Should be empty to start
        expect(result.current.activeProgression?.chords).toHaveLength(0);

        // Clear should not throw or cause issues
        act(() => {
          result.current.clearActiveProgressionChords();
        });

        expect(result.current.activeProgression?.chords).toHaveLength(0);
      });
    });

    describe("setProgressionSystemDefined", () => {
      it("should mark a progression as system-defined", () => {
        const { result } = renderHook(() => useTuneComposerState());

        // Default progression starts not system-defined
        const defaultId = result.current.chordProgressions[0].id;
        expect(result.current.chordProgressions[0].isSystemDefined).toBeFalsy();

        act(() => {
          result.current.setProgressionSystemDefined(defaultId, true);
        });

        expect(result.current.chordProgressions[0].isSystemDefined).toBe(true);
      });

      it("should unmark a system-defined progression", () => {
        const { result } = renderHook(() => useTuneComposerState());

        act(() => {
          result.current.addChordProgression({
            id: "sys-prog",
            name: "System",
            isDefault: false,
            isSystemDefined: true,
            chords: [],
          });
        });

        const prog = result.current.chordProgressions.find(
          (p) => p.id === "sys-prog",
        );
        expect(prog?.isSystemDefined).toBe(true);

        act(() => {
          result.current.setProgressionSystemDefined("sys-prog", false);
        });

        const updatedProg = result.current.chordProgressions.find(
          (p) => p.id === "sys-prog",
        );
        expect(updatedProg?.isSystemDefined).toBe(false);
      });

      it("should return false if progression does not exist", () => {
        const { result } = renderHook(() => useTuneComposerState());

        let success: boolean = true;
        act(() => {
          success = result.current.setProgressionSystemDefined(
            "nonexistent",
            true,
          );
        });

        expect(success).toBe(false);
      });
    });

    describe("chordProgressions array", () => {
      it("should expose all progressions including default", () => {
        const { result } = renderHook(() => useTuneComposerState());

        // Should start with default
        expect(result.current.chordProgressions).toHaveLength(1);
        expect(result.current.chordProgressions[0].name).toBe("Default");

        act(() => {
          result.current.createProgression("One");
        });
        act(() => {
          result.current.createProgression("Two");
        });

        expect(result.current.chordProgressions).toHaveLength(3);
        expect(result.current.chordProgressions[1].name).toBe("One");
        expect(result.current.chordProgressions[2].name).toBe("Two");
      });
    });
  });
});
