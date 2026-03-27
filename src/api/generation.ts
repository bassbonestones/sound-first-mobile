/**
 * Generation API Client
 *
 * API client for the music content generation endpoints.
 * Generates scales, arpeggios, and licks with customizable parameters.
 */

import { api, baseUrl } from "./client";

// =============================================================================
// Enums (string literals matching backend)
// =============================================================================

/** Type of musical content to generate */
export type GenerationType = "scale" | "arpeggio" | "lick";

/** Scale types supported by the generation engine */
export type ScaleType =
  // Major modes
  | "ionian"
  | "dorian"
  | "phrygian"
  | "lydian"
  | "mixolydian"
  | "aeolian"
  | "locrian"
  // Harmonic minor modes
  | "harmonic_minor"
  | "locrian_nat6"
  | "ionian_aug"
  | "dorian_sharp4"
  | "phrygian_dominant"
  | "lydian_sharp2"
  | "super_locrian_bb7"
  // Melodic minor modes
  | "melodic_minor"
  | "melodic_minor_classical"
  | "dorian_flat2"
  | "lydian_augmented"
  | "lydian_dominant"
  | "mixolydian_flat6"
  | "locrian_nat2"
  | "altered"
  // Harmonic major modes
  | "harmonic_major"
  | "dorian_flat5"
  | "phrygian_flat4"
  | "lydian_flat3"
  | "mixolydian_flat2"
  | "lydian_aug_sharp2"
  | "locrian_double_flat7"
  // Pentatonic and blues
  | "pentatonic_major"
  | "pentatonic_minor"
  | "blues"
  | "blues_major"
  // Symmetric
  | "whole_tone"
  | "diminished_hw"
  | "diminished_wh"
  | "chromatic"
  // Bebop
  | "bebop_dominant"
  | "bebop_major"
  | "bebop_dorian";

/** Arpeggio types supported by the generation engine */
export type ArpeggioType =
  // Triads
  | "major"
  | "minor"
  | "augmented"
  | "diminished"
  | "sus4"
  | "sus2"
  // 7th chords
  | "maj7"
  | "dom7"
  | "min7"
  | "min_maj7"
  | "half_dim7"
  | "dim7"
  | "aug_maj7"
  | "aug7"
  | "dom7sus4"
  // Extended
  | "maj9"
  | "dom9"
  | "min9"
  | "maj11"
  | "dom11"
  | "min11"
  | "maj13"
  | "dom13"
  // Altered dominants
  | "dom7b9"
  | "dom7sharp9"
  | "dom7sharp11"
  | "dom7b13"
  | "dom7alt";

/** Scale pattern algorithms */
export type ScalePattern =
  // Basic
  | "straight_up"
  | "straight_down"
  | "straight_up_down"
  | "straight_down_up"
  // Pyramid
  | "pyramid_ascend"
  | "pyramid_descend"
  // Intervals (diatonic through octave, extended for chromatic)
  | "in_3rds"
  | "in_4ths"
  | "in_5ths"
  | "in_6ths"
  | "in_7ths"
  | "in_8ths"
  | "in_octaves"
  | "in_9ths"
  | "in_10ths"
  | "in_11ths"
  | "in_12ths"
  | "in_13ths"
  // Groups
  | "groups_of_3"
  | "groups_of_4"
  | "groups_of_5"
  | "groups_of_6"
  | "groups_of_7"
  | "groups_of_8"
  | "groups_of_9"
  | "groups_of_10"
  | "groups_of_11"
  | "groups_of_12"
  // Weaving
  | "broken_thirds_neighbor"
  // Arpeggio-based
  | "diatonic_triads"
  | "diatonic_7ths"
  | "broken_chords";

/** Arpeggio pattern algorithms */
export type ArpeggioPattern =
  | "straight_up"
  | "straight_down"
  | "straight_up_down"
  | "weaving_ascend"
  | "weaving_descend"
  | "broken_skip_1"
  | "inversion_root"
  | "inversion_1st"
  | "inversion_2nd"
  | "inversion_3rd"
  | "rolling_alberti"
  | "spread_voicings"
  | "approach_notes"
  | "enclosures"
  | "diatonic_sequence"
  | "circle_4ths"
  | "circle_5ths"
  | "bebop";

