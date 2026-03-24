/**
 * useTuneComposerPlayback Hook
 *
 * Manages playback state for the Tune Composer.
 * Based on useComposerPlayback with Tune types.
 */

import { useState, useCallback, useRef, useEffect } from "react";

import type { Note, TuneComposerScore } from "../types";
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
          beat += measure.notes[i].duration;
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

  const tick = useCallback(
    (timestamp: number) => {
      if (state !== "playing") return;

      if (lastTickRef.current === 0) {
        lastTickRef.current = timestamp;

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
      const noteDuration = currentNote.duration * secondsPerBeat;

      setCurrentEvent({
        note: currentNote,
        position,
        durationSeconds: noteDuration,
      });

      if (accumulatedTimeRef.current >= noteDuration) {
        accumulatedTimeRef.current -= noteDuration;

        const nextPos = getNextPosition(position, playRangeRef.current);

        if (nextPos) {
          setPosition(nextPos);

          const nextNote = getNoteAtPosition(nextPos);
          if (nextNote) {
            const nextDuration = nextNote.duration * secondsPerBeat;
            composerSynth.playNote(nextNote.midi, nextDuration * 1000);
            lastPlayedPositionRef.current = `${nextPos.measureIndex}-${nextPos.noteIndex}`;
          }
        } else if (repeatRef.current) {
          setPosition(INITIAL_POSITION);
          accumulatedTimeRef.current = 0;

          const firstNote = getNoteAtPosition(INITIAL_POSITION);
          if (firstNote) {
            const firstDuration = firstNote.duration * secondsPerBeat;
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
    setState("paused");
  }, []);

  const stop = useCallback(() => {
    setState("stopped");
    setPosition(INITIAL_POSITION);
    setCurrentEvent(null);
    playRangeRef.current = null;
    accumulatedTimeRef.current = 0;
    lastPlayedPositionRef.current = null;
  }, []);

  const stopAt = useCallback((pos: PlaybackPosition) => {
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
