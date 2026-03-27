/**
 * MusicXML Generation for Chord Preview
 *
 * Generates MusicXML representation of chord voicings for visual preview.
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
// MIDI to Pitch Conversion
// =============================================================================

/** Note names for each MIDI pitch class (using flats) */
const MIDI_TO_STEP_FLAT: Record<number, { step: string; alter: number }> = {
  0: { step: "C", alter: 0 },
  1: { step: "D", alter: -1 }, // Db
  2: { step: "D", alter: 0 },
  3: { step: "E", alter: -1 }, // Eb
  4: { step: "E", alter: 0 },
  5: { step: "F", alter: 0 },
  6: { step: "G", alter: -1 }, // Gb
  7: { step: "G", alter: 0 },
  8: { step: "A", alter: -1 }, // Ab
  9: { step: "A", alter: 0 },
  10: { step: "B", alter: -1 }, // Bb
  11: { step: "B", alter: 0 },
};

/** Note names for each MIDI pitch class (using sharps) */
const MIDI_TO_STEP_SHARP: Record<number, { step: string; alter: number }> = {
  0: { step: "C", alter: 0 },
  1: { step: "C", alter: 1 }, // C#
  2: { step: "D", alter: 0 },
  3: { step: "D", alter: 1 }, // D#
  4: { step: "E", alter: 0 },
  5: { step: "F", alter: 0 },
  6: { step: "F", alter: 1 }, // F#
  7: { step: "G", alter: 0 },
  8: { step: "G", alter: 1 }, // G#
  9: { step: "A", alter: 0 },
  10: { step: "A", alter: 1 }, // A#
  11: { step: "B", alter: 0 },
};

/**
 * Convert MIDI note to MusicXML pitch representation.
 * @param midi - MIDI note number (0-127)
 * @param preferSharp - Whether to prefer sharp spelling for accidentals
 * @returns Pitch components for MusicXML
 */
function midiToPitch(
  midi: number,
  preferSharp: boolean = false,
): {
  step: string;
  octave: number;
  alter: number;
} {
  const octave = Math.floor(midi / 12) - 1;
  const pitchClass = midi % 12;
  const lookup = preferSharp ? MIDI_TO_STEP_SHARP : MIDI_TO_STEP_FLAT;
  const { step, alter } = lookup[pitchClass];
  return { step, octave, alter };
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
 * generateChordPreviewMusicXml("Cmaj7")
 * // Returns MusicXML with C4, E4, G4, B4 stacked as a chord
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

  // Calculate base note for the root in the target octave
  const baseNote = rootMidi + rootSemitone;

  // Build chord tones with spelling info
  // Each entry: { midi: number, preferSharp: boolean }
  const notesWithSpelling: { midi: number; preferSharp: boolean }[] = [];

  // Add base intervals (default spelling from chord quality)
  const noteSet = new Set(intervals);

  // Track which intervals came from sharp vs flat alterations
  const sharpIntervals = new Set<number>();
  const flatIntervals = new Set<number>();

  // Apply alterations
  if (alterations && alterations.length > 0) {
    for (const alt of alterations) {
      const altInterval = ALTERATION_INTERVALS[alt];
      if (altInterval !== undefined) {
        // Track if this is a sharp or flat alteration
        if (alt.startsWith("#")) {
          sharpIntervals.add(altInterval);
        } else if (alt.startsWith("b")) {
          flatIntervals.add(altInterval);
        }

        // Remove the natural tone if this alteration replaces it
        const replacedInterval = ALTERATION_REPLACES[alt];
        if (replacedInterval !== undefined) {
          noteSet.delete(replacedInterval);
        }
        noteSet.add(altInterval);
      }
    }
  }

  // Convert intervals to notes with spelling
  for (const interval of Array.from(noteSet).sort((a, b) => a - b)) {
    const midi = baseNote + interval;
    const preferSharp = sharpIntervals.has(interval);
    notesWithSpelling.push({ midi, preferSharp });
  }

  // Add bass note if specified (below the chord)
  if (bass) {
    const bassSemitone = ROOT_TO_SEMITONE[bass];
    let bassNote = rootMidi - 12 + bassSemitone;
    while (bassNote >= baseNote) {
      bassNote -= 12;
    }
    // Bass note spelling based on whether it has a sharp in its name
    const bassPreferSharp = bass.includes("#");
    notesWithSpelling.unshift({ midi: bassNote, preferSharp: bassPreferSharp });
  }

  if (notesWithSpelling.length === 0) {
    return null;
  }

  // Generate note XML for each chord tone
  const noteElements = notesWithSpelling.map((note, index) => {
    const pitch = midiToPitch(note.midi, note.preferSharp);
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
