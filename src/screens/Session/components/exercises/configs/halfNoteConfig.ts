/**
 * HalfNoteLessonExercise Configuration
 *
 * Defines configuration for the Half Note lesson:
 * - Single half note (2 beats)
 * - Has a stem (any note less than a whole note has a stem)
 * - Still has a hollow note head (like whole note)
 * - Ends right on beat 3
 * - Standard phase flow: Focus Card → Listen → Sing → Imagine → Play → Feedback
 */

import { parseNoteName, noteToMidi, midiToFrequency } from "../shared";

// ============================================================================
// Types
// ============================================================================

export interface HalfNoteInfo {
  midi: number;
  frequency: number;
  noteName: string;
  letter: string;
  accidental: string;
  octave: number;
}

export interface HalfNoteFocusCard {
  title: string;
  symbol: "half_note";
  description: string;
  cue: string;
  details: string[];
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Half Note configuration
 * - 2 beats per note
 * - Ends on beat 3 (when next half note would start)
 */
export const HALF_NOTE_CONFIG = {
  beatsPerNote: 2,
  noteType: "half" as const,
  defaultTempo: 60,
  hasSubdivision: false,
  hasDronePhase: false,
} as const;

/**
 * Focus card content for the Half Note lesson
 */
export const HALF_NOTE_FOCUS_CARD: HalfNoteFocusCard = {
  title: "Half Note",
  symbol: "half_note",
  description: "A half note lasts for 2 beats.",
  cue: "The note ends right on beat 3.",
  details: [
    "Count: 1 - 2 - (3)",
    "Has a stem, but still has a hollow note head.",
  ],
};

/**
 * Mini focus card text (shown during phases)
 */
export const HALF_NOTE_MINI_CARD = {
  title: "Half Note",
  text: "2 beats → ends on beat 3",
};

// ============================================================================
// Note Generation
// ============================================================================

/**
 * Generate note info from a note name
 */
export function generateHalfNoteInfo(noteName: string): HalfNoteInfo | null {
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
 * Generate MusicXML for a single half note (with half rest to fill measure)
 */
export function generateHalfNoteMusicXML(
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
        <divisions>2</divisions>
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
        <type>half</type>
${accidentalXML}      </note>
      <note>
        <rest/>
        <duration>4</duration>
        <type>half</type>
      </note>
    </measure>
  </part>
</score-partwise>`;
}

// ============================================================================
// Performance Analysis Thresholds
// ============================================================================

export const HALF_NOTE_THRESHOLDS = {
  /**
   * Must be on pitch at least 30% of the time
   */
  pitchSuccessRatio: 0.3,

  /**
   * Sustain threshold: must sound for 75%+ of each beat
   */
  sustainThreshold: 0.75,

  /**
   * Stop threshold: beat 3 should have <75% sound (silence detection delay + natural release)
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
 * Half note positioned in first half of measure
 */
export function getHalfNoteCursorConfig(): {
  highlightLeft: number;
  highlightWidth: number;
  highlightHeight: number;
} {
  return {
    highlightLeft: 100,
    highlightWidth: 60,
    highlightHeight: 160,
  };
}

// ============================================================================
// Export default config object for convenience
// ============================================================================

export const halfNoteConfig = {
  ...HALF_NOTE_CONFIG,
  focusCard: HALF_NOTE_FOCUS_CARD,
  miniCard: HALF_NOTE_MINI_CARD,
  thresholds: HALF_NOTE_THRESHOLDS,
};

export default halfNoteConfig;
