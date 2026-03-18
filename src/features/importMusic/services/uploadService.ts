/**
 * Upload Service
 *
 * Handles uploading import assets to the backend for processing.
 * Supports direct upload and signed URL workflows.
 */

// Use the legacy API for expo-file-system (SDK 55+ uses class-based API)
import * as FileSystem from "expo-file-system/legacy";
import { FileSystemUploadType } from "expo-file-system/legacy";

// Upload type constants for reference (matching FileSystemUploadType enum)
// UPLOAD_TYPE_BINARY = 0 (not currently used)
// UPLOAD_TYPE_MULTIPART = 1

import type {
  LocalImportAsset,
  RemoteUploadResult,
  ImportError,
} from "../../../types/import";
import { createImportError } from "../../../types/import";
import type {
  SignedUrlRequest,
  SignedUrlResponse,
  UploadResponse,
} from "./backendContracts";
import { IMPORT_TIMEOUTS } from "../../../constants/import";
import { mapNativeError } from "../utils/errors";
import { devLog } from "../../../utils/devLogger";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Upload service configuration
 *
 * In production, these values would come from environment config
 */
interface UploadConfig {
  /** Base URL for the upload API */
  readonly baseUrl: string;
  /** Whether to use signed URLs for upload */
  readonly useSignedUrls: boolean;
  /** Upload timeout in ms */
  readonly timeout: number;
}

/**
 * Default upload configuration
 *
 * TODO: Replace with actual backend URL from environment
 */
const DEFAULT_CONFIG: UploadConfig = {
  baseUrl: "https://api.soundfirst.app", // Placeholder
  useSignedUrls: true,
  timeout: IMPORT_TIMEOUTS.UPLOAD,
};

// ============================================================================
// Upload Functions
// ============================================================================

/**
 * Upload an import asset to the backend
 *
 * This function orchestrates the upload process:
 * 1. If using signed URLs: requests a signed URL, then uploads directly to storage
 * 2. If using direct upload: uploads directly to the backend API
 *
 * @param asset - The local asset to upload
 * @param config - Optional configuration override
 * @returns Upload result with remote asset ID
 */
export async function uploadImportAsset(
  asset: LocalImportAsset,
  config: Partial<UploadConfig> = {},
): Promise<RemoteUploadResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    if (finalConfig.useSignedUrls) {
      return await uploadViaSignedUrl(asset, finalConfig);
    } else {
      return await uploadDirect(asset, finalConfig);
    }
  } catch (error) {
    const importError = mapNativeError(error);
    return {
      success: false,
      remoteAssetId: null,
      remoteUrl: null,
      uploadedAt: null,
      error: importError,
    };
  }
}

/**
 * Upload using a signed URL (preferred method)
 *
 * 1. Request signed URL from backend
 * 2. Upload directly to storage (S3, GCS, etc.)
 * 3. Notify backend of completion
 */
async function uploadViaSignedUrl(
  asset: LocalImportAsset,
  config: UploadConfig,
): Promise<RemoteUploadResult> {
  // Step 1: Request signed URL
  const signedUrlRequest: SignedUrlRequest = {
    fileName: asset.fileName,
    mimeType: asset.mimeType ?? "application/octet-stream",
    fileSize: asset.fileSize ?? undefined,
    sourceType: asset.sourceType,
  };

  // TODO: Implement actual API call
  // For now, return a placeholder response indicating backend integration needed
  const signedUrlResponse = await requestSignedUrl(signedUrlRequest, config);

  if (!signedUrlResponse.success || !signedUrlResponse.uploadUrl) {
    return {
      success: false,
      remoteAssetId: null,
      remoteUrl: null,
      uploadedAt: null,
      error: createImportError(
        "upload_failed",
        signedUrlResponse.error ?? "Failed to get signed URL",
        "Could not prepare upload. Please try again.",
        { severity: "recoverable", recoverable: true },
      ),
    };
  }

  // Step 2: Upload to signed URL
  const uploadResult = await uploadToSignedUrl(
    asset.uri,
    signedUrlResponse.uploadUrl,
    asset.mimeType,
    config.timeout,
  );

  if (!uploadResult.success) {
    return {
      success: false,
      remoteAssetId: null,
      remoteUrl: null,
      uploadedAt: null,
      error: uploadResult.error,
    };
  }

  // Step 3: Confirm upload with backend
  const _confirmResult = await confirmUpload(signedUrlResponse.assetId, config);

  return {
    success: true,
    remoteAssetId: signedUrlResponse.assetId,
    remoteUrl: signedUrlResponse.publicUrl ?? null,
    uploadedAt: Date.now(),
    error: null,
  };
}

