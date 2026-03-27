/**
 * ScoreSettingsContext
 *
 * Context for score metadata settings, eliminating prop drilling from
 * ComposerScreen → CompactTopBar, ComposerTopBar.
 *
 * This provides:
 * - Title state and setter
 * - Clef state and setter
 * - Time signature state, setter, and lock status
 * - Key signature state and setter
 * - Tempo state and setter
 */
import React, { createContext, useContext, ReactNode, useMemo } from "react";

import type { Clef, TimeSignature, KeySignature } from "../types";

// =============================================================================
// Types
// =============================================================================

/**
 * Context value for score settings
 */
export interface ScoreSettingsContextValue {
  // Title
  /** Score title */
  title: string;
  /** Set score title */
  setTitle: (title: string) => void;

  // Clef
  /** Current clef */
  clef: Clef;
  /** Set clef */
  setClef: (clef: Clef) => void;

  // Time signature
  /** Current time signature */
  timeSignature: TimeSignature;
  /** Set time signature (returns false if locked) */
  setTimeSignature: (ts: TimeSignature) => boolean;
  /** Whether time signature is locked (notes exist) */
  timeSignatureLocked: boolean;

  // Key signature
  /** Current key signature (-7 to +7) */
  keySignature: KeySignature;
  /** Set key signature */
  setKeySignature: (key: KeySignature) => void;

  // Tempo
  /** Current tempo in BPM */
  tempo: number;
  /** Set tempo */
  setTempo: (tempo: number) => void;

  // Score actions
  /** Clear all notes from score */
  clearScore?: () => void;
}

export interface ScoreSettingsProviderProps {
  children: ReactNode;

  // Title
  title: string;
  setTitle: (title: string) => void;

  // Clef
  clef: Clef;
  setClef: (clef: Clef) => void;

  // Time signature
  timeSignature: TimeSignature;
  setTimeSignature: (ts: TimeSignature) => boolean;
  timeSignatureLocked: boolean;

  // Key signature
  keySignature: KeySignature;
  setKeySignature: (key: KeySignature) => void;

  // Tempo
  tempo: number;
  setTempo: (tempo: number) => void;

  // Score actions
  clearScore?: () => void;
}

// =============================================================================
// Context
// =============================================================================

const ScoreSettingsContext = createContext<ScoreSettingsContextValue | null>(
  null,
);

// =============================================================================
// Provider
// =============================================================================

/**
 * Provider component for score settings state.
 * Wrap this around components that need access to score metadata.
 */
export function ScoreSettingsProvider({
  children,
  title,
  setTitle,
  clef,
  setClef,
  timeSignature,
  setTimeSignature,
  timeSignatureLocked,
  keySignature,
  setKeySignature,
  tempo,
  setTempo,
  clearScore,
}: ScoreSettingsProviderProps): React.ReactElement {
  const value = useMemo<ScoreSettingsContextValue>(
    () => ({
      title,
      setTitle,
      clef,
      setClef,
      timeSignature,
      setTimeSignature,
      timeSignatureLocked,
      keySignature,
      setKeySignature,
      tempo,
      setTempo,
      clearScore,
    }),
    [
      title,
      setTitle,
      clef,
      setClef,
      timeSignature,
      setTimeSignature,
      timeSignatureLocked,
      keySignature,
      setKeySignature,
      tempo,
      setTempo,
      clearScore,
    ],
  );

  return (
    <ScoreSettingsContext.Provider value={value}>
      {children}
    </ScoreSettingsContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access score settings from context.
 * Must be used within a ScoreSettingsProvider.
 *
 * @throws Error if used outside of provider
 */
export function useScoreSettingsContext(): ScoreSettingsContextValue {
  const context = useContext(ScoreSettingsContext);

  if (context === null) {
    throw new Error(
      "useScoreSettingsContext must be used within a ScoreSettingsProvider",
    );
  }

  return context;
}

/**
 * Hook to optionally access score settings.
 * Returns null if used outside of provider.
 */
export function useOptionalScoreSettingsContext(): ScoreSettingsContextValue | null {
  return useContext(ScoreSettingsContext);
}
