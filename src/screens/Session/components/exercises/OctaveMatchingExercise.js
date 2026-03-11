/**
 * OctaveMatchingExercise - Aural matching of octaves
 *
 * Flow: Hear two notes → Identify if they're an octave apart
 * Key concepts:
 * - Recognize octaves by ear
 * - Octaves sound "the same but different"
 * - Non-octave pairs sound like different notes
 */
import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";

// Audio context
let NativeAudioContext = null;
if (Platform.OS !== "web") {
  try {
    NativeAudioContext = require("react-native-audio-api").AudioContext;
  } catch (e) {
    console.warn("react-native-audio-api not available");
  }
}

// ============================================================
// CONSTANTS
// ============================================================

// Note frequencies
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

// Octave pairs (correct = octave)
const OCTAVE_PAIRS = [
  { note1: "C3", note2: "C4", isOctave: true },
  { note1: "D3", note2: "D4", isOctave: true },
  { note1: "E3", note2: "E4", isOctave: true },
  { note1: "G3", note2: "G4", isOctave: true },
  { note1: "A3", note2: "A4", isOctave: true },
];

// Non-octave pairs (correct = not octave)
const NON_OCTAVE_PAIRS = [
  { note1: "C3", note2: "E3", isOctave: false }, // Major 3rd
  { note1: "C3", note2: "G3", isOctave: false }, // Perfect 5th
  { note1: "D3", note2: "A3", isOctave: false }, // Perfect 5th
  { note1: "E3", note2: "G3", isOctave: false }, // Minor 3rd
  { note1: "G3", note2: "D4", isOctave: false }, // Perfect 5th
  { note1: "A3", note2: "E4", isOctave: false }, // Perfect 5th
  { note1: "C3", note2: "F3", isOctave: false }, // Perfect 4th
];

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function OctaveMatchingExercise({
  mini = {},
  sessionState = {},
  onComplete,
  onCancel,
}) {
  const requiredStreak = mini.mastery?.correct_streak || 6;

  const [questionIndex, setQuestionIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [questions, setQuestions] = useState([]);

  const audioContextRef = useRef(null);

  // Initialize questions - mix of octaves and non-octaves
  useEffect(() => {
    const mixed = [
      ...OCTAVE_PAIRS.map((p) => ({ ...p })),
      ...NON_OCTAVE_PAIRS.slice(0, 5).map((p) => ({ ...p })),
    ].sort(() => Math.random() - 0.5);
    setQuestions(mixed);
  }, []);

  // Initialize audio
  useEffect(() => {
    if (NativeAudioContext && !audioContextRef.current) {
      audioContextRef.current = new NativeAudioContext();
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Play a note
  const playNote = useCallback((frequency, duration = 0.6) => {
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

  // Play the current pair
  const playPair = useCallback(async () => {
    if (isPlaying || questions.length === 0) return;
    setIsPlaying(true);

    const pair = questions[questionIndex];
    const freq1 = NOTE_FREQUENCIES[pair.note1];
    const freq2 = NOTE_FREQUENCIES[pair.note2];

    await playNote(freq1, 0.6);
    await new Promise((r) => setTimeout(r, 300));
    await playNote(freq2, 0.6);

    setIsPlaying(false);
    setHasPlayed(true);
  }, [isPlaying, questions, questionIndex, playNote]);

  // Handle answer
  const handleAnswer = useCallback(
    (answer) => {
      if (!hasPlayed) return; // Must listen first

      const pair = questions[questionIndex];
      const isCorrect = answer === pair.isOctave;

      setSelectedAnswer(answer);
      setShowResult(true);
      setTotalAttempts((t) => t + 1);

      if (isCorrect) {
        setTotalCorrect((c) => c + 1);
        const newStreak = streak + 1;
        setStreak(newStreak);

        if (newStreak >= requiredStreak) {
          setIsComplete(true);
        }
      } else {
        setStreak(0);
      }
    },
    [hasPlayed, questions, questionIndex, streak, requiredStreak],
  );

  // Move to next question
  const handleNext = useCallback(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    setHasPlayed(false);

    // Generate new questions if needed
    if (questionIndex >= questions.length - 1) {
      const newQuestions = [
        ...OCTAVE_PAIRS.map((p) => ({ ...p })),
        ...NON_OCTAVE_PAIRS.map((p) => ({ ...p })),
      ].sort(() => Math.random() - 0.5);
      setQuestions(newQuestions);
      setQuestionIndex(0);
    } else {
      setQuestionIndex((i) => i + 1);
    }
  }, [questionIndex, questions.length]);

  // Complete exercise
  const handleComplete = useCallback(() => {
    if (onComplete) {
      onComplete({
        success: true,
        streak,
        totalCorrect,
        totalAttempts,
      });
    }
  }, [onComplete, streak, totalCorrect, totalAttempts]);

  // Completion screen
  if (isComplete) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>Octave Ears!</Text>
          <Text style={styles.subtitle}>{requiredStreak} correct in a row</Text>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              You can hear octaves!{"\n\n"}
              When two notes are an octave apart, they sound like{" "}
              <Text style={styles.highlight}>the same note</Text> at different
              heights.
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalCorrect}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {Math.round((totalCorrect / totalAttempts) * 100)}%
              </Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleComplete}>
          <Text style={styles.primaryButtonText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const currentPair = questions[questionIndex];

  // Main quiz screen
  return (
    <View style={styles.container}>
      {/* Progress */}
      <View style={styles.header}>
        <Text style={styles.streakText}>
          Streak: {streak} / {requiredStreak}
        </Text>
        <View style={styles.streakBar}>
          <View
            style={[
              styles.streakFill,
              { width: `${Math.min(100, (streak / requiredStreak) * 100)}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.question}>Are these notes an octave apart?</Text>
        <Text style={styles.hint}>(Same note, different height?)</Text>

        {/* Play button */}
        <TouchableOpacity
          style={[
            styles.playButton,
            isPlaying && styles.playButtonDisabled,
            hasPlayed && styles.playButtonPlayed,
          ]}
          onPress={playPair}
          disabled={isPlaying}
        >
          <Text style={styles.playButtonEmoji}>
            {isPlaying ? "🔊" : hasPlayed ? "🔄" : "▶️"}
          </Text>
          <Text style={styles.playButtonText}>
            {isPlaying ? "Playing..." : hasPlayed ? "Play Again" : "Listen"}
          </Text>
        </TouchableOpacity>

        {!hasPlayed && (
          <Text style={styles.listenPrompt}>Tap to hear the two notes</Text>
        )}

        {/* Answer buttons */}
        {hasPlayed && (
          <View style={styles.answerButtons}>
            <TouchableOpacity
              style={[
                styles.answerButton,
                styles.answerYes,
                showResult && currentPair.isOctave && styles.answerCorrect,
                showResult &&
                  selectedAnswer === true &&
                  !currentPair.isOctave &&
                  styles.answerWrong,
              ]}
              onPress={() => !showResult && handleAnswer(true)}
              disabled={showResult}
            >
              <Text style={styles.answerButtonText}>Yes, Octave</Text>
              <Text style={styles.answerButtonEmoji}>✓</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.answerButton,
                styles.answerNo,
                showResult && !currentPair.isOctave && styles.answerCorrect,
                showResult &&
                  selectedAnswer === false &&
                  currentPair.isOctave &&
                  styles.answerWrong,
              ]}
              onPress={() => !showResult && handleAnswer(false)}
              disabled={showResult}
            >
              <Text style={styles.answerButtonText}>No, Different</Text>
              <Text style={styles.answerButtonEmoji}>✗</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Feedback */}
        {showResult && (
          <View style={styles.feedbackContainer}>
            {selectedAnswer === currentPair.isOctave ? (
              <Text style={styles.feedbackCorrect}>
                ✓ Correct!{" "}
                {currentPair.isOctave
                  ? `${currentPair.note1} and ${currentPair.note2} are an octave apart.`
                  : "Those are different notes."}
              </Text>
            ) : (
              <Text style={styles.feedbackWrong}>
                ✗{" "}
                {currentPair.isOctave
                  ? "They ARE an octave - same note, different height!"
                  : "They're NOT an octave - different notes entirely."}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Next button */}
      {showResult && (
        <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
          <Text style={styles.primaryButtonText}>Next →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  header: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: "#252545",
  },
  streakText: {
    fontSize: 14,
    color: "#a0a0c0",
    marginBottom: 8,
    textAlign: "center",
  },
  streakBar: {
    height: 8,
    backgroundColor: "#353565",
    borderRadius: 4,
    overflow: "hidden",
  },
  streakFill: {
    height: "100%",
    backgroundColor: "#4fc3f7",
    borderRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    alignItems: "center",
  },
  question: {
    fontSize: 24,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 8,
  },
  hint: {
    fontSize: 16,
    color: "#808090",
    marginBottom: 40,
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4fc3f7",
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 16,
    gap: 12,
    marginBottom: 16,
  },
  playButtonDisabled: {
    backgroundColor: "#4fc3f780",
  },
  playButtonPlayed: {
    backgroundColor: "#353565",
  },
  playButtonEmoji: {
    fontSize: 28,
  },
  playButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  listenPrompt: {
    fontSize: 14,
    color: "#808090",
    marginBottom: 40,
  },
  answerButtons: {
    flexDirection: "row",
    gap: 16,
    marginTop: 24,
  },
  answerButton: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  answerYes: {
    backgroundColor: "#2e7d32",
  },
  answerNo: {
    backgroundColor: "#c62828",
  },
  answerCorrect: {
    borderColor: "#ffffff",
    borderWidth: 3,
  },
  answerWrong: {
    opacity: 0.5,
  },
  answerButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  answerButtonEmoji: {
    fontSize: 24,
  },
  feedbackContainer: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  feedbackCorrect: {
    fontSize: 16,
    color: "#4caf50",
    textAlign: "center",
    lineHeight: 24,
  },
  feedbackWrong: {
    fontSize: 16,
    color: "#f44336",
    textAlign: "center",
    lineHeight: 24,
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
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#a0a0c0",
    marginBottom: 32,
  },
  card: {
    backgroundColor: "#252545",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    width: "100%",
  },
  cardText: {
    fontSize: 16,
    color: "#e0e0f0",
    textAlign: "center",
    lineHeight: 24,
  },
  highlight: {
    color: "#4fc3f7",
    fontWeight: "bold",
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
  },
  statBox: {
    backgroundColor: "#252545",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    minWidth: 100,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4fc3f7",
  },
  statLabel: {
    fontSize: 12,
    color: "#808090",
    marginTop: 4,
  },
  loadingText: {
    fontSize: 18,
    color: "#808090",
    textAlign: "center",
    marginTop: 100,
  },
});
