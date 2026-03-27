/**
 * useUpload - Hook for MusicXML upload flow
 * Handles file selection, preview analysis, and save
 */
import { useState } from "react";
import { Platform } from "react-native";
import { baseUrl } from "../../../../../api/client";

// =============================================================================
// Types
// =============================================================================

/** Upload step states */
export type UploadStep = "select" | "preview" | "saving";

/** Preview data returned from analysis endpoint */
export interface UploadPreview {
  title?: string;
  key_center?: string;
  time_signature?: string;
  measure_count?: number;
  note_count?: number;
  capabilities?: string[];
}

/** Upload result from save endpoint */
export interface UploadResult {
  material_id: number;
  title: string;
  message?: string;
}

/** Return type for useUpload hook */
export interface UseUploadReturn {
  // Modal state
  showModal: boolean;
  openModal: () => void;
  closeModal: () => void;

  // Upload flow state
  step: UploadStep;
  setStep: (step: UploadStep) => void;
  fileName: string;
  fileContent: string;
  title: string;
  setTitle: (title: string) => void;
  keyCenter: string;
  setKeyCenter: (key: string) => void;
  preview: UploadPreview | null;
  error: string | null;
  saving: boolean;

  // Content setters
  setFileName: (name: string) => void;
  setContent: (content: string) => void;

  // Actions
  handleFilePick: () => Promise<void>;
  analyzeFile: () => Promise<UploadPreview | null>;
  confirmUpload: () => Promise<UploadResult | null>;
}

/** Callback for successful upload */
export type OnUploadSuccess = (result: UploadResult) => void;

// =============================================================================
// Constants
// =============================================================================

/**
 * Upload step states
 */
export const UPLOAD_STEPS: Record<string, UploadStep> = {
  SELECT: "select",
  PREVIEW: "preview",
  SAVING: "saving",
};

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for managing MusicXML upload workflow
 * @param onSuccess - Callback after successful upload
 * @returns Upload state and functions
 */
export function useUpload(onSuccess?: OnUploadSuccess): UseUploadReturn {
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<UploadStep>(UPLOAD_STEPS.SELECT);
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [title, setTitle] = useState("");
  const [keyCenter, setKeyCenter] = useState("");
  const [preview, setPreview] = useState<UploadPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /**
   * Open the upload modal and reset state
   */
  const openModal = (): void => {
    setShowModal(true);
    setStep(UPLOAD_STEPS.SELECT);
    setFileName("");
    setFileContent("");
    setTitle("");
    setKeyCenter("");
    setPreview(null);
    setError(null);
  };

  /**
   * Close the upload modal
   */
  const closeModal = (): void => {
    setShowModal(false);
  };

  /**
   * Handle file selection (web only - uses file input)
   * On mobile, user should paste content directly
   */
  const handleFilePick = async (): Promise<void> => {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".xml,.musicxml";
      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          setFileName(file.name);
          const content = await file.text();
          setFileContent(content);
          // Auto-fill title from filename
          const nameWithoutExt = file.name.replace(/\.(xml|musicxml)$/i, "");
          setTitle(nameWithoutExt);
        }
      };
      input.click();
    } else {
      alert("On mobile, please paste MusicXML content in the text area below.");
    }
  };

  /**
   * Analyze uploaded file content before saving
   * @returns Preview data or null on error
   */
  const analyzeFile = async (): Promise<UploadPreview | null> => {
    if (!fileContent) {
      setError("Please select or paste a MusicXML file first");
      return null;
    }

    setStep(UPLOAD_STEPS.PREVIEW);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/materials/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Untitled",
          musicxml_content: fileContent,
          original_key_center: keyCenter || null,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Analysis failed");
      }

      const previewData = await response.json();
      setPreview(previewData);

      // Auto-fill title from analysis if not set
      if (previewData.title && !title) {
        setTitle(previewData.title);
      }

      return previewData as UploadPreview;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      setError(message);
      setStep(UPLOAD_STEPS.SELECT);
      return null;
    }
  };

  /**
   * Confirm and save the uploaded material
   * @returns Result with material_id or null on error
   */
  const confirmUpload = async (): Promise<UploadResult | null> => {
    if (!preview) return null;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/materials/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || preview.title || "Untitled",
          musicxml_content: fileContent,
          original_key_center: keyCenter || null,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Upload failed");
      }

      const result = await response.json();
      setShowModal(false);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(result as UploadResult);
      }

      return result as UploadResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Set file content directly (for paste input)
   * @param content - MusicXML content
   */
  const setContent = (content: string): void => {
    setFileContent(content);
    if (!fileName) {
      setFileName("pasted-content.musicxml");
    }
  };

  return {
    // Modal state
    showModal,
    openModal,
    closeModal,

    // Upload flow state
    step,
    setStep,
    fileName,
    fileContent,
    title,
    setTitle,
    keyCenter,
    setKeyCenter,
    preview,
    error,
    saving,

    // Content setters
    setFileName,
    setContent,

    // Actions
    handleFilePick,
    analyzeFile,
    confirmUpload,
  };
}

export default useUpload;
