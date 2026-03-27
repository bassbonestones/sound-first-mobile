/**
 * ComposerStateContext
 *
 * Context for composer editing state, eliminating prop drilling from
 * ComposerScreen → EntryPalette, CompactTopBar, etc.
 *
 * This provides:
 * - Duration state and setters
 * - Triplet state
 * - Selected note info
 * - Editing actions (accidentals, ties, octave changes)
 * - Score settings (time signature for computing tripletsAllowed)
 */
import React, { createContext, useContext, ReactNode, useMemo } from "react";

import type { DurationValue, Note, Accidental, TimeSignature } from "../types";

// =============================================================================
// Types
// =============================================================================

/**
 * Context value for composer editing operations
 */
export interface ComposerStateContextValue {
  // Duration state
  /** Currently selected duration for new notes */
  selectedDuration: DurationValue;
  /** Set the duration for new notes */
  setDuration: (duration: DurationValue) => void;
  /** Whether dotted mode is active */
  dottedMode: boolean;
  /** Toggle dotted mode on/off */
  toggleDottedMode: () => void;

  // Triplet state
  /** Current triplet position (1, 2, or 3) if on a triplet note */
  tripletPosition: 1 | 2 | 3 | undefined;
  /** Current triplet group type */
  tripletGroupType: "eighth" | "quarter" | "mixed" | undefined;
  /** Whether triplets are allowed (beat unit is quarter note) */
  tripletsAllowed: boolean;
  /** Whether triplets can be started at current position */
  canStartTriplet: boolean;

  // Selected note
  /** Currently selected note (if any) */
  selectedNote: Note | null;

  // Editing actions
  /** Change octave of selected note */
  changeOctave: (direction: "up" | "down") => void;
  /** Apply accidental to selected note */
  applyAccidental: (accidental: Accidental | undefined) => void;
  /** Toggle tie on selected note */
  toggleTie: () => void;

  // Score context (for derived values)
  /** Current time signature (for computing tripletsAllowed) */
  timeSignature: TimeSignature;
}

export interface ComposerStateProviderProps {
  children: ReactNode;

  // Duration state
  selectedDuration: DurationValue;
  setDuration: (duration: DurationValue) => void;
  dottedMode: boolean;
  toggleDottedMode: () => void;

  // Triplet state
  tripletPosition: 1 | 2 | 3 | undefined;
  tripletGroupType: "eighth" | "quarter" | "mixed" | undefined;
  canStartTriplet: boolean;

  // Selected note
  selectedNote: Note | null;

  // Editing actions
  changeOctave: (direction: "up" | "down") => void;
  applyAccidental: (accidental: Accidental | undefined) => void;
  toggleTie: () => void;

  // Score context
  timeSignature: TimeSignature;
}

// =============================================================================
// Context
// =============================================================================

const ComposerStateContext = createContext<ComposerStateContextValue | null>(
  null,
);

// =============================================================================
// Provider
// =============================================================================

/**
 * Provider component for composer editing state.
 * Wrap this around composer components that need editing state access.
 */
export function ComposerStateProvider({
  children,
  selectedDuration,
  setDuration,
  dottedMode,
  toggleDottedMode,
  tripletPosition,
  tripletGroupType,
  canStartTriplet,
  selectedNote,
  changeOctave,
  applyAccidental,
  toggleTie,
  timeSignature,
}: ComposerStateProviderProps): React.ReactElement {
  // Compute tripletsAllowed from time signature
  const tripletsAllowed = timeSignature.beatUnit === 4;

  const value = useMemo<ComposerStateContextValue>(
    () => ({
      selectedDuration,
      setDuration,
      dottedMode,
      toggleDottedMode,
      tripletPosition,
      tripletGroupType,
      tripletsAllowed,
      canStartTriplet,
      selectedNote,
      changeOctave,
      applyAccidental,
      toggleTie,
      timeSignature,
    }),
    [
      selectedDuration,
      setDuration,
      dottedMode,
      toggleDottedMode,
      tripletPosition,
      tripletGroupType,
      tripletsAllowed,
      canStartTriplet,
      selectedNote,
      changeOctave,
      applyAccidental,
      toggleTie,
      timeSignature,
    ],
  );

  return (
    <ComposerStateContext.Provider value={value}>
      {children}
    </ComposerStateContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access composer editing state from context.
 * Must be used within a ComposerStateProvider.
 *
 * @throws Error if used outside of provider
 */
export function useComposerStateContext(): ComposerStateContextValue {
  const context = useContext(ComposerStateContext);

  if (context === null) {
    throw new Error(
      "useComposerStateContext must be used within a ComposerStateProvider",
    );
  }

  return context;
}

/**
 * Hook to optionally access composer editing state.
 * Returns null if used outside of provider.
 */
export function useOptionalComposerStateContext(): ComposerStateContextValue | null {
  return useContext(ComposerStateContext);
}
