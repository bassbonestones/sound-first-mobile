/**
 * HalfNoteLessonExercise - Refactored to use shared hooks
 *
 * Uses:
 * - useLessonExerciseState for phase/UI state management
 * - useLessonExerciseAudio for audio playback and pitch tracking
 *
 * Flow: Focus Card → Listen → Sing → Imagine → Play → Feedback
 * Key concepts:
 * - A half note lasts 2 beats
 * - The note ends right on beat 3
 */
import React, { useEffect, useMemo, useCallback, useRef } from "react";
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
  midiToFrequency,
  LESSON_PHASES as PHASE,
  PITCH_DETECTION_OPTIONS,
} from "./shared";
import type { ExerciseProps } from "./shared";
import { useLessonExerciseState } from "./shared/useLessonExerciseState";
import { useLessonExerciseAudio } from "./shared/useLessonExerciseAudio";
import {
  generateHalfNoteMusicXML,
  HALF_NOTE_CONFIG,
} from "./configs/halfNoteConfig";
import { devWarn } from "../../../../utils/devLogger";

// For notation display
let NotationDisplay: React.ComponentType<{
  musicxml: string | null;
  width: number;
  height: number;
}> | null = null;
try {
  NotationDisplay = require("../../../../components/NotationDisplay").default;
} catch (_e) {
  devWarn("NotationDisplay not available");
}

