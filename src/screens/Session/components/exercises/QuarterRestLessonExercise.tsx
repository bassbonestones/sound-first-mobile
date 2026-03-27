/**
 * QuarterRestLessonExercise - Refactored to use shared hooks
 *
 * Uses:
 * - useLessonExerciseState for phase/UI state management
 * - useRestLessonAudio for audio playback and performance tracking
 *
 * Flow: Focus Card → Listen → Sing → Imagine → Play → Feedback
 * Key concepts:
 * - A quarter rest = 1 beat of silence
 * - Has a distinctive squiggly shape
 * - Exercise: alternating quarter notes and quarter rests for 8 beats
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
  generateQuarterRestPatternMusicXML,
  QUARTER_REST_CONFIG,
  QUARTER_REST_BEATS,
  QUARTER_REST_AUDIO_THRESHOLDS,
} from "./configs/quarterRestConfig";
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

export default function QuarterRestLessonExercise({
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
    QUARTER_REST_CONFIG.defaultTempo;
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
    () => generateQuarterRestPatternMusicXML(userFirstNote, clef),
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
        name: "Quarter Rest",
        description: "A quarter rest = 1 beat of silence.",
        cue: "It has a squiggly, zigzag shape (lightning bolt).",
      },
    ],
  });

  // ---------------------------------------------------------------------------
  // Audio Hook (replaces custom audio state)
  // ---------------------------------------------------------------------------
  const audioConfig = useMemo(
    () => ({
      beats: QUARTER_REST_BEATS,
      bpm,
      targetFrequency,
      beatsPerNote: QUARTER_REST_CONFIG.beatsPerNote,
      hasSubdivision: QUARTER_REST_CONFIG.hasSubdivision,
      thresholds: QUARTER_REST_AUDIO_THRESHOLDS,
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

  const { isPlaying, currentBeat, currentMeasure, isSubdivision } =
    playbackState;

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
  // Custom Performance Analysis (QuarterRest-specific messages)
  // Uses hook's performanceRefs but provides exercise-specific feedback
  // ---------------------------------------------------------------------------
  const analyzeQuarterRestPerformance = useCallback(() => {
    const totalCount = performanceRefs.totalSoundingCount.current;
    const pitchCount = performanceRefs.onPitchCount.current;
    const hitTarget = performanceRefs.hasHitTargetPitch.current;
    const beatSoundPct = performanceRefs.soundingOnBeats.current;
    const startedEarly = performanceRefs.startedEarly.current;

    const SUSTAIN_THRESHOLD = 0.4; // Quarter notes - need to be sounding on note beats
    const SILENCE_THRESHOLD = 0.5; // More forgiving - allow some spillover on rest beats

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

    // Odd beats (beat 1,3,5,7) should have sound
    // Even beats (beat 2,4,6,8) should be silent (rests)
    const noteBeatsOk =
      (beatSoundPct[1] ?? 0) >= SUSTAIN_THRESHOLD &&
      (beatSoundPct[3] ?? 0) >= SUSTAIN_THRESHOLD &&
      (beatSoundPct[5] ?? 0) >= SUSTAIN_THRESHOLD &&
      (beatSoundPct[7] ?? 0) >= SUSTAIN_THRESHOLD;

    const restBeatsOk =
      (beatSoundPct[2] ?? 0) < SILENCE_THRESHOLD &&
      (beatSoundPct[4] ?? 0) < SILENCE_THRESHOLD &&
      (beatSoundPct[6] ?? 0) < SILENCE_THRESHOLD &&
      (beatSoundPct[8] ?? 0) < SILENCE_THRESHOLD;

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
      const result = analyzeQuarterRestPerformance();
      exercise.setSingResult(result);
      if (!result.success) {
        exercise.incrementSingAttempts();
      } else {
        exercise.resetSingAttempts();
      }
    });
  }, [
    playMetronomeOnly,
    analyzeQuarterRestPerformance,
    exercise,
    resetTracking,
  ]);

  const handleTrySingAgain = useCallback(() => {
    exercise.setSingResult(null);
    resetTracking();
    setTimeout(() => handleStartSing(), 100);
  }, [exercise, resetTracking, handleStartSing]);

  const handleDoneImagining = useCallback(() => {
    stopPlayback();
    resetTracking();
    exercise.setPhase(PHASE.PLAY);
  }, [stopPlayback, resetTracking, exercise]);

  const handleStartPlay = useCallback(() => {
    resetTracking();
    playMetronomeOnly(() => {
      const result = analyzeQuarterRestPerformance();
      exercise.setPlayResult(result);
      if (!result.success) {
        exercise.incrementPlayAttempts();
      } else {
        exercise.resetPlayAttempts();
      }
    });
  }, [
    playMetronomeOnly,
    analyzeQuarterRestPerformance,
    exercise,
    resetTracking,
  ]);

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
    if (!exercise.showNotation || currentBeat < 1 || currentBeat > 8)
      return null;
    return currentBeat - 1; // 0-indexed
  }, [exercise.showNotation, currentBeat]);

  // Scroll to top when notation is opened
  const handleShowNotation = useCallback(() => {
    exercise.setShowNotation(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  }, [exercise]);

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

  // FOCUS CARD PHASE
  if (exercise.phase === PHASE.FOCUS_CARD) {
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
            Listen to: note-rest-note-rest (repeat).{"\n"}
            Each beat alternates between sound and silence.
          </Text>

          {/* Show notation at top when open */}
          {exercise.showNotation && renderNotationToggle()}

          {isPlaying && <BeatIndicator />}

          {/* Show notation button at bottom when closed */}
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
                {isPlaying ? "🎵 Listening..." : "🎵 Hear the Pattern"}
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
                accessibilityLabel="Replay audio"
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
            Sing: note (1) - rest (2) - note (3) - rest (4).{"\n"}
            Be silent on the even beats!
          </Text>

          {/* Show notation at top when open */}
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

          {/* Show notation button at bottom when closed */}
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
                  accessibilityLabel="Attest that I did it correctly"
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
                  accessibilityLabel="Replay audio"
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
                accessibilityLabel="Continue to imagine phase"
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
            Imagine playing: note-rest-note-rest.{"\n"}
            Feel the alternating sound and silence.
          </Text>

          {/* Show notation at top when open */}
          {exercise.showNotation && renderNotationToggle()}

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
            Play: note (1) - rest (2) - note (3) - rest (4).{"\n"}
            Two measures of alternating pattern.
          </Text>

          {/* Show notation at top when open */}
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

          {/* Show notation button at bottom when closed */}
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
                  accessibilityLabel="Attest that I did it correctly"
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
                  accessibilityLabel="Replay audio"
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
                onPress={handleFeedbackContinue}
                accessibilityLabel="Continue to next step"
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
                {isPlaying ? "🎵 Play Now..." : "🎵 Start Playing"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {attestationModal}
      </View>
    );
  }

  // SUCCESS screen - shown when mastery achieved
  if (exercise.showSuccess) {
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

  // FEEDBACK PHASE
  if (exercise.phase === PHASE.FEEDBACK) {
    const overallSuccess =
      exercise.singResult?.success && exercise.playResult?.success;

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
                  exercise.singResult?.success
                    ? styles.resultSuccess
                    : styles.resultFail
                }
              >
                {exercise.singResult?.success ? "✓" : "✗"}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Play:</Text>
              <Text
                style={
                  exercise.playResult?.success
                    ? styles.resultSuccess
                    : styles.resultFail
                }
              >
                {exercise.playResult?.success ? "✓" : "✗"}
              </Text>
            </View>
          </View>

          <Text style={styles.progressText}>
            Progress: {exercise.successfulRounds} / {masteryStreak}
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
            onPress={() => {
              exercise.resetForNewRound();
              exercise.setPhase(PHASE.LISTEN);
            }}
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
