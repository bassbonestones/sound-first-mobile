/**
 * Analysis Types
 *
 * Types for capability analysis response from backend /materials/analyze endpoint.
 */

// ============================================================================
// Range Analysis
// ============================================================================

export interface PitchDensity {
  total_pitches: number;
  unique_pitches: number;
  most_common: Array<{ pitch: string; count: number }>;
}

export interface RangeAnalysis {
  lowest_pitch: string | null;
  highest_pitch: string | null;
  range_semitones: number | null;
  pitch_density: PitchDensity | null;
}

// ============================================================================
// Tempo Profile
// ============================================================================

export interface TempoProfile {
  tempo_marking: string | null;
  tempo_bpm: number | null;
  has_tempo_changes: boolean;
  tempo_terms: string[];
}

// ============================================================================
// Soft Gates
// ============================================================================

export interface SoftGateScores {
  interval_velocity_score: number | null;
  rhythm_velocity_score: number | null;
  tonal_velocity_score: number | null;
  tempo_velocity_score: number | null;
  range_velocity_score: number | null;
  throughput_velocity_score: number | null;
}

// ============================================================================
// Unified Scores
// ============================================================================

export interface UnifiedScores {
  difficulty_score: number | null;
  complexity_score: number | null;
  accessibility_score: number | null;
}

// ============================================================================
// Detailed Extraction
// ============================================================================

export interface DetailedExtraction {
  clefs: string[];
  time_signatures: string[];
  key_signatures: string[];
  note_values: string[];
  rests: string[];
  dynamics: string[];
  articulations: string[];
  ornaments: string[];
  tempo_terms: string[];
  expression_terms: string[];
  intervals: string[];
  repeat_structures: string[];
}

// ============================================================================
// Analysis Response (matches AnalysisPreviewOut)
// ============================================================================

export interface CapabilityAnalysisResult {
  /** Title extracted from MusicXML */
  title: string;
  /** List of detected capability names */
  capabilities: string[];
  /** Capabilities grouped by domain */
  capabilities_by_domain: Record<string, string[]>;
  /** Total number of capabilities detected */
  capability_count: number;
  /** Range analysis details */
  range_analysis: RangeAnalysis | null;
  /** Chromatic complexity score (0-1) */
  chromatic_complexity: number | null;
  /** Number of measures in the score */
  measure_count: number;
  /** Tempo in BPM */
  tempo_bpm: number | null;
  /** Tempo marking text */
  tempo_marking: string | null;
  /** Tempo profile details */
  tempo_profile: TempoProfile | null;
  /** Soft gate velocity scores */
  soft_gates: SoftGateScores;
  /** Unified difficulty/complexity scores */
  unified_scores: UnifiedScores;
  /** Detailed extraction of musical elements */
  detailed_extraction: DetailedExtraction;
}

// ============================================================================
// Capability Domain Display Info
// ============================================================================

/** Map domain names to display-friendly names and icons */
export const DOMAIN_DISPLAY_INFO: Record<
  string,
  { label: string; icon: string }
> = {
  clef: { label: "Clefs", icon: "book-open" },
  time_signature: { label: "Time Signatures", icon: "clock" },
  key_signature: { label: "Key Signatures", icon: "key" },
  note_value: { label: "Note Values", icon: "music" },
  rest: { label: "Rests", icon: "pause" },
  tuplet: { label: "Tuplets", icon: "layers" },
  interval_melodic: { label: "Melodic Intervals", icon: "trending-up" },
  interval_harmonic: { label: "Harmonic Intervals", icon: "grid" },
  dynamic: { label: "Dynamics", icon: "volume-2" },
  dynamic_change: { label: "Dynamic Changes", icon: "sliders" },
  articulation: { label: "Articulations", icon: "edit-3" },
  ornament: { label: "Ornaments", icon: "star" },
  tempo_term: { label: "Tempo Terms", icon: "activity" },
  expression_term: { label: "Expression", icon: "heart" },
  repeat_structure: { label: "Repeats", icon: "repeat" },
  notation_symbol: { label: "Notation Symbols", icon: "hash" },
  multivoice: { label: "Multi-voice", icon: "users" },
  pitch: { label: "Pitches", icon: "disc" },
  rhythm: { label: "Rhythm", icon: "zap" },
};

// ============================================================================
// API Request
// ============================================================================

export interface CapabilityAnalysisRequest {
  musicxml_content: string;
  title?: string;
}

// ============================================================================
// Learning Path Types
// ============================================================================

export interface LearningPathRequest {
  capability_names: string[];
  user_id: number;
}

export interface LearningPathCapability {
  id: number;
  name: string;
  display_name: string | null;
  domain: string;
  difficulty_tier: number;
  is_mastered: boolean;
  prerequisite_names: string[];
  depth: number;
}

export interface LearningPathResponse {
  user_id: number;
  total_capabilities_in_score: number;
  capabilities_already_mastered: number;
  capabilities_to_learn: number;
  learning_path: LearningPathCapability[];
  path_by_domain: Record<string, LearningPathCapability[]>;
}
