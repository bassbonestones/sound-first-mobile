/**
 * Note utility functions shared across exercise components
 *
 * Centralizes pitch/note name parsing and conversion functions
 * that were previously duplicated across 20+ exercise files.
 */

/**
 * Parsed note name components
 */
export interface ParsedNote {
  letter: string;
  accidental: string;
  octave: number;
}

/**
 * Parse a note name (e.g., "C#4") into its components
 */
export function parseNoteName(noteName: string): ParsedNote | null {
  if (!noteName) return null;
  const match = noteName.match(/^([A-Ga-g])([#b]?)(\d)$/);
  if (!match) return null;
  const [, letter, accidental, octaveStr] = match;
  return {
    letter: letter.toUpperCase(),
    accidental,
    octave: parseInt(octaveStr, 10),
  };
}

const LETTER_INDEX: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/**
 * Convert a note name to its MIDI number
 * Middle C (C4) = 60
 */
export function noteToMidi(noteName: string): number {
  const parsed = parseNoteName(noteName);
  if (!parsed) return 60;

  const letterIndex = LETTER_INDEX[parsed.letter];
  let noteIndex = letterIndex;

  if (parsed.accidental === "#") noteIndex += 1;
  if (parsed.accidental === "b") noteIndex -= 1;

  return (parsed.octave + 1) * 12 + noteIndex;
}

/**
 * Convert a MIDI number to frequency in Hz
 * A4 (MIDI 69) = 440 Hz
 */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Convert a note name directly to frequency
 */
export function noteToFrequency(noteName: string): number {
  return midiToFrequency(noteToMidi(noteName));
}

/**
 * Get a display-friendly version of a note name
 * Converts # to ♯ and b to ♭
 */
export function formatNoteName(noteName: string): string {
  if (!noteName) return "";
  return noteName.replace("#", "♯").replace("b", "♭");
}

/**
 * Common note frequencies lookup table (for quick reference)
 */
export const NOTE_FREQUENCIES: Record<string, number> = {
  C4: 261.63,
  "C#4": 277.18,
  D4: 293.66,
  "D#4": 311.13,
  E4: 329.63,
  F4: 349.23,
  "F#4": 369.99,
  G4: 392.0,
  "G#4": 415.3,
  A4: 440.0,
  "A#4": 466.16,
  B4: 493.88,
  C5: 523.25,
};

/**
 * Chromatic note names (sharp notation)
 */
export const CHROMATIC_NOTES: readonly string[] = [
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
 * Flat equivalents for sharp notes
 */
export const FLAT_EQUIVALENTS: Record<string, string> = {
  "C#": "Db",
  "D#": "Eb",
  "F#": "Gb",
  "G#": "Ab",
  "A#": "Bb",
};

/**
 * Sharp equivalents for flat notes
 */
export const SHARP_EQUIVALENTS: Record<string, string> = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};

/**
 * Convert MIDI number to note name
 */
export function midiToNote(midi: number, preferFlats = true): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  let noteName = CHROMATIC_NOTES[noteIndex];
  if (preferFlats && FLAT_EQUIVALENTS[noteName]) {
    noteName = FLAT_EQUIVALENTS[noteName];
  }
  return `${noteName}${octave}`;
}

/**
 * Determine if sharps should be used based on the root note
 * Sharp keys: G, D, A, E, B, F#, C#
 */
export function shouldUseSharps(noteName: string): boolean {
  if (!noteName) return false;
  if (noteName.includes("#")) return true;
  const letter = noteName.charAt(0).toUpperCase();
  const sharpRoots = ["G", "D", "A", "E", "B"];
  return sharpRoots.includes(letter);
}

/**
 * Convert MIDI to note name with context-aware sharp/flat choice
 */
export function midiToNoteInContext(
  midi: number,
  referenceNote: string,
): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  const sharpName = CHROMATIC_NOTES[noteIndex];
  const flatName = FLAT_EQUIVALENTS[sharpName] || sharpName;

  // If it's a natural note, just return it
  if (sharpName === flatName) {
    return `${sharpName}${octave}`;
  }

  // Use sharps if the reference suggests it
  const useSharp = shouldUseSharps(referenceNote);
  return useSharp ? `${sharpName}${octave}` : `${flatName}${octave}`;
}
