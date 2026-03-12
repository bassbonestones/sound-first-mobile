/**
 * Shared Hooks - Reusable React hooks for common patterns
 *
 * @module hooks
 *
 * @example
 * import { useApi, useDebounce, useAsyncState } from '../hooks';
 */

export { useAsyncState } from "./useAsyncState";
export type { AsyncState } from "./useAsyncState";

export { useApi } from "./useApi";
export type { UseApiOptions, UseApiReturn } from "./useApi";

export { useDebounce, useDebouncedCallback } from "./useDebounce";

export {
  useTuneMasteryData,
  ALL_KEYS,
  DEFAULT_TUNES,
} from "./useTuneMasteryData";
export type {
  UseTuneMasteryDataReturn,
  TuneSettingsUpdate,
} from "./useTuneMasteryData";

export { useSelectionEngine } from "./useSelectionEngine";
export type {
  UseSelectionEngineReturn,
  TuneAnalysis,
  KeyScoreInfo,
  SelectionPick,
  SelectionStats,
} from "./useSelectionEngine";

export {
  default as useExerciseAudio,
  noteToFrequency,
} from "./useExerciseAudio";
export type {
  UseExerciseAudioReturn,
  SameOrDifferentExercise,
  PitchDirectionExercise,
  SameOrDifferentAnswer,
  PitchDirectionAnswer,
} from "./useExerciseAudio";

export { usePitchDetection } from "./usePitchDetection";
export type {
  UsePitchDetectionOptions,
  UsePitchDetectionReturn,
  SoundingFrequencyRange,
} from "./usePitchDetection";
