/**
 * QuarterRestLessonExercise - Teaches the quarter rest concept
 *
 * Flow: Focus Card → Listen → Sing → Imagine → Play → Feedback
 * Key concepts:
 * - A quarter rest = 1 beat of silence
 * - Has a distinctive squiggly shape
 * - Exercise: alternating quarter notes and quarter rests for 8 beats
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
import {
  parseNoteName,
  noteToMidi,
  midiToFrequency,
  noteToFrequency,
  createAudioContext,
  createClickSound,
  LESSON_PHASES as PHASE,
  PITCH_DETECTION_OPTIONS,
  exercisePropTypes,
  exerciseDefaultProps,
} from "./shared";
import { devLog, devWarn } from "../../../../utils/devLogger";

// For notation display
let NotationDisplay = null;
try {
  NotationDisplay = require("../../../../components/NotationDisplay").default;
} catch (e) {
  devWarn("NotationDisplay not available");
}

// Generate MusicXML for alternating quarter notes and rests (8 beats)
// Pattern: note-rest-note-rest | note-rest-note-rest
function generateQuarterRestPatternMusicXML(noteName, clef = "treble") {
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

  const quarterNote = `      <note>
        <pitch>
          <step>${parsed.letter}</step>
${alterXML}          <octave>${parsed.octave}</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
${accidentalXML}      </note>`;

  const quarterRest = `      <note>
        <rest/>
        <duration>1</duration>
        <type>quarter</type>
      </note>`;

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
${quarterNote}
${quarterRest}
${quarterNote}
${quarterRest}
    </measure>
    <measure number="2">
${quarterNote}
${quarterRest}
${quarterNote}
${quarterRest}
    </measure>
  </part>
</score-partwise>`;
}

// Create a softer subdivision click for eighth notes
function createSubdivisionClick(audioContext) {
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
  filter.frequency.value = 2000; // Higher pitch for subdivision
  filter.Q.value = 0.5;

  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0.25, audioContext.currentTime); // Softer
  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + duration,
  );

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);

  source.start(audioContext.currentTime);
}

export default function QuarterRestLessonExercise({
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
  const [isSubdivision, setIsSubdivision] = useState(false);
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
  // Track all 8 beats (note-rest-note-rest-note-rest-note-rest)
  // Odd beats (1,3,5,7) = notes, Even beats (2,4,6,8) = rests
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
    () => generateQuarterRestPatternMusicXML(userFirstNote, clef),
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
    audioContextRef.current = createAudioContext();

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

  // Play quarter note-rest pattern (8 beats)
  const playQuarterNoteRestPattern = useCallback(
    (onComplete) => {
      const ctx = audioContextRef.current;
      if (!ctx || isPlaying) return;

      onCompleteRef.current =
        typeof onComplete === "function" ? onComplete : null;

      setIsPlaying(true);
      setCurrentBeat(-4);
      setCurrentMeasure(1);
      setIsSubdivision(false);

      const beatMs = (60 / bpm) * 1000;
      const eighthMs = beatMs / 2;
      let beat = -4;
      let absoluteBeat = -4;
      let isAnd = true; // First interval tick is subdivision after initial beat

      const playQuarterNote = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const now = ctx.currentTime;
        const duration = (beatMs * 1) / 1000;

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
      };

      createClickSound(ctx, true);
      setIsSubdivision(false);

      beatIntervalRef.current = setInterval(() => {
        if (unmountedRef.current) {
          clearInterval(beatIntervalRef.current);
          return;
        }

        if (isAnd) {
          // This is the "&" subdivision
          createSubdivisionClick(ctx);
          setIsSubdivision(true);
          isAnd = false;
        } else {
          // This is a main beat
          beat++;
          absoluteBeat++;
          if (beat === 0) {
            beat = 1;
            absoluteBeat = 1;
          }
          setIsSubdivision(false);

          if (beat >= -3 && beat <= -1) {
            createClickSound(ctx, false);
            setCurrentBeat(beat);
          } else if (absoluteBeat >= 1 && absoluteBeat <= 8) {
            // Determine if this is an accent (beat 1 of each measure)
            const measureBeat = ((absoluteBeat - 1) % 4) + 1;
            const isAccent = measureBeat === 1;
            createClickSound(ctx, isAccent);

            // Update measure and beat (use absoluteBeat for UI)
            if (absoluteBeat <= 4) {
              setCurrentMeasure(1);
            } else {
              setCurrentMeasure(2);
            }
            setCurrentBeat(absoluteBeat);

            // Play note on odd beats (1, 3, 5, 7 = absoluteBeat 1, 3, 5, 7)
            if (absoluteBeat % 2 === 1) {
              playQuarterNote();
            }
          } else if (absoluteBeat === 9) {
            // The final ONE - pattern ends
            createClickSound(ctx, true);
            setCurrentMeasure(2);
            setCurrentBeat(9); // End beat
          } else {
            clearInterval(beatIntervalRef.current);
            beatIntervalRef.current = null;
            setIsPlaying(false);
            setCurrentBeat(0);
            setCurrentMeasure(1);
            setIsSubdivision(false);
            if (onCompleteRef.current) {
              onCompleteRef.current();
              onCompleteRef.current = null;
            }
            return;
          }
          isAnd = true; // Next tick will be subdivision
        }
      }, eighthMs);
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
      setIsSubdivision(false);
      soundingOnBeatsRef.current = [0, 0, 0, 0, 0, 0, 0, 0];
      startedEarlyRef.current = false;

      const beatMs = (60 / bpm) * 1000;
      const eighthMs = beatMs / 2;
      let beat = -4;
      let absoluteBeat = -4;
      let isAnd = true; // First interval tick is subdivision after initial beat

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
        // Track beats 1-8
        if (absoluteBeat >= 1 && absoluteBeat <= 8) {
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
      setIsSubdivision(false);

      beatIntervalRef.current = setInterval(() => {
        if (unmountedRef.current) {
          clearInterval(beatIntervalRef.current);
          clearInterval(samplingInterval);
          return;
        }

        if (isAnd) {
          // This is the "&" subdivision
          createSubdivisionClick(ctx);
          setIsSubdivision(true);
          isAnd = false;
        } else {
          // This is a main beat
          beat++;
          absoluteBeat++;
          if (beat === 0) {
            beat = 1;
            absoluteBeat = 1;
          }
          setIsSubdivision(false);

          if (beat >= -3 && beat <= -1) {
            createClickSound(ctx, false);
            setCurrentBeat(beat);
          } else if (absoluteBeat >= 1 && absoluteBeat <= 8) {
            const measureBeat = ((absoluteBeat - 1) % 4) + 1;
            const isAccent = measureBeat === 1;
            createClickSound(ctx, isAccent);

            if (absoluteBeat <= 4) {
              setCurrentMeasure(1);
            } else {
              setCurrentMeasure(2);
            }
            setCurrentBeat(absoluteBeat);
          } else if (absoluteBeat === 9) {
            createClickSound(ctx, true);
            setCurrentBeat(9);
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
            setIsSubdivision(false);
            if (onCompleteRef.current) {
              onCompleteRef.current();
              onCompleteRef.current = null;
            }
            return;
          }
          isAnd = true; // Next tick will be subdivision
        }
      }, eighthMs);
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
    devLog("[QuarterRestLesson] analyzePerformance:", {
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

    const SUSTAIN_THRESHOLD = 0.4; // Quarter notes - need to be sounding on note beats
    const SILENCE_THRESHOLD = 0.5; // More forgiving - allow some spillover on rest beats

    // Odd beats (0,2,4,6 indexes = beats 1,3,5,7) should have sound
    // Even beats (1,3,5,7 indexes = beats 2,4,6,8) should be silent (rests)
    const noteBeatsOk =
      beatSoundPct[0] >= SUSTAIN_THRESHOLD &&
      beatSoundPct[2] >= SUSTAIN_THRESHOLD &&
      beatSoundPct[4] >= SUSTAIN_THRESHOLD &&
      beatSoundPct[6] >= SUSTAIN_THRESHOLD;

    const restBeatsOk =
      beatSoundPct[1] < SILENCE_THRESHOLD &&
      beatSoundPct[3] < SILENCE_THRESHOLD &&
      beatSoundPct[5] < SILENCE_THRESHOLD &&
      beatSoundPct[7] < SILENCE_THRESHOLD;

    const rhythmOk = !startedEarly && noteBeatsOk && restBeatsOk;

    const success = pitchOk && rhythmOk;

    let message = "Great!";
    if (!pitchOk && !rhythmOk) {
      message = "Try to match the pitch and follow the rhythm";
    } else if (!pitchOk) {
      message = "Good rhythm! Try to match the pitch better";
    } else if (startedEarly) {
      message = "Wait for beat ONE to start";
    } else if (!noteBeatsOk) {
      message = "Play on beats 1, 3, 5, 7 (the notes)";
    } else if (!restBeatsOk) {
      message = "Be silent on beats 2, 4, 6, 8 (the rests)";
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

  // Compute cursor position (8 quarter notes/rests across 2 measures)
  const cursorNoteIndex = useMemo(() => {
    if (!showNotation || currentBeat < 1 || currentBeat > 8) return null;
    return currentBeat - 1; // 0-indexed
  }, [showNotation, currentBeat]);

  // Scroll to top when notation is opened
  const handleShowNotation = useCallback(() => {
    setShowNotation(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  }, []);

  const renderNotationToggle = () => {
    if (!NotationDisplay) return null;

    // 8 quarter positions: 4 in measure 1, 4 in measure 2
    // Measure 2 positions shifted right to account for bar line
    const notePositions = [75, 105, 135, 165, 210, 240, 270, 300];
    const highlightLeft =
      cursorNoteIndex !== null ? notePositions[cursorNoteIndex] : null;
    const highlightWidth = 25;

    return (
      <View style={styles.notationContainer}>
        {!showNotation ? (
          <TouchableOpacity
            style={styles.showNotationButton}
            onPress={handleShowNotation}
            accessibilityLabel="Show notation"
            accessibilityRole="button"
          >
            <Text style={styles.showNotationText}>Show Notation 📝</Text>
          </TouchableOpacity>
        ) : (
          <>
            <View
              style={[styles.notationWrapper, styles.notationWrapperRelative]}
            >
              {memoizedNotation}
              {/* Green highlight overlay */}
              {highlightLeft !== null && (
                <View
                  style={[
                    styles.highlightOverlay,
                    { left: highlightLeft, width: highlightWidth, height: 120 },
                  ]}
                />
              )}
            </View>
            <TouchableOpacity
              style={styles.hideNotationButton}
              onPress={() => setShowNotation(false)}
              accessibilityLabel="Hide notation"
              accessibilityRole="button"
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
          <Text style={styles.quarterRestSymbolMini}>𝄽</Text>
        </View>
        <View style={styles.focusCardMiniRight}>
          <Text style={styles.focusCardMiniTitle}>Quarter Rest</Text>
          <Text style={styles.focusCardMiniText}>1 beat silence</Text>
        </View>
      </View>
    );
  };

  // Beat indicator for quarter rest pattern (8 beats across 2 measures) with eighth note subdivision
  const BeatIndicator = () => {
    return (
      <View style={styles.beatIndicatorContainer}>
        <View style={styles.countInRow}>
          <Text style={styles.countInLabel}>Count in:</Text>
          <View style={styles.countInBeats}>
            {[-4, -3, -2, -1].map((beat, index) => (
              <React.Fragment key={beat}>
                <View
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
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.measureLabel}>
          <Text style={styles.measureText}>Measure {currentMeasure}</Text>
        </View>

        <View style={styles.singRow}>
          <Text style={styles.singLabel}>Play:</Text>
          <View style={styles.beatIndicator}>
            {/* Show all 8 beats across both measures */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((beat) => {
              const isNote = beat % 2 === 1; // Beats 1, 3, 5, 7 are notes; 2, 4, 6, 8 are rests
              const isActive = currentBeat >= beat && currentBeat > 0;
              const isMeasureStart = beat === 1 || beat === 5;

              return (
                <React.Fragment key={beat}>
                  <View
                    style={[
                      styles.beatDot,
                      isMeasureStart && styles.beatDotAccent,
                      !isNote && styles.beatDotRest,
                      isActive &&
                        (isNote
                          ? styles.beatDotActive
                          : styles.beatDotRestActive),
                    ]}
                  >
                    <Text
                      style={[
                        styles.beatNumber,
                        isActive &&
                          (isNote
                            ? styles.beatNumberActive
                            : styles.beatNumberRestActive),
                      ]}
                    >
                      {((beat - 1) % 4) + 1}
                    </Text>
                  </View>
                </React.Fragment>
              );
            })}
          </View>
        </View>

        <View style={styles.patternHint}>
          <View style={styles.patternHintRow}>
            {/* Spacer to align with Play: label above */}
            <View style={styles.patternHintSpacer} />
            {/* All 8 beats: note-rest-note-rest x 2 */}
            <View style={styles.patternHintNote} />
            <View style={styles.patternHintRest}>
              <Text style={styles.patternHintRestText}>🤫</Text>
            </View>
            <View style={styles.patternHintNote} />
            <View style={styles.patternHintRest}>
              <Text style={styles.patternHintRestText}>🤫</Text>
            </View>
            <View style={styles.patternHintNote} />
            <View style={styles.patternHintRest}>
              <Text style={styles.patternHintRestText}>🤫</Text>
            </View>
            <View style={styles.patternHintNote} />
            <View style={styles.patternHintRest}>
              <Text style={styles.patternHintRestText}>🤫</Text>
            </View>
          </View>
          <Text style={styles.patternHintSubtext}>
            note-rest-note-rest × 2 measures
          </Text>
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
                accessibilityLabel="Cancel attestation"
                accessibilityRole="button"
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleAttestConfirm}
                accessibilityLabel="Confirm attestation"
                accessibilityRole="button"
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
            <Text style={styles.focusCardTitle}>Quarter Rest</Text>
            <Text style={styles.quarterRestSymbol}>𝄽</Text>
            <Text style={styles.focusCardDescription}>
              A quarter rest = 1 beat of silence.
            </Text>
            <View style={styles.focusCardDivider} />
            <Text style={styles.focusCardCue}>
              It has a squiggly, zigzag shape.
            </Text>
            <Text style={styles.focusCardDetail}>
              Sometimes called "lightning bolt" rest
            </Text>
            <View style={styles.comparisonBox}>
              <Text style={styles.comparisonTitle}>Rest family:</Text>
              <View style={styles.comparisonRow}>
                <View style={styles.comparisonItem}>
                  <View style={styles.wholeRestSymbolSmall}>
                    <View style={styles.wholeRestLineSmall} />
                    <View style={styles.wholeRestBlockSmall} />
                  </View>
                  <Text style={styles.comparisonLabel}>Whole</Text>
                  <Text style={styles.comparisonDetail}>4 beats</Text>
                </View>
                <View style={styles.comparisonItem}>
                  <View style={styles.halfRestSymbolSmall}>
                    <View style={styles.halfRestLineSmall} />
                    <View style={styles.halfRestBlockSmall} />
                  </View>
                  <Text style={styles.comparisonLabel}>Half</Text>
                  <Text style={styles.comparisonDetail}>2 beats</Text>
                </View>
                <View style={styles.comparisonItem}>
                  <Text style={styles.quarterRestSymbolSmall}>𝄽</Text>
                  <Text style={styles.comparisonLabel}>Quarter</Text>
                  <Text style={styles.comparisonDetail}>1 beat</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Show actual notation */}
          <View style={styles.notationPreview}>
            <Text style={styles.notationPreviewLabel}>
              On the staff (note-rest-note-rest pattern):
            </Text>
            <View style={styles.notationWrapper}>{memoizedNotation}</View>
          </View>
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setPhase(PHASE.LISTEN)}
            accessibilityLabel="Continue to listen phase"
            accessibilityRole="button"
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
            Listen to: note-rest-note-rest (repeat).{"\n"}
            Each beat alternates between sound and silence.
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
                playQuarterNoteRestPattern(() => setHasHeardPattern(true));
              }}
              disabled={isPlaying}
              accessibilityLabel="Play audio example"
              accessibilityRole="button"
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
                onPress={playQuarterNoteRestPattern}
                disabled={isPlaying}
                accessibilityLabel="Replay audio"
                accessibilityRole="button"
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
                  accessibilityLabel="Proceed to sing phase"
                  accessibilityRole="button"
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
            Sing: note (1) - rest (2) - note (3) - rest (4).{"\n"}
            Be silent on the even beats!
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
                accessibilityLabel="Try again"
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
              {singAttempts >= 3 && (
                <TouchableOpacity
                  style={[styles.tertiaryButton, { marginTop: 8 }]}
                  onPress={() => handleShowAttestModal("sing")}
                  accessibilityLabel="Attest that I did it correctly"
                  accessibilityRole="button"
                >
                  <Text style={styles.tertiaryButtonText}>
                    I did it correctly →
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : singResult?.success ? (
            <>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={playQuarterNoteRestPattern}
                  disabled={isPlaying}
                  accessibilityLabel="Replay audio"
                  accessibilityRole="button"
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
                  accessibilityLabel="Sing again"
                  accessibilityRole="button"
                >
                  <Text style={styles.secondaryButtonText}>🎤 Sing Again</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 8 }]}
                onPress={() => setPhase(PHASE.IMAGINE)}
                accessibilityLabel="Continue to imagine phase"
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>Continue →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, isPlaying && styles.buttonDisabled]}
              onPress={() => playMetronomeOnly(handleDoneSinging)}
              disabled={isPlaying}
              accessibilityLabel="Start singing"
              accessibilityRole="button"
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
            Imagine playing: note-rest-note-rest.{"\n"}
            Feel the alternating sound and silence.
          </Text>

          {/* Show notation at top when open */}
          {showNotation && renderNotationToggle()}

          {isPlaying && <BeatIndicator />}

          <View style={styles.imagineVisual}>
            <View style={styles.imaginePatternRow}>
              <View style={styles.imaginePatternNote} />
              <View style={styles.imaginePatternRest}>
                <Text style={styles.imaginePatternRestText}>🤫</Text>
              </View>
              <View style={styles.imaginePatternNote} />
              <View style={styles.imaginePatternRest}>
                <Text style={styles.imaginePatternRestText}>🤫</Text>
              </View>
            </View>
            <Text style={styles.imagineHint}>Play - Rest - Play - Rest</Text>
          </View>

          {/* Show notation button at bottom when closed */}
          {!showNotation && renderNotationToggle()}
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            style={[styles.secondaryButton, isPlaying && styles.buttonDisabled]}
            onPress={playMetronomeOnly}
            disabled={isPlaying}
            accessibilityLabel="Count with metronome clicks"
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>
              {isPlaying ? "🥁 Counting..." : "🥁 Count with Clicks"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: 8 }]}
            onPress={handleDoneImagining}
            accessibilityLabel="Proceed to play phase"
            accessibilityRole="button"
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
            Play: note (1) - rest (2) - note (3) - rest (4).{"\n"}
            Two measures of alternating pattern.
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
                accessibilityLabel="Try again"
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
              {playAttempts >= 3 && (
                <TouchableOpacity
                  style={[styles.tertiaryButton, { marginTop: 8 }]}
                  onPress={() => handleShowAttestModal("play")}
                  accessibilityLabel="Attest that I did it correctly"
                  accessibilityRole="button"
                >
                  <Text style={styles.tertiaryButtonText}>
                    I did it correctly →
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : playResult?.success ? (
            <>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={playQuarterNoteRestPattern}
                  disabled={isPlaying}
                  accessibilityLabel="Replay audio"
                  accessibilityRole="button"
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
                  accessibilityLabel="Play again"
                  accessibilityRole="button"
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
                accessibilityLabel="Continue to next step"
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>Continue →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, isPlaying && styles.buttonDisabled]}
              onPress={() => playMetronomeOnly(handleDonePlaying)}
              disabled={isPlaying}
              accessibilityLabel="Start playing"
              accessibilityRole="button"
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
              You've learned the quarter rest
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
              Quarter rest = 1 beat silence{"\n"}
              Squiggly "lightning bolt" shape{"\n"}
              Note-Rest-Note-Rest pattern
            </Text>
          </View>
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleContinue}
            accessibilityLabel={overallSuccess ? "Next round" : "Try again"}
            accessibilityRole="button"
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

