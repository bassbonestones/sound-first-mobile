/**
 * Import Music Feature - Main Export
 *
 * This is the public API for the import music feature.
 * Import from this file to use the feature in other parts of the app.
 *
 * @example
 * ```tsx
 * // Screen
 * import { ImportMusicScreen } from '../features/importMusic';
 *
 * // Hook
 * import { useImportMusic } from '../features/importMusic';
 *
 * // Components
 * import { ImportPreview, ImportActionList } from '../features/importMusic';
 * ```
 */

// ============================================================================
// Screens
// ============================================================================

export {
  ImportMusicScreen,
  ScoreCorrectionScreen,
  ScoreViewerScreen,
  MyScoresScreen,
  ImportedScorePracticeScreen,
} from "./screens";
export type {
  ImportMusicScreenProps,
  ScoreCorrectionScreenProps,
  ScoreCorrectionParams,
  ScoreViewerScreenProps,
  ScoreViewerParams,
  MyScoresScreenProps,
  ImportedScorePracticeScreenProps,
  ImportedScorePracticeParams,
} from "./screens";

// ============================================================================
// Hooks
// ============================================================================

export { useImportMusic, useImportPermissions } from "./hooks";
export type {
  ImportMusicState,
  ImportMusicActions,
  UseImportMusicReturn,
} from "./hooks";

// ============================================================================
// Components
// ============================================================================

export {
  ImportActionList,
  ImportProgressIndicator,
  ImportPreview,
  ImportErrorDisplay,
  createDefaultImportActions,
} from "./components";
export type {
  ImportAction,
  ImportActionListProps,
  ImportProgressIndicatorProps,
  ImportPreviewProps,
  ImportErrorDisplayProps,
} from "./components";

// ============================================================================
// Services (for advanced use cases)
// ============================================================================

export {
  // File acquisition
  acquireFromCamera,
  acquireFromImageLibrary,
  acquirePdf,
  acquireMusicXml,
  requestCameraPermission,
  requestMediaLibraryPermission,
  checkCameraPermission,
  checkMediaLibraryPermission,
  readFileAsString,
  readFileAsBase64,

  // Parsing
  parseMusicXml,
  extractMusicXmlMetadataQuick,

  // Orchestrator
  runImportPipeline,
  importMusicXmlFile,
  importImageForOmr,
} from "./services";

export type {
  AcquisitionResult,
  CameraAcquisitionOptions,
  ImageLibraryAcquisitionOptions,
  DocumentAcquisitionOptions,
  MusicXmlParseResult,
  StatusListener,
  ImportOrchestratorOptions,
} from "./services";

// ============================================================================
// Utils (for advanced use cases)
// ============================================================================

export {
  validateImportAsset,
  getFileExtension,
  isExtensionSupported,
  inferSourceTypeFromExtension,
  looksLikeMusicXml,
  validateMusicXmlContent,
  formatFileSize,
} from "./utils";

export {
  createErrorFromCode,
  mapNativeError,
  formatErrorForUser,
  isRecoverableError,
} from "./utils";

export type {
  AssetValidationResult,
  MusicXmlValidationResult,
  FormattedUserError,
} from "./utils";
