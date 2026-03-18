/**
 * Import Orchestrator
 *
 * Central coordinator for the entire import pipeline.
 * Routes assets through the appropriate processing path:
 * - MusicXML/MXL → Direct parse
 * - Photo/Image/PDF → Upload → OMR → Normalize
 *
 * Manages state transitions and error handling throughout the pipeline.
 */

import type {
  LocalImportAsset,
  ImportPipelineInput,
  ImportPipelineResult,
  ImportJobStatus,
  ImportJobStatusType,
  ImportedScore,
  ImportPreviewModel,
  ImportValidationIssue,
  ImportPipelineMetrics,
  ImportError,
  OmrJobRequest,
} from "../../../types/import";
import {
  createInitialJobStatus,
  updateJobStatus,
  createImportError,
  IMPORT_SOURCE_CATEGORIES,
} from "../../../types/import";
import { validateImportAsset } from "../utils/validation";
import { summarizeErrors, mapNativeError } from "../utils/errors";
import { readFileAsString } from "./fileAcquisition";
import { parseMusicXml, type MusicXmlParseResult } from "./musicXmlParser";
import { extractMxlContent } from "./mxlHandler";
import { uploadImportAsset } from "./uploadService";
import {
  submitOmrJob,
  pollOmrJobUntilComplete,
  normalizeOmrResult,
  preprocessImageForOmr,
} from "./omrService";

// ============================================================================
// Types
// ============================================================================

/**
 * Status listener callback
 */
export type StatusListener = (status: ImportJobStatus) => void;

/**
 * Options for the import orchestrator
 */
export interface ImportOrchestratorOptions {
  /** Callback for status updates */
  readonly onStatusChange?: StatusListener;
  /** Cancellation token for aborting the import */
  readonly cancellationToken?: { cancelled: boolean };
}

/**
 * Internal state for the orchestrator
 */
interface OrchestratorState {
  status: ImportJobStatus;
  startTime: number;
  asset: LocalImportAsset | null;
  errors: ImportError[];
  warnings: string[];
}

// ============================================================================
// Main Orchestrator Function
// ============================================================================

/**
 * Run the import pipeline for an asset
 *
 * This is the main entry point for importing music.
 * It determines the appropriate path based on source type
 * and coordinates all processing steps.
 *
 * @param input - Pipeline input with asset and optional hints
 * @param options - Orchestrator options
 * @returns Pipeline result with score or error
 */
export async function runImportPipeline(
  input: ImportPipelineInput,
  options: ImportOrchestratorOptions = {},
): Promise<ImportPipelineResult> {
  const state: OrchestratorState = {
    status: createInitialJobStatus(),
    startTime: Date.now(),
    asset: input.asset,
    errors: [],
    warnings: [],
  };

  const updateStatus = (
    statusType: ImportJobStatusType,
    message: string,
    progress: number | null = null,
    omrJobId: string | null = null,
  ) => {
    state.status = updateJobStatus(state.status, {
      status: statusType,
      message,
      progress,
      omrJobId,
    });
    options.onStatusChange?.(state.status);
  };

  try {
    // Check for cancellation
    if (options.cancellationToken?.cancelled) {
      return createCancelledResult(state);
    }

    // Step 1: Validate the asset
    updateStatus("validating", "Checking file...");
    const validationResult = validateImportAsset(input.asset);

    if (!validationResult.valid) {
      const primaryError = summarizeErrors(validationResult.errors);
      return createFailedResult(state, primaryError);
    }

    state.warnings.push(...validationResult.warnings);

    // Step 2: Determine processing path
    const category = IMPORT_SOURCE_CATEGORIES[input.asset.sourceType];

    if (category === "direct_parse") {
      // MusicXML / MXL path
      return await runDirectParsePath(
        input.asset,
        state,
        updateStatus,
        options,
      );
    } else {
      // OMR path (photo/image/PDF)
      return await runOmrPath(input.asset, state, updateStatus, options);
    }
  } catch (error) {
    const importError = mapNativeError(error);
    return createFailedResult(state, importError);
  }
}

