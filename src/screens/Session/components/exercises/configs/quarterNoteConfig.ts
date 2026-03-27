/**
 * QuarterNoteLessonExercise Configuration
 *
 * Defines configuration for the Quarter Note lesson:
 * - Single quarter note (1 beat)
 * - Has a stem (like half note)
 * - Note head is FILLED/SOLID (not hollow like whole/half)
 * - Ends right on beat 2
 * - Standard phase flow: Focus Card → Listen → Sing → Imagine → Play → Feedback
 */

import { parseNoteName, noteToMidi, midiToFrequency } from "../shared";

// ============================================================================
// Types
// ============================================================================

export interface QuarterNoteInfo {
  midi: number;
  frequency: number;
  noteName: string;
  letter: string;
  accidental: string;
  octave: number;
}

export interface QuarterNoteFocusCard {
  title: string;
  symbol: "quarter_note";
  description: string;
  cue: string;
  details: string[];
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Quarter Note configuration
 * - 1 beat per note
 * - Ends on beat 2 (when next quarter note would start)
 */
export const QUARTER_NOTE_CONFIG = {
  beatsPerNote: 1,
  noteType: "quarter" as const,
  defaultTempo: 60,
  hasSubdivision: false,
  hasDronePhase: false,
} as const;

/**
 * Focus card content for the Quarter Note lesson
 */
export const QUARTER_NOTE_FOCUS_CARD: QuarterNoteFocusCard = {
  title: "Quarter Note",
  symbol: "quarter_note",
  description: "A quarter note lasts for 1 beat.",
  cue: "The note ends right on beat 2.",
  details: ["Count: 1 - (2)", "Has a stem with a filled (solid) note head."],
};

/**
 * Mini focus card text (shown during phases)
 */
export const QUARTER_NOTE_MINI_CARD = {
  title: "Quarter Note",
  text: "1 beat → ends on beat 2",
};

// ============================================================================
// Note Generation
// ============================================================================

/**
 * Generate note info from a note name
 */
export function generateQuarterNoteInfo(
  noteName: string,
): QuarterNoteInfo | null {
  const parsed = parseNoteName(noteName);
  if (!parsed) return null;

  const midi = noteToMidi(noteName);
  const frequency = midiToFrequency(midi);

  return {
    midi,
    frequency,
    noteName,
    letter: parsed.letter,
    accidental: parsed.accidental ?? "",
    octave: parsed.octave,
  };
}

// ============================================================================
// MusicXML Generation
// ============================================================================

/**
 * Generate MusicXML for a single quarter note (with 3 quarter rests to fill measure)
 */
export function generateQuarterNoteMusicXML(
  noteName: string,
  clef: "treble" | "bass" = "treble",
): string | null {
  const parsed = parseNoteName(noteName);
  if (!parsed) return null;

  let alter = 0;
  let accidentalName = "natural";
  if (parsed.accidental === "b") {
    alter = -1;
    accidentalName = "flat";
  } else if (parsed.accidental === "#") {
    alter = 1;
    accidentalName = "sharp";
  }

  const clefSign = clef === "bass" ? "F" : "G";
  const clefLine = clef === "bass" ? "4" : "2";
  const alterXML = alter !== 0 ? `        <alter>${alter}</alter>\n` : "";
  const accidentalXML =
    alter !== 0 ? `        <accidental>${accidentalName}</accidental>\n` : "";

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
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <key>
          <fifths>0</fifths>
        </key>
        <clef>
          <sign>${clefSign}</sign>
          <line>${clefLine}</line>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>${parsed.letter}</step>
${alterXML}          <octave>${parsed.octave}</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
${accidentalXML}      </note>
      <note>
        <rest/>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <rest/>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <rest/>
        <duration>1</duration>
        <type>quarter</type>
      </note>
    </measure>
  </part>
</score-partwise>`;
}

// ============================================================================
// Performance Analysis Thresholds
// ============================================================================

export const QUARTER_NOTE_THRESHOLDS = {
  /**
   * Must be on pitch at least 30% of the time
   */
  pitchSuccessRatio: 0.3,

  /**
   * Sustain threshold: must sound for 75%+ of the beat
   */
  sustainThreshold: 0.75,

  /**
   * Stop threshold: beat 2 should have <75% sound (silence detection delay + natural release)
   */
  stopThreshold: 0.75,

  /**
   * Pitch tolerance for singing (semitones within octave)
   */
  pitchTolerance: {
    sing: 1, // Allow wrap-around (e.g., B to C)
    play: 1, // Exact semitone match
  },
} as const;

// ============================================================================
// Cursor Position for Notation Display
// ============================================================================

/**
 * Get cursor highlight position for notation display
 * Quarter note positioned at start of measure
 */
export function getQuarterNoteCursorConfig(): {
  highlightLeft: number;
  highlightWidth: number;
  highlightHeight: number;
} {
  return {
    highlightLeft: 100,
    highlightWidth: 40,
    highlightHeight: 160,
  };
}

// ============================================================================
// Export default config object for convenience
// ============================================================================

export const quarterNoteConfig = {
  ...QUARTER_NOTE_CONFIG,
  focusCard: QUARTER_NOTE_FOCUS_CARD,
  miniCard: QUARTER_NOTE_MINI_CARD,
  thresholds: QUARTER_NOTE_THRESHOLDS,
};

export default quarterNoteConfig;
