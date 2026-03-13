/**
 * Tests for DetectionRuleEditor component
 *
 * Tests the detection rule editor for configuring how capabilities are detected in MusicXML.
 */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

import DetectionRuleEditor from "../src/screens/Admin/tabs/CapabilityExplorer/components/DetectionRuleEditor";

// Mock styles
jest.mock("../src/screens/Admin/styles", () => ({
  formFieldContainer: {},
  formFieldLabel: {},
  prereqHint: {},
  addPrereqButton: {},
  addPrereqButtonText: {},
  detectionRuleContainer: {},
  detectionFieldRow: {},
  detectionFieldLabel: {},
  detectionPickerContainer: {},
  detectionPickerOption: {},
  detectionPickerOptionSelected: {},
  detectionPickerOptionText: {},
  detectionPickerOptionTextSelected: {},
  detectionFieldInput: {},
  compoundRulesContainer: {},
  compoundRulesLabel: {},
  subRuleContainer: {},
  subRuleHeader: {},
  subRuleIndex: {},
  subRuleRemove: {},
  subRuleRemoveText: {},
  addSubRuleButton: {},
  addSubRuleButtonText: {},
  removeRuleButton: {},
  removeRuleButtonText: {},
}));

const mockOptions = {
  types: [
    "element",
    "value_match",
    "interval",
    "text_match",
    "time_signature",
    "range",
    "custom",
    "compound",
  ],
  sources: ["notes", "clefs", "time_signatures", "dynamics"],
  custom_functions: ["detect_syncopation", "detect_ties"],
};

