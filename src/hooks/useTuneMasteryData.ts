/**
 * useTuneMasteryData - Manages tune mastery data persistence
 *
 * Provides CRUD operations for tunes and their key scores, persisted
 * in AsyncStorage. Implements EMA (Exponential Moving Average) scoring.
 *
 * @example
 * const {
 *   data, loading, error,
 *   addTune, archiveTune, restoreTune, deleteTune,
 *   reorderTune, updateScore, updateSettings,
 *   setCurrentSession, clearCurrentSession
 * } = useTuneMasteryData();
 */

import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { devLog, devError } from "../utils/devLogger";
import type {
  MusicalKey,
  KeyScore,
  KeyScores,
  Tune,
  TuneMasterySettings,
  TuneSession,
  TuneMasteryData,
  PickType,
  Temperament,
} from "../types/tuning";

const STORAGE_KEY = "tuneMastery";

// Default tune list for seeding
export const DEFAULT_TUNES = [
  "Hot Cross Buns",
  "Mary Had a Little Lamb",
  "Frère Jacques",
  "Go Tell Aunt Rhody",
  "Long Long Ago",
  "Lightly Row",
  "Kumbaya My Lord",
  "Dona Nobis Pacem",
  "Old 100th",
  "Swing Low Sweet Chariot",
  "Aura Lee",
  "My Country Tis of Thee",
  "Amazing Grace",
  "Ode to Joy",
  "Annie Laurie",
  "Simple Gifts",
  "Scarborough Fair",
  "Greensleeves",
  "Barnacle Bill the Sailor",
  "The Windy City",
  "America the Beautiful",
  "Jingle Bells",
  "Camptown Races",
  "Yankee Doodle",
  "Oh Susanna",
  "Take Me Out to the Ball Game",
  "When You Wish Upon a Star",
  "Shenandoah",
  "Danny Boy",
  "Blue Skies",
  "All of Me",
  "Fly Me to the Moon",
  "Autumn Leaves",
  "Blue Bossa",
  "My Funny Valentine",
  "Summertime",
  "When I Fall In Love",
  "I Dreamed a Dream (Les Miserables)",
  "On My Own (Les Miserables)",
  "Days of Wine and Roses",
  "Misty",
  "Largo from New World Symphony",
  "Rachmaninoff Vocalise",
  "Achieved is the Glorious Work",
  "Beethoven Symphony 5 chorale",
  "Brahms Symphony 1 chorale",
  "Tannhauser",
  "Saint-Saëns Organ Symphony Theme",
  "Mahler chorales",
  "Bruckner chorales",
  "Ride of the Valkyries",
  "Mozart Tuba Mirum",
  "Nimrod",
  "Carnival of Venice",
  "Blue Bells of Scotland",
  "Rimsky-Korsakov Procession",
  "Flight of the Bumblebee",
];

