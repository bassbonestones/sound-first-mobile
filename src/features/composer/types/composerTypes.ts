/**
 * Practice Composer Types
 *
 * Core data model for the step-entry music composition tool.
 * All positioning is logical (measure/note index), never graphical.
 */

// =============================================================================
// Duration Constants
// =============================================================================

/** Duration values in beat units (quarter note = 1) */
export const DURATION = {
  WHOLE: 4,
  HALF: 2,
  QUARTER: 1,
  EIGHTH: 0.5,
  SIXTEENTH: 0.25,
} as const;

export type DurationValue = (typeof DURATION)[keyof typeof DURATION];

/** Human-readable duration names */
export type DurationName =
  | "whole"
  | "half"
  | "quarter"
  | "eighth"
  | "sixteenth";

/** Map from duration name to value */
export const DURATION_NAME_TO_VALUE: Record<DurationName, DurationValue> = {
  whole: DURATION.WHOLE,
  half: DURATION.HALF,
  quarter: DURATION.QUARTER,
  eighth: DURATION.EIGHTH,
  sixteenth: DURATION.SIXTEENTH,
};

/** Map from duration value to name */
export const DURATION_VALUE_TO_NAME: Record<DurationValue, DurationName> = {
  [DURATION.WHOLE]: "whole",
  [DURATION.HALF]: "half",
  [DURATION.QUARTER]: "quarter",
  [DURATION.EIGHTH]: "eighth",
  [DURATION.SIXTEENTH]: "sixteenth",
};

// =============================================================================
// Pitch & Clef
// =============================================================================

export type Clef = "treble" | "bass";

export type PitchName = "C" | "D" | "E" | "F" | "G" | "A" | "B";

export type Accidental = "sharp" | "flat" | "natural";

/** Default starting octave by clef (MIDI note number for C) */
export const DEFAULT_OCTAVE_MIDI: Record<Clef, number> = {
  treble: 60, // C4
  bass: 48, // C3
};

/** Pitch class to semitone offset from C */
export const PITCH_TO_SEMITONE: Record<PitchName, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** All pitch names in order */
export const PITCH_NAMES: readonly PitchName[] = [
  "C",
  "D",
  "E",
  "F",
  "G",
  "A",
  "B",
] as const;

// =============================================================================
// Key Signature
// =============================================================================

/** Key signature as number of sharps (positive) or flats (negative) */
export type KeySignature =
  | -7
  | -6
  | -5
  | -4
  | -3
  | -2
  | -1
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7;

/** Key signature display names */
export const KEY_SIGNATURE_NAMES: Record<KeySignature, string> = {
  "-7": "C♭ Major / A♭ minor",
  "-6": "G♭ Major / E♭ minor",
  "-5": "D♭ Major / B♭ minor",
  "-4": "A♭ Major / F minor",
  "-3": "E♭ Major / C minor",
  "-2": "B♭ Major / G minor",
  "-1": "F Major / D minor",
  "0": "C Major / A minor",
  "1": "G Major / E minor",
  "2": "D Major / B minor",
  "3": "A Major / F♯ minor",
  "4": "E Major / C♯ minor",
  "5": "B Major / G♯ minor",
  "6": "F♯ Major / D♯ minor",
  "7": "C♯ Major / A♯ minor",
};

// =============================================================================
// Time Signature
// =============================================================================

export interface TimeSignature {
  /** Number of beats per measure */
  beats: number;
  /** Beat unit (4 = quarter, 8 = eighth, etc.) */
  beatUnit: number;
}

/** Common time signatures */
export const COMMON_TIME_SIGNATURES: readonly TimeSignature[] = [
  { beats: 4, beatUnit: 4 }, // 4/4
  { beats: 3, beatUnit: 4 }, // 3/4
  { beats: 2, beatUnit: 4 }, // 2/4
  { beats: 6, beatUnit: 8 }, // 6/8
  { beats: 2, beatUnit: 2 }, // 2/2
  { beats: 3, beatUnit: 8 }, // 3/8
] as const;

/** Calculate beats per measure in quarter note units */
export function getBeatsPerMeasure(timeSig: TimeSignature): number {
  // Convert to quarter note basis
  // 4/4 = 4 beats, 3/4 = 3 beats, 6/8 = 3 beats (since 8th = 0.5)
  return (timeSig.beats * 4) / timeSig.beatUnit;
}

// =============================================================================
// Note
// =============================================================================

export interface Note {
  /** Unique identifier */
  id: string;
  /** MIDI pitch number (null for rest) */
  midi: number | null;
  /** Duration in quarter note units */
  duration: DurationValue;
  /** Explicit accidental (overrides key signature) */
  accidental?: Accidental;
  /** Whether this note starts a tie */
  tieStart?: boolean;
  /** Whether this note ends a tie */
  tieEnd?: boolean;
}

/** Check if a note is a rest */
export function isRest(note: Note): boolean {
  return note.midi === null;
}

/** Create a new note with unique ID */
export function createNote(
  midi: number | null,
  duration: DurationValue,
  options?: Partial<Pick<Note, "accidental" | "tieStart" | "tieEnd">>,
): Note {
  return {
    id: generateId(),
    midi,
    duration,
    ...options,
  };
}

