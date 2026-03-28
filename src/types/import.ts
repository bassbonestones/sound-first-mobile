/**
 * Import Domain Types
 *
 * Core type definitions for the music import pipeline.
 * Supports multiple input sources (photo, image, PDF, MusicXML, MXL)
 * and unified output through the ImportedScore model.
 */

// ============================================================================
// Import Source Types
// ============================================================================

/**
 * Discriminated union of all supported import source types
 */
export type ImportSourceType = "photo" | "image" | "pdf" | "musicxml" | "mxl";

/**
 * Category groupings for import source types
 */
export type ImportSourceCategory = "direct_parse" | "requires_omr";

/**
 * Maps source types to their processing category
 */
export const IMPORT_SOURCE_CATEGORIES: Record<
  ImportSourceType,
  ImportSourceCategory
> = {
  musicxml: "direct_parse",
  mxl: "direct_parse",
  photo: "requires_omr",
  image: "requires_omr",
  pdf: "requires_omr",
};

// ============================================================================
// Local Import Asset
// ============================================================================

/**
 * Represents a file selected locally on the device before processing
 */
export interface LocalImportAsset {
  /** Unique identifier for this asset */
  readonly id: string;
  /** Local file URI (file:// or content://) */
  readonly uri: string;
  /** MIME type if available */
  readonly mimeType: string | null;
  /** Original filename */
  readonly fileName: string;
  /** File size in bytes, if available */
  readonly fileSize: number | null;
  /** How this file was acquired */
  readonly sourceType: ImportSourceType;
  /** Timestamp when asset was acquired */
  readonly acquiredAt: number;
  /** Base64 data if loaded into memory (for smaller files) */
  readonly base64Data?: string;
}

// ============================================================================
// Upload & Remote Processing
// ============================================================================

/**
 * Result of uploading an asset to the backend
 */
export interface RemoteUploadResult {
  /** Whether upload succeeded */
  readonly success: boolean;
  /** Remote asset ID assigned by backend */
  readonly remoteAssetId: string | null;
  /** Signed URL for the uploaded asset (if applicable) */
  readonly remoteUrl: string | null;
  /** Upload timestamp from server */
  readonly uploadedAt: number | null;
  /** Error if upload failed */
  readonly error: ImportError | null;
}

// ============================================================================
// Import Job Status
// ============================================================================

/**
 * All possible states in the import pipeline
 */
export type ImportJobStatusType =
  | "idle"
  | "acquiring"
  | "validating"
  | "uploading"
  | "parsing"
  | "omr_processing"
  | "omr_polling"
  | "normalizing"
  | "succeeded"
  | "failed"
  | "canceled";

/**
 * Status object for tracking import job progress
 */
export interface ImportJobStatus {
  /** Current status type */
  readonly status: ImportJobStatusType;
  /** Human-readable status message */
  readonly message: string;
  /** Progress percentage (0-100) if calculable */
  readonly progress: number | null;
  /** Timestamp of last status change */
  readonly updatedAt: number;
  /** OMR job ID if waiting on OMR processing */
  readonly omrJobId: string | null;
}

// ============================================================================
// Pipeline Input & Result
// ============================================================================

/**
 * Input to the import pipeline
 */
export interface ImportPipelineInput {
  /** The local asset to process */
  readonly asset: LocalImportAsset;
  /** Optional user-provided metadata hints */
  readonly hints?: ImportMetadataHints;
}

/**
 * User-provided hints to assist parsing/OMR
 */
export interface ImportMetadataHints {
  readonly title?: string;
  readonly composer?: string;
  readonly instrument?: string;
}

/**
 * Result of a completed import pipeline run
 */
export interface ImportPipelineResult {
  /** Whether the import succeeded */
  readonly success: boolean;
  /** The imported score if successful */
  readonly score: ImportedScore | null;
  /** Preview model for UI display */
  readonly preview: ImportPreviewModel | null;
  /** Raw MusicXML content for rendering (null if from OMR without MusicXML output) */
  readonly rawMusicXml: string | null;
  /** Error details if failed */
  readonly error: ImportError | null;
  /** Validation issues (may exist even on success) */
  readonly validationIssues: ImportValidationIssue[];
  /** Pipeline execution metrics */
  readonly metrics: ImportPipelineMetrics;
}

