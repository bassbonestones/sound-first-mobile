/**
 * Tuner State Machine
 *
 * Pure state transitions for the tuner.
 * Separates logic from UI for testability.
 *
 * State Flow:
 *
 * ┌─────────────┐
 * │  NO_SIGNAL  │ ← No audio input detected
 * └─────┬───────┘
 *       │ signal detected
 *       ▼
 * ┌─────────────┐
 * │  DETECTING  │ ← Warmup period (200ms)
 * └─────┬───────┘
 *       │ warmup complete
 *       ▼
 * ┌─────────────┐     ┌───────────────────┐
 * │ OUT_OF_TUNE │ ←→  │  IN_TUNE_UNSTABLE │ ← centered but unstable
 * └─────────────┘     └─────────┬─────────┘
 *                               │ becomes stable
 *                               ▼
 *                     ┌───────────────────┐
 *                     │   IN_TUNE_STABLE  │ ← centered + stable
 *                     └─────────┬─────────┘
 *                               │ 500ms centered + stable
 *                               ▼
 *                     ┌───────────────────┐
 *                     │  PERFECT_LOCKED   │ ← achievement state
 *                     └───────────────────┘
 */

import {
  CENTERED_THRESHOLD,
  STABLE_STD_DEV,
  CENTER_LOCK_MS,
  DETECTION_WARMUP_MS,
} from "./tunerConstants";
import { computeStability, type StabilityResult } from "./tunerHelpers";

// ===========================================
// TYPES
// ===========================================

export type TunerState =
  | "NO_SIGNAL"
  | "DETECTING"
  | "OUT_OF_TUNE"
  | "IN_TUNE_UNSTABLE"
  | "IN_TUNE_STABLE"
  | "PERFECT_LOCKED";

export interface TunerStateContext {
  /** Current top-level state */
  state: TunerState;
  /** Timestamp when signal was first detected (for warmup) */
  signalStartTime: number | null;
  /** Timestamp when user became centered AND stable (for lock timing) */
  centeredStableStartTime: number | null;
  /** Current cents deviation */
  cents: number;
  /** Current stability metrics */
  stability: StabilityResult;
  /** Is note detected */
  hasSignal: boolean;
  /** Is warmup complete */
  warmupComplete: boolean;
}

export type TunerAction =
  | {
      type: "SIGNAL_DETECTED";
      cents: number;
      centsHistory: number[];
      timestamp: number;
    }
  | { type: "SIGNAL_LOST" }
  | { type: "TICK"; timestamp: number };

// ===========================================
// INITIAL STATE
// ===========================================

const initialStability: StabilityResult = {
  stdDev: 0,
  isStable: false,
  isModerate: false,
  isUnstable: true,
};

export const initialContext: TunerStateContext = {
  state: "NO_SIGNAL",
  signalStartTime: null,
  centeredStableStartTime: null,
  cents: 0,
  stability: initialStability,
  hasSignal: false,
  warmupComplete: false,
};

// ===========================================
// DERIVED STATE HELPERS
// ===========================================

function isCentered(cents: number): boolean {
  return Math.abs(cents) <= CENTERED_THRESHOLD;
}

function isStable(stability: StabilityResult): boolean {
  return stability.isStable;
}

// ===========================================
// STATE MACHINE REDUCER
// ===========================================

export function tunerReducer(
  context: TunerStateContext,
  action: TunerAction,
): TunerStateContext {
  switch (action.type) {
    case "SIGNAL_DETECTED": {
      const { cents, centsHistory, timestamp } = action;
      const stability = computeStability(centsHistory);
      const centered = isCentered(cents);
      const stable = isStable(stability);

      // Initialize signal start time if first detection
      const signalStartTime = context.signalStartTime ?? timestamp;

      // Check if warmup is complete (200ms since signal start)
      const warmupComplete = timestamp - signalStartTime >= DETECTION_WARMUP_MS;

      // Base context updates
      const baseContext: TunerStateContext = {
        ...context,
        cents,
        stability,
        hasSignal: true,
        signalStartTime,
        warmupComplete,
      };

      // If still in warmup, stay in DETECTING state
      if (!warmupComplete) {
        return {
          ...baseContext,
          state: "DETECTING",
          centeredStableStartTime: null,
        };
      }

      // Warmup complete - determine actual state
      if (!centered) {
        // Out of tune - reset centered stable timer
        return {
          ...baseContext,
          state: "OUT_OF_TUNE",
          centeredStableStartTime: null,
        };
      }

      // Centered - check stability
      if (!stable) {
        // Centered but unstable
        return {
          ...baseContext,
          state: "IN_TUNE_UNSTABLE",
          centeredStableStartTime: null,
        };
      }

      // Centered AND stable
      const centeredStableStartTime =
        context.centeredStableStartTime ?? timestamp;
      const centeredStableDuration = timestamp - centeredStableStartTime;

      // Check if we've been centered + stable long enough for lock
      if (centeredStableDuration >= CENTER_LOCK_MS) {
        return {
          ...baseContext,
          state: "PERFECT_LOCKED",
          centeredStableStartTime,
        };
      }

      // Centered + stable but not long enough for lock yet
      return {
        ...baseContext,
        state: "IN_TUNE_STABLE",
        centeredStableStartTime,
      };
    }

    case "SIGNAL_LOST": {
      return {
        ...initialContext,
      };
    }

    case "TICK": {
      // Used for updating lock timer while signal continues
      // If we have a centeredStableStartTime, check if we should transition to PERFECT_LOCKED
      const { timestamp } = action;

      if (
        context.state === "IN_TUNE_STABLE" &&
        context.centeredStableStartTime !== null
      ) {
        const centeredStableDuration =
          timestamp - context.centeredStableStartTime;
        if (centeredStableDuration >= CENTER_LOCK_MS) {
          return {
            ...context,
            state: "PERFECT_LOCKED",
          };
        }
      }

      return context;
    }

    default:
      return context;
  }
}

// ===========================================
// SELECTOR HELPERS
// ===========================================

/**
 * Get the duration (ms) that user has been centered and stable.
 * Returns 0 if not currently centered + stable.
 */
export function getCenteredStableDuration(
  context: TunerStateContext,
  currentTime: number,
): number {
  if (context.centeredStableStartTime === null) {
    return 0;
  }
  return currentTime - context.centeredStableStartTime;
}

/**
 * Check if the tuner is in a "detecting/warmup" phase.
 */
export function isDetectingPhase(context: TunerStateContext): boolean {
  return context.state === "DETECTING";
}

/**
 * Check if a lock indicator should be shown.
 */
export function isLocked(context: TunerStateContext): boolean {
  return context.state === "PERFECT_LOCKED";
}

/**
 * Check if user is in tune (centered, regardless of stability).
 */
export function isInTune(context: TunerStateContext): boolean {
  return (
    context.state === "IN_TUNE_UNSTABLE" ||
    context.state === "IN_TUNE_STABLE" ||
    context.state === "PERFECT_LOCKED"
  );
}
