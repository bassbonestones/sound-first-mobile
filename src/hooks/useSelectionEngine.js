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

const MASTERY_THRESHOLD = 95; // Key is mastered at 95%

/**
 * Hook for selecting next tune/key to practice
 * @param {Object} data - Tune mastery data from useTuneMasteryData
 * @returns {Object} Selection functions and analysis
 */
export function useSelectionEngine(data) {
  const { activeTunes, lastPickType } = data || {
    activeTunes: [],
    lastPickType: "reinforcement",
  };

  /**
   * Analyze a single tune's status
   */
  const analyzeTune = useCallback((tune) => {
    const keys = tune.keys || {};
    const keyScores = ALL_KEYS.map((k) => ({
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

    return {
      tune,
      keyScores,
      masteredKeys,
      incompletKeys,
      zeroScoreKeys,
      nonZeroKeys,
      isMastered,
      isStarted,
      lowestNonZeroKey:
        nonZeroKeys.sort((a, b) => a.score - b.score)[0] || null,
      lowestKey: keyScores.sort((a, b) => a.score - b.score)[0] || null,
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
   * @returns {Object|null} { tuneId, key, pickType }
   */
  const getLearningPick = useCallback(() => {
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
   * @returns {Object|null} { tuneId, key, pickType }
   */
  const getReinforcementPick = useCallback(() => {
    if (masteredTunes.length === 0) {
      devLog("[useSelectionEngine] No mastered tunes, falling back");
      return null;
    }

    // Collect all mastered tune/key combinations
    const allMasteredCombos = [];
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

    const pick = {
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
   * @returns {Object|null} { tuneId, key, pickType } or null if no tunes
   */
  const getNextPick = useCallback(() => {
    if (activeTunes.length === 0) {
      devLog("[useSelectionEngine] No active tunes");
      return null;
    }

    let pick = null;

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
    (tuneId) => {
      const tune = activeTunes.find((t) => t.id === tuneId);
      return tune?.name || "Unknown";
    },
    [activeTunes],
  );

  /**
   * Get overall progress stats
   */
  const stats = useMemo(() => {
    const totalTunes = activeTunes.length;
    const totalMastered = masteredTunes.length;
    const totalIncomplete = incompleteTunes.length;

    // Calculate average score across all tunes/keys
    let totalScore = 0;
    let totalKeys = 0;
    for (const analysis of tuneAnalysis) {
      for (const keyData of analysis.keyScores) {
        totalScore += keyData.score;
        totalKeys += 1;
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
