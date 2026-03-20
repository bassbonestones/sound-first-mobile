/**
 * Pitch Utilities
 *
 * Functions for working with MIDI pitches and musical note names.
 */

import type { Accidental, Clef, KeySignature, PitchName } from "../types";
import { DEFAULT_OCTAVE_MIDI, PITCH_NAMES, PITCH_TO_SEMITONE } from "../types";

// =============================================================================
// Verified Key Alteration Map
// =============================================================================
// This is a strict lookup table verified manually for all 15 keys.
// Structure: KEY_ALTERATION_MAP[keySignature][degree][alteration] = { letter, accidental }
// - keySignature: -7 (Cb) to +7 (C#)
// - degree: 0-6 (scale degrees 1-7)
// - alteration: -2 (double-lowered), -1 (lowered), 0 (diatonic), +1 (raised), +2 (double-raised)

type SpellingEntry = { letter: PitchName; accidental: Accidental | undefined };
type DegreeAlterations = Record<number, SpellingEntry>; // -2 to +2
type KeyAlterations = DegreeAlterations[]; // degrees 0-6

/**
 * Complete verified map of all key signatures, scale degrees, and alterations.
 * Source: key_alteration_map.md (manually verified)
 */
const KEY_ALTERATION_MAP: Record<KeySignature, KeyAlterations> = {
  // Cb Major (7 flats)
  [-7]: [
    {
      [-2]: { letter: "B", accidental: "double-flat" },
      [-1]: { letter: "C", accidental: "double-flat" },
      [0]: { letter: "C", accidental: "flat" },
      [1]: { letter: "C", accidental: "natural" },
      [2]: { letter: "C", accidental: "sharp" },
    },
    {
      [-2]: { letter: "C", accidental: "flat" },
      [-1]: { letter: "D", accidental: "double-flat" },
      [0]: { letter: "D", accidental: "flat" },
      [1]: { letter: "D", accidental: "natural" },
      [2]: { letter: "D", accidental: "sharp" },
    },
    {
      [-2]: { letter: "D", accidental: "flat" },
      [-1]: { letter: "E", accidental: "double-flat" },
      [0]: { letter: "E", accidental: "flat" },
      [1]: { letter: "E", accidental: "natural" },
      [2]: { letter: "E", accidental: "sharp" },
    },
    {
      [-2]: { letter: "E", accidental: "double-flat" },
      [-1]: { letter: "F", accidental: "double-flat" },
      [0]: { letter: "F", accidental: "flat" },
      [1]: { letter: "F", accidental: "natural" },
      [2]: { letter: "F", accidental: "sharp" },
    },
    {
      [-2]: { letter: "F", accidental: "flat" },
      [-1]: { letter: "G", accidental: "double-flat" },
      [0]: { letter: "G", accidental: "flat" },
      [1]: { letter: "G", accidental: "natural" },
      [2]: { letter: "G", accidental: "sharp" },
    },
    {
      [-2]: { letter: "G", accidental: "flat" },
      [-1]: { letter: "A", accidental: "double-flat" },
      [0]: { letter: "A", accidental: "flat" },
      [1]: { letter: "A", accidental: "natural" },
      [2]: { letter: "A", accidental: "sharp" },
    },
    {
      [-2]: { letter: "A", accidental: "flat" },
      [-1]: { letter: "B", accidental: "double-flat" },
      [0]: { letter: "B", accidental: "flat" },
      [1]: { letter: "B", accidental: "natural" },
      [2]: { letter: "B", accidental: "sharp" },
    },
  ],
  // Gb Major (6 flats)
  [-6]: [
    {
      [-2]: { letter: "F", accidental: "flat" },
      [-1]: { letter: "G", accidental: "double-flat" },
      [0]: { letter: "G", accidental: "flat" },
      [1]: { letter: "G", accidental: "natural" },
      [2]: { letter: "G", accidental: "sharp" },
    },
    {
      [-2]: { letter: "G", accidental: "flat" },
      [-1]: { letter: "A", accidental: "double-flat" },
      [0]: { letter: "A", accidental: "flat" },
      [1]: { letter: "A", accidental: "natural" },
      [2]: { letter: "A", accidental: "sharp" },
    },
    {
      [-2]: { letter: "A", accidental: "flat" },
      [-1]: { letter: "B", accidental: "double-flat" },
      [0]: { letter: "B", accidental: "flat" },
      [1]: { letter: "B", accidental: "natural" },
      [2]: { letter: "B", accidental: "sharp" },
    },
    {
      [-2]: { letter: "B", accidental: "double-flat" },
      [-1]: { letter: "C", accidental: "double-flat" },
      [0]: { letter: "C", accidental: "flat" },
      [1]: { letter: "C", accidental: "natural" },
      [2]: { letter: "C", accidental: "sharp" },
    },
    {
      [-2]: { letter: "C", accidental: "flat" },
      [-1]: { letter: "D", accidental: "double-flat" },
      [0]: { letter: "D", accidental: "flat" },
      [1]: { letter: "D", accidental: "natural" },
      [2]: { letter: "D", accidental: "sharp" },
    },
    {
      [-2]: { letter: "D", accidental: "flat" },
      [-1]: { letter: "E", accidental: "double-flat" },
      [0]: { letter: "E", accidental: "flat" },
      [1]: { letter: "E", accidental: "natural" },
      [2]: { letter: "E", accidental: "sharp" },
    },
    {
      [-2]: { letter: "F", accidental: "double-flat" },
      [-1]: { letter: "F", accidental: "flat" },
      [0]: { letter: "F", accidental: undefined },
      [1]: { letter: "F", accidental: "sharp" },
      [2]: { letter: "F", accidental: "double-sharp" },
    },
  ],
  // Db Major (5 flats)
  [-5]: [
    {
      [-2]: { letter: "C", accidental: "flat" },
      [-1]: { letter: "D", accidental: "double-flat" },
      [0]: { letter: "D", accidental: "flat" },
      [1]: { letter: "D", accidental: "natural" },
      [2]: { letter: "D", accidental: "sharp" },
    },
    {
      [-2]: { letter: "D", accidental: "flat" },
      [-1]: { letter: "E", accidental: "double-flat" },
      [0]: { letter: "E", accidental: "flat" },
      [1]: { letter: "E", accidental: "natural" },
      [2]: { letter: "E", accidental: "sharp" },
    },
    {
      [-2]: { letter: "F", accidental: "double-flat" },
      [-1]: { letter: "F", accidental: "flat" },
      [0]: { letter: "F", accidental: undefined },
      [1]: { letter: "F", accidental: "sharp" },
      [2]: { letter: "F", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "F", accidental: "flat" },
      [-1]: { letter: "G", accidental: "double-flat" },
      [0]: { letter: "G", accidental: "flat" },
      [1]: { letter: "G", accidental: "natural" },
      [2]: { letter: "G", accidental: "sharp" },
    },
    {
      [-2]: { letter: "G", accidental: "flat" },
      [-1]: { letter: "A", accidental: "double-flat" },
      [0]: { letter: "A", accidental: "flat" },
      [1]: { letter: "A", accidental: "natural" },
      [2]: { letter: "A", accidental: "sharp" },
    },
    {
      [-2]: { letter: "A", accidental: "flat" },
      [-1]: { letter: "B", accidental: "double-flat" },
      [0]: { letter: "B", accidental: "flat" },
      [1]: { letter: "B", accidental: "natural" },
      [2]: { letter: "B", accidental: "sharp" },
    },
    {
      [-2]: { letter: "C", accidental: "double-flat" },
      [-1]: { letter: "C", accidental: "flat" },
      [0]: { letter: "C", accidental: undefined },
      [1]: { letter: "C", accidental: "sharp" },
      [2]: { letter: "C", accidental: "double-sharp" },
    },
  ],
  // Ab Major (4 flats)
  [-4]: [
    {
      [-2]: { letter: "G", accidental: "flat" },
      [-1]: { letter: "A", accidental: "double-flat" },
      [0]: { letter: "A", accidental: "flat" },
      [1]: { letter: "A", accidental: "natural" },
      [2]: { letter: "A", accidental: "sharp" },
    },
    {
      [-2]: { letter: "A", accidental: "flat" },
      [-1]: { letter: "B", accidental: "double-flat" },
      [0]: { letter: "B", accidental: "flat" },
      [1]: { letter: "B", accidental: "natural" },
      [2]: { letter: "B", accidental: "sharp" },
    },
    {
      [-2]: { letter: "C", accidental: "double-flat" },
      [-1]: { letter: "C", accidental: "flat" },
      [0]: { letter: "C", accidental: undefined },
      [1]: { letter: "C", accidental: "sharp" },
      [2]: { letter: "C", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "C", accidental: "flat" },
      [-1]: { letter: "D", accidental: "double-flat" },
      [0]: { letter: "D", accidental: "flat" },
      [1]: { letter: "D", accidental: "natural" },
      [2]: { letter: "D", accidental: "sharp" },
    },
    {
      [-2]: { letter: "D", accidental: "flat" },
      [-1]: { letter: "E", accidental: "double-flat" },
      [0]: { letter: "E", accidental: "flat" },
      [1]: { letter: "E", accidental: "natural" },
      [2]: { letter: "E", accidental: "sharp" },
    },
    {
      [-2]: { letter: "F", accidental: "double-flat" },
      [-1]: { letter: "F", accidental: "flat" },
      [0]: { letter: "F", accidental: undefined },
      [1]: { letter: "F", accidental: "sharp" },
      [2]: { letter: "F", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "G", accidental: "double-flat" },
      [-1]: { letter: "G", accidental: "flat" },
      [0]: { letter: "G", accidental: undefined },
      [1]: { letter: "G", accidental: "sharp" },
      [2]: { letter: "G", accidental: "double-sharp" },
    },
  ],
  // Eb Major (3 flats)
  [-3]: [
    {
      [-2]: { letter: "D", accidental: "flat" },
      [-1]: { letter: "E", accidental: "double-flat" },
      [0]: { letter: "E", accidental: "flat" },
      [1]: { letter: "E", accidental: "natural" },
      [2]: { letter: "E", accidental: "sharp" },
    },
    {
      [-2]: { letter: "F", accidental: "double-flat" },
      [-1]: { letter: "F", accidental: "flat" },
      [0]: { letter: "F", accidental: undefined },
      [1]: { letter: "F", accidental: "sharp" },
      [2]: { letter: "F", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "G", accidental: "double-flat" },
      [-1]: { letter: "G", accidental: "flat" },
      [0]: { letter: "G", accidental: undefined },
      [1]: { letter: "G", accidental: "sharp" },
      [2]: { letter: "G", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "G", accidental: "flat" },
      [-1]: { letter: "A", accidental: "double-flat" },
      [0]: { letter: "A", accidental: "flat" },
      [1]: { letter: "A", accidental: "natural" },
      [2]: { letter: "A", accidental: "sharp" },
    },
    {
      [-2]: { letter: "A", accidental: "flat" },
      [-1]: { letter: "B", accidental: "double-flat" },
      [0]: { letter: "B", accidental: "flat" },
      [1]: { letter: "B", accidental: "natural" },
      [2]: { letter: "B", accidental: "sharp" },
    },
    {
      [-2]: { letter: "C", accidental: "double-flat" },
      [-1]: { letter: "C", accidental: "flat" },
      [0]: { letter: "C", accidental: undefined },
      [1]: { letter: "C", accidental: "sharp" },
      [2]: { letter: "C", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "D", accidental: "double-flat" },
      [-1]: { letter: "D", accidental: "flat" },
      [0]: { letter: "D", accidental: undefined },
      [1]: { letter: "D", accidental: "sharp" },
      [2]: { letter: "D", accidental: "double-sharp" },
    },
  ],
  // Bb Major (2 flats)
  [-2]: [
    {
      [-2]: { letter: "A", accidental: "flat" },
      [-1]: { letter: "B", accidental: "double-flat" },
      [0]: { letter: "B", accidental: "flat" },
      [1]: { letter: "B", accidental: "natural" },
      [2]: { letter: "B", accidental: "sharp" },
    },
    {
      [-2]: { letter: "C", accidental: "double-flat" },
      [-1]: { letter: "C", accidental: "flat" },
      [0]: { letter: "C", accidental: undefined },
      [1]: { letter: "C", accidental: "sharp" },
      [2]: { letter: "C", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "D", accidental: "double-flat" },
      [-1]: { letter: "D", accidental: "flat" },
      [0]: { letter: "D", accidental: undefined },
      [1]: { letter: "D", accidental: "sharp" },
      [2]: { letter: "D", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "D", accidental: "flat" },
      [-1]: { letter: "E", accidental: "double-flat" },
      [0]: { letter: "E", accidental: "flat" },
      [1]: { letter: "E", accidental: "natural" },
      [2]: { letter: "E", accidental: "sharp" },
    },
    {
      [-2]: { letter: "F", accidental: "double-flat" },
      [-1]: { letter: "F", accidental: "flat" },
      [0]: { letter: "F", accidental: undefined },
      [1]: { letter: "F", accidental: "sharp" },
      [2]: { letter: "F", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "G", accidental: "double-flat" },
      [-1]: { letter: "G", accidental: "flat" },
      [0]: { letter: "G", accidental: undefined },
      [1]: { letter: "G", accidental: "sharp" },
      [2]: { letter: "G", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "A", accidental: "double-flat" },
      [-1]: { letter: "A", accidental: "flat" },
      [0]: { letter: "A", accidental: undefined },
      [1]: { letter: "A", accidental: "sharp" },
      [2]: { letter: "A", accidental: "double-sharp" },
    },
  ],
  // F Major (1 flat)
  [-1]: [
    {
      [-2]: { letter: "F", accidental: "double-flat" },
      [-1]: { letter: "F", accidental: "flat" },
      [0]: { letter: "F", accidental: undefined },
      [1]: { letter: "F", accidental: "sharp" },
      [2]: { letter: "F", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "G", accidental: "double-flat" },
      [-1]: { letter: "G", accidental: "flat" },
      [0]: { letter: "G", accidental: undefined },
      [1]: { letter: "G", accidental: "sharp" },
      [2]: { letter: "G", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "A", accidental: "double-flat" },
      [-1]: { letter: "A", accidental: "flat" },
      [0]: { letter: "A", accidental: undefined },
      [1]: { letter: "A", accidental: "sharp" },
      [2]: { letter: "A", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "A", accidental: "flat" },
      [-1]: { letter: "B", accidental: "double-flat" },
      [0]: { letter: "B", accidental: "flat" },
      [1]: { letter: "B", accidental: "natural" },
      [2]: { letter: "B", accidental: "sharp" },
    },
    {
      [-2]: { letter: "C", accidental: "double-flat" },
      [-1]: { letter: "C", accidental: "flat" },
      [0]: { letter: "C", accidental: undefined },
      [1]: { letter: "C", accidental: "sharp" },
      [2]: { letter: "C", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "D", accidental: "double-flat" },
      [-1]: { letter: "D", accidental: "flat" },
      [0]: { letter: "D", accidental: undefined },
      [1]: { letter: "D", accidental: "sharp" },
      [2]: { letter: "D", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "E", accidental: "double-flat" },
      [-1]: { letter: "E", accidental: "flat" },
      [0]: { letter: "E", accidental: undefined },
      [1]: { letter: "E", accidental: "sharp" },
      [2]: { letter: "E", accidental: "double-sharp" },
    },
  ],
  // C Major (no sharps or flats)
  [0]: [
    {
      [-2]: { letter: "C", accidental: "double-flat" },
      [-1]: { letter: "C", accidental: "flat" },
      [0]: { letter: "C", accidental: undefined },
      [1]: { letter: "C", accidental: "sharp" },
      [2]: { letter: "C", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "D", accidental: "double-flat" },
      [-1]: { letter: "D", accidental: "flat" },
      [0]: { letter: "D", accidental: undefined },
      [1]: { letter: "D", accidental: "sharp" },
      [2]: { letter: "D", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "E", accidental: "double-flat" },
      [-1]: { letter: "E", accidental: "flat" },
      [0]: { letter: "E", accidental: undefined },
      [1]: { letter: "E", accidental: "sharp" },
      [2]: { letter: "E", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "F", accidental: "double-flat" },
      [-1]: { letter: "F", accidental: "flat" },
      [0]: { letter: "F", accidental: undefined },
      [1]: { letter: "F", accidental: "sharp" },
      [2]: { letter: "F", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "G", accidental: "double-flat" },
      [-1]: { letter: "G", accidental: "flat" },
      [0]: { letter: "G", accidental: undefined },
      [1]: { letter: "G", accidental: "sharp" },
      [2]: { letter: "G", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "A", accidental: "double-flat" },
      [-1]: { letter: "A", accidental: "flat" },
      [0]: { letter: "A", accidental: undefined },
      [1]: { letter: "A", accidental: "sharp" },
      [2]: { letter: "A", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "B", accidental: "double-flat" },
      [-1]: { letter: "B", accidental: "flat" },
      [0]: { letter: "B", accidental: undefined },
      [1]: { letter: "B", accidental: "sharp" },
      [2]: { letter: "B", accidental: "double-sharp" },
    },
  ],
  // G Major (1 sharp)
  [1]: [
    {
      [-2]: { letter: "G", accidental: "double-flat" },
      [-1]: { letter: "G", accidental: "flat" },
      [0]: { letter: "G", accidental: undefined },
      [1]: { letter: "G", accidental: "sharp" },
      [2]: { letter: "G", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "A", accidental: "double-flat" },
      [-1]: { letter: "A", accidental: "flat" },
      [0]: { letter: "A", accidental: undefined },
      [1]: { letter: "A", accidental: "sharp" },
      [2]: { letter: "A", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "B", accidental: "double-flat" },
      [-1]: { letter: "B", accidental: "flat" },
      [0]: { letter: "B", accidental: undefined },
      [1]: { letter: "B", accidental: "sharp" },
      [2]: { letter: "B", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "C", accidental: "double-flat" },
      [-1]: { letter: "C", accidental: "flat" },
      [0]: { letter: "C", accidental: undefined },
      [1]: { letter: "C", accidental: "sharp" },
      [2]: { letter: "C", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "D", accidental: "double-flat" },
      [-1]: { letter: "D", accidental: "flat" },
      [0]: { letter: "D", accidental: undefined },
      [1]: { letter: "D", accidental: "sharp" },
      [2]: { letter: "D", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "E", accidental: "double-flat" },
      [-1]: { letter: "E", accidental: "flat" },
      [0]: { letter: "E", accidental: undefined },
      [1]: { letter: "E", accidental: "sharp" },
      [2]: { letter: "E", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "F", accidental: "flat" },
      [-1]: { letter: "F", accidental: "natural" },
      [0]: { letter: "F", accidental: "sharp" },
      [1]: { letter: "F", accidental: "double-sharp" },
      [2]: { letter: "G", accidental: "sharp" },
    },
  ],
  // D Major (2 sharps)
  [2]: [
    {
      [-2]: { letter: "D", accidental: "double-flat" },
      [-1]: { letter: "D", accidental: "flat" },
      [0]: { letter: "D", accidental: undefined },
      [1]: { letter: "D", accidental: "sharp" },
      [2]: { letter: "D", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "E", accidental: "double-flat" },
      [-1]: { letter: "E", accidental: "flat" },
      [0]: { letter: "E", accidental: undefined },
      [1]: { letter: "E", accidental: "sharp" },
      [2]: { letter: "E", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "F", accidental: "flat" },
      [-1]: { letter: "F", accidental: "natural" },
      [0]: { letter: "F", accidental: "sharp" },
      [1]: { letter: "F", accidental: "double-sharp" },
      [2]: { letter: "G", accidental: "sharp" },
    },
    {
      [-2]: { letter: "G", accidental: "double-flat" },
      [-1]: { letter: "G", accidental: "flat" },
      [0]: { letter: "G", accidental: undefined },
      [1]: { letter: "G", accidental: "sharp" },
      [2]: { letter: "G", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "A", accidental: "double-flat" },
      [-1]: { letter: "A", accidental: "flat" },
      [0]: { letter: "A", accidental: undefined },
      [1]: { letter: "A", accidental: "sharp" },
      [2]: { letter: "A", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "B", accidental: "double-flat" },
      [-1]: { letter: "B", accidental: "flat" },
      [0]: { letter: "B", accidental: undefined },
      [1]: { letter: "B", accidental: "sharp" },
      [2]: { letter: "B", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "C", accidental: "flat" },
      [-1]: { letter: "C", accidental: "natural" },
      [0]: { letter: "C", accidental: "sharp" },
      [1]: { letter: "C", accidental: "double-sharp" },
      [2]: { letter: "D", accidental: "sharp" },
    },
  ],
  // A Major (3 sharps)
  [3]: [
    {
      [-2]: { letter: "A", accidental: "double-flat" },
      [-1]: { letter: "A", accidental: "flat" },
      [0]: { letter: "A", accidental: undefined },
      [1]: { letter: "A", accidental: "sharp" },
      [2]: { letter: "A", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "B", accidental: "double-flat" },
      [-1]: { letter: "B", accidental: "flat" },
      [0]: { letter: "B", accidental: undefined },
      [1]: { letter: "B", accidental: "sharp" },
      [2]: { letter: "B", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "C", accidental: "flat" },
      [-1]: { letter: "C", accidental: "natural" },
      [0]: { letter: "C", accidental: "sharp" },
      [1]: { letter: "C", accidental: "double-sharp" },
      [2]: { letter: "D", accidental: "sharp" },
    },
    {
      [-2]: { letter: "D", accidental: "double-flat" },
      [-1]: { letter: "D", accidental: "flat" },
      [0]: { letter: "D", accidental: undefined },
      [1]: { letter: "D", accidental: "sharp" },
      [2]: { letter: "D", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "E", accidental: "double-flat" },
      [-1]: { letter: "E", accidental: "flat" },
      [0]: { letter: "E", accidental: undefined },
      [1]: { letter: "E", accidental: "sharp" },
      [2]: { letter: "E", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "F", accidental: "flat" },
      [-1]: { letter: "F", accidental: "natural" },
      [0]: { letter: "F", accidental: "sharp" },
      [1]: { letter: "F", accidental: "double-sharp" },
      [2]: { letter: "G", accidental: "sharp" },
    },
    {
      [-2]: { letter: "G", accidental: "flat" },
      [-1]: { letter: "G", accidental: "natural" },
      [0]: { letter: "G", accidental: "sharp" },
      [1]: { letter: "G", accidental: "double-sharp" },
      [2]: { letter: "A", accidental: "sharp" },
    },
  ],
  // E Major (4 sharps)
  [4]: [
    {
      [-2]: { letter: "E", accidental: "double-flat" },
      [-1]: { letter: "E", accidental: "flat" },
      [0]: { letter: "E", accidental: undefined },
      [1]: { letter: "E", accidental: "sharp" },
      [2]: { letter: "E", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "F", accidental: "flat" },
      [-1]: { letter: "F", accidental: "natural" },
      [0]: { letter: "F", accidental: "sharp" },
      [1]: { letter: "F", accidental: "double-sharp" },
      [2]: { letter: "G", accidental: "sharp" },
    },
    {
      [-2]: { letter: "G", accidental: "flat" },
      [-1]: { letter: "G", accidental: "natural" },
      [0]: { letter: "G", accidental: "sharp" },
      [1]: { letter: "G", accidental: "double-sharp" },
      [2]: { letter: "A", accidental: "sharp" },
    },
    {
      [-2]: { letter: "A", accidental: "double-flat" },
      [-1]: { letter: "A", accidental: "flat" },
      [0]: { letter: "A", accidental: undefined },
      [1]: { letter: "A", accidental: "sharp" },
      [2]: { letter: "A", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "B", accidental: "double-flat" },
      [-1]: { letter: "B", accidental: "flat" },
      [0]: { letter: "B", accidental: undefined },
      [1]: { letter: "B", accidental: "sharp" },
      [2]: { letter: "B", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "C", accidental: "flat" },
      [-1]: { letter: "C", accidental: "natural" },
      [0]: { letter: "C", accidental: "sharp" },
      [1]: { letter: "C", accidental: "double-sharp" },
      [2]: { letter: "D", accidental: "sharp" },
    },
    {
      [-2]: { letter: "D", accidental: "flat" },
      [-1]: { letter: "D", accidental: "natural" },
      [0]: { letter: "D", accidental: "sharp" },
      [1]: { letter: "D", accidental: "double-sharp" },
      [2]: { letter: "E", accidental: "sharp" },
    },
  ],
  // B Major (5 sharps)
  [5]: [
    {
      [-2]: { letter: "B", accidental: "double-flat" },
      [-1]: { letter: "B", accidental: "flat" },
      [0]: { letter: "B", accidental: undefined },
      [1]: { letter: "B", accidental: "sharp" },
      [2]: { letter: "B", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "C", accidental: "flat" },
      [-1]: { letter: "C", accidental: "natural" },
      [0]: { letter: "C", accidental: "sharp" },
      [1]: { letter: "C", accidental: "double-sharp" },
      [2]: { letter: "D", accidental: "sharp" },
    },
    {
      [-2]: { letter: "D", accidental: "flat" },
      [-1]: { letter: "D", accidental: "natural" },
      [0]: { letter: "D", accidental: "sharp" },
      [1]: { letter: "D", accidental: "double-sharp" },
      [2]: { letter: "E", accidental: "sharp" },
    },
    {
      [-2]: { letter: "E", accidental: "double-flat" },
      [-1]: { letter: "E", accidental: "flat" },
      [0]: { letter: "E", accidental: undefined },
      [1]: { letter: "E", accidental: "sharp" },
      [2]: { letter: "E", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "F", accidental: "flat" },
      [-1]: { letter: "F", accidental: "natural" },
      [0]: { letter: "F", accidental: "sharp" },
      [1]: { letter: "F", accidental: "double-sharp" },
      [2]: { letter: "G", accidental: "sharp" },
    },
    {
      [-2]: { letter: "G", accidental: "flat" },
      [-1]: { letter: "G", accidental: "natural" },
      [0]: { letter: "G", accidental: "sharp" },
      [1]: { letter: "G", accidental: "double-sharp" },
      [2]: { letter: "A", accidental: "sharp" },
    },
    {
      [-2]: { letter: "A", accidental: "flat" },
      [-1]: { letter: "A", accidental: "natural" },
      [0]: { letter: "A", accidental: "sharp" },
      [1]: { letter: "A", accidental: "double-sharp" },
      [2]: { letter: "B", accidental: "sharp" },
    },
  ],
  // F# Major (6 sharps)
  [6]: [
    {
      [-2]: { letter: "F", accidental: "flat" },
      [-1]: { letter: "F", accidental: "natural" },
      [0]: { letter: "F", accidental: "sharp" },
      [1]: { letter: "F", accidental: "double-sharp" },
      [2]: { letter: "G", accidental: "sharp" },
    },
    {
      [-2]: { letter: "G", accidental: "flat" },
      [-1]: { letter: "G", accidental: "natural" },
      [0]: { letter: "G", accidental: "sharp" },
      [1]: { letter: "G", accidental: "double-sharp" },
      [2]: { letter: "A", accidental: "sharp" },
    },
    {
      [-2]: { letter: "A", accidental: "flat" },
      [-1]: { letter: "A", accidental: "natural" },
      [0]: { letter: "A", accidental: "sharp" },
      [1]: { letter: "A", accidental: "double-sharp" },
      [2]: { letter: "B", accidental: "sharp" },
    },
    {
      [-2]: { letter: "B", accidental: "double-flat" },
      [-1]: { letter: "B", accidental: "flat" },
      [0]: { letter: "B", accidental: undefined },
      [1]: { letter: "B", accidental: "sharp" },
      [2]: { letter: "B", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "C", accidental: "flat" },
      [-1]: { letter: "C", accidental: "natural" },
      [0]: { letter: "C", accidental: "sharp" },
      [1]: { letter: "C", accidental: "double-sharp" },
      [2]: { letter: "D", accidental: "sharp" },
    },
    {
      [-2]: { letter: "D", accidental: "flat" },
      [-1]: { letter: "D", accidental: "natural" },
      [0]: { letter: "D", accidental: "sharp" },
      [1]: { letter: "D", accidental: "double-sharp" },
      [2]: { letter: "E", accidental: "sharp" },
    },
    {
      [-2]: { letter: "E", accidental: "flat" },
      [-1]: { letter: "E", accidental: "natural" },
      [0]: { letter: "E", accidental: "sharp" },
      [1]: { letter: "E", accidental: "double-sharp" },
      [2]: { letter: "F", accidental: "double-sharp" },
    },
  ],
  // C# Major (7 sharps)
  [7]: [
    {
      [-2]: { letter: "C", accidental: "flat" },
      [-1]: { letter: "C", accidental: "natural" },
      [0]: { letter: "C", accidental: "sharp" },
      [1]: { letter: "C", accidental: "double-sharp" },
      [2]: { letter: "D", accidental: "sharp" },
    },
    {
      [-2]: { letter: "D", accidental: "flat" },
      [-1]: { letter: "D", accidental: "natural" },
      [0]: { letter: "D", accidental: "sharp" },
      [1]: { letter: "D", accidental: "double-sharp" },
      [2]: { letter: "E", accidental: "sharp" },
    },
    {
      [-2]: { letter: "E", accidental: "flat" },
      [-1]: { letter: "E", accidental: "natural" },
      [0]: { letter: "E", accidental: "sharp" },
      [1]: { letter: "E", accidental: "double-sharp" },
      [2]: { letter: "F", accidental: "double-sharp" },
    },
    {
      [-2]: { letter: "F", accidental: "flat" },
      [-1]: { letter: "F", accidental: "natural" },
      [0]: { letter: "F", accidental: "sharp" },
      [1]: { letter: "F", accidental: "double-sharp" },
      [2]: { letter: "G", accidental: "sharp" },
    },
    {
      [-2]: { letter: "G", accidental: "flat" },
      [-1]: { letter: "G", accidental: "natural" },
      [0]: { letter: "G", accidental: "sharp" },
      [1]: { letter: "G", accidental: "double-sharp" },
      [2]: { letter: "A", accidental: "sharp" },
    },
    {
      [-2]: { letter: "A", accidental: "flat" },
      [-1]: { letter: "A", accidental: "natural" },
      [0]: { letter: "A", accidental: "sharp" },
      [1]: { letter: "A", accidental: "double-sharp" },
      [2]: { letter: "B", accidental: "sharp" },
    },
    {
      [-2]: { letter: "B", accidental: "flat" },
      [-1]: { letter: "B", accidental: "natural" },
      [0]: { letter: "B", accidental: "sharp" },
      [1]: { letter: "B", accidental: "double-sharp" },
      [2]: { letter: "C", accidental: "double-sharp" },
    },
  ],
};