/** Rhythm/duration templates */
export type RhythmType =
  | "whole_notes"
  | "half_notes"
  | "quarter_notes"
  | "eighth_notes"
  | "sixteenth_notes"
  | "eighth_triplets"
  | "swing_eighths"
  | "scotch_snap"
  | "dotted_quarter_eighth"
  | "dotted_eighth_sixteenth"
  | "sixteenth_eighth_sixteenth"
  | "eighth_sixteenth_sixteenth"
  | "sixteenth_sixteenth_eighth"
  | "syncopated";

/** Dynamic contour options */
export type DynamicType =
  | "none"
  | "crescendo"
  | "decrescendo"
  | "terraced"
  | "accented"
  | "hairpin";

/** Articulation options */
export type ArticulationType =
  | "legato"
  | "staccato"
  | "tenuto"
  | "accent"
  | "marcato"
  | "mixed";

/** Musical keys */
export type MusicalKey =
  | "C"
  | "Db"
  | "D"
  | "Eb"
  | "E"
  | "F"
  | "F#"
  | "Gb"
  | "G"
  | "Ab"
  | "A"
  | "Bb"
  | "B"
  | "C#";

// =============================================================================
// Request/Response Types
// =============================================================================

/** A single pitch event in the generated content */
export interface PitchEvent {
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
  /** Articulation marking for this note */
  articulation?: ArticulationType | null;
  /** Whether this is a rest event */
  is_rest?: boolean;
}

/** Request model for generating musical content */
export interface GenerationRequest {
  /** Type of musical content: scale, arpeggio, or lick */
  content_type: GenerationType;
  /** Scale type, arpeggio type, or lick ID */
  definition: string;
  /** Desired number of octaves (1, 2, or 3) */
  octaves?: 1 | 2 | 3;
  /** Lowest playable MIDI note */
  range_low_midi?: number;
  /** Highest playable MIDI note */
  range_high_midi?: number;
  /** Pattern algorithm to apply */
  pattern?: string;
  /** Rhythm/duration template */
  rhythm?: RhythmType;
  /** Target key for transposition */
  key?: MusicalKey;
  /** Dynamic contour to apply */
  dynamics?: DynamicType;
  /** Articulation style */
  articulation?: ArticulationType;
  /** Minimum tempo in BPM */
  tempo_min_bpm?: number;
  /** Maximum tempo in BPM */
  tempo_max_bpm?: number;
}

/**
 * Predicted soft gate metrics for generated content.
 * Used to estimate complexity before the user attempts the exercise.
 */
export interface PredictedSoftGates {
  /** Predicted interval sustained stage (0-6, based on p75 of melodic intervals) */
  interval_sustained_stage: number;
  /** Predicted interval hazard stage (0-6, based on max melodic interval) */
  interval_hazard_stage: number;
  /** Predicted rhythm complexity (0.0-1.0) */
  rhythm_complexity_score: number;
  /** Predicted tonal complexity stage (0-5) */
  tonal_complexity_stage: number;
  /** Number of accidentals in key signature */
  accidental_count: number;
  /** Maximum melodic interval in semitones */
  max_interval_semitones: number;
  /** 75th percentile melodic interval in semitones */
  interval_p75_semitones: number;
}

