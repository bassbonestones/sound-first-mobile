/**
 * Tests for API materials module
 */
import {
  getMaterials,
  getMaterial,
  getMaterialAnalysis,
  getMaterialGateCheck,
} from "../src/api/materials";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("materials API", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe("getMaterials", () => {
    it("tries admin endpoint first", async () => {
      const mockMaterials = { materials: [{ id: 1, title: "Test" }] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMaterials),
      });

      const result = await getMaterials();

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("/admin/materials");
      expect(result).toEqual(mockMaterials);
    });

    it("falls back to public endpoint when admin fails", async () => {
      const mockMaterials = { materials: [{ id: 1, title: "Test" }] };
      // Admin fails
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        // Public succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMaterials),
        });

      const result = await getMaterials();

      expect(mockFetch).toHaveBeenCalledTimes(2);
      const secondUrl = mockFetch.mock.calls[1][0];
      expect(secondUrl).not.toContain("/admin");
      expect(result).toEqual(mockMaterials);
    });

    it("throws when both endpoints fail", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 401 })
        .mockResolvedValueOnce({ ok: false, status: 500 });

      await expect(getMaterials()).rejects.toThrow("Failed to fetch materials");
    });
  });

  describe("getMaterial", () => {
    it("calls GET to material endpoint", async () => {
      const mockMaterial = { id: 5, title: "Test Material" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMaterial),
      });

      const result = await getMaterial(5);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("/materials/5");
      expect(result).toEqual(mockMaterial);
    });
  });

  describe("getMaterialAnalysis", () => {
    it("calls GET to analysis endpoint", async () => {
      const mockAnalysis = {
        tempo: 120,
        key_signature: "C major",
        time_signature: "4/4",
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAnalysis),
      });

      const result = await getMaterialAnalysis(5);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("/admin/materials/5/analysis");
      expect(result).toEqual(mockAnalysis);
    });

    it("throws on failure", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

      await expect(getMaterialAnalysis(999)).rejects.toThrow(
        "Failed to fetch analysis",
      );
    });
  });

  describe("getMaterialGateCheck", () => {
    it("calls GET with user_id parameter", async () => {
      const mockResult = {
        material_id: 5,
        user_id: 1,
        passed: true,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResult),
      });

      const result = await getMaterialGateCheck(5, 1);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("/admin/materials/5/gate-check");
      expect(calledUrl).toContain("user_id=1");
      expect(result).toEqual(mockResult);
    });

    it("returns blocked_by when gate fails", async () => {
      const mockResult = {
        material_id: 5,
        user_id: 1,
        passed: false,
        blocked_by: ["pitch_accuracy", "rhythm_precision"],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResult),
      });

      const result = await getMaterialGateCheck(5, 1);

      expect(result.passed).toBe(false);
      expect(result.blocked_by).toContain("pitch_accuracy");
    });

    it("throws on failure", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      await expect(getMaterialGateCheck(5, 1)).rejects.toThrow(
        "Failed to run gate check",
      );
    });
  });
});