/**
 * Metrics about pipeline execution
 */
export interface ImportPipelineMetrics {
  readonly startedAt: number;
  readonly completedAt: number;
  readonly durationMs: number;
  readonly sourceType: ImportSourceType;
  readonly fileSizeBytes: number | null;
}

// ============================================================================
// OMR Types
// ============================================================================

/**
 * Request to submit a job to the OMR service
 */
export interface OmrJobRequest {
  /** Remote asset ID (from upload) */
  readonly remoteAssetId: string;
  /** Source type for processing hints */
  readonly sourceType: ImportSourceType;
  /** Processing options */
  readonly options?: OmrProcessingOptions;
}

/**
 * Options for OMR processing
 */
export interface OmrProcessingOptions {
  /** Hint about expected instrument */
  readonly instrumentHint?: string;
  /** Whether to attempt perspective correction */
  readonly perspectiveCorrection?: boolean;
  /** Expected page count (for multi-page PDFs) */
  readonly expectedPageCount?: number;
}

/**
 * Response from submitting an OMR job
 */
export interface OmrJobSubmitResponse {
  readonly success: boolean;
  readonly jobId: string | null;
  readonly estimatedDurationMs: number | null;
  readonly error: ImportError | null;
}

/**
 * Status response for an OMR job
 */
export interface OmrJobStatusResponse {
  readonly jobId: string;
  readonly status: OmrJobStatusType;
  readonly progress: number | null;
  readonly result: OmrJobResult | null;
  readonly error: ImportError | null;
}

/**
 * OMR job status types
 */
export type OmrJobStatusType =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "timeout";

/**
 * Result from a completed OMR job
 */
export interface OmrJobResult {
  /** Raw OMR output (format depends on provider) */
  readonly rawOutput: unknown;
  /** Confidence score (0-1) */
  readonly confidence: number;
  /** Measures with low confidence flagged for review */
  readonly uncertainMeasures: UncertainMeasure[];
  /** Generated MusicXML if available */
  readonly musicXml: string | null;
}

/**
 * A measure flagged as uncertain by OMR
 */
export interface UncertainMeasure {
  readonly measureNumber: number;
  readonly partIndex: number;
  readonly confidence: number;
  readonly reason: string;
}

// ============================================================================
// Imported Score Model
// ============================================================================

/**
 * The normalized imported score - the unified output format
 * for all import paths
 */
export interface ImportedScore {
  /** Unique identifier */
  readonly id: string;
  /** Score metadata */
  readonly metadata: ImportedMetadata;
  /** Parts in the score */
  readonly parts: ImportedPart[];
  /** Total measure count */
  readonly measureCount: number;
  /** Original source information */
  readonly sourceInfo: ImportSourceInfo;
  /** Confidence information (from OMR) */
  readonly confidence: ScoreConfidence | null;
}

/**
 * Metadata extracted from the score
 */
export interface ImportedMetadata {
  readonly title: string | null;
  readonly composer: string | null;
  readonly arranger: string | null;
  readonly movementTitle: string | null;
  readonly workTitle: string | null;
  readonly copyright: string | null;
  /** Key signatures found (first occurrence) */
  readonly keySignature: KeySignatureInfo | null;
  /** Time signatures found (first occurrence) */
  readonly timeSignature: TimeSignatureInfo | null;
  /** Tempo marking if found */
  readonly tempo: TempoInfo | null;
}

/**
 * Key signature information
 */
export interface KeySignatureInfo {
  /** Number of fifths (-7 to 7), negative = flats, positive = sharps */
  readonly fifths: number;
  /** Major or minor mode */
  readonly mode: "major" | "minor" | null;
  /** Human-readable name (e.g., "C Major", "A Minor") */
  readonly displayName: string;
}

/**
 * Time signature information
 */
