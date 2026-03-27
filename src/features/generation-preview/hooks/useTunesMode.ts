/**
 * useTunesMode
 *
 * Custom hook for managing the tunes browser mode state and actions.
 * Uses useReducer for centralized state management.
 */
import { useReducer, useCallback, useEffect, useMemo } from "react";
import { devLog, devError } from "../../../utils/devLogger";
import {
  listPreviewFiles,
  previewMaterial,
  getSolfege,
  transposeMaterial,
  analyzeMaterial,
  type MaterialPreviewResponse,
  type MaterialAnalysis,
} from "../../../api/materials";
import type { MusicalKey } from "../../../api/generation";
import {
  generationPlayback,
  type PlaybackState,
} from "../../../services/generationPlayback";
import type { ClefType } from "../../../utils/generationNotation";
import { tunesModeReducer } from "../reducers";
import {
  type ClefChangeModalState,
  type KeyChangeModalState,
  initialTunesModeState,
} from "../types";

// =============================================================================
// Types
// =============================================================================

// Re-export modal state types for backwards compatibility
export type { ClefChangeModalState, KeyChangeModalState } from "../types";

/** Return type for useTunesMode */
export interface UseTunesModeReturn {
  // File list state
  previewFiles: string[];
  selectedPreviewFile: string | null;
  isLoadingPreview: boolean;
  previewError: string | null;
  previewResponse: MaterialPreviewResponse | null;

  // Tempo
  previewTempo: number;
  handlePreviewTempoChange: (bpm: number) => void;

  // Playback state (shared with generator, but managed here for tunes)
  playbackState: PlaybackState;
  currentNoteIndex: number | null;

  // Solfège
  showSolfege: boolean;
  solfegeXml: string | null;
  isLoadingSolfege: boolean;
  handleSolfegeToggle: () => Promise<void>;

  // Clef/Key transposition
  tuneClef: ClefType;
  tuneKey: MusicalKey;
  transposedXml: string | null;
  isTransposing: boolean;

  // Clef change modal
  clefChangeModal: ClefChangeModalState;
  handleTuneClefChange: (clef: ClefType) => void;
  handleClefTranspose: (octaves: number) => Promise<void>;
  handleClefChangeCancel: () => void;

  // Key change modal
  keyChangeModal: KeyChangeModalState;
  handleTuneKeyChange: (key: MusicalKey) => void;
  handleKeyTranspose: (semitones: number) => Promise<void>;
  handleKeyChangeCancel: () => void;
  getKeyTransposeIntervals: (targetKey: MusicalKey) => {
    down: number;
    up: number;
  };

  // Material analysis
  materialAnalysis: MaterialAnalysis | null;
  isLoadingAnalysis: boolean;

  // Actions
  loadPreviewFiles: () => Promise<void>;
  handlePreviewFile: (filename: string) => Promise<void>;

  // Playback controls
  handlePlay: () => Promise<void>;
  handlePause: () => void;
  handleStop: () => void;

  // Computed
  displayXml: string | null;
}

// =============================================================================
// Constants
// =============================================================================

/** Key to semitones mapping */
const KEY_TO_SEMITONES: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

// =============================================================================
// Hook
// =============================================================================

