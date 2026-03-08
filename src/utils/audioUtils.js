/**
 * Audio utility functions for pitch detection
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
 * @returns {Object|null} Note info with frequency, noteName, midiNote, cents, etc.
 */
export function frequencyToNote(frequency) {
  if (!frequency || frequency < 50 || frequency > 2000) return null;
  const semitones = 12 * Math.log2(frequency / 440);
  const midiNote = Math.round(semitones) + 69;
  const noteIndex = ((midiNote % 12) + 12) % 12;
  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = NOTE_NAMES[noteIndex];
  const exactMidi = semitones + 69;
  const cents = Math.round((exactMidi - midiNote) * 100);
  return {
    frequency: Math.round(frequency * 10) / 10,
    noteName: noteName + octave,
    noteNameShort: noteName,
    octave,
    midiNote,
    cents,
    isInTune: Math.abs(cents) < 15,
  };
}

/**
 * Convert note name to MIDI number
 * @param {string} noteName - Note name like "C4", "A#3"
 * @returns {number|null} MIDI number or null if invalid
 */
export function noteNameToMidi(noteName) {
  if (!noteName) return null;
  const match = noteName.match(/^([A-Ga-g])([#b]?)(\d)$/);
  if (!match) return null;
  const [, letter, accidental, octaveStr] = match;
  const letterIndex = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[
    letter.toUpperCase()
  ];
  if (letterIndex === undefined) return null;
  let noteIndex = letterIndex;
  if (accidental === "#") noteIndex += 1;
  if (accidental === "b") noteIndex -= 1;
  noteIndex = ((noteIndex % 12) + 12) % 12;
  return (parseInt(octaveStr, 10) + 1) * 12 + noteIndex;
}

/**
 * Autocorrelation pitch detection algorithm
 * @param {Float32Array} buffer - Audio samples
 * @param {number} sampleRate - Sample rate in Hz
 * @returns {Object} Detection result with frequency, rms, confidence
 */
export function autoCorrelate(buffer, sampleRate) {
  const SIZE = buffer.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / SIZE);

  // Too quiet - no pitch
  if (rms < 0.01) {
    return { frequency: -1, rms, confidence: 0 };
  }

  // Only look at frequencies from 70Hz to 1400Hz
  const minPeriod = Math.floor(sampleRate / 1400);
  const maxPeriod = Math.floor(sampleRate / 70);
  const correlations = [];

  for (let lag = minPeriod; lag <= maxPeriod && lag < SIZE / 2; lag++) {
    let sum = 0,
      norm1 = 0,
      norm2 = 0;
    for (let i = 0; i < SIZE - lag; i++) {
      sum += buffer[i] * buffer[i + lag];
      norm1 += buffer[i] * buffer[i];
      norm2 += buffer[i + lag] * buffer[i + lag];
    }
    const norm = Math.sqrt(norm1 * norm2);
    const correlation = norm > 0 ? sum / norm : 0;
    correlations.push({ lag, correlation });
  }

  if (correlations.length === 0) {
    return { frequency: -1, rms, confidence: 0 };
  }

  // Find the best correlation peak
  let bestLag = -1;
  let bestCorrelation = 0;

  for (let i = 1; i < correlations.length - 1; i++) {
    const prev = correlations[i - 1].correlation;
    const curr = correlations[i].correlation;
    const next = correlations[i + 1].correlation;

    // Local maximum with correlation > 0.5
    if (curr > prev && curr > next && curr > 0.5 && curr > bestCorrelation) {
      bestCorrelation = curr;
      bestLag = correlations[i].lag;

      // Parabolic interpolation for better accuracy
      const denom = 2 * curr - prev - next;
      if (denom !== 0) {
        bestLag += (next - prev) / (2 * denom);
      }

      // Stop at first good peak (fundamental frequency)
      if (bestCorrelation > 0.7) break;
    }
  }

  if (bestCorrelation > 0.5 && bestLag > 0) {
    return {
      frequency: sampleRate / bestLag,
      rms,
      confidence: bestCorrelation,
    };
  }

  return { frequency: -1, rms, confidence: 0 };
}

/**
 * Convert base64 encoded audio to Float32Array (16-bit PCM)
 * @param {string} base64 - Base64 encoded audio data
 * @returns {Float32Array} Audio samples normalized to -1 to 1
 */
export function base64ToFloat32Array(base64) {
  // Use Buffer for React Native (available via polyfill)
  let bytes;
  if (typeof Buffer !== "undefined") {
    bytes = Buffer.from(base64, "base64");
  } else if (typeof atob !== "undefined") {
    const binaryString = atob(base64);
    bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
  } else {
    console.error("No base64 decoder available");
    return new Float32Array(0);
  }

  // Convert 16-bit PCM to float32 (-1 to 1)
  const samples = new Float32Array(bytes.length / 2);

  for (let i = 0; i < samples.length; i++) {
    // Read as signed 16-bit integer, little-endian
    const low = bytes[i * 2];
    const high = bytes[i * 2 + 1];
    const int16 = (high << 8) | low;
    // Convert to signed
    const signed = int16 > 32767 ? int16 - 65536 : int16;
    samples[i] = signed / 32768.0;
  }

  return samples;
}
