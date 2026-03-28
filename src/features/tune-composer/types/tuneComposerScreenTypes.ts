/**
 * TuneComposerScreen Types
 *
 * State and action types for the TuneComposerScreen reducer.
 * Centralizes all screen-level state related to loading, modals, file I/O, and UI modes.
 */
import type {
  TuneComposerScore,
  Clef,
  KeySignature,
} from "./tuneComposerTypes";

// =============================================================================
// State
// =============================================================================

/** Loading state for initial score recovery */
export interface ScreenLoadingState {
  isLoading: boolean;
  initialScore: TuneComposerScore | undefined;
}

/** Zoom state */
export interface ScreenZoomState {
  zoom: number;
}

/** Clef change modal state */
export interface ClefChangeModalState {
  visible: boolean;
  targetClef: Clef;
}

/** Key change modal state */
export interface KeyChangeModalState {
  visible: boolean;
  targetKey: KeySignature;
}

/** All modal visibility states */
export interface ScreenModalsState {
  clefChangeModal: ClefChangeModalState;
  keyChangeModal: KeyChangeModalState;
  chordStyleModalVisible: boolean;
  showAddMeasureModal: boolean;
  showImportModal: boolean;
  showSaveNewModal: boolean;
  showMetadataModal: boolean;
}

/** Import picker state */
export interface ScreenImportState {
  previewFiles: string[];
  isLoadingFiles: boolean;
  isImporting: boolean;
}

/** File I/O state */
export interface ScreenFileState {
  currentFilename: string | null;
  isSaving: boolean;
  newFilename: string;
}

/** Processing state */
export interface ScreenProcessingState {
  isInferringChords: boolean;
}

/** UI mode state */
export interface ScreenModeState {
  isProgressionEditMode: boolean;
}

/** Complete screen state */
export interface TuneComposerScreenState {
  loading: ScreenLoadingState;
  zoom: ScreenZoomState;
  modals: ScreenModalsState;
  import: ScreenImportState;
  file: ScreenFileState;
  processing: ScreenProcessingState;
  mode: ScreenModeState;
}

// =============================================================================
// Actions
// =============================================================================

/** All possible screen actions */
export type TuneComposerScreenAction =
  // Loading actions
  | { type: "SET_IS_LOADING"; payload: boolean }
  | { type: "SET_INITIAL_SCORE"; payload: TuneComposerScore | undefined }
  | { type: "SCORE_LOADED"; payload: TuneComposerScore }
  | { type: "SCORE_LOAD_COMPLETE" }
  // Zoom actions
  | { type: "SET_ZOOM"; payload: number }
  | { type: "ZOOM_IN" }
  | { type: "ZOOM_OUT" }
  | { type: "RESET_ZOOM" }
  // Clef modal actions
  | { type: "SHOW_CLEF_CHANGE_MODAL"; payload: Clef }
  | { type: "HIDE_CLEF_CHANGE_MODAL" }
  // Key modal actions
  | { type: "SHOW_KEY_CHANGE_MODAL"; payload: KeySignature }
  | { type: "HIDE_KEY_CHANGE_MODAL" }
  // Other modal actions
  | { type: "SET_CHORD_STYLE_MODAL_VISIBLE"; payload: boolean }
  | { type: "SET_SHOW_ADD_MEASURE_MODAL"; payload: boolean }
  | { type: "SET_SHOW_IMPORT_MODAL"; payload: boolean }
  | { type: "SET_SHOW_SAVE_NEW_MODAL"; payload: boolean }
  | { type: "SET_SHOW_METADATA_MODAL"; payload: boolean }
  // Import actions
  | { type: "SET_PREVIEW_FILES"; payload: string[] }
  | { type: "SET_IS_LOADING_FILES"; payload: boolean }
  | { type: "SET_IS_IMPORTING"; payload: boolean }
  | { type: "IMPORT_START" }
  | { type: "IMPORT_SUCCESS" }
  | { type: "IMPORT_ERROR" }
  | { type: "FILES_LOAD_START" }
  | { type: "FILES_LOAD_SUCCESS"; payload: string[] }
  | { type: "FILES_LOAD_ERROR" }
  // File I/O actions
  | { type: "SET_CURRENT_FILENAME"; payload: string | null }
  | { type: "SET_IS_SAVING"; payload: boolean }
  | { type: "SET_NEW_FILENAME"; payload: string }
  | { type: "SAVE_START" }
  | { type: "SAVE_SUCCESS"; payload?: string }
  | { type: "SAVE_ERROR" }
  // Processing actions
  | { type: "SET_IS_INFERRING_CHORDS"; payload: boolean }
  | { type: "INFER_CHORDS_START" }
  | { type: "INFER_CHORDS_SUCCESS" }
  | { type: "INFER_CHORDS_ERROR" }
  // Mode actions
  | { type: "SET_PROGRESSION_EDIT_MODE"; payload: boolean }
  | { type: "TOGGLE_PROGRESSION_EDIT_MODE" }
  // Reset actions
  | { type: "RESET_FOR_NEW_SCORE" }
  | { type: "RESET_IMPORT_STATE" };

// =============================================================================
// Initial State
// =============================================================================

/** Default initial state for TuneComposerScreen */
export const initialTuneComposerScreenState: TuneComposerScreenState = {
  loading: {
    isLoading: false,
    initialScore: undefined,
  },
  zoom: {
    zoom: 1.0,
  },
  modals: {
    clefChangeModal: { visible: false, targetClef: "treble" },
    keyChangeModal: { visible: false, targetKey: 0 },
    chordStyleModalVisible: false,
    showAddMeasureModal: false,
    showImportModal: false,
    showSaveNewModal: false,
    showMetadataModal: false,
  },
  import: {
    previewFiles: [],
    isLoadingFiles: false,
    isImporting: false,
  },
  file: {
    currentFilename: null,
    isSaving: false,
    newFilename: "",
  },
  processing: {
    isInferringChords: false,
  },
  mode: {
    isProgressionEditMode: false,
  },
};

/**
 * Create initial state with optional scoreId loading flag
 */
export function createInitialScreenState(
  hasScoreId: boolean,
): TuneComposerScreenState {
  return {
    ...initialTuneComposerScreenState,
    loading: {
      ...initialTuneComposerScreenState.loading,
      isLoading: hasScoreId,
    },
  };
}
