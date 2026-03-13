/**
 * Tuner Constants
 *
 * Central location for all tuner-related magic numbers.
 * Separating these enables easy tuning and testing.
 */

// ===========================================
// TIMING CONSTANTS
// ===========================================

/** Duration to ignore attack phase (ms) - attack pitch is always unstable */
export const DETECTION_WARMUP_MS = 200;

/** Trailing window for calculating stability std dev (ms) */
export const STABILITY_WINDOW_MS = 750;

/** Time centered + stable before showing lock indicator (ms) */
export const CENTER_LOCK_MS = 500;

/** Time centered + stable before showing hold checkmark (ms) */
export const HOLD_INDICATOR_MS = 1000;

/** Silence detection timeout (ms) - clear note after this duration of no signal */
export const SILENCE_TIMEOUT_MS = 300;

// ===========================================
// THRESHOLD CONSTANTS (in cents)
// ===========================================

/** Threshold for "centered" state - abs(cents) <= this = centered */
export const CENTERED_THRESHOLD = 3;

/** Threshold for "perfect" state - abs(cents) <= this = perfect */
export const PERFECT_THRESHOLD = 2;

// ===========================================
// STABILITY CONSTANTS (std dev thresholds)
// ===========================================

/** Std dev threshold for "stable" (🟢) */
export const STABLE_STD_DEV = 2.0;

/** Std dev threshold for "moderate" (🟡) - above STABLE, at or below this */
export const MODERATE_STD_DEV = 5.0;

// Above MODERATE_STD_DEV = "unstable" (🔴)

// ===========================================
// COLOR ZONE CONSTANTS (graduated feedback)
// ===========================================

/** Perfect zone (±2 cents) - bright green */
export const COLOR_ZONE_PERFECT = 2;

/** In tune zone (±3 cents) - soft green */
export const COLOR_ZONE_IN_TUNE = 3;

/** Yellow zone (±10 cents) */
export const COLOR_ZONE_YELLOW = 10;

// Above YELLOW = red

// ===========================================
// DISPLAY CONSTANTS
// ===========================================

/** Dead zone for needle snap-to-center (cents) */
export const NEEDLE_DEAD_ZONE = 3;

/** Minimum cents change to trigger UI update */
export const MIN_CENTS_CHANGE = 2;

// ===========================================
// SMOOTHING CONSTANTS
// ===========================================

/** EMA factor for frequency smoothing (lower = smoother) */
export const FREQUENCY_SMOOTHING = 0.15;

/** EMA factor for cents smoothing */
export const CENTS_SMOOTHING = 0.1;

/** Number of samples for median filter */
export const MEDIAN_WINDOW_SIZE = 5;

// ===========================================
// SPRING NEEDLE CONSTANTS (Phase 1C)
// ===========================================

/** Spring tension for needle animation (higher = faster) */
export const NEEDLE_SPRING_TENSION = 180;

/** Spring friction for needle animation (higher = less bouncy) */
export const NEEDLE_SPRING_FRICTION = 12;

// ===========================================
// DRIFT TRAIL CONSTANTS (Phase 1C)
// ===========================================

/** Duration of drift trail history (ms) */
export const DRIFT_TRAIL_DURATION_MS = 2000;

/** Number of samples to keep in drift trail */
export const DRIFT_TRAIL_SAMPLES = 30;

/** Sample interval for drift trail (ms) */
export const DRIFT_TRAIL_INTERVAL_MS = 66; // ~15fps for trail

// ===========================================
// DIRECTION BIAS CONSTANTS (Phase 1C)
// ===========================================

/** Minimum samples needed to calculate direction bias */
export const DIRECTION_BIAS_MIN_SAMPLES = 15;

/** Threshold for showing bias indicator (mean cents) */
export const DIRECTION_BIAS_THRESHOLD = 3;

/** Duration of bias history window (ms) */
export const DIRECTION_BIAS_WINDOW_MS = 5000;

// ===========================================
// SESSION STATS CONSTANTS (Phase 2A)
// ===========================================

/** Minimum samples before showing session stats */
export const SESSION_MIN_SAMPLES = 30;

/** Tolerance for "accurate" sample in session stats (cents) */
export const SESSION_ACCURACY_TOLERANCE = 5;

/** Divisor for converting stdDev to 0-100 stability score */
export const SESSION_STABILITY_SCORE_DIVISOR = 10;

// ===========================================
// FEATURE FLAGS
// ===========================================

/** Ship behind toggles for incremental rollout */
export const TUNER_FLAGS = {
  /** Phase 1B.1 - Stability indicator (🟢🟡🔴) */
  stabilityIndicator: true,
  /** Phase 1A - Hold indicator (ring progress + ✔ HOLD) */
  holdIndicator: true,
  /** Phase 1B.4 - Center lock glow animation */
  centerLockGlow: true,
  /** Phase 1B.2 - Attack phase detection (ignore first 200ms) */
  attackPhaseDetection: true,
  /** Phase 1B.3 - State language (CENTERED/IN TUNE/PERFECT) */
  stateLanguage: true,
  /** Phase 1B.5 - Graduated color zones */
  graduatedColorZones: true,
  /** Phase 1C.1 - Spring needle easing (overshoot + settle) */
  springNeedle: true,
  /** Phase 1C.2 - Pitch drift trail (ghost trail showing recent pitch) */
  driftTrail: true,
  /** Phase 1C.3 - Direction bias indicator ("Slight sharp tendency") */
  directionBias: true,
  /** Phase 1C.4 - Directional guidance text ("Lower pitch slightly") */
  directionalGuidance: true,
  /** Phase 2A.1 - Session stats (Pitch Accuracy/Stability/Control scores) */
  sessionStats: true,
  /** Phase 2A.2 - Attack summary ("Your attacks averaged +4¢ sharp") */
  attackSummary: true,
} as const;

// ===========================================
// COLOR DEFINITIONS
// ===========================================

export const TUNER_COLORS = {
  // Stability indicator colors
  stableGreen: "#4CAF50",
  moderateYellow: "#FFC107",
  unstableRed: "#F44336",

  // Graduated tuning zones
  perfectGreen: "#4CAF50", // ±2 cents
  inTuneGreen: "#81C784", // ±3 cents (softer)
  yellowZone: "#FFC107", // ±10 cents
  orangeZone: "#FF9800", // ±20 cents
  redZone: "#F44336", // >20 cents

  // Lock/hold indicators
  lockGlow: "#FFD700", // Gold glow for lock achievement
  holdProgress: "#4CAF50", // Green for hold progress ring

  // UI elements
  textPrimary: "#FFFFFF",
  textSecondary: "#888888",
  background: "#1a1a2e",
} as const;
