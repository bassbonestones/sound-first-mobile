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
      expect(result.current.score.title).toBe("Composer");
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
    it("should insert a note at cursor position (replacing rest)", () => {
      const { result } = renderHook(() => useComposerState());

      // Measure starts with whole rest (4 beats)
      expect(result.current.score.measures[0].notes).toHaveLength(1);
      expect(result.current.score.measures[0].notes[0].midi).toBeNull(); // rest

      act(() => {
        result.current.insertNote("C");
      });

      // After inserting quarter C, measure has: C + remainder rests (3 beats = half + quarter)
      expect(
        result.current.score.measures[0].notes.length,
      ).toBeGreaterThanOrEqual(1);
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

      // Cursor moves to next note position (which could be a rest or past end)
      expect(result.current.cursor.measureIndex).toBe(0);
      expect(result.current.cursor.noteIndex).toBeGreaterThanOrEqual(1);
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

    it("should fill measure with whole note", () => {
      const { result } = renderHook(() => useComposerState());

      // Set duration first
      act(() => {
        result.current.setDuration(DURATION.WHOLE);
      });

      // Insert whole note - replaces the initial whole rest
      act(() => {
        result.current.insertNote("C");
      });

      // Measure should have just the whole note
      expect(result.current.score.measures[0].notes).toHaveLength(1);
      expect(result.current.score.measures[0].notes[0].midi).toBeDefined();
      expect(result.current.score.measures[0].notes[0].duration).toBe(
        DURATION.WHOLE,
      );
    });

    it("should use smart octave - choose nearest octave to staff center", () => {
      const { result } = renderHook(() => useComposerState());

      // First note uses staff center (B4 = 71) as reference
      // Insert C - nearest to B4 is C5 (72), not C4 (60)
      act(() => {
        result.current.insertNote("C");
      });
      const cMidi = result.current.score.measures[0].notes[0].midi;
      expect(cMidi).toBe(72); // C5 (closest to B4)

      // Insert E - should be E5 (76) since it's closer to C5 (72)
      act(() => {
        result.current.insertNote("E");
      });
      const eMidi = result.current.score.measures[0].notes[1].midi;
      expect(eMidi).toBe(76); // E5

      // Insert G - should be G4 (67) since it's closer to E5 (76) than G5 (79)
      act(() => {
        result.current.insertNote("G");
      });
      const gMidi = result.current.score.measures[0].notes[2].midi;
      // G4=67 is 9 below E5=76, G5=79 is 3 above E5=76
      expect(gMidi).toBe(79); // G5 is closer

      // Insert B - should be B4 (71) since it's closer to G5 (79)
      act(() => {
        result.current.insertNote("B");
      });
      const bMidi = result.current.score.measures[0].notes[3].midi;
      // B4=71 is 8 below G5=79, B5=83 is 4 above G5=79
      expect(bMidi).toBe(83); // B5 is closer
    });

    it("should use last pitched note for smart octave, skipping rests", () => {
      const { result } = renderHook(() => useComposerState());

      // Use eighth notes for more notes per measure
      act(() => {
        result.current.setDuration(0.125);
      });

      // Enter E5 as starting point (near staff center B4=71)
      act(() => {
        result.current.insertNote("E");
      });
      const eMidi = result.current.score.measures[0].notes[0].midi;
      expect(eMidi).toBe(76); // E5

      // Enter a rest
      act(() => {
        result.current.insertRest();
      });
      expect(result.current.score.measures[0].notes[1].midi).toBeNull();

      // Enter F - should use E5 (76) as reference, NOT staff center (71)
      // F4=65 is 11 from E5, F5=77 is 1 from E5 -> F5 wins
      act(() => {
        result.current.insertNote("F");
      });
      const fMidi = result.current.score.measures[0].notes[2].midi;
      expect(fMidi).toBe(77); // F5 (using E5 as reference, not staff center)

      // Enter another rest
      act(() => {
        result.current.insertRest();
      });

      // Enter G - should use F5 (77) as reference
      // G4=67 is 10 from F5, G5=79 is 2 from F5 -> G5 wins
      act(() => {
        result.current.insertNote("G");
      });
      const gMidi = result.current.score.measures[0].notes[4].midi;
      expect(gMidi).toBe(79); // G5 (using F5 as reference)
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

      // Insert a note (replaces initial whole rest)
      act(() => {
        result.current.insertNote("C");
      });

      // Select the note we just inserted (go back to it)
      act(() => {
        result.current.moveCursor("left");
      });

      const firstNoteMidi = result.current.score.measures[0].notes[0].midi;
      expect(firstNoteMidi).toBeDefined(); // It's a note, not a rest

      act(() => {
        result.current.deleteNote();
      });

      // The pitched note should be replaced with a rest
      // (measure still fills to correct duration)
      const firstNoteAfter = result.current.score.measures[0].notes[0];
      expect(firstNoteAfter.midi).toBeNull(); // Now it's a rest
    });

    it("should handle delete on measure with only rests", () => {
      const { result } = renderHook(() => useComposerState());

      // Measure starts with rest(s) - deleting should return false
      // (nothing meaningful to delete when only rests exist)
      let deleteResult: boolean = false;
      act(() => {
        deleteResult = result.current.deleteNote();
      });

      // No pitched notes to delete, should return false
      expect(deleteResult).toBe(false);
      expect(result.current.score.measures[0]).toBeDefined();
    });

    it("should move selection left when deleting on a rest", () => {
      const { result } = renderHook(() => useComposerState());

      // Insert a note, then move right to the rest after it
      act(() => {
        result.current.insertNote("C");
      });
      act(() => {
        result.current.moveCursor("right");
      });

      // Now on a rest, cursor should be at position 2
      const cursorBefore = result.current.cursor;
      expect(cursorBefore.noteIndex).toBe(2);

      // Delete while on a rest should act like left arrow
      act(() => {
        result.current.deleteNote();
      });

      // Should have moved left, note C should still exist
      const cursorAfter = result.current.cursor;
      expect(cursorAfter.noteIndex).toBeLessThan(cursorBefore.noteIndex);

      const pitchedNotes = result.current.score.measures[0].notes.filter(
        (n) => n.midi !== null,
      );
      expect(pitchedNotes).toHaveLength(1);
      expect(pitchedNotes[0].midi).toBe(72); // C still exists
    });

    it("should select replacement rest after delete, cursor stays for insert", () => {
      const { result } = renderHook(() => useComposerState());

      // Insert two notes
      act(() => {
        result.current.insertNote("C");
      });
      act(() => {
        result.current.insertNote("D");
      });

      // After inserting D, D should be selected even though cursor is past it
      const dNote = result.current.score.measures[0].notes.find(
        (n) => n.midi === 74, // D
      );
      expect(result.current.state.selectedNoteId).toBe(dNote?.id);

      // Delete - should delete D, select the replacement rest (not C)
      act(() => {
        result.current.deleteNote();
      });

      // The rest where D was should be at position 1 and selected
      const restAtPos1 = result.current.score.measures[0].notes[1];
      expect(restAtPos1.midi).toBeNull();
      expect(result.current.state.selectedNoteId).toBe(restAtPos1.id);

      // Cursor should still be at position 1 (the rest), so insert goes there
      expect(result.current.cursor.noteIndex).toBe(1);

      // Insert E - should overwrite the rest where D was (no moveCursor needed)
      act(() => {
        result.current.insertNote("E");
      });

      // Now should have C and E
      const pitchedNotes = result.current.score.measures[0].notes.filter(
        (n) => n.midi !== null,
      );
      expect(pitchedNotes).toHaveLength(2);
      expect(pitchedNotes.map((n) => n.midi)).toContain(72); // C
      expect(pitchedNotes.map((n) => n.midi)).toContain(76); // E
    });

    it("should allow consecutive deletes going backwards", () => {
      const { result } = renderHook(() => useComposerState());

      // Insert two notes
      act(() => {
        result.current.insertNote("C");
      });
      act(() => {
        result.current.insertNote("D");
      });

      // Both notes should be present
      const pitchedBefore = result.current.score.measures[0].notes.filter(
        (n) => n.midi !== null,
      );
      expect(pitchedBefore).toHaveLength(2);

      // After inserting D, D should be selected (even though cursor is past it)
      const dNote = pitchedBefore.find((n) => n.midi === 74);
      expect(result.current.state.selectedNoteId).toBe(dNote?.id);

      // First delete - should delete D, select the replacement rest
      act(() => {
        result.current.deleteNote();
      });

      const pitchedAfterFirst = result.current.score.measures[0].notes.filter(
        (n) => n.midi !== null,
      );
      expect(pitchedAfterFirst).toHaveLength(1);
      expect(pitchedAfterFirst[0].midi).toBe(72); // C

      // Replacement rest should now be selected
      const restAfterFirst = result.current.score.measures[0].notes[1];
      expect(restAfterFirst.midi).toBeNull();
      expect(result.current.state.selectedNoteId).toBe(restAfterFirst.id);

      // Second delete - on a rest, acts like left arrow, moves to C
      act(() => {
        result.current.deleteNote();
      });

      // C should now be selected
      expect(result.current.state.selectedNoteId).toBe(pitchedAfterFirst[0].id);

      // Third delete - should delete C
      act(() => {
        result.current.deleteNote();
      });

      const pitchedAfterThird = result.current.score.measures[0].notes.filter(
        (n) => n.midi !== null,
      );
      expect(pitchedAfterThird).toHaveLength(0);
    });

    it("should allow insert after delete to fill the deleted spot", () => {
      const { result } = renderHook(() => useComposerState());

      // Insert a note
      act(() => {
        result.current.insertNote("C");
      });

      // Delete it
      act(() => {
        result.current.deleteNote();
      });

      // Insert a new note - should fill the deleted spot
      act(() => {
        result.current.insertNote("E");
      });

      // Should have one pitched note (E)
      const pitchedNotes = result.current.score.measures[0].notes.filter(
        (n) => n.midi !== null,
      );
      expect(pitchedNotes).toHaveLength(1);
    });

    it("should insert at deleted position even when previous is a rest", () => {
      const { result } = renderHook(() => useComposerState());

      // Setup: Insert two notes to get [C, D, rest, rest]
      act(() => {
        result.current.insertNote("C");
      });
      act(() => {
        result.current.insertNote("D");
      });

      // Delete C (first note) to create a rest before D: [rest, D, rest, rest]
      act(() => {
        result.current.moveCursor("left"); // now on D
        result.current.moveCursor("left"); // now on C
      });
      act(() => {
        result.current.deleteNote();
      });

      // Now we have [rest, D, ...] with rest at position 0, D at position 1
      expect(result.current.score.measures[0].notes[0].midi).toBeNull(); // rest at 0
      expect(result.current.score.measures[0].notes[1].midi).toBe(74); // D at 1

      // Move to D and delete it - previous is the rest at position 0
      act(() => {
        result.current.moveCursor("right");
      });
      act(() => {
        result.current.deleteNote();
      });

      // Cursor should still be at position 1 (where D was, now a rest)
      expect(result.current.cursor.noteIndex).toBe(1);

      // Insert E - should go at cursor position 1, not selection position 0
      act(() => {
        result.current.insertNote("E");
      });

      // Rest should still be at 0, E should be at 1
      expect(result.current.score.measures[0].notes[0].midi).toBeNull(); // rest at 0
      expect(result.current.score.measures[0].notes[1].midi).toBe(76); // E at 1
    });
  });

  describe("navigation", () => {
    it("should move cursor left and right", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.insertNote("C");
      });
      act(() => {
        result.current.insertNote("D");
      });

      // After two quarter note insertions in 4/4:
      // [C quarter, D quarter, quarter rest, quarter rest] - 4 notes
      // Cursor is at index 2 (first rest after D)
      expect(result.current.cursor.noteIndex).toBe(2);
      // Selection is on D (the last inserted note)
      expect(result.current.selectedNote?.midi).toBeDefined();

      // Moving left goes to the previous note (index 1 = D)
      act(() => {
        result.current.moveCursor("left");
      });
      expect(result.current.cursor.noteIndex).toBe(1);

      // Moving left again goes to C (index 0)
      act(() => {
        result.current.moveCursor("left");
      });
      expect(result.current.cursor.noteIndex).toBe(0);

      // Moving right goes to D (index 1)
      act(() => {
        result.current.moveCursor("right");
      });
      expect(result.current.cursor.noteIndex).toBe(1);
    });

    it("should move to start and end", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.insertNote("C");
      });
      act(() => {
        result.current.insertNote("D");
      });
      act(() => {
        result.current.moveCursor("start");
      });

      expect(result.current.cursor).toEqual({ measureIndex: 0, noteIndex: 0 });

      act(() => {
        result.current.moveCursor("end");
      });

      // End is past all notes - with boundary-aware rest filling:
      // [C quarter, D quarter, half rest] = 3 notes, cursor at 3
      expect(result.current.cursor.noteIndex).toBe(3);
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

      // Insert a half note first
      act(() => {
        result.current.setDuration(DURATION.HALF);
      });
      act(() => {
        result.current.insertNote("C");
      });

      // Navigate to select the note
      act(() => {
        result.current.moveCursor("left");
      });

      // Change to quarter (shrinking is always allowed)
      act(() => {
        result.current.changeDurationOfSelected(DURATION.QUARTER);
      });

      expect(result.current.score.measures[0].notes[0].duration).toBe(
        DURATION.QUARTER,
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
      // Cursor should move to the new measure
      expect(result.current.cursor.measureIndex).toBe(1);
      expect(result.current.cursor.noteIndex).toBe(0);
      // Selection should be on first note of new measure
      expect(result.current.selectedNote).toBeDefined();
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
    it("should validate pre-filled measure as complete", () => {
      const { result } = renderHook(() => useComposerState());

      // Measures start pre-filled with rests, so they're always complete duration-wise
      expect(result.current.currentMeasureValidation.isComplete).toBe(true);
      expect(result.current.currentMeasureValidation.actualDuration).toBe(4);
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

    it("should change key signature with transposition", () => {
      const { result } = renderHook(() => useComposerState());

      // Insert a note first
      act(() => {
        result.current.insertNote("C");
      });

      const originalMidi = result.current.score.measures[0].notes[0].midi;

      // Change key and transpose up by 7 semitones
      act(() => {
        result.current.setKeySignatureWithTransposition(1, 7);
      });

      expect(result.current.score.keySignature).toBe(1);
      expect(result.current.score.measures[0].notes[0].midi).toBe(
        originalMidi! + 7,
      );
    });

    it("should keep pitch when transposing by 0 semitones", () => {
      const { result } = renderHook(() => useComposerState());

      // Insert a note first
      act(() => {
        result.current.insertNote("C");
      });

      const originalMidi = result.current.score.measures[0].notes[0].midi;

      // Change key without transposition
      act(() => {
        result.current.setKeySignatureWithTransposition(2, 0);
      });

      expect(result.current.score.keySignature).toBe(2);
      expect(result.current.score.measures[0].notes[0].midi).toBe(originalMidi);
    });

    it("should recalculate accidentals after key transposition", () => {
      const { result } = renderHook(() => useComposerState());

      // Set initial key to Bb major (key = -2)
      act(() => {
        result.current.setKeySignature(-2);
      });

      // Insert a C note (diatonic in Bb major)
      // Due to smart octave, will be near staff center
      act(() => {
        result.current.insertNote("C");
      });

      // C in Bb major should have no accidental
      expect(
        result.current.score.measures[0].notes[0].accidental,
      ).toBeUndefined();

      const originalMidi = result.current.score.measures[0].notes[0].midi;

      // Now transpose to C major, up 2 semitones
      act(() => {
        result.current.setKeySignatureWithTransposition(0, 2);
      });

      // D in C major should have no accidental
      expect(result.current.score.measures[0].notes[0].midi).toBe(
        originalMidi! + 2,
      );
      expect(
        result.current.score.measures[0].notes[0].accidental,
      ).toBeUndefined();
    });

    it("should preserve scale degree when transposing (function-preserving)", () => {
      const { result } = renderHook(() => useComposerState());

      // Set initial key to C major
      act(() => {
        result.current.setKeySignature(0);
      });

      // Insert E note - due to smart octave, this will be E5 (MIDI 76) near staff center
      // E is scale degree 2 (mediant) in C major
      act(() => {
        result.current.insertNote("E");
      });

      // Transpose to G major (key=1)
      // E (degree 2 in C) → B (degree 2 in G)
      // E5 (76) → B5 (83)
      act(() => {
        result.current.setKeySignatureWithTransposition(1, 7); // 7 semitones = C to G
      });

      // B in G major is scale degree 2 (mediant), diatonic
      expect(result.current.score.measures[0].notes[0].midi).toBe(83); // B5
      // In G major, B is diatonic, so no accidental needed
      expect(
        result.current.score.measures[0].notes[0].accidental,
      ).toBeUndefined();
    });

    it("should transpose double-sharp correctly using stored accidental", () => {
      const { result } = renderHook(() => useComposerState());

      // Set initial key to C major
      act(() => {
        result.current.setKeySignature(0);
      });

      // Insert C note
      act(() => {
        result.current.insertNote("C");
      });

      const originalMidi = result.current.score.measures[0].notes[0].midi;

      // Select the note and apply double-sharp
      act(() => {
        result.current.moveCursor("left");
      });
      act(() => {
        result.current.applyAccidental("double-sharp");
      });

      // C## in C major should have midi = original + 2
      expect(result.current.score.measures[0].notes[0].midi).toBe(
        originalMidi! + 2,
      );
      expect(result.current.score.measures[0].notes[0].accidental).toBe(
        "double-sharp",
      );

      // Transpose to Bb major (key=-2), down 2 semitones
      // C## in C major (double-raised tonic) → B# in Bb major (double-raised tonic)
      act(() => {
        result.current.setKeySignatureWithTransposition(-2, -2);
      });

      // B# should have accidental "sharp" and midi should be 2 semitones down from C##
      // C##5 (62) - 2 = B#4 (60)
      expect(result.current.score.measures[0].notes[0].accidental).toBe(
        "sharp",
      );
      // Verify the pitch class is correct (B# = 0, same as C)
      expect(result.current.score.measures[0].notes[0].midi! % 12).toBe(0);
    });

    it("should transpose C major to A major down without octave jumps", () => {
      const { result } = renderHook(() => useComposerState());

      // Set initial key to C major (0 sharps)
      act(() => {
        result.current.setKeySignature(0);
      });

      // Insert 4 notes in C major scale (fits in one 4/4 measure)
      // C, D, E, F - should be C4, D4, E4, F4 with default octave
      const pitches: Array<"C" | "D" | "E" | "F"> = ["C", "D", "E", "F"];
      for (const p of pitches) {
        act(() => {
          result.current.insertNote(p);
        });
      }

      // Verify original MIDI values - note: smart octave may use octave 5
      const originalMidis = result.current.score.measures[0].notes.map(
        (n) => n.midi,
      );

      // Transpose to A major (3 sharps), down 3 semitones
      act(() => {
        result.current.setKeySignatureWithTransposition(3, -3);
      });

      const transposedMidis = result.current.score.measures[0].notes.map(
        (n) => n.midi,
      );

      // Each note should be exactly 3 semitones lower - no octave jumps
      for (let i = 0; i < originalMidis.length; i++) {
        expect(transposedMidis[i]).toBe(originalMidis[i]! - 3);
      }

      // Verify all transpositions maintain the same relative octave
      // (no 12-semitone jumps between original and transposed)
      for (let i = 0; i < originalMidis.length; i++) {
        const diff = originalMidis[i]! - transposedMidis[i]!;
        expect(Math.abs(diff)).toBe(3); // All should differ by exactly 3
      }
    });

    it("should transpose E and B notes correctly (C to A)", () => {
      const { result } = renderHook(() => useComposerState());

      // Set initial key to C major
      act(() => {
        result.current.setKeySignature(0);
      });

      // Insert E and B - these transpose to C# and G# which need careful octave handling
      act(() => {
        result.current.insertNote("E");
      });
      act(() => {
        result.current.insertNote("B");
      });

      // Get only pitched notes (filter out rests)
      const originalMidis = result.current.score.measures[0].notes
        .filter((n) => n.midi !== null)
        .map((n) => n.midi);

      // Transpose to A major, down 3 semitones
      act(() => {
        result.current.setKeySignatureWithTransposition(3, -3);
      });

      const transposedMidis = result.current.score.measures[0].notes
        .filter((n) => n.midi !== null)
        .map((n) => n.midi);

      // E→C#: should be exactly 3 semitones down
      // B→G#: should be exactly 3 semitones down
      for (let i = 0; i < originalMidis.length; i++) {
        expect(transposedMidis[i]).toBe(originalMidis[i]! - 3);
      }
    });

    it("should transpose sharps and flats in C major to A major", () => {
      const { result } = renderHook(() => useComposerState());

      // Set initial key to C major
      act(() => {
        result.current.setKeySignature(0);
      });

      // Insert F natural
      act(() => {
        result.current.insertNote("F");
      });

      const originalNote = result.current.score.measures[0].notes[0];
      const originalMidi = originalNote.midi;

      // Select it and add sharp (F#)
      act(() => {
        result.current.moveCursor("left");
      });
      act(() => {
        result.current.applyAccidental("sharp");
      });

      // F# in C major = raised 4th
      expect(result.current.score.measures[0].notes[0].midi).toBe(
        originalMidi! + 1,
      );

      // Transpose to A major, down 3 semitones
      // F# in C major (raised 4th) → D# in A major (raised 4th)
      act(() => {
        result.current.setKeySignatureWithTransposition(3, -3);
      });

      // D# should be 3 semitones below F# (66-3=63)
      const transposedNote = result.current.score.measures[0].notes[0];
      expect(transposedNote.midi).toBe(originalMidi! + 1 - 3); // F# - 3 = D# (or close)
    });

    it("should transpose all F and G alterations correctly from C to A", () => {
      const { result } = renderHook(() => useComposerState());

      // Set initial key to C major
      act(() => {
        result.current.setKeySignature(0);
      });

      // Use eighth notes so we can fit more in a measure (0.5 = eighth note)
      act(() => {
        result.current.setDuration(0.5); // Eighth note
      });

      // Insert 4 F notes (fits in one 4/4 measure as eighths = 2 beats)
      const fAlterations: Array<
        "double-flat" | "flat" | "sharp" | "double-sharp"
      > = ["double-flat", "flat", "sharp", "double-sharp"];

      for (let i = 0; i < 4; i++) {
        act(() => {
          result.current.insertNote("F");
        });
      }

      // Apply alterations to F notes
      // Navigate to start and apply to each note
      act(() => {
        result.current.moveCursor("start");
      });

      for (let i = 0; i < 4; i++) {
        act(() => {
          result.current.applyAccidental(fAlterations[i]);
        });
        act(() => {
          result.current.moveCursor("right");
        });
      }

      // Get original MIDI values for F notes (pitched notes only)
      const originalFMidis = result.current.score.measures[0].notes
        .filter((n) => n.midi !== null)
        .map((n) => n.midi);

      // All notes should be valid MIDI values
      expect(originalFMidis.length).toBe(4);
      for (const midi of originalFMidis) {
        expect(midi).not.toBeNull();
        expect(typeof midi).toBe("number");
      }

      // Transpose to A major, down 3 semitones
      act(() => {
        result.current.setKeySignatureWithTransposition(3, -3);
      });

      // Verify each F note transposed down exactly 3 semitones
      const transposedFMidis = result.current.score.measures[0].notes
        .filter((n) => n.midi !== null)
        .map((n) => n.midi);

      for (let i = 0; i < 4; i++) {
        expect(transposedFMidis[i]).toBe(originalFMidis[i]! - 3);
      }
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

    it("should disallow time signature change when notes exist", () => {
      const { result } = renderHook(() => useComposerState());

      // Insert a note
      act(() => {
        result.current.insertNote("C");
      });

      // Try to change time signature - should fail
      let changeResult = false;
      act(() => {
        changeResult = result.current.setTimeSignature({ beats: 3, beatUnit: 4 });
      });

      expect(changeResult).toBe(false);
      // Time signature should remain unchanged (4/4)
      expect(result.current.score.timeSignature).toEqual({
        beats: 4,
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

      // After insert: [C, rest(s)] - should have 1 pitched note
      const pitchedNotes = result.current.score.measures[0].notes.filter(
        (n) => n.midi !== null,
      );
      expect(pitchedNotes).toHaveLength(1);
      expect(result.current.canUndo).toBe(true);

      act(() => {
        result.current.undo();
      });

      // After undo: back to initial whole rest (no pitched notes)
      const pitchedNotesAfterUndo =
        result.current.score.measures[0].notes.filter((n) => n.midi !== null);
      expect(pitchedNotesAfterUndo).toHaveLength(0);
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

      const pitchedNotes = result.current.score.measures[0].notes.filter(
        (n) => n.midi !== null,
      );
      expect(pitchedNotes).toHaveLength(1);
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

  describe("isAtLastMeasureEnd detection", () => {
    it("should be false when measure has only rests", () => {
      const { result } = renderHook(() => useComposerState());

      // Fresh score with whole rest - not at end
      expect(result.current.isAtLastMeasureEnd).toBe(false);
    });

    it("should be true when last note of last measure is filled with pitched note", () => {
      const { result } = renderHook(() => useComposerState());

      // Fill entire measure with a whole note
      act(() => {
        result.current.setDuration(DURATION.WHOLE);
      });
      act(() => {
        result.current.insertNote("C");
      });

      // After whole note, cursor is at last position (index 0 = only note)
      expect(result.current.isAtLastMeasureEnd).toBe(true);
    });

    it("should be false when on non-last measure", () => {
      const { result } = renderHook(() => useComposerState());

      // Add a second measure
      act(() => {
        result.current.addMeasure();
      });

      // Go back to first measure and fill it
      act(() => {
        result.current.moveCursor("start");
        result.current.setDuration(DURATION.WHOLE);
      });
      act(() => {
        result.current.insertNote("C");
      });

      // Even though first measure is filled, we're not on the last measure
      expect(result.current.isAtLastMeasureEnd).toBe(false);
    });

    it("should be true when user explicitly fills to end with a rest", () => {
      const { result } = renderHook(() => useComposerState());

      // Insert two quarter notes
      act(() => {
        result.current.insertNote("C");
      });
      act(() => {
        result.current.insertNote("D");
      });

      // Now explicitly insert a half rest to fill the measure
      act(() => {
        result.current.setDuration(2); // half note duration
      });
      act(() => {
        result.current.insertRest();
      });

      // User explicitly filled to end with a rest - should prompt
      expect(result.current.isAtLastMeasureEnd).toBe(true);
    });

    it("should be false when auto-filled rests remain at end", () => {
      const { result } = renderHook(() => useComposerState());

      // Insert quarter note at beat 1 (leaves auto-filled rests at end)
      act(() => {
        result.current.insertNote("C");
      });

      // Move to end - but the rest there was auto-filled, not explicitly placed
      act(() => {
        result.current.moveCursor("end");
      });

      // Should NOT prompt - user didn't explicitly fill to the end
      expect(result.current.isAtLastMeasureEnd).toBe(false);
    });

    it("should be false when measure has only rests", () => {
      const { result } = renderHook(() => useComposerState());

      // Just move to end without adding any pitched notes
      act(() => {
        result.current.moveCursor("end");
      });

      // No pitched notes - should not prompt
      expect(result.current.isAtLastMeasureEnd).toBe(false);
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
      // New score starts with pre-filled rests, no pitched notes
      const pitchedNotes = result.current.score.measures[0].notes.filter(
        (n) => n.midi !== null,
      );
      expect(pitchedNotes).toHaveLength(0);
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

      const originalMidi = result.current.score.measures[0].notes[0].midi;

      act(() => {
        result.current.moveCursor("left");
      });

      act(() => {
        result.current.applyAccidental("sharp");
      });

      expect(result.current.selectedNote?.accidental).toBe("sharp");
      // MIDI should increase by 1 for sharp
      expect(result.current.selectedNote?.midi).toBe(originalMidi! + 1);
    });

    it("should apply double accidentals and update MIDI", () => {
      const { result } = renderHook(() => useComposerState());

      act(() => {
        result.current.insertNote("C");
      });

      const originalMidi = result.current.score.measures[0].notes[0].midi;

      act(() => {
        result.current.moveCursor("left");
      });

      // Apply double-sharp
      act(() => {
        result.current.applyAccidental("double-sharp");
      });
      expect(result.current.selectedNote?.accidental).toBe("double-sharp");
      expect(result.current.selectedNote?.midi).toBe(originalMidi! + 2);

      // Change to double-flat
      act(() => {
        result.current.applyAccidental("double-flat");
      });
      expect(result.current.selectedNote?.accidental).toBe("double-flat");
      expect(result.current.selectedNote?.midi).toBe(originalMidi! - 2);

      // Remove accidental
      act(() => {
        result.current.applyAccidental(undefined);
      });
      expect(result.current.selectedNote?.accidental).toBeUndefined();
      expect(result.current.selectedNote?.midi).toBe(originalMidi);
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
