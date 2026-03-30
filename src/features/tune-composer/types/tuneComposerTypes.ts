/**
 * Tune Composer Types
 *
 * Extended data model for the tune composition tool with lyrics, dynamics,
 * articulations, and expression markings.
 * Based on composerTypes.ts with additional annotation support.
 */

// Re-export from extracted type files
export * from "./chordTypes";
export * from "./practiceOverChangesTypes";

// Import dependencies from extracted files for local use (also re-exported above)
import {
  generateId,
  createDefaultProgression,
  getDefaultProgression,
  getProgressionById,
} from "./chordTypes";

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
  return (timeSig.beats * 4) / timeSig.beatUnit;
}

/**
 * Get the number of beat unit positions in a measure.
 * This is the numerator of the time signature (e.g., 6 in 6/8).
 * Used for chord cursor navigation where each beat unit is a position.
 */
export function getBeatUnitCount(timeSig: TimeSignature): number {
  return timeSig.beats;
}

/**
 * Get the duration of one beat unit in quarter notes.
 * e.g., 4/4 = 1.0 (quarter), 6/8 = 0.5 (eighth), 2/2 = 2.0 (half)
 */
export function getBeatUnitDuration(timeSig: TimeSignature): number {
  return 4 / timeSig.beatUnit;
}

// =============================================================================
// Lyrics
// =============================================================================

/** Syllabic type for lyrics (MusicXML compatible) */
export type SyllabicType = "single" | "begin" | "middle" | "end";

/** Lyric attached to a note */
export interface Lyric {
  /** The lyric text (syllable) */
  text: string;
  /** How this syllable relates to the word */
  syllabic?: SyllabicType;
  /** Number of additional notes this syllable extends over (melisma) */
  melismaLength?: number;
}

// =============================================================================
// Dynamics
// =============================================================================

/** Dynamic marking types */
export type DynamicType =
  | "ppp"
  | "pp"
  | "p"
  | "mp"
  | "mf"
  | "f"
  | "ff"
  | "fff"
  | "fp"
  | "sf"
  | "sfz";

/** Text dynamic marking (cresc., dim., etc.) */
export type DynamicTextType = "cresc." | "decresc." | "dim.";

/** Wedge (crescendo/decrescendo) marking */
export interface WedgeMark {
  /** Type of wedge */
  type: "crescendo" | "diminuendo";
  /** Whether this is the start or end of the wedge */
  position: "start" | "stop";
}

// =============================================================================
// Articulations
// =============================================================================

/** Articulation types (MusicXML compatible) */
export type ArticulationType =
  | "accent"
  | "strong-accent" // marcato
  | "staccato"
  | "staccatissimo"
  | "tenuto"
  | "detached-legato" // tenuto + staccato
  | "fermata";

// =============================================================================
// Note (Extended)
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
  /** Position within a triplet group (1-based, up to 6 for 2-beat groups) */
  tripletPosition?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Unique ID linking notes in the same triplet group */
  tripletGroupId?: string;

  // === Extended properties for tune composition ===

  /** Lyric syllable attached to this note */
  lyric?: Lyric;
  /** Dynamic marking at this note */
  dynamic?: DynamicType;
  /** Text dynamic marking (cresc., decresc., dim.) */
  dynamicText?: DynamicTextType;
  /** Wedge (crescendo/diminuendo) marking */
  wedge?: WedgeMark;
  /** Articulation marking */
  articulation?: ArticulationType;
  /** Expression text (tempo, character, technique markings) */
  expression?: string;
  /** Whether this note starts a slur */
  slurStart?: boolean;
  /** Whether this note ends a slur */
  slurEnd?: boolean;
  /** Slur placement (above or below the notes) */
  slurPlacement?: "above" | "below";
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
      | "lyric"
      | "dynamic"
      | "wedge"
      | "articulation"
      | "expression"
      | "slurStart"
      | "slurEnd"
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
  position: 1 | 2 | 3 | 4 | 5 | 6,
  tripletGroupId: string,
  options?: Partial<
    Pick<
      Note,
      "accidental" | "lyric" | "dynamic" | "articulation" | "expression"
    >
  >,
): Note {
  return createNote(midi, duration, {
    ...options,
    tripletPosition: position,
    tripletGroupId,
  });
}

