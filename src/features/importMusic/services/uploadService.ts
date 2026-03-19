/**
 * Upload Service
 *
 * Handles uploading import assets to the backend for processing.
 * Supports direct upload and signed URL workflows.
 */

// Use the legacy API for expo-file-system (SDK 55+ uses class-based API)
import * as FileSystem from "expo-file-system/legacy";
import { FileSystemUploadType } from "expo-file-system/legacy";
import { Platform } from "react-native";

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
import { getApiConfig, getUploadConfig } from "../config";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Upload service configuration
 *
 * Uses shared import config for URLs, allows local overrides for timeout etc.
 */
interface UploadConfig {
  /** Base URL for the upload API (defaults to import config) */
  readonly baseUrl?: string;
  /** Whether to use signed URLs for upload */
  readonly useSignedUrls: boolean;
  /** Upload timeout in ms */
  readonly timeout: number;
}

/**
 * Get default upload configuration from shared config
 */
function getDefaultConfig(): UploadConfig {
  const apiConfig = getApiConfig();
  const uploadConfig = getUploadConfig();
  return {
    baseUrl: apiConfig.importsUrl,
    useSignedUrls: uploadConfig.method === "signed_url",
    timeout: uploadConfig.timeout,
  };
}

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
  const defaultConfig = getDefaultConfig();
  const finalConfig = { ...defaultConfig, ...config };

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
 *
 * Note: Direct upload flow:
 * 1. First request a signed URL to get an asset_id
 * 2. Then upload to /upload/direct/{asset_id}
 */
async function uploadDirect(
  asset: LocalImportAsset,
  config: UploadConfig,
): Promise<RemoteUploadResult> {
  // First get a signed URL to obtain an asset_id
  // The backend generates the asset_id on this call
  const signedUrlResponse = await requestSignedUrl(
    {
      fileName: asset.fileName,
      mimeType: asset.mimeType ?? "application/octet-stream",
      sourceType: asset.sourceType,
      fileSize: asset.fileSize ?? 0,
    },
    config,
  );

  if (!signedUrlResponse.success || !signedUrlResponse.assetId) {
    return {
      success: false,
      remoteAssetId: null,
      remoteUrl: null,
      uploadedAt: null,
      error: createImportError(
        "upload_failed",
        signedUrlResponse.error ?? "Failed to prepare upload",
        "Could not start upload. Please try again.",
        { severity: "recoverable", recoverable: true },
      ),
    };
  }

  const uploadUrl = `${config.baseUrl}/upload/direct/${signedUrlResponse.assetId}`;

  // On web, use fetch with FormData for blob URLs
  if (Platform.OS === "web") {
    return await uploadDirectWeb(asset, uploadUrl);
  }

  const response = await FileSystem.uploadAsync(uploadUrl, asset.uri, {
    httpMethod: "POST",
    uploadType: FileSystemUploadType.MULTIPART,
    fieldName: "file",
    parameters: {
      source_type: asset.sourceType,
    },
  });

  if (response.status >= 200 && response.status < 300) {
    const responseData = JSON.parse(response.body);
    devLog("[Upload] Native upload response:", responseData);
    // Backend sends snake_case, map to our interface
    const assetId = responseData.asset_id ?? responseData.assetId;
    return {
      success: true,
      remoteAssetId: assetId,
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

/**
 * Web-specific upload using fetch and FormData
 * Handles blob URLs that FileSystem.uploadAsync can't process
 */
async function uploadDirectWeb(
  asset: LocalImportAsset,
  uploadUrl: string,
): Promise<RemoteUploadResult> {
  try {
    devLog("[Upload] Using web upload path for:", asset.uri);

    // Fetch the blob from the blob URL
    const blobResponse = await fetch(asset.uri);
    const blob = await blobResponse.blob();

    // Create FormData with the file
    const formData = new FormData();
    formData.append("file", blob, asset.fileName);
    formData.append("source_type", asset.sourceType);

    // Upload using fetch
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const responseData = await response.json();
      devLog("[Upload] Web upload response:", responseData);
      // Backend sends snake_case, map to our interface
      const assetId = responseData.asset_id ?? responseData.assetId;
      return {
        success: true,
        remoteAssetId: assetId,
        remoteUrl: responseData.url ?? null,
        uploadedAt: Date.now(),
        error: null,
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        remoteAssetId: null,
        remoteUrl: null,
        uploadedAt: null,
        error: createImportError(
          "upload_failed",
          `Upload failed with status ${response.status}: ${errorText}`,
          "Failed to upload your file. Please try again.",
          { severity: "recoverable", recoverable: true },
        ),
      };
    }
  } catch (error) {
    devLog("[Upload] Web upload error:", error);
    return {
      success: false,
      remoteAssetId: null,
      remoteUrl: null,
      uploadedAt: null,
      error: mapNativeError(error),
    };
  }
}

// ============================================================================
// Signed URL Workflow
// ============================================================================

/**
 * Request a signed URL from the backend
 */
async function requestSignedUrl(
  request: SignedUrlRequest,
  config: UploadConfig,
): Promise<SignedUrlResponse> {
  const url = `${config.baseUrl}/upload/signed-url`;

  devLog("[Upload] Requesting signed URL:", url);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // TODO: Add auth headers from context
      },
      body: JSON.stringify({
        file_name: request.fileName,
        mime_type: request.mimeType,
        source_type: request.sourceType,
        file_size: request.fileSize,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      devLog("[Upload] Signed URL request failed:", response.status, errorText);
      return {
        success: false,
        uploadUrl: null,
        assetId: "",
        publicUrl: null,
        expiresAt: null,
        error: `Failed to get upload URL: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: data.success ?? true,
      uploadUrl: data.upload_url ?? null,
      assetId: data.asset_id ?? "",
      publicUrl: data.public_url ?? null,
      expiresAt: data.expires_at ?? null,
      error: data.error ?? null,
    };
  } catch (error) {
    devLog("[Upload] Signed URL request error:", error);
    return {
      success: false,
      uploadUrl: null,
      assetId: "",
      publicUrl: null,
      expiresAt: null,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
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
