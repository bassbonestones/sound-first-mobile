/**
 * Tests for useAsyncState hook
 *
 * Fully typed TypeScript test file example.
 */

import { renderHook, act } from "@testing-library/react-native";
import { useAsyncState } from "../src/hooks/useAsyncState";

describe("useAsyncState", () => {
  describe("Initial state", () => {
    it("returns initial data as null by default", () => {
      const { result } = renderHook(() => useAsyncState<string>());
      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("accepts initial data", () => {
      const { result } = renderHook(() =>
        useAsyncState<{ initial: string }>({ initial: "value" }),
      );
      expect(result.current.data).toEqual({ initial: "value" });
    });
  });

  describe("execute", () => {
    it("sets loading to true during execution", async () => {
      const { result } = renderHook(() => useAsyncState<string>());

      let resolvePromise: (value: string) => void;
      const asyncFn = (): Promise<string> =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        });

      act(() => {
        result.current.execute(asyncFn);
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise!("done");
      });

      expect(result.current.loading).toBe(false);
    });

    it("sets data on successful execution", async () => {
      const { result } = renderHook(() =>
        useAsyncState<{ success: boolean }>(),
      );

      await act(async () => {
        await result.current.execute(async () => ({ success: true }));
      });

      expect(result.current.data).toEqual({ success: true });
      expect(result.current.error).toBeNull();
    });

    it("sets error on failed execution", async () => {
      const { result } = renderHook(() => useAsyncState<string>());
      const testError = new Error("Test error");

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await act(async () => {
        await result.current.execute(async (): Promise<string> => {
          throw testError;
        });
      });

      expect(result.current.error).toBe(testError);
      expect(result.current.data).toBeNull();

      consoleSpy.mockRestore();
    });

    it("returns result from successful execution", async () => {
      const { result } = renderHook(() => useAsyncState<string>());

      let returnValue: string | null;
      await act(async () => {
        returnValue = await result.current.execute(async () => "return value");
      });

      expect(returnValue!).toBe("return value");
    });

    it("returns null on failed execution", async () => {
      const { result } = renderHook(() => useAsyncState<string>());
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      let returnValue: string | null;
      await act(async () => {
        returnValue = await result.current.execute(
          async (): Promise<string> => {
            throw new Error("fail");
          },
        );
      });

      expect(returnValue!).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe("setData", () => {
    it("manually sets data", () => {
      const { result } = renderHook(() => useAsyncState<{ manual: boolean }>());

      act(() => {
        result.current.setData({ manual: true });
      });

      expect(result.current.data).toEqual({ manual: true });
    });
  });

  describe("reset", () => {
    it("resets to initial state", async () => {
      const { result } = renderHook(() => useAsyncState<string>("initial"));

      await act(async () => {
        await result.current.execute(async () => "new value");
      });

      expect(result.current.data).toBe("new value");

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBe("initial");
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
