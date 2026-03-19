/**
 * Tests for importAnalyticsService
 *
 * Tests import funnel analytics tracking functionality
 */

import {
  trackEvent,
  trackSourceSelected,
  trackUpload,
  trackOmrJob,
  trackError,
  trackFileAcquisition,
  startImportSession,
  endImportSession,
  getCurrentSessionId,
  flushEvents,
  startAutoFlush,
  stopAutoFlush,
  getPendingEventsCount,
  calculateFunnelMetrics,
} from "../src/features/importMusic/services/importAnalyticsService";

// Mock devLogger
jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devWarn: jest.fn(),
  devError: jest.fn(),
}));

describe("importAnalyticsService", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    endImportSession(); // Reset session
    stopAutoFlush(); // Stop any running flush
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("trackEvent", () => {
    it("should track a generic event", () => {
      expect(() => {
        trackEvent("import_started", { screen: "import" });
      }).not.toThrow();
    });

    it("should add events to queue", () => {
      const before = getPendingEventsCount();
      trackEvent("import_started");
      expect(getPendingEventsCount()).toBe(before + 1);
    });
  });

  describe("session management", () => {
    it("should start import session", () => {
      const sessionId = startImportSession();
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe("string");
      expect(sessionId.startsWith("import_")).toBe(true);
    });

    it("should return current session ID", () => {
      const sessionId = startImportSession();
      expect(getCurrentSessionId()).toBe(sessionId);
    });

    it("should end import session", () => {
      startImportSession();
      expect(() => endImportSession()).not.toThrow();
    });

    it("should generate new session ID after ending", () => {
      const firstSession = startImportSession();
      endImportSession();
      const secondSession = startImportSession();
      expect(secondSession).not.toBe(firstSession);
    });
  });

  describe("trackSourceSelected", () => {
    it("should track camera source selection", () => {
      expect(() => {
        trackSourceSelected("camera");
      }).not.toThrow();
    });

    it("should track photo_library source selection", () => {
      expect(() => {
        trackSourceSelected("photo_library");
      }).not.toThrow();
    });

    it("should track file_picker source selection", () => {
      expect(() => {
        trackSourceSelected("file_picker");
      }).not.toThrow();
    });

    it("should track share_extension source selection", () => {
      expect(() => {
        trackSourceSelected("share_extension");
      }).not.toThrow();
    });
  });

  describe("trackFileAcquisition", () => {
    it("should track file acquisition started", () => {
      expect(() => {
        trackFileAcquisition("started", { source: "camera" });
      }).not.toThrow();
    });

    it("should track file acquisition completed", () => {
      expect(() => {
        trackFileAcquisition("completed", {
          source: "file_picker",
          fileType: "pdf",
          fileSizeBytes: 2048,
        });
      }).not.toThrow();
    });

    it("should track file acquisition failed", () => {
      expect(() => {
        trackFileAcquisition("failed", { error: "Permission denied" });
      }).not.toThrow();
    });

    it("should track file acquisition cancelled", () => {
      expect(() => {
        trackFileAcquisition("cancelled");
      }).not.toThrow();
    });
  });

  describe("trackUpload", () => {
    it("should track upload started", () => {
      expect(() => {
        trackUpload("started", { fileSizeBytes: 1024 });
      }).not.toThrow();
    });

    it("should track upload progress", () => {
      expect(() => {
        trackUpload("progress", { progress: 0.5 });
      }).not.toThrow();
    });

    it("should track upload completed", () => {
      expect(() => {
        trackUpload("completed", {
          fileSizeBytes: 2048,
          durationMs: 1500,
        });
      }).not.toThrow();
    });

    it("should track upload failed with error", () => {
      expect(() => {
        trackUpload("failed", { error: "Network error" });
      }).not.toThrow();
    });

    it("should track upload retried", () => {
      expect(() => {
        trackUpload("retried", { retryCount: 2 });
      }).not.toThrow();
    });
  });

  describe("trackOmrJob", () => {
    it("should track OMR job submitted", () => {
      expect(() => {
        trackOmrJob("submitted", { jobId: "job-123" });
      }).not.toThrow();
    });

    it("should track OMR job polling", () => {
      expect(() => {
        trackOmrJob("polling", { jobId: "job-123" });
      }).not.toThrow();
    });

    it("should track OMR job completed", () => {
      expect(() => {
        trackOmrJob("completed", {
          jobId: "job-123",
          durationMs: 30000,
          confidence: 0.95,
        });
      }).not.toThrow();
    });

    it("should track OMR job failed", () => {
      expect(() => {
        trackOmrJob("failed", {
          jobId: "job-123",
          error: "Processing timeout",
        });
      }).not.toThrow();
    });

    it("should track OMR job timeout", () => {
      expect(() => {
        trackOmrJob("timeout", { jobId: "job-123" });
      }).not.toThrow();
    });
  });

  describe("trackError", () => {
    it("should track error displayed", () => {
      expect(() => {
        trackError("displayed", {
          errorType: "network",
          errorMessage: "Connection failed",
        });
      }).not.toThrow();
    });

    it("should track error dismissed", () => {
      expect(() => {
        trackError("dismissed");
      }).not.toThrow();
    });

    it("should track error retry", () => {
      expect(() => {
        trackError("retry", { context: "upload" });
      }).not.toThrow();
    });
  });

  describe("flushEvents", () => {
    it("should flush events without throwing", async () => {
      trackEvent("import_started");
      await expect(flushEvents()).resolves.not.toThrow();
    });

    it("should clear pending events after flush", async () => {
      trackEvent("import_started");
      trackEvent("import_source_selected");
      await flushEvents();
      expect(getPendingEventsCount()).toBe(0);
    });

    it("should handle empty queue gracefully", async () => {
      await flushEvents(); // Clear any existing
      await expect(flushEvents()).resolves.not.toThrow();
    });
  });

  describe("auto flush", () => {
    it("should start auto flush", () => {
      expect(() => startAutoFlush()).not.toThrow();
    });

    it("should stop auto flush", () => {
      startAutoFlush();
      expect(() => stopAutoFlush()).not.toThrow();
    });

    it("should not start multiple flush intervals", () => {
      startAutoFlush();
      startAutoFlush(); // Should be no-op
      expect(() => stopAutoFlush()).not.toThrow();
    });
  });

  describe("calculateFunnelMetrics", () => {
    it("should return funnel metrics structure", () => {
      const metrics = calculateFunnelMetrics([]);

      expect(metrics).toHaveProperty("started");
      expect(metrics).toHaveProperty("sourceSelected");
      expect(metrics).toHaveProperty("fileAcquired");
      expect(metrics).toHaveProperty("uploadCompleted");
      expect(metrics).toHaveProperty("omrCompleted");
      expect(metrics).toHaveProperty("parsedSuccessfully");
      expect(metrics).toHaveProperty("savedOrPracticed");
    });

    it("should count sessions correctly", () => {
      const events = [
        { type: "import_started" as const, sessionId: "s1", timestamp: 1 },
        {
          type: "import_source_selected" as const,
          sessionId: "s1",
          timestamp: 2,
        },
        { type: "import_started" as const, sessionId: "s2", timestamp: 3 },
      ];

      const metrics = calculateFunnelMetrics(events);

      expect(metrics.started).toBe(2);
      expect(metrics.sourceSelected).toBe(1);
    });

    it("should count completion events", () => {
      const events = [
        { type: "import_started" as const, sessionId: "s1", timestamp: 1 },
        { type: "upload_completed" as const, sessionId: "s1", timestamp: 2 },
        { type: "omr_job_completed" as const, sessionId: "s1", timestamp: 3 },
        {
          type: "musicxml_parse_completed" as const,
          sessionId: "s1",
          timestamp: 4,
        },
        { type: "score_saved" as const, sessionId: "s1", timestamp: 5 },
      ];

      const metrics = calculateFunnelMetrics(events);

      expect(metrics.uploadCompleted).toBe(1);
      expect(metrics.omrCompleted).toBe(1);
      expect(metrics.parsedSuccessfully).toBe(1);
      expect(metrics.savedOrPracticed).toBe(1);
    });

    it("should count practice started as completion", () => {
      const events = [
        { type: "import_started" as const, sessionId: "s1", timestamp: 1 },
        {
          type: "score_practice_started" as const,
          sessionId: "s1",
          timestamp: 2,
        },
      ];

      const metrics = calculateFunnelMetrics(events);

      expect(metrics.savedOrPracticed).toBe(1);
    });
  });
});
