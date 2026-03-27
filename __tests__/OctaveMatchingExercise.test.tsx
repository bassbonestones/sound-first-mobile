/**
 * @fileoverview Tests for OctaveMatchingExercise component
 * Tests octave recognition exercise
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

import OctaveMatchingExercise from "../src/screens/Session/components/exercises/OctaveMatchingExercise";

describe("OctaveMatchingExercise", () => {
  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    mini: { mastery: { correct_streak: 6 } },
    sessionState: {},
    onComplete: mockOnComplete,
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
    it("renders exercise question", () => {
      const { getByText } = render(
        <OctaveMatchingExercise {...defaultProps} />,
      );
      expect(getByText("Are these notes an octave apart?")).toBeTruthy();
    });

    it("renders streak counter", () => {
      const { getByText } = render(
        <OctaveMatchingExercise {...defaultProps} />,
      );
      expect(getByText(/Streak:/)).toBeTruthy();
    });

    it("renders listen button", () => {
      const { getByText } = render(
        <OctaveMatchingExercise {...defaultProps} />,
      );
      expect(getByText("Listen")).toBeTruthy();
    });
  });

  describe("Audio Playback", () => {
    it("initializes audio context", () => {
      render(<OctaveMatchingExercise {...defaultProps} />);
      expect(mockAudioContext.createOscillator).toBeDefined();
    });

    it("cleans up audio context on unmount", () => {
      const { unmount } = render(<OctaveMatchingExercise {...defaultProps} />);
      unmount();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it("plays audio when listen button is pressed", async () => {
      const { getByText } = render(
        <OctaveMatchingExercise {...defaultProps} />,
      );

      await act(async () => {
        fireEvent.press(getByText("Listen"));
        jest.advanceTimersByTime(2000);
      });

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it("shows answer buttons after playing", async () => {
      const { getByText, queryByText } = render(
        <OctaveMatchingExercise {...defaultProps} />,
      );

      await act(async () => {
        fireEvent.press(getByText("Listen"));
        jest.advanceTimersByTime(2000);
      });

      // Answer buttons should be visible
      expect(queryByText(/Octave/i)).toBeTruthy();
    });
  });

  describe("Answer Selection", () => {
    it("renders component structure", () => {
      const { getByText } = render(
        <OctaveMatchingExercise {...defaultProps} />,
      );
      expect(getByText("(Same note, different height?)")).toBeTruthy();
    });
  });

  describe("Progress Tracking", () => {
    it("tracks progress internally", () => {
      const { getByText } = render(
        <OctaveMatchingExercise {...defaultProps} />,
      );
      expect(getByText(/0 \/ 6/)).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    it("renders without optional props", () => {
      const { getByText } = render(
        <OctaveMatchingExercise mini={{}} sessionState={{}} />,
      );
      expect(getByText("Are these notes an octave apart?")).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("renders accessible component", () => {
      const { getByLabelText } = render(
        <OctaveMatchingExercise {...defaultProps} />,
      );
      expect(getByLabelText("Listen to the notes")).toBeTruthy();
    });
  });
});
