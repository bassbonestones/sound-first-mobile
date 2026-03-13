/**
 * @fileoverview Tests for KeySignatureBasicsExercise component
 * Tests key signature learning exercise with phases: intro, purpose, how_it_works, examples, quiz, result
 */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

// Mock AudioContext
jest.mock("react-native-audio-api", () => ({
  AudioContext: jest.fn(() => ({
    currentTime: 0,
    createOscillator: jest.fn(() => ({
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      frequency: { value: 0 },
    })),
    createGain: jest.fn(() => ({
      connect: jest.fn(),
      gain: { setValueAtTime: jest.fn() },
    })),
    destination: {},
    close: jest.fn(),
  })),
}));

jest.mock("../../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devWarn: jest.fn(),
  devError: jest.fn(),
}));

// Mock NotationDisplay
jest.mock("../../src/components/NotationDisplay", () => {
  const { View, Text } = require("react-native");
  return function MockNotationDisplay({
    musicxml,
    width,
    height,
  }: {
    musicxml: string;
    width?: number;
    height?: number;
  }) {
    return (
      <View testID="notation-display">
        <Text testID="notation-width">{width}</Text>
        <Text testID="notation-height">{height}</Text>
      </View>
    );
  };
});

import KeySignatureBasicsExercise from "../../src/screens/Session/components/exercises/KeySignatureBasicsExercise";

