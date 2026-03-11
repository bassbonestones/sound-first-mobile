/**
 * TimeSignatureBasicsExercise - Teaches time signature fundamentals
 *
 * Flow: Intro → Quiz (4 questions)
 * Key concepts:
 * - Top number = beats per measure
 * - Bottom number = what note gets the beat (1=whole, 2=half, 4=quarter, etc.)
 * - Measures and barlines
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

// For notation display
let NotationDisplay = null;
try {
  NotationDisplay = require("../../../../components/NotationDisplay").default;
} catch (e) {
  console.warn("NotationDisplay not available");
}

// ============================================================
// CONSTANTS
// ============================================================

const PHASES = {
  INTRO_1: "intro_1", // What is a time signature
  INTRO_2: "intro_2", // Top number - beats per measure
  INTRO_3: "intro_3", // Bottom number - note type
  INTRO_4: "intro_4", // Measures and barlines
  QUIZ: "quiz",
  RESULT: "result",
};

// Note type mapping for bottom number
const NOTE_TYPE_MAP = {
  1: { name: "whole", display: "Whole note" },
  2: { name: "half", display: "Half note" },
  4: { name: "quarter", display: "Quarter note" },
  8: { name: "eighth", display: "Eighth note" },
  16: { name: "sixteenth", display: "Sixteenth note" },
};

// Quiz questions pool
const QUIZ_QUESTIONS = [
  // "How many beats" questions
  {
    type: "beats",
    numerator: 4,
    denominator: 4,
    question: "How many beats per measure?",
    correctAnswer: 4,
    options: [2, 3, 4, 6],
  },
  {
    type: "beats",
    numerator: 3,
    denominator: 4,
    question: "How many beats per measure?",
    correctAnswer: 3,
    options: [2, 3, 4, 6],
  },
  {
    type: "beats",
    numerator: 2,
    denominator: 4,
    question: "How many beats per measure?",
    correctAnswer: 2,
    options: [2, 3, 4, 6],
  },
  {
    type: "beats",
    numerator: 6,
    denominator: 8,
    question: "How many beats per measure?",
    correctAnswer: 6,
    options: [2, 3, 4, 6],
  },
  // "What note gets the beat" questions
  {
    type: "note",
    numerator: 4,
    denominator: 4,
    question: "What note gets one beat?",
    correctAnswer: "Quarter note",
    options: ["Half note", "Quarter note", "Eighth note", "Whole note"],
  },
  {
    type: "note",
    numerator: 3,
    denominator: 8,
    question: "What note gets one beat?",
    correctAnswer: "Eighth note",
    options: ["Half note", "Quarter note", "Eighth note", "Whole note"],
  },
  {
    type: "note",
    numerator: 2,
    denominator: 2,
    question: "What note gets one beat?",
    correctAnswer: "Half note",
    options: ["Half note", "Quarter note", "Eighth note", "Whole note"],
  },
  {
    type: "note",
    numerator: 6,
    denominator: 8,
    question: "What note gets one beat?",
    correctAnswer: "Eighth note",
    options: ["Half note", "Quarter note", "Eighth note", "Whole note"],
  },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Generate MusicXML for a time signature with a whole note on a staff
function generateTimeSignatureMusicXML(numerator, denominator, clef = "treble") {
  const clefSign = clef === "bass" ? "F" : "G";
  const clefLine = clef === "bass" ? "4" : "2";
  // Use a note that looks good on the staff (middle of the staff)
  const pitch = clef === "bass" ? { step: "D", octave: 3 } : { step: "B", octave: 4 };

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
          <beats>${numerator}</beats>
          <beat-type>${denominator}</beat-type>
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

// Generate MusicXML showing measures with barlines
function generateMeasureExampleMusicXML(clef = "treble") {
  const clefSign = clef === "bass" ? "F" : "G";
  const clefLine = clef === "bass" ? "4" : "2";

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
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>D</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>E</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>F</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
    </measure>
    <measure number="2">
      <note>
        <pitch><step>G</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>A</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>B</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>C</step><octave>5</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <barline location="right">
        <bar-style>light-heavy</bar-style>
      </barline>
    </measure>
  </part>
</score-partwise>`;
}

// Shuffle array (Fisher-Yates)
function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Select 4 random questions (2 beats type, 2 note type)
function selectQuizQuestions() {
  const beatsQuestions = QUIZ_QUESTIONS.filter((q) => q.type === "beats");
  const noteQuestions = QUIZ_QUESTIONS.filter((q) => q.type === "note");

  const selectedBeats = shuffleArray(beatsQuestions).slice(0, 2);
  const selectedNotes = shuffleArray(noteQuestions).slice(0, 2);

  return shuffleArray([...selectedBeats, ...selectedNotes]);
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function TimeSignatureBasicsExercise({
  config,
  mastery,
  onComplete,
  onProgress,
  clef = "treble",
}) {
  const [phase, setPhase] = useState(PHASES.INTRO_1);
  const [quizQuestions, setQuizQuestions] = useState(() => selectQuizQuestions());
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);

  // Current question data
  const question = quizQuestions[currentQuestion];

  // Generate MusicXML for current question
  const questionMusicXML = useMemo(() => {
    if (phase !== PHASES.QUIZ || !question) return null;
    return generateTimeSignatureMusicXML(question.numerator, question.denominator, clef);
  }, [phase, question, clef]);

  // Example MusicXML for intro
  const exampleMusicXML = useMemo(
    () => generateTimeSignatureMusicXML(4, 4, clef),
    [clef]
  );

  const measureExampleMusicXML = useMemo(
    () => generateMeasureExampleMusicXML(clef),
    [clef]
  );

  // Handle answer selection
  const handleAnswer = useCallback(
    (answer) => {
      if (showFeedback) return;
      setSelectedAnswer(answer);
      setShowFeedback(true);

      const isCorrect =
        question.type === "beats"
          ? answer === question.correctAnswer
          : answer === question.correctAnswer;

      if (isCorrect) {
        setCorrectCount((prev) => prev + 1);
      }

      // After a delay, move to next question or result
      setTimeout(() => {
        setShowFeedback(false);
        setSelectedAnswer(null);

        if (currentQuestion < 3) {
          // More questions
          setCurrentQuestion((prev) => prev + 1);
          onProgress?.({
            current: currentQuestion + 1,
            total: 4,
            correct: correctCount + (isCorrect ? 1 : 0),
          });
        } else {
          // Quiz complete
          const finalCorrect = correctCount + (isCorrect ? 1 : 0);
          const passed = finalCorrect === 4;
          setQuizPassed(passed);
          setPhase(PHASES.RESULT);
        }
      }, 1500);
    },
    [showFeedback, question, currentQuestion, correctCount, onProgress]
  );

  // Handle restart
  const handleRestart = useCallback(() => {
    setQuizQuestions(selectQuizQuestions());
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
      streak: 4,
      totalAttempts: 4,
      correctCount: 4,
    });
  }, [onComplete]);

  // ============================================================
  // INTRO PHASE 1 - What is a Time Signature
  // ============================================================
  if (phase === PHASES.INTRO_1) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>Time Signature</Text>

            <View style={styles.timeSignatureDisplay}>
              <Text style={styles.timeSignatureTop}>4</Text>
              <View style={styles.timeSignatureLine} />
              <Text style={styles.timeSignatureBottom}>4</Text>
            </View>

            <Text style={styles.introText}>
              A <Text style={styles.highlight}>time signature</Text> appears at
              the beginning of a piece of music.
            </Text>

            <Text style={styles.introText}>
              It tells you two important things:
            </Text>

            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>
                <Text style={styles.bulletLabel}>TOP NUMBER:</Text> How many beats in each measure
              </Text>
              <Text style={styles.bulletItem}>
                <Text style={styles.bulletLabel}>BOTTOM NUMBER:</Text> What kind of note equals one beat
              </Text>
            </View>
          </View>

          {NotationDisplay && exampleMusicXML && (
            <View style={styles.notationWrapper}>
              <NotationDisplay
                musicxml={exampleMusicXML}
                width={360}
                height={180}
                showTimeSignature={true}
              />
            </View>
          )}
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
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
  // INTRO PHASE 2 - Top Number (Beats per Measure)
  // ============================================================
  if (phase === PHASES.INTRO_2) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.introCard}>
            <Text style={styles.introSubtitle}>The Top Number</Text>

            <View style={styles.timeSignatureDisplay}>
              <Text style={[styles.timeSignatureTop, styles.highlightedNumber]}>
                4
              </Text>
              <View style={styles.timeSignatureLine} />
              <Text style={[styles.timeSignatureBottom, styles.fadedNumber]}>
                4
              </Text>
            </View>

            <Text style={styles.introText}>
              The <Text style={styles.highlight}>top number</Text> tells you how
              many beats (or pulses) are in each measure.
            </Text>

            <View style={styles.exampleBox}>
              <Text style={styles.exampleTitle}>Examples:</Text>
              <View style={styles.exampleRow}>
                <View style={styles.miniTimeSignature}>
                  <Text style={styles.miniTop}>4</Text>
                  <View style={styles.miniLine} />
                  <Text style={styles.miniBottom}>4</Text>
                </View>
                <Text style={styles.exampleText}>= 4 beats per measure</Text>
              </View>
              <View style={styles.exampleRow}>
                <View style={styles.miniTimeSignature}>
                  <Text style={styles.miniTop}>3</Text>
                  <View style={styles.miniLine} />
                  <Text style={styles.miniBottom}>4</Text>
                </View>
                <Text style={styles.exampleText}>= 3 beats per measure</Text>
              </View>
              <View style={styles.exampleRow}>
                <View style={styles.miniTimeSignature}>
                  <Text style={styles.miniTop}>6</Text>
                  <View style={styles.miniLine} />
                  <Text style={styles.miniBottom}>8</Text>
                </View>
                <Text style={styles.exampleText}>= 6 beats per measure</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setPhase(PHASES.INTRO_1)}
          >
            <Text style={styles.secondaryButtonText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
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
  // INTRO PHASE 3 - Bottom Number (Note Type)
  // ============================================================
  if (phase === PHASES.INTRO_3) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.introCard}>
            <Text style={styles.introSubtitle}>The Bottom Number</Text>

            <View style={styles.timeSignatureDisplay}>
              <Text style={[styles.timeSignatureTop, styles.fadedNumber]}>4</Text>
              <View style={styles.timeSignatureLine} />
              <Text style={[styles.timeSignatureBottom, styles.highlightedNumber]}>
                4
              </Text>
            </View>

            <Text style={styles.introText}>
              The <Text style={styles.highlight}>bottom number</Text> tells you
              what type of note gets one beat.
            </Text>

            <View style={styles.exampleBox}>
              <Text style={styles.exampleTitle}>The Code:</Text>
              <View style={styles.codeRow}>
                <Text style={styles.codeNumber}>1</Text>
                <Text style={styles.codeEquals}>=</Text>
                <Text style={styles.codeText}>Whole note gets the beat</Text>
              </View>
              <View style={styles.codeRow}>
                <Text style={styles.codeNumber}>2</Text>
                <Text style={styles.codeEquals}>=</Text>
                <Text style={styles.codeText}>Half note gets the beat</Text>
              </View>
              <View style={styles.codeRow}>
                <Text style={[styles.codeNumber, styles.highlightCode]}>4</Text>
                <Text style={styles.codeEquals}>=</Text>
                <Text style={styles.codeText}>Quarter note gets the beat</Text>
              </View>
              <View style={styles.codeRow}>
                <Text style={styles.codeNumber}>8</Text>
                <Text style={styles.codeEquals}>=</Text>
                <Text style={styles.codeText}>Eighth note gets the beat</Text>
              </View>
            </View>

            <Text style={styles.tipText}>
              💡 Think of it as "What do I divide a whole note into?"
            </Text>
          </View>
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setPhase(PHASES.INTRO_2)}
          >
            <Text style={styles.secondaryButtonText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setPhase(PHASES.INTRO_4)}
          >
            <Text style={styles.primaryButtonText}>Next →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============================================================
  // INTRO PHASE 4 - Measures and Barlines
  // ============================================================
  if (phase === PHASES.INTRO_4) {
    // Layout constants for measure alignment
    const NOTATION_WIDTH = 360;
    const CLEF_TIME_SIG_WIDTH = 65;
    const MEASURE_WIDTH = 130;
    // Calculate measure center positions
    const measure1Center = CLEF_TIME_SIG_WIDTH + MEASURE_WIDTH / 2;
    const measure2Center = CLEF_TIME_SIG_WIDTH + MEASURE_WIDTH + MEASURE_WIDTH / 2;

    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.introCard}>
            <Text style={styles.introSubtitle}>Measures & Barlines</Text>

            <Text style={styles.introText}>
              A <Text style={styles.highlight}>measure</Text> (or bar) is the
              space between two vertical lines called{" "}
              <Text style={styles.highlight}>barlines</Text>.
            </Text>

            <Text style={styles.introText}>
              Each measure contains exactly the number of beats shown in the time
              signature.
            </Text>
          </View>

          {NotationDisplay && measureExampleMusicXML && (
            <View style={styles.notationWrapper}>
              <NotationDisplay
                musicxml={measureExampleMusicXML}
                width={NOTATION_WIDTH}
                height={180}
                showTimeSignature={true}
                fixedMeasureWidthPixels={MEASURE_WIDTH}
              />
            </View>
          )}

          {/* Aligned measure labels */}
          <View style={[styles.measureLabelsAligned, { width: NOTATION_WIDTH }]}>
            <Text style={[styles.measureLabel, { position: "absolute", left: measure1Center - 40, width: 80, textAlign: "center" }]}>
              ↑ Measure 1
            </Text>
            <Text style={[styles.measureLabel, { position: "absolute", left: measure2Center - 40, width: 80, textAlign: "center" }]}>
              ↑ Measure 2
            </Text>
          </View>

          <View style={styles.introCard}>
            <Text style={styles.readyText}>
              Ready to test your understanding?
            </Text>
          </View>
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setPhase(PHASES.INTRO_3)}
          >
            <Text style={styles.secondaryButtonText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
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
      question.type === "beats"
        ? selectedAnswer === question.correctAnswer
        : selectedAnswer === question.correctAnswer;

    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Progress indicator */}
          <View style={styles.progressBar}>
            <Text style={styles.progressText}>
              Question {currentQuestion + 1} of 4
            </Text>
            <View style={styles.progressDots}>
              {[0, 1, 2, 3].map((i) => (
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

          {/* Time signature display */}
          {NotationDisplay && questionMusicXML ? (
            <View style={styles.quizNotationWrapper}>
              <NotationDisplay
                musicxml={questionMusicXML}
                width={320}
                height={160}
                showTimeSignature={true}
              />
            </View>
          ) : (
            <View style={styles.timeSignatureDisplay}>
              <Text style={styles.timeSignatureTop}>{question.numerator}</Text>
              <View style={styles.timeSignatureLine} />
              <Text style={styles.timeSignatureBottom}>
                {question.denominator}
              </Text>
            </View>
          )}

          {/* Question */}
          <Text style={styles.questionText}>{question.question}</Text>

          {/* Answer options */}
          <View style={styles.optionsContainer}>
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrectOption =
                question.type === "beats"
                  ? option === question.correctAnswer
                  : option === question.correctAnswer;

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

              return (
                <TouchableOpacity
                  key={index}
                  style={optionStyle}
                  onPress={() => handleAnswer(option)}
                  disabled={showFeedback}
                >
                  <Text style={textStyle}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Feedback */}
          {showFeedback && (
            <Text style={isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect}>
              {isCorrect ? "✓ Correct!" : `✗ The answer is ${question.correctAnswer}`}
            </Text>
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
              You got all 4 questions correct!
            </Text>
            <Text style={styles.resultDetail}>
              You now understand time signatures.
            </Text>
          </View>

          <View style={styles.fixedBottomButtons}>
            <TouchableOpacity
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
              You got {correctCount} out of 4 correct.
            </Text>
            <Text style={styles.resultDetail}>
              Review the material and try again!
            </Text>
          </View>

          <View style={styles.fixedBottomButtons}>
            <TouchableOpacity
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
  highlightedNumber: {
    color: "#4CAF50",
  },
  fadedNumber: {
    color: "#6a5a4a",
  },

  // Bullet list
  bulletList: {
    alignSelf: "flex-start",
    marginTop: 12,
  },
  bulletItem: {
    fontSize: 16,
    color: "#c4b5a0",
    marginBottom: 12,
    paddingLeft: 8,
    lineHeight: 24,
  },
  bulletLabel: {
    color: "#d4a574",
    fontWeight: "700",
  },

  // Example box
  exampleBox: {
    backgroundColor: "#1a1410",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#d4a574",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  exampleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  miniTimeSignature: {
    alignItems: "center",
    marginRight: 16,
    width: 40,
  },
  miniTop: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f5e6d3",
    lineHeight: 26,
  },
  miniLine: {
    width: 24,
    height: 2,
    backgroundColor: "#d4a574",
    marginVertical: 2,
  },
  miniBottom: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f5e6d3",
    lineHeight: 26,
  },
  exampleText: {
    fontSize: 16,
    color: "#c4b5a0",
  },

  // Code rows (for bottom number explanation)
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  codeNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f5e6d3",
    width: 40,
    textAlign: "center",
  },
  codeEquals: {
    fontSize: 20,
    color: "#6a5a4a",
    marginHorizontal: 12,
  },
  codeText: {
    fontSize: 16,
    color: "#c4b5a0",
    flex: 1,
  },
  highlightCode: {
    color: "#4CAF50",
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

  // Measure labels
  measureLabels: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  measureLabelsAligned: {
    position: "relative",
    height: 30,
    alignSelf: "center",
    marginBottom: 16,
  },
  measureLabel: {
    fontSize: 14,
    color: "#d4a574",
    fontStyle: "italic",
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
  feedbackCorrect: {
    fontSize: 20,
    fontWeight: "600",
    color: "#4CAF50",
    textAlign: "center",
    marginTop: 20,
  },
  feedbackIncorrect: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e57373",
    textAlign: "center",
    marginTop: 20,
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
