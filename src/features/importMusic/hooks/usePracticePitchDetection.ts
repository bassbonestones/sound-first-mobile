/**
 * usePracticePitchDetection Hook
 *
 * Integrates pitch detection with practice mode, tracking
 * pitch matches and calculating accuracy scores.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { usePitchDetection } from "../../../hooks/usePitchDetection";
import type { CurrentNoteTarget, PitchMatchState, NotePerformance } from "../types/practiceTypes";
import {
  midiToFrequency,
  calculateCents,
  isPitchMatch,
} from "../types/practiceTypes";

// ============================================================================
// Types
// ============================================================================

export interface UsePracticePitchDetectionOptions {
  /** Whether detection is enabled */
  enabled: boolean;
  /** Current target note to match */
  targetNote: CurrentNoteTarget | null;
  /** Current measure number */
  currentMeasure: number;
  /** Current beat number */
  currentBeat: number;
  /** Cents tolerance for a match (default: 50) */
  centsTolerance?: number;
  /** Allow octave-equivalent matches (default: true) */
  allowOctaveEquivalent?: boolean;
  /** Called when a note performance is recorded */
  onNotePerformance?: (performance: NotePerformance) => void;
}

export interface UsePracticePitchDetectionReturn {
  /** Current pitch match state for UI */
  pitchState: PitchMatchState;
  /** Whether pitch detection is available */
  isAvailable: boolean;
  /** Whether pitch detection is currently listening */
  isListening: boolean;
  /** Permission status */
  permissionGranted: boolean;
  /** Error message if any */
  error: string | null;
  /** Start listening for pitch */
  startListening: () => Promise<void>;
  /** Stop listening for pitch */
  stopListening: () => void;
  /** Note performances recorded this session */
  performances: NotePerformance[];
  /** Clear recorded performances */
  clearPerformances: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function usePracticePitchDetection({
  enabled,
  targetNote,
  currentMeasure,
  currentBeat,
  centsTolerance = 50,
  allowOctaveEquivalent = true,
  onNotePerformance,
}: UsePracticePitchDetectionOptions): UsePracticePitchDetectionReturn {
  // State for pitch matching
  const [pitchState, setPitchState] = useState<PitchMatchState>({
    targetNote: null,
    detectedMidiNote: null,
    detectedNoteName: null,
    centsDeviation: 0,
    isMatching: false,
    confidence: 0,
    volume: 0,
    isSounding: false,
  });

  // Performance tracking
  const [performances, setPerformances] = useState<NotePerformance[]>([]);
  
  // Refs for tracking the current note's best match
  const currentNoteRef = useRef<{
    targetMidi: number;
    measureNumber: number;
    beatNumber: number;
    bestMatch: {
      playedMidi: number | null;
      cents: number;
      wasCorrect: boolean;
      detectedTime: number | null;
    };
  } | null>(null);

  // Frequency range for the current target note (±2 octaves for tolerance)
  const frequencyRange = targetNote && !targetNote.isRest
    ? {
        min: midiToFrequency(targetNote.midiNote - 24),
        max: midiToFrequency(targetNote.midiNote + 24),
      }
    : null;

  // Handle pitch detection callback
  const handlePitchDetected = useCallback(
    (noteInfo: { noteName: string; midiNote: number; frequency: number; cents: number }) => {
      if (!targetNote || targetNote.isRest) {
        setPitchState((prev) => ({
          ...prev,
          detectedMidiNote: noteInfo.midiNote,
          detectedNoteName: noteInfo.noteName,
          centsDeviation: 0,
          isMatching: false,
          confidence: 1,
        }));
        return;
      }

      // Calculate cents deviation from target
      const targetFreq = midiToFrequency(targetNote.midiNote);
      const cents = calculateCents(noteInfo.frequency, targetFreq);
      
      // Check if this is a match
      const isMatch = isPitchMatch(
        noteInfo.midiNote,
        targetNote.midiNote,
        cents,
        { allowOctaveEquivalent, centsTolerance },
      );

      setPitchState((prev) => ({
        ...prev,
        targetNote,
        detectedMidiNote: noteInfo.midiNote,
        detectedNoteName: noteInfo.noteName,
        centsDeviation: cents,
        isMatching: isMatch,
        confidence: 1,
      }));

      // Update best match for current note
      const currentRef = currentNoteRef.current;
      if (
        currentRef &&
        currentRef.targetMidi === targetNote.midiNote &&
        currentRef.measureNumber === currentMeasure &&
        currentRef.beatNumber === currentBeat
      ) {
        // If this is a better match (closer or first match)
        const currentBest = currentRef.bestMatch;
        if (
          !currentBest.playedMidi ||
          isMatch ||
          Math.abs(cents) < Math.abs(currentBest.cents)
        ) {
          currentNoteRef.current = {
            ...currentRef,
            bestMatch: {
              playedMidi: noteInfo.midiNote,
              cents,
              wasCorrect: isMatch,
              detectedTime: Date.now(),
            },
          };
        }
      }
    },
    [targetNote, currentMeasure, currentBeat, centsTolerance, allowOctaveEquivalent],
  );

  // Handle volume changes
  const handleVolumeChange = useCallback((volume: number) => {
    setPitchState((prev) => ({
      ...prev,
      volume,
    }));
  }, []);

  // Handle sound start/end
  const handleSoundStart = useCallback(() => {
    setPitchState((prev) => ({ ...prev, isSounding: true }));
  }, []);

  const handleSoundEnd = useCallback(() => {
    setPitchState((prev) => ({
      ...prev,
      isSounding: false,
      detectedMidiNote: null,
      detectedNoteName: null,
      isMatching: false,
    }));
  }, []);

  // Use the pitch detection hook
  const {
    isListening,
    permissionGranted,
    error,
    isAvailable,
    startListening: startPitchListening,
    stopListening: stopPitchListening,
  } = usePitchDetection({
    enabled: enabled && !targetNote?.isRest,
    // Use onRealtimePitch for continuous feedback during play (not onPitchDetected which only fires on silence)
    onRealtimePitch: handlePitchDetected,
    onVolumeChange: handleVolumeChange,
    onSoundStart: handleSoundStart,
    onSoundEnd: handleSoundEnd,
    soundingFrequencyRange: frequencyRange,
    volumeThreshold: 0.02,
    silenceDuration: 200,
  });

  // Track when target note changes - record performance for previous note
  useEffect(() => {
    // Record performance for the previous note
    const prevRef = currentNoteRef.current;
    if (prevRef) {
      const performance: NotePerformance = {
        targetMidiNote: prevRef.targetMidi,
        playedMidiNote: prevRef.bestMatch.playedMidi,
        centsDeviation: prevRef.bestMatch.playedMidi ? prevRef.bestMatch.cents : null,
        wasCorrect: prevRef.bestMatch.wasCorrect,
        noteIndex: 0, // Could be enhanced to track position
        measureNumber: prevRef.measureNumber,
        beatNumber: prevRef.beatNumber,
        expectedTime: Date.now() - 1000, // Approximate
        detectedTime: prevRef.bestMatch.detectedTime,
      };
      
      setPerformances((prev) => [...prev, performance]);
      onNotePerformance?.(performance);
    }

    // Start tracking new note
    if (targetNote && !targetNote.isRest) {
      currentNoteRef.current = {
        targetMidi: targetNote.midiNote,
        measureNumber: currentMeasure,
        beatNumber: currentBeat,
        bestMatch: {
          playedMidi: null,
          cents: 0,
          wasCorrect: false,
          detectedTime: null,
        },
      };
    } else {
      currentNoteRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetNote?.midiNote, currentMeasure, currentBeat, onNotePerformance]);

  // Update target in state when it changes
  useEffect(() => {
    setPitchState((prev) => ({
      ...prev,
      targetNote: targetNote ?? null,
    }));
  }, [targetNote]);

  // Clear state when disabled
  useEffect(() => {
    if (!enabled) {
      setPitchState({
        targetNote: null,
        detectedMidiNote: null,
        detectedNoteName: null,
        centsDeviation: 0,
        isMatching: false,
        confidence: 0,
        volume: 0,
        isSounding: false,
      });
    }
  }, [enabled]);

  // Clear performances
  const clearPerformances = useCallback(() => {
    setPerformances([]);
    currentNoteRef.current = null;
  }, []);

  // Wrapped start listening
  const startListening = useCallback(async () => {
    clearPerformances();
    await startPitchListening();
  }, [startPitchListening, clearPerformances]);

  return {
    pitchState,
    isAvailable,
    isListening,
    permissionGranted,
    error,
    startListening,
    stopListening: stopPitchListening,
    performances,
    clearPerformances,
  };
}
