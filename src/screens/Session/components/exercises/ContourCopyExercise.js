/**
 * ContourCopyExercise - "Follow the Contour" ear training drill
 *
 * Plays a 3-note melody and asks user to identify the shape (up-up, up-down, down-up, down-down)
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

// Contour shapes
const CONTOURS = {
  "up-up": "↗↗",
  "up-down": "↗↘",
  "down-up": "↘↗",
  "down-down": "↘↘",
};

export default function ContourCopyExercise({
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
  const intervalPool = config?.interval_pool || ["M2", "m2", "M3", "P4"];
  const masteryStreak = mastery?.correct_streak || 8;
  const baseNote = config?.use_first_note
    ? userFirstNote
    : config?.base_note || "C4";

  // Generate a random contour exercise
  const generateContour = useCallback(() => {
    const baseFreq = audio.noteToFrequency
      ? audio.noteToFrequency(baseNote)
      : 174.61;

    // Random octave shift
    const octaveShift = (Math.floor(Math.random() * 3) - 1) * 12;
    const fineOffset = Math.floor(Math.random() * 11) - 5;
    const totalOffset = octaveShift + fineOffset;

    // Helper to transpose
    const transpose = (freq, semitones) => freq * Math.pow(2, semitones / 12);

    const freq1 = transpose(baseFreq, totalOffset);

    // Pick random contour shape
    const shapes = ["up-up", "up-down", "down-up", "down-down"];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];

    // Pick random intervals
    const intervals = ["M2", "m2", "M3", "P4", "P5"];
    const intervalMap = { M2: 2, m2: 1, M3: 4, P4: 5, P5: 7 };

    const int1 =
      intervalMap[intervals[Math.floor(Math.random() * intervals.length)]];
    const int2 =
      intervalMap[intervals[Math.floor(Math.random() * intervals.length)]];

    let freq2, freq3;
    if (shape === "up-up") {
      freq2 = transpose(freq1, int1);
      freq3 = transpose(freq2, int2);
    } else if (shape === "up-down") {
      freq2 = transpose(freq1, int1);
      freq3 = transpose(freq2, -int2);
    } else if (shape === "down-up") {
      freq2 = transpose(freq1, -int1);
      freq3 = transpose(freq2, int2);
    } else {
      // down-down
      freq2 = transpose(freq1, -int1);
      freq3 = transpose(freq2, -int2);
    }

    return {
      frequencies: [freq1, freq2, freq3],
      correctAnswer: shape,
    };
  }, [audio, baseNote]);

  // Generate new exercise
  const generateNewExercise = useCallback(() => {
    const exercise = generateContour();
    setCurrentExercise(exercise);
    setHasAnswered(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
  }, [generateContour]);

  // Initialize first exercise
  useEffect(() => {
    generateNewExercise();
  }, []);

  // Play the current exercise (3 notes)
  const playExercise = useCallback(async () => {
    if (!currentExercise || isPlaying) return;

    setIsPlaying(true);
    const [f1, f2, f3] = currentExercise.frequencies;

    await audio.playNote(f1, 0.6);
    await new Promise((r) => setTimeout(r, 200));
    await audio.playNote(f2, 0.6);
    await new Promise((r) => setTimeout(r, 200));
    await audio.playNote(f3, 0.6);

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

      // Show feedback then next exercise
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
        if (streak + (correct ? 1 : 0) < masteryStreak) {
          generateNewExercise();
        }
      });
    },
    [
      hasAnswered,
      currentExercise,
      streak,
      masteryStreak,
      totalAttempts,
      correctCount,
      onComplete,
      onProgress,
      feedbackOpacity,
      generateNewExercise,
    ],
  );

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${(streak / masteryStreak) * 100}%` },
          ]}
        />
      </View>
      <Text style={styles.streakText}>
        {streak} / {masteryStreak} in a row
      </Text>

      {/* Question */}
      <Text style={styles.question}>What's the shape?</Text>
      <Text style={styles.subtitle}>Listen to 3 notes</Text>

      {/* Play button */}
      <TouchableOpacity
        style={[styles.playButton, isPlaying && styles.playButtonDisabled]}
        onPress={playExercise}
        disabled={isPlaying}
      >
        <Text style={styles.playButtonText}>
          {isPlaying ? "🔊 Playing..." : "🔊 Play Again"}
        </Text>
      </TouchableOpacity>

      {/* Answer buttons - 2x2 grid */}
      <View style={styles.answerGrid}>
        {Object.entries(CONTOURS).map(([shape, symbol]) => (
          <TouchableOpacity
            key={shape}
            style={[
              styles.answerButton,
              hasAnswered &&
                selectedAnswer === shape &&
                (isCorrect ? styles.correct : styles.incorrect),
              hasAnswered &&
                currentExercise?.correctAnswer === shape &&
                styles.correctAnswer,
            ]}
            onPress={() => handleAnswer(shape)}
            disabled={hasAnswered}
          >
            <Text style={styles.contourSymbol}>{symbol}</Text>
            <Text style={styles.answerButtonText}>
              {shape.replace("-", " → ")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Feedback overlay */}
      <Animated.View style={[styles.feedback, { opacity: feedbackOpacity }]}>
        <Text
          style={[
            styles.feedbackText,
            isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect,
          ]}
        >
          {isCorrect ? "✓ Correct!" : "✗ Not quite"}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 4,
  },
  streakText: {
    fontSize: 14,
    color: "#888",
    marginBottom: 32,
  },
  question: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#999",
    marginBottom: 24,
  },
  playButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 32,
  },
  playButtonDisabled: {
    opacity: 0.6,
  },
  playButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
  answerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    width: "100%",
  },
  answerButton: {
    backgroundColor: "#2a2a2a",
    width: "45%",
    minHeight: 100,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  contourSymbol: {
    fontSize: 36,
    marginBottom: 8,
  },
  answerButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  correct: {
    backgroundColor: "#1b5e20",
    borderColor: "#4CAF50",
  },
  incorrect: {
    backgroundColor: "#b71c1c",
    borderColor: "#f44336",
  },
  correctAnswer: {
    borderColor: "#4CAF50",
    borderWidth: 2,
  },
  feedback: {
    position: "absolute",
    top: "40%",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  feedbackText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  feedbackCorrect: {
    color: "#4CAF50",
  },
  feedbackIncorrect: {
    color: "#f44336",
  },
});
