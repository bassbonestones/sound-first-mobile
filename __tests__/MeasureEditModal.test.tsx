/**
 * MeasureEditModal Tests
 */

import React from "react";
import {
  render,
  fireEvent,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { MeasureEditModal } from "../src/features/importMusic/components/MeasureEditModal";
import type {
  CorrectionMeasure,
  MeasureEdit,
} from "../src/features/importMusic/components/correctionTypes";

// ============================================================================
// Mocks
// ============================================================================

// Mock ScorePreview to avoid WebView complexity in tests
jest.mock("../src/features/importMusic/components/ScorePreview", () => ({
  ScorePreview: ({ testID }: { testID?: string }) => {
    const { View, Text } = require("react-native");
    return (
      <View testID={testID}>
        <Text>Mock Score Preview</Text>
      </View>
    );
  },
  HighlightedMeasure: {},
}));

// ============================================================================
// Test Data
// ============================================================================

const createMockMeasure = (
  overrides: Partial<CorrectionMeasure> = {},
): CorrectionMeasure => ({
  measureNumber: 4,
  partIndex: 0,
  confidence: 0.55,
  reason: "Uncertain rhythm detected",
  status: "pending",
  ...overrides,
});

const mockMusicXml = `<?xml version="1.0"?>
<score-partwise version="3.1">
  <part id="P1"><measure number="1" /></part>
</score-partwise>`;

// ============================================================================
// Tests
// ============================================================================

describe("MeasureEditModal", () => {
  const defaultProps = {
    visible: true,
    measure: createMockMeasure(),
    onSave: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders when visible with measure", () => {
      render(<MeasureEditModal {...defaultProps} testID="test-modal" />);

      expect(screen.getByTestId("test-modal")).toBeTruthy();
    });

    it("does not render content when measure is null", () => {
      render(
        <MeasureEditModal
          {...defaultProps}
          measure={null}
          testID="test-modal"
        />,
      );

      // Modal should exist but not be visible (visible=false passed to Modal)
      // The modal renders an empty View when measure is null
      expect(screen.queryByText("Edit Measure")).toBeNull();
    });

    it("displays measure number", () => {
      const measure = createMockMeasure({ measureNumber: 7 });
      render(
        <MeasureEditModal
          {...defaultProps}
          measure={measure}
          testID="test-modal"
        />,
      );

      expect(screen.getByText(/Measure 7/)).toBeTruthy();
    });

    it("displays part index when > 0", () => {
      const measure = createMockMeasure({ partIndex: 1 });
      render(
        <MeasureEditModal
          {...defaultProps}
          measure={measure}
          testID="test-modal"
        />,
      );

      expect(screen.getByText(/Part 2/)).toBeTruthy();
    });

    it("displays confidence", () => {
      const measure = createMockMeasure({ confidence: 0.42 });
      render(
        <MeasureEditModal
          {...defaultProps}
          measure={measure}
          testID="test-modal"
        />,
      );

      expect(screen.getByText(/42%/)).toBeTruthy();
    });

    it("displays reason", () => {
      const measure = createMockMeasure({ reason: "Blurry image area" });
      render(
        <MeasureEditModal
          {...defaultProps}
          measure={measure}
          testID="test-modal"
        />,
      );

      expect(screen.getByText("Blurry image area")).toBeTruthy();
    });

    it("displays header with title", () => {
      render(<MeasureEditModal {...defaultProps} testID="test-modal" />);

      expect(screen.getByText("Edit Measure")).toBeTruthy();
    });

    it("displays Cancel and Save buttons", () => {
      render(<MeasureEditModal {...defaultProps} testID="test-modal" />);

      expect(screen.getByText("Cancel")).toBeTruthy();
      expect(screen.getByText("Save")).toBeTruthy();
    });

    it("displays notes input", () => {
      render(<MeasureEditModal {...defaultProps} testID="test-modal" />);

      expect(screen.getByTestId("test-modal-notes-input")).toBeTruthy();
    });

    it("displays professional review toggle", () => {
      render(<MeasureEditModal {...defaultProps} testID="test-modal" />);

      expect(screen.getByTestId("test-modal-needs-review-toggle")).toBeTruthy();
    });

    it("displays quick approve action when onApprove provided", () => {
      render(
        <MeasureEditModal
          {...defaultProps}
          onApprove={() => {}}
          testID="test-modal"
        />,
      );

      expect(screen.getByTestId("test-modal-quick-approve")).toBeTruthy();
      expect(screen.getByText("Looks Correct")).toBeTruthy();
    });

    it("displays score preview when musicXml provided", () => {
      render(
        <MeasureEditModal
          {...defaultProps}
          musicXml={mockMusicXml}
          testID="test-modal"
        />,
      );

      expect(screen.getByTestId("test-modal-preview")).toBeTruthy();
    });

    it("does not display score preview when musicXml not provided", () => {
      render(<MeasureEditModal {...defaultProps} testID="test-modal" />);

      expect(screen.queryByTestId("test-modal-preview")).toBeNull();
    });

    it("displays future note about direct editing", () => {
      render(<MeasureEditModal {...defaultProps} testID="test-modal" />);

      expect(screen.getByText(/Direct note editing coming soon/)).toBeTruthy();
    });
  });

  describe("User Interactions", () => {
    it("calls onCancel when Cancel is pressed", () => {
      const onCancel = jest.fn();
      render(
        <MeasureEditModal
          {...defaultProps}
          onCancel={onCancel}
          testID="test-modal"
        />,
      );

      fireEvent.press(screen.getByTestId("test-modal-cancel"));

      expect(onCancel).toHaveBeenCalled();
    });

    it("calls onSave with measure info and notes", () => {
      const onSave = jest.fn();
      const measure = createMockMeasure({ measureNumber: 5, partIndex: 1 });
      render(
        <MeasureEditModal
          {...defaultProps}
          measure={measure}
          onSave={onSave}
          testID="test-modal"
        />,
      );

      // Enter notes
      fireEvent.changeText(
        screen.getByTestId("test-modal-notes-input"),
        "This is a test note",
      );

      // Save
      fireEvent.press(screen.getByTestId("test-modal-save"));

      expect(onSave).toHaveBeenCalledWith(5, 1, {
        notes: "This is a test note",
        needsReview: false,
      });
    });

    it("calls onSave with needsReview when toggle is on", () => {
      const onSave = jest.fn();
      render(
        <MeasureEditModal
          {...defaultProps}
          onSave={onSave}
          testID="test-modal"
        />,
      );

      // Toggle professional review
      fireEvent(
        screen.getByTestId("test-modal-needs-review-toggle"),
        "valueChange",
        true,
      );

      // Save
      fireEvent.press(screen.getByTestId("test-modal-save"));

      expect(onSave).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.objectContaining({ needsReview: true }),
      );
    });

    it("calls onApprove when quick approve is pressed", () => {
      const onApprove = jest.fn();
      const measure = createMockMeasure({ measureNumber: 3, partIndex: 0 });
      render(
        <MeasureEditModal
          {...defaultProps}
          measure={measure}
          onApprove={onApprove}
          testID="test-modal"
        />,
      );

      fireEvent.press(screen.getByTestId("test-modal-quick-approve"));

      expect(onApprove).toHaveBeenCalledWith(3, 0);
    });

    it("trims whitespace from notes", () => {
      const onSave = jest.fn();
      render(
        <MeasureEditModal
          {...defaultProps}
          onSave={onSave}
          testID="test-modal"
        />,
      );

      fireEvent.changeText(
        screen.getByTestId("test-modal-notes-input"),
        "   trimmed note   ",
      );
      fireEvent.press(screen.getByTestId("test-modal-save"));

      expect(onSave).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.objectContaining({ notes: "trimmed note" }),
      );
    });

    it("saves with undefined notes when input is empty", () => {
      const onSave = jest.fn();
      render(
        <MeasureEditModal
          {...defaultProps}
          onSave={onSave}
          testID="test-modal"
        />,
      );

      // Don't enter any notes, just save
      fireEvent.press(screen.getByTestId("test-modal-save"));

      expect(onSave).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.objectContaining({ notes: undefined }),
      );
    });
  });

  describe("Form Reset", () => {
    it("pre-fills notes from measure when available", () => {
      const measure = createMockMeasure({
        notes: "Existing note",
        status: "edited",
      });
      render(
        <MeasureEditModal
          {...defaultProps}
          measure={measure}
          testID="test-modal"
        />,
      );

      const input = screen.getByTestId("test-modal-notes-input");
      expect(input.props.value).toBe("Existing note");
    });
  });

  describe("Accessibility", () => {
    it("notes input has accessibility label", () => {
      render(<MeasureEditModal {...defaultProps} testID="test-modal" />);

      const input = screen.getByTestId("test-modal-notes-input");
      expect(input.props.accessibilityLabel).toBe("Correction notes");
    });

    it("toggle has switch accessibility role", () => {
      render(<MeasureEditModal {...defaultProps} testID="test-modal" />);

      const toggle = screen.getByTestId("test-modal-needs-review-toggle");
      expect(toggle.props.accessibilityRole).toBe("switch");
    });

    it("cancel button has button accessibility role", () => {
      render(<MeasureEditModal {...defaultProps} testID="test-modal" />);

      const cancel = screen.getByTestId("test-modal-cancel");
      expect(cancel.props.accessibilityRole).toBe("button");
    });

    it("save button has button accessibility role", () => {
      render(<MeasureEditModal {...defaultProps} testID="test-modal" />);

      const save = screen.getByTestId("test-modal-save");
      expect(save.props.accessibilityRole).toBe("button");
    });
  });
});
