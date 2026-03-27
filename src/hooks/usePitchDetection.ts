/**
 * usePitchDetection - Real-time pitch detection hook
 *
 * Uses Web Audio API for web and react-native-live-audio-stream for native.
 */
import { useRef, useEffect, useCallback, useReducer } from "react";
import { Platform, PermissionsAndroid } from "react-native";
import { devLog, devWarn, devError } from "../utils/devLogger";
import {
  frequencyToNote,
  noteNameToMidi,
  autoCorrelate,
  base64ToFloat32Array,
} from "../utils/audioUtils";

// Types for audio utilities
interface NoteInfo {
  noteName: string;
  midiNote: number;
  frequency: number;
  cents: number;
}

interface AutoCorrelateResult {
  frequency: number;
  confidence: number;
  rms: number;
}

// Import live audio stream for native audio access (not available on web)
interface LiveAudioStreamModule {
  init: (options: {
    sampleRate: number;
    channels: number;
    bitsPerSample: number;
    audioSource: number;
    bufferSize: number;
  }) => void;
  start: () => void;
  stop: () => void;
  on: (event: string, callback: (data: string) => void) => void;
}

let LiveAudioStream: LiveAudioStreamModule | null = null;
if (Platform.OS !== "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    LiveAudioStream = require("react-native-live-audio-stream").default;
    // Verify the module has the required methods
    if (
      !LiveAudioStream?.init ||
      !LiveAudioStream?.start ||
      !LiveAudioStream?.stop
    ) {
      devWarn(
        "react-native-live-audio-stream loaded but missing required methods",
      );
      LiveAudioStream = null;
    }
  } catch (e) {
    devWarn("react-native-live-audio-stream not available:", e);
  }
}

const SAMPLE_RATE = 44100;
const BUFFER_SIZE = 8192; // Larger buffer for better frequency resolution

export interface SoundingFrequencyRange {
  min: number;
  max: number;
}

export interface UsePitchDetectionOptions {
  onVolumeChange?: (volume: number) => void;
  onPitchDetected?: (noteInfo: NoteInfo) => void;
  onRealtimePitch?: (noteInfo: NoteInfo) => void;
  onSoundStart?: () => void;
  onSoundEnd?: () => void;
  targetNote?: string;
  onPitchMatch?: (isMatch: boolean, noteInfo: NoteInfo) => void;
  volumeThreshold?: number;
  silenceDuration?: number;
  pitchMargin?: number;
  allowOctaveEquivalent?: boolean;
  enabled?: boolean;
  externalAudioContext?: AudioContext | null;
  soundingFrequencyRange?: SoundingFrequencyRange | null;
}

export interface UsePitchDetectionReturn {
  isListening: boolean;
  permissionGranted: boolean;
  error: string | null;
  currentPitch: NoteInfo | null;
  volume: number;
  isSounding: boolean;
  isAvailable: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;
}

interface PitchBufferEntry {
  midi: number;
  timestamp: number;
  noteInfo: NoteInfo;
}

// Reducer state type
interface PitchDetectionState {
  isListening: boolean;
  permissionGranted: boolean;
  error: string | null;
  currentPitch: NoteInfo | null;
  volume: number;
  isSounding: boolean;
}

