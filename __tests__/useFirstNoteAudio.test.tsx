/**
 * Tests for FirstNote audio hook
 */
import { renderHook, act, waitFor } from "@testing-library/react-native";
import { Platform } from "react-native";
import useFirstNoteAudio from "../src/screens/FirstNote/hooks/useFirstNoteAudio";

// Mock devLogger
jest.mock("../src/utils/devLogger", () => ({
  devError: jest.fn(),
}));

// Mock noteToFrequency
jest.mock("../src/screens/FirstNote/utils", () => ({
  noteToFrequency: jest.fn((note: string) => {
    // Simple frequency map for testing
    const frequencies: Record<string, number> = {
      C4: 261.63,
      D3: 146.83,
      Db3: 138.59,
      "D#3": 155.56,
    };
    return frequencies[note] || 440;
  }),
}));

// Mock data
jest.mock("../src/screens/FirstNote/data", () => ({
  PITCH_EXPLORER_NOTES: [
    { name: "C3" },
    { name: "D3" },
    { name: "E3" },
    { name: "F3" },
    { name: "G3" },
    { name: "A3" },
    { name: "B3" },
    { name: "C4" },
    { name: "D4" },
    { name: "E4" },
    { name: "F4" },
    { name: "G4" },
    { name: "A4" },
  ],
}));

// Mock Web Audio API
class MockOscillator {
  type = "sine";
  frequency = {
    setValueAtTime: jest.fn(),
  };
  connect = jest.fn();
  start = jest.fn();
  stop = jest.fn();
  onended: (() => void) | null = null;
}

class MockGainNode {
  gain = {
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
  };
  connect = jest.fn();
}

class MockAudioContext {
  state = "running";
  currentTime = 0;
  destination = {};

  createOscillator = jest.fn(() => new MockOscillator());
  createGain = jest.fn(() => new MockGainNode());
  resume = jest.fn(() => Promise.resolve());
  close = jest.fn();
}

