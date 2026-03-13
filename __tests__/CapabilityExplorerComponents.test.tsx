/**
 * Tests for CapabilityExplorer components
 */
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import DetailRow from "../src/screens/Admin/tabs/CapabilityExplorer/components/DetailRow";
import FormField from "../src/screens/Admin/tabs/CapabilityExplorer/components/FormField";
import CapabilityDetailView from "../src/screens/Admin/tabs/CapabilityExplorer/components/CapabilityDetailView";

describe("DetailRow", () => {
  it("renders label and value", () => {
    const { getByText } = render(
      <DetailRow label="Name" value="Test Capability" />,
    );

    expect(getByText("Name:")).toBeTruthy();
    expect(getByText("Test Capability")).toBeTruthy();
  });

  it("renders with numeric value", () => {
    const { getByText } = render(<DetailRow label="Threshold" value={85} />);

    expect(getByText("Threshold:")).toBeTruthy();
    expect(getByText("85")).toBeTruthy();
  });

  it("renders with custom value style", () => {
    const customStyle = { color: "red" };
    const { getByText } = render(
      <DetailRow label="Status" value="Active" valueStyle={customStyle} />,
    );

    expect(getByText("Status:")).toBeTruthy();
    expect(getByText("Active")).toBeTruthy();
  });

  it("handles undefined value", () => {
    const { getByText, queryByText } = render(
      <DetailRow label="Description" value={undefined} />,
    );

    expect(getByText("Description:")).toBeTruthy();
  });

  it("handles empty string value", () => {
    const { getByText } = render(<DetailRow label="Notes" value="" />);

    expect(getByText("Notes:")).toBeTruthy();
  });
});

describe("FormField", () => {
  const mockOnChangeText = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders label and input", () => {
    const { getByText, getByPlaceholderText } = render(
      <FormField
        label="Capability Name"
        value=""
        onChangeText={mockOnChangeText}
        placeholder="Enter name..."
      />,
    );

    expect(getByText("Capability Name")).toBeTruthy();
    expect(getByPlaceholderText("Enter name...")).toBeTruthy();
  });

  it("calls onChangeText when input changes", () => {
    const { getByPlaceholderText } = render(
      <FormField
        label="Name"
        value=""
        onChangeText={mockOnChangeText}
        placeholder="Enter..."
      />,
    );

    const input = getByPlaceholderText("Enter...");
    fireEvent.changeText(input, "New Value");

    expect(mockOnChangeText).toHaveBeenCalledWith("New Value");
  });

  it("displays error message when error prop provided", () => {
    const { getByText } = render(
      <FormField
        label="Name"
        value=""
        onChangeText={mockOnChangeText}
        error="This field is required"
      />,
    );

    expect(getByText("This field is required")).toBeTruthy();
  });

  it("does not show error when error prop is undefined", () => {
    const { queryByText } = render(
      <FormField label="Name" value="test" onChangeText={mockOnChangeText} />,
    );

    // Should not have any error text
    expect(queryByText(/required|error|invalid/i)).toBeNull();
  });

  it("displays current value", () => {
    const { getByDisplayValue } = render(
      <FormField
        label="Name"
        value="Current Value"
        onChangeText={mockOnChangeText}
      />,
    );

    expect(getByDisplayValue("Current Value")).toBeTruthy();
  });

  it("uses default keyboardType", () => {
    const { getByPlaceholderText } = render(
      <FormField
        label="Name"
        value=""
        onChangeText={mockOnChangeText}
        placeholder="Enter..."
      />,
    );

    const input = getByPlaceholderText("Enter...");
    // Default is 'default' but we just verify it renders
    expect(input).toBeTruthy();
  });

  it("uses numeric keyboardType when specified", () => {
    const { getByPlaceholderText } = render(
      <FormField
        label="Threshold"
        value=""
        onChangeText={mockOnChangeText}
        placeholder="Enter number..."
        keyboardType="numeric"
      />,
    );

    const input = getByPlaceholderText("Enter number...");
    expect(input.props.keyboardType).toBe("numeric");
  });

  it("uses specified autoCapitalize value", () => {
    const { getByPlaceholderText } = render(
      <FormField
        label="ID"
        value=""
        onChangeText={mockOnChangeText}
        placeholder="Enter ID..."
        autoCapitalize="none"
      />,
    );

    const input = getByPlaceholderText("Enter ID...");
    expect(input.props.autoCapitalize).toBe("none");
  });
});

