/**
 * Chord Recognition Service
 *
 * Provides chord symbol parsing, validation, autocomplete, MIDI spelling, and transposition.
 * All chords are authored in C and transposed to target keys on-demand.
 */

// =============================================================================
// Types
// =============================================================================

/** Root note of a chord */
export type ChordRoot =
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "A"
  | "B"
  | "C#"
  | "Db"
  | "D#"
  | "Eb"
  | "F#"
  | "Gb"
  | "G#"
  | "Ab"
  | "A#"
  | "Bb";

/**
 * Chord quality/type identifier.
 * These map to specific interval structures.
 */
export type ChordQuality =
  // Triads
  | "major"
  | "minor"
  | "diminished"
  | "augmented"
  | "sus2"
  | "sus4"
  // Seventh chords
  | "maj7"
  | "7"
  | "m7"
  | "mMaj7"
  | "dim7"
  | "m7b5"
  | "aug7"
  | "7sus4"
  | "7sus2"
  // Extended chords
  | "maj9"
  | "9"
  | "m9"
  | "mMaj9"
  | "maj11"
  | "11"
  | "m11"
  | "maj13"
  | "13"
  | "m13"
  // Altered dominants
  | "7b9"
  | "7#9"
  | "7b5"
  | "7#5"
  | "7b5b9"
  | "7#5#9"
  | "7alt"
  // Add chords
  | "add9"
  | "add11"
  | "madd9"
  | "6"
  | "m6"
  | "6/9"
  | "m6/9";

/** Parsed chord data */
export interface ParsedChord {
  /** Original input string */
  input: string;
  /** Normalized/canonical symbol */
  symbol: string;
  /** Root note (e.g., "C", "F#", "Bb") */
  root: ChordRoot;
  /** Chord quality */
  quality: ChordQuality;
  /** Bass note for slash chords (e.g., "E" in "C/E") */
  bass?: ChordRoot;
  /** Additional alterations (e.g., "#11", "b13") */
  alterations: string[];
}

/** Result of chord recognition */
export interface ChordRecognitionResult {
  /** Whether the chord was successfully recognized */
  recognized: boolean;
  /** Parsed chord data (if recognized) */
  parsed?: ParsedChord;
  /** Suggested corrections or alternatives */
  suggestions: string[];
  /** Error message if not recognized */
  error?: string;
}

// =============================================================================
// Constants
// =============================================================================

/** Valid root notes */
const ROOT_NOTES: readonly ChordRoot[] = [
  "C",
  "C#",
  "Db",
  "D",
  "D#",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "G#",
  "Ab",
  "A",
  "A#",
  "Bb",
  "B",
] as const;

/** Root note to semitone offset from C */
const ROOT_TO_SEMITONE: Record<ChordRoot, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
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
};

