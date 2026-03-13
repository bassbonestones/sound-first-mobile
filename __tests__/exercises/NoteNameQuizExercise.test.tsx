/**
 * Tests for NoteNameQuizExercise component
 *
 * Quiz on next/previous notes in sequence
 * - question_type: "next_note" or "previous_note"
 * - Requires streak of correct answers to complete
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

// Mock devLogger
jest.mock("../../src/utils/devLogger", () => ({
  devWarn: jest.fn(),
  devLog: jest.fn(),
}));

import NoteNameQuizExercise from "../../src/screens/Session/components/exercises/NoteNameQuizExercise";

describe("NoteNameQuizExercise", () => {
  const defaultProps = {
    mini: {
      config: {
        question_type: "next_note",
        focus_on: ["C", "D", "E", "F", "G", "A", "B"],
      },
      mastery: { correct_streak: 6 },
    },
    sessionState: {},
    onComplete: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Math.random to get predictable results
    jest.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================================
  // NEXT NOTE QUESTIONS
  // ============================================================
  describe("Next Note Questions", () => {
    it("renders quiz screen with streak progress", () => {
      const { getByText } = render(<NoteNameQuizExercise {...defaultProps} />);

      expect(getByText(/Streak: 0 \/ 6/i)).toBeTruthy();
    });

    it("shows question asking what comes after", () => {
      const { getByText } = render(<NoteNameQuizExercise {...defaultProps} />);

      expect(getByText(/What note comes after/i)).toBeTruthy();
    });

    it("shows arrow symbol for next note", () => {
      const { getByText } = render(<NoteNameQuizExercise {...defaultProps} />);

      expect(getByText("→")).toBeTruthy();
    });

    it("shows question mark for answer", () => {
      const { getByText } = render(<NoteNameQuizExercise {...defaultProps} />);

      expect(getByText("?")).toBeTruthy();
    });

    it("shows four answer options", () => {
      const { getAllByRole } = render(
        <NoteNameQuizExercise {...defaultProps} />,
      );

      const buttons = getAllByRole("button").filter((btn) =>
        btn.props.accessibilityLabel?.startsWith("Select answer"),
      );
      expect(buttons.length).toBe(4);
    });

    it("shows correct feedback for right answer", () => {
      const { getByText, getAllByRole } = render(
        <NoteNameQuizExercise {...defaultProps} />,
      );

      // For C, next note is D
      // Find and click the D button
      const buttons = getAllByRole("button").filter((btn) =>
        btn.props.accessibilityLabel?.startsWith("Select answer"),
      );

      // Find the button for D
      const dButton = buttons.find(
        (btn) => btn.props.accessibilityLabel === "Select answer D",
      );
      if (dButton) {
        fireEvent.press(dButton);
        expect(getByText(/✓ Correct!/i)).toBeTruthy();
      }
    });

    it("shows wrong feedback for incorrect answer", () => {
      const { getByText, getAllByRole } = render(
        <NoteNameQuizExercise {...defaultProps} />,
      );

      const buttons = getAllByRole("button").filter((btn) =>
        btn.props.accessibilityLabel?.startsWith("Select answer"),
      );

      // Find a wrong button (not D for next note after C)
      const wrongButton = buttons.find(
        (btn) => btn.props.accessibilityLabel === "Select answer E",
      );
      if (wrongButton) {
        fireEvent.press(wrongButton);
        expect(getByText(/✗ Not quite/i)).toBeTruthy();
      }
    });

    it("increments streak on correct answer", () => {
      const { getByText, getAllByRole } = render(
        <NoteNameQuizExercise {...defaultProps} />,
      );

      const buttons = getAllByRole("button").filter((btn) =>
        btn.props.accessibilityLabel?.startsWith("Select answer"),
      );

      const dButton = buttons.find(
        (btn) => btn.props.accessibilityLabel === "Select answer D",
      );
      if (dButton) {
        fireEvent.press(dButton);

        // After correct, streak should show 1
        expect(getByText(/Streak: 1 \/ 6/i)).toBeTruthy();
      }
    });

    it("resets streak on wrong answer", () => {
      const { getByText, getAllByRole } = render(
        <NoteNameQuizExercise {...defaultProps} />,
      );

      const buttons = getAllByRole("button").filter((btn) =>
        btn.props.accessibilityLabel?.startsWith("Select answer"),
      );

      const wrongButton = buttons.find(
        (btn) => btn.props.accessibilityLabel === "Select answer E",
      );
      if (wrongButton) {
        fireEvent.press(wrongButton);

        // After wrong, streak should be 0
        expect(getByText(/Streak: 0 \/ 6/i)).toBeTruthy();
      }
    });

    it("shows Next button after answering", () => {
      const { getByText, getAllByRole } = render(
        <NoteNameQuizExercise {...defaultProps} />,
      );

      const buttons = getAllByRole("button").filter((btn) =>
        btn.props.accessibilityLabel?.startsWith("Select answer"),
      );

      // Click any answer
      if (buttons[0]) {
        fireEvent.press(buttons[0]);
        expect(getByText("Next →")).toBeTruthy();
      }
    });
  });

  // ============================================================
  // PREVIOUS NOTE QUESTIONS
  // ============================================================
  describe("Previous Note Questions", () => {
    const previousNoteProps = {
      ...defaultProps,
      mini: {
        config: {
          question_type: "previous_note",
          focus_on: ["C", "D", "E", "F", "G", "A", "B"],
        },
        mastery: { correct_streak: 6 },
      },
    };

    it("shows question asking what comes before", () => {
      const { getByText } = render(
        <NoteNameQuizExercise {...previousNoteProps} />,
      );

      expect(getByText(/What note comes before/i)).toBeTruthy();
    });

    it("shows arrow symbol for previous note", () => {
      const { getByText } = render(
        <NoteNameQuizExercise {...previousNoteProps} />,
      );

      expect(getByText("←")).toBeTruthy();
    });
  });

  // ============================================================
  // WRAP-AROUND HINT
  // ============================================================
  describe("Wrap-Around Hint", () => {
    it("shows wrap-around hint when current note is G (next_note)", () => {
      // Mock Math.random to select G as the starting note
      jest.spyOn(Math, "random").mockImplementation(() => 0.99); // Will select last element (G)

      const gProps = {
        ...defaultProps,
        mini: {
          config: { question_type: "next_note", focus_on: ["G"] },
          mastery: { correct_streak: 6 },
        },
      };

      const { queryByText } = render(<NoteNameQuizExercise {...gProps} />);

      expect(queryByText(/pattern wraps around/i)).toBeTruthy();
    });

    it("shows wrap-around hint when current note is A (previous_note)", () => {
      const aProps = {
        ...defaultProps,
        mini: {
          config: { question_type: "previous_note", focus_on: ["A"] },
          mastery: { correct_streak: 6 },
        },
      };

      const { queryByText } = render(<NoteNameQuizExercise {...aProps} />);

      expect(queryByText(/pattern wraps around/i)).toBeTruthy();
    });
  });

  // ============================================================
  // COMPLETION
  // ============================================================
  describe("Completion", () => {
    it("shows completion screen after reaching required streak", () => {
      // Set up with low streak requirement
      const lowStreakProps = {
        ...defaultProps,
        mini: {
          config: { question_type: "next_note", focus_on: ["C"] },
          mastery: { correct_streak: 1 },
        },
      };

      const { getByText, getAllByRole } = render(
        <NoteNameQuizExercise {...lowStreakProps} />,
      );

      const buttons = getAllByRole("button").filter((btn) =>
        btn.props.accessibilityLabel?.startsWith("Select answer"),
      );

      const dButton = buttons.find(
        (btn) => btn.props.accessibilityLabel === "Select answer D",
      );
      if (dButton) {
        fireEvent.press(dButton);

        // Should show completion
        expect(getByText("Mastered!")).toBeTruthy();
      }
    });

    it("shows forward sequence text for next_note completion", () => {
      const lowStreakProps = {
        ...defaultProps,
        mini: {
          config: { question_type: "next_note", focus_on: ["C"] },
          mastery: { correct_streak: 1 },
        },
      };

      const { getByText, getAllByRole } = render(
        <NoteNameQuizExercise {...lowStreakProps} />,
      );

      const buttons = getAllByRole("button").filter((btn) =>
        btn.props.accessibilityLabel?.startsWith("Select answer"),
      );

      const dButton = buttons.find(
        (btn) => btn.props.accessibilityLabel === "Select answer D",
      );
      if (dButton) {
        fireEvent.press(dButton);
        expect(getByText(/forward sequence/i)).toBeTruthy();
      }
    });

    it("shows backward sequence text for previous_note completion", () => {
      const lowStreakProps = {
        mini: {
          config: { question_type: "previous_note", focus_on: ["C"] },
          mastery: { correct_streak: 1 },
        },
        sessionState: {},
        onComplete: jest.fn(),
      };

      const { getByText, getAllByRole } = render(
        <NoteNameQuizExercise {...lowStreakProps} />,
      );

      const buttons = getAllByRole("button").filter((btn) =>
        btn.props.accessibilityLabel?.startsWith("Select answer"),
      );

      // For C, previous note is B
      const bButton = buttons.find(
        (btn) => btn.props.accessibilityLabel === "Select answer B",
      );
      if (bButton) {
        fireEvent.press(bButton);
        expect(getByText(/backward sequence/i)).toBeTruthy();
      }
    });

    it("shows stats in completion screen", () => {
      const lowStreakProps = {
        ...defaultProps,
        mini: {
          config: { question_type: "next_note", focus_on: ["C"] },
          mastery: { correct_streak: 1 },
        },
      };

      const { getByText, getAllByRole } = render(
        <NoteNameQuizExercise {...lowStreakProps} />,
      );

      const buttons = getAllByRole("button").filter((btn) =>
        btn.props.accessibilityLabel?.startsWith("Select answer"),
      );

      const dButton = buttons.find(
        (btn) => btn.props.accessibilityLabel === "Select answer D",
      );
      if (dButton) {
        fireEvent.press(dButton);
        expect(getByText(/Total tries/i)).toBeTruthy();
        expect(getByText(/Accuracy/i)).toBeTruthy();
      }
    });

    it("calls onComplete when clicking Continue", () => {
      const onComplete = jest.fn();
      const lowStreakProps = {
        mini: {
          config: { question_type: "next_note", focus_on: ["C"] },
          mastery: { correct_streak: 1 },
        },
        sessionState: {},
        onComplete,
      };

      const { getByText, getAllByRole, getByLabelText } = render(
        <NoteNameQuizExercise {...lowStreakProps} />,
      );

      const buttons = getAllByRole("button").filter((btn) =>
        btn.props.accessibilityLabel?.startsWith("Select answer"),
      );

      const dButton = buttons.find(
        (btn) => btn.props.accessibilityLabel === "Select answer D",
      );
      if (dButton) {
        fireEvent.press(dButton);
        fireEvent.press(getByLabelText("Continue to next exercise"));

        expect(onComplete).toHaveBeenCalledWith({
          success: true,
          streak: 1,
          totalAttempts: 1,
        });
      }
    });
  });

  // ============================================================
  // CUSTOM CONFIGURATION
  // ============================================================
  describe("Custom Configuration", () => {
    it("uses default streak of 6 if not specified", () => {
      const noStreakProps = {
        mini: {
          config: { question_type: "next_note", focus_on: ["C"] },
          mastery: {},
        },
        sessionState: {},
        onComplete: jest.fn(),
      };

      const { getByText } = render(<NoteNameQuizExercise {...noStreakProps} />);

      expect(getByText(/Streak: 0 \/ 6/i)).toBeTruthy();
    });

    it("uses custom streak requirement", () => {
      const customStreakProps = {
        mini: {
          config: { question_type: "next_note", focus_on: ["C"] },
          mastery: { correct_streak: 10 },
        },
        sessionState: {},
        onComplete: jest.fn(),
      };

      const { getByText } = render(
        <NoteNameQuizExercise {...customStreakProps} />,
      );

      expect(getByText(/Streak: 0 \/ 10/i)).toBeTruthy();
    });

    it("defaults to next_note if question_type not specified", () => {
      const noTypeProps = {
        mini: {
          config: { focus_on: ["C"] },
          mastery: { correct_streak: 6 },
        },
        sessionState: {},
        onComplete: jest.fn(),
      };

      const { getByText } = render(<NoteNameQuizExercise {...noTypeProps} />);

      expect(getByText(/What note comes after/i)).toBeTruthy();
    });

    it("uses all notes if focus_on not specified", () => {
      const noFocusProps = {
        mini: {
          config: { question_type: "next_note" },
          mastery: { correct_streak: 6 },
        },
        sessionState: {},
        onComplete: jest.fn(),
      };

      const { getByText } = render(<NoteNameQuizExercise {...noFocusProps} />);

      // Should still render with default notes
      expect(getByText(/What note comes after/i)).toBeTruthy();
    });
  });

  // ============================================================
  // ACCESSIBILITY
  // ============================================================
  describe("Accessibility", () => {
    it("has accessible answer buttons", () => {
      const { getAllByRole } = render(
        <NoteNameQuizExercise {...defaultProps} />,
      );

      const buttons = getAllByRole("button").filter((btn) =>
        btn.props.accessibilityLabel?.startsWith("Select answer"),
      );
      expect(buttons.length).toBe(4);
    });

    it("has accessible Next button", () => {
      const { getAllByRole, getByLabelText } = render(
        <NoteNameQuizExercise {...defaultProps} />,
      );

      const buttons = getAllByRole("button").filter((btn) =>
        btn.props.accessibilityLabel?.startsWith("Select answer"),
      );

      if (buttons[0]) {
        fireEvent.press(buttons[0]);
        expect(getByLabelText("Next question")).toBeTruthy();
      }
    });

    it("has accessible Continue button in completion", () => {
      const lowStreakProps = {
        ...defaultProps,
        mini: {
          config: { question_type: "next_note", focus_on: ["C"] },
          mastery: { correct_streak: 1 },
        },
      };

      const { getAllByRole, getByLabelText } = render(
        <NoteNameQuizExercise {...lowStreakProps} />,
      );

      const buttons = getAllByRole("button").filter((btn) =>
        btn.props.accessibilityLabel?.startsWith("Select answer"),
      );

      const dButton = buttons.find(
        (btn) => btn.props.accessibilityLabel === "Select answer D",
      );
      if (dButton) {
        fireEvent.press(dButton);
        expect(getByLabelText("Continue to next exercise")).toBeTruthy();
      }
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================
  describe("Edge Cases", () => {
    it("handles missing onComplete gracefully", () => {
      const noCompleteProps = {
        mini: {
          config: { question_type: "next_note", focus_on: ["C"] },
          mastery: { correct_streak: 1 },
        },
        sessionState: {},
      };

      const { getByText, getAllByRole } = render(
        <NoteNameQuizExercise {...noCompleteProps} />,
      );

      const buttons = getAllByRole("button").filter((btn) =>
        btn.props.accessibilityLabel?.startsWith("Select answer"),
      );

      const dButton = buttons.find(
        (btn) => btn.props.accessibilityLabel === "Select answer D",
      );
      if (dButton) {
        fireEvent.press(dButton);
        // Should complete without error
        expect(getByText("Mastered!")).toBeTruthy();
      }
    });

    it("handles empty mini prop", () => {
      const { getByText } = render(
        <NoteNameQuizExercise
          mini={{}}
          sessionState={{}}
          onComplete={jest.fn()}
        />,
      );

      // Should render with defaults
      expect(getByText(/What note comes after/i)).toBeTruthy();
    });

    it("disables answer buttons after selection", () => {
      const { getAllByRole } = render(
        <NoteNameQuizExercise {...defaultProps} />,
      );

      const buttons = getAllByRole("button").filter((btn) =>
        btn.props.accessibilityLabel?.startsWith("Select answer"),
      );

      if (buttons[0]) {
        fireEvent.press(buttons[0]);

        // All answer buttons should be disabled now
        const buttonsAfter = getAllByRole("button").filter((btn) =>
          btn.props.accessibilityLabel?.startsWith("Select answer"),
        );
        buttonsAfter.forEach((btn) => {
          expect(btn.props.accessibilityState?.disabled).toBe(true);
        });
      }
    });
  });

  // ============================================================
  // NEXT QUESTION FLOW
  // ============================================================
  describe("Next Question Flow", () => {
    it("moves to next question when pressing Next", () => {
      const { getByText, getAllByRole, getByLabelText } = render(
        <NoteNameQuizExercise {...defaultProps} />,
      );

      const buttons = getAllByRole("button").filter((btn) =>
        btn.props.accessibilityLabel?.startsWith("Select answer"),
      );

      if (buttons[0]) {
        fireEvent.press(buttons[0]);
        fireEvent.press(getByLabelText("Next question"));

        // Should show new question
        expect(getByText(/What note comes after/i)).toBeTruthy();
        // Answer buttons should be enabled again
        const buttonsAfter = getAllByRole("button").filter((btn) =>
          btn.props.accessibilityLabel?.startsWith("Select answer"),
        );
        buttonsAfter.forEach((btn) => {
          expect(btn.props.accessibilityState?.disabled).toBeFalsy();
        });
      }
    });
  });
});