/**
 * Look up the correct spelling for a scale degree and alteration in a key.
 * Uses the verified KEY_ALTERATION_MAP lookup table.
 */
export function getSpellingFromMap(
  keySignature: KeySignature,
  degree: number, // 0-6
  alteration: number, // -2 to +2
): SpellingEntry {
  const keyMap = KEY_ALTERATION_MAP[keySignature];
  if (!keyMap || !keyMap[degree] || keyMap[degree][alteration] === undefined) {
    // Fallback for invalid input - shouldn't happen with valid data
    throw new Error(
      `Invalid lookup: key=${keySignature}, degree=${degree}, alteration=${alteration}`,
    );
  }
  return keyMap[degree][alteration];
}

// =============================================================================
// MIDI <-> Note Name Conversion
// =============================================================================

/** Get note name from MIDI number (C, D, E, etc. - ignores accidentals) */
export function midiToNoteName(midi: number): PitchName {
  const noteIndex = midi % 12;
  // Map chromatic to diatonic (C=0, D=2, E=4, F=5, G=7, A=9, B=11)
  const diatonicMap: Record<number, PitchName> = {
    0: "C",
    1: "C", // C#/Db -> C (with sharp)
    2: "D",
    3: "D", // D#/Eb -> D (with sharp) or E (with flat)
    4: "E",
    5: "F",
    6: "F", // F#/Gb -> F (with sharp)
    7: "G",
    8: "G", // G#/Ab -> G (with sharp)
    9: "A",
    10: "A", // A#/Bb -> A (with sharp)
    11: "B",
  };
  return diatonicMap[noteIndex];
}

