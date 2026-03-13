/**
 * Tuner Helpers
 *
 * Pure calculation functions for the tuner.
 * Separating logic from UI enables thorough testing.
 */

import {
  CENTERED_THRESHOLD,
  PERFECT_THRESHOLD,
  STABLE_STD_DEV,
  MODERATE_STD_DEV,
  CENTER_LOCK_MS,
  HOLD_INDICATOR_MS,
  COLOR_ZONE_PERFECT,
  COLOR_ZONE_IN_TUNE,
  COLOR_ZONE_YELLOW,
  TUNER_COLORS,
  DIRECTION_BIAS_MIN_SAMPLES,
  DIRECTION_BIAS_THRESHOLD,
} from "./tunerConstants";

// ===========================================
// TYPES
// ===========================================

export interface StabilityResult {
  /** Standard deviation of cents over the measurement window */
  stdDev: number;
  /** True if stdDev <= STABLE_STD_DEV */
  isStable: boolean;
  /** True if stdDev > STABLE_STD_DEV && stdDev <= MODERATE_STD_DEV */
  isModerate: boolean;
  /** True if stdDev > MODERATE_STD_DEV */
  isUnstable: boolean;
}

export type StabilityLevel = "stable" | "moderate" | "unstable";

export type StateText =
  | "LISTENING"
  | "PERFECT"
  | "IN TUNE"
  | "CENTERED"
  | string;

// ===========================================
// STABILITY CALCULATIONS
// ===========================================

/**
 * Compute standard deviation of an array of numbers.
 */
