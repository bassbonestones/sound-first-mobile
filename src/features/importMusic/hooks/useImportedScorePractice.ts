/**
 * useImportedScorePractice
 *
 * Hook for managing practice session with an imported score.
 * Provides tempo control, metronome, and practice state management.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { ImportedScore } from "../../../types/import";
import {
  createAudioContext,
  createClickSound,
  cleanupAudioContext,
} from "../../../screens/Session/components/exercises/shared/audioHelpers";

// ============================================================================
// Types
// ============================================================================

/**
 * Practice mode for imported scores
 */
export type PracticeMode = "free" | "guided" | "loop";

/**
 * Current practice state
 */
export type PracticeState = "idle" | "countdown" | "playing" | "paused";

/**
 * Practice configuration
 */
export interface PracticeConfig {
  /** Tempo in BPM */
  readonly tempo: number;
  /** Time signature beats per measure */
  readonly beatsPerMeasure: number;
  /** Time signature beat type (4 = quarter note) */
  readonly beatType: number;
  /** Whether metronome is enabled */
  readonly metronomeEnabled: boolean;
  /** Countdown beats before start */
  readonly countdownBeats: number;
  /** Loop start measure (1-indexed) */
  readonly loopStart: number | null;
  /** Loop end measure (1-indexed) */
  readonly loopEnd: number | null;
}

/**
 * Practice progress tracking
 */
export interface PracticeProgress {
  /** Current measure (1-indexed) */
  readonly currentMeasure: number;
  /** Current beat within measure (1-indexed) */
  readonly currentBeat: number;
  /** Total elapsed time in seconds */
  readonly elapsedTime: number;
  /** Countdown beats remaining (0 when not counting down) */
  readonly countdownRemaining: number;
}

/**
 * Result of the useImportedScorePractice hook
 */
export interface UseImportedScorePracticeResult {
  // State
  readonly practiceState: PracticeState;
  readonly config: PracticeConfig;
  readonly progress: PracticeProgress;

  // Config actions
  readonly setTempo: (tempo: number) => void;
  readonly toggleMetronome: () => void;
  readonly setLoopRange: (start: number | null, end: number | null) => void;

  // Practice actions
  readonly start: () => void;
  readonly pause: () => void;
  readonly resume: () => void;
  readonly stop: () => void;
  readonly restart: () => void;

  // Derived values
  readonly totalMeasures: number;
  readonly canLoop: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TEMPO = 80;
const MIN_TEMPO = 20;
const MAX_TEMPO = 240;
const DEFAULT_COUNTDOWN_BEATS = 4;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Options for the practice hook
 */
export interface UseImportedScorePracticeOptions {
  /** Called on each beat tick - use this to sync cursor movement */
  readonly onBeatTick?: () => void;
}

/**
 * Hook for managing imported score practice sessions
 */
export function useImportedScorePractice(
  score: ImportedScore | null,
  rawMusicXml: string | null,
  options?: UseImportedScorePracticeOptions,
): UseImportedScorePracticeResult {
  const onBeatTick = options?.onBeatTick;
  // Extract time signature from score metadata
  const timeSignature = score?.metadata.timeSignature;
  const beatsPerMeasure = timeSignature?.beats ?? 4;
  const beatType = timeSignature?.beatType ?? 4;

  // Extract tempo from metadata or use default
  const initialTempo = score?.metadata.tempoMarking?.bpm ?? DEFAULT_TEMPO;

  // Practice state
  const [practiceState, setPracticeState] = useState<PracticeState>("idle");
  const [tempo, setTempoState] = useState(initialTempo);
  const [metronomeEnabled, setMetronomeEnabled] = useState(true);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);

  // Progress state
  const [currentMeasure, setCurrentMeasure] = useState(1);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [countdownRemaining, setCountdownRemaining] = useState(0);

  // Timer refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Total measures from score
  const totalMeasures = score?.measureCount ?? 0;

  // Calculate beat duration in ms
  // Metronome ticks at the displayed BPM (quarter note rate)
  // The cursor will handle time signature-specific beat advancement
  const beatDurationMs = useMemo(() => {
    return 60000 / tempo;
  }, [tempo]);

  // Initialize audio context on mount
  useEffect(() => {
    audioContextRef.current = createAudioContext();

    return () => {
      cleanupAudioContext(audioContextRef.current);
      audioContextRef.current = null;
    };
  }, []);

  // Play metronome click
  const playClick = useCallback(
    (isAccent: boolean) => {
      if (!metronomeEnabled || !audioContextRef.current) return;
      createClickSound(audioContextRef.current, isAccent);
    },
    [metronomeEnabled],
  );

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Tempo setter with bounds checking
  const setTempo = useCallback((newTempo: number) => {
    const clampedTempo = Math.max(MIN_TEMPO, Math.min(MAX_TEMPO, newTempo));
    setTempoState(clampedTempo);
  }, []);

  // Toggle metronome
  const toggleMetronome = useCallback(() => {
    setMetronomeEnabled((prev) => !prev);
  }, []);

  // Set loop range
  const setLoopRange = useCallback(
    (start: number | null, end: number | null) => {
      setLoopStart(start);
      setLoopEnd(end);
    },
    [],
  );

