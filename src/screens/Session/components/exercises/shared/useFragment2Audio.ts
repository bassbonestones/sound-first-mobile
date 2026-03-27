/**
 * useFragment2Audio - Audio playback and performance tracking for Fragment2 exercises
 *
 * Extracts audio logic from Fragment2LessonExercise to reduce component size and
 * enable reuse in similar fragment exercises.
 *
 * Features:
 * - Pattern playback with half notes
 * - Metronome-only mode for practice phases
 * - Tonic drone support (for "Play with Drone" phase)
 * - Per-note performance tracking (sustain, entrance timing, pitch accuracy)
 * - Performance analysis with detailed feedback
 */
import { useRef, useCallback, useEffect } from "react";
import { midiToFrequency } from "./noteUtils";
import { createAudioContext, createClickSound } from "./audioHelpers";
import type {
  LessonExerciseStateReturn,
  PerformanceResult,
} from "./useLessonExerciseState";

// Subdivision click for eighth notes
function createSubdivisionClick(ctx: AudioContext): void {
  const duration = 0.03;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;

  osc.type = "triangle";
  osc.frequency.setValueAtTime(600, now);

  gain.gain.setValueAtTime(0.05, now);
  gain.gain.linearRampToValueAtTime(0, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

export interface Fragment2AudioConfig {
  /** Pattern note frequencies for playback (from midiToFrequency) */
  patternFrequencies: number[];
  /** Number of notes in pattern (e.g., 2 for do-re, 3 for do-re-do) */
  patternNotesCount: number;
  /** Tempo in BPM (default: 60) */
  tempo: number;
  /** MIDI value of tonic (first note) for drone */
  firstNoteMidi: number;
  /** Exercise state from useLessonExerciseState */
  exercise: LessonExerciseStateReturn;
  /** Whether in singing phase (allows octave variance) */
  isSingPhase: boolean;
  /** Pattern MIDI values for pitch checking */
  patternPitches: number[];
}

export interface Fragment2AudioReturn {
  /** Play pattern with notes (used in Listen phase) */
  playPattern: (onComplete?: () => void) => void;
  /** Play metronome only without notes (used in Sing/Play phases) */
  playMetronomeOnly: (onComplete?: () => void, withDrone?: boolean) => void;
  /** Stop all playback */
  stopPlayback: () => void;
  /** Start tonic drone */
  startDrone: () => void;
  /** Stop tonic drone */
  stopDrone: () => void;
  /** Analyze recorded performance */
  analyzePerformance: () => PerformanceResult;
  /** Reset tracking refs for new attempt */
  resetTracking: () => void;
  /** Whether drone is currently active */
  droneActive: boolean;
  /** Ref to update isSounding state from pitch detection */
  isSoundingRef: React.MutableRefObject<boolean>;
  /** Ref for per-note pitch accuracy tracking */
  notePitchAccuracyRef: React.MutableRefObject<
    { onPitch: number; total: number }[]
  >;
  /** Ref tracking if target pitch was hit */
  hasHitTargetPitchRef: React.MutableRefObject<boolean>;
  /** Ref tracking on-pitch sample count */
  onPitchCountRef: React.MutableRefObject<number>;
  /** Ref tracking total sounding samples */
  totalSoundingCountRef: React.MutableRefObject<number>;
}

export function useFragment2Audio(
  config: Fragment2AudioConfig,
): Fragment2AudioReturn {
  const {
    patternFrequencies,
    patternNotesCount,
    tempo,
    firstNoteMidi,
    exercise,
    isSingPhase: _isSingPhase,
    patternPitches: _patternPitches,
  } = config;

  // ---------------------------------------------------------------------------
  // Audio Refs
  // ---------------------------------------------------------------------------
  const audioContextRef = useRef<AudioContext | null>(null);
  const beatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const samplingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const droneOscillatorRef = useRef<OscillatorNode | null>(null);
  const droneGainRef = useRef<GainNode | null>(null);
  const unmountedRef = useRef(false);
  const isSoundingRef = useRef(false);
  const onCompleteRef = useRef<(() => void) | null>(null);
  const droneActiveRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Pitch Tracking Refs
  // ---------------------------------------------------------------------------
  const hasHitTargetPitchRef = useRef(false);
  const onPitchCountRef = useRef(0);
  const totalSoundingCountRef = useRef(0);
  const soundingOnBeatsRef = useRef<number[]>([]);
  const noteStartedOnTimeRef = useRef<boolean[]>([]);
  const notePitchAccuracyRef = useRef<{ onPitch: number; total: number }[]>([]);
  const startedEarlyRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Initialize audio context
  // ---------------------------------------------------------------------------
  useEffect(() => {
    audioContextRef.current = createAudioContext();

    return () => {
      unmountedRef.current = true;
      // Cleanup on unmount
      if (beatIntervalRef.current) {
        clearInterval(beatIntervalRef.current);
      }
      if (samplingIntervalRef.current) {
        clearInterval(samplingIntervalRef.current);
      }
      oscillatorsRef.current.forEach((osc) => {
        try {
          osc.stop();
        } catch (_e) {
          // Already stopped
        }
      });
      if (droneOscillatorRef.current) {
        try {
          droneOscillatorRef.current.stop();
        } catch (_e) {
          // Already stopped
        }
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Reset tracking refs
  // ---------------------------------------------------------------------------
  const resetTracking = useCallback(() => {
    hasHitTargetPitchRef.current = false;
    onPitchCountRef.current = 0;
    totalSoundingCountRef.current = 0;
    soundingOnBeatsRef.current = new Array(patternNotesCount).fill(0);
    noteStartedOnTimeRef.current = new Array(patternNotesCount).fill(false);
    notePitchAccuracyRef.current = Array.from(
      { length: patternNotesCount },
      () => ({
        onPitch: 0,
        total: 0,
      }),
    );
    startedEarlyRef.current = false;
  }, [patternNotesCount]);

  // ---------------------------------------------------------------------------
  // Stop playback
  // ---------------------------------------------------------------------------
  const stopPlayback = useCallback(() => {
    if (beatIntervalRef.current) {
      clearInterval(beatIntervalRef.current);
      beatIntervalRef.current = null;
    }
    if (samplingIntervalRef.current) {
      clearInterval(samplingIntervalRef.current);
      samplingIntervalRef.current = null;
    }
    oscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop();
      } catch (_e) {
        // Already stopped
      }
    });
    oscillatorsRef.current = [];
    exercise.setIsPlaying(false);
    exercise.setCurrentBeat(0);
    exercise.setIsSubdivision(false);
    exercise.setShowCursor(false);
  }, [exercise]);

  // ---------------------------------------------------------------------------
  // Start tonic drone
  // ---------------------------------------------------------------------------
  const startDrone = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx || droneActiveRef.current) return;

    const freq = midiToFrequency(firstNoteMidi);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    droneOscillatorRef.current = osc;
    droneGainRef.current = gain;
    droneActiveRef.current = true;
  }, [firstNoteMidi]);

  // ---------------------------------------------------------------------------
  // Stop tonic drone
  // ---------------------------------------------------------------------------
  const stopDrone = useCallback(() => {
    if (droneOscillatorRef.current && droneGainRef.current) {
      const ctx = audioContextRef.current;
      if (ctx) {
        droneGainRef.current.gain.linearRampToValueAtTime(
          0,
          ctx.currentTime + 0.3,
        );
        const oscRef = droneOscillatorRef.current;
        setTimeout(() => {
          try {
            oscRef?.stop();
          } catch (_e) {
            // Already stopped
          }
        }, 350);
      }
      droneOscillatorRef.current = null;
      droneGainRef.current = null;
    }
    droneActiveRef.current = false;
  }, []);

  // ---------------------------------------------------------------------------
  // Play pattern (with notes) - used in Listen phase
  // ---------------------------------------------------------------------------
  const playPattern = useCallback(
    (onComplete?: () => void) => {
      const ctx = audioContextRef.current;
      if (!ctx || exercise.isPlaying) return;

      onCompleteRef.current =
        typeof onComplete === "function" ? onComplete : null;

      exercise.setIsPlaying(true);
      exercise.setCurrentBeat(-4);
      exercise.setIsSubdivision(false);
      exercise.setShowCursor(true);

      const beatMs = (60 / tempo) * 1000;
      const eighthMs = beatMs / 2;
      let beat = -4;
      let isAnd = true;
      const totalBeats = patternNotesCount * 2; // 2 beats per half note

      createClickSound(ctx, true);
      exercise.setIsSubdivision(false);

      beatIntervalRef.current = setInterval(() => {
        if (unmountedRef.current) {
          if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
          return;
        }

        if (isAnd) {
          createSubdivisionClick(ctx);
          exercise.setIsSubdivision(true);
          isAnd = false;
        } else {
          beat++;
          if (beat === 0) beat = 1;
          exercise.setIsSubdivision(false);

          if (beat >= -3 && beat <= -1) {
            createClickSound(ctx, false);
            exercise.setCurrentBeat(beat);
          } else if (beat >= 1 && beat <= totalBeats) {
            createClickSound(ctx, beat === 1);
            exercise.setCurrentBeat(beat);

            // Play the note only on odd beats (1, 3, 5...)
            if (beat % 2 === 1) {
              const noteIndex = Math.floor((beat - 1) / 2);
              const freq = patternFrequencies[noteIndex];
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              const now = ctx.currentTime;
              const duration = (beatMs * 1.9) / 1000; // ~1.9 beats

              osc.type = "sine";
              osc.frequency.setValueAtTime(freq, now);

              gain.gain.setValueAtTime(0, now);
              gain.gain.linearRampToValueAtTime(0.5, now + 0.02);
              gain.gain.setValueAtTime(0.4, now + duration - 0.1);
              gain.gain.linearRampToValueAtTime(0, now + duration);

              // Add harmonic
              const osc2 = ctx.createOscillator();
              const gain2 = ctx.createGain();
              osc2.frequency.setValueAtTime(freq * 2, now);
              gain2.gain.setValueAtTime(0.15, now);
              gain2.gain.linearRampToValueAtTime(0, now + duration);

              osc.connect(gain);
              gain.connect(ctx.destination);
              osc2.connect(gain2);
              gain2.connect(ctx.destination);

              osc.start(now);
              osc.stop(now + duration + 0.05);
              osc2.start(now);
              osc2.stop(now + duration + 0.05);

              oscillatorsRef.current.push(osc, osc2);
            }
          } else if (beat === totalBeats + 1) {
            // Final beat (stop)
            createClickSound(ctx, true);
            exercise.setCurrentBeat(beat);
          } else {
            if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
            beatIntervalRef.current = null;
            exercise.setIsPlaying(false);
            exercise.setCurrentBeat(0);
            exercise.setIsSubdivision(false);
            exercise.setShowCursor(false);
            oscillatorsRef.current = [];
            if (onCompleteRef.current) {
              onCompleteRef.current();
              onCompleteRef.current = null;
            }
            return;
          }
          isAnd = true;
        }
      }, eighthMs);
    },
    [tempo, patternNotesCount, patternFrequencies, exercise],
  );

  // ---------------------------------------------------------------------------
  // Play metronome only (for sing/play phases)
  // ---------------------------------------------------------------------------
  const playMetronomeOnly = useCallback(
    (onComplete?: () => void, withDrone = false) => {
      const ctx = audioContextRef.current;
      if (!ctx || exercise.isPlaying) return;

      if (withDrone) {
        startDrone();
      }

      onCompleteRef.current =
        typeof onComplete === "function" ? onComplete : null;

      exercise.setIsPlaying(true);
      exercise.setCurrentBeat(-4);
      exercise.setIsSubdivision(false);
      exercise.setShowCursor(true);
      soundingOnBeatsRef.current = new Array(patternNotesCount).fill(0);
      noteStartedOnTimeRef.current = new Array(patternNotesCount).fill(false);
      notePitchAccuracyRef.current = Array.from(
        { length: patternNotesCount },
        () => ({
          onPitch: 0,
          total: 0,
        }),
      );
      startedEarlyRef.current = false;

      const beatMs = (60 / tempo) * 1000;
      const eighthMs = beatMs / 2;
      let beat = -4;
      let isAnd = true;
      const totalBeats = patternNotesCount * 2; // 2 beats per half note

      let noteSoundingSamples = {
        noteIndex: -1,
        samples: 0,
        soundingCount: 0,
        firstHalfSoundingCount: 0,
      };
      let earlySoundingSamples = 0;
      let samplesBeforeChecking = 3;
      const samplesPerHalfNote = Math.round((beatMs * 2) / 50);
      const firstHalfThreshold = Math.round(samplesPerHalfNote / 2);

      const samplingInterval = setInterval(() => {
        if (samplesBeforeChecking > 0) {
          samplesBeforeChecking--;
          return;
        }

        if (beat >= -4 && beat <= -1) {
          if (isSoundingRef.current) {
            earlySoundingSamples++;
            if (earlySoundingSamples >= 3) {
              startedEarlyRef.current = true;
            }
          } else {
            earlySoundingSamples = 0;
          }
        }

        // Track sounding by note index (each note is 2 beats)
        if (beat >= 1 && beat <= totalBeats) {
          const currentNoteIndex = Math.floor((beat - 1) / 2);
          if (noteSoundingSamples.noteIndex !== currentNoteIndex) {
            // Save previous note's data
            if (
              noteSoundingSamples.noteIndex >= 0 &&
              noteSoundingSamples.samples > 0
            ) {
              const percentage =
                noteSoundingSamples.soundingCount / noteSoundingSamples.samples;
              const idx = noteSoundingSamples.noteIndex;
              if (idx < soundingOnBeatsRef.current.length) {
                soundingOnBeatsRef.current[idx] = Math.max(
                  soundingOnBeatsRef.current[idx],
                  percentage,
                );
              }
              // Check if note started on time
              const firstHalfPct =
                noteSoundingSamples.firstHalfSoundingCount /
                Math.min(noteSoundingSamples.samples, firstHalfThreshold);
              if (
                idx < noteStartedOnTimeRef.current.length &&
                firstHalfPct >= 0.5
              ) {
                noteStartedOnTimeRef.current[idx] = true;
              }
            }
            noteSoundingSamples = {
              noteIndex: currentNoteIndex,
              samples: 0,
              soundingCount: 0,
              firstHalfSoundingCount: 0,
            };
          }
          noteSoundingSamples.samples++;
          if (isSoundingRef.current) {
            noteSoundingSamples.soundingCount++;
            if (noteSoundingSamples.samples <= firstHalfThreshold) {
              noteSoundingSamples.firstHalfSoundingCount++;
            }
          }
        }
      }, 50);
      samplingIntervalRef.current = samplingInterval;

      createClickSound(ctx, true);
      exercise.setIsSubdivision(false);

      beatIntervalRef.current = setInterval(() => {
        if (unmountedRef.current) {
          if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
          clearInterval(samplingInterval);
          return;
        }

        if (isAnd) {
          createSubdivisionClick(ctx);
          exercise.setIsSubdivision(true);
          isAnd = false;
        } else {
          beat++;
          if (beat === 0) beat = 1;
          exercise.setIsSubdivision(false);

          if (beat >= -3 && beat <= -1) {
            createClickSound(ctx, false);
            exercise.setCurrentBeat(beat);
          } else if (beat >= 1 && beat <= totalBeats) {
            createClickSound(ctx, beat === 1);
            exercise.setCurrentBeat(beat);
          } else if (beat === totalBeats + 1) {
            createClickSound(ctx, true);
            exercise.setCurrentBeat(beat);
          } else {
            // Save final note's data
            if (
              noteSoundingSamples.noteIndex >= 0 &&
              noteSoundingSamples.samples > 0
            ) {
              const percentage =
                noteSoundingSamples.soundingCount / noteSoundingSamples.samples;
              const idx = noteSoundingSamples.noteIndex;
              if (idx < soundingOnBeatsRef.current.length) {
                soundingOnBeatsRef.current[idx] = Math.max(
                  soundingOnBeatsRef.current[idx],
                  percentage,
                );
              }
              // Check if final note started on time
              const firstHalfPct =
                noteSoundingSamples.firstHalfSoundingCount /
                Math.min(noteSoundingSamples.samples, firstHalfThreshold);
              if (
                idx < noteStartedOnTimeRef.current.length &&
                firstHalfPct >= 0.5
              ) {
                noteStartedOnTimeRef.current[idx] = true;
              }
            }
            if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
            clearInterval(samplingInterval);
            beatIntervalRef.current = null;
            samplingIntervalRef.current = null;
            exercise.setIsPlaying(false);
            exercise.setCurrentBeat(0);
            exercise.setIsSubdivision(false);
            exercise.setShowCursor(false);

            if (withDrone) {
              stopDrone();
            }

            if (onCompleteRef.current) {
              onCompleteRef.current();
              onCompleteRef.current = null;
            }
            return;
          }
          isAnd = true;
        }
      }, eighthMs);
    },
    [tempo, patternNotesCount, startDrone, stopDrone, exercise],
  );

  // ---------------------------------------------------------------------------
  // Analyze performance
  // ---------------------------------------------------------------------------
  const analyzePerformance = useCallback((): PerformanceResult => {
    const totalCount = totalSoundingCountRef.current;
    const pitchCount = onPitchCountRef.current;
    const hitTarget = hasHitTargetPitchRef.current;

    const beatSoundPct = soundingOnBeatsRef.current;
    const noteStartedOnTime = noteStartedOnTimeRef.current;
    const startedEarly = startedEarlyRef.current;
    const perNotePitch = notePitchAccuracyRef.current;

    if (totalCount === 0) {
      return {
        success: false,
        pitchOk: false,
        rhythmOk: false,
        message: "No sound detected",
      };
    }

    // Check per-note pitch accuracy
    const PER_NOTE_PITCH_THRESHOLD = 0.4;
    const perNotePitchOk = perNotePitch.every((note) => {
      if (note.total === 0) return false;
      return note.onPitch / note.total >= PER_NOTE_PITCH_THRESHOLD;
    });

    const successRatio = pitchCount / totalCount;
    const pitchOk = hitTarget && perNotePitchOk && successRatio >= 0.3;

    // Check sustain (need to sound for most of each note)
    const SUSTAIN_THRESHOLD = 0.6;
    const allBeatsOk = beatSoundPct.every((pct) => pct >= SUSTAIN_THRESHOLD);

    // Check entrances (need to start each note on time)
    const allEntrancesOk = noteStartedOnTime.every(
      (started) => started === true,
    );

    const rhythmOk = !startedEarly && allBeatsOk && allEntrancesOk;

    const success = pitchOk && rhythmOk;

    let message = "";
    if (success) {
      message = "Great job! You played the pattern accurately.";
    } else if (!pitchOk && rhythmOk) {
      message = "Good rhythm! Focus on matching the pitches more closely.";
    } else if (pitchOk && !rhythmOk) {
      if (startedEarly) {
        message = "Good pitches! Wait for beat 1 to start.";
      } else if (!allEntrancesOk) {
        message = "Good pitches! Start each note right on the beat.";
      } else {
        message = "Good pitches! Hold each note for the full 2 beats.";
      }
    } else {
      message = "Keep practicing! Listen to the pattern again.";
    }

    return { success, pitchOk, rhythmOk, message };
  }, []);

  return {
    playPattern,
    playMetronomeOnly,
    stopPlayback,
    startDrone,
    stopDrone,
    analyzePerformance,
    resetTracking,
    droneActive: droneActiveRef.current,
    isSoundingRef,
    notePitchAccuracyRef,
    hasHitTargetPitchRef,
    onPitchCountRef,
    totalSoundingCountRef,
  };
}
