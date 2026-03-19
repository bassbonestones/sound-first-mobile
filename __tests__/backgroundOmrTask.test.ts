/**
 * Background OMR Task Service Tests
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

// Mock constants - must come before imports that use them
jest.mock("../src/constants/import", () => ({
  IMPORT_TIMEOUTS: {
    OMR_POLL_INTERVAL: 5000,
    OMR_MAX_WAIT: 300000,
  },
}));

// Mock dynamic imports for expo-task-manager and expo-background-fetch
jest.mock(
  "expo-task-manager",
  () => {
    throw new Error("Module not found");
  },
  { virtual: true },
);

jest.mock(
  "expo-background-fetch",
  () => {
    throw new Error("Module not found");
  },
  { virtual: true },
);

import {
  startBackgroundOmrTask,
  stopBackgroundOmrTask,
  checkPendingBackgroundOmrTask,
  isBackgroundTaskSupported,
  type BackgroundOmrTaskState,
} from "../src/features/importMusic/services/backgroundOmrTask";

describe("backgroundOmrTask", () => {
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    mockAsyncStorage.removeItem.mockResolvedValue(undefined);
  });

  describe("startBackgroundOmrTask", () => {
    it("should save task state to AsyncStorage", async () => {
      const result = await startBackgroundOmrTask({
        jobId: "test-job-123",
        baseUrl: "https://api.example.com",
        authToken: "test-token",
      });

      // Returns false when expo-task-manager is not available
      expect(result).toBe(false);

      // Should still save state for foreground fallback
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        "@background_omr_task_state",
        expect.stringContaining("test-job-123"),
      );
    });

    it("should include expiration time in saved state", async () => {
      const beforeTime = Date.now();

      await startBackgroundOmrTask({
        jobId: "test-job-123",
        baseUrl: "https://api.example.com",
      });

      const savedCall = mockAsyncStorage.setItem.mock.calls[0];
      const savedState = JSON.parse(savedCall[1]) as BackgroundOmrTaskState;

      const afterTime = Date.now();

      expect(savedState.startedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(savedState.startedAt).toBeLessThanOrEqual(afterTime);
      expect(savedState.expiresAt).toBeGreaterThan(savedState.startedAt);
      expect(savedState.pollCount).toBe(0);
      expect(savedState.lastStatus).toBe("pending");
    });
  });

  describe("stopBackgroundOmrTask", () => {
    it("should clear task state from AsyncStorage", async () => {
      await stopBackgroundOmrTask();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(
        "@background_omr_task_state",
      );
    });
  });

  describe("checkPendingBackgroundOmrTask", () => {
    it("should return null when no task is pending", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await checkPendingBackgroundOmrTask();

      expect(result).toBeNull();
    });

    it("should return task state when a task is pending", async () => {
      const mockState: BackgroundOmrTaskState = {
        jobId: "test-job",
        baseUrl: "https://api.example.com",
        authToken: "token",
        startedAt: Date.now(),
        expiresAt: Date.now() + 300000,
        pollCount: 5,
        lastStatus: "processing",
        lastPollAt: Date.now(),
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockState));

      const result = await checkPendingBackgroundOmrTask();

      expect(result).toEqual(mockState);
    });

    it("should return null and clear state when task has expired", async () => {
      const expiredState: BackgroundOmrTaskState = {
        jobId: "test-job",
        baseUrl: "https://api.example.com",
        startedAt: Date.now() - 400000,
        expiresAt: Date.now() - 100000, // Already expired
        pollCount: 10,
        lastStatus: "processing",
        lastPollAt: Date.now() - 100000,
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(expiredState));

      const result = await checkPendingBackgroundOmrTask();

      expect(result).toBeNull();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(
        "@background_omr_task_state",
      );
    });

    it("should handle corrupted JSON gracefully", async () => {
      mockAsyncStorage.getItem.mockResolvedValue("not valid json");

      const result = await checkPendingBackgroundOmrTask();

      expect(result).toBeNull();
    });
  });

  describe("isBackgroundTaskSupported", () => {
    it("should return false when expo-task-manager is not installed", async () => {
      const result = await isBackgroundTaskSupported();

      expect(result).toBe(false);
    });
  });
});

describe("backgroundOmrTask with expo-task-manager", () => {
  // This would test the full functionality when expo-task-manager is available
  // For now we just verify the API contract

  it("should export all required functions", () => {
    expect(typeof startBackgroundOmrTask).toBe("function");
    expect(typeof stopBackgroundOmrTask).toBe("function");
    expect(typeof checkPendingBackgroundOmrTask).toBe("function");
    expect(typeof isBackgroundTaskSupported).toBe("function");
  });
});
