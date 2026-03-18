/**
 * Share Extension Service
 *
 * Handles files shared from other apps via iOS Share Extension
 * and Android Intent Filter mechanisms.
 *
 * On iOS:
 * - Apps can share files via UIDocumentPickerViewController or Share Extension
 * - Files come in via a content:// or file:// URL
 * - We need to copy the file to our app's sandbox before processing
 *
 * On Android:
 * - Apps share files via Intent.ACTION_SEND or Intent.ACTION_VIEW
 * - Files come in via content:// URI
 * - We need to copy the file to our app's cache before processing
 *
 * This service:
 * 1. Receives incoming URLs through deep linking
 * 2. Validates the file type
 * 3. Copies file to app's controlled directory
 * 4. Returns a ShareExtensionAsset ready for the import pipeline
 */

import * as FileSystem from "expo-file-system";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

import type { ImportSourceType, LocalImportAsset } from "../../../types/import";
import { MAX_FILE_SIZE } from "../../../constants/import";

// ============================================================================
// Types
// ============================================================================

/**
 * Simplified asset type for shared files
 * This is converted to LocalImportAsset by the orchestrator
 */
export interface ShareExtensionAsset {
  /** Local file URI */
  readonly uri: string;
  /** File name */
  readonly name: string;
  /** Source type for import pipeline */
  readonly type: ImportSourceType;
  /** File size in bytes */
  readonly size: number;
  /** MIME type */
  readonly mimeType: string;
}

export interface ShareExtensionConfig {
  /** Supported file extensions (lowercase, without dot) */
  readonly supportedExtensions: readonly string[];
  /** Callback when a shared file is received */
  readonly onFileReceived?: (asset: ShareExtensionAsset) => void;
  /** Callback when an error occurs */
  readonly onError?: (error: ShareExtensionError) => void;
}

export interface ShareUrlParseResult {
  /** Whether the URL is a valid share URL */
  readonly isValid: boolean;
  /** The file path extracted from the URL */
  readonly filePath: string | null;
  /** The file name extracted from the URL */
  readonly fileName: string | null;
  /** The detected file type */
  readonly fileType: ImportSourceType | null;
  /** Any error that occurred */
  readonly error: string | null;
}

export class ShareExtensionError extends Error {
  constructor(
    message: string,
    public readonly code: ShareExtensionErrorCode,
    public readonly originalUrl?: string,
  ) {
    super(message);
    this.name = "ShareExtensionError";
  }
}

export type ShareExtensionErrorCode =
  | "INVALID_URL"
  | "UNSUPPORTED_TYPE"
  | "FILE_ACCESS_DENIED"
  | "FILE_NOT_FOUND"
  | "COPY_FAILED"
  | "FILE_TOO_LARGE";

// ============================================================================
// Constants
// ============================================================================

/** Extension to source type mapping */
const EXTENSION_TO_TYPE: Record<string, ImportSourceType> = {
  xml: "musicxml",
  musicxml: "musicxml",
  mxl: "mxl",
  pdf: "pdf",
  jpg: "image",
  jpeg: "image",
  png: "image",
  heic: "image",
};

// ============================================================================
// URL Parsing
// ============================================================================

/**
 * Parse an incoming URL to extract file information
 */
export function parseShareUrl(url: string): ShareUrlParseResult {
  try {
    // Handle empty/null URLs
    if (!url || typeof url !== "string") {
      return {
        isValid: false,
        filePath: null,
        fileName: null,
        fileType: null,
        error: "Invalid or empty URL",
      };
    }

    // Parse the URL
    let filePath: string;
    let fileName: string;

    if (url.startsWith("file://")) {
      // Direct file URL
      filePath = decodeURIComponent(url.replace("file://", ""));
      fileName = filePath.split("/").pop() ?? "";
    } else if (url.startsWith("content://")) {
      // Android content provider URL
      filePath = url;
      // Try to extract filename from content URL
      const segments = url.split("/");
      fileName = segments[segments.length - 1] ?? "shared_file";
      // Remove any query parameters
      fileName = fileName.split("?")[0];
    } else if (url.startsWith("soundfirst://")) {
      // Our custom deep link scheme
      const parsed = Linking.parse(url);
      filePath = (parsed.queryParams?.file as string) ?? "";
      fileName = (parsed.queryParams?.name as string) ?? "imported_file";
    } else {
      return {
        isValid: false,
        filePath: null,
        fileName: null,
        fileType: null,
        error: `Unsupported URL scheme: ${url.substring(0, 20)}...`,
      };
    }

    // Extract and validate extension
    const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
    const fileType = EXTENSION_TO_TYPE[extension];

    if (!fileType) {
      return {
        isValid: false,
        filePath,
        fileName,
        fileType: null,
        error: `Unsupported file type: .${extension}`,
      };
    }

    return {
      isValid: true,
      filePath,
      fileName,
      fileType,
      error: null,
    };
  } catch (error) {
    return {
      isValid: false,
      filePath: null,
      fileName: null,
      fileType: null,
      error:
        error instanceof Error ? error.message : "Unknown error parsing URL",
    };
  }
}

