/**
 * @fileoverview Tests for NaturalAccidentalExercise component
 * Tests natural (♮) accidental teaching exercise
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

import NaturalAccidentalExercise from "../../src/screens/Session/components/exercises/NaturalAccidentalExercise";

describe("NaturalAccidentalExercise", () => {
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
        <NaturalAccidentalExercise {...defaultProps} />,
      );
      expect(getByText("The Natural Sign")).toBeTruthy();
    });

    it("displays educational content", () => {
      const { getAllByText } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
      );
      expect(getAllByText(/natural/i).length).toBeGreaterThan(0);
    });

    it("displays natural sign", () => {
      const { getByText } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
      );
      expect(getByText("♮")).toBeTruthy();
    });

    it("has button to proceed", () => {
      const { getByText } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
      );
      expect(getByText("See How It Works →")).toBeTruthy();
    });

    it("navigates to how it works phase", () => {
      const { getByText } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("See How It Works →"));
      expect(getByText("Cancelling Accidentals")).toBeTruthy();
    });
  });

  // ==========================================================================
  // HOW IT WORKS PHASE TESTS
  // ==========================================================================
  describe("How It Works Phase", () => {
    const goToHowItWorks = (getByText: Function) => {
      fireEvent.press(getByText("See How It Works →"));
    };

    it("shows cancelling accidentals title", () => {
      const { getByText } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
      );
      goToHowItWorks(getByText);
      expect(getByText("Cancelling Accidentals")).toBeTruthy();
    });

    it("shows educational content", () => {
      const { getAllByText } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
      );
      goToHowItWorks(getAllByText);
      expect(getAllByText(/sharp|flat|cancel/i).length).toBeGreaterThan(0);
    });

    it("has button to examples phase", () => {
      const { getByText } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
      );
      goToHowItWorks(getByText);
      expect(getByText("More Examples →")).toBeTruthy();
    });
  });

  // ==========================================================================
  // EXAMPLES PHASE TESTS
  // ==========================================================================
  describe("Examples Phase", () => {
    const goToExamples = (getByText: Function) => {
      fireEvent.press(getByText("See How It Works →"));
      fireEvent.press(getByText("More Examples →"));
    };

    it("shows examples phase title", () => {
      const { getByText } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
      );
      goToExamples(getByText);
      expect(getByText("When You'll See Naturals")).toBeTruthy();
    });

    it("has button to quiz phase", () => {
      const { getByText } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
      );
      goToExamples(getByText);
      expect(getByText("Quiz Me →")).toBeTruthy();
    });
  });

  // ==========================================================================
  // QUIZ PHASE TESTS
  // ==========================================================================
  describe("Quiz Phase", () => {
    const goToQuiz = (getByText: Function) => {
      fireEvent.press(getByText("See How It Works →"));
      fireEvent.press(getByText("More Examples →"));
      fireEvent.press(getByText("Quiz Me →"));
    };

    it("renders quiz phase", () => {
      const { getByText } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      expect(getByText(/Question 1 of 4/)).toBeTruthy();
    });

    it("shows first quiz question", () => {
      const { getByText } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      expect(getByText(/natural sign.*do/i)).toBeTruthy();
    });

    it("shows correct answer option", () => {
      const { getByText } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      expect(getByText("Cancels a sharp or flat")).toBeTruthy();
    });

    it("shows correct feedback when right answer selected", () => {
      const { getByText } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      fireEvent.press(getByText("Cancels a sharp or flat"));
      expect(getByText("✓ Correct!")).toBeTruthy();
    });

    it("advances to next question after delay", () => {
      const { getByText } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      fireEvent.press(getByText("Cancels a sharp or flat"));
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
      fireEvent.press(getByText("See How It Works →"));
      fireEvent.press(getByText("More Examples →"));
      fireEvent.press(getByText("Quiz Me →"));

      fireEvent.press(getByText("Cancels a sharp or flat"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      fireEvent.press(getByText("Regular F (white key)"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      fireEvent.press(getByText("Regular B (white key)"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      fireEvent.press(getByText("white key / unaltered"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });
    };

    it("shows success with all correct", () => {
      const { getByText } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
      );
      completeQuizAllCorrect(getByText);
      expect(getByText("You understand naturals!")).toBeTruthy();
    });

    it("shows perfect score", () => {
      const { getByText } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
      );
      completeQuizAllCorrect(getByText);
      expect(getByText("4 / 4 correct")).toBeTruthy();
    });

    it("calls onComplete with success", () => {
      const { getByText } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
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
      render(<NaturalAccidentalExercise {...defaultProps} />);
      expect(require("react-native-audio-api").AudioContext).toHaveBeenCalled();
    });

    it("closes audio context on unmount", () => {
      const { unmount } = render(
        <NaturalAccidentalExercise {...defaultProps} />,
      );
      unmount();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });
  });
});
