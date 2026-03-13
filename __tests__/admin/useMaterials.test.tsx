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
});
