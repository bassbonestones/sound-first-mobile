/**
 * ImportMusicScreen Component Tests
 */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

import { ImportMusicScreen } from "../src/features/importMusic/screens/ImportMusicScreen";
import * as importHooks from "../src/features/importMusic/hooks/useImportMusic";
import type {
  ImportJobStatus,
  ImportPreviewModel,
  ImportError,
} from "../src/types/import";

// Mock react-native-webview
jest.mock("react-native-webview", () => {
  const { View } = require("react-native");
  return {
    WebView: View,
  };
});

// Mock the useImportMusic hook
jest.mock("../src/features/importMusic/hooks/useImportMusic");

describe("ImportMusicScreen", () => {
  // Default mock state
  const createMockState = (overrides = {}) => ({
    status: {
      status: "idle",
      message: "Ready to import",
      progress: null,
      updatedAt: Date.now(),
      omrJobId: null,
    } as ImportJobStatus,
    error: null as ImportError | null,
    result: null,
    score: null,
    preview: null as ImportPreviewModel | null,
    validationIssues: [],
    isImporting: false,
    currentAsset: null,
    importFromCamera: jest.fn(),
    importFromImageLibrary: jest.fn(),
    importPdf: jest.fn(),
    importMusicXml: jest.fn(),
    importAsset: jest.fn(),
    cancelImport: jest.fn(),
    resetImportState: jest.fn(),
    clearError: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // Idle State Tests
  // ============================================================================

  describe("idle state", () => {
    it("renders import action buttons", () => {
      const mockState = createMockState();
      jest.spyOn(importHooks, "useImportMusic").mockReturnValue(mockState);

      const { getByTestId, getByText } = render(<ImportMusicScreen />);

      expect(getByTestId("import-music-actions")).toBeTruthy();
      expect(getByText("Take Photo")).toBeTruthy();
      expect(getByText("Choose Image")).toBeTruthy();
      expect(getByText("Upload PDF")).toBeTruthy();
      expect(getByText("Import MusicXML")).toBeTruthy();
    });

    it("calls importFromCamera when Take Photo is pressed", () => {
      const mockState = createMockState();
      jest.spyOn(importHooks, "useImportMusic").mockReturnValue(mockState);

      const { getByTestId } = render(<ImportMusicScreen />);

      fireEvent.press(getByTestId("import-music-actions-action-photo"));
      expect(mockState.importFromCamera).toHaveBeenCalled();
    });

    it("calls importFromImageLibrary when Choose Image is pressed", () => {
      const mockState = createMockState();
      jest.spyOn(importHooks, "useImportMusic").mockReturnValue(mockState);

      const { getByTestId } = render(<ImportMusicScreen />);

      fireEvent.press(getByTestId("import-music-actions-action-image"));
      expect(mockState.importFromImageLibrary).toHaveBeenCalled();
    });

    it("calls importPdf when Upload PDF is pressed", () => {
      const mockState = createMockState();
      jest.spyOn(importHooks, "useImportMusic").mockReturnValue(mockState);

      const { getByTestId } = render(<ImportMusicScreen />);

      fireEvent.press(getByTestId("import-music-actions-action-pdf"));
      expect(mockState.importPdf).toHaveBeenCalled();
    });

    it("calls importMusicXml when Import MusicXML is pressed", () => {
      const mockState = createMockState();
      jest.spyOn(importHooks, "useImportMusic").mockReturnValue(mockState);

      const { getByTestId } = render(<ImportMusicScreen />);

      fireEvent.press(
        getByTestId("import-music-actions-action-musicxml_group"),
      );
      expect(mockState.importMusicXml).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Importing State Tests
  // ============================================================================

  describe("importing state", () => {
    it("renders progress indicator when importing", () => {
      const mockState = createMockState({
        isImporting: true,
        status: {
          status: "uploading",
          message: "Uploading...",
          progress: 50,
          updatedAt: Date.now(),
          omrJobId: null,
        },
      });
      jest.spyOn(importHooks, "useImportMusic").mockReturnValue(mockState);

      const { getByTestId, getByText } = render(<ImportMusicScreen />);

      expect(getByTestId("import-music-progress")).toBeTruthy();
      expect(getByText("Uploading...")).toBeTruthy();
    });

    it("shows cancel button during import", () => {
      const mockState = createMockState({
        isImporting: true,
        status: {
          status: "uploading",
          message: "Uploading...",
          progress: 50,
          updatedAt: Date.now(),
          omrJobId: null,
        },
      });
      jest.spyOn(importHooks, "useImportMusic").mockReturnValue(mockState);

      const { getByTestId } = render(<ImportMusicScreen />);

      expect(getByTestId("import-music-progress-cancel")).toBeTruthy();
    });

    it("calls cancelImport when cancel is pressed", () => {
      const mockState = createMockState({
        isImporting: true,
        status: {
          status: "uploading",
          message: "Uploading...",
          progress: 50,
          updatedAt: Date.now(),
          omrJobId: null,
        },
      });
      jest.spyOn(importHooks, "useImportMusic").mockReturnValue(mockState);

      const { getByTestId } = render(<ImportMusicScreen />);

      fireEvent.press(getByTestId("import-music-progress-cancel"));
      expect(mockState.cancelImport).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Error State Tests
  // ============================================================================

  describe("error state", () => {
    it("renders error display when error occurs", () => {
      const mockState = createMockState({
        error: {
          code: "parse_failed",
          message: "Parse failed",
          userMessage: "Could not read the file",
          severity: "fatal",
          recoverable: false,
          recoveryHint: null,
        },
      });
      jest.spyOn(importHooks, "useImportMusic").mockReturnValue(mockState);

      const { getByTestId, getByText } = render(<ImportMusicScreen />);

      expect(getByTestId("import-music-error")).toBeTruthy();
      expect(getByText("Could not read the file")).toBeTruthy();
    });

    it("shows retry button for recoverable errors", () => {
      const mockState = createMockState({
        error: {
          code: "network_error",
          message: "Network error",
          userMessage: "No internet connection",
          severity: "recoverable",
          recoverable: true,
          recoveryHint: "Check your connection",
        },
      });
      jest.spyOn(importHooks, "useImportMusic").mockReturnValue(mockState);

      const { getByTestId } = render(<ImportMusicScreen />);

      expect(getByTestId("import-music-error-retry")).toBeTruthy();
    });

    it("calls resetImportState when retry is pressed", () => {
      const mockState = createMockState({
        error: {
          code: "network_error",
          message: "Network error",
          userMessage: "No internet connection",
          severity: "recoverable",
          recoverable: true,
          recoveryHint: null,
        },
      });
      jest.spyOn(importHooks, "useImportMusic").mockReturnValue(mockState);

      const { getByTestId } = render(<ImportMusicScreen />);

      fireEvent.press(getByTestId("import-music-error-retry"));
      expect(mockState.resetImportState).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Preview State Tests
  // ============================================================================

  describe("preview state", () => {
    const mockPreview: ImportPreviewModel = {
      scoreId: "test-score-id",
      title: "Test Score",
      subtitle: "Test Composer",
      stats: {
        measureCount: 32,
        partCount: 1,
        pageCount: 2,
        timeSignature: "4/4",
        keySignature: "C Major",
        tempo: "120 BPM",
      },
      needsReview: false,
      reviewReasons: [],
      thumbnailUrl: null,
    };

    it("renders preview when import succeeds", () => {
      const mockState = createMockState({
        preview: mockPreview,
        score: { id: "test-score-id" },
      });
      jest.spyOn(importHooks, "useImportMusic").mockReturnValue(mockState);

      const { getByTestId, getByText } = render(<ImportMusicScreen />);

      expect(getByTestId("import-music-preview")).toBeTruthy();
      expect(getByText("Test Score")).toBeTruthy();
      expect(getByText("Test Composer")).toBeTruthy();
    });

    it("shows stats in preview", () => {
      const mockState = createMockState({
        preview: mockPreview,
        score: { id: "test-score-id" },
      });
      jest.spyOn(importHooks, "useImportMusic").mockReturnValue(mockState);

      const { getByTestId } = render(<ImportMusicScreen />);

      expect(getByTestId("import-music-preview-stat-measures")).toBeTruthy();
      expect(getByTestId("import-music-preview-stat-parts")).toBeTruthy();
    });

    it("shows continue button", () => {
      const mockState = createMockState({
        preview: mockPreview,
        score: { id: "test-score-id" },
      });
      jest.spyOn(importHooks, "useImportMusic").mockReturnValue(mockState);

      const { getByTestId } = render(<ImportMusicScreen />);

      expect(getByTestId("import-music-preview-continue")).toBeTruthy();
    });

    it("shows review button when needsReview is true", () => {
      const mockState = createMockState({
        preview: {
          ...mockPreview,
          needsReview: true,
          reviewReasons: ["Low confidence recognition"],
        },
        score: { id: "test-score-id" },
      });
      jest.spyOn(importHooks, "useImportMusic").mockReturnValue(mockState);

      const { getByTestId, getByText } = render(<ImportMusicScreen />);

      expect(getByTestId("import-music-preview-review")).toBeTruthy();
      expect(getByText("Review Recommended")).toBeTruthy();
    });

    it("calls resetImportState when dismiss is pressed", () => {
      const mockState = createMockState({
        preview: mockPreview,
        score: { id: "test-score-id" },
      });
      jest.spyOn(importHooks, "useImportMusic").mockReturnValue(mockState);

      const { getByTestId } = render(<ImportMusicScreen />);

      fireEvent.press(getByTestId("import-music-preview-dismiss"));
      expect(mockState.resetImportState).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  describe("accessibility", () => {
    it("has accessible action buttons", () => {
      const mockState = createMockState();
      jest.spyOn(importHooks, "useImportMusic").mockReturnValue(mockState);

      const { getByLabelText } = render(<ImportMusicScreen />);

      // Check that buttons have proper accessibility labels
      expect(getByLabelText(/Take Photo/i)).toBeTruthy();
      expect(getByLabelText(/Choose Image/i)).toBeTruthy();
      expect(getByLabelText(/Upload PDF/i)).toBeTruthy();
      expect(getByLabelText(/Import MusicXML/i)).toBeTruthy();
    });

    it("has accessible cancel button", () => {
      const mockState = createMockState({
        isImporting: true,
        status: {
          status: "uploading",
          message: "Uploading...",
          progress: 50,
          updatedAt: Date.now(),
          omrJobId: null,
        },
      });
      jest.spyOn(importHooks, "useImportMusic").mockReturnValue(mockState);

      const { getByLabelText } = render(<ImportMusicScreen />);

      expect(getByLabelText(/Cancel import/i)).toBeTruthy();
    });
  });
});
