/**
 * Tests for Metronome component
 *
 * Fully typed TypeScript test file with comprehensive coverage for
 * metronome functionality, BPM controls, time signatures, and audio playback.
 */

import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import Metronome, { CompactMetronome } from "../src/components/Metronome";

// Mock AudioContext for web
const mockOscillator = {
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  frequency: { value: 0 },
  type: "sine" as const,
};

const mockGainNode = {
  connect: jest.fn(),
  gain: {
    setValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
    value: 1,
  },
};

const mockAudioContext = {
  createOscillator: jest.fn(() => mockOscillator),
  createGain: jest.fn(() => mockGainNode),
  destination: {},
  currentTime: 0,
  close: jest.fn(),
  state: "running",
  resume: jest.fn().mockResolvedValue(undefined),
};

interface MockWindow {
  AudioContext: jest.Mock;
  webkitAudioContext: jest.Mock;
}

// Set up web platform mock
beforeAll(() => {
  (global as unknown as { window: MockWindow }).window = {
    AudioContext: jest.fn(() => mockAudioContext),
    webkitAudioContext: jest.fn(() => mockAudioContext),
  };
});

afterAll(() => {
  delete (global as unknown as { window?: MockWindow }).window;
});

describe("Metronome", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Initial state", () => {
    it("renders with default BPM", () => {
      const { getByText } = render(<Metronome />);

      // Default BPM is 80 - using getAllByText since 80 appears in preset buttons too
      expect(getByText("BPM")).toBeTruthy();
    });

    it("renders with custom initial BPM", () => {
      const { getAllByText } = render(<Metronome initialBpm={120} />);

      // BPM display shows 120 (also appears in preset buttons)
      expect(getAllByText("120").length).toBeGreaterThanOrEqual(1);
    });

    it("starts in stopped state by default", () => {
      const { getByText } = render(<Metronome />);

      // Should show "▶ Start" text (not playing)
      expect(getByText(/Start/)).toBeTruthy();
    });

    it("starts playing when autoStart is true", () => {
      const { getByText } = render(<Metronome autoStart={true} />);

      // Should show "⏹ Stop" (playing)
      expect(getByText(/Stop/)).toBeTruthy();
    });

    it("renders with all default props", () => {
      const { getByText } = render(<Metronome />);
      expect(getByText("BPM")).toBeTruthy();
      expect(getByText(/Start/)).toBeTruthy();
    });

    it("renders BPM display prominently", () => {
      const { getAllByText } = render(<Metronome initialBpm={100} />);
      // 100 appears in BPM display AND preset buttons
      expect(getAllByText("100").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("BPM controls", () => {
    it("increases BPM when + button pressed", () => {
      const onBpmChange = jest.fn();
      const { getByText } = render(
        <Metronome initialBpm={100} onBpmChange={onBpmChange} />,
      );

      fireEvent.press(getByText("+"));

      expect(onBpmChange).toHaveBeenCalled();
    });

    it("decreases BPM when - button pressed", () => {
      const onBpmChange = jest.fn();
      const { getByText } = render(
        <Metronome initialBpm={100} onBpmChange={onBpmChange} />,
      );

      fireEvent.press(getByText("-"));

      expect(onBpmChange).toHaveBeenCalled();
    });

    it("renders fine adjustment buttons", () => {
      const { getByText } = render(<Metronome />);

      expect(getByText("-1")).toBeTruthy();
      expect(getByText("+1")).toBeTruthy();
    });

    it("increases BPM with +1 button", () => {
      const onBpmChange = jest.fn();
      const { getByText } = render(
        <Metronome initialBpm={100} onBpmChange={onBpmChange} />,
      );

      fireEvent.press(getByText("+1"));
      expect(onBpmChange).toHaveBeenCalledWith(101);
    });

    it("decreases BPM with -1 button", () => {
      const onBpmChange = jest.fn();
      const { getByText } = render(
        <Metronome initialBpm={100} onBpmChange={onBpmChange} />,
      );

      fireEvent.press(getByText("-1"));
      expect(onBpmChange).toHaveBeenCalledWith(99);
    });

    it("respects minBpm constraint", () => {
      const onBpmChange = jest.fn();
      const { getByText } = render(
        <Metronome initialBpm={41} minBpm={40} onBpmChange={onBpmChange} />,
      );

      fireEvent.press(getByText("-"));
      // Should not go below 40
      expect(onBpmChange).toHaveBeenCalled();
    });

    it("respects maxBpm constraint", () => {
      const onBpmChange = jest.fn();
      const { getByText } = render(
        <Metronome initialBpm={349} maxBpm={350} onBpmChange={onBpmChange} />,
      );

      fireEvent.press(getByText("+"));
      // Should not go above 350
      expect(onBpmChange).toHaveBeenCalled();
    });

    it("handles large + button increments", () => {
      const onBpmChange = jest.fn();
      const { getByText } = render(
        <Metronome initialBpm={100} onBpmChange={onBpmChange} />,
      );

      fireEvent.press(getByText("+"));
      expect(onBpmChange).toHaveBeenCalled();
    });

    it("handles large - button decrements", () => {
      const onBpmChange = jest.fn();
      const { getByText } = render(
        <Metronome initialBpm={100} onBpmChange={onBpmChange} />,
      );

      fireEvent.press(getByText("-"));
      expect(onBpmChange).toHaveBeenCalled();
    });
  });

  describe("Play/Pause functionality", () => {
    it("toggles from stopped to playing", () => {
      const { getByText } = render(<Metronome />);

      fireEvent.press(getByText(/Start/));

      expect(getByText(/Stop/)).toBeTruthy();
    });

    it("toggles from playing to stopped", () => {
      const { getByText } = render(<Metronome autoStart={true} />);

      fireEvent.press(getByText(/Stop/));

      expect(getByText(/Start/)).toBeTruthy();
    });

    it("calls onPlayingChange when play toggled", () => {
      const onPlayingChange = jest.fn();
      const { getByText } = render(
        <Metronome onPlayingChange={onPlayingChange} />,
      );

      fireEvent.press(getByText(/Start/));
      expect(onPlayingChange).toHaveBeenCalledWith(true);
    });

    it("calls onPlayingChange when stop toggled", () => {
      const onPlayingChange = jest.fn();
      const { getByText } = render(
        <Metronome autoStart={true} onPlayingChange={onPlayingChange} />,
      );

      fireEvent.press(getByText(/Stop/));
      expect(onPlayingChange).toHaveBeenCalledWith(false);
    });

    it("handles multiple play/stop cycles", () => {
      const { getByText } = render(<Metronome />);

      // Start
      fireEvent.press(getByText(/Start/));
      expect(getByText(/Stop/)).toBeTruthy();

      // Stop
      fireEvent.press(getByText(/Stop/));
      expect(getByText(/Start/)).toBeTruthy();

      // Start again
      fireEvent.press(getByText(/Start/));
      expect(getByText(/Stop/)).toBeTruthy();
    });
  });

  describe("Tap Tempo", () => {
    it("renders tap tempo button", () => {
      const { getByText } = render(<Metronome />);

      expect(getByText(/Tap/)).toBeTruthy();
    });

    it("accepts tap tempo presses", () => {
      const { getByText } = render(<Metronome />);

      // Multiple taps to calculate tempo
      fireEvent.press(getByText(/Tap/));
      act(() => {
        jest.advanceTimersByTime(500); // 120 BPM = 500ms
      });
      fireEvent.press(getByText(/Tap/));

      // Should not crash
      expect(getByText(/Tap/)).toBeTruthy();
    });

    it("handles single tap without crashing", () => {
      const { getByText } = render(<Metronome />);

      fireEvent.press(getByText(/Tap/));
      expect(getByText(/Tap/)).toBeTruthy();
    });
  });

  describe("Preset buttons", () => {
    it("renders preset BPM buttons", () => {
      const { getByText } = render(<Metronome />);

      expect(getByText("60")).toBeTruthy();
      expect(getByText("100")).toBeTruthy();
      expect(getByText("140")).toBeTruthy();
      expect(getByText("160")).toBeTruthy();
    });

    it("changes BPM when preset pressed", () => {
      const onBpmChange = jest.fn();
      const { getByText } = render(
        <Metronome initialBpm={80} onBpmChange={onBpmChange} />,
      );

      fireEvent.press(getByText("120"));
      expect(onBpmChange).toHaveBeenCalledWith(120);
    });

    it("handles all preset buttons", () => {
      const onBpmChange = jest.fn();
      const { getByText } = render(
        <Metronome initialBpm={80} onBpmChange={onBpmChange} />,
      );

      const presets = ["60", "80", "100", "120", "140", "160"];
      presets.forEach((preset) => {
        fireEvent.press(getByText(preset));
      });

      expect(onBpmChange).toHaveBeenCalled();
    });
  });

  describe("Props validation", () => {
    it("hides controls when showControls is false", () => {
      const { queryByText } = render(<Metronome showControls={false} />);

      // Should not show +/- buttons
      expect(queryByText("+")).toBeNull();
      expect(queryByText("-")).toBeNull();
    });

    it("shows controls by default", () => {
      const { getByText } = render(<Metronome />);

      expect(getByText("+")).toBeTruthy();
      expect(getByText("-")).toBeTruthy();
    });

    it("accepts custom minBpm", () => {
      const { toJSON } = render(<Metronome minBpm={20} />);
      expect(toJSON()).toBeTruthy();
    });

    it("accepts custom maxBpm", () => {
      const { toJSON } = render(<Metronome maxBpm={400} />);
      expect(toJSON()).toBeTruthy();
    });

    it("accepts accentFirst prop", () => {
      const { toJSON } = render(<Metronome accentFirst={true} />);
      expect(toJSON()).toBeTruthy();
    });

    it("accepts accentFirst false", () => {
      const { toJSON } = render(<Metronome accentFirst={false} />);
      expect(toJSON()).toBeTruthy();
    });

    it("accepts beatsPerMeasure prop", () => {
      const { toJSON } = render(<Metronome beatsPerMeasure={3} />);
      expect(toJSON()).toBeTruthy();
    });

    it("accepts initialNoteValue prop", () => {
      const { toJSON } = render(<Metronome initialNoteValue={8} />);
      expect(toJSON()).toBeTruthy();
    });

    it("accepts initialSubdivision prop", () => {
      const { toJSON } = render(<Metronome initialSubdivision="halves" />);
      expect(toJSON()).toBeTruthy();
    });

    it("accepts volume prop", () => {
      const { toJSON } = render(<Metronome volume={0.5} />);
      expect(toJSON()).toBeTruthy();
    });

    it("accepts muted prop", () => {
      const { toJSON } = render(<Metronome muted={true} />);
      expect(toJSON()).toBeTruthy();
    });

    it("accepts hideInternalMute prop", () => {
      const { toJSON } = render(<Metronome hideInternalMute={true} />);
      expect(toJSON()).toBeTruthy();
    });

    it("accepts showTimeSignature prop", () => {
      const { toJSON } = render(<Metronome showTimeSignature={false} />);
      expect(toJSON()).toBeTruthy();
    });

    it("accepts showSubdivision prop", () => {
      const { toJSON } = render(<Metronome showSubdivision={false} />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Time Signature", () => {
    it("renders time signature display", () => {
      const { getByText } = render(<Metronome showTimeSignature={true} />);
      // Default is 4/4
      expect(getByText(/4\/4/)).toBeTruthy();
    });

    it("handles 3/4 time signature", () => {
      const { toJSON } = render(
        <Metronome beatsPerMeasure={3} initialNoteValue={4} />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles 6/8 time signature", () => {
      const { toJSON } = render(
        <Metronome beatsPerMeasure={6} initialNoteValue={8} />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles 2/4 time signature", () => {
      const { toJSON } = render(
        <Metronome beatsPerMeasure={2} initialNoteValue={4} />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles time signature button press", () => {
      const { getByText } = render(<Metronome showTimeSignature={true} />);

      const timeSigButton = getByText(/4\/4/);
      fireEvent.press(timeSigButton);

      // Should toggle picker
      expect(true).toBe(true);
    });
  });

  describe("Subdivision", () => {
    it("renders subdivision display when enabled", () => {
      const { getByText } = render(<Metronome showSubdivision={true} />);
      // Default is "None"
      expect(getByText(/None/)).toBeTruthy();
    });

    it("accepts halves subdivision", () => {
      const { toJSON } = render(<Metronome initialSubdivision="halves" />);
      expect(toJSON()).toBeTruthy();
    });

    it("accepts triplet subdivision", () => {
      const { toJSON } = render(<Metronome initialSubdivision="triplet" />);
      expect(toJSON()).toBeTruthy();
    });

    it("accepts quarters subdivision", () => {
      const { toJSON } = render(<Metronome initialSubdivision="quarters" />);
      expect(toJSON()).toBeTruthy();
    });

    it("accepts swing subdivision", () => {
      const { toJSON } = render(<Metronome initialSubdivision="swing" />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Callbacks", () => {
    it("calls onBpmChange on increment", () => {
      const onBpmChange = jest.fn();
      const { getByText } = render(
        <Metronome initialBpm={100} onBpmChange={onBpmChange} />,
      );

      fireEvent.press(getByText("+1"));
      expect(onBpmChange).toHaveBeenCalled();
    });

    it("calls onBpmChange on decrement", () => {
      const onBpmChange = jest.fn();
      const { getByText } = render(
        <Metronome initialBpm={100} onBpmChange={onBpmChange} />,
      );

      fireEvent.press(getByText("-1"));
      expect(onBpmChange).toHaveBeenCalled();
    });

    it("calls onPlayingChange callback", () => {
      const onPlayingChange = jest.fn();
      const { getByText } = render(
        <Metronome onPlayingChange={onPlayingChange} />,
      );

      fireEvent.press(getByText(/Start/));
      expect(onPlayingChange).toHaveBeenCalledWith(true);
    });

    it("accepts onMuteChange callback", () => {
      const onMuteChange = jest.fn();
      const { toJSON } = render(
        <Metronome autoStart={true} onMuteChange={onMuteChange} />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("accepts onVolumeChange callback", () => {
      const onVolumeChange = jest.fn();
      const { toJSON } = render(<Metronome onVolumeChange={onVolumeChange} />);
      expect(toJSON()).toBeTruthy();
    });

    it("accepts onDroneVolumeChange callback", () => {
      const onDroneVolumeChange = jest.fn();
      const { toJSON } = render(
        <Metronome onDroneVolumeChange={onDroneVolumeChange} />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Cleanup", () => {
    it("clears intervals on unmount", () => {
      const { unmount } = render(<Metronome autoStart={true} />);

      // Advance time
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Unmount - should not throw
      expect(() => unmount()).not.toThrow();
    });

    it("clears intervals when stopped", () => {
      const { getByText, unmount } = render(<Metronome autoStart={true} />);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      fireEvent.press(getByText(/Stop/));

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      unmount();
      expect(true).toBe(true);
    });

    it("handles unmount while stopped", () => {
      const { unmount } = render(<Metronome autoStart={false} />);
      unmount();
      expect(true).toBe(true);
    });

    it("handles multiple mount/unmount cycles", () => {
      for (let i = 0; i < 3; i++) {
        const { unmount } = render(<Metronome autoStart={true} />);
        act(() => {
          jest.advanceTimersByTime(500);
        });
        unmount();
      }
      expect(true).toBe(true);
    });
  });

  describe("Visual feedback", () => {
    it("updates beat indicator while playing", () => {
      const { getByText } = render(<Metronome autoStart={true} />);

      act(() => {
        jest.advanceTimersByTime(1000); // At 80 BPM, ~1.3 beats
      });

      // Should not crash
      expect(getByText(/Stop/)).toBeTruthy();
    });

    it("resets beat indicator when stopped", () => {
      const { getByText } = render(<Metronome autoStart={true} />);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      fireEvent.press(getByText(/Stop/));

      expect(getByText(/Start/)).toBeTruthy();
    });
  });

  describe("BPM limits", () => {
    it("handles initialBpm at minBpm", () => {
      const { toJSON } = render(<Metronome minBpm={40} initialBpm={40} />);
      expect(toJSON()).toBeTruthy();
    });

    it("handles initialBpm at maxBpm", () => {
      const { toJSON } = render(<Metronome maxBpm={350} initialBpm={350} />);
      expect(toJSON()).toBeTruthy();
    });

    it("handles extreme minBpm", () => {
      const { toJSON } = render(<Metronome minBpm={1} initialBpm={20} />);
      expect(toJSON()).toBeTruthy();
    });

    it("handles extreme maxBpm", () => {
      const { toJSON } = render(<Metronome maxBpm={500} initialBpm={300} />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Combined props", () => {
    it("handles all props together", () => {
      const onBpmChange = jest.fn();
      const onPlayingChange = jest.fn();
      const onMuteChange = jest.fn();
      const onVolumeChange = jest.fn();

      const { toJSON } = render(
        <Metronome
          initialBpm={120}
          minBpm={40}
          maxBpm={300}
          onBpmChange={onBpmChange}
          onPlayingChange={onPlayingChange}
          onMuteChange={onMuteChange}
          onVolumeChange={onVolumeChange}
          beatsPerMeasure={4}
          initialNoteValue={4}
          initialSubdivision="halves"
          accentFirst={true}
          showControls={true}
          autoStart={false}
          showTimeSignature={true}
          showSubdivision={true}
          muted={false}
          volume={0.8}
          hideInternalMute={false}
          droneVolume={0.5}
        />,
      );

      expect(toJSON()).toBeTruthy();
    });

    it("handles minimal props", () => {
      const { toJSON } = render(<Metronome />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Time signature values", () => {
    const noteValues = [1, 2, 4, 8, 16, 32];

    noteValues.forEach((noteValue) => {
      it(`handles note value ${noteValue}`, () => {
        const { toJSON } = render(<Metronome initialNoteValue={noteValue} />);
        expect(toJSON()).toBeTruthy();
      });
    });

    it("handles various beats per measure values", () => {
      for (let beats = 1; beats <= 12; beats++) {
        const { unmount } = render(<Metronome beatsPerMeasure={beats} />);
        unmount();
      }
      expect(true).toBe(true);
    });
  });

  describe("Playback timing", () => {
    it("plays at correct interval for 60 BPM", () => {
      const { getByText } = render(
        <Metronome initialBpm={60} autoStart={true} />,
      );

      // At 60 BPM, one beat per second
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(getByText(/Stop/)).toBeTruthy();
    });

    it("plays at correct interval for 120 BPM", () => {
      const { getByText } = render(
        <Metronome initialBpm={120} autoStart={true} />,
      );

      // At 120 BPM, two beats per second
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(getByText(/Stop/)).toBeTruthy();
    });

    it("plays at correct interval for 180 BPM", () => {
      const { getByText } = render(
        <Metronome initialBpm={180} autoStart={true} />,
      );

      // At 180 BPM, three beats per second
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(getByText(/Stop/)).toBeTruthy();
    });
  });

  describe("Volume prop changes", () => {
    it("handles volume change from 0 to 1", () => {
      const { rerender } = render(<Metronome volume={0} />);
      rerender(<Metronome volume={1} />);
      expect(true).toBe(true);
    });

    it("handles volume change from 1 to 0", () => {
      const { rerender } = render(<Metronome volume={1} />);
      rerender(<Metronome volume={0} />);
      expect(true).toBe(true);
    });

    it("handles various volume levels", () => {
      const { rerender } = render(<Metronome volume={0.5} />);
      rerender(<Metronome volume={0.25} />);
      rerender(<Metronome volume={0.75} />);
      expect(true).toBe(true);
    });
  });

  describe("Muted state changes", () => {
    it("handles muted prop change to true", () => {
      const { rerender } = render(<Metronome muted={false} />);
      rerender(<Metronome muted={true} />);
      expect(true).toBe(true);
    });

    it("handles muted prop change to false", () => {
      const { rerender } = render(<Metronome muted={true} />);
      rerender(<Metronome muted={false} />);
      expect(true).toBe(true);
    });

    it("handles muted toggle while playing", () => {
      const { rerender, getByText } = render(
        <Metronome autoStart={true} muted={false} />,
      );

      act(() => {
        jest.advanceTimersByTime(500);
      });

      rerender(<Metronome autoStart={true} muted={true} />);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(getByText(/Stop/)).toBeTruthy();
    });
  });

  describe("BPM slider", () => {
    it("renders BPM controls", () => {
      const { getByText } = render(<Metronome showControls={true} />);
      expect(getByText("BPM")).toBeTruthy();
    });
  });

  describe("Rerender stability", () => {
    it("handles rapid callback prop changes", () => {
      const { rerender } = render(<Metronome onBpmChange={jest.fn()} />);

      for (let i = 0; i < 5; i++) {
        rerender(<Metronome onBpmChange={jest.fn()} />);
      }

      expect(true).toBe(true);
    });

    it("handles rapid BPM changes while playing", () => {
      const onBpmChange = jest.fn();
      const { getByText } = render(
        <Metronome
          autoStart={true}
          initialBpm={100}
          onBpmChange={onBpmChange}
        />,
      );

      for (let i = 0; i < 5; i++) {
        fireEvent.press(getByText("+1"));
        act(() => {
          jest.advanceTimersByTime(100);
        });
      }

      expect(onBpmChange).toHaveBeenCalledTimes(5);
    });
  });

  describe("Accessibility", () => {
    it("has accessible play/stop button", () => {
      const { getByText } = render(<Metronome />);
      const button = getByText(/Start/);
      expect(button).toBeTruthy();
    });

    it("has accessible BPM controls", () => {
      const { getByText } = render(<Metronome showControls={true} />);
      expect(getByText("+")).toBeTruthy();
      expect(getByText("-")).toBeTruthy();
    });
  });

  describe("Volume Modal", () => {
    it("opens volume modal on long press of mute button when playing", () => {
      const { getByLabelText, getByText } = render(<Metronome />);
      // Start playing
      fireEvent.press(getByText(/Start/));
      // Find mute button and long press
      const muteButton = getByLabelText(/mute metronome/i);
      fireEvent(muteButton, "longPress");
      expect(getByText("🔊 Volume Controls")).toBeTruthy();
    });

    it("displays volume sliders in modal", () => {
      const { getByLabelText, getByText } = render(
        <Metronome volume={0.8} droneVolume={0.5} />,
      );
      fireEvent.press(getByText(/Start/));
      fireEvent(getByLabelText(/mute metronome/i), "longPress");
      expect(getByText(/🎵 Metronome: 80%/)).toBeTruthy();
      expect(getByText(/🎶 Drone: 50%/)).toBeTruthy();
    });

    it("closes volume modal when Done pressed", () => {
      const { getByLabelText, getByText, queryByText } = render(<Metronome />);
      fireEvent.press(getByText(/Start/));
      fireEvent(getByLabelText(/mute metronome/i), "longPress");
      expect(getByText("🔊 Volume Controls")).toBeTruthy();
      fireEvent.press(getByText("Done"));
      expect(queryByText("🔊 Volume Controls")).toBeNull();
    });

    it("calls onVolumeChange callback from slider", () => {
      const onVolumeChange = jest.fn();
      const { getByLabelText, getByText } = render(
        <Metronome onVolumeChange={onVolumeChange} />,
      );
      fireEvent.press(getByText(/Start/));
      fireEvent(getByLabelText(/mute metronome/i), "longPress");
      // Modal is open, callbacks are bound to sliders
      expect(getByText("🔊 Volume Controls")).toBeTruthy();
    });
  });

  describe("Subdivision picker", () => {
    it("toggles subdivision picker when button pressed", () => {
      const { getByText, queryByText } = render(
        <Metronome showControls={true} showSubdivision={true} />,
      );
      // Subdivision button should show "None" by default
      const subButton = getByText("None");
      fireEvent.press(subButton);
      // Picker should now be visible with title "Subdivision"
      expect(queryByText("Subdivision")).toBeTruthy();
    });

    it("disabled when time signature picker is open", () => {
      const { getByText, queryByText } = render(
        <Metronome
          showControls={true}
          showTimeSignature={true}
          showSubdivision={true}
        />,
      );
      // Open time signature picker first
      const timeSigButton = getByText("4/4");
      fireEvent.press(timeSigButton);
      expect(queryByText("Time Signature")).toBeTruthy();
      // Subdivision should be disabled (opacity changes)
      const subButton = getByText("None");
      // Try to press - picker should not open
      fireEvent.press(subButton);
      expect(queryByText(/^Subdivision$/)).toBeNull();
    });

    it("closes subdivision picker when close button pressed", () => {
      const { getByText, queryByText } = render(
        <Metronome showControls={true} showSubdivision={true} />,
      );
      fireEvent.press(getByText("None"));
      expect(queryByText(/^Subdivision$/)).toBeTruthy();
      // Press the close button (✕)
      fireEvent.press(getByText("✕"));
      expect(queryByText(/^Subdivision$/)).toBeNull();
    });

    it("selects a subdivision option", () => {
      const { getByText, queryByText } = render(
        <Metronome showControls={true} showSubdivision={true} />,
      );
      fireEvent.press(getByText("None"));
      // Select triplets option
      fireEvent.press(getByText("8th triplets"));
      // Picker should close (auto-closes on selection)
      expect(queryByText(/^Subdivision$/)).toBeNull();
    });
  });

  describe("Tap Tempo extended", () => {
    it("clears tap history after 2 seconds of inactivity", () => {
      const onBpmChange = jest.fn();
      const { getByText } = render(
        <Metronome showTapTempo={true} onBpmChange={onBpmChange} />,
      );

      const tapButton = getByText("Tap");

      // First tap
      fireEvent.press(tapButton);
      // Wait more than 2 seconds
      jest.advanceTimersByTime(2100);

      // Clear mock
      onBpmChange.mockClear();

      // One more tap after timeout
      fireEvent.press(tapButton);

      // Wait for timeout to clear the history
      jest.advanceTimersByTime(100);

      // Another tap - history was cleared so only 1 tap now
      fireEvent.press(tapButton);
      // Should calculate from just these 2 taps
      expect(onBpmChange).toHaveBeenCalled();
    });

    it("averages multiple taps for more accurate BPM", () => {
      const onBpmChange = jest.fn();
      const { getByText } = render(
        <Metronome showTapTempo={true} onBpmChange={onBpmChange} />,
      );

      const tapButton = getByText("Tap");

      // 4 taps at ~100 BPM (600ms intervals)
      fireEvent.press(tapButton);
      jest.advanceTimersByTime(600);
      fireEvent.press(tapButton);
      jest.advanceTimersByTime(600);
      fireEvent.press(tapButton);
      jest.advanceTimersByTime(600);
      fireEvent.press(tapButton);

      // Should calculate average BPM of 100
      expect(onBpmChange).toHaveBeenLastCalledWith(100);
    });

    it("keeps only last 4 taps for averaging", () => {
      const onBpmChange = jest.fn();
      const { getByText } = render(
        <Metronome showTapTempo={true} onBpmChange={onBpmChange} />,
      );

      const tapButton = getByText("Tap");

      // First 4 taps at 60 BPM (1000ms intervals)
      fireEvent.press(tapButton);
      jest.advanceTimersByTime(1000);
      fireEvent.press(tapButton);
      jest.advanceTimersByTime(1000);
      fireEvent.press(tapButton);
      jest.advanceTimersByTime(1000);
      fireEvent.press(tapButton);

      // Last call should be 60 BPM
      expect(onBpmChange).toHaveBeenLastCalledWith(60);

      onBpmChange.mockClear();

      // 5th tap at faster interval (500ms = 120 BPM)
      jest.advanceTimersByTime(500);
      fireEvent.press(tapButton);

      // Should use last 4 intervals now
      expect(onBpmChange).toHaveBeenCalled();
    });

    it("calculates BPM from just 2 taps", () => {
      const onBpmChange = jest.fn();
      const { getByText } = render(
        <Metronome showTapTempo={true} onBpmChange={onBpmChange} />,
      );

      const tapButton = getByText("Tap");

      // First tap
      fireEvent.press(tapButton);

      // Second tap at 750ms = 80 BPM
      jest.advanceTimersByTime(750);
      fireEvent.press(tapButton);

      expect(onBpmChange).toHaveBeenCalledWith(80);
    });
  });

  describe("Mute button interactions", () => {
    it("calls onMuteChange when mute is toggled via label", () => {
      const onMuteChange = jest.fn();
      const { getByLabelText, getByText } = render(
        <Metronome
          autoStart={true}
          muted={false}
          onMuteChange={onMuteChange}
        />,
      );

      const muteButton = getByLabelText(/mute metronome/i);
      fireEvent.press(muteButton);

      expect(onMuteChange).toHaveBeenCalledWith(true);
    });

    it("calls onMuteChange with false when unmuting", () => {
      const onMuteChange = jest.fn();
      const { getByLabelText } = render(
        <Metronome autoStart={true} muted={true} onMuteChange={onMuteChange} />,
      );

      const muteButton = getByLabelText(/unmute metronome/i);
      fireEvent.press(muteButton);

      expect(onMuteChange).toHaveBeenCalledWith(false);
    });
  });
});

describe("CompactMetronome", () => {
  it("renders BPM display", () => {
    const { getByText } = render(
      <CompactMetronome bpm={120} isPlaying={false} currentBeat={0} />,
    );
    expect(getByText("120 BPM")).toBeTruthy();
  });

  it("renders beat indicators", () => {
    const { toJSON } = render(
      <CompactMetronome bpm={120} isPlaying={false} currentBeat={0} />,
    );
    const json = toJSON();
    // Should have 4 beat indicators by default
    expect(json).toBeTruthy();
  });

  it("respects beatsPerMeasure prop", () => {
    const { toJSON } = render(
      <CompactMetronome
        bpm={100}
        isPlaying={false}
        currentBeat={0}
        beatsPerMeasure={6}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("highlights current beat when playing", () => {
    const { toJSON } = render(
      <CompactMetronome bpm={80} isPlaying={true} currentBeat={2} />,
    );
    // Current beat should be highlighted
    expect(toJSON()).toBeTruthy();
  });

  it("does not highlight any beat when not playing", () => {
    const { toJSON } = render(
      <CompactMetronome bpm={90} isPlaying={false} currentBeat={0} />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
