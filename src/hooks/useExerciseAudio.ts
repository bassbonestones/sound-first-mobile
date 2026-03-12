/**
 * useExerciseAudio - Hook for playing notes in ear training exercises
 *
 * Uses Web Audio API / react-native-audio-api to generate sine wave tones
 */
import { useRef, useCallback, useEffect, useMemo } from "react";
import { Platform } from "react-native";
import { devLog, devWarn } from "../utils/devLogger";

// Cross-platform AudioContext
let NativeAudioContext: typeof AudioContext | null = null;
if (Platform.OS !== "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    NativeAudioContext = require("react-native-audio-api").AudioContext;
  } catch (e) {
    devWarn("react-native-audio-api not available");
  }
}

// Standard concert pitch
const CONCERT_A = 440;

interface NoteMap {
  [key: string]: number;
}

const noteMap: NoteMap = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  "E#": 5,
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
  Cb: 11,
  "B#": 0,
};

/**
 * Calculate frequency for a note using equal temperament
 * @param noteName - e.g., "C4", "F#3", "Bb5"
 */
export function noteToFrequency(noteName: string): number {
  // Parse note name (e.g., "F#4" -> note="F#", octave=4)
  const match = noteName.match(/^([A-Ga-g][#b]?)(\d)$/);
  if (!match) {
    devWarn("Invalid note name:", noteName);
    return 440; // Default to A4
  }

  const [, note, octaveStr] = match;
  const semitone = noteMap[note.charAt(0).toUpperCase() + note.slice(1)];
  const octave = parseInt(octaveStr, 10);

  if (semitone === undefined) {
    devWarn("Unknown note:", note);
    return 440;
  }

  // MIDI note number: C4 = 60
  const midiNote = (octave + 1) * 12 + semitone;
  return CONCERT_A * Math.pow(2, (midiNote - 69) / 12);
}

interface IntervalMap {
  [key: string]: number;
}

/**
 * Calculate interval in semitones from interval name
 */
function intervalToSemitones(interval: string): number {
  const intervals: IntervalMap = {
    P1: 0,
    U: 0, // Unison
    m2: 1, // Minor 2nd
    M2: 2, // Major 2nd
    m3: 3, // Minor 3rd
    M3: 4, // Major 3rd
    P4: 5, // Perfect 4th
    A4: 6,
    d5: 6, // Tritone
    P5: 7, // Perfect 5th
    m6: 8, // Minor 6th
    M6: 9, // Major 6th
    m7: 10, // Minor 7th
    M7: 11, // Major 7th
    P8: 12,
    O: 12, // Octave
  };

  return intervals[interval] ?? 0;
}

/**
 * Get frequency a certain interval above/below a base frequency
 */
function transposeFrequency(baseFreq: number, semitones: number): number {
  return baseFreq * Math.pow(2, semitones / 12);
}

export type SameOrDifferentAnswer = "same" | "different";
export type PitchDirectionAnswer = "up" | "down" | "same";

export interface SameOrDifferentExercise {
  freq1: number;
  freq2: number;
  correctAnswer: SameOrDifferentAnswer;
}

export interface PitchDirectionExercise {
  freq1: number;
  freq2: number;
  correctAnswer: PitchDirectionAnswer;
}

export interface UseExerciseAudioReturn {
  playNote: (
    frequency: number,
    duration?: number,
    volume?: number,
  ) => Promise<void>;
  playNoteByName: (noteName: string, duration?: number) => Promise<void>;
  playTwoNotes: (
    freq1: number,
    freq2: number,
    noteDuration?: number,
    gap?: number,
  ) => Promise<void>;
  stopAll: () => void;
  generateSameOrDifferent: (
    baseNote: string,
    intervalPool?: string[],
  ) => SameOrDifferentExercise;
  generatePitchDirection: (
    baseNote: string,
    intervalPool?: string[],
    includeSame?: boolean,
  ) => PitchDirectionExercise;
  noteToFrequency: (noteName: string) => number;
}

interface OscillatorRef {
  osc: OscillatorNode;
  gain: GainNode;
}

export default function useExerciseAudio(): UseExerciseAudioReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeOscillatorsRef = useRef<OscillatorRef[]>([]);

  // Initialize audio context
  const initAudio = useCallback((): AudioContext | null => {
    if (audioContextRef.current) return audioContextRef.current;

    if (Platform.OS === "web") {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    } else if (NativeAudioContext) {
      audioContextRef.current = new NativeAudioContext();
    }

    return audioContextRef.current;
  }, []);

  // Stop all currently playing sounds
  const stopAll = useCallback(() => {
    activeOscillatorsRef.current.forEach(({ osc, gain }) => {
      try {
        gain.gain.setValueAtTime(0, audioContextRef.current?.currentTime || 0);
        osc.stop();
      } catch (e) {
        // Already stopped
      }
    });
    activeOscillatorsRef.current = [];
  }, []);

  // Play a single note with piano-like timbre
  const playNote = useCallback(
    (
      frequency: number,
      duration: number = 1.0,
      volume: number = 0.6,
    ): Promise<void> => {
      const ctx = initAudio();
      if (!ctx || ctx.state === "closed") return Promise.resolve();

      return new Promise((resolve) => {
        const now = ctx.currentTime;

        // Small delay to ensure gain envelope is set before oscillators start
        const startDelay = 0.005;
        const startTime = now + startDelay;

        // Piano envelope
        const ATTACK = 0.02;
        const DECAY = 0.2;
        const SUSTAIN = 0.3;
        const RELEASE = 0.3;

        const masterGain = ctx.createGain();
        masterGain.connect(ctx.destination);

        // Set gain envelope
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.setValueAtTime(0, startTime);
        masterGain.gain.linearRampToValueAtTime(volume, startTime + ATTACK);
        masterGain.gain.linearRampToValueAtTime(
          SUSTAIN * volume,
          startTime + ATTACK + DECAY,
        );
        masterGain.gain.setValueAtTime(
          SUSTAIN * volume,
          startTime + duration - RELEASE,
        );
        masterGain.gain.linearRampToValueAtTime(0, startTime + duration);

        // Harmonics for piano-like timbre
        const harmonics = [
          { ratio: 1, gain: 1.0 },
          { ratio: 2, gain: 0.5 },
          { ratio: 3, gain: 0.25 },
          { ratio: 4, gain: 0.125 },
        ];

        const oscillators: OscillatorRef[] = harmonics.map(
          ({ ratio, gain: harmGain }) => {
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(frequency * ratio, startTime);
            oscGain.gain.setValueAtTime(harmGain * 0.3, startTime);
            osc.connect(oscGain);
            oscGain.connect(masterGain);
            return { osc, gain: oscGain };
          },
        );

        oscillators.forEach(({ osc }) => {
          osc.start(startTime);
          osc.stop(startTime + duration + 0.05);
        });

        activeOscillatorsRef.current.push(...oscillators);

        setTimeout(
          () => {
            resolve();
          },
          (duration + startDelay) * 1000,
        );
      });
    },
    [initAudio],
  );

  // Play a note by name
  const playNoteByName = useCallback(
    (noteName: string, duration: number = 0.8): Promise<void> => {
      const freq = noteToFrequency(noteName);
      return playNote(freq, duration);
    },
    [playNote],
  );

  // Play two notes in sequence
  const playTwoNotes = useCallback(
    async (
      freq1: number,
      freq2: number,
      noteDuration: number = 0.8,
      gap: number = 0.3,
    ): Promise<void> => {
      const ctx = initAudio();
      if (!ctx) return;

      await playNote(freq1, noteDuration);
      await new Promise<void>((r) => setTimeout(r, gap * 1000));
      await playNote(freq2, noteDuration);
    },
    [initAudio, playNote],
  );

  // Generate exercise: same or different pitch
  const generateSameOrDifferent = useCallback(
    (
      baseNote: string,
      intervalPool: string[] = ["P1", "P5", "P4", "M3"],
    ): SameOrDifferentExercise => {
      const baseFreq = noteToFrequency(baseNote);

      // Random octave shift for variety
      const octaveShift = (Math.floor(Math.random() * 3) - 1) * 12;
      const fineOffset = Math.floor(Math.random() * 11) - 5;
      const totalOffset = octaveShift + fineOffset;
      const freq1 = transposeFrequency(baseFreq, totalOffset);

      const isSame = Math.random() < 0.5;

      let secondFreq: number;
      if (isSame) {
        secondFreq = freq1;
      } else {
        const nonUnisonPool = intervalPool.filter(
          (i) => i !== "P1" && i !== "U",
        );
        const pool =
          nonUnisonPool.length > 0 ? nonUnisonPool : ["P5", "P4", "M3"];

        const interval = pool[Math.floor(Math.random() * pool.length)];
        const semitones = intervalToSemitones(interval);
        const direction = Math.random() < 0.5 ? 1 : -1;
        secondFreq = transposeFrequency(freq1, semitones * direction);
      }

      devLog(
        `[Exercise] Same/Diff: isSame=${isSame}, offset=${totalOffset}, f1=${freq1.toFixed(1)}, f2=${secondFreq.toFixed(1)}`,
      );

      return {
        freq1,
        freq2: secondFreq,
        correctAnswer: isSame ? "same" : "different",
      };
    },
    [],
  );

  // Generate exercise: pitch direction
  const generatePitchDirection = useCallback(
    (
      baseNote: string,
      intervalPool: string[] = ["M2", "m2", "M3", "P4", "P5"],
      includeSame: boolean = false,
    ): PitchDirectionExercise => {
      const baseFreq = noteToFrequency(baseNote);

      const octaveShift = (Math.floor(Math.random() * 3) - 1) * 12;
      const fineOffset = Math.floor(Math.random() * 11) - 5;
      const totalOffset = octaveShift + fineOffset;
      const freq1 = transposeFrequency(baseFreq, totalOffset);

      let direction: PitchDirectionAnswer;
      if (includeSame) {
        const rand = Math.random();
        if (rand < 0.33) direction = "same";
        else if (rand < 0.66) direction = "up";
        else direction = "down";
      } else {
        direction = Math.random() < 0.5 ? "up" : "down";
      }

      let secondFreq: number;
      if (direction === "same") {
        secondFreq = freq1;
      } else {
        const pool = intervalPool.filter((i) => i !== "P1" && i !== "U");
        const interval =
          pool.length > 0
            ? pool[Math.floor(Math.random() * pool.length)]
            : "P5";
        const semitones = intervalToSemitones(interval);
        secondFreq = transposeFrequency(
          freq1,
          semitones * (direction === "up" ? 1 : -1),
        );
      }

      devLog(
        `[Exercise] Direction: dir=${direction}, offset=${totalOffset}, interval semitones=${(Math.log2(secondFreq / freq1) * 12).toFixed(1)}`,
      );

      return {
        freq1,
        freq2: secondFreq,
        correctAnswer: direction,
      };
    },
    [],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll();
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {
          // Already closed
        }
      }
    };
  }, [stopAll]);

  return useMemo(
    () => ({
      playNote,
      playNoteByName,
      playTwoNotes,
      stopAll,
      generateSameOrDifferent,
      generatePitchDirection,
      noteToFrequency,
    }),
    [
      playNote,
      playNoteByName,
      playTwoNotes,
      stopAll,
      generateSameOrDifferent,
      generatePitchDirection,
    ],
  );
}
