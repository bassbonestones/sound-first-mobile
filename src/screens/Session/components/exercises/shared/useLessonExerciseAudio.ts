/**
 * useLessonExerciseAudio - Audio management for lesson-style exercises
 *
 * Handles:
 * - Audio context creation and cleanup
 * - Metronome click playback (count-in + play beats)
 * - Pattern playback (melody + clicks)
 * - Drone (tonic) support
 * - Beat tracking and subdivision
 * - Pitch sampling during sing/play phases
 * - Performance analysis (pitch accuracy, rhythm accuracy)
 *
 * Used with useLessonExerciseState for complete exercise functionality.
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { createAudioContext, createClickSound } from "./audioHelpers";
import { midiToFrequency } from "./noteUtils";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Configuration for note duration and rhythm
 */
export interface NoteConfig {
  /** Number of beats per note (e.g., 4 for whole note, 2 for half, 1 for quarter) */
  beatsPerNote: number;
  /** Whether to include subdivisions between beats */
  includeSubdivision?: boolean;
  /** Number of subdivisions per beat (2 for 8ths, 4 for 16ths) */
  subdivisionsPerBeat?: number;
}

/**
 * Configuration for count-in
 */
export interface CountInConfig {
  /** Number of count-in beats (default: 4) */
  beats: number;
  /** Whether to play click on first beat of count-in (accent) */
  accentFirst?: boolean;
}

/**
 * Note to play in the pattern
 */
export interface PatternNote {
  /** MIDI note number or frequency */
  midiOrFreq: number;
  /** Whether value is MIDI (true) or frequency (false) */
  isMidi?: boolean;
  /** Duration in beats (default: beatsPerNote from config) */
  durationBeats?: number;
}

/**
 * Pitch tracking reference data
 */
export interface PitchTrackingRefs {
  /** Whether any target pitch was hit */
  hasHitTargetPitch: React.MutableRefObject<boolean>;
  /** Count of on-pitch samples */
  onPitchCount: React.MutableRefObject<number>;
  /** Total sounding samples */
  totalSoundingCount: React.MutableRefObject<number>;
  /** Started early during count-in */
  startedEarly: React.MutableRefObject<boolean>;
  /** Percentage of each beat that had sound (for rhythm analysis) */
  soundingOnBeats: React.MutableRefObject<number[]>;
  /** Whether each note started on time (first half of beat) */
  noteStartedOnTime: React.MutableRefObject<boolean[]>;
  /** Per-note pitch accuracy tracking */
  notePitchAccuracy: React.MutableRefObject<
    Array<{ onPitch: number; total: number }>
  >;
  /** Current isSounding state (for sampling interval) */
  isSounding: React.MutableRefObject<boolean>;
}

/**
 * Performance analysis result
 */
export interface PerformanceAnalysis {
  success: boolean;
  pitchOk: boolean;
  rhythmOk: boolean;
  message: string;
  /** Detailed per-note analysis */
  details?: {
    perNotePitchAccuracy: number[];
    sustainPercentages: number[];
    startedOnTime: boolean[];
    startedEarly: boolean;
  };
}

/**
 * Configuration options for useLessonExerciseAudio
 */
export interface LessonExerciseAudioConfig {
  /** Tempo in BPM (default: 60) */
  tempo?: number;
  /** Note duration configuration */
  noteConfig?: NoteConfig;
  /** Count-in configuration */
  countIn?: CountInConfig;
  /** Target MIDI notes for pitch checking */
  targetMidiNotes?: number[];
  /** Clef for notation (treble or bass) */
  clef?: "treble" | "bass";
  /** Allow octave variance when checking pitch (for singing) */
  allowOctaveVariance?: boolean;
  /** Threshold for "on pitch" percentage (0-1, default: 0.3) */
  pitchSuccessThreshold?: number;
  /** Threshold for sustain percentage per note (0-1, default: 0.6) */
  sustainThreshold?: number;
  /** Threshold for per-note pitch accuracy (0-1, default: 0.4) */
  perNotePitchThreshold?: number;
}

/**
 * Return type for useLessonExerciseAudio hook
 */
export interface LessonExerciseAudioReturn {
  // Audio context
  audioContext: AudioContext | null;
  isAudioReady: boolean;

