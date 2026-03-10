/**
 * FirstNoteContext - State management for FirstNote (Day 0) flow
 * Uses extracted hooks for audio and navigation
 */
import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { parseNoteName, generateSingleNoteMusicXML } from "../utils";
import { INSTRUMENT_CLEFS, DEFAULT_PITCH_EXPLORER_INDEX } from "../data";
import { useFirstNoteAudio, useFirstNoteNavigation } from "../hooks";
import { getBackendUrl } from "../../../api/client";

const FirstNoteContext = createContext(null);

/**
 * Provider component that manages all FirstNote state and logic
 */
export function FirstNoteProvider({ children, navigation, route }) {
  const {
    userId = 1,
    instrumentId = null,
    resonantNote = "Bb3",
    instrument = "trombone",
  } = route?.params || {};

  // Core state
  const [stage, setStage] = useState(0);
  const [subStep, setSubStep] = useState(0);
  const [pitchExplorerIndex, setPitchExplorerIndex] = useState(
    DEFAULT_PITCH_EXPLORER_INDEX,
  );
  const [accidentalExplorer, setAccidentalExplorer] = useState("natural");
  const [showSummary, setShowSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Skippable stages (for returning users with a new instrument)
  const [skippableStages, setSkippableStages] = useState([]);

  // Audio UI state
  const [volume, setVolume] = useState(0);
  const [pitchAccuracy, setPitchAccuracy] = useState(null);
  const [focusCardIndex, setFocusCardIndex] = useState(0);
  const [focusCardRatings, setFocusCardRatings] = useState([]);
  const [focusStepsDone, setFocusStepsDone] = useState({
    listen: false,
    sing: false,
    imagine: false,
    play: false,
  });
  const [focusActiveStep, setFocusActiveStep] = useState(0);
  const [rating, setRating] = useState(null);

  // Refs
  const gotCorrectPitchRef = useRef(false);
  const focusListenStartedRef = useRef(false);

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
          console.log("[Day0] Skippable stages:", data.skippable_stages);
        }
      } catch (err) {
        console.error("[Day0] Failed to fetch day0 status:", err);
      }
    };
    fetchDay0Status();
  }, [userId, instrumentId]);

  // Navigation hook
  const nav = useFirstNoteNavigation({
    userId,
    instrumentId,
    skippableStages,
    stage,
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
  }, [stage, subStep]);

  // Mark Focus Card listen step as done when audio ends
  useEffect(() => {
    if (stage === 2 && focusListenStartedRef.current && !audio.isPlaying) {
      setFocusStepsDone((prev) => ({ ...prev, listen: true }));
      focusListenStartedRef.current = false;
    }
  }, [stage, audio.isPlaying]);

  // Handle successful pitch match
  const handlePitchMatch = useCallback((isMatch) => {
    setPitchAccuracy(isMatch ? "correct" : "off");
    if (isMatch) {
      gotCorrectPitchRef.current = true;
    }
  }, []);

  // Handle sound end (for advancing after they play in Stage 1)
  const handleSoundEnd = useCallback(() => {
    if (stage === 1 && subStep === 2) {
      setSubStep(3);
      gotCorrectPitchRef.current = false;
    }
  }, [stage, subStep]);

  const value = {
    // Route params
    userId,
    resonantNote,
    instrument,
    navigation,

    // Core state
    stage,
    setStage,
    subStep,
    setSubStep,
    skippableStages,
    pitchExplorerIndex,
    setPitchExplorerIndex,
    accidentalExplorer,
    setAccidentalExplorer,
    showSummary,
    setShowSummary,
    isLoading,
    setIsLoading,
    error,
    setError,

    // Audio state (from hook)
    isPlaying: audio.isPlaying,
    playCount: audio.playCount,
    showHeardItButton: audio.showHeardItButton,
    setShowHeardItButton: audio.setShowHeardItButton,

    // Audio UI state
    volume,
    setVolume,
    pitchAccuracy,
    setPitchAccuracy,
    focusCardIndex,
    setFocusCardIndex,
    focusCardRatings,
    setFocusCardRatings,
    focusStepsDone,
    setFocusStepsDone,
    focusActiveStep,
    setFocusActiveStep,
    rating,
    setRating,

    // Derived values
    noteInfo,
    clefType,
    stage6MusicXML,

    // Refs
    gotCorrectPitchRef,
    focusListenStartedRef,

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
