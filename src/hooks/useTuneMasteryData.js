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
export const ALL_KEYS = [
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
const createEmptyKeyScores = () =>
  ALL_KEYS.reduce((acc, key) => {
    acc[key] = { score: 0, attempts: 0 };
    return acc;
  }, {});

// Default data structure
const DEFAULT_DATA = {
  settings: {
    emaAlpha: 0.3,
    tunerMode: "needle", // 'needle' | 'text'
    temperament: "equal", // 'equal' | 'just'
    autoMetronome: false, // Auto-start metronome when entering practice
    autoDrone: false, // Auto-start drone when entering practice
  },
  activeTunes: [],
  archivedTunes: [],
  currentSession: null,
  lastPickType: "reinforcement", // Start with reinforcement so first pick is learning
};

/**
 * Generate a unique ID
 */
const generateId = () =>
  `tune_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Hook for managing tune mastery data
 * @returns {Object} Data and CRUD operations
 */
export function useTuneMasteryData() {
  const [data, setData] = useState(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Merge with defaults to handle schema updates
          setData({
            ...DEFAULT_DATA,
            ...parsed,
            settings: { ...DEFAULT_DATA.settings, ...parsed.settings },
          });
        } else {
          // No stored data - use defaults
          setData(DEFAULT_DATA);
        }
        setError(null);
      } catch (err) {
        devError("[useTuneMasteryData] Failed to load:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Save data to AsyncStorage
  const saveData = useCallback(async (newData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      devLog("[useTuneMasteryData] Saved:", newData);
    } catch (err) {
      devError("[useTuneMasteryData] Failed to save:", err);
      setError(err);
    }
  }, []);

  // Update data and persist
  const updateData = useCallback(
    (updater) => {
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
   * @param {string} name - Tune name
   * @returns {Object} The created tune
   */
  const addTune = useCallback(
    (name) => {
      const newTune = {
        id: generateId(),
        name: name.trim(),
        createdAt: Date.now(),
        keys: createEmptyKeyScores(),
        bpm: null,
        timeSignature: "4/4",
        subdivision: 1,
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
   * @param {string} tuneId - Tune ID to archive
   */
  const archiveTune = useCallback(
    (tuneId) => {
      updateData((prev) => {
        const tune = prev.activeTunes.find((t) => t.id === tuneId);
        if (!tune) return prev;
        return {
          ...prev,
          activeTunes: prev.activeTunes.filter((t) => t.id !== tuneId),
          archivedTunes: [...prev.archivedTunes, tune],
          // Clear session if this tune was being practiced
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
   * @param {string} tuneId - Tune ID to restore
   */
  const restoreTune = useCallback(
    (tuneId) => {
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
   * @param {string} tuneId - Tune ID to delete
   * @param {boolean} fromArchive - Whether to delete from archive (default: false)
   */
  const deleteTune = useCallback(
    (tuneId, fromArchive = false) => {
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
   * @param {string} tuneId - Tune ID to move
   * @param {number} direction - -1 for up (higher priority), 1 for down
   */
  const reorderTune = useCallback(
    (tuneId, direction) => {
      updateData((prev) => {
        const tunes = [...prev.activeTunes];
        const index = tunes.findIndex((t) => t.id === tuneId);
        if (index === -1) return prev;

        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= tunes.length) return prev;

        // Swap positions
        [tunes[index], tunes[newIndex]] = [tunes[newIndex], tunes[index]];
        return { ...prev, activeTunes: tunes };
      });
      devLog("[useTuneMasteryData] Reordered tune:", tuneId, direction);
    },
    [updateData],
  );

  /**
   * Update score for a tune/key using EMA
   * @param {string} tuneId - Tune ID
   * @param {string} key - Musical key (e.g., "Bb")
   * @param {number} rating - New rating (0-100)
   */
  const updateScore = useCallback(
    (tuneId, key, rating) => {
      updateData((prev) => {
        const tuneIndex = prev.activeTunes.findIndex((t) => t.id === tuneId);
        if (tuneIndex === -1) return prev;

        const tune = prev.activeTunes[tuneIndex];
        const oldScore = tune.keys[key].score;
        const attempts = tune.keys[key].attempts;
        const alpha = prev.settings.emaAlpha;

        // EMA formula: newScore = (1 - alpha) * oldScore + alpha * rating
        // For first attempt (score is 0), just use the rating directly
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
   * @param {Object} newSettings - Partial settings object to merge
   */
  const updateSettings = useCallback(
    (newSettings) => {
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
   * @param {Object|null} session - Session object or null to clear
   */
  const setCurrentSession = useCallback(
    (session) => {
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
   * @param {string} tuneId - Tune ID
   * @param {string} newName - New name
   */
  const renameTune = useCallback(
    (tuneId, newName) => {
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
   * @param {string} tuneId - Tune ID
   * @param {Object} settings - Settings to update { bpm?, timeSignature?, subdivision? }
   */
  const updateTuneSettings = useCallback(
    (tuneId, settings) => {
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
   * @param {string[]} tuneNames - Array of tune names to seed
   */
  const seedTunes = useCallback(
    (tuneNames = DEFAULT_TUNES) => {
      const newTunes = tuneNames.map((name, index) => ({
        id: generateId() + "_" + index,
        name: name.trim(),
        createdAt: Date.now() + index,
        keys: createEmptyKeyScores(),
        bpm: null,
        timeSignature: "4/4",
        subdivision: 1,
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
