/**
 * EntryPalette Component
 *
 * Main note entry interface combining duration selection, pitch input,
 * and modifiers. This is the primary interaction area
 * for step-entry music composition.
 *
 * Supports two usage modes:
 * 1. Props-based: All values passed as props (legacy)
 * 2. Context-based: Values from ComposerStateContext (reduced props)
 */

import React, { memo } from "react";
import { View, StyleSheet } from "react-native";

import { colors, spacing } from "../../../constants";
import { DurationSelector } from "./DurationSelector";
import { PitchSelector } from "./PitchSelector";
import { ModifierRow } from "./ModifierRow";
import { useOptionalComposerStateContext } from "../contexts";
import type { ArticulationType } from "./ModifierRow";
import type { DurationValue, PitchName, Accidental, Note } from "../types";

// =============================================================================
// Types
// =============================================================================

export interface EntryPaletteProps {
  /**
   * Currently selected duration for new notes.
   * If not provided, uses value from ComposerStateContext.
   */
  selectedDuration?: DurationValue;
  /**
   * Currently selected note (if any).
   * If not provided, uses value from ComposerStateContext.
   */
  selectedNote?: Note | null;
  /**
   * Called when duration is selected.
   * If not provided, uses setDuration from ComposerStateContext.
   */
  onDurationSelect?: (duration: DurationValue) => void;
  /**
   * Whether dotted mode is active.
   * If not provided, uses value from ComposerStateContext.
   */
  dottedMode?: boolean;
  /**
   * Called when dotted mode is toggled.
   * If not provided, uses toggleDottedMode from ComposerStateContext.
   */
  onToggleDotted?: () => void;
  /**
   * Current triplet position (1, 2, or 3) if on a triplet note.
   * If not provided, uses value from ComposerStateContext.
   */
  tripletPosition?: 1 | 2 | 3;
  /**
   * Current triplet group type.
   * If not provided, uses value from ComposerStateContext.
   */
  tripletGroupType?: "eighth" | "quarter" | "mixed";
  /**
   * Whether triplets are allowed (only true when beat unit is quarter note).
   * If not provided, uses value from ComposerStateContext.
   */
  tripletsAllowed?: boolean;
  /**
   * Whether triplets can be started at current position.
   * If not provided, uses value from ComposerStateContext.
   */
  canStartTriplet?: boolean;
  /** Called when a pitch is tapped to insert a note (required) */
  onPitchTap: (pitch: PitchName) => void;
  /**
   * Called when octave changes.
   * If not provided, uses changeOctave from ComposerStateContext.
   */
  onOctaveChange?: (direction: "up" | "down") => void;
  /**
   * Called when an accidental is applied.
   * If not provided, uses applyAccidental from ComposerStateContext.
   */
  onAccidental?: (accidental: Accidental) => void;
  /** Called when rest is inserted (required) */
  onInsertRest: () => void;
  /**
   * Called when tie is toggled.
   * If not provided, uses toggleTie from ComposerStateContext.
   */
  onToggleTie?: () => void;
  /** Called when an articulation is applied */
  onArticulation?: (articulation: ArticulationType) => void;
  /** Called when articulation is removed */
  onRemoveArticulation?: () => void;
  /** Currently active articulation on selected note */
  activeArticulation?: ArticulationType | null;
  /** Whether the palette is disabled (e.g., during playback) */
  disabled?: boolean;
  /** Extra vertical padding per row for responsive layouts */
  extraRowPadding?: number;
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// Component
// =============================================================================

function EntryPaletteComponent({
  selectedDuration: propSelectedDuration,
  selectedNote: propSelectedNote,
  onDurationSelect: propOnDurationSelect,
  dottedMode: propDottedMode,
  onToggleDotted: propOnToggleDotted,
  tripletPosition: propTripletPosition,
  tripletGroupType: propTripletGroupType,
  tripletsAllowed: propTripletsAllowed,
  canStartTriplet: propCanStartTriplet,
  onPitchTap,
  onOctaveChange: propOnOctaveChange,
  onAccidental: propOnAccidental,
  onInsertRest,
  onToggleTie: propOnToggleTie,
  onArticulation,
  onRemoveArticulation,
  activeArticulation,
  disabled = false,
  extraRowPadding = 0,
  testID,
}: EntryPaletteProps): React.ReactElement {
  // Try to get values from context (returns null if no provider)
  const context = useOptionalComposerStateContext();

  // Resolve values: props take precedence over context
  const selectedDuration =
    propSelectedDuration ?? context?.selectedDuration ?? 4;
  const selectedNote = propSelectedNote ?? context?.selectedNote ?? null;
  const onDurationSelect = propOnDurationSelect ?? context?.setDuration;
  const dottedMode = propDottedMode ?? context?.dottedMode ?? false;
  const onToggleDotted = propOnToggleDotted ?? context?.toggleDottedMode;
  const tripletPosition = propTripletPosition ?? context?.tripletPosition;
  const tripletGroupType = propTripletGroupType ?? context?.tripletGroupType;
  const tripletsAllowed =
    propTripletsAllowed ?? context?.tripletsAllowed ?? true;
  const canStartTriplet =
    propCanStartTriplet ?? context?.canStartTriplet ?? true;
  const onOctaveChange = propOnOctaveChange ?? context?.changeOctave;
  const onAccidental = propOnAccidental ?? context?.applyAccidental;
  const onToggleTie = propOnToggleTie ?? context?.toggleTie;

  const hasSelection = selectedNote !== null;
  const activeAccidental = selectedNote?.accidental;
  const tieActive = selectedNote?.tieStart ?? false;

  // Per-row vertical padding (split top/bottom)
  const rowPaddingStyle =
    extraRowPadding > 0 ? { paddingVertical: extraRowPadding / 2 } : undefined;

  return (
    <View style={styles.container} testID={testID}>
      {/* Duration row */}
      <View style={rowPaddingStyle}>
        <DurationSelector
          selectedDuration={selectedDuration}
          onSelectDuration={onDurationSelect}
          dottedMode={dottedMode}
          onToggleDotted={onToggleDotted}
          tripletPosition={tripletPosition}
          tripletGroupType={tripletGroupType}
          tripletsAllowed={tripletsAllowed}
          canStartTriplet={canStartTriplet}
          disabled={disabled}
          testID="duration-selector"
        />
      </View>

      {/* Pitch row (includes rest at beginning) */}
      <View style={rowPaddingStyle}>
        <PitchSelector
          onSelectPitch={onPitchTap}
          onInsertRest={onInsertRest}
          selectedDuration={selectedDuration}
          disabled={disabled}
          testID="pitch-selector"
        />
      </View>

      {/* Modifier row (includes accidentals, tie, and articulations) */}
      <View style={rowPaddingStyle}>
        <ModifierRow
          onAccidental={onAccidental}
          onTie={onToggleTie}
          onOctaveChange={onOctaveChange}
          onArticulation={onArticulation}
          onRemoveArticulation={onRemoveArticulation}
          activeAccidental={activeAccidental}
          activeArticulation={activeArticulation}
          tieActive={tieActive}
          hasSelection={hasSelection}
          disabled={disabled}
          testID="modifier-row"
        />
      </View>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: 7,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 7,
  },
});

// =============================================================================
// Export
// =============================================================================

export const EntryPalette = memo(EntryPaletteComponent);
