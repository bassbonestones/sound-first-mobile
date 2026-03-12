/**
 * useExerciseAudio - Hook for playing notes in ear training exercises
 *
 * Uses Web Audio API / react-native-audio-api to generate sine wave tones
 */
import { useRef, useCallback, useEffect, useMemo } from "react";
import { Platform } from "react-native";
import { devLog, devWarn } from "../utils/devLogger";

// Cross-platform AudioContext
let NativeAudioContext = null;
if (Platform.OS !== "web") {
  try {
    NativeAudioContext = require("react-native-audio-api").AudioContext;
  } catch (e) {
    devWarn("react-native-audio-api not available");
  }
}

// Standard concert pitch
const CONCERT_A = 440;

/**
 * Calculate frequency for a note using equal temperament
 * @param {string} noteName - e.g., "C4", "F#3", "Bb5"
 */
function noteToFrequency(noteName) {
  const noteMap = {
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

/**
 * Calculate interval in semitones from interval name
 */
function intervalToSemitones(interval) {
  const intervals = {
    P1: 0,
    U: 0, // Unison
    m2: 1, // Minor 2nd
    M2: 2, // Major 2nd
    m3: 3, // Minor 3rd
    M3: 4, // Major 3rd
    P4: 4, // Perfect 4th... wait that's wrong
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

  // Fix P4
  intervals["P4"] = 5;

  return intervals[interval] ?? 0;
}

/**
 * Get frequency a certain interval above/below a base frequency
 */
function transposeFrequency(baseFreq, semitones) {
  return baseFreq * Math.pow(2, semitones / 12);
}

export default function useExerciseAudio() {
  const audioContextRef = useRef(null);
  const activeOscillatorsRef = useRef([]);

  // Initialize audio context
  const initAudio = useCallback(() => {
    if (audioContextRef.current) return audioContextRef.current;

    if (Platform.OS === "web") {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
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

  // Play a single note with piano-like timbre (matches Day 0 useFirstNoteAudio)
  const playNote = useCallback(
    (frequency, duration = 1.0, volume = 0.6) => {
      const ctx = initAudio();
      if (!ctx || ctx.state === "closed") return Promise.resolve();

      return new Promise((resolve) => {
        const now = ctx.currentTime;

        // Small delay to ensure gain envelope is set before oscillators start
        const startDelay = 0.005;
        const startTime = now + startDelay;

        // Piano envelope - slightly longer attack to prevent clicks
        const ATTACK = 0.02;
        const DECAY = 0.2;
        const SUSTAIN = 0.3;
        const RELEASE = 0.3;

        const masterGain = ctx.createGain();
        masterGain.connect(ctx.destination);

        // Set gain to 0 BEFORE oscillators start
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

        // Same harmonics as Day 0
        const harmonics = [
          { ratio: 1, gain: 1.0 },
          { ratio: 2, gain: 0.5 },
          { ratio: 3, gain: 0.25 },
          { ratio: 4, gain: 0.125 },
        ];

        const oscillators = harmonics.map(({ ratio, gain: harmGain }) => {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(frequency * ratio, startTime);
          oscGain.gain.setValueAtTime(harmGain * 0.3, startTime);
          osc.connect(oscGain);
          oscGain.connect(masterGain);
          return { osc, gain: oscGain };
        });

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

  // Play a note by name (e.g., "C4", "F#3")
  const playNoteByName = useCallback(
    (noteName, duration = 0.8) => {
      const freq = noteToFrequency(noteName);
      return playNote(freq, duration);
    },
    [playNote],
  );

  // Play two notes in sequence (for comparison exercises)
  const playTwoNotes = useCallback(
    async (freq1, freq2, noteDuration = 0.8, gap = 0.3) => {
      const ctx = initAudio();
      if (!ctx) return;

      await playNote(freq1, noteDuration);
      await new Promise((r) => setTimeout(r, gap * 1000));
      await playNote(freq2, noteDuration);
    },
    [initAudio, playNote],
  );

  // Generate exercise: same or different pitch
  const generateSameOrDifferent = useCallback(
    (baseNote, intervalPool = ["P1", "P5", "P4", "M3"]) => {
      const baseFreq = noteToFrequency(baseNote);

      // Random octave shift for variety (-1, 0, or +1 octave)
      const octaveShift = (Math.floor(Math.random() * 3) - 1) * 12; // -12, 0, or +12
      // Plus smaller offset within the octave (-5 to +5 semitones)
      const fineOffset = Math.floor(Math.random() * 11) - 5;
      const totalOffset = octaveShift + fineOffset;
      const freq1 = transposeFrequency(baseFreq, totalOffset);

      const isSame = Math.random() < 0.5;

      let secondFreq;
      if (isSame) {
        secondFreq = freq1;
      } else {
        // Filter out P1 (unison) since we need different notes
        const nonUnisonPool = intervalPool.filter(
          (i) => i !== "P1" && i !== "U",
        );
        const pool =
          nonUnisonPool.length > 0 ? nonUnisonPool : ["P5", "P4", "M3"];

        // Pick random interval from the pool
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

  // Generate exercise: pitch direction (up, down, or same)
  const generatePitchDirection = useCallback(
    (
      baseNote,
      intervalPool = ["M2", "m2", "M3", "P4", "P5"],
      includeSame = false,
    ) => {
      const baseFreq = noteToFrequency(baseNote);

      // Random octave shift for variety (-1, 0, or +1 octave)
      const octaveShift = (Math.floor(Math.random() * 3) - 1) * 12; // -12, 0, or +12
      // Plus smaller offset within the octave (-5 to +5 semitones)
      const fineOffset = Math.floor(Math.random() * 11) - 5;
      const totalOffset = octaveShift + fineOffset;
      const freq1 = transposeFrequency(baseFreq, totalOffset);

      let direction;
      if (includeSame) {
        const rand = Math.random();
        if (rand < 0.33) direction = "same";
        else if (rand < 0.66) direction = "up";
        else direction = "down";
      } else {
        direction = Math.random() < 0.5 ? "up" : "down";
      }

      let secondFreq;
      if (direction === "same") {
        secondFreq = freq1;
      } else {
        // Filter out unison from pool for up/down
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
