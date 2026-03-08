/**
 * Tests for usePitchDetection hook
 */

import { renderHook, act } from "@testing-library/react-native";
import { usePitchDetection } from "../src/hooks/usePitchDetection";

// Mock react-native-live-audio-stream
jest.mock("react-native-live-audio-stream", () => ({
  default: {
    init: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  },
}));

// Mock audio utilities
jest.mock("../src/utils/audioUtils", () => ({
  frequencyToNote: jest.fn((freq) => ({
    note: "A4",
    frequency: 440,
    midiNumber: 69,
  })),
  noteNameToMidi: jest.fn((note) => (note === "A4" ? 69 : null)),
  autoCorrelate: jest.fn(() => -1),
  base64ToFloat32Array: jest.fn(() => new Float32Array(4096)),
}));

// Mock PermissionsAndroid
jest.mock("react-native", () => {
  const rn = jest.requireActual("react-native");
  return {
    ...rn,
    Platform: { OS: "ios" },
    PermissionsAndroid: {
      PERMISSIONS: { RECORD_AUDIO: "android.permission.RECORD_AUDIO" },
      RESULTS: { GRANTED: "granted" },
      request: jest.fn(() => Promise.resolve("granted")),
    },
  };
});

describe("usePitchDetection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

      // Since we mocked the module, isAvailable should be true
      expect(result.current.isAvailable).toBe(true);
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
  });
});
