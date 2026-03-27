/**
 * ChordProgressionContext
 *
 * Context for managing chord progressions state and operations.
 * Eliminates prop drilling from TuneComposerScreen → ChordControls → ProgressionSelector.
 */
import React, { createContext, useContext, ReactNode, useMemo } from "react";
import type { ChordProgression } from "../types";

// =============================================================================
// Types
// =============================================================================

export interface ChordProgressionContextValue {
  /** All available progressions */
  progressions: ChordProgression[];
  /** ID of the currently active progression */
  activeProgressionId: string | undefined;
  /** Select a progression by ID */
  selectProgression: (id: string) => void;
  /** Create a new progression with given name */
  createProgression: (name: string) => void;
  /** Duplicate specified progression */
  duplicateProgression: (sourceId: string, newName?: string) => void;
  /** Delete a progression by ID */
  deleteProgression: (id: string) => void;
  /** Rename a progression */
  renameProgression: (id: string, newName: string) => void;
  /** Whether progression edit mode is active */
  isEditMode: boolean;
  /** Toggle progression edit mode */
  toggleEditMode: () => void;
  /** Whether the controls are disabled */
  disabled: boolean;
}

export interface ChordProgressionProviderProps {
  children: ReactNode;
  /** All available progressions */
  progressions: ChordProgression[];
  /** ID of the currently active progression */
  activeProgressionId: string | undefined;
  /** Callback when a progression is selected */
  onSelectProgression: (id: string) => void;
  /** Callback to create a new progression */
  onCreateProgression: (name: string) => void;
  /** Callback to duplicate a progression */
  onDuplicateProgression: (sourceId: string, newName?: string) => void;
  /** Callback to delete a progression */
  onDeleteProgression: (id: string) => void;
  /** Callback to rename a progression */
  onRenameProgression: (id: string, newName: string) => void;
  /** Whether progression edit mode is active */
  isEditMode: boolean;
  /** Callback to toggle progression edit mode */
  onToggleEditMode: () => void;
  /** Whether the controls are disabled */
  disabled?: boolean;
}

// =============================================================================
// Context
// =============================================================================

const ChordProgressionContext =
  createContext<ChordProgressionContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

/**
 * Provider component for chord progression state.
 * Wrap this around components that need access to progression state.
 */
export function ChordProgressionProvider({
  children,
  progressions,
  activeProgressionId,
  onSelectProgression,
  onCreateProgression,
  onDuplicateProgression,
  onDeleteProgression,
  onRenameProgression,
  isEditMode,
  onToggleEditMode,
  disabled = false,
}: ChordProgressionProviderProps): JSX.Element {
  const value = useMemo<ChordProgressionContextValue>(
    () => ({
      progressions,
      activeProgressionId,
      selectProgression: onSelectProgression,
      createProgression: onCreateProgression,
      duplicateProgression: onDuplicateProgression,
      deleteProgression: onDeleteProgression,
      renameProgression: onRenameProgression,
      isEditMode,
      toggleEditMode: onToggleEditMode,
      disabled,
    }),
    [
      progressions,
      activeProgressionId,
      onSelectProgression,
      onCreateProgression,
      onDuplicateProgression,
      onDeleteProgression,
      onRenameProgression,
      isEditMode,
      onToggleEditMode,
      disabled,
    ],
  );

  return (
    <ChordProgressionContext.Provider value={value}>
      {children}
    </ChordProgressionContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access chord progression context.
 * Must be used within a ChordProgressionProvider.
 *
 * @throws Error if used outside of ChordProgressionProvider
 */
export function useChordProgression(): ChordProgressionContextValue {
  const context = useContext(ChordProgressionContext);
  if (!context) {
    throw new Error(
      "useChordProgression must be used within a ChordProgressionProvider",
    );
  }
  return context;
}

/**
 * Hook to optionally access chord progression context.
 * Returns null if used outside of ChordProgressionProvider.
 * Useful for components that can work with or without the context.
 */
export function useChordProgressionOptional(): ChordProgressionContextValue | null {
  return useContext(ChordProgressionContext);
}
