/**
 * useExerciseAudio hook tests
 *
 * Fully typed TypeScript test file.
 */
import { renderHook, act } from "@testing-library/react-native";

// Mock react-native-audio-api
jest.mock("react-native-audio-api", () => ({
  AudioContext: jest.fn().mockImplementation(() => ({
    sampleRate: 44100,
    currentTime: 0,
    state: "running",
    destination: {},
    createOscillator: jest.fn(() => ({
      type: "sine",
      frequency: { setValueAtTime: jest.fn(), value: 440 },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    })),
    createGain: jest.fn(() => ({
      gain: {
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
        value: 1,
      },
      connect: jest.fn(),
    })),
    close: jest.fn(),
    suspend: jest.fn(),
    resume: jest.fn(),
  })),
}));

// Mock devLogger
jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devWarn: jest.fn(),
  devError: jest.fn(),
}));

import useExerciseAudio from "../src/hooks/useExerciseAudio";

describe("useExerciseAudio", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("initializes without errors", () => {
    const { result } = renderHook(() => useExerciseAudio());
    expect(result.current).toBeDefined();
    expect(result.current.playNote).toBeDefined();
    expect(result.current.playNoteByName).toBeDefined();
    expect(result.current.stopAll).toBeDefined();
  });

  it("provides playNote function", () => {
    const { result } = renderHook(() => useExerciseAudio());
    expect(typeof result.current.playNote).toBe("function");
  });

  it("provides playNoteByName function", () => {
    const { result } = renderHook(() => useExerciseAudio());
    expect(typeof result.current.playNoteByName).toBe("function");
  });

  it("provides playTwoNotes function", () => {
    const { result } = renderHook(() => useExerciseAudio());
    expect(typeof result.current.playTwoNotes).toBe("function");
  });

  it("provides stopAll function", () => {
    const { result } = renderHook(() => useExerciseAudio());
    expect(typeof result.current.stopAll).toBe("function");
  });

  it("provides generateSameOrDifferent function", () => {
    const { result } = renderHook(() => useExerciseAudio());
    expect(typeof result.current.generateSameOrDifferent).toBe("function");
  });

  it("provides generatePitchDirection function", () => {
    const { result } = renderHook(() => useExerciseAudio());
    expect(typeof result.current.generatePitchDirection).toBe("function");
  });

  it("provides noteToFrequency function", () => {
    const { result } = renderHook(() => useExerciseAudio());
    expect(typeof result.current.noteToFrequency).toBe("function");
  });

  it("noteToFrequency returns correct value for A4", () => {
    const { result } = renderHook(() => useExerciseAudio());
    const freq = result.current.noteToFrequency("A4");
    expect(freq).toBe(440);
  });

  it("noteToFrequency returns correct value for C4", () => {
    const { result } = renderHook(() => useExerciseAudio());
    const freq = result.current.noteToFrequency("C4");
    expect(freq).toBeCloseTo(261.63, 1);
  });

  it("stopAll can be called safely", () => {
    const { result } = renderHook(() => useExerciseAudio());

    act(() => {
      result.current.stopAll();
    });

    // Should not throw
    expect(true).toBe(true);
  });

  it("cleans up on unmount", () => {
    const { unmount } = renderHook(() => useExerciseAudio());

    // Should not throw during unmount
    unmount();
    expect(true).toBe(true);
  });

  it("generateSameOrDifferent returns exercise structure", () => {
    const { result } = renderHook(() => useExerciseAudio());

    const exercise = result.current.generateSameOrDifferent("C4");

    expect(exercise).toHaveProperty("freq1");
    expect(exercise).toHaveProperty("freq2");
    expect(exercise).toHaveProperty("correctAnswer");
    expect(["same", "different"]).toContain(exercise.correctAnswer);
  });

  it("generatePitchDirection returns exercise structure", () => {
    const { result } = renderHook(() => useExerciseAudio());

    const exercise = result.current.generatePitchDirection("C4");

    expect(exercise).toHaveProperty("freq1");
    expect(exercise).toHaveProperty("freq2");
    expect(exercise).toHaveProperty("correctAnswer");
    expect(["up", "down"]).toContain(exercise.correctAnswer);
  });
});
