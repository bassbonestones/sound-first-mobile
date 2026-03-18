/**
 * useCorrection Hook Tests
 */

import { renderHook, act } from "@testing-library/react-native";

import { useCorrection } from "../src/features/importMusic/hooks/useCorrection";
import type { UncertainMeasure } from "../src/types/import";

// ============================================================================
// Test Data
// ============================================================================

const createMockUncertainMeasures = (count: number): UncertainMeasure[] =>
  Array.from({ length: count }, (_, i) => ({
    measureNumber: i + 1,
    partIndex: 0,
    confidence: 0.5 + Math.random() * 0.3,
    reason: `Issue in measure ${i + 1}`,
  }));

// ============================================================================
// Tests
// ============================================================================

describe("useCorrection", () => {
  describe("Initialization", () => {
    it("initializes with empty measures", () => {
      const { result } = renderHook(() =>
        useCorrection({ uncertainMeasures: [] }),
      );

      expect(result.current.measures).toHaveLength(0);
    });

    it("converts uncertain measures to correction measures", () => {
      const uncertainMeasures = createMockUncertainMeasures(3);
      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      expect(result.current.measures).toHaveLength(3);
      expect(result.current.measures[0].status).toBe("pending");
      expect(result.current.measures[0].measureNumber).toBe(1);
    });

    it("starts with no selected measure", () => {
      const uncertainMeasures = createMockUncertainMeasures(2);
      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      expect(result.current.selectedMeasure).toBeNull();
    });

    it("calculates initial progress correctly", () => {
      const uncertainMeasures = createMockUncertainMeasures(5);
      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      expect(result.current.progress).toEqual({
        total: 5,
        reviewed: 0,
        approved: 0,
        edited: 0,
        skipped: 0,
        percentComplete: 0,
      });
    });

    it("reports not complete when measures pending", () => {
      const uncertainMeasures = createMockUncertainMeasures(3);
      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      expect(result.current.isComplete).toBe(false);
    });

    it("reports complete when no measures", () => {
      const { result } = renderHook(() =>
        useCorrection({ uncertainMeasures: [] }),
      );

      expect(result.current.isComplete).toBe(true);
    });
  });

  describe("Approve Action", () => {
    it("marks measure as approved", () => {
      const uncertainMeasures = createMockUncertainMeasures(2);
      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      act(() => {
        result.current.approve(1, 0);
      });

      const measure = result.current.measures.find(
        (m) => m.measureNumber === 1 && m.partIndex === 0,
      );
      expect(measure?.status).toBe("approved");
    });

    it("sets reviewedAt timestamp", () => {
      const uncertainMeasures = createMockUncertainMeasures(1);
      const before = Date.now();

      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      act(() => {
        result.current.approve(1, 0);
      });

      const after = Date.now();
      const measure = result.current.measures[0];
      expect(measure.reviewedAt).toBeGreaterThanOrEqual(before);
      expect(measure.reviewedAt).toBeLessThanOrEqual(after);
    });

    it("updates progress", () => {
      const uncertainMeasures = createMockUncertainMeasures(4);
      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      act(() => {
        result.current.approve(1, 0);
        result.current.approve(2, 0);
      });

      expect(result.current.progress.reviewed).toBe(2);
      expect(result.current.progress.approved).toBe(2);
      expect(result.current.progress.percentComplete).toBe(50);
    });

    it("calls onMeasureUpdate callback", () => {
      const onMeasureUpdate = jest.fn();
      const uncertainMeasures = createMockUncertainMeasures(1);
      const { result } = renderHook(() =>
        useCorrection({ uncertainMeasures, onMeasureUpdate }),
      );

      act(() => {
        result.current.approve(1, 0);
      });

      expect(onMeasureUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: "approved" }),
      );
    });

    it("handles approve for non-existent measure without callback", () => {
      const onMeasureUpdate = jest.fn();
      const uncertainMeasures = createMockUncertainMeasures(1);
      const { result } = renderHook(() =>
        useCorrection({ uncertainMeasures, onMeasureUpdate }),
      );

      // Approve a measure that doesn't exist - should not call onMeasureUpdate
      act(() => {
        result.current.approve(999, 0);
      });

      expect(onMeasureUpdate).not.toHaveBeenCalled();
    });
  });

  describe("Skip Action", () => {
    it("marks measure as skipped", () => {
      const uncertainMeasures = createMockUncertainMeasures(2);
      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      act(() => {
        result.current.skip(1, 0);
      });

      const measure = result.current.measures.find(
        (m) => m.measureNumber === 1,
      );
      expect(measure?.status).toBe("skipped");
    });

    it("updates progress skipped count", () => {
      const uncertainMeasures = createMockUncertainMeasures(3);
      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      act(() => {
        result.current.skip(1, 0);
      });

      expect(result.current.progress.skipped).toBe(1);
      expect(result.current.progress.reviewed).toBe(1);
    });

    it("calls onMeasureUpdate callback on skip", () => {
      const onMeasureUpdate = jest.fn();
      const uncertainMeasures = createMockUncertainMeasures(1);
      const { result } = renderHook(() =>
        useCorrection({ uncertainMeasures, onMeasureUpdate }),
      );

      act(() => {
        result.current.skip(1, 0);
      });

      expect(onMeasureUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: "skipped" }),
      );
    });

    it("handles skip for non-existent measure without callback", () => {
      const onMeasureUpdate = jest.fn();
      const uncertainMeasures = createMockUncertainMeasures(1);
      const { result } = renderHook(() =>
        useCorrection({ uncertainMeasures, onMeasureUpdate }),
      );

      // Skip a measure that doesn't exist - should not call onMeasureUpdate
      act(() => {
        result.current.skip(999, 0);
      });

      expect(onMeasureUpdate).not.toHaveBeenCalled();
    });
  });

  describe("Edit Action", () => {
    it("marks measure as edited", () => {
      const uncertainMeasures = createMockUncertainMeasures(2);
      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      act(() => {
        result.current.edit(1, 0, { notes: "Test note" });
      });

      const measure = result.current.measures.find(
        (m) => m.measureNumber === 1,
      );
      expect(measure?.status).toBe("edited");
    });

    it("stores notes on measure", () => {
      const uncertainMeasures = createMockUncertainMeasures(1);
      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      act(() => {
        result.current.edit(1, 0, { notes: "Changed rest to note" });
      });

      const measure = result.current.measures[0];
      expect(measure.notes).toBe("Changed rest to note");
    });

    it("clears selection after edit", () => {
      const uncertainMeasures = createMockUncertainMeasures(2);
      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      act(() => {
        result.current.selectMeasure(1, 0);
      });

      expect(result.current.selectedMeasure).not.toBeNull();

      act(() => {
        result.current.edit(1, 0, { notes: "Edit" });
      });

      expect(result.current.selectedMeasure).toBeNull();
    });

    it("updates progress edited count", () => {
      const uncertainMeasures = createMockUncertainMeasures(3);
      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      act(() => {
        result.current.edit(1, 0, {});
        result.current.edit(2, 0, {});
      });

      expect(result.current.progress.edited).toBe(2);
    });

    it("calls onMeasureUpdate callback on edit", () => {
      const onMeasureUpdate = jest.fn();
      const uncertainMeasures = createMockUncertainMeasures(1);
      const { result } = renderHook(() =>
        useCorrection({ uncertainMeasures, onMeasureUpdate }),
      );

      act(() => {
        result.current.edit(1, 0, { notes: "Edited notes" });
      });

      expect(onMeasureUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: "edited", notes: "Edited notes" }),
      );
    });

    it("handles edit for non-existent measure without callback", () => {
      const onMeasureUpdate = jest.fn();
      const uncertainMeasures = createMockUncertainMeasures(1);
      const { result } = renderHook(() =>
        useCorrection({ uncertainMeasures, onMeasureUpdate }),
      );

      // Edit a measure that doesn't exist - should not call onMeasureUpdate
      act(() => {
        result.current.edit(999, 0, { notes: "Test" });
      });

      expect(onMeasureUpdate).not.toHaveBeenCalled();
    });
  });

  describe("Approve All Action", () => {
    it("approves all pending measures", () => {
      const uncertainMeasures = createMockUncertainMeasures(3);
      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      act(() => {
        result.current.approveAll();
      });

      expect(
        result.current.measures.every((m) => m.status === "approved"),
      ).toBe(true);
    });

    it("does not change already reviewed measures", () => {
      const uncertainMeasures = createMockUncertainMeasures(3);
      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      act(() => {
        result.current.skip(1, 0);
        result.current.edit(2, 0, { notes: "edited" });
      });

      act(() => {
        result.current.approveAll();
      });

      const measure1 = result.current.measures.find(
        (m) => m.measureNumber === 1,
      );
      const measure2 = result.current.measures.find(
        (m) => m.measureNumber === 2,
      );
      const measure3 = result.current.measures.find(
        (m) => m.measureNumber === 3,
      );

      expect(measure1?.status).toBe("skipped");
      expect(measure2?.status).toBe("edited");
      expect(measure3?.status).toBe("approved");
    });

    it("sets isComplete to true", () => {
      const uncertainMeasures = createMockUncertainMeasures(3);
      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      act(() => {
        result.current.approveAll();
      });

      expect(result.current.isComplete).toBe(true);
    });
  });

  describe("Reset Action", () => {
    it("resets measure back to pending", () => {
      const uncertainMeasures = createMockUncertainMeasures(1);
      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      act(() => {
        result.current.approve(1, 0);
      });

      expect(result.current.measures[0].status).toBe("approved");

      act(() => {
        result.current.reset(1, 0);
      });

      expect(result.current.measures[0].status).toBe("pending");
    });

    it("clears notes on reset", () => {
      const uncertainMeasures = createMockUncertainMeasures(1);
      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      act(() => {
        result.current.edit(1, 0, { notes: "Some note" });
      });

      act(() => {
        result.current.reset(1, 0);
      });

      expect(result.current.measures[0].notes).toBeUndefined();
    });

    it("clears reviewedAt on reset", () => {
      const uncertainMeasures = createMockUncertainMeasures(1);
      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      act(() => {
        result.current.approve(1, 0);
      });

      expect(result.current.measures[0].reviewedAt).toBeDefined();

      act(() => {
        result.current.reset(1, 0);
      });

      expect(result.current.measures[0].reviewedAt).toBeUndefined();
    });
  });

  describe("Selection", () => {
    it("selects a measure", () => {
      const uncertainMeasures = createMockUncertainMeasures(3);
      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      act(() => {
        result.current.selectMeasure(2, 0);
      });

      expect(result.current.selectedMeasure?.measureNumber).toBe(2);
    });

    it("clears selection", () => {
      const uncertainMeasures = createMockUncertainMeasures(2);
      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      act(() => {
        result.current.selectMeasure(1, 0);
      });

      expect(result.current.selectedMeasure).not.toBeNull();

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedMeasure).toBeNull();
    });

    it("changes selection to different measure", () => {
      const uncertainMeasures = createMockUncertainMeasures(3);
      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      act(() => {
        result.current.selectMeasure(1, 0);
      });

      expect(result.current.selectedMeasure?.measureNumber).toBe(1);

      act(() => {
        result.current.selectMeasure(3, 0);
      });

      expect(result.current.selectedMeasure?.measureNumber).toBe(3);
    });
  });

  describe("Complete Action", () => {
    it("calls onComplete with all measures", () => {
      const onComplete = jest.fn();
      const uncertainMeasures = createMockUncertainMeasures(2);
      const { result } = renderHook(() =>
        useCorrection({ uncertainMeasures, onComplete }),
      );

      act(() => {
        result.current.approveAll();
      });

      act(() => {
        result.current.complete();
      });

      expect(onComplete).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ measureNumber: 1, status: "approved" }),
          expect.objectContaining({ measureNumber: 2, status: "approved" }),
        ]),
      );
    });
  });

  describe("Multiple Part Indices", () => {
    it("handles measures with different part indices", () => {
      const uncertainMeasures: UncertainMeasure[] = [
        { measureNumber: 1, partIndex: 0, confidence: 0.6, reason: "Test" },
        { measureNumber: 1, partIndex: 1, confidence: 0.5, reason: "Test" },
      ];
      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      act(() => {
        result.current.approve(1, 0);
      });

      const measure1Part0 = result.current.measures.find(
        (m) => m.measureNumber === 1 && m.partIndex === 0,
      );
      const measure1Part1 = result.current.measures.find(
        (m) => m.measureNumber === 1 && m.partIndex === 1,
      );

      expect(measure1Part0?.status).toBe("approved");
      expect(measure1Part1?.status).toBe("pending");
    });

    it("selects correct measure with part index", () => {
      const uncertainMeasures: UncertainMeasure[] = [
        { measureNumber: 1, partIndex: 0, confidence: 0.6, reason: "Test" },
        { measureNumber: 1, partIndex: 1, confidence: 0.5, reason: "Test" },
      ];
      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      act(() => {
        result.current.selectMeasure(1, 1);
      });

      expect(result.current.selectedMeasure?.partIndex).toBe(1);
    });
  });

  describe("Progress Percentage", () => {
    it("calculates 100% when all reviewed", () => {
      const uncertainMeasures = createMockUncertainMeasures(2);
      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      act(() => {
        result.current.approve(1, 0);
        result.current.skip(2, 0);
      });

      expect(result.current.progress.percentComplete).toBe(100);
    });

    it("rounds percentage to nearest integer", () => {
      const uncertainMeasures = createMockUncertainMeasures(3);
      const { result } = renderHook(() => useCorrection({ uncertainMeasures }));

      act(() => {
        result.current.approve(1, 0);
      });

      // 1/3 ≈ 33.33%, should round to 33%
      expect(result.current.progress.percentComplete).toBe(33);
    });
  });
});
