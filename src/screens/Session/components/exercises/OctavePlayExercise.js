/**
 * OctavePlayExercise - Play octaves on your instrument
 *
 * Flow: Hear target → Play the octave → Get feedback
 * Key concepts:
 * - Play your first note
 * - Play the same note an octave higher/lower
 * - Listen for the "sameness" of octaves
 */
import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { usePitchDetection } from "../../../../hooks/usePitchDetection";
import { CircularVolumeIndicator } from "../../../../components/VolumeBar";
import { exercisePropTypes, exerciseDefaultProps } from "./shared";
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

// Note to MIDI mapping
const NOTE_TO_MIDI = {
  C3: 48,
  D3: 50,
  E3: 52,
  F3: 53,
  G3: 55,
  A3: 57,
  B3: 59,
  C4: 60,
  D4: 62,
  E4: 64,
  F4: 65,
  G4: 67,
  A4: 69,
  B4: 71,
  C5: 72,
  D5: 74,
  E5: 76,
  F5: 77,
  G5: 79,
  A5: 81,
  B5: 83,
};

// MIDI to frequency
function midiToFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Frequency to closest MIDI
function frequencyToMidi(freq) {
  return Math.round(12 * Math.log2(freq / 440) + 69);
}

// Pitch detection options
const PITCH_DETECTION_OPTIONS = {
  volumeThreshold: 0.05,
  silenceDuration: 150,
  soundingFrequencyRange: { min: 60, max: 1200 },
};

