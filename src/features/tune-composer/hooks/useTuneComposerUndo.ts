/**
 * useTuneComposerUndo Hook
 *
 * Manages undo/redo functionality for the tune composer.
 * Extends composer undo with support for lyrics, dynamics, and articulations.
 */

import { useCallback, useRef, useState } from "react";
import type { TuneComposerAction, TuneComposerScore } from "../types";

export interface UseTuneComposerUndoReturn {
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Number of actions that can be undone */
  undoCount: number;
  /** Number of actions that can be redone */
  redoCount: number;
  /** Push a new action onto the undo stack */
  pushAction: (action: TuneComposerAction) => void;
  /** Pop and return the most recent undoable action */
  popUndo: () => TuneComposerAction | null;
  /** Pop and return the most recent redoable action */
  popRedo: () => TuneComposerAction | null;
  /** Push an action back onto the redo stack (after undo) */
  pushRedo: (action: TuneComposerAction) => void;
  /** Clear all undo/redo history */
  clearHistory: () => void;
}

/**
 * Hook for managing undo/redo stacks.
 */
export function useTuneComposerUndo(maxSize = 100): UseTuneComposerUndoReturn {
  const undoStackRef = useRef<TuneComposerAction[]>([]);
  const redoStackRef = useRef<TuneComposerAction[]>([]);

  const [, setVersion] = useState(0);
  const triggerUpdate = useCallback(() => setVersion((v) => v + 1), []);

  const canUndo = undoStackRef.current.length > 0;
  const canRedo = redoStackRef.current.length > 0;
  const undoCount = undoStackRef.current.length;
  const redoCount = redoStackRef.current.length;

  const pushAction = useCallback(
    (action: TuneComposerAction) => {
      undoStackRef.current = [action, ...undoStackRef.current].slice(
        0,
        maxSize,
      );
      redoStackRef.current = [];
      triggerUpdate();
    },
    [maxSize, triggerUpdate],
  );

  const popUndo = useCallback((): TuneComposerAction | null => {
    if (undoStackRef.current.length === 0) return null;
    const [first, ...rest] = undoStackRef.current;
    undoStackRef.current = rest;
    triggerUpdate();
    return first;
  }, [triggerUpdate]);

  const popRedo = useCallback((): TuneComposerAction | null => {
    if (redoStackRef.current.length === 0) return null;
    const [first, ...rest] = redoStackRef.current;
    redoStackRef.current = rest;
    triggerUpdate();
    return first;
  }, [triggerUpdate]);

  const pushRedo = useCallback(
    (action: TuneComposerAction) => {
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
 */
export function reverseAction(
  score: TuneComposerScore,
  action: TuneComposerAction,
): TuneComposerScore {
  const now = new Date().toISOString();
  const updatedScore = { ...score, updatedAt: now };

  switch (action.type) {
    case "INSERT_NOTE": {
      const measure = updatedScore.measures[action.position.measureIndex];
      if (!measure) return updatedScore;
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, i) =>
          i === action.position.measureIndex
            ? { ...m, notes: m.notes.filter((n) => n.id !== action.note.id) }
            : m,
        ),
      };
    }

    case "DELETE_NOTE": {
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
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId
                    ? {
                        ...n,
                        accidental: action.previousAccidental,
                        midi: action.previousMidi,
                      }
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
                    ? { ...n, [tieKey]: action.previousValue }
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
        measures: updatedScore.measures.filter(
          (_, i) => i !== action.measureIndex,
        ),
      };
    }

    case "DELETE_MEASURE": {
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

    // New tune composer actions
    case "SET_LYRIC": {
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId
                    ? { ...n, lyric: action.previousLyric }
                    : n,
                ),
              }
            : m,
        ),
      };
    }

    case "REMOVE_LYRIC": {
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId
                    ? { ...n, lyric: action.removedLyric }
                    : n,
                ),
              }
            : m,
        ),
      };
    }

    case "SET_DYNAMIC": {
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId
                    ? { ...n, dynamic: action.previousDynamic }
                    : n,
                ),
              }
            : m,
        ),
      };
    }

    case "REMOVE_DYNAMIC": {
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId
                    ? { ...n, dynamic: action.removedDynamic }
                    : n,
                ),
              }
            : m,
        ),
      };
    }

    case "SET_WEDGE": {
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId
                    ? { ...n, wedge: action.previousWedge }
                    : n,
                ),
              }
            : m,
        ),
      };
    }

    case "REMOVE_WEDGE": {
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId
                    ? { ...n, wedge: action.removedWedge }
                    : n,
                ),
              }
            : m,
        ),
      };
    }

    case "SET_ARTICULATION": {
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId
                    ? { ...n, articulation: action.previousArticulation }
                    : n,
                ),
              }
            : m,
        ),
      };
    }

    case "REMOVE_ARTICULATION": {
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId
                    ? { ...n, articulation: action.removedArticulation }
                    : n,
                ),
              }
            : m,
        ),
      };
    }

    case "SET_EXPRESSION": {
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId
                    ? { ...n, expression: action.previousExpression }
                    : n,
                ),
              }
            : m,
        ),
      };
    }

    case "REMOVE_EXPRESSION": {
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId
                    ? { ...n, expression: action.removedExpression }
                    : n,
                ),
              }
            : m,
        ),
      };
    }

    case "SET_PICKUP": {
      // Reverse: restore previous state
      const hadPickup = action.previousFirstMeasure.isPickup === true;
      const isRemovingPickup = action.newDuration === undefined && hadPickup;
      const isAddingPickup =
        action.previousDuration === undefined &&
        action.newDuration !== undefined;

      let newMeasures;
      if (isRemovingPickup) {
        // Was removing pickup: re-insert the pickup at beginning
        newMeasures = [action.previousFirstMeasure, ...updatedScore.measures];
      } else if (isAddingPickup) {
        // Was adding pickup: remove the first measure (the pickup)
        newMeasures = updatedScore.measures.slice(1);
      } else {
        // Was editing pickup: replace first measure with previous
        newMeasures = [
          action.previousFirstMeasure,
          ...updatedScore.measures.slice(1),
        ];
      }

      return {
        ...updatedScore,
        measures: newMeasures,
        pickupDuration: action.previousDuration,
      };
    }

    default:
      return updatedScore;
  }
}

