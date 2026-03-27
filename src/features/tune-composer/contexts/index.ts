/**
 * Tune Composer Contexts
 *
 * React contexts for sharing state across tune composer components.
 */
export {
  ChordProgressionProvider,
  useChordProgression,
  useChordProgressionOptional,
  type ChordProgressionContextValue,
  type ChordProgressionProviderProps,
} from "./ChordProgressionContext";

export {
  ChordModeProvider,
  useChordMode,
  useChordModeOptional,
  type ChordModeContextValue,
  type ChordModeProviderProps,
  type ChordCursorPosition,
} from "./ChordModeContext";

// Re-export from composer feature for shared playback context
export {
  PlaybackProvider,
  usePlaybackContext,
  useOptionalPlaybackContext,
  type PlaybackContextValue,
  type PlaybackProviderProps,
  type PlaybackState,
} from "../../composer/contexts";
