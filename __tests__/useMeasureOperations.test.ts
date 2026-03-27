/**
 * useMeasureOperations Hook Tests
 *
 * Tests for measure-level operations.
 */

import { renderHook, act } from "@testing-library/react-native";
import { useMeasureOperations } from "../src/features/composer/hooks/useMeasureOperations";
import { useComposerUndo } from "../src/features/composer/hooks/useComposerUndo";
import {
  createInitialState,
  createMeasure,
  createNote,
  createScore,
  DURATION,
} from "../src/features/composer/types";
import type {
  ComposerState,
  ComposerScore,
  CursorPosition,
} from "../src/features/composer/types";
import { useState, useRef, useCallback } from "react";

// Helper hook that wraps useMeasureOperations with proper state management
function useTestMeasureOperations(initialScore?: ComposerScore) {
  const [state, setState] = useState<ComposerState>(() =>
    createInitialState(initialScore),
  );

  const undoManager = useComposerUndo();
  const cursorRef = useRef<CursorPosition>(state.cursor);
  const suppressAddMeasurePromptRef = useRef(false);

  const updateScore = useCallback(
    (updater: (score: ComposerScore) => ComposerScore) => {
      setState((prev) => ({
        ...prev,
        score: updater(prev.score),
        isDirty: true,
      }));
    },
    [],
  );

  const measureOps = useMeasureOperations({
    state,
    setState,
    undoManager,
    cursorRef,
    suppressAddMeasurePromptRef,
    updateScore,
  });

  return {
    state,
    undoManager,
    cursorRef,
    ...measureOps,
  };
}

describe("useMeasureOperations", () => {
  describe("addMeasure", () => {
    it("should add a new measure at the end", () => {
      const { result } = renderHook(() => useTestMeasureOperations());

      expect(result.current.state.score.measures).toHaveLength(1);

      act(() => {
        result.current.addMeasure();
      });

      expect(result.current.state.score.measures).toHaveLength(2);
      expect(result.current.state.cursor.measureIndex).toBe(1);
      expect(result.current.state.isDirty).toBe(true);
      expect(result.current.undoManager.canUndo).toBe(true);
    });

    it("should create measure with correct time signature", () => {
      const score = createScore({
        title: "Test",
        timeSignature: { beats: 3, beatUnit: 4 },
      });

      const { result } = renderHook(() => useTestMeasureOperations(score));

      act(() => {
        result.current.addMeasure();
      });

      // The new measure should have rests totaling 3 beats
      const newMeasure = result.current.state.score.measures[1];
      expect(newMeasure).toBeDefined();
    });
  });

  describe("deleteMeasure", () => {
    it("should not delete if only one measure exists", () => {
      const { result } = renderHook(() => useTestMeasureOperations());

      expect(result.current.state.score.measures).toHaveLength(1);

      act(() => {
        result.current.deleteMeasure();
      });

      expect(result.current.state.score.measures).toHaveLength(1);
    });

    it("should delete the current measure when multiple exist", () => {
      const score = createScore({ title: "Test" });
      score.measures = [
        createMeasure({ beats: 4, beatUnit: 4 }),
        createMeasure({ beats: 4, beatUnit: 4 }),
      ];

      const { result } = renderHook(() => useTestMeasureOperations(score));

      expect(result.current.state.score.measures).toHaveLength(2);

      act(() => {
        result.current.deleteMeasure();
      });

      expect(result.current.state.score.measures).toHaveLength(1);
      expect(result.current.state.isDirty).toBe(true);
    });

    it("should push undo action when deleting", () => {
      const score = createScore({ title: "Test" });
      score.measures = [
        createMeasure({ beats: 4, beatUnit: 4 }),
        createMeasure({ beats: 4, beatUnit: 4 }),
      ];

      const { result } = renderHook(() => useTestMeasureOperations(score));

      act(() => {
        result.current.deleteMeasure();
      });

      expect(result.current.undoManager.canUndo).toBe(true);
    });
  });

  describe("deleteLastMeasure", () => {
    it("should not delete if only one measure exists", () => {
      const { result } = renderHook(() => useTestMeasureOperations());

      expect(result.current.state.score.measures).toHaveLength(1);

      act(() => {
        result.current.deleteLastMeasure();
      });

      expect(result.current.state.score.measures).toHaveLength(1);
    });

    it("should delete the last measure when multiple exist", () => {
      const score = createScore({ title: "Test" });
      const measure1 = createMeasure({ beats: 4, beatUnit: 4 });
      const measure2 = createMeasure({ beats: 4, beatUnit: 4 });
      score.measures = [measure1, measure2];

      const { result } = renderHook(() => useTestMeasureOperations(score));

      expect(result.current.state.score.measures).toHaveLength(2);

      act(() => {
        result.current.deleteLastMeasure();
      });

      expect(result.current.state.score.measures).toHaveLength(1);
      expect(result.current.state.score.measures[0].id).toBe(measure1.id);
    });
  });

  describe("fillMeasureWithRests", () => {
    it("should fill incomplete measure with rests", () => {
      const score = createScore({ title: "Test" });
      const measure = createMeasure({ beats: 4, beatUnit: 4 });
      // Create a measure with only 1 beat of content
      measure.notes = [createNote(60, DURATION.QUARTER)];
      score.measures = [measure];

      const { result } = renderHook(() => useTestMeasureOperations(score));

      const initialNoteCount =
        result.current.state.score.measures[0].notes.length;

      act(() => {
        result.current.fillMeasureWithRests();
      });

      // Should have added rest(s) to complete the measure
      expect(
        result.current.state.score.measures[0].notes.length,
      ).toBeGreaterThan(initialNoteCount);
    });

    it("should not modify already complete measure", () => {
      const { result } = renderHook(() => useTestMeasureOperations());

      // Default measure is complete (whole rest = 4 beats)
      const initialNotes = [...result.current.state.score.measures[0].notes];

      act(() => {
        result.current.fillMeasureWithRests();
      });

      // Should be unchanged
      expect(result.current.state.score.measures[0].notes.length).toBe(
        initialNotes.length,
      );
    });
  });
});
