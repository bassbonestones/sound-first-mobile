/**
 * useCorrection Hook
 *
 * Manages state for the measure correction workflow.
 * Tracks pending, approved, edited, and skipped measures.
 */

import { useCallback, useMemo, useReducer } from "react";
import type {
  CorrectionMeasure,
  CorrectionProgress,
  CorrectionAction,
  MeasureEdit,
} from "../types/correctionTypes";
import type { UncertainMeasure } from "../../../types/import";

// ============================================================================
// Types
// ============================================================================

export interface UseCorrectionOptions {
  /** Initial uncertain measures from OMR */
  readonly uncertainMeasures: readonly UncertainMeasure[];
  /** Callback when correction is complete */
  readonly onComplete?: (measures: CorrectionMeasure[]) => void;
  /** Callback when a measure is updated */
  readonly onMeasureUpdate?: (measure: CorrectionMeasure) => void;
}

export interface UseCorrectionResult {
  /** All correction measures with current state */
  readonly measures: CorrectionMeasure[];
  /** Current progress through the workflow */
  readonly progress: CorrectionProgress;
  /** Currently selected measure (for editing) */
  readonly selectedMeasure: CorrectionMeasure | null;
  /** Whether all measures have been reviewed */
  readonly isComplete: boolean;
  /** Approve a measure as-is */
  readonly approve: (measureNumber: number, partIndex: number) => void;
  /** Edit a measure */
  readonly edit: (
    measureNumber: number,
    partIndex: number,
    changes: MeasureEdit,
  ) => void;
  /** Skip a measure */
  readonly skip: (measureNumber: number, partIndex: number) => void;
  /** Approve all remaining pending measures */
  readonly approveAll: () => void;
  /** Reset a measure back to pending */
  readonly reset: (measureNumber: number, partIndex: number) => void;
  /** Select a measure for viewing/editing */
  readonly selectMeasure: (measureNumber: number, partIndex: number) => void;
  /** Clear the selected measure */
  readonly clearSelection: () => void;
  /** Complete the correction session */
  readonly complete: () => void;
}

// ============================================================================
// State & Reducer
// ============================================================================

interface CorrectionState {
  readonly measures: CorrectionMeasure[];
  readonly selectedMeasureKey: string | null;
}

type CorrectionReducerAction =
  | CorrectionAction
  | { type: "select"; measureNumber: number; partIndex: number }
  | { type: "clearSelection" }
  | { type: "initialize"; measures: CorrectionMeasure[] };

function getMeasureKey(measureNumber: number, partIndex: number): string {
  return `${measureNumber}-${partIndex}`;
}

