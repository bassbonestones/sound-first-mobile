/**
 * useTuneComposerChords Hook
 *
 * Manages chord symbol editing functionality for the Tune Composer.
 * Handles chord mode toggle, chord cursor navigation, progression management,
 * and chord symbol operations.
 *
 * This hook is composed by useTuneComposerState and should not be used directly.
 */

import { useCallback, useMemo } from "react";
import type {
  ChordProgression,
  ChordSymbol,
  TuneComposerScore,
  TuneComposerState,
} from "../types";
import {
  findChordAtPosition,
  createChordSymbol,
  getActiveProgression,
  createChordProgression,
  getBeatUnitCount,
  getBeatUnitDuration,
  getMeasureDuration,
  duplicateProgression as duplicateProgressionUtil,
} from "../types";

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get the number of beat positions for a specific measure.
 * Pickup measures have fewer beats based on pickupDuration or actual notes.
 */
function getMeasureBeatCount(
  measureIndex: number,
  score: TuneComposerScore,
): number {
  const measure = score.measures[measureIndex];
  if (measure?.isPickup) {
    const beatUnitDuration = getBeatUnitDuration(score.timeSignature);
    // Use pickupDuration if set, otherwise calculate from notes
    const duration = score.pickupDuration ?? getMeasureDuration(measure);
    return Math.max(1, Math.round(duration / beatUnitDuration));
  }
  // Regular measure
  return getBeatUnitCount(score.timeSignature);
}

// =============================================================================
// Types
// =============================================================================

export interface UseTuneComposerChordsReturn {
  // Mode
  chordMode: boolean;
  toggleChordMode: () => void;

  // Cursor
  chordCursor: { measureIndex: number; beatPosition: number } | null;
  moveChordCursorNext: () => void;
  moveChordCursorPrev: () => void;
  canChordCursorGoPrev: boolean;
  canChordCursorGoNext: boolean;

  // Current chord
  currentChordSymbol: string;
  setChordAtCursor: (symbol: string) => void;
  removeChordAtCursor: () => void;

  // Visibility
  showChordSymbols: boolean;
  toggleChordSymbolVisibility: () => void;

  // Active progression
  activeProgression: ChordProgression | null;

