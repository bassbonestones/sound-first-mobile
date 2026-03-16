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

  // In production, this would send to external service:
  // if (!__DEV__) {
  //   sendToExternalService(report);
  // }
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
};
