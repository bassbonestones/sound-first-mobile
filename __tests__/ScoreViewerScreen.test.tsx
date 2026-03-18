/**
 * ScoreViewerScreen Tests
 */

import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { Alert } from "react-native";

// Mock react-native-webview BEFORE imports
jest.mock("react-native-webview", () => {
  const { View } = require("react-native");
  return {
    WebView: View,
  };
});

// Mock ScorePreview to auto-render
jest.mock("../src/features/importMusic/components/ScorePreview", () => {
  const { useEffect } = require("react");
  const { View, Text } = require("react-native");
  return {
    ScorePreview: ({
      onRenderComplete,
      testID,
    }: {
      onRenderComplete?: () => void;
      testID?: string;
    }) => {
      useEffect(() => {
        // Immediately trigger render complete
        if (onRenderComplete) {
          onRenderComplete();
        }
      }, [onRenderComplete]);
      return (
        <View testID={testID}>
          <Text>Mocked Score Preview</Text>
        </View>
      );
    },
  };
});

// Mock the scoreStorageService
jest.mock("../src/features/importMusic/services/scoreStorageService");

import { ScoreViewerScreen } from "../src/features/importMusic/screens/ScoreViewerScreen";
import * as scoreStorageService from "../src/features/importMusic/services/scoreStorageService";
import type { ImportedScore } from "../src/types/import";

const mockScoreStorageService = scoreStorageService as jest.Mocked<
  typeof scoreStorageService
>;

// Mock Alert
jest.spyOn(Alert, "alert");

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
} as unknown;

// Sample score data
const mockScore: ImportedScore = {
  sourceType: "musicxml",
  sourceFile: {
    uri: "file://test.musicxml",
    fileName: "test.musicxml",
    mimeType: "application/vnd.recordare.musicxml+xml",
    sizeBytes: 1024,
    sourceType: "musicxml",
  },
  metadata: {
    title: "Test Score",
    composer: "Test Composer",
    timeSignature: {
      beats: 4,
      beatType: 4,
      displayName: "4/4",
    },
    keySignature: {
      fifths: 0,
      mode: "major",
      displayName: "C Major",
    },
    tempoMarking: null,
    workTitle: null,
    movementTitle: null,
    arranger: null,
    lyricist: null,
    copyright: null,
    encodingDate: null,
    encodingSoftware: null,
    musicXmlVersion: "3.1",
    rawEncodingDate: null,
    partCount: 1,
    measureCount: 16,
  },
  parts: [
    {
      id: "P1",
      name: "Piano",
      abbreviation: "Pno.",
      measures: [],
    },
  ],
  measureCount: 16,
  rawMusicXmlPreview: null,
  uncertainMeasures: [],
  validationIssues: [],
  confidenceScore: 1.0,
  importedAt: new Date().toISOString(),
};

