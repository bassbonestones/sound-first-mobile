/**
 * RestLessonTypes - Unified types for Rest lesson exercises
 *
 * Enables consolidation of QuarterRest, HalfRest, and WholeRest exercises
 * into a single configurable component while maintaining type safety.
 */

// ============================================================================
// Core Beat Structure
// ============================================================================

/** Type of rest being taught */
export type RestType = "quarter" | "half" | "whole";

/** Configuration for a single beat in the pattern */
export interface BeatConfig {
  /** Absolute beat number (1-based) */
  beat: number;
  /** Beat within the measure (1-4 for 4/4 time) */
  measureBeat: number;
  /** Measure number (1-based) */
  measure: number;
  /** Whether this beat should have sound (true = note, false = rest) */
  isNote: boolean;
}

/** Note information for the exercise */
export interface RestLessonNoteInfo {
  midi: number;
  frequency: number;
  noteName: string;
  letter: string;
  accidental: string;
  octave: number;
}

// ============================================================================
// Focus Card Content
// ============================================================================

/** Symbol type for focus card display */
export type RestSymbolType = "quarter_rest" | "half_rest" | "whole_rest";

/** Content for the focus card phase */
export interface RestFocusCard {
  /** Category for capability tracking */
  category: "rhythm";
  /** Display name (e.g., "Quarter Rest") */
  name: string;
  /** Main teaching point */
  description: string;
  /** Memory cue for the rest */
  cue: string;
  /** Symbol type for rendering */
  symbol: RestSymbolType;
  /** Additional details shown on focus card */
  details?: string[];
}

/** Mini card content shown during phases */
export interface RestMiniCard {
  title: string;
  text: string;
}

// ============================================================================
// Thresholds
// ============================================================================

/** Performance thresholds for analysis */
export interface RestThresholds {
  /** Minimum ratio of samples sounding on note beats (0-1) */
  sustainThreshold: number;
  /** Maximum ratio of samples sounding on rest beats (0-1) */
  silenceThreshold: number;
  /** Minimum pitch accuracy ratio (0-1) */
  pitchSuccessRatio: number;
}

// ============================================================================
// Notation Display
// ============================================================================

/** Cursor/highlight configuration for notation display */
export interface RestNotationConfig {
  /** Width of the notation display */
  width: number;
  /** Height of the notation display */
  height: number;
  /** Horizontal positions for each beat highlight */
  highlightPositions: number[];
  /** Width of each highlight */
  highlightWidth: number;
}

// ============================================================================
// Phase Instructions
// ============================================================================

/** Instructions shown during each phase */
export interface RestPhaseInstructions {
  listen: {
    title: string;
    instruction: string;
  };
  sing: {
    title: string;
    instruction: string;
    resultsSuccess: string;
    resultsNeedsSing: string;
    resultsNeedsSilence: string;
    resultsNeedsPitch: string;
  };
  imagine: {
    title: string;
    instruction: string;
    feedbackSuccess: string;
    feedbackFailure: string;
  };
  play: {
    title: string;
    instruction: string;
    resultsSuccess: string;
    resultsNeedsSilence: string;
    resultsNeedsPitch: string;
  };
}

// ============================================================================
// Main Configuration
// ============================================================================

/** Complete configuration for a Rest lesson exercise */
export interface RestLessonConfig {
  /** Type of rest (quarter, half, whole) */
  restType: RestType;

  /** Number of beats the rest lasts */
  beatsPerRest: number;

  /** Number of beats for each note in the pattern */
  beatsPerNote: number;

  /** Total beats in the pattern (excluding count-in) */
  totalBeats: number;

  /** Number of measures in the pattern */
  totalMeasures: number;

  /** Beat pattern configuration */
  beats: BeatConfig[];

  /** Default tempo in BPM */
  defaultTempo: number;

  /** Whether to show eighth note subdivisions */
  hasSubdivision: boolean;

  /** Focus card content */
  focusCard: RestFocusCard;

  /** Mini card content */
  miniCard: RestMiniCard;

  /** Performance thresholds */
  thresholds: RestThresholds;

  /** Notation display configuration */
  notation: RestNotationConfig;

  /** Phase instructions */
  instructions: RestPhaseInstructions;

  /** MusicXML generator function */
  generateMusicXML: (
    noteName: string,
    clef: "treble" | "bass",
  ) => string | null;
}

// ============================================================================
// Default Instructions (can be customized per exercise)
// ============================================================================

/**
 * Generate default phase instructions for a rest type
 */
export function getDefaultInstructions(
  restType: RestType,
  beatsPerRest: number,
): RestPhaseInstructions {
  const restName =
    restType === "quarter"
      ? "Quarter Rest"
      : restType === "half"
        ? "Half Rest"
        : "Whole Rest";

  const beatText = beatsPerRest === 1 ? "beat" : "beats";

  return {
    listen: {
      title: "Listen to the Pattern",
      instruction: `Listen for the ${beatsPerRest} ${beatText} of silence — the ${restName}.`,
    },
    sing: {
      title: "Sing Along",
      instruction: `Sing the notes out loud, but STAY SILENT during the ${restName}.`,
      resultsSuccess: `Great job! You sang the notes and stayed silent during the ${restName}!`,
      resultsNeedsSing:
        "Try sustaining the notes more. Sing through each note beat.",
      resultsNeedsSilence: `Stay silent during the ${restName}! Count the ${beatsPerRest} ${beatText} in your head.`,
      resultsNeedsPitch:
        "Focus on matching the pitch. Listen carefully and try again.",
    },
    imagine: {
      title: "Imagine the Sound",
      instruction: `Hear the pattern in your mind. When does the ${restName} happen?`,
      feedbackSuccess: "You correctly identified the rest!",
      feedbackFailure: "Not quite — try listening again.",
    },
    play: {
      title: "Play the Pattern",
      instruction: `Play the notes on your instrument and STAY SILENT during the ${restName}.`,
      resultsSuccess: `Excellent! You played the notes and observed the ${restName}!`,
      resultsNeedsSilence: `Remember to stay silent during the ${restName}!`,
      resultsNeedsPitch:
        "Focus on pitch accuracy. Listen and match the target note.",
    },
  };
}
