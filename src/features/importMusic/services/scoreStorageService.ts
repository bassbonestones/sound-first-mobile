/**
 * Score Storage Service
 *
 * Manages persistence of imported scores using AsyncStorage.
 * Stores both the ImportedScore metadata and raw MusicXML content
 * for later re-rendering.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ImportedScore } from "../../../types/import";

// ============================================================================
// Types
// ============================================================================

/**
 * Storage metadata for a saved score
 */
export interface ScoreStorageMetadata {
  /** Unique storage ID */
  readonly id: string;
  /** When the score was saved */
  readonly savedAt: string;
  /** When the score was last accessed */
  readonly lastAccessedAt: string;
  /** User-provided tags for organization */
  readonly tags: readonly string[];
  /** Whether this score is marked as favorite */
  readonly isFavorite: boolean;
}

/**
 * A stored score with full data
 */
export interface StoredScore {
  /** Storage metadata */
  readonly storageMetadata: ScoreStorageMetadata;
  /** The imported score */
  readonly score: ImportedScore;
  /** Raw MusicXML for re-rendering */
  readonly rawMusicXml: string;
}

/**
 * Summary info for listing scores (without full MusicXML content)
 */
export interface StoredScoreSummary {
  /** Storage ID */
  readonly id: string;
  /** Score title */
  readonly title: string | null;
  /** Composer */
  readonly composer: string | null;
  /** Part count */
  readonly partCount: number;
  /** Measure count */
  readonly measureCount: number;
  /** When saved */
  readonly savedAt: string;
  /** Last accessed */
  readonly lastAccessedAt: string;
  /** Tags */
  readonly tags: readonly string[];
  /** Favorite flag */
  readonly isFavorite: boolean;
  /** Source type */
  readonly sourceType: string;
}

/**
 * Input for saving a new score
 */
export interface SaveScoreInput {
  readonly score: ImportedScore;
  readonly rawMusicXml: string;
  readonly tags?: readonly string[];
  readonly isFavorite?: boolean;
}

/**
 * Input for updating a stored score
 */
export interface UpdateScoreInput {
  readonly tags?: readonly string[];
  readonly isFavorite?: boolean;
}

/**
 * Result of a storage operation
 */
export type StorageResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: StorageError };

/**
 * Storage errors
 */
export interface StorageError {
  readonly code: StorageErrorCode;
  readonly message: string;
  readonly details?: string;
}

export type StorageErrorCode =
  | "not_found"
  | "save_failed"
  | "load_failed"
  | "delete_failed"
  | "invalid_data"
  | "storage_full"
  | "unknown";

// ============================================================================
// Constants
// ============================================================================

/** Storage key prefix for scores */
const STORAGE_KEY_PREFIX = "@soundfirst/scores/";

/** Storage key for the score index (list of IDs) */
const INDEX_KEY = "@soundfirst/scores_index";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique ID for a new score
 */
export function generateScoreId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `score_${timestamp}_${randomPart}`;
}

/**
 * Get the storage key for a score
 */
function getStorageKey(id: string): string {
  return `${STORAGE_KEY_PREFIX}${id}`;
}

/**
 * Create a summary from a stored score
 */
function createSummary(stored: StoredScore): StoredScoreSummary {
  return {
    id: stored.storageMetadata.id,
    title: stored.score.metadata.title,
    composer: stored.score.metadata.composer,
    partCount: stored.score.parts.length,
    measureCount: stored.score.measureCount,
    savedAt: stored.storageMetadata.savedAt,
    lastAccessedAt: stored.storageMetadata.lastAccessedAt,
    tags: stored.storageMetadata.tags,
    isFavorite: stored.storageMetadata.isFavorite,
    sourceType: stored.score.sourceInfo.sourceType,
  };
}

/**
 * Create an error result
 */
function errorResult<T>(
  code: StorageErrorCode,
  message: string,
  details?: string,
): StorageResult<T> {
  return {
    success: false,
    error: { code, message, details },
  };
}

// ============================================================================
// Storage Service
// ============================================================================

/**
 * Save a score to storage
 */
export async function saveScore(
  input: SaveScoreInput,
): Promise<StorageResult<StoredScore>> {
  try {
    const id = generateScoreId();
    const now = new Date().toISOString();

    const storageMetadata: ScoreStorageMetadata = {
      id,
      savedAt: now,
      lastAccessedAt: now,
      tags: input.tags ?? [],
      isFavorite: input.isFavorite ?? false,
    };

    const stored: StoredScore = {
      storageMetadata,
      score: input.score,
      rawMusicXml: input.rawMusicXml,
    };

    // Save the score
    const key = getStorageKey(id);
    await AsyncStorage.setItem(key, JSON.stringify(stored));

    // Update the index
    const indexData = await AsyncStorage.getItem(INDEX_KEY);
    const index: string[] = indexData ? JSON.parse(indexData) : [];
    index.unshift(id); // Add to beginning (most recent first)
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index));

    return { success: true, data: stored };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResult("save_failed", "Failed to save score", message);
  }
}

