/**
 * Error Reporter - Global error tracking and reporting utility
 *
 * Provides centralized error handling with:
 * - Error logging and categorization
 * - Error aggregation for monitoring
 * - Recovery helpers for common error patterns
 *
 * In production, this can be extended to send errors to
 * external services (Sentry, Bugsnag, etc.)
 */

import { devError } from "./devLogger";

declare const __DEV__: boolean;

export type ErrorCategory =
  | "network"
  | "api"
  | "audio"
  | "storage"
  | "render"
  | "unknown";

export interface ErrorReport {
  message: string;
  category: ErrorCategory;
  timestamp: number;
  context?: string;
  error?: Error;
  recoverable: boolean;
}

// In-memory error store for development debugging
const errorStore: ErrorReport[] = [];
const MAX_STORED_ERRORS = 100;

/**
 * Categorize an error based on its characteristics
 */
function categorizeError(error: unknown): ErrorCategory {
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    if (message.includes("network") || message.includes("fetch")) {
      return "network";
    }
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("timeout")
    ) {
      return "network";
    }
    if (message.includes("api") || message.includes("status")) {
      return "api";
    }
    if (message.includes("audio") || message.includes("microphone")) {
      return "audio";
    }
    if (message.includes("storage") || message.includes("async storage")) {
      return "storage";
    }
  }

  return "unknown";
}

/**
 * Report an error to the error tracking system
 *
 * @param error - The error to report
 * @param context - Optional context about where the error occurred
 * @param recoverable - Whether the error is recoverable (default: true)
 */
export function reportError(
  error: unknown,
  context?: string,
  recoverable = true,
): void {
  const category = categorizeError(error);
  const message = error instanceof Error ? error.message : String(error);

  const report: ErrorReport = {
    message,
    category,
    timestamp: Date.now(),
    context,
    error: error instanceof Error ? error : undefined,
    recoverable,
  };

  // Store error for debugging
  errorStore.push(report);
  if (errorStore.length > MAX_STORED_ERRORS) {
    errorStore.shift();
  }

  // Log in development
  devError(
    `[ErrorReporter] ${category}:`,
    message,
    context ? `(${context})` : "",
  );

  // In production, send to external error tracking service
  if (!__DEV__) {
    sendToErrorService(report);
  }
}

// ============================================================================
// Production Error Service
// ============================================================================

/**
 * Configuration for external error service (Sentry, Bugsnag, etc.)
 */
interface ErrorServiceConfig {
  enabled: boolean;
  dsn?: string;
  environment: string;
  sampleRate: number;
}

let errorServiceConfig: ErrorServiceConfig = {
  enabled: false,
  environment: "development",
  sampleRate: 1.0,
};

/**
 * Initialize the error reporting service
 *
 * Call this early in app startup with your Sentry DSN or equivalent.
 *
 * @example
 * ```tsx
 * // In App.tsx
 * import { initErrorService } from './utils/errorReporter';
 *
 * initErrorService({
 *   enabled: !__DEV__,
 *   dsn: process.env.SENTRY_DSN,
 *   environment: process.env.NODE_ENV,
 * });
 * ```
 */
export function initErrorService(config: Partial<ErrorServiceConfig>): void {
  errorServiceConfig = { ...errorServiceConfig, ...config };

  if (errorServiceConfig.enabled && errorServiceConfig.dsn) {
    // In a real implementation, initialize Sentry here:
    // Sentry.init({
    //   dsn: errorServiceConfig.dsn,
    //   environment: errorServiceConfig.environment,
    //   sampleRate: errorServiceConfig.sampleRate,
    // });
    devError(
      "[ErrorReporter] Error service initialized for",
      errorServiceConfig.environment,
    );
  }
}

/**
 * Send error to external service
 */
