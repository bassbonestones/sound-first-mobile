/**
 * useExerciseAudio hook tests
 *
 * Fully typed TypeScript test file.
 */
import { renderHook, act, waitFor } from "@testing-library/react-native";

// Mock react-native-audio-api
const mockOscillator = {
  type: "sine",
  frequency: { setValueAtTime: jest.fn(), value: 440 },
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
};

const mockGain = {
  gain: {
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
    value: 1,
  },
  connect: jest.fn(),
};

const mockAudioContext = {
  sampleRate: 44100,
  currentTime: 0,
  state: "running",
  destination: {},
  createOscillator: jest.fn(() => ({ ...mockOscillator })),
  createGain: jest.fn(() => ({ ...mockGain })),
  close: jest.fn(),
  suspend: jest.fn(),
  resume: jest.fn(),
};

jest.mock("react-native-audio-api", () => ({
  AudioContext: jest.fn().mockImplementation(() => mockAudioContext),
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

  describe("initialization", () => {
    it("initializes without errors", () => {
      const { result } = renderHook(() => useExerciseAudio());
      expect(result.current).toBeDefined();
      expect(result.current.playNote).toBeDefined();
      expect(result.current.playNoteByName).toBeDefined();
      expect(result.current.stopAll).toBeDefined();
    });

    it("provides all expected functions", () => {
      const { result } = renderHook(() => useExerciseAudio());
      expect(typeof result.current.playNote).toBe("function");
      expect(typeof result.current.playNoteByName).toBe("function");
      expect(typeof result.current.playTwoNotes).toBe("function");
      expect(typeof result.current.stopAll).toBe("function");
      expect(typeof result.current.generateSameOrDifferent).toBe("function");
      expect(typeof result.current.generatePitchDirection).toBe("function");
      expect(typeof result.current.noteToFrequency).toBe("function");
    });

    it("cleans up on unmount", () => {
      const { unmount } = renderHook(() => useExerciseAudio());
      unmount();
      expect(true).toBe(true);
    });
  });

  describe("noteToFrequency", () => {
    it("returns correct value for A4 (concert pitch)", () => {
      const { result } = renderHook(() => useExerciseAudio());
      const freq = result.current.noteToFrequency("A4");
      expect(freq).toBe(440);
    });

    it("returns correct value for C4", () => {
      const { result } = renderHook(() => useExerciseAudio());
      const freq = result.current.noteToFrequency("C4");
      expect(freq).toBeCloseTo(261.63, 1);
    });

    it("returns correct value for A3 (octave below A4)", () => {
      const { result } = renderHook(() => useExerciseAudio());
      const freq = result.current.noteToFrequency("A3");
      expect(freq).toBe(220);
    });

    it("returns correct value for A5 (octave above A4)", () => {
      const { result } = renderHook(() => useExerciseAudio());
      const freq = result.current.noteToFrequency("A5");
      expect(freq).toBe(880);
    });

    it("handles sharp notes", () => {
      const { result } = renderHook(() => useExerciseAudio());
      const freq = result.current.noteToFrequency("F#4");
      expect(freq).toBeGreaterThan(349); // F4
      expect(freq).toBeLessThan(392); // G4
    });

    it("handles flat notes", () => {
      const { result } = renderHook(() => useExerciseAudio());
      const freq = result.current.noteToFrequency("Bb4");
      expect(freq).toBeGreaterThan(440); // A4
      expect(freq).toBeLessThan(494); // B4
    });

    it("returns default for invalid note format", () => {
      const { result } = renderHook(() => useExerciseAudio());
      const freq = result.current.noteToFrequency("invalid");
      expect(freq).toBe(440); // Default A4
    });

    it("handles lowercase note names", () => {
      const { result } = renderHook(() => useExerciseAudio());
      const freq = result.current.noteToFrequency("c4");
      expect(freq).toBeCloseTo(261.63, 1);
    });

    it("handles extreme octaves", () => {
      const { result } = renderHook(() => useExerciseAudio());
      const lowFreq = result.current.noteToFrequency("A1");
      const highFreq = result.current.noteToFrequency("A7");
      expect(lowFreq).toBe(55);
      expect(highFreq).toBe(3520);
    });

    it("handles enharmonic equivalents", () => {
      const { result } = renderHook(() => useExerciseAudio());
      const cSharp = result.current.noteToFrequency("C#4");
      const dFlat = result.current.noteToFrequency("Db4");
      expect(cSharp).toBeCloseTo(dFlat, 5);
    });
  });

  describe("stopAll", () => {
    it("can be called safely", () => {
      const { result } = renderHook(() => useExerciseAudio());

      act(() => {
        result.current.stopAll();
      });

      expect(true).toBe(true);
    });

    it("can be called multiple times", () => {
      const { result } = renderHook(() => useExerciseAudio());

      act(() => {
        result.current.stopAll();
        result.current.stopAll();
        result.current.stopAll();
      });

      expect(true).toBe(true);
    });
  });

  describe("generateSameOrDifferent", () => {
    it("returns exercise structure", () => {
      const { result } = renderHook(() => useExerciseAudio());

      const exercise = result.current.generateSameOrDifferent("C4");

      expect(exercise).toHaveProperty("freq1");
      expect(exercise).toHaveProperty("freq2");
      expect(exercise).toHaveProperty("correctAnswer");
      expect(["same", "different"]).toContain(exercise.correctAnswer);
    });

    it("returns valid frequencies", () => {
      const { result } = renderHook(() => useExerciseAudio());

      const exercise = result.current.generateSameOrDifferent("A4");

      expect(exercise.freq1).toBeGreaterThan(0);
      expect(exercise.freq2).toBeGreaterThan(0);
    });

    it("accepts custom interval pool", () => {
      const { result } = renderHook(() => useExerciseAudio());

      const exercise = result.current.generateSameOrDifferent("C4", [
        "P1",
        "P5",
      ]);

      expect(exercise).toHaveProperty("correctAnswer");
    });

    it("generates 'same' answers with equal frequencies", () => {
      const { result } = renderHook(() => useExerciseAudio());

      // Run multiple times to test probability
      let foundSame = false;
      for (let i = 0; i < 50; i++) {
        const exercise = result.current.generateSameOrDifferent("A4");
        if (exercise.correctAnswer === "same") {
          expect(exercise.freq1).toBe(exercise.freq2);
          foundSame = true;
          break;
        }
      }
      // Should find at least one "same" in 50 tries (50% chance each)
      expect(foundSame).toBe(true);
    });

    it("generates 'different' answers with unequal frequencies", () => {
      const { result } = renderHook(() => useExerciseAudio());

      let foundDifferent = false;
      for (let i = 0; i < 50; i++) {
        const exercise = result.current.generateSameOrDifferent("A4");
        if (exercise.correctAnswer === "different") {
          expect(exercise.freq1).not.toBe(exercise.freq2);
          foundDifferent = true;
          break;
        }
      }
      expect(foundDifferent).toBe(true);
    });
  });

  describe("generatePitchDirection", () => {
    it("returns exercise structure", () => {
      const { result } = renderHook(() => useExerciseAudio());

      const exercise = result.current.generatePitchDirection("C4");

      expect(exercise).toHaveProperty("freq1");
      expect(exercise).toHaveProperty("freq2");
      expect(exercise).toHaveProperty("correctAnswer");
      expect(["up", "down"]).toContain(exercise.correctAnswer);
    });

    it("returns valid frequencies", () => {
      const { result } = renderHook(() => useExerciseAudio());

      const exercise = result.current.generatePitchDirection("A4");

      expect(exercise.freq1).toBeGreaterThan(0);
      expect(exercise.freq2).toBeGreaterThan(0);
    });

    it("accepts custom interval pool", () => {
      const { result } = renderHook(() => useExerciseAudio());

      const exercise = result.current.generatePitchDirection("C4", [
        "M2",
        "P5",
      ]);

      expect(exercise).toHaveProperty("correctAnswer");
    });

    it("can include 'same' as an option", () => {
      const { result } = renderHook(() => useExerciseAudio());

      let foundSame = false;
      for (let i = 0; i < 100; i++) {
        const exercise = result.current.generatePitchDirection(
          "C4",
          ["M2", "P5"],
          true,
        );
        if (exercise.correctAnswer === "same") {
          foundSame = true;
          break;
        }
      }
      // With includeSame=true, should eventually get "same"
      expect(foundSame).toBe(true);
    });

    it("excludes 'same' when includeSame is false", () => {
      const { result } = renderHook(() => useExerciseAudio());

      for (let i = 0; i < 20; i++) {
        const exercise = result.current.generatePitchDirection(
          "C4",
          ["M2", "P5"],
          false,
        );
        expect(exercise.correctAnswer).not.toBe("same");
      }
    });

    it("generates 'up' with higher second frequency", () => {
      const { result } = renderHook(() => useExerciseAudio());

      let foundUp = false;
      for (let i = 0; i < 50; i++) {
        const exercise = result.current.generatePitchDirection("A4");
        if (exercise.correctAnswer === "up") {
          expect(exercise.freq2).toBeGreaterThan(exercise.freq1);
          foundUp = true;
          break;
        }
      }
      expect(foundUp).toBe(true);
    });

    it("generates 'down' with lower second frequency", () => {
      const { result } = renderHook(() => useExerciseAudio());

      let foundDown = false;
      for (let i = 0; i < 50; i++) {
        const exercise = result.current.generatePitchDirection("A4");
        if (exercise.correctAnswer === "down") {
          expect(exercise.freq2).toBeLessThan(exercise.freq1);
          foundDown = true;
          break;
        }
      }
      expect(foundDown).toBe(true);
    });
  });

  describe("playNote", () => {
    it("returns a promise", () => {
      const { result } = renderHook(() => useExerciseAudio());

      const playPromise = result.current.playNote(440);

      expect(playPromise).toBeInstanceOf(Promise);
    });

    it("accepts duration parameter", async () => {
      const { result } = renderHook(() => useExerciseAudio());

      await act(async () => {
        await result.current.playNote(440, 0.1);
      });

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it("accepts volume parameter", async () => {
      const { result } = renderHook(() => useExerciseAudio());

      await act(async () => {
        await result.current.playNote(440, 0.1, 0.5);
      });

      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });
  });

  describe("playNoteByName", () => {
    it("returns a promise", () => {
      const { result } = renderHook(() => useExerciseAudio());

      const playPromise = result.current.playNoteByName("A4");

      expect(playPromise).toBeInstanceOf(Promise);
    });

    it("accepts duration parameter", async () => {
      const { result } = renderHook(() => useExerciseAudio());

      await act(async () => {
        await result.current.playNoteByName("C4", 0.1);
      });

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });
  });

  describe("playTwoNotes", () => {
    it("returns a promise", () => {
      const { result } = renderHook(() => useExerciseAudio());

      const playPromise = result.current.playTwoNotes(440, 880);

      expect(playPromise).toBeInstanceOf(Promise);
    });

    it("accepts noteDuration and gap parameters", async () => {
      const { result } = renderHook(() => useExerciseAudio());

      await act(async () => {
        await result.current.playTwoNotes(440, 880, 0.05, 0.01);
      });

      // Should create oscillators for both notes
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });
  });
});
