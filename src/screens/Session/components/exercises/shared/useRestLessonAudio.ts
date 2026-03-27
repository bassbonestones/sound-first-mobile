/**
 * useRestLessonAudio - Shared audio hook for Rest lesson exercises
 *
 * Handles audio playback and performance analysis for rest exercises.
 * Parameterized by beat pattern configuration.
 *
 * Features:
 * - playPattern: Play the pattern with notes and clicks
 * - playMetronomeOnly: Click track for sing/play phases with sampling
 * - stopPlayback: Clean up audio
 * - analyzePerformance: Evaluate user's performance on note vs rest beats
 */
import { useRef, useCallback, useEffect, useState } from "react";
import { createAudioContext, createClickSound } from "./audioHelpers";
import type { BeatConfig, RestThresholds } from "./RestLessonTypes";

// ============================================================================
// Types
// ============================================================================

export interface RestAudioConfig {
  /** Beat configurations */
  beats: BeatConfig[];
  /** BPM for playback */
  bpm: number;
  /** Target frequency for note playback */
  targetFrequency: number;
  /** Number of beats per note (duration of each note) */
  beatsPerNote: number;
  /** Whether to show eighth note subdivisions */
  hasSubdivision: boolean;
  /** Performance thresholds */
  thresholds: RestThresholds;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentBeat: number;
  currentMeasure: number;
  isSubdivision: boolean;
}

export interface PerformanceRefs {
  /** Whether user has hit the target pitch */
  hasHitTargetPitch: React.MutableRefObject<boolean>;
  /** Count of samples where user was on pitch */
  onPitchCount: React.MutableRefObject<number>;
  /** Total count of sounding samples */
  totalSoundingCount: React.MutableRefObject<number>;
  /** Sounding samples per beat */
  soundingOnBeats: React.MutableRefObject<number[]>;
  /** Whether user started early (before beat 1) */
  startedEarly: React.MutableRefObject<boolean>;
  /** Current isSounding state (kept in sync) */
  isSounding: React.MutableRefObject<boolean>;
}

export interface PerformanceAnalysis {
  success: boolean;
  sustainedNotes: boolean;
  observedRests: boolean;
  goodPitch: boolean;
  noteBeatRatio: number;
  restBeatRatio: number;
  pitchRatio: number;
  startedEarly: boolean;
  message: string;
}

export interface UseRestLessonAudioReturn {
  // State
  playbackState: PlaybackState;
  performanceRefs: PerformanceRefs;

  // Actions
  playPattern: (onComplete?: () => void) => void;
  playMetronomeOnly: (onComplete?: () => void) => void;
  stopPlayback: () => void;
  resetTracking: () => void;
  analyzePerformance: () => PerformanceAnalysis;
}

// ============================================================================
// Subdivision Click (for quarter rest eighth note subdivisions)
// ============================================================================

function createSubdivisionClick(audioContext: AudioContext): void {
  const sampleRate = audioContext.sampleRate;
  const duration = 0.02;
  const bufferSize = Math.floor(sampleRate * duration);
  const buffer = audioContext.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;

  const filter = audioContext.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 2000;
  filter.Q.value = 0.5;

  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + duration,
  );

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);

  source.start(audioContext.currentTime);
}

// ============================================================================
// Hook
// ============================================================================

