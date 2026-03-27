/**
 * WholeStepsTheoryExercise - Teaches the concept of whole steps
 *
 * Key concepts:
 * - A whole step = 2 half steps
 * - On piano: skip one key (white or black)
 * - C to D is a whole step (skips C#)
 * - E to F# is a whole step (skips F)
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
import { useQuizExerciseState } from "./shared/useQuizExerciseState";
import { devWarn } from "../../../../utils/devLogger";
import MiniKeyboard from "./shared/MiniKeyboard";

// Audio context
// Audio context - works on web, iOS, and Android
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
  COMPARISON: "comparison",
  EXAMPLES: "examples",
  QUIZ: "quiz",
  RESULT: "result",
};

// Note frequencies
const NOTE_FREQUENCIES = {
  C4: 261.63,
  "C#4": 277.18,
  D4: 293.66,
  "D#4": 311.13,
  E4: 329.63,
  F4: 349.23,
  "F#4": 369.99,
  G4: 392.0,
  "G#4": 415.3,
  A4: 440.0,
  "A#4": 466.16,
  B4: 493.88,
  C5: 523.25,
};

// Whole step examples
const WHOLE_STEP_EXAMPLES = [
  {
    note1: "C4",
    note2: "D4",
    label: "C → D",
    skips: "C#",
    type: "white→white",
  },
  {
    note1: "D4",
    note2: "E4",
    label: "D → E",
    skips: "D#",
    type: "white→white",
  },
  {
    note1: "E4",
    note2: "F#4",
    label: "E → F#",
    skips: "F",
    type: "white→black",
  },
  {
    note1: "F4",
    note2: "G4",
    label: "F → G",
    skips: "F#",
    type: "white→white",
  },
  {
    note1: "A#4",
    note2: "C5",
    label: "A# → C",
    skips: "B",
    type: "black→white",
  },
];

// Quiz questions
const QUIZ_QUESTIONS = [
  {
    id: "whole_step_count",
    question: "A whole step equals how many half steps?",
    correctAnswer: "2",
    options: ["1", "2", "3", "4"],
  },
  {
    id: "c_to_d_reason",
    question: "C to D is a whole step because...",
    correctAnswer: "It skips one key (C#)",
    options: [
      "They're next to each other",
      "It skips one key (C#)",
      "They're both white keys",
      "They sound the same",
    ],
  },
  {
    id: "which_whole_step",
    question: "Which pair is a WHOLE step (not half)?",
    correctAnswer: "G to A",
    options: ["E to F", "B to C", "G to A", "C to C#"],
  },
  {
    id: "e_to_f_reason",
    question: "E to F is NOT a whole step because...",
    correctAnswer: "There's no key between them",
    options: [
      "It's too far apart",
      "There's no key between them",
      "They're both white keys",
      "E and F don't exist",
    ],
  },
];

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function WholeStepsTheoryExercise({
  mini = {},
  sessionState = {},
  onComplete,
  onCancel,
  onProgress,
}: LessonExerciseProps) {
  const [phase, setPhase] = useState(PHASES.INTRO);
  const [highlightedNotes, setHighlightedNotes] = useState([]);
  const [skippedNote, setSkippedNote] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentExample, setCurrentExample] = useState(0);

  // Use shared quiz hook for quiz state management
  const {
    quiz,
    currentQuestion,
    totalQuestions,
    handleAnswer: handleQuizAnswer,
    resetQuiz,
    isCorrectAnswer,
  } = useQuizExerciseState({
    questions: QUIZ_QUESTIONS,
    onProgress,
    onQuizComplete: (passed) => {
      setPhase(PHASES.RESULT);
    },
  });

  const audioContextRef = useRef(null);

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

  const playNote = useCallback((frequency, duration = 0.5) => {
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

  const playWholeStep = useCallback(
    async (example) => {
      if (isPlaying) return;
      setIsPlaying(true);

      const freq1 = NOTE_FREQUENCIES[example.note1];
      const freq2 = NOTE_FREQUENCIES[example.note2];

      setHighlightedNotes([example.note1]);
      setSkippedNote(null);
      await playNote(freq1, 0.6);

      await new Promise((r) => setTimeout(r, 200));

      // Show skipped note briefly
      setSkippedNote(example.skips + "4");
      await new Promise((r) => setTimeout(r, 300));

      setHighlightedNotes([example.note2]);
      await playNote(freq2, 0.6);

      await new Promise((r) => setTimeout(r, 200));

      // Play together
      setHighlightedNotes([example.note1, example.note2]);
      setSkippedNote(example.skips + "4");
      playNote(freq1, 0.8);
      playNote(freq2, 0.8);

      setTimeout(() => {
        setIsPlaying(false);
        setHighlightedNotes([]);
        setSkippedNote(null);
      }, 900);
    },
    [isPlaying, playNote],
  );

  const handleComplete = useCallback(() => {
    const passed = quiz.score === totalQuestions;
    if (onComplete) {
      onComplete({ success: passed, score: quiz.score });
    }
  }, [onComplete, quiz.score, totalQuestions]);

  // ============================================================
  // RENDER PHASES
  // ============================================================

  if (phase === PHASES.INTRO) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Whole Steps</Text>
          <Text style={styles.subtitle}>Two Half Steps Combined</Text>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              A <Text style={styles.highlight}>whole step</Text> is made of{" "}
              <Text style={styles.highlight}>2 half steps</Text>.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              On a piano, a whole step{" "}
              <Text style={styles.highlight}>skips one key</Text> — you jump
              over one key to the next.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.emoji}>🎹</Text>
            <Text style={styles.cardText}>
              C to D is a whole step — it skips C#!
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setPhase(PHASES.COMPARISON)}
        >
          <Text style={styles.primaryButtonText}>Compare to Half Steps →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === PHASES.COMPARISON) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Half vs Whole</Text>

          <MiniKeyboard
            highlightNotes={highlightedNotes}
            skippedNote={skippedNote}
          />

          <View style={styles.comparisonRow}>
            <View style={styles.comparisonCard}>
              <Text style={styles.comparisonTitle}>Half Step</Text>
              <Text style={styles.comparisonText}>
                C → C#{"\n"}(adjacent keys)
              </Text>
              <TouchableOpacity
                style={styles.smallPlayButton}
                onPress={async () => {
                  setHighlightedNotes(["C4"]);
                  await playNote(NOTE_FREQUENCIES["C4"], 0.6);
                  await new Promise((r) => setTimeout(r, 400));
                  setHighlightedNotes(["C#4"]);
                  await playNote(NOTE_FREQUENCIES["C#4"], 0.6);
                  await new Promise((r) => setTimeout(r, 400));
                  setHighlightedNotes([]);
                }}
              >
                <Text style={styles.smallPlayText}>▶</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.comparisonCard}>
              <Text style={styles.comparisonTitle}>Whole Step</Text>
              <Text style={styles.comparisonText}>C → D{"\n"}(skip C#)</Text>
              <TouchableOpacity
                style={styles.smallPlayButton}
                onPress={async () => {
                  setHighlightedNotes(["C4"]);
                  await playNote(NOTE_FREQUENCIES["C4"], 0.6);
                  await new Promise((r) => setTimeout(r, 300));
                  setSkippedNote("C#4");
                  await new Promise((r) => setTimeout(r, 400));
                  setHighlightedNotes(["D4"]);
                  await playNote(NOTE_FREQUENCIES["D4"], 0.6);
                  await new Promise((r) => setTimeout(r, 400));
                  setHighlightedNotes([]);
                  setSkippedNote(null);
                }}
              >
                <Text style={styles.smallPlayText}>▶</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              Notice the{" "}
              <Text style={styles.highlight}>whole step sounds bigger</Text> —
              because it covers more distance!
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setPhase(PHASES.EXAMPLES)}
        >
          <Text style={styles.primaryButtonText}>More Examples →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === PHASES.EXAMPLES) {
    const example = WHOLE_STEP_EXAMPLES[currentExample];

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Whole Step Examples</Text>

          <MiniKeyboard
            highlightNotes={highlightedNotes}
            skippedNote={skippedNote}
          />

          <View style={styles.card}>
            <Text style={styles.cardText}>
              <Text style={styles.highlight}>{example.label}</Text>
              {"\n"}(skips {example.skips})
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.playButton, isPlaying && styles.playButtonDisabled]}
            onPress={() => playWholeStep(example)}
            disabled={isPlaying}
          >
            <Text style={styles.playButtonText}>
              {isPlaying ? "Playing..." : "▶ Play Whole Step"}
            </Text>
          </TouchableOpacity>

          <View style={styles.exampleSelector}>
            <Text style={styles.selectorLabel}>Try other whole steps:</Text>
            <View style={styles.exampleButtons}>
              {WHOLE_STEP_EXAMPLES.map((ex, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.exampleButton,
                    idx === currentExample && styles.exampleButtonActive,
                  ]}
                  onPress={() => setCurrentExample(idx)}
                >
                  <Text
                    style={[
                      styles.exampleButtonText,
                      idx === currentExample && styles.exampleButtonTextActive,
                    ]}
                  >
                    {ex.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              🎯 <Text style={styles.highlight}>Remember:</Text>
              {"\n\n"}• Whole step = 2 half steps
              {"\n"}• Skip one key on the piano
              {"\n"}• Sounds "bigger" than a half step
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setPhase(PHASES.QUIZ)}
        >
          <Text style={styles.primaryButtonText}>Quiz Me →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === PHASES.QUIZ && currentQuestion) {
    return (
      <View style={styles.container}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((quiz.currentIndex + 1) / totalQuestions) * 100}%` },
            ]}
          />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.quizProgress}>
            Question {quiz.currentIndex + 1} of {totalQuestions}
          </Text>

          <Text style={styles.quizQuestion}>{currentQuestion.question}</Text>

          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, idx) => {
              const isSelected = quiz.selectedAnswer === option;
              const isCorrectOption = isCorrectAnswer(option);
              const showCorrect = quiz.showFeedback && isCorrectOption;
              const showWrong =
                quiz.showFeedback && isSelected && !isCorrectOption;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.optionButton,
                    showCorrect && styles.optionCorrect,
                    showWrong && styles.optionWrong,
                    isSelected && !quiz.showFeedback && styles.optionSelected,
                  ]}
                  onPress={() => handleQuizAnswer(option)}
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
                  isCorrectAnswer(quiz.selectedAnswer)
                    ? styles.feedbackCorrect
                    : styles.feedbackWrong,
                ]}
              >
                {isCorrectAnswer(quiz.selectedAnswer)
                  ? "✓ Correct!"
                  : `✗ The answer is: ${currentQuestion.correctAnswer}`}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  if (phase === PHASES.RESULT) {
    const passed = quiz.score === totalQuestions;

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.resultEmoji}>{passed ? "🎉" : "📚"}</Text>
          <Text style={styles.resultTitle}>
            {passed ? "You understand whole steps!" : "Let's review"}
          </Text>
          <Text style={styles.resultScore}>
            {quiz.score} / {totalQuestions} correct
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              <Text style={styles.highlight}>Key concepts:</Text>
              {"\n\n"}• Whole step = 2 half steps
              {"\n"}• Skip one key on piano
              {"\n"}• C→D, D→E, F→G, A→B are whole steps
              {"\n"}• E→F and B→C are half steps (no skip!)
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleComplete}
          accessibilityLabel="Complete lesson"
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
    color: "#81c784",
    fontWeight: "bold",
  },
  emoji: {
    fontSize: 48,
    textAlign: "center",
    marginVertical: 12,
  },
  primaryButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#81c784",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  comparisonRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  comparisonCard: {
    flex: 1,
    backgroundColor: "#252545",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#81c784",
    marginBottom: 8,
  },
  comparisonText: {
    fontSize: 14,
    color: "#e0e0f0",
    textAlign: "center",
    marginBottom: 12,
  },
  smallPlayButton: {
    backgroundColor: "#81c784",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  smallPlayText: {
    fontSize: 16,
    color: "#1a1a2e",
  },
  playButton: {
    backgroundColor: "#81c784",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignSelf: "center",
    marginVertical: 16,
  },
  playButtonDisabled: {
    backgroundColor: "#81c78480",
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  exampleSelector: {
    marginTop: 24,
    marginBottom: 16,
    alignItems: "center",
  },
  selectorLabel: {
    fontSize: 14,
    color: "#808090",
    marginBottom: 12,
  },
  exampleButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  exampleButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#353565",
    borderRadius: 8,
  },
  exampleButtonActive: {
    backgroundColor: "#81c784",
  },
  exampleButtonText: {
    fontSize: 14,
    color: "#a0a0c0",
  },
  exampleButtonTextActive: {
    color: "#1a1a2e",
    fontWeight: "bold",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#353565",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#81c784",
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
    borderColor: "#81c784",
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
