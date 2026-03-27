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
  createTripletNote,
  createTripletRest,
  DEFAULT_OCTAVE_MIDI,
  DURATION,
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
  getHalfMeasureBoundary,
  generateId,
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
  getTripletGroupInfo,
  canStartTripletAtPosition,
  insertTripletGroup,
} from "../utils/tripletUtils";
import {
  useComposerUndo,
  reverseAction,
  reapplyAction,
} from "./useComposerUndo";
import { useScoreSettings } from "./useScoreSettings";
import { useMeasureOperations } from "./useMeasureOperations";

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
  /** Current triplet position (1, 2, or 3) if on a triplet note, undefined otherwise */
  tripletPosition: 1 | 2 | 3 | undefined;
  /** Current triplet group type: 'eighth' (only eighths), 'quarter' (only quarters), 'mixed' (both allowed) */
  tripletGroupType: "eighth" | "quarter" | "mixed" | undefined;
  /** Whether triplets can be started at the current cursor position (beat position divisible by 1/3) */
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
  clearScore: () => void;
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
  // Extracted Hooks
  // ==========================================================================

  const scoreSettings = useScoreSettings({
    state,
    setState,
    undoManager,
  });

  const measureOperations = useMeasureOperations({
    state,
    setState,
    undoManager,
    cursorRef,
    suppressAddMeasurePromptRef,
    updateScore,
  });

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

  // Note at the current cursor position (for triplet detection)
  const noteAtCursor = useMemo((): Note | null => {
    const measure = score.measures[cursor.measureIndex];
    if (!measure) return null;
    return measure.notes[cursor.noteIndex] ?? null;
  }, [score.measures, cursor.measureIndex, cursor.noteIndex]);

  // Calculate triplet group info based on group structure (using utility)
  const tripletGroupInfo = useMemo(() => {
    if (!noteAtCursor?.tripletGroupId) return null;
    const measure = score.measures[cursor.measureIndex];
    if (!measure) return null;
    return getTripletGroupInfo(measure.notes, noteAtCursor.tripletGroupId);
  }, [score.measures, cursor.measureIndex, noteAtCursor]);

  // Check if triplets can be started at the current cursor position (using utility)
  const canStartTriplet = useMemo((): boolean => {
    const measure = score.measures[cursor.measureIndex];
    return canStartTripletAtPosition(measure, cursor.noteIndex, noteAtCursor);
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

      // Check if we're inserting a triplet duration
      const isTripletEighth =
        state.selectedDuration === DURATION.TRIPLET_EIGHTH;
      const isTripletQuarter =
        state.selectedDuration === DURATION.TRIPLET_QUARTER;
      const isTripletDuration = isTripletEighth || isTripletQuarter;
      const currentNote = measure.notes[currentCursor.noteIndex];
      const isCurrentNoteTriplet = currentNote?.tripletPosition !== undefined;

      // Handle triplet insertion
      if (isTripletDuration) {
        if (isCurrentNoteTriplet) {
          // Replacing within an existing triplet group
          const currentPosition = currentNote.tripletPosition!;
          const tripletGroupId = currentNote.tripletGroupId!;

          // Determine group type based on actual notes (not rests)
          // Only lock group type when filled with actual notes - rests can be replaced
          const groupNotes = measure.notes.filter(
            (n) => n.tripletGroupId === tripletGroupId,
          );
          const actualNotes = groupNotes.filter((n) => n.midi !== null);
          const tolerance = 0.001;

          // Check if all actual notes are the same type
          const allActualAreEighths = actualNotes.every(
            (n) =>
              Math.abs(getNoteDuration(n) - DURATION.TRIPLET_EIGHTH) <
              tolerance,
          );
          const allActualAreQuarters = actualNotes.every(
            (n) =>
              Math.abs(getNoteDuration(n) - DURATION.TRIPLET_QUARTER) <
              tolerance,
          );

          // Only restrict if we're replacing an actual note (not a rest)
          // and the group is "locked" with 3 actual notes of the same type
          const isGroupLocked = actualNotes.length === 3;
          const isLockedEighthGroup = isGroupLocked && allActualAreEighths;
          const isLockedQuarterGroup = isGroupLocked && allActualAreQuarters;

          // In locked quarter groups, only quarter triplets allowed
          if (isLockedQuarterGroup && isTripletEighth) {
            return false;
          }
          // In locked eighth groups, only eighth triplets allowed
          if (isLockedEighthGroup && isTripletQuarter) {
            return false;
          }

          // Calculate current group structure
          const totalGroupDuration = groupNotes.reduce(
            (sum, n) => sum + getNoteDuration(n),
            0,
          );
          const is1BeatGroup = Math.abs(totalGroupDuration - 1) < tolerance;
          const is2BeatGroup = Math.abs(totalGroupDuration - 2) < tolerance;

          // Check if we're changing duration type within a 1-beat group (3 eighths → mixed)
          const isChangingToQuarterIn1BeatGroup =
            is1BeatGroup && groupNotes.length === 3 && isTripletQuarter;

          // Check if position 2 has an actual note (not a rest)
          const positionTwoNote = groupNotes.find(
            (n) => n.tripletPosition === 2,
          );
          const positionTwoHasNote =
            positionTwoNote && positionTwoNote.midi !== null;

          // If at position 3 and position 2 has actual note, EXPAND to 2-beat group
          // 8th(1/3) + 8th(1/3) + quarter(2/3) + quarter rest(2/3) = 2 beats
          if (
            isChangingToQuarterIn1BeatGroup &&
            currentPosition === 3 &&
            positionTwoHasNote
          ) {
            // Find where this triplet group is in the measure
            const firstGroupNoteIdx = measure.notes.findIndex(
              (n) => n.tripletGroupId === tripletGroupId,
            );
            const lastGroupNoteIdx = measure.notes.findIndex(
              (n) =>
                n.tripletGroupId === tripletGroupId && n.tripletPosition === 3,
            );

            // Check if there's space for an additional 1 beat after this group
            let durationAvailable = 0;
            let endIdx = lastGroupNoteIdx + 1;
            while (
              endIdx < measure.notes.length &&
              durationAvailable < 1 - 0.001
            ) {
              durationAvailable += getNoteDuration(measure.notes[endIdx]);
              endIdx++;
            }

            if (durationAvailable < 1 - 0.001) {
              // Not enough space to expand to 2-beat group
              return false;
            }

            // Build the expanded 2-beat group:
            // Keep eighth at pos 1, eighth at pos 2, add quarter at pos 3, add quarter rest at pos 4
            const pos1Note = groupNotes.find((n) => n.tripletPosition === 1)!;
            const pos2Note = groupNotes.find((n) => n.tripletPosition === 2)!;

            const newQuarter = createTripletNote(
              midi,
              DURATION.TRIPLET_QUARTER,
              3,
              tripletGroupId,
              { accidental },
            );
            const quarterRest = createTripletRest(
              4,
              tripletGroupId,
              DURATION.TRIPLET_QUARTER,
            );

            // Build new notes array
            const newNotes: Note[] = [
              ...measure.notes.slice(0, firstGroupNoteIdx),
              pos1Note, // Keep position 1 eighth
              pos2Note, // Keep position 2 eighth
              newQuarter, // New quarter at position 3
              quarterRest, // Quarter rest at position 4
            ];

            // Handle remainder if we consumed more than 1 additional beat
            const consumed = measure.notes
              .slice(lastGroupNoteIdx + 1, endIdx)
              .reduce((sum, n) => sum + getNoteDuration(n), 0);
            const remainder = consumed - 1;
            if (remainder > 0.001) {
              const remainderRests = generateRestsForDuration(remainder);
              newNotes.push(...remainderRests);
            }

            // Add remaining notes after the consumed portion
            newNotes.push(...measure.notes.slice(endIdx));

            const action = createInsertNoteAction(targetCursor, newQuarter);
            undoManager.pushAction(action);

            const newCursor: CursorPosition = {
              measureIndex: currentCursor.measureIndex,
              noteIndex: firstGroupNoteIdx + 3, // Move to the quarter rest at position 4
            };
            cursorRef.current = newCursor;

            setState((prev) => ({
              ...prev,
              score: {
                ...prev.score,
                measures: prev.score.measures.map((m, i) =>
                  i === currentCursor.measureIndex
                    ? { ...m, notes: newNotes }
                    : m,
                ),
                updatedAt: new Date().toISOString(),
              },
              cursor: newCursor,
              selectedNoteId: newQuarter.id,
              isDirty: true,
            }));

            return true;
          }

          if (isChangingToQuarterIn1BeatGroup) {
            // Converting 3-eighth group to mixed group (eighth + quarter = 1 beat)
            // Quarter triplet (2/3) consumes positions 2 and 3
            // Keep position 1 as is, replace 2-3 with single quarter at position 3
            const firstGroupNoteIdx = measure.notes.findIndex(
              (n) => n.tripletGroupId === tripletGroupId,
            );
            const positionOneNote = groupNotes.find(
              (n) => n.tripletPosition === 1,
            )!;

            // If we're at position 1, quarter goes here and we remove positions 2-3
            // Otherwise (position 2 or 3), keep position 1 and quarter takes the rest
            let newNotes: Note[];
            let newCursorIndex: number;

            if (currentPosition === 1) {
              // Quarter at position 1 (spans 1-2), keep position 3 as eighth rest
              const quarterNote = createTripletNote(
                midi,
                DURATION.TRIPLET_QUARTER,
                1,
                tripletGroupId,
                { accidental },
              );
              const eighthRest = createTripletRest(
                3,
                tripletGroupId,
                DURATION.TRIPLET_EIGHTH,
              );
              newNotes = [
                ...measure.notes.slice(0, firstGroupNoteIdx),
                quarterNote,
                eighthRest,
                ...measure.notes.slice(firstGroupNoteIdx + 3),
              ];
              newCursorIndex = firstGroupNoteIdx + 1; // Move to the eighth rest
            } else {
              // Keep position 1, quarter at position 3 (spans 2-3)
              const keepNote =
                positionOneNote.midi !== null
                  ? positionOneNote
                  : createTripletNote(
                      positionOneNote.midi,
                      DURATION.TRIPLET_EIGHTH,
                      1,
                      tripletGroupId,
                    );
              const quarterNote = createTripletNote(
                midi,
                DURATION.TRIPLET_QUARTER,
                3,
                tripletGroupId,
                { accidental },
              );
              newNotes = [
                ...measure.notes.slice(0, firstGroupNoteIdx),
                keepNote,
                quarterNote,
                ...measure.notes.slice(firstGroupNoteIdx + 3),
              ];
              newCursorIndex = firstGroupNoteIdx + 2; // Move past the new quarter
            }

            const action = createInsertNoteAction(
              targetCursor,
              newNotes[firstGroupNoteIdx],
            );
            undoManager.pushAction(action);

            const newCursor: CursorPosition = {
              measureIndex: currentCursor.measureIndex,
              noteIndex: Math.min(newCursorIndex, newNotes.length - 1),
            };
            cursorRef.current = newCursor;

            setState((prev) => ({
              ...prev,
              score: {
                ...prev.score,
                measures: prev.score.measures.map((m, i) =>
                  i === currentCursor.measureIndex
                    ? { ...m, notes: newNotes }
                    : m,
                ),
                updatedAt: new Date().toISOString(),
              },
              cursor: newCursor,
              selectedNoteId:
                newNotes[firstGroupNoteIdx + (currentPosition === 1 ? 0 : 1)]
                  .id,
              isDirty: true,
            }));

            return true;
          }

          // Check if we're trying to add a quarter to a mixed group (which would expand to 2 beats)
          // Mixed group: 2 notes, 1 beat total (quarter 2/3 + eighth 1/3)
          const isMixedGroup =
            groupNotes.length === 2 &&
            Math.abs(totalGroupDuration - 1) < tolerance;
          const isAddingQuarterToMixedGroup =
            isMixedGroup && isTripletQuarter && currentNote.midi === null;

          if (isAddingQuarterToMixedGroup) {
            // Adding a quarter to the eighth rest slot of a mixed group
            // This would create 2 quarters (4/3 beats) - need room to expand to proper 2-beat group
            const firstGroupNoteIdx = measure.notes.findIndex(
              (n) => n.tripletGroupId === tripletGroupId,
            );
            const lastGroupNoteIdx = measure.notes.findIndex(
              (n) =>
                n.tripletGroupId === tripletGroupId &&
                n === groupNotes[groupNotes.length - 1],
            );

            // Check if there's space for an additional 1 beat after this group (need 2 beats total)
            let durationAvailable = 0;
            let endIdx = lastGroupNoteIdx + 1;
            while (
              endIdx < measure.notes.length &&
              durationAvailable < 1 - 0.001
            ) {
              durationAvailable += getNoteDuration(measure.notes[endIdx]);
              endIdx++;
            }

            if (durationAvailable < 1 - 0.001) {
              // Not enough space to expand to 2-beat group - block this action
              return false;
            }

            // Expand to proper 2-beat group: quarter(2/3) + quarter(2/3) + quarter rest(2/3) = 2 beats
            const pos1Note = groupNotes.find((n) => n.tripletPosition === 1)!;

            const newQuarter = createTripletNote(
              midi,
              DURATION.TRIPLET_QUARTER,
              2,
              tripletGroupId,
              { accidental },
            );
            const quarterRest = createTripletRest(
              3,
              tripletGroupId,
              DURATION.TRIPLET_QUARTER,
            );

            // Build new notes array
            const newNotes: Note[] = [
              ...measure.notes.slice(0, firstGroupNoteIdx),
              pos1Note, // Keep position 1 quarter
              newQuarter, // New quarter at position 2
              quarterRest, // Quarter rest at position 3
            ];

            // Handle remainder if we consumed more than 1 additional beat
            const consumed = measure.notes
              .slice(lastGroupNoteIdx + 1, endIdx)
              .reduce((sum, n) => sum + getNoteDuration(n), 0);
            const remainder = consumed - 1;
            if (remainder > 0.001) {
              const remainderRests = generateRestsForDuration(remainder);
              newNotes.push(...remainderRests);
            }

            // Add remaining notes after the consumed portion
            newNotes.push(...measure.notes.slice(endIdx));

            const action = createInsertNoteAction(targetCursor, newQuarter);
            undoManager.pushAction(action);

            const newCursor: CursorPosition = {
              measureIndex: currentCursor.measureIndex,
              noteIndex: firstGroupNoteIdx + 2, // Move to the quarter rest at position 3
            };
            cursorRef.current = newCursor;

            setState((prev) => ({
              ...prev,
              score: {
                ...prev.score,
                measures: prev.score.measures.map((m, i) =>
                  i === currentCursor.measureIndex
                    ? { ...m, notes: newNotes }
                    : m,
                ),
                updatedAt: new Date().toISOString(),
              },
              cursor: newCursor,
              selectedNoteId: newQuarter.id,
              isDirty: true,
            }));

            return true;
          }

          // Check if we're replacing a quarter (or quarter-rest) with an eighth
          // This needs to split the quarter slot into two eighth slots
          const isReplacingQuarterWithEighth =
            Math.abs(currentNote.duration - DURATION.TRIPLET_QUARTER) <
              tolerance && isTripletEighth;

          if (isReplacingQuarterWithEighth) {
            // Find where this note is in the measure
            const noteIdx = currentCursor.noteIndex;
            const currentPos = currentNote.tripletPosition!;

            // Create the new eighth at current position
            const newEighth = createTripletNote(
              midi,
              DURATION.TRIPLET_EIGHTH,
              currentPos,
              tripletGroupId,
              { accidental },
            );

            // Create an eighth rest at the next position
            const nextPos = (currentPos + 1) as 1 | 2 | 3 | 4 | 5 | 6;
            const eighthRest = createTripletRest(
              nextPos,
              tripletGroupId,
              DURATION.TRIPLET_EIGHTH,
            );

            // Build new notes array: replace the quarter with eighth + eighth-rest
            const newNotes = [
              ...measure.notes.slice(0, noteIdx),
              newEighth,
              eighthRest,
              ...measure.notes.slice(noteIdx + 1),
            ];

            const action = createInsertNoteAction(targetCursor, newEighth);
            undoManager.pushAction(action);

            // Move cursor to the new eighth rest
            const newCursor: CursorPosition = {
              measureIndex: currentCursor.measureIndex,
              noteIndex: noteIdx + 1,
            };
            cursorRef.current = newCursor;

            setState((prev) => ({
              ...prev,
              score: {
                ...prev.score,
                measures: prev.score.measures.map((m, i) =>
                  i === currentCursor.measureIndex
                    ? { ...m, notes: newNotes }
                    : m,
                ),
                updatedAt: new Date().toISOString(),
              },
              cursor: newCursor,
              selectedNoteId: newEighth.id,
              isDirty: true,
            }));

            return true;
          }

          // Simple replacement (same duration type)
          const newTripletNote = createTripletNote(
            midi,
            state.selectedDuration as
              | typeof DURATION.TRIPLET_EIGHTH
              | typeof DURATION.TRIPLET_QUARTER,
            currentPosition,
            tripletGroupId,
            { accidental },
          );

          const action = createInsertNoteAction(targetCursor, newTripletNote);
          undoManager.pushAction(action);

          // Move to next position
          const newNoteIndex = currentCursor.noteIndex + 1;
          let newCursor: CursorPosition;
          if (newNoteIndex >= measure.notes.length) {
            const nextMeasureIndex = currentCursor.measureIndex + 1;
            if (nextMeasureIndex < state.score.measures.length) {
              newCursor = { measureIndex: nextMeasureIndex, noteIndex: 0 };
            } else {
              newCursor = {
                measureIndex: currentCursor.measureIndex,
                noteIndex: measure.notes.length - 1,
              };
            }
          } else {
            newCursor = {
              measureIndex: currentCursor.measureIndex,
              noteIndex: newNoteIndex,
            };
          }
          cursorRef.current = newCursor;

          setState((prev) => ({
            ...prev,
            score: {
              ...prev.score,
              measures: prev.score.measures.map((m, i) =>
                i === currentCursor.measureIndex
                  ? {
                      ...m,
                      notes: m.notes.map((n, ni) =>
                        ni === currentCursor.noteIndex ? newTripletNote : n,
                      ),
                    }
                  : m,
              ),
              updatedAt: new Date().toISOString(),
            },
            cursor: newCursor,
            selectedNoteId: newTripletNote.id,
            isDirty: true,
          }));

          return true;
        } else {
          // Creating new triplet group on non-triplet note
          const tripletDuration = isTripletQuarter
            ? DURATION.TRIPLET_QUARTER
            : DURATION.TRIPLET_EIGHTH;
          const beatPosition = getBeatPositionAt(
            measure,
            currentCursor.noteIndex,
          );
          const result = insertTripletGroup(
            measure.notes,
            currentCursor.noteIndex,
            midi,
            accidental,
            tripletDuration,
            beatPosition,
            state.score.timeSignature,
          );
          if (!result) return false;

          const action = createInsertNoteAction(
            targetCursor,
            result.notes[result.insertedIndex],
          );
          undoManager.pushAction(action);

          // Move cursor appropriately
          const newCursor: CursorPosition = {
            measureIndex: currentCursor.measureIndex,
            noteIndex: result.insertedIndex + result.cursorAdvance,
          };
          cursorRef.current = newCursor;

          setState((prev) => ({
            ...prev,
            score: {
              ...prev.score,
              measures: prev.score.measures.map((m, i) =>
                i === currentCursor.measureIndex
                  ? { ...m, notes: result.notes }
                  : m,
              ),
              updatedAt: new Date().toISOString(),
            },
            cursor: newCursor,
            selectedNoteId: result.notes[result.insertedIndex].id,
            isDirty: true,
          }));

          return true;
        }
      }

      // Regular (non-triplet) note insertion
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

    const targetCursor = {
      measureIndex: currentCursor.measureIndex,
      noteIndex: currentCursor.noteIndex,
    };

    // Check if we're inserting a triplet rest
    const isTripletEighth = state.selectedDuration === DURATION.TRIPLET_EIGHTH;
    const isTripletQuarter =
      state.selectedDuration === DURATION.TRIPLET_QUARTER;
    const isTripletDuration = isTripletEighth || isTripletQuarter;
    const currentNote = measure.notes[currentCursor.noteIndex];
    const isCurrentNoteTriplet = currentNote?.tripletPosition !== undefined;

    // Handle triplet rest insertion
    if (isTripletDuration) {
      if (isCurrentNoteTriplet) {
        const currentPosition = currentNote.tripletPosition!;
        const tripletGroupId = currentNote.tripletGroupId!;

        // Determine group type based on actual notes (not rests)
        // Only lock group type when filled with actual notes - rests can be replaced
        const groupNotes = measure.notes.filter(
          (n) => n.tripletGroupId === tripletGroupId,
        );
        const actualNotes = groupNotes.filter((n) => n.midi !== null);
        const tolerance = 0.001;

        // Check if all actual notes are the same type
        const allActualAreEighths = actualNotes.every(
          (n) =>
            Math.abs(getNoteDuration(n) - DURATION.TRIPLET_EIGHTH) < tolerance,
        );
        const allActualAreQuarters = actualNotes.every(
          (n) =>
            Math.abs(getNoteDuration(n) - DURATION.TRIPLET_QUARTER) < tolerance,
        );

        // Only restrict if the group is "locked" with 3 actual notes of the same type
        const isGroupLocked = actualNotes.length === 3;
        const isLockedEighthGroup = isGroupLocked && allActualAreEighths;
        const isLockedQuarterGroup = isGroupLocked && allActualAreQuarters;

        // In locked quarter groups, only quarter triplets allowed
        if (isLockedQuarterGroup && isTripletEighth) {
          return false;
        }
        // In locked eighth groups, only eighth triplets allowed
        if (isLockedEighthGroup && isTripletQuarter) {
          return false;
        }

        // Simple replacement
        const newTripletRest = createTripletRest(
          currentPosition,
          tripletGroupId,
          state.selectedDuration as
            | typeof DURATION.TRIPLET_EIGHTH
            | typeof DURATION.TRIPLET_QUARTER,
        );

        const action = createInsertNoteAction(targetCursor, newTripletRest);
        undoManager.pushAction(action);

        const newNoteIndex = currentCursor.noteIndex + 1;
        let newCursor: CursorPosition;
        if (newNoteIndex >= measure.notes.length) {
          const nextMeasureIndex = currentCursor.measureIndex + 1;
          if (nextMeasureIndex < state.score.measures.length) {
            newCursor = { measureIndex: nextMeasureIndex, noteIndex: 0 };
          } else {
            newCursor = {
              measureIndex: currentCursor.measureIndex,
              noteIndex: measure.notes.length - 1,
            };
          }
        } else {
          newCursor = {
            measureIndex: currentCursor.measureIndex,
            noteIndex: newNoteIndex,
          };
        }
        cursorRef.current = newCursor;

        setState((prev) => ({
          ...prev,
          score: {
            ...prev.score,
            measures: prev.score.measures.map((m, i) =>
              i === currentCursor.measureIndex
                ? {
                    ...m,
                    notes: m.notes.map((n, ni) =>
                      ni === currentCursor.noteIndex ? newTripletRest : n,
                    ),
                  }
                : m,
            ),
            updatedAt: new Date().toISOString(),
          },
          cursor: newCursor,
          selectedNoteId: newTripletRest.id,
          isDirty: true,
        }));

        return true;
      } else {
        // Creating new triplet group with rest as first note
        const tripletDuration = isTripletQuarter
          ? DURATION.TRIPLET_QUARTER
          : DURATION.TRIPLET_EIGHTH;
        const beatPosition = getBeatPositionAt(
          measure,
          currentCursor.noteIndex,
        );
        const result = insertTripletGroup(
          measure.notes,
          currentCursor.noteIndex,
          null,
          undefined,
          tripletDuration,
          beatPosition,
          state.score.timeSignature,
        );
        if (!result) return false;

        const action = createInsertNoteAction(
          targetCursor,
          result.notes[result.insertedIndex],
        );
        undoManager.pushAction(action);

        const newCursor: CursorPosition = {
          measureIndex: currentCursor.measureIndex,
          noteIndex: result.insertedIndex + result.cursorAdvance,
        };
        cursorRef.current = newCursor;

        setState((prev) => ({
          ...prev,
          score: {
            ...prev.score,
            measures: prev.score.measures.map((m, i) =>
              i === currentCursor.measureIndex
                ? { ...m, notes: result.notes }
                : m,
            ),
            updatedAt: new Date().toISOString(),
          },
          cursor: newCursor,
          selectedNoteId: result.notes[result.insertedIndex].id,
          isDirty: true,
        }));

        return true;
      }
    }

    // Regular (non-triplet) rest insertion
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

    // Helper to merge adjacent rests that can be combined
    const mergeAdjacentRests = (
      notes: Note[],
      timeSignature: TimeSignature,
    ): Note[] => {
      if (notes.length < 2) return notes;

      const result: Note[] = [];
      let i = 0;
      let currentBeat = 0;

      while (i < notes.length) {
        const note = notes[i];

        // Skip non-rests and triplet rests (don't merge triplets)
        if (note.midi !== null || note.tripletPosition !== undefined) {
          result.push(note);
          currentBeat += getNoteDuration(note);
          i++;
          continue;
        }

        // This is a regular rest - try to merge with following rests
        let totalRestDuration = getNoteDuration(note);
        let mergeCount = 1;

        while (i + mergeCount < notes.length) {
          const nextNote = notes[i + mergeCount];
          // Stop if not a rest or is a triplet rest
          if (
            nextNote.midi !== null ||
            nextNote.tripletPosition !== undefined
          ) {
            break;
          }
          totalRestDuration += getNoteDuration(nextNote);
          mergeCount++;
        }

        // Generate optimal rests for the combined duration
        const mergedRests = generateRestsForDurationAtPosition(
          totalRestDuration,
          currentBeat,
          timeSignature,
        );
        result.push(...mergedRests);
        currentBeat += totalRestDuration;
        i += mergeCount;
      }

      return result;
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

    // Suppress the "add measure" prompt since we're deleting, not adding
    suppressAddMeasurePromptRef.current = true;

    const measure = state.score.measures[currentPosition.measureIndex];

    // Handle triplet note deletion specially
    if (
      currentNote.tripletPosition !== undefined &&
      currentNote.tripletGroupId
    ) {
      const tripletGroupId = currentNote.tripletGroupId;

      // Find all notes in this triplet group
      const tripletGroupNotes = measure.notes.filter(
        (n) => n.tripletGroupId === tripletGroupId,
      );
      const tripletGroupIndices = measure.notes
        .map((n, idx) => (n.tripletGroupId === tripletGroupId ? idx : -1))
        .filter((idx) => idx !== -1);

      // Check if after deletion, all remaining notes in group would be rests
      const allRestsAfterDeletion = tripletGroupNotes.every(
        (n) => n.id === currentNote!.id || n.midi === null,
      );

      if (allRestsAfterDeletion) {
        // Calculate total duration of the triplet group (1 beat for 3x eighth, 1 for quarter+eighth)
        const totalTripletDuration = tripletGroupNotes.reduce(
          (sum, n) => sum + getNoteDuration(n),
          0,
        );

        // Get beat position of the first note in the triplet group
        const firstTripletIndex = Math.min(...tripletGroupIndices);
        const beatPosition = getBeatPositionAt(measure, firstTripletIndex);

        // Generate regular rests to replace the entire triplet group
        const replacementRests = generateRestsForDurationAtPosition(
          totalTripletDuration,
          beatPosition,
          state.score.timeSignature,
        );

        // Build new notes array: keep notes before triplet, add replacement rests, keep notes after triplet
        const lastTripletIndex = Math.max(...tripletGroupIndices);
        let newNotes = [
          ...measure.notes.slice(0, firstTripletIndex),
          ...replacementRests,
          ...measure.notes.slice(lastTripletIndex + 1),
        ];

        // Merge adjacent rests in the measure
        newNotes = mergeAdjacentRests(newNotes, state.score.timeSignature);

        // Find the new cursor position (should point to the replacement rest)
        const newCursorIndex = Math.min(firstTripletIndex, newNotes.length - 1);
        const newCursor = {
          measureIndex: currentPosition.measureIndex,
          noteIndex: newCursorIndex,
        };
        const newSelectedId = newNotes[newCursorIndex]?.id || null;

        cursorRef.current = newCursor;

        setState((prevState) => ({
          ...prevState,
          score: {
            ...prevState.score,
            measures: prevState.score.measures.map((m, i) =>
              i === currentPosition.measureIndex
                ? { ...m, notes: newNotes }
                : m,
            ),
            updatedAt: new Date().toISOString(),
          },
          cursor: newCursor,
          selectedNoteId: newSelectedId,
          isDirty: true,
        }));

        return true;
      } else {
        // Some notes in triplet group are still pitched - just replace with triplet rest
        // Use the correct triplet duration based on the group type
        const isQuarterTripletGroup =
          currentNote.duration === DURATION.TRIPLET_QUARTER;
        const tripletRest = createTripletRest(
          currentNote.tripletPosition,
          tripletGroupId,
          isQuarterTripletGroup
            ? DURATION.TRIPLET_QUARTER
            : DURATION.TRIPLET_EIGHTH,
        );

        const newNotes = [
          ...measure.notes.slice(0, currentPosition.noteIndex),
          tripletRest,
          ...measure.notes.slice(currentPosition.noteIndex + 1),
        ];

        const newCursor = currentPosition;
        const newSelectedId = tripletRest.id;

        cursorRef.current = newCursor;

        setState((prevState) => ({
          ...prevState,
          score: {
            ...prevState.score,
            measures: prevState.score.measures.map((m, i) =>
              i === currentPosition.measureIndex
                ? { ...m, notes: newNotes }
                : m,
            ),
            updatedAt: new Date().toISOString(),
          },
          cursor: newCursor,
          selectedNoteId: newSelectedId,
          isDirty: true,
        }));

        return true;
      }
    }

    // Regular (non-triplet) note deletion
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

    // Update cursorRef BEFORE setState to avoid race conditions
    cursorRef.current = currentPosition;

    setState((prevState) => {
      const newMeasures = prevState.score.measures.map((m, i) => {
        if (i !== currentPosition.measureIndex) return m;

        // Replace the deleted note with rests
        let newNotes = [
          ...m.notes.slice(0, currentPosition.noteIndex),
          ...replacementRests,
          ...m.notes.slice(currentPosition.noteIndex + 1),
        ];

        // Merge adjacent rests for cleaner notation
        newNotes = mergeAdjacentRests(newNotes, prevState.score.timeSignature);

        return { ...m, notes: newNotes };
      });

      // Find the new cursor position (may have changed due to rest merging)
      const newMeasure = newMeasures[currentPosition.measureIndex];
      const newCursorIndex = Math.min(
        currentPosition.noteIndex,
        newMeasure.notes.length - 1,
      );
      const newCursor = {
        measureIndex: currentPosition.measureIndex,
        noteIndex: newCursorIndex,
      };
      const newSelectedId = newMeasure.notes[newCursorIndex]?.id || null;

      // Update cursorRef again in case it changed
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

      // Toggle behavior: if clicking the same accidental, remove it
      const targetAccidental =
        note.accidental === accidental ? undefined : accidental;

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
    // Keep settings (clef, time sig, key, tempo, title) but reset all measures to empty
    setState((prev) => {
      const emptyMeasure = createMeasure(prev.score.timeSignature);
      return {
        ...createInitialState({
          ...prev.score,
          measures: [emptyMeasure],
          updatedAt: new Date().toISOString(),
        }),
        isDirty: true,
      };
    });
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
    tripletPosition: noteAtCursor?.tripletPosition,
    tripletGroupType: tripletGroupInfo?.type,
    canStartTriplet,

    // Navigation
    moveCursor,
    selectNote,
    clearSelection,

    // Measure Operations
    addMeasure: measureOperations.addMeasure,
    deleteMeasure: measureOperations.deleteMeasure,
    deleteLastMeasure: measureOperations.deleteLastMeasure,
    fillMeasureWithRests: measureOperations.fillMeasureWithRests,

    // Score Settings
    setClef: scoreSettings.setClef,
    setClefWithTransposition: scoreSettings.setClefWithTransposition,
    hasActualNotes: scoreSettings.hasActualNotes,
    setKeySignature: scoreSettings.setKeySignature,
    setKeySignatureWithTransposition:
      scoreSettings.setKeySignatureWithTransposition,
    setTimeSignature: scoreSettings.setTimeSignature,
    setTempo: scoreSettings.setTempo,
    setTitle: scoreSettings.setTitle,

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
  };
}
