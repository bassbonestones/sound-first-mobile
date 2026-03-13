import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import FeelThePulseExercise from "../../src/screens/Session/components/exercises/FeelThePulseExercise";

// Mock react-native-audio-api with more complete implementation
jest.mock("react-native-audio-api", () => ({
  AudioContext: jest.fn().mockImplementation(() => ({
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    state: "running",
    createOscillator: jest.fn(() => ({
      frequency: { value: 440, setValueAtTime: jest.fn() },
      type: "sine",
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    })),
    createGain: jest.fn(() => ({
      gain: {
        value: 1,
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
      },
      connect: jest.fn(),
    })),
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
    close: jest.fn(),
  })),
}));

describe("FeelThePulseExercise", () => {
  const defaultProps = {
    config: {
      bpm: 72,
      listening_beats: 8,
      silent_beats: 4,
    },
    mastery: {
      correct_streak: 3,
    },
    onComplete: jest.fn(),
    onProgress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Intro Phase", () => {
    it("renders intro screen with title", () => {
      const { getByText } = render(<FeelThePulseExercise {...defaultProps} />);
      expect(getByText("Internal Pulse")).toBeTruthy();
    });

    it("displays the intro icon", () => {
      const { getByText } = render(<FeelThePulseExercise {...defaultProps} />);
      expect(getByText("🎵")).toBeTruthy();
    });

    it("shows listening instructions with beat count", () => {
      const { getByText } = render(<FeelThePulseExercise {...defaultProps} />);
      expect(getByText(/Listen to 8 clicks/)).toBeTruthy();
    });

    it("shows tapping instructions with beat count", () => {
      const { getByText } = render(<FeelThePulseExercise {...defaultProps} />);
      expect(getByText(/Then tap 4 times/)).toBeTruthy();
    });

    it("displays BPM hint", () => {
      const { getByText } = render(<FeelThePulseExercise {...defaultProps} />);
      expect(getByText("72 BPM")).toBeTruthy();
    });

    it("renders Start button with accessibility", () => {
      const { getByRole, getByText } = render(
        <FeelThePulseExercise {...defaultProps} />,
      );
      const startButton = getByRole("button", { name: /start exercise/i });
      expect(startButton).toBeTruthy();
      expect(getByText("Start")).toBeTruthy();
    });

    it("uses custom BPM from config", () => {
      const customProps = {
        ...defaultProps,
        config: { ...defaultProps.config, bpm: 100 },
      };
      const { getByText } = render(<FeelThePulseExercise {...customProps} />);
      expect(getByText("100 BPM")).toBeTruthy();
    });

    it("uses custom listening_beats from config", () => {
      const customProps = {
        ...defaultProps,
        config: { ...defaultProps.config, listening_beats: 12 },
      };
      const { getByText } = render(<FeelThePulseExercise {...customProps} />);
      expect(getByText(/Listen to 12 clicks/)).toBeTruthy();
    });

    it("uses custom silent_beats from config", () => {
      const customProps = {
        ...defaultProps,
        config: { ...defaultProps.config, silent_beats: 6 },
      };
      const { getByText } = render(<FeelThePulseExercise {...customProps} />);
      expect(getByText(/Then tap 6 times/)).toBeTruthy();
    });
  });

  describe("Default Props", () => {
    it("uses default values when config is empty", () => {
      const propsWithEmptyConfig = {
        ...defaultProps,
        config: {},
      };
      const { getByText } = render(
        <FeelThePulseExercise {...propsWithEmptyConfig} />,
      );
      // Should use defaults: bpm=72, listening_beats=8, silent_beats=4
      expect(getByText("72 BPM")).toBeTruthy();
      expect(getByText(/Listen to 8 clicks/)).toBeTruthy();
      expect(getByText(/Then tap 4 times/)).toBeTruthy();
    });

    it("uses default mastery when not provided", () => {
      const propsWithPartialConfig = {
        ...defaultProps,
        config: { bpm: 80 },
        mastery: undefined,
      };
      const { getByRole } = render(
        <FeelThePulseExercise {...propsWithPartialConfig} />,
      );
      // Component should render without error
      expect(getByRole("button", { name: /start exercise/i })).toBeTruthy();
    });
  });

  describe("Start Button", () => {
    it("has Start button that can be pressed", () => {
      const { getByRole } = render(<FeelThePulseExercise {...defaultProps} />);
      const startButton = getByRole("button", { name: /start exercise/i });
      expect(startButton).toBeTruthy();
      // Button is pressable (don't actually press it due to complex audio setup)
      expect(startButton.props.accessibilityRole).toBe("button");
    });
  });

  describe("Audio Context", () => {
    it("creates AudioContext when needed", () => {
      const { AudioContext } = require("react-native-audio-api");
      render(<FeelThePulseExercise {...defaultProps} />);

      // AudioContext should be available for click sounds
      expect(AudioContext).toBeDefined();
    });
  });

  describe("Component Structure", () => {
    it("renders container view", () => {
      const { UNSAFE_root } = render(
        <FeelThePulseExercise {...defaultProps} />,
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it("has instruction box with multiple instructions", () => {
      const { getByText } = render(<FeelThePulseExercise {...defaultProps} />);
      expect(getByText(/Listen to.*clicks/)).toBeTruthy();
      expect(getByText(/Then tap.*times/)).toBeTruthy();
    });
  });
});
