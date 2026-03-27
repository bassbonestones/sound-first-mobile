/**
 * useTuneComposerNotes Hook
 *
 * Manages note editing operations for the Tune Composer.
 * Handles note insertion, deletion, pitch changes, accidentals, ties,
 * and rhythm change confirmation when notes affect chords/lyrics.
 *
 * This hook is composed by useTuneComposerState and should not be used directly.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Accidental,
  ChordSymbol,
  CursorPosition,
  DurationValue,
  Note,
  PitchName,
  TuneComposerScore,
  TuneComposerState,
} from "../types";
import {
  createNote,
  createRest,
  STAFF_CENTER_MIDI,
  getNoteDuration,
  wouldOverflow,
  replaceNoteAtIndex,
  generateRestsForDurationAtPosition,
  getBeatPositionAt,
  getBeatsPerMeasure,
  getMeasureDuration,
  getChordsForMeasure,
  getActiveProgression,
} from "../types";
import {
  createInsertNoteAction,
  createDeleteNoteAction,
  createChangePitchAction,
  createChangeDurationAction,
  createApplyAccidentalAction,
  createToggleTieAction,
} from "../types/actionTypes";
import {
  findNotePosition,
  getNoteAtCursor,
  getLastPitchedNoteBefore,
  moveCursorLeft,
} from "../../composer/utils/cursorUtils";
import {
  getNearestMidiForPitch,
  getNextDiatonicPitch,
  getPreviousDiatonicPitch,
  isValidMidi,
  shiftOctave,
  midiToNoteName,
  midiToOctave,
  noteToMidi,
} from "../../composer/utils/pitchUtils";
import type { UseTuneComposerUndoReturn } from "./useTuneComposerUndo";

// =============================================================================
// Types
// =============================================================================

/** Type of rhythm change pending confirmation */
export type PendingRhythmChangeType =
  | { kind: "insertNote"; pitchName: PitchName }
  | { kind: "insertRest" }
  | { kind: "deleteNote" }
  | { kind: "changeDuration"; duration: DurationValue };

/** Pending rhythm change awaiting user confirmation */
export interface PendingRhythmChange {
  measureIndex: number;
  hasChords: boolean;
  hasLyrics: boolean;
  changeType: PendingRhythmChangeType;
}

// =============================================================================
// Return Type
// =============================================================================

export interface UseTuneComposerNotesReturn {
  // Note Operations
  insertNote: (pitchName: PitchName) => boolean;
  insertRest: () => boolean;
  deleteNote: () => boolean;
  changePitch: (direction: "up" | "down") => void;
  changeOctave: (direction: "up" | "down") => void;
  applyAccidental: (accidental: Accidental | undefined) => void;
  toggleTie: () => void;

  // Duration - change selected note's duration
  changeDurationOfSelected: (duration: DurationValue) => void;

