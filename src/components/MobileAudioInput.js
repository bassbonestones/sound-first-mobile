import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import PropTypes from "prop-types";
import { usePitchDetection } from "../hooks/usePitchDetection";

/**
 * Mobile Audio Input using react-native-live-audio-stream
 *
 * Provides real-time pitch detection on iOS and Android by:
 * - Streaming raw PCM audio data from the microphone
 * - Running autocorrelation pitch detection on the audio samples
 * - Reporting pitch, volume, and sound start/end events
 *
 * Note: Requires Expo Dev Client or bare workflow (not Expo Go)
 */
export default function MobileAudioInput({
  onVolumeChange,
  onPitchDetected,
  onRealtimePitch,
  onSoundStart,
  onSoundEnd,
  targetNote,
  onPitchMatch,
  volumeThreshold = 0.02,
  silenceDuration = 1500,
  pitchMargin = 100,
  allowOctaveEquivalent = false,
  enabled = true,
  showDebug = false,
  compact = false,
}) {
  const { isListening, error, currentPitch, volume, isSounding, isAvailable } =
    usePitchDetection({
      onVolumeChange,
      onPitchDetected,
      onRealtimePitch,
      onSoundStart,
      onSoundEnd,
      targetNote,
      onPitchMatch,
      volumeThreshold,
      silenceDuration,
      pitchMargin,
      allowOctaveEquivalent,
      enabled,
    });

  // Check if native module is available
  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorIcon}>🎤</Text>
        <Text style={styles.errorText}>Native audio not available.</Text>
        <Text style={styles.errorHint}>
          To use pitch detection on mobile, you need to run with Expo Dev Client
          instead of Expo Go.
        </Text>
        <Text style={styles.errorHint}>
          Run: npx expo run:ios or npx expo run:android
        </Text>
      </View>
    );
  }

  // Show error
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Show debug view
  if (showDebug) {
    return (
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>
          Listening: {isListening ? "Yes" : "No"}
        </Text>
        <Text style={styles.debugText}>
          Volume: {(volume * 100).toFixed(0)}%
        </Text>
        <Text style={styles.debugText}>
          Sounding: {isSounding ? "Yes" : "No"}
        </Text>
        <Text style={styles.debugText}>
          Pitch: {currentPitch?.noteName || "--"}
        </Text>
        <Text style={styles.debugText}>
          Frequency: {currentPitch?.frequency?.toFixed(1) || "--"} Hz
        </Text>
        <View style={styles.volumeBarContainer}>
          <View style={[styles.volumeBar, { width: `${volume * 100}%` }]} />
        </View>
      </View>
    );
  }

  // Main display
  return (
    <View style={compact ? styles.containerCompact : styles.container}>
      <Text
        style={compact ? styles.listeningTextCompact : styles.listeningText}
      >
        {isListening ? "🎤 Listening..." : "🎤 Starting..."}
      </Text>

      <View
        style={
          compact ? styles.volumeBarContainerCompact : styles.volumeBarContainer
        }
      >
        <View
          style={[
            styles.volumeBar,
            {
              width: `${Math.max(2, volume * 100)}%`,
              backgroundColor: isSounding ? "#4ADE80" : "#4A90D9",
            },
          ]}
        />
      </View>

      {currentPitch && (
        <View style={styles.pitchDisplay}>
          <Text style={compact ? styles.pitchNoteCompact : styles.pitchNote}>
            {currentPitch.noteName}
          </Text>
          <Text style={styles.pitchInfo}>
            {currentPitch.isInTune
              ? "In tune ✓"
              : `${currentPitch.cents > 0 ? "+" : ""}${currentPitch.cents} cents`}
          </Text>
        </View>
      )}

      {!currentPitch && isSounding && (
        <Text style={styles.detectingText}>Detecting pitch...</Text>
      )}
    </View>
  );
}

MobileAudioInput.propTypes = {
  onVolumeChange: PropTypes.func,
  onPitchDetected: PropTypes.func,
  onRealtimePitch: PropTypes.func,
  onSoundStart: PropTypes.func,
  onSoundEnd: PropTypes.func,
  targetNote: PropTypes.string,
  onPitchMatch: PropTypes.func,
  volumeThreshold: PropTypes.number,
  silenceDuration: PropTypes.number,
  pitchMargin: PropTypes.number,
  allowOctaveEquivalent: PropTypes.bool,
  enabled: PropTypes.bool,
  showDebug: PropTypes.bool,
  compact: PropTypes.bool,
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  containerCompact: {
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 60,
  },
  listeningText: {
    color: "#4ADE80",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  listeningTextCompact: {
    color: "#4ADE80",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6,
  },
  volumeBarContainer: {
    width: "100%",
    maxWidth: 250,
    height: 12,
    backgroundColor: "#333",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 20,
  },
  volumeBarContainerCompact: {
    width: "100%",
    maxWidth: 200,
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  volumeBar: {
    height: "100%",
    backgroundColor: "#4ADE80",
    borderRadius: 6,
  },
  pitchDisplay: {
    alignItems: "center",
    marginTop: 8,
  },
  pitchNote: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFD700",
  },
  pitchNoteCompact: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFD700",
  },
  pitchInfo: {
    fontSize: 14,
    color: "#e6cfa7",
    marginTop: 4,
  },
  detectingText: {
    color: "#bfa76a",
    fontSize: 14,
    fontStyle: "italic",
  },
  errorIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  errorText: {
    color: "#e6cfa7",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  errorHint: {
    color: "#bfa76a",
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 8,
    paddingHorizontal: 20,
  },
  debugContainer: {
    padding: 16,
    backgroundColor: "#2d232e",
    borderRadius: 12,
    margin: 8,
  },
  debugText: {
    color: "#e6cfa7",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 4,
  },
});
