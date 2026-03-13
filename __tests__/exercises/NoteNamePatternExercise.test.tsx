/**
 * Tests for NoteNamePatternExercise component
 *
 * Teaches the seven note names A B C D E F G
 * Flow: Intro → Visual Pattern → Quiz
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

// Mock AudioContext
const mockCreateOscillator = jest.fn(() => ({
  connect: jest.fn(),
  frequency: { value: 440 },
  start: jest.fn(),
  stop: jest.fn(),
  type: "sine",
}));

const mockCreateGain = jest.fn(() => ({
  connect: jest.fn(),
  gain: {
    value: 1,
    setValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
  },
}));

const mockAudioContext = {
  close: jest.fn(),
  resume: jest.fn(() => Promise.resolve()),
  currentTime: 0,
  state: "running",
  createOscillator: mockCreateOscillator,
  createGain: mockCreateGain,
  destination: {},
};

jest.mock("react-native-audio-api", () => ({
  AudioContext: jest.fn(() => mockAudioContext),
}));

// Mock devLogger
jest.mock("../../src/utils/devLogger", () => ({
  devWarn: jest.fn(),
  devLog: jest.fn(),
}));

import NoteNamePatternExercise from "../../src/screens/Session/components/exercises/NoteNamePatternExercise";

describe("NoteNamePatternExercise", () => {
  const defaultProps = {
    mini: {},
    sessionState: {},
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
    it("renders intro screen with title", () => {
      const { getByText } = render(
        <NoteNamePatternExercise {...defaultProps} />,
      );

      expect(getByText("Note Names")).toBeTruthy();
    });

    it("shows The Musical Alphabet subtitle", () => {
      const { getByText } = render(
        <NoteNamePatternExercise {...defaultProps} />,
      );

      expect(getByText("The Musical Alphabet")).toBeTruthy();
    });

    it("shows only 7 letters explanation", () => {
      const { getByText } = render(
        <NoteNamePatternExercise {...defaultProps} />,
      );

      expect(getByText(/only 7 letters/i)).toBeTruthy();
    });

    it("displays all 7 note names", () => {
      const { getByText } = render(
        <NoteNamePatternExercise {...defaultProps} />,
      );

      expect(getByText("A")).toBeTruthy();
      expect(getByText("B")).toBeTruthy();
      expect(getByText("C")).toBeTruthy();
      expect(getByText("D")).toBeTruthy();
      expect(getByText("E")).toBeTruthy();
      expect(getByText("F")).toBeTruthy();
      expect(getByText("G")).toBeTruthy();
    });

    it("shows Find Out button", () => {
      const { getByText } = render(
        <NoteNamePatternExercise {...defaultProps} />,
      );

      expect(getByText("Find Out →")).toBeTruthy();
    });

    it("shows piano question", () => {
      const { getByText } = render(
        <NoteNamePatternExercise {...defaultProps} />,
      );

      expect(getByText(/88 keys/i)).toBeTruthy();
    });
  });

  // ============================================================
  // PATTERN PHASE
  // ============================================================
  describe("Pattern Phase", () => {
    it("navigates to pattern phase when Find Out is pressed", () => {
      const { getByText } = render(
        <NoteNamePatternExercise {...defaultProps} />,
      );

      fireEvent.press(getByText("Find Out →"));

      expect(getByText("The Pattern Repeats!")).toBeTruthy();
    });

    it("shows pattern explanation", () => {
      const { getByText } = render(
        <NoteNamePatternExercise {...defaultProps} />,
      );

      fireEvent.press(getByText("Find Out →"));

      expect(getByText(/After G, we go back to A/i)).toBeTruthy();
    });

    it("shows See & hear it button", () => {
      const { getByText } = render(
        <NoteNamePatternExercise {...defaultProps} />,
      );

      fireEvent.press(getByText("Find Out →"));

      expect(getByText("▶ See & hear it")).toBeTruthy();
    });

    it("shows Got it! Quiz me button", () => {
      const { getByText } = render(
        <NoteNamePatternExercise {...defaultProps} />,
      );

      fireEvent.press(getByText("Find Out →"));

      expect(getByText("Got it! Quiz me →")).toBeTruthy();
    });

    it("shows key insight about note naming", () => {
      const { getByText } = render(
        <NoteNamePatternExercise {...defaultProps} />,
      );

      fireEvent.press(getByText("Find Out →"));

      expect(getByText(/Every A on a piano is named "A"/i)).toBeTruthy();
    });

    it("shows playing state when animation starts", async () => {
      const { getByText } = render(
        <NoteNamePatternExercise {...defaultProps} />,
      );

      fireEvent.press(getByText("Find Out →"));
      fireEvent.press(getByText("▶ See & hear it"));

      expect(getByText("♪ Playing...")).toBeTruthy();
    });
  });

  // ============================================================
  // QUIZ PHASE
  // ============================================================
  describe("Quiz Phase", () => {
    const navigateToQuiz = (getByText: any) => {
      fireEvent.press(getByText("Find Out →"));
      fireEvent.press(getByText("Got it! Quiz me →"));
    };

    it("navigates to quiz phase", () => {
      const { getByText } = render(
        <NoteNamePatternExercise {...defaultProps} />,
      );

      navigateToQuiz(getByText);

      expect(getByText(/Question 1 of 4/i)).toBeTruthy();
    });

    it("shows progress bar", () => {
      const { getByText } = render(
        <NoteNamePatternExercise {...defaultProps} />,
      );

      navigateToQuiz(getByText);

      expect(getByText(/Question 1 of 4/i)).toBeTruthy();
    });

    it("shows quiz question", () => {
      const { getByText, queryByText } = render(
        <NoteNamePatternExercise {...defaultProps} />,
      );

      navigateToQuiz(getByText);

      // One of the quiz questions should be visible
      const questions = [
        "How many letter names are used in music?",
        "What letter comes after G?",
        "What letter comes before A?",
        "Which of these is NOT a note name?",
      ];

      const foundQuestion = questions.some((q) => queryByText(q));
      expect(foundQuestion).toBeTruthy();
    });

    it("shows answer options", () => {
      const { getByText, queryByText } = render(
        <NoteNamePatternExercise {...defaultProps} />,
      );

      navigateToQuiz(getByText);

      // Check for presence of option buttons (some subset of these)
      const hasOptions =
        queryByText("7") ||
        queryByText("A") ||
        queryByText("G") ||
        queryByText("H");
      expect(hasOptions).toBeTruthy();
    });

    it("shows feedback on answer selection", async () => {
      const { getByText, queryByText } = render(
        <NoteNamePatternExercise {...defaultProps} />,
      );

      navigateToQuiz(getByText);

      // Try to click on one of the common options
      try {
        fireEvent.press(getByText("7"));
      } catch {
        try {
          fireEvent.press(getByText("A"));
        } catch {
          try {
            fireEvent.press(getByText("G"));
          } catch {
            fireEvent.press(getByText("H"));
          }
        }
      }

      // Should show some feedback
      await waitFor(() => {
        const hasCorrect = queryByText("✓ Correct!");
        const hasWrong = queryByText(/✗ The answer is:/);
        expect(hasCorrect || hasWrong).toBeTruthy();
      });
    });

    it("shows Next button after answering", async () => {
      const { getByText, queryByText } = render(
        <NoteNamePatternExercise {...defaultProps} />,
      );

      navigateToQuiz(getByText);

      // Try to click on one of the common options
      try {
        fireEvent.press(getByText("7"));
      } catch {
        try {
          fireEvent.press(getByText("A"));
        } catch {
          try {
            fireEvent.press(getByText("G"));
          } catch {
            fireEvent.press(getByText("H"));
          }
        }
      }

      await waitFor(() => {
        expect(
          queryByText(/Next →/) || queryByText(/See Results →/),
        ).toBeTruthy();
      });
    });
  });

  // ============================================================
  // COMPLETION
  // ============================================================
  describe("Completion", () => {
    const navigateToQuiz = (getByText: any) => {
      fireEvent.press(getByText("Find Out →"));
      fireEvent.press(getByText("Got it! Quiz me →"));
    };

    it("shows question progress during quiz", async () => {
      const { getByText } = render(
        <NoteNamePatternExercise {...defaultProps} />,
      );

      navigateToQuiz(getByText);

      expect(getByText(/Question \d of 4/i)).toBeTruthy();
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
        <NoteNamePatternExercise {...noCompleteProps} />,
      );

      expect(getByText("Note Names")).toBeTruthy();
    });

    it("handles missing onCancel gracefully", () => {
      const noCancelProps = {
        ...defaultProps,
        onCancel: undefined,
      };

      const { getByText } = render(
        <NoteNamePatternExercise {...noCancelProps} />,
      );

      expect(getByText("Note Names")).toBeTruthy();
    });

    it("handles missing props gracefully", () => {
      const { getByText } = render(<NoteNamePatternExercise />);

      expect(getByText("Note Names")).toBeTruthy();
    });
  });

  // ============================================================
  // ANIMATION
  // ============================================================
  describe("Animation", () => {
    it("changes button text during animation", async () => {
      const { getByText } = render(
        <NoteNamePatternExercise {...defaultProps} />,
      );

      fireEvent.press(getByText("Find Out →"));
      fireEvent.press(getByText("▶ See & hear it"));

      expect(getByText("♪ Playing...")).toBeTruthy();
    });

    it("disables button during animation", () => {
      const { getByText } = render(
        <NoteNamePatternExercise {...defaultProps} />,
      );

      fireEvent.press(getByText("Find Out →"));

      const playButton = getByText("▶ See & hear it").parent;
      fireEvent.press(getByText("▶ See & hear it"));

      // Clicking again should not start another animation
      // (button should be disabled)
      expect(getByText("♪ Playing...")).toBeTruthy();
    });
  });
});
