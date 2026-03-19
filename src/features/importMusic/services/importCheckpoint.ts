/**
 * Import Checkpoint Service
 *
 * Provides checkpoint/resume functionality for long-running imports.
 * Saves import state at each stage so imports can be resumed after
 * app crashes or restarts.
 *
 * Checkpoint lifecycle:
 * 1. createCheckpoint() - Start tracking an import
 * 2. updateCheckpoint() - Update state at each stage
 * 3. completeCheckpoint() - Mark as complete (auto-cleaned)
 * 4. removeCheckpoint() - Explicitly discard
 *
 * On app launch:
 * 1. Call getActiveCheckpoints() to find incomplete imports
 * 2. Check isCheckpointStale() for each
 * 3. Offer user to resume or discard
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { devLog } from "../../../utils/devLogger";
import type {
  ImportStage,
  ImportedScore,
  LocalImportAsset,
} from "../../../types/import";

// ============================================================================
// Types
// ============================================================================

export type CheckpointStage =
  | "file_acquired"
  | "uploading"
  | "uploaded"
  | "omr_submitted"
  | "omr_polling"
  | "omr_complete"
  | "parsing"
  | "parsed"
  | "saving"
  | "completed";

export interface ImportCheckpoint {
  /** Unique checkpoint ID */
  id: string;
  /** When checkpoint was created */
  createdAt: number;
  /** When checkpoint was last updated */
  updatedAt: number;
  /** Current stage of the import */
  stage: CheckpointStage;
  /** Human-readable status message */
  statusMessage: string;
  /** Import type */
  importType: "musicxml" | "image" | "pdf" | "camera";
  /** Original file path or URI (if still accessible) */
  filePath?: string;
  /** Original filename for display */
  filename: string;
  /** File size in bytes */
  fileSize?: number;
  /** Backend job ID (for OMR imports) */
  omrJobId?: string;
  /** Backend file ID (for uploaded files) */
  uploadedFileId?: string;
  /** Raw MusicXML content (if parsed) */
  musicXml?: string;
  /** Partial import result */
  partialResult?: Partial<ImportedScore>;
  /** Error message if failed */
  error?: string;
  /** Whether import has failed */
  failed: boolean;
  /** Progress percentage (0-100) */
  progress: number;
}

export interface CheckpointSummary {
  id: string;
  filename: string;
  stage: CheckpointStage;
  importType: string;
  createdAt: number;
  updatedAt: number;
  isStale: boolean;
  failed: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = "@import_checkpoints";
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================================
// Storage Operations
// ============================================================================

/**
 * Load all checkpoints from storage
 */
async function loadCheckpoints(): Promise<Record<string, ImportCheckpoint>> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored) as Record<string, ImportCheckpoint>;
  } catch (error) {
    devLog("checkpoint", "Failed to load checkpoints", error);
    return {};
  }
}

/**
 * Save all checkpoints to storage
 */
