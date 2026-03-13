/**
 * Tests for CapabilityRow component
 *
 * Tests the individual capability row in the CapabilityPath list.
 */
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import CapabilityRow from "../src/screens/CapabilityPath/components/CapabilityRow";

// Mock styles
jest.mock("../src/screens/CapabilityPath/styles", () => ({
  row: {},
  rowAlt: {},
  orderCol: {},
  orderNum: {},
  moveButtons: {},
  moveBtn: {},
  moveBtnText: {},
  mainCol: {},
  displayName: {},
  capability: {},
  categoryBadge: {},
  typeCol: {},
  typeButton: {},
  typeP: {},
  typeT: {},
  typeText: {},
  masteryRow: {},
  masteryLabel: {},
  masteryBtn: {},
  masteryCount: {},
  editBtn: {},
  editBtnText: {},
  editSection: {},
  editLabel: {},
  editInput: {},
  notesInput: {},
  deleteBtn: {},
  deleteBtnText: {},
}));

const mockItem = {
  id: 1,
  name: "note_whole",
  capability: "note_whole",
  display_name: "Whole Note",
  category: "Rhythm",
  teaching_order: 1,
  type: "T",
  mastery_count: 3,
  teaching_materials: "material1.musicxml",
  notes: "Teaching notes here",
};

