/**
 * useSelectionEngine - Tune/Key selection algorithm for practice
 *
 * Implements an alternating learning/reinforcement selection strategy:
 * - Learning: Focus on incomplete tunes, lowest non-zero scored keys
 * - Reinforcement: Review mastered tunes, lowest scored keys across all
 *
 * @example
 * const { getNextPick, isLearningPick, analyzeData } = useSelectionEngine(data);
 * const pick = getNextPick();
 * // pick = { tuneId, key, pickType: 'learning' | 'reinforcement' }
 */

import { useCallback, useMemo } from "react";
import { ALL_KEYS } from "./useTuneMasteryData";
import { devLog } from "../utils/devLogger";
import type {
  MusicalKey,
  Tune,
  TuneMasteryData,
  PickType,
} from "../types/tuning";

const MASTERY_THRESHOLD = 95; // Key is mastered at 95%

export interface KeyScoreInfo {
  key: MusicalKey;
  score: number;
  attempts: number;
}

export interface TuneAnalysis {
  tune: Tune;
  keyScores: KeyScoreInfo[];
  masteredKeys: KeyScoreInfo[];
  incompletKeys: KeyScoreInfo[];
  zeroScoreKeys: KeyScoreInfo[];
  nonZeroKeys: KeyScoreInfo[];
  isMastered: boolean;
  isStarted: boolean;
  lowestNonZeroKey: KeyScoreInfo | null;
  lowestKey: KeyScoreInfo | null;
}

export interface SelectionPick {
  tuneId: string;
  key: MusicalKey;
  pickType: PickType;
}

export interface SelectionStats {
  totalTunes: number;
  totalMastered: number;
  totalIncomplete: number;
  averageScore: number;
}

export interface UseSelectionEngineReturn {
  // Selection functions
  getNextPick: () => SelectionPick | null;
  getLearningPick: () => SelectionPick | null;
  getReinforcementPick: () => SelectionPick | null;
  isLearningPick: boolean;

  // Analysis
  tuneAnalysis: TuneAnalysis[];
  masteredTunes: TuneAnalysis[];
  incompleteTunes: TuneAnalysis[];
  stats: SelectionStats;

  // Utilities
  getTuneName: (tuneId: string) => string;
  analyzeTune: (tune: Tune) => TuneAnalysis;

  // Constants
  MASTERY_THRESHOLD: number;
}

/**
 * Hook for selecting next tune/key to practice
 */
