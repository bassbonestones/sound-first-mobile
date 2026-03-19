/**
 * Pitch Utilities
 *
 * Functions for working with MIDI pitches and musical note names.
 */

import type { Accidental, Clef, KeySignature, PitchName } from "../types";
import { DEFAULT_OCTAVE_MIDI, PITCH_NAMES, PITCH_TO_SEMITONE } from "../types";

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
  if (accidental === "sharp") return baseMidi + 1;
  if (accidental === "flat") return baseMidi - 1;
  return baseMidi;
}

/** Format MIDI as note name with octave (e.g., "C4", "F#5") */
export function formatMidiNote(midi: number, accidental?: Accidental): string {
  const name = midiToNoteName(midi);
  const octave = midiToOctave(midi);
  const accidentalStr =
    accidental === "sharp" ? "♯" : accidental === "flat" ? "♭" : "";
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
