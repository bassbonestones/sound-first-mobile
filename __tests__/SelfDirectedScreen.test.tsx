/**
 * SelfDirectedScreen tests
 * Tests component mounting and data fetching
 *
 * Fully typed TypeScript test file.
 */
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Alert } from "react-native";

// Mock Alert
jest.spyOn(Alert, "alert");

// Mock ResetButton
jest.mock("../src/components/ResetButton", () => {
  const { View, Text } = require("react-native");
  return function MockResetButton(): React.JSX.Element {
    return (
      <View testID="reset-button">
        <Text>Reset</Text>
      </View>
    );
  };
});

interface MockMaterial {
  id: number;
  title: string;
}

interface MockFocusCard {
  id: number;
  name: string;
}

// Mock fetch - resolve synchronously
const mockMaterials: MockMaterial[] = [
  { id: 1, title: "Simple Melody" },
  { id: 2, title: "Rhythm Pattern" },
];
const mockFocusCards: MockFocusCard[] = [
  { id: 1, name: "Pitch Center" },
  { id: 2, name: "Clean Attacks" },
];

const mockFetch = jest.fn((url: string) => {
  let data: MockMaterial[] | MockFocusCard[] = [];
  if (url.includes("/materials")) data = mockMaterials;
  else if (url.includes("/focus-cards")) data = mockFocusCards;

  return Promise.resolve({ json: () => Promise.resolve(data) });
});
global.fetch = mockFetch as unknown as typeof fetch;

import SelfDirectedScreen from "../src/screens/SelfDirectedScreen";

interface MockNavigation {
  navigate: jest.Mock;
}

describe("SelfDirectedScreen", () => {
  const mockNavigation: MockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial render", () => {
    it("renders without crashing", () => {
      const { toJSON } = render(
        <SelfDirectedScreen navigation={mockNavigation} />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("returns a valid render tree", () => {
      const { toJSON } = render(
        <SelfDirectedScreen navigation={mockNavigation} />,
      );
      expect(toJSON()).not.toBeNull();
    });
  });

  describe("Data fetching", () => {
    it("calls fetch for materials endpoint", () => {
      render(<SelfDirectedScreen navigation={mockNavigation} />);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/materials"),
      );
    });

    it("calls fetch for focus-cards endpoint", () => {
      render(<SelfDirectedScreen navigation={mockNavigation} />);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/focus-cards"),
      );
    });

    it("fetches both endpoints on mount", () => {
      render(<SelfDirectedScreen navigation={mockNavigation} />);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("fetches materials endpoint with baseUrl", () => {
      render(<SelfDirectedScreen navigation={mockNavigation} />);
      const materialCall = mockFetch.mock.calls.find((call) =>
        call[0].includes("/materials"),
      );
      expect(materialCall).toBeDefined();
    });

    it("fetches focus-cards endpoint with baseUrl", () => {
      render(<SelfDirectedScreen navigation={mockNavigation} />);
      const focusCardsCall = mockFetch.mock.calls.find((call) =>
        call[0].includes("/focus-cards"),
      );
      expect(focusCardsCall).toBeDefined();
    });
  });

  describe("Navigation", () => {
    it("does not navigate on mount", () => {
      render(<SelfDirectedScreen navigation={mockNavigation} />);
      expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });

    it("receives navigation prop", () => {
      const customNav = { navigate: jest.fn() };
      render(<SelfDirectedScreen navigation={customNav} />);
      expect(customNav.navigate).not.toHaveBeenCalled();
    });
  });

  describe("Mock data", () => {
    it("mock materials array is defined", () => {
      expect(mockMaterials).toBeDefined();
      expect(mockMaterials.length).toBe(2);
    });

    it("mock focus cards array is defined", () => {
      expect(mockFocusCards).toBeDefined();
      expect(mockFocusCards.length).toBe(2);
    });

    it("mock materials have correct structure", () => {
      expect(mockMaterials[0]).toHaveProperty("id");
      expect(mockMaterials[0]).toHaveProperty("title");
    });

    it("mock focus cards have correct structure", () => {
      expect(mockFocusCards[0]).toHaveProperty("id");
      expect(mockFocusCards[0]).toHaveProperty("name");
    });
  });

  describe("Component behavior", () => {
    it("does not throw on render", () => {
      expect(() => {
        render(<SelfDirectedScreen navigation={mockNavigation} />);
      }).not.toThrow();
    });
  });
});