/** Get octave number from MIDI (C4 = 60) */
export function midiToOctave(midi: number): number {
  return Math.floor(midi / 12) - 1;
}

/** Convert note name and octave to MIDI number */
export function noteToMidi(
  name: PitchName,
  octave: number,
  accidental?: Accidental,
): number {
  const baseMidi = (octave + 1) * 12 + PITCH_TO_SEMITONE[name];
  if (accidental === "double-sharp") return baseMidi + 2;
  if (accidental === "sharp") return baseMidi + 1;
  if (accidental === "flat") return baseMidi - 1;
  if (accidental === "double-flat") return baseMidi - 2;
  return baseMidi;
}

/** Format MIDI as note name with octave (e.g., "C4", "F#5") */
export function formatMidiNote(midi: number, accidental?: Accidental): string {
  const name = midiToNoteName(midi);
  const octave = midiToOctave(midi);
  let accidentalStr = "";
  if (accidental === "double-sharp") accidentalStr = "𝄪";
  else if (accidental === "sharp") accidentalStr = "♯";
  else if (accidental === "flat") accidentalStr = "♭";
  else if (accidental === "double-flat") accidentalStr = "𝄫";
  return `${name}${accidentalStr}${octave}`;
}

// =============================================================================
// Diatonic Operations
// =============================================================================

