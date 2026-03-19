/**
 * usePracticeNotes Hook
 *
 * Extracts notes from an imported score at the current position
 * for real-time pitch matching during practice.
 */

import { useMemo, useCallback } from "react";
import type { ImportedScore, ImportedNoteEvent } from "../../../types/import";
import type { CurrentNoteTarget } from "../types/practiceTypes";
import { midiToFrequency, midiToNoteName } from "../types/practiceTypes";

// ============================================================================
// Types
// ============================================================================

export interface UsePracticeNotesOptions {
  /** The score being practiced */
  score: ImportedScore | null;
  /** Which part to track (default: 0 = first part) */
  partIndex?: number;
}

export interface UsePracticeNotesReturn {
  /** Get the target note for a given measure and beat */
  getNoteAtPosition: (
    measureNumber: number,
    beatNumber: number,
  ) => CurrentNoteTarget | null;

  /** Get all notes in a measure */
  getNotesInMeasure: (measureNumber: number) => CurrentNoteTarget[];

  /** Total note count in the score */
  totalNotes: number;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get duration in beats from duration type
 * Assumes 4/4 time signature (1 beat = quarter note)
 */
function getDurationInBeats(durationType: string): number {
  switch (durationType) {
    case "whole":
      return 4;
    case "half":
      return 2;
    case "quarter":
      return 1;
    case "eighth":
      return 0.5;
    case "16th":
      return 0.25;
    case "32nd":
      return 0.125;
    case "64th":
      return 0.0625;
    case "128th":
      return 0.03125;
    default:
      return 1;
  }
}

/**
 * Convert pitch info to MIDI note number
 * Uses 'step' property from PitchInfo interface
 */
function pitchToMidi(pitch: {
  step: string;
  octave: number;
  alter?: number;
}): number {
  const noteMap: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };

  const baseNote = noteMap[pitch.step.toUpperCase()] ?? 0;
  const alter = pitch.alter ?? 0;
  const octave = pitch.octave;

  return (octave + 1) * 12 + baseNote + alter;
}

/**
 * Convert note event to current target
 */
function noteEventToTarget(
  note: ImportedNoteEvent,
  measureNumber: number,
  beatPosition: number,
): CurrentNoteTarget | null {
  const durationBeats = getDurationInBeats(note.durationType);
  const isRest = note.type === "rest";

  // Handle rests
  if (isRest || !note.pitch) {
    return {
      midiNote: 0,
      noteName: "",
      frequency: 0,
      measureNumber,
      beatPosition,
      durationBeats,
      isRest: true,
    };
  }

  const midiNote = pitchToMidi(note.pitch);

  return {
    midiNote,
    noteName: midiToNoteName(midiNote),
    frequency: midiToFrequency(midiNote),
    measureNumber,
    beatPosition,
    durationBeats,
    isRest: false,
  };
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for extracting notes from an imported score for pitch matching
 */
export function usePracticeNotes({
  score,
  partIndex = 0,
}: UsePracticeNotesOptions): UsePracticeNotesReturn {
  // Build a map of measure -> notes for efficient lookup
  const notesByMeasure = useMemo(() => {
    const map = new Map<number, CurrentNoteTarget[]>();

    if (!score || score.parts.length === 0) {
      return map;
    }

    const part = score.parts[partIndex];
    if (!part?.measures) return map;

    for (const measure of part.measures) {
      const targets: CurrentNoteTarget[] = [];

      // Calculate beat positions from sequential events
      // Beat position starts at 1 (music notation convention)
      let currentBeat = 1;

      // Use 'events' not 'notes' - matches ImportedMeasure interface
      for (const note of measure.events ?? []) {
        const target = noteEventToTarget(note, measure.number, currentBeat);
        if (target) {
          targets.push(target);
          // Advance beat position by this note's duration
          currentBeat += target.durationBeats;
        }
      }

      // Sort by beat position (should already be in order, but ensure it)
      targets.sort((a, b) => a.beatPosition - b.beatPosition);

      map.set(measure.number, targets);
    }

    return map;
  }, [score, partIndex]);

  // Total note count
  const totalNotes = useMemo(() => {
    let count = 0;
    for (const notes of notesByMeasure.values()) {
      count += notes.filter((n) => !n.isRest).length;
    }
    return count;
  }, [notesByMeasure]);

  // Get note at a specific position
  const getNoteAtPosition = useCallback(
    (measureNumber: number, beatNumber: number): CurrentNoteTarget | null => {
      const notes = notesByMeasure.get(measureNumber);
      if (!notes || notes.length === 0) {
        return null;
      }

      // Find the note that covers this beat position
      // beatNumber is 1-indexed, but our note positions may vary
      for (const note of notes) {
        const noteStart = note.beatPosition;
        const noteEnd = noteStart + note.durationBeats;

        // Check if this beat falls within this note's duration
        if (beatNumber >= noteStart && beatNumber < noteEnd) {
          return note;
        }
      }

      // If no note found at exact position, return the closest note
      // that starts before or at this beat
      for (let i = notes.length - 1; i >= 0; i--) {
        if (notes[i].beatPosition <= beatNumber) {
          return notes[i];
        }
      }

      return notes[0] ?? null;
    },
    [notesByMeasure],
  );

  // Get all notes in a measure
  const getNotesInMeasure = useCallback(
    (measureNumber: number): CurrentNoteTarget[] => {
      return notesByMeasure.get(measureNumber) ?? [];
    },
    [notesByMeasure],
  );

  return {
    getNoteAtPosition,
    getNotesInMeasure,
    totalNotes,
  };
}
