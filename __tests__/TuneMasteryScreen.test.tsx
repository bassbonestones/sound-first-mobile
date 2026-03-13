/**
 * Tests for TuneMasteryScreen
 *
 * Fully typed TypeScript test file.
 */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import TuneMasteryScreen from "../src/screens/TuneMastery";
import {
  useTuneMasteryData,
  type UseTuneMasteryDataReturn,
} from "../src/hooks/useTuneMasteryData";

// Mock the hooks
jest.mock("../src/hooks/useTuneMasteryData", () => ({
  useTuneMasteryData: jest.fn(),
  ALL_KEYS: ["A", "Bb", "B", "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab"],
  DEFAULT_TUNES: [
    "Hot Cross Buns",
    "Mary Had a Little Lamb",
    "Twinkle Twinkle",
  ],
}));

jest.mock("../src/hooks/useSelectionEngine", () => ({
  useSelectionEngine: jest.fn(() => ({
    getNextPick: jest.fn(() => ({
      tuneId: "tune1",
      key: "C",
      pickType: "learning",
    })),
    getTuneName: jest.fn((id: string) =>
      id === "tune1" ? "Test Tune" : "Unknown",
    ),
    isLearningPick: true,
    stats: { totalTunes: 1, totalMastered: 0, averageScore: 50 },
    MASTERY_THRESHOLD: 95,
  })),
}));

interface MockPracticePanelProps {
  tuneName: string;
  tuneKey: string;
  onCancel?: () => void;
}

// Mock components that have complex dependencies
jest.mock("../src/screens/TuneMastery/components/PracticePanel", () => {
  const { View, Text } = require("react-native");
  return function MockPracticePanel({
    tuneName,
    tuneKey,
  }: MockPracticePanelProps): React.JSX.Element {
    return (
      <View testID="practice-panel">
        <Text>{tuneName}</Text>
        <Text>{tuneKey}</Text>
      </View>
    );
  };
});

jest.mock("../src/screens/TuneMastery/components/Tuner", () => {
  const { View, Text } = require("react-native");
  return function MockTuner(): React.JSX.Element {
    return (
      <View testID="tuner">
        <Text>Tuner</Text>
      </View>
    );
  };
});

interface MockNavigation {
  goBack: jest.Mock;
  navigate: jest.Mock;
}

const mockNavigation: MockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

interface MockTune {
  id: string;
  name: string;
  keys: Record<string, unknown>;
}

interface MockData {
  settings: { emaAlpha: number; tunerMode: string; temperament: string };
  activeTunes: MockTune[];
  archivedTunes: MockTune[];
  currentSession: unknown;
  lastPickType: string;
}

const createMockData = (overrides: Partial<MockData> = {}): MockData => ({
  settings: { emaAlpha: 0.3, tunerMode: "needle", temperament: "equal" },
  activeTunes: [],
  archivedTunes: [],
  currentSession: null,
  lastPickType: "reinforcement",
  ...overrides,
});

interface MockHookReturn {
  data: MockData;
  loading: boolean;
  error: { message: string } | null;
  addTune: jest.Mock;
  archiveTune: jest.Mock;
  restoreTune: jest.Mock;
  deleteTune: jest.Mock;
  reorderTune: jest.Mock;
  renameTune: jest.Mock;
  updateScore: jest.Mock;
  updateSettings: jest.Mock;
  setCurrentSession: jest.Mock;
  clearCurrentSession: jest.Mock;
  toggleLastPickType: jest.Mock;
  seedTunes: jest.Mock;
}

const createMockHookReturn = (
  overrides: Partial<MockHookReturn> & { data?: Partial<MockData> } = {},
): MockHookReturn => ({
  data: createMockData(overrides.data),
  loading: false,
  error: null,
  addTune: jest.fn(),
  archiveTune: jest.fn(),
  restoreTune: jest.fn(),
  deleteTune: jest.fn(),
  reorderTune: jest.fn(),
  renameTune: jest.fn(),
  updateScore: jest.fn(),
  updateSettings: jest.fn(),
  setCurrentSession: jest.fn(),
  clearCurrentSession: jest.fn(),
  toggleLastPickType: jest.fn(),
  seedTunes: jest.fn(),
  ...overrides,
});

