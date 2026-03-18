/**
 * Correction Types
 *
 * Types for the measure correction workflow.
 * Used when reviewing and correcting uncertain OMR results.
 *
 * This module defines the domain types for the correction workflow,
 * independent of any UI or state management implementation.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Status of a measure in the correction workflow
 */
export type MeasureCorrectionStatus =
  | "pending" // Not yet reviewed
  | "approved" // User confirmed it looks correct
  | "edited" // User made corrections
  | "skipped"; // User chose to skip for now

/**
 * A measure requiring correction review
 */
export interface CorrectionMeasure {
  /** 1-based measure number */
  readonly measureNumber: number;
  /** 0-based part/staff index */
  readonly partIndex: number;
  /** Confidence score from OMR (0-1) */
  readonly confidence: number;
  /** Reason flagged as uncertain */
  readonly reason: string;
  /** Current review status */
  readonly status: MeasureCorrectionStatus;
  /** User's correction notes (optional) */
  readonly notes?: string;
  /** Timestamp when reviewed */
  readonly reviewedAt?: number;
}

/**
 * Overall correction session state
 */
export interface CorrectionSession {
  /** Unique session ID */
  readonly id: string;
  /** Score ID being corrected */
  readonly scoreId: string;
  /** All measures requiring correction */
  readonly measures: CorrectionMeasure[];
  /** Session start time */
  readonly startedAt: number;
  /** Session completion time */
  readonly completedAt?: number;
}

/**
 * Correction action types
 */
export type CorrectionAction =
  | { type: "approve"; measureNumber: number; partIndex: number }
  | {
      type: "edit";
      measureNumber: number;
      partIndex: number;
      changes: MeasureEdit;
    }
  | { type: "skip"; measureNumber: number; partIndex: number }
  | { type: "approveAll" }
  | { type: "reset"; measureNumber: number; partIndex: number };

/**
 * A user's edit to a measure (simplified for MVP)
 */
export interface MeasureEdit {
  /** Optional notes about the correction */
  readonly notes?: string;
  /** Flag to mark as needing professional review */
  readonly needsReview?: boolean;
  /** MusicXML fragment replacement (future) */
  readonly musicXmlFragment?: string;
}

/**
 * Progress through the correction workflow
 */
export interface CorrectionProgress {
  /** Total measures requiring review */
  readonly total: number;
  /** Measures already reviewed */
  readonly reviewed: number;
  /** Measures approved as-is */
  readonly approved: number;
  /** Measures edited */
  readonly edited: number;
  /** Measures skipped */
  readonly skipped: number;
  /** Percentage complete (0-100) */
  readonly percentComplete: number;
}

/**
 * Severity level for confidence display
 */
export type ConfidenceSeverity = "low" | "medium" | "high";

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the severity level based on confidence score
 */
export function getConfidenceSeverity(confidence: number): ConfidenceSeverity {
  if (confidence < 0.5) return "low";
  if (confidence < 0.75) return "medium";
  return "high";
}

/**
 * Get display color for confidence severity
 */
export function getConfidenceColor(severity: ConfidenceSeverity): string {
  switch (severity) {
    case "low":
      return "#D32F2F"; // Red
    case "medium":
      return "#F57C00"; // Orange
    case "high":
      return "#388E3C"; // Green
  }
}

/**
 * Format confidence as percentage string
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}
