/**
 * PitchDirectionExercise - "Up, Down, or Same?" ear training drill
 *
 * Plays two notes and asks user to identify if the second note was
 * higher (up), lower (down), or the same as the first.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import useExerciseAudio from "../../../../hooks/useExerciseAudio";
import { exercisePropTypes, exerciseDefaultProps } from "./shared";

export default function PitchDirectionExercise({
  config,
  mastery,
  onComplete,
  onProgress,
  userFirstNote = "F3",
}) {
  const audio = useExerciseAudio();

  // Exercise state
  const [currentExercise, setCurrentExercise] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [streak, setStreak] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  // Animation for feedback
  const [feedbackOpacity] = useState(new Animated.Value(0));

  // Config defaults
  const intervalPool = config?.interval_pool || ["M2", "m2", "M3", "P4", "P5"];
  const allowedAnswers = config?.allowed_answers || ["up", "down"];
  const includeSame = allowedAnswers.includes("same");
  const masteryStreak = mastery?.correct_streak || 8;
  const baseNote = config?.use_first_note
    ? userFirstNote
    : config?.base_note || "C4";

  // Generate new exercise
  const generateNewExercise = useCallback(() => {
    const exercise = audio.generatePitchDirection(
      baseNote,
      intervalPool,
      includeSame,
    );
    setCurrentExercise(exercise);
    setHasAnswered(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
  }, [audio, baseNote, intervalPool, includeSame]);

  // Initialize first exercise
  useEffect(() => {
    generateNewExercise();
  }, []);

  // Play the current exercise
  const playExercise = useCallback(async () => {
    if (!currentExercise || isPlaying) return;

    setIsPlaying(true);
    await audio.playTwoNotes(
      currentExercise.freq1,
      currentExercise.freq2,
      0.8,
      0.4,
    );
    setIsPlaying(false);
  }, [audio, currentExercise, isPlaying]);

  // Auto-play when exercise changes
  useEffect(() => {
    if (currentExercise && !hasAnswered) {
      const timer = setTimeout(() => {
        playExercise();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentExercise]);

  // Handle answer selection
  const handleAnswer = useCallback(
    (answer) => {
      if (hasAnswered || !currentExercise) return;

      setSelectedAnswer(answer);
      setHasAnswered(true);

      const correct = answer === currentExercise.correctAnswer;
      setIsCorrect(correct);
      setTotalAttempts((t) => t + 1);

      if (correct) {
        setCorrectCount((c) => c + 1);
        const newStreak = streak + 1;
        setStreak(newStreak);

        // Check for mastery
        if (newStreak >= masteryStreak) {
          setTimeout(() => {
            onComplete?.({
              success: true,
              streak: newStreak,
              totalAttempts: totalAttempts + 1,
              correctCount: correctCount + 1,
            });
          }, 1500);
          return;
        }

        onProgress?.({
          streak: newStreak,
          masteryRequired: masteryStreak,
          totalAttempts: totalAttempts + 1,
        });
      } else {
        setStreak(0);
        onProgress?.({
          streak: 0,
          masteryRequired: masteryStreak,
          totalAttempts: totalAttempts + 1,
        });
      }

      // Show feedback animation
      Animated.sequence([
        Animated.timing(feedbackOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
        Animated.timing(feedbackOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        generateNewExercise();
      });
    },
    [
      hasAnswered,
      currentExercise,
      streak,
      masteryStreak,
      feedbackOpacity,
      generateNewExercise,
      onComplete,
      onProgress,
      totalAttempts,
      correctCount,
    ],
  );

  const progressPercent = (streak / masteryStreak) * 100;

  // Button configs based on allowed answers
  const buttons = [];
  if (allowedAnswers.includes("up")) {
    buttons.push({ key: "up", icon: "⬆️", label: "Up", color: "#2d4a3d" });
  }
  if (allowedAnswers.includes("same")) {
    buttons.push({ key: "same", icon: "➡️", label: "Same", color: "#3d3d4a" });
  }
  if (allowedAnswers.includes("down")) {
    buttons.push({ key: "down", icon: "⬇️", label: "Down", color: "#4a2d3d" });
  }

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${progressPercent}%` }]}
          />
        </View>
        <Text style={styles.progressText}>
          {streak} / {masteryStreak} correct in a row
        </Text>
      </View>

      {/* Main instruction */}
      <View style={styles.instructionCard}>
        <Text style={styles.instructionIcon}>↕️</Text>
        <Text style={styles.instructionTitle}>Which way?</Text>
        <Text style={styles.instructionText}>
          Did the second note go UP, DOWN
          {includeSame ? ",\nor stay the SAME" : ""}?
        </Text>
      </View>

      {/* Play button */}
      <TouchableOpacity
        style={[styles.playButton, isPlaying && styles.playButtonDisabled]}
        onPress={playExercise}
        disabled={isPlaying}
        accessibilityLabel={isPlaying ? "Playing audio" : "Play audio again"}
        accessibilityRole="button"
      >
        <Text style={styles.playButtonIcon}>{isPlaying ? "🔊" : "▶️"}</Text>
        <Text style={styles.playButtonText}>
          {isPlaying ? "Playing..." : "Play Again"}
        </Text>
      </TouchableOpacity>

      {/* Answer buttons */}
      <View style={styles.answerContainer}>
        {buttons.map((btn) => (
          <TouchableOpacity
            key={btn.key}
            style={[
              styles.answerButton,
              { backgroundColor: btn.color },
              selectedAnswer === btn.key && styles.answerSelected,
              hasAnswered &&
                currentExercise?.correctAnswer === btn.key &&
                styles.correctAnswer,
              hasAnswered &&
                selectedAnswer === btn.key &&
                !isCorrect &&
                styles.wrongAnswer,
            ]}
            onPress={() => handleAnswer(btn.key)}
            disabled={hasAnswered}
            accessibilityLabel={`The note went ${btn.label}`}
            accessibilityRole="button"
          >
            <Text style={styles.answerButtonIcon}>{btn.icon}</Text>
            <Text style={styles.answerButtonText}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Feedback overlay */}
      <Animated.View
        style={[styles.feedbackOverlay, { opacity: feedbackOpacity }]}
      >
        <View
          style={[
            styles.feedbackCard,
            isCorrect ? styles.feedbackCorrect : styles.feedbackWrong,
          ]}
        >
          <Text style={styles.feedbackIcon}>{isCorrect ? "✅" : "❌"}</Text>
          <Text style={styles.feedbackText}>
            {isCorrect
              ? "Correct!"
              : `It went ${currentExercise?.correctAnswer}`}
          </Text>
        </View>
      </Animated.View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          Accuracy:{" "}
          {totalAttempts > 0
            ? Math.round((correctCount / totalAttempts) * 100)
            : 0}
          %
        </Text>
      </View>
    </View>
  );
}

// PropTypes validation
PitchDirectionExercise.propTypes = exercisePropTypes;
PitchDirectionExercise.defaultProps = exerciseDefaultProps;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#1a1a1a",
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 4,
  },
  progressText: {
    color: "#888",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  instructionCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  instructionIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  instructionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 24,
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1e3a5f",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  playButtonDisabled: {
    backgroundColor: "#2d4a6f",
  },
  playButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  playButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  answerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  answerButton: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 6,
  },
  answerSelected: {
    borderWidth: 3,
    borderColor: "#FFD700",
  },
  correctAnswer: {
    backgroundColor: "#2d5a2d",
    borderWidth: 3,
    borderColor: "#4CAF50",
  },
  wrongAnswer: {
    backgroundColor: "#5a2d2d",
    borderWidth: 3,
    borderColor: "#f44336",
  },
  answerButtonIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  answerButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  feedbackOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    pointerEvents: "none",
  },
  feedbackCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
  },
  feedbackCorrect: {
    backgroundColor: "#2d5a2d",
  },
  feedbackWrong: {
    backgroundColor: "#5a2d2d",
  },
  feedbackIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  feedbackText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  statsContainer: {
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  statsText: {
    color: "#666",
    fontSize: 14,
  },
});
