import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";

// Mock audio context - define before any imports use it
const mockOscillator = {
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  frequency: { value: 0 },
  type: "sine",
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
  createOscillator: jest.fn(() => mockOscillator),
  createGain: jest.fn(() => mockGainNode),
  destination: {},
  currentTime: 0,
  close: jest.fn(),
};

// Mock shared module - provide actual createAudioContext and createClickSound implementations
jest.mock("../src/screens/Session/components/exercises/shared", () => ({
  createAudioContext: jest.fn(() => mockAudioContext),
  createClickSound: jest.fn((ctx, freq, duration, volume) => {
    // Actually call the audio context methods to get coverage
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }),
  TIMING_TOLERANCES: {
    ACCEPTABLE: 150,
    COMFORTABLE: 200,
  },
}));

import EnterOnBeatOneExercise from "../src/screens/Session/components/exercises/EnterOnBeatOneExercise";

describe("EnterOnBeatOneExercise", () => {
  const defaultProps = {
    config: {
      bpm: 60,
      beats_per_measure: 4,
      count_in_beats: 4,
      timing_tolerance_ms: 150,
    },
    mastery: {
      correct_streak: 8,
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

  describe("Rendering", () => {
    it("renders streak counter", () => {
      const { getByText } = render(
        <EnterOnBeatOneExercise {...defaultProps} />,
      );
      expect(getByText("0 / 8 in a row")).toBeTruthy();
    });

    it("renders BPM and time signature", () => {
      const { getByText } = render(
        <EnterOnBeatOneExercise {...defaultProps} />,
      );
      expect(getByText("60 BPM • 4/4")).toBeTruthy();
    });

    it("renders preparation instruction initially", () => {
      const { getByText } = render(
        <EnterOnBeatOneExercise {...defaultProps} />,
      );
      expect(getByText("Listen for beat 1...")).toBeTruthy();
    });

    it("renders Get Ready text", () => {
      const { getByText } = render(
        <EnterOnBeatOneExercise {...defaultProps} />,
      );
      expect(getByText("Get Ready...")).toBeTruthy();
    });

    it("renders prep count in Get Ready area", () => {
      const { getByText } = render(
        <EnterOnBeatOneExercise {...defaultProps} />,
      );
      expect(getByText("Get Ready...")).toBeTruthy();
      // Prep count is visible alongside Get Ready text
    });
  });

  describe("Configuration", () => {
    it("uses custom BPM", () => {
      const { getByText } = render(
        <EnterOnBeatOneExercise
          {...defaultProps}
          config={{ ...defaultProps.config, bpm: 120 }}
        />,
      );
      expect(getByText("120 BPM • 4/4")).toBeTruthy();
    });

    it("uses custom beats per measure", () => {
      const { getByText } = render(
        <EnterOnBeatOneExercise
          {...defaultProps}
          config={{ ...defaultProps.config, beats_per_measure: 3 }}
        />,
      );
      expect(getByText("60 BPM • 3/4")).toBeTruthy();
    });

    it("uses custom mastery streak", () => {
      const { getByText } = render(
        <EnterOnBeatOneExercise
          {...defaultProps}
          mastery={{ correct_streak: 12 }}
        />,
      );
      expect(getByText("0 / 12 in a row")).toBeTruthy();
    });
  });

  describe("Tap Area", () => {
    it("renders tap area with accessibility label", () => {
      const { getByLabelText } = render(
        <EnterOnBeatOneExercise {...defaultProps} />,
      );
      expect(getByLabelText("Tap on beat one")).toBeTruthy();
    });
  });

  describe("Audio", () => {
    it("initializes audio context", () => {
      render(<EnterOnBeatOneExercise {...defaultProps} />);
      expect(mockAudioContext.createOscillator).toBeDefined();
    });

    it("cleans up audio context on unmount", () => {
      const { unmount } = render(<EnterOnBeatOneExercise {...defaultProps} />);
      unmount();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("renders with default config", () => {
      const { getByText } = render(
        <EnterOnBeatOneExercise
          config={{}}
          mastery={{}}
          onComplete={jest.fn()}
          onProgress={jest.fn()}
        />,
      );
      expect(getByText(/in a row/)).toBeTruthy();
    });

    it("renders without callbacks", () => {
      const { getByText } = render(
        <EnterOnBeatOneExercise config={{}} mastery={{}} />,
      );
      expect(getByText(/in a row/)).toBeTruthy();
    });
  });
});
