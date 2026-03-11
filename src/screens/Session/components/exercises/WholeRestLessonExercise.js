/**
 * WholeRestLessonExercise - Teaches the whole rest concept
 *
 * Flow: Focus Card → Listen → Sing → Imagine → Play → Feedback
 * Key concepts:
 * - A whole rest lasts 4 beats (just like a whole note)
 * - It sits BELOW the middle line because it's "heavy"
 * - Exercise: whole note (4 beats) → whole rest (4 beats silence) → whole note (4 beats)
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
  silenceDuration: 150, // Faster silence detection for rhythm accuracy
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

// Generate MusicXML for whole note + whole rest + whole note
function generateWholeRestPatternMusicXML(noteName, clef = "treble") {
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
        <divisions>1</divisions>
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
        <type>whole</type>
${accidentalXML}      </note>
    </measure>
    <measure number="2">
      <note>
        <rest/>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
    <measure number="3">
      <note>
        <pitch>
          <step>${parsed.letter}</step>
${alterXML}          <octave>${parsed.octave}</octave>
        </pitch>
        <duration>4</duration>
        <type>whole</type>
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

  // White noise click
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

export default function WholeRestLessonExercise({
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
  const [currentMeasure, setCurrentMeasure] = useState(0); // 1=note, 2=rest, 3=note
  const [showNotation, setShowNotation] = useState(false);
  const [singResult, setSingResult] = useState(null);
  const [playResult, setPlayResult] = useState(null);
  const [successfulRounds, setSuccessfulRounds] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasHeardPattern, setHasHeardPattern] = useState(false);
  // Attempt tracking for attestation
  const [singAttempts, setSingAttempts] = useState(0);
  const [playAttempts, setPlayAttempts] = useState(0);
  const [showAttestModal, setShowAttestModal] = useState(false);
  const [attestPhase, setAttestPhase] = useState(null); // 'sing' or 'play'

  // Refs
  const audioContextRef = useRef(null);
  const beatIntervalRef = useRef(null);
  const samplingIntervalRef = useRef(null);
  const oscillatorRef = useRef(null);
  const oscillator2Ref = useRef(null);
  const gainNodeRef = useRef(null);
  const unmountedRef = useRef(false);
  const isSoundingRef = useRef(false); // Track isSounding for interval callbacks

  // Pitch tracking refs - for both whole notes
  const hasHitTargetPitchRef = useRef(false);
  const onPitchCountRef = useRef(0);
  const totalSoundingCountRef = useRef(0);

  // Beat-by-beat sound tracking for the 13-beat sequence
  // Beats 1-4: first whole note (should sound)
  // Beats 5-8: whole rest (should NOT sound)
  // Beats 9-12: second whole note (should sound)
  // Beat 13: end marker
  const soundingOnBeatsRef = useRef(Array(13).fill(0)); // Percentages (0-1) of each beat with sound
  const startedEarlyRef = useRef(false); // Track if they started during count-in
  const scrollViewRef = useRef(null);

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
    () => generateWholeRestPatternMusicXML(userFirstNote, clef),
    [userFirstNote, clef],
  );

  // Pitch detection for sing/play phases
  const { currentPitch, volume, isSounding } = usePitchDetection({
    // Listen during sing/play phases, but not when results are displayed
    enabled:
      (phase === PHASE.SING && !singResult) ||
      (phase === PHASE.PLAY && !playResult),
    ...PITCH_DETECTION_OPTIONS,
  });

  // Track pitch accuracy during sing/play
  const targetMidi = useMemo(() => noteToMidi(userFirstNote), [userFirstNote]);

  useEffect(() => {
    if (!isSounding || !currentPitch?.noteName) return;

    // Compute midi from detected note name
    const detectedMidi = noteToMidi(currentPitch.noteName);
    if (detectedMidi === null) return;

    // Check if current pitch matches target
    const pitchDiff = Math.abs(detectedMidi - targetMidi);

    // For singing: allow any octave (same pitch class) - check modulo 12
    // For playing: require exact octave
    const isOnPitch =
      phase === PHASE.SING
        ? pitchDiff % 12 <= 1 || pitchDiff % 12 >= 11 // Allow wrap-around (e.g., B to C)
        : pitchDiff <= 1;

    // Use refs for immediate tracking (sync)
    totalSoundingCountRef.current += 1;
    if (isOnPitch) {
      hasHitTargetPitchRef.current = true;
      onPitchCountRef.current += 1;
    }
  }, [currentPitch?.noteName, isSounding, targetMidi, phase]);

  // Keep ref in sync with isSounding for interval callbacks
  useEffect(() => {
    isSoundingRef.current = isSounding;
  }, [isSounding]);

  // Reset pitch tracking when phase changes
  useEffect(() => {
    hasHitTargetPitchRef.current = false;
    onPitchCountRef.current = 0;
    totalSoundingCountRef.current = 0;
    soundingOnBeatsRef.current = Array(13).fill(0);
    startedEarlyRef.current = false;
  }, [phase]);

  // Detected note name for display (currentPitch is an object from usePitchDetection)
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

  // Reset notation when phase changes
  useEffect(() => {
    setShowNotation(false);
  }, [phase]);

  // Store onComplete callback for playPattern
  const onCompleteRef = useRef(null);

  // Play a note for a specified duration in beats
  const playNoteSound = useCallback(
    (ctx, durationBeats) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const now = ctx.currentTime;
      const beatMs = (60 / bpm) * 1000;
      const duration = (beatMs * durationBeats) / 1000;

      osc.type = "sine";
      osc.frequency.setValueAtTime(targetFrequency, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.5, now + 0.02);
      gain.gain.setValueAtTime(0.4, now + duration - 0.1);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      // Add harmonics for richer sound
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

      return { osc, osc2, gain };
    },
    [bpm, targetFrequency],
  );

  // Play the pattern: whole note → whole rest → whole note (with count-in)
  const playPattern = useCallback(
    (onComplete) => {
      const ctx = audioContextRef.current;
      if (!ctx || isPlaying) return;

      // Only store if it's actually a function (not an event from onPress)
      onCompleteRef.current =
        typeof onComplete === "function" ? onComplete : null;

      setIsPlaying(true);
      setCurrentBeat(-4); // Start at count-in beat 1
      setCurrentMeasure(0);

      const beatMs = (60 / bpm) * 1000;
      let beat = -4;

      // Start with count-in beat 1 (accent click)
      createClickSound(ctx, true);

      // Continue through count-in, then pattern playback
      beatIntervalRef.current = setInterval(() => {
        if (unmountedRef.current) {
          clearInterval(beatIntervalRef.current);
          return;
        }

        beat++;
        // Skip beat 0 - go from -1 to 1
        if (beat === 0) beat = 1;

        if (beat >= -3 && beat <= -1) {
          // Count-in beats 2, 3, 4
          createClickSound(ctx, false);
          setCurrentBeat(beat);
        } else if (beat === 1) {
          // First measure beat 1 (accent) - START first whole note
          createClickSound(ctx, true);
          playNoteSound(ctx, 4); // Play for 4 beats
          setCurrentBeat(1);
          setCurrentMeasure(1);
        } else if (beat >= 2 && beat <= 4) {
          // First measure beats 2, 3, 4
          createClickSound(ctx, false);
          setCurrentBeat(beat);
        } else if (beat === 5) {
          // Second measure beat 1 (accent) - whole REST starts, first note ends
          createClickSound(ctx, true);
          setCurrentBeat(5);
          setCurrentMeasure(2);
        } else if (beat >= 6 && beat <= 8) {
          // Second measure beats 2, 3, 4 (during rest)
          createClickSound(ctx, false);
          setCurrentBeat(beat);
        } else if (beat === 9) {
          // Third measure beat 1 (accent) - START second whole note
          createClickSound(ctx, true);
          playNoteSound(ctx, 4); // Play for 4 beats
          setCurrentBeat(9);
          setCurrentMeasure(3);
        } else if (beat >= 10 && beat <= 12) {
          // Third measure beats 2, 3, 4
          createClickSound(ctx, false);
          setCurrentBeat(beat);
        } else if (beat === 13) {
          // End marker - click to mark the end of the second note
          createClickSound(ctx, true);
          setCurrentBeat(13);
        } else {
          // Done
          clearInterval(beatIntervalRef.current);
          beatIntervalRef.current = null;
          setIsPlaying(false);
          setCurrentBeat(0);
          setCurrentMeasure(0);
          // Call onComplete callback if provided
          if (onCompleteRef.current) {
            onCompleteRef.current();
            onCompleteRef.current = null;
          }
        }
      }, beatMs);
    },
    [bpm, isPlaying, playNoteSound],
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
    setCurrentMeasure(0);
  }, []);

  // Play just metronome clicks (no pitch) for sing/play phases
  // Sequence: count-in (-4 to -1), then beats 1-13 for whole note, rest, whole note
  const playMetronomeOnly = useCallback(
    (onComplete) => {
      const ctx = audioContextRef.current;
      if (!ctx || isPlaying) return;

      // Only store if it's actually a function (not an event from onPress)
      onCompleteRef.current =
        typeof onComplete === "function" ? onComplete : null;

      setIsPlaying(true);
      setCurrentBeat(-4); // Start at count-in beat 1
      setCurrentMeasure(0);
      soundingOnBeatsRef.current = Array(13).fill(0);
      startedEarlyRef.current = false;

      const beatMs = (60 / bpm) * 1000;
      let beat = -4;

      // Track sounding status throughout each beat (sample multiple times per beat)
      let beatSoundingSamples = { beat: 0, samples: 0, soundingCount: 0 };

      // Track early start detection - require sustained sound, not just a blip
      let earlySoundingSamples = 0;
      let samplesBeforeChecking = 3; // Skip first few samples to avoid button press noise

      // Sample isSounding multiple times per beat to catch sustained sounds
      const samplingInterval = setInterval(() => {
        // Skip first few samples to let pitch detection stabilize
        if (samplesBeforeChecking > 0) {
          samplesBeforeChecking--;
          return;
        }

        // Check for early start during count-in - require 3+ consecutive samples with sound
        if (beat >= -4 && beat <= -1) {
          if (isSoundingRef.current) {
            earlySoundingSamples++;
            if (earlySoundingSamples >= 3) {
              startedEarlyRef.current = true;
            }
          } else {
            earlySoundingSamples = 0; // Reset if silence detected
          }
        }
        if (beat >= 1 && beat <= 13) {
          if (beatSoundingSamples.beat !== beat) {
            // New beat - save previous beat's result as percentage
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
            beatSoundingSamples = { beat, samples: 0, soundingCount: 0 };
          }
          beatSoundingSamples.samples++;
          if (isSoundingRef.current) {
            beatSoundingSamples.soundingCount++;
          }
        }
      }, 50); // Sample every 50ms
      samplingIntervalRef.current = samplingInterval;

      // Start with count-in beat 1 (accent)
      createClickSound(ctx, true);

      // Continue through count-in, then playing/singing phase
      beatIntervalRef.current = setInterval(() => {
        if (unmountedRef.current) {
          clearInterval(beatIntervalRef.current);
          clearInterval(samplingInterval);
          return;
        }

        beat++;
        // Skip beat 0 - go from -1 to 1
        if (beat === 0) beat = 1;

        if (beat >= -3 && beat <= -1) {
          // Count-in beats 2, 3, 4
          createClickSound(ctx, false);
          setCurrentBeat(beat);
        } else if (beat === 1) {
          // First measure beat 1 (accent) - START first whole note
          createClickSound(ctx, true);
          setCurrentBeat(1);
          setCurrentMeasure(1);
        } else if (beat >= 2 && beat <= 4) {
          // First measure beats 2, 3, 4
          createClickSound(ctx, false);
          setCurrentBeat(beat);
        } else if (beat === 5) {
          // Second measure beat 1 (accent) - REST starts
          createClickSound(ctx, true);
          setCurrentBeat(5);
          setCurrentMeasure(2);
        } else if (beat >= 6 && beat <= 8) {
          // Second measure beats 2, 3, 4 (during rest)
          createClickSound(ctx, false);
          setCurrentBeat(beat);
        } else if (beat === 9) {
          // Third measure beat 1 (accent) - START second whole note
          createClickSound(ctx, true);
          setCurrentBeat(9);
          setCurrentMeasure(3);
        } else if (beat >= 10 && beat <= 12) {
          // Third measure beats 2, 3, 4
          createClickSound(ctx, false);
          setCurrentBeat(beat);
        } else if (beat === 13) {
          // End marker
          createClickSound(ctx, true);
          setCurrentBeat(13);
        } else {
          // Done - save last beat's result as percentage
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
          setIsPlaying(false);
          setCurrentBeat(0);
          setCurrentMeasure(0);
          // Call onComplete callback if provided
          if (onCompleteRef.current) {
            onCompleteRef.current();
            onCompleteRef.current = null;
          }
        }
      }, beatMs);
    },
    [bpm, isPlaying],
  );

  // Analyze singing/playing result (pitch AND rhythm for both notes + silence during rest)
  const analyzePerformance = useCallback(() => {
    // Use refs for immediate values (state is async)
    const totalCount = totalSoundingCountRef.current;
    const pitchCount = onPitchCountRef.current;
    const hitTarget = hasHitTargetPitchRef.current;

    const beatSoundPct = soundingOnBeatsRef.current; // Percentages (0-1) for beats 1-13
    const startedEarly = startedEarlyRef.current;
    console.log("[WholeRestLesson] analyzePerformance:", {
      totalCount,
      pitchCount,
      hitTarget,
      beatSoundPct,
      startedEarly,
    });

    // Thresholds
    const SUSTAIN_THRESHOLD = 0.75; // Must sustain through 75%+ of each beat
    const STOP_THRESHOLD = 0.75; // Allow up to 75% of stop beat (silence detection delay)
    const SILENCE_THRESHOLD = 0.25; // Rest beats should have less than 25% sound

    // Beat mapping:
    // Beats 0-3 (index 0-3): First whole note - should sound
    // Beats 4-7 (index 4-7): Whole rest - should NOT sound
    // Beats 8-11 (index 8-11): Second whole note - should sound
    // Beat 12 (index 12): End marker - should stop

    // Check first whole note (beats 1-4, index 0-3)
    const firstNoteBeats = beatSoundPct.slice(0, 4);
    const firstNoteStarted = firstNoteBeats[0] >= SUSTAIN_THRESHOLD;
    const firstNoteSustained = firstNoteBeats.filter(
      (pct) => pct >= SUSTAIN_THRESHOLD,
    ).length;

    // Check rest (beats 5-8, index 4-7)
    const restBeats = beatSoundPct.slice(4, 8);
    const restSilent = restBeats.filter(
      (pct) => pct < SILENCE_THRESHOLD,
    ).length;
    const restOk = restSilent >= 3; // At least 3 of 4 rest beats should be silent (allow some transition)

    // Check second whole note (beats 9-12, index 8-11)
    const secondNoteBeats = beatSoundPct.slice(8, 12);
    const secondNoteStarted = secondNoteBeats[0] >= SUSTAIN_THRESHOLD;
    const secondNoteSustained = secondNoteBeats.filter(
      (pct) => pct >= SUSTAIN_THRESHOLD,
    ).length;

    // Check ending (beat 13, index 12)
    const stoppedAtEnd = beatSoundPct[12] < STOP_THRESHOLD;

    // Check if they produced sound at the correct pitch for at least some of the time
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

    // Rhythm analysis - need to pass all checks
    const firstNoteOk = firstNoteStarted && firstNoteSustained === 4;
    const secondNoteOk = secondNoteStarted && secondNoteSustained === 4;
    const rhythmOk =
      !startedEarly && firstNoteOk && restOk && secondNoteOk && stoppedAtEnd;

    const success = pitchOk && rhythmOk;

    // Generate appropriate message
    let message = "Great!";
    if (!pitchOk && !rhythmOk) {
      message = "Try to match the pitch and follow the rhythm";
    } else if (!pitchOk) {
      message = "Good rhythm! Try to match the pitch better";
    } else if (startedEarly) {
      message = "Wait for beat ONE to start";
    } else if (!firstNoteStarted) {
      message = "Start the first note right on beat ONE";
    } else if (firstNoteSustained < 4) {
      message = `First note too short - hold for all 4 beats`;
    } else if (!restOk) {
      message = "Stay silent during the REST (4 beats of silence)";
    } else if (!secondNoteStarted) {
      message = "Start the second note right on beat 9";
    } else if (secondNoteSustained < 4) {
      message = `Second note too short - hold for all 4 beats`;
    } else if (!stoppedAtEnd) {
      message = "Stop right on the final ONE";
    }

    return {
      success,
      pitchOk,
      rhythmOk,
      message,
      firstNoteOk,
      restOk,
      secondNoteOk,
    };
  }, []);

  // Handle done singing - show result, user clicks Continue to proceed
  const handleDoneSinging = useCallback(() => {
    const result = analyzePerformance();
    setSingResult(result);
    if (!result.success) {
      setSingAttempts((prev) => prev + 1);
    }
  }, [analyzePerformance]);

  // Handle try again singing
  const handleTrySingAgain = useCallback(() => {
    setSingResult(null);
    hasHitTargetPitchRef.current = false;
    onPitchCountRef.current = 0;
    totalSoundingCountRef.current = 0;
    soundingOnBeatsRef.current = Array(13).fill(0);
    startedEarlyRef.current = false;
    // Delay to allow pitch detection to re-enable after state change
    setTimeout(() => {
      playMetronomeOnly(handleDoneSinging);
    }, 100);
  }, [playMetronomeOnly, handleDoneSinging]);

  // Handle done imagining
  const handleDoneImagining = useCallback(() => {
    stopPlayback();
    // Reset all tracking refs for the Play phase
    hasHitTargetPitchRef.current = false;
    onPitchCountRef.current = 0;
    totalSoundingCountRef.current = 0;
    soundingOnBeatsRef.current = Array(13).fill(0);
    startedEarlyRef.current = false;
    setPhase(PHASE.PLAY);
  }, [stopPlayback]);

  // Handle done playing - show result, user clicks Continue to proceed
  const handleDonePlaying = useCallback(() => {
    const result = analyzePerformance();
    setPlayResult(result);
    if (!result.success) {
      setPlayAttempts((prev) => prev + 1);
    }
  }, [analyzePerformance]);

  // Handle try again playing
  const handleTryPlayAgain = useCallback(() => {
    setPlayResult(null);
    hasHitTargetPitchRef.current = false;
    onPitchCountRef.current = 0;
    totalSoundingCountRef.current = 0;
    soundingOnBeatsRef.current = Array(13).fill(0);
    startedEarlyRef.current = false;
    // Delay to allow pitch detection to re-enable after state change
    setTimeout(() => {
      playMetronomeOnly(handleDonePlaying);
    }, 100);
  }, [playMetronomeOnly, handleDonePlaying]);

  // Handle continue from feedback
  const handleContinue = useCallback(() => {
    // Reset for next round
    setSingResult(null);
    setPlayResult(null);
    hasHitTargetPitchRef.current = false;
    onPitchCountRef.current = 0;
    totalSoundingCountRef.current = 0;
    soundingOnBeatsRef.current = Array(13).fill(0);
    startedEarlyRef.current = false;
    setHasHeardPattern(false);
    setSingAttempts(0);
    setPlayAttempts(0);
    setPhase(PHASE.LISTEN);
  }, []);

  // Handle attestation confirmation
  const handleAttestConfirm = useCallback(() => {
    setShowAttestModal(false);
    if (attestPhase === "sing") {
      setSingResult({ success: true, attested: true });
    } else if (attestPhase === "play") {
      setPlayResult({ success: true, attested: true });
    }
    setAttestPhase(null);
  }, [attestPhase]);

  // Show attestation modal
  const handleShowAttestModal = useCallback((phase) => {
    setAttestPhase(phase);
    setShowAttestModal(true);
  }, []);

  // Report progress
  useEffect(() => {
    onProgress?.({
      streak: successfulRounds,
      masteryRequired: masteryStreak,
    });
  }, [successfulRounds, masteryStreak, onProgress]);

  // Memoized notation content
  const memoizedNotation = useMemo(() => {
    if (!NotationDisplay) return null;
    return (
      <NotationDisplay
        musicxml={musicXML}
        width={360}
        height={180}
        showTimeSignature={true}
      />
    );
  }, [musicXML]);

  // Compute cursor position (3 whole notes/rests: beats 1-4, 5-8, 9-12)
  const cursorNoteIndex = useMemo(() => {
    if (!showNotation || currentBeat < 1 || currentBeat > 12) return null;
    return Math.floor((currentBeat - 1) / 4); // 0-2
  }, [showNotation, currentBeat]);

  // Scroll to top when notation is opened
  const handleShowNotation = useCallback(() => {
    setShowNotation(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  }, []);

  // Notation toggle - render inline JSX to avoid component recreation
  const renderNotationToggle = () => {
    if (!NotationDisplay) return null;

    // 3 whole note/rest positions across 3 measures (shifted past bar lines)
    const notePositions = [95, 210, 290];
    const highlightLeft =
      cursorNoteIndex !== null ? notePositions[cursorNoteIndex] : null;
    const highlightWidth = 60;

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
            <View style={[styles.notationWrapper, { position: "relative" }]}>
              {memoizedNotation}
              {/* Green highlight overlay */}
              {highlightLeft !== null && (
                <View
                  style={{
                    position: "absolute",
                    left: highlightLeft,
                    top: 30,
                    width: highlightWidth,
                    height: 100,
                    backgroundColor: "rgba(76, 175, 80, 0.25)",
                    borderRadius: 4,
                    borderWidth: 2,
                    borderColor: "rgba(76, 175, 80, 0.6)",
                    pointerEvents: "none",
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

  // Focus card mini - shown in all phases after FOCUS_CARD
  const renderFocusCardMini = () => {
    return (
      <View style={styles.focusCardMini}>
        <View style={styles.focusCardMiniLeft}>
          <View style={styles.wholeRestRectangleMini} />
        </View>
        <View style={styles.focusCardMiniRight}>
          <Text style={styles.focusCardMiniTitle}>Whole Rest</Text>
          <Text style={styles.focusCardMiniText}>
            4 beats of silence → hangs below the line
          </Text>
        </View>
      </View>
    );
  };

  // Beat indicator component with count-in above - for 12 beats + ending
  const BeatIndicator = () => {
    // Count-in uses negative beats: -4, -3, -2, -1
    const isInCountIn = currentBeat < 0;

    // Map display beat to 1-4 within each measure
    const getDisplayBeat = (beat) => {
      if (beat <= 0) return 0;
      return ((beat - 1) % 4) + 1;
    };

    return (
      <View style={styles.beatIndicatorContainer}>
        {/* Count-in row */}
        <View style={styles.indicatorRow}>
          <Text style={styles.indicatorLabel}>Count in:</Text>
          <View style={styles.indicatorBeats}>
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

        {/* Measure 1: First whole note */}
        <View style={styles.indicatorRow}>
          <Text style={[styles.indicatorLabel, styles.playLabel]}>Note:</Text>
          <View style={styles.indicatorBeats}>
            {[1, 2, 3, 4].map((beat) => (
              <View
                key={beat}
                style={[
                  styles.beatDot,
                  currentBeat >= beat &&
                    currentBeat > 0 &&
                    styles.beatDotActive,
                  beat === 1 && styles.beatDotAccent,
                ]}
              >
                <Text
                  style={[
                    styles.beatNumber,
                    currentBeat >= beat &&
                      currentBeat > 0 &&
                      styles.beatNumberActive,
                  ]}
                >
                  {beat}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Measure 2: Whole rest */}
        <View style={styles.indicatorRow}>
          <Text style={[styles.indicatorLabel, styles.restLabel]}>Rest:</Text>
          <View style={styles.indicatorBeats}>
            {[5, 6, 7, 8].map((beat) => (
              <View
                key={beat}
                style={[
                  styles.restDot,
                  currentBeat >= beat && styles.restDotActive,
                  beat === 5 && styles.restDotAccent,
                ]}
              >
                <Text
                  style={[
                    styles.restNumber,
                    currentBeat >= beat && styles.restNumberActive,
                  ]}
                >
                  {getDisplayBeat(beat)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Measure 3: Second whole note */}
        <View style={styles.indicatorRow}>
          <Text style={[styles.indicatorLabel, styles.playLabel]}>Note:</Text>
          <View style={styles.indicatorBeats}>
            {[9, 10, 11, 12].map((beat) => (
              <View
                key={beat}
                style={[
                  styles.beatDot,
                  currentBeat >= beat && styles.beatDotActive,
                  beat === 9 && styles.beatDotAccent,
                ]}
              >
                <Text
                  style={[
                    styles.beatNumber,
                    currentBeat >= beat && styles.beatNumberActive,
                  ]}
                >
                  {getDisplayBeat(beat)}
                </Text>
              </View>
            ))}
            {/* End marker */}
            <View
              style={[
                styles.beatDot,
                styles.beatDotStop,
                currentBeat === 13 && styles.beatDotStopActive,
              ]}
            >
              <Text
                style={[
                  styles.beatNumber,
                  currentBeat === 13 && styles.beatNumberStopActive,
                ]}
              >
                1
              </Text>
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
            <Text style={styles.focusCardTitle}>Whole Rest</Text>
            <View style={styles.wholeRestSymbol}>
              {/* Staff line representation */}
              <View style={styles.staffLineContainer}>
                <View style={styles.staffLine} />
                <View style={styles.wholeRestRectangle} />
              </View>
            </View>
            <Text style={styles.focusCardDescription}>
              A whole rest lasts for 4 beats of silence.
            </Text>
            <View style={styles.focusCardDivider} />
            <Text style={styles.focusCardCue}>
              It hangs BELOW the line because it's heavy.
            </Text>
            <Text style={styles.focusCardDetail}>
              Think of it as a heavy weight that needs to hang down.
            </Text>
            <Text style={styles.focusCardMnemonic}>
              🏋️ "Heavy rest hangs low"
            </Text>
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
            Listen to: whole note, whole rest (silence), whole note.{"\n"}
            Notice the 4 beats of silence in the middle.
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
                playPattern(() => setHasHeardPattern(true));
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
                onPress={playPattern}
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
            Sing: whole note (4 beats), then REST (4 beats silent), then whole
            note (4 beats).{"\n"}
            Stay completely silent during the rest!
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
                  onPress={playPattern}
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
                    playMetronomeOnly(handleDoneSinging);
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
            Imagine playing: note (4 beats), rest (silence!), note (4 beats).
            {"\n"}
            Hear the silence clearly in your mind.
          </Text>

          {/* Show notation at top when open */}
          {showNotation && renderNotationToggle()}

          {isPlaying && <BeatIndicator />}

          <View style={styles.imagineVisual}>
            <Text style={styles.imagineEmoji}>🎵 🤫 🎵</Text>
            <Text style={styles.imagineHint}>Note → Silence → Note</Text>
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
            Play: whole note (4 beats), whole rest (silent!), whole note (4
            beats).{"\n"}
            Make the rest completely silent!
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
                  onPress={playPattern}
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
                    playMetronomeOnly(handleDonePlaying);
                  }}
                  disabled={isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>🎵 Play Again</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 8 }]}
                onPress={() => {
                  // Go to feedback or complete
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
              You've learned the whole rest
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
              Whole rest = 4 beats of SILENCE{"\n"}
              It hangs BELOW the line (heavy!)
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
  wholeRestSymbol: {
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  staffLineContainer: {
    position: "relative",
    width: 80,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  staffLine: {
    position: "absolute",
    top: "50%",
    width: 80,
    height: 3,
    backgroundColor: "#d4a574",
  },
  wholeRestRectangle: {
    position: "absolute",
    top: "50%", // Starts at the line
    width: 24,
    height: 16,
    backgroundColor: "#d4a574",
    borderRadius: 2,
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
    marginBottom: 12,
  },
  focusCardDetail: {
    fontSize: 16,
    color: "#a69580",
    textAlign: "center",
    marginTop: 8,
  },
  focusCardMnemonic: {
    fontSize: 18,
    color: "#d4a574",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "600",
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
    width: 40,
  },
  wholeRestRectangleMini: {
    width: 20,
    height: 12,
    backgroundColor: "#d4a574",
    borderRadius: 2,
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

  // Beat indicator container
  beatIndicatorContainer: {
    marginVertical: 16,
    alignItems: "center",
  },

  // Generic indicator row
  indicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  indicatorLabel: {
    fontSize: 13,
    color: "#8a7a6a",
    marginRight: 10,
    width: 65,
    textAlign: "right",
  },
  indicatorBeats: {
    flexDirection: "row",
    gap: 6,
  },
  playLabel: {
    color: "#d4a574",
    fontWeight: "600",
  },
  restLabel: {
    color: "#8a9a8a",
    fontWeight: "600",
  },

  // Count-in dots
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

  // Beat dots (for notes)
  beatDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  beatNumberStopActive: {
    color: "#fff",
  },

  // Rest dots
  restDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1a201a",
    borderWidth: 2,
    borderColor: "#2a3a2a",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  restDotActive: {
    backgroundColor: "#3a4a3a",
    borderColor: "#5a6a5a",
  },
  restDotAccent: {
    borderColor: "#4a5a4a",
  },
  restNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5a6a5a",
  },
  restNumberActive: {
    color: "#9aba9a",
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
