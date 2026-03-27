/**
 * Rhythm Notation Utilities
 *
 * Handles triplet detection, beam computation, and duration type conversion
 * for MusicXML notation generation.
 *
 * Extracted from generationNotation.ts for better modularity.
 */

import type { PitchEvent } from "../api/generation";

// =============================================================================
// Duration Type Conversion
// =============================================================================

/**
 * Convert duration in beats to MusicXML note type.
 * Handles standard durations, swing rhythms, and triplets.
 */
export function durationToType(beats: number): string {
  // Handle swing durations (2/3 and 1/3 beat) - notate as eighths
  // Standard practice: swing is notated as straight eighths with "swing" marking
  const swingLong = 2.0 / 3.0;
  const swingShort = 1.0 / 3.0;
  if (
    Math.abs(beats - swingLong) < 0.01 ||
    Math.abs(beats - swingShort) < 0.01
  ) {
    return "eighth";
  }
  // Handle triplet eighths (1/3 beat)
  if (Math.abs(beats - 1.0 / 3.0) < 0.01) {
    return "eighth";
  }
  // Handle triplet quarters (2/3 beat)
  if (Math.abs(beats - 2.0 / 3.0) < 0.01) {
    return "quarter";
  }
  // Handle triplet sixteenths (1/6 beat)
  if (Math.abs(beats - 1.0 / 6.0) < 0.01) {
    return "16th";
  }

  if (beats >= 4) return "whole";
  if (beats >= 2) return "half";
  if (beats >= 1) return "quarter";
  if (beats >= 0.5) return "eighth";
  if (beats >= 0.25) return "16th";
  return "32nd";
}

// =============================================================================
// Triplet Detection
// =============================================================================

/** Eighth triplet duration (1/3 beat) */
export const EIGHTH_TRIPLET_DURATION = 1.0 / 3.0;

/** Quarter triplet duration (2/3 beat) */
export const QUARTER_TRIPLET_DURATION = 2.0 / 3.0;

/** Check if duration is an eighth triplet */
export function isEighthTriplet(beats: number): boolean {
  return Math.abs(beats - EIGHTH_TRIPLET_DURATION) < 0.01;
}

/** Check if duration is a quarter triplet */
export function isQuarterTriplet(beats: number): boolean {
  return Math.abs(beats - QUARTER_TRIPLET_DURATION) < 0.01;
}

/** Check if duration is any kind of triplet */
export function isTripletDuration(beats: number): boolean {
  return isEighthTriplet(beats) || isQuarterTriplet(beats);
}

/** Triplet information for MusicXML tuplet notation */
export interface TripletInfo {
  isTriplet: boolean;
  noteType: string;
  actualNotes: number;
  normalNotes: number;
}

/** Get triplet info for a duration */
export function getTripletInfo(beats: number): TripletInfo {
  if (isEighthTriplet(beats)) {
    return {
      isTriplet: true,
      noteType: "eighth",
      actualNotes: 3,
      normalNotes: 2,
    };
  }
  if (isQuarterTriplet(beats)) {
    return {
      isTriplet: true,
      noteType: "quarter",
      actualNotes: 3,
      normalNotes: 2,
    };
  }
  return { isTriplet: false, noteType: "", actualNotes: 0, normalNotes: 0 };
}

// =============================================================================
// Beam Computation (Auto-beaming)
// =============================================================================

/** Beam status for a single beam level */
export type BeamStatus = "begin" | "continue" | "end" | null;

/** Beam information for a note (supports up to 2 beam levels) */
export interface NoteBeamInfo {
  beam1: BeamStatus;
  beam2: BeamStatus;
  /** True if this note starts a triplet bracket */
  tripletStart?: boolean;
  /** True if this note ends a triplet bracket */
  tripletStop?: boolean;
  /** Triplet info for tuplet notation */
  tripletInfo?: TripletInfo;
}

/** Check if a duration should be beamed (8th note or faster in notation) */
export function isBeamableDuration(beats: number): boolean {
  const noteType = durationToType(beats);
  return noteType === "eighth" || noteType === "16th" || noteType === "32nd";
}

/** Check if a duration is a swing duration (2/3 or 1/3 beat) */
export function isSwingDuration(beats: number): boolean {
  const swingLong = 2.0 / 3.0;
  const swingShort = 1.0 / 3.0;
  return (
    Math.abs(beats - swingLong) < 0.01 || Math.abs(beats - swingShort) < 0.01
  );
}

/**
 * Compute beam groupings for a sequence of notes.
 * Groups notes by beat and assigns begin/continue/end for 8ths and 16ths.
 * For swing rhythms, beams each long-short pair together.
 * For triplets, groups notes by beat with proper triplet brackets.
 *
 * @param events - Notes in this measure
 * @param forceSwingBeaming - If true, use swing beaming (avoids per-measure re-detection)
 * @returns Array of beam info objects, one per event
 */
