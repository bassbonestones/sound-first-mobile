/**
 * pitchEventsToMusicXml
 *
 * Converts generated pitch events (from the chord progression generator)
 * into MusicXML format for display in OpenSheetMusicDisplay.
 */

import type {
  GeneratedPitchEvent,
  GeneratedChordSegment,
  TimeSignature,
  KeySignature,
  Clef,
} from "../types";

// =============================================================================
// Types
// =============================================================================

export interface PracticeContentToMusicXmlOptions {
  /** Segments with chord symbols and events */
  segments: GeneratedChordSegment[];
  /** All events in order */
  events: GeneratedPitchEvent[];
  /** Total duration in beats */
  totalBeats: number;
  /** Title for the exercise */
  title?: string;
  /** Time signature */
  timeSignature?: TimeSignature;
  /** Key signature (-7 to +7) */
  keySignature?: KeySignature;
  /** Clef type */
  clef?: Clef;
  /** Tempo in BPM */
  tempo?: number;
}

// =============================================================================
// Constants
// =============================================================================

const DIVISIONS = 12; // 12 divisions per quarter note (supports triplets)

/** Map duration in beats to divisions */
function beatsToDivisions(beats: number): number {
  return Math.round(beats * DIVISIONS);
}

/** Map duration in beats to note type */
function beatsToNoteType(beats: number): string {
  if (beats >= 4) return "whole";
  if (beats >= 2) return "half";
  if (beats >= 1) return "quarter";
  if (beats >= 0.5) return "eighth";
  if (beats >= 0.25) return "16th";
  return "32nd";
}

const CLEF_TO_XML: Record<string, { sign: string; line: number }> = {
  treble: { sign: "G", line: 2 },
  bass: { sign: "F", line: 4 },
};

// Flat keys use flats for pitch spelling, sharp keys use sharps
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

