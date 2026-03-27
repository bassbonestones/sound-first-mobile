/**
 * Expo File Acquisition Adapter
 *
 * Implementation of FileAcquisitionAdapter using Expo SDK APIs:
 * - expo-image-picker for camera and image library
 * - expo-document-picker for documents
 * - expo-file-system for file operations
 */

import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

import { devLog, devError } from "../../../utils/devLogger";
import type {
  FileAcquisitionAdapter,
  AcquisitionResult,
  PermissionResult,
  CameraOptions,
  ImageLibraryOptions,
  DocumentPickerOptions,
} from "./fileAcquisitionAdapter";
import type { ImportSourceType, LocalImportAsset } from "../../../types/import";
import {
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
} from "../../../constants/import";
import {
  createPermissionError,
  createCanceledError,
  createErrorFromCode,
  mapNativeError,
} from "../utils/errors";
import {
  getFileExtension,
  inferSourceTypeFromExtension,
} from "../utils/validation";

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a unique ID for an import asset
 */
function generateAssetId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `import_${timestamp}_${random}`;
}

// ============================================================================
// MIME Type Inference
// ============================================================================

/**
 * Infer MIME type from file extension
 */
function inferMimeTypeFromExtension(extension: string): string | null {
  const ext = extension.toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".heic":
      return "image/heic";
    case ".heif":
      return "image/heif";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".pdf":
      return "application/pdf";
    case ".musicxml":
    case ".xml":
      return "application/vnd.recordare.musicxml+xml";
    case ".mxl":
      return "application/vnd.recordare.musicxml";
    default:
      return null;
  }
}

/**
 * Infer MIME type from URI extension
 */
function inferMimeTypeFromUri(uri: string): string | null {
  const extension = getFileExtension(uri);
  return inferMimeTypeFromExtension(extension);
}

/**
 * Extract filename from a URI
 */
function extractFileNameFromUri(uri: string): string {
  const parts = uri.split("/");
  const lastPart = parts[parts.length - 1];
  // Remove query params if present
  const fileName = lastPart.split("?")[0];
  return decodeURIComponent(fileName) || `file_${Date.now()}`;
}

// ============================================================================
// MIME Types for Document Picker
// ============================================================================

/**
 * MIME types for MusicXML document picker
 * Note: Many systems don't recognize MusicXML MIME types,
 * so we also include generic XML and ZIP
 */
const MUSICXML_DOCUMENT_TYPES = [
  "application/vnd.recordare.musicxml+xml",
  "application/vnd.recordare.musicxml",
  "application/xml",
  "text/xml",
  "application/zip",
  "application/x-zip-compressed",
  // Fallback for systems that don't recognize the above
  "*/*",
];

// ============================================================================
// Expo Adapter Implementation
// ============================================================================

/**
 * Expo-based implementation of the FileAcquisitionAdapter
 */
export class ExpoFileAcquisitionAdapter implements FileAcquisitionAdapter {
  readonly adapterId = "expo";

  // ---------------------------------------------------------------------------
  // Permission Management
  // ---------------------------------------------------------------------------

  async checkCameraPermission(): Promise<PermissionResult> {
    const result = await ImagePicker.getCameraPermissionsAsync();
    return {
      granted: result.status === "granted",
      canAskAgain: result.canAskAgain ?? true,
    };
  }

  async requestCameraPermission(): Promise<PermissionResult> {
    const result = await ImagePicker.requestCameraPermissionsAsync();
    return {
      granted: result.status === "granted",
      canAskAgain: result.canAskAgain ?? false,
    };
  }

  async checkMediaLibraryPermission(): Promise<PermissionResult> {
    const result = await ImagePicker.getMediaLibraryPermissionsAsync();
    return {
      granted: result.status === "granted",
      canAskAgain: result.canAskAgain ?? true,
    };
  }

  async requestMediaLibraryPermission(): Promise<PermissionResult> {
    const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return {
      granted: result.status === "granted",
      canAskAgain: result.canAskAgain ?? false,
    };
  }

  // ---------------------------------------------------------------------------
  // Camera Acquisition
  // ---------------------------------------------------------------------------

  async acquireFromCamera(
    options: CameraOptions = {},
  ): Promise<AcquisitionResult> {
    try {
      // Request permission first
      const permission = await this.requestCameraPermission();
      if (!permission.granted) {
        return {
          success: false,
          asset: null,
          error: createPermissionError("camera"),
        };
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: options.allowsEditing ?? false,
        quality: options.quality ?? 0.9,
        cameraType:
          options.cameraType === "front"
            ? ImagePicker.CameraType.front
            : ImagePicker.CameraType.back,
        exif: true,
      });

      // Handle cancellation
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return {
          success: false,
          asset: null,
          error: createCanceledError(),
        };
      }

      const imageAsset = result.assets[0];

      // Get file info for size
      const fileInfo = await FileSystem.getInfoAsync(imageAsset.uri);
      const fileSize =
        fileInfo.exists && "size" in fileInfo ? fileInfo.size : null;

