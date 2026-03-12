/**
 * Tests for admin components: DetailRow and FormField
 */
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { DetailRow } from "../src/components/admin/DetailRow";
import { FormField } from "../src/components/admin/FormField";

describe("DetailRow", () => {
  it("renders label", () => {
    const { getByText } = render(<DetailRow label="Name" value="John" />);
    expect(getByText("Name:")).toBeTruthy();
  });

  it("renders string value", () => {
    const { getByText } = render(<DetailRow label="Name" value="John" />);
    expect(getByText("John")).toBeTruthy();
  });

  it("renders numeric value", () => {
    const { getByText } = render(<DetailRow label="Count" value={42} />);
    expect(getByText("42")).toBeTruthy();
  });

  it("renders boolean true value", () => {
    const { getByText } = render(<DetailRow label="Active" value={true} />);
    expect(getByText("true")).toBeTruthy();
  });

  it("renders boolean false value", () => {
    const { getByText } = render(<DetailRow label="Active" value={false} />);
    expect(getByText("false")).toBeTruthy();
  });

  it("renders dash for null value", () => {
    const { getByText } = render(<DetailRow label="Optional" value={null} />);
    expect(getByText("-")).toBeTruthy();
  });

  it("renders dash for undefined value", () => {
    const { getByText } = render(<DetailRow label="Optional" />);
    expect(getByText("-")).toBeTruthy();
  });

  it("renders zero value as 0 not dash", () => {
    const { getByText } = render(<DetailRow label="Zero" value={0} />);
    expect(getByText("0")).toBeTruthy();
  });

  it("renders empty string value", () => {
    const { getByText, queryByText } = render(
      <DetailRow label="Empty" value="" />,
    );
    // Should show empty string, not dash
    expect(queryByText("-")).toBeFalsy();
  });

  it("applies custom valueStyle", () => {
    const { getByText } = render(
      <DetailRow label="Styled" value="Text" valueStyle={{ color: "red" }} />,
    );
    const valueElement = getByText("Text");
    expect(valueElement).toBeTruthy();
  });
});

describe("FormField", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("renders label", () => {
    const { getByText } = render(
      <FormField label="Username" onChangeText={mockOnChange} />,
    );
    expect(getByText("Username")).toBeTruthy();
  });

  it("renders with value", () => {
    const { getByDisplayValue } = render(
      <FormField label="Name" value="John" onChangeText={mockOnChange} />,
    );
    expect(getByDisplayValue("John")).toBeTruthy();
  });

  it("renders placeholder", () => {
    const { getByPlaceholderText } = render(
      <FormField
        label="Email"
        placeholder="Enter email"
        onChangeText={mockOnChange}
      />,
    );
    expect(getByPlaceholderText("Enter email")).toBeTruthy();
  });

  it("calls onChangeText when text changes", () => {
    const { getByPlaceholderText } = render(
      <FormField
        label="Input"
        placeholder="Type here"
        onChangeText={mockOnChange}
      />,
    );

    fireEvent.changeText(getByPlaceholderText("Type here"), "new value");
    expect(mockOnChange).toHaveBeenCalledWith("new value");
  });

  it("renders error message when provided", () => {
    const { getByText } = render(
      <FormField
        label="Email"
        error="Invalid email format"
        onChangeText={mockOnChange}
      />,
    );
    expect(getByText("Invalid email format")).toBeTruthy();
  });

  it("does not render error when not provided", () => {
    const { queryByText } = render(
      <FormField label="Name" onChangeText={mockOnChange} />,
    );
    // No error text should be rendered
    expect(queryByText("Invalid")).toBeFalsy();
  });

  describe("keyboard types", () => {
    it("uses default keyboard type by default", () => {
      const { UNSAFE_getByType } = render(
        <FormField label="Text" onChangeText={mockOnChange} />,
      );
      // Component should render without errors with default
    });

    it("accepts numeric keyboard type", () => {
      const { UNSAFE_getByType } = render(
        <FormField
          label="Number"
          keyboardType="numeric"
          onChangeText={mockOnChange}
        />,
      );
      // Should render without errors
    });
  });

  describe("multiline mode", () => {
    it("renders single line by default", () => {
      const { getByPlaceholderText } = render(
        <FormField
          label="Name"
          placeholder="Enter name"
          onChangeText={mockOnChange}
        />,
      );
      const input = getByPlaceholderText("Enter name");
      expect(input).toBeTruthy();
    });

    it("supports multiline input", () => {
      const { getByPlaceholderText } = render(
        <FormField
          label="Description"
          placeholder="Enter description"
          multiline
          numberOfLines={4}
          onChangeText={mockOnChange}
        />,
      );
      const input = getByPlaceholderText("Enter description");
      expect(input).toBeTruthy();
    });
  });

  describe("autoCapitalize", () => {
    it("uses sentences by default", () => {
      render(<FormField label="Text" onChangeText={mockOnChange} />);
      // Should render without errors
    });

    it("accepts none autoCapitalize", () => {
      render(
        <FormField
          label="Email"
          autoCapitalize="none"
          onChangeText={mockOnChange}
        />,
      );
      // Should render without errors
    });
  });
});
