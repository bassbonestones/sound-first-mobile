/**
 * Tests for audioHelpers.ts
 * Covers audio context creation and sound generation functions
 */
import { Platform } from "react-native";

// Helper to create a mock AudioContext - must be prefixed with "mock"
function mockCreateAudioContext(options?: { state?: string }) {
  const gainNode = {
    gain: {
      value: 1,
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
    },
    connect: jest.fn(),
  };

  const filterNode = {
    type: "highpass",
    frequency: { value: 1000 },
    Q: { value: 0.5 },
    connect: jest.fn(),
  };

  const oscillatorNode = {
    type: "sine",
    frequency: { setValueAtTime: jest.fn() },
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  };

  const bufferSource = {
    buffer: null as AudioBuffer | null,
    connect: jest.fn(),
    start: jest.fn(),
  };

  return {
    state: options?.state ?? "running",
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    createGain: jest.fn(() => gainNode),
    createBiquadFilter: jest.fn(() => filterNode),
    createOscillator: jest.fn(() => oscillatorNode),
    createBuffer: jest.fn((channels: number, length: number, rate: number) => ({
      numberOfChannels: channels,
      length,
      sampleRate: rate,
      getChannelData: jest.fn(() => new Float32Array(length)),
    })),
    createBufferSource: jest.fn(() => bufferSource),
    close: jest.fn(() => Promise.resolve()),
    resume: jest.fn(() => Promise.resolve()),
  };
}

// Mock react-native-audio-api
jest.mock("react-native-audio-api", () => ({
  AudioContext: jest.fn(() => mockCreateAudioContext()),
}));

