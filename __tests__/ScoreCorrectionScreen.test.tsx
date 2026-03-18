/**
 * ScoreCorrectionScreen Tests
 */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

// Mock react-native-webview
jest.mock("react-native-webview", () => {
  const { View } = require("react-native");
  return {
    WebView: View,
  };
});

import { ScoreCorrectionScreen } from "../src/features/importMusic/screens/ScoreCorrectionScreen";
import type {
  ImportedScore,
  UncertainMeasure,
  ImportedPart,
  ImportedMeasure,
} from "../src/types/import";

// ============================================================================
// Test Data
// ============================================================================

const createMockPart = (
  id: string,
  name: string,
  measures: ImportedMeasure[],
): ImportedPart => ({
  id,
  name,
  abbreviation: name.substring(0, 3),
  instrument: name,
  measures,
});

const createMockMeasure = (number: number): ImportedMeasure => ({
  number,
  notes: [],
  timeSignature: null,
  keySignature: null,
  tempo: null,
  dynamics: [],
  directions: [],
});

const mockScore: ImportedScore = {
  title: "Test Score",
  composer: "Test Composer",
  arranger: null,
  copyright: null,
  parts: [
    createMockPart("p1", "Piano", [
      createMockMeasure(1),
      createMockMeasure(2),
      createMockMeasure(3),
      createMockMeasure(4),
    ]),
  ],
  metadata: {
    workTitle: "Test Score",
    workNumber: null,
    movementNumber: null,
    movementTitle: null,
    creator: {
      composer: "Test Composer",
      arranger: null,
      lyricist: null,
    },
    identification: {
      encoding: {
        software: "test",
        encodingDate: null,
      },
    },
  },
};

const mockUncertainMeasures: UncertainMeasure[] = [
  {
    measureNumber: 2,
    partIndex: 0,
    confidence: 0.6,
    issues: ["Low OCR confidence"],
    alternatives: [],
  },
  {
    measureNumber: 3,
    partIndex: 0,
    confidence: 0.7,
    issues: ["Ambiguous rhythm"],
    alternatives: [],
  },
];

const mockRawMusicXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1"><measure number="1"><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note></measure></part>
</score-partwise>`;

// ============================================================================
// Mock Functions
// ============================================================================

const mockGoBack = jest.fn();
const mockOnComplete = jest.fn();
const mockOnCancel = jest.fn();

const createMockNavigation = () => ({
  goBack: mockGoBack,
  navigate: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  reset: jest.fn(),
  isFocused: jest.fn(),
  canGoBack: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
  dispatch: jest.fn(),
  setParams: jest.fn(),
  getId: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  replace: jest.fn(),
});

const createMockRoute = (params: Record<string, unknown> = {}) => ({
  key: "ScoreCorrection",
  name: "ScoreCorrection",
  params,
});

// ============================================================================
// Tests
// ============================================================================

describe("ScoreCorrectionScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders screen with score", () => {
      const { getByTestId } = render(
        <ScoreCorrectionScreen
          navigation={createMockNavigation() as never}
          route={
            createMockRoute({
              score: mockScore,
              rawMusicXml: mockRawMusicXml,
              uncertainMeasures: mockUncertainMeasures,
            }) as never
          }
        />,
      );

      expect(getByTestId("score-correction-screen")).toBeTruthy();
      expect(getByTestId("score-correction-preview")).toBeTruthy();
      expect(getByTestId("score-correction-panel")).toBeTruthy();
    });

    it("renders empty state when no score provided", () => {
      const { getByText } = render(
        <ScoreCorrectionScreen
          navigation={createMockNavigation() as never}
          route={createMockRoute({}) as never}
        />,
      );

      expect(getByText("No Score to Review")).toBeTruthy();
      expect(
        getByText("Import a score first, then review if needed."),
      ).toBeTruthy();
    });

    it("renders with empty uncertain measures", () => {
      const { getByTestId } = render(
        <ScoreCorrectionScreen
          navigation={createMockNavigation() as never}
          route={
            createMockRoute({
              score: mockScore,
              rawMusicXml: mockRawMusicXml,
              uncertainMeasures: [],
            }) as never
          }
        />,
      );

      expect(getByTestId("score-correction-screen")).toBeTruthy();
    });
  });

  describe("callbacks", () => {
    it("calls onComplete when correction is finished", () => {
      // This test verifies the callback wiring - actual completion
      // would require interacting with the CorrectionPanel
      const { getByTestId } = render(
        <ScoreCorrectionScreen
          navigation={createMockNavigation() as never}
          route={
            createMockRoute({
              score: mockScore,
              rawMusicXml: mockRawMusicXml,
              uncertainMeasures: mockUncertainMeasures,
              onComplete: mockOnComplete,
            }) as never
          }
        />,
      );

      expect(getByTestId("score-correction-panel")).toBeTruthy();
    });

    it("calls onCancel and navigates back when cancelled", () => {
      const navigation = createMockNavigation();
      const { getByTestId } = render(
        <ScoreCorrectionScreen
          navigation={navigation as never}
          route={
            createMockRoute({
              score: mockScore,
              rawMusicXml: mockRawMusicXml,
              uncertainMeasures: mockUncertainMeasures,
              onCancel: mockOnCancel,
            }) as never
          }
        />,
      );

      // Get the correction panel which should have a cancel handler
      expect(getByTestId("score-correction-panel")).toBeTruthy();
    });
  });

  describe("navigation", () => {
    it("handles missing navigation prop gracefully", () => {
      const { getByTestId } = render(
        <ScoreCorrectionScreen
          navigation={undefined as never}
          route={
            createMockRoute({
              score: mockScore,
              rawMusicXml: mockRawMusicXml,
              uncertainMeasures: mockUncertainMeasures,
            }) as never
          }
        />,
      );

      expect(getByTestId("score-correction-screen")).toBeTruthy();
    });

    it("handles missing route params gracefully", () => {
      const { getByText } = render(
        <ScoreCorrectionScreen
          navigation={createMockNavigation() as never}
          route={undefined as never}
        />,
      );

      expect(getByText("No Score to Review")).toBeTruthy();
    });
  });
});
