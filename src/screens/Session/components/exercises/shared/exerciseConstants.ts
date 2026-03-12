/**
 * Shared constants for exercise components
 *
 * Centralizes phase definitions and options that were
 * previously duplicated across exercise files.
 */

/**
 * Standard phases for lesson-style exercises
 */
export const LESSON_PHASES = {
  FOCUS_CARD: "focus_card",
  LISTEN: "listen",
  SING: "sing",
  IMAGINE: "imagine",
  PLAY: "play",
  FEEDBACK: "feedback",
} as const;

export type LessonPhase = (typeof LESSON_PHASES)[keyof typeof LESSON_PHASES];

/**
 * Standard phases for accidental exercises
 */
export const ACCIDENTAL_PHASES = {
  INTRO: "intro",
  COMPARE: "compare",
  KEYBOARD: "keyboard",
  EXAMPLES: "examples",
  HEAR_IT: "hear_it",
  QUIZ: "quiz",
  RESULT: "result",
} as const;

export type AccidentalPhase =
  (typeof ACCIDENTAL_PHASES)[keyof typeof ACCIDENTAL_PHASES];

/**
 * Standard phases for rhythm/pulse exercises
 */
export const RHYTHM_PHASES = {
  INTRO: "intro",
  LISTENING: "listening",
  SILENT: "silent",
  TAP: "tap",
  REVEAL: "reveal",
  RESULT: "result",
} as const;

export type RhythmPhase = (typeof RHYTHM_PHASES)[keyof typeof RHYTHM_PHASES];

/**
 * Sounding frequency range for pitch detection
 */
export interface SoundingFrequencyRange {
  min: number;
  max: number;
}

/**
 * Pitch detection options
 */
export interface PitchDetectionOptions {
  volumeThreshold: number;
  silenceDuration: number;
  soundingFrequencyRange: SoundingFrequencyRange;
}

/**
 * Default pitch detection options
 */
export const PITCH_DETECTION_OPTIONS: PitchDetectionOptions = {
  volumeThreshold: 0.05,
  silenceDuration: 150, // Faster silence detection for rhythm accuracy
  soundingFrequencyRange: { min: 60, max: 1200 },
};

/**
 * Default pitch detection options for sustained notes
 */
export const SUSTAINED_PITCH_DETECTION_OPTIONS: PitchDetectionOptions = {
  volumeThreshold: 0.05,
  silenceDuration: 300, // Longer silence threshold for sustained notes
  soundingFrequencyRange: { min: 60, max: 1200 },
};

/**
 * Standard timing tolerances for rhythm exercises (in ms)
 */
export const TIMING_TOLERANCES = {
  PERFECT: 50, // Nearly perfect timing
  GOOD: 100, // Good timing
  ACCEPTABLE: 150, // Acceptable timing
  LENIENT: 200, // For beginners
} as const;

export type TimingTolerance =
  (typeof TIMING_TOLERANCES)[keyof typeof TIMING_TOLERANCES];

/**
 * Piano key definition
 */
export interface PianoKey {
  note: string;
  isBlack: boolean;
  label: string;
}

/**
 * Piano key layout for keyboard visualizations (one octave + C5)
 */
export const PIANO_KEYS: readonly PianoKey[] = [
  { note: "C4", isBlack: false, label: "C" },
  { note: "C#4", isBlack: true, label: "C♯" },
  { note: "D4", isBlack: false, label: "D" },
  { note: "D#4", isBlack: true, label: "D♯" },
  { note: "E4", isBlack: false, label: "E" },
  { note: "F4", isBlack: false, label: "F" },
  { note: "F#4", isBlack: true, label: "F♯" },
  { note: "G4", isBlack: false, label: "G" },
  { note: "G#4", isBlack: true, label: "G♯" },
  { note: "A4", isBlack: false, label: "A" },
  { note: "A#4", isBlack: true, label: "A♯" },
  { note: "B4", isBlack: false, label: "B" },
  { note: "C5", isBlack: false, label: "C" },
];

/**
 * Standard feedback messages
 */
export const FEEDBACK_MESSAGES = {
  CORRECT: "Correct!",
  INCORRECT: "Not quite. Try again!",
  PERFECT_TIMING: "Perfect!",
  GOOD_TIMING: "Good!",
  EARLY: "A bit early",
  LATE: "A bit late",
} as const;

export type FeedbackMessage =
  (typeof FEEDBACK_MESSAGES)[keyof typeof FEEDBACK_MESSAGES];

/**
 * Color palette for exercise UI (matches app theme)
 */
export const EXERCISE_COLORS = {
  primary: "#4A90A4",
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
  background: "#1a1a2e",
  cardBackground: "#16213e",
  text: "#E0E0E0",
  textSecondary: "#9E9E9E",
  highlight: "#FFD700",
} as const;

export type ExerciseColor =
  (typeof EXERCISE_COLORS)[keyof typeof EXERCISE_COLORS];
