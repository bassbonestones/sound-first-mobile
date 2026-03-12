/**
 * useTools hook tests
 *
 * Tests for the metronome and pitch drone tool management hook.
 */
import { renderHook, act } from "@testing-library/react-native";
import useTools from "../src/screens/Session/hooks/useTools";

describe("useTools", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("initialization", () => {
    it("initializes with all tools disabled", () => {
      const { result } = renderHook(() => useTools(null));

      expect(result.current.metronomeEnabled).toBe(false);
      expect(result.current.metronomeVisible).toBe(false);
      expect(result.current.metronomeIsPlaying).toBe(false);
      expect(result.current.droneEnabled).toBe(false);
      expect(result.current.droneVisible).toBe(false);
      expect(result.current.droneIsPlaying).toBe(false);
    });

    it("initializes with default volume and mute settings", () => {
      const { result } = renderHook(() => useTools(null));

      expect(result.current.metronomeVolume).toBe(0.5);
      expect(result.current.droneVolume).toBe(0.5);
      expect(result.current.audioMuted).toBe(false);
      expect(result.current.showVolumeModal).toBe(false);
    });
  });

  describe("metronome controls", () => {
    it("toggleMetronome enables and shows metronome when disabled", () => {
      const { result } = renderHook(() => useTools(null));

      act(() => {
        result.current.toggleMetronome();
      });

      expect(result.current.metronomeEnabled).toBe(true);
      expect(result.current.metronomeVisible).toBe(true);
    });

    it("toggleMetronome disables and hides metronome when enabled", () => {
      const { result } = renderHook(() => useTools(null));

      // Enable first
      act(() => {
        result.current.toggleMetronome();
      });

      // Then disable
      act(() => {
        result.current.toggleMetronome();
      });

      expect(result.current.metronomeEnabled).toBe(false);
      expect(result.current.metronomeVisible).toBe(false);
    });

    it("setMetronomeEnabled updates enabled state", () => {
      const { result } = renderHook(() => useTools(null));

      act(() => {
        result.current.setMetronomeEnabled(true);
      });

      expect(result.current.metronomeEnabled).toBe(true);
    });

    it("setMetronomeVolume updates volume", () => {
      const { result } = renderHook(() => useTools(null));

      act(() => {
        result.current.setMetronomeVolume(0.8);
      });

      expect(result.current.metronomeVolume).toBe(0.8);
    });
  });

  describe("drone controls", () => {
    it("toggleDrone enables and shows drone when disabled", () => {
      const { result } = renderHook(() => useTools(null));

      act(() => {
        result.current.toggleDrone();
      });

      expect(result.current.droneEnabled).toBe(true);
      expect(result.current.droneVisible).toBe(true);
    });

    it("toggleDrone disables and hides drone when enabled", () => {
      const { result } = renderHook(() => useTools(null));

      // Enable first
      act(() => {
        result.current.toggleDrone();
      });

      // Then disable
      act(() => {
        result.current.toggleDrone();
      });

      expect(result.current.droneEnabled).toBe(false);
      expect(result.current.droneVisible).toBe(false);
    });

    it("setDroneEnabled updates enabled state", () => {
      const { result } = renderHook(() => useTools(null));

      act(() => {
        result.current.setDroneEnabled(true);
      });

      expect(result.current.droneEnabled).toBe(true);
    });

    it("setDroneVolume updates volume", () => {
      const { result } = renderHook(() => useTools(null));

      act(() => {
        result.current.setDroneVolume(0.3);
      });

      expect(result.current.droneVolume).toBe(0.3);
    });
  });

  describe("mute controls", () => {
    it("handleMutePress toggles audioMuted", () => {
      const { result } = renderHook(() => useTools(null));

      expect(result.current.audioMuted).toBe(false);

      act(() => {
        result.current.handleMutePress();
      });

      expect(result.current.audioMuted).toBe(true);

      act(() => {
        result.current.handleMutePress();
      });

      expect(result.current.audioMuted).toBe(false);
    });

    it("long press shows volume modal after 500ms", () => {
      const { result } = renderHook(() => useTools(null));

      expect(result.current.showVolumeModal).toBe(false);

      act(() => {
        result.current.startMuteLongPress();
      });

      // Before 500ms - modal should not be visible
      act(() => {
        jest.advanceTimersByTime(400);
      });
      expect(result.current.showVolumeModal).toBe(false);

      // After 500ms - modal should be visible
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(result.current.showVolumeModal).toBe(true);
    });

    it("cancelMuteLongPress prevents volume modal from showing", () => {
      const { result } = renderHook(() => useTools(null));

      act(() => {
        result.current.startMuteLongPress();
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      act(() => {
        result.current.cancelMuteLongPress();
      });

      // Even after full time passes, modal should not show
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(result.current.showVolumeModal).toBe(false);
    });

    it("setShowVolumeModal updates modal visibility", () => {
      const { result } = renderHook(() => useTools(null));

      act(() => {
        result.current.setShowVolumeModal(true);
      });

      expect(result.current.showVolumeModal).toBe(true);
    });
  });

  describe("mini-session change reset", () => {
    it("resets all tools when mini-session changes", () => {
      const { result, rerender } = renderHook(
        ({ miniSession }) => useTools(miniSession),
        { initialProps: { miniSession: { id: 1 } } },
      );

      // Enable tools
      act(() => {
        result.current.toggleMetronome();
        result.current.toggleDrone();
        result.current.setMetronomeIsPlaying(true);
        result.current.setDroneIsPlaying(true);
        result.current.setAudioMuted(true);
      });

      expect(result.current.metronomeEnabled).toBe(true);
      expect(result.current.droneEnabled).toBe(true);
      expect(result.current.metronomeIsPlaying).toBe(true);
      expect(result.current.droneIsPlaying).toBe(true);
      expect(result.current.audioMuted).toBe(true);

      // Change mini-session
      rerender({ miniSession: { id: 2 } });

      expect(result.current.metronomeEnabled).toBe(false);
      expect(result.current.metronomeVisible).toBe(false);
      expect(result.current.metronomeIsPlaying).toBe(false);
      expect(result.current.droneEnabled).toBe(false);
      expect(result.current.droneVisible).toBe(false);
      expect(result.current.droneIsPlaying).toBe(false);
      expect(result.current.audioMuted).toBe(false);
    });

    it("preserves volume settings when mini-session changes", () => {
      const { result, rerender } = renderHook(
        ({ miniSession }) => useTools(miniSession),
        { initialProps: { miniSession: { id: 1 } } },
      );

      act(() => {
        result.current.setMetronomeVolume(0.9);
        result.current.setDroneVolume(0.2);
      });

      // Change mini-session
      rerender({ miniSession: { id: 2 } });

      // Volume should be preserved
      expect(result.current.metronomeVolume).toBe(0.9);
      expect(result.current.droneVolume).toBe(0.2);
    });
  });

  describe("visibility controls", () => {
    it("setMetronomeVisible updates visibility independently", () => {
      const { result } = renderHook(() => useTools(null));

      act(() => {
        result.current.setMetronomeEnabled(true);
        result.current.setMetronomeVisible(false);
      });

      expect(result.current.metronomeEnabled).toBe(true);
      expect(result.current.metronomeVisible).toBe(false);
    });

    it("setDroneVisible updates visibility independently", () => {
      const { result } = renderHook(() => useTools(null));

      act(() => {
        result.current.setDroneEnabled(true);
        result.current.setDroneVisible(false);
      });

      expect(result.current.droneEnabled).toBe(true);
      expect(result.current.droneVisible).toBe(false);
    });
  });

  describe("playing state", () => {
    it("setMetronomeIsPlaying updates playing state", () => {
      const { result } = renderHook(() => useTools(null));

      act(() => {
        result.current.setMetronomeIsPlaying(true);
      });

      expect(result.current.metronomeIsPlaying).toBe(true);
    });

    it("setDroneIsPlaying updates playing state", () => {
      const { result } = renderHook(() => useTools(null));

      act(() => {
        result.current.setDroneIsPlaying(true);
      });

      expect(result.current.droneIsPlaying).toBe(true);
    });
  });
});
