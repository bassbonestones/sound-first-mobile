/**
 * FirstNoteContext - State management for FirstNote (Day 0) flow
 * Uses useReducer for centralized state management with extracted hooks for audio and navigation
 */
import React, {
  createContext,
  useContext,
  useReducer,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { devLog, devError } from "../../../utils/devLogger";
import { parseNoteName, generateSingleNoteMusicXML } from "../utils";
import { INSTRUMENT_CLEFS } from "../data";
import { useFirstNoteAudio, useFirstNoteNavigation } from "../hooks";
import { getBackendUrl } from "../../../api/client";
import { firstNoteContextReducer } from "./firstNoteContextReducer";
import { initialFirstNoteContextState } from "./firstNoteContextTypes";

const FirstNoteContext = createContext(null);

interface RouteParams {
  userId?: number;
  instrumentId?: number | null;
  resonantNote?: string;
  instrument?: string;
}

interface FirstNoteProviderProps {
  children: ReactNode;
  navigation: {
    navigate?: (screen: string, params?: Record<string, unknown>) => void;
    dispatch?: (action: unknown) => void;
  };
  route?: {
    params?: RouteParams;
  };
}

/**
 * Provider component that manages all FirstNote state and logic
 */
export function FirstNoteProvider({
  children,
  navigation,
  route,
}: FirstNoteProviderProps) {
  const {
    userId = 1,
    instrumentId = null,
    resonantNote = "Bb3",
    instrument = "trombone",
  } = route?.params || {};

  // Centralized state management via reducer
  const [state, dispatch] = useReducer(
    firstNoteContextReducer,
    initialFirstNoteContextState,
  );

  // Destructure state slices for convenience
  const { flow, explorer, focusCard, ui } = state;

  // Wrapper setters that dispatch actions (for backward compatibility with hooks)
  const setStage = useCallback(
    (value: number) => dispatch({ type: "SET_STAGE", payload: value }),
    [],
  );
  const setSubStep = useCallback(
    (value: number) => dispatch({ type: "SET_SUB_STEP", payload: value }),
    [],
  );
  const setPitchExplorerIndex = useCallback(
    (value: number) =>
      dispatch({ type: "SET_PITCH_EXPLORER_INDEX", payload: value }),
    [],
  );
  const setAccidentalExplorer = useCallback(
    (value: "natural" | "sharp" | "flat") =>
      dispatch({ type: "SET_ACCIDENTAL_EXPLORER", payload: value }),
    [],
  );
  const setShowSummary = useCallback(
    (value: boolean) => dispatch({ type: "SET_SHOW_SUMMARY", payload: value }),
    [],
  );
  const setIsLoading = useCallback(
    (value: boolean) => dispatch({ type: "SET_LOADING", payload: value }),
    [],
  );
  const setError = useCallback(
    (value: string | null) => dispatch({ type: "SET_ERROR", payload: value }),
    [],
  );
  const setSkippableStages = useCallback(
    (value: number[]) =>
      dispatch({ type: "SET_SKIPPABLE_STAGES", payload: value }),
    [],
  );
  const setVolume = useCallback(
    (value: number) => dispatch({ type: "SET_VOLUME", payload: value }),
    [],
  );
  const setPitchAccuracy = useCallback(
    (value: "correct" | "off" | null) =>
      dispatch({ type: "SET_PITCH_ACCURACY", payload: value }),
    [],
  );
  const setFocusCardIndex = useCallback(
    (value: number) =>
      dispatch({ type: "SET_FOCUS_CARD_INDEX", payload: value }),
    [],
  );
  const setFocusCardRatings = useCallback(
    (value: number[]) =>
      dispatch({ type: "SET_FOCUS_CARD_RATINGS", payload: value }),
    [],
  );
  // Supports both direct value and functional updater (like React's useState)
  type FocusStepsDone = typeof focusCard.focusStepsDone;
  const setFocusStepsDone = useCallback(
    (
      valueOrUpdater:
        | FocusStepsDone
        | ((prev: FocusStepsDone) => FocusStepsDone),
    ) => {
      const newValue =
        typeof valueOrUpdater === "function"
          ? valueOrUpdater(focusCard.focusStepsDone)
          : valueOrUpdater;
      dispatch({ type: "SET_FOCUS_STEPS_DONE", payload: newValue });
    },
    [focusCard.focusStepsDone],
  );
  const setFocusActiveStep = useCallback(
    (value: number) =>
      dispatch({ type: "SET_FOCUS_ACTIVE_STEP", payload: value }),
    [],
  );
  const setRating = useCallback(
    (value: number | null) => dispatch({ type: "SET_RATING", payload: value }),
    [],
  );

  // Refs
  const gotCorrectPitchRef = useRef(false);
  const focusListenStartedRef = useRef(false);
  const scrollToEndRef = useRef<(() => void) | null>(null);

  // Scroll helper - call this to scroll the main ScrollView to the end
  const scrollToEnd = useCallback(() => {
    if (scrollToEndRef.current) {
      scrollToEndRef.current();
    }
  }, []);

  // Derived values
  const noteInfo = useMemo(() => parseNoteName(resonantNote), [resonantNote]);
  const clefType = useMemo(
    () => INSTRUMENT_CLEFS[instrument.toLowerCase()] || "treble",
    [instrument],
  );
  const stage6MusicXML = useMemo(
    () => generateSingleNoteMusicXML(resonantNote, clefType),
    [resonantNote, clefType],
  );

  // Audio hook
  const audio = useFirstNoteAudio(resonantNote);

  // Fetch skippable stages on mount (for users who already mastered global caps)
  useEffect(() => {
    const fetchDay0Status = async () => {
      try {
        const url = instrumentId
          ? `${getBackendUrl()}/users/${userId}/day0-status?instrument_id=${instrumentId}`
          : `${getBackendUrl()}/users/${userId}/day0-status`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setSkippableStages(data.skippable_stages || []);
          devLog("[Day0] Skippable stages:", data.skippable_stages);
        }
      } catch (err) {
        devError("[Day0] Failed to fetch day0 status:", err);
      }
    };
    fetchDay0Status();
  }, [userId, instrumentId]);

  // Navigation hook
  const nav = useFirstNoteNavigation({
    userId,
    instrumentId,
    skippableStages: flow.skippableStages,
    stage: flow.stage,
    setStage,
    setSubStep,
    setFocusCardIndex,
    setFocusCardRatings,
    setFocusStepsDone,
    setPitchAccuracy,
    navigation,
  });

  // Reset UI state when stage or subStep changes
  useEffect(() => {
    audio.resetHeardIt();
    setRating(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.stage, flow.subStep]);

  // Mark Focus Card listen step as done when audio ends
  useEffect(() => {
    if (flow.stage === 2 && focusListenStartedRef.current && !audio.isPlaying) {
      dispatch({ type: "SET_FOCUS_STEP_DONE", payload: "listen" });
      focusListenStartedRef.current = false;
    }
  }, [flow.stage, audio.isPlaying]);

  // Handle successful pitch match
  const handlePitchMatch = useCallback(
    (isMatch: boolean) => {
      setPitchAccuracy(isMatch ? "correct" : "off");
      if (isMatch) {
        gotCorrectPitchRef.current = true;
      }
    },
    [setPitchAccuracy],
  );

  // Handle sound end (for advancing after they play in Stage 1)
  const handleSoundEnd = useCallback(() => {
    if (flow.stage === 1 && flow.subStep === 2) {
      setSubStep(3);
      gotCorrectPitchRef.current = false;
    }
  }, [flow.stage, flow.subStep, setSubStep]);

  const value = {
    // Route params
    userId,
    resonantNote,
    instrument,
    navigation,

    // Core state (from reducer)
    stage: flow.stage,
    setStage,
    subStep: flow.subStep,
    setSubStep,
    skippableStages: flow.skippableStages,
    pitchExplorerIndex: explorer.pitchExplorerIndex,
    setPitchExplorerIndex,
    accidentalExplorer: explorer.accidentalExplorer,
    setAccidentalExplorer,
    showSummary: ui.showSummary,
    setShowSummary,
    isLoading: ui.isLoading,
    setIsLoading,
    error: ui.error,
    setError,

    // Audio state (from hook)
    isPlaying: audio.isPlaying,
    playCount: audio.playCount,
    showHeardItButton: audio.showHeardItButton,
    setShowHeardItButton: audio.setShowHeardItButton,

    // Audio UI state (from reducer)
    volume: ui.volume,
    setVolume,
    pitchAccuracy: ui.pitchAccuracy,
    setPitchAccuracy,
    focusCardIndex: focusCard.focusCardIndex,
    setFocusCardIndex,
    focusCardRatings: focusCard.focusCardRatings,
    setFocusCardRatings,
    focusStepsDone: focusCard.focusStepsDone,
    setFocusStepsDone,
    focusActiveStep: focusCard.focusActiveStep,
    setFocusActiveStep,
    rating: ui.rating,
    setRating,

    // Derived values
    noteInfo,
    clefType,
    stage6MusicXML,

    // Refs
    gotCorrectPitchRef,
    focusListenStartedRef,
    scrollToEndRef,

    // Scroll helpers
    scrollToEnd,

    // Audio handlers (from hook)
    playNote: audio.playNote,
    playPitchExplorer: audio.playPitchExplorer,
    playAccidentalExplorer: audio.playAccidentalExplorer,
    playCombinedExplorer: audio.playCombinedExplorer,
    stopAudio: audio.stopAudio,

    // Navigation handlers (from hook)
    saveProgress: nav.saveProgress,
    completeDay0: nav.completeDay0,
    nextStage: nav.nextStage,
    goBackTeaching: nav.goBackTeaching,

    // Other handlers
    handlePitchMatch,
    handleSoundEnd,
  };

  return (
    <FirstNoteContext.Provider value={value}>
      {children}
    </FirstNoteContext.Provider>
  );
}

/**
 * Hook to access FirstNote context
 */
export function useFirstNote() {
  const context = useContext(FirstNoteContext);
  if (!context) {
    throw new Error("useFirstNote must be used within a FirstNoteProvider");
  }
  return context;
}
