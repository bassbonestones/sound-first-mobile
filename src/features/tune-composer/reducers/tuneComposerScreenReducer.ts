/**
 * TuneComposerScreen Reducer
 *
 * Pure reducer function for managing TuneComposerScreen state.
 * Handles loading, modals, file I/O, import, and UI mode state transitions.
 */
import type {
  TuneComposerScreenState,
  TuneComposerScreenAction,
} from "../types/tuneComposerScreenTypes";

/** Zoom constraints */
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;
const ZOOM_STEP = 0.1;

/**
 * Reducer for TuneComposerScreen state.
 * All state transitions are explicit and type-safe.
 */
export function tuneComposerScreenReducer(
  state: TuneComposerScreenState,
  action: TuneComposerScreenAction,
): TuneComposerScreenState {
  switch (action.type) {
    // ==========================================================================
    // Loading Actions
    // ==========================================================================

    case "SET_IS_LOADING":
      return {
        ...state,
        loading: {
          ...state.loading,
          isLoading: action.payload,
        },
      };

    case "SET_INITIAL_SCORE":
      return {
        ...state,
        loading: {
          ...state.loading,
          initialScore: action.payload,
        },
      };

    case "SCORE_LOADED":
      return {
        ...state,
        loading: {
          ...state.loading,
          initialScore: action.payload,
          isLoading: false,
        },
      };

    case "SCORE_LOAD_COMPLETE":
      return {
        ...state,
        loading: {
          ...state.loading,
          isLoading: false,
        },
      };

    // ==========================================================================
    // Zoom Actions
    // ==========================================================================

    case "SET_ZOOM":
      return {
        ...state,
        zoom: {
          ...state.zoom,
          zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, action.payload)),
        },
      };

    case "ZOOM_IN":
      return {
        ...state,
        zoom: {
          ...state.zoom,
          zoom: Math.min(MAX_ZOOM, state.zoom.zoom + ZOOM_STEP),
        },
      };

    case "ZOOM_OUT":
      return {
        ...state,
        zoom: {
          ...state.zoom,
          zoom: Math.max(MIN_ZOOM, state.zoom.zoom - ZOOM_STEP),
        },
      };

    case "RESET_ZOOM":
      return {
        ...state,
        zoom: {
          ...state.zoom,
          zoom: 1.0,
        },
      };

    // ==========================================================================
    // Clef Modal Actions
    // ==========================================================================

    case "SHOW_CLEF_CHANGE_MODAL":
      return {
        ...state,
        modals: {
          ...state.modals,
          clefChangeModal: { visible: true, targetClef: action.payload },
        },
      };

    case "HIDE_CLEF_CHANGE_MODAL":
      return {
        ...state,
        modals: {
          ...state.modals,
          clefChangeModal: { visible: false, targetClef: "treble" },
        },
      };

    // ==========================================================================
    // Key Modal Actions
    // ==========================================================================

    case "SHOW_KEY_CHANGE_MODAL":
      return {
        ...state,
        modals: {
          ...state.modals,
          keyChangeModal: { visible: true, targetKey: action.payload },
        },
      };

    case "HIDE_KEY_CHANGE_MODAL":
      return {
        ...state,
        modals: {
          ...state.modals,
          keyChangeModal: { visible: false, targetKey: 0 },
        },
      };

    // ==========================================================================
    // Other Modal Actions
    // ==========================================================================

    case "SET_CHORD_STYLE_MODAL_VISIBLE":
      return {
        ...state,
        modals: {
          ...state.modals,
          chordStyleModalVisible: action.payload,
        },
      };

    case "SET_SHOW_ADD_MEASURE_MODAL":
      return {
        ...state,
        modals: {
          ...state.modals,
          showAddMeasureModal: action.payload,
        },
      };

    case "SET_SHOW_IMPORT_MODAL":
      return {
        ...state,
        modals: {
          ...state.modals,
          showImportModal: action.payload,
        },
      };

    case "SET_SHOW_SAVE_NEW_MODAL":
      return {
        ...state,
        modals: {
          ...state.modals,
          showSaveNewModal: action.payload,
        },
      };

    // ==========================================================================
    // Import Actions
    // ==========================================================================

    case "SET_PREVIEW_FILES":
      return {
        ...state,
        import: {
          ...state.import,
          previewFiles: action.payload,
        },
      };

    case "SET_IS_LOADING_FILES":
      return {
        ...state,
        import: {
          ...state.import,
          isLoadingFiles: action.payload,
        },
      };

    case "SET_IS_IMPORTING":
      return {
        ...state,
        import: {
          ...state.import,
          isImporting: action.payload,
        },
      };

    case "FILES_LOAD_START":
      return {
        ...state,
        import: {
          ...state.import,
          isLoadingFiles: true,
        },
      };

    case "FILES_LOAD_SUCCESS":
      return {
        ...state,
        import: {
          ...state.import,
          previewFiles: action.payload,
          isLoadingFiles: false,
        },
      };

    case "FILES_LOAD_ERROR":
      return {
        ...state,
        import: {
          ...state.import,
          isLoadingFiles: false,
        },
      };

    case "IMPORT_START":
      return {
        ...state,
        import: {
          ...state.import,
          isImporting: true,
        },
      };

    case "IMPORT_SUCCESS":
      return {
        ...state,
        import: {
          ...state.import,
          isImporting: false,
        },
        modals: {
          ...state.modals,
          showImportModal: false,
        },
      };

    case "IMPORT_ERROR":
      return {
        ...state,
        import: {
          ...state.import,
          isImporting: false,
        },
      };

    // ==========================================================================
    // File I/O Actions
    // ==========================================================================

    case "SET_CURRENT_FILENAME":
      return {
        ...state,
        file: {
          ...state.file,
          currentFilename: action.payload,
        },
      };

    case "SET_IS_SAVING":
      return {
        ...state,
        file: {
          ...state.file,
          isSaving: action.payload,
        },
      };

    case "SET_NEW_FILENAME":
      return {
        ...state,
        file: {
          ...state.file,
          newFilename: action.payload,
        },
      };

    case "SAVE_START":
      return {
        ...state,
        file: {
          ...state.file,
          isSaving: true,
        },
      };

    case "SAVE_SUCCESS":
      return {
        ...state,
        file: {
          ...state.file,
          isSaving: false,
          currentFilename: action.payload ?? state.file.currentFilename,
          newFilename: "",
        },
        modals: {
          ...state.modals,
          showSaveNewModal: false,
        },
      };

    case "SAVE_ERROR":
      return {
        ...state,
        file: {
          ...state.file,
          isSaving: false,
        },
      };

    // ==========================================================================
    // Processing Actions
    // ==========================================================================

    case "SET_IS_INFERRING_CHORDS":
      return {
        ...state,
        processing: {
          ...state.processing,
          isInferringChords: action.payload,
        },
      };

    case "INFER_CHORDS_START":
      return {
        ...state,
        processing: {
          ...state.processing,
          isInferringChords: true,
        },
      };

    case "INFER_CHORDS_SUCCESS":
    case "INFER_CHORDS_ERROR":
      return {
        ...state,
        processing: {
          ...state.processing,
          isInferringChords: false,
        },
      };

    // ==========================================================================
    // Mode Actions
    // ==========================================================================

    case "SET_PROGRESSION_EDIT_MODE":
      return {
        ...state,
        mode: {
          ...state.mode,
          isProgressionEditMode: action.payload,
        },
      };

    case "TOGGLE_PROGRESSION_EDIT_MODE":
      return {
        ...state,
        mode: {
          ...state.mode,
          isProgressionEditMode: !state.mode.isProgressionEditMode,
        },
      };

    // ==========================================================================
    // Reset Actions
    // ==========================================================================

    case "RESET_FOR_NEW_SCORE":
      return {
        ...state,
        file: {
          currentFilename: null,
          isSaving: false,
          newFilename: "",
        },
        mode: {
          isProgressionEditMode: false,
        },
      };

    case "RESET_IMPORT_STATE":
      return {
        ...state,
        import: {
          previewFiles: [],
          isLoadingFiles: false,
          isImporting: false,
        },
      };

    default:
      return state;
  }
}