// All 12 keys
export const ALL_KEYS: MusicalKey[] = [
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

// Default empty key scores
const createEmptyKeyScores = (): KeyScores =>
  ALL_KEYS.reduce((acc, key) => {
    acc[key] = { score: 0, attempts: 0 };
    return acc;
  }, {} as KeyScores);

// Default data structure
const DEFAULT_DATA: TuneMasteryData = {
  settings: {
    emaAlpha: 0.3,
    tunerMode: "needle",
    temperament: "equal",
    autoMetronome: false,
    autoDrone: false,
  },
  activeTunes: [],
  archivedTunes: [],
  currentSession: null,
  lastPickType: "reinforcement",
};

/**
 * Generate a unique ID
 */
const generateId = (): string =>
  `tune_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export interface TuneSettingsUpdate {
  bpm?: number | null;
  timeSignature?: string;
  subdivision?: number;
  pitchSystem?: Temperament;
  aHertz?: number | null;
}

export interface UseTuneMasteryDataReturn {
  // State
  data: TuneMasteryData;
  loading: boolean;
  error: Error | null;

  // Tune CRUD
  addTune: (name: string) => Tune;
  archiveTune: (tuneId: string) => void;
  restoreTune: (tuneId: string) => void;
  deleteTune: (tuneId: string, fromArchive?: boolean) => void;
  reorderTune: (tuneId: string, direction: number) => void;
  renameTune: (tuneId: string, newName: string) => void;
  updateTuneSettings: (tuneId: string, settings: TuneSettingsUpdate) => void;

  // Scoring
  updateScore: (tuneId: string, key: MusicalKey, rating: number) => void;

  // Settings
  updateSettings: (newSettings: Partial<TuneMasterySettings>) => void;

  // Session
  setCurrentSession: (session: TuneSession | null) => void;
  clearCurrentSession: () => void;
  toggleLastPickType: () => void;

  // Utility
  resetAllData: () => void;
  seedTunes: (tuneNames?: string[]) => void;
}

/**
 * Hook for managing tune mastery data
 */
export function useTuneMasteryData(): UseTuneMasteryDataReturn {
  const [data, setData] = useState<TuneMasteryData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<TuneMasteryData>;
          // Migrate tunes to ensure all properties have defaults
          const migrateTunes = (tunes: Tune[] | undefined): Tune[] => {
            if (!tunes) return [];
            return tunes.map((tune) => ({
              ...tune,
              pitchSystem: tune.pitchSystem || "just",
              aHertz: tune.aHertz ?? 440,
            }));
          };
          setData({
            ...DEFAULT_DATA,
            ...parsed,
            activeTunes: migrateTunes(parsed.activeTunes),
            archivedTunes: migrateTunes(parsed.archivedTunes),
          });
        }
      } catch (err) {
        devError("[useTuneMasteryData] Failed to load:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Save data to storage
  const saveData = useCallback(async (newData: TuneMasteryData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      devLog("[useTuneMasteryData] Saved:", newData);
    } catch (err) {
      devError("[useTuneMasteryData] Failed to save:", err);
    }
  }, []);

  // Update data and persist
  const updateData = useCallback(
    (
      updater: TuneMasteryData | ((prev: TuneMasteryData) => TuneMasteryData),
    ) => {
      setData((prev) => {
        const newData = typeof updater === "function" ? updater(prev) : updater;
        saveData(newData);
        return newData;
      });
    },
    [saveData],
  );

  /**
   * Add a new tune
   */
  const addTune = useCallback(
    (name: string): Tune => {
      const newTune: Tune = {
        id: generateId(),
        name: name.trim(),
        createdAt: Date.now(),
        keys: createEmptyKeyScores(),
        bpm: null,
        timeSignature: "4/4",
        subdivision: 1,
        pitchSystem: "just",
        aHertz: 440,
      };
      updateData((prev) => ({
        ...prev,
        activeTunes: [...prev.activeTunes, newTune],
      }));
      devLog("[useTuneMasteryData] Added tune:", newTune.name);
      return newTune;
    },
    [updateData],
  );

  /**
   * Archive a tune (move from active to archived)
   */
  const archiveTune = useCallback(
    (tuneId: string) => {
      updateData((prev) => {
        const tune = prev.activeTunes.find((t) => t.id === tuneId);
        if (!tune) return prev;
        return {
          ...prev,
          activeTunes: prev.activeTunes.filter((t) => t.id !== tuneId),
          archivedTunes: [...prev.archivedTunes, tune],
          currentSession:
            prev.currentSession?.tuneId === tuneId ? null : prev.currentSession,
        };
      });
      devLog("[useTuneMasteryData] Archived tune:", tuneId);
    },
    [updateData],
  );

  /**
   * Restore a tune from archive
   */
  const restoreTune = useCallback(
    (tuneId: string) => {
      updateData((prev) => {
        const tune = prev.archivedTunes.find((t) => t.id === tuneId);
        if (!tune) return prev;
        return {
          ...prev,
          archivedTunes: prev.archivedTunes.filter((t) => t.id !== tuneId),
          activeTunes: [...prev.activeTunes, tune],
        };
      });
      devLog("[useTuneMasteryData] Restored tune:", tuneId);
    },
    [updateData],
  );

  /**
   * Permanently delete a tune
   */
  const deleteTune = useCallback(
    (tuneId: string, fromArchive: boolean = false) => {
      updateData((prev) => {
        if (fromArchive) {
          return {
            ...prev,
            archivedTunes: prev.archivedTunes.filter((t) => t.id !== tuneId),
          };
        }
        return {
          ...prev,
          activeTunes: prev.activeTunes.filter((t) => t.id !== tuneId),
          currentSession:
            prev.currentSession?.tuneId === tuneId ? null : prev.currentSession,
        };
      });
      devLog("[useTuneMasteryData] Deleted tune:", tuneId);
    },
    [updateData],
  );

  /**
   * Reorder a tune (change priority)
   */
  const reorderTune = useCallback(
    (tuneId: string, direction: number) => {
      updateData((prev) => {
        const tunes = [...prev.activeTunes];
        const index = tunes.findIndex((t) => t.id === tuneId);
        if (index === -1) return prev;

        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= tunes.length) return prev;

        [tunes[index], tunes[newIndex]] = [tunes[newIndex], tunes[index]];
        return { ...prev, activeTunes: tunes };
      });
      devLog("[useTuneMasteryData] Reordered tune:", tuneId, direction);
    },
    [updateData],
  );

  /**
   * Update score for a tune/key using EMA
   */
  const updateScore = useCallback(
    (tuneId: string, key: MusicalKey, rating: number) => {
      updateData((prev) => {
        const tuneIndex = prev.activeTunes.findIndex((t) => t.id === tuneId);
        if (tuneIndex === -1) return prev;

        const tune = prev.activeTunes[tuneIndex];
        const oldScore = tune.keys[key].score;
        const attempts = tune.keys[key].attempts;
        const alpha = prev.settings.emaAlpha;

        const newScore =
          attempts === 0
            ? rating
            : Math.round((1 - alpha) * oldScore + alpha * rating);

        const updatedTunes = [...prev.activeTunes];
        updatedTunes[tuneIndex] = {
          ...tune,
          keys: {
            ...tune.keys,
            [key]: {
              score: newScore,
              attempts: attempts + 1,
            },
          },
        };

        return { ...prev, activeTunes: updatedTunes };
      });
      devLog("[useTuneMasteryData] Updated score:", tuneId, key, rating);
    },
    [updateData],
  );

  /**
   * Update settings
   */
  const updateSettings = useCallback(
    (newSettings: Partial<TuneMasterySettings>) => {
      updateData((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...newSettings },
      }));
      devLog("[useTuneMasteryData] Updated settings:", newSettings);
    },
    [updateData],
  );

  /**
   * Set the current practice session
   */
  const setCurrentSession = useCallback(
    (session: TuneSession | null) => {
      updateData((prev) => ({
        ...prev,
        currentSession: session,
      }));
      devLog("[useTuneMasteryData] Set session:", session);
    },
    [updateData],
  );

  /**
   * Clear the current session
   */
  const clearCurrentSession = useCallback(() => {
    updateData((prev) => ({
      ...prev,
      currentSession: null,
    }));
    devLog("[useTuneMasteryData] Cleared session");
  }, [updateData]);

  /**
   * Toggle last pick type (for alternation)
   */
  const toggleLastPickType = useCallback(() => {
    updateData((prev) => ({
      ...prev,
      lastPickType:
        prev.lastPickType === "learning" ? "reinforcement" : "learning",
    }));
  }, [updateData]);

  /**
   * Rename a tune
   */
  const renameTune = useCallback(
    (tuneId: string, newName: string) => {
      updateData((prev) => {
        const tuneIndex = prev.activeTunes.findIndex((t) => t.id === tuneId);
        if (tuneIndex === -1) return prev;

        const updatedTunes = [...prev.activeTunes];
        updatedTunes[tuneIndex] = {
          ...updatedTunes[tuneIndex],
          name: newName.trim(),
        };
        return { ...prev, activeTunes: updatedTunes };
      });
      devLog("[useTuneMasteryData] Renamed tune:", tuneId, newName);
    },
    [updateData],
  );

  /**
   * Update tune tempo settings (bpm, timeSignature, subdivision)
   */
  const updateTuneSettings = useCallback(
    (tuneId: string, settings: TuneSettingsUpdate) => {
      updateData((prev) => {
        const tuneIndex = prev.activeTunes.findIndex((t) => t.id === tuneId);
        if (tuneIndex === -1) return prev;

        const updatedTunes = [...prev.activeTunes];
        updatedTunes[tuneIndex] = {
          ...updatedTunes[tuneIndex],
          ...settings,
        };
        return { ...prev, activeTunes: updatedTunes };
      });
      devLog("[useTuneMasteryData] Updated tune settings:", tuneId, settings);
    },
    [updateData],
  );

  /**
   * Reset all data to defaults
   */
  const resetAllData = useCallback(() => {
    updateData(DEFAULT_DATA);
    devLog("[useTuneMasteryData] Reset all data");
  }, [updateData]);

  /**
   * Seed with default tunes (replaces all existing tunes)
   */
  const seedTunes = useCallback(
    (tuneNames: string[] = DEFAULT_TUNES) => {
      const newTunes: Tune[] = tuneNames.map((name, index) => ({
        id: generateId() + "_" + index,
        name: name.trim(),
        createdAt: Date.now() + index,
        keys: createEmptyKeyScores(),
        bpm: null,
        timeSignature: "4/4",
        subdivision: 1,
        pitchSystem: "just",
        aHertz: 440,
      }));
      updateData((prev) => ({
        ...prev,
        activeTunes: newTunes,
        archivedTunes: [],
        currentSession: null,
      }));
      devLog("[useTuneMasteryData] Seeded", tuneNames.length, "tunes");
    },
    [updateData],
  );

  return {
    // State
    data,
    loading,
    error,

    // Tune CRUD
    addTune,
    archiveTune,
    restoreTune,
    deleteTune,
    reorderTune,
    renameTune,
    updateTuneSettings,

    // Scoring
    updateScore,

    // Settings
    updateSettings,

    // Session
    setCurrentSession,
    clearCurrentSession,
    toggleLastPickType,

    // Utility
    resetAllData,
    seedTunes,
  };
}

export default useTuneMasteryData;