function correctionReducer(
  state: CorrectionState,
  action: CorrectionReducerAction,
): CorrectionState {
  switch (action.type) {
    case "initialize":
      return {
        measures: action.measures,
        selectedMeasureKey: null,
      };

    case "approve": {
      const key = getMeasureKey(action.measureNumber, action.partIndex);
      return {
        ...state,
        measures: state.measures.map((m) =>
          getMeasureKey(m.measureNumber, m.partIndex) === key
            ? { ...m, status: "approved" as const, reviewedAt: Date.now() }
            : m,
        ),
      };
    }

    case "edit": {
      const key = getMeasureKey(action.measureNumber, action.partIndex);
      return {
        ...state,
        measures: state.measures.map((m) =>
          getMeasureKey(m.measureNumber, m.partIndex) === key
            ? {
                ...m,
                status: "edited" as const,
                notes: action.changes.notes,
                reviewedAt: Date.now(),
              }
            : m,
        ),
        selectedMeasureKey: null,
      };
    }

    case "skip": {
      const key = getMeasureKey(action.measureNumber, action.partIndex);
      return {
        ...state,
        measures: state.measures.map((m) =>
          getMeasureKey(m.measureNumber, m.partIndex) === key
            ? { ...m, status: "skipped" as const, reviewedAt: Date.now() }
            : m,
        ),
      };
    }

    case "approveAll":
      return {
        ...state,
        measures: state.measures.map((m) =>
          m.status === "pending"
            ? { ...m, status: "approved" as const, reviewedAt: Date.now() }
            : m,
        ),
      };

    case "reset": {
      const key = getMeasureKey(action.measureNumber, action.partIndex);
      return {
        ...state,
        measures: state.measures.map((m) =>
          getMeasureKey(m.measureNumber, m.partIndex) === key
            ? {
                ...m,
                status: "pending" as const,
                notes: undefined,
                reviewedAt: undefined,
              }
            : m,
        ),
      };
    }

    case "select": {
      const key = getMeasureKey(action.measureNumber, action.partIndex);
      return {
        ...state,
        selectedMeasureKey: key,
      };
    }

    case "clearSelection":
      return {
        ...state,
        selectedMeasureKey: null,
      };

    default:
      return state;
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useCorrection({
  uncertainMeasures,
  onComplete,
  onMeasureUpdate,
}: UseCorrectionOptions): UseCorrectionResult {
  // Initialize measures from uncertain measures
  const initialMeasures: CorrectionMeasure[] = useMemo(
    () =>
      uncertainMeasures.map((um) => ({
        measureNumber: um.measureNumber,
        partIndex: um.partIndex,
        confidence: um.confidence,
        reason: um.reason,
        status: "pending" as const,
      })),
    [uncertainMeasures],
  );

  const [state, dispatch] = useReducer(correctionReducer, {
    measures: initialMeasures,
    selectedMeasureKey: null,
  });

  // Calculate progress
  const progress: CorrectionProgress = useMemo(() => {
    const total = state.measures.length;
    const reviewed = state.measures.filter(
      (m) => m.status !== "pending",
    ).length;
    const approved = state.measures.filter(
      (m) => m.status === "approved",
    ).length;
    const edited = state.measures.filter((m) => m.status === "edited").length;
    const skipped = state.measures.filter((m) => m.status === "skipped").length;
    const percentComplete =
      total > 0 ? Math.round((reviewed / total) * 100) : 100;

    return { total, reviewed, approved, edited, skipped, percentComplete };
  }, [state.measures]);

  // Selected measure
  const selectedMeasure = useMemo(() => {
    if (!state.selectedMeasureKey) return null;
    return (
      state.measures.find(
        (m) =>
          getMeasureKey(m.measureNumber, m.partIndex) ===
          state.selectedMeasureKey,
      ) ?? null
    );
  }, [state.measures, state.selectedMeasureKey]);

  // Is complete
  const isComplete = progress.reviewed === progress.total;

  // Actions
  const approve = useCallback(
    (measureNumber: number, partIndex: number) => {
      dispatch({ type: "approve", measureNumber, partIndex });
      if (onMeasureUpdate) {
        const measure = state.measures.find(
          (m) => m.measureNumber === measureNumber && m.partIndex === partIndex,
        );
        if (measure) {
          onMeasureUpdate({ ...measure, status: "approved" });
        }
      }
    },
    [onMeasureUpdate, state.measures],
  );

  const edit = useCallback(
    (measureNumber: number, partIndex: number, changes: MeasureEdit) => {
      dispatch({ type: "edit", measureNumber, partIndex, changes });
      if (onMeasureUpdate) {
        const measure = state.measures.find(
          (m) => m.measureNumber === measureNumber && m.partIndex === partIndex,
        );
        if (measure) {
          onMeasureUpdate({
            ...measure,
            status: "edited",
            notes: changes.notes,
          });
        }
      }
    },
    [onMeasureUpdate, state.measures],
  );

  const skip = useCallback(
    (measureNumber: number, partIndex: number) => {
      dispatch({ type: "skip", measureNumber, partIndex });
      if (onMeasureUpdate) {
        const measure = state.measures.find(
          (m) => m.measureNumber === measureNumber && m.partIndex === partIndex,
        );
        if (measure) {
          onMeasureUpdate({ ...measure, status: "skipped" });
        }
      }
    },
    [onMeasureUpdate, state.measures],
  );

  const approveAll = useCallback(() => {
    dispatch({ type: "approveAll" });
  }, []);

  const reset = useCallback((measureNumber: number, partIndex: number) => {
    dispatch({ type: "reset", measureNumber, partIndex });
  }, []);

  const selectMeasure = useCallback(
    (measureNumber: number, partIndex: number) => {
      dispatch({ type: "select", measureNumber, partIndex });
    },
    [],
  );

  const clearSelection = useCallback(() => {
    dispatch({ type: "clearSelection" });
  }, []);

  const complete = useCallback(() => {
    onComplete?.(state.measures);
  }, [onComplete, state.measures]);

  return {
    measures: state.measures,
    progress,
    selectedMeasure,
    isComplete,
    approve,
    edit,
    skip,
    approveAll,
    reset,
    selectMeasure,
    clearSelection,
    complete,
  };
}
