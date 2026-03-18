/**
 * Import Validation Utilities
 *
 * File validation functions for the import pipeline.
 * Validates file types, sizes, and basic integrity.
 */

import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  EXTENSION_TO_SOURCE_TYPE,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_DISPLAY,
} from "../../../constants/import";
import type {
  ImportSourceType,
  ImportError,
  LocalImportAsset,
} from "../../../types/import";
import { createImportError } from "../../../types/import";

// ============================================================================
// File Extension Validation
// ============================================================================

/**
 * Extract file extension from a filename (lowercase, with leading dot)
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1 || lastDot === fileName.length - 1) {
    return "";
  }
  return fileName.slice(lastDot).toLowerCase();
}

/**
 * Check if a file extension is supported for a given source type
 */
export function isExtensionAllowed(
  extension: string,
  sourceType: ImportSourceType,
): boolean {
  const allowed = ALLOWED_EXTENSIONS[sourceType];
  return allowed.includes(extension.toLowerCase());
}

/**
 * Check if a file extension is supported for any import type
 */
export function isExtensionSupported(extension: string): boolean {
  const ext = extension.toLowerCase();
  return Object.values(ALLOWED_EXTENSIONS).some((exts) => exts.includes(ext));
}

/**
 * Infer source type from a file extension
 * Returns null if extension is not recognized
 */
export function inferSourceTypeFromExtension(
  extension: string,
): ImportSourceType | null {
  const ext = extension.toLowerCase();
  return EXTENSION_TO_SOURCE_TYPE[ext] ?? null;
}

// ============================================================================
// MIME Type Validation
// ============================================================================

/**
 * Check if a MIME type is allowed for a given source type
 */
export function isMimeTypeAllowed(
  mimeType: string | null,
  sourceType: ImportSourceType,
): boolean {
  if (!mimeType) {
    // If no MIME type provided, we can't validate - rely on extension
    return true;
  }
  const allowed = ALLOWED_MIME_TYPES[sourceType];
  return allowed.includes(mimeType.toLowerCase());
}

/**
 * Check if a MIME type might be MusicXML
 * Note: text/xml and application/xml can be many things
 */
export function mightBeMusicXml(mimeType: string | null): boolean {
  if (!mimeType) return false;
  const lower = mimeType.toLowerCase();
  return (
    lower === "application/vnd.recordare.musicxml+xml" ||
    lower === "application/xml" ||
    lower === "text/xml"
  );
}

/**
 * Check if a MIME type indicates a compressed MXL
 */
export function mightBeMxl(mimeType: string | null): boolean {
  if (!mimeType) return false;
  const lower = mimeType.toLowerCase();
  return (
    lower === "application/vnd.recordare.musicxml" ||
    lower === "application/zip" ||
    lower === "application/x-zip-compressed"
  );
}

// ============================================================================
// File Size Validation
// ============================================================================

/**
 * Check if a file size is within limits for a given source type
 */
export function isFileSizeAllowed(
  fileSize: number | null,
  sourceType: ImportSourceType,
): boolean {
  if (fileSize === null) {
    // If no size available, allow it through (will fail later if too large)
    return true;
  }
  return fileSize <= MAX_FILE_SIZE[sourceType];
}

/**
 * Get the max file size for a source type
 */
export function getMaxFileSize(sourceType: ImportSourceType): number {
  return MAX_FILE_SIZE[sourceType];
}

/**
 * Get the max file size as a human-readable string
 */
export function getMaxFileSizeDisplay(sourceType: ImportSourceType): string {
  return MAX_FILE_SIZE_DISPLAY[sourceType];
}

/**
 * Format bytes as a human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================================
// Comprehensive Validation
// ============================================================================

/**
 * Result of asset validation
 */
export interface AssetValidationResult {
  readonly valid: boolean;
  readonly errors: ImportError[];
  readonly warnings: string[];
}

/**
 * Validate a LocalImportAsset before processing
 *
 * Checks:
 * - File extension is allowed for the source type
 * - MIME type (if available) matches source type
 * - File size is within limits
 */
