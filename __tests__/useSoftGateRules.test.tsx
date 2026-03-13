/**
 * Tests for useSoftGateRules hook
 *
 * Tests the CRUD operations for soft gate rules.
 */
import { renderHook, act, waitFor } from "@testing-library/react-native";

import { useSoftGateRules } from "../src/screens/Admin/tabs/SoftGateExplorer/hooks/useSoftGateRules";

// Mock fetch
global.fetch = jest.fn();

// Mock devLogger
jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devError: jest.fn(),
}));

const mockRules = [
  {
    id: 1,
    capability_id: 1,
    soft_gate_dimension: "interval_velocity_score",
    gate_value: 0.5,
    operator: ">=",
    is_active: true,
  },
  {
    id: 2,
    capability_id: 2,
    soft_gate_dimension: "rhythm_complexity_score",
    gate_value: 0.3,
    operator: ">=",
    is_active: true,
  },
];

describe("useSoftGateRules", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRules),
    });
  });

  describe("Initial Load", () => {
    it("starts with loading state", () => {
      const { result } = renderHook(() => useSoftGateRules());
      expect(result.current.loading).toBe(true);
    });

    it("fetches rules on mount", async () => {
      const { result } = renderHook(() => useSoftGateRules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/soft-gate-rules"),
      );
    });

    it("sets rules after fetch", async () => {
      const { result } = renderHook(() => useSoftGateRules());

      await waitFor(() => {
        expect(result.current.rules).toEqual(mockRules);
      });
    });

    it("handles fetch error", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      const { result } = renderHook(() => useSoftGateRules());

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to fetch rules");
      });
    });

    it("handles network error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useSoftGateRules());

      await waitFor(() => {
        expect(result.current.error).toBe("Network error");
      });
    });
  });

  describe("setSelectedRule", () => {
    it("sets selected rule", async () => {
      const { result } = renderHook(() => useSoftGateRules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        // Cast needed because hook is JS and selectedRule state type cannot be inferred
        (result.current.setSelectedRule as (rule: unknown) => void)(
          mockRules[0],
        );
      });

      expect(result.current.selectedRule).toEqual(mockRules[0]);
    });
  });

  describe("createRule", () => {
    it("creates rule and refreshes list", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRules),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 3 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRules),
        });

      const { result } = renderHook(() => useSoftGateRules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newRule = {
        capability_id: 3,
        soft_gate_dimension: "tonal_complexity_score",
        gate_value: 0.4,
      };

      let createResult: any;
      await act(async () => {
        createResult = await result.current.createRule(newRule);
      });

      expect(createResult.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/soft-gate-rules"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(newRule),
        }),
      );
    });

    it("returns error on create failure", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRules),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ detail: "Validation error" }),
        });

      const { result } = renderHook(() => useSoftGateRules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createResult: any;
      await act(async () => {
        createResult = await result.current.createRule({});
      });

      expect(createResult.success).toBe(false);
      expect(createResult.error).toBe("Validation error");
    });

    it("handles network error on create", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRules),
        })
        .mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useSoftGateRules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createResult: any;
      await act(async () => {
        createResult = await result.current.createRule({});
      });

      expect(createResult.success).toBe(false);
      expect(createResult.error).toBe("Network error");
    });
  });

  describe("updateRule", () => {
    it("updates rule and refreshes list", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRules),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRules),
        });

      const { result } = renderHook(() => useSoftGateRules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updates = { gate_value: 0.6 };

      let updateResult: any;
      await act(async () => {
        updateResult = await result.current.updateRule(1, updates);
      });

      expect(updateResult.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/soft-gate-rules/1"),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(updates),
        }),
      );
    });

    it("returns error on update failure", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRules),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ detail: "Rule not found" }),
        });

      const { result } = renderHook(() => useSoftGateRules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult: any;
      await act(async () => {
        updateResult = await result.current.updateRule(999, {});
      });

      expect(updateResult.success).toBe(false);
      expect(updateResult.error).toBe("Rule not found");
    });

    it("handles network error on update", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRules),
        })
        .mockRejectedValueOnce(new Error("Timeout"));

      const { result } = renderHook(() => useSoftGateRules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult: any;
      await act(async () => {
        updateResult = await result.current.updateRule(1, {});
      });

      expect(updateResult.success).toBe(false);
      expect(updateResult.error).toBe("Timeout");
    });
  });

  describe("deleteRule", () => {
    it("deletes rule and refreshes list", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRules),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockRules[1]]),
        });

      const { result } = renderHook(() => useSoftGateRules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let deleteResult: any;
      await act(async () => {
        deleteResult = await result.current.deleteRule(1);
      });

      expect(deleteResult.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/soft-gate-rules/1"),
        expect.objectContaining({ method: "DELETE" }),
      );
    });

    it("returns error on delete failure", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRules),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ detail: "Cannot delete" }),
        });

      const { result } = renderHook(() => useSoftGateRules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let deleteResult: any;
      await act(async () => {
        deleteResult = await result.current.deleteRule(1);
      });

      expect(deleteResult.success).toBe(false);
      expect(deleteResult.error).toBe("Cannot delete");
    });

    it("handles network error on delete", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRules),
        })
        .mockRejectedValueOnce(new Error("Connection refused"));

      const { result } = renderHook(() => useSoftGateRules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let deleteResult: any;
      await act(async () => {
        deleteResult = await result.current.deleteRule(1);
      });

      expect(deleteResult.success).toBe(false);
      expect(deleteResult.error).toBe("Connection refused");
    });
  });

  describe("fetchRules", () => {
    it("can manually refresh rules", async () => {
      const { result } = renderHook(() => useSoftGateRules());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear and setup new mock
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockRules[0]]),
      });

      await act(async () => {
        await result.current.fetchRules();
      });

      // fetchRules was called: once on mount + once manually
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
