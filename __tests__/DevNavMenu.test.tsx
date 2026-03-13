/**
 * Tests for DevNavMenu component
 */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert, Platform } from "react-native";
import { DevNavMenu } from "../src/components/DevNavMenu";

// Mock navigation
const mockNavigate = jest.fn();
const mockDispatch = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    dispatch: mockDispatch,
  }),
  CommonActions: {
    reset: jest.fn((config) => ({ type: "RESET", ...config })),
  },
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock API client
jest.mock("../src/api/client", () => ({
  getBackendUrl: () => "http://localhost:8080",
}));

// Mock Alert
jest.spyOn(Alert, "alert");

describe("DevNavMenu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true });
  });

  describe("closed state", () => {
    it("renders menu button when closed", () => {
      const { getByLabelText } = render(<DevNavMenu />);
      expect(getByLabelText("Open developer navigation menu")).toBeTruthy();
    });

    it("displays wrench emoji on button", () => {
      const { getByText } = render(<DevNavMenu />);
      expect(getByText("🔧")).toBeTruthy();
    });

    it("opens menu when button pressed", () => {
      const { getByLabelText, queryByText } = render(<DevNavMenu />);

      fireEvent.press(getByLabelText("Open developer navigation menu"));

      expect(queryByText("Dev Navigation")).toBeTruthy();
    });
  });

  describe("open state", () => {
    it("shows Dev Navigation title", () => {
      const { getByLabelText, getByText } = render(<DevNavMenu />);

      fireEvent.press(getByLabelText("Open developer navigation menu"));

      expect(getByText("Dev Navigation")).toBeTruthy();
    });

    it("shows close button", () => {
      const { getByLabelText } = render(<DevNavMenu />);

      fireEvent.press(getByLabelText("Open developer navigation menu"));

      expect(getByLabelText("Close developer menu")).toBeTruthy();
    });

    it("closes when close button pressed", () => {
      const { getByLabelText, queryByText } = render(<DevNavMenu />);

      fireEvent.press(getByLabelText("Open developer navigation menu"));
      expect(queryByText("Dev Navigation")).toBeTruthy();

      fireEvent.press(getByLabelText("Close developer menu"));
      expect(queryByText("Dev Navigation")).toBeFalsy();
    });

    it("shows navigation items", () => {
      const { getByLabelText, getByText } = render(<DevNavMenu />);

      fireEvent.press(getByLabelText("Open developer navigation menu"));

      // Check for some expected nav items
      expect(getByText(/Home/)).toBeTruthy();
    });

    it("shows reset button", () => {
      const { getByLabelText } = render(<DevNavMenu />);

      fireEvent.press(getByLabelText("Open developer navigation menu"));

      expect(getByLabelText("Reset user data")).toBeTruthy();
    });

    it("shows admin panel button", () => {
      const { getByLabelText } = render(<DevNavMenu />);

      fireEvent.press(getByLabelText("Open developer navigation menu"));

      expect(getByLabelText("Open admin panel")).toBeTruthy();
    });
  });

  describe("navigation", () => {
    it("navigates when nav item pressed", () => {
      const { getByLabelText } = render(<DevNavMenu />);

      fireEvent.press(getByLabelText("Open developer navigation menu"));
      fireEvent.press(getByLabelText("Navigate to Home"));

      expect(mockNavigate).toHaveBeenCalledWith("Home");
    });

    it("closes menu after navigation", () => {
      const { getByLabelText, queryByText } = render(<DevNavMenu />);

      fireEvent.press(getByLabelText("Open developer navigation menu"));
      expect(queryByText("Dev Navigation")).toBeTruthy();

      fireEvent.press(getByLabelText("Navigate to Home"));

      expect(queryByText("Dev Navigation")).toBeFalsy();
    });

    it("navigates to Admin from admin button", () => {
      const { getByLabelText, queryByText } = render(<DevNavMenu />);

      fireEvent.press(getByLabelText("Open developer navigation menu"));
      fireEvent.press(getByLabelText("Open admin panel"));

      expect(mockNavigate).toHaveBeenCalledWith("Admin");
      expect(queryByText("Dev Navigation")).toBeFalsy();
    });
  });

  describe("reset functionality", () => {
    it("shows confirmation alert on reset press (native)", () => {
      const { getByLabelText } = render(<DevNavMenu userId={5} />);

      fireEvent.press(getByLabelText("Open developer navigation menu"));
      fireEvent.press(getByLabelText("Reset user data"));

      expect(Alert.alert).toHaveBeenCalledWith(
        "Reset Progress",
        "This will clear all your data and start over. Are you sure?",
        expect.any(Array),
      );
    });

    it("calls reset API on confirmation", async () => {
      const { getByLabelText } = render(<DevNavMenu userId={5} />);

      fireEvent.press(getByLabelText("Open developer navigation menu"));
      fireEvent.press(getByLabelText("Reset user data"));

      // Get the alert callback
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const resetButton = alertCall[2].find(
        (b: { text: string }) => b.text === "Reset",
      );

      // Call the reset callback
      await resetButton.onPress();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8080/users/5/reset",
        { method: "POST" },
      );
    });

    it("uses default userId of 1", async () => {
      const { getByLabelText } = render(<DevNavMenu />);

      fireEvent.press(getByLabelText("Open developer navigation menu"));
      fireEvent.press(getByLabelText("Reset user data"));

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const resetButton = alertCall[2].find(
        (b: { text: string }) => b.text === "Reset",
      );

      await resetButton.onPress();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8080/users/1/reset",
        { method: "POST" },
      );
    });

    it("shows error alert when fetch throws", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      const { getByLabelText } = render(<DevNavMenu userId={5} />);

      fireEvent.press(getByLabelText("Open developer navigation menu"));
      fireEvent.press(getByLabelText("Reset user data"));

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const resetButton = alertCall[2].find(
        (b: { text: string }) => b.text === "Reset",
      );

      await resetButton.onPress();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Failed to reset: Network error",
        );
      });
    });

    it("shows error alert when response not ok", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });
      const { getByLabelText } = render(<DevNavMenu userId={5} />);

      fireEvent.press(getByLabelText("Open developer navigation menu"));
      fireEvent.press(getByLabelText("Reset user data"));

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const resetButton = alertCall[2].find(
        (b: { text: string }) => b.text === "Reset",
      );

      await resetButton.onPress();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Failed to reset: Failed to reset",
        );
      });
    });

    it("handles non-Error thrown values", async () => {
      mockFetch.mockRejectedValueOnce("string error");
      const { getByLabelText } = render(<DevNavMenu userId={5} />);

      fireEvent.press(getByLabelText("Open developer navigation menu"));
      fireEvent.press(getByLabelText("Reset user data"));

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const resetButton = alertCall[2].find(
        (b: { text: string }) => b.text === "Reset",
      );

      await resetButton.onPress();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Failed to reset: Unknown error occurred",
        );
      });
    });
  });

  describe("web platform", () => {
    const originalPlatform = Platform.OS;
    const originalConfirm = global.window?.confirm;
    const originalAlert = global.alert;

    beforeEach(() => {
      (Platform as any).OS = "web";
      global.window = global.window || ({} as any);
      global.window.confirm = jest.fn();
      global.alert = jest.fn();
    });

    afterEach(() => {
      (Platform as any).OS = originalPlatform;
      if (originalConfirm) global.window.confirm = originalConfirm;
      global.alert = originalAlert;
    });

    it("uses window.confirm on web platform", () => {
      (global.window.confirm as jest.Mock).mockReturnValue(false);
      const { getByLabelText } = render(<DevNavMenu userId={5} />);

      fireEvent.press(getByLabelText("Open developer navigation menu"));
      fireEvent.press(getByLabelText("Reset user data"));

      expect(global.window.confirm).toHaveBeenCalledWith(
        "Reset all progress and start over?",
      );
    });

    it("performs reset when confirm returns true", async () => {
      (global.window.confirm as jest.Mock).mockReturnValue(true);
      const { getByLabelText } = render(<DevNavMenu userId={5} />);

      fireEvent.press(getByLabelText("Open developer navigation menu"));
      fireEvent.press(getByLabelText("Reset user data"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "http://localhost:8080/users/5/reset",
          { method: "POST" },
        );
      });
    });

    it("does not reset when confirm returns false", () => {
      (global.window.confirm as jest.Mock).mockReturnValue(false);
      const { getByLabelText } = render(<DevNavMenu userId={5} />);

      fireEvent.press(getByLabelText("Open developer navigation menu"));
      fireEvent.press(getByLabelText("Reset user data"));

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("uses browser alert for errors on web", async () => {
      (global.window.confirm as jest.Mock).mockReturnValue(true);
      mockFetch.mockRejectedValueOnce(new Error("Web error"));
      const { getByLabelText } = render(<DevNavMenu userId={5} />);

      fireEvent.press(getByLabelText("Open developer navigation menu"));
      fireEvent.press(getByLabelText("Reset user data"));

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith("Failed to reset: Web error");
      });
    });
  });

  describe("accessibility", () => {
    it("menu button has correct accessibility role", () => {
      const { getByRole } = render(<DevNavMenu />);
      expect(getByRole("button")).toBeTruthy();
    });

    it("navigation items have accessibility labels", () => {
      const { getByLabelText } = render(<DevNavMenu />);

      fireEvent.press(getByLabelText("Open developer navigation menu"));

      expect(getByLabelText("Navigate to Home")).toBeTruthy();
    });
  });
});
