/**
 * TapAlongExercise - "Feel the Pulse" tap along drill
 *
 * Plays a steady beat and asks user to tap in time.
 * Measures timing accuracy and tracks streak of on-time taps.
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
import {
  createAudioContext,
  createClickSound,
  TIMING_TOLERANCES,
} from "./shared";
import type { ExerciseProps } from "./shared";

// Tolerance in ms for "on time" taps
const TIMING_TOLERANCE_MS = TIMING_TOLERANCES.GOOD;
// "Good" timing is within this range
const GOOD_TOLERANCE_MS = TIMING_TOLERANCES.PERFECT;

export default function TapAlongExercise({
  config = {},
  mastery,
  onComplete,
  onProgress,
}: ExerciseProps) {
  // Config defaults - match database config keys
  const bpm = config?.bpm || 60;
  const masteryStreak = mastery?.correct_streak || 8;
  const prepBeats = config?.count_in_beats || config?.prep_beats || 4;
  const timingToleranceMs = config?.timing_tolerance_ms || TIMING_TOLERANCE_MS;

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalTaps, setTotalTaps] = useState(0);
  const [onTimeTaps, setOnTimeTaps] = useState(0);
  const [lastTapFeedback, setLastTapFeedback] = useState(null); // 'perfect' | 'good' | 'early' | 'late' | null
  const [isPrepPhase, setIsPrepPhase] = useState(true);
  const [prepCount, setPrepCount] = useState(prepBeats);

  // Animation for tap feedback
  const [pulseAnim] = useState(new Animated.Value(1));
  const [feedbackOpacity] = useState(new Animated.Value(0));

  // Refs
  const audioContextRef = useRef(null);
  const beatIntervalRef = useRef(null);
  const lastBeatTimeRef = useRef(0);
  const tappedThisBeatRef = useRef(false);
  const isInMeasuredPhaseRef = useRef(false); // Track if we're past prep phase
  const unmountedRef = useRef(false);

  // Beat interval in ms
  const beatIntervalMs = (60 / bpm) * 1000;

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = createAudioContext();

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
    createClickSound(audioContextRef.current, freq, 0.05, 0.6);
  }, []);

  // Pulse animation on beat
  const animatePulse = useCallback(() => {
    pulseAnim.setValue(1.2);
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [pulseAnim]);

  // Start the metronome
  const startMetronome = useCallback(() => {
    if (isPlaying || unmountedRef.current) return;

    setIsPlaying(true);
    setIsPrepPhase(true);
    setPrepCount(prepBeats);
    setCurrentBeat(0);
    lastBeatTimeRef.current = Date.now();
    tappedThisBeatRef.current = false;
    isInMeasuredPhaseRef.current = false;

    // Play first beat
    playBeat(true);
    animatePulse();

    // Schedule beats
    beatIntervalRef.current = setInterval(() => {
      if (unmountedRef.current) {
        clearInterval(beatIntervalRef.current);
        return;
      }
      const now = Date.now();

      // Check if user missed the previous beat (only after prep phase)
      if (isInMeasuredPhaseRef.current && !tappedThisBeatRef.current) {
        // Missed beat - reset streak
        setStreak(0);
        setLastTapFeedback("missed");
        // Flash feedback
        feedbackOpacity.setValue(1);
        Animated.timing(feedbackOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start();
        onProgress?.({
          streak: 0,
          masteryRequired: masteryStreak,
          totalAttempts: totalTaps,
        });
      }

      lastBeatTimeRef.current = now;
      tappedThisBeatRef.current = false;

      setCurrentBeat((prev) => {
        const next = prev + 1;

        // Check if still in prep phase
        if (next < prepBeats) {
          setPrepCount(prepBeats - next);
          playBeat(next === 0);
        } else {
          if (next === prepBeats) {
            setIsPrepPhase(false);
            isInMeasuredPhaseRef.current = true;
          }
          // Accent every 4 beats
          playBeat((next - prepBeats) % 4 === 0);
        }

        animatePulse();
        return next;
      });
    }, beatIntervalMs);
  }, [
    isPlaying,
    playBeat,
    animatePulse,
    beatIntervalMs,
    prepBeats,
    masteryStreak,
    totalTaps,
    onProgress,
    feedbackOpacity,
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
    if (tappedThisBeatRef.current) return; // Only one tap per beat

    tappedThisBeatRef.current = true;
    const now = Date.now();
    const timeSinceLastBeat = now - lastBeatTimeRef.current;
    const timeToNextBeat = beatIntervalMs - timeSinceLastBeat;

    // Calculate deviation from nearest beat
    let deviation;
    let feedback;

    if (timeSinceLastBeat <= beatIntervalMs / 2) {
      // Closer to the last beat
      deviation = timeSinceLastBeat;
    } else {
      // Closer to the next beat (early)
      deviation = -timeToNextBeat;
    }

    const absDeviation = Math.abs(deviation);

    // Determine feedback - use configured tolerance
    const goodTolerance = timingToleranceMs / 2;
    if (absDeviation <= goodTolerance) {
      feedback = "perfect";
    } else if (absDeviation <= timingToleranceMs) {
      feedback = deviation > 0 ? "late" : "early";
    } else {
      feedback = deviation > 0 ? "late" : "early";
    }

    const isOnTime = absDeviation <= timingToleranceMs;

    setLastTapFeedback(feedback);
    setTotalTaps((t) => t + 1);

    // Show feedback animation
    feedbackOpacity.setValue(1);
    Animated.timing(feedbackOpacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();

    if (isOnTime) {
      setOnTimeTaps((c) => c + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);

      // Check for mastery
      if (newStreak >= masteryStreak) {
        stopMetronome();
        setTimeout(() => {
          onComplete?.({
            success: true,
            streak: newStreak,
            totalAttempts: totalTaps + 1,
            correctCount: onTimeTaps + 1,
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
      setStreak(0);
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
    onTimeTaps,
    beatIntervalMs,
    timingToleranceMs,
    feedbackOpacity,
    onComplete,
    onProgress,
    stopMetronome,
  ]);

  // Feedback colors
  const getFeedbackColor = () => {
    switch (lastTapFeedback) {
      case "perfect":
        return "#4CAF50";
      case "good":
        return "#8BC34A";
      case "early":
        return "#FF9800";
      case "late":
        return "#FF5722";
      case "missed":
        return "#f44336";
      default:
        return "#888";
    }
  };

  const getFeedbackText = () => {
    switch (lastTapFeedback) {
      case "perfect":
        return "Perfect!";
      case "good":
        return "Good!";
      case "early":
        return "A bit early";
      case "late":
        return "A bit late";
      case "missed":
        return "Missed!";
      default:
        return "";
    }
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

      {/* BPM indicator */}
      <Text style={styles.bpmText}>{bpm} BPM</Text>

      {/* Main tap area */}
      <TouchableOpacity
        style={styles.tapArea}
        onPress={handleTap}
        activeOpacity={0.8}
        disabled={!isPlaying || isPrepPhase}
        accessibilityLabel={
          isPrepPhase ? "Get ready for tapping" : "Tap on the beat"
        }
        accessibilityRole="button"
      >
        <Animated.View
          style={[
            styles.pulseCircle,
            {
              transform: [{ scale: pulseAnim }],
              backgroundColor: isPrepPhase ? "#444" : "#2196F3",
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
              <Text style={styles.tapIcon}>👆</Text>
              <Text style={styles.tapText}>TAP</Text>
              <Text style={styles.tapHint}>on the beat</Text>
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

      {/* Instructions */}
      {!isPrepPhase && (
        <Text style={styles.instruction}>
          Tap in time with the beat to build your streak
        </Text>
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
    marginBottom: 16,
  },
  bpmText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 24,
  },
  tapArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  pulseCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      web: { boxShadow: "0px 4px 8px rgba(33, 150, 243, 0.3)" },
      default: {
        elevation: 8,
        shadowColor: "#2196F3",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  prepText: {
    fontSize: 18,
    color: "#aaa",
    marginBottom: 8,
  },
  prepCountText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
  },
  tapIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  tapText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  tapHint: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
  feedback: {
    position: "absolute",
    top: "50%",
    marginTop: -150,
  },
  feedbackText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  instruction: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 24,
    paddingHorizontal: 20,
  },
});
