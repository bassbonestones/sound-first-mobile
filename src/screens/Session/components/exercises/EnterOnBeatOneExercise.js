/**
 * EnterOnBeatOneExercise - "Feel Beat 1" drill
 *
 * Plays a steady beat with accent on beat 1.
 * User must tap specifically on beat 1 (the downbeat).
 * Tapping on other beats or missing beat 1 resets the streak.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";

// Import AudioContext
let NativeAudioContext = null;
if (Platform.OS !== "web") {
  try {
    NativeAudioContext = require("react-native-audio-api").AudioContext;
  } catch (e) {
    console.warn("react-native-audio-api not available");
  }
}

// Default timing tolerance
const DEFAULT_TOLERANCE_MS = 150;

/**
 * Create a click sound using Web Audio
 */
function createClickSound(
  audioContext,
  frequency = 1000,
  duration = 0.05,
  volume = 0.5,
) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + duration,
  );

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

export default function EnterOnBeatOneExercise({
  config,
  mastery,
  onComplete,
  onProgress,
}) {
  // Config defaults - match database config keys
  const bpm = config?.bpm || 60;
  const beatsPerMeasure = config?.beats_per_measure || 4;
  const masteryStreak = mastery?.correct_streak || 8;
  const prepBeats = config?.count_in_beats || 4;
  const timingToleranceMs = config?.timing_tolerance_ms || DEFAULT_TOLERANCE_MS;
  const accentBeatOne = config?.accent_beat_one !== false; // default true

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0); // 0-indexed within measure
  const [currentMeasure, setCurrentMeasure] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalTaps, setTotalTaps] = useState(0);
  const [lastTapFeedback, setLastTapFeedback] = useState(null);
  const [isPrepPhase, setIsPrepPhase] = useState(true);
  const [prepCount, setPrepCount] = useState(prepBeats);

  // Animation
  const [pulseAnim] = useState(new Animated.Value(1));
  const [feedbackOpacity] = useState(new Animated.Value(0));
  const [beatIndicatorAnim] = useState(new Animated.Value(0));

  // Refs
  const audioContextRef = useRef(null);
  const beatIntervalRef = useRef(null);
  const lastBeatTimeRef = useRef(0);
  const currentBeatRef = useRef(0); // Track beat within measure (1-indexed for logic)
  const tappedThisMeasureRef = useRef(false);
  const isInMeasuredPhaseRef = useRef(false);
  const missedBeatOneRef = useRef(false);
  const unmountedRef = useRef(false);

  // Beat interval in ms
  const beatIntervalMs = (60 / bpm) * 1000;

  // Initialize audio context
  useEffect(() => {
    if (Platform.OS === "web") {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
    } else if (NativeAudioContext) {
      audioContextRef.current = new NativeAudioContext();
    }

    return () => {
      unmountedRef.current = true;
      if (beatIntervalRef.current) {
        clearInterval(beatIntervalRef.current);
        beatIntervalRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  // Play a beat click
  const playBeat = useCallback((isAccent = false) => {
    if (!audioContextRef.current) return;
    const freq = isAccent ? 1200 : 800;
    const vol = isAccent ? 0.7 : 0.5;
    createClickSound(audioContextRef.current, freq, 0.05, vol);
  }, []);

  // Pulse animation on beat
  const animatePulse = useCallback(
    (isBeatOne = false) => {
      const scale = isBeatOne ? 1.3 : 1.15;
      pulseAnim.setValue(scale);
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Beat indicator animation
      if (isBeatOne) {
        beatIndicatorAnim.setValue(1);
        Animated.timing(beatIndicatorAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    },
    [pulseAnim, beatIndicatorAnim],
  );

  // Show feedback animation
  const showFeedback = useCallback(
    (feedback) => {
      setLastTapFeedback(feedback);
      feedbackOpacity.setValue(1);
      Animated.timing(feedbackOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start();
    },
    [feedbackOpacity],
  );

  // Start the metronome
  const startMetronome = useCallback(() => {
    if (isPlaying || unmountedRef.current) return;

    setIsPlaying(true);
    setIsPrepPhase(true);
    setPrepCount(prepBeats);
    setCurrentBeat(0);
    setCurrentMeasure(0);
    currentBeatRef.current = 1;
    lastBeatTimeRef.current = Date.now();
    tappedThisMeasureRef.current = false;
    isInMeasuredPhaseRef.current = false;
    missedBeatOneRef.current = false;

    // Play first beat (accent)
    playBeat(true);
    animatePulse(true);

    let prepBeatCount = 0;

    // Schedule beats
    beatIntervalRef.current = setInterval(() => {
      if (unmountedRef.current) {
        clearInterval(beatIntervalRef.current);
        return;
      }
      const now = Date.now();

      // Check if we're past prep phase and starting a new measure
      if (isInMeasuredPhaseRef.current && currentBeatRef.current === 1) {
        // Check if user missed beat 1 of the previous measure
        if (missedBeatOneRef.current && !tappedThisMeasureRef.current) {
          // They didn't tap on beat 1 - reset streak
          setStreak(0);
          showFeedback("missed");
          onProgress?.({
            streak: 0,
            masteryRequired: masteryStreak,
            totalAttempts: totalTaps,
          });
        }
        // Reset for new measure
        tappedThisMeasureRef.current = false;
        missedBeatOneRef.current = false;
      }

      // Advance beat
      prepBeatCount++;

      if (prepBeatCount < prepBeats) {
        // Still in prep phase
        setPrepCount(prepBeats - prepBeatCount);
        const isBeatOne = prepBeatCount % beatsPerMeasure === 0;
        playBeat(isBeatOne && accentBeatOne);
        animatePulse(isBeatOne);
        currentBeatRef.current = (prepBeatCount % beatsPerMeasure) + 1;
      } else {
        // Measured phase
        if (prepBeatCount === prepBeats) {
          setIsPrepPhase(false);
          isInMeasuredPhaseRef.current = true;
          currentBeatRef.current = 1;
        }

        const beatInMeasure =
          ((prepBeatCount - prepBeats) % beatsPerMeasure) + 1;
        currentBeatRef.current = beatInMeasure;

        setCurrentBeat(beatInMeasure - 1);
        if (beatInMeasure === 1) {
          setCurrentMeasure((m) => m + 1);
          // Mark that beat 1 has passed - user needs to tap before next beat
          missedBeatOneRef.current = true;
        }

        const isBeatOne = beatInMeasure === 1;
        playBeat(isBeatOne && accentBeatOne);
        animatePulse(isBeatOne);
      }

      lastBeatTimeRef.current = now;
    }, beatIntervalMs);
  }, [
    isPlaying,
    playBeat,
    animatePulse,
    beatIntervalMs,
    prepBeats,
    beatsPerMeasure,
    accentBeatOne,
    masteryStreak,
    totalTaps,
    onProgress,
    showFeedback,
  ]);

  // Stop the metronome
  const stopMetronome = useCallback(() => {
    if (beatIntervalRef.current) {
      clearInterval(beatIntervalRef.current);
      beatIntervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Auto-start on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startMetronome();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Handle user tap
  const handleTap = useCallback(() => {
    if (!isPlaying || isPrepPhase) return;

    const now = Date.now();
    const timeSinceLastBeat = now - lastBeatTimeRef.current;
    const currentBeatInMeasure = currentBeatRef.current;

    setTotalTaps((t) => t + 1);

    // Check if tap is close to beat 1
    // Beat 1 timing window: within tolerance of beat 1, or anticipating next beat 1
    const isNearBeatOne =
      currentBeatInMeasure === 1 && timeSinceLastBeat <= timingToleranceMs;
    const isAnticipatoryBeatOne =
      currentBeatInMeasure === beatsPerMeasure &&
      beatIntervalMs - timeSinceLastBeat <= timingToleranceMs;

    if (isNearBeatOne || isAnticipatoryBeatOne) {
      // Correct! Tapped on beat 1
      if (tappedThisMeasureRef.current) {
        // Already tapped this measure - ignore
        return;
      }

      tappedThisMeasureRef.current = true;
      missedBeatOneRef.current = false;

      const newStreak = streak + 1;
      setStreak(newStreak);

      // Determine precision
      const deviation = isNearBeatOne
        ? timeSinceLastBeat
        : beatIntervalMs - timeSinceLastBeat;
      if (deviation <= timingToleranceMs / 2) {
        showFeedback("perfect");
      } else {
        showFeedback("good");
      }

      // Check for mastery
      if (newStreak >= masteryStreak) {
        stopMetronome();
        setTimeout(() => {
          onComplete?.({
            success: true,
            streak: newStreak,
            totalAttempts: totalTaps + 1,
            correctCount: newStreak,
          });
        }, 500);
        return;
      }

      onProgress?.({
        streak: newStreak,
        masteryRequired: masteryStreak,
        totalAttempts: totalTaps + 1,
      });
    } else {
      // Wrong beat - reset streak
      setStreak(0);
      showFeedback("wrong_beat");
      onProgress?.({
        streak: 0,
        masteryRequired: masteryStreak,
        totalAttempts: totalTaps + 1,
      });
    }
  }, [
    isPlaying,
    isPrepPhase,
    streak,
    masteryStreak,
    totalTaps,
    beatIntervalMs,
    beatsPerMeasure,
    timingToleranceMs,
    onComplete,
    onProgress,
    stopMetronome,
    showFeedback,
  ]);

  // Feedback colors and text
  const getFeedbackColor = () => {
    switch (lastTapFeedback) {
      case "perfect":
        return "#4CAF50";
      case "good":
        return "#8BC34A";
      case "wrong_beat":
        return "#FF9800";
      case "missed":
        return "#f44336";
      default:
        return "#888";
    }
  };

  const getFeedbackText = () => {
    switch (lastTapFeedback) {
      case "perfect":
        return "Perfect! 🎯";
      case "good":
        return "Good!";
      case "wrong_beat":
        return "Not beat 1!";
      case "missed":
        return "Missed beat 1!";
      default:
        return "";
    }
  };

  // Render beat indicators
  const renderBeatIndicators = () => {
    const indicators = [];
    for (let i = 0; i < beatsPerMeasure; i++) {
      const isCurrent = !isPrepPhase && currentBeat === i;
      const isBeatOne = i === 0;
      indicators.push(
        <View
          key={i}
          style={[
            styles.beatDot,
            isCurrent && styles.beatDotActive,
            isBeatOne && styles.beatDotOne,
            isCurrent && isBeatOne && styles.beatDotOneActive,
          ]}
        >
          <Text
            style={[styles.beatNumber, isCurrent && styles.beatNumberActive]}
          >
            {i + 1}
          </Text>
        </View>,
      );
    }
    return indicators;
  };

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${(streak / masteryStreak) * 100}%` },
          ]}
        />
      </View>
      <Text style={styles.streakText}>
        {streak} / {masteryStreak} in a row
      </Text>

      {/* BPM and time signature */}
      <Text style={styles.bpmText}>
        {bpm} BPM • {beatsPerMeasure}/4
      </Text>

      {/* Beat indicators */}
      <View style={styles.beatIndicators}>{renderBeatIndicators()}</View>

      {/* Instruction */}
      <Text style={styles.instruction}>
        {isPrepPhase ? "Listen for beat 1..." : "Tap only on beat 1!"}
      </Text>

      {/* Main tap area */}
      <TouchableOpacity
        style={styles.tapArea}
        onPress={handleTap}
        activeOpacity={0.8}
        disabled={!isPlaying || isPrepPhase}
      >
        <Animated.View
          style={[
            styles.pulseCircle,
            {
              transform: [{ scale: pulseAnim }],
              backgroundColor: isPrepPhase ? "#444" : "#E91E63",
            },
          ]}
        >
          {isPrepPhase ? (
            <>
              <Text style={styles.prepText}>Get Ready...</Text>
              <Text style={styles.prepCountText}>{prepCount}</Text>
            </>
          ) : (
            <>
              <Text style={styles.tapNumber}>1</Text>
              <Text style={styles.tapText}>TAP ON ONE</Text>
            </>
          )}
        </Animated.View>
      </TouchableOpacity>

      {/* Feedback overlay */}
      <Animated.View style={[styles.feedback, { opacity: feedbackOpacity }]}>
        <Text style={[styles.feedbackText, { color: getFeedbackColor() }]}>
          {getFeedbackText()}
        </Text>
      </Animated.View>

      {/* Hint */}
      {!isPrepPhase && (
        <Text style={styles.hint}>Beat 1 has a stronger accent - feel it!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 4,
  },
  streakText: {
    fontSize: 14,
    color: "#888",
    marginBottom: 12,
  },
  bpmText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  beatIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
    gap: 12,
  },
  beatDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  beatDotActive: {
    backgroundColor: "#555",
    transform: [{ scale: 1.1 }],
  },
  beatDotOne: {
    borderWidth: 2,
    borderColor: "#E91E63",
  },
  beatDotOneActive: {
    backgroundColor: "#E91E63",
  },
  beatNumber: {
    fontSize: 16,
    color: "#888",
    fontWeight: "600",
  },
  beatNumberActive: {
    color: "#fff",
  },
  instruction: {
    fontSize: 18,
    color: "#aaa",
    marginBottom: 20,
    fontWeight: "500",
  },
  tapArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  pulseCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#E91E63",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  prepText: {
    fontSize: 16,
    color: "#aaa",
    marginBottom: 8,
  },
  prepCountText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
  },
  tapNumber: {
    fontSize: 64,
    fontWeight: "bold",
    color: "#fff",
  },
  tapText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  feedback: {
    position: "absolute",
    top: "45%",
    marginTop: -120,
  },
  feedbackText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  hint: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
});
