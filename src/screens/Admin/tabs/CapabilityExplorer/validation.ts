/**
 * Validation constants and functions for capability forms
 */

// =============================================================================
// Types
// =============================================================================

/** Valid requirement_type values for capabilities */
export type RequirementType = "required" | "learnable_in_context";

/** Valid mastery_type values for capabilities */
export type MasteryType = "single" | "any_of_pool" | "multiple";

/** Capability form data structure (all values are strings for form state) */
export interface CapabilityFormData {
  name: string;
  display_name: string;
  domain: string;
  subdomain: string;
  requirement_type: RequirementType | string;
  difficulty_tier: string;
  difficulty_weight: string;
  mastery_type: MasteryType | string;
  mastery_count: string;
  evidence_required_count: string;
  evidence_distinct_materials: boolean;
  evidence_acceptance_threshold: string;
}

/** Validation result from validateCapabilityForm */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// =============================================================================
// Constants
// =============================================================================

export const VALID_REQUIREMENT_TYPES: RequirementType[] = [
  "required",
  "learnable_in_context",
];
export const VALID_MASTERY_TYPES: MasteryType[] = [
  "single",
  "any_of_pool",
  "multiple",
];
export const MIN_RATING = 1;
export const MAX_RATING = 5;
export const MIN_DIFFICULTY_WEIGHT = 0.1;
export const MAX_DIFFICULTY_WEIGHT = 10.0;

// =============================================================================
// Functions
// =============================================================================

/**
 * Validates capability form data
 * @param formData - Form data to validate
 * @returns Validation result with isValid flag and error messages
 */
export function validateCapabilityForm(
  formData: CapabilityFormData,
): ValidationResult {
  const errors: Record<string, string> = {};

  // Required string fields
  if (!formData.name?.trim()) {
    errors.name = "Name is required";
  } else if (!/^[a-z0-9_]+$/.test(formData.name.trim())) {
    errors.name = "Name must be lowercase alphanumeric with underscores only";
  }

  if (!formData.domain?.trim()) {
    errors.domain = "Domain is required";
  }

  const diffTier = Number(formData.difficulty_tier);
  if (isNaN(diffTier) || diffTier < 1 || diffTier > 5) {
    errors.difficulty_tier = "Difficulty tier must be 1-5";
  }

  const diffWeight = Number(formData.difficulty_weight);
  if (
    isNaN(diffWeight) ||
    diffWeight < MIN_DIFFICULTY_WEIGHT ||
    diffWeight > MAX_DIFFICULTY_WEIGHT
  ) {
    errors.difficulty_weight = `Difficulty weight must be ${MIN_DIFFICULTY_WEIGHT}-${MAX_DIFFICULTY_WEIGHT}`;
  }

  const masteryCount = Number(formData.mastery_count);
  if (isNaN(masteryCount) || masteryCount < 1) {
    errors.mastery_count = "Mastery count must be at least 1";
  }

  const evidenceCount = Number(formData.evidence_required_count);
  if (isNaN(evidenceCount) || evidenceCount < 1) {
    errors.evidence_required_count =
      "Evidence required count must be at least 1";
  }

  const threshold = Number(formData.evidence_acceptance_threshold);
  if (isNaN(threshold) || threshold < MIN_RATING || threshold > MAX_RATING) {
    errors.evidence_acceptance_threshold = `Acceptance threshold must be ${MIN_RATING}-${MAX_RATING}`;
  }

  // Enum validations
  if (
    !VALID_REQUIREMENT_TYPES.includes(
      formData.requirement_type as RequirementType,
    )
  ) {
    errors.requirement_type = `Must be one of: ${VALID_REQUIREMENT_TYPES.join(", ")}`;
  }

  if (!VALID_MASTERY_TYPES.includes(formData.mastery_type as MasteryType)) {
    errors.mastery_type = `Must be one of: ${VALID_MASTERY_TYPES.join(", ")}`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Default form values for a new capability
 */
export const DEFAULT_CAPABILITY_FORM: CapabilityFormData = {
  name: "",
  display_name: "",
  domain: "",
  subdomain: "",
  requirement_type: "required",
  difficulty_tier: "1",
  difficulty_weight: "1.0",
  mastery_type: "single",
  mastery_count: "1",
  evidence_required_count: "1",
  evidence_distinct_materials: false,
  evidence_acceptance_threshold: "4",
};
