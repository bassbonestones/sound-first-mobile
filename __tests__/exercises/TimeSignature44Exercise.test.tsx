/**
 * Tests for TimeSignature44Exercise component
 *
 * Flow: intro_1 → intro_2 → intro_3 → quiz (4 questions) → result
 * - Intro phases teach 4/4 time signature concepts
 * - Quiz presents 4 fixed questions about 4/4 time
 * - Pass = 4/4 correct, triggers onComplete
 * - Fail = can restart
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

// Mock NotationDisplay
jest.mock("../../src/components/NotationDisplay", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: (props: any) => (
      <View testID="notation-display" {...props}>
        Mock NotationDisplay
      </View>
    ),
  };
});

// Mock devLogger
jest.mock("../../src/utils/devLogger", () => ({
  devWarn: jest.fn(),
  devLog: jest.fn(),
}));

import TimeSignature44Exercise from "../../src/screens/Session/components/exercises/TimeSignature44Exercise";

describe("TimeSignature44Exercise", () => {
  // Default props
  const defaultProps = {
    config: { capability_id: "test-cap" },
    mastery: {},
    onComplete: jest.fn(),
    onProgress: jest.fn(),
    clef: "treble" as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ============================================================
  // INTRO PHASE 1 - What 4/4 Means
  // ============================================================
  describe("Intro Phase 1 - What 4/4 Means", () => {
    it("renders intro_1 phase on mount", () => {
      const { getByText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      expect(getByText("4/4 Time")).toBeTruthy();
      expect(getByText(/most common time signature/i)).toBeTruthy();
    });

    it("shows time signature display with 4/4", () => {
      const { getAllByText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      // Multiple 4s in the display
      const fours = getAllByText("4");
      expect(fours.length).toBeGreaterThanOrEqual(2);
    });

    it("explains 4/4 meaning", () => {
      const { getByText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      expect(getByText(/4 beats per measure/i)).toBeTruthy();
      expect(getByText(/Quarter note gets the beat/i)).toBeTruthy();
    });

    it("has Next button to advance", () => {
      const { getByText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      expect(getByText("Next →")).toBeTruthy();
    });

    it("navigates to intro_2 when pressing Next", () => {
      const { getByText, getByLabelText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      fireEvent.press(getByLabelText("Next"));

      expect(getByText("Common Time")).toBeTruthy();
    });

    it("renders NotationDisplay", () => {
      const { getByTestId } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      expect(getByTestId("notation-display")).toBeTruthy();
    });
  });

  // ============================================================
  // INTRO PHASE 2 - Common Time
  // ============================================================
  describe("Intro Phase 2 - Common Time", () => {
    const navigateToPhase2 = (getByLabelText: any) => {
      fireEvent.press(getByLabelText("Next")); // intro_1 → intro_2
    };

    it("renders common time content", () => {
      const { getByText, getByLabelText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      navigateToPhase2(getByLabelText);

      expect(getByText("Common Time")).toBeTruthy();
      expect(getByText(/special symbol/i)).toBeTruthy();
    });

    it("shows C symbol for common time", () => {
      const { getAllByText, getByLabelText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      navigateToPhase2(getByLabelText);

      // Multiple C's may appear (in mini time signature display and main symbol)
      const cSymbols = getAllByText("C");
      expect(cSymbols.length).toBeGreaterThan(0);
    });

    it("explains C stands for Common Time", () => {
      const { getByText, getByLabelText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      navigateToPhase2(getByLabelText);

      expect(getByText(/"Common Time"/i)).toBeTruthy();
    });

    it("shows equivalence between 4/4 and C", () => {
      const { getByText, getByLabelText, getAllByText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      navigateToPhase2(getByLabelText);

      // Should show 4/4 = C equivalence
      expect(getByText(/They mean exactly the same thing/i)).toBeTruthy();
    });

    it("can navigate back to intro_1", () => {
      const { getByText, getByLabelText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      navigateToPhase2(getByLabelText);
      fireEvent.press(getByLabelText("Back"));

      expect(getByText("4/4 Time")).toBeTruthy();
    });

    it("can navigate forward to intro_3", () => {
      const { getByText, getByLabelText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      navigateToPhase2(getByLabelText);
      fireEvent.press(getByLabelText("Next"));

      expect(getByText("Whole Notes in 4/4")).toBeTruthy();
    });
  });

  // ============================================================
  // INTRO PHASE 3 - Whole Notes in 4/4
  // ============================================================
  describe("Intro Phase 3 - Whole Notes in 4/4", () => {
    const navigateToPhase3 = (getByLabelText: any) => {
      fireEvent.press(getByLabelText("Next")); // intro_1 → intro_2
      fireEvent.press(getByLabelText("Next")); // intro_2 → intro_3
    };

    it("renders intro_3 content", () => {
      const { getByText, getByLabelText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      navigateToPhase3(getByLabelText);

      expect(getByText("Whole Notes in 4/4")).toBeTruthy();
    });

    it("explains whole note = 4 beats", () => {
      const { getAllByText, getByLabelText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      navigateToPhase3(getByLabelText);

      // Multiple matches for "whole note" and "4 beats" content
      expect(getAllByText(/whole note/i).length).toBeGreaterThan(0);
    });

    it("explains 4 quarters = 1 whole", () => {
      const { getByText, getByLabelText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      navigateToPhase3(getByLabelText);

      expect(getByText("4 Quarters in a Whole")).toBeTruthy();
      expect(getByText(/4 quarters = 1 whole/i)).toBeTruthy();
    });

    it("shows ready prompt for quiz", () => {
      const { getByText, getByLabelText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      navigateToPhase3(getByLabelText);

      expect(getByText(/Ready for a quick quiz/i)).toBeTruthy();
    });

    it("can navigate back to intro_2", () => {
      const { getByText, getByLabelText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      navigateToPhase3(getByLabelText);
      fireEvent.press(getByLabelText("Back"));

      expect(getByText("Common Time")).toBeTruthy();
    });

    it("has Take Quiz button", () => {
      const { getByText, getByLabelText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      navigateToPhase3(getByLabelText);

      expect(getByText("Take Quiz →")).toBeTruthy();
    });

    it("navigates to quiz when pressing Take Quiz", () => {
      const { getByText, getByLabelText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      navigateToPhase3(getByLabelText);
      fireEvent.press(getByLabelText("Take quiz"));

      expect(getByText(/Question 1 of 4/i)).toBeTruthy();
    });
  });

  // ============================================================
  // QUIZ PHASE
  // ============================================================
  describe("Quiz Phase", () => {
    const navigateToQuiz = (getByLabelText: any) => {
      fireEvent.press(getByLabelText("Next")); // intro_1 → intro_2
      fireEvent.press(getByLabelText("Next")); // intro_2 → intro_3
      fireEvent.press(getByLabelText("Take quiz")); // intro_3 → quiz
    };

    it("shows question progress", () => {
      const { getByText, getByLabelText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      navigateToQuiz(getByLabelText);

      expect(getByText(/Question 1 of 4/i)).toBeTruthy();
    });

    it("shows first question about two whole notes", () => {
      const { getByText, getByLabelText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      navigateToQuiz(getByLabelText);

      expect(getByText(/TWO whole notes.*one measure of 4\/4/i)).toBeTruthy();
    });

    it("shows hint for first question", () => {
      const { getByText, getByLabelText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      navigateToQuiz(getByLabelText);

      expect(getByText(/whole note = 4 beats/i)).toBeTruthy();
    });

    it("displays Yes/No options for first question", () => {
      const { getByText, getByLabelText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      navigateToQuiz(getByLabelText);

      expect(getByText("Yes")).toBeTruthy();
      expect(getByText("No")).toBeTruthy();
    });

    it("shows correct feedback for correct answer", async () => {
      const { getByText, getByLabelText, queryByText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      navigateToQuiz(getByLabelText);

      // First question correct answer is "No"
      fireEvent.press(getByText("No"));

      await waitFor(() => {
        expect(queryByText(/✓ Correct!/i)).toBeTruthy();
      });
    });

    it("shows incorrect feedback for wrong answer", async () => {
      const { getByText, getByLabelText, queryByText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      navigateToQuiz(getByLabelText);

      // First question wrong answer is "Yes"
      fireEvent.press(getByText("Yes"));

      await waitFor(() => {
        expect(queryByText(/✗ Not quite/i)).toBeTruthy();
      });
    });

    it("shows explanation after answering", async () => {
      const { getByText, getByLabelText, queryByText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      navigateToQuiz(getByLabelText);

      fireEvent.press(getByText("No"));

      await waitFor(() => {
        expect(queryByText(/Two whole notes = 8 beats/i)).toBeTruthy();
      });
    });

    it("advances to next question after delay", async () => {
      const { getByText, getByLabelText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      navigateToQuiz(getByLabelText);

      // Answer first question
      fireEvent.press(getByText("No"));

      // Advance timer (2000ms delay)
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Should be on question 2
      await waitFor(() => {
        expect(getByText(/Question 2 of 4/i)).toBeTruthy();
      });
    });

    it("question 2 asks about beats in 4/4", async () => {
      const { getByText, getByLabelText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      navigateToQuiz(getByLabelText);

      // Answer Q1
      fireEvent.press(getByText("No"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Q2 should ask about beats
      await waitFor(() => {
        expect(getByText(/How many beats.*one measure of 4\/4/i)).toBeTruthy();
      });
    });

    it("calls onProgress during quiz", async () => {
      const { getByText, getByLabelText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      navigateToQuiz(getByLabelText);

      fireEvent.press(getByText("No"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(defaultProps.onProgress).toHaveBeenCalled();
      });
    });

    it("ignores clicks while showing feedback", async () => {
      const { getByText, getByLabelText, queryByText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      navigateToQuiz(getByLabelText);

      // Click first answer
      fireEvent.press(getByText("No"));

      // Try clicking again during feedback
      fireEvent.press(getByText("Yes"));

      // Should still show feedback for "No" answer
      await waitFor(() => {
        expect(queryByText(/✓ Correct!/i)).toBeTruthy();
      });

      // Still on question 1
      expect(getByText(/Question 1 of 4/i)).toBeTruthy();
    });
  });

  // ============================================================
  // FULL QUIZ FLOW - Pass
  // ============================================================
  describe("Full Quiz Flow - Pass", () => {
    it("shows perfect result when all 4 correct", async () => {
      const { getByText, getByLabelText, queryByText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      // Navigate to quiz
      fireEvent.press(getByLabelText("Next"));
      fireEvent.press(getByLabelText("Next"));
      fireEvent.press(getByLabelText("Take quiz"));

      // Q1: Can you fit TWO whole notes? → No
      fireEvent.press(getByText("No"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Q2: How many beats in 4/4? → 4 (use accessibility label)
      await waitFor(() => expect(getByLabelText("Select 4")).toBeTruthy());
      fireEvent.press(getByLabelText("Select 4"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Q3: What note gets the beat? → Quarter note
      await waitFor(() => expect(getByText("Quarter note")).toBeTruthy());
      fireEvent.press(getByText("Quarter note"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Q4: Another way to write 4/4? → C (use accessibility label)
      await waitFor(() => expect(getByLabelText("Select C")).toBeTruthy());
      fireEvent.press(getByLabelText("Select C"));
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Should show perfect result
      await waitFor(() => {
        expect(queryByText("Perfect!")).toBeTruthy();
      });
    });

    it("calls onComplete with success when completing", async () => {
      const onComplete = jest.fn();
      const { getByText, getByLabelText, queryByText } = render(
        <TimeSignature44Exercise {...defaultProps} onComplete={onComplete} />,
      );

      // Navigate and answer all correctly
      fireEvent.press(getByLabelText("Next"));
      fireEvent.press(getByLabelText("Next"));
      fireEvent.press(getByLabelText("Take quiz"));

      // Answer all 4 questions correctly
      fireEvent.press(getByText("No"));
      act(() => jest.advanceTimersByTime(2000));

      await waitFor(() => expect(getByLabelText("Select 4")).toBeTruthy());
      fireEvent.press(getByLabelText("Select 4"));
      act(() => jest.advanceTimersByTime(2000));

      await waitFor(() => expect(queryByText("Quarter note")).toBeTruthy());
      fireEvent.press(getByText("Quarter note"));
      act(() => jest.advanceTimersByTime(2000));

      await waitFor(() => expect(getByLabelText("Select C")).toBeTruthy());
      fireEvent.press(getByLabelText("Select C"));
      act(() => jest.advanceTimersByTime(2000));

      // Click Complete
      await waitFor(() => expect(queryByText("Complete →")).toBeTruthy());
      fireEvent.press(getByLabelText("Complete exercise"));

      expect(onComplete).toHaveBeenCalledWith({
        success: true,
        streak: 4,
        totalAttempts: 4,
        correctCount: 4,
      });
    });
  });

  // ============================================================
  // FULL QUIZ FLOW - Fail
  // ============================================================
  describe("Full Quiz Flow - Fail", () => {
    it("shows keep learning when not all correct", async () => {
      const { getByText, getByLabelText, queryByText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      // Navigate to quiz
      fireEvent.press(getByLabelText("Next"));
      fireEvent.press(getByLabelText("Next"));
      fireEvent.press(getByLabelText("Take quiz"));

      // Answer Q1 wrong
      fireEvent.press(getByText("Yes"));
      act(() => jest.advanceTimersByTime(2000));

      // Answer rest correctly
      await waitFor(() => expect(getByLabelText("Select 4")).toBeTruthy());
      fireEvent.press(getByLabelText("Select 4"));
      act(() => jest.advanceTimersByTime(2000));

      await waitFor(() => expect(queryByText("Quarter note")).toBeTruthy());
      fireEvent.press(getByText("Quarter note"));
      act(() => jest.advanceTimersByTime(2000));

      await waitFor(() => expect(getByLabelText("Select C")).toBeTruthy());
      fireEvent.press(getByLabelText("Select C"));
      act(() => jest.advanceTimersByTime(2000));

      // Should show Keep Learning (3/4)
      await waitFor(() => {
        expect(queryByText("Keep Learning")).toBeTruthy();
      });
    });

    it("shows correct count in fail result", async () => {
      const { getByText, getByLabelText, queryByText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      // Navigate and answer 3/4 correctly
      fireEvent.press(getByLabelText("Next"));
      fireEvent.press(getByLabelText("Next"));
      fireEvent.press(getByLabelText("Take quiz"));

      fireEvent.press(getByText("Yes")); // Wrong
      act(() => jest.advanceTimersByTime(2000));

      await waitFor(() => expect(getByLabelText("Select 4")).toBeTruthy());
      fireEvent.press(getByLabelText("Select 4"));
      act(() => jest.advanceTimersByTime(2000));

      await waitFor(() => expect(queryByText("Quarter note")).toBeTruthy());
      fireEvent.press(getByText("Quarter note"));
      act(() => jest.advanceTimersByTime(2000));

      await waitFor(() => expect(getByLabelText("Select C")).toBeTruthy());
      fireEvent.press(getByLabelText("Select C"));
      act(() => jest.advanceTimersByTime(2000));

      await waitFor(() => {
        expect(queryByText(/3 out of 4/i)).toBeTruthy();
      });
    });

    it("has Start Over button in fail result", async () => {
      const { getByText, getByLabelText, queryByText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      fireEvent.press(getByLabelText("Next"));
      fireEvent.press(getByLabelText("Next"));
      fireEvent.press(getByLabelText("Take quiz"));

      fireEvent.press(getByText("Yes")); // Wrong
      act(() => jest.advanceTimersByTime(2000));

      await waitFor(() => expect(getByLabelText("Select 4")).toBeTruthy());
      fireEvent.press(getByLabelText("Select 4"));
      act(() => jest.advanceTimersByTime(2000));

      await waitFor(() => expect(queryByText("Quarter note")).toBeTruthy());
      fireEvent.press(getByText("Quarter note"));
      act(() => jest.advanceTimersByTime(2000));

      await waitFor(() => expect(getByLabelText("Select C")).toBeTruthy());
      fireEvent.press(getByLabelText("Select C"));
      act(() => jest.advanceTimersByTime(2000));

      await waitFor(() => {
        expect(queryByText("Start Over →")).toBeTruthy();
      });
    });
  });

  // ============================================================
  // RESTART FLOW
  // ============================================================
  describe("Restart Flow", () => {
    it("returns to intro_1 when restarting", async () => {
      const { getByText, getByLabelText, queryByText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      // Complete quiz with wrong answers to get to fail state
      fireEvent.press(getByLabelText("Next"));
      fireEvent.press(getByLabelText("Next"));
      fireEvent.press(getByLabelText("Take quiz"));

      fireEvent.press(getByText("Yes"));
      act(() => jest.advanceTimersByTime(2000));

      await waitFor(() => expect(getByLabelText("Select 4")).toBeTruthy());
      fireEvent.press(getByLabelText("Select 4"));
      act(() => jest.advanceTimersByTime(2000));

      await waitFor(() => expect(queryByText("Quarter note")).toBeTruthy());
      fireEvent.press(getByText("Quarter note"));
      act(() => jest.advanceTimersByTime(2000));

      await waitFor(() => expect(getByLabelText("Select C")).toBeTruthy());
      fireEvent.press(getByLabelText("Select C"));
      act(() => jest.advanceTimersByTime(2000));

      // Click Start Over
      await waitFor(() => expect(queryByText("Start Over →")).toBeTruthy());
      fireEvent.press(getByLabelText("Start over"));

      // Should be back at intro_1
      expect(getByText("4/4 Time")).toBeTruthy();
    });
  });

  // ============================================================
  // CLEF CONFIGURATION
  // ============================================================
  describe("Clef Configuration", () => {
    it("accepts treble clef prop", () => {
      const { getByTestId } = render(
        <TimeSignature44Exercise {...defaultProps} clef="treble" />,
      );

      expect(getByTestId("notation-display")).toBeTruthy();
    });

    it("accepts bass clef prop", () => {
      const { getByTestId } = render(
        <TimeSignature44Exercise {...defaultProps} clef="bass" />,
      );

      expect(getByTestId("notation-display")).toBeTruthy();
    });
  });

  // ============================================================
  // ACCESSIBILITY
  // ============================================================
  describe("Accessibility", () => {
    it("has accessible Next button", () => {
      const { getByLabelText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      expect(getByLabelText("Next")).toBeTruthy();
    });

    it("has accessible Back button", () => {
      const { getByLabelText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      fireEvent.press(getByLabelText("Next"));

      expect(getByLabelText("Back")).toBeTruthy();
    });

    it("has accessible Take Quiz button", () => {
      const { getByLabelText } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      fireEvent.press(getByLabelText("Next"));
      fireEvent.press(getByLabelText("Next"));

      expect(getByLabelText("Take quiz")).toBeTruthy();
    });

    it("has accessible answer options in quiz", () => {
      const { getByLabelText, getAllByRole } = render(
        <TimeSignature44Exercise {...defaultProps} />,
      );

      fireEvent.press(getByLabelText("Next"));
      fireEvent.press(getByLabelText("Next"));
      fireEvent.press(getByLabelText("Take quiz"));

      const buttons = getAllByRole("button");
      const selectButtons = buttons.filter((btn) =>
        btn.props.accessibilityLabel?.startsWith("Select"),
      );
      expect(selectButtons.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================
  describe("Edge Cases", () => {
    it("handles missing onComplete gracefully", () => {
      const { getByText } = render(
        <TimeSignature44Exercise
          config={{ capability_id: "test" }}
          mastery={{}}
          onProgress={jest.fn()}
        />,
      );

      expect(getByText("4/4 Time")).toBeTruthy();
    });

    it("handles missing onProgress gracefully", () => {
      const { getByText } = render(
        <TimeSignature44Exercise
          config={{ capability_id: "test" }}
          mastery={{}}
          onComplete={jest.fn()}
        />,
      );

      expect(getByText("4/4 Time")).toBeTruthy();
    });
  });
});
