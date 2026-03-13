/**
 * Tests for SessionDiagnostics admin component
 * Tests session generation and diagnostics viewing
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import SessionDiagnostics from "../../src/screens/Admin/tabs/SessionDiagnostics";

// Mock the api client
jest.mock("../../src/api/client", () => ({
  baseUrl: "http://test-api.com",
}));

// Mock devLogger
jest.mock("../../src/utils/devLogger", () => ({
  devError: jest.fn(),
  devLog: jest.fn(),
}));

// Mock admin styles
jest.mock("../../src/screens/Admin/styles", () => ({
  section: {},
  userSelectRow: {},
  userSelectLabel: {},
  userIdInputLarge: {},
  actionRow: {},
  actionButton: {},
  primaryButton: {},
  actionButtonText: {},
  diagnosticsContent: {},
  centered: {},
  noDataText: {},
  detailSection: {},
  detailSectionTitle: {},
  detailRow: {},
  detailLabel: {},
  detailValue: {},
  targetCapItem: {},
  gateItem: {},
  filterItem: {},
  filterName: {},
  filterValue: {},
  miniSessionCard: {},
  miniSessionTitle: {},
  miniSessionContent: {},
  exerciseItem: {},
}));

describe("SessionDiagnostics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================================================
  // RENDERING
  // ==========================================================================
  describe("Rendering", () => {
    it("renders without crashing", () => {
      const { getByText, getByPlaceholderText } = render(
        <SessionDiagnostics />,
      );

      expect(getByText("User ID:")).toBeTruthy();
      expect(getByPlaceholderText("Enter user ID")).toBeTruthy();
    });

    it("shows default user ID of 1", () => {
      const { getByPlaceholderText } = render(<SessionDiagnostics />);
      const input = getByPlaceholderText("Enter user ID");

      expect(input.props.value).toBe("1");
    });

    it("renders Generate Test Session button", () => {
      const { getByText } = render(<SessionDiagnostics />);

      expect(getByText("Generate Test Session")).toBeTruthy();
    });

    it("renders Load Last Session button", () => {
      const { getByText } = render(<SessionDiagnostics />);

      expect(getByText("Load Last Session")).toBeTruthy();
    });

    it("shows help text when no data loaded", () => {
      const { getByText } = render(<SessionDiagnostics />);

      expect(
        getByText(/Generate a test session or load the last session/),
      ).toBeTruthy();
    });
  });

  // ==========================================================================
  // USER ID INPUT
  // ==========================================================================
  describe("User ID Input", () => {
    it("allows changing user ID", () => {
      const { getByPlaceholderText } = render(<SessionDiagnostics />);
      const input = getByPlaceholderText("Enter user ID");

      fireEvent.changeText(input, "42");

      expect(input.props.value).toBe("42");
    });

    it("has numeric keyboard type", () => {
      const { getByPlaceholderText } = render(<SessionDiagnostics />);
      const input = getByPlaceholderText("Enter user ID");

      expect(input.props.keyboardType).toBe("numeric");
    });
  });

  // ==========================================================================
  // GENERATE SESSION
  // ==========================================================================
  describe("Generate Test Session", () => {
    it("calls API when Generate button pressed", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ session: { session_id: 123 } }),
      });

      const { getByText } = render(<SessionDiagnostics />);

      await act(async () => {
        fireEvent.press(getByText("Generate Test Session"));
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/users/1/generate-diagnostic-session"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("shows Generating... while loading", async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValue(promise);

      const { getByText, queryByText } = render(<SessionDiagnostics />);

      act(() => {
        fireEvent.press(getByText("Generate Test Session"));
      });

      // Should show generating text
      await waitFor(() => {
        expect(queryByText("Generating...")).toBeTruthy();
      });

      // Cleanup
      await act(async () => {
        resolvePromise!({ ok: true, json: () => Promise.resolve({}) });
      });
    });

    it("uses fallback endpoint on error", async () => {
      // Primary endpoint fails
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Primary failed"),
      );

      // Fallback succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ session_id: 999 }),
      });

      const { getByText } = render(<SessionDiagnostics />);

      await act(async () => {
        fireEvent.press(getByText("Generate Test Session"));
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/generate-session"),
          expect.any(Object),
        );
      });
    });
  });

  // ==========================================================================
  // LOAD LAST SESSION
  // ==========================================================================
  describe("Load Last Session", () => {
    it("calls API when Load button pressed", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ session: { session_id: 456 } }),
      });

      const { getByText } = render(<SessionDiagnostics />);

      await act(async () => {
        fireEvent.press(getByText("Load Last Session"));
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/users/1/last-session-diagnostics"),
      );
    });

    it("handles API error gracefully", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const { getByText } = render(<SessionDiagnostics />);

      await act(async () => {
        fireEvent.press(getByText("Load Last Session"));
      });

      // Should still render without crashing
      expect(getByText("Load Last Session")).toBeTruthy();
    });
  });

  // ==========================================================================
  // SESSION DATA DISPLAY
  // ==========================================================================
  describe("Session Data Display", () => {
    it("displays session overview after loading", async () => {
      const mockData = {
        session: {
          session_id: 123,
          user_id: 1,
          planned_duration_minutes: 30,
          mini_sessions: [],
        },
        diagnostics: {},
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const { getByText } = render(<SessionDiagnostics />);

      await act(async () => {
        fireEvent.press(getByText("Generate Test Session"));
      });

      await waitFor(() => {
        expect(getByText("Session Overview")).toBeTruthy();
      });
    });

    it("displays session ID", async () => {
      const mockData = {
        session: { session_id: 789 },
        diagnostics: {},
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const { getByText } = render(<SessionDiagnostics />);

      await act(async () => {
        fireEvent.press(getByText("Generate Test Session"));
      });

      await waitFor(() => {
        expect(getByText("789")).toBeTruthy();
      });
    });
  });

  // ==========================================================================
  // ACCESSIBILITY
  // ==========================================================================
  describe("Accessibility", () => {
    it("has accessible Generate button", () => {
      const { getByRole } = render(<SessionDiagnostics />);

      expect(
        getByRole("button", { name: "Generate test session" }),
      ).toBeTruthy();
    });

    it("has accessible Load button", () => {
      const { getByRole } = render(<SessionDiagnostics />);

      expect(
        getByRole("button", { name: "Load last session diagnostics" }),
      ).toBeTruthy();
    });
  });

  // ==========================================================================
  // DIFFERENT USER IDS
  // ==========================================================================
  describe("Different User IDs", () => {
    it("uses entered user ID in API call", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const { getByText, getByPlaceholderText } = render(
        <SessionDiagnostics />,
      );

      fireEvent.changeText(getByPlaceholderText("Enter user ID"), "99");

      await act(async () => {
        fireEvent.press(getByText("Generate Test Session"));
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/users/99/"),
        expect.any(Object),
      );
    });
  });
});
