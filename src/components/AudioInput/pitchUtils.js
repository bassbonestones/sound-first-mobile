/**
 * Pitch detection utilities
 * Extracted from AudioInput for reusability
 */

/**
 * Standard note names in chromatic order
 */
export const NOTE_NAMES = [
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
 * Convert frequency to note information
 * @param {number} frequency - Frequency in Hz
 * @returns {Object|null} Note info with name, midi, cents, etc.
 */
export function frequencyToNote(frequency) {
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
 * @param {string} noteName - Note name like "Bb3", "F#4", "C5"
 * @returns {number|null} MIDI note number or null if invalid
 */
export function noteNameToMidi(noteName) {
  if (!noteName) return null;

  const match = noteName.match(/^([A-Ga-g])([#b]?)(\d)$/);
  if (!match) return null;

  const [, letter, accidental, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);

  const letterIndex = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[
    letter.toUpperCase()
  ];
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
 * @param {Float32Array} buffer - Audio sample buffer
 * @param {number} sampleRate - Audio sample rate
 * @returns {Object} { frequency, rms, confidence }
 */
export function autoCorrelate(buffer, sampleRate) {
  const SIZE = buffer.length;
  let rms = 0;

  // Calculate RMS for volume
  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / SIZE);

  if (rms < 0.005) {
    // Not enough signal
    return { frequency: -1, rms, confidence: 0 };
  }

  // Improved autocorrelation - look for first significant peak after initial decline
  // Minimum frequency we care about: ~70Hz (below bass voice)
  // Maximum frequency we care about: ~1400Hz (above soprano)
  const minPeriod = Math.floor(sampleRate / 1400); // ~31 samples at 44100
  const maxPeriod = Math.floor(sampleRate / 70); // ~630 samples at 44100

  let correlations = [];

  // Compute autocorrelation for each lag
  for (let lag = minPeriod; lag <= maxPeriod && lag < SIZE / 2; lag++) {
    let sum = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < SIZE - lag; i++) {
      sum += buffer[i] * buffer[i + lag];
      norm1 += buffer[i] * buffer[i];
      norm2 += buffer[i + lag] * buffer[i + lag];
    }

    // Normalized correlation (-1 to 1)
    const norm = Math.sqrt(norm1 * norm2);
    const correlation = norm > 0 ? sum / norm : 0;
    correlations.push({ lag, correlation });
  }

  if (correlations.length === 0) {
    return { frequency: -1, rms, confidence: 0 };
  }

  // Find the first significant peak (local maximum above threshold)
  let bestLag = -1;
  let bestCorrelation = 0;

  for (let i = 1; i < correlations.length - 1; i++) {
    const prev = correlations[i - 1].correlation;
    const curr = correlations[i].correlation;
    const next = correlations[i + 1].correlation;

    // Is this a local maximum?
    if (curr > prev && curr > next && curr > 0.3 && curr > bestCorrelation) {
      bestCorrelation = curr;
      bestLag = correlations[i].lag;

      // Parabolic interpolation for sub-sample accuracy
      const denom = 2 * curr - prev - next;
      if (denom !== 0) {
        const delta = (next - prev) / (2 * denom);
        bestLag += delta;
      }

      // Take the first good peak (fundamental frequency)
      if (bestCorrelation > 0.5) break;
    }
  }

  if (bestCorrelation > 0.3 && bestLag > 0) {
    const frequency = sampleRate / bestLag;
    return { frequency, rms, confidence: bestCorrelation };
  }

  return { frequency: -1, rms, confidence: 0 };
}

/**
 * Check if two MIDI notes are octave equivalent
 * @param {number} midi1 - First MIDI note
 * @param {number} midi2 - Second MIDI note
 * @returns {boolean} True if octave equivalent
 */
export function isOctaveEquivalent(midi1, midi2) {
  if (midi1 == null || midi2 == null) return false;
  return midi1 % 12 === midi2 % 12;
}

/**
 * Get the pitch class (0-11) from a MIDI note
 * @param {number} midiNote - MIDI note number
 * @returns {number} Pitch class 0-11
 */
export function getPitchClass(midiNote) {
  return ((midiNote % 12) + 12) % 12;
}
