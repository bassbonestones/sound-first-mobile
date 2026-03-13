/**
 * Target Tone Challenge (Phase 2A)
 *
 * Gamified pitch challenges: "Hold C3 within ±5 cents for 4 seconds"
 * Tracks progress, validates pitch accuracy, and celebrates success.
 */

import {
  CHALLENGE_DEFAULT_TOLERANCE,
  CHALLENGE_DEFAULT_DURATION_MS,
  CHALLENGE_MIN_HOLD_MS,
  CHALLENGE_DIFFICULTIES,
  type ChallengeDifficulty,
} from "./tunerConstants";

// ===========================================
// TYPES
// ===========================================

export interface ChallengeTarget {
  /** Target note name (e.g., "C3", "A4") */
  note: string;
  /** Tolerance in cents (how close they need to be) */
  tolerance: number;
  /** Required hold duration in ms */
  durationMs: number;
  /** Difficulty level */
  difficulty: ChallengeDifficulty;
}

export type ChallengeStatus =
  | "idle" // No challenge active
  | "waiting" // Challenge active, waiting for correct note
  | "holding" // User is holding within tolerance
  | "success" // Challenge completed!
  | "failed"; // User broke tolerance (optional - could just reset progress)

export interface ChallengeState {
  /** Current challenge status */
  status: ChallengeStatus;
  /** Target to hit (null if no active challenge) */
  target: ChallengeTarget | null;
  /** Timestamp when user started holding within tolerance */
  holdStartTime: number | null;
  /** Current hold progress (0-1) */
  progress: number;
  /** Number of challenges completed this session */
  completedCount: number;
  /** Total attempts this session */
  attemptCount: number;
}

// ===========================================
// INITIAL STATE
// ===========================================

export function createInitialChallengeState(): ChallengeState {
  return {
    status: "idle",
    target: null,
    holdStartTime: null,
    progress: 0,
    completedCount: 0,
    attemptCount: 0,
  };
}

// ===========================================
// CHALLENGE CREATION
// ===========================================

/**
 * Create a challenge target for a specific note.
 */
export function createChallengeTarget(
  note: string,
  difficulty: ChallengeDifficulty = "medium",
): ChallengeTarget {
  const settings = CHALLENGE_DIFFICULTIES[difficulty];
  return {
    note,
    tolerance: settings.tolerance,
    durationMs: settings.durationMs,
    difficulty,
  };
}

/**
 * Create a random challenge from a list of notes.
 */
export function createRandomChallenge(
  notes: string[],
  difficulty: ChallengeDifficulty = "medium",
): ChallengeTarget {
  const randomIndex = Math.floor(Math.random() * notes.length);
  return createChallengeTarget(notes[randomIndex], difficulty);
}

/**
 * Default note pool for challenges (common range for most instruments).
 */
export const DEFAULT_CHALLENGE_NOTES = [
  "C3",
  "D3",
  "E3",
  "F3",
  "G3",
  "A3",
  "B3",
  "C4",
  "D4",
  "E4",
  "F4",
  "G4",
  "A4",
  "B4",
  "C5",
];

// ===========================================
// CHALLENGE LOGIC
// ===========================================

/**
 * Check if the current note matches the target.
 * Returns true if note name matches (ignoring octave differences for flexibility).
 */
export function isTargetNote(
  currentNote: string | null,
  targetNote: string,
): boolean {
  if (!currentNote) return false;
  // Exact match (including octave)
  return currentNote === targetNote;
}

/**
 * Check if cents deviation is within tolerance.
 */
export function isWithinTolerance(
  cents: number,
  tolerance: number = CHALLENGE_DEFAULT_TOLERANCE,
): boolean {
  return Math.abs(cents) <= tolerance;
}

/**
 * Check if current pitch matches challenge requirements.
 */
export function matchesChallenge(
  currentNote: string | null,
  cents: number,
  target: ChallengeTarget | null,
): boolean {
  if (!target || !currentNote) return false;
  return (
    isTargetNote(currentNote, target.note) &&
    isWithinTolerance(cents, target.tolerance)
  );
}