/** Semitone offset to root note (prefer sharps for ascending, flats for descending) */
const SEMITONE_TO_ROOT_SHARP: ChordRoot[] = [
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

const SEMITONE_TO_ROOT_FLAT: ChordRoot[] = [
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
 * Chord quality patterns and their interval structures.
 * Intervals are semitones from root: [root, 3rd, 5th, 7th, 9th, 11th, 13th]
 */
const CHORD_INTERVALS: Record<ChordQuality, number[]> = {
  // Triads
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  // Seventh chords
  maj7: [0, 4, 7, 11],
  "7": [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  mMaj7: [0, 3, 7, 11],
  dim7: [0, 3, 6, 9],
  m7b5: [0, 3, 6, 10],
  aug7: [0, 4, 8, 10],
  "7sus4": [0, 5, 7, 10],
  "7sus2": [0, 2, 7, 10],
  // Extended chords
  maj9: [0, 4, 7, 11, 14],
  "9": [0, 4, 7, 10, 14],
  m9: [0, 3, 7, 10, 14],
  mMaj9: [0, 3, 7, 11, 14],
  maj11: [0, 4, 7, 11, 14, 17],
  "11": [0, 4, 7, 10, 14, 17],
  m11: [0, 3, 7, 10, 14, 17],
  maj13: [0, 4, 7, 11, 14, 17, 21],
  "13": [0, 4, 7, 10, 14, 17, 21],
  m13: [0, 3, 7, 10, 14, 17, 21],
  // Altered dominants
  "7b9": [0, 4, 7, 10, 13],
  "7#9": [0, 4, 7, 10, 15],
  "7b5": [0, 4, 6, 10],
  "7#5": [0, 4, 8, 10],
  "7b5b9": [0, 4, 6, 10, 13],
  "7#5#9": [0, 4, 8, 10, 15],
  "7alt": [0, 4, 6, 10, 13, 15], // b5, b9, #9
  // Add chords
  add9: [0, 4, 7, 14],
  add11: [0, 4, 7, 17],
  madd9: [0, 3, 7, 14],
  "6": [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  "6/9": [0, 4, 7, 9, 14],
  "m6/9": [0, 3, 7, 9, 14],
};

/**
 * Mapping from chord symbol suffixes to quality.
 * Order matters: longer/more specific patterns first.
 */
const SUFFIX_TO_QUALITY: [string, ChordQuality][] = [
  // Extended/altered dominants (most specific first)
  ["maj13", "maj13"],
  ["Maj13", "maj13"],
  ["M13", "maj13"],
  ["Δ13", "maj13"],
  ["maj11", "maj11"],
  ["Maj11", "maj11"],
  ["M11", "maj11"],
  ["Δ11", "maj11"],
  ["maj9", "maj9"],
  ["Maj9", "maj9"],
  ["M9", "maj9"],
  ["Δ9", "maj9"],
  ["mMaj9", "mMaj9"],
  ["m/Maj9", "mMaj9"],
  ["-Δ9", "mMaj9"],
  ["mMaj7", "mMaj7"],
  ["m/Maj7", "mMaj7"],
  ["m(Maj7)", "mMaj7"],
  ["-Δ7", "mMaj7"],
  ["-Δ", "mMaj7"],
  ["7#5#9", "7#5#9"],
  ["7(#5#9)", "7#5#9"],
  ["7b5b9", "7b5b9"],
  ["7(b5b9)", "7b5b9"],
  ["7alt", "7alt"],
  ["alt", "7alt"],
  ["7#9", "7#9"],
  ["7(#9)", "7#9"],
  ["7b9", "7b9"],
  ["7(b9)", "7b9"],
  ["7#5", "7#5"],
  ["7(#5)", "7#5"],
  ["aug7", "aug7"],
  ["+7", "aug7"],
  ["7b5", "7b5"],
  ["7(b5)", "7b5"],
  ["7sus4", "7sus4"],
  ["7sus", "7sus4"],
  ["7sus2", "7sus2"],
  // Thirteenths
  ["m13", "m13"],
  ["-13", "m13"],
  ["min13", "m13"],
  ["13", "13"],
  // Elevenths
  ["m11", "m11"],
  ["-11", "m11"],
  ["min11", "m11"],
  ["11", "11"],
  // Ninths
  ["m9", "m9"],
  ["-9", "m9"],
  ["min9", "m9"],
  ["9", "9"],
  // Sevenths
  ["maj7", "maj7"],
  ["Maj7", "maj7"],
  ["M7", "maj7"],
  ["Δ7", "maj7"],
  ["Δ", "maj7"],
  ["dim7", "dim7"],
  ["°7", "dim7"],
  ["o7", "dim7"],
  ["m7b5", "m7b5"],
  ["m7(b5)", "m7b5"],
  ["ø7", "m7b5"],
  ["ø", "m7b5"],
  ["-7b5", "m7b5"],
  ["m7", "m7"],
  ["-7", "m7"],
  ["min7", "m7"],
  ["7", "7"],
  ["dom7", "7"],
  // Sixths
  ["m6/9", "m6/9"],
  ["-6/9", "m6/9"],
  ["6/9", "6/9"],
  ["m6", "m6"],
  ["-6", "m6"],
  ["min6", "m6"],
  ["6", "6"],
  // Add chords
  ["madd9", "madd9"],
  ["-add9", "madd9"],
  ["add11", "add11"],
  ["add9", "add9"],
  ["add2", "add9"],
  // Suspensions
  ["sus4", "sus4"],
  ["sus2", "sus2"],
  ["sus", "sus4"],
  // Triads (check these last)
  ["aug", "augmented"],
  ["+", "augmented"],
  ["dim", "diminished"],
  ["°", "diminished"],
  ["o", "diminished"],
  ["min", "minor"],
  ["m", "minor"],
  ["-", "minor"],
  // Major is default (empty suffix)
];

/**
 * Common chord symbols for autocomplete.
 * Organized by category for quick lookup.
 */
const COMMON_CHORDS: readonly string[] = [
  // Major triads (naturals)
  "C",
  "D",
  "E",
  "F",
  "G",
  "A",
  "B",
  // Major triads (sharps/flats)
  "C#",
  "Db",
  "Eb",
  "F#",
  "Gb",
  "Ab",
  "Bb",
  // Minor triads (naturals)
  "Cm",
  "Dm",
  "Em",
  "Fm",
  "Gm",
  "Am",
  "Bm",
  // Seventh chords
  "Cmaj7",
  "Dm7",
  "Em7",
  "Fmaj7",
  "G7",
  "Am7",
  "Bm7b5",
  "Cmaj9",
  "Dm9",
  "G9",
  "Am9",
  // Common jazz voicings
  "C7",
  "D7",
  "E7",
  "F7",
  "G7",
  "A7",
  "B7",
  "Cm7",
  "Dm7",
  "Em7",
  "Fm7",
  "Gm7",
  "Am7",
  "Bm7",
  // Diminished and half-diminished
  "Cdim",
  "Cdim7",
  "Cm7b5",
  "Ddim",
  "Ddim7",
  "Dm7b5",
  // Augmented
  "Caug",
  "Daug",
  "Eaug",
  "Faug",
  "Gaug",
  "Aaug",
  "Baug",
  // Suspensions
  "Csus4",
  "Dsus4",
  "Gsus4",
  "Csus2",
  "Dsus2",
  "Gsus2",
  "C7sus4",
  "G7sus4",
  // Altered dominants
  "C7b9",
  "C7#9",
  "C7b5",
  "C7#5",
  "C7alt",
  "G7b9",
  "G7#9",
  "G7alt",
  // Extended chords
  "Cmaj9",
  "Cmaj11",
  "Cmaj13",
  "C9",
  "C11",
  "C13",
  "Cm9",
  "Cm11",
  "Cm13",
  // Add chords
  "Cadd9",
  "Cadd11",
  "Dadd9",
  "Gadd9",
  // Sixths
  "C6",
  "Cm6",
  "C6/9",
  "D6",
  "G6",
  // Minor-major
  "CmMaj7",
  "DmMaj7",
  "AmMaj7",
] as const;

// =============================================================================
// Parsing Functions
// =============================================================================

/**
 * Parse a root note from the beginning of a chord symbol.
 * Returns the root and remaining string, or null if no valid root found.
 */
function parseRoot(
  input: string,
): { root: ChordRoot; remaining: string } | null {
  if (!input) return null;

  // Try two-character roots first (with accidentals)
  if (input.length >= 2) {
    const twoChar = input.slice(0, 2);
    // Handle Unicode accidental notations
    const normalized = twoChar.replace(/♯/, "#").replace(/♭/, "b");

    if (ROOT_NOTES.includes(normalized as ChordRoot)) {
      return {
        root: normalized as ChordRoot,
        remaining: input.slice(2),
      };
    }
  }

  // Try single character root
  const oneChar = input.charAt(0).toUpperCase();
  if (ROOT_NOTES.includes(oneChar as ChordRoot)) {
    return {
      root: oneChar as ChordRoot,
      remaining: input.slice(1),
    };
  }

  return null;
}

/**
 * Parse suffix into chord quality and remaining alterations.
 */
function parseSuffix(suffix: string): {
  quality: ChordQuality;
  alterations: string[];
} {
  // Empty suffix = major
  if (!suffix) {
    return { quality: "major", alterations: [] };
  }

  // Try to match against known suffixes FIRST (before normalization)
  for (const [pattern, quality] of SUFFIX_TO_QUALITY) {
    if (suffix.startsWith(pattern)) {
      const remaining = suffix.slice(pattern.length);
      const alterations = remaining ? [remaining] : [];
      return { quality, alterations };
    }
  }

  // Normalize common variations and try again
  const normalized = suffix.replace(/♯/g, "#").replace(/♭/g, "b");

  // Handle special Unicode symbols after initial pattern match failed
  if (suffix.startsWith("Δ")) {
    // Δ alone = maj7, Δ7 already matched above
    return {
      quality: "maj7",
      alterations: suffix.length > 1 ? [suffix.slice(1)] : [],
    };
  }
  if (suffix.startsWith("°") || suffix.startsWith("o")) {
    // ° alone = diminished, °7 already matched above
    return {
      quality: "diminished",
      alterations: suffix.length > 1 ? [suffix.slice(1)] : [],
    };
  }
  if (suffix.startsWith("ø")) {
    // ø = half-diminished (m7b5)
    return {
      quality: "m7b5",
      alterations: suffix.length > 1 ? [suffix.slice(1)] : [],
    };
  }
  if (suffix.startsWith("+")) {
    // + = augmented
    return {
      quality: "augmented",
      alterations: suffix.length > 1 ? [suffix.slice(1)] : [],
    };
  }

  // Try normalized version
  for (const [pattern, quality] of SUFFIX_TO_QUALITY) {
    if (normalized.startsWith(pattern)) {
      const remaining = normalized.slice(pattern.length);
      const alterations = remaining ? [remaining] : [];
      return { quality, alterations };
    }
  }

  // Special cases for standalone suffixes
  if (normalized === "M" || normalized === "maj") {
    return { quality: "major", alterations: [] };
  }

  // Try to extract alterations from unrecognized suffix
  const alterationMatch = normalized.match(/^(.+?)((?:[#b]\d+)+)$/);
  if (alterationMatch) {
    const [, baseSuffix, alts] = alterationMatch;
    // Recursively parse the base
    const base = parseSuffix(baseSuffix);
    return {
      quality: base.quality,
      alterations: [...base.alterations, alts],
    };
  }

  // Unrecognized suffix - default to major with the suffix as alteration
  return { quality: "major", alterations: [normalized] };
}

/**
 * Extract slash chord components from remaining string.
 * For "m7/G", returns { suffix: "m7", bass: "G" }
 */
function parseSlashChord(remaining: string): {
  suffix: string;
  bass: ChordRoot | undefined;
} {
  const slashIndex = remaining.indexOf("/");

  if (slashIndex === -1) {
    return { suffix: remaining, bass: undefined };
  }

  const suffix = remaining.slice(0, slashIndex);
  const bassStr = remaining.slice(slashIndex + 1);

  // Parse bass note
  const bassResult = parseRoot(bassStr);
  if (bassResult && bassResult.remaining === "") {
    return { suffix, bass: bassResult.root };
  }

  // Invalid bass note - treat whole thing as suffix
  return { suffix: remaining, bass: undefined };
}

/**
 * Build a canonical/normalized chord symbol from parsed data.
 */
function buildCanonicalSymbol(parsed: ParsedChord): string {
  let symbol = parsed.root;

  // Add quality suffix
  switch (parsed.quality) {
    case "major":
      // No suffix for major
      break;
    case "minor":
      symbol += "m";
      break;
    case "diminished":
      symbol += "dim";
      break;
    case "augmented":
      symbol += "aug";
      break;
    case "sus2":
      symbol += "sus2";
      break;
    case "sus4":
      symbol += "sus4";
      break;
    case "maj7":
      symbol += "maj7";
      break;
    case "7":
      symbol += "7";
      break;
    case "m7":
      symbol += "m7";
      break;
    case "mMaj7":
      symbol += "mMaj7";
      break;
    case "dim7":
      symbol += "dim7";
      break;
    case "m7b5":
      symbol += "m7b5";
      break;
    case "aug7":
      symbol += "aug7";
      break;
    case "7sus4":
      symbol += "7sus4";
      break;
    case "7sus2":
      symbol += "7sus2";
      break;
    default:
      symbol += parsed.quality;
  }

  // Add alterations
  if (parsed.alterations.length > 0) {
    symbol += parsed.alterations.join("");
  }

  // Add bass note
  if (parsed.bass) {
    symbol += `/${parsed.bass}`;
  }

  return symbol;
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Recognize and parse a chord symbol.
 *
 * @param input - Raw chord symbol string (e.g., "Cmaj7", "Dm7/G", "F#7#9")
 * @returns Recognition result with parsed data and suggestions
 *
 * @example
 * recognizeChord("Cmaj7")
 * // { recognized: true, parsed: { root: "C", quality: "maj7", ... }, suggestions: [] }
 *
 * recognizeChord("Cmayjor7")
 * // { recognized: false, error: "...", suggestions: ["Cmaj7", "C7", "Cm7"] }
 */
export function recognizeChord(input: string): ChordRecognitionResult {
  if (!input || typeof input !== "string") {
    return {
      recognized: false,
      suggestions: [],
      error: "Empty or invalid input",
    };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return {
      recognized: false,
      suggestions: [],
      error: "Empty input",
    };
  }

  // Parse root note
  const rootResult = parseRoot(trimmed);
  if (!rootResult) {
    return {
      recognized: false,
      suggestions: getAutocompleteSuggestions(trimmed),
      error: `Invalid root note: "${trimmed.charAt(0)}"`,
    };
  }

  const { root, remaining } = rootResult;

  // Parse slash chord (splits suffix from bass note)
  const { suffix, bass } = parseSlashChord(remaining);

  // Parse suffix (quality + alterations)
  const { quality, alterations } = parseSuffix(suffix);

  // Build parsed chord
  const parsed: ParsedChord = {
    input: trimmed,
    symbol: "",
    root,
    quality,
    bass,
    alterations,
  };
  parsed.symbol = buildCanonicalSymbol(parsed);

  return {
    recognized: true,
    parsed,
    suggestions: [],
  };
}

/**
 * Get autocomplete suggestions for a partial chord input.
 *
 * @param partial - Partial chord symbol being typed
 * @param limit - Maximum number of suggestions (default 10)
 * @returns Array of matching chord symbols
 *
 * @example
 * getAutocompleteSuggestions("Cm")
 * // ["Cm", "Cm7", "Cmaj7", "Cm9", "Cm7b5", ...]
 */
export function getAutocompleteSuggestions(
  partial: string,
  limit: number = 10,
): string[] {
  if (!partial || typeof partial !== "string") {
    return [];
  }

  const normalized = partial.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  // Filter chords that start with the partial (case-insensitive)
  const matches = COMMON_CHORDS.filter((chord) =>
    chord.toLowerCase().startsWith(normalized),
  );

  // Sort by length (shorter = more common/basic) then alphabetically
  matches.sort((a, b) => {
    if (a.length !== b.length) {
      return a.length - b.length;
    }
    return a.localeCompare(b);
  });

  return matches.slice(0, limit);
}

/**
 * Get MIDI note numbers for a chord's notes.
 * Uses middle C (C4 = MIDI 60) as the reference octave.
 *
 * @param symbol - Chord symbol to spell
 * @param rootOctave - MIDI note number for the root (default 60 = C4)
 * @returns Array of MIDI note numbers, or empty array if chord not recognized
 *
 * @example
 * spellChord("Cmaj7")
 * // [60, 64, 67, 71] (C4, E4, G4, B4)
 *
 * spellChord("Dm7")
 * // [62, 65, 69, 72] (D4, F4, A4, C5)
 */
export function spellChord(symbol: string, rootOctave: number = 60): number[] {
  const result = recognizeChord(symbol);

  if (!result.recognized || !result.parsed) {
    return [];
  }

  const { root, quality, bass } = result.parsed;
  const rootSemitone = ROOT_TO_SEMITONE[root];
  const intervals = CHORD_INTERVALS[quality];

  if (!intervals) {
    return [];
  }

  // Calculate base note for the root in the target octave
  const baseNote = rootOctave + rootSemitone;

  // Build chord tones
  const notes = intervals.map((interval) => baseNote + interval);

  // Add bass note if specified (below the chord)
  if (bass) {
    const bassSemitone = ROOT_TO_SEMITONE[bass];
    // Place bass note below the root
    let bassNote = rootOctave - 12 + bassSemitone;
    // Ensure bass is below the root
    while (bassNote >= baseNote) {
      bassNote -= 12;
    }
    return [bassNote, ...notes];
  }

  return notes;
}

/**
 * Transpose a chord symbol by a given interval.
 *
 * @param symbol - Chord symbol to transpose
 * @param semitones - Number of semitones to transpose (positive = up, negative = down)
 * @param preferFlats - Whether to prefer flats over sharps (default: auto-detect)
 * @returns Transposed chord symbol, or original if not recognized
 *
 * @example
 * transposeChord("Cmaj7", 5)
 * // "Fmaj7"
 *
 * transposeChord("Dm7", -2)
 * // "Cm7"
 *
 * transposeChord("G7/B", 3)
 * // "Bb7/D"
 */
export function transposeChord(
  symbol: string,
  semitones: number,
  preferFlats?: boolean,
): string {
  const result = recognizeChord(symbol);

  if (!result.recognized || !result.parsed) {
    return symbol; // Return original if not recognized
  }

  const { root, bass, quality, alterations } = result.parsed;

  // Determine whether to use flats or sharps
  const useFlats =
    preferFlats ?? (root.includes("b") || (bass && bass.includes("b")));

  const lookupTable = useFlats ? SEMITONE_TO_ROOT_FLAT : SEMITONE_TO_ROOT_SHARP;

  // Transpose root
  const rootSemitone = ROOT_TO_SEMITONE[root];
  const newRootSemitone = (((rootSemitone + semitones) % 12) + 12) % 12;
  const newRoot = lookupTable[newRootSemitone];

  // Transpose bass if present
  let newBass: ChordRoot | undefined;
  if (bass) {
    const bassSemitone = ROOT_TO_SEMITONE[bass];
    const newBassSemitone = (((bassSemitone + semitones) % 12) + 12) % 12;
    newBass = lookupTable[newBassSemitone];
  }

  // Build new chord
  const transposed: ParsedChord = {
    input: symbol,
    symbol: "",
    root: newRoot,
    quality,
    bass: newBass,
    alterations,
  };
  transposed.symbol = buildCanonicalSymbol(transposed);

  return transposed.symbol;
}

/**
 * Check if a string is a valid chord symbol.
 * Faster than full recognition for simple validation.
 */
export function isValidChordSymbol(symbol: string): boolean {
  const result = recognizeChord(symbol);
  return result.recognized && !result.error;
}

/**
 * Get the intervals (in semitones) for a given chord quality.
 */
export function getChordIntervals(quality: ChordQuality): number[] {
  return [...(CHORD_INTERVALS[quality] || [])];
}

/**
 * Get all supported chord qualities.
 */
export function getSupportedQualities(): ChordQuality[] {
  return Object.keys(CHORD_INTERVALS) as ChordQuality[];
}
