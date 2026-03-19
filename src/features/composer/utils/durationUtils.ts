/**
 * Duration Utilities
 *
 * Functions for working with note durations.
 */

import type { DurationValue, TimeSignature } from "../types";
import { DURATION, DURATION_NAME_TO_VALUE, DurationName } from "../types";

// =============================================================================
// Duration Selection
// =============================================================================

/** All available durations in order (longest to shortest) */
export const DURATION_OPTIONS: readonly DurationValue[] = [
  DURATION.WHOLE,
  DURATION.HALF,
  DURATION.QUARTER,
  DURATION.EIGHTH,
  DURATION.SIXTEENTH,
] as const;

/** Get the next shorter duration */
export function getShorterDuration(
  current: DurationValue,
): DurationValue | null {
  const index = DURATION_OPTIONS.indexOf(current);
  if (index === -1 || index === DURATION_OPTIONS.length - 1) {
    return null;
  }
  return DURATION_OPTIONS[index + 1];
}

/** Get the next longer duration */
export function getLongerDuration(
  current: DurationValue,
): DurationValue | null {
  const index = DURATION_OPTIONS.indexOf(current);
  if (index === -1 || index === 0) {
    return null;
  }
  return DURATION_OPTIONS[index - 1];
}

// =============================================================================
// Duration Formatting
// =============================================================================

/** Format duration as beats display (e.g., "1 beat", "2 beats") */
export function formatDurationAsBeats(duration: DurationValue): string {
  if (duration === 1) return "1 beat";
  if (duration < 1) return `${duration} beats`;
  return `${duration} beats`;
}

/** Get display name for duration */
export function getDurationDisplayName(duration: DurationValue): string {
  const names: Record<DurationValue, string> = {
    [DURATION.WHOLE]: "Whole",
    [DURATION.HALF]: "Half",
    [DURATION.QUARTER]: "Quarter",
    [DURATION.EIGHTH]: "8th",
    [DURATION.SIXTEENTH]: "16th",
  };
  return names[duration] || `${duration}`;
}

/** Get duration symbol for compact display */
export function getDurationSymbol(duration: DurationValue): string {
  const symbols: Record<DurationValue, string> = {
    [DURATION.WHOLE]: "𝅝",
    [DURATION.HALF]: "𝅗𝅥",
    [DURATION.QUARTER]: "♩",
    [DURATION.EIGHTH]: "♪",
    [DURATION.SIXTEENTH]: "𝅘𝅥𝅯",
  };
  return symbols[duration] || "?";
}

// =============================================================================
// Measure Capacity
// =============================================================================

/** Calculate remaining duration in a measure */
export function getRemainingDuration(
  currentDuration: number,
  timeSignature: TimeSignature,
): number {
  const capacity = (timeSignature.beats * 4) / timeSignature.beatUnit;
  return Math.max(0, capacity - currentDuration);
}

/** Get all durations that would fit in remaining space */
export function getDurationsThatFit(
  remainingDuration: number,
): DurationValue[] {
  return DURATION_OPTIONS.filter((d) => d <= remainingDuration + 0.001);
}

/** Find the largest duration that fits in remaining space */
export function getLargestFittingDuration(
  remainingDuration: number,
): DurationValue | null {
  for (const duration of DURATION_OPTIONS) {
    if (duration <= remainingDuration + 0.001) {
      return duration;
    }
  }
  return null;
}

// =============================================================================
// Auto-fill Helpers
// =============================================================================

/** Generate rests to fill remaining measure duration */
export function generateRestsToFill(
  remainingDuration: number,
): DurationValue[] {
  const rests: DurationValue[] = [];
  let remaining = remainingDuration;

  while (remaining > 0.001) {
    const duration = getLargestFittingDuration(remaining);
    if (!duration) break;
    rests.push(duration);
    remaining -= duration;
  }

  return rests;
}

// =============================================================================
// Keyboard Mapping
// =============================================================================

/** Map from keyboard number to duration */
export const KEYBOARD_DURATION_MAP: Record<string, DurationName> = {
  "1": "whole",
  "2": "half",
  "3": "quarter",
  "4": "eighth",
  "5": "sixteenth",
};

/** Get duration from keyboard key */
export function getDurationFromKey(key: string): DurationValue | null {
  const name = KEYBOARD_DURATION_MAP[key];
  if (!name) return null;
  return DURATION_NAME_TO_VALUE[name];
}
