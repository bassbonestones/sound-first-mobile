/**
 * Tests for capability form validation
 */
import {
  validateCapabilityForm,
  DEFAULT_CAPABILITY_FORM,
  VALID_REQUIREMENT_TYPES,
  VALID_MASTERY_TYPES,
  MIN_RATING,
  MAX_RATING,
  MIN_DIFFICULTY_WEIGHT,
  MAX_DIFFICULTY_WEIGHT,
} from "../src/screens/Admin/tabs/CapabilityExplorer/validation";

describe("capability validation constants", () => {
  it("defines valid requirement types", () => {
    expect(VALID_REQUIREMENT_TYPES).toContain("required");
    expect(VALID_REQUIREMENT_TYPES).toContain("learnable_in_context");
  });

  it("defines valid mastery types", () => {
    expect(VALID_MASTERY_TYPES).toContain("single");
    expect(VALID_MASTERY_TYPES).toContain("any_of_pool");
    expect(VALID_MASTERY_TYPES).toContain("multiple");
  });

  it("defines rating range", () => {
    expect(MIN_RATING).toBe(1);
    expect(MAX_RATING).toBe(5);
  });

  it("defines difficulty weight range", () => {
    expect(MIN_DIFFICULTY_WEIGHT).toBe(0.1);
    expect(MAX_DIFFICULTY_WEIGHT).toBe(10.0);
  });
});

describe("DEFAULT_CAPABILITY_FORM", () => {
  it("has all required fields", () => {
    expect(DEFAULT_CAPABILITY_FORM).toHaveProperty("name");
    expect(DEFAULT_CAPABILITY_FORM).toHaveProperty("display_name");
    expect(DEFAULT_CAPABILITY_FORM).toHaveProperty("domain");
    expect(DEFAULT_CAPABILITY_FORM).toHaveProperty("subdomain");
    expect(DEFAULT_CAPABILITY_FORM).toHaveProperty("requirement_type");
    expect(DEFAULT_CAPABILITY_FORM).toHaveProperty("difficulty_tier");
    expect(DEFAULT_CAPABILITY_FORM).toHaveProperty("difficulty_weight");
    expect(DEFAULT_CAPABILITY_FORM).toHaveProperty("mastery_type");
    expect(DEFAULT_CAPABILITY_FORM).toHaveProperty("mastery_count");
    expect(DEFAULT_CAPABILITY_FORM).toHaveProperty("evidence_required_count");
    expect(DEFAULT_CAPABILITY_FORM).toHaveProperty(
      "evidence_distinct_materials",
    );
    expect(DEFAULT_CAPABILITY_FORM).toHaveProperty(
      "evidence_acceptance_threshold",
    );
  });

  it("has valid default requirement type", () => {
    expect(VALID_REQUIREMENT_TYPES).toContain(
      DEFAULT_CAPABILITY_FORM.requirement_type,
    );
  });

  it("has valid default mastery type", () => {
    expect(VALID_MASTERY_TYPES).toContain(DEFAULT_CAPABILITY_FORM.mastery_type);
  });
});

