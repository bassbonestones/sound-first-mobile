/**
 * Import Services - Barrel Export
 */

// File acquisition
export {
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
  getFileInfo,
  copyToPersistentStorage,
  type AcquisitionResult,
  type CameraAcquisitionOptions,
  type ImageLibraryAcquisitionOptions,
  type DocumentAcquisitionOptions,
} from "./fileAcquisition";

// MusicXML parsing
export {
  parseMusicXml,
  parseMusicXmlFromAsset,
  extractMusicXmlMetadataQuick,
  type MusicXmlParseResult,
} from "./musicXmlParser";

// MXL handling
export {
  extractMxlContent,
  parseMxlFile,
  looksLikeMxl,
  isMxlExtension,
  type MxlExtractionResult,
} from "./mxlHandler";

// Upload service
export {
  uploadImportAsset,
  uploadWithProgress,
  type UploadProgressCallback,
} from "./uploadService";

// OMR service
export {
  submitOmrJob,
  getOmrJobStatus,
  pollOmrJobUntilComplete,
  normalizeOmrResult,
  preprocessImageForOmr,
  extractPdfPages,
} from "./omrService";

// Orchestrator
export {
  runImportPipeline,
  importMusicXmlFile,
  importImageForOmr,
  type StatusListener,
  type ImportOrchestratorOptions,
} from "./importOrchestrator";

// Backend contracts
export * from "./backendContracts";

// Share extension
export {
  handleSharedFile,
  parseShareUrl,
  copySharedFileToCache,
  createShareExtensionListener,
  cleanupSharedFilesCache,
  shareExtensionAssetToLocal,
  ShareExtensionError,
  type ShareExtensionAsset,
  type ShareExtensionConfig,
  type ShareUrlParseResult,
  type ShareExtensionErrorCode,
} from "./shareExtensionService";

// Score storage
export {
  saveScore,
  getScore,
  listScores,
  updateScore,
  deleteScore,
  deleteAllScores,
  getScoreCount,
  scoreExists,
  toggleFavorite,
  getFavoriteScores,
  generateScoreId,
  type ScoreStorageMetadata,
  type StoredScore,
  type StoredScoreSummary,
  type SaveScoreInput,
  type UpdateScoreInput,
  type StorageResult,
  type StorageError,
  type StorageErrorCode,
} from "./scoreStorageService";
