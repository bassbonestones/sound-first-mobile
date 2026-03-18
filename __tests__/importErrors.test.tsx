/**
 * Import Error Utilities Tests
 */

import {
  isRecoverableError,
  isWarningError,
  getErrorSeverity,
  createErrorFromCode,
  createPermissionError,
  createCanceledError,
  createNetworkError,
  createParseError,
  createOmrError,
  mapNativeError,
  formatErrorForLog,
  formatErrorForUser,
  summarizeErrors,
} from "../src/features/importMusic/utils/errors";
import type { ImportError, ImportErrorCode } from "../src/types/import";

describe("Import Error Utilities", () => {
  // ============================================================================
  // Error Classification Tests
  // ============================================================================

  describe("isRecoverableError", () => {
    it("identifies recoverable errors", () => {
      expect(isRecoverableError("permission_denied")).toBe(true);
      expect(isRecoverableError("canceled_by_user")).toBe(true);
      expect(isRecoverableError("network_error")).toBe(true);
      expect(isRecoverableError("file_too_large")).toBe(true);
    });

    it("identifies non-recoverable errors", () => {
      expect(isRecoverableError("parse_failed")).toBe(false);
      expect(isRecoverableError("musicxml_invalid")).toBe(false);
      expect(isRecoverableError("normalization_failed")).toBe(false);
    });
  });

  describe("isWarningError", () => {
    it("identifies warning errors", () => {
      expect(isWarningError("omr_low_confidence")).toBe(true);
    });

    it("identifies non-warning errors", () => {
      expect(isWarningError("parse_failed")).toBe(false);
      expect(isWarningError("network_error")).toBe(false);
    });
  });

  describe("getErrorSeverity", () => {
    it("returns warning for warning codes", () => {
      expect(getErrorSeverity("omr_low_confidence")).toBe("warning");
    });

    it("returns recoverable for recoverable codes", () => {
      expect(getErrorSeverity("network_error")).toBe("recoverable");
      expect(getErrorSeverity("permission_denied")).toBe("recoverable");
    });

    it("returns fatal for other codes", () => {
      expect(getErrorSeverity("parse_failed")).toBe("fatal");
      expect(getErrorSeverity("normalization_failed")).toBe("fatal");
    });
  });

  // ============================================================================
  // Error Creation Tests
  // ============================================================================

  describe("createErrorFromCode", () => {
    it("creates error with correct code and messages", () => {
      const error = createErrorFromCode("permission_denied");
      expect(error.code).toBe("permission_denied");
      expect(error.userMessage).toBeTruthy();
      expect(error.recoverable).toBe(true);
    });

    it("includes context when provided", () => {
      const error = createErrorFromCode("file_too_large", { fileSize: 100 });
      expect(error.context).toEqual({ fileSize: 100 });
    });

    it("includes cause when provided", () => {
      const cause = new Error("Original error");
      const error = createErrorFromCode("network_error", undefined, cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe("createPermissionError", () => {
    it("creates permission error with type", () => {
      const error = createPermissionError("camera");
      expect(error.code).toBe("permission_denied");
      expect(error.context?.permissionType).toBe("camera");
    });
  });

  describe("createCanceledError", () => {
    it("creates canceled error", () => {
      const error = createCanceledError();
      expect(error.code).toBe("canceled_by_user");
      expect(error.recoverable).toBe(true);
    });
  });

  describe("createNetworkError", () => {
    it("creates network error", () => {
      const error = createNetworkError();
      expect(error.code).toBe("network_error");
      expect(error.recoverable).toBe(true);
    });

    it("includes cause when provided", () => {
      const cause = new Error("Connection refused");
      const error = createNetworkError(cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe("createParseError", () => {
    it("creates parse error with details", () => {
      const error = createParseError("Invalid XML structure");
      expect(error.code).toBe("parse_failed");
      expect(error.message).toBe("Invalid XML structure");
      expect(error.recoverable).toBe(false);
    });
  });

  describe("createOmrError", () => {
    it("creates OMR errors for different codes", () => {
      const timeout = createOmrError("omr_timeout");
      expect(timeout.code).toBe("omr_timeout");

      const lowConfidence = createOmrError("omr_low_confidence");
      expect(lowConfidence.code).toBe("omr_low_confidence");
    });
  });

  // ============================================================================
  // Error Mapping Tests
  // ============================================================================

  describe("mapNativeError", () => {
    it("maps network errors", () => {
      const nativeError = new Error("Network request failed");
      const importError = mapNativeError(nativeError);
      expect(importError.code).toBe("network_error");
    });

    it("maps permission errors", () => {
      const nativeError = new Error("Permission denied to access camera");
      const importError = mapNativeError(nativeError);
      expect(importError.code).toBe("permission_denied");
    });

    it("maps cancellation errors", () => {
      const nativeError = new Error("User canceled the operation");
      const importError = mapNativeError(nativeError);
      expect(importError.code).toBe("canceled_by_user");
    });

    it("maps parse errors", () => {
      const nativeError = new Error("Invalid XML format");
      const importError = mapNativeError(nativeError);
      expect(importError.code).toBe("parse_failed");
    });

    it("maps unknown errors", () => {
      const nativeError = new Error("Something unexpected");
      const importError = mapNativeError(nativeError);
      expect(importError.code).toBe("unknown_error");
    });

    it("handles non-Error thrown values", () => {
      const importError = mapNativeError("string error");
      expect(importError.code).toBe("unknown_error");
      expect(importError.message).toBe("string error");
    });
  });

  // ============================================================================
  // Error Formatting Tests
  // ============================================================================

  describe("formatErrorForLog", () => {
    it("formats basic error", () => {
      const error: ImportError = {
        code: "parse_failed",
        message: "XML parsing failed",
        userMessage: "Could not read file",
        severity: "fatal",
        recoverable: false,
        recoveryHint: null,
      };
      const log = formatErrorForLog(error);
      expect(log).toContain("[parse_failed]");
      expect(log).toContain("XML parsing failed");
    });

    it("includes context in log", () => {
      const error: ImportError = {
        code: "file_too_large",
        message: "File exceeds limit",
        userMessage: "File too large",
        severity: "fatal",
        recoverable: false,
        recoveryHint: null,
        context: { fileSize: 100, maxSize: 50 },
      };
      const log = formatErrorForLog(error);
      expect(log).toContain("Context:");
      expect(log).toContain("100");
    });

    it("includes cause with stack trace in log", () => {
      const cause = new Error("Original error");
      cause.stack = "Error: Original error\n    at test.js:1:1";
      const error: ImportError = {
        code: "parse_failed",
        message: "XML parsing failed",
        userMessage: "Could not read file",
        severity: "fatal",
        recoverable: false,
        recoveryHint: null,
        cause,
      };
      const log = formatErrorForLog(error);
      expect(log).toContain("Cause:");
      expect(log).toContain("Error: Original error");
    });

    it("falls back to cause.message when no stack", () => {
      const cause = new Error("Original error");
      // Remove stack to test fallback
      (cause as { stack?: string }).stack = undefined;
      const error: ImportError = {
        code: "parse_failed",
        message: "XML parsing failed",
        userMessage: "Could not read file",
        severity: "fatal",
        recoverable: false,
        recoveryHint: null,
        cause,
      };
      const log = formatErrorForLog(error);
      expect(log).toContain("Cause:");
      expect(log).toContain("Original error");
    });
  });

  describe("formatErrorForUser", () => {
    it("formats error for user display", () => {
      const error: ImportError = {
        code: "network_error",
        message: "Connection failed",
        userMessage: "No internet connection",
        severity: "recoverable",
        recoverable: true,
        recoveryHint: "Check your connection",
      };
      const formatted = formatErrorForUser(error);
      expect(formatted.title).toBe("Import Failed");
      expect(formatted.message).toBe("No internet connection");
      expect(formatted.hint).toBe("Check your connection");
      expect(formatted.canRetry).toBe(true);
    });

    it("uses Warning title for warning severity", () => {
      const error: ImportError = {
        code: "omr_low_confidence",
        message: "Low confidence",
        userMessage: "Some parts unclear",
        severity: "warning",
        recoverable: true,
        recoveryHint: null,
      };
      const formatted = formatErrorForUser(error);
      expect(formatted.title).toBe("Warning");
    });
  });

  // ============================================================================
  // Error Aggregation Tests
  // ============================================================================

  describe("summarizeErrors", () => {
    it("returns null for empty array", () => {
      expect(summarizeErrors([])).toBeNull();
    });

    it("returns single error unchanged", () => {
      const error: ImportError = {
        code: "parse_failed",
        message: "Parse error",
        userMessage: "Could not read",
        severity: "fatal",
        recoverable: false,
        recoveryHint: null,
      };
      const summary = summarizeErrors([error]);
      expect(summary).toEqual(error);
    });

    it("combines multiple errors", () => {
      const error1: ImportError = {
        code: "file_too_large",
        message: "File too large",
        userMessage: "File is too big",
        severity: "fatal",
        recoverable: false,
        recoveryHint: null,
      };
      const error2: ImportError = {
        code: "invalid_extension",
        message: "Bad extension",
        userMessage: "Wrong type",
        severity: "fatal",
        recoverable: false,
        recoveryHint: null,
      };

      const summary = summarizeErrors([error1, error2]);
      expect(summary?.code).toBe("file_too_large"); // First error code
      expect(summary?.message).toContain("and 1 more issue");
      expect(summary?.context?.totalErrors).toBe(2);
    });

    it("prioritizes fatal errors", () => {
      const warning: ImportError = {
        code: "omr_low_confidence",
        message: "Low confidence",
        userMessage: "Review needed",
        severity: "warning",
        recoverable: true,
        recoveryHint: null,
      };
      const fatal: ImportError = {
        code: "parse_failed",
        message: "Parse error",
        userMessage: "Could not read",
        severity: "fatal",
        recoverable: false,
        recoveryHint: null,
      };

      const summary = summarizeErrors([warning, fatal]);
      expect(summary?.code).toBe("parse_failed"); // Fatal takes priority
    });
  });
});
