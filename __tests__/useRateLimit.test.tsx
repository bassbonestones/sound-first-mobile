/**
 * Tests for useRateLimit hook
 *
 * Tests rate limit tracking and quota management functionality
 */

import { renderHook, act } from "@testing-library/react-native";
import { useRateLimit } from "../src/features/importMusic/hooks/useRateLimit";

describe("useRateLimit", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("initial state", () => {
    it("should return initial rate limit state", () => {
      const { result } = renderHook(() => useRateLimit());

      expect(result.current.rateLimit).toBeDefined();
      expect(result.current.omrQuota).toBeDefined();
      expect(result.current.rateLimit.isLimited).toBe(false);
    });

    it("should have default rate limit values", () => {
      const { result } = renderHook(() => useRateLimit());

      expect(result.current.rateLimit.requestsRemaining).toBeNull();
      expect(result.current.rateLimit.requestsLimit).toBeNull();
      expect(result.current.rateLimit.warningLevel).toBe("none");
    });

    it("should have default OMR quota values", () => {
      const { result } = renderHook(() => useRateLimit());

      expect(result.current.omrQuota.pagesRemaining).toBeNull();
      expect(result.current.omrQuota.monthlyLimit).toBeNull();
      expect(result.current.omrQuota.warningLevel).toBe("none");
    });
  });

  describe("updateFromHeaders", () => {
    it("should update rate limit from response headers", () => {
      const { result } = renderHook(() => useRateLimit());

      const headers = new Headers({
        "X-RateLimit-Remaining": "50",
        "X-RateLimit-Limit": "100",
        "X-RateLimit-Reset": "60",
      });

      act(() => {
        result.current.updateFromHeaders(headers);
      });

      expect(result.current.rateLimit.requestsRemaining).toBe(50);
      expect(result.current.rateLimit.requestsLimit).toBe(100);
    });

    it("should handle missing headers gracefully", () => {
      const { result } = renderHook(() => useRateLimit());

      const headers = new Headers({});

      expect(() => {
        act(() => {
          result.current.updateFromHeaders(headers);
        });
      }).not.toThrow();
    });

    it("should handle partial headers", () => {
      const { result } = renderHook(() => useRateLimit());

      const headers = new Headers({
        "X-RateLimit-Remaining": "25",
      });

      act(() => {
        result.current.updateFromHeaders(headers);
      });

      expect(result.current.rateLimit.requestsRemaining).toBe(25);
    });
  });

  describe("updateRateLimit", () => {
    it("should directly update rate limit values", () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        result.current.updateRateLimit({
          remaining: 10,
          limit: 100,
          resetInSeconds: 30,
        });
      });

      expect(result.current.rateLimit.requestsRemaining).toBe(10);
      expect(result.current.rateLimit.requestsLimit).toBe(100);
      expect(result.current.rateLimit.resetInSeconds).toBe(30);
    });

    it("should set isLimited when remaining is 0", () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        result.current.updateRateLimit({
          remaining: 0,
          limit: 100,
          resetInSeconds: 60,
        });
      });

      expect(result.current.rateLimit.isLimited).toBe(true);
    });
  });

  describe("updateOmrQuota", () => {
    it("should update OMR quota values", () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        result.current.updateOmrQuota({
          pagesRemaining: 50,
          monthlyLimit: 100,
          resetInDays: 15,
        });
      });

      expect(result.current.omrQuota.pagesRemaining).toBe(50);
      expect(result.current.omrQuota.monthlyLimit).toBe(100);
    });

    it("should include reset days", () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        result.current.updateOmrQuota({
          pagesRemaining: 30,
          monthlyLimit: 100,
          resetInDays: 10,
        });
      });

      expect(result.current.omrQuota.resetInDays).toBe(10);
    });
  });

  describe("rateLimit.isLimited", () => {
    it("should return false when remaining > 0", () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        result.current.updateRateLimit({
          remaining: 10,
          limit: 100,
          resetInSeconds: 60,
        });
      });

      expect(result.current.rateLimit.isLimited).toBe(false);
    });

    it("should return true when remaining = 0", () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        result.current.updateRateLimit({
          remaining: 0,
          limit: 100,
          resetInSeconds: 60,
        });
      });

      expect(result.current.rateLimit.isLimited).toBe(true);
    });
  });

  describe("warningLevel", () => {
    it("should return 'none' when plenty remaining", () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        result.current.updateRateLimit({
          remaining: 80,
          limit: 100,
          resetInSeconds: 60,
        });
      });

      expect(result.current.rateLimit.warningLevel).toBe("none");
    });

    it("should return 'low' when < 10 remaining", () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        result.current.updateRateLimit({
          remaining: 8,
          limit: 100,
          resetInSeconds: 60,
        });
      });

      expect(result.current.rateLimit.warningLevel).toBe("low");
    });

    it("should return 'critical' when < 3 remaining", () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        result.current.updateRateLimit({
          remaining: 2,
          limit: 100,
          resetInSeconds: 60,
        });
      });

      expect(result.current.rateLimit.warningLevel).toBe("critical");
    });
  });

  describe("omrQuota warning levels", () => {
    it("should return 'none' when plenty of OMR quota", () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        result.current.updateOmrQuota({
          pagesRemaining: 80,
          monthlyLimit: 100,
          resetInDays: 15,
        });
      });

      expect(result.current.omrQuota.warningLevel).toBe("none");
    });

    it("should return 'low' when OMR quota approaches limit", () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        result.current.updateOmrQuota({
          pagesRemaining: 40,
          monthlyLimit: 100,
          resetInDays: 15,
        });
      });

      expect(result.current.omrQuota.warningLevel).toBe("low");
    });

    it("should return 'critical' when OMR quota very low", () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        result.current.updateOmrQuota({
          pagesRemaining: 5,
          monthlyLimit: 100,
          resetInDays: 15,
        });
      });

      expect(result.current.omrQuota.warningLevel).toBe("critical");
    });
  });

  describe("shouldShowWarning", () => {
    it("should return false when no warnings", () => {
      const { result } = renderHook(() => useRateLimit());

      expect(result.current.shouldShowWarning).toBe(false);
    });

    it("should return true when rate limit warning active", () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        result.current.updateRateLimit({
          remaining: 2,
          limit: 100,
          resetInSeconds: 60,
        });
      });

      expect(result.current.shouldShowWarning).toBe(true);
    });
  });

  describe("getWarningMessage", () => {
    it("should return null when no warnings", () => {
      const { result } = renderHook(() => useRateLimit());

      const message = result.current.getWarningMessage();
      expect(message).toBeNull();
    });

    it("should return message when rate limited", () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        result.current.updateRateLimit({
          remaining: 0,
          limit: 100,
          resetInSeconds: 60,
        });
      });

      const message = result.current.getWarningMessage();
      expect(message).not.toBeNull();
      expect(typeof message).toBe("string");
    });
  });

  describe("resetTimeDisplay", () => {
    it("should format reset time for display", () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        result.current.updateRateLimit({
          remaining: 0,
          limit: 100,
          resetInSeconds: 120, // 2 minutes
        });
      });

      expect(result.current.rateLimit.resetTimeDisplay).toMatch(/\d+[smh]/);
    });

    it("should show seconds format for < 60s", () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        result.current.updateRateLimit({
          remaining: 0,
          limit: 100,
          resetInSeconds: 45,
        });
      });

      expect(result.current.rateLimit.resetTimeDisplay).toBe("45s");
    });

    it("should show minutes format for >= 60s", () => {
      const { result } = renderHook(() => useRateLimit());

      act(() => {
        result.current.updateRateLimit({
          remaining: 0,
          limit: 100,
          resetInSeconds: 120,
        });
      });

      expect(result.current.rateLimit.resetTimeDisplay).toBe("2m");
    });
  });
});