// PropTypes validation
QuarterRestLessonExercise.propTypes = exercisePropTypes;
QuarterRestLessonExercise.defaultProps = exerciseDefaultProps;

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
  quarterRestSymbol: {
    fontSize: 72,
    color: "#d4a574",
    marginBottom: 16,
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
  focusCardDetail: {
    fontSize: 16,
    color: "#a69580",
    textAlign: "center",
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
    top: 17,
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
    backgroundColor: "#8a7a6a",
    position: "absolute",
    top: 20,
  },
  halfRestBlockSmall: {
    width: 16,
    height: 8,
    backgroundColor: "#8a7a6a",
    position: "absolute",
    top: 12,
  },
  quarterRestSymbolSmall: {
    fontSize: 36,
    color: "#d4a574",
    height: 40,
    lineHeight: 40,
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
  quarterRestSymbolMini: {
    fontSize: 32,
    color: "#d4a574",
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
    gap: 4,
  },
  beatDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  beatNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  beatNumberActive: {
    color: "#1a1410",
  },
  beatNumberRestActive: {
    color: "#c4b5a0",
  },
  // Subdivision dots (eighth notes)
  subdivisionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2d241a",
    borderWidth: 1,
    borderColor: "#3b2c1a",
    marginHorizontal: 4,
    alignSelf: "center",
  },
  subdivisionDotActive: {
    backgroundColor: "#8b7355",
    borderColor: "#8b7355",
  },
  patternHint: {
    marginTop: 12,
    alignItems: "center",
  },
  patternHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  patternHintSpacer: {
    width: 60,
    marginRight: 12,
  },
  patternHintNote: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#d4a574",
  },
  patternHintRest: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2d241a",
    borderWidth: 2,
    borderColor: "#8a7a6a",
    borderStyle: "dashed",
    position: "relative",
  },
  patternHintRestText: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    fontSize: 18,
    textAlign: "center",
    lineHeight: 28,
  },
  patternHintSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#5a4a3a",
    marginHorizontal: 4,
  },
  patternHintText: {
    fontSize: 18,
    color: "#d4a574",
  },
  patternHintSubtext: {
    fontSize: 12,
    color: "#8a7a6a",
    marginTop: 4,
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
  imaginePatternRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  imaginePatternNote: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#d4a574",
  },
  imaginePatternRest: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2d241a",
    borderWidth: 2,
    borderColor: "#8a7a6a",
    borderStyle: "dashed",
    position: "relative",
  },
  imaginePatternRestText: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    fontSize: 24,
    textAlign: "center",
    lineHeight: 36,
  },
  imagineEmoji: {
    fontSize: 40,
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
  // Extra styles for inline conversions
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  notationWrapperRelative: {
    position: "relative",
  },
  highlightOverlay: {
    position: "absolute",
    top: 40,
    backgroundColor: "rgba(76, 175, 80, 0.25)",
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "rgba(76, 175, 80, 0.6)",
    pointerEvents: "none",
  },
});