export default function HalfNoteLessonExercise({
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
    HALF_NOTE_CONFIG.defaultTempo;
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
    () => midiToFrequency(targetMidi),
    [targetMidi],
  );

  // Generate MusicXML
  const musicXML = useMemo(
    () => generateHalfNoteMusicXML(userFirstNote, clef),
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
        name: "Half Note",
        description: "A half note lasts for 2 beats.",
        cue: "The note ends right on beat 3.",
      },
    ],
  });

  // ---------------------------------------------------------------------------
  // Audio Hook
  // ---------------------------------------------------------------------------
  const audio = useLessonExerciseAudio({
    tempo: bpm,
    noteConfig: {
      beatsPerNote: HALF_NOTE_CONFIG.beatsPerNote,
      includeSubdivision: HALF_NOTE_CONFIG.hasSubdivision,
    },
  });

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

  // Sync isSounding to tracking ref
  useEffect(() => {
    audio.trackingRefs.isSounding.current = isSounding;
  }, [isSounding, audio.trackingRefs.isSounding]);

  // Track pitch during active phases
  useEffect(() => {
    if (!isSounding || !currentPitch?.noteName || !isPitchActive) return;

    const detectedMidi = noteToMidi(currentPitch.noteName);
    if (detectedMidi === null) return;

    audio.trackingRefs.totalSoundingCount.current += 1;

    // For singing: allow octave variance
    const pitchDiff = Math.abs(detectedMidi - targetMidi);
    const isOnPitch =
      exercise.phase === PHASE.SING
        ? pitchDiff % 12 <= 1 || pitchDiff % 12 >= 11
        : pitchDiff <= 1;

    if (isOnPitch) {
      audio.trackingRefs.hasHitTargetPitch.current = true;
      audio.trackingRefs.onPitchCount.current += 1;
    }
  }, [
    currentPitch?.noteName,
    isSounding,
    isPitchActive,
    targetMidi,
    exercise.phase,
    audio.trackingRefs,
  ]);

  // Detected note name for display
  const detectedNoteName = useMemo(() => {
    if (!currentPitch?.noteName || !isSounding) return null;
    return currentPitch.noteName;
  }, [currentPitch?.noteName, isSounding]);

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  const scrollViewRef = useRef<ScrollView>(null);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handlePlayPattern = useCallback(() => {
    const notes = [{ midiOrFreq: targetFrequency, isMidi: false }];
    audio.playPattern(notes, () => {
      exercise.setHasHeardPattern(true);
    });
  }, [audio, targetFrequency, exercise]);

  const handleStartSing = useCallback(() => {
    audio.resetTrackingRefs(1);
    audio.playMetronomeOnly(1, () => {
      const result = audio.analyzePerformance([targetMidi], "sing");
      exercise.setSingResult(result);
      if (!result.success) {
        exercise.incrementSingAttempts();
      } else {
        exercise.resetSingAttempts();
      }
    });
  }, [audio, targetMidi, exercise]);

  const handleTrySingAgain = useCallback(() => {
    exercise.setSingResult(null);
    audio.resetTrackingRefs(1);
    setTimeout(() => handleStartSing(), 100);
  }, [exercise, audio, handleStartSing]);

  const handleStartPlay = useCallback(() => {
    audio.resetTrackingRefs(1);
    audio.playMetronomeOnly(1, () => {
      const result = audio.analyzePerformance([targetMidi], "play");
      exercise.setPlayResult(result);
      if (!result.success) {
        exercise.incrementPlayAttempts();
      } else {
        exercise.resetPlayAttempts();
      }
    });
  }, [audio, targetMidi, exercise]);

  const handleTryPlayAgain = useCallback(() => {
    exercise.setPlayResult(null);
    audio.resetTrackingRefs(1);
    setTimeout(() => handleStartPlay(), 100);
  }, [exercise, audio, handleStartPlay]);

  const handleFeedbackContinue = useCallback(() => {
    exercise.incrementSuccessfulRounds();
    if (exercise.successfulRounds + 1 >= masteryStreak) {
      exercise.setShowSuccess(true);
    } else {
      exercise.resetForNewRound();
      exercise.setPhase(PHASE.LISTEN);
    }
  }, [exercise, masteryStreak]);

  const handleComplete = useCallback(() => {
    onComplete({
      success: true,
      details: {
        capability: "half_note",
        rounds: exercise.successfulRounds + 1,
      },
    });
  }, [onComplete, exercise.successfulRounds]);

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
    return <NotationDisplay musicxml={musicXML} width={320} height={250} />;
  }, [musicXML]);

  // Cursor position for highlighting
  const cursorNoteIndex = useMemo(() => {
    if (!exercise.showNotation || audio.currentBeat < 1) return null;
    return 0;
  }, [exercise.showNotation, audio.currentBeat]);

  // ---------------------------------------------------------------------------
  // Notation Toggle Renderer
  // ---------------------------------------------------------------------------
  const renderNotationToggle = () => {
    if (!NotationDisplay) return null;

    const highlightLeft = cursorNoteIndex !== null ? 135 : null;
    const highlightWidth = 70;

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
                    styles.highlightHeight160,
                    { left: highlightLeft, width: highlightWidth },
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
        <View style={styles.halfNoteSymbolMini}>
          <View style={styles.halfNoteOvalMini} />
          <View style={styles.halfNoteStemMini} />
        </View>
      </View>
      <View style={styles.focusCardMiniRight}>
        <Text style={styles.focusCardMiniTitle}>Half Note</Text>
        <Text style={styles.focusCardMiniText}>2 beats → ends on beat 3</Text>
      </View>
    </View>
  );

  // ---------------------------------------------------------------------------
  // Beat Indicator Renderer
  // ---------------------------------------------------------------------------
  const BeatIndicator = () => {
    const _isInCountIn = audio.currentBeat < 0;

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
                  beat <= audio.currentBeat &&
                    audio.currentBeat < 0 &&
                    styles.countInDotActive,
                  beat === -4 && styles.countInDotAccent,
                ]}
              >
                <Text
                  style={[
                    styles.countInNumber,
                    beat <= audio.currentBeat &&
                      audio.currentBeat < 0 &&
                      styles.countInNumberActive,
                  ]}
                >
                  {index + 1}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.singRow}>
          <Text style={styles.singLabel}>Sing:</Text>
          <View style={styles.beatIndicator}>
            {[1, 2].map((beat) => (
              <View
                key={beat}
                style={[
                  styles.beatDot,
                  audio.currentBeat >= beat &&
                    audio.currentBeat > 0 &&
                    styles.beatDotActive,
                  beat === 1 && styles.beatDotAccent,
                ]}
              >
                <Text
                  style={[
                    styles.beatNumber,
                    audio.currentBeat >= beat &&
                      audio.currentBeat > 0 &&
                      styles.beatNumberActive,
                  ]}
                >
                  {beat}
                </Text>
              </View>
            ))}
            <View
              style={[
                styles.beatDot,
                styles.beatDotStop,
                audio.currentBeat === 3 && styles.beatDotStopActive,
              ]}
            >
              <Text
                style={[
                  styles.beatNumber,
                  audio.currentBeat === 3 && styles.beatNumberStopActive,
                ]}
              >
                3
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
                accessibilityLabel="Confirm"
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

  // ---------------------------------------------------------------------------
  // SUCCESS PHASE
  // ---------------------------------------------------------------------------
  if (exercise.showSuccess) {
    return (
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.successContainer}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successTitle}>Well Done!</Text>
            <Text style={styles.successText}>
              {"You've mastered the half note rhythm!"}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleComplete}
            accessibilityLabel="Complete lesson"
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Complete Lesson →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // FOCUS CARD PHASE
  // ---------------------------------------------------------------------------
  if (exercise.phase === PHASE.FOCUS_CARD) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.focusCard}>
            <Text style={styles.focusCardTitle}>Half Note</Text>
            <View style={styles.halfNoteSymbol}>
              <View style={styles.halfNoteOval} />
              <View style={styles.halfNoteStem} />
            </View>
            <Text style={styles.focusCardDescription}>
              A half note lasts for 2 beats.
            </Text>
            <View style={styles.focusCardDivider} />
            <Text style={styles.focusCardCue}>
              It has a STEM (vertical line).
            </Text>
            <Text style={styles.focusCardDetail}>
              Any note shorter than a whole note has a stem.
            </Text>
            <Text style={styles.focusCardDetail}>
              The note head is still hollow (empty).
            </Text>
            <Text style={styles.focusCardMnemonic}>
              Count: 1 - 2 - (3) stop!
            </Text>
          </View>
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={exercise.goToNextPhase}
            accessibilityLabel="Begin exercise"
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Begin →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // LISTEN PHASE
  // ---------------------------------------------------------------------------
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
            Listen to the half note.{"\n"}
            Notice how it lasts 2 beats and ends on the beat 3.
          </Text>

          {exercise.showNotation && renderNotationToggle()}
          {audio.isPlaying && <BeatIndicator />}
          {!exercise.showNotation && renderNotationToggle()}
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          {!exercise.hasHeardPattern ? (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                audio.isPlaying && styles.buttonDisabled,
              ]}
              onPress={handlePlayPattern}
              disabled={audio.isPlaying}
              accessibilityLabel={
                audio.isPlaying ? "Listening" : "Play pattern"
              }
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>
                {audio.isPlaying ? "🎵 Listening..." : "🎵 Play Pattern"}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  audio.isPlaying && styles.buttonDisabled,
                ]}
                onPress={handlePlayPattern}
                disabled={audio.isPlaying}
                accessibilityLabel={
                  audio.isPlaying ? "Listening" : "Hear again"
                }
                accessibilityRole="button"
              >
                <Text style={styles.secondaryButtonText}>
                  {audio.isPlaying ? "🎵 Listening..." : "🎵 Hear Again"}
                </Text>
              </TouchableOpacity>
              {!audio.isPlaying && (
                <TouchableOpacity
                  style={[styles.primaryButton, styles.marginTop8]}
                  onPress={exercise.goToNextPhase}
                  accessibilityLabel="I heard it, continue to sing phase"
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

  // ---------------------------------------------------------------------------
  // SING PHASE
  // ---------------------------------------------------------------------------
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
            Sing the half note on solfege (do).{"\n"}
            Hold it for 2 beats, ending on the beat 3.
          </Text>

          {exercise.showNotation && renderNotationToggle()}
          {audio.isPlaying && <BeatIndicator />}

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
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
              {exercise.singAttempts >= 3 && (
                <TouchableOpacity
                  style={[styles.tertiaryButton, styles.marginTop8]}
                  onPress={() => exercise.openAttestModal("sing")}
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
                    styles.flexOne,
                    audio.isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={handlePlayPattern}
                  disabled={audio.isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>
                    {audio.isPlaying ? "🎵 Listening..." : "🎵 Hear Again"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    styles.flexOne,
                    audio.isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={handleTrySingAgain}
                  disabled={audio.isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>🎤 Sing Again</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.primaryButton, styles.marginTop8]}
                onPress={exercise.goToNextPhase}
              >
                <Text style={styles.primaryButtonText}>Continue →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                audio.isPlaying && styles.buttonDisabled,
              ]}
              onPress={handleStartSing}
              disabled={audio.isPlaying}
            >
              <Text style={styles.primaryButtonText}>
                {audio.isPlaying ? "🎤 Sing Now..." : "🎤 Start Singing"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {attestationModal}
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // IMAGINE PHASE
  // ---------------------------------------------------------------------------
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
            Imagine playing this half note on your instrument.{"\n"}
            Hear the sound in your mind lasting 2 beats, ending on the beat 3.
          </Text>

          {exercise.showNotation && renderNotationToggle()}
          {audio.isPlaying && <BeatIndicator />}

          <View style={styles.imagineVisual}>
            <Text style={styles.imagineEmoji}>🎵</Text>
            <Text style={styles.imagineHint}>
              Hear your instrument: 1 - 2 - 3 - 4 - (1)
            </Text>
          </View>

          {!exercise.showNotation && renderNotationToggle()}
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              audio.isPlaying && styles.buttonDisabled,
            ]}
            onPress={() => audio.playMetronomeOnly(1)}
            disabled={audio.isPlaying}
          >
            <Text style={styles.secondaryButtonText}>
              {audio.isPlaying ? "🥁 Counting..." : "🥁 Count with Clicks"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, styles.marginTop8]}
            onPress={exercise.goToNextPhase}
          >
            <Text style={styles.primaryButtonText}>I Imagined It →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // PLAY PHASE
  // ---------------------------------------------------------------------------
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
            Play the half note on your instrument.{"\n"}
            Hold for 2 beats, ending on the beat 3.
          </Text>

          {exercise.showNotation && renderNotationToggle()}
          {audio.isPlaying && <BeatIndicator />}

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
                ? "✓ Excellent!"
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
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
              {exercise.playAttempts >= 3 && (
                <TouchableOpacity
                  style={[styles.tertiaryButton, styles.marginTop8]}
                  onPress={() => exercise.openAttestModal("play")}
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
                    styles.flexOne,
                    audio.isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={handlePlayPattern}
                  disabled={audio.isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>
                    {audio.isPlaying ? "🎵 Listening..." : "🎵 Hear Again"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    styles.flexOne,
                    audio.isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={handleTryPlayAgain}
                  disabled={audio.isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>🎺 Play Again</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.primaryButton, styles.marginTop8]}
                onPress={exercise.goToNextPhase}
              >
                <Text style={styles.primaryButtonText}>Continue →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                audio.isPlaying && styles.buttonDisabled,
              ]}
              onPress={handleStartPlay}
              disabled={audio.isPlaying}
            >
              <Text style={styles.primaryButtonText}>
                {audio.isPlaying ? "🎺 Play Now..." : "🎺 Start Playing"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {attestationModal}
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // FEEDBACK PHASE
  // ---------------------------------------------------------------------------
  if (exercise.phase === PHASE.FEEDBACK) {
    return (
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackEmoji}>✅</Text>
            <Text style={styles.feedbackTitle}>Round Complete!</Text>
            <Text style={styles.feedbackText}>
              {exercise.successfulRounds + 1} of {masteryStreak} rounds
            </Text>
            <View style={styles.focusCardMini}>
              <View style={styles.focusCardMiniLeft}>
                <View style={styles.halfNoteSymbolMini}>
                  <View style={styles.halfNoteOvalMini} />
                  <View style={styles.halfNoteStemMini} />
                </View>
              </View>
              <View style={styles.focusCardMiniRight}>
                <Text style={styles.focusCardMiniTitle}>Half Note</Text>
                <Text style={styles.focusCardMiniText}>
                  2 beats → ends on beat 3
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleFeedbackContinue}
          >
            <Text style={styles.primaryButtonText}>Continue →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Fallback
  return (
    <View style={styles.container}>
      <Text style={styles.phaseTitle}>Unknown phase</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
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
    paddingBottom: 200,
  },

  // Focus Card
  focusCard: {
    backgroundColor: "#2d241a",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  focusCardTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f5e6d3",
    marginBottom: 16,
  },
  focusCardDescription: {
    fontSize: 18,
    color: "#c4b5a0",
    textAlign: "center",
    marginBottom: 16,
  },
  focusCardDivider: {
    width: 60,
    height: 2,
    backgroundColor: "#4a3f35",
    marginVertical: 16,
  },
  focusCardCue: {
    fontSize: 16,
    color: "#d4a574",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 12,
  },
  focusCardDetail: {
    fontSize: 14,
    color: "#8a7a6a",
    textAlign: "center",
    marginBottom: 4,
  },
  focusCardMnemonic: {
    fontSize: 18,
    color: "#d4a574",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "600",
  },

  // Half Note Symbol
  halfNoteSymbol: {
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: 60,
    height: 80,
  },
  halfNoteOval: {
    width: 32,
    height: 24,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: "#d4a574",
    backgroundColor: "transparent",
    transform: [{ rotate: "-15deg" }],
    position: "absolute",
    bottom: 0,
    left: 4,
  },
  halfNoteStem: {
    width: 4,
    height: 50,
    backgroundColor: "#d4a574",
    position: "absolute",
    right: 24,
    bottom: 16,
  },
  halfNoteSymbolMini: {
    width: 24,
    height: 40,
    position: "relative",
  },
  halfNoteOvalMini: {
    width: 16,
    height: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#d4a574",
    backgroundColor: "transparent",
    transform: [{ rotate: "-15deg" }],
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  halfNoteStemMini: {
    width: 2,
    height: 28,
    backgroundColor: "#d4a574",
    position: "absolute",
    right: 7,
    bottom: 9,
  },

  // Focus Card Mini
  focusCardMini: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2d241a",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  focusCardMiniLeft: {
    width: 40,
    alignItems: "center",
  },
  focusCardMiniRight: {
    flex: 1,
    marginLeft: 12,
  },
  focusCardMiniTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#f5e6d3",
  },
  focusCardMiniText: {
    fontSize: 12,
    color: "#8a7a6a",
  },

  // Phase content
  phaseTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#f5e6d3",
    textAlign: "center",
    marginBottom: 16,
  },
  noteDisplay: {
    fontSize: 64,
    fontWeight: "bold",
    color: "#d4a574",
    textAlign: "center",
    marginBottom: 16,
  },
  instruction: {
    fontSize: 16,
    color: "#c4b5a0",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },

  // Notation
  notationContainer: {
    marginVertical: 16,
    alignItems: "center",
  },
  notationWrapper: {
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
  },
  notationWrapperRelative: {
    position: "relative",
  },
  highlightOverlay: {
    position: "absolute",
    top: 45,
    backgroundColor: "rgba(76, 175, 80, 0.3)",
    borderRadius: 4,
  },
  showNotationButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4a3f35",
  },
  showNotationText: {
    fontSize: 14,
    color: "#8a7a6a",
  },
  hideNotationButton: {
    padding: 8,
    marginTop: 8,
  },
  hideNotationText: {
    fontSize: 14,
    color: "#8a7a6a",
    textDecorationLine: "underline",
  },

  // Beat indicator
  beatIndicatorContainer: {
    marginVertical: 16,
  },
  countInRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  countInLabel: {
    fontSize: 14,
    color: "#8a7a6a",
    width: 70,
  },
  countInBeats: {
    flexDirection: "row",
    gap: 8,
  },
  countInDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2d241a",
    justifyContent: "center",
    alignItems: "center",
  },
  countInDotActive: {
    backgroundColor: "#4a3f35",
  },
  countInDotAccent: {
    borderWidth: 2,
    borderColor: "#d4a574",
  },
  countInNumber: {
    fontSize: 14,
    color: "#8a7a6a",
  },
  countInNumberActive: {
    color: "#f5e6d3",
  },
  singRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  singLabel: {
    fontSize: 14,
    color: "#8a7a6a",
    width: 70,
  },
  beatIndicator: {
    flexDirection: "row",
    gap: 8,
  },
  beatDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2d241a",
    justifyContent: "center",
    alignItems: "center",
  },
  beatDotActive: {
    backgroundColor: "#4CAF50",
  },
  beatDotAccent: {
    borderWidth: 2,
    borderColor: "#d4a574",
  },
  beatDotStop: {
    backgroundColor: "#3d2d20",
    borderWidth: 2,
    borderColor: "#ff6b6b",
  },
  beatDotStopActive: {
    backgroundColor: "#ff6b6b",
  },
  beatNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#8a7a6a",
  },
  beatNumberActive: {
    color: "#fff",
  },
  beatNumberStopActive: {
    color: "#fff",
  },

  // Volume indicator
  volumeContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  hearingText: {
    fontSize: 16,
    color: "#d4a574",
    marginTop: 12,
  },

  // Feedback
  successText: {
    fontSize: 24,
    color: "#4CAF50",
    textAlign: "center",
    marginVertical: 20,
  },
  feedbackError: {
    fontSize: 16,
    color: "#ff6b6b",
    textAlign: "center",
    marginVertical: 20,
  },
  feedbackContainer: {
    alignItems: "center",
    padding: 20,
  },
  feedbackEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  feedbackTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f5e6d3",
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 16,
    color: "#c4b5a0",
    marginBottom: 20,
  },

  // Success
  successContainer: {
    alignItems: "center",
    padding: 20,
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f5e6d3",
    marginBottom: 8,
  },

  // Imagine
  imagineVisual: {
    alignItems: "center",
    marginVertical: 30,
  },
  imagineEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  imagineHint: {
    fontSize: 16,
    color: "#8a7a6a",
    fontStyle: "italic",
  },

  // Buttons
  fixedBottomButtons: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "#1a1410",
    borderTopWidth: 1,
    borderTopColor: "#2d241a",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#d4a574",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1410",
  },
  secondaryButton: {
    backgroundColor: "#2d241a",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4a3f35",
  },
  secondaryButtonText: {
    fontSize: 16,
    color: "#d4a574",
  },
  tertiaryButton: {
    padding: 12,
    alignItems: "center",
  },
  tertiaryButtonText: {
    fontSize: 14,
    color: "#8a7a6a",
    textDecorationLine: "underline",
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#2d241a",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f5e6d3",
    marginBottom: 12,
    textAlign: "center",
  },
  modalText: {
    fontSize: 14,
    color: "#c4b5a0",
    lineHeight: 20,
    marginBottom: 20,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#1a1410",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    color: "#8a7a6a",
  },
  modalConfirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#d4a574",
    alignItems: "center",
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1410",
  },

  // Utility styles
  marginTop8: {
    marginTop: 8,
  },
  flexOne: {
    flex: 1,
  },
  highlightHeight160: {
    height: 160,
  },
});
