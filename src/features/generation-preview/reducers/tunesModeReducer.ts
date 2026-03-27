/**
 * Tunes Mode Reducer
 *
 * Pure reducer function for managing tunes browser mode state.
 * All state transitions are explicit and type-safe.
 */
import type { TunesModeState, TunesModeAction } from "../types/tunesModeTypes";

/**
 * Reducer for tunes mode state.
 * Handles all state transitions for tune preview, transposition, and analysis.
 */
export function tunesModeReducer(
  state: TunesModeState,
  action: TunesModeAction,
): TunesModeState {
  switch (action.type) {
    // ==========================================================================
    // File State Actions
    // ==========================================================================

    case "SET_PREVIEW_FILES":
      return {
        ...state,
        file: {
          ...state.file,
          previewFiles: action.payload,
        },
      };

    case "SET_SELECTED_PREVIEW_FILE":
      return {
        ...state,
        file: {
          ...state.file,
          selectedPreviewFile: action.payload,
        },
      };

    case "SET_IS_LOADING_PREVIEW":
      return {
        ...state,
        file: {
          ...state.file,
          isLoadingPreview: action.payload,
        },
      };

    case "SET_PREVIEW_ERROR":
      return {
        ...state,
        file: {
          ...state.file,
          previewError: action.payload,
        },
      };

    case "SET_PREVIEW_RESPONSE":
      return {
        ...state,
        file: {
          ...state.file,
          previewResponse: action.payload,
        },
      };

    case "SET_PREVIEW_TEMPO":
      return {
        ...state,
        file: {
          ...state.file,
          previewTempo: action.payload,
        },
      };

    // ==========================================================================
    // Preview Load Actions
    // ==========================================================================

    case "PREVIEW_LOAD_START":
      return {
        ...state,
        file: {
          ...state.file,
          selectedPreviewFile: action.payload,
          isLoadingPreview: true,
          previewError: null,
          previewResponse: null,
        },
        playback: {
          ...state.playback,
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
        analysis: {
          ...state.analysis,
          materialAnalysis: null,
        },
      };

    case "PREVIEW_LOAD_SUCCESS":
      return {
        ...state,
        file: {
          ...state.file,
          isLoadingPreview: false,
          previewResponse: action.payload,
          // Sync tempo from loaded tune (default to 120 if not specified)
          previewTempo: action.payload.tempo_bpm ?? state.file.previewTempo,
        },
      };

    case "PREVIEW_LOAD_ERROR":
      return {
        ...state,
        file: {
          ...state.file,
          isLoadingPreview: false,
          previewError: action.payload,
        },
      };

    // ==========================================================================
    // Playback Actions
    // ==========================================================================

    case "SET_PLAYBACK_STATE":
      return {
        ...state,
        playback: {
          ...state.playback,
          playbackState: action.payload,
        },
      };

    case "SET_CURRENT_NOTE_INDEX":
      return {
        ...state,
        playback: {
          ...state.playback,
          currentNoteIndex: action.payload,
        },
      };

    case "PLAYBACK_COMPLETE":
      return {
        ...state,
        playback: {
          ...state.playback,
          currentNoteIndex: null,
        },
      };

    // ==========================================================================
    // Solfège Actions
    // ==========================================================================

    case "TOGGLE_SOLFEGE":
      return {
        ...state,
        solfege: {
          ...state.solfege,
          showSolfege: !state.solfege.showSolfege,
        },
      };

    case "SET_SOLFEGE_XML":
      return {
        ...state,
        solfege: {
          ...state.solfege,
          solfegeXml: action.payload,
        },
      };

    case "SET_IS_LOADING_SOLFEGE":
      return {
        ...state,
        solfege: {
          ...state.solfege,
          isLoadingSolfege: action.payload,
        },
      };

    case "SOLFEGE_LOAD_SUCCESS":
      return {
        ...state,
        solfege: {
          ...state.solfege,
          solfegeXml: action.payload,
          isLoadingSolfege: false,
        },
      };

    case "SOLFEGE_LOAD_ERROR":
      return {
        ...state,
        solfege: {
          ...state.solfege,
          showSolfege: false,
          isLoadingSolfege: false,
        },
      };

    // ==========================================================================
    // Transposition Actions
    // ==========================================================================

    case "SET_TUNE_CLEF":
      return {
        ...state,
        transposition: {
          ...state.transposition,
          tuneClef: action.payload,
        },
      };

    case "SET_TUNE_KEY":
      return {
        ...state,
        transposition: {
          ...state.transposition,
          tuneKey: action.payload,
        },
      };

    case "SET_TRANSPOSED_XML":
      return {
        ...state,
        transposition: {
          ...state.transposition,
          transposedXml: action.payload,
        },
      };

    case "SET_IS_TRANSPOSING":
      return {
        ...state,
        transposition: {
          ...state.transposition,
          isTransposing: action.payload,
        },
      };

    case "TRANSPOSE_START":
      return {
        ...state,
        transposition: {
          ...state.transposition,
          isTransposing: true,
        },
      };

    case "TRANSPOSE_SUCCESS":
      return {
        ...state,
        transposition: {
          ...state.transposition,
          transposedXml: action.payload.xml,
          tuneClef: action.payload.clef ?? state.transposition.tuneClef,
          tuneKey: action.payload.key ?? state.transposition.tuneKey,
          isTransposing: false,
        },
        solfege: {
          ...state.solfege,
          solfegeXml: null,
          showSolfege: false,
        },
      };

    case "TRANSPOSE_ERROR":
      return {
        ...state,
        transposition: {
          ...state.transposition,
          isTransposing: false,
        },
      };

    // ==========================================================================
    // Modal Actions
    // ==========================================================================

    case "SHOW_CLEF_CHANGE_MODAL":
      return {
        ...state,
        modal: {
          ...state.modal,
          clefChangeModal: { visible: true, targetClef: action.payload },
        },
      };

    case "HIDE_CLEF_CHANGE_MODAL":
      return {
        ...state,
        modal: {
          ...state.modal,
          clefChangeModal: { visible: false, targetClef: "treble" },
        },
      };

    case "SHOW_KEY_CHANGE_MODAL":
      return {
        ...state,
        modal: {
          ...state.modal,
          keyChangeModal: { visible: true, targetKey: action.payload },
        },
      };

    case "HIDE_KEY_CHANGE_MODAL":
      return {
        ...state,
        modal: {
          ...state.modal,
          keyChangeModal: { visible: false, targetKey: "C" },
        },
      };

    // ==========================================================================
    // Analysis Actions
    // ==========================================================================

    case "SET_MATERIAL_ANALYSIS":
      return {
        ...state,
        analysis: {
          ...state.analysis,
          materialAnalysis: action.payload,
        },
      };

    case "SET_IS_LOADING_ANALYSIS":
      return {
        ...state,
        analysis: {
          ...state.analysis,
          isLoadingAnalysis: action.payload,
        },
      };

    case "ANALYSIS_START":
      return {
        ...state,
        analysis: {
          ...state.analysis,
          isLoadingAnalysis: true,
        },
      };

    case "ANALYSIS_SUCCESS":
      return {
        ...state,
        analysis: {
          ...state.analysis,
          materialAnalysis: action.payload,
          isLoadingAnalysis: false,
        },
      };

    case "ANALYSIS_ERROR":
      return {
        ...state,
        analysis: {
          ...state.analysis,
          isLoadingAnalysis: false,
        },
      };

    // ==========================================================================
    // Reset Action
    // ==========================================================================

    case "RESET_FOR_NEW_FILE":
      return {
        ...state,
        file: {
          ...state.file,
          previewResponse: null,
          previewError: null,
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
          ...state.transposition,
          transposedXml: null,
        },
        analysis: {
          materialAnalysis: null,
          isLoadingAnalysis: false,
        },
      };

    default:
      return state;
  }
}