  // Start practice with countdown
  const start = useCallback(() => {
    if (practiceState !== "idle") return;

    // Initialize countdown
    setCountdownRemaining(DEFAULT_COUNTDOWN_BEATS);
    setPracticeState("countdown");
    startTimeRef.current = Date.now();

    // Play first countdown click immediately
    playClick(true);

    // Start countdown timer
    let countdown = DEFAULT_COUNTDOWN_BEATS;
    timerRef.current = setInterval(() => {
      countdown -= 1;
      setCountdownRemaining(countdown);

      // Play countdown click
      playClick(true);

      if (countdown <= 0) {
        // Countdown complete, start playing
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }

        setPracticeState("playing");
        setCurrentMeasure(loopStart ?? 1);
        setCurrentBeat(1);
        setElapsedTime(0);
        startTimeRef.current = Date.now();

        // Start beat timer
        // Cursor starts at position 0 (beat 1), so we don't advance on the first tick.
        // The interval fires after beatDurationMs, which is when beat 2 starts.
        let beatCounter = 1;
        
        timerRef.current = setInterval(() => {
          beatCounter += 1;
          if (beatCounter > beatsPerMeasure) {
            beatCounter = 1;
          }
          const isFirstBeat = beatCounter === 1;

          // Play click for each beat
          playClick(isFirstBeat);
          
          // Advance cursor to the new beat position
          onBeatTick?.();

          setCurrentBeat(() => {
            if (isFirstBeat) {
              // Move to next measure
              setCurrentMeasure((prevMeasure) => {
                const nextMeasure = prevMeasure + 1;
                const endMeasure = loopEnd ?? totalMeasures;

                if (nextMeasure > endMeasure) {
                  // Loop back or stop
                  if (loopStart !== null && loopEnd !== null) {
                    return loopStart;
                  }
                  // Stop at end
                  if (timerRef.current) {
                    clearInterval(timerRef.current);
                  }
                  setPracticeState("idle");
                  return 1;
                }
                return nextMeasure;
              });
              return 1;
            }
            return beatCounter;
          });

          // Update elapsed time
          if (startTimeRef.current) {
            setElapsedTime((Date.now() - startTimeRef.current) / 1000);
          }
        }, beatDurationMs);
      }
    }, beatDurationMs);
  }, [
    practiceState,
    beatsPerMeasure,
    beatDurationMs,
    loopStart,
    loopEnd,
    totalMeasures,
    playClick,
    onBeatTick,
  ]);

  // Pause practice
  const pause = useCallback(() => {
    if (practiceState !== "playing") return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setPracticeState("paused");
  }, [practiceState]);

  // Resume practice
  const resume = useCallback(() => {
    if (practiceState !== "paused") return;

    setPracticeState("playing");
    startTimeRef.current = Date.now() - elapsedTime * 1000;

    // Track current beat for sound playback
    let beatCounter = currentBeat;

    // Restart beat timer
    timerRef.current = setInterval(() => {
      beatCounter += 1;
      if (beatCounter > beatsPerMeasure) {
        beatCounter = 1;
      }
      const isFirstBeat = beatCounter === 1;

      // Play click for each beat
      playClick(isFirstBeat);
      
      // Notify cursor to advance
      onBeatTick?.();

      setCurrentBeat(() => {
        if (isFirstBeat) {
          setCurrentMeasure((prevMeasure) => {
            const nextMeasure = prevMeasure + 1;
            const endMeasure = loopEnd ?? totalMeasures;

            if (nextMeasure > endMeasure) {
              if (loopStart !== null && loopEnd !== null) {
                return loopStart;
              }
              if (timerRef.current) {
                clearInterval(timerRef.current);
              }
              setPracticeState("idle");
              return 1;
            }
            return nextMeasure;
          });
          return 1;
        }
        return beatCounter;
      });

      if (startTimeRef.current) {
        setElapsedTime((Date.now() - startTimeRef.current) / 1000);
      }
    }, beatDurationMs);
  }, [
    practiceState,
    elapsedTime,
    currentBeat,
    beatsPerMeasure,
    beatDurationMs,
    loopStart,
    loopEnd,
    totalMeasures,
    playClick,
    onBeatTick,
  ]);

  // Stop practice
  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setPracticeState("idle");
    setCurrentMeasure(1);
    setCurrentBeat(1);
    setElapsedTime(0);
    setCountdownRemaining(0);
  }, []);

  // Restart practice
  const restart = useCallback(() => {
    stop();
    // Small delay to reset state before starting
    setTimeout(() => {
      start();
    }, 100);
  }, [stop, start]);

  // Build config object
  const config: PracticeConfig = useMemo(
    () => ({
      tempo,
      beatsPerMeasure,
      beatType,
      metronomeEnabled,
      countdownBeats: DEFAULT_COUNTDOWN_BEATS,
      loopStart,
      loopEnd,
    }),
    [tempo, beatsPerMeasure, beatType, metronomeEnabled, loopStart, loopEnd],
  );

  // Build progress object
  const progress: PracticeProgress = useMemo(
    () => ({
      currentMeasure,
      currentBeat,
      elapsedTime,
      countdownRemaining,
    }),
    [currentMeasure, currentBeat, elapsedTime, countdownRemaining],
  );

  return {
    // State
    practiceState,
    config,
    progress,

    // Config actions
    setTempo,
    toggleMetronome,
    setLoopRange,

    // Practice actions
    start,
    pause,
    resume,
    stop,
    restart,

    // Derived values
    totalMeasures,
    canLoop: totalMeasures > 1,
  };
}

export default useImportedScorePractice;