function midiToPitch(
  midi: number,
  preferFlats: boolean,
): { step: string; alter: number; octave: number } {
  const octave = Math.floor(midi / 12) - 1;
  const pitchClass = midi % 12;
  const mapping = preferFlats ? MIDI_TO_PITCH_FLAT : MIDI_TO_PITCH_SHARP;
  const { step, alter } = mapping[pitchClass];
  return { step, alter, octave };
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
// MusicXML Generation
// =============================================================================

function generateHeader(title: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>${escapeXml(title)}</work-title>
  </work>
  <part-list>
    <score-part id="P1">
      <part-name>Practice</part-name>
    </score-part>
  </part-list>
  <part id="P1">`;
}

function generateAttributes(
  timeSignature: TimeSignature,
  keySignature: KeySignature,
  clef: Clef,
): string {
  const clefInfo = CLEF_TO_XML[clef];
  return `
    <attributes>
      <divisions>${DIVISIONS}</divisions>
      <key>
        <fifths>${keySignature}</fifths>
      </key>
      <time>
        <beats>${timeSignature.beats}</beats>
        <beat-type>${timeSignature.beatUnit}</beat-type>
      </time>
      <clef>
        <sign>${clefInfo.sign}</sign>
        <line>${clefInfo.line}</line>
      </clef>
    </attributes>`;
}

function generateDirection(tempo: number): string {
  return `
    <direction placement="above">
      <direction-type>
        <metronome>
          <beat-unit>quarter</beat-unit>
          <per-minute>${tempo}</per-minute>
        </metronome>
      </direction-type>
      <sound tempo="${tempo}"/>
    </direction>`;
}

function generateHarmony(chordSymbol: string): string {
  // Simple harmony element - OSMD will render the text
  // Parse root and quality from symbol
  const match = chordSymbol.match(/^([A-G][#b]?)(.*)$/);
  if (!match) {
    return `
    <harmony placement="above">
      <root>
        <root-step>C</root-step>
      </root>
      <kind text="${escapeXml(chordSymbol)}">major</kind>
    </harmony>`;
  }

  const [, root, quality] = match;
  const rootStep = root[0];
  let rootAlter = 0;
  if (root.length > 1) {
    rootAlter = root[1] === "#" ? 1 : -1;
  }

  // Map quality to MusicXML kind
  let kind = "major";
  const kindText = quality || "";
  if (quality.includes("m7b5") || quality.includes("ø")) {
    kind = "half-diminished";
  } else if (quality.includes("dim7") || quality.includes("°7")) {
    kind = "diminished-seventh";
  } else if (quality.includes("dim") || quality.includes("°")) {
    kind = "diminished";
  } else if (quality.includes("aug") || quality.includes("+")) {
    kind = "augmented";
  } else if (quality.includes("maj7") || quality.includes("Δ")) {
    kind = "major-seventh";
  } else if (quality.includes("m7")) {
    kind = "minor-seventh";
  } else if (quality.includes("7")) {
    kind = "dominant";
  } else if (quality.includes("m") && !quality.includes("maj")) {
    kind = "minor";
  }

  return `
    <harmony placement="above">
      <root>
        <root-step>${rootStep}</root-step>
        ${rootAlter !== 0 ? `<root-alter>${rootAlter}</root-alter>` : ""}
      </root>
      <kind text="${escapeXml(kindText)}">${kind}</kind>
    </harmony>`;
}

function generateNote(
  event: GeneratedPitchEvent,
  preferFlats: boolean,
): string {
  const divisions = beatsToDivisions(event.duration_beats);
  const noteType = beatsToNoteType(event.duration_beats);

  if (event.is_rest || event.midi_note === null) {
    return `
    <note>
      <rest/>
      <duration>${divisions}</duration>
      <type>${noteType}</type>
    </note>`;
  }

  const { step, alter, octave } = midiToPitch(event.midi_note, preferFlats);

  const pitchXml = `
      <pitch>
        <step>${step}</step>
        ${alter !== 0 ? `<alter>${alter}</alter>` : ""}
        <octave>${octave}</octave>
      </pitch>`;

  // Add accidental element if there's an alteration
  let accidentalXml = "";
  if (alter !== 0) {
    const accidentalType =
      alter === 1
        ? "sharp"
        : alter === -1
          ? "flat"
          : alter === 2
            ? "double-sharp"
            : "flat-flat";
    accidentalXml = `
      <accidental>${accidentalType}</accidental>`;
  }

  return `
    <note>${pitchXml}
      <duration>${divisions}</duration>
      <type>${noteType}</type>${accidentalXml}
    </note>`;
}

function generateMeasure(
  measureNumber: number,
  events: GeneratedPitchEvent[],
  chordSymbol: string | undefined,
  preferFlats: boolean,
  isFirst: boolean,
  timeSignature: TimeSignature,
  keySignature: KeySignature,
  clef: Clef,
  tempo: number,
): string {
  let measureXml = `
  <measure number="${measureNumber}">`;

  // First measure needs attributes
  if (isFirst) {
    measureXml += generateAttributes(timeSignature, keySignature, clef);
    measureXml += generateDirection(tempo);
  }

  // Add chord symbol if present
  if (chordSymbol) {
    measureXml += generateHarmony(chordSymbol);
  }

  // Add notes
  for (const event of events) {
    measureXml += generateNote(event, preferFlats);
  }

  measureXml += `
  </measure>`;

  return measureXml;
}

function generateFooter(): string {
  return `
  </part>
</score-partwise>`;
}

// =============================================================================
// Main Export
// =============================================================================

/**
 * Convert practice content (pitch events with chord segments) to MusicXML.
 */
export function practiceContentToMusicXml(
  options: PracticeContentToMusicXmlOptions,
): string {
  const {
    segments,
    events,
    totalBeats: _totalBeats,
    title = "Practice Exercise",
    timeSignature = { beats: 4, beatUnit: 4 },
    keySignature = 0,
    clef = "treble",
    tempo = 120,
  } = options;

  // Determine if we should prefer flats based on key signature
  const preferFlats = keySignature < 0;

  // Calculate beats per measure
  const beatsPerMeasure = (timeSignature.beats * 4) / timeSignature.beatUnit;

  // Group events by measure
  const measureEvents: GeneratedPitchEvent[][] = [];
  const measureChords: (string | undefined)[] = [];

  let currentMeasure: GeneratedPitchEvent[] = [];
  let currentMeasureStart = 0;

  // Create a map of offset -> chord symbol
  const chordAtOffset: Map<number, string> = new Map();
  let chordOffset = 0;
  for (const segment of segments) {
    chordAtOffset.set(chordOffset, segment.chord_symbol);
    chordOffset += segment.duration_beats;
  }

  for (const event of events) {
    // Check if we need to start a new measure
    const measureEnd = currentMeasureStart + beatsPerMeasure;

    if (event.offset_beats >= measureEnd) {
      // Save current measure
      if (currentMeasure.length > 0) {
        measureEvents.push(currentMeasure);
        // Find chord for this measure (chord at or before measure start)
        let measureChord: string | undefined;
        for (let offset = currentMeasureStart; offset >= 0; offset -= 0.5) {
          if (chordAtOffset.has(offset)) {
            measureChord = chordAtOffset.get(offset);
            break;
          }
        }
        measureChords.push(measureChord);
      }

      // Start new measure
      currentMeasure = [];
      currentMeasureStart = measureEnd;
    }

    currentMeasure.push(event);
  }

  // Push final measure
  if (currentMeasure.length > 0) {
    measureEvents.push(currentMeasure);
    let measureChord: string | undefined;
    for (let offset = currentMeasureStart; offset >= 0; offset -= 0.5) {
      if (chordAtOffset.has(offset)) {
        measureChord = chordAtOffset.get(offset);
        break;
      }
    }
    measureChords.push(measureChord);
  }

  // Generate MusicXML
  let xml = generateHeader(title);

  for (let i = 0; i < measureEvents.length; i++) {
    xml += generateMeasure(
      i + 1,
      measureEvents[i],
      measureChords[i],
      preferFlats,
      i === 0,
      timeSignature,
      keySignature,
      clef,
      tempo,
    );
  }

  xml += generateFooter();

  return xml;
}
