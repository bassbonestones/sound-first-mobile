/**
 * Capability-related TypeScript types
 *
 * Types for capabilities, detection rules, and prerequisites.
 */

// ============================================================================
// Capability Enums
// ============================================================================

export type RequirementType = "required" | "learnable_in_context";
export type MasteryType = "single" | "any_of_pool" | "multiple";

export type CapabilityDomain =
  | "clef"
  | "time_signature"
  | "key_signature"
  | "note_value"
  | "rest"
  | "tuplet"
  | "interval_melodic"
  | "interval_harmonic"
  | "dynamic"
  | "dynamic_change"
  | "articulation"
  | "ornament"
  | "tempo_term"
  | "expression_term"
  | "repeat_structure"
  | "notation_symbol"
  | "multivoice"
  | "pitch"
  | "rhythm"
  | "ear_training"
  | "theory";

// ============================================================================
// Detection Rule Types
// ============================================================================

export type DetectionRuleType =
  | "element"
  | "value_match"
  | "compound"
  | "interval"
  | "text_match"
  | "time_signature"
  | "range"
  | "custom";

export interface DetectionRule {
  type: DetectionRuleType;
  element_type?: string;
  attribute?: string;
  value?: string | number;
  operator?: "==" | "!=" | ">" | "<" | ">=" | "<=" | "in" | "contains";
  rules?: DetectionRule[]; // For compound rules
  logic?: "and" | "or";
}

// ============================================================================
// Soft Gate Requirements
// ============================================================================

export interface SoftGateRequirements {
  interval_velocity_score?: number;
  rhythm_velocity_score?: number;
  tonal_velocity_score?: number;
  tempo_velocity_score?: number;
  range_velocity_score?: number;
  throughput_velocity_score?: number;
  [key: string]: number | undefined;
}

// ============================================================================
// Capability
// ============================================================================

export interface Capability {
  id: number;
  name: string;
  display_name?: string | null;
  domain: CapabilityDomain | string;
  subdomain?: string | null;
  requirement_type: RequirementType;
  prerequisite_ids?: number[] | null; // Parsed from JSON
  bit_index?: number | null;
  explanation?: string | null;
  difficulty_tier: number;
  introduction_material_id?: number | null;
  mastery_type: MasteryType;
  mastery_count: number;
  evidence_required_count: number;
  evidence_distinct_materials: boolean;
  evidence_acceptance_threshold: number;
  evidence_qualifier_json?: Record<string, unknown> | null;
  difficulty_weight: number;
  soft_gate_requirements?: SoftGateRequirements | null;
  music21_detection_json?: DetectionRule | null;
  is_active: boolean;
}

// ============================================================================
// Capability Responses
// ============================================================================

export interface CapabilityBasic {
  id: number;
  name: string;
  domain?: string | null;
}

export interface CapabilityDetail {
  id: number;
  name: string;
  display_name?: string | null;
  domain?: string | null;
  subdomain?: string | null;
  requirement_type?: string | null;
  bit_index?: number | null;
  difficulty_tier?: number | null;
}

export interface CapabilityHelp {
  id: number;
  name: string;
  display_name: string;
  domain?: string | null;
  has_lesson: boolean;
}

export interface MaterialHelpCapabilities {
  material_id: number;
  material_title: string;
  capabilities: CapabilityHelp[];
}

// ============================================================================
// Domain
// ============================================================================

export interface DomainCount {
  domain: string;
  count: number;
}

// ============================================================================
// Next Capability Recommendation
// ============================================================================

export interface NextCapability {
  next_capability?: {
    id: number;
    name: string;
    display_name?: string | null;
    explanation?: string | null;
    domain?: string | null;
  } | null;
  message?: string | null;
}
