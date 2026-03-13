/**
 * @fileoverview Tests for ToolsPanel component
 * Metronome/Drone toggles, mute button, and tool components
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

// Mock Metronome component
jest.mock("../src/components/Metronome", () => {
  const { View, Text } = require("react-native");
  const MockMetronome = (props: {
    initialTempo?: number;
    visible?: boolean;
  }) => (
    <View testID="metronome">
      <Text>Metronome</Text>
      {props.initialTempo && <Text>Tempo: {props.initialTempo}</Text>}
    </View>
  );
  MockMetronome.displayName = "Metronome";
  return MockMetronome;
});

// Mock PitchDrone component
jest.mock("../src/components/PitchDrone", () => {
  const { View, Text } = require("react-native");
  const MockPitchDrone = (props: {
    initialNote?: string;
    visible?: boolean;
  }) => (
    <View testID="pitch-drone">
      <Text>PitchDrone</Text>
      {props.initialNote && <Text>Note: {props.initialNote}</Text>}
    </View>
  );
  MockPitchDrone.displayName = "PitchDrone";
  return MockPitchDrone;
});

// Mock styles
jest.mock("../src/screens/Session/components/styles", () => ({
  styles: {
    toolsRow: {},
    toggleButton: {},
    toggleButtonRight: {},
    toggleButtonMetronomeActive: {},
    toggleButtonDroneActive: {},
    toggleButtonText: {},
    toggleButtonTextActive: {},
    muteButton: {},
    muteButtonActive: {},
    muteButtonText: {},
    toolWrapper: {},
    toolWrapperDrone: {},
  },
  colors: {},
}));

import ToolsPanel from "../src/screens/Session/components/ToolsPanel";

describe("ToolsPanel", () => {
  const mockSetMetronomeVisible = jest.fn();
  const mockSetMetronomeIsPlaying = jest.fn();
  const mockSetDroneVisible = jest.fn();
  const mockSetDroneIsPlaying = jest.fn();
  const mockToggleMetronome = jest.fn();
  const mockToggleDrone = jest.fn();
  const mockStartMuteLongPress = jest.fn();
  const mockCancelMuteLongPress = jest.fn();
  const mockHandleMutePress = jest.fn();

  const defaultProps = {
    mini: { key: "C", tempo: 80 },
    metronomeEnabled: false,
    droneEnabled: false,
    metronomeVisible: true,
    setMetronomeVisible: mockSetMetronomeVisible,
    setMetronomeIsPlaying: mockSetMetronomeIsPlaying,
    droneVisible: true,
    setDroneVisible: mockSetDroneVisible,
    setDroneIsPlaying: mockSetDroneIsPlaying,
    audioMuted: false,
    metronomeVolume: 0.75,
    droneVolume: 0.5,
    toggleMetronome: mockToggleMetronome,
    toggleDrone: mockToggleDrone,
    startMuteLongPress: mockStartMuteLongPress,
    cancelMuteLongPress: mockCancelMuteLongPress,
    handleMutePress: mockHandleMutePress,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // TOGGLE BUTTONS TESTS
  // ==========================================================================
  describe("Toggle Buttons", () => {
    it("renders metronome toggle button", () => {
      const { getByText } = render(<ToolsPanel {...defaultProps} />);
      expect(getByText("🥁 Metronome")).toBeTruthy();
    });

    it("renders drone toggle button", () => {
      const { getByText } = render(<ToolsPanel {...defaultProps} />);
      expect(getByText("🎶 Drone")).toBeTruthy();
    });

    it("calls toggleMetronome when metronome button pressed", () => {
      const { getByText } = render(<ToolsPanel {...defaultProps} />);
      fireEvent.press(getByText("🥁 Metronome"));
      expect(mockToggleMetronome).toHaveBeenCalledTimes(1);
    });

    it("calls toggleDrone when drone button pressed", () => {
      const { getByText } = render(<ToolsPanel {...defaultProps} />);
      fireEvent.press(getByText("🎶 Drone"));
      expect(mockToggleDrone).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================
  describe("Accessibility", () => {
    it("has enable metronome label when disabled", () => {
      const { getByLabelText } = render(<ToolsPanel {...defaultProps} />);
      expect(getByLabelText("Enable metronome")).toBeTruthy();
    });

    it("has disable metronome label when enabled", () => {
      const props = { ...defaultProps, metronomeEnabled: true };
      const { getByLabelText } = render(<ToolsPanel {...props} />);
      expect(getByLabelText("Disable metronome")).toBeTruthy();
    });

    it("has enable drone label when disabled", () => {
      const { getByLabelText } = render(<ToolsPanel {...defaultProps} />);
      expect(getByLabelText("Enable drone")).toBeTruthy();
    });

    it("has disable drone label when enabled", () => {
      const props = { ...defaultProps, droneEnabled: true };
      const { getByLabelText } = render(<ToolsPanel {...props} />);
      expect(getByLabelText("Disable drone")).toBeTruthy();
    });
  });

  // ==========================================================================
  // MUTE BUTTON TESTS
  // ==========================================================================
  describe("Mute Button", () => {
    it("does not render mute button when no tools enabled", () => {
      const { queryByText } = render(<ToolsPanel {...defaultProps} />);
      expect(queryByText(/Mute/)).toBeNull();
    });

    it("renders mute button when metronome enabled", () => {
      const props = { ...defaultProps, metronomeEnabled: true };
      const { getByText } = render(<ToolsPanel {...props} />);
      expect(getByText("🔊 Mute (hold for volume)")).toBeTruthy();
    });

    it("renders mute button when drone enabled", () => {
      const props = { ...defaultProps, droneEnabled: true };
      const { getByText } = render(<ToolsPanel {...props} />);
      expect(getByText("🔊 Mute (hold for volume)")).toBeTruthy();
    });

    it("renders unmute button when muted", () => {
      const props = { ...defaultProps, droneEnabled: true, audioMuted: true };
      const { getByText } = render(<ToolsPanel {...props} />);
      expect(getByText("🔇 Unmute (hold for volume)")).toBeTruthy();
    });

    it("calls handleMutePress on tap", () => {
      const props = { ...defaultProps, metronomeEnabled: true };
      const { getByText } = render(<ToolsPanel {...props} />);
      fireEvent.press(getByText("🔊 Mute (hold for volume)"));
      expect(mockHandleMutePress).toHaveBeenCalledTimes(1);
    });

    it("calls startMuteLongPress on press in", () => {
      const props = { ...defaultProps, metronomeEnabled: true };
      const { getByText } = render(<ToolsPanel {...props} />);
      fireEvent(getByText("🔊 Mute (hold for volume)"), "onPressIn");
      expect(mockStartMuteLongPress).toHaveBeenCalledTimes(1);
    });

    it("calls cancelMuteLongPress on press out", () => {
      const props = { ...defaultProps, metronomeEnabled: true };
      const { getByText } = render(<ToolsPanel {...props} />);
      fireEvent(getByText("🔊 Mute (hold for volume)"), "onPressOut");
      expect(mockCancelMuteLongPress).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // METRONOME COMPONENT TESTS
  // ==========================================================================
  describe("Metronome Component", () => {
    it("does not render Metronome when disabled", () => {
      const { queryByTestId } = render(<ToolsPanel {...defaultProps} />);
      expect(queryByTestId("metronome")).toBeNull();
    });

    it("renders Metronome when enabled", () => {
      const props = { ...defaultProps, metronomeEnabled: true };
      const { getByTestId } = render(<ToolsPanel {...props} />);
      expect(getByTestId("metronome")).toBeTruthy();
    });

    it("passes tempo from mini to Metronome", () => {
      const props = {
        ...defaultProps,
        metronomeEnabled: true,
        mini: { tempo: 120 },
      };
      const { getByText } = render(<ToolsPanel {...props} />);
      expect(getByText("Tempo: 120")).toBeTruthy();
    });

    it("uses default tempo when mini.tempo is undefined", () => {
      const props = { ...defaultProps, metronomeEnabled: true, mini: {} };
      const { getByText } = render(<ToolsPanel {...props} />);
      expect(getByText("Tempo: 80")).toBeTruthy(); // Default is 80
    });
  });

  // ==========================================================================
  // PITCH DRONE COMPONENT TESTS
  // ==========================================================================
  describe("PitchDrone Component", () => {
    it("does not render PitchDrone when disabled", () => {
      const { queryByTestId } = render(<ToolsPanel {...defaultProps} />);
      expect(queryByTestId("pitch-drone")).toBeNull();
    });

    it("renders PitchDrone when enabled", () => {
      const props = { ...defaultProps, droneEnabled: true };
      const { getByTestId } = render(<ToolsPanel {...props} />);
      expect(getByTestId("pitch-drone")).toBeTruthy();
    });

    it("passes key from mini to PitchDrone", () => {
      const props = { ...defaultProps, droneEnabled: true, mini: { key: "G" } };
      const { getByText } = render(<ToolsPanel {...props} />);
      expect(getByText("Note: G")).toBeTruthy();
    });

    it("uses default key when mini.key is undefined", () => {
      const props = { ...defaultProps, droneEnabled: true, mini: {} };
      const { getByText } = render(<ToolsPanel {...props} />);
      expect(getByText("Note: C")).toBeTruthy(); // Default is C
    });
  });

  // ==========================================================================
  // BOTH TOOLS ENABLED TESTS
  // ==========================================================================
  describe("Both Tools Enabled", () => {
    it("renders both components when both enabled", () => {
      const props = {
        ...defaultProps,
        metronomeEnabled: true,
        droneEnabled: true,
      };
      const { getByTestId } = render(<ToolsPanel {...props} />);
      expect(getByTestId("metronome")).toBeTruthy();
      expect(getByTestId("pitch-drone")).toBeTruthy();
    });
  });

  // ==========================================================================
  // MINI PROP VARIATIONS
  // ==========================================================================
  describe("Mini Prop Variations", () => {
    it("handles null mini prop with tools disabled", () => {
      const props = { ...defaultProps, mini: null };
      const { getByText } = render(<ToolsPanel {...props} />);
      expect(getByText("🥁 Metronome")).toBeTruthy();
      expect(getByText("🎶 Drone")).toBeTruthy();
    });
  });
});
