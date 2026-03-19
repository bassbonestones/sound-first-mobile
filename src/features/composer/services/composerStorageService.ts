/**
 * Composer Storage Service
 *
 * Handles persistence of ComposerScore to AsyncStorage and export to MusicXML.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ComposerScore } from "../types";
import { createDefaultScore } from "../types";
import { generateMusicXml } from "./musicXmlGenerator";

// Safe logger import (optional in tests)
let devLogger: {
  info: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
} = {
  info: () => {},
  error: () => {},
};

try {
  // Dynamically import to avoid test failures
  const logger = require("../../../utils/devLogger");
  if (logger?.devLogger) {
    devLogger = logger.devLogger;
  }
} catch {
  // Use no-op logger if not available
}

// =============================================================================
// Types
// =============================================================================

/** Metadata for a saved score (lightweight listing data) */
export interface ScoreMeta {
  /** Unique score ID */
  id: string;
  /** Score title */
  title: string;
  /** Clef type */
  clef: "treble" | "bass";
  /** Number of measures */
  measureCount: number;
  /** Last modified timestamp */
  updatedAt: number;
  /** Created timestamp */
  createdAt: number;
}

/** Full saved score with metadata */
export interface SavedScore {
  /** Score metadata */
  meta: ScoreMeta;
  /** Full score data */
  score: ComposerScore;
}

/** Result of listing all scores */
export interface ScoreListResult {
  /** Array of score metadata */
  scores: ScoreMeta[];
  /** Total count */
  total: number;
}

