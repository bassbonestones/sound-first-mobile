/**
 * Shared exercise utilities barrel export
 *
 * Usage:
 * import { parseNoteName, noteToMidi, createClickSound, LESSON_PHASES } from './shared';
 */

// Note utilities
export {
  parseNoteName,
  noteToMidi,
  midiToFrequency,
  noteToFrequency,
  formatNoteName,
  midiToNote,
  shouldUseSharps,
  midiToNoteInContext,
  NOTE_FREQUENCIES,
  CHROMATIC_NOTES,
  FLAT_EQUIVALENTS,
  SHARP_EQUIVALENTS,
} from "./noteUtils";
export type { ParsedNote } from "./noteUtils";

// Audio helpers
export {
  getAudioContextClass,
  createAudioContext,
  createClickSound,
  playTone,
  playNote,
  cleanupAudioContext,
} from "./audioHelpers";

// Constants
export {
  LESSON_PHASES,
  ACCIDENTAL_PHASES,
  RHYTHM_PHASES,
  PITCH_DETECTION_OPTIONS,
  SUSTAINED_PITCH_DETECTION_OPTIONS,
  TIMING_TOLERANCES,
  PIANO_KEYS,
  FEEDBACK_MESSAGES,
  EXERCISE_COLORS,
} from "./exerciseConstants";
export type {
  LessonPhase,
  AccidentalPhase,
  RhythmPhase,
  TimingTolerance,
  FeedbackMessage,
  ExerciseColor,
  PianoKey,
  SoundingFrequencyRange,
  PitchDetectionOptions,
} from "./exerciseConstants";

// Types and PropTypes (for backward compatibility)
export {
  exercisePropTypes,
  exerciseDefaultProps,
  configShape,
  masteryShape,
  focusCardShape,
  resultShape,
  pitchResultShape,
} from "./propTypes";
export type {
  ExerciseProps,
  ExerciseConfig,
  Mastery,
  FocusCard,
  ExerciseResult,
  PitchResult,
} from "./propTypes";

// Lesson styles
export {
  lessonCommonStyles,
  modalStyles,
  COLORS,
  SHADOWS,
} from "./lessonStyles";
export type { ColorKey } from "./lessonStyles";

// Error Boundary
export {
  default as ExerciseErrorBoundary,
  withExerciseErrorBoundary,
} from "./ExerciseErrorBoundary";

// Audio Loading State
export { AudioLoadingState, WithAudioLoading } from "./AudioLoadingState";
export type {
  AudioLoadingStateProps,
  WithAudioLoadingProps,
} from "./AudioLoadingState";

// Audio Context Hook
export { useExerciseAudioContext } from "./useExerciseAudioContext";
export type { UseExerciseAudioContextReturn } from "./useExerciseAudioContext";

// MiniKeyboard Component
export { default as MiniKeyboard } from "./MiniKeyboard";
export type { MiniKeyboardProps } from "./MiniKeyboard";
