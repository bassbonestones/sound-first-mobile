/**
 * Session Context - Manages all session state and handlers
 */
import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { Platform, Alert } from "react-native";
import { baseUrl } from "../../../api/client";

const SessionContext = createContext(null);

function getSessionUrl(selfDirected = false) {
  const endpoint = selfDirected
    ? "generate-self-directed-session"
    : "generate-session";
  return `${baseUrl}/${endpoint}`;
}

export function SessionProvider({ children, routeParams, navigation }) {
  // Session state
  const [session, setSession] = useState(null);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Timer state
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [hasShownTimeUpModal, setHasShownTimeUpModal] = useState(false);
  const timerIntervalRef = useRef(null);

  // Reflection modal state
  const [showReflection, setShowReflection] = useState(false);
  const [reflection, setReflection] = useState("");
  const [extended, setExtended] = useState(false);
  const [fatigueInput, setFatigueInput] = useState(2);
  const [rating, setRating] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Curriculum step state
  const [curriculumSteps, setCurriculumSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [strainDetected, setStrainDetected] = useState(false);
  const [rangeAttemptCount, setRangeAttemptCount] = useState(0);

  // Help menu and mini-lesson state
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [showMiniLesson, setShowMiniLesson] = useState(false);
  const [selectedCapabilityId, setSelectedCapabilityId] = useState(null);

  // Route params
  const duration = routeParams?.duration || 20;
  const fatigue = routeParams?.fatigue || 2;
  const selfDirected = routeParams?.selfDirected || false;
  const cooldownMode = routeParams?.cooldownMode || false;
  const earOnlyMode = routeParams?.earOnlyMode || false;
  const instrumentId = routeParams?.instrumentId;
  const material_id = routeParams?.material_id;
  const focus_card_id = routeParams?.focus_card_id;
  const goal = routeParams?.goal;

  // Fetch session on mount
  useEffect(() => {
    const url = getSessionUrl(selfDirected);
    let body;
    if (selfDirected) {
      body = JSON.stringify({
        user_id: 1,
        planned_duration_minutes: duration,
        material_id,
        focus_card_id,
        goal_type: goal,
        instrument_id: instrumentId,
      });
    } else {
      body = JSON.stringify({
        planned_duration_minutes: duration,
        fatigue,
        cooldown_mode: cooldownMode,
        ear_only_mode: earOnlyMode,
        instrument_id: instrumentId,
      });
    }

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Server error: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setSession(data);
        setLoading(false);
        setSessionStartTime(Date.now());
      })
      .catch((err) => {
        setError(err.message || "Network error");
        setLoading(false);
      });
  }, []);

  // Timer effect - update elapsed time and current clock every second
  useEffect(() => {
    if (!sessionStartTime) return;

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      setElapsedSeconds(Math.floor((now - sessionStartTime) / 1000));
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [sessionStartTime]);

  // Check if target duration reached
  const targetDurationSeconds = duration * 60;
  const isOverTime = elapsedSeconds >= targetDurationSeconds;

  // Show time-up modal when target duration is reached (only once)
  useEffect(() => {
    if (isOverTime && !hasShownTimeUpModal && !loading) {
      setHasShownTimeUpModal(true);
      setShowTimeUpModal(true);
    }
  }, [isOverTime, hasShownTimeUpModal, loading]);

  // Auto-extend session when material runs out before time is up
  const fetchMoreMaterial = useCallback(async () => {
    if (!session || loading) return false;

    try {
      const url = getSessionUrl(selfDirected);
      let body;

      if (selfDirected) {
        body = JSON.stringify({
          user_id: 1,
          planned_duration_minutes: 10, // Get ~10 mins more
          material_id,
          focus_card_id,
          goal_type: goal,
        });
      } else {
        body = JSON.stringify({
          planned_duration_minutes: 10,
          fatigue,
          cooldown_mode: cooldownMode,
          ear_only_mode: earOnlyMode,
        });
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!response.ok) return false;

      const newSession = await response.json();

      if (newSession.mini_sessions && newSession.mini_sessions.length > 0) {
        // Append new mini-sessions to current session
        setSession((prev) => ({
          ...prev,
          mini_sessions: [...prev.mini_sessions, ...newSession.mini_sessions],
        }));
        return true;
      }

      return false;
    } catch (err) {
      console.warn("[SessionContext] Failed to fetch more material:", err);
      return false;
    }
  }, [
    session,
    loading,
    selfDirected,
    fatigue,
    cooldownMode,
    earOnlyMode,
    material_id,
    focus_card_id,
    goal,
  ]);

  // Dismiss time-up modal and continue session
  const handleDismissTimeUp = () => {
    setShowTimeUpModal(false);
  };

  // Handle extending session from time-up modal
  const handleTimeUpExtend = async () => {
    setShowTimeUpModal(false);
    await fetchMoreMaterial();
  };

  // Handle finishing session from time-up modal
  const handleTimeUpFinish = () => {
    setShowTimeUpModal(false);
    navigation.navigate("SessionEnd", {
      completedCount: current + 1,
      totalDuration: Math.ceil(elapsedSeconds / 60),
      sessionParams: { duration, fatigue, cooldownMode, earOnlyMode },
    });
  };

  // Fetch curriculum when mini-session changes
  useEffect(() => {
    if (!session?.mini_sessions?.[current]?.mini_session_id) return;
    const mini = session.mini_sessions[current];

    setCurriculumLoading(true);

    fetch(`${baseUrl}/mini-sessions/${mini.mini_session_id}/curriculum`)
      .then((res) =>
        res.ok ? res.json() : Promise.reject("Failed to load curriculum"),
      )
      .then((data) => {
        setCurriculumSteps(data.steps || []);
        setCurrentStepIndex(data.current_step_index || 0);
        setCurriculumLoading(false);
      })
      .catch((err) => {
        console.warn("[SessionContext] Curriculum load error:", err);
        setCurriculumSteps([]);
        setCurriculumLoading(false);
      });
  }, [session, current]);

  // Current mini-session helper
  const mini = session?.mini_sessions?.[current];

  // Handle step completion
  const handleCompleteStep = async (
    stepIndex,
    stepRating = null,
    strain = false,
  ) => {
    if (!mini?.mini_session_id) return;

    try {
      const res = await fetch(
        `${baseUrl}/mini-sessions/${mini.mini_session_id}/steps/${stepIndex}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating: stepRating, strain_detected: strain }),
        },
      );

      const data = await res.json();

      if (data.attempt_count !== undefined) {
        setRangeAttemptCount(data.attempt_count);
      }

      if (data.status === "strain_detected") {
        setStrainDetected(true);
        Alert.alert("⚠️ Range Safety", data.message, [
          { text: "OK", onPress: () => handleSkip() },
        ]);
      } else if (data.status === "max_attempts") {
        Alert.alert(
          "Range Work Complete",
          `${data.message}\n\nYou made ${data.attempt_count} attempts. Consider resting before more range work.`,
          [{ text: "Continue", onPress: () => setShowReflection(true) }],
        );
        setCurriculumSteps((prev) =>
          prev.map((s, i) =>
            i === stepIndex
              ? { ...s, is_completed: true, rating: stepRating }
              : s,
          ),
        );
      } else if (data.status === "next_step") {
        setCurriculumSteps((prev) =>
          prev.map((s, i) =>
            i === stepIndex
              ? { ...s, is_completed: true, rating: stepRating }
              : s,
          ),
        );
        setCurrentStepIndex(data.next_step_index);

        if (data.is_range_work && data.attempt_count === 2) {
          Alert.alert(
            "Range Check",
            "This is your last attempt before auto-recovery. Only continue if you feel comfortable.",
            [{ text: "Got it" }],
          );
        }
      } else if (data.status === "completed") {
        setCurriculumSteps((prev) =>
          prev.map((s, i) =>
            i === stepIndex
              ? { ...s, is_completed: true, rating: stepRating }
              : s,
          ),
        );
        setShowReflection(true);
      }
    } catch (err) {
      console.error("[SessionContext] Step completion error:", err);
    }
  };

  // Get current curriculum step
  const getCurrentStep = () => {
    if (curriculumSteps.length === 0) return null;
    return curriculumSteps[currentStepIndex] || null;
  };

  // Reset curriculum state helper
  const resetCurriculumState = () => {
    setCurriculumSteps([]);
    setCurrentStepIndex(0);
    setStrainDetected(false);
    setRangeAttemptCount(0);
  };

  // Handle reflection submit
  const handleReflectionSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${baseUrl}/practice-attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: 1,
          material_id: mini.material_id,
          key: mini.key,
          focus_card_id: mini.focus_card_id,
          rating: rating || 3,
          fatigue: fatigueInput,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Failed to submit attempt");
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSubmitting(false);
      setShowReflection(false);
      setReflection("");
      setExtended(false);
      setFatigueInput(2);
      setRating(null);
      resetCurriculumState();
      if (current < session.mini_sessions.length - 1) {
        setCurrent(current + 1);
      } else if (!isOverTime) {
        // Session material exhausted but time remains - try to fetch more
        const gotMore = await fetchMoreMaterial();
        if (gotMore) {
          setCurrent(current + 1);
        } else {
          // No more material available - offer to finish early
          navigation.navigate("SessionEnd", {
            completedCount: session.mini_sessions.length,
            totalDuration: Math.ceil(elapsedSeconds / 60),
            sessionParams: { duration, fatigue, cooldownMode, earOnlyMode },
          });
        }
      } else {
        // Session complete - navigate to end screen
        navigation.navigate("SessionEnd", {
          completedCount: session.mini_sessions.length,
          totalDuration: Math.ceil(elapsedSeconds / 60),
          sessionParams: { duration, fatigue, cooldownMode, earOnlyMode },
        });
      }
    }
  };

  // Skip handler
  const handleSkip = async () => {
    setShowReflection(false);
    setReflection("");
    setExtended(false);
    resetCurriculumState();
    if (current < session.mini_sessions.length - 1) {
      setCurrent(current + 1);
    } else if (!isOverTime) {
      // Session material exhausted but time remains - try to fetch more
      const gotMore = await fetchMoreMaterial();
      if (gotMore) {
        setCurrent(current + 1);
      } else {
        // No more material available - offer to finish early
        navigation.navigate("SessionEnd", {
          completedCount: session.mini_sessions.length,
          totalDuration: Math.ceil(elapsedSeconds / 60),
          sessionParams: { duration, fatigue, cooldownMode, earOnlyMode },
        });
      }
    } else {
      // Session complete - navigate to end screen
      navigation.navigate("SessionEnd", {
        completedCount: session.mini_sessions.length,
        totalDuration: Math.ceil(elapsedSeconds / 60),
        sessionParams: { duration, fatigue, cooldownMode, earOnlyMode },
      });
    }
  };

  // Extend handler
  const handleExtend = () => {
    setExtended(true);
    setShowReflection(false);
  };

  // Show reflection modal
  const handleNext = () => {
    setShowReflection(true);
  };

  const value = {
    // Session state
    session,
    setSession,
    current,
    setCurrent,
    loading,
    error,
    mini,

    // Timer state
    elapsedSeconds,
    currentTime,
    targetDurationSeconds,
    isOverTime,
    showTimeUpModal,
    handleDismissTimeUp,
    handleTimeUpExtend,
    handleTimeUpFinish,

    // Route params
    routeParams,
    duration,
    cooldownMode,
    earOnlyMode,
    selfDirected,

    // Curriculum state
    curriculumSteps,
    currentStepIndex,
    curriculumLoading,
    strainDetected,
    rangeAttemptCount,
    getCurrentStep,

    // Reflection state
    showReflection,
    setShowReflection,
    reflection,
    setReflection,
    extended,
    setExtended,
    fatigueInput,
    setFatigueInput,
    rating,
    setRating,
    submitting,

    // Help state
    showHelpMenu,
    setShowHelpMenu,
    showMiniLesson,
    setShowMiniLesson,
    selectedCapabilityId,
    setSelectedCapabilityId,

    // Handlers
    handleCompleteStep,
    handleReflectionSubmit,
    handleSkip,
    handleExtend,
    handleNext,
    fetchMoreMaterial,

    // Navigation
    navigation,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