  // Rhythm Change Confirmation
  pendingRhythmChange: PendingRhythmChange | null;
  confirmRhythmChange: () => void;
  cancelRhythmChange: () => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useTuneComposerNotes(
  state: TuneComposerState,
  setState: React.Dispatch<React.SetStateAction<TuneComposerState>>,
  updateScore: (
    updater: (score: TuneComposerScore) => TuneComposerScore,
  ) => void,
  undoManager: UseTuneComposerUndoReturn,
  cursorRef: React.MutableRefObject<CursorPosition>,
  suppressAddMeasurePromptRef: React.MutableRefObject<boolean>,
): UseTuneComposerNotesReturn {
  const [pendingRhythmChange, setPendingRhythmChange] =
    useState<PendingRhythmChange | null>(null);

  // ===========================================================================
  // Helper: Check if Measure has Chords or Lyrics
  // ===========================================================================

  /**
   * Check if a measure has chords or lyrics that would be affected by rhythm changes.
   */
  const getMeasureChordsAndLyrics = useCallback(
    (measureIndex: number): { hasChords: boolean; hasLyrics: boolean } => {
      const measure = state.score.measures[measureIndex];
      const hasLyrics = measure?.notes.some((n) => n.lyric?.text) ?? false;

      const activeProgression = getActiveProgression(state.score);
      const chords = activeProgression?.chords ?? [];
      const measureChords = getChordsForMeasure(chords, measureIndex);
      const hasChords = measureChords.length > 0;

      return { hasChords, hasLyrics };
    },
    [state.score],
  );

  // ===========================================================================
  // Rhythm Change Confirmation Refs
  // ===========================================================================

  // Refs for insert/delete functions so confirmRhythmChange can call latest versions
  const insertNoteRef = useRef<
    ((pitchName: PitchName, skipConfirmation?: boolean) => boolean) | undefined
  >(undefined);
  const insertRestRef = useRef<
    ((skipConfirmation?: boolean) => boolean) | undefined
  >(undefined);
  const deleteNoteRef = useRef<
    ((skipConfirmation?: boolean) => boolean) | undefined
  >(undefined);
  const changeDurationRef = useRef<
    ((duration: DurationValue, skipConfirmation?: boolean) => void) | undefined
  >(undefined);

  // ===========================================================================
  // Rhythm Change Confirmation
  // ===========================================================================

  const confirmRhythmChange = useCallback(() => {
    if (!pendingRhythmChange) return;
    const { measureIndex, changeType } = pendingRhythmChange;

    // Clear the pending change first
    setPendingRhythmChange(null);

    // For duration changes, we can do clearing + change in one state update
    if (changeType.kind === "changeDuration") {
      const noteId = state.selectedNoteId;
      if (!noteId) return;

      const position = findNotePosition(noteId, state.score);
      if (!position) return;

      const note =
        state.score.measures[position.measureIndex]?.notes[position.noteIndex];
      if (!note) return;

      const newDuration = changeType.duration;

      // Push undo action
      const action = createChangeDurationAction(
        position,
        note.id,
        note.duration,
        newDuration,
      );
      undoManager.pushAction(action);

      // Do clearing AND duration change in single update
      setState((prev) => {
        // Find the active progression ID
        const activeProgId = prev.score.displaySettings?.activeProgressionId;
        const defaultProg = prev.score.chordProgressions.find(
          (p) => p.isDefault,
        );
        const targetProgId = activeProgId || defaultProg?.id;

        // Clear lyrics from notes in this measure
        const clearedMeasures = prev.score.measures.map((m, i) => {
          if (i !== measureIndex) return m;
          return {
            ...m,
            notes: m.notes.map((n) => ({ ...n, lyric: undefined })),
          };
        });

        // Clear chords for this measure from the active progression
        const clearedProgressions = prev.score.chordProgressions.map((prog) => {
          if (prog.id !== targetProgId) return prog;
          return {
            ...prog,
            chords: prog.chords.filter(
              (c: ChordSymbol) => c.measureIndex !== measureIndex,
            ),
          };
        });

        // Apply duration change
        const finalMeasures = clearedMeasures.map((m, mi) =>
          mi === position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === note.id ? { ...n, duration: newDuration } : n,
                ),
              }
            : m,
        );

        return {
          ...prev,
          score: {
            ...prev.score,
            measures: finalMeasures,
            chordProgressions: clearedProgressions,
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        };
      });
      return;
    }

    // For other changes, clear first then use refs
    setState((prev) => {
      // Find the active progression ID
      const activeProgId = prev.score.displaySettings?.activeProgressionId;
      const defaultProg = prev.score.chordProgressions.find((p) => p.isDefault);
      const targetProgId = activeProgId || defaultProg?.id;

      const newMeasures = prev.score.measures.map((m, i) => {
        if (i !== measureIndex) return m;
        return {
          ...m,
          notes: m.notes.map((n) => ({ ...n, lyric: undefined })),
        };
      });

      const newProgressions = prev.score.chordProgressions.map((prog) => {
        if (prog.id !== targetProgId) return prog;
        return {
          ...prog,
          chords: prog.chords.filter(
            (c: ChordSymbol) => c.measureIndex !== measureIndex,
          ),
        };
      });

      return {
        ...prev,
        score: {
          ...prev.score,
          measures: newMeasures,
          chordProgressions: newProgressions,
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      };
    });

    // Execute other changes after state update
    // Use requestAnimationFrame to ensure refs are updated
    requestAnimationFrame(() => {
      switch (changeType.kind) {
        case "insertNote":
          insertNoteRef.current?.(changeType.pitchName, true);
          break;
        case "insertRest":
          insertRestRef.current?.(true);
          break;
        case "deleteNote":
          deleteNoteRef.current?.(true);
          break;
      }
    });
  }, [
    pendingRhythmChange,
    state.selectedNoteId,
    state.score,
    undoManager,
    setState,
  ]);

  const cancelRhythmChange = useCallback(() => {
    setPendingRhythmChange(null);
  }, []);

  // ===========================================================================
  // Note Operations
  // ===========================================================================

  /**
   * Insert a note at the current cursor position.
   * @param pitchName The pitch name to insert
   * @param skipConfirmation If true, skip the chord/lyrics confirmation check
   */
  const insertNote = useCallback(
    (pitchName: PitchName, skipConfirmation = false): boolean => {
      const currentCursor = cursorRef.current;
      const measure = state.score.measures[currentCursor.measureIndex];
      if (!measure) return false;

      const isReplaceMode = currentCursor.noteIndex < measure.notes.length;

      // Check if measure has chords or lyrics that need confirmation (only in replace mode)
      if (isReplaceMode && !skipConfirmation) {
        const { hasChords, hasLyrics } = getMeasureChordsAndLyrics(
          currentCursor.measureIndex,
        );
        if (hasChords || hasLyrics) {
          setPendingRhythmChange({
            measureIndex: currentCursor.measureIndex,
            hasChords,
            hasLyrics,
            changeType: { kind: "insertNote", pitchName },
          });
          return false;
        }
      }

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
        const replaceResult = replaceNoteAtIndex(
          measure,
          currentCursor.noteIndex,
          note,
          state.score.timeSignature,
        );

        const action = createInsertNoteAction(targetCursor, note);
        undoManager.pushAction(action);

        const newNoteIndex = replaceResult.insertedIndex + 1;
        let newCursor: CursorPosition;

        if (newNoteIndex >= replaceResult.notes.length) {
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
            selectedNoteId: note.id,
            isDirty: true,
          };
        });

        return true;
      } else {
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
      cursorRef,
      undoManager,
      getMeasureChordsAndLyrics,
      setState,
    ],
  );

  /**
   * Insert a rest at the current cursor position.
   * @param skipConfirmation If true, skip the chord/lyrics confirmation check
   */
  const insertRest = useCallback(
    (skipConfirmation = false): boolean => {
      const currentCursor = cursorRef.current;
      const measure = state.score.measures[currentCursor.measureIndex];
      if (!measure) return false;

      const isReplaceMode = currentCursor.noteIndex < measure.notes.length;

      // Check if measure has chords or lyrics that need confirmation (only in replace mode)
      if (isReplaceMode && !skipConfirmation) {
        const { hasChords, hasLyrics } = getMeasureChordsAndLyrics(
          currentCursor.measureIndex,
        );
        if (hasChords || hasLyrics) {
          setPendingRhythmChange({
            measureIndex: currentCursor.measureIndex,
            hasChords,
            hasLyrics,
            changeType: { kind: "insertRest" },
          });
          return false;
        }
      }

      const targetCursor = {
        measureIndex: currentCursor.measureIndex,
        noteIndex: currentCursor.noteIndex,
      };

      const rest = createRest(
        state.selectedDuration,
        state.dottedMode || undefined,
      );

      if (isReplaceMode) {
        const replaceResult = replaceNoteAtIndex(
          measure,
          currentCursor.noteIndex,
          rest,
          state.score.timeSignature,
        );

        const action = createInsertNoteAction(targetCursor, rest);
        undoManager.pushAction(action);

        const newNoteIndex = replaceResult.insertedIndex + 1;
        let newCursor: CursorPosition;
        if (newNoteIndex >= replaceResult.notes.length) {
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
      }
      return false;
    },
    [
      state.score,
      state.selectedDuration,
      state.dottedMode,
      cursorRef,
      undoManager,
      getMeasureChordsAndLyrics,
      setState,
    ],
  );

  /**
   * Delete the note at the current cursor position.
   * @param skipConfirmation If true, skip the chord/lyrics confirmation check
   */
  const deleteNote = useCallback(
    (skipConfirmation = false): boolean => {
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

      if (!currentNote) return false;

      if (currentNote.midi === null) {
        // Just navigate left if on rest
        const newCursor = moveCursorLeft(currentPosition, state.score);
        if (
          newCursor.measureIndex !== currentPosition.measureIndex ||
          newCursor.noteIndex !== currentPosition.noteIndex
        ) {
          const noteAtNew = getNoteAtCursor(newCursor, state.score);
          setState((prevState) => ({
            ...prevState,
            cursor: newCursor,
            selectedNoteId: noteAtNew?.id ?? null,
          }));
          cursorRef.current = newCursor;
          return true;
        }
        return false;
      }

      // Check if measure has chords or lyrics that need confirmation
      if (!skipConfirmation) {
        const { hasChords, hasLyrics } = getMeasureChordsAndLyrics(
          currentPosition.measureIndex,
        );
        if (hasChords || hasLyrics) {
          setPendingRhythmChange({
            measureIndex: currentPosition.measureIndex,
            hasChords,
            hasLyrics,
            changeType: { kind: "deleteNote" },
          });
          return false;
        }
      }

      // Execute the delete
      const positionToDelete = currentPosition;
      const noteToDelete = currentNote;

      const action = createDeleteNoteAction(positionToDelete, noteToDelete);
      undoManager.pushAction(action);

      suppressAddMeasurePromptRef.current = true;

      const measure = state.score.measures[positionToDelete.measureIndex];
      const deletedDuration = getNoteDuration(noteToDelete);
      const beatPosition = getBeatPositionAt(
        measure,
        positionToDelete.noteIndex,
      );

      const replacementRests = generateRestsForDurationAtPosition(
        deletedDuration,
        beatPosition,
        state.score.timeSignature,
      );

      cursorRef.current = positionToDelete;

      setState((prevState) => {
        const newMeasures = prevState.score.measures.map((m, i) => {
          if (i !== positionToDelete.measureIndex) return m;

          const newNotes = [
            ...m.notes.slice(0, positionToDelete.noteIndex),
            ...replacementRests,
            ...m.notes.slice(positionToDelete.noteIndex + 1),
          ];

          return { ...m, notes: newNotes };
        });

        const newMeasure = newMeasures[positionToDelete.measureIndex];
        const newCursorIndex = Math.min(
          positionToDelete.noteIndex,
          newMeasure.notes.length - 1,
        );
        const newCursor = {
          measureIndex: positionToDelete.measureIndex,
          noteIndex: newCursorIndex,
        };
        const newSelectedId = newMeasure.notes[newCursorIndex]?.id || null;

        cursorRef.current = newCursor;

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
    },
    [
      state.cursor,
      state.score,
      state.selectedNoteId,
      cursorRef,
      suppressAddMeasurePromptRef,
      undoManager,
      getMeasureChordsAndLyrics,
      setState,
    ],
  );

  // ===========================================================================
  // Pitch Operations
  // ===========================================================================

  const changePitch = useCallback(
    (direction: "up" | "down") => {
      if (!state.selectedNoteId) return;

      const position = findNotePosition(state.selectedNoteId, state.score);
      if (!position) return;

      const note =
        state.score.measures[position.measureIndex]?.notes[position.noteIndex];
      if (!note || note.midi === null) return;

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
        setState((prev) => {
          const newOctave = shiftOctave(prev.selectedOctave, direction);
          if (!isValidMidi(newOctave)) return prev;
          return { ...prev, selectedOctave: newOctave };
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
    [state.selectedNoteId, state.score, undoManager, updateScore, setState],
  );

  const applyAccidental = useCallback(
    (accidental: Accidental | undefined) => {
      if (!state.selectedNoteId) return;

      const position = findNotePosition(state.selectedNoteId, state.score);
      if (!position) return;

      const note =
        state.score.measures[position.measureIndex]?.notes[position.noteIndex];
      if (!note || note.midi === null) return;

      const targetAccidental =
        note.accidental === accidental ? undefined : accidental;

      let baseMidi = note.midi;
      if (note.accidental === "double-sharp") baseMidi -= 2;
      else if (note.accidental === "sharp") baseMidi -= 1;
      else if (note.accidental === "flat") baseMidi += 1;
      else if (note.accidental === "double-flat") baseMidi += 2;

      const noteName = midiToNoteName(baseMidi);
      const octave = midiToOctave(baseMidi);
      const newMidi = noteToMidi(noteName, octave, targetAccidental);

      const action = createApplyAccidentalAction(
        position,
        note.id,
        note.accidental,
        targetAccidental,
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
                  n.id === note.id
                    ? { ...n, accidental: targetAccidental, midi: newMidi }
                    : n,
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
    if (!note || note.midi === null) return;

    const newTieStart = !note.tieStart;

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
      measures: score.measures.map((m, mi) =>
        mi === position.measureIndex
          ? {
              ...m,
              notes: m.notes.map((n) =>
                n.id === note.id ? { ...n, tieStart: newTieStart } : n,
              ),
            }
          : m,
      ),
    }));
  }, [state.selectedNoteId, state.score, undoManager, updateScore]);

  // ===========================================================================
  // Duration - Change Selected Note
  // ===========================================================================

  /**
   * Change the duration of the selected note.
   * @param duration The new duration
   * @param skipConfirmation If true, skip the chord/lyrics confirmation check
   */
  const changeDurationOfSelected = useCallback(
    (duration: DurationValue, skipConfirmation = false) => {
      if (!state.selectedNoteId) return;

      const position = findNotePosition(state.selectedNoteId, state.score);
      if (!position) return;

      const note =
        state.score.measures[position.measureIndex]?.notes[position.noteIndex];
      if (!note) return;

      const measure = state.score.measures[position.measureIndex];
      const currentDuration = getMeasureDuration(measure);
      const newTotalDuration = currentDuration - note.duration + duration;
      const maxDuration = getBeatsPerMeasure(state.score.timeSignature);

      if (newTotalDuration > maxDuration + 0.001) return;

      // Check if measure has chords or lyrics that need confirmation
      if (!skipConfirmation) {
        const { hasChords, hasLyrics } = getMeasureChordsAndLyrics(
          position.measureIndex,
        );
        if (hasChords || hasLyrics) {
          setPendingRhythmChange({
            measureIndex: position.measureIndex,
            hasChords,
            hasLyrics,
            changeType: { kind: "changeDuration", duration },
          });
          return;
        }
      }

      // Execute the change
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
    [
      state.selectedNoteId,
      state.score,
      undoManager,
      updateScore,
      getMeasureChordsAndLyrics,
    ],
  );

  // ===========================================================================
  // Update Refs for Rhythm Change Confirmation
  // ===========================================================================

  useEffect(() => {
    insertNoteRef.current = insertNote;
  }, [insertNote]);

  useEffect(() => {
    insertRestRef.current = insertRest;
  }, [insertRest]);

  useEffect(() => {
    deleteNoteRef.current = deleteNote;
  }, [deleteNote]);

  useEffect(() => {
    changeDurationRef.current = changeDurationOfSelected;
  }, [changeDurationOfSelected]);

  // ===========================================================================
  // Return
  // ===========================================================================

  return {
    // Note Operations
    insertNote,
    insertRest,
    deleteNote,
    changePitch,
    changeOctave,
    applyAccidental,
    toggleTie,

    // Duration
    changeDurationOfSelected,

    // Rhythm Change Confirmation
    pendingRhythmChange,
    confirmRhythmChange,
    cancelRhythmChange,
  };
}
