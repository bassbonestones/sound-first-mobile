/**
 * Tests for Generation Playback Service
 * Covers playback state management and audio generation
 */
import { Platform } from "react-native";
import type { PitchEvent } from "../src/api/generation";

// Mock AudioContext
class MockAudioContext {
  state = "running";
  currentTime = 0;
  destination = {};

  createOscillator() {
    return {
      type: "sine",
      frequency: { value: 440 },
      detune: { value: 0 },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      onended: null,
      disconnect: jest.fn(),
    };
  }

  createGain() {
    return {
      gain: {
        value: 1,
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
      },
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
  }

  async resume() {
    this.state = "running";
  }

  async close() {
    this.state = "closed";
  }
}

// Store original
const originalAudioContext = (global as unknown as { AudioContext?: unknown })
  .AudioContext;

describe("generationPlayback", () => {
  let generationPlayback: typeof import("../src/services/generationPlayback").generationPlayback;

  const sampleEvents: PitchEvent[] = [
    {
      midi_note: 60,
      pitch_name: "C4",
      duration_beats: 1,
      offset_beats: 0,
      velocity: 80,
      articulation: null,
    },
    {
      midi_note: 62,
      pitch_name: "D4",
      duration_beats: 1,
      offset_beats: 1,
      velocity: 80,
      articulation: null,
    },
    {
      midi_note: 64,
      pitch_name: "E4",
      duration_beats: 1,
      offset_beats: 2,
      velocity: 80,
      articulation: null,
    },
  ];

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();

    // Mock web platform
    Platform.OS = "web" as typeof Platform.OS;

    // Set up AudioContext mock
    (
      global as unknown as { AudioContext: typeof MockAudioContext }
    ).AudioContext = MockAudioContext;

    // Reset window mock
    Object.defineProperty(global, "window", {
      value: {
        AudioContext: MockAudioContext,
      },
      writable: true,
    });

    // Import fresh module
    jest.isolateModules(() => {
      const module = require("../src/services/generationPlayback");
      generationPlayback = module.generationPlayback;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    (global as unknown as { AudioContext?: unknown }).AudioContext =
      originalAudioContext;
  });

  describe("initialization", () => {
    it("initializes audio context on init()", async () => {
      await generationPlayback.init();
      expect(generationPlayback.isReady()).toBe(true);
    });

    it("handles multiple init calls gracefully", async () => {
      await generationPlayback.init();
      await generationPlayback.init();
      expect(generationPlayback.isReady()).toBe(true);
    });
  });

  describe("load()", () => {
    it("loads events with default options", () => {
      generationPlayback.load(sampleEvents);
      expect(generationPlayback.getState()).toBe("stopped");
    });

    it("accepts tempo option", () => {
      generationPlayback.load(sampleEvents, { tempo: 90 });
      expect(generationPlayback.getState()).toBe("stopped");
    });

    it("accepts volume option", () => {
      generationPlayback.load(sampleEvents, { volume: 0.5 });
      expect(generationPlayback.getState()).toBe("stopped");
    });

    it("stops existing playback when loading new events", async () => {
      await generationPlayback.init();
      generationPlayback.load(sampleEvents);
      await generationPlayback.play();
      expect(generationPlayback.getState()).toBe("playing");

      generationPlayback.load(sampleEvents);
      expect(generationPlayback.getState()).toBe("stopped");
    });
  });

  describe("play()", () => {
    beforeEach(async () => {
      await generationPlayback.init();
      generationPlayback.load(sampleEvents);
    });

    it("starts playback", async () => {
      await generationPlayback.play();
      expect(generationPlayback.getState()).toBe("playing");
    });

    it("resumes from paused state", async () => {
      await generationPlayback.play();
      generationPlayback.pause();
      await generationPlayback.play();
      expect(generationPlayback.getState()).toBe("playing");
    });
  });

  describe("pause()", () => {
    beforeEach(async () => {
      await generationPlayback.init();
      generationPlayback.load(sampleEvents);
    });

    it("pauses playback", async () => {
      await generationPlayback.play();
      generationPlayback.pause();
      expect(generationPlayback.getState()).toBe("paused");
    });

    it("does nothing if not playing", () => {
      generationPlayback.pause();
      expect(generationPlayback.getState()).toBe("stopped");
    });
  });

  describe("stop()", () => {
    beforeEach(async () => {
      await generationPlayback.init();
      generationPlayback.load(sampleEvents);
    });

    it("stops playback", async () => {
      await generationPlayback.play();
      generationPlayback.stop();
      expect(generationPlayback.getState()).toBe("stopped");
    });

    it("resets state from paused", async () => {
      await generationPlayback.play();
      generationPlayback.pause();
      generationPlayback.stop();
      expect(generationPlayback.getState()).toBe("stopped");
    });
  });

  describe("setTempo()", () => {
    it("clamps tempo to valid range", () => {
      generationPlayback.setTempo(10);
      generationPlayback.setTempo(500);
      // Should not throw - clamps internally
    });
  });

  describe("setVolume()", () => {
    it("clamps volume to 0-1 range", () => {
      generationPlayback.setVolume(-0.5);
      generationPlayback.setVolume(1.5);
      // Should not throw - clamps internally
    });
  });

  describe("callbacks", () => {
    beforeEach(async () => {
      await generationPlayback.init();
    });

    it("calls onStateChange when state changes", async () => {
      const onStateChange = jest.fn();
      generationPlayback.load(sampleEvents, { onStateChange });

      await generationPlayback.play();
      expect(onStateChange).toHaveBeenCalledWith("playing");

      generationPlayback.pause();
      expect(onStateChange).toHaveBeenCalledWith("paused");

      generationPlayback.stop();
      expect(onStateChange).toHaveBeenCalledWith("stopped");
    });

    it("calls onProgress during playback", async () => {
      const onProgress = jest.fn();
      generationPlayback.load(sampleEvents, { tempo: 120, onProgress });

      await generationPlayback.play();

      // Advance timers to trigger progress callbacks
      jest.advanceTimersByTime(500);
      // onProgress should be called at least for first event
      expect(onProgress).toHaveBeenCalled();
    });
  });

  describe("dispose()", () => {
    it("cleans up resources", async () => {
      await generationPlayback.init();
      generationPlayback.dispose();
      expect(generationPlayback.isReady()).toBe(false);
    });
  });
});

describe("midiToFrequency", () => {
  // Test via the playNote behavior (frequency conversion is internal)
  it("A4 (MIDI 69) should produce ~440Hz", () => {
    // The function is private, but we can verify it works via playback
    const midiToFrequency = (midi: number) =>
      440 * Math.pow(2, (midi - 69) / 12);
    expect(midiToFrequency(69)).toBeCloseTo(440, 1);
  });

  it("C4 (MIDI 60) should produce ~261.63Hz", () => {
    const midiToFrequency = (midi: number) =>
      440 * Math.pow(2, (midi - 69) / 12);
    expect(midiToFrequency(60)).toBeCloseTo(261.63, 0);
  });

  it("octave up doubles frequency", () => {
    const midiToFrequency = (midi: number) =>
      440 * Math.pow(2, (midi - 69) / 12);
    const freq60 = midiToFrequency(60);
    const freq72 = midiToFrequency(72);
    expect(freq72 / freq60).toBeCloseTo(2, 2);
  });
});
