/**
 * Cursor Utilities
 *
 * Functions for navigating within a score.
 */

import type { ComposerScore, CursorPosition, Note } from "../types";

// =============================================================================
// Cursor Navigation
// =============================================================================

/** Move cursor to the next note position */
export function moveCursorRight(
  cursor: CursorPosition,
  score: ComposerScore,
): CursorPosition {
  const currentMeasure = score.measures[cursor.measureIndex];
  if (!currentMeasure) return cursor;

  // If there's a next note in this measure, go to it
  if (cursor.noteIndex < currentMeasure.notes.length - 1) {
    return {
      measureIndex: cursor.measureIndex,
      noteIndex: cursor.noteIndex + 1,
    };
  }

  // At or past last note - try to move to first note of next measure
  if (cursor.measureIndex < score.measures.length - 1) {
    return {
      measureIndex: cursor.measureIndex + 1,
      noteIndex: 0,
    };
  }

  // At last measure - go to end position (for insertion)
  if (cursor.noteIndex < currentMeasure.notes.length) {
    return {
      measureIndex: cursor.measureIndex,
      noteIndex: currentMeasure.notes.length,
    };
  }

  // Already at end
  return cursor;
}

/** Move cursor to the previous note position */
export function moveCursorLeft(
  cursor: CursorPosition,
  score: ComposerScore,
): CursorPosition {
  const currentMeasure = score.measures[cursor.measureIndex];

  // If we can move within the current measure
  if (cursor.noteIndex > 0) {
    // If at end-of-measure position, go to last actual note
    const targetIndex = Math.min(
      cursor.noteIndex - 1,
      (currentMeasure?.notes.length ?? 1) - 1,
    );
    return {
      measureIndex: cursor.measureIndex,
      noteIndex: Math.max(0, targetIndex),
    };
  }

  // Move to previous measure if available - go to last actual note
  if (cursor.measureIndex > 0) {
    const prevMeasure = score.measures[cursor.measureIndex - 1];
    const lastNoteIndex = Math.max(0, (prevMeasure?.notes.length ?? 1) - 1);
    return {
      measureIndex: cursor.measureIndex - 1,
      noteIndex: prevMeasure?.notes.length ? lastNoteIndex : 0,
    };
  }

  // Already at start
  return cursor;
}

/** Move cursor to the start of the next measure */
export function moveCursorToNextMeasure(
  cursor: CursorPosition,
  score: ComposerScore,
): CursorPosition {
  if (cursor.measureIndex < score.measures.length - 1) {
    return {
      measureIndex: cursor.measureIndex + 1,
      noteIndex: 0,
    };
  }
  return cursor;
}

/** Move cursor to the start of the previous measure */
export function moveCursorToPreviousMeasure(
  cursor: CursorPosition,
  score: ComposerScore,
): CursorPosition {
  if (cursor.measureIndex > 0) {
    return {
      measureIndex: cursor.measureIndex - 1,
      noteIndex: 0,
    };
  }
  return cursor;
}

/** Move cursor to the start of the score */
export function moveCursorToStart(): CursorPosition {
  return { measureIndex: 0, noteIndex: 0 };
}

/** Move cursor to the end of the score */
export function moveCursorToEnd(score: ComposerScore): CursorPosition {
  const lastMeasureIndex = Math.max(0, score.measures.length - 1);
  const lastMeasure = score.measures[lastMeasureIndex];
  return {
    measureIndex: lastMeasureIndex,
    noteIndex: lastMeasure?.notes.length ?? 0,
  };
}

// =============================================================================
// Cursor Position Helpers
// =============================================================================

/** Get the note at the cursor position (or null if cursor is at end/empty) */
export function getNoteAtCursor(
  cursor: CursorPosition,
  score: ComposerScore,
): Note | null {
  const measure = score.measures[cursor.measureIndex];
  if (!measure) return null;
  return measure.notes[cursor.noteIndex] ?? null;
}

/** Get the note before the cursor (or null if at start) */
export function getNoteBefore(
  cursor: CursorPosition,
  score: ComposerScore,
): Note | null {
  if (cursor.noteIndex > 0) {
    const measure = score.measures[cursor.measureIndex];
    return measure?.notes[cursor.noteIndex - 1] ?? null;
  }
  if (cursor.measureIndex > 0) {
    const prevMeasure = score.measures[cursor.measureIndex - 1];
    return prevMeasure?.notes[prevMeasure.notes.length - 1] ?? null;
  }
  return null;
}

/** Check if cursor is at the start of the score */
export function isAtStart(cursor: CursorPosition): boolean {
  return cursor.measureIndex === 0 && cursor.noteIndex === 0;
}

/** Check if cursor is at the end of the score */
export function isAtEnd(cursor: CursorPosition, score: ComposerScore): boolean {
  const lastMeasureIndex = score.measures.length - 1;
  if (cursor.measureIndex !== lastMeasureIndex) return false;
  const lastMeasure = score.measures[lastMeasureIndex];
  return cursor.noteIndex >= (lastMeasure?.notes.length ?? 0);
}

/** Check if cursor is at the start of a measure */
export function isAtMeasureStart(cursor: CursorPosition): boolean {
  return cursor.noteIndex === 0;
}

/** Check if cursor is at the end of a measure */
export function isAtMeasureEnd(
  cursor: CursorPosition,
  score: ComposerScore,
): boolean {
  const measure = score.measures[cursor.measureIndex];
  return cursor.noteIndex >= (measure?.notes.length ?? 0);
}

// =============================================================================
// Cursor Validation
// =============================================================================

/** Validate and clamp cursor to valid bounds */
export function clampCursor(
  cursor: CursorPosition,
  score: ComposerScore,
): CursorPosition {
  if (score.measures.length === 0) {
    return { measureIndex: 0, noteIndex: 0 };
  }

  const measureIndex = Math.max(
    0,
    Math.min(cursor.measureIndex, score.measures.length - 1),
  );
  const measure = score.measures[measureIndex];
  const noteIndex = Math.max(
    0,
    Math.min(cursor.noteIndex, measure.notes.length),
  );

  return { measureIndex, noteIndex };
}

/** Check if two cursor positions are equal */
export function cursorsEqual(a: CursorPosition, b: CursorPosition): boolean {
  return a.measureIndex === b.measureIndex && a.noteIndex === b.noteIndex;
}

// =============================================================================
// Selection by ID
// =============================================================================

/** Find cursor position for a note by ID */
export function findNotePosition(
  noteId: string,
  score: ComposerScore,
): CursorPosition | null {
  for (let mi = 0; mi < score.measures.length; mi++) {
    const measure = score.measures[mi];
    for (let ni = 0; ni < measure.notes.length; ni++) {
      if (measure.notes[ni].id === noteId) {
        return { measureIndex: mi, noteIndex: ni };
      }
    }
  }
  return null;
}
