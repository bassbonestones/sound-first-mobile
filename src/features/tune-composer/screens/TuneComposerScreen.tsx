/**
 * TuneComposerScreen
 *
 * Main screen for the Tune Composer feature.
 * A copy of ComposerScreen that will be extended with:
 * - Lyrics editing
 * - Dynamics
 * - Articulations
 * - Expression text
 *
 * Optimized for small screens (320x568 minimum).
 */

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
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
  ScrollView,
  Modal,
  Pressable,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  useWindowDimensions,
} from "react-native";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";
import { useTuneComposerState, useTuneComposerPlayback } from "../hooks";
import {
  CompactTopBar,
  EntryPalette,
  CompactControls,
} from "../../composer/components";
import { TuneComposerScoreViewport } from "../components";
import {
  tuneComposerStorageService,
  createAutosaveHandler,
  generateMusicXml,
} from "../services";
import type {
  TuneComposerScore,
  Clef,
  TimeSignature,
  KeySignature,
  PitchName,
} from "../types";
import ErrorBoundary from "../../../components/ErrorBoundary";
import { composerScoreToImportedScore } from "../../composer/utils";
import { listPreviewFiles, previewMaterial } from "../../../api/materials";
import { parseMusicXml } from "../../importMusic/services/musicXmlParser";
import { importedScoreToComposerScore } from "../utils/importedScoreConverter";

// =============================================================================
// Types
// =============================================================================

// Navigation types for this screen
type TuneComposerParams = {
  scoreId?: string;
};

type RootStackParamListSubset = {
  TuneComposer: TuneComposerParams;
  ImportedScorePractice: {
    score: import("../../../types/import").ImportedScore;
    rawMusicXml: string;
    initialTempo?: number;
  };
};

export interface TuneComposerScreenProps {
  /** Score ID to load (undefined for new score) */
  scoreId?: string;
  /** Called when back navigation is requested */
  onBack?: () => void;
  /** Called when score should be practiced */
  onPractice?: (score: TuneComposerScore) => void;
}

// =============================================================================
// Screen Component
// =============================================================================

