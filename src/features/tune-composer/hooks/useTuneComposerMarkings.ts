/**
 * useTuneComposerMarkings Hook
 *
 * Manages musical markings functionality for the Tune Composer.
 * Handles dynamics, wedges (crescendo/diminuendo), slurs, articulations, and expressions.
 *
 * This hook is composed by useTuneComposerState and should not be used directly.
 */

import { useCallback } from "react";
import type {
  ArticulationType,
  DynamicType,
  DynamicTextType,
  Note,
  TuneComposerScore,
  TuneComposerState,
  WedgeMark,
} from "../types";
import { findNotePosition } from "../../composer/utils/cursorUtils";
import {
  createSetDynamicAction,
  createRemoveDynamicAction,
  createSetArticulationAction,
  createRemoveArticulationAction,
  createSetExpressionAction,
  createRemoveExpressionAction,
} from "../types/actionTypes";
import type { UseTuneComposerUndoReturn } from "./useTuneComposerUndo";

// =============================================================================
// Types
// =============================================================================

export interface UseTuneComposerMarkingsReturn {
  // Dynamics
  setDynamic: (dynamic: DynamicType) => void;
  removeDynamic: () => void;
  setDynamicText: (text: DynamicTextType) => void;
  removeDynamicText: () => void;
  dynamicsMode: boolean;
  toggleDynamicsMode: () => void;

  // Wedges (Crescendo/Decrescendo)
  setWedge: (wedge: WedgeMark) => void;
  removeWedge: () => void;
  wedgeMode: boolean;
  toggleWedgeMode: () => void;
  startCrescendo: () => void;
  startDiminuendo: () => void;
  extendWedge: () => void;
  endWedgeMode: () => void;
  activeWedgeType: "crescendo" | "diminuendo" | null;
  activeWedgeStartId: string | null;
  removeWedgeMarking: () => void;

  // Articulations
  setArticulation: (articulation: ArticulationType) => void;
  removeArticulation: () => void;

  // Expressions
  setExpression: (text: string) => void;
  removeExpression: () => void;
  expressionMode: boolean;
  toggleExpressionMode: () => void;

