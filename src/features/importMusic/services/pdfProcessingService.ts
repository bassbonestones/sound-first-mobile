/**
 * Multi-Page PDF Processing Service
 *
 * Handles PDF import with support for multi-page documents:
 * - Page count detection (via backend)
 * - Per-page OMR progress tracking
 * - Result stitching into single score
 *
 * Architecture:
 * - PDF files are sent to the backend as-is
 * - Backend extracts pages and processes each through OMR
 * - Frontend tracks progress per page
 * - Final MusicXML result is stitched on the backend
 *
 * BACKEND REQUIREMENTS:
 * The Sound First backend must implement:
 * - POST /api/import/pdf/upload - Upload PDF, get page count
 * - POST /api/omr/pdf/submit - Submit PDF for multi-page OMR
 * - GET /api/omr/pdf/:jobId/status - Get per-page progress
 * - GET /api/omr/pdf/:jobId/result - Get stitched result
 */

import type { LocalImportAsset, ImportError } from "../../../types/import";
import { createImportError } from "../../../types/import";
import { devLog } from "../../../utils/devLogger";
import { getImportConfig } from "../config/importConfig";
import { retryWithBackoff } from "../utils/retryUtils";

// ============================================================================
// Types
// ============================================================================

export interface PdfPageInfo {
  /** Page number (1-based) */
  pageNumber: number;
  /** Page width in points */
  width: number;
  /** Page height in points */
  height: number;
  /** Whether page has sheet music detected */
  hasMusic: boolean;
  /** Preview thumbnail URI (if available) */
  thumbnailUri?: string;
}

export interface PdfUploadResponse {
  /** Success status */
  success: boolean;
  /** Number of pages in PDF */
  pageCount: number;
  /** Information about each page */
  pages: PdfPageInfo[];
  /** Uploaded file ID for OMR submission */
  fileId: string;
  /** Error if upload failed */
  error?: string;
}

export interface PdfOmrStatus {
  /** Overall job status */
  status: "pending" | "processing" | "completed" | "failed";
  /** Overall progress (0-100) */
  overallProgress: number;
  /** Per-page status */
  pageStatuses: PageOmrStatus[];
  /** Total pages */
  totalPages: number;
  /** Completed pages */
  completedPages: number;
  /** Error message if failed */
  error?: string;
}

export interface PageOmrStatus {
  /** Page number (1-based) */
  pageNumber: number;
  /** Page processing status */
  status: "pending" | "processing" | "completed" | "failed" | "skipped";
  /** Progress percentage for this page */
  progress: number;
  /** OMR confidence score (0-1) for this page */
  confidence?: number;
  /** Error message if this page failed */
  error?: string;
}

export interface PdfOmrResult {
  /** Success status */
  success: boolean;
  /** Stitched MusicXML for entire document */
  musicXml: string;
  /** Per-page results (for debugging/review) */
  pageResults: PageOmrResult[];
  /** Overall confidence score */
  confidence: number;
  /** Measures that may need manual review */
  uncertainMeasures: UncertainMeasure[];
}

export interface PageOmrResult {
  /** Page number (1-based) */
  pageNumber: number;
  /** MusicXML fragment for this page */
  musicXml: string;
  /** Confidence score for this page */
  confidence: number;
  /** Whether page was successfully processed */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

export interface UncertainMeasure {
  /** Page number where measure appears */
  pageNumber: number;
  /** Measure number within the page */
  measureNumber: number;
  /** Part index (0-based) */
  partIndex: number;
  /** Confidence score (0-1) */
  confidence: number;
  /** Reason for uncertainty */
  reason: string;
}

export type PdfProgressCallback = (status: PdfOmrStatus) => void;

// ============================================================================
// Configuration
// ============================================================================

/** Maximum pages we'll process in a single PDF */
const MAX_PDF_PAGES = 50;

/** Minimum confidence to accept a page result */
const MIN_PAGE_CONFIDENCE = 0.5;

// ============================================================================
// Backend API Functions
// ============================================================================

/**
 * Upload a PDF to the backend and get page information
 */
export async function uploadPdfForProcessing(
  asset: LocalImportAsset,
  authToken?: string,
  signal?: AbortSignal,
): Promise<PdfUploadResponse> {
  const config = getImportConfig();
  const endpoint = `${config.api.importsUrl}/pdf/upload`;

  devLog("pdf", "Uploading PDF for processing", asset.filename);

  try {
    // Create form data for upload
    const formData = new FormData();

    // Read file and add to form data
    // The actual file reading happens on native side through uri
    formData.append("file", {
      uri: asset.localUri,
      name: asset.filename || "document.pdf",
      type: "application/pdf",
    } as unknown as Blob);

    const response = await retryWithBackoff(
      async () => {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            Accept: "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: formData,
          signal,
        });

        if (!res.ok) {
          throw new Error(`Upload failed with status ${res.status}`);
        }

        return res.json();
      },
      {
        maxRetries: config.maxRetries,
        baseDelayMs: config.retryDelayMs,
        signal,
      },
    );

