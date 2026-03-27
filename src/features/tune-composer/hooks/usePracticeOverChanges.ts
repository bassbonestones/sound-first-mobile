/**
 * usePracticeOverChanges Hook
 *
 * Manages state for generating and playing scales, arpeggios, or guide tones
 * over a chord progression.
 */

import { useCallback, useState, useMemo } from "react";
import {
  generateOverChanges,
  type ChordProgressionRequest,
  type ChordProgressionResponse,
  type RhythmType,
} from "../../../api/generation";
import type {
  TuneComposerScore,
  PracticeOverChangesState,
  PracticeContentType,
  GeneratedPitchEvent,
  GeneratedChordSegment,
} from "../types";
import {
  DEFAULT_PRACTICE_OVER_CHANGES_STATE,
  getActiveProgression,
  getBeatsPerMeasure,
} from "../types";

// =============================================================================
// Types
// =============================================================================

export interface UsePracticeOverChangesReturn {
  // State
  /** Current practice state */
  practiceState: PracticeOverChangesState;

  // Mode
  /** Toggle practice mode on/off */
  togglePracticeMode: () => void;

  // Parameters
  /** Set content type (scales, arpeggios, guide_tones) */
  setContentType: (contentType: PracticeContentType) => void;
  /** Set pattern algorithm */
  setPattern: (pattern: string | null) => void;
  /** Set rhythm template */
  setRhythm: (rhythm: string) => void;
  /** Set tempo override (null = use tune tempo) */
  setTempoOverride: (tempo: number | null) => void;
  /** Set pitch range */
  setRange: (low: number, high: number) => void;

  // Generation
  /** Generate content over the current chord progression */
  generate: () => Promise<void>;
  /** Clear generated content */
  clearGenerated: () => void;

