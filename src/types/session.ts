/**
 * Session-related TypeScript types
 *
 * Types for practice sessions, mini-sessions, and attempts.
 */

import type { FocusCardPrompts } from "./focusCard";

// ============================================================================
// Session Types
// ============================================================================

export type SessionType = "material" | "teaching_module";
export type GoalType = "slow_and_steady" | "learn_new" | "master" | "review";

// ============================================================================
// Mini Session
// ============================================================================

export interface MiniSession {
  // Session type discriminator
  session_type: SessionType;

  // Material-based session fields (when session_type === "material")
  material_id?: number | null;
  material_title?: string | null;
  focus_card_id?: number | null;
  focus_card_name?: string | null;
  focus_card_description: string;
  focus_card_category: string;
  focus_card_attention_cue: string;
  focus_card_micro_cues: string[];
  focus_card_prompts: FocusCardPrompts;
  goal_type?: GoalType | null;
  goal_label?: string | null;
  show_notation: boolean;
  target_key: string | null;
  original_key_center: string | null;
  resolved_musicxml: string | null;
  starting_pitch: string | null;

  // Teaching module session fields (when session_type === "teaching_module")
  module_id?: string | null;
  module_display_name?: string | null;
  module_description?: string | null;
  lesson_id?: string | null;
  lesson_display_name?: string | null;
  lesson_description?: string | null;
  exercise_template_id?: string | null;
  exercise_config?: Record<string, unknown> | null;
  mastery_config?: Record<string, unknown> | null;
  hints?: string[] | null;
  capability_name?: string | null;
}

// ============================================================================
// Practice Session
// ============================================================================

export interface PracticeSession {
  session_id: number;
  user_id: number;
  planned_duration_minutes: number;
  generated_at: string; // ISO datetime string
  mini_sessions: MiniSession[];
  user_resonant_note?: string | null;
}

// ============================================================================
// Practice Attempt
// ============================================================================

export interface PracticeAttemptInput {
  user_id: number;
  material_id: number;
  key?: string | null;
  focus_card_id?: number | null;
  rating: number; // 1-5
  fatigue: number; // 0-10
  timestamp: string; // ISO datetime string
}

export interface PracticeAttempt {
  id: number;
  material_id: number;
  key?: string | null;
  focus_card_id?: number | null;
  rating?: number | null;
  fatigue?: number | null;
  timestamp?: string | null;
}

// ============================================================================
// Session Step (Curriculum)
// ============================================================================

export interface CurriculumStep {
  id: number;
  step_index: number;
  step_type: string;
  instruction: string;
  prompt: string;
  is_completed: boolean;
  rating?: number | null;
}

export interface MiniSessionWithSteps {
  mini_session_id: number;
  material_title: string;
  focus_card_name: string;
  focus_card_attention_cue: string;
  goal_type: GoalType;
  goal_label: string;
  target_key: string;
  current_step_index: number;
  is_completed: boolean;
  steps: CurriculumStep[];
}

// ============================================================================
// Onboarding
// ============================================================================

export interface OnboardingInput {
  user_id?: number;
  instrument: string;
  resonant_note: string;
  range_low?: string | null;
  range_high?: string | null;
  comfortable_capabilities?: string[];
}

// ============================================================================
// Self-Directed Session
// ============================================================================

export interface SelfDirectedSessionInput {
  user_id?: number;
  planned_duration_minutes?: number;
  material_id: number;
  focus_card_id: number;
  goal_type: GoalType;
}