  // Playback functions
  playPattern: (notes: PatternNote[], onComplete?: () => void) => void;
  playMetronomeOnly: (
    noteCount: number,
    onComplete?: () => void,
    withDrone?: boolean,
    droneNote?: number,
  ) => void;
  stopPlayback: () => void;

  // Drone control
  startDrone: (midiNote: number) => void;
  stopDrone: () => void;
  isDroneActive: boolean;

  // Pitch tracking refs (for external use with usePitchDetection)
  trackingRefs: PitchTrackingRefs;
  resetTrackingRefs: (noteCount: number) => void;

  // Performance analysis
  analyzePerformance: (
    targetMidiNotes: number[],
    phase: "sing" | "play",
  ) => PerformanceAnalysis;

  // Beat tracking
  currentBeat: number;
  isSubdivision: boolean;
  isPlaying: boolean;

  // Callbacks for state updates (connect to useLessonExerciseState)
  setCurrentBeat: (beat: number) => void;
  setIsSubdivision: (isSub: boolean) => void;
  setIsPlaying: (playing: boolean) => void;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const DEFAULT_TEMPO = 60;
const DEFAULT_BEATS_PER_NOTE = 4;
const DEFAULT_COUNT_IN_BEATS = 4;
const DEFAULT_PITCH_THRESHOLD = 0.3;
const DEFAULT_SUSTAIN_THRESHOLD = 0.6;
const DEFAULT_PER_NOTE_PITCH_THRESHOLD = 0.4;
const SAMPLING_INTERVAL_MS = 50;

// -----------------------------------------------------------------------------
// Helper: Create subdivision click (softer than main click)
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Hook Implementation
// -----------------------------------------------------------------------------

/**
 * Audio management hook for lesson-style exercises
 *
 * @example
 * ```tsx
 * const audio = useLessonExerciseAudio({
 *   tempo: 60,
 *   noteConfig: { beatsPerNote: 2, includeSubdivision: true },
 * });
 *
 * // Play pattern
 * audio.playPattern(
 *   [{ midiOrFreq: 60, isMidi: true }, { midiOrFreq: 62, isMidi: true }],
 *   () => console.log('Done!'),
 * );
 *
 * // Analyze performance after sing/play
 * const result = audio.analyzePerformance([60, 62], 'sing');
 * ```
 */
export function useLessonExerciseAudio(
  config: LessonExerciseAudioConfig = {},
): LessonExerciseAudioReturn {
  const {
    tempo = DEFAULT_TEMPO,
    noteConfig = { beatsPerNote: DEFAULT_BEATS_PER_NOTE },
    countIn = { beats: DEFAULT_COUNT_IN_BEATS, accentFirst: true },
    allowOctaveVariance: _allowOctaveVariance = true,
    pitchSuccessThreshold = DEFAULT_PITCH_THRESHOLD,
    sustainThreshold = DEFAULT_SUSTAIN_THRESHOLD,
    perNotePitchThreshold = DEFAULT_PER_NOTE_PITCH_THRESHOLD,
  } = config;

  const {
    beatsPerNote,
    includeSubdivision = false,
    subdivisionsPerBeat = 2,
  } = noteConfig;

  // ---------------------------------------------------------------------------
  // Audio Context
  // ---------------------------------------------------------------------------
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isAudioReady, setIsAudioReady] = useState(false);

