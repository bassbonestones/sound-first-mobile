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
  NOTE_FREQUENCIES,
} from "./noteUtils";

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

// PropTypes
export {
  exercisePropTypes,
  exerciseDefaultProps,
  configShape,
  masteryShape,
  focusCardShape,
  resultShape,
  pitchResultShape,
} from "./propTypes";

// Lesson styles
export {
  lessonCommonStyles,
  modalStyles,
  COLORS,
  SHADOWS,
} from "./lessonStyles";
