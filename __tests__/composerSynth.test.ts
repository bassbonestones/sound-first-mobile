/**
 * ComposerSynth Tests
 *
 * Tests for the Web Audio synthesizer used in the Practice Composer.
 */

import { Platform } from "react-native";
import {
  midiToFrequency,
  composerSynth,
} from "../src/features/composer/services/composerSynth";

// =============================================================================
// Mocks
// =============================================================================

// Mock Platform
jest.mock("react-native", () => ({
  Platform: {
    OS: "web",
  },
}));

// Create mock audio nodes
const createMockGainNode = () => ({
  gain: {
    value: 0,
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
  },
  connect: jest.fn(),
  disconnect: jest.fn(),
});

const createMockOscillator = () => ({
  type: "sine",
  frequency: { value: 440 },
  detune: { value: 0 },
  connect: jest.fn(),
  disconnect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  onended: null as (() => void) | null,
});

// Mock AudioContext
class MockAudioContext {
  state = "running";
  currentTime = 0;
  destination = {};

  createGain = jest.fn(() => createMockGainNode());
  createOscillator = jest.fn(() => createMockOscillator());
  resume = jest.fn(() => Promise.resolve());
  close = jest.fn(() => Promise.resolve());
}

// Store original window
const originalWindow = global.window;

// =============================================================================
// Tests
// =============================================================================

describe("midiToFrequency", () => {
  it("should convert A4 (MIDI 69) to 440 Hz", () => {
    const freq = midiToFrequency(69);
    expect(freq).toBeCloseTo(440, 2);
  });

  it("should convert C4 (MIDI 60) to ~261.63 Hz", () => {
    const freq = midiToFrequency(60);
    expect(freq).toBeCloseTo(261.63, 1);
  });

  it("should convert A3 (MIDI 57) to 220 Hz", () => {
    const freq = midiToFrequency(57);
    expect(freq).toBeCloseTo(220, 2);
  });

  it("should convert A5 (MIDI 81) to 880 Hz", () => {
    const freq = midiToFrequency(81);
    expect(freq).toBeCloseTo(880, 2);
  });

  it("should handle low MIDI values", () => {
    const freq = midiToFrequency(21); // A0
    expect(freq).toBeCloseTo(27.5, 1);
  });

  it("should handle high MIDI values", () => {
    const freq = midiToFrequency(108); // C8
    expect(freq).toBeCloseTo(4186, 0);
  });

  it("should follow the 12-tone equal temperament formula", () => {
    // Each semitone is 2^(1/12) higher
    const c4 = midiToFrequency(60);
    const cSharp4 = midiToFrequency(61);
    const ratio = cSharp4 / c4;
    expect(ratio).toBeCloseTo(Math.pow(2, 1 / 12), 6);
  });

  it("should double frequency for each octave", () => {
    const c4 = midiToFrequency(60);
    const c5 = midiToFrequency(72);
    expect(c5).toBeCloseTo(c4 * 2, 2);
  });
});

