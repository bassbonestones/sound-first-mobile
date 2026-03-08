/**
 * useFirstNoteAudio - Audio playback for FirstNote flow
 * Handles resonant note, pitch explorer, and accidental explorer sounds
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { Platform } from "react-native";
import { noteToFrequency } from "../utils";
import { PITCH_EXPLORER_NOTES } from "../data";

// Cross-platform AudioContext
let NativeAudioContext = null;
try {
  NativeAudioContext = require("react-native-audio-api").AudioContext;
} catch (e) {
  // react-native-audio-api not available
}

export default function useFirstNoteAudio(resonantNote) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [showHeardItButton, setShowHeardItButton] = useState(false);

  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const heardItTimerRef = useRef(null);
  const playbackTimeoutRef = useRef(null);

  // Get or create audio context
  const getAudioContext = useCallback(async () => {
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
  const stopOscillator = useCallback(() => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.onended = null;
        oscillatorRef.current.stop();
      } catch (e) {
        /* ignore */
      }
      oscillatorRef.current = null;
    }
  }, []);

  // Play the user's resonant note using Web Audio (pure sine wave)
  const playNote = useCallback(async () => {
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
      if (!ctx) {
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
      console.error("Audio error:", err);
      setIsPlaying(false);
      if (heardItTimerRef.current) {
        clearTimeout(heardItTimerRef.current);
      }
    }
  }, [resonantNote, getAudioContext, stopOscillator]);

  // Play piano-like note with harmonics
  const playPianoNote = useCallback(
    async (freq) => {
      const DURATION = 1;
      const ATTACK = 0.01;
      const DECAY = 0.2;
      const SUSTAIN = 0.3;
      const RELEASE = 0.3;

      try {
        stopOscillator();
        const ctx = await getAudioContext();
        if (!ctx) return;

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
        console.error("Piano note audio error:", err);
      }
    },
    [getAudioContext, stopOscillator],
  );

  // Play pitch explorer note
  const playPitchExplorer = useCallback(
    async (noteIndex) => {
      const noteName = PITCH_EXPLORER_NOTES[noteIndex].name;
      const freq = noteToFrequency(noteName);
      await playPianoNote(freq);
    },
    [playPianoNote],
  );

  // Play accidental explorer note
  const playAccidentalExplorer = useCallback(
    async (accidental) => {
      const noteMap = {
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
    async (noteIndex, accidental) => {
      const baseName = PITCH_EXPLORER_NOTES[noteIndex].name;
      const letter = baseName.slice(0, 1);
      const octave = baseName.slice(1);

      let noteName;
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
  const stopAudio = useCallback(() => {
    stopOscillator();
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
    }
    setIsPlaying(false);
  }, [stopOscillator]);

  // Reset heard it button
  const resetHeardIt = useCallback(() => {
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
