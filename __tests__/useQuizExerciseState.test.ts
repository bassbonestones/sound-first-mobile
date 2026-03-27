/**
 * Tests for useQuizExerciseState
 *
 * Verifies quiz state management, answer handling, scoring, and callbacks.
 */
import { renderHook, act } from "@testing-library/react-native";
import {
  useQuizExerciseState,
  QuizQuestion,
} from "../src/screens/Session/components/exercises/shared/useQuizExerciseState";

// Mock questions for testing
const MOCK_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    type: "yes_no",
    question: "Is 2 + 2 = 4?",
    correctAnswer: "Yes",
    options: ["Yes", "No"],
    explanation: "Basic math!",
  },
  {
    id: "q2",
    type: "number",
    question: "How many legs does a dog have?",
    correctAnswer: 4,
    options: [2, 3, 4, 5],
    explanation: "Dogs have 4 legs.",
  },
  {
    id: "q3",
    type: "multiple_choice",
    question: "What color is the sky?",
    correctAnswer: "Blue",
    options: ["Red", "Blue", "Green", "Yellow"],
    explanation: "The sky appears blue.",
  },
];

describe("useQuizExerciseState", () => {
  jest.useFakeTimers();

  // ==========================================================================
  // Initial State
  // ==========================================================================
  describe("initial state", () => {
    it("initializes with first question", () => {
      const { result } = renderHook(() =>
        useQuizExerciseState({ questions: MOCK_QUESTIONS }),
      );

      expect(result.current.quiz.currentIndex).toBe(0);
      expect(result.current.quiz.score).toBe(0);
      expect(result.current.quiz.selectedAnswer).toBeNull();
      expect(result.current.quiz.showFeedback).toBe(false);
      expect(result.current.quiz.passed).toBeNull();
    });

    it("provides current question data", () => {
      const { result } = renderHook(() =>
        useQuizExerciseState({ questions: MOCK_QUESTIONS }),
      );

      expect(result.current.currentQuestion).toEqual(MOCK_QUESTIONS[0]);
      expect(result.current.totalQuestions).toBe(3);
      expect(result.current.isLastQuestion).toBe(false);
    });

    it("calculates progress percentage", () => {
      const { result } = renderHook(() =>
        useQuizExerciseState({ questions: MOCK_QUESTIONS }),
      );

      // First question = 33%
      expect(result.current.progressPercent).toBe(33);
    });

    it("handles empty questions array", () => {
      const { result } = renderHook(() =>
        useQuizExerciseState({ questions: [] }),
      );

      expect(result.current.currentQuestion).toBeNull();
      expect(result.current.totalQuestions).toBe(0);
      expect(result.current.progressPercent).toBe(0);
    });
  });

  // ==========================================================================
  // Answer Handling
  // ==========================================================================
  describe("handleAnswer", () => {
    it("records selected answer and shows feedback", () => {
      const { result } = renderHook(() =>
        useQuizExerciseState({ questions: MOCK_QUESTIONS }),
      );

      act(() => {
        result.current.handleAnswer("Yes");
      });

      expect(result.current.quiz.selectedAnswer).toBe("Yes");
      expect(result.current.quiz.showFeedback).toBe(true);
    });

    it("increments score for correct answer", () => {
      const { result } = renderHook(() =>
        useQuizExerciseState({ questions: MOCK_QUESTIONS }),
      );

      act(() => {
        result.current.handleAnswer("Yes"); // Correct
      });

      expect(result.current.quiz.score).toBe(1);
    });

    it("does not increment score for incorrect answer", () => {
      const { result } = renderHook(() =>
        useQuizExerciseState({ questions: MOCK_QUESTIONS }),
      );

      act(() => {
        result.current.handleAnswer("No"); // Incorrect
      });

      expect(result.current.quiz.score).toBe(0);
    });

    it("ignores answers while showing feedback", () => {
      const { result } = renderHook(() =>
        useQuizExerciseState({ questions: MOCK_QUESTIONS }),
      );

      act(() => {
        result.current.handleAnswer("Yes");
      });

      // Try to answer again while feedback is showing
      act(() => {
        result.current.handleAnswer("No");
      });

      expect(result.current.quiz.selectedAnswer).toBe("Yes");
      expect(result.current.quiz.score).toBe(1);
    });

    it("advances to next question after delay", () => {
      const { result } = renderHook(() =>
        useQuizExerciseState({
          questions: MOCK_QUESTIONS,
          feedbackDelay: 1000,
        }),
      );

      act(() => {
        result.current.handleAnswer("Yes");
      });

      expect(result.current.quiz.currentIndex).toBe(0);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.quiz.currentIndex).toBe(1);
      expect(result.current.quiz.showFeedback).toBe(false);
      expect(result.current.quiz.selectedAnswer).toBeNull();
    });

    it("calls onProgress callback", () => {
      const onProgress = jest.fn();
      const { result } = renderHook(() =>
        useQuizExerciseState({ questions: MOCK_QUESTIONS, onProgress }),
      );

      act(() => {
        result.current.handleAnswer("Yes");
      });

      expect(onProgress).toHaveBeenCalledWith({
        current: 1,
        total: 3,
        correct: 1,
      });
    });
  });

  // ==========================================================================
  // Quiz Completion
  // ==========================================================================
  describe("quiz completion", () => {
    it("detects last question", () => {
      const { result } = renderHook(() =>
        useQuizExerciseState({ questions: MOCK_QUESTIONS }),
      );

      // Answer first two questions
      act(() => {
        result.current.handleAnswer("Yes");
      });
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      act(() => {
        result.current.handleAnswer(4);
      });
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.isLastQuestion).toBe(true);
    });

    it("marks quiz as passed when all answers correct", () => {
      const onQuizComplete = jest.fn();
      const { result } = renderHook(() =>
        useQuizExerciseState({
          questions: MOCK_QUESTIONS,
          onQuizComplete,
        }),
      );

      // Answer all correctly
      act(() => {
        result.current.handleAnswer("Yes");
      });
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      act(() => {
        result.current.handleAnswer(4);
      });
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      act(() => {
        result.current.handleAnswer("Blue");
      });
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.quiz.passed).toBe(true);
      expect(onQuizComplete).toHaveBeenCalledWith(true, 3, 3);
    });

    it("marks quiz as failed when score below threshold", () => {
      const onQuizComplete = jest.fn();
      const { result } = renderHook(() =>
        useQuizExerciseState({
          questions: MOCK_QUESTIONS,
          onQuizComplete,
        }),
      );

      // Answer all incorrectly
      act(() => {
        result.current.handleAnswer("No");
      });
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      act(() => {
        result.current.handleAnswer(2);
      });
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      act(() => {
        result.current.handleAnswer("Red");
      });
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.quiz.passed).toBe(false);
      expect(onQuizComplete).toHaveBeenCalledWith(false, 0, 3);
    });

    it("respects custom pass threshold", () => {
      const onQuizComplete = jest.fn();
      const { result } = renderHook(() =>
        useQuizExerciseState({
          questions: MOCK_QUESTIONS,
          passThreshold: 2, // Only need 2 correct to pass
          onQuizComplete,
        }),
      );

      // Answer 2 correctly, 1 wrong
      act(() => {
        result.current.handleAnswer("Yes"); // Correct
      });
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      act(() => {
        result.current.handleAnswer(4); // Correct
      });
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      act(() => {
        result.current.handleAnswer("Red"); // Wrong
      });
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.quiz.passed).toBe(true);
      expect(onQuizComplete).toHaveBeenCalledWith(true, 2, 3);
    });
  });

  // ==========================================================================
  // Helper Functions
  // ==========================================================================
  describe("isCorrectAnswer", () => {
    it("returns true for correct answer", () => {
      const { result } = renderHook(() =>
        useQuizExerciseState({ questions: MOCK_QUESTIONS }),
      );

      expect(result.current.isCorrectAnswer("Yes")).toBe(true);
    });

    it("returns false for incorrect answer", () => {
      const { result } = renderHook(() =>
        useQuizExerciseState({ questions: MOCK_QUESTIONS }),
      );

      expect(result.current.isCorrectAnswer("No")).toBe(false);
    });

    it("handles numeric answers", () => {
      const { result } = renderHook(() =>
        useQuizExerciseState({ questions: MOCK_QUESTIONS }),
      );

      // Move to second question
      act(() => {
        result.current.handleAnswer("Yes");
      });
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.isCorrectAnswer(4)).toBe(true);
      expect(result.current.isCorrectAnswer(3)).toBe(false);
    });
  });

  // ==========================================================================
  // Reset
  // ==========================================================================
  describe("resetQuiz", () => {
    it("resets all quiz state", () => {
      const { result } = renderHook(() =>
        useQuizExerciseState({ questions: MOCK_QUESTIONS }),
      );

      // Answer some questions
      act(() => {
        result.current.handleAnswer("Yes");
      });
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      act(() => {
        result.current.handleAnswer(4);
      });

      // Reset
      act(() => {
        result.current.resetQuiz();
      });

      expect(result.current.quiz.currentIndex).toBe(0);
      expect(result.current.quiz.score).toBe(0);
      expect(result.current.quiz.selectedAnswer).toBeNull();
      expect(result.current.quiz.showFeedback).toBe(false);
      expect(result.current.quiz.passed).toBeNull();
      expect(result.current.currentQuestion).toEqual(MOCK_QUESTIONS[0]);
    });

    it("can be called after quiz completion", () => {
      const { result } = renderHook(() =>
        useQuizExerciseState({ questions: MOCK_QUESTIONS }),
      );

      // Complete the quiz
      act(() => {
        result.current.handleAnswer("Yes");
      });
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      act(() => {
        result.current.handleAnswer(4);
      });
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      act(() => {
        result.current.handleAnswer("Blue");
      });
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.quiz.passed).toBe(true);

      // Reset and verify
      act(() => {
        result.current.resetQuiz();
      });

      expect(result.current.quiz.passed).toBeNull();
      expect(result.current.quiz.currentIndex).toBe(0);
    });
  });
});
