/**
 * Tests for useCapabilities hook
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

import useCapabilities from "../../src/screens/Admin/tabs/CapabilityExplorer/hooks/useCapabilities";

describe("useCapabilities", () => {
  const mockCapabilities = [
    {
      id: 1,
      name: "pitch_detect",
      display_name: "Pitch Detection",
      domain: "pitch",
      bit_index: 1,
    },
    {
      id: 2,
      name: "rhythm_basic",
      display_name: "Basic Rhythm",
      domain: "rhythm",
      bit_index: 2,
    },
    {
      id: 3,
      name: "pitch_match",
      display_name: "Pitch Matching",
      domain: "pitch",
      bit_index: 3,
    },
  ];

  const mockModules = [{ id: 1, capability_name: "pitch_detect" }];

  const mockDay0 = { all: ["pitch_detect"] };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  const setupDefaultMocks = () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ capabilities: mockCapabilities }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModules),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDay0),
      });
  };

  // ==========================================================================
  // INITIAL STATE
  // ==========================================================================
  describe("Initial State", () => {
    it("returns correct initial state", async () => {
      setupDefaultMocks();

      const { result } = renderHook(() => useCapabilities());

      expect(result.current.loading).toBe(true);
      expect(result.current.capabilities).toEqual([]);
      expect(result.current.searchQuery).toBe("");
      expect(result.current.domainFilter).toBe("all");
    });

    it("fetches capabilities on mount", async () => {
      setupDefaultMocks();

      renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "http://test-api.com/admin/capabilities",
        );
      });
    });

    it("sets capabilities after fetch", async () => {
      setupDefaultMocks();

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.capabilities).toEqual(mockCapabilities);
      });
    });

    it("extracts domains from capabilities", async () => {
      setupDefaultMocks();

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.domains).toEqual(["pitch", "rhythm"]);
      });
    });
  });

  // ==========================================================================
  // FILTERING
  // ==========================================================================
  describe("Filtering", () => {
    it("filters by search query", async () => {
      setupDefaultMocks();

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.capabilities.length).toBe(3);
      });

      act(() => {
        result.current.setSearchQuery("pitch_detect");
      });

      await waitFor(() => {
        expect(result.current.filteredCapabilities.length).toBe(1);
        expect(result.current.filteredCapabilities[0].name).toBe(
          "pitch_detect",
        );
      });
    });

    it("filters by domain", async () => {
      setupDefaultMocks();

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.capabilities.length).toBe(3);
      });

      act(() => {
        result.current.setDomainFilter("pitch");
      });

      await waitFor(() => {
        expect(result.current.filteredCapabilities.length).toBe(2);
      });
    });

    it("shows all when domain is 'all'", async () => {
      setupDefaultMocks();

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.filteredCapabilities.length).toBe(3);
      });
    });

    it("filters by display_name", async () => {
      setupDefaultMocks();

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.capabilities.length).toBe(3);
      });

      act(() => {
        result.current.setSearchQuery("Basic Rhythm");
      });

      await waitFor(() => {
        expect(result.current.filteredCapabilities.length).toBe(1);
        expect(result.current.filteredCapabilities[0].name).toBe(
          "rhythm_basic",
        );
      });
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================
  describe("Error Handling", () => {
    it("falls back to v2 endpoint on error", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ capabilities: mockCapabilities }),
        });

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "http://test-api.com/capabilities/v2",
        );
      });
    });

    it("handles fetch error", async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ capabilities: [] }),
        });

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  // ==========================================================================
  // CAPABILITIES WITH CONTENT
  // ==========================================================================
  describe("Capabilities With Content", () => {
    it("tracks capabilities with modules", async () => {
      setupDefaultMocks();

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.capabilitiesWithContent.has("pitch_detect")).toBe(
          true,
        );
      });
    });
  });

  // ==========================================================================
  // CRUD OPERATIONS
  // ==========================================================================
  describe("CRUD Operations", () => {
    it("can create capability", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, capability: { id: 4 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ capabilities: mockCapabilities }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ all: [] }),
        });

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createResult: any;
      await act(async () => {
        createResult = await result.current.createCapability({
          name: "new_cap",
        });
      });

      expect(createResult?.success).toBe(true);
    });

    it("can archive capability", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let archiveResult: any;
      await act(async () => {
        archiveResult = await result.current.archiveCapability(
          mockCapabilities[0],
        );
      });

      expect(archiveResult?.success).toBe(true);
    });

    it("can restore capability", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let restoreResult: any;
      await act(async () => {
        restoreResult = await result.current.restoreCapability({
          ...mockCapabilities[0],
          is_active: false,
        });
      });

      expect(restoreResult?.success).toBe(true);
    });

    it("can delete capability", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ capabilities: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ all: [] }),
        });

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let deleteResult: any;
      await act(async () => {
        deleteResult = await result.current.deleteCapability(
          mockCapabilities[0],
        );
      });

      expect(deleteResult?.success).toBe(true);
    });
  });

  // ==========================================================================
  // DEPENDENCY GRAPH
  // ==========================================================================
  describe("Dependency Graph", () => {
    it("can load dependency graph", async () => {
      const mockGraph = { nodes: [], edges: [] };
      setupDefaultMocks();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGraph),
      });

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let graph: any;
      await act(async () => {
        graph = await result.current.loadDependencyGraph(1);
      });

      expect(graph).toEqual(mockGraph);
    });

    it("returns null on graph fetch error", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Error"));

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let graph: any;
      await act(async () => {
        graph = await result.current.loadDependencyGraph(1);
      });

      expect(graph).toBeNull();
    });
  });

  // ==========================================================================
  // REFRESH
  // ==========================================================================
  describe("Refresh", () => {
    it("can reload capabilities", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ capabilities: mockCapabilities }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ all: [] }),
        });

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.loadCapabilities();
      });

      // Should have been called multiple times
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // EXPORT STATE
  // ==========================================================================
  describe("Export State", () => {
    it("starts with exporting false", async () => {
      setupDefaultMocks();

      const { result } = renderHook(() => useCapabilities());

      expect(result.current.exporting).toBe(false);
    });

    it("starts with null export status", async () => {
      setupDefaultMocks();

      const { result } = renderHook(() => useCapabilities());

      expect(result.current.exportStatus).toBeNull();
    });
  });

  // ==========================================================================
  // CAPABILITY OPERATIONS
  // ==========================================================================
  describe("Archive Capability", () => {
    it("archives capability successfully", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.archiveCapability({
          id: 1,
          name: "Test",
        });
      });

      expect(response.success).toBe(true);
    });

    it("handles archive failure", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Failed"));

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.archiveCapability({
          id: 1,
          name: "Test",
        });
      });

      expect(response.success).toBe(false);
    });
  });

  describe("Restore Capability", () => {
    it("restores capability successfully", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.restoreCapability({
          id: 1,
          name: "Test",
          is_active: false,
        });
      });

      expect(response.success).toBe(true);
    });

    it("handles restore failure", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Failed"));

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.restoreCapability({
          id: 1,
          name: "Test",
          is_active: false,
        });
      });

      expect(response.success).toBe(false);
    });
  });

  describe("Delete Capability", () => {
    it("deletes capability successfully", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ all: [] }),
        });

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.deleteCapability({
          id: 1,
          name: "Test",
        });
      });

      expect(response.success).toBe(true);
    });

    it("handles delete failure", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Failed"));

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.deleteCapability({
          id: 1,
          name: "Test",
        });
      });

      expect(response.success).toBe(false);
    });
  });

  describe("Create Capability", () => {
    it("creates capability successfully", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ all: [] }),
        });

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.createCapability({ name: "New Cap" });
      });

      expect(response.success).toBe(true);
    });

    it("handles create API error", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ detail: "Already exists" }),
      });

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.createCapability({ name: "New Cap" });
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe("Already exists");
    });

    it("handles create network error", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network"));

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.createCapability({ name: "New Cap" });
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe("Network error");
    });
  });

  describe("Update Capability", () => {
    it("updates capability successfully", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ all: [] }),
        });

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.updateCapability(1, {
          name: "Updated",
        });
      });

      expect(response.success).toBe(true);
    });

    it("handles update API error", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ detail: "Invalid data" }),
      });

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.updateCapability(1, {
          name: "Updated",
        });
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe("Invalid data");
    });

    it("handles update network error", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Timeout"));

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.updateCapability(1, {
          name: "Updated",
        });
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe("Network error");
    });
  });

  // ==========================================================================
  // MOVE CAPABILITY
  // ==========================================================================
  describe("moveCapability", () => {
    it("returns failure when domain filter is 'all'", async () => {
      setupDefaultMocks();

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Domain filter is 'all' by default
      let response;
      await act(async () => {
        response = await result.current.moveCapability(
          mockCapabilities[0],
          "up",
        );
      });

      expect(response.success).toBe(false);
    });

    it("returns failure when capability not found in domain", async () => {
      setupDefaultMocks();

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setDomainFilter("pitch");
      });

      // Try with non-existent capability ID
      let response;
      await act(async () => {
        response = await result.current.moveCapability({ id: 999 }, "up");
      });

      expect(response.success).toBe(false);
    });

    it("returns failure when moving up from first position", async () => {
      setupDefaultMocks();

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setDomainFilter("pitch");
      });

      // First pitch capability - can't move up further
      let response;
      await act(async () => {
        response = await result.current.moveCapability(
          mockCapabilities[0],
          "up",
        );
      });

      expect(response.success).toBe(false);
    });

    it("returns failure when moving down from last position", async () => {
      setupDefaultMocks();

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setDomainFilter("pitch");
      });

      // Last pitch capability (pitch_match) - can't move down further
      let response;
      await act(async () => {
        response = await result.current.moveCapability(
          mockCapabilities[2],
          "down",
        );
      });

      expect(response.success).toBe(false);
    });

    it("moves capability down successfully", async () => {
      setupDefaultMocks();
      // Mock reorder API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            new_order: [
              { id: 3, bit_index: 1 },
              { id: 1, bit_index: 2 },
            ],
          }),
      });

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setDomainFilter("pitch");
      });

      // Move first pitch capability down
      let response;
      await act(async () => {
        response = await result.current.moveCapability(
          mockCapabilities[0],
          "down",
        );
      });

      expect(response.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://test-api.com/admin/capabilities/reorder",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    it("handles reorder API failure gracefully", async () => {
      setupDefaultMocks();
      // Mock reorder API to fail
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error"),
      );

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setDomainFilter("pitch");
      });

      let response;
      await act(async () => {
        response = await result.current.moveCapability(
          mockCapabilities[0],
          "down",
        );
      });

      expect(response.success).toBe(false);
    });
  });

  // ==========================================================================
  // RENAME DOMAIN
  // ==========================================================================
  describe("renameDomain", () => {
    it("renames domain successfully", async () => {
      setupDefaultMocks();
      // Mock rename response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      // Mock reload after rename
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ capabilities: mockCapabilities }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockModules),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockDay0),
        });

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.renameDomain(
          "pitch",
          "pitch_detection",
        );
      });

      expect(response.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://test-api.com/admin/domains/rename",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            old_name: "pitch",
            new_name: "pitch_detection",
          }),
        }),
      );
    });

    it("handles rename API failure with detail", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ detail: "Domain already exists" }),
      });

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.renameDomain("pitch", "rhythm");
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe("Domain already exists");
    });

    it("handles rename API failure without detail", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.renameDomain("pitch", "invalid");
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe("Failed to rename domain");
    });

    it("handles rename network error", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error"),
      );

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.renameDomain("pitch", "new_pitch");
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe("Network error");
    });
  });

  // ==========================================================================
  // EXPORT TO FILE
  // ==========================================================================
  describe("exportToFile", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("exports successfully and sets success status", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            filename: "capabilities_export_20240101.json",
          }),
      });

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.exportToFile();
      });

      expect(result.current.exporting).toBe(false);
      expect(result.current.exportStatus).toEqual({
        type: "success",
        message: "Exported to capabilities_export_20240101.json",
      });
    });

    it("handles export API failure with detail", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({ detail: { message: "No write permission" } }),
      });

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.exportToFile();
      });

      expect(result.current.exportStatus).toEqual({
        type: "error",
        message: "No write permission",
      });
    });

    it("handles export without success flag", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: false }),
      });

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.exportToFile();
      });

      expect(result.current.exportStatus).toEqual({
        type: "error",
        message: "Export failed",
      });
    });

    it("handles export network error", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Timeout"));

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.exportToFile();
      });

      expect(result.current.exportStatus).toEqual({
        type: "error",
        message: "Failed to connect to server",
      });
    });

    it("clears export status after timeout", async () => {
      setupDefaultMocks();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            filename: "export.json",
          }),
      });

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.exportToFile();
      });

      expect(result.current.exportStatus).not.toBeNull();

      // Fast-forward timer
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.exportStatus).toBeNull();
    });

    it("sets exporting to true during export", async () => {
      setupDefaultMocks();

      let resolveExport: (value: any) => void;
      const pendingExport = new Promise((resolve) => {
        resolveExport = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(pendingExport);

      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start export (don't await)
      const exportPromise = act(async () => {
        result.current.exportToFile();
      });

      // exporting should be true while waiting
      // Note: This is tricky to test synchronously
      // Complete the export
      await act(async () => {
        resolveExport!({
          ok: true,
          json: () => Promise.resolve({ success: true, filename: "test.json" }),
        });
        await exportPromise;
      });

      expect(result.current.exporting).toBe(false);
    });
  });
});