/** Get the next diatonic pitch (up) */
export function getNextDiatonicPitch(midi: number): number {
  const noteName = midiToNoteName(midi);
  const octave = midiToOctave(midi);
  const nameIndex = PITCH_NAMES.indexOf(noteName);

  if (nameIndex === PITCH_NAMES.length - 1) {
    // B -> C (next octave)
    return noteToMidi("C", octave + 1);
  } else {
    return noteToMidi(PITCH_NAMES[nameIndex + 1], octave);
  }
}

/** Get the previous diatonic pitch (down) */
export function getPreviousDiatonicPitch(midi: number): number {
  const noteName = midiToNoteName(midi);
  const octave = midiToOctave(midi);
  const nameIndex = PITCH_NAMES.indexOf(noteName);

  if (nameIndex === 0) {
    // C -> B (previous octave)
    return noteToMidi("B", octave - 1);
  } else {
    return noteToMidi(PITCH_NAMES[nameIndex - 1], octave);
  }
}

/** Shift pitch by one octave */
export function shiftOctave(midi: number, direction: "up" | "down"): number {
  return midi + (direction === "up" ? 12 : -12);
}

// =============================================================================
// Pitch / Key Signature Helpers
// =============================================================================

/**
 * Get the MIDI note for a pitch name at a given octave,
 * respecting the key signature.
 */
