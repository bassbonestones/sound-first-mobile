/**
 * useComposerPlayback Hook
 *
 * Manages playback state for the Practice Composer.
 * Handles play/pause/stop and cursor synchronization.
 */

import { useState, useCallback, useRef, useEffect } from "react";

import type { ComposerScore, Note } from "../types";
import { getBeatsPerMeasure } from "../types";
import { composerSynth } from "../services/composerSynth";

// =============================================================================
// Types
// =============================================================================

export type PlaybackState = "stopped" | "playing" | "paused";

export interface PlaybackPosition {
  /** Current measure index (0-based) */
  measureIndex: number;
  /** Current beat within the measure (0-based) */
  beat: number;
  /** Current note index within the measure (0-based) */
  noteIndex: number;
}

export interface PlaybackEvent {
  /** Note to play (null for rest) */
  note: Note;
  /** Position in the score */
  position: PlaybackPosition;
  /** Duration in seconds (at current tempo) */
  durationSeconds: number;
}

export interface ComposerPlaybackState {
  /** Current playback state */
  state: PlaybackState;
  /** Current position in the score */
  position: PlaybackPosition;
  /** Tempo in BPM */
  tempo: number;
  /** Whether we're at the start of the score */
  isAtStart: boolean;
  /** Whether we're at the end of the score */
  isAtEnd: boolean;
  /** Whether repeat/loop mode is enabled */
  repeat: boolean;
}

export interface ComposerPlaybackActions {
  /** Start or resume playback */
  play: () => void;
  /** Pause playback */
  pause: () => void;
  /** Stop and reset to beginning */
  stop: () => void;
  /** Stop and go to specific position */
  stopAt: (position: PlaybackPosition) => void;
  /** Play from current cursor position */
  playFromCursor: (cursorMeasure: number, cursorNote: number) => void;
  /** Play just the current measure */
  playMeasure: (measureIndex: number) => void;
  /** Set tempo */
  setTempo: (bpm: number) => void;
  /** Toggle repeat mode */
  toggleRepeat: () => void;
}

export interface UseComposerPlaybackResult {
  /** Current playback state */
  playback: ComposerPlaybackState;
  /** Playback actions */
  actions: ComposerPlaybackActions;
  /** Current playback event (for synthesizer integration) */
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

// =============================================================================
// Hook
// =============================================================================

export function useComposerPlayback(
  score: ComposerScore,
): UseComposerPlaybackResult {
  // State
  const [state, setState] = useState<PlaybackState>("stopped");
  const [position, setPosition] = useState<PlaybackPosition>(INITIAL_POSITION);
  const [tempo, setTempo] = useState(score.tempo);
  const [currentEvent, setCurrentEvent] = useState<PlaybackEvent | null>(null);
  const [repeat, setRepeat] = useState(false);

  // Refs for playback loop
  const animationFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);
  const playRangeRef = useRef<{
    startMeasure: number;
    endMeasure: number;
  } | null>(null);
  const lastPlayedPositionRef = useRef<string | null>(null);
  const repeatRef = useRef(false);

  // Keep repeat ref in sync with state
  useEffect(() => {
    repeatRef.current = repeat;
  }, [repeat]);

  // Sync tempo from score
  useEffect(() => {
    setTempo(score.tempo);
  }, [score.tempo]);

  // Compute derived state
  const isAtStart = position.measureIndex === 0 && position.noteIndex === 0;

  const isAtEnd =
    position.measureIndex >= score.measures.length - 1 &&
    position.noteIndex >=
      (score.measures[position.measureIndex]?.notes.length ?? 1) - 1;

  // Calculate seconds per beat at current tempo
  const getSecondsPerBeat = useCallback((bpm: number) => {
    return 60 / bpm;
  }, []);

