/**
 * SessionContext tests
 *
 * Tests for the session state management context.
 */
import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

// Mock devLogger
jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devWarn: jest.fn(),
  devError: jest.fn(),
}));

// Mock API client
jest.mock("../src/api/client", () => ({
  baseUrl: "http://localhost:8000",
}));

// Mock Alert
jest.spyOn(Alert, "alert").mockImplementation(() => {});

import {
  SessionProvider,
  useSession,
} from "../src/screens/Session/context/SessionContext";

// Wrapper component for testing hooks
interface WrapperProps {
  children: React.ReactNode;
  routeParams?: Record<string, unknown>;
  navigation?: {
    navigate: jest.Mock;
    replace?: jest.Mock;
    goBack?: jest.Mock;
  };
}

const createWrapper = (props: Partial<WrapperProps> = {}) => {
  const defaultNavigation = {
    navigate: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
  };

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <SessionProvider
      routeParams={props.routeParams || { duration: 20, fatigue: 2 }}
      navigation={props.navigation || defaultNavigation}
    >
      {children}
    </SessionProvider>
  );

  return Wrapper;
};

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe("SessionContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Default successful session fetch
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        session_id: 1,
        mini_sessions: [
          {
            mini_session_id: 1,
            material_id: 1,
            title: "Test Material",
            key: "C",
            focus_card_id: 1,
          },
          {
            mini_session_id: 2,
            material_id: 2,
            title: "Test Material 2",
            key: "G",
            focus_card_id: 2,
          },
        ],
      }),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("useSession hook", () => {
    it("throws error when used outside SessionProvider", () => {
      // Suppress console.error for expected error
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useSession());
      }).toThrow("useSession must be used within a SessionProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("initialization", () => {
    it("starts in loading state", () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(true);
    });

    it("fetches session on mount", async () => {
      renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("generate-session"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    it("sets session data after successful fetch", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.session).toBeDefined();
      expect(result.current.session?.mini_sessions).toHaveLength(2);
    });

    it("handles fetch error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Network error");
    });

    it("handles HTTP error response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: "Server error message" }),
      });

      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Server error message");
    });
  });

  describe("self-directed mode", () => {
    it("uses self-directed endpoint when selfDirected is true", async () => {
      renderHook(() => useSession(), {
        wrapper: createWrapper({
          routeParams: { selfDirected: true, duration: 15, material_id: 1 },
        }),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("generate-self-directed-session"),
        expect.any(Object),
      );
    });
  });

  describe("timer functionality", () => {
    it("starts timer after session loads", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.elapsedSeconds).toBe(0);
    });

    it("updates elapsed time every second", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(result.current.elapsedSeconds).toBeGreaterThan(0);
    });

    it("calculates target duration from route params", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper({
          routeParams: { duration: 30, fatigue: 2 },
        }),
      });

      expect(result.current.targetDurationSeconds).toBe(30 * 60);
    });

    it("detects when over time", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper({
          routeParams: { duration: 1, fatigue: 2 }, // 1 minute
        }),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isOverTime).toBe(false);

      // Advance past target duration
      act(() => {
        jest.advanceTimersByTime(61000);
      });

      expect(result.current.isOverTime).toBe(true);
    });
  });

  describe("mini-session navigation", () => {
    it("initializes at first mini-session", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.current).toBe(0);
    });

    it("provides current mini helper", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.mini).toBeDefined();
      expect(result.current.mini?.mini_session_id).toBe(1);
    });

    it("setCurrent updates current index", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setCurrent(1);
      });

      expect(result.current.current).toBe(1);
      expect(result.current.mini?.mini_session_id).toBe(2);
    });
  });

  describe("reflection state", () => {
    it("initializes with reflection hidden", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      expect(result.current.showReflection).toBe(false);
    });

    it("handleNext shows reflection modal", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleNext();
      });

      expect(result.current.showReflection).toBe(true);
    });

    it("setRating updates rating state", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setRating(4);
      });

      expect(result.current.rating).toBe(4);
    });

    it("setFatigueInput updates fatigue state", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setFatigueInput(3);
      });

      expect(result.current.fatigueInput).toBe(3);
    });

    it("setReflection updates reflection text", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setReflection("Good practice today");
      });

      expect(result.current.reflection).toBe("Good practice today");
    });
  });

  describe("handleExtend", () => {
    it("sets extended to true and hides reflection", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Show reflection first
      act(() => {
        result.current.handleNext();
      });

      expect(result.current.showReflection).toBe(true);

      act(() => {
        result.current.handleExtend();
      });

      expect(result.current.extended).toBe(true);
      expect(result.current.showReflection).toBe(false);
    });
  });

  describe("help menu state", () => {
    it("initializes with help menu hidden", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      expect(result.current.showHelpMenu).toBe(false);
    });

    it("setShowHelpMenu toggles help menu", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setShowHelpMenu(true);
      });

      expect(result.current.showHelpMenu).toBe(true);
    });

    it("setSelectedCapabilityId updates selected capability", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setSelectedCapabilityId(5);
      });

      expect(result.current.selectedCapabilityId).toBe(5);
    });
  });

  describe("mini lesson state", () => {
    it("setShowMiniLesson toggles mini lesson", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setShowMiniLesson(true);
      });

      expect(result.current.showMiniLesson).toBe(true);
    });
  });

  describe("time-up modal", () => {
    it("handleDismissTimeUp hides time-up modal", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleDismissTimeUp();
      });

      expect(result.current.showTimeUpModal).toBe(false);
    });

    it("handleTimeUpFinish navigates to SessionEnd", async () => {
      const mockNavigate = jest.fn();
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper({
          navigation: { navigate: mockNavigate },
        }),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleTimeUpFinish();
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        "SessionEnd",
        expect.objectContaining({
          completedCount: expect.any(Number),
          totalDuration: expect.any(Number),
        }),
      );
    });
  });

  describe("route params", () => {
    it("exposes route params", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper({
          routeParams: {
            duration: 25,
            fatigue: 3,
            cooldownMode: true,
            earOnlyMode: true,
          },
        }),
      });

      expect(result.current.duration).toBe(25);
      expect(result.current.cooldownMode).toBe(true);
      expect(result.current.earOnlyMode).toBe(true);
    });

    it("uses default values for missing route params", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper({
          routeParams: {},
        }),
      });

      expect(result.current.duration).toBe(20);
      expect(result.current.cooldownMode).toBe(false);
      expect(result.current.earOnlyMode).toBe(false);
      expect(result.current.selfDirected).toBe(false);
    });
  });

  describe("curriculum state", () => {
    it("initializes with empty curriculum", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      expect(result.current.curriculumSteps).toEqual([]);
      expect(result.current.currentStepIndex).toBe(0);
      expect(result.current.curriculumLoading).toBe(false);
    });

    it("getCurrentStep returns null when no steps", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      expect(result.current.getCurrentStep()).toBeNull();
    });
  });

  describe("strain detection", () => {
    it("initializes with no strain detected", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      expect(result.current.strainDetected).toBe(false);
      expect(result.current.rangeAttemptCount).toBe(0);
    });
  });

  // ==========================================================================
  // handleSkip tests
  // ==========================================================================
  describe("handleSkip", () => {
    it("hides reflection and resets state", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Show reflection first
      act(() => {
        result.current.handleNext();
        result.current.setReflection("test reflection");
        result.current.setRating(4);
      });

      act(() => {
        result.current.handleSkip();
      });

      expect(result.current.showReflection).toBe(false);
      expect(result.current.reflection).toBe("");
    });

    it("resets extended flag on skip", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleExtend(); // Sets extended to true
        result.current.handleSkip();
      });

      expect(result.current.extended).toBe(false);
    });
  });

  // ==========================================================================
  // fetchMoreMaterial tests
  // ==========================================================================
  describe("fetchMoreMaterial", () => {
    it("fetchMoreMaterial returns false when no session", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      // Wait for initial load to fail
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const gotMore = await result.current.fetchMoreMaterial();
      expect(gotMore).toBe(false);
    });

    it("fetchMoreMaterial adds new mini sessions on success", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCount = result.current.session?.mini_sessions?.length || 0;

      // Mock successful fetch for more material
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          session_id: 2,
          mini_sessions: [
            { mini_session_id: 10, material_id: 10, title: "Extra Material" },
          ],
        }),
      });

      let gotMore: boolean = false;
      await act(async () => {
        gotMore = await result.current.fetchMoreMaterial();
      });

      expect(gotMore).toBe(true);
      expect(result.current.session?.mini_sessions?.length).toBe(
        initialCount + 1,
      );
    });

    it("fetchMoreMaterial returns false on fetch error", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock failed fetch
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      let gotMore: boolean = true;
      await act(async () => {
        gotMore = await result.current.fetchMoreMaterial();
      });

      expect(gotMore).toBe(false);
    });
  });

  // ==========================================================================
  // Timer cleanup tests
  // ==========================================================================
  describe("Timer cleanup", () => {
    it("cleans up timer interval on unmount", async () => {
      const { result, unmount } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Advance some time to confirm timer started
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.elapsedSeconds).toBeGreaterThan(0);

      // Unmount should clean up
      unmount();

      // No errors means cleanup worked
    });
  });

  // ==========================================================================
  // handleTimeUpExtend tests
  // ==========================================================================
  describe("handleTimeUpExtend", () => {
    it("hides time-up modal on extend", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock more material fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          mini_sessions: [{ mini_session_id: 100 }],
        }),
      });

      await act(async () => {
        await result.current.handleTimeUpExtend();
      });

      expect(result.current.showTimeUpModal).toBe(false);
    });
  });

  // ==========================================================================
  // Session data structure tests
  // ==========================================================================
  describe("Session data", () => {
    it("session contains session_id", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.session?.session_id).toBe(1);
    });

    it("mini_sessions array is accessible", async () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(Array.isArray(result.current.session?.mini_sessions)).toBe(true);
    });
  });
});
