/**
 * Composer Action Types
 *
 * Defines all actions that can be undone/redone in the composer.
 * Each action contains enough information to reverse itself.
 */

import type {
  Accidental,
  Clef,
  CursorPosition,
  DurationValue,
  KeySignature,
  Measure,
  Note,
  TimeSignature,
} from "./composerTypes";

// =============================================================================
// Action Type Discriminators
// =============================================================================

export type ComposerActionType =
  | "INSERT_NOTE"
  | "DELETE_NOTE"
  | "CHANGE_PITCH"
  | "CHANGE_DURATION"
  | "APPLY_ACCIDENTAL"
  | "TOGGLE_TIE"
  | "ADD_MEASURE"
  | "DELETE_MEASURE"
  | "CHANGE_CLEF"
  | "CHANGE_KEY_SIGNATURE"
  | "CHANGE_TIME_SIGNATURE"
  | "CHANGE_TEMPO"
  | "CHANGE_TITLE";

// =============================================================================
// Individual Action Interfaces
// =============================================================================

export interface InsertNoteAction {
  type: "INSERT_NOTE";
  /** Where the note was inserted */
  position: CursorPosition;
  /** The note that was inserted */
  note: Note;
}

export interface DeleteNoteAction {
  type: "DELETE_NOTE";
  /** Where the note was deleted from */
  position: CursorPosition;
  /** The note that was removed (for undo) */
  deletedNote: Note;
}

export interface ChangePitchAction {
  type: "CHANGE_PITCH";
  /** Location of the note */
  position: CursorPosition;
  /** Note ID for verification */
  noteId: string;
  /** Previous MIDI pitch */
  previousMidi: number | null;
  /** New MIDI pitch */
  newMidi: number | null;
}

export interface ChangeDurationAction {
  type: "CHANGE_DURATION";
  /** Location of the note */
  position: CursorPosition;
  /** Note ID for verification */
  noteId: string;
  /** Previous duration */
  previousDuration: DurationValue;
  /** New duration */
  newDuration: DurationValue;
}

export interface ApplyAccidentalAction {
  type: "APPLY_ACCIDENTAL";
  /** Location of the note */
  position: CursorPosition;
  /** Note ID for verification */
  noteId: string;
  /** Previous accidental (undefined if none) */
  previousAccidental?: Accidental;
  /** New accidental (undefined to remove) */
  newAccidental?: Accidental;
  /** Previous MIDI value */
  previousMidi: number;
  /** New MIDI value */
  newMidi: number;
}

export interface ToggleTieAction {
  type: "TOGGLE_TIE";
  /** Location of the note */
  position: CursorPosition;
  /** Note ID for verification */
  noteId: string;
  /** Whether toggling tieStart or tieEnd */
  tieType: "start" | "end";
  /** Previous value */
  previousValue: boolean;
  /** New value */
  newValue: boolean;
}

export interface AddMeasureAction {
  type: "ADD_MEASURE";
  /** Index where measure was inserted */
  measureIndex: number;
  /** The measure that was added */
  measure: Measure;
}

export interface DeleteMeasureAction {
  type: "DELETE_MEASURE";
  /** Index where measure was removed */
  measureIndex: number;
  /** The measure that was removed (for undo) */
  deletedMeasure: Measure;
}

export interface ChangeClefAction {
  type: "CHANGE_CLEF";
  previousClef: Clef;
  newClef: Clef;
}

export interface ChangeKeySignatureAction {
  type: "CHANGE_KEY_SIGNATURE";
  previousKey: KeySignature;
  newKey: KeySignature;
}

export interface ChangeTimeSignatureAction {
  type: "CHANGE_TIME_SIGNATURE";
  previousTimeSig: TimeSignature;
  newTimeSig: TimeSignature;
}

export interface ChangeTempoAction {
  type: "CHANGE_TEMPO";
  previousTempo: number;
  newTempo: number;
}

export interface ChangeTitleAction {
  type: "CHANGE_TITLE";
  previousTitle: string;
  newTitle: string;
}

// =============================================================================
// Union Type
// =============================================================================

export type ComposerAction =
  | InsertNoteAction
  | DeleteNoteAction
  | ChangePitchAction
  | ChangeDurationAction
  | ApplyAccidentalAction
  | ToggleTieAction
  | AddMeasureAction
  | DeleteMeasureAction
  | ChangeClefAction
  | ChangeKeySignatureAction
  | ChangeTimeSignatureAction
  | ChangeTempoAction
  | ChangeTitleAction;

// =============================================================================
// Action Creators
// =============================================================================

export function createInsertNoteAction(
  position: CursorPosition,
  note: Note,
): InsertNoteAction {
  return { type: "INSERT_NOTE", position: { ...position }, note };
}

export function createDeleteNoteAction(
  position: CursorPosition,
  deletedNote: Note,
): DeleteNoteAction {
  return { type: "DELETE_NOTE", position: { ...position }, deletedNote };
}

export function createChangePitchAction(
  position: CursorPosition,
  noteId: string,
  previousMidi: number | null,
  newMidi: number | null,
): ChangePitchAction {
  return {
    type: "CHANGE_PITCH",
    position: { ...position },
    noteId,
    previousMidi,
    newMidi,
  };
}

export function createChangeDurationAction(
  position: CursorPosition,
  noteId: string,
  previousDuration: DurationValue,
  newDuration: DurationValue,
): ChangeDurationAction {
  return {
    type: "CHANGE_DURATION",
    position: { ...position },
    noteId,
    previousDuration,
    newDuration,
  };
}

export function createApplyAccidentalAction(
  position: CursorPosition,
  noteId: string,
  previousAccidental: Accidental | undefined,
  newAccidental: Accidental | undefined,
  previousMidi: number,
  newMidi: number,
): ApplyAccidentalAction {
  return {
    type: "APPLY_ACCIDENTAL",
    position: { ...position },
    noteId,
    previousAccidental,
    newAccidental,
    previousMidi,
    newMidi,
  };
}

export function createToggleTieAction(
  position: CursorPosition,
  noteId: string,
  tieType: "start" | "end",
  previousValue: boolean,
  newValue: boolean,
): ToggleTieAction {
  return {
    type: "TOGGLE_TIE",
    position: { ...position },
    noteId,
    tieType,
    previousValue,
    newValue,
  };
}

export function createAddMeasureAction(
  measureIndex: number,
  measure: Measure,
): AddMeasureAction {
  return { type: "ADD_MEASURE", measureIndex, measure };
}

export function createDeleteMeasureAction(
  measureIndex: number,
  deletedMeasure: Measure,
): DeleteMeasureAction {
  return { type: "DELETE_MEASURE", measureIndex, deletedMeasure };
}

// =============================================================================
// Undo Stack Types
// =============================================================================

export interface UndoState {
  /** Actions that can be undone (most recent first) */
  undoStack: ComposerAction[];
  /** Actions that can be redone (most recent first) */
  redoStack: ComposerAction[];
  /** Maximum stack size */
  maxSize: number;
}

export const DEFAULT_UNDO_STATE: UndoState = {
  undoStack: [],
  redoStack: [],
  maxSize: 100,
};
