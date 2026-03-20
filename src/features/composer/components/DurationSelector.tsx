/**
 * DurationSelector Component
 *
 * A row of duration buttons for selecting note/rest duration.
 * Shows whole, half, quarter, eighth, and sixteenth note options.
 * Uses Bravura font for professional music notation symbols.
 */

import React, { memo, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  AccessibilityRole,
} from "react-native";

import { colors, spacing } from "../../../constants";
import { DURATION, type DurationValue, type DurationName } from "../types";

// =============================================================================
// Types
// =============================================================================

export interface DurationSelectorProps {
  /** Currently selected duration */
  selectedDuration: DurationValue;
  /** Called when a duration is selected */
  onSelectDuration: (duration: DurationValue) => void;
  /** Whether dotted mode is active */
  dottedMode?: boolean;
  /** Called when dotted mode is toggled */
  onToggleDotted?: () => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Test ID for testing */
  testID?: string;
}

interface DurationOption {
  value: DurationValue;
  name: DurationName;
  label: string;
  /** SMuFL codepoint for Bravura font */
  symbol: string;
  /** Vertical offset to align note symbols (whole notes sit higher) */
  topOffset: number;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * SMuFL codepoints for Bravura font note symbols (stem up variants)
 * Same symbols used in TimeSignaturePickerModal for consistency
 */
const DURATION_OPTIONS: DurationOption[] = [
  {
    value: DURATION.WHOLE,
    name: "whole",
    label: "Whole",
    symbol: "\uE1D2", // noteWhole
    topOffset: -8, // Whole note sits higher
  },
  {
    value: DURATION.HALF,
    name: "half",
    label: "Half",
    symbol: "\uE1D3", // noteHalfUp
    topOffset: 0,
  },
  {
    value: DURATION.QUARTER,
    name: "quarter",
    label: "Quarter",
    symbol: "\uE1D5", // noteQuarterUp
    topOffset: 0,
  },
  {
    value: DURATION.EIGHTH,
    name: "eighth",
    label: "8th",
    symbol: "\uE1D7", // note8thUp
    topOffset: 0,
  },
  {
    value: DURATION.SIXTEENTH,
    name: "sixteenth",
    label: "16th",
    symbol: "\uE1D9", // note16thUp
    topOffset: 0,
  },
];

// =============================================================================
// Component
// =============================================================================

function DurationSelectorComponent({
  selectedDuration,
  onSelectDuration,
  dottedMode = false,
  onToggleDotted,
  disabled = false,
  testID,
}: DurationSelectorProps): React.ReactElement {
  const handlePress = useCallback(
    (duration: DurationValue) => {
      if (!disabled) {
        onSelectDuration(duration);
      }
    },
    [disabled, onSelectDuration],
  );

  const handleDotToggle = useCallback(() => {
    if (!disabled && onToggleDotted) {
      onToggleDotted();
    }
  }, [disabled, onToggleDotted]);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.buttonRow}>
        {DURATION_OPTIONS.map((option) => {
          const isSelected = selectedDuration === option.value;
          // Disable sixteenth note when dotted mode is active (since we don't support 32nd notes)
          const isSixteenthDisabledByDot =
            dottedMode && option.value === DURATION.SIXTEENTH;
          const isButtonDisabled = disabled || isSixteenthDisabledByDot;
          return (
            <TouchableOpacity
              key={option.name}
              style={[
                styles.button,
                isSelected && styles.buttonSelected,
                isButtonDisabled && styles.buttonDisabled,
              ]}
              onPress={() => handlePress(option.value)}
              disabled={isButtonDisabled}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel={`${option.label} note`}
              accessibilityState={{
                selected: isSelected,
                disabled: isButtonDisabled,
              }}
              testID={`duration-${option.name}`}
            >
              <Text
                style={[
                  styles.symbol,
                  isSelected && styles.symbolSelected,
                  isButtonDisabled && styles.symbolDisabled,
                  { marginTop: option.topOffset },
                ]}
              >
                {option.symbol}
              </Text>
            </TouchableOpacity>
          );
        })}
        {/* Dot toggle button */}
        {onToggleDotted && (
          <TouchableOpacity
            style={[
              styles.dotButton,
              dottedMode && styles.dotButtonActive,
              disabled && styles.buttonDisabled,
            ]}
            onPress={handleDotToggle}
            disabled={disabled}
            accessibilityRole={"button" as AccessibilityRole}
            accessibilityLabel="Dotted note"
            accessibilityState={{ selected: dottedMode, disabled }}
            accessibilityHint="Toggle dotted mode to add 50% duration"
            testID="duration-dot"
          >
            <Text
              style={[
                styles.dotSymbol,
                dottedMode && styles.dotSymbolActive,
                disabled && styles.symbolDisabled,
              ]}
            >
              •
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    paddingVertical: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 2,
  },
  button: {
    flex: 1,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingBottom: 0,
    borderRadius: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    height: 44,
  },
  buttonSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  symbol: {
    fontFamily: "Bravura",
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: -4,
  },
  symbolSelected: {
    color: colors.primary,
  },
  symbolDisabled: {
    color: colors.textSecondary,
  },
  buttonLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
  labelDisabled: {
    color: colors.textSecondary,
  },
  dotButton: {
    width: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    height: 44,
    marginLeft: spacing.xs,
  },
  dotButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  dotSymbol: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: "bold",
  },
  dotSymbolActive: {
    color: colors.primary,
  },
});

// =============================================================================
// Export
// =============================================================================

export const DurationSelector = memo(DurationSelectorComponent);
