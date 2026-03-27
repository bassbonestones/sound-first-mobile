/**
 * useMeasureOperations Hook
 *
 * Extracted from useComposerState - handles measure-level operations:
 * - addMeasure
 * - deleteMeasure
 * - deleteLastMeasure
 * - fillMeasureWithRests
 *
 * These operations are undoable and update the dirty flag.
 */

import { useCallback } from "react";
import type {
  ComposerScore,
  ComposerState,
  CursorPosition,
  DurationValue,
} from "../types";
import {
  createMeasure,
  createRest,
  validateMeasure,
  createAddMeasureAction,
  createDeleteMeasureAction,
} from "../types";
import type { UseComposerUndoReturn } from "./useComposerUndo";

export interface UseMeasureOperationsParams {
  state: ComposerState;
  setState: React.Dispatch<React.SetStateAction<ComposerState>>;
  undoManager: UseComposerUndoReturn;
  cursorRef: React.MutableRefObject<CursorPosition>;
  suppressAddMeasurePromptRef: React.MutableRefObject<boolean>;
  updateScore: (updater: (score: ComposerScore) => ComposerScore) => void;
}

export interface UseMeasureOperationsReturn {
  /** Add a new measure at the end of the score */
  addMeasure: () => void;
  /** Delete the measure at the current cursor position */
  deleteMeasure: () => void;
  /** Delete the last measure in the score */
  deleteLastMeasure: () => void;
  /** Fill the current measure with rests to complete it */
  fillMeasureWithRests: () => void;
}

/**
 * Hook for managing measure-level operations.
 *
 * Extracted from useComposerState for better modularity.
 * All operations are undoable and mark the score as dirty.
 */
export function useMeasureOperations({
  state,
  setState,
  undoManager,
  cursorRef,
  suppressAddMeasurePromptRef,
  updateScore,
}: UseMeasureOperationsParams): UseMeasureOperationsReturn {
  const addMeasure = useCallback(() => {
    const newMeasure = createMeasure(state.score.timeSignature);
    const insertIndex = state.score.measures.length;

    const action = createAddMeasureAction(insertIndex, newMeasure);
    undoManager.pushAction(action);

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
  }, [
    state.score.measures.length,
    state.score.timeSignature,
    undoManager,
    cursorRef,
    setState,
  ]);

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
  }, [
    state.score.measures,
    state.cursor.measureIndex,
    undoManager,
    cursorRef,
    suppressAddMeasurePromptRef,
    setState,
  ]);

  const deleteLastMeasure = useCallback(() => {
    // Can't delete the last measure
    if (state.score.measures.length <= 1) return;

    const measureIndex = state.score.measures.length - 1;
    const deletedMeasure = state.score.measures[measureIndex];

    const action = createDeleteMeasureAction(measureIndex, deletedMeasure);
    undoManager.pushAction(action);

    suppressAddMeasurePromptRef.current = true;

    setState((prev) => {
      const newMeasures = prev.score.measures.filter(
        (_, i) => i !== measureIndex,
      );

      // If cursor was on the deleted measure, move it to the new last measure
      const wasOnDeletedMeasure = prev.cursor.measureIndex === measureIndex;
      const targetMeasureIndex = wasOnDeletedMeasure
        ? measureIndex - 1
        : prev.cursor.measureIndex;
      const targetMeasure = newMeasures[targetMeasureIndex];

      const noteIndex = wasOnDeletedMeasure
        ? Math.max(0, targetMeasure.notes.length - 1)
        : Math.min(prev.cursor.noteIndex, targetMeasure.notes.length - 1);
      const targetNote = targetMeasure.notes[noteIndex];

      const newCursor = {
        measureIndex: targetMeasureIndex,
        noteIndex,
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
        selectedNoteId: targetNote?.id || null,
        isDirty: true,
      };
    });
  }, [
    state.score.measures,
    undoManager,
    cursorRef,
    suppressAddMeasurePromptRef,
    setState,
  ]);

  const fillMeasureWithRests = useCallback(() => {
    const measure = state.score.measures[state.cursor.measureIndex];
    if (!measure) return;

    const validation = validateMeasure(measure, state.score.timeSignature);
    if (validation.isComplete || validation.difference >= 0) return;

    const remaining = -validation.difference;
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

  return {
    addMeasure,
    deleteMeasure,
    deleteLastMeasure,
    fillMeasureWithRests,
  };
}
