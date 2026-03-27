/**
 * Tests for useFocusCards hook
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

import { useFocusCards } from "../../src/screens/Admin/tabs/FocusCardExplorer/hooks/useFocusCards";

describe("useFocusCards", () => {
  const mockFocusCards = [
    { id: 1, name: "Card 1", category: "Pitch", description: "Test" },
    { id: 2, name: "Card 2", category: "Rhythm", description: "Another" },
    { id: 3, name: "Card 3", category: "Pitch", description: "More" },
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
        json: () => Promise.resolve(mockFocusCards),
      });

      const { result } = renderHook(() => useFocusCards());

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.focusCards).toEqual([]);
      expect(result.current.error).toBeNull();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("fetches focus cards on mount", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFocusCards),
      });

      renderHook(() => useFocusCards());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "http://test-api.com/focus-cards",
        );
      });
    });

    it("sets focus cards after fetch", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFocusCards),
      });

      const { result } = renderHook(() => useFocusCards());

      await waitFor(() => {
        expect(result.current.focusCards).toEqual(mockFocusCards);
      });
    });

    it("extracts categories from focus cards", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFocusCards),
      });

      const { result } = renderHook(() => useFocusCards());

      await waitFor(() => {
        expect(result.current.categories).toEqual(["Pitch", "Rhythm"]);
      });
    });
  });

  // ==========================================================================
  // FILTERING
  // ==========================================================================
  describe("Filtering", () => {
    it("filters by search query", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFocusCards),
      });

      const { result } = renderHook(() => useFocusCards());

      await waitFor(() => {
        expect(result.current.focusCards.length).toBe(3);
      });

      act(() => {
        result.current.setSearchQuery("Card 1");
      });

      await waitFor(() => {
        expect(result.current.filteredFocusCards.length).toBe(1);
        expect(result.current.filteredFocusCards[0].name).toBe("Card 1");
      });
    });

    it("filters by category", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFocusCards),
      });

      const { result } = renderHook(() => useFocusCards());

      await waitFor(() => {
        expect(result.current.focusCards.length).toBe(3);
      });

      act(() => {
        result.current.setCategoryFilter("Pitch");
      });

      await waitFor(() => {
        expect(result.current.filteredFocusCards.length).toBe(2);
      });
    });

    it("shows all when category is 'all'", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFocusCards),
      });

      const { result } = renderHook(() => useFocusCards());

      await waitFor(() => {
        expect(result.current.filteredFocusCards.length).toBe(3);
      });
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================
  describe("Error Handling", () => {
    it("handles fetch error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useFocusCards());

      await waitFor(() => {
        expect(result.current.error).toBe("Network error");
        expect(result.current.loading).toBe(false);
      });
    });

    it("handles non-ok response", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      const { result } = renderHook(() => useFocusCards());

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to fetch focus cards");
      });
    });
  });

  // ==========================================================================
  // CREATE FOCUS CARD
  // ==========================================================================
  describe("Create Focus Card", () => {
    it("calls create endpoint", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFocusCards),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 4 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([...mockFocusCards, { id: 4 }]),
        });

      const { result } = renderHook(() => useFocusCards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createFocusCard({ name: "New Card" });
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "http://test-api.com/admin/focus-cards",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    it("returns success on create", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFocusCards),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 4 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFocusCards),
        });

      const { result } = renderHook(() => useFocusCards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createResult: { success: boolean } | undefined;
      await act(async () => {
        createResult = await result.current.createFocusCard({ name: "New" });
      });

      expect(createResult?.success).toBe(true);
    });
  });

  // ==========================================================================
  // SELECTED FOCUS CARD
  // ==========================================================================
  describe("Selected Focus Card", () => {
    it("can select a focus card", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFocusCards),
      });

      const { result } = renderHook(() => useFocusCards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSelectedFocusCard(mockFocusCards[0]);
      });

      expect(result.current.selectedFocusCard).toEqual(mockFocusCards[0]);
    });

    it("can clear selected focus card", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFocusCards),
      });

      const { result } = renderHook(() => useFocusCards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSelectedFocusCard(mockFocusCards[0]);
      });

      act(() => {
        result.current.setSelectedFocusCard(null);
      });

      expect(result.current.selectedFocusCard).toBeNull();
    });
  });

  // ==========================================================================
  // REFRESH
  // ==========================================================================
  describe("Refresh", () => {
    it("can refresh focus cards", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFocusCards),
      });

      const { result } = renderHook(() => useFocusCards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.fetchFocusCards();
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================
  describe("Error Handling", () => {
    it("handles createFocusCard API error", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFocusCards),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ detail: "Create failed" }),
        });

      const { result } = renderHook(() => useFocusCards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.createFocusCard({ name: "New Card" });
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe("Create failed");
    });

    it("handles createFocusCard network error", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFocusCards),
        })
        .mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useFocusCards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.createFocusCard({ name: "New Card" });
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe("Network error");
    });

    it("successfully updates a focus card", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFocusCards),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFocusCards),
        });

      const { result } = renderHook(() => useFocusCards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.updateFocusCard(1, { name: "Updated" });
      });

      expect(response.success).toBe(true);
    });

    it("handles updateFocusCard API error", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFocusCards),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ detail: "Update failed" }),
        });

      const { result } = renderHook(() => useFocusCards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.updateFocusCard(1, { name: "Updated" });
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe("Update failed");
    });

    it("handles updateFocusCard network error", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFocusCards),
        })
        .mockRejectedValueOnce(new Error("Connection lost"));

      const { result } = renderHook(() => useFocusCards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.updateFocusCard(1, { name: "Updated" });
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe("Connection lost");
    });

    it("successfully deletes a focus card", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFocusCards),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        });

      const { result } = renderHook(() => useFocusCards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.deleteFocusCard(1);
      });

      expect(response.success).toBe(true);
    });

    it("handles deleteFocusCard API error", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFocusCards),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ detail: "Delete failed" }),
        });

      const { result } = renderHook(() => useFocusCards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.deleteFocusCard(1);
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe("Delete failed");
    });

    it("handles deleteFocusCard network error", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFocusCards),
        })
        .mockRejectedValueOnce(new Error("Server unavailable"));

      const { result } = renderHook(() => useFocusCards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.deleteFocusCard(1);
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe("Server unavailable");
    });
  });
});
