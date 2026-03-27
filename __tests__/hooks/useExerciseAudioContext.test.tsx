/**
 * @fileoverview Tests for useExerciseAudioContext hook
 */

import { renderHook, act } from "@testing-library/react-native";
import { useExerciseAudioContext } from "../../src/screens/Session/components/exercises/shared/useExerciseAudioContext";

// Mock devLogger
jest.mock("../../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devWarn: jest.fn(),
  devError: jest.fn(),
}));

// Mock audio context
const mockAudioContext = {
  currentTime: 0,
  sampleRate: 44100,
  state: "running",
  destination: {},
  createOscillator: jest.fn(() => ({
    frequency: { value: 440 },
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  })),
  createGain: jest.fn(() => ({
    gain: { value: 1, setValueAtTime: jest.fn() },
    connect: jest.fn(),
  })),
  close: jest.fn(),
  resume: jest.fn(() => Promise.resolve()),
};

jest.mock("react-native-audio-api", () => ({
  AudioContext: jest.fn(() => mockAudioContext),
}));

describe("useExerciseAudioContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAudioContext.state = "running";
  });

  // ==========================================================================
  // INITIALIZATION TESTS
  // ==========================================================================
  describe("Initialization", () => {
    it("initializes audio context on mount", () => {
      const { result } = renderHook(() => useExerciseAudioContext());

      expect(result.current.audioContextRef.current).toBeTruthy();
      expect(result.current.isAudioReady).toBe(true);
    });

    it("provides audioContextRef", () => {
      const { result } = renderHook(() => useExerciseAudioContext());

      expect(result.current.audioContextRef).toBeDefined();
    });

    it("sets isAudioReady to true when context is running", () => {
      const { result } = renderHook(() => useExerciseAudioContext());

      expect(result.current.isAudioReady).toBe(true);
    });

    it("starts with no audio error", () => {
      const { result } = renderHook(() => useExerciseAudioContext());

      expect(result.current.audioError).toBeNull();
    });
  });

  // ==========================================================================
  // SUSPEND/RESUME TESTS
  // ==========================================================================
  describe("Suspend and Resume", () => {
    it("handles suspended context", async () => {
      mockAudioContext.state = "suspended";
      mockAudioContext.resume.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useExerciseAudioContext());

      // Initially may not be ready
      expect(result.current.audioContextRef.current).toBeTruthy();

      // Wait for promise to resolve
      await act(async () => {
        await Promise.resolve();
      });

      expect(mockAudioContext.resume).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // RETRY TESTS
  // ==========================================================================
  describe("Retry Audio Init", () => {
    it("provides retryAudioInit function", () => {
      const { result } = renderHook(() => useExerciseAudioContext());

      expect(typeof result.current.retryAudioInit).toBe("function");
    });

    it("retryAudioInit reinitializes audio context", async () => {
      const { result } = renderHook(() => useExerciseAudioContext());

      await act(async () => {
        result.current.retryAudioInit();
      });

      // Should have cleaned up and reinitialized
      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it("retryAudioInit clears previous error", async () => {
      const { result } = renderHook(() => useExerciseAudioContext());

      await act(async () => {
        result.current.retryAudioInit();
      });

      expect(result.current.audioError).toBeNull();
    });
  });

  // ==========================================================================
  // CLEANUP TESTS
  // ==========================================================================
  describe("Cleanup", () => {
    it("closes audio context on unmount", () => {
      const { unmount } = renderHook(() => useExerciseAudioContext());
      unmount();

      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it("sets ref to null on unmount", () => {
      const { result, unmount } = renderHook(() => useExerciseAudioContext());

      unmount();

      // After unmount the ref should be null
      expect(result.current.audioContextRef.current).toBeNull();
    });
  });

  // ==========================================================================
  // RETURN VALUE TESTS
  // ==========================================================================
  describe("Return Values", () => {
    it("returns correct interface", () => {
      const { result } = renderHook(() => useExerciseAudioContext());

      expect(result.current).toHaveProperty("audioContext");
      expect(result.current).toHaveProperty("audioContextRef");
      expect(result.current).toHaveProperty("isAudioReady");
      expect(result.current).toHaveProperty("audioError");
      expect(result.current).toHaveProperty("retryAudioInit");
    });

    it("audioContextRef is a ref object", () => {
      const { result } = renderHook(() => useExerciseAudioContext());

      expect(result.current.audioContextRef).toHaveProperty("current");
    });
  });

  // ==========================================================================
  // ERROR HANDLING TESTS
  // ==========================================================================
  describe("Error Handling", () => {
    it("handles resume failure gracefully", async () => {
      mockAudioContext.state = "suspended";
      mockAudioContext.resume.mockRejectedValueOnce(new Error("Resume failed"));

      const { result } = renderHook(() => useExerciseAudioContext());

      // Wait for the rejection to be processed
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Should still have an audio context
      expect(result.current.audioContextRef.current).toBeTruthy();
    });

    it("handles audio context creation failure", async () => {
      // Temporarily make AudioContext throw an error
      const { AudioContext: MockAudioContext } = jest.requireMock(
        "react-native-audio-api",
      );
      const originalImpl =
        MockAudioContext.getMockImplementation?.() || (() => mockAudioContext);

      MockAudioContext.mockImplementationOnce(() => {
        throw new Error("AudioContext creation failed");
      });

      const { result } = renderHook(() => useExerciseAudioContext());

      // Wait for error to be processed
      await act(async () => {
        await Promise.resolve();
      });

      // Should have an error
      expect(result.current.audioError).toBeTruthy();
      expect(result.current.audioError?.message).toBe(
        "AudioContext creation failed",
      );

      // Restore
      MockAudioContext.mockImplementation(originalImpl);
    });

    it("handles non-Error objects in catch block", async () => {
      const { AudioContext: MockAudioContext } = jest.requireMock(
        "react-native-audio-api",
      );

      MockAudioContext.mockImplementationOnce(() => {
        throw "String error instead of Error object";
      });

      const { result } = renderHook(() => useExerciseAudioContext());

      await act(async () => {
        await Promise.resolve();
      });

      // Should convert string to Error
      expect(result.current.audioError).toBeTruthy();
      expect(result.current.audioError?.message).toBe(
        "String error instead of Error object",
      );
    });
  });
});
