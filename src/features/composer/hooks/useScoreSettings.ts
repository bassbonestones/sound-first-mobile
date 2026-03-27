/**
 * useScoreSettings Hook
 *
 * Extracted from useComposerState - handles score-level settings:
 * - setClef, setClefWithTransposition
 * - setKeySignature, setKeySignatureWithTransposition
 * - setTimeSignature
 * - setTempo
 * - setTitle
 *
 * These operations are undoable and update the dirty flag.
 */

import { useCallback } from "react";
import type {
  Clef,
  ComposerState,
  KeySignature,
  TimeSignature,
} from "../types";
import { DEFAULT_OCTAVE_MIDI, createMeasure } from "../types";
import {
  getAccidentalForMidi,
  transposeNoteByFunction,
} from "../utils/pitchUtils";
import type { UseComposerUndoReturn } from "./useComposerUndo";

export interface UseScoreSettingsParams {
  state: ComposerState;
  setState: React.Dispatch<React.SetStateAction<ComposerState>>;
  undoManager: UseComposerUndoReturn;
}

export interface UseScoreSettingsReturn {
  /** Set the clef (resets default octave) */
  setClef: (clef: Clef) => void;
  /** Set clef with optional octave transposition */
  setClefWithTransposition: (clef: Clef, transposeOctaves: number) => void;
  /** Check if score has any pitched notes */
  hasActualNotes: () => boolean;
  /** Set the key signature */
  setKeySignature: (key: KeySignature) => void;
  /** Set key signature with optional transposition */
  setKeySignatureWithTransposition: (
    key: KeySignature,
    transposeSemitones: number,
  ) => void;
  /** Set time signature (fails if notes exist) */
  setTimeSignature: (timeSig: TimeSignature) => boolean;
  /** Set tempo */
  setTempo: (tempo: number) => void;
  /** Set title */
  setTitle: (title: string) => void;
}

/**
 * Hook for managing score-level settings.
 *
 * Extracted from useComposerState for better modularity.
 * All operations are undoable and mark the score as dirty.
 */
