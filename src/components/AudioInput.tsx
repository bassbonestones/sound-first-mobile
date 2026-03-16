import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ViewStyle,
  TextStyle,
} from "react-native";
import { devLog, devWarn, devError } from "../utils/devLogger";

// Import pitch utilities from extracted module
import {
  frequencyToNote,
  noteNameToMidi,
  autoCorrelate,
  NoteInfo,
} from "./AudioInput/pitchUtils";

// Import WebView HTML generator
import { generateAudioWebViewHtml } from "./AudioInput/webViewHtml";

// Types
interface MobileAudioInputComponent extends React.FC<AudioInputProps> {}

// Import mobile audio component for native platforms
let MobileAudioInput: MobileAudioInputComponent | null = null;
if (Platform?.OS && Platform.OS !== "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    MobileAudioInput = require("./MobileAudioInput").default;
  } catch (e) {
    devWarn("MobileAudioInput not available:", e);
  }
}

// Singleton to track mic permission state across component instances (web only)
interface MicPermissionState {
  granted: boolean;
  pending: boolean;
  checkedOnce: boolean;
}

const globalMicPermissionState: MicPermissionState = {
  granted: false,
  pending: false,
  checkedOnce: false,
};

// Check mic permission without prompting (web only)
async function checkMicPermission(): Promise<PermissionState | null> {
  if (typeof navigator === "undefined" || !navigator.permissions) {
    return null; // Can't check, will need to prompt
  }
  try {
    const result = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });
    return result.state; // 'granted', 'denied', or 'prompt'
  } catch (e) {
    return null; // Browser doesn't support this query
  }
}

