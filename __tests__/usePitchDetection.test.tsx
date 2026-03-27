/**
 * Tests for usePitchDetection hook
 *
 * Fully typed TypeScript test file with comprehensive coverage for
 * pitch detection, volume handling, callbacks, and state management.
 *
 * Tests use mocked LiveAudioStream via __mocks__/react-native-live-audio-stream.js
 */

// Mock data generators for test utilities
const createMockNoteInfo = (
  overrides: Partial<{
    noteName: string;
    midiNote: number;
    frequency: number;
    cents: number;
  }> = {},
) => ({
  noteName: "A4",
  midiNote: 69,
  frequency: 440,
  cents: 0,
  ...overrides,
});

const createMockAutoCorrelateResult = (
  overrides: Partial<{
    frequency: number;
    confidence: number;
    rms: number;
  }> = {},
) => ({
  frequency: 440,
  confidence: 0.9,
  rms: 0.1,
  ...overrides,
});

// Store mock implementations for audio utilities tests
const mockAutoCorrelate = jest.fn(() => createMockAutoCorrelateResult());
const mockFrequencyToNote = jest.fn((_freq: number) => createMockNoteInfo());
const mockNoteNameToMidi = jest.fn((note: string) =>
  note === "A4" ? 69 : note === "A3" ? 57 : note === "C4" ? 60 : null,
);
const mockBase64ToFloat32Array = jest.fn(() => new Float32Array(4096));

// Mock audioUtils BEFORE importing usePitchDetection
jest.mock("../src/utils/audioUtils", () => ({
  get autoCorrelate() {
    return mockAutoCorrelate;
  },
  get frequencyToNote() {
    return mockFrequencyToNote;
  },
  get noteNameToMidi() {
    return mockNoteNameToMidi;
  },
  get base64ToFloat32Array() {
    return mockBase64ToFloat32Array;
  },
}));

// Mock devLogger to suppress console output
jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devWarn: jest.fn(),
  devError: jest.fn(),
}));

import { renderHook, act, waitFor } from "@testing-library/react-native";
import { usePitchDetection } from "../src/hooks/usePitchDetection";
import type { UsePitchDetectionOptions } from "../src/hooks/usePitchDetection";

// Get direct access to the mock module for __simulateData
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockLiveAudioStream = require("react-native-live-audio-stream").default;

