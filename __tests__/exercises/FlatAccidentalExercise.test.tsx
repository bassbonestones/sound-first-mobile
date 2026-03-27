/**
 * @fileoverview Tests for FlatAccidentalExercise component
 * Tests flat (♭) accidental teaching exercise
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

jest.mock(
  "../../src/screens/Session/components/exercises/shared/MiniKeyboard",
  () => {
    const { View, Text } = require("react-native");
    return function MockMiniKeyboard({
      highlightNotes,
      highlightFlat,
    }: {
      highlightNotes?: string[];
      highlightFlat?: string;
    }) {
      return (
        <View testID="mini-keyboard">
          <Text testID="highlighted-notes">
            {highlightNotes?.join(",") || "none"}
          </Text>
          <Text testID="highlight-flat">{highlightFlat || "none"}</Text>
        </View>
      );
    };
  },
);

import FlatAccidentalExercise from "../../src/screens/Session/components/exercises/FlatAccidentalExercise";

describe("FlatAccidentalExercise", () => {
  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    mini: {},
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

  // ==========================================================================
  // INTRO PHASE TESTS
  // ==========================================================================
  describe("Intro Phase", () => {
    it("renders intro phase by default", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      expect(getByText("The Flat ♭")).toBeTruthy();
    });

    it("displays subtitle", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      expect(getByText("Lowering Notes")).toBeTruthy();
    });

    it("displays educational content", () => {
      const { getAllByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      expect(getAllByText(/flat/i).length).toBeGreaterThan(0);
    });

    it("has button to proceed", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      expect(getByText("See It on Keyboard →")).toBeTruthy();
    });

    it("navigates to keyboard phase", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("See It on Keyboard →"));
      expect(getByText("D♭ on the Keyboard")).toBeTruthy();
    });
  });

  // ==========================================================================
  // KEYBOARD PHASE TESTS
  // ==========================================================================
  describe("Keyboard Phase", () => {
    const goToKeyboard = (getByText: Function) => {
      fireEvent.press(getByText("See It on Keyboard →"));
    };

    it("shows keyboard phase title", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      goToKeyboard(getByText);
      expect(getByText("D♭ on the Keyboard")).toBeTruthy();
    });

    it("shows MiniKeyboard component", () => {
      const { getByText, getByTestId } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      goToKeyboard(getByText);
      expect(getByTestId("mini-keyboard")).toBeTruthy();
    });

    it("has button to examples phase", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      goToKeyboard(getByText);
      expect(getByText("See More Examples →")).toBeTruthy();
    });
  });

  // ==========================================================================
  // EXAMPLES PHASE TESTS
  // ==========================================================================
  describe("Examples Phase", () => {
    const goToExamples = (getByText: Function) => {
      fireEvent.press(getByText("See It on Keyboard →"));
      fireEvent.press(getByText("See More Examples →"));
    };

    it("shows examples phase title", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      goToExamples(getByText);
      expect(getByText("More Flats")).toBeTruthy();
    });

    it("has button to hear it phase", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      goToExamples(getByText);
      expect(getByText("Hear the Difference →")).toBeTruthy();
    });
  });

  // ==========================================================================
  // HEAR IT PHASE TESTS
  // ==========================================================================
  describe("Hear It Phase", () => {
    const goToHearIt = (getByText: Function) => {
      fireEvent.press(getByText("See It on Keyboard →"));
      fireEvent.press(getByText("See More Examples →"));
      fireEvent.press(getByText("Hear the Difference →"));
    };

    it("shows hear it phase title", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      goToHearIt(getByText);
      expect(getByText("Hear the Flat")).toBeTruthy();
    });

    it("has play button", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      goToHearIt(getByText);
      expect(getByText("▶ Play")).toBeTruthy();
    });

    it("has button to quiz phase", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      goToHearIt(getByText);
      expect(getByText("Quiz Me →")).toBeTruthy();
    });
  });

  // ==========================================================================
  // QUIZ PHASE TESTS
  // ==========================================================================
  describe("Quiz Phase", () => {
    const goToQuiz = (getByText: Function) => {
      fireEvent.press(getByText("See It on Keyboard →"));
      fireEvent.press(getByText("See More Examples →"));
      fireEvent.press(getByText("Hear the Difference →"));
      fireEvent.press(getByText("Quiz Me →"));
    };

    it("renders quiz phase", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      expect(getByText(/Question 1 of 4/)).toBeTruthy();
    });

    it("shows first quiz question", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      expect(getByText(/flat.*do/i)).toBeTruthy();
    });

    it("shows correct answer option", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      expect(getByText("Lowers it by a half step")).toBeTruthy();
    });

    it("shows correct feedback when right answer selected", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      fireEvent.press(getByText("Lowers it by a half step"));
      expect(getByText("✓ Correct!")).toBeTruthy();
    });

    it("advances to next question", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      fireEvent.press(getByText("Lowers it by a half step"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(getByText(/Question 2 of 4/)).toBeTruthy();
    });
  });

  // ==========================================================================
  // RESULT PHASE TESTS
  // ==========================================================================
  describe("Result Phase", () => {
    const completeQuizAllCorrect = (getByText: Function) => {
      fireEvent.press(getByText("See It on Keyboard →"));
      fireEvent.press(getByText("See More Examples →"));
      fireEvent.press(getByText("Hear the Difference →"));
      fireEvent.press(getByText("Quiz Me →"));

      fireEvent.press(getByText("Lowers it by a half step"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      fireEvent.press(getByText("one half step lower"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      fireEvent.press(getByText("one key to the left"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      fireEvent.press(getByText("The black key just left of E"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });
    };

    it("shows success with all correct", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      completeQuizAllCorrect(getByText);
      expect(getByText("You understand flats!")).toBeTruthy();
    });

    it("shows perfect score", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      completeQuizAllCorrect(getByText);
      expect(getByText("4 / 4 correct")).toBeTruthy();
    });

    it("calls onComplete with success", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      completeQuizAllCorrect(getByText);
      fireEvent.press(getByText("Continue →"));
      expect(mockOnComplete).toHaveBeenCalledWith({ success: true, score: 4 });
    });
  });

  // ==========================================================================
  // AUDIO TESTS
  // ==========================================================================
  describe("Audio Playback", () => {
    it("creates audio context on mount", () => {
      render(<FlatAccidentalExercise {...defaultProps} />);
      expect(require("react-native-audio-api").AudioContext).toHaveBeenCalled();
    });

    it("closes audio context on unmount", () => {
      const { unmount } = render(<FlatAccidentalExercise {...defaultProps} />);
      unmount();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });
  });
});