describe("KeySignatureBasicsExercise", () => {
  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    mini: {},
    sessionState: {},
    onComplete: mockOnComplete,
    onCancel: mockOnCancel,
    clef: "treble",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // INTRO PHASE TESTS
  // ==========================================================================
  describe("Intro Phase", () => {
    it("renders intro phase by default", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      expect(getByText("Key Signatures")).toBeTruthy();
    });

    it("displays subtitle", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      expect(getByText("The Musical Shorthand")).toBeTruthy();
    });

    it("shows key signature display example", () => {
      const { getByTestId } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      expect(getByTestId("notation-display")).toBeTruthy();
    });

    it("displays educational content about key signatures", () => {
      const { getAllByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      expect(getAllByText(/key signature/i).length).toBeGreaterThan(0);
    });

    it("has button to proceed", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      expect(getByText("Why Key Signatures? →")).toBeTruthy();
    });

    it("navigates to purpose phase when button pressed", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Why Key Signatures? →"));
      expect(getByText("Why Use Them?")).toBeTruthy();
    });
  });

  // ==========================================================================
  // PURPOSE PHASE TESTS
  // ==========================================================================
  describe("Purpose Phase", () => {
    const goToPurpose = (getByText: ReturnType<typeof render>["getByText"]) => {
      fireEvent.press(getByText("Why Key Signatures? →"));
    };

    it("shows purpose phase title", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToPurpose(getByText);
      expect(getByText("Why Use Them?")).toBeTruthy();
    });

    it("shows without vs with comparison", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToPurpose(getByText);
      expect(getByText("Without Key Signature:")).toBeTruthy();
      expect(getByText("With Key Signature:")).toBeTruthy();
    });

    it("shows lightbulb emoji", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToPurpose(getByText);
      expect(getByText("💡")).toBeTruthy();
    });

    it("has button to proceed", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToPurpose(getByText);
      expect(getByText("How It Works →")).toBeTruthy();
    });

    it("navigates to how_it_works phase", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToPurpose(getByText);
      fireEvent.press(getByText("How It Works →"));
      expect(getByText("How It Works")).toBeTruthy();
    });
  });

  // ==========================================================================
  // HOW IT WORKS PHASE TESTS
  // ==========================================================================
  describe("How It Works Phase", () => {
    const goToHowItWorks = (
      getByText: ReturnType<typeof render>["getByText"],
    ) => {
      fireEvent.press(getByText("Why Key Signatures? →"));
      fireEvent.press(getByText("How It Works →"));
    };

    it("shows how it works title", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToHowItWorks(getByText);
      expect(getByText("How It Works")).toBeTruthy();
    });

    it("shows rule #1", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToHowItWorks(getByText);
      expect(getByText("Rule #1:")).toBeTruthy();
    });

    it("shows rule #2", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToHowItWorks(getByText);
      expect(getByText("Rule #2:")).toBeTruthy();
    });

    it("shows rule #3", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToHowItWorks(getByText);
      expect(getByText("Rule #3:")).toBeTruthy();
    });

    it("has button to proceed to examples", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToHowItWorks(getByText);
      expect(getByText("See Examples →")).toBeTruthy();
    });

    it("navigates to examples phase", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToHowItWorks(getByText);
      fireEvent.press(getByText("See Examples →"));
      expect(getByText("Common Key Signatures")).toBeTruthy();
    });
  });

  // ==========================================================================
  // EXAMPLES PHASE TESTS
  // ==========================================================================
  describe("Examples Phase", () => {
    const goToExamples = (
      getByText: ReturnType<typeof render>["getByText"],
    ) => {
      fireEvent.press(getByText("Why Key Signatures? →"));
      fireEvent.press(getByText("How It Works →"));
      fireEvent.press(getByText("See Examples →"));
    };

    it("shows examples phase title", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToExamples(getByText);
      expect(getByText("Common Key Signatures")).toBeTruthy();
    });

    it("shows key example buttons", () => {
      const { getByText, getAllByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToExamples(getByText);
      // Check that multiple key example buttons exist
      expect(getAllByText("C Major").length).toBeGreaterThan(0);
      expect(getAllByText("G Major").length).toBeGreaterThan(0);
    });

    it("shows F Major button", () => {
      const { getByText, getAllByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToExamples(getByText);
      expect(getAllByText("F Major").length).toBeGreaterThan(0);
    });

    it("shows D Major button", () => {
      const { getByText, getAllByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToExamples(getByText);
      expect(getAllByText("D Major").length).toBeGreaterThan(0);
    });

    it("can select different examples", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToExamples(getByText);
      fireEvent.press(getByText("G Major"));
      expect(getByText("1 sharp (F#)")).toBeTruthy();
    });

    it("has quiz button", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToExamples(getByText);
      expect(getByText("Quiz Me →")).toBeTruthy();
    });

    it("navigates to quiz phase", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToExamples(getByText);
      fireEvent.press(getByText("Quiz Me →"));
      expect(getByText("Question 1 of 4")).toBeTruthy();
    });
  });

  // ==========================================================================
  // QUIZ PHASE TESTS
  // ==========================================================================
  describe("Quiz Phase", () => {
    const goToQuiz = (getByText: ReturnType<typeof render>["getByText"]) => {
      fireEvent.press(getByText("Why Key Signatures? →"));
      fireEvent.press(getByText("How It Works →"));
      fireEvent.press(getByText("See Examples →"));
      fireEvent.press(getByText("Quiz Me →"));
    };

    it("shows quiz progress", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      expect(getByText("Question 1 of 4")).toBeTruthy();
    });

    it("displays first quiz question", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      expect(getByText("A key signature tells us:")).toBeTruthy();
    });

    it("displays answer options", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      expect(
        getByText("Which sharps/flats to play throughout the piece"),
      ).toBeTruthy();
    });

    it("handles correct answer selection", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      fireEvent.press(
        getByText("Which sharps/flats to play throughout the piece"),
      );
      expect(getByText("✓ Correct!")).toBeTruthy();
    });

    it("handles incorrect answer selection", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      fireEvent.press(getByText("How fast to play"));
      expect(
        getByText(
          /✗ The answer is: Which sharps\/flats to play throughout the piece/,
        ),
      ).toBeTruthy();
    });

    it("shows next button after answering", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      fireEvent.press(
        getByText("Which sharps/flats to play throughout the piece"),
      );
      expect(getByText("Next →")).toBeTruthy();
    });

    it("proceeds to next question", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      fireEvent.press(
        getByText("Which sharps/flats to play throughout the piece"),
      );
      fireEvent.press(getByText("Next →"));
      expect(getByText("Question 2 of 4")).toBeTruthy();
    });

    it("shows See Results button on last question", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      // Q1
      fireEvent.press(
        getByText("Which sharps/flats to play throughout the piece"),
      );
      fireEvent.press(getByText("Next →"));
      // Q2
      fireEvent.press(getByText("Every F in the entire piece"));
      fireEvent.press(getByText("Next →"));
      // Q3
      fireEvent.press(getByText("No sharps or flats"));
      fireEvent.press(getByText("Next →"));
      // Q4
      fireEvent.press(getByText("1 sharp (F#)"));
      expect(getByText("See Results →")).toBeTruthy();
    });
  });

  // ==========================================================================
  // RESULT PHASE TESTS
  // ==========================================================================
  describe("Result Phase", () => {
    const goToResult = (
      getByText: ReturnType<typeof render>["getByText"],
      allCorrect = true,
    ) => {
      fireEvent.press(getByText("Why Key Signatures? →"));
      fireEvent.press(getByText("How It Works →"));
      fireEvent.press(getByText("See Examples →"));
      fireEvent.press(getByText("Quiz Me →"));
      // Answer all 4 questions
      fireEvent.press(
        getByText(
          allCorrect
            ? "Which sharps/flats to play throughout the piece"
            : "How fast to play",
        ),
      );
      fireEvent.press(getByText("Next →"));
      fireEvent.press(getByText("Every F in the entire piece"));
      fireEvent.press(getByText("Next →"));
      fireEvent.press(getByText("No sharps or flats"));
      fireEvent.press(getByText("Next →"));
      fireEvent.press(getByText("1 sharp (F#)"));
      fireEvent.press(getByText("See Results →"));
    };

    it("shows perfect score title", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToResult(getByText, true);
      expect(getByText("You understand key signatures!")).toBeTruthy();
    });

    it("shows review title when not perfect", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToResult(getByText, false);
      expect(getByText("Let's review")).toBeTruthy();
    });

    it("displays score", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToResult(getByText, true);
      expect(getByText("4 / 4 correct")).toBeTruthy();
    });

    it("shows celebration emoji on success", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToResult(getByText, true);
      expect(getByText("🎉")).toBeTruthy();
    });

    it("shows book emoji on failure", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToResult(getByText, false);
      expect(getByText("📚")).toBeTruthy();
    });

    it("has Continue button on success", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToResult(getByText, true);
      expect(getByText("Continue →")).toBeTruthy();
    });

    it("has Try Again button on failure", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToResult(getByText, false);
      expect(getByText("Try Again")).toBeTruthy();
    });

    it("calls onComplete when Continue pressed", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise {...defaultProps} />,
      );
      goToResult(getByText, true);
      fireEvent.press(getByText("Continue →"));
      expect(mockOnComplete).toHaveBeenCalledWith({
        success: true,
        score: 4,
      });
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================
  describe("Edge Cases", () => {
    it("handles missing callbacks gracefully", () => {
      const { getByText } = render(
        <KeySignatureBasicsExercise
          mini={{}}
          sessionState={{}}
          onComplete={undefined}
          onCancel={undefined}
        />,
      );
      expect(getByText("Key Signatures")).toBeTruthy();
    });

    it("accepts clef prop", () => {
      const { getByTestId } = render(
        <KeySignatureBasicsExercise {...defaultProps} clef="bass" />,
      );
      expect(getByTestId("notation-display")).toBeTruthy();
    });
  });
});