  // Slurs
  slurMode: boolean;
  toggleSlurMode: () => void;
  startSlur: () => void;
  extendSlurLeft: () => void;
  extendSlurRight: () => void;
  endSlurMode: () => void;
  activeSlurStartId: string | null;
  activeSlurEndId: string | null;
  removeSlur: () => void;
  flipSlur: () => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useTuneComposerMarkings(
  state: TuneComposerState,
  setState: React.Dispatch<React.SetStateAction<TuneComposerState>>,
  updateScore: (
    updater: (score: TuneComposerScore) => TuneComposerScore,
  ) => void,
  undoManager: UseTuneComposerUndoReturn,
): UseTuneComposerMarkingsReturn {
  // ===========================================================================
  // Helpers
  // ===========================================================================

  /** Get flat list of all pitched notes with their positions */
  const getPitchedNotesWithPositions = useCallback(() => {
    const notes: Array<{
      note: Note;
      measureIndex: number;
      noteIndex: number;
    }> = [];
    state.score.measures.forEach((measure, measureIndex) => {
      measure.notes.forEach((note, noteIndex) => {
        if (note.midi !== null) {
          notes.push({ note, measureIndex, noteIndex });
        }
      });
    });
    return notes;
  }, [state.score]);

  // ===========================================================================
  // Dynamics
  // ===========================================================================

  const setDynamic = useCallback(
    (dynamic: DynamicType) => {
      if (!state.selectedNoteId) return;

      const position = findNotePosition(state.selectedNoteId, state.score);
      if (!position) return;

      const note =
        state.score.measures[position.measureIndex]?.notes[position.noteIndex];
      if (!note) return;

      const action = createSetDynamicAction(
        position,
        note.id,
        dynamic,
        note.dynamic,
      );
      undoManager.pushAction(action);

      updateScore((score) => ({
        ...score,
        measures: score.measures.map((m, mi) =>
          mi === position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === note.id ? { ...n, dynamic } : n,
                ),
              }
            : m,
        ),
      }));
    },
    [state.selectedNoteId, state.score, undoManager, updateScore],
  );

  const removeDynamic = useCallback(() => {
    if (!state.selectedNoteId) return;

    const position = findNotePosition(state.selectedNoteId, state.score);
    if (!position) return;

    const note =
      state.score.measures[position.measureIndex]?.notes[position.noteIndex];
    if (!note || !note.dynamic) return;

    const action = createRemoveDynamicAction(position, note.id, note.dynamic);
    undoManager.pushAction(action);

    updateScore((score) => ({
      ...score,
      measures: score.measures.map((m, mi) =>
        mi === position.measureIndex
          ? {
              ...m,
              notes: m.notes.map((n) =>
                n.id === note.id ? { ...n, dynamic: undefined } : n,
              ),
            }
          : m,
      ),
    }));
  }, [state.selectedNoteId, state.score, undoManager, updateScore]);

  const setDynamicText = useCallback(
    (text: DynamicTextType) => {
      if (!state.selectedNoteId) return;

      const position = findNotePosition(state.selectedNoteId, state.score);
      if (!position) return;

      const note =
        state.score.measures[position.measureIndex]?.notes[position.noteIndex];
      if (!note) return;

      updateScore((score) => ({
        ...score,
        measures: score.measures.map((m, mi) =>
          mi === position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === note.id ? { ...n, dynamicText: text } : n,
                ),
              }
            : m,
        ),
      }));
    },
    [state.selectedNoteId, state.score, updateScore],
  );

  const removeDynamicText = useCallback(() => {
    if (!state.selectedNoteId) return;

    const position = findNotePosition(state.selectedNoteId, state.score);
    if (!position) return;

    const note =
      state.score.measures[position.measureIndex]?.notes[position.noteIndex];
    if (!note || !note.dynamicText) return;

    updateScore((score) => ({
      ...score,
      measures: score.measures.map((m, mi) =>
        mi === position.measureIndex
          ? {
              ...m,
              notes: m.notes.map((n) =>
                n.id === note.id ? { ...n, dynamicText: undefined } : n,
              ),
            }
          : m,
      ),
    }));
  }, [state.selectedNoteId, state.score, updateScore]);

  const toggleDynamicsMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      dynamicsMode: !prev.dynamicsMode,
    }));
  }, [setState]);

  // ===========================================================================
  // Wedges (Crescendo/Decrescendo)
  // ===========================================================================

  const setWedge = useCallback(
    (wedge: WedgeMark) => {
      if (!state.selectedNoteId) return;

      const position = findNotePosition(state.selectedNoteId, state.score);
      if (!position) return;

      const note =
        state.score.measures[position.measureIndex]?.notes[position.noteIndex];
      if (!note) return;

      updateScore((score) => ({
        ...score,
        measures: score.measures.map((m, mi) =>
          mi === position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === note.id ? { ...n, wedge } : n,
                ),
              }
            : m,
        ),
      }));
    },
    [state.selectedNoteId, state.score, updateScore],
  );

  const removeWedge = useCallback(() => {
    if (!state.selectedNoteId) return;

    const position = findNotePosition(state.selectedNoteId, state.score);
    if (!position) return;

    const note =
      state.score.measures[position.measureIndex]?.notes[position.noteIndex];
    if (!note || !note.wedge) return;

    updateScore((score) => ({
      ...score,
      measures: score.measures.map((m, mi) =>
        mi === position.measureIndex
          ? {
              ...m,
              notes: m.notes.map((n) =>
                n.id === note.id ? { ...n, wedge: undefined } : n,
              ),
            }
          : m,
      ),
    }));
  }, [state.selectedNoteId, state.score, updateScore]);

  const toggleWedgeMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      wedgeMode: !prev.wedgeMode,
      activeWedgeType: !prev.wedgeMode ? prev.activeWedgeType : null,
      activeWedgeStartId: !prev.wedgeMode ? prev.activeWedgeStartId : null,
    }));
  }, [setState]);

  const startCrescendo = useCallback(() => {
    if (!state.selectedNoteId) return;

    const position = findNotePosition(state.selectedNoteId, state.score);
    if (!position) return;

    const note =
      state.score.measures[position.measureIndex]?.notes[position.noteIndex];
    if (!note) return;

    const pitchedNotes = getPitchedNotesWithPositions();
    const startIndex = pitchedNotes.findIndex((n) => n.note.id === note.id);
    if (startIndex < 0 || startIndex >= pitchedNotes.length - 1) return;

    const nextNote = pitchedNotes[startIndex + 1];

    updateScore((score) => ({
      ...score,
      measures: score.measures.map((m) => ({
        ...m,
        notes: m.notes.map((n) => {
          if (n.id === note.id) {
            return { ...n, wedge: { type: "crescendo", position: "start" } };
          }
          if (n.id === nextNote.note.id) {
            return { ...n, wedge: { type: "crescendo", position: "stop" } };
          }
          return n;
        }),
      })),
    }));

    setState((prev) => ({
      ...prev,
      activeWedgeType: "crescendo",
      activeWedgeStartId: note.id,
      selectedNoteId: nextNote.note.id,
    }));
  }, [
    state.selectedNoteId,
    state.score,
    getPitchedNotesWithPositions,
    updateScore,
    setState,
  ]);

  const startDiminuendo = useCallback(() => {
    if (!state.selectedNoteId) return;

    const position = findNotePosition(state.selectedNoteId, state.score);
    if (!position) return;

    const note =
      state.score.measures[position.measureIndex]?.notes[position.noteIndex];
    if (!note) return;

    const pitchedNotes = getPitchedNotesWithPositions();
    const startIndex = pitchedNotes.findIndex((n) => n.note.id === note.id);
    if (startIndex < 0 || startIndex >= pitchedNotes.length - 1) return;

    const nextNote = pitchedNotes[startIndex + 1];

    updateScore((score) => ({
      ...score,
      measures: score.measures.map((m) => ({
        ...m,
        notes: m.notes.map((n) => {
          if (n.id === note.id) {
            return { ...n, wedge: { type: "diminuendo", position: "start" } };
          }
          if (n.id === nextNote.note.id) {
            return { ...n, wedge: { type: "diminuendo", position: "stop" } };
          }
          return n;
        }),
      })),
    }));

    setState((prev) => ({
      ...prev,
      activeWedgeType: "diminuendo",
      activeWedgeStartId: note.id,
      selectedNoteId: nextNote.note.id,
    }));
  }, [
    state.selectedNoteId,
    state.score,
    getPitchedNotesWithPositions,
    updateScore,
    setState,
  ]);

  const extendWedge = useCallback(() => {
    if (!state.activeWedgeStartId || !state.activeWedgeType) return;

    const pitchedNotes = getPitchedNotesWithPositions();
    const startIndex = pitchedNotes.findIndex(
      (n) => n.note.id === state.activeWedgeStartId,
    );
    if (startIndex < 0 || startIndex >= pitchedNotes.length - 1) return;

    let currentEndIndex = startIndex;
    for (let i = startIndex + 1; i < pitchedNotes.length; i++) {
      if (pitchedNotes[i].note.wedge?.position === "stop") {
        currentEndIndex = i;
        break;
      }
    }

    const newEndIndex = Math.min(currentEndIndex + 1, pitchedNotes.length - 1);
    if (newEndIndex === currentEndIndex) return;

    const oldEndNote = pitchedNotes[currentEndIndex];
    const newEndNote = pitchedNotes[newEndIndex];

    const wedgeType = state.activeWedgeType;
    if (!wedgeType) return;

    updateScore((score) => ({
      ...score,
      measures: score.measures.map((m) => ({
        ...m,
        notes: m.notes.map((n) => {
          if (n.id === oldEndNote.note.id && n.wedge?.position === "stop") {
            return { ...n, wedge: undefined };
          }
          if (n.id === newEndNote.note.id) {
            return {
              ...n,
              wedge: { type: wedgeType, position: "stop" },
            };
          }
          return n;
        }),
      })),
    }));

    setState((prev) => ({
      ...prev,
      selectedNoteId: newEndNote.note.id,
    }));
  }, [
    state.activeWedgeStartId,
    state.activeWedgeType,
    getPitchedNotesWithPositions,
    updateScore,
    setState,
  ]);

  const endWedgeMode = useCallback(() => {
    if (
      state.activeWedgeStartId &&
      state.selectedNoteId &&
      state.activeWedgeType
    ) {
      const wedgeType = state.activeWedgeType;
      const position = findNotePosition(state.selectedNoteId, state.score);
      if (position && wedgeType) {
        const note =
          state.score.measures[position.measureIndex]?.notes[
            position.noteIndex
          ];
        if (note && note.id !== state.activeWedgeStartId) {
          updateScore((score) => ({
            ...score,
            measures: score.measures.map((m, mi) =>
              mi === position.measureIndex
                ? {
                    ...m,
                    notes: m.notes.map((n) =>
                      n.id === note.id
                        ? {
                            ...n,
                            wedge: {
                              type: wedgeType,
                              position: "stop",
                            },
                          }
                        : n,
                    ),
                  }
                : m,
            ),
          }));
        }
      }
    }

    setState((prev) => ({
      ...prev,
      wedgeMode: false,
      activeWedgeType: null,
      activeWedgeStartId: null,
    }));
  }, [
    state.activeWedgeStartId,
    state.selectedNoteId,
    state.activeWedgeType,
    state.score,
    updateScore,
    setState,
  ]);

  const removeWedgeMarking = useCallback(() => {
    if (!state.selectedNoteId) return;

    const position = findNotePosition(state.selectedNoteId, state.score);
    if (!position) return;

    const note =
      state.score.measures[position.measureIndex]?.notes[position.noteIndex];
    if (!note || !note.wedge) return;

    const pitchedNotes = getPitchedNotesWithPositions();
    const selectedIndex = pitchedNotes.findIndex((n) => n.note.id === note.id);

    let otherEndId: string | null = null;

    if (note.wedge.position === "start") {
      for (let i = selectedIndex + 1; i < pitchedNotes.length; i++) {
        if (pitchedNotes[i].note.wedge?.position === "stop") {
          otherEndId = pitchedNotes[i].note.id;
          break;
        }
      }
    } else {
      for (let i = selectedIndex - 1; i >= 0; i--) {
        if (pitchedNotes[i].note.wedge?.position === "start") {
          otherEndId = pitchedNotes[i].note.id;
          break;
        }
      }
    }

    updateScore((score) => ({
      ...score,
      measures: score.measures.map((m) => ({
        ...m,
        notes: m.notes.map((n) => {
          if (n.id === note.id || n.id === otherEndId) {
            return { ...n, wedge: undefined };
          }
          return n;
        }),
      })),
    }));

    setState((prev) => ({
      ...prev,
      activeWedgeType: null,
      activeWedgeStartId: null,
    }));
  }, [
    state.selectedNoteId,
    state.score,
    getPitchedNotesWithPositions,
    updateScore,
    setState,
  ]);

  // ===========================================================================
  // Articulations
  // ===========================================================================

  const setArticulation = useCallback(
    (articulation: ArticulationType) => {
      if (!state.selectedNoteId) return;

      const position = findNotePosition(state.selectedNoteId, state.score);
      if (!position) return;

      const note =
        state.score.measures[position.measureIndex]?.notes[position.noteIndex];
      if (!note) return;

      const action = createSetArticulationAction(
        position,
        note.id,
        articulation,
        note.articulation,
      );
      undoManager.pushAction(action);

      updateScore((score) => ({
        ...score,
        measures: score.measures.map((m, mi) =>
          mi === position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === note.id ? { ...n, articulation } : n,
                ),
              }
            : m,
        ),
      }));
    },
    [state.selectedNoteId, state.score, undoManager, updateScore],
  );

  const removeArticulation = useCallback(() => {
    if (!state.selectedNoteId) return;

    const position = findNotePosition(state.selectedNoteId, state.score);
    if (!position) return;

    const note =
      state.score.measures[position.measureIndex]?.notes[position.noteIndex];
    if (!note || !note.articulation) return;

    const action = createRemoveArticulationAction(
      position,
      note.id,
      note.articulation,
    );
    undoManager.pushAction(action);

    updateScore((score) => ({
      ...score,
      measures: score.measures.map((m, mi) =>
        mi === position.measureIndex
          ? {
              ...m,
              notes: m.notes.map((n) =>
                n.id === note.id ? { ...n, articulation: undefined } : n,
              ),
            }
          : m,
      ),
    }));
  }, [state.selectedNoteId, state.score, undoManager, updateScore]);

  // ===========================================================================
  // Expressions
  // ===========================================================================

  const setExpression = useCallback(
    (text: string) => {
      if (!state.selectedNoteId) return;

      const position = findNotePosition(state.selectedNoteId, state.score);
      if (!position) return;

      const note =
        state.score.measures[position.measureIndex]?.notes[position.noteIndex];
      if (!note) return;

      const action = createSetExpressionAction(
        position,
        note.id,
        text,
        note.expression,
      );
      undoManager.pushAction(action);

      updateScore((score) => ({
        ...score,
        measures: score.measures.map((m, mi) =>
          mi === position.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n) =>
                  n.id === note.id ? { ...n, expression: text } : n,
                ),
              }
            : m,
        ),
      }));
    },
    [state.selectedNoteId, state.score, undoManager, updateScore],
  );

  const removeExpression = useCallback(() => {
    if (!state.selectedNoteId) return;

    const position = findNotePosition(state.selectedNoteId, state.score);
    if (!position) return;

    const note =
      state.score.measures[position.measureIndex]?.notes[position.noteIndex];
    if (!note || !note.expression) return;

    const action = createRemoveExpressionAction(
      position,
      note.id,
      note.expression,
    );
    undoManager.pushAction(action);

    updateScore((score) => ({
      ...score,
      measures: score.measures.map((m, mi) =>
        mi === position.measureIndex
          ? {
              ...m,
              notes: m.notes.map((n) =>
                n.id === note.id ? { ...n, expression: undefined } : n,
              ),
            }
          : m,
      ),
    }));
  }, [state.selectedNoteId, state.score, undoManager, updateScore]);

  const toggleExpressionMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      expressionMode: !prev.expressionMode,
    }));
  }, [setState]);

  // ===========================================================================
  // Slurs
  // ===========================================================================

  const toggleSlurMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      slurMode: !prev.slurMode,
      activeSlurStartId: !prev.slurMode ? prev.activeSlurStartId : null,
      activeSlurEndId: !prev.slurMode ? prev.activeSlurEndId : null,
    }));
  }, [setState]);

  const endSlurMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      slurMode: false,
      activeSlurStartId: null,
      activeSlurEndId: null,
    }));
  }, [setState]);

  const startSlur = useCallback(() => {
    if (!state.selectedNoteId) return;

    const pitchedNotes = getPitchedNotesWithPositions();
    const currentIndex = pitchedNotes.findIndex(
      (n) => n.note.id === state.selectedNoteId,
    );
    if (currentIndex === -1 || currentIndex >= pitchedNotes.length - 1) return;

    const startNote = pitchedNotes[currentIndex];
    const endNote = pitchedNotes[currentIndex + 1];

    updateScore((score) => ({
      ...score,
      measures: score.measures.map((m) => ({
        ...m,
        notes: m.notes.map((n) => {
          if (n.id === startNote.note.id) {
            return { ...n, slurStart: true };
          }
          if (n.id === endNote.note.id) {
            return { ...n, slurEnd: true };
          }
          return n;
        }),
      })),
    }));

    setState((prev) => ({
      ...prev,
      activeSlurStartId: startNote.note.id,
      activeSlurEndId: endNote.note.id,
      isDirty: true,
    }));
  }, [
    state.selectedNoteId,
    getPitchedNotesWithPositions,
    updateScore,
    setState,
  ]);

  const extendSlurLeft = useCallback(() => {
    if (!state.activeSlurStartId) return;

    const pitchedNotes = getPitchedNotesWithPositions();
    const startIndex = pitchedNotes.findIndex(
      (n) => n.note.id === state.activeSlurStartId,
    );
    if (startIndex <= 0) return;

    const oldStartNote = pitchedNotes[startIndex];
    const newStartNote = pitchedNotes[startIndex - 1];

    updateScore((score) => ({
      ...score,
      measures: score.measures.map((m) => ({
        ...m,
        notes: m.notes.map((n) => {
          if (n.id === oldStartNote.note.id) {
            return { ...n, slurStart: undefined };
          }
          if (n.id === newStartNote.note.id) {
            return { ...n, slurStart: true };
          }
          return n;
        }),
      })),
    }));

    setState((prev) => ({
      ...prev,
      activeSlurStartId: newStartNote.note.id,
      isDirty: true,
    }));
  }, [
    state.activeSlurStartId,
    getPitchedNotesWithPositions,
    updateScore,
    setState,
  ]);

  const extendSlurRight = useCallback(() => {
    if (!state.activeSlurEndId) return;

    const pitchedNotes = getPitchedNotesWithPositions();
    const endIndex = pitchedNotes.findIndex(
      (n) => n.note.id === state.activeSlurEndId,
    );
    if (endIndex === -1 || endIndex >= pitchedNotes.length - 1) return;

    const oldEndNote = pitchedNotes[endIndex];
    const newEndNote = pitchedNotes[endIndex + 1];

    updateScore((score) => ({
      ...score,
      measures: score.measures.map((m) => ({
        ...m,
        notes: m.notes.map((n) => {
          if (n.id === oldEndNote.note.id) {
            return { ...n, slurEnd: undefined };
          }
          if (n.id === newEndNote.note.id) {
            return { ...n, slurEnd: true };
          }
          return n;
        }),
      })),
    }));

    setState((prev) => ({
      ...prev,
      activeSlurEndId: newEndNote.note.id,
      isDirty: true,
    }));
  }, [
    state.activeSlurEndId,
    getPitchedNotesWithPositions,
    updateScore,
    setState,
  ]);

  const removeSlur = useCallback(() => {
    if (!state.selectedNoteId) return;

    const position = findNotePosition(state.selectedNoteId, state.score);
    if (!position) return;

    const note =
      state.score.measures[position.measureIndex]?.notes[position.noteIndex];
    if (!note || (!note.slurStart && !note.slurEnd)) return;

    const pitchedNotes = getPitchedNotesWithPositions();
    const selectedIndex = pitchedNotes.findIndex((n) => n.note.id === note.id);

    let slurStartNoteId: string | null = null;
    let slurEndNoteId: string | null = null;

    if (note.slurStart) {
      slurStartNoteId = note.id;
      for (let i = selectedIndex + 1; i < pitchedNotes.length; i++) {
        if (pitchedNotes[i].note.slurEnd) {
          slurEndNoteId = pitchedNotes[i].note.id;
          break;
        }
      }
    }

    if (note.slurEnd) {
      slurEndNoteId = note.id;
      for (let i = selectedIndex - 1; i >= 0; i--) {
        if (pitchedNotes[i].note.slurStart) {
          slurStartNoteId = pitchedNotes[i].note.id;
          break;
        }
      }
    }

    updateScore((score) => ({
      ...score,
      measures: score.measures.map((m) => ({
        ...m,
        notes: m.notes.map((n) => {
          if (n.id === slurStartNoteId) {
            return { ...n, slurStart: undefined };
          }
          if (n.id === slurEndNoteId) {
            return { ...n, slurEnd: undefined };
          }
          return n;
        }),
      })),
    }));

    setState((prev) => ({
      ...prev,
      activeSlurStartId: null,
      activeSlurEndId: null,
    }));
  }, [
    state.selectedNoteId,
    state.score,
    getPitchedNotesWithPositions,
    updateScore,
    setState,
  ]);

  const flipSlur = useCallback(() => {
    if (!state.selectedNoteId) return;

    const position = findNotePosition(state.selectedNoteId, state.score);
    if (!position) return;

    const note =
      state.score.measures[position.measureIndex]?.notes[position.noteIndex];
    if (!note || (!note.slurStart && !note.slurEnd)) return;

    const pitchedNotes = getPitchedNotesWithPositions();
    const selectedIndex = pitchedNotes.findIndex((n) => n.note.id === note.id);

    let slurStartNoteId: string | null = null;
    let currentPlacement: "above" | "below" | undefined;

    if (note.slurStart) {
      slurStartNoteId = note.id;
      currentPlacement = note.slurPlacement;
    } else if (note.slurEnd) {
      for (let i = selectedIndex - 1; i >= 0; i--) {
        if (pitchedNotes[i].note.slurStart) {
          slurStartNoteId = pitchedNotes[i].note.id;
          currentPlacement = pitchedNotes[i].note.slurPlacement;
          break;
        }
      }
    }

    if (!slurStartNoteId) return;

    const newPlacement: "above" | "below" =
      currentPlacement === "above" ? "below" : "above";

    updateScore((score) => ({
      ...score,
      measures: score.measures.map((m) => ({
        ...m,
        notes: m.notes.map((n) => {
          if (n.id === slurStartNoteId) {
            return { ...n, slurPlacement: newPlacement };
          }
          return n;
        }),
      })),
    }));
  }, [
    state.selectedNoteId,
    state.score,
    getPitchedNotesWithPositions,
    updateScore,
  ]);

  // ===========================================================================
  // Return
  // ===========================================================================

  return {
    // Dynamics
    setDynamic,
    removeDynamic,
    setDynamicText,
    removeDynamicText,
    dynamicsMode: state.dynamicsMode,
    toggleDynamicsMode,

    // Wedges
    setWedge,
    removeWedge,
    wedgeMode: state.wedgeMode,
    toggleWedgeMode,
    startCrescendo,
    startDiminuendo,
    extendWedge,
    endWedgeMode,
    activeWedgeType: state.activeWedgeType,
    activeWedgeStartId: state.activeWedgeStartId,
    removeWedgeMarking,

    // Articulations
    setArticulation,
    removeArticulation,

    // Expressions
    setExpression,
    removeExpression,
    expressionMode: state.expressionMode,
    toggleExpressionMode,

    // Slurs
    slurMode: state.slurMode,
    toggleSlurMode,
    startSlur,
    extendSlurLeft,
    extendSlurRight,
    endSlurMode,
    activeSlurStartId: state.activeSlurStartId,
    activeSlurEndId: state.activeSlurEndId,
    removeSlur,
    flipSlur,
  };
}
