/**
 * Tests for ContourCopyExercise component
 *
 * "Follow the Contour" ear training drill
 * - Plays 3-note melody and asks user to identify the shape
 * - Shapes: up-up, up-down, down-up, down-down
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

// Mock useExerciseAudio hook
const mockPlayNote = jest.fn(() => Promise.resolve());
const mockNoteToFrequency = jest.fn(() => 261.63);

jest.mock("../../src/hooks/useExerciseAudio", () => ({
  __esModule: true,
  default: () => ({
    playNote: mockPlayNote,
    noteToFrequency: mockNoteToFrequency,
  }),
}));

// Mock devLogger
jest.mock("../../src/utils/devLogger", () => ({
  devWarn: jest.fn(),
  devLog: jest.fn(),
}));

// Mock Math.random for predictable tests
const mockMathRandom = jest.spyOn(Math, "random");

import ContourCopyExercise from "../../src/screens/Session/components/exercises/ContourCopyExercise";

describe("ContourCopyExercise", () => {
  const defaultProps = {
    config: {
      interval_pool: ["M2", "m2", "M3", "P4"],
    },
    mastery: { correct_streak: 8 },
    onComplete: jest.fn(),
    onProgress: jest.fn(),
    userFirstNote: "F3",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Default to generating "up-up" contour (shape index 0)
    mockMathRandom.mockReturnValue(0);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ============================================================
  // RENDERING
  // ============================================================
  describe("Rendering", () => {
    it("renders exercise with progress bar", () => {
      const { getByText } = render(<ContourCopyExercise {...defaultProps} />);

      expect(getByText(/in a row/i)).toBeTruthy();
    });

    it("shows What's the shape? question", () => {
      const { getByText } = render(<ContourCopyExercise {...defaultProps} />);

      expect(getByText("What's the shape?")).toBeTruthy();
    });

    it("shows Listen to 3 notes subtitle", () => {
      const { getByText } = render(<ContourCopyExercise {...defaultProps} />);

      expect(getByText("Listen to 3 notes")).toBeTruthy();
    });

    it("shows Play Again button", () => {
      const { getByText } = render(<ContourCopyExercise {...defaultProps} />);

      expect(getByText(/Play Again/)).toBeTruthy();
    });

    it("shows all four contour answer buttons", () => {
      const { getByText } = render(<ContourCopyExercise {...defaultProps} />);

      expect(getByText("up → up")).toBeTruthy();
      expect(getByText("up → down")).toBeTruthy();
      expect(getByText("down → up")).toBeTruthy();
      expect(getByText("down → down")).toBeTruthy();
    });

    it("shows contour symbols", () => {
      const { getByText } = render(<ContourCopyExercise {...defaultProps} />);

      expect(getByText("↗↗")).toBeTruthy();
      expect(getByText("↗↘")).toBeTruthy();
      expect(getByText("↘↗")).toBeTruthy();
      expect(getByText("↘↘")).toBeTruthy();
    });
  });

  // ============================================================
  // PLAY BUTTON BEHAVIOR
  // ============================================================
  describe("Play Button", () => {
    it("has accessible Play Again button", () => {
      const { getByLabelText } = render(
        <ContourCopyExercise {...defaultProps} />,
      );

      expect(getByLabelText("Play audio again")).toBeTruthy();
    });

    it("auto-plays when exercise starts", async () => {
      render(<ContourCopyExercise {...defaultProps} />);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(mockPlayNote).toHaveBeenCalled();
      });
    });

    it("plays 3 notes", async () => {
      render(<ContourCopyExercise {...defaultProps} />);

      act(() => {
        jest.advanceTimersByTime(600);
      });

      // Wait for all notes to play
      await waitFor(() => {
        expect(mockPlayNote).toHaveBeenCalledTimes(3);
      });
    });

    it("shows Playing... while audio plays", async () => {
      mockPlayNote.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 500)),
      );

      const { getByText, getByLabelText } = render(
        <ContourCopyExercise {...defaultProps} />,
      );

      fireEvent.press(getByLabelText("Play audio again"));

      // Should show Playing... at some point
      expect(getByLabelText("Playing audio")).toBeTruthy();
    });
  });

  // ============================================================
  // ANSWER SELECTION
  // ============================================================
  describe("Answer Selection", () => {
    it("has accessible answer buttons", () => {
      const { getByLabelText } = render(
        <ContourCopyExercise {...defaultProps} />,
      );

      expect(getByLabelText("Select up to up contour")).toBeTruthy();
      expect(getByLabelText("Select up to down contour")).toBeTruthy();
      expect(getByLabelText("Select down to up contour")).toBeTruthy();
      expect(getByLabelText("Select down to down contour")).toBeTruthy();
    });

    it("calls onProgress when correct answer selected", async () => {
      // Mock random to get "up-up" shape
      mockMathRandom.mockReturnValue(0);

      const { getByLabelText } = render(
        <ContourCopyExercise {...defaultProps} />,
      );

      act(() => {
        jest.advanceTimersByTime(600);
      });

      // Select up-up answer
      fireEvent.press(getByLabelText("Select up to up contour"));

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
      mockMathRandom.mockReturnValue(0);

      const { getByLabelText } = render(
        <ContourCopyExercise {...defaultProps} />,
      );

      act(() => {
        jest.advanceTimersByTime(600);
      });

      // Select wrong answer
      fireEvent.press(getByLabelText("Select down to down contour"));

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
        <ContourCopyExercise {...defaultProps} />,
      );

      act(() => {
        jest.advanceTimersByTime(600);
      });

      fireEvent.press(getByLabelText("Select up to up contour"));

      const answerButtons = getAllByRole("button").filter((btn) =>
        btn.props.accessibilityLabel?.includes("contour"),
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
      const { getByText } = render(<ContourCopyExercise {...defaultProps} />);

      expect(getByText("0 / 8 in a row")).toBeTruthy();
    });

    it("increments streak on correct answer", async () => {
      mockMathRandom.mockReturnValue(0);

      const { getByLabelText, getByText } = render(
        <ContourCopyExercise {...defaultProps} />,
      );

      act(() => {
        jest.advanceTimersByTime(600);
      });

      fireEvent.press(getByLabelText("Select up to up contour"));

      act(() => {
        jest.advanceTimersByTime(1500);
      });

      await waitFor(() => {
        expect(getByText(/1 \/ 8 in a row/i)).toBeTruthy();
      });
    });

    it("uses custom mastery streak from config", () => {
      const customProps = {
        ...defaultProps,
        mastery: { correct_streak: 5 },
      };

      const { getByText } = render(<ContourCopyExercise {...customProps} />);

      expect(getByText("0 / 5 in a row")).toBeTruthy();
    });

    it("defaults to 8 if no mastery streak specified", () => {
      const noMasteryProps = {
        ...defaultProps,
        mastery: {},
      };

      const { getByText } = render(<ContourCopyExercise {...noMasteryProps} />);

      expect(getByText("0 / 8 in a row")).toBeTruthy();
    });
  });

  // ============================================================
  // COMPLETION
  // ============================================================
  describe("Completion", () => {
    it("calls onComplete when streak reaches mastery", async () => {
      mockMathRandom.mockReturnValue(0);
      const onComplete = jest.fn();
      const quickMasteryProps = {
        ...defaultProps,
        mastery: { correct_streak: 1 },
        onComplete,
      };

      const { getByLabelText } = render(
        <ContourCopyExercise {...quickMasteryProps} />,
      );

      act(() => {
        jest.advanceTimersByTime(600);
      });

      fireEvent.press(getByLabelText("Select up to up contour"));

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
      mockMathRandom.mockReturnValue(0);
      const onComplete = jest.fn();
      const quickMasteryProps = {
        ...defaultProps,
        mastery: { correct_streak: 1 },
        onComplete,
      };

      const { getByLabelText } = render(
        <ContourCopyExercise {...quickMasteryProps} />,
      );

      act(() => {
        jest.advanceTimersByTime(600);
      });

      fireEvent.press(getByLabelText("Select up to up contour"));

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

      render(<ContourCopyExercise {...useFirstNoteProps} />);

      expect(mockNoteToFrequency).toHaveBeenCalledWith("G4");
    });

    it("uses base_note from config when not using first note", () => {
      const baseNoteProps = {
        ...defaultProps,
        config: {
          ...defaultProps.config,
          base_note: "A3",
        },
      };

      render(<ContourCopyExercise {...baseNoteProps} />);

      expect(mockNoteToFrequency).toHaveBeenCalledWith("A3");
    });

    it("defaults to C4 if no base note specified", () => {
      const noBaseNoteProps = {
        ...defaultProps,
        config: {},
      };

      render(<ContourCopyExercise {...noBaseNoteProps} />);

      expect(mockNoteToFrequency).toHaveBeenCalledWith("C4");
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
        <ContourCopyExercise {...noCompleteProps} />,
      );

      expect(getByText("What's the shape?")).toBeTruthy();
    });

    it("handles missing onProgress gracefully", () => {
      const noProgressProps = {
        ...defaultProps,
        onProgress: undefined,
      };

      const { getByText } = render(
        <ContourCopyExercise {...noProgressProps} />,
      );

      expect(getByText("What's the shape?")).toBeTruthy();
    });

    it("handles missing config gracefully", () => {
      const noConfigProps = {
        ...defaultProps,
        config: undefined,
      };

      const { getByText } = render(<ContourCopyExercise {...noConfigProps} />);

      expect(getByText("up → up")).toBeTruthy();
    });

    it("uses fallback frequency when noteToFrequency returns undefined", () => {
      // Mock noteToFrequency to return undefined
      mockNoteToFrequency.mockReturnValueOnce(undefined);

      const { getByText } = render(<ContourCopyExercise {...defaultProps} />);

      // Should still render without crashing
      expect(getByText("What's the shape?")).toBeTruthy();
    });
  });
});
