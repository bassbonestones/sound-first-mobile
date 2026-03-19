/**
 * useComposerUndo Hook
 *
 * Manages undo/redo functionality for the composer.
 * Maintains stacks of reversible actions.
 */

import { useCallback, useRef, useState } from "react";
import type { ComposerAction, ComposerScore } from "../types";

export interface UseComposerUndoReturn {
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Number of actions that can be undone */
  undoCount: number;
  /** Number of actions that can be redone */
  redoCount: number;
  /** Push a new action onto the undo stack */
  pushAction: (action: ComposerAction) => void;
  /** Pop and return the most recent undoable action */
  popUndo: () => ComposerAction | null;
  /** Pop and return the most recent redoable action */
  popRedo: () => ComposerAction | null;
  /** Push an action back onto the redo stack (after undo) */
  pushRedo: (action: ComposerAction) => void;
  /** Clear all undo/redo history */
  clearHistory: () => void;
}

/**
 * Hook for managing undo/redo stacks.
 *
 * Uses refs for the stacks to enable synchronous read/write,
 * with a counter state to trigger re-renders when stacks change.
 *
 * Usage:
 * 1. Call `pushAction` whenever a reversible action is performed
 * 2. Call `popUndo` to get the action to reverse, then apply the reverse
 * 3. Call `pushRedo` after undoing so the action can be redone
 * 4. Call `popRedo` to get the action to re-apply
 */
export function useComposerUndo(maxSize = 100): UseComposerUndoReturn {
  // Use refs for stacks so we can read/write synchronously
  const undoStackRef = useRef<ComposerAction[]>([]);
  const redoStackRef = useRef<ComposerAction[]>([]);

  // Counter to trigger re-renders when stacks change
  const [, setVersion] = useState(0);
  const triggerUpdate = useCallback(() => setVersion((v) => v + 1), []);

  const canUndo = undoStackRef.current.length > 0;
  const canRedo = redoStackRef.current.length > 0;
  const undoCount = undoStackRef.current.length;
  const redoCount = redoStackRef.current.length;

  const pushAction = useCallback(
    (action: ComposerAction) => {
      undoStackRef.current = [action, ...undoStackRef.current].slice(
        0,
        maxSize,
      );
      redoStackRef.current = []; // Clear redo stack on new action
      triggerUpdate();
    },
    [maxSize, triggerUpdate],
  );

  const popUndo = useCallback((): ComposerAction | null => {
    if (undoStackRef.current.length === 0) return null;
    const [first, ...rest] = undoStackRef.current;
    undoStackRef.current = rest;
    triggerUpdate();
    return first;
  }, [triggerUpdate]);

  const popRedo = useCallback((): ComposerAction | null => {
    if (redoStackRef.current.length === 0) return null;
    const [first, ...rest] = redoStackRef.current;
    redoStackRef.current = rest;
    triggerUpdate();
    return first;
  }, [triggerUpdate]);

  const pushRedo = useCallback(
    (action: ComposerAction) => {
      redoStackRef.current = [action, ...redoStackRef.current].slice(
        0,
        maxSize,
      );
      triggerUpdate();
    },
    [maxSize, triggerUpdate],
  );

  const clearHistory = useCallback(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    triggerUpdate();
  }, [triggerUpdate]);

  return {
    canUndo,
    canRedo,
    undoCount,
    redoCount,
    pushAction,
    popUndo,
    popRedo,
    pushRedo,
    clearHistory,
  };
}

// =============================================================================
// Action Reversal Helpers
// =============================================================================

/**
 * Apply the reverse of an action to a score.
 * Returns a new score with the action undone.
 */
