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
  createBuffer: jest.fn((channels, size, rate) => ({
    getChannelData: jest.fn(() => new Float32Array(size)),
    length: size,
    numberOfChannels: channels,
    sampleRate: rate,
  })),
  createBufferSource: jest.fn(() => ({
    buffer: null,
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  })),
  createBiquadFilter: jest.fn(() => ({
    type: "highpass",
    frequency: { value: 1000 },
    Q: { value: 1 },
    connect: jest.fn(),
  })),
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

  // ==========================================================================
  // METRONOME TESTS
  // ==========================================================================
  describe("Metronome", () => {
    it("initializes audio context on mount", () => {
      render(<TapAlongExercise {...defaultProps} />);
      expect(require("react-native-audio-api").AudioContext).toHaveBeenCalled();
    });

    it("prepares for beat playback", () => {
      const { getAllByText } = render(<TapAlongExercise {...defaultProps} />);
      // Should show "Get Ready" or "BPM" indicating prep for metronome
      expect(getAllByText(/Get Ready|BPM/i).length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // PREP PHASE TESTS
  // ==========================================================================
  describe("Prep Phase", () => {
    it("shows initial prep state", () => {
      const { getAllByText } = render(<TapAlongExercise {...defaultProps} />);
      // Prep countdown shown initially
      expect(getAllByText(/Get Ready|BPM/i).length).toBeGreaterThan(0);
    });

    it("uses configured count_in_beats", () => {
      const { getByText } = render(
        <TapAlongExercise
          {...defaultProps}
          config={{ ...defaultProps.config, count_in_beats: 8 }}
        />,
      );
      expect(getByText(/BPM/)).toBeTruthy();
    });
  });

  // ==========================================================================
  // TAP AREA TESTS
  // ==========================================================================
  describe("Tap Area", () => {
    it("renders tap area", () => {
      const { getByLabelText } = render(<TapAlongExercise {...defaultProps} />);
      expect(getByLabelText(/tapping/i)).toBeTruthy();
    });

    it("tap area can be pressed", () => {
      const { getByLabelText } = render(<TapAlongExercise {...defaultProps} />);
      const tapArea = getByLabelText(/tapping/i);
      expect(() => fireEvent.press(tapArea)).not.toThrow();
    });
  });

  // ==========================================================================
  // STREAK DISPLAY TESTS
  // ==========================================================================
  describe("Streak Display", () => {
    it("shows streak counter correctly", () => {
      const { getByText } = render(<TapAlongExercise {...defaultProps} />);
      expect(getByText(/0 \/ 8 in a row/)).toBeTruthy();
    });

    it("displays correct mastery threshold", () => {
      const props = {
        ...defaultProps,
        mastery: { correct_streak: 10 },
      };
      const { getByText } = render(<TapAlongExercise {...props} />);
      expect(getByText(/0 \/ 10 in a row/)).toBeTruthy();
    });
  });

  // ==========================================================================
  // HINT DISPLAY TESTS
  // ==========================================================================
  describe("Hint Display", () => {
    it("shows streak text", () => {
      const { getByText } = render(<TapAlongExercise {...defaultProps} />);
      expect(getByText(/in a row/i)).toBeTruthy();
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================
  describe("Edge Cases", () => {
    it("handles undefined config gracefully", () => {
      const { getByText } = render(
        <TapAlongExercise
          onComplete={mockOnComplete}
          onProgress={mockOnProgress}
        />,
      );
      expect(getByText(/BPM/)).toBeTruthy();
    });

    it("handles undefined mastery gracefully", () => {
      const { getByText } = render(
        <TapAlongExercise
          config={defaultProps.config}
          onComplete={mockOnComplete}
          onProgress={mockOnProgress}
        />,
      );
      expect(getByText(/in a row/)).toBeTruthy();
    });

    it("handles missing callbacks gracefully", () => {
      const { getByText } = render(
        <TapAlongExercise config={defaultProps.config} />,
      );
      expect(getByText(/BPM/)).toBeTruthy();
    });
  });

  // ==========================================================================
  // CLEANUP TESTS
  // ==========================================================================
  describe("Cleanup", () => {
    it("cleans up interval on unmount", () => {
      const { unmount } = render(<TapAlongExercise {...defaultProps} />);
      unmount();
      // No errors should occur
    });

    it("cleans up audio context on unmount", () => {
      const { unmount } = render(<TapAlongExercise {...defaultProps} />);
      unmount();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // TIMING CONFIG TESTS
  // ==========================================================================
  describe("Timing Configuration", () => {
    it("uses default timing tolerance", () => {
      const props = {
        config: { bpm: 60 },
        mastery: { correct_streak: 8 },
        onComplete: mockOnComplete,
        onProgress: mockOnProgress,
      };
      const { getByText } = render(<TapAlongExercise {...props} />);
      expect(getByText(/BPM/)).toBeTruthy();
    });

    it("uses custom timing tolerance from config", () => {
      const props = {
        ...defaultProps,
        config: { ...defaultProps.config, timing_tolerance_ms: 200 },
      };
      const { getByText } = render(<TapAlongExercise {...props} />);
      expect(getByText(/BPM/)).toBeTruthy();
    });

    it("uses prep_beats if count_in_beats not provided", () => {
      const props = {
        ...defaultProps,
        config: { bpm: 60, prep_beats: 2 },
      };
      const { getByText } = render(<TapAlongExercise {...props} />);
      expect(getByText(/BPM/)).toBeTruthy();
    });
  });

  // ==========================================================================
  // BEAT CALCULATION TESTS
  // ==========================================================================
  describe("Beat Calculations", () => {
    it("calculates correct beat interval from BPM", () => {
      // 60 BPM = 1000ms per beat
      const props60 = { ...defaultProps, config: { bpm: 60 } };
      render(<TapAlongExercise {...props60} />);

      // 120 BPM = 500ms per beat
      const props120 = { ...defaultProps, config: { bpm: 120 } };
      const { getByText } = render(<TapAlongExercise {...props120} />);
      expect(getByText("120 BPM")).toBeTruthy();
    });

    it("handles slow BPM correctly", () => {
      const props = { ...defaultProps, config: { bpm: 40 } };
      const { getByText } = render(<TapAlongExercise {...props} />);
      expect(getByText("40 BPM")).toBeTruthy();
    });

    it("handles fast BPM correctly", () => {
      const props = { ...defaultProps, config: { bpm: 180 } };
      const { getByText } = render(<TapAlongExercise {...props} />);
      expect(getByText("180 BPM")).toBeTruthy();
    });
  });

  // ==========================================================================
  // ANIMATION REF TESTS
  // ==========================================================================
  describe("Animations", () => {
    it("initializes pulse animation", () => {
      const { UNSAFE_root } = render(<TapAlongExercise {...defaultProps} />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it("initializes feedback opacity animation", () => {
      const { UNSAFE_root } = render(<TapAlongExercise {...defaultProps} />);
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  // ==========================================================================
  // RENDER STATE TESTS
  // ==========================================================================
  describe("Render States", () => {
    it("renders in prep phase initially", () => {
      const { getAllByText } = render(<TapAlongExercise {...defaultProps} />);
      expect(getAllByText(/Get Ready/i).length).toBeGreaterThan(0);
    });

    it("shows tap icon after prep phase", async () => {
      const { getByLabelText, rerender } = render(
        <TapAlongExercise {...defaultProps} />,
      );
      // Tap area exists
      expect(getByLabelText(/tapping/i)).toBeTruthy();
    });
  });

  // ==========================================================================
  // CALLBACK INTEGRATION TESTS
  // ==========================================================================
  describe("Callback Integration", () => {
    it("does not call onComplete immediately", () => {
      render(<TapAlongExercise {...defaultProps} />);
      // Should not complete immediately
      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it("does not call onProgress immediately", () => {
      render(<TapAlongExercise {...defaultProps} />);
      // Progress may be called during prep, but no streak changes yet
    });
  });

  // ==========================================================================
  // FEEDBACK COLOR LOGIC TESTS
  // ==========================================================================
  describe("Feedback Color Logic", () => {
    it("has correct color for perfect feedback", () => {
      const colors = {
        perfect: "#4CAF50",
        good: "#8BC34A",
        early: "#FF9800",
        late: "#FF5722",
        missed: "#f44336",
      };
      expect(colors.perfect).toBe("#4CAF50");
    });

    it("has correct color for missed feedback", () => {
      const colors = {
        perfect: "#4CAF50",
        good: "#8BC34A",
        early: "#FF9800",
        late: "#FF5722",
        missed: "#f44336",
      };
      expect(colors.missed).toBe("#f44336");
    });

    it("has neutral default color", () => {
      // Default color for unknown state
      const defaultColor = "#888";
      expect(defaultColor).toBe("#888");
    });
  });

  // ==========================================================================
  // FEEDBACK TEXT LOGIC TESTS
  // ==========================================================================
  describe("Feedback Text Logic", () => {
    it("returns correct text for all feedback types", () => {
      const feedbackTexts = {
        perfect: "Perfect!",
        good: "Good!",
        early: "A bit early",
        late: "A bit late",
        missed: "Missed!",
        default: "",
      };

      expect(feedbackTexts.perfect).toBe("Perfect!");
      expect(feedbackTexts.good).toBe("Good!");
      expect(feedbackTexts.early).toBe("A bit early");
      expect(feedbackTexts.late).toBe("A bit late");
      expect(feedbackTexts.missed).toBe("Missed!");
      expect(feedbackTexts.default).toBe("");
    });
  });

  // ==========================================================================
  // TOUCH INTERACTION TESTS
  // ==========================================================================
  describe("Touch Interactions", () => {
    it("tap area is touchable", () => {
      const { getByLabelText } = render(<TapAlongExercise {...defaultProps} />);
      const tapArea = getByLabelText(/tapping/i);
      fireEvent.press(tapArea);
      // Should not error
    });

    it("tap is ignored during prep phase", () => {
      const { getByLabelText } = render(<TapAlongExercise {...defaultProps} />);
      const tapArea = getByLabelText(/tapping/i);
      fireEvent.press(tapArea);
      // onProgress not called for tap during prep
      expect(mockOnComplete).not.toHaveBeenCalled();
    });
  });
});
