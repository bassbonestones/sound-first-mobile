/**
 * ChordPreview Component Tests
 *
 * Tests for the chord preview component with playback functionality.
 */

import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

// Mock the composerSynth module
jest.mock("../src/features/composer/services/composerSynth", () => ({
  composerSynth: {
    init: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
    playNote: jest.fn(),
  },
}));

// Mock NotationDisplay to avoid OSMD complexity in tests
jest.mock("../src/components/NotationDisplay", () => {
  const { View, Text } = require("react-native");
  return function MockNotationDisplay({ musicxml }: { musicxml: string }) {
    return (
      <View testID="mock-notation">
        <Text>{musicxml ? "notation-rendered" : "no-notation"}</Text>
      </View>
    );
  };
});

import { ChordPreview } from "../src/features/tune-composer/components/ChordPreview";
import { composerSynth } from "../src/features/composer/services/composerSynth";

describe("ChordPreview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("rendering", () => {
    it("renders chord symbol in header", () => {
      const { getByText } = render(
        <ChordPreview symbol="Cmaj7" onClose={jest.fn()} />,
      );

      expect(getByText("Cmaj7")).toBeTruthy();
    });

    it("renders play button", () => {
      const { getByTestId } = render(
        <ChordPreview symbol="Am7" onClose={jest.fn()} />,
      );

      expect(getByTestId("chord-preview-play")).toBeTruthy();
    });

    it("renders close button", () => {
      const { getByTestId } = render(
        <ChordPreview symbol="G7" onClose={jest.fn()} />,
      );

      expect(getByTestId("chord-preview-close")).toBeTruthy();
    });

    it("calls onClose when close button pressed", () => {
      const onClose = jest.fn();
      const { getByTestId } = render(
        <ChordPreview symbol="Dm" onClose={onClose} />,
      );

      fireEvent.press(getByTestId("chord-preview-close"));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("playback", () => {
    it("initializes synth when play button pressed", async () => {
      const { getByTestId } = render(
        <ChordPreview symbol="C" onClose={jest.fn()} />,
      );

      await act(async () => {
        fireEvent.press(getByTestId("chord-preview-play"));
        // Advance past the async operations
        await Promise.resolve();
      });

      expect(composerSynth.init).toHaveBeenCalledTimes(1);
      expect(composerSynth.resume).toHaveBeenCalledTimes(1);
    });

    it("plays notes sequentially then as a chord", async () => {
      const { getByTestId } = render(
        <ChordPreview symbol="C" onClose={jest.fn()} rootMidi={60} />,
      );

      // C major triad: C4 (60), E4 (64), G4 (67)
      await act(async () => {
        fireEvent.press(getByTestId("chord-preview-play"));
        await Promise.resolve(); // init/resume
      });

      // First note: C (60)
      expect(composerSynth.playNote).toHaveBeenNthCalledWith(1, 60, 500);

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Second note: E (64)
      expect(composerSynth.playNote).toHaveBeenNthCalledWith(2, 64, 500);

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Third note: G (67)
      expect(composerSynth.playNote).toHaveBeenNthCalledWith(3, 67, 500);

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Final chord: all three notes together (half note = 1000ms)
      expect(composerSynth.playNote).toHaveBeenNthCalledWith(4, 60, 1000);
      expect(composerSynth.playNote).toHaveBeenNthCalledWith(5, 64, 1000);
      expect(composerSynth.playNote).toHaveBeenNthCalledWith(6, 67, 1000);

      // Total: 3 sequential + 3 simultaneous = 6 calls
      expect(composerSynth.playNote).toHaveBeenCalledTimes(6);
    });

    it("plays seventh chord notes in order", async () => {
      const { getByTestId } = render(
        <ChordPreview symbol="Cmaj7" onClose={jest.fn()} rootMidi={60} />,
      );

      // Cmaj7: C4 (60), E4 (64), G4 (67), B4 (71)
      await act(async () => {
        fireEvent.press(getByTestId("chord-preview-play"));
        await Promise.resolve();
      });

      // Advance through all 4 sequential quarter notes (500ms each)
      for (let i = 0; i < 4; i++) {
        await act(async () => {
          jest.advanceTimersByTime(500);
          await Promise.resolve();
        });
      }

      // Four sequential notes + four simultaneous = 8 calls
      expect(composerSynth.playNote).toHaveBeenCalledTimes(8);
    });

    it("disables play button while playing", async () => {
      const { getByTestId } = render(
        <ChordPreview symbol="C" onClose={jest.fn()} />,
      );

      const playButton = getByTestId("chord-preview-play");

      await act(async () => {
        fireEvent.press(playButton);
        await Promise.resolve();
      });

      // Button should be disabled during playback
      expect(playButton.props.accessibilityLabel).toBe("Playing chord");

      // Complete playback (3 quarter notes = 1500ms + 1 half note = 1000ms)
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          jest.advanceTimersByTime(500);
          await Promise.resolve();
        });
      }
      await act(async () => {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(playButton.props.accessibilityLabel).toBe("Play chord");
      });
    });
  });
});
