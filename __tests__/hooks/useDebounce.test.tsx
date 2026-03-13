/**
 * Tests for useDebounce and useDebouncedCallback hooks
 */

import { renderHook, act } from "@testing-library/react-native";
import { useDebounce, useDebouncedCallback } from "../../src/hooks/useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ==========================================================================
  // BASIC FUNCTIONALITY
  // ==========================================================================
  describe("Basic Functionality", () => {
    it("returns initial value immediately", () => {
      const { result } = renderHook(() => useDebounce("test", 300));
      expect(result.current).toBe("test");
    });

    it("returns debounced value after delay", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: "initial" } },
      );

      // Change value
      rerender({ value: "updated" });

      // Should still be initial value
      expect(result.current).toBe("initial");

      // Advance timers
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should now be updated
      expect(result.current).toBe("updated");
    });

    it("uses default delay of 300ms", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value),
        { initialProps: { value: "initial" } },
      );

      rerender({ value: "updated" });

      // Not updated at 299ms
      act(() => {
        jest.advanceTimersByTime(299);
      });
      expect(result.current).toBe("initial");

      // Updated at 300ms
      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(result.current).toBe("updated");
    });

    it("respects custom delay", () => {
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

  // ==========================================================================
  // MULTIPLE CHANGES
  // ==========================================================================
  describe("Multiple Changes", () => {
    it("cancels previous timer on rapid changes", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: "first" } },
      );

      // Make rapid changes
      rerender({ value: "second" });
      act(() => {
        jest.advanceTimersByTime(100);
      });

      rerender({ value: "third" });
      act(() => {
        jest.advanceTimersByTime(100);
      });

      rerender({ value: "fourth" });

      // Should still be first value
      expect(result.current).toBe("first");

      // Wait for debounce
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should be the last value
      expect(result.current).toBe("fourth");
    });

    it("handles value changing back to original", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: "original" } },
      );

      rerender({ value: "changed" });
      act(() => {
        jest.advanceTimersByTime(100);
      });

      rerender({ value: "original" });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe("original");
    });
  });

  // ==========================================================================
  // DIFFERENT TYPES
  // ==========================================================================
  describe("Different Types", () => {
    it("works with numbers", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 42 } },
      );

      rerender({ value: 100 });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe(100);
    });

    it("works with objects", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: { name: "test" } } },
      );

      const newObject = { name: "updated" };
      rerender({ value: newObject });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toEqual({ name: "updated" });
    });

    it("works with arrays", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: [1, 2, 3] } },
      );

      rerender({ value: [4, 5, 6] });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toEqual([4, 5, 6]);
    });

    it("works with null", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce<string | null>(value, 300),
        { initialProps: { value: "test" as string | null } },
      );

      rerender({ value: null });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBeNull();
    });

    it("works with undefined", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce<string | undefined>(value, 300),
        { initialProps: { value: "test" as string | undefined } },
      );

      rerender({ value: undefined });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBeUndefined();
    });

    it("works with booleans", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: false } },
      );

      rerender({ value: true });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe(true);
    });
  });

  // ==========================================================================
  // CLEANUP
  // ==========================================================================
  describe("Cleanup", () => {
    it("clears timer on unmount", () => {
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

      const { unmount } = renderHook(() => useDebounce("test", 300));

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it("clears timer when value changes", () => {
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

      const { rerender } = renderHook(({ value }) => useDebounce(value, 300), {
        initialProps: { value: "initial" },
      });

      rerender({ value: "updated" });

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });
});

describe("useDebouncedCallback", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ==========================================================================
  // BASIC FUNCTIONALITY
  // ==========================================================================
  describe("Basic Functionality", () => {
    it("returns a function", () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useDebouncedCallback(callback, 300));

      expect(typeof result.current).toBe("function");
    });

    it("calls callback after delay", () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useDebouncedCallback(callback, 300));

      act(() => {
        result.current();
      });

      expect(callback).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("passes arguments to callback", () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useDebouncedCallback(callback, 300));

      act(() => {
        result.current("arg1", "arg2", 123);
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(callback).toHaveBeenCalledWith("arg1", "arg2", 123);
    });

    it("uses default delay of 300ms", () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useDebouncedCallback(callback));

      act(() => {
        result.current();
      });

      act(() => {
        jest.advanceTimersByTime(299);
      });
      expect(callback).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(callback).toHaveBeenCalled();
    });

    it("respects custom delay", () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useDebouncedCallback(callback, 500));

      act(() => {
        result.current();
      });

      act(() => {
        jest.advanceTimersByTime(499);
      });
      expect(callback).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(callback).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // RAPID CALLS
  // ==========================================================================
  describe("Rapid Calls", () => {
    it("cancels previous call on rapid invocations", () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useDebouncedCallback(callback, 300));

      act(() => {
        result.current("first");
        jest.advanceTimersByTime(100);
        result.current("second");
        jest.advanceTimersByTime(100);
        result.current("third");
      });

      expect(callback).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("third");
    });

    it("only calls once after multiple rapid invocations", () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useDebouncedCallback(callback, 300));

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current(i);
          jest.advanceTimersByTime(50);
        }
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(9);
    });
  });

  // ==========================================================================
  // STABLE REFERENCE
  // ==========================================================================
  describe("Stable Reference", () => {
    it("returns same function reference on rerender", () => {
      const callback = jest.fn();
      const { result, rerender } = renderHook(() =>
        useDebouncedCallback(callback, 300),
      );

      const firstRef = result.current;
      rerender();
      const secondRef = result.current;

      expect(firstRef).toBe(secondRef);
    });
  });

  // ==========================================================================
  // CLEANUP
  // ==========================================================================
  describe("Cleanup", () => {
    it("clears timer on unmount", () => {
      const callback = jest.fn();
      const { result, unmount } = renderHook(() =>
        useDebouncedCallback(callback, 300),
      );

      act(() => {
        result.current();
      });

      unmount();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("does not call callback if unmounted during delay", () => {
      const callback = jest.fn();
      const { result, unmount } = renderHook(() =>
        useDebouncedCallback(callback, 300),
      );

      act(() => {
        result.current("test");
      });

      act(() => {
        jest.advanceTimersByTime(150);
      });

      unmount();

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================
  describe("Edge Cases", () => {
    it("handles zero delay", () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useDebouncedCallback(callback, 0));

      act(() => {
        result.current();
      });

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(callback).toHaveBeenCalled();
    });

    it("handles very long delay", () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useDebouncedCallback(callback, 10000),
      );

      act(() => {
        result.current();
      });

      act(() => {
        jest.advanceTimersByTime(9999);
      });
      expect(callback).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(callback).toHaveBeenCalled();
    });

    it("handles callback that throws", () => {
      const callback = jest.fn(() => {
        throw new Error("Test error");
      });
      const { result } = renderHook(() => useDebouncedCallback(callback, 300));

      act(() => {
        result.current();
      });

      expect(() => {
        act(() => {
          jest.advanceTimersByTime(300);
        });
      }).toThrow("Test error");
    });
  });
});
