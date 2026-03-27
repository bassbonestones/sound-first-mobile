/**
 * Fragment2LessonExercise - Refactored to use shared state hook
 *
 * Uses:
 * - useLessonExerciseState for phase/UI state management
 * - Custom audio logic for half note patterns with tonic drone
 *
 * Flow: Focus Card → Listen → Sing → Imagine → Play with Drone → Play → Feedback
 *
 * Patterns (all must be completed once for mastery):
 * - Linear Up: 1 → 2 (2 half notes)
 * - Linear Down: 2 → 1 (2 half notes)
 * - Arc Up: 1 → 2 → 1 (3 half notes)
 * - Arc Down: 2 → 1 → 2 (3 half notes)
 *
 * Features:
 * - Fixed tempo: 60 BPM (half notes for better pitch perception)
 * - Eighth note subdivision
 * - Focus card rotation (pitch, projection, core sound, rhythm)
 * - Tonic drone during "Play with Drone" phase
 * - Notation display with cursor
 */
import React, { useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ScrollView,
  Modal,
} from "react-native";
import { styles } from "./Fragment2LessonExercise.styles";
import { usePitchDetection } from "../../../../hooks/usePitchDetection";
import { CircularVolumeIndicator } from "../../../../components/VolumeBar";
import {
  parseNoteName,
  noteToMidi,
  midiToFrequency,
  noteToFrequency,
  midiToNote,
  createAudioContext,
  createClickSound,
  LESSON_PHASES,
  PITCH_DETECTION_OPTIONS,
} from "./shared";
import type { ExerciseProps } from "./shared";
import { useLessonExerciseState } from "./shared/useLessonExerciseState";
import { useFragment2Audio } from "./shared";
import {
  FRAGMENT2_CONFIG,
  FRAGMENT2_PATTERNS,
  FRAGMENT2_PATTERN_ORDER,
  FRAGMENT2_FOCUS_CARDS,
  generatePatternNotes,
  generateFragment2MusicXML,
  getFragment2Pattern,
} from "./configs/fragment2Config";
import { devLog, devWarn } from "../../../../utils/devLogger";

// For notation display
let NotationDisplay: React.ComponentType<{
  musicxml: string | null;
  width: number;
  height: number;
  showTimeSignature?: boolean;
}> | null = null;
try {
  NotationDisplay = require("../../../../components/NotationDisplay").default;
} catch (_e) {
  devWarn("NotationDisplay not available");
}

// Phases - extend LESSON_PHASES with play_with_drone
const PHASE = {
  ...LESSON_PHASES,
  PLAY_WITH_DRONE: "play_with_drone" as const,
};

// Use imports from config
const PATTERNS = FRAGMENT2_PATTERNS;
const PATTERN_ORDER = FRAGMENT2_PATTERN_ORDER;
const FOCUS_CARD_ROTATION = FRAGMENT2_FOCUS_CARDS;

// Major scale intervals (semitones from root)
const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11, 12];

// Get scale degree pitch from first note
function getScaleDegreePitch(
  firstNoteMidi: number,
  scaleDegree: number,
): number {
  // Scale degree is 1-based
  const interval = MAJOR_SCALE_INTERVALS[scaleDegree - 1];
  return firstNoteMidi + interval;
}

