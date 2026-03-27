/**
 * @fileoverview Tests for WholeStepsTheoryExercise component
 * Tests whole step theory teaching exercise
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

import WholeStepsTheoryExercise from "../../src/screens/Session/components/exercises/WholeStepsTheoryExercise";

describe("WholeStepsTheoryExercise", () => {
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
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      expect(getByText("Whole Steps")).toBeTruthy();
      expect(getByText("Two Half Steps Combined")).toBeTruthy();
    });

    it("displays educational content about whole steps", () => {
      const { getAllByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      expect(getAllByText(/whole step/i).length).toBeGreaterThan(0);
      expect(getAllByText(/2 half steps/i).length).toBeGreaterThan(0);
    });

    it("renders keyboard emoji", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      expect(getByText("🎹")).toBeTruthy();
    });

    it("shows C to D example", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      expect(getByText(/C to D is a whole step/i)).toBeTruthy();
    });

    it("has button to proceed to comparison phase", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      expect(getByText(/Compare to Half Steps/)).toBeTruthy();
    });

    it("navigates to comparison phase when button pressed", () => {
      const { getByText, queryByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      fireEvent.press(getByText(/Compare to Half Steps/));
      expect(getByText("Half vs Whole")).toBeTruthy();
    });
  });

  // ==========================================================================
  // COMPARISON PHASE TESTS
  // ==========================================================================
  describe("Comparison Phase", () => {
    const goToComparison = (getByText: Function) => {
      fireEvent.press(getByText(/Compare to Half Steps/));
    };

    it("renders comparison phase after intro", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToComparison(getByText);
      expect(getByText("Half vs Whole")).toBeTruthy();
    });

    it("shows MiniKeyboard component", () => {
      const { getByText, getByTestId } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToComparison(getByText);
      expect(getByTestId("mini-keyboard")).toBeTruthy();
    });

    it("has half step comparison card", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToComparison(getByText);
      expect(getByText("Half Step")).toBeTruthy();
      expect(getByText(/C → C#/)).toBeTruthy();
    });

    it("has whole step comparison card", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToComparison(getByText);
      expect(getByText("Whole Step")).toBeTruthy();
      expect(getByText(/C → D/)).toBeTruthy();
    });

    it("has play buttons for both comparison cards", () => {
      const { getByText, getAllByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToComparison(getByText);
      const playButtons = getAllByText("▶");
      expect(playButtons.length).toBeGreaterThanOrEqual(2);
    });

    it("has button to proceed to examples phase", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToComparison(getByText);
      expect(getByText(/More Examples/)).toBeTruthy();
    });

    it("plays half step audio when play button pressed", async () => {
      const { getByText, getAllByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToComparison(getByText);
      const playButtons = getAllByText("▶");
      fireEvent.press(playButtons[0]); // Half step play button

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // EXAMPLES PHASE TESTS
  // ==========================================================================
  describe("Examples Phase", () => {
    const goToExamples = (getByText: Function) => {
      fireEvent.press(getByText(/Compare to Half Steps/));
      fireEvent.press(getByText(/More Examples/));
    };

    it("renders examples phase", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToExamples(getByText);
      expect(getByText("Whole Step Examples")).toBeTruthy();
    });

    it("shows example selector", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToExamples(getByText);
      expect(getByText(/Try other whole steps/)).toBeTruthy();
    });

    it("has play button for current example", () => {
      const { getByText, getByLabelText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToExamples(getByText);
      expect(getByText(/Play Whole Step/i)).toBeTruthy();
    });

    it("has button to proceed to quiz", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToExamples(getByText);
      expect(getByText(/Quiz Me/)).toBeTruthy();
    });

    it("shows skips info for example", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToExamples(getByText);
      expect(getByText(/skips/i)).toBeTruthy();
    });

    it("shows example label", () => {
      const { getByText, getAllByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToExamples(getByText);
      expect(getAllByText(/C → D/).length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // QUIZ PHASE TESTS
  // ==========================================================================
  describe("Quiz Phase", () => {
    const goToQuiz = (getByText: Function) => {
      fireEvent.press(getByText(/Compare to Half Steps/));
      fireEvent.press(getByText(/More Examples/));
      fireEvent.press(getByText(/Quiz Me/));
    };

    it("renders quiz phase", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      expect(getByText(/Question \d+ of \d+/)).toBeTruthy();
    });

    it("shows first quiz question", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      expect(
        getByText("A whole step equals how many half steps?"),
      ).toBeTruthy();
    });

    it("shows answer options", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      expect(getByText("1")).toBeTruthy();
      expect(getByText("2")).toBeTruthy();
      expect(getByText("3")).toBeTruthy();
      expect(getByText("4")).toBeTruthy();
    });

    it("shows correct result when correct answer selected", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      fireEvent.press(getByText("2")); // Correct answer
      expect(getByText(/Correct|✓/)).toBeTruthy();
    });

    it("shows incorrect result when wrong answer selected", () => {
      const { getByText, queryByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      fireEvent.press(getByText("1")); // Wrong answer
      // Should show incorrect feedback
      expect(getByText(/✗ The answer is/)).toBeTruthy();
    });

    it("auto-advances to next question after feedback delay", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToQuiz(getByText);
      fireEvent.press(getByText("2")); // Answer first question
      act(() => {
        jest.advanceTimersByTime(2000);
      }); // Auto-advance
      expect(getByText(/Question 2 of/)).toBeTruthy();
    });

    it("completes all quiz questions", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToQuiz(getByText);

      // Answer all 4 questions with auto-advance
      const answers = [
        "2",
        "It skips one key (C#)",
        "G to A",
        "There's no key between them",
      ];
      answers.forEach((answer) => {
        fireEvent.press(getByText(answer));
        act(() => {
          jest.advanceTimersByTime(2000);
        });
      });

      // Should transition to result phase
      expect(
        getByText(/You understand whole steps|Let's review/i),
      ).toBeTruthy();
    });
  });

  // ==========================================================================
  // RESULT PHASE TESTS
  // ==========================================================================
  describe("Result Phase", () => {
    const completeQuiz = (getByText: Function, allCorrect: boolean = true) => {
      fireEvent.press(getByText(/Compare to Half Steps/));
      fireEvent.press(getByText(/More Examples/));
      fireEvent.press(getByText(/Quiz Me/));

      const correctAnswers = [
        "2",
        "It skips one key (C#)",
        "G to A",
        "There's no key between them",
      ];
      const wrongAnswers = [
        "1",
        "They're next to each other",
        "E to F",
        "It's too far apart",
      ];

      const answers = allCorrect ? correctAnswers : wrongAnswers;
      answers.forEach((answer) => {
        fireEvent.press(getByText(answer));
        act(() => {
          jest.advanceTimersByTime(2000);
        });
      });
    };

    it("shows result phase after completing quiz", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      completeQuiz(getByText);
      expect(
        getByText(/You understand whole steps|Let's review/i),
      ).toBeTruthy();
    });

    it("shows perfect score celebration", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      completeQuiz(getByText, true);
      expect(getByText(/4 \/ 4 correct/)).toBeTruthy();
    });

    it("has finish button", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      completeQuiz(getByText);
      expect(getByText(/Continue →/)).toBeTruthy();
    });

    it("calls onComplete when finish pressed with success for perfect score", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      completeQuiz(getByText, true);
      fireEvent.press(getByText(/Continue|Finish|Done/));
      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, score: 4 }),
      );
    });

    it("calls onComplete with failure for imperfect score", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      completeQuiz(getByText, false);
      fireEvent.press(getByText(/Continue|Finish|Done|Try Again/));
      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({ success: false }),
      );
    });
  });

  // ==========================================================================
  // DEFAULT PROPS TESTS
  // ==========================================================================
  describe("Default Props", () => {
    it("renders without mini prop", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />,
      );
      expect(getByText("Whole Steps")).toBeTruthy();
    });

    it("renders without sessionState prop", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise
          mini={{}}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />,
      );
      expect(getByText("Whole Steps")).toBeTruthy();
    });
  });

  // ==========================================================================
  // AUDIO TESTS
  // ==========================================================================
  describe("Audio Playback", () => {
    it("creates audio context on mount", () => {
      render(<WholeStepsTheoryExercise {...defaultProps} />);
      expect(require("react-native-audio-api").AudioContext).toHaveBeenCalled();
    });

    it("closes audio context on unmount", () => {
      const { unmount } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      unmount();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });
  });
});
