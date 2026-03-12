/**
 * FlatAccidentalExercise - Teaches the flat (♭) accidental
 *
 * Key concepts:
 * - A flat (♭) lowers a note by a half step
 * - Db is one half step below D
 * - Flats move you to the left on the keyboard
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
  KEYBOARD: "keyboard",
  EXAMPLES: "examples",
  HEAR_IT: "hear_it",
  QUIZ: "quiz",
  RESULT: "result",
};

// Note frequencies (for audio)
const NOTE_FREQUENCIES = {
  C4: 261.63,
  Db4: 277.18,
  D4: 293.66,
  Eb4: 311.13,
  E4: 329.63,
  F4: 349.23,
  Gb4: 369.99,
  G4: 392.0,
  Ab4: 415.3,
  A4: 440.0,
  Bb4: 466.16,
  B4: 493.88,
  C5: 523.25,
  // Enharmonic alias for white-to-white example
  Cb5: 493.88, // Same as B4
};

// Flat examples
const FLAT_EXAMPLES = [
  { natural: "D4", flat: "Db4", label: "D → D♭" },
  { natural: "E4", flat: "Eb4", label: "E → E♭" },
  { natural: "B4", flat: "Bb4", label: "B → B♭" },
  { natural: "A4", flat: "Ab4", label: "A → A♭" },
  {
    natural: "C5",
    flat: "Cb5",
    flatKey: "B4",
    label: "C → C♭ (=B)",
    isWhiteToWhite: true,
  },
];

// Quiz questions
const QUIZ_QUESTIONS = [
  {
    question: "What does a flat (♭) do to a note?",
    correctAnswer: "Lowers it by a half step",
    options: [
      "Raises it by a half step",
      "Lowers it by a half step",
      "Makes it louder",
      "Makes it longer",
    ],
  },
  {
    question: "D♭ is _____ than D.",
    correctAnswer: "one half step lower",
    options: [
      "one half step higher",
      "one half step lower",
      "one whole step lower",
      "the same pitch",
    ],
  },
  {
    question: "On a keyboard, a flat moves you...",
    correctAnswer: "one key to the left",
    options: [
      "one key to the right",
      "one key to the left",
      "two keys to the left",
      "nowhere",
    ],
  },
  {
    question: "Which note is E♭?",
    correctAnswer: "The black key just left of E",
    options: [
      "The black key just right of E",
      "The black key just left of E",
      "The white key after E",
      "The same as E",
    ],
  },
];

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function FlatAccidentalExercise({
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
  const [highlightFlat, setHighlightFlat] = useState(null);
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

  // Play a flat example (natural then flat)
  const playFlatExample = useCallback(
    async (example) => {
      if (isPlaying) return;
      setIsPlaying(true);

      const freqNatural = NOTE_FREQUENCIES[example.natural];
      const freqFlat = NOTE_FREQUENCIES[example.flat];
      const keyToHighlight = example.flatKey || example.flat;

      // Play natural first
      setHighlightedNotes([example.natural]);
      setHighlightFlat(null);
      await playNote(freqNatural, 0.6);

      await new Promise((r) => setTimeout(r, 300));

      // Then play flat (highlight the actual key on keyboard with flat color)
      setHighlightedNotes([]);
      setHighlightFlat(keyToHighlight);
      await playNote(freqFlat, 0.6);

      setTimeout(() => {
        setIsPlaying(false);
        setHighlightedNotes([]);
        setHighlightFlat(null);
      }, 700);
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
          <Text style={styles.title}>The Flat ♭</Text>
          <Text style={styles.subtitle}>Lowering Notes</Text>

          <View style={styles.card}>
            <Text style={styles.emoji}>♭</Text>
            <Text style={styles.cardText}>
              A <Text style={styles.highlightPurple}>flat</Text> lowers a note
              by <Text style={styles.highlight}>one half step</Text>.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              When you see D<Text style={styles.highlightPurple}>♭</Text>, it
              means:{"\n\n"}
              "Play the note that is{"\n"}
              <Text style={styles.highlight}>one half step below D</Text>"
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              On a keyboard, a flat moves you{"\n"}
              <Text style={styles.highlightPurple}>one key to the LEFT</Text> ←
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setPhase(PHASES.KEYBOARD)}
        >
          <Text style={styles.primaryButtonText}>See It on Keyboard →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Keyboard visualization
  if (phase === PHASES.KEYBOARD) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>D♭ on the Keyboard</Text>

          <MiniKeyboard
            highlightNotes={["D4"]}
            highlightFlat="Db4"
            useFlatNames
          />

          <View style={styles.card}>
            <Text style={styles.cardText}>
              <Text style={styles.highlight}>D</Text> is the white key.
              {"\n\n"}
              <Text style={styles.highlightPurple}>D♭</Text> is one half step{" "}
              <Text style={styles.highlightPurple}>lower</Text> (to the left).
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              Notice: D♭ is the{" "}
              <Text style={styles.highlightPurple}>black key</Text> just to the
              left of D!
            </Text>
          </View>

          <View style={styles.arrowContainer}>
            <Text style={styles.arrowText}>D → D♭</Text>
            <Text style={styles.arrowSymbol}>←</Text>
            <Text style={styles.arrowLabel}>one half step lower</Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setPhase(PHASES.EXAMPLES)}
        >
          <Text style={styles.primaryButtonText}>See More Examples →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // More examples
  if (phase === PHASES.EXAMPLES) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>More Flats</Text>

          <MiniKeyboard
            highlightNotes={highlightedNotes}
            highlightFlat={highlightFlat}
            useFlatNames
          />

          <View style={styles.card}>
            <Text style={styles.cardText}>
              Every note can be flatted!
              {"\n\n"}
              Tap to see each flat:
            </Text>
          </View>

          <View style={styles.exampleButtons}>
            {FLAT_EXAMPLES.map((ex, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.exampleButton}
                onPress={() => {
                  setHighlightedNotes([ex.natural]);
                  setHighlightFlat(ex.flatKey || ex.flat);
                }}
              >
                <Text style={styles.exampleButtonText}>{ex.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              🎯 <Text style={styles.highlight}>Pattern:</Text>
              {"\n\n"}The flat is always the key{" "}
              <Text style={styles.highlightPurple}>
                immediately to the left
              </Text>
              .
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            setHighlightedNotes([]);
            setHighlightFlat(null);
            setPhase(PHASES.HEAR_IT);
          }}
        >
          <Text style={styles.primaryButtonText}>Hear the Difference →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Hear it phase
  if (phase === PHASES.HEAR_IT) {
    const example = FLAT_EXAMPLES[currentExample];

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Hear the Flat</Text>

          <MiniKeyboard
            highlightNotes={highlightedNotes}
            highlightFlat={highlightFlat}
            useFlatNames
          />

          <View style={styles.card}>
            <Text style={styles.cardText}>
              <Text style={styles.highlight}>{example.label}</Text>
              {"\n"}
              Natural → Flat (lower)
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.playButton, isPlaying && styles.playButtonDisabled]}
            onPress={() => playFlatExample(example)}
            disabled={isPlaying}
          >
            <Text style={styles.playButtonText}>
              {isPlaying ? "Playing..." : "▶ Play"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.helperText}>
            The flat note sounds slightly{" "}
            <Text style={styles.highlightPurple}>lower</Text>.
          </Text>

          {/* Example selector */}
          <View style={styles.exampleSelector}>
            <Text style={styles.selectorLabel}>Try other flats:</Text>
            <View style={styles.exampleButtonsRow}>
              {FLAT_EXAMPLES.map((ex, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.smallButton,
                    idx === currentExample && styles.smallButtonActive,
                  ]}
                  onPress={() => setCurrentExample(idx)}
                >
                  <Text
                    style={[
                      styles.smallButtonText,
                      idx === currentExample && styles.smallButtonTextActive,
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
          <TouchableOpacity style={styles.primaryButton} onPress={handleNext} accessibilityLabel="Next step" accessibilityRole="button">
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
            {passed ? "You understand flats!" : "Let's review"}
          </Text>
          <Text style={styles.resultScore}>
            {score} / {QUIZ_QUESTIONS.length} correct
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              <Text style={styles.highlight}>Key concepts:</Text>
              {"\n\n"}• Flat (♭) = lower by half step
              {"\n"}• Moves one key LEFT on keyboard
              {"\n"}• D♭ is one half step below D{"\n"}• Every note can be
              flatted
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.primaryButton} onPress={handleComplete} accessibilityLabel="Complete lesson" accessibilityRole="button">
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
FlatAccidentalExercise.propTypes = exercisePropTypes;
FlatAccidentalExercise.defaultProps = exerciseDefaultProps;

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
  highlightPurple: {
    color: "#ce93d8",
    fontWeight: "bold",
  },
  emoji: {
    fontSize: 48,
    textAlign: "center",
    marginVertical: 12,
  },
  arrowContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  arrowText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  arrowSymbol: {
    fontSize: 36,
    color: "#ce93d8",
    marginVertical: 4,
  },
  arrowLabel: {
    fontSize: 14,
    color: "#a0a0c0",
  },
  primaryButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#ce93d8",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  exampleButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginVertical: 16,
  },
  exampleButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#353565",
    borderRadius: 8,
  },
  exampleButtonText: {
    fontSize: 16,
    color: "#ce93d8",
    fontWeight: "600",
  },
  playButton: {
    backgroundColor: "#ce93d8",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignSelf: "center",
    marginVertical: 16,
  },
  playButtonDisabled: {
    backgroundColor: "#ce93d880",
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
  exampleButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#353565",
    borderRadius: 8,
  },
  smallButtonActive: {
    backgroundColor: "#ce93d8",
  },
  smallButtonText: {
    fontSize: 14,
    color: "#a0a0c0",
  },
  smallButtonTextActive: {
    color: "#1a1a2e",
    fontWeight: "bold",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#353565",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ce93d8",
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
    borderColor: "#ce93d8",
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
