/**
 * CorrectionPanel Tests
 */

import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";

import { CorrectionPanel } from "../src/features/importMusic/components/CorrectionPanel";
import type { CorrectionMeasure } from "../src/features/importMusic/components/correctionTypes";

// ============================================================================
// Test Data
// ============================================================================

const createMockMeasures = (
  count: number,
  statusOverrides: Partial<Record<number, CorrectionMeasure["status"]>> = {},
): CorrectionMeasure[] =>
  Array.from({ length: count }, (_, i) => ({
    measureNumber: i + 1,
    partIndex: 0,
    confidence: 0.5 + Math.random() * 0.3,
    reason: `Issue in measure ${i + 1}`,
    status: statusOverrides[i + 1] ?? "pending",
  }));

// ============================================================================
// Tests
// ============================================================================

describe("CorrectionPanel", () => {
  describe("Empty State", () => {
    it("renders empty state when no measures", () => {
      render(<CorrectionPanel measures={[]} testID="test-panel" />);

      expect(screen.getByTestId("test-panel-empty")).toBeTruthy();
      expect(screen.getByText("Looking Good!")).toBeTruthy();
    });

    it("displays encouraging message when empty", () => {
      render(<CorrectionPanel measures={[]} testID="test-panel" />);

      expect(screen.getByText(/No measures flagged as uncertain/)).toBeTruthy();
    });
  });

  describe("Progress Display", () => {
    it("renders progress header", () => {
      const measures = createMockMeasures(5);
      render(<CorrectionPanel measures={measures} testID="test-panel" />);

      expect(screen.getByTestId("test-panel-progress")).toBeTruthy();
    });

    it("displays correct count of pending vs total", () => {
      const measures = createMockMeasures(5);
      render(<CorrectionPanel measures={measures} testID="test-panel" />);

      expect(screen.getByText("0 of 5 Reviewed")).toBeTruthy();
      expect(screen.getByText("0%")).toBeTruthy();
    });

    it("updates progress when measures are approved", () => {
      const measures = createMockMeasures(5, {
        1: "approved",
        2: "approved",
      });
      render(<CorrectionPanel measures={measures} testID="test-panel" />);

      expect(screen.getByText("2 of 5 Reviewed")).toBeTruthy();
      expect(screen.getByText("40%")).toBeTruthy();
    });

    it("displays approved, edited, and skipped counts", () => {
      const measures = createMockMeasures(6, {
        1: "approved",
        2: "approved",
        3: "edited",
        4: "skipped",
      });
      render(<CorrectionPanel measures={measures} testID="test-panel" />);

      expect(screen.getByText("2 Approved")).toBeTruthy();
      expect(screen.getByText("1 Edited")).toBeTruthy();
      expect(screen.getByText("1 Skipped")).toBeTruthy();
    });
  });

  describe("Measure List", () => {
    it("renders all measures", () => {
      const measures = createMockMeasures(3);
      render(<CorrectionPanel measures={measures} testID="test-panel" />);

      expect(screen.getByTestId("test-panel-card-1-0")).toBeTruthy();
      expect(screen.getByTestId("test-panel-card-2-0")).toBeTruthy();
      expect(screen.getByTestId("test-panel-card-3-0")).toBeTruthy();
    });

    it("separates pending and reviewed measures", () => {
      const measures = createMockMeasures(4, {
        1: "approved",
        3: "edited",
      });
      render(<CorrectionPanel measures={measures} testID="test-panel" />);

      expect(screen.getByTestId("test-panel-pending-section")).toBeTruthy();
      expect(screen.getByTestId("test-panel-reviewed-section")).toBeTruthy();
    });

    it("displays Needs Review section for pending", () => {
      const measures = createMockMeasures(2);
      render(<CorrectionPanel measures={measures} testID="test-panel" />);

      expect(screen.getByText("Needs Review")).toBeTruthy();
    });

    it("displays Reviewed section for non-pending", () => {
      const measures = createMockMeasures(2, { 1: "approved" });
      render(<CorrectionPanel measures={measures} testID="test-panel" />);

      expect(screen.getByText("Reviewed")).toBeTruthy();
    });
  });

  describe("User Interactions", () => {
    it("calls onApprove when measure is approved", () => {
      const onApprove = jest.fn();
      const measures = createMockMeasures(2);
      render(
        <CorrectionPanel
          measures={measures}
          onApprove={onApprove}
          testID="test-panel"
        />,
      );

      const approveButton = screen.getByTestId("test-panel-card-1-0-approve");
      fireEvent.press(approveButton);

      expect(onApprove).toHaveBeenCalledWith(1, 0);
    });

    it("calls onSkip when measure is skipped", () => {
      const onSkip = jest.fn();
      const measures = createMockMeasures(2);
      render(
        <CorrectionPanel
          measures={measures}
          onSkip={onSkip}
          testID="test-panel"
        />,
      );

      const skipButton = screen.getByTestId("test-panel-card-1-0-skip");
      fireEvent.press(skipButton);

      expect(onSkip).toHaveBeenCalledWith(1, 0);
    });

    it("calls onSelectMeasure when edit is pressed", () => {
      const onSelectMeasure = jest.fn();
      const measures = createMockMeasures(2);
      render(
        <CorrectionPanel
          measures={measures}
          onSelectMeasure={onSelectMeasure}
          testID="test-panel"
        />,
      );

      const editButton = screen.getByTestId("test-panel-card-1-0-edit");
      fireEvent.press(editButton);

      expect(onSelectMeasure).toHaveBeenCalledWith(1, 0);
    });

    it("calls onSelectMeasure when card is pressed", () => {
      const onSelectMeasure = jest.fn();
      const measures = createMockMeasures(2);
      render(
        <CorrectionPanel
          measures={measures}
          onSelectMeasure={onSelectMeasure}
          testID="test-panel"
        />,
      );

      const card = screen.getByTestId("test-panel-card-1-0");
      fireEvent.press(card);

      expect(onSelectMeasure).toHaveBeenCalledWith(1, 0);
    });
  });

  describe("Bulk Actions", () => {
    it("renders Approve All button when there are pending measures", () => {
      const measures = createMockMeasures(3);
      render(<CorrectionPanel measures={measures} testID="test-panel" />);

      expect(
        screen.getByTestId("test-panel-bulk-actions-approve-all"),
      ).toBeTruthy();
    });

    it("hides Approve All button when no pending measures", () => {
      const measures = createMockMeasures(2, {
        1: "approved",
        2: "approved",
      });
      render(<CorrectionPanel measures={measures} testID="test-panel" />);

      expect(
        screen.queryByTestId("test-panel-bulk-actions-approve-all"),
      ).toBeNull();
    });

    it("calls onApproveAll when Approve All is pressed", () => {
      const onApproveAll = jest.fn();
      const measures = createMockMeasures(3);
      render(
        <CorrectionPanel
          measures={measures}
          onApproveAll={onApproveAll}
          testID="test-panel"
        />,
      );

      fireEvent.press(
        screen.getByTestId("test-panel-bulk-actions-approve-all"),
      );

      expect(onApproveAll).toHaveBeenCalled();
    });

    it("enables Done button when all measures reviewed", () => {
      const onComplete = jest.fn();
      const measures = createMockMeasures(2, {
        1: "approved",
        2: "approved",
      });
      render(
        <CorrectionPanel
          measures={measures}
          onComplete={onComplete}
          testID="test-panel"
        />,
      );

      const completeButton = screen.getByTestId(
        "test-panel-bulk-actions-complete",
      );
      fireEvent.press(completeButton);

      expect(onComplete).toHaveBeenCalled();
    });

    it("disables Done button when measures pending", () => {
      const onComplete = jest.fn();
      const measures = createMockMeasures(2);
      render(
        <CorrectionPanel
          measures={measures}
          onComplete={onComplete}
          testID="test-panel"
        />,
      );

      const completeButton = screen.getByTestId(
        "test-panel-bulk-actions-complete",
      );
      fireEvent.press(completeButton);

      expect(onComplete).not.toHaveBeenCalled();
    });

    it("shows Review All to Continue when measures pending", () => {
      const measures = createMockMeasures(2);
      render(<CorrectionPanel measures={measures} testID="test-panel" />);

      expect(screen.getByText("Review All to Continue")).toBeTruthy();
    });

    it("shows Done when all measures reviewed", () => {
      const measures = createMockMeasures(2, {
        1: "approved",
        2: "approved",
      });
      render(<CorrectionPanel measures={measures} testID="test-panel" />);

      expect(screen.getByText("Done")).toBeTruthy();
    });
  });

  describe("Cancel Button", () => {
    it("renders cancel button when onCancel provided", () => {
      const measures = createMockMeasures(2);
      render(
        <CorrectionPanel
          measures={measures}
          onCancel={() => {}}
          testID="test-panel"
        />,
      );

      expect(screen.getByTestId("test-panel-cancel")).toBeTruthy();
    });

    it("calls onCancel when cancel is pressed", () => {
      const onCancel = jest.fn();
      const measures = createMockMeasures(2);
      render(
        <CorrectionPanel
          measures={measures}
          onCancel={onCancel}
          testID="test-panel"
        />,
      );

      fireEvent.press(screen.getByTestId("test-panel-cancel"));

      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe("Selected Measure", () => {
    it("highlights selected measure", () => {
      const measures = createMockMeasures(3);
      render(
        <CorrectionPanel
          measures={measures}
          selectedMeasure={{ measureNumber: 2, partIndex: 0 }}
          testID="test-panel"
        />,
      );

      // The card should be marked as active (visual check)
      expect(screen.getByTestId("test-panel-card-2-0")).toBeTruthy();
    });
  });

  describe("Loading State", () => {
    it("disables interactions when loading", () => {
      const onApprove = jest.fn();
      const measures = createMockMeasures(2);
      render(
        <CorrectionPanel
          measures={measures}
          onApprove={onApprove}
          isLoading
          testID="test-panel"
        />,
      );

      fireEvent.press(screen.getByTestId("test-panel-card-1-0-approve"));

      expect(onApprove).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("progress has progressbar role", () => {
      const measures = createMockMeasures(3);
      render(<CorrectionPanel measures={measures} testID="test-panel" />);

      const progress = screen.getByTestId("test-panel-progress");
      expect(progress.props.accessibilityRole).toBe("progressbar");
    });

    it("bulk action buttons have button role", () => {
      const measures = createMockMeasures(2);
      render(<CorrectionPanel measures={measures} testID="test-panel" />);

      const approveAll = screen.getByTestId(
        "test-panel-bulk-actions-approve-all",
      );
      expect(approveAll.props.accessibilityRole).toBe("button");
    });
  });
});
