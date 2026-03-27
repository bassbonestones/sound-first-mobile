/**
 * Chord Types - Types and utilities for chord symbols and progressions
 *
 * Extracted from tuneComposerTypes.ts for maintainability.
 */

// =============================================================================
// Utilities
// =============================================================================

/** Generate a unique ID for chord symbols and progressions */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// Chord Symbols
// =============================================================================

/**
 * A chord symbol placed at a specific position in the score.
 * Chord symbols are authored in C and transposed on-demand.
 */
export interface ChordSymbol {
  /** Unique identifier */
  id: string;
  /** The chord symbol string (e.g., "Cmaj7", "Dm7b5", "G7#9") */
  symbol: string;
  /** Beat position within the measure (0 = beat 1, 0.5 = "and" of 1, etc.) */
  beatPosition: number;
  /** Measure index (0-based) */
  measureIndex: number;
}

/**
 * Create a new chord symbol with unique ID.
 */
export function createChordSymbol(
  symbol: string,
  measureIndex: number,
  beatPosition: number = 0,
): ChordSymbol {
  return {
    id: generateId(),
    symbol,
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
    Pick<ChordSymbol, "symbol" | "beatPosition" | "measureIndex">
  >,
): ChordProgression {
  return {
    ...progression,
    chords: progression.chords.map((c) =>
      c.id === chordId ? { ...c, ...updates } : c,
    ),
  };
}
