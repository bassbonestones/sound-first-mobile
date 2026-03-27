/**
 * Generation Preview Constants
 *
 * Constants, types, and helper functions for the content generation engine.
 * Used by both GeneratorModeContent and useGeneratorMode.
 */
import type {
  GenerationType,
  ScaleType,
  ArpeggioType,
  ScalePattern,
  ArpeggioPattern,
  RhythmType,
  MusicalKey,
} from "../../../api/generation";
import type { ClefType } from "../../../utils/generationNotation";

// =============================================================================
// Types
// =============================================================================

/** Pattern constraints - patterns with limits on octaves or scale compatibility */
export interface PatternConstraints {
  maxOctaves?: number;
  chromaticMaxOctaves?: number; // Override maxOctaves specifically for chromatic scale
  requiresSymmetric?: boolean; // If true, incompatible with asymmetric scales
  blockedScaleTypes?: string[]; // Scale types that cannot use this pattern
  onlyForScaleTypes?: string[]; // If set, pattern only available for these scales
  chromaticDisplayName?: string; // Display name when applied to chromatic scale
  pentatonicDisplayName?: string; // Display name for 5-note scales (pentatonic)
  hexatonicDisplayName?: string; // Display name for 6-note scales (blues, whole tone)
  octatonicDisplayName?: string; // Display name for 8-note scales (diminished, bebop)
  minScaleNotes?: number; // Minimum notes per octave required for this pattern
}

/** Randomization toggle state */
export interface RandomizeState {
  scaleType: boolean;
  arpeggioType: boolean;
  scalePattern: boolean;
  arpeggioPattern: boolean;
  rhythmType: boolean;
  rootKey: boolean;
  startOctave: boolean;
  numOctaves: boolean;
  clef: boolean;
}

// =============================================================================
// Scale Categories
// =============================================================================

/** Scales with 5 notes per octave */
export const PENTATONIC_SCALES: ScaleType[] = [
  "pentatonic_major",
  "pentatonic_minor",
];

/** Scales with 6 notes per octave */
export const HEXATONIC_SCALES: ScaleType[] = [
  "blues",
  "blues_major",
  "whole_tone",
];

/** Scales with 8 notes per octave */
export const OCTATONIC_SCALES: ScaleType[] = [
  "diminished_hw",
  "diminished_wh",
  "bebop_dominant",
  "bebop_major",
  "bebop_dorian",
];

/** Scales with more than 7 notes per octave (can use extended patterns) */
export const EXTENDED_SCALES: ScaleType[] = [
  "chromatic", // 12 notes
  "diminished_hw", // 8 notes
  "diminished_wh", // 8 notes
  "bebop_dominant", // 8 notes
  "bebop_major", // 8 notes
  "bebop_dorian", // 8 notes
];

/** Asymmetric scales (different pitches ascending vs descending) */
export const ASYMMETRIC_SCALES: ScaleType[] = ["melodic_minor_classical"];

// =============================================================================
// Scale Pattern Constraints
// =============================================================================

