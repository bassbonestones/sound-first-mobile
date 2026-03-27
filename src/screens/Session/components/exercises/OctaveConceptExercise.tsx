/**
 * OctaveConceptExercise - Teaches that octaves are the same note at different heights
 *
 * Flow: Intro → Listen to octaves → Quiz
 * Key concepts:
 * - An octave is the same note, higher or lower
 * - Notes an octave apart share the same letter name
 * - Octaves sound "the same but different"
 */
import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import type { LessonExerciseProps } from "./shared";
import { devWarn } from "../../../../utils/devLogger";
import { useQuizExerciseState } from "./shared/useQuizExerciseState";

// Audio context for playing notes - works on web, iOS, and Android
let AudioContextClass = null;
if (Platform.OS === "web") {
  AudioContextClass =
    typeof window !== "undefined"
      ? window.AudioContext || window.webkitAudioContext
      : null;
} else {
  try {
    AudioContextClass = require("react-native-audio-api").AudioContext;
  } catch (e) {
    devWarn("react-native-audio-api not available");
  }
}

// ============================================================
// CONSTANTS
// ============================================================

const PHASES = {
  INTRO: "intro",
  LISTEN: "listen",
  QUIZ: "quiz",
  RESULT: "result",
};

// Note to frequency conversion
const NOTE_FREQUENCIES = {
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
};

// Example octave pairs
const OCTAVE_PAIRS = [
  { low: "C3", high: "C4", name: "C" },
  { low: "D3", high: "D4", name: "D" },
  { low: "E3", high: "E4", name: "E" },
  { low: "G3", high: "G4", name: "G" },
  { low: "A3", high: "A4", name: "A" },
];

