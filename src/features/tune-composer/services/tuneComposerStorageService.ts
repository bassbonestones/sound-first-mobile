/**
 * Tune Composer Storage Service
 *
 * Handles persistence of TuneComposerScore to AsyncStorage and export to MusicXML.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import type { TuneComposerScore } from "../types";
import { DEFAULT_PLAYBACK_SETTINGS } from "../types";
import { generateMusicXml } from "./tuneComposerMusicXmlGenerator";

// Safe logger import (optional in tests)
let devLogger: {
  info: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
} = {
  info: () => {},
  error: () => {},
};

try {
  const logger = require("../../../utils/devLogger");
  if (logger?.devLogger) {
    devLogger = logger.devLogger;
  }
} catch {
  // Use no-op logger
}

// =============================================================================
// Types
// =============================================================================

export interface TuneScoreMeta {
  id: string;
  title: string;
  clef: "treble" | "bass";
  measureCount: number;
  hasLyrics: boolean;
  updatedAt: number;
  createdAt: number;
}

export interface SavedTuneScore {
  meta: TuneScoreMeta;
  score: TuneComposerScore;
}

export interface TuneScoreListResult {
  scores: TuneScoreMeta[];
  total: number;
}

// =============================================================================
// Migration
// =============================================================================

/**
 * Migrate a loaded score to ensure all properties have defaults.
 * This handles scores saved before new properties were added.
 */
function migrateScore(score: TuneComposerScore): TuneComposerScore {
  return {
    ...score,
    // Ensure playbackSettings has all required properties with defaults
    playbackSettings: {
      ...DEFAULT_PLAYBACK_SETTINGS,
      ...score.playbackSettings,
    },
  };
}

// =============================================================================
// Service
// =============================================================================