export const SCALE_PATTERN_CONSTRAINTS: Record<string, PatternConstraints> = {
  // Interval patterns - use "Skip X" naming for non-heptatonic scales
  in_3rds: {
    chromaticDisplayName: "Chromatic Major 2nds",
    pentatonicDisplayName: "Skip 1",
    hexatonicDisplayName: "Skip 1",
    octatonicDisplayName: "Skip 1",
  },
  in_4ths: {
    chromaticDisplayName: "Chromatic minor 3rds",
    pentatonicDisplayName: "Skip 2",
    hexatonicDisplayName: "Skip 2",
    octatonicDisplayName: "Skip 2",
  },
  in_5ths: {
    maxOctaves: 2,
    chromaticDisplayName: "Chromatic Major 3rds",
    pentatonicDisplayName: "Skip 3",
    hexatonicDisplayName: "Skip 3",
    octatonicDisplayName: "Skip 3",
  },
  in_6ths: {
    maxOctaves: 2,
    chromaticDisplayName: "Chromatic Perfect 4ths",
    hexatonicDisplayName: "Skip 4",
    octatonicDisplayName: "Skip 4",
    minScaleNotes: 6,
  },
  in_7ths: {
    maxOctaves: 2,
    chromaticDisplayName: "Chromatic Tritones",
    octatonicDisplayName: "Skip 5",
    minScaleNotes: 7,
  },
  in_8ths: {
    maxOctaves: 2,
    chromaticDisplayName: "Chromatic Perfect 5ths",
    octatonicDisplayName: "Skip 6",
    minScaleNotes: 8,
  },
  in_octaves: {
    blockedScaleTypes: ["chromatic"],
  },
  // Extended intervals - chromatic only
  in_9ths: {
    onlyForScaleTypes: ["chromatic"],
    chromaticDisplayName: "Chromatic minor 6ths",
  },
  in_10ths: {
    onlyForScaleTypes: ["chromatic"],
    chromaticDisplayName: "Chromatic Major 6ths",
  },
  in_11ths: {
    onlyForScaleTypes: ["chromatic"],
    chromaticDisplayName: "Chromatic minor 7ths",
  },
  in_12ths: {
    onlyForScaleTypes: ["chromatic"],
    chromaticDisplayName: "Chromatic Major 7ths",
  },
  in_13ths: {
    onlyForScaleTypes: ["chromatic"],
    chromaticDisplayName: "Chromatic Octaves",
  },
  // Large group patterns
  groups_of_3: { chromaticMaxOctaves: 2 },
  groups_of_4: { chromaticMaxOctaves: 2 },
  groups_of_5: { maxOctaves: 2, chromaticMaxOctaves: 1 },
  groups_of_6: { maxOctaves: 2, chromaticMaxOctaves: 1 },
  groups_of_7: { maxOctaves: 2, chromaticMaxOctaves: 1 },
  groups_of_8: {
    maxOctaves: 2,
    chromaticMaxOctaves: 1,
    onlyForScaleTypes: [
      "chromatic",
      "diminished_hw",
      "diminished_wh",
      "bebop_dominant",
      "bebop_major",
      "bebop_dorian",
    ],
  },
  groups_of_9: {
    maxOctaves: 2,
    chromaticMaxOctaves: 1,
    onlyForScaleTypes: ["chromatic"],
  },
  groups_of_10: {
    maxOctaves: 2,
    chromaticMaxOctaves: 1,
    onlyForScaleTypes: ["chromatic"],
  },
  groups_of_11: {
    maxOctaves: 2,
    chromaticMaxOctaves: 1,
    onlyForScaleTypes: ["chromatic"],
  },
  groups_of_12: {
    maxOctaves: 2,
    chromaticMaxOctaves: 1,
    onlyForScaleTypes: ["chromatic"],
  },
  // Diatonic chord patterns
  diatonic_triads: {
    maxOctaves: 2,
    blockedScaleTypes: ["chromatic", "whole_tone"],
  },
  diatonic_7ths: {
    maxOctaves: 2,
    blockedScaleTypes: ["chromatic", "whole_tone"],
  },
  broken_chords: {
    maxOctaves: 2,
    blockedScaleTypes: ["chromatic", "whole_tone"],
  },
  // Special patterns
  broken_thirds_neighbor: {
    maxOctaves: 1,
    requiresSymmetric: true,
    blockedScaleTypes: ["chromatic"],
  },
  // Pyramid patterns
  pyramid_ascend: { maxOctaves: 1 },
  pyramid_descend: { maxOctaves: 1 },
};

// =============================================================================
// Option Lists
// =============================================================================

export const GENERATION_TYPES: GenerationType[] = ["scale", "arpeggio", "lick"];

export const SCALE_TYPES: ScaleType[] = [
  // Major modes
  "ionian",
  "dorian",
  "phrygian",
  "lydian",
  "mixolydian",
  "aeolian",
  "locrian",
  // Pentatonic & Blues
  "pentatonic_major",
  "pentatonic_minor",
  "blues",
  "blues_major",
  // Harmonic minor modes
  "harmonic_minor",
  "phrygian_dominant",
  "lydian_sharp2",
  // Melodic minor modes
  "melodic_minor",
  "melodic_minor_classical",
  "lydian_augmented",
  "lydian_dominant",
  "mixolydian_flat6",
  "altered",
  // Harmonic major
  "harmonic_major",
  // Symmetric
  "whole_tone",
  "diminished_hw",
  "diminished_wh",
  "chromatic",
  // Bebop
  "bebop_dominant",
  "bebop_major",
  "bebop_dorian",
];

export const ARPEGGIO_TYPES: ArpeggioType[] = [
  // Triads
  "major",
  "minor",
  "augmented",
  "diminished",
  "sus4",
  "sus2",
  // 7th chords
  "maj7",
  "dom7",
  "min7",
  "min_maj7",
  "half_dim7",
  "dim7",
  "aug_maj7",
  "aug7",
  "dom7sus4",
  // Extended
  "maj9",
  "dom9",
  "min9",
];

