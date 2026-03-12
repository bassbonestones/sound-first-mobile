/**
 * SelfDirectedScreen tests
 * Tests component mounting and data fetching
 *
 * Fully typed TypeScript test file.
 */
import React from "react";
import { render } from "@testing-library/react-native";
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
const mockFetch = jest.fn((url: string) => {
  const mockMaterials: MockMaterial[] = [
    { id: 1, title: "Simple Melody" },
    { id: 2, title: "Rhythm Pattern" },
  ];
  const mockFocusCards: MockFocusCard[] = [
    { id: 1, name: "Pitch Center" },
    { id: 2, name: "Clean Attacks" },
  ];

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

  it("renders without crashing", () => {
    const { toJSON } = render(
      <SelfDirectedScreen navigation={mockNavigation} />,
    );
    expect(toJSON()).toBeTruthy();
  });

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

  it("does not navigate on mount", () => {
    render(<SelfDirectedScreen navigation={mockNavigation} />);
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });
});