export function useTunesMode(): UseTunesModeReturn {
  // Single reducer for all state
  const [state, dispatch] = useReducer(tunesModeReducer, initialTunesModeState);

  // Destructure state for easier access
  const { file, playback, solfege, transposition, modal, analysis } = state;

  // ==========================================================================
  // Computed Values
  // ==========================================================================

  // Computed: display XML (transposed if available, else solfege if enabled, else original)
  const displayXml = useMemo(() => {
    return (
      transposition.transposedXml ||
      (solfege.showSolfege && solfege.solfegeXml) ||
      file.previewResponse?.musicxml_content ||
      null
    );
  }, [
    transposition.transposedXml,
    solfege.showSolfege,
    solfege.solfegeXml,
    file.previewResponse,
  ]);

  // ==========================================================================
  // Action Handlers
  // ==========================================================================

  // Load preview files
  const loadPreviewFiles = useCallback(async () => {
    try {
      const result = await listPreviewFiles();
      dispatch({ type: "SET_PREVIEW_FILES", payload: result.files });
      devLog("[TunesMode] Loaded preview files:", result.files);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      devError("[TunesMode] Failed to load preview files:", error);
      dispatch({ type: "SET_PREVIEW_ERROR", payload: message });
    }
  }, []);

  // Tempo control
  const handlePreviewTempoChange = useCallback((bpm: number) => {
    dispatch({ type: "SET_PREVIEW_TEMPO", payload: bpm });
    generationPlayback.setTempo(bpm);
  }, []);

  // Load preview for selected file
  const handlePreviewFile = useCallback(
    async (filename: string) => {
      if (!filename) return;

      dispatch({ type: "PREVIEW_LOAD_START", payload: filename });
      generationPlayback.stop();

      try {
        const result = await previewMaterial(filename);
        dispatch({ type: "PREVIEW_LOAD_SUCCESS", payload: result });
        devLog("[TunesMode] Preview result:", result);

        // Load playback events if available
        if (result.playback_events && result.playback_events.length > 0) {
          generationPlayback.load(result.playback_events, {
            tempo: result.tempo_bpm || file.previewTempo,
            onStateChange: (newPlaybackState) =>
              dispatch({
                type: "SET_PLAYBACK_STATE",
                payload: newPlaybackState,
              }),
            onProgress: (noteIndex) =>
              dispatch({ type: "SET_CURRENT_NOTE_INDEX", payload: noteIndex }),
            onComplete: () => {
              dispatch({ type: "PLAYBACK_COMPLETE" });
              devLog("[TunesMode] Preview playback complete");
            },
          });
          devLog(
            "[TunesMode] Loaded",
            result.playback_events.length,
            "events for playback",
          );
        }

        // Run material analysis
        if (result.musicxml_content) {
          dispatch({ type: "ANALYSIS_START" });
          try {
            const analysisResult = await analyzeMaterial(
              result.musicxml_content,
              filename,
            );
            dispatch({ type: "ANALYSIS_SUCCESS", payload: analysisResult });
            devLog("[TunesMode] Material analysis:", analysisResult);
          } catch (analysisError) {
            devError("[TunesMode] Material analysis failed:", analysisError);
            dispatch({ type: "ANALYSIS_ERROR" });
          }
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        devError("[TunesMode] Preview failed:", error);
        dispatch({ type: "PREVIEW_LOAD_ERROR", payload: message });
      }
    },
    [file.previewTempo],
  );

  // Solfège toggle
  const handleSolfegeToggle = useCallback(async () => {
    const newShowSolfege = !solfege.showSolfege;
    dispatch({ type: "TOGGLE_SOLFEGE" });

    if (newShowSolfege && !solfege.solfegeXml && file.selectedPreviewFile) {
      dispatch({ type: "SET_IS_LOADING_SOLFEGE", payload: true });
      try {
        const result = await getSolfege(
          file.selectedPreviewFile,
          transposition.tuneKey,
        );
        dispatch({ type: "SOLFEGE_LOAD_SUCCESS", payload: result.solfege_xml });
        devLog("[TunesMode] Solfège loaded for key:", result.key_used);
      } catch (error) {
        devError("[TunesMode] Solfège fetch failed:", error);
        dispatch({ type: "SOLFEGE_LOAD_ERROR" });
      }
    }
  }, [
    solfege.showSolfege,
    solfege.solfegeXml,
    file.selectedPreviewFile,
    transposition.tuneKey,
  ]);

  // Clef change - show modal
  const handleTuneClefChange = useCallback(
    (newClef: ClefType) => {
      if (!file.previewResponse || newClef === transposition.tuneClef) return;
      dispatch({ type: "SHOW_CLEF_CHANGE_MODAL", payload: newClef });
    },
    [file.previewResponse, transposition.tuneClef],
  );

  // Clef transposition from modal
  const handleClefTranspose = useCallback(
    async (octaves: number) => {
      const targetClef = modal.clefChangeModal.targetClef;
      dispatch({ type: "HIDE_CLEF_CHANGE_MODAL" });
      dispatch({ type: "TRANSPOSE_START" });

      try {
        const result = await transposeMaterial(
          file.previewResponse?.musicxml_content ?? "",
          { octaves, target_clef: targetClef },
        );
        dispatch({
          type: "TRANSPOSE_SUCCESS",
          payload: { xml: result.musicxml_content, clef: targetClef },
        });
        devLog(
          "[TunesMode] Transposed to clef:",
          targetClef,
          "octaves:",
          octaves,
        );
      } catch (error) {
        devError("[TunesMode] Clef transpose failed:", error);
        dispatch({ type: "TRANSPOSE_ERROR" });
      }
    },
    [modal.clefChangeModal.targetClef, file.previewResponse],
  );

  // Cancel clef change
  const handleClefChangeCancel = useCallback(() => {
    dispatch({ type: "HIDE_CLEF_CHANGE_MODAL" });
  }, []);

  // Key change - show modal
  const handleTuneKeyChange = useCallback(
    (newKey: MusicalKey) => {
      if (!file.previewResponse || newKey === transposition.tuneKey) return;
      dispatch({ type: "SHOW_KEY_CHANGE_MODAL", payload: newKey });
    },
    [file.previewResponse, transposition.tuneKey],
  );

  // Calculate transpose intervals for key change
  const getKeyTransposeIntervals = useCallback(
    (targetKey: MusicalKey): { down: number; up: number } => {
      const currentSemitones = KEY_TO_SEMITONES[transposition.tuneKey] ?? 0;
      const newSemitones = KEY_TO_SEMITONES[targetKey] ?? 0;

      const rawInterval = (((newSemitones - currentSemitones) % 12) + 12) % 12;
      const down = rawInterval === 0 ? 0 : rawInterval - 12;
      const up = rawInterval;

      return { down, up };
    },
    [transposition.tuneKey],
  );

  // Key transposition from modal
  const handleKeyTranspose = useCallback(
    async (semitones: number) => {
      const targetKey = modal.keyChangeModal.targetKey;
      dispatch({ type: "HIDE_KEY_CHANGE_MODAL" });
      dispatch({ type: "TRANSPOSE_START" });

      try {
        const result = await transposeMaterial(
          file.previewResponse?.musicxml_content ?? "",
          { semitones, target_clef: transposition.tuneClef },
        );
        dispatch({
          type: "TRANSPOSE_SUCCESS",
          payload: { xml: result.musicxml_content, key: targetKey },
        });
        devLog(
          "[TunesMode] Transposed to key:",
          targetKey,
          "semitones:",
          semitones,
        );
      } catch (error) {
        devError("[TunesMode] Key transpose failed:", error);
        dispatch({ type: "TRANSPOSE_ERROR" });
      }
    },
    [
      modal.keyChangeModal.targetKey,
      file.previewResponse,
      transposition.tuneClef,
    ],
  );

  // Cancel key change
  const handleKeyChangeCancel = useCallback(() => {
    dispatch({ type: "HIDE_KEY_CHANGE_MODAL" });
  }, []);

  // Playback controls
  const handlePlay = useCallback(async () => {
    await generationPlayback.resume();
    await generationPlayback.play();
  }, []);

  const handlePause = useCallback(() => {
    generationPlayback.pause();
  }, []);

  const handleStop = useCallback(() => {
    generationPlayback.stop();
    dispatch({ type: "SET_CURRENT_NOTE_INDEX", payload: null });
  }, []);

  // Reset transposition state when preview file changes
  // Note: This effect should only depend on selectedPreviewFile
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Only reset on subsequent file selections (not initial null)
    // The actual reset happens inside PREVIEW_LOAD_START action
  }, [file.selectedPreviewFile]);

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    // File list state
    previewFiles: file.previewFiles,
    selectedPreviewFile: file.selectedPreviewFile,
    isLoadingPreview: file.isLoadingPreview,
    previewError: file.previewError,
    previewResponse: file.previewResponse,

    // Tempo
    previewTempo: file.previewTempo,
    handlePreviewTempoChange,

    // Playback state
    playbackState: playback.playbackState,
    currentNoteIndex: playback.currentNoteIndex,

    // Solfège
    showSolfege: solfege.showSolfege,
    solfegeXml: solfege.solfegeXml,
    isLoadingSolfege: solfege.isLoadingSolfege,
    handleSolfegeToggle,

    // Transposition
    tuneClef: transposition.tuneClef,
    tuneKey: transposition.tuneKey,
    transposedXml: transposition.transposedXml,
    isTransposing: transposition.isTransposing,

    // Clef change modal
    clefChangeModal: modal.clefChangeModal,
    handleTuneClefChange,
    handleClefTranspose,
    handleClefChangeCancel,

    // Key change modal
    keyChangeModal: modal.keyChangeModal,
    handleTuneKeyChange,
    handleKeyTranspose,
    handleKeyChangeCancel,
    getKeyTransposeIntervals,

    // Material analysis
    materialAnalysis: analysis.materialAnalysis,
    isLoadingAnalysis: analysis.isLoadingAnalysis,

    // Actions
    loadPreviewFiles,
    handlePreviewFile,

    // Playback
    handlePlay,
    handlePause,
    handleStop,

    // Computed
    displayXml,
  };
}
