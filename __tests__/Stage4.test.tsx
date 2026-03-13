/**
 * @fileoverview Tests for Stage4 component
 * FirstNote Stage 4: Learn About Notes - Teaching note heads and pitch explorer
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

// Mock FirstNoteContext
const mockSetSubStep = jest.fn();
const mockSetPitchExplorerIndex = jest.fn();
const mockPlayPitchExplorer = jest.fn();
const mockGoBackTeaching = jest.fn();
const mockNextStage = jest.fn();

let mockContextValue: any = {
  subStep: 0,
  setSubStep: mockSetSubStep,
  pitchExplorerIndex: 3,
  setPitchExplorerIndex: mockSetPitchExplorerIndex,
  playPitchExplorer: mockPlayPitchExplorer,
  goBackTeaching: mockGoBackTeaching,
  nextStage: mockNextStage,
};

jest.mock("../src/screens/FirstNote/context/FirstNoteContext", () => ({
  useFirstNote: () => mockContextValue,
}));

// Mock data - PITCH_EXPLORER_NOTES has multiple notes with positions and ledger lines
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
  styles: {
    stageContainer: {},
    stageTitle: {},
    noteVisualContainer: {},
    noteCircleFilled: {},
    noteCircleHollow: {},
    instruction: {},
    bold: {},
    staffWithNoteVisual: {},
    staffLine: {},
    noteOnLine: {},
    noteInSpace: {},
    pitchExplorerStaff: {},
    ledgerLineExplorer: {},
    pitchExplorerNote: {},
    pitchExplorerControls: {},
    pitchExplorerButton: {},
    pitchExplorerButtonDisabled: {},
    pitchExplorerButtonText: {},
    pitchExplorerPlayButton: {},
    pitchExplorerPlayButtonText: {},
    fixedBottomButtons: {},
    primaryButton: {},
    primaryButtonText: {},
    backTextButton: {},
    backTextButtonText: {},
  },
}));

import {
  Stage4Content,
  Stage4Buttons,
} from "../src/screens/FirstNote/stages/Stage4";

describe("Stage4", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContextValue = {
      subStep: 0,
      setSubStep: mockSetSubStep,
      pitchExplorerIndex: 6, // middle of range
      setPitchExplorerIndex: mockSetPitchExplorerIndex,
      playPitchExplorer: mockPlayPitchExplorer,
      goBackTeaching: mockGoBackTeaching,
      nextStage: mockNextStage,
    };
  });

  // ==========================================================================
  // STAGE 4 CONTENT TESTS
  // ==========================================================================
  describe("Stage4Content", () => {
    it("renders stage title", () => {
      const { getByText } = render(<Stage4Content />);
      expect(getByText("What is a Note?")).toBeTruthy();
    });

    describe("SubStep 0 - Note Introduction", () => {
      beforeEach(() => {
        mockContextValue.subStep = 0;
      });

      it("explains notes are circles", () => {
        const { getByText } = render(<Stage4Content />);
        expect(getByText(/Notes are/)).toBeTruthy();
        expect(getByText(/round circles/)).toBeTruthy();
      });

      it("introduces note head term", () => {
        const { getByText } = render(<Stage4Content />);
        expect(getByText(/note head/)).toBeTruthy();
      });

      it("explains filled and hollow note heads", () => {
        const { getByText } = render(<Stage4Content />);
        expect(getByText(/filled \(solid\) or hollow \(open\)/)).toBeTruthy();
      });
    });

    describe("SubStep 1 - Notes on Lines", () => {
      beforeEach(() => {
        mockContextValue.subStep = 1;
      });

      it("explains notes on lines", () => {
        const { getByText } = render(<Stage4Content />);
        expect(getByText(/directly on a line/)).toBeTruthy();
      });

      it("explains line through middle", () => {
        const { getByText } = render(<Stage4Content />);
        expect(getByText(/line goes right through the middle/)).toBeTruthy();
      });
    });

    describe("SubStep 2 - Notes in Spaces", () => {
      beforeEach(() => {
        mockContextValue.subStep = 2;
      });

      it("explains notes in spaces", () => {
        const { getByText } = render(<Stage4Content />);
        expect(getByText(/in a space/)).toBeTruthy();
      });

      it("explains pitch relationship", () => {
        const { getByText } = render(<Stage4Content />);
        expect(getByText(/Higher on the staff = higher pitch/)).toBeTruthy();
        expect(getByText(/Lower on the staff = lower pitch/)).toBeTruthy();
      });
    });

    describe("SubStep 3 - Pitch Explorer", () => {
      beforeEach(() => {
        mockContextValue.subStep = 3;
      });

      it("shows try it instruction", () => {
        const { getByText } = render(<Stage4Content />);
        expect(getByText(/Try it!/)).toBeTruthy();
        expect(getByText(/Move the note/)).toBeTruthy();
      });

      it("renders Down button", () => {
        const { getByText, getByLabelText } = render(<Stage4Content />);
        expect(getByText("↓ Down")).toBeTruthy();
        expect(getByLabelText("Move note down")).toBeTruthy();
      });

      it("renders Play button", () => {
        const { getByText, getByLabelText } = render(<Stage4Content />);
        expect(getByText("▶ Play")).toBeTruthy();
        expect(getByLabelText("Play current note")).toBeTruthy();
      });

      it("renders Up button", () => {
        const { getByText, getByLabelText } = render(<Stage4Content />);
        expect(getByText("↑ Up")).toBeTruthy();
        expect(getByLabelText("Move note up")).toBeTruthy();
      });

      it("moves note down when Down pressed", () => {
        const { getByText } = render(<Stage4Content />);
        fireEvent.press(getByText("↓ Down"));
        expect(mockSetPitchExplorerIndex).toHaveBeenCalledWith(5);
        expect(mockPlayPitchExplorer).toHaveBeenCalledWith(5);
      });

      it("moves note up when Up pressed", () => {
        const { getByText } = render(<Stage4Content />);
        fireEvent.press(getByText("↑ Up"));
        expect(mockSetPitchExplorerIndex).toHaveBeenCalledWith(7);
        expect(mockPlayPitchExplorer).toHaveBeenCalledWith(7);
      });

      it("plays current note when Play pressed", () => {
        const { getByText } = render(<Stage4Content />);
        fireEvent.press(getByText("▶ Play"));
        expect(mockPlayPitchExplorer).toHaveBeenCalledWith(6);
      });

      it("disables Down button at lowest pitch", () => {
        mockContextValue.pitchExplorerIndex = 0;
        const { getByLabelText } = render(<Stage4Content />);
        const button = getByLabelText("Move note down");
        expect(button.props.accessibilityState?.disabled).toBe(true);
      });

      it("disables Up button at highest pitch", () => {
        mockContextValue.pitchExplorerIndex = 12; // Last index
        const { getByLabelText } = render(<Stage4Content />);
        const button = getByLabelText("Move note up");
        expect(button.props.accessibilityState?.disabled).toBe(true);
      });
    });
  });

  // ==========================================================================
  // STAGE 4 BUTTONS TESTS
  // ==========================================================================
  describe("Stage4Buttons", () => {
    describe("SubStep 0", () => {
      beforeEach(() => {
        mockContextValue.subStep = 0;
      });

      it("renders Back button", () => {
        const { getByText, getByLabelText } = render(<Stage4Buttons />);
        expect(getByText("← Back")).toBeTruthy();
        expect(getByLabelText("Go back")).toBeTruthy();
      });

      it("renders Got it button", () => {
        const { getByText, getByLabelText } = render(<Stage4Buttons />);
        expect(getByText("Got it →")).toBeTruthy();
        expect(getByLabelText("Got it, continue")).toBeTruthy();
      });

      it("calls goBackTeaching when Back pressed", () => {
        const { getByText } = render(<Stage4Buttons />);
        fireEvent.press(getByText("← Back"));
        expect(mockGoBackTeaching).toHaveBeenCalledWith(3, 2);
      });

      it("advances to subStep 1 when Got it pressed", () => {
        const { getByText } = render(<Stage4Buttons />);
        fireEvent.press(getByText("Got it →"));
        expect(mockSetSubStep).toHaveBeenCalledWith(1);
      });
    });

    describe("SubStep 1", () => {
      beforeEach(() => {
        mockContextValue.subStep = 1;
      });

      it("renders What else button", () => {
        const { getByText, getByLabelText } = render(<Stage4Buttons />);
        expect(getByText("What else? →")).toBeTruthy();
        expect(getByLabelText("What else, continue")).toBeTruthy();
      });

      it("goes back to subStep 0 when Back pressed", () => {
        const { getByText } = render(<Stage4Buttons />);
        fireEvent.press(getByText("← Back"));
        expect(mockSetSubStep).toHaveBeenCalledWith(0);
      });

      it("advances to subStep 2 when What else pressed", () => {
        const { getByText } = render(<Stage4Buttons />);
        fireEvent.press(getByText("What else? →"));
        expect(mockSetSubStep).toHaveBeenCalledWith(2);
      });
    });

    describe("SubStep 2", () => {
      beforeEach(() => {
        mockContextValue.subStep = 2;
      });

      it("renders Try it button", () => {
        const { getByText, getByLabelText } = render(<Stage4Buttons />);
        expect(getByText("Try it! →")).toBeTruthy();
        expect(getByLabelText("Try it")).toBeTruthy();
      });

      it("goes back to subStep 1 when Back pressed", () => {
        const { getByText } = render(<Stage4Buttons />);
        fireEvent.press(getByText("← Back"));
        expect(mockSetSubStep).toHaveBeenCalledWith(1);
      });

      it("advances to subStep 3 when Try it pressed", () => {
        const { getByText } = render(<Stage4Buttons />);
        fireEvent.press(getByText("Try it! →"));
        expect(mockSetSubStep).toHaveBeenCalledWith(3);
      });
    });

    describe("SubStep 3", () => {
      beforeEach(() => {
        mockContextValue.subStep = 3;
      });

      it("renders Next button", () => {
        const { getByText, getByLabelText } = render(<Stage4Buttons />);
        expect(getByText("Next →")).toBeTruthy();
        expect(getByLabelText("Next")).toBeTruthy();
      });

      it("goes back to subStep 2 when Back pressed", () => {
        const { getByText } = render(<Stage4Buttons />);
        fireEvent.press(getByText("← Back"));
        expect(mockSetSubStep).toHaveBeenCalledWith(2);
      });

      it("calls nextStage when Next pressed", () => {
        const { getByText } = render(<Stage4Buttons />);
        fireEvent.press(getByText("Next →"));
        expect(mockNextStage).toHaveBeenCalled();
      });
    });

    describe("Invalid SubStep", () => {
      it("returns null for invalid subStep", () => {
        mockContextValue.subStep = 99;
        const { toJSON } = render(<Stage4Buttons />);
        expect(toJSON()).toBeNull();
      });
    });
  });
});