/** Response model for generated musical content */
export interface GenerationResponse {
  /** Type of content generated */
  content_type: GenerationType;
  /** Definition used (scale/arpeggio type or lick ID) */
  definition: string;
  /** Key the content was generated in */
  key: MusicalKey;
  /** Requested octaves */
  octaves: number;
  /** Pattern applied (if any) */
  pattern: string | null;
  /** Rhythm template used */
  rhythm: RhythmType;
  /** Dynamic contour applied */
  dynamics: DynamicType;
  /** Articulation style applied */
  articulation: ArticulationType;
  /** Actual octaves generated (may differ from requested) */
  effective_octaves: number;
  /** Lowest MIDI note in the generated content */
  range_used_low_midi: number | null;
  /** Highest MIDI note in the generated content */
  range_used_high_midi: number | null;
  /** List of pitch events in chronological order */
  events: PitchEvent[];
  /** Total duration in beats */
  total_beats: number;
  /** Suggested tempo range [min_bpm, max_bpm] */
  tempo_range: [number, number] | null;
  /** Capability IDs required to perform this content */
  capabilities_required: string[];
  /** Predicted soft gate metrics for difficulty estimation */
  predicted_soft_gates: PredictedSoftGates | null;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Generate musical content from the provided parameters.
 *
 * @param request - Generation parameters
 * @returns GenerationResponse with pitch events and metadata
 * @throws Error if generation fails
 *
 * @example
 * const response = await generateContent({
 *   content_type: "scale",
 *   definition: "dorian",
 *   octaves: 2,
 *   key: "G",
 *   rhythm: "eighth_notes",
 * });
 */
export async function generateContent(
  request: GenerationRequest,
): Promise<GenerationResponse> {
  return api.post<GenerationResponse>("/generate", request);
}

/**
 * Generate content and return as MusicXML string.
 *
 * @param request - Generation parameters
 * @param title - Optional title for the MusicXML document
 * @returns MusicXML string
 */
export async function generateMusicXml(
  request: GenerationRequest,
  title?: string,
): Promise<string> {
  const params = title ? `?title=${encodeURIComponent(title)}` : "";
  const response = await fetch(`${baseUrl}/generate/musicxml${params}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
}

/**
 * Get list of all available scale types.
 */
export async function getScaleTypes(): Promise<string[]> {
  return api.get<string[]>("/generate/scale-types");
}

/**
 * Get list of all available arpeggio types.
 */
export async function getArpeggioTypes(): Promise<string[]> {
  return api.get<string[]>("/generate/arpeggio-types");
}

/**
 * Get list of all available scale patterns.
 */
export async function getScalePatterns(): Promise<string[]> {
  return api.get<string[]>("/generate/scale-patterns");
}

/**
 * Get list of all available arpeggio patterns.
 */
export async function getArpeggioPatterns(): Promise<string[]> {
  return api.get<string[]>("/generate/arpeggio-patterns");
}

/**
 * Get list of all available rhythm types.
 */
export async function getRhythmTypes(): Promise<string[]> {
  return api.get<string[]>("/generate/rhythm-types");
}

/**
 * Get list of all available keys.
 */
export async function getKeys(): Promise<string[]> {
  return api.get<string[]>("/generate/keys");
}

// =============================================================================
// Chord Progression Generation (Practice Over Changes)
// =============================================================================

/** Content type for chord progression generation */
export type ChordProgressionContentType =
  | "scales"
  | "arpeggios"
  | "guide_tones";

/** A chord event with duration */
export interface ChordEvent {
  /** Chord symbol (e.g., 'Cmaj7', 'G7', 'Dm7b5', 'C/E') */
  symbol: string;
  /** Duration of chord in beats */
  duration_beats: number;
}

/** Request for generating content over a chord progression */
export interface ChordProgressionRequest {
  /** Type of content to generate over each chord */
  content_type: ChordProgressionContentType;
  /** Chord progression with durations */
  chords: ChordEvent[];
  /** Pattern algorithm to apply (optional) */
  pattern?: string;
  /** Rhythm/duration template */
  rhythm?: RhythmType;
  /** Lowest playable MIDI note */
  range_low_midi?: number;
  /** Highest playable MIDI note */
  range_high_midi?: number;
  /** Dynamic contour to apply */
  dynamics?: DynamicType;
  /** Articulation style */
  articulation?: ArticulationType;
}

/** Generated content for a single chord */
export interface ChordSegmentResponse {
  /** The chord this segment is for */
  chord_symbol: string;
  /** Scale type used (for scales content_type) */
  scale_used?: string;
  /** Duration of this segment in beats */
  duration_beats: number;
  /** Pitch events in this segment */
  events: PitchEvent[];
}

/** Response for chord progression generation */
export interface ChordProgressionResponse {
  /** Type of content generated */
  content_type: ChordProgressionContentType;
  /** Generated content per chord */
  segments: ChordSegmentResponse[];
  /** Total duration in beats */
  total_beats: number;
  /** All pitch events in chronological order */
  events: PitchEvent[];
}

/**
 * Generate musical content over a chord progression.
 *
 * @param request - Chord progression and generation parameters
 * @returns ChordProgressionResponse with pitch events for each chord
 * @throws Error if generation fails
 *
 * @example
 * const response = await generateOverChanges({
 *   content_type: "scales",
 *   chords: [
 *     { symbol: "Dm7", duration_beats: 4 },
 *     { symbol: "G7", duration_beats: 4 },
 *     { symbol: "Cmaj7", duration_beats: 4 },
 *   ],
 *   rhythm: "eighth_notes",
 * });
 */
export async function generateOverChanges(
  request: ChordProgressionRequest,
): Promise<ChordProgressionResponse> {
  return api.post<ChordProgressionResponse>("/generate/over-changes", request);
}
