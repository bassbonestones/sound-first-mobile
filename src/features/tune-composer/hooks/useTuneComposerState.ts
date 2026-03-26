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
  Lyric,
  MeasureValidation,
  Note,
  PitchName,
  TimeSignature,
  TuneComposerScore,
  TuneComposerState,
  WedgeMark,
  ChordProgression,
  ChordSymbol,
} from "../types";
import {
  createInitialState,
  createMeasure,
  createNote,
  createRest,
  DEFAULT_OCTAVE_MIDI,
  DURATION,
  STAFF_CENTER_MIDI,
  getBeatsPerMeasure,
  getBeatUnitCount,
  getMeasureDuration,
  getNoteDuration,
  validateMeasure,
  wouldOverflow,
  replaceNoteAtIndex,
  generateRestsForDurationAtPosition,
  getBeatPositionAt,
  getPitchedNotes,
  findChordAtPosition,
  createChordSymbol,
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
  createAddMeasureAction,
  createDeleteMeasureAction,
  createSetLyricAction,
  createRemoveLyricAction,
  createSetDynamicAction,
  createRemoveDynamicAction,
  createSetArticulationAction,
  createRemoveArticulationAction,
  createSetExpressionAction,
  createRemoveExpressionAction,
} from "../types/actionTypes";