export function computeBeamGroups(
  events: PitchEvent[],
  forceSwingBeaming: boolean = false,
): NoteBeamInfo[] {
  const result: NoteBeamInfo[] = [];

  // Check if this is swing rhythm
  // - If forceSwingBeaming is true (passed from caller who knows the rhythm type), use it
  // - Otherwise, detect by checking for alternating long-short pattern
  // This avoids incorrect detection when measure boundaries split swing pairs
  let isSwingRhythm = forceSwingBeaming;

  if (!isSwingRhythm) {
    // Detect swing: alternating long-short pattern (2/3, 1/3, 2/3, 1/3...)
    const swingLong = 2.0 / 3.0;
    const swingShort = 1.0 / 3.0;
    const swingCheckNotes = events.length > 1 ? events.slice(0, -1) : events;
    isSwingRhythm =
      events.length >= 2 &&
      swingCheckNotes.every((e, i) => {
        const expectedDuration = i % 2 === 0 ? swingLong : swingShort;
        return Math.abs(e.duration_beats - expectedDuration) < 0.01;
      });
  }

  if (isSwingRhythm) {
    // For swing: beam each pair of notes (long + short) together
    // No triplet notation - swing is notated as regular eighths with "Swing" text
    for (let i = 0; i < events.length; i++) {
      const isBeamable = isSwingDuration(events[i].duration_beats);

      if (!isBeamable) {
        result.push({ beam1: null, beam2: null });
        continue;
      }

      const isFirstInPair = i % 2 === 0;
      const nextIsSwing =
        i + 1 < events.length && isSwingDuration(events[i + 1].duration_beats);
      const hasPartner = isFirstInPair ? nextIsSwing : true;

      if (hasPartner && (isFirstInPair || i > 0)) {
        result.push({
          beam1: isFirstInPair ? "begin" : "end",
          beam2: null,
        });
      } else {
        result.push({ beam1: null, beam2: null });
      }
    }
    return result;
  }

  // Check if this rhythm has actual triplet notes (not swing)
  const hasTriplets = events.some((e) => isTripletDuration(e.duration_beats));

  if (hasTriplets) {
    // For triplets: group by beat using offset_beats
    let i = 0;
    while (i < events.length) {
      const event = events[i];
      const isTriplet = isTripletDuration(event.duration_beats);

      if (isTriplet) {
        // Get the beat number for this note (round to handle floating point)
        const currentBeat = Math.round(event.offset_beats * 1000000) / 1000000;
        const currentBeatInt = Math.floor(currentBeat + 0.001); // Small epsilon for floating point

        // Collect all triplet notes in this beat
        const beatGroup: { index: number; tripletInfo: TripletInfo }[] = [];
        let j = i;
        while (
          j < events.length &&
          isTripletDuration(events[j].duration_beats)
        ) {
          const noteOffset =
            Math.round(events[j].offset_beats * 1000000) / 1000000;
          const noteBeatInt = Math.floor(noteOffset + 0.001);
          if (noteBeatInt === currentBeatInt) {
            beatGroup.push({
              index: j,
              tripletInfo: getTripletInfo(events[j].duration_beats),
            });
            j++;
          } else {
            break;
          }
        }

        // Assign beam and tuplet info for each note in beat group
        for (let idx = 0; idx < beatGroup.length; idx++) {
          const { tripletInfo } = beatGroup[idx];
          const isFirst = idx === 0;
          const isLast = idx === beatGroup.length - 1;

          // Only beam eighth triplets, not quarter triplets
          const shouldBeam = isEighthTriplet(
            events[beatGroup[idx].index].duration_beats,
          );

          result.push({
            beam1: shouldBeam
              ? isFirst
                ? "begin"
                : isLast
                  ? "end"
                  : "continue"
              : null,
            beam2: null,
            tripletStart: isFirst,
            tripletStop: isLast,
            tripletInfo: tripletInfo,
          });
        }

        i = j;
      } else {
        // Non-triplet note
        result.push({ beam1: null, beam2: null });
        i++;
      }
    }
    return result;
  }

  // Non-swing, non-triplet: group by beat
  let currentBeat = 0;
  const beatGroups: { startIndex: number; endIndex: number }[] = [];
  let currentGroupStart: number | null = null;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const isBeamable = isBeamableDuration(event.duration_beats);
    const beatNumber = Math.floor(currentBeat);

    if (isBeamable) {
      if (currentGroupStart === null) {
        currentGroupStart = i;
      }
      const nextBeat = currentBeat + event.duration_beats;
      const nextBeatNumber = Math.floor(nextBeat);

      if (
        i === events.length - 1 ||
        nextBeatNumber !== beatNumber ||
        !isBeamableDuration(events[i + 1].duration_beats)
      ) {
        if (currentGroupStart !== null && currentGroupStart < i) {
          beatGroups.push({ startIndex: currentGroupStart, endIndex: i });
        }
        currentGroupStart = null;
      }
    } else {
      if (currentGroupStart !== null && currentGroupStart < i - 1) {
        beatGroups.push({ startIndex: currentGroupStart, endIndex: i - 1 });
      }
      currentGroupStart = null;
    }

    currentBeat += event.duration_beats;
  }

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const isSixteenth = event.duration_beats <= 0.25;

    let beam1: BeamStatus = null;
    let beam2: BeamStatus = null;

    const group = beatGroups.find((g) => i >= g.startIndex && i <= g.endIndex);

    if (group) {
      if (i === group.startIndex) {
        beam1 = "begin";
        if (isSixteenth) beam2 = "begin";
      } else if (i === group.endIndex) {
        beam1 = "end";
        if (isSixteenth) beam2 = "end";
      } else {
        beam1 = "continue";
        if (isSixteenth) beam2 = "continue";
      }
    }

    result.push({ beam1, beam2 });
  }

  return result;
}
