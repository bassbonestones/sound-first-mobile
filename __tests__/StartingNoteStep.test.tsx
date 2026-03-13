/**
 * @fileoverview Tests for StartingNoteStep component
 * Second step of onboarding - starting note selection via staff or microphone
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

// Mock StaffNotePicker
jest.mock("../src/components/StaffNotePicker", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return function MockStaffNotePicker({
    value,
    onChange,
    onPlayToSelect,
  }: {
    value?: string;
    onChange: (note: string) => void;
    onPlayToSelect?: () => void;
  }) {
    return (
      <View testID="staff-note-picker">
        <Text>StaffNotePicker</Text>
        <Text testID="selected-note">{value || "No note"}</Text>
        <TouchableOpacity testID="change-note" onPress={() => onChange("C4")}>
          <Text>Change Note</Text>
        </TouchableOpacity>
        {onPlayToSelect && (
          <TouchableOpacity testID="play-to-select" onPress={onPlayToSelect}>
            <Text>Play to Select</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
});

// Mock AudioInput
jest.mock("../src/components/AudioInput", () => {
  const { View, Text } = require("react-native");
  return function MockAudioInput({ enabled }: { enabled: boolean }) {
    return (
      <View testID="audio-input">
        <Text>AudioInput {enabled ? "enabled" : "disabled"}</Text>
      </View>
    );
  };
});

// Mock ResetButton
jest.mock("../src/components/ResetButton", () => {
  const { View } = require("react-native");
  return function MockResetButton() {
    return <View testID="reset-button" />;
  };
});

// Mock theme
jest.mock("../src/styles/theme", () => ({
  createShadow: jest.fn(() => ({})),
}));

import StartingNoteStep from "../src/screens/Onboarding/steps/StartingNoteStep";

describe("StartingNoteStep", () => {
  const mockOnChangeNote = jest.fn();
  const mockOnRealtimePitch = jest.fn();
  const mockOnFinalPitch = jest.fn();
  const mockOnSoundEnd = jest.fn();
  const mockOnConfirmPitch = jest.fn();
  const mockOnSetPlayToSelectMode = jest.fn();
  const mockOnBack = jest.fn();
  const mockOnSubmit = jest.fn();

  const defaultProps = {
    instrument: "Trumpet",
    instrumentIcon: "🎺",
    clef: "treble",
    startingNote: "",
    playToSelectMode: false,
    detectedPitch: null,
    isSounding: false,
    onChangeNote: mockOnChangeNote,
    onRealtimePitch: mockOnRealtimePitch,
    onFinalPitch: mockOnFinalPitch,
    onSoundEnd: mockOnSoundEnd,
    onConfirmPitch: mockOnConfirmPitch,
    onSetPlayToSelectMode: mockOnSetPlayToSelectMode,
    onBack: mockOnBack,
    onSubmit: mockOnSubmit,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // STAFF SELECT MODE TESTS
  // ==========================================================================
  describe("Staff Select Mode", () => {
    it("renders staff select mode by default", () => {
      const { getByText, getByTestId } = render(
        <StartingNoteStep {...defaultProps} />,
      );
      expect(getByText("Choose your starting note")).toBeTruthy();
      expect(getByTestId("staff-note-picker")).toBeTruthy();
    });

    it("displays instrument icon", () => {
      const { getByText } = render(<StartingNoteStep {...defaultProps} />);
      expect(getByText("🎺")).toBeTruthy();
    });

    it("displays description text", () => {
      const { getByText } = render(<StartingNoteStep {...defaultProps} />);
      expect(getByText(/Pick a note that feels great/)).toBeTruthy();
    });

    it("displays hint text", () => {
      const { getByText } = render(<StartingNoteStep {...defaultProps} />);
      expect(
        getByText(/Don't worry about picking the "perfect" note/),
      ).toBeTruthy();
    });

    it("renders back button", () => {
      const { getByText, getByLabelText } = render(
        <StartingNoteStep {...defaultProps} />,
      );
      expect(getByText("← Back")).toBeTruthy();
      expect(getByLabelText("Go back")).toBeTruthy();
    });

    it("calls onBack when back button pressed", () => {
      const { getByText } = render(<StartingNoteStep {...defaultProps} />);
      fireEvent.press(getByText("← Back"));
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it("renders Start Practicing button", () => {
      const { getByText, getByLabelText } = render(
        <StartingNoteStep {...defaultProps} />,
      );
      expect(getByText("Start Practicing 🎵")).toBeTruthy();
      expect(getByLabelText("Start practicing")).toBeTruthy();
    });

    it("Start Practicing button is disabled when no note selected", () => {
      const { getByLabelText } = render(<StartingNoteStep {...defaultProps} />);
      const button = getByLabelText("Start practicing");
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });

    it("Start Practicing button is enabled when note is selected", () => {
      const props = { ...defaultProps, startingNote: "C4" };
      const { getByLabelText } = render(<StartingNoteStep {...props} />);
      const button = getByLabelText("Start practicing");
      expect(button.props.accessibilityState?.disabled).toBeFalsy();
    });

    it("calls onSubmit when Start Practicing pressed with note", () => {
      const props = { ...defaultProps, startingNote: "C4" };
      const { getByText } = render(<StartingNoteStep {...props} />);
      fireEvent.press(getByText("Start Practicing 🎵"));
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it("renders progress dots at step 2", () => {
      const { toJSON } = render(<StartingNoteStep {...defaultProps} />);
      expect(toJSON()).toBeTruthy();
    });

    it("renders ResetButton", () => {
      const { getByTestId } = render(<StartingNoteStep {...defaultProps} />);
      expect(getByTestId("reset-button")).toBeTruthy();
    });

    it("calls onChangeNote when note changed in picker", () => {
      const { getByTestId } = render(<StartingNoteStep {...defaultProps} />);
      fireEvent.press(getByTestId("change-note"));
      expect(mockOnChangeNote).toHaveBeenCalledWith("C4");
    });

    it("switches to play-to-select mode when button pressed", () => {
      const { getByTestId } = render(<StartingNoteStep {...defaultProps} />);
      fireEvent.press(getByTestId("play-to-select"));
      expect(mockOnSetPlayToSelectMode).toHaveBeenCalledWith(true);
    });
  });

  // ==========================================================================
  // PLAY TO SELECT MODE TESTS
  // ==========================================================================
  describe("Play to Select Mode", () => {
    const playToSelectProps = {
      ...defaultProps,
      playToSelectMode: true,
    };

    it("renders play-to-select mode when enabled", () => {
      const { getByText, getByTestId } = render(
        <StartingNoteStep {...playToSelectProps} />,
      );
      expect(getByText("Play a note that feels great")).toBeTruthy();
      expect(getByTestId("audio-input")).toBeTruthy();
    });

    it("displays instrument icon", () => {
      const { getByText } = render(<StartingNoteStep {...playToSelectProps} />);
      expect(getByText("🎺")).toBeTruthy();
    });

    it("displays description text", () => {
      const { getByText } = render(<StartingNoteStep {...playToSelectProps} />);
      expect(getByText(/Play around on your instrument/)).toBeTruthy();
    });

    it("renders back to staff button", () => {
      const { getByText } = render(<StartingNoteStep {...playToSelectProps} />);
      expect(getByText("← Back to staff")).toBeTruthy();
    });

    it("switches back to staff mode when back pressed", () => {
      const { getByText } = render(<StartingNoteStep {...playToSelectProps} />);
      fireEvent.press(getByText("← Back to staff"));
      expect(mockOnSetPlayToSelectMode).toHaveBeenCalledWith(false);
    });

    it("renders confirm button", () => {
      const { getByText, getByLabelText } = render(
        <StartingNoteStep {...playToSelectProps} />,
      );
      expect(getByText("Yes, that's my note! ✓")).toBeTruthy();
      expect(getByLabelText("Confirm this is my note")).toBeTruthy();
    });

    it("confirm button is disabled when no pitch detected", () => {
      const { getByLabelText } = render(
        <StartingNoteStep {...playToSelectProps} />,
      );
      const button = getByLabelText("Confirm this is my note");
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });

    it("confirm button is enabled when pitch is detected", () => {
      const props = {
        ...playToSelectProps,
        detectedPitch: { noteName: "C4", isInTune: true },
      };
      const { getByLabelText } = render(<StartingNoteStep {...props} />);
      const button = getByLabelText("Confirm this is my note");
      expect(button.props.accessibilityState?.disabled).toBeFalsy();
    });

    it("calls onConfirmPitch when confirm pressed", () => {
      const props = {
        ...playToSelectProps,
        detectedPitch: { noteName: "C4", isInTune: true },
      };
      const { getByText } = render(<StartingNoteStep {...props} />);
      fireEvent.press(getByText("Yes, that's my note! ✓"));
      expect(mockOnConfirmPitch).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // DETECTED PITCH DISPLAY TESTS
  // ==========================================================================
  describe("Detected Pitch Display", () => {
    const playToSelectProps = {
      ...defaultProps,
      playToSelectMode: true,
    };

    it("does not show pitch display when no pitch detected", () => {
      const { queryByText } = render(
        <StartingNoteStep {...playToSelectProps} />,
      );
      expect(queryByText("I hear:")).toBeNull();
      expect(queryByText("Detected:")).toBeNull();
    });

    it('shows "I hear:" when sounding', () => {
      const props = {
        ...playToSelectProps,
        isSounding: true,
        detectedPitch: {
          noteName: "C4",
          isRealtime: true,
          isInTune: true,
          cents: 0,
        },
      };
      const { getByText } = render(<StartingNoteStep {...props} />);
      expect(getByText("I hear:")).toBeTruthy();
    });

    it('shows "Detected:" when not sounding', () => {
      const props = {
        ...playToSelectProps,
        isSounding: false,
        detectedPitch: {
          noteName: "C4",
          isRealtime: false,
          isInTune: true,
          cents: 0,
        },
      };
      const { getByText } = render(<StartingNoteStep {...props} />);
      expect(getByText("Detected:")).toBeTruthy();
    });

    it("shows detected note name", () => {
      const props = {
        ...playToSelectProps,
        detectedPitch: { noteName: "Bb4", isRealtime: false },
      };
      const { getByText } = render(<StartingNoteStep {...props} />);
      expect(getByText("Bb4")).toBeTruthy();
    });

    it('shows "In tune ✓" when in tune', () => {
      const props = {
        ...playToSelectProps,
        isSounding: true,
        detectedPitch: { noteName: "C4", isRealtime: true, isInTune: true },
      };
      const { getByText } = render(<StartingNoteStep {...props} />);
      expect(getByText("In tune ✓")).toBeTruthy();
    });

    it("shows cents deviation when not in tune", () => {
      const props = {
        ...playToSelectProps,
        isSounding: true,
        detectedPitch: {
          noteName: "C4",
          isRealtime: true,
          isInTune: false,
          cents: 15,
        },
      };
      const { getByText } = render(<StartingNoteStep {...props} />);
      expect(getByText("+15 cents")).toBeTruthy();
    });

    it("shows negative cents", () => {
      const props = {
        ...playToSelectProps,
        isSounding: true,
        detectedPitch: {
          noteName: "C4",
          isRealtime: true,
          isInTune: false,
          cents: -10,
        },
      };
      const { getByText } = render(<StartingNoteStep {...props} />);
      expect(getByText("-10 cents")).toBeTruthy();
    });
  });

  // ==========================================================================
  // DIFFERENT INSTRUMENTS TESTS
  // ==========================================================================
  describe("Different Instruments", () => {
    it("displays correct icon for different instruments", () => {
      const props = {
        ...defaultProps,
        instrumentIcon: "🎻",
        instrument: "Violin",
      };
      const { getByText } = render(<StartingNoteStep {...props} />);
      expect(getByText("🎻")).toBeTruthy();
    });
  });
});