// Re-use composer utils
import {
  findNotePosition,
  getNoteAtCursor,
  getLastPitchedNoteBefore,
  moveCursorLeft,
  moveCursorRight,
  moveCursorToEnd,
  moveCursorToStart,
} from "../../composer/utils/cursorUtils";
import {
  getAccidentalForMidi,
  getNearestMidiForPitch,
  getNextDiatonicPitch,
  getPreviousDiatonicPitch,
  isValidMidi,
  shiftOctave,
  transposeNoteByFunction,
  noteToMidi,
  midiToNoteName,
  midiToOctave,
} from "../../composer/utils/pitchUtils";
import {
  useTuneComposerUndo,
  reverseAction,
  reapplyAction,
} from "./useTuneComposerUndo";

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

  const [pendingRhythmChange, setPendingRhythmChange] =
    useState<PendingRhythmChange | null>(null);

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
      (m) => validateMeasure(m, score.timeSignature).isComplete,
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
  // Helper: Check if Measure has Chords or Lyrics
  // ==========================================================================

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

  /**
   * Clear chords and lyrics for a specific measure.
   */
  const clearMeasureChordsAndLyrics = useCallback(
    (measureIndex: number) => {
      updateScore((score) => {
        // Find the active progression ID
        const activeProgId = score.displaySettings?.activeProgressionId;
        const defaultProg = score.chordProgressions.find((p) => p.isDefault);
        const targetProgId = activeProgId || defaultProg?.id;

        // Clear lyrics from notes in this measure
        const newMeasures = score.measures.map((m, i) => {
          if (i !== measureIndex) return m;
          return {
            ...m,
            notes: m.notes.map((n) => ({ ...n, lyric: undefined })),
          };
        });

        // Clear chords for this measure from active progression
        const newProgressions = score.chordProgressions.map((prog) => {
          if (prog.id !== targetProgId) return prog;
          return {
            ...prog,
            chords: prog.chords.filter((c) => c.measureIndex !== measureIndex),
          };
        });

        return {
          ...score,
          measures: newMeasures,
          chordProgressions: newProgressions,
        };
      });
    },
    [updateScore],
  );

  // ==========================================================================
  // Rhythm Change Confirmation
  // ==========================================================================

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
            chords: prog.chords.filter((c) => c.measureIndex !== measureIndex),
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

    // For other changes, use refs after clearing
    // Clear chords and lyrics first
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
          chords: prog.chords.filter((c) => c.measureIndex !== measureIndex),
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
  }, [pendingRhythmChange, state.selectedNoteId, state.score, undoManager]);

  // Refs for insert/delete functions so confirmRhythmChange can call latest versions
  const insertNoteRef =
    useRef<(pitchName: PitchName, skipConfirmation?: boolean) => boolean>();
  const insertRestRef = useRef<(skipConfirmation?: boolean) => boolean>();
  const deleteNoteRef = useRef<(skipConfirmation?: boolean) => boolean>();
  const changeDurationRef =
    useRef<(duration: DurationValue, skipConfirmation?: boolean) => void>();

  const cancelRhythmChange = useCallback(() => {
    setPendingRhythmChange(null);
  }, []);

  // ==========================================================================
  // Note Operations (simplified from composer - key operations included)
  // ==========================================================================

  /**
   * Insert a note at the current cursor position.
   * @param pitchName The pitch name to insert
   * @param skipConfirmation If true, skip the chord/lyrics confirmation check (used after user confirms)
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
          // Set pending change for user confirmation
          setPendingRhythmChange({
            measureIndex: currentCursor.measureIndex,
            hasChords,
            hasLyrics,
            changeType: { kind: "insertNote", pitchName },
          });
          return false; // Change not executed yet
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

      // For simplicity, skip triplet handling in initial version
      // Full triplet support can be added later

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
      undoManager,
      getMeasureChordsAndLyrics,
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
          // Set pending change for user confirmation
          setPendingRhythmChange({
            measureIndex: currentCursor.measureIndex,
            hasChords,
            hasLyrics,
            changeType: { kind: "insertRest" },
          });
          return false; // Change not executed yet
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
      undoManager,
      getMeasureChordsAndLyrics,
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
          // Set pending change for user confirmation
          setPendingRhythmChange({
            measureIndex: currentPosition.measureIndex,
            hasChords,
            hasLyrics,
            changeType: { kind: "deleteNote" },
          });
          return false; // Change not executed yet
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
      undoManager,
      getMeasureChordsAndLyrics,
    ],
  );

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

  // ==========================================================================
  // Duration
  // ==========================================================================

  const setDuration = useCallback((duration: DurationValue) => {
    setState((prev) => ({ ...prev, selectedDuration: duration }));
  }, []);

  const toggleDottedMode = useCallback(() => {
    setState((prev) => ({ ...prev, dottedMode: !prev.dottedMode }));
  }, []);

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
          // Set pending change for user confirmation
          setPendingRhythmChange({
            measureIndex: position.measureIndex,
            hasChords,
            hasLyrics,
            changeType: { kind: "changeDuration", duration },
          });
          return; // Change not executed yet
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

  // Update refs for rhythm change confirmation to use latest function versions
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
  // LYRICS MODE
  // ==========================================================================

  const toggleLyricsMode = useCallback(() => {
    setState((prev) => {
      const newLyricsMode = !prev.lyricsMode;
      if (newLyricsMode) {
        // Entering lyrics mode - set cursor to first pitched note
        const pitchedNotes = getPitchedNotes(prev.score);
        return {
          ...prev,
          lyricsMode: true,
          lyricsCursor: pitchedNotes.length > 0 ? 0 : null,
        };
      } else {
        // Exiting lyrics mode
        return {
          ...prev,
          lyricsMode: false,
          lyricsCursor: null,
        };
      }
    });
  }, []);

  const moveLyricsCursorNext = useCallback(() => {
    setState((prev) => {
      if (!prev.lyricsMode || prev.lyricsCursor === null) return prev;
      const pitchedNotes = getPitchedNotes(prev.score);
      const nextIndex = prev.lyricsCursor + 1;
      if (nextIndex >= pitchedNotes.length) return prev; // At end
      return { ...prev, lyricsCursor: nextIndex };
    });
  }, []);

  const moveLyricsCursorPrev = useCallback(() => {
    setState((prev) => {
      if (!prev.lyricsMode || prev.lyricsCursor === null) return prev;
      const prevIndex = prev.lyricsCursor - 1;
      if (prevIndex < 0) return prev; // At start
      return { ...prev, lyricsCursor: prevIndex };
    });
  }, []);

  const setLyric = useCallback(
    (text: string, syllabic?: "single" | "begin" | "middle" | "end") => {
      if (!state.lyricsMode || state.lyricsCursor === null) return;

      const pitchedNotes = getPitchedNotes(state.score);
      const noteInfo = pitchedNotes[state.lyricsCursor];
      if (!noteInfo) return;

      const position: CursorPosition = {
        measureIndex: noteInfo.measureIndex,
        noteIndex: noteInfo.noteIndex,
      };

      const note =
        state.score.measures[noteInfo.measureIndex]?.notes[noteInfo.noteIndex];
      if (!note) return;

      const newLyric: Lyric = {
        text,
        syllabic: syllabic || "single",
      };

      const action = createSetLyricAction(
        position,
        note.id,
        newLyric,
        note.lyric,
      );
      undoManager.pushAction(action);

      updateScore((score) => ({
        ...score,
        measures: score.measures.map((m, mi) =>
          mi === noteInfo.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n, ni) =>
                  ni === noteInfo.noteIndex ? { ...n, lyric: newLyric } : n,
                ),
              }
            : m,
        ),
      }));
    },
    [
      state.lyricsMode,
      state.lyricsCursor,
      state.score,
      undoManager,
      updateScore,
    ],
  );

  const removeLyric = useCallback(() => {
    if (!state.lyricsMode || state.lyricsCursor === null) return;

    const pitchedNotes = getPitchedNotes(state.score);
    const noteInfo = pitchedNotes[state.lyricsCursor];
    if (!noteInfo) return;

    const note =
      state.score.measures[noteInfo.measureIndex]?.notes[noteInfo.noteIndex];
    if (!note || !note.lyric) return;

    const position: CursorPosition = {
      measureIndex: noteInfo.measureIndex,
      noteIndex: noteInfo.noteIndex,
    };

    const action = createRemoveLyricAction(position, note.id, note.lyric);
    undoManager.pushAction(action);

    updateScore((score) => ({
      ...score,
      measures: score.measures.map((m, mi) =>
        mi === noteInfo.measureIndex
          ? {
              ...m,
              notes: m.notes.map((n, ni) =>
                ni === noteInfo.noteIndex ? { ...n, lyric: undefined } : n,
              ),
            }
          : m,
      ),
    }));
  }, [
    state.lyricsMode,
    state.lyricsCursor,
    state.score,
    undoManager,
    updateScore,
  ]);

  const extendMelisma = useCallback(() => {
    if (!state.lyricsMode || state.lyricsCursor === null) return;

    const pitchedNotes = getPitchedNotes(state.score);

    // Can't extend if we're at the last note
    if (state.lyricsCursor >= pitchedNotes.length - 1) return;

    // Find the note with the lyric that we're extending
    // This could be the current note, or a previous note if we're in a melisma
    let lyricNoteIndex = state.lyricsCursor;
    let lyricNoteInfo = pitchedNotes[lyricNoteIndex];
    let lyricNote = lyricNoteInfo
      ? state.score.measures[lyricNoteInfo.measureIndex]?.notes[
          lyricNoteInfo.noteIndex
        ]
      : null;

    // If current note doesn't have a lyric, search backwards for the note with the lyric
    while (lyricNoteIndex > 0 && (!lyricNote || !lyricNote.lyric)) {
      lyricNoteIndex--;
      lyricNoteInfo = pitchedNotes[lyricNoteIndex];
      lyricNote = lyricNoteInfo
        ? state.score.measures[lyricNoteInfo.measureIndex]?.notes[
            lyricNoteInfo.noteIndex
          ]
        : null;
    }

    // If we still don't have a lyric, can't extend
    if (!lyricNote || !lyricNote.lyric || !lyricNoteInfo) return;

    // Extend melisma by incrementing melismaLength
    const newMelismaLength = (lyricNote.lyric.melismaLength || 1) + 1;
    const newLyric: Lyric = {
      ...lyricNote.lyric,
      melismaLength: newMelismaLength,
    };

    const position: CursorPosition = {
      measureIndex: lyricNoteInfo.measureIndex,
      noteIndex: lyricNoteInfo.noteIndex,
    };

    const action = createSetLyricAction(
      position,
      lyricNote.id,
      newLyric,
      lyricNote.lyric,
    );
    undoManager.pushAction(action);

    // Move cursor to next note
    const nextIndex = state.lyricsCursor + 1;

    setState((prev) => ({
      ...prev,
      lyricsCursor: nextIndex,
      score: {
        ...prev.score,
        measures: prev.score.measures.map((m, mi) =>
          mi === lyricNoteInfo.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n, ni) =>
                  ni === lyricNoteInfo.noteIndex
                    ? { ...n, lyric: newLyric }
                    : n,
                ),
              }
            : m,
        ),
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    }));
  }, [state.lyricsMode, state.lyricsCursor, state.score, undoManager]);

  const shrinkMelisma = useCallback(() => {
    if (!state.lyricsMode || state.lyricsCursor === null) return;
    if (state.lyricsCursor === 0) return; // Can't shrink at start

    const pitchedNotes = getPitchedNotes(state.score);
    const prevNoteInfo = pitchedNotes[state.lyricsCursor - 1];
    if (!prevNoteInfo) return;

    const prevNote =
      state.score.measures[prevNoteInfo.measureIndex]?.notes[
        prevNoteInfo.noteIndex
      ];
    if (!prevNote || !prevNote.lyric) return;

    const currentMelisma = prevNote.lyric.melismaLength || 1;
    if (currentMelisma <= 1) return; // Can't shrink below 1

    const newLyric: Lyric = {
      ...prevNote.lyric,
      melismaLength: currentMelisma - 1,
    };

    const position: CursorPosition = {
      measureIndex: prevNoteInfo.measureIndex,
      noteIndex: prevNoteInfo.noteIndex,
    };

    const action = createSetLyricAction(
      position,
      prevNote.id,
      newLyric,
      prevNote.lyric,
    );
    undoManager.pushAction(action);

    // Move cursor to previous note
    const newLyricsCursor = state.lyricsCursor - 1;

    setState((prev) => ({
      ...prev,
      lyricsCursor: newLyricsCursor,
      score: {
        ...prev.score,
        measures: prev.score.measures.map((m, mi) =>
          mi === prevNoteInfo.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n, ni) =>
                  ni === prevNoteInfo.noteIndex ? { ...n, lyric: newLyric } : n,
                ),
              }
            : m,
        ),
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    }));
  }, [state.lyricsMode, state.lyricsCursor, state.score, undoManager]);

  // ==========================================================================
  // ANNOTATIONS
  // ==========================================================================

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

  const setWedge = useCallback(
    (wedge: WedgeMark) => {
      if (!state.selectedNoteId) return;

      const position = findNotePosition(state.selectedNoteId, state.score);
      if (!position) return;

      const note =
        state.score.measures[position.measureIndex]?.notes[position.noteIndex];
      if (!note) return;

      // For now, just store wedge on the note
      // Full wedge span tracking would need additional state
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

  // ==========================================================================
  // DYNAMICS MODE
  // ==========================================================================

  const toggleDynamicsMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      dynamicsMode: !prev.dynamicsMode,
    }));
  }, []);

  // ==========================================================================
  // WEDGE MODE (Crescendo/Decrescendo)
  // ==========================================================================

  const toggleWedgeMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      wedgeMode: !prev.wedgeMode,
      activeWedgeType: !prev.wedgeMode ? prev.activeWedgeType : null,
      activeWedgeStartId: !prev.wedgeMode ? prev.activeWedgeStartId : null,
    }));
  }, []);

  const startCrescendo = useCallback(() => {
    if (!state.selectedNoteId) return;

    const position = findNotePosition(state.selectedNoteId, state.score);
    if (!position) return;

    const note =
      state.score.measures[position.measureIndex]?.notes[position.noteIndex];
    if (!note) return;

    // Find pitched notes to get the next note for auto-extend
    const pitchedNotes: Array<{
      note: Note;
      measureIndex: number;
      noteIndex: number;
    }> = [];
    state.score.measures.forEach((measure, measureIndex) => {
      measure.notes.forEach((n, noteIndex) => {
        if (n.midi !== null) {
          pitchedNotes.push({ note: n, measureIndex, noteIndex });
        }
      });
    });

    const startIndex = pitchedNotes.findIndex((n) => n.note.id === note.id);
    if (startIndex < 0 || startIndex >= pitchedNotes.length - 1) return;

    const nextNote = pitchedNotes[startIndex + 1];

    // Set wedge start on this note and stop on the next note
    updateScore((score) => ({
      ...score,
      measures: score.measures.map((m, mi) => ({
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
  }, [state.selectedNoteId, state.score, updateScore]);

  const startDiminuendo = useCallback(() => {
    if (!state.selectedNoteId) return;

    const position = findNotePosition(state.selectedNoteId, state.score);
    if (!position) return;

    const note =
      state.score.measures[position.measureIndex]?.notes[position.noteIndex];
    if (!note) return;

    // Find pitched notes to get the next note for auto-extend
    const pitchedNotes: Array<{
      note: Note;
      measureIndex: number;
      noteIndex: number;
    }> = [];
    state.score.measures.forEach((measure, measureIndex) => {
      measure.notes.forEach((n, noteIndex) => {
        if (n.midi !== null) {
          pitchedNotes.push({ note: n, measureIndex, noteIndex });
        }
      });
    });

    const startIndex = pitchedNotes.findIndex((n) => n.note.id === note.id);
    if (startIndex < 0 || startIndex >= pitchedNotes.length - 1) return;

    const nextNote = pitchedNotes[startIndex + 1];

    // Set wedge start on this note and stop on the next note
    updateScore((score) => ({
      ...score,
      measures: score.measures.map((m, mi) => ({
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
  }, [state.selectedNoteId, state.score, updateScore]);

  const extendWedge = useCallback(() => {
    if (!state.activeWedgeStartId || !state.activeWedgeType) return;

    // Inline getPitchedNotesWithPositions to avoid TDZ
    const pitchedNotes: Array<{
      note: Note;
      measureIndex: number;
      noteIndex: number;
    }> = [];
    state.score.measures.forEach((measure, measureIndex) => {
      measure.notes.forEach((note, noteIndex) => {
        if (note.midi !== null) {
          pitchedNotes.push({ note, measureIndex, noteIndex });
        }
      });
    });

    const startIndex = pitchedNotes.findIndex(
      (n) => n.note.id === state.activeWedgeStartId,
    );
    if (startIndex < 0 || startIndex >= pitchedNotes.length - 1) return;

    // Find the current end of the wedge (last note with wedge stop, or just after start)
    let currentEndIndex = startIndex;
    for (let i = startIndex + 1; i < pitchedNotes.length; i++) {
      if (pitchedNotes[i].note.wedge?.position === "stop") {
        currentEndIndex = i;
        break;
      }
    }

    // Move end to next note
    const newEndIndex = Math.min(currentEndIndex + 1, pitchedNotes.length - 1);
    if (newEndIndex === currentEndIndex) return;

    const oldEndNote = pitchedNotes[currentEndIndex];
    const newEndNote = pitchedNotes[newEndIndex];

    updateScore((score) => ({
      ...score,
      measures: score.measures.map((m, mi) => ({
        ...m,
        notes: m.notes.map((n) => {
          // Remove stop from old end (if it had one)
          if (n.id === oldEndNote.note.id && n.wedge?.position === "stop") {
            return { ...n, wedge: undefined };
          }
          // Add stop to new end
          if (n.id === newEndNote.note.id) {
            return {
              ...n,
              wedge: { type: state.activeWedgeType!, position: "stop" },
            };
          }
          return n;
        }),
      })),
    }));

    // Move cursor to the new end note
    setState((prev) => ({
      ...prev,
      selectedNoteId: newEndNote.note.id,
    }));
  }, [
    state.activeWedgeStartId,
    state.activeWedgeType,
    state.score,
    updateScore,
  ]);

  const endWedgeMode = useCallback(() => {
    // If there's an active wedge without a stop, add stop at current note
    if (
      state.activeWedgeStartId &&
      state.selectedNoteId &&
      state.activeWedgeType
    ) {
      const position = findNotePosition(state.selectedNoteId, state.score);
      if (position) {
        const note =
          state.score.measures[position.measureIndex]?.notes[
            position.noteIndex
          ];
        // Only set stop if it's not the start note
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
                              type: state.activeWedgeType!,
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
  ]);

  const removeWedgeMarking = useCallback(() => {
    if (!state.selectedNoteId) return;

    const position = findNotePosition(state.selectedNoteId, state.score);
    if (!position) return;

    const note =
      state.score.measures[position.measureIndex]?.notes[position.noteIndex];
    if (!note || !note.wedge) return;

    // Inline getPitchedNotesWithPositions to avoid TDZ
    const pitchedNotes: Array<{
      note: Note;
      measureIndex: number;
      noteIndex: number;
    }> = [];
    state.score.measures.forEach((measure, measureIndex) => {
      measure.notes.forEach((n, noteIndex) => {
        if (n.midi !== null) {
          pitchedNotes.push({ note: n, measureIndex, noteIndex });
        }
      });
    });

    const selectedIndex = pitchedNotes.findIndex((n) => n.note.id === note.id);

    // Find the other end of the wedge
    let otherEndId: string | null = null;

    if (note.wedge.position === "start") {
      // Find the stop
      for (let i = selectedIndex + 1; i < pitchedNotes.length; i++) {
        if (pitchedNotes[i].note.wedge?.position === "stop") {
          otherEndId = pitchedNotes[i].note.id;
          break;
        }
      }
    } else {
      // Find the start
      for (let i = selectedIndex - 1; i >= 0; i--) {
        if (pitchedNotes[i].note.wedge?.position === "start") {
          otherEndId = pitchedNotes[i].note.id;
          break;
        }
      }
    }

    // Remove wedge from both notes
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
  }, [state.selectedNoteId, state.score, updateScore]);

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

  // ==========================================================================
  // Slur Mode
  // ==========================================================================

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

  /** Toggle slur mode on/off */
  const toggleSlurMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      slurMode: !prev.slurMode,
      // Clear active slur when exiting mode
      activeSlurStartId: !prev.slurMode ? prev.activeSlurStartId : null,
      activeSlurEndId: !prev.slurMode ? prev.activeSlurEndId : null,
    }));
  }, []);

  /** Exit slur mode */
  const endSlurMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      slurMode: false,
      activeSlurStartId: null,
      activeSlurEndId: null,
    }));
  }, []);

  /** Start a new slur from the selected note to the next pitched note */
  const startSlur = useCallback(() => {
    if (!state.selectedNoteId) return;

    const pitchedNotes = getPitchedNotesWithPositions();
    const currentIndex = pitchedNotes.findIndex(
      (n) => n.note.id === state.selectedNoteId,
    );
    if (currentIndex === -1 || currentIndex >= pitchedNotes.length - 1) return;

    const startNote = pitchedNotes[currentIndex];
    const endNote = pitchedNotes[currentIndex + 1];

    // Update score with slurStart on start note and slurEnd on end note
    updateScore((score) => ({
      ...score,
      measures: score.measures.map((m, mi) => ({
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

    // Track active slur
    setState((prev) => ({
      ...prev,
      activeSlurStartId: startNote.note.id,
      activeSlurEndId: endNote.note.id,
      isDirty: true,
    }));
  }, [state.selectedNoteId, getPitchedNotesWithPositions, updateScore]);

  /** Extend slur start to previous note */
  const extendSlurLeft = useCallback(() => {
    if (!state.activeSlurStartId) return;

    const pitchedNotes = getPitchedNotesWithPositions();
    const startIndex = pitchedNotes.findIndex(
      (n) => n.note.id === state.activeSlurStartId,
    );
    if (startIndex <= 0) return; // Can't extend left past first note

    const oldStartNote = pitchedNotes[startIndex];
    const newStartNote = pitchedNotes[startIndex - 1];

    // Move slurStart from old note to new note
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
  }, [state.activeSlurStartId, getPitchedNotesWithPositions, updateScore]);

  /** Extend slur end to next note */
  const extendSlurRight = useCallback(() => {
    if (!state.activeSlurEndId) return;

    const pitchedNotes = getPitchedNotesWithPositions();
    const endIndex = pitchedNotes.findIndex(
      (n) => n.note.id === state.activeSlurEndId,
    );
    if (endIndex === -1 || endIndex >= pitchedNotes.length - 1) return;

    const oldEndNote = pitchedNotes[endIndex];
    const newEndNote = pitchedNotes[endIndex + 1];

    // Move slurEnd from old note to new note
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
  }, [state.activeSlurEndId, getPitchedNotesWithPositions, updateScore]);

  /** Remove slur involving the selected note (removes both start and end of the slur) */
  const removeSlur = useCallback(() => {
    if (!state.selectedNoteId) return;

    const position = findNotePosition(state.selectedNoteId, state.score);
    if (!position) return;

    const note =
      state.score.measures[position.measureIndex]?.notes[position.noteIndex];
    if (!note || (!note.slurStart && !note.slurEnd)) return;

    const pitchedNotes = getPitchedNotesWithPositions();
    const selectedIndex = pitchedNotes.findIndex((n) => n.note.id === note.id);

    // Find the corresponding slur start/end note
    let slurStartNoteId: string | null = null;
    let slurEndNoteId: string | null = null;

    if (note.slurStart) {
      // Selected note starts a slur - find the end
      slurStartNoteId = note.id;
      // Search forward for slurEnd
      for (let i = selectedIndex + 1; i < pitchedNotes.length; i++) {
        if (pitchedNotes[i].note.slurEnd) {
          slurEndNoteId = pitchedNotes[i].note.id;
          break;
        }
      }
    }

    if (note.slurEnd) {
      // Selected note ends a slur - find the start
      slurEndNoteId = note.id;
      // Search backward for slurStart
      for (let i = selectedIndex - 1; i >= 0; i--) {
        if (pitchedNotes[i].note.slurStart) {
          slurStartNoteId = pitchedNotes[i].note.id;
          break;
        }
      }
    }

    // Remove slur from both notes
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

    // Clear active slur if it was the one we removed
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
  ]);

  /** Flip slur placement (above/below) for the slur involving the selected note */
  const flipSlur = useCallback(() => {
    if (!state.selectedNoteId) return;

    const position = findNotePosition(state.selectedNoteId, state.score);
    if (!position) return;

    const note =
      state.score.measures[position.measureIndex]?.notes[position.noteIndex];
    if (!note || (!note.slurStart && !note.slurEnd)) return;

    const pitchedNotes = getPitchedNotesWithPositions();
    const selectedIndex = pitchedNotes.findIndex((n) => n.note.id === note.id);

    // Find the slur start note
    let slurStartNoteId: string | null = null;
    let currentPlacement: "above" | "below" | undefined;

    if (note.slurStart) {
      slurStartNoteId = note.id;
      currentPlacement = note.slurPlacement;
    } else if (note.slurEnd) {
      // Search backward for slurStart
      for (let i = selectedIndex - 1; i >= 0; i--) {
        if (pitchedNotes[i].note.slurStart) {
          slurStartNoteId = pitchedNotes[i].note.id;
          currentPlacement = pitchedNotes[i].note.slurPlacement;
          break;
        }
      }
    }

    if (!slurStartNoteId) return;

    // Toggle placement: undefined -> below, below -> above, above -> below
    const newPlacement: "above" | "below" =
      currentPlacement === "above" ? "below" : "above";

    // Update the slur start note with new placement
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

  // ==========================================================================
  // EXPRESSION MODE
  // ==========================================================================

  const toggleExpressionMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      expressionMode: !prev.expressionMode,
    }));
  }, []);

  // ==========================================================================
  // CHORD MODE
  // ==========================================================================

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
  }, []);

  /**
   * Get the active (default) chord progression.
   */
  const activeProgression = useMemo((): ChordProgression | null => {
    const progressions = state.score.chordProgressions ?? [];
    const defaultProg = progressions.find((p) => p.isDefault);
    return defaultProg ?? progressions[0] ?? null;
  }, [state.score.chordProgressions]);

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
   * Move chord cursor to the next beat position.
   * Advances by 1 beat unit (e.g., eighth note in 6/8), moving to the next measure if needed.
   */
  const moveChordCursorNext = useCallback(() => {
    setState((prev) => {
      if (!prev.chordMode || !prev.chordCursor) return prev;
      const { measureIndex, beatPosition } = prev.chordCursor;
      const beatUnitCount = getBeatUnitCount(prev.score.timeSignature);
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
  }, []);

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
        const beatUnitCount = getBeatUnitCount(prev.score.timeSignature);
        return {
          ...prev,
          chordCursor: {
            measureIndex: measureIndex - 1,
            beatPosition: beatUnitCount - 1,
          },
        };
      }
      // At beginning
      return prev;
    });
  }, []);

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
    const beatUnitCount = getBeatUnitCount(state.score.timeSignature);
    const totalMeasures = state.score.measures.length;

    // Can go next if not at last beat of last measure
    return measureIndex < totalMeasures - 1 || beatPosition < beatUnitCount - 1;
  }, [
    state.chordCursor,
    state.score.timeSignature,
    state.score.measures.length,
  ]);

  /**
   * Whether chord symbols are visible in score display.
   */
  const showChordSymbols = useMemo(
    (): boolean => state.score.displaySettings.showChordSymbols ?? true,
    [state.score.displaySettings.showChordSymbols],
  );

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

    // Lyrics Mode
    lyricsMode: state.lyricsMode,
    toggleLyricsMode,
    lyricsCursor: state.lyricsCursor,
    moveLyricsCursorNext,
    moveLyricsCursorPrev,
    setLyric,
    removeLyric,
    extendMelisma,
    shrinkMelisma,

    // Annotations
    setDynamic,
    removeDynamic,
    setWedge,
    removeWedge,
    setDynamicText,
    removeDynamicText,
    setArticulation,
    removeArticulation,
    setExpression,
    removeExpression,

    // Slur Mode
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

    // Expression Mode
    expressionMode: state.expressionMode,
    toggleExpressionMode,

    // Dynamics Mode
    dynamicsMode: state.dynamicsMode,
    toggleDynamicsMode,

    // Wedge Mode (Crescendo/Decrescendo)
    wedgeMode: state.wedgeMode,
    toggleWedgeMode,
    startCrescendo,
    startDiminuendo,
    extendWedge,
    endWedgeMode,
    activeWedgeType: state.activeWedgeType,
    activeWedgeStartId: state.activeWedgeStartId,
    removeWedgeMarking,

    // Chord Mode
    chordMode: state.chordMode,
    toggleChordMode,
    chordCursor: state.chordCursor,
    currentChordSymbol,
    setChordAtCursor,
    removeChordAtCursor,
    moveChordCursorNext,
    moveChordCursorPrev,
    canChordCursorGoPrev,
    canChordCursorGoNext,
    showChordSymbols,
    toggleChordSymbolVisibility,
    activeProgression,
    addChordProgression,

    // Rhythm Change Confirmation
    pendingRhythmChange,
    confirmRhythmChange,
    cancelRhythmChange,
  };
}
