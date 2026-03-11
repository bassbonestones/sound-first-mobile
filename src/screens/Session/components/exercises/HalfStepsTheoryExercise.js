/**
 * HalfStepsTheoryExercise - Teaches the concept of half steps (semitones)
 *
 * Key concepts:
 * - A half step is the smallest interval in Western music
 * - On piano: any two adjacent keys (including black keys)
 * - E-F and B-C are natural half steps (white to white)
 * - All other adjacent notes require a black key
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
import { exercisePropTypes, exerciseDefaultProps } from "./shared";

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
    console.warn("react-native-audio-api not available");
  }
}

// ============================================================
// CONSTANTS
// ============================================================

const PHASES = {
  INTRO: "intro",
  KEYBOARD: "keyboard",
  NATURAL_HALF_STEPS: "natural_half_steps",
  HEAR_IT: "hear_it",
  QUIZ: "quiz",
  RESULT: "result",
};

// Note frequencies (for audio)
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

// Piano key layout (one octave + C5)
const PIANO_KEYS = [
  { note: "C4", isBlack: false, label: "C" },
  { note: "C#4", isBlack: true, label: "C#" },
  { note: "D4", isBlack: false, label: "D" },
  { note: "D#4", isBlack: true, label: "D#" },
  { note: "E4", isBlack: false, label: "E" },
  { note: "F4", isBlack: false, label: "F" },
  { note: "F#4", isBlack: true, label: "F#" },
  { note: "G4", isBlack: false, label: "G" },
  { note: "G#4", isBlack: true, label: "G#" },
  { note: "A4", isBlack: false, label: "A" },
  { note: "A#4", isBlack: true, label: "A#" },
  { note: "B4", isBlack: false, label: "B" },
  { note: "C5", isBlack: false, label: "C" },
];

// Half step examples
const HALF_STEP_EXAMPLES = [
  { note1: "E4", note2: "F4", label: "E → F", isNatural: true },
  { note1: "B4", note2: "C5", label: "B → C", isNatural: true },
  { note1: "C4", note2: "C#4", label: "C → C#", isNatural: false },
  { note1: "F4", note2: "F#4", label: "F → F#", isNatural: false },
];

// Quiz questions
const QUIZ_QUESTIONS = [
  {
    question: "A half step is the _____ interval in Western music.",
    correctAnswer: "smallest",
    options: ["smallest", "largest", "medium", "loudest"],
  },
  {
    question: "E to F is a half step because...",
    correctAnswer: "They're adjacent keys with no black key between",
    options: [
      "They're adjacent keys with no black key between",
      "They're far apart on the keyboard",
      "They're both white keys",
      "They sound the same",
    ],
  },
  {
    question: "Which pair is NOT a half step?",
    correctAnswer: "C to D",
    options: ["E to F", "B to C", "C to C#", "C to D"],
  },
  {
    question: "How many half steps are in one octave?",
    correctAnswer: "12",
    options: ["7", "8", "10", "12"],
  },
];

// ============================================================
// MINI KEYBOARD COMPONENT
// ============================================================

function MiniKeyboard({
  highlightNotes = [],
  onKeyPress,
  interactive = false,
}) {
  const whiteKeys = PIANO_KEYS.filter((k) => !k.isBlack);
  const blackKeys = PIANO_KEYS.filter((k) => k.isBlack);

  // White key dimensions: 40px width + 2px margin each side = 44px per key
  const WHITE_KEY_WIDTH = 44;
  const BLACK_KEY_WIDTH = 28;

  return (
    <View style={keyboardStyles.container}>
      {/* Inner wrapper with fixed width to hold both rows */}
      <View style={keyboardStyles.keyboardWrapper}>
        {/* White keys */}
        <View style={keyboardStyles.whiteKeysRow}>
          {whiteKeys.map((key, idx) => {
            const isHighlighted = highlightNotes.includes(key.note);
            return (
              <TouchableOpacity
                key={key.note}
                style={[
                  keyboardStyles.whiteKey,
                  isHighlighted && keyboardStyles.whiteKeyHighlighted,
                ]}
                onPress={() => interactive && onKeyPress?.(key.note)}
                disabled={!interactive}
              >
                <Text
                  style={[
                    keyboardStyles.whiteKeyLabel,
                    isHighlighted && keyboardStyles.keyLabelHighlighted,
                  ]}
                >
                  {key.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {/* Black keys - positioned absolutely within wrapper */}
        <View style={keyboardStyles.blackKeysRow}>
          {blackKeys.map((key) => {
            const isHighlighted = highlightNotes.includes(key.note);
            // Position black keys between white keys
            // Black key sits at the right edge of its preceding white key
            const whiteKeyIndices = {
              "C#4": 0, // Between C(0) and D(1)
              "D#4": 1, // Between D(1) and E(2)
              "F#4": 3, // Between F(3) and G(4)
              "G#4": 4, // Between G(4) and A(5)
              "A#4": 5, // Between A(5) and B(6)
            };
            const whiteIdx = whiteKeyIndices[key.note];
            if (whiteIdx === undefined) return null;

            // Position: center of gap between white keys
            const leftPos =
              (whiteIdx + 1) * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2;

            return (
              <TouchableOpacity
                key={key.note}
                style={[
                  keyboardStyles.blackKey,
                  { left: leftPos },
                  isHighlighted && keyboardStyles.blackKeyHighlighted,
                ]}
                onPress={() => interactive && onKeyPress?.(key.note)}
                disabled={!interactive}
              >
                <Text
                  style={[
                    keyboardStyles.blackKeyLabel,
                    isHighlighted && keyboardStyles.keyLabelHighlighted,
                  ]}
                >
                  {key.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const keyboardStyles = StyleSheet.create({
  container: {
    height: 140,
    alignItems: "center",
    marginVertical: 16,
  },
  keyboardWrapper: {
    position: "relative",
    width: 352, // 8 white keys * 44px (40px + 4px margin)
    height: 120,
  },
  whiteKeysRow: {
    flexDirection: "row",
    height: 120,
  },
  whiteKey: {
    width: 40,
    height: 120,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 4,
    marginHorizontal: 2,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 8,
  },
  whiteKeyHighlighted: {
    backgroundColor: "#4fc3f7",
  },
  whiteKeyLabel: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  blackKeysRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  blackKey: {
    position: "absolute",
    width: 28,
    height: 75,
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 4,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 6,
  },
  blackKeyHighlighted: {
    backgroundColor: "#ff9800",
  },
  blackKeyLabel: {
    fontSize: 10,
    color: "#888",
    fontWeight: "600",
  },
  keyLabelHighlighted: {
    color: "#1a1a2e",
    fontWeight: "bold",
  },
});

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function HalfStepsTheoryExercise({
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
  const [highlightedNotes, setHighlightedNotes] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentExample, setCurrentExample] = useState(0);

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

  // Play a half step example
  const playHalfStep = useCallback(
    async (example) => {
      if (isPlaying) return;
      setIsPlaying(true);

      const freq1 = NOTE_FREQUENCIES[example.note1];
      const freq2 = NOTE_FREQUENCIES[example.note2];

      setHighlightedNotes([example.note1]);
      await playNote(freq1, 0.6);

      await new Promise((r) => setTimeout(r, 200));

      setHighlightedNotes([example.note2]);
      await playNote(freq2, 0.6);

      await new Promise((r) => setTimeout(r, 200));

      // Play together
      setHighlightedNotes([example.note1, example.note2]);
      playNote(freq1, 0.8);
      playNote(freq2, 0.8);

      setTimeout(() => {
        setIsPlaying(false);
        setHighlightedNotes([]);
      }, 900);
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
          <Text style={styles.title}>Half Steps</Text>
          <Text style={styles.subtitle}>The Smallest Musical Distance</Text>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              A <Text style={styles.highlight}>half step</Text> (also called a{" "}
              <Text style={styles.highlight}>semitone</Text>) is the smallest
              interval in Western music.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              On a piano, a half step is the distance between{" "}
              <Text style={styles.highlight}>any two adjacent keys</Text> —
              including black keys!
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.emoji}>🎹</Text>
            <Text style={styles.cardText}>
              Let's explore this on a keyboard...
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setPhase(PHASES.KEYBOARD)}
        >
          <Text style={styles.primaryButtonText}>See the Keyboard →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Keyboard visualization
  if (phase === PHASES.KEYBOARD) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>The Piano Keyboard</Text>

          <MiniKeyboard highlightNotes={highlightedNotes} />

          <View style={styles.card}>
            <Text style={styles.cardText}>
              See the pattern? Between most white keys, there's a{" "}
              <Text style={styles.highlightOrange}>black key</Text>.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              To go a half step from C, you move to the{" "}
              <Text style={styles.highlightOrange}>black key</Text> (C#).
              {"\n\n"}C → C# = half step
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              But look at <Text style={styles.highlight}>E and F</Text>...
              {"\n"}
              There's <Text style={styles.highlight}>no black key</Text> between
              them!
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            setHighlightedNotes(["E4", "F4"]);
            setPhase(PHASES.NATURAL_HALF_STEPS);
          }}
        >
          <Text style={styles.primaryButtonText}>Learn About E-F →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Natural half steps (E-F, B-C)
  if (phase === PHASES.NATURAL_HALF_STEPS) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Natural Half Steps</Text>

          <MiniKeyboard highlightNotes={highlightedNotes} />

          <View style={styles.card}>
            <Text style={styles.cardText}>
              <Text style={styles.highlight}>E → F</Text> and{" "}
              <Text style={styles.highlight}>B → C</Text> are special!
              {"\n\n"}
              They're half steps between{" "}
              <Text style={styles.highlight}>white keys</Text> — no black key
              needed.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              🎯 <Text style={styles.highlight}>Remember:</Text>
              {"\n\n"}• E-F = half step (natural)
              {"\n"}• B-C = half step (natural)
              {"\n"}• All others need a black key
            </Text>
          </View>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setHighlightedNotes(["B4", "C5"])}
          >
            <Text style={styles.secondaryButtonText}>Show B-C</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setHighlightedNotes(["E4", "F4"])}
          >
            <Text style={styles.secondaryButtonText}>Show E-F</Text>
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            setHighlightedNotes([]);
            setPhase(PHASES.HEAR_IT);
          }}
        >
          <Text style={styles.primaryButtonText}>Hear Half Steps →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Hear it phase
  if (phase === PHASES.HEAR_IT) {
    const example = HALF_STEP_EXAMPLES[currentExample];

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Hear the Half Step</Text>

          <MiniKeyboard highlightNotes={highlightedNotes} />

          <View style={styles.card}>
            <Text style={styles.cardText}>
              <Text style={styles.highlight}>{example.label}</Text>
              {"\n"}
              {example.isNatural ? "(Natural half step)" : "(Uses black key)"}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.playButton, isPlaying && styles.playButtonDisabled]}
            onPress={() => playHalfStep(example)}
            disabled={isPlaying}
          >
            <Text style={styles.playButtonText}>
              {isPlaying ? "Playing..." : "▶ Play Half Step"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.helperText}>
            Notice how close the two notes sound?{"\n"}
            That's a half step!
          </Text>

          {/* Example selector */}
          <View style={styles.exampleSelector}>
            <Text style={styles.selectorLabel}>Try other half steps:</Text>
            <View style={styles.exampleButtons}>
              {HALF_STEP_EXAMPLES.map((ex, idx) => (
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
          <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
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
            {passed ? "You understand half steps!" : "Let's review"}
          </Text>
          <Text style={styles.resultScore}>
            {score} / {QUIZ_QUESTIONS.length} correct
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              <Text style={styles.highlight}>Key concepts:</Text>
              {"\n\n"}• Half step = smallest interval
              {"\n"}• Adjacent piano keys
              {"\n"}• E-F and B-C are natural half steps
              {"\n"}• 12 half steps = 1 octave
            </Text>
          </View>
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

// PropTypes validation
HalfStepsTheoryExercise.propTypes = exercisePropTypes;
HalfStepsTheoryExercise.defaultProps = exerciseDefaultProps;

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
  highlightOrange: {
    color: "#ff9800",
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
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: "#4fc3f7",
  },
  playButton: {
    backgroundColor: "#4fc3f7",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignSelf: "center",
    marginVertical: 16,
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
    marginTop: 8,
  },
  exampleSelector: {
    marginTop: 24,
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
    backgroundColor: "#4fc3f7",
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
