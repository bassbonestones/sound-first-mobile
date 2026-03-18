/**
 * File Acquisition Service
 *
 * Handles acquiring files from various sources:
 * - Camera (taking photos)
 * - Image library (selecting existing images)
 * - Document picker (PDFs, MusicXML, MXL)
 *
 * All acquisition methods return a normalized LocalImportAsset.
 *
 * This module delegates to a FileAcquisitionAdapter for platform-specific
 * implementation. By default, it uses the ExpoFileAcquisitionAdapter.
 *
 * REQUIRED PACKAGES (install via npx expo install):
 * - expo-image-picker
 * - expo-document-picker
 * - expo-file-system
 */

import {
  type FileAcquisitionAdapter,
  type AcquisitionResult as AdapterAcquisitionResult,
  setFileAcquisitionAdapter,
  getFileAcquisitionAdapter,
  hasFileAcquisitionAdapter,
} from "../adapters/fileAcquisitionAdapter";
import { getDefaultExpoAdapter } from "../adapters/expoFileAcquisitionAdapter";

// ============================================================================
// Types (re-exported from adapter for backward compatibility)
// ============================================================================

// Re-export from adapter
export type { AcquisitionResult } from "../adapters/fileAcquisitionAdapter";

/**
 * Options for camera capture
 */
export interface CameraAcquisitionOptions {
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
export interface ImageLibraryAcquisitionOptions {
  /** Allow editing after selection */
  readonly allowsEditing?: boolean;
  /** Image quality for compressed output (0-1) */
  readonly quality?: number;
}

/**
 * Options for document picker
 */
export interface DocumentAcquisitionOptions {
  /** Whether to copy the file to app's directory */
  readonly copyToPersistentStorage?: boolean;
}

// ============================================================================
// Adapter Initialization
// ============================================================================

/**
 * Ensure the adapter is initialized.
 * By default, initializes with the Expo adapter.
 */
function ensureAdapterInitialized(): FileAcquisitionAdapter {
  if (!hasFileAcquisitionAdapter()) {
    setFileAcquisitionAdapter(getDefaultExpoAdapter());
  }
  return getFileAcquisitionAdapter();
}

/**
 * Get the current adapter (initializing if needed)
 */
function getAdapter(): FileAcquisitionAdapter {
  return ensureAdapterInitialized();
}

// ============================================================================
// Camera Acquisition
// ============================================================================

/**
 * Request camera permission
 * @returns true if granted, false otherwise
 */
export async function requestCameraPermission(): Promise<boolean> {
  const result = await getAdapter().requestCameraPermission();
  return result.granted;
}

/**
 * Check camera permission status without prompting
 */
export async function checkCameraPermission(): Promise<boolean> {
  const result = await getAdapter().checkCameraPermission();
  return result.granted;
}

/**
 * Acquire an image by taking a photo with the camera
 */
export async function acquireFromCamera(
  options: CameraAcquisitionOptions = {},
): Promise<AdapterAcquisitionResult> {
  return getAdapter().acquireFromCamera({
    cameraType: options.cameraType,
    allowsEditing: options.allowsEditing,
    quality: options.quality,
  });
}

// ============================================================================
// Image Library Acquisition
// ============================================================================

/**
 * Request media library permission
 * @returns true if granted, false otherwise
 */
export async function requestMediaLibraryPermission(): Promise<boolean> {
  const result = await getAdapter().requestMediaLibraryPermission();
  return result.granted;
}

/**
 * Check media library permission status without prompting
 */
export async function checkMediaLibraryPermission(): Promise<boolean> {
  const result = await getAdapter().checkMediaLibraryPermission();
  return result.granted;
}

/**
 * Acquire an image from the device's image library
 */
export async function acquireFromImageLibrary(
  options: ImageLibraryAcquisitionOptions = {},
): Promise<AdapterAcquisitionResult> {
  return getAdapter().acquireFromImageLibrary({
    allowsEditing: options.allowsEditing,
    quality: options.quality,
  });
}

// ============================================================================
// Document Picker - PDF
// ============================================================================

/**
 * Acquire a PDF document
 */
export async function acquirePdf(
  options: DocumentAcquisitionOptions = {},
): Promise<AdapterAcquisitionResult> {
  return getAdapter().acquireFromDocuments({
    documentType: "pdf",
    copyToCache: options.copyToPersistentStorage ?? true,
  });
}

// ============================================================================
// Document Picker - MusicXML / MXL
// ============================================================================

/**
 * Acquire a MusicXML or MXL file
 */
export async function acquireMusicXml(
  options: DocumentAcquisitionOptions = {},
): Promise<AdapterAcquisitionResult> {
  return getAdapter().acquireFromDocuments({
    documentType: "musicxml",
    copyToCache: options.copyToPersistentStorage ?? true,
  });
}

// ============================================================================
// File Content Reading
// ============================================================================

/**
 * Read file content as string (for text-based files like MusicXML)
 */
export async function readFileAsString(uri: string): Promise<string> {
  return getAdapter().readFileAsString(uri);
}

/**
 * Read file content as base64 (for binary files)
 */
export async function readFileAsBase64(uri: string): Promise<string> {
  return getAdapter().readFileAsBase64(uri);
}

/**
 * Get file info (size, exists, etc.)
 */
export async function getFileInfo(uri: string): Promise<{
  exists: boolean;
  size: number | null;
  modificationTime: number | null;
}> {
  const info = await getAdapter().getFileInfo(uri);
  return {
    exists: info.exists,
    size: info.size,
    modificationTime: null, // Not available in adapter interface
  };
}

/**
 * Copy file to a persistent location in the app's directory
 */
export async function copyToPersistentStorage(
  sourceUri: string,
  fileName: string,
): Promise<string> {
  return getAdapter().copyToPersistentStorage(sourceUri, fileName);
}

// ============================================================================
// Re-exports for backward compatibility
// ============================================================================

export {
  setFileAcquisitionAdapter,
  getFileAcquisitionAdapter,
  hasFileAcquisitionAdapter,
} from "../adapters/fileAcquisitionAdapter";

export type { FileAcquisitionAdapter } from "../adapters/fileAcquisitionAdapter";
