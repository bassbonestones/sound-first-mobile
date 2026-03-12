/**
 * SelfDirectedScreen tests
 * Tests component mounting and data fetching
 */
import React from "react";
import { render } from "@testing-library/react-native";
import { Alert } from "react-native";

// Mock Alert
jest.spyOn(Alert, "alert");

// Mock ResetButton
jest.mock("../src/components/ResetButton", () => {
  const { View, Text } = require("react-native");
  return function MockResetButton() {
    return (
      <View testID="reset-button">
        <Text>Reset</Text>
      </View>
    );
  };
});

// Mock fetch - resolve synchronously
global.fetch = jest.fn((url) => {
  const mockMaterials = [
    { id: 1, title: "Simple Melody" },
    { id: 2, title: "Rhythm Pattern" },
  ];
  const mockFocusCards = [
    { id: 1, name: "Pitch Center" },
    { id: 2, name: "Clean Attacks" },
  ];

  let data = [];
  if (url.includes("/materials")) data = mockMaterials;
  else if (url.includes("/focus-cards")) data = mockFocusCards;

  return Promise.resolve({ json: () => Promise.resolve(data) });
});

import SelfDirectedScreen from "../src/screens/SelfDirectedScreen";

describe("SelfDirectedScreen", () => {
  const mockNavigation = {
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
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/materials"),
    );
  });

  it("calls fetch for focus-cards endpoint", () => {
    render(<SelfDirectedScreen navigation={mockNavigation} />);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/focus-cards"),
    );
  });

  it("fetches both endpoints on mount", () => {
    render(<SelfDirectedScreen navigation={mockNavigation} />);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("does not navigate on mount", () => {
    render(<SelfDirectedScreen navigation={mockNavigation} />);
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });
});
