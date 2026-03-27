/**
 * @fileoverview Tests for HalfStepsTheoryExercise component
 * Tests half step (semitone) theory teaching exercise
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

// Mock MiniKeyboard
jest.mock(
  "../../src/screens/Session/components/exercises/shared/MiniKeyboard",
  () => {
    const { View, Text } = require("react-native");
    return function MockMiniKeyboard({
      highlightNotes,
      skippedNote,
    }: {
      highlightNotes?: string[];
      skippedNote?: string;
    }) {
      return (
        <View testID="mini-keyboard">
          <Text testID="highlighted-notes">
            {highlightNotes?.join(",") || "none"}
          </Text>
          <Text testID="skipped-note">{skippedNote || "none"}</Text>
        </View>
      );
    };
  },
);

import HalfStepsTheoryExercise from "../../src/screens/Session/components/exercises/HalfStepsTheoryExercise";

describe("HalfStepsTheoryExercise", () => {
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
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      expect(getByText("Half Steps")).toBeTruthy();
    });

    it("displays subtitle", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      expect(getByText("The Smallest Musical Distance")).toBeTruthy();
    });

    it("displays educational content about half steps", () => {
      const { getAllByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      expect(getAllByText(/half step/i).length).toBeGreaterThan(0);
      expect(getAllByText(/smallest/i).length).toBeGreaterThan(0);
    });

    it("renders keyboard emoji", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      expect(getByText("🎹")).toBeTruthy();
    });

    it("has button to proceed", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      expect(getByText("See the Keyboard →")).toBeTruthy();
    });

    it("navigates to keyboard phase when button pressed", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("See the Keyboard →"));
      expect(getByText("The Piano Keyboard")).toBeTruthy();
    });
  });

  // ==========================================================================
  // KEYBOARD PHASE TESTS
  // ==========================================================================
  describe("Keyboard Phase", () => {
    const goToKeyboard = (getByText: Function) => {
      fireEvent.press(getByText("See the Keyboard →"));
    };

    it("shows MiniKeyboard component", () => {
      const { getByText, getByTestId } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      goToKeyboard(getByText);
      expect(getByTestId("mini-keyboard")).toBeTruthy();
    });

    it("has button to proceed to next phase", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      goToKeyboard(getByText);
      expect(getByText("Learn About E-F →")).toBeTruthy();
    });
  });

  // ==========================================================================
  // NATURAL HALF STEPS PHASE TESTS
  // ==========================================================================
  describe("Natural Half Steps Phase", () => {
    const goToNaturalHalfSteps = (getByText: Function) => {
      fireEvent.press(getByText("See the Keyboard →"));
      fireEvent.press(getByText("Learn About E-F →"));
    };

    it("explains E-F and B-C natural half steps", () => {
      const { getByText, getAllByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      goToNaturalHalfSteps(getByText);
      expect(getByText("Natural Half Steps")).toBeTruthy();
      // Should mention E-F and B-C
      expect(getAllByText(/E.*F/i).length).toBeGreaterThan(0);
    });

    it("has button to proceed to hear it phase", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      goToNaturalHalfSteps(getByText);
      expect(getByText("Hear Half Steps →")).toBeTruthy();
    });

    it("has Show B-C button", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      goToNaturalHalfSteps(getByText);
      expect(getByText("Show B-C")).toBeTruthy();
    });

    it("has Show E-F button", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      goToNaturalHalfSteps(getByText);
      expect(getByText("Show E-F")).toBeTruthy();
    });
  });

  // ==========================================================================
  // HEAR IT PHASE TESTS
  // ==========================================================================
  describe("Hear It Phase", () => {
    const goToHearIt = (getByText: Function) => {
      fireEvent.press(getByText("See the Keyboard →"));
      fireEvent.press(getByText("Learn About E-F →"));
      fireEvent.press(getByText("Hear Half Steps →"));
    };

    it("shows hear the half step title", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      goToHearIt(getByText);
      expect(getByText("Hear the Half Step")).toBeTruthy();
    });

    it("has play button", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      goToHearIt(getByText);
      expect(getByText("▶ Play Half Step")).toBeTruthy();
    });

    it("has button to proceed to quiz", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      goToHearIt(getByText);
      expect(getByText("Quiz Me →")).toBeTruthy();
    });

    it("shows example selector buttons", () => {
      const { getByText, getAllByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      goToHearIt(getByText);
      // E → F appears both in the card and selector, so use getAllByText
      expect(getAllByText("E → F").length).toBeGreaterThan(0);
      expect(getAllByText("B → C").length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // QUIZ PHASE TESTS
  // ==========================================================================
  describe("Quiz Phase", () => {
    const goToQuiz = (getByText: Function) => {
      fireEvent.press(getByText("See the Keyboard →"));
      fireEvent.press(getByText("Learn About E-F →"));
      fireEvent.press(getByText("Hear Half Steps →"));
      fireEvent.press(getByText("Quiz Me →"));
    };

    it("renders quiz phase", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      expect(getByText(/Question 1 of 4/)).toBeTruthy();
    });

    it("shows first quiz question", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      expect(getByText(/half step is the _____/i)).toBeTruthy();
    });

    it("shows answer options", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      expect(getByText("smallest")).toBeTruthy();
      expect(getByText("largest")).toBeTruthy();
    });

    it("shows correct result when correct answer selected", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      fireEvent.press(getByText("smallest")); // Correct answer
      expect(getByText("✓ Correct!")).toBeTruthy();
    });

    it("shows wrong result with correct answer when wrong answer selected", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      fireEvent.press(getByText("largest")); // Wrong answer
      expect(getByText(/✗ The answer is: smallest/)).toBeTruthy();
    });

    it("auto-advances to next question after delay", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      fireEvent.press(getByText("smallest")); // Answer first question
      act(() => {
        jest.advanceTimersByTime(2000);
      }); // Auto-advance
      expect(getByText(/Question 2 of 4/)).toBeTruthy();
    });

    it("shows second quiz question about E to F", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      fireEvent.press(getByText("smallest"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(getByText(/E to F is a half step/)).toBeTruthy();
    });
  });

  // ==========================================================================
  // RESULT PHASE TESTS
  // ==========================================================================
  describe("Result Phase", () => {
    const goToQuiz = (getByText: Function) => {
      fireEvent.press(getByText("See the Keyboard →"));
      fireEvent.press(getByText("Learn About E-F →"));
      fireEvent.press(getByText("Hear Half Steps →"));
      fireEvent.press(getByText("Quiz Me →"));
    };

    const completeQuizAllCorrect = (getByText: Function) => {
      goToQuiz(getByText);
      // Q1: smallest
      fireEvent.press(getByText("smallest"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      // Q2: adjacent keys
      fireEvent.press(
        getByText("They're adjacent keys with no black key between"),
      );
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      // Q3: C to D is NOT a half step
      fireEvent.press(getByText("C to D"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      // Q4: 12 half steps in octave
      fireEvent.press(getByText("12"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });
    };

    const completeQuizAllWrong = (getByText: Function) => {
      goToQuiz(getByText);
      // Q1: wrong answer
      fireEvent.press(getByText("largest"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      // Q2: wrong answer
      fireEvent.press(getByText("They're far apart on the keyboard"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      // Q3: wrong answer
      fireEvent.press(getByText("E to F"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      // Q4: wrong answer
      fireEvent.press(getByText("7"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });
    };

    it("shows success message with all correct", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      completeQuizAllCorrect(getByText);
      expect(getByText("You understand half steps!")).toBeTruthy();
    });

    it("shows perfect score", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      completeQuizAllCorrect(getByText);
      expect(getByText("4 / 4 correct")).toBeTruthy();
    });

    it("shows celebration emoji with all correct", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      completeQuizAllCorrect(getByText);
      expect(getByText("🎉")).toBeTruthy();
    });

    it("shows Continue button with all correct", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      completeQuizAllCorrect(getByText);
      expect(getByText("Continue →")).toBeTruthy();
    });

    it("shows review message when not all correct", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      completeQuizAllWrong(getByText);
      expect(getByText("Let's review")).toBeTruthy();
    });

    it("shows Try Again button when not all correct", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      completeQuizAllWrong(getByText);
      expect(getByText("Try Again")).toBeTruthy();
    });

    it("calls onComplete with success true when passed", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      completeQuizAllCorrect(getByText);
      fireEvent.press(getByText("Continue →"));
      expect(mockOnComplete).toHaveBeenCalledWith({ success: true, score: 4 });
    });

    it("calls onComplete with success false when failed", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise {...defaultProps} />,
      );
      completeQuizAllWrong(getByText);
      fireEvent.press(getByText("Try Again"));
      expect(mockOnComplete).toHaveBeenCalledWith({ success: false, score: 0 });
    });
  });

  // ==========================================================================
  // DEFAULT PROPS TESTS
  // ==========================================================================
  describe("Default Props", () => {
    it("renders without mini prop", () => {
      const { getByText } = render(
        <HalfStepsTheoryExercise
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />,
      );
      expect(getByText("Half Steps")).toBeTruthy();
    });
  });

  // ==========================================================================
  // AUDIO TESTS
  // ==========================================================================
  describe("Audio Playback", () => {
    it("creates audio context on mount", () => {
      render(<HalfStepsTheoryExercise {...defaultProps} />);
      expect(require("react-native-audio-api").AudioContext).toHaveBeenCalled();
    });

    it("closes audio context on unmount", () => {
      const { unmount } = render(<HalfStepsTheoryExercise {...defaultProps} />);
      unmount();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });
  });
});
