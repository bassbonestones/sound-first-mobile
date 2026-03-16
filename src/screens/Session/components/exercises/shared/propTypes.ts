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

/**
 * Mini-session object for lesson exercises
 */
export interface MiniSession {
  material?: {
    id?: number;
    title?: string;
    tempo_bpm?: number;
    key?: string;
  };
  focusCard?: FocusCard;
  [key: string]: unknown;
}

/**
 * Session state object for lesson exercises
 */
export interface SessionState {
  material?: {
    id?: number;
    title?: string;
    tempo_bpm?: number;
    key?: string;
  };
  focusCard?: FocusCard;
  [key: string]: unknown;
}

/**
 * Lesson exercise component props (theory/concept exercises)
 */
export interface LessonExerciseProps {
  /** Mini-session object with material and focus card */
  mini?: MiniSession;
  /** Session state object */
  sessionState?: SessionState;
  /** Called when exercise completes */
  onComplete: (result: ExerciseResult) => void;
  /** Called when user cancels/skips */
  onCancel?: () => void;
}

/**
 * Default props for lesson exercise components
 */
export const lessonExerciseDefaultProps: Partial<LessonExerciseProps> = {
  mini: {},
  sessionState: {},
  onCancel: () => {},
};
