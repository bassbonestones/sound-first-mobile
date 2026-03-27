/**
 * useTuneComposerScreen
 *
 * Custom hook for managing TuneComposerScreen UI state.
 * Uses useReducer for centralized state management of loading,
 * modals, file I/O, import, and UI mode state.
 */
import { useReducer, useCallback, useMemo } from "react";
import type {
  TuneComposerScore,
  Clef,
  KeySignature,
} from "../types/tuneComposerTypes";
import {
  type TuneComposerScreenState,
  createInitialScreenState,
} from "../types/tuneComposerScreenTypes";
import { tuneComposerScreenReducer } from "../reducers";

// =============================================================================
// Types
// =============================================================================

/** Return type for useTuneComposerScreen */
export interface UseTuneComposerScreenReturn {
  // State (flattened for convenience)
  isLoading: boolean;
  initialScore: TuneComposerScore | undefined;
  zoom: number;
  clefChangeModal: { visible: boolean; targetClef: Clef };
  keyChangeModal: { visible: boolean; targetKey: KeySignature };
  chordStyleModalVisible: boolean;
  showAddMeasureModal: boolean;
  showImportModal: boolean;
  showSaveNewModal: boolean;
  previewFiles: string[];
  isLoadingFiles: boolean;
  isImporting: boolean;
  currentFilename: string | null;
  isSaving: boolean;
  newFilename: string;
  isInferringChords: boolean;
  isProgressionEditMode: boolean;

  // Full state (for advanced use)
  state: TuneComposerScreenState;

  // Loading actions
  setIsLoading: (loading: boolean) => void;
  setInitialScore: (score: TuneComposerScore | undefined) => void;
  onScoreLoaded: (score: TuneComposerScore) => void;
  onScoreLoadComplete: () => void;

  // Zoom actions
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;

  // Modal actions
  showClefChangeModal: (targetClef: Clef) => void;
  hideClefChangeModal: () => void;
  showKeyChangeModal: (targetKey: KeySignature) => void;
  hideKeyChangeModal: () => void;
  setChordStyleModalVisible: (visible: boolean) => void;
  setShowAddMeasureModal: (show: boolean) => void;
  setShowImportModal: (show: boolean) => void;
  setShowSaveNewModal: (show: boolean) => void;

  // Import actions
  setPreviewFiles: (files: string[]) => void;
  setIsLoadingFiles: (loading: boolean) => void;
  setIsImporting: (importing: boolean) => void;
  onFilesLoadStart: () => void;
  onFilesLoadSuccess: (files: string[]) => void;
  onFilesLoadError: () => void;
  onImportStart: () => void;
  onImportSuccess: () => void;
  onImportError: () => void;

  // File I/O actions
  setCurrentFilename: (filename: string | null) => void;
  setIsSaving: (saving: boolean) => void;
  setNewFilename: (filename: string) => void;
  onSaveStart: () => void;
  onSaveSuccess: (filename?: string) => void;
  onSaveError: () => void;

  // Processing actions
  setIsInferringChords: (inferring: boolean) => void;
  onInferChordsStart: () => void;
  onInferChordsSuccess: () => void;
  onInferChordsError: () => void;

  // Mode actions
  setProgressionEditMode: (editMode: boolean) => void;
  toggleProgressionEditMode: () => void;

