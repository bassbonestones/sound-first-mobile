/**
 * NaturalAccidentalExercise - Teaches the natural sign (♮)
 *
 * Key concepts:
 * - The natural sign (♮) cancels a sharp or flat
 * - Returns a note to its "natural" (white key) state
 * - Used when a previous sharp/flat needs to be cancelled
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
  CANCELLING: "cancelling",
  EXAMPLES: "examples",
  QUIZ: "quiz",
  RESULT: "result",
};

// Note frequencies
const NOTE_FREQUENCIES = {
  C4: 261.63,
  "C#4": 277.18,
  D4: 293.66,
  Db4: 277.18,
  "D#4": 311.13,
  Eb4: 311.13,
  E4: 329.63,
  F4: 349.23,
  "F#4": 369.99,
  Gb4: 369.99,
  G4: 392.0,
  "G#4": 415.3,
  Ab4: 415.3,
  A4: 440.0,
  "A#4": 466.16,
  Bb4: 466.16,
  B4: 493.88,
};

// Quiz questions
const QUIZ_QUESTIONS = [
  {
    question: "What does the natural sign (♮) do?",
    correctAnswer: "Cancels a sharp or flat",
    options: [
      "Raises a note by a half step",
      "Lowers a note by a half step",
      "Cancels a sharp or flat",
      "Makes a note louder",
    ],
  },
  {
    question: "If you see F# then F♮, the F♮ is...",
    correctAnswer: "Regular F (white key)",
    options: [
      "Still F# (black key)",
      "Regular F (white key)",
      "Lower than F",
      "The same as F#",
    ],
  },
  {
    question: "B♭ followed by B♮ means play...",
    correctAnswer: "Regular B (white key)",
    options: [
      "B♭ again",
      "Regular B (white key)",
      "B# (higher)",
      "Any B you want",
    ],
  },
  {
    question: "The natural sign returns a note to its _____ state.",
    correctAnswer: "white key / unaltered",
    options: ["black key", "white key / unaltered", "sharped", "flatted"],
  },
];

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function NaturalAccidentalExercise({
  mini = {},
  sessionState = {},
  onComplete,
  onCancel,
}: LessonExerciseProps) {
  const [phase, setPhase] = useState(PHASES.INTRO);
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioContextRef = useRef(null);

  // Initialize audio
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

  // Play a note
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

  // Play cancellation example
  const playCancellation = useCallback(
    async (altered, natural) => {
      if (isPlaying) return;
      setIsPlaying(true);

      // Play altered note
      await playNote(NOTE_FREQUENCIES[altered], 0.6);
      await new Promise((r) => setTimeout(r, 300));

      // Play natural note
      await playNote(NOTE_FREQUENCIES[natural], 0.6);

      setIsPlaying(false);
    },
    [isPlaying, playNote],
  );

  // Handle quiz answer
  const handleAnswer = useCallback(
    (answer) => {
      setSelectedAnswer(answer);
      setShowResult(true);
      if (answer === QUIZ_QUESTIONS[quizIndex].correctAnswer) {
        setScore((s) => s + 1);
      }
    },
    [quizIndex],
  );

  // Next question
  const handleNext = useCallback(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    if (quizIndex < QUIZ_QUESTIONS.length - 1) {
      setQuizIndex((i) => i + 1);
    } else {
      setPhase(PHASES.RESULT);
    }
  }, [quizIndex]);

  // Complete exercise
  const handleComplete = useCallback(() => {
    const passed = score === QUIZ_QUESTIONS.length; // 100% required
    if (onComplete) {
      onComplete({ success: passed, score });
    }
  }, [onComplete, score]);

  // ============================================================
  // RENDER PHASES
  // ============================================================

  // Intro
  if (phase === PHASES.INTRO) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>The Natural Sign</Text>
          <Text style={styles.bigSymbol}>♮</Text>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              The <Text style={styles.highlight}>natural sign (♮)</Text> cancels
              a sharp or flat.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              It returns a note to its{" "}
              <Text style={styles.highlight}>original, unaltered</Text> state —
              the white key on a piano.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              Think of it as an <Text style={styles.highlight}>"undo"</Text>{" "}
              button for sharps and flats!
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setPhase(PHASES.CANCELLING)}
        >
          <Text style={styles.primaryButtonText}>See How It Works →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Cancelling sharps/flats
  if (phase === PHASES.CANCELLING) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Cancelling Accidentals</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cancelling a Sharp:</Text>
            <Text style={styles.cardText}>
              <Text style={styles.highlightSharp}>F#</Text> →{" "}
              <Text style={styles.highlightNatural}>F♮</Text>
              {"\n\n"}
              The F♮ goes back down to regular F (white key)
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.playButton, isPlaying && styles.playButtonDisabled]}
            onPress={() => playCancellation("F#4", "F4")}
            disabled={isPlaying}
          >
            <Text style={styles.playButtonText}>
              {isPlaying ? "Playing..." : "▶ Hear F# → F♮"}
            </Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cancelling a Flat:</Text>
            <Text style={styles.cardText}>
              <Text style={styles.highlightFlat}>B♭</Text> →{" "}
              <Text style={styles.highlightNatural}>B♮</Text>
              {"\n\n"}
              The B♮ goes back up to regular B (white key)
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.playButton, isPlaying && styles.playButtonDisabled]}
            onPress={() => playCancellation("Bb4", "B4")}
            disabled={isPlaying}
          >
            <Text style={styles.playButtonText}>
              {isPlaying ? "Playing..." : "▶ Hear B♭ → B♮"}
            </Text>
          </TouchableOpacity>
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

  // More examples
  if (phase === PHASES.EXAMPLES) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>When You'll See Naturals</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>In Key Signatures:</Text>
            <Text style={styles.cardText}>
              If a piece is in a key with sharps or flats, naturals are used to
              temporarily cancel them.
              {"\n\n"}
              Example: In G major (1 sharp: F#), you might see F♮ to play a
              regular F.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>After an Accidental:</Text>
            <Text style={styles.cardText}>
              If a sharp or flat appears earlier in the same measure, a natural
              cancels it.
              {"\n\n"}
              Example: C# ... C♮ (back to regular C)
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              🎯 <Text style={styles.highlight}>Remember:</Text>
              {"\n\n"}• ♮ cancels # (sharp)
              {"\n"}• ♮ cancels ♭ (flat)
              {"\n"}• ♮ = "go back to normal" white key
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

  // Quiz phase
  if (phase === PHASES.QUIZ) {
    const currentQ = QUIZ_QUESTIONS[quizIndex];

    return (
      <View style={styles.container}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((quizIndex + 1) / QUIZ_QUESTIONS.length) * 100}%` },
            ]}
          />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.quizProgress}>
            Question {quizIndex + 1} of {QUIZ_QUESTIONS.length}
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
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNext}
            accessibilityLabel="Next step"
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>
              {quizIndex < QUIZ_QUESTIONS.length - 1
                ? "Next →"
                : "See Results →"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Result phase
  if (phase === PHASES.RESULT) {
    const passed = score === QUIZ_QUESTIONS.length;

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.resultEmoji}>{passed ? "🎉" : "📚"}</Text>
          <Text style={styles.resultTitle}>
            {passed ? "You understand naturals!" : "Let's review"}
          </Text>
          <Text style={styles.resultScore}>
            {score} / {QUIZ_QUESTIONS.length} correct
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              <Text style={styles.highlight}>Key points:</Text>
              {"\n\n"}• ♮ = natural sign
              {"\n"}• Cancels sharps and flats
              {"\n"}• Returns note to white key
              {"\n"}• Like an "undo" for accidentals
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
  bigSymbol: {
    fontSize: 72,
    textAlign: "center",
    marginVertical: 20,
    color: "#9c9cff", // Purple-ish for natural
  },
  card: {
    backgroundColor: "#252545",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#9c9cff",
    marginBottom: 12,
  },
  cardText: {
    fontSize: 17,
    color: "#e0e0f0",
    lineHeight: 26,
    textAlign: "center",
  },
  highlight: {
    color: "#9c9cff",
    fontWeight: "bold",
  },
  highlightSharp: {
    color: "#ff9800",
    fontWeight: "bold",
  },
  highlightFlat: {
    color: "#4fc3f7",
    fontWeight: "bold",
  },
  highlightNatural: {
    color: "#9c9cff",
    fontWeight: "bold",
  },
  primaryButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#9c9cff",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  playButton: {
    backgroundColor: "#9c9cff",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 20,
  },
  playButtonDisabled: {
    backgroundColor: "#9c9cff80",
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#353565",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#9c9cff",
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
    borderColor: "#9c9cff",
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
