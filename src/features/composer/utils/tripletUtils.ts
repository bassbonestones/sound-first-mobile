/**
 * Triplet Utilities
 *
 * Pure functions for working with triplet notes and groups.
 * Extracted from useComposerState for better testability and reuse.
 */

import type { Accidental, Note, TimeSignature } from "../types";
import {
  createTripletNote,
  createTripletRest,
  DURATION,
  generateId,
  generateRestsForDuration,
  getBeatPositionAt,
  getNoteDuration,
} from "../types";
import type { Measure } from "../types";

// =============================================================================
// Types
// =============================================================================

/** Result of inserting a triplet group */
export interface InsertTripletGroupResult {
  /** The new array of notes for the measure */
  notes: Note[];
  /** Index where the triplet was inserted */
  insertedIndex: number;
  /** Unique ID for the triplet group */
  tripletGroupId: string;
  /** How many positions to advance the cursor */
  cursorAdvance: number;
}

/** Information about a triplet group */
export interface TripletGroupInfo {
  /** Type of triplet group: all eighths, all quarters, or mixed */
  type: "eighth" | "quarter" | "mixed";
  /** Total duration of the group in beats */
  totalDuration: number;
}

// =============================================================================
// Triplet Group Analysis
// =============================================================================

/**
 * Analyze a triplet group to determine its type and total duration
 *
 * @param notes - All notes in the measure
 * @param tripletGroupId - The group ID to analyze
 * @returns Group info or null if not found
 */
export function getTripletGroupInfo(
  notes: Note[],
  tripletGroupId: string,
): TripletGroupInfo | null {
  if (!tripletGroupId) return null;

  // Find all notes in this triplet group
  const groupNotes = notes.filter((n) => n.tripletGroupId === tripletGroupId);
  if (groupNotes.length === 0) return null;

  // Calculate total duration
  const totalDuration = groupNotes.reduce(
    (sum, n) => sum + getNoteDuration(n),
    0,
  );

  // Determine group type based on ACTUAL notes (not rests)
  // Only lock group type when filled with 3 actual notes of the same type
  const tolerance = 0.001;
  const actualNotes = groupNotes.filter((n) => n.midi !== null);

  // Check if all actual notes are the same type
  const allActualAreEighths = actualNotes.every(
    (n) => Math.abs(getNoteDuration(n) - DURATION.TRIPLET_EIGHTH) < tolerance,
  );
  const allActualAreQuarters = actualNotes.every(
    (n) => Math.abs(getNoteDuration(n) - DURATION.TRIPLET_QUARTER) < tolerance,
  );

  // Only lock if 3 actual notes of same type
  if (actualNotes.length === 3 && allActualAreEighths) {
    return { type: "eighth", totalDuration };
  } else if (actualNotes.length === 3 && allActualAreQuarters) {
    return { type: "quarter", totalDuration };
  }

  // Otherwise it's a mixed group (both types allowed)
  return { type: "mixed", totalDuration };
}

/**
 * Check if a triplet can be started at the given position
 *
 * Triplets divide beats into thirds, so we can only start a triplet at
 * positions divisible by 1/3 (i.e., beatPosition * 3 is an integer).
 *
 * @param measure - The measure to check
 * @param noteIndex - The note index position
 * @param currentNote - The note at the current position (if any)
 * @returns True if triplets can be started at this position
 */
export function canStartTripletAtPosition(
  measure: Measure | undefined,
  noteIndex: number,
  currentNote: Note | null | undefined,
): boolean {
  // If already in a triplet group, triplets are always allowed (continuing the group)
  if (currentNote?.tripletGroupId) return true;

  // Empty measure, can start triplet
  if (!measure) return true;

  const beatPosition = getBeatPositionAt(measure, noteIndex);

  // Check if beatPosition * 3 is close to an integer
  const tolerance = 0.001;
  const beatTimes3 = beatPosition * 3;
  return Math.abs(beatTimes3 - Math.round(beatTimes3)) < tolerance;
}

// =============================================================================
// Triplet Insertion
// =============================================================================