// ============================================================================
// File Handling
// ============================================================================

/**
 * Copy a shared file to the app's cache directory for processing
 */
export async function copySharedFileToCache(
  sourceUrl: string,
  fileName: string,
): Promise<string> {
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) {
    throw new ShareExtensionError(
      "Cache directory not available",
      "COPY_FAILED",
      sourceUrl,
    );
  }

  // Create a unique filename to avoid conflicts
  const timestamp = Date.now();
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const targetPath = `${cacheDir}share_${timestamp}_${safeFileName}`;

  try {
    // Check if source exists (for file:// URLs)
    if (sourceUrl.startsWith("file://") || !sourceUrl.includes("://")) {
      const sourcePath = sourceUrl.replace("file://", "");
      const info = await FileSystem.getInfoAsync(sourcePath);

      if (!info.exists) {
        throw new ShareExtensionError(
          "Shared file not found",
          "FILE_NOT_FOUND",
          sourceUrl,
        );
      }

      // Check file size (use PDF limit as max since it's the largest)
      const maxSize = MAX_FILE_SIZE.pdf;
      if (info.size && info.size > maxSize) {
        throw new ShareExtensionError(
          `File too large (${Math.round(info.size / 1024 / 1024)}MB). Maximum is 50MB`,
          "FILE_TOO_LARGE",
          sourceUrl,
        );
      }

      // Copy the file
      await FileSystem.copyAsync({
        from: sourcePath,
        to: targetPath,
      });
    } else if (sourceUrl.startsWith("content://")) {
      // Android content:// URLs need to be read differently
      // expo-file-system can read from content:// URLs on Android
      if (Platform.OS === "android") {
        await FileSystem.copyAsync({
          from: sourceUrl,
          to: targetPath,
        });
      } else {
        throw new ShareExtensionError(
          "Content URLs only supported on Android",
          "FILE_ACCESS_DENIED",
          sourceUrl,
        );
      }
    } else {
      throw new ShareExtensionError(
        "Cannot copy from this URL type",
        "FILE_ACCESS_DENIED",
        sourceUrl,
      );
    }

    return targetPath;
  } catch (error) {
    if (error instanceof ShareExtensionError) {
      throw error;
    }
    throw new ShareExtensionError(
      `Failed to copy file: ${error instanceof Error ? error.message : "Unknown error"}`,
      "COPY_FAILED",
      sourceUrl,
    );
  }
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Process an incoming shared file URL
 * Returns a ShareExtensionAsset ready for the import pipeline
 */
export async function handleSharedFile(
  url: string,
): Promise<ShareExtensionAsset> {
  // Parse the URL
  const parseResult = parseShareUrl(url);

  if (!parseResult.isValid || !parseResult.filePath || !parseResult.fileType) {
    throw new ShareExtensionError(
      parseResult.error ?? "Invalid share URL",
      "INVALID_URL",
      url,
    );
  }

  // Copy to cache for processing
  const cachedPath = await copySharedFileToCache(
    parseResult.filePath,
    parseResult.fileName ?? "shared_file",
  );

  // Get file info
  const fileInfo = await FileSystem.getInfoAsync(cachedPath);

  // Create ShareExtensionAsset
  const asset: ShareExtensionAsset = {
    uri: cachedPath,
    name: parseResult.fileName ?? "shared_file",
    type: parseResult.fileType,
    size: fileInfo.exists && "size" in fileInfo ? (fileInfo.size ?? 0) : 0,
    mimeType: getMimeTypeForSourceType(parseResult.fileType),
  };

  return asset;
}

