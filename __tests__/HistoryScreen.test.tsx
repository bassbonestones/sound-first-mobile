/**
 * HistoryScreen tests
 * Tests component mounting and data fetching
 *
 * Fully typed TypeScript test file.
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
  return function MockResetButton(): React.JSX.Element {
    return (
      <View testID="reset-button">
        <Text>Reset</Text>
      </View>
    );
  };
});

interface MockSummary {
  total_sessions: number;
  total_minutes: number;
}

interface MockMaterial {
  material_id: number;
  title: string;
}

interface MockFocusCard {
  focus_card_id: number;
  name: string;
}

interface MockTimeline {
  date: string;
  session_count: number;
}

type MockData =
  | MockSummary
  | MockMaterial[]
  | MockFocusCard[]
  | MockTimeline[]
  | null;

// Mock fetch - resolve synchronously
const mockFetch = jest.fn((url: string) => {
  const mockSummary: MockSummary = {
    total_sessions: 25,
    total_minutes: 180,
  };
  const mockMaterials: MockMaterial[] = [{ material_id: 1, title: "Test" }];
  const mockFocusCards: MockFocusCard[] = [{ focus_card_id: 1, name: "Pitch" }];
  const mockTimeline: MockTimeline[] = [
    { date: "2024-01-15", session_count: 2 },
  ];

  let data: MockData = null;
  if (url.includes("/history/summary")) data = mockSummary;
  else if (url.includes("/history/materials")) data = mockMaterials;
  else if (url.includes("/history/focus-cards")) data = mockFocusCards;
  else if (url.includes("/history/timeline")) data = mockTimeline;

  return Promise.resolve({ json: () => Promise.resolve(data) });
});
global.fetch = mockFetch as unknown as typeof fetch;

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
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/history/summary"),
    );
  });

  it("calls fetch for materials endpoint", () => {
    render(<HistoryScreen />);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/history/materials"),
    );
  });

  it("calls fetch for focus-cards endpoint", () => {
    render(<HistoryScreen />);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/history/focus-cards"),
    );
  });

  it("calls fetch for timeline endpoint", () => {
    render(<HistoryScreen />);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/history/timeline"),
    );
  });

  it("fetches all 4 endpoints on mount", () => {
    render(<HistoryScreen />);
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });
});
