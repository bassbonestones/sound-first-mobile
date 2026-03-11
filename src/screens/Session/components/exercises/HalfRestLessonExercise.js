/**
 * HalfRestLessonExercise - Teaches the half rest concept
 *
 * Flow: Focus Card → Listen → Sing → Imagine → Play → Feedback
 * Key concepts:
 * - A half rest = 2 beats of silence
 * - Sits ON TOP of the middle line (like a hat)
 * - Mnemonic: "Half rest HAT sits on top" vs "Whole rest HOLE hangs below"
 * - Exercise: half note → half rest → half note (2 measures)
 */
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Modal,
} from "react-native";
import { usePitchDetection } from "../../../../hooks/usePitchDetection";
import { CircularVolumeIndicator } from "../../../../components/VolumeBar";

// Import AudioContext
let NativeAudioContext = null;
if (Platform.OS !== "web") {
  try {
    NativeAudioContext = require("react-native-audio-api").AudioContext;
  } catch (e) {
    console.warn("react-native-audio-api not available");
  }
}

// For notation display
let NotationDisplay = null;
try {
  NotationDisplay = require("../../../../components/NotationDisplay").default;
} catch (e) {
  console.warn("NotationDisplay not available");
}

// Pitch detection options
const PITCH_DETECTION_OPTIONS = {
  volumeThreshold: 0.05,
  silenceDuration: 150,
  soundingFrequencyRange: { min: 60, max: 1200 },
};

// Phases
const PHASE = {
  FOCUS_CARD: "focus_card",
  LISTEN: "listen",
  SING: "sing",
  IMAGINE: "imagine",
  PLAY: "play",
  FEEDBACK: "feedback",
};

