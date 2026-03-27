/**
 * QuarterRestLessonExercise Configuration
 *
 * Defines configuration for the Quarter Rest lesson:
 * - Pattern: note-rest-note-rest | note-rest-note-rest (8 beats total)
 * - Odd beats (1,3,5,7) = quarter notes, Even beats (2,4,6,8) = quarter rests
 * - Total: 8 beats across 2 measures in 4/4 time
 * - The quarter rest has a squiggly "lightning bolt" shape (𝄽)
 * - Key teaching: alternating sound and silence, one beat each
 * - Standard phase flow: Focus Card → Listen → Sing → Imagine → Play → Feedback
 */

import { parseNoteName, noteToMidi, midiToFrequency } from "../shared";
import type { BeatConfig, RestThresholds } from "../shared/RestLessonTypes";

// ============================================================================
// Types
// ============================================================================

export interface QuarterRestNoteInfo {
  midi: number;
  frequency: number;
  noteName: string;
  letter: string;
  accidental: string;
  octave: number;
}

export interface QuarterRestFocusCard {
  title: string;
  symbol: "quarter_rest";
  description: string;
  cue: string;
  details: string[];
}

export interface QuarterRestBeat {
  beat: number;
  isNote: boolean;
  measureBeat: number; // 1-4 within measure
  measure: number; // 1 or 2
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Quarter Rest configuration
 * - 1 beat of silence
 * - Pattern is: note-rest-note-rest × 2 measures = 8 beats total
 */
export const QUARTER_REST_CONFIG = {
  beatsPerRest: 1,
  beatsPerNote: 1,
  totalBeats: 8,
  restType: "quarter" as const,
  defaultTempo: 60,
  hasSubdivision: true, // Shows eighth note subdivisions
  hasDronePhase: false,
  // Pattern structure for beat tracking
  beats: [
    { beat: 1, isNote: true, measureBeat: 1, measure: 1 },
    { beat: 2, isNote: false, measureBeat: 2, measure: 1 },
    { beat: 3, isNote: true, measureBeat: 3, measure: 1 },
    { beat: 4, isNote: false, measureBeat: 4, measure: 1 },
    { beat: 5, isNote: true, measureBeat: 1, measure: 2 },
    { beat: 6, isNote: false, measureBeat: 2, measure: 2 },
    { beat: 7, isNote: true, measureBeat: 3, measure: 2 },
    { beat: 8, isNote: false, measureBeat: 4, measure: 2 },
  ] as QuarterRestBeat[],
} as const;

/**
 * Focus card content for the Quarter Rest lesson
 */
export const QUARTER_REST_FOCUS_CARD: QuarterRestFocusCard = {
  title: "Quarter Rest",
  symbol: "quarter_rest",
  description: "A quarter rest = 1 beat of silence.",
  cue: 'It has a squiggly, zigzag shape. Sometimes called "lightning bolt" rest.',
  details: [
    "Count: 1 (silence)",
    "Same duration as a quarter note, but no sound.",
    "Pattern: Note-Rest-Note-Rest",
  ],
};

/**
 * Mini focus card text (shown during phases)
 */
export const QUARTER_REST_MINI_CARD = {
  title: "Quarter Rest",
  text: "1 beat of silence",
};

/**
 * Thresholds for quarter rest performance analysis
 */
export const QUARTER_REST_THRESHOLDS = {
  sustainThreshold: 0.4, // Need to be sounding on note beats
  silenceThreshold: 0.5, // Allow some spillover on rest beats
  pitchSuccessRatio: 0.3, // Minimum pitch accuracy
};

/**
 * Beat configuration array for useRestLessonAudio hook
 * Conforms to BeatConfig[] type for shared hook compatibility
 */
export const QUARTER_REST_BEATS: BeatConfig[] = [
  // Measure 1: note-rest-note-rest
  { beat: 1, measureBeat: 1, measure: 1, isNote: true },
  { beat: 2, measureBeat: 2, measure: 1, isNote: false },
  { beat: 3, measureBeat: 3, measure: 1, isNote: true },
  { beat: 4, measureBeat: 4, measure: 1, isNote: false },
  // Measure 2: note-rest-note-rest
  { beat: 5, measureBeat: 1, measure: 2, isNote: true },
  { beat: 6, measureBeat: 2, measure: 2, isNote: false },
  { beat: 7, measureBeat: 3, measure: 2, isNote: true },
  { beat: 8, measureBeat: 4, measure: 2, isNote: false },
];

/**
 * Hook-compatible thresholds for useRestLessonAudio
 */
export const QUARTER_REST_AUDIO_THRESHOLDS: RestThresholds = {
  sustainThreshold: QUARTER_REST_THRESHOLDS.sustainThreshold,
  silenceThreshold: QUARTER_REST_THRESHOLDS.silenceThreshold,
  pitchSuccessRatio: QUARTER_REST_THRESHOLDS.pitchSuccessRatio,
};

// ============================================================================
// Note Generation
// ============================================================================

/**
 * Generate note info from a note name
 */
export function generateQuarterRestNoteInfo(
  noteName: string,
): QuarterRestNoteInfo | null {
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
 * Check if a given beat (1-8) should have sound
 * Odd beats (1,3,5,7) = notes, Even beats (2,4,6,8) = rests
 */
export function shouldBeatHaveSound(beat: number): boolean {
  return beat >= 1 && beat <= 8 && beat % 2 === 1;
}

/**
 * Check if a given beat (1-8) is a rest beat
 */
export function isRestBeat(beat: number): boolean {
  return beat >= 1 && beat <= 8 && beat % 2 === 0;
}

/**
 * Get measure number for a beat (1-8)
 */
export function getMeasureForBeat(beat: number): number {
  if (beat < 1 || beat > 8) return 0;
  return beat <= 4 ? 1 : 2;
}

/**
 * Get beat within measure (1-4)
 */
export function getMeasureBeat(beat: number): number {
  if (beat < 1 || beat > 8) return 0;
  return ((beat - 1) % 4) + 1;
}

/**
 * Check if beat is an accent (beat 1 of each measure)
 */
export function isAccentBeat(beat: number): boolean {
  return beat === 1 || beat === 5;
}

// ============================================================================
// Cursor Position
// ============================================================================

/**
 * Note positions for cursor highlighting in notation display
 * 8 quarter positions: 4 in measure 1, 4 in measure 2
 * Measure 2 positions shifted right to account for bar line
 */
export function getQuarterRestCursorConfig(currentBeat: number): {
  noteIndex: number | null;
  notePositions: number[];
  highlightWidth: number;
} {
  const notePositions = [75, 105, 135, 165, 210, 240, 270, 300];
  const highlightWidth = 25;

  const noteIndex =
    currentBeat >= 1 && currentBeat <= 8 ? currentBeat - 1 : null;

  return { noteIndex, notePositions, highlightWidth };
}

// ============================================================================
// MusicXML Generation
// ============================================================================

/**
 * Generate MusicXML for alternating quarter notes and rests (8 beats)
 * Pattern: note-rest-note-rest | note-rest-note-rest
 */
export function generateQuarterRestPatternMusicXML(
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

  const quarterNote = `      <note>
        <pitch>
          <step>${parsed.letter}</step>
${alterXML}          <octave>${parsed.octave}</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
${accidentalXML}      </note>`;

  const quarterRest = `      <note>
        <rest/>
        <duration>1</duration>
        <type>quarter</type>
      </note>`;

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
${quarterNote}
${quarterRest}
${quarterNote}
${quarterRest}
    </measure>
    <measure number="2">
${quarterNote}
${quarterRest}
${quarterNote}
${quarterRest}
    </measure>
  </part>
</score-partwise>`;
}

// ============================================================================
// Performance Analysis
// ============================================================================

/**
 * Analyze performance for quarter rest pattern
 * Returns success/failure with detailed feedback
 */
export function analyzeQuarterRestPerformance(params: {
  totalSoundingCount: number;
  onPitchCount: number;
  hasHitTargetPitch: boolean;
  beatSoundPercentages: number[];
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
    hasHitTargetPitch &&
    successRatio >= QUARTER_REST_THRESHOLDS.pitchSuccessRatio;

  const { sustainThreshold, silenceThreshold } = QUARTER_REST_THRESHOLDS;

  // Odd beats (indexes 0,2,4,6 = beats 1,3,5,7) should have sound
  // Even beats (indexes 1,3,5,7 = beats 2,4,6,8) should be silent (rests)
  const noteBeatsOk =
    beatSoundPercentages[0] >= sustainThreshold &&
    beatSoundPercentages[2] >= sustainThreshold &&
    beatSoundPercentages[4] >= sustainThreshold &&
    beatSoundPercentages[6] >= sustainThreshold;

  const restBeatsOk =
    beatSoundPercentages[1] < silenceThreshold &&
    beatSoundPercentages[3] < silenceThreshold &&
    beatSoundPercentages[5] < silenceThreshold &&
    beatSoundPercentages[7] < silenceThreshold;

  const rhythmOk = !startedEarly && noteBeatsOk && restBeatsOk;

  const success = pitchOk && rhythmOk;

  let message = "Great!";
  if (!pitchOk && !rhythmOk) {
    message = "Try to match the pitch and follow the rhythm";
  } else if (!pitchOk) {
    message = "Good rhythm! Try to match the pitch better";
  } else if (startedEarly) {
    message = "Wait for beat ONE to start";
  } else if (!noteBeatsOk) {
    message = "Play on beats 1, 3, 5, 7 (the notes)";
  } else if (!restBeatsOk) {
    message = "Be silent on beats 2, 4, 6, 8 (the rests)";
  }

  return { success, pitchOk, rhythmOk, message };
}

// ============================================================================
// Config Object Export
// ============================================================================

/**
 * Unified config object for imports
 */
export const quarterRestConfig = {
  QUARTER_REST_CONFIG,
  QUARTER_REST_FOCUS_CARD,
  QUARTER_REST_MINI_CARD,
  QUARTER_REST_THRESHOLDS,
  generateQuarterRestNoteInfo,
  generateQuarterRestPatternMusicXML,
  getQuarterRestCursorConfig,
  shouldBeatHaveSound,
  isRestBeat,
  getMeasureForBeat,
  getMeasureBeat,
  isAccentBeat,
  analyzeQuarterRestPerformance,
};

export default quarterRestConfig;
