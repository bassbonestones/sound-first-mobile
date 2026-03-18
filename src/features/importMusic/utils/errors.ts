/**
 * Import Error Utilities
 *
 * Error creation, mapping, and handling utilities for the import pipeline.
 */

import { USER_ERROR_MESSAGES, RECOVERY_HINTS } from "../../../constants/import";
import type {
  ImportError,
  ImportErrorCode,
  ImportErrorSeverity,
} from "../../../types/import";
import { createImportError } from "../../../types/import";

// ============================================================================
// Error Code Classification
// ============================================================================

/**
 * Error codes that are recoverable by the user
 */
const RECOVERABLE_ERROR_CODES: ReadonlySet<ImportErrorCode> = new Set([
  "permission_denied",
  "canceled_by_user",
  "unsupported_type",
  "file_too_large",
  "file_empty",
  "invalid_extension",
  "upload_failed",
  "upload_timeout",
  "network_error",
  "omr_timeout",
  "omr_low_confidence",
]);

/**
 * Error codes that are warnings (operation might still succeed)
 */
const WARNING_ERROR_CODES: ReadonlySet<ImportErrorCode> = new Set([
  "omr_low_confidence",
]);

/**
 * Check if an error code represents a recoverable error
 */
export function isRecoverableError(code: ImportErrorCode): boolean {
  return RECOVERABLE_ERROR_CODES.has(code);
}

/**
 * Check if an error code represents a warning
 */
export function isWarningError(code: ImportErrorCode): boolean {
  return WARNING_ERROR_CODES.has(code);
}

/**
 * Determine severity for an error code
 */
export function getErrorSeverity(code: ImportErrorCode): ImportErrorSeverity {
  if (WARNING_ERROR_CODES.has(code)) return "warning";
  if (RECOVERABLE_ERROR_CODES.has(code)) return "recoverable";
  return "fatal";
}

// ============================================================================
// Error Creation Helpers
// ============================================================================

/**
 * Create an import error from an error code with standard messages
 */
export function createErrorFromCode(
  code: ImportErrorCode,
  context?: Record<string, unknown>,
  cause?: Error,
): ImportError {
  const userMessage = USER_ERROR_MESSAGES[code];
  const recoveryHint = RECOVERY_HINTS[code] ?? null;
  const recoverable = isRecoverableError(code);
  const severity = getErrorSeverity(code);

  return createImportError(code, cause?.message ?? userMessage, userMessage, {
    severity,
    recoverable,
    recoveryHint,
    context,
    cause,
  });
}

/**
 * Create a permission denied error
 */
export function createPermissionError(
  permissionType: "camera" | "media_library" | "file_access",
): ImportError {
  return createErrorFromCode("permission_denied", { permissionType });
}

/**
 * Create a user canceled error
 */
export function createCanceledError(): ImportError {
  return createErrorFromCode("canceled_by_user");
}

/**
 * Create a network error
 */
export function createNetworkError(cause?: Error): ImportError {
  return createErrorFromCode("network_error", undefined, cause);
}

/**
 * Create a parse failed error
 */
export function createParseError(details: string, cause?: Error): ImportError {
  return createImportError(
    "parse_failed",
    details,
    USER_ERROR_MESSAGES.parse_failed,
    {
      severity: "fatal",
      recoverable: false,
      recoveryHint: RECOVERY_HINTS.parse_failed ?? null,
      cause,
    },
  );
}

/**
 * Create an OMR error
 */
export function createOmrError(
  code:
    | "omr_submission_failed"
    | "omr_processing_failed"
    | "omr_timeout"
    | "omr_low_confidence",
  details?: string,
  cause?: Error,
): ImportError {
  return createErrorFromCode(code, details ? { details } : undefined, cause);
}

// ============================================================================
// Error Mapping
// ============================================================================

/**
 * Map a native error to an ImportError
 */
export function mapNativeError(error: unknown): ImportError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors
    if (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("timeout") ||
      message.includes("connection")
    ) {
      return createNetworkError(error);
    }

    // Permission errors
    if (
      message.includes("permission") ||
      message.includes("denied") ||
      message.includes("not authorized")
    ) {
      return createErrorFromCode("permission_denied", undefined, error);
    }

    // User cancellation
    if (
      message.includes("cancel") ||
      message.includes("user") ||
      message.includes("dismissed")
    ) {
      return createCanceledError();
    }

    // Parsing errors
    if (
      message.includes("parse") ||
      message.includes("xml") ||
      message.includes("invalid")
    ) {
      return createParseError(error.message, error);
    }

    // Default to unknown error
    return createImportError(
      "unknown_error",
      error.message,
      USER_ERROR_MESSAGES.unknown_error,
      {
        severity: "fatal",
        recoverable: false,
        cause: error,
      },
    );
  }

  // Non-Error thrown
  return createImportError(
    "unknown_error",
    String(error),
    USER_ERROR_MESSAGES.unknown_error,
    { severity: "fatal", recoverable: false },
  );
}

// ============================================================================
// Error Formatting
// ============================================================================

/**
 * Format an error for logging
 */
export function formatErrorForLog(error: ImportError): string {
  const parts = [`[${error.code}]`, error.message];

  if (error.context) {
    parts.push(`Context: ${JSON.stringify(error.context)}`);
  }

  if (error.cause) {
    parts.push(`Cause: ${error.cause.stack ?? error.cause.message}`);
  }

  return parts.join(" | ");
}

/**
 * Format an error for user display
 */
export interface FormattedUserError {
  readonly title: string;
  readonly message: string;
  readonly hint: string | null;
  readonly canRetry: boolean;
}

export function formatErrorForUser(error: ImportError): FormattedUserError {
  return {
    title: error.severity === "warning" ? "Warning" : "Import Failed",
    message: error.userMessage,
    hint: error.recoveryHint,
    canRetry: error.recoverable,
  };
}

// ============================================================================
// Error Aggregation
// ============================================================================

/**
 * Combine multiple errors into a summary
 */
export function summarizeErrors(errors: ImportError[]): ImportError | null {
  if (errors.length === 0) return null;
  if (errors.length === 1) return errors[0];

  // Find the most severe error
  const fatalErrors = errors.filter((e) => e.severity === "fatal");
  const primaryError = fatalErrors[0] ?? errors[0];

  // If there are multiple errors, note that in the message
  const message =
    errors.length > 1
      ? `${primaryError.message} (and ${errors.length - 1} more issue${errors.length > 2 ? "s" : ""})`
      : primaryError.message;

  return {
    ...primaryError,
    message,
    context: {
      ...primaryError.context,
      totalErrors: errors.length,
      allCodes: errors.map((e) => e.code),
    },
  };
}