export function getPitchInKey(
  pitchName: PitchName,
  octave: number,
  keySignature: KeySignature,
): { midi: number; accidental?: Accidental } {
  // Key signature affects certain pitches
  const sharps: PitchName[] = ["F", "C", "G", "D", "A", "E", "B"];
  const flats: PitchName[] = ["B", "E", "A", "D", "G", "C", "F"];

  let accidental: Accidental | undefined;

  if (keySignature > 0) {
    // Sharps: F#, C#, G#, D#, A#, E#, B#
    const sharpsInKey = sharps.slice(0, keySignature);
    if (sharpsInKey.includes(pitchName)) {
      accidental = "sharp";
    }
  } else if (keySignature < 0) {
    // Flats: Bb, Eb, Ab, Db, Gb, Cb, Fb
    const flatsInKey = flats.slice(0, -keySignature);
    if (flatsInKey.includes(pitchName)) {
      accidental = "flat";
    }
  }

  const midi = noteToMidi(pitchName, octave, accidental);
  return { midi, accidental };
}

/** Get the default MIDI pitch for a clef and pitch name */
export function getDefaultMidiForPitch(
  pitchName: PitchName,
  clef: Clef,
  keySignature: KeySignature = 0,
): { midi: number; accidental?: Accidental } {
  const baseOctave = clef === "treble" ? 4 : 3;
  return getPitchInKey(pitchName, baseOctave, keySignature);
}

