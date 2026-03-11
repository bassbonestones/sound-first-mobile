/**
 * NoteNamePatternExercise - Teaches the seven note names A B C D E F G
 *
 * Flow: Intro → Visual Pattern → Quiz
 * Key concepts:
 * - Music uses only 7 letter names: A B C D E F G
 * - After G, it wraps back to A
 * - The pattern repeats forever
 */
import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

// ============================================================
// CONSTANTS
// ============================================================

const PHASES = {
  INTRO: "intro",
  PATTERN: "pattern",
  QUIZ: "quiz",
  RESULT: "result",
};

const NOTE_NAMES = ["A", "B", "C", "D", "E", "F", "G"];

// Quiz questions
const QUIZ_QUESTIONS = [
  {
    question: "How many letter names are used in music?",
    correctAnswer: "7",
    options: ["5", "7", "12", "26"],
  },
  {
    question: "What letter comes after G?",
    correctAnswer: "A",
    options: ["H", "A", "F", "Nothing"],
  },
  {
    question: "What letter comes before A?",
    correctAnswer: "G",
    options: ["Z", "Nothing", "G", "B"],
  },
  {
    question: "Which of these is NOT a note name?",
    correctAnswer: "H",
    options: ["A", "D", "G", "H"],
  },
];

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function NoteNamePatternExercise({
  mini = {},
  sessionState = {},
  onComplete,
  onCancel,
}) {
  const [phase, setPhase] = useState(PHASES.INTRO);
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  // Shuffle questions on mount
  const questions = useMemo(() => {
    return [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 4);
  }, []);

  // Handle quiz answer
  const handleAnswer = useCallback(
    (answer) => {
      setSelectedAnswer(answer);
      setShowResult(true);
      const isCorrect = answer === questions[quizIndex].correctAnswer;
      if (isCorrect) {
        setScore((s) => s + 1);
      }
    },
    [quizIndex, questions],
  );

  // Move to next question or result
  const handleNext = useCallback(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    if (quizIndex < questions.length - 1) {
      setQuizIndex((i) => i + 1);
    } else {
      setPhase(PHASES.RESULT);
    }
  }, [quizIndex, questions.length]);

  // Complete the exercise
  const handleComplete = useCallback(() => {
    const passed = score === questions.length; // Need 100%
    if (onComplete) {
      onComplete({
        success: passed,
        score: score,
        total: questions.length,
      });
    }
  }, [onComplete, score, questions.length]);

  // Animate through the pattern
  const animatePattern = useCallback(() => {
    let i = 0;
    const interval = setInterval(() => {
      setHighlightIndex(i % 14); // Show 2 cycles
      i++;
      if (i > 14) {
        clearInterval(interval);
        setHighlightIndex(-1);
      }
    }, 400);
  }, []);

  // ============================================================
  // RENDER PHASES
  // ============================================================

  // Intro phase
  if (phase === PHASES.INTRO) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Note Names</Text>
          <Text style={styles.subtitle}>The Musical Alphabet</Text>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              In music, we use{" "}
              <Text style={styles.highlight}>only 7 letters</Text> to name
              notes:
            </Text>
            <View style={styles.letterRow}>
              {NOTE_NAMES.map((letter, idx) => (
                <View key={idx} style={styles.letterBox}>
                  <Text style={styles.letterText}>{letter}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.cardText}>
              That's it! No H, I, J... just A through G.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              But wait... a piano has 88 keys! How can 7 letters name them all?
            </Text>
            <Text style={styles.emoji}>🤔</Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setPhase(PHASES.PATTERN)}
        >
          <Text style={styles.primaryButtonText}>Find Out →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Pattern phase - show the repeating cycle
  if (phase === PHASES.PATTERN) {
    const displayPattern = [...NOTE_NAMES, ...NOTE_NAMES]; // Show 2 cycles
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>The Pattern Repeats!</Text>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              After G, we go back to A and start over:
            </Text>
            <View style={styles.patternContainer}>
              {displayPattern.map((letter, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.patternBox,
                    idx === highlightIndex && styles.patternBoxHighlight,
                    idx === 7 && styles.patternBoxWrap, // Mark the wrap point
                  ]}
                >
                  <Text
                    style={[
                      styles.patternLetter,
                      idx === highlightIndex && styles.patternLetterHighlight,
                    ]}
                  >
                    {letter}
                  </Text>
                  {idx === 6 && <Text style={styles.arrowText}>↩</Text>}
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={animatePattern}
            >
              <Text style={styles.secondaryButtonText}>▶ See it animate</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.emoji}>💡</Text>
            <Text style={styles.cardText}>
              This cycle repeats forever:{"\n"}
              ...E F G <Text style={styles.highlight}>A</Text> B C D E F G{" "}
              <Text style={styles.highlight}>A</Text> B C...
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              <Text style={styles.highlight}>Key insight:</Text> Every A on a
              piano is named "A". Same for B, C, D, E, F, and G.
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setPhase(PHASES.QUIZ)}
        >
          <Text style={styles.primaryButtonText}>Got it! Quiz me →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Quiz phase
  if (phase === PHASES.QUIZ) {
    const currentQ = questions[quizIndex];
    return (
      <View style={styles.container}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((quizIndex + 1) / questions.length) * 100}%` },
            ]}
          />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.quizProgress}>
            Question {quizIndex + 1} of {questions.length}
          </Text>

          <Text style={styles.quizQuestion}>{currentQ.question}</Text>

          <View style={styles.optionsContainer}>
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQ.correctAnswer;
              const showCorrect = showResult && isCorrect;
              const showWrong = showResult && isSelected && !isCorrect;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.optionButton,
                    showCorrect && styles.optionCorrect,
                    showWrong && styles.optionWrong,
                    isSelected && !showResult && styles.optionSelected,
                  ]}
                  onPress={() => !showResult && handleAnswer(option)}
                  disabled={showResult}
                >
                  <Text
                    style={[
                      styles.optionText,
                      (showCorrect || showWrong) && styles.optionTextResult,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {showResult && (
            <View style={styles.feedbackContainer}>
              <Text
                style={[
                  styles.feedbackText,
                  selectedAnswer === currentQ.correctAnswer
                    ? styles.feedbackCorrect
                    : styles.feedbackWrong,
                ]}
              >
                {selectedAnswer === currentQ.correctAnswer
                  ? "✓ Correct!"
                  : `✗ The answer is: ${currentQ.correctAnswer}`}
              </Text>
            </View>
          )}
        </ScrollView>

        {showResult && (
          <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
            <Text style={styles.primaryButtonText}>
              {quizIndex < questions.length - 1 ? "Next →" : "See Results →"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Result phase
  if (phase === PHASES.RESULT) {
    const passed = score === questions.length;
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.resultEmoji}>{passed ? "🎉" : "📚"}</Text>
          <Text style={styles.resultTitle}>
            {passed ? "Great job!" : "Keep practicing!"}
          </Text>
          <Text style={styles.resultScore}>
            You got {score} out of {questions.length} correct
          </Text>

          {passed ? (
            <View style={styles.card}>
              <Text style={styles.cardText}>
                You've learned the seven note names:{"\n"}
                <Text style={styles.highlight}>A B C D E F G</Text>
              </Text>
              <Text style={styles.cardText}>
                Remember: after G, it wraps back to A!
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardText}>
                Remember:{"\n"}• Only 7 letters: A B C D E F G{"\n"}• After G
                comes A again{"\n"}• The pattern repeats forever
              </Text>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity style={styles.primaryButton} onPress={handleComplete}>
          <Text style={styles.primaryButtonText}>
            {passed ? "Continue →" : "Try Again"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#a0a0c0",
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#252545",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  cardText: {
    fontSize: 17,
    color: "#e0e0f0",
    lineHeight: 26,
    textAlign: "center",
  },
  highlight: {
    color: "#4fc3f7",
    fontWeight: "bold",
  },
  emoji: {
    fontSize: 48,
    textAlign: "center",
    marginVertical: 12,
  },
  letterRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 20,
    gap: 8,
  },
  letterBox: {
    width: 40,
    height: 40,
    backgroundColor: "#4fc3f7",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  letterText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  patternContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginVertical: 16,
    gap: 6,
  },
  patternBox: {
    width: 36,
    height: 36,
    backgroundColor: "#353565",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  patternBoxHighlight: {
    backgroundColor: "#4fc3f7",
    transform: [{ scale: 1.1 }],
  },
  patternBoxWrap: {
    borderLeftWidth: 2,
    borderLeftColor: "#ff9800",
    marginLeft: 8,
    paddingLeft: 4,
  },
  patternLetter: {
    fontSize: 18,
    fontWeight: "600",
    color: "#c0c0d0",
  },
  patternLetterHighlight: {
    color: "#1a1a2e",
  },
  arrowText: {
    position: "absolute",
    right: -18,
    fontSize: 14,
    color: "#ff9800",
  },
  primaryButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#4fc3f7",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  secondaryButton: {
    backgroundColor: "#353565",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 16,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: "#4fc3f7",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#353565",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4fc3f7",
  },
  quizProgress: {
    fontSize: 14,
    color: "#808090",
    textAlign: "center",
    marginBottom: 20,
  },
  quizQuestion: {
    fontSize: 22,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 32,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: "#353565",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionSelected: {
    borderColor: "#4fc3f7",
  },
  optionCorrect: {
    backgroundColor: "#2e7d32",
    borderColor: "#4caf50",
  },
  optionWrong: {
    backgroundColor: "#c62828",
    borderColor: "#f44336",
  },
  optionText: {
    fontSize: 18,
    color: "#e0e0f0",
    textAlign: "center",
  },
  optionTextResult: {
    color: "#ffffff",
    fontWeight: "600",
  },
  feedbackContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: "600",
  },
  feedbackCorrect: {
    color: "#4caf50",
  },
  feedbackWrong: {
    color: "#f44336",
  },
  resultEmoji: {
    fontSize: 64,
    textAlign: "center",
    marginTop: 40,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 12,
  },
  resultScore: {
    fontSize: 18,
    color: "#a0a0c0",
    textAlign: "center",
    marginBottom: 32,
  },
});
