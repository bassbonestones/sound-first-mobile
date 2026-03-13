/**
 * Tests for useUserSoftGateState hook
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

import { useUserSoftGateState } from "../../src/screens/Admin/tabs/SoftGateExplorer/hooks/useUserSoftGateState";

describe("useUserSoftGateState", () => {
  const mockUsers = [
    { id: 1, name: "User 1" },
    { id: 2, name: "User 2" },
  ];

  const mockStates = [
    { id: 1, dimension: "pitch", value: 0.5 },
    { id: 2, dimension: "rhythm", value: 0.7 },
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
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStates),
        });

      const { result } = renderHook(() => useUserSoftGateState());

      expect(result.current.loading).toBe(true);
      expect(result.current.users).toEqual([]);
      expect(result.current.states).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it("fetches users on mount", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStates),
        });

      renderHook(() => useUserSoftGateState());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "http://test-api.com/admin/users",
        );
      });
    });

    it("auto-selects first user", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStates),
        });

      const { result } = renderHook(() => useUserSoftGateState());

      await waitFor(() => {
        expect(result.current.selectedUserId).toBe(1);
      });
    });
  });

  // ==========================================================================
  // USER SELECTION
  // ==========================================================================
  describe("User Selection", () => {
    it("can change selected user", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStates),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        });

      const { result } = renderHook(() => useUserSoftGateState());

      await waitFor(() => {
        expect(result.current.selectedUserId).toBe(1);
      });

      act(() => {
        result.current.setSelectedUserId(2);
      });

      expect(result.current.selectedUserId).toBe(2);
    });
  });

  // ==========================================================================
  // STATES LOADING
  // ==========================================================================
  describe("States Loading", () => {
    it("fetches states for selected user", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStates),
        });

      const { result } = renderHook(() => useUserSoftGateState());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "http://test-api.com/admin/user-soft-gate-state?user_id=1",
        );
      });
    });

    it("sets states after fetch", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStates),
        });

      const { result } = renderHook(() => useUserSoftGateState());

      await waitFor(() => {
        expect(result.current.states).toEqual(mockStates);
      });
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================
  describe("Error Handling", () => {
    it("handles users fetch error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useUserSoftGateState());

      await waitFor(() => {
        expect(result.current.users).toEqual([]);
      });
    });

    it("handles states fetch error", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers),
        })
        .mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useUserSoftGateState());

      await waitFor(() => {
        expect(result.current.error).toBe("Network error");
      });
    });

    it("handles non-ok response for states", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers),
        })
        .mockResolvedValueOnce({ ok: false });

      const { result } = renderHook(() => useUserSoftGateState());

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to fetch states");
      });
    });
  });

  // ==========================================================================
  // SELECTED STATE
  // ==========================================================================
  describe("Selected State", () => {
    it("can select a state", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStates),
        });

      const { result } = renderHook(() => useUserSoftGateState());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSelectedState(mockStates[0]);
      });

      expect(result.current.selectedState).toEqual(mockStates[0]);
    });

    it("can clear selected state", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStates),
        });

      const { result } = renderHook(() => useUserSoftGateState());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSelectedState(mockStates[0]);
      });

      act(() => {
        result.current.setSelectedState(null);
      });

      expect(result.current.selectedState).toBeNull();
    });
  });

  // ==========================================================================
  // EMPTY USERS
  // ==========================================================================
  describe("Empty Users", () => {
    it("handles empty users list", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const { result } = renderHook(() => useUserSoftGateState());

      await waitFor(() => {
        expect(result.current.users).toEqual([]);
        expect(result.current.selectedUserId).toBeNull();
      });
    });
  });
});
