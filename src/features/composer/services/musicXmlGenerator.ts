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
const DIVISIONS = 4;

/** Duration value to MusicXML type name */
const DURATION_TO_TYPE: Record<DurationValue, string> = {
  [DURATION.WHOLE]: "whole",
  [DURATION.HALF]: "half",
  [DURATION.QUARTER]: "quarter",
  [DURATION.EIGHTH]: "eighth",
  [DURATION.SIXTEENTH]: "16th",
};

/** Duration value to MusicXML duration (based on divisions=4) */
const DURATION_TO_DIVISIONS: Record<DurationValue, number> = {
  [DURATION.WHOLE]: 16,
  [DURATION.HALF]: 8,
  [DURATION.QUARTER]: 4,
  [DURATION.EIGHTH]: 2,
  [DURATION.SIXTEENTH]: 1,
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
): string {
  // Calculate duration accounting for dots (dotted = 1.5x)
  const baseDuration = DURATION_TO_DIVISIONS[note.duration];
  const duration = note.dotted ? baseDuration * 1.5 : baseDuration;
  const type = DURATION_TO_TYPE[note.duration];
  const isSelected = options.selectedNoteId === note.id;

  // Add color attribute if selected
  const noteAttrs = isSelected ? ' color="#0066CC"' : "";

  // Dot element for dotted notes
  const dotXml = note.dotted ? "\n        <dot/>" : "";

  if (isRest(note)) {
    return `      <note${noteAttrs}>
        <rest/>
        <duration>${duration}</duration>
        <type>${type}</type>${dotXml}
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
  let tiedXml = "";

  if (note.tieStart) {
    tieXml += '\n        <tie type="start"/>';
  }
  if (note.tieEnd) {
    tieXml += '\n        <tie type="stop"/>';
  }
  if (note.tieStart) {
    tiedXml += '\n        <notations><tied type="start"/></notations>';
  }
  if (note.tieEnd) {
    tiedXml += '\n        <notations><tied type="stop"/></notations>';
  }

  return `      <note${noteAttrs}>${tieXml}
${pitchXml}
        <duration>${duration}</duration>
        <type>${type}</type>${dotXml}${accidentalXml ? `\n        <accidental>${accidentalXml}</accidental>` : ""}${tiedXml}
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

  // Generate notes
  for (const note of measure.notes) {
    notesXml += "\n" + generateNoteXml(note, preferFlats, options);
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
