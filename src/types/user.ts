/**
 * User-related TypeScript types
 *
 * Types for users, instruments, and user capabilities.
 */

// ============================================================================
// User
// ============================================================================

export interface User {
  id: number;
  email?: string | null;
  name?: string | null;
  instrument?: string | null;
  resonant_note?: string | null;
}

// ============================================================================
// Instrument
// ============================================================================

export interface Instrument {
  id: number;
  instrument_name: string;
  is_primary: boolean;
  clef?: string | null;
  resonant_note?: string | null;
  range_low?: string | null;
  range_high?: string | null;
  day0_completed?: boolean | null;
  day0_stage?: number | null;
  created_at?: string | null;
  last_practiced_at?: string | null;
}

export interface UserInstrumentsResponse {
  user_id: number;
  last_instrument_id?: number | null;
  instruments: Instrument[];
}

// ============================================================================
// User Capability
// ============================================================================

export interface UserCapability {
  id: number;
  user_id: number;
  capability_id: number;
  instrument_id?: number | null;
  introduced_at?: string | null;
  mastered_at?: string | null;
  is_active: boolean;
  deactivated_at?: string | null;
  times_practiced: number;
  times_refreshed: number;
  evidence_count: number;
}

// ============================================================================
// User Complexity Scores
// ============================================================================

export interface UserComplexityScores {
  id: number;
  user_id: number;
  // Legacy complexity dimensions
  max_chromatic_complexity: number;
  max_rhythmic_complexity: number;
  max_reading_complexity: number;
  comfortable_chromatic: number;
  comfortable_rhythmic: number;
  comfortable_reading: number;
  // Unified scoring ability model
  interval_ability_score: number;
  rhythm_ability_score: number;
  tonal_ability_score: number;
  tempo_ability_score: number;
  range_ability_score: number;
  throughput_ability_score: number;
}

// ============================================================================
// User Progress
// ============================================================================

export interface CapabilityProgress {
  user_id: number;
  total_capabilities: number;
  capabilities_mastered: number;
  capabilities_in_progress: number;
  last_mastery?: string | null;
  mastered_capability_ids: number[];
}

// ============================================================================
// Journey Stage
// ============================================================================

export interface JourneyStageFactors {
  mastered_capabilities_count: number;
  total_mastered_value: number;
  mastered_to_total_ratio: number;
}

export interface JourneyStageMetrics {
  total_practice_sessions: number;
  days_practiced: number;
}

export interface JourneyStage {
  user_id: number;
  stage: number;
  stage_name: string;
  factors: JourneyStageFactors;
  metrics: JourneyStageMetrics;
}

// ============================================================================
// Day 0 Status
// ============================================================================

export interface Day0Status {
  user_id: number;
  instrument_id?: number | null;
  mastered_global_caps: string[];
  skippable_stages: number[];
  total_stages: number;
  effective_stages: number;
}
