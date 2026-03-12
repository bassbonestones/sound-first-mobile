/**
 * Tests for useDebounce hook
 *
 * Fully typed TypeScript test file example.
 */

import { renderHook, act } from "@testing-library/react-native";
import { useDebounce, useDebouncedCallback } from "../src/hooks/useDebounce";

// Use fake timers for debounce tests
jest.useFakeTimers();

describe("useDebounce", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("useDebounce (value)", () => {
    it("returns initial value immediately", () => {
      const { result } = renderHook(() => useDebounce("initial"));
      expect(result.current).toBe("initial");
    });

    it("debounces value changes", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: "initial" } },
      );

      expect(result.current).toBe("initial");

      // Update the value
      rerender({ value: "updated" });

      // Value should still be initial (not yet debounced)
      expect(result.current).toBe("initial");

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Now value should be updated
      expect(result.current).toBe("updated");
    });

    it("resets timer on rapid changes", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: "a" } },
      );

      // Rapid updates
      rerender({ value: "b" });
      act(() => {
        jest.advanceTimersByTime(100);
      });

      rerender({ value: "c" });
      act(() => {
        jest.advanceTimersByTime(100);
      });

      rerender({ value: "d" });
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Still should be "a" since timer keeps resetting
      expect(result.current).toBe("a");

      // Complete the debounce
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Now should have final value
      expect(result.current).toBe("d");
    });

    it("uses default delay of 300ms", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value),
        { initialProps: { value: "initial" } },
      );

      rerender({ value: "updated" });

      // At 299ms, still initial
      act(() => {
        jest.advanceTimersByTime(299);
      });
      expect(result.current).toBe("initial");

      // At 300ms, updated
      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(result.current).toBe("updated");
    });

    it("accepts custom delay", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: "initial" } },
      );

      rerender({ value: "updated" });

      act(() => {
        jest.advanceTimersByTime(499);
      });
      expect(result.current).toBe("initial");

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(result.current).toBe("updated");
    });
  });

  describe("useDebouncedCallback", () => {
    it("debounces callback execution", () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useDebouncedCallback(callback, 300));

      // Call multiple times rapidly
      act(() => {
        result.current("a");
        result.current("b");
        result.current("c");
      });

      // Callback should not be called yet
      expect(callback).not.toHaveBeenCalled();

      // Fast-forward
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should be called once with last value
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("c");
    });

    it("uses default delay of 300ms", () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useDebouncedCallback(callback));

      act(() => {
        result.current("test");
      });

      act(() => {
        jest.advanceTimersByTime(299);
      });
      expect(callback).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(callback).toHaveBeenCalledWith("test");
    });
  });
});
