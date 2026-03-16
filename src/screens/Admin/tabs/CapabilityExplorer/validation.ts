/**
 * Validation constants and functions for capability forms
 */

export const VALID_REQUIREMENT_TYPES = ["required", "learnable_in_context"];
export const VALID_MASTERY_TYPES = ["single", "any_of_pool", "multiple"];
export const MIN_RATING = 1;
export const MAX_RATING = 5;
export const MIN_DIFFICULTY_WEIGHT = 0.1;
export const MAX_DIFFICULTY_WEIGHT = 10.0;

/**
 * Validates capability form data
 * @param {Object} formData - Form data to validate
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateCapabilityForm(formData) {
  const errors = {};

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
  if (!VALID_REQUIREMENT_TYPES.includes(formData.requirement_type)) {
    errors.requirement_type = `Must be one of: ${VALID_REQUIREMENT_TYPES.join(", ")}`;
  }

  if (!VALID_MASTERY_TYPES.includes(formData.mastery_type)) {
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
export const DEFAULT_CAPABILITY_FORM = {
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