/** Export options */
export interface ExportOptions {
  /** Include metadata comments in XML */
  includeMetadata?: boolean;
  /** Pretty-print the XML */
  prettyPrint?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const STORAGE_PREFIX = "@soundfirst/composer/";
const SCORES_INDEX_KEY = `${STORAGE_PREFIX}index`;
const SCORE_PREFIX = `${STORAGE_PREFIX}score/`;
const AUTOSAVE_KEY = `${STORAGE_PREFIX}autosave`;

// =============================================================================
// Storage Service
// =============================================================================

export const composerStorageService = {
  // ===========================================================================
  // Save / Load Single Score
  // ===========================================================================

  /**
   * Save a score to storage.
   * Updates or creates the score and metadata index.
   */
  async saveScore(score: ComposerScore): Promise<ScoreMeta> {
    const now = Date.now();
    const scoreKey = `${SCORE_PREFIX}${score.id}`;

    // Load existing meta or create new
    const existingMeta = await this.getScoreMeta(score.id);

    const meta: ScoreMeta = {
      id: score.id,
      title: score.title || "Untitled",
      clef: score.clef,
      measureCount: score.measures.length,
      updatedAt: now,
      createdAt: existingMeta?.createdAt ?? now,
    };

    // Save the full score
    const savedScore: SavedScore = { meta, score };
    await AsyncStorage.setItem(scoreKey, JSON.stringify(savedScore));

    // Update index
    await this.updateIndex(meta);

    devLogger.info("ComposerStorage", `Saved score: ${score.id}`);

    return meta;
  },

  /**
   * Load a score by ID.
   * Returns null if not found.
   */
  async loadScore(id: string): Promise<ComposerScore | null> {
    const scoreKey = `${SCORE_PREFIX}${id}`;

    try {
      const json = await AsyncStorage.getItem(scoreKey);
      if (!json) return null;

      const saved: SavedScore = JSON.parse(json);
      return saved.score;
    } catch (error) {
      devLogger.error("ComposerStorage", `Failed to load score ${id}`, error);
      return null;
    }
  },

  /**
   * Delete a score by ID.
   */
  async deleteScore(id: string): Promise<boolean> {
    const scoreKey = `${SCORE_PREFIX}${id}`;

    try {
      await AsyncStorage.removeItem(scoreKey);
      await this.removeFromIndex(id);
      devLogger.info("ComposerStorage", `Deleted score: ${id}`);
      return true;
    } catch (error) {
      devLogger.error("ComposerStorage", `Failed to delete score ${id}`, error);
      return false;
    }
  },

  // ===========================================================================
  // Score Listing
  // ===========================================================================

  /**
   * List all saved scores (metadata only).
   */
  async listScores(): Promise<ScoreListResult> {
    try {
      const json = await AsyncStorage.getItem(SCORES_INDEX_KEY);
      if (!json) return { scores: [], total: 0 };

      const scores: ScoreMeta[] = JSON.parse(json);

      // Sort by updatedAt descending (most recent first)
      scores.sort((a, b) => b.updatedAt - a.updatedAt);

      return { scores, total: scores.length };
    } catch (error) {
      devLogger.error("ComposerStorage", "Failed to list scores", error);
      return { scores: [], total: 0 };
    }
  },

  /**
   * Get metadata for a single score.
   */
  async getScoreMeta(id: string): Promise<ScoreMeta | null> {
    const result = await this.listScores();
    return result.scores.find((s) => s.id === id) ?? null;
  },

  // ===========================================================================
  // Autosave
  // ===========================================================================

  /**
   * Save current work-in-progress to autosave slot.
   * Used for recovery after crashes.
   */
  async autosave(score: ComposerScore): Promise<void> {
    try {
      const data = {
        score,
        savedAt: Date.now(),
      };
      await AsyncStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
    } catch (error) {
      devLogger.error("ComposerStorage", "Autosave failed", error);
    }
  },

  /**
   * Load autosaved score if available.
   */
  async loadAutosave(): Promise<ComposerScore | null> {
    try {
      const json = await AsyncStorage.getItem(AUTOSAVE_KEY);
      if (!json) return null;

      const data = JSON.parse(json);
      return data.score as ComposerScore;
    } catch (error) {
      devLogger.error("ComposerStorage", "Failed to load autosave", error);
      return null;
    }
  },

  /**
   * Clear autosave slot.
   */
  async clearAutosave(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AUTOSAVE_KEY);
    } catch (error) {
      devLogger.error("ComposerStorage", "Failed to clear autosave", error);
    }
  },

  /**
   * Check if autosave exists.
   */
  async hasAutosave(): Promise<boolean> {
    try {
      const json = await AsyncStorage.getItem(AUTOSAVE_KEY);
      return json !== null;
    } catch {
      return false;
    }
  },

  // ===========================================================================
  // Export
  // ===========================================================================

  /**
   * Export score as MusicXML string.
   */
  exportToMusicXml(score: ComposerScore, options?: ExportOptions): string {
    return generateMusicXml(score);
  },

  /**
   * Generate a downloadable filename for the score.
   */
  getExportFilename(score: ComposerScore): string {
    const title = (score.title || "untitled")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return `${title}.musicxml`;
  },

  // ===========================================================================
  // Index Helpers (Private)
  // ===========================================================================

  /**
   * Update the scores index with new/updated metadata.
   */
  async updateIndex(meta: ScoreMeta): Promise<void> {
    try {
      const result = await this.listScores();
      const existingIndex = result.scores.findIndex((s) => s.id === meta.id);

      if (existingIndex >= 0) {
        result.scores[existingIndex] = meta;
      } else {
        result.scores.push(meta);
      }

      await AsyncStorage.setItem(
        SCORES_INDEX_KEY,
        JSON.stringify(result.scores),
      );
    } catch (error) {
      devLogger.error("ComposerStorage", "Failed to update index", error);
    }
  },

  /**
   * Remove a score from the index.
   */
  async removeFromIndex(id: string): Promise<void> {
    try {
      const result = await this.listScores();
      const filtered = result.scores.filter((s) => s.id !== id);
      await AsyncStorage.setItem(SCORES_INDEX_KEY, JSON.stringify(filtered));
    } catch (error) {
      devLogger.error("ComposerStorage", "Failed to remove from index", error);
    }
  },

  // ===========================================================================
  // Danger Zone
  // ===========================================================================

  /**
   * Delete ALL composer data. Use with caution.
   */
  async clearAllData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const composerKeys = keys.filter((k) => k.startsWith(STORAGE_PREFIX));
      await AsyncStorage.multiRemove(composerKeys);
      devLogger.info("ComposerStorage", "Cleared all composer data");
    } catch (error) {
      devLogger.error("ComposerStorage", "Failed to clear all data", error);
    }
  },
};

// =============================================================================
// Hook for Autosave
// =============================================================================

/**
 * Helper to create an autosave effect.
 * Returns a function to trigger autosave.
 */
export function createAutosaveHandler(intervalMs: number = 30000): {
  scheduleAutosave: (score: ComposerScore) => void;
  cancelAutosave: () => void;
} {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingScore: ComposerScore | null = null;

  const doAutosave = async () => {
    if (pendingScore) {
      await composerStorageService.autosave(pendingScore);
      pendingScore = null;
    }
  };

  return {
    scheduleAutosave: (score: ComposerScore) => {
      pendingScore = score;

      // Clear existing timer
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Schedule autosave
      timeoutId = setTimeout(doAutosave, intervalMs);
    },
    cancelAutosave: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      pendingScore = null;
    },
  };
}
