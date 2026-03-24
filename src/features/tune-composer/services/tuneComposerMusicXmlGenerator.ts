/**
 * Tune Composer MusicXML Generator
 *
 * Converts TuneComposerScore to MusicXML with support for:
 * - Lyrics
 * - Dynamics
 * - Articulations
 * - Expression text
 */

import type {
  TuneComposerScore,
  Measure,
  Note,
  DurationValue,
  TimeSignature,
  Clef,
  KeySignature,
  Accidental,
  DynamicType,
  ArticulationType,
  WedgeMark,
  Lyric,
} from "../types";
import { DURATION, isRest } from "../types";

// =============================================================================
// Types
// =============================================================================

export interface MusicXmlGeneratorOptions {
  includeHeader?: boolean;
  cursorPosition?: { measureIndex: number; noteIndex: number };
  selectedNoteId?: string;
}

// =============================================================================
// Constants
// =============================================================================

const DIVISIONS = 12;

const DURATION_TO_TYPE: Record<DurationValue, string> = {
  [DURATION.WHOLE]: "whole",
  [DURATION.HALF]: "half",
  [DURATION.QUARTER]: "quarter",
  [DURATION.EIGHTH]: "eighth",
  [DURATION.TRIPLET_QUARTER]: "quarter",
  [DURATION.TRIPLET_EIGHTH]: "eighth",
  [DURATION.SIXTEENTH]: "16th",
};

const DURATION_TO_DIVISIONS: Record<DurationValue, number> = {
  [DURATION.WHOLE]: 48,
  [DURATION.HALF]: 24,
  [DURATION.QUARTER]: 12,
  [DURATION.EIGHTH]: 6,
  [DURATION.TRIPLET_QUARTER]: 8,
  [DURATION.TRIPLET_EIGHTH]: 4,
  [DURATION.SIXTEENTH]: 3,
};

const CLEF_TO_XML: Record<Clef, { sign: string; line: number }> = {
  treble: { sign: "G", line: 2 },
  bass: { sign: "F", line: 4 },
};

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

// Dynamic to MusicXML mapping
const DYNAMIC_TO_XML: Record<DynamicType, string> = {
  pp: "pp",
  p: "p",
  mp: "mp",
  mf: "mf",
  f: "f",
  ff: "ff",
  fp: "fp",
  sf: "sf",
  sfz: "sfz",
};

// Articulation to MusicXML element mapping
const ARTICULATION_TO_XML: Record<ArticulationType, string> = {
  accent: "accent",
  "strong-accent": "strong-accent",
  staccato: "staccato",
  staccatissimo: "staccatissimo",
  tenuto: "tenuto",
  "detached-legato": "detached-legato",
  fermata: "fermata",
};

// =============================================================================
// Helper Functions
// =============================================================================

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

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// =============================================================================
// Lyric XML Generation
// =============================================================================

function generateLyricXml(lyric: Lyric | undefined): string {
  if (!lyric || !lyric.text) return "";

  const syllabic = lyric.syllabic || "single";
  const text = escapeXml(lyric.text);

  // Handle melisma (extend marks)
  const extendXml =
    lyric.melismaLength && lyric.melismaLength > 1
      ? '\n          <extend type="start"/>'
      : "";

  return `
        <lyric number="1">
          <syllabic>${syllabic}</syllabic>
          <text>${text}</text>${extendXml}
        </lyric>`;
}

// =============================================================================
// Direction XML Generation (Dynamics, Expression)
// =============================================================================

function generateDynamicDirectionXml(dynamic: DynamicType): string {
  const dynamicTag = DYNAMIC_TO_XML[dynamic];
  return `      <direction placement="below">
        <direction-type>
          <dynamics>
            <${dynamicTag}/>
          </dynamics>
        </direction-type>
      </direction>`;
}

function generateExpressionDirectionXml(expression: string): string {
  return `      <direction placement="above">
        <direction-type>
          <words font-style="italic">${escapeXml(expression)}</words>
        </direction-type>
      </direction>`;
}

function generateWedgeDirectionXml(wedge: WedgeMark): string {
  const wedgeType =
    wedge.type === "crescendo"
      ? "crescendo"
      : wedge.type === "diminuendo"
        ? "diminuendo"
        : "stop";

  return `      <direction placement="below">
        <direction-type>
          <wedge type="${wedgeType}"/>
        </direction-type>
      </direction>`;
}

