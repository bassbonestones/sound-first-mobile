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

// Types (TypeScript interfaces)
export { exerciseDefaultProps, lessonExerciseDefaultProps } from "./propTypes";
export type {
  ExerciseProps,
  ExerciseConfig,
  Mastery,
  FocusCard,
  ExerciseResult,
  PitchResult,
  LessonExerciseProps,
  MiniSession,
  SessionState,
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

// Timing Exercise State Hook
export { useTimingExerciseState } from "./useTimingExerciseState";
export type {
  TimingExercisePhase,
  TimingFeedback,
  WrongNoteInfo,
  TimingExerciseConfig,
  TimingProgressUpdate,
  TimingCompletionResult,
  TimingExerciseStateReturn,
} from "./useTimingExerciseState";

// Lesson Exercise State Hook
export { useLessonExerciseState } from "./useLessonExerciseState";
export type {
  LessonExerciseStateConfig,
  LessonExerciseStateReturn,
  PerformanceResult,
  PatternConfig,
  ProgressState,
  PhaseConfig,
} from "./useLessonExerciseState";

// Fragment2 Audio Hook
export { useFragment2Audio } from "./useFragment2Audio";
export type {
  Fragment2AudioConfig,
  Fragment2AudioReturn,
} from "./useFragment2Audio";

// Quiz Exercise State Hook
export { useQuizExerciseState } from "./useQuizExerciseState";
export type {
  QuizQuestion,
  QuizState,
  QuizConfig,
  QuizExerciseState,
} from "./useQuizExerciseState";

// Lesson Exercise Audio Hook
export { useLessonExerciseAudio } from "./useLessonExerciseAudio";
export type {
  LessonExerciseAudioConfig,
  LessonExerciseAudioReturn,
  NoteConfig,
  CountInConfig,
  PatternNote,
  PitchTrackingRefs,
  PerformanceAnalysis,
} from "./useLessonExerciseAudio";

// Lesson UI Components
export {
  LessonBeatIndicator,
  LessonAttestationModal,
  LessonFocusCard,
  LessonFocusCardMini,
  LessonPhaseProgress,
  LessonNotationToggle,
  LessonResultDisplay,
  LessonSuccessDisplay,
  // Style exports for customization
  lessonBeatStyles,
  lessonModalStyles,
  lessonFocusStyles,
  lessonMiniStyles,
  lessonProgressStyles,
  lessonNotationStyles,
  lessonResultStyles,
  lessonSuccessStyles,
} from "./LessonComponents";
export type {
  LessonBeatIndicatorProps,
  LessonAttestationModalProps,
  LessonFocusCardProps,
  LessonFocusCardMiniProps,
  LessonPhaseProgressProps,
  LessonNotationToggleProps,
  LessonResultDisplayProps,
  LessonSuccessDisplayProps,
  FocusCardData,
  PatternProgressItem,
} from "./LessonComponents";
export type { MiniKeyboardProps } from "./MiniKeyboard";

// Base Lesson Exercise Component
export { BaseLessonExercise, baseExerciseStyles } from "./BaseLessonExercise";
export type {
  LessonExerciseConfig,
  AudioConfig,
  NoteGenerationConfig,
  PhaseRenderProps,
  CustomRenderers,
  BaseLessonExerciseProps,
} from "./BaseLessonExercise";

// Rest Lesson Types (unified types for rest exercises)
export { getDefaultInstructions } from "./RestLessonTypes";
export type {
  RestType,
  BeatConfig,
  RestLessonNoteInfo,
  RestSymbolType,
  RestFocusCard,
  RestMiniCard,
  RestThresholds,
  RestNotationConfig,
  RestPhaseInstructions,
  RestLessonConfig,
} from "./RestLessonTypes";

// Rest Lesson Audio Hook
export { useRestLessonAudio } from "./useRestLessonAudio";
export type {
  RestAudioConfig,
  PlaybackState,
  PerformanceRefs,
  PerformanceAnalysis,
  UseRestLessonAudioReturn,
} from "./useRestLessonAudio";
