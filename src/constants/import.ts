/**
 * Import Constants
 *
 * Configuration constants for the music import pipeline.
 */

import type { ImportSourceType, ImportErrorCode } from "../types/import";

// ============================================================================
// File Type Configuration
// ============================================================================

/**
 * Allowed file extensions by source type
 */
export const ALLOWED_EXTENSIONS: Record<ImportSourceType, readonly string[]> = {
  musicxml: [".musicxml", ".xml"],
  mxl: [".mxl"],
  photo: [".jpg", ".jpeg", ".png", ".heic", ".heif"],
  image: [".jpg", ".jpeg", ".png", ".heic", ".heif", ".gif", ".webp"],
  pdf: [".pdf"],
} as const;

/**
 * All supported extensions flattened
 */
export const ALL_SUPPORTED_EXTENSIONS = [
  ...ALLOWED_EXTENSIONS.musicxml,
  ...ALLOWED_EXTENSIONS.mxl,
  ...ALLOWED_EXTENSIONS.image,
  ...ALLOWED_EXTENSIONS.pdf,
] as const;

/**
 * Allowed MIME types by source type
 */
export const ALLOWED_MIME_TYPES: Record<ImportSourceType, readonly string[]> = {
  musicxml: [
    "application/vnd.recordare.musicxml+xml",
    "application/xml",
    "text/xml",
  ],
  mxl: [
    "application/vnd.recordare.musicxml",
    "application/zip",
    "application/x-zip-compressed",
  ],
  photo: ["image/jpeg", "image/png", "image/heic", "image/heif"],
  image: [
    "image/jpeg",
    "image/png",
    "image/heic",
    "image/heif",
    "image/gif",
    "image/webp",
  ],
  pdf: ["application/pdf"],
} as const;

/**
 * Map of file extensions to source types
 */
export const EXTENSION_TO_SOURCE_TYPE: Record<string, ImportSourceType> = {
  ".musicxml": "musicxml",
  ".xml": "musicxml",
  ".mxl": "mxl",
  ".jpg": "image",
  ".jpeg": "image",
  ".png": "image",
  ".heic": "image",
  ".heif": "image",
  ".gif": "image",
  ".webp": "image",
  ".pdf": "pdf",
};

// ============================================================================
// Size Limits
// ============================================================================

/**
 * Maximum file sizes in bytes
 */
export const MAX_FILE_SIZE: Record<ImportSourceType, number> = {
  musicxml: 10 * 1024 * 1024, // 10 MB
  mxl: 10 * 1024 * 1024, // 10 MB
  photo: 25 * 1024 * 1024, // 25 MB
  image: 25 * 1024 * 1024, // 25 MB
  pdf: 50 * 1024 * 1024, // 50 MB
};

/**
 * Human-readable size limits
 */
export const MAX_FILE_SIZE_DISPLAY: Record<ImportSourceType, string> = {
  musicxml: "10 MB",
  mxl: "10 MB",
  photo: "25 MB",
  image: "25 MB",
  pdf: "50 MB",
};

// ============================================================================
// Timeouts
// ============================================================================

/**
 * Timeout durations in milliseconds
 */
export const IMPORT_TIMEOUTS = {
  /** File validation timeout */
  VALIDATION: 5_000,
  /** Upload timeout */
  UPLOAD: 60_000,
  /** MusicXML parsing timeout */
  PARSE: 30_000,
  /** OMR job submission timeout */
  OMR_SUBMIT: 30_000,
  /** OMR job polling interval */
  OMR_POLL_INTERVAL: 2_000,
  /** Maximum OMR job wait time */
  OMR_MAX_WAIT: 5 * 60_000, // 5 minutes
  /** Normalization timeout */
  NORMALIZE: 10_000,
} as const;

// ============================================================================
// User-Facing Messages
// ============================================================================

/**
 * User-friendly error messages by error code
 */
export const USER_ERROR_MESSAGES: Record<ImportErrorCode, string> = {
  permission_denied:
    "Sound First needs permission to access your files. Please enable it in Settings.",
  canceled_by_user: "Import canceled.",
  unsupported_type: "This file type is not supported yet.",
  file_too_large: "This file is too large to import.",
  file_empty: "This file appears to be empty.",
  file_corrupted: "This file appears to be corrupted or unreadable.",
  invalid_extension: "This file type is not recognized.",
  parse_failed: "We couldn't read the contents of this file.",
  musicxml_invalid: "This MusicXML file appears to be invalid or corrupted.",
  mxl_extraction_failed: "We couldn't extract the contents of this MXL file.",
  upload_failed: "Failed to upload your file. Please try again.",
  upload_timeout:
    "Upload is taking too long. Please check your connection and try again.",
  network_error:
    "No internet connection. Please check your network and try again.",
  omr_submission_failed: "Couldn't start music recognition. Please try again.",
  omr_processing_failed: "Music recognition encountered an error.",
  omr_timeout:
    "Music recognition is taking too long. Please try a clearer image.",
  omr_low_confidence:
    "We had trouble reading parts of this music. Please review the results.",
  normalization_failed: "Couldn't process the recognized music data.",
  unknown_error: "Something went wrong. Please try again.",
};

/**
 * Recovery hints for recoverable errors
 */
export const RECOVERY_HINTS: Partial<Record<ImportErrorCode, string>> = {
  permission_denied: "Tap here to open Settings",
  file_too_large: "Try a smaller file or compress it first",
  file_empty: "Select a different file",
  file_corrupted: "Try re-downloading the file or select a different one",
  parse_failed: "Try exporting the file again from your notation software",
  musicxml_invalid: "Make sure this is a valid MusicXML file",
  upload_failed: "Check your internet connection",
  upload_timeout: "Check your internet connection",
  network_error: "Check your internet connection",
  omr_timeout: "Try a clearer, higher-resolution image",
  omr_low_confidence: "You can edit uncertain measures after import",
};

// ============================================================================
// Status Messages
// ============================================================================

/**
 * User-facing status messages for each pipeline stage
 */
export const STATUS_MESSAGES = {
  idle: "Ready to import",
  acquiring: "Getting file...",
  validating: "Checking file...",
  uploading: "Uploading...",
  parsing: "Reading music data...",
  omr_processing: "Recognizing music...",
  omr_polling: "Processing...",
  normalizing: "Preparing score...",
  succeeded: "Import complete!",
  failed: "Import failed",
  canceled: "Import canceled",
} as const;

// ============================================================================
// UI Constants
// ============================================================================

/**
 * Import action labels for UI
 */
export const IMPORT_ACTION_LABELS = {
  photo: "Take Photo",
  image: "Choose Image",
  pdf: "Upload PDF",
  musicxml: "Import MusicXML",
} as const;

/**
 * Import action descriptions for UI
 */
export const IMPORT_ACTION_DESCRIPTIONS = {
  photo: "Take a photo of sheet music",
  image: "Select an image from your library",
  pdf: "Import a PDF document",
  musicxml: "Import MusicXML or MXL file",
} as const;

/**
 * Import action icons (icon library names)
 */
export const IMPORT_ACTION_ICONS = {
  photo: "camera",
  image: "image",
  pdf: "file-text",
  musicxml: "file-music",
} as const;

/**
 * Supported file type hints for user
 */
export const FILE_TYPE_HINTS = {
  photo: "JPEG, PNG, or HEIC photos",
  image: "JPEG, PNG, GIF, or HEIC images",
  pdf: "PDF documents (up to 50 MB)",
  musicxml: "MusicXML (.musicxml, .xml) or compressed (.mxl) files",
} as const;