/** Create a rest */
export function createRest(duration: DurationValue): Note {
  return createNote(null, duration);
}

// =============================================================================
// Measure
// =============================================================================

export interface Measure {
  /** Unique identifier */
  id: string;
  /** Notes in this measure (ordered by position) */
  notes: Note[];
}

/** Create an empty measure */
export function createMeasure(): Measure {
  return {
    id: generateId(),
    notes: [],
  };
}

/** Calculate total duration of notes in a measure */
export function getMeasureDuration(measure: Measure): number {
  return measure.notes.reduce((sum, note) => sum + note.duration, 0);
}

// =============================================================================
// Composer Score
// =============================================================================

export interface ComposerScore {
  /** Unique identifier */
  id: string;
  /** Score title */
  title: string;
  /** Clef type */
  clef: Clef;
  /** Key signature (-7 to +7) */
  keySignature: KeySignature;
  /** Time signature */
  timeSignature: TimeSignature;
  /** Tempo in BPM */
  tempo: number;
  /** Measures in the score */
  measures: Measure[];
  /** Creation timestamp */
  createdAt: string;
  /** Last modified timestamp */
  updatedAt: string;
}

/** Default values for a new score */
export const DEFAULT_SCORE_VALUES = {
  title: "Untitled",
  clef: "treble" as Clef,
  keySignature: 0 as KeySignature,
  timeSignature: { beats: 4, beatUnit: 4 } as TimeSignature,
  tempo: 120,
} as const;

/** Create a new empty score */
export function createScore(options?: Partial<ComposerScore>): ComposerScore {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: DEFAULT_SCORE_VALUES.title,
    clef: DEFAULT_SCORE_VALUES.clef,
    keySignature: DEFAULT_SCORE_VALUES.keySignature,
    timeSignature: { ...DEFAULT_SCORE_VALUES.timeSignature },
    tempo: DEFAULT_SCORE_VALUES.tempo,
    measures: [createMeasure()], // Start with one empty measure
    createdAt: now,
    updatedAt: now,
    ...options,
  };
}

// =============================================================================
// Cursor Position
// =============================================================================

export interface CursorPosition {
  /** Index of the current measure (0-based) */
  measureIndex: number;
  /** Index within the measure's notes array (0-based, can equal notes.length for end position) */
  noteIndex: number;
}

/** Default cursor position (start of first measure) */
export const DEFAULT_CURSOR: CursorPosition = {
  measureIndex: 0,
  noteIndex: 0,
};

// =============================================================================
// Composer State
// =============================================================================

export interface ComposerState {
  /** The score being edited */
  score: ComposerScore;
  /** Current cursor position */
  cursor: CursorPosition;
  /** Currently selected duration for new notes */
  selectedDuration: DurationValue;
  /** Currently selected octave (MIDI note for C) */
  selectedOctave: number;
  /** Currently selected note (null if none selected) */
  selectedNoteId: string | null;
  /** Whether playback is active */
  isPlaying: boolean;
  /** Playback position (measure, note indices) */
  playbackPosition: CursorPosition | null;
  /** Dirty flag for unsaved changes */
  isDirty: boolean;
}

/** Create initial composer state */
export function createInitialState(score?: ComposerScore): ComposerState {
  const actualScore = score || createScore();
  return {
    score: actualScore,
    cursor: { ...DEFAULT_CURSOR },
    selectedDuration: DURATION.QUARTER,
    selectedOctave: DEFAULT_OCTAVE_MIDI[actualScore.clef],
    selectedNoteId: null,
    isPlaying: false,
    playbackPosition: null,
    isDirty: false,
  };
}

// =============================================================================
// Validation
// =============================================================================

export interface MeasureValidation {
  /** Whether measure has correct duration */
  isComplete: boolean;
  /** Expected duration based on time signature */
  expectedDuration: number;
  /** Actual duration of notes */
  actualDuration: number;
  /** Difference (negative = needs more, positive = overflow) */
  difference: number;
}

/** Validate a measure's duration against time signature */
export function validateMeasure(
  measure: Measure,
  timeSignature: TimeSignature,
): MeasureValidation {
  const expected = getBeatsPerMeasure(timeSignature);
  const actual = getMeasureDuration(measure);
  return {
    isComplete: Math.abs(actual - expected) < 0.001, // Float tolerance
    expectedDuration: expected,
    actualDuration: actual,
    difference: actual - expected,
  };
}

/** Check if adding a note would overflow the measure */
export function wouldOverflow(
  measure: Measure,
  duration: DurationValue,
  timeSignature: TimeSignature,
): boolean {
  const expected = getBeatsPerMeasure(timeSignature);
  const currentDuration = getMeasureDuration(measure);
  return currentDuration + duration > expected + 0.001; // Float tolerance
}

// =============================================================================
// Utilities
// =============================================================================

/** Generate a unique ID */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/** Format time signature as string (e.g., "4/4") */
export function formatTimeSignature(timeSig: TimeSignature): string {
  return `${timeSig.beats}/${timeSig.beatUnit}`;
}

/** Format duration as string for display */
export function formatDuration(duration: DurationValue): string {
  return DURATION_VALUE_TO_NAME[duration] || `${duration}`;
}
