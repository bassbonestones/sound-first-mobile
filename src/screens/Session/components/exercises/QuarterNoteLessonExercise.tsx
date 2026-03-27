/**
 * QuarterNoteLessonExercise - Refactored to use shared hooks
 *
 * Uses:
 * - useLessonExerciseState for phase/UI state management
 * - useLessonExerciseAudio for audio playback and pitch tracking
 *
 * Flow: Focus Card → Listen → Sing → Imagine → Play → Feedback
 * Key concepts:
 * - A quarter note lasts 1 beat
 * - Has a stem (like half note)
 * - Note head is FILLED/SOLID (not hollow like whole/half)
 * - The note ends right on beat 2
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
  generateQuarterNoteMusicXML,
  QUARTER_NOTE_CONFIG,
} from "./configs/quarterNoteConfig";
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

export default function QuarterNoteLessonExercise({
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
    QUARTER_NOTE_CONFIG.defaultTempo;
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
    () => generateQuarterNoteMusicXML(userFirstNote, clef),
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
        name: "Quarter Note",
        description: "A quarter note lasts for 1 beat.",
        cue: "The note ends right on beat 2.",
      },
    ],
  });

  // ---------------------------------------------------------------------------
  // Audio Hook
  // ---------------------------------------------------------------------------
  const audio = useLessonExerciseAudio({
    tempo: bpm,
    noteConfig: {
      beatsPerNote: QUARTER_NOTE_CONFIG.beatsPerNote,
      includeSubdivision: QUARTER_NOTE_CONFIG.hasSubdivision,
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
        capability: "quarter_note",
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
    return <NotationDisplay musicxml={musicXML} width={320} height={200} />;
  }, [musicXML]);

  // Cursor position for highlighting (single note at position ~105)
  const cursorNoteIndex = useMemo(() => {
    if (!exercise.showNotation || audio.currentBeat < 1) return null;
    return 0;
  }, [exercise.showNotation, audio.currentBeat]);

  // ---------------------------------------------------------------------------
  // Notation Toggle Renderer
  // ---------------------------------------------------------------------------
  const renderNotationToggle = () => {
    if (!NotationDisplay) return null;

    const highlightLeft = cursorNoteIndex !== null ? 105 : null;
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
  // Focus Card Mini Renderer (Quarter note has filled head)
  // ---------------------------------------------------------------------------
  const renderFocusCardMini = () => (
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

  // ---------------------------------------------------------------------------
  // Beat Indicator Renderer (1 beat + stop on 2)
  // ---------------------------------------------------------------------------
  const BeatIndicator = () => (
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
        <Text style={styles.singLabel}>Play:</Text>
        <View style={styles.beatIndicator}>
          {/* Beat 1 - the note starts here */}
          <View
            style={[
              styles.beatDot,
              styles.beatDotAccent,
              audio.currentBeat >= 1 &&
                audio.currentBeat > 0 &&
                styles.beatDotActive,
            ]}
          >
            <Text
              style={[
                styles.beatNumber,
                audio.currentBeat >= 1 &&
                  audio.currentBeat > 0 &&
                  styles.beatNumberActive,
              ]}
            >
              1
            </Text>
          </View>
          {/* Beat 2 - the note stops here */}
          <View
            style={[
              styles.beatDot,
              styles.beatDotStop,
              audio.currentBeat === 2 && styles.beatDotStopActive,
            ]}
          >
            <Text
              style={[
                styles.beatNumber,
                audio.currentBeat === 2 && styles.beatNumberStopActive,
              ]}
            >
              2
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

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
    [exercise.showAttestModal, exercise.attestPhase, exercise.closeAttestModal, exercise.confirmAttestation],
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
            <Text style={styles.focusCardMnemonic}>
              Count: 1 - (2) stop!
            </Text>
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
            Listen to the quarter note.{"\n"}
            Notice how SHORT it is - just 1 beat!
          </Text>

          {/* Show notation at top when open */}
          {exercise.showNotation && renderNotationToggle()}

          {audio.isPlaying && <BeatIndicator />}

          {/* Show notation button at bottom when closed */}
          {!exercise.showNotation && renderNotationToggle()}
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          {!exercise.hasHeardPattern ? (
            <TouchableOpacity
              style={[styles.primaryButton, audio.isPlaying && styles.buttonDisabled]}
              onPress={handlePlayPattern}
              disabled={audio.isPlaying}
              accessibilityLabel="Hear the pattern"
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
                accessibilityLabel="Hear pattern again"
                accessibilityRole="button"
              >
                <Text style={styles.secondaryButtonText}>
                  {audio.isPlaying ? "🎵 Listening..." : "🎵 Hear Again"}
                </Text>
              </TouchableOpacity>
              {!audio.isPlaying && (
                <TouchableOpacity
                  style={[styles.primaryButton, { marginTop: 8 }]}
                  onPress={() => {
                    audio.stopPlayback();
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
            Sing the quarter note on solfege (do).{"\n"}
            Just 1 beat - short and quick!
          </Text>

          {/* Show notation at top when open */}
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
                exercise.singResult.success ? styles.successText : styles.feedbackError
              }
            >
              {exercise.singResult.success ? "✓ Great!" : exercise.singResult.message}
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
                    audio.isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={handlePlayPattern}
                  disabled={audio.isPlaying}
                  accessibilityLabel="Hear pattern again"
                  accessibilityRole="button"
                >
                  <Text style={styles.secondaryButtonText}>
                    {audio.isPlaying ? "🎵 Listening..." : "🎵 Hear Again"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    audio.isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={handleTrySingAgain}
                  disabled={audio.isPlaying}
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
              style={[styles.primaryButton, audio.isPlaying && styles.buttonDisabled]}
              onPress={handleStartSing}
              disabled={audio.isPlaying}
              accessibilityLabel="Start singing"
              accessibilityRole="button"
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
            Imagine playing this quarter note on your instrument.{"\n"}
            Quick attack, short release!
          </Text>

          {/* Show notation at top when open */}
          {exercise.showNotation && renderNotationToggle()}

          {audio.isPlaying && <BeatIndicator />}

          <View style={styles.imagineVisual}>
            <Text style={styles.imagineEmoji}>🎵</Text>
            <Text style={styles.imagineHint}>Hear: 1 - (2) stop</Text>
          </View>

          {/* Show notation button at bottom when closed */}
          {!exercise.showNotation && renderNotationToggle()}
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            style={[styles.secondaryButton, audio.isPlaying && styles.buttonDisabled]}
            onPress={() => audio.playMetronomeOnly(1, () => {})}
            disabled={audio.isPlaying}
            accessibilityLabel="Count with metronome clicks"
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>
              {audio.isPlaying ? "🥁 Counting..." : "🥁 Count with Clicks"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: 8 }]}
            onPress={() => {
              audio.stopPlayback();
              audio.resetTrackingRefs(1);
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
            Play the quarter note on your instrument.{"\n"}
            Just 1 beat - release quickly!
          </Text>

          {/* Show notation at top when open */}
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
                exercise.playResult.success ? styles.successText : styles.feedbackError
              }
            >
              {exercise.playResult.success ? "✓ Great!" : exercise.playResult.message}
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
                    audio.isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={handlePlayPattern}
                  disabled={audio.isPlaying}
                  accessibilityLabel="Hear pattern again"
                  accessibilityRole="button"
                >
                  <Text style={styles.secondaryButtonText}>
                    {audio.isPlaying ? "🎵 Listening..." : "🎵 Hear Again"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    audio.isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={handleTryPlayAgain}
                  disabled={audio.isPlaying}
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
              style={[styles.primaryButton, audio.isPlaying && styles.buttonDisabled]}
              onPress={handleStartPlay}
              disabled={audio.isPlaying}
              accessibilityLabel="Start playing"
              accessibilityRole="button"
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

  // FEEDBACK PHASE
  if (exercise.phase === PHASE.FEEDBACK) {
    if (exercise.showSuccess) {
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
    padding: 20,
    backgroundColor: "#1a1410",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },

  // Phase title and content
  phaseTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  noteDisplay: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#4CAF50",
    textAlign: "center",
    marginBottom: 12,
  },
  instruction: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 24,
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
  focusCardDescription: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
    marginTop: 16,
  },
  focusCardDivider: {
    width: 60,
    height: 2,
    backgroundColor: "#4CAF50",
    marginVertical: 16,
  },
  focusCardCue: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "600",
    textAlign: "center",
  },
  focusCardDetail: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    marginTop: 8,
  },
  focusCardMnemonic: {
    fontSize: 18,
    color: "#FFD700",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 16,
  },

  // Comparison box (half vs quarter)
  comparisonBox: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    width: "100%",
  },
  comparisonTitle: {
    color: "#aaa",
    fontSize: 14,
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
    width: 30,
    height: 50,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  halfNoteHeadCompare: {
    width: 20,
    height: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "transparent",
  },
  noteStemCompare: {
    width: 2,
    height: 30,
    backgroundColor: "#fff",
    position: "absolute",
    right: 4,
    bottom: 7,
  },
  quarterNoteHeadCompare: {
    width: 20,
    height: 14,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  quarterNoteStemCompare: {
    width: 2,
    height: 30,
    backgroundColor: "#fff",
    position: "absolute",
    right: 4,
    bottom: 7,
  },
  comparisonLabel: {
    color: "#fff",
    fontSize: 12,
    marginTop: 8,
  },
  comparisonDetail: {
    color: "#888",
    fontSize: 10,
  },

  // Quarter Note Symbol (FILLED head)
  quarterNoteSymbol: {
    alignItems: "center",
    justifyContent: "center",
  },
  quarterNoteOval: {
    width: 40,
    height: 28,
    borderRadius: 20,
    backgroundColor: "#fff",
  },
  quarterNoteStem: {
    width: 3,
    height: 50,
    backgroundColor: "#fff",
    position: "absolute",
    right: -1,
    bottom: 14,
  },

  // Focus Card Mini
  focusCardMini: {
    flexDirection: "row",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  focusCardMiniLeft: {
    marginRight: 12,
  },
  focusCardMiniRight: {
    flex: 1,
  },
  focusCardMiniTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  focusCardMiniText: {
    fontSize: 12,
    color: "#aaa",
  },
  quarterNoteSymbolMini: {
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 40,
  },
  quarterNoteOvalMini: {
    width: 16,
    height: 11,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  quarterNoteStemMini: {
    width: 2,
    height: 20,
    backgroundColor: "#fff",
    position: "absolute",
    right: 3,
    bottom: 6,
  },

  // Buttons
  primaryButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  secondaryButtonText: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "600",
  },
  tertiaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  tertiaryButtonText: {
    color: "#888",
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },

  // Notation
  notationContainer: {
    alignItems: "center",
    marginVertical: 12,
  },
  notationWrapper: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    overflow: "hidden",
  },
  notationWrapperRelative: {
    position: "relative",
  },
  showNotationButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  showNotationText: {
    color: "#aaa",
    fontSize: 14,
  },
  hideNotationButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  hideNotationText: {
    color: "#888",
    fontSize: 12,
  },
  highlightOverlay: {
    position: "absolute",
    top: 20,
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    borderRadius: 4,
  },
  notationPreview: {
    alignItems: "center",
    marginTop: 16,
  },
  notationPreviewLabel: {
    color: "#888",
    fontSize: 14,
    marginBottom: 8,
  },

  // Beat Indicator
  beatIndicatorContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  countInRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  countInLabel: {
    color: "#888",
    fontSize: 12,
    marginRight: 8,
  },
  countInBeats: {
    flexDirection: "row",
    gap: 8,
  },
  countInDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  countInDotActive: {
    backgroundColor: "rgba(255, 193, 7, 0.3)",
  },
  countInDotAccent: {
    borderWidth: 2,
    borderColor: "#FFC107",
  },
  countInNumber: {
    color: "#666",
    fontSize: 14,
    fontWeight: "bold",
  },
  countInNumberActive: {
    color: "#FFC107",
  },
  singRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  singLabel: {
    color: "#888",
    fontSize: 12,
    marginRight: 8,
  },
  beatIndicator: {
    flexDirection: "row",
    gap: 8,
  },
  beatDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  beatDotActive: {
    backgroundColor: "rgba(76, 175, 80, 0.4)",
  },
  beatDotAccent: {
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  beatDotStop: {
    borderWidth: 2,
    borderColor: "#F44336",
    borderStyle: "dashed",
  },
  beatDotStopActive: {
    backgroundColor: "rgba(244, 67, 54, 0.3)",
  },
  beatNumber: {
    color: "#666",
    fontSize: 16,
    fontWeight: "bold",
  },
  beatNumberActive: {
    color: "#4CAF50",
  },
  beatNumberStopActive: {
    color: "#F44336",
  },

  // Volume indicator
  volumeContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  hearingText: {
    color: "#4CAF50",
    fontSize: 14,
    marginTop: 8,
  },

  // Feedback
  successText: {
    fontSize: 24,
    color: "#4CAF50",
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 16,
  },
  feedbackError: {
    fontSize: 16,
    color: "#FF9800",
    textAlign: "center",
    marginVertical: 16,
  },

  // Imagine phase
  imagineVisual: {
    alignItems: "center",
    marginVertical: 24,
  },
  imagineEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  imagineHint: {
    color: "#888",
    fontSize: 14,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#2a2a4e",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  modalText: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  modalCancelText: {
    color: "#888",
    fontSize: 14,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
    alignItems: "center",
  },
  modalConfirmText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Success
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  successEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 18,
    color: "#ccc",
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
});
