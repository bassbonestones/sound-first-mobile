import { useState, useRef, useEffect, useCallback } from "react";
import { Platform, PermissionsAndroid } from "react-native";
import { devLog, devWarn, devError } from "../utils/devLogger";
import {
  frequencyToNote,
  noteNameToMidi,
  autoCorrelate,
  base64ToFloat32Array,
} from "../utils/audioUtils";

// Import live audio stream for native audio access (not available on web)
let LiveAudioStream = null;
if (Platform.OS !== "web") {
  try {
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
  externalAudioContext = null, // Optional: share AudioContext with caller to avoid conflicts
  soundingFrequencyRange = null, // Optional: {min, max} - only trigger isSounding for pitches in this Hz range
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
  const lastPitchNoteRef = useRef(null); // Track previous pitch to avoid unnecessary state updates

  // Web-specific refs
  const webAudioContextRef = useRef(null);
  const webMediaStreamRef = useRef(null);
  const webAnalyserRef = useRef(null);
  const webAnimationFrameRef = useRef(null);
  const webSampleRateRef = useRef(SAMPLE_RATE);
  const lastVolumeRef = useRef(0); // Track previous volume to avoid unnecessary state updates

  // Update target MIDI when prop changes
  useEffect(() => {
    targetMidiRef.current = noteNameToMidi(targetNote);
  }, [targetNote]);

  // Request microphone permission
  const requestPermission = useCallback(async () => {
    try {
      if (Platform.OS === "web") {
        // Web: getUserMedia will prompt for permission
        setPermissionGranted(true);
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
        setPermissionGranted(granted === PermissionsAndroid.RESULTS.GRANTED);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // iOS handles permissions automatically when starting the stream
        setPermissionGranted(true);
        return true;
      }
    } catch (err) {
      devError("Permission error:", err);
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

        // Only update state if volume changed significantly (avoid excessive re-renders)
        if (Math.abs(normalizedVolume - lastVolumeRef.current) > 0.01) {
          lastVolumeRef.current = normalizedVolume;
          setVolume(normalizedVolume);
        }
        onVolumeChange?.(normalizedVolume);

        const isAboveThreshold = normalizedVolume > volumeThreshold;

        if (isAboveThreshold) {
          // Clear silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }

          // Pitch detection
          let validPitchDetected = false;
          if (result.frequency > 0 && result.confidence > 0.5) {
            const noteInfo = frequencyToNote(result.frequency);
            if (noteInfo) {
              // Check if pitch is in the valid range for "sounding"
              const inDefaultRange =
                noteInfo.frequency >= 80 && noteInfo.frequency <= 1000;
              const inSoundingRange =
                !soundingFrequencyRange ||
                (noteInfo.frequency >= soundingFrequencyRange.min &&
                  noteInfo.frequency <= soundingFrequencyRange.max);

              // Only set currentPitch if in soundingFrequencyRange (when specified) to filter out metronome etc
              if (inDefaultRange && inSoundingRange) {
                devLog("[Audio Processing]", result, noteInfo, "IN RANGE");
                // Only update state if note changed (avoid excessive re-renders)
                if (noteInfo.noteName !== lastPitchNoteRef.current) {
                  lastPitchNoteRef.current = noteInfo.noteName;
                  setCurrentPitch(noteInfo);
                }
              }

              // Only count as valid pitch for isSounding if in the specified range
              if (inSoundingRange && inDefaultRange) {
                validPitchDetected = true;
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

          // Fire sound start - either based on valid pitch (if range specified) or just volume
          const shouldTriggerSounding = soundingFrequencyRange
            ? validPitchDetected
            : true;
          if (!soundStartedRef.current && shouldTriggerSounding) {
            soundStartedRef.current = true;
            setIsSounding(true);
            onSoundStart?.();
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
              if (!isSounding) {
                lastPitchNoteRef.current = null;
                setCurrentPitch(null);
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

      // Calculate RMS volume
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const normalizedVolume = Math.min(1, rms * 15);

      // Only update state if volume changed significantly (avoid excessive re-renders)
      if (Math.abs(normalizedVolume - lastVolumeRef.current) > 0.01) {
        lastVolumeRef.current = normalizedVolume;
        setVolume(normalizedVolume);
      }
      onVolumeChange?.(normalizedVolume);

      const isAboveThreshold = normalizedVolume > volumeThreshold;

      if (isAboveThreshold) {
        // Run pitch detection first to check if it's in range
        let validPitchDetected = false;
        let outOfRangePitchDetected = false;
        const result = autoCorrelate(dataArray, webSampleRateRef.current);
        if (result.frequency > 0 && result.confidence > 0.5) {
          const noteInfo = frequencyToNote(result.frequency);
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

              // Only set currentPitch if in soundingFrequencyRange (when specified) to filter out metronome etc
              if (inSoundingRange) {
                // Only update state if note changed (avoid excessive re-renders)
                if (noteInfo.noteName !== lastPitchNoteRef.current) {
                  lastPitchNoteRef.current = noteInfo.noteName;
                  setCurrentPitch(noteInfo);
                }
                onRealtimePitch?.(noteInfo);
              }

              // Check target match
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
              } else if (soundingFrequencyRange) {
                // We detected a pitch outside the sounding range (e.g., metronome click)
                outOfRangePitchDetected = true;
              }
            }
          }
        }

        // Only clear silence timer if we detect a valid in-range pitch
        // (Don't let metronome clicks interrupt the silence timer)
        if (validPitchDetected && silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        // Handle sounding state based on pitch detection
        if (soundingFrequencyRange) {
          // When using frequency range filtering:
          // - Turn ON when valid pitch in range is detected
          // - Keep ON during out-of-range sounds (like metronome over sustained user playing)
          // - Only turn OFF when volume drops (handled in else block below)
          if (validPitchDetected && !soundStartedRef.current) {
            soundStartedRef.current = true;
            setIsSounding(true);
            onSoundStart?.();
          }
          // Note: We intentionally do NOT turn off isSounding for out-of-range pitches
          // because the user might be sustaining a note while the metronome clicks
        } else {
          // No frequency filtering - just use volume threshold
          if (!soundStartedRef.current) {
            soundStartedRef.current = true;
            setIsSounding(true);
            onSoundStart?.();
          }
        }
      } else {
        // Below threshold - start silence timer
        if (soundStartedRef.current && !silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            soundStartedRef.current = false;
            setIsSounding(false);
            lastPitchNoteRef.current = null;
            setCurrentPitch(null);
            onSoundEnd?.();
          }, silenceDuration);
        }
      }
    } catch (err) {
      devWarn("[usePitchDetection] Frame processing error:", err);
    }

    // Continue animation loop (even after errors, try to recover)
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

  // Track if we own the AudioContext (should close it) or if it's external (don't close)
  const ownsAudioContextRef = useRef(false);
  const isStartingRef = useRef(false); // Prevent concurrent start calls

  // Start listening - web version
  const startListeningWeb = useCallback(async () => {
    // Prevent concurrent starts
    if (isListeningRef.current || isStartingRef.current) {
      devLog("[usePitchDetection] Already listening or starting, skipping");
      return;
    }
    isStartingRef.current = true;

    try {
      devLog("[usePitchDetection] Starting web audio...");

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      // Check if we were stopped while waiting for getUserMedia
      if (!isStartingRef.current) {
        devLog("[usePitchDetection] Cancelled during getUserMedia");
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      webMediaStreamRef.current = stream;

      // Use external AudioContext if provided, otherwise create our own
      let audioContext;
      if (externalAudioContext) {
        audioContext = externalAudioContext;
        ownsAudioContextRef.current = false;
        devLog("[usePitchDetection] Using external AudioContext");
      } else {
        const AudioContextClass =
          window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContextClass();
        ownsAudioContextRef.current = true;
        devLog("[usePitchDetection] Created new AudioContext");
      }

      webAudioContextRef.current = audioContext;
      webSampleRateRef.current = audioContext.sampleRate;
      devLog("[usePitchDetection] Using sample rate:", audioContext.sampleRate);

      // Resume context if suspended (required after user interaction)
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      // Create analyser
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = BUFFER_SIZE;
      webAnalyserRef.current = analyser;

      // Connect stream to analyser
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      isListeningRef.current = true;
      isStartingRef.current = false;
      setIsListening(true);
      setError(null);

      // Start processing
      processWebAudioFrame();

      devLog("[usePitchDetection] Web audio started");
    } catch (err) {
      devError("Web audio start error:", err);
      setError(`Failed to start microphone: ${err.message}`);
      isStartingRef.current = false;
    }
  }, [processWebAudioFrame, externalAudioContext]);

  // Stop listening - web version
  const stopListeningWeb = useCallback(() => {
    devLog("[usePitchDetection] Stopping web audio");
    isListeningRef.current = false;
    isStartingRef.current = false; // Cancel any pending start

    if (webAnimationFrameRef.current) {
      cancelAnimationFrame(webAnimationFrameRef.current);
      webAnimationFrameRef.current = null;
    }

    if (webMediaStreamRef.current) {
      webMediaStreamRef.current.getTracks().forEach((track) => track.stop());
      webMediaStreamRef.current = null;
    }

    // Only close AudioContext if we created it (not external)
    if (webAudioContextRef.current && ownsAudioContextRef.current) {
      webAudioContextRef.current.close();
    }
    webAudioContextRef.current = null;

    webAnalyserRef.current = null;

    setIsListening(false);
    setVolume(0);
    lastPitchNoteRef.current = null;
    lastVolumeRef.current = 0;
    setCurrentPitch(null);
    setIsSounding(false);
    soundStartedRef.current = false;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // Start listening - native version
  const startListeningNative = useCallback(async () => {
    if (!LiveAudioStream) {
      setError(
        "Native audio streaming not available. Please use Expo Dev Client.",
      );
      return;
    }

    if (isListeningRef.current) return;

    try {
      devLog("[usePitchDetection] Initializing native audio stream...");

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
      devLog("[usePitchDetection] Native audio started");
    } catch (err) {
      devError("Native audio start error:", err);
      setError(`Failed to start audio: ${err.message}`);
    }
  }, [processAudioData]);

  // Stop listening - native version
  const stopListeningNative = useCallback(() => {
    if (!LiveAudioStream || !isListeningRef.current) return;

    try {
      devLog("[usePitchDetection] Stopping native audio");
      isListeningRef.current = false;
      LiveAudioStream.stop();
      setIsListening(false);
      setVolume(0);
      lastPitchNoteRef.current = null;
      lastVolumeRef.current = 0;
      setCurrentPitch(null);
      setIsSounding(false);
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

  // Handle enabled state - ONLY depends on enabled
  // We use refs for everything else to prevent re-triggering
  useEffect(() => {
    let isCancelled = false;

    const setup = async () => {
      if (enabled) {
        // Check permission using ref to avoid dependency
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
  }, [enabled]); // Only re-run when enabled changes

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
