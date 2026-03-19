/**
 * Composer Storage Service Tests
 *
 * Tests for score persistence and export functionality.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  composerStorageService,
  createAutosaveHandler,
} from "../src/features/composer/services/composerStorageService";
import {
  createScore,
  createMeasure,
  createNote,
} from "../src/features/composer/types";
import type { ComposerScore } from "../src/features/composer/types";

// =============================================================================
// Test Helpers
// =============================================================================

function createTestScore(title: string = "Test Score"): ComposerScore {
  return createScore({
    title,
    measures: [
      createMeasure([createNote(60, 1), createNote(62, 1), createNote(64, 2)]),
    ],
  });
}

// =============================================================================
// Tests
// =============================================================================

describe("composerStorageService", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe("saveScore", () => {
    it("should save a score and return metadata", async () => {
      const score = createTestScore("My Song");

      const meta = await composerStorageService.saveScore(score);

      expect(meta.id).toBe(score.id);
      expect(meta.title).toBe("My Song");
      expect(meta.clef).toBe("treble");
      expect(meta.measureCount).toBe(1);
      expect(meta.updatedAt).toBeLessThanOrEqual(Date.now());
      expect(meta.createdAt).toBeLessThanOrEqual(Date.now());
    });

    it("should preserve createdAt on subsequent saves", async () => {
      const score = createTestScore();

      const meta1 = await composerStorageService.saveScore(score);
      const createdAt = meta1.createdAt;

      // Wait a tick to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      score.title = "Updated Title";
      const meta2 = await composerStorageService.saveScore(score);

      expect(meta2.createdAt).toBe(createdAt);
      expect(meta2.updatedAt).toBeGreaterThan(meta2.createdAt);
    });

    it("should default title to Untitled", async () => {
      const score = createTestScore();
      score.title = undefined;

      const meta = await composerStorageService.saveScore(score);

      expect(meta.title).toBe("Untitled");
    });
  });

  describe("loadScore", () => {
    it("should load a previously saved score", async () => {
      const score = createTestScore("Loaded Song");
      await composerStorageService.saveScore(score);

      const loaded = await composerStorageService.loadScore(score.id);

      expect(loaded).not.toBeNull();
      expect(loaded?.id).toBe(score.id);
      expect(loaded?.title).toBe("Loaded Song");
      expect(loaded?.measures).toHaveLength(1);
    });

    it("should return null for non-existent score", async () => {
      const loaded = await composerStorageService.loadScore("non-existent-id");

      expect(loaded).toBeNull();
    });
  });

  describe("deleteScore", () => {
    it("should delete a score and remove from index", async () => {
      const score = createTestScore();
      await composerStorageService.saveScore(score);

      const deleted = await composerStorageService.deleteScore(score.id);

      expect(deleted).toBe(true);

      const loaded = await composerStorageService.loadScore(score.id);
      expect(loaded).toBeNull();

      const list = await composerStorageService.listScores();
      expect(list.scores.find((s) => s.id === score.id)).toBeUndefined();
    });

    it("should return true for non-existent score", async () => {
      const deleted = await composerStorageService.deleteScore("non-existent");
      expect(deleted).toBe(true);
    });
  });

  describe("listScores", () => {
    it("should return empty list when no scores saved", async () => {
      const result = await composerStorageService.listScores();

      expect(result.scores).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("should list all saved scores", async () => {
      const score1 = createTestScore("Score 1");
      const score2 = createTestScore("Score 2");

      await composerStorageService.saveScore(score1);
      await composerStorageService.saveScore(score2);

      const result = await composerStorageService.listScores();

      expect(result.total).toBe(2);
      expect(result.scores.map((s) => s.title)).toContain("Score 1");
      expect(result.scores.map((s) => s.title)).toContain("Score 2");
    });

    it("should sort by updatedAt descending", async () => {
      const score1 = createTestScore("Older");
      const score2 = createTestScore("Newer");

      await composerStorageService.saveScore(score1);
      await new Promise((resolve) => setTimeout(resolve, 10));
      await composerStorageService.saveScore(score2);

      const result = await composerStorageService.listScores();

      expect(result.scores[0].title).toBe("Newer");
      expect(result.scores[1].title).toBe("Older");
    });
  });

  describe("getScoreMeta", () => {
    it("should return metadata for existing score", async () => {
      const score = createTestScore("Meta Test");
      await composerStorageService.saveScore(score);

      const meta = await composerStorageService.getScoreMeta(score.id);

      expect(meta).not.toBeNull();
      expect(meta?.title).toBe("Meta Test");
    });

    it("should return null for non-existent score", async () => {
      const meta = await composerStorageService.getScoreMeta("non-existent");

      expect(meta).toBeNull();
    });
  });

  describe("autosave", () => {
    it("should save to autosave slot", async () => {
      const score = createTestScore("Autosave Test");

      await composerStorageService.autosave(score);

      const loaded = await composerStorageService.loadAutosave();
      expect(loaded).not.toBeNull();
      expect(loaded?.title).toBe("Autosave Test");
    });

    it("should report hasAutosave correctly", async () => {
      expect(await composerStorageService.hasAutosave()).toBe(false);

      await composerStorageService.autosave(createTestScore());

      expect(await composerStorageService.hasAutosave()).toBe(true);
    });

    it("should clear autosave", async () => {
      await composerStorageService.autosave(createTestScore());
      await composerStorageService.clearAutosave();

      expect(await composerStorageService.hasAutosave()).toBe(false);
      expect(await composerStorageService.loadAutosave()).toBeNull();
    });
  });

  describe("export", () => {
    it("should export to MusicXML string", () => {
      const score = createTestScore("Export Test");

      const xml = composerStorageService.exportToMusicXml(score);

      expect(xml).toContain("<?xml");
      expect(xml).toContain("Export Test");
      expect(xml).toContain("<part");
    });

    it("should generate safe filename", () => {
      const score = createTestScore("My Test Song!");

      const filename = composerStorageService.getExportFilename(score);

      expect(filename).toBe("my-test-song.musicxml");
    });

    it("should handle untitled scores", () => {
      const score = createTestScore();
      score.title = undefined;

      const filename = composerStorageService.getExportFilename(score);

      expect(filename).toBe("untitled.musicxml");
    });
  });

  describe("clearAllData", () => {
    it("should remove all composer data", async () => {
      const score1 = createTestScore("To Delete 1");
      const score2 = createTestScore("To Delete 2");
      await composerStorageService.saveScore(score1);
      await composerStorageService.saveScore(score2);
      await composerStorageService.autosave(score1);

      await composerStorageService.clearAllData();

      const list = await composerStorageService.listScores();
      expect(list.total).toBe(0);

      const autosave = await composerStorageService.loadAutosave();
      expect(autosave).toBeNull();
    });
  });
});

describe("createAutosaveHandler", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should schedule autosave after interval", async () => {
    const handler = createAutosaveHandler(1000);
    const score = createTestScore("Scheduled");

    handler.scheduleAutosave(score);

    // Before interval
    expect(await composerStorageService.hasAutosave()).toBe(false);

    // After interval
    jest.advanceTimersByTime(1000);
    await Promise.resolve(); // Let async operations complete

    // Need to actually run the autosave
    jest.runAllTimers();
    await Promise.resolve();
  });

  it("should cancel scheduled autosave", async () => {
    const handler = createAutosaveHandler(1000);
    const score = createTestScore("Cancelled");

    handler.scheduleAutosave(score);
    handler.cancelAutosave();

    jest.advanceTimersByTime(2000);
    await Promise.resolve();

    expect(await composerStorageService.hasAutosave()).toBe(false);
  });

  it("should reset timer on subsequent calls", async () => {
    const handler = createAutosaveHandler(1000);
    const score1 = createTestScore("First");
    const score2 = createTestScore("Second");

    handler.scheduleAutosave(score1);

    // Advance part way
    jest.advanceTimersByTime(500);

    // Schedule new save (should reset timer)
    handler.scheduleAutosave(score2);

    // Advance past original timeout but not new one
    jest.advanceTimersByTime(600);

    // Autosave should not have triggered yet since we reset
    expect(await composerStorageService.hasAutosave()).toBe(false);
  });
});
