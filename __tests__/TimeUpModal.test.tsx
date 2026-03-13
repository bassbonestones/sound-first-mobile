/**
 * @fileoverview Tests for TimeUpModal component
 * Shows when target session duration is reached
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import TimeUpModal from "../src/screens/Session/components/TimeUpModal";

describe("TimeUpModal", () => {
  const mockOnDismiss = jest.fn();
  const mockOnExtend = jest.fn();
  const mockOnFinish = jest.fn();

  const defaultProps = {
    visible: true,
    onDismiss: mockOnDismiss,
    onExtend: mockOnExtend,
    onFinish: mockOnFinish,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // VISIBILITY TESTS
  // ==========================================================================
  describe("Visibility", () => {
    it("renders when visible is true", () => {
      const { getByText } = render(<TimeUpModal {...defaultProps} />);
      expect(getByText("Time's Up!")).toBeTruthy();
    });

    it("does not render content when visible is false", () => {
      const { queryByText } = render(
        <TimeUpModal {...defaultProps} visible={false} />,
      );
      expect(queryByText("Time's Up!")).toBeNull();
    });
  });

  // ==========================================================================
  // CONTENT TESTS
  // ==========================================================================
  describe("Content", () => {
    it("renders clock emoji", () => {
      const { getByText } = render(<TimeUpModal {...defaultProps} />);
      expect(getByText("⏰")).toBeTruthy();
    });

    it("renders title", () => {
      const { getByText } = render(<TimeUpModal {...defaultProps} />);
      expect(getByText("Time's Up!")).toBeTruthy();
    });

    it("renders subtitle", () => {
      const { getByText } = render(<TimeUpModal {...defaultProps} />);
      expect(
        getByText("You've reached your planned practice duration."),
      ).toBeTruthy();
    });

    it("renders message", () => {
      const { getByText } = render(<TimeUpModal {...defaultProps} />);
      expect(
        getByText("Great work! Would you like to keep going or wrap up?"),
      ).toBeTruthy();
    });
  });

  // ==========================================================================
  // BUTTON TESTS
  // ==========================================================================
  describe("Buttons", () => {
    it("renders Keep Going button", () => {
      const { getByText } = render(<TimeUpModal {...defaultProps} />);
      expect(getByText("Keep Going")).toBeTruthy();
    });

    it("renders Add More Material button", () => {
      const { getByText } = render(<TimeUpModal {...defaultProps} />);
      expect(getByText("Add More Material")).toBeTruthy();
    });

    it("renders Finish Session button", () => {
      const { getByText } = render(<TimeUpModal {...defaultProps} />);
      expect(getByText("Finish Session")).toBeTruthy();
    });

    it("calls onDismiss when Keep Going is pressed", () => {
      const { getByText } = render(<TimeUpModal {...defaultProps} />);
      fireEvent.press(getByText("Keep Going"));
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it("calls onExtend when Add More Material is pressed", () => {
      const { getByText } = render(<TimeUpModal {...defaultProps} />);
      fireEvent.press(getByText("Add More Material"));
      expect(mockOnExtend).toHaveBeenCalledTimes(1);
    });

    it("calls onFinish when Finish Session is pressed", () => {
      const { getByText } = render(<TimeUpModal {...defaultProps} />);
      fireEvent.press(getByText("Finish Session"));
      expect(mockOnFinish).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================
  describe("Accessibility", () => {
    it("has accessible Keep Going button", () => {
      const { getByLabelText } = render(<TimeUpModal {...defaultProps} />);
      expect(getByLabelText("Keep practicing")).toBeTruthy();
    });

    it("has accessible Add More Material button", () => {
      const { getByLabelText } = render(<TimeUpModal {...defaultProps} />);
      expect(getByLabelText("Add more practice material")).toBeTruthy();
    });

    it("has accessible Finish Session button", () => {
      const { getByLabelText } = render(<TimeUpModal {...defaultProps} />);
      expect(getByLabelText("Finish practice session")).toBeTruthy();
    });

    it("all buttons have button role", () => {
      const { getAllByRole } = render(<TimeUpModal {...defaultProps} />);
      const buttons = getAllByRole("button");
      expect(buttons.length).toBe(3);
    });
  });

  // ==========================================================================
  // OPTIONAL PROPS TESTS
  // ==========================================================================
  describe("Optional Props", () => {
    it("renders without onExtend prop", () => {
      const props = { ...defaultProps, onExtend: undefined };
      const { getByText } = render(<TimeUpModal {...props} />);
      expect(getByText("Add More Material")).toBeTruthy();
    });
  });
});
