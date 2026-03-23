/**
 * Generation Notation Utilities
 *
 * Converts PitchEvent arrays from the generation API to MusicXML
 * for rendering with NotationDisplay or OSMD.
 */

import type { PitchEvent, MusicalKey } from "../api/generation";

// =============================================================================
// Constants
// =============================================================================

/** MusicXML divisions per quarter note (supports triplets) */
const DIVISIONS = 12;

/**
 * Parse a pitch name string (e.g., "Eb4", "F#5", "C4") into components.
 * Returns step, alter (semitones), and octave.
 */
function parsePitchName(pitchName: string): {
  step: string;
  alter: number;
  octave: number;
} {
  // Match: letter, optional accidentals (# or b, possibly doubled), octave number(s)
  const match = pitchName.match(/^([A-Ga-g])(##|bb|#|b)?(-?\d+)$/);
  if (!match) {
    // Fallback if parsing fails
    return { step: "C", alter: 0, octave: 4 };
  }

  const step = match[1].toUpperCase();
  const accidental = match[2] || "";
  const octave = parseInt(match[3], 10);

  let alter = 0;
  if (accidental === "#") alter = 1;
  else if (accidental === "b") alter = -1;
  else if (accidental === "##") alter = 2;
  else if (accidental === "bb") alter = -2;

  return { step, alter, octave };
}

/** MIDI to pitch mapping (sharps) */
const MIDI_TO_PITCH_SHARP: Record<number, { step: string; alter: number }> = {
  0: { step: "C", alter: 0 },
  1: { step: "C", alter: 1 },
  2: { step: "D", alter: 0 },
  3: { step: "D", alter: 1 },
  4: { step: "E", alter: 0 },
  5: { step: "F", alter: 0 },
  6: { step: "F", alter: 1 },
  7: { step: "G", alter: 0 },
  8: { step: "G", alter: 1 },
  9: { step: "A", alter: 0 },
  10: { step: "A", alter: 1 },
  11: { step: "B", alter: 0 },
};

/** MIDI to pitch mapping (flats) */
const MIDI_TO_PITCH_FLAT: Record<number, { step: string; alter: number }> = {
  0: { step: "C", alter: 0 },
  1: { step: "D", alter: -1 },
  2: { step: "D", alter: 0 },
  3: { step: "E", alter: -1 },
  4: { step: "E", alter: 0 },
  5: { step: "F", alter: 0 },
  6: { step: "G", alter: -1 },
  7: { step: "G", alter: 0 },
  8: { step: "A", alter: -1 },
  9: { step: "A", alter: 0 },
  10: { step: "B", alter: -1 },
  11: { step: "B", alter: 0 },
};

/** Key signature to fifths value */
const KEY_TO_FIFTHS: Record<MusicalKey, number> = {
  C: 0,
  G: 1,
  D: 2,
  A: 3,
  E: 4,
  B: 5,
  "F#": 6,
  Gb: -6,
  Db: -5,
  Ab: -4,
  Eb: -3,
  Bb: -2,
  F: -1,
  "C#": 7,
};

/** Keys that use flats */
const FLAT_KEYS: Set<MusicalKey> = new Set(["F", "Bb", "Eb", "Ab", "Db", "Gb"]);

/**
 * Order of sharps in key signatures: F C G D A E B
 * For a key with N sharps, the first N notes in this list are sharped.
 */
const SHARP_ORDER = ["F", "C", "G", "D", "A", "E", "B"];

/**
 * Order of flats in key signatures: B E A D G C F
 * For a key with N flats, the first N notes in this list are flatted.
 */
const FLAT_ORDER = ["B", "E", "A", "D", "G", "C", "F"];

/**
 * Get the default alter for a step given a key signature (fifths).
 * Returns the alter value that would NOT need an accidental display.
 */
function getKeySignatureAlter(step: string, fifths: number): number {
  if (fifths > 0) {
    // Sharp key - first N notes in SHARP_ORDER are sharped
    const sharpedSteps = SHARP_ORDER.slice(0, fifths);
    return sharpedSteps.includes(step) ? 1 : 0;
  } else if (fifths < 0) {
    // Flat key - first N notes in FLAT_ORDER are flatted
    const flattedSteps = FLAT_ORDER.slice(0, -fifths);
    return flattedSteps.includes(step) ? -1 : 0;
  }
  return 0; // C major - no default accidentals
}

/**
 * Convert alter value to MusicXML accidental name.
 */
function alterToAccidentalName(alter: number): string | null {
  switch (alter) {
    case 2:
      return "double-sharp";
    case 1:
      return "sharp";
    case 0:
      return "natural";
    case -1:
      return "flat";
    case -2:
      return "flat-flat";
    default:
      return null;
  }
}

/**
 * Track accidentals used in a measure for proper courtesy accidental display.
 * Key is step (like "C"), value is the most recent alter used for that step.
 */
type MeasureAccidentalState = Map<string, number>;

/**
 * Mode key signature offsets (in fifths) relative to parallel major.
 * For modal scales, we need to display the key signature of the relative major,
 * not the parallel major.
 *
 * Example: D Dorian should show C major key signature (0 sharps),
 * not D major key signature (2 sharps).
 */
const MODE_FIFTHS_OFFSET: Record<string, number> = {
  // Church modes (diatonic)
  ionian: 0, // Major scale - no offset
  dorian: -2, // 2nd mode - down 2 fifths from parallel major
  phrygian: -4, // 3rd mode - down 4 fifths
  lydian: 1, // 4th mode - up 1 fifth
  mixolydian: -1, // 5th mode - down 1 fifth
  aeolian: -3, // Natural minor (6th mode) - down 3 fifths
  locrian: -5, // 7th mode - down 5 fifths

  // Pentatonic & Blues (based on parent scale)
  pentatonic_major: 0, // Subset of major
  pentatonic_minor: -3, // Subset of natural minor
  blues: -3, // Based on minor pentatonic
  blues_major: 0, // Based on major pentatonic

  // Harmonic minor modes (use minor key signature)
  harmonic_minor: -3,
  phrygian_dominant: -4, // Mode 5 of harmonic minor
  lydian_sharp2: 1, // Mode 6 of harmonic minor

  // Melodic minor modes (use minor key signature for consistency)
  melodic_minor: -3,
  melodic_minor_classical: -3,
  lydian_augmented: 1, // Mode 3 of melodic minor
  lydian_dominant: 1, // Mode 4 of melodic minor
  mixolydian_flat6: -1, // Mode 5 of melodic minor
  altered: -5, // Mode 7 of melodic minor (like locrian)

  // Major with alterations
  harmonic_major: 0,

  // Bebop scales (use parent scale key signature)
  bebop_dominant: -1, // Based on mixolydian
  bebop_major: 0, // Based on major
  bebop_dorian: -2, // Based on dorian

  // Symmetric scales - no standard key signature, use parallel major
  // whole_tone, diminished_hw, diminished_wh, chromatic - not listed, uses default
};

/** Duration beats to MusicXML type */
function durationToType(beats: number): string {
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

/** Duration beats to MusicXML divisions */
function durationToDivisions(beats: number): number {
  return Math.round(beats * DIVISIONS);
}

/** Check if duration is dotted */
function isDotted(beats: number): boolean {
  // Dotted durations: 1.5, 0.75, 3, 6
  const dottedValues = [0.75, 1.5, 3, 6];
  return dottedValues.some((v) => Math.abs(beats - v) < 0.01);
}

// =============================================================================
// Triplet Detection
// =============================================================================

/** Eighth triplet duration (1/3 beat) */
const EIGHTH_TRIPLET_DURATION = 1.0 / 3.0;

/** Quarter triplet duration (2/3 beat) */
const QUARTER_TRIPLET_DURATION = 2.0 / 3.0;

/** Check if duration is an eighth triplet */
function isEighthTriplet(beats: number): boolean {
  return Math.abs(beats - EIGHTH_TRIPLET_DURATION) < 0.01;
}

/** Check if duration is a quarter triplet */
function isQuarterTriplet(beats: number): boolean {
  return Math.abs(beats - QUARTER_TRIPLET_DURATION) < 0.01;
}

/** Check if duration is any kind of triplet */
function isTripletDuration(beats: number): boolean {
  return isEighthTriplet(beats) || isQuarterTriplet(beats);
}

/** Get triplet info for a duration */
interface TripletInfo {
  isTriplet: boolean;
  noteType: string;
  actualNotes: number;
  normalNotes: number;
}

function getTripletInfo(beats: number): TripletInfo {
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
type BeamStatus = "begin" | "continue" | "end" | null;

/** Beam information for a note (supports up to 2 beam levels) */
interface NoteBeamInfo {
  beam1: BeamStatus;
  beam2: BeamStatus;
  // Triplet bracket info
  tripletStart?: boolean;
  tripletStop?: boolean;
  tripletInfo?: TripletInfo;
}

/** Check if a duration should be beamed (8th note or faster in notation) */
function isBeamableDuration(beats: number): boolean {
  const noteType = durationToType(beats);
  return noteType === "eighth" || noteType === "16th" || noteType === "32nd";
}

/** Check if a duration is a swing duration (2/3 or 1/3 beat) */
function isSwingDuration(beats: number): boolean {
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
 */
function computeBeamGroups(events: PitchEvent[]): NoteBeamInfo[] {
  const result: NoteBeamInfo[] = [];

  // Check if this is swing rhythm FIRST (before triplet check)
  // Swing uses 2/3 and 1/3 durations in alternating long-short pattern
  // Must have alternating pattern to distinguish from triplets (all 1/3)
  const swingLong = 2.0 / 3.0;
  const swingShort = 1.0 / 3.0;
  const swingCheckNotes = events.length > 1 ? events.slice(0, -1) : events;
  const isSwingRhythm =
    events.length >= 2 &&
    swingCheckNotes.every((e, i) => {
      // Even indices should be long (2/3), odd indices should be short (1/3)
      const expectedDuration = i % 2 === 0 ? swingLong : swingShort;
      return Math.abs(e.duration_beats - expectedDuration) < 0.01;
    });

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

// =============================================================================
// MusicXML Generation
// =============================================================================

/** Clef type for notation display */
export type ClefType = "treble" | "bass";

export interface EventsToMusicXmlOptions {
  /** Title for the score */
  title?: string;
  /** Key signature */
  key?: MusicalKey;
  /** Scale/mode type for correct key signature (e.g., "dorian", "phrygian") */
  mode?: string;
  /** Time signature beats per measure */
  timeBeats?: number;
  /** Time signature beat type */
  timeBeatType?: number;
  /** Tempo in BPM */
  tempo?: number;
  /** Clef type (default: treble) */
  clef?: ClefType;
  /** Rhythm type (for adding swing instructions) */
  rhythm?: string;
  /** Index of note to highlight (for playback cursor) */
  highlightedNoteIndex?: number;
}

/**
 * Convert PitchEvent array to MusicXML string.
 *
 * @param events - Array of PitchEvents from generation API
 * @param options - Optional formatting options
 * @returns Valid MusicXML string for OSMD rendering
 *
 * @example
 * const musicxml = eventsToMusicXml(response.events, {
 *   title: "G Dorian Scale",
 *   key: "G",
 *   tempo: 120,
 * });
 */
export function eventsToMusicXml(
  events: PitchEvent[],
  options: EventsToMusicXmlOptions = {},
): string {
  const {
    title = "Generated Content",
    key = "C",
    mode,
    timeBeats = 4,
    timeBeatType = 4,
    tempo,
    clef = "treble",
    rhythm,
    highlightedNoteIndex,
  } = options;

  const isSwingRhythm = rhythm === "swing_eighths";

  // Calculate fifths, adjusting for mode if provided
  // For modal scales like D Dorian, we want C major's key signature (0), not D major's (2)
  let fifths = KEY_TO_FIFTHS[key] ?? 0;
  if (mode && MODE_FIFTHS_OFFSET[mode] !== undefined) {
    fifths += MODE_FIFTHS_OFFSET[mode];
    // Clamp to valid key signature range (-7 to 7)
    // Don't wrap around (e.g., -8 should stay at -7, not become +4)
    fifths = Math.max(-7, Math.min(7, fifths));
  }

  const useFlats = fifths < 0 || FLAT_KEYS.has(key);
  const pitchMap = useFlats ? MIDI_TO_PITCH_FLAT : MIDI_TO_PITCH_SHARP;

  // Build measures from events, tracking global note indices
  const beatsPerMeasure = timeBeats;
  const measures: { event: PitchEvent; globalIndex: number }[][] = [];
  let currentMeasure: { event: PitchEvent; globalIndex: number }[] = [];
  let currentBeat = 0;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    // Check if this note crosses measure boundary
    if (currentBeat + event.duration_beats > beatsPerMeasure) {
      // Fill remainder with what fits
      if (currentMeasure.length > 0) {
        measures.push(currentMeasure);
      }
      currentMeasure = [];
      currentBeat = 0;
    }

    currentMeasure.push({ event, globalIndex: i });
    currentBeat += event.duration_beats;

    // Complete measure
    if (currentBeat >= beatsPerMeasure) {
      measures.push(currentMeasure);
      currentMeasure = [];
      currentBeat = 0;
    }
  }

  // Add final partial measure
  if (currentMeasure.length > 0) {
    measures.push(currentMeasure);
  }

  // Generate XML parts
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">`;

  const workTitle = title
    ? `  <work>\n    <work-title>${escapeXml(title)}</work-title>\n  </work>`
    : "";

  const partList = `  <part-list>
    <score-part id="P1">
      <part-name>Music</part-name>
    </score-part>
  </part-list>`;

  // Generate measures
  const measureXmls = measures.map((measureNotes, measureIndex) => {
    const isFirst = measureIndex === 0;
    const isLast = measureIndex === measures.length - 1;
    return generateMeasureXml(
      measureNotes,
      measureIndex + 1,
      isFirst,
      isLast,
      fifths,
      timeBeats,
      timeBeatType,
      tempo,
      pitchMap,
      clef,
      isSwingRhythm,
      highlightedNoteIndex,
    );
  });

  return `${header}
<score-partwise version="3.1">
${workTitle}
${partList}
  <part id="P1">
${measureXmls.join("\n")}
  </part>
</score-partwise>`;
}

function generateMeasureXml(
  measureNotes: { event: PitchEvent; globalIndex: number }[],
  measureNumber: number,
  isFirst: boolean,
  isLast: boolean,
  fifths: number,
  timeBeats: number,
  timeBeatType: number,
  tempo: number | undefined,
  pitchMap: Record<number, { step: string; alter: number }>,
  clef: ClefType,
  isSwingRhythm: boolean,
  highlightedNoteIndex?: number,
): string {
  const lines: string[] = [];
  lines.push(`    <measure number="${measureNumber}">`);

  // Clef configuration: treble = G/2, bass = F/4
  const clefSign = clef === "bass" ? "F" : "G";
  const clefLine = clef === "bass" ? 4 : 2;

  // First measure: add attributes
  if (isFirst) {
    lines.push("      <attributes>");
    lines.push(`        <divisions>${DIVISIONS}</divisions>`);
    lines.push("        <key>");
    lines.push(`          <fifths>${fifths}</fifths>`);
    lines.push("        </key>");
    lines.push("        <time>");
    lines.push(`          <beats>${timeBeats}</beats>`);
    lines.push(`          <beat-type>${timeBeatType}</beat-type>`);
    lines.push("        </time>");
    lines.push("        <clef>");
    lines.push(`          <sign>${clefSign}</sign>`);
    lines.push(`          <line>${clefLine}</line>`);
    lines.push("        </clef>");
    lines.push("      </attributes>");

    // Add swing direction text if applicable
    if (isSwingRhythm) {
      lines.push('      <direction placement="above">');
      lines.push("        <direction-type>");
      lines.push('          <words font-style="italic">Swing</words>');
      lines.push("        </direction-type>");
      lines.push("      </direction>");
    }

    // Add tempo marking
    if (tempo) {
      lines.push('      <direction placement="above">');
      lines.push("        <direction-type>");
      lines.push("          <metronome>");
      lines.push("            <beat-unit>quarter</beat-unit>");
      lines.push(`            <per-minute>${tempo}</per-minute>`);
      lines.push("          </metronome>");
      lines.push("        </direction-type>");
      lines.push('        <sound tempo="' + tempo + '"/>');
      lines.push("      </direction>");
    }
  }

  // Extract events for beam computation
  const events = measureNotes.map((n) => n.event);

  // Compute beam groups for auto-beaming
  const beamInfo = computeBeamGroups(events);

  // Track accidentals used in this measure for courtesy accidentals
  const measureAccidentals: MeasureAccidentalState = new Map();

  // Add notes with beam information and accidental tracking
  for (let i = 0; i < measureNotes.length; i++) {
    const isHighlighted = measureNotes[i].globalIndex === highlightedNoteIndex;
    lines.push(
      generateNoteXml(
        measureNotes[i].event,
        pitchMap,
        beamInfo[i],
        isHighlighted,
        fifths,
        measureAccidentals,
      ),
    );
  }

  // Add final double barline on last measure
  if (isLast) {
    lines.push('      <barline location="right">');
    lines.push("        <bar-style>light-heavy</bar-style>");
    lines.push("      </barline>");
  }

  lines.push("    </measure>");
  return lines.join("\n");
}

function generateNoteXml(
  event: PitchEvent,
  pitchMap: Record<number, { step: string; alter: number }>,
  beamInfo?: NoteBeamInfo,
  isHighlighted?: boolean,
  fifths?: number,
  measureAccidentals?: MeasureAccidentalState,
): string {
  const duration = durationToDivisions(event.duration_beats);
  const type = durationToType(event.duration_beats);
  const dotted = isDotted(event.duration_beats);

  const lines: string[] = [];
  // Add color attribute for highlighted notes
  if (isHighlighted) {
    lines.push('      <note color="#0066CC">');
  } else {
    lines.push("      <note>");
  }

  // Handle rest (midi_note === 0)
  if (event.midi_note === 0) {
    lines.push("        <rest/>");
    lines.push(`        <duration>${duration}</duration>`);
    lines.push(`        <type>${type}</type>`);
    if (dotted) {
      lines.push("        <dot/>");
    }
    lines.push("      </note>");
    return lines.join("\n");
  }

  // Use pitch_name from backend if available (has correct enharmonic spelling)
  // Otherwise fall back to MIDI-based conversion
  let step: string;
  let alter: number;
  let octave: number;

  if (event.pitch_name) {
    const parsed = parsePitchName(event.pitch_name);
    step = parsed.step;
    alter = parsed.alter;
    octave = parsed.octave;
  } else {
    const midi = event.midi_note;
    octave = Math.floor(midi / 12) - 1;
    const pitchClass = midi % 12;
    const pitchInfo = pitchMap[pitchClass] ?? { step: "C", alter: 0 };
    step = pitchInfo.step;
    alter = pitchInfo.alter;
  }

  lines.push("        <pitch>");
  lines.push(`          <step>${step}</step>`);
  if (alter !== 0) {
    lines.push(`          <alter>${alter}</alter>`);
  }
  lines.push(`          <octave>${octave}</octave>`);
  lines.push("        </pitch>");
  lines.push(`        <duration>${duration}</duration>`);
  lines.push(`        <type>${type}</type>`);
  if (dotted) {
    lines.push("        <dot/>");
  }

  // Determine if we need to show an accidental
  // Key is step+octave to handle different octaves independently
  const stepOctaveKey = `${step}${octave}`;
  const keySignatureAlter =
    fifths !== undefined ? getKeySignatureAlter(step, fifths) : 0;
  const previousAlterInMeasure = measureAccidentals?.get(stepOctaveKey);

  let showAccidental = false;

  if (previousAlterInMeasure !== undefined) {
    // Same step was used earlier in this measure
    // Show accidental if it differs from what was used before (courtesy accidental)
    showAccidental = alter !== previousAlterInMeasure;
  } else {
    // First occurrence of this step in the measure
    // Show accidental if it differs from key signature
    showAccidental = alter !== keySignatureAlter;
  }

  // Update measure state with this note's accidental
  if (measureAccidentals) {
    measureAccidentals.set(stepOctaveKey, alter);
  }

  // Add accidental element if needed
  if (showAccidental) {
    const accidentalName = alterToAccidentalName(alter);
    if (accidentalName) {
      lines.push(`        <accidental>${accidentalName}</accidental>`);
    }
  }

  // Add time-modification for triplets
  if (beamInfo?.tripletInfo?.isTriplet) {
    lines.push("        <time-modification>");
    lines.push(
      `          <actual-notes>${beamInfo.tripletInfo.actualNotes}</actual-notes>`,
    );
    lines.push(
      `          <normal-notes>${beamInfo.tripletInfo.normalNotes}</normal-notes>`,
    );
    lines.push("        </time-modification>");
  }

  // Add beam elements for auto-beaming
  if (beamInfo?.beam1) {
    lines.push(`        <beam number="1">${beamInfo.beam1}</beam>`);
  }
  if (beamInfo?.beam2) {
    lines.push(`        <beam number="2">${beamInfo.beam2}</beam>`);
  }

  // Add notations (tuplet bracket and/or articulations)
  const hasTupletNotation = beamInfo?.tripletStart || beamInfo?.tripletStop;
  const hasArticulation = event.articulation && event.articulation !== "legato";

  if (hasTupletNotation || hasArticulation) {
    lines.push("        <notations>");

    // Tuplet bracket
    if (beamInfo?.tripletStart) {
      lines.push(
        '          <tuplet type="start" bracket="yes" show-number="actual"/>',
      );
    } else if (beamInfo?.tripletStop) {
      lines.push('          <tuplet type="stop"/>');
    }

    // Articulations
    if (hasArticulation) {
      lines.push("          <articulations>");
      if (event.articulation === "staccato") {
        lines.push("            <staccato/>");
      } else if (event.articulation === "accent") {
        lines.push("            <accent/>");
      } else if (event.articulation === "tenuto") {
        lines.push("            <tenuto/>");
      } else if (event.articulation === "marcato") {
        lines.push("            <strong-accent/>");
      }
      lines.push("          </articulations>");
    }

    lines.push("        </notations>");
  }

  lines.push("      </note>");
  return lines.join("\n");
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Chromatic-specific pattern display names
// Maps pattern values to their chromatic interval names
const CHROMATIC_PATTERN_NAMES: Record<string, string> = {
  in_3rds: "Chromatic Major 2nds",
  in_4ths: "Chromatic minor 3rds",
  in_5ths: "Chromatic Major 3rds",
  in_6ths: "Chromatic Perfect 4ths",
  in_7ths: "Chromatic Tritones",
  in_octaves: "Chromatic Perfect 5ths",
  in_9ths: "Chromatic minor 6ths",
  in_10ths: "Chromatic Major 6ths",
  in_11ths: "Chromatic minor 7ths",
  in_12ths: "Chromatic Major 7ths",
  in_13ths: "Chromatic Octaves",
};

/**
 * Generate a display-friendly title from generation parameters.
 */
export function generateDisplayTitle(
  contentType: string,
  definition: string,
  key: MusicalKey,
  pattern?: string | null,
): string {
  // Capitalize definition
  let defDisplay = definition
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Scale display labels
  const scaleLabels: Record<string, string> = {
    ionian: "Ionian (Major)",
    aeolian: "Aeolian (Natural Minor)",
    melodic_minor: "Minor-Major",
    melodic_minor_classical: "Melodic Minor (Classical)",
    harmonic_major: "Harmonic Major (b6)",
    mixolydian_flat6: "Major-Minor (b6 b7)",
    blues_major: "Blues Major",
    phrygian_dominant: "Phrygian Dominant",
    lydian_dominant: "Lydian Dominant",
    lydian_augmented: "Lydian Augmented",
    altered: "Altered",
    diminished_hw: "Diminished (Half-Whole)",
    diminished_wh: "Diminished (Whole-Half)",
    bebop_dominant: "Bebop Dominant",
    bebop_major: "Bebop Major",
    bebop_dorian: "Bebop Dorian",
    lydian_sharp2: "Lydian #2",
  };

  if (scaleLabels[definition]) {
    defDisplay = scaleLabels[definition];
  }

  const typeDisplay = contentType === "scale" ? "Scale" : "Arpeggio";

  let title = `${key} ${defDisplay} ${typeDisplay}`;

  if (pattern) {
    // Use chromatic-specific names when applicable
    let patternDisplay: string;
    if (definition === "chromatic" && CHROMATIC_PATTERN_NAMES[pattern]) {
      patternDisplay = CHROMATIC_PATTERN_NAMES[pattern];
    } else {
      patternDisplay = pattern
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
    title += ` - ${patternDisplay}`;
  }

  return title;
}

/**
 * Calculate which measure a note falls into, given an array of events.
 * Returns 0-based measure index for use with ScoreViewport's playbackMeasureIndex.
 */
export function getMeasureIndexForNote(
  events: PitchEvent[],
  noteIndex: number,
  beatsPerMeasure: number = 4,
): number {
  let currentBeat = 0;
  let measureIndex = 0;

  for (let i = 0; i < events.length && i <= noteIndex; i++) {
    const event = events[i];

    // Check if this note would cross measure boundary
    if (currentBeat + event.duration_beats > beatsPerMeasure) {
      measureIndex++;
      currentBeat = 0;
    }

    if (i === noteIndex) {
      return measureIndex;
    }

    currentBeat += event.duration_beats;

    // Complete measure
    if (currentBeat >= beatsPerMeasure) {
      measureIndex++;
      currentBeat = 0;
    }
  }

  return measureIndex;
}