/**
 * Create a new triplet group by replacing existing notes at a position.
 *
 * Supports both triplet eighth (creates 3 equal slots) and triplet quarter
 * (creates quarter + 1 eighth rest for a mixed group).
 *
 * @param measureNotes - Current notes in the measure
 * @param noteIndex - Index where to insert the triplet
 * @param midi - MIDI pitch for the first note (null for rest)
 * @param accidental - Optional accidental for the first note
 * @param tripletDuration - The triplet duration type (TRIPLET_EIGHTH or TRIPLET_QUARTER)
 * @param _beatPosition - The beat position where insertion starts (unused but kept for API compatibility)
 * @param _timeSignature - The time signature (unused but kept for API compatibility)
 * @returns The result with new notes array, or null if insertion failed
 */
export function insertTripletGroup(
  measureNotes: Note[],
  noteIndex: number,
  midi: number | null,
  accidental: Accidental | undefined,
  tripletDuration:
    | typeof DURATION.TRIPLET_EIGHTH
    | typeof DURATION.TRIPLET_QUARTER,
  _beatPosition: number,
  _timeSignature: TimeSignature,
): InsertTripletGroupResult | null {
  const currentNote = measureNotes[noteIndex];
  if (!currentNote) return null;

  // Generate a unique ID for this triplet group
  const tripletGroupId = generateId();

  // Always create 1-beat groups when starting fresh
  // - Quarter triplets: 1-beat mixed group (quarter 2/3 + eighth rest 1/3)
  // - Eighth triplets: 1-beat group (3 x 1/3)
  // Pure 2-beat quarter groups (3 x 2/3) would require explicit creation
  const tripletGroupDuration = 1;

  // Collect notes to replace, starting from current position
  let durationConsumed = 0;
  let endIndex = noteIndex;
  while (
    endIndex < measureNotes.length &&
    durationConsumed < tripletGroupDuration - 0.001
  ) {
    durationConsumed += getNoteDuration(measureNotes[endIndex]);
    endIndex++;
  }

  // If we couldn't consume enough duration, don't insert
  if (durationConsumed < tripletGroupDuration - 0.001) {
    return null;
  }

  // Build the triplet notes based on duration and group type
  let tripletNotes: Note[];
  let cursorAdvance: number;

  if (tripletDuration === DURATION.TRIPLET_QUARTER) {
    // 1-beat mixed group: quarter (2/3) at position 1 + eighth rest (1/3) at position 3
    const tripletQuarter = createTripletNote(
      midi,
      DURATION.TRIPLET_QUARTER,
      1,
      tripletGroupId,
      { accidental },
    );
    const tripletRest = createTripletRest(
      3,
      tripletGroupId,
      DURATION.TRIPLET_EIGHTH,
    );
    tripletNotes = [tripletQuarter, tripletRest];
    cursorAdvance = 1; // Move to the eighth rest
  } else {
    // Triplet eighth: create 3 slots (entered note + 2 rests) = 1 beat
    const triplet1 = createTripletNote(
      midi,
      DURATION.TRIPLET_EIGHTH,
      1,
      tripletGroupId,
      { accidental },
    );
    const triplet2 = createTripletRest(
      2,
      tripletGroupId,
      DURATION.TRIPLET_EIGHTH,
    );
    const triplet3 = createTripletRest(
      3,
      tripletGroupId,
      DURATION.TRIPLET_EIGHTH,
    );
    tripletNotes = [triplet1, triplet2, triplet3];
    cursorAdvance = 1; // Move to position 2
  }

  // Build new notes array
  const newNotes: Note[] = [
    ...measureNotes.slice(0, noteIndex),
    ...tripletNotes,
  ];

  // If we consumed more than exactly 1 beat, add rests for the remainder
  const remainder = durationConsumed - tripletGroupDuration;
  if (remainder > 0.001) {
    const remainderRests = generateRestsForDuration(remainder);
    newNotes.push(...remainderRests);
  }

  // Add remaining notes after the consumed portion
  newNotes.push(...measureNotes.slice(endIndex));

  return {
    notes: newNotes,
    insertedIndex: noteIndex,
    tripletGroupId,
    cursorAdvance,
  };
}
