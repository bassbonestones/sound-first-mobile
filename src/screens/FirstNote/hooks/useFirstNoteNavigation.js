/**
 * useFirstNoteNavigation - Stage navigation for FirstNote flow
 */
import { useCallback } from "react";
import { getBackendUrl } from "../../../api/client";

export default function useFirstNoteNavigation({
  userId,
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
        await fetch(`${getBackendUrl()}/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ day0_stage: newStage }),
        });
      } catch (err) {
        console.error("Failed to save progress:", err);
      }
    },
    [userId],
  );

  // Complete Day 0
  const completeDay0 = useCallback(async () => {
    try {
      await fetch(`${getBackendUrl()}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day0_completed: true, day0_stage: 7 }),
      });
      navigation.replace("StartPractice");
    } catch (err) {
      console.error("Failed to complete Day 0:", err);
      navigation.replace("StartPractice");
    }
  }, [userId, navigation]);

  // Advance to next stage
  const nextStage = useCallback(() => {
    const newStage = stage + 1;
    setStage(newStage);
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
    saveProgress(newStage);
  }, [
    stage,
    setStage,
    setSubStep,
    setFocusCardIndex,
    setFocusCardRatings,
    setFocusStepsDone,
    setPitchAccuracy,
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
