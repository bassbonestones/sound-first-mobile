/**
 * ChordModeContext
 *
 * Context for managing chord entry mode state and operations.
 * Eliminates prop drilling from TuneComposerScreen → ChordControls.
 *
 * This handles:
 * - Chord mode active/toggle
 * - Current chord symbol and editing operations
 * - Cursor navigation between beat positions
 * - Chord visibility toggle
 * - Chord inference and clear operations
 */
import React, { createContext, useContext, ReactNode, useMemo } from "react";

// =============================================================================
// Types
// =============================================================================

/** Position within the score for chord entry */
export interface ChordCursorPosition {
  measureIndex: number;
  beatPosition: number;
}

export interface ChordModeContextValue {
  /** Whether chord entry mode is currently active */
  chordModeActive: boolean;
  /** Toggle chord entry mode on/off */
  toggleChordMode: () => void;

  /** Current chord symbol at selected position */
  currentChordSymbol: string;
  /** Set chord at current position */
  setChord: (symbol: string) => void;
  /** Remove chord at current position */
  removeChord: () => void;

  /** Move to next beat position */
  moveNext: () => void;
  /** Move to previous beat position */
  movePrev: () => void;
  /** Whether we can move to previous position */
  canGoPrev: boolean;
  /** Whether we can move to next position */
  canGoNext: boolean;
  /** Current position info for display */
  currentPosition: ChordCursorPosition;
  /** Whether there's a valid position selected */
  hasSelection: boolean;

  /** Whether chord symbols are visible in the score */
  showChordSymbols: boolean;
  /** Toggle chord symbol visibility */
  toggleVisibility: () => void;

  /** Infer chords from melody */
  inferChords: () => void;
  /** Whether chord inference is in progress */
  isInferring: boolean;
  /** Clear all chords from current progression */
  clearChords: () => void;

  /** Whether the controls are disabled */
  disabled: boolean;
}

export interface ChordModeProviderProps {
  children: ReactNode;

  /** Whether chord entry mode is currently active */
  chordModeActive: boolean;
  /** Callback to toggle chord entry mode */
  onToggleChordMode: () => void;

  /** Current chord symbol at selected position */
  currentChordSymbol: string;
  /** Callback to set chord at current position */
  onSetChord: (symbol: string) => void;
  /** Callback to remove chord at current position */
  onRemoveChord: () => void;

  /** Callback to move to next beat position */
  onNextBeat: () => void;
  /** Callback to move to previous beat position */
  onPrevBeat: () => void;
  /** Whether we can move to previous position */
  canGoPrev: boolean;
  /** Whether we can move to next position */
  canGoNext: boolean;
  /** Current position info for display */
  currentPosition: ChordCursorPosition;
  /** Whether there's a valid position selected */
  hasSelection: boolean;

  /** Whether chord symbols are visible in the score */
  showChordSymbols: boolean;
  /** Callback to toggle chord symbol visibility */
  onToggleVisibility: () => void;

  /** Callback to infer chords from melody */
  onInferChords: () => void;
  /** Whether chord inference is in progress */
  isInferring: boolean;
  /** Callback to clear all chords */
  onClearChords: () => void;

  /** Whether the controls are disabled */
  disabled?: boolean;
}

// =============================================================================
// Context
// =============================================================================

const ChordModeContext = createContext<ChordModeContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

/**
 * Provider component for chord mode state.
 * Wrap this around ChordControls to provide chord editing context.
 */
export function ChordModeProvider({
  children,
  chordModeActive,
  onToggleChordMode,
  currentChordSymbol,
  onSetChord,
  onRemoveChord,
  onNextBeat,
  onPrevBeat,
  canGoPrev,
  canGoNext,
  subdivision,
  onCycleSubdivision,
  currentPosition,
  hasSelection,
  showChordSymbols,
  onToggleVisibility,
  onInferChords,
  isInferring,
  onClearChords,
  disabled = false,
}: ChordModeProviderProps): React.ReactElement {
  const value = useMemo<ChordModeContextValue>(
    () => ({
      chordModeActive,
      toggleChordMode: onToggleChordMode,
      currentChordSymbol,
      setChord: onSetChord,
      removeChord: onRemoveChord,
      moveNext: onNextBeat,
      movePrev: onPrevBeat,
      canGoPrev,
      canGoNext,
      subdivision,
      cycleSubdivision: onCycleSubdivision,
      currentPosition,
      hasSelection,
      showChordSymbols,
      toggleVisibility: onToggleVisibility,
      inferChords: onInferChords,
      isInferring,
      clearChords: onClearChords,
      disabled,
    }),
    [
      chordModeActive,
      onToggleChordMode,
      currentChordSymbol,
      onSetChord,
      onRemoveChord,
      onNextBeat,
      onPrevBeat,
      canGoPrev,
      canGoNext,
      subdivision,
      onCycleSubdivision,
      currentPosition,
      hasSelection,
      showChordSymbols,
      onToggleVisibility,
      onInferChords,
      isInferring,
      onClearChords,
      disabled,
    ],
  );

  return (
    <ChordModeContext.Provider value={value}>
      {children}
    </ChordModeContext.Provider>
  );
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to access chord mode context.
 * Must be used within a ChordModeProvider.
 * @throws Error if used outside provider
 */
export function useChordMode(): ChordModeContextValue {
  const context = useContext(ChordModeContext);
  if (!context) {
    throw new Error("useChordMode must be used within a ChordModeProvider");
  }
  return context;
}

/**
 * Hook to optionally access chord mode context.
 * Returns null if used outside provider.
 */
export function useChordModeOptional(): ChordModeContextValue | null {
  return useContext(ChordModeContext);
}
