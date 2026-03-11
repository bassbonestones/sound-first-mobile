/**
 * KeySignatureBasicsExercise - Teaches key signature fundamentals
 *
 * Key concepts:
 * - Key signature = sharps or flats at the beginning of music
 * - They apply to ALL notes of that name throughout the piece
 * - Key signatures tell us what scale the music is based on
 * - No sharps/flats = C major (or A minor)
 */
import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import NotationDisplay from "../../../../components/NotationDisplay";

// Audio context - works on web, iOS, and Android
let AudioContextClass = null;
if (Platform.OS === "web") {
  AudioContextClass = typeof window !== "undefined"
    ? (window.AudioContext || window.webkitAudioContext)
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
  PURPOSE: "purpose",
  HOW_IT_WORKS: "how_it_works",
  EXAMPLES: "examples",
  QUIZ: "quiz",
  RESULT: "result",
};

// Example key signatures with fifths value for MusicXML
const KEY_EXAMPLES = [
  {
    name: "C Major",
    fifths: 0,
    display: "No sharps or flats",
    notes: "C D E F G A B",
  },
  {
    name: "G Major",
    fifths: 1,
    display: "1 sharp (F#)",
    notes: "G A B C D E F#",
  },
  {
    name: "F Major",
    fifths: -1,
    display: "1 flat (B♭)",
    notes: "F G A B♭ C D E",
  },
  {
    name: "D Major",
    fifths: 2,
    display: "2 sharps (F#, C#)",
    notes: "D E F# G A B C#",
  },
];

