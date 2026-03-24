/**
 * Composer Components
 *
 * UI components for the Practice Composer feature.
 */

// Score rendering
export { ComposerScoreViewport } from "./ComposerScoreViewport";
export type { ComposerScoreViewportProps } from "./ComposerScoreViewport";

export { generateComposerOsmdHtml } from "./composerScoreHtml";
export type { ComposerOsmdOptions } from "./composerScoreHtml";

// Entry palette
export { EntryPalette } from "./EntryPalette";
export type { EntryPaletteProps } from "./EntryPalette";

export { DurationSelector } from "./DurationSelector";
export type { DurationSelectorProps } from "./DurationSelector";

export { PitchSelector } from "./PitchSelector";
export type { PitchSelectorProps } from "./PitchSelector";

export { ModifierRow } from "./ModifierRow";
export type { ModifierRowProps, ArticulationType } from "./ModifierRow";

export { OctaveControls } from "./OctaveControls";
export type { OctaveControlsProps } from "./OctaveControls";

// Navigation & editing
export { NavigationControls } from "./NavigationControls";
export type { NavigationControlsProps } from "./NavigationControls";

export { MeasureControls } from "./MeasureControls";
export type { MeasureControlsProps } from "./MeasureControls";

// Top bar / settings
export { ComposerTopBar } from "./ComposerTopBar";
export type { ComposerTopBarProps } from "./ComposerTopBar";

export { CompactTopBar } from "./CompactTopBar";
export type { CompactTopBarProps } from "./CompactTopBar";

export { CompactControls } from "./CompactControls";
export type { CompactControlsProps } from "./CompactControls";

// Transport / playback
export { ComposerTransport } from "./ComposerTransport";
export type { ComposerTransportProps } from "./ComposerTransport";
