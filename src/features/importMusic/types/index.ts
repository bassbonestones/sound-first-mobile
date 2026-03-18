/**
 * Import Music Types
 *
 * Re-exports all types specific to the import music feature.
 * These types are distinct from the app-wide types in src/types/import.ts.
 */

// Correction workflow types
export type {
  MeasureCorrectionStatus,
  CorrectionMeasure,
  CorrectionSession,
  CorrectionAction,
  MeasureEdit,
  CorrectionProgress,
  ConfidenceSeverity,
} from "./correctionTypes";

// Correction workflow utilities
export {
  getConfidenceSeverity,
  getConfidenceColor,
  formatConfidence,
} from "./correctionTypes";
