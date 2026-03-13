/**
 * @fileoverview Tests for Stage0 component
 * FirstNote Stage 0: Listen and Sing - User hears note, sings it, imagines it
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

// Mock FirstNoteContext
const mockSetSubStep = jest.fn();
const mockSetVolume = jest.fn();
const mockPlayNote = jest.fn();
const mockStopAudio = jest.fn();
const mockNextStage = jest.fn();

let mockContextValue: any = {
  noteInfo: { letter: "B", accidental: "♭" },
  subStep: 0,
  volume: 0.5,
  setVolume: mockSetVolume,
  setSubStep: mockSetSubStep,
  isPlaying: false,
  playNote: mockPlayNote,
  stopAudio: mockStopAudio,
  showHeardItButton: false,
  nextStage: mockNextStage,
};

jest.mock("../src/screens/FirstNote/context/FirstNoteContext", () => ({
  useFirstNote: () => mockContextValue,
}));

// Mock AudioInput
jest.mock("../src/components/AudioInput", () => {
  const { View, Text } = require("react-native");
  return function MockAudioInput({
    enabled,
    onVolumeChange,
  }: {
    enabled: boolean;
    onVolumeChange?: (vol: number) => void;
  }) {
    return (
      <View testID="audio-input">
        <Text>AudioInput {enabled ? "enabled" : "disabled"}</Text>
      </View>
    );
  };
});

// Mock EDMVisualizer
jest.mock("../src/components/EDMVisualizer", () => {
  const { View, Text } = require("react-native");
  return function MockEDMVisualizer({
    volume,
    pitchAccuracy,
  }: {
    volume: number;
    pitchAccuracy: string;
  }) {
    return (
      <View testID="edm-visualizer">
        <Text>EDMVisualizer volume={volume}</Text>
      </View>
    );
  };
});

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

// Mock styles
jest.mock("../src/screens/FirstNote/styles", () => ({
  styles: {
    stageContainer: {},
    stageTitle: {},
    noteDisplay: {},
    instruction: {},
    hint: {},
    fixedBottomButtons: {},
    primaryButton: {},
    primaryButtonText: {},
    secondaryButton: {},
    secondaryButtonText: {},
    buttonDisabled: {},
    buttonRow: {},
  },
}));

import {
  Stage0Content,
  Stage0Buttons,
} from "../src/screens/FirstNote/stages/Stage0";

describe("Stage0", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContextValue = {
      noteInfo: { letter: "B", accidental: "♭" },
      subStep: 0,
      volume: 0.5,
      setVolume: mockSetVolume,
      setSubStep: mockSetSubStep,
      isPlaying: false,
      playNote: mockPlayNote,
      stopAudio: mockStopAudio,
      showHeardItButton: false,
      nextStage: mockNextStage,
    };
  });

  // ==========================================================================
  // STAGE 0 CONTENT TESTS
  // ==========================================================================
  describe("Stage0Content", () => {
    describe("Common Elements", () => {
      it("renders stage title", () => {
        const { getByText } = render(<Stage0Content />);
        expect(getByText("Let's Start With Your Note")).toBeTruthy();
      });

      it("displays note with accidental", () => {
        const { getByText } = render(<Stage0Content />);
        expect(getByText("B♭")).toBeTruthy();
      });

      it("displays note without accidental", () => {
        mockContextValue.noteInfo = { letter: "C", accidental: "" };
        const { getByText } = render(<Stage0Content />);
        expect(getByText("C")).toBeTruthy();
      });
    });

    describe("SubStep 0 - Listen", () => {
      beforeEach(() => {
        mockContextValue.subStep = 0;
      });

      it("shows listen instruction", () => {
        const { getByText } = render(<Stage0Content />);
        expect(getByText(/Tap Play to hear your note/)).toBeTruthy();
      });

      it("does not show AudioInput", () => {
        const { queryByTestId } = render(<Stage0Content />);
        expect(queryByTestId("audio-input")).toBeNull();
      });

      it("does not show EDMVisualizer", () => {
        const { queryByTestId } = render(<Stage0Content />);
        expect(queryByTestId("edm-visualizer")).toBeNull();
      });
    });

    describe("SubStep 1 - Sing", () => {
      beforeEach(() => {
        mockContextValue.subStep = 1;
      });

      it("shows sing instruction", () => {
        const { getByText } = render(<Stage0Content />);
        expect(
          getByText(/Now sing that note using an "Oh" sound/),
        ).toBeTruthy();
      });

      it("shows hint for singing", () => {
        const { getByText } = render(<Stage0Content />);
        expect(getByText(/Sing "Ohhhhh" and hold/)).toBeTruthy();
      });

      it("shows AudioInput enabled", () => {
        const { getByTestId, getByText } = render(<Stage0Content />);
        expect(getByTestId("audio-input")).toBeTruthy();
        expect(getByText("AudioInput enabled")).toBeTruthy();
      });

      it("shows EDMVisualizer", () => {
        const { getByTestId } = render(<Stage0Content />);
        expect(getByTestId("edm-visualizer")).toBeTruthy();
      });
    });

    describe("SubStep 2 - Imagine", () => {
      beforeEach(() => {
        mockContextValue.subStep = 2;
      });

      it("shows imagine instruction", () => {
        const { getByText } = render(<Stage0Content />);
        expect(getByText(/Now imagine that note clearly/)).toBeTruthy();
      });

      it("shows hint for imagining", () => {
        const { getByText } = render(<Stage0Content />);
        expect(getByText(/Take a few seconds to really hear it/)).toBeTruthy();
      });

      it("shows CircularVolumeIndicator", () => {
        const { getByTestId } = render(<Stage0Content />);
        expect(getByTestId("circular-volume-indicator")).toBeTruthy();
      });

      it("does not show AudioInput", () => {
        const { queryByTestId } = render(<Stage0Content />);
        expect(queryByTestId("audio-input")).toBeNull();
      });
    });
  });

  // ==========================================================================
  // STAGE 0 BUTTONS TESTS
  // ==========================================================================
  describe("Stage0Buttons", () => {
    describe("SubStep 0 - Listen", () => {
      beforeEach(() => {
        mockContextValue.subStep = 0;
      });

      it("renders Play button", () => {
        const { getByText, getByLabelText } = render(<Stage0Buttons />);
        expect(getByText("▶️ Play")).toBeTruthy();
        expect(getByLabelText("Play note")).toBeTruthy();
      });

      it("calls playNote when Play pressed", () => {
        const { getByText } = render(<Stage0Buttons />);
        fireEvent.press(getByText("▶️ Play"));
        expect(mockPlayNote).toHaveBeenCalledTimes(1);
      });

      it('shows "Playing..." when isPlaying is true', () => {
        mockContextValue.isPlaying = true;
        const { getByText, getByLabelText } = render(<Stage0Buttons />);
        expect(getByText("🔊 Playing...")).toBeTruthy();
        expect(getByLabelText("Playing note")).toBeTruthy();
      });

      it("disables Play button when playing", () => {
        mockContextValue.isPlaying = true;
        const { getByLabelText } = render(<Stage0Buttons />);
        const button = getByLabelText("Playing note");
        expect(button.props.accessibilityState?.disabled).toBe(true);
      });

      it('does not show "I Heard It" button by default', () => {
        const { queryByText } = render(<Stage0Buttons />);
        expect(queryByText("I Heard It →")).toBeNull();
      });

      it('shows "I Heard It" button when showHeardItButton is true', () => {
        mockContextValue.showHeardItButton = true;
        const { getByText, getByLabelText } = render(<Stage0Buttons />);
        expect(getByText("I Heard It →")).toBeTruthy();
        expect(getByLabelText("I heard the note, continue")).toBeTruthy();
      });

      it('stops audio and advances to subStep 1 when "I Heard It" pressed', () => {
        mockContextValue.showHeardItButton = true;
        const { getByText } = render(<Stage0Buttons />);
        fireEvent.press(getByText("I Heard It →"));
        expect(mockStopAudio).toHaveBeenCalledTimes(1);
        expect(mockSetSubStep).toHaveBeenCalledWith(1);
      });
    });

    describe("SubStep 1 - Sing", () => {
      beforeEach(() => {
        mockContextValue.subStep = 1;
      });

      it('renders "Done Singing" button', () => {
        const { getByText, getByLabelText } = render(<Stage0Buttons />);
        expect(getByText("Done Singing →")).toBeTruthy();
        expect(getByLabelText("Done singing, continue")).toBeTruthy();
      });

      it('advances to subStep 2 when "Done Singing" pressed', () => {
        const { getByText } = render(<Stage0Buttons />);
        fireEvent.press(getByText("Done Singing →"));
        expect(mockSetSubStep).toHaveBeenCalledWith(2);
      });
    });

    describe("SubStep 2 - Imagine", () => {
      beforeEach(() => {
        mockContextValue.subStep = 2;
      });

      it('renders "Listen Again" button', () => {
        const { getByText, getByLabelText } = render(<Stage0Buttons />);
        expect(getByText("Listen Again")).toBeTruthy();
        expect(getByLabelText("Listen to note again")).toBeTruthy();
      });

      it('calls playNote when "Listen Again" pressed', () => {
        const { getByText } = render(<Stage0Buttons />);
        fireEvent.press(getByText("Listen Again"));
        expect(mockPlayNote).toHaveBeenCalledTimes(1);
      });

      it('shows "Playing..." when isPlaying is true', () => {
        mockContextValue.isPlaying = true;
        const { getAllByText } = render(<Stage0Buttons />);
        const playingTexts = getAllByText("Playing...");
        expect(playingTexts.length).toBeGreaterThan(0);
      });

      it('renders "Sing Again" button', () => {
        const { getByText, getByLabelText } = render(<Stage0Buttons />);
        expect(getByText("Sing Again")).toBeTruthy();
        expect(getByLabelText("Sing the note again")).toBeTruthy();
      });

      it('returns to subStep 1 when "Sing Again" pressed', () => {
        const { getByText } = render(<Stage0Buttons />);
        fireEvent.press(getByText("Sing Again"));
        expect(mockSetSubStep).toHaveBeenCalledWith(1);
      });

      it('renders "Play" button to advance to next stage', () => {
        const { getByText, getByLabelText } = render(<Stage0Buttons />);
        expect(getByText("Play →")).toBeTruthy();
        expect(getByLabelText("Continue to play the note")).toBeTruthy();
      });

      it('calls nextStage when "Play" pressed', () => {
        const { getByText } = render(<Stage0Buttons />);
        fireEvent.press(getByText("Play →"));
        expect(mockNextStage).toHaveBeenCalledTimes(1);
      });
    });

    describe("Invalid SubStep", () => {
      it("returns null for invalid subStep", () => {
        mockContextValue.subStep = 99;
        const { toJSON } = render(<Stage0Buttons />);
        expect(toJSON()).toBeNull();
      });
    });
  });
});
