/**
 * Tests for FormField component (SoftGateExplorer version)
 */
import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import FormField from "../../src/screens/Admin/tabs/SoftGateExplorer/components/FormField";

// Mock styles
jest.mock("../../src/screens/Admin/styles", () => ({
  formFieldContainer: {},
  formFieldLabel: {},
  formFieldInput: {},
  formFieldInputError: {},
  formFieldError: {},
}));

describe("FormField (SoftGateExplorer)", () => {
  const mockOnChangeText = jest.fn();

  const defaultProps = {
    label: "Field Label",
    value: "field value",
    onChangeText: mockOnChangeText,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders label text", () => {
      render(<FormField {...defaultProps} />);
      expect(screen.getByText("Field Label")).toBeTruthy();
    });

    it("renders input with value", () => {
      render(<FormField {...defaultProps} />);
      expect(screen.getByDisplayValue("field value")).toBeTruthy();
    });

    it("renders placeholder when provided", () => {
      render(<FormField {...defaultProps} placeholder="Type here" />);
      expect(screen.getByPlaceholderText("Type here")).toBeTruthy();
    });

    it("shows error text when error provided", () => {
      render(<FormField {...defaultProps} error="Required field" />);
      expect(screen.getByText("Required field")).toBeTruthy();
    });

    it("hides error text when no error", () => {
      render(<FormField {...defaultProps} />);
      expect(screen.queryByText("Required field")).toBeNull();
    });
  });

  describe("Input Behavior", () => {
    it("calls onChangeText on input change", () => {
      render(<FormField {...defaultProps} />);
      fireEvent.changeText(screen.getByDisplayValue("field value"), "updated");
      expect(mockOnChangeText).toHaveBeenCalledWith("updated");
    });

    it("uses numeric keyboard when specified", () => {
      render(<FormField {...defaultProps} keyboardType="numeric" />);
      const input = screen.getByDisplayValue("field value");
      expect(input.props.keyboardType).toBe("numeric");
    });

    it("uses decimal-pad keyboard when specified", () => {
      render(<FormField {...defaultProps} keyboardType="decimal-pad" />);
      const input = screen.getByDisplayValue("field value");
      expect(input.props.keyboardType).toBe("decimal-pad");
    });

    it("disables autoCapitalize when set to none", () => {
      render(<FormField {...defaultProps} autoCapitalize="none" />);
      const input = screen.getByDisplayValue("field value");
      expect(input.props.autoCapitalize).toBe("none");
    });
  });

  describe("Edge Cases", () => {
    it("handles empty string value", () => {
      render(<FormField {...defaultProps} value="" placeholder="Empty" />);
      expect(screen.getByPlaceholderText("Empty")).toBeTruthy();
    });

    it("handles long labels", () => {
      render(
        <FormField {...defaultProps} label="A very long field label text" />,
      );
      expect(screen.getByText("A very long field label text")).toBeTruthy();
    });
  });
});
