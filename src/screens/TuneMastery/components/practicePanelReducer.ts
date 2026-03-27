/**
 * PracticePanel Reducer
 *
 * Pure reducer function for managing PracticePanel state.
 * Handles tool expansion, activation, audio playback, and UI state.
 */
import type {
  PracticePanelState,
  PracticePanelAction,
} from "./practicePanelTypes";

/**
 * Reducer for PracticePanel state.
 * All state transitions are explicit and type-safe.
 */
export function practicePanelReducer(
  state: PracticePanelState,
  action: PracticePanelAction,
): PracticePanelState {
  switch (action.type) {
    // ==========================================================================
    // Tool Expansion Actions
    // ==========================================================================

    case "EXPAND_TUNER":
      return {
        ...state,
        toolExpansion: {
          tunerExpanded: true,
          metronomeExpanded: false,
          droneExpanded: false,
        },
        // Mute audio when tuner expands (if something is playing)
        audio: {
          ...state.audio,
          audioMuted:
            state.playback.metronomeIsPlaying || state.playback.droneIsPlaying
              ? true
              : state.audio.audioMuted,
        },
      };

    case "COLLAPSE_TUNER":
      return {
        ...state,
        toolExpansion: {
          ...state.toolExpansion,
          tunerExpanded: false,
        },
      };

    case "EXPAND_METRONOME":
      return {
        ...state,
        toolExpansion: {
          tunerExpanded: false,
          metronomeExpanded: true,
          droneExpanded: false,
        },
        toolActivation: {
          ...state.toolActivation,
          metronomeActive: true,
        },
      };

    case "COLLAPSE_METRONOME":
      return {
        ...state,
        toolExpansion: {
          ...state.toolExpansion,
          metronomeExpanded: false,
        },
      };

    case "EXPAND_DRONE":
      return {
        ...state,
        toolExpansion: {
          tunerExpanded: false,
          metronomeExpanded: false,
          droneExpanded: true,
        },
        toolActivation: {
          ...state.toolActivation,
          droneActive: true,
        },
      };

    case "COLLAPSE_DRONE":
      return {
        ...state,
        toolExpansion: {
          ...state.toolExpansion,
          droneExpanded: false,
        },
      };

    case "COLLAPSE_ALL_TOOLS":
      return {
        ...state,
        toolExpansion: {
          tunerExpanded: false,
          metronomeExpanded: false,
          droneExpanded: false,
        },
      };

    // ==========================================================================
    // Tool Activation Actions
    // ==========================================================================

    case "ACTIVATE_METRONOME":
      return {
        ...state,
        toolActivation: {
          ...state.toolActivation,
          metronomeActive: true,
        },
      };

    case "DEACTIVATE_METRONOME":
      return {
        ...state,
        toolActivation: {
          ...state.toolActivation,
          metronomeActive: false,
        },
        toolExpansion: {
          ...state.toolExpansion,
          metronomeExpanded: false,
        },
        playback: {
          ...state.playback,
          metronomeIsPlaying: false,
        },
      };

    case "ACTIVATE_DRONE":
      return {
        ...state,
        toolActivation: {
          ...state.toolActivation,
          droneActive: true,
        },
      };

    case "DEACTIVATE_DRONE":
      return {
        ...state,
        toolActivation: {
          ...state.toolActivation,
          droneActive: false,
        },
        toolExpansion: {
          ...state.toolExpansion,
          droneExpanded: false,
        },
        playback: {
          ...state.playback,
          droneIsPlaying: false,
        },
      };

    // ==========================================================================
    // Playback State Actions
    // ==========================================================================

    case "SET_METRONOME_PLAYING":
      return {
        ...state,
        playback: {
          ...state.playback,
          metronomeIsPlaying: action.payload,
        },
      };

    case "SET_DRONE_PLAYING":
      return {
        ...state,
        playback: {
          ...state.playback,
          droneIsPlaying: action.payload,
        },
      };

    case "SET_METRONOME_AUTO_STARTED":
      return {
        ...state,
        playback: {
          ...state.playback,
          metronomeAutoStarted: true,
        },
      };

    case "SET_DRONE_AUTO_STARTED":
      return {
        ...state,
        playback: {
          ...state.playback,
          droneAutoStarted: true,
        },
      };

    // ==========================================================================
    // Audio Actions
    // ==========================================================================

    case "TOGGLE_MUTE":
      return {
        ...state,
        audio: {
          ...state.audio,
          audioMuted: !state.audio.audioMuted,
        },
      };

    case "SET_MUTED":
      return {
        ...state,
        audio: {
          ...state.audio,
          audioMuted: action.payload,
        },
      };

    case "SET_METRONOME_VOLUME":
      return {
        ...state,
        audio: {
          ...state.audio,
          metronomeVolume: action.payload,
        },
      };

    case "SET_DRONE_VOLUME":
      return {
        ...state,
        audio: {
          ...state.audio,
          droneVolume: action.payload,
        },
      };

    // ==========================================================================
    // UI Actions
    // ==========================================================================

    case "SHOW_VOLUME_MODAL":
      return {
        ...state,
        ui: {
          ...state.ui,
          showVolumeModal: true,
        },
      };

    case "HIDE_VOLUME_MODAL":
      return {
        ...state,
        ui: {
          ...state.ui,
          showVolumeModal: false,
        },
      };

    case "SET_RATING":
      return {
        ...state,
        ui: {
          ...state.ui,
          rating: Math.min(100, Math.max(0, action.payload)),
        },
      };

    case "ADJUST_RATING":
      return {
        ...state,
        ui: {
          ...state.ui,
          rating: Math.min(100, Math.max(0, state.ui.rating + action.payload)),
        },
      };

    default:
      return state;
  }
}
