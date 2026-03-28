/**
 * useTuneComposerPlayback Hook
 *
 * Manages playback state for the Tune Composer.
 * Based on useComposerPlayback with Tune types.
 */

import { useState, useCallback, useRef, useEffect } from "react";

import type { Note, TuneComposerScore } from "../types";
import { getNoteDuration } from "../types";
// Re-use the composer synth service
import { composerSynth } from "../../composer/services/composerSynth";

// =============================================================================
// Types
// =============================================================================

export type PlaybackState = "stopped" | "playing" | "paused";

export interface PlaybackPosition {
  measureIndex: number;
  beat: number;
  noteIndex: number;
}

export interface PlaybackEvent {
  note: Note;
  position: PlaybackPosition;
  durationSeconds: number;
}

export interface TuneComposerPlaybackState {
  state: PlaybackState;
  position: PlaybackPosition;
  tempo: number;
  isAtStart: boolean;
  isAtEnd: boolean;
  repeat: boolean;
}

export interface TuneComposerPlaybackActions {
  play: () => void;
  pause: () => void;
  stop: () => void;
  stopAt: (position: PlaybackPosition) => void;
  playFromCursor: (cursorMeasure: number, cursorNote: number) => void;
  playMeasure: (measureIndex: number) => void;
  setTempo: (bpm: number) => void;
  toggleRepeat: () => void;
}

export interface UseTuneComposerPlaybackResult {
  playback: TuneComposerPlaybackState;
  actions: TuneComposerPlaybackActions;
  currentEvent: PlaybackEvent | null;
}

// =============================================================================
// Constants
// =============================================================================

const INITIAL_POSITION: PlaybackPosition = {
  measureIndex: 0,
  beat: 0,
  noteIndex: 0,
};

/** Swing ratio - first half of the beat pair gets this fraction (2:1 swing = 2/3) */
const SWING_RATIO = 2 / 3;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Calculate the half-beat duration based on time signature.
 * Duration units are relative to quarter note = 1.
 *
 * In 4/4 (beatUnit=4): beat = 1.0, half-beat = 0.5 (eighth note)
 * In 4/8 (beatUnit=8): beat = 0.5, half-beat = 0.25 (sixteenth note)
 * In 2/2 (beatUnit=2): beat = 2.0, half-beat = 1.0 (quarter note)
 */
function getHalfBeat(beatUnit: number): number {
  // One beat = 4/beatUnit in quarter-note units
  // Half-beat = (4/beatUnit) / 2 = 2/beatUnit
  return 2 / beatUnit;
}

/**
 * Get the duration of one beat based on the beat unit.
 * Duration units are relative to quarter note = 1.
 */
function getBeatDuration(beatUnit: number): number {
  return 4 / beatUnit;
}

/**
 * Apply swing timing to a note's duration for playback.
 *
 * Swing works by shifting the off-beat position within each beat.
 * This affects:
 * 1. Notes that START on an off-beat (shortened to fit before the next beat)
 * 2. Notes that END on an off-beat (extended so the next note starts at swung position)
 */
function getSwungDuration(
  beatPosition: number,
  noteDuration: number,
  beatUnit: number,
  swingEnabled: boolean,
): number {
  if (!swingEnabled) return noteDuration;

  const beatDuration = getBeatDuration(beatUnit);
  const halfBeat = getHalfBeat(beatUnit);
  const endPosition = beatPosition + noteDuration;

  // Check where this note starts and ends within a beat
  // Use modulo with actual beat duration, not hardcoded 1
  const startInBeat = beatPosition % beatDuration;
  const endInBeat = endPosition % beatDuration;

  const startsOnBeat = Math.abs(startInBeat) < 0.001;
  const startsOffBeat = Math.abs(startInBeat - halfBeat) < 0.001;
  const endsOnBeat = Math.abs(endInBeat) < 0.001;
  const endsOffBeat = Math.abs(endInBeat - halfBeat) < 0.001;

  // Calculate swing extension relative to the beat size
  // SWING_RATIO is 2/3 of a beat, so extension = (2/3 - 1/2) * beatDuration
  const swingExtension = (SWING_RATIO - 0.5) * beatDuration;

  // Case 1: Note starts on-beat and ends off-beat (e.g., on-beat eighth, or dotted quarter)
  // Extend it so the next note starts at the swung off-beat position
  if (startsOnBeat && endsOffBeat) {
    return noteDuration + swingExtension;
  }

  // Case 2: Note starts off-beat and ends on-beat (e.g., off-beat eighth)
  // Shorten it because swing pushed its start later
  if (startsOffBeat && endsOnBeat) {
    return noteDuration - swingExtension;
  }

  // Case 3: Note starts on-beat and ends on-beat (e.g., quarter, half, whole)
  // No swing adjustment needed
  if (startsOnBeat && endsOnBeat) {
    return noteDuration;
  }

  // Case 4: Note starts off-beat and ends off-beat (e.g., off-beat to off-beat)
  // Both start and end are shifted, so duration stays the same
  if (startsOffBeat && endsOffBeat) {
    return noteDuration;
  }

  // Other cases: no swing adjustment (complex rhythms, triplets, etc.)
  return noteDuration;
}

