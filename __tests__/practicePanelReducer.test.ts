/**
 * Tests for practicePanelReducer
 *
 * Covers all action types: tool expansion, tool activation, playback state,
 * audio controls, and UI state management.
 */
import { practicePanelReducer } from "../src/screens/TuneMastery/components/practicePanelReducer";
import {
  PracticePanelState,
  createInitialPracticePanelState,
} from "../src/screens/TuneMastery/components/practicePanelTypes";

describe("practicePanelReducer", () => {
  // Helper to create a baseline state for testing
  const createBaseState = (): PracticePanelState =>
    createInitialPracticePanelState(50);

  // ==========================================================================
  // Tool Expansion Actions
  // ==========================================================================

  describe("tool expansion actions", () => {
    it("EXPAND_TUNER should expand tuner and collapse others", () => {
      const state = createBaseState();
      const result = practicePanelReducer(state, { type: "EXPAND_TUNER" });

      expect(result.toolExpansion.tunerExpanded).toBe(true);
      expect(result.toolExpansion.metronomeExpanded).toBe(false);
      expect(result.toolExpansion.droneExpanded).toBe(false);
    });

    it("EXPAND_TUNER should mute audio when metronome is playing", () => {
      const state: PracticePanelState = {
        ...createBaseState(),
        playback: {
          ...createBaseState().playback,
          metronomeIsPlaying: true,
        },
        audio: {
          ...createBaseState().audio,
          audioMuted: false,
        },
      };
      const result = practicePanelReducer(state, { type: "EXPAND_TUNER" });

      expect(result.audio.audioMuted).toBe(true);
    });

    it("EXPAND_TUNER should mute audio when drone is playing", () => {
      const state: PracticePanelState = {
        ...createBaseState(),
        playback: {
          ...createBaseState().playback,
          droneIsPlaying: true,
        },
        audio: {
          ...createBaseState().audio,
          audioMuted: false,
        },
      };
      const result = practicePanelReducer(state, { type: "EXPAND_TUNER" });

      expect(result.audio.audioMuted).toBe(true);
    });

    it("EXPAND_TUNER should preserve mute state when no audio is playing", () => {
      const state = createBaseState();
      state.audio.audioMuted = false;

      const result = practicePanelReducer(state, { type: "EXPAND_TUNER" });

      expect(result.audio.audioMuted).toBe(false);
    });

    it("COLLAPSE_TUNER should collapse tuner", () => {
      const state: PracticePanelState = {
        ...createBaseState(),
        toolExpansion: {
          ...createBaseState().toolExpansion,
          tunerExpanded: true,
        },
      };
      const result = practicePanelReducer(state, { type: "COLLAPSE_TUNER" });

      expect(result.toolExpansion.tunerExpanded).toBe(false);
    });

    it("EXPAND_METRONOME should expand metronome and activate it", () => {
      const state = createBaseState();
      const result = practicePanelReducer(state, { type: "EXPAND_METRONOME" });

      expect(result.toolExpansion.tunerExpanded).toBe(false);
      expect(result.toolExpansion.metronomeExpanded).toBe(true);
      expect(result.toolExpansion.droneExpanded).toBe(false);
      expect(result.toolActivation.metronomeActive).toBe(true);
    });

    it("COLLAPSE_METRONOME should collapse metronome only", () => {
      const state: PracticePanelState = {
        ...createBaseState(),
        toolExpansion: {
          ...createBaseState().toolExpansion,
          metronomeExpanded: true,
        },
      };
      const result = practicePanelReducer(state, {
        type: "COLLAPSE_METRONOME",
      });

      expect(result.toolExpansion.metronomeExpanded).toBe(false);
    });

    it("EXPAND_DRONE should expand drone and activate it", () => {
      const state = createBaseState();
      const result = practicePanelReducer(state, { type: "EXPAND_DRONE" });

      expect(result.toolExpansion.tunerExpanded).toBe(false);
      expect(result.toolExpansion.metronomeExpanded).toBe(false);
      expect(result.toolExpansion.droneExpanded).toBe(true);
      expect(result.toolActivation.droneActive).toBe(true);
    });

    it("COLLAPSE_DRONE should collapse drone only", () => {
      const state: PracticePanelState = {
        ...createBaseState(),
        toolExpansion: {
          ...createBaseState().toolExpansion,
          droneExpanded: true,
        },
      };
      const result = practicePanelReducer(state, { type: "COLLAPSE_DRONE" });

      expect(result.toolExpansion.droneExpanded).toBe(false);
    });

    it("COLLAPSE_ALL_TOOLS should collapse all tools", () => {
      const state: PracticePanelState = {
        ...createBaseState(),
        toolExpansion: {
          tunerExpanded: true,
          metronomeExpanded: true,
          droneExpanded: true,
        },
      };
      const result = practicePanelReducer(state, {
        type: "COLLAPSE_ALL_TOOLS",
      });

      expect(result.toolExpansion.tunerExpanded).toBe(false);
      expect(result.toolExpansion.metronomeExpanded).toBe(false);
      expect(result.toolExpansion.droneExpanded).toBe(false);
    });
  });

  // ==========================================================================
  // Tool Activation Actions
  // ==========================================================================

  describe("tool activation actions", () => {
    it("ACTIVATE_METRONOME should activate metronome", () => {
      const state = createBaseState();
      const result = practicePanelReducer(state, {
        type: "ACTIVATE_METRONOME",
      });

      expect(result.toolActivation.metronomeActive).toBe(true);
    });

    it("DEACTIVATE_METRONOME should deactivate, collapse, and stop metronome", () => {
      const state: PracticePanelState = {
        ...createBaseState(),
        toolActivation: {
          ...createBaseState().toolActivation,
          metronomeActive: true,
        },
        toolExpansion: {
          ...createBaseState().toolExpansion,
          metronomeExpanded: true,
        },
        playback: {
          ...createBaseState().playback,
          metronomeIsPlaying: true,
        },
      };
      const result = practicePanelReducer(state, {
        type: "DEACTIVATE_METRONOME",
      });

      expect(result.toolActivation.metronomeActive).toBe(false);
      expect(result.toolExpansion.metronomeExpanded).toBe(false);
      expect(result.playback.metronomeIsPlaying).toBe(false);
    });

    it("ACTIVATE_DRONE should activate drone", () => {
      const state = createBaseState();
      const result = practicePanelReducer(state, { type: "ACTIVATE_DRONE" });

      expect(result.toolActivation.droneActive).toBe(true);
    });

    it("DEACTIVATE_DRONE should deactivate, collapse, and stop drone", () => {
      const state: PracticePanelState = {
        ...createBaseState(),
        toolActivation: {
          ...createBaseState().toolActivation,
          droneActive: true,
        },
        toolExpansion: {
          ...createBaseState().toolExpansion,
          droneExpanded: true,
        },
        playback: {
          ...createBaseState().playback,
          droneIsPlaying: true,
        },
      };
      const result = practicePanelReducer(state, { type: "DEACTIVATE_DRONE" });

      expect(result.toolActivation.droneActive).toBe(false);
      expect(result.toolExpansion.droneExpanded).toBe(false);
      expect(result.playback.droneIsPlaying).toBe(false);
    });
  });

  // ==========================================================================
  // Playback State Actions
  // ==========================================================================

  describe("playback state actions", () => {
    it("SET_METRONOME_PLAYING should update metronome playing state to true", () => {
      const state = createBaseState();
      const result = practicePanelReducer(state, {
        type: "SET_METRONOME_PLAYING",
        payload: true,
      });

      expect(result.playback.metronomeIsPlaying).toBe(true);
    });

    it("SET_METRONOME_PLAYING should update metronome playing state to false", () => {
      const state: PracticePanelState = {
        ...createBaseState(),
        playback: {
          ...createBaseState().playback,
          metronomeIsPlaying: true,
        },
      };
      const result = practicePanelReducer(state, {
        type: "SET_METRONOME_PLAYING",
        payload: false,
      });

      expect(result.playback.metronomeIsPlaying).toBe(false);
    });

    it("SET_DRONE_PLAYING should update drone playing state to true", () => {
      const state = createBaseState();
      const result = practicePanelReducer(state, {
        type: "SET_DRONE_PLAYING",
        payload: true,
      });

      expect(result.playback.droneIsPlaying).toBe(true);
    });

    it("SET_DRONE_PLAYING should update drone playing state to false", () => {
      const state: PracticePanelState = {
        ...createBaseState(),
        playback: {
          ...createBaseState().playback,
          droneIsPlaying: true,
        },
      };
      const result = practicePanelReducer(state, {
        type: "SET_DRONE_PLAYING",
        payload: false,
      });

      expect(result.playback.droneIsPlaying).toBe(false);
    });

    it("SET_METRONOME_AUTO_STARTED should mark metronome as auto-started", () => {
      const state = createBaseState();
      const result = practicePanelReducer(state, {
        type: "SET_METRONOME_AUTO_STARTED",
      });

      expect(result.playback.metronomeAutoStarted).toBe(true);
    });

    it("SET_DRONE_AUTO_STARTED should mark drone as auto-started", () => {
      const state = createBaseState();
      const result = practicePanelReducer(state, {
        type: "SET_DRONE_AUTO_STARTED",
      });

      expect(result.playback.droneAutoStarted).toBe(true);
    });
  });

  // ==========================================================================
  // Audio Actions
  // ==========================================================================

  describe("audio actions", () => {
    it("TOGGLE_MUTE should toggle mute from false to true", () => {
      const state = createBaseState();
      const result = practicePanelReducer(state, { type: "TOGGLE_MUTE" });

      expect(result.audio.audioMuted).toBe(true);
    });

    it("TOGGLE_MUTE should toggle mute from true to false", () => {
      const state: PracticePanelState = {
        ...createBaseState(),
        audio: {
          ...createBaseState().audio,
          audioMuted: true,
        },
      };
      const result = practicePanelReducer(state, { type: "TOGGLE_MUTE" });

      expect(result.audio.audioMuted).toBe(false);
    });

    it("SET_MUTED should set mute state to payload", () => {
      const state = createBaseState();
      const result = practicePanelReducer(state, {
        type: "SET_MUTED",
        payload: true,
      });

      expect(result.audio.audioMuted).toBe(true);
    });

    it("SET_METRONOME_VOLUME should update metronome volume", () => {
      const state = createBaseState();
      const result = practicePanelReducer(state, {
        type: "SET_METRONOME_VOLUME",
        payload: 0.75,
      });

      expect(result.audio.metronomeVolume).toBe(0.75);
    });

    it("SET_DRONE_VOLUME should update drone volume", () => {
      const state = createBaseState();
      const result = practicePanelReducer(state, {
        type: "SET_DRONE_VOLUME",
        payload: 0.25,
      });

      expect(result.audio.droneVolume).toBe(0.25);
    });
  });

  // ==========================================================================
  // UI Actions
  // ==========================================================================

  describe("UI actions", () => {
    it("SHOW_VOLUME_MODAL should show volume modal", () => {
      const state = createBaseState();
      const result = practicePanelReducer(state, { type: "SHOW_VOLUME_MODAL" });

      expect(result.ui.showVolumeModal).toBe(true);
    });

    it("HIDE_VOLUME_MODAL should hide volume modal", () => {
      const state: PracticePanelState = {
        ...createBaseState(),
        ui: {
          ...createBaseState().ui,
          showVolumeModal: true,
        },
      };
      const result = practicePanelReducer(state, { type: "HIDE_VOLUME_MODAL" });

      expect(result.ui.showVolumeModal).toBe(false);
    });

    it("SET_RATING should set rating value", () => {
      const state = createBaseState();
      const result = practicePanelReducer(state, {
        type: "SET_RATING",
        payload: 75,
      });

      expect(result.ui.rating).toBe(75);
    });

    it("SET_RATING should clamp rating to maximum of 100", () => {
      const state = createBaseState();
      const result = practicePanelReducer(state, {
        type: "SET_RATING",
        payload: 150,
      });

      expect(result.ui.rating).toBe(100);
    });

    it("SET_RATING should clamp rating to minimum of 0", () => {
      const state = createBaseState();
      const result = practicePanelReducer(state, {
        type: "SET_RATING",
        payload: -20,
      });

      expect(result.ui.rating).toBe(0);
    });

    it("ADJUST_RATING should increment rating", () => {
      const state: PracticePanelState = {
        ...createBaseState(),
        ui: {
          ...createBaseState().ui,
          rating: 50,
        },
      };
      const result = practicePanelReducer(state, {
        type: "ADJUST_RATING",
        payload: 10,
      });

      expect(result.ui.rating).toBe(60);
    });

    it("ADJUST_RATING should decrement rating", () => {
      const state: PracticePanelState = {
        ...createBaseState(),
        ui: {
          ...createBaseState().ui,
          rating: 50,
        },
      };
      const result = practicePanelReducer(state, {
        type: "ADJUST_RATING",
        payload: -10,
      });

      expect(result.ui.rating).toBe(40);
    });

    it("ADJUST_RATING should clamp result to maximum of 100", () => {
      const state: PracticePanelState = {
        ...createBaseState(),
        ui: {
          ...createBaseState().ui,
          rating: 95,
        },
      };
      const result = practicePanelReducer(state, {
        type: "ADJUST_RATING",
        payload: 10,
      });

      expect(result.ui.rating).toBe(100);
    });

    it("ADJUST_RATING should clamp result to minimum of 0", () => {
      const state: PracticePanelState = {
        ...createBaseState(),
        ui: {
          ...createBaseState().ui,
          rating: 5,
        },
      };
      const result = practicePanelReducer(state, {
        type: "ADJUST_RATING",
        payload: -10,
      });

      expect(result.ui.rating).toBe(0);
    });
  });

  // ==========================================================================
  // Default Case
  // ==========================================================================

  describe("default case", () => {
    it("should return unchanged state for unknown action", () => {
      const state = createBaseState();
      const result = practicePanelReducer(state, {
        type: "UNKNOWN_ACTION",
      } as any);

      expect(result).toBe(state);
    });
  });

  // ==========================================================================
  // State Immutability
  // ==========================================================================

  describe("state immutability", () => {
    it("should not mutate original state", () => {
      const state = createBaseState();
      const originalState = JSON.stringify(state);

      practicePanelReducer(state, { type: "EXPAND_TUNER" });
      practicePanelReducer(state, { type: "TOGGLE_MUTE" });
      practicePanelReducer(state, { type: "SET_RATING", payload: 100 });

      expect(JSON.stringify(state)).toBe(originalState);
    });
  });
});

