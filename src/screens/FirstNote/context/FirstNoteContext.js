import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { Platform } from "react-native";
import { getBackendUrl } from "../../../api/client";
import {
  parseNoteName,
  noteToFrequency,
  generateSingleNoteMusicXML,
} from "../utils";
import {
  INSTRUMENT_CLEFS,
  PITCH_EXPLORER_NOTES,
  DEFAULT_PITCH_EXPLORER_INDEX,
} from "../data";

// Cross-platform AudioContext
let NativeAudioContext = null;
try {
  NativeAudioContext = require("react-native-audio-api").AudioContext;
} catch (e) {
  // react-native-audio-api not available
}

const FirstNoteContext = createContext(null);

/**
 * Provider component that manages all FirstNote state and logic
 */
export function FirstNoteProvider({ children, navigation, route }) {
  const {
    userId = 1,
    resonantNote = "Bb3",
    instrument = "trombone",
  } = route?.params || {};

  // Core state
  const [stage, setStage] = useState(0);
  const [subStep, setSubStep] = useState(0);
  const [pitchExplorerIndex, setPitchExplorerIndex] = useState(
    DEFAULT_PITCH_EXPLORER_INDEX,
  );
  const [accidentalExplorer, setAccidentalExplorer] = useState("natural");
  const [showSummary, setShowSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0);
  const [pitchAccuracy, setPitchAccuracy] = useState(null);
  const [playCount, setPlayCount] = useState(0);
  const [focusCardIndex, setFocusCardIndex] = useState(0);
  const [focusCardRatings, setFocusCardRatings] = useState([]);
  const [focusStepsDone, setFocusStepsDone] = useState({
    listen: false,
    sing: false,
    imagine: false,
    play: false,
  });
  const [focusActiveStep, setFocusActiveStep] = useState(0);
  const [showHeardItButton, setShowHeardItButton] = useState(false);
  const [rating, setRating] = useState(null);

  // Refs
  const audioRef = useRef(null);
  const heardItTimerRef = useRef(null);
  const playbackTimeoutRef = useRef(null);
  const gotCorrectPitchRef = useRef(false);
  const focusListenStartedRef = useRef(false);
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);

  // Derived values
  const noteInfo = useMemo(() => parseNoteName(resonantNote), [resonantNote]);
  const clefType = useMemo(
    () => INSTRUMENT_CLEFS[instrument.toLowerCase()] || "treble",
    [instrument],
  );
  const stage6MusicXML = useMemo(
    () => generateSingleNoteMusicXML(resonantNote, clefType),
    [resonantNote, clefType],
  );

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

      // Web: Use Web Audio API
      if (Platform.OS === "web" && typeof window !== "undefined") {
        if (oscillatorRef.current) {
          try {
            oscillatorRef.current.onended = null;
            oscillatorRef.current.stop();
          } catch (e) {
            /* ignore */
          }
        }

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }
        if (audioContextRef.current.state === "suspended") {
          await audioContextRef.current.resume();
        }
      } else if (NativeAudioContext) {
        if (oscillatorRef.current) {
          try {
            oscillatorRef.current.onended = null;
            oscillatorRef.current.stop();
          } catch (e) {
            /* ignore */
          }
        }

        if (!audioContextRef.current) {
          audioContextRef.current = new NativeAudioContext();
        }
      } else {
        setError("Audio not available on this platform");
        setIsPlaying(false);
        return;
      }

      const ctx = audioContextRef.current;
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
      setError(`Audio error: ${err.message}`);
      setIsPlaying(false);
      if (heardItTimerRef.current) {
        clearTimeout(heardItTimerRef.current);
      }
    }
  }, [resonantNote]);

  // Play pitch explorer note with piano-like sound
  const playPitchExplorer = useCallback(async (noteIndex) => {
    const DURATION = 1;
    const ATTACK = 0.01;
    const DECAY = 0.2;
    const SUSTAIN = 0.3;
    const RELEASE = 0.3;

    try {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.onended = null;
          oscillatorRef.current.stop();
        } catch (e) {
          /* ignore */
        }
      }

      if (Platform.OS === "web" && typeof window !== "undefined") {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }
        if (audioContextRef.current.state === "suspended") {
          await audioContextRef.current.resume();
        }
      } else if (NativeAudioContext) {
        if (!audioContextRef.current) {
          audioContextRef.current = new NativeAudioContext();
        }
      } else {
        return;
      }

      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      const noteName = PITCH_EXPLORER_NOTES[noteIndex].name;
      const freq = noteToFrequency(noteName);

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
      console.error("Pitch explorer audio error:", err);
    }
  }, []);

  // Play accidental explorer note
  const playAccidentalExplorer = useCallback(async (accidental) => {
    const DURATION = 1;
    const ATTACK = 0.01;
    const DECAY = 0.2;
    const SUSTAIN = 0.3;
    const RELEASE = 0.3;

    const noteMap = {
      flat: "Db3",
      natural: "D3",
      sharp: "D#3",
    };

    try {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.onended = null;
          oscillatorRef.current.stop();
        } catch (e) {
          /* ignore */
        }
      }

      if (Platform.OS === "web" && typeof window !== "undefined") {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }
        if (audioContextRef.current.state === "suspended") {
          await audioContextRef.current.resume();
        }
      } else if (NativeAudioContext) {
        if (!audioContextRef.current) {
          audioContextRef.current = new NativeAudioContext();
        }
      } else {
        return;
      }

      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      const freq = noteToFrequency(noteMap[accidental]);

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
      console.error("Accidental explorer audio error:", err);
    }
  }, []);

  // Play combined explorer note
  const playCombinedExplorer = useCallback(async (noteIndex, accidental) => {
    const DURATION = 1;
    const ATTACK = 0.01;
    const DECAY = 0.2;
    const SUSTAIN = 0.3;
    const RELEASE = 0.3;

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

    try {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.onended = null;
          oscillatorRef.current.stop();
        } catch (e) {
          /* ignore */
        }
      }

      if (Platform.OS === "web" && typeof window !== "undefined") {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }
        if (audioContextRef.current.state === "suspended") {
          await audioContextRef.current.resume();
        }
      } else if (NativeAudioContext) {
        if (!audioContextRef.current) {
          audioContextRef.current = new NativeAudioContext();
        }
      } else {
        return;
      }

      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      const freq = noteToFrequency(noteName);

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
      console.error("Combined explorer audio error:", err);
    }
  }, []);

  // Stop any playing audio
  const stopAudio = useCallback(() => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch (e) {
        /* ignore */
      }
      oscillatorRef.current = null;
    }
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
    }
    setIsPlaying(false);
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

  // Reset UI state when stage or subStep changes
  useEffect(() => {
    setShowHeardItButton(false);
    setRating(null);
    if (heardItTimerRef.current) {
      clearTimeout(heardItTimerRef.current);
    }
  }, [stage, subStep]);

  // Mark Focus Card listen step as done when audio ends
  useEffect(() => {
    if (stage === 2 && focusListenStartedRef.current && !isPlaying) {
      setFocusStepsDone((prev) => ({ ...prev, listen: true }));
      focusListenStartedRef.current = false;
    }
  }, [stage, isPlaying]);

  // Handle successful pitch match
  const handlePitchMatch = useCallback((isMatch, noteInfo) => {
    setPitchAccuracy(isMatch ? "correct" : "off");
    if (isMatch) {
      gotCorrectPitchRef.current = true;
    }
  }, []);

  // Handle sound end (for advancing after they play in Stage 1)
  const handleSoundEnd = useCallback(() => {
    if (stage === 1 && subStep === 2) {
      setSubStep(3);
      gotCorrectPitchRef.current = false;
    }
  }, [stage, subStep]);

  // Save progress to backend
  const saveProgress = useCallback(
    async (newStage) => {
      try {
        await fetch(`${getBackendUrl()}/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ day0_stage: newStage }),
        });
      } catch (err) {
        console.error("Failed to save progress:", err);
      }
    },
    [userId],
  );

  // Complete Day 0
  const completeDay0 = useCallback(async () => {
    try {
      await fetch(`${getBackendUrl()}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day0_completed: true, day0_stage: 7 }),
      });
      navigation.replace("StartPractice");
    } catch (err) {
      console.error("Failed to complete Day 0:", err);
      navigation.replace("StartPractice");
    }
  }, [userId, navigation]);

  // Advance to next stage
  const nextStage = useCallback(() => {
    const newStage = stage + 1;
    setStage(newStage);
    setSubStep(newStage === 1 ? 2 : 0);
    setFocusCardIndex(0);
    setFocusCardRatings([]);
    setFocusStepsDone({
      listen: false,
      sing: false,
      imagine: false,
      play: false,
    });
    setPitchAccuracy(null);
    saveProgress(newStage);
  }, [stage, saveProgress]);

  // Go back within teaching stages (3+)
  const goBackTeaching = useCallback((targetStage, targetSubStep) => {
    setStage(targetStage);
    setSubStep(targetSubStep);
  }, []);

  const value = {
    // Route params
    userId,
    resonantNote,
    instrument,
    navigation,

    // Core state
    stage,
    setStage,
    subStep,
    setSubStep,
    pitchExplorerIndex,
    setPitchExplorerIndex,
    accidentalExplorer,
    setAccidentalExplorer,
    showSummary,
    setShowSummary,
    isLoading,
    setIsLoading,
    error,
    setError,

    // Audio state
    isPlaying,
    volume,
    setVolume,
    pitchAccuracy,
    setPitchAccuracy,
    playCount,
    focusCardIndex,
    setFocusCardIndex,
    focusCardRatings,
    setFocusCardRatings,
    focusStepsDone,
    setFocusStepsDone,
    focusActiveStep,
    setFocusActiveStep,
    showHeardItButton,
    setShowHeardItButton,
    rating,
    setRating,

    // Derived values
    noteInfo,
    clefType,
    stage6MusicXML,

    // Refs
    gotCorrectPitchRef,
    focusListenStartedRef,

    // Audio handlers
    playNote,
    playPitchExplorer,
    playAccidentalExplorer,
    playCombinedExplorer,
    stopAudio,

    // Other handlers
    handlePitchMatch,
    handleSoundEnd,
    saveProgress,
    completeDay0,
    nextStage,
    goBackTeaching,
  };

  return (
    <FirstNoteContext.Provider value={value}>
      {children}
    </FirstNoteContext.Provider>
  );
}

/**
 * Hook to access FirstNote context
 */
export function useFirstNote() {
  const context = useContext(FirstNoteContext);
  if (!context) {
    throw new Error("useFirstNote must be used within a FirstNoteProvider");
  }
  return context;
}
