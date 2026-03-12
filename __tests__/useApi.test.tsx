/**
 * Tests for useApi hook
 *
 * Fully typed TypeScript test file.
 */

import { renderHook, act } from "@testing-library/react-native";
import { useApi } from "../src/hooks/useApi";

// Mock the api client - mock must be defined inline since jest.mock is hoisted
jest.mock("../src/api/client", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  baseUrl: "http://localhost:8000",
}));

// Import the mocked module to get typed references to mock functions
import { api } from "../src/api/client";

// Cast to typed mock functions
const mockApi = api as {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
};

describe("useApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial state", () => {
    it("returns initial state", () => {
      const { result } = renderHook(() => useApi());

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("get", () => {
    it("handles successful GET request", async () => {
      const mockData = { items: [1, 2, 3] };
      mockApi.get.mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.get("/test-endpoint");
      });

      expect(mockApi.get).toHaveBeenCalledWith("/test-endpoint");
      expect(result.current.data).toEqual(mockData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("handles failed GET request", async () => {
      const mockError = new Error("Network error");
      mockApi.get.mockRejectedValueOnce(mockError);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.get("/failing-endpoint");
      });

      expect(result.current.error).toBe(mockError);
      expect(result.current.data).toBeNull();

      consoleSpy.mockRestore();
    });

    it("sets loading during request", async () => {
      let resolvePromise: (value: unknown) => void;
      mockApi.get.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          }),
      );

      const { result } = renderHook(() => useApi());

      act(() => {
        result.current.get("/slow-endpoint");
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise!({ data: "done" });
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe("post", () => {
    it("handles successful POST request", async () => {
      const mockResponse = { id: 1, created: true };
      mockApi.post.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useApi());
      const postData = { name: "test" };

      await act(async () => {
        await result.current.post("/create", postData);
      });

      expect(mockApi.post).toHaveBeenCalledWith("/create", postData);
      expect(result.current.data).toEqual(mockResponse);
    });
  });

  describe("put", () => {
    it("handles successful PUT request", async () => {
      const mockResponse = { updated: true };
      mockApi.put.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.put("/update/1", { name: "updated" });
      });

      expect(mockApi.put).toHaveBeenCalledWith("/update/1", {
        name: "updated",
      });
      expect(result.current.data).toEqual(mockResponse);
    });
  });

  describe("del", () => {
    it("handles successful DELETE request", async () => {
      mockApi.delete.mockResolvedValueOnce({ deleted: true });

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.del("/delete/1");
      });

      expect(mockApi.delete).toHaveBeenCalledWith("/delete/1");
    });
  });

  describe("reset", () => {
    it("resets state to initial", async () => {
      mockApi.get.mockResolvedValueOnce({ data: "test" });

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.get("/test");
      });

      expect(result.current.data).toEqual({ data: "test" });

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("autoReset option", () => {
    it("clears error before new request when autoReset is true", async () => {
      const mockError = new Error("First error");
      mockApi.get.mockRejectedValueOnce(mockError);
      mockApi.get.mockResolvedValueOnce({ success: true });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const { result } = renderHook(() => useApi({ autoReset: true }));

      await act(async () => {
        await result.current.get("/fail");
      });

      expect(result.current.error).toBe(mockError);

      await act(async () => {
        await result.current.get("/success");
      });

      expect(result.current.error).toBeNull();
      expect(result.current.data).toEqual({ success: true });

      consoleSpy.mockRestore();
    });
  });
});
