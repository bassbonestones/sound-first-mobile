/**
 * useImportMusic Hook
 *
 * High-level hook for managing the music import workflow.
 * Provides a clean API for UI components to:
 * - Initiate imports from various sources
 * - Track import progress
 * - Access results and errors
 * - Reset state for new imports
 */

import { useState, useCallback, useRef } from "react";

import type {
  LocalImportAsset,
  ImportJobStatus,
  ImportPipelineResult,
  ImportedScore,
  ImportPreviewModel,
  ImportError,
  ImportValidationIssue,
} from "../../../types/import";
import { createInitialJobStatus } from "../../../types/import";
import {
  acquireFromCamera,
  acquireFromImageLibrary,
  acquirePdf,
  acquireMusicXml,
  runImportPipeline,
  type CameraAcquisitionOptions,
  type ImageLibraryAcquisitionOptions,
  type DocumentAcquisitionOptions,
} from "../services";
import { devLog, devError } from "../../../utils/devLogger";

// ============================================================================
// Types
// ============================================================================

/**
 * Import state managed by the hook
 */
export interface ImportMusicState {
  /** Current job status */
  readonly status: ImportJobStatus;
  /** Current error if any */
  readonly error: ImportError | null;
  /** Pipeline result if complete */
  readonly result: ImportPipelineResult | null;
  /** Imported score if successful */
  readonly score: ImportedScore | null;
  /** Preview model if available */
  readonly preview: ImportPreviewModel | null;
  /** Raw MusicXML content for rendering */
  readonly rawMusicXml: string | null;
  /** Validation issues if any */
  readonly validationIssues: ImportValidationIssue[];
  /** Whether an import is in progress */
  readonly isImporting: boolean;
  /** Current asset being imported */
  readonly currentAsset: LocalImportAsset | null;
}

/**
 * Actions provided by the hook
 */
export interface ImportMusicActions {
  /** Start import from camera */
  importFromCamera: (options?: CameraAcquisitionOptions) => Promise<void>;
  /** Start import from image library */
  importFromImageLibrary: (
    options?: ImageLibraryAcquisitionOptions,
  ) => Promise<void>;
  /** Start import of PDF document */
  importPdf: (options?: DocumentAcquisitionOptions) => Promise<void>;
  /** Start import of MusicXML file */
  importMusicXml: (options?: DocumentAcquisitionOptions) => Promise<void>;
  /** Import from an already-acquired asset */
  importAsset: (asset: LocalImportAsset) => Promise<void>;
  /** Cancel current import */
  cancelImport: () => void;
  /** Reset state for new import */
  resetImportState: () => void;
  /** Clear just the error */
  clearError: () => void;
}

/**
 * Return type for useImportMusic hook
 */
export type UseImportMusicReturn = ImportMusicState & ImportMusicActions;

// ============================================================================
// Initial State
// ============================================================================

