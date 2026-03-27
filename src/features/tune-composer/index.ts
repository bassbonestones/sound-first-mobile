/**
 * Tune Composer Feature - Main Index
 *
 * Barrel export for the Tune Composer feature.
 */

// Screens
export { TuneComposerScreen } from "./screens";
export type { TuneComposerScreenProps } from "./screens";

// Hooks
export {
  useTuneComposerState,
  useTuneComposerPlayback,
  useTuneComposerUndo,
} from "./hooks";
export type {
  UseTuneComposerStateReturn,
  UseTuneComposerPlaybackResult,
  UseTuneComposerUndoReturn,
  PlaybackState,
  PlaybackPosition,
  PlaybackEvent,
} from "./hooks";

// Contexts
export {
  ChordProgressionProvider,
  useChordProgression,
  useChordProgressionOptional,
} from "./contexts";
export type {
  ChordProgressionContextValue,
  ChordProgressionProviderProps,
} from "./contexts";

// Services
export {
  tuneComposerStorageService,
  generateMusicXml,
  generateMusicXmlPreview,
  validateScoreForExport,
  composerSynth,
} from "./services";
export type {
  TuneScoreMeta,
  SavedTuneScore,
  TuneScoreListResult,
  MusicXmlGeneratorOptions,
} from "./services";

// Types
export * from "./types";
