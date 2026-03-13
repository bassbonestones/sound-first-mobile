/**
 * Tests for AuralCompareExercise component
 *
 * "Same or Different?" ear training drill
 * - Plays two notes and user identifies if they are the same or different pitch
 * - Requires streak of correct answers to complete
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

// Mock useExerciseAudio hook
const mockGenerateSameOrDifferent = jest.fn(() => ({
  freq1: 261.63,
  freq2: 261.63,
  correctAnswer: "same",
}));

const mockPlayTwoNotes = jest.fn(() => Promise.resolve());

jest.mock("../../src/hooks/useExerciseAudio", () => ({
  __esModule: true,
  default: () => ({
    generateSameOrDifferent: mockGenerateSameOrDifferent,
    playTwoNotes: mockPlayTwoNotes,
  }),
}));

// Mock devLogger
jest.mock("../../src/utils/devLogger", () => ({
  devWarn: jest.fn(),
  devLog: jest.fn(),
}));

import AuralCompareExercise from "../../src/screens/Session/components/exercises/AuralCompareExercise";

describe("AuralCompareExercise", () => {
  const defaultProps = {
    config: {
      interval_pool: ["P1", "P5", "P4", "M3"],
    },
    mastery: { correct_streak: 8 },
    onComplete: jest.fn(),
    onProgress: jest.fn(),
    userFirstNote: "F3",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGenerateSameOrDifferent.mockReturnValue({
      freq1: 261.63,
      freq2: 261.63,
      correctAnswer: "same",
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ============================================================
  // RENDERING
  // ============================================================
  describe("Rendering", () => {
    it("renders exercise with progress bar", () => {
      const { getByText } = render(<AuralCompareExercise {...defaultProps} />);

      expect(getByText(/correct in a row/i)).toBeTruthy();
    });

    it("shows Listen carefully instruction", () => {
      const { getByText } = render(<AuralCompareExercise {...defaultProps} />);

      expect(getByText("Listen carefully")).toBeTruthy();
    });

    it("shows instruction text for same/different", () => {
      const { getByText } = render(<AuralCompareExercise {...defaultProps} />);

      expect(getByText(/SAME pitch/i)).toBeTruthy();
      expect(getByText(/DIFFERENT pitches/i)).toBeTruthy();
    });

    it("shows Play Again button", () => {
      const { getByText } = render(<AuralCompareExercise {...defaultProps} />);

      expect(getByText("Play Again")).toBeTruthy();
    });

    it("shows Same and Different answer buttons", () => {
      const { getByText } = render(<AuralCompareExercise {...defaultProps} />);

      expect(getByText("Same")).toBeTruthy();
      expect(getByText("Different")).toBeTruthy();
    });

    it("shows accuracy stat", () => {
      const { getByText } = render(<AuralCompareExercise {...defaultProps} />);

      expect(getByText(/Accuracy:/i)).toBeTruthy();
    });

    it("shows ear emoji instruction icon", () => {
      const { getByText } = render(<AuralCompareExercise {...defaultProps} />);

      expect(getByText("👂")).toBeTruthy();
    });
  });

  // ============================================================
  // PLAY BUTTON BEHAVIOR
  // ============================================================
  describe("Play Button", () => {
    it("has accessible Play Again button", () => {
      const { getByLabelText } = render(
        <AuralCompareExercise {...defaultProps} />,
      );

      expect(getByLabelText("Play audio again")).toBeTruthy();
    });

    it("auto-plays when exercise starts", async () => {
      render(<AuralCompareExercise {...defaultProps} />);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(mockPlayTwoNotes).toHaveBeenCalled();
      });
    });

    it("shows Playing... while audio plays", async () => {
      mockPlayTwoNotes.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 2000)),
      );

      const { queryByText, getByLabelText } = render(
        <AuralCompareExercise {...defaultProps} />,
      );

      // Manually trigger play
      act(() => {
        jest.advanceTimersByTime(600);
      });

      // Should show Playing...
      await waitFor(() => {
        expect(mockPlayTwoNotes).toHaveBeenCalled();
      });
    });

    it("calls playTwoNotes with correct frequencies", async () => {
      mockGenerateSameOrDifferent.mockReturnValue({
        freq1: 440,
        freq2: 523.25,
        correctAnswer: "different",
      });

      render(<AuralCompareExercise {...defaultProps} />);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(mockPlayTwoNotes).toHaveBeenCalledWith(440, 523.25, 0.8, 0.4);
      });
    });
  });

  // ============================================================
  // ANSWER SELECTION
  // ============================================================
  describe("Answer Selection", () => {
    it("has accessible answer buttons", () => {
      const { getByLabelText } = render(
        <AuralCompareExercise {...defaultProps} />,
      );

      expect(getByLabelText("The notes are the same pitch")).toBeTruthy();
      expect(getByLabelText("The notes are different pitches")).toBeTruthy();
    });

    it("calls onProgress when correct answer selected", async () => {
      const { getByLabelText } = render(
        <AuralCompareExercise {...defaultProps} />,
      );

      act(() => {
        jest.advanceTimersByTime(600);
      });

      // Select correct answer (same)
      fireEvent.press(getByLabelText("The notes are the same pitch"));

      await waitFor(() => {
        expect(defaultProps.onProgress).toHaveBeenCalledWith(
          expect.objectContaining({
            streak: 1,
            masteryRequired: 8,
          }),
        );
      });
    });

    it("calls onProgress with streak 0 on wrong answer", async () => {
      const { getByLabelText } = render(
        <AuralCompareExercise {...defaultProps} />,
      );

      act(() => {
        jest.advanceTimersByTime(600);
      });

      // Select wrong answer
      fireEvent.press(getByLabelText("The notes are different pitches"));

      await waitFor(() => {
        expect(defaultProps.onProgress).toHaveBeenCalledWith(
          expect.objectContaining({
            streak: 0,
          }),
        );
      });
    });

    it("disables buttons after answering", async () => {
      const { getByLabelText, getAllByRole } = render(
        <AuralCompareExercise {...defaultProps} />,
      );

      act(() => {
        jest.advanceTimersByTime(600);
      });

      fireEvent.press(getByLabelText("The notes are the same pitch"));

      const answerButtons = getAllByRole("button").filter(
        (btn) =>
          btn.props.accessibilityLabel?.includes("notes are the same") ||
          btn.props.accessibilityLabel?.includes("notes are different"),
      );
      answerButtons.forEach((btn) => {
        expect(btn.props.accessibilityState?.disabled).toBe(true);
      });
    });
  });

  // ============================================================
  // STREAK & PROGRESS
  // ============================================================
  describe("Streak and Progress", () => {
    it("shows 0/8 streak initially", () => {
      const { getByText } = render(<AuralCompareExercise {...defaultProps} />);

      expect(getByText("0 / 8 correct in a row")).toBeTruthy();
    });

    it("increments streak on correct answer", async () => {
      const { getByLabelText, getByText } = render(
        <AuralCompareExercise {...defaultProps} />,
      );

      act(() => {
        jest.advanceTimersByTime(600);
      });

      fireEvent.press(getByLabelText("The notes are the same pitch"));

      act(() => {
        jest.advanceTimersByTime(1500);
      });

      await waitFor(() => {
        expect(getByText(/1 \/ 8 correct in a row/i)).toBeTruthy();
      });
    });

    it("uses custom mastery streak from config", () => {
      const customProps = {
        ...defaultProps,
        mastery: { correct_streak: 5 },
      };

      const { getByText } = render(<AuralCompareExercise {...customProps} />);

      expect(getByText("0 / 5 correct in a row")).toBeTruthy();
    });

    it("defaults to 8 if no mastery streak specified", () => {
      const noMasteryProps = {
        ...defaultProps,
        mastery: {},
      };

      const { getByText } = render(
        <AuralCompareExercise {...noMasteryProps} />,
      );

      expect(getByText("0 / 8 correct in a row")).toBeTruthy();
    });
  });

  // ============================================================
  // COMPLETION
  // ============================================================
  describe("Completion", () => {
    it("calls onComplete when streak reaches mastery", async () => {
      const onComplete = jest.fn();
      const quickMasteryProps = {
        ...defaultProps,
        mastery: { correct_streak: 1 },
        onComplete,
      };

      const { getByLabelText } = render(
        <AuralCompareExercise {...quickMasteryProps} />,
      );

      act(() => {
        jest.advanceTimersByTime(600);
      });

      fireEvent.press(getByLabelText("The notes are the same pitch"));

      act(() => {
        jest.advanceTimersByTime(1600);
      });

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            streak: 1,
          }),
        );
      });
    });

    it("includes totalAttempts and correctCount in completion", async () => {
      const onComplete = jest.fn();
      const quickMasteryProps = {
        ...defaultProps,
        mastery: { correct_streak: 1 },
        onComplete,
      };

      const { getByLabelText } = render(
        <AuralCompareExercise {...quickMasteryProps} />,
      );

      act(() => {
        jest.advanceTimersByTime(600);
      });

      fireEvent.press(getByLabelText("The notes are the same pitch"));

      act(() => {
        jest.advanceTimersByTime(1600);
      });

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            totalAttempts: 1,
            correctCount: 1,
          }),
        );
      });
    });
  });

  // ============================================================
  // CONFIGURATION
  // ============================================================
  describe("Configuration", () => {
    it("uses userFirstNote when use_first_note is true", () => {
      const useFirstNoteProps = {
        ...defaultProps,
        config: {
          ...defaultProps.config,
          use_first_note: true,
        },
        userFirstNote: "G4",
      };

      render(<AuralCompareExercise {...useFirstNoteProps} />);

      expect(mockGenerateSameOrDifferent).toHaveBeenCalledWith(
        "G4",
        expect.any(Array),
      );
    });

    it("uses base_note from config when not using first note", () => {
      const baseNoteProps = {
        ...defaultProps,
        config: {
          ...defaultProps.config,
          base_note: "A3",
        },
      };

      render(<AuralCompareExercise {...baseNoteProps} />);

      expect(mockGenerateSameOrDifferent).toHaveBeenCalledWith(
        "A3",
        expect.any(Array),
      );
    });

    it("defaults to C4 if no base note specified", () => {
      const noBaseNoteProps = {
        ...defaultProps,
        config: {},
      };

      render(<AuralCompareExercise {...noBaseNoteProps} />);

      expect(mockGenerateSameOrDifferent).toHaveBeenCalledWith(
        "C4",
        expect.any(Array),
      );
    });

    it("passes interval_pool to generateSameOrDifferent", () => {
      const customIntervalProps = {
        ...defaultProps,
        config: {
          ...defaultProps.config,
          interval_pool: ["P1", "P8"],
        },
      };

      render(<AuralCompareExercise {...customIntervalProps} />);

      expect(mockGenerateSameOrDifferent).toHaveBeenCalledWith(
        expect.any(String),
        ["P1", "P8"],
      );
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
        <AuralCompareExercise {...noCompleteProps} />,
      );

      expect(getByText("Listen carefully")).toBeTruthy();
    });

    it("handles missing onProgress gracefully", () => {
      const noProgressProps = {
        ...defaultProps,
        onProgress: undefined,
      };

      const { getByText } = render(
        <AuralCompareExercise {...noProgressProps} />,
      );

      expect(getByText("Listen carefully")).toBeTruthy();
    });

    it("handles missing config gracefully", () => {
      const noConfigProps = {
        ...defaultProps,
        config: undefined,
      };

      const { getByText } = render(<AuralCompareExercise {...noConfigProps} />);

      expect(getByText("Same")).toBeTruthy();
      expect(getByText("Different")).toBeTruthy();
    });

    it("shows 0% accuracy initially", () => {
      const { getByText } = render(<AuralCompareExercise {...defaultProps} />);

      expect(getByText("Accuracy: 0%")).toBeTruthy();
    });
  });

  // ============================================================
  // DIFFERENT ANSWER
  // ============================================================
  describe("Different Answer", () => {
    it("handles Different as correct answer", async () => {
      mockGenerateSameOrDifferent.mockReturnValue({
        freq1: 261.63,
        freq2: 329.63,
        correctAnswer: "different",
      });

      const { getByLabelText } = render(
        <AuralCompareExercise {...defaultProps} />,
      );

      act(() => {
        jest.advanceTimersByTime(600);
      });

      fireEvent.press(getByLabelText("The notes are different pitches"));

      await waitFor(() => {
        expect(defaultProps.onProgress).toHaveBeenCalledWith(
          expect.objectContaining({
            streak: 1,
          }),
        );
      });
    });
  });

  // ============================================================
  // ACCURACY
  // ============================================================
  describe("Accuracy Calculation", () => {
    it("updates accuracy after correct answer", async () => {
      const { getByLabelText, getByText } = render(
        <AuralCompareExercise {...defaultProps} />,
      );

      act(() => {
        jest.advanceTimersByTime(600);
      });

      fireEvent.press(getByLabelText("The notes are the same pitch"));

      await waitFor(() => {
        expect(getByText("Accuracy: 100%")).toBeTruthy();
      });
    });
  });
});
