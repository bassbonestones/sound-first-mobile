/**
 * MusicXML Generation for Chord Preview
 *
 * Generates MusicXML representation of chord voicings for visual preview.
 * Uses proper enharmonic spelling based on scale degrees.
 *
 * @module chordMusicXmlGenerator
 *
 * Extracted from chordRecognition.ts to separate MusicXML generation concerns.
 */

import {
  recognizeChord,
  CHORD_INTERVALS,
  ROOT_TO_SEMITONE,
  ALTERATION_INTERVALS,
  ALTERATION_REPLACES,
} from "./chordRecognition";

// =============================================================================
// Scale Degree Spelling
// =============================================================================

/** Note names in order (for calculating scale degrees) */
const NOTE_NAMES = ["C", "D", "E", "F", "G", "A", "B"];

/** Semitones from C for each natural note */
const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/**
 * Map from chord interval (semitones) to scale degree info.
 * degree: which scale degree (1-7)
 * alter: how many semitones to adjust from natural (-2 to +2)
 */
const INTERVAL_TO_DEGREE: Record<
  number,
  { degree: number; alter: number } | null
> = {
  0: { degree: 1, alter: 0 }, // Root
  1: { degree: 2, alter: -1 }, // b2 / b9
  2: { degree: 2, alter: 0 }, // 2 / 9
  3: { degree: 3, alter: -1 }, // b3 (minor 3rd)
  4: { degree: 3, alter: 0 }, // 3 (major 3rd) - will need +1 for some roots
  5: { degree: 4, alter: 0 }, // 4 / 11
  6: { degree: 5, alter: -1 }, // b5 / #11 (we'll use b5 for chord context)
  7: { degree: 5, alter: 0 }, // 5
  8: { degree: 5, alter: 1 }, // #5 / b13
  9: { degree: 6, alter: 0 }, // 6 / 13
  10: { degree: 7, alter: -1 }, // b7 (dominant 7th)
  11: { degree: 7, alter: 0 }, // 7 (major 7th) - will need adjustment
  12: { degree: 1, alter: 0 }, // Octave (root)
  13: { degree: 2, alter: -1 }, // b9 (octave + b2)
  14: { degree: 2, alter: 0 }, // 9 (octave + 2)
  15: { degree: 2, alter: 1 }, // #9
};

/**
 * Get the note name for a scale degree above a root.
 * @param rootStep - Root note letter (e.g., "D")
 * @param degree - Scale degree (1-7)
 * @returns Note letter for that degree
 */
function getDegreeNoteName(rootStep: string, degree: number): string {
  const rootIndex = NOTE_NAMES.indexOf(rootStep);
  if (rootIndex === -1) return "C";
  // degree 1 = root, degree 2 = next note, etc.
  const targetIndex = (rootIndex + degree - 1) % 7;
  return NOTE_NAMES[targetIndex];
}

/**
 * Calculate semitones from the root's natural note to another natural note.
 * @param rootStep - Root note letter
 * @param targetStep - Target note letter
 * @returns Semitones between them (0-11)
 */
function semitonesFromRoot(rootStep: string, targetStep: string): number {
  const rootSemi = NOTE_TO_SEMITONE[rootStep] ?? 0;
  const targetSemi = NOTE_TO_SEMITONE[targetStep] ?? 0;
  return (targetSemi - rootSemi + 12) % 12;
}

/**
 * Spell a chord tone correctly based on its interval and the root.
 *
 * @param rootNote - Root note name (e.g., "D", "Bb", "F#")
 * @param intervalSemitones - Interval in semitones from root
 * @param rootMidi - MIDI note of root
 * @returns Pitch info with correct spelling
 */
function spellChordTone(
  rootNote: string,
  intervalSemitones: number,
  rootMidi: number,
): { step: string; alter: number; octave: number } {
  // Extract root letter and alteration
  const rootStep = rootNote.charAt(0).toUpperCase();
  let rootAlter = 0;
  if (rootNote.includes("#")) rootAlter = 1;
  else if (rootNote.includes("b")) rootAlter = -1;

  const degreeInfo = INTERVAL_TO_DEGREE[intervalSemitones];
  if (!degreeInfo) {
    // Fallback for unknown intervals
    const midi = rootMidi + intervalSemitones;
    const octave = Math.floor(midi / 12) - 1;
    const pitchClass = midi % 12;
    const step = NOTE_NAMES[pitchClass % 7];
    return { step, alter: 0, octave };
  }

  // Get the note name for this scale degree
  const targetStep = getDegreeNoteName(rootStep, degreeInfo.degree);

  // Calculate what semitones the natural target note is from the root
  const naturalSemitones = semitonesFromRoot(rootStep, targetStep);

  // Account for root's own alteration
  // The actual interval from root pitch = naturalSemitones - rootAlter
  // We need to reach: intervalSemitones
  // So the target alteration = intervalSemitones - (naturalSemitones - rootAlter)
  //                         = intervalSemitones - naturalSemitones + rootAlter
  const targetAlter = intervalSemitones - naturalSemitones + rootAlter;

  // Normalize to reasonable range and handle octave
  let alter = targetAlter;
  let octaveAdjust = 0;
  while (alter > 2) {
    alter -= 12;
    octaveAdjust++;
  }
  while (alter < -2) {
    alter += 12;
    octaveAdjust--;
  }

  // Calculate octave
  const midi = rootMidi + intervalSemitones;
  const octave = Math.floor(midi / 12) - 1 + octaveAdjust;

  return { step: targetStep, alter, octave };
}

