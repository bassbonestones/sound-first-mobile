/**
 * Import Music Types
 *
 * Re-exports all types specific to the import music feature.
 * These types are distinct from the app-wide types in src/types/import.ts.
 */

// Correction workflow types
export type {
  MeasureCorrectionStatus,
  CorrectionMeasure,
  CorrectionSession,
  CorrectionAction,
  MeasureEdit,
  CorrectionProgress,
  ConfidenceSeverity,
} from "./correctionTypes";

// Correction workflow utilities
export {
  getConfidenceSeverity,
  getConfidenceColor,
  formatConfidence,
} from "./correctionTypes";

// Navigation types
export type {
  ImportStackParamList,
  ImportMusicParams,
  ScoreViewerParams,
  ScoreViewerDirectParams,
  ScoreViewerFromStorageParams,
  ScoreCorrectionParams,
  MyScoresParams,
  ImportedScorePracticeParams,
  ImportMusicScreenProps as TypedImportMusicScreenProps,
  ScoreViewerScreenProps as TypedScoreViewerScreenProps,
  ScoreCorrectionScreenProps as TypedScoreCorrectionScreenProps,
  MyScoresScreenProps as TypedMyScoresScreenProps,
  ImportedScorePracticeScreenProps as TypedImportedScorePracticeScreenProps,
} from "./importNavigationTypes";

export {
  isDirectScoreParams,
  isStorageScoreParams,
} from "./importNavigationTypes";

// Analysis types
export type {
  CapabilityAnalysisResult,
  CapabilityAnalysisRequest,
  RangeAnalysis,
  PitchDensity,
  TempoProfile,
  SoftGateScores,
  UnifiedScores,
  DetailedExtraction,
} from "./analysisTypes";

export { DOMAIN_DISPLAY_INFO } from "./analysisTypes";

// Practice types
export type {
  NotePerformance,
  PracticeSessionStats,
  CurrentNoteTarget,
  PitchMatchState,
  PracticeSessionResult,
} from "./practiceTypes";

export {
  midiToNoteName,
  noteNameToMidi,
  midiToFrequency,
  calculateCents,
  isPitchMatch,
  createEmptyStats,
  calculateStats,
} from "./practiceTypes";

// OMR Provider types
export type {
  OmrProviderType,
  OmrRawOutput,
  MockOmrRawOutput,
  BackendOmrRawOutput,
  AudiverisOmrRawOutput,
  UnknownOmrRawOutput,
  OmrProgressCallback,
  OmrCancellationToken,
  OmrProviderConfig,
  TypedOmrJobResult,
  OmrProvider,
} from "./omrProviderTypes";

export {
  registerOmrProvider,
  getOmrProvider,
  getActiveOmrProvider,
  listOmrProviders,
  normalizeProgress,
} from "./omrProviderTypes";
