/**
 * Tests for MyScoresScreen and useMyScores hook
 */

import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import { MyScoresScreen } from "../src/features/importMusic/screens/MyScoresScreen";
import { useMyScores } from "../src/features/importMusic/hooks/useMyScores";
import * as scoreStorageService from "../src/features/importMusic/services/scoreStorageService";

// ============================================================================
// Mocks
// ============================================================================

jest.mock("../src/features/importMusic/services/scoreStorageService");

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const mockScores: scoreStorageService.StoredScoreSummary[] = [
  {
    id: "score-1",
    title: "Mozart Sonata",
    composer: "Wolfgang Mozart",
    partCount: 2,
    measureCount: 32,
    savedAt: "2026-03-17T10:00:00Z",
    lastAccessedAt: "2026-03-17T12:00:00Z",
    tags: ["classical"],
    isFavorite: false,
    sourceType: "musicxml",
  },
  {
    id: "score-2",
    title: "Bach Prelude",
    composer: "J.S. Bach",
    partCount: 1,
    measureCount: 24,
    savedAt: "2026-03-16T09:00:00Z",
    lastAccessedAt: "2026-03-16T09:00:00Z",
    tags: [],
    isFavorite: true,
    sourceType: "mxl",
  },
];

// ============================================================================
// Helper
// ============================================================================

function renderScreen() {
  return render(
    <MyScoresScreen
      navigation={mockNavigation as any}
      route={{ params: {} } as any}
    />,
  );
}

// ============================================================================
// Tests
// ============================================================================