// Export helpers for testing
export { getSwungDuration, SWING_RATIO };

// =============================================================================
// Hook
// =============================================================================

export function useTuneComposerPlayback(
  score: TuneComposerScore,
): UseTuneComposerPlaybackResult {
  const [state, setState] = useState<PlaybackState>("stopped");
  const [position, setPosition] = useState<PlaybackPosition>(INITIAL_POSITION);
  const [tempo, setTempo] = useState(score.tempo);
  const [currentEvent, setCurrentEvent] = useState<PlaybackEvent | null>(null);
  const [repeat, setRepeat] = useState(false);

  const animationFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);
  const playRangeRef = useRef<{
    startMeasure: number;
    endMeasure: number;
  } | null>(null);
  const lastPlayedPositionRef = useRef<string | null>(null);
  const repeatRef = useRef(false);
  const tickRef = useRef<((timestamp: number) => void) | null>(null);

  useEffect(() => {
    repeatRef.current = repeat;
  }, [repeat]);

  useEffect(() => {
    setTempo(score.tempo);
  }, [score.tempo]);

  const isAtStart = position.measureIndex === 0 && position.noteIndex === 0;
  const isAtEnd =
    position.measureIndex >= score.measures.length - 1 &&
    position.noteIndex >=
      (score.measures[position.measureIndex]?.notes.length ?? 1) - 1;

  const getSecondsPerBeat = useCallback((bpm: number) => {
    return 60 / bpm;
  }, []);

  const getNextPosition = useCallback(
    (
      current: PlaybackPosition,
      range: { startMeasure: number; endMeasure: number } | null,
    ): PlaybackPosition | null => {
      const measure = score.measures[current.measureIndex];
      if (!measure) return null;

      const nextNoteIndex = current.noteIndex + 1;

      if (nextNoteIndex < measure.notes.length) {
        let beat = 0;
        for (let i = 0; i < nextNoteIndex; i++) {
          beat += getNoteDuration(measure.notes[i]);
        }
        return {
          measureIndex: current.measureIndex,
          beat,
          noteIndex: nextNoteIndex,
        };
      }

      const nextMeasureIndex = current.measureIndex + 1;

      if (range && nextMeasureIndex > range.endMeasure) {
        return null;
      }

      if (nextMeasureIndex >= score.measures.length) {
        return null;
      }

      return {
        measureIndex: nextMeasureIndex,
        beat: 0,
        noteIndex: 0,
      };
    },
    [score.measures],
  );

  const getNoteAtPosition = useCallback(
    (pos: PlaybackPosition): Note | null => {
      const measure = score.measures[pos.measureIndex];
      if (!measure) return null;
      return measure.notes[pos.noteIndex] ?? null;
    },
    [score.measures],
  );

  /**
   * Calculate total duration of a note including any tied notes that follow.
   */
  const getTiedNoteDuration = useCallback(
    (startPos: PlaybackPosition): number => {
      let totalDuration = 0;
      let currentPos: PlaybackPosition | null = startPos;

      while (currentPos) {
        const note = getNoteAtPosition(currentPos);
        if (!note) break;

        totalDuration += getNoteDuration(note);

        // If this note has tieStart, continue to next note
        if (note.tieStart) {
          currentPos = getNextPosition(currentPos, null);
        } else {
          break;
        }
      }

      return totalDuration;
    },
    [getNoteAtPosition, getNextPosition],
  );

  const tick = useCallback(
    (timestamp: number) => {
      if (state !== "playing") return;

      if (lastTickRef.current === 0) {
        lastTickRef.current = timestamp;

        const firstNote = getNoteAtPosition(position);
        // Only play if this is not a tie continuation
        if (firstNote && !firstNote.tieEnd) {
          const secondsPerBeat = getSecondsPerBeat(tempo);
          // Use tied duration if note has tieStart
          const totalBeats = firstNote.tieStart
            ? getTiedNoteDuration(position)
            : getNoteDuration(firstNote);
          const noteDuration = totalBeats * secondsPerBeat;
          composerSynth.playNote(firstNote.midi, noteDuration * 1000);
          lastPlayedPositionRef.current = `${position.measureIndex}-${position.noteIndex}`;
        }

        animationFrameRef.current = requestAnimationFrame((ts) =>
          tickRef.current?.(ts),
        );
        return;
      }

      const deltaMs = timestamp - lastTickRef.current;
      lastTickRef.current = timestamp;
      accumulatedTimeRef.current += deltaMs / 1000;

      const currentNote = getNoteAtPosition(position);
      if (!currentNote) {
        setState("stopped");
        setCurrentEvent(null);
        lastPlayedPositionRef.current = null;
        return;
      }

      const secondsPerBeat = getSecondsPerBeat(tempo);
      const rawDuration = getNoteDuration(currentNote);
      // Apply swing timing - affects when we move to the next note
      const swungDuration = getSwungDuration(
        position.beat,
        rawDuration,
        score.timeSignature.beatUnit,
        score.playbackSettings.swingEnabled,
      );
      const noteTimingDuration = swungDuration * secondsPerBeat;

      setCurrentEvent({
        note: currentNote,
        position,
        durationSeconds: rawDuration * secondsPerBeat,
      });

      if (accumulatedTimeRef.current >= noteTimingDuration) {
        accumulatedTimeRef.current -= noteTimingDuration;

        const nextPos = getNextPosition(position, playRangeRef.current);

        if (nextPos) {
          setPosition(nextPos);

          const nextNote = getNoteAtPosition(nextPos);
          if (nextNote) {
            // Only play if this note is NOT a tie continuation
            if (!nextNote.tieEnd) {
              // Use tied duration if note has tieStart
              const totalBeats = nextNote.tieStart
                ? getTiedNoteDuration(nextPos)
                : getNoteDuration(nextNote);
              const nextDuration = totalBeats * secondsPerBeat;
              composerSynth.playNote(nextNote.midi, nextDuration * 1000);
            }
            lastPlayedPositionRef.current = `${nextPos.measureIndex}-${nextPos.noteIndex}`;
          }
        } else if (repeatRef.current) {
          setPosition(INITIAL_POSITION);
          accumulatedTimeRef.current = 0;

          const firstNote = getNoteAtPosition(INITIAL_POSITION);
          // Only play if not a tie continuation
          if (firstNote && !firstNote.tieEnd) {
            // Use tied duration if note has tieStart
            const totalBeats = firstNote.tieStart
              ? getTiedNoteDuration(INITIAL_POSITION)
              : getNoteDuration(firstNote);
            const firstDuration = totalBeats * secondsPerBeat;
            composerSynth.playNote(firstNote.midi, firstDuration * 1000);
            lastPlayedPositionRef.current = `0-0`;
          }
        } else {
          setState("stopped");
          setPosition(INITIAL_POSITION);
          setCurrentEvent(null);
          playRangeRef.current = null;
          lastPlayedPositionRef.current = null;
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame((ts) =>
        tickRef.current?.(ts),
      );
    },
    [
      state,
      position,
      tempo,
      getNoteAtPosition,
      getNextPosition,
      getSecondsPerBeat,
      getTiedNoteDuration,
      score.timeSignature.beatUnit,
      score.playbackSettings.swingEnabled,
    ],
  );

  // Keep tickRef up to date with latest tick callback
  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  // Stable wrapper that calls the latest tick
  const tickWrapper = useCallback((timestamp: number) => {
    tickRef.current?.(timestamp);
  }, []);

  useEffect(() => {
    if (state === "playing") {
      lastTickRef.current = 0;
      accumulatedTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(tickWrapper);
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [state, tickWrapper]);

  const play = useCallback(async () => {
    if (!composerSynth.isReady()) {
      await composerSynth.init();
    }
    await composerSynth.resume();

    playRangeRef.current = null;
    lastPlayedPositionRef.current = null;
    setState("playing");
  }, []);

  const pause = useCallback(() => {
    composerSynth.stopAll();
    setState("paused");
  }, []);

  const stop = useCallback(() => {
    composerSynth.stopAll();
    setState("stopped");
    setPosition(INITIAL_POSITION);
    setCurrentEvent(null);
    playRangeRef.current = null;
    accumulatedTimeRef.current = 0;
    lastPlayedPositionRef.current = null;
  }, []);

  const stopAt = useCallback((pos: PlaybackPosition) => {
    composerSynth.stopAll();
    setState("stopped");
    setPosition(pos);
    setCurrentEvent(null);
    playRangeRef.current = null;
    accumulatedTimeRef.current = 0;
    lastPlayedPositionRef.current = null;
  }, []);

  const playFromCursor = useCallback(
    async (cursorMeasure: number, cursorNote: number) => {
      if (!composerSynth.isReady()) {
        await composerSynth.init();
      }
      await composerSynth.resume();

      setPosition({
        measureIndex: cursorMeasure,
        beat: 0,
        noteIndex: cursorNote,
      });
      playRangeRef.current = null;
      accumulatedTimeRef.current = 0;
      lastPlayedPositionRef.current = null;
      setState("playing");
    },
    [],
  );

  const playMeasure = useCallback(async (measureIndex: number) => {
    if (!composerSynth.isReady()) {
      await composerSynth.init();
    }
    await composerSynth.resume();

    setPosition({
      measureIndex,
      beat: 0,
      noteIndex: 0,
    });
    playRangeRef.current = {
      startMeasure: measureIndex,
      endMeasure: measureIndex,
    };
    accumulatedTimeRef.current = 0;
    lastPlayedPositionRef.current = null;
    setState("playing");
  }, []);

  const handleSetTempo = useCallback((bpm: number) => {
    const clamped = Math.max(20, Math.min(300, bpm));
    setTempo(clamped);
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeat((prev) => !prev);
  }, []);

  return {
    playback: {
      state,
      position,
      tempo,
      isAtStart,
      isAtEnd,
      repeat,
    },
    actions: {
      play,
      pause,
      stop,
      stopAt,
      playFromCursor,
      playMeasure,
      setTempo: handleSetTempo,
      toggleRepeat,
    },
    currentEvent,
  };
}