function createInitialState(): ImportMusicState {
  return {
    status: createInitialJobStatus(),
    error: null,
    result: null,
    score: null,
    preview: null,
    rawMusicXml: null,
    validationIssues: [],
    isImporting: false,
    currentAsset: null,
  };
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing music import workflow
 *
 * @example
 * ```tsx
 * const {
 *   status,
 *   error,
 *   score,
 *   preview,
 *   isImporting,
 *   importFromCamera,
 *   importMusicXml,
 *   resetImportState,
 * } = useImportMusic();
 *
 * // Start an import
 * await importMusicXml();
 *
 * // Check progress
 * console.log(status.message, status.progress);
 *
 * // Use result
 * if (score) {
 *   console.log('Imported:', score.metadata.title);
 * }
 * ```
 */
export function useImportMusic(): UseImportMusicReturn {
  const [state, setState] = useState<ImportMusicState>(createInitialState);

  // Cancellation token ref
  const cancellationRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  // ============================================================================
  // State Update Helpers
  // ============================================================================

  const updateState = useCallback((updates: Partial<ImportMusicState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const setError = useCallback(
    (error: ImportError | null) => {
      updateState({ error, isImporting: false });
    },
    [updateState],
  );

  const setStatus = useCallback(
    (status: ImportJobStatus) => {
      updateState({ status });
    },
    [updateState],
  );

  // ============================================================================
  // Core Import Function
  // ============================================================================

  const runImport = useCallback(
    async (asset: LocalImportAsset) => {
      // Reset cancellation token
      cancellationRef.current = { cancelled: false };

      // Set importing state
      updateState({
        isImporting: true,
        error: null,
        result: null,
        score: null,
        preview: null,
        validationIssues: [],
        currentAsset: asset,
      });

      devLog(
        "[useImportMusic] Starting import:",
        asset.fileName,
        asset.sourceType,
      );

      try {
        const result = await runImportPipeline(
          { asset },
          {
            onStatusChange: setStatus,
            cancellationToken: cancellationRef.current,
          },
        );

        if (result.success) {
          devLog("[useImportMusic] Import succeeded:", result.score?.id);
          updateState({
            result,
            score: result.score,
            preview: result.preview,
            rawMusicXml: result.rawMusicXml,
            validationIssues: result.validationIssues,
            isImporting: false,
            error: null,
          });
        } else {
          devError("[useImportMusic] Import failed:", result.error?.code);
          updateState({
            result,
            error: result.error,
            isImporting: false,
          });
        }
      } catch (err) {
        devError("[useImportMusic] Unexpected error:", err);
        const error: ImportError = {
          code: "unknown_error",
          message: err instanceof Error ? err.message : String(err),
          userMessage: "Something went wrong. Please try again.",
          severity: "fatal",
          recoverable: false,
          recoveryHint: null,
        };
        setError(error);
      }
    },
    [updateState, setStatus, setError],
  );

  // ============================================================================
  // Acquisition + Import Functions
  // ============================================================================

  const importFromCamera = useCallback(
    async (options: CameraAcquisitionOptions = {}) => {
      devLog("[useImportMusic] importFromCamera");

      const acquisition = await acquireFromCamera(options);

      if (!acquisition.success || !acquisition.asset) {
        if (acquisition.error?.code !== "canceled_by_user") {
          setError(acquisition.error);
        }
        return;
      }

      await runImport(acquisition.asset);
    },
    [runImport, setError],
  );

  const importFromImageLibrary = useCallback(
    async (options: ImageLibraryAcquisitionOptions = {}) => {
      devLog("[useImportMusic] importFromImageLibrary");

      const acquisition = await acquireFromImageLibrary(options);

      if (!acquisition.success || !acquisition.asset) {
        if (acquisition.error?.code !== "canceled_by_user") {
          setError(acquisition.error);
        }
        return;
      }

      await runImport(acquisition.asset);
    },
    [runImport, setError],
  );

  const importPdf = useCallback(
    async (options: DocumentAcquisitionOptions = {}) => {
      devLog("[useImportMusic] importPdf");

      const acquisition = await acquirePdf(options);

      if (!acquisition.success || !acquisition.asset) {
        if (acquisition.error?.code !== "canceled_by_user") {
          setError(acquisition.error);
        }
        return;
      }

      await runImport(acquisition.asset);
    },
    [runImport, setError],
  );

  const importMusicXml = useCallback(
    async (options: DocumentAcquisitionOptions = {}) => {
      devLog("[useImportMusic] importMusicXml");

      const acquisition = await acquireMusicXml(options);

      if (!acquisition.success || !acquisition.asset) {
        if (acquisition.error?.code !== "canceled_by_user") {
          setError(acquisition.error);
        }
        return;
      }

      await runImport(acquisition.asset);
    },
    [runImport, setError],
  );

  const importAsset = useCallback(
    async (asset: LocalImportAsset) => {
      devLog("[useImportMusic] importAsset:", asset.sourceType);
      await runImport(asset);
    },
    [runImport],
  );

  // ============================================================================
  // Control Functions
  // ============================================================================

  const cancelImport = useCallback(() => {
    devLog("[useImportMusic] cancelImport");
    cancellationRef.current.cancelled = true;
  }, []);

  const resetImportState = useCallback(() => {
    devLog("[useImportMusic] resetImportState");
    cancellationRef.current.cancelled = true;
    setState(createInitialState());
  }, []);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    status: state.status,
    error: state.error,
    result: state.result,
    score: state.score,
    preview: state.preview,
    rawMusicXml: state.rawMusicXml,
    validationIssues: state.validationIssues,
    isImporting: state.isImporting,
    currentAsset: state.currentAsset,

    // Actions
    importFromCamera,
    importFromImageLibrary,
    importPdf,
    importMusicXml,
    importAsset,
    cancelImport,
    resetImportState,
    clearError,
  };
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook for checking import permissions
 *
 * @example
 * ```tsx
 * const { canUseCamera, canUseLibrary, requestPermissions } = useImportPermissions();
 * ```
 */
export function useImportPermissions() {
  const [permissions, setPermissions] = useState({
    camera: false,
    mediaLibrary: false,
    checked: false,
  });

  const checkPermissions = useCallback(async () => {
    const { checkCameraPermission, checkMediaLibraryPermission } =
      await import("../services/fileAcquisition");
    const [camera, mediaLibrary] = await Promise.all([
      checkCameraPermission(),
      checkMediaLibraryPermission(),
    ]);
    setPermissions({ camera, mediaLibrary, checked: true });
  }, []);

  const requestCameraPermission = useCallback(async () => {
    const { requestCameraPermission: request } =
      await import("../services/fileAcquisition");
    const granted = await request();
    setPermissions((prev) => ({ ...prev, camera: granted }));
    return granted;
  }, []);

  const requestMediaLibraryPermission = useCallback(async () => {
    const { requestMediaLibraryPermission: request } =
      await import("../services/fileAcquisition");
    const granted = await request();
    setPermissions((prev) => ({ ...prev, mediaLibrary: granted }));
    return granted;
  }, []);

  return {
    canUseCamera: permissions.camera,
    canUseLibrary: permissions.mediaLibrary,
    permissionsChecked: permissions.checked,
    checkPermissions,
    requestCameraPermission,
    requestMediaLibraryPermission,
  };
}
