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
  DynamicTextType,
  ArticulationType,
  WedgeMark,
  Lyric,
  ChordSymbol,
} from "../types";
import {
  DURATION,
  isRest,
  getActiveProgression,
  getChordsForMeasure,
  getBeatUnitDuration,
  resolveChordSymbol,
} from "../types";
import { recognizeChord } from "./chordRecognition";
import { devLog } from "../../../utils/devLogger";

// =============================================================================
// Types
// =============================================================================

export interface MusicXmlGeneratorOptions {
  includeHeader?: boolean;
  cursorPosition?: { measureIndex: number; noteIndex: number };
  selectedNoteId?: string;
  /** When true, uses proper forward/backup for all measures (for external programs like MuseScore).
   * When false (default), uses OSMD-compatible workaround for last measure. */
  exportMode?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const DIVISIONS = 12;

// Middle line MIDI values: B4 for treble (71), D3 for bass (50)
const MIDDLE_LINE_MIDI: Record<Clef, number> = {
  treble: 71,
  bass: 50,
};

/**
 * Compute slur placement for a group of notes.
 * Matches OSMD's stem direction algorithm:
 * - If the farthest note above and below middle line are close (within 2 semitones),
 *   favor the higher note (stems down, slurs above)
 * - Otherwise, the clearly farthest note determines stem direction
 * Slurs go on the OPPOSITE side of stems.
 */
function computeSlurPlacement(midis: number[], clef: Clef): "above" | "below" {
  if (midis.length === 0) return "below";

  const middleLine = MIDDLE_LINE_MIDI[clef];
  const maxMidi = Math.max(...midis);
  const minMidi = Math.min(...midis);

  // Distance above and below middle line
  const distAbove = maxMidi - middleLine;
  const distBelow = middleLine - minMidi;

  // If distances are close (within 2 semitones), favor higher note (stems down, slurs above)
  // Otherwise, use the clearly farthest note
  if (Math.abs(distAbove - distBelow) <= 2) {
    // Near tie - favor higher note if any note is above middle line
    return distAbove > 0 ? "above" : "below";
  }

  // Clear winner - farthest note determines
  return distAbove > distBelow ? "above" : "below";
}

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
  ppp: "ppp",
  pp: "pp",
  p: "p",
  mp: "mp",
  mf: "mf",
  f: "f",
  ff: "ff",
  fff: "fff",
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

/**
 * Mapping from chord quality to MusicXML kind.
 * Based on MusicXML 3.1 kind element values.
 */
const CHORD_QUALITY_TO_MUSICXML_KIND: Record<string, string> = {
  // Triads
  major: "major",
  minor: "minor",
  diminished: "diminished",
  augmented: "augmented",
  sus2: "suspended-second",
  sus4: "suspended-fourth",
  // Seventh chords
  maj7: "major-seventh",
  "7": "dominant",
  m7: "minor-seventh",
  mMaj7: "major-minor",
  dim7: "diminished-seventh",
  m7b5: "half-diminished",
  aug7: "augmented-seventh",
  "7sus4": "dominant-suspended-fourth",
  "7sus2": "dominant-suspended-second",
  // Extended chords
  maj9: "major-ninth",
  "9": "dominant-ninth",
  m9: "minor-ninth",
  mMaj9: "major-minor-ninth",
  maj11: "major-11th",
  "11": "dominant-11th",
  m11: "minor-11th",
  maj13: "major-13th",
  "13": "dominant-13th",
  m13: "minor-13th",
  // Add chords
  add9: "major", // with added degree
  add11: "major", // with added degree
  madd9: "minor", // with added degree
  "6": "major-sixth",
  m6: "minor-sixth",
  "6/9": "major-sixth",
  "m6/9": "minor-sixth",
  // Altered chords - use dominant as base
  "7b9": "dominant",
  "7#9": "dominant",
  "7b5": "dominant",
  "7#5": "augmented-seventh",
  "7b5b9": "dominant",
  "7#5#9": "augmented-seventh",
  "7alt": "dominant",
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
// Harmony XML Generation
// =============================================================================

/**
 * Convert a chord symbol to a shorter display version using Unicode symbols.
 * This helps prevent chord text from overlapping on the score.
 * Note: △ alone means "major 7th" in jazz notation (no need for redundant 7)
 */
function shortenChordSymbol(symbol: string): string {
  return (
    symbol
      // Root note accidentals
      .replace(/([A-G])#/g, "$1♯")
      .replace(/([A-G])b/g, "$1♭")
      // Quality abbreviations (△ = maj7, ø = m7b5 - no redundant 7)
      .replace(/maj13/gi, "△13")
      .replace(/maj9/gi, "△9")
      .replace(/maj7/gi, "△")
      .replace(/maj/gi, "△")
      .replace(/min7/gi, "m7")
      .replace(/min9/gi, "m9")
      .replace(/min/gi, "m")
      .replace(/dim7/gi, "°7")
      .replace(/dim/gi, "°")
      .replace(/aug/gi, "+")
      .replace(/m7b5/gi, "ø")
      .replace(/half-dim/gi, "ø")
      // Alterations in parentheses
      .replace(/\(alt\s*/gi, "(")
      .replace(/#9/g, "♯9")
      .replace(/b9/g, "♭9")
      .replace(/#11/g, "♯11")
      .replace(/b5/g, "♭5")
      .replace(/#5/g, "♯5")
      .replace(/b13/g, "♭13")
  );
}

/**
 * Convert a root note alter value to MusicXML format.
 */
function alterToXml(alter: number): string {
  if (alter === 0) return "";
  return `\n        <root-alter>${alter}</root-alter>`;
}

/**
 * Generate MusicXML <harmony> element from a resolved chord symbol string.
 * Returns empty string if chord cannot be parsed.
 * @param symbol The resolved chord symbol string (e.g., "Cmaj7")
 * @param offsetDivisions Beat offset in divisions (12 per quarter note)
 */
export function generateHarmonyXml(
  symbol: string,
  offsetDivisions: number = 0,
): string {
  const result = recognizeChord(symbol);
  if (!result.recognized || !result.parsed) {
    return "";
  }

  const { root, quality, bass, alterations } = result.parsed;

  // Parse root note
  const rootStep = root.replace(/[#b]/g, "");
  const rootAlter =
    root.includes("##") || root.includes("x")
      ? 2
      : root.includes("#")
        ? 1
        : root.includes("bb")
          ? -2
          : root.includes("b")
            ? -1
            : 0;

  // Get MusicXML kind
  const kind = CHORD_QUALITY_TO_MUSICXML_KIND[quality] || "major";

  // Create shortened display text for the chord quality/alterations
  // Remove the root note from the symbol and exclude bass note (slash chord part)
  // Bass is handled separately via <bass> element
  let symbolWithoutRoot = symbol.slice(root.length);
  const slashIndex = symbolWithoutRoot.indexOf("/");
  if (slashIndex >= 0) {
    symbolWithoutRoot = symbolWithoutRoot.slice(0, slashIndex);
  }
  const shortenedQuality = shortenChordSymbol(symbolWithoutRoot);
  const displayText = escapeXml(shortenedQuality);

  // Build root element with placement above staff
  // Use the semantic kind with text attribute for display
  let harmonyXml = `      <harmony placement="above">
        <root>
          <root-step>${rootStep}</root-step>${alterToXml(rootAlter)}
        </root>
        <kind text="${displayText}">${kind}</kind>`;

  // Add degree elements for alterations
  for (const alteration of alterations) {
    const degreeMatch = alteration.match(/([#b])?(\d+)/);
    if (degreeMatch) {
      const alter =
        degreeMatch[1] === "#" ? 1 : degreeMatch[1] === "b" ? -1 : 0;
      const value = degreeMatch[2];
      harmonyXml += `
        <degree>
          <degree-value>${value}</degree-value>
          <degree-alter>${alter}</degree-alter>
          <degree-type>alter</degree-type>
        </degree>`;
    }
  }

  // Add bass note for slash chords
  if (bass) {
    const bassStep = bass.replace(/[#b]/g, "");
    const bassAlter =
      bass.includes("##") || bass.includes("x")
        ? 2
        : bass.includes("#")
          ? 1
          : bass.includes("bb")
            ? -2
            : bass.includes("b")
              ? -1
              : 0;
    harmonyXml += `
        <bass>
          <bass-step>${bassStep}</bass-step>${bassAlter !== 0 ? `\n          <bass-alter>${bassAlter}</bass-alter>` : ""}
        </bass>`;
  }

  // Add offset element to preserve beat position during round-trip
  if (offsetDivisions > 0) {
    harmonyXml += `
        <offset>${offsetDivisions}</offset>`;
  }

  harmonyXml += `
      </harmony>`;

  return harmonyXml;
}

// =============================================================================
// Lyric XML Generation
// =============================================================================

function generateLyricXml(lyric: Lyric | undefined): string {
  if (!lyric || !lyric.text) return "";

  const syllabic = lyric.syllabic || "single";
  const text = escapeXml(lyric.text);

  // Handle melisma (extend marks) - use plain <extend/> for compatibility
  const extendXml =
    lyric.melismaLength && lyric.melismaLength > 1
      ? "\n          <extend/>"
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

function generateDynamicTextDirectionXml(dynamicText: DynamicTextType): string {
  return `      <direction placement="below">
        <direction-type>
          <words font-style="italic">${escapeXml(dynamicText)}</words>
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
  // For start position, use the wedge type (crescendo/diminuendo)
  // For stop position, use "stop"
  const wedgeType = wedge.position === "stop" ? "stop" : wedge.type;

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
  clef: Clef,
  isLastInTripletGroup: boolean = false,
  beamType: "begin" | "continue" | "end" | null = null,
  slurPlacement?: "above" | "below",
  isMelismaContinuation: boolean = false,
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

  // Slurs - use computed placement based on stem direction
  if (note.slurStart) {
    const placementAttr = slurPlacement ? ` placement="${slurPlacement}"` : "";
    notationsContent += `<slur type="start" number="1"${placementAttr}/>`;
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

  // Generate lyric (or extend for melisma continuation)
  let lyricXml = generateLyricXml(note.lyric);
  if (!lyricXml && isMelismaContinuation) {
    lyricXml = `
        <lyric number="1">
          <extend/>
        </lyric>`;
  }

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
  measureIndex: number,
  isFirstMeasure: boolean,
  isLastMeasure: boolean,
  score: TuneComposerScore,
  options: MusicXmlGeneratorOptions,
  scoreHasNotes: boolean,
  activeChords: ChordSymbol[],
  isFirstFullMeasure: boolean = false,
  melismaContinuationNotes: Set<string> = new Set(),
): string {
  const preferFlats = score.keySignature < 0;
  const isPickup = measure.isPickup ?? false;
  let notesXml = "";

  if (
    options.cursorPosition &&
    options.cursorPosition.measureIndex === measureIndex
  ) {
    notesXml += `\n      <!-- cursor:${options.cursorPosition.noteIndex} -->`;
  }

  // Get sorted chords for this measure (only if chord symbols are visible)
  // Convert beat unit index to quarter note position for comparison with currentBeat
  const beatUnitDuration = getBeatUnitDuration(score.timeSignature);
  const measureChords: Array<ChordSymbol & { beatPositionInQuarters: number }> =
    [];
  if (score.displaySettings.showChordSymbols) {
    const chords = getChordsForMeasure(activeChords, measureIndex);
    measureChords.push(
      ...chords
        .map((c) => ({
          ...c,
          beatPositionInQuarters: c.beatPosition * beatUnitDuration,
        }))
        .sort((a, b) => a.beatPositionInQuarters - b.beatPositionInQuarters),
    );
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

  // Pre-compute slur placements based on stem direction
  const slurPlacements = new Map<string, "above" | "below">();
  let slurStartIndex = -1;
  let slurStartNoteId: string | null = null;
  for (let i = 0; i < measure.notes.length; i++) {
    const note = measure.notes[i];
    if (note.slurStart) {
      slurStartIndex = i;
      slurStartNoteId = note.id;
    }
    if (note.slurEnd && slurStartIndex >= 0 && slurStartNoteId) {
      // Collect MIDI values in this slur
      const midis: number[] = [];
      for (let j = slurStartIndex; j <= i; j++) {
        const m = measure.notes[j].midi;
        if (m !== null) midis.push(m);
      }
      if (midis.length > 0) {
        slurPlacements.set(
          slurStartNoteId,
          computeSlurPlacement(midis, score.clef),
        );
      }
      slurStartIndex = -1;
      slurStartNoteId = null;
    }
  }

  // Generate harmony elements first using forward/backup for explicit positioning
  // This ensures OSMD positions chords at the correct beat, not relative to adjacent notes
  // EXCEPTION: For the LAST measure in preview mode, chords are interleaved with notes instead (OSMD workaround)
  // In export mode, always use forward/backup for proper MusicXML output
  const useForwardBackup = !isLastMeasure || options.exportMode;
  let harmoniesXml = "";
  if (measureChords.length > 0 && useForwardBackup) {
    devLog(
      `[MusicXML] Measure ${measureIndex}: ${measureChords.length} chords`,
    );
    for (const chord of measureChords) {
      const offsetDivisions = Math.round(chord.beatPositionInQuarters * 12);
      const resolvedSymbol = resolveChordSymbol(
        chord,
        score.keySignature,
        preferFlats,
      );
      devLog(
        `[MusicXML] Chord "${resolvedSymbol}" at beat ${chord.beatPosition} (${chord.beatPositionInQuarters} quarters), offset=${offsetDivisions} divisions`,
      );

      // Use forward/backup for non-zero offset positions
      if (offsetDivisions > 0) {
        // Forward to the chord's position
        harmoniesXml += `
      <forward>
        <duration>${offsetDivisions}</duration>
      </forward>`;
      }

      // Output harmony
      harmoniesXml += "\n" + generateHarmonyXml(resolvedSymbol, 0);

      if (offsetDivisions > 0) {
        // Backup to start of measure
        harmoniesXml += `
      <backup>
        <duration>${offsetDivisions}</duration>
      </backup>`;
      }
    }
    devLog(
      `[MusicXML] Generated harmoniesXml:`,
      harmoniesXml.substring(0, 500),
    );
  }

  // For the LAST measure in preview mode only, we need to interleave harmonies with notes
  // because forward/backup crashes OSMD on the last measure.
  // In export mode, we use forward/backup for all measures (proper MusicXML).
  // Build a map of which chords go before which note index.
  const useInterleaving = !useForwardBackup;
  const lastMeasureChordsBeforeNote = new Map<
    number,
    Array<{ chord: (typeof measureChords)[0]; offsetDivisions: number }>
  >();
  const lastMeasureChordsAtEnd: Array<{
    chord: (typeof measureChords)[0];
    offsetDivisions: number;
  }> = [];

  if (useInterleaving && measureChords.length > 0) {
    devLog(
      `[MusicXML] Last measure ${measureIndex}: ${measureChords.length} chords (interleaving with notes)`,
    );
    // Calculate beat position for each note
    const noteBeatPositions: number[] = [];
    let currentBeat = 0;
    for (const note of measure.notes) {
      noteBeatPositions.push(currentBeat);
      currentBeat += note.duration;
    }
    devLog(
      `[MusicXML] Note beat positions:`,
      noteBeatPositions.map((b) => b.toFixed(2)).join(", "),
    );

    // Assign each chord to appear before the appropriate note
    for (const chord of measureChords) {
      const chordBeat = chord.beatPositionInQuarters;
      const offsetDivisions = Math.round(chordBeat * 12);
      const resolvedSymbol = resolveChordSymbol(
        chord,
        score.keySignature,
        preferFlats,
      );

      // Find the first note that starts at or after this chord's beat
      const noteIndex = noteBeatPositions.findIndex(
        (beat) => beat >= chordBeat,
      );

      if (noteIndex === -1) {
        // No note at or after this beat - chord goes at end
        lastMeasureChordsAtEnd.push({ chord, offsetDivisions });
        devLog(
          `[MusicXML] Chord "${resolvedSymbol}" at beat ${chordBeat} -> after all notes`,
        );
      } else {
        // Chord goes before this note
        const existing = lastMeasureChordsBeforeNote.get(noteIndex) || [];
        existing.push({ chord, offsetDivisions });
        lastMeasureChordsBeforeNote.set(noteIndex, existing);
        devLog(
          `[MusicXML] Chord "${resolvedSymbol}" at beat ${chordBeat} -> before note ${noteIndex} (at beat ${noteBeatPositions[noteIndex]})`,
        );
      }
    }
  }

  // Generate notes with directions (and interleaved harmonies for last measure)
  for (let noteIndex = 0; noteIndex < measure.notes.length; noteIndex++) {
    const note = measure.notes[noteIndex];

    // For last measure in preview mode: output any chords that should appear before this note
    if (useInterleaving) {
      const chordsHere = lastMeasureChordsBeforeNote.get(noteIndex) || [];
      for (const { chord } of chordsHere) {
        const resolvedSymbol = resolveChordSymbol(
          chord,
          score.keySignature,
          preferFlats,
        );
        // Don't use offset for interleaved chords - position is determined by document order
        notesXml += "\n" + generateHarmonyXml(resolvedSymbol, 0);
      }
    }

    // Add direction before note for dynamics/expression
    if (note.dynamic) {
      notesXml += "\n" + generateDynamicDirectionXml(note.dynamic);
    }
    if (note.dynamicText) {
      notesXml += "\n" + generateDynamicTextDirectionXml(note.dynamicText);
    }
    if (note.expression) {
      notesXml += "\n" + generateExpressionDirectionXml(note.expression);
    }
    if (note.wedge) {
      notesXml += "\n" + generateWedgeDirectionXml(note.wedge);
    }

    const isLastInTriplet = lastInTripletGroup.has(note.id);
    const beam = beamInfo.get(note.id) || null;
    const slurPlacement = slurPlacements.get(note.id);
    const isMelismaContinuation = melismaContinuationNotes.has(note.id);
    notesXml +=
      "\n" +
      generateNoteXml(
        note,
        preferFlats,
        options,
        score.clef,
        isLastInTriplet,
        beam,
        slurPlacement,
        isMelismaContinuation,
      );
  }

  // For last measure in preview mode: output any chords that come after all notes
  if (useInterleaving) {
    for (const { chord } of lastMeasureChordsAtEnd) {
      const resolvedSymbol = resolveChordSymbol(
        chord,
        score.keySignature,
        preferFlats,
      );
      // Don't use offset - these come after all notes
      notesXml += "\n" + generateHarmonyXml(resolvedSymbol, 0);
    }
  }

  // Attributes go on first measure (pickup or first full measure)
  const attributesXml = isFirstMeasure
    ? "\n" +
      generateAttributesXml(score.timeSignature, score.keySignature, score.clef)
    : "";

  // Metronome/tempo direction on first measure with notes (or first full measure)
  const showDirection = isPickup
    ? isFirstMeasure && scoreHasNotes
    : isFirstFullMeasure && scoreHasNotes;
  const directionXml = showDirection
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

  // Pickup measures use implicit="yes" attribute
  const measureAttrs = isPickup
    ? `number="${measureNumber}" implicit="yes"`
    : `number="${measureNumber}"`;

  return `    <measure ${measureAttrs}>${attributesXml}${directionXml}${harmoniesXml}${notesXml}${barlineXml}
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

  // Get active chord progression chords
  const activeProgression = getActiveProgression(score);
  const activeChords = activeProgression?.chords ?? [];

  // Pre-compute melisma continuation notes
  // A note is a melisma continuation if a previous note's lyric has melismaLength
  // that extends to cover this note
  const melismaContinuationNotes = new Set<string>();
  let melismaRemaining = 0;

  for (const measure of score.measures) {
    for (const note of measure.notes) {
      // Only pitched notes can be part of melisma
      if (note.midi !== null) {
        if (melismaRemaining > 0) {
          melismaContinuationNotes.add(note.id);
          melismaRemaining--;
        }
        // Check if this note starts a new melisma
        if (note.lyric?.melismaLength && note.lyric.melismaLength > 1) {
          // The next (melismaLength - 1) pitched notes are continuations
          melismaRemaining = note.lyric.melismaLength - 1;
        }
      }
    }
  }

  // Check if first measure is pickup
  const hasPickup = score.measures[0]?.isPickup ?? false;

  // Find index of first full (non-pickup) measure
  const firstFullMeasureIndex = hasPickup ? 1 : 0;

  const measuresXml = score.measures
    .map((measure, index) => {
      // Pickup measure = 0, then count from 1
      const measureNumber = hasPickup ? index : index + 1;
      const isFirstFullMeasure = index === firstFullMeasureIndex;

      return generateMeasureXml(
        measure,
        measureNumber,
        index,
        index === 0,
        index === score.measures.length - 1,
        score,
        options,
        scoreHasNotes,
        activeChords,
        isFirstFullMeasure,
        melismaContinuationNotes,
      );
    })
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
