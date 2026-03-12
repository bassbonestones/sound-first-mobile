/**
 * HistoryScreen tests
 * Tests component mounting and data fetching
 */
import React from "react";
import { render } from "@testing-library/react-native";

// Mock devLogger before import
jest.mock("../src/utils/devLogger", () => ({
  devError: jest.fn(),
  devLog: jest.fn(),
  devWarn: jest.fn(),
}));

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
  const mockSummary = {
    total_sessions: 25,
    total_minutes: 180,
  };
  const mockMaterials = [{ material_id: 1, title: "Test" }];
  const mockFocusCards = [{ focus_card_id: 1, name: "Pitch" }];
  const mockTimeline = [{ date: "2024-01-15", session_count: 2 }];

  let data = {};
  if (url.includes("/history/summary")) data = mockSummary;
  else if (url.includes("/history/materials")) data = mockMaterials;
  else if (url.includes("/history/focus-cards")) data = mockFocusCards;
  else if (url.includes("/history/timeline")) data = mockTimeline;

  return Promise.resolve({ json: () => Promise.resolve(data) });
});

import HistoryScreen from "../src/screens/HistoryScreen";

describe("HistoryScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    const { toJSON } = render(<HistoryScreen />);
    expect(toJSON()).toBeTruthy();
  });

  it("calls fetch for summary endpoint", () => {
    render(<HistoryScreen />);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/history/summary"),
    );
  });

  it("calls fetch for materials endpoint", () => {
    render(<HistoryScreen />);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/history/materials"),
    );
  });

  it("calls fetch for focus-cards endpoint", () => {
    render(<HistoryScreen />);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/history/focus-cards"),
    );
  });

  it("calls fetch for timeline endpoint", () => {
    render(<HistoryScreen />);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/history/timeline"),
    );
  });

  it("fetches all 4 endpoints on mount", () => {
    render(<HistoryScreen />);
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });
});