// ============================================================================
// Asset Conversion
// ============================================================================

/**
 * Generate a unique ID for an import asset
 */
function generateAssetId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `shared_${timestamp}_${random}`;
}

/**
 * Convert a ShareExtensionAsset to a normalized LocalImportAsset
 *
 * This ensures all import sources (file picker, camera, share extension)
 * produce the same normalized shape for the import pipeline.
 */
export function shareExtensionAssetToLocal(
  shareAsset: ShareExtensionAsset,
): LocalImportAsset {
  return {
    id: generateAssetId(),
    uri: shareAsset.uri,
    fileName: shareAsset.name,
    sourceType: shareAsset.type,
    fileSize: shareAsset.size,
    mimeType: shareAsset.mimeType,
    acquiredAt: Date.now(),
  };
}

/**
 * Get MIME type for a source type
 */
function getMimeTypeForSourceType(sourceType: ImportSourceType): string {
  switch (sourceType) {
    case "musicxml":
      return "application/vnd.recordare.musicxml+xml";
    case "mxl":
      return "application/vnd.recordare.musicxml";
    case "pdf":
      return "application/pdf";
    case "image":
    case "photo":
      return "image/jpeg";
    default:
      return "application/octet-stream";
  }
}

// ============================================================================
// Share Extension Listener
// ============================================================================

/**
 * Set up a listener for incoming share extension URLs
 */
export function createShareExtensionListener(
  config: ShareExtensionConfig,
): () => void {
  const handleUrl = async (event: { url: string }) => {
    try {
      const parseResult = parseShareUrl(event.url);

      // Check if this is a URL we should handle
      if (!parseResult.isValid) {
        // Not a share URL, ignore silently (might be a different deep link)
        return;
      }

      // Check file type is supported
      if (
        !parseResult.fileType ||
        !config.supportedExtensions.includes(
          parseResult.fileName?.split(".").pop()?.toLowerCase() ?? "",
        )
      ) {
        config.onError?.(
          new ShareExtensionError(
            `Unsupported file type: ${parseResult.fileName}`,
            "UNSUPPORTED_TYPE",
            event.url,
          ),
        );
        return;
      }

      // Handle the file
      const asset = await handleSharedFile(event.url);
      config.onFileReceived?.(asset);
    } catch (error) {
      if (error instanceof ShareExtensionError) {
        config.onError?.(error);
      } else {
        config.onError?.(
          new ShareExtensionError(
            error instanceof Error ? error.message : "Unknown error",
            "COPY_FAILED",
            event.url,
          ),
        );
      }
    }
  };

  // Add URL listener
  const subscription = Linking.addEventListener("url", handleUrl);

  // Check for initial URL (app was opened via share)
  Linking.getInitialURL().then((url) => {
    if (url) {
      handleUrl({ url });
    }
  });

  // Return cleanup function
  return () => {
    subscription.remove();
  };
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Clean up old shared files from cache
 */
export async function cleanupSharedFilesCache(
  maxAgeMs: number = 24 * 60 * 60 * 1000, // 24 hours
): Promise<number> {
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) return 0;

  try {
    const files = await FileSystem.readDirectoryAsync(cacheDir);
    const sharedFiles = files.filter((f) => f.startsWith("share_"));
    const now = Date.now();
    let deletedCount = 0;

    for (const file of sharedFiles) {
      try {
        // Extract timestamp from filename (share_TIMESTAMP_filename)
        const parts = file.split("_");
        if (parts.length >= 2) {
          const timestamp = parseInt(parts[1], 10);
          if (!isNaN(timestamp) && now - timestamp > maxAgeMs) {
            await FileSystem.deleteAsync(`${cacheDir}${file}`, {
              idempotent: true,
            });
            deletedCount++;
          }
        }
      } catch {
        // Ignore individual file errors
      }
    }

    return deletedCount;
  } catch {
    return 0;
  }
}
