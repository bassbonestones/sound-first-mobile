/**
 * QuarterNoteLessonExercise - Teaches the quarter note concept
 *
 * Flow: Focus Card → Listen → Sing → Imagine → Play → Feedback
 * Key concepts:
 * - A quarter note lasts 1 beat
 * - Has a stem (like half note)
 * - Note head is FILLED/SOLID (not hollow like whole/half)
 * - The note ends right on beat 2
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

// For notation display
let NotationDisplay = null;
try {
  NotationDisplay = require("../../../../components/NotationDisplay").default;
} catch (e) {
  console.warn("NotationDisplay not available");
}

// Generate MusicXML for a single quarter note
function generateQuarterNoteMusicXML(noteName, clef = "treble") {
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
        <duration>1</duration>
        <type>quarter</type>
${accidentalXML}      </note>
      <note>
        <rest/>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <rest/>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <rest/>
        <duration>1</duration>
        <type>quarter</type>
      </note>
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

export default function QuarterNoteLessonExercise({
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
  const [isSubdivision, setIsSubdivision] = useState(false);
  const [showNotation, setShowNotation] = useState(false);
  const [singResult, setSingResult] = useState(null);
  const [playResult, setPlayResult] = useState(null);
  const [successfulRounds, setSuccessfulRounds] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasHeardPattern, setHasHeardPattern] = useState(false);
  const [soundingOnBeats, setSoundingOnBeats] = useState([false, false]);
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
  // Beat 1 should have sound, beat 2 should not (note ends on 2)
  const soundingOnBeatsRef = useRef([0, 0]);
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
    () => generateQuarterNoteMusicXML(userFirstNote, clef),
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
    soundingOnBeatsRef.current = [0, 0];
    startedEarlyRef.current = false;
    setSoundingOnBeats([false, false]);
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

  // Play a quarter note with metronome clicks
  const playQuarterNote = useCallback(
    (onComplete) => {
      const ctx = audioContextRef.current;
      if (!ctx || isPlaying) return;

      onCompleteRef.current =
        typeof onComplete === "function" ? onComplete : null;

      setIsPlaying(true);
      setCurrentBeat(-4);
      setIsSubdivision(false);

      const beatMs = (60 / bpm) * 1000;
      const eighthMs = beatMs / 2;
      let beat = -4;
      let isAnd = true; // First interval tick is subdivision after initial beat

      const playNote = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const now = ctx.currentTime;
        const duration = (beatMs * 1) / 1000; // 1 beat

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
          if (beat === 0) beat = 1;
          setIsSubdivision(false);

          if (beat >= -3 && beat <= -1) {
            createClickSound(ctx, false);
            setCurrentBeat(beat);
          } else if (beat === 1) {
            createClickSound(ctx, true);
            playNote();
            setCurrentBeat(1);
          } else if (beat === 2) {
            // The next beat - note ends here
            createClickSound(ctx, false);
            setCurrentBeat(2);
          } else {
            clearInterval(beatIntervalRef.current);
            beatIntervalRef.current = null;
            setIsPlaying(false);
            setCurrentBeat(0);
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
  }, []);

  // Play just metronome clicks for sing/play phases
  const playMetronomeOnly = useCallback(
    (onComplete) => {
      const ctx = audioContextRef.current;
      if (!ctx || isPlaying) return;

      onCompleteRef.current =
        typeof onComplete === "function" ? onComplete : null;

      setIsPlaying(true);
      setCurrentBeat(-4);
      setIsSubdivision(false);
      soundingOnBeatsRef.current = [0, 0];
      startedEarlyRef.current = false;
      setSoundingOnBeats([false, false]);

      const beatMs = (60 / bpm) * 1000;
      const eighthMs = beatMs / 2;
      let beat = -4;
      let isAnd = true; // First interval tick is subdivision after initial beat

      let beatSoundingSamples = { beat: 0, samples: 0, soundingCount: 0 };
      let earlySoundingSamples = 0;
      let samplesBeforeChecking = 3;

      const samplingInterval = setInterval(() => {
        if (samplesBeforeChecking > 0) {
          samplesBeforeChecking--;
          return;
        }

        if (beat >= -4 && beat <= -1) {
          if (isSoundingRef.current) {
            earlySoundingSamples++;
            if (earlySoundingSamples >= 3) {
              startedEarlyRef.current = true;
            }
          } else {
            earlySoundingSamples = 0;
          }
        }
        if (beat >= 1 && beat <= 2) {
          if (beatSoundingSamples.beat !== beat) {
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
          if (beat === 0) beat = 1;
          setIsSubdivision(false);

          if (beat >= -3 && beat <= -1) {
            createClickSound(ctx, false);
            setCurrentBeat(beat);
          } else if (beat === 1) {
            createClickSound(ctx, true);
            setCurrentBeat(1);
          } else if (beat === 2) {
            createClickSound(ctx, false);
            setCurrentBeat(2);
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
            setIsSubdivision(false);
            setSoundingOnBeats([...soundingOnBeatsRef.current]);
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
    console.log("[QuarterNoteLesson] analyzePerformance:", {
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

    const SUSTAIN_THRESHOLD = 0.65; // Quarter note is short, so lower threshold
    const STOP_THRESHOLD = 0.5;

    const startedOnBeatOne = beatSoundPct[0] >= SUSTAIN_THRESHOLD;
    const stoppedOnBeatTwo = beatSoundPct[1] < STOP_THRESHOLD;

    const rhythmOk = startedOnBeatOne && !startedEarly && stoppedOnBeatTwo;

    const success = pitchOk && rhythmOk;

    let message = "Great!";
    if (!pitchOk && !rhythmOk) {
      message = "Try to match the pitch and play for 1 beat";
    } else if (!pitchOk) {
      message = "Good rhythm! Try to match the pitch better";
    } else if (startedEarly) {
      message = "Wait for beat ONE to start";
    } else if (!startedOnBeatOne) {
      message = "Start right on beat ONE (not late)";
    } else if (!stoppedOnBeatTwo) {
      message = "Stop right on beat 2 - you held too long";
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
    soundingOnBeatsRef.current = [0, 0];
    startedEarlyRef.current = false;
    setSoundingOnBeats([false, false]);
    setTimeout(() => {
      playMetronomeOnly(handleDoneSinging);
    }, 100);
  }, [playMetronomeOnly, handleDoneSinging]);

  const handleDoneImagining = useCallback(() => {
    stopPlayback();
    hasHitTargetPitchRef.current = false;
    onPitchCountRef.current = 0;
    totalSoundingCountRef.current = 0;
    soundingOnBeatsRef.current = [0, 0];
    startedEarlyRef.current = false;
    setSoundingOnBeats([false, false]);
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
    soundingOnBeatsRef.current = [0, 0];
    startedEarlyRef.current = false;
    setSoundingOnBeats([false, false]);
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
    soundingOnBeatsRef.current = [0, 0];
    startedEarlyRef.current = false;
    setSoundingOnBeats([false, false]);
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

  // Compute cursor position (single quarter note - cursor on when beat >= 1)
  const cursorNoteIndex = useMemo(() => {
    if (!showNotation || currentBeat < 1) return null;
    return 0; // Single note
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

    // Single quarter note highlight position
    const highlightLeft = cursorNoteIndex !== null ? 105 : null;
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
                    top: 40,
                    width: highlightWidth,
                    height: 120,
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

  const renderFocusCardMini = () => {
    return (
      <View style={styles.focusCardMini}>
        <View style={styles.focusCardMiniLeft}>
          <View style={styles.quarterNoteSymbolMini}>
            <View style={styles.quarterNoteOvalMini} />
            <View style={styles.quarterNoteStemMini} />
          </View>
        </View>
        <View style={styles.focusCardMiniRight}>
          <Text style={styles.focusCardMiniTitle}>Quarter Note</Text>
          <Text style={styles.focusCardMiniText}>1 beat → ends on beat 2</Text>
        </View>
      </View>
    );
  };

  // Beat indicator for quarter note (1 beat + stop on 2) with eighth note subdivision
  const BeatIndicator = () => {
    const isInCountIn = currentBeat < 0;

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

        <View style={styles.singRow}>
          <Text style={styles.singLabel}>Play:</Text>
          <View style={styles.beatIndicator}>
            <View
              style={[
                styles.beatDot,
                styles.beatDotAccent,
                currentBeat >= 1 && currentBeat > 0 && styles.beatDotActive,
              ]}
            >
              <Text
                style={[
                  styles.beatNumber,
                  currentBeat >= 1 &&
                    currentBeat > 0 &&
                    styles.beatNumberActive,
                ]}
              >
                1
              </Text>
            </View>
            <View
              style={[
                styles.beatDot,
                styles.beatDotStop,
                currentBeat === 2 && styles.beatDotStopActive,
              ]}
            >
              <Text
                style={[
                  styles.beatNumber,
                  currentBeat === 2 && styles.beatNumberStopActive,
                ]}
              >
                2
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
            <Text style={styles.focusCardTitle}>Quarter Note</Text>
            <View style={styles.quarterNoteSymbol}>
              <View style={styles.quarterNoteOval} />
              <View style={styles.quarterNoteStem} />
            </View>
            <Text style={styles.focusCardDescription}>
              A quarter note lasts for 1 beat.
            </Text>
            <View style={styles.focusCardDivider} />
            <Text style={styles.focusCardCue}>
              It has a FILLED (solid) note head.
            </Text>
            <Text style={styles.focusCardDetail}>
              Still has a stem like the half note.
            </Text>
            <View style={styles.comparisonBox}>
              <Text style={styles.comparisonTitle}>Compare notes:</Text>
              <View style={styles.comparisonRow}>
                <View style={styles.comparisonItem}>
                  <View style={styles.noteCompareContainer}>
                    <View style={styles.halfNoteHeadCompare} />
                    <View style={styles.noteStemCompare} />
                  </View>
                  <Text style={styles.comparisonLabel}>Half note</Text>
                  <Text style={styles.comparisonDetail}>Hollow</Text>
                </View>
                <View style={styles.comparisonItem}>
                  <View style={styles.noteCompareContainer}>
                    <View style={styles.quarterNoteHeadCompare} />
                    <View style={styles.quarterNoteStemCompare} />
                  </View>
                  <Text style={styles.comparisonLabel}>Quarter note</Text>
                  <Text style={styles.comparisonDetail}>Filled</Text>
                </View>
              </View>
            </View>
            <Text style={styles.focusCardMnemonic}>Count: 1 - (2) stop!</Text>
          </View>

          {/* Show actual notation */}
          <View style={styles.notationPreview}>
            <Text style={styles.notationPreviewLabel}>On the staff:</Text>
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
            Listen to the quarter note.{"\n"}
            Notice how SHORT it is - just 1 beat!
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
                playQuarterNote(() => setHasHeardPattern(true));
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
                onPress={playQuarterNote}
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
            Sing the quarter note on solfege (do).{"\n"}
            Just 1 beat - short and quick!
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
                  onPress={playQuarterNote}
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
            Imagine playing this quarter note on your instrument.{"\n"}
            Quick attack, short release!
          </Text>

          {/* Show notation at top when open */}
          {showNotation && renderNotationToggle()}

          {isPlaying && <BeatIndicator />}

          <View style={styles.imagineVisual}>
            <Text style={styles.imagineHint}>Hear: 1 - (2) stop</Text>
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
            Play the quarter note on your instrument.{"\n"}
            Just 1 beat - release quickly!
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
                  onPress={playQuarterNote}
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
              You've learned the quarter note
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
              A quarter note = 1 beat{"\n"}
              Has a stem + filled head{"\n"}
              Short and quick!
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

