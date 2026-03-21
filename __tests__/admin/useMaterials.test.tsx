/**
 * Tests for useMaterials hook
 */

import { renderHook, act, waitFor } from "@testing-library/react-native";

// Mock fetch
global.fetch = jest.fn();

// Mock baseUrl
jest.mock("../../src/api/client", () => ({
  baseUrl: "http://test-api.com",
}));

// Mock devLogger
jest.mock("../../src/utils/devLogger", () => ({
  devError: jest.fn(),
  devLog: jest.fn(),
  devWarn: jest.fn(),
}));

import { useMaterials } from "../../src/screens/Admin/tabs/MaterialExplorer/hooks/useMaterials";

describe("useMaterials", () => {
  const mockMaterials = [
    { id: 1, title: "Song One", file_path: "/music/song1.xml" },
    { id: 2, title: "Song Two", file_path: "/music/song2.xml" },
    { id: 3, title: "Another Song", file_path: "/music/another.xml" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  // ==========================================================================
  // INITIAL STATE
  // ==========================================================================
  describe("Initial State", () => {
    it("returns correct initial state", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ materials: mockMaterials }),
      });

      const { result } = renderHook(() => useMaterials());

      expect(result.current.loading).toBe(true);
      expect(result.current.materials).toEqual([]);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("fetches materials on mount", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ materials: mockMaterials }),
      });

      renderHook(() => useMaterials());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "http://test-api.com/admin/materials",
        );
      });
    });

    it("sets materials after fetch", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ materials: mockMaterials }),
      });

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.materials).toEqual(mockMaterials);
      });
    });
  });

  // ==========================================================================
  // FALLBACK TO PUBLIC ENDPOINT
  // ==========================================================================
  describe("Fallback", () => {
    it("falls back to public endpoint on admin failure", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ materials: mockMaterials }),
        });

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "http://test-api.com/materials",
        );
      });
    });
  });

  // ==========================================================================
  // FILTERING
  // ==========================================================================
  describe("Filtering", () => {
    it("filters by title", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ materials: mockMaterials }),
      });

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.materials.length).toBe(3);
      });

      act(() => {
        result.current.setSearchQuery("Song One");
      });

      await waitFor(() => {
        expect(result.current.filteredMaterials.length).toBe(1);
        expect(result.current.filteredMaterials[0].title).toBe("Song One");
      });
    });

    it("filters by file path", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ materials: mockMaterials }),
      });

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.materials.length).toBe(3);
      });

      act(() => {
        result.current.setSearchQuery("song1.xml");
      });

      await waitFor(() => {
        expect(result.current.filteredMaterials.length).toBe(1);
      });
    });

    it("shows all when search is empty", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ materials: mockMaterials }),
      });

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.filteredMaterials.length).toBe(3);
      });
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================
  describe("Error Handling", () => {
    it("handles fetch error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.materials).toEqual([]);
        expect(result.current.loading).toBe(false);
      });
    });
  });

  // ==========================================================================
  // SELECTED MATERIAL
  // ==========================================================================
  describe("Selected Material", () => {
    it("can select a material", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ materials: mockMaterials }),
      });

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSelectedMaterial(mockMaterials[0]);
      });

      expect(result.current.selectedMaterial).toEqual(mockMaterials[0]);
    });

    it("can clear selection", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ materials: mockMaterials }),
      });

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSelectedMaterial(mockMaterials[0]);
      });

      act(() => {
        result.current.setSelectedMaterial(null);
      });

      expect(result.current.selectedMaterial).toBeNull();
    });
  });

  // ==========================================================================
  // FETCH MATERIAL DETAIL
  // ==========================================================================
  describe("Fetch Material Detail", () => {
    it("fetches material analysis", async () => {
      const mockAnalysis = { measures: 32, tempo: 120 };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ materials: mockMaterials }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAnalysis),
        });

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let detailedMaterial: any;
      await act(async () => {
        detailedMaterial = await result.current.fetchMaterialDetail(
          mockMaterials[0],
        );
      });

      expect(detailedMaterial.analysis).toEqual(mockAnalysis);
    });

    it("returns original material on fetch error", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ materials: mockMaterials }),
        })
        .mockRejectedValueOnce(new Error("Fetch error"));

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let detailedMaterial: any;
      await act(async () => {
        detailedMaterial = await result.current.fetchMaterialDetail(
          mockMaterials[0],
        );
      });

      expect(detailedMaterial).toEqual(mockMaterials[0]);
    });
  });

  // ==========================================================================
  // RELOAD
  // ==========================================================================
  describe("Reload", () => {
    it("can reload materials", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ materials: mockMaterials }),
      });

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.loadMaterials();
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================================================
  // ACTION STATUS
  // ==========================================================================
  describe("Action Status", () => {
    it("starts with null action status", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ materials: mockMaterials }),
      });

      const { result } = renderHook(() => useMaterials());

      expect(result.current.actionStatus).toBeNull();
    });
  });

  // ==========================================================================
  // INGESTING STATE
  // ==========================================================================
  describe("Ingesting State", () => {
    it("starts with ingesting false", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ materials: mockMaterials }),
      });

      const { result } = renderHook(() => useMaterials());

      expect(result.current.ingesting).toBe(false);
    });
  });

  // ==========================================================================
  // EXPORTING STATE
  // ==========================================================================
  describe("Exporting State", () => {
    it("starts with exporting false", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ materials: mockMaterials }),
      });

      const { result } = renderHook(() => useMaterials());

      expect(result.current.exporting).toBe(false);
    });
  });

  // ==========================================================================
  // TRIGGER ANALYSIS
  // ==========================================================================
  describe("Trigger Analysis", () => {
    it("calls reanalyze endpoint", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ materials: mockMaterials }),
        })
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ materials: mockMaterials }),
        });

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success;
      await act(async () => {
        success = await result.current.triggerAnalysis(1);
      });

      expect(success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/materials/1/reanalyze"),
        { method: "POST" },
      );
    });

    it("returns false on analysis failure", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ materials: mockMaterials }),
        })
        .mockResolvedValueOnce({ ok: false });

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success;
      await act(async () => {
        success = await result.current.triggerAnalysis(1);
      });

      expect(success).toBe(false);
    });

    it("handles analysis network error", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ materials: mockMaterials }),
        })
        .mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success;
      await act(async () => {
        success = await result.current.triggerAnalysis(1);
      });

      expect(success).toBe(false);
    });
  });

  // ==========================================================================
  // BATCH INGEST
  // ==========================================================================
  describe("Batch Ingest", () => {
    it("calls ingest-batch endpoint", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ materials: mockMaterials }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ new_count: 2, updated_count: 1 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ materials: mockMaterials }),
        });

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.handleBatchIngest(false);
      });

      expect(response.success).toBe(true);
      expect(response.new_count).toBe(2);
    });

    it("handles ingest failure", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ materials: mockMaterials }),
        })
        .mockResolvedValueOnce({
          ok: false,
          text: () => Promise.resolve("Ingest error"),
        });

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.handleBatchIngest(true);
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe("Ingest error");
    });

    it("handles ingest network error", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ materials: mockMaterials }),
        })
        .mockRejectedValueOnce(new Error("Connection failed"));

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.handleBatchIngest(false);
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe("Connection failed");
    });
  });

  // ==========================================================================
  // EXPORT TO JSON
  // ==========================================================================
  describe("Export to JSON", () => {
    it("calls export endpoint", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ materials: mockMaterials }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ filepath: "/path/to/export.json" }),
        });

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.handleExportToJson();
      });

      expect(response.success).toBe(true);
      expect(response.filepath).toBe("/path/to/export.json");
    });

    it("handles export failure", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ materials: mockMaterials }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ detail: "Export failed" }),
        });

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.handleExportToJson();
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe("Export failed");
    });

    it("handles export network error", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ materials: mockMaterials }),
        })
        .mockRejectedValueOnce(new Error("Timeout"));

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.handleExportToJson();
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe("Timeout");
    });
  });

  // ==========================================================================
  // DELETE MATERIAL
  // ==========================================================================
  describe("Delete Material", () => {
    it("calls delete endpoint", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ materials: mockMaterials }),
        })
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ materials: [] }),
        });

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success;
      await act(async () => {
        success = await result.current.deleteMaterial(1);
      });

      expect(success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/materials/1"),
        { method: "DELETE" },
      );
    });

    it("returns false on delete failure", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ materials: mockMaterials }),
        })
        .mockResolvedValueOnce({ ok: false });

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success;
      await act(async () => {
        success = await result.current.deleteMaterial(1);
      });

      expect(success).toBe(false);
    });

    it("handles delete network error", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ materials: mockMaterials }),
        })
        .mockRejectedValueOnce(new Error("Server error"));

      const { result } = renderHook(() => useMaterials());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success;
      await act(async () => {
        success = await result.current.deleteMaterial(1);
      });

      expect(success).toBe(false);
    });
  });
});
