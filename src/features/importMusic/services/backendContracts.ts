/**
 * Backend Contract Types
 *
 * TypeScript interfaces defining the API contract between the mobile app
 * and the backend import service.
 *
 * These types define:
 * - Upload request/response shapes
 * - OMR job request/response shapes
 * - Score retrieval responses
 * - Error response formats
 *
 * DESIGN NOTES:
 *
 * What should happen on device:
 * - File selection and acquisition
 * - Basic validation (file type, size)
 * - MusicXML parsing (for direct import path)
 * - UI state management
 * - Preview generation from local data
 *
 * What should happen on backend:
 * - Secure file storage
 * - OMR processing (requires heavy ML models)
 * - PDF rendering/extraction
 * - Score storage and versioning
 * - User authentication
 * - Rate limiting and quotas
 *
 * Why this split:
 * - OMR models are too large for mobile (100s of MB)
 * - Consistent processing across devices
 * - Easier to update OMR models server-side
 * - Better security for user data
 * - Can leverage GPU/TPU for ML inference
 */

import type {
  ImportSourceType,
  OmrProcessingOptions,
} from "../../../types/import";

// ============================================================================
// Common Response Types
// ============================================================================

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: Record<string, unknown>;
  };
}

/**
 * Standard API success response wrapper
 */
export interface ApiSuccessResponse<T> {
  readonly success: true;
  readonly data: T;
}

// ============================================================================
// Upload API
// ============================================================================

/**
 * Request to get a signed URL for upload
 */
export interface SignedUrlRequest {
  /** Original filename */
  readonly fileName: string;
  /** MIME type of the file */
  readonly mimeType: string;
  /** File size in bytes (for validation) */
  readonly fileSize?: number;
  /** Source type for categorization */
  readonly sourceType: ImportSourceType;
}

/**
 * Response with signed URL for upload
 */
export interface SignedUrlResponse {
  readonly success: boolean;
  /** Pre-signed URL for uploading the file */
  readonly uploadUrl: string | null;
  /** Asset ID assigned by the backend */
  readonly assetId: string;
  /** Public URL for the file after upload (if applicable) */
  readonly publicUrl: string | null;
  /** URL expiration timestamp */
  readonly expiresAt: number | null;
  /** Error message if failed */
  readonly error: string | null;
}

/**
 * Direct upload request (multipart form)
 * Used when not using signed URLs
 */
export interface UploadRequest {
  /** The file data (sent as multipart) */
  readonly file: Blob | File;
  /** Original filename */
  readonly fileName: string;
  /** MIME type */
  readonly mimeType: string;
  /** Source type */
  readonly sourceType: ImportSourceType;
}

/**
 * Upload response
 */
export interface UploadResponse {
  readonly success: boolean;
  /** Assigned asset ID */
  readonly assetId: string;
  /** URL where file can be accessed */
  readonly url?: string;
  /** File size as stored */
  readonly storedSize: number;
  /** Server timestamp */
  readonly uploadedAt: string;
  /** Error message if failed */
  readonly error?: string;
}

// ============================================================================
// OMR API
// ============================================================================

/**
 * Request to submit an OMR job
 */
export interface OmrSubmitRequest {
  /** Asset ID from upload */
  readonly assetId: string;
  /** Source type (affects processing) */
  readonly sourceType: ImportSourceType;
  /** Processing options */
  readonly options?: OmrProcessingOptions;
}

/**
 * Response from OMR job submission
 */
export interface OmrSubmitResponse {
  readonly success: boolean;
  /** Job ID for status polling */
  readonly jobId: string | null;
  /** Estimated processing time in ms */
  readonly estimatedDurationMs: number | null;
  /** Error message if submission failed */
  readonly error: string | null;
}

/**
 * OMR job status response
 */
export interface OmrStatusResponse {
  /** Job ID */
  readonly jobId: string;
  /** Current status */
  readonly status: "queued" | "processing" | "completed" | "failed";
  /** Progress (0-100) if available */
  readonly progress: number | null;
  /** Result if completed */
  readonly result: OmrResultPayload | null;
  /** Error message if failed */
  readonly error: string | null;
}

/**
 * OMR result payload
 */