// Conditionally import WebView for mobile platforms (not currently used but kept for potential future use)
let WebView: React.ComponentType<unknown> | null = null;
if (Platform?.OS && Platform.OS !== "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
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
 */

export interface AudioInputProps {
  onVolumeChange?: (volume: number) => void;
  onPitchDetected?: (pitch: NoteInfo) => void;
  onRealtimePitch?: (pitch: NoteInfo) => void;
  onSoundStart?: () => void;
  onSoundEnd?: () => void;
  targetNote?: string;
  onPitchMatch?: (isMatch: boolean, pitch: NoteInfo) => void;
  volumeThreshold?: number;
  silenceDuration?: number;
  pitchMargin?: number;
  allowOctaveEquivalent?: boolean;
  enabled?: boolean;
  showDebug?: boolean;
  compact?: boolean;
}

interface WebViewMessageData {
  type: string;
  volume?: number;
  pitch?: NoteInfo;
  isMatch?: boolean;
  message?: string;
}

interface PitchReading {
  midi: number;
  timestamp: number;
}

// Extended Window interface for WebAudio
interface ExtendedWindow extends Window {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

export default function AudioInput({
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
}: AudioInputProps): React.ReactElement | null {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  const [currentPitch, setCurrentPitch] = useState<NoteInfo | null>(null);
  const [isSounding, setIsSounding] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(
    globalMicPermissionState.granted,
  );
  const [permissionChecked, setPermissionChecked] = useState(
    globalMicPermissionState.checkedOnce,
  );

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const soundStartedRef = useRef(false);

  // Throttle volume updates to prevent excessive re-renders
  const lastVolumeUpdateRef = useRef(0);
  const VOLUME_UPDATE_INTERVAL_MS = 100;

  // WebView ref for mobile audio
  const webViewRef = useRef<unknown>(null);

  // Mobile expo-av recording ref
  const recordingRef = useRef<unknown>(null);
  const meteringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // Pitch stability tracking
  const pitchBufferRef = useRef<PitchReading[]>([]);
  const stablePitchRef = useRef<NoteInfo | null>(null);
  const AVERAGING_WINDOW_MS = 1000;

  // Refs to hold latest callback values
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
    (event: { nativeEvent: { data: string } }) => {
      try {
        const data: WebViewMessageData = JSON.parse(event.nativeEvent.data);

        switch (data.type) {
          case "permissionGranted":
            setPermissionGranted(true);
            setIsListening(true);
            setError(null);
            break;
          case "error":
            setError(data.message || "Unknown error");
            break;
          case "volumeChange":
            {
              const now = Date.now();
              if (
                now - lastVolumeUpdateRef.current >=
                VOLUME_UPDATE_INTERVAL_MS
              ) {
                lastVolumeUpdateRef.current = now;
                setVolume(data.volume || 0);
                if (onVolumeChange) onVolumeChange(data.volume || 0);
              }
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
            if (data.pitch) {
              setCurrentPitch(data.pitch);
              if (onRealtimePitch) onRealtimePitch(data.pitch);
            }
            break;
          case "pitchDetected":
            if (data.pitch && onPitchDetected) onPitchDetected(data.pitch);
            break;
          case "pitchMatch":
            if (data.pitch && onPitchMatch)
              onPitchMatch(data.isMatch || false, data.pitch);
            break;
        }
      } catch (e) {
        devError("WebView message parse error:", e);
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
      checkMicPermission()
        .then((state) => {
          globalMicPermissionState.checkedOnce = true;
          setPermissionChecked(true);
          if (state === "granted") {
            globalMicPermissionState.granted = true;
            setPermissionGranted(true);
          }
        })
        .catch(() => {
          // Permission check failed, treat as not granted
          globalMicPermissionState.checkedOnce = true;
          setPermissionChecked(true);
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
  }, [enabled]);

  const startListening = useCallback(async () => {
    if (Platform.OS !== "web") {
      setError("Microphone input is only supported on web currently");
      return;
    }

    if (globalMicPermissionState.pending) {
      devLog("AudioInput: getUserMedia already pending, skipping");
      return;
    }

    if (mediaStreamRef.current && audioContextRef.current) {
      devLog("AudioInput: Already have active stream, reusing");
      setIsListening(true);
      analyze();
      return;
    }

    try {
      globalMicPermissionState.pending = true;

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

      const extWindow = window as ExtendedWindow;
      const AudioContextClass =
        extWindow.AudioContext || extWindow.webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error("AudioContext not supported");
      }
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsListening(true);
      setError(null);
      analyze();
    } catch (err) {
      globalMicPermissionState.pending = false;
      devError("Microphone access error:", err);
      const error = err as Error & { name?: string };
      if (error.name === "NotAllowedError") {
        setError(
          "Microphone permission denied. Please allow microphone access.",
        );
      } else if (error.name === "NotFoundError") {
        setError("No microphone found.");
      } else {
        setError(`Microphone error: ${error.message}`);
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
    pitchBufferRef.current = [];
    stablePitchRef.current = null;
  }, []);

  const analyze = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;

    const analyser = analyserRef.current;
    const sampleRate = audioContextRef.current.sampleRate;
    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);

    const processAudio = (): void => {
      if (!analyserRef.current) return;

      analyser.getFloatTimeDomainData(dataArray);

      const result = autoCorrelate(dataArray, sampleRate);
      const rms = result.rms || 0;

      const normalizedVolume = Math.min(1, rms * 10);

      const now = Date.now();
      if (now - lastVolumeUpdateRef.current >= VOLUME_UPDATE_INTERVAL_MS) {
        lastVolumeUpdateRef.current = now;
        setVolume(normalizedVolume);
        if (onVolumeChangeRef.current) {
          onVolumeChangeRef.current(normalizedVolume);
        }
      }

      const isAboveThreshold = normalizedVolume > volumeThresholdRef.current;

      if (isAboveThreshold) {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        if (!soundStartedRef.current) {
          soundStartedRef.current = true;
          setIsSounding(true);
          if (onSoundStartRef.current) {
            onSoundStartRef.current();
          }
        }

        if (result.frequency > 0 && result.confidence > 0.3) {
          const noteInfo = frequencyToNote(result.frequency);
          if (noteInfo) {
            const nowTime = Date.now();
            pitchBufferRef.current.push({
              midi: noteInfo.midiNote,
              timestamp: nowTime,
            });

            setCurrentPitch(noteInfo);
            stablePitchRef.current = noteInfo;

            if (onRealtimePitchRef.current) {
              onRealtimePitchRef.current(noteInfo);
            }

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
        if (soundStartedRef.current && !silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            soundStartedRef.current = false;
            setIsSounding(false);

            const nowTime = Date.now();
            const cutoff = nowTime - AVERAGING_WINDOW_MS;
            const recentReadings = pitchBufferRef.current.filter(
              (r) => r.timestamp >= cutoff,
            );

            if (recentReadings.length > 0) {
              const counts: Record<number, number> = {};
              recentReadings.forEach((r) => {
                counts[r.midi] = (counts[r.midi] || 0) + 1;
              });

              let mostCommon: number | null = null;
              let maxCount = 0;
              Object.entries(counts).forEach(([midi, count]) => {
                if (count > maxCount) {
                  maxCount = count;
                  mostCommon = parseInt(midi);
                }
              });

              if (mostCommon !== null) {
                const finalNoteInfo = frequencyToNote(
                  440 * Math.pow(2, (mostCommon - 69) / 12),
                );
                if (finalNoteInfo && onPitchDetectedRef.current) {
                  onPitchDetectedRef.current(finalNoteInfo);
                }
              }
            }

            setCurrentPitch(null);
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
  }, []);

  // Request permission handler (web)
  const requestPermission = async (): Promise<void> => {
    if (Platform.OS !== "web") {
      setError("Microphone input is only supported on web currently");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionGranted(true);
      setError(null);
    } catch (err) {
      const error = err as Error & { name?: string };
      if (error.name === "NotAllowedError") {
        setError("Please allow microphone access to continue.");
      } else {
        setError(`Microphone error: ${error.message}`);
      }
    }
  };

  // Mobile audio implementation placeholder
  const requestMobilePermission = useCallback(async (): Promise<boolean> => {
    setError("Audio module not available");
    return false;
  }, []);

  const startMobileListening = useCallback(async (): Promise<void> => {
    devWarn("[AudioInput] Mobile audio not implemented");
  }, []);

  const stopMobileListening = useCallback(async (): Promise<void> => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setIsListening(false);
    setVolume(0);
    setCurrentPitch(null);
    setIsSounding(false);
    soundStartedRef.current = false;
  }, []);

  if (Platform.OS !== "web") {
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
          <TouchableOpacity
            style={styles.button}
            onPress={requestPermission}
            accessibilityLabel="Grant microphone permission"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

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
        <TouchableOpacity
          style={styles.button}
          onPress={requestPermission}
          accessibilityLabel="Enable microphone"
          accessibilityRole="button"
        >
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

  return null;
}

interface Styles {
  container: ViewStyle;
  errorText: TextStyle;
  infoText: TextStyle;
  button: ViewStyle;
  buttonText: TextStyle;
  debugContainer: ViewStyle;
  debugText: TextStyle;
  mobileContainer: ViewStyle;
  webView: ViewStyle;
  hiddenWebViewContainer: ViewStyle;
  hiddenWebView: ViewStyle;
  debugOverlay: ViewStyle;
}

const styles = StyleSheet.create<Styles>({
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
