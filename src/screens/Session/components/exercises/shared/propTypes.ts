/**
 * Shared Types for exercise components
 *
 * All exercises receive a standard set of props from the session runner.
 * These TypeScript interfaces replace PropTypes for type safety.
 */

/**
 * Exercise configuration object from backend/session
 */
export interface ExerciseConfig {
  tempo?: number;
  beats?: number;
  note?: string;
  targetNote?: string;
  noteSequence?: string[];
  intervals?: number[];
  difficulty?: number;
  rounds?: number;
  params?: Record<string, unknown>;
}

/**
 * Mastery object from backend
 */
export interface Mastery {
  level?: number;
  score?: number;
  history?: Record<string, unknown>[];
}

/**
 * Standard exercise component props
 */
export interface ExerciseProps {
  /** Exercise configuration from backend/session */
  config?: ExerciseConfig;
  /** User's mastery data for this capability */
  mastery?: Mastery | null;
  /** Called when exercise completes - receives result object */
  onComplete: (result: ExerciseResult) => void;
  /** Called to report incremental progress */
  onProgress?: (progress: number) => void;
  /** User's first/reference note for adaptive exercises */
  userFirstNote?: string;
}

/**
 * Default props for standard exercise components
 */
export const exerciseDefaultProps: Partial<ExerciseProps> = {
  config: {},
  mastery: null,
  onProgress: () => {},
  userFirstNote: "F3",
};

/**
 * Focus card for lesson exercises
 */
export interface FocusCard {
  title: string;
  description: string;
  keyPoint?: string;
  icon?: string;
}

/**
 * Result object passed to onComplete
 */
export interface ExerciseResult {
  success: boolean;
  score?: number;
  accuracy?: number;
  details?: Record<string, unknown>;
  skipped?: boolean;
  error?: string;
}

/**
 * Pitch detection result from usePitchDetection hook
 */
export interface PitchResult {
  pitch?: number;
  noteName?: string;
  confidence?: number;
  clarity?: number;
}

// For backward compatibility with JS files that import from propTypes
// These are runtime-usable PropTypes objects
import PropTypes from "prop-types";

export const configShape = PropTypes.shape({
  tempo: PropTypes.number,
  beats: PropTypes.number,
  note: PropTypes.string,
  targetNote: PropTypes.string,
  noteSequence: PropTypes.arrayOf(PropTypes.string),
  intervals: PropTypes.arrayOf(PropTypes.number),
  difficulty: PropTypes.number,
  rounds: PropTypes.number,
  params: PropTypes.object,
});

export const masteryShape = PropTypes.shape({
  level: PropTypes.number,
  score: PropTypes.number,
  history: PropTypes.arrayOf(PropTypes.object),
});

export const exercisePropTypes = {
  config: configShape,
  mastery: masteryShape,
  onComplete: PropTypes.func.isRequired,
  onProgress: PropTypes.func,
  userFirstNote: PropTypes.string,
};

export const focusCardShape = PropTypes.shape({
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  keyPoint: PropTypes.string,
  icon: PropTypes.string,
});

export const resultShape = PropTypes.shape({
  success: PropTypes.bool.isRequired,
  score: PropTypes.number,
  accuracy: PropTypes.number,
  details: PropTypes.object,
});

export const pitchResultShape = PropTypes.shape({
  pitch: PropTypes.number,
  noteName: PropTypes.string,
  confidence: PropTypes.number,
  clarity: PropTypes.number,
});

export default {
  exercisePropTypes,
  exerciseDefaultProps,
  configShape,
  masteryShape,
  focusCardShape,
  resultShape,
  pitchResultShape,
};