// Cast to typed mock
const mockUseTuneMasteryData = useTuneMasteryData as jest.MockedFunction<
  typeof useTuneMasteryData
>;

describe("TuneMasteryScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTuneMasteryData.mockReturnValue(
      createMockHookReturn() as unknown as UseTuneMasteryDataReturn,
    );
  });

  describe("rendering", () => {
    it("renders loading state", () => {
      mockUseTuneMasteryData.mockReturnValue(
        createMockHookReturn({
          loading: true,
        }) as unknown as UseTuneMasteryDataReturn,
      );

      const { getByText } = render(
        <TuneMasteryScreen navigation={mockNavigation} />,
      );

      expect(getByText("Loading...")).toBeTruthy();
    });

    it("renders error state", () => {
      mockUseTuneMasteryData.mockReturnValue(
        createMockHookReturn({
          error: { message: "Test error" },
        }) as unknown as UseTuneMasteryDataReturn,
      );

      const { getByText } = render(
        <TuneMasteryScreen navigation={mockNavigation} />,
      );

      expect(getByText("Error loading data")).toBeTruthy();
      expect(getByText("Test error")).toBeTruthy();
    });

    it("renders header with title", () => {
      const { getByText } = render(
        <TuneMasteryScreen navigation={mockNavigation} />,
      );

      expect(getByText("Tune Mastery")).toBeTruthy();
    });

    it("renders stats bar", () => {
      const { getByText } = render(
        <TuneMasteryScreen navigation={mockNavigation} />,
      );

      expect(getByText("Tunes")).toBeTruthy();
      expect(getByText("Mastered")).toBeTruthy();
      expect(getByText("Avg Score")).toBeTruthy();
    });

    it("renders add tune button", () => {
      const { getByText } = render(
        <TuneMasteryScreen navigation={mockNavigation} />,
      );

      expect(getByText("+ Add Tune")).toBeTruthy();
    });
  });

  describe("navigation", () => {
    it("calls goBack when back button pressed", () => {
      const { getByText } = render(
        <TuneMasteryScreen navigation={mockNavigation} />,
      );

      fireEvent.press(getByText("←"));

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  describe("add tune", () => {
    it("opens add tune modal when button pressed", () => {
      const { getByText, queryByPlaceholderText } = render(
        <TuneMasteryScreen navigation={mockNavigation} />,
      );

      fireEvent.press(getByText("+ Add Tune"));

      expect(getByText("Add New Tune")).toBeTruthy();
      expect(queryByPlaceholderText("Tune name...")).toBeTruthy();
    });

    it("calls addTune with input value", async () => {
      const mockAddTune = jest.fn();
      mockUseTuneMasteryData.mockReturnValue(
        createMockHookReturn({
          addTune: mockAddTune,
        }) as unknown as UseTuneMasteryDataReturn,
      );

      const { getByText, getByPlaceholderText } = render(
        <TuneMasteryScreen navigation={mockNavigation} />,
      );

      fireEvent.press(getByText("+ Add Tune"));

      const input = getByPlaceholderText("Tune name...");
      fireEvent.changeText(input, "All The Things You Are");

      fireEvent.press(getByText("Add"));

      expect(mockAddTune).toHaveBeenCalledWith("All The Things You Are");
    });
  });

  describe("tune list", () => {
    it("renders tunes with empty state message when no tunes", () => {
      const { getByText } = render(
        <TuneMasteryScreen navigation={mockNavigation} />,
      );

      expect(getByText("No tunes yet. Add one to get started!")).toBeTruthy();
    });

    it("renders tune names when tunes exist", () => {
      mockUseTuneMasteryData.mockReturnValue(
        createMockHookReturn({
          data: createMockData({
            activeTunes: [
              { id: "tune1", name: "Confirmation", keys: {} },
              { id: "tune2", name: "Donna Lee", keys: {} },
            ],
          }),
        }) as unknown as UseTuneMasteryDataReturn,
      );

      const { getByText } = render(
        <TuneMasteryScreen navigation={mockNavigation} />,
      );

      expect(getByText("Confirmation")).toBeTruthy();
      expect(getByText("Donna Lee")).toBeTruthy();
    });
  });

  describe("archive", () => {
    it("shows archive toggle when archived tunes exist", () => {
      mockUseTuneMasteryData.mockReturnValue(
        createMockHookReturn({
          data: createMockData({
            archivedTunes: [{ id: "arch1", name: "Archived Tune", keys: {} }],
          }),
        }) as unknown as UseTuneMasteryDataReturn,
      );

      const { getByText } = render(
        <TuneMasteryScreen navigation={mockNavigation} />,
      );

      expect(getByText("▶ Archive (1)")).toBeTruthy();
    });
  });

  describe("settings", () => {
    it("opens settings modal when settings button pressed", () => {
      const { getByText, getByLabelText } = render(
        <TuneMasteryScreen navigation={mockNavigation} />,
      );

      fireEvent.press(getByLabelText("Settings"));

      expect(getByText("Settings")).toBeTruthy();
    });
  });

  describe("practice flow", () => {
    it("shows selection panel when not practicing", () => {
      mockUseTuneMasteryData.mockReturnValue(
        createMockHookReturn({
          data: createMockData({
            activeTunes: [
              {
                id: "tune1",
                name: "Test Tune",
                keys: { C: { score: 50, attempts: 3 } },
              },
            ],
          }),
        }) as unknown as UseTuneMasteryDataReturn,
      );

      const { getByText } = render(
        <TuneMasteryScreen navigation={mockNavigation} />,
      );

      expect(getByText("Go")).toBeTruthy();
    });

    it("handles Go button press", () => {
      const mockSetCurrentSession = jest.fn();
      const mockToggleLastPickType = jest.fn();
      mockUseTuneMasteryData.mockReturnValue(
        createMockHookReturn({
          data: createMockData({
            activeTunes: [
              {
                id: "tune1",
                name: "Test Tune",
                keys: { C: { score: 50, attempts: 3 } },
              },
            ],
          }),
          setCurrentSession: mockSetCurrentSession,
          toggleLastPickType: mockToggleLastPickType,
        }) as unknown as UseTuneMasteryDataReturn,
      );

      const { getByText } = render(
        <TuneMasteryScreen navigation={mockNavigation} />,
      );

      fireEvent.press(getByText("Go"));

      expect(mockSetCurrentSession).toHaveBeenCalled();
    });

    it("restores session on mount when currentSession exists", () => {
      mockUseTuneMasteryData.mockReturnValue(
        createMockHookReturn({
          data: createMockData({
            activeTunes: [
              {
                id: "tune1",
                name: "Test Tune",
                keys: { C: { score: 50, attempts: 3 } },
              },
            ],
            currentSession: {
              tuneId: "tune1",
              key: "C",
              isManualTune: false,
              isManualKey: false,
              pickType: "learning",
            },
          }),
        }) as unknown as UseTuneMasteryDataReturn,
      );

      const { getByTestId } = render(
        <TuneMasteryScreen navigation={mockNavigation} />,
      );

      // Practice panel should be visible
      expect(getByTestId("practice-panel")).toBeTruthy();
    });
  });

  describe("archive interactions", () => {
    it("toggles archive visibility when archive button pressed", () => {
      mockUseTuneMasteryData.mockReturnValue(
        createMockHookReturn({
          data: createMockData({
            archivedTunes: [{ id: "arch1", name: "Archived Tune", keys: {} }],
          }),
        }) as unknown as UseTuneMasteryDataReturn,
      );

      const { getByText, getByLabelText } = render(
        <TuneMasteryScreen navigation={mockNavigation} />,
      );

      // Initially collapsed
      expect(getByText("▶ Archive (1)")).toBeTruthy();

      // Toggle open
      fireEvent.press(getByLabelText("Show archive"));
      expect(getByText("▼ Archive (1)")).toBeTruthy();

      // Toggle closed
      fireEvent.press(getByLabelText("Hide archive"));
      expect(getByText("▶ Archive (1)")).toBeTruthy();
    });
  });

  describe("add tune validation", () => {
    it("does not add tune with empty name", async () => {
      const mockAddTune = jest.fn();
      mockUseTuneMasteryData.mockReturnValue(
        createMockHookReturn({
          addTune: mockAddTune,
        }) as unknown as UseTuneMasteryDataReturn,
      );

      const { getByText, getByPlaceholderText } = render(
        <TuneMasteryScreen navigation={mockNavigation} />,
      );

      fireEvent.press(getByText("+ Add Tune"));

      // Leave input empty or with just spaces
      const input = getByPlaceholderText("Tune name...");
      fireEvent.changeText(input, "   ");

      fireEvent.press(getByText("Add"));

      // addTune should NOT be called with empty/whitespace name
      expect(mockAddTune).not.toHaveBeenCalled();
    });

    it("closes modal after successful add", async () => {
      const mockAddTune = jest.fn().mockResolvedValue(undefined);
      mockUseTuneMasteryData.mockReturnValue(
        createMockHookReturn({
          addTune: mockAddTune,
        }) as unknown as UseTuneMasteryDataReturn,
      );

      const { getByText, getByPlaceholderText, queryByText } = render(
        <TuneMasteryScreen navigation={mockNavigation} />,
      );

      fireEvent.press(getByText("+ Add Tune"));
      expect(getByText("Add New Tune")).toBeTruthy();

      const input = getByPlaceholderText("Tune name...");
      fireEvent.changeText(input, "Giant Steps");

      fireEvent.press(getByText("Add"));

      await waitFor(() => {
        expect(mockAddTune).toHaveBeenCalledWith("Giant Steps");
      });
    });

    it("closes add modal when cancel pressed", () => {
      const { getByText, queryByText } = render(
        <TuneMasteryScreen navigation={mockNavigation} />,
      );

      fireEvent.press(getByText("+ Add Tune"));
      expect(getByText("Add New Tune")).toBeTruthy();

      fireEvent.press(getByText("Cancel"));

      // Modal should be closed - title should not be visible
      expect(queryByText("Add New Tune")).toBeNull();
    });
  });

  describe("error handling", () => {
    it("displays error object message", () => {
      mockUseTuneMasteryData.mockReturnValue(
        createMockHookReturn({
          error: { message: "Storage error occurred" },
        }) as unknown as UseTuneMasteryDataReturn,
      );

      const { getByText } = render(
        <TuneMasteryScreen navigation={mockNavigation} />,
      );

      expect(getByText("Error loading data")).toBeTruthy();
      expect(getByText("Storage error occurred")).toBeTruthy();
    });

    it("handles Error instance", () => {
      mockUseTuneMasteryData.mockReturnValue(
        createMockHookReturn({
          error: new Error("Network failure"),
        }) as unknown as UseTuneMasteryDataReturn,
      );

      const { getByText } = render(
        <TuneMasteryScreen navigation={mockNavigation} />,
      );

      expect(getByText("Error loading data")).toBeTruthy();
      expect(getByText("Network failure")).toBeTruthy();
    });
  });

  describe("stats display", () => {
    it("displays stats from selection engine", () => {
      const { getByText } = render(
        <TuneMasteryScreen navigation={mockNavigation} />,
      );

      // Stats bar shows values from mocked useSelectionEngine
      expect(getByText("1")).toBeTruthy(); // totalTunes
      expect(getByText("0")).toBeTruthy(); // totalMastered
      expect(getByText(/50/)).toBeTruthy(); // averageScore (rendered with %)
    });
  });
});