export function useSelectionEngine(
  data: TuneMasteryData | null,
): UseSelectionEngineReturn {
  const { activeTunes, lastPickType } = data || {
    activeTunes: [],
    lastPickType: "reinforcement" as PickType,
  };

  /**
   * Analyze a single tune's status
   */
  const analyzeTune = useCallback((tune: Tune): TuneAnalysis => {
    const keys = tune.keys || {};
    const keyScores: KeyScoreInfo[] = ALL_KEYS.map((k) => ({
      key: k,
      score: keys[k]?.score ?? 0,
      attempts: keys[k]?.attempts ?? 0,
    }));

    const masteredKeys = keyScores.filter((k) => k.score >= MASTERY_THRESHOLD);
    const incompletKeys = keyScores.filter((k) => k.score < MASTERY_THRESHOLD);
    const zeroScoreKeys = keyScores.filter((k) => k.score === 0);
    const nonZeroKeys = keyScores.filter(
      (k) => k.score > 0 && k.score < MASTERY_THRESHOLD,
    );

    const isMastered = masteredKeys.length === ALL_KEYS.length;
    const isStarted = keyScores.some((k) => k.attempts > 0);

    const sortedNonZero = [...nonZeroKeys].sort((a, b) => a.score - b.score);
    const sortedAll = [...keyScores].sort((a, b) => a.score - b.score);

    return {
      tune,
      keyScores,
      masteredKeys,
      incompletKeys,
      zeroScoreKeys,
      nonZeroKeys,
      isMastered,
      isStarted,
      lowestNonZeroKey: sortedNonZero[0] || null,
      lowestKey: sortedAll[0] || null,
    };
  }, []);

  /**
   * Analyze all active tunes
   */
  const tuneAnalysis = useMemo(() => {
    return activeTunes.map(analyzeTune);
  }, [activeTunes, analyzeTune]);

  /**
   * Get mastered and incomplete tune lists
   */
  const { masteredTunes, incompleteTunes } = useMemo(() => {
    const mastered = tuneAnalysis.filter((a) => a.isMastered);
    const incomplete = tuneAnalysis.filter((a) => !a.isMastered);
    return { masteredTunes: mastered, incompleteTunes: incomplete };
  }, [tuneAnalysis]);

  /**
   * Determine if next pick should be learning
   */
  const isLearningPick = useMemo(() => {
    return lastPickType === "reinforcement";
  }, [lastPickType]);

  /**
   * Get a learning pick (focus on incomplete tunes)
   */
  const getLearningPick = useCallback((): SelectionPick | null => {
    if (incompleteTunes.length === 0) {
      devLog("[useSelectionEngine] No incomplete tunes, falling back");
      return null;
    }

    // Get highest-priority incomplete tune (first in list)
    const analysis = incompleteTunes[0];

    // Prefer lowest non-zero scored key
    if (analysis.lowestNonZeroKey) {
      devLog(
        "[useSelectionEngine] Learning pick: lowest non-zero key",
        analysis.tune.name,
        analysis.lowestNonZeroKey.key,
      );
      return {
        tuneId: analysis.tune.id,
        key: analysis.lowestNonZeroKey.key,
        pickType: "learning",
      };
    }

    // All non-zero keys are mastered (≥95%), pick random zero-score key
    if (analysis.zeroScoreKeys.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * analysis.zeroScoreKeys.length,
      );
      const randomKey = analysis.zeroScoreKeys[randomIndex].key;
      devLog(
        "[useSelectionEngine] Learning pick: random zero-score key",
        analysis.tune.name,
        randomKey,
      );
      return {
        tuneId: analysis.tune.id,
        key: randomKey,
        pickType: "learning",
      };
    }

    // Shouldn't reach here, but fall back to lowest key
    return {
      tuneId: analysis.tune.id,
      key: analysis.lowestKey?.key || "C",
      pickType: "learning",
    };
  }, [incompleteTunes]);

  /**
   * Get a reinforcement pick (review mastered tunes)
   */
  const getReinforcementPick = useCallback((): SelectionPick | null => {
    if (masteredTunes.length === 0) {
      devLog("[useSelectionEngine] No mastered tunes, falling back");
      return null;
    }

    // Collect all mastered tune/key combinations
    const allMasteredCombos: {
      tuneId: string;
      key: MusicalKey;
      score: number;
    }[] = [];
    for (const analysis of masteredTunes) {
      for (const keyData of analysis.keyScores) {
        allMasteredCombos.push({
          tuneId: analysis.tune.id,
          key: keyData.key,
          score: keyData.score,
        });
      }
    }

    // Pick completely random from mastered combinations
    const randomIndex = Math.floor(Math.random() * allMasteredCombos.length);
    const randomPick = allMasteredCombos[randomIndex];

    const pick: SelectionPick = {
      tuneId: randomPick.tuneId,
      key: randomPick.key,
      pickType: "reinforcement",
    };

    devLog(
      "[useSelectionEngine] Reinforcement pick (random):",
      pick.tuneId,
      pick.key,
      "score:",
      randomPick.score,
    );

    return pick;
  }, [masteredTunes]);

  /**
   * Get the next tune/key to practice
   */
  const getNextPick = useCallback((): SelectionPick | null => {
    if (activeTunes.length === 0) {
      devLog("[useSelectionEngine] No active tunes");
      return null;
    }

    let pick: SelectionPick | null = null;

    if (isLearningPick) {
      pick = getLearningPick();
      // Fall back to reinforcement if no incomplete tunes
      if (!pick) pick = getReinforcementPick();
    } else {
      pick = getReinforcementPick();
      // Fall back to learning if no mastered tunes
      if (!pick) pick = getLearningPick();
    }

    // Final fallback: first tune, first key
    if (!pick && activeTunes.length > 0) {
      pick = {
        tuneId: activeTunes[0].id,
        key: "C",
        pickType: "learning",
      };
    }

    return pick;
  }, [activeTunes, isLearningPick, getLearningPick, getReinforcementPick]);

  /**
   * Get tune name by ID
   */
  const getTuneName = useCallback(
    (tuneId: string): string => {
      const tune = activeTunes.find((t) => t.id === tuneId);
      return tune?.name || "Unknown";
    },
    [activeTunes],
  );

  /**
   * Get overall progress stats
   */
  const stats = useMemo((): SelectionStats => {
    const totalTunes = activeTunes.length;
    const totalMastered = masteredTunes.length;
    const totalIncomplete = incompleteTunes.length;

    // Calculate average score across started tunes only (at least one key > 0%)
    let totalScore = 0;
    let totalKeys = 0;
    for (const analysis of tuneAnalysis) {
      // Only include tunes that have been started (at least one non-zero key)
      if (analysis.isStarted) {
        for (const keyData of analysis.keyScores) {
          totalScore += keyData.score;
          totalKeys += 1;
        }
      }
    }
    const averageScore = totalKeys > 0 ? Math.round(totalScore / totalKeys) : 0;

    return {
      totalTunes,
      totalMastered,
      totalIncomplete,
      averageScore,
    };
  }, [activeTunes, masteredTunes, incompleteTunes, tuneAnalysis]);

  return {
    // Selection functions
    getNextPick,
    getLearningPick,
    getReinforcementPick,
    isLearningPick,

    // Analysis
    tuneAnalysis,
    masteredTunes,
    incompleteTunes,
    stats,

    // Utilities
    getTuneName,
    analyzeTune,

    // Constants
    MASTERY_THRESHOLD,
  };
}

export default useSelectionEngine;