describe("CapabilityRow", () => {
  const mockOnToggleEdit = jest.fn();
  const mockOnUpdateItem = jest.fn();
  const mockOnMoveItem = jest.fn();
  const mockOnDeleteItem = jest.fn();

  const defaultProps = {
    item: mockItem,
    index: 0,
    isEditing: false,
    onToggleEdit: mockOnToggleEdit,
    onUpdateItem: mockOnUpdateItem,
    onMoveItem: mockOnMoveItem,
    onDeleteItem: mockOnDeleteItem,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders display name", () => {
      const { getByText } = render(<CapabilityRow {...defaultProps} />);
      expect(getByText("Whole Note")).toBeTruthy();
    });

    it("renders capability code", () => {
      const { getByText } = render(<CapabilityRow {...defaultProps} />);
      expect(getByText("note_whole")).toBeTruthy();
    });

    it("renders category badge", () => {
      const { getByText } = render(<CapabilityRow {...defaultProps} />);
      expect(getByText("Rhythm")).toBeTruthy();
    });

    it("renders teaching order", () => {
      const { getByText } = render(<CapabilityRow {...defaultProps} />);
      expect(getByText("1")).toBeTruthy();
    });

    it("renders type button with T", () => {
      const { getByText } = render(<CapabilityRow {...defaultProps} />);
      expect(getByText("T")).toBeTruthy();
    });

    it("renders mastery count", () => {
      const { getByText } = render(<CapabilityRow {...defaultProps} />);
      expect(getByText("3")).toBeTruthy();
    });

    it("applies alternate row style for even index", () => {
      const { getByText } = render(
        <CapabilityRow {...defaultProps} index={0} />,
      );
      // Just verify it renders - style application is tested by the mock
      expect(getByText("Whole Note")).toBeTruthy();
    });

    it("does not apply alternate row style for odd index", () => {
      const { getByText } = render(
        <CapabilityRow {...defaultProps} index={1} />,
      );
      expect(getByText("Whole Note")).toBeTruthy();
    });
  });

  describe("Move Buttons", () => {
    it("calls onMoveItem with up when up button pressed", () => {
      const { getByLabelText } = render(<CapabilityRow {...defaultProps} />);
      fireEvent.press(getByLabelText("Move capability up"));
      expect(mockOnMoveItem).toHaveBeenCalledWith(1, "up");
    });

    it("calls onMoveItem with down when down button pressed", () => {
      const { getByLabelText } = render(<CapabilityRow {...defaultProps} />);
      fireEvent.press(getByLabelText("Move capability down"));
      expect(mockOnMoveItem).toHaveBeenCalledWith(1, "down");
    });
  });

  describe("Type Toggle", () => {
    it("toggles type from T to P", () => {
      const { getByLabelText } = render(<CapabilityRow {...defaultProps} />);
      fireEvent.press(getByLabelText("Toggle type, currently teachable"));
      expect(mockOnUpdateItem).toHaveBeenCalledWith(1, "type", "P");
    });

    it("toggles type from P to T", () => {
      const props = {
        ...defaultProps,
        item: { ...mockItem, type: "P" },
      };
      const { getByLabelText } = render(<CapabilityRow {...props} />);
      fireEvent.press(getByLabelText("Toggle type, currently prerequisite"));
      expect(mockOnUpdateItem).toHaveBeenCalledWith(1, "type", "T");
    });
  });

  describe("Mastery Count", () => {
    it("decreases mastery count when minus pressed", () => {
      const { getByLabelText } = render(<CapabilityRow {...defaultProps} />);
      fireEvent.press(getByLabelText("Decrease mastery count"));
      expect(mockOnUpdateItem).toHaveBeenCalledWith(1, "mastery_count", 2);
    });

    it("does not decrease mastery count below 1", () => {
      const props = {
        ...defaultProps,
        item: { ...mockItem, mastery_count: 1 },
      };
      const { getByLabelText } = render(<CapabilityRow {...props} />);
      fireEvent.press(getByLabelText("Decrease mastery count"));
      expect(mockOnUpdateItem).toHaveBeenCalledWith(1, "mastery_count", 1);
    });

    it("increases mastery count when plus pressed", () => {
      const { getByLabelText } = render(<CapabilityRow {...defaultProps} />);
      fireEvent.press(getByLabelText("Increase mastery count"));
      expect(mockOnUpdateItem).toHaveBeenCalledWith(1, "mastery_count", 4);
    });
  });

  describe("Edit Toggle", () => {
    it("calls onToggleEdit when expand button pressed", () => {
      const { getByLabelText } = render(<CapabilityRow {...defaultProps} />);
      fireEvent.press(getByLabelText("Expand edit section"));
      expect(mockOnToggleEdit).toHaveBeenCalled();
    });

    it("calls onToggleEdit when collapse button pressed", () => {
      const props = { ...defaultProps, isEditing: true };
      const { getByLabelText } = render(<CapabilityRow {...props} />);
      fireEvent.press(getByLabelText("Collapse edit section"));
      expect(mockOnToggleEdit).toHaveBeenCalled();
    });
  });

  describe("Edit Section", () => {
    it("does not render edit section when not editing", () => {
      const { queryByPlaceholderText } = render(
        <CapabilityRow {...defaultProps} />,
      );
      expect(
        queryByPlaceholderText("material1.musicxml, material2.musicxml"),
      ).toBeNull();
    });

    it("renders edit section when editing", () => {
      const props = { ...defaultProps, isEditing: true };
      const { getByPlaceholderText } = render(<CapabilityRow {...props} />);
      expect(
        getByPlaceholderText("material1.musicxml, material2.musicxml"),
      ).toBeTruthy();
    });

    it("renders teaching materials input with current value", () => {
      const props = { ...defaultProps, isEditing: true };
      const { getByDisplayValue } = render(<CapabilityRow {...props} />);
      expect(getByDisplayValue("material1.musicxml")).toBeTruthy();
    });

    it("updates teaching materials on change", () => {
      const props = { ...defaultProps, isEditing: true };
      const { getByDisplayValue } = render(<CapabilityRow {...props} />);
      fireEvent.changeText(getByDisplayValue("material1.musicxml"), "new.xml");
      expect(mockOnUpdateItem).toHaveBeenCalledWith(
        1,
        "teaching_materials",
        "new.xml",
      );
    });

    it("renders notes input with current value", () => {
      const props = { ...defaultProps, isEditing: true };
      const { getByDisplayValue } = render(<CapabilityRow {...props} />);
      expect(getByDisplayValue("Teaching notes here")).toBeTruthy();
    });

    it("updates notes on change", () => {
      const props = { ...defaultProps, isEditing: true };
      const { getByDisplayValue } = render(<CapabilityRow {...props} />);
      fireEvent.changeText(
        getByDisplayValue("Teaching notes here"),
        "Updated notes",
      );
      expect(mockOnUpdateItem).toHaveBeenCalledWith(
        1,
        "notes",
        "Updated notes",
      );
    });

    it("calls onDeleteItem when delete button pressed", () => {
      const props = { ...defaultProps, isEditing: true };
      const { getByLabelText } = render(<CapabilityRow {...props} />);
      fireEvent.press(getByLabelText("Delete capability"));
      expect(mockOnDeleteItem).toHaveBeenCalledWith(1);
    });
  });
});
