/**
 * StartOnCueExercise - "Enter on One" drill
 *
 * Plays a steady beat with count-in.
 * User must play their first note precisely on beat 1.
 * Uses pitch detection to know when the user starts playing.
 *
 * State management via useTimingExerciseState hook for consistency
 * with other timing-based exercises.
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
import {
  createAudioContext,
  createClickSound,
  midiToNote,
  TIMING_TOLERANCES,
  useTimingExerciseState,
} from "./shared";
import type { ExerciseProps } from "./shared";

import { devLog, devWarn } from "../../../../utils/devLogger";

// Default timing tolerance - generous for beginners (~1/8 note at 60 BPM)
// This allows being up to an 8th note early or late and still counting as success
const DEFAULT_TOLERANCE_MS = TIMING_TOLERANCES.LENIENT + 250; // 450ms

export default function StartOnCueExercise({
  config = {},
  mastery,
  onComplete,
  onProgress,
  userFirstNote = "F3",
}: ExerciseProps) {
  // Use timing exercise state hook for unified state management
  const timing = useTimingExerciseState({
    bpm: config?.bpm || 60,
    beatsPerMeasure: config?.beats_per_measure || 4,
    prepBeats: config?.count_in_beats || 4,
    masteryStreak: mastery?.correct_streak || 8,
    timingToleranceMs: config?.timing_tolerance_ms || DEFAULT_TOLERANCE_MS,
    targetBeat: config?.target_beat || 1,
  });

  // Create AudioContext immediately (shared between metronome and pitch detection)
  // Using state so we can pass it to usePitchDetection and re-render when it's ready
  const [sharedAudioContext] = useState(() => createAudioContext());

  // Refs for metronome and timing logic
  const audioContextRef = useRef(sharedAudioContext);
  const beatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const handleEntryRef = useRef<(() => void) | null>(null);
  const startNewRoundRef = useRef<(() => void) | null>(null);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const sustainTimerRef = useRef<NodeJS.Timeout | null>(null);
  const soundStartTimeRef = useRef<number | null>(null);

  // Minimum sustain time to filter out transients
  // Brass instruments need longer for the fundamental to stabilize past attack overtones
  const MIN_SUSTAIN_MS = 150;

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
        devLog(
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
    return midiToNote(midi, false);
  }, []);

  // Keep pitch detection alive for the entire exercise duration (not toggling per round)
  // This prevents AudioContext from being repeatedly created/destroyed
  const exerciseActive = timing.phase !== "ready";

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
  const currentPitchRef = useRef<{
    frequency: number;
    midiNote: number;
    noteName: string;
  } | null>(null);
  // Capture the pitch at sound START time (for validation)
  const soundStartPitchRef = useRef<number | null>(null);
  // Buffer to collect MIDI readings during sustain for averaging (filters out transient overtone detections)
  const pitchBufferRef = useRef<number[]>([]);

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
    if (!timing.waitingForEntry || timing.hasEnteredRef.current) {
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
        devLog(
          "[StartOnCueExercise] User was already playing when listening started - counting as EARLY",
        );
        wasSoundingAtListenStartRef.current = false; // Reset so we only check once
        // Set soundStartTimeRef to before beat 1 so timing calculation shows "early"
        soundStartTimeRef.current = timing.lastBeatOneTimeRef.current - 500;
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
        const timeSinceBeatOne = now - timing.lastBeatOneTimeRef.current;
        soundStartTimeRef.current = now;
        // currentPitch is an object with .frequency property
        soundStartPitchRef.current = currentPitchRef.current?.frequency || null;
        devLog(
          "[StartOnCueExercise] Sound detected at",
          now,
          "pitch=",
          soundStartPitchRef.current?.toFixed(1),
          "Hz, timeSinceBeatOne=",
          timeSinceBeatOne,
        );
        sustainTimerRef.current = setTimeout(() => {
          // Sound has been sustained long enough - this is real user input
          if (
            timing.waitingForEntry &&
            !timing.hasEnteredRef.current &&
            isSounding
          ) {
            devLog(
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
        devLog("[StartOnCueExercise] Sound stopped, clearing timer");
      }
      soundStartTimeRef.current = null;
      soundStartPitchRef.current = null;
      pitchBufferRef.current = []; // Clear buffer on sound stop
      // They released - now we can detect a fresh sound
      if (waitingForNewSoundRef.current) {
        devLog(
          "[StartOnCueExercise] User released - now listening for fresh sound",
        );
        waitingForNewSoundRef.current = false;
      }
    }
  }, [
    isSounding,
    timing.waitingForEntry,
    timing.lastBeatOneTimeRef,
    timing.hasEnteredRef,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      devLog("[StartOnCueExercise] Cleanup - stopping metronome and audio");
      timing.unmountedRef.current = true;
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
          devWarn("Error closing audio context:", e);
        }
      }
    };
  }, [sharedAudioContext, timing.unmountedRef]);

  // Safe setTimeout that tracks refs for cleanup
  const safeTimeout = useCallback(
    (fn: () => void, delay: number) => {
      if (timing.unmountedRef.current) return;
      const id = setTimeout(() => {
        if (!timing.unmountedRef.current) {
          fn();
        }
      }, delay);
      timeoutRefs.current.push(id);
      return id;
    },
    [timing.unmountedRef],
  );

  // Play a beat click
  const playBeat = useCallback(async (isAccent = false) => {
    if (!audioContextRef.current) return;

    // Resume AudioContext if suspended (required by browsers)
    if (audioContextRef.current.state === "suspended") {
      try {
        await audioContextRef.current.resume();
      } catch (e) {
        devWarn("Failed to resume AudioContext:", e);
      }
    }

    const freq = isAccent ? 1200 : 800;
    const vol = isAccent ? 0.7 : 0.5;
    createClickSound(audioContextRef.current, freq, 0.05, vol);
  }, []);

  // Convert note name to frequency
  const noteToFrequency = useCallback((noteName: string) => {
    const noteMap: Record<string, number> = {
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
      timing.isPlayingNote
    )
      return;

    timing.setIsPlayingNote(true);
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

    safeTimeout(() => timing.setIsPlayingNote(false), duration * 1000);
  }, [
    userFirstNote,
    noteToFrequency,
    timing.isPlayingNote,
    timing.setIsPlayingNote,
    safeTimeout,
  ]);

  // Stop metronome
  const stopMetronome = useCallback(() => {
    if (beatIntervalRef.current) {
      clearInterval(beatIntervalRef.current);
      beatIntervalRef.current = null;
    }
    timing.setIsPlaying(false);
  }, [timing.setIsPlaying]);

  // Handle when user plays a note
  const handleEntry = useCallback(() => {
    if (timing.hasEnteredRef.current) return;
    timing.hasEnteredRef.current = true;
    timing.setWaitingForEntry(false);

    // Use pitch buffering to filter out transient overtone detections
    // Key insight: brass instruments produce overtones during attack that can briefly dominate
    // The FUNDAMENTAL (lowest pitch) is what the user is actually playing
    let detectedMidi: number | null = null;
    if (pitchBufferRef.current.length > 0) {
      // Count votes for each MIDI note
      const counts: Record<number, number> = {};
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

      devLog(
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
      devLog(
        `[Entry] Most common MIDI ${detectedMidi} (${midiToNoteName(detectedMidi)}), target: MIDI ${targetMidiNote}, diff: ${midiDiff} semitones, correct: ${isPitchCorrect}`,
      );
    } else {
      devLog(`[Entry] No pitch detected, skipping pitch validation`);
    }

    // If wrong pitch, fail immediately regardless of timing
    if (!isPitchCorrect) {
      stopMetronome();

      // Store info about the wrong note for display
      const detectedNoteName = midiToNoteName(detectedMidi);
      const direction =
        detectedMidi !== null && detectedMidi < targetMidiNote
          ? "higher"
          : "lower";
      timing.handleWrongNote(detectedNoteName || "?", direction);

      onProgress?.({
        streak: 0,
        masteryRequired: timing.masteryStreak,
        totalAttempts: timing.totalAttempts + 1,
      });

      safeTimeout(() => {
        startNewRoundRef.current?.();
      }, 1500);
      return;
    }

    // Use the ACTUAL sound start time, not current time
    // This compensates for the sustain detection delay
    const entryTime = soundStartTimeRef.current || Date.now();
    const timeSinceBeatOne = entryTime - timing.lastBeatOneTimeRef.current;
    const measureDuration = timing.beatsPerMeasure * timing.beatIntervalMs;

    // Calculate distance to nearest beat 1 (handles both early and late)
    // Positive timeSinceBeatOne means after beat 1, negative means before
    const positionInMeasure =
      ((timeSinceBeatOne % measureDuration) + measureDuration) %
      measureDuration;
    const timeToNextBeatOne = measureDuration - positionInMeasure;

    devLog(
      `[Entry] timeSinceBeatOne=${timeSinceBeatOne}ms, positionInMeasure=${positionInMeasure}ms, timeToNextBeatOne=${timeToNextBeatOne}ms, tolerance=${timing.timingToleranceMs}ms`,
    );

    // Check timing - was it close to beat 1?
    const isNearBeatOne =
      timeSinceBeatOne >= -timing.timingToleranceMs &&
      timeSinceBeatOne <= timing.timingToleranceMs;

    // Also check anticipation of the NEXT beat 1 (for when they're close to the end of a measure)
    const isAnticipatoryNextBeatOne =
      timeToNextBeatOne <= timing.timingToleranceMs &&
      timeSinceBeatOne >= measureDuration - timing.timingToleranceMs;

    // Stop the current metronome - we'll restart with a new round
    stopMetronome();

    if (isNearBeatOne || isAnticipatoryNextBeatOne) {
      // Success!
      // Calculate how close they were to perfect
      const deviation = isNearBeatOne
        ? Math.abs(timeSinceBeatOne)
        : timeToNextBeatOne;
      const quality =
        deviation <= timing.timingToleranceMs / 2 ? "perfect" : "good";
      timing.handleCorrectEntry(quality);

      // Check mastery (note: timing.streak was already incremented by handleCorrectEntry)
      if (timing.streak + 1 >= timing.masteryStreak) {
        safeTimeout(() => {
          onComplete?.({
            success: true,
            streak: timing.streak + 1,
            totalAttempts: timing.totalAttempts + 1,
            correctCount: timing.streak + 1,
          });
        }, 1000);
        return;
      }

      onProgress?.({
        streak: timing.streak + 1,
        masteryRequired: timing.masteryStreak,
        totalAttempts: timing.totalAttempts + 1,
      });
    } else {
      // Wrong timing - determine if early or late
      let timingResult: "early" | "late" = "late";
      if (timeSinceBeatOne < -timing.timingToleranceMs) {
        timingResult = "early";
      } else if (positionInMeasure > measureDuration / 2) {
        timingResult = "early";
      }
      timing.handleIncorrectTiming(timingResult);

      onProgress?.({
        streak: 0,
        masteryRequired: timing.masteryStreak,
        totalAttempts: timing.totalAttempts + 1,
      });
    }

    // Feedback phase is set by the timing hook actions, schedule new round
    safeTimeout(() => {
      startNewRoundRef.current?.();
    }, 1500);
  }, [
    timing,
    targetMidiNote,
    midiToNoteName,
    onComplete,
    onProgress,
    stopMetronome,
    safeTimeout,
  ]);

  // Keep ref updated with latest handleEntry
  useEffect(() => {
    handleEntryRef.current = handleEntry;
  }, [handleEntry]);

  // Start a new round (count-in + listen)
  const startNewRound = useCallback(() => {
    if (timing.unmountedRef.current) return;

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

    timing.setPhase("counting");
    timing.setPrepCount(timing.prepBeats);
    timing.hasEnteredRef.current = false;
    timing.measureCountRef.current = 0;

    let beatCount = 0;

    // Play first beat
    playBeat(true);
    timing.animatePulse(true);

    beatIntervalRef.current = setInterval(() => {
      if (timing.unmountedRef.current) {
        if (beatIntervalRef.current) {
          clearInterval(beatIntervalRef.current);
        }
        return;
      }
      beatCount++;

      if (beatCount < timing.prepBeats) {
        // Count-in phase
        timing.setPrepCount(timing.prepBeats - beatCount);
        const isBeatOne = beatCount % timing.beatsPerMeasure === 0;
        playBeat(isBeatOne);
        timing.animatePulse(isBeatOne);
        timing.currentBeatRef.current =
          (beatCount % timing.beatsPerMeasure) + 1;
      } else if (beatCount === timing.prepBeats) {
        // Transition to listening - this is their beat 1
        // IMPORTANT: Capture isSounding SYNCHRONOUSLY before setting state
        // This way we know if they were already playing BEFORE beat 1
        // Use the ref since we're in a callback that might have stale closures
        wasSoundingAtListenStartRef.current = isSoundingRef.current;
        devLog(
          "[StartOnCueExercise] Starting to listen, isSounding at this moment:",
          isSoundingRef.current,
        );
        timing.setPhase("listening");
        timing.setWaitingForEntry(true); // This enables pitch detection via the hook
        timing.lastBeatOneTimeRef.current = Date.now();
        devLog(
          "[StartOnCueExercise] Beat 1 (first listening) at",
          timing.lastBeatOneTimeRef.current,
        );
        timing.currentBeatRef.current = 1;
        playBeat(true);
        timing.animatePulse(true);
      } else {
        // Listening phase - continue metronome
        const beatInMeasure =
          ((beatCount - timing.prepBeats) % timing.beatsPerMeasure) + 1;
        timing.currentBeatRef.current = beatInMeasure;
        timing.setCurrentBeat(beatInMeasure - 1);

        if (beatInMeasure === 1) {
          timing.lastBeatOneTimeRef.current = Date.now();
          devLog(
            "[StartOnCueExercise] Beat 1 (measure",
            timing.measureCountRef.current + 1,
            ") at",
            timing.lastBeatOneTimeRef.current,
          );
          timing.measureCountRef.current++;

          // If they haven't entered after 2 measures, count as missed
          if (
            !timing.hasEnteredRef.current &&
            timing.measureCountRef.current >= 2
          ) {
            timing.hasEnteredRef.current = true;
            timing.handleIncorrectTiming("missed");

            onProgress?.({
              streak: 0,
              masteryRequired: timing.masteryStreak,
              totalAttempts: timing.totalAttempts + 1,
            });

            // Stop and restart
            if (beatIntervalRef.current) {
              clearInterval(beatIntervalRef.current);
            }
            safeTimeout(() => startNewRoundRef.current?.(), 1500);
            return;
          }
        }

        playBeat(beatInMeasure === 1);
        timing.animatePulse(beatInMeasure === 1);
      }
    }, timing.beatIntervalMs);
  }, [timing, playBeat, onProgress, safeTimeout]);

  // Keep ref updated with latest startNewRound
  useEffect(() => {
    startNewRoundRef.current = startNewRound;
  }, [startNewRound]);

  // Start exercise
  const handleStart = useCallback(() => {
    timing.setIsPlaying(true);
    startNewRound();
  }, [timing.setIsPlaying, startNewRound]);

  // Render beat indicators
  const renderBeatIndicators = () => {
    const indicators = [];
    for (let i = 0; i < timing.beatsPerMeasure; i++) {
      const isCurrent =
        timing.phase === "listening" && timing.currentBeat === i;
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
  if (timing.phase === "ready" && !timing.isPlaying) {
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
              accessibilityLabel={
                timing.isPlayingNote ? "Playing note" : "Hear your note"
              }
              accessibilityRole="button"
              style={[
                styles.hearNoteButton,
                timing.isPlayingNote && styles.hearNoteButtonActive,
              ]}
              onPress={playTargetNote}
              disabled={timing.isPlayingNote}
            >
              <Text style={styles.hearNoteButtonText}>
                {timing.isPlayingNote ? "🔊 Playing..." : "🔊 Hear Your Note"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            accessibilityLabel="Start exercise"
            accessibilityRole="button"
            style={styles.startButton}
            onPress={handleStart}
          >
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
            { width: `${(timing.streak / timing.masteryStreak) * 100}%` },
          ]}
        />
      </View>
      <Text style={styles.streakText}>
        {timing.streak} / {timing.masteryStreak} in a row
      </Text>

      {/* Target note + hear button */}
      <View style={styles.targetNoteRow}>
        <Text style={styles.targetNoteLabel}>Target: </Text>
        <Text style={styles.targetNoteValue}>{userFirstNote}</Text>
        <TouchableOpacity
          accessibilityLabel={
            timing.isPlayingNote ? "Playing note" : "Hear target note"
          }
          accessibilityRole="button"
          style={[
            styles.hearNoteSmall,
            timing.isPlayingNote && styles.hearNoteSmallActive,
          ]}
          onPress={playTargetNote}
          disabled={timing.isPlayingNote}
        >
          <Text style={styles.hearNoteSmallText}>🔊</Text>
        </TouchableOpacity>
      </View>

      {/* BPM */}
      <Text style={styles.bpmText}>{timing.bpm} BPM</Text>

      {/* Beat indicators */}
      <View style={styles.beatIndicators}>{renderBeatIndicators()}</View>

      {/* Main visual */}
      <View style={styles.mainArea}>
        <Animated.View
          style={[
            styles.pulseCircle,
            {
              transform: [{ scale: timing.pulseAnim }],
              backgroundColor:
                timing.phase === "counting"
                  ? "#444"
                  : timing.waitingForEntry
                    ? "#9C27B0"
                    : "#666",
            },
          ]}
        >
          {timing.phase === "counting" ? (
            <>
              <Text style={styles.prepText}>Get Ready...</Text>
              <Text style={styles.prepCountText}>{timing.prepCount}</Text>
            </>
          ) : timing.waitingForEntry ? (
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
        {timing.phase !== "ready" && (
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
      <Animated.View
        style={[styles.feedback, { opacity: timing.feedbackOpacity }]}
      >
        <Text style={[styles.feedbackText, { color: timing.feedbackColor }]}>
          {timing.feedbackText}
        </Text>
      </Animated.View>

      {/* Instructions */}
      <Text style={styles.instruction}>
        {timing.phase === "counting"
          ? "Listen to the count-in..."
          : timing.waitingForEntry
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