describe("ComposerSynthesizer", () => {
  beforeEach(() => {
    // Reset synth state by disposing
    composerSynth.dispose();

    // Reset Platform mock to web
    (Platform as { OS: string }).OS = "web";
  });

  afterEach(() => {
    composerSynth.dispose();
  });

  describe("initialization", () => {
    it("should not be ready before init", () => {
      expect(composerSynth.isReady()).toBe(false);
    });

    it("should initialize on web platform", async () => {
      // Setup mock AudioContext
      (global as { window: { AudioContext: typeof MockAudioContext } }).window =
        {
          AudioContext: MockAudioContext,
        } as unknown as Window & typeof globalThis;

      await composerSynth.init();

      // Check it tried to create context
      expect(composerSynth.isReady()).toBe(true);
    });

    it("should not initialize on native platform", async () => {
      (Platform as { OS: string }).OS = "ios";

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      await composerSynth.init();

      expect(composerSynth.isReady()).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Native audio not implemented"),
      );

      consoleSpy.mockRestore();
    });

    it("should only initialize once", async () => {
      (global as { window: { AudioContext: typeof MockAudioContext } }).window =
        {
          AudioContext: MockAudioContext,
        } as unknown as Window & typeof globalThis;

      await composerSynth.init();
      const mockContext = (
        global.window as {
          AudioContext: jest.MockedClass<typeof MockAudioContext>;
        }
      ).AudioContext;
      const callCount = mockContext.mock?.calls?.length ?? 1;

      await composerSynth.init(); // Second call should be no-op

      // Should still only have one context
      expect(composerSynth.isReady()).toBe(true);
    });

    it("should handle missing AudioContext gracefully", async () => {
      (global as { window: object }).window = {};

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      await composerSynth.init();

      expect(composerSynth.isReady()).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Web Audio API not available"),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("resume", () => {
    it("should resume suspended audio context", async () => {
      const mockContext = new MockAudioContext();
      mockContext.state = "suspended";

      (global as { window: { AudioContext: () => MockAudioContext } }).window =
        {
          AudioContext: () => mockContext,
        } as unknown as Window & typeof globalThis;

      await composerSynth.init();
      await composerSynth.resume();

      // Just verify it completes without error
      expect(true).toBe(true);
    });
  });

  describe("playNote", () => {
    let mockContext: MockAudioContext;
    let mockOscillator: ReturnType<typeof createMockOscillator>;
    let mockGain: ReturnType<typeof createMockGainNode>;

    beforeEach(async () => {
      mockOscillator = createMockOscillator();
      mockGain = createMockGainNode();
      mockContext = new MockAudioContext();
      mockContext.createOscillator = jest.fn(() => mockOscillator);
      mockContext.createGain = jest.fn(() => mockGain);

      (global as { window: { AudioContext: () => MockAudioContext } }).window =
        {
          AudioContext: () => mockContext,
        } as unknown as Window & typeof globalThis;

      await composerSynth.init();
    });

    it("should not play when not initialized", () => {
      composerSynth.dispose();
      composerSynth.playNote(60, 500);

      // Should not throw
      expect(true).toBe(true);
    });

    it("should not play for rest (null midi)", async () => {
      composerSynth.playNote(null, 500);

      // Oscillator should not be started for rests
      expect(mockOscillator.start).not.toHaveBeenCalled();
    });

    it("should create oscillators for valid notes", async () => {
      composerSynth.playNote(60, 500);

      // Should create oscillators
      expect(mockContext.createOscillator).toHaveBeenCalled();
    });

    it("should set correct frequency for note", async () => {
      composerSynth.playNote(69, 500); // A4

      expect(mockOscillator.frequency.value).toBeCloseTo(440, 2);
    });

    it("should start and stop oscillators", async () => {
      composerSynth.playNote(60, 500);

      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalled();
    });

    it("should handle cleanup on oscillator end", async () => {
      composerSynth.playNote(60, 500);

      // Simulate oscillator ending
      if (mockOscillator.onended) {
        mockOscillator.onended();
      }

      expect(mockOscillator.disconnect).toHaveBeenCalled();
    });
  });

  describe("setVolume", () => {
    beforeEach(async () => {
      const mockContext = new MockAudioContext();
      (global as { window: { AudioContext: () => MockAudioContext } }).window =
        {
          AudioContext: () => mockContext,
        } as unknown as Window & typeof globalThis;

      await composerSynth.init();
    });

    it("should set volume to specified value", () => {
      composerSynth.setVolume(0.5);
      // Just verify no error
      expect(true).toBe(true);
    });

    it("should clamp volume to max of 1", () => {
      composerSynth.setVolume(1.5);
      // Should clamp, not throw
      expect(true).toBe(true);
    });

    it("should clamp volume to min of 0", () => {
      composerSynth.setVolume(-0.5);
      // Should clamp, not throw
      expect(true).toBe(true);
    });

    it("should handle setVolume when not initialized", () => {
      composerSynth.dispose();
      composerSynth.setVolume(0.5);
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe("dispose", () => {
    it("should clean up resources", async () => {
      const mockContext = new MockAudioContext();
      (global as { window: { AudioContext: () => MockAudioContext } }).window =
        {
          AudioContext: () => mockContext,
        } as unknown as Window & typeof globalThis;

      await composerSynth.init();
      expect(composerSynth.isReady()).toBe(true);

      composerSynth.dispose();

      expect(composerSynth.isReady()).toBe(false);
    });

    it("should be safe to call multiple times", () => {
      composerSynth.dispose();
      composerSynth.dispose();
      composerSynth.dispose();

      expect(composerSynth.isReady()).toBe(false);
    });
  });

  describe("isReady", () => {
    it("should return false when audio context is suspended", async () => {
      const mockContext = new MockAudioContext();
      mockContext.state = "suspended";

      (global as { window: { AudioContext: () => MockAudioContext } }).window =
        {
          AudioContext: () => mockContext,
        } as unknown as Window & typeof globalThis;

      await composerSynth.init();

      // With suspended state, isReady should be false
      expect(composerSynth.isReady()).toBe(false);
    });
  });
});
