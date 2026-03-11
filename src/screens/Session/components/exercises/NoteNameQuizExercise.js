/**
 * NoteNameQuizExercise - Quiz on next/previous notes in sequence
 *
 * Used by:
 * - note_name_L2_after_g (what comes after?)
 * - note_name_L3_before_a (what comes before?)
 *
 * Configurable via mini.config:
 * - question_type: "next_note" or "previous_note"
 * - focus_on: array of notes to emphasize (e.g., ["G", "F", "E"])
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

const NOTE_NAMES = ["A", "B", "C", "D", "E", "F", "G"];

// Get next note in sequence
function getNextNote(note) {
  const idx = NOTE_NAMES.indexOf(note);
  return NOTE_NAMES[(idx + 1) % 7];
}

// Get previous note in sequence
function getPreviousNote(note) {
  const idx = NOTE_NAMES.indexOf(note);
  return NOTE_NAMES[(idx - 1 + 7) % 7];
}

// Generate wrong options (other notes that aren't the correct answer)
function getWrongOptions(correctAnswer, count = 3) {
  const options = NOTE_NAMES.filter((n) => n !== correctAnswer);
  // Shuffle and take 'count' items
  return options.sort(() => Math.random() - 0.5).slice(0, count);
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function NoteNameQuizExercise({
  mini = {},
  sessionState = {},
  onComplete,
  onCancel,
}) {
  const config = mini.config || {};
  const questionType = config.question_type || "next_note";
  const focusNotes = config.focus_on || NOTE_NAMES;
  const requiredStreak = mini.mastery?.correct_streak || 6;

  const [currentNote, setCurrentNote] = useState(() => {
    // Start with a random focus note
    return focusNotes[Math.floor(Math.random() * focusNotes.length)];
  });
  const [streak, setStreak] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Generate current question
  const questionData = useMemo(() => {
    const isNext = questionType === "next_note";
    const correctAnswer = isNext
      ? getNextNote(currentNote)
      : getPreviousNote(currentNote);
    const wrongOptions = getWrongOptions(correctAnswer, 3);
    const allOptions = [correctAnswer, ...wrongOptions].sort(
      () => Math.random() - 0.5,
    );

    return {
      question: isNext
        ? `What note comes after ${currentNote}?`
        : `What note comes before ${currentNote}?`,
      currentNote,
      correctAnswer,
      options: allOptions,
      isWrapAround:
        (isNext && currentNote === "G") || (!isNext && currentNote === "A"),
    };
  }, [currentNote, questionType]);

  // Handle answer selection
  const handleAnswer = useCallback(
    (answer) => {
      setSelectedAnswer(answer);
      setShowResult(true);
      setTotalAttempts((t) => t + 1);

      const isCorrect = answer === questionData.correctAnswer;
      if (isCorrect) {
        const newStreak = streak + 1;
        setStreak(newStreak);

        // Check if mastery achieved
        if (newStreak >= requiredStreak) {
          setIsComplete(true);
        }
      } else {
        setStreak(0); // Reset streak on wrong answer
      }
    },
    [questionData.correctAnswer, streak, requiredStreak],
  );

  // Move to next question
  const handleNext = useCallback(() => {
    setSelectedAnswer(null);
    setShowResult(false);

    // Pick a new note, preferring focus notes
    const nextNote = focusNotes[Math.floor(Math.random() * focusNotes.length)];
    setCurrentNote(nextNote);
  }, [focusNotes]);

  // Complete the exercise
  const handleComplete = useCallback(() => {
    if (onComplete) {
      onComplete({
        success: true,
        streak: streak,
        totalAttempts: totalAttempts,
      });
    }
  }, [onComplete, streak, totalAttempts]);

  // ============================================================
  // RENDER
  // ============================================================

  // Completion screen
  if (isComplete) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>Mastered!</Text>
          <Text style={styles.subtitle}>{requiredStreak} correct in a row</Text>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              {questionType === "next_note"
                ? "You've got the forward sequence down!\nA → B → C → D → E → F → G → A ..."
                : "You've got the backward sequence!\n... A ← B ← C ← D ← E ← F ← G ← A"}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalAttempts}</Text>
              <Text style={styles.statLabel}>Total tries</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {Math.round((streak / totalAttempts) * 100)}%
              </Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleComplete}>
          <Text style={styles.primaryButtonText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Quiz screen
  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.header}>
        <Text style={styles.streakText}>
          Streak: {streak} / {requiredStreak}
        </Text>
        <View style={styles.streakBar}>
          <View
            style={[
              styles.streakFill,
              { width: `${Math.min(100, (streak / requiredStreak) * 100)}%` },
            ]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Visual hint for wrap-around */}
        {questionData.isWrapAround && (
          <View style={styles.hintCard}>
            <Text style={styles.hintText}>
              💡 Remember: the pattern wraps around!
            </Text>
          </View>
        )}

        {/* Question */}
        <Text style={styles.question}>{questionData.question}</Text>

        {/* Current note display */}
        <View style={styles.noteDisplay}>
          <View style={styles.noteBadge}>
            <Text style={styles.noteText}>{currentNote}</Text>
          </View>
          <Text style={styles.arrowSymbol}>
            {questionType === "next_note" ? "→" : "←"}
          </Text>
          <View style={[styles.noteBadge, styles.noteBadgeQuestion]}>
            <Text style={styles.noteText}>?</Text>
          </View>
        </View>

        {/* Answer options */}
        <View style={styles.optionsGrid}>
          {questionData.options.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === questionData.correctAnswer;
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

        {/* Feedback */}
        {showResult && (
          <View style={styles.feedbackContainer}>
            {selectedAnswer === questionData.correctAnswer ? (
              <Text style={styles.feedbackCorrect}>
                ✓ Correct! {currentNote} → {questionData.correctAnswer}
              </Text>
            ) : (
              <View>
                <Text style={styles.feedbackWrong}>
                  ✗ Not quite. {currentNote}{" "}
                  {questionType === "next_note" ? "→" : "←"}{" "}
                  {questionData.correctAnswer}
                </Text>
                <Text style={styles.feedbackHint}>
                  {questionData.isWrapAround
                    ? questionType === "next_note"
                      ? "After G comes A (the pattern repeats)"
                      : "Before A comes G (wrap around)"
                    : `Think: A B C D E F G`}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Next button (shown after answering) */}
      {showResult && (
        <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
          <Text style={styles.primaryButtonText}>Next →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  header: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: "#252545",
  },
  streakText: {
    fontSize: 14,
    color: "#a0a0c0",
    marginBottom: 8,
    textAlign: "center",
  },
  streakBar: {
    height: 8,
    backgroundColor: "#353565",
    borderRadius: 4,
    overflow: "hidden",
  },
  streakFill: {
    height: "100%",
    backgroundColor: "#4fc3f7",
    borderRadius: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  hintCard: {
    backgroundColor: "#3d3d5c",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#ff9800",
  },
  hintText: {
    fontSize: 14,
    color: "#ffc107",
  },
  question: {
    fontSize: 24,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 32,
  },
  noteDisplay: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    gap: 16,
  },
  noteBadge: {
    width: 64,
    height: 64,
    backgroundColor: "#4fc3f7",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  noteBadgeQuestion: {
    backgroundColor: "#353565",
    borderWidth: 2,
    borderColor: "#4fc3f7",
    borderStyle: "dashed",
  },
  noteText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  arrowSymbol: {
    fontSize: 32,
    color: "#808090",
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  optionButton: {
    width: "45%",
    backgroundColor: "#353565",
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
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
    fontSize: 28,
    fontWeight: "bold",
    color: "#e0e0f0",
  },
  optionTextResult: {
    color: "#ffffff",
  },
  feedbackContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  feedbackCorrect: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4caf50",
    textAlign: "center",
  },
  feedbackWrong: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f44336",
    textAlign: "center",
    marginBottom: 8,
  },
  feedbackHint: {
    fontSize: 14,
    color: "#a0a0c0",
    textAlign: "center",
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
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#a0a0c0",
    marginBottom: 32,
  },
  card: {
    backgroundColor: "#252545",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    width: "100%",
  },
  cardText: {
    fontSize: 16,
    color: "#e0e0f0",
    textAlign: "center",
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
  },
  statBox: {
    backgroundColor: "#252545",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    minWidth: 100,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4fc3f7",
  },
  statLabel: {
    fontSize: 12,
    color: "#808090",
    marginTop: 4,
  },
});
