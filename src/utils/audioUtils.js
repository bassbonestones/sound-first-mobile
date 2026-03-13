/**
 * Audio utility functions for pitch detection
 */
import { devError } from "./devLogger";

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
 * YIN pitch detection algorithm with debugging
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

  // YIN parameters - constrain to musical range
  const threshold = 0.1;
  const minFreq = 70; // Hz
  const maxFreq = 1400; // Hz
  const minPeriod = Math.floor(sampleRate / maxFreq); // ~34 at 48kHz
  const maxPeriod = Math.floor(sampleRate / minFreq); // ~686 at 48kHz
  const halfSize = Math.floor(SIZE / 2);
  const yinBufferSize = Math.min(maxPeriod + 1, halfSize);

  // Step 1 & 2: Compute difference function and cumulative mean normalized difference
  const yinBuffer = new Float32Array(yinBufferSize);
  yinBuffer[0] = 1;

  let runningSum = 0;

  for (let tau = 1; tau < yinBufferSize; tau++) {
    let delta = 0;
    const windowSize = halfSize - tau;
    for (let j = 0; j < windowSize; j++) {
      const diff = buffer[j] - buffer[j + tau];
      delta += diff * diff;
    }

    runningSum += delta;
    yinBuffer[tau] = runningSum > 0 ? (delta * tau) / runningSum : 1;
  }

  // Step 3: Find first tau below threshold, then find local minimum
  let tauEstimate = -1;
  for (let tau = minPeriod; tau < yinBufferSize; tau++) {
    if (yinBuffer[tau] < threshold) {
      while (tau + 1 < yinBufferSize && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      tauEstimate = tau;
      break;
    }
  }

  // Fallback: find global minimum in valid range
  if (tauEstimate === -1) {
    let minVal = Infinity;
    for (let tau = minPeriod; tau < yinBufferSize; tau++) {
      if (yinBuffer[tau] < minVal) {
        minVal = yinBuffer[tau];
        tauEstimate = tau;
      }
    }
    if (minVal > 0.4) {
      return { frequency: -1, rms, confidence: 0 };
    }
  }

  // Step 4: Parabolic interpolation
  let betterTau = tauEstimate;
  if (tauEstimate > 0 && tauEstimate < yinBufferSize - 1) {
    const s0 = yinBuffer[tauEstimate - 1];
    const s1 = yinBuffer[tauEstimate];
    const s2 = yinBuffer[tauEstimate + 1];

    const denom = s0 - 2 * s1 + s2;
    if (Math.abs(denom) > 1e-10) {
      const adjustment = (0.5 * (s0 - s2)) / denom;
      if (Math.abs(adjustment) < 1) {
        betterTau = tauEstimate + adjustment;
      }
    }
  }

  const frequency = sampleRate / betterTau;
  const confidence = 1 - yinBuffer[tauEstimate];

  if (frequency >= minFreq && frequency <= maxFreq && confidence > 0.5) {
    return { frequency, rms, confidence };
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
    devError("No base64 decoder available");
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
