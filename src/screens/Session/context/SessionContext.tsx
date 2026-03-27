/**
 * Session Context - Manages all session state and handlers
 */
import React, {
  createContext,
  useReducer,
  useContext,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { Platform, Alert } from "react-native";
import { devWarn, devError } from "../../../utils/devLogger";
import { baseUrl } from "../../../api/client";
import type { PracticeSession, CurriculumStep } from "../../../types/session";
import {
  initialSessionContextState,
  type SessionContextState,
} from "./sessionContextTypes";
import { sessionContextReducer } from "./sessionContextReducer";

interface NavigationProp {
  navigate: (screen: string, params?: object) => void;
  replace?: (screen: string, params?: object) => void;
  goBack?: () => void;
}

interface RouteParams {
  duration?: number;
  fatigue?: number;
  selfDirected?: boolean;
  cooldownMode?: boolean;
  earOnlyMode?: boolean;
  instrumentId?: number;
  material_id?: number;
  focus_card_id?: number;
  goal?: string;
}

interface SessionProviderProps {
  children: ReactNode;
  routeParams?: RouteParams;
  navigation: NavigationProp;
}

const SessionContext = createContext(null);

function getSessionUrl(selfDirected = false) {
  const endpoint = selfDirected
    ? "generate-self-directed-session"
    : "generate-session";
  return `${baseUrl}/${endpoint}`;
}

export function SessionProvider({
  children,
  routeParams,
  navigation,
}: SessionProviderProps) {
  // Consolidated state via reducer
  const [state, dispatch] = useReducer(
    sessionContextReducer,
    initialSessionContextState,
  );

  // Destructure state for easier access
  const { core, timer, reflection, curriculum, help } = state;

  // Timer interval ref
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      .then((data: PracticeSession) => {
        dispatch({ type: "SET_SESSION", payload: data });
        dispatch({ type: "SET_SESSION_START_TIME", payload: Date.now() });
      })
      .catch((err) => {
        dispatch({
          type: "SET_ERROR",
          payload: err.message || "Network error",
        });
      });
  }, []);

  // Timer effect - update elapsed time and current clock every second
  useEffect(() => {
    if (!timer.sessionStartTime) return;

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      dispatch({
        type: "UPDATE_TIMER",
        payload: {
          elapsedSeconds: Math.floor((now - timer.sessionStartTime!) / 1000),
          currentTime: new Date(),
        },
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timer.sessionStartTime]);

  // Check if target duration reached
  const targetDurationSeconds = duration * 60;
  const isOverTime = timer.elapsedSeconds >= targetDurationSeconds;

  // Show time-up modal when target duration is reached (only once)
  useEffect(() => {
    if (isOverTime && !timer.hasShownTimeUpModal && !core.isLoading) {
      dispatch({ type: "MARK_TIME_UP_SHOWN" });
      dispatch({ type: "SHOW_TIME_UP_MODAL" });
    }
  }, [isOverTime, timer.hasShownTimeUpModal, core.isLoading]);

  // Auto-extend session when material runs out before time is up
  const fetchMoreMaterial = useCallback(async () => {
    if (!core.session || core.isLoading) return false;

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

      const newSession: PracticeSession = await response.json();

      if (newSession.mini_sessions && newSession.mini_sessions.length > 0) {
        // Append new mini-sessions to current session
        dispatch({ type: "APPEND_MINI_SESSIONS", payload: newSession });
        return true;
      }

      return false;
    } catch (err) {
      devWarn("[SessionContext] Failed to fetch more material:", err);
      return false;
    }
  }, [
    core.session,
    core.isLoading,
    selfDirected,
    fatigue,
    cooldownMode,
    earOnlyMode,
    material_id,
    focus_card_id,
    goal,
  ]);

  // Dismiss time-up modal and continue session
  const handleDismissTimeUp = useCallback(() => {
    dispatch({ type: "DISMISS_TIME_UP_MODAL" });
  }, []);

  // Handle extending session from time-up modal
  const handleTimeUpExtend = useCallback(async () => {
    dispatch({ type: "DISMISS_TIME_UP_MODAL" });
    await fetchMoreMaterial();
  }, [fetchMoreMaterial]);

  // Handle finishing session from time-up modal
  const handleTimeUpFinish = useCallback(() => {
    dispatch({ type: "DISMISS_TIME_UP_MODAL" });
    navigation.navigate("SessionEnd", {
      completedCount: core.currentIndex + 1,
      totalDuration: Math.ceil(timer.elapsedSeconds / 60),
      sessionParams: { duration, fatigue, cooldownMode, earOnlyMode },
    });
  }, [
    core.currentIndex,
    timer.elapsedSeconds,
    duration,
    fatigue,
    cooldownMode,
    earOnlyMode,
    navigation,
  ]);

  // Fetch curriculum when mini-session changes
  useEffect(() => {
    const currentSession = core.session;
    const currentIdx = core.currentIndex;
    if (!currentSession?.mini_sessions?.[currentIdx]) return;
    const mini = currentSession.mini_sessions[currentIdx];
    if (!("mini_session_id" in mini)) return;

    dispatch({ type: "SET_CURRICULUM_LOADING", payload: true });

    fetch(
      `${baseUrl}/mini-sessions/${(mini as { mini_session_id: number }).mini_session_id}/curriculum`,
    )
      .then((res) =>
        res.ok ? res.json() : Promise.reject("Failed to load curriculum"),
      )
      .then(
        (data: { steps?: CurriculumStep[]; current_step_index?: number }) => {
          dispatch({ type: "SET_CURRICULUM_STEPS", payload: data.steps || [] });
          dispatch({
            type: "SET_CURRENT_STEP_INDEX",
            payload: data.current_step_index || 0,
          });
          dispatch({ type: "SET_CURRICULUM_LOADING", payload: false });
        },
      )
      .catch((err) => {
        devWarn("[SessionContext] Curriculum load error:", err);
        dispatch({ type: "SET_CURRICULUM_STEPS", payload: [] });
        dispatch({ type: "SET_CURRICULUM_LOADING", payload: false });
      });
  }, [core.session, core.currentIndex]);

  // Current mini-session helper
  const mini = core.session?.mini_sessions?.[core.currentIndex];

  // Handle step completion
  const handleCompleteStep = useCallback(
    async (
      stepIndex: number,
      stepRating: number | null = null,
      strain = false,
    ) => {
      if (!mini || !("mini_session_id" in mini)) return;
      const miniSessionId = (mini as { mini_session_id: number })
        .mini_session_id;

      try {
        const res = await fetch(
          `${baseUrl}/mini-sessions/${miniSessionId}/steps/${stepIndex}/complete`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              rating: stepRating,
              strain_detected: strain,
            }),
          },
        );

        const data = await res.json();

        if (data.attempt_count !== undefined) {
          dispatch({
            type: "SET_RANGE_ATTEMPT_COUNT",
            payload: data.attempt_count,
          });
        }

        if (data.status === "strain_detected") {
          dispatch({ type: "SET_STRAIN_DETECTED", payload: true });
          Alert.alert("⚠️ Range Safety", data.message, [
            { text: "OK", onPress: () => handleSkip() },
          ]);
        } else if (data.status === "max_attempts") {
          Alert.alert(
            "Range Work Complete",
            `${data.message}\n\nYou made ${data.attempt_count} attempts. Consider resting before more range work.`,
            [
              {
                text: "Continue",
                onPress: () => dispatch({ type: "SHOW_REFLECTION" }),
              },
            ],
          );
          dispatch({
            type: "UPDATE_STEP_COMPLETED",
            payload: { stepIndex, rating: stepRating },
          });
        } else if (data.status === "next_step") {
          dispatch({
            type: "UPDATE_STEP_COMPLETED",
            payload: { stepIndex, rating: stepRating },
          });
          dispatch({
            type: "SET_CURRENT_STEP_INDEX",
            payload: data.next_step_index,
          });

          if (data.is_range_work && data.attempt_count === 2) {
            Alert.alert(
              "Range Check",
              "This is your last attempt before auto-recovery. Only continue if you feel comfortable.",
              [{ text: "Got it" }],
            );
          }
        } else if (data.status === "completed") {
          dispatch({
            type: "UPDATE_STEP_COMPLETED",
            payload: { stepIndex, rating: stepRating },
          });
          dispatch({ type: "SHOW_REFLECTION" });
        }
      } catch (err) {
        devError("[SessionContext] Step completion error:", err);
      }
    },
    [mini],
  );

  // Get current curriculum step
  const getCurrentStep = useCallback(() => {
    if (curriculum.curriculumSteps.length === 0) return null;
    return curriculum.curriculumSteps[curriculum.currentStepIndex] || null;
  }, [curriculum.curriculumSteps, curriculum.currentStepIndex]);

  // Reset curriculum state helper
  const resetCurriculumState = useCallback(() => {
    dispatch({ type: "RESET_CURRICULUM" });
  }, []);

  // Handle reflection submit
  const handleReflectionSubmit = useCallback(async () => {
    dispatch({ type: "SET_SUBMITTING", payload: true });
    try {
      const res = await fetch(`${baseUrl}/practice-attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: 1,
          material_id: (mini as { material_id?: number })?.material_id,
          key: (mini as { key?: string })?.key,
          focus_card_id: (mini as { focus_card_id?: number })?.focus_card_id,
          rating: reflection.rating || 3,
          fatigue: reflection.fatigueInput,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Failed to submit attempt");
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      dispatch({ type: "SET_SUBMITTING", payload: false });
      dispatch({ type: "RESET_REFLECTION" });
      dispatch({ type: "RESET_CURRICULUM" });

      const session = core.session;
      const currentIdx = core.currentIndex;

      if (session && currentIdx < session.mini_sessions.length - 1) {
        dispatch({ type: "INCREMENT_CURRENT_INDEX" });
      } else if (!isOverTime) {
        // Session material exhausted but time remains - try to fetch more
        const gotMore = await fetchMoreMaterial();
        if (gotMore) {
          dispatch({ type: "INCREMENT_CURRENT_INDEX" });
        } else {
          // No more material available - offer to finish early
          navigation.navigate("SessionEnd", {
            completedCount: session?.mini_sessions.length ?? 0,
            totalDuration: Math.ceil(timer.elapsedSeconds / 60),
            sessionParams: { duration, fatigue, cooldownMode, earOnlyMode },
          });
        }
      } else {
        // Session complete - navigate to end screen
        navigation.navigate("SessionEnd", {
          completedCount: session?.mini_sessions.length ?? 0,
          totalDuration: Math.ceil(timer.elapsedSeconds / 60),
          sessionParams: { duration, fatigue, cooldownMode, earOnlyMode },
        });
      }
    }
  }, [
    mini,
    reflection.rating,
    reflection.fatigueInput,
    core.session,
    core.currentIndex,
    isOverTime,
    fetchMoreMaterial,
    timer.elapsedSeconds,
    duration,
    fatigue,
    cooldownMode,
    earOnlyMode,
    navigation,
  ]);

  // Skip handler
  const handleSkip = useCallback(async () => {
    dispatch({ type: "HIDE_REFLECTION" });
    dispatch({ type: "SET_REFLECTION_TEXT", payload: "" });
    dispatch({ type: "SET_EXTENDED", payload: false });
    dispatch({ type: "RESET_CURRICULUM" });

    const session = core.session;
    const currentIdx = core.currentIndex;

    if (session && currentIdx < session.mini_sessions.length - 1) {
      dispatch({ type: "INCREMENT_CURRENT_INDEX" });
    } else if (!isOverTime) {
      // Session material exhausted but time remains - try to fetch more
      const gotMore = await fetchMoreMaterial();
      if (gotMore) {
        dispatch({ type: "INCREMENT_CURRENT_INDEX" });
      } else {
        // No more material available - offer to finish early
        navigation.navigate("SessionEnd", {
          completedCount: session?.mini_sessions.length ?? 0,
          totalDuration: Math.ceil(timer.elapsedSeconds / 60),
          sessionParams: { duration, fatigue, cooldownMode, earOnlyMode },
        });
      }
    } else {
      // Session complete - navigate to end screen
      navigation.navigate("SessionEnd", {
        completedCount: session?.mini_sessions.length ?? 0,
        totalDuration: Math.ceil(timer.elapsedSeconds / 60),
        sessionParams: { duration, fatigue, cooldownMode, earOnlyMode },
      });
    }
  }, [
    core.session,
    core.currentIndex,
    isOverTime,
    fetchMoreMaterial,
    timer.elapsedSeconds,
    duration,
    fatigue,
    cooldownMode,
    earOnlyMode,
    navigation,
  ]);

  // Extend handler
  const handleExtend = useCallback(() => {
    dispatch({ type: "SET_EXTENDED", payload: true });
    dispatch({ type: "HIDE_REFLECTION" });
  }, []);

  // Show reflection modal
  const handleNext = useCallback(() => {
    dispatch({ type: "SHOW_REFLECTION" });
  }, []);

  // Setter callbacks for backward compatibility
  const setSession = useCallback((session: PracticeSession) => {
    dispatch({ type: "SET_SESSION", payload: session });
  }, []);

  const setCurrent = useCallback((index: number) => {
    dispatch({ type: "SET_CURRENT_INDEX", payload: index });
  }, []);

  const setShowReflection = useCallback((show: boolean) => {
    dispatch({ type: show ? "SHOW_REFLECTION" : "HIDE_REFLECTION" });
  }, []);

  const setReflection = useCallback((text: string) => {
    dispatch({ type: "SET_REFLECTION_TEXT", payload: text });
  }, []);

  const setExtended = useCallback((extended: boolean) => {
    dispatch({ type: "SET_EXTENDED", payload: extended });
  }, []);

  const setFatigueInput = useCallback((value: number) => {
    dispatch({ type: "SET_FATIGUE_INPUT", payload: value });
  }, []);

  const setRating = useCallback((rating: number | null) => {
    dispatch({ type: "SET_RATING", payload: rating });
  }, []);

  const setShowHelpMenu = useCallback((show: boolean) => {
    dispatch({ type: show ? "SHOW_HELP_MENU" : "HIDE_HELP_MENU" });
  }, []);

  const setShowMiniLesson = useCallback(
    (show: boolean) => {
      if (show) {
        // When showing, callers should use setSelectedCapabilityId first
        dispatch({
          type: "SHOW_MINI_LESSON",
          payload: help.selectedCapabilityId ?? 0,
        });
      } else {
        dispatch({ type: "HIDE_MINI_LESSON" });
      }
    },
    [help.selectedCapabilityId],
  );

  const setSelectedCapabilityId = useCallback((id: number | null) => {
    dispatch({ type: "SET_SELECTED_CAPABILITY_ID", payload: id });
  }, []);

  const value = {
    // Session state (backward compatible)
    session: core.session,
    setSession,
    current: core.currentIndex,
    setCurrent,
    loading: core.isLoading,
    error: core.error,
    mini,

    // Timer state
    elapsedSeconds: timer.elapsedSeconds,
    currentTime: timer.currentTime,
    targetDurationSeconds,
    isOverTime,
    showTimeUpModal: timer.showTimeUpModal,
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
    curriculumSteps: curriculum.curriculumSteps,
    currentStepIndex: curriculum.currentStepIndex,
    curriculumLoading: curriculum.isCurriculumLoading,
    strainDetected: curriculum.strainDetected,
    rangeAttemptCount: curriculum.rangeAttemptCount,
    getCurrentStep,

    // Reflection state
    showReflection: reflection.showReflection,
    setShowReflection,
    reflection: reflection.reflectionText,
    setReflection,
    extended: reflection.isExtended,
    setExtended,
    fatigueInput: reflection.fatigueInput,
    setFatigueInput,
    rating: reflection.rating,
    setRating,
    submitting: reflection.isSubmitting,

    // Help state
    showHelpMenu: help.showHelpMenu,
    setShowHelpMenu,
    showMiniLesson: help.showMiniLesson,
    setShowMiniLesson,
    selectedCapabilityId: help.selectedCapabilityId,
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
