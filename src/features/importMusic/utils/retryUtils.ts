/**
 * Retry Utilities
 *
 * Exponential backoff retry logic for network operations.
 * Handles transient failures gracefully.
 */

import { devLog, devError } from "../../../utils/devLogger";

// ============================================================================
// Types
// ============================================================================

/**
 * Options for retry logic
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (excluding initial attempt) */
  readonly maxRetries: number;
  /** Base delay between retries in ms */
  readonly baseDelayMs: number;
  /** Maximum delay between retries in ms */
  readonly maxDelayMs?: number;
  /** Multiplier for exponential backoff (default: 2) */
  readonly backoffMultiplier?: number;
  /** Add random jitter to delays (default: true) */
  readonly jitter?: boolean;
  /** Function to determine if an error is retryable */
  readonly isRetryable?: (error: unknown) => boolean;
  /** Callback when a retry is attempted */
  readonly onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
  /** Abort signal for cancellation */
  readonly signal?: AbortSignal;
}

/**
 * Result of a retry operation
 */
export type RetryResult<T> =
  | { success: true; data: T; attempts: number }
  | { success: false; error: unknown; attempts: number };

// ============================================================================
// Default Options
// ============================================================================

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, "signal">> & {
  signal?: AbortSignal;
} = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitter: true,
  isRetryable: defaultIsRetryable,
  onRetry: defaultOnRetry,
  signal: undefined,
};

/** Type with all required fields for internal use */
type ResolvedRetryOptions = Required<Omit<RetryOptions, "signal">> & {
  signal?: AbortSignal;
};

/**
 * Default retryable check
 *
 * Considers network errors and server errors (5xx) retryable.
 * Client errors (4xx) are not retried.
 */
function defaultIsRetryable(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors are retryable
    if (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("connection") ||
      message.includes("fetch")
    ) {
      return true;
    }

    // Check for HTTP status in error
    if ("status" in error && typeof error.status === "number") {
      const status = error.status;
      // Retry server errors (5xx) but not client errors (4xx)
      return status >= 500 && status < 600;
    }
  }

  return false;
}

/**
 * Default retry callback
 */
function defaultOnRetry(
  attempt: number,
  error: unknown,
  delayMs: number,
): void {
  devLog(
    `[Retry] Attempt ${attempt} failed, retrying in ${delayMs}ms:`,
    error instanceof Error ? error.message : String(error),
  );
}

// ============================================================================
// Core Retry Function
// ============================================================================

/**
 * Calculate delay for a retry attempt with exponential backoff
 */
function calculateDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  multiplier: number,
  jitter: boolean,
): number {
  // Exponential backoff: base * multiplier^attempt
  let delay = baseDelayMs * Math.pow(multiplier, attempt);

  // Cap at maximum delay
  delay = Math.min(delay, maxDelayMs);

  // Add jitter (±25%)
  if (jitter) {
    const jitterFactor = 0.75 + Math.random() * 0.5;
    delay = delay * jitterFactor;
  }

  return Math.round(delay);
}

/**
 * Sleep for specified duration
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Aborted"));
      return;
    }

    const timeout = setTimeout(resolve, ms);

    signal?.addEventListener("abort", () => {
      clearTimeout(timeout);
      reject(new Error("Aborted"));
    });
  });
}

/**
 * Retry an async operation with exponential backoff
 *
 * @param operation - The async function to retry
 * @param options - Retry configuration options
 * @returns Result with data on success or error after all retries exhausted
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => uploadFile(file),
 *   { maxRetries: 3, baseDelayMs: 1000 }
 * );
 *
 * if (result.success) {
 *   console.log('Uploaded:', result.data);
 * } else {
 *   console.error('Failed after', result.attempts, 'attempts');
 * }
 * ```
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<RetryResult<T>> {
  const config: ResolvedRetryOptions = { ...DEFAULT_OPTIONS, ...options };
  const {
    maxRetries,
    baseDelayMs,
    maxDelayMs,
    backoffMultiplier,
    jitter,
    isRetryable,
    onRetry,
    signal,
  } = config;

  let lastError: unknown;
  let attempts = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    attempts++;

    // Check for abort
    if (signal?.aborted) {
      return {
        success: false,
        error: new Error("Operation aborted"),
        attempts,
      };
    }

    try {
      const data = await operation();
      return { success: true, data, attempts };
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt < maxRetries && isRetryable(error)) {
        const delayMs = calculateDelay(
          attempt,
          baseDelayMs,
          maxDelayMs,
          backoffMultiplier,
          jitter,
        );

        onRetry(attempt + 1, error, delayMs);

        try {
          await sleep(delayMs, signal);
        } catch {
          // Aborted during sleep
          return {
            success: false,
            error: new Error("Operation aborted"),
            attempts,
          };
        }
      } else {
        // Not retryable or exhausted retries
        break;
      }
    }
  }

  // All retries exhausted
  devError(
    `[Retry] All ${attempts} attempts failed:`,
    lastError instanceof Error ? lastError.message : String(lastError),
  );

  return { success: false, error: lastError, attempts };
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Retry an operation that returns a result object with success flag
 *
 * This variant checks the `success` property of the result instead of
 * catching exceptions.
 *
 * @param operation - Function returning { success: boolean, ... }
 * @param shouldRetry - Function to check if result should trigger retry
 * @param options - Retry options
 */
export async function retryOnFailureResult<T extends { success: boolean }>(
  operation: () => Promise<T>,
  shouldRetry: (result: T) => boolean = (r) => !r.success,
  options: Partial<RetryOptions> = {},
): Promise<RetryResult<T>> {
  const config: ResolvedRetryOptions = { ...DEFAULT_OPTIONS, ...options };

  let lastResult: T | undefined;
  let attempts = 0;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    attempts++;

    if (config.signal?.aborted) {
      return {
        success: false,
        error: new Error("Operation aborted"),
        attempts,
      };
    }

    const result = await operation();
    lastResult = result;

    if (!shouldRetry(result)) {
      return { success: true, data: result, attempts };
    }

    if (attempt < config.maxRetries) {
      const delayMs = calculateDelay(
        attempt,
        config.baseDelayMs,
        config.maxDelayMs,
        config.backoffMultiplier,
        config.jitter,
      );

      config.onRetry(attempt + 1, result, delayMs);

      try {
        await sleep(delayMs, config.signal);
      } catch {
        return {
          success: false,
          error: new Error("Operation aborted"),
          attempts,
        };
      }
    }
  }

  // Return the last result even though it failed
  // Caller can inspect it for error details
  if (!lastResult) {
    return {
      success: false,
      error: new Error("No result available"),
      attempts,
    };
  }
  return {
    success: true,
    data: lastResult,
    attempts,
  };
}

/**
 * Create a retryable version of an async function
 *
 * @param fn - The function to wrap
 * @param options - Default retry options
 * @returns Wrapped function with retry logic
 */
export function withRetry<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: Partial<RetryOptions> = {},
): (...args: TArgs) => Promise<RetryResult<TResult>> {
  return (...args: TArgs) => retryWithBackoff(() => fn(...args), options);
}
