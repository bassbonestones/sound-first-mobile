/**
 * useScoreSettings Hook Tests
 *
 * Tests for score-level settings management.
 */

import { renderHook, act } from "@testing-library/react-native";
import { useScoreSettings } from "../src/features/composer/hooks/useScoreSettings";
import { useComposerUndo } from "../src/features/composer/hooks/useComposerUndo";
import {
  createInitialState,
  createMeasure,
  createNote,
  createScore,
  DURATION,
  DEFAULT_OCTAVE_MIDI,
} from "../src/features/composer/types";
import type {
  ComposerState,
  ComposerScore,
} from "../src/features/composer/types";
import { useState } from "react";

// Helper hook that wraps useScoreSettings with proper state management
function useTestScoreSettings(initialScore?: ComposerScore) {
  const [state, setState] = useState<ComposerState>(() =>
    createInitialState(initialScore),
  );

  const undoManager = useComposerUndo();

  const scoreSettings = useScoreSettings({
    state,
    setState,
    undoManager,
  });

  return {
    state,
    undoManager,
    ...scoreSettings,
  };
}

describe("useScoreSettings", () => {
  describe("setClef", () => {
    it("should change clef and update default octave", () => {
      const { result } = renderHook(() => useTestScoreSettings());

      expect(result.current.state.score.clef).toBe("treble");

      act(() => {
        result.current.setClef("bass");
      });

      expect(result.current.state.score.clef).toBe("bass");
      expect(result.current.state.selectedOctave).toBe(
        DEFAULT_OCTAVE_MIDI.bass,
      );
      expect(result.current.state.isDirty).toBe(true);
    });

    it("should not update if clef is unchanged", () => {
      const { result } = renderHook(() => useTestScoreSettings());

      act(() => {
        result.current.setClef("treble"); // Same as current
      });

      // No undo action should be pushed
      expect(result.current.undoManager.canUndo).toBe(false);
    });

    it("should push undo action when changing clef", () => {
      const { result } = renderHook(() => useTestScoreSettings());

      act(() => {
        result.current.setClef("bass");
      });

      expect(result.current.undoManager.canUndo).toBe(true);
    });
  });

  describe("setClefWithTransposition", () => {
    it("should transpose notes when changing clef", () => {
      // Create score with a pitched note
      const score = createScore({ title: "Test" });
      const measure = createMeasure({ beats: 4, beatUnit: 4 });
      measure.notes = [createNote(60, DURATION.QUARTER)]; // Middle C
      score.measures = [measure];

      const { result } = renderHook(() => useTestScoreSettings(score));

      act(() => {
        result.current.setClefWithTransposition("bass", -1); // Down 1 octave
      });

      expect(result.current.state.score.clef).toBe("bass");
      expect(result.current.state.score.measures[0].notes[0].midi).toBe(48); // C3
    });
  });

  describe("setKeySignature", () => {
    it("should change key signature", () => {
      const { result } = renderHook(() => useTestScoreSettings());

      // Default is 0 (C Major)
      expect(result.current.state.score.keySignature).toBe(0);

      act(() => {
        result.current.setKeySignature(1); // G Major (1 sharp)
      });

      expect(result.current.state.score.keySignature).toBe(1);
      expect(result.current.state.isDirty).toBe(true);
      expect(result.current.undoManager.canUndo).toBe(true);
    });
  });

  describe("setTimeSignature", () => {
    it("should change time signature when no notes exist", () => {
      const { result } = renderHook(() => useTestScoreSettings());

      let success: boolean = false;
      act(() => {
        success = result.current.setTimeSignature({ beats: 3, beatUnit: 4 });
      });

      expect(success).toBe(true);
      expect(result.current.state.score.timeSignature).toEqual({
        beats: 3,
        beatUnit: 4,
      });
    });

    it("should fail when notes exist", () => {
      // Create score with a pitched note
      const score = createScore({ title: "Test" });
      const measure = createMeasure({ beats: 4, beatUnit: 4 });
      measure.notes = [createNote(60, DURATION.QUARTER)];
      score.measures = [measure];

      const { result } = renderHook(() => useTestScoreSettings(score));

      let success: boolean = true;
      act(() => {
        success = result.current.setTimeSignature({ beats: 3, beatUnit: 4 });
      });

      expect(success).toBe(false);
      expect(result.current.state.score.timeSignature).toEqual({
        beats: 4,
        beatUnit: 4,
      });
    });
  });

  describe("setTempo", () => {
    it("should change tempo", () => {
      const { result } = renderHook(() => useTestScoreSettings());

      act(() => {
        result.current.setTempo(80);
      });

      expect(result.current.state.score.tempo).toBe(80);
      expect(result.current.state.isDirty).toBe(true);
    });
  });

  describe("setTitle", () => {
    it("should change title", () => {
      const { result } = renderHook(() => useTestScoreSettings());

      act(() => {
        result.current.setTitle("My Song");
      });

      expect(result.current.state.score.title).toBe("My Song");
      expect(result.current.state.isDirty).toBe(true);
    });
  });

  describe("hasActualNotes", () => {
    it("should return false for empty score", () => {
      const { result } = renderHook(() => useTestScoreSettings());

      expect(result.current.hasActualNotes()).toBe(false);
    });

    it("should return true when pitched notes exist", () => {
      const score = createScore({ title: "Test" });
      const measure = createMeasure({ beats: 4, beatUnit: 4 });
      measure.notes = [createNote(60, DURATION.QUARTER)];
      score.measures = [measure];

      const { result } = renderHook(() => useTestScoreSettings(score));

      expect(result.current.hasActualNotes()).toBe(true);
    });
  });
});