// Octave exercise configurations
const OCTAVE_EXERCISES = [
  { baseNote: "C4", direction: "up", targetNote: "C5" },
  { baseNote: "G4", direction: "up", targetNote: "G5" },
  { baseNote: "C5", direction: "down", targetNote: "C4" },
  { baseNote: "G4", direction: "down", targetNote: "G3" },
  { baseNote: "D4", direction: "up", targetNote: "D5" },
  { baseNote: "A4", direction: "down", targetNote: "A3" },
];

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function OctavePlayExercise({
  mini = {},
  sessionState = {},
  onComplete,
  onCancel,
}) {
  const config = mini.config || {};
  const requiredStreak = mini.mastery?.correct_streak || 4;

  // Get first note from session state
  const firstNote = sessionState.first_note || config.first_note || "C4";
  const firstNoteMidi = NOTE_TO_MIDI[firstNote] || 60;

  const [phase, setPhase] = useState("intro"); // intro, listen, play, feedback
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [lastPlayedMidi, setLastPlayedMidi] = useState(null);
  const [wasCorrect, setWasCorrect] = useState(false);

  const audioContextRef = useRef(null);

  // Generate exercises based on first note
  const exercises = useMemo(() => {
    const baseOctave = Math.floor(firstNoteMidi / 12);
    const baseLetter = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ][firstNoteMidi % 12];

    // Use first note for exercises
    return [
      { baseNote: firstNote, direction: "up", targetMidi: firstNoteMidi + 12 },
      {
        baseNote: firstNote,
        direction: "down",
        targetMidi: firstNoteMidi - 12,
      },
      { baseNote: firstNote, direction: "up", targetMidi: firstNoteMidi + 12 },
      {
        baseNote: firstNote,
        direction: "down",
        targetMidi: firstNoteMidi - 12,
      },
    ];
  }, [firstNote, firstNoteMidi]);

  const currentExercise = exercises[exerciseIndex % exercises.length];

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

  // Pitch detection
  const handlePitchDetected = useCallback(
    (frequency, volume) => {
      if (phase !== "play" || volume < 0.05) return;

      const detectedMidi = frequencyToMidi(frequency);
      setLastPlayedMidi(detectedMidi);

      // Check if it's the target octave (within 1 semitone tolerance)
      const targetMidi = currentExercise.targetMidi;
      const isCorrect = Math.abs(detectedMidi - targetMidi) <= 1;

      if (isCorrect) {
        setWasCorrect(true);
        setStreak((s) => s + 1);
        setTotalAttempts((t) => t + 1);

        if (streak + 1 >= requiredStreak) {
          setIsComplete(true);
        } else {
          setPhase("feedback");
        }
      }
    },
    [phase, currentExercise, streak, requiredStreak],
  );

  const {
    isListening,
    currentFrequency,
    currentVolume,
    start: startListening,
    stop: stopListening,
  } = usePitchDetection({
    onPitchDetected: handlePitchDetected,
    ...PITCH_DETECTION_OPTIONS,
  });

  // Play reference note
  const playNote = useCallback(async (midi, duration = 0.8) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    setIsPlaying(true);
    const freq = midiToFrequency(midi);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);

    await new Promise((r) => setTimeout(r, duration * 1000));
    setIsPlaying(false);
  }, []);

  // Play base note then prompt for octave
  const playReference = useCallback(async () => {
    await playNote(firstNoteMidi, 0.8);
    setPhase("play");
    startListening();
  }, [playNote, firstNoteMidi, startListening]);

  // Mark as wrong and move on
  const handleSkip = useCallback(() => {
    setStreak(0);
    setTotalAttempts((t) => t + 1);
    setWasCorrect(false);
    setPhase("feedback");
  }, []);

  // Move to next exercise
  const handleNext = useCallback(() => {
    stopListening();
    setPhase("listen");
    setExerciseIndex((i) => i + 1);
    setLastPlayedMidi(null);
    setWasCorrect(false);
  }, [stopListening]);

  // Complete
  const handleComplete = useCallback(() => {
    stopListening();
    if (onComplete) {
      onComplete({
        success: true,
        streak,
        totalAttempts,
      });
    }
  }, [onComplete, streak, totalAttempts, stopListening]);

  // ============================================================
  // RENDER
  // ============================================================

  // Completion screen
  if (isComplete) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>Octave Master!</Text>
          <Text style={styles.subtitle}>{requiredStreak} octaves in a row</Text>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              You can play octaves!{"\n\n"}
              <Text style={styles.highlight}>{firstNote}</Text> and its octave
              sound like the same note at different heights.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          accessibilityLabel="Continue"
          accessibilityRole="button"
          style={styles.primaryButton}
          onPress={handleComplete}
        >
          <Text style={styles.primaryButtonText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Intro phase
  if (phase === "intro") {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Play the Octave</Text>
          <Text style={styles.subtitle}>Low & High Versions</Text>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              You'll hear your note:{" "}
              <Text style={styles.highlight}>{firstNote}</Text>
              {"\n\n"}
              Then play the same note an{" "}
              <Text style={styles.highlight}>octave higher</Text> or{" "}
              <Text style={styles.highlight}>lower</Text>.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              💡 An octave is 8 notes away on a scale{"\n"}
              (or 12 half-steps on a keyboard)
            </Text>
          </View>
        </View>

        <TouchableOpacity
          accessibilityLabel="Let's go"
          accessibilityRole="button"
          style={styles.primaryButton}
          onPress={() => setPhase("listen")}
        >
          <Text style={styles.primaryButtonText}>Let's Go →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Listen phase - hear reference
  if (phase === "listen") {
    const directionText =
      currentExercise.direction === "up" ? "HIGHER" : "LOWER";
    const directionEmoji = currentExercise.direction === "up" ? "⬆️" : "⬇️";

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
          <Text style={styles.instruction}>
            Listen to <Text style={styles.highlight}>{firstNote}</Text>
          </Text>
          <Text style={styles.subInstruction}>
            Then play it one octave {directionText} {directionEmoji}
          </Text>

          <TouchableOpacity
            accessibilityLabel={isPlaying ? "Playing audio" : "Play and record"}
            accessibilityRole="button"
            style={[styles.playButton, isPlaying && styles.playButtonDisabled]}
            onPress={playReference}
            disabled={isPlaying}
          >
            <Text style={styles.playButtonEmoji}>
              {isPlaying ? "🔊" : "▶️"}
            </Text>
            <Text style={styles.playButtonText}>
              {isPlaying ? "Playing..." : "Play & Record"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Play phase - listening for user
  if (phase === "play") {
    const directionText =
      currentExercise.direction === "up" ? "HIGHER" : "LOWER";

    return (
      <View style={styles.container}>
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
          <Text style={styles.instruction}>
            Play {firstNote} one octave {directionText}
          </Text>

          <View style={styles.listeningIndicator}>
            <CircularVolumeIndicator
              volume={currentVolume || 0}
              isListening={isListening}
              size={120}
            />
            <Text style={styles.listeningText}>
              {isListening ? "Listening..." : "Starting..."}
            </Text>
          </View>

          {lastPlayedMidi && (
            <Text style={styles.detectedNote}>
              Heard: MIDI {lastPlayedMidi}
            </Text>
          )}

          <TouchableOpacity
            accessibilityLabel="Skip, I can't find it"
            accessibilityRole="button"
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>I can't find it</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Feedback phase
  if (phase === "feedback") {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          {wasCorrect ? (
            <>
              <Text style={styles.emoji}>✅</Text>
              <Text style={styles.feedbackTitle}>Perfect octave!</Text>
              <Text style={styles.feedbackText}>
                That's {firstNote} one octave {currentExercise.direction}!
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.emoji}>🎯</Text>
              <Text style={styles.feedbackTitle}>Keep trying!</Text>
              <Text style={styles.feedbackText}>
                An octave is the same note at a different height.{"\n"}
                {currentExercise.direction === "up"
                  ? "Go 12 half-steps higher"
                  : "Go 12 half-steps lower"}
              </Text>
            </>
          )}
        </View>

        <TouchableOpacity
          accessibilityLabel={wasCorrect ? "Next" : "Try again"}
          accessibilityRole="button"
          style={styles.primaryButton}
          onPress={handleNext}
        >
          <Text style={styles.primaryButtonText}>
            {wasCorrect ? "Next →" : "Try Again →"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

// PropTypes validation
OctavePlayExercise.propTypes = exercisePropTypes;
OctavePlayExercise.defaultProps = exerciseDefaultProps;

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
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#a0a0c0",
    marginBottom: 32,
  },
  card: {
    backgroundColor: "#252545",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    width: "100%",
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
  instruction: {
    fontSize: 24,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 8,
  },
  subInstruction: {
    fontSize: 18,
    color: "#a0a0c0",
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
  },
  playButtonDisabled: {
    backgroundColor: "#4fc3f780",
  },
  playButtonEmoji: {
    fontSize: 28,
  },
  playButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  listeningIndicator: {
    alignItems: "center",
    marginBottom: 32,
  },
  listeningText: {
    fontSize: 16,
    color: "#808090",
    marginTop: 16,
  },
  detectedNote: {
    fontSize: 14,
    color: "#606080",
    marginBottom: 20,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    fontSize: 14,
    color: "#808090",
    textDecorationLine: "underline",
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  feedbackTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },
  feedbackText: {
    fontSize: 17,
    color: "#a0a0c0",
    textAlign: "center",
    lineHeight: 26,
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
});
