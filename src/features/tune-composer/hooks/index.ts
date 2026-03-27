/**
 * Tune Composer Hooks - Barrel Export
 */

export { useTuneComposerState } from "./useTuneComposerState";
export type {
  UseTuneComposerStateReturn,
  PendingRhythmChange,
  PendingRhythmChangeType,
} from "./useTuneComposerState";

export {
  useTuneComposerUndo,
  reverseAction,
  reapplyAction,
} from "./useTuneComposerUndo";
export type { UseTuneComposerUndoReturn } from "./useTuneComposerUndo";

// Sub-hooks (composed by useTuneComposerState, not for direct use)
export { useTuneComposerChords } from "./useTuneComposerChords";
export type { UseTuneComposerChordsReturn } from "./useTuneComposerChords";

export { useTuneComposerLyrics } from "./useTuneComposerLyrics";
export type { UseTuneComposerLyricsReturn } from "./useTuneComposerLyrics";

export { useTuneComposerMarkings } from "./useTuneComposerMarkings";
export type { UseTuneComposerMarkingsReturn } from "./useTuneComposerMarkings";

export { useTuneComposerNotes } from "./useTuneComposerNotes";
export type { UseTuneComposerNotesReturn } from "./useTuneComposerNotes";

export { useTuneComposerPlayback } from "./useTuneComposerPlayback";
export type {
  PlaybackState,
  PlaybackPosition,
  PlaybackEvent,
  TuneComposerPlaybackState,
  TuneComposerPlaybackActions,
  UseTuneComposerPlaybackResult,
} from "./useTuneComposerPlayback";

export { usePracticeOverChanges } from "./usePracticeOverChanges";
export type { UsePracticeOverChangesReturn } from "./usePracticeOverChanges";

// Screen-level state hook (uses reducer)
export { useTuneComposerScreen } from "./useTuneComposerScreen";
export type { UseTuneComposerScreenReturn } from "./useTuneComposerScreen";
