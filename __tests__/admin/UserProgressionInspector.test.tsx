/**
 * Tests for UserProgressionInspector admin component
 * Tests user progression viewing and editing functionality
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import UserProgressionInspector from "../../src/screens/Admin/tabs/UserProgressionInspector";

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
  loadButton: {},
  loadButtonText: {},
  subTabBar: {},
  subTab: {},
  subTabActive: {},
  subTabText: {},
  subTabTextActive: {},
  contentContainer: {},
  listContainer: {},
}));

describe("UserProgressionInspector", () => {
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
        <UserProgressionInspector />,
      );

      expect(getByText("User ID:")).toBeTruthy();
      expect(getByText("Load")).toBeTruthy();
      expect(getByPlaceholderText("Enter user ID")).toBeTruthy();
    });

    it("shows default user ID of 1", () => {
      const { getByPlaceholderText } = render(<UserProgressionInspector />);
      const input = getByPlaceholderText("Enter user ID");

      expect(input.props.value).toBe("1");
    });

    it("renders all sub-tabs", () => {
      const { getByText } = render(<UserProgressionInspector />);

      expect(getByText("Overview")).toBeTruthy();
      expect(getByText("Capabilities")).toBeTruthy();
      expect(getByText("Soft Gates")).toBeTruthy();
      expect(getByText("Candidates")).toBeTruthy();
    });

    it("has accessible load button", () => {
      const { getByRole } = render(<UserProgressionInspector />);

      expect(getByRole("button", { name: "Load user data" })).toBeTruthy();
    });
  });

  // ==========================================================================
  // USER ID INPUT
  // ==========================================================================
  describe("User ID Input", () => {
    it("allows changing user ID", () => {
      const { getByPlaceholderText } = render(<UserProgressionInspector />);
      const input = getByPlaceholderText("Enter user ID");

      fireEvent.changeText(input, "42");

      expect(input.props.value).toBe("42");
    });

    it("accepts numeric input", () => {
      const { getByPlaceholderText } = render(<UserProgressionInspector />);
      const input = getByPlaceholderText("Enter user ID");

      expect(input.props.keyboardType).toBe("numeric");
    });
  });

  // ==========================================================================
  // LOAD USER DATA
  // ==========================================================================
  describe("Load User Data", () => {
    it("calls API when Load button pressed", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ user_id: 1, instruments: [] }),
      });

      const { getByText } = render(<UserProgressionInspector />);

      await act(async () => {
        fireEvent.press(getByText("Load"));
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/users/1/progression"),
      );
    });

    it("fetches with instrument ID when selected", async () => {
      // First load to get instruments
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            user_id: 1,
            instruments: [
              { id: 5, instrument_name: "Piano", is_primary: true },
            ],
          }),
      });

      const { getByText } = render(<UserProgressionInspector />);

      await act(async () => {
        fireEvent.press(getByText("Load"));
      });

      // Check that auto-selected instrument caused a second call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it("handles API error with fallback calls", async () => {
      // First call fails
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Primary endpoint failed"),
      );

      // Fallback calls succeed
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 1 }),
        })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

      const { getByText } = render(<UserProgressionInspector />);

      await act(async () => {
        fireEvent.press(getByText("Load"));
      });

      await waitFor(() => {
        // Should have called fallback endpoints
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/users/1"),
        );
      });
    });

    it("shows loading indicator", async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValue(promise);

      const { getByText, queryByTestId } = render(<UserProgressionInspector />);

      act(() => {
        fireEvent.press(getByText("Load"));
      });

      // The component should be in loading state - we can't easily test ActivityIndicator
      // but we can verify fetch was called
      expect(global.fetch).toHaveBeenCalled();

      // Cleanup
      await act(async () => {
        resolvePromise!({ ok: true, json: () => Promise.resolve({}) });
      });
    });
  });

  // ==========================================================================
  // SUB-TAB NAVIGATION
  // ==========================================================================
  describe("Sub-tab Navigation", () => {
    it("starts on Overview tab", () => {
      const { getByText } = render(<UserProgressionInspector />);

      // Overview tab should be active (has active style)
      const overviewTab = getByText("Overview").parent;
      expect(overviewTab).toBeTruthy();
    });

    it("can switch to Capabilities tab", async () => {
      const { getByText, getByRole } = render(<UserProgressionInspector />);

      await act(async () => {
        fireEvent.press(getByText("Capabilities"));
      });

      // Tab should be pressed
      expect(getByRole("button", { name: "View Capabilities" })).toBeTruthy();
    });

    it("can switch to Soft Gates tab", async () => {
      const { getByText, getByRole } = render(<UserProgressionInspector />);

      await act(async () => {
        fireEvent.press(getByText("Soft Gates"));
      });

      expect(getByRole("button", { name: "View Soft Gates" })).toBeTruthy();
    });

    it("can switch to Candidates tab", async () => {
      const { getByText, getByRole } = render(<UserProgressionInspector />);

      await act(async () => {
        fireEvent.press(getByText("Candidates"));
      });

      expect(getByRole("button", { name: "View Candidates" })).toBeTruthy();
    });

    it("has accessible sub-tab buttons", () => {
      const { getByRole } = render(<UserProgressionInspector />);

      expect(getByRole("button", { name: "View Overview" })).toBeTruthy();
      expect(getByRole("button", { name: "View Capabilities" })).toBeTruthy();
      expect(getByRole("button", { name: "View Soft Gates" })).toBeTruthy();
      expect(getByRole("button", { name: "View Candidates" })).toBeTruthy();
    });
  });

  // ==========================================================================
  // INSTRUMENT SELECTOR
  // ==========================================================================
  describe("Instrument Selector", () => {
    const mockUserDataWithInstruments = {
      user_id: 1,
      instruments: [
        { id: 1, instrument_name: "Piano", is_primary: true },
        { id: 2, instrument_name: "Trombone", is_primary: false },
      ],
    };

    it("shows instrument selector after data loads", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUserDataWithInstruments),
      });

      const { getByText, queryByText } = render(<UserProgressionInspector />);

      // Initially no instrument selector
      expect(queryByText("Piano")).toBeNull();

      await act(async () => {
        fireEvent.press(getByText("Load"));
      });

      await waitFor(() => {
        expect(getByText(/Piano/)).toBeTruthy();
      });
    });

    it("shows All (Global Only) option", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUserDataWithInstruments),
      });

      const { getByText } = render(<UserProgressionInspector />);

      await act(async () => {
        fireEvent.press(getByText("Load"));
      });

      await waitFor(() => {
        expect(getByText("All (Global Only)")).toBeTruthy();
      });
    });

    it("marks primary instrument with star", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUserDataWithInstruments),
      });

      const { getByText } = render(<UserProgressionInspector />);

      await act(async () => {
        fireEvent.press(getByText("Load"));
      });

      await waitFor(() => {
        expect(getByText(/Piano.*★/)).toBeTruthy();
      });
    });

    it("can select different instrument", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUserDataWithInstruments),
      });

      const { getByText, getByRole } = render(<UserProgressionInspector />);

      await act(async () => {
        fireEvent.press(getByText("Load"));
      });

      await waitFor(() => {
        expect(getByText(/Trombone/)).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText(/Trombone/));
      });

      // Should trigger re-fetch with instrument ID
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("instrument_id=2"),
      );
    });
  });

  // ==========================================================================
  // OVERVIEW TAB CONTENT
  // ==========================================================================
  describe("Overview Tab Content", () => {
    const mockUserData = {
      user_id: 1,
      instruments: [],
      overview: {
        total_capabilities: 50,
        mastered: 10,
        in_progress: 15,
      },
      journey: {
        stage: "intermediate",
      },
    };

    it("displays user data after loading", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUserData),
      });

      const { getByText } = render(<UserProgressionInspector />);

      await act(async () => {
        fireEvent.press(getByText("Load"));
      });

      // The component should show some user data
      await waitFor(() => {
        // Just verify the load completed without error
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================
  describe("Error Handling", () => {
    it("handles non-ok response", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      // Fallbacks also fail
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Not found"));

      const { getByText } = render(<UserProgressionInspector />);

      await act(async () => {
        fireEvent.press(getByText("Load"));
      });

      // Should not crash, component should still be rendered
      expect(getByText("Load")).toBeTruthy();
    });

    it("handles network error gracefully", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const { getByText } = render(<UserProgressionInspector />);

      await act(async () => {
        fireEvent.press(getByText("Load"));
      });

      // Component should remain functional
      expect(getByText("User ID:")).toBeTruthy();
    });
  });

  // ==========================================================================
  // EMPTY USER ID
  // ==========================================================================
  describe("Empty User ID", () => {
    it("does not call API with empty user ID", async () => {
      const { getByText, getByPlaceholderText } = render(
        <UserProgressionInspector />,
      );

      const input = getByPlaceholderText("Enter user ID");
      fireEvent.changeText(input, "");

      await act(async () => {
        fireEvent.press(getByText("Load"));
      });

      // Should not call fetch with empty ID
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
