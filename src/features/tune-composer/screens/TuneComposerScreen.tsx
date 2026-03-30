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
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useState,
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
  TextInput,
  ScrollView,
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
import {
  useTuneComposerState,
  useTuneComposerPlayback,
  usePracticeOverChanges,
  useTuneComposerScreen,
} from "../hooks";
import {
  CompactTopBar,
  EntryPalette,
  CompactControls,
  SlurControls,
} from "../../composer/components";
import {
  TuneComposerScoreViewport,
  LyricsControls,
  ExpressionControls,
  DynamicsControls,
  ChordControlsConnected,
  PracticeOverChangesControls,
  PracticeScoreViewport,
  ClefChangeModal,
  KeyChangeModal,
  ChordStyleModal,
  AddMeasureModal,
  AddPickupModal,
  ImportTuneModal,
  SaveNewFileModal,
  RhythmChangeModal,
  TuneMetadataModal,
  MeasureTempoModal,
  MeasureKeySignatureModal,
  MeasureTimeSignatureModal,
} from "../components";
import {
  ChordProgressionProvider,
  ChordModeProvider,
  PlaybackProvider,
} from "../contexts";
import {
  tuneComposerStorageService,
  createAutosaveHandler,
  generateMusicXml,
} from "../services";
import { tuneMetadataService } from "../services/tuneMetadataService";
import type { TuneMetadata } from "../types/tuneMetadataTypes";
import { createDefaultMetadata } from "../types/tuneMetadataTypes";
import type {
  TuneComposerScore,
  Clef,
  TimeSignature,
  KeySignature,
  PitchName,
} from "../types";
import { getPitchedNotes, getMeasureDuration, getNoteDuration } from "../types";
import ErrorBoundary from "../../../components/ErrorBoundary";
import { composerScoreToImportedScore } from "../../composer/utils";
import { getKeyName } from "../../composer/constants/keySignatures";
import {
  listPreviewFiles,
  previewMaterial,
  savePreviewFile,
  createPreviewFile,
  deletePreviewFile,
} from "../../../api/materials";
import { analyzeChords } from "../../../api/tunes";
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

  // Screen-level state (loading, zoom, modals, import, file IO, etc)
  const screenState = useTuneComposerScreen(scoreId);
  const {
    // Loading
    isLoading,
    initialScore,
    setIsLoading,
    setInitialScore,
    // Zoom
    zoom,
    setZoom,
    // Modals
    clefChangeModal,
    keyChangeModal,
    chordStyleModalVisible,
    showAddMeasureModal,
    showImportModal,
    showSaveNewModal,
    showClefChangeModal,
    hideClefChangeModal,
    showKeyChangeModal,
    hideKeyChangeModal,
    setChordStyleModalVisible,
    setShowAddMeasureModal,
    setShowImportModal,
    setShowSaveNewModal,
    // Metadata modal
    showMetadataModal,
    setShowMetadataModal,
    // Import
    previewFiles,
    isLoadingFiles,
    isImporting,
    setPreviewFiles,
    setIsLoadingFiles,
    setIsImporting,
    // File
    currentFilename,
    isSaving,
    newFilename,
    setCurrentFilename,
    setIsSaving,
    setNewFilename,
    // Processing
    isInferringChords,
    setIsInferringChords,
    // Mode
    isProgressionEditMode,
    toggleProgressionEditMode,
  } = screenState;

  // Pickup modal state
  const [showPickupModal, setShowPickupModal] = useState(false);

  // Tempo modal state
  const [showTempoModal, setShowTempoModal] = useState(false);

  // Key signature modal state
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Time signature modal state
  const [showTimeModal, setShowTimeModal] = useState(false);

  // Metadata state
  const [tuneMetadata, setTuneMetadata] = useState<TuneMetadata>(() =>
    createDefaultMetadata(),
  );
  const [isMetadataSaving, setIsMetadataSaving] = useState(false);

  // Composer state
  const composerState = useTuneComposerState(initialScore);

  // Sync initialScore changes into composerState
  // (useState only reads initial value once, so we need this effect)
  useEffect(() => {
    if (initialScore) {
      composerState.loadScore(initialScore);
    }
  }, [initialScore]); // Don't include composerState.loadScore to avoid loops

  // Playback
  const {
    playback,
    actions: playbackActions,
    // currentEvent available for future playback cursor highlighting
  } = useTuneComposerPlayback(composerState.score);

  // Practice over changes
  const practice = usePracticeOverChanges(composerState.score);

  // Autosave handler
  const autosaveRef = useRef(createAutosaveHandler(30000));

  // Add measure prompt - track previous state for auto-show
  const prevIsAtLastMeasureEnd = useRef(false);

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

  // New score - reset to blank
  const handleNewScore = useCallback(() => {
    composerState.newScore();
    setCurrentFilename(null);
    setTuneMetadata(createDefaultMetadata());
    // Clear autosave since we're starting fresh
    tuneComposerStorageService.clearAutosave();
  }, [composerState, setCurrentFilename]);

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
      showClefChangeModal(newClef);
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
      hideClefChangeModal();
    },
    [composerState, clefChangeModal.targetClef, hideClefChangeModal],
  );

  // Cancel clef change modal
  const handleClefChangeCancel = useCallback(() => {
    hideClefChangeModal();
  }, [hideClefChangeModal]);

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
      showKeyChangeModal(key);
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
      hideKeyChangeModal();
    },
    [composerState, keyChangeModal.targetKey, hideKeyChangeModal],
  );

  // Cancel key change modal
  const handleKeyChangeCancel = useCallback(() => {
    hideKeyChangeModal();
  }, [hideKeyChangeModal]);

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
  // Chord Inference Handler
  // ==========================================================================

  // Actual inference logic - called with selected options
  const performInferChords = useCallback(
    async (useSeventhChords: boolean, chordsPerMeasure: 1 | 2) => {
      const measures = composerState.score.measures;
      setIsInferringChords(true);
      try {
        // Convert measures to the format expected by the API
        // API expects 'pitch' field with MIDI number (Note type uses 'midi')
        const measuresJson = JSON.stringify(
          measures.map((m) => ({
            id: m.id,
            notes: m.notes.map((n) => ({
              pitch: n.midi,
              duration: n.duration,
              isRest: n.midi === null,
            })),
          })),
        );

        const result = await analyzeChords({
          measures_json: measuresJson,
          key_signature: composerState.score.keySignature,
          time_signature: {
            beats: composerState.score.timeSignature.beats,
            beatUnit: composerState.score.timeSignature.beatUnit,
          },
          use_seventh_chords: useSeventhChords,
          chords_per_measure: chordsPerMeasure,
        });

        if (result.chord_count === 0) {
          Alert.alert(
            "No Chords Inferred",
            "Could not infer any chords from the melody.",
          );
          return;
        }

        // Populate the active progression with inferred chords
        // Does NOT create a new progression - admin can "Save As" if desired
        composerState.setActiveProgressionChords(result.progression.chords);

        Alert.alert(
          "Chords Inferred",
          `Added ${result.chord_count} chord${result.chord_count > 1 ? "s" : ""} to the active progression.`,
        );
      } catch (error) {
        Alert.alert(
          "Inference Failed",
          error instanceof Error
            ? error.message
            : "Could not connect to the server.",
        );
      } finally {
        setIsInferringChords(false);
      }
    },
    [composerState],
  );

  // Show style selection and then perform inference
  const handleInferChords = useCallback(() => {
    if (isInferringChords) return;

    const measures = composerState.score.measures;
    if (!measures || measures.length === 0) {
      Alert.alert(
        "No Melody",
        "Add some notes to the score before inferring chords.",
      );
      return;
    }

    // Check if there are any pitched notes (midi !== null means it's not a rest)
    const hasPitchedNotes = measures.some((m) =>
      m.notes.some((n) => n.midi !== null),
    );
    if (!hasPitchedNotes) {
      Alert.alert(
        "No Notes",
        "Add some pitched notes to the score before inferring chords.",
      );
      return;
    }

    // Show chord style selection modal
    setChordStyleModalVisible(true);
  }, [composerState, isInferringChords]);

  // Clear all chords from active progression with confirmation
  const handleClearChords = useCallback(() => {
    const chordCount = composerState.activeProgression?.chords.length ?? 0;
    if (chordCount === 0) {
      if (Platform.OS === "web") {
        window.alert("There are no chords to clear.");
      } else {
        Alert.alert("No Chords", "There are no chords to clear.");
      }
      return;
    }

    const message = `Are you sure you want to remove all ${chordCount} chord${chordCount > 1 ? "s" : ""} from this progression?`;

    if (Platform.OS === "web") {
      if (window.confirm(message)) {
        composerState.clearActiveProgressionChords();
      }
    } else {
      Alert.alert("Clear All Chords", message, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: composerState.clearActiveProgressionChords,
        },
      ]);
    }
  }, [
    composerState.activeProgression?.chords.length,
    composerState.clearActiveProgressionChords,
  ]);

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
        let composerScore = importedScoreToComposerScore(parseResult.score, {
          title: preview.title,
        });

        // Check if we have a previously saved score for this file
        // and preserve its playback settings (like swing)
        const existingSave =
          await tuneComposerStorageService.findScoreByImportedFrom(filename);
        // Load metadata for this file (do this before setting the score
        // so we can apply saved playback settings)
        const metadata = await tuneMetadataService.loadOrCreateMetadata(
          filename,
          preview.title,
        );
        setTuneMetadata(metadata);

        // Apply playbackSettings from metadata if present
        if (metadata.playbackSettings) {
          composerScore = {
            ...composerScore,
            playbackSettings: metadata.playbackSettings,
          };
        }

        // Load into composer and track filename
        composerState.loadScore(composerScore);
        setCurrentFilename(filename);
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

  // Save to current file (requires existing filename)
  const handleSave = useCallback(async () => {
    if (!currentFilename) {
      // No current file, prompt for save as new
      setShowSaveNewModal(true);
      return;
    }

    setIsSaving(true);
    try {
      const musicxml = generateMusicXml(composerState.score, {
        exportMode: true,
      });
      await savePreviewFile(currentFilename, musicxml);

      // Also save playback settings to metadata
      const updatedMetadata: TuneMetadata = {
        ...tuneMetadata,
        playbackSettings: composerState.score.playbackSettings,
        updatedAt: new Date().toISOString(),
      };
      await tuneMetadataService.saveMetadata(currentFilename, updatedMetadata);
      setTuneMetadata(updatedMetadata);

      const msg = `File saved: ${formatFilename(currentFilename)}`;
      if (Platform.OS === "web") {
        window.alert(msg);
      } else {
        Alert.alert("Saved", msg);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to save file";
      if (Platform.OS === "web") {
        window.alert(`Save Error: ${errMsg}`);
      } else {
        Alert.alert("Save Error", errMsg);
      }
    } finally {
      setIsSaving(false);
    }
  }, [currentFilename, composerState.score, tuneMetadata, formatFilename]);

  // Open save new modal
  const handleSaveNew = useCallback(() => {
    // Pre-fill with title converted to filename format
    const suggestedName = composerState.score.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    setNewFilename(suggestedName || "untitled");
    setShowSaveNewModal(true);
  }, [composerState.score.title]);

  // Confirm save new
  const handleConfirmSaveNew = useCallback(async () => {
    if (!newFilename.trim()) {
      if (Platform.OS === "web") {
        window.alert("Please enter a filename");
      } else {
        Alert.alert("Error", "Please enter a filename");
      }
      return;
    }

    setIsSaving(true);
    try {
      const musicxml = generateMusicXml(composerState.score, {
        exportMode: true,
      });
      // Add folder prefix (beginner by default) and extension
      const fullFilename = `beginner/${newFilename.trim()}`;
      const result = await createPreviewFile(fullFilename, musicxml);
      setCurrentFilename(result.filename);
      setShowSaveNewModal(false);
      const msg = `New file created: ${formatFilename(result.filename)}`;
      if (Platform.OS === "web") {
        window.alert(msg);
      } else {
        Alert.alert("Created", msg);
      }
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : "Failed to create file";
      if (Platform.OS === "web") {
        window.alert(`Create Error: ${errMsg}`);
      } else {
        Alert.alert("Create Error", errMsg);
      }
    } finally {
      setIsSaving(false);
    }
  }, [newFilename, composerState.score, formatFilename]);

  // Delete the current file
  const handleDeleteFile = useCallback(async () => {
    if (!currentFilename) {
      Alert.alert("No File", "No file is currently loaded to delete.");
      return;
    }

    const confirmDelete =
      Platform.OS === "web"
        ? window.confirm(
            `Are you sure you want to delete "${formatFilename(currentFilename)}"? This cannot be undone.`,
          )
        : await new Promise<boolean>((resolve) => {
            Alert.alert(
              "Delete File?",
              `Are you sure you want to delete "${formatFilename(currentFilename)}"? This cannot be undone.`,
              [
                {
                  text: "Cancel",
                  style: "cancel",
                  onPress: () => resolve(false),
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => resolve(true),
                },
              ],
            );
          });

    if (!confirmDelete) return;

    setIsSaving(true);
    try {
      await deletePreviewFile(currentFilename);
      // Also delete the metadata file (no error if it doesn't exist)
      await tuneMetadataService.deleteMetadata(currentFilename);
      if (Platform.OS === "web") {
        window.alert(`File deleted: ${formatFilename(currentFilename)}`);
      } else {
        Alert.alert(
          "Deleted",
          `File deleted: ${formatFilename(currentFilename)}`,
        );
      }
      // Clear current filename and reset to empty score
      setCurrentFilename(null);
      composerState.clearScore();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete file";
      if (Platform.OS === "web") {
        window.alert(`Delete Error: ${message}`);
      } else {
        Alert.alert("Delete Error", message);
      }
    } finally {
      setIsSaving(false);
    }
  }, [currentFilename, formatFilename, composerState]);

  // Open metadata modal
  const handleOpenMetadata = useCallback(() => {
    if (!currentFilename) {
      const message = "Save the file first before editing metadata.";
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("No File", message);
      }
      return;
    }
    setShowMetadataModal(true);
  }, [currentFilename, setShowMetadataModal]);

  // Save metadata
  const handleSaveMetadata = useCallback(
    async (metadata: TuneMetadata) => {
      if (!currentFilename) return;

      setIsMetadataSaving(true);
      try {
        await tuneMetadataService.saveMetadata(currentFilename, metadata);
        setTuneMetadata(metadata);
        setShowMetadataModal(false);
        const msg = "Metadata saved!";
        if (Platform.OS === "web") {
          window.alert(msg);
        } else {
          Alert.alert("Saved", msg);
        }
      } catch (err) {
        const errMsg =
          err instanceof Error ? err.message : "Failed to save metadata";
        if (Platform.OS === "web") {
          window.alert(`Error: ${errMsg}`);
        } else {
          Alert.alert("Error", errMsg);
        }
      } finally {
        setIsMetadataSaving(false);
      }
    },
    [currentFilename, setShowMetadataModal],
  );

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
  // Lyrics Mode Helper Data
  // ==========================================================================

  const lyricsData = useMemo(() => {
    const pitchedNotes = getPitchedNotes(composerState.score);
    const totalNotes = pitchedNotes.length;
    const lyricsCursor = composerState.lyricsCursor;
    const currentNoteIndex = lyricsCursor !== null ? lyricsCursor + 1 : 0; // 1-based for display
    const canGoPrev = lyricsCursor !== null && lyricsCursor > 0;
    const canGoNext = lyricsCursor !== null && lyricsCursor < totalNotes - 1;

    // Get cursor position for scrolling
    let lyricsCursorPosition: {
      measureIndex: number;
      noteIndex: number;
    } | null = null;

    // Get current lyric text, syllabic type, and note id
    let currentLyricText = "";
    let currentSyllabic: "single" | "begin" | "middle" | "end" | undefined;
    let prevSyllabic: "single" | "begin" | "middle" | "end" | undefined;
    let currentNoteId: string | null = null;

    if (lyricsCursor !== null && pitchedNotes[lyricsCursor]) {
      const noteInfo = pitchedNotes[lyricsCursor];
      lyricsCursorPosition = {
        measureIndex: noteInfo.measureIndex,
        noteIndex: noteInfo.noteIndex,
      };
      const note =
        composerState.score.measures[noteInfo.measureIndex]?.notes[
          noteInfo.noteIndex
        ];
      if (note) {
        currentNoteId = note.id;
        if (note.lyric) {
          currentLyricText = note.lyric.text;
          currentSyllabic = note.lyric.syllabic;
        }
      }

      // Get previous note's syllabic (if there is a previous note)
      // Trace back through melisma continuation notes to find actual syllabic
      if (lyricsCursor > 0) {
        for (let i = lyricsCursor - 1; i >= 0; i--) {
          const prevNoteInfo = pitchedNotes[i];
          if (!prevNoteInfo) break;
          const prevNote =
            composerState.score.measures[prevNoteInfo.measureIndex]?.notes[
              prevNoteInfo.noteIndex
            ];
          if (prevNote?.lyric?.syllabic) {
            prevSyllabic = prevNote.lyric.syllabic;
            break;
          }
          // If note has lyric with melismaLength > 1, we're in a melisma
          // Keep the syllabic from that note (begin/middle means word continues)
          if (
            prevNote?.lyric?.melismaLength &&
            prevNote.lyric.melismaLength > 1
          ) {
            prevSyllabic = prevNote.lyric.syllabic || "middle";
            break;
          }
        }
      }
    }

    return {
      totalNotes,
      currentNoteIndex,
      canGoPrev,
      canGoNext,
      currentLyricText,
      currentSyllabic,
      prevSyllabic,
      currentNoteId,
      lyricsCursorPosition,
    };
  }, [composerState.score, composerState.lyricsCursor]);

  // Compute which note should be highlighted
  // During playback: highlight the currently playing note
  // In lyrics mode: highlight the note at lyricsCursor
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
    // In lyrics mode, highlight the note at lyricsCursor
    if (composerState.lyricsMode) {
      return lyricsData.currentNoteId;
    }
    return composerState.state.selectedNoteId;
  }, [
    isPlaying,
    playback.position,
    composerState.score.measures,
    composerState.state.selectedNoteId,
    composerState.lyricsMode,
    lyricsData.currentNoteId,
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
          tempoBeatUnit={composerState.score.tempoBeatUnit ?? "quarter"}
          onTempoBeatUnitChange={composerState.setTempoBeatUnit}
          zoom={zoom}
          onZoomChange={setZoom}
          onClearScore={composerState.clearScore}
          onNewScore={handleNewScore}
          onBack={handleBack}
          disabled={isPlaying}
          displayTitle={
            tuneMetadata.title !== "Untitled Tune"
              ? tuneMetadata.title
              : undefined
          }
          testID="composer-topbar"
          swingEnabled={composerState.swingEnabled}
          onSwingEnabledChange={composerState.setSwingEnabled}
        />

        {/* Score Viewport with swipe gestures - fixed at top */}
        <PlaybackProvider
          playbackState={playback.state}
          playbackMeasureIndex={playback.position.measureIndex}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
        >
          <View
            style={[styles.viewportWrapper, { height: viewportHeight }]}
            {...panResponder.panHandlers}
          >
            <TuneComposerScoreViewport
              score={composerState.score}
              cursor={composerState.cursor}
              selectedNoteId={highlightedNoteId}
              chordCursor={
                composerState.chordMode ? composerState.chordCursor : null
              }
              lyricsCursorPosition={
                composerState.lyricsMode
                  ? lyricsData.lyricsCursorPosition
                  : null
              }
              onNoteTap={handleScoreTap}
              zoom={zoom}
              onZoomChange={setZoom}
              showZoomControls={false}
              playbackNoteIndex={playback.position.noteIndex}
              playbackBeat={playback.position.beat}
              testID="composer-viewport"
            />
          </View>
        </PlaybackProvider>

        {/* Scrollable controls section */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.controlsContainer}>
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
                onAddPickup={() => setShowPickupModal(true)}
                hasPickup={composerState.hasPickup}
                onEditMetadata={handleOpenMetadata}
                onSetMeasureTempo={() => setShowTempoModal(true)}
                measureTempo={
                  composerState.score.measures[
                    composerState.cursor.measureIndex
                  ]?.tempo
                }
                onSetMeasureKey={() => setShowKeyModal(true)}
                measureKeyDisplay={
                  composerState.score.measures[
                    composerState.cursor.measureIndex
                  ]?.keySignature !== undefined
                    ? getKeyName(
                        composerState.score.measures[
                          composerState.cursor.measureIndex
                        ]!.keySignature!,
                      )
                    : undefined
                }
                onSetMeasureTime={() => setShowTimeModal(true)}
                measureTimeDisplay={
                  composerState.score.measures[
                    composerState.cursor.measureIndex
                  ]?.timeSignature !== undefined
                    ? `${composerState.score.measures[composerState.cursor.measureIndex]!.timeSignature!.beats}/${composerState.score.measures[composerState.cursor.measureIndex]!.timeSignature!.beatUnit}`
                    : undefined
                }
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

            {/* Entry Palette - 4 rows get extraRowPadding each */}
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
              onArticulation={composerState.setArticulation}
              onRemoveArticulation={composerState.removeArticulation}
              activeArticulation={composerState.selectedNote?.articulation}
              disabled={isPlaying}
              extraRowPadding={rowExtraPadding}
              testID="composer-palette"
            />

            {/* Slur Controls */}
            <SlurControls
              slurModeActive={composerState.slurMode}
              onToggleSlurMode={composerState.toggleSlurMode}
              onStartSlur={composerState.startSlur}
              onExtendSlurLeft={composerState.extendSlurLeft}
              onExtendSlurRight={composerState.extendSlurRight}
              onRemoveSlur={composerState.removeSlur}
              onFlipSlur={composerState.flipSlur}
              onDone={composerState.endSlurMode}
              hasSelection={hasSelection}
              hasActiveSlur={composerState.activeSlurStartId !== null}
              selectedNoteHasSlur={
                composerState.selectedNote?.slurStart === true ||
                composerState.selectedNote?.slurEnd === true
              }
              canExtendLeft={composerState.activeSlurStartId !== null}
              canExtendRight={composerState.activeSlurEndId !== null}
              disabled={isPlaying}
              testID="slur-controls"
            />

            {/* Lyrics Controls */}
            <LyricsControls
              lyricsModeActive={composerState.lyricsMode}
              onToggleLyricsMode={composerState.toggleLyricsMode}
              currentLyricText={lyricsData.currentLyricText}
              currentSyllabic={lyricsData.currentSyllabic}
              prevSyllabic={lyricsData.prevSyllabic}
              onSetLyric={composerState.setLyric}
              onRemoveLyric={composerState.removeLyric}
              onNextNote={composerState.moveLyricsCursorNext}
              onPrevNote={composerState.moveLyricsCursorPrev}
              onExtendMelisma={composerState.extendMelisma}
              onShrinkMelisma={composerState.shrinkMelisma}
              canGoPrev={lyricsData.canGoPrev}
              canGoNext={lyricsData.canGoNext}
              currentNoteIndex={lyricsData.currentNoteIndex}
              totalNotes={lyricsData.totalNotes}
              hasSelection={hasSelection}
              disabled={isPlaying}
              testID="lyrics-controls"
            />

            {/* Expression Controls */}
            <ExpressionControls
              expressionModeActive={composerState.expressionMode}
              onToggleExpressionMode={composerState.toggleExpressionMode}
              currentExpression={composerState.selectedNote?.expression || ""}
              onSetExpression={composerState.setExpression}
              onRemoveExpression={composerState.removeExpression}
              hasSelection={hasSelection}
              disabled={isPlaying}
              testID="expression-controls"
            />

            {/* Dynamics Controls */}
            <DynamicsControls
              dynamicsModeActive={composerState.dynamicsMode}
              onToggleDynamicsMode={composerState.toggleDynamicsMode}
              currentDynamic={composerState.selectedNote?.dynamic}
              currentDynamicText={composerState.selectedNote?.dynamicText}
              onSetDynamic={composerState.setDynamic}
              onRemoveDynamic={composerState.removeDynamic}
              onSetDynamicText={composerState.setDynamicText}
              onRemoveDynamicText={composerState.removeDynamicText}
              wedgeModeActive={composerState.wedgeMode}
              onToggleWedgeMode={composerState.toggleWedgeMode}
              onStartCrescendo={composerState.startCrescendo}
              onStartDiminuendo={composerState.startDiminuendo}
              onExtendWedge={composerState.extendWedge}
              onEndWedgeMode={composerState.endWedgeMode}
              onRemoveWedgeMarking={composerState.removeWedgeMarking}
              activeWedgeType={composerState.activeWedgeType}
              activeWedgeStartId={composerState.activeWedgeStartId}
              selectedNoteHasWedge={!!composerState.selectedNote?.wedge}
              hasSelection={hasSelection}
              disabled={isPlaying}
              testID="dynamics-controls"
            />

            {/* Chord Controls */}
            <ChordModeProvider
              chordModeActive={composerState.chordMode}
              onToggleChordMode={composerState.toggleChordMode}
              currentChordSymbol={composerState.currentChordSymbol}
              onSetChord={composerState.setChordAtCursor}
              onRemoveChord={composerState.removeChordAtCursor}
              onNextBeat={composerState.moveChordCursorNext}
              onPrevBeat={composerState.moveChordCursorPrev}
              canGoPrev={composerState.canChordCursorGoPrev}
              canGoNext={composerState.canChordCursorGoNext}
              subdivision={composerState.chordSubdivision}
              onCycleSubdivision={composerState.cycleChordSubdivision}
              currentPosition={
                composerState.chordCursor ?? {
                  measureIndex: 0,
                  beatPosition: 0,
                }
              }
              hasSelection={composerState.chordCursor !== null}
              showChordSymbols={composerState.showChordSymbols}
              onToggleVisibility={composerState.toggleChordSymbolVisibility}
              onInferChords={handleInferChords}
              isInferring={isInferringChords}
              onClearChords={handleClearChords}
              disabled={isPlaying}
            >
              <ChordProgressionProvider
                progressions={composerState.chordProgressions}
                activeProgressionId={composerState.activeProgression?.id}
                onSelectProgression={composerState.selectProgression}
                onCreateProgression={composerState.createProgression}
                onDuplicateProgression={(sourceId, newName) => {
                  composerState.duplicateProgression(
                    sourceId,
                    newName ?? "New Progression",
                  );
                }}
                onDeleteProgression={composerState.deleteProgression}
                onRenameProgression={composerState.renameProgression}
                isEditMode={isProgressionEditMode}
                onToggleEditMode={toggleProgressionEditMode}
                disabled={isPlaying}
              >
                <ChordControlsConnected
                  onChordInputChange={composerState.setChordAtCursor}
                  testID="chord-controls"
                />
              </ChordProgressionProvider>
            </ChordModeProvider>

            {/* Practice Over Changes Controls */}
            <PracticeOverChangesControls
              practiceActive={practice.practiceState.isActive}
              onTogglePracticeMode={practice.togglePracticeMode}
              practiceState={practice.practiceState}
              hasChords={practice.hasChords}
              tuneTempo={composerState.score.tempo}
              effectiveTempo={practice.effectiveTempo}
              onSetContentType={practice.setContentType}
              onSetPattern={practice.setPattern}
              onSetRhythm={practice.setRhythm}
              onSetTempoOverride={practice.setTempoOverride}
              onSetRange={practice.setRange}
              onGenerate={practice.generate}
              onClear={practice.clearGenerated}
              hasGeneratedContent={practice.hasGeneratedContent}
              disabled={isPlaying}
              testID="practice-controls"
            />

            {/* Practice Score Viewport (when content is generated) */}
            {practice.hasGeneratedContent && (
              <PracticeScoreViewport
                segments={practice.practiceState.segments}
                events={practice.practiceState.events}
                totalBeats={practice.practiceState.totalBeats}
                title={`${practice.practiceState.contentType === "scales" ? "Scales" : practice.practiceState.contentType === "arpeggios" ? "Arpeggios" : "Guide Tones"} Over Changes`}
                timeSignature={composerState.score.timeSignature}
                keySignature={composerState.score.keySignature}
                clef={composerState.score.clef}
                tempo={practice.effectiveTempo}
                testID="practice-viewport"
              />
            )}

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
                accessibilityLabel={
                  playback.repeat ? "Repeat on" : "Repeat off"
                }
                accessibilityRole="button"
              >
                <Feather
                  name="repeat"
                  size={18}
                  color={
                    playback.repeat ? colors.primary : colors.textSecondary
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

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
              styles.deleteFileButton,
              (!currentFilename || isPlaying || isSaving) &&
                styles.deleteFileButtonDisabled,
            ]}
            onPress={handleDeleteFile}
            disabled={!currentFilename || isPlaying || isSaving}
            accessibilityLabel="Delete current file"
            accessibilityRole="button"
            testID="composer-delete-file-button"
          >
            <Feather
              name="trash-2"
              size={16}
              color={
                currentFilename && !isPlaying && !isSaving
                  ? colors.error
                  : colors.textSecondary
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!composerState.allMeasuresValid || isPlaying || isSaving) &&
                styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!composerState.allMeasuresValid || isPlaying || isSaving}
            accessibilityLabel="Save score"
            accessibilityRole="button"
            testID="composer-save-button"
          >
            <Text
              style={[
                styles.saveButtonText,
                (!composerState.allMeasuresValid || isPlaying || isSaving) &&
                  styles.saveButtonTextDisabled,
              ]}
            >
              {isSaving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.saveNewButton,
              (!composerState.allMeasuresValid || isPlaying || isSaving) &&
                styles.saveNewButtonDisabled,
            ]}
            onPress={handleSaveNew}
            disabled={!composerState.allMeasuresValid || isPlaying || isSaving}
            accessibilityLabel="Save as new file"
            accessibilityRole="button"
            testID="composer-save-new-button"
          >
            <Text
              style={[
                styles.saveNewButtonText,
                (!composerState.allMeasuresValid || isPlaying || isSaving) &&
                  styles.saveNewButtonTextDisabled,
              ]}
            >
              Save New
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
        <ClefChangeModal
          visible={clefChangeModal.visible}
          targetClef={clefChangeModal.targetClef}
          onSelectTranspose={handleClefTranspose}
          onCancel={handleClefChangeCancel}
        />

        {/* Key Change Transposition Modal */}
        <KeyChangeModal
          visible={keyChangeModal.visible}
          upInterval={getKeyTransposeIntervals(keyChangeModal.targetKey).up}
          downInterval={getKeyTransposeIntervals(keyChangeModal.targetKey).down}
          onSelectTranspose={handleKeyTranspose}
          onCancel={handleKeyChangeCancel}
        />

        {/* Chord Style Selection Modal */}
        <ChordStyleModal
          visible={chordStyleModalVisible}
          onSelect={(selection) => {
            setChordStyleModalVisible(false);
            performInferChords(
              selection.useJazzChords,
              selection.chordsPerMeasure,
            );
          }}
          onCancel={() => setChordStyleModalVisible(false)}
        />

        {/* Add Measure Prompt Modal */}
        <AddMeasureModal
          visible={showAddMeasureModal}
          onConfirm={() => {
            composerState.addMeasure();
            setShowAddMeasureModal(false);
          }}
          onCancel={() => setShowAddMeasureModal(false)}
        />

        {/* Add/Edit Pickup Modal */}
        <AddPickupModal
          visible={showPickupModal}
          timeSignature={composerState.score.timeSignature}
          hasPickup={composerState.hasPickup}
          currentPickupDuration={composerState.pickupDuration}
          onConfirm={(duration) => {
            composerState.setPickupMeasure(duration);
            setShowPickupModal(false);
          }}
          onRemove={() => {
            composerState.removePickupMeasure();
            setShowPickupModal(false);
          }}
          onCancel={() => setShowPickupModal(false)}
        />

        {/* Import Tune Modal */}
        <ImportTuneModal
          visible={showImportModal}
          files={previewFiles}
          isLoadingFiles={isLoadingFiles}
          isImporting={isImporting}
          onSelectFile={handleImportFile}
          onCancel={() => setShowImportModal(false)}
        />

        {/* Save New File Modal */}
        <SaveNewFileModal
          visible={showSaveNewModal}
          filename={newFilename}
          onFilenameChange={setNewFilename}
          isSaving={isSaving}
          onConfirm={handleConfirmSaveNew}
          onCancel={() => setShowSaveNewModal(false)}
        />

        {/* Rhythm Change Confirmation Modal */}
        <RhythmChangeModal
          visible={!!composerState.pendingRhythmChange}
          hasChords={composerState.pendingRhythmChange?.hasChords ?? false}
          hasLyrics={composerState.pendingRhythmChange?.hasLyrics ?? false}
          onConfirm={composerState.confirmRhythmChange}
          onCancel={composerState.cancelRhythmChange}
        />

        {/* Tune Metadata Modal */}
        <TuneMetadataModal
          visible={showMetadataModal}
          metadata={tuneMetadata}
          onSave={handleSaveMetadata}
          onCancel={() => setShowMetadataModal(false)}
          isSaving={isMetadataSaving}
        />

        {/* Measure Tempo Modal */}
        <MeasureTempoModal
          visible={showTempoModal}
          onClose={() => setShowTempoModal(false)}
          measureNumber={composerState.cursor.measureIndex + 1}
          currentTempo={
            composerState.score.measures[composerState.cursor.measureIndex]
              ?.tempo
          }
          effectiveTempo={composerState.getMeasureEffectiveTempo(
            composerState.cursor.measureIndex,
          )}
          scoreTempo={composerState.score.tempo}
          onSetTempo={(tempo) => {
            composerState.setMeasureTempo(
              composerState.cursor.measureIndex,
              tempo,
            );
            setShowTempoModal(false);
          }}
          onClearTempo={() => {
            composerState.clearCurrentMeasureTempo();
            setShowTempoModal(false);
          }}
          currentBeatUnit={
            composerState.score.measures[composerState.cursor.measureIndex]
              ?.tempoBeatUnit
          }
          effectiveBeatUnit={composerState.getMeasureEffectiveTempoBeatUnit(
            composerState.cursor.measureIndex,
          )}
          onSetBeatUnit={(beatUnit) => {
            composerState.setMeasureTempoBeatUnit(
              composerState.cursor.measureIndex,
              beatUnit,
            );
          }}
          onClearBeatUnit={() => {
            composerState.clearCurrentMeasureTempoBeatUnit();
          }}
        />

        {/* Measure Key Signature Modal */}
        <MeasureKeySignatureModal
          visible={showKeyModal}
          onClose={() => setShowKeyModal(false)}
          measureNumber={composerState.cursor.measureIndex + 1}
          currentKey={
            composerState.score.measures[composerState.cursor.measureIndex]
              ?.keySignature
          }
          effectiveKey={composerState.getMeasureEffectiveKeySignature(
            composerState.cursor.measureIndex,
          )}
          scoreKey={composerState.score.keySignature}
          onSetKey={(key) => {
            composerState.setMeasureKeySignature(
              composerState.cursor.measureIndex,
              key,
            );
            setShowKeyModal(false);
          }}
          onClearKey={() => {
            composerState.clearCurrentMeasureKeySignature();
            setShowKeyModal(false);
          }}
        />

        {/* Measure Time Signature Modal */}
        <MeasureTimeSignatureModal
          visible={showTimeModal}
          onClose={() => setShowTimeModal(false)}
          measureNumber={composerState.cursor.measureIndex + 1}
          currentTime={
            composerState.score.measures[composerState.cursor.measureIndex]
              ?.timeSignature
          }
          effectiveTime={composerState.getMeasureEffectiveTimeSignature(
            composerState.cursor.measureIndex,
          )}
          pitchedNoteDuration={
            // Only count pitched notes (not rests) for overflow validation
            composerState.score.measures[
              composerState.cursor.measureIndex
            ]?.notes
              .filter((n) => n.midi !== null)
              .reduce((sum, n) => sum + getNoteDuration(n), 0) ?? 0
          }
          onSetTime={(time) => {
            composerState.setMeasureTimeSignature(
              composerState.cursor.measureIndex,
              time,
            );
            setShowTimeModal(false);
          }}
          onClearTime={() => {
            composerState.clearCurrentMeasureTimeSignature();
            setShowTimeModal(false);
          }}
        />
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
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  saveNewButton: {
    flex: 1,
    marginRight: spacing.sm,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.success,
  },
  saveNewButtonText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: "600",
  },
  saveNewButtonDisabled: {
    borderColor: colors.textSecondary,
    opacity: 0.5,
  },
  saveNewButtonTextDisabled: {
    color: colors.textSecondary,
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
  deleteFileButton: {
    width: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.error,
    marginRight: spacing.sm,
  },
  deleteFileButtonDisabled: {
    borderColor: colors.textSecondary,
    opacity: 0.5,
  },
});