/**
 * Calculate challenge progress based on hold duration.
 */
export function calculateChallengeProgress(
  holdStartTime: number | null,
  durationMs: number,
  now: number = Date.now(),
): number {
  if (!holdStartTime) return 0;
  const elapsed = now - holdStartTime;
  if (elapsed < CHALLENGE_MIN_HOLD_MS) return 0; // Minimum hold before counting
  return Math.min(1, elapsed / durationMs);
}

/**
 * Check if challenge is complete (progress >= 1).
 */
export function isChallengeComplete(progress: number): boolean {
  return progress >= 1;
}

// ===========================================
// STATE UPDATES
// ===========================================

/**
 * Start a new challenge.
 */
export function startChallenge(
  state: ChallengeState,
  target: ChallengeTarget,
): ChallengeState {
  return {
    ...state,
    status: "waiting",
    target,
    holdStartTime: null,
    progress: 0,
    attemptCount: state.attemptCount + 1,
  };
}

/**
 * Update challenge state based on current pitch.
 * Call this on each pitch detection update.
 */
export function updateChallengeState(
  state: ChallengeState,
  currentNote: string | null,
  cents: number,
  now: number = Date.now(),
): ChallengeState {
  // No active challenge
  if (state.status === "idle" || state.status === "success" || !state.target) {
    return state;
  }

  const matches = matchesChallenge(currentNote, cents, state.target);

  if (matches) {
    // Start or continue hold
    const holdStartTime = state.holdStartTime ?? now;
    const progress = calculateChallengeProgress(
      holdStartTime,
      state.target.durationMs,
      now,
    );

    if (isChallengeComplete(progress)) {
      // Challenge complete!
      return {
        ...state,
        status: "success",
        holdStartTime,
        progress: 1,
        completedCount: state.completedCount + 1,
      };
    }

    return {
      ...state,
      status: "holding",
      holdStartTime,
      progress,
    };
  } else {
    // Not matching - reset hold progress but stay in waiting state
    return {
      ...state,
      status: "waiting",
      holdStartTime: null,
      progress: 0,
    };
  }
}

/**
 * Cancel the current challenge.
 */
export function cancelChallenge(state: ChallengeState): ChallengeState {
  return {
    ...state,
    status: "idle",
    target: null,
    holdStartTime: null,
    progress: 0,
  };
}

/**
 * Reset to idle after success (to start a new challenge).
 */
export function resetAfterSuccess(state: ChallengeState): ChallengeState {
  return {
    ...state,
    status: "idle",
    target: null,
    holdStartTime: null,
    progress: 0,
  };
}

// ===========================================
// DISPLAY HELPERS
// ===========================================

/**
 * Get the challenge instruction text.
 */
export function getChallengeInstructionText(target: ChallengeTarget): string {
  const seconds = Math.round(target.durationMs / 1000);
  return `Hold ${target.note} within ±${target.tolerance}¢ for ${seconds}s`;
}

/**
 * Get status message for current challenge state.
 */
export function getChallengeStatusText(state: ChallengeState): string {
  switch (state.status) {
    case "idle":
      return "Start a challenge!";
    case "waiting":
      return state.target ? `Play ${state.target.note}...` : "";
    case "holding":
      const percent = Math.round(state.progress * 100);
      return `Hold it! ${percent}%`;
    case "success":
      return "🎉 Success!";
    case "failed":
      return "Try again!";
    default:
      return "";
  }
}

/**
 * Get color for progress bar based on state.
 */
export function getChallengeProgressColor(state: ChallengeState): string {
  switch (state.status) {
    case "holding":
      return "#4CAF50"; // Green - making progress
    case "success":
      return "#2196F3"; // Blue - complete
    case "waiting":
      return "#888"; // Gray - waiting
    default:
      return "#888";
  }
}
