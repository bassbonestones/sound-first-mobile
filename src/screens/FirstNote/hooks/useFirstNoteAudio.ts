/**
 * useFirstNoteAudio - Audio playback for FirstNote flow
 * Handles resonant note, pitch explorer, and accidental explorer sounds
 */
import {
  useState,
  useRef,
  useCallback,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import { Platform } from "react-native";
import { devError } from "../../../utils/devLogger";
import { noteToFrequency } from "../utils";
import { PITCH_EXPLORER_NOTES } from "../data";

/** Accidental type for explorer */
export type AccidentalType = "flat" | "natural" | "sharp";

/** Return type for useFirstNoteAudio hook */
export interface UseFirstNoteAudioReturn {
  isPlaying: boolean;
  playCount: number;
  showHeardItButton: boolean;
  setShowHeardItButton: Dispatch<SetStateAction<boolean>>;
  playNote: () => Promise<void>;
  playPitchExplorer: (noteIndex: number) => Promise<void>;
  playAccidentalExplorer: (accidental: AccidentalType) => Promise<void>;
  playCombinedExplorer: (
    noteIndex: number,
    accidental: AccidentalType,
  ) => Promise<void>;
  stopAudio: () => void;
  resetHeardIt: () => void;
}

// Cross-platform AudioContext
let NativeAudioContext: typeof AudioContext | null = null;
try {
  NativeAudioContext = require("react-native-audio-api").AudioContext;
} catch (e) {
  // react-native-audio-api not available
}

/**
 * Hook for audio playback in FirstNote flow
 * @param resonantNote - The user's resonant note (e.g., "C4")
 * @returns Object containing playback state and controls
 */
export default function useFirstNoteAudio(
  resonantNote: string,
): UseFirstNoteAudioReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [showHeardItButton, setShowHeardItButton] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | OscillatorNode[] | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const heardItTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get or create audio context
  const getAudioContext =
    useCallback(async (): Promise<AudioContext | null> => {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }
        if (audioContextRef.current.state === "suspended") {
          await audioContextRef.current.resume();
        }
        return audioContextRef.current;
      } else if (NativeAudioContext) {
        if (!audioContextRef.current) {
          audioContextRef.current = new NativeAudioContext();
        }
        return audioContextRef.current;
      }
      return null;
    }, []);

  // Stop any existing oscillator
  const stopOscillator = useCallback((): void => {
    if (oscillatorRef.current) {
      try {
        const osc = Array.isArray(oscillatorRef.current)
          ? oscillatorRef.current[0]
          : oscillatorRef.current;
        osc.onended = null;
        osc.stop();
      } catch (e) {
        /* ignore */
      }
      oscillatorRef.current = null;
    }
  }, []);

  // Play the user's resonant note using Web Audio (pure sine wave)
  const playNote = useCallback(async (): Promise<void> => {
    const DURATION = 3;
    const ATTACK = 0.05;
    const RELEASE = 0.1;

    try {
      setIsPlaying(true);

      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
      }

      if (heardItTimerRef.current) {
        clearTimeout(heardItTimerRef.current);
      }
      heardItTimerRef.current = setTimeout(() => {
        setShowHeardItButton(true);
      }, 2000);

      stopOscillator();
      const ctx = await getAudioContext();
      if (!ctx || ctx.state === "closed") {
        setIsPlaying(false);
        return;
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(noteToFrequency(resonantNote), now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.5, now + ATTACK);
      gain.gain.setValueAtTime(0.5, now + DURATION - RELEASE);
      gain.gain.linearRampToValueAtTime(0, now + DURATION);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + DURATION);

      oscillatorRef.current = osc;
      gainNodeRef.current = gain;

      osc.onended = () => {
        if (playbackTimeoutRef.current) {
          clearTimeout(playbackTimeoutRef.current);
          playbackTimeoutRef.current = null;
        }
        setIsPlaying(false);
        setPlayCount((prev) => prev + 1);
        setShowHeardItButton(true);
      };

      playbackTimeoutRef.current = setTimeout(
        () => {
          setIsPlaying(false);
          setShowHeardItButton(true);
        },
        (DURATION + 0.5) * 1000,
      );
    } catch (err) {
      devError("Audio error:", err);
      setIsPlaying(false);
      if (heardItTimerRef.current) {
        clearTimeout(heardItTimerRef.current);
      }
    }
  }, [resonantNote, getAudioContext, stopOscillator]);

  // Play piano-like note with harmonics
  const playPianoNote = useCallback(
    async (freq: number): Promise<void> => {
      const DURATION = 1;
      const ATTACK = 0.01;
      const DECAY = 0.2;
      const SUSTAIN = 0.3;
      const RELEASE = 0.3;

      try {
        stopOscillator();
        const ctx = await getAudioContext();
        if (!ctx || ctx.state === "closed") return;

        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        masterGain.connect(ctx.destination);

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
          osc.frequency.setValueAtTime(freq * ratio, now);
          oscGain.gain.setValueAtTime(harmGain * 0.3, now);
          osc.connect(oscGain);
          oscGain.connect(masterGain);
          return osc;
        });

        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(0.6, now + ATTACK);
        masterGain.gain.linearRampToValueAtTime(SUSTAIN, now + ATTACK + DECAY);
        masterGain.gain.setValueAtTime(SUSTAIN, now + DURATION - RELEASE);
        masterGain.gain.linearRampToValueAtTime(0, now + DURATION);

        oscillators.forEach((osc) => {
          osc.start(now);
          osc.stop(now + DURATION);
        });

        oscillatorRef.current = oscillators[0];
      } catch (err) {
        devError("Piano note audio error:", err);
      }
    },
    [getAudioContext, stopOscillator],
  );

  // Play pitch explorer note
  const playPitchExplorer = useCallback(
    async (noteIndex: number): Promise<void> => {
      const noteName = PITCH_EXPLORER_NOTES[noteIndex].name;
      const freq = noteToFrequency(noteName);
      await playPianoNote(freq);
    },
    [playPianoNote],
  );

  // Play accidental explorer note
  const playAccidentalExplorer = useCallback(
    async (accidental: AccidentalType): Promise<void> => {
      const noteMap: Record<AccidentalType, string> = {
        flat: "Db3",
        natural: "D3",
        sharp: "D#3",
      };
      const freq = noteToFrequency(noteMap[accidental]);
      await playPianoNote(freq);
    },
    [playPianoNote],
  );

  // Play combined explorer note
  const playCombinedExplorer = useCallback(
    async (noteIndex: number, accidental: AccidentalType): Promise<void> => {
      const baseName = PITCH_EXPLORER_NOTES[noteIndex].name;
      const letter = baseName.slice(0, 1);
      const octave = baseName.slice(1);

      let noteName: string;
      if (accidental === "flat") {
        noteName = `${letter}b${octave}`;
      } else if (accidental === "sharp") {
        noteName = `${letter}#${octave}`;
      } else {
        noteName = baseName;
      }

      const freq = noteToFrequency(noteName);
      await playPianoNote(freq);
    },
    [playPianoNote],
  );

  // Stop any playing audio
  const stopAudio = useCallback((): void => {
    stopOscillator();
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
    }
    setIsPlaying(false);
  }, [stopOscillator]);

  // Reset heard it button
  const resetHeardIt = useCallback((): void => {
    setShowHeardItButton(false);
    if (heardItTimerRef.current) {
      clearTimeout(heardItTimerRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (heardItTimerRef.current) {
        clearTimeout(heardItTimerRef.current);
      }
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [stopAudio]);

  return {
    isPlaying,
    playCount,
    showHeardItButton,
    setShowHeardItButton,
    playNote,
    playPitchExplorer,
    playAccidentalExplorer,
    playCombinedExplorer,
    stopAudio,
    resetHeardIt,
  };
}