describe("validateCapabilityForm", () => {
  const validForm = {
    name: "test_capability",
    domain: "pitch",
    difficulty_tier: "3",
    difficulty_weight: "1.5",
    mastery_count: "5",
    evidence_required_count: "3",
    evidence_acceptance_threshold: "4",
    requirement_type: "required",
    mastery_type: "single",
  };

  describe("valid form", () => {
    it("returns isValid true for valid form", () => {
      const result = validateCapabilityForm(validForm);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });
  });

  describe("name validation", () => {
    it("requires name", () => {
      const result = validateCapabilityForm({ ...validForm, name: "" });
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe("Name is required");
    });

    it("rejects whitespace-only name", () => {
      const result = validateCapabilityForm({ ...validForm, name: "   " });
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe("Name is required");
    });

    it("rejects names with uppercase", () => {
      const result = validateCapabilityForm({
        ...validForm,
        name: "TestCapability",
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toContain("lowercase");
    });

    it("rejects names with spaces", () => {
      const result = validateCapabilityForm({
        ...validForm,
        name: "test capability",
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toContain("alphanumeric");
    });

    it("rejects names with hyphens", () => {
      const result = validateCapabilityForm({
        ...validForm,
        name: "test-capability",
      });
      expect(result.isValid).toBe(false);
    });

    it("accepts underscores in names", () => {
      const result = validateCapabilityForm({
        ...validForm,
        name: "test_capability_v2",
      });
      expect(result.isValid).toBe(true);
    });

    it("accepts numbers in names", () => {
      const result = validateCapabilityForm({
        ...validForm,
        name: "test123",
      });
      expect(result.isValid).toBe(true);
    });
  });

  describe("domain validation", () => {
    it("requires domain", () => {
      const result = validateCapabilityForm({ ...validForm, domain: "" });
      expect(result.isValid).toBe(false);
      expect(result.errors.domain).toBe("Domain is required");
    });

    it("rejects whitespace-only domain", () => {
      const result = validateCapabilityForm({ ...validForm, domain: "   " });
      expect(result.isValid).toBe(false);
    });
  });

  describe("difficulty_tier validation", () => {
    it("requires valid difficulty tier", () => {
      const result = validateCapabilityForm({
        ...validForm,
        difficulty_tier: "0",
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.difficulty_tier).toContain("1-5");
    });

    it("rejects tier above 5", () => {
      const result = validateCapabilityForm({
        ...validForm,
        difficulty_tier: "6",
      });
      expect(result.isValid).toBe(false);
    });

    it("accepts tier 1", () => {
      const result = validateCapabilityForm({
        ...validForm,
        difficulty_tier: "1",
      });
      expect(result.errors.difficulty_tier).toBeUndefined();
    });

    it("accepts tier 5", () => {
      const result = validateCapabilityForm({
        ...validForm,
        difficulty_tier: "5",
      });
      expect(result.errors.difficulty_tier).toBeUndefined();
    });

    it("rejects non-numeric tier", () => {
      const result = validateCapabilityForm({
        ...validForm,
        difficulty_tier: "abc",
      });
      expect(result.isValid).toBe(false);
    });
  });

  describe("difficulty_weight validation", () => {
    it("requires valid difficulty weight", () => {
      const result = validateCapabilityForm({
        ...validForm,
        difficulty_weight: "0",
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.difficulty_weight).toContain("0.1-10");
    });

    it("rejects weight above 10", () => {
      const result = validateCapabilityForm({
        ...validForm,
        difficulty_weight: "11",
      });
      expect(result.isValid).toBe(false);
    });

    it("accepts minimum weight", () => {
      const result = validateCapabilityForm({
        ...validForm,
        difficulty_weight: "0.1",
      });
      expect(result.errors.difficulty_weight).toBeUndefined();
    });

    it("accepts maximum weight", () => {
      const result = validateCapabilityForm({
        ...validForm,
        difficulty_weight: "10",
      });
      expect(result.errors.difficulty_weight).toBeUndefined();
    });
  });

  describe("mastery_count validation", () => {
    it("requires at least 1", () => {
      const result = validateCapabilityForm({
        ...validForm,
        mastery_count: "0",
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.mastery_count).toContain("at least 1");
    });

    it("accepts count of 1", () => {
      const result = validateCapabilityForm({
        ...validForm,
        mastery_count: "1",
      });
      expect(result.errors.mastery_count).toBeUndefined();
    });

    it("rejects negative count", () => {
      const result = validateCapabilityForm({
        ...validForm,
        mastery_count: "-1",
      });
      expect(result.isValid).toBe(false);
    });
  });

  describe("evidence_required_count validation", () => {
    it("requires at least 1", () => {
      const result = validateCapabilityForm({
        ...validForm,
        evidence_required_count: "0",
      });
      expect(result.isValid).toBe(false);
    });

    it("accepts count of 1", () => {
      const result = validateCapabilityForm({
        ...validForm,
        evidence_required_count: "1",
      });
      expect(result.errors.evidence_required_count).toBeUndefined();
    });
  });

  describe("evidence_acceptance_threshold validation", () => {
    it("requires value in rating range", () => {
      const result = validateCapabilityForm({
        ...validForm,
        evidence_acceptance_threshold: "0",
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.evidence_acceptance_threshold).toContain("1-5");
    });

    it("rejects threshold above 5", () => {
      const result = validateCapabilityForm({
        ...validForm,
        evidence_acceptance_threshold: "6",
      });
      expect(result.isValid).toBe(false);
    });

    it("accepts minimum threshold", () => {
      const result = validateCapabilityForm({
        ...validForm,
        evidence_acceptance_threshold: "1",
      });
      expect(result.errors.evidence_acceptance_threshold).toBeUndefined();
    });

    it("accepts maximum threshold", () => {
      const result = validateCapabilityForm({
        ...validForm,
        evidence_acceptance_threshold: "5",
      });
      expect(result.errors.evidence_acceptance_threshold).toBeUndefined();
    });
  });

  describe("requirement_type validation", () => {
    it("rejects invalid requirement type", () => {
      const result = validateCapabilityForm({
        ...validForm,
        requirement_type: "invalid",
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.requirement_type).toContain("Must be one of");
    });

    it("accepts required type", () => {
      const result = validateCapabilityForm({
        ...validForm,
        requirement_type: "required",
      });
      expect(result.errors.requirement_type).toBeUndefined();
    });

    it("accepts learnable_in_context type", () => {
      const result = validateCapabilityForm({
        ...validForm,
        requirement_type: "learnable_in_context",
      });
      expect(result.errors.requirement_type).toBeUndefined();
    });
  });

  describe("mastery_type validation", () => {
    it("rejects invalid mastery type", () => {
      const result = validateCapabilityForm({
        ...validForm,
        mastery_type: "invalid",
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.mastery_type).toContain("Must be one of");
    });

    it("accepts single type", () => {
      const result = validateCapabilityForm({
        ...validForm,
        mastery_type: "single",
      });
      expect(result.errors.mastery_type).toBeUndefined();
    });

    it("accepts any_of_pool type", () => {
      const result = validateCapabilityForm({
        ...validForm,
        mastery_type: "any_of_pool",
      });
      expect(result.errors.mastery_type).toBeUndefined();
    });

    it("accepts multiple type", () => {
      const result = validateCapabilityForm({
        ...validForm,
        mastery_type: "multiple",
      });
      expect(result.errors.mastery_type).toBeUndefined();
    });
  });

  describe("multiple errors", () => {
    it("returns all validation errors", () => {
      const result = validateCapabilityForm({
        name: "",
        domain: "",
        difficulty_tier: "0",
        difficulty_weight: "0",
        mastery_count: "0",
        evidence_required_count: "0",
        evidence_acceptance_threshold: "0",
        requirement_type: "invalid",
        mastery_type: "invalid",
      });

      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(5);
    });
  });
});