export interface TimeSignatureInfo {
  readonly beats: number;
  readonly beatType: number;
  /** Human-readable (e.g., "4/4", "3/4") */
  readonly displayName: string;
}

/**
 * Tempo information
 */
export interface TempoInfo {
  readonly bpm: number;
  readonly beatUnit: string;
  /** Text marking (e.g., "Allegro") */
  readonly marking: string | null;
}

/**
 * Information about the import source
 */
export interface ImportSourceInfo {
  readonly sourceType: ImportSourceType;
  readonly originalFileName: string;
  readonly importedAt: number;
  /** Remote asset ID if uploaded */
  readonly remoteAssetId: string | null;
}

/**
 * Confidence information for OMR-derived scores
 */
export interface ScoreConfidence {
  /** Overall confidence (0-1) */
  readonly overall: number;
  /** Per-measure confidence scores */
  readonly measureConfidence: number[];
  /** Measures that need review */
  readonly needsReview: boolean;
}

/**
 * A part in the score
 */
export interface ImportedPart {
  readonly id: string;
  readonly name: string | null;
  readonly abbreviation: string | null;
  readonly instrument: string | null;
  readonly measures: ImportedMeasure[];
}

/**
 * A measure in a part
 */
export interface ImportedMeasure {
  readonly number: number;
  readonly events: ImportedNoteEvent[];
  /** Time signature if changed in this measure */
  readonly timeSignature: TimeSignatureInfo | null;
  /** Key signature if changed in this measure */
  readonly keySignature: KeySignatureInfo | null;
  /** Confidence for this measure (OMR only) */
  readonly confidence: number | null;
  /** If true, this is a pickup (anacrusis) measure */
  readonly isPickup?: boolean;
}

/**
 * A note or rest event
 */
export interface ImportedNoteEvent {
  readonly type: "note" | "rest" | "chord";
  /** For notes: pitch info */
  readonly pitch: PitchInfo | null;
  /** For chords: array of pitches */
  readonly pitches: PitchInfo[] | null;
  /** Duration in divisions */
  readonly duration: number;
  /** Duration type name */
  readonly durationType: DurationType;
  /** Dots on the note */
  readonly dots: number;
  /** Articulations */
  readonly articulations: ArticulationType[];
  /** Dynamics marking */
  readonly dynamics: string | null;
  /** Is this tied to the next note? */
  readonly tiedToNext: boolean;
  /** Is this tied from the previous note? */
  readonly tiedFromPrevious: boolean;
  /** Lyric syllable attached to this note */
  readonly lyric: LyricInfo | null;
  /** Does this note start a slur? */
  readonly slurStart: boolean;
  /** Does this note end a slur? */
  readonly slurEnd: boolean;
  /** Slur placement (above or below the notes) */
  readonly slurPlacement?: "above" | "below";
  /** Expression text (e.g., "dolce", "espressivo") */
  readonly expression: string | null;
}

/**
 * Lyric information for a note
 */
export interface LyricInfo {
  /** The lyric text/syllable */
  readonly text: string;
  /** How this syllable relates to the word */
  readonly syllabic: "single" | "begin" | "middle" | "end";
  /** If true, this note continues a melisma (no new syllable) */
  readonly extend?: boolean;
}

/**
 * Pitch information
 */
export interface PitchInfo {
  readonly step: NoteLetter;
  readonly octave: number;
  readonly alter: number; // -1 = flat, 0 = natural, 1 = sharp
  /** Display name (e.g., "C4", "F#5") */
  readonly displayName: string;
}

export type NoteLetter = "C" | "D" | "E" | "F" | "G" | "A" | "B";

export type DurationType =
  | "whole"
  | "half"
  | "quarter"
  | "eighth"
  | "16th"
  | "32nd"
  | "64th"
  | "128th";

export type ArticulationType =
  | "staccato"
  | "accent"
  | "tenuto"
  | "marcato"
  | "fermata";

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error codes for import failures
 */