// =============================================================================
// Note XML Generation
// =============================================================================

function generateNoteXml(
  note: Note,
  preferFlats: boolean,
  options: MusicXmlGeneratorOptions,
  isLastInTripletGroup: boolean = false,
  beamType: "begin" | "continue" | "end" | null = null,
): string {
  const baseDuration = DURATION_TO_DIVISIONS[note.duration];
  const duration = note.dotted ? baseDuration * 1.5 : baseDuration;
  const type = DURATION_TO_TYPE[note.duration];
  const isSelected = options.selectedNoteId === note.id;
  const isTriplet = note.tripletPosition !== undefined;

  const noteAttrs = isSelected ? ' color="#0066CC"' : "";
  const dotXml = note.dotted ? "\n        <dot/>" : "";

  const timeModXml = isTriplet
    ? `\n        <time-modification>
          <actual-notes>3</actual-notes>
          <normal-notes>2</normal-notes>
        </time-modification>`
    : "";

  let notationsContent = "";

  // Tuplet notations
  if (isTriplet) {
    if (note.tripletPosition === 1) {
      notationsContent += '<tuplet type="start" bracket="yes" number="1"/>';
    }
    if (isLastInTripletGroup) {
      notationsContent += '<tuplet type="stop" number="1"/>';
    }
  }

  // Articulation notations
  if (note.articulation) {
    const artXml = ARTICULATION_TO_XML[note.articulation];
    if (note.articulation === "fermata") {
      notationsContent += `<fermata/>`;
    } else {
      notationsContent += `<articulations><${artXml}/></articulations>`;
    }
  }

  if (isRest(note)) {
    const restNotationsXml = notationsContent
      ? `\n        <notations>${notationsContent}</notations>`
      : "";

    return `      <note${noteAttrs}>
        <rest/>
        <duration>${duration}</duration>
        <type>${type}</type>${dotXml}${timeModXml}${restNotationsXml}
      </note>`;
  }

  // Pitched note
  let step: string;
  let octave: number;
  let alter: number;

  if (note.accidental !== undefined && note.midi !== null) {
    const accidentalOffset = accidentalToAlter(note.accidental);
    const baseMidi = note.midi - accidentalOffset;
    const basePitch = midiToPitch(baseMidi, preferFlats);
    step = basePitch.step;
    octave = basePitch.octave;
    alter = accidentalOffset;
  } else if (note.midi !== null) {
    const pitch = midiToPitch(note.midi, preferFlats);
    step = pitch.step;
    octave = pitch.octave;
    alter = pitch.alter;
  } else {
    // Shouldn't happen for pitched notes
    step = "C";
    octave = 4;
    alter = 0;
  }

  const pitchXml = `        <pitch>
          <step>${step}</step>${alter !== 0 ? `\n          <alter>${alter}</alter>` : ""}
          <octave>${octave}</octave>
        </pitch>`;

  const accidentalXml = accidentalToXml(note.accidental);

  let tieXml = "";
  if (note.tieStart) {
    tieXml += '\n        <tie type="start"/>';
  }
  if (note.tieEnd) {
    tieXml += '\n        <tie type="stop"/>';
  }

  if (note.tieStart) {
    notationsContent += '<tied type="start"/>';
  }
  if (note.tieEnd) {
    notationsContent += '<tied type="stop"/>';
  }

  // Slurs
  if (note.slurStart) {
    const placement = note.slurPlacement
      ? ` placement="${note.slurPlacement}"`
      : "";
    notationsContent += `<slur type="start" number="1"${placement}/>`;
  }
  if (note.slurEnd) {
    notationsContent += '<slur type="stop" number="1"/>';
  }

  const beamXml = beamType
    ? `\n        <beam number="1">${beamType}</beam>`
    : "";

  const notationsXml = notationsContent
    ? `\n        <notations>${notationsContent}</notations>`
    : "";

  // Generate lyric
  const lyricXml = generateLyricXml(note.lyric);

  return `      <note${noteAttrs}>${tieXml}
${pitchXml}
        <duration>${duration}</duration>
        <type>${type}</type>${dotXml}${beamXml}${timeModXml}${accidentalXml ? `\n        <accidental>${accidentalXml}</accidental>` : ""}${notationsXml}${lyricXml}
      </note>`;
}

