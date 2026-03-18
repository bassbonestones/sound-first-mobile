/**
 * OMR (Optical Music Recognition) Service
 *
 * Handles submission and polling of OMR jobs for image/photo/PDF imports.
 * This is an interface/boundary layer - the actual OMR processing happens
 * on the backend.
 *
 * The service supports:
 * - Job submission
 * - Status polling
 * - Result retrieval
 * - Timeout handling
 */

import type {
  OmrJobRequest,
  OmrJobSubmitResponse,
  OmrJobStatusResponse,
  OmrJobResult,
  ImportError,
  ImportedScore,
  LocalImportAsset,
} from "../../../types/import";
import { createImportError } from "../../../types/import";
import { IMPORT_TIMEOUTS } from "../../../constants/import";
import type {
  OmrSubmitRequest,
  OmrSubmitResponse,
  OmrStatusResponse,
  OmrResultPayload,
} from "./backendContracts";
import { devLog } from "../../../utils/devLogger";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Map backend OmrResultPayload to domain OmrJobResult
 */
function mapResultPayloadToJobResult(payload: OmrResultPayload): OmrJobResult {
  return {
    rawOutput: payload, // Store the full payload as raw output
    confidence: payload.confidence,
    uncertainMeasures: payload.uncertainMeasures.map((um) => ({
      measureNumber: um.measureNumber,
      partIndex: um.partIndex,
      confidence: um.confidence,
      reason: um.reason,
    })),
    musicXml: payload.musicXml,
  };
}

// ============================================================================
// Configuration
// ============================================================================

interface OmrServiceConfig {
  /** Base URL for the OMR API */
  readonly baseUrl: string;
  /** Polling interval in ms */
  readonly pollInterval: number;
  /** Maximum wait time in ms */
  readonly maxWaitTime: number;
}

const DEFAULT_CONFIG: OmrServiceConfig = {
  baseUrl: "https://api.soundfirst.app", // Placeholder
  pollInterval: IMPORT_TIMEOUTS.OMR_POLL_INTERVAL,
  maxWaitTime: IMPORT_TIMEOUTS.OMR_MAX_WAIT,
};

// ============================================================================
// OMR Job Submission
// ============================================================================

/**
 * Submit an OMR job for processing
 *
 * @param request - OMR job request with remote asset ID
 * @param config - Optional configuration override
 * @returns Submit response with job ID for polling
 */
export async function submitOmrJob(
  request: OmrJobRequest,
  config: Partial<OmrServiceConfig> = {},
): Promise<OmrJobSubmitResponse> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    const apiRequest: OmrSubmitRequest = {
      assetId: request.remoteAssetId,
      sourceType: request.sourceType,
      options: request.options,
    };

    // TODO: Implement actual API call
    // For now, return a placeholder response
    const response = await submitOmrJobToBackend(apiRequest, finalConfig);

    if (!response.success) {
      return {
        success: false,
        jobId: null,
        estimatedDurationMs: null,
        error: createImportError(
          "omr_submission_failed",
          response.error ?? "Failed to submit OMR job",
          "Couldn't start music recognition. Please try again.",
          { severity: "recoverable", recoverable: true },
        ),
      };
    }

    return {
      success: true,
      jobId: response.jobId,
      estimatedDurationMs: response.estimatedDurationMs ?? null,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      jobId: null,
      estimatedDurationMs: null,
      error: createImportError(
        "omr_submission_failed",
        error instanceof Error ? error.message : String(error),
        "Couldn't start music recognition. Please try again.",
        {
          severity: "recoverable",
          recoverable: true,
          cause: error instanceof Error ? error : undefined,
        },
      ),
    };
  }
}

/**
 * Submit OMR job to backend
 *
 * TODO: Implement actual API call
 */
async function submitOmrJobToBackend(
  request: OmrSubmitRequest,
  _config: OmrServiceConfig,
): Promise<OmrSubmitResponse> {
  // Placeholder implementation
  devLog("[OMR] Would submit job:", request);

  // In production, replace with actual fetch call
  /*
  const response = await fetch(`${config.baseUrl}/api/v1/omr/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Add auth headers
    },
    body: JSON.stringify(request),
  });
  return response.json();
  */

  return {
    success: false,
    jobId: null,
    estimatedDurationMs: null,
    error: "OMR service not yet integrated with backend",
  };
}

// ============================================================================
// OMR Job Status Polling
// ============================================================================

/**
 * Get the status of an OMR job
 *
 * @param jobId - The job ID returned from submission
 * @param config - Optional configuration override
 * @returns Current job status
 */
export async function getOmrJobStatus(
  jobId: string,
  config: Partial<OmrServiceConfig> = {},
): Promise<OmrJobStatusResponse> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    const response = await fetchJobStatus(jobId, finalConfig);

    return {
      jobId,
      status: response.status,
      progress: response.progress ?? null,
      result: response.result
        ? mapResultPayloadToJobResult(response.result)
        : null,
      error: response.error
        ? createImportError(
            "omr_processing_failed",
            response.error,
            "Music recognition encountered an error.",
            { severity: "fatal", recoverable: false },
          )
        : null,
    };
  } catch (error) {
    return {
      jobId,
      status: "failed",
      progress: null,
      result: null,
      error: createImportError(
        "omr_processing_failed",
        error instanceof Error ? error.message : String(error),
        "Couldn't check recognition status.",
        {
          severity: "recoverable",
          recoverable: true,
          cause: error instanceof Error ? error : undefined,
        },
      ),
    };
  }
}

/**
 * Fetch job status from backend
 *
 * TODO: Implement actual API call
 */
