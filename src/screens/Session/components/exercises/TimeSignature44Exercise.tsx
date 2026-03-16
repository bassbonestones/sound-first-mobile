/**
 * TimeSignature44Exercise - Teaches 4/4 time signature specifically
 *
 * Flow: Intro (4/4 meaning) → Common Time → Whole notes in 4/4 → Quiz
 * Key concepts:
 * - 4/4 = 4 beats per measure, quarter note gets the beat
 * - Common time (C) = 4/4
 * - A whole note = 4 beats, fits perfectly in one 4/4 measure
 * - 4 quarters in a whole
 *
 * Quiz questions:
 * 1. Two whole notes in 4/4 - valid? (No)
 * 2. How many beats in 4/4? (4)
 * 3. What note gets the beat? (Quarter note)
 * 4. Another way to write 4/4? (C)
 *
 * Pass 4/4 questions = master capability
 * Fail = can restart
 */
import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import type { ExerciseProps } from "./shared";
import { devWarn } from "../../../../utils/devLogger";

// For notation display
let NotationDisplay = null;
try {
  NotationDisplay = require("../../../../components/NotationDisplay").default;
} catch (e) {
  devWarn("NotationDisplay not available");
}

// ============================================================
// CONSTANTS
// ============================================================

const PHASES = {
  INTRO_1: "intro_1", // 4/4 meaning
  INTRO_2: "intro_2", // Common time
  INTRO_3: "intro_3", // Whole notes and quarters
  QUIZ: "quiz",
  RESULT: "result",
};

