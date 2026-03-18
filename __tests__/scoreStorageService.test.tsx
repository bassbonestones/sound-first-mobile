/**
 * Tests for scoreStorageService
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
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
  type SaveScoreInput,
  type StoredScore,
} from "../src/features/importMusic/services/scoreStorageService";
import type { ImportedScore, ImportedPart } from "../src/types/import";

// ============================================================================
// Test Helpers
// ============================================================================

function createMockScore(
  overrides: Partial<ImportedScore> = {},
): ImportedScore {
  return {
    id: "test-score-1",
    metadata: {
      title: "Test Score",
      composer: "Test Composer",
      arranger: null,
      movementTitle: null,
      workTitle: null,
      copyright: null,
      keySignature: { fifths: 0, mode: "major", displayName: "C Major" },
      timeSignature: { beats: 4, beatType: 4, displayName: "4/4" },
      tempo: null,
    },
    parts: [
      {
        id: "P1",
        name: "Piano",
        abbreviation: "Pno.",
        measures: [],
      } as ImportedPart,
    ],
    measureCount: 16,
    sourceInfo: {
      sourceType: "musicxml",
      fileName: "test.musicxml",
      fileSize: 1024,
      mimeType: "application/vnd.recordare.musicxml+xml",
      importedAt: "2026-03-17T12:00:00Z",
    },
    confidence: null,
    ...overrides,
  };
}

function createSaveInput(
  overrides: Partial<SaveScoreInput> = {},
): SaveScoreInput {
  return {
    score: createMockScore(),
    rawMusicXml: '<?xml version="1.0"?><score-partwise></score-partwise>',
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe("scoreStorageService", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe("generateScoreId", () => {
    it("generates unique IDs", () => {
      const id1 = generateScoreId();
      const id2 = generateScoreId();

      expect(id1).not.toEqual(id2);
      expect(id1).toMatch(/^score_[a-z0-9]+_[a-z0-9]+$/);
    });

    it("includes score_ prefix", () => {
      const id = generateScoreId();
      expect(id.startsWith("score_")).toBe(true);
    });
  });

  describe("saveScore", () => {
    it("saves a score successfully", async () => {
      const input = createSaveInput();
      const result = await saveScore(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.storageMetadata.id).toMatch(/^score_/);
        expect(result.data.score).toEqual(input.score);
        expect(result.data.rawMusicXml).toEqual(input.rawMusicXml);
        expect(result.data.storageMetadata.savedAt).toBeDefined();
        expect(result.data.storageMetadata.tags).toEqual([]);
        expect(result.data.storageMetadata.isFavorite).toBe(false);
      }
    });

    it("saves with tags and favorite", async () => {
      const input = createSaveInput({
        tags: ["classical", "piano"],
        isFavorite: true,
      });
      const result = await saveScore(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.storageMetadata.tags).toEqual([
          "classical",
          "piano",
        ]);
        expect(result.data.storageMetadata.isFavorite).toBe(true);
      }
    });

    it("updates index when saving", async () => {
      await saveScore(createSaveInput());
      await saveScore(createSaveInput());

      const countResult = await getScoreCount();
      expect(countResult.success).toBe(true);
      if (countResult.success) {
        expect(countResult.data).toBe(2);
      }
    });

    it("handles storage errors gracefully", async () => {
      // Mock a storage error
      jest
        .spyOn(AsyncStorage, "setItem")
        .mockRejectedValueOnce(new Error("Storage full"));

      const input = createSaveInput();
      const result = await saveScore(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("save_failed");
        expect(result.error.details).toContain("Storage full");
      }
    });
  });

  describe("getScore", () => {
    it("retrieves a saved score", async () => {
      const saveResult = await saveScore(createSaveInput());
      expect(saveResult.success).toBe(true);
      if (!saveResult.success) return;

      const id = saveResult.data.storageMetadata.id;
      const getResult = await getScore(id);

      expect(getResult.success).toBe(true);
      if (getResult.success) {
        expect(getResult.data.score.metadata.title).toBe("Test Score");
      }
    });

    it("returns not_found for missing score", async () => {
      const result = await getScore("nonexistent-id");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("not_found");
      }
    });

    it("updates lastAccessedAt on get", async () => {
      const saveResult = await saveScore(createSaveInput());
      expect(saveResult.success).toBe(true);
      if (!saveResult.success) return;

      const id = saveResult.data.storageMetadata.id;
      const originalAccessTime = saveResult.data.storageMetadata.lastAccessedAt;

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const getResult = await getScore(id);
      expect(getResult.success).toBe(true);
      if (getResult.success) {
        expect(getResult.data.storageMetadata.lastAccessedAt).not.toBe(
          originalAccessTime,
        );
      }
    });
  });

  describe("listScores", () => {
    it("returns empty array when no scores", async () => {
      const result = await listScores();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it("returns summaries for all scores", async () => {
      await saveScore(
        createSaveInput({ score: createMockScore({ id: "s1" }) }),
      );
      await saveScore(
        createSaveInput({
          score: createMockScore({
            id: "s2",
            metadata: {
              title: "Second Score",
              composer: "Another Composer",
              arranger: null,
              movementTitle: null,
              workTitle: null,
              copyright: null,
              keySignature: null,
              timeSignature: null,
              tempo: null,
            },
          }),
        }),
      );

      const result = await listScores();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(2);
        // Most recent first
        expect(result.data[0].title).toBe("Second Score");
        expect(result.data[1].title).toBe("Test Score");
      }
    });

    it("returns summary with correct fields", async () => {
      await saveScore(
        createSaveInput({
          tags: ["test"],
          isFavorite: true,
        }),
      );

      const result = await listScores();

      expect(result.success).toBe(true);
      if (result.success) {
        const summary = result.data[0];
        expect(summary.title).toBe("Test Score");
        expect(summary.composer).toBe("Test Composer");
        expect(summary.partCount).toBe(1);
        expect(summary.measureCount).toBe(16);
        expect(summary.tags).toEqual(["test"]);
        expect(summary.isFavorite).toBe(true);
        expect(summary.sourceType).toBe("musicxml");
      }
    });

    it("cleans up orphaned index entries", async () => {
      // Save a score
      const result = await saveScore(createSaveInput());
      expect(result.success).toBe(true);
      if (!result.success) return;

      // Manually corrupt the index by adding a fake ID
      const indexData = await AsyncStorage.getItem("@soundfirst/scores_index");
      const index = JSON.parse(indexData || "[]");
      index.push("fake-id");
      await AsyncStorage.setItem(
        "@soundfirst/scores_index",
        JSON.stringify(index),
      );

      // List should clean up the fake entry
      const listResult = await listScores();
      expect(listResult.success).toBe(true);
      if (listResult.success) {
        expect(listResult.data.length).toBe(1);
      }

      // Index should be cleaned
      const cleanedIndex = await AsyncStorage.getItem(
        "@soundfirst/scores_index",
      );
      expect(JSON.parse(cleanedIndex || "[]").length).toBe(1);
    });
  });

  describe("updateScore", () => {
    it("updates tags", async () => {
      const saveResult = await saveScore(createSaveInput());
      expect(saveResult.success).toBe(true);
      if (!saveResult.success) return;

      const id = saveResult.data.storageMetadata.id;
      const updateResult = await updateScore(id, { tags: ["updated", "tags"] });

      expect(updateResult.success).toBe(true);
      if (updateResult.success) {
        expect(updateResult.data.storageMetadata.tags).toEqual([
          "updated",
          "tags",
        ]);
      }
    });

    it("updates favorite status", async () => {
      const saveResult = await saveScore(createSaveInput());
      expect(saveResult.success).toBe(true);
      if (!saveResult.success) return;

      const id = saveResult.data.storageMetadata.id;
      const updateResult = await updateScore(id, { isFavorite: true });

      expect(updateResult.success).toBe(true);
      if (updateResult.success) {
        expect(updateResult.data.storageMetadata.isFavorite).toBe(true);
      }
    });

    it("returns not_found for missing score", async () => {
      const result = await updateScore("nonexistent", { tags: ["test"] });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("not_found");
      }
    });
  });

  describe("deleteScore", () => {
    it("deletes a score", async () => {
      const saveResult = await saveScore(createSaveInput());
      expect(saveResult.success).toBe(true);
      if (!saveResult.success) return;

      const id = saveResult.data.storageMetadata.id;
      const deleteResult = await deleteScore(id);

      expect(deleteResult.success).toBe(true);

      // Verify it's gone
      const exists = await scoreExists(id);
      expect(exists).toBe(false);
    });

    it("removes from index when deleting", async () => {
      const saveResult = await saveScore(createSaveInput());
      expect(saveResult.success).toBe(true);
      if (!saveResult.success) return;

      const id = saveResult.data.storageMetadata.id;
      await deleteScore(id);

      const countResult = await getScoreCount();
      expect(countResult.success).toBe(true);
      if (countResult.success) {
        expect(countResult.data).toBe(0);
      }
    });

    it("returns not_found for missing score", async () => {
      const result = await deleteScore("nonexistent");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("not_found");
      }
    });
  });

  describe("deleteAllScores", () => {
    it("deletes all scores", async () => {
      await saveScore(createSaveInput());
      await saveScore(createSaveInput());
      await saveScore(createSaveInput());

      const result = await deleteAllScores();
      expect(result.success).toBe(true);

      const countResult = await getScoreCount();
      expect(countResult.success).toBe(true);
      if (countResult.success) {
        expect(countResult.data).toBe(0);
      }
    });

    it("handles empty storage", async () => {
      const result = await deleteAllScores();
      expect(result.success).toBe(true);
    });
  });

  describe("getScoreCount", () => {
    it("returns 0 when no scores", async () => {
      const result = await getScoreCount();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(0);
      }
    });

    it("returns correct count", async () => {
      await saveScore(createSaveInput());
      await saveScore(createSaveInput());

      const result = await getScoreCount();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(2);
      }
    });
  });

  describe("scoreExists", () => {
    it("returns true for existing score", async () => {
      const saveResult = await saveScore(createSaveInput());
      expect(saveResult.success).toBe(true);
      if (!saveResult.success) return;

      const exists = await scoreExists(saveResult.data.storageMetadata.id);
      expect(exists).toBe(true);
    });

    it("returns false for missing score", async () => {
      const exists = await scoreExists("nonexistent");
      expect(exists).toBe(false);
    });
  });

  describe("toggleFavorite", () => {
    it("toggles favorite from false to true", async () => {
      const saveResult = await saveScore(createSaveInput());
      expect(saveResult.success).toBe(true);
      if (!saveResult.success) return;

      const id = saveResult.data.storageMetadata.id;
      const toggleResult = await toggleFavorite(id);

      expect(toggleResult.success).toBe(true);
      if (toggleResult.success) {
        expect(toggleResult.data.storageMetadata.isFavorite).toBe(true);
      }
    });

    it("toggles favorite from true to false", async () => {
      const saveResult = await saveScore(createSaveInput({ isFavorite: true }));
      expect(saveResult.success).toBe(true);
      if (!saveResult.success) return;

      const id = saveResult.data.storageMetadata.id;
      const toggleResult = await toggleFavorite(id);

      expect(toggleResult.success).toBe(true);
      if (toggleResult.success) {
        expect(toggleResult.data.storageMetadata.isFavorite).toBe(false);
      }
    });
  });

  describe("getFavoriteScores", () => {
    it("returns only favorite scores", async () => {
      await saveScore(createSaveInput({ isFavorite: false }));
      await saveScore(createSaveInput({ isFavorite: true }));
      await saveScore(createSaveInput({ isFavorite: false }));
      await saveScore(createSaveInput({ isFavorite: true }));

      const result = await getFavoriteScores();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(2);
        expect(result.data.every((s) => s.isFavorite)).toBe(true);
      }
    });

    it("returns empty when no favorites", async () => {
      await saveScore(createSaveInput({ isFavorite: false }));

      const result = await getFavoriteScores();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });
});
