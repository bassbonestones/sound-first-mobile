/**
 * Audio helper functions shared across exercise components
 *
 * Centralizes AudioContext setup and sound generation functions
 * that were previously duplicated across exercise files.
 */
import { Platform } from "react-native";

/**
 * Get the appropriate AudioContext class for the current platform
 * @returns {AudioContext|null} AudioContext constructor or null
 */
export function getAudioContextClass() {
  if (Platform.OS === "web") {
    return typeof window !== "undefined"
      ? window.AudioContext || window.webkitAudioContext
      : null;
  }

  // Native platforms (iOS/Android)
  try {
    return require("react-native-audio-api").AudioContext;
  } catch (e) {
    console.warn("react-native-audio-api not available");
    return null;
  }
}

/**
 * Create an AudioContext instance for the current platform
 * @returns {AudioContext|null} AudioContext instance or null
 */
export function createAudioContext() {
  const AudioContextClass = getAudioContextClass();
  if (!AudioContextClass) return null;
  return new AudioContextClass();
}

/**
 * Create a noise-based click sound using Web Audio
 * Uses white noise to avoid confusing pitch detection with any instrument.
 *
 * @param {AudioContext} audioContext - Active audio context
 * @param {number|boolean} frequencyOrIsAccent - Frequency in Hz, or boolean for accent (true=1500, false=1000)
 * @param {number} duration - Length of click in seconds (default 0.05)
 * @param {number} volume - Volume 0-1 (default 0.5)
 */
export function createClickSound(
  audioContext,
  frequencyOrIsAccent = 1000,
  duration = 0.05,
  volume = 0.5,
) {
  if (!audioContext) return;

  // Support backward-compatible boolean for isAccent
  let frequency = frequencyOrIsAccent;
  let actualVolume = volume;
  if (typeof frequencyOrIsAccent === "boolean") {
    frequency = frequencyOrIsAccent ? 1500 : 1000;
    actualVolume = frequencyOrIsAccent ? 0.8 : 0.5;
    duration = 0.03; // Use shorter duration for metronome clicks
  }

  const sampleRate = audioContext.sampleRate;
  const bufferSize = Math.floor(sampleRate * duration * 2);
  const buffer = audioContext.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  // Fill with white noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;

  // Highpass filter - frequency param controls brightness
  const filter = audioContext.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 800 + ((frequency - 700) / 500) * 1200;
  filter.Q.value = 0.7;

  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(actualVolume * 1.5, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + duration,
  );

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);

  source.start(audioContext.currentTime);
}

/**
 * Play a tone at a specific frequency
 *
 * @param {AudioContext} audioContext - Active audio context
 * @param {number} frequency - Frequency in Hz
 * @param {number} duration - Duration in seconds (default 1)
 * @param {number} volume - Volume 0-1 (default 0.5)
 * @param {string} waveform - Oscillator type: 'sine', 'triangle', 'square', 'sawtooth' (default 'sine')
 * @returns {OscillatorNode|null} The oscillator node (for stopping early if needed)
 */
export function playTone(
  audioContext,
  frequency,
  duration = 1,
  volume = 0.5,
  waveform = "sine",
) {
  if (!audioContext) return null;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = waveform;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  // Attack/release envelope to avoid clicks
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(
    volume,
    audioContext.currentTime + 0.01,
  );
  gainNode.gain.setValueAtTime(
    volume,
    audioContext.currentTime + duration - 0.05,
  );
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);

  return oscillator;
}

/**
 * Play a note by name (e.g., "C4")
 *
 * @param {AudioContext} audioContext - Active audio context
 * @param {string} noteName - Note name like "C4", "F#3"
 * @param {number} duration - Duration in seconds
 * @param {number} volume - Volume 0-1
 * @param {string} waveform - Oscillator type
 * @returns {OscillatorNode|null} The oscillator node
 */
export function playNote(
  audioContext,
  noteName,
  duration = 1,
  volume = 0.5,
  waveform = "sine",
) {
  // Import noteToFrequency here to avoid circular dependency
  const { noteToFrequency } = require("./noteUtils");
  const frequency = noteToFrequency(noteName);
  return playTone(audioContext, frequency, duration, volume, waveform);
}

/**
 * Clean up an audio context (for component unmount)
 *
 * @param {AudioContext} audioContext - Audio context to close
 */
export async function cleanupAudioContext(audioContext) {
  if (audioContext && audioContext.state !== "closed") {
    try {
      await audioContext.close();
    } catch (e) {
      // Ignore errors during cleanup
    }
  }
}