      // Create normalized asset
      const asset: LocalImportAsset = {
        id: generateAssetId(),
        uri: imageAsset.uri,
        mimeType: imageAsset.mimeType ?? "image/jpeg",
        fileName: imageAsset.fileName ?? `photo_${Date.now()}.jpg`,
        fileSize,
        sourceType: "photo",
        acquiredAt: Date.now(),
      };

      return {
        success: true,
        asset,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        asset: null,
        error: mapNativeError(error),
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Image Library Acquisition
  // ---------------------------------------------------------------------------

  async acquireFromImageLibrary(
    options: ImageLibraryOptions = {},
  ): Promise<AcquisitionResult> {
    try {
      // Request permission first
      const permission = await this.requestMediaLibraryPermission();
      if (!permission.granted) {
        return {
          success: false,
          asset: null,
          error: createPermissionError("media_library"),
        };
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: options.allowsEditing ?? false,
        quality: options.quality ?? 1.0,
        exif: true,
        allowsMultipleSelection: options.allowMultiple ?? false,
      });

      // Handle cancellation
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return {
          success: false,
          asset: null,
          error: createCanceledError(),
        };
      }

      const imageAsset = result.assets[0];

      // Get file info for size
      const fileInfo = await FileSystem.getInfoAsync(imageAsset.uri);
      const fileSize =
        fileInfo.exists && "size" in fileInfo ? fileInfo.size : null;

      // Create normalized asset
      const asset: LocalImportAsset = {
        id: generateAssetId(),
        uri: imageAsset.uri,
        mimeType: imageAsset.mimeType ?? inferMimeTypeFromUri(imageAsset.uri),
        fileName: imageAsset.fileName ?? extractFileNameFromUri(imageAsset.uri),
        fileSize,
        sourceType: "image",
        acquiredAt: Date.now(),
      };

      return {
        success: true,
        asset,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        asset: null,
        error: mapNativeError(error),
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Document Picker
  // ---------------------------------------------------------------------------

  async acquireFromDocuments(
    options: DocumentPickerOptions,
  ): Promise<AcquisitionResult> {
    try {
      // Determine MIME types based on document type
      let documentTypes: string[];
      switch (options.documentType) {
        case "pdf":
          documentTypes = ALLOWED_MIME_TYPES.pdf as unknown as string[];
          break;
        case "musicxml":
          // Use platform-specific handling for MusicXML
          documentTypes =
            Platform.OS === "ios" ? MUSICXML_DOCUMENT_TYPES : ["*/*"];
          break;
        case "any":
        default:
          documentTypes = ["*/*"];
          break;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: documentTypes,
        copyToCacheDirectory: options.copyToCache ?? true,
        multiple: false,
      });

      devLog(
        "[ExpoAdapter] DocumentPicker result:",
        JSON.stringify(result, null, 2),
      );

      // Handle cancellation
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return {
          success: false,
          asset: null,
          error: createCanceledError(),
        };
      }

      const docAsset = result.assets[0];
      devLog(
        "[ExpoAdapter] Selected document:",
        docAsset.name,
        "uri:",
        docAsset.uri,
      );
      const extension = getFileExtension(docAsset.name);

      // Validate and determine source type based on document type option
      if (options.documentType === "pdf") {
        if (extension !== ".pdf") {
          return {
            success: false,
            asset: null,
            error: createErrorFromCode("unsupported_type", {
              expected: "pdf",
              got: extension,
            }),
          };
        }

        return {
          success: true,
          asset: {
            id: generateAssetId(),
            uri: docAsset.uri,
            mimeType: docAsset.mimeType ?? "application/pdf",
            fileName: docAsset.name,
            fileSize: docAsset.size ?? null,
            sourceType: "pdf",
            acquiredAt: Date.now(),
          },
          error: null,
        };
      }

      if (options.documentType === "musicxml") {
        const inferredType = inferSourceTypeFromExtension(extension);

        // Validate it's MusicXML or MXL
        if (inferredType !== "musicxml" && inferredType !== "mxl") {
          const validExtensions = [
            ...ALLOWED_EXTENSIONS.musicxml,
            ...ALLOWED_EXTENSIONS.mxl,
          ];
          if (!validExtensions.includes(extension)) {
            return {
              success: false,
              asset: null,
              error: createErrorFromCode("unsupported_type", {
                expected: "musicxml or mxl",
                got: extension,
                fileName: docAsset.name,
              }),
            };
          }
        }

        const sourceType: ImportSourceType =
          inferredType === "mxl" ? "mxl" : "musicxml";

        return {
          success: true,
          asset: {
            id: generateAssetId(),
            uri: docAsset.uri,
            mimeType:
              docAsset.mimeType ?? inferMimeTypeFromExtension(extension),
            fileName: docAsset.name,
            fileSize: docAsset.size ?? null,
            sourceType,
            acquiredAt: Date.now(),
          },
          error: null,
        };
      }

      // For "any" document type, infer the source type
      const inferredType = inferSourceTypeFromExtension(extension);
      const sourceType: ImportSourceType = inferredType ?? "image";

      return {
        success: true,
        asset: {
          id: generateAssetId(),
          uri: docAsset.uri,
          mimeType: docAsset.mimeType ?? inferMimeTypeFromExtension(extension),
          fileName: docAsset.name,
          fileSize: docAsset.size ?? null,
          sourceType,
          acquiredAt: Date.now(),
        },
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        asset: null,
        error: mapNativeError(error),
      };
    }
  }

