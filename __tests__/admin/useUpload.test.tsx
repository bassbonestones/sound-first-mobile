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
  // CONFIRM UPLOAD
  // ==========================================================================
  describe("confirmUpload", () => {
    it("returns null when no preview is set", async () => {
      const { result } = renderHook(() => useUpload(mockOnSuccess));

      let uploadResult: any;
      await act(async () => {
        uploadResult = await result.current.confirmUpload();
      });

      expect(uploadResult).toBeNull();
      expect(result.current.saving).toBe(false);
    });

    it("sets saving to true during upload", async () => {
      const mockPreview = { measures: 32, tempo: 120 };
      const mockUploadResult = { material_id: "abc-123" };

      // Setup analyze response
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPreview),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUploadResult),
        });

      const { result } = renderHook(() => useUpload(mockOnSuccess));

      // Set content and analyze first
      act(() => {
        result.current.setContent("<xml>content</xml>");
        result.current.setTitle("Test Song");
      });

      await act(async () => {
        await result.current.analyzeFile();
      });

      // Now confirm upload
      await act(async () => {
        await result.current.confirmUpload();
      });

      // Finally saving should be false
      expect(result.current.saving).toBe(false);
    });

    it("calls success callback on successful upload", async () => {
      const mockPreview = { measures: 32, tempo: 120 };
      const mockUploadResult = { material_id: "abc-123" };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPreview),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUploadResult),
        });

      const { result } = renderHook(() => useUpload(mockOnSuccess));

      act(() => {
        result.current.setContent("<xml>content</xml>");
        result.current.setTitle("Test Song");
      });

      await act(async () => {
        await result.current.analyzeFile();
      });

      await act(async () => {
        await result.current.confirmUpload();
      });

      expect(mockOnSuccess).toHaveBeenCalledWith(mockUploadResult);
    });

    it("closes modal on successful upload", async () => {
      const mockPreview = { measures: 32, tempo: 120 };
      const mockUploadResult = { material_id: "abc-123" };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPreview),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUploadResult),
        });

      const { result } = renderHook(() => useUpload(mockOnSuccess));

      act(() => {
        result.current.openModal();
        result.current.setContent("<xml>content</xml>");
        result.current.setTitle("Test Song");
      });

      await act(async () => {
        await result.current.analyzeFile();
      });

      await act(async () => {
        await result.current.confirmUpload();
      });

      expect(result.current.showModal).toBe(false);
    });

    it("returns upload result on success", async () => {
      const mockPreview = { measures: 32 };
      const mockUploadResult = { material_id: "xyz-789", title: "Test Song" };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPreview),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUploadResult),
        });

      const { result } = renderHook(() => useUpload(mockOnSuccess));

      act(() => {
        result.current.setContent("<xml>content</xml>");
        result.current.setTitle("Test Song");
      });

      await act(async () => {
        await result.current.analyzeFile();
      });

      let uploadResult: any;
      await act(async () => {
        uploadResult = await result.current.confirmUpload();
      });

      expect(uploadResult).toEqual(mockUploadResult);
    });

    it("handles upload error with detail message", async () => {
      const mockPreview = { measures: 32 };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPreview),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ detail: "Duplicate material" }),
        });

      const { result } = renderHook(() => useUpload(mockOnSuccess));

      act(() => {
        result.current.setContent("<xml>content</xml>");
        result.current.setTitle("Test Song");
      });

      await act(async () => {
        await result.current.analyzeFile();
      });

      let uploadResult: any;
      await act(async () => {
        uploadResult = await result.current.confirmUpload();
      });

      expect(uploadResult).toBeNull();
      expect(result.current.error).toBe("Duplicate material");
      expect(result.current.saving).toBe(false);
    });

    it("handles upload error without detail message", async () => {
      const mockPreview = { measures: 32 };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPreview),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({}),
        });

      const { result } = renderHook(() => useUpload(mockOnSuccess));

      act(() => {
        result.current.setContent("<xml>content</xml>");
        result.current.setTitle("Test Song");
      });

      await act(async () => {
        await result.current.analyzeFile();
      });

      let uploadResult: any;
      await act(async () => {
        uploadResult = await result.current.confirmUpload();
      });

      expect(uploadResult).toBeNull();
      expect(result.current.error).toBe("Upload failed");
    });

    it("handles network error during upload", async () => {
      const mockPreview = { measures: 32 };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPreview),
        })
        .mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useUpload(mockOnSuccess));

      act(() => {
        result.current.setContent("<xml>content</xml>");
        result.current.setTitle("Test Song");
      });

      await act(async () => {
        await result.current.analyzeFile();
      });

      let uploadResult: any;
      await act(async () => {
        uploadResult = await result.current.confirmUpload();
      });

      expect(uploadResult).toBeNull();
      expect(result.current.error).toBe("Network error");
      expect(result.current.saving).toBe(false);
    });

    it("uses preview title when title not set", async () => {
      const mockPreview = { measures: 32, title: "Preview Title" };
      const mockUploadResult = { material_id: "abc-123" };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPreview),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUploadResult),
        });

      const { result } = renderHook(() => useUpload(mockOnSuccess));

      act(() => {
        result.current.setContent("<xml>content</xml>");
        // Don't set title explicitly
      });

      await act(async () => {
        await result.current.analyzeFile();
      });

      await act(async () => {
        await result.current.confirmUpload();
      });

      // Verify upload was called (check fetch calls)
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("works without onSuccess callback", async () => {
      const mockPreview = { measures: 32 };
      const mockUploadResult = { material_id: "abc-123" };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPreview),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUploadResult),
        });

      // Pass null callback
      const { result } = renderHook(() => useUpload(null));

      act(() => {
        result.current.setContent("<xml>content</xml>");
        result.current.setTitle("Test Song");
      });

      await act(async () => {
        await result.current.analyzeFile();
      });

      let uploadResult: any;
      await act(async () => {
        uploadResult = await result.current.confirmUpload();
      });

      // Should succeed without calling a callback
      expect(uploadResult).toEqual(mockUploadResult);
    });
  });

  // ==========================================================================
  // HANDLE FILE PICK
  // ==========================================================================
  describe("handleFilePick", () => {
    const originalAlert = global.alert;
    const originalDocument = global.document;

    beforeEach(() => {
      // Ensure clean state
      global.alert = jest.fn();
    });

    afterEach(() => {
      global.alert = originalAlert;
    });

    it("shows alert on mobile platform", async () => {
      // Mock Platform.OS as native
      const originalPlatform = Platform.OS;
      Object.defineProperty(Platform, "OS", { value: "ios", writable: true });

      const { result } = renderHook(() => useUpload(mockOnSuccess));

      await act(async () => {
        await result.current.handleFilePick();
      });

      expect(global.alert).toHaveBeenCalledWith(
        "On mobile, please paste MusicXML content in the text area below.",
      );

      Object.defineProperty(Platform, "OS", {
        value: originalPlatform,
        writable: true,
      });
    });

    it("creates file input on web platform", async () => {
      // Mock Platform.OS as web
      const originalPlatform = Platform.OS;
      Object.defineProperty(Platform, "OS", { value: "web", writable: true });

      // Mock document.createElement
      const mockInput = {
        type: "",
        accept: "",
        onchange: null as any,
        click: jest.fn(),
      };

      const mockDocument = {
        createElement: jest.fn().mockReturnValue(mockInput),
      };
      (global as any).document = mockDocument;

      const { result } = renderHook(() => useUpload(mockOnSuccess));

      await act(async () => {
        await result.current.handleFilePick();
      });

      expect(mockDocument.createElement).toHaveBeenCalledWith("input");
      expect(mockInput.type).toBe("file");
      expect(mockInput.accept).toBe(".xml,.musicxml");
      expect(mockInput.click).toHaveBeenCalled();

      Object.defineProperty(Platform, "OS", {
        value: originalPlatform,
        writable: true,
      });
      (global as any).document = originalDocument;
    });

    it("handles file selection on web", async () => {
      const originalPlatform = Platform.OS;
      Object.defineProperty(Platform, "OS", { value: "web", writable: true });

      let capturedOnChange: any = null;
      const mockInput: any = {
        type: "",
        accept: "",
        click: jest.fn(),
      };

      // Use defineProperty to capture the onchange assignment
      Object.defineProperty(mockInput, "onchange", {
        get: () => capturedOnChange,
        set: (fn: any) => {
          capturedOnChange = fn;
        },
        configurable: true,
      });

      const mockDocument = {
        createElement: jest.fn().mockReturnValue(mockInput),
      };
      (global as any).document = mockDocument;

      const { result } = renderHook(() => useUpload(mockOnSuccess));

      await act(async () => {
        await result.current.handleFilePick();
      });

      // Verify onchange was captured
      expect(capturedOnChange).not.toBeNull();

      // Simulate file selection
      const mockFile = {
        name: "test-song.musicxml",
        text: jest.fn().mockResolvedValue("<score>content</score>"),
      };

      await act(async () => {
        await capturedOnChange({ target: { files: [mockFile] } });
      });

      expect(result.current.fileName).toBe("test-song.musicxml");
      expect(result.current.fileContent).toBe("<score>content</score>");
      expect(result.current.title).toBe("test-song");

      Object.defineProperty(Platform, "OS", {
        value: originalPlatform,
        writable: true,
      });
      (global as any).document = originalDocument;
    });

    it("handles .xml extension removal from title", async () => {
      const originalPlatform = Platform.OS;
      Object.defineProperty(Platform, "OS", { value: "web", writable: true });

      let capturedOnChange: any = null;
      const mockInput: any = {
        type: "",
        accept: "",
        click: jest.fn(),
      };

      Object.defineProperty(mockInput, "onchange", {
        get: () => capturedOnChange,
        set: (fn: any) => {
          capturedOnChange = fn;
        },
        configurable: true,
      });

      const mockDocument = {
        createElement: jest.fn().mockReturnValue(mockInput),
      };
      (global as any).document = mockDocument;

      const { result } = renderHook(() => useUpload(mockOnSuccess));

      await act(async () => {
        await result.current.handleFilePick();
      });

      const mockFile = {
        name: "another-song.xml",
        text: jest.fn().mockResolvedValue("<score></score>"),
      };

      await act(async () => {
        await capturedOnChange({ target: { files: [mockFile] } });
      });

      expect(result.current.title).toBe("another-song");

      Object.defineProperty(Platform, "OS", {
        value: originalPlatform,
        writable: true,
      });
      (global as any).document = originalDocument;
    });

    it("handles no file selected", async () => {
      const originalPlatform = Platform.OS;
      Object.defineProperty(Platform, "OS", { value: "web", writable: true });

      let capturedOnChange: any = null;
      const mockInput: any = {
        type: "",
        accept: "",
        click: jest.fn(),
      };

      Object.defineProperty(mockInput, "onchange", {
        get: () => capturedOnChange,
        set: (fn: any) => {
          capturedOnChange = fn;
        },
        configurable: true,
      });

      const mockDocument = {
        createElement: jest.fn().mockReturnValue(mockInput),
      };
      (global as any).document = mockDocument;

      const { result } = renderHook(() => useUpload(mockOnSuccess));

      await act(async () => {
        await result.current.handleFilePick();
      });

      // Simulate no file selected (empty files array)
      await act(async () => {
        capturedOnChange({ target: { files: [] } });
      });

      // Should not change state
      expect(result.current.fileName).toBe("");

      Object.defineProperty(Platform, "OS", {
        value: originalPlatform,
        writable: true,
      });
      (global as any).document = originalDocument;
    });
  });

  // ==========================================================================
  // ANALYZE FILE - ADDITIONAL TESTS
  // ==========================================================================
  describe("analyzeFile - additional coverage", () => {
    it("auto-fills title from preview when title is empty", async () => {
      const mockPreview = { measures: 32, title: "Auto-Detected Title" };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPreview),
      });

      const { result } = renderHook(() => useUpload(mockOnSuccess));

      act(() => {
        result.current.setContent("<xml>content</xml>");
        // Don't set title
      });

      await act(async () => {
        await result.current.analyzeFile();
      });

      expect(result.current.title).toBe("Auto-Detected Title");
    });

    it("does not override existing title from preview", async () => {
      const mockPreview = { measures: 32, title: "Preview Title" };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPreview),
      });

      const { result } = renderHook(() => useUpload(mockOnSuccess));

      act(() => {
        result.current.setContent("<xml>content</xml>");
        result.current.setTitle("User Title");
      });

      await act(async () => {
        await result.current.analyzeFile();
      });

      expect(result.current.title).toBe("User Title");
    });

    it("handles analyze error with detail message", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ detail: "Invalid MusicXML format" }),
      });

      const { result } = renderHook(() => useUpload(mockOnSuccess));

      act(() => {
        result.current.setContent("<xml>invalid</xml>");
      });

      await act(async () => {
        await result.current.analyzeFile();
      });

      expect(result.current.error).toBe("Invalid MusicXML format");
      expect(result.current.step).toBe(UPLOAD_STEPS.SELECT);
    });

    it("handles analyze error without detail message", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      const { result } = renderHook(() => useUpload(mockOnSuccess));

      act(() => {
        result.current.setContent("<xml>invalid</xml>");
      });

      await act(async () => {
        await result.current.analyzeFile();
      });

      expect(result.current.error).toBe("Analysis failed");
      expect(result.current.step).toBe(UPLOAD_STEPS.SELECT);
    });

    it("returns null on analyze failure", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error("Network failure"),
      );

      const { result } = renderHook(() => useUpload(mockOnSuccess));

      act(() => {
        result.current.setContent("<xml>content</xml>");
      });

      let analyzeResult: any;
      await act(async () => {
        analyzeResult = await result.current.analyzeFile();
      });

      expect(analyzeResult).toBeNull();
    });

    it("returns preview data on success", async () => {
      const mockPreview = { measures: 32, tempo: 120, complexity: "high" };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPreview),
      });

      const { result } = renderHook(() => useUpload(mockOnSuccess));

      act(() => {
        result.current.setContent("<xml>content</xml>");
        result.current.setTitle("Test");
      });

      let analyzeResult: any;
      await act(async () => {
        analyzeResult = await result.current.analyzeFile();
      });

      expect(analyzeResult).toEqual(mockPreview);
    });
  });

  // ==========================================================================
  // SET CONTENT
  // ==========================================================================
  describe("setContent", () => {
    it("sets default filename when pasting content without filename", () => {
      const { result } = renderHook(() => useUpload(mockOnSuccess));

      act(() => {
        result.current.setContent("<xml>pasted content</xml>");
      });

      expect(result.current.fileContent).toBe("<xml>pasted content</xml>");
      expect(result.current.fileName).toBe("pasted-content.musicxml");
    });

    it("preserves existing filename when setting content", () => {
      const { result } = renderHook(() => useUpload(mockOnSuccess));

      // Set filename first in separate act
      act(() => {
        result.current.setFileName("existing-file.xml");
      });

      // Then set content in another act
      act(() => {
        result.current.setContent("<xml>updated content</xml>");
      });

      expect(result.current.fileContent).toBe("<xml>updated content</xml>");
      expect(result.current.fileName).toBe("existing-file.xml");
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
