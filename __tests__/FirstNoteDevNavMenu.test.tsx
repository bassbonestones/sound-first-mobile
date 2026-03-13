/**
 * Tests for FirstNote DevNavMenu component
 * Dev navigation tool for jumping between stages during development
 */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { DevNavMenu } from "../src/screens/FirstNote/components/DevNavMenu";
import { Platform } from "react-native";

// Mock the context
const mockSetStage = jest.fn();
const mockSetSubStep = jest.fn();
const mockSetFocusCardIndex = jest.fn();
const mockSetFocusStepsDone = jest.fn();
const mockSetFocusCardRatings = jest.fn();
const mockSetPitchAccuracy = jest.fn();
const mockNavigate = jest.fn();
const mockReplace = jest.fn();
const mockDispatch = jest.fn();

const mockContextValue = {
  stage: 0,
  setStage: mockSetStage,
  setSubStep: mockSetSubStep,
  setFocusCardIndex: mockSetFocusCardIndex,
  setFocusStepsDone: mockSetFocusStepsDone,
  setFocusCardRatings: mockSetFocusCardRatings,
  setPitchAccuracy: mockSetPitchAccuracy,
  userId: "test-user-123",
  navigation: {
    navigate: mockNavigate,
    replace: mockReplace,
    dispatch: mockDispatch,
  },
};

jest.mock("../src/screens/FirstNote/context/FirstNoteContext", () => ({
  useFirstNote: () => mockContextValue,
}));

// Mock API client
jest.mock("../src/api/client", () => ({
  getBackendUrl: () => "http://test-backend.com",
}));

// Mock CommonActions
jest.mock("@react-navigation/native", () => ({
  CommonActions: {
    reset: jest.fn((config) => ({ type: "RESET", ...config })),
  },
}));

// Mock devLogger
jest.mock("../src/utils/devLogger", () => ({
  devError: jest.fn(),
}));

