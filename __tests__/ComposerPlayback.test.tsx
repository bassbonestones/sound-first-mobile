/**
 * Composer Playback Tests
 *
 * Tests for useComposerPlayback hook and ComposerTransport component.
 */

import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { renderHook } from "@testing-library/react-native";

import { useComposerPlayback } from "../src/features/composer/hooks/useComposerPlayback";
import { ComposerTransport } from "../src/features/composer/components";
import type { ComposerScore } from "../src/features/composer/types";
import {
  createNote,
  createMeasure,
  createScore,
} from "../src/features/composer/types";

// =============================================================================
// Test Data
// =============================================================================

function createTestScore(measureCount: number = 2): ComposerScore {
  const measures = Array.from({ length: measureCount }, (_, i) =>
    createMeasure([
      createNote(60 + i, 1), // Quarter note C
      createNote(62 + i, 1), // Quarter note D
      createNote(64 + i, 2), // Half note E
    ]),
  );
  return createScore({ measures, tempo: 120 });
}

// =============================================================================
// useComposerPlayback Tests
// =============================================================================

describe("useComposerPlayback", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Initial State", () => {
    it("should start in stopped state", () => {
      const score = createTestScore();
      const { result } = renderHook(() => useComposerPlayback(score));

      expect(result.current.playback.state).toBe("stopped");
    });

    it("should start at position 0,0", () => {
      const score = createTestScore();
      const { result } = renderHook(() => useComposerPlayback(score));

      expect(result.current.playback.position.measureIndex).toBe(0);
      expect(result.current.playback.position.noteIndex).toBe(0);
    });

    it("should use score tempo", () => {
      const score = createTestScore();
      score.tempo = 80;
      const { result } = renderHook(() => useComposerPlayback(score));

      expect(result.current.playback.tempo).toBe(80);
    });

    it("should be at start initially", () => {
      const score = createTestScore();
      const { result } = renderHook(() => useComposerPlayback(score));

      expect(result.current.playback.isAtStart).toBe(true);
    });

    it("should not be at end initially", () => {
      const score = createTestScore();
      const { result } = renderHook(() => useComposerPlayback(score));

      expect(result.current.playback.isAtEnd).toBe(false);
    });
  });

  describe("Play/Pause/Stop", () => {
    it("should transition to playing on play", () => {
      const score = createTestScore();
      const { result } = renderHook(() => useComposerPlayback(score));

      act(() => {
        result.current.actions.play();
      });

      expect(result.current.playback.state).toBe("playing");
    });

    it("should transition to paused on pause", () => {
      const score = createTestScore();
      const { result } = renderHook(() => useComposerPlayback(score));

      act(() => {
        result.current.actions.play();
      });
      act(() => {
        result.current.actions.pause();
      });

      expect(result.current.playback.state).toBe("paused");
    });

    it("should transition to stopped and reset position on stop", () => {
      const score = createTestScore();
      const { result } = renderHook(() => useComposerPlayback(score));

      act(() => {
        result.current.actions.play();
      });
      act(() => {
        result.current.actions.stop();
      });

      expect(result.current.playback.state).toBe("stopped");
      expect(result.current.playback.position.measureIndex).toBe(0);
      expect(result.current.playback.position.noteIndex).toBe(0);
    });

    it("should stop at specific position", () => {
      const score = createTestScore();
      const { result } = renderHook(() => useComposerPlayback(score));

      act(() => {
        result.current.actions.play();
      });
      act(() => {
        result.current.actions.stopAt({
          measureIndex: 1,
          beat: 1,
          noteIndex: 1,
        });
      });

      expect(result.current.playback.state).toBe("stopped");
      expect(result.current.playback.position.measureIndex).toBe(1);
      expect(result.current.playback.position.noteIndex).toBe(1);
    });
  });

  describe("Play From Cursor", () => {
    it("should start from specified position", () => {
      const score = createTestScore();
      const { result } = renderHook(() => useComposerPlayback(score));

      act(() => {
        result.current.actions.playFromCursor(1, 2);
      });

      expect(result.current.playback.state).toBe("playing");
      expect(result.current.playback.position.measureIndex).toBe(1);
      expect(result.current.playback.position.noteIndex).toBe(2);
    });
  });

  describe("Tempo", () => {
    it("should allow setting tempo", () => {
      const score = createTestScore();
      const { result } = renderHook(() => useComposerPlayback(score));

      act(() => {
        result.current.actions.setTempo(80);
      });

      expect(result.current.playback.tempo).toBe(80);
    });

    it("should clamp tempo to valid range", () => {
      const score = createTestScore();
      const { result } = renderHook(() => useComposerPlayback(score));

      act(() => {
        result.current.actions.setTempo(10); // Below min
      });
      expect(result.current.playback.tempo).toBe(20);

      act(() => {
        result.current.actions.setTempo(500); // Above max
      });
      expect(result.current.playback.tempo).toBe(300);
    });
  });
});

// =============================================================================
// ComposerTransport Tests
// =============================================================================