  // Progression management
  addChordProgression: (progression: ChordProgression) => void;
  selectProgression: (progressionId: string) => void;
  createProgression: (name: string) => string;
  duplicateProgression: (sourceId: string, newName: string) => string | null;
  renameProgression: (progressionId: string, newName: string) => boolean;
  deleteProgression: (progressionId: string) => boolean;
  setActiveProgressionChords: (chords: ChordSymbol[]) => void;
  clearActiveProgressionChords: () => void;
  setProgressionSystemDefined: (
    progressionId: string,
    isSystemDefined: boolean,
  ) => boolean;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useTuneComposerChords(
  state: TuneComposerState,
  setState: React.Dispatch<React.SetStateAction<TuneComposerState>>,
  updateScore: (
    updater: (score: TuneComposerScore) => TuneComposerScore,
  ) => void,
): UseTuneComposerChordsReturn {
  // ===========================================================================
  // Mode Toggle
  // ===========================================================================

  /**
   * Toggle chord mode on/off.
   * When entering, places cursor at measure 0, beat 0.
   * When exiting, clears the chord cursor.
   */
  const toggleChordMode = useCallback(() => {
    setState((prev) => {
      const newChordMode = !prev.chordMode;
      if (newChordMode) {
        // Entering chord mode - set cursor to first beat of first measure
        return {
          ...prev,
          chordMode: true,
          chordCursor: { measureIndex: 0, beatPosition: 0 },
        };
      } else {
        // Exiting chord mode
        return {
          ...prev,
          chordMode: false,
          chordCursor: null,
        };
      }
    });
  }, [setState]);

  // ===========================================================================
  // Derived State
  // ===========================================================================

  /**
   * Get the active chord progression (respects activeProgressionId).
   */
  const activeProgression = useMemo((): ChordProgression | null => {
    return getActiveProgression(state.score) ?? null;
  }, [state.score]);

  /**
   * Get the current chord symbol at the chord cursor position.
   * Uses beat unit index directly since chords store beat unit indices.
   */
  const currentChordSymbol = useMemo((): string => {
    if (!state.chordCursor || !activeProgression) return "";
    const chord = findChordAtPosition(
      activeProgression.chords,
      state.chordCursor.measureIndex,
      state.chordCursor.beatPosition,
    );
    return chord?.symbol ?? "";
  }, [state.chordCursor, activeProgression]);

  /**
   * Whether chord symbols are visible in score display.
   */
  const showChordSymbols = useMemo(
    (): boolean => state.score.displaySettings.showChordSymbols ?? true,
    [state.score.displaySettings.showChordSymbols],
  );

  /**
   * Whether the chord cursor can move to the previous beat.
   */
  const canChordCursorGoPrev = useMemo((): boolean => {
    if (!state.chordCursor) return false;
    const { measureIndex, beatPosition } = state.chordCursor;
    return measureIndex > 0 || beatPosition > 0;
  }, [state.chordCursor]);

  /**
   * Whether the chord cursor can move to the next beat.
   */
  const canChordCursorGoNext = useMemo((): boolean => {
    if (!state.chordCursor) return false;
    const { measureIndex, beatPosition } = state.chordCursor;
    const beatUnitCount = getMeasureBeatCount(measureIndex, state.score);
    const totalMeasures = state.score.measures.length;

    // Can go next if not at last beat of last measure
    return measureIndex < totalMeasures - 1 || beatPosition < beatUnitCount - 1;
  }, [
    state.chordCursor,
    state.score,
  ]);

  // ===========================================================================
  // Chord Operations
  // ===========================================================================

  /**
   * Set a chord at the current cursor position.
   * Stores beat unit index directly; MusicXML generator converts to quarter notes.
   */
  const setChordAtCursor = useCallback(
    (symbol: string) => {
      if (!state.chordCursor || !activeProgression) return;
      const { measureIndex, beatPosition } = state.chordCursor;

      updateScore((score) => {
        const progIndex = score.chordProgressions.findIndex(
          (p) => p.id === activeProgression.id,
        );
        if (progIndex === -1) return score;

        const newProgressions = [...score.chordProgressions];
        const prog = { ...newProgressions[progIndex] };
        const existingIndex = prog.chords.findIndex(
          (c) =>
            c.measureIndex === measureIndex && c.beatPosition === beatPosition,
        );

        if (existingIndex !== -1) {
          // Update existing chord
          const newChords = [...prog.chords];
          newChords[existingIndex] = {
            ...newChords[existingIndex],
            symbol,
          };
          prog.chords = newChords;
        } else {
          // Add new chord
          const newChord = createChordSymbol(
            symbol,
            measureIndex,
            beatPosition,
          );
          prog.chords = [...prog.chords, newChord];
        }

        newProgressions[progIndex] = prog;
        return { ...score, chordProgressions: newProgressions };
      });
    },
    [state.chordCursor, activeProgression, updateScore],
  );

  /**
   * Remove the chord at the current cursor position.
   * Uses beat unit index directly.
   */
  const removeChordAtCursor = useCallback(() => {
    if (!state.chordCursor || !activeProgression) return;
    const { measureIndex, beatPosition } = state.chordCursor;

    updateScore((score) => {
      const progIndex = score.chordProgressions.findIndex(
        (p) => p.id === activeProgression.id,
      );
      if (progIndex === -1) return score;

      const newProgressions = [...score.chordProgressions];
      const prog = { ...newProgressions[progIndex] };
      prog.chords = prog.chords.filter(
        (c) =>
          !(c.measureIndex === measureIndex && c.beatPosition === beatPosition),
      );
      newProgressions[progIndex] = prog;
      return { ...score, chordProgressions: newProgressions };
    });
  }, [state.chordCursor, activeProgression, updateScore]);

  // ===========================================================================
  // Cursor Navigation
  // ===========================================================================

  /**
   * Move chord cursor to the next beat position.
   * Advances by 1 beat unit (e.g., eighth note in 6/8), moving to the next measure if needed.
   */
  const moveChordCursorNext = useCallback(() => {
    setState((prev) => {
      if (!prev.chordMode || !prev.chordCursor) return prev;
      const { measureIndex, beatPosition } = prev.chordCursor;
      const beatUnitCount = getMeasureBeatCount(measureIndex, prev.score);
      const nextBeat = beatPosition + 1;

      if (nextBeat >= beatUnitCount) {
        // Move to next measure
        const nextMeasure = measureIndex + 1;
        if (nextMeasure >= prev.score.measures.length) {
          // At end of score
          return prev;
        }
        return {
          ...prev,
          chordCursor: { measureIndex: nextMeasure, beatPosition: 0 },
        };
      } else {
        return {
          ...prev,
          chordCursor: { measureIndex, beatPosition: nextBeat },
        };
      }
    });
  }, [setState]);

  /**
   * Move chord cursor to the previous beat position.
   * Goes back by 1 beat unit, moving to the previous measure if needed.
   */
  const moveChordCursorPrev = useCallback(() => {
    setState((prev) => {
      if (!prev.chordMode || !prev.chordCursor) return prev;
      const { measureIndex, beatPosition } = prev.chordCursor;

      if (beatPosition > 0) {
        return {
          ...prev,
          chordCursor: { measureIndex, beatPosition: beatPosition - 1 },
        };
      } else if (measureIndex > 0) {
        // Move to last beat of previous measure
        const prevMeasureBeatCount = getMeasureBeatCount(measureIndex - 1, prev.score);
        return {
          ...prev,
          chordCursor: {
            measureIndex: measureIndex - 1,
            beatPosition: prevMeasureBeatCount - 1,
          },
        };
      }
      // At beginning
      return prev;
    });
  }, [setState]);

  // ===========================================================================
  // Visibility
  // ===========================================================================

  /**
   * Toggle chord symbol visibility in the score.
   */
  const toggleChordSymbolVisibility = useCallback(() => {
    updateScore((score) => ({
      ...score,
      displaySettings: {
        ...score.displaySettings,
        showChordSymbols: !score.displaySettings.showChordSymbols,
      },
    }));
  }, [updateScore]);

  // ===========================================================================
  // Progression Management
  // ===========================================================================

  /**
   * Add a chord progression to the score.
   * If isDefault is true on the new progression, set it as active.
   */
  const addChordProgression = useCallback(
    (progression: ChordProgression) => {
      updateScore((score) => {
        // Check if a progression with this ID already exists
        const existingIndex = score.chordProgressions.findIndex(
          (p) => p.id === progression.id,
        );

        let newProgressions: ChordProgression[];
        if (existingIndex !== -1) {
          // Replace existing progression
          newProgressions = [...score.chordProgressions];
          newProgressions[existingIndex] = progression;
        } else {
          // Add new progression
          newProgressions = [...score.chordProgressions, progression];
        }

        // If this is marked as default, update activeProgressionId
        const newDisplaySettings =
          progression.isDefault || score.chordProgressions.length === 0
            ? {
                ...score.displaySettings,
                activeProgressionId: progression.id,
                showChordSymbols: true,
              }
            : score.displaySettings;

        return {
          ...score,
          chordProgressions: newProgressions,
          displaySettings: newDisplaySettings,
        };
      });
    },
    [updateScore],
  );

  /**
   * Select a chord progression by ID, making it the active progression.
   */
  const selectProgression = useCallback(
    (progressionId: string) => {
      updateScore((score) => {
        // Verify the progression exists
        const exists = score.chordProgressions.some(
          (p) => p.id === progressionId,
        );
        if (!exists) return score;

        return {
          ...score,
          displaySettings: {
            ...score.displaySettings,
            activeProgressionId: progressionId,
          },
        };
      });
    },
    [updateScore],
  );

  /**
   * Create a new empty chord progression with the given name.
   * The new progression is automatically selected as active.
   */
  const createProgression = useCallback(
    (name: string): string => {
      const newProgression = createChordProgression(name);
      const newId = newProgression.id;

      updateScore((score) => ({
        ...score,
        chordProgressions: [...score.chordProgressions, newProgression],
        displaySettings: {
          ...score.displaySettings,
          activeProgressionId: newId,
        },
      }));

      return newId;
    },
    [updateScore],
  );

  /**
   * Duplicate an existing progression with a new name.
   * The duplicated progression is automatically selected as active.
   */
  const duplicateProgression = useCallback(
    (sourceId: string, newName: string): string | null => {
      // Find source synchronously to check if it exists
      const source = state.score.chordProgressions.find(
        (p) => p.id === sourceId,
      );
      if (!source) return null;

      // Create the duplicate with a known ID synchronously
      const duplicated = duplicateProgressionUtil(source, newName);
      const newId = duplicated.id;

      // Now update state
      updateScore((score) => ({
        ...score,
        chordProgressions: [...score.chordProgressions, duplicated],
        displaySettings: {
          ...score.displaySettings,
          activeProgressionId: newId,
        },
      }));

      return newId;
    },
    [state.score.chordProgressions, updateScore],
  );

  /**
   * Rename a chord progression.
   */
  const renameProgression = useCallback(
    (progressionId: string, newName: string): boolean => {
      let success = false;

      updateScore((score) => {
        const index = score.chordProgressions.findIndex(
          (p) => p.id === progressionId,
        );
        if (index === -1) return score;

        success = true;
        const newProgressions = [...score.chordProgressions];
        newProgressions[index] = {
          ...score.chordProgressions[index],
          name: newName,
        };
        return { ...score, chordProgressions: newProgressions };
      });

      return success;
    },
    [updateScore],
  );

  /**
   * Delete a chord progression.
   * If the deleted progression was active, switches to the first available.
   */
  const deleteProgression = useCallback(
    (progressionId: string): boolean => {
      let success = false;

      updateScore((score) => {
        const progression = score.chordProgressions.find(
          (p) => p.id === progressionId,
        );
        if (!progression) return score;

        success = true;
        const newProgressions = score.chordProgressions.filter(
          (p) => p.id !== progressionId,
        );

        // If we deleted the active progression, switch to the first one
        let newActiveId = score.displaySettings.activeProgressionId;
        if (newActiveId === progressionId) {
          newActiveId = newProgressions[0]?.id ?? "";
        }

        return {
          ...score,
          chordProgressions: newProgressions,
          displaySettings: {
            ...score.displaySettings,
            activeProgressionId: newActiveId,
          },
        };
      });

      return success;
    },
    [updateScore],
  );

  /**
   * Set chords on the active progression (used by chord inference).
   * Replaces the chords array without creating a new progression.
   */
  const setActiveProgressionChords = useCallback(
    (chords: ChordSymbol[]) => {
      updateScore((score) => {
        // Use the same logic as getActiveProgression to find the active one
        const activeProg = getActiveProgression(score);
        if (!activeProg) return score;

        const index = score.chordProgressions.findIndex(
          (p) => p.id === activeProg.id,
        );
        if (index === -1) return score;

        const newProgressions = [...score.chordProgressions];
        newProgressions[index] = {
          ...newProgressions[index],
          chords,
        };
        return {
          ...score,
          chordProgressions: newProgressions,
          displaySettings: {
            ...score.displaySettings,
            showChordSymbols: true,
          },
        };
      });
    },
    [updateScore],
  );

  /**
   * Clear all chords from the active progression.
   */
  const clearActiveProgressionChords = useCallback(() => {
    setActiveProgressionChords([]);
  }, [setActiveProgressionChords]);

  /**
   * Set whether a progression is system-defined.
   * Admin tool control for marking progressions as read-only for users.
   */
  const setProgressionSystemDefined = useCallback(
    (progressionId: string, isSystemDefined: boolean): boolean => {
      let success = false;

      updateScore((score) => {
        const index = score.chordProgressions.findIndex(
          (p) => p.id === progressionId,
        );
        if (index === -1) return score;

        success = true;
        const newProgressions = [...score.chordProgressions];
        newProgressions[index] = {
          ...newProgressions[index],
          isSystemDefined,
        };
        return { ...score, chordProgressions: newProgressions };
      });

      return success;
    },
    [updateScore],
  );

  // ===========================================================================
  // Return
  // ===========================================================================

  return {
    // Mode
    chordMode: state.chordMode,
    toggleChordMode,

    // Cursor
    chordCursor: state.chordCursor,
    moveChordCursorNext,
    moveChordCursorPrev,
    canChordCursorGoPrev,
    canChordCursorGoNext,

    // Current chord
    currentChordSymbol,
    setChordAtCursor,
    removeChordAtCursor,

    // Visibility
    showChordSymbols,
    toggleChordSymbolVisibility,

    // Active progression
    activeProgression,

    // Progression management
    addChordProgression,
    selectProgression,
    createProgression,
    duplicateProgression,
    renameProgression,
    deleteProgression,
    setActiveProgressionChords,
    clearActiveProgressionChords,
    setProgressionSystemDefined,
  };
}