export interface OmrResultPayload {
  /** Overall confidence score (0-1) */
  readonly confidence: number;
  /** Generated MusicXML if available */
  readonly musicXml: string | null;
  /** Measure-level confidence scores */
  readonly measureConfidence: MeasureConfidencePayload[];
  /** Measures flagged for review */
  readonly uncertainMeasures: UncertainMeasurePayload[];
  /** Preview image URL if generated */
  readonly previewUrl: string | null;
  /** Metadata extracted from the score */
  readonly metadata: ExtractedMetadataPayload | null;
}

/**
 * Per-measure confidence data
 */
export interface MeasureConfidencePayload {
  readonly measureNumber: number;
  readonly partIndex: number;
  readonly confidence: number;
}

/**
 * Uncertain measure details
 */
export interface UncertainMeasurePayload {
  readonly measureNumber: number;
  readonly partIndex: number;
  readonly confidence: number;
  readonly reason: string;
  /** Cropped image of the uncertain region (if available) */
  readonly regionImageUrl: string | null;
}

/**
 * Extracted metadata from OMR
 */
export interface ExtractedMetadataPayload {
  readonly title: string | null;
  readonly composer: string | null;
  readonly keySignature: string | null;
  readonly timeSignature: string | null;
  readonly tempo: number | null;
  readonly measureCount: number;
  readonly partCount: number;
  readonly pageCount: number;
}

// ============================================================================
// Score Storage API
// ============================================================================

/**
 * Request to save a processed score
 */
export interface SaveScoreRequest {
  /** Asset ID of the source file */
  readonly sourceAssetId: string;
  /** OMR job ID if applicable */
  readonly omrJobId: string | null;
  /** Score data (normalized ImportedScore serialized) */
  readonly scoreData: string;
  /** User-provided metadata overrides */
  readonly metadataOverrides?: {
    readonly title?: string;
    readonly composer?: string;
  };
}

/**
 * Response from saving a score
 */
export interface SaveScoreResponse {
  readonly success: boolean;
  /** Assigned score ID */
  readonly scoreId: string;
  /** Server timestamp */
  readonly savedAt: string;
  /** Error message if failed */
  readonly error?: string;
}

/**
 * Request to retrieve a saved score
 */
export interface GetScoreRequest {
  readonly scoreId: string;
}

/**
 * Response with score data
 */
export interface GetScoreResponse {
  readonly success: boolean;
  readonly score: SavedScorePayload | null;
  readonly error?: string;
}

/**
 * Saved score payload
 */
export interface SavedScorePayload {
  readonly scoreId: string;
  readonly sourceAssetId: string;
  readonly scoreData: string; // Serialized ImportedScore
  readonly metadata: {
    readonly title: string | null;
    readonly composer: string | null;
  };
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ============================================================================
// Review API (Future)
// ============================================================================

/**
 * Request to submit corrections for uncertain measures
 */
export interface SubmitCorrectionsRequest {
  readonly scoreId: string;
  readonly corrections: MeasureCorrectionPayload[];
}

/**
 * Individual measure correction
 */
export interface MeasureCorrectionPayload {
  readonly measureNumber: number;
  readonly partIndex: number;
  /** Corrected MusicXML fragment for the measure */
  readonly correctedMusicXml: string;
}

/**
 * Response from submitting corrections
 */
export interface SubmitCorrectionsResponse {
  readonly success: boolean;
  /** Updated score ID (may be new version) */
  readonly updatedScoreId: string;
  readonly error?: string;
}

// ============================================================================
// Rate Limiting & Quotas
// ============================================================================

/**
 * Rate limit information returned in headers
 */
export interface RateLimitInfo {
  /** Requests remaining in current window */
  readonly remaining: number;
  /** Total requests allowed in window */
  readonly limit: number;
  /** Seconds until limit resets */
  readonly resetInSeconds: number;
}

/**
 * Quota information for OMR processing
 */
export interface OmrQuotaInfo {
  /** Pages remaining this month */
  readonly pagesRemaining: number;
  /** Total pages allowed per month */
  readonly monthlyLimit: number;
  /** Days until quota resets */
  readonly resetInDays: number;
}

// ============================================================================
// Webhook Events (Backend to Backend)
// ============================================================================

/**
 * OMR job completion webhook payload
 *
 * This is sent from the OMR service to the main backend
 * when a job completes. Not directly used by mobile.
 */
export interface OmrCompletionWebhook {
  readonly eventType: "omr.completed" | "omr.failed";
  readonly jobId: string;
  readonly assetId: string;
  readonly userId: string;
  readonly result: OmrResultPayload | null;
  readonly error: string | null;
  readonly processedAt: string;
}
