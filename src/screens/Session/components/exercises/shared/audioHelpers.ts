/**
 * Audio helper functions shared across exercise components
 *
 * Centralizes AudioContext setup and sound generation functions
 * that were previously duplicated across exercise files.
 */
import { Platform } from "react-native";
import { devWarn } from "../../../../../utils/devLogger";

// Type for audio context (works for both web and native)
type AudioContextType = AudioContext;

// Type for oscillator node
type OscillatorType = "sine" | "triangle" | "square" | "sawtooth";

/**
 * Get the appropriate AudioContext class for the current platform
 */
export function getAudioContextClass(): (new () => AudioContextType) | null {
  if (Platform.OS === "web") {
    return typeof window !== "undefined"
      ? window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext ||
          null
      : null;
  }

  // Native platforms (iOS/Android)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("react-native-audio-api").AudioContext;
  } catch {
    devWarn("react-native-audio-api not available");
    return null;
  }
}

/**
 * Create an AudioContext instance for the current platform
 */
export function createAudioContext(): AudioContextType | null {
  const AudioContextClass = getAudioContextClass();
  if (!AudioContextClass) return null;
  return new AudioContextClass();
}

/**
 * Create a noise-based click sound using Web Audio
 * Uses white noise to avoid confusing pitch detection with any instrument.
 */
export function createClickSound(
  audioContext: AudioContextType | null,
  frequencyOrIsAccent: number | boolean = 1000,
  duration = 0.05,
  volume = 0.5,
): void {
  if (!audioContext) return;

  // Support backward-compatible boolean for isAccent
  let frequency = frequencyOrIsAccent as number;
  let actualVolume = volume;
  let actualDuration = duration;
  if (typeof frequencyOrIsAccent === "boolean") {
    frequency = frequencyOrIsAccent ? 1500 : 1000;
    actualVolume = frequencyOrIsAccent ? 0.8 : 0.5;
    actualDuration = 0.03; // Use shorter duration for metronome clicks
  }

  const sampleRate = audioContext.sampleRate;
  const bufferSize = Math.floor(sampleRate * actualDuration * 2);
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
    audioContext.currentTime + actualDuration,
  );

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);

  source.start(audioContext.currentTime);
}

/**
 * Play a tone at a specific frequency
 */
export function playTone(
  audioContext: AudioContextType | null,
  frequency: number,
  duration = 1,
  volume = 0.5,
  waveform: OscillatorType = "sine",
): OscillatorNode | null {
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
 */
export function playNote(
  audioContext: AudioContextType | null,
  noteName: string,
  duration = 1,
  volume = 0.5,
  waveform: OscillatorType = "sine",
): OscillatorNode | null {
  // Import noteToFrequency here to avoid circular dependency
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { noteToFrequency } = require("./noteUtils") as {
    noteToFrequency: (note: string) => number;
  };
  const frequency = noteToFrequency(noteName);
  return playTone(audioContext, frequency, duration, volume, waveform);
}

/**
 * Resume a suspended audio context
 * Browsers suspend AudioContext until user interaction
 */
export async function resumeAudioContext(
  audioContext: AudioContextType | null,
): Promise<boolean> {
  if (!audioContext) return false;
  if (audioContext.state === "suspended") {
    try {
      await audioContext.resume();
      return true;
    } catch (error) {
      devWarn("Failed to resume audio context:", error);
      return false;
    }
  }
  return audioContext.state === "running";
}

/**
 * Check if audio context is available and running
 */
export function isAudioContextReady(
  audioContext: AudioContextType | null,
): boolean {
  return audioContext?.state === "running";
}

/**
 * Clean up an audio context (for component unmount)
 */
export async function cleanupAudioContext(
  audioContext: AudioContextType | null,
): Promise<void> {
  if (audioContext && audioContext.state !== "closed") {
    try {
      await audioContext.close();
    } catch {
      // Ignore errors during cleanup
    }
  }
}
