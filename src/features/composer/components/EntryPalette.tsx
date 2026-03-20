/**
 * EntryPalette Component
 *
 * Main note entry interface combining duration selection, pitch input,
 * and modifiers. This is the primary interaction area
 * for step-entry music composition.
 */

import React, { memo } from "react";
import { View, StyleSheet } from "react-native";

import { colors, spacing } from "../../../constants";
import { DurationSelector } from "./DurationSelector";
import { PitchSelector } from "./PitchSelector";
import { ModifierRow } from "./ModifierRow";
import type { DurationValue, PitchName, Accidental, Note } from "../types";

// =============================================================================
// Types
// =============================================================================

export interface EntryPaletteProps {
  /** Currently selected duration for new notes */
  selectedDuration: DurationValue;
  /** Currently selected note (if any) */
  selectedNote: Note | null;
  /** Called when duration is selected */
  onDurationSelect: (duration: DurationValue) => void;
  /** Called when a pitch is tapped to insert a note */
  onPitchTap: (pitch: PitchName) => void;
  /** Called when octave changes */
  onOctaveChange: (direction: "up" | "down") => void;
  /** Called when an accidental is applied */
  onAccidental: (accidental: Accidental) => void;
  /** Called when rest is inserted */
  onInsertRest: () => void;
  /** Called when tie is toggled */
  onToggleTie: () => void;
  /** Whether the palette is disabled (e.g., during playback) */
  disabled?: boolean;
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// Component
// =============================================================================

function EntryPaletteComponent({
  selectedDuration,
  selectedNote,
  onDurationSelect,
  onPitchTap,
  onOctaveChange,
  onAccidental,
  onInsertRest,
  onToggleTie,
  disabled = false,
  testID,
}: EntryPaletteProps): React.ReactElement {
  const hasSelection = selectedNote !== null;
  const activeAccidental = selectedNote?.accidental;
  const tieActive = selectedNote?.tieStart ?? false;

  return (
    <View style={styles.container} testID={testID}>
      {/* Duration row */}
      <DurationSelector
        selectedDuration={selectedDuration}
        onSelectDuration={onDurationSelect}
        disabled={disabled}
        testID="duration-selector"
      />

      {/* Pitch row (includes rest at beginning) */}
      <PitchSelector
        onSelectPitch={onPitchTap}
        onInsertRest={onInsertRest}
        selectedDuration={selectedDuration}
        disabled={disabled}
        testID="pitch-selector"
      />

      {/* Modifier row */}
      <ModifierRow
        onAccidental={onAccidental}
        onTie={onToggleTie}
        onOctaveChange={onOctaveChange}
        activeAccidental={activeAccidental}
        tieActive={tieActive}
        hasSelection={hasSelection}
        disabled={disabled}
        testID="modifier-row"
      />
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
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
});

// =============================================================================
// Export
// =============================================================================

export const EntryPalette = memo(EntryPaletteComponent);
