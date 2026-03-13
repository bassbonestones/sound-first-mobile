/**
 * @fileoverview Tests for Stage5 component
 * FirstNote Stage 5: Your Clef - Teaching clef basics
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

// Mock FirstNoteContext
const mockSetSubStep = jest.fn();
const mockGoBackTeaching = jest.fn();
const mockNextStage = jest.fn();

let mockContextValue: any = {
  subStep: 0,
  setSubStep: mockSetSubStep,
  clefType: "treble",
  instrument: "Trumpet",
  goBackTeaching: mockGoBackTeaching,
  nextStage: mockNextStage,
};

jest.mock("../src/screens/FirstNote/context/FirstNoteContext", () => ({
  useFirstNote: () => mockContextValue,
}));

// Mock image require
jest.mock("../../../../assets/bass_cleff_f.png", () => "mocked-image", {
  virtual: true,
});

// Mock data
jest.mock("../src/screens/FirstNote/data", () => ({
  BASS_CLEF_INSTRUMENTS: ["Trombone", "Tuba", "Bass Guitar"],
}));

// Mock styles
jest.mock("../src/screens/FirstNote/styles", () => ({
  __esModule: true,
  default: {
    stageContainer: {},
    stageTitle: {},
    clefSymbol: {},
    instruction: {},
    bold: {},
    imageWhiteBubble: {},
    bassClefImage: {},
    fixedBottomButtons: {},
    backTextButton: {},
    backTextButtonText: {},
    primaryButton: {},
    primaryButtonText: {},
  },
}));

import {
  Stage5Content,
  Stage5Buttons,
} from "../src/screens/FirstNote/stages/Stage5";

describe("Stage5", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContextValue = {
      subStep: 0,
      setSubStep: mockSetSubStep,
      clefType: "treble",
      instrument: "Trumpet",
      goBackTeaching: mockGoBackTeaching,
      nextStage: mockNextStage,
    };
  });

  // ==========================================================================
  // STAGE 5 CONTENT TESTS
  // ==========================================================================
  describe("Stage5Content", () => {
    it("renders stage title", () => {
      const { getByText } = render(<Stage5Content />);
      expect(getByText("Your Clef")).toBeTruthy();
    });

    describe("SubStep 0 - Clef Introduction", () => {
      beforeEach(() => {
        mockContextValue.subStep = 0;
      });

      it("shows treble clef symbol", () => {
        mockContextValue.clefType = "treble";
        const { getByText } = render(<Stage5Content />);
        expect(getByText("𝄞")).toBeTruthy();
      });

      it("shows bass clef symbol", () => {
        mockContextValue.clefType = "bass";
        const { getByText } = render(<Stage5Content />);
        expect(getByText("𝄢")).toBeTruthy();
      });

      it("shows alto clef symbol", () => {
        mockContextValue.clefType = "alto";
        const { getByText } = render(<Stage5Content />);
        expect(getByText("𝄡")).toBeTruthy();
      });

      it("explains treble clef", () => {
        mockContextValue.clefType = "treble";
        const { getByText } = render(<Stage5Content />);
        expect(getByText(/Treble Clef/)).toBeTruthy();
      });

      it("explains bass clef", () => {
        mockContextValue.clefType = "bass";
        const { getByText } = render(<Stage5Content />);
        expect(getByText(/Bass Clef/)).toBeTruthy();
      });

      it("explains alto clef", () => {
        mockContextValue.clefType = "alto";
        const { getByText } = render(<Stage5Content />);
        expect(getByText(/Alto Clef/)).toBeTruthy();
      });

      it("explains clef purpose", () => {
        const { getByText } = render(<Stage5Content />);
        expect(
          getByText(/clef tells us which notes go on which lines/),
        ).toBeTruthy();
      });

      it("mentions instrument uses this clef", () => {
        const { getByText } = render(<Stage5Content />);
        expect(
          getByText(/Your instrument \(Trumpet\) uses the treble clef/),
        ).toBeTruthy();
      });
    });

    describe("SubStep 1 - Treble Clef Details", () => {
      beforeEach(() => {
        mockContextValue.subStep = 1;
        mockContextValue.clefType = "treble";
      });

      it("explains treble clef is G clef", () => {
        const { getByText } = render(<Stage5Content />);
        expect(getByText(/G clef/)).toBeTruthy();
      });

      it("explains the curling", () => {
        const { getByText } = render(<Stage5Content />);
        expect(getByText(/curls around the second line/)).toBeTruthy();
      });

      it("mentions melody instruments", () => {
        const { getByText } = render(<Stage5Content />);
        expect(
          getByText(/Most melody instruments use treble clef/),
        ).toBeTruthy();
      });
    });

    describe("SubStep 1 - Bass Clef Details", () => {
      beforeEach(() => {
        mockContextValue.subStep = 1;
        mockContextValue.clefType = "bass";
      });

      it("explains bass clef is F clef", () => {
        const { getByText } = render(<Stage5Content />);
        expect(getByText(/F clef/)).toBeTruthy();
      });

      it("explains the dots", () => {
        const { getByText } = render(<Stage5Content />);
        expect(getByText(/those two dots/)).toBeTruthy();
        expect(getByText(/note F sits right between them/)).toBeTruthy();
      });

      it("lists bass clef instruments", () => {
        const { getByText } = render(<Stage5Content />);
        expect(getByText(/Trombone, Tuba, Bass Guitar/)).toBeTruthy();
      });
    });
  });

  // ==========================================================================
  // STAGE 5 BUTTONS TESTS
  // ==========================================================================
  describe("Stage5Buttons", () => {
    describe("SubStep 0", () => {
      beforeEach(() => {
        mockContextValue.subStep = 0;
      });

      it("renders Back button", () => {
        const { getByText, getByLabelText } = render(<Stage5Buttons />);
        expect(getByText("← Back")).toBeTruthy();
        expect(getByLabelText("Go back")).toBeTruthy();
      });

      it("renders Tell me more button", () => {
        const { getByText, getByLabelText } = render(<Stage5Buttons />);
        expect(getByText("Tell me more →")).toBeTruthy();
        expect(getByLabelText("Tell me more")).toBeTruthy();
      });

      it("calls goBackTeaching when Back pressed", () => {
        const { getByText } = render(<Stage5Buttons />);
        fireEvent.press(getByText("← Back"));
        expect(mockGoBackTeaching).toHaveBeenCalledWith(4, 3);
      });

      it("advances to subStep 1 when Tell me more pressed", () => {
        const { getByText } = render(<Stage5Buttons />);
        fireEvent.press(getByText("Tell me more →"));
        expect(mockSetSubStep).toHaveBeenCalledWith(1);
      });
    });

    describe("SubStep 1", () => {
      beforeEach(() => {
        mockContextValue.subStep = 1;
      });

      it("renders Back button", () => {
        const { getByText } = render(<Stage5Buttons />);
        expect(getByText("← Back")).toBeTruthy();
      });

      it("renders Got it button", () => {
        const { getByText, getByLabelText } = render(<Stage5Buttons />);
        expect(getByText("Got it →")).toBeTruthy();
        expect(getByLabelText("Got it, continue")).toBeTruthy();
      });

      it("goes back to subStep 0 when Back pressed", () => {
        const { getByText } = render(<Stage5Buttons />);
        fireEvent.press(getByText("← Back"));
        expect(mockSetSubStep).toHaveBeenCalledWith(0);
      });

      it("calls nextStage when Got it pressed", () => {
        const { getByText } = render(<Stage5Buttons />);
        fireEvent.press(getByText("Got it →"));
        expect(mockNextStage).toHaveBeenCalled();
      });
    });

    describe("Invalid SubStep", () => {
      it("returns null for invalid subStep", () => {
        mockContextValue.subStep = 99;
        const { toJSON } = render(<Stage5Buttons />);
        expect(toJSON()).toBeNull();
      });
    });
  });
});
