/**
 * useUpload - Hook for MusicXML upload flow
 * Handles file selection, preview analysis, and save
 */
import { useState } from "react";
import { Platform } from "react-native";
import { baseUrl } from "../../../../../api/client";

/**
 * Upload step states
 * @type {Object}
 */
export const UPLOAD_STEPS = {
  SELECT: "select",
  PREVIEW: "preview",
  SAVING: "saving",
};

/**
 * Hook for managing MusicXML upload workflow
 * @param {Function} onSuccess - Callback after successful upload
 * @returns {Object} Upload state and functions
 */
export function useUpload(onSuccess) {
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(UPLOAD_STEPS.SELECT);
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [title, setTitle] = useState("");
  const [keyCenter, setKeyCenter] = useState("");
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  /**
   * Open the upload modal and reset state
   */
  const openModal = () => {
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
  const closeModal = () => {
    setShowModal(false);
  };

  /**
   * Handle file selection (web only - uses file input)
   * On mobile, user should paste content directly
   */
  const handleFilePick = async () => {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".xml,.musicxml";
      input.onchange = async (e) => {
        const file = e.target.files[0];
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
   * @returns {Object|null} Preview data or null on error
   */
  const analyzeFile = async () => {
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

      return previewData;
    } catch (err) {
      setError(err.message);
      setStep(UPLOAD_STEPS.SELECT);
      return null;
    }
  };

  /**
   * Confirm and save the uploaded material
   * @returns {Object|null} Result with material_id or null on error
   */
  const confirmUpload = async () => {
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
        onSuccess(result);
      }

      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Set file content directly (for paste input)
   * @param {string} content - MusicXML content
   */
  const setContent = (content) => {
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
