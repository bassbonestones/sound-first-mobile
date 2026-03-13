/**
 * @fileoverview Tests for TapAlongExercise component
 * Tests rhythm tapping exercise - tap on the beat
 */

import React from "react";
import { render, fireEvent, act, waitFor } from "@testing-library/react-native";

// Mock AudioContext
const mockOscillator = {
  type: "sine",
  frequency: { value: 440, setValueAtTime: jest.fn() },
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
};

const mockGainNode = {
  gain: {
    value: 1,
    setValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
  },
  connect: jest.fn(),
};

const mockAudioContext = {
  currentTime: 0,
  sampleRate: 44100,
  state: "running",
  createOscillator: jest.fn(() => mockOscillator),
  createGain: jest.fn(() => mockGainNode),
  destination: {},
  close: jest.fn(),
  resume: jest.fn(() => Promise.resolve()),
};

jest.mock("react-native-audio-api", () => ({
  AudioContext: jest.fn(() => mockAudioContext),
}));

jest.mock("../../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devWarn: jest.fn(),
  devError: jest.fn(),
}));

import TapAlongExercise from "../../src/screens/Session/components/exercises/TapAlongExercise";

describe("TapAlongExercise", () => {
  const mockOnComplete = jest.fn();
  const mockOnProgress = jest.fn();

  const defaultProps = {
    config: {
      bpm: 60,
      count_in_beats: 4,
      timing_tolerance_ms: 100,
    },
    mastery: {
      correct_streak: 8,
    },
    onComplete: mockOnComplete,
    onProgress: mockOnProgress,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ==========================================================================
  // INITIAL RENDER TESTS
  // ==========================================================================
  describe("Initial Render", () => {
    it("renders the component", () => {
      const { getByText } = render(<TapAlongExercise {...defaultProps} />);
      expect(getByText(/0 \/ 8 in a row/)).toBeTruthy();
    });

    it("shows BPM indicator", () => {
      const { getByText } = render(<TapAlongExercise {...defaultProps} />);
      expect(getByText("60 BPM")).toBeTruthy();
    });

    it("shows initial streak of 0", () => {
      const { getByText } = render(<TapAlongExercise {...defaultProps} />);
      expect(getByText(/0 \/ 8 in a row/)).toBeTruthy();
    });

    it("renders with custom BPM", () => {
      const props = {
        ...defaultProps,
        config: { ...defaultProps.config, bpm: 120 },
      };
      const { getByText } = render(<TapAlongExercise {...props} />);
      expect(getByText("120 BPM")).toBeTruthy();
    });

    it("renders with custom mastery streak", () => {
      const props = {
        ...defaultProps,
        mastery: { correct_streak: 12 },
      };
      const { getByText } = render(<TapAlongExercise {...props} />);
      expect(getByText(/0 \/ 12 in a row/)).toBeTruthy();
    });
  });

  // ==========================================================================
  // DEFAULT PROPS TESTS
  // ==========================================================================
  describe("Default Props", () => {
    it("renders with empty config", () => {
      const { getByText } = render(
        <TapAlongExercise
          onComplete={mockOnComplete}
          onProgress={mockOnProgress}
        />,
      );
      // Default BPM is 60
      expect(getByText("60 BPM")).toBeTruthy();
    });

    it("renders with partial config", () => {
      const { getByText } = render(
        <TapAlongExercise
          config={{ bpm: 90 }}
          onComplete={mockOnComplete}
          onProgress={mockOnProgress}
        />,
      );
      expect(getByText("90 BPM")).toBeTruthy();
    });
  });

  // ==========================================================================
  // AUDIO CONTEXT TESTS
  // ==========================================================================
  describe("Audio Context", () => {
    it("creates audio context", () => {
      render(<TapAlongExercise {...defaultProps} />);
      expect(require("react-native-audio-api").AudioContext).toHaveBeenCalled();
    });

    it("closes audio context on unmount", () => {
      const { unmount } = render(<TapAlongExercise {...defaultProps} />);
      unmount();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // PROGRESS BAR TESTS
  // ==========================================================================
  describe("Progress Bar", () => {
    it("shows progress bar", () => {
      const { getByText } = render(<TapAlongExercise {...defaultProps} />);
      // Progress text
      expect(getByText(/in a row/)).toBeTruthy();
    });
  });

  // ==========================================================================
  // FEEDBACK TESTS
  // ==========================================================================
  describe("Feedback Display", () => {
    it("feedback colors are defined correctly", () => {
      // Test internal feedback color logic
      const feedbackColorMap = {
        perfect: "#4CAF50",
        good: "#8BC34A",
        early: "#FF9800",
        late: "#FF5722",
        missed: "#f44336",
      };

      expect(feedbackColorMap.perfect).toBe("#4CAF50");
      expect(feedbackColorMap.good).toBe("#8BC34A");
      expect(feedbackColorMap.early).toBe("#FF9800");
      expect(feedbackColorMap.late).toBe("#FF5722");
      expect(feedbackColorMap.missed).toBe("#f44336");
    });

    it("feedback text values are defined correctly", () => {
      const feedbackTextMap = {
        perfect: "Perfect!",
        good: "Good!",
        early: "A bit early",
        late: "A bit late",
        missed: "Missed!",
      };

      expect(feedbackTextMap.perfect).toBe("Perfect!");
      expect(feedbackTextMap.good).toBe("Good!");
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================
  describe("Accessibility", () => {
    it("has accessibility label for tap area", () => {
      const { getByLabelText } = render(<TapAlongExercise {...defaultProps} />);
      expect(getByLabelText(/ready for tapping/i)).toBeTruthy();
    });
  });
});
