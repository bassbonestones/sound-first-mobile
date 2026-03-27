/**
 * Tests for import types - helper functions
 */
import {
  createInitialJobStatus,
  updateJobStatus,
  createImportError,
  ImportJobStatus,
} from "../src/types/import";

describe("createInitialJobStatus", () => {
  it("should create a default job status with status idle", () => {
    const status = createInitialJobStatus();

    expect(status.status).toBe("idle");
    expect(status.message).toBe("Ready to import");
    expect(status.progress).toBeNull();
    expect(status.omrJobId).toBeNull();
    expect(typeof status.updatedAt).toBe("number");
  });

  it("should create status with current timestamp", () => {
    const before = Date.now();
    const status = createInitialJobStatus();
    const after = Date.now();

    expect(status.updatedAt).toBeGreaterThanOrEqual(before);
    expect(status.updatedAt).toBeLessThanOrEqual(after);
  });

  it("should create independent status objects", () => {
    const status1 = createInitialJobStatus();
    const status2 = createInitialJobStatus();

    expect(status1).not.toBe(status2);
    expect(status1).toEqual(status2);
  });
});

describe("updateJobStatus", () => {
  it("should update status field", () => {
    const initial = createInitialJobStatus();
    const updated = updateJobStatus(initial, { status: "processing" });

    expect(updated.status).toBe("processing");
  });

  it("should update message field", () => {
    const initial = createInitialJobStatus();
    const updated = updateJobStatus(initial, { message: "Uploading file..." });

    expect(updated.message).toBe("Uploading file...");
  });

  it("should update progress field", () => {
    const initial = createInitialJobStatus();
    const updated = updateJobStatus(initial, { progress: 0.5 });

    expect(updated.progress).toBe(0.5);
  });

  it("should update omrJobId field", () => {
    const initial = createInitialJobStatus();
    const updated = updateJobStatus(initial, { omrJobId: "job-123" });

    expect(updated.omrJobId).toBe("job-123");
  });

  it("should update updatedAt timestamp", () => {
    const initial: ImportJobStatus = {
      status: "idle",
      message: "Ready",
      progress: null,
      updatedAt: 1000,
      omrJobId: null,
    };

    const before = Date.now();
    const updated = updateJobStatus(initial, { status: "processing" });
    const after = Date.now();

    expect(updated.updatedAt).toBeGreaterThanOrEqual(before);
    expect(updated.updatedAt).toBeLessThanOrEqual(after);
    expect(updated.updatedAt).not.toBe(1000);
  });

  it("should preserve unchanged fields", () => {
    const initial: ImportJobStatus = {
      status: "processing",
      message: "Working...",
      progress: 0.25,
      updatedAt: 1000,
      omrJobId: "job-456",
    };

    const updated = updateJobStatus(initial, { progress: 0.75 });

    expect(updated.status).toBe("processing");
    expect(updated.message).toBe("Working...");
    expect(updated.progress).toBe(0.75);
    expect(updated.omrJobId).toBe("job-456");
  });

  it("should not mutate original status", () => {
    const initial = createInitialJobStatus();
    const originalStatus = initial.status;

    updateJobStatus(initial, { status: "completed" });

    expect(initial.status).toBe(originalStatus);
  });

  it("should handle multiple field updates", () => {
    const initial = createInitialJobStatus();
    const updated = updateJobStatus(initial, {
      status: "completed",
      message: "Import finished",
      progress: 1.0,
    });

    expect(updated.status).toBe("completed");
    expect(updated.message).toBe("Import finished");
    expect(updated.progress).toBe(1.0);
  });

  it("should handle empty updates object", () => {
    const initial = createInitialJobStatus();
    const updated = updateJobStatus(initial, {});

    expect(updated.status).toBe(initial.status);
    expect(updated.message).toBe(initial.message);
    expect(updated.progress).toBe(initial.progress);
    expect(updated.omrJobId).toBe(initial.omrJobId);
    // updatedAt should still be updated
    expect(updated.updatedAt).toBeGreaterThanOrEqual(initial.updatedAt);
  });
});

describe("createImportError", () => {
  it("should create error with required fields", () => {
    const error = createImportError(
      "INVALID_FILE_TYPE",
      "Invalid file type",
      "Please select a supported file format",
    );

    expect(error.code).toBe("INVALID_FILE_TYPE");
    expect(error.message).toBe("Invalid file type");
    expect(error.userMessage).toBe("Please select a supported file format");
  });

  it("should apply default severity as fatal", () => {
    const error = createImportError(
      "UPLOAD_FAILED",
      "Upload failed",
      "Could not upload file",
    );

    expect(error.severity).toBe("fatal");
  });

  it("should apply default recoverable as false", () => {
    const error = createImportError(
      "NETWORK_ERROR",
      "Network error",
      "Check your connection",
    );

    expect(error.recoverable).toBe(false);
  });

  it("should apply default recoveryHint as null", () => {
    const error = createImportError(
      "TIMEOUT",
      "Request timed out",
      "Request took too long",
    );

    expect(error.recoveryHint).toBeNull();
  });

  it("should allow overriding severity", () => {
    const error = createImportError(
      "WARNING_LOW_QUALITY",
      "Low quality image",
      "Image may not scan well",
      { severity: "warning" },
    );

    expect(error.severity).toBe("warning");
  });

  it("should allow setting recoverable to true", () => {
    const error = createImportError(
      "RETRY_AVAILABLE",
      "Temporary failure",
      "Try again",
      { recoverable: true },
    );

    expect(error.recoverable).toBe(true);
  });

  it("should allow setting recoveryHint", () => {
    const error = createImportError(
      "FILE_TOO_LARGE",
      "File exceeds limit",
      "File is too big",
      { recoveryHint: "Try compressing the file first" },
    );

    expect(error.recoveryHint).toBe("Try compressing the file first");
  });

  it("should allow setting context", () => {
    const error = createImportError(
      "PARSE_ERROR",
      "Could not parse file",
      "File parsing failed",
      { context: { filename: "test.xml", line: 42 } },
    );

    expect(error.context).toEqual({ filename: "test.xml", line: 42 });
  });

  it("should allow setting cause error", () => {
    const originalError = new Error("Original error");
    const error = createImportError(
      "INTERNAL_ERROR",
      "Internal error occurred",
      "Something went wrong",
      { cause: originalError },
    );

    expect(error.cause).toBe(originalError);
  });

  it("should allow overriding multiple options", () => {
    const error = createImportError(
      "PARTIAL_SUCCESS",
      "Partial import completed",
      "Some items could not be imported",
      {
        severity: "warning",
        recoverable: true,
        recoveryHint: "Review and fix problematic items",
        context: { importedCount: 5, failedCount: 2 },
      },
    );

    expect(error.severity).toBe("warning");
    expect(error.recoverable).toBe(true);
    expect(error.recoveryHint).toBe("Review and fix problematic items");
    expect(error.context).toEqual({ importedCount: 5, failedCount: 2 });
  });
});