// Quiz questions - fixed order for this module
const QUIZ_QUESTIONS = [
  {
    id: "valid_measure",
    type: "yes_no",
    question: "Can you fit TWO whole notes in one measure of 4/4?",
    hint: "Remember: a whole note = 4 beats",
    correctAnswer: "No",
    options: ["Yes", "No"],
    explanation:
      "No! Two whole notes = 8 beats, but 4/4 only has 4 beats per measure.",
  },
  {
    id: "beats_count",
    type: "number",
    question: "How many beats are in one measure of 4/4?",
    correctAnswer: 4,
    options: [2, 3, 4, 6],
    explanation: "The top number tells us: 4 beats per measure.",
  },
  {
    id: "beat_note",
    type: "note",
    question: "In 4/4, what kind of note gets one beat?",
    correctAnswer: "Quarter note",
    options: ["Whole note", "Half note", "Quarter note", "Eighth note"],
    explanation: "The bottom 4 means quarter note gets the beat.",
  },
  {
    id: "common_time",
    type: "symbol",
    question: "What is another way to write 4/4?",
    correctAnswer: "C",
    options: ["C", "G", "F", "O"],
    explanation: "C stands for 'Common Time' which means 4/4.",
  },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Generate MusicXML for 4/4 with a whole note
function generate44WithWholeNoteMusicXML(clef = "treble") {
  const clefSign = clef === "bass" ? "F" : "G";
  const clefLine = clef === "bass" ? "4" : "2";
  const pitch =
    clef === "bass" ? { step: "D", octave: 3 } : { step: "B", octave: 4 };

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
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>${clefSign}</sign>
          <line>${clefLine}</line>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>${pitch.step}</step>
          <octave>${pitch.octave}</octave>
        </pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
  </part>
</score-partwise>`;
}

// Generate MusicXML showing two whole notes (invalid for 4/4)
function generateTwoWholeNotesMusicXML(clef = "treble") {
  const clefSign = clef === "bass" ? "F" : "G";
  const clefLine = clef === "bass" ? "4" : "2";
  const pitch =
    clef === "bass" ? { step: "D", octave: 3 } : { step: "B", octave: 4 };

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
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>${clefSign}</sign>
          <line>${clefLine}</line>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>${pitch.step}</step>
          <octave>${pitch.octave}</octave>
        </pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
      <note>
        <pitch>
          <step>${pitch.step}</step>
          <octave>${pitch.octave}</octave>
        </pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
  </part>
</score-partwise>`;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function TimeSignature44Exercise({
  config = {},
  mastery,
  onComplete,
  onProgress,
  clef = "treble",
}: ExerciseProps) {
  const [phase, setPhase] = useState(PHASES.INTRO_1);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);

  // Current question data
  const question = QUIZ_QUESTIONS[currentQuestion];

  // Generate MusicXML examples
  const wholeNoteExample = useMemo(
    () => generate44WithWholeNoteMusicXML(clef),
    [clef],
  );

  const twoWholeNotesExample = useMemo(
    () => generateTwoWholeNotesMusicXML(clef),
    [clef],
  );

  // Handle answer selection
  const handleAnswer = useCallback(
    (answer) => {
      if (showFeedback) return;
      setSelectedAnswer(answer);
      setShowFeedback(true);

      const isCorrect =
        answer === question.correctAnswer ||
        (typeof question.correctAnswer === "number" &&
          answer === question.correctAnswer);

      if (isCorrect) {
        setCorrectCount((prev) => prev + 1);
      }

      // After a delay, move to next question or result
      setTimeout(() => {
        setShowFeedback(false);
        setSelectedAnswer(null);

        if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
          // More questions
          setCurrentQuestion((prev) => prev + 1);
          onProgress?.({
            current: currentQuestion + 1,
            total: QUIZ_QUESTIONS.length,
            correct: correctCount + (isCorrect ? 1 : 0),
          });
        } else {
          // Quiz complete
          const finalCorrect = correctCount + (isCorrect ? 1 : 0);
          const passed = finalCorrect === QUIZ_QUESTIONS.length;
          setQuizPassed(passed);
          setPhase(PHASES.RESULT);
        }
      }, 2000);
    },
    [showFeedback, question, currentQuestion, correctCount, onProgress],
  );

  // Handle restart
  const handleRestart = useCallback(() => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setCorrectCount(0);
    setShowFeedback(false);
    setQuizPassed(false);
    setPhase(PHASES.INTRO_1);
  }, []);

  // Handle completion
  const handleComplete = useCallback(() => {
    onComplete?.({
      success: true,
      streak: QUIZ_QUESTIONS.length,
      totalAttempts: QUIZ_QUESTIONS.length,
      correctCount: QUIZ_QUESTIONS.length,
    });
  }, [onComplete]);

  // ============================================================
  // INTRO PHASE 1 - What 4/4 Means
  // ============================================================
  if (phase === PHASES.INTRO_1) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>4/4 Time</Text>

            <View style={styles.timeSignatureDisplay}>
              <Text style={styles.timeSignatureTop}>4</Text>
              <View style={styles.timeSignatureLine} />
              <Text style={styles.timeSignatureBottom}>4</Text>
            </View>

            <Text style={styles.introText}>
              <Text style={styles.highlight}>4/4</Text> is the most common time
              signature in music.
            </Text>

            <View style={styles.meaningBox}>
              <View style={styles.meaningRow}>
                <Text style={styles.meaningNumber}>4</Text>
                <Text style={styles.meaningEquals}>=</Text>
                <Text style={styles.meaningText}>4 beats per measure</Text>
              </View>
              <View style={styles.meaningRow}>
                <Text style={styles.meaningNumber}>4</Text>
                <Text style={styles.meaningEquals}>=</Text>
                <Text style={styles.meaningText}>
                  Quarter note gets the beat
                </Text>
              </View>
            </View>
          </View>

          {NotationDisplay && wholeNoteExample && (
            <View style={styles.notationWrapper}>
              <NotationDisplay
                musicxml={wholeNoteExample}
                width={360}
                height={180}
                showTimeSignature={true}
              />
            </View>
          )}
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            accessibilityLabel="Next"
            accessibilityRole="button"
            style={styles.primaryButton}
            onPress={() => setPhase(PHASES.INTRO_2)}
          >
            <Text style={styles.primaryButtonText}>Next →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============================================================
  // INTRO PHASE 2 - Common Time
  // ============================================================
  if (phase === PHASES.INTRO_2) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.introCard}>
            <Text style={styles.introSubtitle}>Common Time</Text>

            <Text style={styles.introText}>
              4/4 is so common that it has a special symbol:
            </Text>

            <View style={styles.commonTimeDisplay}>
              <Text style={styles.commonTimeSymbol}>C</Text>
            </View>

            <Text style={styles.introText}>
              This <Text style={styles.highlight}>C</Text> stands for{" "}
              <Text style={styles.highlight}>"Common Time"</Text>
            </Text>

            <View style={styles.equivalenceBox}>
              <View style={styles.miniTimeSignature}>
                <Text style={styles.miniTop}>4</Text>
                <View style={styles.miniLine} />
                <Text style={styles.miniBottom}>4</Text>
              </View>
              <Text style={styles.equivalenceEquals}>=</Text>
              <Text style={styles.equivalenceC}>C</Text>
            </View>

            <Text style={styles.tipText}>
              💡 They mean exactly the same thing!
            </Text>
          </View>
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            accessibilityLabel="Back"
            accessibilityRole="button"
            style={styles.secondaryButton}
            onPress={() => setPhase(PHASES.INTRO_1)}
          >
            <Text style={styles.secondaryButtonText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Next"
            accessibilityRole="button"
            style={styles.primaryButton}
            onPress={() => setPhase(PHASES.INTRO_3)}
          >
            <Text style={styles.primaryButtonText}>Next →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============================================================
  // INTRO PHASE 3 - Whole Notes in 4/4
  // ============================================================
  if (phase === PHASES.INTRO_3) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.introCard}>
            <Text style={styles.introSubtitle}>Whole Notes in 4/4</Text>

            <Text style={styles.introText}>
              You already know a{" "}
              <Text style={styles.highlight}>whole note</Text> lasts{" "}
              <Text style={styles.highlight}>4 beats</Text>.
            </Text>

            <Text style={styles.introText}>
              In 4/4, each measure has exactly 4 beats...
            </Text>

            <View style={styles.mathBox}>
              <Text style={styles.mathText}>
                1 whole note = 4 beats = 1 full measure
              </Text>
            </View>

            <Text style={styles.introText}>
              A whole note fills an entire 4/4 measure perfectly!
            </Text>
          </View>

          <View style={styles.introCard}>
            <Text style={styles.introSubtitle}>4 Quarters in a Whole</Text>

            <Text style={styles.introText}>
              The word "quarter" tells us something important:
            </Text>

            <View style={styles.mathBox}>
              <Text style={styles.mathText}>4 quarters = 1 whole</Text>
            </View>

            <Text style={styles.introText}>
              Just like 4 quarters make a dollar, 4 quarter notes make a whole
              note!
            </Text>

            <Text style={styles.tipText}>
              💡 That's why 4/4 means "4 quarter notes per measure"
            </Text>
          </View>

          <View style={styles.introCard}>
            <Text style={styles.readyText}>Ready for a quick quiz?</Text>
          </View>
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            accessibilityLabel="Back"
            accessibilityRole="button"
            style={styles.secondaryButton}
            onPress={() => setPhase(PHASES.INTRO_2)}
          >
            <Text style={styles.secondaryButtonText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Take quiz"
            accessibilityRole="button"
            style={styles.primaryButton}
            onPress={() => setPhase(PHASES.QUIZ)}
          >
            <Text style={styles.primaryButtonText}>Take Quiz →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============================================================
  // QUIZ PHASE
  // ============================================================
  if (phase === PHASES.QUIZ) {
    const isCorrect =
      selectedAnswer === question.correctAnswer ||
      (typeof question.correctAnswer === "number" &&
        selectedAnswer === question.correctAnswer);

    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Progress indicator */}
          <View style={styles.progressBar}>
            <Text style={styles.progressText}>
              Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
            </Text>
            <View style={styles.progressDots}>
              {QUIZ_QUESTIONS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressDot,
                    i <= currentQuestion && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Show notation for the "two whole notes" question */}
          {question.id === "valid_measure" &&
            NotationDisplay &&
            twoWholeNotesExample && (
              <View style={styles.quizNotationWrapper}>
                <NotationDisplay
                  musicxml={twoWholeNotesExample}
                  width={320}
                  height={160}
                  showTimeSignature={true}
                />
              </View>
            )}

          {/* Show 4/4 for other questions */}
          {question.id !== "valid_measure" && question.id !== "common_time" && (
            <View style={styles.timeSignatureDisplay}>
              <Text style={styles.timeSignatureTop}>4</Text>
              <View style={styles.timeSignatureLine} />
              <Text style={styles.timeSignatureBottom}>4</Text>
            </View>
          )}

          {/* Hint for valid_measure question */}
          {question.hint && (
            <Text style={styles.hintText}>{question.hint}</Text>
          )}

          {/* Question */}
          <Text style={styles.questionText}>{question.question}</Text>

          {/* Answer options */}
          <View style={styles.optionsContainer}>
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrectOption = option === question.correctAnswer;

              let optionStyle = styles.optionButton;
              let textStyle = styles.optionText;

              if (showFeedback) {
                if (isCorrectOption) {
                  optionStyle = [styles.optionButton, styles.optionCorrect];
                  textStyle = [styles.optionText, styles.optionTextCorrect];
                } else if (isSelected && !isCorrectOption) {
                  optionStyle = [styles.optionButton, styles.optionIncorrect];
                  textStyle = [styles.optionText, styles.optionTextIncorrect];
                }
              } else if (isSelected) {
                optionStyle = [styles.optionButton, styles.optionSelected];
              }

              // Special styling for "C" option
              const displayOption =
                question.id === "common_time" && option === "C"
                  ? option
                  : option;

              return (
                <TouchableOpacity
                  key={index}
                  accessibilityLabel={`Select ${option}`}
                  accessibilityRole="button"
                  style={optionStyle}
                  onPress={() => handleAnswer(option)}
                  disabled={showFeedback}
                >
                  <Text style={textStyle}>{displayOption}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Feedback */}
          {showFeedback && (
            <View style={styles.feedbackContainer}>
              <Text
                style={
                  isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect
                }
              >
                {isCorrect ? "✓ Correct!" : "✗ Not quite"}
              </Text>
              <Text style={styles.feedbackExplanation}>
                {question.explanation}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // ============================================================
  // RESULT PHASE
  // ============================================================
  if (phase === PHASES.RESULT) {
    if (quizPassed) {
      return (
        <View style={styles.container}>
          <View style={styles.resultContainer}>
            <Text style={styles.resultEmoji}>🎉</Text>
            <Text style={styles.resultTitle}>Perfect!</Text>
            <Text style={styles.resultSubtitle}>
              You got all {QUIZ_QUESTIONS.length} questions correct!
            </Text>
            <Text style={styles.resultDetail}>
              You now understand 4/4 time!
            </Text>
          </View>

          <View style={styles.fixedBottomButtons}>
            <TouchableOpacity
              accessibilityLabel="Complete exercise"
              accessibilityRole="button"
              style={styles.primaryButton}
              onPress={handleComplete}
            >
              <Text style={styles.primaryButtonText}>Complete →</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.container}>
          <View style={styles.resultContainer}>
            <Text style={styles.resultEmoji}>📚</Text>
            <Text style={styles.resultTitle}>Keep Learning</Text>
            <Text style={styles.resultSubtitle}>
              You got {correctCount} out of {QUIZ_QUESTIONS.length} correct.
            </Text>
            <Text style={styles.resultDetail}>
              Review the material and try again!
            </Text>
          </View>

          <View style={styles.fixedBottomButtons}>
            <TouchableOpacity
              accessibilityLabel="Start over"
              accessibilityRole="button"
              style={styles.primaryButton}
              onPress={handleRestart}
            >
              <Text style={styles.primaryButtonText}>Start Over →</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  }

  return null;
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1410",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Intro card
  introCard: {
    backgroundColor: "#2d241a",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#3b2c1a",
  },
  introTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#f5e6d3",
    textAlign: "center",
    marginBottom: 20,
  },
  introSubtitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#d4a574",
    textAlign: "center",
    marginBottom: 20,
  },
  introText: {
    fontSize: 18,
    color: "#c4b5a0",
    textAlign: "center",
    lineHeight: 28,
    marginBottom: 16,
  },
  highlight: {
    color: "#d4a574",
    fontWeight: "600",
  },

  // Time signature display
  timeSignatureDisplay: {
    alignItems: "center",
    marginVertical: 20,
  },
  timeSignatureTop: {
    fontSize: 56,
    fontWeight: "700",
    color: "#f5e6d3",
    lineHeight: 60,
  },
  timeSignatureLine: {
    width: 50,
    height: 3,
    backgroundColor: "#d4a574",
    marginVertical: 4,
  },
  timeSignatureBottom: {
    fontSize: 56,
    fontWeight: "700",
    color: "#f5e6d3",
    lineHeight: 60,
  },

  // Meaning box
  meaningBox: {
    backgroundColor: "#1a1410",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  meaningRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  meaningNumber: {
    fontSize: 32,
    fontWeight: "700",
    color: "#d4a574",
    width: 50,
    textAlign: "center",
  },
  meaningEquals: {
    fontSize: 24,
    color: "#6a5a4a",
    marginHorizontal: 12,
  },
  meaningText: {
    fontSize: 16,
    color: "#c4b5a0",
    flex: 1,
  },

  // Common time display
  commonTimeDisplay: {
    alignItems: "center",
    marginVertical: 24,
  },
  commonTimeSymbol: {
    fontSize: 80,
    fontWeight: "400",
    color: "#f5e6d3",
    fontFamily: "serif",
  },

  // Equivalence box
  equivalenceBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    gap: 20,
  },
  miniTimeSignature: {
    alignItems: "center",
  },
  miniTop: {
    fontSize: 32,
    fontWeight: "700",
    color: "#f5e6d3",
    lineHeight: 34,
  },
  miniLine: {
    width: 30,
    height: 2,
    backgroundColor: "#d4a574",
    marginVertical: 2,
  },
  miniBottom: {
    fontSize: 32,
    fontWeight: "700",
    color: "#f5e6d3",
    lineHeight: 34,
  },
  equivalenceEquals: {
    fontSize: 32,
    color: "#d4a574",
    fontWeight: "700",
  },
  equivalenceC: {
    fontSize: 48,
    color: "#f5e6d3",
    fontFamily: "serif",
  },

  // Math box
  mathBox: {
    backgroundColor: "#1a1410",
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    alignItems: "center",
  },
  mathText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#d4a574",
    textAlign: "center",
  },

  // Tip text
  tipText: {
    fontSize: 14,
    color: "#8a7a6a",
    textAlign: "center",
    marginTop: 16,
    fontStyle: "italic",
  },

  // Notation wrapper
  notationWrapper: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    paddingLeft: 24,
    marginVertical: 16,
    alignItems: "center",
    minHeight: 200,
  },

  // Quiz notation wrapper
  quizNotationWrapper: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    paddingLeft: 20,
    marginVertical: 16,
    alignItems: "center",
    alignSelf: "center",
    minHeight: 180,
  },

  // Ready text
  readyText: {
    fontSize: 18,
    color: "#d4a574",
    textAlign: "center",
    fontWeight: "600",
  },

  // Progress bar
  progressBar: {
    marginBottom: 20,
    alignItems: "center",
  },
  progressText: {
    fontSize: 14,
    color: "#8a7a6a",
    marginBottom: 8,
  },
  progressDots: {
    flexDirection: "row",
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3b2c1a",
  },
  progressDotActive: {
    backgroundColor: "#d4a574",
  },

  // Hint text
  hintText: {
    fontSize: 14,
    color: "#8a7a6a",
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 8,
  },

  // Question
  questionText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#f5e6d3",
    textAlign: "center",
    marginBottom: 24,
  },

  // Options
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: "#2d241a",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#3b2c1a",
    alignItems: "center",
  },
  optionSelected: {
    borderColor: "#d4a574",
    backgroundColor: "#3b2c1a",
  },
  optionCorrect: {
    borderColor: "#4CAF50",
    backgroundColor: "#1b3d1b",
  },
  optionIncorrect: {
    borderColor: "#e57373",
    backgroundColor: "#3d1b1b",
  },
  optionText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#c4b5a0",
  },
  optionTextCorrect: {
    color: "#4CAF50",
  },
  optionTextIncorrect: {
    color: "#e57373",
  },

  // Feedback
  feedbackContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  feedbackCorrect: {
    fontSize: 20,
    fontWeight: "600",
    color: "#4CAF50",
    textAlign: "center",
    marginBottom: 8,
  },
  feedbackIncorrect: {
    fontSize: 20,
    fontWeight: "600",
    color: "#e57373",
    textAlign: "center",
    marginBottom: 8,
  },
  feedbackExplanation: {
    fontSize: 16,
    color: "#c4b5a0",
    textAlign: "center",
    lineHeight: 24,
  },

  // Result
  resultContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  resultEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#f5e6d3",
    marginBottom: 12,
  },
  resultSubtitle: {
    fontSize: 20,
    color: "#c4b5a0",
    marginBottom: 16,
  },
  resultDetail: {
    fontSize: 16,
    color: "#8a7a6a",
    textAlign: "center",
  },

  // Buttons
  fixedBottomButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
    backgroundColor: "#1a1410",
    borderTopWidth: 1,
    borderTopColor: "#3b2c1a",
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  secondaryButton: {
    backgroundColor: "#3b2c1a",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#c4b5a0",
  },
});