// =============================================================================
// Measure XML Generation
// =============================================================================

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

function generateMeasureXml(
  measure: Measure,
  measureNumber: number,
  isFirstMeasure: boolean,
  isLastMeasure: boolean,
  score: TuneComposerScore,
  options: MusicXmlGeneratorOptions,
  scoreHasNotes: boolean,
): string {
  const preferFlats = score.keySignature < 0;
  let notesXml = "";

  if (
    options.cursorPosition &&
    options.cursorPosition.measureIndex === measureNumber - 1
  ) {
    notesXml += `\n      <!-- cursor:${options.cursorPosition.noteIndex} -->`;
  }

  // Pre-compute last in triplet group
  const lastInTripletGroup = new Set<string>();
  for (let i = 0; i < measure.notes.length; i++) {
    const note = measure.notes[i];
    if (note.tripletGroupId) {
      const nextNote = measure.notes[i + 1];
      if (!nextNote || nextNote.tripletGroupId !== note.tripletGroupId) {
        lastInTripletGroup.add(note.id);
      }
    }
  }

  // Pre-compute beam info
  const beamInfo = new Map<string, "begin" | "continue" | "end">();
  const tolerance = 0.001;
  for (let i = 0; i < measure.notes.length; i++) {
    const note = measure.notes[i];
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

    const prevIsBeamable =
      prevNote &&
      prevNote.tripletGroupId === groupId &&
      prevNote.midi !== null &&
      Math.abs(prevNote.duration - DURATION.TRIPLET_EIGHTH) < tolerance;

    const nextIsBeamable =
      nextNote &&
      nextNote.tripletGroupId === groupId &&
      nextNote.midi !== null &&
      Math.abs(nextNote.duration - DURATION.TRIPLET_EIGHTH) < tolerance;

    if (!prevIsBeamable && nextIsBeamable) {
      beamInfo.set(note.id, "begin");
    } else if (prevIsBeamable && nextIsBeamable) {
      beamInfo.set(note.id, "continue");
    } else if (prevIsBeamable && !nextIsBeamable) {
      beamInfo.set(note.id, "end");
    }
  }

  // Generate notes with directions
  for (const note of measure.notes) {
    // Add direction before note for dynamics/expression
    if (note.dynamic) {
      notesXml += "\n" + generateDynamicDirectionXml(note.dynamic);
    }
    if (note.expression) {
      notesXml += "\n" + generateExpressionDirectionXml(note.expression);
    }
    if (note.wedge) {
      notesXml += "\n" + generateWedgeDirectionXml(note.wedge);
    }

    const isLastInTriplet = lastInTripletGroup.has(note.id);
    const beam = beamInfo.get(note.id) || null;
    notesXml +=
      "\n" + generateNoteXml(note, preferFlats, options, isLastInTriplet, beam);
  }

  const attributesXml = isFirstMeasure
    ? "\n" +
      generateAttributesXml(score.timeSignature, score.keySignature, score.clef)
    : "";

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

export function generateMusicXml(
  score: TuneComposerScore,
  options: MusicXmlGeneratorOptions = {},
): string {
  const { includeHeader = true } = options;

  const scoreHasNotes = score.measures.some(
    (measure) => measure.notes.length > 0,
  );

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

  const partListXml = `  <part-list>
    <score-part id="P1">
      <part-name>Part 1</part-name>
    </score-part>
  </part-list>`;

  const identificationXml = `  <identification>
    <encoding>
      <software>Sound First Tune Composer</software>
      <encoding-date>${new Date().toISOString().split("T")[0]}</encoding-date>
    </encoding>
  </identification>`;

  const workXml = `  <work>
    <work-title>${escapeXml(score.title)}</work-title>
  </work>`;

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

export function generateMusicXmlPreview(
  score: TuneComposerScore,
  options: MusicXmlGeneratorOptions = {},
): string {
  return generateMusicXml(score, { ...options, includeHeader: true });
}

export function validateScoreForExport(score: TuneComposerScore): {
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

  return { valid: errors.length === 0, errors };
}
