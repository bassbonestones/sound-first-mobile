/**
 * useTuneComposerLyrics Hook
 *
 * Manages lyrics editing functionality for the Tune Composer.
 * Handles lyrics mode toggle, lyrics cursor navigation, and lyric CRUD operations.
 *
 * This hook is composed by useTuneComposerState and should not be used directly.
 */

import { useCallback } from "react";
import type {
  CursorPosition,
  Lyric,
  TuneComposerScore,
  TuneComposerState,
} from "../types";
import { getPitchedNotes } from "../types";
import {
  createSetLyricAction,
  createRemoveLyricAction,
} from "../types/actionTypes";
import type { UseTuneComposerUndoReturn } from "./useTuneComposerUndo";

// =============================================================================
// Types
// =============================================================================

export interface UseTuneComposerLyricsReturn {
  // Mode
  lyricsMode: boolean;
  toggleLyricsMode: () => void;

  // Cursor
  lyricsCursor: number | null;
  moveLyricsCursorNext: () => void;
  moveLyricsCursorPrev: () => void;

  // Lyric operations
  setLyric: (
    text: string,
    syllabic?: "single" | "begin" | "middle" | "end",
  ) => void;
  removeLyric: () => void;

  // Melisma
  extendMelisma: () => void;
  shrinkMelisma: () => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useTuneComposerLyrics(
  state: TuneComposerState,
  setState: React.Dispatch<React.SetStateAction<TuneComposerState>>,
  updateScore: (
    updater: (score: TuneComposerScore) => TuneComposerScore,
  ) => void,
  undoManager: UseTuneComposerUndoReturn,
): UseTuneComposerLyricsReturn {
  // ===========================================================================
  // Mode Toggle
  // ===========================================================================

  const toggleLyricsMode = useCallback(() => {
    setState((prev) => {
      const newLyricsMode = !prev.lyricsMode;
      if (newLyricsMode) {
        // Entering lyrics mode - try to start at the currently selected note
        const pitchedNotes = getPitchedNotes(prev.score);
        if (pitchedNotes.length === 0) {
          return { ...prev, lyricsMode: true, lyricsCursor: null };
        }

        // Find the index of the selected note in pitched notes
        let startIndex = 0;
        if (prev.selectedNoteId) {
          const selectedIndex = pitchedNotes.findIndex(
            (pn) => pn.note.id === prev.selectedNoteId,
          );
          if (selectedIndex >= 0) {
            startIndex = selectedIndex;
          }
        }

        return {
          ...prev,
          lyricsMode: true,
          lyricsCursor: startIndex,
        };
      } else {
        // Exiting lyrics mode
        return {
          ...prev,
          lyricsMode: false,
          lyricsCursor: null,
        };
      }
    });
  }, [setState]);

  // ===========================================================================
  // Cursor Navigation
  // ===========================================================================

  const moveLyricsCursorNext = useCallback(() => {
    setState((prev) => {
      if (!prev.lyricsMode || prev.lyricsCursor === null) return prev;
      const pitchedNotes = getPitchedNotes(prev.score);
      const nextIndex = prev.lyricsCursor + 1;
      if (nextIndex >= pitchedNotes.length) return prev; // At end
      return { ...prev, lyricsCursor: nextIndex };
    });
  }, [setState]);

  const moveLyricsCursorPrev = useCallback(() => {
    setState((prev) => {
      if (!prev.lyricsMode || prev.lyricsCursor === null) return prev;
      const prevIndex = prev.lyricsCursor - 1;
      if (prevIndex < 0) return prev; // At start
      return { ...prev, lyricsCursor: prevIndex };
    });
  }, [setState]);

  // ===========================================================================
  // Lyric Operations
  // ===========================================================================

  const setLyric = useCallback(
    (text: string, syllabic?: "single" | "begin" | "middle" | "end") => {
      if (!state.lyricsMode || state.lyricsCursor === null) return;

      const pitchedNotes = getPitchedNotes(state.score);
      const noteInfo = pitchedNotes[state.lyricsCursor];
      if (!noteInfo) return;

      const position: CursorPosition = {
        measureIndex: noteInfo.measureIndex,
        noteIndex: noteInfo.noteIndex,
      };

      const note =
        state.score.measures[noteInfo.measureIndex]?.notes[noteInfo.noteIndex];
      if (!note) return;

      // Preserve melismaLength from existing lyric when only changing text/syllabic
      const newLyric: Lyric = {
        text,
        syllabic: syllabic || "single",
        ...(note.lyric?.melismaLength && {
          melismaLength: note.lyric.melismaLength,
        }),
      };

      const action = createSetLyricAction(
        position,
        note.id,
        newLyric,
        note.lyric,
      );
      undoManager.pushAction(action);

      updateScore((score) => ({
        ...score,
        measures: score.measures.map((m, mi) =>
          mi === noteInfo.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n, ni) =>
                  ni === noteInfo.noteIndex ? { ...n, lyric: newLyric } : n,
                ),
              }
            : m,
        ),
      }));
    },
    [
      state.lyricsMode,
      state.lyricsCursor,
      state.score,
      undoManager,
      updateScore,
    ],
  );

  const removeLyric = useCallback(() => {
    if (!state.lyricsMode || state.lyricsCursor === null) return;

    const pitchedNotes = getPitchedNotes(state.score);
    const noteInfo = pitchedNotes[state.lyricsCursor];
    if (!noteInfo) return;

    const note =
      state.score.measures[noteInfo.measureIndex]?.notes[noteInfo.noteIndex];
    if (!note || !note.lyric) return;

    const position: CursorPosition = {
      measureIndex: noteInfo.measureIndex,
      noteIndex: noteInfo.noteIndex,
    };

    const action = createRemoveLyricAction(position, note.id, note.lyric);
    undoManager.pushAction(action);

    updateScore((score) => ({
      ...score,
      measures: score.measures.map((m, mi) =>
        mi === noteInfo.measureIndex
          ? {
              ...m,
              notes: m.notes.map((n, ni) =>
                ni === noteInfo.noteIndex ? { ...n, lyric: undefined } : n,
              ),
            }
          : m,
      ),
    }));
  }, [
    state.lyricsMode,
    state.lyricsCursor,
    state.score,
    undoManager,
    updateScore,
  ]);

  // ===========================================================================
  // Melisma
  // ===========================================================================

  const extendMelisma = useCallback(() => {
    if (!state.lyricsMode || state.lyricsCursor === null) return;

    const pitchedNotes = getPitchedNotes(state.score);

    // Can't extend if we're at the last note
    if (state.lyricsCursor >= pitchedNotes.length - 1) return;

    // Find the note with the lyric that we're extending
    // This could be the current note, or a previous note if we're in a melisma
    let lyricNoteIndex = state.lyricsCursor;
    let lyricNoteInfo = pitchedNotes[lyricNoteIndex];
    let lyricNote = lyricNoteInfo
      ? state.score.measures[lyricNoteInfo.measureIndex]?.notes[
          lyricNoteInfo.noteIndex
        ]
      : null;

    // If current note doesn't have a lyric, search backwards for the note with the lyric
    while (lyricNoteIndex > 0 && (!lyricNote || !lyricNote.lyric)) {
      lyricNoteIndex--;
      lyricNoteInfo = pitchedNotes[lyricNoteIndex];
      lyricNote = lyricNoteInfo
        ? state.score.measures[lyricNoteInfo.measureIndex]?.notes[
            lyricNoteInfo.noteIndex
          ]
        : null;
    }

    // If we still don't have a lyric, can't extend
    if (!lyricNote || !lyricNote.lyric || !lyricNoteInfo) return;

    // Extend melisma by incrementing melismaLength
    const newMelismaLength = (lyricNote.lyric.melismaLength || 1) + 1;
    const newLyric: Lyric = {
      ...lyricNote.lyric,
      melismaLength: newMelismaLength,
    };

    const position: CursorPosition = {
      measureIndex: lyricNoteInfo.measureIndex,
      noteIndex: lyricNoteInfo.noteIndex,
    };

    const action = createSetLyricAction(
      position,
      lyricNote.id,
      newLyric,
      lyricNote.lyric,
    );
    undoManager.pushAction(action);

    // Move cursor to next note
    const nextIndex = state.lyricsCursor + 1;

    setState((prev) => ({
      ...prev,
      lyricsCursor: nextIndex,
      score: {
        ...prev.score,
        measures: prev.score.measures.map((m, mi) =>
          mi === lyricNoteInfo.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n, ni) =>
                  ni === lyricNoteInfo.noteIndex
                    ? { ...n, lyric: newLyric }
                    : n,
                ),
              }
            : m,
        ),
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    }));
  }, [
    state.lyricsMode,
    state.lyricsCursor,
    state.score,
    undoManager,
    setState,
  ]);

  const shrinkMelisma = useCallback(() => {
    if (!state.lyricsMode || state.lyricsCursor === null) return;
    if (state.lyricsCursor === 0) return; // Can't shrink at start

    const pitchedNotes = getPitchedNotes(state.score);
    const prevNoteInfo = pitchedNotes[state.lyricsCursor - 1];
    if (!prevNoteInfo) return;

    const prevNote =
      state.score.measures[prevNoteInfo.measureIndex]?.notes[
        prevNoteInfo.noteIndex
      ];
    if (!prevNote || !prevNote.lyric) return;

    const currentMelisma = prevNote.lyric.melismaLength || 1;
    if (currentMelisma <= 1) return; // Can't shrink below 1

    const newLyric: Lyric = {
      ...prevNote.lyric,
      melismaLength: currentMelisma - 1,
    };

    const position: CursorPosition = {
      measureIndex: prevNoteInfo.measureIndex,
      noteIndex: prevNoteInfo.noteIndex,
    };

    const action = createSetLyricAction(
      position,
      prevNote.id,
      newLyric,
      prevNote.lyric,
    );
    undoManager.pushAction(action);

    // Move cursor to previous note
    const newLyricsCursor = state.lyricsCursor - 1;

    setState((prev) => ({
      ...prev,
      lyricsCursor: newLyricsCursor,
      score: {
        ...prev.score,
        measures: prev.score.measures.map((m, mi) =>
          mi === prevNoteInfo.measureIndex
            ? {
                ...m,
                notes: m.notes.map((n, ni) =>
                  ni === prevNoteInfo.noteIndex ? { ...n, lyric: newLyric } : n,
                ),
              }
            : m,
        ),
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    }));
  }, [
    state.lyricsMode,
    state.lyricsCursor,
    state.score,
    undoManager,
    setState,
  ]);

  // ===========================================================================
  // Return
  // ===========================================================================

  return {
    // Mode
    lyricsMode: state.lyricsMode,
    toggleLyricsMode,

    // Cursor
    lyricsCursor: state.lyricsCursor,
    moveLyricsCursorNext,
    moveLyricsCursorPrev,

    // Lyric operations
    setLyric,
    removeLyric,

    // Melisma
    extendMelisma,
    shrinkMelisma,
  };
}