describe("CapabilityDetailView", () => {
  const mockCapability = {
    id: 1,
    name: "pitch_direction",
    display_name: "Pitch Direction",
    domain: "aural_skills",
    subdomain: "pitch",
    bit_index: 5,
    is_active: true,
    difficulty_tier: 1,
    difficulty_weight: 1.0,
    requirement_type: "required",
  };

  const mockCallbacks = {
    onClose: jest.fn(),
    onEdit: jest.fn(),
    onArchive: jest.fn(),
    onRestore: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when capability is null", () => {
    const { toJSON } = render(
      <CapabilityDetailView
        capability={null}
        dependencyGraph={null}
        {...mockCallbacks}
      />,
    );

    expect(toJSON()).toBeNull();
  });

  it("renders capability name and display name", () => {
    const { getAllByText, getByText } = render(
      <CapabilityDetailView
        capability={mockCapability}
        dependencyGraph={null}
        {...mockCallbacks}
      />,
    );

    // Display name appears in header and in detail row
    expect(getAllByText("Pitch Direction").length).toBeGreaterThan(0);
    expect(getByText("pitch_direction")).toBeTruthy();
  });

  it("renders basic info section", () => {
    const { getByText } = render(
      <CapabilityDetailView
        capability={mockCapability}
        dependencyGraph={null}
        {...mockCallbacks}
      />,
    );

    expect(getByText("Basic Info")).toBeTruthy();
    expect(getByText("Name:")).toBeTruthy();
    expect(getByText("Domain:")).toBeTruthy();
    expect(getByText("aural_skills")).toBeTruthy();
  });

  it("shows Archive button for active capabilities", () => {
    const { getByRole } = render(
      <CapabilityDetailView
        capability={mockCapability}
        dependencyGraph={null}
        {...mockCallbacks}
      />,
    );

    expect(getByRole("button", { name: /archive capability/i })).toBeTruthy();
  });

  it("shows Restore button for inactive capabilities", () => {
    const inactiveCapability = { ...mockCapability, is_active: false };
    const { getByRole } = render(
      <CapabilityDetailView
        capability={inactiveCapability}
        dependencyGraph={null}
        {...mockCallbacks}
      />,
    );

    expect(getByRole("button", { name: /restore capability/i })).toBeTruthy();
  });

  it("calls onClose when close button pressed", () => {
    const { getByRole } = render(
      <CapabilityDetailView
        capability={mockCapability}
        dependencyGraph={null}
        {...mockCallbacks}
      />,
    );

    fireEvent.press(getByRole("button", { name: /close detail view/i }));

    expect(mockCallbacks.onClose).toHaveBeenCalled();
  });

  it("calls onEdit when edit button pressed", () => {
    const { getByRole } = render(
      <CapabilityDetailView
        capability={mockCapability}
        dependencyGraph={null}
        {...mockCallbacks}
      />,
    );

    fireEvent.press(getByRole("button", { name: /edit capability/i }));

    expect(mockCallbacks.onEdit).toHaveBeenCalledWith(mockCapability);
  });

  it("calls onArchive when archive button pressed", () => {
    const { getByRole } = render(
      <CapabilityDetailView
        capability={mockCapability}
        dependencyGraph={null}
        {...mockCallbacks}
      />,
    );

    fireEvent.press(getByRole("button", { name: /archive capability/i }));

    expect(mockCallbacks.onArchive).toHaveBeenCalledWith(mockCapability);
  });

  it("shows delete confirmation when delete pressed", () => {
    const { getByRole, getByText } = render(
      <CapabilityDetailView
        capability={mockCapability}
        dependencyGraph={null}
        {...mockCallbacks}
      />,
    );

    fireEvent.press(getByRole("button", { name: /delete capability/i }));

    expect(
      getByText(/are you sure you want to permanently delete/i),
    ).toBeTruthy();
  });

  it("cancels delete confirmation", () => {
    const { getByRole, queryByText } = render(
      <CapabilityDetailView
        capability={mockCapability}
        dependencyGraph={null}
        {...mockCallbacks}
      />,
    );

    // Open delete confirm
    fireEvent.press(getByRole("button", { name: /delete capability/i }));
    expect(queryByText(/are you sure/i)).toBeTruthy();

    // Cancel
    fireEvent.press(getByRole("button", { name: /cancel delete/i }));
    expect(queryByText(/are you sure/i)).toBeNull();
  });

  it("confirms delete and calls onDelete", () => {
    const { getByRole } = render(
      <CapabilityDetailView
        capability={mockCapability}
        dependencyGraph={null}
        {...mockCallbacks}
      />,
    );

    // Open delete confirm
    fireEvent.press(getByRole("button", { name: /delete capability/i }));
    // Confirm
    fireEvent.press(getByRole("button", { name: /confirm delete/i }));

    expect(mockCallbacks.onDelete).toHaveBeenCalledWith(mockCapability);
  });

  it("handles capability without subdomain", () => {
    const capWithoutSubdomain = { ...mockCapability, subdomain: null };
    const { getByText } = render(
      <CapabilityDetailView
        capability={capWithoutSubdomain}
        dependencyGraph={null}
        {...mockCallbacks}
      />,
    );

    expect(getByText("None")).toBeTruthy();
  });
});
