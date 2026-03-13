/**
 * Tests for AddCapabilityModal component
 *
 * Tests the modal for adding new capabilities to the CapabilityPath.
 */
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import AddCapabilityModal from "../src/screens/CapabilityPath/components/AddCapabilityModal";

// Mock styles
jest.mock("../src/screens/CapabilityPath/styles", () => ({
  modalOverlay: {},
  modalContent: {},
  modalTitle: {},
  modalLabel: {},
  modalInput: {},
  categoryPicker: {},
  catOption: {},
  catOptionActive: {},
  catOptionText: {},
  catOptionTextActive: {},
  typeSelector: {},
  typeSelectorBtn: {},
  typeSelectorBtnActive: {},
  typeSelectorText: {},
  typeSelectorTextActive: {},
  modalButtons: {},
  modalCancelBtn: {},
  modalCancelText: {},
  modalAddBtn: {},
  modalAddText: {},
}));

// Mock constants
jest.mock("../src/screens/CapabilityPath/data/constants", () => ({
  CATEGORIES: ["Rhythm", "Pitch", "Dynamics", "Articulation"],
}));

const mockNewItem = {
  capability: "",
  display_name: "",
  category: "Rhythm",
  teaching_order: 1,
  type: "T",
  mastery_count: 1,
};

describe("AddCapabilityModal", () => {
  const mockOnChangeItem = jest.fn();
  const mockOnAdd = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    visible: true,
    newItem: mockNewItem,
    onChangeItem: mockOnChangeItem,
    onAdd: mockOnAdd,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Visibility", () => {
    it("renders when visible is true", () => {
      const { getByText } = render(<AddCapabilityModal {...defaultProps} />);
      expect(getByText("Add New Capability")).toBeTruthy();
    });
  });

  describe("Capability Code Input", () => {
    it("renders capability code input", () => {
      const { getByPlaceholderText } = render(
        <AddCapabilityModal {...defaultProps} />,
      );
      expect(getByPlaceholderText("e.g., note_whole")).toBeTruthy();
    });

    it("calls onChangeItem when capability code changes", () => {
      const { getByPlaceholderText } = render(
        <AddCapabilityModal {...defaultProps} />,
      );
      fireEvent.changeText(
        getByPlaceholderText("e.g., note_whole"),
        "note_half",
      );
      expect(mockOnChangeItem).toHaveBeenCalledWith({
        ...mockNewItem,
        capability: "note_half",
      });
    });

    it("displays current capability code value", () => {
      const props = {
        ...defaultProps,
        newItem: { ...mockNewItem, capability: "existing_cap" },
      };
      const { getByDisplayValue } = render(<AddCapabilityModal {...props} />);
      expect(getByDisplayValue("existing_cap")).toBeTruthy();
    });
  });

  describe("Display Name Input", () => {
    it("renders display name input", () => {
      const { getByPlaceholderText } = render(
        <AddCapabilityModal {...defaultProps} />,
      );
      expect(getByPlaceholderText("e.g., Whole Note")).toBeTruthy();
    });

    it("calls onChangeItem when display name changes", () => {
      const { getByPlaceholderText } = render(
        <AddCapabilityModal {...defaultProps} />,
      );
      fireEvent.changeText(
        getByPlaceholderText("e.g., Whole Note"),
        "Half Note",
      );
      expect(mockOnChangeItem).toHaveBeenCalledWith({
        ...mockNewItem,
        display_name: "Half Note",
      });
    });
  });

  describe("Category Selection", () => {
    it("renders all category options", () => {
      const { getByText } = render(<AddCapabilityModal {...defaultProps} />);
      expect(getByText("Rhythm")).toBeTruthy();
      expect(getByText("Pitch")).toBeTruthy();
      expect(getByText("Dynamics")).toBeTruthy();
      expect(getByText("Articulation")).toBeTruthy();
    });

    it("calls onChangeItem when category selected", () => {
      const { getByLabelText } = render(
        <AddCapabilityModal {...defaultProps} />,
      );
      fireEvent.press(getByLabelText("Select Pitch category"));
      expect(mockOnChangeItem).toHaveBeenCalledWith({
        ...mockNewItem,
        category: "Pitch",
      });
    });
  });

  describe("Teaching Order Input", () => {
    it("renders teaching order input with current value", () => {
      const { getByDisplayValue } = render(
        <AddCapabilityModal {...defaultProps} />,
      );
      expect(getByDisplayValue("1")).toBeTruthy();
    });

    it("calls onChangeItem when teaching order changes", () => {
      const { getByDisplayValue } = render(
        <AddCapabilityModal {...defaultProps} />,
      );
      fireEvent.changeText(getByDisplayValue("1"), "5");
      expect(mockOnChangeItem).toHaveBeenCalledWith({
        ...mockNewItem,
        teaching_order: 5,
      });
    });

    it("handles invalid numeric input", () => {
      const { getByDisplayValue } = render(
        <AddCapabilityModal {...defaultProps} />,
      );
      fireEvent.changeText(getByDisplayValue("1"), "abc");
      expect(mockOnChangeItem).toHaveBeenCalledWith({
        ...mockNewItem,
        teaching_order: 0,
      });
    });
  });

  describe("Type Selection", () => {
    it("renders prerequisite type button", () => {
      const { getByLabelText } = render(
        <AddCapabilityModal {...defaultProps} />,
      );
      expect(getByLabelText("Set type to prerequisite")).toBeTruthy();
    });

    it("renders teachable type button", () => {
      const { getByLabelText } = render(
        <AddCapabilityModal {...defaultProps} />,
      );
      expect(getByLabelText("Set type to teachable")).toBeTruthy();
    });

    it("calls onChangeItem when prerequisite selected", () => {
      const { getByLabelText } = render(
        <AddCapabilityModal {...defaultProps} />,
      );
      fireEvent.press(getByLabelText("Set type to prerequisite"));
      expect(mockOnChangeItem).toHaveBeenCalledWith({
        ...mockNewItem,
        type: "P",
      });
    });

    it("calls onChangeItem when teachable selected", () => {
      const props = {
        ...defaultProps,
        newItem: { ...mockNewItem, type: "P" },
      };
      const { getByLabelText } = render(<AddCapabilityModal {...props} />);
      fireEvent.press(getByLabelText("Set type to teachable"));
      expect(mockOnChangeItem).toHaveBeenCalledWith({
        ...props.newItem,
        type: "T",
      });
    });
  });

  describe("Action Buttons", () => {
    it("calls onCancel when cancel button pressed", () => {
      const { getByLabelText } = render(
        <AddCapabilityModal {...defaultProps} />,
      );
      fireEvent.press(getByLabelText("Cancel adding capability"));
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it("calls onAdd when add button pressed", () => {
      const { getByLabelText } = render(
        <AddCapabilityModal {...defaultProps} />,
      );
      fireEvent.press(getByLabelText("Add new capability"));
      expect(mockOnAdd).toHaveBeenCalled();
    });
  });
});