export const SCALE_PATTERNS: ScalePattern[] = [
  // Basic
  "straight_up",
  "straight_down",
  "straight_up_down",
  "straight_down_up",
  // Pyramid
  "pyramid_ascend",
  "pyramid_descend",
  // Intervals
  "in_3rds",
  "in_4ths",
  "in_5ths",
  "in_6ths",
  "in_7ths",
  "in_8ths",
  "in_octaves",
  "in_9ths",
  "in_10ths",
  "in_11ths",
  "in_12ths",
  "in_13ths",
  // Groups
  "groups_of_3",
  "groups_of_4",
  "groups_of_5",
  "groups_of_6",
  "groups_of_7",
  "groups_of_8",
  "groups_of_9",
  "groups_of_10",
  "groups_of_11",
  "groups_of_12",
  // Weaving
  "broken_thirds_neighbor",
  // Arpeggio-based
  "diatonic_triads",
  "diatonic_7ths",
  "broken_chords",
];

export const ARPEGGIO_PATTERNS: ArpeggioPattern[] = [
  "straight_up",
  "straight_down",
  "straight_up_down",
  "weaving_ascend",
  "weaving_descend",
  "broken_skip_1",
  "inversion_root",
  "inversion_1st",
  "inversion_2nd",
  "inversion_3rd",
  "rolling_alberti",
  "spread_voicings",
  "approach_notes",
  "enclosures",
];

export const RHYTHM_TYPES: RhythmType[] = [
  // Sustained
  "whole_notes",
  "half_notes",
  // Pulse
  "quarter_notes",
  // Subdivisions
  "eighth_notes",
  "sixteenth_notes",
  // Triplets
  "eighth_triplets",
  // Swing
  "swing_eighths",
  "scotch_snap",
  // Dotted
  "dotted_quarter_eighth",
  "dotted_eighth_sixteenth",
  // Compound
  "sixteenth_eighth_sixteenth",
  "eighth_sixteenth_sixteenth",
  "sixteenth_sixteenth_eighth",
  "syncopated",
];

