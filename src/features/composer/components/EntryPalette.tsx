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
  /** Whether dotted mode is active */
  dottedMode?: boolean;
  /** Called when dotted mode is toggled */
  onToggleDotted?: () => void;
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
  /** Extra vertical padding per row for responsive layouts */
  extraRowPadding?: number;
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
  dottedMode = false,
  onToggleDotted,
  onPitchTap,
  onOctaveChange,
  onAccidental,
  onInsertRest,
  onToggleTie,
  disabled = false,
  extraRowPadding = 0,
  testID,
}: EntryPaletteProps): React.ReactElement {
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

      {/* Modifier row */}
      <View style={rowPaddingStyle}>
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
