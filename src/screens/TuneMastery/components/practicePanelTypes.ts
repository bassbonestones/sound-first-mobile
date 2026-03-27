/**
 * PracticePanel Types
 *
 * State and action types for the PracticePanel reducer.
 * Groups related state: tool expansion, tool activation, playback, audio, and UI.
 */
import type { TunerMode, Temperament } from "./Tuner";

// =============================================================================
// Props Types (moved from PracticePanel.tsx to avoid circular imports)
// =============================================================================

export interface PracticePanelSettings {
  tunerMode?: TunerMode;
  temperament?: Temperament;
  autoMetronome?: boolean;
  autoDrone?: boolean;
}

export interface TuneSettingsForPractice {
  bpm?: number;
  timeSignature?: string;
  subdivision?: number;
  pitchSystem?: "equal" | "just";
  aHertz?: number;
}

// =============================================================================
// State
// =============================================================================

/** Which tool is currently expanded (full screen) */
export interface ToolExpansionState {
  tunerExpanded: boolean;
  metronomeExpanded: boolean;
  droneExpanded: boolean;
}

/** Which tools are currently active (enabled) */
export interface ToolActivationState {
  metronomeActive: boolean;
  droneActive: boolean;
}

/** Audio playback status from child components */
export interface PlaybackState {
  metronomeIsPlaying: boolean;
  droneIsPlaying: boolean;
  metronomeAutoStarted: boolean;
  droneAutoStarted: boolean;
}

/** Volume and mute state */
export interface AudioState {
  audioMuted: boolean;
  metronomeVolume: number;
  droneVolume: number;
}

/** UI state (modal visibility, rating input) */
export interface UIState {
  showVolumeModal: boolean;
  rating: number;
}

/** Complete PracticePanel state */
export interface PracticePanelState {
  toolExpansion: ToolExpansionState;
  toolActivation: ToolActivationState;
  playback: PlaybackState;
  audio: AudioState;
  ui: UIState;
}

// =============================================================================
// Actions
// =============================================================================

/** All possible PracticePanel actions */
export type PracticePanelAction =
  // Tool expansion actions
  | { type: "EXPAND_TUNER" }
  | { type: "COLLAPSE_TUNER" }
  | { type: "EXPAND_METRONOME" }
  | { type: "COLLAPSE_METRONOME" }
  | { type: "EXPAND_DRONE" }
  | { type: "COLLAPSE_DRONE" }
  | { type: "COLLAPSE_ALL_TOOLS" }
  // Tool activation actions
  | { type: "ACTIVATE_METRONOME" }
  | { type: "DEACTIVATE_METRONOME" }
  | { type: "ACTIVATE_DRONE" }
  | { type: "DEACTIVATE_DRONE" }
  // Playback state actions (from child callbacks)
  | { type: "SET_METRONOME_PLAYING"; payload: boolean }
  | { type: "SET_DRONE_PLAYING"; payload: boolean }
  | { type: "SET_METRONOME_AUTO_STARTED" }
  | { type: "SET_DRONE_AUTO_STARTED" }
  // Audio actions
  | { type: "TOGGLE_MUTE" }
  | { type: "SET_MUTED"; payload: boolean }
  | { type: "SET_METRONOME_VOLUME"; payload: number }
  | { type: "SET_DRONE_VOLUME"; payload: number }
  // UI actions
  | { type: "SHOW_VOLUME_MODAL" }
  | { type: "HIDE_VOLUME_MODAL" }
  | { type: "SET_RATING"; payload: number }
  | { type: "ADJUST_RATING"; payload: number };

// =============================================================================
// Initial State Factory
// =============================================================================

/** Create initial state with optional defaults from settings */
export function createInitialPracticePanelState(
  currentScore: number,
  settings?: PracticePanelSettings,
): PracticePanelState {
  const autoMetronome = settings?.autoMetronome ?? false;
  const autoDrone = settings?.autoDrone ?? false;

  return {
    toolExpansion: {
      tunerExpanded: false,
      metronomeExpanded: false,
      droneExpanded: false,
    },
    toolActivation: {
      metronomeActive: autoMetronome,
      droneActive: autoDrone,
    },
    playback: {
      metronomeIsPlaying: autoMetronome,
      droneIsPlaying: autoDrone,
      metronomeAutoStarted: false,
      droneAutoStarted: false,
    },
    audio: {
      audioMuted: false,
      metronomeVolume: 0.5,
      droneVolume: 0.5,
    },
    ui: {
      showVolumeModal: false,
      rating: currentScore || 50,
    },
  };
}