describe("createInitialPracticePanelState", () => {
  it("should create state with default values", () => {
    const state = createInitialPracticePanelState(50);

    expect(state.toolExpansion.tunerExpanded).toBe(false);
    expect(state.toolExpansion.metronomeExpanded).toBe(false);
    expect(state.toolExpansion.droneExpanded).toBe(false);
    expect(state.toolActivation.metronomeActive).toBe(false);
    expect(state.toolActivation.droneActive).toBe(false);
    expect(state.playback.metronomeIsPlaying).toBe(false);
    expect(state.playback.droneIsPlaying).toBe(false);
    expect(state.audio.audioMuted).toBe(false);
    expect(state.audio.metronomeVolume).toBe(0.5);
    expect(state.audio.droneVolume).toBe(0.5);
    expect(state.ui.showVolumeModal).toBe(false);
    expect(state.ui.rating).toBe(50);
  });

  it("should use currentScore for initial rating", () => {
    const state = createInitialPracticePanelState(75);
    expect(state.ui.rating).toBe(75);
  });

  it("should use 50 as default rating when currentScore is 0", () => {
    const state = createInitialPracticePanelState(0);
    expect(state.ui.rating).toBe(50);
  });

  it("should activate metronome when autoMetronome setting is true", () => {
    const state = createInitialPracticePanelState(50, { autoMetronome: true });

    expect(state.toolActivation.metronomeActive).toBe(true);
    expect(state.playback.metronomeIsPlaying).toBe(true);
  });

  it("should activate drone when autoDrone setting is true", () => {
    const state = createInitialPracticePanelState(50, { autoDrone: true });

    expect(state.toolActivation.droneActive).toBe(true);
    expect(state.playback.droneIsPlaying).toBe(true);
  });

  it("should activate both tools when both settings are true", () => {
    const state = createInitialPracticePanelState(50, {
      autoMetronome: true,
      autoDrone: true,
    });

    expect(state.toolActivation.metronomeActive).toBe(true);
    expect(state.toolActivation.droneActive).toBe(true);
    expect(state.playback.metronomeIsPlaying).toBe(true);
    expect(state.playback.droneIsPlaying).toBe(true);
  });

  it("should handle undefined settings gracefully", () => {
    const state = createInitialPracticePanelState(50, undefined);

    expect(state.toolActivation.metronomeActive).toBe(false);
    expect(state.toolActivation.droneActive).toBe(false);
  });
});
