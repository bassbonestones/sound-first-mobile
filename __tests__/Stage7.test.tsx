/**
 * @fileoverview Tests for Stage7 component
 * FirstNote Stage 7: Your Note on the Staff (final stage)
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

// Mock FirstNoteContext
const mockSetShowSummary = jest.fn();
const mockScrollToEnd = jest.fn();
const mockPlayNote = jest.fn();
const mockGoBackTeaching = jest.fn();
const mockCompleteDay0 = jest.fn();

let mockContextValue: any = {
  noteInfo: { letter: "B", accidental: "♭" },
  clefType: "treble",
  stage6MusicXML: "<musicxml>test</musicxml>",
  showSummary: false,
  setShowSummary: mockSetShowSummary,
  scrollToEnd: mockScrollToEnd,
  isPlaying: false,
  playNote: mockPlayNote,
  goBackTeaching: mockGoBackTeaching,
  completeDay0: mockCompleteDay0,
};

jest.mock("../src/screens/FirstNote/context/FirstNoteContext", () => ({
  useFirstNote: () => mockContextValue,
}));

// Mock NotationDisplay
jest.mock("../src/components/NotationDisplay", () => {
  const { View, Text } = require("react-native");
  return function MockNotationDisplay({
    musicxml,
    width,
    height,
  }: {
    musicxml: string;
    width: number;
    height: number;
  }) {
    return (
      <View testID="notation-display">
        <Text>
          NotationDisplay w={width} h={height}
        </Text>
      </View>
    );
  };
});

// Mock styles
jest.mock("../src/screens/FirstNote/styles", () => ({
  __esModule: true,
  default: {
    stageContainer: {},
    stageTitle: {},
    notationContainer: {},
    instruction: {},
    bold: {},
    italic: {},
    summaryToggleButton: {},
    summaryToggleText: {},
    summaryContainer: {},
    summaryCloseButton: {},
    summaryCloseText: {},
    summaryTitle: {},
    summaryItem: {},
    hint: {},
    fixedBottomButtons: {},
    backTextButton: {},
    backTextButtonText: {},
    secondaryButton: {},
    secondaryButtonText: {},
    buttonDisabled: {},
    completionButtons: {},
    primaryButton: {},
    primaryButtonText: {},
    homeButton: {},
    homeButtonText: {},
  },
}));

import {
  Stage7Content,
  Stage7Buttons,
} from "../src/screens/FirstNote/stages/Stage7";

describe("Stage7", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContextValue = {
      noteInfo: { letter: "B", accidental: "♭" },
      clefType: "treble",
      stage6MusicXML: "<musicxml>test</musicxml>",
      showSummary: false,
      setShowSummary: mockSetShowSummary,
      scrollToEnd: mockScrollToEnd,
      isPlaying: false,
      playNote: mockPlayNote,
      goBackTeaching: mockGoBackTeaching,
      completeDay0: mockCompleteDay0,
    };
  });

  // ==========================================================================
  // STAGE 7 CONTENT TESTS
  // ==========================================================================
  describe("Stage7Content", () => {
    it("renders stage title", () => {
      const { getByText } = render(<Stage7Content />);
      expect(getByText("Your Note on the Staff")).toBeTruthy();
    });

    it("shows NotationDisplay", () => {
      const { getByTestId } = render(<Stage7Content />);
      expect(getByTestId("notation-display")).toBeTruthy();
    });

    it("shows note name and clef", () => {
      const { getByText } = render(<Stage7Content />);
      expect(getByText(/B♭/)).toBeTruthy();
      expect(getByText(/on the treble clef staff/)).toBeTruthy();
    });

    it("shows What I Learned button when summary not shown", () => {
      const { getByText, getByLabelText } = render(<Stage7Content />);
      expect(getByText("📋 What I Learned Today")).toBeTruthy();
      expect(getByLabelText("View what I learned today")).toBeTruthy();
    });

    it("shows summary when showSummary is true", () => {
      mockContextValue.showSummary = true;
      const { getByText } = render(<Stage7Content />);
      expect(getByText("What I Learned")).toBeTruthy();
      expect(getByText(/The staff has 5 lines and 4 spaces/)).toBeTruthy();
      expect(getByText(/Ledger lines extend the staff/)).toBeTruthy();
      expect(getByText(/Notes sit on lines or in spaces/)).toBeTruthy();
      expect(getByText(/Higher on staff = higher pitch/)).toBeTruthy();
    });

    it("shows treble clef summary for treble", () => {
      mockContextValue.showSummary = true;
      mockContextValue.clefType = "treble";
      const { getByText } = render(<Stage7Content />);
      expect(getByText(/Treble clef shows us where G is/)).toBeTruthy();
    });

    it("shows bass clef summary for bass", () => {
      mockContextValue.showSummary = true;
      mockContextValue.clefType = "bass";
      const { getByText } = render(<Stage7Content />);
      expect(getByText(/Bass clef shows us where F is/)).toBeTruthy();
    });

    it("shows user note in summary", () => {
      mockContextValue.showSummary = true;
      const { getByText } = render(<Stage7Content />);
      expect(getByText(/My note: B♭/)).toBeTruthy();
    });

    it("shows close button in summary", () => {
      mockContextValue.showSummary = true;
      const { getByLabelText } = render(<Stage7Content />);
      expect(getByLabelText("Close summary")).toBeTruthy();
    });

    it("closes summary when close pressed", () => {
      mockContextValue.showSummary = true;
      const { getByLabelText } = render(<Stage7Content />);
      fireEvent.press(getByLabelText("Close summary"));
      expect(mockSetShowSummary).toHaveBeenCalledWith(false);
    });

    it("opens summary and scrolls when button pressed", () => {
      const { getByLabelText } = render(<Stage7Content />);
      fireEvent.press(getByLabelText("View what I learned today"));
      expect(mockSetShowSummary).toHaveBeenCalledWith(true);
      expect(mockScrollToEnd).toHaveBeenCalled();
    });

    it("shows hint when summary not shown", () => {
      const { getByText } = render(<Stage7Content />);
      expect(getByText(/Remember:/)).toBeTruthy();
      expect(getByText(/Sound before symbol/)).toBeTruthy();
    });

    it("hides hint when summary shown", () => {
      mockContextValue.showSummary = true;
      const { queryByText } = render(<Stage7Content />);
      expect(queryByText(/Sound before symbol/)).toBeNull();
    });
  });

  // ==========================================================================
  // STAGE 7 BUTTONS TESTS
  // ==========================================================================
  describe("Stage7Buttons", () => {
    it("renders Back button", () => {
      const { getByText, getByLabelText } = render(<Stage7Buttons />);
      expect(getByText("← Back")).toBeTruthy();
      expect(getByLabelText("Go back")).toBeTruthy();
    });

    it("calls goBackTeaching when Back pressed", () => {
      const { getByText } = render(<Stage7Buttons />);
      fireEvent.press(getByText("← Back"));
      expect(mockGoBackTeaching).toHaveBeenCalledWith(6, 4);
    });

    it("renders Play Your Note button", () => {
      const { getByText, getByLabelText } = render(<Stage7Buttons />);
      expect(getByText("▶️ Play Your Note")).toBeTruthy();
      expect(getByLabelText("Play your note")).toBeTruthy();
    });

    it("calls playNote when play pressed", () => {
      const { getByText } = render(<Stage7Buttons />);
      fireEvent.press(getByText("▶️ Play Your Note"));
      expect(mockPlayNote).toHaveBeenCalled();
    });

    it("shows Playing state when isPlaying", () => {
      mockContextValue.isPlaying = true;
      const { getByText, getByLabelText } = render(<Stage7Buttons />);
      expect(getByText("🔊 Playing...")).toBeTruthy();
      expect(getByLabelText("Playing note")).toBeTruthy();
    });

    it("disables play button when playing", () => {
      mockContextValue.isPlaying = true;
      const { getByLabelText } = render(<Stage7Buttons />);
      const button = getByLabelText("Playing note");
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });

    it("renders Start Practicing button", () => {
      const { getByText, getByLabelText } = render(<Stage7Buttons />);
      expect(getByText("🎯 Start Practicing")).toBeTruthy();
      expect(getByLabelText("Start practicing")).toBeTruthy();
    });

    it("calls completeDay0 with StartPractice when Start Practicing pressed", () => {
      const { getByText } = render(<Stage7Buttons />);
      fireEvent.press(getByText("🎯 Start Practicing"));
      expect(mockCompleteDay0).toHaveBeenCalledWith("StartPractice");
    });

    it("renders Home button", () => {
      const { getByText, getByLabelText } = render(<Stage7Buttons />);
      expect(getByText("🏠 Home")).toBeTruthy();
      expect(getByLabelText("Go to home")).toBeTruthy();
    });

    it("calls completeDay0 with Home when Home pressed", () => {
      const { getByText } = render(<Stage7Buttons />);
      fireEvent.press(getByText("🏠 Home"));
      expect(mockCompleteDay0).toHaveBeenCalledWith("Home");
    });
  });
});
