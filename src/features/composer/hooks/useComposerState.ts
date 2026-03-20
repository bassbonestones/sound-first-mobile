/**
 * useComposerState Hook
 *
 * Main state management hook for the Practice Composer.
 * Manages score data, cursor position, selection, and all editing operations.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Accidental,
  Clef,
  ComposerScore,
  ComposerState,
  CursorPosition,
  DurationValue,
  KeySignature,
  MeasureValidation,
  Note,
  PitchName,
  TimeSignature,
} from "../types";
import {
  createInitialState,
  createMeasure,
  createNote,
  createRest,
  createScore,
  DEFAULT_OCTAVE_MIDI,
  STAFF_CENTER_MIDI,
  getBeatsPerMeasure,
  getMeasureDuration,
  getNoteDuration,
  generateRestsForDuration,
  validateMeasure,
  wouldOverflow,
  replaceNoteAtIndex,
  generateRestsForDurationAtPosition,
  getBeatPositionAt,
  createInsertNoteAction,
  createDeleteNoteAction,
  createChangePitchAction,
  createChangeDurationAction,
  createApplyAccidentalAction,
  createToggleTieAction,
  createAddMeasureAction,
  createDeleteMeasureAction,
} from "../types";
import {
  clampCursor,
  findNotePosition,
  getNoteAtCursor,
  getNoteBefore,
  getLastPitchedNoteBefore,
  moveCursorLeft,
  moveCursorRight,
  moveCursorToEnd,
  moveCursorToStart,
} from "../utils/cursorUtils";
import {
  getAccidentalForMidi,
  getDefaultMidiForPitch,
  getNearestMidiForPitch,
  getNextDiatonicPitch,
  getPreviousDiatonicPitch,
  isValidMidi,
  shiftOctave,
  transposeNoteByFunction,
  noteToMidi,
  midiToNoteName,
  midiToOctave,
} from "../utils/pitchUtils";
import {
  useComposerUndo,
  reverseAction,
  reapplyAction,
} from "./useComposerUndo";

// =============================================================================
// Return Type
// =============================================================================

export interface UseComposerStateReturn {
  // State
  state: ComposerState;
  score: ComposerScore;
  cursor: CursorPosition;
  selectedNote: Note | null;

  // Validation
  currentMeasureValidation: MeasureValidation;
  allMeasuresValid: boolean;

  // Cursor Position
  /** True when cursor is at last position of last measure (user may want to add measure) */
  isAtLastMeasureEnd: boolean;

  // Note Operations
  insertNote: (pitchName: PitchName) => boolean;
  insertRest: () => boolean;
  deleteNote: () => boolean;
  changePitch: (direction: "up" | "down") => void;
  changeOctave: (direction: "up" | "down") => void;
  applyAccidental: (accidental: Accidental | undefined) => void;
  toggleTie: () => void;

  // Duration
  setDuration: (duration: DurationValue) => void;
  changeDurationOfSelected: (duration: DurationValue) => void;
  /** Whether dotted mode is active (next inserted note will be dotted) */
  dottedMode: boolean;
  /** Toggle dotted mode on/off */
  toggleDottedMode: () => void;

  // Navigation
  moveCursor: (direction: "left" | "right" | "start" | "end") => void;
  selectNote: (noteId: string) => void;
  clearSelection: () => void;

  // Measure Operations
  addMeasure: () => void;
  deleteMeasure: () => void;
  fillMeasureWithRests: () => void;

  // Score Settings
  setClef: (clef: Clef) => void;
  /** Change clef with optional transposition (in octaves, e.g., -1 = octave down) */
  setClefWithTransposition: (clef: Clef, transposeOctaves: number) => void;
  /** Check if score has any actual notes (not just rests) */
  hasActualNotes: () => boolean;
  setKeySignature: (key: KeySignature) => void;
  /** Change key signature with transposition (in semitones) */
  setKeySignatureWithTransposition: (
    key: KeySignature,
    transposeSemitones: number,
  ) => void;
  /** Change time signature (only allowed when no notes exist, returns false if blocked) */
  setTimeSignature: (timeSig: TimeSignature) => boolean;
  setTempo: (tempo: number) => void;
  setTitle: (title: string) => void;

  // Undo/Redo
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;

  // Score Management
  newScore: () => void;
  loadScore: (score: ComposerScore) => void;
  getScore: () => ComposerScore;
  isDirty: boolean;
  markClean: () => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useComposerState(
  initialScore?: ComposerScore,
): UseComposerStateReturn {
  const [state, setState] = useState<ComposerState>(() =>
    createInitialState(initialScore),
  );

  const undoManager = useComposerUndo(100);

  // Ref to track cursor position for rapid consecutive inserts
  // This is updated synchronously so multiple inserts in the same render cycle work correctly
  const cursorRef = useRef(state.cursor);

  // Ref to suppress the "add measure" prompt after deleteMeasure
  const suppressAddMeasurePromptRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    cursorRef.current = state.cursor;
  }, [state.cursor]);

  // ==========================================================================
  // Derived State
  // ==========================================================================

  const score = state.score;
  const cursor = state.cursor;

  const selectedNote = useMemo((): Note | null => {
    if (!state.selectedNoteId) return null;
    for (const measure of score.measures) {
      const note = measure.notes.find((n) => n.id === state.selectedNoteId);
      if (note) return note;
    }
    return null;
  }, [score.measures, state.selectedNoteId]);

  const currentMeasureValidation = useMemo((): MeasureValidation => {
    const measure = score.measures[cursor.measureIndex];
    if (!measure) {
      return {
        isComplete: true,
        expectedDuration: getBeatsPerMeasure(score.timeSignature),
        actualDuration: 0,
        difference: 0,
      };
    }
    return validateMeasure(measure, score.timeSignature);
  }, [score.measures, cursor.measureIndex, score.timeSignature]);

  const allMeasuresValid = useMemo((): boolean => {
    return score.measures.every(
      (m) => validateMeasure(m, score.timeSignature).isComplete,
    );
  }, [score.measures, score.timeSignature]);

  // ==========================================================================
  // Helper: Update Score with Dirty Flag
  // ==========================================================================

  const updateScore = useCallback(
    (updater: (score: ComposerScore) => ComposerScore) => {
      setState((prev) => ({
        ...prev,
        score: updater(prev.score),
        isDirty: true,
      }));
    },
    [],
  );

  // ==========================================================================
  // Note Operations
  // ==========================================================================

  const insertNote = useCallback(
    (pitchName: PitchName): boolean => {
      // Get current cursor position
      const currentCursor = cursorRef.current;
      const measure = state.score.measures[currentCursor.measureIndex];
      if (!measure) return false;

      // Determine if we're in replace mode (cursor is on an existing note)
      const isReplaceMode = currentCursor.noteIndex < measure.notes.length;

      // Get MIDI pitch - use smart octave based on last pitched note or staff center
      const targetCursor = {
        measureIndex: currentCursor.measureIndex,
        noteIndex: currentCursor.noteIndex,
      };
      const previousPitchedNote = getLastPitchedNoteBefore(
        targetCursor,
        state.score,
      );
      const referenceMidi =
        previousPitchedNote?.midi ?? STAFF_CENTER_MIDI[state.score.clef];

      const { midi, accidental } = getNearestMidiForPitch(
        pitchName,
        referenceMidi,
        state.score.keySignature,
      );

      const note = createNote(midi, state.selectedDuration, {
        accidental,
        dotted: state.dottedMode || undefined,
      });

      if (isReplaceMode) {
        // Replace mode: replace note at cursor position
        const replaceResult = replaceNoteAtIndex(
          measure,
          currentCursor.noteIndex,
          note,
          state.score.timeSignature,
        );

        // TODO: Handle overflow (note extends past measure) - could prompt for new measure

        // Record action for undo (using insert action for now, could create replace action)
        const action = createInsertNoteAction(targetCursor, note);
        undoManager.pushAction(action);

        // Move cursor to next note position after the inserted note
        const newNoteIndex = replaceResult.insertedIndex + 1;
        let newCursor: CursorPosition;

        if (newNoteIndex >= replaceResult.notes.length) {
          // Filled this measure - move to next measure if it exists
          const nextMeasureIndex = currentCursor.measureIndex + 1;
          if (nextMeasureIndex < state.score.measures.length) {
            newCursor = {
              measureIndex: nextMeasureIndex,
              noteIndex: 0,
            };
          } else {
            // No next measure - stay at end of current measure
            newCursor = {
              measureIndex: currentCursor.measureIndex,
              noteIndex: replaceResult.notes.length - 1,
            };
          }
        } else {
          // Still room in this measure
          newCursor = {
            measureIndex: currentCursor.measureIndex,
            noteIndex: newNoteIndex,
          };
        }
        cursorRef.current = newCursor;

        setState((prev) => {
          const newMeasures = prev.score.measures.map((m, i) =>
            i === currentCursor.measureIndex
              ? { ...m, notes: replaceResult.notes }
              : m,
          );

          return {
            ...prev,
            score: {
              ...prev.score,
              measures: newMeasures,
              updatedAt: new Date().toISOString(),
            },
            cursor: newCursor,
            // Select the inserted note (for delete to work on it)
            // Cursor is past it for next insertion
            selectedNoteId: note.id,
            isDirty: true,
          };
        });

        return true;
      } else {
        // Legacy insert mode (cursor past end of notes) - shouldn't happen with pre-filled measures
        // but keep for backward compatibility

        // Check if note fits in this measure
        if (
          wouldOverflow(
            measure,
            state.selectedDuration,
            state.score.timeSignature,
            state.dottedMode,
          )
        ) {
          return false;
        }

        const action = createInsertNoteAction(targetCursor, note);
        undoManager.pushAction(action);

        const newCursor = {
          measureIndex: currentCursor.measureIndex,
          noteIndex: currentCursor.noteIndex + 1,
        };
        cursorRef.current = newCursor;

        setState((prev) => {
          const newMeasures = prev.score.measures.map((m, i) =>
            i === currentCursor.measureIndex
              ? {
                  ...m,
                  notes: [
                    ...m.notes.slice(0, currentCursor.noteIndex),
                    note,
                    ...m.notes.slice(currentCursor.noteIndex),
                  ],
                }
              : m,
          );

          return {
            ...prev,
            score: {
              ...prev.score,
              measures: newMeasures,
              updatedAt: new Date().toISOString(),
            },
            cursor: newCursor,
            selectedNoteId: note.id,
            isDirty: true,
          };
        });

        return true;
      }
    },
    [
      state.score,
      state.selectedDuration,
      state.dottedMode,
      state.selectedOctave,
      undoManager,
    ],
  );

  const insertRest = useCallback((): boolean => {
    // Get current cursor position
    const currentCursor = cursorRef.current;
    const measure = state.score.measures[currentCursor.measureIndex];
    if (!measure) return false;

    // Determine if we're in replace mode (cursor is on an existing note)
    const isReplaceMode = currentCursor.noteIndex < measure.notes.length;

    const rest = createRest(
      state.selectedDuration,
      state.dottedMode || undefined,
    );

    if (isReplaceMode) {
      // Replace mode: replace note at cursor position
      const replaceResult = replaceNoteAtIndex(
        measure,
        currentCursor.noteIndex,
        rest,
        state.score.timeSignature,
      );

      const targetCursor = {
        measureIndex: currentCursor.measureIndex,
        noteIndex: currentCursor.noteIndex,
      };
      const action = createInsertNoteAction(targetCursor, rest);
      undoManager.pushAction(action);

      // Move cursor to next note position after the inserted rest
      const newNoteIndex = replaceResult.insertedIndex + 1;
      let newCursor: CursorPosition;
      if (newNoteIndex >= replaceResult.notes.length) {
        // Rest filled remaining duration - move to next measure if it exists
        const nextMeasureIndex = currentCursor.measureIndex + 1;
        if (nextMeasureIndex < state.score.measures.length) {
          newCursor = { measureIndex: nextMeasureIndex, noteIndex: 0 };
        } else {
          newCursor = {
            measureIndex: currentCursor.measureIndex,
            noteIndex: replaceResult.notes.length - 1,
          };
        }
      } else {
        newCursor = {
          measureIndex: currentCursor.measureIndex,
          noteIndex: newNoteIndex,
        };
      }
      cursorRef.current = newCursor;

      setState((prev) => {
        const newMeasures = prev.score.measures.map((m, i) =>
          i === currentCursor.measureIndex
            ? { ...m, notes: replaceResult.notes }
            : m,
        );

        return {
          ...prev,
          score: {
            ...prev.score,
            measures: newMeasures,
            updatedAt: new Date().toISOString(),
          },
          cursor: newCursor,
          selectedNoteId: rest.id,
          isDirty: true,
        };
      });

      return true;
    } else {
      // Legacy insert mode - shouldn't happen with pre-filled measures
      if (
        wouldOverflow(
          measure,
          state.selectedDuration,
          state.score.timeSignature,
          state.dottedMode,
        )
      ) {
        return false;
      }

      const targetCursor = {
        measureIndex: currentCursor.measureIndex,
        noteIndex: currentCursor.noteIndex,
      };
      const action = createInsertNoteAction(targetCursor, rest);
      undoManager.pushAction(action);

      const newCursor = {
        measureIndex: currentCursor.measureIndex,
        noteIndex: currentCursor.noteIndex + 1,
      };
      cursorRef.current = newCursor;

      setState((prev) => {
        const newMeasures = prev.score.measures.map((m, i) =>
          i === currentCursor.measureIndex
            ? {
                ...m,
                notes: [
                  ...m.notes.slice(0, currentCursor.noteIndex),
                  rest,
                  ...m.notes.slice(currentCursor.noteIndex),
                ],
              }
            : m,
        );

        return {
          ...prev,
          score: {
            ...prev.score,
            measures: newMeasures,
            updatedAt: new Date().toISOString(),
          },
          cursor: newCursor,
          selectedNoteId: rest.id,
          isDirty: true,
        };
      });

      return true;
    }
  }, [state.score, state.selectedDuration, state.dottedMode, undoManager]);

  const deleteNote = useCallback((): boolean => {
    // Helper to find previous note/rest (any element) before a position
    const findPreviousNote = (
      startMeasure: number,
      startNote: number,
    ): { note: Note; position: CursorPosition } | null => {
      let mi = startMeasure;
      let ni = startNote - 1;

      while (mi >= 0) {
        const measure = state.score.measures[mi];
        if (ni >= 0 && measure.notes[ni]) {
          return {
            note: measure.notes[ni],
            position: { measureIndex: mi, noteIndex: ni },
          };
        }
        mi--;
        if (mi >= 0) {
          ni = state.score.measures[mi].notes.length - 1;
        }
      }
      return null;
    };

    // Determine the current note (from selection or cursor)
    let currentPosition: CursorPosition = state.cursor;
    let currentNote: Note | null = null;

    if (state.selectedNoteId) {
      const position = findNotePosition(state.selectedNoteId, state.score);
      if (position) {
        currentPosition = position;
        currentNote =
          state.score.measures[position.measureIndex]?.notes[
            position.noteIndex
          ] || null;
      }
    }

    if (!currentNote) {
      currentNote = getNoteAtCursor(state.cursor, state.score);
      currentPosition = state.cursor;
    }

    if (!currentNote) {
      return false; // Nothing at cursor
    }

    // If current note is a REST: just move selection left (like left arrow)
    if (currentNote.midi === null) {
      const prev = findPreviousNote(
        currentPosition.measureIndex,
        currentPosition.noteIndex,
      );
      if (prev) {
        setState((prevState) => ({
          ...prevState,
          cursor: prev.position,
          selectedNoteId: prev.note.id,
        }));
        cursorRef.current = prev.position;
        return true;
      }
      return false; // At beginning, nothing to do
    }

    // Current note is PITCHED: delete it, replace with rests, select previous
    const action = createDeleteNoteAction(currentPosition, currentNote);
    undoManager.pushAction(action);

    // Get the measure and calculate where to insert replacement rests
    const measure = state.score.measures[currentPosition.measureIndex];
    // Use getNoteDuration to account for dotted notes
    const deletedDuration = getNoteDuration(currentNote);
    const beatPosition = getBeatPositionAt(measure, currentPosition.noteIndex);

    // Generate rests to replace the deleted note (respecting half-measure boundary)
    const replacementRests = generateRestsForDurationAtPosition(
      deletedDuration,
      beatPosition,
      state.score.timeSignature,
    );

    // After deletion:
    // - Cursor stays at the deleted position (now a rest) so next insert fills that spot
    // - Selection is the replacement rest - this aligns cursor and selection
    //   so what user sees selected matches where insert will happen
    const newCursor = currentPosition;
    const newSelectedId = replacementRests[0]?.id || null;

    // Update cursorRef BEFORE setState to avoid race conditions
    cursorRef.current = newCursor;

    setState((prevState) => {
      const newMeasures = prevState.score.measures.map((m, i) => {
        if (i !== currentPosition.measureIndex) return m;

        // Replace the deleted note with rests
        const newNotes = [
          ...m.notes.slice(0, currentPosition.noteIndex),
          ...replacementRests,
          ...m.notes.slice(currentPosition.noteIndex + 1),
        ];
        return { ...m, notes: newNotes };
      });

      return {
        ...prevState,
        score: {
          ...prevState.score,
          measures: newMeasures,
          updatedAt: new Date().toISOString(),
        },
        cursor: newCursor,
        selectedNoteId: newSelectedId,
        isDirty: true,
      };
    });

    return true;
  }, [state.cursor, state.score, state.selectedNoteId, undoManager]);

  const changePitch = useCallback(
    (direction: "up" | "down") => {
      if (!state.selectedNoteId) return;

      const position = findNotePosition(state.selectedNoteId, state.score);
      if (!position) return;

      const note =
        state.score.measures[position.measureIndex]?.notes[position.noteIndex];
      if (!note || note.midi === null) return; // Can't change pitch of rest

      const newMidi =
        direction === "up"
          ? getNextDiatonicPitch(note.midi)
          : getPreviousDiatonicPitch(note.midi);

      if (!isValidMidi(newMidi)) return;

      const action = createChangePitchAction(
        position,
        note.id,
        note.midi,
        newMidi,
      );
      undoManager.pushAction(action);

      updateScore((score) => ({
        ...score,
        measures: score.measures.map((m, mi) =>
          mi === position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === note.id ? { ...n, midi: newMidi } : n,
                ),
              }
            : m,
        ),
      }));
    },
    [state.selectedNoteId, state.score, undoManager, updateScore],
  );

  const changeOctave = useCallback(
    (direction: "up" | "down") => {
      if (!state.selectedNoteId) {
        // Change selected octave for new notes
        setState((prev) => {
          const newOctave = shiftOctave(prev.selectedOctave, direction);
          // Clamp to valid MIDI range (C0=12 to C8=108)
          if (!isValidMidi(newOctave)) return prev;
          return {
            ...prev,
            selectedOctave: newOctave,
          };
        });
        return;
      }

      const position = findNotePosition(state.selectedNoteId, state.score);
      if (!position) return;

      const note =
        state.score.measures[position.measureIndex]?.notes[position.noteIndex];
      if (!note || note.midi === null) return;

      const newMidi = shiftOctave(note.midi, direction);
      if (!isValidMidi(newMidi)) return;

      const action = createChangePitchAction(
        position,
        note.id,
        note.midi,
        newMidi,
      );
      undoManager.pushAction(action);

      updateScore((score) => ({
        ...score,
        measures: score.measures.map((m, mi) =>
          mi === position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === note.id ? { ...n, midi: newMidi } : n,
                ),
              }
            : m,
        ),
      }));
    },
    [state.selectedNoteId, state.score, undoManager, updateScore],
  );

  const applyAccidental = useCallback(
    (accidental: Accidental | undefined) => {
      if (!state.selectedNoteId) return;

      const position = findNotePosition(state.selectedNoteId, state.score);
      if (!position) return;

      const note =
        state.score.measures[position.measureIndex]?.notes[position.noteIndex];
      if (!note || note.midi === null) return;

      // Calculate the base MIDI (the pitch without any accidental)
      // by reversing the effect of the current accidental
      let baseMidi = note.midi;
      if (note.accidental === "double-sharp") baseMidi -= 2;
      else if (note.accidental === "sharp") baseMidi -= 1;
      else if (note.accidental === "flat") baseMidi += 1;
      else if (note.accidental === "double-flat") baseMidi += 2;
      // "natural" means the note is at its unaltered pitch

      // Calculate new MIDI by applying the new accidental to the base
      const noteName = midiToNoteName(baseMidi);
      const octave = midiToOctave(baseMidi);
      const newMidi = noteToMidi(noteName, octave, accidental);

      const action = createApplyAccidentalAction(
        position,
        note.id,
        note.accidental,
        accidental,
        note.midi,
        newMidi,
      );
      undoManager.pushAction(action);

      updateScore((score) => ({
        ...score,
        measures: score.measures.map((m, mi) =>
          mi === position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === note.id ? { ...n, accidental, midi: newMidi } : n,
                ),
              }
            : m,
        ),
      }));
    },
    [state.selectedNoteId, state.score, undoManager, updateScore],
  );

  const toggleTie = useCallback(() => {
    if (!state.selectedNoteId) return;

    const position = findNotePosition(state.selectedNoteId, state.score);
    if (!position) return;

    const note =
      state.score.measures[position.measureIndex]?.notes[position.noteIndex];
    if (!note || note.midi === null) return; // Can't tie rests

    const newTieStart = !note.tieStart;

    // Find the next note with matching pitch
    let nextNotePosition: { measureIndex: number; noteIndex: number } | null =
      null;
    let nextNote: Note | null = null;

    // Check in same measure first
    const currentMeasure = state.score.measures[position.measureIndex];
    if (position.noteIndex + 1 < currentMeasure.notes.length) {
      const candidate = currentMeasure.notes[position.noteIndex + 1];
      if (candidate.midi === note.midi) {
        nextNotePosition = {
          measureIndex: position.measureIndex,
          noteIndex: position.noteIndex + 1,
        };
        nextNote = candidate;
      }
    }

    // Check next measure if not found
    if (!nextNote && position.measureIndex + 1 < state.score.measures.length) {
      const nextMeasure = state.score.measures[position.measureIndex + 1];
      if (nextMeasure.notes.length > 0) {
        const candidate = nextMeasure.notes[0];
        if (candidate.midi === note.midi) {
          nextNotePosition = {
            measureIndex: position.measureIndex + 1,
            noteIndex: 0,
          };
          nextNote = candidate;
        }
      }
    }

    const action = createToggleTieAction(
      position,
      note.id,
      "start",
      !!note.tieStart,
      newTieStart,
    );
    undoManager.pushAction(action);

    updateScore((score) => ({
      ...score,
      measures: score.measures
        .map((m, mi) => {
          // Update the selected note's tieStart
          if (mi === position.measureIndex) {
            return {
              ...m,
              notes: m.notes.map((n) =>
                n.id === note.id ? { ...n, tieStart: newTieStart } : n,
              ),
            };
          }
          // Update the next note's tieEnd (if in different measure)
          if (
            nextNote &&
            nextNotePosition &&
            mi === nextNotePosition.measureIndex &&
            mi !== position.measureIndex
          ) {
            return {
              ...m,
              notes: m.notes.map((n) =>
                n.id === nextNote!.id ? { ...n, tieEnd: newTieStart } : n,
              ),
            };
          }
          return m;
        })
        .map((m, mi) => {
          // Handle case where next note is in the same measure
          if (
            nextNote &&
            nextNotePosition &&
            mi === position.measureIndex &&
            nextNotePosition.measureIndex === position.measureIndex
          ) {
            return {
              ...m,
              notes: m.notes.map((n) => {
                if (n.id === note.id) return { ...n, tieStart: newTieStart };
                if (n.id === nextNote!.id) return { ...n, tieEnd: newTieStart };
                return n;
              }),
            };
          }
          return m;
        }),
    }));
  }, [state.selectedNoteId, state.score, undoManager, updateScore]);

  // ==========================================================================
  // Duration
  // ==========================================================================

  const setDuration = useCallback((duration: DurationValue) => {
    setState((prev) => ({ ...prev, selectedDuration: duration }));
  }, []);

  const toggleDottedMode = useCallback(() => {
    setState((prev) => ({ ...prev, dottedMode: !prev.dottedMode }));
  }, []);

  const changeDurationOfSelected = useCallback(
    (duration: DurationValue) => {
      if (!state.selectedNoteId) return;

      const position = findNotePosition(state.selectedNoteId, state.score);
      if (!position) return;

      const note =
        state.score.measures[position.measureIndex]?.notes[position.noteIndex];
      if (!note) return;

      // Check if new duration would overflow
      const measure = state.score.measures[position.measureIndex];
      const currentDuration = getMeasureDuration(measure);
      const newTotalDuration = currentDuration - note.duration + duration;
      const maxDuration = getBeatsPerMeasure(state.score.timeSignature);

      if (newTotalDuration > maxDuration + 0.001) return;

      const action = createChangeDurationAction(
        position,
        note.id,
        note.duration,
        duration,
      );
      undoManager.pushAction(action);

      updateScore((score) => ({
        ...score,
        measures: score.measures.map((m, mi) =>
          mi === position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === note.id ? { ...n, duration } : n,
                ),
              }
            : m,
        ),
      }));
    },
    [state.selectedNoteId, state.score, undoManager, updateScore],
  );

  // ==========================================================================
  // Navigation
  // ==========================================================================

  const moveCursor = useCallback(
    (direction: "left" | "right" | "start" | "end") => {
      setState((prev) => {
        let newCursor: CursorPosition;
        switch (direction) {
          case "left":
            newCursor = moveCursorLeft(prev.cursor, prev.score);
            // If we were past the selected note and moving left lands on it,
            // the user expects to go to the PREVIOUS note since the current
            // note was already visually selected
            {
              const currentNote = getNoteAtCursor(prev.cursor, prev.score);
              const noteAtNewCursor = getNoteAtCursor(newCursor, prev.score);
              // Only skip if: (1) cursor was past all notes (no note at cursor),
              // (2) we had a selection, and (3) moving left lands on that selection
              if (
                !currentNote &&
                noteAtNewCursor &&
                noteAtNewCursor.id === prev.selectedNoteId
              ) {
                newCursor = moveCursorLeft(newCursor, prev.score);
              }
            }
            break;
          case "right":
            newCursor = moveCursorRight(prev.cursor, prev.score);
            break;
          case "start":
            newCursor = moveCursorToStart();
            break;
          case "end":
            newCursor = moveCursorToEnd(prev.score);
            break;
        }

        // Auto-select note at new position
        const noteAtCursor = getNoteAtCursor(newCursor, prev.score);
        return {
          ...prev,
          cursor: newCursor,
          selectedNoteId: noteAtCursor?.id ?? null,
        };
      });
    },
    [],
  );

  const selectNote = useCallback((noteId: string) => {
    setState((prev) => {
      const position = findNotePosition(noteId, prev.score);
      if (!position) return prev;
      return {
        ...prev,
        cursor: position,
        selectedNoteId: noteId,
      };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState((prev) => ({ ...prev, selectedNoteId: null }));
  }, []);

  // ==========================================================================
  // Measure Operations
  // ==========================================================================

  const addMeasure = useCallback(() => {
    const newMeasure = createMeasure(state.score.timeSignature);
    // Always add at the END of the score
    const insertIndex = state.score.measures.length;

    const action = createAddMeasureAction(insertIndex, newMeasure);
    undoManager.pushAction(action);

    // Move cursor to the first note of the new measure
    const newCursor = { measureIndex: insertIndex, noteIndex: 0 };
    cursorRef.current = newCursor;

    setState((prev) => ({
      ...prev,
      score: {
        ...prev.score,
        measures: [...prev.score.measures, newMeasure],
        updatedAt: new Date().toISOString(),
      },
      cursor: newCursor,
      selectedNoteId: newMeasure.notes[0]?.id ?? null,
      isDirty: true,
    }));
  }, [state.score.measures.length, state.score.timeSignature, undoManager]);

  const deleteMeasure = useCallback(() => {
    // Can't delete the last measure
    if (state.score.measures.length <= 1) return;

    const measureIndex = state.cursor.measureIndex;
    const deletedMeasure = state.score.measures[measureIndex];

    const action = createDeleteMeasureAction(measureIndex, deletedMeasure);
    undoManager.pushAction(action);

    // Suppress the "add measure" prompt since we just deleted
    suppressAddMeasurePromptRef.current = true;

    setState((prev) => {
      const newMeasures = prev.score.measures.filter(
        (_, i) => i !== measureIndex,
      );

      // After deletion, go to the LAST note/rest of the previous measure
      // (or the first measure if we deleted measure 0)
      const targetMeasureIndex = measureIndex > 0 ? measureIndex - 1 : 0;
      const targetMeasure = newMeasures[targetMeasureIndex];
      const lastNoteIndex = targetMeasure.notes.length - 1;
      const lastNote = targetMeasure.notes[lastNoteIndex];

      const newCursor = {
        measureIndex: targetMeasureIndex,
        noteIndex: Math.max(0, lastNoteIndex),
      };
      cursorRef.current = newCursor;

      return {
        ...prev,
        score: {
          ...prev.score,
          measures: newMeasures,
          updatedAt: new Date().toISOString(),
        },
        cursor: newCursor,
        selectedNoteId: lastNote?.id || null,
        isDirty: true,
      };
    });
  }, [state.score.measures.length, state.cursor.measureIndex, undoManager]);

  const fillMeasureWithRests = useCallback(() => {
    const measure = state.score.measures[state.cursor.measureIndex];
    if (!measure) return;

    const validation = validateMeasure(measure, state.score.timeSignature);
    if (validation.isComplete || validation.difference >= 0) return;

    const remaining = -validation.difference;
    // This is a simplified version - just add one rest of the remaining duration
    // A full implementation would break it into standard note values
    const rest = createRest(remaining as DurationValue);

    updateScore((score) => ({
      ...score,
      measures: score.measures.map((m, i) =>
        i === state.cursor.measureIndex
          ? { ...m, notes: [...m.notes, rest] }
          : m,
      ),
    }));
  }, [state.score, state.cursor.measureIndex, updateScore]);

  // ==========================================================================
  // Score Settings
  // ==========================================================================

  const setClef = useCallback(
    (clef: Clef) => {
      const prevClef = state.score.clef;
      if (clef === prevClef) return;

      undoManager.pushAction({
        type: "CHANGE_CLEF",
        previousClef: prevClef,
        newClef: clef,
      });

      setState((prev) => ({
        ...prev,
        score: { ...prev.score, clef, updatedAt: new Date().toISOString() },
        selectedOctave: DEFAULT_OCTAVE_MIDI[clef],
        isDirty: true,
      }));
    },
    [state.score.clef, undoManager],
  );

  // Check if score has any actual notes (not just rests)
  const hasActualNotes = useCallback((): boolean => {
    return state.score.measures.some((measure) =>
      measure.notes.some((note) => note.midi !== null),
    );
  }, [state.score.measures]);

  // Change clef with optional transposition
  const setClefWithTransposition = useCallback(
    (clef: Clef, transposeOctaves: number) => {
      const prevClef = state.score.clef;
      if (clef === prevClef && transposeOctaves === 0) return;

      // Record the action for undo
      // Note: For simplicity, we don't track the full transpose in undo
      // A full implementation would need a complex action type
      undoManager.pushAction({
        type: "CHANGE_CLEF",
        previousClef: prevClef,
        newClef: clef,
      });

      setState((prev) => {
        // Transpose all notes by the specified octaves
        const semitoneShift = transposeOctaves * 12;
        const newMeasures = prev.score.measures.map((measure) => ({
          ...measure,
          notes: measure.notes.map((note) => {
            if (note.midi === null) return note; // Keep rests unchanged
            const newMidi = note.midi + semitoneShift;
            // Clamp to valid MIDI range (0-127)
            if (newMidi < 0 || newMidi > 127) return note;
            return { ...note, midi: newMidi };
          }),
        }));

        return {
          ...prev,
          score: {
            ...prev.score,
            clef,
            measures: newMeasures,
            updatedAt: new Date().toISOString(),
          },
          selectedOctave: DEFAULT_OCTAVE_MIDI[clef],
          isDirty: true,
        };
      });
    },
    [state.score.clef, undoManager],
  );

  const setKeySignature = useCallback(
    (key: KeySignature) => {
      const prevKey = state.score.keySignature;
      if (key === prevKey) return;

      undoManager.pushAction({
        type: "CHANGE_KEY_SIGNATURE",
        previousKey: prevKey,
        newKey: key,
      });

      updateScore((score) => ({ ...score, keySignature: key }));
    },
    [state.score.keySignature, undoManager, updateScore],
  );

  // Change key signature with transposition
  const setKeySignatureWithTransposition = useCallback(
    (key: KeySignature, transposeSemitones: number) => {
      const prevKey = state.score.keySignature;
      if (key === prevKey && transposeSemitones === 0) return;

      undoManager.pushAction({
        type: "CHANGE_KEY_SIGNATURE",
        previousKey: prevKey,
        newKey: key,
      });

      setState((prev) => {
        const newMeasures = prev.score.measures.map((measure) => ({
          ...measure,
          notes: measure.notes.map((note) => {
            if (note.midi === null) return note; // Keep rests unchanged

            if (transposeSemitones === 0) {
              // Keep pitch, just recalculate accidental for new key
              const newAccidental = getAccidentalForMidi(note.midi, key);
              return {
                ...note,
                accidental: newAccidental,
              };
            }

            // Use function-preserving transposition
            // This preserves the note's scale degree and alteration when changing keys
            const transposed = transposeNoteByFunction(
              note.midi,
              note.accidental,
              prev.score.keySignature,
              key,
              transposeSemitones,
            );

            // Clamp to valid MIDI range (0-127)
            if (transposed.midi < 0 || transposed.midi > 127) return note;

            return {
              ...note,
              midi: transposed.midi,
              accidental: transposed.accidental,
            };
          }),
        }));

        return {
          ...prev,
          score: {
            ...prev.score,
            keySignature: key,
            measures: newMeasures,
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        };
      });
    },
    [state.score.keySignature, undoManager],
  );

  const setTimeSignature = useCallback(
    (timeSig: TimeSignature): boolean => {
      // Disallow changing time signature if there are actual notes
      // (This is a lightweight tool - no re-barring/reflow support)
      if (hasActualNotes()) {
        return false;
      }

      const prevTimeSig = state.score.timeSignature;
      if (
        timeSig.beats === prevTimeSig.beats &&
        timeSig.beatUnit === prevTimeSig.beatUnit
      ) {
        return true; // No change needed
      }

      undoManager.pushAction({
        type: "CHANGE_TIME_SIGNATURE",
        previousTimeSig: prevTimeSig,
        newTimeSig: timeSig,
      });

      // Recreate measures with new time signature (pre-filled with appropriate rests)
      setState((prev) => {
        const newMeasures = prev.score.measures.map(() =>
          createMeasure(timeSig),
        );
        return {
          ...prev,
          score: {
            ...prev.score,
            timeSignature: timeSig,
            measures: newMeasures,
            updatedAt: new Date().toISOString(),
          },
          cursor: { measureIndex: 0, noteIndex: 0 },
          selectedNoteId: newMeasures[0]?.notes[0]?.id ?? null,
          isDirty: true,
        };
      });

      return true;
    },
    [state.score.timeSignature, undoManager, hasActualNotes],
  );

  const setTempo = useCallback(
    (tempo: number) => {
      const prevTempo = state.score.tempo;
      if (tempo === prevTempo) return;

      undoManager.pushAction({
        type: "CHANGE_TEMPO",
        previousTempo: prevTempo,
        newTempo: tempo,
      });

      updateScore((score) => ({ ...score, tempo }));
    },
    [state.score.tempo, undoManager, updateScore],
  );

  const setTitle = useCallback(
    (title: string) => {
      const prevTitle = state.score.title;
      if (title === prevTitle) return;

      undoManager.pushAction({
        type: "CHANGE_TITLE",
        previousTitle: prevTitle,
        newTitle: title,
      });

      updateScore((score) => ({ ...score, title }));
    },
    [state.score.title, undoManager, updateScore],
  );

  // ==========================================================================
  // Undo/Redo
  // ==========================================================================

  const undo = useCallback(() => {
    const action = undoManager.popUndo();
    if (!action) return;

    setState((prev) => ({
      ...prev,
      score: reverseAction(prev.score, action),
      isDirty: true,
    }));
    undoManager.pushRedo(action);
  }, [undoManager]);

  const redo = useCallback(() => {
    const action = undoManager.popRedo();
    if (!action) return;

    setState((prev) => ({
      ...prev,
      score: reapplyAction(prev.score, action),
      isDirty: true,
    }));
    undoManager.pushAction(action);
  }, [undoManager]);

  // ==========================================================================
  // Score Management
  // ==========================================================================

  const newScore = useCallback(() => {
    setState(createInitialState());
    undoManager.clearHistory();
  }, [undoManager]);

  const loadScore = useCallback(
    (score: ComposerScore) => {
      setState(createInitialState(score));
      undoManager.clearHistory();
    },
    [undoManager],
  );

  const getScore = useCallback((): ComposerScore => state.score, [state.score]);

  const markClean = useCallback(() => {
    setState((prev) => ({ ...prev, isDirty: false }));
  }, []);

  // ==========================================================================
  // Computed: isAtLastMeasureEnd
  // ==========================================================================

  const isAtLastMeasureEnd = useMemo(() => {
    // Check if we should suppress the prompt (e.g., after deleteMeasure)
    if (suppressAddMeasurePromptRef.current) {
      suppressAddMeasurePromptRef.current = false; // Clear for next time
      return false;
    }

    const lastMeasureIndex = state.score.measures.length - 1;
    if (state.cursor.measureIndex !== lastMeasureIndex) return false;
    const lastMeasure = state.score.measures[lastMeasureIndex];
    if (!lastMeasure || lastMeasure.notes.length === 0) return false;

    // The selected note must be the last note in the measure
    // This means the user explicitly placed something at the end (not just auto-filled rests)
    const lastNote = lastMeasure.notes[lastMeasure.notes.length - 1];
    const selectedIsLastNote = state.selectedNoteId === lastNote.id;

    // Also require that the measure has at least one pitched note
    // (don't prompt for new measure if it's all rests)
    const hasPitchedNote = lastMeasure.notes.some((n) => n.midi !== null);

    return selectedIsLastNote && hasPitchedNote;
  }, [state.cursor, state.score.measures, state.selectedNoteId]);

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    // State
    state,
    score,
    cursor,
    selectedNote,

    // Validation
    currentMeasureValidation,
    allMeasuresValid,

    // Cursor Position
    isAtLastMeasureEnd,

    // Note Operations
    insertNote,
    insertRest,
    deleteNote,
    changePitch,
    changeOctave,
    applyAccidental,
    toggleTie,

    // Duration
    setDuration,
    changeDurationOfSelected,
    dottedMode: state.dottedMode,
    toggleDottedMode,

    // Navigation
    moveCursor,
    selectNote,
    clearSelection,

    // Measure Operations
    addMeasure,
    deleteMeasure,
    fillMeasureWithRests,

    // Score Settings
    setClef,
    setClefWithTransposition,
    hasActualNotes,
    setKeySignature,
    setKeySignatureWithTransposition,
    setTimeSignature,
    setTempo,
    setTitle,

    // Undo/Redo
    canUndo: undoManager.canUndo,
    canRedo: undoManager.canRedo,
    undo,
    redo,

    // Score Management
    newScore,
    loadScore,
    getScore,
    isDirty: state.isDirty,
    markClean,
  };
}