  // ---------------------------------------------------------------------------
  // File Operations
  // ---------------------------------------------------------------------------

  async readFileAsString(uri: string): Promise<string> {
    try {
      devLog(
        "[ExpoAdapter] readFileAsString uri:",
        uri,
        "platform:",
        Platform.OS,
      );

      // On web, blob URLs need to be fetched
      if (
        Platform.OS === "web" &&
        (uri.startsWith("blob:") || uri.startsWith("data:"))
      ) {
        devLog("[ExpoAdapter] Using fetch for web blob/data URL");
        const response = await fetch(uri);
        const text = await response.text();
        devLog("[ExpoAdapter] Web fetch success, length:", text.length);
        return text;
      }

      const content = await FileSystem.readAsStringAsync(uri, {
        encoding: "utf8",
      });
      devLog("[ExpoAdapter] readFileAsString success, length:", content.length);
      return content;
    } catch (error) {
      devError("[ExpoAdapter] readFileAsString failed:", error);

      // Fallback for web: try fetch if FileSystem fails
      if (Platform.OS === "web") {
        try {
          devLog("[ExpoAdapter] Trying fetch fallback for web");
          const response = await fetch(uri);
          const text = await response.text();
          devLog(
            "[ExpoAdapter] Web fetch fallback success, length:",
            text.length,
          );
          return text;
        } catch (fetchError) {
          devError("[ExpoAdapter] Web fetch fallback also failed:", fetchError);
          throw new Error(
            `Failed to read file on web: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
          );
        }
      }

      throw new Error(
        `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async readFileAsBase64(uri: string): Promise<string> {
    try {
      // On web, blob URLs need to be fetched and converted to base64
      if (
        Platform.OS === "web" &&
        (uri.startsWith("blob:") || uri.startsWith("data:"))
      ) {
        devLog("[ExpoAdapter] Using fetch for web blob/data URL (base64)");
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            // Remove the data URL prefix to get just the base64 content
            const base64 = dataUrl.split(",")[1] || "";
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      const content = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });
      return content;
    } catch (error) {
      // Fallback for web: try fetch if FileSystem fails
      if (Platform.OS === "web") {
        try {
          devLog(
            "[ExpoAdapter] FileSystem failed, trying fetch fallback (base64)",
          );
          const response = await fetch(uri);
          const blob = await response.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const dataUrl = reader.result as string;
              const base64 = dataUrl.split(",")[1] || "";
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (fetchError) {
          devError(
            "[ExpoAdapter] Web fetch fallback also failed (base64):",
            fetchError,
          );
          throw new Error(
            `Failed to read file as base64 on web: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
          );
        }
      }

      throw new Error(
        `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getFileInfo(uri: string): Promise<{
    exists: boolean;
    size: number | null;
    isDirectory: boolean;
  }> {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists) {
        return { exists: false, size: null, isDirectory: false };
      }
      return {
        exists: true,
        size: "size" in info ? info.size : null,
        isDirectory: "isDirectory" in info ? info.isDirectory : false,
      };
    } catch {
      return { exists: false, size: null, isDirectory: false };
    }
  }

  async copyToPersistentStorage(
    sourceUri: string,
    destinationName: string,
  ): Promise<string> {
    const destDir = `${FileSystem.documentDirectory}imports/`;

    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(destDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
    }

    const destUri = `${destDir}${destinationName}`;
    await FileSystem.copyAsync({ from: sourceUri, to: destUri });

    return destUri;
  }

  async deleteFile(uri: string): Promise<void> {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}

// ============================================================================
// Factory & Default Instance
// ============================================================================

/**
 * Create a new ExpoFileAcquisitionAdapter instance
 */
export function createExpoFileAcquisitionAdapter(): ExpoFileAcquisitionAdapter {
  return new ExpoFileAcquisitionAdapter();
}

/**
 * Default singleton instance for convenience
 */
let defaultInstance: ExpoFileAcquisitionAdapter | null = null;

/**
 * Get the default ExpoFileAcquisitionAdapter instance
 */
export function getDefaultExpoAdapter(): ExpoFileAcquisitionAdapter {
  if (!defaultInstance) {
    defaultInstance = new ExpoFileAcquisitionAdapter();
  }
  return defaultInstance;
}
