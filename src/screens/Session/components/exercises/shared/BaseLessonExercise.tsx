/**
 * BaseLessonExercise - Composable wrapper for lesson-style exercises
 *
 * This component handles the common structure shared by:
 * - WholeNoteLessonExercise
 * - HalfNoteLessonExercise
 * - QuarterNoteLessonExercise
 * - WholeRestLessonExercise
 * - HalfRestLessonExercise
 * - QuarterRestLessonExercise
 * - Fragment2LessonExercise
 *
 * Each exercise provides:
 * 1. Exercise-specific configuration (patterns, note values, etc.)
 * 2. Custom phase renderers (if different from default)
 * 3. Phase transition logic (if different from default)
 *
 * The base handles:
 * - Common state management (via useLessonExerciseState)
 * - Audio playback/analysis (via useLessonExerciseAudio)
 * - Shared UI patterns (LessonComponents)
 * - Default phase flow implementation
 */
import React, { useCallback, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { usePitchDetection } from "../../../../../hooks/usePitchDetection";
import { CircularVolumeIndicator } from "../../../../../components/VolumeBar";
import {
  useLessonExerciseState,
  LessonExerciseStateConfig,
  PatternConfig,
  PerformanceResult,
  FocusCard,
} from "./useLessonExerciseState";
import {
  useLessonExerciseAudio,
  LessonExerciseAudioConfig,
  PatternNote,
} from "./useLessonExerciseAudio";
import {
  LessonBeatIndicator,
  LessonAttestationModal,
  LessonFocusCard,
  LessonFocusCardMini,
  LessonPhaseProgress,
  LessonNotationToggle,
  LessonResultDisplay,
  LessonSuccessDisplay,
  PatternProgressItem,
} from "./LessonComponents";
import { LESSON_PHASES, PITCH_DETECTION_OPTIONS } from "./exerciseConstants";
import { noteToMidi, midiToNote } from "./noteUtils";
import type { ExerciseResult } from "./propTypes";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Exercise-specific configuration
 */
export interface LessonExerciseConfig {
  /** Unique identifier for the exercise/capability */
  capabilityId: string;
  /** Exercise title (e.g., "Whole Note Lesson") */
  title: string;
  /** Whether this is a multi-pattern exercise (like Fragment2) */
  isMultiPattern?: boolean;
  /** Patterns for multi-pattern exercises */
  patterns?: PatternConfig[];
  /** Focus cards (uses defaults if not provided) */
  focusCards?: FocusCard[];
  /** Number of successful rounds for single-pattern exercises */
  masteryStreak?: number;
  /** Additional phases beyond standard LESSON_PHASES */
  additionalPhases?: Record<string, string>;
  /** Custom phase order */
  phaseOrder?: string[];
  /** Whether exercise uses drone */
  usesDrone?: boolean;
  /** Custom button text for focus card phase (defaults to "Begin →") */
  focusCardButtonText?: string;
  /** Custom accessibility label for focus card button */
  focusCardButtonAccessibilityLabel?: string;
}

/**
 * Audio-related configuration derived from exercise state
 */
export interface AudioConfig {
  /** Tempo in BPM */
  tempo: number;
  /** Beats per note (4 for whole, 2 for half, 1 for quarter) */
  beatsPerNote: number;
  /** Whether to include subdivision clicks */
  includeSubdivision?: boolean;
  /** Number of subdivisions per beat */
  subdivisionsPerBeat?: number;
  /** Clef for notation */
  clef: "treble" | "bass";
}

/**
 * Note generation configuration for current state
 */
export interface NoteGenerationConfig {
  /** Starting note (MIDI) */
  startingNote: number;
  /** Current pattern's notes (MIDI values) */
  patternNotes: number[];
  /** Current pattern's frequencies */
  patternFrequencies: number[];
}

/**
 * Pattern info for display
 */
export interface PatternInfo {
  id: string;
  name: string;
  description: string;
  scaleDegrees?: number[];
}

/**
 * Render props passed to custom phase renderers
 */
export interface PhaseRenderProps {
  // State
  phase: string;
  isPlaying: boolean;
  currentBeat: number;
  isSubdivision: boolean;
  showNotation: boolean;
  showCursor: boolean;
  hasHeardPattern: boolean;
  singResult: PerformanceResult | null;
  playResult: PerformanceResult | null;
  singAttempts: number;
  playAttempts: number;
  currentFocusCard: FocusCard | null;
  currentPattern: PatternInfo | null;
  progress: {
    currentIndex: number;
    completedItems: Record<string, boolean>;
    totalItems: number;
    isComplete: boolean;
  };
  showSuccess: boolean;
  isDroneActive: boolean;

  // Audio config
  audioConfig: AudioConfig;
  noteConfig: NoteGenerationConfig;

  // Pitch detection
  currentPitch: { noteName?: string; pitch?: number } | null;
  volume: number;
  isSounding: boolean;

  // MusicXML (if provided)
  musicXML: string | null;

  // Actions
  goToNextPhase: () => void;
  goToPrevPhase: () => void;
  setPhase: (phase: string) => void;
  setShowNotation: (show: boolean) => void;
  setSingResult: (result: PerformanceResult | null) => void;
  setPlayResult: (result: PerformanceResult | null) => void;
  resetSingAttempts: () => void;
  resetPlayAttempts: () => void;
  openAttestModal: (phase: "sing" | "play") => void;
  closeAttestModal: () => void;
  confirmAttestation: () => void;
  showAttestModal: boolean;
  attestPhase: "sing" | "play" | null;
  markItemComplete: (itemId: string) => void;
  goToNextItem: () => void;
  goToItem: (index: number) => void;
  setShowSuccess: (show: boolean) => void;
  resetForNewRound: () => void;
  incrementSingAttempts: () => void;
  incrementPlayAttempts: () => void;
  setHasHeardPattern: (heard: boolean) => void;
  rotateFocusCard: () => void;

  // Audio actions
  playPattern: (notes: PatternNote[], onComplete?: () => void) => void;
  playMetronomeOnly: (
    noteCount: number,
    onComplete?: () => void,
    withDrone?: boolean,
    droneNote?: number,
  ) => void;
  stopPlayback: () => void;
  startDrone: (midiNote: number) => void;
  stopDrone: () => void;
  analyzePerformance: (
    targetMidiNotes: number[],
    phase: "sing" | "play",
  ) => PerformanceResult;
  resetTrackingRefs: (noteCount: number) => void;

  // Refs
  scrollViewRef: React.RefObject<ScrollView>;
  trackingRefs: {
    isSounding: React.MutableRefObject<boolean>;
    hasHitTargetPitch: React.MutableRefObject<boolean>;
    onPitchCount: React.MutableRefObject<number>;
    totalSoundingCount: React.MutableRefObject<number>;
  };
}

/**
 * Props for BaseLessonExercise
 */
export interface BaseLessonExerciseProps {
  /** Exercise-specific configuration */
  exerciseConfig: LessonExerciseConfig;
  /** Audio configuration */
  audioConfig: AudioConfig;
  /** Function to generate notes for current state */
  generateNotes: (
    currentPatternIndex: number,
    sessionStartingNote: number,
  ) => NoteGenerationConfig;
  /** Function to generate MusicXML (optional) */
  generateMusicXML?: (
    config: NoteGenerationConfig,
    clef: "treble" | "bass",
  ) => string;
  /** Session's starting note (MIDI) - selected by exercise */
  sessionStartingNote: number;
  /** Current pattern info */
  currentPatternInfo: (index: number) => PatternInfo;
  /** Called when exercise completes */
  onComplete: (result: ExerciseResult) => void;
  /** Optional custom phase renderers */
  customPhaseRenderers?: {
    [phase: string]: (props: PhaseRenderProps) => React.ReactNode;
  };
  /** Optional phase transition override */
  onPhaseComplete?: (
    phase: string,
    result: PerformanceResult | null,
    defaultNext: () => void,
  ) => void;
  /** Additional content to render (e.g., pattern info) */
  renderPatternInfo?: (props: PhaseRenderProps) => React.ReactNode;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function BaseLessonExercise({
  exerciseConfig,
  audioConfig,
  generateNotes,
  generateMusicXML,
  sessionStartingNote,
  currentPatternInfo,
  onComplete,
  customPhaseRenderers = {},
  onPhaseComplete: _onPhaseComplete,
  renderPatternInfo,
}: BaseLessonExerciseProps): React.JSX.Element {
  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------
  const stateConfig: LessonExerciseStateConfig = useMemo(
    () => ({
      masteryStreak: exerciseConfig.masteryStreak ?? 3,
      patterns: exerciseConfig.patterns ?? [],
      focusCards: exerciseConfig.focusCards,
      phases: {
        additionalPhases: exerciseConfig.additionalPhases,
        phaseOrder: exerciseConfig.phaseOrder,
      },
    }),
    [exerciseConfig],
  );

  const state = useLessonExerciseState(stateConfig);

  // Local ref for ScrollView (typed correctly for React Native)
  const scrollViewRef = useRef<ScrollView>(null);

  // ---------------------------------------------------------------------------
  // Note Generation
  // ---------------------------------------------------------------------------
  const noteConfig = useMemo(
    () => generateNotes(state.progress.currentIndex, sessionStartingNote),
    [generateNotes, state.progress.currentIndex, sessionStartingNote],
  );

  const currentPattern = useMemo(
    () => currentPatternInfo(state.progress.currentIndex),
    [currentPatternInfo, state.progress.currentIndex],
  );

  // ---------------------------------------------------------------------------
  // Audio Management
  // ---------------------------------------------------------------------------
  const audioHookConfig: LessonExerciseAudioConfig = useMemo(
    () => ({
      tempo: audioConfig.tempo,
      noteConfig: {
        beatsPerNote: audioConfig.beatsPerNote,
        includeSubdivision: audioConfig.includeSubdivision,
        subdivisionsPerBeat: audioConfig.subdivisionsPerBeat,
      },
    }),
    [audioConfig],
  );

  const audio = useLessonExerciseAudio(audioHookConfig);

  // ---------------------------------------------------------------------------
  // MusicXML Generation
  // ---------------------------------------------------------------------------
  const musicXML = useMemo(() => {
    if (!generateMusicXML) return null;
    return generateMusicXML(noteConfig, audioConfig.clef);
  }, [generateMusicXML, noteConfig, audioConfig.clef]);

  // ---------------------------------------------------------------------------
  // Pitch Detection
  // ---------------------------------------------------------------------------
  const isPitchActivePhase =
    (state.phase === LESSON_PHASES.SING && !state.singResult) ||
    (state.phase === LESSON_PHASES.PLAY && !state.playResult);

  const { currentPitch, volume, isSounding } = usePitchDetection({
    enabled: isPitchActivePhase,
    ...PITCH_DETECTION_OPTIONS,
  });

  // Sync isSounding to tracking ref
  useEffect(() => {
    audio.trackingRefs.isSounding.current = isSounding;
  }, [isSounding, audio.trackingRefs.isSounding]);

  // Track pitch during active phases
  useEffect(() => {
    if (!isSounding || !currentPitch?.noteName || !isPitchActivePhase) return;

    const detectedMidi = noteToMidi(currentPitch.noteName);
    if (detectedMidi === null) return;

    audio.trackingRefs.totalSoundingCount.current += 1;

    // Check if detected pitch matches any target pitch
    const isOnPitch = noteConfig.patternNotes.some((targetMidi) => {
      const diff = Math.abs(detectedMidi - targetMidi);
      // For singing, allow octave variance
      return state.phase === LESSON_PHASES.SING
        ? diff % 12 <= 1 || diff % 12 >= 11
        : diff === 0;
    });

    if (isOnPitch) {
      audio.trackingRefs.hasHitTargetPitch.current = true;
      audio.trackingRefs.onPitchCount.current += 1;
    }
  }, [
    currentPitch?.noteName,
    isSounding,
    isPitchActivePhase,
    noteConfig.patternNotes,
    state.phase,
    audio.trackingRefs,
  ]);

  // ---------------------------------------------------------------------------
  // Progress Items for UI
  // ---------------------------------------------------------------------------
  const progressItems: PatternProgressItem[] = useMemo(() => {
    if (!exerciseConfig.patterns?.length) return [];
    return exerciseConfig.patterns.map((p, index) => ({
      id: p.id,
      name: p.name,
      isCompleted: !!state.progress.completedItems[p.id],
      isCurrent: index === state.progress.currentIndex,
    }));
  }, [exerciseConfig.patterns, state.progress]);

  // ---------------------------------------------------------------------------
  // Phase Actions
  // ---------------------------------------------------------------------------
  const handlePlayPattern = useCallback(() => {
    if (audio.isPlaying) return;
    const notes: PatternNote[] = noteConfig.patternNotes.map((midi) => ({
      midiOrFreq: midi,
      isMidi: true,
    }));
    audio.playPattern(notes, () => {
      state.setHasHeardPattern(true);
      state.goToNextPhase();
    });
  }, [audio, noteConfig.patternNotes, state]);

  const handleStartSing = useCallback(() => {
    if (audio.isPlaying) return;
    audio.resetTrackingRefs(noteConfig.patternNotes.length);
    audio.playMetronomeOnly(noteConfig.patternNotes.length, () => {
      const result = audio.analyzePerformance(noteConfig.patternNotes, "sing");
      state.setSingResult(result);
      if (result.success) {
        state.resetSingAttempts();
      } else {
        state.incrementSingAttempts();
      }
    });
  }, [audio, noteConfig.patternNotes, state]);

  const handleStartPlay = useCallback(
    (withDrone = false) => {
      if (audio.isPlaying) return;
      audio.resetTrackingRefs(noteConfig.patternNotes.length);
      audio.playMetronomeOnly(
        noteConfig.patternNotes.length,
        () => {
          const result = audio.analyzePerformance(
            noteConfig.patternNotes,
            "play",
          );
          state.setPlayResult(result);
          if (result.success) {
            state.resetPlayAttempts();
          } else {
            state.incrementPlayAttempts();
          }
        },
        withDrone,
        withDrone ? noteConfig.startingNote : undefined,
      );
    },
    [audio, noteConfig, state],
  );

  const handleCompleteExercise = useCallback(() => {
    onComplete({
      success: true,
      details: {
        capability: exerciseConfig.capabilityId,
        patterns: state.progress.completedItems,
        startingNote: midiToNote(sessionStartingNote, false),
      },
    });
  }, [
    onComplete,
    exerciseConfig.capabilityId,
    state.progress.completedItems,
    sessionStartingNote,
  ]);

  // ---------------------------------------------------------------------------
  // Render Props
  // ---------------------------------------------------------------------------
  const renderProps: PhaseRenderProps = {
    phase: state.phase,
    isPlaying: audio.isPlaying,
    currentBeat: audio.currentBeat,
    isSubdivision: audio.isSubdivision,
    showNotation: state.showNotation,
    showCursor: state.showCursor,
    hasHeardPattern: state.hasHeardPattern,
    singResult: state.singResult,
    playResult: state.playResult,
    singAttempts: state.singAttempts,
    playAttempts: state.playAttempts,
    currentFocusCard: state.currentFocusCard,
    currentPattern,
    progress: state.progress,
    showSuccess: state.showSuccess,
    isDroneActive: audio.isDroneActive,
    audioConfig,
    noteConfig,
    currentPitch,
    volume,
    isSounding,
    musicXML,
    goToNextPhase: state.goToNextPhase,
    goToPrevPhase: state.goToPrevPhase,
    setPhase: state.setPhase,
    setShowNotation: state.setShowNotation,
    setSingResult: state.setSingResult,
    setPlayResult: state.setPlayResult,
    resetSingAttempts: state.resetSingAttempts,
    resetPlayAttempts: state.resetPlayAttempts,
    openAttestModal: state.openAttestModal,
    closeAttestModal: state.closeAttestModal,
    confirmAttestation: state.confirmAttestation,
    showAttestModal: state.showAttestModal,
    attestPhase: state.attestPhase,
    markItemComplete: state.markItemComplete,
    goToNextItem: state.goToNextItem,
    goToItem: state.goToItem,
    setShowSuccess: state.setShowSuccess,
    resetForNewRound: state.resetForNewRound,
    incrementSingAttempts: state.incrementSingAttempts,
    incrementPlayAttempts: state.incrementPlayAttempts,
    setHasHeardPattern: state.setHasHeardPattern,
    rotateFocusCard: state.rotateFocusCard,
    playPattern: audio.playPattern,
    playMetronomeOnly: audio.playMetronomeOnly,
    stopPlayback: audio.stopPlayback,
    startDrone: audio.startDrone,
    stopDrone: audio.stopDrone,
    analyzePerformance: audio.analyzePerformance,
    resetTrackingRefs: audio.resetTrackingRefs,
    scrollViewRef,
    trackingRefs: audio.trackingRefs,
  };

  // ---------------------------------------------------------------------------
  // Default Phase Renderers
  // ---------------------------------------------------------------------------
  const renderFocusCardPhase = (): React.JSX.Element => {
    const buttonText = exerciseConfig.focusCardButtonText ?? "Begin →";
    const buttonLabel =
      exerciseConfig.focusCardButtonAccessibilityLabel ?? "Begin exercise";

    return (
      <View style={styles.container}>
        {progressItems.length > 0 && (
          <LessonPhaseProgress items={progressItems} />
        )}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {state.currentFocusCard && (
            <LessonFocusCard focusCard={state.currentFocusCard} />
          )}
          {renderPatternInfo?.(renderProps)}
        </ScrollView>
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            accessibilityLabel={buttonLabel}
            accessibilityRole="button"
            style={styles.primaryButton}
            onPress={state.goToNextPhase}
          >
            <Text style={styles.primaryButtonText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderListenPhase = (): React.JSX.Element => {
    return (
      <View style={styles.container}>
        {progressItems.length > 0 && (
          <LessonPhaseProgress items={progressItems} />
        )}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {state.currentFocusCard && (
            <LessonFocusCardMini focusCard={state.currentFocusCard} />
          )}
          <Text style={styles.phaseTitle}>Listen</Text>
          <Text style={styles.patternDisplay}>
            {currentPattern?.description}
          </Text>
          <Text style={styles.instruction}>
            Listen to the pattern carefully.
          </Text>
          {state.showNotation && (
            <LessonNotationToggle
              showNotation={state.showNotation}
              onToggle={() => state.setShowNotation(!state.showNotation)}
            />
          )}
          {audio.isPlaying && (
            <LessonBeatIndicator
              currentBeat={audio.currentBeat}
              totalBeats={
                noteConfig.patternNotes.length * audioConfig.beatsPerNote
              }
              beatsPerNote={audioConfig.beatsPerNote}
            />
          )}
          {!state.showNotation && (
            <LessonNotationToggle
              showNotation={state.showNotation}
              onToggle={() => state.setShowNotation(!state.showNotation)}
            />
          )}
        </ScrollView>
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            accessibilityLabel={audio.isPlaying ? "Listening" : "Play pattern"}
            accessibilityRole="button"
            style={[
              styles.primaryButton,
              audio.isPlaying && styles.buttonDisabled,
            ]}
            onPress={handlePlayPattern}
            disabled={audio.isPlaying}
          >
            <Text style={styles.primaryButtonText}>
              {audio.isPlaying ? "🎵 Listening..." : "🎵 Play Pattern"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSingPhase = (): React.JSX.Element => {
    return (
      <View style={styles.container}>
        {progressItems.length > 0 && (
          <LessonPhaseProgress items={progressItems} />
        )}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {state.currentFocusCard && (
            <LessonFocusCardMini focusCard={state.currentFocusCard} />
          )}
          <Text style={styles.phaseTitle}>Sing</Text>
          <Text style={styles.patternDisplay}>
            {currentPattern?.description}
          </Text>
          {audio.isPlaying && (
            <LessonBeatIndicator
              currentBeat={audio.currentBeat}
              totalBeats={
                noteConfig.patternNotes.length * audioConfig.beatsPerNote
              }
              beatsPerNote={audioConfig.beatsPerNote}
              playLabel="Sing:"
            />
          )}
          {!state.singResult && !state.showNotation && (
            <View style={styles.volumeContainer}>
              <CircularVolumeIndicator volume={volume} size={100} />
              {isSounding && currentPitch?.noteName && (
                <Text style={styles.hearingText}>
                  Hearing: {currentPitch.noteName}
                </Text>
              )}
            </View>
          )}
          {state.singResult && (
            <LessonResultDisplay
              success={state.singResult.success}
              message={
                state.singResult.success
                  ? "Great singing!"
                  : (state.singResult.message ?? "Try again")
              }
            />
          )}
        </ScrollView>
        <View style={styles.bottomButtons}>
          {state.singResult && !state.singResult.success ? (
            <>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    styles.flexOne,
                    audio.isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => {
                    const notes: PatternNote[] = noteConfig.patternNotes.map(
                      (midi) => ({ midiOrFreq: midi, isMidi: true }),
                    );
                    audio.playPattern(notes);
                  }}
                  disabled={audio.isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>🔊 Hear Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    styles.flexOne,
                    audio.isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => {
                    state.setSingResult(null);
                    setTimeout(handleStartSing, 100);
                  }}
                  disabled={audio.isPlaying}
                >
                  <Text style={styles.primaryButtonText}>🎤 Try Again</Text>
                </TouchableOpacity>
              </View>
              {state.singAttempts >= 3 && (
                <TouchableOpacity
                  style={[styles.tertiaryButton, styles.marginTop8]}
                  onPress={() => state.openAttestModal("sing")}
                >
                  <Text style={styles.tertiaryButtonText}>
                    I sang it correctly →
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : state.singResult?.success ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={state.goToNextPhase}
            >
              <Text style={styles.primaryButtonText}>Continue →</Text>
            </TouchableOpacity>
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
        <LessonAttestationModal
          visible={state.showAttestModal}
          phase={state.attestPhase}
          onCancel={state.closeAttestModal}
          onConfirm={state.confirmAttestation}
        />
      </View>
    );
  };

  const renderImaginePhase = (): React.JSX.Element => {
    return (
      <View style={styles.container}>
        {progressItems.length > 0 && (
          <LessonPhaseProgress items={progressItems} />
        )}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {state.currentFocusCard && (
            <LessonFocusCardMini focusCard={state.currentFocusCard} />
          )}
          <Text style={styles.phaseTitle}>Imagine</Text>
          <Text style={styles.patternDisplay}>
            {currentPattern?.description}
          </Text>
          <Text style={styles.instruction}>
            Imagine playing this pattern on your instrument.
          </Text>
          {audio.isPlaying && (
            <LessonBeatIndicator
              currentBeat={audio.currentBeat}
              totalBeats={
                noteConfig.patternNotes.length * audioConfig.beatsPerNote
              }
              beatsPerNote={audioConfig.beatsPerNote}
            />
          )}
          <View style={styles.imagineVisual}>
            <Text style={styles.imagineEmoji}>🎵</Text>
            <Text style={styles.imagineHint}>
              Hear your instrument in your mind
            </Text>
          </View>
        </ScrollView>
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              audio.isPlaying && styles.buttonDisabled,
            ]}
            onPress={() =>
              audio.playMetronomeOnly(noteConfig.patternNotes.length)
            }
            disabled={audio.isPlaying}
          >
            <Text style={styles.secondaryButtonText}>
              {audio.isPlaying ? "🥁 Counting..." : "🥁 Count with Clicks"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, styles.marginTop8]}
            onPress={state.goToNextPhase}
          >
            <Text style={styles.primaryButtonText}>I Imagined It →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPlayPhase = (): React.JSX.Element => {
    return (
      <View style={styles.container}>
        {progressItems.length > 0 && (
          <LessonPhaseProgress items={progressItems} />
        )}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {state.currentFocusCard && (
            <LessonFocusCardMini focusCard={state.currentFocusCard} />
          )}
          <Text style={styles.phaseTitle}>Play</Text>
          <Text style={styles.patternDisplay}>
            {currentPattern?.description}
          </Text>
          {audio.isPlaying && (
            <LessonBeatIndicator
              currentBeat={audio.currentBeat}
              totalBeats={
                noteConfig.patternNotes.length * audioConfig.beatsPerNote
              }
              beatsPerNote={audioConfig.beatsPerNote}
              playLabel="Play:"
            />
          )}
          {!state.playResult && !state.showNotation && (
            <View style={styles.volumeContainer}>
              <CircularVolumeIndicator volume={volume} size={100} />
              {isSounding && currentPitch?.noteName && (
                <Text style={styles.hearingText}>
                  Hearing: {currentPitch.noteName}
                </Text>
              )}
            </View>
          )}
          {state.playResult && (
            <LessonResultDisplay
              success={state.playResult.success}
              message={
                state.playResult.success
                  ? "Excellent!"
                  : (state.playResult.message ?? "Try again")
              }
            />
          )}
        </ScrollView>
        <View style={styles.bottomButtons}>
          {state.playResult && !state.playResult.success ? (
            <>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    styles.flexOne,
                    audio.isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => {
                    const notes: PatternNote[] = noteConfig.patternNotes.map(
                      (midi) => ({ midiOrFreq: midi, isMidi: true }),
                    );
                    audio.playPattern(notes);
                  }}
                  disabled={audio.isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>🔊 Hear Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    styles.flexOne,
                    audio.isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => {
                    state.setPlayResult(null);
                    setTimeout(() => handleStartPlay(false), 100);
                  }}
                  disabled={audio.isPlaying}
                >
                  <Text style={styles.primaryButtonText}>🎵 Try Again</Text>
                </TouchableOpacity>
              </View>
              {state.playAttempts >= 3 && (
                <TouchableOpacity
                  style={[styles.tertiaryButton, styles.marginTop8]}
                  onPress={() => state.openAttestModal("play")}
                >
                  <Text style={styles.tertiaryButtonText}>
                    I played it correctly →
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : state.playResult?.success ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={state.goToNextPhase}
            >
              <Text style={styles.primaryButtonText}>Continue →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                audio.isPlaying && styles.buttonDisabled,
              ]}
              onPress={() => handleStartPlay(false)}
              disabled={audio.isPlaying}
            >
              <Text style={styles.primaryButtonText}>
                {audio.isPlaying ? "🎺 Play Now..." : "🎺 Start Playing"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <LessonAttestationModal
          visible={state.showAttestModal}
          phase={state.attestPhase}
          onCancel={state.closeAttestModal}
          onConfirm={state.confirmAttestation}
        />
      </View>
    );
  };

  const renderFeedbackPhase = (): React.JSX.Element => {
    // Handle multi-pattern vs single-pattern completion logic
    const handleFeedbackContinue = () => {
      if (exerciseConfig.isMultiPattern && exerciseConfig.patterns) {
        const pattern = exerciseConfig.patterns[state.progress.currentIndex];
        state.markItemComplete(pattern.id);

        // Check if all done
        const newCompleted = {
          ...state.progress.completedItems,
          [pattern.id]: true,
        };
        const allDone = exerciseConfig.patterns.every(
          (p) => newCompleted[p.id],
        );

        if (allDone) {
          state.setShowSuccess(true);
        } else {
          state.goToNextItem();
          state.rotateFocusCard();
          state.resetForNewRound();
          state.setPhase(LESSON_PHASES.FOCUS_CARD);
        }
      } else {
        state.incrementSuccessfulRounds();
        if (state.successfulRounds + 1 >= (exerciseConfig.masteryStreak ?? 3)) {
          state.setShowSuccess(true);
        } else {
          state.resetForNewRound();
          state.setPhase(LESSON_PHASES.LISTEN);
        }
      }
    };

    return (
      <View style={styles.container}>
        {progressItems.length > 0 && (
          <LessonPhaseProgress items={progressItems} />
        )}
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
          </View>
        </ScrollView>
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleFeedbackContinue}
          >
            <Text style={styles.primaryButtonText}>Continue →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSuccessPhase = (): React.JSX.Element => {
    return (
      <View style={styles.container}>
        {progressItems.length > 0 && (
          <LessonPhaseProgress
            items={progressItems}
            allowReplay={true}
            onItemPress={(index) => {
              state.goToItem(index);
              state.resetForNewRound();
              state.setPhase(LESSON_PHASES.LISTEN);
              state.setShowSuccess(false);
            }}
          />
        )}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <LessonSuccessDisplay
            title="All Complete!"
            message={`You've successfully completed ${exerciseConfig.title}.`}
            subtext={
              progressItems.length > 0
                ? "Tap any pattern above to practice again."
                : undefined
            }
          />
        </ScrollView>
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleCompleteExercise}
          >
            <Text style={styles.primaryButtonText}>Complete Lesson →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ---------------------------------------------------------------------------
  // Phase Router
  // ---------------------------------------------------------------------------
  const renderPhase = (): React.JSX.Element => {
    // Check for success state first
    if (state.showSuccess) {
      return customPhaseRenderers.success
        ? (customPhaseRenderers.success(renderProps) as React.JSX.Element)
        : renderSuccessPhase();
    }

    // Check for custom renderer
    if (customPhaseRenderers[state.phase]) {
      return customPhaseRenderers[state.phase](
        renderProps,
      ) as React.JSX.Element;
    }

    // Default phase renderers
    switch (state.phase) {
      case LESSON_PHASES.FOCUS_CARD:
        return renderFocusCardPhase();
      case LESSON_PHASES.LISTEN:
        return renderListenPhase();
      case LESSON_PHASES.SING:
        return renderSingPhase();
      case LESSON_PHASES.IMAGINE:
        return renderImaginePhase();
      case LESSON_PHASES.PLAY:
        return renderPlayPhase();
      case LESSON_PHASES.FEEDBACK:
        return renderFeedbackPhase();
      default:
        return (
          <View style={styles.container}>
            <Text style={styles.phaseTitle}>Unknown Phase: {state.phase}</Text>
          </View>
        );
    }
  };

  return renderPhase();
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

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
  phaseTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f5e6d3",
    textAlign: "center",
    marginBottom: 8,
  },
  patternDisplay: {
    fontSize: 32,
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
    marginBottom: 24,
  },
  volumeContainer: {
    alignItems: "center",
    marginVertical: 24,
  },
  hearingText: {
    fontSize: 16,
    color: "#d4a574",
    marginTop: 12,
  },
  imagineVisual: {
    alignItems: "center",
    marginVertical: 24,
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
  feedbackContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  feedbackEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  feedbackTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f5e6d3",
    marginBottom: 8,
  },
  feedbackPattern: {
    fontSize: 20,
    color: "#d4a574",
    marginBottom: 4,
  },
  feedbackDescription: {
    fontSize: 18,
    color: "#8a7a6a",
  },
  bottomButtons: {
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
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1410",
  },
  secondaryButton: {
    backgroundColor: "#2d241a",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3b2c1a",
  },
  secondaryButtonText: {
    fontSize: 16,
    color: "#d4a574",
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
    opacity: 0.6,
  },
  flexOne: {
    flex: 1,
  },
  marginTop8: {
    marginTop: 8,
  },
});

export default BaseLessonExercise;