function TuneComposerScreenContent({
  scoreId: propScoreId,
  onBack,
  onPractice,
}: TuneComposerScreenProps): React.ReactElement {
  // Navigation
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamListSubset>>();
  const route = useRoute<RouteProp<RootStackParamListSubset, "TuneComposer">>();

  // Get scoreId from props or route params
  const scoreId = propScoreId ?? route.params?.scoreId;

  // Loading state
  const [isLoading, setIsLoading] = useState(!!scoreId);
  const [initialScore, setInitialScore] = useState<
    TuneComposerScore | undefined
  >(undefined);

  // Composer state
  const composerState = useTuneComposerState(initialScore);

  // Playback
  const {
    playback,
    actions: playbackActions,
    // currentEvent available for future playback cursor highlighting
  } = useTuneComposerPlayback(composerState.score);

  // Autosave handler
  const autosaveRef = useRef(createAutosaveHandler(30000));

  // Zoom state
  const [zoom, setZoom] = useState(1.0);

  // Clef change modal state (needed for web where Alert.alert doesn't work)
  const [clefChangeModal, setClefChangeModal] = useState<{
    visible: boolean;
    targetClef: Clef;
  }>({ visible: false, targetClef: "treble" });

  // Key change modal state
  const [keyChangeModal, setKeyChangeModal] = useState<{
    visible: boolean;
    targetKey: KeySignature;
  }>({ visible: false, targetKey: 0 });

  // Add measure prompt modal state
  const [showAddMeasureModal, setShowAddMeasureModal] = useState(false);
  const prevIsAtLastMeasureEnd = useRef(false);

  // Import picker modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<string[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Load existing score or check for autosave recovery
  useEffect(() => {
    const loadScore = async () => {
      if (scoreId) {
        const loaded = await tuneComposerStorageService.loadScore(scoreId);
        if (loaded) {
          setInitialScore(loaded);
        }
      } else {
        // Check for autosave recovery
        const hasAutosave = await tuneComposerStorageService.hasAutosave();
        if (hasAutosave) {
          Alert.alert(
            "Recover Draft?",
            "Found an unsaved score. Would you like to recover it?",
            [
              {
                text: "Discard",
                style: "destructive",
                onPress: () => tuneComposerStorageService.clearAutosave(),
              },
              {
                text: "Recover",
                onPress: async () => {
                  const autosaved =
                    await tuneComposerStorageService.loadAutosave();
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

  // Show add measure modal when user reaches end of last measure
  useEffect(() => {
    // Only show modal when transitioning from false to true
    if (composerState.isAtLastMeasureEnd && !prevIsAtLastMeasureEnd.current) {
      setShowAddMeasureModal(true);
    }
    prevIsAtLastMeasureEnd.current = composerState.isAtLastMeasureEnd;
  }, [composerState.isAtLastMeasureEnd]);

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

  // Clef change - with transposition prompt if there are notes
  const handleClefChange = useCallback(
    (newClef: Clef) => {
      const currentClef = composerState.score.clef;
      if (newClef === currentClef) return;

      // If no actual notes, just change clef without prompting
      if (!composerState.hasActualNotes()) {
        composerState.setClef(newClef);
        return;
      }

      // Show custom modal for transposition options (works on web + native)
      setClefChangeModal({ visible: true, targetClef: newClef });
    },
    [composerState],
  );

  // Handle clef transposition selection from modal
  const handleClefTranspose = useCallback(
    (octaves: number) => {
      composerState.setClefWithTransposition(
        clefChangeModal.targetClef,
        octaves,
      );
      setClefChangeModal({ visible: false, targetClef: "treble" });
    },
    [composerState, clefChangeModal.targetClef],
  );

  // Cancel clef change modal
  const handleClefChangeCancel = useCallback(() => {
    setClefChangeModal({ visible: false, targetClef: "treble" });
  }, []);

  // Time signature change (UI prevents this when notes exist, so no check needed here)
  const handleTimeSignatureChange = useCallback(
    (ts: TimeSignature) => {
      composerState.setTimeSignature(ts);
    },
    [composerState],
  );

  // Key signature change - with transposition prompt if there are notes
  const handleKeySignatureChange = useCallback(
    (key: KeySignature) => {
      const currentKey = composerState.score.keySignature;
      if (key === currentKey) return;

      // If no actual notes, just change key without prompting
      if (!composerState.hasActualNotes()) {
        composerState.setKeySignature(key);
        return;
      }

      // Show custom modal for transposition options
      setKeyChangeModal({ visible: true, targetKey: key });
    },
    [composerState],
  );

  // Convert key signature to root note semitones (C=0, Db=1, D=2, etc.)
  const keyToSemitones = useCallback((key: KeySignature): number => {
    // Each step on circle of fifths = 7 semitones, handle negative modulo
    return (((key * 7) % 12) + 12) % 12;
  }, []);

  // Calculate transpose intervals for key change
  const getKeyTransposeIntervals = useCallback(
    (newKey: KeySignature): { down: number; up: number } => {
      const currentSemitones = keyToSemitones(composerState.score.keySignature);
      const newSemitones = keyToSemitones(newKey);

      // Calculate the interval (can be 0-11)
      const rawInterval = (((newSemitones - currentSemitones) % 12) + 12) % 12;

      // Down interval is negative, up interval is positive
      // e.g., C to Bb: rawInterval = 10, so down = -2, up = +10
      const down = rawInterval === 0 ? 0 : rawInterval - 12;
      const up = rawInterval;

      return { down, up };
    },
    [composerState.score.keySignature, keyToSemitones],
  );

  // Handle key transposition selection from modal
  const handleKeyTranspose = useCallback(
    (semitones: number) => {
      composerState.setKeySignatureWithTransposition(
        keyChangeModal.targetKey,
        semitones,
      );
      setKeyChangeModal({ visible: false, targetKey: 0 });
    },
    [composerState, keyChangeModal.targetKey],
  );

  // Cancel key change modal
  const handleKeyChangeCancel = useCallback(() => {
    setKeyChangeModal({ visible: false, targetKey: 0 });
  }, []);

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

  const handleDeleteLastMeasure = useCallback(() => {
    composerState.deleteLastMeasure();
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

  // Save
  const handleSave = useCallback(async () => {
    await tuneComposerStorageService.saveScore(composerState.score);
    await tuneComposerStorageService.clearAutosave();
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
          tuneComposerStorageService.clearAutosave();
          navigateBack();
        },
      },
      {
        text: "Save",
        onPress: async () => {
          await tuneComposerStorageService.saveScore(composerState.score);
          await tuneComposerStorageService.clearAutosave();
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

  // ==========================================================================
  // Import Handlers
  // ==========================================================================

  // Open import modal and load file list
  const handleOpenImport = useCallback(async () => {
    setShowImportModal(true);
    setIsLoadingFiles(true);
    try {
      const response = await listPreviewFiles();
      setPreviewFiles(response.files);
    } catch (_error) {
      Alert.alert("Error", "Failed to load available files");
      setPreviewFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  // Import a selected file
  const handleImportFile = useCallback(
    async (filename: string) => {
      setIsImporting(true);
      try {
        // Fetch the MusicXML content
        const preview = await previewMaterial(filename);

        // Parse MusicXML to ImportedScore
        const parseResult = await parseMusicXml(preview.musicxml_content, {
          sourceType: "musicxml",
          originalFileName: filename,
          remoteAssetId: null,
        });
        if (!parseResult.success || !parseResult.score) {
          Alert.alert(
            "Parse Error",
            parseResult.error?.message ?? "Failed to parse MusicXML",
          );
          return;
        }

        // Convert to ComposerScore
        const composerScore = importedScoreToComposerScore(parseResult.score, {
          title: preview.title,
        });

        // Load into composer
        composerState.loadScore(composerScore);
        setShowImportModal(false);

        // Show success message
        Alert.alert(
          "Imported",
          `Loaded "${preview.title}" (${composerScore.measures.length} measures)`,
        );
      } catch (err) {
        Alert.alert(
          "Import Error",
          err instanceof Error ? err.message : "Failed to import file",
        );
      } finally {
        setIsImporting(false);
      }
    },
    [composerState],
  );

  // Format filename for display (remove extension, replace underscores)
  const formatFilename = useCallback((filename: string): string => {
    return filename
      .replace(/\.(musicxml|xml|mxl)$/i, "")
      .replace(/_/g, " ")
      .replace(/\//g, " / "); // Format folder paths nicely
  }, []);

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

  // Compute which note should be highlighted
  // During playback: highlight the currently playing note
  // When not playing: highlight the selected note
  const highlightedNoteId = useMemo(() => {
    if (isPlaying) {
      // During playback, highlight the currently playing note
      const { measureIndex, noteIndex } = playback.position;
      const measure = composerState.score.measures[measureIndex];
      if (measure && measure.notes[noteIndex]) {
        return measure.notes[noteIndex].id;
      }
      return null;
    }
    return composerState.state.selectedNoteId;
  }, [
    isPlaying,
    playback.position,
    composerState.score.measures,
    composerState.state.selectedNoteId,
  ]);

  // ==========================================================================
  // Responsive Height Calculation
  // ==========================================================================

  const { height: windowHeight } = useWindowDimensions();

  // Base heights for smallest supported screen (568px)
  const BASE_SCREEN_HEIGHT = 568;
  const BASE_VIEWPORT_HEIGHT = 154;

  // Calculate extra vertical space beyond minimum
  const extraHeight = useMemo(() => {
    const extraSpace = Math.max(0, windowHeight - BASE_SCREEN_HEIGHT);
    return extraSpace;
  }, [windowHeight]);

  // 70% of extra height goes to viewport, 30% distributed to control rows
  const viewportHeight = BASE_VIEWPORT_HEIGHT + extraHeight * 0.7;
  const extraPadding = extraHeight * 0.3;

  // 5 rows total: DurationSelector, PitchSelector, ModifierRow, compactControlsRow, playbackPanel
  const rowExtraPadding = extraPadding / 5;

  // ==========================================================================
  // Swipe Gesture Handling
  // ==========================================================================

  const swipeThreshold = 50;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (
        _evt: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => {
        // Only respond to horizontal swipes
        return (
          Math.abs(gestureState.dx) > 20 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
        );
      },
      onPanResponderRelease: (
        _evt: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => {
        if (isPlaying) return;

        if (gestureState.dx > swipeThreshold) {
          // Swipe right = go left (previous)
          handleLeft();
        } else if (gestureState.dx < -swipeThreshold) {
          // Swipe left = go right (next)
          handleRight();
        }
      },
    }),
  ).current;

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
        {/* Compact Top Bar */}
        <CompactTopBar
          title={composerState.score.title || ""}
          onTitleChange={handleTitleChange}
          clef={composerState.score.clef}
          onClefChange={handleClefChange}
          timeSignature={composerState.score.timeSignature}
          onTimeSignatureChange={handleTimeSignatureChange}
          timeSignatureLocked={composerState.hasActualNotes()}
          keySignature={composerState.score.keySignature}
          onKeySignatureChange={handleKeySignatureChange}
          tempo={composerState.score.tempo}
          onTempoChange={handleTempoChange}
          zoom={zoom}
          onZoomChange={setZoom}
          onClearScore={composerState.clearScore}
          onBack={handleBack}
          disabled={isPlaying}
          testID="composer-topbar"
        />

        {/* Score Viewport with swipe gestures */}
        <View
          style={[styles.viewportWrapper, { height: viewportHeight }]}
          {...panResponder.panHandlers}
        >
          <TuneComposerScoreViewport
            score={composerState.score}
            cursor={composerState.cursor}
            selectedNoteId={highlightedNoteId}
            onNoteTap={handleScoreTap}
            playbackState={playback.state}
            playbackMeasureIndex={playback.position.measureIndex}
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
            zoom={zoom}
            onZoomChange={setZoom}
            showZoomControls={false}
            testID="composer-viewport"
          />
        </View>

        <View style={styles.controlsContainer}>
          {/* Entry Palette - 3 rows get extraRowPadding each */}
          <EntryPalette
            selectedDuration={composerState.state.selectedDuration}
            selectedNote={composerState.selectedNote}
            onDurationSelect={composerState.setDuration}
            dottedMode={composerState.dottedMode}
            onToggleDotted={composerState.toggleDottedMode}
            tripletPosition={
              composerState.tripletPosition as 1 | 2 | 3 | undefined
            }
            tripletGroupType={composerState.tripletGroupType}
            tripletsAllowed={composerState.score.timeSignature.beatUnit === 4}
            canStartTriplet={composerState.canStartTriplet}
            onPitchTap={handlePitchEnter}
            onOctaveChange={composerState.changeOctave}
            onAccidental={composerState.applyAccidental}
            onInsertRest={handleRestEnter}
            onToggleTie={composerState.toggleTie}
            disabled={isPlaying}
            extraRowPadding={rowExtraPadding}
            testID="composer-palette"
          />

          {/* Compact Controls Row */}
          <View
            style={[
              styles.compactControlsRow,
              { paddingVertical: 4 + rowExtraPadding / 2 },
            ]}
          >
            {/* Pitch up/down buttons */}
            <View style={styles.pitchButtons}>
              <TouchableOpacity
                style={[
                  styles.pitchButton,
                  (!hasSelection || isPlaying) && styles.buttonDisabled,
                ]}
                onPress={handleUp}
                disabled={!hasSelection || isPlaying}
                accessibilityLabel="Pitch up"
              >
                <Feather
                  name="chevron-up"
                  size={22}
                  color={
                    hasSelection && !isPlaying
                      ? colors.textPrimary
                      : colors.textSecondary
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pitchButton,
                  (!hasSelection || isPlaying) && styles.buttonDisabled,
                ]}
                onPress={handleDown}
                disabled={!hasSelection || isPlaying}
                accessibilityLabel="Pitch down"
              >
                <Feather
                  name="chevron-down"
                  size={22}
                  color={
                    hasSelection && !isPlaying
                      ? colors.textPrimary
                      : colors.textSecondary
                  }
                />
              </TouchableOpacity>
            </View>

            {/* Compact measure controls with overflow menu */}
            <CompactControls
              currentMeasure={composerState.cursor.measureIndex + 1}
              totalMeasures={composerState.score.measures.length}
              validation={measureValidation}
              onDelete={handleDelete}
              onAddMeasure={handleAddMeasure}
              onDeleteMeasure={handleDeleteMeasure}
              onDeleteLastMeasure={handleDeleteLastMeasure}
              onFillWithRests={handleFillWithRests}
              hasSelection={hasSelection}
              canDeleteMeasure={canDeleteMeasure}
              disabled={isPlaying}
              testID="composer-controls"
            />

            {/* Nav arrows for precise control */}
            <View style={styles.navButtons}>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  (!canGoLeft || isPlaying) && styles.buttonDisabled,
                ]}
                onPress={handleLeft}
                disabled={!canGoLeft || isPlaying}
                accessibilityLabel="Previous"
              >
                <Feather
                  name="chevron-left"
                  size={22}
                  color={
                    canGoLeft && !isPlaying
                      ? colors.textPrimary
                      : colors.textSecondary
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  (!canGoRight || isPlaying) && styles.buttonDisabled,
                ]}
                onPress={handleRight}
                disabled={!canGoRight || isPlaying}
                accessibilityLabel="Next"
              >
                <Feather
                  name="chevron-right"
                  size={22}
                  color={
                    canGoRight && !isPlaying
                      ? colors.textPrimary
                      : colors.textSecondary
                  }
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Playback Panel */}
          <View
            style={[
              styles.playbackPanel,
              { paddingVertical: spacing.sm + rowExtraPadding / 2 },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.transportButton,
                playback.state === "stopped" && styles.buttonDisabled,
              ]}
              onPress={handleStop}
              disabled={playback.state === "stopped"}
              accessibilityLabel="Stop"
              accessibilityRole="button"
            >
              <Feather
                name="square"
                size={18}
                color={
                  playback.state !== "stopped"
                    ? colors.error
                    : colors.textSecondary
                }
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.transportButton,
                playback.state !== "playing" && styles.buttonDisabled,
              ]}
              onPress={handlePause}
              disabled={playback.state !== "playing"}
              accessibilityLabel="Pause"
              accessibilityRole="button"
            >
              <Feather
                name="pause"
                size={18}
                color={
                  playback.state === "playing"
                    ? colors.textPrimary
                    : colors.textSecondary
                }
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.transportButton, styles.playTransportButton]}
              onPress={handlePlay}
              disabled={isPlaying}
              accessibilityLabel="Play"
              accessibilityRole="button"
            >
              <Feather
                name="play"
                size={20}
                color={isPlaying ? colors.textSecondary : colors.white}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.transportButton,
                playback.repeat && styles.repeatActive,
              ]}
              onPress={playbackActions.toggleRepeat}
              accessibilityLabel={playback.repeat ? "Repeat on" : "Repeat off"}
              accessibilityRole="button"
            >
              <Feather
                name="repeat"
                size={18}
                color={playback.repeat ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons - pinned to bottom with fixed 7px below */}
        <View style={[styles.actionRow, { paddingBottom: 7 }]}>
          <TouchableOpacity
            style={[styles.importButton, isPlaying && styles.buttonDisabled]}
            onPress={handleOpenImport}
            disabled={isPlaying}
            accessibilityLabel="Import tune"
            accessibilityRole="button"
            testID="tune-composer-import-button"
          >
            <Feather name="download" size={16} color={colors.primary} />
            <Text style={styles.importButtonText}>Import</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!composerState.allMeasuresValid || isPlaying) &&
                styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!composerState.allMeasuresValid || isPlaying}
            accessibilityLabel="Save score"
            accessibilityRole="button"
            testID="composer-save-button"
          >
            <Text
              style={[
                styles.saveButtonText,
                (!composerState.allMeasuresValid || isPlaying) &&
                  styles.saveButtonTextDisabled,
              ]}
            >
              Save
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.practiceButton,
              (!composerState.allMeasuresValid || isPlaying) &&
                styles.practiceButtonDisabled,
            ]}
            onPress={handlePractice}
            disabled={!composerState.allMeasuresValid || isPlaying}
            accessibilityLabel="Practice this score"
            accessibilityRole="button"
            testID="composer-practice-button"
          >
            <Text style={styles.practiceButtonText}>Practice</Text>
          </TouchableOpacity>
        </View>

        {/* Clef Change Transposition Modal */}
        <Modal
          visible={clefChangeModal.visible}
          transparent
          animationType="fade"
          onRequestClose={handleClefChangeCancel}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={handleClefChangeCancel}
          >
            <View
              style={styles.modalContent}
              onStartShouldSetResponder={() => true}
            >
              <Text style={styles.modalTitle}>Transpose Notes?</Text>
              <Text style={styles.modalMessage}>
                You have notes on the staff. How would you like to transpose
                them when switching to{" "}
                {clefChangeModal.targetClef === "bass" ? "bass" : "treble"}{" "}
                clef?
              </Text>
              {clefChangeModal.targetClef === "bass" ? (
                <>
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => handleClefTranspose(0)}
                  >
                    <Text style={styles.modalOptionText}>No Transpose</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => handleClefTranspose(-1)}
                  >
                    <Text style={styles.modalOptionText}>Octave Down</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => handleClefTranspose(-2)}
                  >
                    <Text style={styles.modalOptionText}>2 Octaves Down</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => handleClefTranspose(0)}
                  >
                    <Text style={styles.modalOptionText}>No Transpose</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => handleClefTranspose(1)}
                  >
                    <Text style={styles.modalOptionText}>Octave Up</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => handleClefTranspose(2)}
                  >
                    <Text style={styles.modalOptionText}>2 Octaves Up</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={handleClefChangeCancel}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        {/* Key Change Transposition Modal */}
        <Modal
          visible={keyChangeModal.visible}
          transparent
          animationType="fade"
          onRequestClose={handleKeyChangeCancel}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={handleKeyChangeCancel}
          >
            <View
              style={styles.modalContent}
              onStartShouldSetResponder={() => true}
            >
              <Text style={styles.modalTitle}>Transpose Notes?</Text>
              <Text style={styles.modalMessage}>
                You have notes on the staff. How would you like to handle them
                when changing key?
              </Text>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => handleKeyTranspose(0)}
              >
                <Text style={styles.modalOptionText}>Keep Pitch</Text>
              </TouchableOpacity>
              {(() => {
                const { down, up } = getKeyTransposeIntervals(
                  keyChangeModal.targetKey,
                );
                return (
                  <>
                    <TouchableOpacity
                      style={styles.modalOption}
                      onPress={() => handleKeyTranspose(up)}
                    >
                      <Text style={styles.modalOptionText}>Transpose Up</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalOption}
                      onPress={() => handleKeyTranspose(down)}
                    >
                      <Text style={styles.modalOptionText}>Transpose Down</Text>
                    </TouchableOpacity>
                  </>
                );
              })()}
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={handleKeyChangeCancel}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        {/* Add Measure Prompt Modal */}
        <Modal
          visible={showAddMeasureModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddMeasureModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowAddMeasureModal(false)}
          >
            <View
              style={styles.modalContent}
              onStartShouldSetResponder={() => true}
            >
              <Text style={styles.modalTitle}>Add New Measure?</Text>
              <Text style={styles.modalMessage}>
                You've reached the end of the last measure. Would you like to
                add another measure?
              </Text>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  composerState.addMeasure();
                  setShowAddMeasureModal(false);
                }}
                testID="add-measure-confirm"
              >
                <Text style={styles.modalOptionText}>Add Measure at End</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowAddMeasureModal(false)}
                testID="add-measure-cancel"
              >
                <Text style={styles.modalCancelText}>No Thanks</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        {/* Import Tune Modal */}
        <Modal
          visible={showImportModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowImportModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => !isImporting && setShowImportModal(false)}
          >
            <View
              style={[styles.modalContent, styles.importModalContent]}
              onStartShouldSetResponder={() => true}
            >
              <Text style={styles.modalTitle}>Import Tune</Text>
              <Text style={styles.modalMessage}>
                Select a tune from the preview folder to load into the composer.
              </Text>

              {isLoadingFiles ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ marginVertical: spacing.md }}
                />
              ) : previewFiles.length === 0 ? (
                <Text style={styles.emptyMessage}>
                  No files available. Add MusicXML files to
                  resources/materials/pending/
                </Text>
              ) : (
                <ScrollView
                  style={styles.fileList}
                  showsVerticalScrollIndicator={true}
                >
                  {previewFiles.map((filename) => (
                    <TouchableOpacity
                      key={filename}
                      style={styles.fileOption}
                      onPress={() => handleImportFile(filename)}
                      disabled={isImporting}
                    >
                      <Feather
                        name="music"
                        size={16}
                        color={colors.primary}
                        style={{ marginRight: spacing.sm }}
                      />
                      <Text
                        style={[
                          styles.fileOptionText,
                          isImporting && styles.textDisabled,
                        ]}
                        numberOfLines={2}
                      >
                        {formatFilename(filename)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {isImporting && (
                <View style={styles.importingOverlay}>
                  <ActivityIndicator size="small" color={colors.white} />
                  <Text style={styles.importingText}>Loading...</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowImportModal(false)}
                disabled={isImporting}
              >
                <Text
                  style={[
                    styles.modalCancelText,
                    isImporting && styles.textDisabled,
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// =============================================================================
// Wrapped with Error Boundary
// =============================================================================

export function TuneComposerScreen(
  props: TuneComposerScreenProps,
): React.ReactElement {
  return (
    <ErrorBoundary>
      <TuneComposerScreenContent {...props} />
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
  controlsContainer: {
    // No flex - stacks components at their natural heights
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  // Viewport
  viewportWrapper: {
    minHeight: 120,
    position: "relative",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  // Compact controls row
  compactControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pitchButtons: {
    flexDirection: "row",
    gap: 4,
  },
  pitchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  navButtons: {
    flexDirection: "row",
    gap: 4,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Playback panel
  playbackPanel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  transportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  playTransportButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  repeatActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  // Action buttons - pinned to bottom
  actionRow: {
    flexDirection: "row",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    flex: 1,
    marginRight: spacing.sm,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  saveButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  practiceButton: {
    flex: 1,
    marginLeft: spacing.sm,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  practiceButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  practiceButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  saveButtonDisabled: {
    borderColor: colors.textSecondary,
    opacity: 0.5,
  },
  saveButtonTextDisabled: {
    color: colors.textSecondary,
  },
  // Clef change modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    width: "85%",
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  modalOption: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionText: {
    fontSize: 16,
    color: colors.primary,
    textAlign: "center",
  },
  modalCancel: {
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  modalCancelText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
  // Import button styles
  importButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    minHeight: 44,
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    marginRight: spacing.sm,
  },
  importButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: spacing.xs,
  },
  // Import modal styles
  importModalContent: {
    maxHeight: "70%",
  },
  fileList: {
    maxHeight: 300,
    marginVertical: spacing.sm,
  },
  fileOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fileOptionText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  importingOverlay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    marginVertical: spacing.sm,
  },
  importingText: {
    color: colors.white,
    fontSize: 14,
    marginLeft: spacing.sm,
  },
  textDisabled: {
    opacity: 0.5,
  },
});