// PropTypes validation
QuarterNoteLessonExercise.propTypes = exercisePropTypes;
QuarterNoteLessonExercise.defaultProps = exerciseDefaultProps;

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
  quarterNoteSymbol: {
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: 60,
    height: 80,
  },
  quarterNoteOval: {
    width: 28,
    height: 22,
    borderRadius: 14,
    backgroundColor: "#d4a574",
    transform: [{ rotate: "-15deg" }],
    position: "absolute",
    bottom: 0,
    left: 8,
  },
  quarterNoteStem: {
    width: 4,
    height: 50,
    backgroundColor: "#d4a574",
    position: "absolute",
    right: 24,
    bottom: 14,
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
  noteCompareContainer: {
    width: 28,
    height: 50,
    position: "relative",
  },
  halfNoteHeadCompare: {
    width: 24,
    height: 18,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#8a7a6a",
    backgroundColor: "transparent",
    transform: [{ rotate: "-15deg" }],
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  quarterNoteHeadCompare: {
    width: 24,
    height: 18,
    borderRadius: 12,
    backgroundColor: "#d4a574",
    transform: [{ rotate: "-15deg" }],
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  noteStemCompare: {
    width: 3,
    height: 36,
    backgroundColor: "#8a7a6a",
    position: "absolute",
    right: 4,
    bottom: 12,
  },
  quarterNoteStemCompare: {
    width: 3,
    height: 36,
    backgroundColor: "#d4a574",
    position: "absolute",
    right: 4,
    bottom: 12,
  },
  comparisonLabel: {
    fontSize: 12,
    color: "#c4b5a0",
    marginTop: 8,
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
    fontSize: 16,
    color: "#c4b5a0",
    marginBottom: 12,
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
  },
  quarterNoteSymbolMini: {
    width: 24,
    height: 40,
    position: "relative",
  },
  quarterNoteOvalMini: {
    width: 14,
    height: 11,
    borderRadius: 7,
    backgroundColor: "#d4a574",
    transform: [{ rotate: "-15deg" }],
    position: "absolute",
    bottom: 0,
    left: 2,
  },
  quarterNoteStemMini: {
    width: 2,
    height: 28,
    backgroundColor: "#d4a574",
    position: "absolute",
    right: 7,
    bottom: 8,
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
    gap: 8,
  },
  countInDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    gap: 8,
  },
  beatDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
  },
  beatNumberActive: {
    color: "#1a1410",
  },
  beatNumberStopActive: {
    color: "#fff",
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
    fontSize: 64,
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
