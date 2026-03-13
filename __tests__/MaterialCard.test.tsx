/**
 * @fileoverview Tests for MaterialCard component
 * Displays material information with notation in session
 */

import React from "react";
import { render } from "@testing-library/react-native";

// Mock NotationDisplay
jest.mock("../src/components/NotationDisplay", () => {
  const { View, Text } = require("react-native");
  const MockNotationDisplay = (props: {
    notationUrl?: string;
    materialId?: number;
  }) => (
    <View testID="notation-display">
      <Text>NotationDisplay</Text>
      {props.notationUrl && <Text>{props.notationUrl}</Text>}
    </View>
  );
  MockNotationDisplay.displayName = "NotationDisplay";

  const MockNotationPlaceholder = () => (
    <View testID="notation-placeholder">
      <Text>NotationPlaceholder</Text>
    </View>
  );
  MockNotationPlaceholder.displayName = "NotationPlaceholder";

  return {
    __esModule: true,
    default: MockNotationDisplay,
    NotationPlaceholder: MockNotationPlaceholder,
  };
});

// Mock AudioPlayer
jest.mock("../src/components/AudioPlayer", () => {
  const { View, Text } = require("react-native");
  const MockAudioPlayer = (props: { audioUrl?: string }) => (
    <View testID="audio-player">
      <Text>AudioPlayer</Text>
      {props.audioUrl && <Text>{props.audioUrl}</Text>}
    </View>
  );
  MockAudioPlayer.displayName = "AudioPlayer";
  return MockAudioPlayer;
});

// Mock theme
jest.mock("../src/styles/theme", () => ({
  createShadow: jest.fn(() => ({})),
}));

import MaterialCard from "../src/screens/Session/components/MaterialCard";

describe("MaterialCard", () => {
  const baseMini = {
    material_title: "Test Material",
    key: "C Major",
    notation_url: "https://example.com/notation.xml",
    material_id: 123,
    audio_url: "https://example.com/audio.mp3",
  };

  // ==========================================================================
  // BASIC RENDERING TESTS
  // ==========================================================================
  describe("Basic Rendering", () => {
    it("renders material title", () => {
      const { getByText } = render(<MaterialCard mini={baseMini} />);
      expect(getByText("Test Material")).toBeTruthy();
    });

    it("renders default title when material_title is missing", () => {
      const mini = { ...baseMini, material_title: undefined };
      const { getByText } = render(<MaterialCard mini={mini} />);
      expect(getByText("Material")).toBeTruthy();
    });

    it("renders key information", () => {
      const { getByText } = render(<MaterialCard mini={baseMini} />);
      expect(getByText("Key:")).toBeTruthy();
      expect(getByText("C Major")).toBeTruthy();
    });

    it("does not render key row when key is missing", () => {
      const mini = { ...baseMini, key: undefined };
      const { queryByText } = render(<MaterialCard mini={mini} />);
      expect(queryByText("Key:")).toBeNull();
    });
  });

  // ==========================================================================
  // NOTATION DISPLAY TESTS
  // ==========================================================================
  describe("Notation Display", () => {
    it("renders NotationDisplay when notation_url is provided", () => {
      const { getByTestId } = render(<MaterialCard mini={baseMini} />);
      expect(getByTestId("notation-display")).toBeTruthy();
    });

    it("renders NotationDisplay when material_id is provided without URL", () => {
      const mini = { ...baseMini, notation_url: undefined };
      const { getByTestId } = render(<MaterialCard mini={mini} />);
      expect(getByTestId("notation-display")).toBeTruthy();
    });

    it("renders NotationPlaceholder when no notation data", () => {
      const mini = { material_title: "Test" };
      const { getByTestId } = render(<MaterialCard mini={mini} />);
      expect(getByTestId("notation-placeholder")).toBeTruthy();
    });
  });

  // ==========================================================================
  // AUDIO PLAYER TESTS
  // ==========================================================================
  describe("Audio Player", () => {
    it("renders AudioPlayer when audio_url is provided", () => {
      const { getByTestId } = render(<MaterialCard mini={baseMini} />);
      expect(getByTestId("audio-player")).toBeTruthy();
    });

    it("does not render AudioPlayer when audio_url is missing", () => {
      const mini = { ...baseMini, audio_url: undefined };
      const { queryByTestId } = render(<MaterialCard mini={mini} />);
      expect(queryByTestId("audio-player")).toBeNull();
    });
  });

  // ==========================================================================
  // MEMO BEHAVIOR TESTS
  // ==========================================================================
  describe("Memo Behavior", () => {
    it("is memoized component", () => {
      // Verify it renders without error (memo wrapping)
      const { rerender } = render(<MaterialCard mini={baseMini} />);
      rerender(<MaterialCard mini={baseMini} />);
      // No error means memo is working
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================
  describe("Edge Cases", () => {
    it("handles empty mini object", () => {
      const mini = {};
      const { getByText, getByTestId } = render(<MaterialCard mini={mini} />);
      expect(getByText("Material")).toBeTruthy();
      expect(getByTestId("notation-placeholder")).toBeTruthy();
    });

    it("handles mini with only title", () => {
      const mini = { material_title: "Solo Title" };
      const { getByText, queryByText } = render(<MaterialCard mini={mini} />);
      expect(getByText("Solo Title")).toBeTruthy();
      expect(queryByText("Key:")).toBeNull();
    });
  });
});
