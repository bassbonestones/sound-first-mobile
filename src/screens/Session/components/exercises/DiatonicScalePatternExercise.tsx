/**
 * DiatonicScalePatternExercise - Teaches WWHWWWH pattern aurally first
 *
 * Key concepts:
 * - Major scale pattern: W-W-H-W-W-W-H
 * - DO RE MI FA SOL LA TI DO corresponds to this pattern
 * - Hear the pattern before memorizing the formula
 * - The pattern is what makes a scale sound "major"
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
  LISTEN: "listen",
  PATTERN: "pattern",
  IDENTIFY: "identify",
  QUIZ: "quiz",
  RESULT: "result",
};

// C Major scale frequencies
const SCALE_NOTES = [
  { note: "C4", freq: 261.63, solfege: "DO", step: null },
  { note: "D4", freq: 293.66, solfege: "RE", step: "W" },
  { note: "E4", freq: 329.63, solfege: "MI", step: "W" },
  { note: "F4", freq: 349.23, solfege: "FA", step: "H" },
  { note: "G4", freq: 392.0, solfege: "SOL", step: "W" },
  { note: "A4", freq: 440.0, solfege: "LA", step: "W" },
  { note: "B4", freq: 493.88, solfege: "TI", step: "W" },
  { note: "C5", freq: 523.25, solfege: "DO", step: "H" },
];

// The pattern
const PATTERN = ["W", "W", "H", "W", "W", "W", "H"];
const PATTERN_LABELS = [
  { from: "DO", to: "RE", step: "W", desc: "Whole step" },
  { from: "RE", to: "MI", step: "W", desc: "Whole step" },
  { from: "MI", to: "FA", step: "H", desc: "Half step" },
  { from: "FA", to: "SOL", step: "W", desc: "Whole step" },
  { from: "SOL", to: "LA", step: "W", desc: "Whole step" },
  { from: "LA", to: "TI", step: "W", desc: "Whole step" },
  { from: "TI", to: "DO", step: "H", desc: "Half step" },
];

// Quiz questions
const QUIZ_QUESTIONS = [
  {
    question: "The major scale pattern is:",
    correctAnswer: "W-W-H-W-W-W-H",
    options: [
      "W-H-W-W-W-H-W",
      "W-W-H-W-W-W-H",
      "H-W-W-W-H-W-W",
      "W-W-W-H-W-W-H",
    ],
  },
  {
    question: "MI to FA is a:",
    correctAnswer: "Half step",
    options: ["Whole step", "Half step", "Two whole steps", "No step"],
  },
  {
    question: "TI to DO is a:",
    correctAnswer: "Half step",
    options: ["Whole step", "Half step", "Two whole steps", "No step"],
  },
  {
    question: "How many half steps are in the major scale pattern?",
    correctAnswer: "2",
    options: ["1", "2", "3", "4"],
  },
];

// ============================================================
// SCALE VISUALIZATION COMPONENT
// ============================================================

function ScaleSteps({ currentStep = -1, showPattern = false }) {
  return (
    <View style={scaleStyles.container}>
      {SCALE_NOTES.map((note, idx) => (
        <View key={idx} style={scaleStyles.noteGroup}>
          <View
            style={[
              scaleStyles.noteCircle,
              idx <= currentStep && scaleStyles.noteCircleActive,
            ]}
          >
            <Text
              style={[
                scaleStyles.solfege,
                idx <= currentStep && scaleStyles.solfegeActive,
              ]}
            >
              {note.solfege}
            </Text>
          </View>
          {idx < SCALE_NOTES.length - 1 && (
            <View style={scaleStyles.stepContainer}>
              <View
                style={[
                  scaleStyles.stepLine,
                  idx < currentStep && scaleStyles.stepLineActive,
                ]}
              />
              {showPattern && (
                <Text
                  style={[
                    scaleStyles.stepLabel,
                    PATTERN[idx] === "H" && scaleStyles.stepLabelHalf,
                  ]}
                >
                  {PATTERN[idx]}
                </Text>
              )}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const scaleStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    paddingVertical: 20,
  },
  noteGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  noteCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#353565",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4a4a6a",
  },
  noteCircleActive: {
    backgroundColor: "#ffc107",
    borderColor: "#ffca28",
  },
  solfege: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#808090",
  },
  solfegeActive: {
    color: "#1a1a2e",
  },
  stepContainer: {
    width: 28,
    alignItems: "center",
  },
  stepLine: {
    width: 20,
    height: 2,
    backgroundColor: "#4a4a6a",
  },
  stepLineActive: {
    backgroundColor: "#ffc107",
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#81c784",
    marginTop: 4,
  },
  stepLabelHalf: {
    color: "#4fc3f7",
  },
});

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function DiatonicScalePatternExercise({
  mini = {},
  sessionState = {},
  onComplete,
  onCancel,
}: LessonExerciseProps) {
  const [phase, setPhase] = useState(PHASES.INTRO);
  const [currentStep, setCurrentStep] = useState(-1);
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayedOnPhase, setHasPlayedOnPhase] = useState(false);
  const [intervalsPlayed, setIntervalsPlayed] = useState(new Set());

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

  const playNote = useCallback((frequency, duration = 0.4) => {
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

  const playScale = useCallback(
    async (showSteps = false) => {
      if (isPlaying) return;
      setIsPlaying(true);
      setCurrentStep(-1);

      for (let i = 0; i < SCALE_NOTES.length; i++) {
        setCurrentStep(i);
        await playNote(SCALE_NOTES[i].freq, 0.5);
        await new Promise((r) => setTimeout(r, 150));
      }

      setTimeout(() => {
        setIsPlaying(false);
        setHasPlayedOnPhase(true);
      }, 300);
    },
    [isPlaying, playNote],
  );

  const playInterval = useCallback(
    async (idx) => {
      if (isPlaying || idx >= SCALE_NOTES.length - 1) return;
      setIsPlaying(true);

      setCurrentStep(idx);
      await playNote(SCALE_NOTES[idx].freq, 0.5);
      await new Promise((r) => setTimeout(r, 100));
      setCurrentStep(idx + 1);
      await playNote(SCALE_NOTES[idx + 1].freq, 0.5);

      setIsPlaying(false);
      setIntervalsPlayed((prev) => new Set([...prev, idx]));
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
          <Text style={styles.title}>The Major Scale Pattern</Text>
          <Text style={styles.subtitle}>W-W-H-W-W-W-H</Text>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              The <Text style={styles.highlight}>major scale</Text> has a
              specific pattern of whole steps (W) and half steps (H).
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              This pattern is what gives the major scale its{" "}
              <Text style={styles.highlight}>bright, happy sound</Text>.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.emoji}>🎵</Text>
            <Text style={styles.cardText}>
              Let's hear the scale first, then learn the pattern!
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setPhase(PHASES.LISTEN)}
          accessibilityLabel="Listen to the scale"
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Listen to the Scale →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === PHASES.LISTEN) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Hear the Major Scale</Text>

          <ScaleSteps currentStep={currentStep} showPattern={false} />

          <View style={styles.card}>
            <Text style={styles.cardText}>
              DO - RE - MI - FA - SOL - LA - TI - DO
              {"\n\n"}
              <Text style={styles.highlight}>This is the major scale!</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.playButton, isPlaying && styles.playButtonDisabled]}
            onPress={() => playScale(false)}
            disabled={isPlaying}
            accessibilityLabel="Play the scale"
            accessibilityRole="button"
          >
            <Text style={styles.playButtonText}>
              {isPlaying ? "Playing..." : "▶ Play the Scale"}
            </Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              Notice how some steps sound{" "}
              <Text style={styles.highlightSmall}>smaller</Text> than others?
              {"\n\n"}
              That's because they use different intervals!
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            !hasPlayedOnPhase && styles.primaryButtonDisabled,
          ]}
          onPress={() => {
            setHasPlayedOnPhase(false);
            setPhase(PHASES.PATTERN);
          }}
          disabled={!hasPlayedOnPhase}
          accessibilityLabel="See the pattern"
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.primaryButtonText,
              !hasPlayedOnPhase && styles.primaryButtonTextDisabled,
            ]}
          >
            {hasPlayedOnPhase ? "See the Pattern →" : "Play to continue..."}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === PHASES.PATTERN) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>The Pattern Revealed</Text>

          <ScaleSteps
            currentStep={isPlaying ? currentStep : 7}
            showPattern={true}
          />

          <View style={styles.patternDisplay}>
            <Text style={styles.patternText}>
              <Text style={styles.highlightW}>W</Text> -{" "}
              <Text style={styles.highlightW}>W</Text> -{" "}
              <Text style={styles.highlightH}>H</Text> -{" "}
              <Text style={styles.highlightW}>W</Text> -{" "}
              <Text style={styles.highlightW}>W</Text> -{" "}
              <Text style={styles.highlightW}>W</Text> -{" "}
              <Text style={styles.highlightH}>H</Text>
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              <Text style={styles.highlightH}>Half steps</Text> occur:
              {"\n"}• MI → FA (3rd to 4th)
              {"\n"}• TI → DO (7th to 8th)
              {"\n\n"}
              All other steps are{" "}
              <Text style={styles.highlightW}>whole steps</Text>!
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.playButton, isPlaying && styles.playButtonDisabled]}
            onPress={() => playScale(true)}
            disabled={isPlaying}
            accessibilityLabel="Replay the scale"
            accessibilityRole="button"
          >
            <Text style={styles.playButtonText}>
              {isPlaying ? "Playing..." : "▶ Play Again"}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            !hasPlayedOnPhase && styles.primaryButtonDisabled,
          ]}
          onPress={() => {
            setHasPlayedOnPhase(false);
            setIntervalsPlayed(new Set());
            setPhase(PHASES.IDENTIFY);
          }}
          disabled={!hasPlayedOnPhase}
          accessibilityLabel="Hear each step"
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.primaryButtonText,
              !hasPlayedOnPhase && styles.primaryButtonTextDisabled,
            ]}
          >
            {hasPlayedOnPhase ? "Hear Each Step →" : "Play to continue..."}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === PHASES.IDENTIFY) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Hear Each Interval</Text>

          <ScaleSteps currentStep={currentStep} showPattern={true} />

          <Text style={styles.helperText}>Tap any interval to hear it:</Text>

          <View style={styles.intervalGrid}>
            {PATTERN_LABELS.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.intervalButton,
                  item.step === "H" && styles.intervalButtonHalf,
                ]}
                onPress={() => playInterval(idx)}
                disabled={isPlaying}
                accessibilityLabel={`Play interval ${item.from} to ${item.to}`}
                accessibilityRole="button"
              >
                <Text style={styles.intervalFrom}>{item.from}</Text>
                <Text style={styles.intervalArrow}>↓</Text>
                <Text style={styles.intervalTo}>{item.to}</Text>
                <Text
                  style={[
                    styles.intervalStep,
                    item.step === "H" && styles.intervalStepHalf,
                  ]}
                >
                  {item.step}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              🎯 <Text style={styles.highlight}>Notice:</Text>
              {"\n\n"}
              The <Text style={styles.highlightH}>half steps</Text> (MI→FA,
              TI→DO) sound closer together!
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            intervalsPlayed.size < 2 && styles.primaryButtonDisabled,
          ]}
          onPress={() => setPhase(PHASES.QUIZ)}
          disabled={intervalsPlayed.size < 2}
          accessibilityLabel="Start quiz"
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.primaryButtonText,
              intervalsPlayed.size < 2 && styles.primaryButtonTextDisabled,
            ]}
          >
            {intervalsPlayed.size >= 2
              ? "Quiz Me →"
              : `Tap ${2 - intervalsPlayed.size} more interval${2 - intervalsPlayed.size > 1 ? "s" : ""}...`}
          </Text>
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
            accessibilityLabel={
              quizIndex < QUIZ_QUESTIONS.length - 1
                ? "Next question"
                : "See results"
            }
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

  if (phase === PHASES.RESULT) {
    const passed = score === QUIZ_QUESTIONS.length;

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.resultEmoji}>{passed ? "🎉" : "📚"}</Text>
          <Text style={styles.resultTitle}>
            {passed ? "You know the pattern!" : "Let's review"}
          </Text>
          <Text style={styles.resultScore}>
            {score} / {QUIZ_QUESTIONS.length} correct
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              <Text style={styles.highlight}>Major Scale Pattern:</Text>
              {"\n\n"}
              <Text style={styles.highlightW}>W</Text>-
              <Text style={styles.highlightW}>W</Text>-
              <Text style={styles.highlightH}>H</Text>-
              <Text style={styles.highlightW}>W</Text>-
              <Text style={styles.highlightW}>W</Text>-
              <Text style={styles.highlightW}>W</Text>-
              <Text style={styles.highlightH}>H</Text>
              {"\n\n"}• Half steps at MI→FA and TI→DO
              {"\n"}• This pattern works from ANY starting note!
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
    fontSize: 22,
    color: "#ffc107",
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "bold",
    letterSpacing: 4,
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
    color: "#ffc107",
    fontWeight: "bold",
  },
  highlightSmall: {
    color: "#4fc3f7",
    fontWeight: "bold",
  },
  highlightW: {
    color: "#81c784",
    fontWeight: "bold",
  },
  highlightH: {
    color: "#4fc3f7",
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
    backgroundColor: "#ffc107",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    backgroundColor: "#4a4a6a",
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  primaryButtonTextDisabled: {
    color: "#808090",
  },
  playButton: {
    backgroundColor: "#ffc107",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignSelf: "center",
    marginVertical: 16,
  },
  playButtonDisabled: {
    backgroundColor: "#ffc10780",
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  patternDisplay: {
    backgroundColor: "#353565",
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
    alignItems: "center",
  },
  patternText: {
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  helperText: {
    fontSize: 14,
    color: "#808090",
    textAlign: "center",
    marginBottom: 16,
  },
  intervalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },
  intervalButton: {
    backgroundColor: "#353565",
    borderRadius: 10,
    padding: 12,
    width: 70,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#81c784",
  },
  intervalButtonHalf: {
    borderColor: "#4fc3f7",
  },
  intervalFrom: {
    fontSize: 12,
    color: "#a0a0c0",
    fontWeight: "600",
  },
  intervalArrow: {
    fontSize: 14,
    color: "#606080",
    marginVertical: 2,
  },
  intervalTo: {
    fontSize: 12,
    color: "#a0a0c0",
    fontWeight: "600",
  },
  intervalStep: {
    fontSize: 14,
    color: "#81c784",
    fontWeight: "bold",
    marginTop: 4,
  },
  intervalStepHalf: {
    color: "#4fc3f7",
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
