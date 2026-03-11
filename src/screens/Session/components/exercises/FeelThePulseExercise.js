/**
 * FeelThePulseExercise - "Internal Pulse" drill
 *
 * User hears a steady beat, then the clicks stop.
 * They must continue tapping to stay on the pulse.
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
  exercisePropTypes,
  exerciseDefaultProps,
} from "./shared";

const TIMING_TOLERANCE_MS = TIMING_TOLERANCES.ACCEPTABLE; // More forgiving - 18% of beat at 72bpm
const PERFECT_TOLERANCE_MS = TIMING_TOLERANCES.PERFECT;

const PHASE_INTRO = "intro";
const PHASE_LISTENING = "listening";
const PHASE_SILENT = "silent";
const PHASE_REVEAL = "reveal";

export default function FeelThePulseExercise({
  config,
  mastery,
  onComplete,
  onProgress,
}) {
  const bpm = config?.bpm || 72;
  const listeningBeats = config?.listening_beats || 8;
  const silentBeats = config?.silent_beats || 4;
  const masteryRounds = mastery?.correct_streak || 3;
  const timingToleranceMs = config?.timing_tolerance_ms || TIMING_TOLERANCE_MS;

  const [phase, setPhase] = useState(PHASE_INTRO);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [lastTapFeedback, setLastTapFeedback] = useState(null);
  const [roundResult, setRoundResult] = useState(null);

  const [pulseAnim] = useState(new Animated.Value(1));
  const [feedbackOpacity] = useState(new Animated.Value(0));

  const audioContextRef = useRef(null);
  const beatIntervalRef = useRef(null);
  const roundStartTimeRef = useRef(0); // When the round started
  const tapsRef = useRef([]); // Record all taps with timestamps
  const unmountedRef = useRef(false);

  const beatIntervalMs = (60 / bpm) * 1000;

  useEffect(() => {
    audioContextRef.current = createAudioContext();
    return () => {
      unmountedRef.current = true;
      if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const playBeat = useCallback((isAccent = false) => {
    if (!audioContextRef.current) return;
    createClickSound(audioContextRef.current, isAccent ? 1200 : 800, 0.05, 0.6);
  }, []);

  const animatePulse = useCallback(() => {
    pulseAnim.setValue(1.15);
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [pulseAnim]);

  // Calculate deviation from nearest expected beat
  const getDeviationFromBeat = useCallback(
    (tapTime) => {
      const elapsed = tapTime - roundStartTimeRef.current;
      const nearestBeatIndex = Math.round(elapsed / beatIntervalMs);
      const expectedBeatTime = nearestBeatIndex * beatIntervalMs;
      return Math.abs(elapsed - expectedBeatTime);
    },
    [beatIntervalMs],
  );

  const evaluateRound = useCallback(() => {
    const taps = tapsRef.current;

    // Calculate expected beat times during silent phase
    const silentStartBeat = listeningBeats;
    const expectedBeatTimes = [];
    for (let i = 0; i < silentBeats; i++) {
      expectedBeatTimes.push((silentStartBeat + i) * beatIntervalMs);
    }

    // For each expected beat, find the closest tap
    let goodTaps = 0;
    for (const expectedTime of expectedBeatTimes) {
      const closestTap = taps.reduce((best, tap) => {
        const tapElapsed = tap - roundStartTimeRef.current;
        const dev = Math.abs(tapElapsed - expectedTime);
        if (best === null || dev < best.deviation) {
          return { deviation: dev, time: tapElapsed };
        }
        return best;
      }, null);

      if (closestTap && closestTap.deviation <= timingToleranceMs) {
        goodTaps++;
      }
    }

    const requiredTaps = Math.ceil(silentBeats * 0.5); // Need half the beats
    return goodTaps >= requiredTaps;
  }, [listeningBeats, silentBeats, beatIntervalMs, timingToleranceMs]);

  const startRound = useCallback(() => {
    if (unmountedRef.current) return;
    if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);

    setPhase(PHASE_LISTENING);
    setCurrentBeat(1);
    tapsRef.current = [];
    setLastTapFeedback(null);
    setRoundResult(null);
    roundStartTimeRef.current = Date.now();

    playBeat(true);
    animatePulse();

    let beatCount = 0;
    const totalBeats = listeningBeats + silentBeats;

    beatIntervalRef.current = setInterval(() => {
      if (unmountedRef.current) {
        clearInterval(beatIntervalRef.current);
        return;
      }
      beatCount++;

      if (beatCount < listeningBeats) {
        // Still listening
        setCurrentBeat(beatCount + 1);
        playBeat((beatCount + 1) % 4 === 1);
        animatePulse();
      } else if (beatCount === listeningBeats) {
        // Transition to silent
        setPhase(PHASE_SILENT);
        setCurrentBeat(1);
        animatePulse();
      } else if (beatCount < totalBeats) {
        // Silent tapping phase
        setCurrentBeat(beatCount - listeningBeats + 1);
        animatePulse();
      } else {
        // Round complete - evaluate
        clearInterval(beatIntervalRef.current);
        const success = evaluateRound();

        setRoundResult(success ? "success" : "fail");
        setPhase(PHASE_REVEAL);

        if (success) {
          const newRounds = roundsCompleted + 1;
          setRoundsCompleted(newRounds);
          if (newRounds >= masteryRounds) {
            setTimeout(
              () => onComplete?.({ success: true, roundsCompleted: newRounds }),
              1500,
            );
          } else {
            onProgress?.({
              roundsCompleted: newRounds,
              masteryRequired: masteryRounds,
            });
            setTimeout(() => {
              if (!unmountedRef.current) startRound();
            }, 2000);
          }
        } else {
          onProgress?.({ roundsCompleted, masteryRequired: masteryRounds });
          setTimeout(() => {
            if (!unmountedRef.current) startRound();
          }, 2500);
        }
      }
    }, beatIntervalMs);
  }, [
    listeningBeats,
    silentBeats,
    beatIntervalMs,
    masteryRounds,
    roundsCompleted,
    playBeat,
    animatePulse,
    evaluateRound,
    onComplete,
    onProgress,
  ]);

  const handleTap = useCallback(() => {
    if (phase !== PHASE_SILENT) return;

    const tapTime = Date.now();
    tapsRef.current.push(tapTime);

    const deviation = getDeviationFromBeat(tapTime);

    let feedback;
    if (deviation <= PERFECT_TOLERANCE_MS) feedback = "perfect";
    else if (deviation <= timingToleranceMs) feedback = "good";
    else feedback = "off";

    setLastTapFeedback(feedback);
    feedbackOpacity.setValue(1);
    Animated.timing(feedbackOpacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [phase, getDeviationFromBeat, timingToleranceMs, feedbackOpacity]);

  const getFeedbackColor = () => {
    switch (lastTapFeedback) {
      case "perfect":
        return "#4CAF50";
      case "good":
        return "#8BC34A";
      case "off":
        return "#FF9800";
      default:
        return "#888";
    }
  };

  // INTRO SCREEN
  if (phase === PHASE_INTRO) {
    return (
      <View style={styles.container}>
        <View style={styles.introContainer}>
          <Text style={styles.introIcon}>🎵</Text>
          <Text style={styles.introTitle}>Internal Pulse</Text>

          <View style={styles.instructionBox}>
            <Text style={styles.simpleInstruction}>
              Listen to {listeningBeats} clicks to internalize the tempo.
            </Text>
            <Text style={styles.simpleInstruction}>
              Then tap {silentBeats} times to continue the beat without the
              metronome.
            </Text>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startRound}>
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>

          <Text style={styles.bpmHint}>{bpm} BPM</Text>
        </View>
      </View>
    );
  }

  // EXERCISE SCREEN
  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${(roundsCompleted / masteryRounds) * 100}%` },
          ]}
        />
      </View>
      <Text style={styles.streakText}>
        Round {roundsCompleted + 1} / {masteryRounds}
      </Text>

      <View
        style={[
          styles.phaseBanner,
          phase === PHASE_SILENT && styles.phaseBannerSilent,
          phase === PHASE_REVEAL &&
            (roundResult === "success"
              ? styles.phaseBannerSuccess
              : styles.phaseBannerFail),
        ]}
      >
        <Text style={styles.phaseBannerText}>
          {phase === PHASE_LISTENING &&
            `Listen... ${currentBeat} / ${listeningBeats}`}
          {phase === PHASE_SILENT && "TAP!"}
          {phase === PHASE_REVEAL &&
            (roundResult === "success" ? "Nice!" : "Try again...")}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.tapArea}
        onPress={handleTap}
        activeOpacity={0.8}
        disabled={phase !== PHASE_SILENT}
      >
        <Animated.View
          style={[
            styles.pulseCircle,
            { transform: [{ scale: pulseAnim }] },
            phase === PHASE_LISTENING && styles.circleListening,
            phase === PHASE_SILENT && styles.circleSilent,
            phase === PHASE_REVEAL &&
              (roundResult === "success"
                ? styles.circleSuccess
                : styles.circleFail),
          ]}
        >
          {phase === PHASE_LISTENING && (
            <>
              <Text style={styles.circleIcon}>👂</Text>
              <Text style={styles.circleMainText}>{currentBeat}</Text>
              <Text style={styles.circleSubText}>of {listeningBeats}</Text>
            </>
          )}
          {phase === PHASE_SILENT && (
            <>
              <Text style={styles.circleIcon}>👆</Text>
              <Text style={styles.circleMainText}>{currentBeat}</Text>
              <Text style={styles.circleSubText}>of {silentBeats}</Text>
            </>
          )}
          {phase === PHASE_REVEAL && (
            <>
              <Text style={styles.circleIcon}>
                {roundResult === "success" ? "🎉" : "💪"}
              </Text>
              <Text style={styles.circleMainText}>
                {roundResult === "success" ? "Nice!" : "Close!"}
              </Text>
            </>
          )}
        </Animated.View>
      </TouchableOpacity>

      {phase === PHASE_SILENT && (
        <Animated.View style={[styles.feedback, { opacity: feedbackOpacity }]}>
          <Text style={[styles.feedbackText, { color: getFeedbackColor() }]}>
            {lastTapFeedback === "perfect"
              ? "Perfect!"
              : lastTapFeedback === "good"
                ? "Good!"
                : lastTapFeedback === "off"
                  ? "Off"
                  : ""}
          </Text>
        </Animated.View>
      )}

      <Text style={styles.bottomHint}>
        {phase === PHASE_SILENT ? "Tap to continue the beat!" : ""}
      </Text>
    </View>
  );
}

// PropTypes validation
FeelThePulseExercise.propTypes = exercisePropTypes;
FeelThePulseExercise.defaultProps = exerciseDefaultProps;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },

  // Intro styles
  introContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  introIcon: { fontSize: 64, marginBottom: 16 },
  introTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 24,
  },
  instructionBox: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    marginBottom: 32,
  },
  simpleInstruction: {
    fontSize: 18,
    color: "#fff",
    lineHeight: 28,
    marginBottom: 12,
    textAlign: "center",
  },
  startButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
  },
  startButtonText: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  bpmHint: { fontSize: 14, color: "#666", marginTop: 16 },

  // Progress
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#4CAF50", borderRadius: 4 },
  streakText: { fontSize: 14, color: "#888", marginBottom: 12 },

  // Phase banner
  phaseBanner: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    width: "100%",
  },
  phaseBannerSilent: { backgroundColor: "#9C27B0" },
  phaseBannerSuccess: { backgroundColor: "#4CAF50" },
  phaseBannerFail: { backgroundColor: "#FF5722" },
  phaseBannerText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },

  // Tap area
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
      web: { boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)" },
      default: {
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  circleListening: { backgroundColor: "#2196F3" },
  circleSilent: { backgroundColor: "#9C27B0" },
  circleSuccess: { backgroundColor: "#4CAF50" },
  circleFail: { backgroundColor: "#FF5722" },
  circleIcon: { fontSize: 40, marginBottom: 8 },
  circleMainText: { fontSize: 48, fontWeight: "bold", color: "#fff" },
  circleSubText: { fontSize: 16, color: "rgba(255,255,255,0.8)" },

  // Feedback
  feedback: { position: "absolute", top: "50%", alignSelf: "center" },
  feedbackText: { fontSize: 28, fontWeight: "bold" },
  bottomHint: { fontSize: 14, color: "#888", marginTop: 16, minHeight: 20 },
});
