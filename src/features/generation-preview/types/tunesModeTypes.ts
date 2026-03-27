/**
 * Tunes Mode Types
 *
 * State and action types for the tunes browser mode reducer.
 * Centralizes all state related to tune preview, transposition, and analysis.
 */
import type { MusicalKey } from "../../../api/generation";
import type {
  MaterialPreviewResponse,
  MaterialAnalysis,
} from "../../../api/materials";
import type { PlaybackState } from "../../../services/generationPlayback";
import type { ClefType } from "../../../utils/generationNotation";

// =============================================================================
// State
// =============================================================================

/** Modal state for clef change confirmation */
export interface ClefChangeModalState {
  visible: boolean;
  targetClef: ClefType;
}

/** Modal state for key change confirmation */
export interface KeyChangeModalState {
  visible: boolean;
  targetKey: MusicalKey;
}

/** File preview state */
export interface TunesFileState {
  previewFiles: string[];
  selectedPreviewFile: string | null;
  isLoadingPreview: boolean;
  previewError: string | null;
  previewResponse: MaterialPreviewResponse | null;
  previewTempo: number;
}

/** Playback state for tune preview */
export interface TunesPlaybackState {
  playbackState: PlaybackState;
  currentNoteIndex: number | null;
}

/** Solfège display state */
export interface TunesSolfegeState {
  showSolfege: boolean;
  solfegeXml: string | null;
  isLoadingSolfege: boolean;
}

/** Transposition state */
export interface TunesTranspositionState {
  tuneClef: ClefType;
  tuneKey: MusicalKey;
  transposedXml: string | null;
  isTransposing: boolean;
}

/** Modal visibility state */
export interface TunesModalState {
  clefChangeModal: ClefChangeModalState;
  keyChangeModal: KeyChangeModalState;
}

/** Material analysis state */
export interface TunesAnalysisState {
  materialAnalysis: MaterialAnalysis | null;
  isLoadingAnalysis: boolean;
}

/** Complete tunes mode state */
export interface TunesModeState {
  file: TunesFileState;
  playback: TunesPlaybackState;
  solfege: TunesSolfegeState;
  transposition: TunesTranspositionState;
  modal: TunesModalState;
  analysis: TunesAnalysisState;
}

// =============================================================================
// Actions
// =============================================================================

/** All possible tunes mode actions */
export type TunesModeAction =
  // File state actions
  | { type: "SET_PREVIEW_FILES"; payload: string[] }
  | { type: "SET_SELECTED_PREVIEW_FILE"; payload: string | null }
  | { type: "SET_IS_LOADING_PREVIEW"; payload: boolean }
  | { type: "SET_PREVIEW_ERROR"; payload: string | null }
  | { type: "SET_PREVIEW_RESPONSE"; payload: MaterialPreviewResponse | null }
  | { type: "SET_PREVIEW_TEMPO"; payload: number }
  // Preview load actions
  | { type: "PREVIEW_LOAD_START"; payload: string }
  | {
      type: "PREVIEW_LOAD_SUCCESS";
      payload: MaterialPreviewResponse;
    }
  | { type: "PREVIEW_LOAD_ERROR"; payload: string }
  // Playback actions
  | { type: "SET_PLAYBACK_STATE"; payload: PlaybackState }
  | { type: "SET_CURRENT_NOTE_INDEX"; payload: number | null }
  | { type: "PLAYBACK_COMPLETE" }
  // Solfège actions
  | { type: "TOGGLE_SOLFEGE" }
  | { type: "SET_SOLFEGE_XML"; payload: string | null }
  | { type: "SET_IS_LOADING_SOLFEGE"; payload: boolean }
  | { type: "SOLFEGE_LOAD_SUCCESS"; payload: string }
  | { type: "SOLFEGE_LOAD_ERROR" }
  // Transposition actions
  | { type: "SET_TUNE_CLEF"; payload: ClefType }
  | { type: "SET_TUNE_KEY"; payload: MusicalKey }
  | { type: "SET_TRANSPOSED_XML"; payload: string | null }
  | { type: "SET_IS_TRANSPOSING"; payload: boolean }
  | { type: "TRANSPOSE_START" }
  | {
      type: "TRANSPOSE_SUCCESS";
      payload: { xml: string; clef?: ClefType; key?: MusicalKey };
    }
  | { type: "TRANSPOSE_ERROR" }
  // Modal actions
  | { type: "SHOW_CLEF_CHANGE_MODAL"; payload: ClefType }
  | { type: "HIDE_CLEF_CHANGE_MODAL" }
  | { type: "SHOW_KEY_CHANGE_MODAL"; payload: MusicalKey }
  | { type: "HIDE_KEY_CHANGE_MODAL" }
  // Analysis actions
  | { type: "SET_MATERIAL_ANALYSIS"; payload: MaterialAnalysis | null }
  | { type: "SET_IS_LOADING_ANALYSIS"; payload: boolean }
  | { type: "ANALYSIS_START" }
  | { type: "ANALYSIS_SUCCESS"; payload: MaterialAnalysis }
  | { type: "ANALYSIS_ERROR" }
  // Reset action (when loading new file)
  | { type: "RESET_FOR_NEW_FILE" };

// =============================================================================
// Initial State
// =============================================================================

/** Default initial state for tunes mode */
export const initialTunesModeState: TunesModeState = {
  file: {
    previewFiles: [],
    selectedPreviewFile: null,
    isLoadingPreview: false,
    previewError: null,
    previewResponse: null,
    previewTempo: 120,
  },
  playback: {
    playbackState: "stopped",
    currentNoteIndex: null,
  },
  solfege: {
    showSolfege: false,
    solfegeXml: null,
    isLoadingSolfege: false,
  },
  transposition: {
    tuneClef: "treble",
    tuneKey: "C",
    transposedXml: null,
    isTransposing: false,
  },
  modal: {
    clefChangeModal: { visible: false, targetClef: "treble" },
    keyChangeModal: { visible: false, targetKey: "C" },
  },
  analysis: {
    materialAnalysis: null,
    isLoadingAnalysis: false,
  },
};
