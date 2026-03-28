/**
 * useTuneComposerState Hook
 *
 * Main state management hook for the Tune Composer.
 * Extends composer functionality with lyrics, dynamics, articulations, and expressions.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Accidental,
  ArticulationType,
  Clef,
  CursorPosition,
  DurationValue,
  DynamicType,
  DynamicTextType,
  KeySignature,
  MeasureValidation,
  Note,
  PitchName,
  TimeSignature,
  TuneComposerScore,
  TuneComposerState,
  WedgeMark,
} from "../types";
import {
  createInitialState,
  createMeasure,
  createRest,
  DEFAULT_OCTAVE_MIDI,
  DURATION,
  getBeatsPerMeasure,
  getMeasureDuration,
  getNoteDuration,
  validateMeasure,
  getBeatPositionAt,
} from "../types";
import {
  createAddMeasureAction,
  createDeleteMeasureAction,
  createSetPickupAction,
} from "../types/actionTypes";

// Re-use composer utils
import {
  findNotePosition,
  getNoteAtCursor,
  moveCursorLeft,
  moveCursorRight,
  moveCursorToEnd,
  moveCursorToStart,
} from "../../composer/utils/cursorUtils";
import {
  getAccidentalForMidi,
  transposeNoteByFunction,
} from "../../composer/utils/pitchUtils";
import {
  useTuneComposerUndo,
  reverseAction,
  reapplyAction,
} from "./useTuneComposerUndo";
import { useTuneComposerChords } from "./useTuneComposerChords";
import { useTuneComposerLyrics } from "./useTuneComposerLyrics";
import { useTuneComposerMarkings } from "./useTuneComposerMarkings";
import {
  useTuneComposerNotes,
  type PendingRhythmChange,
  type PendingRhythmChangeType,
} from "./useTuneComposerNotes";

// Re-export types for external use
export type { PendingRhythmChange, PendingRhythmChangeType };

// =============================================================================
// Return Type
// =============================================================================

export interface UseTuneComposerStateReturn {
  // State
  state: TuneComposerState;
  score: TuneComposerScore;
  cursor: CursorPosition;
  selectedNote: Note | null;

  // Validation
  currentMeasureValidation: MeasureValidation;
  allMeasuresValid: boolean;

  // Cursor Position
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
  dottedMode: boolean;
  toggleDottedMode: () => void;
  tripletPosition: number | undefined;
  tripletGroupType: "eighth" | "quarter" | "mixed" | undefined;
  canStartTriplet: boolean;

  // Navigation
  moveCursor: (direction: "left" | "right" | "start" | "end") => void;
  selectNote: (noteId: string) => void;
  clearSelection: () => void;

  // Measure Operations
  addMeasure: () => void;
  deleteMeasure: () => void;
  deleteLastMeasure: () => void;
  fillMeasureWithRests: () => void;

  // Pickup Measure
  /** Whether the score has a pickup measure */
  hasPickup: boolean;
  /** Duration of the pickup measure in beats (undefined if no pickup) */
  pickupDuration: number | undefined;
  /** Set or update pickup measure with given duration */
  setPickupMeasure: (duration: number) => void;
  /** Remove pickup measure */
  removePickupMeasure: () => void;

  // Score Settings
  setClef: (clef: Clef) => void;
  setClefWithTransposition: (clef: Clef, transposeOctaves: number) => void;
  hasActualNotes: () => boolean;
  setKeySignature: (key: KeySignature) => void;
  setKeySignatureWithTransposition: (
    key: KeySignature,
    transposeSemitones: number,
  ) => void;
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
  loadScore: (score: TuneComposerScore) => void;
  getScore: () => TuneComposerScore;
  clearScore: () => void;
  isDirty: boolean;
  markClean: () => void;

  // === LYRICS MODE ===
  /** Whether lyrics editing mode is active */
  lyricsMode: boolean;
  /** Toggle lyrics mode on/off */
  toggleLyricsMode: () => void;
  /** Current lyric cursor position (index in flat pitched note list) */
  lyricsCursor: number | null;
  /** Move lyric cursor to next pitched note */
  moveLyricsCursorNext: () => void;
  /** Move lyric cursor to previous pitched note */
  moveLyricsCursorPrev: () => void;
  /** Set lyric on current lyric cursor position */
  setLyric: (
    text: string,
    syllabic?: "single" | "begin" | "middle" | "end",
  ) => void;
  /** Remove lyric from current lyric cursor position */
  removeLyric: () => void;
  /** Extend melisma from current position (move cursor right and extend span) */
  extendMelisma: () => void;
  /** Shrink melisma from current position (move cursor left and shrink span) */
  shrinkMelisma: () => void;

  // === ANNOTATIONS ===
  /** Set dynamic marking on selected note */
  setDynamic: (dynamic: DynamicType) => void;
  /** Remove dynamic marking from selected note */
  removeDynamic: () => void;
  /** Set text dynamic marking on selected note */
  setDynamicText: (text: DynamicTextType) => void;
  /** Remove text dynamic marking from selected note */
  removeDynamicText: () => void;
  /** Set wedge (crescendo/diminuendo) on selected note */
  setWedge: (wedge: WedgeMark) => void;
  /** Remove wedge from selected note */
  removeWedge: () => void;
  /** Set articulation on selected note */
  setArticulation: (articulation: ArticulationType) => void;
  /** Remove articulation from selected note */
  removeArticulation: () => void;
  /** Set expression text on selected note */
  setExpression: (text: string) => void;
  /** Remove expression text from selected note */
  removeExpression: () => void;

  // === DYNAMICS MODE ===
  /** Whether dynamics mode is active */
  dynamicsMode: boolean;
  /** Toggle dynamics mode on/off */
  toggleDynamicsMode: () => void;

  // === WEDGE MODE ===
  /** Whether wedge editing mode is active */
  wedgeMode: boolean;
  /** Toggle wedge mode on/off */
  toggleWedgeMode: () => void;
  /** Start a crescendo from current note */
  startCrescendo: () => void;
  /** Start a diminuendo from current note */
  startDiminuendo: () => void;
  /** Extend wedge to next note */
  extendWedge: () => void;
  /** End wedge mode and finalize */
  endWedgeMode: () => void;
  /** Type of wedge being edited */
  activeWedgeType: "crescendo" | "diminuendo" | null;
  /** Note ID where active wedge starts */
  activeWedgeStartId: string | null;
  /** Remove wedge involving selected note */
  removeWedgeMarking: () => void;

  // === SLUR MODE ===
  /** Whether slur editing mode is active */
  slurMode: boolean;
  /** Toggle slur mode on/off */
  toggleSlurMode: () => void;
  /** Start a slur from current note (creates 2-note slur to next note) */
  startSlur: () => void;
  /** Extend slur start to previous note */
  extendSlurLeft: () => void;
  /** Extend slur end to next note */
  extendSlurRight: () => void;
  /** Exit slur mode */
  endSlurMode: () => void;
  /** Note ID where active slur starts (null if no active slur) */
  activeSlurStartId: string | null;
  /** Note ID where active slur ends (null if no active slur) */
  activeSlurEndId: string | null;
  /** Remove slur from current note (clears both slurStart and slurEnd) */
  removeSlur: () => void;
  /** Flip slur placement (above/below) */
  flipSlur: () => void;

  // === EXPRESSION MODE ===
  /** Whether expression text mode is active */
  expressionMode: boolean;
  /** Toggle expression mode on/off */
  toggleExpressionMode: () => void;

  // === CHORD MODE ===
  /** Whether chord entry mode is active */
  chordMode: boolean;
  /** Toggle chord mode on/off */
  toggleChordMode: () => void;
  /** Current chord cursor position */
  chordCursor: { measureIndex: number; beatPosition: number } | null;
  /** Current chord symbol at cursor position */
  currentChordSymbol: string;
  /** Set chord at current cursor position */
  setChordAtCursor: (symbol: string) => void;
  /** Remove chord at current cursor position */
  removeChordAtCursor: () => void;
  /** Move chord cursor to next beat */
  moveChordCursorNext: () => void;
  /** Move chord cursor to previous beat */
  moveChordCursorPrev: () => void;
  /** Whether chord cursor can move to previous beat */
  canChordCursorGoPrev: boolean;
  /** Whether chord cursor can move to next beat */
  canChordCursorGoNext: boolean;
  /** Current chord subdivision: 1=beat, 2=half, 3=triplet */
  chordSubdivision: 1 | 2 | 3;
  /** Cycle through chord subdivisions */
  cycleChordSubdivision: () => void;
  /** Whether chord symbols are visible in the score */
  showChordSymbols: boolean;
  /** Toggle chord symbol visibility */
  toggleChordSymbolVisibility: () => void;
  /** Active chord progression (the one being edited) */
  activeProgression:
    | import("../types/tuneComposerTypes").ChordProgression
    | null;

  // === RHYTHM CHANGE CONFIRMATION ===
  /** Pending rhythm change awaiting confirmation (null if none) */
  pendingRhythmChange: PendingRhythmChange | null;
  /** Confirm pending rhythm change (clears chords/lyrics and executes) */
  confirmRhythmChange: () => void;
  /** Cancel pending rhythm change */
  cancelRhythmChange: () => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useTuneComposerState(
  initialScore?: TuneComposerScore,
): UseTuneComposerStateReturn {
  const [state, setState] = useState<TuneComposerState>(() =>
    createInitialState(initialScore),
  );

  const undoManager = useTuneComposerUndo(100);

  const cursorRef = useRef(state.cursor);
  const suppressAddMeasurePromptRef = useRef(false);

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

  const noteAtCursor = useMemo((): Note | null => {
    const measure = score.measures[cursor.measureIndex];
    if (!measure) return null;
    return measure.notes[cursor.noteIndex] ?? null;
  }, [score.measures, cursor.measureIndex, cursor.noteIndex]);

  const tripletGroupInfo = useMemo((): {
    type: "eighth" | "quarter" | "mixed";
    totalDuration: number;
  } | null => {
    if (!noteAtCursor?.tripletGroupId) return null;
    const measure = score.measures[cursor.measureIndex];
    if (!measure) return null;

    const groupNotes = measure.notes.filter(
      (n) => n.tripletGroupId === noteAtCursor.tripletGroupId,
    );

    const totalDuration = groupNotes.reduce(
      (sum, n) => sum + getNoteDuration(n),
      0,
    );

    const tolerance = 0.001;
    const actualNotes = groupNotes.filter((n) => n.midi !== null);

    const allActualAreEighths = actualNotes.every(
      (n) => Math.abs(getNoteDuration(n) - DURATION.TRIPLET_EIGHTH) < tolerance,
    );
    const allActualAreQuarters = actualNotes.every(
      (n) =>
        Math.abs(getNoteDuration(n) - DURATION.TRIPLET_QUARTER) < tolerance,
    );

    if (actualNotes.length === 3 && allActualAreEighths) {
      return { type: "eighth", totalDuration };
    } else if (actualNotes.length === 3 && allActualAreQuarters) {
      return { type: "quarter", totalDuration };
    }
    return { type: "mixed", totalDuration };
  }, [score.measures, cursor.measureIndex, noteAtCursor]);

  const canStartTriplet = useMemo((): boolean => {
    if (noteAtCursor?.tripletGroupId) return true;
    const measure = score.measures[cursor.measureIndex];
    if (!measure) return true;
    const beatPosition = getBeatPositionAt(measure, cursor.noteIndex);
    const tolerance = 0.001;
    const beatTimes3 = beatPosition * 3;
    return Math.abs(beatTimes3 - Math.round(beatTimes3)) < tolerance;
  }, [score.measures, cursor.measureIndex, cursor.noteIndex, noteAtCursor]);

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
      (m) => m.isPickup || validateMeasure(m, score.timeSignature).isComplete,
    );
  }, [score.measures, score.timeSignature]);

  // ==========================================================================
  // Helper: Update Score with Dirty Flag
  // ==========================================================================

  const updateScore = useCallback(
    (updater: (score: TuneComposerScore) => TuneComposerScore) => {
      setState((prev) => ({
        ...prev,
        score: updater(prev.score),
        isDirty: true,
      }));
    },
    [],
  );

  // ==========================================================================
  // Composed Sub-Hooks
  // ==========================================================================

  const chordsHook = useTuneComposerChords(state, setState, updateScore);
  const lyricsHook = useTuneComposerLyrics(
    state,
    setState,
    updateScore,
    undoManager,
  );
  const markingsHook = useTuneComposerMarkings(
    state,
    setState,
    updateScore,
    undoManager,
  );
  const notesHook = useTuneComposerNotes(
    state,
    setState,
    updateScore,
    undoManager,
    cursorRef,
    suppressAddMeasurePromptRef,
  );

  // ==========================================================================
  // Duration
  // ==========================================================================

  const setDuration = useCallback((duration: DurationValue) => {
    setState((prev) => ({ ...prev, selectedDuration: duration }));
  }, []);

  const toggleDottedMode = useCallback(() => {
    setState((prev) => ({ ...prev, dottedMode: !prev.dottedMode }));
  }, []);

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
  }, [state.score.measures.length, state.score.timeSignature, undoManager]);

  const deleteMeasure = useCallback(() => {
    if (state.score.measures.length <= 1) return;

    const measureIndex = state.cursor.measureIndex;
    const deletedMeasure = state.score.measures[measureIndex];

    const action = createDeleteMeasureAction(measureIndex, deletedMeasure);
    undoManager.pushAction(action);

    suppressAddMeasurePromptRef.current = true;

    setState((prev) => {
      const newMeasures = prev.score.measures.filter(
        (_, i) => i !== measureIndex,
      );

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
  }, [state.score.measures, state.cursor.measureIndex, undoManager]);

  const deleteLastMeasure = useCallback(() => {
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
  }, [state.score.measures, undoManager]);

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

  // ==========================================================================
  // Pickup Measure Operations
  // ==========================================================================

  /**
   * Generate rests to fill a given duration in beats.
   * For pickup measures, we put fractional beats first, then whole beats.
   * Rests are ordered from smallest to largest (building up).
   */
  const generateRestsForDuration = useCallback((duration: number): Note[] => {
    const rests: Note[] = [];
    let remaining = duration;

    // Standard rest durations from smallest to largest
    const allDurations: DurationValue[] = [
      DURATION.SIXTEENTH,
      DURATION.EIGHTH,
      DURATION.QUARTER,
      DURATION.HALF,
    ];

    // First, handle any fractional beat (less than 1 beat) with small rests
    const fractionalPart = remaining % 1;
    if (fractionalPart > 0.001) {
      let frac = fractionalPart;
      // Use largest small rest that fits first, working down
      for (const d of [DURATION.EIGHTH, DURATION.SIXTEENTH]) {
        while (frac >= d - 0.001) {
          rests.push(createRest(d));
          frac -= d;
        }
      }
      remaining -= fractionalPart;
    }

    // Then fill remaining whole beats from smallest to largest
    // This creates a "building up" pattern: quarter, half, etc.
    while (remaining > 0.001) {
      let found = false;
      // Find largest rest that fits
      let bestDuration: DurationValue | null = null;
      for (const d of allDurations) {
        if (remaining >= d - 0.001) {
          bestDuration = d;
        }
      }
      if (bestDuration !== null) {
        rests.push(createRest(bestDuration));
        remaining -= bestDuration;
        found = true;
      }
      if (!found) {
        break; // Safety: avoid infinite loop
      }
    }

    // Sort whole-beat rests (after fractional) from smallest to largest
    // Find where fractional rests end
    const fractionalRestCount = rests.filter((r) => r.duration < 1).length;
    const fractionalRests = rests.slice(0, fractionalRestCount);
    const wholeRests = rests.slice(fractionalRestCount);
    wholeRests.sort((a, b) => a.duration - b.duration);

    return [...fractionalRests, ...wholeRests];
  }, []);

  const hasPickup = useMemo(
    () => state.score.measures[0]?.isPickup === true,
    [state.score.measures],
  );

  const pickupDuration = useMemo(
    () => state.score.pickupDuration,
    [state.score.pickupDuration],
  );

  const setPickupMeasure = useCallback(
    (duration: number) => {
      const previousDuration = state.score.pickupDuration;
      const previousFirstMeasure = state.score.measures[0];

      // Generate rests for the pickup measure
      const pickupRests = generateRestsForDuration(duration);
      const newPickupMeasure = {
        id: previousFirstMeasure?.id ?? `pickup-${Date.now()}`,
        notes: pickupRests,
        isPickup: true,
      };

      // If there was already a pickup, replace it; otherwise insert at beginning
      const alreadyHasPickup = previousFirstMeasure?.isPickup === true;

      const action = createSetPickupAction(
        duration,
        previousDuration,
        previousFirstMeasure,
        newPickupMeasure,
      );
      undoManager.pushAction(action);

      setState((prev) => {
        let newMeasures;
        if (alreadyHasPickup) {
          // Replace existing pickup
          newMeasures = [newPickupMeasure, ...prev.score.measures.slice(1)];
        } else {
          // Insert new pickup at beginning
          newMeasures = [newPickupMeasure, ...prev.score.measures];
        }

        // Reset cursor to first note of pickup
        const newCursor = { measureIndex: 0, noteIndex: 0 };
        cursorRef.current = newCursor;

        return {
          ...prev,
          score: {
            ...prev.score,
            measures: newMeasures,
            pickupDuration: duration,
            updatedAt: new Date().toISOString(),
          },
          cursor: newCursor,
          selectedNoteId: newPickupMeasure.notes[0]?.id ?? null,
          isDirty: true,
        };
      });
    },
    [
      state.score.measures,
      state.score.pickupDuration,
      generateRestsForDuration,
      undoManager,
    ],
  );

  const removePickupMeasure = useCallback(() => {
    const firstMeasure = state.score.measures[0];
    if (!firstMeasure?.isPickup) return;

    // Can't remove if it's the only measure
    if (state.score.measures.length <= 1) return;

    const previousDuration = state.score.pickupDuration;

    // When removing pickup, just delete it (don't replace with full measure)
    // Use a placeholder for newFirstMeasure since we're deleting
    const action = createSetPickupAction(
      undefined,
      previousDuration,
      firstMeasure,
      firstMeasure, // placeholder - we're removing, not replacing
    );
    undoManager.pushAction(action);

    setState((prev) => {
      // Remove the pickup measure entirely
      const newMeasures = prev.score.measures.slice(1);

      const newCursor = { measureIndex: 0, noteIndex: 0 };
      cursorRef.current = newCursor;

      return {
        ...prev,
        score: {
          ...prev.score,
          measures: newMeasures,
          pickupDuration: undefined,
          updatedAt: new Date().toISOString(),
        },
        cursor: newCursor,
        selectedNoteId: newMeasures[0]?.notes[0]?.id ?? null,
        isDirty: true,
      };
    });
  }, [state.score.measures, state.score.pickupDuration, undoManager]);

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

  const hasActualNotes = useCallback((): boolean => {
    return state.score.measures.some((measure) =>
      measure.notes.some((note) => note.midi !== null),
    );
  }, [state.score.measures]);

  const setClefWithTransposition = useCallback(
    (clef: Clef, transposeOctaves: number) => {
      const prevClef = state.score.clef;
      if (clef === prevClef && transposeOctaves === 0) return;

      undoManager.pushAction({
        type: "CHANGE_CLEF",
        previousClef: prevClef,
        newClef: clef,
      });

      setState((prev) => {
        const semitoneShift = transposeOctaves * 12;
        const newMeasures = prev.score.measures.map((measure) => ({
          ...measure,
          notes: measure.notes.map((note) => {
            if (note.midi === null) return note;
            const newMidi = note.midi + semitoneShift;
            if (newMidi < 0 || newMidi > 127) return note;
            // Clear slurPlacement so it auto-recalculates based on new stem direction
            return { ...note, midi: newMidi, slurPlacement: undefined };
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
            if (note.midi === null) return note;

            if (transposeSemitones === 0) {
              const newAccidental = getAccidentalForMidi(note.midi, key);
              return { ...note, accidental: newAccidental };
            }

            const transposed = transposeNoteByFunction(
              note.midi,
              note.accidental,
              prev.score.keySignature,
              key,
              transposeSemitones,
            );

            if (transposed.midi < 0 || transposed.midi > 127) return note;

            return {
              ...note,
              midi: transposed.midi,
              accidental: transposed.accidental,
              // Clear slurPlacement so it auto-recalculates based on new stem direction
              slurPlacement: undefined,
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
      if (hasActualNotes()) return false;

      const prevTimeSig = state.score.timeSignature;
      if (
        timeSig.beats === prevTimeSig.beats &&
        timeSig.beatUnit === prevTimeSig.beatUnit
      ) {
        return true;
      }

      undoManager.pushAction({
        type: "CHANGE_TIME_SIGNATURE",
        previousTimeSig: prevTimeSig,
        newTimeSig: timeSig,
      });

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

  const clearScore = useCallback(() => {
    setState((prev) => {
      const emptyMeasure = createMeasure(prev.score.timeSignature);
      // Clear chord progressions when clearing score
      const clearedProgressions = prev.score.chordProgressions.map((prog) => ({
        ...prog,
        chords: [],
      }));
      return {
        ...createInitialState({
          ...prev.score,
          measures: [emptyMeasure],
          chordProgressions: clearedProgressions,
          updatedAt: new Date().toISOString(),
        }),
        isDirty: true,
      };
    });
    undoManager.clearHistory();
  }, [undoManager]);

  const loadScore = useCallback(
    (score: TuneComposerScore) => {
      setState(createInitialState(score));
      undoManager.clearHistory();
    },
    [undoManager],
  );

  const getScore = useCallback(
    (): TuneComposerScore => state.score,
    [state.score],
  );

  const markClean = useCallback(() => {
    setState((prev) => ({ ...prev, isDirty: false }));
  }, []);

  // ==========================================================================
  // Computed: isAtLastMeasureEnd
  // ==========================================================================

  const isAtLastMeasureEnd = useMemo(() => {
    if (suppressAddMeasurePromptRef.current) {
      suppressAddMeasurePromptRef.current = false;
      return false;
    }

    const lastMeasureIndex = state.score.measures.length - 1;
    if (state.cursor.measureIndex !== lastMeasureIndex) return false;
    const lastMeasure = state.score.measures[lastMeasureIndex];
    if (!lastMeasure || lastMeasure.notes.length === 0) return false;

    const lastNote = lastMeasure.notes[lastMeasure.notes.length - 1];
    const selectedIsLastNote = state.selectedNoteId === lastNote.id;
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
    insertNote: notesHook.insertNote,
    insertRest: notesHook.insertRest,
    deleteNote: notesHook.deleteNote,
    changePitch: notesHook.changePitch,
    changeOctave: notesHook.changeOctave,
    applyAccidental: notesHook.applyAccidental,
    toggleTie: notesHook.toggleTie,

    // Duration
    setDuration,
    changeDurationOfSelected: notesHook.changeDurationOfSelected,
    dottedMode: state.dottedMode,
    toggleDottedMode,
    tripletPosition: noteAtCursor?.tripletPosition,
    tripletGroupType: tripletGroupInfo?.type,
    canStartTriplet,

    // Navigation
    moveCursor,
    selectNote,
    clearSelection,

    // Measure Operations
    addMeasure,
    deleteMeasure,
    deleteLastMeasure,
    fillMeasureWithRests,

    // Pickup Measure
    hasPickup,
    pickupDuration,
    setPickupMeasure,
    removePickupMeasure,

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
    clearScore,
    isDirty: state.isDirty,
    markClean,

    // Lyrics Mode (from sub-hook)
    lyricsMode: lyricsHook.lyricsMode,
    toggleLyricsMode: lyricsHook.toggleLyricsMode,
    lyricsCursor: lyricsHook.lyricsCursor,
    moveLyricsCursorNext: lyricsHook.moveLyricsCursorNext,
    moveLyricsCursorPrev: lyricsHook.moveLyricsCursorPrev,
    setLyric: lyricsHook.setLyric,
    removeLyric: lyricsHook.removeLyric,
    extendMelisma: lyricsHook.extendMelisma,
    shrinkMelisma: lyricsHook.shrinkMelisma,

    // Annotations (from markings sub-hook)
    setDynamic: markingsHook.setDynamic,
    removeDynamic: markingsHook.removeDynamic,
    setWedge: markingsHook.setWedge,
    removeWedge: markingsHook.removeWedge,
    setDynamicText: markingsHook.setDynamicText,
    removeDynamicText: markingsHook.removeDynamicText,
    setArticulation: markingsHook.setArticulation,
    removeArticulation: markingsHook.removeArticulation,
    setExpression: markingsHook.setExpression,
    removeExpression: markingsHook.removeExpression,

    // Slur Mode (from markings sub-hook)
    slurMode: markingsHook.slurMode,
    toggleSlurMode: markingsHook.toggleSlurMode,
    startSlur: markingsHook.startSlur,
    extendSlurLeft: markingsHook.extendSlurLeft,
    extendSlurRight: markingsHook.extendSlurRight,
    endSlurMode: markingsHook.endSlurMode,
    activeSlurStartId: markingsHook.activeSlurStartId,
    activeSlurEndId: markingsHook.activeSlurEndId,
    removeSlur: markingsHook.removeSlur,
    flipSlur: markingsHook.flipSlur,

    // Expression Mode (from markings sub-hook)
    expressionMode: markingsHook.expressionMode,
    toggleExpressionMode: markingsHook.toggleExpressionMode,

    // Dynamics Mode (from markings sub-hook)
    dynamicsMode: markingsHook.dynamicsMode,
    toggleDynamicsMode: markingsHook.toggleDynamicsMode,

    // Wedge Mode (from markings sub-hook)
    wedgeMode: markingsHook.wedgeMode,
    toggleWedgeMode: markingsHook.toggleWedgeMode,
    startCrescendo: markingsHook.startCrescendo,
    startDiminuendo: markingsHook.startDiminuendo,
    extendWedge: markingsHook.extendWedge,
    endWedgeMode: markingsHook.endWedgeMode,
    activeWedgeType: markingsHook.activeWedgeType,
    activeWedgeStartId: markingsHook.activeWedgeStartId,
    removeWedgeMarking: markingsHook.removeWedgeMarking,

    // Chord Mode (from chords sub-hook)
    chordMode: chordsHook.chordMode,
    toggleChordMode: chordsHook.toggleChordMode,
    chordCursor: chordsHook.chordCursor,
    currentChordSymbol: chordsHook.currentChordSymbol,
    setChordAtCursor: chordsHook.setChordAtCursor,
    removeChordAtCursor: chordsHook.removeChordAtCursor,
    moveChordCursorNext: chordsHook.moveChordCursorNext,
    moveChordCursorPrev: chordsHook.moveChordCursorPrev,
    canChordCursorGoPrev: chordsHook.canChordCursorGoPrev,
    canChordCursorGoNext: chordsHook.canChordCursorGoNext,
    chordSubdivision: chordsHook.chordSubdivision,
    cycleChordSubdivision: chordsHook.cycleChordSubdivision,
    showChordSymbols: chordsHook.showChordSymbols,
    toggleChordSymbolVisibility: chordsHook.toggleChordSymbolVisibility,
    activeProgression: chordsHook.activeProgression,
    addChordProgression: chordsHook.addChordProgression,
    selectProgression: chordsHook.selectProgression,
    createProgression: chordsHook.createProgression,
    duplicateProgression: chordsHook.duplicateProgression,
    renameProgression: chordsHook.renameProgression,
    deleteProgression: chordsHook.deleteProgression,
    setActiveProgressionChords: chordsHook.setActiveProgressionChords,
    clearActiveProgressionChords: chordsHook.clearActiveProgressionChords,
    setProgressionSystemDefined: chordsHook.setProgressionSystemDefined,
    chordProgressions: state.score.chordProgressions,

    // Rhythm Change Confirmation
    pendingRhythmChange: notesHook.pendingRhythmChange,
    confirmRhythmChange: notesHook.confirmRhythmChange,
    cancelRhythmChange: notesHook.cancelRhythmChange,
  };
}
