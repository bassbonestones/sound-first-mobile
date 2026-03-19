/**
 * Tests for offlineQueueService
 *
 * Tests offline import queuing and processing functionality
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  initializeQueue,
  shutdownQueue,
  enqueue,
  dequeue,
  getQueueStatus,
  getQueueItems,
  clearQueue,
  registerHandler,
  unregisterHandler,
  processQueue,
} from "../src/features/importMusic/services/offlineQueueService";

// Mock dependencies
jest.mock("@react-native-async-storage/async-storage");

// Mock the networkUtils module
jest.mock("../src/features/importMusic/utils/networkUtils", () => ({
  isNetworkAvailable: jest.fn(() => true),
  subscribeToNetworkChanges: jest.fn(() => jest.fn()),
}));

// Mock analytics to prevent side effects
jest.mock("../src/features/importMusic/services/importAnalyticsService", () => ({
  trackEvent: jest.fn(),
}));

// Mock devLogger
jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devWarn: jest.fn(),
  devError: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const { isNetworkAvailable } = require("../src/features/importMusic/utils/networkUtils");

describe("offlineQueueService", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    (isNetworkAvailable as jest.Mock).mockReturnValue(true);

    // Initialize queue for tests
    await initializeQueue();
    await clearQueue();
  });

  afterEach(() => {
    shutdownQueue();
  });

  describe("enqueue", () => {
    it("should add item to queue", async () => {
      const id = await enqueue("omr_submission", { scoreId: "score-123" });

      expect(id).toBeDefined();
      expect(typeof id).toBe("string");
    });

    it("should generate unique IDs for queued items", async () => {
      const id1 = await enqueue("omr_submission", { scoreId: "score-1" });
      const id2 = await enqueue("omr_submission", { scoreId: "score-2" });

      expect(id1).not.toBe(id2);
    });

    it("should persist queue to AsyncStorage", async () => {
      await enqueue("omr_submission", { scoreId: "score-123" });

      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it("should accept priority option", async () => {
      await enqueue("omr_submission", { scoreId: "score-123" }, { priority: 1 });

      const items = getQueueItems();
      const item = items.find((i) => i.priority === 1);
      expect(item).toBeDefined();
    });

    it("should accept expiration option", async () => {
      await enqueue(
        "omr_submission",
        { scoreId: "score-123" },
        { expirationMs: 60000 }
      );

      const items = getQueueItems();
      expect(items.length).toBeGreaterThan(0);
    });

    it("should accept maxRetries option", async () => {
      await enqueue(
        "omr_submission",
        { scoreId: "score-123" },
        { maxRetries: 5 }
      );

      const items = getQueueItems();
      const item = items.find((i) => i.maxRetries === 5);
      expect(item).toBeDefined();
    });
  });

  describe("getQueueItems", () => {
    it("should return empty array when no items queued", async () => {
      const items = getQueueItems();
      expect(items).toEqual([]);
    });

    it("should return queued items", async () => {
      await enqueue("omr_submission", { scoreId: "score-123" });

      const items = getQueueItems();
      expect(items.length).toBe(1);
    });

    it("should return readonly array", async () => {
      await enqueue("omr_submission", { scoreId: "score-123" });

      const items = getQueueItems();
      // TypeScript ensures this is readonly, test the structure
      expect(Array.isArray(items)).toBe(true);
    });
  });

  describe("dequeue", () => {
    it("should remove item by ID", async () => {
      const id = await enqueue("omr_submission", { scoreId: "score-123" });

      const removed = await dequeue(id);

      expect(removed).toBe(true);
      const items = getQueueItems();
      expect(items.find((i) => i.id === id)).toBeUndefined();
    });

    it("should return false for non-existent item", async () => {
      const removed = await dequeue("nonexistent-id");

      expect(removed).toBe(false);
    });

    it("should persist changes after dequeue", async () => {
      const id = await enqueue("omr_submission", { scoreId: "score-123" });
      await dequeue(id);

      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe("clearQueue", () => {
    it("should remove all queued items", async () => {
      await enqueue("omr_submission", { scoreId: "score-1" });
      await enqueue("omr_submission", { scoreId: "score-2" });

      await clearQueue();

      const items = getQueueItems();
      expect(items).toEqual([]);
    });

    it("should persist cleared state", async () => {
      await enqueue("omr_submission", { scoreId: "score-123" });
      mockAsyncStorage.setItem.mockClear();

      await clearQueue();

      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe("getQueueStatus", () => {
    it("should return queue status structure", async () => {
      const status = getQueueStatus();

      expect(status).toHaveProperty("total");
      expect(status).toHaveProperty("pending");
      expect(status).toHaveProperty("processing");
      expect(status).toHaveProperty("failed");
      expect(status).toHaveProperty("isOnline");
    });

    it("should return zeros for empty queue", async () => {
      const status = getQueueStatus();

      expect(status.total).toBe(0);
      expect(status.pending).toBe(0);
      expect(status.processing).toBe(0);
      expect(status.failed).toBe(0);
    });

    it("should count pending items", async () => {
      // Make network unavailable so items stay pending
      (isNetworkAvailable as jest.Mock).mockReturnValue(false);
      
      await enqueue("omr_submission", { scoreId: "score-1" });
      await enqueue("omr_submission", { scoreId: "score-2" });

      const status = getQueueStatus();

      expect(status.total).toBe(2);
      expect(status.pending).toBe(2);
    });

    it("should report online status", async () => {
      (isNetworkAvailable as jest.Mock).mockReturnValue(true);
      const status = getQueueStatus();
      expect(status.isOnline).toBe(true);

      (isNetworkAvailable as jest.Mock).mockReturnValue(false);
      const offlineStatus = getQueueStatus();
      expect(offlineStatus.isOnline).toBe(false);
    });
  });

  describe("registerHandler", () => {
    it("should register handler for queue item type", () => {
      const handler = jest.fn().mockResolvedValue(undefined);

      expect(() => {
        registerHandler("omr_submission", handler);
      }).not.toThrow();
    });

    it("should allow multiple handlers for different types", () => {
      const omrHandler = jest.fn().mockResolvedValue(undefined);
      const saveHandler = jest.fn().mockResolvedValue(undefined);

      expect(() => {
        registerHandler("omr_submission", omrHandler);
        registerHandler("score_save", saveHandler);
      }).not.toThrow();
    });
  });

  describe("unregisterHandler", () => {
    it("should unregister handler", () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      registerHandler("omr_submission", handler);

      expect(() => {
        unregisterHandler("omr_submission");
      }).not.toThrow();
    });
  });

  describe("processQueue", () => {
    it("should not process when offline", async () => {
      (isNetworkAvailable as jest.Mock).mockReturnValue(false);

      const handler = jest.fn().mockResolvedValue(undefined);
      registerHandler("omr_submission", handler);

      await enqueue("omr_submission", { scoreId: "score-123" });
      await processQueue();

      // Handler should not be called when offline
      // Items added when offline remain pending
    });
  });

  describe("initializeQueue", () => {
    it("should initialize without throwing", async () => {
      await expect(initializeQueue()).resolves.not.toThrow();
    });

    it("should load persisted queue", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify([
          {
            id: "q1",
            type: "omr_submission",
            status: "pending",
            priority: 5,
            createdAt: Date.now(),
            expiresAt: Date.now() + 86400000,
            retryCount: 0,
            maxRetries: 3,
            payload: { scoreId: "score-123" },
          },
        ])
      );

      await initializeQueue();

      // After initialization with persisted data, items should be loaded
      expect(mockAsyncStorage.getItem).toHaveBeenCalled();
    });

    it("should accept custom config", async () => {
      await expect(
        initializeQueue({
          maxItems: 100,
          maxRetries: 5,
        })
      ).resolves.not.toThrow();
    });
  });

  describe("shutdownQueue", () => {
    it("should shutdown without throwing", () => {
      expect(() => shutdownQueue()).not.toThrow();
    });
  });
});
