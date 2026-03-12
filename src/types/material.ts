/**
 * Material-related TypeScript types
 *
 * Types for materials, teaching modules, and lessons.
 */

// ============================================================================
// Material
// ============================================================================

export interface Material {
  id: number;
  title: string;
  allowed_keys: string[];
  original_key_center?: string | null;
  pitch_reference_type?: string | null;
}

export interface MaterialForUser {
  id: number;
  title: string;
  difficulty?: number | null;
  domain?: string | null;
  source?: string | null;
}

export interface EligibleMaterials {
  user_id: number;
  eligible_materials: MaterialForUser[];
  total_eligible: number;
}

// ============================================================================
// Material Analysis
// ============================================================================

export interface PitchDensity {
  low?: number | null;
  mid?: number | null;
  high?: number | null;
}

export interface MaterialAnalysisDetail {
  lowest_pitch?: string | null;
  highest_pitch?: string | null;
  range_semitones?: number | null;
  pitch_density?: PitchDensity | null;
  chromatic_complexity?: number | null;
  tempo_marking?: string | null;
  tempo_bpm?: number | null;
  measure_count?: number | null;
}

export interface CapabilityInMaterial {
  id: number;
  name: string;
  display_name?: string | null;
  domain?: string | null;
}

export interface MaterialFullAnalysis {
  material_id: number;
  title: string;
  capabilities: CapabilityInMaterial[];
  analysis?: MaterialAnalysisDetail | null;
}

// ============================================================================
// Teaching Module
// ============================================================================

export type ModuleCompletionType = "all_required" | "any_n";
export type ModuleStatus = "not_started" | "in_progress" | "completed";
export type LessonUnlockCondition = "always" | "previous";

export interface TeachingModule {
  id: string; // e.g., "pulse_tracking_module"
  capability_name?: string | null;
  display_name: string;
  description?: string | null;
  icon?: string | null;
  prerequisite_capability_names?: string[]; // JSON parsed
  completion_type: ModuleCompletionType;
  completion_count?: number | null;
  estimated_duration_minutes?: number | null;
  difficulty_tier: number;
  display_order: number;
  is_active: boolean;
  created_at?: string | null;
}

// ============================================================================
// Lesson
// ============================================================================

export interface LessonConfig {
  [key: string]: unknown;
}

export interface MasteryConfig {
  correct_streak?: number;
  min_accuracy?: number;
  [key: string]: unknown;
}

export interface Lesson {
  id: string; // e.g., "pulse_L1_tap_along"
  module_id: string;
  display_name: string;
  description?: string | null;
  exercise_template_id: string;
  config_json?: LessonConfig; // Parsed from JSON
  mastery_json?: MasteryConfig; // Parsed from JSON
  feedback_json?: Record<string, string> | null;
  hints_json?: string[] | null;
  sequence_order: number;
  is_required: boolean;
  unlock_condition: LessonUnlockCondition;
  is_active: boolean;
  created_at?: string | null;
}

// ============================================================================
// User Progress on Modules/Lessons
// ============================================================================

export interface UserModuleProgress {
  id: number;
  user_id: number;
  module_id: string;
  status: ModuleStatus;
  started_at?: string | null;
  completed_at?: string | null;
  current_lesson_id?: string | null;
}

export interface UserLessonProgress {
  id: number;
  user_id: number;
  lesson_id: string;
  status: ModuleStatus;
  attempts: number;
  best_score?: number | null;
  last_score?: number | null;
  started_at?: string | null;
  completed_at?: string | null;
}