// =============================================================================
// MusicXML Generation
// =============================================================================

/**
 * Generate MusicXML for a chord preview (stacked notes on a single staff).
 *
 * @param symbol - Chord symbol to preview
 * @param rootMidi - MIDI note number for the root (default 60 = C4)
 * @param clef - Clef type: 'treble' or 'bass' (default 'treble')
 * @returns MusicXML string, or null if chord not recognized
 *
 * @example
 * generateChordPreviewMusicXml("D")
 * // Returns MusicXML with D F# A (correctly spelled, not D Gb A)
 */
export function generateChordPreviewMusicXml(
  symbol: string,
  rootMidi: number = 60,
  clef: "treble" | "bass" = "treble",
): string | null {
  const result = recognizeChord(symbol);

  if (!result.recognized || !result.parsed) {
    return null;
  }

  const { root, quality, bass, alterations } = result.parsed;
  const rootSemitone = ROOT_TO_SEMITONE[root];
  const intervals = CHORD_INTERVALS[quality];

  if (!intervals) {
    return null;
  }

  // Calculate MIDI for the root in the target octave
  const baseNote = rootMidi + rootSemitone;

  // Collect intervals to render
  const intervalSet = new Set(intervals);

  // Apply alterations
  if (alterations && alterations.length > 0) {
    for (const alt of alterations) {
      const altInterval = ALTERATION_INTERVALS[alt];
      if (altInterval !== undefined) {
        // Remove the natural tone if this alteration replaces it
        const replacedInterval = ALTERATION_REPLACES[alt];
        if (replacedInterval !== undefined) {
          intervalSet.delete(replacedInterval);
        }
        intervalSet.add(altInterval);
      }
    }
  }

  // Build spelled notes from intervals
  const spelledNotes: { step: string; alter: number; octave: number }[] = [];

  for (const interval of Array.from(intervalSet).sort((a, b) => a - b)) {
    const spelled = spellChordTone(root, interval, baseNote);
    spelledNotes.push(spelled);
  }

  // Add bass note if specified (below the chord)
  if (bass) {
    const bassSemitone = ROOT_TO_SEMITONE[bass];
    let bassNoteMidi = rootMidi - 12 + bassSemitone;
    while (bassNoteMidi >= baseNote) {
      bassNoteMidi -= 12;
    }
    // Spell bass note directly from its name
    const bassStep = bass.charAt(0).toUpperCase();
    let bassAlter = 0;
    if (bass.includes("#")) bassAlter = 1;
    else if (bass.includes("b")) bassAlter = -1;
    const bassOctave = Math.floor(bassNoteMidi / 12) - 1;
    spelledNotes.unshift({
      step: bassStep,
      alter: bassAlter,
      octave: bassOctave,
    });
  }

  if (spelledNotes.length === 0) {
    return null;
  }

  // Generate note XML for each chord tone
  const noteElements = spelledNotes.map((pitch, index) => {
    const chordTag = index > 0 ? "      <chord/>\n" : "";
    const alterXml =
      pitch.alter !== 0 ? `        <alter>${pitch.alter}</alter>\n` : "";

    return `${chordTag}      <note>
        <pitch>
          <step>${pitch.step}</step>
${alterXml}          <octave>${pitch.octave}</octave>
        </pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>`;
  });

  const clefSign = clef === "bass" ? "F" : "G";
  const clefLine = clef === "bass" ? "4" : "2";

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name></part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <clef>
          <sign>${clefSign}</sign>
          <line>${clefLine}</line>
        </clef>
      </attributes>
${noteElements.join("\n")}
      <barline location="right">
        <bar-style>none</bar-style>
      </barline>
    </measure>
  </part>
</score-partwise>`;
}
