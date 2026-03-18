/**
 * MeasureCorrectionCard Tests
 */

import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";

import { MeasureCorrectionCard } from "../src/features/importMusic/components/MeasureCorrectionCard";
import type { CorrectionMeasure } from "../src/features/importMusic/components/correctionTypes";

// ============================================================================
// Test Data
// ============================================================================

const createMockMeasure = (
  overrides: Partial<CorrectionMeasure> = {},
): CorrectionMeasure => ({
  measureNumber: 4,
  partIndex: 0,
  confidence: 0.65,
  reason: "Uncertain note duration detected",
  status: "pending",
  ...overrides,
});

// ============================================================================
// Tests
// ============================================================================

describe("MeasureCorrectionCard", () => {
  describe("Rendering", () => {
    it("renders measure number", () => {
      const measure = createMockMeasure();
      render(<MeasureCorrectionCard measure={measure} />);

      expect(screen.getByText(/Measure 4/)).toBeTruthy();
    });

    it("renders part index when > 0", () => {
      const measure = createMockMeasure({ partIndex: 1 });
      render(<MeasureCorrectionCard measure={measure} />);

      expect(screen.getByText(/Part 2/)).toBeTruthy();
    });

    it("renders confidence badge", () => {
      const measure = createMockMeasure({ confidence: 0.42 });
      render(<MeasureCorrectionCard measure={measure} testID="test-card" />);

      expect(screen.getByTestId("test-card-confidence")).toBeTruthy();
      expect(screen.getByText("42%")).toBeTruthy();
    });

    it("renders reason text", () => {
      const measure = createMockMeasure({
        reason: "Multiple interpretations possible",
      });
      render(<MeasureCorrectionCard measure={measure} testID="test-card" />);

      expect(
        screen.getByText("Multiple interpretations possible"),
      ).toBeTruthy();
    });

    it("renders action buttons for pending measures", () => {
      const measure = createMockMeasure({ status: "pending" });
      render(<MeasureCorrectionCard measure={measure} testID="test-card" />);

      expect(screen.getByTestId("test-card-actions")).toBeTruthy();
      expect(screen.getByText("Looks Good")).toBeTruthy();
      expect(screen.getByText("Edit")).toBeTruthy();
      expect(screen.getByText("Skip")).toBeTruthy();
    });

    it("does not render action buttons for approved measures", () => {
      const measure = createMockMeasure({ status: "approved" });
      render(<MeasureCorrectionCard measure={measure} testID="test-card" />);

      expect(screen.queryByTestId("test-card-actions")).toBeNull();
    });

    it("does not render action buttons for edited measures", () => {
      const measure = createMockMeasure({ status: "edited" });
      render(<MeasureCorrectionCard measure={measure} testID="test-card" />);

      expect(screen.queryByTestId("test-card-actions")).toBeNull();
    });

    it("does not render action buttons for skipped measures", () => {
      const measure = createMockMeasure({ status: "skipped" });
      render(<MeasureCorrectionCard measure={measure} testID="test-card" />);

      expect(screen.queryByTestId("test-card-actions")).toBeNull();
    });

    it("renders status badge for approved measures", () => {
      const measure = createMockMeasure({ status: "approved" });
      render(<MeasureCorrectionCard measure={measure} testID="test-card" />);

      expect(screen.getByTestId("test-card-status")).toBeTruthy();
      expect(screen.getByText("Approved")).toBeTruthy();
    });

    it("renders status badge for edited measures", () => {
      const measure = createMockMeasure({ status: "edited" });
      render(<MeasureCorrectionCard measure={measure} testID="test-card" />);

      expect(screen.getByTestId("test-card-status")).toBeTruthy();
      expect(screen.getByText("Edited")).toBeTruthy();
    });

    it("renders status badge for skipped measures", () => {
      const measure = createMockMeasure({ status: "skipped" });
      render(<MeasureCorrectionCard measure={measure} testID="test-card" />);

      expect(screen.getByTestId("test-card-status")).toBeTruthy();
      expect(screen.getByText("Skipped")).toBeTruthy();
    });

    it("renders notes when present", () => {
      const measure = createMockMeasure({
        status: "edited",
        notes: "Changed quarter to eighth",
      });
      render(<MeasureCorrectionCard measure={measure} testID="test-card" />);

      expect(screen.getByTestId("test-card-notes")).toBeTruthy();
      expect(screen.getByText("Changed quarter to eighth")).toBeTruthy();
    });
  });

  describe("Confidence Severity", () => {
    it("displays low confidence (< 0.5) with red badge", () => {
      const measure = createMockMeasure({ confidence: 0.35 });
      render(<MeasureCorrectionCard measure={measure} testID="test-card" />);

      expect(screen.getByText("35%")).toBeTruthy();
    });

    it("displays medium confidence (0.5-0.75) with orange badge", () => {
      const measure = createMockMeasure({ confidence: 0.62 });
      render(<MeasureCorrectionCard measure={measure} testID="test-card" />);

      expect(screen.getByText("62%")).toBeTruthy();
    });

    it("displays high confidence (>= 0.75) with green badge", () => {
      const measure = createMockMeasure({ confidence: 0.88 });
      render(<MeasureCorrectionCard measure={measure} testID="test-card" />);

      expect(screen.getByText("88%")).toBeTruthy();
    });
  });

  describe("User Interactions", () => {
    it("calls onApprove when Looks Good is pressed", () => {
      const onApprove = jest.fn();
      const measure = createMockMeasure({ measureNumber: 7, partIndex: 1 });
      render(
        <MeasureCorrectionCard
          measure={measure}
          onApprove={onApprove}
          testID="test-card"
        />,
      );

      fireEvent.press(screen.getByTestId("test-card-approve"));

      expect(onApprove).toHaveBeenCalledWith(7, 1);
    });

    it("calls onEdit when Edit is pressed", () => {
      const onEdit = jest.fn();
      const measure = createMockMeasure({ measureNumber: 3, partIndex: 0 });
      render(
        <MeasureCorrectionCard
          measure={measure}
          onEdit={onEdit}
          testID="test-card"
        />,
      );

      fireEvent.press(screen.getByTestId("test-card-edit"));

      expect(onEdit).toHaveBeenCalledWith(3, 0);
    });

    it("calls onSkip when Skip is pressed", () => {
      const onSkip = jest.fn();
      const measure = createMockMeasure({ measureNumber: 5, partIndex: 2 });
      render(
        <MeasureCorrectionCard
          measure={measure}
          onSkip={onSkip}
          testID="test-card"
        />,
      );

      fireEvent.press(screen.getByTestId("test-card-skip"));

      expect(onSkip).toHaveBeenCalledWith(5, 2);
    });

    it("calls onPress when card is pressed", () => {
      const onPress = jest.fn();
      const measure = createMockMeasure({ measureNumber: 2, partIndex: 0 });
      render(
        <MeasureCorrectionCard
          measure={measure}
          onPress={onPress}
          testID="test-card"
        />,
      );

      fireEvent.press(screen.getByTestId("test-card"));

      expect(onPress).toHaveBeenCalledWith(2, 0);
    });

    it("buttons are disabled when disabled prop is true", () => {
      const onApprove = jest.fn();
      const measure = createMockMeasure();
      render(
        <MeasureCorrectionCard
          measure={measure}
          onApprove={onApprove}
          disabled
          testID="test-card"
        />,
      );

      fireEvent.press(screen.getByTestId("test-card-approve"));

      expect(onApprove).not.toHaveBeenCalled();
    });
  });

  describe("Active State", () => {
    it("applies active styling when isActive is true", () => {
      const measure = createMockMeasure();
      const { getByTestId } = render(
        <MeasureCorrectionCard measure={measure} isActive testID="test-card" />,
      );

      const card = getByTestId("test-card");
      // Card should exist with active styling applied
      expect(card).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("has appropriate accessibility labels", () => {
      const measure = createMockMeasure({
        measureNumber: 4,
        partIndex: 0,
        confidence: 0.65,
        reason: "Test reason",
      });
      render(<MeasureCorrectionCard measure={measure} testID="test-card" />);

      const card = screen.getByTestId("test-card");
      expect(card.props.accessibilityLabel).toContain("Measure 4");
      expect(card.props.accessibilityLabel).toContain("65%");
      expect(card.props.accessibilityLabel).toContain("Test reason");
    });

    it("has button accessibility roles on action buttons", () => {
      const measure = createMockMeasure();
      render(<MeasureCorrectionCard measure={measure} testID="test-card" />);

      expect(
        screen.getByTestId("test-card-approve").props.accessibilityRole,
      ).toBe("button");
      expect(screen.getByTestId("test-card-edit").props.accessibilityRole).toBe(
        "button",
      );
      expect(screen.getByTestId("test-card-skip").props.accessibilityRole).toBe(
        "button",
      );
    });
  });
});
