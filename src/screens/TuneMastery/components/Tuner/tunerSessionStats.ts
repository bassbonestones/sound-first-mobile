/**
 * Tuner Session Stats
 *
 * Session-level tracking for Phase 2A: Local Feedback.
 * Tracks pitch accuracy, stability, and control metrics during a tuning session.
 *
 * Key Metrics:
 * - Pitch Accuracy: % of time within tolerance
 * - Pitch Stability: Average stability score (inverted std dev)
 * - Pitch Control: Combined metric (accuracy × stability)
 *
 * This is session-scoped (no persistence) — resets when tuner unmounts.
 */

import {
  CENTERED_THRESHOLD,
  STABLE_STD_DEV,
  SESSION_MIN_SAMPLES,
  SESSION_STABILITY_SCORE_DIVISOR,
  SESSION_ACCURACY_TOLERANCE,
} from "./tunerConstants";
import { computeStability, type StabilityResult } from "./tunerHelpers";

// ===========================================
// TYPES
// ===========================================

export interface SessionSample {
  /** Cents deviation at this sample */
  cents: number;
  /** Stability std dev at this sample */
  stdDev: number;
  /** Timestamp of this sample */
  timestamp: number;
  /** Note name being played (e.g., "C4") */
  note: string | null;
  /** Whether this is the first sample after attack warmup */
  isAttackSample: boolean;
}

export interface SessionStats {
  /** Total number of post-warmup samples collected */
  totalSamples: number;
  /** Number of samples within accuracy tolerance */
  accurateSamples: number;
  /** Sum of stability scores (for calculating average) */
  stabilitySum: number;
  /** Attack samples (first stable reading per note) */
  attackSamples: SessionSample[];
  /** Session start timestamp */
  startTime: number;
  /** Whether session has enough data to show stats */
  hasEnoughData: boolean;
}

export interface SessionScores {
  /** Pitch accuracy: % of time within tolerance (0-100) */
  accuracy: number;
  /** Pitch stability: Average stability score (0-100, higher = more stable) */
  stability: number;
  /** Pitch control: Combined metric (0-100) */
  control: number;
  /** Whether scores are valid (enough samples) */
  isValid: boolean;
}

export interface AttackSummary {
  /** Average attack deviation in cents */
  averageAttackCents: number;
  /** Direction: "sharp", "flat", or "neutral" */
  attackDirection: "sharp" | "flat" | "neutral";
  /** Human-readable summary like "Your attacks averaged +4¢ sharp" */
  summaryText: string | null;
  /** Number of attack samples used */
  sampleCount: number;
}

// ===========================================
// INITIAL STATE
// ===========================================

export function createInitialSessionStats(): SessionStats {
  return {
    totalSamples: 0,
    accurateSamples: 0,
    stabilitySum: 0,
    attackSamples: [],
    startTime: Date.now(),
    hasEnoughData: false,
  };
}

// ===========================================
// SESSION RECORDING
// ===========================================

/**
 * Record a new sample to the session stats.
 * Called on each pitch detection update (after warmup).
 */
export function recordSessionSample(
  stats: SessionStats,
  sample: Omit<SessionSample, "timestamp">,
): SessionStats {
  const timestamp = Date.now();

  const newStats = { ...stats };
  newStats.totalSamples += 1;

  // Track accuracy: within tolerance?
  if (Math.abs(sample.cents) <= SESSION_ACCURACY_TOLERANCE) {
    newStats.accurateSamples += 1;
  }

  // Track stability: convert stdDev to 0-100 score
  // Lower stdDev = higher score. Use SESSION_STABILITY_SCORE_DIVISOR as the "bad" baseline.
  const stabilityScore = Math.max(
    0,
    Math.min(
      100,
      100 - (sample.stdDev / SESSION_STABILITY_SCORE_DIVISOR) * 100,
    ),
  );
  newStats.stabilitySum += stabilityScore;

  // Track attack samples (first stable reading per note onset)
  if (sample.isAttackSample) {
    newStats.attackSamples = [
      ...newStats.attackSamples,
      { ...sample, timestamp },
    ];
  }

  // Update hasEnoughData flag
  newStats.hasEnoughData = newStats.totalSamples >= SESSION_MIN_SAMPLES;

  return newStats;
}

/**
 * Reset session stats (e.g., when user taps "Reset" button).
 */
export function resetSessionStats(): SessionStats {
  return createInitialSessionStats();
}

// ===========================================
// SCORE CALCULATIONS
// ===========================================

/**
 * Calculate current session scores from accumulated stats.
 */
export function calculateSessionScores(stats: SessionStats): SessionScores {
  if (!stats.hasEnoughData || stats.totalSamples === 0) {
    return {
      accuracy: 0,
      stability: 0,
      control: 0,
      isValid: false,
    };
  }

  // Accuracy: % of samples within tolerance
  const accuracy = Math.round(
    (stats.accurateSamples / stats.totalSamples) * 100,
  );

  // Stability: Average stability score (already 0-100)
  const stability = Math.round(stats.stabilitySum / stats.totalSamples);

  // Control: Combined metric - geometric mean gives balanced weighting
  // If either is 0, control is 0 (both matter)
  const control = Math.round(Math.sqrt(accuracy * stability));

  return {
    accuracy,
    stability,
    control,
    isValid: true,
  };
}

