/**
 * PitchDrone constants and utilities
 * Extracted for reusability
 */

/**
 * Musical note definition
 */
export interface NoteDefinition {
  name: string;
  enharmonic: string;
  semitone: number;
}

/**
 * Musical notes with enharmonic spellings
 */
export const NOTES: readonly NoteDefinition[] = [
  { name: "C", enharmonic: "B♯/C", semitone: 0 },
  { name: "C#", enharmonic: "C♯/D♭", semitone: 1 },
  { name: "D", enharmonic: "D", semitone: 2 },
  { name: "D#", enharmonic: "D♯/E♭", semitone: 3 },
  { name: "E", enharmonic: "E/F♭", semitone: 4 },
  { name: "F", enharmonic: "E♯/F", semitone: 5 },
  { name: "F#", enharmonic: "F♯/G♭", semitone: 6 },
  { name: "G", enharmonic: "G", semitone: 7 },
  { name: "G#", enharmonic: "G♯/A♭", semitone: 8 },
  { name: "A", enharmonic: "A", semitone: 9 },
  { name: "A#", enharmonic: "A♯/B♭", semitone: 10 },
  { name: "B", enharmonic: "B/C♭", semitone: 11 },
];

/**
 * Octave colors - contrasting adjacent colors for visual distinction
 */
export const OCTAVE_COLORS: Record<number, string> = {
  1: "#E74C3C", // Red
  2: "#3498DB", // Blue
  3: "#F39C12", // Orange
  4: "#9B59B6", // Purple
  5: "#2ECC71", // Green
  6: "#E91E63", // Pink
  7: "#00BCD4", // Cyan
  8: "#FF5722", // Deep Orange
  9: "#8BC34A", // Light Green
};

/**
 * Just intonation ratios (relative to the root)
 * Used for pure interval tuning
 */
export const JUST_RATIOS: Record<number, number> = {
  0: 1, // Unison
  1: 16 / 15, // Minor second
  2: 9 / 8, // Major second
  3: 6 / 5, // Minor third
  4: 5 / 4, // Major third
  5: 4 / 3, // Perfect fourth
  6: 45 / 32, // Tritone (augmented fourth)
  7: 3 / 2, // Perfect fifth
  8: 8 / 5, // Minor sixth
  9: 5 / 3, // Major sixth
  10: 9 / 5, // Minor seventh
  11: 15 / 8, // Major seventh
};

/**
 * Calculate frequency using equal temperament
 * @param semitone - Semitone offset from C (0-11)
 * @param octave - Octave number
 * @param concertA - Concert A frequency (default 440)
 * @returns Frequency in Hz
 */
export function calculateEqualTemperamentFrequency(
  semitone: number,
  octave: number,
  concertA: number = 440,
): number {
  // A4 = concertA Hz, MIDI note 69
  // C4 has semitone 0 in octave 4, which is MIDI 60
  const midiNote = (octave + 1) * 12 + semitone;
  return concertA * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * Calculate frequency using just intonation
 * @param semitone - Semitone offset from C (0-11)
 * @param octave - Octave number
 * @param pitchCenter - Root note semitone (0-11)
 * @param concertA - Concert A frequency (default 440)
 * @returns Frequency in Hz
 */
export function calculateJustIntonationFrequency(
  semitone: number,
  octave: number,
  pitchCenter: number,
  concertA: number = 440,
): number {
  // Get interval from pitch center
  const interval = (semitone - pitchCenter + 12) % 12;
  const ratio = JUST_RATIOS[interval];

  // Calculate root frequency (pitch center in the current octave)
  const rootMidi = (octave + 1) * 12 + pitchCenter;
  const rootFreq = concertA * Math.pow(2, (rootMidi - 69) / 12);

  return rootFreq * ratio;
}

/**
 * Get note name by semitone
 * @param semitone - Semitone offset (0-11)
 * @returns Note name
 */
export function getNoteNameBySemitone(semitone: number): string {
  const note = NOTES.find((n) => n.semitone === semitone);
  return note ? note.name : "?";
}

/**
 * Get octave color
 * @param octave - Octave number
 * @returns Color hex code
 */
export function getOctaveColor(octave: number): string {
  return OCTAVE_COLORS[octave] || "#666666";
}
