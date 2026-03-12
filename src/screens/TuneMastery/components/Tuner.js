/**
 * Tuner - Pitch detection display with needle or text mode
 *
 * Uses usePitchDetection hook for real-time pitch detection.
 * Displays current pitch with visual feedback for tuning accuracy.
 */
import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { usePitchDetection } from "../../../hooks/usePitchDetection";
import { frequencyToNote, getCentsDeviation } from "../../../constants/notes";

// A4 frequency for calculations
const A4_FREQUENCY = 440;

export default function Tuner({ mode = "needle", temperament = "equal" }) {
  const [isActive, setIsActive] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);
  const [cents, setCents] = useState(0);
  const [frequency, setFrequency] = useState(null);

  const handlePitchDetected = useCallback((pitch) => {
    if (pitch && pitch.frequency) {
      setFrequency(pitch.frequency);
      const note = frequencyToNote(pitch.frequency);
      setCurrentNote(note);
      const deviation = getCentsDeviation(pitch.frequency);
      setCents(Math.round(deviation));
    } else {
      setCurrentNote(null);
      setCents(0);
      setFrequency(null);
    }
  }, []);

  const {
    isListening,
    startListening,
    stopListening,
    error,
    permissionGranted,
  } = usePitchDetection({
    enabled: isActive,
    onPitchDetected: handlePitchDetected,
    onRealtimePitch: handlePitchDetected,
    volumeThreshold: 0.01,
  });

  const handleToggle = useCallback(async () => {
    if (isActive) {
      stopListening();
      setIsActive(false);
      setCurrentNote(null);
      setCents(0);
      setFrequency(null);
    } else {
      setIsActive(true);
      await startListening();
    }
  }, [isActive, startListening, stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        stopListening();
      }
    };
  }, [isListening, stopListening]);

  // Get tuning quality color
  const getTuneColor = () => {
    const absCents = Math.abs(cents);
    if (absCents <= 5) return "#4CAF50"; // In tune
    if (absCents <= 10) return "#8BC34A";
    if (absCents <= 20) return "#FFC107";
    if (absCents <= 35) return "#FF9800";
    return "#F44336"; // Very out of tune
  };

  // Calculate needle rotation (-50 to +50 cents = -90 to +90 degrees)
  const getNeedleRotation = () => {
    const clampedCents = Math.max(-50, Math.min(50, cents));
    return (clampedCents / 50) * 90;
  };

  return (
    <View style={styles.container}>
      {/* Toggle Button */}
      <TouchableOpacity
        style={[styles.toggleButton, isActive && styles.toggleButtonActive]}
        onPress={handleToggle}
        accessibilityLabel={isActive ? "Stop tuner" : "Start tuner"}
        accessibilityRole="button"
      >
        <Text style={styles.toggleButtonIcon}>{isActive ? "🔴" : "🎤"}</Text>
        <Text style={styles.toggleButtonText}>
          {isActive ? "Stop" : "Start"}
        </Text>
      </TouchableOpacity>

      {/* Error Message */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Tuner Display */}
      {isActive && (
        <View style={styles.tunerDisplay}>
          {mode === "needle" ? (
            // Needle Mode
            <View style={styles.needleContainer}>
              {/* Scale markings */}
              <View style={styles.scaleContainer}>
                <Text style={styles.scaleText}>-50</Text>
                <Text style={styles.scaleText}>-25</Text>
                <View style={styles.centerMark} />
                <Text style={styles.scaleText}>+25</Text>
                <Text style={styles.scaleText}>+50</Text>
              </View>

              {/* Needle */}
              <View
                style={[
                  styles.needle,
                  {
                    transform: [{ rotate: `${getNeedleRotation()}deg` }],
                    backgroundColor: getTuneColor(),
                  },
                ]}
              />

              {/* Note Display */}
              <View style={styles.noteContainer}>
                <Text style={[styles.noteName, { color: getTuneColor() }]}>
                  {currentNote || "-"}
                </Text>
                <Text style={styles.centsDisplay}>
                  {cents > 0 ? "+" : ""}
                  {cents} cents
                </Text>
              </View>
            </View>
          ) : (
            // Text Mode
            <View style={styles.textContainer}>
              <Text style={[styles.textNote, { color: getTuneColor() }]}>
                {currentNote || "---"}
              </Text>
              <Text style={[styles.textCents, { color: getTuneColor() }]}>
                {cents > 0 ? "+" : ""}
                {cents} cents
              </Text>
              <Text style={styles.textFreq}>
                {frequency ? `${frequency.toFixed(1)} Hz` : ""}
              </Text>
              <Text style={styles.tuningIndicator}>
                {Math.abs(cents) <= 5
                  ? "✓ In Tune"
                  : cents < 0
                    ? "↓ Flat"
                    : "↑ Sharp"}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Temperament indicator */}
      <Text style={styles.temperamentText}>
        {temperament === "just" ? "Just Intonation" : "Equal Temperament"}
      </Text>
    </View>
  );
}

Tuner.propTypes = {
  mode: PropTypes.oneOf(["needle", "text"]),
  temperament: PropTypes.oneOf(["equal", "just"]),
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 12,
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3a3a4e",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: "rgba(255, 107, 107, 0.2)",
  },
  toggleButtonIcon: {
    fontSize: 16,
  },
  toggleButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 12,
    marginTop: 8,
  },

  // Tuner Display
  tunerDisplay: {
    marginTop: 16,
    width: "100%",
    alignItems: "center",
  },

  // Needle Mode
  needleContainer: {
    alignItems: "center",
    width: "100%",
  },
  scaleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 8,
    alignItems: "center",
  },
  scaleText: {
    color: "#666",
    fontSize: 10,
  },
  centerMark: {
    width: 2,
    height: 12,
    backgroundColor: "#4CAF50",
  },
  needle: {
    width: 4,
    height: 60,
    borderRadius: 2,
    transformOrigin: "center bottom",
  },
  noteContainer: {
    alignItems: "center",
    marginTop: 12,
  },
  noteName: {
    fontSize: 36,
    fontWeight: "bold",
  },
  centsDisplay: {
    color: "#888",
    fontSize: 14,
    marginTop: 4,
  },

  // Text Mode
  textContainer: {
    alignItems: "center",
  },
  textNote: {
    fontSize: 48,
    fontWeight: "bold",
  },
  textCents: {
    fontSize: 24,
    marginTop: 4,
  },
  textFreq: {
    color: "#666",
    fontSize: 14,
    marginTop: 4,
  },
  tuningIndicator: {
    color: "#888",
    fontSize: 16,
    marginTop: 8,
    fontWeight: "600",
  },

  // Temperament
  temperamentText: {
    color: "#444",
    fontSize: 10,
    marginTop: 8,
    textTransform: "uppercase",
  },
});