export const ROOT_KEYS: MusicalKey[] = [
  "C",
  "C#",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

/** Simplified key list for tune transposition (no enharmonic duplicates) */
export const TUNE_KEYS: MusicalKey[] = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

export const OCTAVES = [1, 2, 3, 4, 5, 6, 7] as const;

export const CLEFS: ClefType[] = ["treble", "bass"];

// =============================================================================
// Display Labels
// =============================================================================

export const RHYTHM_DISPLAY_LABELS: Record<RhythmType, string> = {
  quarter_notes: "Quarter Notes",
  eighth_notes: "Eighth Notes",
  eighth_triplets: "Eighth Triplets",
  swing_eighths: "Swung Eighths",
  whole_notes: "Whole Notes",
  half_notes: "Half Notes",
  sixteenth_notes: "Sixteenth Notes",
  scotch_snap: "Scotch Snap",
  dotted_quarter_eighth: "Dotted Quarter-Eighth",
  dotted_eighth_sixteenth: "Dotted Eighth-Sixteenth",
  sixteenth_eighth_sixteenth: "16th-8th-16th",
  eighth_sixteenth_sixteenth: "8th-16th-16th",
  sixteenth_sixteenth_eighth: "16th-16th-8th",
  syncopated: "Syncopated",
};

// =============================================================================
// Rhythm-Pattern Compatibility
// =============================================================================

/** Patterns that allow WHOLE_NOTES rhythm */
export const WHOLE_NOTE_PATTERNS: Set<ScalePattern> = new Set([
  "straight_up",
  "straight_down",
]);

/** Patterns that allow HALF_NOTES rhythm */
export const HALF_NOTE_PATTERNS: Set<ScalePattern> = new Set([
  "straight_up",
  "straight_down",
  "straight_up_down",
  "straight_down_up",
]);

// =============================================================================
// Helper Functions
// =============================================================================

/** Pick a random item from an array */
export function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Get the number of notes per octave for a scale type */
export function getScaleNoteCount(scaleType: ScaleType): number {
  if (PENTATONIC_SCALES.includes(scaleType)) return 5;
  if (HEXATONIC_SCALES.includes(scaleType)) return 6;
  if (OCTATONIC_SCALES.includes(scaleType)) return 8;
  if (scaleType === "chromatic") return 12;
  return 7; // Standard heptatonic
}

/** Format scale type for display, adding common name aliases */
export function formatScaleLabel(scaleType: ScaleType): string {
  const labels: Partial<Record<ScaleType, string>> = {
    ionian: "Ionian (Major)",
    aeolian: "Aeolian (Natural Minor)",
    melodic_minor: "Minor-Major",
    melodic_minor_classical: "Melodic Minor (Classical)",
    harmonic_major: "Harmonic Major (b6)",
    mixolydian_flat6: "Major-Minor (b6 b7)",
    blues_major: "Blues Major",
    phrygian_dominant: "Phrygian Dominant (Spanish)",
    lydian_dominant: "Lydian Dominant",
    lydian_augmented: "Lydian Augmented",
    altered: "Altered (Super Locrian)",
    diminished_hw: "Diminished (Half-Whole)",
    diminished_wh: "Diminished (Whole-Half)",
    bebop_dominant: "Bebop Dominant",
    bebop_major: "Bebop Major",
    bebop_dorian: "Bebop Dorian",
    lydian_sharp2: "Lydian #2",
  };
  return (
    labels[scaleType] ??
    scaleType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

/** Format arpeggio type for display */
export function formatArpeggioLabel(arpeggioType: ArpeggioType): string {
  const labels: Partial<Record<ArpeggioType, string>> = {
    maj7: "Major 7",
    dom7: "Dominant 7",
    min7: "Minor 7",
    min_maj7: "Minor-Major 7",
    half_dim7: "Half-Diminished 7",
    dim7: "Diminished 7",
    aug_maj7: "Augmented Major 7",
    aug7: "Augmented 7",
    dom7sus4: "Dominant 7 sus4",
    maj9: "Major 9",
    dom9: "Dominant 9",
    min9: "Minor 9",
    sus4: "Suspended 4th",
    sus2: "Suspended 2nd",
  };
  return (
    labels[arpeggioType] ??
    arpeggioType.charAt(0).toUpperCase() + arpeggioType.slice(1)
  );
}

/** Format scale pattern for display, using scale-specific names when applicable */
export function formatScalePatternLabel(
  pattern: ScalePattern,
  scaleType?: ScaleType,
): string {
  // Check for scale-type-specific display names
  if (scaleType) {
    const constraints = SCALE_PATTERN_CONSTRAINTS[pattern];
    if (constraints) {
      if (scaleType === "chromatic" && constraints.chromaticDisplayName) {
        return constraints.chromaticDisplayName;
      }
      if (
        PENTATONIC_SCALES.includes(scaleType) &&
        constraints.pentatonicDisplayName
      ) {
        return constraints.pentatonicDisplayName;
      }
      if (
        HEXATONIC_SCALES.includes(scaleType) &&
        constraints.hexatonicDisplayName
      ) {
        return constraints.hexatonicDisplayName;
      }
      if (
        OCTATONIC_SCALES.includes(scaleType) &&
        constraints.octatonicDisplayName
      ) {
        return constraints.octatonicDisplayName;
      }
    }
  }

  const labels: Partial<Record<ScalePattern, string>> = {
    straight_up: "Straight Up",
    straight_down: "Straight Down",
    straight_up_down: "Up & Down",
    straight_down_up: "Down & Up",
    pyramid_ascend: "Pyramid Ascend",
    pyramid_descend: "Pyramid Descend",
    in_3rds: "In 3rds",
    in_4ths: "In 4ths",
    in_5ths: "In 5ths",
    in_6ths: "In 6ths",
    in_7ths: "In 7ths",
    in_8ths: "In 8ths",
    in_octaves: "In Octaves",
    in_9ths: "In 9ths",
    in_10ths: "In 10ths",
    in_11ths: "In 11ths",
    in_12ths: "In 12ths",
    in_13ths: "In 13ths",
    groups_of_3: "Groups of 3",
    groups_of_4: "Groups of 4",
    groups_of_5: "Groups of 5",
    groups_of_6: "Groups of 6",
    groups_of_7: "Groups of 7",
    groups_of_8: "Groups of 8",
    groups_of_9: "Groups of 9",
    groups_of_10: "Groups of 10",
    groups_of_11: "Groups of 11",
    groups_of_12: "Groups of 12",
    broken_thirds_neighbor: "Broken 3rds w/ Neighbor",
    diatonic_triads: "Diatonic Triads",
    diatonic_7ths: "Diatonic 7ths",
    broken_chords: "Broken Chords",
  };
  return labels[pattern] ?? pattern.replace(/_/g, " ");
}

/** Format arpeggio pattern for display */
export function formatArpeggioPatternLabel(pattern: ArpeggioPattern): string {
  const labels: Partial<Record<ArpeggioPattern, string>> = {
    straight_up: "Straight Up",
    straight_down: "Straight Down",
    straight_up_down: "Up & Down",
    weaving_ascend: "Weaving Ascend",
    weaving_descend: "Weaving Descend",
    broken_skip_1: "Broken (Skip 1)",
    inversion_root: "Root Position",
    inversion_1st: "1st Inversion",
    inversion_2nd: "2nd Inversion",
    inversion_3rd: "3rd Inversion",
    rolling_alberti: "Alberti Bass",
    spread_voicings: "Spread Voicings",
    approach_notes: "Approach Notes",
    enclosures: "Enclosures",
    diatonic_sequence: "Diatonic Sequence",
    circle_4ths: "Circle of 4ths",
    circle_5ths: "Circle of 5ths",
  };
  return labels[pattern] ?? pattern.replace(/_/g, " ");
}

/**
 * Get available rhythm types for a given pattern.
 * Whole/half notes are only available for simple patterns.
 */
export function getAvailableRhythmsForPattern(
  pattern: ScalePattern | null,
): RhythmType[] {
  return RHYTHM_TYPES.filter((rhythm) => {
    if (!pattern) return true;
    if (rhythm === "whole_notes" && !WHOLE_NOTE_PATTERNS.has(pattern)) {
      return false;
    }
    if (rhythm === "half_notes" && !HALF_NOTE_PATTERNS.has(pattern)) {
      return false;
    }
    return true;
  });
}

/**
 * Filter scale patterns based on selected scale type.
 */
export function getAvailableScalePatterns(
  scaleType: ScaleType,
  isRandomizing: boolean,
): ScalePattern[] {
  if (isRandomizing) return SCALE_PATTERNS;

  const isAsymmetric = ASYMMETRIC_SCALES.includes(scaleType);
  const scaleNoteCount = getScaleNoteCount(scaleType);

  return SCALE_PATTERNS.filter((pattern) => {
    const constraints = SCALE_PATTERN_CONSTRAINTS[pattern];
    if (!constraints) return true;

    if (
      constraints.minScaleNotes &&
      scaleNoteCount < constraints.minScaleNotes
    ) {
      return false;
    }
    if (constraints.requiresSymmetric && isAsymmetric) return false;
    if (constraints.blockedScaleTypes?.includes(scaleType)) return false;
    if (
      constraints.onlyForScaleTypes &&
      !constraints.onlyForScaleTypes.includes(scaleType)
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Filter scale types based on selected pattern.
 */
export function getAvailableScaleTypes(
  scalePattern: ScalePattern,
  isRandomizing: boolean,
): ScaleType[] {
  if (isRandomizing) return SCALE_TYPES;

  const constraints = SCALE_PATTERN_CONSTRAINTS[scalePattern];
  if (!constraints) return SCALE_TYPES;

  let filtered = SCALE_TYPES;

  if (constraints.onlyForScaleTypes) {
    filtered = filtered.filter((type) =>
      constraints.onlyForScaleTypes?.includes(type),
    );
  }

  if (constraints.minScaleNotes) {
    filtered = filtered.filter(
      (type) => getScaleNoteCount(type) >= (constraints.minScaleNotes ?? 0),
    );
  }

  if (constraints.requiresSymmetric) {
    filtered = filtered.filter((type) => !ASYMMETRIC_SCALES.includes(type));
  }

  return filtered;
}

/**
 * Get max octaves for a pattern and scale type combination.
 */
export function getMaxOctaves(
  scaleType: ScaleType,
  scalePattern: ScalePattern,
  isRandomizing: boolean,
): number {
  if (isRandomizing) return 3;

  const constraints = SCALE_PATTERN_CONSTRAINTS[scalePattern];
  if (
    scaleType === "chromatic" &&
    constraints?.chromaticMaxOctaves !== undefined
  ) {
    return constraints.chromaticMaxOctaves;
  }
  return constraints?.maxOctaves ?? 3;
}

/** Default randomization state */
export const DEFAULT_RANDOMIZE_STATE: RandomizeState = {
  scaleType: false,
  arpeggioType: false,
  scalePattern: false,
  arpeggioPattern: false,
  rhythmType: false,
  rootKey: false,
  startOctave: false,
  numOctaves: false,
  clef: false,
};
