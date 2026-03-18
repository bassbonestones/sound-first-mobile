/**
 * Share Extension Service Tests
 */

import * as FileSystem from "expo-file-system";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

import {
  parseShareUrl,
  copySharedFileToCache,
  handleSharedFile,
  cleanupSharedFilesCache,
  shareExtensionAssetToLocal,
  createShareExtensionListener,
  ShareExtensionError,
  ShareExtensionAsset,
} from "../src/features/importMusic/services/shareExtensionService";

// ============================================================================
// Mocks
// ============================================================================

jest.mock("expo-file-system", () => ({
  cacheDirectory: "/mock/cache/",
  getInfoAsync: jest.fn(),
  copyAsync: jest.fn(),
  deleteAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
}));

jest.mock("expo-linking", () => ({
  parse: jest.fn(),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
}));

// Mock the import constants
jest.mock("../src/constants/import", () => ({
  MAX_FILE_SIZE: {
    musicxml: 10 * 1024 * 1024,
    mxl: 10 * 1024 * 1024,
    photo: 25 * 1024 * 1024,
    image: 25 * 1024 * 1024,
    pdf: 50 * 1024 * 1024,
  },
}));

const mockFileSystem = FileSystem as jest.Mocked<typeof FileSystem>;
const mockLinking = Linking as jest.Mocked<typeof Linking>;

// ============================================================================
// Tests
// ============================================================================

