/**
 * @fileoverview Tests for Stage3 component
 * FirstNote Stage 3: Learn About Staff - Teaching musical staff basics
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

// Mock FirstNoteContext
const mockSetSubStep = jest.fn();
const mockNextStage = jest.fn();

let mockContextValue: any = {
  subStep: 0,
  setSubStep: mockSetSubStep,
  nextStage: mockNextStage,
};

jest.mock("../src/screens/FirstNote/context/FirstNoteContext", () => ({
  useFirstNote: () => mockContextValue,
}));

// Mock the require for the image asset
jest.mock("../../../../assets/staff_infection.jpg", () => "mocked-image", {
  virtual: true,
});

// Mock styles
jest.mock("../src/screens/FirstNote/styles", () => ({
  styles: {
    stageContainer: {},
    stageTitle: {},
    staffVisual: {},
    staffLine: {},
    instruction: {},
    bold: {},
    funFact: {},
    staffInfectionImage: {},
    ledgerLineDemo: {},
    ledgerLineSmall: {},
    noteDemoCircle: {},
    fixedBottomButtons: {},
    primaryButton: {},
    primaryButtonText: {},
    backTextButton: {},
    backTextButtonText: {},
  },
}));

import {
  Stage3Content,
  Stage3Buttons,
} from "../src/screens/FirstNote/stages/Stage3";

describe("Stage3", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContextValue = {
      subStep: 0,
      setSubStep: mockSetSubStep,
      nextStage: mockNextStage,
    };
  });

  // ==========================================================================
  // STAGE 3 CONTENT TESTS
  // ==========================================================================
  describe("Stage3Content", () => {
    it("renders stage title", () => {
      const { getByText } = render(<Stage3Content />);
      expect(getByText("The Musical Staff")).toBeTruthy();
    });

    describe("SubStep 0 - Staff Introduction", () => {
      beforeEach(() => {
        mockContextValue.subStep = 0;
      });

      it("explains what a staff is", () => {
        const { getByText } = render(<Stage3Content />);
        expect(getByText(/This is a/)).toBeTruthy();
        expect(getByText(/staff/)).toBeTruthy();
      });

      it("explains 5 lines and 4 spaces", () => {
        const { getByText } = render(<Stage3Content />);
        expect(getByText(/5 lines/)).toBeTruthy();
        expect(getByText(/4 spaces/)).toBeTruthy();
      });

      it("explains note placement", () => {
        const { getByText } = render(<Stage3Content />);
        expect(
          getByText(/Notes sit on the lines or in the spaces/),
        ).toBeTruthy();
      });
    });

    describe("SubStep 1 - Fun Memory Trick", () => {
      beforeEach(() => {
        mockContextValue.subStep = 1;
      });

      it("shows fun fact header", () => {
        const { getByText } = render(<Stage3Content />);
        expect(getByText("🏥 Fun Memory Trick")).toBeTruthy();
      });

      it("shows staff infection joke", () => {
        const { getByText } = render(<Stage3Content />);
        expect(
          getByText(/🤣 5 lines = staff = "staff infection"/),
        ).toBeTruthy();
      });
    });

    describe("SubStep 2 - Ledger Lines", () => {
      beforeEach(() => {
        mockContextValue.subStep = 2;
      });

      it("explains ledger lines concept", () => {
        const { getByText } = render(<Stage3Content />);
        expect(getByText(/Sometimes notes go/)).toBeTruthy();
        expect(getByText(/beyond/)).toBeTruthy();
      });

      it("introduces ledger lines term", () => {
        const { getByText } = render(<Stage3Content />);
        expect(getByText(/ledger lines/)).toBeTruthy();
      });

      it("explains ledger lines are extensions", () => {
        const { getByText } = render(<Stage3Content />);
        expect(getByText(/temporary extensions of the staff/)).toBeTruthy();
      });
    });
  });

  // ==========================================================================
  // STAGE 3 BUTTONS TESTS
  // ==========================================================================
  describe("Stage3Buttons", () => {
    describe("SubStep 0", () => {
      beforeEach(() => {
        mockContextValue.subStep = 0;
      });

      it("renders Got it button", () => {
        const { getByText, getByLabelText } = render(<Stage3Buttons />);
        expect(getByText("Got it →")).toBeTruthy();
        expect(getByLabelText("Got it, continue")).toBeTruthy();
      });

      it("advances to subStep 1 when pressed", () => {
        const { getByText } = render(<Stage3Buttons />);
        fireEvent.press(getByText("Got it →"));
        expect(mockSetSubStep).toHaveBeenCalledWith(1);
      });
    });

    describe("SubStep 1", () => {
      beforeEach(() => {
        mockContextValue.subStep = 1;
      });

      it("renders Back button", () => {
        const { getByText, getByLabelText } = render(<Stage3Buttons />);
        expect(getByText("← Back")).toBeTruthy();
        expect(getByLabelText("Go back")).toBeTruthy();
      });

      it("renders Ha! Next button", () => {
        const { getByText, getByLabelText } = render(<Stage3Buttons />);
        expect(getByText("Ha! Next →")).toBeTruthy();
        expect(getByLabelText("Ha, next")).toBeTruthy();
      });

      it("goes back to subStep 0 when Back pressed", () => {
        const { getByText } = render(<Stage3Buttons />);
        fireEvent.press(getByText("← Back"));
        expect(mockSetSubStep).toHaveBeenCalledWith(0);
      });

      it("advances to subStep 2 when Next pressed", () => {
        const { getByText } = render(<Stage3Buttons />);
        fireEvent.press(getByText("Ha! Next →"));
        expect(mockSetSubStep).toHaveBeenCalledWith(2);
      });
    });

    describe("SubStep 2", () => {
      beforeEach(() => {
        mockContextValue.subStep = 2;
      });

      it("renders Back button", () => {
        const { getByText, getByLabelText } = render(<Stage3Buttons />);
        expect(getByText("← Back")).toBeTruthy();
        expect(getByLabelText("Go back")).toBeTruthy();
      });

      it("renders Got it button", () => {
        const { getByText, getByLabelText } = render(<Stage3Buttons />);
        expect(getByText("Got it →")).toBeTruthy();
        expect(getByLabelText("Got it, continue")).toBeTruthy();
      });

      it("goes back to subStep 1 when Back pressed", () => {
        const { getByText } = render(<Stage3Buttons />);
        fireEvent.press(getByText("← Back"));
        expect(mockSetSubStep).toHaveBeenCalledWith(1);
      });

      it("calls nextStage when Got it pressed", () => {
        const { getByText } = render(<Stage3Buttons />);
        fireEvent.press(getByText("Got it →"));
        expect(mockNextStage).toHaveBeenCalledTimes(1);
      });
    });

    describe("Invalid SubStep", () => {
      it("returns null for invalid subStep", () => {
        mockContextValue.subStep = 99;
        const { toJSON } = render(<Stage3Buttons />);
        expect(toJSON()).toBeNull();
      });
    });
  });
});
