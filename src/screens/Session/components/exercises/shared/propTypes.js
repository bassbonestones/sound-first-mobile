/**
 * Shared PropTypes for exercise components
 *
 * All exercises receive a standard set of props from the session runner.
 * Using these shared PropTypes ensures consistency and better documentation.
 */
import PropTypes from "prop-types";

/**
 * Exercise configuration object shape
 */
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

/**
 * Mastery object shape from backend
 */
export const masteryShape = PropTypes.shape({
  level: PropTypes.number,
  score: PropTypes.number,
  history: PropTypes.arrayOf(PropTypes.object),
});

/**
 * Standard exercise component props
 */
export const exercisePropTypes = {
  /** Exercise configuration from backend/session */
  config: configShape,
  /** User's mastery data for this capability */
  mastery: masteryShape,
  /** Called when exercise completes - receives result object */
  onComplete: PropTypes.func.isRequired,
  /** Called to report incremental progress */
  onProgress: PropTypes.func,
  /** User's first/reference note for adaptive exercises */
  userFirstNote: PropTypes.string,
};

/**
 * Default props for standard exercise components
 */
export const exerciseDefaultProps = {
  config: {},
  mastery: null,
  onProgress: () => {},
  userFirstNote: "F3",
};

/**
 * Focus card shape for lesson exercises
 */
export const focusCardShape = PropTypes.shape({
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  keyPoint: PropTypes.string,
  icon: PropTypes.string,
});

/**
 * Result object passed to onComplete
 */
export const resultShape = PropTypes.shape({
  success: PropTypes.bool.isRequired,
  score: PropTypes.number,
  accuracy: PropTypes.number,
  details: PropTypes.object,
});

/**
 * Pitch detection result shape from usePitchDetection hook
 */
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
