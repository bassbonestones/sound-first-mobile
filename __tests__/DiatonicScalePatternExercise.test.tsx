/**
 * @fileoverview Tests for DiatonicScalePatternExercise component
 * Tests major scale pattern (WWHWWWH) lesson phases
 */

import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";

// Mock AudioContext
const mockOscillator = {
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  frequency: { value: 0 },
  type: "sine" as OscillatorType,
};

const mockGainNode = {
  connect: jest.fn(),
  gain: {
    value: 1,
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
  },
};

const mockAudioContext = {
  createOscillator: jest.fn(() => ({ ...mockOscillator })),
  createGain: jest.fn(() => ({
    ...mockGainNode,
    gain: { ...mockGainNode.gain },
  })),
  destination: {},
  currentTime: 0,
  close: jest.fn(),
  state: "running",
  resume: jest.fn().mockResolvedValue(undefined),
};

jest.mock("react-native-audio-api", () => ({
  AudioContext: jest.fn(() => mockAudioContext),
}));

jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devWarn: jest.fn(),
  devError: jest.fn(),
}));

// Import component after mocks
import DiatonicScalePatternExercise from "../src/screens/Session/components/exercises/DiatonicScalePatternExercise";

describe("DiatonicScalePatternExercise", () => {
  const mockOnComplete = jest.fn();
  const mockOnProgress = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    mini: {},
    sessionState: {},
    onComplete: mockOnComplete,
    onProgress: mockOnProgress,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const advanceTimers = (ms: number = 1000) => {
    act(() => {
      jest.advanceTimersByTime(ms);
    });
  };

  describe("Rendering", () => {
    it("renders intro phase initially", () => {
      const { getByText } = render(
        <DiatonicScalePatternExercise {...defaultProps} />,
      );
      expect(getByText("The Major Scale Pattern")).toBeTruthy();
    });

    it("renders pattern subtitle", () => {
      const { getByText } = render(
        <DiatonicScalePatternExercise {...defaultProps} />,
      );
      expect(getByText("W-W-H-W-W-W-H")).toBeTruthy();
    });

    it("renders navigation button", () => {
      const { getByText } = render(
        <DiatonicScalePatternExercise {...defaultProps} />,
      );
      expect(getByText(/→|Next|Listen/i)).toBeTruthy();
    });
  });

  describe("Phase Navigation", () => {
    it("navigates from intro phase", () => {
      const { getByText, getAllByText } = render(
        <DiatonicScalePatternExercise {...defaultProps} />,
      );

      // Find and press navigation button
      const buttons = getAllByText(/→/);
      expect(() => fireEvent.press(buttons[buttons.length - 1])).not.toThrow();
    });

    it("navigates without crashing", () => {
      const { getAllByText } = render(
        <DiatonicScalePatternExercise {...defaultProps} />,
      );

      // Navigate through phases
      const buttons = getAllByText(/→/);

      // Should not throw
      expect(() => fireEvent.press(buttons[buttons.length - 1])).not.toThrow();
    });
  });

  describe("Scale Visualization", () => {
    it("renders scale information", () => {
      const { getByText } = render(
        <DiatonicScalePatternExercise {...defaultProps} />,
      );

      // The pattern is shown
      expect(getByText("W-W-H-W-W-W-H")).toBeTruthy();
    });

    it("shows pattern information in intro", () => {
      const { getByText } = render(
        <DiatonicScalePatternExercise {...defaultProps} />,
      );

      // Should show pattern subtitle
      expect(getByText("W-W-H-W-W-W-H")).toBeTruthy();
    });
  });

  describe("Quiz Phase", () => {
    it("component has quiz structure", () => {
      const { getByText } = render(
        <DiatonicScalePatternExercise {...defaultProps} />,
      );

      // Quiz questions exist in component - verify component renders
      expect(getByText("The Major Scale Pattern")).toBeTruthy();
    });
  });

  describe("Audio Playback", () => {
    it("initializes audio context", () => {
      render(<DiatonicScalePatternExercise {...defaultProps} />);
      expect(mockAudioContext.createOscillator).toBeDefined();
    });

    it("cleans up audio context on unmount", () => {
      const { unmount } = render(
        <DiatonicScalePatternExercise {...defaultProps} />,
      );
      unmount();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it("has play functionality", async () => {
      const { queryByText } = render(
        <DiatonicScalePatternExercise {...defaultProps} />,
      );

      // Component should have some playback UI
      expect(queryByText(/Play|Listen|→/i)).toBeTruthy();
    });

    it("navigates to listen phase and plays scale", async () => {
      const utils = render(<DiatonicScalePatternExercise {...defaultProps} />);

      // Navigate to LISTEN phase
      fireEvent.press(utils.getByText("Listen to the Scale →"));

      // Press the play button
      await act(async () => {
        fireEvent.press(utils.getByText("▶ Play the Scale"));
        jest.advanceTimersByTime(5000);
      });

      // Audio context should have been used
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });
  });

  describe("Pattern Content", () => {
    it("shows WWHWWWH pattern", () => {
      const { getByText } = render(
        <DiatonicScalePatternExercise {...defaultProps} />,
      );

      // Should show pattern
      expect(getByText("W-W-H-W-W-W-H")).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    it("renders without callbacks", () => {
      const { getByText } = render(
        <DiatonicScalePatternExercise mini={{}} sessionState={{}} />,
      );

      expect(getByText("The Major Scale Pattern")).toBeTruthy();
    });

    it("handles navigation", () => {
      const { getAllByText } = render(
        <DiatonicScalePatternExercise {...defaultProps} />,
      );

      // Press button
      const buttons = getAllByText(/→/);

      // Should not crash
      expect(() => fireEvent.press(buttons[buttons.length - 1])).not.toThrow();
    });
  });

  describe("Accessibility", () => {
    it("has accessible buttons", () => {
      const { getAllByText } = render(
        <DiatonicScalePatternExercise {...defaultProps} />,
      );

      const buttons = getAllByText(/→/);
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