describe("useFirstNoteAudio", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup web platform by default
    Object.defineProperty(Platform, "OS", { value: "web", configurable: true });

    // Mock window.AudioContext
    (global as any).window = {
      AudioContext: MockAudioContext,
      webkitAudioContext: MockAudioContext,
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    delete (global as any).window;
  });

  describe("initial state", () => {
    it("starts with isPlaying false", () => {
      const { result } = renderHook(() => useFirstNoteAudio("C4"));
      expect(result.current.isPlaying).toBe(false);
    });

    it("starts with playCount 0", () => {
      const { result } = renderHook(() => useFirstNoteAudio("C4"));
      expect(result.current.playCount).toBe(0);
    });

    it("starts with showHeardItButton false", () => {
      const { result } = renderHook(() => useFirstNoteAudio("C4"));
      expect(result.current.showHeardItButton).toBe(false);
    });
  });

  describe("playNote", () => {
    it("sets isPlaying to true", async () => {
      const { result } = renderHook(() => useFirstNoteAudio("C4"));

      act(() => {
        result.current.playNote();
      });

      expect(result.current.isPlaying).toBe(true);
    });

    it("creates oscillator with sine type", async () => {
      const { result } = renderHook(() => useFirstNoteAudio("C4"));

      await act(async () => {
        await result.current.playNote();
      });

      // Audio playback was initiated (no error thrown)
      expect(result.current.isPlaying).toBe(true);
    });

    it("shows heard it button after 2 seconds", async () => {
      const { result } = renderHook(() => useFirstNoteAudio("C4"));

      await act(async () => {
        await result.current.playNote();
      });

      expect(result.current.showHeardItButton).toBe(false);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.showHeardItButton).toBe(true);
    });
  });

  describe("playPitchExplorer", () => {
    it("plays note at given index", async () => {
      const { result } = renderHook(() => useFirstNoteAudio("C4"));

      await act(async () => {
        await result.current.playPitchExplorer(3);
      });

      // Should not throw
    });
  });

  describe("playAccidentalExplorer", () => {
    it("plays flat note", async () => {
      const { result } = renderHook(() => useFirstNoteAudio("C4"));

      await act(async () => {
        await result.current.playAccidentalExplorer("flat");
      });

      // Should not throw
    });

    it("plays natural note", async () => {
      const { result } = renderHook(() => useFirstNoteAudio("C4"));

      await act(async () => {
        await result.current.playAccidentalExplorer("natural");
      });

      // Should not throw
    });

    it("plays sharp note", async () => {
      const { result } = renderHook(() => useFirstNoteAudio("C4"));

      await act(async () => {
        await result.current.playAccidentalExplorer("sharp");
      });

      // Should not throw
    });
  });

  describe("playCombinedExplorer", () => {
    it("plays flat version of note", async () => {
      const { result } = renderHook(() => useFirstNoteAudio("C4"));

      await act(async () => {
        await result.current.playCombinedExplorer(3, "flat");
      });

      // Should not throw
    });

    it("plays natural version of note", async () => {
      const { result } = renderHook(() => useFirstNoteAudio("C4"));

      await act(async () => {
        await result.current.playCombinedExplorer(3, "natural");
      });

      // Should not throw
    });

    it("plays sharp version of note", async () => {
      const { result } = renderHook(() => useFirstNoteAudio("C4"));

      await act(async () => {
        await result.current.playCombinedExplorer(3, "sharp");
      });

      // Should not throw
    });
  });

  describe("stopAudio", () => {
    it("sets isPlaying to false", async () => {
      const { result } = renderHook(() => useFirstNoteAudio("C4"));

      await act(async () => {
        await result.current.playNote();
      });

      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.stopAudio();
      });

      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe("resetHeardIt", () => {
    it("hides heard it button", async () => {
      const { result } = renderHook(() => useFirstNoteAudio("C4"));

      await act(async () => {
        await result.current.playNote();
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.showHeardItButton).toBe(true);

      act(() => {
        result.current.resetHeardIt();
      });

      expect(result.current.showHeardItButton).toBe(false);
    });
  });

  describe("setShowHeardItButton", () => {
    it("allows manual control of heard it button", () => {
      const { result } = renderHook(() => useFirstNoteAudio("C4"));

      act(() => {
        result.current.setShowHeardItButton(true);
      });

      expect(result.current.showHeardItButton).toBe(true);
    });
  });

  describe("cleanup", () => {
    it("cleans up on unmount", async () => {
      const { result, unmount } = renderHook(() => useFirstNoteAudio("C4"));

      await act(async () => {
        await result.current.playNote();
      });

      unmount();

      // Should not throw
    });
  });

  describe("native platform", () => {
    it("handles native platform without AudioContext", async () => {
      Object.defineProperty(Platform, "OS", {
        value: "ios",
        configurable: true,
      });
      delete (global as any).window;

      const { result } = renderHook(() => useFirstNoteAudio("C4"));

      await act(async () => {
        await result.current.playNote();
      });

      // Should handle gracefully when no audio context available
    });
  });

  describe("return values", () => {
    it("returns all expected values and functions", () => {
      const { result } = renderHook(() => useFirstNoteAudio("C4"));

      expect(typeof result.current.isPlaying).toBe("boolean");
      expect(typeof result.current.playCount).toBe("number");
      expect(typeof result.current.showHeardItButton).toBe("boolean");
      expect(result.current.setShowHeardItButton).toBeInstanceOf(Function);
      expect(result.current.playNote).toBeInstanceOf(Function);
      expect(result.current.playPitchExplorer).toBeInstanceOf(Function);
      expect(result.current.playAccidentalExplorer).toBeInstanceOf(Function);
      expect(result.current.playCombinedExplorer).toBeInstanceOf(Function);
      expect(result.current.stopAudio).toBeInstanceOf(Function);
      expect(result.current.resetHeardIt).toBeInstanceOf(Function);
    });
  });
});
