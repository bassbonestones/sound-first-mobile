/**
 * Tests for errorReporter utility
 */
import {
  reportError,
  reportNetworkError,
  reportApiError,
  getRecentErrors,
  clearErrorStore,
  getErrorStats,
  createErrorHandler,
} from "../src/utils/errorReporter";

describe("errorReporter", () => {
  beforeEach(() => {
    clearErrorStore();
  });

  describe("reportError", () => {
    it("stores error in the error store", () => {
      reportError(new Error("Test error"), "TestContext");
      const errors = getRecentErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe("Test error");
      expect(errors[0].context).toBe("TestContext");
    });

    it("handles string errors", () => {
      reportError("String error message");
      const errors = getRecentErrors();
      expect(errors[0].message).toBe("String error message");
    });

    it("categorizes network errors correctly", () => {
      reportError(new Error("Network request failed"));
      const errors = getRecentErrors();
      expect(errors[0].category).toBe("network");
    });

    it("categorizes API errors correctly", () => {
      reportError(new Error("API response status 500"));
      const errors = getRecentErrors();
      expect(errors[0].category).toBe("api");
    });

    it("categorizes audio errors correctly", () => {
      reportError(new Error("Audio playback failed"));
      const errors = getRecentErrors();
      expect(errors[0].category).toBe("audio");
    });

    it("categorizes storage errors correctly", () => {
      reportError(new Error("Async storage write failed"));
      const errors = getRecentErrors();
      expect(errors[0].category).toBe("storage");
    });

    it("defaults to unknown category", () => {
      reportError(new Error("Some random error"));
      const errors = getRecentErrors();
      expect(errors[0].category).toBe("unknown");
    });

    it("respects recoverable flag", () => {
      reportError(new Error("Recoverable"), "ctx", true);
      reportError(new Error("Not recoverable"), "ctx", false);
      const errors = getRecentErrors();
      expect(errors[0].recoverable).toBe(true);
      expect(errors[1].recoverable).toBe(false);
    });

    it("includes timestamp", () => {
      const before = Date.now();
      reportError(new Error("Test"));
      const after = Date.now();
      const errors = getRecentErrors();
      expect(errors[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(errors[0].timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe("reportNetworkError", () => {
    it("reports a network error with context", () => {
      reportNetworkError(new Error("fetch failed"), "Loading materials");
      const errors = getRecentErrors();
      expect(errors[0].category).toBe("network");
      expect(errors[0].context).toBe("Loading materials");
    });

    it("returns retry helper", () => {
      const result = reportNetworkError(new Error("fetch failed"));
      expect(result).toHaveProperty("retry");
      expect(typeof result?.retry).toBe("function");
    });
  });

  describe("reportApiError", () => {
    it("reports API errors with status code", () => {
      reportApiError(404, "Not found", "Fetching user");
      const errors = getRecentErrors();
      expect(errors[0].message).toBe("API Error 404: Not found");
      expect(errors[0].context).toBe("Fetching user");
    });

    it("marks client errors as recoverable", () => {
      reportApiError(400, "Bad request");
      const errors = getRecentErrors();
      expect(errors[0].recoverable).toBe(true);
    });

    it("marks server errors as not recoverable", () => {
      reportApiError(500, "Internal server error");
      const errors = getRecentErrors();
      expect(errors[0].recoverable).toBe(false);
    });
  });

  describe("getRecentErrors", () => {
    it("returns specified number of recent errors", () => {
      for (let i = 0; i < 10; i++) {
        reportError(new Error(`Error ${i}`));
      }
      const errors = getRecentErrors(5);
      expect(errors).toHaveLength(5);
      expect(errors[0].message).toBe("Error 5");
      expect(errors[4].message).toBe("Error 9");
    });

    it("returns all errors if fewer than requested", () => {
      reportError(new Error("Error 1"));
      reportError(new Error("Error 2"));
      const errors = getRecentErrors(10);
      expect(errors).toHaveLength(2);
    });
  });

  describe("clearErrorStore", () => {
    it("clears all stored errors", () => {
      reportError(new Error("Error 1"));
      reportError(new Error("Error 2"));
      clearErrorStore();
      expect(getRecentErrors()).toHaveLength(0);
    });
  });

  describe("getErrorStats", () => {
    it("returns counts by category", () => {
      reportError(new Error("Network error"));
      reportError(new Error("Fetch failed"));
      reportError(new Error("API status 404"));
      reportError(new Error("Audio playback issue"));
      reportError(new Error("Random error"));

      const stats = getErrorStats();
      expect(stats.network).toBe(2);
      expect(stats.api).toBe(1);
      expect(stats.audio).toBe(1);
      expect(stats.unknown).toBe(1);
    });

    it("returns zero counts for empty categories", () => {
      const stats = getErrorStats();
      expect(stats.network).toBe(0);
      expect(stats.api).toBe(0);
      expect(stats.audio).toBe(0);
      expect(stats.storage).toBe(0);
      expect(stats.render).toBe(0);
      expect(stats.unknown).toBe(0);
    });
  });

  describe("createErrorHandler", () => {
    it("creates a catch handler function", () => {
      const handler = createErrorHandler("TestComponent");
      expect(typeof handler).toBe("function");
    });

    it("reports error when called", () => {
      const handler = createErrorHandler("TestComponent");
      handler(new Error("Handler error"));
      const errors = getRecentErrors();
      expect(errors[0].message).toBe("Handler error");
      expect(errors[0].context).toBe("TestComponent");
    });

    it("can be used with Promise.catch()", async () => {
      const handler = createErrorHandler("PromiseTest");
      await Promise.reject(new Error("Promise rejection")).catch(handler);
      const errors = getRecentErrors();
      expect(errors[0].message).toBe("Promise rejection");
    });
  });
});