function sendToErrorService(report: ErrorReport): void {
  if (!errorServiceConfig.enabled) return;

  // Sample rate check
  if (Math.random() > errorServiceConfig.sampleRate) return;

  // In a real implementation, use Sentry.captureException:
  // Sentry.captureException(report.error || new Error(report.message), {
  //   tags: {
  //     category: report.category,
  //     recoverable: String(report.recoverable),
  //   },
  //   extra: {
  //     context: report.context,
  //     timestamp: report.timestamp,
  //   },
  // });

  // For now, we'll queue errors for batch sending
  queueErrorForBatch(report);
}

// Batch error sending
const errorBatch: ErrorReport[] = [];
const BATCH_SIZE = 10;
const BATCH_INTERVAL_MS = 60000; // 1 minute
let batchTimeoutId: ReturnType<typeof setTimeout> | null = null;

function queueErrorForBatch(report: ErrorReport): void {
  errorBatch.push(report);

  if (errorBatch.length >= BATCH_SIZE) {
    sendErrorBatch();
  } else if (!batchTimeoutId) {
    batchTimeoutId = setTimeout(sendErrorBatch, BATCH_INTERVAL_MS);
  }
}

async function sendErrorBatch(): Promise<void> {
  if (batchTimeoutId) {
    clearTimeout(batchTimeoutId);
    batchTimeoutId = null;
  }

  if (errorBatch.length === 0) return;

  const batch = [...errorBatch];
  errorBatch.length = 0;

  // In production, send to error service endpoint
  // try {
  //   await fetch('https://errors.soundfirst.app/batch', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ errors: batch }),
  //   });
  // } catch (e) {
  //   // Re-queue on failure
  //   errorBatch.unshift(...batch);
  // }
}

/**
 * Capture an exception with additional context
 *
 * Use this for caught exceptions that you want to report.
 */
export function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    user?: { id: string; email?: string };
  },
): void {
  reportError(error, context?.tags?.feature || "captureException", true);

  // In production with Sentry:
  // Sentry.withScope((scope) => {
  //   if (context?.tags) scope.setTags(context.tags);
  //   if (context?.extra) scope.setExtras(context.extra);
  //   if (context?.user) scope.setUser(context.user);
  //   Sentry.captureException(error);
  // });
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: Record<string, unknown>,
): void {
  devError(`[ErrorReporter] ${level}:`, message, context || "");

  // In production with Sentry:
  // Sentry.captureMessage(message, { level, extra: context });
}

/**
 * Report a network error with recovery suggestion
 */
export function reportNetworkError(
  error: unknown,
  context?: string,
): { retry: () => void } | null {
  reportError(error, context || "Network request failed", true);

  return {
    retry: () => {
      devError("[ErrorReporter] Retry requested for:", context);
    },
  };
}

/**
 * Report an API error (non-network server error)
 */
export function reportApiError(
  statusCode: number,
  message: string,
  context?: string,
): void {
  const error = new Error(`API Error ${statusCode}: ${message}`);
  reportError(error, context, statusCode < 500);
}

/**
 * Get recent errors for debugging
 */
export function getRecentErrors(count = 10): ErrorReport[] {
  return errorStore.slice(-count);
}

/**
 * Clear error store (for testing)
 */
export function clearErrorStore(): void {
  errorStore.length = 0;
}

/**
 * Get error statistics
 */
export function getErrorStats(): Record<ErrorCategory, number> {
  const stats: Record<ErrorCategory, number> = {
    network: 0,
    api: 0,
    audio: 0,
    storage: 0,
    render: 0,
    unknown: 0,
  };

  for (const report of errorStore) {
    stats[report.category]++;
  }

  return stats;
}

/**
 * Create a .catch() handler for Promise chains
 * Usage: somePromise.then(...).catch(createErrorHandler('MyComponent'))
 */
export function createErrorHandler(context: string): (error: unknown) => void {
  return (error: unknown) => {
    reportError(error, context, true);
  };
}

export default {
  reportError,
  reportNetworkError,
  reportApiError,
  getRecentErrors,
  clearErrorStore,
  getErrorStats,
  createErrorHandler,
  initErrorService,
  captureException,
  captureMessage,
};
