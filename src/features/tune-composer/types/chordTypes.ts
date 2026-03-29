/**
 * Chord Types - Types and utilities for chord symbols and progressions
 *
 * Chords are stored as scale degrees (semitone offset from key root) rather than
 * absolute symbols. This enables automatic transposition when the key changes.
 *
 * Extracted from tuneComposerTypes.ts for maintainability.
 */

import type { KeySignature } from "./tuneComposerTypes";

// =============================================================================
// Utilities
// =============================================================================

/** Generate a unique ID for chord symbols and progressions */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// Key/Semitone Conversion
// =============================================================================

/**
 * Convert key signature (fifths) to root semitone (C=0, G=7, F=5, etc.)
 */
export function fifthsToSemitones(fifths: number): number {
  // Each step on circle of fifths = 7 semitones
  return (((fifths * 7) % 12) + 12) % 12;
}

/**
 * Note names for semitone values (sharp preference)
 */
const SEMITONE_TO_NOTE_SHARP = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

/**
 * Note names for semitone values (flat preference)
 */
const SEMITONE_TO_NOTE_FLAT = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

/**
 * Convert note name to semitone (C=0)
 */
const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  "E#": 5,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
  Cb: 11,
  "B#": 0,
};

// =============================================================================
// Chord Symbols
// =============================================================================

/**
 * A chord symbol placed at a specific position in the score.
 *
 * Chords are stored as SCALE DEGREES relative to the score's key signature.
 * - rootOffset: semitones (0-11) from the key root to the chord root
 * - quality: the chord type (e.g., "maj7", "m7", "7")
 * - bassOffset: for slash chords, semitones from key root to bass note
 *
 * This allows automatic transposition: when the key changes, chords auto-resolve
 * to the correct notes without modifying storage.
 */
export interface ChordSymbol {
  /** Unique identifier */
  id: string;
  /** Semitones (0-11) from the key root to the chord root */
  rootOffset: number;
  /** Chord quality/type (e.g., "maj7", "m7", "7", "dim7") */
  quality: string;
  /** Alterations like "b9", "#11" (stored separately for precision) */
  alterations: string[];
  /** For slash chords: semitones (0-11) from key root to bass note */
  bassOffset?: number;
  /** Beat position within the measure (0 = beat 1, 0.5 = "and" of 1, etc.) */
  beatPosition: number;
  /** Measure index (0-based) */
  measureIndex: number;
  /** Optional pre-resolved symbol string (from API inference) */
  symbol?: string;
}

/**
 * Parse a chord root note and return its semitone value (0-11)
 */
