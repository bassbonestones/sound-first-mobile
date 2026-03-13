/**
 * Tests for useApi hook
 */

import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useApi } from "../../src/hooks/useApi";

// Mock the API client
jest.mock("../../src/api/client", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  baseUrl: "http://test-api.com",
}));

// Mock devLogger
jest.mock("../../src/utils/devLogger", () => ({
  devError: jest.fn(),
  devLog: jest.fn(),
  devWarn: jest.fn(),
}));

import { api } from "../../src/api/client";

const mockApi = api as jest.Mocked<typeof api>;

describe("useApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // INITIAL STATE
  // ==========================================================================
  describe("Initial State", () => {
    it("returns correct initial state", () => {
      const { result } = renderHook(() => useApi());

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.get).toBe("function");
      expect(typeof result.current.post).toBe("function");
      expect(typeof result.current.put).toBe("function");
      expect(typeof result.current.del).toBe("function");
      expect(typeof result.current.reset).toBe("function");
      expect(result.current.baseUrl).toBe("http://test-api.com");
    });
  });

  // ==========================================================================
  // GET REQUESTS
  // ==========================================================================
  describe("GET Requests", () => {
    it("makes GET request", async () => {
      mockApi.get.mockResolvedValue({ id: 1, name: "Test" });

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.get("/test");
      });

      expect(mockApi.get).toHaveBeenCalledWith("/test");
      expect(result.current.data).toEqual({ id: 1, name: "Test" });
    });

    it("sets loading during GET", async () => {
      let resolvePromise: (value: unknown) => void;
      mockApi.get.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
      );

      const { result } = renderHook(() => useApi());

      act(() => {
        result.current.get("/test");
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise({ data: "test" });
      });

      expect(result.current.loading).toBe(false);
    });

    it("returns GET result", async () => {
      const responseData = { items: [1, 2, 3] };
      mockApi.get.mockResolvedValue(responseData);

      const { result } = renderHook(() => useApi());

      let returnValue: unknown;
      await act(async () => {
        returnValue = await result.current.get("/items");
      });

      expect(returnValue).toEqual(responseData);
    });

    it("handles GET error", async () => {
      mockApi.get.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.get("/fail");
      });

      expect(result.current.error?.message).toBe("Network error");
      expect(result.current.data).toBeNull();
    });
  });

  // ==========================================================================
  // POST REQUESTS
  // ==========================================================================
  describe("POST Requests", () => {
    it("makes POST request with body", async () => {
      mockApi.post.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useApi());

      const body = { name: "Test", value: 42 };
      await act(async () => {
        await result.current.post("/create", body);
      });

      expect(mockApi.post).toHaveBeenCalledWith("/create", body);
      expect(result.current.data).toEqual({ success: true });
    });

    it("makes POST request without body", async () => {
      mockApi.post.mockResolvedValue({ triggered: true });

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.post("/trigger");
      });

      expect(mockApi.post).toHaveBeenCalledWith("/trigger", undefined);
    });

    it("sets loading during POST", async () => {
      let resolvePromise: (value: unknown) => void;
      mockApi.post.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
      );

      const { result } = renderHook(() => useApi());

      act(() => {
        result.current.post("/test", {});
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise({ created: true });
      });

      expect(result.current.loading).toBe(false);
    });

    it("handles POST error", async () => {
      mockApi.post.mockRejectedValue(new Error("Validation error"));

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.post("/create", { invalid: true });
      });

      expect(result.current.error?.message).toBe("Validation error");
    });
  });

  // ==========================================================================
  // PUT REQUESTS
  // ==========================================================================
  describe("PUT Requests", () => {
    it("makes PUT request with body", async () => {
      mockApi.put.mockResolvedValue({ updated: true });

      const { result } = renderHook(() => useApi());

      const body = { name: "Updated" };
      await act(async () => {
        await result.current.put("/update/1", body);
      });

      expect(mockApi.put).toHaveBeenCalledWith("/update/1", body);
      expect(result.current.data).toEqual({ updated: true });
    });

    it("makes PUT request without body", async () => {
      mockApi.put.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.put("/reset/1");
      });

      expect(mockApi.put).toHaveBeenCalledWith("/reset/1", undefined);
    });

    it("handles PUT error", async () => {
      mockApi.put.mockRejectedValue(new Error("Not found"));

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.put("/update/999", {});
      });

      expect(result.current.error?.message).toBe("Not found");
    });
  });

  // ==========================================================================
  // DELETE REQUESTS
  // ==========================================================================
  describe("DELETE Requests", () => {
    it("makes DELETE request", async () => {
      mockApi.delete.mockResolvedValue({ deleted: true });

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.del("/delete/1");
      });

      expect(mockApi.delete).toHaveBeenCalledWith("/delete/1");
      expect(result.current.data).toEqual({ deleted: true });
    });

    it("handles DELETE error", async () => {
      mockApi.delete.mockRejectedValue(new Error("Cannot delete"));

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.del("/delete/protected");
      });

      expect(result.current.error?.message).toBe("Cannot delete");
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================
  describe("Error Handling", () => {
    it("converts non-Error throws to Error", async () => {
      mockApi.get.mockRejectedValue("string error");

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.get("/fail");
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("string error");
    });

    it("returns null on error", async () => {
      mockApi.get.mockRejectedValue(new Error("Error"));

      const { result } = renderHook(() => useApi());

      let returnValue: unknown = "not null";
      await act(async () => {
        returnValue = await result.current.get("/fail");
      });

      expect(returnValue).toBeNull();
    });

    it("clears error by default before new request", async () => {
      mockApi.get.mockRejectedValueOnce(new Error("First error"));
      mockApi.get.mockResolvedValueOnce({ success: true });

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.get("/fail");
      });

      expect(result.current.error).toBeTruthy();

      await act(async () => {
        await result.current.get("/success");
      });

      expect(result.current.error).toBeNull();
    });

    it("can disable autoReset", async () => {
      mockApi.get.mockRejectedValueOnce(new Error("First error"));
      mockApi.get.mockResolvedValueOnce({ success: true });

      const { result } = renderHook(() => useApi({ autoReset: false }));

      await act(async () => {
        await result.current.get("/fail");
      });

      expect(result.current.error).toBeTruthy();

      await act(async () => {
        await result.current.get("/success");
      });

      // Error should still be there since autoReset is false
      expect(result.current.error).toBeTruthy();
    });
  });

  // ==========================================================================
  // RESET
  // ==========================================================================
  describe("Reset", () => {
    it("resets state to initial values", async () => {
      mockApi.get.mockResolvedValue({ data: "test" });

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.get("/test");
      });

      expect(result.current.data).toBeTruthy();

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("clears error on reset", async () => {
      mockApi.get.mockRejectedValue(new Error("Error"));

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.get("/fail");
      });

      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
    });
  });

  // ==========================================================================
  // TYPED RESPONSES
  // ==========================================================================
  describe("Typed Responses", () => {
    interface User {
      id: number;
      name: string;
    }

    it("supports typed data", async () => {
      mockApi.get.mockResolvedValue({ id: 1, name: "Test User" });

      const { result } = renderHook(() => useApi<User>());

      await act(async () => {
        await result.current.get("/users/1");
      });

      expect(result.current.data?.id).toBe(1);
      expect(result.current.data?.name).toBe("Test User");
    });

    it("supports typed method returns", async () => {
      mockApi.get.mockResolvedValue({ id: 1, name: "Test" });

      const { result } = renderHook(() => useApi());

      let user: User | null = null;
      await act(async () => {
        user = await result.current.get<User>("/users/1");
      });

      expect(user?.id).toBe(1);
    });
  });

  // ==========================================================================
  // STABLE REFERENCES
  // ==========================================================================
  describe("Stable References", () => {
    it("get function is stable", () => {
      const { result, rerender } = renderHook(() => useApi());

      const firstGet = result.current.get;
      rerender();
      const secondGet = result.current.get;

      expect(firstGet).toBe(secondGet);
    });

    it("post function is stable", () => {
      const { result, rerender } = renderHook(() => useApi());

      const firstPost = result.current.post;
      rerender();
      const secondPost = result.current.post;

      expect(firstPost).toBe(secondPost);
    });

    it("reset function is stable", () => {
      const { result, rerender } = renderHook(() => useApi());

      const firstReset = result.current.reset;
      rerender();
      const secondReset = result.current.reset;

      expect(firstReset).toBe(secondReset);
    });
  });

  // ==========================================================================
  // SEQUENTIAL REQUESTS
  // ==========================================================================
  describe("Sequential Requests", () => {
    it("handles multiple sequential requests", async () => {
      mockApi.get
        .mockResolvedValueOnce({ page: 1 })
        .mockResolvedValueOnce({ page: 2 });

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.get("/page/1");
      });
      expect(result.current.data).toEqual({ page: 1 });

      await act(async () => {
        await result.current.get("/page/2");
      });
      expect(result.current.data).toEqual({ page: 2 });
    });

    it("handles mixed request types", async () => {
      mockApi.get.mockResolvedValue({ fetched: true });
      mockApi.post.mockResolvedValue({ created: true });
      mockApi.put.mockResolvedValue({ updated: true });
      mockApi.delete.mockResolvedValue({ deleted: true });

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.get("/item");
      });
      expect(result.current.data).toEqual({ fetched: true });

      await act(async () => {
        await result.current.post("/item", {});
      });
      expect(result.current.data).toEqual({ created: true });

      await act(async () => {
        await result.current.put("/item", {});
      });
      expect(result.current.data).toEqual({ updated: true });

      await act(async () => {
        await result.current.del("/item");
      });
      expect(result.current.data).toEqual({ deleted: true });
    });
  });
});
