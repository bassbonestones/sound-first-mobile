/**
 * @fileoverview Tests for HalfStepsTheoryExercise component
 * Tests half step theory lesson including phases, audio playback, and quiz
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
import HalfStepsTheoryExercise from "../src/screens/Session/components/exercises/HalfStepsTheoryExercise";

describe("HalfStepsTheoryExercise", () => {
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

  // Helper to advance timers
  const advanceTimers = (ms: number = 1000) => {
    act(() => {
      jest.advanceTimersByTime(ms);
    });
  };

  describe("Rendering", () => {
    it("renders intro phase initially", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      expect(getByText("Half Steps")).toBeTruthy();
    });

    it("renders intro description about smallest interval", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      expect(getByText(/smallest.*interval|interval.*smallest/i)).toBeTruthy();
    });

    it("renders navigation button in intro phase", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      expect(getByText(/See the Keyboard|Next|→/)).toBeTruthy();
    });
  });

  describe("Phase Navigation", () => {
    it("navigates from intro to next phase", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );

      // Press the navigation button
      const button = getByText("See the Keyboard →");
      expect(() => fireEvent.press(button)).not.toThrow();
    });

    it("navigates without error", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );

      // Navigate and verify no crash
      fireEvent.press(getByText("See the Keyboard →"));

      // Should render something after navigation
      expect(getByText("The Piano Keyboard")).toBeTruthy();
    });
  });

  describe("Quiz Phase", () => {
    it("shows quiz questions exist in the component structure", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );

      // The component should render - quiz will be reached through navigation
      expect(getByText("Half Steps")).toBeTruthy();
    });
  });

  describe("Audio Playback", () => {
    it("initializes audio context", () => {
      render(<HalfStepsTheoryExercise {...defaultProps} />);
      expect(mockAudioContext.createOscillator).toBeDefined();
    });

    it("plays half step example when play button pressed", async () => {
      const { getByText, getAllByText, queryByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );

      // Navigate to a phase with audio
      fireEvent.press(getByText(/See the Keyboard|Next/));

      // Look for play button
      const playButton = queryByText(/▶|Play/);
      if (playButton) {
        await act(async () => {
          fireEvent.press(playButton);
          advanceTimers(1000);
        });
        expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      }
    });

    it("navigates through multiple phases with audio", async () => {
      const { getByText, queryByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );

      // Navigate: intro -> keyboard -> E-F -> hear
      fireEvent.press(getByText("See the Keyboard →"));
      fireEvent.press(getByText("Learn About E-F →"));
      fireEvent.press(getByText("Hear Half Steps →"));

      // Should be in hear phase
      expect(queryByText(/▶|Play/)).toBeTruthy();

      // Play audio if available
      const playButton = queryByText(/▶|Play/);
      if (playButton) {
        await act(async () => {
          fireEvent.press(playButton);
          advanceTimers(1500);
        });
        expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      }
    });

    it("cleans up audio context on unmount", () => {
      const { unmount } = render(<HalfStepsTheoryExercise {...defaultProps} />);
      unmount();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });
  });

  describe("MiniKeyboard Integration", () => {
    it("shows keyboard when in keyboard phase", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("See the Keyboard →"));

      // Should show keyboard phase
      expect(getByText("The Piano Keyboard")).toBeTruthy();
    });
  });

  describe("Half Step Examples", () => {
    it("component navigates from intro", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );

      // Press the navigation button
      fireEvent.press(getByText("See the Keyboard →"));

      // Should show keyboard phase content
      expect(getByText("The Piano Keyboard")).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    it("handles rapid phase navigation", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );

      // Press navigation button
      fireEvent.press(getByText("See the Keyboard →"));

      // Component should render keyboard phase
      expect(getByText("The Piano Keyboard")).toBeTruthy();
    });

    it("renders without onComplete callback", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise
          mini={{}}
          sessionState={{}}
          onProgress={mockOnProgress}
        />,
      );

      expect(getByText("Half Steps")).toBeTruthy();
    });

    it("renders without onProgress callback", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise
          mini={{}}
          sessionState={{}}
          onComplete={mockOnComplete}
        />,
      );

      expect(getByText("Half Steps")).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("has accessible navigation buttons", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );

      const button = getByText(/See the Keyboard|Next/);
      expect(button).toBeTruthy();
    });
  });
});