export interface ExportOptions {
  includeMetadata?: boolean;
  prettyPrint?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const STORAGE_PREFIX = "@soundfirst/tune-composer/";
const SCORES_INDEX_KEY = `${STORAGE_PREFIX}index`;
const SCORE_PREFIX = `${STORAGE_PREFIX}score/`;
const AUTOSAVE_KEY = `${STORAGE_PREFIX}autosave`;

// =============================================================================
// Helper Functions
// =============================================================================

function scoreHasLyrics(score: TuneComposerScore): boolean {
  return score.measures.some((measure) =>
    measure.notes.some((note) => note.lyric?.text),
  );
}

// =============================================================================
// Storage Service
// =============================================================================

export const tuneComposerStorageService = {
  async saveScore(score: TuneComposerScore): Promise<TuneScoreMeta> {
    // DEBUG: Log time signatures with symbols
    score.measures.forEach((m, i) => {
      if (m.timeSignature?.symbol) {
        console.log(
          `[DEBUG saveScore] Measure ${i} has timeSignature with symbol:`,
          m.timeSignature,
        );
      }
    });

    const now = Date.now();
    const scoreKey = `${SCORE_PREFIX}${score.id}`;

    const existingMeta = await this.getScoreMeta(score.id);

    const meta: TuneScoreMeta = {
      id: score.id,
      title: score.title || "Untitled",
      clef: score.clef,
      measureCount: score.measures.length,
      hasLyrics: scoreHasLyrics(score),
      updatedAt: now,
      createdAt: existingMeta?.createdAt ?? now,
    };

    const savedScore: SavedTuneScore = { meta, score };
    await AsyncStorage.setItem(scoreKey, JSON.stringify(savedScore));
    await this.updateIndex(meta);

    devLogger.info("TuneComposerStorage", `Saved score: ${score.id}`);

    return meta;
  },

  async loadScore(id: string): Promise<TuneComposerScore | null> {
    const scoreKey = `${SCORE_PREFIX}${id}`;

    try {
      const json = await AsyncStorage.getItem(scoreKey);
      if (!json) return null;

      const saved: SavedTuneScore = JSON.parse(json);

      // DEBUG: Log time signatures with symbols
      saved.score.measures.forEach((m, i) => {
        if (m.timeSignature?.symbol) {
          console.log(
            `[DEBUG loadScore] Measure ${i} has timeSignature with symbol:`,
            m.timeSignature,
          );
        }
      });

      // Migrate score to ensure all properties have defaults
      let score = migrateScore(saved.score);

      // Clear slurPlacement on all notes so it auto-calculates from stem direction
      // This ensures slurs adapt correctly when the tune is rendered
      score = {
        ...score,
        measures: score.measures.map((measure) => ({
          ...measure,
          notes: measure.notes.map((note) => ({
            ...note,
            slurPlacement: undefined,
          })),
        })),
      };

      return score;
    } catch (error) {
      devLogger.error(
        "TuneComposerStorage",
        `Failed to load score ${id}`,
        error,
      );
      return null;
    }
  },

  async deleteScore(id: string): Promise<boolean> {
    const scoreKey = `${SCORE_PREFIX}${id}`;

    try {
      await AsyncStorage.removeItem(scoreKey);
      await this.removeFromIndex(id);
      devLogger.info("TuneComposerStorage", `Deleted score: ${id}`);
      return true;
    } catch (error) {
      devLogger.error(
        "TuneComposerStorage",
        `Failed to delete score ${id}`,
        error,
      );
      return false;
    }
  },

  async listScores(): Promise<TuneScoreListResult> {
    try {
      const json = await AsyncStorage.getItem(SCORES_INDEX_KEY);
      if (!json) return { scores: [], total: 0 };

      const scores: TuneScoreMeta[] = JSON.parse(json);
      scores.sort((a, b) => b.updatedAt - a.updatedAt);

      return { scores, total: scores.length };
    } catch (error) {
      devLogger.error("TuneComposerStorage", "Failed to list scores", error);
      return { scores: [], total: 0 };
    }
  },

  async getScoreMeta(id: string): Promise<TuneScoreMeta | null> {
    const result = await this.listScores();
    return result.scores.find((s) => s.id === id) ?? null;
  },

  /**
   * Find a saved score by its importedFrom filename.
   * Used to preserve settings when re-importing a previously saved file.
   */
  async findScoreByImportedFrom(
    filename: string,
  ): Promise<TuneComposerScore | null> {
    const result = await this.listScores();
    for (const meta of result.scores) {
      const score = await this.loadScore(meta.id);
      if (score?.importedFrom === filename) {
        return score;
      }
    }
    return null;
  },

  // Autosave
  async autosave(score: TuneComposerScore): Promise<void> {
    try {
      const data = {
        score,
        savedAt: Date.now(),
      };
      await AsyncStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
    } catch (error) {
      devLogger.error("TuneComposerStorage", "Autosave failed", error);
    }
  },

  async loadAutosave(): Promise<TuneComposerScore | null> {
    try {
      const json = await AsyncStorage.getItem(AUTOSAVE_KEY);
      if (!json) return null;

      const data = JSON.parse(json);

      // Migrate score to ensure all properties have defaults
      let score = migrateScore(data.score as TuneComposerScore);

      // Clear slurPlacement on all notes so it auto-calculates from stem direction
      score = {
        ...score,
        measures: score.measures.map((measure) => ({
          ...measure,
          notes: measure.notes.map((note) => ({
            ...note,
            slurPlacement: undefined,
          })),
        })),
      };

      return score;
    } catch (error) {
      devLogger.error("TuneComposerStorage", "Failed to load autosave", error);
      return null;
    }
  },

  async clearAutosave(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AUTOSAVE_KEY);
    } catch (error) {
      devLogger.error("TuneComposerStorage", "Failed to clear autosave", error);
    }
  },

  async hasAutosave(): Promise<boolean> {
    try {
      const json = await AsyncStorage.getItem(AUTOSAVE_KEY);
      return json !== null;
    } catch {
      return false;
    }
  },

  // Export
  exportToMusicXml(score: TuneComposerScore, _options?: ExportOptions): string {
    return generateMusicXml(score, { exportMode: true });
  },

  getExportFilename(score: TuneComposerScore): string {
    const title = (score.title || "untitled")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return `${title}.musicxml`;
  },

  // Index helpers
  async updateIndex(meta: TuneScoreMeta): Promise<void> {
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
      devLogger.error("TuneComposerStorage", "Failed to update index", error);
    }
  },

  async removeFromIndex(id: string): Promise<void> {
    try {
      const result = await this.listScores();
      const filtered = result.scores.filter((s) => s.id !== id);
      await AsyncStorage.setItem(SCORES_INDEX_KEY, JSON.stringify(filtered));
    } catch (error) {
      devLogger.error(
        "TuneComposerStorage",
        "Failed to remove from index",
        error,
      );
    }
  },

  async clearAllData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const composerKeys = keys.filter((k) => k.startsWith(STORAGE_PREFIX));
      await AsyncStorage.multiRemove(composerKeys);
      devLogger.info("TuneComposerStorage", "Cleared all tune composer data");
    } catch (error) {
      devLogger.error("TuneComposerStorage", "Failed to clear all data", error);
    }
  },
};

// =============================================================================
// Autosave Handler
// =============================================================================

export function createAutosaveHandler(intervalMs: number = 30000): {
  scheduleAutosave: (score: TuneComposerScore) => void;
  cancelAutosave: () => void;
} {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingScore: TuneComposerScore | null = null;

  const doAutosave = async () => {
    if (pendingScore) {
      await tuneComposerStorageService.autosave(pendingScore);
      pendingScore = null;
    }
    timeoutId = null;
  };

  return {
    scheduleAutosave: (score: TuneComposerScore) => {
      pendingScore = score;
      if (timeoutId === null) {
        timeoutId = setTimeout(doAutosave, intervalMs);
      }
    },
    cancelAutosave: () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      pendingScore = null;
    },
  };
}
