/**
 * StartOnCueExercise - "Enter on One" drill
 *
 * Plays a steady beat with count-in.
 * User must play their first note precisely on beat 1.
 * Uses pitch detection to know when the user starts playing.
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
import { usePitchDetection } from "../../../../hooks/usePitchDetection";

// Import AudioContext
let NativeAudioContext = null;
if (Platform.OS !== "web") {
  try {
    NativeAudioContext = require("react-native-audio-api").AudioContext;
  } catch (e) {
    console.warn("react-native-audio-api not available");
  }
}

// Default timing tolerance - generous for beginners (~1/8 note at 60 BPM)
// This allows being up to an 8th note early or late and still counting as success
const DEFAULT_TOLERANCE_MS = 450;

/**
 * Create a noise-based click sound using Web Audio
 * Uses white noise to avoid confusing pitch detection with any instrument.
 */
function createClickSound(
  audioContext,
  frequency = 1000,
  duration = 0.05,
  volume = 0.5,
) {
  const sampleRate = audioContext.sampleRate;
  const bufferSize = Math.floor(sampleRate * duration * 2);
  const buffer = audioContext.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  // Fill with white noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;

  // Highpass filter - frequency param controls brightness (cooler sound)
  const filter = audioContext.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 800 + ((frequency - 700) / 500) * 1200;
  filter.Q.value = 0.7;

  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(volume * 1.5, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + duration,
  );

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);

  source.start(audioContext.currentTime);
}