/** Create a triplet rest (eighth or quarter) */
export function createTripletRest(
  position: 1 | 2 | 3 | 4 | 5 | 6,
  tripletGroupId: string,
  duration:
    | typeof DURATION.TRIPLET_EIGHTH
    | typeof DURATION.TRIPLET_QUARTER = DURATION.TRIPLET_EIGHTH,
): Note {
  return createTripletNote(null, duration, position, tripletGroupId);
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
  /** If true, this is a pickup (anacrusis) measure - partial measure before beat 1 */
  isPickup?: boolean;
  /** Optional tempo override for this measure (BPM). If undefined, inherits from previous measure or score default. */
  tempo?: number;
  /** Optional key signature override for this measure. If undefined, inherits from previous measure or score default. */
  keySignature?: KeySignature;
}

/**
 * Generate rests to fill a measure based on time signature.
 */
export function generateMeasureRests(timeSig: TimeSignature): Note[] {
  const totalBeats = getBeatsPerMeasure(timeSig);

  const standardDurations: DurationValue[] = [
    DURATION.WHOLE,
    DURATION.HALF,
    DURATION.QUARTER,
    DURATION.EIGHTH,
    DURATION.SIXTEENTH,
  ];

  if (standardDurations.includes(totalBeats as DurationValue)) {
    return [createRest(totalBeats as DurationValue)];
  }

  const beatUnitDuration = 4 / timeSig.beatUnit;
  if (standardDurations.includes(beatUnitDuration as DurationValue)) {
    const rests: Note[] = [];
    for (let i = 0; i < timeSig.beats; i++) {
      rests.push(createRest(beatUnitDuration as DurationValue));
    }
    return rests;
  }

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
// Score Display Settings
// =============================================================================

/** Display settings for score rendering */
export interface ScoreDisplaySettings {
  /** Whether to show chord symbols above the staff */
  showChordSymbols: boolean;
  /** ID of the active chord progression to display (undefined = default) */
  activeProgressionId?: string;
}

/** Default display settings */
export const DEFAULT_DISPLAY_SETTINGS: ScoreDisplaySettings = {
  showChordSymbols: true,
} as const;

/** Create display settings with optional overrides */
export function createDisplaySettings(
  options?: Partial<ScoreDisplaySettings>,
): ScoreDisplaySettings {
  return {
    ...DEFAULT_DISPLAY_SETTINGS,
    ...options,
  };
}

// =============================================================================
// Accompaniment Styles
// =============================================================================

/** Available accompaniment styles for chord playback */
export const ACCOMPANIMENT_STYLES = [
  "jazz-swing",
  "bossa-nova",
  "latin",
  "pop-rock",
  "ballad",
  "funk",
  "none",
] as const;

export type AccompanimentStyle = (typeof ACCOMPANIMENT_STYLES)[number];

/** Default accompaniment style */
export const DEFAULT_ACCOMPANIMENT_STYLE: AccompanimentStyle = "none";

/** Human-readable labels for accompaniment styles */
export const ACCOMPANIMENT_STYLE_LABELS: Record<AccompanimentStyle, string> = {
  "jazz-swing": "Jazz Swing",
  "bossa-nova": "Bossa Nova",
  latin: "Latin",
  "pop-rock": "Pop/Rock",
  ballad: "Ballad",
  funk: "Funk",
  none: "None",
};

/**
 * Check if a string is a valid accompaniment style.
 */
export function isValidAccompanimentStyle(
  value: string,
): value is AccompanimentStyle {
  return ACCOMPANIMENT_STYLES.includes(value as AccompanimentStyle);
}

// =============================================================================
// Playback Settings
// =============================================================================

/** Playback settings for a score */
export interface PlaybackSettings {
  /** Style of accompaniment for chord playback */
  accompanimentStyle: AccompanimentStyle;
  /** Whether to apply swing feel to playback */
  swingEnabled: boolean;
}

/** Default playback settings */
export const DEFAULT_PLAYBACK_SETTINGS: PlaybackSettings = {
  accompanimentStyle: DEFAULT_ACCOMPANIMENT_STYLE,
  swingEnabled: false,
} as const;

/** Create playback settings with optional overrides */
export function createPlaybackSettings(
  options?: Partial<PlaybackSettings>,
): PlaybackSettings {
  return {
    ...DEFAULT_PLAYBACK_SETTINGS,
    ...options,
  };
}

// =============================================================================
// Tune Composer Score
// =============================================================================

export interface TuneComposerScore {
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
  /** Chord progressions for accompaniment */
  chordProgressions: ChordProgression[];
  /** Display settings for rendering */
  displaySettings: ScoreDisplaySettings;
  /** Playback settings for audio */
  playbackSettings: PlaybackSettings;
  /** Creation timestamp */
  createdAt: string;
  /** Last modified timestamp */
  updatedAt: string;
  /** Source file if imported from MusicXML */
  importedFrom?: string;
  /** Duration of pickup measure in beats (undefined = no pickup) */
  pickupDuration?: number;
}

/** Default values for a new score */
export const DEFAULT_SCORE_VALUES = {
  title: "Untitled Tune",
  clef: "treble" as Clef,
  keySignature: 0 as KeySignature,
  timeSignature: { beats: 4, beatUnit: 4 } as TimeSignature,
  tempo: 120,
} as const;

/** Create a new empty score */
export function createScore(
  options?: Partial<TuneComposerScore>,
): TuneComposerScore {
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
    measures: [createMeasure(timeSig)],
    chordProgressions: [createDefaultProgression()],
    displaySettings: createDisplaySettings(options?.displaySettings),
    playbackSettings: createPlaybackSettings(options?.playbackSettings),
    createdAt: now,
    updatedAt: now,
    ...options,
  };
}

