/**
 * Metronome constants and utilities
 * Extracted for reusability
 */

/**
 * Available note values for time signature denominator
 */
export const NOTE_VALUES: readonly number[] = [1, 2, 4, 8, 16, 32];

/**
 * Note value names for display
 */
export const NOTE_VALUE_NAMES: Record<number, string> = {
  1: "whole",
  2: "half",
  4: "quarter",
  8: "eighth",
  16: "sixteenth",
  32: "thirty-second",
};

/**
 * Subdivision pattern definition
 */
export interface SubdivisionPattern {
  key: string;
  description: string;
  pattern: number[];
  accent: number[];
  swingOnly: boolean;
}

/**
 * Get subdivision names based on the beat note value
 * The actual note name depends on what the beat note IS
 * @param subdivisionKey - Key from SUBDIVISIONS
 * @param noteValue - Current note value (1, 2, 4, 8, 16, 32)
 * @returns Human-readable label
 */
export function getSubdivisionLabel(
  subdivisionKey: string,
  noteValue: number,
): string {
  // Map beat note value to actual rhythm names for subdivisions
  const noteNames: Record<number, Record<string, string>> = {
    1: {
      half: "half notes",
      quarter: "quarter notes",
      triplet: "half note triplets",
    },
    2: {
      half: "quarter notes",
      quarter: "eighth notes",
      triplet: "quarter note triplets",
    },
    4: {
      half: "eighth notes",
      quarter: "sixteenth notes",
      triplet: "eighth note triplets",
    },
    8: {
      half: "sixteenth notes",
      quarter: "thirty-second notes",
      triplet: "sixteenth note triplets",
    },
    16: {
      half: "thirty-second notes",
      quarter: "sixty-fourth notes",
      triplet: "thirty-second note triplets",
    },
    32: {
      half: "sixty-fourth notes",
      quarter: "128th notes",
      triplet: "sixty-fourth note triplets",
    },
  };

  const n = noteNames[noteValue] || noteNames[4];

  const labels: Record<string, string> = {
    none: "None",
    halves: n.half,
    triplet: n.triplet,
    quarters: n.quarter,
    // Compound patterns
    halfTwoQuarters: `${n.half.replace(" notes", "")} + 2 ${n.quarter}`,
    twoQuartersHalf: `2 ${n.quarter} + ${n.half.replace(" notes", "")}`,
    dottedHalfQuarter: `dotted ${n.half.replace(" notes", "")} + ${n.quarter.replace(" notes", "")}`,
    quarterHalfQuarter: `${n.quarter.replace(" notes", "")} + ${n.half.replace(" notes", "")} + ${n.quarter.replace(" notes", "")}`,
    quarterDottedHalf: `${n.quarter.replace(" notes", "")} + dotted ${n.half.replace(" notes", "")}`,
    // Swing - only for /4
    swing: "Swing",
  };

  return labels[subdivisionKey] || subdivisionKey;
}

/**
 * Subdivision patterns - timing relative to beat (note-value agnostic)
 * pattern: array of positions within beat (0-1)
 * accent: array of volume multipliers for each click
 */
export const SUBDIVISIONS: Record<string, SubdivisionPattern> = {
  none: {
    key: "none",
    description: "1 click per beat",
    pattern: [0],
    accent: [1],
    swingOnly: false,
  },
  halves: {
    key: "halves",
    description: "2 clicks per beat",
    pattern: [0, 0.5],
    accent: [1, 0.5],
    swingOnly: false,
  },
  triplet: {
    key: "triplet",
    description: "3 clicks per beat",
    pattern: [0, 0.333, 0.667],
    accent: [1, 0.4, 0.4],
    swingOnly: false,
  },
  quarters: {
    key: "quarters",
    description: "4 clicks per beat",
    pattern: [0, 0.25, 0.5, 0.75],
    accent: [1, 0.3, 0.6, 0.3],
    swingOnly: false,
  },
  halfTwoQuarters: {
    key: "halfTwoQuarters",
    description: "Long-short-short",
    pattern: [0, 0.5, 0.75],
    accent: [1, 0.5, 0.4],
    swingOnly: false,
  },
  twoQuartersHalf: {
    key: "twoQuartersHalf",
    description: "Short-short-long",
    pattern: [0, 0.25, 0.5],
    accent: [1, 0.4, 0.6],
    swingOnly: false,
  },
  dottedHalfQuarter: {
    key: "dottedHalfQuarter",
    description: "Long (dotted)-short",
    pattern: [0, 0.75],
    accent: [1, 0.5],
    swingOnly: false,
  },
  quarterHalfQuarter: {
    key: "quarterHalfQuarter",
    description: "Short-long-short",
    pattern: [0, 0.25, 0.75],
    accent: [0.7, 1, 0.7],
    swingOnly: false,
  },
  quarterDottedHalf: {
    key: "quarterDottedHalf",
    description: "Short-long (dotted)",
    pattern: [0, 0.25],
    accent: [0.6, 1],
    swingOnly: false,
  },
  swing: {
    key: "swing",
    description: "Triplet swing feel",
    pattern: [0, 0.667],
    accent: [1, 0.5],
    swingOnly: true, // Only available for /4 time
  },
};

// Re-export createClickSound from shared utilities
// The shared version supports both numeric frequency and boolean isAccent parameters
export { createClickSound } from "../../screens/Session/components/exercises/shared/audioHelpers";