export default function StartOnCueExercise({
  config,
  mastery,
  onComplete,
  onProgress,
  userFirstNote = "F3",
}) {
  // Config defaults
  const bpm = config?.bpm || 60;
  const beatsPerMeasure = config?.beats_per_measure || 4;
  const masteryStreak = mastery?.correct_streak || 8;
  const prepBeats = config?.count_in_beats || 4;
  const timingToleranceMs = config?.timing_tolerance_ms || DEFAULT_TOLERANCE_MS;
  const targetBeat = config?.target_beat || 1;

  // State
  const [phase, setPhase] = useState("ready"); // ready | counting | listening | feedback
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [lastFeedback, setLastFeedback] = useState(null);
  const [wrongNoteInfo, setWrongNoteInfo] = useState(null); // { detectedNote, direction }
  const [prepCount, setPrepCount] = useState(prepBeats);
  const [waitingForEntry, setWaitingForEntry] = useState(false);
  const [isPlayingNote, setIsPlayingNote] = useState(false);

  // Animation
  const [pulseAnim] = useState(new Animated.Value(1));
  const [feedbackOpacity] = useState(new Animated.Value(0));

  // Create AudioContext immediately (shared between metronome and pitch detection)
  // Using state so we can pass it to usePitchDetection and re-render when it's ready
  const [sharedAudioContext] = useState(() => {
    if (Platform.OS === "web") {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      return new AudioContextClass();
    } else if (NativeAudioContext) {
      return new NativeAudioContext();
    }
    return null;
  });

  // Refs
  const audioContextRef = useRef(sharedAudioContext);
  const beatIntervalRef = useRef(null);
  const lastBeatOneTimeRef = useRef(0);
  const currentBeatRef = useRef(0);
  const hasEnteredRef = useRef(false);
  const measureCountRef = useRef(0);
  const handleEntryRef = useRef(null);
  const startNewRoundRef = useRef(null);
  const unmountedRef = useRef(false);
  const timeoutRefs = useRef([]);
  const sustainTimerRef = useRef(null);
  const soundStartTimeRef = useRef(null);

  // Minimum sustain time to filter out transients
  // Brass instruments need longer for the fundamental to stabilize past attack overtones
  const MIN_SUSTAIN_MS = 150;

  // Beat interval in ms
  const beatIntervalMs = (60 / bpm) * 1000;

  // Calculate target MIDI note from userFirstNote (for pitch comparison)
  // Using MIDI comparison is more reliable than frequency because pitch detection
  // can return overtones instead of fundamentals on brass instruments
  const targetMidiNote = React.useMemo(() => {
    const noteMap = {
      C: 0,
      "C#": 1,
      Db: 1,
      D: 2,
      "D#": 3,
      Eb: 3,
      E: 4,
      F: 5,
      "F#": 6,
      Gb: 6,
      G: 7,
      "G#": 8,
      Ab: 8,
      A: 9,
      "A#": 10,
      Bb: 10,
      B: 11,
    };
    const match = userFirstNote.match(/^([A-Ga-g][#b]?)(\d)$/);
    if (match) {
      const [, note, octaveStr] = match;
      const semitone = noteMap[note.charAt(0).toUpperCase() + note.slice(1)];
      const octave = parseInt(octaveStr, 10);
      if (semitone !== undefined) {
        const midi = (octave + 1) * 12 + semitone;
        const freq = 440 * Math.pow(2, (midi - 69) / 12);
        console.log(
          `[StartOnCueExercise] Target note ${userFirstNote} = MIDI ${midi} (~${freq.toFixed(1)}Hz), tolerance: ±3 semitones`,
        );
        return midi;
      }
    }
    return 53; // F3 as fallback
  }, [userFirstNote]);

  // Helper: convert frequency to MIDI note number
  const frequencyToMidi = React.useCallback((freq) => {
    if (!freq || freq < 50) return null;
    return Math.round(12 * Math.log2(freq / 440) + 69);
  }, []);

  // Helper: convert MIDI note number to note name (e.g., 53 -> "F3")
  const midiToNoteName = React.useCallback((midi) => {
    if (midi === null || midi === undefined) return null;
    const noteNames = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];
    const octave = Math.floor(midi / 12) - 1;
    const noteIndex = midi % 12;
    return `${noteNames[noteIndex]}${octave}`;
  }, []);

  // Keep pitch detection alive for the entire exercise duration (not toggling per round)
  // This prevents AudioContext from being repeatedly created/destroyed
  const exerciseActive = phase !== "ready";

  // Pitch detection - to know when user starts playing
  // Don't use onSoundStart - it fires on metronome clicks too
  // Share AudioContext with metronome on web to avoid conflicts
  const {
    volume,
    currentPitch,
    isListening,
    isSounding,
    error: pitchError,
  } = usePitchDetection({
    volumeThreshold: 0.08, // Slightly higher to reduce false positives from metronome
    silenceDuration: 500,
    enabled: exerciseActive, // Keep running while exercise is active
    externalAudioContext: Platform.OS === "web" ? sharedAudioContext : null,
    // Detect any instrument sound (60-700Hz) but exclude metronome (800Hz+)
    // We'll check if it's the RIGHT pitch separately
    soundingFrequencyRange: { min: 60, max: 700 },
  });

  // Track if user was already playing when we started listening
  const waitingForNewSoundRef = useRef(false);
  // Capture whether user was already sounding AT THE MOMENT waitingForEntry becomes true
  const wasSoundingAtListenStartRef = useRef(false);
  // Track current isSounding value in a ref (for use in callbacks with stale closures)
  const isSoundingRef = useRef(false);
  // Track current pitch for checking in callbacks
  const currentPitchRef = useRef(null);
  // Capture the pitch at sound START time (for validation)
  const soundStartPitchRef = useRef(null);
  // Buffer to collect MIDI readings during sustain for averaging (filters out transient overtone detections)
  const pitchBufferRef = useRef([]);

  // Keep isSoundingRef in sync with isSounding
  useEffect(() => {
    isSoundingRef.current = isSounding;
  }, [isSounding]);

  // Keep currentPitchRef in sync with currentPitch AND buffer MIDI readings
  useEffect(() => {
    currentPitchRef.current = currentPitch;
    // Buffer MIDI readings when sound is detected (for averaging to filter out transient overtones)
    if (currentPitch?.midiNote && soundStartTimeRef.current) {
      pitchBufferRef.current.push(currentPitch.midiNote);
      // Keep buffer from growing too large (last 50 readings)
      if (pitchBufferRef.current.length > 50) {
        pitchBufferRef.current = pitchBufferRef.current.slice(-50);
      }
    }
  }, [currentPitch]);

  // Watch for sustained sound to trigger entry
  // Only respond when we're actually waiting for entry
  useEffect(() => {
    if (!waitingForEntry || hasEnteredRef.current) {
      // Clear timer if not waiting
      if (sustainTimerRef.current) {
        clearTimeout(sustainTimerRef.current);
        sustainTimerRef.current = null;
      }
      soundStartTimeRef.current = null;
      soundStartPitchRef.current = null;
      waitingForNewSoundRef.current = false;
      return;
    }

    // Check if user was already playing when we STARTED listening (captured synchronously)
    // This prevents false positives when user plays exactly on beat 1
    if (!waitingForNewSoundRef.current && !soundStartTimeRef.current) {
      if (wasSoundingAtListenStartRef.current) {
        // User was genuinely playing BEFORE beat 1 - that's an early entry!
        console.log(
          "[StartOnCueExercise] User was already playing when listening started - counting as EARLY",
        );
        wasSoundingAtListenStartRef.current = false; // Reset so we only check once
        // Set soundStartTimeRef to before beat 1 so timing calculation shows "early"
        soundStartTimeRef.current = lastBeatOneTimeRef.current - 500;
        soundStartPitchRef.current = currentPitchRef.current?.frequency || null; // Capture current pitch frequency
        // Trigger entry immediately - will be marked as early
        handleEntryRef.current?.();
        return;
      }
    }

    if (isSounding) {
      // If waiting for new sound (they were holding from before), keep waiting
      if (waitingForNewSoundRef.current) {
        return;
      }

      // New sound started - record time, pitch, and start sustain timer
      if (!soundStartTimeRef.current) {
        const now = Date.now();
        const timeSinceBeatOne = now - lastBeatOneTimeRef.current;
        soundStartTimeRef.current = now;
        // currentPitch is an object with .frequency property
        soundStartPitchRef.current = currentPitchRef.current?.frequency || null;
        console.log(
          "[StartOnCueExercise] Sound detected at",
          now,
          "pitch=",
          soundStartPitchRef.current?.toFixed(1),
          "Hz, timeSinceBeatOne=",
          timeSinceBeatOne,
        );
        sustainTimerRef.current = setTimeout(() => {
          // Sound has been sustained long enough - this is real user input
          if (waitingForEntry && !hasEnteredRef.current && isSounding) {
            console.log(
              "[StartOnCueExercise] Sustained long enough, triggering entry",
            );
            handleEntryRef.current?.();
          }
        }, MIN_SUSTAIN_MS);
      }
    } else {
      // Sound stopped - clear timer
      if (sustainTimerRef.current) {
        clearTimeout(sustainTimerRef.current);
        sustainTimerRef.current = null;
        console.log("[StartOnCueExercise] Sound stopped, clearing timer");
      }
      soundStartTimeRef.current = null;
      soundStartPitchRef.current = null;
      pitchBufferRef.current = []; // Clear buffer on sound stop
      // They released - now we can detect a fresh sound
      if (waitingForNewSoundRef.current) {
        console.log(
          "[StartOnCueExercise] User released - now listening for fresh sound",
        );
        waitingForNewSoundRef.current = false;
      }
    }
  }, [isSounding, waitingForEntry]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log(
        "[StartOnCueExercise] Cleanup - stopping metronome and audio",
      );
      unmountedRef.current = true;
      if (beatIntervalRef.current) {
        clearInterval(beatIntervalRef.current);
        beatIntervalRef.current = null;
      }
      if (sustainTimerRef.current) {
        clearTimeout(sustainTimerRef.current);
        sustainTimerRef.current = null;
      }
      // Clear all pending timeouts
      timeoutRefs.current.forEach((id) => clearTimeout(id));
      timeoutRefs.current = [];
      // Close the shared AudioContext
      if (sharedAudioContext) {
        try {
          sharedAudioContext.close();
        } catch (e) {
          console.warn("Error closing audio context:", e);
        }
      }
    };
  }, [sharedAudioContext]);

  // Safe setTimeout that tracks refs for cleanup
  const safeTimeout = useCallback((fn, delay) => {
    if (unmountedRef.current) return;
    const id = setTimeout(() => {
      if (!unmountedRef.current) {
        fn();
      }
    }, delay);
    timeoutRefs.current.push(id);
    return id;
  }, []);

  // Play a beat click
  const playBeat = useCallback(async (isAccent = false) => {
    if (!audioContextRef.current) return;

    // Resume AudioContext if suspended (required by browsers)
    if (audioContextRef.current.state === "suspended") {
      try {
        await audioContextRef.current.resume();
      } catch (e) {
        console.warn("Failed to resume AudioContext:", e);
      }
    }

    const freq = isAccent ? 1200 : 800;
    const vol = isAccent ? 0.7 : 0.5;
    createClickSound(audioContextRef.current, freq, 0.05, vol);
  }, []);

  // Convert note name to frequency
  const noteToFrequency = useCallback((noteName) => {
    const noteMap = {
      C: 0,
      "C#": 1,
      Db: 1,
      D: 2,
      "D#": 3,
      Eb: 3,
      E: 4,
      F: 5,
      "F#": 6,
      Gb: 6,
      G: 7,
      "G#": 8,
      Ab: 8,
      A: 9,
      "A#": 10,
      Bb: 10,
      B: 11,
    };
    const match = noteName.match(/^([A-Ga-g][#b]?)(\d)$/);
    if (!match) return 440;
    const [, note, octaveStr] = match;
    const semitone = noteMap[note.charAt(0).toUpperCase() + note.slice(1)];
    const octave = parseInt(octaveStr, 10);
    if (semitone === undefined) return 440;
    const midiNote = (octave + 1) * 12 + semitone;
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }, []);

  // Play the target note so user can hear it
  const playTargetNote = useCallback(() => {
    if (
      !audioContextRef.current ||
      audioContextRef.current.state === "closed" ||
      isPlayingNote
    )
      return;

    setIsPlayingNote(true);
    const freq = noteToFrequency(userFirstNote);
    const duration = 1.5;
    const attackTime = 0.05; // Smooth fade-in to avoid click
    const releaseTime = 0.3; // Smooth fade-out
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = freq;
    oscillator.type = "sine";

    // Smooth envelope: fade in, sustain, fade out (avoids clicks)
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.4, now + attackTime);
    gainNode.gain.setValueAtTime(0.4, now + duration - releaseTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);

    safeTimeout(() => setIsPlayingNote(false), duration * 1000);
  }, [userFirstNote, noteToFrequency, isPlayingNote, safeTimeout]);

  // Pulse animation
  const animatePulse = useCallback(
    (isBeatOne = false) => {
      const scale = isBeatOne ? 1.3 : 1.15;
      pulseAnim.setValue(scale);
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    },
    [pulseAnim],
  );

  // Show feedback
  const showFeedback = useCallback(
    (feedback) => {
      setLastFeedback(feedback);
      feedbackOpacity.setValue(1);
      Animated.timing(feedbackOpacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start();
    },
    [feedbackOpacity],
  );

  // Stop metronome
  const stopMetronome = useCallback(() => {
    if (beatIntervalRef.current) {
      clearInterval(beatIntervalRef.current);
      beatIntervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Handle when user plays a note
  const handleEntry = useCallback(() => {
    if (hasEnteredRef.current) return;
    hasEnteredRef.current = true;
    setWaitingForEntry(false);

    // Use pitch buffering to filter out transient overtone detections
    // Key insight: brass instruments produce overtones during attack that can briefly dominate
    // The FUNDAMENTAL (lowest pitch) is what the user is actually playing
    let detectedMidi = null;
    if (pitchBufferRef.current.length > 0) {
      // Count votes for each MIDI note
      const counts = {};
      pitchBufferRef.current.forEach((midi) => {
        counts[midi] = (counts[midi] || 0) + 1;
      });

      // Any pitch that appears at least twice is a candidate
      // We use a low threshold because the fundamental may only appear briefly during attack
      // while overtones can dominate, but the fundamental IS there
      const MIN_VOTES = 2;
      const candidates = Object.entries(counts)
        .filter(([, count]) => count >= MIN_VOTES)
        .map(([midi]) => parseInt(midi, 10));

      // Pick the LOWEST MIDI note (fundamental frequency) among candidates
      // Overtones are always HIGHER than the fundamental
      if (candidates.length > 0) {
        detectedMidi = Math.min(...candidates);
      } else {
        // If no pitch got 2+ votes, fall back to most common
        let maxCount = 0;
        Object.entries(counts).forEach(([midi, count]) => {
          if (count > maxCount) {
            maxCount = count;
            detectedMidi = parseInt(midi, 10);
          }
        });
      }

      console.log(
        `[Entry] Pitch buffer:`,
        counts,
        `-> candidates (>=${MIN_VOTES} votes):`,
        candidates,
        `-> lowest (fundamental): MIDI ${detectedMidi}`,
      );
    } else if (currentPitchRef.current?.midiNote) {
      // Fallback to current pitch if buffer is empty
      detectedMidi = currentPitchRef.current.midiNote;
    }

    // Check if pitch is within ±3 semitones of target
    const PITCH_TOLERANCE_SEMITONES = 3;
    let isPitchCorrect = true; // Assume correct if we can't detect
    if (detectedMidi !== null) {
      const midiDiff = Math.abs(detectedMidi - targetMidiNote);
      isPitchCorrect = midiDiff <= PITCH_TOLERANCE_SEMITONES;
      console.log(
        `[Entry] Most common MIDI ${detectedMidi} (${midiToNoteName(detectedMidi)}), target: MIDI ${targetMidiNote}, diff: ${midiDiff} semitones, correct: ${isPitchCorrect}`,
      );
    } else {
      console.log(`[Entry] No pitch detected, skipping pitch validation`);
    }

    // If wrong pitch, fail immediately regardless of timing
    if (!isPitchCorrect) {
      stopMetronome();
      setStreak(0);
      setTotalAttempts((t) => t + 1);

      // Store info about the wrong note for display
      const detectedNoteName = midiToNoteName(detectedMidi);
      const direction = detectedMidi < targetMidiNote ? "higher" : "lower";
      setWrongNoteInfo({ detectedNote: detectedNoteName, direction });

      showFeedback("wrong_note");

      onProgress?.({
        streak: 0,
        masteryRequired: masteryStreak,
        totalAttempts: totalAttempts + 1,
      });

      setPhase("feedback");
      safeTimeout(() => {
        startNewRoundRef.current?.();
      }, 1500);
      return;
    }

    // Use the ACTUAL sound start time, not current time
    // This compensates for the sustain detection delay
    const entryTime = soundStartTimeRef.current || Date.now();
    const timeSinceBeatOne = entryTime - lastBeatOneTimeRef.current;
    const measureDuration = beatsPerMeasure * beatIntervalMs;

    // Calculate distance to nearest beat 1 (handles both early and late)
    // Positive timeSinceBeatOne means after beat 1, negative means before
    const positionInMeasure =
      ((timeSinceBeatOne % measureDuration) + measureDuration) %
      measureDuration;
    const timeToNextBeatOne = measureDuration - positionInMeasure;

    console.log(
      `[Entry] timeSinceBeatOne=${timeSinceBeatOne}ms, positionInMeasure=${positionInMeasure}ms, timeToNextBeatOne=${timeToNextBeatOne}ms, tolerance=${timingToleranceMs}ms`,
    );

    // Check timing - was it close to beat 1?
    // isNearBeatOne: started AFTER beat 1 but within tolerance (slightly late is OK)
    // isAnticipatoryBeatOne: started just BEFORE beat 1 (slightly early is OK)
    //
    // The key insight: timeSinceBeatOne can be:
    // - Positive and small (<= tolerance): just after beat 1, good timing
    // - Negative but small (>= -tolerance): just before beat 1, good anticipation
    // - Negative and large (< -tolerance): started way too early (e.g., during count-in)
    // - Positive and large: in the middle of the measure
    const isNearBeatOne =
      timeSinceBeatOne >= -timingToleranceMs &&
      timeSinceBeatOne <= timingToleranceMs;

    // Also check anticipation of the NEXT beat 1 (for when they're close to the end of a measure)
    const isAnticipatoryNextBeatOne =
      timeToNextBeatOne <= timingToleranceMs &&
      timeSinceBeatOne >= measureDuration - timingToleranceMs;

    // Stop the current metronome - we'll restart with a new round
    stopMetronome();
    setWaitingForEntry(false);

    setTotalAttempts((t) => t + 1);

    if (isNearBeatOne || isAnticipatoryNextBeatOne) {
      // Success!
      const newStreak = streak + 1;
      setStreak(newStreak);

      // Calculate how close they were to perfect
      const deviation = isNearBeatOne
        ? Math.abs(timeSinceBeatOne)
        : timeToNextBeatOne;
      if (deviation <= timingToleranceMs / 2) {
        showFeedback("perfect");
      } else {
        showFeedback("good");
      }

      // Check mastery
      if (newStreak >= masteryStreak) {
        safeTimeout(() => {
          onComplete?.({
            success: true,
            streak: newStreak,
            totalAttempts: totalAttempts + 1,
            correctCount: newStreak,
          });
        }, 1000);
        return;
      }

      onProgress?.({
        streak: newStreak,
        masteryRequired: masteryStreak,
        totalAttempts: totalAttempts + 1,
      });
    } else {
      // Wrong timing
      setStreak(0);

      // Determine if early or late
      if (timeSinceBeatOne < -timingToleranceMs) {
        // Started way before this beat 1 (e.g., during count-in)
        showFeedback("early");
      } else if (timeSinceBeatOne < 0) {
        // This shouldn't happen due to isNearBeatOne check, but just in case
        showFeedback("early");
      } else if (positionInMeasure <= measureDuration / 2) {
        // In the first half of the measure - they were late after beat 1
        showFeedback("late");
      } else {
        // In the second half - they were early for the next beat 1
        showFeedback("early");
      }

      onProgress?.({
        streak: 0,
        masteryRequired: masteryStreak,
        totalAttempts: totalAttempts + 1,
      });
    }

    // Show feedback phase briefly, then start new round
    setPhase("feedback");
    safeTimeout(() => {
      startNewRoundRef.current?.();
    }, 1500);
  }, [
    streak,
    masteryStreak,
    totalAttempts,
    beatsPerMeasure,
    beatIntervalMs,
    timingToleranceMs,
    targetMidiNote,
    frequencyToMidi,
    onComplete,
    onProgress,
    showFeedback,
    stopMetronome,
    safeTimeout,
  ]);

  // Keep ref updated with latest handleEntry
  useEffect(() => {
    handleEntryRef.current = handleEntry;
  }, [handleEntry]);

  // Start a new round (count-in + listen)
  const startNewRound = useCallback(() => {
    if (unmountedRef.current) return;

    // Clear any existing metronome interval first
    if (beatIntervalRef.current) {
      clearInterval(beatIntervalRef.current);
      beatIntervalRef.current = null;
    }

    // Clear any pending sustain timer and reset sound tracking
    if (sustainTimerRef.current) {
      clearTimeout(sustainTimerRef.current);
      sustainTimerRef.current = null;
    }
    soundStartTimeRef.current = null;
    pitchBufferRef.current = []; // Clear pitch buffer for new round

    setPhase("counting");
    setPrepCount(prepBeats);
    hasEnteredRef.current = false;
    measureCountRef.current = 0;

    let beatCount = 0;

    // Play first beat
    playBeat(true);
    animatePulse(true);

    beatIntervalRef.current = setInterval(() => {
      if (unmountedRef.current) {
        clearInterval(beatIntervalRef.current);
        return;
      }
      beatCount++;

      if (beatCount < prepBeats) {
        // Count-in phase
        setPrepCount(prepBeats - beatCount);
        const isBeatOne = beatCount % beatsPerMeasure === 0;
        playBeat(isBeatOne);
        animatePulse(isBeatOne);
        currentBeatRef.current = (beatCount % beatsPerMeasure) + 1;
      } else if (beatCount === prepBeats) {
        // Transition to listening - this is their beat 1
        // IMPORTANT: Capture isSounding SYNCHRONOUSLY before setting state
        // This way we know if they were already playing BEFORE beat 1
        // Use the ref since we're in a callback that might have stale closures
        wasSoundingAtListenStartRef.current = isSoundingRef.current;
        console.log(
          "[StartOnCueExercise] Starting to listen, isSounding at this moment:",
          isSoundingRef.current,
        );
        setPhase("listening");
        setWaitingForEntry(true); // This enables pitch detection via the hook
        lastBeatOneTimeRef.current = Date.now();
        console.log(
          "[StartOnCueExercise] Beat 1 (first listening) at",
          lastBeatOneTimeRef.current,
        );
        currentBeatRef.current = 1;
        playBeat(true);
        animatePulse(true);
      } else {
        // Listening phase - continue metronome
        const beatInMeasure = ((beatCount - prepBeats) % beatsPerMeasure) + 1;
        currentBeatRef.current = beatInMeasure;
        setCurrentBeat(beatInMeasure - 1);

        if (beatInMeasure === 1) {
          lastBeatOneTimeRef.current = Date.now();
          console.log(
            "[StartOnCueExercise] Beat 1 (measure",
            measureCountRef.current + 1,
            ") at",
            lastBeatOneTimeRef.current,
          );
          measureCountRef.current++;

          // If they haven't entered after 2 measures, count as missed
          if (!hasEnteredRef.current && measureCountRef.current >= 2) {
            hasEnteredRef.current = true;
            setWaitingForEntry(false);
            setStreak(0);
            showFeedback("missed");
            onProgress?.({
              streak: 0,
              masteryRequired: masteryStreak,
              totalAttempts: totalAttempts + 1,
            });
            setTotalAttempts((t) => t + 1);

            // Stop and restart
            clearInterval(beatIntervalRef.current);
            safeTimeout(() => startNewRoundRef.current?.(), 1500);
            return;
          }
        }

        playBeat(beatInMeasure === 1);
        animatePulse(beatInMeasure === 1);
      }
    }, beatIntervalMs);
  }, [
    prepBeats,
    beatsPerMeasure,
    beatIntervalMs,
    playBeat,
    animatePulse,
    showFeedback,
    masteryStreak,
    totalAttempts,
    onProgress,
    safeTimeout,
  ]);

  // Keep ref updated with latest startNewRound
  useEffect(() => {
    startNewRoundRef.current = startNewRound;
  }, [startNewRound]);

  // Start exercise
  const handleStart = useCallback(() => {
    setIsPlaying(true);
    startNewRound();
  }, [startNewRound]);

  // Feedback helpers
  const getFeedbackColor = () => {
    switch (lastFeedback) {
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
      case "wrong_note":
        return "#9C27B0";
      default:
        return "#888";
    }
  };

  const getFeedbackText = () => {
    switch (lastFeedback) {
      case "perfect":
        return "Perfect! 🎯";
      case "good":
        return "Good!";
      case "early":
        return "Too early!";
      case "late":
        return "Too late!";
      case "missed":
        return "Missed!";
      case "wrong_note":
        if (wrongNoteInfo) {
          return `Wrong note! Heard ${wrongNoteInfo.detectedNote} - play ${wrongNoteInfo.direction}`;
        }
        return "Wrong note!";
      default:
        return "";
    }
  };

  // Render beat indicators
  const renderBeatIndicators = () => {
    const indicators = [];
    for (let i = 0; i < beatsPerMeasure; i++) {
      const isCurrent = phase === "listening" && currentBeat === i;
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

  // Ready screen
  if (phase === "ready" && !isPlaying) {
    return (
      <View style={styles.container}>
        <View style={styles.readyContent}>
          <Text style={styles.readyIcon}>🎺</Text>
          <Text style={styles.readyTitle}>Enter on One</Text>
          <Text style={styles.readyDescription}>
            Listen to the count-in, then play your first note{"\n"}
            precisely on beat 1
          </Text>

          <View style={styles.firstNoteCard}>
            <Text style={styles.firstNoteLabel}>Your First Note</Text>
            <Text style={styles.firstNoteValue}>{userFirstNote}</Text>
            <TouchableOpacity
              style={[
                styles.hearNoteButton,
                isPlayingNote && styles.hearNoteButtonActive,
              ]}
              onPress={playTargetNote}
              disabled={isPlayingNote}
            >
              <Text style={styles.hearNoteButtonText}>
                {isPlayingNote ? "🔊 Playing..." : "🔊 Hear Your Note"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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

      {/* Target note + hear button */}
      <View style={styles.targetNoteRow}>
        <Text style={styles.targetNoteLabel}>Target: </Text>
        <Text style={styles.targetNoteValue}>{userFirstNote}</Text>
        <TouchableOpacity
          style={[
            styles.hearNoteSmall,
            isPlayingNote && styles.hearNoteSmallActive,
          ]}
          onPress={playTargetNote}
          disabled={isPlayingNote}
        >
          <Text style={styles.hearNoteSmallText}>🔊</Text>
        </TouchableOpacity>
      </View>

      {/* BPM */}
      <Text style={styles.bpmText}>{bpm} BPM</Text>

      {/* Beat indicators */}
      <View style={styles.beatIndicators}>{renderBeatIndicators()}</View>

      {/* Main visual */}
      <View style={styles.mainArea}>
        <Animated.View
          style={[
            styles.pulseCircle,
            {
              transform: [{ scale: pulseAnim }],
              backgroundColor:
                phase === "counting"
                  ? "#444"
                  : waitingForEntry
                    ? "#9C27B0"
                    : "#666",
            },
          ]}
        >
          {phase === "counting" ? (
            <>
              <Text style={styles.prepText}>Get Ready...</Text>
              <Text style={styles.prepCountText}>{prepCount}</Text>
            </>
          ) : waitingForEntry ? (
            <>
              <Text style={styles.playIcon}>🎵</Text>
              <Text style={styles.playText}>PLAY NOW!</Text>
              <Text style={styles.noteText}>{userFirstNote}</Text>
            </>
          ) : (
            <>
              <Text style={styles.waitText}>Listen...</Text>
            </>
          )}
        </Animated.View>

        {/* Audio detection status - show whenever exercise is active */}
        {phase !== "ready" && (
          <View style={styles.audioStatusContainer}>
            {/* Volume indicator */}
            <View style={styles.volumeBar}>
              <View
                style={[styles.volumeFill, { width: `${volume * 100}%` }]}
              />
            </View>
            {/* Detected pitch display */}
            <View style={styles.detectedPitchContainer}>
              <Text style={styles.detectedPitchLabel}>
                {isListening
                  ? "🎤 Listening..."
                  : pitchError
                    ? "⚠️ " + pitchError
                    : "🎤 Mic ready"}
              </Text>
              {currentPitch && (
                <Text style={styles.detectedPitchValue}>
                  Heard:{" "}
                  <Text style={styles.detectedPitchNote}>
                    {currentPitch.noteName}
                  </Text>
                </Text>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Feedback overlay */}
      <Animated.View style={[styles.feedback, { opacity: feedbackOpacity }]}>
        <Text style={[styles.feedbackText, { color: getFeedbackColor() }]}>
          {getFeedbackText()}
        </Text>
      </Animated.View>

      {/* Instructions */}
      <Text style={styles.instruction}>
        {phase === "counting"
          ? "Listen to the count-in..."
          : waitingForEntry
            ? `Play ${userFirstNote} on beat 1!`
            : "Preparing next round..."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  // Ready screen
  readyContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  readyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  readyTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  readyDescription: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  firstNoteCard: {
    backgroundColor: "#2a2a2a",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 40,
    alignItems: "center",
  },
  firstNoteLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  firstNoteValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#9C27B0",
  },
  startButton: {
    backgroundColor: "#9C27B0",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  // Exercise screen
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
    marginBottom: 20,
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
    borderColor: "#9C27B0",
  },
  beatDotOneActive: {
    backgroundColor: "#9C27B0",
  },
  beatNumber: {
    fontSize: 16,
    color: "#888",
    fontWeight: "600",
  },
  beatNumberActive: {
    color: "#fff",
  },
  mainArea: {
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
    ...Platform.select({
      web: { boxShadow: "0px 4px 8px rgba(156, 39, 176, 0.3)" },
      default: {
        elevation: 8,
        shadowColor: "#9C27B0",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
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
  playIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  playText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  noteText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "rgba(255,255,255,0.8)",
    marginTop: 8,
  },
  waitText: {
    fontSize: 18,
    color: "#aaa",
  },
  volumeBar: {
    width: "60%",
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    marginTop: 24,
    overflow: "hidden",
  },
  volumeFill: {
    height: "100%",
    backgroundColor: "#9C27B0",
    borderRadius: 4,
  },
  feedback: {
    position: "absolute",
    top: "40%",
  },
  feedbackText: {
    fontSize: 28,
    fontWeight: "bold",
  },
  instruction: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
  },
  // Hear note button styles
  hearNoteButton: {
    backgroundColor: "#444",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
  },
  hearNoteButtonActive: {
    backgroundColor: "#9C27B0",
  },
  hearNoteButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },
  // Target note row (during exercise)
  targetNoteRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  targetNoteLabel: {
    fontSize: 14,
    color: "#888",
  },
  targetNoteValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#9C27B0",
    marginRight: 8,
  },
  hearNoteSmall: {
    backgroundColor: "#444",
    padding: 6,
    borderRadius: 6,
  },
  hearNoteSmallActive: {
    backgroundColor: "#9C27B0",
  },
  hearNoteSmallText: {
    fontSize: 16,
  },
  // Audio status
  audioStatusContainer: {
    width: "80%",
    alignItems: "center",
    marginTop: 24,
  },
  detectedPitchContainer: {
    marginTop: 12,
    alignItems: "center",
  },
  detectedPitchLabel: {
    fontSize: 12,
    color: "#888",
  },
  detectedPitchValue: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 4,
  },
  detectedPitchNote: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
});
