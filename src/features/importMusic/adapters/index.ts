/**
 * File Acquisition Adapters
 *
 * Export all adapter-related types and implementations.
 */

// Core interface and types
export type {
  FileAcquisitionAdapter,
  AcquisitionResult,
  PermissionResult,
  CameraOptions,
  ImageLibraryOptions,
  DocumentPickerOptions,
  PlatformFileMetadata,
  FileAcquisitionAdapterFactory,
} from "./fileAcquisitionAdapter";

export {
  setFileAcquisitionAdapter,
  getFileAcquisitionAdapter,
  hasFileAcquisitionAdapter,
} from "./fileAcquisitionAdapter";

// Expo implementation
export {
  ExpoFileAcquisitionAdapter,
  createExpoFileAcquisitionAdapter,
  getDefaultExpoAdapter,
} from "./expoFileAcquisitionAdapter";
