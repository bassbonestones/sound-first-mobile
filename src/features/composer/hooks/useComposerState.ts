/**
 * useComposerState Hook
 *
 * Main state management hook for the Practice Composer.
 * Manages score data, cursor position, selection, and all editing operations.
 */

import { useCallback, useMemo, useState } from "react";
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
  validateMeasure,
  wouldOverflow,
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
  moveCursorLeft,
  moveCursorRight,
  moveCursorToEnd,
  moveCursorToStart,
} from "../utils/cursorUtils";
import {
  getDefaultMidiForPitch,
  getNearestMidiForPitch,
  getNextDiatonicPitch,
  getPreviousDiatonicPitch,
  isValidMidi,
  shiftOctave,
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
  setKeySignature: (key: KeySignature) => void;
  setTimeSignature: (timeSig: TimeSignature) => void;
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
      const measure = state.score.measures[state.cursor.measureIndex];
      if (!measure) return false;

      // Check if note would overflow
      if (
        wouldOverflow(
          measure,
          state.selectedDuration,
          state.score.timeSignature,
        )
      ) {
        return false;
      }

      // Get MIDI pitch - use smart octave based on previous note or staff center
      const previousNote = getNoteBefore(state.cursor, state.score);
      const referenceMidi =
        previousNote?.midi ?? STAFF_CENTER_MIDI[state.score.clef];

      const { midi, accidental } = getNearestMidiForPitch(
        pitchName,
        referenceMidi,
        state.score.keySignature,
      );

      const note = createNote(midi, state.selectedDuration, {
        accidental,
      });

      // Record action for undo
      const action = createInsertNoteAction(state.cursor, note);
      undoManager.pushAction(action);

      setState((prev) => {
        const newMeasures = prev.score.measures.map((m, i) =>
          i === prev.cursor.measureIndex
            ? {
                ...m,
                notes: [
                  ...m.notes.slice(0, prev.cursor.noteIndex),
                  note,
                  ...m.notes.slice(prev.cursor.noteIndex),
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
          cursor: {
            measureIndex: prev.cursor.measureIndex,
            noteIndex: prev.cursor.noteIndex + 1,
          },
          selectedNoteId: note.id,
          isDirty: true,
        };
      });

      return true;
    },
    [
      state.score,
      state.cursor,
      state.selectedDuration,
      state.selectedOctave,
      undoManager,
    ],
  );

  const insertRest = useCallback((): boolean => {
    const measure = state.score.measures[state.cursor.measureIndex];
    if (!measure) return false;

    if (
      wouldOverflow(measure, state.selectedDuration, state.score.timeSignature)
    ) {
      return false;
    }

    const rest = createRest(state.selectedDuration);
    const action = createInsertNoteAction(state.cursor, rest);
    undoManager.pushAction(action);

    setState((prev) => {
      const newMeasures = prev.score.measures.map((m, i) =>
        i === prev.cursor.measureIndex
          ? {
              ...m,
              notes: [
                ...m.notes.slice(0, prev.cursor.noteIndex),
                rest,
                ...m.notes.slice(prev.cursor.noteIndex),
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
        cursor: {
          measureIndex: prev.cursor.measureIndex,
          noteIndex: prev.cursor.noteIndex + 1,
        },
        selectedNoteId: rest.id,
        isDirty: true,
      };
    });

    return true;
  }, [state.score, state.cursor, state.selectedDuration, undoManager]);

  const deleteNote = useCallback((): boolean => {
    const note = getNoteAtCursor(state.cursor, state.score);
    if (!note) return false;

    const action = createDeleteNoteAction(state.cursor, note);
    undoManager.pushAction(action);

    setState((prev) => {
      const newMeasures = prev.score.measures.map((m, i) =>
        i === prev.cursor.measureIndex
          ? {
              ...m,
              notes: m.notes.filter((n) => n.id !== note.id),
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
        selectedNoteId: null,
        isDirty: true,
      };
    });

    return true;
  }, [state.cursor, state.score, undoManager]);

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

      const action = createApplyAccidentalAction(
        position,
        note.id,
        note.accidental,
        accidental,
      );
      undoManager.pushAction(action);

      updateScore((score) => ({
        ...score,
        measures: score.measures.map((m, mi) =>
          mi === position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === note.id ? { ...n, accidental } : n,
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
    if (!note) return;

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

  // ==========================================================================
  // Duration
  // ==========================================================================

  const setDuration = useCallback((duration: DurationValue) => {
    setState((prev) => ({ ...prev, selectedDuration: duration }));
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
    const newMeasure = createMeasure();
    const insertIndex = state.cursor.measureIndex + 1;

    const action = createAddMeasureAction(insertIndex, newMeasure);
    undoManager.pushAction(action);

    setState((prev) => ({
      ...prev,
      score: {
        ...prev.score,
        measures: [
          ...prev.score.measures.slice(0, insertIndex),
          newMeasure,
          ...prev.score.measures.slice(insertIndex),
        ],
        updatedAt: new Date().toISOString(),
      },
      cursor: {
        measureIndex: insertIndex,
        noteIndex: 0,
      },
      isDirty: true,
    }));
  }, [state.cursor.measureIndex, undoManager]);

  const deleteMeasure = useCallback(() => {
    // Can't delete the last measure
    if (state.score.measures.length <= 1) return;

    const measureIndex = state.cursor.measureIndex;
    const deletedMeasure = state.score.measures[measureIndex];

    const action = createDeleteMeasureAction(measureIndex, deletedMeasure);
    undoManager.pushAction(action);

    setState((prev) => {
      const newMeasures = prev.score.measures.filter(
        (_, i) => i !== measureIndex,
      );
      const newMeasureIndex = Math.min(measureIndex, newMeasures.length - 1);

      return {
        ...prev,
        score: {
          ...prev.score,
          measures: newMeasures,
          updatedAt: new Date().toISOString(),
        },
        cursor: clampCursor(
          { measureIndex: newMeasureIndex, noteIndex: 0 },
          { ...prev.score, measures: newMeasures },
        ),
        selectedNoteId: null,
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

  const setTimeSignature = useCallback(
    (timeSig: TimeSignature) => {
      const prevTimeSig = state.score.timeSignature;

      undoManager.pushAction({
        type: "CHANGE_TIME_SIGNATURE",
        previousTimeSig: prevTimeSig,
        newTimeSig: timeSig,
      });

      updateScore((score) => ({ ...score, timeSignature: timeSig }));
    },
    [state.score.timeSignature, undoManager, updateScore],
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
    setKeySignature,
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