describe("DetectionRuleEditor", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Loading State", () => {
    it("shows loading indicator when options are null", () => {
      const { getByText } = render(
        <DetectionRuleEditor
          rule={null}
          options={null}
          onChange={mockOnChange}
        />,
      );

      expect(getByText("Loading detection options...")).toBeTruthy();
    });
  });

  describe("No Rule State", () => {
    it("shows add button when no rule exists", () => {
      const { getByLabelText } = render(
        <DetectionRuleEditor
          rule={null}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      expect(getByLabelText("Add detection rule")).toBeTruthy();
    });

    it("creates empty rule when add button pressed", () => {
      const { getByLabelText } = render(
        <DetectionRuleEditor
          rule={null}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      fireEvent.press(getByLabelText("Add detection rule"));

      expect(mockOnChange).toHaveBeenCalledWith({
        type: "element",
        source: "notes",
        threshold: 1,
      });
    });
  });

  describe("Rule Type Selection", () => {
    it("renders type options", () => {
      const rule = { type: "element", source: "notes", threshold: 1 };
      const { getByLabelText } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      expect(getByLabelText("Select element type")).toBeTruthy();
      expect(getByLabelText("Select value match type")).toBeTruthy();
      expect(getByLabelText("Select interval type")).toBeTruthy();
    });

    it("updates type when type button pressed", () => {
      const rule = { type: "element", source: "notes", threshold: 1 };
      const { getByLabelText } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      fireEvent.press(getByLabelText("Select interval type"));

      // Verify onChange was called - type changes reset type-specific fields
      expect(mockOnChange).toHaveBeenCalled();
      const call = mockOnChange.mock.calls[0][0];
      expect(call.type).toBe("interval");
    });
  });

  describe("Element Type Fields", () => {
    it("shows source selector for element type", () => {
      const rule = { type: "element", source: "notes", threshold: 1 };
      const { getByLabelText } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      expect(getByLabelText("Select notes source")).toBeTruthy();
      expect(getByLabelText("Select clefs source")).toBeTruthy();
    });

    it("updates source when source button pressed", () => {
      const rule = { type: "element", source: "notes", threshold: 1 };
      const { getByLabelText } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      fireEvent.press(getByLabelText("Select clefs source"));

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ source: "clefs" }),
      );
    });

    it("shows element type input", () => {
      const rule = { type: "element", source: "notes", threshold: 1 };
      const { getByPlaceholderText } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      expect(getByPlaceholderText("e.g., Staccato")).toBeTruthy();
    });
  });

  describe("Interval Type Fields", () => {
    it("shows semitones input for interval type", () => {
      const rule = { type: "interval", source: "notes", threshold: 1 };
      const { getByPlaceholderText } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      expect(getByPlaceholderText("e.g., 7 for perfect fifth")).toBeTruthy();
    });

    it("shows direction options", () => {
      const rule = { type: "interval", source: "notes", threshold: 1 };
      const { getByLabelText } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      expect(getByLabelText("Select ascending direction")).toBeTruthy();
      expect(getByLabelText("Select descending direction")).toBeTruthy();
      expect(getByLabelText("Select any direction")).toBeTruthy();
    });

    it("updates direction when direction button pressed", () => {
      const rule = { type: "interval", source: "notes", threshold: 1 };
      const { getByLabelText } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      fireEvent.press(getByLabelText("Select ascending direction"));

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ direction: "ascending" }),
      );
    });
  });

  describe("Value Match Type Fields", () => {
    it("shows value input for value_match type", () => {
      const rule = { type: "value_match", source: "notes", threshold: 1 };
      const { getByPlaceholderText } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      expect(getByPlaceholderText("Value to match")).toBeTruthy();
    });
  });

  describe("Text Match Type Fields", () => {
    it("shows pattern input for text_match type", () => {
      const rule = { type: "text_match", source: "notes", threshold: 1 };
      const { getByPlaceholderText } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      expect(getByPlaceholderText("Text pattern or regex")).toBeTruthy();
    });

    it("shows match type options", () => {
      const rule = { type: "text_match", source: "notes", threshold: 1 };
      const { getByLabelText } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      expect(getByLabelText("Select contains match type")).toBeTruthy();
      expect(getByLabelText("Select exact match type")).toBeTruthy();
      expect(getByLabelText("Select regex match type")).toBeTruthy();
    });
  });

  describe("Time Signature Type Fields", () => {
    it("shows numerator and denominator inputs", () => {
      const rule = { type: "time_signature", threshold: 1 };
      const { getByPlaceholderText, getAllByPlaceholderText } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      expect(getAllByPlaceholderText("4")).toHaveLength(2);
    });

    it("updates numerator on input", () => {
      const rule = { type: "time_signature", threshold: 1 };
      const { getAllByPlaceholderText } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      const inputs = getAllByPlaceholderText("4");
      fireEvent.changeText(inputs[0], "6");

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ numerator: 6 }),
      );
    });
  });

  describe("Range Type Fields", () => {
    it("shows min and max inputs", () => {
      const rule = { type: "range", source: "notes", threshold: 1 };
      const { getByPlaceholderText } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      expect(getByPlaceholderText("Min")).toBeTruthy();
      expect(getByPlaceholderText("Max")).toBeTruthy();
    });
  });

  describe("Custom Type Fields", () => {
    it("shows custom function options", () => {
      const rule = { type: "custom", threshold: 1 };
      const { getByLabelText } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      expect(
        getByLabelText("Select detect_syncopation custom function"),
      ).toBeTruthy();
      expect(getByLabelText("Select detect_ties custom function")).toBeTruthy();
    });

    it("updates custom function when option pressed", () => {
      const rule = { type: "custom", threshold: 1 };
      const { getByLabelText } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      fireEvent.press(
        getByLabelText("Select detect_syncopation custom function"),
      );

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ custom_function: "detect_syncopation" }),
      );
    });
  });

  describe("Compound Rules", () => {
    it("shows add sub-rule button for compound type", () => {
      const rule = { type: "compound" };
      const { getByLabelText } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      expect(getByLabelText("Add sub-rule")).toBeTruthy();
    });

    it("adds sub-rule when add button pressed", () => {
      const rule = { type: "compound" };
      const { getByLabelText } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      fireEvent.press(getByLabelText("Add sub-rule"));

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          rules: [{ type: "element", source: "notes", threshold: 1 }],
        }),
      );
    });

    it("shows existing sub-rules", () => {
      const rule = {
        type: "compound",
        rules: [
          { type: "element", source: "notes", threshold: 1 },
          { type: "interval", source: "notes", threshold: 1 },
        ],
      };
      const { getByText } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      expect(getByText("Rule 1")).toBeTruthy();
      expect(getByText("Rule 2")).toBeTruthy();
    });

    it("removes sub-rule when remove button pressed", () => {
      const rule = {
        type: "compound",
        rules: [
          { type: "element", source: "notes", threshold: 1 },
          { type: "interval", source: "notes", threshold: 1 },
        ],
      };
      const { getByLabelText } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      fireEvent.press(getByLabelText("Remove sub-rule 1"));

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          rules: [{ type: "interval", source: "notes", threshold: 1 }],
        }),
      );
    });

    it("updates sub-rule type", () => {
      const rule = {
        type: "compound",
        rules: [{ type: "element", source: "notes", threshold: 1 }],
      };
      const { getByLabelText } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      fireEvent.press(getByLabelText("Select interval type for sub-rule"));

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          rules: [{ type: "interval", source: "notes", threshold: 1 }],
        }),
      );
    });
  });

  describe("Threshold", () => {
    it("shows threshold input for non-compound types", () => {
      const rule = { type: "element", source: "notes", threshold: 1 };
      const { getByDisplayValue } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      expect(getByDisplayValue("1")).toBeTruthy();
    });

    it("updates threshold on input", () => {
      const rule = { type: "element", source: "notes", threshold: 1 };
      const { getByDisplayValue } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      fireEvent.changeText(getByDisplayValue("1"), "5");

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ threshold: 5 }),
      );
    });
  });

  describe("Remove Rule", () => {
    it("shows remove rule button when rule exists", () => {
      const rule = { type: "element", source: "notes", threshold: 1 };
      const { getByLabelText } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      expect(getByLabelText("Remove detection rule")).toBeTruthy();
    });

    it("removes rule when remove button pressed", () => {
      const rule = { type: "element", source: "notes", threshold: 1 };
      const { getByLabelText } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      fireEvent.press(getByLabelText("Remove detection rule"));

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });
  });

  describe("Help Text", () => {
    it("shows description hint", () => {
      const rule = { type: "element", source: "notes", threshold: 1 };
      const { getByText } = render(
        <DetectionRuleEditor
          rule={rule}
          options={mockOptions}
          onChange={mockOnChange}
        />,
      );

      expect(
        getByText(
          "Configure how this capability is detected in MusicXML files.",
        ),
      ).toBeTruthy();
    });
  });
});
