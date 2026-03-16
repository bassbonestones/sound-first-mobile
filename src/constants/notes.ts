/**
 * Note Constants
 *
 * Musical note names, frequencies, and pitch detection helpers.
 */

// Types
export type NoteName =
  | "C"
  | "C#"
  | "D"
  | "D#"
  | "E"
  | "F"
  | "F#"
  | "G"
  | "G#"
  | "A"
  | "A#"
  | "B";
export type AccidentalStyle = "sharp" | "flat";

export interface ParsedNoteName {
  letter: string;
  accidental: string;
  octave: number;
}

export type EnharmonicMap = Record<string, string>;

// Standard note names (12-tone equal temperament)
export const noteNames: NoteName[] = [
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

// Alternative enharmonic names
export const enharmonicNames: EnharmonicMap = {
  "C#": "Db",
  "D#": "Eb",
  "F#": "Gb",
  "G#": "Ab",
  "A#": "Bb",
};

// A4 frequency (standard tuning)
export const A4_FREQUENCY: number = 440;

/**
 * Convert frequency to note name with octave
 */
export function frequencyToNote(frequency: number): string | null {
  if (!frequency || frequency <= 0) return null;

  // Calculate semitones from A4
  const semitones = 12 * Math.log2(frequency / A4_FREQUENCY);
  const semitonesRounded = Math.round(semitones);

  // A4 is index 9 (A) in octave 4
  const noteIndex = ((semitonesRounded % 12) + 12 + 9) % 12;
  const octave = 4 + Math.floor((semitonesRounded + 9) / 12);

  return `${noteNames[noteIndex]}${octave}`;
}

/**
 * Convert note name to frequency
 */
export function noteToFrequency(noteName: string): number | null {
  if (!noteName) return null;

  // Parse note name (e.g., "A4", "Bb3", "C#5")
  const match = noteName.match(/^([A-G])([#b]?)(\d+)$/);
  if (!match) return null;

  const [, letter, accidental, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);

  // Find base note index
  let noteIndex = noteNames.indexOf(letter as NoteName);
  if (noteIndex === -1) return null;

  // Apply accidental
  if (accidental === "#") noteIndex += 1;
  else if (accidental === "b") noteIndex -= 1;

  // Normalize index
  noteIndex = ((noteIndex % 12) + 12) % 12;

  // Calculate semitones from A4
  // A is index 9, so we need to offset
  const semitonesFromA4 = noteIndex - 9 + (octave - 4) * 12;

  return A4_FREQUENCY * Math.pow(2, semitonesFromA4 / 12);
}

/**
 * Get cents deviation from perfect pitch
 */
export function getCentsDeviation(
  frequency: number,
  targetFrequency: number,
): number {
  if (!frequency || !targetFrequency) return 0;
  return 1200 * Math.log2(frequency / targetFrequency);
}

/**
 * Check if a frequency is close to a target note within tolerance
 */
export function isInTune(
  frequency: number,
  targetNote: string,
  centsThreshold: number = 50,
): boolean {
  const targetFreq = noteToFrequency(targetNote);
  if (!targetFreq) return false;
  const cents = Math.abs(getCentsDeviation(frequency, targetFreq));
  return cents <= centsThreshold;
}

/**
 * Parse a note name into components
 */
export function parseNoteName(noteName: string): ParsedNoteName | null {
  if (!noteName) return null;
  const match = noteName.match(/^([A-G])([#b]?)(\d+)$/);
  if (!match) return null;
  return {
    letter: match[1],
    accidental: match[2] || "",
    octave: parseInt(match[3], 10),
  };
}

/**
 * Format note name with preferred accidental style
 */
export function formatNoteName(
  noteName: string,
  style: AccidentalStyle = "sharp",
): string {
  if (!noteName) return "";

  const parsed = parseNoteName(noteName);
  if (!parsed) return noteName;

  const { letter, accidental, octave } = parsed;

  if (style === "flat" && accidental === "#") {
    // Convert sharps to flats
    const sharpNote = `${letter}#`;
    if (enharmonicNames[sharpNote]) {
      return `${enharmonicNames[sharpNote]}${octave}`;
    }
  } else if (style === "sharp" && accidental === "b") {
    // Convert flats to sharps
    const flatNote = `${letter}b`;
    const sharpEquiv = Object.entries(enharmonicNames).find(
      ([, v]) => v === flatNote,
    );
    if (sharpEquiv) {
      return `${sharpEquiv[0].replace("#", "")}#${octave}`;
    }
  }

  return noteName;
}

export default noteNames;
