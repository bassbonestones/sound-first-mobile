/**
 * Tests for useTuneMasteryData hook
 */
import { renderHook, act, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTuneMasteryData, ALL_KEYS } from "../src/hooks/useTuneMasteryData";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe("useTuneMasteryData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue(undefined);
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
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedData));

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
      expect(AsyncStorage.setItem).toHaveBeenCalled();
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
      AsyncStorage.getItem.mockResolvedValue(
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
      AsyncStorage.getItem.mockResolvedValue(
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
      AsyncStorage.getItem.mockResolvedValue(
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
      AsyncStorage.getItem.mockResolvedValue(
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
      AsyncStorage.getItem.mockResolvedValue(
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
  });

  describe("ALL_KEYS constant", () => {
    it("exports all 12 keys", () => {
      expect(ALL_KEYS).toHaveLength(12);
      expect(ALL_KEYS).toContain("C");
      expect(ALL_KEYS).toContain("Bb");
      expect(ALL_KEYS).toContain("Gb");
    });
  });
});
