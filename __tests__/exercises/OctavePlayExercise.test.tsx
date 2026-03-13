/**
 * Tests for OctavePlayExercise component
 *
 * Flow: intro → listen → play (pitch detection) → feedback → completion
 * - User hears a reference note then plays the octave
 * - Requires streak of correct octaves to complete
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

// Mock NotationDisplay
jest.mock("../../src/components/NotationDisplay", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: (props: any) => (
      <View testID="notation-display" {...props}>
        Mock NotationDisplay
      </View>
    ),
  };
});

// Mock VolumeBar
jest.mock("../../src/components/VolumeBar", () => {
  const { View } = require("react-native");
  return {
    CircularVolumeIndicator: (props: any) => (
      <View testID="volume-indicator" {...props}>
        Volume: {props.volume}
      </View>
    ),
  };
});

// Mock pitch detection hook
const mockStartListening = jest.fn();
const mockStopListening = jest.fn();
jest.mock("../../src/hooks/usePitchDetection", () => ({
  usePitchDetection: (options: any) => ({
    isListening: true,
    currentFrequency: 440,
    currentVolume: 0.5,
    start: mockStartListening,
    stop: mockStopListening,
  }),
}));

// Mock audio API
const mockAudioContext = {
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    type: "sine",
    frequency: { value: 440 },
    start: jest.fn(),
    stop: jest.fn(),
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: {
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
    },
  })),
  destination: {},
  currentTime: 0,
  close: jest.fn(),
};

jest.mock("react-native-audio-api", () => ({
  AudioContext: jest.fn(() => mockAudioContext),
}));

// Mock devLogger
jest.mock("../../src/utils/devLogger", () => ({
  devWarn: jest.fn(),
  devLog: jest.fn(),
}));

import OctavePlayExercise from "../../src/screens/Session/components/exercises/OctavePlayExercise";

describe("OctavePlayExercise", () => {
  const defaultProps = {
    mini: {
      config: { first_note: "C4" },
      mastery: { correct_streak: 4 },
    },
    sessionState: { first_note: "C4" },
    onComplete: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ============================================================
  // INTRO PHASE
  // ============================================================
  describe("Intro Phase", () => {
    it("renders intro phase on mount", () => {
      const { getByText } = render(<OctavePlayExercise {...defaultProps} />);

      expect(getByText("Play the Octave")).toBeTruthy();
      expect(getByText("Low & High Versions")).toBeTruthy();
    });

    it("shows first note in instructions", () => {
      const { getByText } = render(<OctavePlayExercise {...defaultProps} />);

      expect(getByText("C4")).toBeTruthy();
    });

    it("explains octave concept", () => {
      const { getByText } = render(<OctavePlayExercise {...defaultProps} />);

      expect(getByText(/octave higher/i)).toBeTruthy();
      expect(getByText(/8 notes away/i)).toBeTruthy();
    });

    it("has Let's Go button", () => {
      const { getByText } = render(<OctavePlayExercise {...defaultProps} />);

      expect(getByText("Let's Go →")).toBeTruthy();
    });

    it("navigates to listen phase when pressing Let's Go", () => {
      const { getByText, getByLabelText } = render(
        <OctavePlayExercise {...defaultProps} />,
      );

      fireEvent.press(getByLabelText("Let's go"));

      expect(getByText(/Listen to/i)).toBeTruthy();
    });
  });

  // ============================================================
  // LISTEN PHASE
  // ============================================================
  describe("Listen Phase", () => {
    const navigateToListen = (getByLabelText: any) => {
      fireEvent.press(getByLabelText("Let's go"));
    };

    it("shows streak progress", () => {
      const { getByText, getByLabelText } = render(
        <OctavePlayExercise {...defaultProps} />,
      );

      navigateToListen(getByLabelText);

      expect(getByText(/Streak: 0 \/ 4/i)).toBeTruthy();
    });

    it("shows direction instruction", () => {
      const { getByText, getByLabelText } = render(
        <OctavePlayExercise {...defaultProps} />,
      );

      navigateToListen(getByLabelText);

      // Should show either HIGHER or LOWER
      const hasDirection = getByText(/HIGHER/i) || getByText(/LOWER/i);
      expect(hasDirection).toBeTruthy();
    });

    it("has Play & Record button", () => {
      const { getByText, getByLabelText } = render(
        <OctavePlayExercise {...defaultProps} />,
      );

      navigateToListen(getByLabelText);

      expect(getByText("Play & Record")).toBeTruthy();
    });

    it("shows first note in listen instruction", () => {
      const { getByText, getByLabelText } = render(
        <OctavePlayExercise {...defaultProps} />,
      );

      navigateToListen(getByLabelText);

      expect(getByText(/Listen to/i)).toBeTruthy();
      expect(getByText("C4")).toBeTruthy();
    });
  });

  // ============================================================
  // PLAY PHASE (via Play & Record button)
  // ============================================================
  describe("Play Phase", () => {
    it("transitions to play phase after clicking Play & Record", async () => {
      const { getByText, getByLabelText, queryByText } = render(
        <OctavePlayExercise {...defaultProps} />,
      );

      // Navigate to listen
      fireEvent.press(getByLabelText("Let's go"));

      // Click Play & Record
      fireEvent.press(getByLabelText("Play and record"));

      // Wait for audio to finish playing (mock delay)
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should start listening
      await waitFor(() => {
        expect(mockStartListening).toHaveBeenCalled();
      });
    });

    it("shows listening indicator in play phase", async () => {
      const { getByTestId, getByLabelText } = render(
        <OctavePlayExercise {...defaultProps} />,
      );

      fireEvent.press(getByLabelText("Let's go"));
      fireEvent.press(getByLabelText("Play and record"));

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(getByTestId("volume-indicator")).toBeTruthy();
      });
    });

    it("has skip button in play phase", async () => {
      const { getByText, getByLabelText, queryByText } = render(
        <OctavePlayExercise {...defaultProps} />,
      );

      fireEvent.press(getByLabelText("Let's go"));
      fireEvent.press(getByLabelText("Play and record"));

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(queryByText("I can't find it")).toBeTruthy();
      });
    });
  });

  // ============================================================
  // SKIP FLOW
  // ============================================================
  describe("Skip Flow", () => {
    it("shows feedback when user skips", async () => {
      const { getByText, getByLabelText, queryByText } = render(
        <OctavePlayExercise {...defaultProps} />,
      );

      fireEvent.press(getByLabelText("Let's go"));
      fireEvent.press(getByLabelText("Play and record"));

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(queryByText("I can't find it")).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Skip, I can't find it"));

      // Should show feedback
      await waitFor(() => {
        expect(queryByText("Keep trying!")).toBeTruthy();
      });
    });

    it("resets streak when skipping", async () => {
      const { getByText, getByLabelText, queryByText } = render(
        <OctavePlayExercise {...defaultProps} />,
      );

      fireEvent.press(getByLabelText("Let's go"));
      fireEvent.press(getByLabelText("Play and record"));

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(queryByText("I can't find it")).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Skip, I can't find it"));

      // Feedback phase
      await waitFor(() => {
        expect(queryByText("Keep trying!")).toBeTruthy();
      });

      // Click Try Again
      fireEvent.press(getByLabelText("Try again"));

      // Should be back at listen phase with reset streak
      await waitFor(() => {
        expect(getByText(/Streak: 0/i)).toBeTruthy();
      });
    });
  });

  // ============================================================
  // FEEDBACK PHASE
  // ============================================================
  describe("Feedback Phase", () => {
    it("shows appropriate button in feedback", async () => {
      const { getByText, getByLabelText, queryByText } = render(
        <OctavePlayExercise {...defaultProps} />,
      );

      fireEvent.press(getByLabelText("Let's go"));
      fireEvent.press(getByLabelText("Play and record"));

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(queryByText("I can't find it")).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Skip, I can't find it"));

      await waitFor(() => {
        expect(queryByText("Try Again →")).toBeTruthy();
      });
    });
  });

  // ============================================================
  // CUSTOM FIRST NOTE
  // ============================================================
  describe("Custom First Note", () => {
    it("uses first_note from session state", () => {
      const { getByText } = render(
        <OctavePlayExercise
          {...defaultProps}
          sessionState={{ first_note: "G4" }}
        />,
      );

      expect(getByText("G4")).toBeTruthy();
    });

    it("uses first_note from config as fallback", () => {
      const { getByText } = render(
        <OctavePlayExercise
          mini={{
            config: { first_note: "A4" },
            mastery: { correct_streak: 4 },
          }}
          sessionState={{}}
          onComplete={jest.fn()}
        />,
      );

      expect(getByText("A4")).toBeTruthy();
    });

    it("defaults to C4 if no first_note specified", () => {
      const { getByText } = render(
        <OctavePlayExercise
          mini={{ config: {}, mastery: { correct_streak: 4 } }}
          sessionState={{}}
          onComplete={jest.fn()}
        />,
      );

      expect(getByText("C4")).toBeTruthy();
    });
  });

  // ============================================================
  // CUSTOM STREAK REQUIREMENT
  // ============================================================
  describe("Custom Streak Requirement", () => {
    it("uses correct_streak from mastery", () => {
      const { getByText, getByLabelText } = render(
        <OctavePlayExercise
          mini={{ config: {}, mastery: { correct_streak: 3 } }}
          sessionState={{}}
          onComplete={jest.fn()}
        />,
      );

      fireEvent.press(getByLabelText("Let's go"));

      expect(getByText(/Streak: 0 \/ 3/i)).toBeTruthy();
    });

    it("defaults to 4 if no correct_streak specified", () => {
      const { getByText, getByLabelText } = render(
        <OctavePlayExercise
          mini={{ config: {}, mastery: {} }}
          sessionState={{}}
          onComplete={jest.fn()}
        />,
      );

      fireEvent.press(getByLabelText("Let's go"));

      expect(getByText(/Streak: 0 \/ 4/i)).toBeTruthy();
    });
  });

  // ============================================================
  // ACCESSIBILITY
  // ============================================================
  describe("Accessibility", () => {
    it("has accessible Let's Go button", () => {
      const { getByLabelText } = render(
        <OctavePlayExercise {...defaultProps} />,
      );

      expect(getByLabelText("Let's go")).toBeTruthy();
    });

    it("has accessible Play and record button", () => {
      const { getByLabelText } = render(
        <OctavePlayExercise {...defaultProps} />,
      );

      fireEvent.press(getByLabelText("Let's go"));

      expect(getByLabelText("Play and record")).toBeTruthy();
    });

    it("has accessible skip button", async () => {
      const { getByLabelText, queryByText } = render(
        <OctavePlayExercise {...defaultProps} />,
      );

      fireEvent.press(getByLabelText("Let's go"));
      fireEvent.press(getByLabelText("Play and record"));

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(queryByText("I can't find it")).toBeTruthy();
      });

      expect(getByLabelText("Skip, I can't find it")).toBeTruthy();
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================
  describe("Edge Cases", () => {
    it("handles missing onComplete gracefully", () => {
      const { getByText } = render(
        <OctavePlayExercise
          mini={{ config: {}, mastery: {} }}
          sessionState={{}}
        />,
      );

      expect(getByText("Play the Octave")).toBeTruthy();
    });

    it("handles empty mini prop", () => {
      const { getByText } = render(
        <OctavePlayExercise
          mini={{}}
          sessionState={{}}
          onComplete={jest.fn()}
        />,
      );

      expect(getByText("Play the Octave")).toBeTruthy();
    });

    it("handles empty sessionState prop", () => {
      const { getByText } = render(
        <OctavePlayExercise
          mini={{
            config: { first_note: "C4" },
            mastery: { correct_streak: 4 },
          }}
          sessionState={{}}
          onComplete={jest.fn()}
        />,
      );

      expect(getByText("C4")).toBeTruthy();
    });
  });

  // ============================================================
  // AUDIO CONTEXT
  // ============================================================
  describe("Audio Context", () => {
    it("creates audio context when playing", async () => {
      const { getByLabelText } = render(
        <OctavePlayExercise {...defaultProps} />,
      );

      fireEvent.press(getByLabelText("Let's go"));
      fireEvent.press(getByLabelText("Play and record"));

      await waitFor(() => {
        expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      });
    });

    it("creates gain node for volume control", async () => {
      const { getByLabelText } = render(
        <OctavePlayExercise {...defaultProps} />,
      );

      fireEvent.press(getByLabelText("Let's go"));
      fireEvent.press(getByLabelText("Play and record"));

      await waitFor(() => {
        expect(mockAudioContext.createGain).toHaveBeenCalled();
      });
    });
  });
});