function parseRootSemitone(
  symbol: string,
): { root: string; semitone: number; rest: string } | null {
  // Match root note at start: A-G with optional # or b
  const match = symbol.match(/^([A-Ga-g])([#b]?)/);
  if (!match) return null;

  const root = match[1].toUpperCase() + match[2];
  const semitone = NOTE_TO_SEMITONE[root];
  if (semitone === undefined) return null;

  return { root, semitone, rest: symbol.slice(match[0].length) };
}

/**
 * Quality mapping for common chord suffixes
 */
const QUALITY_MAP: Record<string, { quality: string; alterations: string[] }> =
  {
    "": { quality: "major", alterations: [] },
    maj: { quality: "major", alterations: [] },
    M: { quality: "major", alterations: [] },
    m: { quality: "minor", alterations: [] },
    min: { quality: "minor", alterations: [] },
    "-": { quality: "minor", alterations: [] },
    dim: { quality: "dim", alterations: [] },
    o: { quality: "dim", alterations: [] },
    aug: { quality: "aug", alterations: [] },
    "+": { quality: "aug", alterations: [] },
    sus4: { quality: "sus4", alterations: [] },
    sus2: { quality: "sus2", alterations: [] },
    sus: { quality: "sus4", alterations: [] },
    "6": { quality: "6", alterations: [] },
    "7": { quality: "7", alterations: [] },
    maj7: { quality: "maj7", alterations: [] },
    M7: { quality: "maj7", alterations: [] },
    Δ7: { quality: "maj7", alterations: [] },
    Δ: { quality: "maj7", alterations: [] },
    m7: { quality: "m7", alterations: [] },
    min7: { quality: "m7", alterations: [] },
    "-7": { quality: "m7", alterations: [] },
    dim7: { quality: "dim7", alterations: [] },
    o7: { quality: "dim7", alterations: [] },
    m7b5: { quality: "m7b5", alterations: [] },
    ø: { quality: "m7b5", alterations: [] },
    ø7: { quality: "m7b5", alterations: [] },
    "7b5": { quality: "7", alterations: ["b5"] },
    "7#5": { quality: "7", alterations: ["#5"] },
    "7b9": { quality: "7", alterations: ["b9"] },
    "7#9": { quality: "7", alterations: ["#9"] },
    "7alt": { quality: "7alt", alterations: [] },
    "7sus4": { quality: "7sus4", alterations: [] },
    "7sus2": { quality: "7sus2", alterations: [] },
    "7sus": { quality: "7sus4", alterations: [] },
    "9": { quality: "9", alterations: [] },
    maj9: { quality: "maj9", alterations: [] },
    m9: { quality: "m9", alterations: [] },
    "11": { quality: "11", alterations: [] },
    "13": { quality: "13", alterations: [] },
    add9: { quality: "add9", alterations: [] },
    "6/9": { quality: "6/9", alterations: [] },
  };

/**
 * Quality to display suffix mapping
 */
const QUALITY_TO_SUFFIX: Record<string, string> = {
  major: "",
  minor: "m",
  dim: "dim",
  aug: "aug",
  sus4: "sus4",
  sus2: "sus2",
  "6": "6",
  "7": "7",
  maj7: "maj7",
  m7: "m7",
  dim7: "dim7",
  m7b5: "m7b5",
  "7alt": "7alt",
  "7sus4": "7sus4",
  "7sus2": "7sus2",
  "9": "9",
  maj9: "maj9",
  m9: "m9",
  "11": "11",
  "13": "13",
  add9: "add9",
  "6/9": "6/9",
};

/**
 * Parse a chord symbol string into a relative ChordSymbol.
 *
 * @param symbol - The chord symbol string (e.g., "Cmaj7", "F/A")
 * @param keyFifths - The key signature (circle of fifths)
 * @param measureIndex - Measure index for the chord
 * @param beatPosition - Beat position within the measure
 * @returns A ChordSymbol with rootOffset relative to the key
 */
export function parseChordToRelative(
  symbol: string,
  keyFifths: KeySignature,
  measureIndex: number,
  beatPosition: number = 0,
): ChordSymbol | null {
  const trimmed = symbol.trim();
  if (!trimmed) return null;

  // Check for slash chord
  const slashIndex = trimmed.indexOf("/");
  let mainPart = trimmed;
  let bassPart: string | null = null;

  if (slashIndex > 0) {
    mainPart = trimmed.slice(0, slashIndex);
    bassPart = trimmed.slice(slashIndex + 1);
  }

  // Parse root
  const rootInfo = parseRootSemitone(mainPart);
  if (!rootInfo) return null;

  // Parse quality/suffix
  const suffix = rootInfo.rest;
  const qualityInfo = QUALITY_MAP[suffix] ?? {
    quality: suffix || "major",
    alterations: [],
  };

  // Calculate rootOffset relative to key
  const keySemitone = fifthsToSemitones(keyFifths);
  const rootOffset = (((rootInfo.semitone - keySemitone) % 12) + 12) % 12;

  // Parse bass if present
  let bassOffset: number | undefined;
  if (bassPart) {
    const bassInfo = parseRootSemitone(bassPart);
    if (bassInfo) {
      bassOffset = (((bassInfo.semitone - keySemitone) % 12) + 12) % 12;
    }
  }

  return {
    id: generateId(),
    rootOffset,
    quality: qualityInfo.quality,
    alterations: qualityInfo.alterations,
    bassOffset,
    beatPosition,
    measureIndex,
  };
}

/**
 * Resolve a ChordSymbol to a display string for a given key.
 *
 * @param chord - The chord with relative offsets
 * @param keyFifths - The key signature to resolve in
 * @param preferFlats - Whether to prefer flats over sharps
 * @returns The resolved chord symbol string (e.g., "Cmaj7")
 */
export function resolveChordSymbol(
  chord: ChordSymbol,
  keyFifths: KeySignature,
  preferFlats?: boolean,
): string {
  // If chord has a pre-resolved symbol (from API), use it directly
  if (chord.symbol) {
    return chord.symbol;
  }

  const keySemitone = fifthsToSemitones(keyFifths);
  const rootSemitone = (keySemitone + chord.rootOffset) % 12;

  // Determine sharp/flat preference based on key if not specified
  const useFlats = preferFlats ?? keyFifths < 0;
  const noteNames = useFlats ? SEMITONE_TO_NOTE_FLAT : SEMITONE_TO_NOTE_SHARP;

  const rootName = noteNames[rootSemitone];
  const suffix = QUALITY_TO_SUFFIX[chord.quality] ?? chord.quality;
  const alterations = (chord.alterations || []).join("");

  let result = rootName + suffix + alterations;

  // Add bass note for slash chords
  if (chord.bassOffset !== undefined) {
    const bassSemitone = (keySemitone + chord.bassOffset) % 12;
    const bassName = noteNames[bassSemitone];
    result += "/" + bassName;
  }

  return result;
}

/**
 * Create a new chord symbol with relative offsets.
 *
 * @param symbol - The chord symbol string
 * @param keyFifths - The key signature
 * @param measureIndex - Measure index
 * @param beatPosition - Beat position
 * @returns A ChordSymbol or null if parsing fails
 */
export function createChordSymbol(
  symbol: string,
  keyFifths: KeySignature,
  measureIndex: number,
  beatPosition: number = 0,
): ChordSymbol | null {
  return parseChordToRelative(symbol, keyFifths, measureIndex, beatPosition);
}

/**
 * Create a chord symbol with direct offset values (for internal use).
 */
export function createChordSymbolDirect(
  rootOffset: number,
  quality: string,
  measureIndex: number,
  beatPosition: number = 0,
  alterations: string[] = [],
  bassOffset?: number,
): ChordSymbol {
  return {
    id: generateId(),
    rootOffset: ((rootOffset % 12) + 12) % 12,
    quality,
    alterations,
    bassOffset,
    beatPosition,
    measureIndex,
  };
}

/**
 * Get all chord symbols for a specific measure.
 * Returns chords sorted by beat position.
 */
export function getChordsForMeasure(
  chords: ChordSymbol[],
  measureIndex: number,
): ChordSymbol[] {
  return chords
    .filter((chord) => chord.measureIndex === measureIndex)
    .sort((a, b) => a.beatPosition - b.beatPosition);
}

/**
 * Find a chord symbol at a specific position.
 * Returns undefined if no chord exists at that exact position.
 */
export function findChordAtPosition(
  chords: ChordSymbol[],
  measureIndex: number,
  beatPosition: number,
): ChordSymbol | undefined {
  return chords.find(
    (chord) =>
      chord.measureIndex === measureIndex &&
      chord.beatPosition === beatPosition,
  );
}

/**
 * Get the active chord at a given beat position.
 * Returns the most recent chord at or before the given position.
 * Searches backwards through measures if needed.
 */
export function getActiveChordAtPosition(
  chords: ChordSymbol[],
  measureIndex: number,
  beatPosition: number,
): ChordSymbol | undefined {
  // First, look for chords in the current measure at or before the position
  const currentMeasureChords = getChordsForMeasure(chords, measureIndex);
  const chordsBeforePosition = currentMeasureChords.filter(
    (chord) => chord.beatPosition <= beatPosition,
  );

  if (chordsBeforePosition.length > 0) {
    // Return the last chord at or before this position
    return chordsBeforePosition[chordsBeforePosition.length - 1];
  }

  // Look backwards through previous measures
  for (let m = measureIndex - 1; m >= 0; m--) {
    const prevMeasureChords = getChordsForMeasure(chords, m);
    if (prevMeasureChords.length > 0) {
      // Return the last chord in that measure
      return prevMeasureChords[prevMeasureChords.length - 1];
    }
  }

  // No chord found
  return undefined;
}

// =============================================================================
// Chord Progressions
// =============================================================================

/** Preset names for chord progressions */
export const PROGRESSION_PRESET_NAMES = [
  "Default",
  "Reharmonization",
  "Simplified",
  "Modal",
  "Blues Changes",
  "Bird Changes",
] as const;

export type ProgressionPresetName = (typeof PROGRESSION_PRESET_NAMES)[number];

/**
 * A named chord progression for a tune.
 * Supports multiple progressions per score (default, alternates, auto-inferred).
 */
export interface ChordProgression {
  /** Unique identifier */
  id: string;
  /** Display name (e.g., "Default", "Reharmonization", "Blues Changes") */
  name: string;
  /** Whether this is the default progression for playback */
  isDefault: boolean;
  /** Whether this progression was auto-inferred from melody analysis */
  isAutoInferred?: boolean;
  /** Whether this is a system-defined progression (read-only for users) */
  isSystemDefined?: boolean;
  /** Chord symbols in this progression */
  chords: ChordSymbol[];
}

/**
 * Create a new chord progression with unique ID.
 */
export function createChordProgression(
  name: string,
  options?: Partial<
    Pick<ChordProgression, "isDefault" | "isAutoInferred" | "isSystemDefined">
  >,
): ChordProgression {
  return {
    id: generateId(),
    name,
    isDefault: options?.isDefault ?? false,
    isAutoInferred: options?.isAutoInferred,
    isSystemDefined: options?.isSystemDefined,
    chords: [],
  };
}

/**
 * Create a default empty progression.
 */
export function createDefaultProgression(): ChordProgression {
  return createChordProgression("Default", { isDefault: true });
}

/**
 * Duplicate a chord progression with a new ID and name.
 * The duplicate is always user-editable (not system-defined).
 */
export function duplicateProgression(
  source: ChordProgression,
  newName?: string,
): ChordProgression {
  const name = newName ?? `${source.name} (Copy)`;
  return {
    id: generateId(),
    name,
    isDefault: false, // Duplicates are never default
    isAutoInferred: false, // Duplicates are not auto-inferred
    isSystemDefined: false, // Duplicates are always user-editable
    chords: source.chords.map((chord) => ({
      ...chord,
      id: generateId(), // New IDs for all chords
    })),
  };
}

/**
 * Get the default progression from a list of progressions.
 * Returns undefined if no default is found.
 */
export function getDefaultProgression(
  progressions: ChordProgression[],
): ChordProgression | undefined {
  return progressions.find((p) => p.isDefault);
}

/**
 * Get a progression by ID.
 */
export function getProgressionById(
  progressions: ChordProgression[],
  id: string,
): ChordProgression | undefined {
  return progressions.find((p) => p.id === id);
}

/**
 * Check if a progression is editable by the user.
 * System-defined progressions are read-only.
 */
export function isProgressionEditable(progression: ChordProgression): boolean {
  return progression.isSystemDefined !== true;
}

/**
 * Check if a progression can be deleted by the user.
 * System-defined progressions cannot be deleted.
 */
export function isProgressionDeletable(progression: ChordProgression): boolean {
  return progression.isSystemDefined !== true;
}

/**
 * Add a chord to a progression at the specified position.
 * Returns a new progression with the chord added.
 */
export function addChordToProgression(
  progression: ChordProgression,
  chord: ChordSymbol,
): ChordProgression {
  // Remove any existing chord at the same position
  const filteredChords = progression.chords.filter(
    (c) =>
      c.measureIndex !== chord.measureIndex ||
      c.beatPosition !== chord.beatPosition,
  );
  return {
    ...progression,
    chords: [...filteredChords, chord].sort((a, b) => {
      if (a.measureIndex !== b.measureIndex) {
        return a.measureIndex - b.measureIndex;
      }
      return a.beatPosition - b.beatPosition;
    }),
  };
}

/**
 * Remove a chord from a progression by ID.
 * Returns a new progression with the chord removed.
 */
export function removeChordFromProgression(
  progression: ChordProgression,
  chordId: string,
): ChordProgression {
  return {
    ...progression,
    chords: progression.chords.filter((c) => c.id !== chordId),
  };
}

/**
 * Update a chord in a progression.
 * Returns a new progression with the chord updated.
 */
export function updateChordInProgression(
  progression: ChordProgression,
  chordId: string,
  updates: Partial<
    Pick<
      ChordSymbol,
      | "rootOffset"
      | "quality"
      | "alterations"
      | "bassOffset"
      | "beatPosition"
      | "measureIndex"
    >
  >,
): ChordProgression {
  return {
    ...progression,
    chords: progression.chords.map((c) =>
      c.id === chordId ? { ...c, ...updates } : c,
    ),
  };
}
