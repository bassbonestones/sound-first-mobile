/**
 * Tests for formatters utility functions
 */
import {
  formatDuration,
  formatPercentage,
  formatCents,
  formatFrequency,
  pluralize,
} from "../src/utils/formatters";

describe("formatters", () => {
  describe("formatDuration", () => {
    it("formats seconds under a minute", () => {
      expect(formatDuration(45000)).toBe("0:45");
    });

    it("formats minutes and seconds", () => {
      expect(formatDuration(150000)).toBe("2:30");
    });

    it("formats hours, minutes, and seconds", () => {
      expect(formatDuration(3930000)).toBe("1:05:30");
    });

    it("pads seconds with leading zero", () => {
      expect(formatDuration(65000)).toBe("1:05");
    });

    it("handles zero duration", () => {
      expect(formatDuration(0)).toBe("0:00");
    });

    it("handles negative duration", () => {
      expect(formatDuration(-1000)).toBe("0:00");
    });

    it("includes milliseconds when requested", () => {
      expect(formatDuration(45123, { includeMs: true })).toBe("0:45.123");
    });

    it("uses compact format for under a minute", () => {
      expect(formatDuration(45000, { compact: true })).toBe("45s");
    });

    it("uses compact format with milliseconds", () => {
      expect(formatDuration(5123, { compact: true, includeMs: true })).toBe(
        "5.123s",
      );
    });
  });

  describe("formatPercentage", () => {
    it("formats normalized decimal (0-1)", () => {
      expect(formatPercentage(0.85)).toBe("85%");
    });

    it("formats with decimals", () => {
      expect(formatPercentage(0.855, { decimals: 1 })).toBe("85.5%");
    });

    it("handles 100%", () => {
      expect(formatPercentage(1.0)).toBe("100%");
    });

    it("handles 0%", () => {
      expect(formatPercentage(0)).toBe("0%");
    });

    it("handles non-normalized values", () => {
      expect(formatPercentage(85, { normalized: false })).toBe("85%");
    });

    it("auto-detects non-normalized values over 1", () => {
      expect(formatPercentage(85)).toBe("85%");
    });
  });

  describe("formatCents", () => {
    it("formats positive cents with plus sign", () => {
      expect(formatCents(5.4)).toBe("+5¢");
    });

    it("formats negative cents", () => {
      expect(formatCents(-3.2)).toBe("-3¢");
    });

    it("formats zero cents", () => {
      expect(formatCents(0)).toBe("0¢");
    });

    it("rounds to nearest integer", () => {
      expect(formatCents(4.6)).toBe("+5¢");
      expect(formatCents(4.4)).toBe("+4¢");
    });

    it("handles small negative rounding to zero", () => {
      expect(formatCents(-0.3)).toBe("0¢");
    });
  });

  describe("formatFrequency", () => {
    it("formats frequency with unit", () => {
      expect(formatFrequency(440)).toBe("440.0 Hz");
    });

    it("formats without unit when requested", () => {
      expect(formatFrequency(440, { includeUnit: false })).toBe("440.0");
    });

    it("formats with custom decimals", () => {
      expect(formatFrequency(440.123, { decimals: 2 })).toBe("440.12 Hz");
    });

    it("formats with no decimals", () => {
      expect(formatFrequency(440.6, { decimals: 0 })).toBe("441 Hz");
    });
  });

  describe("pluralize", () => {
    it("uses singular for count of 1", () => {
      expect(pluralize(1, "test")).toBe("1 test");
    });

    it("uses plural for count of 0", () => {
      expect(pluralize(0, "test")).toBe("0 tests");
    });

    it("uses plural for count > 1", () => {
      expect(pluralize(5, "test")).toBe("5 tests");
    });

    it("uses custom plural form", () => {
      expect(pluralize(2, "child", "children")).toBe("2 children");
    });

    it("uses custom plural for irregular nouns", () => {
      expect(pluralize(1, "person", "people")).toBe("1 person");
      expect(pluralize(3, "person", "people")).toBe("3 people");
    });
  });
});
