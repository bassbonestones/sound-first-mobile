/**
 * Key Signature Constants
 *
 * Shared constants for key signature names and display formatting.
 * Key signatures are represented as circle of fifths values (-7 to +7).
 *
 * @example
 * import { KEY_NAMES, KEY_NAMES_SHORT, KEY_SIGNATURES } from '../constants';
 *
 * const fullName = KEY_NAMES[0];           // "C Major"
 * const shortName = KEY_NAMES_SHORT[0];    // "C"
 * const minorName = KEY_SIGNATURES[0].minor; // "A Minor"
 */

// =============================================================================
// Full Major Key Names (for display in pickers and headers)
// =============================================================================

/**
 * Full major key names indexed by circle of fifths value.
 * Keys: -7 (Cb) to +7 (C#)
 */
export const KEY_NAMES: Record<number, string> = {
  [-7]: "C♭ Major",
  [-6]: "G♭ Major",
  [-5]: "D♭ Major",
  [-4]: "A♭ Major",
  [-3]: "E♭ Major",
  [-2]: "B♭ Major",
  [-1]: "F Major",
  [0]: "C Major",
  [1]: "G Major",
  [2]: "D Major",
  [3]: "A Major",
  [4]: "E Major",
  [5]: "B Major",
  [6]: "F♯ Major",
  [7]: "C♯ Major",
};

// =============================================================================
// Short Key Names (for compact display)
// =============================================================================

/**
 * Short key names (root note only) indexed by circle of fifths value.
 * Useful for compact UI elements like dropdown buttons.
 */
export const KEY_NAMES_SHORT: Record<number, string> = {
  [-7]: "C♭",
  [-6]: "G♭",
  [-5]: "D♭",
  [-4]: "A♭",
  [-3]: "E♭",
  [-2]: "B♭",
  [-1]: "F",
  [0]: "C",
  [1]: "G",
  [2]: "D",
  [3]: "A",
  [4]: "E",
  [5]: "B",
  [6]: "F♯",
  [7]: "C♯",
};

// =============================================================================
// Full Key Signatures (with major and minor modes)
// =============================================================================

export interface KeyNamePair {
  /** Major key name (e.g., "C Major") */
  major: string;
  /** Relative minor key name (e.g., "A Minor") */
  minor: string;
}

/**
 * Full key signature information including both major and relative minor.
 * Indexed by circle of fifths value (-7 to +7).
 *
 * @example
 * KEY_SIGNATURES[0].major  // "C Major"
 * KEY_SIGNATURES[0].minor  // "A Minor"
 * KEY_SIGNATURES[-3].major // "E♭ Major"
 * KEY_SIGNATURES[-3].minor // "C Minor"
 */
export const KEY_SIGNATURES: Record<number, KeyNamePair> = {
  [-7]: { major: "C♭ Major", minor: "A♭ Minor" },
  [-6]: { major: "G♭ Major", minor: "E♭ Minor" },
  [-5]: { major: "D♭ Major", minor: "B♭ Minor" },
  [-4]: { major: "A♭ Major", minor: "F Minor" },
  [-3]: { major: "E♭ Major", minor: "C Minor" },
  [-2]: { major: "B♭ Major", minor: "G Minor" },
  [-1]: { major: "F Major", minor: "D Minor" },
  [0]: { major: "C Major", minor: "A Minor" },
  [1]: { major: "G Major", minor: "E Minor" },
  [2]: { major: "D Major", minor: "B Minor" },
  [3]: { major: "A Major", minor: "F♯ Minor" },
  [4]: { major: "E Major", minor: "C♯ Minor" },
  [5]: { major: "B Major", minor: "G♯ Minor" },
  [6]: { major: "F♯ Major", minor: "D♯ Minor" },
  [7]: { major: "C♯ Major", minor: "A♯ Minor" },
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get the full major key name for a circle of fifths value.
 * Defaults to "C Major" for invalid values.
 */
export function getKeyName(fifths: number): string {
  return KEY_NAMES[fifths] ?? "C Major";
}

/**
 * Get the short key name (root note) for a circle of fifths value.
 * Defaults to "C" for invalid values.
 */
export function getKeyNameShort(fifths: number): string {
  return KEY_NAMES_SHORT[fifths] ?? "C";
}

/**
 * Get the full key signature info for a circle of fifths value.
 * Defaults to C Major / A Minor for invalid values.
 */
export function getKeySignature(fifths: number): KeyNamePair {
  return KEY_SIGNATURES[fifths] ?? { major: "C Major", minor: "A Minor" };
}

/**
 * Valid key signature range.
 * Circle of fifths values from -7 (7 flats) to +7 (7 sharps).
 */
export const KEY_SIGNATURE_RANGE = {
  min: -7,
  max: 7,
};

/**
 * Array of all valid key signature values for iteration.
 */
export const ALL_KEY_SIGNATURES = [
  -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7,
] as const;
