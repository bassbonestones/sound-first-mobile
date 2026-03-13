/**
 * Tests for useSelectionEngine hook
 *
 * Fully typed TypeScript test file.
 */
import { renderHook } from "@testing-library/react-native";
import { useSelectionEngine } from "../src/hooks/useSelectionEngine";
import { ALL_KEYS } from "../src/hooks/useTuneMasteryData";
import type {
  TuneMasteryData,
  TuneMasterySettings,
  Tune,
  KeyScore,
  KeyScores,
  PickType,
  MusicalKey,
} from "../src/types/tuning";

// Mock AsyncStorage to prevent native module errors
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Default settings for tests
const defaultSettings: TuneMasterySettings = {
  emaAlpha: 0.3,
  tunerMode: "needle",
  temperament: "equal",
  autoMetronome: false,
  autoDrone: false,
};

// Helper to create mock TuneMasteryData with defaults
const createMockData = (
  activeTunes: Tune[],
  lastPickType: PickType = "reinforcement",
): TuneMasteryData => ({
  settings: defaultSettings,
  activeTunes,
  archivedTunes: [],
  currentSession: null,
  lastPickType,
});

// Helper to create a tune with specific key scores
const createTune = (
  id: string,
  name: string,
  keyScores: Partial<Record<MusicalKey, number>> = {},
): Tune => {
  const keys = {} as KeyScores;
  ALL_KEYS.forEach((key) => {
    keys[key] = {
      score: keyScores[key] ?? 0,
      attempts: keyScores[key] ? 1 : 0,
    };
  });
  return {
    id,
    name,
    keys,
    createdAt: Date.now(),
    bpm: null,
    timeSignature: "4/4",
    subdivision: 1,
  };
};

// Helper to create mastered tune (all keys >= 95)
const createMasteredTune = (id: string, name: string): Tune => {
  const keyScores: Record<string, number> = {};
  ALL_KEYS.forEach((key) => {
    keyScores[key] = 95 + Math.floor(Math.random() * 5);
  });
  return createTune(id, name, keyScores);
};

