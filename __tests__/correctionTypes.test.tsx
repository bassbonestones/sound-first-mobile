/**
 * Correction Types Tests
 *
 * Tests for the correction utility functions.
 */

import {
  getConfidenceSeverity,
  getConfidenceColor,
  formatConfidence,
} from "../src/features/importMusic/types/correctionTypes";

describe("correctionTypes", () => {
  describe("getConfidenceSeverity", () => {
    it("returns low for confidence < 0.5", () => {
      expect(getConfidenceSeverity(0)).toBe("low");
      expect(getConfidenceSeverity(0.1)).toBe("low");
      expect(getConfidenceSeverity(0.49)).toBe("low");
    });

    it("returns medium for confidence 0.5 to 0.75", () => {
      expect(getConfidenceSeverity(0.5)).toBe("medium");
      expect(getConfidenceSeverity(0.6)).toBe("medium");
      expect(getConfidenceSeverity(0.74)).toBe("medium");
    });

    it("returns high for confidence >= 0.75", () => {
      expect(getConfidenceSeverity(0.75)).toBe("high");
      expect(getConfidenceSeverity(0.9)).toBe("high");
      expect(getConfidenceSeverity(1.0)).toBe("high");
    });
  });

  describe("getConfidenceColor", () => {
    it("returns red for low severity", () => {
      expect(getConfidenceColor("low")).toBe("#D32F2F");
    });

    it("returns orange for medium severity", () => {
      expect(getConfidenceColor("medium")).toBe("#F57C00");
    });

    it("returns green for high severity", () => {
      expect(getConfidenceColor("high")).toBe("#388E3C");
    });
  });

  describe("formatConfidence", () => {
    it("formats confidence as percentage string", () => {
      expect(formatConfidence(0.5)).toBe("50%");
      expect(formatConfidence(0.75)).toBe("75%");
      expect(formatConfidence(1.0)).toBe("100%");
    });

    it("rounds to nearest integer", () => {
      expect(formatConfidence(0.333)).toBe("33%");
      expect(formatConfidence(0.666)).toBe("67%");
      expect(formatConfidence(0.999)).toBe("100%");
    });

    it("handles edge cases", () => {
      expect(formatConfidence(0)).toBe("0%");
      expect(formatConfidence(0.001)).toBe("0%");
      expect(formatConfidence(0.005)).toBe("1%");
    });
  });
});