// Quiz questions
const QUIZ_QUESTIONS = [
  {
    id: "octave-1",
    question: "Notes that are an octave apart share the same ___.",
    correctAnswer: "Letter name",
    options: ["Letter name", "Frequency", "Volume", "Duration"],
  },
  {
    id: "octave-2",
    question: "If you play C, then play C an octave higher, they are...",
    correctAnswer: "Both called C",
    options: [
      "Different notes",
      "Both called C",
      "In different keys",
      "Unrelated",
    ],
  },
  {
    id: "octave-3",
    question: "An octave sounds like...",
    correctAnswer: "The same note, higher/lower",
    options: [
      "A completely different note",
      "The same note, higher/lower",
      "Two random notes",
      "A chord",
    ],
  },
];

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function OctaveConceptExercise({
  mini = {},
  sessionState = {},
  onComplete,
  onCancel,
  onProgress,
}: LessonExerciseProps) {
  const [phase, setPhase] = useState(PHASES.INTRO);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Quiz state via hook
  const {
    quiz,
    currentQuestion,
    totalQuestions,
    handleAnswer: handleQuizAnswer,
    isCorrectAnswer,
  } = useQuizExerciseState({
    questions: QUIZ_QUESTIONS,
    onProgress,
    onQuizComplete: (passed) => {
      setPhase(PHASES.RESULT);
    },
  });

  const audioContextRef = useRef(null);

  // Initialize audio context
  useEffect(() => {
    if (AudioContextClass && !audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Play a single note
  const playNote = useCallback((frequency, duration = 0.8) => {
    const ctx = audioContextRef.current;
    if (!ctx) return Promise.resolve();

    return new Promise((resolve) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.value = frequency;

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);

      setTimeout(resolve, duration * 1000);
    });
  }, []);

  // Play an octave pair
  const playOctavePair = useCallback(
    async (pair) => {
      if (isPlaying) return;
      setIsPlaying(true);

      const lowFreq = NOTE_FREQUENCIES[pair.low];
      const highFreq = NOTE_FREQUENCIES[pair.high];

      // Play low note
      await playNote(lowFreq, 0.7);
      await new Promise((r) => setTimeout(r, 200));
      // Play high note
      await playNote(highFreq, 0.7);
      await new Promise((r) => setTimeout(r, 200));
      // Play together
      playNote(lowFreq, 1.0);
      playNote(highFreq, 1.0);

      setTimeout(() => setIsPlaying(false), 1000);
    },
    [isPlaying, playNote],
  );

  // Complete exercise
  const handleComplete = useCallback(() => {
    const passed = quiz.score === totalQuestions; // Need 100%
    if (onComplete) {
      onComplete({ success: passed, score: quiz.score });
    }
  }, [onComplete, quiz.score, totalQuestions]);

  const currentPair = OCTAVE_PAIRS[currentPairIndex];

  // ============================================================
  // RENDER PHASES
  // ============================================================

  // Intro phase
  if (phase === PHASES.INTRO) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>The Octave</Text>
          <Text style={styles.subtitle}>Same Note, Different Height</Text>

          <View style={styles.card}>
            <Text style={styles.emoji}>🎹</Text>
            <Text style={styles.cardText}>
              You know that music uses 7 note names:{"\n"}
              <Text style={styles.highlight}>A B C D E F G</Text>
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              But a piano has 88 keys! How can 7 letters cover them all?
            </Text>
            <Text style={styles.emoji}>🤔</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              The answer:{" "}
              <Text style={styles.highlight}>The names repeat!</Text>
            </Text>
            <Text style={styles.cardText}>
              There's a low C, a middle C, a high C...{"\n"}
              They're all called "C" because they sound{" "}
              <Text style={styles.highlight}>like the same note</Text> – just
              higher or lower.
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setPhase(PHASES.LISTEN)}
          accessibilityLabel="Hear octave examples"
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Hear It →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Listen phase - hear octave examples
  if (phase === PHASES.LISTEN) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Listen to Octaves</Text>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              Tap to hear two notes that are an{" "}
              <Text style={styles.highlight}>octave</Text> apart:
            </Text>
          </View>

          <View style={styles.pairDisplay}>
            <View style={styles.noteColumn}>
              <Text style={styles.noteLabel}>Low {currentPair.name}</Text>
              <View style={styles.noteBadgeLow}>
                <Text style={styles.noteBadgeText}>{currentPair.low}</Text>
              </View>
            </View>

            <Text style={styles.plusSign}>+</Text>

            <View style={styles.noteColumn}>
              <Text style={styles.noteLabel}>High {currentPair.name}</Text>
              <View style={styles.noteBadgeHigh}>
                <Text style={styles.noteBadgeText}>{currentPair.high}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.playButton, isPlaying && styles.playButtonDisabled]}
            onPress={() => playOctavePair(currentPair)}
            disabled={isPlaying}
            accessibilityLabel="Play octave"
            accessibilityRole="button"
          >
            <Text style={styles.playButtonText}>
              {isPlaying ? "Playing..." : "▶ Play Octave"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.helperText}>
            Notice how they sound like the{" "}
            <Text style={styles.highlight}>same note</Text>, just at different
            heights?
          </Text>

          {/* Other pairs to try */}
          <View style={styles.pairSelector}>
            <Text style={styles.selectorLabel}>Try other octaves:</Text>
            <View style={styles.pairButtons}>
              {OCTAVE_PAIRS.map((pair, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.pairButton,
                    idx === currentPairIndex && styles.pairButtonActive,
                  ]}
                  onPress={() => setCurrentPairIndex(idx)}
                  accessibilityLabel={`Select ${pair.name} octave`}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.pairButtonText,
                      idx === currentPairIndex && styles.pairButtonTextActive,
                    ]}
                  >
                    {pair.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setPhase(PHASES.QUIZ)}
          accessibilityLabel="Start quiz"
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Got it! Quiz me →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Quiz phase
  if (phase === PHASES.QUIZ) {
    return (
      <View style={styles.container}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${((quiz.currentIndex + 1) / totalQuestions) * 100}%`,
              },
            ]}
          />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.quizProgress}>
            Question {quiz.currentIndex + 1} of {totalQuestions}
          </Text>

          <Text style={styles.quizQuestion}>{currentQuestion?.question}</Text>

          <View style={styles.optionsContainer}>
            {currentQuestion?.options.map((option, idx) => {
              const isSelected = quiz.selectedAnswer === option;
              const isCorrect = isCorrectAnswer(option);
              const showCorrect = quiz.showFeedback && isCorrect;
              const showWrong = quiz.showFeedback && isSelected && !isCorrect;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.optionButton,
                    showCorrect && styles.optionCorrect,
                    showWrong && styles.optionWrong,
                    isSelected && !quiz.showFeedback && styles.optionSelected,
                  ]}
                  onPress={() => !quiz.showFeedback && handleQuizAnswer(option)}
                  disabled={quiz.showFeedback}
                  accessibilityLabel={`Select ${option}`}
                  accessibilityRole="button"
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

          {quiz.showFeedback && (
            <View style={styles.feedbackContainer}>
              <Text
                style={[
                  styles.feedbackText,
                  isCorrectAnswer(quiz.selectedAnswer as string)
                    ? styles.feedbackCorrect
                    : styles.feedbackWrong,
                ]}
              >
                {isCorrectAnswer(quiz.selectedAnswer as string)
                  ? "✓ Correct!"
                  : `✗ The answer is: ${currentQuestion?.correctAnswer}`}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // Result phase
  if (phase === PHASES.RESULT) {
    const passed = quiz.score === totalQuestions;
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.resultEmoji}>{passed ? "🎉" : "📚"}</Text>
          <Text style={styles.resultTitle}>
            {passed ? "You understand octaves!" : "Let's review"}
          </Text>
          <Text style={styles.resultScore}>
            {quiz.score} / {totalQuestions} correct
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              <Text style={styles.highlight}>Key concept:</Text>
              {"\n\n"}
              An octave is the same note at a different height.{"\n\n"}C and
              high C are both "C" – just one is higher!
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleComplete}
          accessibilityLabel={passed ? "Continue" : "Try again"}
          accessibilityRole="button"
        >
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
  pairDisplay: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 24,
    gap: 20,
  },
  noteColumn: {
    alignItems: "center",
  },
  noteLabel: {
    fontSize: 14,
    color: "#808090",
    marginBottom: 8,
  },
  noteBadgeLow: {
    width: 70,
    height: 70,
    backgroundColor: "#7986cb",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  noteBadgeHigh: {
    width: 70,
    height: 70,
    backgroundColor: "#4fc3f7",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  noteBadgeText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  plusSign: {
    fontSize: 24,
    color: "#808090",
  },
  playButton: {
    backgroundColor: "#4fc3f7",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignSelf: "center",
    marginBottom: 24,
  },
  playButtonDisabled: {
    backgroundColor: "#4fc3f780",
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  helperText: {
    fontSize: 15,
    color: "#a0a0c0",
    textAlign: "center",
    marginBottom: 32,
  },
  pairSelector: {
    alignItems: "center",
  },
  selectorLabel: {
    fontSize: 14,
    color: "#808090",
    marginBottom: 12,
  },
  pairButtons: {
    flexDirection: "row",
    gap: 10,
  },
  pairButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#353565",
    borderRadius: 8,
  },
  pairButtonActive: {
    backgroundColor: "#4fc3f7",
  },
  pairButtonText: {
    fontSize: 16,
    color: "#a0a0c0",
  },
  pairButtonTextActive: {
    color: "#1a1a2e",
    fontWeight: "bold",
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
    fontSize: 16,
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
