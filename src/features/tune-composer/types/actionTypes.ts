/**
 * Tune Composer Action Types
 *
 * Defines all actions that can be undone/redone in the tune composer.
 * Extends composer actions with lyrics, dynamics, and articulation support.
 */

import type {
  Accidental,
  ArticulationType,
  Clef,
  CursorPosition,
  DurationValue,
  DynamicType,
  KeySignature,
  Lyric,
  Measure,
  Note,
  TempoBeatUnit,
  TimeSignature,
  WedgeMark,
} from "./tuneComposerTypes";

// =============================================================================
// Action Type Discriminators
// =============================================================================

export type TuneComposerActionType =
  | "INSERT_NOTE"
  | "DELETE_NOTE"
  | "CHANGE_PITCH"
  | "CHANGE_DURATION"
  | "APPLY_ACCIDENTAL"
  | "TOGGLE_TIE"
  | "ADD_MEASURE"
  | "DELETE_MEASURE"
  | "SET_PICKUP"
  | "CHANGE_CLEF"
  | "CHANGE_KEY_SIGNATURE"
  | "CHANGE_TIME_SIGNATURE"
  | "CHANGE_TEMPO"
  | "CHANGE_TEMPO_BEAT_UNIT"
  | "CHANGE_TITLE"
  // Extended actions for tune composition
  | "SET_LYRIC"
  | "REMOVE_LYRIC"
  | "SET_DYNAMIC"
  | "REMOVE_DYNAMIC"
  | "SET_WEDGE"
  | "REMOVE_WEDGE"
  | "SET_ARTICULATION"
  | "REMOVE_ARTICULATION"
  | "SET_EXPRESSION"
  | "REMOVE_EXPRESSION";

// =============================================================================
// Base Action Interfaces (same as composer)
// =============================================================================

export interface InsertNoteAction {
  type: "INSERT_NOTE";
  position: CursorPosition;
  note: Note;
}

export interface DeleteNoteAction {
  type: "DELETE_NOTE";
  position: CursorPosition;
  deletedNote: Note;
}

export interface ChangePitchAction {
  type: "CHANGE_PITCH";
  position: CursorPosition;
  noteId: string;
  previousMidi: number | null;
  newMidi: number | null;
}

export interface ChangeDurationAction {
  type: "CHANGE_DURATION";
  position: CursorPosition;
  noteId: string;
  previousDuration: DurationValue;
  newDuration: DurationValue;
}

export interface ApplyAccidentalAction {
  type: "APPLY_ACCIDENTAL";
  position: CursorPosition;
  noteId: string;
  previousAccidental?: Accidental;
  newAccidental?: Accidental;
  previousMidi: number;
  newMidi: number;
}

export interface ToggleTieAction {
  type: "TOGGLE_TIE";
  position: CursorPosition;
  noteId: string;
  tieType: "start" | "end";
  previousValue: boolean;
  newValue: boolean;
}

export interface AddMeasureAction {
  type: "ADD_MEASURE";
  measureIndex: number;
  measure: Measure;
}

export interface DeleteMeasureAction {
  type: "DELETE_MEASURE";
  measureIndex: number;
  deletedMeasure: Measure;
}