describe("shareExtensionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("parseShareUrl", () => {
    describe("file:// URLs", () => {
      it("parses valid file:// MusicXML URL", () => {
        const result = parseShareUrl("file:///path/to/score.musicxml");

        expect(result.isValid).toBe(true);
        expect(result.filePath).toBe("/path/to/score.musicxml");
        expect(result.fileName).toBe("score.musicxml");
        expect(result.fileType).toBe("musicxml");
        expect(result.error).toBeNull();
      });

      it("parses valid file:// MXL URL", () => {
        const result = parseShareUrl("file:///path/to/score.mxl");

        expect(result.isValid).toBe(true);
        expect(result.fileType).toBe("mxl");
      });

      it("parses valid file:// PDF URL", () => {
        const result = parseShareUrl("file:///path/to/sheet.pdf");

        expect(result.isValid).toBe(true);
        expect(result.fileType).toBe("pdf");
      });

      it("parses valid file:// image URLs", () => {
        expect(parseShareUrl("file:///photo.jpg").fileType).toBe("image");
        expect(parseShareUrl("file:///photo.jpeg").fileType).toBe("image");
        expect(parseShareUrl("file:///photo.png").fileType).toBe("image");
        expect(parseShareUrl("file:///photo.heic").fileType).toBe("image");
      });

      it("decodes URL-encoded paths", () => {
        const result = parseShareUrl("file:///path%20to/my%20score.musicxml");

        expect(result.isValid).toBe(true);
        expect(result.filePath).toBe("/path to/my score.musicxml");
        expect(result.fileName).toBe("my score.musicxml");
      });
    });

    describe("content:// URLs", () => {
      it("parses Android content:// URL", () => {
        const result = parseShareUrl(
          "content://com.android.providers.downloads.documents/document/123",
        );

        expect(result.isValid).toBe(false); // No extension to determine type
        expect(result.filePath).toBe(
          "content://com.android.providers.downloads.documents/document/123",
        );
      });

      it("parses content:// URL with filename", () => {
        const result = parseShareUrl(
          "content://com.provider/files/score.musicxml",
        );

        expect(result.isValid).toBe(true);
        expect(result.fileType).toBe("musicxml");
      });
    });

    describe("soundfirst:// URLs", () => {
      it("parses custom deep link URL", () => {
        mockLinking.parse.mockReturnValue({
          scheme: "soundfirst",
          hostname: "import",
          path: "/import",
          queryParams: {
            file: "/path/to/score.xml",
            name: "score.xml",
          },
        });

        const result = parseShareUrl(
          "soundfirst://import?file=/path/to/score.xml&name=score.xml",
        );

        expect(result.isValid).toBe(true);
        expect(result.fileType).toBe("musicxml");
      });
    });

    describe("Invalid URLs", () => {
      it("returns invalid for empty URL", () => {
        const result = parseShareUrl("");

        expect(result.isValid).toBe(false);
        expect(result.error).toBe("Invalid or empty URL");
      });

      it("returns invalid for null-like URL", () => {
        const result = parseShareUrl(null as unknown as string);

        expect(result.isValid).toBe(false);
      });

      it("returns invalid for unsupported scheme", () => {
        const result = parseShareUrl("http://example.com/score.xml");

        expect(result.isValid).toBe(false);
        expect(result.error).toContain("Unsupported URL scheme");
      });

      it("returns invalid for unsupported file type", () => {
        const result = parseShareUrl("file:///path/to/file.docx");

        expect(result.isValid).toBe(false);
        expect(result.error).toContain("Unsupported file type");
      });

      it("handles malformed URL-encoded paths gracefully", () => {
        // Malformed percent encoding that throws in decodeURIComponent
        const result = parseShareUrl("file:///path%ZZinvalid/score.musicxml");

        expect(result.isValid).toBe(false);
        expect(result.error).not.toBeNull();
      });
    });
  });

  describe("copySharedFileToCache", () => {
    beforeEach(() => {
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        size: 1024,
        isDirectory: false,
        uri: "/test",
        modificationTime: 0,
      });
      mockFileSystem.copyAsync.mockResolvedValue();
    });

    it("copies file:// URL to cache", async () => {
      const result = await copySharedFileToCache(
        "file:///source/score.xml",
        "score.xml",
      );

      expect(result).toMatch(/^\/mock\/cache\/share_\d+_score\.xml$/);
      expect(mockFileSystem.copyAsync).toHaveBeenCalledWith({
        from: "/source/score.xml",
        to: expect.stringMatching(/share_\d+_score\.xml$/),
      });
    });

    it("sanitizes filename", async () => {
      const result = await copySharedFileToCache(
        "file:///source/my score (1).xml",
        "my score (1).xml",
      );

      expect(result).toContain("my_score__1_.xml");
    });

    it("throws FILE_NOT_FOUND for missing file", async () => {
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: false,
        isDirectory: false,
        uri: "/test",
      });

      await expect(
        copySharedFileToCache("file:///missing.xml", "missing.xml"),
      ).rejects.toThrow(ShareExtensionError);
    });

    it("throws FILE_TOO_LARGE for oversized file", async () => {
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        size: 100 * 1024 * 1024, // 100MB
        isDirectory: false,
        uri: "/test",
        modificationTime: 0,
      });

      await expect(
        copySharedFileToCache("file:///large.xml", "large.xml"),
      ).rejects.toThrow("too large");
    });

    it("copies content:// URL on Android", async () => {
      const originalPlatform = Platform.OS;
      (Platform as { OS: string }).OS = "android";

      await copySharedFileToCache("content://provider/file.xml", "file.xml");

      expect(mockFileSystem.copyAsync).toHaveBeenCalledWith({
        from: "content://provider/file.xml",
        to: expect.stringMatching(/share_\d+_file\.xml$/),
      });

      (Platform as { OS: string }).OS = originalPlatform;
    });

    it("throws for content:// URL on iOS", async () => {
      const originalPlatform = Platform.OS;
      (Platform as { OS: string }).OS = "ios";

      await expect(
        copySharedFileToCache("content://provider/file.xml", "file.xml"),
      ).rejects.toThrow("Content URLs only supported on Android");

      (Platform as { OS: string }).OS = originalPlatform;
    });

    it("throws when cache directory is not available", async () => {
      const originalCacheDir = FileSystem.cacheDirectory;
      (FileSystem as { cacheDirectory: string | null }).cacheDirectory = null;

      await expect(
        copySharedFileToCache("file:///test.xml", "test.xml"),
      ).rejects.toThrow("Cache directory not available");

      (FileSystem as { cacheDirectory: string | null }).cacheDirectory =
        originalCacheDir;
    });

    it("throws for unsupported URL schemes", async () => {
      await expect(
        copySharedFileToCache("ftp://server/file.xml", "file.xml"),
      ).rejects.toThrow("Cannot copy from this URL type");
    });
  });

  describe("handleSharedFile", () => {
    beforeEach(() => {
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        size: 1024,
        isDirectory: false,
        uri: "/test",
        modificationTime: 0,
      });
      mockFileSystem.copyAsync.mockResolvedValue();
    });

    it("returns LocalImportAsset for valid URL", async () => {
      const result = await handleSharedFile("file:///path/to/score.musicxml");

      expect(result).toEqual({
        uri: expect.stringMatching(/share_\d+_score\.musicxml$/),
        name: "score.musicxml",
        type: "musicxml",
        size: 1024,
        mimeType: "application/vnd.recordare.musicxml+xml",
      });
    });

    it("throws for invalid URL", async () => {
      await expect(handleSharedFile("")).rejects.toThrow(ShareExtensionError);
    });

    it("throws for unsupported file type", async () => {
      await expect(
        handleSharedFile("file:///unsupported.docx"),
      ).rejects.toThrow(ShareExtensionError);
    });

    it("returns correct mimeType for MXL", async () => {
      const result = await handleSharedFile("file:///score.mxl");

      expect(result.mimeType).toBe("application/vnd.recordare.musicxml");
    });

    it("returns correct mimeType for PDF", async () => {
      const result = await handleSharedFile("file:///sheet.pdf");

      expect(result.mimeType).toBe("application/pdf");
    });

    it("returns correct mimeType for image", async () => {
      const result = await handleSharedFile("file:///photo.jpg");

      expect(result.mimeType).toBe("image/jpeg");
    });
  });

  describe("cleanupSharedFilesCache", () => {
    it("deletes old shared files", async () => {
      const oldTimestamp = Date.now() - 48 * 60 * 60 * 1000; // 48 hours ago
      mockFileSystem.readDirectoryAsync.mockResolvedValue([
        `share_${oldTimestamp}_old.xml`,
        `share_${Date.now()}_new.xml`,
        "other_file.xml",
      ]);
      mockFileSystem.deleteAsync.mockResolvedValue();

      const deleted = await cleanupSharedFilesCache(24 * 60 * 60 * 1000);

      expect(deleted).toBe(1);
      expect(mockFileSystem.deleteAsync).toHaveBeenCalledTimes(1);
      expect(mockFileSystem.deleteAsync).toHaveBeenCalledWith(
        expect.stringContaining(`share_${oldTimestamp}_old.xml`),
        { idempotent: true },
      );
    });

    it("returns 0 when no cache directory", async () => {
      const originalCacheDir = FileSystem.cacheDirectory;
      (FileSystem as { cacheDirectory: string | null }).cacheDirectory = null;

      const deleted = await cleanupSharedFilesCache();

      expect(deleted).toBe(0);

      (FileSystem as { cacheDirectory: string | null }).cacheDirectory =
        originalCacheDir;
    });

    it("handles errors gracefully", async () => {
      mockFileSystem.readDirectoryAsync.mockRejectedValue(
        new Error("Permission denied"),
      );

      const deleted = await cleanupSharedFilesCache();

      expect(deleted).toBe(0);
    });
  });

  describe("ShareExtensionError", () => {
    it("includes error code", () => {
      const error = new ShareExtensionError(
        "Test error",
        "INVALID_URL",
        "test://url",
      );

      expect(error.code).toBe("INVALID_URL");
      expect(error.originalUrl).toBe("test://url");
      expect(error.message).toBe("Test error");
      expect(error.name).toBe("ShareExtensionError");
    });
  });

  describe("shareExtensionAssetToLocal", () => {
    it("converts ShareExtensionAsset to LocalImportAsset", () => {
      const shareAsset: ShareExtensionAsset = {
        uri: "file:///path/to/score.musicxml",
        name: "score.musicxml",
        type: "musicxml",
        size: 2048,
        mimeType: "application/vnd.recordare.musicxml+xml",
      };

      const localAsset = shareExtensionAssetToLocal(shareAsset);

      expect(localAsset.id).toMatch(/^shared_[a-z0-9]+_[a-z0-9]+$/);
      expect(localAsset.uri).toBe("file:///path/to/score.musicxml");
      expect(localAsset.fileName).toBe("score.musicxml");
      expect(localAsset.sourceType).toBe("musicxml");
      expect(localAsset.fileSize).toBe(2048);
      expect(localAsset.mimeType).toBe(
        "application/vnd.recordare.musicxml+xml",
      );
      expect(localAsset.acquiredAt).toBeLessThanOrEqual(Date.now());
      expect(localAsset.acquiredAt).toBeGreaterThan(Date.now() - 1000);
    });

    it("generates unique IDs for each conversion", () => {
      const shareAsset: ShareExtensionAsset = {
        uri: "file:///score.mxl",
        name: "score.mxl",
        type: "mxl",
        size: 1024,
        mimeType: "application/vnd.recordare.musicxml",
      };

      const asset1 = shareExtensionAssetToLocal(shareAsset);
      const asset2 = shareExtensionAssetToLocal(shareAsset);

      expect(asset1.id).not.toBe(asset2.id);
    });

    it("handles all source types", () => {
      const types: Array<{
        type: "pdf" | "image" | "photo";
        mimeType: string;
      }> = [
        { type: "pdf", mimeType: "application/pdf" },
        { type: "image", mimeType: "image/png" },
        { type: "photo", mimeType: "image/jpeg" },
      ];

      types.forEach(({ type, mimeType }) => {
        const shareAsset: ShareExtensionAsset = {
          uri: "file:///test",
          name: "test",
          type,
          size: 100,
          mimeType,
        };

        const localAsset = shareExtensionAssetToLocal(shareAsset);

        expect(localAsset.sourceType).toBe(type);
        expect(localAsset.mimeType).toBe(mimeType);
      });
    });
  });

  describe("createShareExtensionListener", () => {
    let mockRemove: jest.Mock;
    let urlHandler: ((event: { url: string }) => void) | null;

    beforeEach(() => {
      mockRemove = jest.fn();
      urlHandler = null;

      // Capture the URL handler when addEventListener is called
      (mockLinking.addEventListener as jest.Mock).mockImplementation(
        (event, handler) => {
          if (event === "url") {
            urlHandler = handler;
          }
          return { remove: mockRemove };
        },
      );

      (mockLinking.getInitialURL as jest.Mock).mockResolvedValue(null);
    });

    it("sets up URL event listener", () => {
      const cleanup = createShareExtensionListener({
        supportedExtensions: ["musicxml", "mxl"],
      });

      expect(mockLinking.addEventListener).toHaveBeenCalledWith(
        "url",
        expect.any(Function),
      );

      cleanup();
      expect(mockRemove).toHaveBeenCalled();
    });

    it("checks for initial URL on mount", async () => {
      const onFileReceived = jest.fn();

      (mockLinking.getInitialURL as jest.Mock).mockResolvedValue(
        "file:///score.musicxml",
      );

      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        uri: "/score.musicxml",
        size: 1024,
        isDirectory: false,
        modificationTime: Date.now(),
      });

      createShareExtensionListener({
        supportedExtensions: ["musicxml"],
        onFileReceived,
      });

      // Wait for getInitialURL promise to resolve and handler to run
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockLinking.getInitialURL).toHaveBeenCalled();
    });

    it("ignores invalid share URLs silently", async () => {
      const onError = jest.fn();
      const onFileReceived = jest.fn();

      createShareExtensionListener({
        supportedExtensions: ["musicxml"],
        onError,
        onFileReceived,
      });

      // Trigger URL handler with invalid URL
      if (urlHandler) {
        await urlHandler({ url: "https://example.com/not-a-share" });
      }

      expect(onError).not.toHaveBeenCalled();
      expect(onFileReceived).not.toHaveBeenCalled();
    });

    it("calls onError for unsupported file types", async () => {
      const onError = jest.fn();

      createShareExtensionListener({
        supportedExtensions: ["musicxml"], // Only support musicxml
        onError,
      });

      // Trigger URL handler with valid but unsupported type (pdf when only musicxml supported)
      if (urlHandler) {
        await urlHandler({ url: "file:///path/to/document.pdf" });
      }

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "UNSUPPORTED_TYPE",
        }),
      );
    });

    it("handles share extension errors correctly", async () => {
      const onError = jest.fn();

      // Make file processing fail
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: false,
        uri: "",
        size: 0,
        isDirectory: false,
        modificationTime: 0,
      });

      createShareExtensionListener({
        supportedExtensions: ["musicxml"],
        onError,
      });

      // Trigger URL handler with valid file URL
      if (urlHandler) {
        await urlHandler({ url: "file:///path/to/score.musicxml" });
      }

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: expect.any(String),
        }),
      );
    });

    it("handles generic errors by wrapping them", async () => {
      const onError = jest.fn();

      // Make file processing throw a generic error
      mockFileSystem.getInfoAsync.mockRejectedValue(
        new Error("Generic failure"),
      );

      createShareExtensionListener({
        supportedExtensions: ["musicxml"],
        onError,
      });

      // Trigger URL handler with valid file URL
      if (urlHandler) {
        await urlHandler({ url: "file:///path/to/score.musicxml" });
      }

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "COPY_FAILED",
        }),
      );
    });

    it("calls onFileReceived when share is successful", async () => {
      const onFileReceived = jest.fn();

      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        uri: "/score.musicxml",
        size: 2048,
        isDirectory: false,
        modificationTime: Date.now(),
      });

      createShareExtensionListener({
        supportedExtensions: ["musicxml"],
        onFileReceived,
      });

      // Trigger URL handler with valid file URL
      if (urlHandler) {
        await urlHandler({ url: "file:///path/to/score.musicxml" });
      }

      expect(onFileReceived).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "score.musicxml",
          type: "musicxml",
        }),
      );
    });
  });
});