const mockRawMusicXml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
</score-partwise>`;

describe("ScoreViewerScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders score viewer with title and composer", () => {
      const { getByText, getByTestId } = render(
        <ScoreViewerScreen
          route={
            {
              params: { score: mockScore, rawMusicXml: mockRawMusicXml },
            } as unknown
          }
          navigation={mockNavigation}
        />,
      );

      expect(getByText("Test Score")).toBeTruthy();
      expect(getByText("Test Composer")).toBeTruthy();
      expect(getByTestId("score-viewer-screen")).toBeTruthy();
    });

    it("shows empty state when no score provided", () => {
      const { getByText } = render(
        <ScoreViewerScreen
          route={{ params: {} } as unknown}
          navigation={mockNavigation}
        />,
      );

      expect(getByText("No Score Available")).toBeTruthy();
    });

    it("shows score metadata", () => {
      const { getByText } = render(
        <ScoreViewerScreen
          route={
            {
              params: { score: mockScore, rawMusicXml: mockRawMusicXml },
            } as unknown
          }
          navigation={mockNavigation}
        />,
      );

      expect(getByText("Parts")).toBeTruthy();
      expect(getByText("1")).toBeTruthy();
      expect(getByText("Measures")).toBeTruthy();
      expect(getByText("16")).toBeTruthy();
      expect(getByText("Time")).toBeTruthy();
      expect(getByText("4/4")).toBeTruthy();
    });
  });

  describe("Save button", () => {
    it("renders Save button", () => {
      const { getByLabelText } = render(
        <ScoreViewerScreen
          route={
            {
              params: { score: mockScore, rawMusicXml: mockRawMusicXml },
            } as unknown
          }
          navigation={mockNavigation}
        />,
      );

      expect(getByLabelText("Save to library")).toBeTruthy();
    });

    it("saves score on button press", async () => {
      mockScoreStorageService.saveScore.mockResolvedValueOnce({
        success: true,
        data: {
          storageMetadata: {
            id: "test-id",
            savedAt: new Date().toISOString(),
            lastAccessedAt: new Date().toISOString(),
            tags: [],
            isFavorite: false,
          },
          score: mockScore,
          rawMusicXml: mockRawMusicXml,
        },
      });

      const { getByLabelText } = render(
        <ScoreViewerScreen
          route={
            {
              params: { score: mockScore, rawMusicXml: mockRawMusicXml },
            } as unknown
          }
          navigation={mockNavigation}
        />,
      );

      const saveButton = getByLabelText("Save to library");

      await act(async () => {
        fireEvent.press(saveButton);
      });

      await waitFor(() => {
        expect(mockScoreStorageService.saveScore).toHaveBeenCalledWith({
          score: mockScore,
          rawMusicXml: mockRawMusicXml,
        });
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Saved",
        "Score saved to your library.",
        expect.any(Array),
      );
    });

    it("shows Saved state after successful save", async () => {
      mockScoreStorageService.saveScore.mockResolvedValueOnce({
        success: true,
        data: {
          storageMetadata: {
            id: "test-id",
            savedAt: new Date().toISOString(),
            lastAccessedAt: new Date().toISOString(),
            tags: [],
            isFavorite: false,
          },
          score: mockScore,
          rawMusicXml: mockRawMusicXml,
        },
      });

      const { getByLabelText, getByText } = render(
        <ScoreViewerScreen
          route={
            {
              params: { score: mockScore, rawMusicXml: mockRawMusicXml },
            } as unknown
          }
          navigation={mockNavigation}
        />,
      );

      await act(async () => {
        fireEvent.press(getByLabelText("Save to library"));
      });

      await waitFor(() => {
        expect(getByText("Saved")).toBeTruthy();
        expect(getByLabelText("Score saved")).toBeTruthy();
      });
    });

    it("shows error alert on save failure", async () => {
      mockScoreStorageService.saveScore.mockResolvedValueOnce({
        success: false,
        error: {
          code: "save_failed",
          message: "Storage is full",
        },
      });

      const { getByLabelText } = render(
        <ScoreViewerScreen
          route={
            {
              params: { score: mockScore, rawMusicXml: mockRawMusicXml },
            } as unknown
          }
          navigation={mockNavigation}
        />,
      );

      await act(async () => {
        fireEvent.press(getByLabelText("Save to library"));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Save Failed",
          "Storage is full",
          expect.any(Array),
        );
      });
    });

    it("shows error alert on exception", async () => {
      mockScoreStorageService.saveScore.mockRejectedValueOnce(
        new Error("Network error"),
      );

      const { getByLabelText } = render(
        <ScoreViewerScreen
          route={
            {
              params: { score: mockScore, rawMusicXml: mockRawMusicXml },
            } as unknown
          }
          navigation={mockNavigation}
        />,
      );

      await act(async () => {
        fireEvent.press(getByLabelText("Save to library"));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Save Failed",
          "Unable to save score. Please try again.",
          expect.any(Array),
        );
      });
    });

    it("prevents double save", async () => {
      mockScoreStorageService.saveScore.mockResolvedValueOnce({
        success: true,
        data: {
          storageMetadata: {
            id: "test-id",
            savedAt: new Date().toISOString(),
            lastAccessedAt: new Date().toISOString(),
            tags: [],
            isFavorite: false,
          },
          score: mockScore,
          rawMusicXml: mockRawMusicXml,
        },
      });

      const { getByLabelText } = render(
        <ScoreViewerScreen
          route={
            {
              params: { score: mockScore, rawMusicXml: mockRawMusicXml },
            } as unknown
          }
          navigation={mockNavigation}
        />,
      );

      // First save
      await act(async () => {
        fireEvent.press(getByLabelText("Save to library"));
      });

      await waitFor(() => {
        expect(mockScoreStorageService.saveScore).toHaveBeenCalledTimes(1);
      });

      // Try to press again - button should be disabled and show "Score saved"
      const savedButton = getByLabelText("Score saved");
      await act(async () => {
        fireEvent.press(savedButton);
      });

      // Should not call saveScore again
      expect(mockScoreStorageService.saveScore).toHaveBeenCalledTimes(1);
    });
  });

  describe("navigation", () => {
    it("navigates back on back button press", () => {
      const { getByLabelText } = render(
        <ScoreViewerScreen
          route={
            {
              params: { score: mockScore, rawMusicXml: mockRawMusicXml },
            } as unknown
          }
          navigation={mockNavigation}
        />,
      );

      fireEvent.press(getByLabelText("Go back"));
      expect(mockGoBack).toHaveBeenCalled();
    });

    it("navigates to correction screen on review button press", () => {
      const { getByLabelText } = render(
        <ScoreViewerScreen
          route={
            {
              params: { score: mockScore, rawMusicXml: mockRawMusicXml },
            } as unknown
          }
          navigation={mockNavigation}
        />,
      );

      fireEvent.press(getByLabelText("Review score"));
      expect(mockNavigate).toHaveBeenCalledWith("ScoreCorrection", {
        score: mockScore,
        rawMusicXml: mockRawMusicXml,
        uncertainMeasures: [],
      });
    });
  });

  describe("Practice button", () => {
    it("navigates to practice screen", () => {
      const { getByLabelText } = render(
        <ScoreViewerScreen
          route={
            {
              params: { score: mockScore, rawMusicXml: mockRawMusicXml },
            } as unknown
          }
          navigation={mockNavigation}
        />,
      );

      fireEvent.press(getByLabelText("Practice this score"));
      expect(mockNavigate).toHaveBeenCalledWith("ImportedScorePractice", {
        score: mockScore,
        rawMusicXml: mockRawMusicXml,
      });
    });
  });
});
