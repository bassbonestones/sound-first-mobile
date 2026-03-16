/**
 * Timing Constants
 *
 * Animation durations, delays, and timing-related values.
 * Use these instead of magic numbers throughout the app.
 */

// Types
export interface AnimationDurations {
  instant: number;
  fast: number;
  normal: number;
  slow: number;
  verySlow: number;
}

export interface DelayDurations {
  debounce: number;
  autoAdvance: number;
  resultDisplay: number;
  fadeOut: number;
  loadingMin: number;
}

export interface AudioTiming {
  noteDuration: number;
  noteGap: number;
  attackTime: number;
  releaseTime: number;
  metronomePrecount: number;
}

export interface SessionTiming {
  inactivityWarning: number;
  sessionTimeout: number;
  autoSaveInterval: number;
}

export interface PitchDetectionConfig {
  smoothingWindow: number;
  stabilityThreshold: number;
  sampleInterval: number;
}

// Animation durations (in milliseconds)
export const ANIMATION: AnimationDurations = {
  instant: 0,
  fast: 150,
  normal: 200,
  slow: 300,
  verySlow: 400,
};

// UI feedback delays
export const DELAY: DelayDurations = {
  debounce: 200, // Debounce for rapid inputs
  autoAdvance: 1000, // Auto-advance after correct answer
  resultDisplay: 1000, // Show result before moving on
  fadeOut: 300, // Fade out duration
  loadingMin: 200, // Minimum loading indicator display
};

// Audio timing
export const AUDIO: AudioTiming = {
  noteDuration: 800, // Default note play duration (ms)
  noteGap: 300, // Gap between notes in sequence
  attackTime: 20, // Envelope attack (ms)
  releaseTime: 300, // Envelope release (ms)
  metronomePrecount: 4000, // Pre-count before metronome exercise
};

// Practice session timing
export const SESSION: SessionTiming = {
  inactivityWarning: 300000, // 5 minutes
  sessionTimeout: 600000, // 10 minutes
  autoSaveInterval: 30000, // 30 seconds
};

// Pitch detection
export const PITCH_DETECTION: PitchDetectionConfig = {
  smoothingWindow: 5, // Number of readings to average
  stabilityThreshold: 500, // ms to consider pitch stable
  sampleInterval: 50, // ms between pitch samples
};

export default {
  ANIMATION,
  DELAY,
  AUDIO,
  SESSION,
  PITCH_DETECTION,
};
