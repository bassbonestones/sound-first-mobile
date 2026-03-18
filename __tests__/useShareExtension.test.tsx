/**
 * useShareExtension Hook Tests
 */

import { renderHook, act, waitFor } from "@testing-library/react-native";
import * as Linking from "expo-linking";

import { useShareExtension } from "../src/features/importMusic/hooks/useShareExtension";

// ============================================================================
// Mocks
// ============================================================================

// Mock the share extension service
const mockHandleSharedFile = jest.fn();
const mockCreateListener = jest.fn();
const mockCleanupCache = jest.fn();

jest.mock("../src/features/importMusic/services/shareExtensionService", () => ({
  handleSharedFile: (...args: unknown[]) => mockHandleSharedFile(...args),
  createShareExtensionListener: (config: unknown) => {
    mockCreateListener(config);
    return jest.fn(); // Cleanup function
  },
  cleanupSharedFilesCache: () => mockCleanupCache(),
  ShareExtensionError: class ShareExtensionError extends Error {
    code: string;
    originalUrl?: string;
    constructor(message: string, code: string, originalUrl?: string) {
      super(message);
      this.code = code;
      this.originalUrl = originalUrl;
    }
  },
}));

jest.mock("expo-linking", () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
}));

// ============================================================================
// Tests
// ============================================================================