// Parse note name to components
function parseNoteName(noteName) {
  if (!noteName) return null;
  const match = noteName.match(/^([A-Ga-g])([#b]?)(\d)$/);
  if (!match) return null;
  const [, letter, accidental, octaveStr] = match;
  return {
    letter: letter.toUpperCase(),
    accidental,
    octave: parseInt(octaveStr, 10),
  };
}

// Convert note name to MIDI number
function noteToMidi(noteName) {
  const parsed = parseNoteName(noteName);
  if (!parsed) return 60;
  const letterIndex = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[
    parsed.letter
  ];
  let noteIndex = letterIndex;
  if (parsed.accidental === "#") noteIndex += 1;
  if (parsed.accidental === "b") noteIndex -= 1;
  return (parsed.octave + 1) * 12 + noteIndex;
}

// Convert MIDI to frequency
function midiToFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Convert note name to frequency
function noteToFrequency(noteName) {
  return midiToFrequency(noteToMidi(noteName));
}

// Generate MusicXML for half note → half rest → half note pattern (2 measures)
function generateHalfRestPatternMusicXML(noteName, clef = "treble") {
  const parsed = parseNoteName(noteName);
  if (!parsed) return null;

  let alter = 0;
  let accidentalName = "natural";
  if (parsed.accidental === "b") {
    alter = -1;
    accidentalName = "flat";
  } else if (parsed.accidental === "#") {
    alter = 1;
    accidentalName = "sharp";
  }

  const clefSign = clef === "bass" ? "F" : "G";
  const clefLine = clef === "bass" ? "4" : "2";
  const alterXML = alter !== 0 ? `        <alter>${alter}</alter>\n` : "";
  const accidentalXML =
    alter !== 0 ? `        <accidental>${accidentalName}</accidental>\n` : "";

  // Pattern: half note (2 beats) | half rest (2 beats) | half note (2 beats) | half rest (2 beats)
  // But we want: half note | half rest | half note - so 3 half notes/rests = 6 beats
  // We'll do measure 1: half note + half rest, measure 2: half note + half rest padding
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name></part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>2</divisions>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <key>
          <fifths>0</fifths>
        </key>
        <clef>
          <sign>${clefSign}</sign>
          <line>${clefLine}</line>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>${parsed.letter}</step>
${alterXML}          <octave>${parsed.octave}</octave>
        </pitch>
        <duration>4</duration>
        <type>half</type>
${accidentalXML}      </note>
      <note>
        <rest/>
        <duration>4</duration>
        <type>half</type>
      </note>
    </measure>
    <measure number="2">
      <note>
        <pitch>
          <step>${parsed.letter}</step>
${alterXML}          <octave>${parsed.octave}</octave>
        </pitch>
        <duration>4</duration>
        <type>half</type>
      </note>
      <note>
        <rest/>
        <duration>4</duration>
        <type>half</type>
      </note>
    </measure>
  </part>
</score-partwise>`;
}

// Create a click sound for metronome
function createClickSound(audioContext, isAccent = false) {
  const sampleRate = audioContext.sampleRate;
  const duration = 0.03;
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
  filter.frequency.value = isAccent ? 1500 : 1000;
  filter.Q.value = 0.7;

  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(isAccent ? 0.8 : 0.5, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + duration,
  );

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);

  source.start(audioContext.currentTime);
}

export default function HalfRestLessonExercise({
  config,
  mastery,
  onComplete,
  onProgress,
  userFirstNote = "F3",
}) {
  // State
  const [phase, setPhase] = useState(PHASE.FOCUS_CARD);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentMeasure, setCurrentMeasure] = useState(1);
  const [showNotation, setShowNotation] = useState(false);
  const [singResult, setSingResult] = useState(null);
  const [playResult, setPlayResult] = useState(null);
  const [successfulRounds, setSuccessfulRounds] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasHeardPattern, setHasHeardPattern] = useState(false);
  const [singAttempts, setSingAttempts] = useState(0);
  const [playAttempts, setPlayAttempts] = useState(0);
  const [showAttestModal, setShowAttestModal] = useState(false);
  const [attestPhase, setAttestPhase] = useState(null);

  // Refs
  const audioContextRef = useRef(null);
  const beatIntervalRef = useRef(null);
  const samplingIntervalRef = useRef(null);
  const oscillatorRef = useRef(null);
  const oscillator2Ref = useRef(null);
  const gainNodeRef = useRef(null);
  const unmountedRef = useRef(false);
  const isSoundingRef = useRef(false);
  const hasHitTargetPitchRef = useRef(false);
  const onPitchCountRef = useRef(0);
  const totalSoundingCountRef = useRef(0);
  // Track beats across 2 measures:
  // M1: 1,2 = half note, 3,4 = half rest
  // M2: 5,6 = half note, 7,8 = rest/end
  // Array indices: [m1b1, m1b2, m1b3, m1b4, m2b1, m2b2, m2b3, m2b4]
  const soundingOnBeatsRef = useRef([0, 0, 0, 0, 0, 0, 0, 0]);
  const startedEarlyRef = useRef(false);
  const scrollViewRef = useRef(null);

  // Store onComplete callback
  const onCompleteRef = useRef(null);

  // Config
  const bpm = config?.bpm || 60;
  const masteryStreak = mastery?.correct_streak || 3;
  const clef = config?.clef || "treble";

  // Parse note info
  const noteInfo = useMemo(() => {
    const parsed = parseNoteName(userFirstNote);
    return parsed || { letter: "F", accidental: "", octave: 3 };
  }, [userFirstNote]);

  const targetFrequency = useMemo(
    () => noteToFrequency(userFirstNote),
    [userFirstNote],
  );

  // Generate MusicXML
  const musicXML = useMemo(
    () => generateHalfRestPatternMusicXML(userFirstNote, clef),
    [userFirstNote, clef],
  );

  // Pitch detection
  const { currentPitch, volume, isSounding } = usePitchDetection({
    enabled:
      (phase === PHASE.SING && !singResult) ||
      (phase === PHASE.PLAY && !playResult),
    ...PITCH_DETECTION_OPTIONS,
  });

  // Track pitch accuracy
  const targetMidi = useMemo(() => noteToMidi(userFirstNote), [userFirstNote]);

  useEffect(() => {
    if (!isSounding || !currentPitch?.noteName) return;

    const detectedMidi = noteToMidi(currentPitch.noteName);
    if (detectedMidi === null) return;

    const pitchDiff = Math.abs(detectedMidi - targetMidi);

    const isOnPitch =
      phase === PHASE.SING
        ? pitchDiff % 12 <= 1 || pitchDiff % 12 >= 11
        : pitchDiff <= 1;

    totalSoundingCountRef.current += 1;
    if (isOnPitch) {
      hasHitTargetPitchRef.current = true;
      onPitchCountRef.current += 1;
    }
  }, [currentPitch?.noteName, isSounding, targetMidi, phase]);

  useEffect(() => {
    isSoundingRef.current = isSounding;
  }, [isSounding]);

  // Reset tracking when phase changes
  useEffect(() => {
    hasHitTargetPitchRef.current = false;
    onPitchCountRef.current = 0;
    totalSoundingCountRef.current = 0;
    soundingOnBeatsRef.current = [0, 0, 0, 0, 0, 0, 0, 0];
    startedEarlyRef.current = false;
  }, [phase]);

  const detectedNoteName = useMemo(() => {
    if (!currentPitch?.noteName || !isSounding) return null;
    return currentPitch.noteName;
  }, [currentPitch?.noteName, isSounding]);

  // Initialize audio context
  useEffect(() => {
    if (Platform.OS === "web") {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
    } else if (NativeAudioContext) {
      audioContextRef.current = new NativeAudioContext();
    }

    return () => {
      unmountedRef.current = true;
      if (beatIntervalRef.current) {
        clearInterval(beatIntervalRef.current);
      }
      if (samplingIntervalRef.current) {
        clearInterval(samplingIntervalRef.current);
      }
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch (e) {}
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    setShowNotation(false);
  }, [phase]);

  // Play half note-rest-note pattern
  const playHalfNoteRestPattern = useCallback(
    (onComplete) => {
      const ctx = audioContextRef.current;
      if (!ctx || isPlaying) return;

      onCompleteRef.current =
        typeof onComplete === "function" ? onComplete : null;

      setIsPlaying(true);
      setCurrentBeat(-4);
      setCurrentMeasure(1);

      const beatMs = (60 / bpm) * 1000;
      let beat = -4;
      let absoluteBeat = -4;

      const playHalfNote = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const now = ctx.currentTime;
        const duration = (beatMs * 2) / 1000;

        osc.type = "sine";
        osc.frequency.setValueAtTime(targetFrequency, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.5, now + 0.02);
        gain.gain.setValueAtTime(0.4, now + duration - 0.1);
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
      };

      createClickSound(ctx, true);

      beatIntervalRef.current = setInterval(() => {
        if (unmountedRef.current) {
          clearInterval(beatIntervalRef.current);
          return;
        }

        beat++;
        absoluteBeat++;
        if (beat === 0) {
          beat = 1;
          absoluteBeat = 1;
        }

        if (beat >= -3 && beat <= -1) {
          createClickSound(ctx, false);
          setCurrentBeat(beat);
        } else if (beat === 1) {
          // M1 Beat 1 - start first half note
          createClickSound(ctx, true);
          playHalfNote();
          setCurrentMeasure(1);
          setCurrentBeat(1);
        } else if (beat === 2) {
          // M1 Beat 2 - continue half note
          createClickSound(ctx, false);
          setCurrentBeat(2);
        } else if (beat === 3) {
          // M1 Beat 3 - start half rest (silence)
          createClickSound(ctx, false);
          setCurrentBeat(3);
        } else if (beat === 4) {
          // M1 Beat 4 - continue half rest
          createClickSound(ctx, false);
          setCurrentBeat(4);
        } else if (beat === 5) {
          // M2 Beat 1 - start second half note
          createClickSound(ctx, true);
          playHalfNote();
          setCurrentMeasure(2);
          setCurrentBeat(1);
        } else if (beat === 6) {
          // M2 Beat 2 - continue half note
          createClickSound(ctx, false);
          setCurrentBeat(2);
        } else if (beat === 7) {
          // M2 Beat 3 - the next ONE (pattern complete)
          createClickSound(ctx, true);
          setCurrentBeat(3);
        } else {
          clearInterval(beatIntervalRef.current);
          beatIntervalRef.current = null;
          setIsPlaying(false);
          setCurrentBeat(0);
          setCurrentMeasure(1);
          if (onCompleteRef.current) {
            onCompleteRef.current();
            onCompleteRef.current = null;
          }
        }
      }, beatMs);
    },
    [bpm, targetFrequency, isPlaying],
  );

  // Stop playback
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
      } catch (e) {}
    }
    if (oscillator2Ref.current) {
      try {
        oscillator2Ref.current.stop();
      } catch (e) {}
    }
    setIsPlaying(false);
    setCurrentBeat(0);
    setCurrentMeasure(1);
  }, []);

  // Play metronome only (for sing/play phases)
  const playMetronomeOnly = useCallback(
    (onComplete) => {
      const ctx = audioContextRef.current;
      if (!ctx || isPlaying) return;

      onCompleteRef.current =
        typeof onComplete === "function" ? onComplete : null;

      setIsPlaying(true);
      setCurrentBeat(-4);
      setCurrentMeasure(1);
      soundingOnBeatsRef.current = [0, 0, 0, 0, 0, 0, 0, 0];
      startedEarlyRef.current = false;

      const beatMs = (60 / bpm) * 1000;
      let beat = -4;
      let absoluteBeat = -4;

      let beatSoundingSamples = { beat: 0, samples: 0, soundingCount: 0 };
      let earlySoundingSamples = 0;
      let samplesBeforeChecking = 3;

      const samplingInterval = setInterval(() => {
        if (samplesBeforeChecking > 0) {
          samplesBeforeChecking--;
          return;
        }

        // Check for early start during count-in
        if (absoluteBeat >= -4 && absoluteBeat <= -1) {
          if (isSoundingRef.current) {
            earlySoundingSamples++;
            if (earlySoundingSamples >= 3) {
              startedEarlyRef.current = true;
            }
          } else {
            earlySoundingSamples = 0;
          }
        }
        // Track beats 1-8 (across 2 measures)
        if (absoluteBeat >= 1 && absoluteBeat <= 7) {
          if (beatSoundingSamples.beat !== absoluteBeat) {
            if (
              beatSoundingSamples.beat >= 1 &&
              beatSoundingSamples.samples > 0
            ) {
              const percentage =
                beatSoundingSamples.soundingCount / beatSoundingSamples.samples;
              const idx = beatSoundingSamples.beat - 1;
              soundingOnBeatsRef.current[idx] = Math.max(
                soundingOnBeatsRef.current[idx],
                percentage,
              );
            }
            beatSoundingSamples = {
              beat: absoluteBeat,
              samples: 0,
              soundingCount: 0,
            };
          }
          beatSoundingSamples.samples++;
          if (isSoundingRef.current) {
            beatSoundingSamples.soundingCount++;
          }
        }
      }, 50);
      samplingIntervalRef.current = samplingInterval;

      createClickSound(ctx, true);

      beatIntervalRef.current = setInterval(() => {
        if (unmountedRef.current) {
          clearInterval(beatIntervalRef.current);
          clearInterval(samplingInterval);
          return;
        }

        beat++;
        absoluteBeat++;
        if (beat === 0) {
          beat = 1;
          absoluteBeat = 1;
        }

        if (beat >= -3 && beat <= -1) {
          createClickSound(ctx, false);
          setCurrentBeat(beat);
        } else if (absoluteBeat === 1) {
          createClickSound(ctx, true);
          setCurrentMeasure(1);
          setCurrentBeat(1);
        } else if (absoluteBeat === 2) {
          createClickSound(ctx, false);
          setCurrentBeat(2);
        } else if (absoluteBeat === 3) {
          createClickSound(ctx, false);
          setCurrentBeat(3);
        } else if (absoluteBeat === 4) {
          createClickSound(ctx, false);
          setCurrentBeat(4);
        } else if (absoluteBeat === 5) {
          createClickSound(ctx, true);
          setCurrentMeasure(2);
          setCurrentBeat(1);
        } else if (absoluteBeat === 6) {
          createClickSound(ctx, false);
          setCurrentBeat(2);
        } else if (absoluteBeat === 7) {
          createClickSound(ctx, true);
          setCurrentBeat(3);
        } else {
          if (
            beatSoundingSamples.beat >= 1 &&
            beatSoundingSamples.samples > 0
          ) {
            const percentage =
              beatSoundingSamples.soundingCount / beatSoundingSamples.samples;
            const idx = beatSoundingSamples.beat - 1;
            soundingOnBeatsRef.current[idx] = Math.max(
              soundingOnBeatsRef.current[idx],
              percentage,
            );
          }
          clearInterval(beatIntervalRef.current);
          clearInterval(samplingInterval);
          beatIntervalRef.current = null;
          samplingIntervalRef.current = null;
          setIsPlaying(false);
          setCurrentBeat(0);
          setCurrentMeasure(1);
          if (onCompleteRef.current) {
            onCompleteRef.current();
            onCompleteRef.current = null;
          }
        }
      }, beatMs);
    },
    [bpm, isPlaying],
  );

  // Analyze performance
  const analyzePerformance = useCallback(() => {
    const totalCount = totalSoundingCountRef.current;
    const pitchCount = onPitchCountRef.current;
    const hitTarget = hasHitTargetPitchRef.current;

    const beatSoundPct = soundingOnBeatsRef.current;
    const startedEarly = startedEarlyRef.current;
    console.log("[HalfRestLesson] analyzePerformance:", {
      totalCount,
      pitchCount,
      hitTarget,
      beatSoundPct,
      startedEarly,
    });

    if (totalCount === 0) {
      return {
        success: false,
        pitchOk: false,
        rhythmOk: false,
        message: "No sound detected",
      };
    }
    const successRatio = pitchCount / totalCount;
    const pitchOk = hitTarget && successRatio >= 0.3;

    const SUSTAIN_THRESHOLD = 0.75;
    const SILENCE_THRESHOLD = 0.4; // More forgiving for natural decay/room echo

    // Pattern: half note (1-2), half rest (3-4), half note (5-6), end on 7
    // Beats 1,2 should have sound
    const firstNoteSustained =
      beatSoundPct[0] >= SUSTAIN_THRESHOLD &&
      beatSoundPct[1] >= SUSTAIN_THRESHOLD;
    // Beats 3,4 should be silent (rest)
    const restWasSilent =
      beatSoundPct[2] < SILENCE_THRESHOLD &&
      beatSoundPct[3] < SILENCE_THRESHOLD;
    // Beats 5,6 should have sound
    const secondNoteSustained =
      beatSoundPct[4] >= SUSTAIN_THRESHOLD &&
      beatSoundPct[5] >= SUSTAIN_THRESHOLD;
    // Beat 7 should be silent (end)
    const stoppedOnNextOne = beatSoundPct[6] < SILENCE_THRESHOLD;

    const rhythmOk =
      !startedEarly &&
      firstNoteSustained &&
      restWasSilent &&
      secondNoteSustained &&
      stoppedOnNextOne;

    const success = pitchOk && rhythmOk;

    let message = "Great!";
    if (!pitchOk && !rhythmOk) {
      message = "Try to match the pitch and follow the rhythm";
    } else if (!pitchOk) {
      message = "Good rhythm! Try to match the pitch better";
    } else if (startedEarly) {
      message = "Wait for beat ONE to start";
    } else if (!firstNoteSustained) {
      message = "Hold the first half note for 2 full beats";
    } else if (!restWasSilent) {
      message = "Be silent during the half rest (beats 3-4)";
    } else if (!secondNoteSustained) {
      message = "Hold the second half note for 2 full beats";
    } else if (!stoppedOnNextOne) {
      message = "Stop at beat 3 of measure 2";
    }

    return { success, pitchOk, rhythmOk, message };
  }, []);

  const handleDoneSinging = useCallback(() => {
    const result = analyzePerformance();
    setSingResult(result);
    if (!result.success) {
      setSingAttempts((prev) => prev + 1);
    }
  }, [analyzePerformance]);

  const handleTrySingAgain = useCallback(() => {
    setSingResult(null);
    hasHitTargetPitchRef.current = false;
    onPitchCountRef.current = 0;
    totalSoundingCountRef.current = 0;
    soundingOnBeatsRef.current = [0, 0, 0, 0, 0, 0, 0, 0];
    startedEarlyRef.current = false;
    setTimeout(() => {
      playMetronomeOnly(handleDoneSinging);
    }, 100);
  }, [playMetronomeOnly, handleDoneSinging]);

  const handleDoneImagining = useCallback(() => {
    stopPlayback();
    hasHitTargetPitchRef.current = false;
    onPitchCountRef.current = 0;
    totalSoundingCountRef.current = 0;
    soundingOnBeatsRef.current = [0, 0, 0, 0, 0, 0, 0, 0];
    startedEarlyRef.current = false;
    setPhase(PHASE.PLAY);
  }, [stopPlayback]);

  const handleDonePlaying = useCallback(() => {
    const result = analyzePerformance();
    setPlayResult(result);
    if (!result.success) {
      setPlayAttempts((prev) => prev + 1);
    }
  }, [analyzePerformance]);

  const handleTryPlayAgain = useCallback(() => {
    setPlayResult(null);
    hasHitTargetPitchRef.current = false;
    onPitchCountRef.current = 0;
    totalSoundingCountRef.current = 0;
    soundingOnBeatsRef.current = [0, 0, 0, 0, 0, 0, 0, 0];
    startedEarlyRef.current = false;
    setTimeout(() => {
      playMetronomeOnly(handleDonePlaying);
    }, 100);
  }, [playMetronomeOnly, handleDonePlaying]);

  const handleContinue = useCallback(() => {
    setSingResult(null);
    setPlayResult(null);
    hasHitTargetPitchRef.current = false;
    onPitchCountRef.current = 0;
    totalSoundingCountRef.current = 0;
    soundingOnBeatsRef.current = [0, 0, 0, 0, 0, 0, 0, 0];
    startedEarlyRef.current = false;
    setHasHeardPattern(false);
    setSingAttempts(0);
    setPlayAttempts(0);
    setPhase(PHASE.LISTEN);
  }, []);

  const handleAttestConfirm = useCallback(() => {
    setShowAttestModal(false);
    if (attestPhase === "sing") {
      setSingResult({ success: true, attested: true });
    } else if (attestPhase === "play") {
      setPlayResult({ success: true, attested: true });
    }
    setAttestPhase(null);
  }, [attestPhase]);

  const handleShowAttestModal = useCallback((phase) => {
    setAttestPhase(phase);
    setShowAttestModal(true);
  }, []);

  useEffect(() => {
    onProgress?.({
      streak: successfulRounds,
      masteryRequired: masteryStreak,
    });
  }, [successfulRounds, masteryStreak, onProgress]);

  const memoizedNotation = useMemo(() => {
    if (!NotationDisplay) return null;
    return (
      <NotationDisplay
        musicxml={musicXML}
        width={320}
        height={200}
        showTimeSignature={true}
      />
    );
  }, [musicXML]);

  // Compute cursor position (4 half notes/rests: beats 1-2, 3-4, 5-6, 7-8)
  // Note: currentBeat resets to 1-4 each measure, so use currentMeasure to calculate absolute index
  const cursorNoteIndex = useMemo(() => {
    if (!showNotation || currentBeat < 1 || currentBeat > 4) return null;
    // (measure-1)*2 gives base index (0 for m1, 2 for m2)
    // floor((beat-1)/2) gives offset within measure (0 for beats 1-2, 1 for beats 3-4)
    return (currentMeasure - 1) * 2 + Math.floor((currentBeat - 1) / 2);
  }, [showNotation, currentBeat, currentMeasure]);

  // Scroll to top when notation is opened
  const handleShowNotation = useCallback(() => {
    setShowNotation(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  }, []);

  const renderNotationToggle = () => {
    if (!NotationDisplay) return null;

    // 4 half note/rest positions: 2 in measure 1, 2 in measure 2
    const notePositions = [85, 145, 210, 270];
    const highlightLeft = cursorNoteIndex !== null ? notePositions[cursorNoteIndex] : null;
    const highlightWidth = 40;

    return (
      <View style={styles.notationContainer}>
        {!showNotation ? (
          <TouchableOpacity
            style={styles.showNotationButton}
            onPress={handleShowNotation}
          >
            <Text style={styles.showNotationText}>Show Notation 📝</Text>
          </TouchableOpacity>
        ) : (
          <>
            <View style={[styles.notationWrapper, { position: 'relative' }]}>
              {memoizedNotation}
              {/* Green highlight overlay */}
              {highlightLeft !== null && (
                <View
                  style={{
                    position: 'absolute',
                    left: highlightLeft,
                    top: 40,
                    width: highlightWidth,
                    height: 120,
                    backgroundColor: 'rgba(76, 175, 80, 0.25)',
                    borderRadius: 4,
                    borderWidth: 2,
                    borderColor: 'rgba(76, 175, 80, 0.6)',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </View>
            <TouchableOpacity
              style={styles.hideNotationButton}
              onPress={() => setShowNotation(false)}
            >
              <Text style={styles.hideNotationText}>Hide Notation</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  const renderFocusCardMini = () => {
    return (
      <View style={styles.focusCardMini}>
        <View style={styles.focusCardMiniLeft}>
          <View style={styles.halfRestSymbolMini}>
            <View style={styles.halfRestLineMini} />
            <View style={styles.halfRestBlockMini} />
          </View>
        </View>
        <View style={styles.focusCardMiniRight}>
          <Text style={styles.focusCardMiniTitle}>Half Rest</Text>
          <Text style={styles.focusCardMiniText}>
            2 beats silence · sits ON line
          </Text>
        </View>
      </View>
    );
  };

  // Beat indicator for half rest pattern (2 measures) - shows all 8 beats at once
  const BeatIndicator = () => {
    // Calculate absolute beat position (1-8)
    const absoluteBeat =
      currentMeasure === 1
        ? currentBeat
        : currentBeat > 0
          ? currentBeat + 4
          : currentBeat;

    return (
      <View style={styles.beatIndicatorContainer}>
        <View style={styles.countInRow}>
          <Text style={styles.countInLabel}>Count in:</Text>
          <View style={styles.countInBeats}>
            {[-4, -3, -2, -1].map((beat, index) => (
              <View
                key={beat}
                style={[
                  styles.countInDot,
                  beat <= currentBeat &&
                    currentBeat < 0 &&
                    styles.countInDotActive,
                  beat === -4 && styles.countInDotAccent,
                ]}
              >
                <Text
                  style={[
                    styles.countInNumber,
                    beat <= currentBeat &&
                      currentBeat < 0 &&
                      styles.countInNumberActive,
                  ]}
                >
                  {index + 1}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.fullPatternContainer}>
          <View style={styles.measureGroup}>
            <Text style={styles.measureGroupLabel}>M1</Text>
            <View style={styles.beatRow}>
              {/* M1: Half note on 1-2, half rest on 3-4 */}
              <View
                style={[
                  styles.beatDotSmall,
                  styles.beatDotAccent,
                  absoluteBeat >= 1 && currentBeat > 0 && styles.beatDotActive,
                ]}
              >
                <Text
                  style={[
                    styles.beatNumberSmall,
                    absoluteBeat >= 1 &&
                      currentBeat > 0 &&
                      styles.beatNumberActive,
                  ]}
                >
                  1
                </Text>
              </View>
              <View
                style={[
                  styles.beatDotSmall,
                  absoluteBeat >= 2 && currentBeat > 0 && styles.beatDotActive,
                ]}
              >
                <Text
                  style={[
                    styles.beatNumberSmall,
                    absoluteBeat >= 2 &&
                      currentBeat > 0 &&
                      styles.beatNumberActive,
                  ]}
                >
                  2
                </Text>
              </View>
              <View
                style={[
                  styles.beatDotSmall,
                  styles.beatDotRest,
                  absoluteBeat >= 3 &&
                    currentBeat > 0 &&
                    styles.beatDotRestActive,
                ]}
              >
                <Text
                  style={[
                    styles.beatNumberSmall,
                    absoluteBeat >= 3 &&
                      currentBeat > 0 &&
                      styles.beatNumberRestActive,
                  ]}
                >
                  3
                </Text>
              </View>
              <View
                style={[
                  styles.beatDotSmall,
                  styles.beatDotRest,
                  absoluteBeat >= 4 &&
                    currentBeat > 0 &&
                    styles.beatDotRestActive,
                ]}
              >
                <Text
                  style={[
                    styles.beatNumberSmall,
                    absoluteBeat >= 4 &&
                      currentBeat > 0 &&
                      styles.beatNumberRestActive,
                  ]}
                >
                  4
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.measureGroup}>
            <Text style={styles.measureGroupLabel}>M2</Text>
            <View style={styles.beatRow}>
              {/* M2: Half note on 1-2 */}
              <View
                style={[
                  styles.beatDotSmall,
                  styles.beatDotAccent,
                  absoluteBeat >= 5 && currentBeat > 0 && styles.beatDotActive,
                ]}
              >
                <Text
                  style={[
                    styles.beatNumberSmall,
                    absoluteBeat >= 5 &&
                      currentBeat > 0 &&
                      styles.beatNumberActive,
                  ]}
                >
                  1
                </Text>
              </View>
              <View
                style={[
                  styles.beatDotSmall,
                  absoluteBeat >= 6 && currentBeat > 0 && styles.beatDotActive,
                ]}
              >
                <Text
                  style={[
                    styles.beatNumberSmall,
                    absoluteBeat >= 6 &&
                      currentBeat > 0 &&
                      styles.beatNumberActive,
                  ]}
                >
                  2
                </Text>
              </View>
              <View
                style={[
                  styles.beatDotSmall,
                  styles.beatDotStop,
                  absoluteBeat >= 7 &&
                    currentBeat > 0 &&
                    styles.beatDotStopActive,
                ]}
              >
                <Text
                  style={[
                    styles.beatNumberSmall,
                    absoluteBeat >= 7 &&
                      currentBeat > 0 &&
                      styles.beatNumberStopActive,
                  ]}
                >
                  3
                </Text>
              </View>
              <View style={styles.beatDotPlaceholder} />
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Attestation Modal
  const attestationModal = useMemo(
    () => (
      <Modal
        visible={showAttestModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAttestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm</Text>
            <Text style={styles.modalText}>
              I attest that I {attestPhase === "sing" ? "sang" : "played"} this
              correctly, but due to background noise or technical issues it was
              not able to register.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAttestModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleAttestConfirm}
              >
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    ),
    [showAttestModal, attestPhase, handleAttestConfirm],
  );

  // FOCUS CARD PHASE
  if (phase === PHASE.FOCUS_CARD) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.focusCard}>
            <Text style={styles.focusCardTitle}>Half Rest</Text>
            <View style={styles.halfRestSymbol}>
              <View style={styles.halfRestLine} />
              <View style={styles.halfRestBlock} />
            </View>
            <Text style={styles.focusCardDescription}>
              A half rest = 2 beats of silence.
            </Text>
            <View style={styles.focusCardDivider} />
            <Text style={styles.focusCardCue}>
              It sits ON TOP of the middle line.
            </Text>
            <Text style={styles.focusCardMnemonic}>
              "Half rest HAT sits on top"
            </Text>
            <View style={styles.comparisonBox}>
              <Text style={styles.comparisonTitle}>Compare:</Text>
              <View style={styles.comparisonRow}>
                <View style={styles.comparisonItem}>
                  <View style={styles.wholeRestSymbolSmall}>
                    <View style={styles.wholeRestLineSmall} />
                    <View style={styles.wholeRestBlockSmall} />
                  </View>
                  <Text style={styles.comparisonLabel}>Whole rest</Text>
                  <Text style={styles.comparisonDetail}>Hangs BELOW</Text>
                </View>
                <View style={styles.comparisonItem}>
                  <View style={styles.halfRestSymbolSmall}>
                    <View style={styles.halfRestLineSmall} />
                    <View style={styles.halfRestBlockSmall} />
                  </View>
                  <Text style={styles.comparisonLabel}>Half rest</Text>
                  <Text style={styles.comparisonDetail}>Sits ON TOP</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Show actual notation */}
          <View style={styles.notationPreview}>
            <Text style={styles.notationPreviewLabel}>
              On the staff (half note → half rest → half note):
            </Text>
            <View style={styles.notationWrapper}>{memoizedNotation}</View>
          </View>
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setPhase(PHASE.LISTEN)}
          >
            <Text style={styles.primaryButtonText}>Got It →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // LISTEN PHASE
  if (phase === PHASE.LISTEN) {
    return (
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {renderFocusCardMini()}

          <Text style={styles.phaseTitle}>Listen</Text>
          <Text style={styles.noteDisplay}>
            {noteInfo.letter}
            {noteInfo.accidental}
          </Text>
          <Text style={styles.instruction}>
            Listen to: half note → half rest → half note.{"\n"}
            Notice how the rest creates 2 beats of silence.
          </Text>

          {/* Show notation at top when open */}
          {showNotation && renderNotationToggle()}

          {isPlaying && <BeatIndicator />}

          {/* Show notation button at bottom when closed */}
          {!showNotation && renderNotationToggle()}
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          {!hasHeardPattern ? (
            <TouchableOpacity
              style={[styles.primaryButton, isPlaying && styles.buttonDisabled]}
              onPress={() => {
                playHalfNoteRestPattern(() => setHasHeardPattern(true));
              }}
              disabled={isPlaying}
            >
              <Text style={styles.primaryButtonText}>
                {isPlaying ? "🔊 Playing..." : "🔊 Hear Pattern"}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  isPlaying && styles.buttonDisabled,
                ]}
                onPress={playHalfNoteRestPattern}
                disabled={isPlaying}
              >
                <Text style={styles.secondaryButtonText}>
                  {isPlaying ? "🔊 Playing..." : "🔊 Hear Again"}
                </Text>
              </TouchableOpacity>
              {!isPlaying && (
                <TouchableOpacity
                  style={[styles.primaryButton, { marginTop: 8 }]}
                  onPress={() => {
                    stopPlayback();
                    setPhase(PHASE.SING);
                  }}
                >
                  <Text style={styles.primaryButtonText}>I Heard It →</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    );
  }

  // SING PHASE
  if (phase === PHASE.SING) {
    return (
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {renderFocusCardMini()}

          <Text style={styles.phaseTitle}>Sing</Text>
          <Text style={styles.noteDisplay}>
            {noteInfo.letter}
            {noteInfo.accidental}
          </Text>
          <Text style={styles.instruction}>
            Sing: half note (1-2) → rest (3-4) → half note (1-2).{"\n"}
            Be silent during the rest!
          </Text>

          {/* Show notation at top when open */}
          {showNotation && renderNotationToggle()}

          {isPlaying && <BeatIndicator />}

          {!singResult && (
            <View style={styles.volumeContainer}>
              <CircularVolumeIndicator volume={volume} size={120} />
              {isSounding && detectedNoteName && (
                <Text style={styles.hearingText}>
                  Hearing: {detectedNoteName}
                </Text>
              )}
            </View>
          )}

          {singResult && (
            <Text
              style={
                singResult.success ? styles.successText : styles.feedbackError
              }
            >
              {singResult.success ? "✓ Great!" : singResult.message}
            </Text>
          )}

          {/* Show notation button at bottom when closed */}
          {!showNotation && renderNotationToggle()}
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          {singResult && !singResult.success ? (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleTrySingAgain}
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
              {singAttempts >= 3 && (
                <TouchableOpacity
                  style={[styles.tertiaryButton, { marginTop: 8 }]}
                  onPress={() => handleShowAttestModal("sing")}
                >
                  <Text style={styles.tertiaryButtonText}>
                    I did it correctly →
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : singResult?.success ? (
            <>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={playHalfNoteRestPattern}
                  disabled={isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>
                    {isPlaying ? "🔊 Playing..." : "🔊 Hear Again"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => {
                    handleTrySingAgain();
                  }}
                  disabled={isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>🎤 Sing Again</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 8 }]}
                onPress={() => setPhase(PHASE.IMAGINE)}
              >
                <Text style={styles.primaryButtonText}>Continue →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, isPlaying && styles.buttonDisabled]}
              onPress={() => playMetronomeOnly(handleDoneSinging)}
              disabled={isPlaying}
            >
              <Text style={styles.primaryButtonText}>
                {isPlaying ? "🎤 Sing Now..." : "🎤 Start Singing"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {attestationModal}
      </View>
    );
  }

  // IMAGINE PHASE
  if (phase === PHASE.IMAGINE) {
    return (
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {renderFocusCardMini()}

          <Text style={styles.phaseTitle}>Imagine</Text>
          <Text style={styles.noteDisplay}>
            {noteInfo.letter}
            {noteInfo.accidental}
          </Text>
          <Text style={styles.instruction}>
            Imagine playing: half note → rest → half note.{"\n"}
            Hear the silence during the half rest.
          </Text>

          {/* Show notation at top when open */}
          {showNotation && renderNotationToggle()}

          {isPlaying && <BeatIndicator />}

          <View style={styles.imagineVisual}>
            <Text style={styles.imagineEmoji}>🎵 🤫 🎵</Text>
            <Text style={styles.imagineHint}>Play - Rest - Play</Text>
          </View>

          {/* Show notation button at bottom when closed */}
          {!showNotation && renderNotationToggle()}
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            style={[styles.secondaryButton, isPlaying && styles.buttonDisabled]}
            onPress={playMetronomeOnly}
            disabled={isPlaying}
          >
            <Text style={styles.secondaryButtonText}>
              {isPlaying ? "🥁 Counting..." : "🥁 Count with Clicks"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: 8 }]}
            onPress={handleDoneImagining}
          >
            <Text style={styles.primaryButtonText}>I Imagined It →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // PLAY PHASE
  if (phase === PHASE.PLAY) {
    return (
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {renderFocusCardMini()}

          <Text style={styles.phaseTitle}>Play</Text>
          <Text style={styles.noteDisplay}>
            {noteInfo.letter}
            {noteInfo.accidental}
          </Text>
          <Text style={styles.instruction}>
            Play: half note (1-2) → rest (3-4) → half note (1-2).{"\n"}
            Be silent during the half rest.
          </Text>

          {/* Show notation at top when open */}
          {showNotation && renderNotationToggle()}

          {isPlaying && <BeatIndicator />}

          {!playResult && (
            <View style={styles.volumeContainer}>
              <CircularVolumeIndicator volume={volume} size={120} />
              {isSounding && detectedNoteName && (
                <Text style={styles.hearingText}>
                  Hearing: {detectedNoteName}
                </Text>
              )}
            </View>
          )}

          {playResult && (
            <Text
              style={
                playResult.success ? styles.successText : styles.feedbackError
              }
            >
              {playResult.success ? "✓ Great!" : playResult.message}
            </Text>
          )}

          {/* Show notation button at bottom when closed */}
          {!showNotation && renderNotationToggle()}
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          {playResult && !playResult.success ? (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleTryPlayAgain}
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
              {playAttempts >= 3 && (
                <TouchableOpacity
                  style={[styles.tertiaryButton, { marginTop: 8 }]}
                  onPress={() => handleShowAttestModal("play")}
                >
                  <Text style={styles.tertiaryButtonText}>
                    I did it correctly →
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : playResult?.success ? (
            <>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={playHalfNoteRestPattern}
                  disabled={isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>
                    {isPlaying ? "🔊 Playing..." : "🔊 Hear Again"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => {
                    handleTryPlayAgain();
                  }}
                  disabled={isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>🎵 Play Again</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 8 }]}
                onPress={() => {
                  if (successfulRounds + 1 >= masteryStreak) {
                    setShowSuccess(true);
                    setTimeout(() => {
                      onComplete?.({
                        success: true,
                        streak: successfulRounds + 1,
                        totalAttempts: successfulRounds + 1,
                        correctCount: successfulRounds + 1,
                      });
                    }, 1500);
                  } else {
                    setSuccessfulRounds(successfulRounds + 1);
                    setPhase(PHASE.FEEDBACK);
                  }
                }}
              >
                <Text style={styles.primaryButtonText}>Continue →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, isPlaying && styles.buttonDisabled]}
              onPress={() => playMetronomeOnly(handleDonePlaying)}
              disabled={isPlaying}
            >
              <Text style={styles.primaryButtonText}>
                {isPlaying ? "🎵 Play Now..." : "🎵 Start Playing"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {attestationModal}
      </View>
    );
  }

  // FEEDBACK PHASE
  if (phase === PHASE.FEEDBACK) {
    const overallSuccess = singResult?.success && playResult?.success;

    if (showSuccess) {
      return (
        <View style={styles.container}>
          <View style={styles.successContainer}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successTitle}>Mastered!</Text>
            <Text style={styles.successSubtitle}>
              You've learned the half rest
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.phaseTitle}>
            {overallSuccess ? "Nice Work!" : "Keep Practicing"}
          </Text>

          <View style={styles.resultsSummary}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Sing:</Text>
              <Text
                style={
                  singResult?.success ? styles.resultSuccess : styles.resultFail
                }
              >
                {singResult?.success ? "✓" : "✗"}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Play:</Text>
              <Text
                style={
                  playResult?.success ? styles.resultSuccess : styles.resultFail
                }
              >
                {playResult?.success ? "✓" : "✗"}
              </Text>
            </View>
          </View>

          <Text style={styles.progressText}>
            Progress: {successfulRounds} / {masteryStreak}
          </Text>

          <View style={styles.reminderBox}>
            <Text style={styles.reminderTitle}>Remember:</Text>
            <Text style={styles.reminderText}>
              Half rest = 2 beats silence{"\n"}
              Sits ON TOP of the line{"\n"}
              "HAT sits on top"
            </Text>
          </View>
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleContinue}
          >
            <Text style={styles.primaryButtonText}>
              {overallSuccess ? "Next Round →" : "Try Again →"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1410",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Focus Card
  focusCard: {
    backgroundColor: "#2d241a",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3b2c1a",
  },
  focusCardTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#f5e6d3",
    marginBottom: 16,
  },
  halfRestSymbol: {
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },
  halfRestLine: {
    width: 60,
    height: 3,
    backgroundColor: "#d4a574",
    position: "absolute",
    top: 25,
  },
  halfRestBlock: {
    width: 24,
    height: 12,
    backgroundColor: "#d4a574",
    position: "absolute",
    top: 13, // Sits ON TOP of line
  },
  focusCardDescription: {
    fontSize: 20,
    color: "#c4b5a0",
    textAlign: "center",
    lineHeight: 28,
  },
  focusCardDivider: {
    width: "80%",
    height: 1,
    backgroundColor: "#3b2c1a",
    marginVertical: 20,
  },
  focusCardCue: {
    fontSize: 18,
    color: "#d4a574",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 8,
  },
  focusCardMnemonic: {
    fontSize: 18,
    color: "#4CAF50",
    textAlign: "center",
    fontWeight: "600",
  },

  // Comparison box
  comparisonBox: {
    backgroundColor: "#1a1410",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    width: "100%",
  },
  comparisonTitle: {
    fontSize: 14,
    color: "#8a7a6a",
    textAlign: "center",
    marginBottom: 12,
  },
  comparisonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  comparisonItem: {
    alignItems: "center",
  },
  wholeRestSymbolSmall: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  wholeRestLineSmall: {
    width: 40,
    height: 2,
    backgroundColor: "#8a7a6a",
    position: "absolute",
    top: 15,
  },
  wholeRestBlockSmall: {
    width: 16,
    height: 8,
    backgroundColor: "#8a7a6a",
    position: "absolute",
    top: 17, // Hangs below
  },
  halfRestSymbolSmall: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  halfRestLineSmall: {
    width: 40,
    height: 2,
    backgroundColor: "#d4a574",
    position: "absolute",
    top: 20,
  },
  halfRestBlockSmall: {
    width: 16,
    height: 8,
    backgroundColor: "#d4a574",
    position: "absolute",
    top: 12, // Sits on top
  },
  comparisonLabel: {
    fontSize: 12,
    color: "#c4b5a0",
    marginTop: 4,
  },
  comparisonDetail: {
    fontSize: 10,
    color: "#8a7a6a",
    fontStyle: "italic",
  },

  // Notation preview on focus card
  notationPreview: {
    marginTop: 20,
    alignItems: "center",
  },
  notationPreviewLabel: {
    fontSize: 14,
    color: "#c4b5a0",
    marginBottom: 12,
    textAlign: "center",
  },

  // Focus Card Mini
  focusCardMini: {
    flexDirection: "row",
    backgroundColor: "#2d241a",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#3b2c1a",
    alignItems: "center",
  },
  focusCardMiniLeft: {
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    width: 36,
  },
  halfRestSymbolMini: {
    height: 24,
    width: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  halfRestLineMini: {
    width: 30,
    height: 2,
    backgroundColor: "#d4a574",
    position: "absolute",
    top: 12,
  },
  halfRestBlockMini: {
    width: 12,
    height: 6,
    backgroundColor: "#d4a574",
    position: "absolute",
    top: 6, // Sits on top
  },
  focusCardMiniRight: {
    flex: 1,
  },
  focusCardMiniTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f5e6d3",
    marginBottom: 2,
  },
  focusCardMiniText: {
    fontSize: 14,
    color: "#c4b5a0",
  },

  // Phase content
  phaseTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#f5e6d3",
    textAlign: "center",
    marginBottom: 16,
  },
  noteDisplay: {
    fontSize: 48,
    fontWeight: "700",
    color: "#d4a574",
    textAlign: "center",
    marginBottom: 16,
  },
  instruction: {
    fontSize: 18,
    color: "#c4b5a0",
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 24,
  },

  // Beat indicator
  beatIndicatorContainer: {
    marginVertical: 16,
    alignItems: "center",
  },
  countInRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  countInLabel: {
    fontSize: 14,
    color: "#8a7a6a",
    marginRight: 12,
    width: 60,
  },
  countInBeats: {
    flexDirection: "row",
    gap: 6,
  },
  countInDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2d241a",
    borderWidth: 2,
    borderColor: "#3b2c1a",
    justifyContent: "center",
    alignItems: "center",
  },
  countInDotActive: {
    backgroundColor: "#8a7a6a",
    borderColor: "#8a7a6a",
  },
  countInDotAccent: {
    borderColor: "#a89a8a",
  },
  countInNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },
  countInNumberActive: {
    color: "#1a1410",
  },
  measureLabel: {
    marginBottom: 8,
  },
  measureText: {
    fontSize: 12,
    color: "#8a7a6a",
  },
  singRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  singLabel: {
    fontSize: 14,
    color: "#d4a574",
    marginRight: 12,
    width: 60,
    fontWeight: "600",
  },
  beatIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  beatDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2d241a",
    borderWidth: 2,
    borderColor: "#3b2c1a",
    justifyContent: "center",
    alignItems: "center",
  },
  beatDotActive: {
    backgroundColor: "#d4a574",
    borderColor: "#d4a574",
  },
  beatDotAccent: {
    borderColor: "#f5e6d3",
  },
  beatDotRest: {
    borderColor: "#8a7a6a",
    borderStyle: "dashed",
  },
  beatDotRestActive: {
    backgroundColor: "#5a4a3a",
    borderColor: "#8a7a6a",
  },
  beatDotStop: {
    borderColor: "#e57373",
  },
  beatDotStopActive: {
    backgroundColor: "#e57373",
    borderColor: "#e57373",
  },
  beatNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  beatNumberActive: {
    color: "#1a1410",
  },
  beatNumberRestActive: {
    color: "#c4b5a0",
  },
  beatNumberStopActive: {
    color: "#fff",
  },

  // Full pattern layout (shows both measures at once)
  fullPatternContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 16,
  },
  measureGroup: {
    alignItems: "center",
  },
  measureGroupLabel: {
    fontSize: 12,
    color: "#8a7a6a",
    marginBottom: 6,
    fontWeight: "600",
  },
  beatRow: {
    flexDirection: "row",
    gap: 4,
  },
  beatDotSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2d241a",
    borderWidth: 2,
    borderColor: "#3b2c1a",
    justifyContent: "center",
    alignItems: "center",
  },
  beatDotPlaceholder: {
    width: 32,
    height: 32,
  },
  beatNumberSmall: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  patternHintSmall: {
    fontSize: 12,
    color: "#8a7a6a",
    marginTop: 6,
  },

  // Volume/visualizer
  volumeContainer: {
    alignItems: "center",
    marginVertical: 24,
  },
  hearingText: {
    fontSize: 16,
    color: "#d4a574",
    marginTop: 12,
  },

  // Notation
  notationContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  showNotationButton: {
    padding: 12,
    backgroundColor: "#2d241a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3b2c1a",
  },
  showNotationText: {
    fontSize: 14,
    color: "#d4a574",
  },
  notationWrapper: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    minHeight: 200,
    overflow: "visible",
  },
  hideNotationButton: {
    padding: 12,
    backgroundColor: "#2d241a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3b2c1a",
  },
  hideNotationText: {
    fontSize: 14,
    color: "#d4a574",
  },

  // Imagine phase
  imagineVisual: {
    alignItems: "center",
    marginVertical: 24,
  },
  imagineEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  imagineHint: {
    fontSize: 20,
    color: "#d4a574",
    fontWeight: "600",
  },

  // Feedback
  successText: {
    fontSize: 24,
    color: "#4CAF50",
    fontWeight: "600",
    textAlign: "center",
    marginVertical: 16,
  },
  feedbackError: {
    fontSize: 18,
    color: "#ff6b6b",
    textAlign: "center",
    marginVertical: 16,
  },

  // Results summary
  resultsSummary: {
    backgroundColor: "#2d241a",
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  resultLabel: {
    fontSize: 18,
    color: "#c4b5a0",
  },
  resultSuccess: {
    fontSize: 24,
    color: "#4CAF50",
    fontWeight: "700",
  },
  resultFail: {
    fontSize: 24,
    color: "#ff6b6b",
    fontWeight: "700",
  },
  progressText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginVertical: 12,
  },

  // Reminder box
  reminderBox: {
    backgroundColor: "#2d241a",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#d4a574",
  },
  reminderTitle: {
    fontSize: 14,
    color: "#d4a574",
    fontWeight: "600",
    marginBottom: 8,
  },
  reminderText: {
    fontSize: 16,
    color: "#c4b5a0",
    lineHeight: 24,
  },

  // Success screen
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  successEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#4CAF50",
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 18,
    color: "#c4b5a0",
    textAlign: "center",
  },

  // Buttons
  fixedBottomButtons: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
    backgroundColor: "#1a1410",
    borderTopWidth: 1,
    borderTopColor: "#3b2c1a",
  },
  primaryButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 200,
    alignSelf: "center",
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  secondaryButton: {
    backgroundColor: "#d4a574",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 200,
    alignSelf: "center",
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1410",
  },
  tertiaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "center",
  },
  tertiaryButtonText: {
    fontSize: 14,
    color: "#8a7a6a",
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#2d241a",
    borderRadius: 16,
    padding: 24,
    maxWidth: 340,
    borderWidth: 1,
    borderColor: "#3b2c1a",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f5e6d3",
    textAlign: "center",
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: "#c4b5a0",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#3b2c1a",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#c4b5a0",
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
