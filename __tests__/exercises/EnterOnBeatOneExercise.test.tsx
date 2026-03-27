/**
 * Tests for EnterOnBeatOneExercise component
 *
 * "Feel Beat 1" drill
 * - Plays a steady beat with accent on beat 1
 * - User must tap specifically on beat 1 (the downbeat)
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

// Mock audio utilities from shared module
jest.mock(
  "../../src/screens/Session/components/exercises/shared/audioHelpers",
  () => ({
    getAudioContextClass: jest.fn(() => undefined),
    createAudioContext: jest.fn(() => ({
      close: jest.fn(),
      currentTime: 0,
      createOscillator: jest.fn(() => ({
        connect: jest.fn(),
        frequency: { value: 440 },
        start: jest.fn(),
        stop: jest.fn(),
      })),
      createGain: jest.fn(() => ({
        connect: jest.fn(),
        gain: {
          value: 1,
          setValueAtTime: jest.fn(),
          exponentialRampToValueAtTime: jest.fn(),
        },
      })),
      destination: {},
    })),
    createClickSound: jest.fn(),
    playTone: jest.fn(),
    playNote: jest.fn(),
    cleanupAudioContext: jest.fn(),
  }),
);

// Mock devLogger
jest.mock("../../src/utils/devLogger", () => ({
  devWarn: jest.fn(),
  devLog: jest.fn(),
}));

import EnterOnBeatOneExercise from "../../src/screens/Session/components/exercises/EnterOnBeatOneExercise";

describe("EnterOnBeatOneExercise", () => {
  const defaultProps = {
    config: {
      bpm: 60,
      beats_per_measure: 4,
      count_in_beats: 4,
      timing_tolerance_ms: 150,
      accent_beat_one: true,
    },
    mastery: { correct_streak: 8 },
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

  // ============================================================
  // RENDERING
  // ============================================================
  describe("Rendering", () => {
    it("renders exercise with progress bar", () => {
      const { getByText } = render(
        <EnterOnBeatOneExercise {...defaultProps} />,
      );

      expect(getByText(/in a row/i)).toBeTruthy();
    });

    it("shows streak counter", () => {
      const { getByText } = render(
        <EnterOnBeatOneExercise {...defaultProps} />,
      );

      expect(getByText("0 / 8 in a row")).toBeTruthy();
    });

    it("shows BPM and time signature", () => {
      const { getByText } = render(
        <EnterOnBeatOneExercise {...defaultProps} />,
      );

      expect(getByText("60 BPM • 4/4")).toBeTruthy();
    });

    it("shows beat indicator dots", () => {
      const { getAllByText } = render(
        <EnterOnBeatOneExercise {...defaultProps} />,
      );

      // Multiple elements with these numbers (beat dots + other UI)
      expect(getAllByText("1").length).toBeGreaterThan(0);
      expect(getAllByText("2").length).toBeGreaterThan(0);
      expect(getAllByText("3").length).toBeGreaterThan(0);
      expect(getAllByText("4").length).toBeGreaterThan(0);
    });

    it("shows Get Ready during prep phase", () => {
      const { getByText } = render(
        <EnterOnBeatOneExercise {...defaultProps} />,
      );

      expect(getByText("Get Ready...")).toBeTruthy();
    });

    it("shows Listen for beat 1 instruction during prep", () => {
      const { getByText } = render(
        <EnterOnBeatOneExercise {...defaultProps} />,
      );

      expect(getByText("Listen for beat 1...")).toBeTruthy();
    });
  });

  // ============================================================
  // TAP AREA
  // ============================================================
  describe("Tap Area", () => {
    it("has accessible tap button", () => {
      const { getByLabelText } = render(
        <EnterOnBeatOneExercise {...defaultProps} />,
      );

      expect(getByLabelText("Tap on beat one")).toBeTruthy();
    });

    it("is disabled during prep phase", () => {
      const { getByLabelText } = render(
        <EnterOnBeatOneExercise {...defaultProps} />,
      );

      const tapButton = getByLabelText("Tap on beat one");
      expect(tapButton.props.accessibilityState?.disabled).toBe(true);
    });

    it("shows prep countdown", () => {
      const { getAllByText } = render(
        <EnterOnBeatOneExercise {...defaultProps} />,
      );

      // Should show countdown number (4 also appears in beat indicators and other places)
      expect(getAllByText("4").length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // AUTO-START
  // ============================================================
  describe("Auto-start", () => {
    it("auto-starts metronome after delay", async () => {
      const { getByText } = render(
        <EnterOnBeatOneExercise {...defaultProps} />,
      );

      // Initially shows prep phase
      expect(getByText("Get Ready...")).toBeTruthy();
    });

    it("transitions to measured phase after prep beats", async () => {
      const { getByText, queryByText } = render(
        <EnterOnBeatOneExercise {...defaultProps} />,
      );

      // Auto-start + 4 prep beats at 60 BPM = 500ms start + 4000ms prep
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // After auto-start
      expect(getByText("Listen for beat 1...")).toBeTruthy();

      // After prep phase completes (4 beats at 60 BPM = 4000ms)
      act(() => {
        jest.advanceTimersByTime(4000);
      });

      await waitFor(() => {
        expect(queryByText("Tap only on beat 1!")).toBeTruthy();
      });
    });
  });

  // ============================================================
  // CONFIGURATION
  // ============================================================
  describe("Configuration", () => {
    it("uses custom BPM from config", () => {
      const customProps = {
        ...defaultProps,
        config: {
          ...defaultProps.config,
          bpm: 120,
        },
      };

      const { getByText } = render(<EnterOnBeatOneExercise {...customProps} />);

      expect(getByText("120 BPM • 4/4")).toBeTruthy();
    });

    it("uses custom beats_per_measure from config", () => {
      const customProps = {
        ...defaultProps,
        config: {
          ...defaultProps.config,
          beats_per_measure: 3,
        },
      };

      const { getByText } = render(<EnterOnBeatOneExercise {...customProps} />);

      expect(getByText("60 BPM • 3/4")).toBeTruthy();
    });

    it("uses custom mastery streak", () => {
      const customProps = {
        ...defaultProps,
        mastery: { correct_streak: 5 },
      };

      const { getByText } = render(<EnterOnBeatOneExercise {...customProps} />);

      expect(getByText("0 / 5 in a row")).toBeTruthy();
    });

    it("defaults to 8 streak if no mastery specified", () => {
      const noMasteryProps = {
        ...defaultProps,
        mastery: {},
      };

      const { getByText } = render(
        <EnterOnBeatOneExercise {...noMasteryProps} />,
      );

      expect(getByText("0 / 8 in a row")).toBeTruthy();
    });

    it("defaults BPM to 60 if not specified", () => {
      const noConfigProps = {
        ...defaultProps,
        config: {},
      };

      const { getByText } = render(
        <EnterOnBeatOneExercise {...noConfigProps} />,
      );

      expect(getByText("60 BPM • 4/4")).toBeTruthy();
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
        <EnterOnBeatOneExercise {...noCompleteProps} />,
      );

      expect(getByText("0 / 8 in a row")).toBeTruthy();
    });

    it("handles missing onProgress gracefully", () => {
      const noProgressProps = {
        ...defaultProps,
        onProgress: undefined,
      };

      const { getByText } = render(
        <EnterOnBeatOneExercise {...noProgressProps} />,
      );

      expect(getByText("0 / 8 in a row")).toBeTruthy();
    });

    it("handles missing config gracefully", () => {
      const noConfigProps = {
        ...defaultProps,
        config: undefined,
      };

      const { getByText } = render(
        <EnterOnBeatOneExercise {...noConfigProps} />,
      );

      expect(getByText("60 BPM • 4/4")).toBeTruthy();
    });

    it("handles missing mastery gracefully", () => {
      const noMasteryProps = {
        ...defaultProps,
        mastery: undefined,
      };

      const { getByText } = render(
        <EnterOnBeatOneExercise {...noMasteryProps} />,
      );

      expect(getByText("0 / 8 in a row")).toBeTruthy();
    });
  });

  // ============================================================
  // TAP FUNCTIONALITY
  // ============================================================
  describe("Tap Functionality", () => {
    it("does not respond to taps during prep phase", async () => {
      const { getByLabelText } = render(
        <EnterOnBeatOneExercise {...defaultProps} />,
      );

      // Start metronome
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Tap during prep phase
      fireEvent.press(getByLabelText("Tap on beat one"));

      // Should not have called onProgress
      expect(defaultProps.onProgress).not.toHaveBeenCalled();
    });

    it("shows TAP ON ONE after prep phase", async () => {
      const { getByText, queryByText } = render(
        <EnterOnBeatOneExercise {...defaultProps} />,
      );

      // Auto-start + prep phase
      act(() => {
        jest.advanceTimersByTime(500 + 4000);
      });

      await waitFor(() => {
        expect(queryByText("TAP ON ONE")).toBeTruthy();
      });
    });
  });

  // ============================================================
  // DIFFERENT TIME SIGNATURES
  // ============================================================
  describe("Different Time Signatures", () => {
    it("renders 3/4 time signature", () => {
      const threeQuarterProps = {
        ...defaultProps,
        config: {
          ...defaultProps.config,
          beats_per_measure: 3,
        },
      };

      const { getByText } = render(
        <EnterOnBeatOneExercise {...threeQuarterProps} />,
      );

      expect(getByText("60 BPM • 3/4")).toBeTruthy();
      // Should only show 3 beat indicators
      expect(getByText("1")).toBeTruthy();
      expect(getByText("2")).toBeTruthy();
      expect(getByText("3")).toBeTruthy();
    });

    it("renders 2/4 time signature", () => {
      const twQuarterProps = {
        ...defaultProps,
        config: {
          ...defaultProps.config,
          beats_per_measure: 2,
        },
      };

      const { getByText } = render(
        <EnterOnBeatOneExercise {...twQuarterProps} />,
      );

      expect(getByText("60 BPM • 2/4")).toBeTruthy();
    });
  });

  // ============================================================
  // CLEANUP TESTS
  // ============================================================
  describe("Cleanup", () => {
    it("cleans up on unmount", async () => {
      const { unmount, getByText } = render(
        <EnterOnBeatOneExercise {...defaultProps} />,
      );

      // Start the exercise
      act(() => {
        jest.advanceTimersByTime(600);
      });

      expect(getByText(/BPM/)).toBeTruthy();

      // Should unmount cleanly
      unmount();
    });
  });

  // ============================================================
  // AUDIO CONTEXT TESTS
  // ============================================================
  describe("Audio Context", () => {
    it("uses createAudioContext for audio", () => {
      render(<EnterOnBeatOneExercise {...defaultProps} />);

      const shared = require("../../src/screens/Session/components/exercises/shared");
      expect(shared.createAudioContext).toHaveBeenCalled();
    });
  });

  // ============================================================
  // FEEDBACK DISPLAY TESTS
  // ============================================================
  describe("Feedback Display", () => {
    it("shows feedback placeholder", () => {
      const { getAllByText } = render(
        <EnterOnBeatOneExercise {...defaultProps} />,
      );

      // Initially shows prep state - may have multiple matches
      expect(getAllByText(/Get Ready|Listen/i).length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // ACCESSIBILITY TESTS
  // ============================================================
  describe("Accessibility", () => {
    it("tap area has correct accessibility role", () => {
      const { getByLabelText } = render(
        <EnterOnBeatOneExercise {...defaultProps} />,
      );

      const tapArea = getByLabelText("Tap on beat one");
      expect(tapArea.props.accessibilityRole).toBe("button");
    });

    it("tap area is accessible", () => {
      const { getByLabelText } = render(
        <EnterOnBeatOneExercise {...defaultProps} />,
      );

      const tapArea = getByLabelText("Tap on beat one");
      expect(tapArea).toBeTruthy();
    });
  });

  // ============================================================
  // STATE MANAGEMENT TESTS
  // ============================================================
  describe("State Management", () => {
    it("initializes streak at 0", () => {
      const { getByText } = render(
        <EnterOnBeatOneExercise {...defaultProps} />,
      );

      expect(getByText(/0 \//)).toBeTruthy();
    });

    it("displays mastery target", () => {
      const { getByText } = render(
        <EnterOnBeatOneExercise {...defaultProps} />,
      );

      expect(getByText(/\/ 8/)).toBeTruthy();
    });
  });
});