describe("audioHelpers", () => {
  let audioHelpers: typeof import("../src/screens/Session/components/exercises/shared/audioHelpers");

  beforeEach(() => {
    jest.resetModules();
    // Clear any cached imports
    jest.isolateModules(() => {
      audioHelpers = require("../src/screens/Session/components/exercises/shared/audioHelpers");
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getAudioContextClass", () => {
    it("returns AudioContext on native platform", () => {
      Platform.OS = "ios" as typeof Platform.OS;
      jest.isolateModules(() => {
        const {
          getAudioContextClass,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        const AudioContextClass = getAudioContextClass();
        expect(AudioContextClass).toBeTruthy();
      });
    });

    it("returns AudioContext for Android", () => {
      Platform.OS = "android" as typeof Platform.OS;
      jest.isolateModules(() => {
        const {
          getAudioContextClass,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        const AudioContextClass = getAudioContextClass();
        expect(AudioContextClass).toBeTruthy();
      });
    });
  });

  describe("createAudioContext", () => {
    it("creates an AudioContext instance on iOS", () => {
      Platform.OS = "ios" as typeof Platform.OS;
      jest.isolateModules(() => {
        const {
          createAudioContext,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        const context = createAudioContext();
        expect(context).toBeTruthy();
      });
    });

    it("creates an AudioContext instance on Android", () => {
      Platform.OS = "android" as typeof Platform.OS;
      jest.isolateModules(() => {
        const {
          createAudioContext,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        const context = createAudioContext();
        expect(context).toBeTruthy();
      });
    });
  });

  describe("createClickSound", () => {
    it("does nothing when audioContext is null", () => {
      Platform.OS = "ios" as typeof Platform.OS;
      jest.isolateModules(() => {
        const {
          createClickSound,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        // Should not throw
        createClickSound(null);
      });
    });

    it("creates click sound with default parameters", () => {
      Platform.OS = "ios" as typeof Platform.OS;
      const mockContext = mockCreateAudioContext();

      jest.isolateModules(() => {
        const {
          createClickSound,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        createClickSound(mockContext);

        expect(mockContext.createBuffer).toHaveBeenCalled();
        expect(mockContext.createBufferSource).toHaveBeenCalled();
        expect(mockContext.createBiquadFilter).toHaveBeenCalled();
        expect(mockContext.createGain).toHaveBeenCalled();
      });
    });

    it("creates accent click with boolean true", () => {
      Platform.OS = "ios" as typeof Platform.OS;
      const mockContext = mockCreateAudioContext();

      jest.isolateModules(() => {
        const {
          createClickSound,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        createClickSound(mockContext, true);

        expect(mockContext.createBuffer).toHaveBeenCalled();
        const gainNode = mockContext.createGain();
        // Accent should have higher volume (0.8 * 1.5)
        expect(gainNode.gain.setValueAtTime).toHaveBeenCalled();
      });
    });

    it("creates normal click with boolean false", () => {
      Platform.OS = "ios" as typeof Platform.OS;
      const mockContext = mockCreateAudioContext();

      jest.isolateModules(() => {
        const {
          createClickSound,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        createClickSound(mockContext, false);

        expect(mockContext.createBuffer).toHaveBeenCalled();
      });
    });

    it("creates click with custom frequency and parameters", () => {
      Platform.OS = "ios" as typeof Platform.OS;
      const mockContext = mockCreateAudioContext();

      jest.isolateModules(() => {
        const {
          createClickSound,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        createClickSound(mockContext, 2000, 0.1, 0.7);

        expect(mockContext.createBuffer).toHaveBeenCalled();
        expect(mockContext.createBiquadFilter).toHaveBeenCalled();
      });
    });
  });

  describe("playTone", () => {
    it("returns null when audioContext is null", () => {
      Platform.OS = "ios" as typeof Platform.OS;
      jest.isolateModules(() => {
        const {
          playTone,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        const result = playTone(null, 440);
        expect(result).toBeNull();
      });
    });

    it("plays tone at specified frequency", () => {
      Platform.OS = "ios" as typeof Platform.OS;
      const mockContext = mockCreateAudioContext();

      jest.isolateModules(() => {
        const {
          playTone,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        const oscillator = playTone(mockContext, 440);

        expect(mockContext.createOscillator).toHaveBeenCalled();
        expect(mockContext.createGain).toHaveBeenCalled();
        expect(oscillator).toBeTruthy();
      });
    });

    it("plays tone with custom duration and volume", () => {
      Platform.OS = "ios" as typeof Platform.OS;
      const mockContext = mockCreateAudioContext();

      jest.isolateModules(() => {
        const {
          playTone,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        const oscillator = playTone(mockContext, 880, 2, 0.8);

        expect(oscillator).toBeTruthy();
      });
    });

    it("plays tone with different waveforms", () => {
      Platform.OS = "ios" as typeof Platform.OS;
      const waveforms = ["sine", "triangle", "square", "sawtooth"] as const;

      waveforms.forEach((waveform) => {
        const mockContext = mockCreateAudioContext();

        jest.isolateModules(() => {
          const {
            playTone,
          } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
          const oscillator = playTone(mockContext, 440, 1, 0.5, waveform);

          expect(oscillator).toBeTruthy();
        });
      });
    });
  });

  describe("playNote", () => {
    it("returns null when audioContext is null", () => {
      Platform.OS = "ios" as typeof Platform.OS;
      jest.isolateModules(() => {
        const {
          playNote,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        const result = playNote(null, "C4");
        expect(result).toBeNull();
      });
    });

    it("plays note by name using noteToFrequency", () => {
      Platform.OS = "ios" as typeof Platform.OS;
      const mockContext = mockCreateAudioContext();

      jest.isolateModules(() => {
        const {
          playNote,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        const oscillator = playNote(mockContext, "A4");

        expect(mockContext.createOscillator).toHaveBeenCalled();
        expect(oscillator).toBeTruthy();
      });
    });

    it("plays note with custom parameters", () => {
      Platform.OS = "ios" as typeof Platform.OS;
      const mockContext = mockCreateAudioContext();

      jest.isolateModules(() => {
        const {
          playNote,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        const oscillator = playNote(mockContext, "C5", 2, 0.7, "triangle");

        expect(oscillator).toBeTruthy();
      });
    });
  });

  describe("cleanupAudioContext", () => {
    it("does nothing when audioContext is null", async () => {
      jest.isolateModules(async () => {
        const {
          cleanupAudioContext,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        // Should not throw
        await cleanupAudioContext(null);
      });
    });

    it("closes audioContext when not already closed", async () => {
      Platform.OS = "ios" as typeof Platform.OS;
      const mockContext = mockCreateAudioContext({ state: "running" });

      jest.isolateModules(async () => {
        const {
          cleanupAudioContext,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        await cleanupAudioContext(mockContext);

        expect(mockContext.close).toHaveBeenCalled();
      });
    });

    it("does not close audioContext when already closed", async () => {
      Platform.OS = "ios" as typeof Platform.OS;
      const mockContext = mockCreateAudioContext({ state: "closed" });

      jest.isolateModules(async () => {
        const {
          cleanupAudioContext,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        await cleanupAudioContext(mockContext);

        expect(mockContext.close).not.toHaveBeenCalled();
      });
    });

    it("handles close errors gracefully", async () => {
      Platform.OS = "ios" as typeof Platform.OS;
      const mockContext = mockCreateAudioContext({ state: "running" });
      mockContext.close = jest.fn(() =>
        Promise.reject(new Error("Close failed")),
      );

      jest.isolateModules(async () => {
        const {
          cleanupAudioContext,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        // Should not throw
        await expect(cleanupAudioContext(mockContext)).resolves.toBeUndefined();
      });
    });
  });

  describe("resumeAudioContext", () => {
    it("returns false when audioContext is null", async () => {
      jest.isolateModules(async () => {
        const {
          resumeAudioContext,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        const result = await resumeAudioContext(null);
        expect(result).toBe(false);
      });
    });

    it("resumes suspended audioContext", async () => {
      Platform.OS = "ios" as typeof Platform.OS;
      const mockContext = mockCreateAudioContext({ state: "suspended" });
      mockContext.resume = jest.fn(() => {
        mockContext.state = "running";
        return Promise.resolve();
      });

      jest.isolateModules(async () => {
        const {
          resumeAudioContext,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        const result = await resumeAudioContext(mockContext);

        expect(mockContext.resume).toHaveBeenCalled();
        expect(result).toBe(true);
      });
    });

    it("returns true for already running audioContext", async () => {
      Platform.OS = "ios" as typeof Platform.OS;
      const mockContext = mockCreateAudioContext({ state: "running" });
      mockContext.resume = jest.fn();

      jest.isolateModules(async () => {
        const {
          resumeAudioContext,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        const result = await resumeAudioContext(mockContext);

        expect(mockContext.resume).not.toHaveBeenCalled();
        expect(result).toBe(true);
      });
    });

    it("handles resume errors gracefully", async () => {
      Platform.OS = "ios" as typeof Platform.OS;
      const mockContext = mockCreateAudioContext({ state: "suspended" });
      mockContext.resume = jest.fn(() =>
        Promise.reject(new Error("Resume failed")),
      );

      jest.isolateModules(async () => {
        const {
          resumeAudioContext,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        const result = await resumeAudioContext(mockContext);

        expect(result).toBe(false);
      });
    });
  });

  describe("isAudioContextReady", () => {
    it("returns false when audioContext is null", () => {
      jest.isolateModules(() => {
        const {
          isAudioContextReady,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        expect(isAudioContextReady(null)).toBe(false);
      });
    });

    it("returns true when audioContext is running", () => {
      Platform.OS = "ios" as typeof Platform.OS;
      const mockContext = mockCreateAudioContext({ state: "running" });

      jest.isolateModules(() => {
        const {
          isAudioContextReady,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        expect(isAudioContextReady(mockContext)).toBe(true);
      });
    });

    it("returns false when audioContext is suspended", () => {
      Platform.OS = "ios" as typeof Platform.OS;
      const mockContext = mockCreateAudioContext({ state: "suspended" });

      jest.isolateModules(() => {
        const {
          isAudioContextReady,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        expect(isAudioContextReady(mockContext)).toBe(false);
      });
    });

    it("returns false when audioContext is closed", () => {
      Platform.OS = "ios" as typeof Platform.OS;
      const mockContext = mockCreateAudioContext({ state: "closed" });

      jest.isolateModules(() => {
        const {
          isAudioContextReady,
        } = require("../src/screens/Session/components/exercises/shared/audioHelpers");
        expect(isAudioContextReady(mockContext)).toBe(false);
      });
    });
  });
});