describe("MyScoresScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (scoreStorageService.listScores as jest.Mock).mockResolvedValue({
      success: true,
      data: mockScores,
    });
    (scoreStorageService.deleteScore as jest.Mock).mockResolvedValue({
      success: true,
      data: undefined,
    });
    (scoreStorageService.toggleFavorite as jest.Mock).mockImplementation(
      async (id: string) => ({
        success: true,
        data: {
          storageMetadata: {
            isFavorite: !mockScores.find((s) => s.id === id)?.isFavorite,
          },
        },
      }),
    );
  });

  describe("loading state", () => {
    it("shows loading indicator initially", async () => {
      // Delay the response to see loading state
      (scoreStorageService.listScores as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, data: [] }), 100),
          ),
      );

      const { getByText } = renderScreen();
      expect(getByText("Loading scores...")).toBeTruthy();
    });
  });

  describe("with scores", () => {
    it("renders score list", async () => {
      const { findByText, getByTestId } = renderScreen();

      await findByText("Mozart Sonata");
      expect(getByTestId("scores-list")).toBeTruthy();
    });

    it("shows score details", async () => {
      const { findByText } = renderScreen();

      await findByText("Mozart Sonata");
      expect(findByText("Wolfgang Mozart")).toBeTruthy();
      expect(findByText(/2 parts • 32 measures/)).toBeTruthy();
    });

    it("shows favorite indicator", async () => {
      const { findByTestId } = renderScreen();

      // Bach Prelude is favorited
      const favoriteButton = await findByTestId("favorite-button-score-2");
      expect(favoriteButton).toBeTruthy();
    });

    it("navigates to score viewer on tap", async () => {
      const { findByTestId } = renderScreen();

      const card = await findByTestId("score-card-score-1");
      fireEvent.press(card);

      expect(mockNavigation.navigate).toHaveBeenCalledWith("ScoreViewer", {
        scoreId: "score-1",
      });
    });

    it("toggles favorite on press", async () => {
      const { findByTestId } = renderScreen();

      const favoriteButton = await findByTestId("favorite-button-score-1");
      fireEvent.press(favoriteButton);

      await waitFor(() => {
        expect(scoreStorageService.toggleFavorite).toHaveBeenCalledWith(
          "score-1",
        );
      });
    });

    it("shows delete confirmation dialog", async () => {
      jest.spyOn(Alert, "alert");

      const { findByTestId } = renderScreen();

      const deleteButton = await findByTestId("delete-button-score-1");
      fireEvent.press(deleteButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        "Delete Score",
        expect.stringContaining("Mozart Sonata"),
        expect.any(Array),
      );
    });

    it("deletes score when confirmed", async () => {
      jest
        .spyOn(Alert, "alert")
        .mockImplementation((title, message, buttons) => {
          // Simulate pressing "Delete" button
          const deleteBtn = buttons?.find((b) => b.text === "Delete");
          deleteBtn?.onPress?.();
        });

      const { findByTestId, queryByText } = renderScreen();

      const deleteButton = await findByTestId("delete-button-score-1");
      fireEvent.press(deleteButton);

      await waitFor(() => {
        expect(scoreStorageService.deleteScore).toHaveBeenCalledWith("score-1");
      });
    });
  });

  describe("empty state", () => {
    beforeEach(() => {
      (scoreStorageService.listScores as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });
    });

    it("shows empty state message", async () => {
      const { findByText, getByTestId } = renderScreen();

      await findByText("No Scores Yet");
      expect(getByTestId("empty-state")).toBeTruthy();
    });

    it("shows import button", async () => {
      const { findByTestId } = renderScreen();

      const importButton = await findByTestId("import-button");
      expect(importButton).toBeTruthy();
    });

    it("navigates to import on button press", async () => {
      const { findByTestId } = renderScreen();

      const importButton = await findByTestId("import-button");
      fireEvent.press(importButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith("ImportMusic");
    });
  });

  describe("error state", () => {
    beforeEach(() => {
      (scoreStorageService.listScores as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: "load_failed", message: "Storage unavailable" },
      });
    });

    it("shows error message", async () => {
      const { findByText } = renderScreen();

      await findByText("Failed to Load");
      expect(findByText("Storage unavailable")).toBeTruthy();
    });

    it("shows retry button", async () => {
      const { findByText } = renderScreen();

      const retryButton = await findByText("Retry");
      expect(retryButton).toBeTruthy();
    });

    it("retries on button press", async () => {
      const { findByText } = renderScreen();

      const retryButton = await findByText("Retry");

      // Mock success on retry
      (scoreStorageService.listScores as jest.Mock).mockResolvedValue({
        success: true,
        data: mockScores,
      });

      fireEvent.press(retryButton);

      await waitFor(() => {
        expect(scoreStorageService.listScores).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("header", () => {
    it("shows back button", async () => {
      const { findByLabelText } = renderScreen();

      const backButton = await findByLabelText("Go back");
      fireEvent.press(backButton);

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it("shows add button in header", async () => {
      const { findByTestId } = renderScreen();

      const addButton = await findByTestId("header-import-button");
      fireEvent.press(addButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith("ImportMusic");
    });
  });

  describe("pull to refresh", () => {
    it("refreshes on pull", async () => {
      const { findByTestId } = renderScreen();

      const list = await findByTestId("scores-list");

      // Simulate pull to refresh
      const { refreshControl } = list.props;
      await act(async () => {
        refreshControl.props.onRefresh();
      });

      await waitFor(() => {
        expect(scoreStorageService.listScores).toHaveBeenCalledTimes(2);
      });
    });
  });
});

describe("useMyScores", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (scoreStorageService.listScores as jest.Mock).mockResolvedValue({
      success: true,
      data: mockScores,
    });
  });

  it("loads scores on mount", async () => {
    const TestComponent = () => {
      const { scores, isLoading } = useMyScores();
      return null;
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(scoreStorageService.listScores).toHaveBeenCalled();
    });
  });

  it("provides refresh function", async () => {
    let hookResult: any;
    const TestComponent = () => {
      hookResult = useMyScores();
      return null;
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(hookResult.isLoading).toBe(false);
    });

    await act(async () => {
      await hookResult.refresh();
    });

    expect(scoreStorageService.listScores).toHaveBeenCalledTimes(2);
  });

  it("handles delete", async () => {
    (scoreStorageService.deleteScore as jest.Mock).mockResolvedValue({
      success: true,
      data: undefined,
    });

    let hookResult: any;
    const TestComponent = () => {
      hookResult = useMyScores();
      return null;
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(hookResult.scores.length).toBe(2);
    });

    let success: boolean;
    await act(async () => {
      success = await hookResult.deleteScore("score-1");
    });

    expect(success!).toBe(true);
    expect(hookResult.scores.length).toBe(1);
  });

  it("handles toggle favorite", async () => {
    (scoreStorageService.toggleFavorite as jest.Mock).mockResolvedValue({
      success: true,
      data: { storageMetadata: { isFavorite: true } },
    });

    let hookResult: any;
    const TestComponent = () => {
      hookResult = useMyScores();
      return null;
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(hookResult.scores.length).toBe(2);
    });

    await act(async () => {
      await hookResult.toggleFavorite("score-1");
    });

    expect(scoreStorageService.toggleFavorite).toHaveBeenCalledWith("score-1");
  });
});
