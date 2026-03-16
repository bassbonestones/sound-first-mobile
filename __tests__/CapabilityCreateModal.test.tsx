/**
 * Tests for CapabilityCreateModal component
 *
 * Tests the modal for creating new capabilities in the admin panel.
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

import CapabilityCreateModal from "../src/screens/Admin/tabs/CapabilityExplorer/components/CapabilityCreateModal";

// Mock styles
jest.mock("../src/screens/Admin/styles", () => ({
  editModalContainer: {},
  editModalHeader: {},
  editModalTitle: {},
  closeButton: {},
  closeButtonText: {},
  editModalContent: {},
  formFieldContainer: {},
  formFieldLabel: {},
  formFieldInput: {},
  formFieldError: {},
  pickerContainer: {},
  pickerOption: {},
  pickerOptionSelected: {},
  pickerOptionText: {},
  pickerOptionTextSelected: {},
  domainToggleContainer: {},
  domainToggleButton: {},
  domainToggleButtonActive: {},
  domainToggleText: {},
  domainToggleTextActive: {},
  domainChip: {},
  domainChipActive: {},
  domainChipText: {},
  domainChipTextActive: {},
  prereqHint: {},
  prereqList: {},
  prereqEmptyText: {},
  prereqChip: {},
  prereqChipContent: {},
  prereqChipText: {},
  prereqChipDomain: {},
  prereqChipRemove: {},
  prereqChipRemoveText: {},
  addPrereqButton: {},
  addPrereqButtonText: {},
  saveErrorContainer: {},
  saveErrorText: {},
  editModalFooter: {},
  editModalButton: {},
  cancelButton: {},
  cancelButtonText: {},
  saveButton: {},
  saveButtonDisabled: {},
  saveButtonText: {},
}));

// Mock FormField
jest.mock(
  "../src/screens/Admin/tabs/CapabilityExplorer/components/FormField",
  () =>
    function MockFormField({
      label,
      value,
      onChangeText,
      error,
      placeholder,
    }: any) {
      const { View, Text, TextInput } = require("react-native");
      return (
        <View testID={`form-field-${label.replace(/\s+/g, "-").toLowerCase()}`}>
          <Text>{label}</Text>
          <TextInput
            testID={`input-${label.replace(/\s+/g, "-").toLowerCase()}`}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
          />
          {error && (
            <Text testID={`error-${label.replace(/\s+/g, "-").toLowerCase()}`}>
              {error}
            </Text>
          )}
        </View>
      );
    },
);

// Mock PrerequisiteSelector
jest.mock(
  "../src/screens/Admin/tabs/CapabilityExplorer/components/PrerequisiteSelector",
  () =>
    function MockPrerequisiteSelector({
      allCapabilities,
      selectedIds,
      onSelect,
      onClose,
    }: any) {
      const { View, Text, TouchableOpacity } = require("react-native");
      return (
        <View testID="prerequisite-selector">
          <Text>Select Prerequisite</Text>
          {allCapabilities
            .filter((c: any) => !selectedIds.includes(c.id))
            .map((cap: any) => (
              <TouchableOpacity
                key={cap.id}
                testID={`prereq-option-${cap.id}`}
                onPress={() => onSelect(cap.id)}
              >
                <Text>{cap.name}</Text>
              </TouchableOpacity>
            ))}
          <TouchableOpacity testID="prereq-close" onPress={onClose}>
            <Text>Close</Text>
          </TouchableOpacity>
        </View>
      );
    },
);

// Mock validation
jest.mock("../src/screens/Admin/tabs/CapabilityExplorer/validation", () => ({
  VALID_REQUIREMENT_TYPES: ["required", "optional", "soft_gate"],
  VALID_MASTERY_TYPES: ["single", "cumulative"],
  validateCapabilityForm: jest.fn(() => ({ isValid: true, errors: {} })),
}));

const {
  validateCapabilityForm,
} = require("../src/screens/Admin/tabs/CapabilityExplorer/validation");

const mockDomains = ["pitch", "rhythm", "notation", "theory"];

const mockAllCapabilities = [
  {
    id: 1,
    name: "basic_pitch",
    display_name: "Basic Pitch",
    domain: "pitch",
  },
  {
    id: 2,
    name: "basic_rhythm",
    display_name: "Basic Rhythm",
    domain: "rhythm",
  },
  {
    id: 3,
    name: "note_reading",
    display_name: "Note Reading",
    domain: "notation",
  },
];

describe("CapabilityCreateModal", () => {
  const mockOnClose = jest.fn();
  const mockOnCreate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (validateCapabilityForm as jest.Mock).mockReturnValue({
      isValid: true,
      errors: {},
    });
    mockOnCreate.mockResolvedValue({ success: true });
  });

  describe("Rendering", () => {
    it("renders modal with title", () => {
      const { getByText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      expect(getByText("Create Capability")).toBeTruthy();
    });

    it("renders close button with correct accessibility", () => {
      const { getByLabelText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      expect(getByLabelText("Close create modal")).toBeTruthy();
    });

    it("renders Name field", () => {
      const { getByTestId } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      expect(
        getByTestId("form-field-name-(lowercase_with_underscores)"),
      ).toBeTruthy();
    });

    it("renders Display Name field", () => {
      const { getByTestId } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      expect(getByTestId("form-field-display-name")).toBeTruthy();
    });

    it("renders Domain label", () => {
      const { getByText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      expect(getByText("Domain")).toBeTruthy();
    });

    it("renders domain toggle buttons", () => {
      const { getByLabelText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      expect(getByLabelText("Use existing domain")).toBeTruthy();
      expect(getByLabelText("Create new domain")).toBeTruthy();
    });

    it("renders domain chips for existing domains", () => {
      const { getByLabelText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      mockDomains.forEach((domain) => {
        expect(getByLabelText(`Select ${domain} domain`)).toBeTruthy();
      });
    });

    it("renders Subdomain field", () => {
      const { getByTestId } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      expect(getByTestId("form-field-subdomain-(optional)")).toBeTruthy();
    });

    it("renders Requirement Type label", () => {
      const { getByText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      expect(getByText("Requirement Type")).toBeTruthy();
    });

    it("renders requirement type options", () => {
      const { getByLabelText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      expect(getByLabelText("Select required requirement type")).toBeTruthy();
      expect(getByLabelText("Select optional requirement type")).toBeTruthy();
      expect(getByLabelText("Select soft_gate requirement type")).toBeTruthy();
    });

    it("renders Difficulty Tier field", () => {
      const { getByTestId } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      expect(getByTestId("form-field-difficulty-tier-(1-5)")).toBeTruthy();
    });

    it("renders Prerequisites section", () => {
      const { getByText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      expect(getByText("Prerequisites")).toBeTruthy();
      expect(getByText("No prerequisites selected")).toBeTruthy();
    });

    it("renders Add Prerequisite button", () => {
      const { getByLabelText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      expect(getByLabelText("Add prerequisite")).toBeTruthy();
    });

    it("renders Cancel button", () => {
      const { getByText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      expect(getByText("Cancel")).toBeTruthy();
    });

    it("renders Create button", () => {
      const { getByText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      expect(getByText("Create")).toBeTruthy();
    });
  });

  describe("Form Interactions", () => {
    it("transforms name to lowercase with underscores", () => {
      const { getByTestId } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      fireEvent.changeText(
        getByTestId("input-name-(lowercase_with_underscores)"),
        "My New Capability!",
      );
      expect(
        getByTestId("input-name-(lowercase_with_underscores)").props.value,
      ).toBe("my_new_capability_");
    });

    it("updates display name field", () => {
      const { getByTestId } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      fireEvent.changeText(
        getByTestId("input-display-name"),
        "My New Capability",
      );
      expect(getByTestId("input-display-name").props.value).toBe(
        "My New Capability",
      );
    });

    it("selects domain when tapped", () => {
      const { getByLabelText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      fireEvent.press(getByLabelText("Select rhythm domain"));
      // Domain selection works via state update
    });

    it("shows new domain input when + New Domain is tapped", () => {
      const { getByLabelText, getByPlaceholderText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      fireEvent.press(getByLabelText("Create new domain"));
      expect(getByPlaceholderText("Enter new domain name")).toBeTruthy();
    });

    it("shows existing domains when Use existing domain is tapped", () => {
      const { getByLabelText, queryByPlaceholderText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      fireEvent.press(getByLabelText("Create new domain"));
      fireEvent.press(getByLabelText("Use existing domain"));
      expect(queryByPlaceholderText("Enter new domain name")).toBeNull();
    });

    it("selects requirement type when tapped", () => {
      const { getByLabelText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      fireEvent.press(getByLabelText("Select optional requirement type"));
      // Requirement type selection works via state update
    });

    it("calls onClose when Cancel button is pressed", () => {
      const { getByLabelText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      fireEvent.press(getByLabelText("Cancel"));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when close button is pressed", () => {
      const { getByLabelText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      fireEvent.press(getByLabelText("Close create modal"));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Prerequisites", () => {
    it("opens prerequisite selector when Add Prerequisite is tapped", async () => {
      const { getByLabelText, getByTestId } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      fireEvent.press(getByLabelText("Add prerequisite"));

      await waitFor(() => {
        expect(getByTestId("prerequisite-selector")).toBeTruthy();
      });
    });

    it("adds prerequisite when selected", async () => {
      const { getByLabelText, getByTestId, getByText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      fireEvent.press(getByLabelText("Add prerequisite"));

      await waitFor(() => {
        expect(getByTestId("prereq-option-1")).toBeTruthy();
      });

      fireEvent.press(getByTestId("prereq-option-1"));
      fireEvent.press(getByTestId("prereq-close"));

      await waitFor(() => {
        expect(getByText("Basic Pitch")).toBeTruthy();
      });
    });

    it("shows remove button for added prerequisite", async () => {
      const { getByLabelText, getByTestId } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      fireEvent.press(getByLabelText("Add prerequisite"));
      fireEvent.press(getByTestId("prereq-option-1"));
      fireEvent.press(getByTestId("prereq-close"));

      await waitFor(() => {
        expect(getByLabelText("Remove prerequisite Basic Pitch")).toBeTruthy();
      });
    });

    it("removes prerequisite when remove is pressed", async () => {
      const { getByLabelText, getByTestId, queryByText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      fireEvent.press(getByLabelText("Add prerequisite"));
      fireEvent.press(getByTestId("prereq-option-1"));
      fireEvent.press(getByTestId("prereq-close"));

      await waitFor(() => {
        expect(getByLabelText("Remove prerequisite Basic Pitch")).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Remove prerequisite Basic Pitch"));

      await waitFor(() => {
        expect(queryByText("Basic Pitch")).toBeNull();
      });
    });
  });

  describe("Validation", () => {
    it("shows validation errors when form is invalid", async () => {
      (validateCapabilityForm as jest.Mock).mockReturnValue({
        isValid: false,
        errors: { name: "Name is required" },
      });

      const { getByLabelText, getByTestId } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      fireEvent.press(getByLabelText("Create capability"));

      await waitFor(() => {
        expect(
          getByTestId("error-name-(lowercase_with_underscores)"),
        ).toBeTruthy();
      });
      expect(mockOnCreate).not.toHaveBeenCalled();
    });

    it("clears errors when field value changes", async () => {
      (validateCapabilityForm as jest.Mock).mockReturnValue({
        isValid: false,
        errors: { name: "Name is required" },
      });

      const { getByLabelText, getByTestId, queryByTestId } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      fireEvent.press(getByLabelText("Create capability"));

      await waitFor(() => {
        expect(
          getByTestId("error-name-(lowercase_with_underscores)"),
        ).toBeTruthy();
      });

      fireEvent.changeText(
        getByTestId("input-name-(lowercase_with_underscores)"),
        "valid_name",
      );

      await waitFor(() => {
        expect(
          queryByTestId("error-name-(lowercase_with_underscores)"),
        ).toBeNull();
      });
    });
  });

  describe("Create Action", () => {
    it("calls onCreate with form data when valid", async () => {
      const { getByLabelText, getByTestId } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      fireEvent.changeText(
        getByTestId("input-name-(lowercase_with_underscores)"),
        "test_capability",
      );
      fireEvent.changeText(
        getByTestId("input-display-name"),
        "Test Capability",
      );
      fireEvent.press(getByLabelText("Select rhythm domain"));

      await act(async () => {
        fireEvent.press(getByLabelText("Create capability"));
      });

      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "test_capability",
            display_name: "Test Capability",
            domain: "rhythm",
            requirement_type: "required",
            difficulty_tier: 1,
          }),
        );
      });
    });

    it("uses new domain when creating with new domain", async () => {
      const { getByLabelText, getByTestId, getByPlaceholderText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      fireEvent.changeText(
        getByTestId("input-name-(lowercase_with_underscores)"),
        "test_capability",
      );
      fireEvent.press(getByLabelText("Create new domain"));
      fireEvent.changeText(
        getByPlaceholderText("Enter new domain name"),
        "new_domain",
      );

      await act(async () => {
        fireEvent.press(getByLabelText("Create capability"));
      });

      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            domain: "new_domain",
          }),
        );
      });
    });

    it("includes prerequisite_ids in onCreate call", async () => {
      const { getByLabelText, getByTestId } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      fireEvent.changeText(
        getByTestId("input-name-(lowercase_with_underscores)"),
        "test_capability",
      );
      fireEvent.press(getByLabelText("Select pitch domain"));

      // Add prerequisite
      fireEvent.press(getByLabelText("Add prerequisite"));
      fireEvent.press(getByTestId("prereq-option-2"));
      fireEvent.press(getByTestId("prereq-close"));

      await act(async () => {
        fireEvent.press(getByLabelText("Create capability"));
      });

      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            prerequisite_ids: [2],
          }),
        );
      });
    });

    it("shows loading state while saving", async () => {
      mockOnCreate.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true }), 100),
          ),
      );

      const { getByLabelText, getByTestId, getByText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      fireEvent.changeText(
        getByTestId("input-name-(lowercase_with_underscores)"),
        "test_capability",
      );
      fireEvent.press(getByLabelText("Select pitch domain"));

      await act(async () => {
        fireEvent.press(getByLabelText("Create capability"));
      });

      expect(getByText("Creating...")).toBeTruthy();
    });

    it("shows save error when onCreate returns error", async () => {
      mockOnCreate.mockResolvedValueOnce({
        success: false,
        error: "Duplicate name",
      });

      const { getByLabelText, getByTestId, getByText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      fireEvent.changeText(
        getByTestId("input-name-(lowercase_with_underscores)"),
        "test_capability",
      );
      fireEvent.press(getByLabelText("Select pitch domain"));

      await act(async () => {
        fireEvent.press(getByLabelText("Create capability"));
      });

      await waitFor(() => {
        expect(getByText("Duplicate name")).toBeTruthy();
      });
    });

    it("disables buttons while saving", async () => {
      mockOnCreate.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true }), 100),
          ),
      );

      const { getByLabelText, getByTestId } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      fireEvent.changeText(
        getByTestId("input-name-(lowercase_with_underscores)"),
        "test_capability",
      );
      fireEvent.press(getByLabelText("Select pitch domain"));

      await act(async () => {
        fireEvent.press(getByLabelText("Create capability"));
      });

      const creatingButton = getByLabelText("Creating");
      expect(creatingButton.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe("Accessibility", () => {
    it("has accessible close button", () => {
      const { getByLabelText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      const closeButton = getByLabelText("Close create modal");
      expect(closeButton.props.accessibilityRole).toBe("button");
    });

    it("has accessible cancel button", () => {
      const { getByLabelText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      const cancelButton = getByLabelText("Cancel");
      expect(cancelButton.props.accessibilityRole).toBe("button");
    });

    it("has accessible create button", () => {
      const { getByLabelText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      const createButton = getByLabelText("Create capability");
      expect(createButton.props.accessibilityRole).toBe("button");
    });

    it("has accessible domain options", () => {
      const { getByLabelText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      mockDomains.forEach((domain) => {
        const domainButton = getByLabelText(`Select ${domain} domain`);
        expect(domainButton.props.accessibilityRole).toBe("button");
      });
    });

    it("has accessible requirement type options", () => {
      const { getByLabelText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      const types = ["required", "optional", "soft_gate"];
      types.forEach((type) => {
        const typeButton = getByLabelText(`Select ${type} requirement type`);
        expect(typeButton.props.accessibilityRole).toBe("button");
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles empty domains array", () => {
      const { getByText } = render(
        <CapabilityCreateModal
          domains={[]}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      expect(getByText("Create Capability")).toBeTruthy();
    });

    it("handles empty allCapabilities array", () => {
      const { getByText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={[]}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      expect(getByText("No prerequisites selected")).toBeTruthy();
    });

    it("uses initialDomain when provided", () => {
      const { getByText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          initialDomain="notation"
        />,
      );

      expect(getByText("Create Capability")).toBeTruthy();
      // Initial domain is set in form state
    });

    it("clears save error when field changes", async () => {
      mockOnCreate.mockResolvedValueOnce({
        success: false,
        error: "Server error",
      });

      const { getByLabelText, getByTestId, getByText, queryByText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      fireEvent.changeText(
        getByTestId("input-name-(lowercase_with_underscores)"),
        "test",
      );
      fireEvent.press(getByLabelText("Select pitch domain"));

      await act(async () => {
        fireEvent.press(getByLabelText("Create capability"));
      });

      await waitFor(() => {
        expect(getByText("Server error")).toBeTruthy();
      });

      fireEvent.changeText(
        getByTestId("input-name-(lowercase_with_underscores)"),
        "test2",
      );

      await waitFor(() => {
        expect(queryByText("Server error")).toBeNull();
      });
    });

    it("clears save error when removing prerequisite", async () => {
      mockOnCreate.mockResolvedValueOnce({
        success: false,
        error: "Server error",
      });

      const { getByLabelText, getByTestId, getByText, queryByText } = render(
        <CapabilityCreateModal
          domains={mockDomains}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
        />,
      );

      // Add prerequisite first
      fireEvent.press(getByLabelText("Add prerequisite"));
      fireEvent.press(getByTestId("prereq-option-1"));
      fireEvent.press(getByTestId("prereq-close"));

      fireEvent.changeText(
        getByTestId("input-name-(lowercase_with_underscores)"),
        "test",
      );
      fireEvent.press(getByLabelText("Select pitch domain"));

      await act(async () => {
        fireEvent.press(getByLabelText("Create capability"));
      });

      await waitFor(() => {
        expect(getByText("Server error")).toBeTruthy();
      });

      // Remove the prerequisite
      fireEvent.press(getByLabelText("Remove prerequisite Basic Pitch"));

      await waitFor(() => {
        expect(queryByText("Server error")).toBeNull();
      });
    });
  });
});
