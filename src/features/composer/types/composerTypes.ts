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
  TRIPLET_QUARTER: 2 / 3, // Two triplet eighths = 2/3 beat
  TRIPLET_EIGHTH: 1 / 3, // Three triplet eighths = one beat
  SIXTEENTH: 0.25,
} as const;

export type DurationValue = (typeof DURATION)[keyof typeof DURATION];

/** Human-readable duration names */
export type DurationName =
  | "whole"
  | "half"
  | "quarter"
  | "eighth"
  | "triplet-quarter"
  | "triplet-eighth"
  | "sixteenth";

/** Map from duration name to value */
export const DURATION_NAME_TO_VALUE: Record<DurationName, DurationValue> = {
  whole: DURATION.WHOLE,
  half: DURATION.HALF,
  quarter: DURATION.QUARTER,
  eighth: DURATION.EIGHTH,
  "triplet-quarter": DURATION.TRIPLET_QUARTER,
  "triplet-eighth": DURATION.TRIPLET_EIGHTH,
  sixteenth: DURATION.SIXTEENTH,
};

/** Map from duration value to name */
export const DURATION_VALUE_TO_NAME: Record<DurationValue, DurationName> = {
  [DURATION.WHOLE]: "whole",
  [DURATION.HALF]: "half",
  [DURATION.QUARTER]: "quarter",
  [DURATION.EIGHTH]: "eighth",
  [DURATION.TRIPLET_QUARTER]: "triplet-quarter",
  [DURATION.TRIPLET_EIGHTH]: "triplet-eighth",
  [DURATION.SIXTEENTH]: "sixteenth",
};

// =============================================================================
// Pitch & Clef
// =============================================================================

export type Clef = "treble" | "bass";

export type PitchName = "C" | "D" | "E" | "F" | "G" | "A" | "B";

export type Accidental =
  | "sharp"
  | "flat"
  | "natural"
  | "double-sharp"
  | "double-flat";

/** Default starting octave by clef (MIDI note number for C) */
export const DEFAULT_OCTAVE_MIDI: Record<Clef, number> = {
  treble: 60, // C4
  bass: 48, // C3
};

/** Staff center pitch by clef - reference for smart octave when no previous note */
export const STAFF_CENTER_MIDI: Record<Clef, number> = {
  treble: 71, // B4 (center of treble staff)
  bass: 50, // D3 (center of bass staff)
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
  /** Whether this note is dotted (adds 50% to duration) */
  dotted?: boolean;
  /** Explicit accidental (overrides key signature) */
  accidental?: Accidental;
  /** Whether this note starts a tie */
  tieStart?: boolean;
  /** Whether this note ends a tie */
  tieEnd?: boolean;
  /** Position within a triplet group (1, 2, or 3) */
  tripletPosition?: 1 | 2 | 3;
  /** Unique ID linking notes in the same triplet group */
  tripletGroupId?: string;
}

/**
 * Get the actual duration of a note in beats, accounting for dots.
 * A dotted note has 1.5x duration.
 */
export function getNoteDuration(note: Note): number {
  return note.dotted ? note.duration * 1.5 : note.duration;
}

/** Check if a note is a rest */
export function isRest(note: Note): boolean {
  return note.midi === null;
}

/** Create a new note with unique ID */
export function createNote(
  midi: number | null,
  duration: DurationValue,
  options?: Partial<
    Pick<
      Note,
      | "accidental"
      | "dotted"
      | "tieStart"
      | "tieEnd"
      | "tripletPosition"
      | "tripletGroupId"
    >
  >,
): Note {
  return {
    id: generateId(),
    midi,
    duration,
    ...options,
  };
}

/** Check if a note is part of a triplet */
export function isTriplet(note: Note): boolean {
  return note.tripletPosition !== undefined;
}