describe("FirstNote DevNavMenu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContextValue.stage = 0;
    global.fetch = jest.fn();
    // Reset platform to default
    Object.defineProperty(Platform, "OS", { value: "ios", configurable: true });
  });

  describe("Closed State", () => {
    it("renders collapsed menu button", () => {
      const { getByLabelText, getByText } = render(<DevNavMenu />);
      expect(getByLabelText("Open dev navigation menu")).toBeTruthy();
      expect(getByText("🔧")).toBeTruthy();
    });

    it("opens menu when button pressed", () => {
      const { getByLabelText, getByText } = render(<DevNavMenu />);
      fireEvent.press(getByLabelText("Open dev navigation menu"));
      expect(getByText("Dev Navigation")).toBeTruthy();
    });
  });

  describe("Open State", () => {
    it("shows menu title and close button", () => {
      const { getByLabelText, getByText } = render(<DevNavMenu />);
      fireEvent.press(getByLabelText("Open dev navigation menu"));

      expect(getByText("Dev Navigation")).toBeTruthy();
      expect(getByLabelText("Close dev menu")).toBeTruthy();
    });

    it("closes menu when close button pressed", () => {
      const { getByLabelText, queryByText } = render(<DevNavMenu />);
      fireEvent.press(getByLabelText("Open dev navigation menu"));
      expect(queryByText("Dev Navigation")).toBeTruthy();

      fireEvent.press(getByLabelText("Close dev menu"));
      expect(queryByText("Dev Navigation")).toBeNull();
    });

    it("shows all stages", () => {
      const { getByLabelText, getByText } = render(<DevNavMenu />);
      fireEvent.press(getByLabelText("Open dev navigation menu"));

      expect(getByText(/Listen & Sing/)).toBeTruthy();
      expect(getByText(/Play Your Note/)).toBeTruthy();
      expect(getByText(/Refine Your Sound/)).toBeTruthy();
      expect(getByText(/The Musical Staff/)).toBeTruthy();
      expect(getByText(/What is a Note\?/)).toBeTruthy();
      expect(getByText(/Your Clef/)).toBeTruthy();
      expect(getByText(/Sharps & Flats/)).toBeTruthy();
      expect(getByText(/Note on Staff/)).toBeTruthy();
    });

    it("shows Settings option", () => {
      const { getByLabelText } = render(<DevNavMenu />);
      fireEvent.press(getByLabelText("Open dev navigation menu"));

      expect(getByLabelText("Settings: Settings")).toBeTruthy();
    });

    it("shows reset and admin buttons", () => {
      const { getByLabelText, getByText } = render(<DevNavMenu />);
      fireEvent.press(getByLabelText("Open dev navigation menu"));

      expect(getByLabelText("Reset user data")).toBeTruthy();
      expect(getByText("🔄 Reset User Data")).toBeTruthy();
      expect(getByLabelText("Open admin panel")).toBeTruthy();
      expect(getByText("⚙️ Admin Panel")).toBeTruthy();
    });

    it("highlights current stage", () => {
      mockContextValue.stage = 2;
      const { getByLabelText, getByText } = render(<DevNavMenu />);
      fireEvent.press(getByLabelText("Open dev navigation menu"));

      // Stage 2 should exist
      expect(getByText(/Refine Your Sound/)).toBeTruthy();
    });
  });

  describe("Stage Expansion", () => {
    it("expands stage to show substeps", () => {
      const { getByLabelText, getByText, queryByText } = render(<DevNavMenu />);
      fireEvent.press(getByLabelText("Open dev navigation menu"));

      // Initially substeps are hidden
      expect(queryByText(/a\) Listen/)).toBeNull();

      // Click to expand Stage 0
      fireEvent.press(getByLabelText("Stage 0: Listen & Sing"));

      // Now substeps should be visible
      expect(getByText(/a\) Listen/)).toBeTruthy();
      expect(getByText(/b\) Sing/)).toBeTruthy();
      expect(getByText(/c\) Imagine/)).toBeTruthy();
    });

    it("collapses expanded stage on second click", () => {
      const { getByLabelText, getByText, queryByText } = render(<DevNavMenu />);
      fireEvent.press(getByLabelText("Open dev navigation menu"));

      // Expand
      fireEvent.press(getByLabelText("Stage 0: Listen & Sing"));
      expect(getByText(/a\) Listen/)).toBeTruthy();

      // Collapse
      fireEvent.press(getByLabelText("Stage 0: Listen & Sing"));
      expect(queryByText(/a\) Listen/)).toBeNull();
    });

    it("expands Settings to show options", () => {
      const { getByLabelText, getByText } = render(<DevNavMenu />);
      fireEvent.press(getByLabelText("Open dev navigation menu"));

      fireEvent.press(getByLabelText("Settings: Settings"));

      expect(getByText(/a\) Instrument Class/)).toBeTruthy();
      expect(getByText(/b\) Instrument/)).toBeTruthy();
      expect(getByText(/c\) First Note Picker/)).toBeTruthy();
    });
  });

  describe("Navigation", () => {
    it("navigates directly to stage with no substeps", () => {
      const { getByLabelText } = render(<DevNavMenu />);
      fireEvent.press(getByLabelText("Open dev navigation menu"));

      // Stage 7 (Note on Staff) has no substeps
      fireEvent.press(getByLabelText("Stage 7: Note on Staff"));

      expect(mockSetStage).toHaveBeenCalledWith(7);
      expect(mockSetSubStep).toHaveBeenCalledWith(0);
      expect(mockSetPitchAccuracy).toHaveBeenCalledWith(null);
    });

    it("navigates to substep within a stage", () => {
      const { getByLabelText } = render(<DevNavMenu />);
      fireEvent.press(getByLabelText("Open dev navigation menu"));

      // Expand Stage 1
      fireEvent.press(getByLabelText("Stage 1: Play Your Note"));

      // Click substep b) Ready to play
      fireEvent.press(getByLabelText("Navigate to b) Ready to play"));

      expect(mockSetStage).toHaveBeenCalledWith(1);
      expect(mockSetSubStep).toHaveBeenCalledWith(1);
      expect(mockSetPitchAccuracy).toHaveBeenCalledWith(null);
      expect(mockSetFocusStepsDone).toHaveBeenCalledWith({
        listen: false,
        sing: false,
        imagine: false,
        play: false,
      });
    });

    it("handles Stage 2 Focus Cards navigation", () => {
      const { getByLabelText } = render(<DevNavMenu />);
      fireEvent.press(getByLabelText("Open dev navigation menu"));

      // Expand Stage 2
      fireEvent.press(getByLabelText("Stage 2: Refine Your Sound"));

      // Navigate to Focus Card 2/3
      fireEvent.press(getByLabelText("Navigate to b) Focus Card 2/3"));

      expect(mockSetStage).toHaveBeenCalledWith(2);
      expect(mockSetFocusCardIndex).toHaveBeenCalledWith(1);
      expect(mockSetFocusCardRatings).toHaveBeenCalledWith([]);
      expect(mockSetSubStep).toHaveBeenCalledWith(0);
    });

    it("handles Stage 2 All Complete state", () => {
      const { getByLabelText } = render(<DevNavMenu />);
      fireEvent.press(getByLabelText("Open dev navigation menu"));

      // Expand Stage 2
      fireEvent.press(getByLabelText("Stage 2: Refine Your Sound"));

      // Navigate to All Complete
      fireEvent.press(getByLabelText("Navigate to d) All Complete"));

      expect(mockSetStage).toHaveBeenCalledWith(2);
      expect(mockSetFocusCardRatings).toHaveBeenCalledWith([4, 4, 4]);
      expect(mockSetFocusCardIndex).toHaveBeenCalledWith(0);
    });

    it("navigates to Onboarding from Settings", () => {
      const { getByLabelText } = render(<DevNavMenu />);
      fireEvent.press(getByLabelText("Open dev navigation menu"));

      // Expand Settings
      fireEvent.press(getByLabelText("Settings: Settings"));

      // Click Instrument Class option
      fireEvent.press(getByLabelText("Navigate to a) Instrument Class"));

      expect(mockReplace).toHaveBeenCalledWith("Onboarding", {
        step: 1,
        clearFamily: true,
      });
    });

    it("navigates to Admin panel", () => {
      const { getByLabelText } = render(<DevNavMenu />);
      fireEvent.press(getByLabelText("Open dev navigation menu"));

      fireEvent.press(getByLabelText("Open admin panel"));

      expect(mockNavigate).toHaveBeenCalledWith("Admin");
    });
  });

  describe("Reset Functionality", () => {
    it("does nothing on non-web platforms", () => {
      Object.defineProperty(Platform, "OS", { value: "ios" });

      const { getByLabelText } = render(<DevNavMenu />);
      fireEvent.press(getByLabelText("Open dev navigation menu"));
      fireEvent.press(getByLabelText("Reset user data"));

      // No fetch should be called on non-web
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("shows confirmation on web", () => {
      Object.defineProperty(Platform, "OS", {
        value: "web",
        configurable: true,
      });
      window.confirm = jest.fn(() => false);

      const { getByLabelText } = render(<DevNavMenu />);
      fireEvent.press(getByLabelText("Open dev navigation menu"));
      fireEvent.press(getByLabelText("Reset user data"));

      expect(window.confirm).toHaveBeenCalledWith(
        "Reset all progress and start over?",
      );
    });

    it("performs reset on web confirmation", async () => {
      Object.defineProperty(Platform, "OS", {
        value: "web",
        configurable: true,
      });
      window.confirm = jest.fn(() => true);
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      const { getByLabelText } = render(<DevNavMenu />);
      fireEvent.press(getByLabelText("Open dev navigation menu"));
      fireEvent.press(getByLabelText("Reset user data"));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "http://test-backend.com/users/test-user-123/reset",
          { method: "POST" },
        );
      });

      expect(mockDispatch).toHaveBeenCalled();
    });

    it("handles reset error on web", async () => {
      Object.defineProperty(Platform, "OS", {
        value: "web",
        configurable: true,
      });
      window.confirm = jest.fn(() => true);
      window.alert = jest.fn();
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

      const { getByLabelText } = render(<DevNavMenu />);
      fireEvent.press(getByLabelText("Open dev navigation menu"));
      fireEvent.press(getByLabelText("Reset user data"));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          "Failed to reset: Failed to reset",
        );
      });
    });

    it("shows resetting state", async () => {
      Object.defineProperty(Platform, "OS", {
        value: "web",
        configurable: true,
      });
      window.confirm = jest.fn(() => true);

      let resolvePromise: () => void;
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = () => resolve({ ok: true });
          }),
      );

      const { getByLabelText, getByText } = render(<DevNavMenu />);
      fireEvent.press(getByLabelText("Open dev navigation menu"));
      fireEvent.press(getByLabelText("Reset user data"));

      // Check resetting state
      await waitFor(() => {
        expect(getByText("Resetting...")).toBeTruthy();
        expect(getByLabelText("Resetting user data")).toBeTruthy();
      });

      // Resolve the promise to complete the reset
      resolvePromise!();
    });
  });

  describe("Stage Tree Structure", () => {
    it("shows correct substeps for Stage 3 (Musical Staff)", () => {
      const { getByLabelText, getByText } = render(<DevNavMenu />);
      fireEvent.press(getByLabelText("Open dev navigation menu"));
      fireEvent.press(getByLabelText("Stage 3: The Musical Staff"));

      expect(getByText(/a\) Staff intro/)).toBeTruthy();
      expect(getByText(/b\) Fun fact/)).toBeTruthy();
      expect(getByText(/c\) Ledger lines/)).toBeTruthy();
    });

    it("shows correct substeps for Stage 4 (What is a Note)", () => {
      const { getByLabelText, getByText } = render(<DevNavMenu />);
      fireEvent.press(getByLabelText("Open dev navigation menu"));
      fireEvent.press(getByLabelText("Stage 4: What is a Note?"));

      expect(getByText(/a\) Note head/)).toBeTruthy();
      expect(getByText(/b\) Note on line/)).toBeTruthy();
      expect(getByText(/c\) Note in space/)).toBeTruthy();
      expect(getByText(/d\) Explore pitch/)).toBeTruthy();
    });

    it("shows correct substeps for Stage 5 (Your Clef)", () => {
      const { getByLabelText, getByText } = render(<DevNavMenu />);
      fireEvent.press(getByLabelText("Open dev navigation menu"));
      fireEvent.press(getByLabelText("Stage 5: Your Clef"));

      expect(getByText(/a\) Clef intro/)).toBeTruthy();
      expect(getByText(/b\) Clef details/)).toBeTruthy();
    });

    it("shows correct substeps for Stage 6 (Sharps & Flats)", () => {
      const { getByLabelText, getByText } = render(<DevNavMenu />);
      fireEvent.press(getByLabelText("Open dev navigation menu"));
      fireEvent.press(getByLabelText("Stage 6: Sharps & Flats"));

      expect(getByText(/a\) Symbols/)).toBeTruthy();
      expect(getByText(/b\) Naturals default/)).toBeTruthy();
      expect(getByText(/c\) Try accidentals/)).toBeTruthy();
      expect(getByText(/d\) Combined explorer/)).toBeTruthy();
      expect(getByText(/e\) Your note/)).toBeTruthy();
    });
  });
});
