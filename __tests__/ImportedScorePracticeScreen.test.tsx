/**
 * ImportedScorePracticeScreen Tests
 */

import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

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
      highlightMeasure,
      testID,
    }: {
      onRenderComplete?: () => void;
      highlightMeasure?: number;
      testID?: string;
    }) => {
      useEffect(() => {
        if (onRenderComplete) {
          onRenderComplete();
        }
      }, [onRenderComplete]);
      return (
        <View testID={testID}>
          <Text>Mocked Score Preview</Text>
          {highlightMeasure && (
            <Text testID="highlight-measure">Measure: {highlightMeasure}</Text>
          )}
        </View>
      );
    },
  };
});

import { ImportedScorePracticeScreen } from "../src/features/importMusic/screens/ImportedScorePracticeScreen";
import { useImportedScorePractice } from "../src/features/importMusic/hooks/useImportedScorePractice";
import type { ImportedScore } from "../src/types/import";
import { renderHook, act as hookAct } from "@testing-library/react-native";

// ============================================================================
// Test Data
// ============================================================================

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
} as unknown;

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
    title: "Practice Test Score",
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
    tempoMarking: {
      bpm: 120,
      text: "Allegro",
    },
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
    measureCount: 8,
  },
  parts: [
    {
      id: "P1",
      name: "Piano",
      abbreviation: "Pno.",
      measures: [],
    },
  ],
  measureCount: 8,
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

// ============================================================================
// Screen Tests
// ============================================================================

