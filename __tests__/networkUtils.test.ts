/**
 * Network Utilities Tests
 *
 * Tests for network status checking, offline detection.
 */

// Mock devLogger
jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devError: jest.fn(),
}));

// Store the mock state for NetInfo
const mockNetInfoState = {
  isConnected: true,
  isInternetReachable: true,
  type: "wifi",
  details: { isConnectionExpensive: false },
};

// Mock @react-native-community/netinfo
jest.mock(
  "@react-native-community/netinfo",
  () => ({
    default: {
      fetch: jest.fn(() => Promise.resolve(mockNetInfoState)),
      addEventListener: jest.fn((callback) => {
        // Return unsubscribe function
        return () => {};
      }),
    },
  }),
  { virtual: true },
);

// Need to reimport after setting up mocks
// Clear the module cache first
beforeEach(() => {
  jest.resetModules();
  // Reset mock state
  mockNetInfoState.isConnected = true;
  mockNetInfoState.isInternetReachable = true;
  mockNetInfoState.type = "wifi";
  mockNetInfoState.details = { isConnectionExpensive: false };
});

describe("networkUtils", () => {
  describe("getNetworkStatus", () => {
    it("should return connected status when online", async () => {
      const {
        getNetworkStatus,
      } = require("../src/features/importMusic/utils/networkUtils");

      const status = await getNetworkStatus();

      expect(status.isConnected).toBe(true);
      expect(status.isReachable).toBe(true);
      expect(status.type).toBe("wifi");
      expect(status.isMetered).toBe(false);
    });

    it("should return disconnected status when offline", async () => {
      mockNetInfoState.isConnected = false;
      mockNetInfoState.isInternetReachable = false;

      const {
        getNetworkStatus,
      } = require("../src/features/importMusic/utils/networkUtils");

      const status = await getNetworkStatus();

      expect(status.isConnected).toBe(false);
      expect(status.isReachable).toBe(false);
    });

    it("should detect metered connections", async () => {
      mockNetInfoState.type = "cellular";
      mockNetInfoState.details = { isConnectionExpensive: true };

      const {
        getNetworkStatus,
      } = require("../src/features/importMusic/utils/networkUtils");

      const status = await getNetworkStatus();

      expect(status.isMetered).toBe(true);
      expect(status.type).toBe("cellular");
    });

    it("should handle null values from NetInfo", async () => {
      mockNetInfoState.isConnected = null as unknown as boolean;
      mockNetInfoState.isInternetReachable = null as unknown as boolean;
      mockNetInfoState.details = null;

      const {
        getNetworkStatus,
      } = require("../src/features/importMusic/utils/networkUtils");

      const status = await getNetworkStatus();

      expect(status.isConnected).toBe(false);
      expect(status.isReachable).toBe(false);
      expect(status.isMetered).toBe(false);
    });
  });

  describe("checkNetworkAvailable", () => {
    it("should return available: true when connected", async () => {
      const {
        checkNetworkAvailable,
      } = require("../src/features/importMusic/utils/networkUtils");

      const result = await checkNetworkAvailable();

      expect(result.available).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should return error when disconnected", async () => {
      mockNetInfoState.isConnected = false;

      const {
        checkNetworkAvailable,
      } = require("../src/features/importMusic/utils/networkUtils");

      const result = await checkNetworkAvailable();

      expect(result.available).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe("network_error");
    });

    it("should check reachability when required", async () => {
      mockNetInfoState.isConnected = true;
      mockNetInfoState.isInternetReachable = false;

      const {
        checkNetworkAvailable,
      } = require("../src/features/importMusic/utils/networkUtils");

      const result = await checkNetworkAvailable({ requireReachable: true });

      expect(result.available).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should allow unreachable when requireReachable is false", async () => {
      mockNetInfoState.isConnected = true;
      mockNetInfoState.isInternetReachable = false;

      const {
        checkNetworkAvailable,
      } = require("../src/features/importMusic/utils/networkUtils");

      const result = await checkNetworkAvailable({ requireReachable: false });

      expect(result.available).toBe(true);
    });

    it("should block metered connections when allowMetered is false", async () => {
      mockNetInfoState.details = { isConnectionExpensive: true };

      const {
        checkNetworkAvailable,
      } = require("../src/features/importMusic/utils/networkUtils");

      const result = await checkNetworkAvailable({ allowMetered: false });

      expect(result.available).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should allow metered by default", async () => {
      mockNetInfoState.details = { isConnectionExpensive: true };

      const {
        checkNetworkAvailable,
      } = require("../src/features/importMusic/utils/networkUtils");

      const result = await checkNetworkAvailable();

      expect(result.available).toBe(true);
    });

    it("should use custom error message", async () => {
      mockNetInfoState.isConnected = false;

      const {
        checkNetworkAvailable,
      } = require("../src/features/importMusic/utils/networkUtils");

      const result = await checkNetworkAvailable({
        errorMessage: "Please connect to upload your score",
      });

      expect(result.error?.userMessage).toBe(
        "Please connect to upload your score",
      );
    });
  });

  describe("isNetworkError", () => {
    it("should detect timeout errors", async () => {
      const {
        isNetworkError,
      } = require("../src/features/importMusic/utils/networkUtils");

      // isNetworkError is a type guard for { networkError: ImportError }
      expect(isNetworkError({ networkError: { code: "timeout" } })).toBe(true);
      expect(isNetworkError({ data: "success" })).toBe(false);
    });

    it("should detect network error objects", async () => {
      const {
        isNetworkError,
      } = require("../src/features/importMusic/utils/networkUtils");

      expect(isNetworkError({ networkError: { code: "network_error" } })).toBe(
        true,
      );
    });

    it("should return false for non-network-error results", async () => {
      const {
        isNetworkError,
      } = require("../src/features/importMusic/utils/networkUtils");

      expect(isNetworkError({ success: true })).toBe(false);
      expect(isNetworkError("string")).toBe(false);
    });

    it("should not flag non-network errors", async () => {
      const {
        isNetworkError,
      } = require("../src/features/importMusic/utils/networkUtils");

      expect(isNetworkError(new Error("Invalid JSON"))).toBe(false);
      expect(isNetworkError(new Error("File not found"))).toBe(false);
      expect(isNetworkError(new TypeError("Cannot read property"))).toBe(false);
    });

    it("should handle non-Error objects", async () => {
      const {
        isNetworkError,
      } = require("../src/features/importMusic/utils/networkUtils");

      expect(isNetworkError("string error")).toBe(false);
      expect(isNetworkError(null)).toBe(false);
      expect(isNetworkError(undefined)).toBe(false);
      expect(isNetworkError(42)).toBe(false);
    });
  });

  describe("withTimeout", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should resolve if operation completes before timeout", async () => {
      const {
        withTimeout,
      } = require("../src/features/importMusic/utils/networkUtils");

      const operation = Promise.resolve("result");
      const resultPromise = withTimeout(operation, 5000);

      jest.runAllTimers();
      const result = await resultPromise;

      expect(result).toBe("result");
    });

    it("should reject with timeout error if operation takes too long", async () => {
      const {
        withTimeout,
      } = require("../src/features/importMusic/utils/networkUtils");

      const neverResolves = new Promise(() => {});
      const resultPromise = withTimeout(neverResolves, 1000);

      jest.advanceTimersByTime(1001);

      await expect(resultPromise).rejects.toThrow("Operation timed out");
    });

    it("should use custom timeout message", async () => {
      const {
        withTimeout,
      } = require("../src/features/importMusic/utils/networkUtils");

      const neverResolves = new Promise(() => {});
      const resultPromise = withTimeout(
        neverResolves,
        1000,
        "Upload took too long",
      );

      jest.advanceTimersByTime(1001);

      await expect(resultPromise).rejects.toThrow("Upload took too long");
    });
  });
});

describe("networkUtils without NetInfo", () => {
  beforeEach(() => {
    jest.resetModules();
    // Mock NetInfo to throw (simulate not installed)
    jest.mock(
      "@react-native-community/netinfo",
      () => {
        throw new Error("Module not found");
      },
      { virtual: true },
    );
  });

  it("should assume connected when NetInfo unavailable", async () => {
    // Need to re-require after changing the mock
    jest.isolateModules(async () => {
      const {
        getNetworkStatus,
      } = require("../src/features/importMusic/utils/networkUtils");

      const status = await getNetworkStatus();

      expect(status.isConnected).toBe(true);
      expect(status.isReachable).toBe(true);
      expect(status.type).toBe("unknown");
    });
  });
});
