/**
 * Tests for API client
 * Covers HTTP methods and error handling
 */
import { Platform } from "react-native";

// Save original fetch
const originalFetch = global.fetch;

describe("api client", () => {
  let api: typeof import("../src/api/client").api;
  let getBackendUrl: typeof import("../src/api/client").getBackendUrl;

  beforeEach(() => {
    // Reset modules to get fresh imports
    jest.resetModules();
    // Mock fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe("getBackendUrl", () => {
    it("returns a valid URL", () => {
      jest.isolateModules(() => {
        const { getBackendUrl } = require("../src/api/client");
        const url = getBackendUrl();
        expect(url).toMatch(/^http:\/\/.+:\d+$/);
      });
    });

    it("includes port 8000", () => {
      jest.isolateModules(() => {
        const { getBackendUrl } = require("../src/api/client");
        const url = getBackendUrl();
        expect(url).toContain(":8000");
      });
    });
  });

  describe("api.get", () => {
    beforeEach(() => {
      Platform.OS = "ios" as typeof Platform.OS;
      jest.isolateModules(() => {
        const module = require("../src/api/client");
        api = module.api;
        getBackendUrl = module.getBackendUrl;
      });
    });

    it("makes GET request to endpoint", async () => {
      const mockResponse = { data: "test" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.get("/test");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test"),
      );
      expect(result).toEqual(mockResponse);
    });

    it("throws error on non-ok response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: () => Promise.resolve({ detail: "Resource not found" }),
      });

      await expect(api.get("/missing")).rejects.toThrow("Resource not found");
    });

    it("uses status text when json parse fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () => Promise.reject(new Error("JSON parse error")),
      });

      await expect(api.get("/error")).rejects.toThrow("Internal Server Error");
    });

    it("uses HTTP status when no error detail", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: () => Promise.resolve({}),
      });

      await expect(api.get("/secure")).rejects.toThrow("HTTP 401");
    });
  });

  describe("api.post", () => {
    beforeEach(() => {
      Platform.OS = "ios" as typeof Platform.OS;
      jest.isolateModules(() => {
        const module = require("../src/api/client");
        api = module.api;
      });
    });

    it("makes POST request with JSON body", async () => {
      const mockResponse = { id: 1 };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const data = { name: "test" };
      const result = await api.post("/items", data);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/items"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("handles POST without data", async () => {
      const mockResponse = { success: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.post("/action");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/action"),
        expect.objectContaining({
          method: "POST",
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("throws error on non-ok response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: () => Promise.resolve({ detail: "Invalid data" }),
      });

      await expect(api.post("/items", {})).rejects.toThrow("Invalid data");
    });
  });

  describe("api.put", () => {
    beforeEach(() => {
      Platform.OS = "ios" as typeof Platform.OS;
      jest.isolateModules(() => {
        const module = require("../src/api/client");
        api = module.api;
      });
    });

    it("makes PUT request with JSON body", async () => {
      const mockResponse = { id: 1, updated: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const data = { name: "updated" };
      const result = await api.put("/items/1", data);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/items/1"),
        expect.objectContaining({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("throws error on non-ok response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        json: () => Promise.resolve({ detail: "Not authorized" }),
      });

      await expect(api.put("/items/1", {})).rejects.toThrow("Not authorized");
    });
  });

  describe("api.delete", () => {
    beforeEach(() => {
      Platform.OS = "ios" as typeof Platform.OS;
      jest.isolateModules(() => {
        const module = require("../src/api/client");
        api = module.api;
      });
    });

    it("makes DELETE request", async () => {
      const mockResponse = { deleted: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.delete("/items/1");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/items/1"),
        expect.objectContaining({
          method: "DELETE",
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("throws error on non-ok response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: () => Promise.resolve({ detail: "Item not found" }),
      });

      await expect(api.delete("/items/999")).rejects.toThrow("Item not found");
    });
  });
});