describe("ImportedScorePracticeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders practice screen with score title", () => {
      const { getByText, getByTestId } = render(
        <ImportedScorePracticeScreen
          route={
            {
              params: { score: mockScore, rawMusicXml: mockRawMusicXml },
            } as unknown
          }
          navigation={mockNavigation}
        />,
      );

      expect(getByText("Practice Test Score")).toBeTruthy();
      expect(getByText("Test Composer")).toBeTruthy();
      expect(getByTestId("imported-score-practice-screen")).toBeTruthy();
    });

    it("shows empty state when no score provided", () => {
      const { getByText } = render(
        <ImportedScorePracticeScreen
          route={{ params: {} } as unknown}
          navigation={mockNavigation}
        />,
      );

      expect(getByText("No Score Available")).toBeTruthy();
    });

    it("displays tempo controls", () => {
      const { getByText, getByLabelText } = render(
        <ImportedScorePracticeScreen
          route={
            {
              params: { score: mockScore, rawMusicXml: mockRawMusicXml },
            } as unknown
          }
          navigation={mockNavigation}
        />,
      );

      expect(getByText("120")).toBeTruthy(); // Initial tempo from metadata
      expect(getByText("BPM")).toBeTruthy();
      expect(getByLabelText("Decrease tempo")).toBeTruthy();
      expect(getByLabelText("Increase tempo")).toBeTruthy();
    });

    it("displays playback controls", () => {
      const { getByLabelText } = render(
        <ImportedScorePracticeScreen
          route={
            {
              params: { score: mockScore, rawMusicXml: mockRawMusicXml },
            } as unknown
          }
          navigation={mockNavigation}
        />,
      );

      expect(getByLabelText("Play")).toBeTruthy();
    });

    it("displays progress info", () => {
      const { getByText } = render(
        <ImportedScorePracticeScreen
          route={
            {
              params: { score: mockScore, rawMusicXml: mockRawMusicXml },
            } as unknown
          }
          navigation={mockNavigation}
        />,
      );

      expect(getByText("Measure")).toBeTruthy();
      expect(getByText("Beat")).toBeTruthy();
    });
  });

  describe("tempo control", () => {
    it("increases tempo on plus press", () => {
      const { getByText, getByLabelText } = render(
        <ImportedScorePracticeScreen
          route={
            {
              params: { score: mockScore, rawMusicXml: mockRawMusicXml },
            } as unknown
          }
          navigation={mockNavigation}
        />,
      );

      fireEvent.press(getByLabelText("Increase tempo"));
      expect(getByText("125")).toBeTruthy();
    });

    it("decreases tempo on minus press", () => {
      const { getByText, getByLabelText } = render(
        <ImportedScorePracticeScreen
          route={
            {
              params: { score: mockScore, rawMusicXml: mockRawMusicXml },
            } as unknown
          }
          navigation={mockNavigation}
        />,
      );

      fireEvent.press(getByLabelText("Decrease tempo"));
      expect(getByText("115")).toBeTruthy();
    });
  });

  describe("metronome toggle", () => {
    it("toggles metronome on header button press", () => {
      const { getByLabelText } = render(
        <ImportedScorePracticeScreen
          route={
            {
              params: { score: mockScore, rawMusicXml: mockRawMusicXml },
            } as unknown
          }
          navigation={mockNavigation}
        />,
      );

      // Initially enabled
      const button = getByLabelText("Disable metronome");
      expect(button).toBeTruthy();

      fireEvent.press(button);

      // Now disabled
      expect(getByLabelText("Enable metronome")).toBeTruthy();
    });
  });

  describe("navigation", () => {
    it("navigates back on back button press", () => {
      const { getByLabelText } = render(
        <ImportedScorePracticeScreen
          route={
            {
              params: { score: mockScore, rawMusicXml: mockRawMusicXml },
            } as unknown
          }
          navigation={mockNavigation}
        />,
      );

      fireEvent.press(getByLabelText("Go back"));
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Hook Tests
// ============================================================================

describe("useImportedScorePractice", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("initializes with default values", () => {
    const { result } = renderHook(() =>
      useImportedScorePractice(mockScore, mockRawMusicXml),
    );

    expect(result.current.practiceState).toBe("idle");
    expect(result.current.config.tempo).toBe(120); // From metadata
    expect(result.current.config.beatsPerMeasure).toBe(4);
    expect(result.current.config.metronomeEnabled).toBe(true);
    expect(result.current.totalMeasures).toBe(8);
  });

  it("uses default tempo when metadata has no tempo", () => {
    const scoreWithoutTempo = {
      ...mockScore,
      metadata: {
        ...mockScore.metadata,
        tempoMarking: null,
      },
    };

    const { result } = renderHook(() =>
      useImportedScorePractice(scoreWithoutTempo, mockRawMusicXml),
    );

    expect(result.current.config.tempo).toBe(80); // Default
  });

  it("clamps tempo within bounds", () => {
    const { result } = renderHook(() =>
      useImportedScorePractice(mockScore, mockRawMusicXml),
    );

    // Try to set below minimum
    hookAct(() => {
      result.current.setTempo(10);
    });
    expect(result.current.config.tempo).toBe(20); // Min

    // Try to set above maximum
    hookAct(() => {
      result.current.setTempo(300);
    });
    expect(result.current.config.tempo).toBe(240); // Max
  });

  it("toggles metronome", () => {
    const { result } = renderHook(() =>
      useImportedScorePractice(mockScore, mockRawMusicXml),
    );

    expect(result.current.config.metronomeEnabled).toBe(true);

    hookAct(() => {
      result.current.toggleMetronome();
    });

    expect(result.current.config.metronomeEnabled).toBe(false);
  });

  it("starts with countdown", () => {
    const { result } = renderHook(() =>
      useImportedScorePractice(mockScore, mockRawMusicXml),
    );

    hookAct(() => {
      result.current.start();
    });

    expect(result.current.practiceState).toBe("countdown");
    expect(result.current.progress.countdownRemaining).toBe(4);
  });

  it("stops practice", () => {
    const { result } = renderHook(() =>
      useImportedScorePractice(mockScore, mockRawMusicXml),
    );

    hookAct(() => {
      result.current.start();
    });

    hookAct(() => {
      result.current.stop();
    });

    expect(result.current.practiceState).toBe("idle");
    expect(result.current.progress.currentMeasure).toBe(1);
    expect(result.current.progress.currentBeat).toBe(1);
  });

  it("sets loop range", () => {
    const { result } = renderHook(() =>
      useImportedScorePractice(mockScore, mockRawMusicXml),
    );

    hookAct(() => {
      result.current.setLoopRange(2, 5);
    });

    expect(result.current.config.loopStart).toBe(2);
    expect(result.current.config.loopEnd).toBe(5);
  });

  it("handles null score", () => {
    const { result } = renderHook(() => useImportedScorePractice(null, null));

    expect(result.current.practiceState).toBe("idle");
    expect(result.current.totalMeasures).toBe(0);
    expect(result.current.config.tempo).toBe(80); // Default
  });
});
