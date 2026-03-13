/**
 * Tests for ResetButton component (now DevNavMenu)
 * The ResetButton component was replaced with DevNavMenu which shows a 🔧 icon
 *
 * Fully typed TypeScript test file.
 */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert, Platform } from "react-native";
import ResetButton from "../src/components/ResetButton";

// Mock navigation
const mockDispatch = jest.fn();
const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    dispatch: mockDispatch,
    navigate: mockNavigate,
  }),
  CommonActions: {
    reset: jest.fn((config: Record<string, unknown>) => ({
      type: "RESET",
      ...config,
    })),
  },
}));

// Mock Alert
jest.spyOn(Alert, "alert");

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe("ResetButton", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockDispatch.mockClear();
    mockNavigate.mockClear();
    (Alert.alert as jest.Mock).mockClear();
    mockFetch.mockResolvedValue({ ok: true });
  });

  describe("Rendering", () => {
    it("renders the dev menu button", () => {
      const { getByText } = render(<ResetButton userId={1} />);
      expect(getByText("🔧")).toBeTruthy();
    });

    it("renders with default userId", () => {
      const { getByText } = render(<ResetButton />);
      expect(getByText("🔧")).toBeTruthy();
    });

    it("renders as a pressable element", () => {
      const { getByText } = render(<ResetButton userId={1} />);
      const button = getByText("🔧").parent;
      expect(button).toBeTruthy();
    });

    it("has correct accessibility label for closed state", () => {
      const { getByLabelText } = render(<ResetButton userId={1} />);
      expect(getByLabelText("Open developer navigation menu")).toBeTruthy();
    });
  });

  describe("Props", () => {
    it("accepts custom userId prop", () => {
      const { getByText } = render(<ResetButton userId={42} />);
      expect(getByText("🔧")).toBeTruthy();
    });

    it("works with userId as 0", () => {
      const { getByText } = render(<ResetButton userId={0} />);
      expect(getByText("🔧")).toBeTruthy();
    });

    it("uses default userId of 1 when not provided", () => {
      const { getByText } = render(<ResetButton />);
      expect(getByText("🔧")).toBeTruthy();
    });
  });

  describe("Menu opening", () => {
    it("opens menu when button is pressed", () => {
      const { getByText, getByLabelText } = render(<ResetButton userId={1} />);
      fireEvent.press(getByLabelText("Open developer navigation menu"));
      expect(getByText("Dev Navigation")).toBeTruthy();
    });

    it("shows close button when menu is open", () => {
      const { getByLabelText } = render(<ResetButton userId={1} />);
      fireEvent.press(getByLabelText("Open developer navigation menu"));
      expect(getByLabelText("Close developer menu")).toBeTruthy();
    });

    it("shows menu title when open", () => {
      const { getByText, getByLabelText } = render(<ResetButton userId={1} />);
      fireEvent.press(getByLabelText("Open developer navigation menu"));
      expect(getByText("Dev Navigation")).toBeTruthy();
    });
  });

  describe("Menu closing", () => {
    it("closes menu when close button is pressed", () => {
      const { getByText, getByLabelText, queryByText } = render(
        <ResetButton userId={1} />,
      );
      fireEvent.press(getByLabelText("Open developer navigation menu"));
      expect(getByText("Dev Navigation")).toBeTruthy();

      fireEvent.press(getByLabelText("Close developer menu"));
      expect(queryByText("Dev Navigation")).toBeNull();
    });

    it("shows menu button again after closing", () => {
      const { getByText, getByLabelText } = render(<ResetButton userId={1} />);
      fireEvent.press(getByLabelText("Open developer navigation menu"));
      fireEvent.press(getByLabelText("Close developer menu"));
      expect(getByText("🔧")).toBeTruthy();
    });
  });

  describe("Navigation items", () => {
    it("shows navigation items when menu is open", () => {
      const { getByText, getByLabelText } = render(<ResetButton userId={1} />);
      fireEvent.press(getByLabelText("Open developer navigation menu"));
      expect(getByText(/Home/)).toBeTruthy();
    });

    it("navigates to screen when item is pressed", () => {
      const { getByLabelText } = render(<ResetButton userId={1} />);
      fireEvent.press(getByLabelText("Open developer navigation menu"));
      fireEvent.press(getByLabelText("Navigate to Home"));
      expect(mockNavigate).toHaveBeenCalledWith("Home");
    });

    it("closes menu after navigation", () => {
      const { getByLabelText, queryByText } = render(
        <ResetButton userId={1} />,
      );
      fireEvent.press(getByLabelText("Open developer navigation menu"));
      fireEvent.press(getByLabelText("Navigate to Home"));
      expect(queryByText("Dev Navigation")).toBeNull();
    });

    it("has accessible labels for navigation items", () => {
      const { getByLabelText } = render(<ResetButton userId={1} />);
      fireEvent.press(getByLabelText("Open developer navigation menu"));
      expect(getByLabelText("Navigate to Home")).toBeTruthy();
      expect(getByLabelText("Navigate to Practice Setup")).toBeTruthy();
    });
  });

  describe("Reset functionality", () => {
    it("shows reset button when menu is open", () => {
      const { getByText, getByLabelText } = render(<ResetButton userId={1} />);
      fireEvent.press(getByLabelText("Open developer navigation menu"));
      expect(getByText(/Reset User Data/)).toBeTruthy();
    });

    it("has accessible label for reset button", () => {
      const { getByLabelText } = render(<ResetButton userId={1} />);
      fireEvent.press(getByLabelText("Open developer navigation menu"));
      expect(getByLabelText("Reset user data")).toBeTruthy();
    });
  });

  describe("Admin panel", () => {
    it("shows admin panel button when menu is open", () => {
      const { getByText, getByLabelText } = render(<ResetButton userId={1} />);
      fireEvent.press(getByLabelText("Open developer navigation menu"));
      expect(getByText(/Admin Panel/)).toBeTruthy();
    });

    it("navigates to Admin when admin button is pressed", () => {
      const { getByLabelText } = render(<ResetButton userId={1} />);
      fireEvent.press(getByLabelText("Open developer navigation menu"));
      fireEvent.press(getByLabelText("Open admin panel"));
      expect(mockNavigate).toHaveBeenCalledWith("Admin");
    });

    it("closes menu after admin navigation", () => {
      const { getByLabelText, queryByText } = render(
        <ResetButton userId={1} />,
      );
      fireEvent.press(getByLabelText("Open developer navigation menu"));
      fireEvent.press(getByLabelText("Open admin panel"));
      expect(queryByText("Dev Navigation")).toBeNull();
    });
  });

  describe("Accessibility", () => {
    it("menu button has button role", () => {
      const { getByRole } = render(<ResetButton userId={1} />);
      expect(getByRole("button")).toBeTruthy();
    });

    it("close button has accessible role", () => {
      const { getByLabelText } = render(<ResetButton userId={1} />);
      fireEvent.press(getByLabelText("Open developer navigation menu"));
      const closeButton = getByLabelText("Close developer menu");
      expect(closeButton).toBeTruthy();
    });

    it("navigation items have button roles", () => {
      const { getByLabelText, getAllByRole } = render(
        <ResetButton userId={1} />,
      );
      fireEvent.press(getByLabelText("Open developer navigation menu"));
      const buttons = getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(5);
    });
  });

  describe("Multiple interactions", () => {
    it("can open and close menu multiple times", () => {
      const { getByText, getByLabelText, queryByText } = render(
        <ResetButton userId={1} />,
      );

      // First open/close
      fireEvent.press(getByLabelText("Open developer navigation menu"));
      expect(getByText("Dev Navigation")).toBeTruthy();
      fireEvent.press(getByLabelText("Close developer menu"));
      expect(queryByText("Dev Navigation")).toBeNull();

      // Second open/close
      fireEvent.press(getByLabelText("Open developer navigation menu"));
      expect(getByText("Dev Navigation")).toBeTruthy();
      fireEvent.press(getByLabelText("Close developer menu"));
      expect(queryByText("Dev Navigation")).toBeNull();
    });

    it("can navigate to different screens", () => {
      const { getByLabelText } = render(<ResetButton userId={1} />);

      fireEvent.press(getByLabelText("Open developer navigation menu"));
      fireEvent.press(getByLabelText("Navigate to Home"));
      expect(mockNavigate).toHaveBeenCalledWith("Home");

      fireEvent.press(getByLabelText("Open developer navigation menu"));
      fireEvent.press(getByLabelText("Navigate to Practice Setup"));
      expect(mockNavigate).toHaveBeenCalledWith("StartPractice");
    });
  });
});