describe("useSelectionEngine", () => {
  describe("with no tunes", () => {
    it("returns null for next pick", () => {
      const data = createMockData([]);
      const { result } = renderHook(() => useSelectionEngine(data));

      expect(result.current.getNextPick()).toBeNull();
    });

    it("reports zero stats", () => {
      const data = createMockData([]);
      const { result } = renderHook(() => useSelectionEngine(data));

      expect(result.current.stats.totalTunes).toBe(0);
      expect(result.current.stats.totalMastered).toBe(0);
    });
  });

  describe("learning picks", () => {
    it("selects lowest non-zero scored key", () => {
      const tune = createTune("tune1", "Test", { C: 50, D: 30, E: 70 });
      const data = createMockData([tune], "reinforcement");

      const { result } = renderHook(() => useSelectionEngine(data));

      const pick = result.current.getLearningPick();
      expect(pick.tuneId).toBe("tune1");
      expect(pick.key).toBe("D"); // Lowest non-zero
      expect(pick.pickType).toBe("learning");
    });

    it("selects random zero-score key when all non-zero are mastered", () => {
      const tune = createTune("tune1", "Test", { C: 96, D: 97, E: 98 });
      // F, G, etc. are all 0
      const data = createMockData([tune], "reinforcement");

      const { result } = renderHook(() => useSelectionEngine(data));

      const pick = result.current.getLearningPick();
      expect(pick.tuneId).toBe("tune1");
      // Should be a zero-score key (not C, D, or E)
      expect(["C", "D", "E"]).not.toContain(pick.key);
    });

    it("selects highest-priority incomplete tune", () => {
      const tune1 = createTune("tune1", "First", { C: 50 });
      const tune2 = createTune("tune2", "Second", { C: 40 });
      const data = createMockData([tune1, tune2], "reinforcement"); // tune1 is higher priority

      const { result } = renderHook(() => useSelectionEngine(data));

      const pick = result.current.getLearningPick();
      expect(pick.tuneId).toBe("tune1");
    });
  });

  describe("reinforcement picks", () => {
    it("selects random key from mastered tunes", () => {
      // Create tunes with all keys at 98 (all mastered)
      const tune1Keys: Partial<Record<MusicalKey, number>> = {};
      const tune2Keys: Partial<Record<MusicalKey, number>> = {};
      ALL_KEYS.forEach((key) => {
        tune1Keys[key] = 98;
        tune2Keys[key] = 98;
      });
      tune1Keys.C = 95; // Various scores but all above threshold
      tune2Keys.D = 96;

      const tune1 = createTune("tune1", "First", tune1Keys);
      const tune2 = createTune("tune2", "Second", tune2Keys);

      const data = createMockData([tune1, tune2], "learning"); // Next will be reinforcement

      const { result } = renderHook(() => useSelectionEngine(data));

      const pick = result.current.getReinforcementPick();
      // Should return a valid pick from mastered tunes (random)
      expect(["tune1", "tune2"]).toContain(pick.tuneId);
      expect(ALL_KEYS).toContain(pick.key);
      expect(pick.pickType).toBe("reinforcement");
    });

    it("returns null when no mastered tunes", () => {
      const tune = createTune("tune1", "Test", { C: 50 });
      const data = createMockData([tune], "learning");

      const { result } = renderHook(() => useSelectionEngine(data));

      expect(result.current.getReinforcementPick()).toBeNull();
    });
  });

  describe("alternation logic", () => {
    it("isLearningPick is true when lastPickType is reinforcement", () => {
      const data = createMockData([]);
      const { result } = renderHook(() => useSelectionEngine(data));

      expect(result.current.isLearningPick).toBe(true);
    });

    it("isLearningPick is false when lastPickType is learning", () => {
      const data = createMockData([], "learning");
      const { result } = renderHook(() => useSelectionEngine(data));

      expect(result.current.isLearningPick).toBe(false);
    });

    it("getNextPick alternates between learning and reinforcement", () => {
      const incompleteTune = createTune("tune1", "Incomplete", { C: 50 });
      const masteredTune = createMasteredTune("tune2", "Mastered");

      // Next is learning pick
      const data1 = createMockData(
        [incompleteTune, masteredTune],
        "reinforcement",
      );
      const { result: result1 } = renderHook(() => useSelectionEngine(data1));
      const pick1 = result1.current.getNextPick();
      expect(pick1.pickType).toBe("learning");

      // Next is reinforcement pick
      const data2 = createMockData([incompleteTune, masteredTune], "learning");
      const { result: result2 } = renderHook(() => useSelectionEngine(data2));
      const pick2 = result2.current.getNextPick();
      expect(pick2.pickType).toBe("reinforcement");
    });
  });

  describe("stats", () => {
    it("calculates total tunes correctly", () => {
      const data = createMockData(
        [createTune("1", "A"), createTune("2", "B"), createTune("3", "C")],
        "reinforcement",
      );

      const { result } = renderHook(() => useSelectionEngine(data));

      expect(result.current.stats.totalTunes).toBe(3);
    });

    it("calculates mastered tunes correctly", () => {
      const data = createMockData(
        [
          createMasteredTune("1", "Mastered1"),
          createMasteredTune("2", "Mastered2"),
          createTune("3", "NotMastered", { C: 50 }),
        ],
        "reinforcement",
      );

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
      const data = createMockData([tune], "reinforcement");

      const { result } = renderHook(() => useSelectionEngine(data));

      expect(result.current.stats.averageScore).toBe(50);
    });
  });

  describe("getTuneName", () => {
    it("returns tune name by id", () => {
      const data = createMockData(
        [createTune("tune1", "All The Things")],
        "reinforcement",
      );

      const { result } = renderHook(() => useSelectionEngine(data));

      expect(result.current.getTuneName("tune1")).toBe("All The Things");
    });

    it("returns Unknown for non-existent tune", () => {
      const data = createMockData([]);

      const { result } = renderHook(() => useSelectionEngine(data));

      expect(result.current.getTuneName("nonexistent")).toBe("Unknown");
    });
  });

  describe("tuneAnalysis", () => {
    it("analyzes a new tune with no scores", () => {
      const tune = createTune("tune1", "New Tune");
      const data = createMockData([tune]);

      const { result } = renderHook(() => useSelectionEngine(data));

      const analysis = result.current.tuneAnalysis[0];
      expect(analysis.tune.id).toBe("tune1");
      expect(analysis.zeroScoreKeys).toHaveLength(12);
      expect(analysis.nonZeroKeys).toHaveLength(0);
      expect(analysis.isMastered).toBe(false);
      expect(analysis.isStarted).toBe(false);
    });

    it("analyzes a partially practiced tune", () => {
      const tune = createTune("tune1", "Partial", { C: 50, D: 60, E: 70 });
      const data = createMockData([tune]);

      const { result } = renderHook(() => useSelectionEngine(data));

      const analysis = result.current.tuneAnalysis[0];
      expect(analysis.nonZeroKeys).toHaveLength(3);
      expect(analysis.zeroScoreKeys).toHaveLength(9);
      expect(analysis.isStarted).toBe(true);
      expect(analysis.isMastered).toBe(false);
      expect(analysis.lowestNonZeroKey?.score).toBe(50);
      expect(analysis.lowestNonZeroKey?.key).toBe("C");
    });

    it("identifies mastered tune", () => {
      const masteredTune = createMasteredTune("tune1", "Mastered");
      const data = createMockData([masteredTune]);

      const { result } = renderHook(() => useSelectionEngine(data));

      const analysis = result.current.tuneAnalysis[0];
      expect(analysis.isMastered).toBe(true);
      expect(analysis.masteredKeys).toHaveLength(12);
      expect(analysis.incompletKeys).toHaveLength(0);
    });

    it("identifies incomplete keys", () => {
      const tune = createTune("tune1", "Test", { C: 96, D: 40 });
      const data = createMockData([tune]);

      const { result } = renderHook(() => useSelectionEngine(data));

      const analysis = result.current.tuneAnalysis[0];
      expect(analysis.masteredKeys.some((k) => k.key === "C")).toBe(true);
      expect(analysis.incompletKeys.some((k) => k.key === "D")).toBe(true);
    });

    it("finds lowest key overall", () => {
      const tune = createTune("tune1", "Test", { C: 80, D: 30 });
      const data = createMockData([tune]);

      const { result } = renderHook(() => useSelectionEngine(data));

      const analysis = result.current.tuneAnalysis[0];
      // Lowest key is 0 (many keys have score 0)
      expect(analysis.lowestKey?.score).toBe(0);
    });
  });

  describe("masteredTunes and incompleteTunes arrays", () => {
    it("separates mastered from incomplete tunes", () => {
      const mastered1 = createMasteredTune("m1", "Mastered 1");
      const mastered2 = createMasteredTune("m2", "Mastered 2");
      const incomplete = createTune("i1", "Incomplete", { C: 50 });
      const data = createMockData([mastered1, incomplete, mastered2]);

      const { result } = renderHook(() => useSelectionEngine(data));

      expect(result.current.masteredTunes).toHaveLength(2);
      expect(result.current.incompleteTunes).toHaveLength(1);
      expect(result.current.incompleteTunes[0].tune.id).toBe("i1");
    });

    it("handles all mastered tunes", () => {
      const mastered1 = createMasteredTune("m1", "Mastered 1");
      const mastered2 = createMasteredTune("m2", "Mastered 2");
      const data = createMockData([mastered1, mastered2]);

      const { result } = renderHook(() => useSelectionEngine(data));

      expect(result.current.masteredTunes).toHaveLength(2);
      expect(result.current.incompleteTunes).toHaveLength(0);
    });

    it("handles no mastered tunes", () => {
      const tune1 = createTune("t1", "Tune 1", { C: 30 });
      const tune2 = createTune("t2", "Tune 2", { D: 40 });
      const data = createMockData([tune1, tune2]);

      const { result } = renderHook(() => useSelectionEngine(data));

      expect(result.current.masteredTunes).toHaveLength(0);
      expect(result.current.incompleteTunes).toHaveLength(2);
    });
  });

  describe("MASTERY_THRESHOLD constant", () => {
    it("exports mastery threshold value", () => {
      const data = createMockData([]);

      const { result } = renderHook(() => useSelectionEngine(data));

      expect(result.current.MASTERY_THRESHOLD).toBe(95);
    });
  });

  describe("null data handling", () => {
    it("handles null data gracefully", () => {
      const { result } = renderHook(() => useSelectionEngine(null));

      expect(result.current.getNextPick()).toBeNull();
      expect(result.current.stats.totalTunes).toBe(0);
      expect(result.current.tuneAnalysis).toHaveLength(0);
    });
  });

  describe("analyzeTune function", () => {
    it("can analyze individual tune", () => {
      const tune = createTune("t1", "Test", { C: 60 });
      const data = createMockData([tune]);

      const { result } = renderHook(() => useSelectionEngine(data));

      const analysis = result.current.analyzeTune(tune);
      expect(analysis.tune.id).toBe("t1");
      expect(analysis.isStarted).toBe(true);
    });

    it("handles tune without keys property", () => {
      const tune = {
        id: "t1",
        name: "No Keys",
        keys: {},
        createdAt: Date.now(),
        bpm: null,
        timeSignature: "4/4",
        subdivision: 1,
      } as Tune;
      const data = createMockData([tune]);

      const { result } = renderHook(() => useSelectionEngine(data));

      const analysis = result.current.analyzeTune(tune);
      expect(analysis.keyScores).toHaveLength(12);
    });
  });

  describe("edge cases", () => {
    it("handles tune with all keys at mastery threshold", () => {
      const keyScores: Partial<Record<MusicalKey, number>> = {};
      ALL_KEYS.forEach((key) => {
        keyScores[key] = 95; // Exactly at threshold
      });
      const tune = createTune("t1", "Exactly Mastered", keyScores);
      const data = createMockData([tune]);

      const { result } = renderHook(() => useSelectionEngine(data));

      expect(result.current.masteredTunes).toHaveLength(1);
    });

    it("handles tune with all keys just below threshold", () => {
      const keyScores: Partial<Record<MusicalKey, number>> = {};
      ALL_KEYS.forEach((key) => {
        keyScores[key] = 94; // Just below threshold
      });
      const tune = createTune("t1", "Almost Mastered", keyScores);
      const data = createMockData([tune]);

      const { result } = renderHook(() => useSelectionEngine(data));

      expect(result.current.masteredTunes).toHaveLength(0);
      expect(result.current.incompleteTunes).toHaveLength(1);
    });

    it("falls back to learning pick when reinforcement unavailable", () => {
      const tune = createTune("t1", "Incomplete", { C: 50 }); // No mastered tunes
      const data = createMockData([tune], "learning"); // Next should be reinforcement

      const { result } = renderHook(() => useSelectionEngine(data));

      const pick = result.current.getNextPick();
      // Falls back to learning since no mastered tunes for reinforcement
      expect(pick?.pickType).toBe("learning");
    });

    it("falls back to reinforcement pick when learning unavailable", () => {
      const tune = createMasteredTune("t1", "AllMastered"); // All tunes mastered
      const data = createMockData([tune], "reinforcement"); // Next should be learning

      const { result } = renderHook(() => useSelectionEngine(data));

      // Learning pick would try to find incomplete tunes - none exist
      // So it picks from mastered tunes instead
      const pick = result.current.getNextPick();
      expect(pick).not.toBeNull();
      expect(pick?.tuneId).toBe("t1");
    });
  });
});