// ===========================================
// ATTACK SUMMARY
// ===========================================

/**
 * Calculate attack tendency summary from attack samples.
 */
export function calculateAttackSummary(stats: SessionStats): AttackSummary {
  const { attackSamples } = stats;

  if (attackSamples.length < 3) {
    return {
      averageAttackCents: 0,
      attackDirection: "neutral",
      summaryText: null,
      sampleCount: attackSamples.length,
    };
  }

  // Calculate mean attack cents
  const sum = attackSamples.reduce((acc, s) => acc + s.cents, 0);
  const averageAttackCents = sum / attackSamples.length;

  // Determine direction
  const absMean = Math.abs(averageAttackCents);
  let attackDirection: "sharp" | "flat" | "neutral" = "neutral";
  let summaryText: string | null = null;

  if (absMean >= 2) {
    // Meaningful bias
    attackDirection = averageAttackCents > 0 ? "sharp" : "flat";
    const roundedCents = Math.round(absMean);
    const direction = attackDirection === "sharp" ? "sharp" : "flat";
    const sign = averageAttackCents > 0 ? "+" : "-";
    summaryText = `Your attacks averaged ${sign}${roundedCents}¢ ${direction}`;
  }

  return {
    averageAttackCents,
    attackDirection,
    summaryText,
    sampleCount: attackSamples.length,
  };
}

// ===========================================
// DRIFT SUMMARY (per sustained note)
// ===========================================

export interface DriftSummary {
  /** Average drift direction during sustained notes */
  driftDirection: "sharp" | "flat" | "stable";
  /** Average drift rate in cents per second */
  driftRate: number;
  /** Human-readable summary */
  summaryText: string | null;
}

/**
 * Calculate drift tendency from a series of cents readings during a sustained note.
 * Uses linear regression to find the drift slope.
 *
 * @param centsHistory - Array of {cents, timestamp} for a sustained note
 */
export function calculateDriftFromHistory(
  centsHistory: Array<{ cents: number; timestamp: number }>,
): DriftSummary {
  if (centsHistory.length < 10) {
    return {
      driftDirection: "stable",
      driftRate: 0,
      summaryText: null,
    };
  }

  // Simple linear regression: find slope of cents over time
  const n = centsHistory.length;
  const firstTime = centsHistory[0].timestamp;

  // Convert timestamps to seconds from start
  const data = centsHistory.map((h) => ({
    x: (h.timestamp - firstTime) / 1000, // seconds
    y: h.cents,
  }));

  // Calculate means
  const meanX = data.reduce((sum, d) => sum + d.x, 0) / n;
  const meanY = data.reduce((sum, d) => sum + d.y, 0) / n;

  // Calculate slope (cents per second)
  let numerator = 0;
  let denominator = 0;
  for (const d of data) {
    numerator += (d.x - meanX) * (d.y - meanY);
    denominator += (d.x - meanX) ** 2;
  }

  const driftRate = denominator !== 0 ? numerator / denominator : 0;
  const absDriftRate = Math.abs(driftRate);

  // Determine direction and generate summary
  let driftDirection: "sharp" | "flat" | "stable" = "stable";
  let summaryText: string | null = null;

  if (absDriftRate >= 1) {
    // Drifting at least 1 cent per second
    driftDirection = driftRate > 0 ? "sharp" : "flat";
    const intensity =
      absDriftRate >= 3 ? "noticeably" : absDriftRate >= 2 ? "" : "slightly";
    summaryText =
      `Pitch drifts ${intensity} ${driftDirection} over time`.replace(
        /\s+/g,
        " ",
      );
  }

  return {
    driftDirection,
    driftRate,
    summaryText,
  };
}

// ===========================================
// STABILITY SUMMARY
// ===========================================

export interface StabilitySummary {
  /** Average stability level: "stable", "moderate", or "unstable" */
  averageLevel: "stable" | "moderate" | "unstable";
  /** Average std dev over the session */
  averageStdDev: number;
  /** Human-readable summary */
  summaryText: string | null;
}

/**
 * Calculate overall stability summary from session scores.
 */
export function calculateStabilitySummary(
  scores: SessionScores,
): StabilitySummary {
  if (!scores.isValid) {
    return {
      averageLevel: "unstable",
      averageStdDev: 0,
      summaryText: null,
    };
  }

  // Convert stability score back to approximate std dev for context
  // score = 100 - (stdDev / divisor) * 100
  // stdDev = (100 - score) / 100 * divisor
  const approxStdDev =
    ((100 - scores.stability) / 100) * SESSION_STABILITY_SCORE_DIVISOR;

  let averageLevel: "stable" | "moderate" | "unstable";
  let summaryText: string | null = null;

  if (scores.stability >= 80) {
    averageLevel = "stable";
    summaryText = "Your pitch is very stable — great breath control!";
  } else if (scores.stability >= 50) {
    averageLevel = "moderate";
    summaryText = "Your pitch stability is developing — focus on steady air";
  } else {
    averageLevel = "unstable";
    summaryText =
      "Pitch varies significantly — try long tones to build control";
  }

  return {
    averageLevel,
    averageStdDev: approxStdDev,
    summaryText,
  };
}
