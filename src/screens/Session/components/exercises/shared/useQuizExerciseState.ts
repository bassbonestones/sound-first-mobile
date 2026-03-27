/**
 * useQuizExerciseState - Shared state management for quiz-based theory exercises
 *
 * Used by exercises that follow the pattern:
 * - Multiple intro/teaching phases
 * - Quiz phase with multiple choice questions
 * - Result phase showing pass/fail
 *
 * Exercises using this hook:
 * - TimeSignature44Exercise
 * - TimeSignatureBasicsExercise
 * - KeySignatureBasicsExercise
 * - WholeStepsTheoryExercise
 * - HalfStepsTheoryExercise
 */
import { useState, useCallback } from "react";

// =============================================================================
// Types
// =============================================================================

/**
 * Quiz question definition
 */
export interface QuizQuestion {
  /** Unique question identifier */
  id: string;
  /** Question type for rendering */
  type?: "yes_no" | "number" | "note" | "symbol" | "multiple_choice";
  /** Question text */
  question: string;
  /** Optional hint text */
  hint?: string;
  /** The correct answer (string or number) */
  correctAnswer: string | number;
  /** Available answer options */
  options: (string | number)[];
  /** Explanation shown after answering */
  explanation?: string;
}

/**
 * Quiz state
 */
export interface QuizState {
  /** Current question index (0-based) */
  currentIndex: number;
  /** Number of correct answers */
  score: number;
  /** Currently selected answer (null if none) */
  selectedAnswer: string | number | null;
  /** Whether showing answer feedback */
  showFeedback: boolean;
  /** Whether quiz is passed (only valid after completion) */
  passed: boolean | null;
}

/**
 * Configuration for the quiz hook
 */
export interface QuizConfig {
  /** Array of quiz questions */
  questions: QuizQuestion[];
  /** Minimum correct answers to pass (defaults to all) */
  passThreshold?: number;
  /** Delay before moving to next question (ms) */
  feedbackDelay?: number;
  /** Progress callback */
  onProgress?: (progress: {
    current: number;
    total: number;
    correct: number;
  }) => void;
  /** Called when quiz is completed */
  onQuizComplete?: (passed: boolean, score: number, total: number) => void;
}

/**
 * Return type for useQuizExerciseState
 */
export interface QuizExerciseState {
  /** Current quiz state */
  quiz: QuizState;
  /** Current question data */
  currentQuestion: QuizQuestion | null;
  /** Total number of questions */
  totalQuestions: number;
  /** Whether on last question */
  isLastQuestion: boolean;
  /** Handle answer selection */
  handleAnswer: (answer: string | number) => void;
  /** Reset quiz to beginning */
  resetQuiz: () => void;
  /** Check if selected answer is correct */
  isCorrectAnswer: (answer: string | number) => boolean;
  /** Progress percentage (0-100) */
  progressPercent: number;
}

// =============================================================================
// Initial State
// =============================================================================

const createInitialQuizState = (): QuizState => ({
  currentIndex: 0,
  score: 0,
  selectedAnswer: null,
  showFeedback: false,
  passed: null,
});

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for managing quiz exercise state
 *
 * @example
 * ```tsx
 * const { quiz, currentQuestion, handleAnswer, resetQuiz } = useQuizExerciseState({
 *   questions: QUIZ_QUESTIONS,
 *   onQuizComplete: (passed) => {
 *     if (passed) {
 *       onComplete({ success: true, mastered: true });
 *     }
 *   },
 * });
 * ```
 */
export function useQuizExerciseState({
  questions,
  passThreshold,
  feedbackDelay = 2000,
  onProgress,
  onQuizComplete,
}: QuizConfig): QuizExerciseState {
  const [quiz, setQuiz] = useState<QuizState>(createInitialQuizState);

  // Derived values
  const currentQuestion = questions[quiz.currentIndex] ?? null;
  const totalQuestions = questions.length;
  const isLastQuestion = quiz.currentIndex >= totalQuestions - 1;
  const requiredToPass = passThreshold ?? totalQuestions;
  const progressPercent =
    totalQuestions > 0
      ? Math.round(((quiz.currentIndex + 1) / totalQuestions) * 100)
      : 0;

  // Check if an answer is correct
  const isCorrectAnswer = useCallback(
    (answer: string | number): boolean => {
      if (!currentQuestion) return false;
      return answer === currentQuestion.correctAnswer;
    },
    [currentQuestion],
  );

  // Handle answer selection
  const handleAnswer = useCallback(
    (answer: string | number) => {
      if (quiz.showFeedback || !currentQuestion) return;

      const isCorrect = isCorrectAnswer(answer);

      setQuiz((prev) => ({
        ...prev,
        selectedAnswer: answer,
        showFeedback: true,
        score: isCorrect ? prev.score + 1 : prev.score,
      }));

      // Report progress
      onProgress?.({
        current: quiz.currentIndex + 1,
        total: totalQuestions,
        correct: quiz.score + (isCorrect ? 1 : 0),
      });

      // After delay, move to next question or complete
      setTimeout(() => {
        if (isLastQuestion) {
          // Quiz complete
          const finalScore = quiz.score + (isCorrect ? 1 : 0);
          const passed = finalScore >= requiredToPass;

          setQuiz((prev) => ({
            ...prev,
            showFeedback: false,
            passed,
          }));

          onQuizComplete?.(passed, finalScore, totalQuestions);
        } else {
          // Move to next question
          setQuiz((prev) => ({
            ...prev,
            currentIndex: prev.currentIndex + 1,
            selectedAnswer: null,
            showFeedback: false,
          }));
        }
      }, feedbackDelay);
    },
    [
      quiz.showFeedback,
      quiz.currentIndex,
      quiz.score,
      currentQuestion,
      isCorrectAnswer,
      isLastQuestion,
      totalQuestions,
      requiredToPass,
      feedbackDelay,
      onProgress,
      onQuizComplete,
    ],
  );

  // Reset quiz
  const resetQuiz = useCallback(() => {
    setQuiz(createInitialQuizState());
  }, []);

  return {
    quiz,
    currentQuestion,
    totalQuestions,
    isLastQuestion,
    handleAnswer,
    resetQuiz,
    isCorrectAnswer,
    progressPercent,
  };
}

export default useQuizExerciseState;
