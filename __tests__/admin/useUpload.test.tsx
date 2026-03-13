/**
 * Tests for useUpload hook
 */

import { renderHook, act, waitFor } from "@testing-library/react-native";
import { Platform } from "react-native";

// Mock fetch
global.fetch = jest.fn();

// Mock baseUrl
jest.mock("../../src/api/client", () => ({
  baseUrl: "http://test-api.com",
}));

import {
  useUpload,
  UPLOAD_STEPS,
} from "../../src/screens/Admin/tabs/MaterialExplorer/hooks/useUpload";

describe("useUpload", () => {
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  // ==========================================================================
  // UPLOAD STEPS CONSTANTS
  // ==========================================================================
  describe("UPLOAD_STEPS", () => {
    it("has SELECT step", () => {
      expect(UPLOAD_STEPS.SELECT).toBe("select");
    });

    it("has PREVIEW step", () => {
      expect(UPLOAD_STEPS.PREVIEW).toBe("preview");
    });

    it("has SAVING step", () => {
      expect(UPLOAD_STEPS.SAVING).toBe("saving");
    });
  });

  // ==========================================================================
  // INITIAL STATE
  // ==========================================================================
  describe("Initial State", () => {
    it("returns correct initial state", () => {
      const { result } = renderHook(() => useUpload(mockOnSuccess));

      expect(result.current.showModal).toBe(false);
      expect(result.current.step).toBe(UPLOAD_STEPS.SELECT);
      expect(result.current.fileName).toBe("");
      expect(result.current.fileContent).toBe("");
      expect(result.current.title).toBe("");
      expect(result.current.keyCenter).toBe("");
      expect(result.current.preview).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.saving).toBe(false);
    });
  });

  // ==========================================================================
  // MODAL CONTROL
  // ==========================================================================
  describe("Modal Control", () => {
    it("can open modal", () => {
      const { result } = renderHook(() => useUpload(mockOnSuccess));

      act(() => {
        result.current.openModal();
      });

      expect(result.current.showModal).toBe(true);
    });

    it("resets state when opening modal", () => {
      const { result } = renderHook(() => useUpload(mockOnSuccess));

      // Set some state
      act(() => {
        result.current.openModal();
      });

      act(() => {
        result.current.setFileName("test.xml");
        result.current.setTitle("Test");
      });

      // Close and reopen
      act(() => {
        result.current.closeModal();
      });

      act(() => {
        result.current.openModal();
      });

      expect(result.current.fileName).toBe("");
      expect(result.current.title).toBe("");
    });

    it("can close modal", () => {
      const { result } = renderHook(() => useUpload(mockOnSuccess));

      act(() => {
        result.current.openModal();
      });

      act(() => {
        result.current.closeModal();
      });

      expect(result.current.showModal).toBe(false);
    });
  });

  // ==========================================================================
  // FILE NAME AND CONTENT
  // ==========================================================================
  describe("File Name and Content", () => {
    it("can set file name", () => {
      const { result } = renderHook(() => useUpload(mockOnSuccess));

      act(() => {
        result.current.setFileName("test.xml");
      });

      expect(result.current.fileName).toBe("test.xml");
    });

    it("can set file content", () => {
      const { result } = renderHook(() => useUpload(mockOnSuccess));

      act(() => {
        result.current.setContent("<xml>content</xml>");
      });

      expect(result.current.fileContent).toBe("<xml>content</xml>");
    });
  });

  // ==========================================================================
  // TITLE AND KEY CENTER
  // ==========================================================================
  describe("Title and Key Center", () => {
    it("can set title", () => {
      const { result } = renderHook(() => useUpload(mockOnSuccess));

      act(() => {
        result.current.setTitle("My Song");
      });

      expect(result.current.title).toBe("My Song");
    });

    it("can set key center", () => {
      const { result } = renderHook(() => useUpload(mockOnSuccess));

      act(() => {
        result.current.setKeyCenter("C");
      });

      expect(result.current.keyCenter).toBe("C");
    });
  });

  // ==========================================================================
  // ANALYZE FILE
  // ==========================================================================
  describe("Analyze File", () => {
    it("sets error when no content", async () => {
      const { result } = renderHook(() => useUpload(mockOnSuccess));

      let analyzeResult: any;
      await act(async () => {
        analyzeResult = await result.current.analyzeFile();
      });

      expect(analyzeResult).toBeNull();
      expect(result.current.error).toBe(
        "Please select or paste a MusicXML file first",
      );
    });

    it("transitions to PREVIEW step", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ measures: 32 }),
      });

      const { result } = renderHook(() => useUpload(mockOnSuccess));

      act(() => {
        result.current.setContent("<xml>content</xml>");
        result.current.setTitle("Test");
      });

      await act(async () => {
        await result.current.analyzeFile();
      });

      expect(result.current.step).toBe(UPLOAD_STEPS.PREVIEW);
    });

    it("sets preview data on success", async () => {
      const mockPreview = { measures: 32, tempo: 120 };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPreview),
      });

      const { result } = renderHook(() => useUpload(mockOnSuccess));

      act(() => {
        result.current.setContent("<xml>content</xml>");
        result.current.setTitle("Test");
      });

      await act(async () => {
        await result.current.analyzeFile();
      });

      expect(result.current.preview).toEqual(mockPreview);
    });

    it("handles analyze error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error("Analyze failed"),
      );

      const { result } = renderHook(() => useUpload(mockOnSuccess));

      act(() => {
        result.current.setContent("<xml>content</xml>");
        result.current.setTitle("Test");
      });

      await act(async () => {
        await result.current.analyzeFile();
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  // ==========================================================================
  // SAVE FILE
  // ==========================================================================
  describe("Save File", () => {
    it("has saving state", () => {
      const { result } = renderHook(() => useUpload(mockOnSuccess));
      expect(result.current.saving).toBe(false);
    });
  });

  // ==========================================================================
  // ERROR STATE
  // ==========================================================================
  describe("Error State", () => {
    it("starts with null error", () => {
      const { result } = renderHook(() => useUpload(mockOnSuccess));
      expect(result.current.error).toBeNull();
    });
  });
});