/**
 * Get the active chord progression for a score.
 * Returns the progression matching activeProgressionId, or the default progression.
 */
export function getActiveProgression(
  score: TuneComposerScore,
): ChordProgression | undefined {
  const { activeProgressionId } = score.displaySettings;
  if (activeProgressionId) {
    const found = getProgressionById(
      score.chordProgressions,
      activeProgressionId,
    );
    if (found) return found;
  }
  // Fall back to default progression, then to first progression
  return (
    getDefaultProgression(score.chordProgressions) || score.chordProgressions[0]
  );
}

// =============================================================================
// Cursor Position
// =============================================================================

export interface CursorPosition {
  /** Index of the current measure (0-based) */
  measureIndex: number;
  /** Index within the measure's notes array (0-based) */
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

export interface TuneComposerState {
  /** The score being edited */
  score: TuneComposerScore;
  /** Current cursor position */
  cursor: CursorPosition;
  /** Currently selected duration for new notes */
  selectedDuration: DurationValue;
  /** Whether dotted mode is active */
  dottedMode: boolean;
  /** Currently selected octave (MIDI note for C) */
  selectedOctave: number;
  /** Currently selected note (null if none selected) */
  selectedNoteId: string | null;
  /** Whether playback is active */
  isPlaying: boolean;
  /** Playback position */
  playbackPosition: CursorPosition | null;
  /** Dirty flag for unsaved changes */
  isDirty: boolean;
  /** Whether lyrics entry mode is active */
  lyricsMode: boolean;
  /** Cursor position for lyrics editing (index of selected note) */
  lyricsCursor: number | null;
  /** Whether slur editing mode is active */
  slurMode: boolean;
  /** Note ID where the currently active slur starts */
  activeSlurStartId: string | null;
  /** Note ID where the currently active slur ends */
  activeSlurEndId: string | null;
  /** Whether expression text mode is active */
  expressionMode: boolean;
  /** Whether dynamics mode is active */
  dynamicsMode: boolean;
  /** Whether wedge (crescendo/decrescendo) editing mode is active */
  wedgeMode: boolean;
  /** Type of wedge being edited */
  activeWedgeType: "crescendo" | "diminuendo" | null;
  /** Note ID where the currently active wedge starts */
  activeWedgeStartId: string | null;
  /** Whether chord entry mode is active */
  chordMode: boolean;
  /** Current position for chord editing (measure index and beat position) */
  chordCursor: { measureIndex: number; beatPosition: number } | null;
  /** Chord cursor subdivision: 1 = whole beats, 2 = half beats, 3 = triplets */
  chordSubdivision: 1 | 2 | 3;
}

/** Create initial composer state */
export function createInitialState(
  score?: TuneComposerScore,
): TuneComposerState {
  const actualScore = score || createScore();
  // Select the first note if one exists
  const firstNote = actualScore.measures[0]?.notes[0];
  return {
    score: actualScore,
    cursor: { ...DEFAULT_CURSOR },
    selectedDuration: DURATION.QUARTER,
    dottedMode: false,
    selectedOctave: DEFAULT_OCTAVE_MIDI[actualScore.clef],
    selectedNoteId: firstNote?.id ?? null,
    isPlaying: false,
    playbackPosition: null,
    isDirty: false,
    lyricsMode: false,
    lyricsCursor: null,
    slurMode: false,
    activeSlurStartId: null,
    activeSlurEndId: null,
    expressionMode: false,
    dynamicsMode: false,
    wedgeMode: false,
    activeWedgeType: null,
    activeWedgeStartId: null,
    chordMode: false,
    chordCursor: null,
    chordSubdivision: 1,
  };
}

// =============================================================================
// Validation
// =============================================================================

export interface MeasureValidation {
  isComplete: boolean;
  expectedDuration: number;
  actualDuration: number;
  difference: number;
}

export function validateMeasure(
  measure: Measure,
  timeSignature: TimeSignature,
): MeasureValidation {
  const expected = getBeatsPerMeasure(timeSignature);
  const actual = getMeasureDuration(measure);
  return {
    isComplete: Math.abs(actual - expected) < 0.001,
    expectedDuration: expected,
    actualDuration: actual,
    difference: actual - expected,
  };
}

export function wouldOverflow(
  measure: Measure,
  duration: DurationValue,
  timeSignature: TimeSignature,
  dotted?: boolean,
): boolean {
  const expected = getBeatsPerMeasure(timeSignature);
  const currentDuration = getMeasureDuration(measure);
  const newDuration = dotted ? duration * 1.5 : duration;
  return currentDuration + newDuration > expected + 0.001;
}

export function getBeatPositionAt(measure: Measure, noteIndex: number): number {
  let position = 0;
  for (let i = 0; i < noteIndex && i < measure.notes.length; i++) {
    position += getNoteDuration(measure.notes[i]);
  }
  return position;
}

// =============================================================================
// Rest Generation
// =============================================================================

export function generateRestsForDuration(duration: number): Note[] {
  const rests: Note[] = [];
  let remaining = duration;

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

export function getHalfMeasureBoundary(
  timeSignature: TimeSignature,
): number | null {
  const { beats, beatUnit } = timeSignature;
  const quarterNotesPerBeat = 4 / beatUnit;
  const totalQuarterNotes = beats * quarterNotesPerBeat;

  if (beats % 2 === 0 && beatUnit <= 4) {
    return totalQuarterNotes / 2;
  }

  return null;
}

export function generateRestsForDurationAtPosition(
  duration: number,
  startBeat: number,
  timeSignature: TimeSignature,
): Note[] {
  const tolerance = 0.001;
  const boundary = getHalfMeasureBoundary(timeSignature);

  if (boundary === null || startBeat < tolerance) {
    return generateRestsForDuration(duration);
  }

  const rests: Note[] = [];
  let currentBeat = startBeat;
  let remaining = duration;

  const durations: DurationValue[] = [
    DURATION.WHOLE,
    DURATION.HALF,
    DURATION.QUARTER,
    DURATION.EIGHTH,
    DURATION.SIXTEENTH,
  ];

  while (remaining > tolerance) {
    let bestDuration: DurationValue | null = null;

    for (const d of durations) {
      if (d > remaining + tolerance) continue;

      const atOrPastBoundary = currentBeat >= boundary - tolerance;
      const wouldCrossBoundary =
        !atOrPastBoundary && currentBeat + d > boundary + tolerance;

      if (wouldCrossBoundary) {
        continue;
      }

      bestDuration = d;
      break;
    }

    if (bestDuration === null) {
      bestDuration = DURATION.SIXTEENTH;
    }

    rests.push(createRest(bestDuration));
    remaining -= bestDuration;
    currentBeat += bestDuration;
  }

  return rests;
}

// =============================================================================
// Replace Operations
// =============================================================================

export interface ReplaceResult {
  notes: Note[];
  insertedIndex: number;
  overflowDuration: number;
}

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

  const notesBefore = measure.notes.slice(0, noteIndex);

  let currentBeat = startBeat;
  let consumeEndIndex = noteIndex;

  while (consumeEndIndex < measure.notes.length && currentBeat < endBeat) {
    currentBeat += getNoteDuration(measure.notes[consumeEndIndex]);
    consumeEndIndex++;
  }

  const notesAfter = measure.notes.slice(consumeEndIndex);
  const overflowDuration = Math.max(0, endBeat - measureDuration);
  const remainderDuration = currentBeat - endBeat;

  const newNotes: Note[] = [...notesBefore];

  const availableDuration = measureDuration - startBeat;
  if (newNoteDuration <= availableDuration) {
    newNotes.push(newNote);
  } else if (availableDuration > 0) {
    if (newNote.dotted && newNote.duration <= availableDuration) {
      newNotes.push({ ...newNote, dotted: undefined });
    } else {
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

  if (remainderDuration > 0 && overflowDuration === 0) {
    const remainderStartBeat = startBeat + newNoteDuration;
    const remainderRests = generateRestsForDurationAtPosition(
      remainderDuration,
      remainderStartBeat,
      timeSignature,
    );
    newNotes.push(...remainderRests);
  }

  newNotes.push(...notesAfter);

  return {
    notes: newNotes,
    insertedIndex: noteIndex,
    overflowDuration,
  };
}

// =============================================================================
// Utilities
// =============================================================================

// generateId is now exported from chordTypes.ts

export function formatTimeSignature(timeSig: TimeSignature): string {
  return `${timeSig.beats}/${timeSig.beatUnit}`;
}

export function formatDuration(duration: DurationValue): string {
  return DURATION_VALUE_TO_NAME[duration] || `${duration}`;
}

// =============================================================================
// Lyric Helpers
// =============================================================================

/**
 * Get all pitched notes (non-rests) from a score, flattened with their positions.
 * Used for lyrics cursor navigation.
 */
export function getPitchedNotes(score: TuneComposerScore): Array<{
  measureIndex: number;
  noteIndex: number;
  note: Note;
}> {
  const result: Array<{ measureIndex: number; noteIndex: number; note: Note }> =
    [];

  score.measures.forEach((measure, measureIndex) => {
    measure.notes.forEach((note, noteIndex) => {
      if (!isRest(note)) {
        result.push({ measureIndex, noteIndex, note });
      }
    });
  });

  return result;
}

/**
 * Find the next pitched note index after a given position.
 * Returns null if at the last pitched note.
 */
export function getNextPitchedNoteIndex(
  score: TuneComposerScore,
  currentFlatIndex: number,
): number | null {
  const pitched = getPitchedNotes(score);
  if (currentFlatIndex >= pitched.length - 1) {
    return null;
  }
  return currentFlatIndex + 1;
}

/**
 * Find the previous pitched note index before a given position.
 * Returns null if at the first pitched note.
 */
export function getPrevPitchedNoteIndex(
  currentFlatIndex: number,
): number | null {
  if (currentFlatIndex <= 0) {
    return null;
  }
  return currentFlatIndex - 1;
}
