/**
 * WholeNoteLessonExercise Configuration
 *
 * Defines configuration for the Whole Note lesson:
 * - Single whole note (4 beats)
 * - Ends right on the next ONE
 * - Standard phase flow: Focus Card → Listen → Sing → Imagine → Play → Feedback
 */

import { parseNoteName, noteToMidi, midiToFrequency } from "../shared";

// ============================================================================
// Types
// ============================================================================

export interface WholeNoteInfo {
  midi: number;
  frequency: number;
  noteName: string;
  letter: string;
  accidental: string;
  octave: number;
}

export interface WholeNoteFocusCard {
  title: string;
  symbol: "whole_note";
  description: string;
  cue: string;
  details: string[];
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Whole Note configuration
 * - 4 beats per note
 * - Ends on beat 5 (the next ONE)
 */
export const WHOLE_NOTE_CONFIG = {
  beatsPerNote: 4,
  noteType: "whole" as const,
  defaultTempo: 60,
  hasSubdivision: false,
  hasDronePhase: false,
} as const;

/**
 * Focus card content for the Whole Note lesson
 */
export const WHOLE_NOTE_FOCUS_CARD: WholeNoteFocusCard = {
  title: "Whole Note",
  symbol: "whole_note",
  description: "A whole note lasts for 4 beats.",
  cue: "The note ends right on the next ONE.",
  details: [
    "Count: 1 - 2 - 3 - 4 - (1)",
    'The sound stops exactly when the next "1" arrives.',
  ],
};

/**
 * Mini focus card text (shown during phases)
 */
export const WHOLE_NOTE_MINI_CARD = {
  title: "Whole Note",
  text: "4 beats → ends on next ONE",
};

// ============================================================================
// Note Generation
// ============================================================================

/**
 * Generate note info from a note name
 */
export function generateWholeNoteInfo(noteName: string): WholeNoteInfo | null {
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
 * Generate MusicXML for a single whole note
 */
export function generateWholeNoteMusicXML(
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
  const accidentalXML = `        <accidental>${accidentalName}</accidental>\n`;

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
        <duration>4</duration>
        <type>whole</type>
${accidentalXML}      </note>
    </measure>
  </part>
</score-partwise>`;
}

// ============================================================================
// Performance Analysis Thresholds
// ============================================================================

export const WHOLE_NOTE_THRESHOLDS = {
  /**
   * Must be on pitch at least 30% of the time
   */
  pitchSuccessRatio: 0.3,

  /**
   * Sustain threshold: must sound for 75%+ of each beat
   */
  sustainThreshold: 0.75,

  /**
   * Stop threshold: beat 5 should have <75% sound (silence detection delay + natural release)
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
 * Single whole note centered in measure
 */
export function getWholeNoteCursorConfig(): {
  highlightLeft: number;
  highlightWidth: number;
  highlightHeight: number;
} {
  return {
    highlightLeft: 135,
    highlightWidth: 70,
    highlightHeight: 160,
  };
}

// ============================================================================
// Export default config object for convenience
// ============================================================================

export const wholeNoteConfig = {
  ...WHOLE_NOTE_CONFIG,
  focusCard: WHOLE_NOTE_FOCUS_CARD,
  miniCard: WHOLE_NOTE_MINI_CARD,
  thresholds: WHOLE_NOTE_THRESHOLDS,
};

export default wholeNoteConfig;