/** Check if a duration is a triplet duration */
export function isTripletDuration(duration: DurationValue): boolean {
  return (
    duration === DURATION.TRIPLET_EIGHTH ||
    duration === DURATION.TRIPLET_QUARTER
  );
}

/** Create a triplet note (eighth or quarter) */
export function createTripletNote(
  midi: number | null,
  duration: typeof DURATION.TRIPLET_EIGHTH | typeof DURATION.TRIPLET_QUARTER,
  position: 1 | 2 | 3,
  tripletGroupId: string,
  options?: Partial<Pick<Note, "accidental">>,
): Note {
  return createNote(midi, duration, {
    ...options,
    tripletPosition: position,
    tripletGroupId,
  });
}

/** Create a triplet eighth rest */
export function createTripletRest(
  position: 1 | 2 | 3,
  tripletGroupId: string,
): Note {
  return createTripletNote(
    null,
    DURATION.TRIPLET_EIGHTH,
    position,
    tripletGroupId,
  );
}

/** Create a rest */
export function createRest(duration: DurationValue, dotted?: boolean): Note {
  return createNote(null, duration, dotted ? { dotted } : undefined);
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

/**
 * Generate rests to fill a measure based on time signature.
 * Uses the most natural rest type: single rest if possible, otherwise beat-unit rests.
 */
export function generateMeasureRests(timeSig: TimeSignature): Note[] {
  const totalBeats = getBeatsPerMeasure(timeSig);

  // Standard duration values we can use
  const standardDurations: DurationValue[] = [
    DURATION.WHOLE, // 4
    DURATION.HALF, // 2
    DURATION.QUARTER, // 1
    DURATION.EIGHTH, // 0.5
    DURATION.SIXTEENTH, // 0.25
  ];

  // If total beats matches a standard duration, use single rest
  if (standardDurations.includes(totalBeats as DurationValue)) {
    return [createRest(totalBeats as DurationValue)];
  }

  // Otherwise, fill with beat-unit rests
  // Convert beat unit to duration value (4 = quarter = 1, 8 = eighth = 0.5, etc.)
  const beatUnitDuration = 4 / timeSig.beatUnit;

  // Check if beat unit is a valid duration
  if (standardDurations.includes(beatUnitDuration as DurationValue)) {
    const rests: Note[] = [];
    for (let i = 0; i < timeSig.beats; i++) {
      rests.push(createRest(beatUnitDuration as DurationValue));
    }
    return rests;
  }

  // Fallback: fill with quarter rests
  const rests: Note[] = [];
  let remaining = totalBeats;
  while (remaining > 0) {
    const duration =
      remaining >= 1
        ? DURATION.QUARTER
        : remaining >= 0.5
          ? DURATION.EIGHTH
          : DURATION.SIXTEENTH;
    rests.push(createRest(duration));
    remaining -= duration;
  }
  return rests;
}

/** Create an empty measure */
export function createMeasure(timeSig?: TimeSignature): Measure {
  return {
    id: generateId(),
    notes: timeSig ? generateMeasureRests(timeSig) : [],
  };
}

/** Calculate total duration of notes in a measure */
export function getMeasureDuration(measure: Measure): number {
  return measure.notes.reduce((sum, note) => sum + getNoteDuration(note), 0);
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
  title: "Composer",
  clef: "treble" as Clef,
  keySignature: 0 as KeySignature,
  timeSignature: { beats: 4, beatUnit: 4 } as TimeSignature,
  tempo: 120,
} as const;

/** Create a new empty score */
export function createScore(options?: Partial<ComposerScore>): ComposerScore {
  const now = new Date().toISOString();
  const timeSig = options?.timeSignature ?? {
    ...DEFAULT_SCORE_VALUES.timeSignature,
  };
  return {
    id: generateId(),
    title: DEFAULT_SCORE_VALUES.title,
    clef: DEFAULT_SCORE_VALUES.clef,
    keySignature: DEFAULT_SCORE_VALUES.keySignature,
    timeSignature: timeSig,
    tempo: DEFAULT_SCORE_VALUES.tempo,
    measures: [createMeasure(timeSig)], // Start with rest-filled measure
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
  /** Whether dotted mode is active (adds 50% to duration) */
  dottedMode: boolean;
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
    dottedMode: false,
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
  dotted?: boolean,
): boolean {
  const expected = getBeatsPerMeasure(timeSignature);
  const currentDuration = getMeasureDuration(measure);
  const newDuration = dotted ? duration * 1.5 : duration;
  return currentDuration + newDuration > expected + 0.001; // Float tolerance
}

/**
 * Get the beat position at a specific note index within a measure.
 * Returns the cumulative duration of all notes before this index.
 */
export function getBeatPositionAt(measure: Measure, noteIndex: number): number {
  let position = 0;
  for (let i = 0; i < noteIndex && i < measure.notes.length; i++) {
    position += getNoteDuration(measure.notes[i]);
  }
  return position;
}

/**
 * Result of a replace operation
 */
export interface ReplaceResult {
  /** New notes array for the measure */
  notes: Note[];
  /** Index of the newly inserted note */
  insertedIndex: number;
  /** Any overflow duration that couldn't fit (for cross-measure replacement) */
  overflowDuration: number;
}

/**
 * Replace notes starting at a given index with a new note.
 * Handles consuming subsequent notes if new duration is longer,
 * and fills any remainder with rests.
 */
export function replaceNoteAtIndex(
  measure: Measure,
  noteIndex: number,
  newNote: Note,
  timeSignature: TimeSignature,
): ReplaceResult {
  const measureDuration = getBeatsPerMeasure(timeSignature);
  const startBeat = getBeatPositionAt(measure, noteIndex);
  const newNoteDuration = getNoteDuration(newNote);
  const endBeat = startBeat + newNoteDuration;

  // Notes before the insertion point stay unchanged
  const notesBefore = measure.notes.slice(0, noteIndex);

  // Find notes that need to be removed (those that overlap with new note's range)
  let currentBeat = startBeat;
  let consumeEndIndex = noteIndex;

  while (consumeEndIndex < measure.notes.length && currentBeat < endBeat) {
    currentBeat += getNoteDuration(measure.notes[consumeEndIndex]);
    consumeEndIndex++;
  }

  // Notes after the consumed range (may need adjustment)
  const notesAfter = measure.notes.slice(consumeEndIndex);

  // Calculate any overflow that extends past the measure
  const overflowDuration = Math.max(0, endBeat - measureDuration);

  // Calculate remainder if we consumed more than we needed
  const remainderDuration = currentBeat - endBeat;

  // Build the new notes array
  const newNotes: Note[] = [...notesBefore];

  // Check if note would overflow the measure
  const availableDuration = measureDuration - startBeat;
  if (newNoteDuration <= availableDuration) {
    // Note fits - add it as-is
    newNotes.push(newNote);
  } else if (availableDuration > 0) {
    // Note would overflow - truncate by removing dotted flag or reducing duration
    // For simplicity, we remove the dotted flag first if present
    if (newNote.dotted && newNote.duration <= availableDuration) {
      newNotes.push({ ...newNote, dotted: undefined });
    } else {
      // Fall back to undotted note that fits
      const fittingDuration = [
        DURATION.WHOLE,
        DURATION.HALF,
        DURATION.QUARTER,
        DURATION.EIGHTH,
        DURATION.SIXTEENTH,
      ].find((d) => d <= availableDuration) as DurationValue;
      if (fittingDuration) {
        newNotes.push({
          ...newNote,
          duration: fittingDuration,
          dotted: undefined,
        });
      }
    }
  }

  // Fill remainder with rests if we consumed more than the new note needs
  if (remainderDuration > 0 && overflowDuration === 0) {
    const remainderStartBeat = startBeat + newNoteDuration;
    const remainderRests = generateRestsForDurationAtPosition(
      remainderDuration,
      remainderStartBeat,
      timeSignature,
    );
    newNotes.push(...remainderRests);
  }

  // Add back any notes after the consumed range
  newNotes.push(...notesAfter);

  return {
    notes: newNotes,
    insertedIndex: noteIndex,
    overflowDuration,
  };
}

/**
 * Generate rests to fill a specific duration.
 * Uses largest possible rests first.
 * NOTE: Use generateRestsForDurationAtPosition when beat position matters.
 */
export function generateRestsForDuration(duration: number): Note[] {
  const rests: Note[] = [];
  let remaining = duration;

  // Standard durations in descending order
  const durations: DurationValue[] = [
    DURATION.WHOLE,
    DURATION.HALF,
    DURATION.QUARTER,
    DURATION.EIGHTH,
    DURATION.SIXTEENTH,
  ];

  const tolerance = 0.001;

  for (const d of durations) {
    while (remaining >= d - tolerance) {
      rests.push(createRest(d));
      remaining -= d;
    }
  }

  return rests;
}

/**
 * Get the half-measure boundary in quarter-note beats.
 * For even-beat simple meters (2/4, 4/4, etc.), returns the midpoint.
 * For odd-beat meters or compound meters, returns null (no boundary).
 */
export function getHalfMeasureBoundary(
  timeSignature: TimeSignature,
): number | null {
  const { beats, beatUnit } = timeSignature;
  const quarterNotesPerBeat = 4 / beatUnit;
  const totalQuarterNotes = beats * quarterNotesPerBeat;

  // Only apply to even-beat simple meters (beats divisible by 2)
  // Common examples: 2/4, 4/4, 2/2
  if (beats % 2 === 0 && beatUnit <= 4) {
    return totalQuarterNotes / 2;
  }

  // For compound meters (6/8, 9/8, 12/8), could add different grouping logic
  // For now, return null to use simple largest-rest-first approach
  return null;
}

/**
 * Generate rests to fill a duration, respecting the half-measure boundary.
 * In even-beat meters like 4/4, rests should not cross from beat 2 to beat 3
 * unless they start at beat 1.
 */
export function generateRestsForDurationAtPosition(
  duration: number,
  startBeat: number,
  timeSignature: TimeSignature,
): Note[] {
  const tolerance = 0.001;
  const boundary = getHalfMeasureBoundary(timeSignature);

  // If no boundary constraint or starting at beat 0, use simple approach
  if (boundary === null || startBeat < tolerance) {
    return generateRestsForDuration(duration);
  }

  const rests: Note[] = [];
  let currentBeat = startBeat;
  let remaining = duration;

  // Standard durations in descending order
  const durations: DurationValue[] = [
    DURATION.WHOLE,
    DURATION.HALF,
    DURATION.QUARTER,
    DURATION.EIGHTH,
    DURATION.SIXTEENTH,
  ];

  while (remaining > tolerance) {
    // Find the largest duration that fits and doesn't cross boundary
    let bestDuration: DurationValue | null = null;

    for (const d of durations) {
      if (d > remaining + tolerance) continue;

      // Check if this duration would cross the boundary inappropriately
      // Use tolerance when checking if we're at or past the boundary
      // (handles floating point issues with triplet durations like 1/3 + 1/3 + 1/3)
      const atOrPastBoundary = currentBeat >= boundary - tolerance;
      const wouldCrossBoundary =
        !atOrPastBoundary && currentBeat + d > boundary + tolerance;

      if (wouldCrossBoundary) {
        // Can't use this duration - try smaller ones
        continue;
      }

      bestDuration = d;
      break;
    }

    if (bestDuration === null) {
      // Shouldn't happen, but fall back to smallest duration
      bestDuration = DURATION.SIXTEENTH;
    }

    rests.push(createRest(bestDuration));
    remaining -= bestDuration;
    currentBeat += bestDuration;
  }

  return rests;
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