/**
 * Re-apply an action to a score.
 */
export function reapplyAction(
  score: TuneComposerScore,
  action: TuneComposerAction,
): TuneComposerScore {
  const now = new Date().toISOString();
  const updatedScore = { ...score, updatedAt: now };

  switch (action.type) {
    case "INSERT_NOTE": {
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
                    ? {
                        ...n,
                        accidental: action.newAccidental,
                        midi: action.newMidi,
                      }
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

    // New tune composer actions
    case "SET_LYRIC": {
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId ? { ...n, lyric: action.newLyric } : n,
                ),
              }
            : m,
        ),
      };
    }

    case "REMOVE_LYRIC": {
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId ? { ...n, lyric: undefined } : n,
                ),
              }
            : m,
        ),
      };
    }

    case "SET_DYNAMIC": {
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId
                    ? { ...n, dynamic: action.newDynamic }
                    : n,
                ),
              }
            : m,
        ),
      };
    }

    case "REMOVE_DYNAMIC": {
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId ? { ...n, dynamic: undefined } : n,
                ),
              }
            : m,
        ),
      };
    }

    case "SET_WEDGE": {
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId ? { ...n, wedge: action.newWedge } : n,
                ),
              }
            : m,
        ),
      };
    }

    case "REMOVE_WEDGE": {
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId ? { ...n, wedge: undefined } : n,
                ),
              }
            : m,
        ),
      };
    }

    case "SET_ARTICULATION": {
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId
                    ? { ...n, articulation: action.newArticulation }
                    : n,
                ),
              }
            : m,
        ),
      };
    }

    case "REMOVE_ARTICULATION": {
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId
                    ? { ...n, articulation: undefined }
                    : n,
                ),
              }
            : m,
        ),
      };
    }

    case "SET_EXPRESSION": {
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId
                    ? { ...n, expression: action.newExpression }
                    : n,
                ),
              }
            : m,
        ),
      };
    }

    case "REMOVE_EXPRESSION": {
      return {
        ...updatedScore,
        measures: updatedScore.measures.map((m, mi) =>
          mi === action.position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === action.noteId ? { ...n, expression: undefined } : n,
                ),
              }
            : m,
        ),
      };
    }

    case "SET_PICKUP": {
      // Reapply: apply the action again
      const hadPickup = action.previousFirstMeasure.isPickup === true;
      const isRemovingPickup = action.newDuration === undefined && hadPickup;
      const isAddingPickup =
        action.previousDuration === undefined &&
        action.newDuration !== undefined;

      let newMeasures;
      if (isRemovingPickup) {
        // Removing pickup: delete the first measure
        newMeasures = updatedScore.measures.slice(1);
      } else if (isAddingPickup) {
        // Adding pickup: insert new pickup at beginning
        newMeasures = [action.newFirstMeasure, ...updatedScore.measures];
      } else {
        // Editing pickup: replace first measure
        newMeasures = [
          action.newFirstMeasure,
          ...updatedScore.measures.slice(1),
        ];
      }

      return {
        ...updatedScore,
        measures: newMeasures,
        pickupDuration: action.newDuration,
      };
    }

    default:
      return updatedScore;
  }
}
