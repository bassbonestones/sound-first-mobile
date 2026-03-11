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
    question: "A whole step equals how many half steps?",
    correctAnswer: "2",
    options: ["1", "2", "3", "4"],
  },
  {
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
    question: "Which pair is a WHOLE step (not half)?",
    correctAnswer: "G to A",
    options: ["E to F", "B to C", "G to A", "C to C#"],
  },
  {
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
// MINI KEYBOARD COMPONENT
// ============================================================

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

function MiniKeyboard({ highlightNotes = [], skippedNote = null }) {
  const whiteKeys = PIANO_KEYS.filter((k) => !k.isBlack);
  const blackKeys = PIANO_KEYS.filter((k) => k.isBlack);

  // Map black keys to the white key index they come after
  const blackKeyAfterWhiteIdx = {
    "C#4": 0, // after C
    "D#4": 1, // after D
    "F#4": 3, // after F
    "G#4": 4, // after G
    "A#4": 5, // after A
  };

  // Check if skipped note is a white key (for E→F# skipping F, A#→C skipping B)
  const isWhiteKeySkipped = skippedNote && !skippedNote.includes("#");

  return (
    <View style={keyboardStyles.container}>
      <View style={keyboardStyles.keyboardWrapper}>
        <View style={keyboardStyles.whiteKeysRow}>
          {whiteKeys.map((key) => {
            const isHighlighted = highlightNotes.includes(key.note);
            const isSkipped = isWhiteKeySkipped && skippedNote === key.note;
            return (
              <View
                key={key.note}
                style={[
                  keyboardStyles.whiteKey,
                  isHighlighted && keyboardStyles.whiteKeyHighlighted,
                  isSkipped && keyboardStyles.whiteKeySkipped,
                ]}
              >
                <Text
                  style={[
                    keyboardStyles.whiteKeyLabel,
                    isHighlighted && keyboardStyles.keyLabelHighlighted,
                    isSkipped && keyboardStyles.skippedKeyLabel,
                  ]}
                >
                  {isSkipped ? "skip" : key.label}
                </Text>
              </View>
            );
          })}
        </View>
        <View style={keyboardStyles.blackKeysRow}>
          {blackKeys.map((key) => {
            const isHighlighted = highlightNotes.includes(key.note);
            const isSkipped = skippedNote === key.note;
            const whiteIdx = blackKeyAfterWhiteIdx[key.note];
            if (whiteIdx === undefined) return null;

            return (
              <View
                key={key.note}
                style={[
                  keyboardStyles.blackKey,
                  { left: (whiteIdx + 1) * 44 - 14 },
                  isHighlighted && keyboardStyles.blackKeyHighlighted,
                  isSkipped && keyboardStyles.blackKeySkipped,
                ]}
              >
                <Text
                  style={[
                    keyboardStyles.blackKeyLabel,
                    (isHighlighted || isSkipped) &&
                      keyboardStyles.keyLabelHighlighted,
                  ]}
                >
                  {isSkipped ? "skip" : key.label}
                </Text>
              </View>
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
    position: "relative",
    marginVertical: 16,
    alignItems: "center",
  },
  keyboardWrapper: {
    width: 352, // 8 white keys * 44px each
    position: "relative",
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
    backgroundColor: "#81c784",
  },
  whiteKeySkipped: {
    backgroundColor: "#ff5722",
  },
  whiteKeyLabel: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  skippedKeyLabel: {
    color: "#fff",
    fontWeight: "bold",
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
    backgroundColor: "#81c784",
  },
  blackKeySkipped: {
    backgroundColor: "#ff5722",
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

export default function WholeStepsTheoryExercise({
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
  const [skippedNote, setSkippedNote] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentExample, setCurrentExample] = useState(0);

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

  const handleNext = useCallback(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    if (quizIndex < QUIZ_QUESTIONS.length - 1) {
      setQuizIndex((i) => i + 1);
    } else {
      setPhase(PHASES.RESULT);
    }
  }, [quizIndex]);

  const handleComplete = useCallback(() => {
    const passed = score === QUIZ_QUESTIONS.length;
    if (onComplete) {
      onComplete({ success: passed, score });
    }
  }, [onComplete, score]);

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

  if (phase === PHASES.RESULT) {
    const passed = score === QUIZ_QUESTIONS.length;

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.resultEmoji}>{passed ? "🎉" : "📚"}</Text>
          <Text style={styles.resultTitle}>
            {passed ? "You understand whole steps!" : "Let's review"}
          </Text>
          <Text style={styles.resultScore}>
            {score} / {QUIZ_QUESTIONS.length} correct
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
WholeStepsTheoryExercise.propTypes = exercisePropTypes;
WholeStepsTheoryExercise.defaultProps = exerciseDefaultProps;

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