  // Reset actions
  resetForNewScore: () => void;
  resetImportState: () => void;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for managing TuneComposerScreen UI state.
 *
 * @param hasScoreId - Whether a scoreId was provided (affects initial loading state)
 */
export function useTuneComposerScreen(
  hasScoreId: boolean = false,
): UseTuneComposerScreenReturn {
  // Create initial state based on whether we have a scoreId
  const initialState = useMemo(
    () => createInitialScreenState(hasScoreId),
    [hasScoreId],
  );

  const [state, dispatch] = useReducer(tuneComposerScreenReducer, initialState);

  // ==========================================================================
  // Loading Actions
  // ==========================================================================

  const setIsLoading = useCallback((loading: boolean) => {
    dispatch({ type: "SET_IS_LOADING", payload: loading });
  }, []);

  const setInitialScore = useCallback(
    (score: TuneComposerScore | undefined) => {
      dispatch({ type: "SET_INITIAL_SCORE", payload: score });
    },
    [],
  );

  const onScoreLoaded = useCallback((score: TuneComposerScore) => {
    dispatch({ type: "SCORE_LOADED", payload: score });
  }, []);

  const onScoreLoadComplete = useCallback(() => {
    dispatch({ type: "SCORE_LOAD_COMPLETE" });
  }, []);

  // ==========================================================================
  // Zoom Actions
  // ==========================================================================

  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: "SET_ZOOM", payload: zoom });
  }, []);

  const zoomIn = useCallback(() => {
    dispatch({ type: "ZOOM_IN" });
  }, []);

  const zoomOut = useCallback(() => {
    dispatch({ type: "ZOOM_OUT" });
  }, []);

  const resetZoom = useCallback(() => {
    dispatch({ type: "RESET_ZOOM" });
  }, []);

  // ==========================================================================
  // Modal Actions
  // ==========================================================================

  const showClefChangeModal = useCallback((targetClef: Clef) => {
    dispatch({ type: "SHOW_CLEF_CHANGE_MODAL", payload: targetClef });
  }, []);

  const hideClefChangeModal = useCallback(() => {
    dispatch({ type: "HIDE_CLEF_CHANGE_MODAL" });
  }, []);

  const showKeyChangeModal = useCallback((targetKey: KeySignature) => {
    dispatch({ type: "SHOW_KEY_CHANGE_MODAL", payload: targetKey });
  }, []);

  const hideKeyChangeModal = useCallback(() => {
    dispatch({ type: "HIDE_KEY_CHANGE_MODAL" });
  }, []);

  const setChordStyleModalVisible = useCallback((visible: boolean) => {
    dispatch({ type: "SET_CHORD_STYLE_MODAL_VISIBLE", payload: visible });
  }, []);

  const setShowAddMeasureModal = useCallback((show: boolean) => {
    dispatch({ type: "SET_SHOW_ADD_MEASURE_MODAL", payload: show });
  }, []);

  const setShowImportModal = useCallback((show: boolean) => {
    dispatch({ type: "SET_SHOW_IMPORT_MODAL", payload: show });
  }, []);

  const setShowSaveNewModal = useCallback((show: boolean) => {
    dispatch({ type: "SET_SHOW_SAVE_NEW_MODAL", payload: show });
  }, []);

  // ==========================================================================
  // Import Actions
  // ==========================================================================

  const setPreviewFiles = useCallback((files: string[]) => {
    dispatch({ type: "SET_PREVIEW_FILES", payload: files });
  }, []);

  const setIsLoadingFiles = useCallback((loading: boolean) => {
    dispatch({ type: "SET_IS_LOADING_FILES", payload: loading });
  }, []);

  const setIsImporting = useCallback((importing: boolean) => {
    dispatch({ type: "SET_IS_IMPORTING", payload: importing });
  }, []);

  const onFilesLoadStart = useCallback(() => {
    dispatch({ type: "FILES_LOAD_START" });
  }, []);

  const onFilesLoadSuccess = useCallback((files: string[]) => {
    dispatch({ type: "FILES_LOAD_SUCCESS", payload: files });
  }, []);

  const onFilesLoadError = useCallback(() => {
    dispatch({ type: "FILES_LOAD_ERROR" });
  }, []);

  const onImportStart = useCallback(() => {
    dispatch({ type: "IMPORT_START" });
  }, []);

  const onImportSuccess = useCallback(() => {
    dispatch({ type: "IMPORT_SUCCESS" });
  }, []);

  const onImportError = useCallback(() => {
    dispatch({ type: "IMPORT_ERROR" });
  }, []);

  // ==========================================================================
  // File I/O Actions
  // ==========================================================================

  const setCurrentFilename = useCallback((filename: string | null) => {
    dispatch({ type: "SET_CURRENT_FILENAME", payload: filename });
  }, []);

  const setIsSaving = useCallback((saving: boolean) => {
    dispatch({ type: "SET_IS_SAVING", payload: saving });
  }, []);

  const setNewFilename = useCallback((filename: string) => {
    dispatch({ type: "SET_NEW_FILENAME", payload: filename });
  }, []);

  const onSaveStart = useCallback(() => {
    dispatch({ type: "SAVE_START" });
  }, []);

  const onSaveSuccess = useCallback((filename?: string) => {
    dispatch({ type: "SAVE_SUCCESS", payload: filename });
  }, []);

  const onSaveError = useCallback(() => {
    dispatch({ type: "SAVE_ERROR" });
  }, []);

  // ==========================================================================
  // Processing Actions
  // ==========================================================================

  const setIsInferringChords = useCallback((inferring: boolean) => {
    dispatch({ type: "SET_IS_INFERRING_CHORDS", payload: inferring });
  }, []);

  const onInferChordsStart = useCallback(() => {
    dispatch({ type: "INFER_CHORDS_START" });
  }, []);

  const onInferChordsSuccess = useCallback(() => {
    dispatch({ type: "INFER_CHORDS_SUCCESS" });
  }, []);

  const onInferChordsError = useCallback(() => {
    dispatch({ type: "INFER_CHORDS_ERROR" });
  }, []);

  // ==========================================================================
  // Mode Actions
  // ==========================================================================

  const setProgressionEditMode = useCallback((editMode: boolean) => {
    dispatch({ type: "SET_PROGRESSION_EDIT_MODE", payload: editMode });
  }, []);

  const toggleProgressionEditMode = useCallback(() => {
    dispatch({ type: "TOGGLE_PROGRESSION_EDIT_MODE" });
  }, []);

  // ==========================================================================
  // Reset Actions
  // ==========================================================================

  const resetForNewScore = useCallback(() => {
    dispatch({ type: "RESET_FOR_NEW_SCORE" });
  }, []);

  const resetImportState = useCallback(() => {
    dispatch({ type: "RESET_IMPORT_STATE" });
  }, []);

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    // Flattened state for convenience
    isLoading: state.loading.isLoading,
    initialScore: state.loading.initialScore,
    zoom: state.zoom.zoom,
    clefChangeModal: state.modals.clefChangeModal,
    keyChangeModal: state.modals.keyChangeModal,
    chordStyleModalVisible: state.modals.chordStyleModalVisible,
    showAddMeasureModal: state.modals.showAddMeasureModal,
    showImportModal: state.modals.showImportModal,
    showSaveNewModal: state.modals.showSaveNewModal,
    previewFiles: state.import.previewFiles,
    isLoadingFiles: state.import.isLoadingFiles,
    isImporting: state.import.isImporting,
    currentFilename: state.file.currentFilename,
    isSaving: state.file.isSaving,
    newFilename: state.file.newFilename,
    isInferringChords: state.processing.isInferringChords,
    isProgressionEditMode: state.mode.isProgressionEditMode,

    // Full state
    state,

    // Loading actions
    setIsLoading,
    setInitialScore,
    onScoreLoaded,
    onScoreLoadComplete,

    // Zoom actions
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,

    // Modal actions
    showClefChangeModal,
    hideClefChangeModal,
    showKeyChangeModal,
    hideKeyChangeModal,
    setChordStyleModalVisible,
    setShowAddMeasureModal,
    setShowImportModal,
    setShowSaveNewModal,

    // Import actions
    setPreviewFiles,
    setIsLoadingFiles,
    setIsImporting,
    onFilesLoadStart,
    onFilesLoadSuccess,
    onFilesLoadError,
    onImportStart,
    onImportSuccess,
    onImportError,

    // File I/O actions
    setCurrentFilename,
    setIsSaving,
    setNewFilename,
    onSaveStart,
    onSaveSuccess,
    onSaveError,

    // Processing actions
    setIsInferringChords,
    onInferChordsStart,
    onInferChordsSuccess,
    onInferChordsError,

    // Mode actions
    setProgressionEditMode,
    toggleProgressionEditMode,

    // Reset actions
    resetForNewScore,
    resetImportState,
  };
}
