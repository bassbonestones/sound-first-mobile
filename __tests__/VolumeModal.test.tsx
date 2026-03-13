/**
 * @fileoverview Tests for VolumeModal component
 * Volume control modal for metronome and drone
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

// Mock Slider component
jest.mock("@react-native-community/slider", () => {
  const { View } = require("react-native");
  const MockSlider = (props: {
    value?: number;
    onValueChange?: (value: number) => void;
    testID?: string;
  }) => (
    <View
      testID={props.testID || "slider"}
      accessibilityValue={{ now: props.value }}
      onAccessibilityTap={() => props.onValueChange?.(0.5)}
    />
  );
  MockSlider.displayName = "Slider";
  return MockSlider;
});

// Mock styles
jest.mock("../src/screens/Session/components/styles", () => ({
  styles: {
    modalBackdrop: {},
    volumeModalContainer: {},
    volumeModalTitle: {},
    volumeSection: {},
    volumeLabelMetronome: {},
    volumeLabelDrone: {},
    slider: {},
    doneButton: {},
    doneButtonText: {},
  },
  colors: {
    metronome: "#FF5722",
    drone: "#4CAF50",
  },
}));

import VolumeModal from "../src/screens/Session/components/VolumeModal";

describe("VolumeModal", () => {
  const mockOnClose = jest.fn();
  const mockSetMetronomeVolume = jest.fn();
  const mockSetDroneVolume = jest.fn();

  const defaultProps = {
    visible: true,
    onClose: mockOnClose,
    metronomeVolume: 0.75,
    setMetronomeVolume: mockSetMetronomeVolume,
    droneVolume: 0.5,
    setDroneVolume: mockSetDroneVolume,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // VISIBILITY TESTS
  // ==========================================================================
  describe("Visibility", () => {
    it("renders when visible is true", () => {
      const { getByText } = render(<VolumeModal {...defaultProps} />);
      expect(getByText("Volume Control")).toBeTruthy();
    });

    it("does not render content when visible is false", () => {
      const { queryByText } = render(
        <VolumeModal {...defaultProps} visible={false} />,
      );
      expect(queryByText("Volume Control")).toBeNull();
    });
  });

  // ==========================================================================
  // CONTENT TESTS
  // ==========================================================================
  describe("Content", () => {
    it("renders title", () => {
      const { getByText } = render(<VolumeModal {...defaultProps} />);
      expect(getByText("Volume Control")).toBeTruthy();
    });

    it("renders metronome volume label with percentage", () => {
      const { getByText } = render(<VolumeModal {...defaultProps} />);
      expect(getByText("🥁 Metronome: 75%")).toBeTruthy();
    });

    it("renders drone volume label with percentage", () => {
      const { getByText } = render(<VolumeModal {...defaultProps} />);
      expect(getByText("🎶 Drone: 50%")).toBeTruthy();
    });

    it("displays 0% for zero volume", () => {
      const props = { ...defaultProps, metronomeVolume: 0 };
      const { getByText } = render(<VolumeModal {...props} />);
      expect(getByText("🥁 Metronome: 0%")).toBeTruthy();
    });

    it("displays 100% for full volume", () => {
      const props = { ...defaultProps, droneVolume: 1 };
      const { getByText } = render(<VolumeModal {...props} />);
      expect(getByText("🎶 Drone: 100%")).toBeTruthy();
    });

    it("rounds decimal percentages", () => {
      const props = { ...defaultProps, metronomeVolume: 0.333 };
      const { getByText } = render(<VolumeModal {...props} />);
      expect(getByText("🥁 Metronome: 33%")).toBeTruthy();
    });
  });

  // ==========================================================================
  // DONE BUTTON TESTS
  // ==========================================================================
  describe("Done Button", () => {
    it("renders Done button", () => {
      const { getByText } = render(<VolumeModal {...defaultProps} />);
      expect(getByText("Done")).toBeTruthy();
    });

    it("calls onClose when Done is pressed", () => {
      const { getByText } = render(<VolumeModal {...defaultProps} />);
      fireEvent.press(getByText("Done"));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================
  describe("Accessibility", () => {
    it("has accessible Done button", () => {
      const { getByLabelText } = render(<VolumeModal {...defaultProps} />);
      expect(getByLabelText("Close volume control")).toBeTruthy();
    });

    it("Done button has button role", () => {
      const { getByRole } = render(<VolumeModal {...defaultProps} />);
      expect(getByRole("button")).toBeTruthy();
    });
  });

  // ==========================================================================
  // VOLUME VARIATION TESTS
  // ==========================================================================
  describe("Volume Variations", () => {
    it("handles very low volumes", () => {
      const props = {
        ...defaultProps,
        metronomeVolume: 0.01,
        droneVolume: 0.02,
      };
      const { getByText } = render(<VolumeModal {...props} />);
      expect(getByText("🥁 Metronome: 1%")).toBeTruthy();
      expect(getByText("🎶 Drone: 2%")).toBeTruthy();
    });

    it("handles mid-range volumes", () => {
      const props = { ...defaultProps, metronomeVolume: 0.5, droneVolume: 0.5 };
      const { getByText } = render(<VolumeModal {...props} />);
      expect(getByText("🥁 Metronome: 50%")).toBeTruthy();
      expect(getByText("🎶 Drone: 50%")).toBeTruthy();
    });
  });
});