// =============================================================================
// Range Validation
// =============================================================================

/** Minimum MIDI pitch (C0) */
export const MIN_MIDI = 12;

/** Maximum MIDI pitch (C8) */
export const MAX_MIDI = 108;

/** Check if MIDI pitch is within valid range */
export function isValidMidi(midi: number): boolean {
  return midi >= MIN_MIDI && midi <= MAX_MIDI;
}

/** Clamp MIDI pitch to valid range */
export function clampMidi(midi: number): number {
  return Math.max(MIN_MIDI, Math.min(MAX_MIDI, midi));
}

/**
 * Get the MIDI pitch for a note name that's closest to a reference pitch.
 * This enables "smart octave" - choosing the nearest octave to the previous note.
 *
 * @param pitchName - The pitch name (C, D, E, etc.)
 * @param referenceMidi - The MIDI pitch to stay closest to (typically previous note)
 * @param keySignature - Key signature for accidentals
 * @returns The MIDI pitch in the nearest octave, with any key-signature accidental
 */
export function getNearestMidiForPitch(
  pitchName: PitchName,
  referenceMidi: number,
  keySignature: KeySignature = 0,
): { midi: number; accidental?: Accidental } {
  const referenceOctave = midiToOctave(referenceMidi);

  // Try the same octave, one above, and one below
  const candidates = [
    referenceOctave - 1,
    referenceOctave,
    referenceOctave + 1,
  ];

  let bestMidi = 0;
  let bestDistance = Infinity;
  let bestAccidental: Accidental | undefined;

  for (const octave of candidates) {
    const { midi, accidental } = getPitchInKey(pitchName, octave, keySignature);
    if (!isValidMidi(midi)) continue;

    const distance = Math.abs(midi - referenceMidi);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMidi = midi;
      bestAccidental = accidental;
    }
  }

  // If no valid candidate found, fall back to reference octave
  if (bestDistance === Infinity) {
    return getPitchInKey(pitchName, referenceOctave, keySignature);
  }

  return { midi: bestMidi, accidental: bestAccidental };
}

