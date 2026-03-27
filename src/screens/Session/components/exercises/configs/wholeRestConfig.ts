/**
 * WholeRestLessonExercise Configuration
 *
 * Defines configuration for the Whole Rest lesson:
 * - Pattern: whole note (4 beats) → whole rest (4 beats silence) → whole note (4 beats)
 * - Total: 12 beats across 3 measures
 * - The whole rest sits BELOW the middle line (it's "heavy")
 * - Key teaching: silence has duration just like sound
 * - Standard phase flow: Focus Card → Listen → Sing → Imagine → Play → Feedback
 */

import { parseNoteName, noteToMidi, midiToFrequency } from "../shared";
import type { BeatConfig, RestThresholds } from "../shared/RestLessonTypes";

// ============================================================================
// Types
// ============================================================================

export interface WholeRestNoteInfo {
  midi: number;
  frequency: number;
  noteName: string;
  letter: string;
  accidental: string;
  octave: number;
}

export interface WholeRestFocusCard {
  title: string;
  symbol: "whole_rest";
  description: string;
  cue: string;
  details: string[];
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Whole Rest configuration
 * - 4 beats of silence
 * - Pattern is: note (4) + rest (4) + note (4) = 12 beats total
 */
export const WHOLE_REST_CONFIG = {
  beatsPerRest: 4,
  beatsPerNote: 4,
  totalBeats: 12,
  restType: "whole" as const,
  defaultTempo: 60,
  hasSubdivision: false,
  hasDronePhase: false,
  // Pattern structure for beat tracking
  measures: [
    { type: "note", startBeat: 1, endBeat: 4, shouldSound: true },
    { type: "rest", startBeat: 5, endBeat: 8, shouldSound: false },
    { type: "note", startBeat: 9, endBeat: 12, shouldSound: true },
  ],
} as const;

/**
 * Beat configuration array for useRestLessonAudio hook
 * Each beat specifies measure, beat-within-measure, and whether it should sound
 */
export const WHOLE_REST_BEATS: BeatConfig[] = [
  // Measure 1: First whole note (should sound)
  { beat: 1, measureBeat: 1, measure: 1, isNote: true },
  { beat: 2, measureBeat: 2, measure: 1, isNote: true },
  { beat: 3, measureBeat: 3, measure: 1, isNote: true },
  { beat: 4, measureBeat: 4, measure: 1, isNote: true },
  // Measure 2: Whole rest (should NOT sound)
  { beat: 5, measureBeat: 1, measure: 2, isNote: false },
  { beat: 6, measureBeat: 2, measure: 2, isNote: false },
  { beat: 7, measureBeat: 3, measure: 2, isNote: false },
  { beat: 8, measureBeat: 4, measure: 2, isNote: false },
  // Measure 3: Second whole note (should sound)
  { beat: 9, measureBeat: 1, measure: 3, isNote: true },
  { beat: 10, measureBeat: 2, measure: 3, isNote: true },
  { beat: 11, measureBeat: 3, measure: 3, isNote: true },
  { beat: 12, measureBeat: 4, measure: 3, isNote: true },
];

/**
 * Focus card content for the Whole Rest lesson
 */
export const WHOLE_REST_FOCUS_CARD: WholeRestFocusCard = {
  title: "Whole Rest",
  symbol: "whole_rest",
  description: "A whole rest lasts for 4 beats of silence.",
  cue: "The rest hangs BELOW the line because it's heavy.",
  details: [
    "Count: 1 - 2 - 3 - 4 (in silence)",
    "Same duration as a whole note, but no sound.",
    "Pattern: Note → Rest → Note",
  ],
};

/**
 * Mini focus card text (shown during phases)
 */
export const WHOLE_REST_MINI_CARD = {
  title: "Whole Rest",
  text: "4 beats of silence",
};

// ============================================================================
// Note Generation
// ============================================================================

/**
 * Generate note info from a note name
 */
export function generateWholeRestNoteInfo(
  noteName: string,
): WholeRestNoteInfo | null {
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
 * Generate MusicXML for whole note + whole rest + whole note pattern
 * Three measures in 4/4 time
 */
export function generateWholeRestPatternMusicXML(
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
        <duration>4</duration>
        <type>whole</type>
${accidentalXML}      </note>
    </measure>
    <measure number="2">
      <note>
        <rest/>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
    <measure number="3">
      <note>
        <pitch>
          <step>${parsed.letter}</step>
${alterXML}          <octave>${parsed.octave}</octave>
        </pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
  </part>
</score-partwise>`;
}

// ============================================================================
// Performance Analysis Thresholds
// ============================================================================

export const WHOLE_REST_THRESHOLDS = {
  /**
   * Must be on pitch at least 30% of the time during note measures
   */
  pitchSuccessRatio: 0.3,

  /**
   * Sustain threshold: must sound for 75%+ of each beat during notes
   */
  sustainThreshold: 0.75,

  /**
   * Rest silence threshold: should have <25% sound during rest beats
   */
  restSilenceThreshold: 0.25,

  /**
   * Pitch tolerance for singing (semitones within octave)
   */
  pitchTolerance: {
    sing: 1, // Allow wrap-around (e.g., B to C)
    play: 1, // Exact semitone match
  },
} as const;

/**
 * Hook-compatible thresholds for useRestLessonAudio
 */
export const WHOLE_REST_AUDIO_THRESHOLDS: RestThresholds = {
  sustainThreshold: WHOLE_REST_THRESHOLDS.sustainThreshold,
  silenceThreshold: WHOLE_REST_THRESHOLDS.restSilenceThreshold,
  pitchSuccessRatio: WHOLE_REST_THRESHOLDS.pitchSuccessRatio,
};

// ============================================================================
// Beat Analysis Helpers
// ============================================================================

/**
 * Determine if a beat should have sound based on measure structure
 */
export function shouldBeatHaveSound(beat: number): boolean {
  // Beats 1-4: first whole note (should sound)
  // Beats 5-8: whole rest (should NOT sound)
  // Beats 9-12: second whole note (should sound)
  if (beat >= 1 && beat <= 4) return true;
  if (beat >= 5 && beat <= 8) return false;
  if (beat >= 9 && beat <= 12) return true;
  return false;
}

/**
 * Get the measure number for a beat (1-indexed)
 */
export function getMeasureForBeat(beat: number): number {
  if (beat >= 1 && beat <= 4) return 1;
  if (beat >= 5 && beat <= 8) return 2;
  if (beat >= 9 && beat <= 12) return 3;
  return 0;
}

/**
 * Check if beat is in the rest measure
 */
export function isRestBeat(beat: number): boolean {
  return beat >= 5 && beat <= 8;
}

// ============================================================================
// Cursor Position for Notation Display
// ============================================================================

/**
 * Get cursor highlight position for notation display
 * Highlights the whole rest in measure 2
 */
export function getWholeRestCursorConfig(): {
  highlightLeft: number;
  highlightWidth: number;
  highlightHeight: number;
} {
  return {
    highlightLeft: 200, // Position of measure 2
    highlightWidth: 80,
    highlightHeight: 40,
  };
}

// ============================================================================
// Export default config object for convenience
// ============================================================================

export const wholeRestConfig = {
  ...WHOLE_REST_CONFIG,
  focusCard: WHOLE_REST_FOCUS_CARD,
  miniCard: WHOLE_REST_MINI_CARD,
  thresholds: WHOLE_REST_THRESHOLDS,
};

export default wholeRestConfig;
