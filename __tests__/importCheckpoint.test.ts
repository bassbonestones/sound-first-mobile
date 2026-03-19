/**
 * Import Checkpoint Service Tests
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock devLogger
jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
}));

import {
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
} from "../src/features/importMusic/services/importCheckpoint";

describe("importCheckpoint", () => {
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    mockAsyncStorage.removeItem.mockResolvedValue(undefined);
  });

  describe("generateCheckpointId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateCheckpointId();
      const id2 = generateCheckpointId();

      expect(id1).toMatch(/^chk_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^chk_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe("createCheckpoint", () => {
    it("should create a new checkpoint", async () => {
      const checkpoint = await createCheckpoint("test-id-1", {
        importType: "musicxml",
        filename: "test.musicxml",
        filePath: "/path/to/test.musicxml",
        fileSize: 1024,
      });

      expect(checkpoint.id).toBe("test-id-1");
      expect(checkpoint.importType).toBe("musicxml");
      expect(checkpoint.filename).toBe("test.musicxml");
      expect(checkpoint.stage).toBe("file_acquired");
      expect(checkpoint.progress).toBe(0);
      expect(checkpoint.failed).toBe(false);

      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it("should store checkpoint with proper timestamps", async () => {
      const before = Date.now();
      const checkpoint = await createCheckpoint("test-id-2", {
        importType: "image",
        filename: "photo.jpg",
      });
      const after = Date.now();

      expect(checkpoint.createdAt).toBeGreaterThanOrEqual(before);
      expect(checkpoint.createdAt).toBeLessThanOrEqual(after);
      expect(checkpoint.updatedAt).toBe(checkpoint.createdAt);
    });
  });

  describe("updateCheckpoint", () => {
    it("should update an existing checkpoint", async () => {
      const existingCheckpoints = {
        "test-id": {
          id: "test-id",
          createdAt: Date.now() - 1000,
          updatedAt: Date.now() - 1000,
          stage: "file_acquired",
          statusMessage: "Starting...",
          importType: "image",
          filename: "test.jpg",
          failed: false,
          progress: 0,
        } as ImportCheckpoint,
      };

      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify(existingCheckpoints),
      );

      const updated = await updateCheckpoint("test-id", {
        stage: "uploading",
        statusMessage: "Uploading file...",
        progress: 25,
      });

      expect(updated).not.toBeNull();
      expect(updated!.stage).toBe("uploading");
      expect(updated!.progress).toBe(25);
      expect(updated!.updatedAt).toBeGreaterThan(updated!.createdAt);
    });

    it("should return null for non-existent checkpoint", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await updateCheckpoint("non-existent", {
        stage: "uploading",
      });

      expect(result).toBeNull();
    });
  });

  describe("completeCheckpoint", () => {
    it("should remove the checkpoint on completion", async () => {
      const existingCheckpoints = {
        "test-id": {
          id: "test-id",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          stage: "saving",
          statusMessage: "Saving...",
          importType: "musicxml",
          filename: "test.musicxml",
          failed: false,
          progress: 90,
        } as ImportCheckpoint,
      };

      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify(existingCheckpoints),
      );

      await completeCheckpoint("test-id");

      const savedCall = mockAsyncStorage.setItem.mock.calls[0];
      const savedCheckpoints = JSON.parse(savedCall[1]);
      expect(savedCheckpoints["test-id"]).toBeUndefined();
    });
  });

  describe("removeCheckpoint", () => {
    it("should remove the specified checkpoint", async () => {
      const existingCheckpoints = {
        "keep-me": { id: "keep-me" } as ImportCheckpoint,
        "remove-me": { id: "remove-me" } as ImportCheckpoint,
      };

      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify(existingCheckpoints),
      );

      await removeCheckpoint("remove-me");

      const savedCall = mockAsyncStorage.setItem.mock.calls[0];
      const savedCheckpoints = JSON.parse(savedCall[1]);
      expect(savedCheckpoints["remove-me"]).toBeUndefined();
      expect(savedCheckpoints["keep-me"]).toBeDefined();
    });
  });

  describe("getCheckpoint", () => {
    it("should return the specified checkpoint", async () => {
      const checkpoint: ImportCheckpoint = {
        id: "test-id",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        stage: "omr_polling",
        statusMessage: "Processing...",
        importType: "pdf",
        filename: "score.pdf",
        omrJobId: "job-123",
        failed: false,
        progress: 50,
      };

      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({ "test-id": checkpoint }),
      );

      const result = await getCheckpoint("test-id");

      expect(result).toEqual(checkpoint);
    });

    it("should return null for non-existent checkpoint", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await getCheckpoint("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("getActiveCheckpoints", () => {
    it("should return all checkpoints", async () => {
      const checkpoints = {
        cp1: { id: "cp1", filename: "file1.xml" } as ImportCheckpoint,
        cp2: { id: "cp2", filename: "file2.pdf" } as ImportCheckpoint,
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(checkpoints));

      const result = await getActiveCheckpoints();

      expect(result).toHaveLength(2);
      expect(result.map((c) => c.id)).toContain("cp1");
      expect(result.map((c) => c.id)).toContain("cp2");
    });

    it("should return empty array when no checkpoints", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await getActiveCheckpoints();

      expect(result).toEqual([]);
    });
  });

  describe("isCheckpointStale", () => {
    it("should return true for checkpoints older than 24 hours", () => {
      const staleCheckpoint: ImportCheckpoint = {
        id: "stale",
        createdAt: Date.now() - 25 * 60 * 60 * 1000,
        updatedAt: Date.now() - 25 * 60 * 60 * 1000,
        stage: "omr_polling",
        statusMessage: "Processing...",
        importType: "image",
        filename: "old.jpg",
        failed: false,
        progress: 30,
      };

      expect(isCheckpointStale(staleCheckpoint)).toBe(true);
    });

    it("should return false for recent checkpoints", () => {
      const recentCheckpoint: ImportCheckpoint = {
        id: "recent",
        createdAt: Date.now() - 1 * 60 * 60 * 1000,
        updatedAt: Date.now() - 1 * 60 * 60 * 1000,
        stage: "omr_polling",
        statusMessage: "Processing...",
        importType: "image",
        filename: "recent.jpg",
        failed: false,
        progress: 30,
      };

      expect(isCheckpointStale(recentCheckpoint)).toBe(false);
    });
  });

  describe("cleanupStaleCheckpoints", () => {
    it("should remove stale checkpoints", async () => {
      const checkpoints = {
        stale: {
          id: "stale",
          updatedAt: Date.now() - 25 * 60 * 60 * 1000,
        } as ImportCheckpoint,
        recent: {
          id: "recent",
          updatedAt: Date.now() - 1 * 60 * 60 * 1000,
        } as ImportCheckpoint,
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(checkpoints));

      const removedCount = await cleanupStaleCheckpoints();

      expect(removedCount).toBe(1);

      const savedCall = mockAsyncStorage.setItem.mock.calls[0];
      const savedCheckpoints = JSON.parse(savedCall[1]);
      expect(savedCheckpoints["stale"]).toBeUndefined();
      expect(savedCheckpoints["recent"]).toBeDefined();
    });
  });

  describe("clearAllCheckpoints", () => {
    it("should remove the storage key", async () => {
      await clearAllCheckpoints();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(
        "@import_checkpoints",
      );
    });
  });

  describe("analyzeCheckpointForResume", () => {
    it("should suggest discard for failed checkpoints", () => {
      const failed: ImportCheckpoint = {
        id: "failed",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        stage: "uploading",
        statusMessage: "Failed",
        importType: "image",
        filename: "fail.jpg",
        failed: true,
        error: "Upload failed",
        progress: 20,
      };

      const result = analyzeCheckpointForResume(failed);

      expect(result.canResume).toBe(false);
      expect(result.suggestedAction).toBe("restart");
    });

    it("should suggest discard for stale checkpoints", () => {
      const stale: ImportCheckpoint = {
        id: "stale",
        createdAt: Date.now() - 25 * 60 * 60 * 1000,
        updatedAt: Date.now() - 25 * 60 * 60 * 1000,
        stage: "omr_polling",
        statusMessage: "Processing...",
        importType: "image",
        filename: "old.jpg",
        failed: false,
        progress: 30,
      };

      const result = analyzeCheckpointForResume(stale);

      expect(result.canResume).toBe(false);
      expect(result.suggestedAction).toBe("discard");
    });

    it("should allow resume for OMR polling with job ID", () => {
      const polling: ImportCheckpoint = {
        id: "polling",
        createdAt: Date.now() - 5 * 60 * 1000,
        updatedAt: Date.now() - 1 * 60 * 1000,
        stage: "omr_polling",
        statusMessage: "Processing...",
        importType: "pdf",
        filename: "score.pdf",
        omrJobId: "job-456",
        failed: false,
        progress: 50,
      };

      const result = analyzeCheckpointForResume(polling);

      expect(result.canResume).toBe(true);
      expect(result.suggestedAction).toBe("resume");
    });

    it("should suggest restart for OMR polling without job ID", () => {
      const noJob: ImportCheckpoint = {
        id: "no-job",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        stage: "omr_polling",
        statusMessage: "Processing...",
        importType: "pdf",
        filename: "score.pdf",
        failed: false,
        progress: 50,
      };

      const result = analyzeCheckpointForResume(noJob);

      expect(result.canResume).toBe(false);
      expect(result.suggestedAction).toBe("restart");
    });

    it("should allow resume for parsed stage with musicXml", () => {
      const parsed: ImportCheckpoint = {
        id: "parsed",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        stage: "parsing",
        statusMessage: "Parsing...",
        importType: "musicxml",
        filename: "score.musicxml",
        musicXml: "<score-partwise>...</score-partwise>",
        failed: false,
        progress: 80,
      };

      const result = analyzeCheckpointForResume(parsed);

      expect(result.canResume).toBe(true);
      expect(result.suggestedAction).toBe("resume");
    });
  });

  describe("getPendingImports", () => {
    it("should return resume contexts for all checkpoints", async () => {
      const checkpoints = {
        resumable: {
          id: "resumable",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          stage: "omr_polling",
          statusMessage: "Processing...",
          importType: "image",
          filename: "photo.jpg",
          omrJobId: "job-789",
          failed: false,
          progress: 40,
        } as ImportCheckpoint,
        notResumable: {
          id: "notResumable",
          createdAt: Date.now() - 25 * 60 * 60 * 1000,
          updatedAt: Date.now() - 25 * 60 * 60 * 1000,
          stage: "uploading",
          statusMessage: "Uploading...",
          importType: "pdf",
          filename: "old.pdf",
          failed: false,
          progress: 20,
        } as ImportCheckpoint,
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(checkpoints));

      const result = await getPendingImports();

      expect(result).toHaveLength(2);

      const resumable = result.find((r) => r.checkpoint.id === "resumable");
      expect(resumable?.canResume).toBe(true);

      const notResumable = result.find(
        (r) => r.checkpoint.id === "notResumable",
      );
      expect(notResumable?.canResume).toBe(false);
    });
  });
});
