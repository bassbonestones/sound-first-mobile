/**
 * Import Validation Utilities Tests
 */

import {
  getFileExtension,
  isExtensionAllowed,
  isExtensionSupported,
  inferSourceTypeFromExtension,
  isMimeTypeAllowed,
  mightBeMusicXml,
  mightBeMxl,
  isFileSizeAllowed,
  getMaxFileSize,
  getMaxFileSizeDisplay,
  formatFileSize,
  validateImportAsset,
  looksLikeMusicXml,
  validateMusicXmlContent,
  areImageDimensionsSufficient,
} from "../src/features/importMusic/utils/validation";
import type { LocalImportAsset } from "../src/types/import";

describe("Import Validation Utilities", () => {
  // ============================================================================
  // File Extension Tests
  // ============================================================================

  describe("getFileExtension", () => {
    it("extracts extension from filename", () => {
      expect(getFileExtension("test.musicxml")).toBe(".musicxml");
      expect(getFileExtension("my-score.xml")).toBe(".xml");
      expect(getFileExtension("photo.jpg")).toBe(".jpg");
    });

    it("handles multiple dots in filename", () => {
      expect(getFileExtension("my.file.name.pdf")).toBe(".pdf");
    });

    it("returns lowercase extension", () => {
      expect(getFileExtension("TEST.MUSICXML")).toBe(".musicxml");
      expect(getFileExtension("Photo.JPEG")).toBe(".jpeg");
    });

    it("returns empty string for no extension", () => {
      expect(getFileExtension("filename")).toBe("");
      expect(getFileExtension("file.")).toBe("");
    });
  });

  describe("isExtensionAllowed", () => {
    it("allows valid musicxml extensions", () => {
      expect(isExtensionAllowed(".musicxml", "musicxml")).toBe(true);
      expect(isExtensionAllowed(".xml", "musicxml")).toBe(true);
    });

    it("allows valid mxl extension", () => {
      expect(isExtensionAllowed(".mxl", "mxl")).toBe(true);
    });

    it("allows valid image extensions", () => {
      expect(isExtensionAllowed(".jpg", "image")).toBe(true);
      expect(isExtensionAllowed(".jpeg", "image")).toBe(true);
      expect(isExtensionAllowed(".png", "image")).toBe(true);
      expect(isExtensionAllowed(".heic", "image")).toBe(true);
    });

    it("allows valid photo extensions", () => {
      expect(isExtensionAllowed(".jpg", "photo")).toBe(true);
      expect(isExtensionAllowed(".heic", "photo")).toBe(true);
    });

    it("allows valid pdf extension", () => {
      expect(isExtensionAllowed(".pdf", "pdf")).toBe(true);
    });

    it("rejects invalid extensions", () => {
      expect(isExtensionAllowed(".doc", "musicxml")).toBe(false);
      expect(isExtensionAllowed(".mp3", "image")).toBe(false);
    });
  });

  describe("isExtensionSupported", () => {
    it("recognizes all supported extensions", () => {
      expect(isExtensionSupported(".musicxml")).toBe(true);
      expect(isExtensionSupported(".xml")).toBe(true);
      expect(isExtensionSupported(".mxl")).toBe(true);
      expect(isExtensionSupported(".jpg")).toBe(true);
      expect(isExtensionSupported(".pdf")).toBe(true);
    });

    it("rejects unsupported extensions", () => {
      expect(isExtensionSupported(".doc")).toBe(false);
      expect(isExtensionSupported(".mp3")).toBe(false);
      expect(isExtensionSupported(".exe")).toBe(false);
    });
  });

  describe("inferSourceTypeFromExtension", () => {
    it("infers musicxml type", () => {
      expect(inferSourceTypeFromExtension(".musicxml")).toBe("musicxml");
      expect(inferSourceTypeFromExtension(".xml")).toBe("musicxml");
    });

    it("infers mxl type", () => {
      expect(inferSourceTypeFromExtension(".mxl")).toBe("mxl");
    });

    it("infers image type", () => {
      expect(inferSourceTypeFromExtension(".jpg")).toBe("image");
      expect(inferSourceTypeFromExtension(".png")).toBe("image");
    });

    it("infers pdf type", () => {
      expect(inferSourceTypeFromExtension(".pdf")).toBe("pdf");
    });

    it("returns null for unknown extensions", () => {
      expect(inferSourceTypeFromExtension(".doc")).toBe(null);
      expect(inferSourceTypeFromExtension("")).toBe(null);
    });
  });

  // ============================================================================
  // MIME Type Tests
  // ============================================================================

  describe("isMimeTypeAllowed", () => {
    it("allows valid musicxml mime types", () => {
      expect(
        isMimeTypeAllowed("application/vnd.recordare.musicxml+xml", "musicxml"),
      ).toBe(true);
      expect(isMimeTypeAllowed("application/xml", "musicxml")).toBe(true);
      expect(isMimeTypeAllowed("text/xml", "musicxml")).toBe(true);
    });

    it("allows valid image mime types", () => {
      expect(isMimeTypeAllowed("image/jpeg", "image")).toBe(true);
      expect(isMimeTypeAllowed("image/png", "image")).toBe(true);
    });

    it("returns true for null mime type (can't validate)", () => {
      expect(isMimeTypeAllowed(null, "musicxml")).toBe(true);
    });

    it("rejects mismatched mime types", () => {
      expect(isMimeTypeAllowed("image/jpeg", "musicxml")).toBe(false);
      expect(isMimeTypeAllowed("application/pdf", "image")).toBe(false);
    });
  });

  describe("mightBeMusicXml", () => {
    it("recognizes musicxml mime types", () => {
      expect(mightBeMusicXml("application/vnd.recordare.musicxml+xml")).toBe(
        true,
      );
      expect(mightBeMusicXml("application/xml")).toBe(true);
      expect(mightBeMusicXml("text/xml")).toBe(true);
    });

    it("returns false for non-xml types", () => {
      expect(mightBeMusicXml("image/jpeg")).toBe(false);
      expect(mightBeMusicXml(null)).toBe(false);
    });
  });

  describe("mightBeMxl", () => {
    it("recognizes mxl/zip mime types", () => {
      expect(mightBeMxl("application/vnd.recordare.musicxml")).toBe(true);
      expect(mightBeMxl("application/zip")).toBe(true);
    });

    it("returns false for non-zip types", () => {
      expect(mightBeMxl("text/xml")).toBe(false);
      expect(mightBeMxl(null)).toBe(false);
    });
  });

  // ============================================================================
  // File Size Tests
  // ============================================================================

  describe("isFileSizeAllowed", () => {
    it("allows files within size limits", () => {
      expect(isFileSizeAllowed(1024 * 1024, "musicxml")).toBe(true); // 1MB
      expect(isFileSizeAllowed(5 * 1024 * 1024, "image")).toBe(true); // 5MB
    });

    it("rejects files exceeding limits", () => {
      expect(isFileSizeAllowed(100 * 1024 * 1024, "musicxml")).toBe(false); // 100MB
    });

    it("returns true for null size (can't validate)", () => {
      expect(isFileSizeAllowed(null, "musicxml")).toBe(true);
    });

    it("allows file at exact limit", () => {
      const limit = getMaxFileSize("musicxml");
      expect(isFileSizeAllowed(limit, "musicxml")).toBe(true);
    });

    it("rejects file one byte over limit", () => {
      const limit = getMaxFileSize("musicxml");
      expect(isFileSizeAllowed(limit + 1, "musicxml")).toBe(false);
    });
  });

  describe("getMaxFileSize", () => {
    it("returns correct size for musicxml", () => {
      const size = getMaxFileSize("musicxml");
      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe("number");
    });

    it("returns correct size for mxl", () => {
      const size = getMaxFileSize("mxl");
      expect(size).toBeGreaterThan(0);
    });

    it("returns correct size for pdf", () => {
      const size = getMaxFileSize("pdf");
      expect(size).toBeGreaterThan(0);
    });

    it("returns correct size for image", () => {
      const size = getMaxFileSize("image");
      expect(size).toBeGreaterThan(0);
    });

    it("returns correct size for photo", () => {
      const size = getMaxFileSize("photo");
      expect(size).toBeGreaterThan(0);
    });
  });

  describe("getMaxFileSizeDisplay", () => {
    it("returns human readable string for musicxml", () => {
      const display = getMaxFileSizeDisplay("musicxml");
      expect(typeof display).toBe("string");
      expect(display).toMatch(/MB$/);
    });

    it("returns human readable string for mxl", () => {
      const display = getMaxFileSizeDisplay("mxl");
      expect(typeof display).toBe("string");
    });

    it("returns human readable string for pdf", () => {
      const display = getMaxFileSizeDisplay("pdf");
      expect(typeof display).toBe("string");
    });

    it("returns human readable string for image", () => {
      const display = getMaxFileSizeDisplay("image");
      expect(typeof display).toBe("string");
    });

    it("returns human readable string for photo", () => {
      const display = getMaxFileSizeDisplay("photo");
      expect(typeof display).toBe("string");
    });
  });

  describe("formatFileSize", () => {
    it("formats bytes", () => {
      expect(formatFileSize(512)).toBe("512 B");
    });

    it("formats kilobytes", () => {
      expect(formatFileSize(1024)).toBe("1.0 KB");
      expect(formatFileSize(1536)).toBe("1.5 KB");
    });

    it("formats megabytes", () => {
      expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe("2.5 MB");
    });
  });

  // ============================================================================
  // Asset Validation Tests
  // ============================================================================

  describe("validateImportAsset", () => {
    const createMockAsset = (
      overrides: Partial<LocalImportAsset> = {},
    ): LocalImportAsset => ({
      id: "test-id",
      uri: "file://test.musicxml",
      mimeType: "application/xml",
      fileName: "test.musicxml",
      fileSize: 1024,
      sourceType: "musicxml",
      acquiredAt: Date.now(),
      ...overrides,
    });

    it("validates correct assets", () => {
      const asset = createMockAsset();
      const result = validateImportAsset(asset);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects assets with invalid extension", () => {
      const asset = createMockAsset({ fileName: "test.doc" });
      const result = validateImportAsset(asset);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "invalid_extension")).toBe(
        true,
      );
    });

    it("rejects assets with no extension", () => {
      const asset = createMockAsset({ fileName: "testfile" });
      const result = validateImportAsset(asset);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "invalid_extension")).toBe(
        true,
      );
    });

    it("rejects oversized files", () => {
      const asset = createMockAsset({ fileSize: 100 * 1024 * 1024 }); // 100MB
      const result = validateImportAsset(asset);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "file_too_large")).toBe(true);
    });

    it("rejects empty files", () => {
      const asset = createMockAsset({ fileSize: 0 });
      const result = validateImportAsset(asset);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "file_empty")).toBe(true);
    });

    it("adds warning for mime type mismatch", () => {
      const asset = createMockAsset({ mimeType: "image/jpeg" });
      const result = validateImportAsset(asset);
      expect(result.valid).toBe(true); // Still valid, just a warning
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // MusicXML Content Tests
  // ============================================================================

  describe("looksLikeMusicXml", () => {
    it("recognizes score-partwise documents", () => {
      const content =
        '<?xml version="1.0"?><score-partwise version="3.1"></score-partwise>';
      expect(looksLikeMusicXml(content)).toBe(true);
    });

    it("recognizes score-timewise documents", () => {
      const content =
        '<?xml version="1.0"?><score-timewise version="3.1"></score-timewise>';
      expect(looksLikeMusicXml(content)).toBe(true);
    });

    it("returns false for non-musicxml content", () => {
      expect(looksLikeMusicXml("<html></html>")).toBe(false);
      expect(looksLikeMusicXml("not xml at all")).toBe(false);
    });

    it("handles whitespace", () => {
      const content =
        '  \n  <?xml version="1.0"?><score-partwise></score-partwise>';
      expect(looksLikeMusicXml(content)).toBe(true);
    });
  });

  describe("validateMusicXmlContent", () => {
    it("validates valid score-partwise content", () => {
      const content =
        '<?xml version="1.0"?><score-partwise version="3.1"></score-partwise>';
      const result = validateMusicXmlContent(content);
      expect(result.valid).toBe(true);
      expect(result.rootElement).toBe("score-partwise");
      expect(result.error).toBeNull();
    });

    it("validates valid score-timewise content", () => {
      const content =
        '<?xml version="1.0"?><score-timewise version="3.1"></score-timewise>';
      const result = validateMusicXmlContent(content);
      expect(result.valid).toBe(true);
      expect(result.rootElement).toBe("score-timewise");
    });

    it("extracts version", () => {
      const content =
        '<?xml version="1.0"?><score-partwise version="3.1"></score-partwise>';
      const result = validateMusicXmlContent(content);
      expect(result.version).toBe("3.1");
    });

    it("rejects empty content", () => {
      const result = validateMusicXmlContent("");
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe("musicxml_invalid");
    });

    it("rejects non-xml content", () => {
      const result = validateMusicXmlContent("this is not xml");
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe("musicxml_invalid");
    });

    it("rejects xml without musicxml root", () => {
      const result = validateMusicXmlContent(
        '<?xml version="1.0"?><html></html>',
      );
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe("musicxml_invalid");
    });
  });

  // ============================================================================
  // Image Quality Tests
  // ============================================================================

  describe("areImageDimensionsSufficient", () => {
    it("accepts sufficient dimensions", () => {
      const result = areImageDimensionsSufficient(2000, 2800);
      expect(result.sufficient).toBe(true);
      expect(result.warning).toBeNull();
    });

    it("warns about insufficient dimensions", () => {
      const result = areImageDimensionsSufficient(500, 700);
      expect(result.sufficient).toBe(false);
      expect(result.warning).toBeTruthy();
    });

    it("handles null dimensions", () => {
      const result = areImageDimensionsSufficient(null, null);
      expect(result.sufficient).toBe(true); // Can't check, assume OK
    });
  });
});