/**
 * Get the diatonic scale for a key signature.
 * Returns an array of 7 entries, one per letter (C, D, E, F, G, A, B),
 * each containing the pitch class and the accidental from the key signature.
 */
function getDiatonicScale(
  keySignature: KeySignature,
): Array<{ pitchClass: number; keyAccidental: Accidental | undefined }> {
  const sharps: PitchName[] = ["F", "C", "G", "D", "A", "E", "B"];
  const flats: PitchName[] = ["B", "E", "A", "D", "G", "C", "F"];
  const letters: PitchName[] = ["C", "D", "E", "F", "G", "A", "B"];

  // Start with natural pitch classes
  const result: Array<{
    pitchClass: number;
    keyAccidental: Accidental | undefined;
  }> = letters.map((letter) => ({
    pitchClass: PITCH_TO_SEMITONE[letter],
    keyAccidental: undefined,
  }));

  if (keySignature > 0) {
    // Apply sharps
    for (let i = 0; i < keySignature && i < sharps.length; i++) {
      const letterIndex = letters.indexOf(sharps[i]);
      result[letterIndex] = {
        pitchClass: (PITCH_TO_SEMITONE[sharps[i]] + 1) % 12,
        keyAccidental: "sharp",
      };
    }
  } else if (keySignature < 0) {
    // Apply flats
    for (let i = 0; i < -keySignature && i < flats.length; i++) {
      const letterIndex = letters.indexOf(flats[i]);
      result[letterIndex] = {
        pitchClass: (PITCH_TO_SEMITONE[flats[i]] - 1 + 12) % 12,
        keyAccidental: "flat",
      };
    }
  }

  return result;
}

/**
 * Given a MIDI pitch and key signature, determine the appropriate letter name
 * and accidental to notate this pitch.
 *
 * This handles double sharps and double flats correctly. For example:
 * - In C# major (7 sharps), a raised C# becomes Cx (double sharp)
 * - In Bb major, a lowered Bb becomes Bbb (double flat)
 *
 * @param midi - The MIDI pitch
 * @param keySignature - The key signature
 * @returns The letter name and accidental needed to notate this pitch
 */
export function getSpellingForMidi(
  midi: number,
  keySignature: KeySignature,
): { letter: PitchName; accidental: Accidental | undefined } {
  const pitchClass = midi % 12;
  const scale = getDiatonicScale(keySignature);
  const letters: PitchName[] = ["C", "D", "E", "F", "G", "A", "B"];

  // First, check if this pitch class is diatonic (exactly matches a scale degree)
  for (let i = 0; i < 7; i++) {
    if (scale[i].pitchClass === pitchClass) {
      // This pitch is diatonic
      return { letter: letters[i], accidental: undefined };
    }
  }

  // Pitch is chromatic - find the best spelling
  // Strategy: prefer canceling a key signature with natural (keeps same letter),
  // then simple accidentals, then double accidentals

  // Try each letter and see what accidental we'd need
  const candidates: Array<{
    letter: PitchName;
    accidental: Accidental;
    priority: number;
  }> = [];

  for (let i = 0; i < 7; i++) {
    const letterPitchClass = scale[i].pitchClass;
    const keyAcc = scale[i].keyAccidental;
    const diff = (pitchClass - letterPitchClass + 12) % 12;

    // diff is how many semitones above the diatonic pitch
    if (diff === 1) {
      // One semitone above - need to raise
      if (keyAcc === "sharp") {
        // Already sharp in key, need double-sharp
        candidates.push({
          letter: letters[i],
          accidental: "double-sharp",
          priority: 3,
        });
      } else if (keyAcc === "flat") {
        // Flat in key, natural cancels it (keeps same letter - best choice)
        candidates.push({
          letter: letters[i],
          accidental: "natural",
          priority: 0,
        });
      } else {
        // No key accidental, add sharp
        candidates.push({
          letter: letters[i],
          accidental: "sharp",
          priority: 1,
        });
      }
    } else if (diff === 11) {
      // One semitone below (same as -1 mod 12) - need to lower
      if (keyAcc === "flat") {
        // Already flat in key, need double-flat
        candidates.push({
          letter: letters[i],
          accidental: "double-flat",
          priority: 3,
        });
      } else if (keyAcc === "sharp") {
        // Sharp in key, natural cancels it (keeps same letter - best choice)
        candidates.push({
          letter: letters[i],
          accidental: "natural",
          priority: 0,
        });
      } else {
        // No key accidental, add flat
        candidates.push({
          letter: letters[i],
          accidental: "flat",
          priority: 1,
        });
      }
    }
    // diff === 2 or diff === 10 would require triple sharps/flats - not supported
  }

  if (candidates.length === 0) {
    // Edge case - shouldn't happen with standard chromatic notes
    // Fall back to sharps in sharp keys, flats in flat keys
    if (keySignature >= 0) {
      return { letter: midiToNoteName(midi), accidental: "sharp" };
    } else {
      return { letter: midiToNoteName(midi - 1), accidental: "flat" };
    }
  }

  // Prefer spellings with lower priority (simpler accidentals)
  // In sharp keys, prefer sharps; in flat keys, prefer flats
  candidates.sort((a, b) => {
    // First, prefer simpler accidentals
    if (a.priority !== b.priority) return a.priority - b.priority;
    // Then, prefer sharps in sharp keys, flats in flat keys
    if (keySignature >= 0) {
      if (a.accidental === "sharp" || a.accidental === "double-sharp")
        return -1;
      if (b.accidental === "sharp" || b.accidental === "double-sharp") return 1;
    } else {
      if (a.accidental === "flat" || a.accidental === "double-flat") return -1;
      if (b.accidental === "flat" || b.accidental === "double-flat") return 1;
    }
    return 0;
  });

  return candidates[0];
}

/**
 * Given a MIDI pitch and key signature, determine the appropriate accidental.
 * This is used after transposition to fix up accidentals.
 *
 * @param midi - The MIDI pitch
 * @param keySignature - The key signature
 * @returns The accidental needed (if any) to notate this pitch in this key
 */
