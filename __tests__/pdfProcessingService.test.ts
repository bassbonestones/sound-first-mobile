/**
 * Multi-Page PDF Processing Service Tests
 */

// Mock devLogger
jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
}));

// Mock importConfig
jest.mock("../src/features/importMusic/config/importConfig", () => ({
  getImportConfig: jest.fn(() => ({
    api: {
      baseUrl: "https://api.test.com",
      apiVersion: "v1",
      apiUrl: "https://api.test.com/api/v1",
      importsUrl: "https://api.test.com/imports",
    },
    upload: {
      maxRetries: 3,
      retryDelayMs: 100,
    },
    omr: {
      maxWaitTime: 600000,
    },
    memory: {
      maxInMemoryFileSize: 50 * 1024 * 1024,
    },
  })),
}));

// Mock retryUtils
jest.mock("../src/features/importMusic/utils/retryUtils", () => ({
  retryWithBackoff: jest.fn((fn) => fn()),
}));

// Mock global fetch
global.fetch = jest.fn();

import {
  uploadPdfForProcessing,
  submitPdfForOmr,
  getPdfOmrStatus,
  getPdfOmrResult,
  estimatePdfPageCount,
  validatePdfForImport,
  type PdfUploadResponse,
  type PdfOmrStatus,
  type PdfOmrResult,
} from "../src/features/importMusic/services/pdfProcessingService";
import type { LocalImportAsset } from "../src/types/import";

describe("pdfProcessingService", () => {
  const mockFetch = global.fetch as jest.Mock;

  const mockAsset: LocalImportAsset = {
    localUri: "file:///path/to/score.pdf",
    filename: "score.pdf",
    mimeType: "application/pdf",
    size: 250000,
    width: 612,
    height: 792,
    type: "pdf",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("uploadPdfForProcessing", () => {
    it("should upload PDF and return page info on success", async () => {
      const mockResponse: PdfUploadResponse = {
        success: true,
        pageCount: 3,
        pages: [
          { pageNumber: 1, width: 612, height: 792, hasMusic: true },
          { pageNumber: 2, width: 612, height: 792, hasMusic: true },
          { pageNumber: 3, width: 612, height: 792, hasMusic: false },
        ],
        fileId: "file-123",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await uploadPdfForProcessing(mockAsset);

      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(3);
      expect(result.pages).toHaveLength(3);
      expect(result.fileId).toBe("file-123");
    });

    it("should return error on upload failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await uploadPdfForProcessing(mockAsset);

      expect(result.success).toBe(false);
      expect(result.error).toContain("500");
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await uploadPdfForProcessing(mockAsset);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });

  describe("submitPdfForOmr", () => {
    it("should submit PDF for OMR processing", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jobId: "job-456" }),
      });

      const result = await submitPdfForOmr("file-123");

      expect(result.success).toBe(true);
      expect(result.jobId).toBe("job-456");
    });

    it("should pass page selection options", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jobId: "job-789" }),
      });

      await submitPdfForOmr("file-123", {
        pages: [1, 2],
        skipLowConfidencePages: false,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"pages":[1,2]'),
        }),
      );
    });

    it("should return error on submit failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "Invalid file" }),
      });

      const result = await submitPdfForOmr("bad-file");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid file");
    });
  });

  describe("getPdfOmrStatus", () => {
    it("should return job status", async () => {
      const mockStatus: PdfOmrStatus = {
        status: "processing",
        overallProgress: 50,
        totalPages: 4,
        completedPages: 2,
        pageStatuses: [
          {
            pageNumber: 1,
            status: "completed",
            progress: 100,
            confidence: 0.95,
          },
          {
            pageNumber: 2,
            status: "completed",
            progress: 100,
            confidence: 0.87,
          },
          { pageNumber: 3, status: "processing", progress: 45 },
          { pageNumber: 4, status: "pending", progress: 0 },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatus),
      });

      const result = await getPdfOmrStatus("job-123");

      expect(result.status).toBe("processing");
      expect(result.overallProgress).toBe(50);
      expect(result.completedPages).toBe(2);
      expect(result.pageStatuses).toHaveLength(4);
    });

    it("should return failed status on error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Connection failed"));

      const result = await getPdfOmrStatus("job-123");

      expect(result.status).toBe("failed");
      expect(result.error).toBe("Connection failed");
    });
  });

  describe("getPdfOmrResult", () => {
    it("should return stitched result", async () => {
      const mockResult: PdfOmrResult = {
        success: true,
        musicXml: "<score-partwise>...</score-partwise>",
        confidence: 0.92,
        pageResults: [
          { pageNumber: 1, musicXml: "...", confidence: 0.95, success: true },
          { pageNumber: 2, musicXml: "...", confidence: 0.89, success: true },
        ],
        uncertainMeasures: [
          {
            pageNumber: 2,
            measureNumber: 15,
            partIndex: 0,
            confidence: 0.6,
            reason: "Unclear articulation",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResult),
      });

      const result = await getPdfOmrResult("job-123");

      expect(result.success).toBe(true);
      expect(result.musicXml).toContain("score-partwise");
      expect(result.confidence).toBe(0.92);
      expect(result.uncertainMeasures).toHaveLength(1);
    });

    it("should return empty result on error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await getPdfOmrResult("non-existent");

      expect(result.success).toBe(false);
      expect(result.musicXml).toBe("");
    });
  });

  describe("estimatePdfPageCount", () => {
    it("should estimate ~1 page for small files", () => {
      expect(estimatePdfPageCount(30 * 1024)).toBe(1);
    });

    it("should estimate ~2 pages for 100KB files", () => {
      expect(estimatePdfPageCount(100 * 1024)).toBe(2);
    });

    it("should estimate ~10 pages for 500KB files", () => {
      expect(estimatePdfPageCount(500 * 1024)).toBe(10);
    });

    it("should never return less than 1", () => {
      expect(estimatePdfPageCount(0)).toBe(1);
      expect(estimatePdfPageCount(100)).toBe(1);
    });
  });

  describe("validatePdfForImport", () => {
    it("should validate valid PDF files", () => {
      const result = validatePdfForImport(mockAsset);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject non-PDF files", () => {
      const jpgAsset: LocalImportAsset = {
        ...mockAsset,
        filename: "image.jpg",
      };

      const result = validatePdfForImport(jpgAsset);

      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe("validation_failed");
    });

    it("should reject oversized files", () => {
      const largeAsset: LocalImportAsset = {
        ...mockAsset,
        size: 100 * 1024 * 1024, // 100MB
      };

      const result = validatePdfForImport(largeAsset);

      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe("file_too_large");
    });

    it("should warn about large page counts", () => {
      const manyPagesAsset: LocalImportAsset = {
        ...mockAsset,
        size: 2 * 1024 * 1024, // 2MB = ~40 pages estimated
      };

      const result = validatePdfForImport(manyPagesAsset);

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("Large PDF");
    });
  });
});
