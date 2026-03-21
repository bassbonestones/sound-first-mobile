/**
 * MusicXML Generator Service
 *
 * Converts ComposerScore data model to valid MusicXML format
 * for rendering with OSMD or export.
 */

import type {
  ComposerScore,
  Measure,
  Note,
  DurationValue,
  TimeSignature,
  Clef,
  KeySignature,
  Accidental,
} from "../types";
import { DURATION, isRest } from "../types";

// =============================================================================
// Types
// =============================================================================

export interface MusicXmlGeneratorOptions {
  /** Include XML declaration and DOCTYPE (default: true) */
  includeHeader?: boolean;
  /** Include cursor marker comment at specified position */
  cursorPosition?: { measureIndex: number; noteIndex: number };
  /** Selected note ID to mark with highlight attribute */
  selectedNoteId?: string;
}

// =============================================================================
// Constants
// =============================================================================

/** MusicXML divisions per quarter note */
const DIVISIONS = 12; // Changed to 12 to support triplets (divisible by 3)

/** Duration value to MusicXML type name */
const DURATION_TO_TYPE: Record<DurationValue, string> = {
  [DURATION.WHOLE]: "whole",
  [DURATION.HALF]: "half",
  [DURATION.QUARTER]: "quarter",
  [DURATION.EIGHTH]: "eighth",
  [DURATION.TRIPLET_QUARTER]: "quarter", // Same as quarter, but with time-modification
  [DURATION.TRIPLET_EIGHTH]: "eighth", // Same type, but with time-modification
  [DURATION.SIXTEENTH]: "16th",
};

/** Duration value to MusicXML duration (based on divisions=12) */
const DURATION_TO_DIVISIONS: Record<DurationValue, number> = {
  [DURATION.WHOLE]: 48,
  [DURATION.HALF]: 24,
  [DURATION.QUARTER]: 12,
  [DURATION.EIGHTH]: 6,
  [DURATION.TRIPLET_QUARTER]: 8, // 2/3 beat = 8 divisions
  [DURATION.TRIPLET_EIGHTH]: 4, // 12/3 = 4 divisions for triplet eighth
  [DURATION.SIXTEENTH]: 3,
};

/** Clef to MusicXML sign and line */
const CLEF_TO_XML: Record<Clef, { sign: string; line: number }> = {
  treble: { sign: "G", line: 2 },
  bass: { sign: "F", line: 4 },
};