    return response as PdfUploadResponse;
  } catch (error) {
    devLog("pdf", "PDF upload failed", error);

    return {
      success: false,
      pageCount: 0,
      pages: [],
      fileId: "",
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Submit an uploaded PDF for multi-page OMR processing
 */
export async function submitPdfForOmr(
  fileId: string,
  options?: {
    /** Specific pages to process (default: all) */
    pages?: number[];
    /** Skip pages with low music detection score */
    skipLowConfidencePages?: boolean;
    /** Auth token */
    authToken?: string;
    /** Abort signal */
    signal?: AbortSignal;
  },
): Promise<{ success: boolean; jobId: string; error?: string }> {
  const config = getImportConfig();
  const endpoint = `${config.api.importsUrl}/omr/pdf/submit`;

  devLog("pdf", "Submitting PDF for OMR", fileId);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options?.authToken
          ? { Authorization: `Bearer ${options.authToken}` }
          : {}),
      },
      body: JSON.stringify({
        fileId,
        pages: options?.pages,
        skipLowConfidencePages: options?.skipLowConfidencePages ?? true,
      }),
      signal: options?.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Submit failed with status ${response.status}`,
      );
    }

    const data = await response.json();

    return {
      success: true,
      jobId: data.jobId,
    };
  } catch (error) {
    devLog("pdf", "PDF OMR submit failed", error);

    return {
      success: false,
      jobId: "",
      error: error instanceof Error ? error.message : "Submit failed",
    };
  }
}

/**
 * Poll PDF OMR job status
 */
export async function getPdfOmrStatus(
  jobId: string,
  authToken?: string,
  signal?: AbortSignal,
): Promise<PdfOmrStatus> {
  const config = getImportConfig();
  const endpoint = `${config.api.importsUrl}/omr/pdf/${jobId}/status`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      signal,
    });

    if (!response.ok) {
      throw new Error(`Status check failed with status ${response.status}`);
    }

    return (await response.json()) as PdfOmrStatus;
  } catch (error) {
    devLog("pdf", "PDF OMR status check failed", error);

    return {
      status: "failed",
      overallProgress: 0,
      pageStatuses: [],
      totalPages: 0,
      completedPages: 0,
      error: error instanceof Error ? error.message : "Status check failed",
    };
  }
}

/**
 * Get the final result of PDF OMR processing
 */
export async function getPdfOmrResult(
  jobId: string,
  authToken?: string,
  signal?: AbortSignal,
): Promise<PdfOmrResult> {
  const config = getImportConfig();
  const endpoint = `${config.api.importsUrl}/omr/pdf/${jobId}/result`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      signal,
    });

    if (!response.ok) {
      throw new Error(`Result fetch failed with status ${response.status}`);
    }

    return (await response.json()) as PdfOmrResult;
  } catch (error) {
    devLog("pdf", "PDF OMR result fetch failed", error);

    return {
      success: false,
      musicXml: "",
      pageResults: [],
      confidence: 0,
      uncertainMeasures: [],
    };
  }
}

// ============================================================================
// High-Level PDF Processing
// ============================================================================

export interface ProcessPdfOptions {
  /** Callback for progress updates */
  onProgress?: PdfProgressCallback;
  /** Auth token for backend */
  authToken?: string;
  /** Abort signal */
  signal?: AbortSignal;
  /** Specific pages to process */
  pages?: number[];
}

/**
 * Process a PDF through the full OMR pipeline
 *
 * Returns the stitched MusicXML result or an error.
 */
export async function processPdfForOmr(
  asset: LocalImportAsset,
  options?: ProcessPdfOptions,
): Promise<{
  success: boolean;
  musicXml?: string;
  confidence?: number;
  pageCount?: number;
  error?: ImportError;
}> {
  devLog("pdf", "Processing PDF", asset.filename);

  // 1. Upload PDF and get page info
  const uploadResult = await uploadPdfForProcessing(
    asset,
    options?.authToken,
    options?.signal,
  );

  if (!uploadResult.success) {
    return {
      success: false,
      error: createImportError(
        "upload_failed",
        "PDF upload failed",
        uploadResult.error || "Could not upload PDF file",
        { severity: "recoverable", recoverable: true },
      ),
    };
  }

  // 2. Check page count limits
  if (uploadResult.pageCount > MAX_PDF_PAGES) {
    return {
      success: false,
      pageCount: uploadResult.pageCount,
      error: createImportError(
        "validation_failed",
        `PDF has too many pages (${uploadResult.pageCount})`,
        `Maximum supported is ${MAX_PDF_PAGES} pages. Please split your PDF.`,
        { severity: "recoverable", recoverable: false },
      ),
    };
  }

  if (uploadResult.pageCount === 0) {
    return {
      success: false,
      pageCount: 0,
      error: createImportError(
        "parse_failed",
        "PDF has no readable pages",
        "The PDF file appears to be empty or corrupted.",
        { severity: "recoverable", recoverable: false },
      ),
    };
  }

  // 3. Submit for OMR processing
  const submitResult = await submitPdfForOmr(uploadResult.fileId, {
    pages: options?.pages,
    authToken: options?.authToken,
    signal: options?.signal,
  });

  if (!submitResult.success) {
    return {
      success: false,
      pageCount: uploadResult.pageCount,
      error: createImportError(
        "omr_failed",
        "Failed to start OMR processing",
        submitResult.error || "Could not submit PDF for processing",
        { severity: "recoverable", recoverable: true },
      ),
    };
  }

  // 4. Poll for completion
  const config = getImportConfig();
  const startTime = Date.now();
  const maxWaitTime = config.omr.maxWaitTime || 600000; // 10 minutes for PDFs
  const pollInterval = 3000; // 3 seconds

  while (Date.now() - startTime < maxWaitTime) {
    // Check for abort
    if (options?.signal?.aborted) {
      return {
        success: false,
        pageCount: uploadResult.pageCount,
        error: createImportError(
          "omr_cancelled",
          "PDF processing cancelled",
          "The import was cancelled by the user.",
          { severity: "recoverable", recoverable: true },
        ),
      };
    }

    // Poll status
    const status = await getPdfOmrStatus(
      submitResult.jobId,
      options?.authToken,
      options?.signal,
    );

    // Report progress
    options?.onProgress?.(status);

    if (status.status === "completed") {
      // Fetch result
      const result = await getPdfOmrResult(
        submitResult.jobId,
        options?.authToken,
        options?.signal,
      );

      if (result.success) {
        return {
          success: true,
          musicXml: result.musicXml,
          confidence: result.confidence,
          pageCount: uploadResult.pageCount,
        };
      } else {
        return {
          success: false,
          pageCount: uploadResult.pageCount,
          error: createImportError(
            "omr_failed",
            "PDF processing completed with errors",
            "Some pages could not be processed. Please try again.",
            { severity: "recoverable", recoverable: true },
          ),
        };
      }
    }

    if (status.status === "failed") {
      return {
        success: false,
        pageCount: uploadResult.pageCount,
        error: createImportError(
          "omr_failed",
          "PDF processing failed",
          status.error || "An error occurred while processing the PDF.",
          { severity: "recoverable", recoverable: true },
        ),
      };
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  // Timeout
  return {
    success: false,
    pageCount: uploadResult.pageCount,
    error: createImportError(
      "timeout",
      "PDF processing timed out",
      `Processing took longer than ${Math.round(maxWaitTime / 60000)} minutes.`,
      { severity: "recoverable", recoverable: true },
    ),
  };
}

// ============================================================================
// Page Count Detection (Local)
// ============================================================================

/**
 * Estimate PDF page count from file size
 *
 * This is a rough estimate used for UI purposes before backend processing.
 * Actual page count comes from backend analysis.
 *
 * Heuristic: ~50KB per page for scanned music sheets
 */
export function estimatePdfPageCount(fileSizeBytes: number): number {
  const avgPageSize = 50 * 1024; // 50KB
  return Math.max(1, Math.round(fileSizeBytes / avgPageSize));
}

/**
 * Validate PDF file before processing
 */
export function validatePdfForImport(asset: LocalImportAsset): {
  valid: boolean;
  warnings: string[];
  error?: ImportError;
} {
  const warnings: string[] = [];

  // Check file extension
  const ext = asset.filename?.toLowerCase().split(".").pop();
  if (ext !== "pdf") {
    return {
      valid: false,
      warnings: [],
      error: createImportError(
        "validation_failed",
        "Not a PDF file",
        "Please select a PDF file.",
        { severity: "recoverable", recoverable: false },
      ),
    };
  }

  // Check file size
  const config = getImportConfig();
  if (asset.size && asset.size > config.memory.maxInMemoryFileSize) {
    return {
      valid: false,
      warnings: [],
      error: createImportError(
        "file_too_large",
        "PDF file too large",
        `Maximum file size is ${Math.round(config.memory.maxInMemoryFileSize / 1024 / 1024)}MB.`,
        { severity: "recoverable", recoverable: false },
      ),
    };
  }

  // Estimate page count for warnings
  if (asset.size) {
    const estimatedPages = estimatePdfPageCount(asset.size);
    if (estimatedPages > 20) {
      warnings.push(
        `Large PDF (~${estimatedPages} pages estimated). Processing may take several minutes.`,
      );
    }
  }

  return { valid: true, warnings };
}
