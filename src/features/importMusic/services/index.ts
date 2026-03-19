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

// Background OMR task
export {
  defineBackgroundOmrTask,
  startBackgroundOmrTask,
  stopBackgroundOmrTask,
  checkPendingBackgroundOmrTask,
  isBackgroundTaskSupported,
  type BackgroundOmrTaskState,
  type BackgroundOmrTaskResult,
  type BackgroundOmrTaskOptions,
} from "./backgroundOmrTask";

// Import checkpoints (resume support)
export {
  generateCheckpointId,
  createCheckpoint,
  updateCheckpoint,
  completeCheckpoint,
  removeCheckpoint,
  getCheckpoint,
  getActiveCheckpoints,
  getCheckpointSummaries,
  isCheckpointStale,
  cleanupStaleCheckpoints,
  clearAllCheckpoints,
  analyzeCheckpointForResume,
  getPendingImports,
  type ImportCheckpoint,
  type CheckpointStage,
  type CheckpointSummary,
  type ResumeContext,
} from "./importCheckpoint";

// Multi-page PDF processing
export {
  uploadPdfForProcessing,
  submitPdfForOmr,
  getPdfOmrStatus,
  getPdfOmrResult,
  processPdfForOmr,
  estimatePdfPageCount,
  validatePdfForImport,
  type PdfPageInfo,
  type PdfUploadResponse,
  type PdfOmrStatus,
  type PageOmrStatus,
  type PdfOmrResult,
  type PageOmrResult,
  type UncertainMeasure,
  type PdfProgressCallback,
  type ProcessPdfOptions,
} from "./pdfProcessingService";

// Capability analysis
export {
  analyzeCapabilities,
  analyzeCapabilitiesMock,
  getMockAnalysisResult,
  type AnalysisResult,
  type AnalysisServiceResult,
  type AnalysisServiceError,
} from "./capabilityAnalysisService";

// Import analytics
export {
  importAnalyticsService,
  type ImportAnalyticsEvent,
  type ImportEventType,
  type FunnelMetrics,
} from "./importAnalyticsService";

// Offline queue
export {
  offlineQueueService,
  type QueuedImport,
  type ImportHandler,
  type QueueStatus,
} from "./offlineQueueService";
