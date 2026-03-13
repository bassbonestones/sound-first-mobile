/**
 * @fileoverview Tests for Stage6 component
 * FirstNote Stage 6: Sharps, Flats & Naturals teaching
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

// Mock FirstNoteContext
const mockSetSubStep = jest.fn();
const mockSetAccidentalExplorer = jest.fn();
const mockSetPitchExplorerIndex = jest.fn();
const mockPlayAccidentalExplorer = jest.fn();
const mockPlayCombinedExplorer = jest.fn();
const mockGoBackTeaching = jest.fn();
const mockNextStage = jest.fn();

let mockContextValue: any = {
  subStep: 0,
  setSubStep: mockSetSubStep,
  accidentalExplorer: "natural",
  setAccidentalExplorer: mockSetAccidentalExplorer,
  pitchExplorerIndex: 6,
  setPitchExplorerIndex: mockSetPitchExplorerIndex,
  noteInfo: { letter: "B", accidental: "♭", hasAccidental: true },
  playAccidentalExplorer: mockPlayAccidentalExplorer,
  playCombinedExplorer: mockPlayCombinedExplorer,
  goBackTeaching: mockGoBackTeaching,
  nextStage: mockNextStage,
};

jest.mock("../src/screens/FirstNote/context/FirstNoteContext", () => ({
  useFirstNote: () => mockContextValue,
}));

// Mock data
jest.mock("../src/screens/FirstNote/data", () => ({
  PITCH_EXPLORER_NOTES: [
    { note: "C3", position: 112, ledgerLines: 2 },
    { note: "D3", position: 102, ledgerLines: 1 },
    { note: "E3", position: 93, ledgerLines: 1 },
    { note: "F3", position: 84, ledgerLines: 0 },
    { note: "G3", position: 75, ledgerLines: 0 },
    { note: "A3", position: 66, ledgerLines: 0 },
    { note: "B3", position: 57, ledgerLines: 0 },
    { note: "C4", position: 48, ledgerLines: 0 },
    { note: "D4", position: 39, ledgerLines: 0 },
    { note: "E4", position: 30, ledgerLines: 0 },
    { note: "F4", position: 21, ledgerLines: -1 },
    { note: "G4", position: 12, ledgerLines: -1 },
    { note: "A4", position: 3, ledgerLines: -2 },
  ],
}));

// Mock styles
jest.mock("../src/screens/FirstNote/styles", () => ({
  __esModule: true,
  default: {
    stageContainer: {},
    stageTitle: {},
    accidentalRow: {},
    accidentalBox: {},
    accidentalSymbol: {},
    accidentalName: {},
    instruction: {},
    bold: {},
    italic: {},
    accidentalExplorerStaff: {},
    staffLine: {},
    flatOnStaff: {},
    sharpOnStaff: {},
    accidentalExplorerNote: {},
    accidentalExplorerControls: {},
    accidentalExplorerButton: {},
    accidentalExplorerButtonActive: {},
    accidentalExplorerButtonText: {},
    combinedExplorerStaff: {},
    ledgerLineExplorer: {},
    pitchExplorerNote: {},
    combinedExplorerControls: {},
    pitchExplorerButton: {},
    pitchExplorerButtonDisabled: {},
    pitchExplorerButtonText: {},
    pitchExplorerPlayButton: {},
    pitchExplorerPlayButtonText: {},
    combinedAccidentalButtons: {},
    fixedBottomButtons: {},
    backTextButton: {},
    backTextButtonText: {},
    primaryButton: {},
    primaryButtonText: {},
  },
}));

import {
  Stage6Content,
  Stage6Buttons,
} from "../src/screens/FirstNote/stages/Stage6";

describe("Stage6", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContextValue = {
      subStep: 0,
      setSubStep: mockSetSubStep,
      accidentalExplorer: "natural",
      setAccidentalExplorer: mockSetAccidentalExplorer,
      pitchExplorerIndex: 6,
      setPitchExplorerIndex: mockSetPitchExplorerIndex,
      noteInfo: { letter: "B", accidental: "♭", hasAccidental: true },
      playAccidentalExplorer: mockPlayAccidentalExplorer,
      playCombinedExplorer: mockPlayCombinedExplorer,
      goBackTeaching: mockGoBackTeaching,
      nextStage: mockNextStage,
    };
  });

  // ==========================================================================
  // STAGE 6 CONTENT TESTS
  // ==========================================================================
  describe("Stage6Content", () => {
    it("renders stage title", () => {
      const { getByText } = render(<Stage6Content />);
      expect(getByText("Sharps, Flats & Naturals")).toBeTruthy();
    });

    describe("SubStep 0 - Introduction", () => {
      beforeEach(() => {
        mockContextValue.subStep = 0;
      });

      it("shows all accidental symbols", () => {
        const { getByText } = render(<Stage6Content />);
        expect(getByText("♭")).toBeTruthy();
        expect(getByText("♮")).toBeTruthy();
        expect(getByText("♯")).toBeTruthy();
      });

      it("shows accidental names", () => {
        const { getByText } = render(<Stage6Content />);
        expect(getByText("Flat")).toBeTruthy();
        expect(getByText("Natural")).toBeTruthy();
        expect(getByText("Sharp")).toBeTruthy();
      });

      it("explains each accidental", () => {
        const { getByText } = render(<Stage6Content />);
        expect(getByText(/Flat \(♭\)/)).toBeTruthy();
        expect(getByText(/one step lower/)).toBeTruthy();
        expect(getByText(/Sharp \(♯\)/)).toBeTruthy();
        expect(getByText(/one step higher/)).toBeTruthy();
      });
    });

    describe("SubStep 1 - Natural Default", () => {
      beforeEach(() => {
        mockContextValue.subStep = 1;
      });

      it("explains default natural", () => {
        const { getByText } = render(<Stage6Content />);
        expect(getByText(/every note is/)).toBeTruthy();
        expect(getByText(/natural/)).toBeTruthy();
      });

      it("explains cancel symbol", () => {
        const { getByText } = render(<Stage6Content />);
        expect(getByText(/cancel/)).toBeTruthy();
      });
    });

    describe("SubStep 2 - Accidental Explorer", () => {
      beforeEach(() => {
        mockContextValue.subStep = 2;
      });

      it("shows try it instruction", () => {
        const { getByText } = render(<Stage6Content />);
        expect(getByText(/Try it!/)).toBeTruthy();
      });

      it("renders accidental buttons", () => {
        const { getByLabelText } = render(<Stage6Content />);
        expect(getByLabelText("Select flat")).toBeTruthy();
        expect(getByLabelText("Select natural")).toBeTruthy();
        expect(getByLabelText("Select sharp")).toBeTruthy();
      });

      it("selects flat and plays", () => {
        const { getByLabelText } = render(<Stage6Content />);
        fireEvent.press(getByLabelText("Select flat"));
        expect(mockSetAccidentalExplorer).toHaveBeenCalledWith("flat");
        expect(mockPlayAccidentalExplorer).toHaveBeenCalledWith("flat");
      });

      it("selects natural and plays", () => {
        const { getByLabelText } = render(<Stage6Content />);
        fireEvent.press(getByLabelText("Select natural"));
        expect(mockSetAccidentalExplorer).toHaveBeenCalledWith("natural");
        expect(mockPlayAccidentalExplorer).toHaveBeenCalledWith("natural");
      });

      it("selects sharp and plays", () => {
        const { getByLabelText } = render(<Stage6Content />);
        fireEvent.press(getByLabelText("Select sharp"));
        expect(mockSetAccidentalExplorer).toHaveBeenCalledWith("sharp");
        expect(mockPlayAccidentalExplorer).toHaveBeenCalledWith("sharp");
      });
    });

    describe("SubStep 3 - Combined Explorer", () => {
      beforeEach(() => {
        mockContextValue.subStep = 3;
      });

      it("shows combined instruction", () => {
        const { getByText } = render(<Stage6Content />);
        expect(getByText(/Now try both together!/)).toBeTruthy();
      });

      it("renders pitch movement buttons", () => {
        const { getByLabelText } = render(<Stage6Content />);
        expect(getByLabelText("Move note down")).toBeTruthy();
        expect(getByLabelText("Play current note")).toBeTruthy();
        expect(getByLabelText("Move note up")).toBeTruthy();
      });

      it("moves down and plays combined", () => {
        const { getByLabelText } = render(<Stage6Content />);
        fireEvent.press(getByLabelText("Move note down"));
        expect(mockSetPitchExplorerIndex).toHaveBeenCalledWith(5);
        expect(mockPlayCombinedExplorer).toHaveBeenCalledWith(5, "natural");
      });

      it("moves up and plays combined", () => {
        const { getByLabelText } = render(<Stage6Content />);
        fireEvent.press(getByLabelText("Move note up"));
        expect(mockSetPitchExplorerIndex).toHaveBeenCalledWith(7);
        expect(mockPlayCombinedExplorer).toHaveBeenCalledWith(7, "natural");
      });

      it("plays current combined", () => {
        const { getByLabelText } = render(<Stage6Content />);
        fireEvent.press(getByLabelText("Play current note"));
        expect(mockPlayCombinedExplorer).toHaveBeenCalledWith(6, "natural");
      });

      it("disables down when at lowest", () => {
        mockContextValue.pitchExplorerIndex = 0;
        const { getByLabelText } = render(<Stage6Content />);
        const btn = getByLabelText("Move note down");
        expect(btn.props.accessibilityState?.disabled).toBe(true);
      });

      it("disables up when at highest", () => {
        mockContextValue.pitchExplorerIndex = 12;
        const { getByLabelText } = render(<Stage6Content />);
        const btn = getByLabelText("Move note up");
        expect(btn.props.accessibilityState?.disabled).toBe(true);
      });

      it("selects flat in combined mode", () => {
        const { getAllByLabelText } = render(<Stage6Content />);
        const flatButtons = getAllByLabelText("Select flat");
        fireEvent.press(flatButtons[flatButtons.length - 1]); // Get the combined one
        expect(mockSetAccidentalExplorer).toHaveBeenCalledWith("flat");
        expect(mockPlayCombinedExplorer).toHaveBeenCalledWith(6, "flat");
      });

      it("selects natural in combined mode", () => {
        const { getAllByLabelText } = render(<Stage6Content />);
        const naturalButtons = getAllByLabelText("Select natural");
        fireEvent.press(naturalButtons[naturalButtons.length - 1]);
        expect(mockSetAccidentalExplorer).toHaveBeenCalledWith("natural");
        expect(mockPlayCombinedExplorer).toHaveBeenCalledWith(6, "natural");
      });

      it("selects sharp in combined mode", () => {
        const { getAllByLabelText } = render(<Stage6Content />);
        const sharpButtons = getAllByLabelText("Select sharp");
        fireEvent.press(sharpButtons[sharpButtons.length - 1]);
        expect(mockSetAccidentalExplorer).toHaveBeenCalledWith("sharp");
        expect(mockPlayCombinedExplorer).toHaveBeenCalledWith(6, "sharp");
      });
    });

    describe("SubStep 4 - Your Note", () => {
      beforeEach(() => {
        mockContextValue.subStep = 4;
      });

      it("shows your note", () => {
        const { getByText } = render(<Stage6Content />);
        expect(getByText(/Your note is/)).toBeTruthy();
        expect(getByText(/B♭/)).toBeTruthy();
      });

      it("explains accidental for notes with accidentals", () => {
        const { getByText } = render(<Stage6Content />);
        expect(getByText(/flat symbol means it's one step/)).toBeTruthy();
      });

      it("explains natural for notes without accidentals", () => {
        mockContextValue.noteInfo = {
          letter: "C",
          accidental: "",
          hasAccidental: false,
        };
        const { getByText } = render(<Stage6Content />);
        expect(getByText(/This is a "natural" note/)).toBeTruthy();
      });
    });
  });

  // ==========================================================================
  // STAGE 6 BUTTONS TESTS
  // ==========================================================================
  describe("Stage6Buttons", () => {
    describe("SubStep 0", () => {
      beforeEach(() => {
        mockContextValue.subStep = 0;
      });

      it("calls goBackTeaching when Back pressed", () => {
        const { getByText } = render(<Stage6Buttons />);
        fireEvent.press(getByText("← Back"));
        expect(mockGoBackTeaching).toHaveBeenCalledWith(5, 1);
      });

      it("advances to subStep 1", () => {
        const { getByText } = render(<Stage6Buttons />);
        fireEvent.press(getByText("Got it →"));
        expect(mockSetSubStep).toHaveBeenCalledWith(1);
      });
    });

    describe("SubStep 1", () => {
      beforeEach(() => {
        mockContextValue.subStep = 1;
      });

      it("goes back to subStep 0", () => {
        const { getByText } = render(<Stage6Buttons />);
        fireEvent.press(getByText("← Back"));
        expect(mockSetSubStep).toHaveBeenCalledWith(0);
      });

      it("advances to subStep 2", () => {
        const { getByText } = render(<Stage6Buttons />);
        fireEvent.press(getByText("Try it! →"));
        expect(mockSetSubStep).toHaveBeenCalledWith(2);
      });
    });

    describe("SubStep 2", () => {
      beforeEach(() => {
        mockContextValue.subStep = 2;
      });

      it("goes back to subStep 1", () => {
        const { getByText } = render(<Stage6Buttons />);
        fireEvent.press(getByText("← Back"));
        expect(mockSetSubStep).toHaveBeenCalledWith(1);
      });

      it("advances to subStep 3", () => {
        const { getByText } = render(<Stage6Buttons />);
        fireEvent.press(getByText("Next →"));
        expect(mockSetSubStep).toHaveBeenCalledWith(3);
      });
    });

    describe("SubStep 3", () => {
      beforeEach(() => {
        mockContextValue.subStep = 3;
      });

      it("goes back to subStep 2", () => {
        const { getByText } = render(<Stage6Buttons />);
        fireEvent.press(getByText("← Back"));
        expect(mockSetSubStep).toHaveBeenCalledWith(2);
      });

      it("advances to subStep 4", () => {
        const { getByText } = render(<Stage6Buttons />);
        fireEvent.press(getByText("Next →"));
        expect(mockSetSubStep).toHaveBeenCalledWith(4);
      });
    });

    describe("SubStep 4", () => {
      beforeEach(() => {
        mockContextValue.subStep = 4;
      });

      it("goes back to subStep 3", () => {
        const { getByText } = render(<Stage6Buttons />);
        fireEvent.press(getByText("← Back"));
        expect(mockSetSubStep).toHaveBeenCalledWith(3);
      });

      it("calls nextStage", () => {
        const { getByText } = render(<Stage6Buttons />);
        fireEvent.press(getByText("Show me my note! →"));
        expect(mockNextStage).toHaveBeenCalled();
      });
    });

    describe("Invalid SubStep", () => {
      it("returns null", () => {
        mockContextValue.subStep = 99;
        const { toJSON } = render(<Stage6Buttons />);
        expect(toJSON()).toBeNull();
      });
    });
  });
});
