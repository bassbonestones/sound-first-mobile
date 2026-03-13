/**
 * Tests for useTuneMasteryData hook
 *
 * Fully typed TypeScript test file.
 */
import { renderHook, act, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTuneMasteryData, ALL_KEYS } from "../src/hooks/useTuneMasteryData";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Cast to typed mock
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe("useTuneMasteryData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
  });

  describe("initialization", () => {
    it("loads with default data when storage is empty", async () => {
      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data.activeTunes).toEqual([]);
      expect(result.current.data.archivedTunes).toEqual([]);
      expect(result.current.data.settings.emaAlpha).toBe(0.3);
    });

    it("loads stored data from AsyncStorage", async () => {
      const storedData = {
        activeTunes: [{ id: "tune1", name: "Test Tune", keys: {} }],
        settings: { emaAlpha: 0.5 },
      };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedData));

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data.activeTunes).toHaveLength(1);
      expect(result.current.data.settings.emaAlpha).toBe(0.5);
    });
  });

  describe("addTune", () => {
    it("adds a new tune with empty keys", async () => {
      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.addTune("All The Things You Are");
      });

      expect(result.current.data.activeTunes).toHaveLength(1);
      expect(result.current.data.activeTunes[0].name).toBe(
        "All The Things You Are",
      );
      expect(Object.keys(result.current.data.activeTunes[0].keys)).toHaveLength(
        12,
      );
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it("trims tune name", async () => {
      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.addTune("  Confirmation  ");
      });

      expect(result.current.data.activeTunes[0].name).toBe("Confirmation");
    });
  });

  describe("archiveTune and restoreTune", () => {
    it("moves tune from active to archived", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          activeTunes: [{ id: "tune1", name: "Test", keys: {} }],
          archivedTunes: [],
        }),
      );

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.archiveTune("tune1");
      });

      expect(result.current.data.activeTunes).toHaveLength(0);
      expect(result.current.data.archivedTunes).toHaveLength(1);
    });

    it("restores tune from archive", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          activeTunes: [],
          archivedTunes: [{ id: "tune1", name: "Test", keys: {} }],
        }),
      );

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.restoreTune("tune1");
      });

      expect(result.current.data.activeTunes).toHaveLength(1);
      expect(result.current.data.archivedTunes).toHaveLength(0);
    });
  });

  describe("updateScore", () => {
    it("updates score using EMA formula", async () => {
      const tune = {
        id: "tune1",
        name: "Test",
        keys: { C: { score: 50, attempts: 5 } },
      };
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          activeTunes: [tune],
          settings: { emaAlpha: 0.3 },
        }),
      );

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateScore("tune1", "C", 80);
      });

      // EMA: 0.7 * 50 + 0.3 * 80 = 35 + 24 = 59
      expect(result.current.data.activeTunes[0].keys.C.score).toBe(59);
      expect(result.current.data.activeTunes[0].keys.C.attempts).toBe(6);
    });

    it("uses rating directly on first attempt", async () => {
      const tune = {
        id: "tune1",
        name: "Test",
        keys: { C: { score: 0, attempts: 0 } },
      };
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({ activeTunes: [tune] }),
      );

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateScore("tune1", "C", 75);
      });

      expect(result.current.data.activeTunes[0].keys.C.score).toBe(75);
      expect(result.current.data.activeTunes[0].keys.C.attempts).toBe(1);
    });
  });

  describe("reorderTune", () => {
    it("moves tune up in priority", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          activeTunes: [
            { id: "tune1", name: "First" },
            { id: "tune2", name: "Second" },
          ],
        }),
      );

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.reorderTune("tune2", -1);
      });

      expect(result.current.data.activeTunes[0].id).toBe("tune2");
      expect(result.current.data.activeTunes[1].id).toBe("tune1");
    });

    it("moves tune down in priority", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          activeTunes: [
            { id: "tune1", name: "First" },
            { id: "tune2", name: "Second" },
          ],
        }),
      );

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.reorderTune("tune1", 1);
      });

      expect(result.current.data.activeTunes[0].id).toBe("tune2");
      expect(result.current.data.activeTunes[1].id).toBe("tune1");
    });

    it("does not move tune if at boundary", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          activeTunes: [
            { id: "tune1", name: "First" },
            { id: "tune2", name: "Second" },
          ],
        }),
      );

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.reorderTune("tune1", -1);
      });

      expect(result.current.data.activeTunes[0].id).toBe("tune1");
    });

    it("does not move if tune not found", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          activeTunes: [{ id: "tune1", name: "First" }],
        }),
      );

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.reorderTune("nonexistent", -1);
      });

      expect(result.current.data.activeTunes).toHaveLength(1);
    });
  });

  describe("deleteTune", () => {
    it("deletes tune from active list", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          activeTunes: [{ id: "tune1", name: "Test" }],
        }),
      );

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.deleteTune("tune1");
      });

      expect(result.current.data.activeTunes).toHaveLength(0);
    });

    it("deletes tune from archive when specified", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          activeTunes: [],
          archivedTunes: [{ id: "tune1", name: "Test" }],
        }),
      );

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.deleteTune("tune1", true);
      });

      expect(result.current.data.archivedTunes).toHaveLength(0);
    });

    it("clears current session if deleted tune was active", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          activeTunes: [{ id: "tune1", name: "Test" }],
          currentSession: { tuneId: "tune1", key: "C" },
        }),
      );

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.deleteTune("tune1");
      });

      expect(result.current.data.currentSession).toBeNull();
    });
  });

  describe("renameTune", () => {
    it("renames an existing tune", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          activeTunes: [{ id: "tune1", name: "Old Name" }],
        }),
      );

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.renameTune("tune1", "New Name");
      });

      expect(result.current.data.activeTunes[0].name).toBe("New Name");
    });

    it("trims whitespace from new name", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          activeTunes: [{ id: "tune1", name: "Old" }],
        }),
      );

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.renameTune("tune1", "  Trimmed  ");
      });

      expect(result.current.data.activeTunes[0].name).toBe("Trimmed");
    });

    it("does not rename if tune not found", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          activeTunes: [{ id: "tune1", name: "Original" }],
        }),
      );

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.renameTune("nonexistent", "New Name");
      });

      expect(result.current.data.activeTunes[0].name).toBe("Original");
    });
  });

  describe("updateTuneSettings", () => {
    it("updates bpm", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          activeTunes: [{ id: "tune1", name: "Test", bpm: null }],
        }),
      );

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateTuneSettings("tune1", { bpm: 120 });
      });

      expect(result.current.data.activeTunes[0].bpm).toBe(120);
    });

    it("updates timeSignature", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          activeTunes: [{ id: "tune1", name: "Test", timeSignature: "4/4" }],
        }),
      );

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateTuneSettings("tune1", { timeSignature: "3/4" });
      });

      expect(result.current.data.activeTunes[0].timeSignature).toBe("3/4");
    });

    it("updates subdivision", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          activeTunes: [{ id: "tune1", name: "Test", subdivision: 1 }],
        }),
      );

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateTuneSettings("tune1", { subdivision: 2 });
      });

      expect(result.current.data.activeTunes[0].subdivision).toBe(2);
    });

    it("updates multiple settings at once", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          activeTunes: [
            {
              id: "tune1",
              name: "Test",
              bpm: 100,
              timeSignature: "4/4",
              subdivision: 1,
            },
          ],
        }),
      );

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateTuneSettings("tune1", {
          bpm: 140,
          timeSignature: "6/8",
          subdivision: 3,
        });
      });

      expect(result.current.data.activeTunes[0].bpm).toBe(140);
      expect(result.current.data.activeTunes[0].timeSignature).toBe("6/8");
      expect(result.current.data.activeTunes[0].subdivision).toBe(3);
    });
  });

  describe("updateSettings", () => {
    it("updates emaAlpha", async () => {
      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ emaAlpha: 0.5 });
      });

      expect(result.current.data.settings.emaAlpha).toBe(0.5);
    });

    it("updates autoMetronome", async () => {
      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ autoMetronome: true });
      });

      expect(result.current.data.settings.autoMetronome).toBe(true);
    });

    it("updates autoDrone", async () => {
      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({ autoDrone: true });
      });

      expect(result.current.data.settings.autoDrone).toBe(true);
    });

    it("updates multiple settings at once", async () => {
      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateSettings({
          emaAlpha: 0.4,
          tunerMode: "spectrum",
          temperament: "pythagorean",
        });
      });

      expect(result.current.data.settings.emaAlpha).toBe(0.4);
      expect(result.current.data.settings.tunerMode).toBe("spectrum");
      expect(result.current.data.settings.temperament).toBe("pythagorean");
    });
  });

  describe("setCurrentSession and clearCurrentSession", () => {
    it("sets current session", async () => {
      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setCurrentSession({ tuneId: "tune1", key: "C" });
      });

      expect(result.current.data.currentSession).toEqual({
        tuneId: "tune1",
        key: "C",
      });
    });

    it("clears current session", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          currentSession: { tuneId: "tune1", key: "D" },
        }),
      );

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.clearCurrentSession();
      });

      expect(result.current.data.currentSession).toBeNull();
    });

    it("sets session to null", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          currentSession: { tuneId: "tune1", key: "D" },
        }),
      );

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setCurrentSession(null);
      });

      expect(result.current.data.currentSession).toBeNull();
    });
  });

  describe("toggleLastPickType", () => {
    it("toggles from learning to reinforcement", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({ lastPickType: "learning" }),
      );

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.toggleLastPickType();
      });

      expect(result.current.data.lastPickType).toBe("reinforcement");
    });

    it("toggles from reinforcement to learning", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({ lastPickType: "reinforcement" }),
      );

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.toggleLastPickType();
      });

      expect(result.current.data.lastPickType).toBe("learning");
    });
  });

  describe("resetAllData", () => {
    it("resets all data to defaults", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          activeTunes: [{ id: "tune1", name: "Test" }],
          archivedTunes: [{ id: "tune2", name: "Archived" }],
          settings: { emaAlpha: 0.5 },
          currentSession: { tuneId: "tune1", key: "C" },
        }),
      );

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.resetAllData();
      });

      expect(result.current.data.activeTunes).toEqual([]);
      expect(result.current.data.archivedTunes).toEqual([]);
      expect(result.current.data.settings.emaAlpha).toBe(0.3);
      expect(result.current.data.currentSession).toBeNull();
    });
  });

  describe("seedTunes", () => {
    it("seeds with default tunes", async () => {
      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.seedTunes();
      });

      // DEFAULT_TUNES has multiple entries
      expect(result.current.data.activeTunes.length).toBeGreaterThan(0);
    });

    it("seeds with custom tune list", async () => {
      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const customTunes = ["Tune A", "Tune B", "Tune C"];
      act(() => {
        result.current.seedTunes(customTunes);
      });

      expect(result.current.data.activeTunes).toHaveLength(3);
      expect(result.current.data.activeTunes[0].name).toBe("Tune A");
      expect(result.current.data.activeTunes[1].name).toBe("Tune B");
      expect(result.current.data.activeTunes[2].name).toBe("Tune C");
    });

    it("clears archived tunes on seed", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          archivedTunes: [{ id: "old", name: "Archived" }],
        }),
      );

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.seedTunes(["New Tune"]);
      });

      expect(result.current.data.archivedTunes).toHaveLength(0);
    });

    it("clears current session on seed", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          currentSession: { tuneId: "old", key: "C" },
        }),
      );

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.seedTunes(["New Tune"]);
      });

      expect(result.current.data.currentSession).toBeNull();
    });

    it("creates empty key scores for each tune", async () => {
      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.seedTunes(["Test Tune"]);
      });

      const tune = result.current.data.activeTunes[0];
      expect(Object.keys(tune.keys)).toHaveLength(12);
      expect(tune.keys.C).toEqual({ score: 0, attempts: 0 });
    });
  });

  describe("error handling", () => {
    it("sets error on storage load failure", async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error("Storage error"));

      const { result } = renderHook(() => useTuneMasteryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Storage error");
    });
  });

  describe("ALL_KEYS constant", () => {
    it("exports all 12 keys", () => {
      expect(ALL_KEYS).toHaveLength(12);
      expect(ALL_KEYS).toContain("C");
      expect(ALL_KEYS).toContain("Bb");
      expect(ALL_KEYS).toContain("Gb");
    });

    it("includes all chromatic notes", () => {
      const expectedKeys = [
        "A",
        "Bb",
        "B",
        "C",
        "Db",
        "D",
        "Eb",
        "E",
        "F",
        "Gb",
        "G",
        "Ab",
      ];
      expect(ALL_KEYS).toEqual(expectedKeys);
    });
  });
});
