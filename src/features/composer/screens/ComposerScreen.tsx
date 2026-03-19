/**
 * ComposerScreen
 *
 * Main screen for the Practice Composer feature.
 * Assembles all composer components into a complete editing experience.
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Text,
} from "react-native";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { colors, spacing } from "../../../constants";
import { useComposerState, useComposerPlayback } from "../hooks";
import {
  ComposerTopBar,
  ComposerScoreViewport,
  EntryPalette,
  NavigationControls,
  MeasureControls,
  ComposerTransport,
} from "../components";
import {
  composerStorageService,
  createAutosaveHandler,
  generateMusicXml,
} from "../services";
import type {
  ComposerScore,
  Clef,
  TimeSignature,
  KeySignature,
  PitchName,
} from "../types";
import ErrorBoundary from "../../../components/ErrorBoundary";
import { composerScoreToImportedScore } from "../utils";

// =============================================================================
// Types
// =============================================================================

// Navigation types for this screen
type ComposerParams = {
  scoreId?: string;
};

type RootStackParamListSubset = {
  Composer: ComposerParams;
  ImportedScorePractice: {
    score: import("../../../types/import").ImportedScore;
    rawMusicXml: string;
    initialTempo?: number;
  };
};

export interface ComposerScreenProps {
  /** Score ID to load (undefined for new score) */
  scoreId?: string;
  /** Called when back navigation is requested */
  onBack?: () => void;
  /** Called when score should be practiced */
  onPractice?: (score: ComposerScore) => void;
}

// =============================================================================
// Screen Component
// =============================================================================