/** MIDI note to pitch name mapping (within an octave) */
const MIDI_TO_PITCH: Record<number, { step: string; alter: number }> = {
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

/** Alternate MIDI to pitch mapping preferring flats */
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

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Convert MIDI note number to pitch step, alter, and octave.
 */
function midiToPitch(
  midi: number,
  preferFlats: boolean = false,
): { step: string; alter: number; octave: number } {
  const octave = Math.floor(midi / 12) - 1;
  const pitchClass = midi % 12;
  const mapping = preferFlats ? MIDI_TO_PITCH_FLAT : MIDI_TO_PITCH;
  const { step, alter } = mapping[pitchClass];
  return { step, alter, octave };
}

/**
 * Convert accidental type to MusicXML alter value.
 */
function accidentalToAlter(accidental: Accidental | undefined): number {
  switch (accidental) {
    case "double-sharp":
      return 2;
    case "sharp":
      return 1;
    case "natural":
      return 0;
    case "flat":
      return -1;
    case "double-flat":
      return -2;
    default:
      return 0;
  }
}

/**
 * Convert accidental type to MusicXML accidental element value.
 */
function accidentalToXml(accidental: Accidental | undefined): string | null {
  switch (accidental) {
    case "double-sharp":
      return "double-sharp";
    case "sharp":
      return "sharp";
    case "natural":
      return "natural";
    case "flat":
      return "flat";
    case "double-flat":
      return "flat-flat";
    default:
      return null;
  }
}

/**
 * Escape XML special characters.
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// =============================================================================
// Note XML Generation
// =============================================================================

/**
 * Generate MusicXML for a single note.
 */
function generateNoteXml(
  note: Note,
  preferFlats: boolean,
  options: MusicXmlGeneratorOptions,
  isLastInTripletGroup: boolean = false,
  beamType: "begin" | "continue" | "end" | null = null,
): string {
  // Calculate duration accounting for dots (dotted = 1.5x)
  const baseDuration = DURATION_TO_DIVISIONS[note.duration];
  const duration = note.dotted ? baseDuration * 1.5 : baseDuration;
  const type = DURATION_TO_TYPE[note.duration];
  const isSelected = options.selectedNoteId === note.id;
  const isTriplet = note.tripletPosition !== undefined;

  // Add color attribute if selected
  const noteAttrs = isSelected ? ' color="#0066CC"' : "";

  // Dot element for dotted notes
  const dotXml = note.dotted ? "\n        <dot/>" : "";

  // Time modification for triplets (3 in the time of 2)
  const timeModXml = isTriplet
    ? `\n        <time-modification>
          <actual-notes>3</actual-notes>
          <normal-notes>2</normal-notes>
        </time-modification>`
    : "";

  // Tuplet notation for triplets (start on position 1, stop on last note in group)
  let notationsContent = "";
  if (isTriplet) {
    if (note.tripletPosition === 1) {
      notationsContent += '<tuplet type="start" bracket="yes" number="1"/>';
    }
    if (isLastInTripletGroup) {
      notationsContent += '<tuplet type="stop" number="1"/>';
    }
  }

  if (isRest(note)) {
    // Build notations for triplet rests
    const restNotationsXml = notationsContent
      ? `\n        <notations>${notationsContent}</notations>`
      : "";

    return `      <note${noteAttrs}>
        <rest/>
        <duration>${duration}</duration>
        <type>${type}</type>${dotXml}${timeModXml}${restNotationsXml}
      </note>`;
  }

  // Determine step (letter name) and alter
  // If there's an explicit accidental, we need to derive the base MIDI (without accidental)
  // to get the correct letter name
  let step: string;
  let octave: number;
  let alter: number;

  if (note.accidental !== undefined) {
    // Calculate the base MIDI by reversing the accidental's effect
    const accidentalOffset = accidentalToAlter(note.accidental);
    const baseMidi = note.midi! - accidentalOffset;

    // Get the step from the base MIDI (which should be a natural note)
    const basePitch = midiToPitch(baseMidi, preferFlats);
    step = basePitch.step;
    octave = basePitch.octave;
    alter = accidentalOffset;
  } else {
    // No explicit accidental - derive from MIDI normally
    const pitch = midiToPitch(note.midi!, preferFlats);
    step = pitch.step;
    octave = pitch.octave;
    alter = pitch.alter;
  }

  // Build pitch element
  let pitchXml = `        <pitch>
          <step>${step}</step>${alter !== 0 ? `\n          <alter>${alter}</alter>` : ""}
          <octave>${octave}</octave>
        </pitch>`;

  // Build accidental element if explicit
  const accidentalXml = accidentalToXml(note.accidental);

  // Build tie elements
  let tieXml = "";

  if (note.tieStart) {
    tieXml += '\n        <tie type="start"/>';
  }
  if (note.tieEnd) {
    tieXml += '\n        <tie type="stop"/>';
  }

  // Add tied notations to notationsContent
  if (note.tieStart) {
    notationsContent += '<tied type="start"/>';
  }
  if (note.tieEnd) {
    notationsContent += '<tied type="stop"/>';
  }

  // Build beam element if specified (for triplet eighths)
  const beamXml = beamType
    ? `\n        <beam number="1">${beamType}</beam>`
    : "";

  const notationsXml = notationsContent
    ? `\n        <notations>${notationsContent}</notations>`
    : "";

  return `      <note${noteAttrs}>${tieXml}
${pitchXml}
        <duration>${duration}</duration>
        <type>${type}</type>${dotXml}${beamXml}${timeModXml}${accidentalXml ? `\n        <accidental>${accidentalXml}</accidental>` : ""}${notationsXml}
      </note>`;
}

// =============================================================================
// Measure XML Generation
// =============================================================================

/**
 * Generate MusicXML for attributes (clef, key, time, divisions).
 */
function generateAttributesXml(
  timeSig: TimeSignature,
  keySignature: KeySignature,
  clef: Clef,
): string {
  const { sign, line } = CLEF_TO_XML[clef];

  return `      <attributes>
        <divisions>${DIVISIONS}</divisions>
        <key>
          <fifths>${keySignature}</fifths>
        </key>
        <time>
          <beats>${timeSig.beats}</beats>
          <beat-type>${timeSig.beatUnit}</beat-type>
        </time>
        <clef>
          <sign>${sign}</sign>
          <line>${line}</line>
        </clef>
      </attributes>`;
}

/**
 * Generate MusicXML for a measure.
 */
function generateMeasureXml(
  measure: Measure,
  measureNumber: number,
  isFirstMeasure: boolean,
  isLastMeasure: boolean,
  score: ComposerScore,
  options: MusicXmlGeneratorOptions,
  scoreHasNotes: boolean,
): string {
  const preferFlats = score.keySignature < 0;
  let notesXml = "";

  // Add cursor marker comment if this is the cursor measure
  if (
    options.cursorPosition &&
    options.cursorPosition.measureIndex === measureNumber - 1
  ) {
    notesXml += `\n      <!-- cursor:${options.cursorPosition.noteIndex} -->`;
  }

  // Pre-compute which notes are the last in their triplet group
  const lastInTripletGroup = new Set<string>();
  for (let i = 0; i < measure.notes.length; i++) {
    const note = measure.notes[i];
    if (note.tripletGroupId) {
      const nextNote = measure.notes[i + 1];
      // This note is last in its group if:
      // - There's no next note, OR
      // - The next note has a different (or no) triplet group ID
      if (!nextNote || nextNote.tripletGroupId !== note.tripletGroupId) {
        lastInTripletGroup.add(note.id);
      }
    }
  }

  // Pre-compute beam info for triplet eighths
  // Beaming groups consecutive triplet eighths in the same group
  const beamInfo = new Map<string, "begin" | "continue" | "end">();
  const tolerance = 0.001;
  for (let i = 0; i < measure.notes.length; i++) {
    const note = measure.notes[i];
    // Only beam triplet eighths that are pitched (not rests)
    if (
      !note.tripletGroupId ||
      note.midi === null ||
      Math.abs(note.duration - DURATION.TRIPLET_EIGHTH) > tolerance
    ) {
      continue;
    }

    const groupId = note.tripletGroupId;
    const prevNote = measure.notes[i - 1];
    const nextNote = measure.notes[i + 1];

    // Check if previous note is a beamable eighth in same group
    const prevIsBeamable =
      prevNote &&
      prevNote.tripletGroupId === groupId &&
      prevNote.midi !== null &&
      Math.abs(prevNote.duration - DURATION.TRIPLET_EIGHTH) < tolerance;

    // Check if next note is a beamable eighth in same group
    const nextIsBeamable =
      nextNote &&
      nextNote.tripletGroupId === groupId &&
      nextNote.midi !== null &&
      Math.abs(nextNote.duration - DURATION.TRIPLET_EIGHTH) < tolerance;

    if (!prevIsBeamable && nextIsBeamable) {
      // First in a beam group
      beamInfo.set(note.id, "begin");
    } else if (prevIsBeamable && nextIsBeamable) {
      // Middle of a beam group
      beamInfo.set(note.id, "continue");
    } else if (prevIsBeamable && !nextIsBeamable) {
      // Last in a beam group
      beamInfo.set(note.id, "end");
    }
    // If neither adjacent is beamable, don't beam (single eighth)
  }

  // Generate notes
  for (const note of measure.notes) {
    const isLastInTriplet = lastInTripletGroup.has(note.id);
    const beam = beamInfo.get(note.id) || null;
    notesXml +=
      "\n" + generateNoteXml(note, preferFlats, options, isLastInTriplet, beam);
  }

  // Include attributes only in first measure
  const attributesXml = isFirstMeasure
    ? "\n" +
      generateAttributesXml(score.timeSignature, score.keySignature, score.clef)
    : "";

  // Include tempo direction only in first measure when score has notes
  // (OSMD can't calculate tempo expressions without note timing context)
  const directionXml =
    isFirstMeasure && scoreHasNotes
      ? `\n      <direction placement="above">
        <direction-type>
          <metronome parentheses="no">
            <beat-unit>quarter</beat-unit>
            <per-minute>${score.tempo}</per-minute>
          </metronome>
        </direction-type>
        <sound tempo="${score.tempo}"/>
      </direction>`
      : "";

  // Add final barline (double bar) for last measure
  const barlineXml = isLastMeasure
    ? `\n      <barline location="right">
        <bar-style>light-heavy</bar-style>
      </barline>`
    : "";

  return `    <measure number="${measureNumber}">${attributesXml}${directionXml}${notesXml}${barlineXml}
    </measure>`;
}

// =============================================================================
// Full Score XML Generation
// =============================================================================

/**
 * Generate complete MusicXML document from ComposerScore.
 */
export function generateMusicXml(
  score: ComposerScore,
  options: MusicXmlGeneratorOptions = {},
): string {
  const { includeHeader = true } = options;

  // Check if score has any notes (needed for tempo direction)
  const scoreHasNotes = score.measures.some(
    (measure) => measure.notes.length > 0,
  );

  // Generate measures
  const measuresXml = score.measures
    .map((measure, index) =>
      generateMeasureXml(
        measure,
        index + 1,
        index === 0,
        index === score.measures.length - 1,
        score,
        options,
        scoreHasNotes,
      ),
    )
    .join("\n");

  // Generate part list
  const partListXml = `  <part-list>
    <score-part id="P1">
      <part-name>Part 1</part-name>
    </score-part>
  </part-list>`;

  // Generate identification
  const identificationXml = `  <identification>
    <encoding>
      <software>Sound First Practice Composer</software>
      <encoding-date>${new Date().toISOString().split("T")[0]}</encoding-date>
    </encoding>
  </identification>`;

  // Generate work element
  const workXml = `  <work>
    <work-title>${escapeXml(score.title)}</work-title>
  </work>`;

  // Build full document
  const header = includeHeader
    ? `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN"
    "http://www.musicxml.org/dtds/partwise.dtd">
`
    : "";

  return `${header}<score-partwise version="3.1">
${workXml}
${identificationXml}
${partListXml}
  <part id="P1">
${measuresXml}
  </part>
</score-partwise>`;
}

/**
 * Generate minimal MusicXML for preview (no header).
 */
export function generateMusicXmlPreview(
  score: ComposerScore,
  options: MusicXmlGeneratorOptions = {},
): string {
  return generateMusicXml(score, { ...options, includeHeader: true });
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate that a ComposerScore can be converted to MusicXML.
 */
export function validateScoreForExport(score: ComposerScore): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!score.measures || score.measures.length === 0) {
    errors.push("Score must have at least one measure");
  }

  if (score.tempo < 20 || score.tempo > 400) {
    errors.push("Tempo must be between 20 and 400 BPM");
  }

  for (let i = 0; i < score.measures.length; i++) {
    const measure = score.measures[i];
    for (let j = 0; j < measure.notes.length; j++) {
      const note = measure.notes[j];
      if (note.midi !== null && (note.midi < 0 || note.midi > 127)) {
        errors.push(
          `Invalid MIDI value ${note.midi} in measure ${i + 1}, note ${j + 1}`,
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