export function useScoreSettings({
  state,
  setState,
  undoManager,
}: UseScoreSettingsParams): UseScoreSettingsReturn {
  const setClef = useCallback(
    (clef: Clef) => {
      const prevClef = state.score.clef;
      if (clef === prevClef) return;

      undoManager.pushAction({
        type: "CHANGE_CLEF",
        previousClef: prevClef,
        newClef: clef,
      });

      setState((prev) => ({
        ...prev,
        score: { ...prev.score, clef, updatedAt: new Date().toISOString() },
        selectedOctave: DEFAULT_OCTAVE_MIDI[clef],
        isDirty: true,
      }));
    },
    [state.score.clef, undoManager, setState],
  );

  const hasActualNotes = useCallback((): boolean => {
    return state.score.measures.some((measure) =>
      measure.notes.some((note) => note.midi !== null),
    );
  }, [state.score.measures]);

  const setClefWithTransposition = useCallback(
    (clef: Clef, transposeOctaves: number) => {
      const prevClef = state.score.clef;
      if (clef === prevClef && transposeOctaves === 0) return;

      undoManager.pushAction({
        type: "CHANGE_CLEF",
        previousClef: prevClef,
        newClef: clef,
      });

      setState((prev) => {
        const semitoneShift = transposeOctaves * 12;
        const newMeasures = prev.score.measures.map((measure) => ({
          ...measure,
          notes: measure.notes.map((note) => {
            if (note.midi === null) return note;
            const newMidi = note.midi + semitoneShift;
            if (newMidi < 0 || newMidi > 127) return note;
            return { ...note, midi: newMidi };
          }),
        }));

        return {
          ...prev,
          score: {
            ...prev.score,
            clef,
            measures: newMeasures,
            updatedAt: new Date().toISOString(),
          },
          selectedOctave: DEFAULT_OCTAVE_MIDI[clef],
          isDirty: true,
        };
      });
    },
    [state.score.clef, undoManager, setState],
  );

  const setKeySignature = useCallback(
    (key: KeySignature) => {
      const prevKey = state.score.keySignature;
      if (key === prevKey) return;

      undoManager.pushAction({
        type: "CHANGE_KEY_SIGNATURE",
        previousKey: prevKey,
        newKey: key,
      });

      setState((prev) => ({
        ...prev,
        score: {
          ...prev.score,
          keySignature: key,
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      }));
    },
    [state.score.keySignature, undoManager, setState],
  );

  const setKeySignatureWithTransposition = useCallback(
    (key: KeySignature, transposeSemitones: number) => {
      const prevKey = state.score.keySignature;
      if (key === prevKey && transposeSemitones === 0) return;

      undoManager.pushAction({
        type: "CHANGE_KEY_SIGNATURE",
        previousKey: prevKey,
        newKey: key,
      });

      setState((prev) => {
        const newMeasures = prev.score.measures.map((measure) => ({
          ...measure,
          notes: measure.notes.map((note) => {
            if (note.midi === null) return note;

            if (transposeSemitones === 0) {
              // Keep pitch, just recalculate accidental for new key
              const newAccidental = getAccidentalForMidi(note.midi, key);
              return {
                ...note,
                accidental: newAccidental,
              };
            }

            // Use function-preserving transposition
            const transposed = transposeNoteByFunction(
              note.midi,
              note.accidental,
              prev.score.keySignature,
              key,
              transposeSemitones,
            );

            if (transposed.midi < 0 || transposed.midi > 127) return note;

            return {
              ...note,
              midi: transposed.midi,
              accidental: transposed.accidental,
            };
          }),
        }));

        return {
          ...prev,
          score: {
            ...prev.score,
            keySignature: key,
            measures: newMeasures,
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
        };
      });
    },
    [state.score.keySignature, undoManager, setState],
  );

  const setTimeSignature = useCallback(
    (timeSig: TimeSignature): boolean => {
      // Disallow changing time signature if there are actual notes
      if (hasActualNotes()) {
        return false;
      }

      const prevTimeSig = state.score.timeSignature;
      if (
        timeSig.beats === prevTimeSig.beats &&
        timeSig.beatUnit === prevTimeSig.beatUnit
      ) {
        return true;
      }

      undoManager.pushAction({
        type: "CHANGE_TIME_SIGNATURE",
        previousTimeSig: prevTimeSig,
        newTimeSig: timeSig,
      });

      setState((prev) => {
        const newMeasures = prev.score.measures.map(() =>
          createMeasure(timeSig),
        );
        return {
          ...prev,
          score: {
            ...prev.score,
            timeSignature: timeSig,
            measures: newMeasures,
            updatedAt: new Date().toISOString(),
          },
          cursor: { measureIndex: 0, noteIndex: 0 },
          selectedNoteId: newMeasures[0]?.notes[0]?.id ?? null,
          isDirty: true,
        };
      });

      return true;
    },
    [state.score.timeSignature, undoManager, hasActualNotes, setState],
  );

  const setTempo = useCallback(
    (tempo: number) => {
      const prevTempo = state.score.tempo;
      if (tempo === prevTempo) return;

      undoManager.pushAction({
        type: "CHANGE_TEMPO",
        previousTempo: prevTempo,
        newTempo: tempo,
      });

      setState((prev) => ({
        ...prev,
        score: {
          ...prev.score,
          tempo,
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      }));
    },
    [state.score.tempo, undoManager, setState],
  );

  const setTitle = useCallback(
    (title: string) => {
      const prevTitle = state.score.title;
      if (title === prevTitle) return;

      undoManager.pushAction({
        type: "CHANGE_TITLE",
        previousTitle: prevTitle,
        newTitle: title,
      });

      setState((prev) => ({
        ...prev,
        score: {
          ...prev.score,
          title,
          updatedAt: new Date().toISOString(),
        },
        isDirty: true,
      }));
    },
    [state.score.title, undoManager, setState],
  );

  return {
    setClef,
    setClefWithTransposition,
    hasActualNotes,
    setKeySignature,
    setKeySignatureWithTransposition,
    setTimeSignature,
    setTempo,
    setTitle,
  };
}