/**
 * Upload directly to the backend API
 */
async function uploadDirect(
  asset: LocalImportAsset,
  config: UploadConfig,
): Promise<RemoteUploadResult> {
  const uploadUrl = `${config.baseUrl}/api/v1/import/upload`;

  const response = await FileSystem.uploadAsync(uploadUrl, asset.uri, {
    httpMethod: "POST",
    uploadType: FileSystemUploadType.MULTIPART,
    fieldName: "file",
    parameters: {
      fileName: asset.fileName,
      sourceType: asset.sourceType,
      mimeType: asset.mimeType ?? "application/octet-stream",
    },
  });

  if (response.status >= 200 && response.status < 300) {
    const responseData: UploadResponse = JSON.parse(response.body);
    return {
      success: true,
      remoteAssetId: responseData.assetId,
      remoteUrl: responseData.url ?? null,
      uploadedAt: Date.now(),
      error: null,
    };
  } else {
    return {
      success: false,
      remoteAssetId: null,
      remoteUrl: null,
      uploadedAt: null,
      error: createImportError(
        "upload_failed",
        `Upload failed with status ${response.status}: ${response.body}`,
        "Failed to upload your file. Please try again.",
        { severity: "recoverable", recoverable: true },
      ),
    };
  }
}

// ============================================================================
// Signed URL Workflow
// ============================================================================

/**
 * Request a signed URL from the backend
 *
 * TODO: Implement actual API call
 */
async function requestSignedUrl(
  request: SignedUrlRequest,
  _config: UploadConfig,
): Promise<SignedUrlResponse> {
  // Placeholder: In production, this would make an actual API call
  // For now, return a mock response indicating the feature needs backend integration

  devLog("[Upload] Would request signed URL:", request);

  // Simulated response for development
  // In production, replace with actual fetch call
  /*
  const response = await fetch(`${config.baseUrl}/api/v1/import/signed-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Add auth headers here
    },
    body: JSON.stringify(request),
  });
  return response.json();
  */

  return {
    success: false,
    uploadUrl: null,
    assetId: "",
    publicUrl: null,
    expiresAt: null,
    error: "Upload service not yet integrated with backend",
  };
}

/**
 * Upload file to a signed URL
 */
async function uploadToSignedUrl(
  localUri: string,
  signedUrl: string,
  mimeType: string | null,
  _timeout: number,
): Promise<{ success: boolean; error: ImportError | null }> {
  try {
    const response = await FileSystem.uploadAsync(signedUrl, localUri, {
      httpMethod: "PUT",
      uploadType: FileSystemUploadType.BINARY_CONTENT,
      headers: {
        "Content-Type": mimeType ?? "application/octet-stream",
      },
    });

    if (response.status >= 200 && response.status < 300) {
      return { success: true, error: null };
    } else {
      return {
        success: false,
        error: createImportError(
          "upload_failed",
          `Signed URL upload failed with status ${response.status}`,
          "Failed to upload your file. Please try again.",
          { severity: "recoverable", recoverable: true },
        ),
      };
    }
  } catch (error) {
    return {
      success: false,
      error: mapNativeError(error),
    };
  }
}

/**
 * Confirm upload completion with backend
 *
 * TODO: Implement actual API call
 */
async function confirmUpload(
  assetId: string,
  _config: UploadConfig,
): Promise<{ success: boolean }> {
  // Placeholder: In production, this would notify the backend
  devLog("[Upload] Would confirm upload for asset:", assetId);
  return { success: true };
}

// ============================================================================
// Upload Progress (Future)
// ============================================================================

/**
 * Upload progress callback type
 */
export type UploadProgressCallback = (progress: {
  totalBytes: number;
  uploadedBytes: number;
  percentage: number;
}) => void;

/**
 * Upload with progress tracking
 *
 * TODO: Implement progress tracking
 * Note: FileSystem.uploadAsync doesn't support progress callbacks directly.
 * For progress tracking, we may need to:
 * 1. Use a different upload method (e.g., XMLHttpRequest)
 * 2. Or chunk the file and track chunk progress
 */
export async function uploadWithProgress(
  asset: LocalImportAsset,
  onProgress: UploadProgressCallback,
  config: Partial<UploadConfig> = {},
): Promise<RemoteUploadResult> {
  // For now, just call the regular upload
  // Progress tracking requires more sophisticated implementation
  return uploadImportAsset(asset, config);
}