export function validateImportAsset(
  asset: LocalImportAsset,
): AssetValidationResult {
  const errors: ImportError[] = [];
  const warnings: string[] = [];

  // Check file extension
  const extension = getFileExtension(asset.fileName);
  if (!extension) {
    errors.push(
      createImportError(
        "invalid_extension",
        `File has no extension: ${asset.fileName}`,
        "This file type is not recognized.",
        { severity: "fatal", recoverable: false },
      ),
    );
  } else if (!isExtensionAllowed(extension, asset.sourceType)) {
    errors.push(
      createImportError(
        "invalid_extension",
        `Extension ${extension} not allowed for ${asset.sourceType}`,
        "This file type is not supported.",
        {
          severity: "fatal",
          recoverable: false,
          context: { extension, sourceType: asset.sourceType },
        },
      ),
    );
  }

  // Check MIME type if available
  if (asset.mimeType && !isMimeTypeAllowed(asset.mimeType, asset.sourceType)) {
    // MIME type mismatch is a warning, not an error
    // Some systems report incorrect MIME types
    warnings.push(
      `MIME type ${asset.mimeType} may not match expected type for ${asset.sourceType}`,
    );
  }

  // Check file size
  if (
    asset.fileSize !== null &&
    !isFileSizeAllowed(asset.fileSize, asset.sourceType)
  ) {
    const maxSize = getMaxFileSizeDisplay(asset.sourceType);
    const actualSize = formatFileSize(asset.fileSize);
    errors.push(
      createImportError(
        "file_too_large",
        `File size ${actualSize} exceeds limit of ${maxSize}`,
        `This file is too large. Maximum size is ${maxSize}.`,
        {
          severity: "fatal",
          recoverable: false,
          recoveryHint: "Try a smaller file or compress it first",
          context: {
            fileSize: asset.fileSize,
            maxSize: MAX_FILE_SIZE[asset.sourceType],
          },
        },
      ),
    );
  }

  // Check for empty file
  if (asset.fileSize === 0) {
    errors.push(
      createImportError(
        "file_empty",
        "File is empty (0 bytes)",
        "This file appears to be empty.",
        { severity: "fatal", recoverable: false },
      ),
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// MusicXML-Specific Validation
// ============================================================================

/**
 * Quick check if content looks like MusicXML
 * Does a simple header check, not full parsing
 */
export function looksLikeMusicXml(content: string): boolean {
  const trimmed = content.trim();
  // Check for XML declaration and MusicXML root elements
  if (!trimmed.startsWith("<?xml") && !trimmed.startsWith("<")) {
    return false;
  }
  // Check for common MusicXML root elements
  return (
    trimmed.includes("<score-partwise") ||
    trimmed.includes("<score-timewise") ||
    trimmed.includes("<opus")
  );
}

/**
 * Detect MusicXML version from content
 */
export function detectMusicXmlVersion(content: string): string | null {
  // Look for version attribute on the MusicXML root element (score-partwise or score-timewise)
  // Not the XML declaration's version (<?xml version="1.0"?>)
  const rootElementMatch = content.match(
    /<score-(partwise|timewise)[^>]*version=["']([0-9.]+)["']/,
  );
  return rootElementMatch ? rootElementMatch[2] : null;
}

/**
 * Validate that content is parseable MusicXML
 * Returns validation result with any issues found
 */
export interface MusicXmlValidationResult {
  readonly valid: boolean;
  readonly version: string | null;
  readonly rootElement: "score-partwise" | "score-timewise" | null;
  readonly error: ImportError | null;
}

export function validateMusicXmlContent(
  content: string,
): MusicXmlValidationResult {
  const trimmed = content.trim();

  // Check for empty content
  if (!trimmed) {
    return {
      valid: false,
      version: null,
      rootElement: null,
      error: createImportError(
        "musicxml_invalid",
        "MusicXML content is empty",
        "This MusicXML file appears to be empty.",
        { severity: "fatal", recoverable: false },
      ),
    };
  }

  // Check for XML header
  if (!trimmed.startsWith("<?xml") && !trimmed.startsWith("<")) {
    return {
      valid: false,
      version: null,
      rootElement: null,
      error: createImportError(
        "musicxml_invalid",
        "Content does not appear to be XML",
        "We couldn't recognize this as MusicXML.",
        { severity: "fatal", recoverable: false },
      ),
    };
  }

  // Determine root element
  let rootElement: "score-partwise" | "score-timewise" | null = null;
  if (trimmed.includes("<score-partwise")) {
    rootElement = "score-partwise";
  } else if (trimmed.includes("<score-timewise")) {
    rootElement = "score-timewise";
  }

  if (!rootElement) {
    return {
      valid: false,
      version: detectMusicXmlVersion(trimmed),
      rootElement: null,
      error: createImportError(
        "musicxml_invalid",
        "No MusicXML root element found (score-partwise or score-timewise)",
        "This doesn't appear to be a valid MusicXML file.",
        { severity: "fatal", recoverable: false },
      ),
    };
  }

  return {
    valid: true,
    version: detectMusicXmlVersion(trimmed),
    rootElement,
    error: null,
  };
}

// ============================================================================
// Image Quality Hints
// ============================================================================

/**
 * Hints for image quality (used with OMR)
 * These are heuristics, not definitive checks
 */
export interface ImageQualityHints {
  readonly minRecommendedWidth: number;
  readonly minRecommendedHeight: number;
  readonly preferredAspectRatio: string;
}

export const IMAGE_QUALITY_HINTS: ImageQualityHints = {
  minRecommendedWidth: 1000,
  minRecommendedHeight: 1400,
  preferredAspectRatio: "portrait (letter/A4)",
};

/**
 * Check if image dimensions are likely sufficient for OMR
 */
export function areImageDimensionsSufficient(
  width: number | null,
  height: number | null,
): { sufficient: boolean; warning: string | null } {
  if (width === null || height === null) {
    return { sufficient: true, warning: null }; // Can't check, assume OK
  }

  const { minRecommendedWidth, minRecommendedHeight } = IMAGE_QUALITY_HINTS;

  if (width < minRecommendedWidth || height < minRecommendedHeight) {
    return {
      sufficient: false,
      warning: `Image resolution may be too low for accurate recognition. Recommended minimum: ${minRecommendedWidth}x${minRecommendedHeight} pixels.`,
    };
  }

  return { sufficient: true, warning: null };
}