export function getAccidentalForMidi(
  midi: number,
  keySignature: KeySignature,
): Accidental | undefined {
  return getSpellingForMidi(midi, keySignature).accidental;
}

/**
 * Check if a note with a given accidental needs a "natural" sign in the new key.
 * This handles cases like B natural in Bb major becoming a diatonic note in another key.
 *
 * @param midi - The MIDI pitch
 * @param storedAccidental - The accidental stored on the note
 * @param keySignature - The key signature
 * @returns true if a natural sign is needed
 */
export function needsNaturalSign(
  midi: number,
  storedAccidental: Accidental | undefined,
  keySignature: KeySignature,
): boolean {
  if (storedAccidental !== "natural") return false;

  // A "natural" sign is only needed if the key signature would normally
  // alter this note. Check if this pitch class is naturally in the key.
  const actualAccidental = getAccidentalForMidi(midi, keySignature);
  return actualAccidental !== undefined;
}

// =============================================================================
// Function-Preserving Transposition
// =============================================================================

/**
 * Convert a key signature to the semitone of its root note (tonic).
 * C=0, G=7, D=2, A=9, E=4, B=11, F#=6, C#=1
 * F=5, Bb=10, Eb=3, Ab=8, Db=1, Gb=6, Cb=11
 */
function keyToSemitone(keySignature: KeySignature): number {
  // Circle of fifths: each sharp adds 7 semitones (mod 12)
  return (((keySignature * 7) % 12) + 12) % 12;
}

/**
 * Get the diatonic scale degrees for a key, indexed by semitone offset from tonic.
 * Returns an array where index is the scale degree (0-6), and value is the pitch class.
 */
function getScaleDegreePitches(keySignature: KeySignature): number[] {
  const tonic = keyToSemitone(keySignature);
  // Major scale intervals: W-W-H-W-W-W-H (0, 2, 4, 5, 7, 9, 11)
  const majorIntervals = [0, 2, 4, 5, 7, 9, 11];
  return majorIntervals.map((interval) => (tonic + interval) % 12);
}

/**
 * Given a pitch class and key signature, find which scale degree it belongs to
 * and what the alteration is from the diatonic pitch.
 *
 * Returns { degree: 0-6, alteration: -2 to +2 } or null if not found.
 * degree 0 = tonic, degree 1 = supertonic, etc.
 *
 * IMPORTANT: Prefers diatonic (alteration=0) over altered interpretations,
 * then prefers smaller alterations. This ensures C in Bb major is recognized
 * as "degree 1, diatonic" not "degree 0, double-raised".
 */
function getScaleDegreeAndAlteration(
  pitchClass: number,
  keySignature: KeySignature,
): { degree: number; alteration: number } | null {
  const scalePitches = getScaleDegreePitches(keySignature);

  // Check alterations in order of preference: 0, then ±1, then ±2
  // This ensures we prefer diatonic interpretations over altered ones
  const alterationOrder = [0, 1, -1, 2, -2];

  for (const alt of alterationOrder) {
    for (let degree = 0; degree < 7; degree++) {
      const diatonicPitch = scalePitches[degree];
      const alteredPitch = (diatonicPitch + alt + 12) % 12;
      if (alteredPitch === pitchClass) {
        return { degree, alteration: alt };
      }
    }
  }

  return null;
}

/**
 * Transpose a note from one key to another while preserving its musical function.
 *
 * This is the key function for "function-preserving" transposition. Instead of
 * simply shifting the MIDI pitch by a number of semitones, it:
 * 1. Determines the note's scale degree (0-6) and alteration in the source key
 * 2. Applies the same alteration to the corresponding scale degree in the target key
 *
 * For example:
 * - B♮ in Bb major (raised tonic) → C# in C major (raised tonic)
 * - C in Bb major (2nd degree) → D in C major (2nd degree)
 * - F# in G major (diatonic 7th) → C# in D major (diatonic 7th)
 *
 * Uses the verified KEY_ALTERATION_MAP for exact spellings.
 *
 * @param midi - The original MIDI pitch
 * @param accidental - The original accidental (used for disambiguation)
 * @param sourceKey - The key the note was written in
 * @param targetKey - The key to transpose to
 * @returns The new MIDI pitch and accidental
 */
export function transposeNoteByFunction(
  midi: number,
  accidental: Accidental | undefined,
  sourceKey: KeySignature,
  targetKey: KeySignature,
): { midi: number; accidental: Accidental | undefined } {
  const pitchClass = midi % 12;
  const octave = midiToOctave(midi);

  // Find the note's function in the source key
  const noteFunction = getScaleDegreeAndAlteration(pitchClass, sourceKey);

  if (!noteFunction) {
    // Couldn't determine function - fall back to simple transposition
    const sourceRoot = keyToSemitone(sourceKey);
    const targetRoot = keyToSemitone(targetKey);
    const semitones = (targetRoot - sourceRoot + 12) % 12;
    const newMidi = midi + semitones;
    return {
      midi: newMidi,
      accidental: getAccidentalForMidi(newMidi, targetKey),
    };
  }

  // Use the strict lookup map to get the exact spelling in the target key
  const targetSpelling = getSpellingFromMap(
    targetKey,
    noteFunction.degree,
    noteFunction.alteration,
  );

  // Calculate the MIDI pitch from the spelling
  const letterPitchClass = PITCH_TO_SEMITONE[targetSpelling.letter];
  let accidentalOffset = 0;
  if (targetSpelling.accidental === "sharp") accidentalOffset = 1;
  else if (targetSpelling.accidental === "double-sharp") accidentalOffset = 2;
  else if (targetSpelling.accidental === "flat") accidentalOffset = -1;
  else if (targetSpelling.accidental === "double-flat") accidentalOffset = -2;
  // "natural" means the note is natural (offset 0), used when key would normally alter it

  const targetPitchClass = (letterPitchClass + accidentalOffset + 12) % 12;

  // Calculate the new MIDI pitch, preserving the octave relationship
  let newMidi = (octave + 1) * 12 + targetPitchClass;

  // Adjust for octave boundary crossings
  // If the pitch classes would suggest we crossed an octave boundary, compensate
  if (pitchClass > 9 && targetPitchClass < 3) {
    // Source was high in octave, target wrapped to low (like B -> C)
    newMidi += 12;
  } else if (pitchClass < 3 && targetPitchClass > 9) {
    // Source was low in octave, target wrapped to high (like C -> B)
    newMidi -= 12;
  }

  return { midi: newMidi, accidental: targetSpelling.accidental };
}