// Action types for pitch detection reducer
type PitchDetectionAction =
  | { type: "START_LISTENING" }
  | { type: "STOP_LISTENING" }
  | { type: "SET_PERMISSION"; granted: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_VOLUME"; volume: number }
  | { type: "SET_PITCH"; pitch: NoteInfo | null }
  | { type: "SET_SOUNDING"; isSounding: boolean }
  | { type: "CLEAR_ERROR" };

const initialPitchDetectionState: PitchDetectionState = {
  isListening: false,
  permissionGranted: false,
  error: null,
  currentPitch: null,
  volume: 0,
  isSounding: false,
};

function pitchDetectionReducer(
  state: PitchDetectionState,
  action: PitchDetectionAction,
): PitchDetectionState {
  switch (action.type) {
    case "START_LISTENING":
      return {
        ...state,
        isListening: true,
        error: null,
      };
    case "STOP_LISTENING":
      return {
        ...state,
        isListening: false,
        volume: 0,
        currentPitch: null,
        isSounding: false,
      };
    case "SET_PERMISSION":
      return {
        ...state,
        permissionGranted: action.granted,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.error,
        isListening: false,
      };
    case "SET_VOLUME":
      return {
        ...state,
        volume: action.volume,
      };
    case "SET_PITCH":
      return {
        ...state,
        currentPitch: action.pitch,
      };
    case "SET_SOUNDING":
      return {
        ...state,
        isSounding: action.isSounding,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

/**
 * Hook for real-time pitch detection on mobile using react-native-live-audio-stream.
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
  externalAudioContext = null,
  soundingFrequencyRange = null,
}: UsePitchDetectionOptions): UsePitchDetectionReturn {
  const [state, dispatch] = useReducer(
    pitchDetectionReducer,
    initialPitchDetectionState,
  );
  const {
    isListening,
    permissionGranted,
    error,
    currentPitch,
    volume,
    isSounding,
  } = state;

  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const soundStartedRef = useRef(false);
  const pitchBufferRef = useRef<PitchBufferEntry[]>([]);
  const audioBufferRef = useRef(new Float32Array(BUFFER_SIZE));
  const bufferIndexRef = useRef(0);
  const targetMidiRef = useRef<number | null>(noteNameToMidi(targetNote || ""));
  const isListeningRef = useRef(false);
  const lastPitchNoteRef = useRef<string | null>(null);

  // Web-specific refs
  const webAudioContextRef = useRef<AudioContext | null>(null);
  const webMediaStreamRef = useRef<MediaStream | null>(null);
  const webAnalyserRef = useRef<AnalyserNode | null>(null);
  const webAnimationFrameRef = useRef<number | null>(null);
  const webSampleRateRef = useRef(SAMPLE_RATE);
  const lastVolumeRef = useRef(0);

  // Update target MIDI when prop changes
  useEffect(() => {
    targetMidiRef.current = noteNameToMidi(targetNote || "");
  }, [targetNote]);

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === "web") {
        dispatch({ type: "SET_PERMISSION", granted: true });
        return true;
      } else if (Platform.OS === "android") {
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
        dispatch({
          type: "SET_PERMISSION",
          granted: granted === PermissionsAndroid.RESULTS.GRANTED,
        });
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        dispatch({ type: "SET_PERMISSION", granted: true });
        return true;
      }
    } catch (err) {
      devError("Permission error:", err);
      dispatch({
        type: "SET_ERROR",
        error: "Failed to request microphone permission",
      });
      return false;
    }
  }, []);

  // Process incoming audio data (native)
  const processAudioData = useCallback(
    (data: string) => {
      if (!isListeningRef.current) return;

      try {
        const samples = base64ToFloat32Array(data);

        for (let i = 0; i < samples.length; i++) {
          audioBufferRef.current[bufferIndexRef.current] = samples[i];
          bufferIndexRef.current = (bufferIndexRef.current + 1) % BUFFER_SIZE;
        }

        const result = autoCorrelate(
          audioBufferRef.current,
          SAMPLE_RATE,
        ) as AutoCorrelateResult;
        const normalizedVolume = Math.min(1, result.rms * 15);

        if (Math.abs(normalizedVolume - lastVolumeRef.current) > 0.01) {
          lastVolumeRef.current = normalizedVolume;
          dispatch({ type: "SET_VOLUME", volume: normalizedVolume });
        }
        onVolumeChange?.(normalizedVolume);

        const isAboveThreshold = normalizedVolume > volumeThreshold;

        if (isAboveThreshold) {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }

          let validPitchDetected = false;
          if (result.frequency > 0 && result.confidence > 0.5) {
            const noteInfo = frequencyToNote(
              result.frequency,
            ) as NoteInfo | null;
            if (noteInfo) {
              const inDefaultRange =
                noteInfo.frequency >= 80 && noteInfo.frequency <= 1000;
              const inSoundingRange =
                !soundingFrequencyRange ||
                (noteInfo.frequency >= soundingFrequencyRange.min &&
                  noteInfo.frequency <= soundingFrequencyRange.max);

              if (inDefaultRange && inSoundingRange) {
                devLog("[Audio Processing]", result, noteInfo, "IN RANGE");
                if (noteInfo.noteName !== lastPitchNoteRef.current) {
                  lastPitchNoteRef.current = noteInfo.noteName;
                  dispatch({ type: "SET_PITCH", pitch: noteInfo });
                }
              }

              if (inSoundingRange && inDefaultRange) {
                validPitchDetected = true;
              }

              pitchBufferRef.current.push({
                midi: noteInfo.midiNote,
                timestamp: Date.now(),
                noteInfo,
              });

              if (pitchBufferRef.current.length > 100) {
                pitchBufferRef.current = pitchBufferRef.current.slice(-50);
              }

              onRealtimePitch?.(noteInfo);

              if (targetMidiRef.current !== null) {
                const diff = Math.abs(
                  noteInfo.midiNote - targetMidiRef.current,
                );
                const noteMatches = allowOctaveEquivalent
                  ? diff % 12 === 0
                  : diff === 0;
                const isMatch =
                  noteMatches && Math.abs(noteInfo.cents) < pitchMargin;
                onPitchMatch?.(isMatch, noteInfo);
              }
            }
          }

          const shouldTriggerSounding = soundingFrequencyRange
            ? validPitchDetected
            : true;
          if (!soundStartedRef.current && shouldTriggerSounding) {
            soundStartedRef.current = true;
            dispatch({ type: "SET_SOUNDING", isSounding: true });
            onSoundStart?.();
          }
        } else {
          if (soundStartedRef.current && !silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              soundStartedRef.current = false;
              dispatch({ type: "SET_SOUNDING", isSounding: false });

              const cutoff = Date.now() - 1000;
              const recent = pitchBufferRef.current.filter(
                (r) => r.timestamp >= cutoff,
              );

              if (recent.length > 0) {
                const counts: Record<number, number> = {};
                recent.forEach((r) => {
                  counts[r.midi] = (counts[r.midi] || 0) + 1;
                });

                let mostCommon: number | null = null;
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
                  ) as NoteInfo | null;
                  if (finalNote) {
                    onPitchDetected?.(finalNote);
                  }
                }
              }

              pitchBufferRef.current = [];
              if (!isSounding) {
                lastPitchNoteRef.current = null;
                dispatch({ type: "SET_PITCH", pitch: null });
              }
              onSoundEnd?.();
            }, silenceDuration);
          }
        }
      } catch (err) {
        devError("Audio processing error:", err);
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
      soundingFrequencyRange,
    ],
  );

  // Web audio frame processor
  const processWebAudioFrame = useCallback(() => {
    if (!isListeningRef.current || !webAnalyserRef.current) return;

    try {
      const analyser = webAnalyserRef.current;
      const dataArray = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const normalizedVolume = Math.min(1, rms * 15);

      if (Math.abs(normalizedVolume - lastVolumeRef.current) > 0.01) {
        lastVolumeRef.current = normalizedVolume;
        dispatch({ type: "SET_VOLUME", volume: normalizedVolume });
      }
      onVolumeChange?.(normalizedVolume);

      const isAboveThreshold = normalizedVolume > volumeThreshold;

      if (isAboveThreshold) {
        let validPitchDetected = false;
        const result = autoCorrelate(
          dataArray,
          webSampleRateRef.current,
        ) as AutoCorrelateResult;
        if (result.frequency > 0 && result.confidence > 0.5) {
          const noteInfo = frequencyToNote(result.frequency) as NoteInfo | null;
          if (noteInfo) {
            const inDefaultRange =
              noteInfo.frequency >= 80 && noteInfo.frequency <= 1000;
            const inSoundingRange =
              !soundingFrequencyRange ||
              (noteInfo.frequency >= soundingFrequencyRange.min &&
                noteInfo.frequency <= soundingFrequencyRange.max);

            if (inDefaultRange) {
              devLog(
                "[usePitchDetection Web]",
                noteInfo.noteName,
                noteInfo.frequency.toFixed(0) + "Hz",
                inSoundingRange ? "IN RANGE" : "OUT OF RANGE",
              );

              if (inSoundingRange) {
                if (noteInfo.noteName !== lastPitchNoteRef.current) {
                  lastPitchNoteRef.current = noteInfo.noteName;
                  dispatch({ type: "SET_PITCH", pitch: noteInfo });
                }
                onRealtimePitch?.(noteInfo);
              }

              if (targetMidiRef.current !== null) {
                const diff = Math.abs(
                  noteInfo.midiNote - targetMidiRef.current,
                );
                const noteMatches = allowOctaveEquivalent
                  ? diff % 12 === 0
                  : diff === 0;
                const isMatch =
                  noteMatches && Math.abs(noteInfo.cents) < pitchMargin;
                onPitchMatch?.(isMatch, noteInfo);
              }

              if (inSoundingRange) {
                validPitchDetected = true;
              }
            }
          }
        }

        if (validPitchDetected && silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        if (soundingFrequencyRange) {
          if (validPitchDetected && !soundStartedRef.current) {
            soundStartedRef.current = true;
            dispatch({ type: "SET_SOUNDING", isSounding: true });
            onSoundStart?.();
          }
        } else {
          if (!soundStartedRef.current) {
            soundStartedRef.current = true;
            dispatch({ type: "SET_SOUNDING", isSounding: true });
            onSoundStart?.();
          }
        }
      } else {
        if (soundStartedRef.current && !silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            soundStartedRef.current = false;
            dispatch({ type: "SET_SOUNDING", isSounding: false });
            lastPitchNoteRef.current = null;
            dispatch({ type: "SET_PITCH", pitch: null });
            onSoundEnd?.();
          }, silenceDuration);
        }
      }
    } catch (err) {
      devWarn("[usePitchDetection] Frame processing error:", err);
    }

    if (isListeningRef.current) {
      webAnimationFrameRef.current =
        requestAnimationFrame(processWebAudioFrame);
    }
  }, [
    onVolumeChange,
    onSoundStart,
    onSoundEnd,
    onRealtimePitch,
    onPitchMatch,
    volumeThreshold,
    silenceDuration,
    pitchMargin,
    allowOctaveEquivalent,
    soundingFrequencyRange,
  ]);

  const ownsAudioContextRef = useRef(false);
  const isStartingRef = useRef(false);

  // Start listening - web version
  const startListeningWeb = useCallback(async () => {
    if (isListeningRef.current || isStartingRef.current) {
      devLog("[usePitchDetection] Already listening or starting, skipping");
      return;
    }
    isStartingRef.current = true;

    try {
      devLog("[usePitchDetection] Starting web audio...");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      if (!isStartingRef.current) {
        devLog("[usePitchDetection] Cancelled during getUserMedia");
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      webMediaStreamRef.current = stream;

      let audioContext: AudioContext;
      if (externalAudioContext) {
        audioContext = externalAudioContext;
        ownsAudioContextRef.current = false;
        devLog("[usePitchDetection] Using external AudioContext");
      } else {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        audioContext = new AudioContextClass();
        ownsAudioContextRef.current = true;
        devLog("[usePitchDetection] Created new AudioContext");
      }

      webAudioContextRef.current = audioContext;
      webSampleRateRef.current = audioContext.sampleRate;
      devLog("[usePitchDetection] Using sample rate:", audioContext.sampleRate);

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = BUFFER_SIZE;
      webAnalyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      isListeningRef.current = true;
      isStartingRef.current = false;
      dispatch({ type: "START_LISTENING" });

      processWebAudioFrame();

      devLog("[usePitchDetection] Web audio started");
    } catch (err) {
      devError("Web audio start error:", err);
      dispatch({
        type: "SET_ERROR",
        error: `Failed to start microphone: ${err instanceof Error ? err.message : String(err)}`,
      });
      isStartingRef.current = false;
    }
  }, [processWebAudioFrame, externalAudioContext]);

  // Stop listening - web version
  const stopListeningWeb = useCallback(() => {
    devLog("[usePitchDetection] Stopping web audio");
    isListeningRef.current = false;
    isStartingRef.current = false;

    if (webAnimationFrameRef.current) {
      cancelAnimationFrame(webAnimationFrameRef.current);
      webAnimationFrameRef.current = null;
    }

    if (webMediaStreamRef.current) {
      webMediaStreamRef.current.getTracks().forEach((track) => track.stop());
      webMediaStreamRef.current = null;
    }

    if (webAudioContextRef.current && ownsAudioContextRef.current) {
      webAudioContextRef.current.close();
    }
    webAudioContextRef.current = null;
    webAnalyserRef.current = null;

    dispatch({ type: "STOP_LISTENING" });
    lastPitchNoteRef.current = null;
    lastVolumeRef.current = 0;
    soundStartedRef.current = false;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // Start listening - native version
  const startListeningNative = useCallback(async () => {
    if (!LiveAudioStream) {
      dispatch({
        type: "SET_ERROR",
        error:
          "Native audio streaming not available. Please use Expo Dev Client.",
      });
      return;
    }

    if (isListeningRef.current) return;

    try {
      devLog("[usePitchDetection] Initializing native audio stream...");

      LiveAudioStream.init({
        sampleRate: SAMPLE_RATE,
        channels: 1,
        bitsPerSample: 16,
        audioSource: 6,
        bufferSize: BUFFER_SIZE,
      });

      LiveAudioStream.on("data", processAudioData);

      LiveAudioStream.start();
      isListeningRef.current = true;
      dispatch({ type: "START_LISTENING" });
      devLog("[usePitchDetection] Native audio started");
    } catch (err) {
      devError("Native audio start error:", err);
      dispatch({
        type: "SET_ERROR",
        error: `Failed to start audio: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }, [processAudioData]);

  // Stop listening - native version
  const stopListeningNative = useCallback(() => {
    if (!LiveAudioStream || !isListeningRef.current) return;

    try {
      devLog("[usePitchDetection] Stopping native audio");
      isListeningRef.current = false;
      LiveAudioStream.stop();
      dispatch({ type: "STOP_LISTENING" });
      lastPitchNoteRef.current = null;
      lastVolumeRef.current = 0;
      soundStartedRef.current = false;

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    } catch (err) {
      devWarn("Stop listening error:", err);
    }
  }, []);

  // Platform-aware start/stop
  const startListening = useCallback(async () => {
    if (Platform.OS === "web") {
      await startListeningWeb();
    } else {
      await startListeningNative();
    }
  }, [startListeningWeb, startListeningNative]);

  const stopListening = useCallback(() => {
    if (Platform.OS === "web") {
      stopListeningWeb();
    } else {
      stopListeningNative();
    }
  }, [stopListeningWeb, stopListeningNative]);

  // Use refs to avoid effect re-running when functions change
  const startListeningRef = useRef(startListening);
  const stopListeningRef = useRef(stopListening);
  const permissionGrantedRef = useRef(permissionGranted);
  useEffect(() => {
    startListeningRef.current = startListening;
    stopListeningRef.current = stopListening;
    permissionGrantedRef.current = permissionGranted;
  });

  // Handle enabled state
  useEffect(() => {
    let isCancelled = false;

    const setup = async () => {
      if (enabled) {
        let hasPermission = permissionGrantedRef.current;
        if (!hasPermission) {
          hasPermission = await requestPermission();
        }
        if (hasPermission && !isCancelled) {
          startListeningRef.current();
        }
      } else {
        stopListeningRef.current();
      }
    };

    setup();

    return () => {
      isCancelled = true;
      stopListeningRef.current();
    };
  }, [enabled, requestPermission]);

  return {
    isListening,
    permissionGranted,
    error,
    currentPitch,
    volume,
    isSounding,
    isAvailable: Platform.OS === "web" || !!LiveAudioStream,
    startListening,
    stopListening,
  };
}