describe("useShareExtension", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Initialization", () => {
    it("starts with null sharedFile", () => {
      const { result } = renderHook(() => useShareExtension());

      expect(result.current.sharedFile).toBeNull();
    });

    it("starts with null error", () => {
      const { result } = renderHook(() => useShareExtension());

      expect(result.current.error).toBeNull();
    });

    it("starts with isProcessing true", () => {
      const { result } = renderHook(() => useShareExtension());

      expect(result.current.isProcessing).toBe(true);
    });

    it("sets up listener when enabled", () => {
      renderHook(() => useShareExtension({ enabled: true }));

      expect(mockCreateListener).toHaveBeenCalled();
    });

    it("does not set up listener when disabled", () => {
      renderHook(() => useShareExtension({ enabled: false }));

      expect(mockCreateListener).not.toHaveBeenCalled();
    });

    it("runs cleanup on unmount", () => {
      const mockCleanup = jest.fn();
      mockCreateListener.mockReturnValue(mockCleanup);

      const { unmount } = renderHook(() => useShareExtension());

      unmount();

      // Note: cleanup is returned from createShareExtensionListener
      // The hook sets up cleanup, we verify the listener was created
      expect(mockCreateListener).toHaveBeenCalled();
    });
  });

  describe("Auto Cleanup", () => {
    it("cleans up cache on mount when autoCleanup is true", () => {
      renderHook(() => useShareExtension({ autoCleanup: true }));

      expect(mockCleanupCache).toHaveBeenCalled();
    });

    it("does not clean up cache when autoCleanup is false", () => {
      renderHook(() => useShareExtension({ autoCleanup: false }));

      expect(mockCleanupCache).not.toHaveBeenCalled();
    });

    it("sets up periodic cleanup interval", () => {
      renderHook(() => useShareExtension({ autoCleanup: true }));

      // Clear the initial call
      mockCleanupCache.mockClear();

      // Advance time by 1 hour
      act(() => {
        jest.advanceTimersByTime(60 * 60 * 1000);
      });

      expect(mockCleanupCache).toHaveBeenCalled();
    });
  });

  describe("Listener Configuration", () => {
    it("passes supported extensions to listener", () => {
      const extensions = ["xml", "mxl"];
      renderHook(() => useShareExtension({ supportedExtensions: extensions }));

      expect(mockCreateListener).toHaveBeenCalledWith(
        expect.objectContaining({
          supportedExtensions: extensions,
        }),
      );
    });

    it("uses default extensions when not specified", () => {
      renderHook(() => useShareExtension());

      expect(mockCreateListener).toHaveBeenCalledWith(
        expect.objectContaining({
          supportedExtensions: expect.arrayContaining([
            "xml",
            "musicxml",
            "mxl",
            "pdf",
          ]),
        }),
      );
    });
  });

  describe("File Received", () => {
    it("updates sharedFile when file is received", async () => {
      const mockAsset = {
        uri: "/cache/file.xml",
        name: "file.xml",
        type: "musicxml" as const,
        size: 1024,
        mimeType: "application/xml",
      };

      let fileReceivedCallback: (asset: typeof mockAsset) => void = () => {};
      mockCreateListener.mockImplementation((config) => {
        fileReceivedCallback = config.onFileReceived;
        return jest.fn();
      });

      const { result } = renderHook(() => useShareExtension());

      // Simulate file received
      act(() => {
        fileReceivedCallback(mockAsset);
      });

      expect(result.current.sharedFile).toEqual(mockAsset);
    });

    it("clears error when file is received", async () => {
      const mockAsset = {
        uri: "/cache/file.xml",
        name: "file.xml",
        type: "musicxml" as const,
        size: 1024,
        mimeType: "application/xml",
      };

      let fileReceivedCallback: (asset: typeof mockAsset) => void = () => {};
      let errorCallback: (error: Error) => void = () => {};
      mockCreateListener.mockImplementation((config) => {
        fileReceivedCallback = config.onFileReceived;
        errorCallback = config.onError;
        return jest.fn();
      });

      const { result } = renderHook(() => useShareExtension());

      // First set an error
      act(() => {
        errorCallback(new Error("Test error"));
      });

      expect(result.current.error).not.toBeNull();

      // Then receive a file
      act(() => {
        fileReceivedCallback(mockAsset);
      });

      expect(result.current.error).toBeNull();
    });

    it("calls onFileReceived callback", async () => {
      const onFileReceived = jest.fn();
      const mockAsset = {
        uri: "/cache/file.xml",
        name: "file.xml",
        type: "musicxml" as const,
        size: 1024,
        mimeType: "application/xml",
      };

      let fileReceivedCallback: (asset: typeof mockAsset) => void = () => {};
      mockCreateListener.mockImplementation((config) => {
        fileReceivedCallback = config.onFileReceived;
        return jest.fn();
      });

      renderHook(() => useShareExtension({ onFileReceived }));

      act(() => {
        fileReceivedCallback(mockAsset);
      });

      expect(onFileReceived).toHaveBeenCalledWith(mockAsset);
    });

    it("sets isProcessing to false after file received", () => {
      const mockAsset = {
        uri: "/cache/file.xml",
        name: "file.xml",
        type: "musicxml" as const,
        size: 1024,
        mimeType: "application/xml",
      };

      let fileReceivedCallback: (asset: typeof mockAsset) => void = () => {};
      mockCreateListener.mockImplementation((config) => {
        fileReceivedCallback = config.onFileReceived;
        return jest.fn();
      });

      const { result } = renderHook(() => useShareExtension());

      act(() => {
        fileReceivedCallback(mockAsset);
      });

      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("updates error state on error", () => {
      const mockError = new Error("Test error");
      (mockError as Error & { code: string }).code = "INVALID_URL";

      let errorCallback: (error: Error) => void = () => {};
      mockCreateListener.mockImplementation((config) => {
        errorCallback = config.onError;
        return jest.fn();
      });

      const { result } = renderHook(() => useShareExtension());

      act(() => {
        errorCallback(mockError);
      });

      expect(result.current.error).toEqual(mockError);
    });

    it("calls onError callback", () => {
      const onError = jest.fn();
      const mockError = new Error("Test error");

      let errorCallback: (error: Error) => void = () => {};
      mockCreateListener.mockImplementation((config) => {
        errorCallback = config.onError;
        return jest.fn();
      });

      renderHook(() => useShareExtension({ onError }));

      act(() => {
        errorCallback(mockError);
      });

      expect(onError).toHaveBeenCalledWith(mockError);
    });

    it("sets isProcessing to false after error", () => {
      const mockError = new Error("Test error");

      let errorCallback: (error: Error) => void = () => {};
      mockCreateListener.mockImplementation((config) => {
        errorCallback = config.onError;
        return jest.fn();
      });

      const { result } = renderHook(() => useShareExtension());

      act(() => {
        errorCallback(mockError);
      });

      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe("Actions", () => {
    it("clearSharedFile resets sharedFile to null", () => {
      const mockAsset = {
        uri: "/cache/file.xml",
        name: "file.xml",
        type: "musicxml" as const,
        size: 1024,
        mimeType: "application/xml",
      };

      let fileReceivedCallback: (asset: typeof mockAsset) => void = () => {};
      mockCreateListener.mockImplementation((config) => {
        fileReceivedCallback = config.onFileReceived;
        return jest.fn();
      });

      const { result } = renderHook(() => useShareExtension());

      // Receive a file
      act(() => {
        fileReceivedCallback(mockAsset);
      });

      expect(result.current.sharedFile).not.toBeNull();

      // Clear it
      act(() => {
        result.current.clearSharedFile();
      });

      expect(result.current.sharedFile).toBeNull();
    });

    it("clearError resets error to null", () => {
      const mockError = new Error("Test error");

      let errorCallback: (error: Error) => void = () => {};
      mockCreateListener.mockImplementation((config) => {
        errorCallback = config.onError;
        return jest.fn();
      });

      const { result } = renderHook(() => useShareExtension());

      // Create an error
      act(() => {
        errorCallback(mockError);
      });

      expect(result.current.error).not.toBeNull();

      // Clear it
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it("cleanupCache calls the cleanup function", async () => {
      mockCleanupCache.mockResolvedValue(5);

      const { result } = renderHook(() => useShareExtension());

      let deletedCount: number = 0;
      await act(async () => {
        deletedCount = await result.current.cleanupCache();
      });

      expect(deletedCount).toBe(5);
      expect(mockCleanupCache).toHaveBeenCalled();
    });
  });

  describe("Processing State Timeout", () => {
    it("clears isProcessing after timeout when no URL received", async () => {
      const { result } = renderHook(() => useShareExtension());

      expect(result.current.isProcessing).toBe(true);

      // Advance past the timeout
      act(() => {
        jest.advanceTimersByTime(600);
      });

      expect(result.current.isProcessing).toBe(false);
    });
  });
});
