/**
 * @fileoverview Tests for Stage1 component
 * FirstNote Stage 1: Imagine and Play - User imagines note then plays with detection
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

// Mock FirstNoteContext
const mockSetSubStep = jest.fn();
const mockSetStage = jest.fn();
const mockSetVolume = jest.fn();
const mockSetRating = jest.fn();
const mockSetPitchAccuracy = jest.fn();
const mockHandlePitchMatch = jest.fn();
const mockHandleSoundEnd = jest.fn();
const mockNextStage = jest.fn();
const mockGoBack = jest.fn();

const mockGotCorrectPitchRef = { current: false };

let mockContextValue: any = {
  noteInfo: { letter: "B", accidental: "♭" },
  instrument: "Trumpet",
  resonantNote: "Bb3",
  subStep: 0,
  volume: 0.5,
  setVolume: mockSetVolume,
  pitchAccuracy: null,
  setPitchAccuracy: mockSetPitchAccuracy,
  handlePitchMatch: mockHandlePitchMatch,
  rating: null,
  setRating: mockSetRating,
  setSubStep: mockSetSubStep,
  setStage: mockSetStage,
  handleSoundEnd: mockHandleSoundEnd,
  nextStage: mockNextStage,
  gotCorrectPitchRef: mockGotCorrectPitchRef,
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
    onPitchMatch,
  }: {
    enabled: boolean;
    targetNote: string;
    onPitchMatch?: (match: boolean) => void;
  }) {
    return (
      <View testID="audio-input">
        <Text>AudioInput target={targetNote}</Text>
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
        <Text>EDMVisualizer pitchAccuracy={pitchAccuracy}</Text>
      </View>
    );
  };
});

// Mock data
jest.mock("../src/screens/FirstNote/data", () => ({
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
    noteDisplay: {},
    instruction: {},
    feedbackContainer: {},
    successText: {},
    warningText: {},
    ratingContainer: {},
    ratingButton: {},
    ratingEmoji: {},
    ratingLabel: {},
    fixedBottomButtons: {},
    primaryButton: {},
    primaryButtonText: {},
    secondaryButton: {},
    secondaryButtonText: {},
  },
}));

import {
  Stage1Content,
  Stage1Buttons,
} from "../src/screens/FirstNote/stages/Stage1";

describe("Stage1", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGotCorrectPitchRef.current = false;
    mockContextValue = {
      noteInfo: { letter: "B", accidental: "♭" },
      instrument: "Trumpet",
      resonantNote: "Bb3",
      subStep: 0,
      volume: 0.5,
      setVolume: mockSetVolume,
      pitchAccuracy: null,
      setPitchAccuracy: mockSetPitchAccuracy,
      handlePitchMatch: mockHandlePitchMatch,
      rating: null,
      setRating: mockSetRating,
      setSubStep: mockSetSubStep,
      setStage: mockSetStage,
      handleSoundEnd: mockHandleSoundEnd,
      nextStage: mockNextStage,
      gotCorrectPitchRef: mockGotCorrectPitchRef,
      navigation: { goBack: mockGoBack },
    };
  });

  // ==========================================================================
  // STAGE 1 CONTENT TESTS
  // ==========================================================================
  describe("Stage1Content", () => {
    describe("Common Elements", () => {
      it("renders stage title", () => {
        const { getByText } = render(<Stage1Content />);
        expect(getByText("Play Your Note")).toBeTruthy();
      });

      it("displays note with accidental", () => {
        const { getByText } = render(<Stage1Content />);
        expect(getByText("B♭")).toBeTruthy();
      });
    });

    describe("SubStep 0 - Imagine", () => {
      beforeEach(() => {
        mockContextValue.subStep = 0;
      });

      it("shows imagine instruction with instrument", () => {
        const { getByText } = render(<Stage1Content />);
        expect(getByText(/Imagine the note clearly/)).toBeTruthy();
        expect(getByText(/play it on your Trumpet/)).toBeTruthy();
      });

      it("does not show AudioInput", () => {
        const { queryByTestId } = render(<Stage1Content />);
        expect(queryByTestId("audio-input")).toBeNull();
      });
    });

    describe("SubStep 1 - Ready", () => {
      beforeEach(() => {
        mockContextValue.subStep = 1;
      });

      it("shows play instruction with note and instrument", () => {
        const { getByText } = render(<Stage1Content />);
        expect(getByText(/Now play B♭ on your Trumpet/)).toBeTruthy();
      });

      it("does not show AudioInput", () => {
        const { queryByTestId } = render(<Stage1Content />);
        expect(queryByTestId("audio-input")).toBeNull();
      });
    });

    describe("SubStep 2 - Playing", () => {
      beforeEach(() => {
        mockContextValue.subStep = 2;
      });

      it("shows play instruction", () => {
        const { getByText } = render(<Stage1Content />);
        expect(getByText(/Play B♭ on your Trumpet!/)).toBeTruthy();
      });

      it("shows EDMVisualizer", () => {
        const { getByTestId } = render(<Stage1Content />);
        expect(getByTestId("edm-visualizer")).toBeTruthy();
      });

      it("shows AudioInput with target note", () => {
        const { getByTestId, getByText } = render(<Stage1Content />);
        expect(getByTestId("audio-input")).toBeTruthy();
        expect(getByText("AudioInput target=Bb3")).toBeTruthy();
      });

      it("shows correct pitch feedback when accurate", () => {
        mockContextValue.pitchAccuracy = "correct";
        const { getByText } = render(<Stage1Content />);
        expect(getByText("✓ Correct Note!")).toBeTruthy();
      });

      it("shows warning when pitch is off and volume high", () => {
        mockContextValue.pitchAccuracy = "off";
        mockContextValue.volume = 0.1;
        const { getByText } = render(<Stage1Content />);
        expect(getByText("Adjust your pitch a bit")).toBeTruthy();
      });

      it("does not show warning when volume is low", () => {
        mockContextValue.pitchAccuracy = "off";
        mockContextValue.volume = 0.01;
        const { queryByText } = render(<Stage1Content />);
        expect(queryByText("Adjust your pitch a bit")).toBeNull();
      });
    });

    describe("SubStep 3 - Rating (no rating yet)", () => {
      beforeEach(() => {
        mockContextValue.subStep = 3;
        mockContextValue.rating = null;
      });

      it("shows rating question", () => {
        const { getByText } = render(<Stage1Content />);
        expect(getByText("How did that feel?")).toBeTruthy();
      });

      it("renders all rating faces", () => {
        const { getByText, getByLabelText } = render(<Stage1Content />);
        expect(getByText("😫")).toBeTruthy();
        expect(getByText("Struggling")).toBeTruthy();
        expect(getByLabelText("Rate Struggling")).toBeTruthy();

        expect(getByText("😕")).toBeTruthy();
        expect(getByText("Uncertain")).toBeTruthy();

        expect(getByText("😐")).toBeTruthy();
        expect(getByText("Okay")).toBeTruthy();

        expect(getByText("😊")).toBeTruthy();
        expect(getByText("Good")).toBeTruthy();

        expect(getByText("🤩")).toBeTruthy();
        expect(getByText("Great!")).toBeTruthy();
      });

      it("calls setRating when face pressed", () => {
        const { getByLabelText } = render(<Stage1Content />);
        fireEvent.press(getByLabelText("Rate Good"));
        expect(mockSetRating).toHaveBeenCalledWith(4);
      });
    });

    describe("SubStep 3 - Rating (rating given, high)", () => {
      beforeEach(() => {
        mockContextValue.subStep = 3;
        mockContextValue.rating = 5;
      });

      it("shows positive feedback for high rating", () => {
        const { getByText } = render(<Stage1Content />);
        expect(getByText(/Nice! What would you like to do next/)).toBeTruthy();
      });

      it("does not show rating faces", () => {
        const { queryByText } = render(<Stage1Content />);
        expect(queryByText("😫")).toBeNull();
      });
    });

    describe("SubStep 3 - Rating (rating given, low)", () => {
      beforeEach(() => {
        mockContextValue.subStep = 3;
        mockContextValue.rating = 2;
      });

      it("shows encouragement for low rating", () => {
        const { getByText } = render(<Stage1Content />);
        expect(getByText(/Let's work on that!/)).toBeTruthy();
      });
    });
  });

  // ==========================================================================
  // STAGE 1 BUTTONS TESTS
  // ==========================================================================
  describe("Stage1Buttons", () => {
    describe("SubStep 0 - Imagine", () => {
      beforeEach(() => {
        mockContextValue.subStep = 0;
      });

      it("renders imagining button", () => {
        const { getByText, getByLabelText } = render(<Stage1Buttons />);
        expect(getByText("I'm imagining it...")).toBeTruthy();
        expect(getByLabelText("I'm imagining the note")).toBeTruthy();
      });

      it("advances to subStep 1 when pressed", () => {
        const { getByText } = render(<Stage1Buttons />);
        fireEvent.press(getByText("I'm imagining it..."));
        expect(mockSetSubStep).toHaveBeenCalledWith(1);
      });
    });

    describe("SubStep 1 - Ready", () => {
      beforeEach(() => {
        mockContextValue.subStep = 1;
      });

      it("renders ready to play button", () => {
        const { getByText, getByLabelText } = render(<Stage1Buttons />);
        expect(getByText("▶️ I'm ready to play")).toBeTruthy();
        expect(getByLabelText("I'm ready to play")).toBeTruthy();
      });

      it("advances to subStep 2 when pressed", () => {
        const { getByText } = render(<Stage1Buttons />);
        fireEvent.press(getByText("▶️ I'm ready to play"));
        expect(mockSetSubStep).toHaveBeenCalledWith(2);
      });
    });

    describe("SubStep 2 - Playing", () => {
      beforeEach(() => {
        mockContextValue.subStep = 2;
      });

      it("renders done playing button", () => {
        const { getByText, getByLabelText } = render(<Stage1Buttons />);
        expect(getByText("Done Playing →")).toBeTruthy();
        expect(getByLabelText("Done playing")).toBeTruthy();
      });

      it("calls handleSoundEnd when pressed", () => {
        const { getByText } = render(<Stage1Buttons />);
        fireEvent.press(getByText("Done Playing →"));
        expect(mockHandleSoundEnd).toHaveBeenCalledTimes(1);
      });
    });

    describe("SubStep 3 - With Rating", () => {
      beforeEach(() => {
        mockContextValue.subStep = 3;
        mockContextValue.rating = 3;
      });

      it('renders "Pick a Different Note" button', () => {
        const { getByText, getByLabelText } = render(<Stage1Buttons />);
        expect(getByText("Pick a Different Note")).toBeTruthy();
        expect(getByLabelText("Pick a different note")).toBeTruthy();
      });

      it('clears rating and goes back when "Pick Different Note" pressed', () => {
        const { getByText } = render(<Stage1Buttons />);
        fireEvent.press(getByText("Pick a Different Note"));
        expect(mockSetRating).toHaveBeenCalledWith(null);
        expect(mockGoBack).toHaveBeenCalledTimes(1);
      });

      it('renders "Practice Again" button', () => {
        const { getByText, getByLabelText } = render(<Stage1Buttons />);
        expect(getByText("Practice Again")).toBeTruthy();
        expect(getByLabelText("Practice the note again")).toBeTruthy();
      });

      it('resets state when "Practice Again" pressed', () => {
        const { getByText } = render(<Stage1Buttons />);
        fireEvent.press(getByText("Practice Again"));
        expect(mockSetRating).toHaveBeenCalledWith(null);
        expect(mockSetPitchAccuracy).toHaveBeenCalledWith(null);
        expect(mockSetStage).toHaveBeenCalledWith(0);
        expect(mockSetSubStep).toHaveBeenCalledWith(2);
        expect(mockGotCorrectPitchRef.current).toBe(false);
      });

      it("does not show Continue button for low rating", () => {
        mockContextValue.rating = 3;
        const { queryByText } = render(<Stage1Buttons />);
        expect(queryByText("Continue →")).toBeNull();
      });
    });

    describe("SubStep 3 - With High Rating (4+)", () => {
      beforeEach(() => {
        mockContextValue.subStep = 3;
        mockContextValue.rating = 4;
      });

      it("shows Continue button for rating 4", () => {
        const { getByText, getByLabelText } = render(<Stage1Buttons />);
        expect(getByText("Continue →")).toBeTruthy();
        expect(getByLabelText("Continue to next stage")).toBeTruthy();
      });

      it("shows Continue button for rating 5", () => {
        mockContextValue.rating = 5;
        const { getByText } = render(<Stage1Buttons />);
        expect(getByText("Continue →")).toBeTruthy();
      });

      it("clears rating and calls nextStage when Continue pressed", () => {
        const { getByText } = render(<Stage1Buttons />);
        fireEvent.press(getByText("Continue →"));
        expect(mockSetRating).toHaveBeenCalledWith(null);
        expect(mockNextStage).toHaveBeenCalledTimes(1);
      });
    });

    describe("SubStep 3 - No Rating Yet", () => {
      beforeEach(() => {
        mockContextValue.subStep = 3;
        mockContextValue.rating = null;
      });

      it("returns null when no rating", () => {
        const { toJSON } = render(<Stage1Buttons />);
        expect(toJSON()).toBeNull();
      });
    });

    describe("Invalid SubStep", () => {
      it("returns null for invalid subStep", () => {
        mockContextValue.subStep = 99;
        const { toJSON } = render(<Stage1Buttons />);
        expect(toJSON()).toBeNull();
      });
    });
  });
});