  useEffect(() => {
    audioContextRef.current = createAudioContext();
    setIsAudioReady(true);

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Playback State
  // ---------------------------------------------------------------------------
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isSubdivision, setIsSubdivision] = useState(false);

  // ---------------------------------------------------------------------------
  // Refs for Intervals and Oscillators
  // ---------------------------------------------------------------------------
  const beatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const samplingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const droneOscillatorRef = useRef<OscillatorNode | null>(null);
  const droneGainRef = useRef<GainNode | null>(null);
  const unmountedRef = useRef(false);
  const onCompleteRef = useRef<(() => void) | null>(null);

  // ---------------------------------------------------------------------------
  // Drone State
  // ---------------------------------------------------------------------------
  const [isDroneActive, setIsDroneActive] = useState(false);

  // ---------------------------------------------------------------------------
  // Pitch Tracking Refs
  // ---------------------------------------------------------------------------
  const hasHitTargetPitchRef = useRef(false);
  const onPitchCountRef = useRef(0);
  const totalSoundingCountRef = useRef(0);
  const startedEarlyRef = useRef(false);
  const soundingOnBeatsRef = useRef<number[]>([]);
  const noteStartedOnTimeRef = useRef<boolean[]>([]);
  const notePitchAccuracyRef = useRef<
    Array<{ onPitch: number; total: number }>
  >([]);
  const isSoundingRef = useRef(false);

  const trackingRefs: PitchTrackingRefs = {
    hasHitTargetPitch: hasHitTargetPitchRef,
    onPitchCount: onPitchCountRef,
    totalSoundingCount: totalSoundingCountRef,
    startedEarly: startedEarlyRef,
    soundingOnBeats: soundingOnBeatsRef,
    noteStartedOnTime: noteStartedOnTimeRef,
    notePitchAccuracy: notePitchAccuracyRef,
    isSounding: isSoundingRef,
  };

  const resetTrackingRefs = useCallback((noteCount: number) => {
    hasHitTargetPitchRef.current = false;
    onPitchCountRef.current = 0;
    totalSoundingCountRef.current = 0;
    startedEarlyRef.current = false;
    soundingOnBeatsRef.current = new Array(noteCount).fill(0);
    noteStartedOnTimeRef.current = new Array(noteCount).fill(false);
    notePitchAccuracyRef.current = Array.from({ length: noteCount }, () => ({
      onPitch: 0,
      total: 0,
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // Cleanup on Unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      unmountedRef.current = true;
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
          // Ignore errors from already-stopped oscillators
        }
      });
    };
  }, []);

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
    oscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop();
      } catch (_e) {
        // Ignore
      }
    });
    oscillatorsRef.current = [];
    setIsPlaying(false);
    setCurrentBeat(0);
    setIsSubdivision(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Drone Control
  // ---------------------------------------------------------------------------
  const startDrone = useCallback(
    (midiNote: number) => {
      const ctx = audioContextRef.current;
      if (!ctx || isDroneActive) return;

      const freq = midiToFrequency(midiNote);

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
      setIsDroneActive(true);
    },
    [isDroneActive],
  );

  const stopDrone = useCallback(() => {
    const ctx = audioContextRef.current;
    if (droneOscillatorRef.current && droneGainRef.current && ctx) {
      droneGainRef.current.gain.linearRampToValueAtTime(
        0,
        ctx.currentTime + 0.3,
      );
      setTimeout(() => {
        try {
          droneOscillatorRef.current?.stop();
        } catch (_e) {
          // Ignore
        }
        droneOscillatorRef.current = null;
        droneGainRef.current = null;
      }, 350);
    }
    setIsDroneActive(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Play Pattern (with melody)
  // ---------------------------------------------------------------------------
  const playPattern = useCallback(
    (notes: PatternNote[], onComplete?: () => void) => {
      const ctx = audioContextRef.current;
      if (!ctx || isPlaying) return;

      onCompleteRef.current = onComplete ?? null;
      setIsPlaying(true);
      setCurrentBeat(-countIn.beats);
      setIsSubdivision(false);

      const beatMs = (60 / tempo) * 1000;
      const intervalMs = includeSubdivision
        ? beatMs / subdivisionsPerBeat
        : beatMs;
      let beat = -countIn.beats;
      let isAnd = includeSubdivision;
      const totalBeats = notes.length * beatsPerNote;

      // Count-in accent
      createClickSound(ctx, countIn.accentFirst ?? true);

      beatIntervalRef.current = setInterval(() => {
        if (unmountedRef.current) {
          if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
          return;
        }

        if (includeSubdivision && isAnd) {
          createSubdivisionClick(ctx);
          setIsSubdivision(true);
          isAnd = false;
        } else {
          beat++;
          if (beat === 0) beat = 1;
          setIsSubdivision(false);

          if (beat >= -countIn.beats + 1 && beat <= -1) {
            // Count-in beats
            createClickSound(ctx, false);
            setCurrentBeat(beat);
          } else if (beat >= 1 && beat <= totalBeats) {
            // Play beats
            const isAccent = beat === 1 || (beat - 1) % beatsPerNote === 0;
            createClickSound(ctx, beat === 1);
            setCurrentBeat(beat);

            // Play note on accent beats
            if (isAccent) {
              const noteIndex = Math.floor((beat - 1) / beatsPerNote);
              if (noteIndex < notes.length) {
                const note = notes[noteIndex];
                const freq = note.isMidi
                  ? midiToFrequency(note.midiOrFreq)
                  : note.midiOrFreq;
                const duration =
                  ((note.durationBeats ?? beatsPerNote) * beatMs * 0.95) / 1000;

                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const now = ctx.currentTime;

                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, now);

                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.5, now + 0.02);
                gain.gain.setValueAtTime(0.4, now + duration - 0.1);
                gain.gain.linearRampToValueAtTime(0, now + duration);

                // Add harmonic for richer sound
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
            }
          } else if (beat === totalBeats + 1) {
            // Final beat (stop cue)
            createClickSound(ctx, true);
            setCurrentBeat(beat);
          } else {
            // End playback
            if (beatIntervalRef.current) {
              clearInterval(beatIntervalRef.current);
            }
            beatIntervalRef.current = null;
            setIsPlaying(false);
            setCurrentBeat(0);
            setIsSubdivision(false);
            oscillatorsRef.current = [];
            onCompleteRef.current?.();
            onCompleteRef.current = null;
            return;
          }
          if (includeSubdivision) isAnd = true;
        }
      }, intervalMs);
    },
    [
      tempo,
      beatsPerNote,
      countIn,
      includeSubdivision,
      subdivisionsPerBeat,
      isPlaying,
    ],
  );

  // ---------------------------------------------------------------------------
  // Play Metronome Only (no melody)
  // ---------------------------------------------------------------------------
  const playMetronomeOnly = useCallback(
    (
      noteCount: number,
      onComplete?: () => void,
      withDrone = false,
      droneNote?: number,
    ) => {
      const ctx = audioContextRef.current;
      if (!ctx || isPlaying) return;

      if (withDrone && droneNote !== undefined) {
        startDrone(droneNote);
      }

      onCompleteRef.current = onComplete ?? null;
      setIsPlaying(true);
      setCurrentBeat(-countIn.beats);
      setIsSubdivision(false);

      // Reset tracking refs
      resetTrackingRefs(noteCount);

      const beatMs = (60 / tempo) * 1000;
      const intervalMs = includeSubdivision
        ? beatMs / subdivisionsPerBeat
        : beatMs;
      let beat = -countIn.beats;
      let isAnd = includeSubdivision;
      const totalBeats = noteCount * beatsPerNote;

      // Sampling state
      let noteSoundingSamples = {
        noteIndex: -1,
        samples: 0,
        soundingCount: 0,
        firstHalfSoundingCount: 0,
      };
      let earlySoundingSamples = 0;
      let samplesBeforeChecking = 3;
      const samplesPerNote = Math.round(
        (beatMs * beatsPerNote) / SAMPLING_INTERVAL_MS,
      );
      const firstHalfThreshold = Math.round(samplesPerNote / 2);

      // Set up pitch sampling interval
      const samplingInterval = setInterval(() => {
        if (samplesBeforeChecking > 0) {
          samplesBeforeChecking--;
          return;
        }

        // Check for early start during count-in
        if (beat >= -countIn.beats && beat <= -1) {
          if (isSoundingRef.current) {
            earlySoundingSamples++;
            if (earlySoundingSamples >= 3) {
              startedEarlyRef.current = true;
            }
          } else {
            earlySoundingSamples = 0;
          }
        }

        // Track sounding by note index
        if (beat >= 1 && beat <= totalBeats) {
          const currentNoteIndex = Math.floor((beat - 1) / beatsPerNote);

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
      }, SAMPLING_INTERVAL_MS);
      samplingIntervalRef.current = samplingInterval;

      // Count-in accent
      createClickSound(ctx, countIn.accentFirst ?? true);

      beatIntervalRef.current = setInterval(() => {
        if (unmountedRef.current) {
          if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
          clearInterval(samplingInterval);
          return;
        }

        if (includeSubdivision && isAnd) {
          createSubdivisionClick(ctx);
          setIsSubdivision(true);
          isAnd = false;
        } else {
          beat++;
          if (beat === 0) beat = 1;
          setIsSubdivision(false);

          if (beat >= -countIn.beats + 1 && beat <= -1) {
            createClickSound(ctx, false);
            setCurrentBeat(beat);
          } else if (beat >= 1 && beat <= totalBeats) {
            const _isNoteStart = (beat - 1) % beatsPerNote === 0;
            createClickSound(ctx, beat === 1);
            setCurrentBeat(beat);
          } else if (beat === totalBeats + 1) {
            createClickSound(ctx, true);
            setCurrentBeat(beat);
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

            if (beatIntervalRef.current) {
              clearInterval(beatIntervalRef.current);
            }
            clearInterval(samplingInterval);
            beatIntervalRef.current = null;
            samplingIntervalRef.current = null;
            setIsPlaying(false);
            setCurrentBeat(0);
            setIsSubdivision(false);

            if (withDrone) {
              stopDrone();
            }

            onCompleteRef.current?.();
            onCompleteRef.current = null;
            return;
          }
          if (includeSubdivision) isAnd = true;
        }
      }, intervalMs);
    },
    [
      tempo,
      beatsPerNote,
      countIn,
      includeSubdivision,
      subdivisionsPerBeat,
      isPlaying,
      startDrone,
      stopDrone,
      resetTrackingRefs,
    ],
  );

  // ---------------------------------------------------------------------------
  // Performance Analysis
  // ---------------------------------------------------------------------------
  const analyzePerformance = useCallback(
    (
      targetMidiNotes: number[],
      phase: "sing" | "play",
    ): PerformanceAnalysis => {
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
      const perNotePitchOk = perNotePitch.every((note) => {
        if (note.total === 0) return false;
        return note.onPitch / note.total >= perNotePitchThreshold;
      });

      const successRatio = pitchCount / totalCount;
      const pitchOk =
        hitTarget && perNotePitchOk && successRatio >= pitchSuccessThreshold;

      // Check sustain (need to sound for most of each note)
      const allBeatsOk = beatSoundPct.every((pct) => pct >= sustainThreshold);

      // Check entrances (need to start each note on time)
      const allEntrancesOk = noteStartedOnTime.every(
        (started) => started === true,
      );

      const rhythmOk = !startedEarly && allBeatsOk && allEntrancesOk;

      const success = pitchOk && rhythmOk;

      let message = "";
      if (success) {
        message =
          phase === "sing"
            ? "Great singing!"
            : "Great job! You played the pattern accurately.";
      } else if (!pitchOk && rhythmOk) {
        message = "Good rhythm! Focus on matching the pitches more closely.";
      } else if (pitchOk && !rhythmOk) {
        if (startedEarly) {
          message = "Good pitches! Wait for beat 1 to start.";
        } else if (!allEntrancesOk) {
          message = "Good pitches! Start each note right on the beat.";
        } else {
          message = `Good pitches! Hold each note for the full ${beatsPerNote} beat${beatsPerNote > 1 ? "s" : ""}.`;
        }
      } else {
        message = "Keep practicing! Listen to the pattern again.";
      }

      return {
        success,
        pitchOk,
        rhythmOk,
        message,
        details: {
          perNotePitchAccuracy: perNotePitch.map((n) =>
            n.total > 0 ? n.onPitch / n.total : 0,
          ),
          sustainPercentages: [...beatSoundPct],
          startedOnTime: [...noteStartedOnTime],
          startedEarly,
        },
      };
    },
    [
      pitchSuccessThreshold,
      sustainThreshold,
      perNotePitchThreshold,
      beatsPerNote,
    ],
  );

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    // Audio context
    audioContext: audioContextRef.current,
    isAudioReady,

    // Playback functions
    playPattern,
    playMetronomeOnly,
    stopPlayback,

    // Drone control
    startDrone,
    stopDrone,
    isDroneActive,

    // Pitch tracking refs
    trackingRefs,
    resetTrackingRefs,

    // Performance analysis
    analyzePerformance,

    // Beat tracking
    currentBeat,
    isSubdivision,
    isPlaying,

    // State setters (for external control)
    setCurrentBeat,
    setIsSubdivision,
    setIsPlaying,
  };
}

export default useLessonExerciseAudio;