async function fetchJobStatus(
  jobId: string,
  _config: OmrServiceConfig,
): Promise<OmrStatusResponse> {
  // Placeholder implementation
  devLog("[OMR] Would fetch status for job:", jobId);

  // In production, replace with actual fetch call
  /*
  const response = await fetch(`${config.baseUrl}/api/v1/omr/status/${jobId}`, {
    method: 'GET',
    headers: {
      // Add auth headers
    },
  });
  return response.json();
  */

  return {
    jobId,
    status: "failed",
    progress: null,
    result: null,
    error: "OMR service not yet integrated with backend",
  };
}

// ============================================================================
// Polling Helper
// ============================================================================

/**
 * Poll for OMR job completion
 *
 * This function polls the job status until:
 * - Job completes (success or failure)
 * - Timeout is reached
 * - Cancellation is requested
 *
 * @param jobId - The job ID to poll
 * @param onProgress - Optional callback for progress updates
 * @param cancellationToken - Optional cancellation signal
 * @param config - Optional configuration override
 * @returns Final job status
 */
export async function pollOmrJobUntilComplete(
  jobId: string,
  onProgress?: (progress: number | null, status: string) => void,
  cancellationToken?: { cancelled: boolean },
  config: Partial<OmrServiceConfig> = {},
): Promise<OmrJobStatusResponse> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();

  while (true) {
    // Check for cancellation
    if (cancellationToken?.cancelled) {
      return {
        jobId,
        status: "failed",
        progress: null,
        result: null,
        error: createImportError(
          "omr_processing_failed",
          "OMR job was cancelled",
          "Music recognition was cancelled.",
          { severity: "recoverable", recoverable: true },
        ),
      };
    }

    // Check for timeout
    const elapsed = Date.now() - startTime;
    if (elapsed > finalConfig.maxWaitTime) {
      return {
        jobId,
        status: "timeout",
        progress: null,
        result: null,
        error: createImportError(
          "omr_timeout",
          `OMR job timed out after ${finalConfig.maxWaitTime}ms`,
          "Music recognition is taking too long. Please try a clearer image.",
          {
            severity: "recoverable",
            recoverable: true,
            recoveryHint: "Try a clearer, higher-resolution image",
          },
        ),
      };
    }

    // Get current status
    const status = await getOmrJobStatus(jobId, config);

    // Report progress
    if (onProgress) {
      onProgress(status.progress, status.status);
    }

    // Check if complete
    if (
      status.status === "completed" ||
      status.status === "failed" ||
      status.status === "timeout"
    ) {
      return status;
    }

    // Wait before next poll
    await sleep(finalConfig.pollInterval);
  }
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Result Normalization
// ============================================================================

/**
 * Normalize OMR result to ImportedScore
 *
 * This converts the raw OMR output (which may vary by provider)
 * into our standard ImportedScore format.
 *
 * @param result - Raw OMR job result
 * @param sourceInfo - Information about the original import source
 * @returns Normalized ImportedScore
 */
export function normalizeOmrResult(
  result: OmrJobResult,
  sourceInfo: {
    sourceType: LocalImportAsset["sourceType"];
    originalFileName: string;
    remoteAssetId: string | null;
  },
): ImportedScore {
  // If the OMR result includes MusicXML, we could parse that
  // For now, create a placeholder score structure

  // TODO: Implement actual normalization based on OMR provider output format
  // This will depend on which OMR service is used

  const id = `score_omr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  return {
    id,
    metadata: {
      title: null,
      composer: null,
      arranger: null,
      movementTitle: null,
      workTitle: null,
      copyright: null,
      keySignature: null,
      timeSignature: null,
      tempo: null,
    },
    parts: [],
    measureCount: 0,
    sourceInfo: {
      sourceType: sourceInfo.sourceType,
      originalFileName: sourceInfo.originalFileName,
      importedAt: Date.now(),
      remoteAssetId: sourceInfo.remoteAssetId,
    },
    confidence: {
      overall: result.confidence,
      measureConfidence: [],
      needsReview:
        result.confidence < 0.8 || result.uncertainMeasures.length > 0,
    },
  };
}

// ============================================================================
// Image Preprocessing (Placeholder)
// ============================================================================

/**
 * Preprocess an image before OMR submission
 *
 * This could include:
 * - Rotation correction
 * - Perspective correction
 * - Contrast enhancement
 * - Noise reduction
 *
 * TODO: Implement preprocessing if needed
 * For now, this is a passthrough
 */
export async function preprocessImageForOmr(
  asset: LocalImportAsset,
): Promise<{ uri: string; preprocessed: boolean }> {
  // Placeholder: return original asset
  // In the future, this could apply image processing

  return {
    uri: asset.uri,
    preprocessed: false,
  };
}

// ============================================================================
// PDF Page Extraction (Placeholder)
// ============================================================================

/**
 * Extract pages from a PDF for OMR processing
 *
 * Multi-page PDFs may need to be processed page-by-page.
 *
 * TODO: Implement PDF page extraction
 */
export async function extractPdfPages(_asset: LocalImportAsset): Promise<{
  success: boolean;
  pageCount: number;
  pageUris: string[];
  error: ImportError | null;
}> {
  // Placeholder: return error indicating not implemented
  return {
    success: false,
    pageCount: 0,
    pageUris: [],
    error: createImportError(
      "parse_failed",
      "PDF page extraction not yet implemented",
      "PDF processing is coming soon. Please try importing individual page images for now.",
      {
        severity: "recoverable",
        recoverable: true,
        recoveryHint:
          "Take photos of individual pages or export pages as images",
      },
    ),
  };
}
