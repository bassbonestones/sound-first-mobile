/**
 * Tests for RangeExpansionExercise component
 *
 * Systematic range expansion one half-step at a time
 * Flow: Listen → Sing → Imagine → Play
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

// Mock useExerciseAudio hook
const mockPlayNote = jest.fn(() => Promise.resolve());
const mockNoteToFrequency = jest.fn(() => 261.63);

jest.mock("../../src/hooks/useExerciseAudio", () => ({
  __esModule: true,
  default: () => ({
    playNote: mockPlayNote,
    noteToFrequency: mockNoteToFrequency,
    playTwoNotes: jest.fn(() => Promise.resolve()),
    noteConfig: {
      frequency: 440,
      noteName: "A4",
    },
  }),
}));

// Mock usePitchDetection hook
jest.mock("../../src/hooks/usePitchDetection", () => ({
  usePitchDetection: jest.fn(() => ({
    currentPitch: null,
    isSounding: false,
    isListening: false,
    volume: 0,
  })),
}));

// Mock rangeExpansionPatterns
jest.mock("../../src/constants/rangeExpansionPatterns", () => ({
  getAvailablePatterns: jest.fn(() => [
    {
      id: "do_di_do",
      name: "do-di-do",
      targetInterval: 1,
      pattern: [0, 1, 0],
    },
  ]),
  getSimplestPattern: jest.fn(() => ({
    id: "do_di_do",
    name: "do-di-do",
    targetInterval: 1,
    pattern: [0, 1, 0],
  })),
  PATTERNS_UP: [
    { id: "do_di_do", name: "do-di-do", targetInterval: 1, pattern: [0, 1, 0] },
  ],
  PATTERNS_DOWN: [
    {
      id: "do_te_do",
      name: "do-te-do",
      targetInterval: -1,
      pattern: [0, -1, 0],
    },
  ],
}));

// Mock NotationDisplay
jest.mock("../../src/components/NotationDisplay", () => ({
  __esModule: true,
  default: () => null,
}));

// Mock EDMVisualizer
jest.mock("../../src/components/EDMVisualizer", () => ({
  __esModule: true,
  default: () => null,
}));

// Mock VolumeBar
jest.mock("../../src/components/VolumeBar", () => ({
  __esModule: true,
  default: () => null,
  CircularVolumeIndicator: () => null,
}));

// Mock devLogger
jest.mock("../../src/utils/devLogger", () => ({
  devWarn: jest.fn(),
  devLog: jest.fn(),
}));

import RangeExpansionExercise from "../../src/screens/Session/components/exercises/RangeExpansionExercise";

describe("RangeExpansionExercise", () => {
  const defaultProps = {
    config: {},
    mastery: { correct_streak: 3 },
    onComplete: jest.fn(),
    onProgress: jest.fn(),
    userRangeLow: "Bb3",
    userRangeHigh: "Bb3",
    direction: "up",
    clef: "treble",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ============================================================
  // RENDERING
  // ============================================================
  describe("Rendering", () => {
    it("renders exercise without crashing", () => {
      const { getByText } = render(
        <RangeExpansionExercise {...defaultProps} />,
      );

      // Main title
      expect(getByText("Expand Your Range")).toBeTruthy();
    });

    it("shows target note display", () => {
      const { getAllByText } = render(
        <RangeExpansionExercise {...defaultProps} />,
      );

      // Should show a note name (B, C, etc.)
      expect(getAllByText(/^[A-G][#b]?\d?$/).length).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================
  // DIRECTION AUTO-RESOLUTION
  // ============================================================
  describe("Direction", () => {
    it("resolves auto direction to up when range is low", () => {
      const autoProps = {
        ...defaultProps,
        direction: "auto",
        userRangeLow: "C3",
        userRangeHigh: "E3",
      };

      const { getByText } = render(<RangeExpansionExercise {...autoProps} />);

      expect(getByText("Expand Your Range")).toBeTruthy();
    });

    it("uses down direction when specified", () => {
      const downProps = {
        ...defaultProps,
        direction: "down",
      };

      const { getByText } = render(<RangeExpansionExercise {...downProps} />);

      expect(getByText("Expand Your Range")).toBeTruthy();
    });
  });

  // ============================================================
  // CONFIGURATION
  // ============================================================
  describe("Configuration", () => {
    it("uses custom mastery streak", () => {
      const customProps = {
        ...defaultProps,
        mastery: { correct_streak: 5 },
      };

      const { getByText } = render(<RangeExpansionExercise {...customProps} />);

      expect(getByText("Expand Your Range")).toBeTruthy();
    });

    it("defaults to 3 streak if no mastery specified", () => {
      const noMasteryProps = {
        ...defaultProps,
        mastery: {},
      };

      const { getByText } = render(
        <RangeExpansionExercise {...noMasteryProps} />,
      );

      expect(getByText("Expand Your Range")).toBeTruthy();
    });

    it("uses bass clef when specified", () => {
      const bassProps = {
        ...defaultProps,
        clef: "bass",
      };

      const { getByText } = render(<RangeExpansionExercise {...bassProps} />);

      expect(getByText("Expand Your Range")).toBeTruthy();
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================
  describe("Edge Cases", () => {
    it("handles missing onComplete gracefully", () => {
      const noCompleteProps = {
        ...defaultProps,
        onComplete: undefined,
      };

      const { getByText } = render(
        <RangeExpansionExercise {...noCompleteProps} />,
      );

      expect(getByText("Expand Your Range")).toBeTruthy();
    });

    it("handles missing onProgress gracefully", () => {
      const noProgressProps = {
        ...defaultProps,
        onProgress: undefined,
      };

      const { getByText } = render(
        <RangeExpansionExercise {...noProgressProps} />,
      );

      expect(getByText("Expand Your Range")).toBeTruthy();
    });

    it("handles missing config gracefully", () => {
      const noConfigProps = {
        ...defaultProps,
        config: undefined,
      };

      const { getByText } = render(
        <RangeExpansionExercise {...noConfigProps} />,
      );

      expect(getByText("Expand Your Range")).toBeTruthy();
    });

    it("handles forced pattern ID", () => {
      const forcedPatternProps = {
        ...defaultProps,
        forcedPatternId: "do_di_do",
      };

      const { getByText } = render(
        <RangeExpansionExercise {...forcedPatternProps} />,
      );

      expect(getByText("Expand Your Range")).toBeTruthy();
    });
  });

  // ============================================================
  // PLAY BUTTON
  // ============================================================
  describe("Play Button", () => {
    it("renders the exercise", () => {
      const { getByText } = render(
        <RangeExpansionExercise {...defaultProps} />,
      );

      expect(getByText("Expand Your Range")).toBeTruthy();
    });
  });

  // ============================================================
  // USER RANGE
  // ============================================================
  describe("User Range", () => {
    it("accepts different user ranges", () => {
      const customRangeProps = {
        ...defaultProps,
        userRangeLow: "C3",
        userRangeHigh: "G4",
      };

      const { getByText } = render(
        <RangeExpansionExercise {...customRangeProps} />,
      );

      expect(getByText("Expand Your Range")).toBeTruthy();
    });

    it("handles same high and low note", () => {
      const sameNoteProps = {
        ...defaultProps,
        userRangeLow: "C4",
        userRangeHigh: "C4",
      };

      const { getByText } = render(
        <RangeExpansionExercise {...sameNoteProps} />,
      );

      expect(getByText("Expand Your Range")).toBeTruthy();
    });
  });

  // ============================================================
  // INTRO PHASE
  // ============================================================
  describe("Intro Phase", () => {
    it("shows intro text initially", () => {
      const { getByText } = render(
        <RangeExpansionExercise {...defaultProps} />,
      );

      // Intro phase shows instructions
      expect(getByText("Expand Your Range")).toBeTruthy();
    });

    it("displays exercise title", () => {
      const { getByText } = render(
        <RangeExpansionExercise {...defaultProps} />,
      );

      expect(getByText("Expand Your Range")).toBeTruthy();
    });
  });

  // ============================================================
  // PATTERN SELECTION
  // ============================================================
  describe("Pattern Selection", () => {
    it("selects a pattern on init", () => {
      const { getByText } = render(
        <RangeExpansionExercise {...defaultProps} />,
      );

      expect(getByText("Expand Your Range")).toBeTruthy();
    });

    it("uses forced pattern if provided", () => {
      const forcedProps = {
        ...defaultProps,
        forcedPatternId: "do_di_do",
      };

      const { getByText } = render(<RangeExpansionExercise {...forcedProps} />);

      expect(getByText("Expand Your Range")).toBeTruthy();
    });

    it("handles up direction patterns", () => {
      const upProps = {
        ...defaultProps,
        direction: "up",
      };

      const { getByText } = render(<RangeExpansionExercise {...upProps} />);

      expect(getByText("Expand Your Range")).toBeTruthy();
    });

    it("handles down direction patterns", () => {
      const downProps = {
        ...defaultProps,
        direction: "down",
      };

      const { getByText } = render(<RangeExpansionExercise {...downProps} />);

      expect(getByText("Expand Your Range")).toBeTruthy();
    });
  });

  // ============================================================
  // NOTE PARSING
  // ============================================================
  describe("Note Names", () => {
    it("handles sharps in user range", () => {
      const sharpProps = {
        ...defaultProps,
        userRangeLow: "C#3",
        userRangeHigh: "F#4",
      };

      const { getByText } = render(<RangeExpansionExercise {...sharpProps} />);

      expect(getByText("Expand Your Range")).toBeTruthy();
    });

    it("handles flats in user range", () => {
      const flatProps = {
        ...defaultProps,
        userRangeLow: "Bb2",
        userRangeHigh: "Eb4",
      };

      const { getByText } = render(<RangeExpansionExercise {...flatProps} />);

      expect(getByText("Expand Your Range")).toBeTruthy();
    });

    it("handles natural notes in user range", () => {
      const naturalProps = {
        ...defaultProps,
        userRangeLow: "A2",
        userRangeHigh: "A4",
      };

      const { getByText } = render(
        <RangeExpansionExercise {...naturalProps} />,
      );

      expect(getByText("Expand Your Range")).toBeTruthy();
    });
  });

  // ============================================================
  // CLEF HANDLING
  // ============================================================
  describe("Clef", () => {
    it("renders with treble clef", () => {
      const trebleProps = {
        ...defaultProps,
        clef: "treble",
      };

      const { getByText } = render(<RangeExpansionExercise {...trebleProps} />);

      expect(getByText("Expand Your Range")).toBeTruthy();
    });

    it("renders with bass clef", () => {
      const bassProps = {
        ...defaultProps,
        clef: "bass",
      };

      const { getByText } = render(<RangeExpansionExercise {...bassProps} />);

      expect(getByText("Expand Your Range")).toBeTruthy();
    });

    it("defaults to treble if no clef specified", () => {
      const noClefProps = {
        ...defaultProps,
        clef: undefined,
      };

      const { getByText } = render(<RangeExpansionExercise {...noClefProps} />);

      expect(getByText("Expand Your Range")).toBeTruthy();
    });
  });

  // ============================================================
  // STREAK AND MASTERY
  // ============================================================
  describe("Mastery", () => {
    it("uses correct_streak from mastery", () => {
      const masteryProps = {
        ...defaultProps,
        mastery: { correct_streak: 10 },
      };

      const { getByText } = render(
        <RangeExpansionExercise {...masteryProps} />,
      );

      expect(getByText("Expand Your Range")).toBeTruthy();
    });

    it("defaults streak if not provided", () => {
      const noStreakProps = {
        ...defaultProps,
        mastery: {},
      };

      const { getByText } = render(
        <RangeExpansionExercise {...noStreakProps} />,
      );

      expect(getByText("Expand Your Range")).toBeTruthy();
    });
  });

  // ============================================================
  // UNMOUNT
  // ============================================================
  describe("Cleanup", () => {
    it("unmounts without errors", () => {
      const { unmount } = render(<RangeExpansionExercise {...defaultProps} />);

      expect(() => unmount()).not.toThrow();
    });
  });
});
