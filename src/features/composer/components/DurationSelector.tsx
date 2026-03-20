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
  /** Current triplet position (1, 2, or 3) - when on 2 or 3, only triplet durations allowed */
  tripletPosition?: 1 | 2 | 3;
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
  /** Optional overlay text (e.g., "3" for triplet) */
  overlayText?: string;
  /** Vertical offset to align note symbols (whole notes sit higher) */
  topOffset: number;
  /** Whether this is a triplet duration */
  isTriplet?: boolean;
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
    value: DURATION.TRIPLET_QUARTER,
    name: "triplet-quarter",
    label: "Triplet Qtr",
    symbol: "\uE1D5", // noteQuarterUp (same as quarter, with overlay)
    overlayText: "3",
    topOffset: 0,
    isTriplet: true,
  },
  {
    value: DURATION.TRIPLET_EIGHTH,
    name: "triplet-eighth",
    label: "Triplet 8th",
    symbol: "\uE1D7", // note8thUp (same symbol, with overlay)
    overlayText: "3",
    topOffset: 0,
    isTriplet: true,
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
  tripletPosition,
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

  // When on any triplet position, only triplet durations are allowed
  const inTripletGroup = tripletPosition !== undefined;
  // Disable dotted mode toggle when in triplet group
  const dotDisabled = disabled || inTripletGroup;

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.buttonRow}>
        {DURATION_OPTIONS.map((option) => {
          const isSelected = selectedDuration === option.value;

          // Determine if this button should be disabled
          let isButtonDisabled = disabled;

          // Disable sixteenth and triplet when dotted mode is active
          if (
            dottedMode &&
            (option.value === DURATION.SIXTEENTH || option.isTriplet)
          ) {
            isButtonDisabled = true;
          }

          // When in triplet group, only triplet durations are allowed
          if (inTripletGroup && !option.isTriplet) {
            isButtonDisabled = true;
          }

          // At position 3, triplet quarter is not allowed (needs 2 positions)
          if (
            tripletPosition === 3 &&
            option.value === DURATION.TRIPLET_QUARTER
          ) {
            isButtonDisabled = true;
          }

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
              <View style={styles.symbolContainer}>
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
                {option.overlayText && (
                  <Text
                    style={[
                      styles.tripletOverlay,
                      isSelected && styles.tripletOverlaySelected,
                      isButtonDisabled && styles.tripletOverlayDisabled,
                    ]}
                  >
                    {option.overlayText}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
        {/* Dot toggle button */}
        {onToggleDotted && (
          <TouchableOpacity
            style={[
              styles.dotButton,
              dottedMode && styles.dotButtonActive,
              dotDisabled && styles.buttonDisabled,
            ]}
            onPress={handleDotToggle}
            disabled={dotDisabled}
            accessibilityRole={"button" as AccessibilityRole}
            accessibilityLabel="Dotted note"
            accessibilityState={{ selected: dottedMode, disabled: dotDisabled }}
            accessibilityHint="Toggle dotted mode to add 50% duration"
            testID="duration-dot"
          >
            <Text
              style={[
                styles.dotSymbol,
                dottedMode && styles.dotSymbolActive,
                dotDisabled && styles.symbolDisabled,
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
  symbolContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
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
  tripletOverlay: {
    position: "absolute",
    top: -8,
    right: -6,
    fontSize: 10,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  tripletOverlaySelected: {
    color: colors.primary,
  },
  tripletOverlayDisabled: {
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