function ComposerScreenContent({
  scoreId: propScoreId,
  onBack,
  onPractice,
}: ComposerScreenProps): React.ReactElement {
  // Navigation
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamListSubset>>();
  const route = useRoute<RouteProp<RootStackParamListSubset, "Composer">>();

  // Get scoreId from props or route params
  const scoreId = propScoreId ?? route.params?.scoreId;

  // Loading state
  const [isLoading, setIsLoading] = useState(!!scoreId);
  const [initialScore, setInitialScore] = useState<ComposerScore | undefined>(
    undefined,
  );

  // Composer state
  const composerState = useComposerState(initialScore);

  // Playback
  const {
    playback,
    actions: playbackActions,
    // currentEvent available for future playback cursor highlighting
  } = useComposerPlayback(composerState.score);

  // Autosave handler
  const autosaveRef = useRef(createAutosaveHandler(30000));

  // Load existing score or check for autosave recovery
  useEffect(() => {
    const loadScore = async () => {
      if (scoreId) {
        const loaded = await composerStorageService.loadScore(scoreId);
        if (loaded) {
          setInitialScore(loaded);
        }
      } else {
        // Check for autosave recovery
        const hasAutosave = await composerStorageService.hasAutosave();
        if (hasAutosave) {
          Alert.alert(
            "Recover Draft?",
            "Found an unsaved score. Would you like to recover it?",
            [
              {
                text: "Discard",
                style: "destructive",
                onPress: () => composerStorageService.clearAutosave(),
              },
              {
                text: "Recover",
                onPress: async () => {
                  const autosaved = await composerStorageService.loadAutosave();
                  if (autosaved) {
                    setInitialScore(autosaved);
                  }
                },
              },
            ],
          );
        }
      }
      setIsLoading(false);
    };

    loadScore();
  }, [scoreId]);

  // Schedule autosave when score changes
  useEffect(() => {
    if (composerState.score && !isLoading) {
      autosaveRef.current.scheduleAutosave(composerState.score);
    }
  }, [composerState.score, isLoading]);

  // Cleanup autosave on unmount
  useEffect(() => {
    const handler = autosaveRef.current;
    return () => {
      handler.cancelAutosave();
    };
  }, []);

  // ==========================================================================
  // Handlers
  // ==========================================================================

  // Title change
  const handleTitleChange = useCallback(
    (title: string) => {
      composerState.setTitle(title);
    },
    [composerState],
  );

  // Clef change
  const handleClefChange = useCallback(
    (clef: Clef) => {
      composerState.setClef(clef);
    },
    [composerState],
  );

  // Time signature change
  const handleTimeSignatureChange = useCallback(
    (ts: TimeSignature) => {
      composerState.setTimeSignature(ts);
    },
    [composerState],
  );

  // Key signature change
  const handleKeySignatureChange = useCallback(
    (key: KeySignature) => {
      composerState.setKeySignature(key);
    },
    [composerState],
  );

  // Tempo change
  const handleTempoChange = useCallback(
    (tempo: number) => {
      composerState.setTempo(tempo);
      playbackActions.setTempo(tempo);
    },
    [composerState, playbackActions],
  );

  // Note entry via pitch name
  const handlePitchEnter = useCallback(
    (pitchName: PitchName) => {
      composerState.insertNote(pitchName);
    },
    [composerState],
  );

  // Rest entry
  const handleRestEnter = useCallback(() => {
    composerState.insertRest();
  }, [composerState]);

  // Navigation
  const handleLeft = useCallback(() => {
    composerState.moveCursor("left");
  }, [composerState]);

  const handleRight = useCallback(() => {
    composerState.moveCursor("right");
  }, [composerState]);

  const handleUp = useCallback(() => {
    composerState.changePitch("up");
  }, [composerState]);

  const handleDown = useCallback(() => {
    composerState.changePitch("down");
  }, [composerState]);

  const handleDelete = useCallback(() => {
    composerState.deleteNote();
  }, [composerState]);

  // Measure management
  const handleAddMeasure = useCallback(() => {
    composerState.addMeasure();
  }, [composerState]);

  const handleDeleteMeasure = useCallback(() => {
    composerState.deleteMeasure();
  }, [composerState]);

  const handleFillWithRests = useCallback(() => {
    composerState.fillMeasureWithRests();
  }, [composerState]);

  // Playback
  const handlePlay = useCallback(() => {
    playbackActions.play();
  }, [playbackActions]);

  const handlePause = useCallback(() => {
    playbackActions.pause();
  }, [playbackActions]);

  const handleStop = useCallback(() => {
    playbackActions.stop();
  }, [playbackActions]);

  const handlePlayFromCursor = useCallback(() => {
    playbackActions.playFromCursor(
      composerState.cursor.measureIndex,
      composerState.cursor.noteIndex,
    );
  }, [playbackActions, composerState.cursor]);

  const handlePlayMeasure = useCallback(() => {
    playbackActions.playMeasure(composerState.cursor.measureIndex);
  }, [playbackActions, composerState.cursor.measureIndex]);

  // Save
  const handleSave = useCallback(async () => {
    await composerStorageService.saveScore(composerState.score);
    await composerStorageService.clearAutosave();
    Alert.alert("Saved", "Your score has been saved.");
  }, [composerState.score]);

  // Back navigation helper
  const navigateBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [onBack, navigation]);

  // Back with save prompt
  const handleBack = useCallback(() => {
    Alert.alert("Save Changes?", "Would you like to save before leaving?", [
      {
        text: "Discard",
        style: "destructive",
        onPress: () => {
          composerStorageService.clearAutosave();
          navigateBack();
        },
      },
      {
        text: "Save",
        onPress: async () => {
          await composerStorageService.saveScore(composerState.score);
          await composerStorageService.clearAutosave();
          navigateBack();
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [composerState.score, navigateBack]);

  // Practice handler
  const handlePractice = useCallback(() => {
    if (onPractice) {
      onPractice(composerState.score);
    } else {
      // Convert to ImportedScore and navigate
      const importedScore = composerScoreToImportedScore(composerState.score);
      const rawMusicXml = generateMusicXml(composerState.score);
      navigation.navigate("ImportedScorePractice", {
        score: importedScore,
        rawMusicXml,
        initialTempo: composerState.score.tempo,
      });
    }
  }, [composerState.score, onPractice, navigation]);

  // Score tap handler (uses note ID now)
  const handleScoreTap = useCallback(
    (measureIndex: number, noteIndex: number) => {
      // Get the note ID from the measure
      const measure = composerState.score.measures[measureIndex];
      const note = measure?.notes[noteIndex];
      if (note) {
        composerState.selectNote(note.id);
      }
    },
    [composerState],
  );

  // ==========================================================================
  // Computed Values
  // ==========================================================================

  const currentMeasure =
    composerState.score.measures[composerState.cursor.measureIndex];
  const measureValidation = composerState.currentMeasureValidation;

  const hasSelection = composerState.selectedNote !== null;
  const canGoLeft =
    composerState.cursor.measureIndex > 0 || composerState.cursor.noteIndex > 0;
  const canGoRight =
    composerState.cursor.measureIndex <
      composerState.score.measures.length - 1 ||
    composerState.cursor.noteIndex < (currentMeasure?.notes.length ?? 0);
  const canDeleteMeasure = composerState.score.measures.length > 1;

  const isPlaying = playback.state === "playing";

  // ==========================================================================
  // Render
  // ==========================================================================

  if (isLoading) {
    return (
      <View style={styles.loadingContainer} testID="composer-loading">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID="composer-screen">
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Top Bar */}
        <ComposerTopBar
          title={composerState.score.title || ""}
          onTitleChange={handleTitleChange}
          clef={composerState.score.clef}
          onClefChange={handleClefChange}
          timeSignature={composerState.score.timeSignature}
          onTimeSignatureChange={handleTimeSignatureChange}
          keySignature={composerState.score.keySignature}
          onKeySignatureChange={handleKeySignatureChange}
          tempo={composerState.score.tempo}
          onTempoChange={handleTempoChange}
          onBack={handleBack}
          disabled={isPlaying}
          testID="composer-topbar"
        />

        {/* Score Viewport */}
        <View style={styles.viewportContainer}>
          <ComposerScoreViewport
            score={composerState.score}
            cursor={composerState.cursor}
            selectedNoteId={composerState.state.selectedNoteId}
            onNoteTap={handleScoreTap}
            testID="composer-viewport"
          />
        </View>

        {/* Entry Palette */}
        <EntryPalette
          selectedDuration={composerState.state.selectedDuration}
          selectedNote={composerState.selectedNote}
          onDurationSelect={composerState.setDuration}
          onPitchTap={handlePitchEnter}
          onOctaveChange={composerState.changeOctave}
          onAccidental={composerState.applyAccidental}
          onInsertRest={handleRestEnter}
          onToggleTie={composerState.toggleTie}
          disabled={isPlaying}
          testID="composer-palette"
        />

        {/* Navigation Controls */}
        <View style={styles.controlsRow}>
          <NavigationControls
            onLeft={handleLeft}
            onRight={handleRight}
            onUp={handleUp}
            onDown={handleDown}
            onDelete={handleDelete}
            canGoLeft={canGoLeft}
            canGoRight={canGoRight}
            hasSelection={hasSelection}
            disabled={isPlaying}
            testID="composer-nav"
          />

          <MeasureControls
            currentMeasure={composerState.cursor.measureIndex + 1}
            totalMeasures={composerState.score.measures.length}
            validation={measureValidation}
            onAddMeasure={handleAddMeasure}
            onDeleteMeasure={handleDeleteMeasure}
            onFillWithRests={handleFillWithRests}
            canDelete={canDeleteMeasure}
            disabled={isPlaying}
            testID="composer-measure"
          />
        </View>

        {/* Transport */}
        <ComposerTransport
          state={playback.state}
          position={playback.position}
          tempo={playback.tempo}
          totalMeasures={composerState.score.measures.length}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          onPlayFromCursor={handlePlayFromCursor}
          onPlayMeasure={handlePlayMeasure}
          testID="composer-transport"
        />

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isPlaying}
            accessibilityLabel="Save score"
            accessibilityRole="button"
            testID="composer-save-button"
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.practiceButton}
            onPress={handlePractice}
            disabled={isPlaying}
            accessibilityLabel="Practice this score"
            accessibilityRole="button"
            testID="composer-practice-button"
          >
            <Text style={styles.practiceButtonText}>Practice</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// =============================================================================
// Wrapped with Error Boundary
// =============================================================================

export function ComposerScreen(props: ComposerScreenProps): React.ReactElement {
  return (
    <ErrorBoundary>
      <ComposerScreenContent {...props} />
    </ErrorBoundary>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  viewportContainer: {
    flex: 1,
    minHeight: 200,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  saveButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  practiceButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  practiceButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