  // Get next position (handles measure boundaries)
  const getNextPosition = useCallback(
    (
      current: PlaybackPosition,
      range: { startMeasure: number; endMeasure: number } | null,
    ): PlaybackPosition | null => {
      const measure = score.measures[current.measureIndex];
      if (!measure) return null;

      const nextNoteIndex = current.noteIndex + 1;

      // More notes in this measure?
      if (nextNoteIndex < measure.notes.length) {
        // Calculate new beat
        let beat = 0;
        for (let i = 0; i < nextNoteIndex; i++) {
          beat += measure.notes[i].duration;
        }
        return {
          measureIndex: current.measureIndex,
          beat,
          noteIndex: nextNoteIndex,
        };
      }

      // Move to next measure
      const nextMeasureIndex = current.measureIndex + 1;

      // Check range bounds
      if (range && nextMeasureIndex > range.endMeasure) {
        return null; // End of play range
      }

      // Check score bounds
      if (nextMeasureIndex >= score.measures.length) {
        return null; // End of score
      }

      // Start of next measure
      return {
        measureIndex: nextMeasureIndex,
        beat: 0,
        noteIndex: 0,
      };
    },
    [score.measures],
  );

  // Get current note at position
  const getNoteAtPosition = useCallback(
    (pos: PlaybackPosition): Note | null => {
      const measure = score.measures[pos.measureIndex];
      if (!measure) return null;
      return measure.notes[pos.noteIndex] ?? null;
    },
    [score.measures],
  );

  // Playback tick (called via requestAnimationFrame)
  const tick = useCallback(
    (timestamp: number) => {
      if (state !== "playing") return;

      // Initialize timing on first tick
      if (lastTickRef.current === 0) {
        lastTickRef.current = timestamp;

        // Play the first note immediately
        const firstNote = getNoteAtPosition(position);
        if (firstNote) {
          const secondsPerBeat = getSecondsPerBeat(tempo);
          const noteDuration = firstNote.duration * secondsPerBeat;
          composerSynth.playNote(firstNote.midi, noteDuration * 1000);
          lastPlayedPositionRef.current = `${position.measureIndex}-${position.noteIndex}`;
        }

        animationFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      // Calculate elapsed time
      const deltaMs = timestamp - lastTickRef.current;
      lastTickRef.current = timestamp;
      accumulatedTimeRef.current += deltaMs / 1000;

      // Get current note
      const currentNote = getNoteAtPosition(position);
      if (!currentNote) {
        // End of score
        setState("stopped");
        setCurrentEvent(null);
        lastPlayedPositionRef.current = null;
        return;
      }

      // Calculate duration of current note in seconds
      const secondsPerBeat = getSecondsPerBeat(tempo);
      const noteDuration = currentNote.duration * secondsPerBeat;

      // Emit current event
      setCurrentEvent({
        note: currentNote,
        position,
        durationSeconds: noteDuration,
      });

      // Check if it's time to advance
      if (accumulatedTimeRef.current >= noteDuration) {
        accumulatedTimeRef.current -= noteDuration;

        // Get next position
        const nextPos = getNextPosition(position, playRangeRef.current);

        if (nextPos) {
          setPosition(nextPos);

          // Play the next note
          const nextNote = getNoteAtPosition(nextPos);
          if (nextNote) {
            const nextDuration = nextNote.duration * secondsPerBeat;
            composerSynth.playNote(nextNote.midi, nextDuration * 1000);
            lastPlayedPositionRef.current = `${nextPos.measureIndex}-${nextPos.noteIndex}`;
          }
        } else if (repeatRef.current) {
          // Loop back to beginning if repeat is enabled
          setPosition(INITIAL_POSITION);
          accumulatedTimeRef.current = 0;

          // Play the first note
          const firstNote = getNoteAtPosition(INITIAL_POSITION);
          if (firstNote) {
            const firstDuration = firstNote.duration * secondsPerBeat;
            composerSynth.playNote(firstNote.midi, firstDuration * 1000);
            lastPlayedPositionRef.current = `0-0`;
          }
        } else {
          // End of playback
          setState("stopped");
          setPosition(INITIAL_POSITION);
          setCurrentEvent(null);
          playRangeRef.current = null;
          lastPlayedPositionRef.current = null;
          return;
        }
      }

      // Continue animation
      animationFrameRef.current = requestAnimationFrame(tick);
    },
    [
      state,
      position,
      tempo,
      getNoteAtPosition,
      getNextPosition,
      getSecondsPerBeat,
    ],
  );

  // Start playback effect
  useEffect(() => {
    if (state === "playing") {
      lastTickRef.current = 0;
      accumulatedTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [state, tick]);

  // Actions
  const play = useCallback(async () => {
    // Initialize synth if needed
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
      // Initialize synth if needed
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
    // Initialize synth if needed
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
