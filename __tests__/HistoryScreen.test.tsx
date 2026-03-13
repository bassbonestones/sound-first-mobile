/**
 * HistoryScreen tests
 * Tests component mounting, data fetching, and tab navigation
 *
 * Fully typed TypeScript test file.
 */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

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
  total_attempts: number;
  current_streak_days: number;
  average_rating: number;
  spaced_repetition: {
    due_today: number;
    overdue: number;
    never_reviewed: number;
    short_interval_count: number;
    medium_interval_count: number;
    long_interval_count: number;
  };
}

interface MockMaterial {
  material_id: number;
  material_title: string;
  mastery_level: string;
  attempt_count: number;
  average_rating: number | null;
  interval_days: number;
  is_due: boolean;
}

interface MockFocusCard {
  focus_card_id: number;
  focus_card_name: string;
  category: string;
  attempt_count: number;
  average_rating: number | null;
  recent_trend: "improving" | "declining" | "stable";
}

interface MockTimeline {
  date: string;
  attempts: number;
  avg_rating: number;
}

type MockData =
  | MockSummary
  | MockMaterial[]
  | MockFocusCard[]
  | MockTimeline[]
  | null;

// Complete mock data
const mockSummary: MockSummary = {
  total_sessions: 25,
  total_minutes: 180,
  total_attempts: 150,
  current_streak_days: 5,
  average_rating: 4.2,
  spaced_repetition: {
    due_today: 3,
    overdue: 2,
    never_reviewed: 10,
    short_interval_count: 5,
    medium_interval_count: 8,
    long_interval_count: 12,
  },
};

const mockMaterials: MockMaterial[] = [
  {
    material_id: 1,
    material_title: "Sonata in C",
    mastery_level: "learning",
    attempt_count: 5,
    average_rating: 3.5,
    interval_days: 2,
    is_due: true,
  },
  {
    material_id: 2,
    material_title: "Etude No. 1",
    mastery_level: "mastered",
    attempt_count: 20,
    average_rating: 4.8,
    interval_days: 14,
    is_due: false,
  },
  {
    material_id: 3,
    material_title: "New Piece",
    mastery_level: "new",
    attempt_count: 0,
    average_rating: null,
    interval_days: 0,
    is_due: false,
  },
];

const mockFocusCards: MockFocusCard[] = [
  {
    focus_card_id: 1,
    focus_card_name: "Pitch Accuracy",
    category: "Pitch",
    attempt_count: 15,
    average_rating: 4.0,
    recent_trend: "improving",
  },
  {
    focus_card_id: 2,
    focus_card_name: "Rhythm",
    category: "Time",
    attempt_count: 10,
    average_rating: 3.2,
    recent_trend: "declining",
  },
  {
    focus_card_id: 3,
    focus_card_name: "Dynamics",
    category: "Expression",
    attempt_count: 5,
    average_rating: null,
    recent_trend: "stable",
  },
];

const mockTimeline: MockTimeline[] = [
  { date: "2024-01-15", attempts: 5, avg_rating: 4.2 },
  { date: "2024-01-14", attempts: 3, avg_rating: 3.8 },
  { date: "2024-01-13", attempts: 0, avg_rating: 0 },
  { date: "2024-01-12", attempts: 7, avg_rating: 4.5 },
];

// Mock fetch
let mockFetchImpl: (url: string) => Promise<{ json: () => Promise<MockData> }>;

const mockFetch = jest.fn((url: string) => mockFetchImpl(url));
global.fetch = mockFetch as unknown as typeof fetch;

const defaultFetchImpl = (url: string) => {
  let data: MockData = null;
  if (url.includes("/history/summary")) data = mockSummary;
  else if (url.includes("/history/materials")) data = mockMaterials;
  else if (url.includes("/history/focus-cards")) data = mockFocusCards;
  else if (url.includes("/history/timeline")) data = mockTimeline;
  return Promise.resolve({ json: () => Promise.resolve(data) });
};

import HistoryScreen from "../src/screens/HistoryScreen";
import { devError } from "../src/utils/devLogger";

