/**
 * PlaybackContext
 *
 * Context for playback state and controls, eliminating prop drilling from
 * ComposerScreen → ComposerScoreViewport.
 *
 * This provides:
 * - Playback state (stopped, playing, paused)
 * - Current playback measure index
 * - Play, pause, stop controls
 */
import React, { createContext, useContext, ReactNode, useMemo } from "react";

// =============================================================================
// Types
// =============================================================================

/** Playback state enum */
export type PlaybackState = "stopped" | "playing" | "paused";

/**
 * Context value for playback controls
 */
export interface PlaybackContextValue {
  /** Current playback state */
  playbackState: PlaybackState;
  /** Current measure index being played */
  playbackMeasureIndex: number | undefined;
  /** Start or resume playback */
  onPlay: () => void;
  /** Pause playback */
  onPause: () => void;
  /** Stop playback and reset position */
  onStop: () => void;
}

export interface PlaybackProviderProps {
  children: ReactNode;
  /** Current playback state */
  playbackState: PlaybackState;
  /** Current measure index being played */
  playbackMeasureIndex?: number;
  /** Start or resume playback */
  onPlay: () => void;
  /** Pause playback */
  onPause: () => void;
  /** Stop playback and reset position */
  onStop: () => void;
}

// =============================================================================
// Context
// =============================================================================

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

/**
 * Provider for playback state and controls
 *
 * @example
 * ```tsx
 * <PlaybackProvider
 *   playbackState={playback.state}
 *   playbackMeasureIndex={playback.position.measureIndex}
 *   onPlay={handlePlay}
 *   onPause={handlePause}
 *   onStop={handleStop}
 * >
 *   <ComposerScoreViewport ... />
 * </PlaybackProvider>
 * ```
 */
export function PlaybackProvider({
  children,
  playbackState,
  playbackMeasureIndex,
  onPlay,
  onPause,
  onStop,
}: PlaybackProviderProps): React.ReactElement {
  const value = useMemo<PlaybackContextValue>(
    () => ({
      playbackState,
      playbackMeasureIndex,
      onPlay,
      onPause,
      onStop,
    }),
    [playbackState, playbackMeasureIndex, onPlay, onPause, onStop],
  );

  return (
    <PlaybackContext.Provider value={value}>
      {children}
    </PlaybackContext.Provider>
  );
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to access playback context (required)
 *
 * @throws Error if used outside PlaybackProvider
 */
export function usePlaybackContext(): PlaybackContextValue {
  const context = useContext(PlaybackContext);
  if (context === null) {
    throw new Error(
      "usePlaybackContext must be used within a PlaybackProvider",
    );
  }
  return context;
}

/**
 * Hook to optionally access playback context
 *
 * Returns null if not within a provider - useful for components
 * that can work with or without playback controls.
 */
export function useOptionalPlaybackContext(): PlaybackContextValue | null {
  return useContext(PlaybackContext);
}