describe("ComposerTransport", () => {
  const defaultProps = {
    state: "stopped" as const,
    position: { measureIndex: 0, beat: 0, noteIndex: 0 },
    tempo: 120,
    totalMeasures: 4,
    onPlay: jest.fn(),
    onPause: jest.fn(),
    onStop: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render position display", () => {
      const { getByText } = render(<ComposerTransport {...defaultProps} />);

      expect(getByText("Position")).toBeTruthy();
      expect(getByText("1 / 4")).toBeTruthy();
    });

    it("should render tempo display", () => {
      const { getByText } = render(
        <ComposerTransport {...defaultProps} tempo={80} />,
      );

      expect(getByText("Tempo")).toBeTruthy();
      expect(getByText("80 BPM")).toBeTruthy();
    });

    it("should render play button when stopped", () => {
      const { getByTestId, getByLabelText } = render(
        <ComposerTransport {...defaultProps} state="stopped" />,
      );

      expect(getByTestId("transport-play")).toBeTruthy();
      expect(getByLabelText("Play")).toBeTruthy();
    });

    it("should render pause button when playing", () => {
      const { getByLabelText } = render(
        <ComposerTransport {...defaultProps} state="playing" />,
      );

      expect(getByLabelText("Pause")).toBeTruthy();
    });
  });

  describe("Play/Pause", () => {
    it("should call onPlay when play pressed while stopped", () => {
      const onPlay = jest.fn();
      const { getByTestId } = render(
        <ComposerTransport {...defaultProps} state="stopped" onPlay={onPlay} />,
      );

      fireEvent.press(getByTestId("transport-play"));
      expect(onPlay).toHaveBeenCalled();
    });

    it("should call onPause when pause pressed while playing", () => {
      const onPause = jest.fn();
      const { getByTestId } = render(
        <ComposerTransport
          {...defaultProps}
          state="playing"
          onPause={onPause}
        />,
      );

      fireEvent.press(getByTestId("transport-play"));
      expect(onPause).toHaveBeenCalled();
    });

    it("should call onPlay when play pressed while paused", () => {
      const onPlay = jest.fn();
      const { getByTestId } = render(
        <ComposerTransport {...defaultProps} state="paused" onPlay={onPlay} />,
      );

      fireEvent.press(getByTestId("transport-play"));
      expect(onPlay).toHaveBeenCalled();
    });
  });

  describe("Stop", () => {
    it("should call onStop when stop pressed", () => {
      const onStop = jest.fn();
      const { getByTestId } = render(
        <ComposerTransport {...defaultProps} state="playing" onStop={onStop} />,
      );

      fireEvent.press(getByTestId("transport-stop"));
      expect(onStop).toHaveBeenCalled();
    });

    it("should not call onStop when already stopped", () => {
      const onStop = jest.fn();
      const { getByTestId } = render(
        <ComposerTransport {...defaultProps} state="stopped" onStop={onStop} />,
      );

      fireEvent.press(getByTestId("transport-stop"));
      expect(onStop).not.toHaveBeenCalled();
    });
  });

  describe("Optional Buttons", () => {
    it("should render play measure button when callback provided", () => {
      const onPlayMeasure = jest.fn();
      const { getByTestId } = render(
        <ComposerTransport {...defaultProps} onPlayMeasure={onPlayMeasure} />,
      );

      expect(getByTestId("transport-play-measure")).toBeTruthy();
    });

    it("should not render play measure button when callback not provided", () => {
      const { queryByTestId } = render(<ComposerTransport {...defaultProps} />);

      expect(queryByTestId("transport-play-measure")).toBeNull();
    });

    it("should call onPlayMeasure when pressed", () => {
      const onPlayMeasure = jest.fn();
      const { getByTestId } = render(
        <ComposerTransport {...defaultProps} onPlayMeasure={onPlayMeasure} />,
      );

      fireEvent.press(getByTestId("transport-play-measure"));
      expect(onPlayMeasure).toHaveBeenCalled();
    });
  });

  describe("Disabled State", () => {
    it("should not call any handlers when disabled", () => {
      const onPlay = jest.fn();
      const onStop = jest.fn();
      const { getByTestId } = render(
        <ComposerTransport
          {...defaultProps}
          state="playing"
          onPlay={onPlay}
          onStop={onStop}
          disabled
        />,
      );

      fireEvent.press(getByTestId("transport-play"));
      fireEvent.press(getByTestId("transport-stop"));

      expect(onPlay).not.toHaveBeenCalled();
      expect(onStop).not.toHaveBeenCalled();
    });
  });

  describe("Position Updates", () => {
    it("should display current measure position", () => {
      const { getByText } = render(
        <ComposerTransport
          {...defaultProps}
          position={{ measureIndex: 2, beat: 0, noteIndex: 0 }}
          totalMeasures={8}
        />,
      );

      expect(getByText("3 / 8")).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("should have accessible labels", () => {
      const { getByLabelText } = render(
        <ComposerTransport {...defaultProps} state="stopped" />,
      );

      expect(getByLabelText("Play")).toBeTruthy();
      expect(getByLabelText("Stop playback")).toBeTruthy();
    });
  });
});
