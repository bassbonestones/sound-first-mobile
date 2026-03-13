/**
 * Tests for FormField component (CapabilityExplorer version)
 */
import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import FormField from "../../src/screens/Admin/tabs/CapabilityExplorer/components/FormField";

// Mock styles
jest.mock("../../src/screens/Admin/styles", () => ({
  formFieldContainer: {},
  formFieldLabel: {},
  formFieldInput: {},
  formFieldInputError: {},
  formFieldError: {},
}));

describe("FormField", () => {
  const mockOnChangeText = jest.fn();

  const defaultProps = {
    label: "Test Label",
    value: "test value",
    onChangeText: mockOnChangeText,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders label", () => {
      render(<FormField {...defaultProps} />);
      expect(screen.getByText("Test Label")).toBeTruthy();
    });

    it("renders value in input", () => {
      render(<FormField {...defaultProps} />);
      expect(screen.getByDisplayValue("test value")).toBeTruthy();
    });

    it("renders placeholder", () => {
      render(<FormField {...defaultProps} placeholder="Enter value" />);
      expect(screen.getByPlaceholderText("Enter value")).toBeTruthy();
    });

    it("does not render error when not provided", () => {
      render(<FormField {...defaultProps} />);
      expect(screen.queryByText(/error/i)).toBeNull();
    });

    it("renders error when provided", () => {
      render(<FormField {...defaultProps} error="This field is required" />);
      expect(screen.getByText("This field is required")).toBeTruthy();
    });
  });

  describe("Input Interaction", () => {
    it("calls onChangeText when text changes", () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByDisplayValue("test value");
      fireEvent.changeText(input, "new value");
      expect(mockOnChangeText).toHaveBeenCalledWith("new value");
    });

    it("uses default keyboardType", () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByDisplayValue("test value");
      expect(input.props.keyboardType).toBe("default");
    });

    it("uses custom keyboardType when provided", () => {
      render(<FormField {...defaultProps} keyboardType="numeric" />);
      const input = screen.getByDisplayValue("test value");
      expect(input.props.keyboardType).toBe("numeric");
    });

    it("uses default autoCapitalize", () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByDisplayValue("test value");
      expect(input.props.autoCapitalize).toBe("sentences");
    });

    it("uses custom autoCapitalize when provided", () => {
      render(<FormField {...defaultProps} autoCapitalize="none" />);
      const input = screen.getByDisplayValue("test value");
      expect(input.props.autoCapitalize).toBe("none");
    });
  });

  describe("Empty Value", () => {
    it("handles empty value", () => {
      const { UNSAFE_root } = render(<FormField {...defaultProps} value="" />);
      const input = UNSAFE_root.findAllByType("TextInput")[0];
      expect(input).toBeTruthy();
      expect(input.props.value).toBe("");
    });

    it("handles undefined value", () => {
      render(<FormField {...defaultProps} value={undefined} />);
      expect(screen.getByText("Test Label")).toBeTruthy();
    });
  });

  describe("Styling", () => {
    it("applies error styling when error present", () => {
      const { UNSAFE_root } = render(
        <FormField {...defaultProps} error="Error message" />,
      );
      const textInput = UNSAFE_root.findAllByType("TextInput")[0];
      expect(textInput.props.style).toBeTruthy();
    });
  });
});