/**
 * Get a stored score by ID
 */
export async function getScore(
  id: string,
): Promise<StorageResult<StoredScore>> {
  try {
    const key = getStorageKey(id);
    const data = await AsyncStorage.getItem(key);

    if (!data) {
      return errorResult("not_found", `Score not found: ${id}`);
    }

    const stored: StoredScore = JSON.parse(data);

    // Update last accessed time
    const updated: StoredScore = {
      ...stored,
      storageMetadata: {
        ...stored.storageMetadata,
        lastAccessedAt: new Date().toISOString(),
      },
    };
    await AsyncStorage.setItem(key, JSON.stringify(updated));

    return { success: true, data: updated };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResult("load_failed", "Failed to load score", message);
  }
}

/**
 * List all stored scores (summaries only)
 */
export async function listScores(): Promise<
  StorageResult<StoredScoreSummary[]>
> {
  try {
    const indexData = await AsyncStorage.getItem(INDEX_KEY);
    const index: string[] = indexData ? JSON.parse(indexData) : [];

    const summaries: StoredScoreSummary[] = [];
    const validIds: string[] = [];

    for (const id of index) {
      const key = getStorageKey(id);
      const data = await AsyncStorage.getItem(key);

      if (data) {
        try {
          const stored: StoredScore = JSON.parse(data);
          summaries.push(createSummary(stored));
          validIds.push(id);
        } catch {
          // Skip corrupted entries
        }
      }
    }

    // Clean up index if some scores were missing
    if (validIds.length !== index.length) {
      await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(validIds));
    }

    return { success: true, data: summaries };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResult("load_failed", "Failed to list scores", message);
  }
}

/**
 * Update a stored score's metadata
 */
export async function updateScore(
  id: string,
  updates: UpdateScoreInput,
): Promise<StorageResult<StoredScore>> {
  try {
    const result = await getScore(id);
    if (!result.success) {
      return result;
    }

    const stored = result.data;
    const updated: StoredScore = {
      ...stored,
      storageMetadata: {
        ...stored.storageMetadata,
        tags: updates.tags ?? stored.storageMetadata.tags,
        isFavorite: updates.isFavorite ?? stored.storageMetadata.isFavorite,
      },
    };

    const key = getStorageKey(id);
    await AsyncStorage.setItem(key, JSON.stringify(updated));

    return { success: true, data: updated };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResult("save_failed", "Failed to update score", message);
  }
}

/**
 * Delete a stored score
 */
export async function deleteScore(id: string): Promise<StorageResult<void>> {
  try {
    const key = getStorageKey(id);

    // Check if score exists
    const data = await AsyncStorage.getItem(key);
    if (!data) {
      return errorResult("not_found", `Score not found: ${id}`);
    }

    // Remove from storage
    await AsyncStorage.removeItem(key);

    // Update index
    const indexData = await AsyncStorage.getItem(INDEX_KEY);
    const index: string[] = indexData ? JSON.parse(indexData) : [];
    const newIndex = index.filter((scoreId) => scoreId !== id);
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(newIndex));

    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResult("delete_failed", "Failed to delete score", message);
  }
}

/**
 * Delete all stored scores
 */
export async function deleteAllScores(): Promise<StorageResult<void>> {
  try {
    const indexData = await AsyncStorage.getItem(INDEX_KEY);
    const index: string[] = indexData ? JSON.parse(indexData) : [];

    // Remove all score data
    const keys = index.map((id) => getStorageKey(id));
    if (keys.length > 0) {
      await AsyncStorage.multiRemove(keys);
    }

    // Clear index
    await AsyncStorage.removeItem(INDEX_KEY);

    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResult("delete_failed", "Failed to delete all scores", message);
  }
}

/**
 * Get the count of stored scores
 */
export async function getScoreCount(): Promise<StorageResult<number>> {
  try {
    const indexData = await AsyncStorage.getItem(INDEX_KEY);
    const index: string[] = indexData ? JSON.parse(indexData) : [];
    return { success: true, data: index.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResult("load_failed", "Failed to get score count", message);
  }
}

/**
 * Check if a score exists
 */
export async function scoreExists(id: string): Promise<boolean> {
  try {
    const key = getStorageKey(id);
    const data = await AsyncStorage.getItem(key);
    return data !== null;
  } catch {
    return false;
  }
}

/**
 * Toggle favorite status for a score
 */
export async function toggleFavorite(
  id: string,
): Promise<StorageResult<StoredScore>> {
  const result = await getScore(id);
  if (!result.success) {
    return result;
  }

  return updateScore(id, {
    isFavorite: !result.data.storageMetadata.isFavorite,
  });
}

/**
 * Get all favorite scores
 */
export async function getFavoriteScores(): Promise<
  StorageResult<StoredScoreSummary[]>
> {
  const result = await listScores();
  if (!result.success) {
    return result;
  }

  const favorites = result.data.filter((s) => s.isFavorite);
  return { success: true, data: favorites };
}