export interface SetPickupAction {
  type: "SET_PICKUP";
  /** New pickup duration in beats (undefined = remove pickup) */
  newDuration: number | undefined;
  /** Previous pickup duration (for undo) */
  previousDuration: number | undefined;
  /** The previous first measure (for undo when removing pickup) */
  previousFirstMeasure: Measure;
  /** The new first measure (pickup or restored full measure) */
  newFirstMeasure: Measure;
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

export interface ChangeTempoBeatUnitAction {
  type: "CHANGE_TEMPO_BEAT_UNIT";
  previousBeatUnit: TempoBeatUnit;
  newBeatUnit: TempoBeatUnit;
}

export interface ChangeTitleAction {
  type: "CHANGE_TITLE";
  previousTitle: string;
  newTitle: string;
}

// =============================================================================
// Extended Action Interfaces (tune composition specific)
// =============================================================================

export interface SetLyricAction {
  type: "SET_LYRIC";
  position: CursorPosition;
  noteId: string;
  previousLyric?: Lyric;
  newLyric: Lyric;
}

export interface RemoveLyricAction {
  type: "REMOVE_LYRIC";
  position: CursorPosition;
  noteId: string;
  removedLyric: Lyric;
}

export interface SetDynamicAction {
  type: "SET_DYNAMIC";
  position: CursorPosition;
  noteId: string;
  previousDynamic?: DynamicType;
  newDynamic: DynamicType;
}

export interface RemoveDynamicAction {
  type: "REMOVE_DYNAMIC";
  position: CursorPosition;
  noteId: string;
  removedDynamic: DynamicType;
}

export interface SetWedgeAction {
  type: "SET_WEDGE";
  position: CursorPosition;
  noteId: string;
  previousWedge?: WedgeMark;
  newWedge: WedgeMark;
}

export interface RemoveWedgeAction {
  type: "REMOVE_WEDGE";
  position: CursorPosition;
  noteId: string;
  removedWedge: WedgeMark;
}

export interface SetArticulationAction {
  type: "SET_ARTICULATION";
  position: CursorPosition;
  noteId: string;
  previousArticulation?: ArticulationType;
  newArticulation: ArticulationType;
}

export interface RemoveArticulationAction {
  type: "REMOVE_ARTICULATION";
  position: CursorPosition;
  noteId: string;
  removedArticulation: ArticulationType;
}

export interface SetExpressionAction {
  type: "SET_EXPRESSION";
  position: CursorPosition;
  noteId: string;
  previousExpression?: string;
  newExpression: string;
}

export interface RemoveExpressionAction {
  type: "REMOVE_EXPRESSION";
  position: CursorPosition;
  noteId: string;
  removedExpression: string;
}

// =============================================================================
// Union Type
// =============================================================================

export type TuneComposerAction =
  | InsertNoteAction
  | DeleteNoteAction
  | ChangePitchAction
  | ChangeDurationAction
  | ApplyAccidentalAction
  | ToggleTieAction
  | AddMeasureAction
  | DeleteMeasureAction
  | SetPickupAction
  | ChangeClefAction
  | ChangeKeySignatureAction
  | ChangeTimeSignatureAction
  | ChangeTempoAction
  | ChangeTitleAction
  | SetLyricAction
  | RemoveLyricAction
  | SetDynamicAction
  | RemoveDynamicAction
  | SetWedgeAction
  | RemoveWedgeAction
  | SetArticulationAction
  | RemoveArticulationAction
  | SetExpressionAction
  | RemoveExpressionAction;

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

export function createSetPickupAction(
  newDuration: number | undefined,
  previousDuration: number | undefined,
  previousFirstMeasure: Measure,
  newFirstMeasure: Measure,
): SetPickupAction {
  return {
    type: "SET_PICKUP",
    newDuration,
    previousDuration,
    previousFirstMeasure,
    newFirstMeasure,
  };
}

export function createSetLyricAction(
  position: CursorPosition,
  noteId: string,
  newLyric: Lyric,
  previousLyric?: Lyric,
): SetLyricAction {
  return {
    type: "SET_LYRIC",
    position: { ...position },
    noteId,
    newLyric,
    previousLyric,
  };
}

export function createRemoveLyricAction(
  position: CursorPosition,
  noteId: string,
  removedLyric: Lyric,
): RemoveLyricAction {
  return {
    type: "REMOVE_LYRIC",
    position: { ...position },
    noteId,
    removedLyric,
  };
}

export function createSetDynamicAction(
  position: CursorPosition,
  noteId: string,
  newDynamic: DynamicType,
  previousDynamic?: DynamicType,
): SetDynamicAction {
  return {
    type: "SET_DYNAMIC",
    position: { ...position },
    noteId,
    newDynamic,
    previousDynamic,
  };
}

export function createRemoveDynamicAction(
  position: CursorPosition,
  noteId: string,
  removedDynamic: DynamicType,
): RemoveDynamicAction {
  return {
    type: "REMOVE_DYNAMIC",
    position: { ...position },
    noteId,
    removedDynamic,
  };
}

export function createSetArticulationAction(
  position: CursorPosition,
  noteId: string,
  newArticulation: ArticulationType,
  previousArticulation?: ArticulationType,
): SetArticulationAction {
  return {
    type: "SET_ARTICULATION",
    position: { ...position },
    noteId,
    newArticulation,
    previousArticulation,
  };
}

export function createRemoveArticulationAction(
  position: CursorPosition,
  noteId: string,
  removedArticulation: ArticulationType,
): RemoveArticulationAction {
  return {
    type: "REMOVE_ARTICULATION",
    position: { ...position },
    noteId,
    removedArticulation,
  };
}

export function createSetExpressionAction(
  position: CursorPosition,
  noteId: string,
  newExpression: string,
  previousExpression?: string,
): SetExpressionAction {
  return {
    type: "SET_EXPRESSION",
    position: { ...position },
    noteId,
    newExpression,
    previousExpression,
  };
}

export function createRemoveExpressionAction(
  position: CursorPosition,
  noteId: string,
  removedExpression: string,
): RemoveExpressionAction {
  return {
    type: "REMOVE_EXPRESSION",
    position: { ...position },
    noteId,
    removedExpression,
  };
}

// =============================================================================
// Undo Stack Types
// =============================================================================

export interface UndoState {
  undoStack: TuneComposerAction[];
  redoStack: TuneComposerAction[];
  maxSize: number;
}

export const DEFAULT_UNDO_STATE: UndoState = {
  undoStack: [],
  redoStack: [],
  maxSize: 100,
};
