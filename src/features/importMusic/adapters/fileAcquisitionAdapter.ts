/**
 * File Acquisition Adapter Interface
 *
 * Platform-agnostic contract for acquiring files from various sources.
 * This abstraction allows swapping implementations for different platforms
 * (Expo/React Native, Web, Desktop) without changing the core import logic.
 */

import type { LocalImportAsset, ImportError } from "../../../types/import";

// ============================================================================
// Core Types
// ============================================================================

/**
 * Result of any acquisition operation
 */
export interface AcquisitionResult {
  readonly success: boolean;
  readonly asset: LocalImportAsset | null;
  readonly error: ImportError | null;
}

/**
 * Result of a permission check
 */
export interface PermissionResult {
  readonly granted: boolean;
  readonly canAskAgain: boolean;
}

/**
 * Options for camera capture
 */
export interface CameraOptions {
  /** Camera facing direction */
  readonly cameraType?: "front" | "back";
  /** Allow editing after capture */
  readonly allowsEditing?: boolean;
  /** Image quality (0-1) */
  readonly quality?: number;
}

/**
 * Options for image library selection
 */
export interface ImageLibraryOptions {
  /** Allow editing after selection */
  readonly allowsEditing?: boolean;
  /** Image quality for compressed output (0-1) */
  readonly quality?: number;
  /** Allow multiple selection */
  readonly allowMultiple?: boolean;
}

/**
 * Options for document picker
 */
export interface DocumentPickerOptions {
  /** Filter by document type */
  readonly documentType: "pdf" | "musicxml" | "any";
  /** Whether to copy the file to app's cache directory */
  readonly copyToCache?: boolean;
}

/**
 * File metadata from the platform
 */
export interface PlatformFileMetadata {
  readonly uri: string;
  readonly fileName: string;
  readonly mimeType: string | null;
  readonly fileSize: number | null;
}

// ============================================================================
// Adapter Interface
// ============================================================================

/**
 * File Acquisition Adapter Interface
 *
 * Implementations must handle all platform-specific details for:
 * - Camera capture
 * - Image library selection
 * - Document picking
 * - Permission management
 * - File system operations
 */
export interface FileAcquisitionAdapter {
  /**
   * Adapter identifier for debugging/logging
   */
  readonly adapterId: string;

  // ---------------------------------------------------------------------------
  // Permission Management
  // ---------------------------------------------------------------------------

  /**
   * Check camera permission status
   */
  checkCameraPermission(): Promise<PermissionResult>;

  /**
   * Request camera permission
   */
  requestCameraPermission(): Promise<PermissionResult>;

  /**
   * Check media library permission status
   */
  checkMediaLibraryPermission(): Promise<PermissionResult>;

  /**
   * Request media library permission
   */
  requestMediaLibraryPermission(): Promise<PermissionResult>;

  // ---------------------------------------------------------------------------
  // File Acquisition
  // ---------------------------------------------------------------------------

  /**
   * Launch camera and capture a photo
   */
  acquireFromCamera(options?: CameraOptions): Promise<AcquisitionResult>;

  /**
   * Open image library and select an image
   */
  acquireFromImageLibrary(
    options?: ImageLibraryOptions,
  ): Promise<AcquisitionResult>;

  /**
   * Open document picker to select a file
   */
  acquireFromDocuments(
    options: DocumentPickerOptions,
  ): Promise<AcquisitionResult>;

  // ---------------------------------------------------------------------------
  // File Operations
  // ---------------------------------------------------------------------------

  /**
   * Read file content as string
   */
  readFileAsString(uri: string): Promise<string>;

  /**
   * Read file content as base64
   */
  readFileAsBase64(uri: string): Promise<string>;

  /**
   * Get file metadata (size, exists, etc.)
   */
  getFileInfo(uri: string): Promise<{
    exists: boolean;
    size: number | null;
    isDirectory: boolean;
  }>;

  /**
   * Copy file to persistent storage
   */
  copyToPersistentStorage(
    sourceUri: string,
    destinationName: string,
  ): Promise<string>;

  /**
   * Delete a file
   */
  deleteFile(uri: string): Promise<void>;
}

// ============================================================================
// Factory Function Type
// ============================================================================

/**
 * Factory function to create an adapter instance
 */
export type FileAcquisitionAdapterFactory = () => FileAcquisitionAdapter;

// ============================================================================
// Adapter Registration
// ============================================================================

let currentAdapter: FileAcquisitionAdapter | null = null;

/**
 * Set the file acquisition adapter to use
 */
export function setFileAcquisitionAdapter(
  adapter: FileAcquisitionAdapter,
): void {
  currentAdapter = adapter;
}

/**
 * Get the current file acquisition adapter
 * @throws Error if no adapter has been set
 */
export function getFileAcquisitionAdapter(): FileAcquisitionAdapter {
  if (!currentAdapter) {
    throw new Error(
      "No FileAcquisitionAdapter has been set. " +
        "Call setFileAcquisitionAdapter() during app initialization.",
    );
  }
  return currentAdapter;
}

/**
 * Check if an adapter has been registered
 */
export function hasFileAcquisitionAdapter(): boolean {
  return currentAdapter !== null;
}