async function saveCheckpoints(
  checkpoints: Record<string, ImportCheckpoint>,
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(checkpoints));
  } catch (error) {
    devLog("checkpoint", "Failed to save checkpoints", error);
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Generate a unique checkpoint ID
 */
export function generateCheckpointId(): string {
  return `chk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create a new checkpoint for an import
 */
export async function createCheckpoint(
  id: string,
  options: {
    importType: ImportCheckpoint["importType"];
    filename: string;
    filePath?: string;
    fileSize?: number;
  },
): Promise<ImportCheckpoint> {
  const now = Date.now();

  const checkpoint: ImportCheckpoint = {
    id,
    createdAt: now,
    updatedAt: now,
    stage: "file_acquired",
    statusMessage: "Starting import...",
    importType: options.importType,
    filename: options.filename,
    filePath: options.filePath,
    fileSize: options.fileSize,
    failed: false,
    progress: 0,
  };

  const checkpoints = await loadCheckpoints();
  checkpoints[id] = checkpoint;
  await saveCheckpoints(checkpoints);

  devLog("checkpoint", "Created checkpoint", id, options.filename);

  return checkpoint;
}

/**
 * Update an existing checkpoint
 */
export async function updateCheckpoint(
  id: string,
  updates: Partial<Omit<ImportCheckpoint, "id" | "createdAt">>,
): Promise<ImportCheckpoint | null> {
  const checkpoints = await loadCheckpoints();
  const existing = checkpoints[id];

  if (!existing) {
    devLog("checkpoint", "Checkpoint not found for update", id);
    return null;
  }

  const updated: ImportCheckpoint = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };

  checkpoints[id] = updated;
  await saveCheckpoints(checkpoints);

  devLog("checkpoint", "Updated checkpoint", id, updates.stage || "");

  return updated;
}

/**
 * Mark a checkpoint as complete and remove it
 */
export async function completeCheckpoint(id: string): Promise<void> {
  const checkpoints = await loadCheckpoints();
  delete checkpoints[id];
  await saveCheckpoints(checkpoints);
  devLog("checkpoint", "Completed and removed checkpoint", id);
}

/**
 * Remove a checkpoint (discard import)
 */
export async function removeCheckpoint(id: string): Promise<void> {
  const checkpoints = await loadCheckpoints();
  delete checkpoints[id];
  await saveCheckpoints(checkpoints);
  devLog("checkpoint", "Removed checkpoint", id);
}

/**
 * Get a specific checkpoint
 */
export async function getCheckpoint(
  id: string,
): Promise<ImportCheckpoint | null> {
  const checkpoints = await loadCheckpoints();
  return checkpoints[id] || null;
}

/**
 * Get all active (non-complete) checkpoints
 */
export async function getActiveCheckpoints(): Promise<ImportCheckpoint[]> {
  const checkpoints = await loadCheckpoints();
  return Object.values(checkpoints);
}

/**
 * Get summaries of all active checkpoints for UI display
 */
export async function getCheckpointSummaries(): Promise<CheckpointSummary[]> {
  const checkpoints = await getActiveCheckpoints();
  const now = Date.now();

  return checkpoints.map((cp) => ({
    id: cp.id,
    filename: cp.filename,
    stage: cp.stage,
    importType: cp.importType,
    createdAt: cp.createdAt,
    updatedAt: cp.updatedAt,
    isStale: now - cp.updatedAt > STALE_THRESHOLD_MS,
    failed: cp.failed,
  }));
}

/**
 * Check if a checkpoint is stale (older than 24 hours)
 */
export function isCheckpointStale(checkpoint: ImportCheckpoint): boolean {
  return Date.now() - checkpoint.updatedAt > STALE_THRESHOLD_MS;
}

/**
 * Clean up all stale checkpoints
 * Call this on app launch
 */
export async function cleanupStaleCheckpoints(): Promise<number> {
  const checkpoints = await loadCheckpoints();
  const now = Date.now();
  let removedCount = 0;

  for (const [id, checkpoint] of Object.entries(checkpoints)) {
    if (now - checkpoint.updatedAt > STALE_THRESHOLD_MS) {
      delete checkpoints[id];
      removedCount++;
      devLog("checkpoint", "Cleaned up stale checkpoint", id);
    }
  }

  if (removedCount > 0) {
    await saveCheckpoints(checkpoints);
  }

  return removedCount;
}

/**
 * Clear all checkpoints (for testing/reset)
 */
export async function clearAllCheckpoints(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
  devLog("checkpoint", "Cleared all checkpoints");
}

// ============================================================================
// Resume Support
// ============================================================================

export interface ResumeContext {
  /** The checkpoint to resume from */
  checkpoint: ImportCheckpoint;
  /** Whether the checkpoint can be resumed */
  canResume: boolean;
  /** Reason if cannot resume */
  cannotResumeReason?: string;
  /** Suggested action for the user */
  suggestedAction: "resume" | "restart" | "discard";
}

/**
 * Analyze a checkpoint to determine resume capability
 */
export function analyzeCheckpointForResume(
  checkpoint: ImportCheckpoint,
): ResumeContext {
  // Failed checkpoints - suggest restart
  if (checkpoint.failed) {
    return {
      checkpoint,
      canResume: false,
      cannotResumeReason: checkpoint.error || "Import failed",
      suggestedAction: "restart",
    };
  }

  // Stale checkpoints - suggest discard
  if (isCheckpointStale(checkpoint)) {
    return {
      checkpoint,
      canResume: false,
      cannotResumeReason: "Import is too old to resume",
      suggestedAction: "discard",
    };
  }

  // Check resumability by stage
  switch (checkpoint.stage) {
    case "file_acquired":
    case "uploading":
      // Need to restart from file
      return {
        checkpoint,
        canResume: !!checkpoint.filePath,
        cannotResumeReason: checkpoint.filePath
          ? undefined
          : "Original file no longer available",
        suggestedAction: checkpoint.filePath ? "resume" : "restart",
      };

    case "uploaded":
    case "omr_submitted":
    case "omr_polling":
      // Can resume if we have job ID
      return {
        checkpoint,
        canResume: !!checkpoint.omrJobId,
        cannotResumeReason: checkpoint.omrJobId
          ? undefined
          : "OMR job ID not found",
        suggestedAction: checkpoint.omrJobId ? "resume" : "restart",
      };

    case "omr_complete":
    case "parsing":
      // Can resume if we have MusicXML
      return {
        checkpoint,
        canResume: !!checkpoint.musicXml,
        cannotResumeReason: checkpoint.musicXml
          ? undefined
          : "MusicXML content not found",
        suggestedAction: checkpoint.musicXml ? "resume" : "restart",
      };

    case "parsed":
    case "saving":
      // Can resume if we have parsed result
      return {
        checkpoint,
        canResume: !!checkpoint.partialResult,
        cannotResumeReason: checkpoint.partialResult
          ? undefined
          : "Parsed result not found",
        suggestedAction: checkpoint.partialResult ? "resume" : "restart",
      };

    case "completed":
      // Shouldn't have a checkpoint for completed imports
      return {
        checkpoint,
        canResume: false,
        cannotResumeReason: "Import already completed",
        suggestedAction: "discard",
      };

    default:
      return {
        checkpoint,
        canResume: false,
        cannotResumeReason: "Unknown checkpoint stage",
        suggestedAction: "restart",
      };
  }
}

/**
 * Get all pending imports that can potentially be resumed
 * Call this on app launch to check for incomplete imports
 */
export async function getPendingImports(): Promise<ResumeContext[]> {
  const checkpoints = await getActiveCheckpoints();
  return checkpoints.map(analyzeCheckpointForResume);
}