export type ImportErrorCode =
  // Permission & User Actions
  | "permission_denied"
  | "canceled_by_user"
  // File Validation
  | "unsupported_type"
  | "file_too_large"
  | "file_empty"
  | "file_corrupted"
  | "invalid_extension"
  // Parsing
  | "parse_failed"
  | "musicxml_invalid"
  | "mxl_extraction_failed"
  // Upload
  | "upload_failed"
  | "upload_timeout"
  | "network_error"
  // OMR
  | "omr_submission_failed"
  | "omr_processing_failed"
  | "omr_timeout"
  | "omr_low_confidence"
  // Normalization
  | "normalization_failed"
  // Generic
  | "unknown_error";

/**
 * Severity level for errors
 */
export type ImportErrorSeverity = "fatal" | "recoverable" | "warning";

/**
 * Import error with full context
 */
export interface ImportError {
  /** Error code for programmatic handling */
  readonly code: ImportErrorCode;
  /** Technical message for developers */
  readonly message: string;
  /** User-friendly message for display */
  readonly userMessage: string;
  /** Error severity */
  readonly severity: ImportErrorSeverity;
  /** Whether this error is recoverable */
  readonly recoverable: boolean;
  /** Suggested recovery action */
  readonly recoveryHint: string | null;
  /** Additional context for debugging */
  readonly context?: Record<string, unknown>;
  /** Original error if wrapped */
  readonly cause?: Error;
}

/**
 * Validation issue (not a fatal error)
 */
export interface ImportValidationIssue {
  /** Issue type */
  readonly type: ValidationIssueType;
  /** Human-readable description */
  readonly message: string;
  /** Severity */
  readonly severity: "error" | "warning" | "info";
  /** Location in the score if applicable */
  readonly location?: ValidationIssueLocation;
}

export type ValidationIssueType =
  | "missing_metadata"
  | "suspicious_measure"
  | "missing_time_signature"
  | "missing_key_signature"
  | "empty_part"
  | "duration_mismatch"
  | "low_confidence_region";

export interface ValidationIssueLocation {
  readonly measureNumber?: number;
  readonly partIndex?: number;
  readonly beatPosition?: number;
}

// ============================================================================
// Preview Model
// ============================================================================

/**
 * Preview model for displaying import results before full commitment
 */
export interface ImportPreviewModel {
  /** Score ID */
  readonly scoreId: string;
  /** Title for display */
  readonly title: string;
  /** Subtitle (composer, etc.) */
  readonly subtitle: string | null;
  /** Summary stats */
  readonly stats: ImportPreviewStats;
  /** Whether review is recommended */
  readonly needsReview: boolean;
  /** Review reasons if any */
  readonly reviewReasons: string[];
  /** Thumbnail image if available */
  readonly thumbnailUrl: string | null;
}

export interface ImportPreviewStats {
  readonly measureCount: number;
  readonly partCount: number;
  readonly pageCount: number | null;
  readonly timeSignature: string | null;
  readonly keySignature: string | null;
  readonly tempo: string | null;
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new import error with defaults
 */
export function createImportError(
  code: ImportErrorCode,
  message: string,
  userMessage: string,
  options: Partial<
    Pick<
      ImportError,
      "severity" | "recoverable" | "recoveryHint" | "context" | "cause"
    >
  > = {},
): ImportError {
  const defaults: Pick<
    ImportError,
    "severity" | "recoverable" | "recoveryHint"
  > = {
    severity: "fatal",
    recoverable: false,
    recoveryHint: null,
  };

  return {
    code,
    message,
    userMessage,
    ...defaults,
    ...options,
  };
}

/**
 * Create a default ImportJobStatus
 */
export function createInitialJobStatus(): ImportJobStatus {
  return {
    status: "idle",
    message: "Ready to import",
    progress: null,
    updatedAt: Date.now(),
    omrJobId: null,
  };
}

/**
 * Update a job status
 */
export function updateJobStatus(
  current: ImportJobStatus,
  updates: Partial<
    Pick<ImportJobStatus, "status" | "message" | "progress" | "omrJobId">
  >,
): ImportJobStatus {
  return {
    ...current,
    ...updates,
    updatedAt: Date.now(),
  };
}