export function useRestLessonAudio(
  config: RestAudioConfig,
): UseRestLessonAudioReturn {
  const {
    beats,
    bpm,
    targetFrequency,
    beatsPerNote,
    hasSubdivision,
    thresholds,
  } = config;

  // Audio context ref
  const audioContextRef = useRef<AudioContext | null>(null);
  const beatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const samplingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const oscillator2Ref = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const unmountedRef = useRef(false);
  const onCompleteRef = useRef<(() => void) | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentMeasure, setCurrentMeasure] = useState(0);
  const [isSubdivision, setIsSubdivision] = useState(false);

  // Performance tracking refs
  const hasHitTargetPitchRef = useRef(false);
  const onPitchCountRef = useRef(0);
  const totalSoundingCountRef = useRef(0);
  const soundingOnBeatsRef = useRef<number[]>(Array(beats.length + 1).fill(0));
  const startedEarlyRef = useRef(false);
  const isSoundingRef = useRef(false);

  // Total beats in pattern
  const totalBeats = beats.length;

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = createAudioContext();

    return () => {
      unmountedRef.current = true;
      if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
      if (samplingIntervalRef.current)
        clearInterval(samplingIntervalRef.current);
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch (_e) {
          // Oscillator may already be stopped
        }
      }
      if (oscillator2Ref.current) {
        try {
          oscillator2Ref.current.stop();
        } catch (_e) {
          // Oscillator may already be stopped
        }
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Play Note Helper
  // ---------------------------------------------------------------------------
  const playNoteSound = useCallback(
    (ctx: AudioContext, durationBeats: number) => {
      const beatMs = (60 / bpm) * 1000;
      const duration = (beatMs * durationBeats) / 1000;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(targetFrequency, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.5, now + 0.02);
      gain.gain.setValueAtTime(0.4, now + duration - 0.05);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      const osc2 = ctx.createOscillator();
      osc2.frequency.setValueAtTime(targetFrequency * 2, now);
      const gain2 = ctx.createGain();
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

      oscillatorRef.current = osc;
      oscillator2Ref.current = osc2;
      gainNodeRef.current = gain;
    },
    [bpm, targetFrequency],
  );

  // ---------------------------------------------------------------------------
  // Stop Playback
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
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch (_e) {
        // Oscillator may already be stopped
      }
    }
    if (oscillator2Ref.current) {
      try {
        oscillator2Ref.current.stop();
      } catch (_e) {
        // Oscillator may already be stopped
      }
    }
    setIsPlaying(false);
    setCurrentBeat(0);
    setCurrentMeasure(0);
    setIsSubdivision(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Reset Tracking
  // ---------------------------------------------------------------------------
  const resetTracking = useCallback(() => {
    hasHitTargetPitchRef.current = false;
    onPitchCountRef.current = 0;
    totalSoundingCountRef.current = 0;
    soundingOnBeatsRef.current = Array(totalBeats + 1).fill(0);
    startedEarlyRef.current = false;
  }, [totalBeats]);

  // ---------------------------------------------------------------------------
  // Get Beat Config
  // ---------------------------------------------------------------------------
  const getBeatConfig = useCallback(
    (beat: number): BeatConfig | undefined => {
      return beats.find((b) => b.beat === beat);
    },
    [beats],
  );

  // ---------------------------------------------------------------------------
  // Play Pattern (with melody)
  // ---------------------------------------------------------------------------
  const playPattern = useCallback(
    (onComplete?: () => void) => {
      const ctx = audioContextRef.current;
      if (!ctx || isPlaying) return;

      onCompleteRef.current =
        typeof onComplete === "function" ? onComplete : null;

      setIsPlaying(true);
      setCurrentBeat(-4);
      setCurrentMeasure(0);
      setIsSubdivision(false);

      const beatMs = (60 / bpm) * 1000;
      const tickMs = hasSubdivision ? beatMs / 2 : beatMs;
      let beat = -4;
      let isAnd = hasSubdivision; // For subdivision timing

      // Initial click
      createClickSound(ctx, true);

      beatIntervalRef.current = setInterval(() => {
        if (unmountedRef.current) {
          if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
          return;
        }

        if (hasSubdivision && isAnd) {
          // This is the "&" subdivision
          createSubdivisionClick(ctx);
          setIsSubdivision(true);
          isAnd = false;
        } else {
          // Main beat
          beat++;
          if (beat === 0) beat = 1;
          setIsSubdivision(false);

          // Count-in beats (-3 to -1)
          if (beat >= -3 && beat <= -1) {
            createClickSound(ctx, false);
            setCurrentBeat(beat);
          } else if (beat >= 1 && beat <= totalBeats) {
            // Pattern beats
            const beatCfg = getBeatConfig(beat);
            const isAccent = beatCfg?.measureBeat === 1;

            createClickSound(ctx, isAccent);
            setCurrentBeat(beat);
            setCurrentMeasure(beatCfg?.measure ?? 1);

            // Play note if this is a note beat and it's the START of a note
            // (not a continuation beat)
            if (beatCfg?.isNote) {
              // Check if this is the start of a note (previous beat was not a note)
              const prevBeatCfg = getBeatConfig(beat - 1);
              const isNoteStart = !prevBeatCfg || !prevBeatCfg.isNote;
              if (isNoteStart) {
                playNoteSound(ctx, beatsPerNote);
              }
            }
          } else if (beat === totalBeats + 1) {
            // Final beat (end marker)
            createClickSound(ctx, true);
            setCurrentBeat(beat);
          } else {
            // Pattern complete
            if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
            beatIntervalRef.current = null;
            setIsPlaying(false);
            setCurrentBeat(0);
            setCurrentMeasure(0);
            onCompleteRef.current?.();
            onCompleteRef.current = null;
            return;
          }

          if (hasSubdivision) isAnd = true;
        }
      }, tickMs);
    },
    [
      bpm,
      isPlaying,
      hasSubdivision,
      totalBeats,
      beatsPerNote,
      getBeatConfig,
      playNoteSound,
    ],
  );

  // ---------------------------------------------------------------------------
  // Play Metronome Only (for sing/play phases with sampling)
  // ---------------------------------------------------------------------------
  const playMetronomeOnly = useCallback(
    (onComplete?: () => void) => {
      const ctx = audioContextRef.current;
      if (!ctx || isPlaying) return;

      onCompleteRef.current =
        typeof onComplete === "function" ? onComplete : null;

      setIsPlaying(true);
      setCurrentBeat(-4);
      setCurrentMeasure(0);
      soundingOnBeatsRef.current = Array(totalBeats + 1).fill(0);
      startedEarlyRef.current = false;

      const beatMs = (60 / bpm) * 1000;
      const tickMs = hasSubdivision ? beatMs / 2 : beatMs;
      let beat = -4;
      let isAnd = hasSubdivision;

      // Beat tracking for sampling
      let beatSoundingSamples = { beat: 0, samples: 0, soundingCount: 0 };
      let samplesBeforeChecking = 3;

      // Start sampling at 50ms intervals
      const samplingInterval = setInterval(() => {
        if (samplesBeforeChecking > 0) {
          samplesBeforeChecking--;
          return;
        }

        const currentBeatVal = beat;
        if (currentBeatVal < 1 || currentBeatVal > totalBeats) {
          // Check for early start
          if (currentBeatVal < 1 && isSoundingRef.current) {
            startedEarlyRef.current = true;
          }
          return;
        }

        // Track samples per beat
        if (currentBeatVal !== beatSoundingSamples.beat) {
          // Save previous beat's data
          if (
            beatSoundingSamples.beat >= 1 &&
            beatSoundingSamples.beat <= totalBeats
          ) {
            const ratio =
              beatSoundingSamples.samples > 0
                ? beatSoundingSamples.soundingCount /
                  beatSoundingSamples.samples
                : 0;
            soundingOnBeatsRef.current[beatSoundingSamples.beat] = ratio;
          }
          beatSoundingSamples = {
            beat: currentBeatVal,
            samples: 0,
            soundingCount: 0,
          };
        }

        beatSoundingSamples.samples++;
        if (isSoundingRef.current) {
          beatSoundingSamples.soundingCount++;
        }
      }, 50);

      samplingIntervalRef.current = samplingInterval;

      // Initial click
      createClickSound(ctx, true);

      beatIntervalRef.current = setInterval(() => {
        if (unmountedRef.current) {
          if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
          if (samplingIntervalRef.current)
            clearInterval(samplingIntervalRef.current);
          return;
        }

        if (hasSubdivision && isAnd) {
          createSubdivisionClick(ctx);
          setIsSubdivision(true);
          isAnd = false;
        } else {
          beat++;
          if (beat === 0) beat = 1;
          setIsSubdivision(false);

          if (beat >= -3 && beat <= -1) {
            createClickSound(ctx, false);
            setCurrentBeat(beat);
          } else if (beat >= 1 && beat <= totalBeats) {
            const beatCfg = getBeatConfig(beat);
            const isAccent = beatCfg?.measureBeat === 1;
            createClickSound(ctx, isAccent);
            setCurrentBeat(beat);
            setCurrentMeasure(beatCfg?.measure ?? 1);
          } else if (beat === totalBeats + 1) {
            createClickSound(ctx, true);
            setCurrentBeat(beat);

            // Save last beat's data
            if (
              beatSoundingSamples.beat >= 1 &&
              beatSoundingSamples.beat <= totalBeats
            ) {
              const ratio =
                beatSoundingSamples.samples > 0
                  ? beatSoundingSamples.soundingCount /
                    beatSoundingSamples.samples
                  : 0;
              soundingOnBeatsRef.current[beatSoundingSamples.beat] = ratio;
            }
          } else {
            // Pattern complete
            if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
            if (samplingIntervalRef.current)
              clearInterval(samplingIntervalRef.current);
            beatIntervalRef.current = null;
            samplingIntervalRef.current = null;
            setIsPlaying(false);
            setCurrentBeat(0);
            setCurrentMeasure(0);
            onCompleteRef.current?.();
            onCompleteRef.current = null;
            return;
          }

          if (hasSubdivision) isAnd = true;
        }
      }, tickMs);
    },
    [bpm, isPlaying, hasSubdivision, totalBeats, getBeatConfig],
  );

  // ---------------------------------------------------------------------------
  // Analyze Performance
  // ---------------------------------------------------------------------------
  const analyzePerformance = useCallback((): PerformanceAnalysis => {
    const noteBeats = beats.filter((b) => b.isNote).map((b) => b.beat);
    const restBeats = beats.filter((b) => !b.isNote).map((b) => b.beat);

    // Calculate ratios for note beats (should be sounding)
    let noteSoundingTotal = 0;
    for (const beat of noteBeats) {
      noteSoundingTotal += soundingOnBeatsRef.current[beat] ?? 0;
    }
    const noteBeatRatio =
      noteBeats.length > 0 ? noteSoundingTotal / noteBeats.length : 0;

    // Calculate ratios for rest beats (should be silent)
    let restSoundingTotal = 0;
    for (const beat of restBeats) {
      restSoundingTotal += soundingOnBeatsRef.current[beat] ?? 0;
    }
    const restBeatRatio =
      restBeats.length > 0 ? restSoundingTotal / restBeats.length : 0;

    // Calculate pitch accuracy
    const pitchRatio =
      totalSoundingCountRef.current > 0
        ? onPitchCountRef.current / totalSoundingCountRef.current
        : 0;

    const sustainedNotes = noteBeatRatio >= thresholds.sustainThreshold;
    const observedRests = restBeatRatio <= thresholds.silenceThreshold;
    const goodPitch =
      pitchRatio >= thresholds.pitchSuccessRatio ||
      hasHitTargetPitchRef.current;

    const success = sustainedNotes && observedRests && goodPitch;

    // Generate message
    let message = "";
    if (success) {
      message = "Excellent! You played the notes and observed the rest!";
    } else if (!sustainedNotes) {
      message = "Try sustaining the notes more. Play through each note beat.";
    } else if (!observedRests) {
      message = "Remember to stay silent during the rest! Count in your head.";
    } else if (!goodPitch) {
      message = "Focus on pitch accuracy. Listen and match the target note.";
    }

    return {
      success,
      sustainedNotes,
      observedRests,
      goodPitch,
      noteBeatRatio,
      restBeatRatio,
      pitchRatio,
      startedEarly: startedEarlyRef.current,
      message,
    };
  }, [beats, thresholds]);

  return {
    playbackState: {
      isPlaying,
      currentBeat,
      currentMeasure,
      isSubdivision,
    },
    performanceRefs: {
      hasHitTargetPitch: hasHitTargetPitchRef,
      onPitchCount: onPitchCountRef,
      totalSoundingCount: totalSoundingCountRef,
      soundingOnBeats: soundingOnBeatsRef,
      startedEarly: startedEarlyRef,
      isSounding: isSoundingRef,
    },
    playPattern,
    playMetronomeOnly,
    stopPlayback,
    resetTracking,
    analyzePerformance,
  };
}
