/**
 * Tests for CapabilityEditModal component
 *
 * Tests the modal for editing existing capabilities in the admin panel.
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

import CapabilityEditModal from "../src/screens/Admin/tabs/CapabilityExplorer/components/CapabilityEditModal";

// Mock fetch
global.fetch = jest.fn();

// Mock styles
jest.mock("../src/screens/Admin/styles", () => ({
  editModalContainer: {},
  editModalHeader: {},
  editModalTitle: {},
  closeButton: {},
  closeButtonText: {},
  editModalContent: {},
  readOnlyNotice: {},
  readOnlyNoticeText: {},
  formFieldContainer: {},
  formFieldLabel: {},
  formFieldError: {},
  pickerContainer: {},
  pickerOption: {},
  pickerOptionSelected: {},
  pickerOptionText: {},
  pickerOptionTextSelected: {},
  switchRow: {},
  switchHint: {},
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
  saveSuccessContainer: {},
  saveSuccessText: {},
  editModalActions: {},
  editModalButton: {},
  cancelButton: {},
  cancelButtonText: {},
  saveButton: {},
  saveButtonDisabled: {},
  saveButtonText: {},
}));

// Mock devLogger
jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devError: jest.fn(),
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
          {error && <Text testID="field-error">{error}</Text>}
        </View>
      );
    },
);

// Mock PrerequisiteSelector
jest.mock(
  "../src/screens/Admin/tabs/CapabilityExplorer/components/PrerequisiteSelector",
  () =>
    function MockPrerequisiteSelector({
      currentCapabilityId,
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
            .filter((c: any) => c.id !== currentCapabilityId)
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

// Mock DetectionRuleEditor
jest.mock(
  "../src/screens/Admin/tabs/CapabilityExplorer/components/DetectionRuleEditor",
  () =>
    function MockDetectionRuleEditor({ rule, options, onChange }: any) {
      const { View, Text, TouchableOpacity } = require("react-native");
      return (
        <View testID="detection-rule-editor">
          <Text>Detection Rule Editor</Text>
          <TouchableOpacity
            testID="set-detection-rule"
            onPress={() => onChange({ type: "presence", source: "clefs" })}
          >
            <Text>Set Rule</Text>
          </TouchableOpacity>
        </View>
      );
    },
);

// Mock validation
jest.mock("../src/screens/Admin/tabs/CapabilityExplorer/validation", () => ({
  VALID_REQUIREMENT_TYPES: ["required", "optional", "soft_gate"],
  VALID_MASTERY_TYPES: ["single", "cumulative"],
  MIN_DIFFICULTY_WEIGHT: 0.1,
  MAX_DIFFICULTY_WEIGHT: 10.0,
  MIN_RATING: 1,
  MAX_RATING: 5,
  validateCapabilityForm: jest.fn(() => ({ isValid: true, errors: {} })),
}));

const mockCapability = {
  id: 1,
  name: "test_capability",
  display_name: "Test Capability",
  domain: "test_domain",
  subdomain: "test_subdomain",
  requirement_type: "required",
  difficulty_tier: 1,
  mastery_type: "single",
  mastery_count: 1,
  evidence_required_count: 1,
  evidence_distinct_materials: false,
  evidence_acceptance_threshold: 4,
  difficulty_weight: 1.0,
  is_global: true,
  bit_index: 5,
  prerequisite_ids: [],
  detection_rule: null,
  soft_gate_requirements: null,
};

const mockAllCapabilities = [
  mockCapability,
  {
    id: 2,
    name: "prereq_capability",
    display_name: "Prereq Capability",
    domain: "prereq_domain",
  },
  {
    id: 3,
    name: "another_capability",
    display_name: "Another Capability",
    domain: "another_domain",
  },
];

describe("CapabilityEditModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          types: ["presence", "count"],
          sources: ["clefs", "time_signatures"],
        }),
    });
  });

  describe("Rendering", () => {
    it("renders nothing when capability is null", () => {
      const { queryByText } = render(
        <CapabilityEditModal
          capability={null}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      expect(queryByText("Edit Capability")).toBeNull();
    });

    it("renders modal with capability data", async () => {
      const { getByText, getByTestId } = render(
        <CapabilityEditModal
          capability={mockCapability}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await waitFor(() => {
        expect(getByText("Edit Capability")).toBeTruthy();
      });

      expect(getByTestId("form-field-name")).toBeTruthy();
      expect(getByTestId("form-field-display-name")).toBeTruthy();
      expect(getByTestId("form-field-domain")).toBeTruthy();
    });

    it("displays read-only ID and bit index notice", async () => {
      const { getByText } = render(
        <CapabilityEditModal
          capability={mockCapability}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await waitFor(() => {
        expect(getByText(/ID \(1\) and Bit Index \(5\)/)).toBeTruthy();
      });
    });

    it("shows close button", async () => {
      const { getByLabelText } = render(
        <CapabilityEditModal
          capability={mockCapability}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await waitFor(() => {
        expect(getByLabelText("Close edit modal")).toBeTruthy();
      });
    });
  });

  describe("Form Interactions", () => {
    it("updates form field when text changes", async () => {
      const { getByTestId } = render(
        <CapabilityEditModal
          capability={mockCapability}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await waitFor(() => {
        expect(getByTestId("input-name")).toBeTruthy();
      });

      fireEvent.changeText(getByTestId("input-name"), "new_capability_name");

      expect(getByTestId("input-name").props.value).toBe("new_capability_name");
    });

    it("selects requirement type", async () => {
      const { getByLabelText } = render(
        <CapabilityEditModal
          capability={mockCapability}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await waitFor(() => {
        expect(getByLabelText("Select optional requirement type")).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Select optional requirement type"));
    });

    it("selects mastery type", async () => {
      const { getByLabelText } = render(
        <CapabilityEditModal
          capability={mockCapability}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await waitFor(() => {
        expect(getByLabelText("Select cumulative mastery type")).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Select cumulative mastery type"));
    });

    it("toggles evidence distinct materials switch", async () => {
      const { getByText } = render(
        <CapabilityEditModal
          capability={mockCapability}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await waitFor(() => {
        expect(getByText("Evidence Distinct Materials")).toBeTruthy();
      });
    });

    it("toggles is_global switch", async () => {
      const { getByText } = render(
        <CapabilityEditModal
          capability={mockCapability}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await waitFor(() => {
        expect(getByText("Global Capability")).toBeTruthy();
      });
    });
  });

  describe("Prerequisites", () => {
    it("shows no prerequisites message when empty", async () => {
      const { getByText } = render(
        <CapabilityEditModal
          capability={mockCapability}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await waitFor(() => {
        expect(getByText("No prerequisites selected")).toBeTruthy();
      });
    });

    it("shows existing prerequisites", async () => {
      const capWithPrereqs = {
        ...mockCapability,
        prerequisite_ids: [2],
      };

      const { getByText } = render(
        <CapabilityEditModal
          capability={capWithPrereqs}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await waitFor(() => {
        expect(getByText("Prereq Capability")).toBeTruthy();
      });
    });

    it("opens prerequisite selector on button press", async () => {
      const { getByLabelText, getByTestId } = render(
        <CapabilityEditModal
          capability={mockCapability}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await waitFor(() => {
        expect(getByLabelText("Add prerequisite")).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Add prerequisite"));

      await waitFor(() => {
        expect(getByTestId("prerequisite-selector")).toBeTruthy();
      });
    });

    it("removes prerequisite when remove button pressed", async () => {
      const capWithPrereqs = {
        ...mockCapability,
        prerequisite_ids: [2],
      };

      const { getByLabelText, queryByText } = render(
        <CapabilityEditModal
          capability={capWithPrereqs}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await waitFor(() => {
        expect(
          getByLabelText("Remove Prereq Capability prerequisite"),
        ).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Remove Prereq Capability prerequisite"));

      await waitFor(() => {
        expect(queryByText("Prereq Capability")).toBeNull();
      });
    });
  });

  describe("Detection Rule", () => {
    it("renders detection rule editor", async () => {
      const { getByTestId } = render(
        <CapabilityEditModal
          capability={mockCapability}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await waitFor(() => {
        expect(getByTestId("detection-rule-editor")).toBeTruthy();
      });
    });

    it("updates detection rule via editor", async () => {
      const { getByTestId } = render(
        <CapabilityEditModal
          capability={mockCapability}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await waitFor(() => {
        expect(getByTestId("set-detection-rule")).toBeTruthy();
      });

      fireEvent.press(getByTestId("set-detection-rule"));
    });

    it("fetches detection rule options on mount", async () => {
      render(
        <CapabilityEditModal
          capability={mockCapability}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/admin/detection-rule-options"),
        );
      });
    });
  });

  describe("Save and Cancel", () => {
    it("calls onClose when cancel button pressed", async () => {
      const { getByLabelText } = render(
        <CapabilityEditModal
          capability={mockCapability}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await waitFor(() => {
        expect(getByLabelText("Cancel editing")).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Cancel editing"));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("calls onClose when close button pressed", async () => {
      const { getByLabelText } = render(
        <CapabilityEditModal
          capability={mockCapability}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await waitFor(() => {
        expect(getByLabelText("Close edit modal")).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Close edit modal"));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("saves capability when save button pressed", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ types: [], sources: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      const { getByLabelText } = render(
        <CapabilityEditModal
          capability={mockCapability}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await waitFor(() => {
        expect(getByLabelText("Save changes")).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Save changes"));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/admin/capabilities/${mockCapability.id}`),
          expect.objectContaining({
            method: "PUT",
          }),
        );
      });
    });

    it("shows error when save fails", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ types: [], sources: [] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ detail: "Failed to save" }),
        });

      const { getByLabelText, getByText } = render(
        <CapabilityEditModal
          capability={mockCapability}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await waitFor(() => {
        expect(getByLabelText("Save changes")).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Save changes"));

      await waitFor(() => {
        expect(getByText("Failed to save")).toBeTruthy();
      });
    });

    it("shows validation errors when validation fails", async () => {
      const {
        validateCapabilityForm,
      } = require("../src/screens/Admin/tabs/CapabilityExplorer/validation");
      (validateCapabilityForm as jest.Mock).mockReturnValueOnce({
        isValid: false,
        errors: { name: "Name is required" },
      });

      const { getByLabelText } = render(
        <CapabilityEditModal
          capability={mockCapability}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await waitFor(() => {
        expect(getByLabelText("Save changes")).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Save changes"));

      // Validation failed, so no API call should be made for save
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it("shows success message after successful save", async () => {
      const {
        validateCapabilityForm,
      } = require("../src/screens/Admin/tabs/CapabilityExplorer/validation");
      (validateCapabilityForm as jest.Mock).mockReturnValue({
        isValid: true,
        errors: {},
      });
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ types: [], sources: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      const { getByLabelText, getByText } = render(
        <CapabilityEditModal
          capability={mockCapability}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await waitFor(() => {
        expect(getByLabelText("Save changes")).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Save changes"));

      await waitFor(() => {
        expect(getByText("Saved successfully!")).toBeTruthy();
      });
    });
  });

  describe("Initial State from Capability", () => {
    it("initializes form with capability values", async () => {
      const { getByTestId } = render(
        <CapabilityEditModal
          capability={mockCapability}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await waitFor(() => {
        expect(getByTestId("input-name").props.value).toBe("test_capability");
        expect(getByTestId("input-display-name").props.value).toBe(
          "Test Capability",
        );
        expect(getByTestId("input-domain").props.value).toBe("test_domain");
      });
    });

    it("handles capability with soft_gate_requirements", async () => {
      const capWithSoftGate = {
        ...mockCapability,
        soft_gate_requirements: { interval_velocity_score: 0.5 },
      };

      const { getByTestId } = render(
        <CapabilityEditModal
          capability={capWithSoftGate}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await waitFor(() => {
        expect(
          getByTestId("input-soft-gate-requirements-(json)").props.value,
        ).toBe('{"interval_velocity_score":0.5}');
      });
    });

    it("handles capability without bit_index", async () => {
      const capWithoutBitIndex = {
        ...mockCapability,
        bit_index: null,
      };

      const { getByText } = render(
        <CapabilityEditModal
          capability={capWithoutBitIndex}
          allCapabilities={mockAllCapabilities}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await waitFor(() => {
        expect(getByText(/Bit Index \(N\/A\)/)).toBeTruthy();
      });
    });
  });
});
