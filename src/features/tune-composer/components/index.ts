/**
 * Tune Composer Components - Barrel Export
 */

export { TuneComposerScoreViewport } from "./TuneComposerScoreViewport";
export type { TuneComposerScoreViewportProps } from "./TuneComposerScoreViewport";

export { LyricsControls } from "./LyricsControls";
export type { LyricsControlsProps } from "./LyricsControls";

export { ExpressionControls } from "./ExpressionControls";
export type { ExpressionControlsProps } from "./ExpressionControls";

export { DynamicsControls } from "./DynamicsControls";
export type { DynamicsControlsProps } from "./DynamicsControls";

export {
  ChordControls,
  ChordControlsBase,
  ChordControlsConnected,
} from "./ChordControls";
export type {
  ChordControlsProps,
  ChordControlsConnectedProps,
} from "./ChordControls";

export { ProgressionSelector } from "./ProgressionSelector";
export type { ProgressionSelectorProps } from "./ProgressionSelector";

export { PracticeOverChangesControls } from "./PracticeOverChangesControls";
export type { PracticeOverChangesControlsProps } from "./PracticeOverChangesControls";

export { PracticeScoreViewport } from "./PracticeScoreViewport";
export type { PracticeScoreViewportProps } from "./PracticeScoreViewport";

// Modals
export {
  ClefChangeModal,
  KeyChangeModal,
  ChordStyleModal,
  AddMeasureModal,
  AddPickupModal,
  ImportTuneModal,
  SaveNewFileModal,
  RhythmChangeModal,
  TuneMetadataModal,
  MeasureTempoModal,
  MeasureKeySignatureModal,
  MeasureTimeSignatureModal,
  modalStyles,
} from "./modals";
export type {
  ClefChangeModalProps,
  KeyChangeModalProps,
  ChordStyleModalProps,
  ChordStyleSelection,
  AddMeasureModalProps,
  AddPickupModalProps,
  ImportTuneModalProps,
  SaveNewFileModalProps,
  RhythmChangeModalProps,
  TuneMetadataModalProps,
  MeasureTempoModalProps,
  MeasureKeySignatureModalProps,
  MeasureTimeSignatureModalProps,
} from "./modals";
