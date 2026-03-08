import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";

// Import pitch utilities from extracted module
import {
  frequencyToNote,
  noteNameToMidi,
  autoCorrelate,
} from "./AudioInput/pitchUtils";

// Import WebView HTML generator
import { generateAudioWebViewHtml } from "./AudioInput/webViewHtml";

// Import mobile audio component for native platforms
let MobileAudioInput = null;
if (Platform?.OS && Platform.OS !== "web") {
  try {
    MobileAudioInput = require("./MobileAudioInput").default;
  } catch (e) {
    console.warn("MobileAudioInput not available:", e);
  }
}

// Singleton to track mic permission state across component instances (web only)
let globalMicPermissionState = {
  granted: false,
  pending: false,
  checkedOnce: false,
};

// Check mic permission without prompting (web only)
async function checkMicPermission() {
  if (typeof navigator === "undefined" || !navigator.permissions) {
    return null; // Can't check, will need to prompt
  }
  try {
    const result = await navigator.permissions.query({ name: "microphone" });
    return result.state; // 'granted', 'denied', or 'prompt'
  } catch (e) {
    return null; // Browser doesn't support this query
  }
}

// Conditionally import WebView for mobile platforms (not currently used but kept for potential future use)
let WebView = null;
if (Platform?.OS && Platform.OS !== "web") {
  try {
    WebView = require("react-native-webview").WebView;
  } catch (e) {
    // WebView not available, that's OK
  }
}

/**
 * AudioInput Component for capturing and analyzing microphone input
 *
 * Used in Day 0 first-note experience for:
 * - Detecting when user is singing/playing (volume threshold)
 * - Detecting pitch to verify they're playing the correct note
 *
 * Props:
 * - onVolumeChange: Callback with volume level (0-1)
 * - onPitchDetected: Callback with detected pitch info { frequency, noteName, cents }
 * - onSoundStart: Callback when sound starts (above threshold)
 * - onSoundEnd: Callback when sound ends (below threshold for duration)
 * - targetNote: Target note name for pitch comparison (e.g., "Bb3")
 * - onPitchMatch: Callback when playing correct pitch (within margin)
 * - volumeThreshold: Minimum volume to consider "sound" (default 0.02)
 * - silenceDuration: Ms of silence before onSoundEnd fires (default 1500)
 * - enabled: Whether to actively listen (default true)
 * - showDebug: Show debug info (default false)
 */