export function reverseAction(
  score: ComposerScore,
  action: ComposerAction,
): ComposerScore {
  const now = new Date().toISOString();
  const updatedScore = { ...score, updatedAt: now };

  switch (action.type) {
    case "INSERT_NOTE": {
      // Undo insert = delete the note
      const measure = updatedScore.measures[action.position.measureIndex];
      if (!measure) return updatedScore;
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, i) =>
          i === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.filter((n) => n.id !== action.note.id),
              }
            : m,
        ),
      };
    }

    case "DELETE_NOTE": {
      // Undo delete = insert the note back
      const measure = updatedScore.measures[action.position.measureIndex];
      if (!measure) return updatedScore;
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, i) =>
          i === action.position.measureIndex
            ? {
                ...m,
                notes: [
                  ...m.notes.slice(0, action.position.noteIndex),
                  action.deletedNote,
                  ...m.notes.slice(action.position.noteIndex),
                ],
              }
            : m,
        ),
      };
    }

    case "CHANGE_PITCH": {
      // Undo pitch change = restore previous pitch
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId
                    ? { ...n, midi: action.previousMidi }
                    : n,
                ),
              }
            : m,
        ),
      };
    }

    case "CHANGE_DURATION": {
      // Undo duration change = restore previous duration
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId
                    ? { ...n, duration: action.previousDuration }
                    : n,
                ),
              }
            : m,
        ),
      };
    }

    case "APPLY_ACCIDENTAL": {
      // Undo accidental = restore previous
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId
                    ? { ...n, accidental: action.previousAccidental }
                    : n,
                ),
              }
            : m,
        ),
      };
    }

    case "TOGGLE_TIE": {
      // Undo tie toggle = restore previous value
      const tieKey = action.tieType === "start" ? "tieStart" : "tieEnd";
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId
                    ? { ...n, [tieKey]: action.previousValue }
                    : n,
                ),
              }
            : m,
        ),
      };
    }

    case "ADD_MEASURE": {
      // Undo add = remove the measure
      return {
        ...updatedScore,
        measures: updatedScore.measures.filter(
          (_, i) => i !== action.measureIndex,
        ),
      };
    }

    case "DELETE_MEASURE": {
      // Undo delete = insert the measure back
      return {
        ...updatedScore,
        measures: [
          ...updatedScore.measures.slice(0, action.measureIndex),
          action.deletedMeasure,
          ...updatedScore.measures.slice(action.measureIndex),
        ],
      };
    }

    case "CHANGE_CLEF":
      return { ...updatedScore, clef: action.previousClef };

    case "CHANGE_KEY_SIGNATURE":
      return { ...updatedScore, keySignature: action.previousKey };

    case "CHANGE_TIME_SIGNATURE":
      return { ...updatedScore, timeSignature: action.previousTimeSig };

    case "CHANGE_TEMPO":
      return { ...updatedScore, tempo: action.previousTempo };

    case "CHANGE_TITLE":
      return { ...updatedScore, title: action.previousTitle };

    default:
      return updatedScore;
  }
}

/**
 * Re-apply an action to a score.
 * Returns a new score with the action redone.
 */
export function reapplyAction(
  score: ComposerScore,
  action: ComposerAction,
): ComposerScore {
  const now = new Date().toISOString();
  const updatedScore = { ...score, updatedAt: now };

  switch (action.type) {
    case "INSERT_NOTE": {
      // Redo insert = insert the note
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, i) =>
          i === action.position.measureIndex
            ? {
                ...m,
                notes: [
                  ...m.notes.slice(0, action.position.noteIndex),
                  action.note,
                  ...m.notes.slice(action.position.noteIndex),
                ],
              }
            : m,
        ),
      };
    }

    case "DELETE_NOTE": {
      // Redo delete = delete the note
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, i) =>
          i === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.filter((n) => n.id !== action.deletedNote.id),
              }
            : m,
        ),
      };
    }

    case "CHANGE_PITCH": {
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId ? { ...n, midi: action.newMidi } : n,
                ),
              }
            : m,
        ),
      };
    }

    case "CHANGE_DURATION": {
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId
                    ? { ...n, duration: action.newDuration }
                    : n,
                ),
              }
            : m,
        ),
      };
    }

    case "APPLY_ACCIDENTAL": {
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId
                    ? { ...n, accidental: action.newAccidental }
                    : n,
                ),
              }
            : m,
        ),
      };
    }

    case "TOGGLE_TIE": {
      const tieKey = action.tieType === "start" ? "tieStart" : "tieEnd";
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId
                    ? { ...n, [tieKey]: action.newValue }
                    : n,
                ),
              }
            : m,
        ),
      };
    }

    case "ADD_MEASURE": {
      return {
        ...updatedScore,
        measures: [
          ...updatedScore.measures.slice(0, action.measureIndex),
          action.measure,
          ...updatedScore.measures.slice(action.measureIndex),
        ],
      };
    }

    case "DELETE_MEASURE": {
      return {
        ...updatedScore,
        measures: updatedScore.measures.filter(
          (_, i) => i !== action.measureIndex,
        ),
      };
    }

    case "CHANGE_CLEF":
      return { ...updatedScore, clef: action.newClef };

    case "CHANGE_KEY_SIGNATURE":
      return { ...updatedScore, keySignature: action.newKey };

    case "CHANGE_TIME_SIGNATURE":
      return { ...updatedScore, timeSignature: action.newTimeSig };

    case "CHANGE_TEMPO":
      return { ...updatedScore, tempo: action.newTempo };

    case "CHANGE_TITLE":
      return { ...updatedScore, title: action.newTitle };

    default:
      return updatedScore;
  }
}