export function computeStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return 0;

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  const variance =
    squaredDiffs.reduce((sum, sq) => sum + sq, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Compute stability metrics from a recent cents history.
 *
 * @param centsHistory - Array of recent cents values (typically last ~750ms worth)
 * @returns StabilityResult with stdDev and boolean flags
 */
export function computeStability(centsHistory: number[]): StabilityResult {
  const stdDev = computeStdDev(centsHistory);

  return {
    stdDev,
    isStable: stdDev <= STABLE_STD_DEV,
    isModerate: stdDev > STABLE_STD_DEV && stdDev <= MODERATE_STD_DEV,
    isUnstable: stdDev > MODERATE_STD_DEV,
  };
}

/**
 * Get the stability level as a simple string.
 */
export function getStabilityLevel(stability: StabilityResult): StabilityLevel {
  if (stability.isStable) return "stable";
  if (stability.isModerate) return "moderate";
  return "unstable";
}

// ===========================================
// STATE TEXT (Display Rules)
// ===========================================

/**
 * Compute the display text based on cents deviation and stability.
 *
 * Rules (from planning doc):
 * - "PERFECT" = abs(cents) ≤ 2 AND stable
 * - "IN TUNE" = abs(cents) ≤ 3 AND stable
 * - "CENTERED" = abs(cents) ≤ 3 but unstable (teaches: good center, now stabilize)
 * - Outside tolerance: "6¢ SHARP" / "4¢ FLAT"
 *
 * @param cents - Current cents deviation from target pitch
 * @param isStable - Whether pitch is currently stable (stdDev <= STABLE_STD_DEV)
 * @param isDetecting - Whether in warmup/detecting phase (show "LISTENING")
 */
export function computeStateText(
  cents: number,
  isStable: boolean,
  isDetecting: boolean = false,
): StateText {
  if (isDetecting) {
    return "LISTENING";
  }

  const absCents = Math.abs(cents);

  // Centered cases
  if (absCents <= CENTERED_THRESHOLD) {
    if (isStable) {
      // Perfect = ±2 AND stable
      if (absCents <= PERFECT_THRESHOLD) {
        return "PERFECT";
      }
      // In tune = ±3 AND stable
      return "IN TUNE";
    }
    // Centered but unstable - teaches "good center, now stabilize"
    return "CENTERED";
  }

  // Outside tolerance: show cents with direction
  const direction = cents > 0 ? "SHARP" : "FLAT";
  return `${absCents}¢ ${direction}`;
}

// ===========================================
// LOCK/HOLD LOGIC
// ===========================================

/**
 * Determine if center lock should be shown.
 * Lock = centered + stable for CENTER_LOCK_MS (500ms).
 *
 * @param centeredStableDurationMs - How long user has been centered AND stable
 */
export function shouldShowLock(centeredStableDurationMs: number): boolean {
  return centeredStableDurationMs >= CENTER_LOCK_MS;
}

/**
 * Determine if hold indicator should be shown.
 * Hold = centered + stable for HOLD_INDICATOR_MS (1000ms).
 *
 * @param centeredStableDurationMs - How long user has been centered AND stable
 */
export function shouldShowHold(centeredStableDurationMs: number): boolean {
  return centeredStableDurationMs >= HOLD_INDICATOR_MS;
}

/**
 * Get hold progress as a 0-1 value for ring animation.
 *
 * @param centeredStableDurationMs - How long user has been centered AND stable
 * @returns Progress from 0 to 1 (1 = complete)
 */
export function getHoldProgress(centeredStableDurationMs: number): number {
  return Math.min(1, centeredStableDurationMs / HOLD_INDICATOR_MS);
}

// ===========================================
// COLOR HELPERS
// ===========================================

/**
 * Get the color for the current tuning state (graduated zones).
 *
 * Phase 1B.5: Graduated Color Zones
 * - ±2 = bright green (perfect)
 * - ±3 = soft green (in tune)
 * - ±10 = yellow
 * - ±20 = orange
 * - >20 = red
 */
export function getTuneColor(cents: number): string {
  const absCents = Math.abs(cents);

  if (absCents <= COLOR_ZONE_PERFECT) {
    return TUNER_COLORS.perfectGreen;
  }
  if (absCents <= COLOR_ZONE_IN_TUNE) {
    return TUNER_COLORS.inTuneGreen;
  }
  if (absCents <= COLOR_ZONE_YELLOW) {
    return TUNER_COLORS.yellowZone;
  }
  if (absCents <= 20) {
    return TUNER_COLORS.orangeZone;
  }
  return TUNER_COLORS.redZone;
}

/**
 * Get the color for the stability indicator.
 */
export function getStabilityColor(stability: StabilityResult): string {
  if (stability.isStable) {
    return TUNER_COLORS.stableGreen;
  }
  if (stability.isModerate) {
    return TUNER_COLORS.moderateYellow;
  }
  return TUNER_COLORS.unstableRed;
}

// ===========================================
// DERIVED BOOLEANS (convenience functions)
// ===========================================

/**
 * Check if cents value is within "centered" threshold.
 */
export function isCentered(cents: number): boolean {
  return Math.abs(cents) <= CENTERED_THRESHOLD;
}

/**
 * Check if cents value is within "perfect" threshold.
 */
export function isPerfect(cents: number): boolean {
  return Math.abs(cents) <= PERFECT_THRESHOLD;
}

// ===========================================
// MEDIAN FILTER
// ===========================================

/**
 * Get the median of an array of numbers.
 * Used for outlier rejection in pitch detection.
 */
export function getMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ===========================================
// DIRECTION BIAS (Phase 1C)
// ===========================================

export type BiasDirection = "sharp" | "flat" | "neutral";

export interface DirectionBiasResult {
  /** Mean cents value over the window */
  meanCents: number;
  /** Direction of bias: 'sharp', 'flat', or 'neutral' */
  direction: BiasDirection;
  /** Human-readable text like "Slight sharp tendency" */
  biasText: string | null;
  /** Whether there's enough data to show bias */
  hasEnoughData: boolean;
}

/**
 * Compute direction bias from a history of cents values.
 * Shows habitual sharp/flat tendency to help players self-correct.
 *
 * @param centsHistory - Array of recent cents values (typically last ~5 seconds)
 * @returns DirectionBiasResult with mean, direction, and display text
 */
export function computeDirectionBias(
  centsHistory: number[],
): DirectionBiasResult {
  // Need enough samples to be meaningful
  if (centsHistory.length < DIRECTION_BIAS_MIN_SAMPLES) {
    return {
      meanCents: 0,
      direction: "neutral",
      biasText: null,
      hasEnoughData: false,
    };
  }

  // Calculate mean cents
  const sum = centsHistory.reduce((acc, val) => acc + val, 0);
  const meanCents = sum / centsHistory.length;

  // Determine direction and text
  const absMean = Math.abs(meanCents);

  if (absMean < DIRECTION_BIAS_THRESHOLD) {
    return {
      meanCents,
      direction: "neutral",
      biasText: null,
      hasEnoughData: true,
    };
  }

  const direction: BiasDirection = meanCents > 0 ? "sharp" : "flat";

  // Graduated bias text based on severity
  let biasText: string;
  if (absMean < 5) {
    biasText =
      direction === "sharp" ? "Slight sharp tendency" : "Slight flat tendency";
  } else if (absMean < 10) {
    biasText = direction === "sharp" ? "Sharp tendency" : "Flat tendency";
  } else {
    biasText =
      direction === "sharp" ? "Strong sharp tendency" : "Strong flat tendency";
  }

  return {
    meanCents,
    direction,
    biasText,
    hasEnoughData: true,
  };
}

// ===========================================
// DIRECTIONAL GUIDANCE (Phase 1C)
// ===========================================

export interface DirectionalGuidance {
  /** The guidance text to display (e.g., "Lower pitch slightly") */
  text: string | null;
  /** Short instruction (e.g., "Lower") */
  shortText: string | null;
  /** Direction: 'lower', 'raise', or null if centered */
  direction: "lower" | "raise" | null;
}

/**
 * Compute directional guidance text based on cents deviation.
 * Converts measurement into instruction (e.g., "+8 cents" → "Lower pitch slightly").
 *
 * Phase 1C feature: turns the tuner from measurement to instruction.
 *
 * @param cents - Current cents deviation from target pitch
 * @returns DirectionalGuidance with text and direction
 */
export function computeDirectionalGuidance(cents: number): DirectionalGuidance {
  const absCents = Math.abs(cents);

  // Within centered threshold - no guidance needed
  if (absCents <= CENTERED_THRESHOLD) {
    return {
      text: null,
      shortText: null,
      direction: null,
    };
  }

  // Determine direction - sharp means lower, flat means raise
  const direction: "lower" | "raise" = cents > 0 ? "lower" : "raise";
  const actionWord = direction === "lower" ? "Lower" : "Raise";

  // Graduated guidance based on how far off
  let text: string;
  let shortText: string;

  if (absCents <= 5) {
    // Slightly off (4-5 cents)
    text = `${actionWord} pitch slightly`;
    shortText = `${actionWord} ↓`;
  } else if (absCents <= 10) {
    // Moderately off (6-10 cents)
    text = `${actionWord} pitch`;
    shortText = actionWord;
  } else if (absCents <= 20) {
    // Significantly off (11-20 cents)
    text = `${actionWord} pitch more`;
    shortText = `${actionWord} ↓↓`;
  } else {
    // Way off (>20 cents)
    text = `${actionWord} pitch a lot`;
    shortText = `${actionWord} ↓↓↓`;
  }

  // Use proper arrows based on direction
  if (direction === "raise") {
    shortText = shortText.replace(/↓/g, "↑");
  }

  return {
    text,
    shortText,
    direction,
  };
}
