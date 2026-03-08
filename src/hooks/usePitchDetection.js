import { useState, useRef, useEffect, useCallback } from "react";
import { Platform, PermissionsAndroid } from "react-native";
import {
  frequencyToNote,
  noteNameToMidi,
  autoCorrelate,
  base64ToFloat32Array,
} from "../utils/audioUtils";

// Import live audio stream for native audio access
let LiveAudioStream = null;
try {
  LiveAudioStream = require("react-native-live-audio-stream").default;
} catch (e) {
  console.warn("react-native-live-audio-stream not available:", e);
}

const SAMPLE_RATE = 44100;
const BUFFER_SIZE = 4096;

/**
 * Hook for real-time pitch detection on mobile using react-native-live-audio-stream.
 *
 * Provides:
 * - Real-time pitch detection via autocorrelation
 * - Volume level monitoring
 * - Sound start/end events with silence detection
 * - Target note matching with optional octave equivalence
 *
 * @param {Object} options Configuration options
 * @returns {Object} Pitch detection state and controls
 */
export function usePitchDetection({
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
}) {
  const [isListening, setIsListening] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState(null);
  const [currentPitch, setCurrentPitch] = useState(null);
  const [volume, setVolume] = useState(0);
  const [isSounding, setIsSounding] = useState(false);

  const silenceTimerRef = useRef(null);
  const soundStartedRef = useRef(false);
  const pitchBufferRef = useRef([]);
  const audioBufferRef = useRef(new Float32Array(BUFFER_SIZE));
  const bufferIndexRef = useRef(0);
  const targetMidiRef = useRef(noteNameToMidi(targetNote));
  const isListeningRef = useRef(false);

  // Update target MIDI when prop changes
  useEffect(() => {
    targetMidiRef.current = noteNameToMidi(targetNote);
  }, [targetNote]);

  // Request microphone permission
  const requestPermission = useCallback(async () => {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Microphone Permission",
            message:
              "Sound First needs access to your microphone to hear you play.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          },
        );
        setPermissionGranted(granted === PermissionsAndroid.RESULTS.GRANTED);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // iOS handles permissions automatically when starting the stream
        setPermissionGranted(true);
        return true;
      }
    } catch (err) {
      console.error("Permission error:", err);
      setError("Failed to request microphone permission");
      return false;
    }
  }, []);

  // Process incoming audio data
  const processAudioData = useCallback(
    (data) => {
      if (!isListeningRef.current) return;

      try {
        // Convert base64 audio data to samples
        const samples = base64ToFloat32Array(data);

        // Add samples to our circular buffer
        for (let i = 0; i < samples.length; i++) {
          audioBufferRef.current[bufferIndexRef.current] = samples[i];
          bufferIndexRef.current = (bufferIndexRef.current + 1) % BUFFER_SIZE;
        }

        // Run pitch detection
        const result = autoCorrelate(audioBufferRef.current, SAMPLE_RATE);
        const normalizedVolume = Math.min(1, result.rms * 15);

        setVolume(normalizedVolume);
        onVolumeChange?.(normalizedVolume);

        const isAboveThreshold = normalizedVolume > volumeThreshold;

        if (isAboveThreshold) {
          // Clear silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }

          // Fire sound start
          if (!soundStartedRef.current) {
            soundStartedRef.current = true;
            setIsSounding(true);
            onSoundStart?.();
          }

          // Pitch detection
          if (result.frequency > 0 && result.confidence > 0.5) {
            const noteInfo = frequencyToNote(result.frequency);
            if (noteInfo) {
              // Only process and log pitches in a reasonable range (80-1000 Hz)
              if (noteInfo.frequency >= 80 && noteInfo.frequency <= 1000) {
                console.log("[Audio Processing]", result, noteInfo);
                setCurrentPitch(noteInfo);
                console.log("[Pitch Detected]", noteInfo);
              }
              pitchBufferRef.current.push({
                midi: noteInfo.midiNote,
                timestamp: Date.now(),
                noteInfo,
              });

              // Keep buffer from growing too large
              if (pitchBufferRef.current.length > 100) {
                pitchBufferRef.current = pitchBufferRef.current.slice(-50);
              }

              onRealtimePitch?.(noteInfo);

              // Check target match
              if (targetMidiRef.current !== null) {
                const diff = Math.abs(
                  noteInfo.midiNote - targetMidiRef.current,
                );
                // Allow octave equivalence for voice (diff % 12 === 0 means same note class)
                const noteMatches = allowOctaveEquivalent
                  ? diff % 12 === 0
                  : diff === 0;
                const isMatch =
                  noteMatches && Math.abs(noteInfo.cents) < pitchMargin;
                onPitchMatch?.(isMatch, noteInfo);
              }
            }
          }
        } else {
          // Below threshold - start silence timer
          if (soundStartedRef.current && !silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              soundStartedRef.current = false;
              setIsSounding(false);

              // Calculate final pitch from recent buffer
              const cutoff = Date.now() - 1000;
              const recent = pitchBufferRef.current.filter(
                (r) => r.timestamp >= cutoff,
              );

              if (recent.length > 0) {
                // Find most common note
                const counts = {};
                recent.forEach((r) => {
                  counts[r.midi] = (counts[r.midi] || 0) + 1;
                });

                let mostCommon = null;
                let maxCount = 0;
                Object.entries(counts).forEach(([midi, count]) => {
                  if (count > maxCount) {
                    maxCount = count;
                    mostCommon = parseInt(midi, 10);
                  }
                });

                if (mostCommon !== null) {
                  const finalNote = frequencyToNote(
                    440 * Math.pow(2, (mostCommon - 69) / 12),
                  );
                  if (finalNote) {
                    onPitchDetected?.(finalNote);
                  }
                }
              }

              pitchBufferRef.current = [];
              // Only clear currentPitch if not sounding
              if (!isSounding) setCurrentPitch(null);
              onSoundEnd?.();
            }, silenceDuration);
          }
        }
      } catch (err) {
        console.error("Audio processing error:", err);
      }
    },
    [
      onVolumeChange,
      onSoundStart,
      onSoundEnd,
      onRealtimePitch,
      onPitchDetected,
      onPitchMatch,
      volumeThreshold,
      silenceDuration,
      pitchMargin,
      allowOctaveEquivalent,
      isSounding,
    ],
  );

  // Start listening
  const startListening = useCallback(async () => {
    if (!LiveAudioStream) {
      setError(
        "Native audio streaming not available. Please use Expo Dev Client.",
      );
      return;
    }

    if (isListeningRef.current) return;

    try {
      console.log("[usePitchDetection] Initializing audio stream...");

      // Initialize audio stream
      LiveAudioStream.init({
        sampleRate: SAMPLE_RATE,
        channels: 1,
        bitsPerSample: 16,
        audioSource: 6, // VOICE_RECOGNITION for Android
        bufferSize: BUFFER_SIZE,
      });

      // Set up data handler
      LiveAudioStream.on("data", processAudioData);

      // Start streaming
      LiveAudioStream.start();
      isListeningRef.current = true;
      setIsListening(true);
      setError(null);
      console.log("[usePitchDetection] Started listening");
    } catch (err) {
      console.error("Start listening error:", err);
      setError(`Failed to start audio: ${err.message}`);
    }
  }, [processAudioData]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!LiveAudioStream || !isListeningRef.current) return;

    try {
      isListeningRef.current = false;
      LiveAudioStream.stop();
      setIsListening(false);
      setVolume(0);
      setCurrentPitch(null);
      setIsSounding(false);
      soundStartedRef.current = false;

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      console.log("[usePitchDetection] Stopped listening");
    } catch (err) {
      console.warn("Stop listening error:", err);
    }
  }, []);

  // Handle enabled state
  useEffect(() => {
    const setup = async () => {
      if (enabled) {
        const hasPermission = permissionGranted || (await requestPermission());
        if (hasPermission) {
          startListening();
        }
      } else {
        stopListening();
      }
    };

    setup();

    return () => {
      stopListening();
    };
  }, [
    enabled,
    permissionGranted,
    requestPermission,
    startListening,
    stopListening,
  ]);

  return {
    isListening,
    permissionGranted,
    error,
    currentPitch,
    volume,
    isSounding,
    isAvailable: !!LiveAudioStream,
    startListening,
    stopListening,
  };
}
