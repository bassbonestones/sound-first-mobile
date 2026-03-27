/**
 * @fileoverview Tests for OctaveConceptExercise component
 * Tests octave concept learning exercise with phases: intro, listen, quiz, result
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

import OctaveConceptExercise from "../../src/screens/Session/components/exercises/OctaveConceptExercise";

describe("OctaveConceptExercise", () => {
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
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      expect(getByText("The Octave")).toBeTruthy();
    });

    it("displays subtitle", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      expect(getByText("Same Note, Different Height")).toBeTruthy();
    });

    it("displays educational content about octaves", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      expect(getByText(/A B C D E F G/)).toBeTruthy();
    });

    it("shows piano emoji", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      expect(getByText("🎹")).toBeTruthy();
    });

    it("has button to proceed", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      expect(getByText("Hear It →")).toBeTruthy();
    });

    it("navigates to listen phase when button pressed", () => {
      const { getByText, queryByText } = render(
        <OctaveConceptExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Hear It →"));
      expect(queryByText("Listen to Octaves")).toBeTruthy();
    });
  });

  // ==========================================================================
  // LISTEN PHASE TESTS
  // ==========================================================================
  describe("Listen Phase", () => {
    const goToListen = (getByText: ReturnType<typeof render>["getByText"]) => {
      fireEvent.press(getByText("Hear It →"));
    };

    it("shows listen phase title", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      goToListen(getByText);
      expect(getByText("Listen to Octaves")).toBeTruthy();
    });

    it("displays low and high note labels", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      goToListen(getByText);
      expect(getByText("Low C")).toBeTruthy();
      expect(getByText("High C")).toBeTruthy();
    });

    it("has play button for octave pair", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      goToListen(getByText);
      expect(getByText("▶ Play Octave")).toBeTruthy();
    });

    it("plays sound when play button pressed", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      goToListen(getByText);
      fireEvent.press(getByText("▶ Play Octave"));
      // Should have created oscillators for playing notes
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it("displays octave pair buttons", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      goToListen(getByText);
      expect(getByText("C")).toBeTruthy();
      expect(getByText("D")).toBeTruthy();
      expect(getByText("E")).toBeTruthy();
      expect(getByText("G")).toBeTruthy();
      expect(getByText("A")).toBeTruthy();
    });

    it("changes octave pair when selector pressed", () => {
      const { getByText, getByLabelText } = render(
        <OctaveConceptExercise {...defaultProps} />,
      );
      goToListen(getByText);
      fireEvent.press(getByLabelText("Select D octave"));
      expect(getByText("Low D")).toBeTruthy();
      expect(getByText("High D")).toBeTruthy();
    });

    it("has quiz button", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      goToListen(getByText);
      expect(getByText("Got it! Quiz me →")).toBeTruthy();
    });

    it("proceeds to quiz when quiz button pressed", () => {
      const { getByText, queryByText } = render(
        <OctaveConceptExercise {...defaultProps} />,
      );
      goToListen(getByText);
      fireEvent.press(getByText("Got it! Quiz me →"));
      expect(queryByText("Question 1 of 3")).toBeTruthy();
    });
  });

  // ==========================================================================
  // QUIZ PHASE TESTS
  // ==========================================================================
  describe("Quiz Phase", () => {
    const goToQuiz = (getByText: ReturnType<typeof render>["getByText"]) => {
      fireEvent.press(getByText("Hear It →"));
      fireEvent.press(getByText("Got it! Quiz me →"));
    };

    it("shows quiz progress", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      goToQuiz(getByText);
      expect(getByText("Question 1 of 3")).toBeTruthy();
    });

    it("displays first quiz question", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      goToQuiz(getByText);
      expect(getByText(/Notes that are an octave apart/)).toBeTruthy();
    });

    it("displays answer options", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      goToQuiz(getByText);
      expect(getByText("Letter name")).toBeTruthy();
      expect(getByText("Frequency")).toBeTruthy();
    });

    it("handles correct answer selection", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      goToQuiz(getByText);
      fireEvent.press(getByText("Letter name"));
      expect(getByText("✓ Correct!")).toBeTruthy();
    });

    it("handles incorrect answer selection", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      goToQuiz(getByText);
      fireEvent.press(getByText("Frequency"));
      expect(getByText(/✗ The answer is: Letter name/)).toBeTruthy();
    });

    it("proceeds to next question after delay", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      goToQuiz(getByText);
      fireEvent.press(getByText("Letter name"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(getByText("Question 2 of 3")).toBeTruthy();
    });

    it("shows second question about C notes", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      goToQuiz(getByText);
      fireEvent.press(getByText("Letter name"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(getByText(/If you play C/)).toBeTruthy();
    });

    it("proceeds to results after last question", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      goToQuiz(getByText);
      // Q1
      fireEvent.press(getByText("Letter name"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      // Q2
      fireEvent.press(getByText("Both called C"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      // Q3
      fireEvent.press(getByText("The same note, higher/lower"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(getByText("You understand octaves!")).toBeTruthy();
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
      fireEvent.press(getByText("Hear It →"));
      fireEvent.press(getByText("Got it! Quiz me →"));
      // Answer all 3 questions
      fireEvent.press(getByText(allCorrect ? "Letter name" : "Frequency"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      fireEvent.press(getByText("Both called C"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      fireEvent.press(getByText("The same note, higher/lower"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });
    };

    it("shows perfect score title", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      goToResult(getByText, true);
      expect(getByText("You understand octaves!")).toBeTruthy();
    });

    it("shows review title when not perfect", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      goToResult(getByText, false);
      expect(getByText("Let's review")).toBeTruthy();
    });

    it("displays score", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      goToResult(getByText, true);
      expect(getByText("3 / 3 correct")).toBeTruthy();
    });

    it("shows celebration emoji on success", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      goToResult(getByText, true);
      expect(getByText("🎉")).toBeTruthy();
    });

    it("shows book emoji on failure", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      goToResult(getByText, false);
      expect(getByText("📚")).toBeTruthy();
    });

    it("has Continue button on success", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      goToResult(getByText, true);
      expect(getByText("Continue →")).toBeTruthy();
    });

    it("has Try Again button on failure", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      goToResult(getByText, false);
      expect(getByText("Try Again")).toBeTruthy();
    });

    it("calls onComplete when Continue pressed", () => {
      const { getByText } = render(<OctaveConceptExercise {...defaultProps} />);
      goToResult(getByText, true);
      fireEvent.press(getByText("Continue →"));
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // AUDIO CONTEXT TESTS
  // ==========================================================================
  describe("Audio Context", () => {
    it("closes audio context on unmount", () => {
      const { unmount } = render(<OctaveConceptExercise {...defaultProps} />);
      unmount();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================
  describe("Edge Cases", () => {
    it("handles missing callbacks gracefully", () => {
      const { getByText } = render(
        <OctaveConceptExercise
          mini={{}}
          sessionState={{}}
          onComplete={undefined}
          onCancel={undefined}
        />,
      );
      expect(getByText("The Octave")).toBeTruthy();
    });
  });
});
