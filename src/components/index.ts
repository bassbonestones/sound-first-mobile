/**
 * Shared Components Barrel Export
 *
 * Central export point for all reusable UI components.
 * Import components from this file for cleaner imports:
 *   import { ErrorBoundary, AudioPlayer, Metronome } from '../components';
 */

// Error handling
export { default as ErrorBoundary } from "./ErrorBoundary";

// Audio components
export { default as AudioInput } from "./AudioInput";
export { default as AudioPlayer } from "./AudioPlayer";
export { default as MobileAudioInput } from "./MobileAudioInput";

// Music/Practice components
export { default as Metronome, CompactMetronome } from "./Metronome";
export { default as PitchDrone } from "./PitchDrone";
export { default as VolumeBar } from "./VolumeBar";
export { default as NotationDisplay } from "./NotationDisplay";
export { default as StaffNotePicker } from "./StaffNotePicker";
export { default as EDMVisualizer } from "./EDMVisualizer";

// UI components
export { default as DevNavMenu } from "./DevNavMenu";
export { default as HelpMenu } from "./HelpMenu";
export { default as ResetButton } from "./ResetButton";
export { default as MiniLesson } from "./MiniLesson";
