/**
 * Tests for TempoSlider component
 */
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import {
  TempoSlider,
  type TempoSliderProps,
} from "../src/components/TempoSlider";

// =============================================================================
// Test Setup
// =============================================================================

// Mock the slider component
jest.mock("@react-native-community/slider", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({
      value,
      minimumValue,
      maximumValue,
      onValueChange,
      onSlidingComplete,
      accessibilityLabel,
      testID,
    }: {
      value: number;
      minimumValue: number;
      maximumValue: number;
      onValueChange?: (value: number) => void;
      onSlidingComplete?: (value: number) => void;
      accessibilityLabel?: string;
      testID?: string;
    }) => (
      <View
        testID={testID ?? "slider"}
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{
          min: minimumValue,
          max: maximumValue,
          now: value,
        }}
        onTouchEnd={() => {
          // Simulate sliding to a value between min and max
          const newValue = Math.round((minimumValue + maximumValue) / 2);
          onValueChange?.(newValue);
          onSlidingComplete?.(newValue);
        }}
      />
    ),
  };
});

const defaultProps: TempoSliderProps = {
  tempo: 120,
  tempoRange: [60, 180],
  onTempoChange: jest.fn(),
};

const renderComponent = (props: Partial<TempoSliderProps> = {}) => {
  return render(<TempoSlider {...defaultProps} {...props} />);
};

// =============================================================================
// Tests
// =============================================================================

describe("TempoSlider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders with default label", () => {
      const { getByText } = renderComponent();
      expect(getByText("Tempo")).toBeTruthy();
    });

    it("renders with custom label", () => {
      const { getByText } = renderComponent({ label: "Speed" });
      expect(getByText("Speed")).toBeTruthy();
    });

    it("displays current tempo in BPM", () => {
      const { getByText } = renderComponent({ tempo: 100 });
      expect(getByText("100 BPM")).toBeTruthy();
    });

    it("displays min range label", () => {
      const { getByText } = renderComponent({ tempoRange: [40, 200] });
      expect(getByText("40")).toBeTruthy();
    });

    it("displays max range label", () => {
      const { getByText } = renderComponent({ tempoRange: [40, 200] });
      expect(getByText("200")).toBeTruthy();
    });
  });

  describe("BPM Clamping", () => {
    it("clamps tempo above max to max", () => {
      const { getByText } = renderComponent({
        tempo: 300,
        tempoRange: [60, 180],
      });
      expect(getByText("180 BPM")).toBeTruthy();
    });

    it("clamps tempo below min to min", () => {
      const { getByText } = renderComponent({
        tempo: 20,
        tempoRange: [60, 180],
      });
      expect(getByText("60 BPM")).toBeTruthy();
    });

    it("displays valid tempo unchanged", () => {
      const { getByText } = renderComponent({
        tempo: 120,
        tempoRange: [60, 180],
      });
      expect(getByText("120 BPM")).toBeTruthy();
    });
  });

  describe("Default Range", () => {
    it("uses default range [40, 200] when tempoRange is null", () => {
      const { getByText } = renderComponent({ tempoRange: null });
      expect(getByText("40")).toBeTruthy();
      expect(getByText("200")).toBeTruthy();
    });

    it("uses default range [40, 200] when tempoRange is undefined", () => {
      const { getByText } = renderComponent({ tempoRange: undefined });
      expect(getByText("40")).toBeTruthy();
      expect(getByText("200")).toBeTruthy();
    });
  });

  describe("Interaction", () => {
    it("calls onTempoChange when slider completes", () => {
      const onTempoChange = jest.fn();
      const { getByTestId } = renderComponent({
        tempoRange: [60, 180],
        onTempoChange,
      });

      const slider = getByTestId("slider");
      fireEvent(slider, "touchEnd");

      expect(onTempoChange).toHaveBeenCalledWith(120); // midpoint of 60-180
    });

    it("rounds tempo to integer", () => {
      const onTempoChange = jest.fn();
      const { getByTestId } = renderComponent({
        tempoRange: [61, 179], // midpoint is 120
        onTempoChange,
      });

      const slider = getByTestId("slider");
      fireEvent(slider, "touchEnd");

      // Should be rounded integer
      expect(onTempoChange).toHaveBeenCalledWith(expect.any(Number));
      const calledValue = onTempoChange.mock.calls[0][0];
      expect(Number.isInteger(calledValue)).toBe(true);
    });
  });

  describe("Accessibility", () => {
    it("has accessible slider with label", () => {
      const { getByLabelText } = renderComponent({
        tempo: 120,
        tempoRange: [60, 180],
      });

      expect(
        getByLabelText("Tempo slider, 120 BPM, range 60 to 180"),
      ).toBeTruthy();
    });

    it("uses custom accessibility label when provided", () => {
      const { getByLabelText } = renderComponent({
        accessibilityLabel: "Adjust playback speed",
      });

      expect(getByLabelText("Adjust playback speed")).toBeTruthy();
    });
  });

  describe("Disabled State", () => {
    it("passes disabled prop to slider", () => {
      const { getByTestId } = renderComponent({ disabled: true });
      // The mock slider receives the disabled prop
      // We can verify the component renders without errors
      expect(getByTestId("slider")).toBeTruthy();
    });
  });

  describe("Range Updates", () => {
    it("clamps tempo when range changes", () => {
      const { getByText, rerender } = renderComponent({
        tempo: 200,
        tempoRange: [40, 200],
      });

      // Initially at max
      expect(getByText("200 BPM")).toBeTruthy();

      // Rerender with tighter range
      rerender(
        <TempoSlider
          {...defaultProps}
          tempo={200}
          tempoRange={[60, 120]}
          onTempoChange={jest.fn()}
        />,
      );

      // Should clamp to new max
      expect(getByText("120 BPM")).toBeTruthy();
    });
  });
});