// Generate MusicXML for a fragment pattern
function generateFragmentMusicXML(scaleDegrees, firstNote, clef = "treble") {
  const firstNoteMidi = noteToMidi(firstNote);

  const clefSign = clef === "bass" ? "F" : "G";
  const clefLine = clef === "bass" ? "4" : "2";

  let notes = scaleDegrees
    .map((degree) => {
      const midi = getScaleDegreePitch(firstNoteMidi, degree);
      const noteName = midiToNote(midi, false);
      const parsed = parseNoteName(noteName);

      let alter = 0;
      let alterXML = "";
      let accidentalXML = "";

      if (noteName.includes("#")) {
        alter = 1;
        alterXML = `        <alter>1</alter>\n`;
        accidentalXML = `        <accidental>sharp</accidental>\n`;
      } else if (noteName.includes("b")) {
        alter = -1;
        alterXML = `        <alter>-1</alter>\n`;
        accidentalXML = `        <accidental>flat</accidental>\n`;
      }

      const step = noteName.charAt(0);
      const octave = noteName.charAt(noteName.length - 1);

      return `      <note>
        <pitch>
          <step>${step}</step>
${alterXML}          <octave>${octave}</octave>
        </pitch>
        <duration>2</duration>
        <type>half</type>
${accidentalXML}      </note>`;
    })
    .join("\n");

  // Always use 4/4 time signature
  // For 3-note patterns (6 beats), add a half rest at the end to fill the bar
  const noteBeats = scaleDegrees.length * 2;
  const needsRest = noteBeats < 4; // 2 or 3 notes don't fill 4 beats? Actually 3 notes = 6 beats, need different logic

  // If we have 3 half notes (6 beats), we need 2 measures in 4/4, or use 6/4
  // For simplicity, let's use a time signature that fits the notes but display as 4/4
  // Actually user wants 4/4 with a rest. 3 half notes = 6 beats. In 4/4, that's 1.5 measures.
  // Let's put 2 half notes in measure 1, 1 half note + half rest in measure 2

  // For 2-note patterns: 4 beats, fits perfectly in 4/4
  // For 3-note patterns: 6 beats, use 2 measures of 4/4 (4 beats + 2 beats + 2 beat rest)

  if (scaleDegrees.length === 3) {
    // Split into 2 measures for 3-note patterns
    const allNotes = scaleDegrees.map((degree) => {
      const midi = getScaleDegreePitch(firstNoteMidi, degree);
      const noteName = midiToNote(midi, false);

      let alterXML = "";
      let accidentalXML = "";

      if (noteName.includes("#")) {
        alterXML = `        <alter>1</alter>\n`;
        accidentalXML = `        <accidental>sharp</accidental>\n`;
      } else if (noteName.includes("b")) {
        alterXML = `        <alter>-1</alter>\n`;
        accidentalXML = `        <accidental>flat</accidental>\n`;
      }

      const step = noteName.charAt(0);
      const octave = noteName.charAt(noteName.length - 1);

      return { step, octave, alterXML, accidentalXML };
    });

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
          <step>${allNotes[0].step}</step>
${allNotes[0].alterXML}          <octave>${allNotes[0].octave}</octave>
        </pitch>
        <duration>2</duration>
        <type>half</type>
${allNotes[0].accidentalXML}      </note>
      <note>
        <pitch>
          <step>${allNotes[1].step}</step>
${allNotes[1].alterXML}          <octave>${allNotes[1].octave}</octave>
        </pitch>
        <duration>2</duration>
        <type>half</type>
${allNotes[1].accidentalXML}      </note>
    </measure>
    <measure number="2">
      <note>
        <pitch>
          <step>${allNotes[2].step}</step>
${allNotes[2].alterXML}          <octave>${allNotes[2].octave}</octave>
        </pitch>
        <duration>2</duration>
        <type>half</type>
${allNotes[2].accidentalXML}      </note>
      <note>
        <rest/>
        <duration>2</duration>
        <type>half</type>
      </note>
    </measure>
  </part>
</score-partwise>`;
  }

  // For 2-note patterns, use single 4/4 measure
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
${notes}
    </measure>
  </part>
</score-partwise>`;
}

export default function Fragment2LessonExercise({
  config = {},
  mastery,
  onComplete,
  onProgress,
  userFirstNote = "F3",
  userRangeLow,
  userRangeHigh,
}: ExerciseProps): React.JSX.Element {
  // ---------------------------------------------------------------------------
  // Config
  // ---------------------------------------------------------------------------
  const clef =
    ((config as Record<string, unknown>)?.clef as "treble" | "bass") ??
    "treble";

  // Fixed tempo for half notes
  const tempo = FRAGMENT2_CONFIG.tempo;

  // ---------------------------------------------------------------------------
  // State Hook (common state)
  // ---------------------------------------------------------------------------
  const exercise = useLessonExerciseState({
    phases: {
      startPhase: PHASE.FOCUS_CARD,
      additionalPhases: { PLAY_WITH_DRONE: PHASE.PLAY_WITH_DRONE },
    },
    focusCards: FRAGMENT2_FOCUS_CARDS,
  });

  // ---------------------------------------------------------------------------
  // Custom State (exercise-specific)
  // ---------------------------------------------------------------------------

  // Local showNotation state (workaround for hook issues in tests)
  const [localShowNotation, setLocalShowNotation] = React.useState(false);

  // Pattern state
  const [currentPatternIndex, setCurrentPatternIndex] = React.useState(0);
  const [completedPatterns, setCompletedPatterns] = React.useState<
    Record<string, boolean>
  >({});
  const [focusCardIndex, setFocusCardIndex] = React.useState(0);

  // Session starting note
  const [sessionStartingNote, setSessionStartingNote] = React.useState<
    string | null
  >(null);

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  const scrollViewRef = useRef<ScrollView>(null);

  // ---------------------------------------------------------------------------
  // Current Pattern Info
  // ---------------------------------------------------------------------------
  const currentPatternId = PATTERN_ORDER[currentPatternIndex];
  const currentPattern = Object.values(PATTERNS).find(
    (p) => p.id === currentPatternId,
  );
  const patternNotes = currentPattern?.scaleDegrees || [1, 2];

  // Current focus card (rotate through on each pattern)
  const currentFocusCard =
    FOCUS_CARD_ROTATION[focusCardIndex % FOCUS_CARD_ROTATION.length];

  // Calculate valid starting notes based on user's range
  // For 2-note fragments (do-re), we need at least M2 (2 semitones) of space
  const validStartingNotes = useMemo(() => {
    const lowMidi = userRangeLow
      ? noteToMidi(userRangeLow)
      : noteToMidi(userFirstNote);
    const highMidi = userRangeHigh ? noteToMidi(userRangeHigh) : lowMidi + 2; // At least M2

    // For do-re patterns, starting note must allow re (do + 2 semitones) to fit
    const maxStartingMidi = highMidi - 2;
    const notes: string[] = [];

    for (let midi = lowMidi; midi <= maxStartingMidi; midi++) {
      notes.push(midiToNote(midi, false));
    }

    // If no valid notes (range too small), fall back to userFirstNote
    if (notes.length === 0) {
      return [userFirstNote];
    }

    return notes;
  }, [userRangeLow, userRangeHigh, userFirstNote]);

  // Initialize session starting note when validStartingNotes becomes available
  useEffect(() => {
    if (!sessionStartingNote && validStartingNotes.length > 0) {
      const randomIndex = Math.floor(Math.random() * validStartingNotes.length);
      const selectedNote = validStartingNotes[randomIndex];
      setSessionStartingNote(selectedNote);
      devLog(
        `[SESSION] Selected starting note for session: ${selectedNote} from [${validStartingNotes.join(", ")}]`,
      );
    }
  }, [validStartingNotes, sessionStartingNote]);

  // Use the session's single starting note for all patterns
  const currentStartingNote =
    sessionStartingNote || validStartingNotes[0] || userFirstNote;

  // Parse note info
  const noteInfo = useMemo(() => {
    const parsed = parseNoteName(currentStartingNote);
    return parsed || { letter: "F", accidental: "", octave: 3 };
  }, [currentStartingNote]);

  const firstNoteMidi = useMemo(
    () => noteToMidi(currentStartingNote),
    [currentStartingNote],
  );

  // Generate pitches for current pattern
  const patternPitches = useMemo(() => {
    return patternNotes.map((degree) =>
      getScaleDegreePitch(firstNoteMidi, degree),
    );
  }, [patternNotes, firstNoteMidi]);

  const patternFrequencies = useMemo(() => {
    return patternPitches.map((midi) => midiToFrequency(midi));
  }, [patternPitches]);

  // ---------------------------------------------------------------------------
  // Audio Hook
  // ---------------------------------------------------------------------------
  const {
    playPattern,
    playMetronomeOnly,
    stopPlayback,
    startDrone,
    stopDrone,
    analyzePerformance,
    resetTracking,
    droneActive,
    isSoundingRef,
    notePitchAccuracyRef,
    hasHitTargetPitchRef,
    onPitchCountRef,
    totalSoundingCountRef,
  } = useFragment2Audio({
    patternFrequencies,
    patternNotesCount: patternNotes.length,
    tempo,
    firstNoteMidi,
    exercise,
    isSingPhase: exercise.phase === PHASE.SING,
    patternPitches,
  });

  // Generate MusicXML - use config function
  const musicXML = useMemo(
    () => generateFragment2MusicXML(patternNotes, currentStartingNote, clef),
    [patternNotes, currentStartingNote, clef],
  );

  // Pitch detection - NOT during PLAY_WITH_DRONE (drone interferes)
  const isPitchActive =
    (exercise.phase === PHASE.SING && !exercise.singResult) ||
    (exercise.phase === PHASE.PLAY && !exercise.playResult);

  const { currentPitch, volume, isSounding } = usePitchDetection({
    enabled: isPitchActive,
    ...PITCH_DETECTION_OPTIONS,
  });

  // Track pitch accuracy - need to detect the sequence of pitches
  useEffect(() => {
    if (!isSounding || !currentPitch?.noteName) return;

    const detectedMidi = noteToMidi(currentPitch.noteName);
    if (detectedMidi === null) return;

    totalSoundingCountRef.current += 1;

    // Check if detected pitch matches any of the pattern pitches
    const isOnPitch = patternPitches.some((targetMidi) => {
      const diff = Math.abs(detectedMidi - targetMidi);
      return exercise.phase === PHASE.SING
        ? diff % 12 <= 1 || diff % 12 >= 11
        : diff === 0; // Play phase: must be exact semitone
    });

    if (isOnPitch) {
      hasHitTargetPitchRef.current = true;
      onPitchCountRef.current += 1;
    }

    // Track per-note pitch accuracy (which specific note they should be on)
    if (exercise.isPlaying && exercise.currentBeat >= 1) {
      const noteIndex = Math.floor((exercise.currentBeat - 1) / 2);
      if (
        noteIndex >= 0 &&
        noteIndex < patternPitches.length &&
        notePitchAccuracyRef.current[noteIndex]
      ) {
        notePitchAccuracyRef.current[noteIndex].total += 1;

        // Check if pitch matches THIS specific note's target
        const targetMidi = patternPitches[noteIndex];
        const diff = Math.abs(detectedMidi - targetMidi);
        const matchesThisNote =
          exercise.phase === PHASE.SING
            ? diff % 12 <= 1 || diff % 12 >= 11
            : diff === 0; // Play phase: must be exact semitone

        if (matchesThisNote) {
          notePitchAccuracyRef.current[noteIndex].onPitch += 1;
        }
      }
    }
  }, [
    currentPitch?.noteName,
    isSounding,
    patternPitches,
    exercise.phase,
    exercise.isPlaying,
    exercise.currentBeat,
  ]);

  useEffect(() => {
    isSoundingRef.current = isSounding;
  }, [isSounding, isSoundingRef]);

  // Reset tracking when phase changes
  useEffect(() => {
    resetTracking();
  }, [exercise.phase, resetTracking]);

  // Reset show notation when phase changes
  useEffect(() => {
    setLocalShowNotation(false);
  }, [exercise.phase]);

  // Check if all patterns are completed
  const allPatternsCompleted = useMemo(() => {
    return PATTERN_ORDER.every((id) => completedPatterns[id]);
  }, [completedPatterns]);

  // Handle phase transitions and results
  const handlePhaseComplete = useCallback(
    (result) => {
      if (exercise.phase === PHASE.SING) {
        exercise.setSingResult(result);
        if (result?.success) {
          exercise.resetSingAttempts();
        } else {
          exercise.incrementSingAttempts();
        }
      } else if (
        exercise.phase === PHASE.PLAY ||
        exercise.phase === PHASE.PLAY_WITH_DRONE
      ) {
        exercise.setPlayResult(result);
        if (result?.success) {
          exercise.resetPlayAttempts();
        } else {
          exercise.incrementPlayAttempts();
        }
      }
    },
    [exercise],
  );

  // Go to next phase
  const goToNextPhase = useCallback(() => {
    switch (exercise.phase) {
      case PHASE.FOCUS_CARD:
        exercise.setPhase(PHASE.LISTEN);
        break;
      case PHASE.LISTEN:
        exercise.setHasHeardPattern(true);
        exercise.setPhase(PHASE.SING);
        break;
      case PHASE.SING:
        exercise.setSingResult(null);
        exercise.setPhase(PHASE.IMAGINE);
        break;
      case PHASE.IMAGINE:
        exercise.setPhase(PHASE.PLAY_WITH_DRONE);
        break;
      case PHASE.PLAY_WITH_DRONE:
        exercise.setPlayResult(null);
        exercise.setPhase(PHASE.PLAY);
        break;
      case PHASE.PLAY:
        exercise.setPhase(PHASE.FEEDBACK);
        break;
      case PHASE.FEEDBACK:
        // Mark current pattern as completed
        setCompletedPatterns((prev) => ({ ...prev, [currentPatternId]: true }));

        // Check if all patterns done
        const newCompleted = { ...completedPatterns, [currentPatternId]: true };
        const allDone = PATTERN_ORDER.every((id) => newCompleted[id]);

        if (allDone) {
          exercise.setShowSuccess(true);
        } else {
          // Move to next incomplete pattern
          const nextIndex = PATTERN_ORDER.findIndex(
            (id, idx) => idx > currentPatternIndex && !newCompleted[id],
          );
          if (nextIndex !== -1) {
            setCurrentPatternIndex(nextIndex);
          } else {
            // Find first incomplete pattern
            const firstIncomplete = PATTERN_ORDER.findIndex(
              (id) => !newCompleted[id],
            );
            if (firstIncomplete !== -1) {
              setCurrentPatternIndex(firstIncomplete);
            }
          }
          // Rotate focus card
          setFocusCardIndex((prev) => prev + 1);
          // Reset for new pattern
          exercise.setHasHeardPattern(false);
          exercise.setSingResult(null);
          exercise.setPlayResult(null);
          exercise.setPhase(PHASE.FOCUS_CARD);
        }
        break;
    }
  }, [exercise, currentPatternId, completedPatterns, currentPatternIndex]);

  // Handle attestation
  const handleAttestConfirm = useCallback(() => {
    exercise.closeAttestModal();
    if (exercise.attestPhase === "sing") {
      exercise.setSingResult({ success: true, attested: true });
      exercise.resetSingAttempts();
    } else if (exercise.attestPhase === "play") {
      exercise.setPlayResult({ success: true, attested: true });
      exercise.resetPlayAttempts();
    }
  }, [exercise]);

  // Handle done singing
  const handleDoneSinging = useCallback(() => {
    const result = analyzePerformance();
    handlePhaseComplete(result);
  }, [analyzePerformance, handlePhaseComplete]);

  // Handle try sing again
  const handleTrySingAgain = useCallback(() => {
    exercise.setSingResult(null);
    hasHitTargetPitchRef.current = false;
    onPitchCountRef.current = 0;
    totalSoundingCountRef.current = 0;
    notePitchAccuracyRef.current = patternNotes.map(() => ({
      onPitch: 0,
      total: 0,
    }));
  }, [patternNotes, exercise]);

  // Handle done playing
  const handleDonePlaying = useCallback(() => {
    const result = analyzePerformance();
    handlePhaseComplete(result);
  }, [analyzePerformance, handlePhaseComplete]);

  // Handle done playing with drone (no strict judgment - just practice)
  const handleDonePlayingWithDrone = useCallback(() => {
    // Just show options without strict evaluation
    exercise.setPlayResult({ success: true, message: "Practice complete!" });
  }, [exercise]);

  // Handle try play again
  const handleTryPlayAgain = useCallback(() => {
    exercise.setPlayResult(null);
    hasHitTargetPitchRef.current = false;
    onPitchCountRef.current = 0;
    totalSoundingCountRef.current = 0;
    notePitchAccuracyRef.current = patternNotes.map(() => ({
      onPitch: 0,
      total: 0,
    }));
  }, [patternNotes, exercise]);

  // Handle done imagining
  const handleDoneImagining = useCallback(() => {
    goToNextPhase();
  }, [goToNextPhase]);

  // Progress indicator for patterns
  const PatternProgress = () => (
    <View style={styles.patternProgress}>
      {PATTERN_ORDER.map((id, index) => {
        const pattern = Object.values(PATTERNS).find((p) => p.id === id);
        const isCompleted = completedPatterns[id];
        const isCurrent = index === currentPatternIndex;

        return (
          <TouchableOpacity
            key={id}
            accessibilityLabel={`${pattern.name} pattern${isCompleted ? ", completed" : isCurrent ? ", current" : ""}`}
            accessibilityRole="button"
            style={[
              styles.patternDot,
              isCompleted && styles.patternDotCompleted,
              isCurrent && styles.patternDotCurrent,
            ]}
            onPress={() => {
              if (allPatternsCompleted || exercise.showSuccess) {
                // Allow replay of any pattern after completion
                setCurrentPatternIndex(index);
                exercise.setHasHeardPattern(false);
                exercise.setSingResult(null);
                exercise.setPlayResult(null);
                exercise.setPhase(PHASE.LISTEN);
                exercise.setShowSuccess(false);
              }
            }}
          >
            <Text
              style={[
                styles.patternDotText,
                (isCompleted || isCurrent) && styles.patternDotTextActive,
              ]}
            >
              {isCompleted ? "✓" : index + 1}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // Mini focus card display
  const renderFocusCardMini = () => (
    <View style={styles.focusCardMini}>
      <View style={styles.focusCardMiniIcon}>
        <Text style={styles.focusCardMiniIconText}>🎯</Text>
      </View>
      <View style={styles.focusCardMiniRight}>
        <Text style={styles.focusCardMiniTitle}>{currentFocusCard.name}</Text>
        <Text style={styles.focusCardMiniText}>{currentFocusCard.cue}</Text>
      </View>
    </View>
  );

  // Beat indicator with subdivision (half notes = 2 beats per note)
  const BeatIndicator = () => {
    const numBeats = patternNotes.length * 2; // 2 beats per half note

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
                    beat <= exercise.currentBeat &&
                      exercise.currentBeat < 0 &&
                      styles.countInDotActive,
                    beat === -4 && styles.countInDotAccent,
                  ]}
                >
                  <Text
                    style={[
                      styles.countInNumber,
                      beat <= exercise.currentBeat &&
                        exercise.currentBeat < 0 &&
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
            {Array.from({ length: numBeats }, (_, i) => i + 1).map((beat) => {
              const isActive =
                exercise.currentBeat >= beat && exercise.currentBeat > 0;
              const isNoteStart = beat % 2 === 1; // Notes start on odd beats

              return (
                <React.Fragment key={beat}>
                  <View
                    style={[
                      styles.beatDot,
                      isNoteStart && styles.beatDotAccent,
                      isActive && styles.beatDotActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.beatNumber,
                        isActive && styles.beatNumberActive,
                      ]}
                    >
                      {beat}
                    </Text>
                  </View>
                </React.Fragment>
              );
            })}
            {/* Stop indicator */}
            <View
              style={[
                styles.beatDot,
                styles.beatDotStop,
                exercise.currentBeat === numBeats + 1 &&
                  styles.beatDotStopActive,
              ]}
            >
              <Text
                style={[
                  styles.beatNumber,
                  exercise.currentBeat === numBeats + 1 &&
                    styles.beatNumberStopActive,
                ]}
              >
                ●
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Compute note index for cursor (each note = 2 beats, beats 1-2 = note 0, beats 3-4 = note 1, etc.)
  const cursorNoteIndex = useMemo(() => {
    if (!exercise.showCursor || exercise.currentBeat < 1) return null;
    return Math.floor((exercise.currentBeat - 1) / 2);
  }, [exercise.showCursor, exercise.currentBeat]);

  // Scroll to top when notation is opened (notation now shows at top)
  const handleShowNotation = () => {
    setLocalShowNotation(true);
    // Scroll to top so notation is visible
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  };

  // Render notation toggle
  const renderNotationToggle = () => {
    // Calculate highlight position for custom cursor overlay
    // For 2-note patterns: single measure, notes evenly spaced
    // For 3-note patterns: 2 measures (notes 1-2 in m1, note 3 + rest in m2)
    const noteCount = patternNotes.length;
    let notePositions;
    let highlightWidth;

    if (noteCount === 2) {
      // Single 4/4 measure: clef+timesig ~100px, then 2 half notes
      notePositions = [135, 215];
      highlightWidth = 60;
    } else {
      // Two 4/4 measures: notes 1&2 in measure 1, note 3 in measure 2
      // Positions: ~95, ~155 for m1, then bar line, ~225 for m2
      notePositions = [95, 155, 225];
      highlightWidth = 45;
    }

    const highlightLeft =
      cursorNoteIndex !== null && cursorNoteIndex < notePositions.length
        ? notePositions[cursorNoteIndex]
        : null;

    return (
      <View style={styles.notationContainer}>
        {!localShowNotation ? (
          <TouchableOpacity
            accessibilityLabel="Show notation"
            accessibilityRole="button"
            style={styles.showNotationButton}
            onPress={() => setLocalShowNotation(true)}
          >
            <Text style={styles.showNotationText}>Show Notation 📝</Text>
          </TouchableOpacity>
        ) : (
          <>
            {NotationDisplay && (
              <View
                style={[styles.notationWrapper, styles.notationWrapperRelative]}
              >
                <NotationDisplay
                  musicxml={musicXML}
                  width={300}
                  height={200}
                  showTimeSignature={true}
                />
                {/* Custom cursor highlight overlay */}
                {highlightLeft !== null && (
                  <View
                    style={[
                      styles.highlightOverlay,
                      {
                        left: highlightLeft,
                        width: highlightWidth,
                        height: 120,
                      },
                    ]}
                  />
                )}
              </View>
            )}
            <TouchableOpacity
              accessibilityLabel="Hide notation"
              accessibilityRole="button"
              style={styles.hideNotationButton}
              onPress={() => setLocalShowNotation(false)}
            >
              <Text style={styles.hideNotationText}>Hide Notation</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  // Attestation Modal
  const attestationModal = useMemo(
    () => (
      <Modal
        visible={exercise.showAttestModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => exercise.closeAttestModal()}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm</Text>
            <Text style={styles.modalText}>
              I attest that I{" "}
              {exercise.attestPhase === "sing" ? "sang" : "played"} this
              correctly, but due to background noise or technical issues it was
              not able to register.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                accessibilityLabel="Cancel attestation"
                accessibilityRole="button"
                style={styles.modalCancelButton}
                onPress={() => exercise.closeAttestModal()}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel="Confirm attestation"
                accessibilityRole="button"
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
    [
      exercise.showAttestModal,
      exercise.attestPhase,
      handleAttestConfirm,
      exercise,
    ],
  );

  // FOCUS CARD PHASE
  if (exercise.phase === PHASE.FOCUS_CARD) {
    return (
      <View style={styles.container}>
        <PatternProgress />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.focusCard}>
            <Text style={styles.focusCardCategory}>
              {currentFocusCard.category.toUpperCase()}
            </Text>
            <Text style={styles.focusCardTitle}>{currentFocusCard.name}</Text>
            <Text style={styles.focusCardDescription}>
              {currentFocusCard.description}
            </Text>
            <View style={styles.focusCardCueBox}>
              <Text style={styles.focusCardCue}>{currentFocusCard.cue}</Text>
            </View>
          </View>

          <View style={styles.patternInfo}>
            <Text style={styles.patternTitle}>
              Pattern: {currentPattern?.name}
            </Text>
            <Text style={styles.patternDescription}>
              {currentPattern?.description}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            accessibilityLabel="Begin exercise"
            accessibilityRole="button"
            style={styles.primaryButton}
            onPress={goToNextPhase}
          >
            <Text style={styles.primaryButtonText}>Begin →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // LISTEN PHASE
  if (exercise.phase === PHASE.LISTEN) {
    return (
      <View style={styles.container}>
        <PatternProgress />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {renderFocusCardMini()}

          <Text style={styles.phaseTitle}>Listen</Text>
          <Text style={styles.patternDisplay}>
            {currentPattern?.description}
          </Text>
          <Text style={styles.instruction}>
            Listen to the {currentPattern?.name} pattern.{"\n"}
            Scale degrees: {patternNotes.join(" → ")}
          </Text>

          {/* Show notation at top when open */}
          {localShowNotation && renderNotationToggle()}

          {exercise.isPlaying && <BeatIndicator />}

          {/* Show notation button at bottom when closed */}
          {!localShowNotation && renderNotationToggle()}
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            accessibilityLabel={
              exercise.isPlaying ? "Listening to pattern" : "Play pattern"
            }
            accessibilityRole="button"
            style={[
              styles.primaryButton,
              exercise.isPlaying && styles.buttonDisabled,
            ]}
            onPress={() => playPattern(() => goToNextPhase())}
            disabled={exercise.isPlaying}
          >
            <Text style={styles.primaryButtonText}>
              {exercise.isPlaying ? "🎵 Listening..." : "🎵 Play Pattern"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // SING PHASE
  if (exercise.phase === PHASE.SING) {
    return (
      <View style={styles.container}>
        <PatternProgress />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {renderFocusCardMini()}

          <Text style={styles.phaseTitle}>Sing</Text>
          <Text style={styles.patternDisplay}>
            {currentPattern?.description}
          </Text>
          <Text style={styles.instruction}>
            Sing the pattern: {patternNotes.join(" → ")}
          </Text>

          {/* Show notation at top when open */}
          {localShowNotation && renderNotationToggle()}

          {exercise.isPlaying && <BeatIndicator />}

          {!exercise.singResult && !localShowNotation && (
            <View style={styles.volumeContainer}>
              <CircularVolumeIndicator volume={volume} size={100} />
              {isSounding && currentPitch?.noteName && (
                <Text style={styles.hearingText}>
                  Hearing: {currentPitch.noteName}
                </Text>
              )}
            </View>
          )}

          {exercise.singResult && (
            <View style={styles.resultContainer}>
              <Text
                style={[
                  styles.resultText,
                  exercise.singResult.success
                    ? styles.resultSuccess
                    : styles.resultFail,
                ]}
              >
                {exercise.singResult.success
                  ? "Great singing!"
                  : exercise.singResult.message}
              </Text>
            </View>
          )}

          {/* Show notation button at bottom when closed */}
          {!localShowNotation && renderNotationToggle()}
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          {exercise.singResult && !exercise.singResult.success ? (
            <>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  accessibilityLabel={
                    exercise.isPlaying ? "Listening" : "Play pattern again"
                  }
                  accessibilityRole="button"
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    exercise.isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => playPattern()}
                  disabled={exercise.isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>
                    {exercise.isPlaying ? "🎵 Listening..." : "🎵 Hear Again"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityLabel="Try singing again"
                  accessibilityRole="button"
                  style={[
                    styles.primaryButton,
                    { flex: 1 },
                    exercise.isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => {
                    handleTrySingAgain();
                    setTimeout(
                      () => playMetronomeOnly(handleDoneSinging, false),
                      100,
                    );
                  }}
                  disabled={exercise.isPlaying}
                >
                  <Text style={styles.primaryButtonText}>🎤 Try Again</Text>
                </TouchableOpacity>
              </View>
              {exercise.singAttempts >= 3 && (
                <TouchableOpacity
                  style={[styles.tertiaryButton, { marginTop: 8 }]}
                  onPress={() => {
                    exercise.openAttestModal("sing");
                  }}
                >
                  <Text style={styles.tertiaryButtonText}>
                    I sang it correctly →
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : exercise.singResult?.success ? (
            <>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    exercise.isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => playPattern()}
                  disabled={exercise.isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>
                    {exercise.isPlaying ? "🎵 Listening..." : "🎵 Hear Again"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    exercise.isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => {
                    handleTrySingAgain();
                    setTimeout(
                      () => playMetronomeOnly(handleDoneSinging, false),
                      100,
                    );
                  }}
                  disabled={exercise.isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>🎤 Sing Again</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 8 }]}
                onPress={goToNextPhase}
              >
                <Text style={styles.primaryButtonText}>Continue →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  exercise.isPlaying && styles.buttonDisabled,
                ]}
                onPress={() => playPattern()}
                disabled={exercise.isPlaying}
              >
                <Text style={styles.secondaryButtonText}>
                  {exercise.isPlaying ? "🎵 Listening..." : "🎵 Hear Again"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { marginTop: 8 },
                  exercise.isPlaying && styles.buttonDisabled,
                ]}
                onPress={() => playMetronomeOnly(handleDoneSinging, false)}
                disabled={exercise.isPlaying}
              >
                <Text style={styles.primaryButtonText}>
                  {exercise.isPlaying ? "🎤 Sing Now..." : "🎤 Start Singing"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        {attestationModal}
      </View>
    );
  }

  // IMAGINE PHASE
  if (exercise.phase === PHASE.IMAGINE) {
    return (
      <View style={styles.container}>
        <PatternProgress />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {renderFocusCardMini()}

          <Text style={styles.phaseTitle}>Imagine</Text>
          <Text style={styles.patternDisplay}>
            {currentPattern?.description}
          </Text>
          <Text style={styles.instruction}>
            Imagine playing this pattern on your instrument.{"\n"}
            Hear the sound in your mind: {patternNotes.join(" → ")}
          </Text>

          {/* Show notation at top when open */}
          {localShowNotation && renderNotationToggle()}

          {exercise.isPlaying && <BeatIndicator />}

          {!localShowNotation && (
            <View style={styles.imagineVisual}>
              <Text style={styles.imagineEmoji}>🎵</Text>
              <Text style={styles.imagineHint}>
                Hear your instrument: {patternNotes.join(" - ")}
              </Text>
            </View>
          )}

          {/* Show notation button at bottom when closed */}
          {!localShowNotation && renderNotationToggle()}
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              exercise.isPlaying && styles.buttonDisabled,
            ]}
            onPress={() => playMetronomeOnly(null, false)}
            disabled={exercise.isPlaying}
          >
            <Text style={styles.secondaryButtonText}>
              {exercise.isPlaying ? "🥁 Counting..." : "🥁 Count with Clicks"}
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

  // PLAY WITH DRONE PHASE
  if (exercise.phase === PHASE.PLAY_WITH_DRONE) {
    return (
      <View style={styles.container}>
        <PatternProgress />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {renderFocusCardMini()}

          <Text style={styles.phaseTitle}>Play with Drone</Text>
          <Text style={styles.patternDisplay}>
            {currentPattern?.description}
          </Text>
          <Text style={styles.instruction}>
            Play the pattern with the tonic drone for intonation support.{"\n"}
            {patternNotes.join(" → ")}
          </Text>

          {/* Show notation at top when open */}
          {localShowNotation && renderNotationToggle()}

          {droneActive && (
            <View style={styles.droneIndicator}>
              <Text style={styles.droneText}>
                🎵 Drone: {noteInfo.letter}
                {noteInfo.accidental}
              </Text>
            </View>
          )}

          {exercise.isPlaying && <BeatIndicator />}

          {/* Show notation button at bottom when closed */}
          {!localShowNotation && renderNotationToggle()}
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          {exercise.playResult ? (
            <>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    exercise.isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => {
                    exercise.setPlayResult(null);
                    setTimeout(
                      () => playMetronomeOnly(handleDonePlayingWithDrone, true),
                      100,
                    );
                  }}
                  disabled={exercise.isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>
                    🎵 Again with Drone
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    exercise.isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => playPattern()}
                  disabled={exercise.isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>🎵 Hear Again</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 8 }]}
                onPress={() => {
                  exercise.setPlayResult(null);
                  goToNextPhase();
                }}
              >
                <Text style={styles.primaryButtonText}>🎺 Play Alone →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                exercise.isPlaying && styles.buttonDisabled,
              ]}
              onPress={() =>
                playMetronomeOnly(handleDonePlayingWithDrone, true)
              }
              disabled={exercise.isPlaying}
            >
              <Text style={styles.primaryButtonText}>
                {exercise.isPlaying ? "🎺 Play Now..." : "🎺 Start with Drone"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // PLAY PHASE (without drone)
  if (exercise.phase === PHASE.PLAY) {
    return (
      <View style={styles.container}>
        <PatternProgress />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {renderFocusCardMini()}

          <Text style={styles.phaseTitle}>Play</Text>
          <Text style={styles.patternDisplay}>
            {currentPattern?.description}
          </Text>
          <Text style={styles.instruction}>
            Now play without the drone - full independence!{"\n"}
            {patternNotes.join(" → ")}
          </Text>

          {/* Show notation at top when open */}
          {localShowNotation && renderNotationToggle()}

          {exercise.isPlaying && <BeatIndicator />}

          {!exercise.playResult && !localShowNotation && (
            <View style={styles.volumeContainer}>
              <CircularVolumeIndicator volume={volume} size={100} />
              {isSounding && currentPitch?.noteName && (
                <Text style={styles.hearingText}>
                  Hearing: {currentPitch.noteName}
                </Text>
              )}
            </View>
          )}

          {exercise.playResult && (
            <View style={styles.resultContainer}>
              <Text
                style={[
                  styles.resultText,
                  exercise.playResult.success
                    ? styles.resultSuccess
                    : styles.resultFail,
                ]}
              >
                {exercise.playResult.success
                  ? "Excellent!"
                  : exercise.playResult.message}
              </Text>
            </View>
          )}

          {/* Show notation button at bottom when closed */}
          {!localShowNotation && renderNotationToggle()}
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          {exercise.playResult && !exercise.playResult.success ? (
            <>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    exercise.isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => playPattern()}
                  disabled={exercise.isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>
                    {exercise.isPlaying ? "🎵 Listening..." : "🎵 Hear Again"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { flex: 1 },
                    exercise.isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => {
                    handleTryPlayAgain();
                    setTimeout(
                      () => playMetronomeOnly(handleDonePlaying, false),
                      100,
                    );
                  }}
                  disabled={exercise.isPlaying}
                >
                  <Text style={styles.primaryButtonText}>🎵 Try Again</Text>
                </TouchableOpacity>
              </View>
              {exercise.playAttempts >= 3 && (
                <TouchableOpacity
                  style={[styles.tertiaryButton, { marginTop: 8 }]}
                  onPress={() => {
                    exercise.openAttestModal("play");
                  }}
                >
                  <Text style={styles.tertiaryButtonText}>
                    I played it correctly →
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : exercise.playResult?.success ? (
            <>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    exercise.isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => playPattern()}
                  disabled={exercise.isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>
                    {exercise.isPlaying ? "🎵 Listening..." : "🎵 Hear Again"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    exercise.isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => {
                    handleTryPlayAgain();
                    setTimeout(
                      () => playMetronomeOnly(handleDonePlaying, false),
                      100,
                    );
                  }}
                  disabled={exercise.isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>🎵 Play Again</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 8 }]}
                onPress={goToNextPhase}
              >
                <Text style={styles.primaryButtonText}>Continue →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  exercise.isPlaying && styles.buttonDisabled,
                ]}
                onPress={() => playPattern()}
                disabled={exercise.isPlaying}
              >
                <Text style={styles.secondaryButtonText}>
                  {exercise.isPlaying ? "🎵 Listening..." : "🎵 Hear Again"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { marginTop: 8 },
                  exercise.isPlaying && styles.buttonDisabled,
                ]}
                onPress={() => playMetronomeOnly(handleDonePlaying, false)}
                disabled={exercise.isPlaying}
              >
                <Text style={styles.primaryButtonText}>
                  {exercise.isPlaying ? "🎺 Play Now..." : "🎺 Start Playing"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        {attestationModal}
      </View>
    );
  }

  // SUCCESS / ALL COMPLETE - check this BEFORE FEEDBACK so it takes priority
  if (exercise.showSuccess) {
    return (
      <View style={styles.container}>
        <PatternProgress />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.successContainer}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successTitle}>All Patterns Complete!</Text>
            <Text style={styles.successText}>
              You've successfully played all 4 fragment patterns.
            </Text>
            <Text style={styles.successSubtext}>
              Tap any pattern above to practice again.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              onComplete?.({
                success: true,
                capability: "diatonic_scale_fragment_2",
                key: sessionStartingNote, // Report the session's starting note for multi-key tracking
              })
            }
          >
            <Text style={styles.primaryButtonText}>Complete Lesson →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // FEEDBACK PHASE
  if (exercise.phase === PHASE.FEEDBACK) {
    // Count completed patterns, adding 1 for current only if not already completed
    const patternsComplete = completedPatterns[currentPatternId]
      ? Object.keys(completedPatterns).length
      : Object.keys(completedPatterns).length + 1;
    const totalPatterns = PATTERN_ORDER.length;

    return (
      <View style={styles.container}>
        <PatternProgress />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackEmoji}>✅</Text>
            <Text style={styles.feedbackTitle}>Pattern Complete!</Text>
            <Text style={styles.feedbackPattern}>{currentPattern?.name}</Text>
            <Text style={styles.feedbackDescription}>
              {currentPattern?.description}
            </Text>

            <View style={styles.progressSummary}>
              <Text style={styles.progressText}>
                {patternsComplete} of {totalPatterns} patterns completed
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={goToNextPhase}
          >
            <Text style={styles.primaryButtonText}>
              {patternsComplete >= totalPatterns
                ? "Finish →"
                : "Next Pattern →"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}
