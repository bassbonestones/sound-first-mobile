/**
 * WholeRestLessonExercise - Refactored to use shared hooks
 *
 * Uses:
 * - useLessonExerciseState for phase/UI state management
 * - useRestLessonAudio for audio playback and performance analysis
 *
 * Flow: Focus Card → Listen → Sing → Imagine → Play → Feedback
 * Key concepts:
 * - A whole rest lasts 4 beats (just like a whole note)
 * - It sits BELOW the middle line because it's "heavy"
 * - Exercise: whole note (4 beats) → whole rest (4 beats silence) → whole note (4 beats)
 */
import React, { useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from "react-native";
import { usePitchDetection } from "../../../../hooks/usePitchDetection";
import { CircularVolumeIndicator } from "../../../../components/VolumeBar";
import {
  parseNoteName,
  noteToMidi,
  noteToFrequency,
  LESSON_PHASES as PHASE,
  PITCH_DETECTION_OPTIONS,
} from "./shared";
import { useRestLessonAudio } from "./shared/useRestLessonAudio";
import type { ExerciseProps } from "./shared";
import { useLessonExerciseState } from "./shared/useLessonExerciseState";
import {
  generateWholeRestPatternMusicXML,
  WHOLE_REST_CONFIG,
  WHOLE_REST_BEATS,
  WHOLE_REST_AUDIO_THRESHOLDS,
} from "./configs/wholeRestConfig";
import { devWarn } from "../../../../utils/devLogger";

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

export default function WholeRestLessonExercise({
  config = {},
  mastery,
  onComplete,
  onProgress,
  userFirstNote = "F3",
}: ExerciseProps): React.JSX.Element {
  // ---------------------------------------------------------------------------
  // Config
  // ---------------------------------------------------------------------------
  const bpm =
    ((config as Record<string, unknown>)?.bpm as number) ??
    WHOLE_REST_CONFIG.defaultTempo;
  const masteryStreak =
    ((mastery as Record<string, unknown>)?.correct_streak as number) ?? 3;
  const clef =
    ((config as Record<string, unknown>)?.clef as "treble" | "bass") ??
    "treble";

  // ---------------------------------------------------------------------------
  // Note Info
  // ---------------------------------------------------------------------------
  const noteInfo = useMemo(() => {
    const parsed = parseNoteName(userFirstNote);
    return parsed ?? { letter: "F", accidental: "", octave: 3 };
  }, [userFirstNote]);

  const targetMidi = useMemo(() => noteToMidi(userFirstNote), [userFirstNote]);

  const targetFrequency = useMemo(
    () => noteToFrequency(userFirstNote),
    [userFirstNote],
  );

  // Generate MusicXML
  const musicXML = useMemo(
    () => generateWholeRestPatternMusicXML(userFirstNote, clef),
    [userFirstNote, clef],
  );

  // ---------------------------------------------------------------------------
  // State Hook
  // ---------------------------------------------------------------------------
  const exercise = useLessonExerciseState({
    masteryStreak,
    focusCards: [
      {
        category: "rhythm",
        name: "Whole Rest",
        description: "A whole rest lasts for 4 beats of silence.",
        cue: "The rest hangs BELOW the line because it's heavy.",
      },
    ],
  });

  // ---------------------------------------------------------------------------
  // Audio Hook (replaces custom audio state)
  // ---------------------------------------------------------------------------
  const audioConfig = useMemo(
    () => ({
      beats: WHOLE_REST_BEATS,
      bpm,
      targetFrequency,
      beatsPerNote: WHOLE_REST_CONFIG.beatsPerNote,
      hasSubdivision: WHOLE_REST_CONFIG.hasSubdivision,
      thresholds: WHOLE_REST_AUDIO_THRESHOLDS,
    }),
    [bpm, targetFrequency],
  );

  const {
    playbackState,
    performanceRefs,
    playPattern,
    playMetronomeOnly,
    stopPlayback,
    resetTracking,
  } = useRestLessonAudio(audioConfig);

  const { isPlaying, currentBeat, currentMeasure } = playbackState;

  const scrollViewRef = useRef<ScrollView>(null);

  // ---------------------------------------------------------------------------
  // Pitch Detection
  // ---------------------------------------------------------------------------
  const isPitchActive =
    (exercise.phase === PHASE.SING && !exercise.singResult) ||
    (exercise.phase === PHASE.PLAY && !exercise.playResult);

  const { currentPitch, volume, isSounding } = usePitchDetection({
    enabled: isPitchActive,
    ...PITCH_DETECTION_OPTIONS,
  });

  // Keep performance refs in sync with isSounding for interval callbacks
  useEffect(() => {
    performanceRefs.isSounding.current = isSounding;
  }, [isSounding, performanceRefs.isSounding]);

  // Track pitch accuracy during sing/play
  useEffect(() => {
    if (!isSounding || !currentPitch?.noteName || !isPitchActive) return;

    const detectedMidi = noteToMidi(currentPitch.noteName);
    if (detectedMidi === null) return;

    const pitchDiff = Math.abs(detectedMidi - targetMidi);
    const isOnPitch =
      exercise.phase === PHASE.SING
        ? pitchDiff % 12 <= 1 || pitchDiff % 12 >= 11
        : pitchDiff <= 1;

    performanceRefs.totalSoundingCount.current += 1;
    if (isOnPitch) {
      performanceRefs.hasHitTargetPitch.current = true;
      performanceRefs.onPitchCount.current += 1;
    }
  }, [
    currentPitch?.noteName,
    isSounding,
    isPitchActive,
    targetMidi,
    exercise.phase,
    performanceRefs,
  ]);

  // Reset tracking when phase changes
  useEffect(() => {
    resetTracking();
    exercise.setShowNotation(false);
  }, [exercise.phase, resetTracking]);

  // Detected note name for display
  const detectedNoteName = useMemo(() => {
    if (!currentPitch?.noteName || !isSounding) return null;
    return currentPitch.noteName;
  }, [currentPitch?.noteName, isSounding]);

  // ---------------------------------------------------------------------------
  // Custom Performance Analysis (WholeRest-specific messages)
  // Uses hook's performanceRefs but provides exercise-specific feedback
  // ---------------------------------------------------------------------------
  const analyzeWholeRestPerformance = useCallback(() => {
    const totalCount = performanceRefs.totalSoundingCount.current;
    const pitchCount = performanceRefs.onPitchCount.current;
    const hitTarget = performanceRefs.hasHitTargetPitch.current;
    const beatSoundPct = performanceRefs.soundingOnBeats.current;
    const startedEarly = performanceRefs.startedEarly.current;

    const SUSTAIN_THRESHOLD = 0.75;
    const STOP_THRESHOLD = 0.75;
    const SILENCE_THRESHOLD = 0.25;

    // Beat mapping (1-indexed in soundingOnBeats):
    // Beats 1-4: First whole note - should sound
    // Beats 5-8: Whole rest - should NOT sound
    // Beats 9-12: Second whole note - should sound
    // Beat 13: End marker

    const firstNoteBeats = [
      beatSoundPct[1],
      beatSoundPct[2],
      beatSoundPct[3],
      beatSoundPct[4],
    ];
    const firstNoteStarted = (firstNoteBeats[0] ?? 0) >= SUSTAIN_THRESHOLD;
    const firstNoteSustained = firstNoteBeats.filter(
      (pct) => (pct ?? 0) >= SUSTAIN_THRESHOLD,
    ).length;

    const restBeats = [
      beatSoundPct[5],
      beatSoundPct[6],
      beatSoundPct[7],
      beatSoundPct[8],
    ];
    const restSilent = restBeats.filter(
      (pct) => (pct ?? 0) < SILENCE_THRESHOLD,
    ).length;
    const restOk = restSilent >= 3;

    const secondNoteBeats = [
      beatSoundPct[9],
      beatSoundPct[10],
      beatSoundPct[11],
      beatSoundPct[12],
    ];
    const secondNoteStarted = (secondNoteBeats[0] ?? 0) >= SUSTAIN_THRESHOLD;
    const secondNoteSustained = secondNoteBeats.filter(
      (pct) => (pct ?? 0) >= SUSTAIN_THRESHOLD,
    ).length;

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

    const firstNoteOk = firstNoteStarted && firstNoteSustained === 4;
    const secondNoteOk = secondNoteStarted && secondNoteSustained === 4;
    const rhythmOk = !startedEarly && firstNoteOk && restOk && secondNoteOk;

    const success = pitchOk && rhythmOk;

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
      message = "First note too short - hold for all 4 beats";
    } else if (!restOk) {
      message = "Stay silent during the REST (4 beats of silence)";
    } else if (!secondNoteStarted) {
      message = "Start the second note right on beat 9";
    } else if (secondNoteSustained < 4) {
      message = "Second note too short - hold for all 4 beats";
    }

    return { success, pitchOk, rhythmOk, message };
  }, [performanceRefs]);

  // ---------------------------------------------------------------------------
  // Handlers (audio playback provided by useRestLessonAudio hook)
  // ---------------------------------------------------------------------------
  const handlePlayPattern = useCallback(() => {
    playPattern(() => {
      exercise.setHasHeardPattern(true);
    });
  }, [playPattern, exercise]);

  const handleStartSing = useCallback(() => {
    resetTracking();
    playMetronomeOnly(() => {
      const result = analyzeWholeRestPerformance();
      exercise.setSingResult(result);
      if (!result.success) {
        exercise.incrementSingAttempts();
      } else {
        exercise.resetSingAttempts();
      }
    });
  }, [playMetronomeOnly, analyzeWholeRestPerformance, exercise, resetTracking]);

  const handleTrySingAgain = useCallback(() => {
    exercise.setSingResult(null);
    resetTracking();
    setTimeout(() => handleStartSing(), 100);
  }, [exercise, resetTracking, handleStartSing]);

  const handleStartPlay = useCallback(() => {
    resetTracking();
    playMetronomeOnly(() => {
      const result = analyzeWholeRestPerformance();
      exercise.setPlayResult(result);
      if (!result.success) {
        exercise.incrementPlayAttempts();
      } else {
        exercise.resetPlayAttempts();
      }
    });
  }, [playMetronomeOnly, analyzeWholeRestPerformance, exercise, resetTracking]);

  const handleTryPlayAgain = useCallback(() => {
    exercise.setPlayResult(null);
    resetTracking();
    setTimeout(() => handleStartPlay(), 100);
  }, [exercise, resetTracking, handleStartPlay]);

  const handleFeedbackContinue = useCallback(() => {
    exercise.incrementSuccessfulRounds();
    if (exercise.successfulRounds + 1 >= masteryStreak) {
      exercise.setShowSuccess(true);
    } else {
      exercise.resetForNewRound();
      exercise.setPhase(PHASE.LISTEN);
    }
  }, [exercise, masteryStreak]);

  // Progress reporting
  useEffect(() => {
    onProgress?.({
      streak: exercise.successfulRounds,
      masteryRequired: masteryStreak,
    });
  }, [exercise.successfulRounds, masteryStreak, onProgress]);

  // ---------------------------------------------------------------------------
  // Scroll to top when notation opens
  // ---------------------------------------------------------------------------
  const handleShowNotation = useCallback(() => {
    exercise.setShowNotation(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  }, [exercise]);

  // ---------------------------------------------------------------------------
  // Memoized Notation
  // ---------------------------------------------------------------------------
  const memoizedNotation = useMemo(() => {
    if (!NotationDisplay || !musicXML) return null;
    return (
      <NotationDisplay
        musicxml={musicXML}
        width={360}
        height={180}
        showTimeSignature={true}
      />
    );
  }, [musicXML]);

  // Cursor position for highlighting (3 notes/rests across 3 measures)
  const cursorNoteIndex = useMemo(() => {
    if (!exercise.showNotation || currentBeat < 1 || currentBeat > 12)
      return null;
    return Math.floor((currentBeat - 1) / 4);
  }, [exercise.showNotation, currentBeat]);

  // ---------------------------------------------------------------------------
  // Notation Toggle Renderer
  // ---------------------------------------------------------------------------
  const renderNotationToggle = () => {
    if (!NotationDisplay) return null;

    const notePositions = [95, 210, 290];
    const highlightLeft =
      cursorNoteIndex !== null ? notePositions[cursorNoteIndex] : null;
    const highlightWidth = 60;

    return (
      <View style={styles.notationContainer}>
        {!exercise.showNotation ? (
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
              {highlightLeft !== null && (
                <View
                  style={[
                    styles.highlightOverlay,
                    { left: highlightLeft, width: highlightWidth, height: 100 },
                  ]}
                />
              )}
            </View>
            <TouchableOpacity
              style={styles.hideNotationButton}
              onPress={() => exercise.setShowNotation(false)}
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

  // ---------------------------------------------------------------------------
  // Focus Card Mini Renderer
  // ---------------------------------------------------------------------------
  const renderFocusCardMini = () => (
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

  // ---------------------------------------------------------------------------
  // Beat Indicator (3 measures: note → rest → note + end marker)
  // ---------------------------------------------------------------------------
  const BeatIndicator = () => {
    const getDisplayBeat = (beat: number) => {
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

  // ---------------------------------------------------------------------------
  // Attestation Modal
  // ---------------------------------------------------------------------------
  const attestationModal = useMemo(
    () => (
      <Modal
        visible={exercise.showAttestModal}
        transparent={true}
        animationType="fade"
        onRequestClose={exercise.closeAttestModal}
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
                style={styles.modalCancelButton}
                onPress={exercise.closeAttestModal}
                accessibilityLabel="Cancel"
                accessibilityRole="button"
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={exercise.confirmAttestation}
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
    [
      exercise.showAttestModal,
      exercise.attestPhase,
      exercise.closeAttestModal,
      exercise.confirmAttestation,
    ],
  );

  // ===========================================================================
  // PHASE RENDERS
  // ===========================================================================

  // FOCUS CARD PHASE
  if (exercise.phase === PHASE.FOCUS_CARD) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.focusCard}>
            <Text style={styles.focusCardTitle}>Whole Rest</Text>
            <View style={styles.wholeRestSymbol}>
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
            onPress={() => exercise.setPhase(PHASE.LISTEN)}
            accessibilityLabel="Begin exercise"
            accessibilityRole="button"
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

          {exercise.showNotation && renderNotationToggle()}

          {isPlaying && <BeatIndicator />}

          {!exercise.showNotation && renderNotationToggle()}
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          {!exercise.hasHeardPattern ? (
            <TouchableOpacity
              style={[styles.primaryButton, isPlaying && styles.buttonDisabled]}
              onPress={handlePlayPattern}
              disabled={isPlaying}
              accessibilityLabel="Hear the pattern"
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>
                {isPlaying ? "🎵 Listening..." : "🎵 Play Pattern"}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  isPlaying && styles.buttonDisabled,
                ]}
                onPress={() => playPattern()}
                disabled={isPlaying}
                accessibilityLabel="Hear pattern again"
                accessibilityRole="button"
              >
                <Text style={styles.secondaryButtonText}>
                  {isPlaying ? "🎵 Listening..." : "🎵 Hear Again"}
                </Text>
              </TouchableOpacity>
              {!isPlaying && (
                <TouchableOpacity
                  style={[styles.primaryButton, { marginTop: 8 }]}
                  onPress={() => {
                    stopPlayback();
                    exercise.setPhase(PHASE.SING);
                  }}
                  accessibilityLabel="Continue to singing"
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
  if (exercise.phase === PHASE.SING) {
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

          {exercise.showNotation && renderNotationToggle()}

          {isPlaying && <BeatIndicator />}

          {!exercise.singResult && (
            <View style={styles.volumeContainer}>
              <CircularVolumeIndicator volume={volume} size={120} />
              {isSounding && detectedNoteName && (
                <Text style={styles.hearingText}>
                  Hearing: {detectedNoteName}
                </Text>
              )}
            </View>
          )}

          {exercise.singResult && (
            <Text
              style={
                exercise.singResult.success
                  ? styles.successText
                  : styles.feedbackError
              }
            >
              {exercise.singResult.success
                ? "✓ Great!"
                : exercise.singResult.message}
            </Text>
          )}

          {!exercise.showNotation && renderNotationToggle()}
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          {exercise.singResult && !exercise.singResult.success ? (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleTrySingAgain}
                accessibilityLabel="Try again"
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
              {exercise.singAttempts >= 3 && (
                <TouchableOpacity
                  style={[styles.tertiaryButton, { marginTop: 8 }]}
                  onPress={() => exercise.openAttestModal("sing")}
                  accessibilityLabel="Attest correct performance"
                  accessibilityRole="button"
                >
                  <Text style={styles.tertiaryButtonText}>
                    I did it correctly →
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
                    isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => playPattern()}
                  disabled={isPlaying}
                  accessibilityLabel="Hear pattern again"
                  accessibilityRole="button"
                >
                  <Text style={styles.secondaryButtonText}>
                    {isPlaying ? "🎵 Listening..." : "🎵 Hear Again"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={handleTrySingAgain}
                  disabled={isPlaying}
                  accessibilityLabel="Sing again"
                  accessibilityRole="button"
                >
                  <Text style={styles.secondaryButtonText}>🎤 Sing Again</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 8 }]}
                onPress={() => exercise.setPhase(PHASE.IMAGINE)}
                accessibilityLabel="Continue to imagining"
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>Continue →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, isPlaying && styles.buttonDisabled]}
              onPress={handleStartSing}
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
  if (exercise.phase === PHASE.IMAGINE) {
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

          {exercise.showNotation && renderNotationToggle()}

          {isPlaying && <BeatIndicator />}

          <View style={styles.imagineVisual}>
            <Text style={styles.imagineEmoji}>🎵 🤫 🎵</Text>
            <Text style={styles.imagineHint}>Note → Silence → Note</Text>
          </View>

          {!exercise.showNotation && renderNotationToggle()}
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            style={[styles.secondaryButton, isPlaying && styles.buttonDisabled]}
            onPress={() => playMetronomeOnly()}
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
            onPress={() => {
              stopPlayback();
              resetTracking();
              exercise.setPhase(PHASE.PLAY);
            }}
            accessibilityLabel="Continue after imagining"
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>I Imagined It →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // PLAY PHASE
  if (exercise.phase === PHASE.PLAY) {
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

          {exercise.showNotation && renderNotationToggle()}

          {isPlaying && <BeatIndicator />}

          {!exercise.playResult && (
            <View style={styles.volumeContainer}>
              <CircularVolumeIndicator volume={volume} size={120} />
              {isSounding && detectedNoteName && (
                <Text style={styles.hearingText}>
                  Hearing: {detectedNoteName}
                </Text>
              )}
            </View>
          )}

          {exercise.playResult && (
            <Text
              style={
                exercise.playResult.success
                  ? styles.successText
                  : styles.feedbackError
              }
            >
              {exercise.playResult.success
                ? "✓ Great!"
                : exercise.playResult.message}
            </Text>
          )}

          {!exercise.showNotation && renderNotationToggle()}
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          {exercise.playResult && !exercise.playResult.success ? (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleTryPlayAgain}
                accessibilityLabel="Try again"
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
              {exercise.playAttempts >= 3 && (
                <TouchableOpacity
                  style={[styles.tertiaryButton, { marginTop: 8 }]}
                  onPress={() => exercise.openAttestModal("play")}
                  accessibilityLabel="Attest correct performance"
                  accessibilityRole="button"
                >
                  <Text style={styles.tertiaryButtonText}>
                    I did it correctly →
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
                    isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => playPattern()}
                  disabled={isPlaying}
                  accessibilityLabel="Hear pattern again"
                  accessibilityRole="button"
                >
                  <Text style={styles.secondaryButtonText}>
                    {isPlaying ? "🎵 Listening..." : "🎵 Hear Again"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={handleTryPlayAgain}
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
                  if (exercise.successfulRounds + 1 >= masteryStreak) {
                    exercise.setShowSuccess(true);
                    setTimeout(() => {
                      onComplete?.({
                        success: true,
                        streak: exercise.successfulRounds + 1,
                        totalAttempts: exercise.successfulRounds + 1,
                        correctCount: exercise.successfulRounds + 1,
                      });
                    }, 1500);
                  } else {
                    exercise.incrementSuccessfulRounds();
                    exercise.setPhase(PHASE.FEEDBACK);
                  }
                }}
                accessibilityLabel="Continue"
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>Continue →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, isPlaying && styles.buttonDisabled]}
              onPress={handleStartPlay}
              disabled={isPlaying}
              accessibilityLabel="Start playing"
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>
                {isPlaying ? "🎺 Play Now..." : "🎺 Start Playing"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {attestationModal}
      </View>
    );
  }

  // FEEDBACK PHASE
  if (exercise.phase === PHASE.FEEDBACK) {
    if (exercise.showSuccess) {
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
          {renderFocusCardMini()}

          <Text style={styles.phaseTitle}>Nice Work!</Text>
          <Text style={styles.instruction}>
            Round {exercise.successfulRounds} of {masteryStreak} complete!
          </Text>

          <View style={styles.progressDots}>
            {Array.from({ length: masteryStreak }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i < exercise.successfulRounds && styles.progressDotComplete,
                ]}
              />
            ))}
          </View>

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
            onPress={handleFeedbackContinue}
            accessibilityLabel="Continue to next round"
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Next Round →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Fallback
  return (
    <View style={styles.container}>
      <Text style={styles.phaseTitle}>Unknown Phase</Text>
    </View>
  );
}

// ===========================================================================
// STYLES
// ===========================================================================
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
    paddingBottom: 100,
  },
  fixedBottomButtons: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
    backgroundColor: "#1a1410",
    borderTopWidth: 1,
    borderTopColor: "#3b2c1a",
  },

  // Focus Card
  focusCard: {
    backgroundColor: "#2d241a",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3b2c1a",
    marginBottom: 20,
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
    top: "50%",
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
  notationWrapperRelative: {
    position: "relative",
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
  highlightOverlay: {
    position: "absolute",
    top: 30,
    backgroundColor: "rgba(76, 175, 80, 0.25)",
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "rgba(76, 175, 80, 0.6)",
    pointerEvents: "none",
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

  // Progress dots
  progressDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 24,
  },
  progressDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  progressDotComplete: {
    backgroundColor: "#4CAF50",
  },

  // Buttons
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
  buttonRow: {
    flexDirection: "row",
    gap: 8,
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
