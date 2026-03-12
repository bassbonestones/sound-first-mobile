/**
 * Pitch detection utilities
 * Extracted from AudioInput for reusability
 */

/**
 * Standard note names in chromatic order
 */
export const NOTE_NAMES: readonly string[] = [
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
 * Note information returned by frequency detection
 */
export interface NoteInfo {
  frequency: number;
  noteName: string;
  noteNameShort: string;
  octave: number;
  midiNote: number;
  cents: number;
  isInTune: boolean;
}

/**
 * Result from autocorrelation pitch detection
 */
export interface AutocorrelateResult {
  frequency: number;
  rms: number;
  confidence: number;
}

/**
 * Convert frequency to note information
 * @param frequency - Frequency in Hz
 * @returns Note info with name, midi, cents, etc.
 */
export function frequencyToNote(frequency: number): NoteInfo | null {
  if (!frequency || frequency < 20 || frequency > 5000) {
    return null;
  }

  // Calculate semitones from A4 (440Hz)
  const semitones = 12 * Math.log2(frequency / 440);
  const midiNote = Math.round(semitones) + 69; // A4 = MIDI 69

  // Get note name and octave
  const noteIndex = ((midiNote % 12) + 12) % 12;
  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = NOTE_NAMES[noteIndex];

  // Calculate cents off from perfect pitch
  const exactMidi = semitones + 69;
  const cents = Math.round((exactMidi - midiNote) * 100);

  return {
    frequency,
    noteName: `${noteName}${octave}`,
    noteNameShort: noteName,
    octave,
    midiNote,
    cents,
    isInTune: Math.abs(cents) < 20, // Within 20 cents = in tune
  };
}

/**
 * Convert note name to MIDI note number
 * @param noteName - Note name like "Bb3", "F#4", "C5"
 * @returns MIDI note number or null if invalid
 */
export function noteNameToMidi(noteName: string): number | null {
  if (!noteName) return null;

  const match = noteName.match(/^([A-Ga-g])([#b]?)(\d)$/);
  if (!match) return null;

  const [, letter, accidental, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);

  const letterMap: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };
  const letterIndex = letterMap[letter.toUpperCase()];
  if (letterIndex === undefined) return null;

  let noteIndex = letterIndex;
  if (accidental === "#") noteIndex += 1;
  if (accidental === "b") noteIndex -= 1;
  noteIndex = ((noteIndex % 12) + 12) % 12;

  return (octave + 1) * 12 + noteIndex;
}

/**
 * Autocorrelation-based pitch detection
 * Optimized for voice and instrument detection
 * @param buffer - Audio sample buffer
 * @param sampleRate - Audio sample rate
 * @returns Frequency, RMS, and confidence
 */
export function autoCorrelate(
  buffer: Float32Array,
  sampleRate: number,
): AutocorrelateResult {
  const SIZE = buffer.length;
  let rms = 0;

  // Calculate RMS for volume
  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / SIZE);

  // Silence threshold
  if (rms < 0.01) {
    return { frequency: -1, rms, confidence: 0 };
  }

  // Find first zero crossing for better autocorrelation
  let r1 = 0;
  let r2 = SIZE - 1;
  const threshold = 0.2;

  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < threshold) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < threshold) {
      r2 = SIZE - i;
      break;
    }
  }

  const buf2 = buffer.slice(r1, r2);
  const c = new Float32Array(buf2.length);

  // Autocorrelation
  for (let i = 0; i < buf2.length; i++) {
    let sum = 0;
    for (let j = 0; j < buf2.length - i; j++) {
      sum += buf2[j] * buf2[j + i];
    }
    c[i] = sum;
  }

  // Find the first peak after initial decline
  let d = 0;
  while (c[d] > c[d + 1] && d < c.length - 1) {
    d++;
  }

  // Find the maximum in the autocorrelation
  let maxVal = -1;
  let maxPos = -1;
  for (let i = d; i < c.length; i++) {
    if (c[i] > maxVal) {
      maxVal = c[i];
      maxPos = i;
    }
  }

  // Parabolic interpolation for more accurate peak
  let T0 = maxPos;
  if (maxPos > 0 && maxPos < c.length - 1) {
    const y1 = c[maxPos - 1];
    const y2 = c[maxPos];
    const y3 = c[maxPos + 1];
    const a = (y1 + y3 - 2 * y2) / 2;
    const b = (y3 - y1) / 2;
    if (a !== 0) {
      T0 = maxPos - b / (2 * a);
    }
  }

  const frequency = sampleRate / T0;
  const confidence = maxVal / c[0]; // Confidence based on peak ratio

  return { frequency, rms, confidence };
}

/**
 * Check if two notes are octave equivalent (same pitch class)
 * @param note1 - First note name (e.g., "C4")
 * @param note2 - Second note name (e.g., "C5")
 * @returns True if same pitch class
 */
export function isOctaveEquivalent(note1: string, note2: string): boolean {
  const pc1 = getPitchClass(note1);
  const pc2 = getPitchClass(note2);
  return pc1 !== null && pc2 !== null && pc1 === pc2;
}

/**
 * Get pitch class from note name (0-11)
 * @param noteName - Note name (e.g., "Bb3", "F#4")
 * @returns Pitch class (0-11) or null
 */
export function getPitchClass(noteName: string): number | null {
  const midi = noteNameToMidi(noteName);
  if (midi === null) return null;
  return midi % 12;
}
