/**
 * Practice Over Changes Types - Types for practice over chord changes feature
 *
 * Extracted from tuneComposerTypes.ts for maintainability.
 * This feature allows generating scale/arpeggio content over chord progressions.
 */

// =============================================================================
// Practice Content Types
// =============================================================================

/** Content types for practice over chord changes */
export type PracticeContentType = "scales" | "arpeggios" | "guide_tones";

/** Labels for practice content types */
export const PRACTICE_CONTENT_TYPE_LABELS: Record<PracticeContentType, string> =
  {
    scales: "Scales",
    arpeggios: "Arpeggios",
    guide_tones: "Guide Tones",
  };

/** All practice content types */
export const PRACTICE_CONTENT_TYPES: readonly PracticeContentType[] = [
  "scales",
  "arpeggios",
  "guide_tones",
] as const;

// =============================================================================
// Generated Content Types
// =============================================================================

/**
 * A pitch event from generated content.
 * Mirrors the backend PitchEvent schema.
 */
export interface GeneratedPitchEvent {
  /** MIDI note number (0-127), null for rests */
  midi_note: number | null;
  /** Pitch name with octave (e.g., 'C4', 'F#5') or 'rest' */
  pitch_name: string;
  /** Duration in beats (quarter note = 1.0) */
  duration_beats: number;
  /** Offset from start in beats */
  offset_beats: number;
  /** MIDI velocity (1-127), 0 for rests */
  velocity: number;
  /** Whether this is a rest event */
  is_rest?: boolean;
}

/**
 * A segment of generated content for a single chord.
 */
export interface GeneratedChordSegment {
  /** The chord symbol this segment is for */
  chord_symbol: string;
  /** Scale type used for this chord (for scales content_type) */
  scale_used?: string;
  /** Duration of this segment in beats */
  duration_beats: number;
  /** Pitch events in this segment */
  events: GeneratedPitchEvent[];
}

// =============================================================================
// Practice Over Changes State
// =============================================================================

/**
 * State for practice over changes mode.
 * Stores generation parameters and results.
 */
export interface PracticeOverChangesState {
  /** Whether practice over changes mode is active */
  isActive: boolean;
  /** Type of content to generate */
  contentType: PracticeContentType;
  /** Pattern algorithm (scale or arpeggio pattern) */
  pattern: string | null;
  /** Rhythm template */
  rhythm: string;
  /** Tempo override (null = use tune tempo) */
  tempoOverride: number | null;
  /** Lowest playable MIDI note */
  rangeLowMidi: number;
  /** Highest playable MIDI note */
  rangeHighMidi: number;
  /** Whether generation is in progress */
  isGenerating: boolean;
  /** Error message if generation failed */
  error: string | null;
  /** Generated content segments (per chord) */
  segments: GeneratedChordSegment[];
  /** All generated pitch events in order */
  events: GeneratedPitchEvent[];
  /** Total duration in beats */
  totalBeats: number;
}

// =============================================================================
// Constants
// =============================================================================

/** Default range values (C3 to C6) */
export const DEFAULT_PRACTICE_RANGE = {
  low: 48, // C3
  high: 84, // C6
} as const;

/** Default practice over changes state */
export const DEFAULT_PRACTICE_OVER_CHANGES_STATE: PracticeOverChangesState = {
  isActive: false,
  contentType: "scales",
  pattern: null,
  rhythm: "quarter_notes",
  tempoOverride: null,
  rangeLowMidi: DEFAULT_PRACTICE_RANGE.low,
  rangeHighMidi: DEFAULT_PRACTICE_RANGE.high,
  isGenerating: false,
  error: null,
  segments: [],
  events: [],
  totalBeats: 0,
};

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a new practice over changes state with optional overrides.
 */
export function createPracticeOverChangesState(
  overrides?: Partial<PracticeOverChangesState>,
): PracticeOverChangesState {
  return {
    ...DEFAULT_PRACTICE_OVER_CHANGES_STATE,
    ...overrides,
  };
}