export default function AudioInput({
  onVolumeChange,
  onPitchDetected,
  onRealtimePitch, // NEW: fires during active sound with current pitch
  onSoundStart,
  onSoundEnd,
  targetNote,
  onPitchMatch,
  volumeThreshold = 0.02,
  silenceDuration = 1500,
  pitchMargin = 100, // cents margin for "correct" pitch
  allowOctaveEquivalent = false, // allow octave equivalence for voice/singing
  enabled = true,
  showDebug = false,
  compact = false,
}) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const [volume, setVolume] = useState(0);
  const [currentPitch, setCurrentPitch] = useState(null);
  const [isSounding, setIsSounding] = useState(false);
  // Initialize from global state to avoid showing button unnecessarily
  const [permissionGranted, setPermissionGranted] = useState(
    globalMicPermissionState.granted,
  );
  const [permissionChecked, setPermissionChecked] = useState(
    globalMicPermissionState.checkedOnce,
  );

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processorRef = useRef(null);
  const animationFrameRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const soundStartedRef = useRef(false);

  // Throttle volume updates to prevent excessive re-renders (max ~10 updates/sec)
  const lastVolumeUpdateRef = useRef(0);
  const VOLUME_UPDATE_INTERVAL_MS = 100;

  // WebView ref for mobile audio
  const webViewRef = useRef(null);

  // Mobile expo-av recording ref
  const recordingRef = useRef(null);
  const meteringIntervalRef = useRef(null);

  // Pitch stability tracking - buffer all readings during sound, then average
  const pitchBufferRef = useRef([]); // Array of {midi, timestamp}
  const stablePitchRef = useRef(null);
  const AVERAGING_WINDOW_MS = 1000; // Average over last 1 second of sound

  // Refs to hold latest callback values (prevents stale closures in animation frame)
  const onVolumeChangeRef = useRef(onVolumeChange);
  const onRealtimePitchRef = useRef(onRealtimePitch);
  const onPitchDetectedRef = useRef(onPitchDetected);
  const onSoundStartRef = useRef(onSoundStart);
  const onSoundEndRef = useRef(onSoundEnd);
  const onPitchMatchRef = useRef(onPitchMatch);
  const volumeThresholdRef = useRef(volumeThreshold);
  const silenceDurationRef = useRef(silenceDuration);
  const pitchMarginRef = useRef(pitchMargin);
  const allowOctaveEquivalentRef = useRef(allowOctaveEquivalent);

  // Keep refs in sync with props
  useEffect(() => {
    onVolumeChangeRef.current = onVolumeChange;
    onRealtimePitchRef.current = onRealtimePitch;
    onPitchDetectedRef.current = onPitchDetected;
    onSoundStartRef.current = onSoundStart;
    onSoundEndRef.current = onSoundEnd;
    onPitchMatchRef.current = onPitchMatch;
    volumeThresholdRef.current = volumeThreshold;
    silenceDurationRef.current = silenceDuration;
    pitchMarginRef.current = pitchMargin;
    allowOctaveEquivalentRef.current = allowOctaveEquivalent;
  }, [
    onVolumeChange,
    onRealtimePitch,
    onPitchDetected,
    onSoundStart,
    onSoundEnd,
    onPitchMatch,
    volumeThreshold,
    silenceDuration,
    pitchMargin,
    allowOctaveEquivalent,
  ]);

  const targetMidi = targetNote ? noteNameToMidi(targetNote) : null;
  const targetMidiRef = useRef(targetMidi);
  useEffect(() => {
    targetMidiRef.current = targetMidi;
  }, [targetMidi]);

  // Handle messages from WebView (mobile)
  const handleWebViewMessage = useCallback(
    (event) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        switch (data.type) {
          case "permissionGranted":
            setPermissionGranted(true);
            setIsListening(true);
            setError(null);
            break;
          case "error":
            setError(data.message);
            break;
          case "volumeChange":
            // Throttle volume updates to prevent excessive re-renders
            const now = Date.now();
            if (
              now - lastVolumeUpdateRef.current >=
              VOLUME_UPDATE_INTERVAL_MS
            ) {
              lastVolumeUpdateRef.current = now;
              setVolume(data.volume);
              if (onVolumeChange) onVolumeChange(data.volume);
            }
            break;
          case "soundStart":
            setIsSounding(true);
            if (onSoundStart) onSoundStart();
            break;
          case "soundEnd":
            setIsSounding(false);
            setCurrentPitch(null);
            if (onSoundEnd) onSoundEnd();
            break;
          case "realtimePitch":
            setCurrentPitch(data.pitch);
            if (onRealtimePitch) onRealtimePitch(data.pitch);
            break;
          case "pitchDetected":
            if (onPitchDetected) onPitchDetected(data.pitch);
            break;
          case "pitchMatch":
            if (onPitchMatch) onPitchMatch(data.isMatch, data.pitch);
            break;
        }
      } catch (e) {
        console.error("WebView message parse error:", e);
      }
    },
    [
      onVolumeChange,
      onSoundStart,
      onSoundEnd,
      onRealtimePitch,
      onPitchDetected,
      onPitchMatch,
    ],
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (Platform.OS === "web") {
        stopListening();
      } else {
        stopMobileListening();
      }
    };
  }, []);

  // Check permission state on mount (web only)
  useEffect(() => {
    if (Platform.OS === "web" && !globalMicPermissionState.checkedOnce) {
      checkMicPermission().then((state) => {
        globalMicPermissionState.checkedOnce = true;
        setPermissionChecked(true);
        if (state === "granted") {
          globalMicPermissionState.granted = true;
          setPermissionGranted(true);
        }
      });
    }
  }, []);

  // Start/stop based on enabled prop
  useEffect(() => {
    if (Platform.OS === "web") {
      if (enabled && !isListening && !globalMicPermissionState.pending) {
        startListening();
      } else if (!enabled && isListening) {
        stopListening();
      }
    }
    // Mobile: disabled for now - expo-audio requires hook-based implementation
    // TODO: implement using useAudioRecorder hook
  }, [enabled]);

  const startListening = useCallback(async () => {
    if (Platform.OS !== "web") {
      setError("Microphone input is only supported on web currently");
      return;
    }

    // Prevent concurrent getUserMedia calls
    if (globalMicPermissionState.pending) {
      console.log("AudioInput: getUserMedia already pending, skipping");
      return;
    }

    // If already listening with an active stream, don't restart
    if (mediaStreamRef.current && audioContextRef.current) {
      console.log("AudioInput: Already have active stream, reusing");
      setIsListening(true);
      analyze();
      return;
    }

    try {
      globalMicPermissionState.pending = true;

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      globalMicPermissionState.pending = false;
      globalMicPermissionState.granted = true;
      mediaStreamRef.current = stream;
      setPermissionGranted(true);

      // Create audio context
      const audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
      audioContextRef.current = audioContext;

      // Create analyser node
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Connect stream to analyser
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Start analyzing
      setIsListening(true);
      setError(null);
      analyze();
    } catch (err) {
      globalMicPermissionState.pending = false;
      console.error("Microphone access error:", err);
      if (err.name === "NotAllowedError") {
        setError(
          "Microphone permission denied. Please allow microphone access.",
        );
      } else if (err.name === "NotFoundError") {
        setError("No microphone found.");
      } else {
        setError(`Microphone error: ${err.message}`);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsListening(false);
    setVolume(0);
    setCurrentPitch(null);
    setIsSounding(false);
    soundStartedRef.current = false;
    // Clear pitch buffer on stop
    pitchBufferRef.current = [];
    stablePitchRef.current = null;
  }, []);

  const analyze = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;

    const analyser = analyserRef.current;
    const sampleRate = audioContextRef.current.sampleRate;
    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);

    const processAudio = () => {
      if (!analyserRef.current) return;

      analyser.getFloatTimeDomainData(dataArray);

      // Get pitch and RMS
      const result = autoCorrelate(dataArray, sampleRate);
      const rms = result.rms || 0;

      // Normalize volume (0-1 scale)
      const normalizedVolume = Math.min(1, rms * 10);

      // Throttle volume state updates to prevent excessive re-renders
      const now = Date.now();
      if (now - lastVolumeUpdateRef.current >= VOLUME_UPDATE_INTERVAL_MS) {
        lastVolumeUpdateRef.current = now;
        setVolume(normalizedVolume);
        if (onVolumeChangeRef.current) {
          onVolumeChangeRef.current(normalizedVolume);
        }
      }

      // Check if sound is above threshold (use ref for latest value)
      const isAboveThreshold = normalizedVolume > volumeThresholdRef.current;

      if (isAboveThreshold) {
        // Clear silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        // Fire sound start if not already sounding
        if (!soundStartedRef.current) {
          soundStartedRef.current = true;
          setIsSounding(true);
          if (onSoundStartRef.current) {
            onSoundStartRef.current();
          }
        }

        // Detect pitch - very low threshold for voice
        if (result.frequency > 0 && result.confidence > 0.3) {
          const noteInfo = frequencyToNote(result.frequency);
          if (noteInfo) {
            // Add timestamped reading to buffer
            const now = Date.now();
            pitchBufferRef.current.push({
              midi: noteInfo.midiNote,
              timestamp: now,
            });

            // Update visual display with current detected pitch
            setCurrentPitch(noteInfo);
            stablePitchRef.current = noteInfo;

            // Fire real-time pitch callback (use ref for latest value)
            if (onRealtimePitchRef.current) {
              onRealtimePitchRef.current(noteInfo);
            }

            // Check if matches target (for visual feedback during playing)
            if (targetMidiRef.current !== null && onPitchMatchRef.current) {
              const diff = Math.abs(noteInfo.midiNote - targetMidiRef.current);
              const noteMatches = allowOctaveEquivalentRef.current
                ? diff % 12 === 0
                : diff === 0;
              const isMatch =
                noteMatches &&
                Math.abs(noteInfo.cents) < pitchMarginRef.current;
              onPitchMatchRef.current(isMatch, noteInfo);
            }
          }
        }
      } else {
        // Below threshold - start silence timer
        if (soundStartedRef.current && !silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            soundStartedRef.current = false;
            setIsSounding(false);

            // Compute average pitch from last AVERAGING_WINDOW_MS of readings
            const now = Date.now();
            const cutoff = now - AVERAGING_WINDOW_MS;
            const recentReadings = pitchBufferRef.current.filter(
              (r) => r.timestamp >= cutoff,
            );

            if (recentReadings.length > 0) {
              // Find most common MIDI note in the window
              const counts = {};
              recentReadings.forEach((r) => {
                counts[r.midi] = (counts[r.midi] || 0) + 1;
              });

              let mostCommon = null;
              let maxCount = 0;
              Object.entries(counts).forEach(([midi, count]) => {
                if (count > maxCount) {
                  maxCount = count;
                  mostCommon = parseInt(midi);
                }
              });

              if (mostCommon !== null) {
                // Create noteInfo for the final averaged pitch
                const finalNoteInfo = frequencyToNote(
                  440 * Math.pow(2, (mostCommon - 69) / 12),
                );
                if (finalNoteInfo && onPitchDetectedRef.current) {
                  onPitchDetectedRef.current(finalNoteInfo);
                }
              }
            }

            setCurrentPitch(null);
            // Clear pitch buffer on silence
            pitchBufferRef.current = [];
            stablePitchRef.current = null;
            if (onSoundEndRef.current) {
              onSoundEndRef.current();
            }
          }, silenceDurationRef.current);
        }
      }

      animationFrameRef.current = requestAnimationFrame(processAudio);
    };

    processAudio();
  }, []); // Empty deps - all values accessed via refs

  // Request permission handler (web)
  const requestPermission = async () => {
    if (Platform.OS !== "web") {
      setError("Microphone input is only supported on web currently");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop()); // Just testing permission
      setPermissionGranted(true);
      setError(null);
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setError("Please allow microphone access to continue.");
      } else {
        setError(`Microphone error: ${err.message}`);
      }
    }
  };

  // =============================================
  // MOBILE (expo-audio) AUDIO IMPLEMENTATION
  // =============================================

  // Request permission for mobile microphone
  const requestMobilePermission = useCallback(async () => {
    if (!ExpoAudio) {
      setError("Audio module not available");
      return false;
    }

    try {
      const response = await ExpoAudio.requestRecordingPermissionsAsync();
      if (response.granted) {
        setPermissionGranted(true);
        setError(null);
        return true;
      } else {
        setError(
          "Microphone permission denied. Please allow access in settings.",
        );
        return false;
      }
    } catch (err) {
      setError(`Permission error: ${err.message}`);
      return false;
    }
  }, []);

  // Start mobile audio recording with metering
  const startMobileListening = useCallback(async () => {
    if (!ExpoAudio) {
      console.warn("[AudioInput] expo-audio module not available");
      return;
    }

    // Don't start if already listening
    if (isListening || recordingRef.current) {
      return;
    }

    try {
      // First request permission if not granted
      if (!permissionGranted) {
        const permOk = await requestMobilePermission();
        if (!permOk) {
          return;
        }
      }

      // Configure audio mode for recording (expo-audio)
      await ExpoAudio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create a new AudioRecorder instance with metering enabled
      const recorder = new ExpoAudio.AudioRecorder({
        isMeteringEnabled: true,
      });

      // Status update callback for real-time metering
      recorder.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && status.metering !== undefined) {
          // Convert dB to 0-1 scale (dB typically ranges from -160 to 0)
          // -60 dB is very quiet, -10 dB is loud
          const dB = status.metering;
          const normalizedVolume = Math.max(0, Math.min(1, (dB + 60) / 60));

          // Throttle volume state updates to prevent excessive re-renders
          const now = Date.now();
          if (now - lastVolumeUpdateRef.current >= VOLUME_UPDATE_INTERVAL_MS) {
            lastVolumeUpdateRef.current = now;
            setVolume(normalizedVolume);
            if (onVolumeChange) {
              onVolumeChange(normalizedVolume);
            }
          }

          // Check if sound is above threshold
          const isAboveThreshold = normalizedVolume > volumeThreshold;

          if (isAboveThreshold) {
            // Clear silence timer
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }

            // Fire sound start if not already sounding
            if (!soundStartedRef.current) {
              soundStartedRef.current = true;
              setIsSounding(true);
              if (onSoundStart) {
                onSoundStart();
              }
            }

            // Note: expo-audio doesn't provide frequency/pitch data directly
            // For basic functionality, we just detect sound presence
            // Pitch detection would require additional processing
          } else {
            // Below threshold - start silence timer
            if (soundStartedRef.current && !silenceTimerRef.current) {
              silenceTimerRef.current = setTimeout(() => {
                soundStartedRef.current = false;
                setIsSounding(false);
                setCurrentPitch(null);
                if (onSoundEnd) {
                  onSoundEnd();
                }
              }, silenceDuration);
            }
          }
        }
      });

      // Prepare and start recording
      await recorder.prepareToRecordAsync();
      recorder.record();

      recordingRef.current = recorder;
      setIsListening(true);
      setError(null);
    } catch (err) {
      console.error("Mobile recording error:", err);
      setError(`Recording error: ${err.message}`);
    }
  }, [
    onVolumeChange,
    onSoundStart,
    onSoundEnd,
    volumeThreshold,
    silenceDuration,
  ]);

  // Stop mobile recording
  const stopMobileListening = useCallback(async () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (recordingRef.current) {
      try {
        // expo-audio uses stop() instead of stopAndUnloadAsync()
        await recordingRef.current.stop();
      } catch (err) {
        console.warn("Error stopping recording:", err);
      }
      recordingRef.current = null;
    }

    setIsListening(false);
    setVolume(0);
    setCurrentPitch(null);
    setIsSounding(false);
    soundStartedRef.current = false;
  }, []);

  if (Platform.OS !== "web") {
    // =============================================
    // MOBILE RENDER (using MobileAudioInput with expo-audio)
    // =============================================
    if (MobileAudioInput) {
      return (
        <MobileAudioInput
          onVolumeChange={onVolumeChange}
          onPitchDetected={onPitchDetected}
          onRealtimePitch={onRealtimePitch}
          onSoundStart={onSoundStart}
          onSoundEnd={onSoundEnd}
          targetNote={targetNote}
          onPitchMatch={onPitchMatch}
          volumeThreshold={volumeThreshold}
          silenceDuration={silenceDuration}
          pitchMargin={pitchMargin}
          allowOctaveEquivalent={allowOctaveEquivalent}
          enabled={enabled}
          showDebug={showDebug}
          compact={compact}
        />
      );
    }

    // Fallback if MobileAudioInput failed to load
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Audio input not available on this device
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        {error.includes("permission") && (
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Show loading state while checking permission or waiting for getUserMedia
  if (
    !permissionGranted &&
    (globalMicPermissionState.pending || !permissionChecked)
  ) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>🎤 Connecting to microphone...</Text>
      </View>
    );
  }

  if (!permissionGranted) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>
          We need microphone access to hear you play.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Enable Microphone</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        {currentPitch && (
          <>
            <Text style={styles.debugText}>Note: {currentPitch.noteName}</Text>
            <Text style={styles.debugText}>
              Freq: {currentPitch.frequency.toFixed(1)} Hz
            </Text>
            <Text style={styles.debugText}>
              Cents: {currentPitch.cents > 0 ? "+" : ""}
              {currentPitch.cents}
            </Text>
          </>
        )}
        {targetNote && (
          <Text style={styles.debugText}>
            Target: {targetNote} (MIDI {targetMidi})
          </Text>
        )}
      </View>
    );
  }

  // Default: invisible component (just provides callbacks)
  return null;
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    color: "#FF6B6B",
    textAlign: "center",
    marginBottom: 10,
  },
  infoText: {
    color: "#333",
    textAlign: "center",
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#4A90D9",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
  debugContainer: {
    padding: 10,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    margin: 10,
  },
  debugText: {
    fontFamily: Platform.OS === "web" ? "monospace" : "Courier",
    fontSize: 12,
    color: "#333",
    marginVertical: 2,
  },
  mobileContainer: {
    flex: 1,
    minHeight: 200,
    borderRadius: 12,
    overflow: "hidden",
  },
  webView: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  hiddenWebViewContainer: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    overflow: "hidden",
  },
  hiddenWebView: {
    width: 1,
    height: 1,
  },
  debugOverlay: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 10,
    borderRadius: 8,
  },
});
