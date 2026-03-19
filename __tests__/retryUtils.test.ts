/**
 * Retry Utilities Tests
 *
 * Tests for retry logic, exponential backoff, abort handling.
 */

// Mock devLogger
jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devError: jest.fn(),
}));

import {
  retryWithBackoff,
  retryOnFailureResult,
  type RetryOptions,
  type RetryResult,
} from "../src/features/importMusic/utils/retryUtils";

describe("retryUtils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("retryWithBackoff", () => {
    it("should return success on first attempt if operation succeeds", async () => {
      const operation = jest.fn().mockResolvedValue("success");

      const resultPromise = retryWithBackoff(operation);
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("success");
      }
      expect(result.attempts).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should retry on retryable errors", async () => {
      const networkError = new Error("network error");
      const operation = jest
        .fn()
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue("success");

      const resultPromise = retryWithBackoff(operation, {
        maxRetries: 3,
        baseDelayMs: 100,
        jitter: false,
      });

      // Advance timers for each retry
      await jest.advanceTimersByTimeAsync(100); // First retry
      await jest.advanceTimersByTimeAsync(200); // Second retry (exponential)

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it("should not retry non-retryable errors (4xx)", async () => {
      const clientError = Object.assign(new Error("Bad Request"), {
        status: 400,
      });
      const operation = jest.fn().mockRejectedValue(clientError);

      const resultPromise = retryWithBackoff(operation, {
        maxRetries: 3,
      });
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should retry server errors (5xx)", async () => {
      const serverError = Object.assign(new Error("Internal Server Error"), {
        status: 500,
      });
      const operation = jest
        .fn()
        .mockRejectedValueOnce(serverError)
        .mockResolvedValue("recovered");

      const resultPromise = retryWithBackoff(operation, {
        maxRetries: 3,
        baseDelayMs: 100,
        jitter: false,
      });

      await jest.advanceTimersByTimeAsync(100);
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
    });

    it("should fail after max retries exhausted", async () => {
      const error = new Error("network timeout");
      const operation = jest.fn().mockRejectedValue(error);

      const resultPromise = retryWithBackoff(operation, {
        maxRetries: 2,
        baseDelayMs: 100,
        jitter: false,
      });

      await jest.advanceTimersByTimeAsync(100);
      await jest.advanceTimersByTimeAsync(200);
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3); // Initial + 2 retries
      expect(operation).toHaveBeenCalledTimes(3);
      expect(result.error).toBe(error);
    });

    it("should respect abort signal", async () => {
      const controller = new AbortController();

      // Abort before starting
      controller.abort();

      const operation = jest.fn().mockResolvedValue("success");

      const result = await retryWithBackoff(operation, {
        signal: controller.signal,
      });

      expect(result.success).toBe(false);
      expect(result.error).toEqual(
        expect.objectContaining({ message: expect.stringContaining("abort") }),
      );
    });

    it("should abort during sleep between retries", async () => {
      const controller = new AbortController();
      const error = new Error("network error");
      const operation = jest.fn().mockRejectedValue(error);

      const resultPromise = retryWithBackoff(operation, {
        maxRetries: 3,
        baseDelayMs: 1000,
        signal: controller.signal,
        jitter: false,
      });

      // Let first attempt fail
      await Promise.resolve();

      // Abort during the sleep
      controller.abort();
      jest.runAllTimers();

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should call onRetry callback", async () => {
      const error = new Error("connection timeout");
      const onRetry = jest.fn();
      const operation = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue("success");

      const resultPromise = retryWithBackoff(operation, {
        maxRetries: 3,
        baseDelayMs: 100,
        jitter: false,
        onRetry,
      });

      await jest.advanceTimersByTimeAsync(100);
      await resultPromise;

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, error, 100);
    });

    it("should apply exponential backoff", async () => {
      const delays: number[] = [];
      const error = new Error("network error");
      const operation = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValue("success");

      const resultPromise = retryWithBackoff(operation, {
        maxRetries: 3,
        baseDelayMs: 100,
        backoffMultiplier: 2,
        jitter: false,
        onRetry: (_attempt, _error, delay) => delays.push(delay),
      });

      // First retry: 100ms
      await jest.advanceTimersByTimeAsync(100);
      // Second retry: 200ms
      await jest.advanceTimersByTimeAsync(200);
      // Third retry: 400ms
      await jest.advanceTimersByTimeAsync(400);

      await resultPromise;

      expect(delays).toEqual([100, 200, 400]);
    });

    it("should respect maxDelayMs cap", async () => {
      const delays: number[] = [];
      const error = new Error("network error");
      const operation = jest.fn().mockRejectedValue(error);

      const resultPromise = retryWithBackoff(operation, {
        maxRetries: 5,
        baseDelayMs: 100,
        maxDelayMs: 250,
        backoffMultiplier: 2,
        jitter: false,
        onRetry: (_attempt, _error, delay) => delays.push(delay),
      });

      // Advance enough time for all retries
      await jest.advanceTimersByTimeAsync(2000);
      await resultPromise;

      // Delays should be capped at 250ms
      expect(delays).toEqual([100, 200, 250, 250, 250]);
    });

    it("should use custom isRetryable function", async () => {
      const customError = { code: "RETRY_ME" };
      const isRetryable = jest.fn((error: unknown) => {
        return (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "RETRY_ME"
        );
      });

      const operation = jest
        .fn()
        .mockRejectedValueOnce(customError)
        .mockResolvedValue("success");

      const resultPromise = retryWithBackoff(operation, {
        maxRetries: 3,
        baseDelayMs: 100,
        jitter: false,
        isRetryable,
      });

      await jest.advanceTimersByTimeAsync(100);
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(isRetryable).toHaveBeenCalledWith(customError);
    });
  });

  describe("retryOnFailureResult", () => {
    it("should succeed on first attempt if result.success is true", async () => {
      const operation = jest
        .fn()
        .mockResolvedValue({ success: true, data: "result" });

      const resultPromise = retryOnFailureResult(operation);
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(1);
    });

    it("should retry when result.success is false", async () => {
      const operation = jest
        .fn()
        .mockResolvedValueOnce({ success: false, error: "temp error" })
        .mockResolvedValue({ success: true, data: "result" });

      const resultPromise = retryOnFailureResult(operation, undefined, {
        maxRetries: 3,
        baseDelayMs: 100,
        jitter: false,
      });

      await jest.advanceTimersByTimeAsync(100);
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
    });

    it("should use custom shouldRetry function", async () => {
      interface CustomResult {
        success: boolean;
        retryable: boolean;
      }

      const shouldRetry = (result: CustomResult) =>
        !result.success && result.retryable;

      const operation = jest
        .fn()
        .mockResolvedValueOnce({ success: false, retryable: true })
        .mockResolvedValue({ success: true, retryable: false });

      const resultPromise = retryOnFailureResult(operation, shouldRetry, {
        maxRetries: 3,
        baseDelayMs: 100,
        jitter: false,
      });

      await jest.advanceTimersByTimeAsync(100);
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
    });

    it("should not retry when shouldRetry returns false", async () => {
      const operation = jest
        .fn()
        .mockResolvedValue({ success: false, retryable: false });

      const shouldRetry = (result: { retryable: boolean }) => result.retryable;

      const resultPromise = retryOnFailureResult(operation, shouldRetry, {
        maxRetries: 3,
      });

      jest.runAllTimers();
      const result = await resultPromise;

      expect(result.success).toBe(true); // Returns the last result
      expect(result.attempts).toBe(1);
    });
  });
});
