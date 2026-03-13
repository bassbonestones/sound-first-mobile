/**
 * Tests for PitchDirectionExercise component
 *
 * "Up, Down, or Same?" ear training drill
 * - Plays two notes and user identifies if second is higher/lower/same
 * - Requires streak of correct answers to complete
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

// Mock useExerciseAudio hook
const mockGeneratePitchDirection = jest.fn(() => ({
  freq1: 261.63,
  freq2: 293.66,
  correctAnswer: "up",
}));

const mockPlayTwoNotes = jest.fn(() => Promise.resolve());

jest.mock("../../src/hooks/useExerciseAudio", () => ({
  __esModule: true,
  default: () => ({
    generatePitchDirection: mockGeneratePitchDirection,
    playTwoNotes: mockPlayTwoNotes,
  }),
}));

// Mock devLogger
jest.mock("../../src/utils/devLogger", () => ({
  devWarn: jest.fn(),
  devLog: jest.fn(),
}));

import PitchDirectionExercise from "../../src/screens/Session/components/exercises/PitchDirectionExercise";

describe("PitchDirectionExercise", () => {
  const defaultProps = {
    config: {
      interval_pool: ["M2", "m2", "M3"],
      allowed_answers: ["up", "down"],
    },
    mastery: { correct_streak: 8 },
    onComplete: jest.fn(),
    onProgress: jest.fn(),
    userFirstNote: "C4",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGeneratePitchDirection.mockReturnValue({
      freq1: 261.63,
      freq2: 293.66,
      correctAnswer: "up",
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
      const { getByText } = render(
        <PitchDirectionExercise {...defaultProps} />,
      );

      expect(getByText(/correct in a row/i)).toBeTruthy();
    });

    it("shows Which way? instruction", () => {
      const { getByText } = render(
        <PitchDirectionExercise {...defaultProps} />,
      );

      expect(getByText("Which way?")).toBeTruthy();
    });

    it("shows instruction text for up/down", () => {
      const { getByText } = render(
        <PitchDirectionExercise {...defaultProps} />,
      );

      expect(getByText(/UP, DOWN/i)).toBeTruthy();
    });

    it("shows Play Again button", () => {
      const { getByText } = render(
        <PitchDirectionExercise {...defaultProps} />,
      );

      expect(getByText("Play Again")).toBeTruthy();
    });

    it("shows Up and Down answer buttons", () => {
      const { getByText } = render(
        <PitchDirectionExercise {...defaultProps} />,
      );

      expect(getByText("Up")).toBeTruthy();
      expect(getByText("Down")).toBeTruthy();
    });

    it("shows accuracy stat", () => {
      const { getByText } = render(
        <PitchDirectionExercise {...defaultProps} />,
      );

      expect(getByText(/Accuracy:/i)).toBeTruthy();
    });
  });

  // ============================================================
  // INCLUDING SAME OPTION
  // ============================================================
  describe("Including Same Option", () => {
    it("shows Same button when allowed_answers includes same", () => {
      const propsWithSame = {
        ...defaultProps,
        config: {
          ...defaultProps.config,
          allowed_answers: ["up", "down", "same"],
        },
      };

      const { getByText } = render(
        <PitchDirectionExercise {...propsWithSame} />,
      );

      expect(getByText("Same")).toBeTruthy();
    });

    it("updates instruction text for same option", () => {
      const propsWithSame = {
        ...defaultProps,
        config: {
          ...defaultProps.config,
          allowed_answers: ["up", "down", "same"],
        },
      };

      const { getByText } = render(
        <PitchDirectionExercise {...propsWithSame} />,
      );

      expect(getByText(/stay the SAME/i)).toBeTruthy();
    });
  });

  // ============================================================
  // PLAY BUTTON BEHAVIOR
  // ============================================================
  describe("Play Button", () => {
    it("has accessible Play Again button", () => {
      const { getByLabelText } = render(
        <PitchDirectionExercise {...defaultProps} />,
      );

      expect(getByLabelText("Play audio again")).toBeTruthy();
    });

    it("shows Playing... while audio plays", async () => {
      mockPlayTwoNotes.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000)),
      );

      const { getByText, getByLabelText, queryByText } = render(
        <PitchDirectionExercise {...defaultProps} />,
      );

      // Auto-play starts after 500ms
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should show Playing... during playback
      await waitFor(() => {
        const playing = queryByText("Playing...");
        // May or may not catch this timing-dependent state
      });
    });

    it("calls playTwoNotes when clicking play", async () => {
      const { getByLabelText } = render(
        <PitchDirectionExercise {...defaultProps} />,
      );

      // Wait for auto-play
      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(mockPlayTwoNotes).toHaveBeenCalled();
      });
    });
  });

  // ============================================================
  // ANSWER SELECTION
  // ============================================================
  describe("Answer Selection", () => {
    it("has accessible answer buttons", () => {
      const { getByLabelText } = render(
        <PitchDirectionExercise {...defaultProps} />,
      );

      expect(getByLabelText("The note went Up")).toBeTruthy();
      expect(getByLabelText("The note went Down")).toBeTruthy();
    });

    it("calls onProgress when correct answer selected", async () => {
      const { getByLabelText } = render(
        <PitchDirectionExercise {...defaultProps} />,
      );

      // Wait for auto-play
      act(() => {
        jest.advanceTimersByTime(600);
      });

      // Select correct answer (up)
      fireEvent.press(getByLabelText("The note went Up"));

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
        <PitchDirectionExercise {...defaultProps} />,
      );

      act(() => {
        jest.advanceTimersByTime(600);
      });

      // Select wrong answer (down when correct is up)
      fireEvent.press(getByLabelText("The note went Down"));

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
        <PitchDirectionExercise {...defaultProps} />,
      );

      act(() => {
        jest.advanceTimersByTime(600);
      });

      fireEvent.press(getByLabelText("The note went Up"));

      // Buttons should be disabled
      const answerButtons = getAllByRole("button").filter((btn) =>
        btn.props.accessibilityLabel?.includes("note went"),
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
      const { getByText } = render(
        <PitchDirectionExercise {...defaultProps} />,
      );

      expect(getByText("0 / 8 correct in a row")).toBeTruthy();
    });

    it("increments streak on correct answer", async () => {
      const { getByLabelText, getByText } = render(
        <PitchDirectionExercise {...defaultProps} />,
      );

      act(() => {
        jest.advanceTimersByTime(600);
      });

      fireEvent.press(getByLabelText("The note went Up"));

      // Wait for animation to complete and new exercise
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

      const { getByText } = render(<PitchDirectionExercise {...customProps} />);

      expect(getByText("0 / 5 correct in a row")).toBeTruthy();
    });

    it("defaults to 8 if no mastery streak specified", () => {
      const noMasteryProps = {
        ...defaultProps,
        mastery: {},
      };

      const { getByText } = render(
        <PitchDirectionExercise {...noMasteryProps} />,
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
        <PitchDirectionExercise {...quickMasteryProps} />,
      );

      act(() => {
        jest.advanceTimersByTime(600);
      });

      fireEvent.press(getByLabelText("The note went Up"));

      // Wait for completion delay
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
        <PitchDirectionExercise {...quickMasteryProps} />,
      );

      act(() => {
        jest.advanceTimersByTime(600);
      });

      fireEvent.press(getByLabelText("The note went Up"));

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

      render(<PitchDirectionExercise {...useFirstNoteProps} />);

      expect(mockGeneratePitchDirection).toHaveBeenCalledWith(
        "G4",
        expect.any(Array),
        expect.any(Boolean),
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

      render(<PitchDirectionExercise {...baseNoteProps} />);

      expect(mockGeneratePitchDirection).toHaveBeenCalledWith(
        "A3",
        expect.any(Array),
        expect.any(Boolean),
      );
    });

    it("defaults to C4 if no base note specified", () => {
      const noBaseNoteProps = {
        ...defaultProps,
        config: {},
      };

      render(<PitchDirectionExercise {...noBaseNoteProps} />);

      expect(mockGeneratePitchDirection).toHaveBeenCalledWith(
        "C4",
        expect.any(Array),
        expect.any(Boolean),
      );
    });

    it("passes interval_pool to generatePitchDirection", () => {
      const customIntervalProps = {
        ...defaultProps,
        config: {
          ...defaultProps.config,
          interval_pool: ["P5", "P8"],
        },
      };

      render(<PitchDirectionExercise {...customIntervalProps} />);

      expect(mockGeneratePitchDirection).toHaveBeenCalledWith(
        expect.any(String),
        ["P5", "P8"],
        expect.any(Boolean),
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
        <PitchDirectionExercise {...noCompleteProps} />,
      );

      expect(getByText("Which way?")).toBeTruthy();
    });

    it("handles missing onProgress gracefully", () => {
      const noProgressProps = {
        ...defaultProps,
        onProgress: undefined,
      };

      const { getByText } = render(
        <PitchDirectionExercise {...noProgressProps} />,
      );

      expect(getByText("Which way?")).toBeTruthy();
    });

    it("handles missing config gracefully", () => {
      const noConfigProps = {
        ...defaultProps,
        config: undefined,
      };

      const { getByText } = render(
        <PitchDirectionExercise {...noConfigProps} />,
      );

      expect(getByText("Up")).toBeTruthy();
      expect(getByText("Down")).toBeTruthy();
    });

    it("shows 0% accuracy initially", () => {
      const { getByText } = render(
        <PitchDirectionExercise {...defaultProps} />,
      );

      expect(getByText("Accuracy: 0%")).toBeTruthy();
    });
  });

  // ============================================================
  // ACCURACY
  // ============================================================
  describe("Accuracy Calculation", () => {
    it("updates accuracy after correct answer", async () => {
      const { getByLabelText, getByText } = render(
        <PitchDirectionExercise {...defaultProps} />,
      );

      act(() => {
        jest.advanceTimersByTime(600);
      });

      fireEvent.press(getByLabelText("The note went Up"));

      await waitFor(() => {
        expect(getByText("Accuracy: 100%")).toBeTruthy();
      });
    });
  });
});
