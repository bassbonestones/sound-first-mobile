/**
 * Note utility functions shared across exercise components
 *
 * Centralizes pitch/note name parsing and conversion functions
 * that were previously duplicated across 20+ exercise files.
 */

/**
 * Parse a note name (e.g., "C#4") into its components
 * @param {string} noteName - Note name like "C4", "F#3", "Bb5"
 * @returns {{ letter: string, accidental: string, octave: number } | null}
 */
export function parseNoteName(noteName) {
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

/**
 * Convert a note name to its MIDI number
 * Middle C (C4) = 60
 * @param {string} noteName - Note name like "C4", "F#3"
 * @returns {number} MIDI note number (default 60 if invalid)
 */
export function noteToMidi(noteName) {
  const parsed = parseNoteName(noteName);
  if (!parsed) return 60;

  const letterIndex = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[
    parsed.letter
  ];
  let noteIndex = letterIndex;

  if (parsed.accidental === "#") noteIndex += 1;
  if (parsed.accidental === "b") noteIndex -= 1;

  return (parsed.octave + 1) * 12 + noteIndex;
}

/**
 * Convert a MIDI number to frequency in Hz
 * A4 (MIDI 69) = 440 Hz
 * @param {number} midi - MIDI note number
 * @returns {number} Frequency in Hz
 */
export function midiToFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Convert a note name directly to frequency
 * @param {string} noteName - Note name like "C4", "F#3"
 * @returns {number} Frequency in Hz
 */
export function noteToFrequency(noteName) {
  return midiToFrequency(noteToMidi(noteName));
}

/**
 * Get a display-friendly version of a note name
 * Converts # to ♯ and b to ♭
 * @param {string} noteName - Note name like "C#4", "Bb3"
 * @returns {string} Display name like "C♯4", "B♭3"
 */
export function formatNoteName(noteName) {
  if (!noteName) return "";
  return noteName.replace("#", "♯").replace("b", "♭");
}

/**
 * Common note frequencies lookup table (for quick reference)
 * Useful when you need specific note frequencies without calculation
 */
export const NOTE_FREQUENCIES = {
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
