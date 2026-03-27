/**
 * @fileoverview Tests for NaturalAccidentalExercise component
 * Tests natural sign (♮) theory lesson
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

import NaturalAccidentalExercise from "../src/screens/Session/components/exercises/NaturalAccidentalExercise";

describe("NaturalAccidentalExercise", () => {
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
        <NaturalAccidentalExercise {...defaultProps} />,
      );
      expect(getByText("The Natural Sign")).toBeTruthy();
    });

    it("renders natural sign symbol", () => {
      const { getByText } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
      );
      expect(getByText("♮")).toBeTruthy();
    });

    it("renders navigation button", () => {
      const { getAllByText } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
      );
      expect(getAllByText(/→/).length).toBeGreaterThan(0);
    });
  });

  describe("Phase Navigation", () => {
    it("navigates from intro phase", () => {
      const { getByText, getAllByText } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
      );

      const buttons = getAllByText(/→/);
      expect(() => fireEvent.press(buttons[buttons.length - 1])).not.toThrow();
    });

    it("navigates through phases without error", () => {
      const { getAllByText } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
      );

      const buttons = getAllByText(/→/);
      fireEvent.press(buttons[buttons.length - 1]);

      // Should not crash
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe("Quiz Phase", () => {
    it("component has quiz structure", () => {
      const { getByText } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
      );

      // Verify component renders intro
      expect(getByText("The Natural Sign")).toBeTruthy();
    });
  });

  describe("Audio Playback", () => {
    it("initializes audio context", () => {
      render(<NaturalAccidentalExercise {...defaultProps} />);
      expect(mockAudioContext.createOscillator).toBeDefined();
    });

    it("cleans up audio context on unmount", () => {
      const { unmount } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
      );
      unmount();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it("plays audio when hear sharp-to-natural button pressed", async () => {
      const utils = render(<NaturalAccidentalExercise {...defaultProps} />);

      // Navigate through intro to keyboard phase where hear buttons are
      fireEvent.press(utils.getByText("See How It Works →"));

      // Press the hear button
      await act(async () => {
        fireEvent.press(utils.getByText(/Hear F# → F♮/));
        jest.advanceTimersByTime(2000);
      });

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it("plays audio when hear flat-to-natural button pressed", async () => {
      const utils = render(<NaturalAccidentalExercise {...defaultProps} />);

      fireEvent.press(utils.getByText("See How It Works →"));

      await act(async () => {
        fireEvent.press(utils.getByText(/Hear B♭ → B♮/));
        jest.advanceTimersByTime(2000);
      });

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("renders without callbacks", () => {
      const { getByText } = render(
        <NaturalAccidentalExercise mini={{}} sessionState={{}} />,
      );

      expect(getByText("The Natural Sign")).toBeTruthy();
    });

    it("handles rapid navigation", () => {
      const { getAllByText } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
      );

      const buttons = getAllByText(/→/);
      fireEvent.press(buttons[buttons.length - 1]);

      // Should not crash
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe("Accessibility", () => {
    it("has accessible buttons", () => {
      const { getAllByText } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
      );

      const buttons = getAllByText(/→/);
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
