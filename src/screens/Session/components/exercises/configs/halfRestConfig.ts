/**
 * HalfRestLessonExercise Configuration
 *
 * Defines configuration for the Half Rest lesson:
 * - Pattern: half note (2 beats) → half rest (2 beats) → half note (2 beats) → end
 * - Total: 8 beats across 2 measures in 4/4 time
 * - M1: beats 1-2 = half note, beats 3-4 = half rest
 * - M2: beats 5-6 = half note, beat 7 = end marker
 * - The half rest sits ON TOP of the middle line (like a hat)
 * - Mnemonic: "Half rest HAT sits on top" vs "Whole rest HOLE hangs below"
 * - Standard phase flow: Focus Card → Listen → Sing → Imagine → Play → Feedback
 */

import { parseNoteName, noteToMidi, midiToFrequency } from "../shared";
import type { BeatConfig, RestThresholds } from "../shared/RestLessonTypes";

// ============================================================================
// Types
// ============================================================================

export interface HalfRestNoteInfo {
  midi: number;
  frequency: number;
  noteName: string;
  letter: string;
  accidental: string;
  octave: number;
}

export interface HalfRestFocusCard {
  title: string;
  symbol: "half_rest";
  description: string;
  cue: string;
  details: string[];
}

export interface HalfRestBeat {
  beat: number; // 1-8 absolute beat
  measureBeat: number; // 1-4 within measure
  measure: number; // 1 or 2
  isNote: boolean; // true for sound, false for rest
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Half Rest configuration
 * - 2 beats of silence
 * - Pattern is: half note (2) + half rest (2) + half note (2) + end = 7 beats
 */
export const HALF_REST_CONFIG = {
  beatsPerRest: 2,
  beatsPerNote: 2,
  totalBeats: 7, // Actually 6 beats of pattern + 1 end marker
  restType: "half" as const,
  defaultTempo: 60,
  hasSubdivision: false,
  hasDronePhase: false,
  // Pattern structure for beat tracking
  beats: [
    { beat: 1, measureBeat: 1, measure: 1, isNote: true },
    { beat: 2, measureBeat: 2, measure: 1, isNote: true },
    { beat: 3, measureBeat: 3, measure: 1, isNote: false }, // rest
    { beat: 4, measureBeat: 4, measure: 1, isNote: false }, // rest
    { beat: 5, measureBeat: 1, measure: 2, isNote: true },
    { beat: 6, measureBeat: 2, measure: 2, isNote: true },
    { beat: 7, measureBeat: 3, measure: 2, isNote: false }, // end
  ] as HalfRestBeat[],
} as const;

/**
 * Focus card content for the Half Rest lesson
 */
export const HALF_REST_FOCUS_CARD: HalfRestFocusCard = {
  title: "Half Rest",
  symbol: "half_rest",
  description: "A half rest = 2 beats of silence.",
  cue: 'It sits ON TOP of the line like a "hat."',
  details: [
    "Count: 1 - 2 (in silence)",
    "Same duration as a half note, but no sound.",
    'Mnemonic: "Half rest HAT sits on top"',
  ],
};

/**
 * Mini focus card text (shown during phases)
 */
export const HALF_REST_MINI_CARD = {
  title: "Half Rest",
  text: "2 beats of silence",
};

/**
 * Thresholds for half rest performance analysis
 */
export const HALF_REST_THRESHOLDS = {
  sustainThreshold: 0.75, // Need to sustain notes for full duration
  silenceThreshold: 0.4, // Allow some decay/room echo
  pitchSuccessRatio: 0.3, // Minimum pitch accuracy
};

/**
 * Beat configuration array for useRestLessonAudio hook
 * Conforms to BeatConfig[] type for shared hook compatibility
 *
 * Pattern: half note (beats 1-2) → half rest (beats 3-4) → half note (beats 5-6) → end (beat 7)
 */
export const HALF_REST_BEATS: BeatConfig[] = [
  // Measure 1: half note (2 beats) + half rest (2 beats)
  { beat: 1, measureBeat: 1, measure: 1, isNote: true },
  { beat: 2, measureBeat: 2, measure: 1, isNote: true },
  { beat: 3, measureBeat: 3, measure: 1, isNote: false }, // rest
  { beat: 4, measureBeat: 4, measure: 1, isNote: false }, // rest
  // Measure 2: half note (2 beats) + end marker
  { beat: 5, measureBeat: 1, measure: 2, isNote: true },
  { beat: 6, measureBeat: 2, measure: 2, isNote: true },
  { beat: 7, measureBeat: 3, measure: 2, isNote: false }, // end marker
];

/**
 * Hook-compatible thresholds for useRestLessonAudio
 */
export const HALF_REST_AUDIO_THRESHOLDS: RestThresholds = {
  sustainThreshold: HALF_REST_THRESHOLDS.sustainThreshold,
  silenceThreshold: HALF_REST_THRESHOLDS.silenceThreshold,
  pitchSuccessRatio: HALF_REST_THRESHOLDS.pitchSuccessRatio,
};

// ============================================================================
// Note Generation
// ============================================================================

/**
 * Generate note info from a note name
 */
export function generateHalfRestNoteInfo(
  noteName: string,
): HalfRestNoteInfo | null {
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
// Beat Helpers
// ============================================================================

/**
 * Check if a given beat (1-7) should have sound
 * Beats 1-2 = note (sound), beats 3-4 = rest (silent)
 * Beats 5-6 = note (sound), beat 7 = end (silent)
 */
export function shouldBeatHaveSound(beat: number): boolean {
  if (beat < 1 || beat > 7) return false;
  return beat === 1 || beat === 2 || beat === 5 || beat === 6;
}

/**
 * Check if a given beat (1-7) is a rest beat
 */
export function isRestBeat(beat: number): boolean {
  return beat === 3 || beat === 4;
}

/**
 * Get measure number for a beat (1-7)
 */
export function getMeasureForBeat(beat: number): number {
  if (beat < 1 || beat > 7) return 0;
  return beat <= 4 ? 1 : 2;
}

/**
 * Get beat within measure (1-4)
 */
export function getMeasureBeat(beat: number): number {
  if (beat < 1 || beat > 7) return 0;
  return beat <= 4 ? beat : beat - 4;
}

/**
 * Check if beat is an accent (beat 1 of each measure)
 */
export function isAccentBeat(beat: number): boolean {
  return beat === 1 || beat === 5;
}

/**
 * Check if beat is the end marker
 */
export function isEndBeat(beat: number): boolean {
  return beat === 7;
}

// ============================================================================
// Cursor Position
// ============================================================================

/**
 * Note positions for cursor highlighting in notation display
 * 4 half-note positions: measure 1 (note, rest), measure 2 (note, rest)
 */
export function getHalfRestCursorConfig(
  currentBeat: number,
  currentMeasure: number,
): {
  noteIndex: number | null;
  notePositions: number[];
  highlightWidth: number;
} {
  const notePositions = [75, 135, 195, 255]; // 4 half-note/rest positions
  const highlightWidth = 50;

  // Calculate index: (measure-1)*2 + floor((measureBeat-1)/2)
  const measureBeat = currentBeat <= 4 ? currentBeat : currentBeat - 4;
  const noteIndex =
    currentBeat >= 1 && currentBeat <= 6
      ? (currentMeasure - 1) * 2 + Math.floor((measureBeat - 1) / 2)
      : null;

  return { noteIndex, notePositions, highlightWidth };
}

// ============================================================================
// MusicXML Generation
// ============================================================================

/**
 * Generate MusicXML for half note → half rest → half note → half rest pattern
 * Two measures in 4/4 time
 */
export function generateHalfRestPatternMusicXML(
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
    <measure number="2">
      <note>
        <pitch>
          <step>${parsed.letter}</step>
${alterXML}          <octave>${parsed.octave}</octave>
        </pitch>
        <duration>4</duration>
        <type>half</type>
      </note>
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
// Performance Analysis
// ============================================================================

/**
 * Analyze performance for half rest pattern
 * Returns success/failure with detailed feedback
 */
export function analyzeHalfRestPerformance(params: {
  totalSoundingCount: number;
  onPitchCount: number;
  hasHitTargetPitch: boolean;
  beatSoundPercentages: number[]; // Array of 7 elements (beats 1-7)
  startedEarly: boolean;
}): {
  success: boolean;
  pitchOk: boolean;
  rhythmOk: boolean;
  message: string;
} {
  const {
    totalSoundingCount,
    onPitchCount,
    hasHitTargetPitch,
    beatSoundPercentages,
    startedEarly,
  } = params;

  if (totalSoundingCount === 0) {
    return {
      success: false,
      pitchOk: false,
      rhythmOk: false,
      message: "No sound detected",
    };
  }

  const successRatio = onPitchCount / totalSoundingCount;
  const pitchOk =
    hasHitTargetPitch && successRatio >= HALF_REST_THRESHOLDS.pitchSuccessRatio;

  const { sustainThreshold, silenceThreshold } = HALF_REST_THRESHOLDS;

  // Pattern: half note (1-2), half rest (3-4), half note (5-6), end on 7
  // Beats 1,2 should have sound
  const firstNoteSustained =
    beatSoundPercentages[0] >= sustainThreshold &&
    beatSoundPercentages[1] >= sustainThreshold;

  // Beats 3,4 should be silent (rest)
  const restWasSilent =
    beatSoundPercentages[2] < silenceThreshold &&
    beatSoundPercentages[3] < silenceThreshold;

  // Beats 5,6 should have sound
  const secondNoteSustained =
    beatSoundPercentages[4] >= sustainThreshold &&
    beatSoundPercentages[5] >= sustainThreshold;

  // Beat 7 should be silent (end)
  const stoppedOnNextOne = beatSoundPercentages[6] < silenceThreshold;

  const rhythmOk =
    !startedEarly &&
    firstNoteSustained &&
    restWasSilent &&
    secondNoteSustained &&
    stoppedOnNextOne;

  const success = pitchOk && rhythmOk;

  let message = "Great!";
  if (!pitchOk && !rhythmOk) {
    message = "Try to match the pitch and follow the rhythm";
  } else if (!pitchOk) {
    message = "Good rhythm! Try to match the pitch better";
  } else if (startedEarly) {
    message = "Wait for beat ONE to start";
  } else if (!firstNoteSustained) {
    message = "Hold the first half note for 2 full beats";
  } else if (!restWasSilent) {
    message = "Be silent during the half rest (beats 3-4)";
  } else if (!secondNoteSustained) {
    message = "Hold the second half note for 2 full beats";
  } else if (!stoppedOnNextOne) {
    message = "Stop at beat 3 of measure 2";
  }

  return { success, pitchOk, rhythmOk, message };
}

// ============================================================================
// Config Object Export
// ============================================================================

/**
 * Unified config object for imports
 */
export const halfRestConfig = {
  HALF_REST_CONFIG,
  HALF_REST_FOCUS_CARD,
  HALF_REST_MINI_CARD,
  HALF_REST_THRESHOLDS,
  generateHalfRestNoteInfo,
  generateHalfRestPatternMusicXML,
  getHalfRestCursorConfig,
  shouldBeatHaveSound,
  isRestBeat,
  getMeasureForBeat,
  getMeasureBeat,
  isAccentBeat,
  isEndBeat,
  analyzeHalfRestPerformance,
};

export default halfRestConfig;
