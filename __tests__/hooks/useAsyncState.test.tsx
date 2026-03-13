/**
 * Tests for useAsyncState hook
 */

import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useAsyncState } from "../../src/hooks/useAsyncState";

// Mock devLogger
jest.mock("../../src/utils/devLogger", () => ({
  devError: jest.fn(),
  devLog: jest.fn(),
  devWarn: jest.fn(),
}));

describe("useAsyncState", () => {
  // ==========================================================================
  // INITIAL STATE
  // ==========================================================================
  describe("Initial State", () => {
    it("returns correct initial state", () => {
      const { result } = renderHook(() => useAsyncState());

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.execute).toBe("function");
      expect(typeof result.current.setData).toBe("function");
      expect(typeof result.current.reset).toBe("function");
    });

    it("accepts initial data", () => {
      const initialData = { name: "test" };
      const { result } = renderHook(() => useAsyncState(initialData));

      expect(result.current.data).toEqual(initialData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("accepts null as initial data", () => {
      const { result } = renderHook(() => useAsyncState(null));

      expect(result.current.data).toBeNull();
    });

    it("accepts typed initial data", () => {
      interface User {
        id: number;
        name: string;
      }

      const { result } = renderHook(() =>
        useAsyncState<User>({ id: 1, name: "Test" }),
      );

      expect(result.current.data).toEqual({ id: 1, name: "Test" });
    });
  });

  // ==========================================================================
  // EXECUTE FUNCTION
  // ==========================================================================
  describe("Execute Function", () => {
    it("sets loading to true during execution", async () => {
      const { result } = renderHook(() => useAsyncState());

      let resolvePromise: (value: string) => void;
      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });

      act(() => {
        result.current.execute(() => promise);
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise("done");
        await promise;
      });

      expect(result.current.loading).toBe(false);
    });

    it("updates data on successful execution", async () => {
      const { result } = renderHook(() => useAsyncState<string>());

      await act(async () => {
        await result.current.execute(async () => "result data");
      });

      expect(result.current.data).toBe("result data");
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("returns result from execute", async () => {
      const { result } = renderHook(() => useAsyncState<string>());

      let returnValue: string | null = null;
      await act(async () => {
        returnValue = await result.current.execute(
          async () => "returned value",
        );
      });

      expect(returnValue).toBe("returned value");
    });

    it("clears error before new execution", async () => {
      const { result } = renderHook(() => useAsyncState());

      // First, create an error
      await act(async () => {
        await result.current.execute(async () => {
          throw new Error("First error");
        });
      });

      expect(result.current.error).toBeTruthy();

      // Now execute successfully
      await act(async () => {
        await result.current.execute(async () => "success");
      });

      expect(result.current.error).toBeNull();
      expect(result.current.data).toBe("success");
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================
  describe("Error Handling", () => {
    it("sets error on failed execution", async () => {
      const { result } = renderHook(() => useAsyncState());

      await act(async () => {
        await result.current.execute(async () => {
          throw new Error("Test error");
        });
      });

      expect(result.current.error).toEqual(new Error("Test error"));
      expect(result.current.loading).toBe(false);
    });

    it("returns null on error", async () => {
      const { result } = renderHook(() => useAsyncState());

      let returnValue: unknown = "not null";
      await act(async () => {
        returnValue = await result.current.execute(async () => {
          throw new Error("Test error");
        });
      });

      expect(returnValue).toBeNull();
    });

    it("converts non-Error throws to Error", async () => {
      const { result } = renderHook(() => useAsyncState());

      await act(async () => {
        await result.current.execute(async () => {
          throw "string error";
        });
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("string error");
    });

    it("handles Error objects correctly", async () => {
      const { result } = renderHook(() => useAsyncState());
      const customError = new Error("Custom error");

      await act(async () => {
        await result.current.execute(async () => {
          throw customError;
        });
      });

      expect(result.current.error).toBe(customError);
    });
  });

  // ==========================================================================
  // SET DATA
  // ==========================================================================
  describe("setData", () => {
    it("allows direct data updates", () => {
      const { result } = renderHook(() => useAsyncState<string>());

      act(() => {
        result.current.setData("manual update");
      });

      expect(result.current.data).toBe("manual update");
    });

    it("supports functional updates", () => {
      const { result } = renderHook(() => useAsyncState<number>(5));

      act(() => {
        result.current.setData((prev) => (prev ?? 0) + 10);
      });

      expect(result.current.data).toBe(15);
    });

    it("can update to null", () => {
      const { result } = renderHook(() => useAsyncState<string>("initial"));

      act(() => {
        result.current.setData(null);
      });

      expect(result.current.data).toBeNull();
    });
  });

  // ==========================================================================
  // RESET
  // ==========================================================================
  describe("Reset", () => {
    it("resets to initial state", async () => {
      const { result } = renderHook(() => useAsyncState<string>("initial"));

      // Change state
      await act(async () => {
        await result.current.execute(async () => "changed");
      });

      expect(result.current.data).toBe("changed");

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBe("initial");
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("resets to null if no initial data", async () => {
      const { result } = renderHook(() => useAsyncState());

      await act(async () => {
        await result.current.execute(async () => "some data");
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
    });

    it("clears error on reset", async () => {
      const { result } = renderHook(() => useAsyncState());

      await act(async () => {
        await result.current.execute(async () => {
          throw new Error("Error");
        });
      });

      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
    });

    it("clears loading on reset", async () => {
      const { result } = renderHook(() => useAsyncState());

      // Start an operation that will hang
      let resolvePromise: () => void;
      const hangingPromise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });

      act(() => {
        result.current.execute(() => hangingPromise);
      });

      expect(result.current.loading).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.loading).toBe(false);

      // Cleanup
      await act(async () => {
        resolvePromise();
        await hangingPromise;
      });
    });
  });

  // ==========================================================================
  // DIFFERENT TYPES
  // ==========================================================================
  describe("Different Types", () => {
    it("works with arrays", async () => {
      const { result } = renderHook(() => useAsyncState<number[]>());

      await act(async () => {
        await result.current.execute(async () => [1, 2, 3]);
      });

      expect(result.current.data).toEqual([1, 2, 3]);
    });

    it("works with objects", async () => {
      interface User {
        id: number;
        name: string;
      }

      const { result } = renderHook(() => useAsyncState<User>());

      await act(async () => {
        await result.current.execute(async () => ({ id: 1, name: "Test" }));
      });

      expect(result.current.data).toEqual({ id: 1, name: "Test" });
    });

    it("works with primitives", async () => {
      const { result } = renderHook(() => useAsyncState<number>());

      await act(async () => {
        await result.current.execute(async () => 42);
      });

      expect(result.current.data).toBe(42);
    });

    it("works with boolean", async () => {
      const { result } = renderHook(() => useAsyncState<boolean>());

      await act(async () => {
        await result.current.execute(async () => true);
      });

      expect(result.current.data).toBe(true);
    });
  });

  // ==========================================================================
  // CONCURRENT OPERATIONS
  // ==========================================================================
  describe("Concurrent Operations", () => {
    it("handles multiple sequential executions", async () => {
      const { result } = renderHook(() => useAsyncState<number>());

      await act(async () => {
        await result.current.execute(async () => 1);
      });
      expect(result.current.data).toBe(1);

      await act(async () => {
        await result.current.execute(async () => 2);
      });
      expect(result.current.data).toBe(2);

      await act(async () => {
        await result.current.execute(async () => 3);
      });
      expect(result.current.data).toBe(3);
    });
  });

  // ==========================================================================
  // STABLE REFERENCES
  // ==========================================================================
  describe("Stable References", () => {
    it("execute function is stable", () => {
      const { result, rerender } = renderHook(() => useAsyncState());

      const firstExecute = result.current.execute;
      rerender();
      const secondExecute = result.current.execute;

      expect(firstExecute).toBe(secondExecute);
    });

    it("setData function is stable", () => {
      const { result, rerender } = renderHook(() => useAsyncState());

      const firstSetData = result.current.setData;
      rerender();
      const secondSetData = result.current.setData;

      // setData from useState should be stable
      expect(firstSetData).toBe(secondSetData);
    });

    it("reset function is stable when initial data doesn't change", () => {
      const { result, rerender } = renderHook(() => useAsyncState("fixed"));

      const firstReset = result.current.reset;
      rerender();
      const secondReset = result.current.reset;

      expect(firstReset).toBe(secondReset);
    });
  });
});
