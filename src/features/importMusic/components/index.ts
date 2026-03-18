/**
 * Import Components - Barrel Export
 */

export {
  ImportActionList,
  createDefaultImportActions,
  type ImportAction,
  type ImportActionListProps,
} from "./ImportActionList";

export {
  ImportProgressIndicator,
  type ImportProgressIndicatorProps,
} from "./ImportProgressIndicator";

export { ImportPreview, type ImportPreviewProps } from "./ImportPreview";

export {
  ImportResultPreview,
  propsFromPreviewModel,
  type ImportResultPreviewProps,
} from "./ImportResultPreview";

export {
  ImportErrorDisplay,
  type ImportErrorDisplayProps,
} from "./ImportErrorDisplay";

export {
  ScorePreview,
  type ScorePreviewProps,
  type ScorePreviewRef,
  type HighlightedMeasure,
} from "./ScorePreview";

// Correction UI
export {
  MeasureCorrectionCard,
  type MeasureCorrectionCardProps,
} from "./MeasureCorrectionCard";

export { CorrectionPanel, type CorrectionPanelProps } from "./CorrectionPanel";

export {
  MeasureEditModal,
  type MeasureEditModalProps,
} from "./MeasureEditModal";

// Re-export correction types from types/ for backward compatibility
export {
  type CorrectionMeasure,
  type CorrectionSession,
  type CorrectionProgress,
  type CorrectionAction,
  type MeasureEdit,
  type MeasureCorrectionStatus,
  type ConfidenceSeverity,
  getConfidenceSeverity,
  getConfidenceColor,
  formatConfidence,
} from "../types/correctionTypes";