// ============================================================================
// Direct Parse Path (MusicXML / MXL)
// ============================================================================

/**
 * Process MusicXML or MXL files directly without OMR
 */
async function runDirectParsePath(
  asset: LocalImportAsset,
  state: OrchestratorState,
  updateStatus: (
    status: ImportJobStatusType,
    message: string,
    progress?: number | null,
    omrJobId?: string | null,
  ) => void,
  options: ImportOrchestratorOptions,
): Promise<ImportPipelineResult> {
  updateStatus("parsing", "Reading music data...", 30);

  let parseResult: MusicXmlParseResult;
  let rawMusicXml: string | null = null;

  if (asset.sourceType === "mxl") {
    // Handle compressed MXL - extract first to capture raw content
    const extraction = await extractMxlContent(asset);
    if (!extraction.success || !extraction.musicXmlContent) {
      return createFailedResult(state, extraction.error ?? null);
    }
    rawMusicXml = extraction.musicXmlContent;
    parseResult = await parseMusicXml(rawMusicXml, {
      sourceType: asset.sourceType,
      originalFileName: asset.fileName,
      remoteAssetId: null,
    });
  } else {
    // Handle plain MusicXML
    try {
      console.log("[Orchestrator] Reading MusicXML from:", asset.uri);
      const content = await readFileAsString(asset.uri);
      console.log(
        "[Orchestrator] MusicXML content length:",
        content.length,
        "first 100 chars:",
        content.substring(0, 100),
      );
      rawMusicXml = content;
      parseResult = await parseMusicXml(content, {
        sourceType: asset.sourceType,
        originalFileName: asset.fileName,
        remoteAssetId: null,
      });
      console.log(
        "[Orchestrator] Parse result:",
        parseResult.success,
        parseResult.error?.code,
      );
    } catch (error) {
      console.error("[Orchestrator] Failed to read/parse MusicXML:", error);
      parseResult = {
        success: false,
        score: null,
        error: createImportError(
          "parse_failed",
          `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
          "We couldn't read the contents of this file.",
          { severity: "fatal", recoverable: false },
        ),
        warnings: [],
      };
    }
  }

  // Check for cancellation
  if (options.cancellationToken?.cancelled) {
    return createCancelledResult(state);
  }

  if (!parseResult.success || !parseResult.score) {
    updateStatus("failed", "Import failed");
    return createFailedResult(state, parseResult.error);
  }

  // Add parser warnings to state
  state.warnings.push(...parseResult.warnings);

  // Step 3: Normalize and create preview
  updateStatus("normalizing", "Preparing score...", 80);

  const preview = createPreviewFromScore(parseResult.score);
  const validationIssues = validateScore(parseResult.score);

  updateStatus("succeeded", "Import complete!", 100);

  return createSuccessResult(
    state,
    parseResult.score,
    preview,
    validationIssues,
    rawMusicXml,
  );
}

// ============================================================================
// OMR Path (Photo / Image / PDF)
// ============================================================================

/**
 * Process images/photos/PDFs through OMR
 */
async function runOmrPath(
  asset: LocalImportAsset,
  state: OrchestratorState,
  updateStatus: (
    status: ImportJobStatusType,
    message: string,
    progress?: number | null,
    omrJobId?: string | null,
  ) => void,
  options: ImportOrchestratorOptions,
): Promise<ImportPipelineResult> {
  // Step 1: Preprocess image (if applicable)
  updateStatus("validating", "Preparing image...", 10);

  const preprocessed = await preprocessImageForOmr(asset);

  // Check for cancellation
  if (options.cancellationToken?.cancelled) {
    return createCancelledResult(state);
  }

  // Step 2: Upload to backend
  updateStatus("uploading", "Uploading file...", 20);

  const uploadResult = await uploadImportAsset({
    ...asset,
    uri: preprocessed.uri,
  });

  if (!uploadResult.success || !uploadResult.remoteAssetId) {
    updateStatus("failed", "Upload failed");
    return createFailedResult(state, uploadResult.error);
  }

  // Check for cancellation
  if (options.cancellationToken?.cancelled) {
    return createCancelledResult(state);
  }

  // Step 3: Submit OMR job
  updateStatus("omr_processing", "Starting music recognition...", 40);

  const omrRequest: OmrJobRequest = {
    remoteAssetId: uploadResult.remoteAssetId,
    sourceType: asset.sourceType,
  };

  const submitResult = await submitOmrJob(omrRequest);

  if (!submitResult.success || !submitResult.jobId) {
    updateStatus("failed", "Recognition failed to start");
    return createFailedResult(state, submitResult.error);
  }

  // Step 4: Poll for OMR completion
  updateStatus("omr_polling", "Recognizing music...", 50, submitResult.jobId);

  const omrResult = await pollOmrJobUntilComplete(
    submitResult.jobId,
    (progress, status) => {
      const progressPercent = progress !== null ? 50 + progress * 0.4 : null;
      updateStatus(
        "omr_polling",
        `Recognizing music... ${status}`,
        progressPercent,
        submitResult.jobId,
      );
    },
    options.cancellationToken,
  );

  // Check for cancellation or failure
  if (options.cancellationToken?.cancelled) {
    return createCancelledResult(state);
  }

  if (omrResult.status !== "completed" || !omrResult.result) {
    updateStatus("failed", "Recognition failed");
    return createFailedResult(state, omrResult.error);
  }

  // Step 5: Normalize OMR result
  updateStatus("normalizing", "Processing results...", 90);

  const score = normalizeOmrResult(omrResult.result, {
    sourceType: asset.sourceType,
    originalFileName: asset.fileName,
    remoteAssetId: uploadResult.remoteAssetId,
  });

  const preview = createPreviewFromScore(score);
  const validationIssues = validateScore(score);

  // Check for low confidence
  if (score.confidence && score.confidence.overall < 0.7) {
    state.warnings.push(
      "Some parts of the music may not have been recognized accurately. Please review the results.",
    );
  }

  updateStatus("succeeded", "Import complete!", 100);

  // OMR may produce MusicXML output for rendering
  const rawMusicXml = omrResult.result.musicXml ?? null;

  return createSuccessResult(
    state,
    score,
    preview,
    validationIssues,
    rawMusicXml,
  );
}

// ============================================================================
// Preview & Validation Helpers
// ============================================================================

/**
 * Create a preview model from an imported score
 */
function createPreviewFromScore(score: ImportedScore): ImportPreviewModel {
  const { metadata } = score;

  // Generate title
  const title =
    metadata.title ??
    metadata.movementTitle ??
    metadata.workTitle ??
    score.sourceInfo.originalFileName;

  // Generate subtitle
  const subtitleParts: string[] = [];
  if (metadata.composer) subtitleParts.push(metadata.composer);
  if (metadata.arranger) subtitleParts.push(`arr. ${metadata.arranger}`);
  const subtitle = subtitleParts.length > 0 ? subtitleParts.join(" - ") : null;

  // Determine if review is needed
  const needsReview = score.confidence?.needsReview ?? false;
  const reviewReasons: string[] = [];

  if (score.confidence && score.confidence.overall < 0.8) {
    reviewReasons.push("Low overall confidence in music recognition");
  }
  if (score.confidence && score.confidence.needsReview) {
    reviewReasons.push("Some measures may need manual review");
  }

  return {
    scoreId: score.id,
    title,
    subtitle,
    stats: {
      measureCount: score.measureCount,
      partCount: score.parts.length,
      pageCount: null, // Not available from current processing
      timeSignature: metadata.timeSignature?.displayName ?? null,
      keySignature: metadata.keySignature?.displayName ?? null,
      tempo: metadata.tempo
        ? `${metadata.tempo.marking ?? ""} ♩=${metadata.tempo.bpm}`.trim()
        : null,
    },
    needsReview,
    reviewReasons,
    thumbnailUrl: null, // Would come from backend
  };
}

/**
 * Validate an imported score and return issues
 */
function validateScore(score: ImportedScore): ImportValidationIssue[] {
  const issues: ImportValidationIssue[] = [];

  // Check for missing metadata
  if (!score.metadata.title && !score.metadata.workTitle) {
    issues.push({
      type: "missing_metadata",
      message: "No title found in the score",
      severity: "info",
    });
  }

  if (!score.metadata.timeSignature) {
    issues.push({
      type: "missing_time_signature",
      message: "No time signature found",
      severity: "warning",
    });
  }

  if (!score.metadata.keySignature) {
    issues.push({
      type: "missing_key_signature",
      message: "No key signature found",
      severity: "info",
    });
  }

  // Check for empty parts
  for (let i = 0; i < score.parts.length; i++) {
    const part = score.parts[i];
    if (part.measures.length === 0) {
      issues.push({
        type: "empty_part",
        message: `Part ${part.name ?? i + 1} has no measures`,
        severity: "warning",
        location: { partIndex: i },
      });
    }
  }

  // Check for low confidence measures (from OMR)
  if (score.confidence?.measureConfidence) {
    score.confidence.measureConfidence.forEach((conf, idx) => {
      if (conf < 0.6) {
        issues.push({
          type: "low_confidence_region",
          message: `Measure ${idx + 1} has low recognition confidence`,
          severity: "warning",
          location: { measureNumber: idx + 1 },
        });
      }
    });
  }

  return issues;
}

// ============================================================================
// Result Factories
// ============================================================================

/**
 * Create a successful pipeline result
 */
function createSuccessResult(
  state: OrchestratorState,
  score: ImportedScore,
  preview: ImportPreviewModel,
  validationIssues: ImportValidationIssue[],
  rawMusicXml: string | null = null,
): ImportPipelineResult {
  return {
    success: true,
    score,
    preview,
    rawMusicXml,
    error: null,
    validationIssues,
    metrics: createMetrics(state),
  };
}

/**
 * Create a failed pipeline result
 */
function createFailedResult(
  state: OrchestratorState,
  error: ImportError | null,
): ImportPipelineResult {
  return {
    success: false,
    score: null,
    preview: null,
    rawMusicXml: null,
    error:
      error ??
      createImportError(
        "unknown_error",
        "Import failed with unknown error",
        "Something went wrong. Please try again.",
        { severity: "fatal", recoverable: false },
      ),
    validationIssues: [],
    metrics: createMetrics(state),
  };
}

/**
 * Create a cancelled pipeline result
 */
function createCancelledResult(state: OrchestratorState): ImportPipelineResult {
  return {
    success: false,
    score: null,
    preview: null,
    rawMusicXml: null,
    error: createImportError(
      "canceled_by_user",
      "Import was cancelled by user",
      "Import canceled.",
      { severity: "recoverable", recoverable: true },
    ),
    validationIssues: [],
    metrics: createMetrics(state),
  };
}

/**
 * Create pipeline metrics
 */
function createMetrics(state: OrchestratorState): ImportPipelineMetrics {
  const completedAt = Date.now();
  return {
    startedAt: state.startTime,
    completedAt,
    durationMs: completedAt - state.startTime,
    sourceType: state.asset?.sourceType ?? "musicxml",
    fileSizeBytes: state.asset?.fileSize ?? null,
  };
}

// ============================================================================
// Simplified Entry Points
// ============================================================================

/**
 * Import a MusicXML file (simplified entry point)
 */
export async function importMusicXmlFile(
  asset: LocalImportAsset,
  onStatusChange?: StatusListener,
): Promise<ImportPipelineResult> {
  return runImportPipeline({ asset }, { onStatusChange });
}

/**
 * Import an image for OMR (simplified entry point)
 */
export async function importImageForOmr(
  asset: LocalImportAsset,
  onStatusChange?: StatusListener,
): Promise<ImportPipelineResult> {
  return runImportPipeline({ asset }, { onStatusChange });
}
