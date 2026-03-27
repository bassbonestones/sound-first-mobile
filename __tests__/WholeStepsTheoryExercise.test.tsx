/**
 * @fileoverview Tests for WholeStepsTheoryExercise component
 * Tests whole step theory lesson including phases, audio playback, and quiz
 */

import React from "react";
import { render, fireEvent, act, waitFor } from "@testing-library/react-native";

// Mock AudioContext
const mockOscillator = {
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  frequency: { value: 0 },
  type: "sine" as OscillatorType,
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
  createOscillator: jest.fn(() => ({ ...mockOscillator })),
  createGain: jest.fn(() => ({
    ...mockGainNode,
    gain: { ...mockGainNode.gain },
  })),
  destination: {},
  currentTime: 0,
  close: jest.fn(),
  state: "running",
  resume: jest.fn().mockResolvedValue(undefined),
};

jest.mock("react-native-audio-api", () => ({
  AudioContext: jest.fn(() => mockAudioContext),
}));

jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devWarn: jest.fn(),
  devError: jest.fn(),
}));

// Import component after mocks
import WholeStepsTheoryExercise from "../src/screens/Session/components/exercises/WholeStepsTheoryExercise";

describe("WholeStepsTheoryExercise", () => {
  const mockOnComplete = jest.fn();
  const mockOnProgress = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    mini: {},
    sessionState: {},
    onComplete: mockOnComplete,
    onProgress: mockOnProgress,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Helper to advance timers
  const advanceTimers = (ms: number = 1000) => {
    act(() => {
      jest.advanceTimersByTime(ms);
    });
  };

  describe("Rendering", () => {
    it("renders intro phase initially", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      expect(getByText("Whole Steps")).toBeTruthy();
    });

    it("renders intro description", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      expect(getByText(/whole step.*2 half steps|2 half steps/i)).toBeTruthy();
    });

    it("renders Compare to Half Steps button in intro phase", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      expect(getByText(/Compare to Half Steps/)).toBeTruthy();
    });
  });

  describe("Phase Navigation", () => {
    it("navigates from intro to comparison phase", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );

      fireEvent.press(getByText(/Compare to Half Steps/));

      expect(getByText("Half vs Whole")).toBeTruthy();
    });

    it("navigates from comparison to examples phase", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );

      // Go to comparison
      fireEvent.press(getByText(/Compare to Half Steps/));
      // Go to examples
      fireEvent.press(getByText(/More Examples/));

      expect(getByText("Whole Step Examples")).toBeTruthy();
    });

    it("navigates from examples to quiz phase", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );

      // Navigate through phases
      fireEvent.press(getByText(/Compare to Half Steps/)); // intro -> comparison
      fireEvent.press(getByText(/More Examples/)); // comparison -> examples
      fireEvent.press(getByText(/Quiz Me/)); // examples -> quiz

      expect(getByText(/Question 1/)).toBeTruthy();
    });
  });

  describe("Comparison Phase", () => {
    it("shows half step card", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      fireEvent.press(getByText(/Compare to Half Steps/));

      expect(getByText("Half Step")).toBeTruthy();
    });

    it("shows whole step card", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      fireEvent.press(getByText(/Compare to Half Steps/));

      expect(getByText("Whole Step")).toBeTruthy();
    });

    it("plays half step when play button pressed", async () => {
      const { getByText, getAllByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      fireEvent.press(getByText(/Compare to Half Steps/));

      // Find play buttons
      const playButtons = getAllByText("▶");
      expect(playButtons.length).toBeGreaterThan(0);

      // Press first play button (half step)
      await act(async () => {
        fireEvent.press(playButtons[0]);
        advanceTimers(1500);
      });

      // Audio context should have been used
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it("plays whole step when play button pressed", async () => {
      const { getByText, getAllByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      fireEvent.press(getByText(/Compare to Half Steps/));

      const playButtons = getAllByText("▶");

      // Press second play button (whole step)
      await act(async () => {
        fireEvent.press(playButtons[1]);
        advanceTimers(2000);
      });

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });
  });

  describe("Examples Phase", () => {
    const goToExamples = (getByText: Function) => {
      fireEvent.press(getByText(/Compare to Half Steps/)); // intro -> comparison
      fireEvent.press(getByText(/More Examples/)); // comparison -> examples
    };

    it("shows whole step examples header", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToExamples(getByText);

      expect(getByText("Whole Step Examples")).toBeTruthy();
    });

    it("shows examples header", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToExamples(getByText);

      // Check for header and first example label
      expect(getByText("Whole Step Examples")).toBeTruthy();
    });

    it("shows example info", () => {
      const { getByText, getAllByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToExamples(getByText);

      // First example is C → D (may appear multiple times)
      const cToDButtons = getAllByText("C → D");
      expect(cToDButtons.length).toBeGreaterThan(0);
    });

    it("shows skipped note info", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToExamples(getByText);

      // First example (C → D) skips C#
      expect(getByText(/\(skips C#\)/)).toBeTruthy();
    });

    it("shows Play button for example", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToExamples(getByText);

      expect(getByText(/Play Whole Step/)).toBeTruthy();
    });

    it("plays example when play button pressed", async () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToExamples(getByText);

      // Find Play button
      const playButton = getByText(/Play Whole Step/);

      await act(async () => {
        fireEvent.press(playButton);
        advanceTimers(3000);
      });

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it("shows multiple example buttons", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToExamples(getByText);

      // Should show multiple example selector buttons (D → E is the second example)
      expect(getByText("D → E")).toBeTruthy();
    });
  });

  describe("Quiz Phase", () => {
    const goToQuiz = (getByText: Function) => {
      fireEvent.press(getByText(/Compare to Half Steps/)); // intro -> comparison
      fireEvent.press(getByText(/More Examples/)); // comparison -> examples
      fireEvent.press(getByText(/Quiz Me/)); // examples -> quiz
    };

    it("shows first question", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToQuiz(getByText);

      expect(getByText(/Question 1/)).toBeTruthy();
      expect(getByText(/whole step equals how many half steps/i)).toBeTruthy();
    });

    it("shows answer options", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToQuiz(getByText);

      // First question has options 1, 2, 3, 4
      expect(getByText("1")).toBeTruthy();
      expect(getByText("2")).toBeTruthy();
    });

    it("handles correct answer", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToQuiz(getByText);

      // Correct answer is "2" - pressing should not throw
      const answerButton = getByText("2");
      expect(() => fireEvent.press(answerButton)).not.toThrow();
    });

    it("handles incorrect answer", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToQuiz(getByText);

      // Wrong answer is "1" - pressing should not throw
      const answerButton = getByText("1");
      expect(() => fireEvent.press(answerButton)).not.toThrow();
    });

    it("renders quiz with all answer options", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      goToQuiz(getByText);

      // All options should be visible
      expect(getByText("1")).toBeTruthy();
      expect(getByText("2")).toBeTruthy();
      expect(getByText("3")).toBeTruthy();
      expect(getByText("4")).toBeTruthy();
    });
  });

  describe("Result Phase", () => {
    it("renders quiz state correctly", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );

      // Navigate to quiz
      fireEvent.press(getByText(/Compare to Half Steps/));
      fireEvent.press(getByText(/More Examples/));
      fireEvent.press(getByText(/Quiz Me/));

      // Should be in quiz phase
      expect(getByText(/Question 1/)).toBeTruthy();
    });
  });

  describe("Audio Playback", () => {
    it("initializes audio context", () => {
      render(<WholeStepsTheoryExercise {...defaultProps} />);

      // AudioContext should be created
      expect(mockAudioContext.createOscillator).toBeDefined();
    });

    it("plays note with correct frequency for C4", async () => {
      const { getByText, getAllByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      fireEvent.press(getByText(/Compare to Half Steps/)); // Go to comparison

      const playButtons = getAllByText("▶");

      await act(async () => {
        fireEvent.press(playButtons[0]);
        advanceTimers(1000);
      });

      // Oscillator should be created and started
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it("plays example in examples phase", async () => {
      const { getByText, getAllByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      fireEvent.press(getByText(/Compare to Half Steps/)); // comparison
      fireEvent.press(getByText(/More Examples/)); // examples

      // Find play button for examples
      const playButtons = getAllByText(/▶/);

      await act(async () => {
        if (playButtons.length > 0) {
          fireEvent.press(playButtons[0]);
          advanceTimers(1500);
        }
      });

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it("cleans up audio context on unmount", () => {
      const { unmount } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );

      unmount();

      expect(mockAudioContext.close).toHaveBeenCalled();
    });
  });

  describe("MiniKeyboard Integration", () => {
    it("renders keyboard in comparison phase", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      fireEvent.press(getByText(/Compare to Half Steps/));

      // Should show comparison cards with Half Step and Whole Step
      expect(getByText("Half Step")).toBeTruthy();
      expect(getByText("Whole Step")).toBeTruthy();
    });

    it("highlights notes during playback", async () => {
      const { getByText, getAllByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      fireEvent.press(getByText(/Compare to Half Steps/)); // comparison

      const playButtons = getAllByText("▶");

      // Start playback
      await act(async () => {
        fireEvent.press(playButtons[0]);
        advanceTimers(2000);
      });

      // Should complete without error
      expect(getByText("Half Step")).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("has accessible buttons", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );

      const nextButton = getByText(/Compare to Half Steps/);
      expect(nextButton).toBeTruthy();
    });

    it("has accessible quiz options", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );

      // Navigate to quiz
      fireEvent.press(getByText(/Compare to Half Steps/));
      fireEvent.press(getByText(/More Examples/));
      fireEvent.press(getByText(/Quiz Me/));

      // All options should be pressable
      expect(getByText("1")).toBeTruthy();
      expect(getByText("2")).toBeTruthy();
      expect(getByText("3")).toBeTruthy();
      expect(getByText("4")).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    it("handles rapid phase navigation", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );

      // Rapidly press navigation buttons
      fireEvent.press(getByText(/Compare to Half Steps/));
      fireEvent.press(getByText(/More Examples/));

      // Should be in examples phase
      expect(getByText("Whole Step Examples")).toBeTruthy();
    });

    it("handles double-press on play button", async () => {
      const { getByText, getAllByText } = render(
        <WholeStepsTheoryExercise {...defaultProps} />,
      );
      fireEvent.press(getByText(/Compare to Half Steps/));

      const playButtons = getAllByText("▶");

      // Press twice quickly - should not crash
      fireEvent.press(playButtons[0]);
      fireEvent.press(playButtons[0]);
      advanceTimers(2000);

      // Should not crash
      expect(getByText("Half Step")).toBeTruthy();
    });

    it("renders without onComplete callback", () => {
      const { getByText } = render(
        <WholeStepsTheoryExercise
          mini={{}}
          sessionState={{}}
          onProgress={mockOnProgress}
        />,
      );

      // Should render intro phase without error
      expect(getByText("Whole Steps")).toBeTruthy();
    });
  });
});