// Generate MusicXML for key signature display
function generateKeySignatureMusicXML(fifths, clef = "treble") {
  const clefSign = clef === "bass" ? "F" : "G";
  const clefLine = clef === "bass" ? "4" : "2";
  // Use a note appropriate for the clef
  const noteStep = clef === "bass" ? "D" : "B";
  const noteOctave = clef === "bass" ? "3" : "4";

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name></part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>${fifths}</fifths>
        </key>
        <clef>
          <sign>${clefSign}</sign>
          <line>${clefLine}</line>
        </clef>
      </attributes>
      <note>
        <rest/>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
  </part>
</score-partwise>`;
}

// Quiz questions
const QUIZ_QUESTIONS = [
  {
    question: "A key signature tells us:",
    correctAnswer: "Which sharps/flats to play throughout the piece",
    options: [
      "How fast to play",
      "Which sharps/flats to play throughout the piece",
      "How loud to play",
      "What instrument to use",
    ],
  },
  {
    question: "If a key signature has F#, you play F# for:",
    correctAnswer: "Every F in the entire piece",
    options: [
      "Only the first F",
      "Every F in the entire piece",
      "Only F notes in the first measure",
      "Only high F notes",
    ],
  },
  {
    question: "C Major has:",
    correctAnswer: "No sharps or flats",
    options: [
      "1 sharp",
      "1 flat",
      "No sharps or flats",
      "2 sharps",
    ],
  },
  {
    question: "G Major has:",
    correctAnswer: "1 sharp (F#)",
    options: [
      "No sharps or flats",
      "1 sharp (F#)",
      "1 flat (B♭)",
      "2 sharps",
    ],
  },
];

// ============================================================
// KEY SIGNATURE DISPLAY COMPONENT
// ============================================================

function KeySignatureDisplay({ fifths = 0, name = "", clef = "treble" }) {
  const musicxml = useMemo(() => {
    return generateKeySignatureMusicXML(fifths, clef);
  }, [fifths, clef]);

  return (
    <View style={displayStyles.container}>
      <View style={displayStyles.staffWrapper}>
        {NotationDisplay ? (
          <NotationDisplay
            musicxml={musicxml}
            width={280}
            height={140}
            showTitle={false}
          />
        ) : (
          <View style={displayStyles.fallback}>
            <Text style={displayStyles.fallbackText}>
              {fifths > 0
                ? `${fifths} sharp${fifths > 1 ? "s" : ""}`
                : fifths < 0
                  ? `${Math.abs(fifths)} flat${Math.abs(fifths) > 1 ? "s" : ""}`
                  : "No sharps or flats"}
            </Text>
          </View>
        )}
      </View>
      <Text style={displayStyles.keyName}>{name}</Text>
    </View>
  );
}

const displayStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 16,
  },
  staffWrapper: {
    backgroundColor: "#252545",
    borderRadius: 8,
    padding: 8,
    overflow: "hidden",
  },
  fallback: {
    width: 280,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackText: {
    fontSize: 18,
    color: "#808090",
  },
  keyName: {
    fontSize: 18,
    color: "#ffc107",
    fontWeight: "bold",
    marginTop: 8,
  },
});

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function KeySignatureBasicsExercise({
  mini = {},
  sessionState = {},
  onComplete,
  onCancel,
  clef = "treble",
}) {
  const [phase, setPhase] = useState(PHASES.INTRO);
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [currentExample, setCurrentExample] = useState(0);

  const handleAnswer = useCallback(
    (answer) => {
      setSelectedAnswer(answer);
      setShowResult(true);
      if (answer === QUIZ_QUESTIONS[quizIndex].correctAnswer) {
        setScore((s) => s + 1);
      }
    },
    [quizIndex]
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
          <Text style={styles.title}>Key Signatures</Text>
          <Text style={styles.subtitle}>The Musical Shorthand</Text>

          <KeySignatureDisplay fifths={1} name="Example: G Major" clef={clef} />

          <View style={styles.card}>
            <Text style={styles.cardText}>
              A <Text style={styles.highlight}>key signature</Text> is the
              group of sharps (♯) or flats (♭) at the beginning of a piece.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              It tells you which notes are{" "}
              <Text style={styles.highlight}>always</Text> sharped or flatted
              throughout the music.
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setPhase(PHASES.PURPOSE)}
        >
          <Text style={styles.primaryButtonText}>Why Key Signatures? →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === PHASES.PURPOSE) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Why Use Them?</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Without Key Signature:</Text>
            <Text style={styles.cardText}>
              F♯ - G - A - B - C - D - E - F♯ - G - A - B - C - D - E - F♯...
              {"\n\n"}
              <Text style={styles.highlightDim}>
                (Write ♯ every single time!)
              </Text>
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>With Key Signature:</Text>
            <Text style={styles.cardText}>
              Just put <Text style={styles.highlightSharp}>F♯</Text> at the
              beginning...
              {"\n\n"}
              Then write: F - G - A - B - C - D - E - F - G...
              {"\n\n"}
              <Text style={styles.highlight}>
                All F's automatically become F♯!
              </Text>
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.emoji}>💡</Text>
            <Text style={styles.cardText}>
              Key signatures save time and make music easier to read!
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setPhase(PHASES.HOW_IT_WORKS)}
        >
          <Text style={styles.primaryButtonText}>How It Works →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === PHASES.HOW_IT_WORKS) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>How It Works</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rule #1:</Text>
            <Text style={styles.cardText}>
              Key signature accidentals apply to{" "}
              <Text style={styles.highlight}>EVERY</Text> note of that name.
              {"\n\n"}
              F♯ in key signature = ALL F's are F♯
              {"\n"}(in every octave, every measure!)
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rule #2:</Text>
            <Text style={styles.cardText}>
              Key signatures have <Text style={styles.highlight}>either</Text>{" "}
              sharps OR flats, never both.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rule #3:</Text>
            <Text style={styles.cardText}>
              Use a <Text style={styles.highlightNatural}>natural (♮)</Text>{" "}
              sign to cancel a key signature accidental temporarily.
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setPhase(PHASES.EXAMPLES)}
        >
          <Text style={styles.primaryButtonText}>See Examples →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === PHASES.EXAMPLES) {
    const example = KEY_EXAMPLES[currentExample];

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Common Key Signatures</Text>

          <KeySignatureDisplay
            fifths={example.fifths}
            name={example.name}
            clef={clef}
          />

          <View style={styles.card}>
            <Text style={styles.cardText}>
              <Text style={styles.highlight}>{example.display}</Text>
              {"\n\n"}
              Scale notes: {example.notes}
            </Text>
          </View>

          <View style={styles.exampleSelector}>
            {KEY_EXAMPLES.map((ex, idx) => (
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
                  {ex.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              🎯 <Text style={styles.highlight}>Remember:</Text>
              {"\n\n"}• More sharps/flats = different starting note
              {"\n"}• Each key has its own "home" scale
              {"\n"}• Key signatures are at the START of every line
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
            {passed ? "You understand key signatures!" : "Let's review"}
          </Text>
          <Text style={styles.resultScore}>
            {score} / {QUIZ_QUESTIONS.length} correct
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              <Text style={styles.highlight}>Key points:</Text>
              {"\n\n"}• Key signature = sharps/flats at start
              {"\n"}• Applies to ALL notes of that name
              {"\n"}• C Major = no sharps or flats
              {"\n"}• G Major = 1 sharp (F♯)
              {"\n"}• F Major = 1 flat (B♭)
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
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffc107",
    marginBottom: 12,
  },
  cardText: {
    fontSize: 17,
    color: "#e0e0f0",
    lineHeight: 26,
    textAlign: "center",
  },
  highlight: {
    color: "#ffc107",
    fontWeight: "bold",
  },
  highlightSharp: {
    color: "#ff9800",
    fontWeight: "bold",
  },
  highlightNatural: {
    color: "#9c9cff",
    fontWeight: "bold",
  },
  highlightDim: {
    color: "#808090",
    fontStyle: "italic",
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
    backgroundColor: "#ffc107",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  exampleSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginVertical: 20,
  },
  exampleButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#353565",
    borderRadius: 8,
  },
  exampleButtonActive: {
    backgroundColor: "#ffc107",
  },
  exampleButtonText: {
    fontSize: 14,
    color: "#a0a0c0",
    fontWeight: "600",
  },
  exampleButtonTextActive: {
    color: "#1a1a2e",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#353565",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ffc107",
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
    borderColor: "#ffc107",
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
