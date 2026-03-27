/**
 * HalfRestLessonExercise - Refactored to use shared hooks
 *
 * Uses:
 * - useLessonExerciseState for phase/UI state management
 * - useRestLessonAudio for audio playback and performance tracking
 *
 * Flow: Focus Card → Listen → Sing → Imagine → Play → Feedback
 * Key concepts:
 * - A half rest = 2 beats of silence
 * - Sits ON TOP of the middle line (like a hat)
 * - Mnemonic: "Half rest HAT sits on top" vs "Whole rest HOLE hangs below"
 * - Exercise: half note → half rest → half note (2 measures)
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
  generateHalfRestPatternMusicXML,
  HALF_REST_CONFIG,
  HALF_REST_BEATS,
  HALF_REST_AUDIO_THRESHOLDS,
} from "./configs/halfRestConfig";
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

export default function HalfRestLessonExercise({
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
    HALF_REST_CONFIG.defaultTempo;
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
    () => generateHalfRestPatternMusicXML(userFirstNote, clef),
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
        name: "Half Rest",
        description: "A half rest = 2 beats of silence.",
        cue: 'It sits ON TOP of the line like a "hat."',
      },
    ],
  });

  // ---------------------------------------------------------------------------
  // Audio Hook (replaces custom audio state)
  // ---------------------------------------------------------------------------
  const audioConfig = useMemo(
    () => ({
      beats: HALF_REST_BEATS,
      bpm,
      targetFrequency,
      beatsPerNote: HALF_REST_CONFIG.beatsPerNote,
      hasSubdivision: HALF_REST_CONFIG.hasSubdivision,
      thresholds: HALF_REST_AUDIO_THRESHOLDS,
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
  // Custom Performance Analysis (HalfRest-specific messages)
  // Uses hook's performanceRefs but provides exercise-specific feedback
  // ---------------------------------------------------------------------------
  const analyzeHalfRestPerformance = useCallback(() => {
    const totalCount = performanceRefs.totalSoundingCount.current;
    const pitchCount = performanceRefs.onPitchCount.current;
    const hitTarget = performanceRefs.hasHitTargetPitch.current;
    const beatSoundPct = performanceRefs.soundingOnBeats.current;
    const startedEarly = performanceRefs.startedEarly.current;

    const SUSTAIN_THRESHOLD = HALF_REST_AUDIO_THRESHOLDS.sustainThreshold;
    const SILENCE_THRESHOLD = HALF_REST_AUDIO_THRESHOLDS.silenceThreshold;

    if (totalCount === 0) {
      return {
        success: false,
        pitchOk: false,
        rhythmOk: false,
        message: "No sound detected",
      };
    }

    const successRatio = pitchCount / totalCount;
    const pitchOk =
      hitTarget && successRatio >= HALF_REST_AUDIO_THRESHOLDS.pitchSuccessRatio;

    // Beat mapping (0-indexed in soundingOnBeats):
    // Index 0-1 (beats 1-2): First half note - should sound
    // Index 2-3 (beats 3-4): Half rest - should NOT sound
    // Index 4-5 (beats 5-6): Second half note - should sound
    // Index 6 (beat 7): End marker - should stop

    // First half note (beats 1-2)
    const firstNoteSustained =
      (beatSoundPct[0] ?? 0) >= SUSTAIN_THRESHOLD &&
      (beatSoundPct[1] ?? 0) >= SUSTAIN_THRESHOLD;
    // Half rest (beats 3-4)
    const restWasSilent =
      (beatSoundPct[2] ?? 0) < SILENCE_THRESHOLD &&
      (beatSoundPct[3] ?? 0) < SILENCE_THRESHOLD;
    // Second half note (beats 5-6)
    const secondNoteSustained =
      (beatSoundPct[4] ?? 0) >= SUSTAIN_THRESHOLD &&
      (beatSoundPct[5] ?? 0) >= SUSTAIN_THRESHOLD;
    // Beat 7 should be silent (end)
    const stoppedOnNextOne = (beatSoundPct[6] ?? 0) < SILENCE_THRESHOLD;

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
  }, [performanceRefs]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handlePlayPattern = useCallback(() => {
    playPattern(() => {
      exercise.setHasHeardPattern(true);
    });
  }, [playPattern, exercise]);

  const handleStartSing = useCallback(() => {
    resetTracking();
    playMetronomeOnly(() => {
      const result = analyzeHalfRestPerformance();
      exercise.setSingResult(result);
      if (!result.success) {
        exercise.incrementSingAttempts();
      } else {
        exercise.resetSingAttempts();
      }
    });
  }, [playMetronomeOnly, analyzeHalfRestPerformance, exercise, resetTracking]);

  const handleTrySingAgain = useCallback(() => {
    exercise.setSingResult(null);
    resetTracking();
    setTimeout(() => handleStartSing(), 100);
  }, [exercise, resetTracking, handleStartSing]);

  const handleStartPlay = useCallback(() => {
    resetTracking();
    playMetronomeOnly(() => {
      const result = analyzeHalfRestPerformance();
      exercise.setPlayResult(result);
      if (!result.success) {
        exercise.incrementPlayAttempts();
      } else {
        exercise.resetPlayAttempts();
      }
    });
  }, [playMetronomeOnly, analyzeHalfRestPerformance, exercise, resetTracking]);

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
        width={320}
        height={200}
        showTimeSignature={true}
      />
    );
  }, [musicXML]);

  // Cursor position for highlighting (4 half notes/rests across 2 measures)
  const cursorNoteIndex = useMemo(() => {
    if (!exercise.showNotation || currentBeat < 1 || currentBeat > 4)
      return null;
    // (measure-1)*2 gives base index (0 for m1, 2 for m2)
    // floor((beat-1)/2) gives offset within measure (0 for beats 1-2, 1 for beats 3-4)
    return (currentMeasure - 1) * 2 + Math.floor((currentBeat - 1) / 2);
  }, [exercise.showNotation, currentBeat, currentMeasure]);

  // ---------------------------------------------------------------------------
  // Notation Toggle Renderer
  // ---------------------------------------------------------------------------
  const renderNotationToggle = () => {
    if (!NotationDisplay) return null;

    // 4 half note/rest positions: 2 in measure 1, 2 in measure 2
    const notePositions = [85, 145, 210, 270];
    const highlightLeft =
      cursorNoteIndex !== null ? notePositions[cursorNoteIndex] : null;
    const highlightWidth = 40;

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

  // ---------------------------------------------------------------------------
  // Focus Card Mini Renderer
  // ---------------------------------------------------------------------------
  const renderFocusCardMini = () => (
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

  // ---------------------------------------------------------------------------
  // Beat Indicator for half rest pattern (2 measures) - shows all 8 beats at once
  // ---------------------------------------------------------------------------
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
            Listen to: half note → half rest → half note.{"\n"}
            Notice how the rest creates 2 beats of silence.
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
            Sing: half note (1-2) → rest (3-4) → half note (1-2).{"\n"}
            Be silent during the rest!
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
            Imagine playing: half note → rest → half note.{"\n"}
            Hear the silence during the half rest.
          </Text>

          {/* Show notation at top when open */}
          {exercise.showNotation && renderNotationToggle()}

          {isPlaying && <BeatIndicator />}

          <View style={styles.imagineVisual}>
            <Text style={styles.imagineEmoji}>🎵 🤫 🎵</Text>
            <Text style={styles.imagineHint}>Play - Rest - Play</Text>
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
            Play: half note (1-2) → rest (3-4) → half note (1-2).{"\n"}
            Be silent during the half rest.
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
                onPress={handleFeedbackContinue}
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
  if (exercise.phase === PHASE.FEEDBACK) {
    const overallSuccess =
      exercise.singResult?.success && exercise.playResult?.success;

    if (exercise.showSuccess) {
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
              Half rest = 2 beats silence{"\n"}
              Sits ON TOP of the line{"\n"}
              "HAT sits on top"
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
            accessibilityLabel="Continue"
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
