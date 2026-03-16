/**
 * Onboarding Screen
 *
 * Multi-step onboarding flow:
 * 1. Instrument Selection - pick family & instrument
 * 2. Starting Note Selection - pick via staff or microphone
 */

import React, { useState, useCallback } from "react";
import { Alert } from "react-native";
import ErrorBoundary from "../../components/ErrorBoundary";
import { useUser } from "../../context/UserContext";
import {
  instrumentDefaults,
  getClefForInstrument,
  getIconForInstrument,
} from "./data/instruments";
import InstrumentStep from "./steps/InstrumentStep";
import StartingNoteStep from "./steps/StartingNoteStep";

function OnboardingScreen({ navigation, route }) {
  const { addInstrument, loadInstruments } = useUser();

  // Get initial step from route params (for dev navigation)
  const initialStep = route?.params?.step || 1;
  const clearFamily = route?.params?.clearFamily || false;
  const addingInstrument = route?.params?.addingInstrument || false;

  // State
  const [selectedFamily, setSelectedFamily] = useState(clearFamily ? "" : "");
  const [instrument, setInstrument] = useState("");
  const [startingNote, setStartingNote] = useState("");
  const [playToSelectMode, setPlayToSelectMode] = useState(false);
  const [detectedPitch, setDetectedPitch] = useState(null);
  const [isSounding, setIsSounding] = useState(false);
  const [step, setStep] = useState(initialStep);

  // Derived values
  const clef = getClefForInstrument(instrument, selectedFamily);
  const instrumentIcon = getIconForInstrument(instrument, selectedFamily);

  // -------------------------------------------------------------------------
  // Instrument Selection Handlers (Step 1)
  // -------------------------------------------------------------------------

  const selectFamily = useCallback((familyName) => {
    setSelectedFamily(familyName);
    setInstrument("");
    setStartingNote("");
  }, []);

  const selectInstrument = useCallback((instName) => {
    setInstrument(instName);
    const defaults =
      instrumentDefaults[instName] || instrumentDefaults["Other"];
    setStartingNote(defaults.startingNote);
  }, []);

  // -------------------------------------------------------------------------
  // Pitch Detection Handlers (Step 2 - Play to Select)
  // -------------------------------------------------------------------------

  const handleRealtimePitch = useCallback((pitchInfo) => {
    if (pitchInfo && pitchInfo.noteName) {
      setDetectedPitch({ ...pitchInfo, isRealtime: true });
      setIsSounding(true);
    }
  }, []);

  const handleFinalPitch = useCallback((pitchInfo) => {
    if (pitchInfo && pitchInfo.noteName) {
      setDetectedPitch({ ...pitchInfo, isRealtime: false });
      setIsSounding(false);
    }
  }, []);

  const handleSoundEnd = useCallback(() => {
    setIsSounding(false);
    setDetectedPitch((prev) => (prev ? { ...prev, isRealtime: false } : null));
  }, []);

  const confirmDetectedPitch = useCallback(() => {
    if (detectedPitch?.noteName) {
      setStartingNote(detectedPitch.noteName);
      setPlayToSelectMode(false);
      setDetectedPitch(null);
    }
  }, [detectedPitch]);

  // -------------------------------------------------------------------------
  // Submit Handler
  // -------------------------------------------------------------------------

  const handleSubmit = async () => {
    if (!instrument) {
      Alert.alert("Please select your instrument");
      return;
    }
    if (!startingNote) {
      Alert.alert("Please select your starting note");
      return;
    }
    try {
      // Create the instrument via the new UserInstrument API
      const newInstrument = await addInstrument({
        instrument_name: instrument,
        clef: clef,
        resonant_note: startingNote,
        range_low: startingNote,
        range_high: startingNote,
        is_primary: !addingInstrument, // Primary if this is first instrument
      });

      // Reload instruments to update context
      await loadInstruments();

      // Navigate to Day 0 First Note Experience
      navigation.replace("FirstNote", {
        userId: 1,
        instrumentId: newInstrument.id,
        resonantNote: startingNote,
        instrument,
      });
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (step === 1) {
    return (
      <ErrorBoundary>
        <InstrumentStep
          selectedFamily={selectedFamily}
          instrument={instrument}
          onSelectFamily={selectFamily}
          onSelectInstrument={selectInstrument}
          onNext={() => setStep(2)}
          onNavigateAdmin={() => navigation.navigate("Admin")}
        />
      </ErrorBoundary>
    );
  }

  if (step === 2) {
    return (
      <ErrorBoundary>
        <StartingNoteStep
          instrument={instrument}
          instrumentIcon={instrumentIcon}
          clef={clef}
          startingNote={startingNote}
          playToSelectMode={playToSelectMode}
          detectedPitch={detectedPitch}
          isSounding={isSounding}
          onChangeNote={setStartingNote}
          onRealtimePitch={handleRealtimePitch}
          onFinalPitch={handleFinalPitch}
          onSoundEnd={handleSoundEnd}
          onConfirmPitch={confirmDetectedPitch}
          onSetPlayToSelectMode={setPlayToSelectMode}
          onBack={() => setStep(1)}
          onSubmit={handleSubmit}
        />
      </ErrorBoundary>
    );
  }

  return null;
}

export default OnboardingScreen;