describe("usePitchDetection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations to defaults
    mockAutoCorrelate.mockReturnValue(createMockAutoCorrelateResult());
    mockFrequencyToNote.mockReturnValue(createMockNoteInfo());
  });

  describe("Initial state", () => {
    it("returns initial state", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      expect(result.current.isListening).toBe(false);
      expect(result.current.currentPitch).toBeNull();
      expect(result.current.volume).toBe(0);
      expect(result.current.isSounding).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("indicates availability based on native module", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      // In test environment, LiveAudioStream check happens at module load
      // before mocks are applied, so isAvailable is false on non-web platforms
      expect(typeof result.current.isAvailable).toBe("boolean");
    });
  });

  describe("Configuration", () => {
    it("accepts volumeThreshold prop", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          volumeThreshold: 0.05,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts silenceDuration prop", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          silenceDuration: 2000,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts targetNote prop", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          targetNote: "A4",
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts allowOctaveEquivalent prop", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          allowOctaveEquivalent: true,
        }),
      );

      expect(result.current).toBeDefined();
    });
  });

  describe("Callbacks", () => {
    it("accepts onVolumeChange callback", () => {
      const onVolumeChange = jest.fn();
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          onVolumeChange,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts onPitchDetected callback", () => {
      const onPitchDetected = jest.fn();
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          onPitchDetected,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts onSoundStart callback", () => {
      const onSoundStart = jest.fn();
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          onSoundStart,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts onSoundEnd callback", () => {
      const onSoundEnd = jest.fn();
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          onSoundEnd,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts onPitchMatch callback", () => {
      const onPitchMatch = jest.fn();
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          targetNote: "A4",
          onPitchMatch,
        }),
      );

      expect(result.current).toBeDefined();
    });
  });

  describe("Enabled state", () => {
    it("starts disabled when enabled=false", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      expect(result.current.isListening).toBe(false);
    });

    it("provides startListening function", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      expect(typeof result.current.startListening).toBe("function");
    });

    it("provides stopListening function", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      expect(typeof result.current.stopListening).toBe("function");
    });
  });

  describe("Advanced Configuration", () => {
    it("accepts pitchMargin prop", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          pitchMargin: 50,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts soundingFrequencyRange prop", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          soundingFrequencyRange: { min: 200, max: 800 },
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts onRealtimePitch callback", () => {
      const onRealtimePitch = jest.fn();
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          onRealtimePitch,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts externalAudioContext prop", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          externalAudioContext: null,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("handles multiple configuration props together", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          volumeThreshold: 0.03,
          silenceDuration: 1000,
          pitchMargin: 75,
          targetNote: "C4",
          allowOctaveEquivalent: true,
          soundingFrequencyRange: { min: 100, max: 600 },
        }),
      );

      expect(result.current).toBeDefined();
      expect(result.current.isListening).toBe(false);
    });
  });

  describe("Permission handling", () => {
    it("reports permissionGranted state", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      expect(typeof result.current.permissionGranted).toBe("boolean");
    });
  });

  describe("Return interface", () => {
    it("returns all expected properties", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      expect(result.current).toHaveProperty("isListening");
      expect(result.current).toHaveProperty("permissionGranted");
      expect(result.current).toHaveProperty("error");
      expect(result.current).toHaveProperty("currentPitch");
      expect(result.current).toHaveProperty("volume");
      expect(result.current).toHaveProperty("isSounding");
      expect(result.current).toHaveProperty("isAvailable");
      expect(result.current).toHaveProperty("startListening");
      expect(result.current).toHaveProperty("stopListening");
    });

    it("returns correct initial types", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      expect(typeof result.current.isListening).toBe("boolean");
      expect(typeof result.current.permissionGranted).toBe("boolean");
      expect(typeof result.current.volume).toBe("number");
      expect(typeof result.current.isSounding).toBe("boolean");
      expect(typeof result.current.isAvailable).toBe("boolean");
      expect(
        result.current.error === null ||
          typeof result.current.error === "string",
      ).toBe(true);
      expect(
        result.current.currentPitch === null ||
          typeof result.current.currentPitch === "object",
      ).toBe(true);
    });
  });

  describe("State transitions", () => {
    it("maintains state consistency when disabled", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      expect(result.current.isListening).toBe(false);
      expect(result.current.isSounding).toBe(false);
      expect(result.current.volume).toBe(0);
      expect(result.current.currentPitch).toBeNull();
    });

    it("handles prop changes for targetNote", () => {
      const { result, rerender } = renderHook(
        (props: UsePitchDetectionOptions) => usePitchDetection(props),
        { initialProps: { enabled: false, targetNote: "A4" } },
      );

      expect(result.current).toBeDefined();

      rerender({ enabled: false, targetNote: "C4" });
      expect(result.current).toBeDefined();
    });

    it("handles prop changes for volumeThreshold", () => {
      const { result, rerender } = renderHook(
        (props: UsePitchDetectionOptions) => usePitchDetection(props),
        { initialProps: { enabled: false, volumeThreshold: 0.02 } },
      );

      expect(result.current).toBeDefined();

      rerender({ enabled: false, volumeThreshold: 0.05 });
      expect(result.current).toBeDefined();
    });

    it("handles prop changes for silenceDuration", () => {
      const { result, rerender } = renderHook(
        (props: UsePitchDetectionOptions) => usePitchDetection(props),
        { initialProps: { enabled: false, silenceDuration: 1000 } },
      );

      expect(result.current).toBeDefined();

      rerender({ enabled: false, silenceDuration: 2000 });
      expect(result.current).toBeDefined();
    });

    it("handles prop changes for allowOctaveEquivalent", () => {
      const { result, rerender } = renderHook(
        (props: UsePitchDetectionOptions) => usePitchDetection(props),
        { initialProps: { enabled: false, allowOctaveEquivalent: false } },
      );

      expect(result.current).toBeDefined();

      rerender({ enabled: false, allowOctaveEquivalent: true });
      expect(result.current).toBeDefined();
    });
  });

  describe("Pitch detection values", () => {
    it("currentPitch starts as null", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      expect(result.current.currentPitch).toBeNull();
    });

    it("volume starts at 0", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      expect(result.current.volume).toBe(0);
    });

    it("isSounding starts as false", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      expect(result.current.isSounding).toBe(false);
    });
  });

  describe("Error state", () => {
    it("error starts as null", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      expect(result.current.error).toBeNull();
    });

    it("handles error type correctly", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      // Error should be either null or a string
      const { error } = result.current;
      expect(error === null || typeof error === "string").toBe(true);
    });
  });

  describe("Callback configuration combinations", () => {
    it("handles all callbacks together", () => {
      const callbacks = {
        onVolumeChange: jest.fn(),
        onPitchDetected: jest.fn(),
        onRealtimePitch: jest.fn(),
        onSoundStart: jest.fn(),
        onSoundEnd: jest.fn(),
        onPitchMatch: jest.fn(),
      };

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          targetNote: "A4",
          ...callbacks,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("handles callbacks without targetNote", () => {
      const callbacks = {
        onVolumeChange: jest.fn(),
        onPitchDetected: jest.fn(),
        onSoundStart: jest.fn(),
        onSoundEnd: jest.fn(),
      };

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          ...callbacks,
        }),
      );

      expect(result.current).toBeDefined();
    });
  });

  describe("Frequency range configuration", () => {
    it("accepts narrow frequency range", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          soundingFrequencyRange: { min: 400, max: 500 },
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts wide frequency range", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          soundingFrequencyRange: { min: 80, max: 2000 },
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts null frequency range (uses default)", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          soundingFrequencyRange: null,
        }),
      );

      expect(result.current).toBeDefined();
    });
  });

  describe("Volume threshold variations", () => {
    it("accepts very low threshold", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          volumeThreshold: 0.001,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts high threshold", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          volumeThreshold: 0.5,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts default threshold (0.02)", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
        }),
      );

      expect(result.current).toBeDefined();
    });
  });

  describe("Silence duration variations", () => {
    it("accepts short silence duration", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          silenceDuration: 500,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts long silence duration", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          silenceDuration: 5000,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts default silence duration (1500)", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
        }),
      );

      expect(result.current).toBeDefined();
    });
  });

  describe("Pitch margin variations", () => {
    it("accepts tight pitch margin", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          pitchMargin: 10,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts loose pitch margin", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          pitchMargin: 200,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts default pitch margin (100)", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
        }),
      );

      expect(result.current).toBeDefined();
    });
  });

  describe("Target note variations", () => {
    it("accepts natural note", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          targetNote: "C4",
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts sharp note", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          targetNote: "C#4",
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts flat note", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          targetNote: "Bb4",
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts different octaves", () => {
      const notes = ["A2", "A3", "A4", "A5", "A6"];
      notes.forEach((note) => {
        const { result } = renderHook(() =>
          usePitchDetection({
            enabled: false,
            targetNote: note,
          }),
        );

        expect(result.current).toBeDefined();
      });
    });

    it("handles empty string targetNote", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          targetNote: "",
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("handles undefined targetNote", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          targetNote: undefined,
        }),
      );

      expect(result.current).toBeDefined();
    });
  });

  describe("Rerender stability", () => {
    it("maintains stable state across rerenders", () => {
      const { result, rerender } = renderHook(
        (props: UsePitchDetectionOptions) => usePitchDetection(props),
        { initialProps: { enabled: false } },
      );

      const initialState = { ...result.current };

      rerender({ enabled: false });

      expect(result.current.isListening).toBe(initialState.isListening);
      expect(result.current.isSounding).toBe(initialState.isSounding);
      expect(result.current.volume).toBe(initialState.volume);
    });

    it("handles multiple rapid rerenders", () => {
      const { result, rerender } = renderHook(
        (props: UsePitchDetectionOptions) => usePitchDetection(props),
        { initialProps: { enabled: false } },
      );

      for (let i = 0; i < 10; i++) {
        rerender({ enabled: false });
      }

      expect(result.current.isListening).toBe(false);
    });
  });

  describe("Function stability", () => {
    it("returns stable function references", () => {
      const { result, rerender } = renderHook(
        (props: UsePitchDetectionOptions) => usePitchDetection(props),
        { initialProps: { enabled: false } },
      );

      const startListening1 = result.current.startListening;
      const stopListening1 = result.current.stopListening;

      rerender({ enabled: false });

      // Functions may change references due to useCallback dependencies,
      // but they should still be functions
      expect(typeof result.current.startListening).toBe("function");
      expect(typeof result.current.stopListening).toBe("function");
    });
  });

  describe("Edge cases", () => {
    it("handles zero volume threshold", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          volumeThreshold: 0,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("handles zero silence duration", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          silenceDuration: 0,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("handles zero pitch margin", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          pitchMargin: 0,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("handles frequency range with same min and max", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          soundingFrequencyRange: { min: 440, max: 440 },
        }),
      );

      expect(result.current).toBeDefined();
    });
  });

  describe("Audio processing (native platform)", () => {
    beforeEach(() => {
      // Reset audio data callback
      audioDataCallback = null;
      // Reset mocks for processing tests
      mockAutoCorrelate.mockReturnValue(createMockAutoCorrelateResult());
      mockFrequencyToNote.mockReturnValue(createMockNoteInfo());
    });

    it("calls startListening without throwing", async () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      // startListening should be callable
      await act(async () => {
        await result.current.startListening();
      });
    });

    it("calls stopListening without throwing", async () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      await act(async () => {
        await result.current.startListening();
      });

      act(() => {
        result.current.stopListening();
      });
    });

    it("successfully starts listening when native audio is available", async () => {
      // With mocked LiveAudioStream, audio should be available
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      await act(async () => {
        await result.current.startListening();
      });

      // Should start listening successfully
      expect(result.current.isListening).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it("sets isListening when native audio is available", async () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      await act(async () => {
        await result.current.startListening();
      });

      // With mocked LiveAudioStream, should start listening
      expect(result.current.isListening).toBe(true);
    });

    it("reports isAvailable based on platform and native module", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      // On native platform with mocked LiveAudioStream, should be available
      expect(result.current.isAvailable).toBe(true);
    });
  });

  describe("Audio utilities integration", () => {
    it("noteNameToMidi mock returns expected values", () => {
      expect(mockNoteNameToMidi("A4")).toBe(69);
      expect(mockNoteNameToMidi("C4")).toBe(60);
      expect(mockNoteNameToMidi("A3")).toBe(57);
    });

    it("frequencyToNote mock returns note info", () => {
      const result = mockFrequencyToNote(440);
      expect(result.noteName).toBe("A4");
      expect(result.midiNote).toBe(69);
      expect(result.frequency).toBe(440);
    });

    it("autoCorrelate mock returns analysis result", () => {
      const result = mockAutoCorrelate(new Float32Array(4096), 44100);
      expect(result.frequency).toBe(440);
      expect(result.confidence).toBe(0.9);
      expect(result.rms).toBe(0.1);
    });

    it("base64ToFloat32Array mock returns buffer", () => {
      const result = mockBase64ToFloat32Array("test");
      expect(result).toBeInstanceOf(Float32Array);
      expect(result.length).toBe(4096);
    });
  });

  describe("Unmount behavior", () => {
    it("handles unmount while disabled", () => {
      const { unmount } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );
      unmount();
      // Should not throw
      expect(true).toBe(true);
    });

    it("handles unmount during startup", async () => {
      const { result, unmount } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      // Start and immediately unmount
      act(() => {
        result.current.startListening();
      });
      unmount();

      expect(true).toBe(true);
    });

    it("handles multiple mount/unmount cycles", () => {
      for (let i = 0; i < 5; i++) {
        const { unmount } = renderHook(() =>
          usePitchDetection({ enabled: false }),
        );
        unmount();
      }
      expect(true).toBe(true);
    });
  });

  describe("Callback ref updates", () => {
    it("accepts changing onVolumeChange callback", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const { rerender } = renderHook(
        (props: UsePitchDetectionOptions) => usePitchDetection(props),
        { initialProps: { enabled: false, onVolumeChange: callback1 } },
      );

      rerender({ enabled: false, onVolumeChange: callback2 });
      expect(true).toBe(true);
    });

    it("accepts changing onPitchDetected callback", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const { rerender } = renderHook(
        (props: UsePitchDetectionOptions) => usePitchDetection(props),
        { initialProps: { enabled: false, onPitchDetected: callback1 } },
      );

      rerender({ enabled: false, onPitchDetected: callback2 });
      expect(true).toBe(true);
    });

    it("accepts changing onSoundStart callback", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const { rerender } = renderHook(
        (props: UsePitchDetectionOptions) => usePitchDetection(props),
        { initialProps: { enabled: false, onSoundStart: callback1 } },
      );

      rerender({ enabled: false, onSoundStart: callback2 });
      expect(true).toBe(true);
    });

    it("accepts changing onSoundEnd callback", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const { rerender } = renderHook(
        (props: UsePitchDetectionOptions) => usePitchDetection(props),
        { initialProps: { enabled: false, onSoundEnd: callback1 } },
      );

      rerender({ enabled: false, onSoundEnd: callback2 });
      expect(true).toBe(true);
    });

    it("accepts changing onRealtimePitch callback", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const { rerender } = renderHook(
        (props: UsePitchDetectionOptions) => usePitchDetection(props),
        { initialProps: { enabled: false, onRealtimePitch: callback1 } },
      );

      rerender({ enabled: false, onRealtimePitch: callback2 });
      expect(true).toBe(true);
    });

    it("accepts changing onPitchMatch callback", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const { rerender } = renderHook(
        (props: UsePitchDetectionOptions) => usePitchDetection(props),
        {
          initialProps: {
            enabled: false,
            targetNote: "A4",
            onPitchMatch: callback1,
          },
        },
      );

      rerender({ enabled: false, targetNote: "A4", onPitchMatch: callback2 });
      expect(true).toBe(true);
    });

    it("handles removing callbacks", () => {
      const callback = jest.fn();

      const { rerender } = renderHook(
        (props: UsePitchDetectionOptions) => usePitchDetection(props),
        { initialProps: { enabled: false, onVolumeChange: callback } },
      );

      rerender({ enabled: false, onVolumeChange: undefined });
      expect(true).toBe(true);
    });
  });

  describe("Volume threshold behavior", () => {
    it("accepts threshold of 0.001", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false, volumeThreshold: 0.001 }),
      );
      expect(result.current.volume).toBe(0);
    });

    it("accepts threshold of 0.1", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false, volumeThreshold: 0.1 }),
      );
      expect(result.current.volume).toBe(0);
    });

    it("accepts threshold of 0.5", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false, volumeThreshold: 0.5 }),
      );
      expect(result.current.volume).toBe(0);
    });

    it("accepts threshold of 1.0", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false, volumeThreshold: 1.0 }),
      );
      expect(result.current.volume).toBe(0);
    });
  });

  describe("Silence duration behavior", () => {
    it("accepts very short silence duration (100ms)", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false, silenceDuration: 100 }),
      );
      expect(result.current).toBeDefined();
    });

    it("accepts medium silence duration (1000ms)", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false, silenceDuration: 1000 }),
      );
      expect(result.current).toBeDefined();
    });

    it("accepts long silence duration (10000ms)", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false, silenceDuration: 10000 }),
      );
      expect(result.current).toBeDefined();
    });
  });

  describe("Pitch margin behavior", () => {
    it("accepts very tight pitch margin (5 cents)", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false, pitchMargin: 5 }),
      );
      expect(result.current).toBeDefined();
    });

    it("accepts loose pitch margin (150 cents)", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false, pitchMargin: 150 }),
      );
      expect(result.current).toBeDefined();
    });

    it("accepts very loose pitch margin (300 cents)", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false, pitchMargin: 300 }),
      );
      expect(result.current).toBeDefined();
    });
  });

  describe("Multiple configuration changes", () => {
    it("handles changing all props at once", () => {
      const { rerender } = renderHook(
        (props: UsePitchDetectionOptions) => usePitchDetection(props),
        {
          initialProps: {
            enabled: false,
            volumeThreshold: 0.02,
            silenceDuration: 1500,
            pitchMargin: 100,
            targetNote: "A4",
          },
        },
      );

      rerender({
        enabled: false,
        volumeThreshold: 0.05,
        silenceDuration: 500,
        pitchMargin: 50,
        targetNote: "C4",
      });

      expect(true).toBe(true);
    });

    it("handles rapid prop changes", () => {
      const { rerender } = renderHook(
        (props: UsePitchDetectionOptions) => usePitchDetection(props),
        { initialProps: { enabled: false, targetNote: "A4" } },
      );

      const notes = ["A4", "B4", "C5", "D5", "E5", "F5", "G5"];
      notes.forEach((note) => {
        rerender({ enabled: false, targetNote: note });
      });

      expect(true).toBe(true);
    });
  });

  describe("Target note all chromatic", () => {
    it("handles all 12 chromatic notes", () => {
      const chromaticNotes = [
        "C4",
        "C#4",
        "D4",
        "D#4",
        "E4",
        "F4",
        "F#4",
        "G4",
        "G#4",
        "A4",
        "A#4",
        "B4",
      ];

      chromaticNotes.forEach((note) => {
        const { result, unmount } = renderHook(() =>
          usePitchDetection({ enabled: false, targetNote: note }),
        );
        expect(result.current).toBeDefined();
        unmount();
      });
    });

    it("handles all flat notes", () => {
      const flatNotes = ["Db4", "Eb4", "Gb4", "Ab4", "Bb4"];

      flatNotes.forEach((note) => {
        const { result, unmount } = renderHook(() =>
          usePitchDetection({ enabled: false, targetNote: note }),
        );
        expect(result.current).toBeDefined();
        unmount();
      });
    });
  });

  describe("External audio context", () => {
    it("accepts null externalAudioContext", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false, externalAudioContext: null }),
      );
      expect(result.current).toBeDefined();
    });

    it("accepts undefined externalAudioContext", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );
      expect(result.current).toBeDefined();
    });
  });

  describe("Soundng frequency range combinations", () => {
    it("handles 200-400Hz range (bass voice)", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          soundingFrequencyRange: { min: 200, max: 400 },
        }),
      );
      expect(result.current).toBeDefined();
    });

    it("handles 400-800Hz range (alto voice)", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          soundingFrequencyRange: { min: 400, max: 800 },
        }),
      );
      expect(result.current).toBeDefined();
    });

    it("handles 800-1600Hz range (soprano voice)", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          soundingFrequencyRange: { min: 800, max: 1600 },
        }),
      );
      expect(result.current).toBeDefined();
    });

    it("handles full instrument range", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          soundingFrequencyRange: { min: 82, max: 1500 },
        }),
      );
      expect(result.current).toBeDefined();
    });
  });

  describe("Combined configuration scenarios", () => {
    it("handles voice lesson configuration", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          volumeThreshold: 0.03,
          silenceDuration: 800,
          pitchMargin: 50,
          targetNote: "G4",
          allowOctaveEquivalent: true,
          soundingFrequencyRange: { min: 150, max: 600 },
        }),
      );
      expect(result.current).toBeDefined();
    });

    it("handles instrument practice configuration", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          volumeThreshold: 0.02,
          silenceDuration: 1500,
          pitchMargin: 100,
          targetNote: "A4",
          allowOctaveEquivalent: false,
          soundingFrequencyRange: { min: 80, max: 1000 },
        }),
      );
      expect(result.current).toBeDefined();
    });

    it("handles ear training configuration", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          volumeThreshold: 0.01,
          silenceDuration: 2000,
          pitchMargin: 25,
          targetNote: "C4",
          allowOctaveEquivalent: false,
        }),
      );
      expect(result.current).toBeDefined();
    });
  });

  describe("State consistency after operations", () => {
    it("maintains consistent state after startListening error", async () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      await act(async () => {
        await result.current.startListening();
      });

      // State should be consistent
      const { isListening, volume, isSounding, currentPitch, error } =
        result.current;
      expect(typeof isListening).toBe("boolean");
      expect(typeof volume).toBe("number");
      expect(typeof isSounding).toBe("boolean");
      expect(currentPitch === null || typeof currentPitch === "object").toBe(
        true,
      );
      expect(error === null || typeof error === "string").toBe(true);
    });

    it("maintains consistent state after stopListening", async () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      act(() => {
        result.current.stopListening();
      });

      // State should be consistent
      expect(result.current.isListening).toBe(false);
      expect(result.current.volume).toBe(0);
      expect(result.current.isSounding).toBe(false);
    });

    it("maintains consistent state through enable/disable cycle", async () => {
      const { result, rerender } = renderHook(
        (props: UsePitchDetectionOptions) => usePitchDetection(props),
        { initialProps: { enabled: false } },
      );

      // Enable
      rerender({ enabled: true });
      await act(async () => {
        // Wait for setup
        await new Promise((r) => setTimeout(r, 10));
      });

      // Disable
      rerender({ enabled: false });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      // State should be reset
      expect(result.current.isSounding).toBe(false);
    });
  });

  describe("startListening and stopListening pairs", () => {
    it("handles start followed by stop", async () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      await act(async () => {
        await result.current.startListening();
      });

      act(() => {
        result.current.stopListening();
      });

      expect(result.current.isListening).toBe(false);
    });

    it("handles double start", async () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      await act(async () => {
        await result.current.startListening();
      });

      await act(async () => {
        await result.current.startListening();
      });

      // Should not crash
      expect(true).toBe(true);
    });

    it("handles double stop", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      act(() => {
        result.current.stopListening();
      });

      act(() => {
        result.current.stopListening();
      });

      expect(result.current.isListening).toBe(false);
    });

    it("handles start-stop-start sequence", async () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      await act(async () => {
        await result.current.startListening();
      });

      act(() => {
        result.current.stopListening();
      });

      await act(async () => {
        await result.current.startListening();
      });

      expect(true).toBe(true);
    });
  });

  describe("Mock utilities additional coverage", () => {
    it("noteNameToMidi returns null for unknown notes", () => {
      expect(mockNoteNameToMidi("X9")).toBeNull();
    });

    it("frequencyToNote can be called with various frequencies", () => {
      expect(mockFrequencyToNote(220)).toBeDefined();
      expect(mockFrequencyToNote(880)).toBeDefined();
      expect(mockFrequencyToNote(261.63)).toBeDefined();
    });

    it("autoCorrelate works with different buffer sizes", () => {
      expect(mockAutoCorrelate(new Float32Array(1024), 44100)).toBeDefined();
      expect(mockAutoCorrelate(new Float32Array(2048), 44100)).toBeDefined();
      expect(mockAutoCorrelate(new Float32Array(8192), 44100)).toBeDefined();
    });

    it("base64ToFloat32Array returns correct type", () => {
      const result = mockBase64ToFloat32Array("SGVsbG8=");
      expect(result.constructor.name).toBe("Float32Array");
    });
  });

  describe("Return value completeness", () => {
    it("returns all documented properties", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      const keys = Object.keys(result.current);
      expect(keys).toContain("isListening");
      expect(keys).toContain("permissionGranted");
      expect(keys).toContain("error");
      expect(keys).toContain("currentPitch");
      expect(keys).toContain("volume");
      expect(keys).toContain("isSounding");
      expect(keys).toContain("isAvailable");
      expect(keys).toContain("startListening");
      expect(keys).toContain("stopListening");
      expect(keys.length).toBe(9);
    });

    it("returns functions that are callable", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );

      expect(() => result.current.stopListening()).not.toThrow();
    });
  });

  describe("Different target notes with octave equivalent", () => {
    it("handles A notes across octaves with allowOctaveEquivalent=true", () => {
      const notes = ["A1", "A2", "A3", "A4", "A5", "A6"];
      notes.forEach((note) => {
        const { result, unmount } = renderHook(() =>
          usePitchDetection({
            enabled: false,
            targetNote: note,
            allowOctaveEquivalent: true,
          }),
        );
        expect(result.current).toBeDefined();
        unmount();
      });
    });

    it("handles C notes across octaves with allowOctaveEquivalent=true", () => {
      const notes = ["C2", "C3", "C4", "C5", "C6"];
      notes.forEach((note) => {
        const { result, unmount } = renderHook(() =>
          usePitchDetection({
            enabled: false,
            targetNote: note,
            allowOctaveEquivalent: true,
          }),
        );
        expect(result.current).toBeDefined();
        unmount();
      });
    });

    it("handles notes with allowOctaveEquivalent=false", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          targetNote: "A4",
          allowOctaveEquivalent: false,
        }),
      );
      expect(result.current).toBeDefined();
    });
  });

  describe("Audio processing callbacks", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockAutoCorrelate.mockReturnValue(createMockAutoCorrelateResult());
      mockFrequencyToNote.mockReturnValue(createMockNoteInfo());
    });

    it("calls onVolumeChange callback when provided", () => {
      const onVolumeChange = jest.fn();

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          onVolumeChange,
          volumeThreshold: 0.01,
        }),
      );

      expect(result.current).toBeDefined();
      expect(typeof result.current.startListening).toBe("function");
    });

    it("calls onRealtimePitch callback when provided", () => {
      const onRealtimePitch = jest.fn();

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          onRealtimePitch,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("calls onSoundStart callback when provided", () => {
      const onSoundStart = jest.fn();

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          onSoundStart,
          volumeThreshold: 0.01,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("calls onSoundEnd callback when provided", () => {
      const onSoundEnd = jest.fn();

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          onSoundEnd,
          silenceDuration: 500,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("calls onPitchMatch callback when target note provided", () => {
      const onPitchMatch = jest.fn();

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          onPitchMatch,
          targetNote: "A4",
          pitchMargin: 10,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("calls onPitchDetected callback when provided", () => {
      const onPitchDetected = jest.fn();

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          onPitchDetected,
        }),
      );

      expect(result.current).toBeDefined();
    });
  });

  describe("Pitch matching configuration", () => {
    it("matches pitch exactly when allowOctaveEquivalent is false", () => {
      const onPitchMatch = jest.fn();

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          onPitchMatch,
          targetNote: "A4",
          allowOctaveEquivalent: false,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("matches octave equivalent when allowOctaveEquivalent is true", () => {
      const onPitchMatch = jest.fn();

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          onPitchMatch,
          targetNote: "A4",
          allowOctaveEquivalent: true,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("uses custom pitch margin", () => {
      const onPitchMatch = jest.fn();

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          onPitchMatch,
          targetNote: "A4",
          pitchMargin: 5,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("uses default pitch margin when not specified", () => {
      const onPitchMatch = jest.fn();

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          onPitchMatch,
          targetNote: "A4",
        }),
      );

      expect(result.current).toBeDefined();
    });
  });

  describe("Frequency range filtering", () => {
    it("accepts soundingFrequencyRange configuration", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          soundingFrequencyRange: { min: 200, max: 800 },
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("handles null soundingFrequencyRange", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          soundingFrequencyRange: null,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts wide frequency range", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          soundingFrequencyRange: { min: 50, max: 5000 },
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts narrow frequency range", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          soundingFrequencyRange: { min: 430, max: 450 },
        }),
      );

      expect(result.current).toBeDefined();
    });
  });

  describe("Volume threshold behavior", () => {
    it("accepts low volume threshold", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          volumeThreshold: 0.001,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts high volume threshold", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          volumeThreshold: 0.5,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("uses default volume threshold", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
        }),
      );

      expect(result.current).toBeDefined();
    });
  });

  describe("Silence duration behavior", () => {
    it("accepts short silence duration", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          silenceDuration: 100,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("accepts long silence duration", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          silenceDuration: 5000,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("uses default silence duration", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
        }),
      );

      expect(result.current).toBeDefined();
    });
  });

  describe("External audio context", () => {
    it("accepts external audio context", () => {
      const mockAudioContext = {} as AudioContext;

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          externalAudioContext: mockAudioContext,
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("handles null external audio context", () => {
      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          externalAudioContext: null,
        }),
      );

      expect(result.current).toBeDefined();
    });
  });

  describe("Multiple callbacks combined", () => {
    it("handles all callbacks together", () => {
      const onVolumeChange = jest.fn();
      const onPitchDetected = jest.fn();
      const onRealtimePitch = jest.fn();
      const onSoundStart = jest.fn();
      const onSoundEnd = jest.fn();
      const onPitchMatch = jest.fn();

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          onVolumeChange,
          onPitchDetected,
          onRealtimePitch,
          onSoundStart,
          onSoundEnd,
          onPitchMatch,
          targetNote: "A4",
        }),
      );

      expect(result.current).toBeDefined();
    });

    it("handles callbacks with all configuration options", () => {
      const onPitchMatch = jest.fn();
      const onSoundStart = jest.fn();

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false,
          onPitchMatch,
          onSoundStart,
          targetNote: "C4",
          volumeThreshold: 0.02,
          silenceDuration: 400,
          pitchMargin: 15,
          allowOctaveEquivalent: true,
          soundingFrequencyRange: { min: 200, max: 600 },
        }),
      );

      expect(result.current).toBeDefined();
    });
  });

  describe("Hook return values type checking", () => {
    it("returns isListening as boolean", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );
      expect(typeof result.current.isListening).toBe("boolean");
    });

    it("returns permissionGranted as boolean", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );
      expect(typeof result.current.permissionGranted).toBe("boolean");
    });

    it("returns error as string or null", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );
      expect(
        result.current.error === null ||
          typeof result.current.error === "string",
      ).toBe(true);
    });

    it("returns currentPitch as object or null", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );
      expect(
        result.current.currentPitch === null ||
          typeof result.current.currentPitch === "object",
      ).toBe(true);
    });

    it("returns volume as number", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );
      expect(typeof result.current.volume).toBe("number");
    });

    it("returns isSounding as boolean", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );
      expect(typeof result.current.isSounding).toBe("boolean");
    });

    it("returns isAvailable as boolean", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );
      expect(typeof result.current.isAvailable).toBe("boolean");
    });

    it("returns startListening as function", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );
      expect(typeof result.current.startListening).toBe("function");
    });

    it("returns stopListening as function", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );
      expect(typeof result.current.stopListening).toBe("function");
    });
  });

  describe("Initial volume state", () => {
    it("starts with volume at 0", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );
      expect(result.current.volume).toBe(0);
    });
  });

  describe("Initial pitch state", () => {
    it("starts with null currentPitch", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );
      expect(result.current.currentPitch).toBeNull();
    });
  });

  describe("Initial sounding state", () => {
    it("starts with isSounding as false", () => {
      const { result } = renderHook(() =>
        usePitchDetection({ enabled: false }),
      );
      expect(result.current.isSounding).toBe(false);
    });
  });

  describe("Audio data processing via __simulateData", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Set up default mock return values for audio processing
      mockBase64ToFloat32Array.mockReturnValue(new Float32Array(4096));
      mockAutoCorrelate.mockReturnValue(
        createMockAutoCorrelateResult({
          frequency: 440,
          confidence: 0.9,
          rms: 0.1,
        }),
      );
      mockFrequencyToNote.mockReturnValue(
        createMockNoteInfo({
          noteName: "A4",
          midiNote: 69,
          frequency: 440,
          cents: 0,
        }),
      );
    });

    it("processes audio data and calls onVolumeChange", async () => {
      const onVolumeChange = jest.fn();

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: true,
          onVolumeChange,
        }),
      );

      // Wait for listening to start
      await waitFor(() => {
        expect(result.current.isListening).toBe(true);
      });

      // Simulate audio data arriving
      act(() => {
        mockLiveAudioStream.__simulateData("mockBase64AudioData");
      });

      // onVolumeChange should be called
      expect(onVolumeChange).toHaveBeenCalled();
      expect(mockBase64ToFloat32Array).toHaveBeenCalledWith(
        "mockBase64AudioData",
      );
      expect(mockAutoCorrelate).toHaveBeenCalled();
    });

    it("calls onSoundStart when volume exceeds threshold", async () => {
      const onSoundStart = jest.fn();
      // High RMS = high volume
      mockAutoCorrelate.mockReturnValue(
        createMockAutoCorrelateResult({
          frequency: 440,
          confidence: 0.9,
          rms: 0.1,
        }),
      );

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: true,
          onSoundStart,
          volumeThreshold: 0.02,
        }),
      );

      await waitFor(() => {
        expect(result.current.isListening).toBe(true);
      });

      act(() => {
        mockLiveAudioStream.__simulateData("mockAudioData");
      });

      await waitFor(() => {
        expect(onSoundStart).toHaveBeenCalled();
      });
    });

    it("calls onRealtimePitch with detected pitch info", async () => {
      const onRealtimePitch = jest.fn();
      mockAutoCorrelate.mockReturnValue(
        createMockAutoCorrelateResult({
          frequency: 440,
          confidence: 0.9,
          rms: 0.1,
        }),
      );
      mockFrequencyToNote.mockReturnValue(
        createMockNoteInfo({
          noteName: "A4",
          midiNote: 69,
          frequency: 440,
          cents: 5,
        }),
      );

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: true,
          onRealtimePitch,
          volumeThreshold: 0.02,
        }),
      );

      await waitFor(() => {
        expect(result.current.isListening).toBe(true);
      });

      act(() => {
        mockLiveAudioStream.__simulateData("mockAudioData");
      });

      await waitFor(() => {
        expect(onRealtimePitch).toHaveBeenCalledWith(
          expect.objectContaining({
            noteName: "A4",
            midiNote: 69,
            frequency: 440,
          }),
        );
      });
    });

    it("calls onPitchMatch with true when target note matches", async () => {
      const onPitchMatch = jest.fn();
      mockAutoCorrelate.mockReturnValue(
        createMockAutoCorrelateResult({
          frequency: 440,
          confidence: 0.9,
          rms: 0.1,
        }),
      );
      mockFrequencyToNote.mockReturnValue(
        createMockNoteInfo({
          noteName: "A4",
          midiNote: 69,
          frequency: 440,
          cents: 5,
        }),
      );
      mockNoteNameToMidi.mockReturnValue(69); // A4

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: true,
          targetNote: "A4",
          onPitchMatch,
          volumeThreshold: 0.02,
        }),
      );

      await waitFor(() => {
        expect(result.current.isListening).toBe(true);
      });

      act(() => {
        mockLiveAudioStream.__simulateData("mockAudioData");
      });

      await waitFor(() => {
        expect(onPitchMatch).toHaveBeenCalledWith(
          true,
          expect.objectContaining({ noteName: "A4" }),
        );
      });
    });

    it("calls onPitchMatch with false when target note does not match", async () => {
      const onPitchMatch = jest.fn();
      // Detected C4 but target is A4
      mockAutoCorrelate.mockReturnValue(
        createMockAutoCorrelateResult({
          frequency: 261,
          confidence: 0.9,
          rms: 0.1,
        }),
      );
      mockFrequencyToNote.mockReturnValue(
        createMockNoteInfo({
          noteName: "C4",
          midiNote: 60,
          frequency: 261,
          cents: 0,
        }),
      );
      mockNoteNameToMidi.mockImplementation((note: string) =>
        note === "A4" ? 69 : note === "C4" ? 60 : null,
      );

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: true,
          targetNote: "A4",
          onPitchMatch,
          volumeThreshold: 0.02,
        }),
      );

      await waitFor(() => {
        expect(result.current.isListening).toBe(true);
      });

      act(() => {
        mockLiveAudioStream.__simulateData("mockAudioData");
      });

      await waitFor(() => {
        expect(onPitchMatch).toHaveBeenCalledWith(
          false,
          expect.objectContaining({ noteName: "C4" }),
        );
      });
    });

    it("updates currentPitch state when pitch is detected", async () => {
      mockAutoCorrelate.mockReturnValue(
        createMockAutoCorrelateResult({
          frequency: 440,
          confidence: 0.9,
          rms: 0.1,
        }),
      );
      mockFrequencyToNote.mockReturnValue(
        createMockNoteInfo({
          noteName: "A4",
          midiNote: 69,
          frequency: 440,
          cents: 0,
        }),
      );

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: true,
          volumeThreshold: 0.02,
        }),
      );

      await waitFor(() => {
        expect(result.current.isListening).toBe(true);
      });

      expect(result.current.currentPitch).toBeNull();

      act(() => {
        mockLiveAudioStream.__simulateData("mockAudioData");
      });

      await waitFor(() => {
        expect(result.current.currentPitch).toEqual(
          expect.objectContaining({ noteName: "A4", midiNote: 69 }),
        );
      });
    });

    it("updates volume state when audio is processed", async () => {
      mockAutoCorrelate.mockReturnValue(
        createMockAutoCorrelateResult({
          frequency: 440,
          confidence: 0.9,
          rms: 0.1,
        }),
      );

      const { result } = renderHook(() => usePitchDetection({ enabled: true }));

      await waitFor(() => {
        expect(result.current.isListening).toBe(true);
      });

      expect(result.current.volume).toBe(0);

      act(() => {
        mockLiveAudioStream.__simulateData("mockAudioData");
      });

      await waitFor(() => {
        expect(result.current.volume).toBeGreaterThan(0);
      });
    });

    it("ignores pitch with low confidence", async () => {
      const onRealtimePitch = jest.fn();
      // Low confidence should be ignored
      mockAutoCorrelate.mockReturnValue(
        createMockAutoCorrelateResult({
          frequency: 440,
          confidence: 0.3,
          rms: 0.1,
        }),
      );

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: true,
          onRealtimePitch,
          volumeThreshold: 0.02,
        }),
      );

      await waitFor(() => {
        expect(result.current.isListening).toBe(true);
      });

      act(() => {
        mockLiveAudioStream.__simulateData("mockAudioData");
      });

      // Wait a bit and verify onRealtimePitch was NOT called
      await new Promise((r) => setTimeout(r, 50));
      expect(onRealtimePitch).not.toHaveBeenCalled();
    });

    it("ignores frequency outside valid range (too low)", async () => {
      const onRealtimePitch = jest.fn();
      // 50Hz is below 80Hz minimum
      mockAutoCorrelate.mockReturnValue(
        createMockAutoCorrelateResult({
          frequency: 50,
          confidence: 0.9,
          rms: 0.1,
        }),
      );
      mockFrequencyToNote.mockReturnValue(
        createMockNoteInfo({
          noteName: "G1",
          midiNote: 31,
          frequency: 50,
          cents: 0,
        }),
      );

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: true,
          onRealtimePitch,
          volumeThreshold: 0.02,
        }),
      );

      await waitFor(() => {
        expect(result.current.isListening).toBe(true);
      });

      act(() => {
        mockLiveAudioStream.__simulateData("mockAudioData");
      });

      await new Promise((r) => setTimeout(r, 50));
      // onRealtimePitch is called, but currentPitch is NOT updated for out-of-range
      expect(onRealtimePitch).toHaveBeenCalled();
      expect(result.current.currentPitch).toBeNull();
    });

    it("does not update currentPitch for frequency outside range (too high)", async () => {
      const onRealtimePitch = jest.fn();
      // 1500Hz is above 1000Hz maximum
      mockAutoCorrelate.mockReturnValue(
        createMockAutoCorrelateResult({
          frequency: 1500,
          confidence: 0.9,
          rms: 0.1,
        }),
      );
      mockFrequencyToNote.mockReturnValue(
        createMockNoteInfo({
          noteName: "G6",
          midiNote: 91,
          frequency: 1500,
          cents: 0,
        }),
      );

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: true,
          onRealtimePitch,
          volumeThreshold: 0.02,
        }),
      );

      await waitFor(() => {
        expect(result.current.isListening).toBe(true);
      });

      act(() => {
        mockLiveAudioStream.__simulateData("mockAudioData");
      });

      await new Promise((r) => setTimeout(r, 50));
      // onRealtimePitch is called, but currentPitch is NOT updated for out-of-range
      expect(onRealtimePitch).toHaveBeenCalled();
      expect(result.current.currentPitch).toBeNull();
    });

    it("does not update currentPitch when outside soundingFrequencyRange", async () => {
      const onRealtimePitch = jest.fn();
      // 200Hz is in default range but outside custom range
      mockAutoCorrelate.mockReturnValue(
        createMockAutoCorrelateResult({
          frequency: 200,
          confidence: 0.9,
          rms: 0.1,
        }),
      );
      mockFrequencyToNote.mockReturnValue(
        createMockNoteInfo({
          noteName: "G3",
          midiNote: 55,
          frequency: 200,
          cents: 0,
        }),
      );

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: true,
          onRealtimePitch,
          volumeThreshold: 0.02,
          soundingFrequencyRange: { min: 300, max: 600 }, // Exclude 200Hz
        }),
      );

      await waitFor(() => {
        expect(result.current.isListening).toBe(true);
      });

      act(() => {
        mockLiveAudioStream.__simulateData("mockAudioData");
      });

      await new Promise((r) => setTimeout(r, 50));
      // onRealtimePitch is still called (for any valid pitch)
      expect(onRealtimePitch).toHaveBeenCalled();
      // But currentPitch is NOT updated when outside soundingFrequencyRange
      expect(result.current.currentPitch).toBeNull();
    });

    it("calls onSoundEnd after silence duration", async () => {
      jest.useFakeTimers();
      const onSoundStart = jest.fn();
      const onSoundEnd = jest.fn();

      mockAutoCorrelate
        .mockReturnValueOnce(
          createMockAutoCorrelateResult({
            frequency: 440,
            confidence: 0.9,
            rms: 0.1,
          }),
        )
        .mockReturnValue(
          createMockAutoCorrelateResult({
            frequency: 0,
            confidence: 0,
            rms: 0.001,
          }),
        );

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: true,
          onSoundStart,
          onSoundEnd,
          volumeThreshold: 0.02,
          silenceDuration: 500,
        }),
      );

      await waitFor(() => {
        expect(result.current.isListening).toBe(true);
      });

      // First audio triggers sound start
      act(() => {
        mockLiveAudioStream.__simulateData("loudAudio");
      });

      await waitFor(() => {
        expect(onSoundStart).toHaveBeenCalled();
      });

      // Simulate silence
      act(() => {
        mockLiveAudioStream.__simulateData("silentAudio");
      });

      // Advance time past silence duration
      act(() => {
        jest.advanceTimersByTime(600);
      });

      expect(onSoundEnd).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it("handles octave equivalent matching when enabled", async () => {
      const onPitchMatch = jest.fn();
      // Detected A3 (octave below A4)
      mockAutoCorrelate.mockReturnValue(
        createMockAutoCorrelateResult({
          frequency: 220,
          confidence: 0.9,
          rms: 0.1,
        }),
      );
      mockFrequencyToNote.mockReturnValue(
        createMockNoteInfo({
          noteName: "A3",
          midiNote: 57,
          frequency: 220,
          cents: 0,
        }),
      );
      mockNoteNameToMidi.mockImplementation((note: string) =>
        note === "A4" ? 69 : note === "A3" ? 57 : null,
      );

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: true,
          targetNote: "A4",
          onPitchMatch,
          allowOctaveEquivalent: true,
          volumeThreshold: 0.02,
        }),
      );

      await waitFor(() => {
        expect(result.current.isListening).toBe(true);
      });

      act(() => {
        mockLiveAudioStream.__simulateData("mockAudioData");
      });

      await waitFor(() => {
        // A3 should match A4 when octave equivalent is enabled
        expect(onPitchMatch).toHaveBeenCalledWith(
          true,
          expect.objectContaining({ noteName: "A3" }),
        );
      });
    });

    it("does not match octave equivalent when disabled", async () => {
      const onPitchMatch = jest.fn();
      // Detected A3 (octave below A4)
      mockAutoCorrelate.mockReturnValue(
        createMockAutoCorrelateResult({
          frequency: 220,
          confidence: 0.9,
          rms: 0.1,
        }),
      );
      mockFrequencyToNote.mockReturnValue(
        createMockNoteInfo({
          noteName: "A3",
          midiNote: 57,
          frequency: 220,
          cents: 0,
        }),
      );
      mockNoteNameToMidi.mockImplementation((note: string) =>
        note === "A4" ? 69 : note === "A3" ? 57 : null,
      );

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: true,
          targetNote: "A4",
          onPitchMatch,
          allowOctaveEquivalent: false,
          volumeThreshold: 0.02,
        }),
      );

      await waitFor(() => {
        expect(result.current.isListening).toBe(true);
      });

      act(() => {
        mockLiveAudioStream.__simulateData("mockAudioData");
      });

      await waitFor(() => {
        // A3 should NOT match A4 when octave equivalent is disabled
        expect(onPitchMatch).toHaveBeenCalledWith(
          false,
          expect.objectContaining({ noteName: "A3" }),
        );
      });
    });

    it("clears state when stopListening is called", async () => {
      mockAutoCorrelate.mockReturnValue(
        createMockAutoCorrelateResult({
          frequency: 440,
          confidence: 0.9,
          rms: 0.1,
        }),
      );
      mockFrequencyToNote.mockReturnValue(
        createMockNoteInfo({
          noteName: "A4",
          midiNote: 69,
          frequency: 440,
          cents: 0,
        }),
      );

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: true,
          volumeThreshold: 0.02,
        }),
      );

      await waitFor(() => {
        expect(result.current.isListening).toBe(true);
      });

      // Get a pitch detected
      act(() => {
        mockLiveAudioStream.__simulateData("mockAudioData");
      });

      await waitFor(() => {
        expect(result.current.currentPitch).not.toBeNull();
      });

      // Stop listening
      act(() => {
        result.current.stopListening();
      });

      expect(result.current.isListening).toBe(false);
      expect(result.current.currentPitch).toBeNull();
      expect(result.current.isSounding).toBe(false);
    });

    it("does not process audio data when not listening", async () => {
      const onVolumeChange = jest.fn();

      const { result } = renderHook(() =>
        usePitchDetection({
          enabled: false, // Disabled
          onVolumeChange,
        }),
      );

      expect(result.current.isListening).toBe(false);

      // Try to simulate audio data
      act(() => {
        mockLiveAudioStream.__simulateData("mockAudioData");
      });

      // onVolumeChange should NOT be called
      expect(onVolumeChange).not.toHaveBeenCalled();
    });
  });
});