  // Computed
  /** Whether the score has chords available for generation */
  hasChords: boolean;
  /** The effective tempo for playback */
  effectiveTempo: number;
  /** Whether content has been generated */
  hasGeneratedContent: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Convert chord symbols from a score to ChordEvent format for the API.
 * Groups consecutive chords and calculates durations.
 */
function buildChordEventsFromScore(
  score: TuneComposerScore,
): { symbol: string; duration_beats: number }[] {
  const activeProgression = getActiveProgression(score);
  if (!activeProgression || activeProgression.chords.length === 0) {
    return [];
  }

  const beatsPerMeasure = getBeatsPerMeasure(score.timeSignature);
  const totalMeasures = score.measures.length;
  const totalBeats = totalMeasures * beatsPerMeasure;

  // Sort chords by position
  const sortedChords = [...activeProgression.chords].sort((a, b) => {
    if (a.measureIndex !== b.measureIndex) {
      return a.measureIndex - b.measureIndex;
    }
    return a.beatPosition - b.beatPosition;
  });

  if (sortedChords.length === 0) {
    return [];
  }

  // Build chord events with durations
  const events: { symbol: string; duration_beats: number }[] = [];

  for (let i = 0; i < sortedChords.length; i++) {
    const chord = sortedChords[i];
    const chordStartBeat =
      chord.measureIndex * beatsPerMeasure + chord.beatPosition;

    let chordEndBeat: number;
    if (i < sortedChords.length - 1) {
      // Duration extends to the next chord
      const nextChord = sortedChords[i + 1];
      chordEndBeat =
        nextChord.measureIndex * beatsPerMeasure + nextChord.beatPosition;
    } else {
      // Last chord extends to end of score
      chordEndBeat = totalBeats;
    }

    const duration = chordEndBeat - chordStartBeat;
    if (duration > 0) {
      events.push({
        symbol: chord.symbol,
        duration_beats: duration,
      });
    }
  }

  return events;
}

/**
 * Convert API response to internal state format.
 */
function convertApiResponse(response: ChordProgressionResponse): {
  segments: GeneratedChordSegment[];
  events: GeneratedPitchEvent[];
  totalBeats: number;
} {
  return {
    segments: response.segments.map((seg) => ({
      chord_symbol: seg.chord_symbol,
      scale_used: seg.scale_used,
      duration_beats: seg.duration_beats,
      events: seg.events.map((e) => ({
        midi_note: e.midi_note,
        pitch_name: e.pitch_name,
        duration_beats: e.duration_beats,
        offset_beats: e.offset_beats,
        velocity: e.velocity,
        is_rest: e.is_rest,
      })),
    })),
    events: response.events.map((e) => ({
      midi_note: e.midi_note,
      pitch_name: e.pitch_name,
      duration_beats: e.duration_beats,
      offset_beats: e.offset_beats,
      velocity: e.velocity,
      is_rest: e.is_rest,
    })),
    totalBeats: response.total_beats,
  };
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function usePracticeOverChanges(
  score: TuneComposerScore,
): UsePracticeOverChangesReturn {
  const [practiceState, setPracticeState] = useState<PracticeOverChangesState>(
    DEFAULT_PRACTICE_OVER_CHANGES_STATE,
  );

  // ==========================================================================
  // Computed Values
  // ==========================================================================

  const hasChords = useMemo(() => {
    const activeProgression = getActiveProgression(score);
    return (activeProgression?.chords.length ?? 0) > 0;
  }, [score]);

  const effectiveTempo = useMemo(() => {
    return practiceState.tempoOverride ?? score.tempo;
  }, [practiceState.tempoOverride, score.tempo]);

  const hasGeneratedContent = practiceState.events.length > 0;

  // ==========================================================================
  // Mode Toggle
  // ==========================================================================

  const togglePracticeMode = useCallback(() => {
    setPracticeState((prev) => ({
      ...prev,
      isActive: !prev.isActive,
      // Clear error when toggling
      error: null,
    }));
  }, []);

  // ==========================================================================
  // Parameter Setters
  // ==========================================================================

  const setContentType = useCallback((contentType: PracticeContentType) => {
    setPracticeState((prev) => ({
      ...prev,
      contentType,
      // Clear pattern when changing content type (patterns are type-specific)
      pattern: null,
    }));
  }, []);

  const setPattern = useCallback((pattern: string | null) => {
    setPracticeState((prev) => ({
      ...prev,
      pattern,
    }));
  }, []);

  const setRhythm = useCallback((rhythm: string) => {
    setPracticeState((prev) => ({
      ...prev,
      rhythm,
    }));
  }, []);

  const setTempoOverride = useCallback((tempo: number | null) => {
    setPracticeState((prev) => ({
      ...prev,
      tempoOverride: tempo,
    }));
  }, []);

  const setRange = useCallback((low: number, high: number) => {
    setPracticeState((prev) => ({
      ...prev,
      rangeLowMidi: Math.max(0, Math.min(127, low)),
      rangeHighMidi: Math.max(0, Math.min(127, high)),
    }));
  }, []);

  // ==========================================================================
  // Generation
  // ==========================================================================

  const generate = useCallback(async () => {
    if (!hasChords) {
      setPracticeState((prev) => ({
        ...prev,
        error: "No chords available. Add chord symbols first.",
      }));
      return;
    }

    setPracticeState((prev) => ({
      ...prev,
      isGenerating: true,
      error: null,
    }));

    try {
      const chordEvents = buildChordEventsFromScore(score);

      if (chordEvents.length === 0) {
        setPracticeState((prev) => ({
          ...prev,
          isGenerating: false,
          error: "No chord events to generate over.",
        }));
        return;
      }

      const request: ChordProgressionRequest = {
        content_type: practiceState.contentType,
        chords: chordEvents,
        rhythm: practiceState.rhythm as RhythmType,
        range_low_midi: practiceState.rangeLowMidi,
        range_high_midi: practiceState.rangeHighMidi,
      };

      if (practiceState.pattern) {
        request.pattern = practiceState.pattern;
      }

      const response = await generateOverChanges(request);
      const { segments, events, totalBeats } = convertApiResponse(response);

      setPracticeState((prev) => ({
        ...prev,
        isGenerating: false,
        error: null,
        segments,
        events,
        totalBeats,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Generation failed";
      setPracticeState((prev) => ({
        ...prev,
        isGenerating: false,
        error: message,
      }));
    }
  }, [
    hasChords,
    score,
    practiceState.contentType,
    practiceState.rhythm,
    practiceState.pattern,
    practiceState.rangeLowMidi,
    practiceState.rangeHighMidi,
  ]);

  const clearGenerated = useCallback(() => {
    setPracticeState((prev) => ({
      ...prev,
      segments: [],
      events: [],
      totalBeats: 0,
      error: null,
    }));
  }, []);

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    // State
    practiceState,

    // Mode
    togglePracticeMode,

    // Parameters
    setContentType,
    setPattern,
    setRhythm,
    setTempoOverride,
    setRange,

    // Generation
    generate,
    clearGenerated,

    // Computed
    hasChords,
    effectiveTempo,
    hasGeneratedContent,
  };
}
