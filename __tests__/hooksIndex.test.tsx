/**
 * Tests for hooks index barrel exports
 * Verifies all hooks are correctly exported
 */

// Mock AsyncStorage before imports
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

import {
  // useAsyncState
  useAsyncState,
  // useApi
  useApi,
  // useDebounce
  useDebounce,
  useDebouncedCallback,
  // useTuneMasteryData
  useTuneMasteryData,
  ALL_KEYS,
  DEFAULT_TUNES,
  // useSelectionEngine
  useSelectionEngine,
  // useExerciseAudio
  noteToFrequency,
  // usePitchDetection
  usePitchDetection,
} from "../src/hooks";

describe("hooks index exports", () => {
  describe("useAsyncState", () => {
    it("exports useAsyncState function", () => {
      expect(typeof useAsyncState).toBe("function");
    });
  });

  describe("useApi", () => {
    it("exports useApi function", () => {
      expect(typeof useApi).toBe("function");
    });
  });

  describe("useDebounce", () => {
    it("exports useDebounce function", () => {
      expect(typeof useDebounce).toBe("function");
    });

    it("exports useDebouncedCallback function", () => {
      expect(typeof useDebouncedCallback).toBe("function");
    });
  });

  describe("useTuneMasteryData", () => {
    it("exports useTuneMasteryData function", () => {
      expect(typeof useTuneMasteryData).toBe("function");
    });

    it("exports ALL_KEYS array", () => {
      expect(Array.isArray(ALL_KEYS)).toBe(true);
      expect(ALL_KEYS.length).toBeGreaterThan(0);
      expect(ALL_KEYS).toContain("C");
    });

    it("exports DEFAULT_TUNES array", () => {
      expect(Array.isArray(DEFAULT_TUNES)).toBe(true);
    });
  });

  describe("useSelectionEngine", () => {
    it("exports useSelectionEngine function", () => {
      expect(typeof useSelectionEngine).toBe("function");
    });
  });

  describe("useExerciseAudio", () => {
    it("exports noteToFrequency function", () => {
      expect(typeof noteToFrequency).toBe("function");
    });

    it("noteToFrequency returns correct frequency for A4", () => {
      expect(noteToFrequency("A", 4)).toBeCloseTo(440, 1);
    });
  });

  describe("usePitchDetection", () => {
    it("exports usePitchDetection function", () => {
      expect(typeof usePitchDetection).toBe("function");
    });
  });

  describe("type exports", () => {
    // These tests verify the module structure - types are not runtime values
    // but we can verify the exports don't throw
    it("module exports without errors", () => {
      expect(() => {
        const hooks = require("../src/hooks");
        return hooks;
      }).not.toThrow();
    });
  });
});
