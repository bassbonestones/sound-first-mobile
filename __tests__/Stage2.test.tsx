/**
 * @fileoverview Tests for Stage2 component
 * FirstNote Stage 2: Focus Card Practice - Listen, Sing, Imagine, Play steps
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

// Mock FirstNoteContext
const mockSetFocusCardIndex = jest.fn();
const mockSetFocusCardRatings = jest.fn();
const mockSetFocusStepsDone = jest.fn();
const mockSetFocusActiveStep = jest.fn();
const mockSetVolume = jest.fn();
const mockSetPitchAccuracy = jest.fn();
const mockHandlePitchMatch = jest.fn();
const mockPlayNote = jest.fn();
const mockStopAudio = jest.fn();
const mockNextStage = jest.fn();
const mockGoBack = jest.fn();

const mockFocusListenStartedRef = { current: false };

let mockContextValue: any = {
  noteInfo: { letter: "B", accidental: "♭" },
  instrument: "Trumpet",
  resonantNote: "Bb3",
  volume: 0.5,
  setVolume: mockSetVolume,
  pitchAccuracy: null,
  setPitchAccuracy: mockSetPitchAccuracy,
  handlePitchMatch: mockHandlePitchMatch,
  isPlaying: false,
  playNote: mockPlayNote,
  stopAudio: mockStopAudio,
  focusCardIndex: 0,
  setFocusCardIndex: mockSetFocusCardIndex,
  focusCardRatings: [],
  setFocusCardRatings: mockSetFocusCardRatings,
  focusStepsDone: { listen: false, sing: false, imagine: false, play: false },
  setFocusStepsDone: mockSetFocusStepsDone,
  focusActiveStep: 0,
  setFocusActiveStep: mockSetFocusActiveStep,
  focusListenStartedRef: mockFocusListenStartedRef,
  nextStage: mockNextStage,
  navigation: { goBack: mockGoBack },
};

jest.mock("../src/screens/FirstNote/context/FirstNoteContext", () => ({
  useFirstNote: () => mockContextValue,
}));

// Mock AudioInput
jest.mock("../src/components/AudioInput", () => {
  const { View, Text } = require("react-native");
  return function MockAudioInput({
    enabled,
    targetNote,
    compact,
  }: {
    enabled: boolean;
    targetNote?: string;
    compact?: boolean;
  }) {
    return (
      <View testID="audio-input">
        <Text>
          AudioInput target={targetNote} compact={compact ? "true" : "false"}
        </Text>
      </View>
    );
  };
});

// Mock EDMVisualizer
jest.mock("../src/components/EDMVisualizer", () => ({
  EDMVisualizerMedium: function MockEDMVisualizerMedium({
    volume,
    pitchAccuracy,
  }: {
    volume: number;
    pitchAccuracy: string;
  }) {
    const { View, Text } = require("react-native");
    return (
      <View testID="edm-visualizer-medium">
        <Text>EDMVisualizerMedium</Text>
      </View>
    );
  },
}));

// Mock VolumeBar
jest.mock("../src/components/VolumeBar", () => ({
  CircularVolumeIndicator: function MockCircularVolumeIndicator({
    volume,
    size,
  }: {
    volume: number;
    size: number;
  }) {
    const { View, Text } = require("react-native");
    return (
      <View testID="circular-volume-indicator">
        <Text>CircularVolumeIndicator size={size}</Text>
      </View>
    );
  },
}));

// Mock data
jest.mock("../src/screens/FirstNote/data", () => ({
  DAY0_FOCUS_CARDS: [
    {
      name: "Resonant Ring",
      description: "Focus on overtones",
      cue: "Listen for the ring",
    },
    {
      name: "Projection Intent",
      description: "Direct sound outward",
      cue: "Aim beyond the room",
    },
    { name: "Core Sound", description: "Centered tone", cue: "Find the core" },
  ],
  RATING_FACES: [
    { value: 1, emoji: "😫", label: "Struggling" },
    { value: 2, emoji: "😕", label: "Uncertain" },
    { value: 3, emoji: "😐", label: "Okay" },
    { value: 4, emoji: "😊", label: "Good" },
    { value: 5, emoji: "🤩", label: "Great!" },
  ],
}));

// Mock styles
jest.mock("../src/screens/FirstNote/styles", () => ({
  styles: {
    stageContainer: {},
    stageTitle: {},
    subtitle: {},
    focusPracticePanel: {},
    focusBanner: {},
    focusBannerLabel: {},
    focusBannerTitle: {},
    focusBannerCue: {},
    focusNoteRow: {},
    focusNoteLabel: {},
    focusMiniNote: {},
    focusTabBar: {},
    focusTab: {},
    focusTabActive: {},
    focusTabDone: {},
    focusTabEmoji: {},
    focusTabLabel: {},
    focusTabLabelActive: {},
    stepContentArea: {},
    stepContentAreaCompact: {},
    stepInstruction: {},
    focusActionButton: {},
    focusActionButtonText: {},
    successTextSmall: {},
    focusReminderBold: {},
    focusCard: {},
    focusCardTitle: {},
    focusCardDescription: {},
    focusCardCue: {},
    instruction: {},
    ratingContainer: {},
    ratingButton: {},
    ratingEmoji: {},
    ratingLabel: {},
    successText: {},
    ratingSummary: {},
    ratingSummaryRow: {},
    ratingSummaryCard: {},
    ratingSummaryEmoji: {},
    successMessage: {},
    fixedBottomButtons: {},
    primaryButton: {},
    primaryButtonText: {},
    secondaryButton: {},
    secondaryButtonText: {},
    buttonRow: {},
    buttonDisabled: {},
  },
}));

import {
  Stage2Content,
  Stage2Buttons,
} from "../src/screens/FirstNote/stages/Stage2";

describe("Stage2", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFocusListenStartedRef.current = false;
    mockContextValue = {
      noteInfo: { letter: "B", accidental: "♭" },
      instrument: "Trumpet",
      resonantNote: "Bb3",
      volume: 0.5,
      setVolume: mockSetVolume,
      pitchAccuracy: null,
      setPitchAccuracy: mockSetPitchAccuracy,
      handlePitchMatch: mockHandlePitchMatch,
      isPlaying: false,
      playNote: mockPlayNote,
      stopAudio: mockStopAudio,
      focusCardIndex: 0,
      setFocusCardIndex: mockSetFocusCardIndex,
      focusCardRatings: [],
      setFocusCardRatings: mockSetFocusCardRatings,
      focusStepsDone: {
        listen: false,
        sing: false,
        imagine: false,
        play: false,
      },
      setFocusStepsDone: mockSetFocusStepsDone,
      focusActiveStep: 0,
      setFocusActiveStep: mockSetFocusActiveStep,
      focusListenStartedRef: mockFocusListenStartedRef,
      nextStage: mockNextStage,
      navigation: { goBack: mockGoBack },
    };
  });

  // ==========================================================================
  // STAGE 2 CONTENT TESTS
  // ==========================================================================
  describe("Stage2Content", () => {
    describe("Common Elements", () => {
      it("renders stage title", () => {
        const { getByText } = render(<Stage2Content />);
        expect(getByText("Refine Your Sound")).toBeTruthy();
      });

      it("displays focus card counter", () => {
        const { getByText } = render(<Stage2Content />);
        expect(getByText("Focus Card 1 of 3")).toBeTruthy();
      });
    });

    describe("Focus Banner", () => {
      it("displays focus label", () => {
        const { getByText } = render(<Stage2Content />);
        expect(getByText("🎯 FOCUS")).toBeTruthy();
      });

      it("displays current focus card name", () => {
        const { getByText } = render(<Stage2Content />);
        expect(getByText("Resonant Ring")).toBeTruthy();
      });

      it("displays focus cue", () => {
        const { getByText } = render(<Stage2Content />);
        expect(getByText('"Listen for the ring"')).toBeTruthy();
      });

      it("displays note", () => {
        const { getByText } = render(<Stage2Content />);
        expect(getByText("B♭")).toBeTruthy();
      });
    });

    describe("Tab Bar", () => {
      it("renders all step tabs", () => {
        const { getByLabelText } = render(<Stage2Content />);
        expect(getByLabelText("Listen step")).toBeTruthy();
        expect(getByLabelText("Sing step")).toBeTruthy();
        expect(getByLabelText("Imagine step")).toBeTruthy();
        expect(getByLabelText("Play step")).toBeTruthy();
      });

      it("marks completed steps", () => {
        mockContextValue.focusStepsDone = {
          listen: true,
          sing: false,
          imagine: false,
          play: false,
        };
        const { getByLabelText } = render(<Stage2Content />);
        expect(getByLabelText("Listen step, completed")).toBeTruthy();
      });

      it("calls setFocusActiveStep when tab pressed", () => {
        const { getByLabelText } = render(<Stage2Content />);
        fireEvent.press(getByLabelText("Sing step"));
        expect(mockStopAudio).toHaveBeenCalled();
        expect(mockSetPitchAccuracy).toHaveBeenCalledWith(null);
        expect(mockSetFocusActiveStep).toHaveBeenCalledWith(1);
      });
    });

    describe("Step 0 - Listen", () => {
      beforeEach(() => {
        mockContextValue.focusActiveStep = 0;
      });

      it("shows listen instruction", () => {
        const { getByText } = render(<Stage2Content />);
        expect(
          getByText(/Listen to your note with the focus in mind/),
        ).toBeTruthy();
      });

      it("shows play note button", () => {
        const { getByText, getByLabelText } = render(<Stage2Content />);
        expect(getByText("▶️ Play Note")).toBeTruthy();
        expect(getByLabelText("Play note")).toBeTruthy();
      });

      it("calls playNote when button pressed", () => {
        const { getByText } = render(<Stage2Content />);
        fireEvent.press(getByText("▶️ Play Note"));
        expect(mockFocusListenStartedRef.current).toBe(true);
        expect(mockPlayNote).toHaveBeenCalled();
      });

      it("shows playing state", () => {
        mockContextValue.isPlaying = true;
        const { getByText, getByLabelText } = render(<Stage2Content />);
        expect(getByText("🔊 Playing...")).toBeTruthy();
        expect(getByLabelText("Playing note")).toBeTruthy();
      });
    });

    describe("Step 1 - Sing", () => {
      beforeEach(() => {
        mockContextValue.focusActiveStep = 1;
      });

      it("shows sing instruction", () => {
        const { getByText } = render(<Stage2Content />);
        expect(getByText(/Sing the note with an "Oh" sound/)).toBeTruthy();
      });

      it("shows EDMVisualizerMedium", () => {
        const { getByTestId } = render(<Stage2Content />);
        expect(getByTestId("edm-visualizer-medium")).toBeTruthy();
      });

      it("shows AudioInput", () => {
        const { getByTestId } = render(<Stage2Content />);
        expect(getByTestId("audio-input")).toBeTruthy();
      });

      it("shows success text when correct pitch", () => {
        mockContextValue.pitchAccuracy = "correct";
        const { getByText } = render(<Stage2Content />);
        expect(getByText("✓ Correct!")).toBeTruthy();
      });
    });

    describe("Step 2 - Imagine", () => {
      beforeEach(() => {
        mockContextValue.focusActiveStep = 2;
      });

      it("shows imagine instruction", () => {
        const { getByText } = render(<Stage2Content />);
        expect(getByText(/Hear the note clearly in your mind/)).toBeTruthy();
      });

      it("shows focus reminder", () => {
        const { getByText } = render(<Stage2Content />);
        expect(getByText("Remember the focus above!")).toBeTruthy();
      });

      it("shows CircularVolumeIndicator", () => {
        const { getByTestId } = render(<Stage2Content />);
        expect(getByTestId("circular-volume-indicator")).toBeTruthy();
      });
    });

    describe("Step 3 - Play", () => {
      beforeEach(() => {
        mockContextValue.focusActiveStep = 3;
      });

      it("shows play instruction with instrument", () => {
        const { getByText } = render(<Stage2Content />);
        expect(getByText(/Play your note on your Trumpet/)).toBeTruthy();
      });

      it("shows EDMVisualizerMedium", () => {
        const { getByTestId } = render(<Stage2Content />);
        expect(getByTestId("edm-visualizer-medium")).toBeTruthy();
      });

      it("shows AudioInput", () => {
        const { getByTestId } = render(<Stage2Content />);
        expect(getByTestId("audio-input")).toBeTruthy();
      });
    });

    describe("Rating Screen", () => {
      beforeEach(() => {
        mockContextValue.focusStepsDone = {
          listen: true,
          sing: true,
          imagine: true,
          play: true,
        };
      });

      it("shows rating question", () => {
        const { getByText } = render(<Stage2Content />);
        expect(
          getByText(/How did that feel with the "Resonant Ring" focus/),
        ).toBeTruthy();
      });

      it("shows focus card details", () => {
        const { getByText } = render(<Stage2Content />);
        expect(getByText("Focus: Resonant Ring")).toBeTruthy();
        expect(getByText('"Listen for the ring"')).toBeTruthy();
      });

      it("shows all rating faces", () => {
        const { getByLabelText } = render(<Stage2Content />);
        expect(getByLabelText("Rate Struggling")).toBeTruthy();
        expect(getByLabelText("Rate Good")).toBeTruthy();
        expect(getByLabelText("Rate Great!")).toBeTruthy();
      });

      it("saves rating and advances to next card", () => {
        const { getByLabelText } = render(<Stage2Content />);
        fireEvent.press(getByLabelText("Rate Good"));
        expect(mockSetFocusCardRatings).toHaveBeenCalledWith([4]);
        expect(mockSetFocusCardIndex).toHaveBeenCalled();
      });
    });

    describe("All Cards Complete", () => {
      beforeEach(() => {
        mockContextValue.focusCardRatings = [4, 4, 4];
      });

      it("shows completion message", () => {
        const { getByText } = render(<Stage2Content />);
        expect(getByText("🎉 Focus Practice Complete!")).toBeTruthy();
      });

      it("shows rating summary", () => {
        const { getByText } = render(<Stage2Content />);
        expect(getByText("Your ratings:")).toBeTruthy();
        expect(getByText("Resonant Ring:")).toBeTruthy();
      });

      it("shows success message when all ratings good", () => {
        const { getByText } = render(<Stage2Content />);
        expect(
          getByText(/Excellent! You felt good about all three/),
        ).toBeTruthy();
      });

      it("shows improvement message when some ratings low", () => {
        mockContextValue.focusCardRatings = [2, 4, 3];
        const { getByText } = render(<Stage2Content />);
        expect(getByText(/Let's keep working on it!/)).toBeTruthy();
      });
    });
  });

  // ==========================================================================
  // STAGE 2 BUTTONS TESTS
  // ==========================================================================
  describe("Stage2Buttons", () => {
    describe("Practice Steps Navigation", () => {
      it("shows Back and Next buttons", () => {
        const { getByText, getByLabelText } = render(<Stage2Buttons />);
        expect(getByText("← Back")).toBeTruthy();
        expect(getByText("Next →")).toBeTruthy();
        expect(getByLabelText("Go back")).toBeTruthy();
        expect(getByLabelText("Next step")).toBeTruthy();
      });

      it("disables Back on first step", () => {
        mockContextValue.focusActiveStep = 0;
        const { getByLabelText } = render(<Stage2Buttons />);
        const backBtn = getByLabelText("Go back");
        expect(backBtn.props.accessibilityState?.disabled).toBe(true);
      });

      it("advances step when Next pressed", () => {
        const { getByText } = render(<Stage2Buttons />);
        fireEvent.press(getByText("Next →"));
        expect(mockStopAudio).toHaveBeenCalled();
        expect(mockSetFocusStepsDone).toHaveBeenCalled();
        expect(mockSetFocusActiveStep).toHaveBeenCalledWith(1);
      });

      it("goes back when Back pressed", () => {
        mockContextValue.focusActiveStep = 2;
        const { getByText } = render(<Stage2Buttons />);
        fireEvent.press(getByText("← Back"));
        expect(mockStopAudio).toHaveBeenCalled();
        expect(mockSetFocusActiveStep).toHaveBeenCalledWith(1);
      });

      it("shows Rate button on last step", () => {
        mockContextValue.focusActiveStep = 3;
        const { getByText, getByLabelText } = render(<Stage2Buttons />);
        expect(getByText("Rate →")).toBeTruthy();
        expect(getByLabelText("Rate this focus card")).toBeTruthy();
      });

      it("marks play done and triggers rating screen", () => {
        mockContextValue.focusActiveStep = 3;
        const { getByText } = render(<Stage2Buttons />);
        fireEvent.press(getByText("Rate →"));
        expect(mockStopAudio).toHaveBeenCalled();
        expect(mockSetFocusStepsDone).toHaveBeenCalled();
      });
    });

    describe("Rating Screen", () => {
      beforeEach(() => {
        mockContextValue.focusStepsDone = {
          listen: true,
          sing: true,
          imagine: true,
          play: true,
        };
      });

      it("returns null during rating selection", () => {
        const { toJSON } = render(<Stage2Buttons />);
        expect(toJSON()).toBeNull();
      });
    });

    describe("All Cards Complete - Good Ratings", () => {
      beforeEach(() => {
        mockContextValue.focusCardRatings = [4, 5, 4];
      });

      it("shows Practice Again button", () => {
        const { getByText, getByLabelText } = render(<Stage2Buttons />);
        expect(getByText("Practice Cards Again")).toBeTruthy();
        expect(getByLabelText("Practice focus cards again")).toBeTruthy();
      });

      it("shows Continue button", () => {
        const { getByText, getByLabelText } = render(<Stage2Buttons />);
        expect(getByText("Continue →")).toBeTruthy();
        expect(getByLabelText("Continue to next stage")).toBeTruthy();
      });

      it("resets and restarts when Practice Again pressed", () => {
        const { getByText } = render(<Stage2Buttons />);
        fireEvent.press(getByText("Practice Cards Again"));
        expect(mockSetFocusCardRatings).toHaveBeenCalledWith([]);
        expect(mockSetFocusCardIndex).toHaveBeenCalledWith(0);
        expect(mockSetFocusStepsDone).toHaveBeenCalled();
      });

      it("calls nextStage when Continue pressed", () => {
        const { getByText } = render(<Stage2Buttons />);
        fireEvent.press(getByText("Continue →"));
        expect(mockNextStage).toHaveBeenCalled();
      });
    });

    describe("All Cards Complete - Low Ratings", () => {
      beforeEach(() => {
        mockContextValue.focusCardRatings = [2, 3, 3];
      });

      it("shows Pick Different Note button", () => {
        const { getByText, getByLabelText } = render(<Stage2Buttons />);
        expect(getByText("Pick a Different Note")).toBeTruthy();
        expect(getByLabelText("Pick a different note")).toBeTruthy();
      });

      it("shows Practice Cards Again button", () => {
        const { getByText } = render(<Stage2Buttons />);
        expect(getByText("Practice Cards Again")).toBeTruthy();
      });

      it("does not show Continue button", () => {
        const { queryByLabelText } = render(<Stage2Buttons />);
        expect(queryByLabelText("Continue to next stage")).toBeNull();
      });

      it("clears ratings and goes back when Pick Different Note pressed", () => {
        const { getByText } = render(<Stage2Buttons />);
        fireEvent.press(getByText("Pick a Different Note"));
        expect(mockSetFocusCardRatings).toHaveBeenCalledWith([]);
        expect(mockGoBack).toHaveBeenCalled();
      });
    });
  });
});
