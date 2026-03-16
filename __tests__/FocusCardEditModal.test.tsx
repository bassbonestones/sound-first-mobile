/**
 * Tests for FocusCardEditModal component
 *
 * Tests the modal for editing existing focus cards in the admin panel.
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

import FocusCardEditModal from "../src/screens/Admin/tabs/FocusCardExplorer/components/FocusCardEditModal";

// Mock fetch
global.fetch = jest.fn();

// Mock styles
jest.mock("../src/screens/Admin/styles", () => ({
  modalOverlay: {},
  editModalPopup: {},
  detailModalHeader: {},
  detailModalTitle: {},
  closeButton: {},
  closeButtonText: {},
  editModalPopupContent: {},
  formFieldContainer: {},
  formFieldLabel: {},
  formFieldInput: {},
  formFieldInputError: {},
  formFieldError: {},
  jsonInput: {},
  pickerContainer: {},
  pickerOption: {},
  pickerOptionSelected: {},
  pickerOptionText: {},
  pickerOptionTextSelected: {},
  cancelNewButton: {},
  cancelNewButtonText: {},
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

// Mock api/client
jest.mock("../src/api/client", () => ({
  baseUrl: "http://localhost:8000",
}));

// Mock FormField
jest.mock(
  "../src/screens/Admin/tabs/FocusCardExplorer/components/FormField",
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

const mockFocusCard = {
  id: 1,
  name: "Pitch Center",
  category: "Pitch",
  description: "Focus on pitch accuracy",
  attention_cue: "Listen to the center of the pitch",
  micro_cues: ["Breathe", "Support", "Focus"],
  prompts: { listen: "Listen carefully", sing: "Sing it back" },
};

const mockCategories = ["Pitch", "Rhythm", "Tone", "Technique"];

describe("FocusCardEditModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });

  describe("Rendering", () => {
    it("renders modal with title", () => {
      const { getByText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      expect(getByText("Edit Focus Card")).toBeTruthy();
    });

    it("renders close button with correct accessibility", () => {
      const { getByLabelText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      expect(getByLabelText("Close edit modal")).toBeTruthy();
    });

    it("renders Name field with existing value", () => {
      const { getByTestId } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      expect(getByTestId("form-field-name")).toBeTruthy();
      expect(getByTestId("input-name").props.value).toBe("Pitch Center");
    });

    it("renders Description field with existing value", () => {
      const { getByTestId } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      expect(getByTestId("form-field-description")).toBeTruthy();
      expect(getByTestId("input-description").props.value).toBe(
        "Focus on pitch accuracy",
      );
    });

    it("renders Attention Cue field with existing value", () => {
      const { getByTestId } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      expect(getByTestId("form-field-attention-cue")).toBeTruthy();
      expect(getByTestId("input-attention-cue").props.value).toBe(
        "Listen to the center of the pitch",
      );
    });

    it("renders category picker with correct category selected", () => {
      const { getByText, getByLabelText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      expect(getByText("Category")).toBeTruthy();
      expect(getByLabelText("Select Pitch category")).toBeTruthy();
    });

    it("renders Micro Cues JSON field with formatted JSON", () => {
      const { getByText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      expect(getByText("Micro Cues (JSON Array)")).toBeTruthy();
    });

    it("renders Prompts JSON field with formatted JSON", () => {
      const { getByText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      expect(getByText("Prompts (JSON Object)")).toBeTruthy();
    });

    it("renders Cancel button", () => {
      const { getByText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      expect(getByText("Cancel")).toBeTruthy();
    });

    it("renders Save button", () => {
      const { getByText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      expect(getByText("Save")).toBeTruthy();
    });

    it("renders + New category option", () => {
      const { getByLabelText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      expect(getByLabelText("Create new category")).toBeTruthy();
    });
  });

  describe("Form Interactions", () => {
    it("updates name field when text changes", () => {
      const { getByTestId } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      fireEvent.changeText(getByTestId("input-name"), "Updated Focus Card");
      expect(getByTestId("input-name").props.value).toBe("Updated Focus Card");
    });

    it("selects category when tapped", () => {
      const { getByLabelText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      fireEvent.press(getByLabelText("Select Rhythm category"));
      // Category updates via state
    });

    it("shows new category input when + New is tapped", () => {
      const { getByLabelText, getByPlaceholderText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      fireEvent.press(getByLabelText("Create new category"));
      expect(getByPlaceholderText("Enter new category")).toBeTruthy();
    });

    it("shows cancel new category button when creating new category", () => {
      const { getByLabelText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      fireEvent.press(getByLabelText("Create new category"));
      expect(getByLabelText("Cancel new category")).toBeTruthy();
    });

    it("hides new category input when cancel is pressed", () => {
      const { getByLabelText, queryByPlaceholderText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      fireEvent.press(getByLabelText("Create new category"));
      fireEvent.press(getByLabelText("Cancel new category"));
      expect(queryByPlaceholderText("Enter new category")).toBeNull();
    });

    it("calls onClose when Cancel button is pressed", () => {
      const { getByLabelText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      fireEvent.press(getByLabelText("Cancel"));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when close button is pressed", () => {
      const { getByLabelText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      fireEvent.press(getByLabelText("Close edit modal"));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Validation", () => {
    it("shows error when name is empty", async () => {
      const { getByLabelText, getByTestId } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      fireEvent.changeText(getByTestId("input-name"), "");
      fireEvent.press(getByLabelText("Save changes"));

      await waitFor(() => {
        expect(getByTestId("error-name")).toBeTruthy();
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("Save Action", () => {
    it("calls fetch with PUT method when saving", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const { getByLabelText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await act(async () => {
        fireEvent.press(getByLabelText("Save changes"));
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "http://localhost:8000/admin/focus-cards/1",
          expect.objectContaining({
            method: "PUT",
            headers: { "Content-Type": "application/json" },
          }),
        );
      });
    });

    it("calls onSave after successful save", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const { getByLabelText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await act(async () => {
        fireEvent.press(getByLabelText("Save changes"));
      });

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
      });
    });

    it("shows loading state while saving", async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: true }), 100),
          ),
      );

      const { getByLabelText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await act(async () => {
        fireEvent.press(getByLabelText("Save changes"));
      });

      expect(getByLabelText("Saving")).toBeTruthy();
    });

    it("shows save error when fetch fails", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error"),
      );

      const { getByLabelText, getByText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await act(async () => {
        fireEvent.press(getByLabelText("Save changes"));
      });

      await waitFor(() => {
        expect(getByText("Network error")).toBeTruthy();
      });
    });

    it("shows API error when response is not ok", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ detail: "Duplicate name" }),
      });

      const { getByLabelText, getByText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await act(async () => {
        fireEvent.press(getByLabelText("Save changes"));
      });

      await waitFor(() => {
        expect(getByText("Duplicate name")).toBeTruthy();
      });
    });

    it("shows default error when API error has no detail", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      const { getByLabelText, getByText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await act(async () => {
        fireEvent.press(getByLabelText("Save changes"));
      });

      await waitFor(() => {
        expect(getByText("Failed to save")).toBeTruthy();
      });
    });

    it("disables save button while saving", async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: true }), 100),
          ),
      );

      const { getByLabelText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await act(async () => {
        fireEvent.press(getByLabelText("Save changes"));
      });

      const savingButton = getByLabelText("Saving");
      expect(savingButton.props.accessibilityState?.disabled).toBe(true);
    });

    it("uses new category when saving with new category", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const { getByLabelText, getByPlaceholderText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      fireEvent.press(getByLabelText("Create new category"));
      fireEvent.changeText(
        getByPlaceholderText("Enter new category"),
        "New Category",
      );

      await act(async () => {
        fireEvent.press(getByLabelText("Save changes"));
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining('"category":"New Category"'),
          }),
        );
      });
    });
  });

  describe("Accessibility", () => {
    it("has accessible close button", () => {
      const { getByLabelText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      const closeButton = getByLabelText("Close edit modal");
      expect(closeButton.props.accessibilityRole).toBe("button");
    });

    it("has accessible cancel button", () => {
      const { getByLabelText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      const cancelButton = getByLabelText("Cancel");
      expect(cancelButton.props.accessibilityRole).toBe("button");
    });

    it("has accessible save button", () => {
      const { getByLabelText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      const saveButton = getByLabelText("Save changes");
      expect(saveButton.props.accessibilityRole).toBe("button");
    });

    it("has accessible category options", () => {
      const { getByLabelText } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      mockCategories.forEach((cat) => {
        const catButton = getByLabelText(`Select ${cat} category`);
        expect(catButton.props.accessibilityRole).toBe("button");
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles focus card with null values", () => {
      const focusCardWithNulls = {
        id: 2,
        name: "Test",
        category: null,
        description: null,
        attention_cue: null,
        micro_cues: null,
        prompts: null,
      };

      const { getByText } = render(
        <FocusCardEditModal
          focusCard={focusCardWithNulls}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      expect(getByText("Edit Focus Card")).toBeTruthy();
    });

    it("handles focus card with empty arrays/objects", () => {
      const focusCardEmpty = {
        id: 3,
        name: "Empty Card",
        category: "Pitch",
        description: "",
        attention_cue: "",
        micro_cues: [],
        prompts: {},
      };

      const { getByText } = render(
        <FocusCardEditModal
          focusCard={focusCardEmpty}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      expect(getByText("Edit Focus Card")).toBeTruthy();
    });

    it("clears errors when field value changes", async () => {
      const { getByLabelText, getByTestId, queryByTestId } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      // Clear name to trigger validation error
      fireEvent.changeText(getByTestId("input-name"), "");
      fireEvent.press(getByLabelText("Save changes"));

      await waitFor(() => {
        expect(getByTestId("error-name")).toBeTruthy();
      });

      // Change field value
      fireEvent.changeText(getByTestId("input-name"), "Valid Name");

      await waitFor(() => {
        expect(queryByTestId("error-name")).toBeNull();
      });
    });

    it("clears save error when field changes", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Save failed"),
      );

      const { getByLabelText, getByText, queryByText, getByTestId } = render(
        <FocusCardEditModal
          focusCard={mockFocusCard}
          categories={mockCategories}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />,
      );

      await act(async () => {
        fireEvent.press(getByLabelText("Save changes"));
      });

      await waitFor(() => {
        expect(getByText("Save failed")).toBeTruthy();
      });

      // Update a field
      fireEvent.changeText(getByTestId("input-name"), "New name");

      await waitFor(() => {
        expect(queryByText("Save failed")).toBeNull();
      });
    });
  });
});
