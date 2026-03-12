/**
 * Tests for ResetButton component (now DevNavMenu)
 * The ResetButton component was replaced with DevNavMenu which shows a 🔧 icon
 *
 * Fully typed TypeScript test file.
 */

import React from "react";
import { render } from "@testing-library/react-native";
import ResetButton from "../src/components/ResetButton";

// Mock navigation
const mockDispatch = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    dispatch: mockDispatch,
    navigate: jest.fn(),
  }),
  CommonActions: {
    reset: jest.fn((config: Record<string, unknown>) => ({ type: "RESET", ...config })),
  },
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe("ResetButton", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockDispatch.mockClear();
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
  });
});
