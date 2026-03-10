/**
 * useFirstNoteNavigation - Stage navigation for FirstNote flow
 */
import { useCallback } from "react";
import { getBackendUrl } from "../../../api/client";

export default function useFirstNoteNavigation({
  userId,
  instrumentId,
  skippableStages = [],
  stage,
  setStage,
  setSubStep,
  setFocusCardIndex,
  setFocusCardRatings,
  setFocusStepsDone,
  setPitchAccuracy,
  navigation,
}) {
  // Save progress to backend
  const saveProgress = useCallback(
    async (newStage) => {
      try {
        // Use instrument-specific endpoint if instrumentId is available
        const endpoint = instrumentId
          ? `${getBackendUrl()}/users/${userId}/instruments/${instrumentId}`
          : `${getBackendUrl()}/users/${userId}`;
        
        await fetch(endpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ day0_stage: newStage }),
        });
      } catch (err) {
        console.error("Failed to save progress:", err);
      }
    },
    [userId, instrumentId],
  );

  // Complete Day 0 and navigate to destination
  const completeDay0 = useCallback(
    async (destination = "Home") => {
      try {
        // Use instrument-specific endpoint if instrumentId is available
        const endpoint = instrumentId
          ? `${getBackendUrl()}/users/${userId}/instruments/${instrumentId}`
          : `${getBackendUrl()}/users/${userId}`;
        
        await fetch(endpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ day0_completed: true, day0_stage: 7 }),
        });
        navigation.replace(destination);
      } catch (err) {
        console.error("Failed to complete Day 0:", err);
        navigation.replace(destination);
      }
    },
    [userId, instrumentId, navigation],
  );

  // Helper to reset UI state for a new stage
  const resetStageState = useCallback((newStage) => {
    setSubStep(newStage === 1 ? 2 : 0);
    setFocusCardIndex(0);
    setFocusCardRatings([]);
    setFocusStepsDone({
      listen: false,
      sing: false,
      imagine: false,
      play: false,
    });
    setPitchAccuracy(null);
  }, [setSubStep, setFocusCardIndex, setFocusCardRatings, setFocusStepsDone, setPitchAccuracy]);

  // Advance to next stage, skipping over any stages in skippableStages
  const nextStage = useCallback(() => {
    let newStage = stage + 1;
    
    // Skip over any stages that are in skippableStages (max stage is 7)
    while (newStage < 7 && skippableStages.includes(newStage)) {
      console.log(`[Day0] Skipping stage ${newStage} (already mastered)`);
      newStage++;
    }
    
    setStage(newStage);
    resetStageState(newStage);
    saveProgress(newStage);
  }, [
    stage,
    skippableStages,
    setStage,
    resetStageState,
    saveProgress,
  ]);

  // Go back within teaching stages (3+)
  const goBackTeaching = useCallback(
    (targetStage, targetSubStep) => {
      setStage(targetStage);
      setSubStep(targetSubStep);
    },
    [setStage, setSubStep],
  );

  return {
    saveProgress,
    completeDay0,
    nextStage,
    goBackTeaching,
  };
}
