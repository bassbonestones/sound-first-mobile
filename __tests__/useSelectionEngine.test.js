/**
 * Tests for useSelectionEngine hook
 */
import { renderHook } from "@testing-library/react-native";
import { useSelectionEngine } from "../src/hooks/useSelectionEngine";
import { ALL_KEYS } from "../src/hooks/useTuneMasteryData";

// Mock AsyncStorage to prevent native module errors
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Helper to create a tune with specific key scores
const createTune = (id, name, keyScores = {}) => {
  const keys = {};
  ALL_KEYS.forEach((key) => {
    keys[key] = {
      score: keyScores[key] ?? 0,
      attempts: keyScores[key] ? 1 : 0,
    };
  });
  return { id, name, keys };
};

// Helper to create mastered tune (all keys >= 95)
const createMasteredTune = (id, name) => {
  const keyScores = {};
  ALL_KEYS.forEach((key) => {
    keyScores[key] = 95 + Math.floor(Math.random() * 5);
  });
  return createTune(id, name, keyScores);
};

describe("useSelectionEngine", () => {
  describe("with no tunes", () => {
    it("returns null for next pick", () => {
      const data = { activeTunes: [], lastPickType: "reinforcement" };
      const { result } = renderHook(() => useSelectionEngine(data));

      expect(result.current.getNextPick()).toBeNull();
    });

    it("reports zero stats", () => {
      const data = { activeTunes: [], lastPickType: "reinforcement" };
      const { result } = renderHook(() => useSelectionEngine(data));

      expect(result.current.stats.totalTunes).toBe(0);
      expect(result.current.stats.totalMastered).toBe(0);
    });
  });

  describe("learning picks", () => {
    it("selects lowest non-zero scored key", () => {
      const tune = createTune("tune1", "Test", { C: 50, D: 30, E: 70 });
      const data = {
        activeTunes: [tune],
        lastPickType: "reinforcement", // Next will be learning
      };

      const { result } = renderHook(() => useSelectionEngine(data));

      const pick = result.current.getLearningPick();
      expect(pick.tuneId).toBe("tune1");
      expect(pick.key).toBe("D"); // Lowest non-zero
      expect(pick.pickType).toBe("learning");
    });

    it("selects random zero-score key when all non-zero are mastered", () => {
      const tune = createTune("tune1", "Test", { C: 96, D: 97, E: 98 });
      // F, G, etc. are all 0
      const data = {
        activeTunes: [tune],
        lastPickType: "reinforcement",
      };

      const { result } = renderHook(() => useSelectionEngine(data));

      const pick = result.current.getLearningPick();
      expect(pick.tuneId).toBe("tune1");
      // Should be a zero-score key (not C, D, or E)
      expect(["C", "D", "E"]).not.toContain(pick.key);
    });

    it("selects highest-priority incomplete tune", () => {
      const tune1 = createTune("tune1", "First", { C: 50 });
      const tune2 = createTune("tune2", "Second", { C: 40 });
      const data = {
        activeTunes: [tune1, tune2], // tune1 is higher priority
        lastPickType: "reinforcement",
      };

      const { result } = renderHook(() => useSelectionEngine(data));

      const pick = result.current.getLearningPick();
      expect(pick.tuneId).toBe("tune1");
    });
  });

  describe("reinforcement picks", () => {
    it("selects lowest key across all mastered tunes", () => {
      // Create tunes with all keys at 98, then make specific keys lower
      const tune1Keys = {};
      const tune2Keys = {};
      ALL_KEYS.forEach((key) => {
        tune1Keys[key] = 98;
        tune2Keys[key] = 98;
      });
      tune1Keys.C = 95; // Make C the lowest overall
      tune2Keys.D = 96; // D is second lowest

      const tune1 = createTune("tune1", "First", tune1Keys);
      const tune2 = createTune("tune2", "Second", tune2Keys);

      const data = {
        activeTunes: [tune1, tune2],
        lastPickType: "learning", // Next will be reinforcement
      };

      const { result } = renderHook(() => useSelectionEngine(data));

      const pick = result.current.getReinforcementPick();
      expect(pick.tuneId).toBe("tune1");
      expect(pick.key).toBe("C");
      expect(pick.pickType).toBe("reinforcement");
    });

    it("returns null when no mastered tunes", () => {
      const tune = createTune("tune1", "Test", { C: 50 });
      const data = {
        activeTunes: [tune],
        lastPickType: "learning",
      };

      const { result } = renderHook(() => useSelectionEngine(data));

      expect(result.current.getReinforcementPick()).toBeNull();
    });
  });

  describe("alternation logic", () => {
    it("isLearningPick is true when lastPickType is reinforcement", () => {
      const data = { activeTunes: [], lastPickType: "reinforcement" };
      const { result } = renderHook(() => useSelectionEngine(data));

      expect(result.current.isLearningPick).toBe(true);
    });

    it("isLearningPick is false when lastPickType is learning", () => {
      const data = { activeTunes: [], lastPickType: "learning" };
      const { result } = renderHook(() => useSelectionEngine(data));

      expect(result.current.isLearningPick).toBe(false);
    });

    it("getNextPick alternates between learning and reinforcement", () => {
      const incompleteTune = createTune("tune1", "Incomplete", { C: 50 });
      const masteredTune = createMasteredTune("tune2", "Mastered");

      // Next is learning pick
      const data1 = {
        activeTunes: [incompleteTune, masteredTune],
        lastPickType: "reinforcement",
      };
      const { result: result1 } = renderHook(() => useSelectionEngine(data1));
      const pick1 = result1.current.getNextPick();
      expect(pick1.pickType).toBe("learning");

      // Next is reinforcement pick
      const data2 = {
        activeTunes: [incompleteTune, masteredTune],
        lastPickType: "learning",
      };
      const { result: result2 } = renderHook(() => useSelectionEngine(data2));
      const pick2 = result2.current.getNextPick();
      expect(pick2.pickType).toBe("reinforcement");
    });
  });

  describe("stats", () => {
    it("calculates total tunes correctly", () => {
      const data = {
        activeTunes: [
          createTune("1", "A"),
          createTune("2", "B"),
          createTune("3", "C"),
        ],
        lastPickType: "reinforcement",
      };

      const { result } = renderHook(() => useSelectionEngine(data));

      expect(result.current.stats.totalTunes).toBe(3);
    });

    it("calculates mastered tunes correctly", () => {
      const data = {
        activeTunes: [
          createMasteredTune("1", "Mastered1"),
          createMasteredTune("2", "Mastered2"),
          createTune("3", "NotMastered", { C: 50 }),
        ],
        lastPickType: "reinforcement",
      };

      const { result } = renderHook(() => useSelectionEngine(data));

      expect(result.current.stats.totalMastered).toBe(2);
      expect(result.current.stats.totalIncomplete).toBe(1);
    });

    it("calculates average score", () => {
      // All keys at 50 = average of 50
      const tune = createTune("1", "Test", {
        A: 50,
        Bb: 50,
        B: 50,
        C: 50,
        Db: 50,
        D: 50,
        Eb: 50,
        E: 50,
        F: 50,
        Gb: 50,
        G: 50,
        Ab: 50,
      });
      const data = { activeTunes: [tune], lastPickType: "reinforcement" };

      const { result } = renderHook(() => useSelectionEngine(data));

      expect(result.current.stats.averageScore).toBe(50);
    });
  });

  describe("getTuneName", () => {
    it("returns tune name by id", () => {
      const data = {
        activeTunes: [createTune("tune1", "All The Things")],
        lastPickType: "reinforcement",
      };

      const { result } = renderHook(() => useSelectionEngine(data));

      expect(result.current.getTuneName("tune1")).toBe("All The Things");
    });

    it("returns Unknown for non-existent tune", () => {
      const data = { activeTunes: [], lastPickType: "reinforcement" };

      const { result } = renderHook(() => useSelectionEngine(data));

      expect(result.current.getTuneName("nonexistent")).toBe("Unknown");
    });
  });
});