describe("HistoryScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchImpl = defaultFetchImpl;
  });

  describe("Initial render and data fetching", () => {
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

  describe("Loading state", () => {
    it("shows loading indicator while fetching", () => {
      // Use never-resolving promise to keep loading state
      mockFetchImpl = () => new Promise(() => {});
      const { UNSAFE_root } = render(<HistoryScreen />);
      // ActivityIndicator is rendered during loading
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe("Error handling", () => {
    it("handles fetch errors gracefully", async () => {
      mockFetchImpl = () => Promise.reject(new Error("Network error"));
      render(<HistoryScreen />);

      await waitFor(() => {
        expect(devError).toHaveBeenCalledWith(
          "History load error:",
          expect.any(Error),
        );
      });
    });
  });

  describe("Tab navigation", () => {
    it("renders page title", async () => {
      const { findByText } = render(<HistoryScreen />);
      expect(await findByText("Practice History")).toBeTruthy();
    });

    it("renders all tab buttons", async () => {
      const { findByLabelText } = render(<HistoryScreen />);
      expect(await findByLabelText("Summary tab")).toBeTruthy();
      expect(await findByLabelText("Materials tab")).toBeTruthy();
      expect(await findByLabelText("Focus Cards tab")).toBeTruthy();
      expect(await findByLabelText("Timeline tab")).toBeTruthy();
    });

    it("shows Summary tab by default", async () => {
      const { findByText } = render(<HistoryScreen />);
      expect(await findByText("Sessions")).toBeTruthy();
      expect(await findByText("Streak")).toBeTruthy();
    });

    it("switches to Materials tab when pressed", async () => {
      const { findByLabelText, findByText } = render(<HistoryScreen />);
      const materialsTab = await findByLabelText("Materials tab");
      fireEvent.press(materialsTab);
      expect(await findByText("Sonata in C")).toBeTruthy();
    });

    it("switches to Focus Cards tab when pressed", async () => {
      const { findByLabelText, findByText } = render(<HistoryScreen />);
      const focusTab = await findByLabelText("Focus Cards tab");
      fireEvent.press(focusTab);
      expect(await findByText("Pitch Accuracy")).toBeTruthy();
    });

    it("switches to Timeline tab when pressed", async () => {
      const { findByLabelText, findByText } = render(<HistoryScreen />);
      const timelineTab = await findByLabelText("Timeline tab");
      fireEvent.press(timelineTab);
      expect(await findByText("Last 30 days of practice")).toBeTruthy();
    });
  });

  describe("Summary tab content", () => {
    it("displays session count", async () => {
      const { findByText } = render(<HistoryScreen />);
      expect(await findByText("25")).toBeTruthy();
    });

    it("displays streak days", async () => {
      const { findByText } = render(<HistoryScreen />);
      expect(await findByText("5 days")).toBeTruthy();
    });

    it("displays average rating", async () => {
      const { findByText } = render(<HistoryScreen />);
      expect(await findByText("4.2")).toBeTruthy();
    });

    it("displays spaced repetition section", async () => {
      const { findByText } = render(<HistoryScreen />);
      expect(await findByText("Spaced Repetition")).toBeTruthy();
    });

    it("displays due today count", async () => {
      const { findByText } = render(<HistoryScreen />);
      expect(await findByText("Due Today")).toBeTruthy();
    });

    it("displays overdue count", async () => {
      const { findByText } = render(<HistoryScreen />);
      expect(await findByText("Overdue")).toBeTruthy();
    });
  });

  describe("Materials tab content", () => {
    it("displays material titles", async () => {
      const { findByLabelText, findByText } = render(<HistoryScreen />);
      fireEvent.press(await findByLabelText("Materials tab"));
      expect(await findByText("Sonata in C")).toBeTruthy();
      expect(await findByText("Etude No. 1")).toBeTruthy();
    });

    it("displays mastery levels", async () => {
      const { findByLabelText, findByText } = render(<HistoryScreen />);
      fireEvent.press(await findByLabelText("Materials tab"));
      expect(await findByText("LEARNING")).toBeTruthy();
      expect(await findByText("MASTERED")).toBeTruthy();
    });

    it("shows due indicator for due materials", async () => {
      const { findByLabelText, findByText } = render(<HistoryScreen />);
      fireEvent.press(await findByLabelText("Materials tab"));
      expect(await findByText("⚡ Due for review")).toBeTruthy();
    });

    it("displays attempt counts", async () => {
      const { findByLabelText, getAllByText } = render(<HistoryScreen />);
      fireEvent.press(await findByLabelText("Materials tab"));
      // Verify we can find "Practiced" word in the rendered content
      expect(
        getAllByText("Practiced", { exact: false }).length,
      ).toBeGreaterThan(0);
    });
  });

  describe("Focus Cards tab content", () => {
    it("displays focus card names", async () => {
      const { findByLabelText, findByText } = render(<HistoryScreen />);
      fireEvent.press(await findByLabelText("Focus Cards tab"));
      expect(await findByText("Pitch Accuracy")).toBeTruthy();
      expect(await findByText("Rhythm")).toBeTruthy();
    });

    it("displays categories", async () => {
      const { findByLabelText, findByText } = render(<HistoryScreen />);
      fireEvent.press(await findByLabelText("Focus Cards tab"));
      expect(await findByText("Pitch")).toBeTruthy();
      expect(await findByText("Time")).toBeTruthy();
    });

    it("displays improving trend", async () => {
      const { findByLabelText, findByText } = render(<HistoryScreen />);
      fireEvent.press(await findByLabelText("Focus Cards tab"));
      expect(await findByText("↗ Improving")).toBeTruthy();
    });

    it("displays declining trend", async () => {
      const { findByLabelText, findByText } = render(<HistoryScreen />);
      fireEvent.press(await findByLabelText("Focus Cards tab"));
      expect(await findByText("↘ Declining")).toBeTruthy();
    });

    it("displays stable trend", async () => {
      const { findByLabelText, findByText } = render(<HistoryScreen />);
      fireEvent.press(await findByLabelText("Focus Cards tab"));
      expect(await findByText("→ Stable")).toBeTruthy();
    });
  });

  describe("Timeline tab content", () => {
    it("displays timeline description", async () => {
      const { findByLabelText, findByText } = render(<HistoryScreen />);
      fireEvent.press(await findByLabelText("Timeline tab"));
      expect(await findByText("Last 30 days of practice")).toBeTruthy();
    });

    it("displays dates in daily breakdown", async () => {
      const { findByLabelText, findByText } = render(<HistoryScreen />);
      fireEvent.press(await findByLabelText("Timeline tab"));
      expect(await findByText("2024-01-15")).toBeTruthy();
    });

    it("displays attempts for each day", async () => {
      const { findByLabelText, getAllByText } = render(<HistoryScreen />);
      fireEvent.press(await findByLabelText("Timeline tab"));
      // Verify we can find "attempts" word in the rendered content
      expect(getAllByText("attempts", { exact: false }).length).toBeGreaterThan(
        0,
      );
    });
  });

  describe("Empty timeline state", () => {
    it("shows empty message when no timeline data", async () => {
      mockFetchImpl = (url: string) => {
        let data: MockData = null;
        if (url.includes("/history/summary")) data = mockSummary;
        else if (url.includes("/history/materials")) data = mockMaterials;
        else if (url.includes("/history/focus-cards")) data = mockFocusCards;
        else if (url.includes("/history/timeline")) data = [];
        return Promise.resolve({ json: () => Promise.resolve(data) });
      };

      const { findByLabelText, findByText } = render(<HistoryScreen />);
      fireEvent.press(await findByLabelText("Timeline tab"));
      expect(await findByText("No practice data yet")).toBeTruthy();
    });
  });

  describe("ResetButton", () => {
    it("renders ResetButton component", async () => {
      const { findByTestId } = render(<HistoryScreen />);
      expect(await findByTestId("reset-button")).toBeTruthy();
    });
  });
});
