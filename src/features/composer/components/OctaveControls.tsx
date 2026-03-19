/**
 * OctaveControls Component
 *
 * Up/down buttons for shifting the entry octave.
 * Shows current octave number.
 */

import React, { memo, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  AccessibilityRole,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";

// =============================================================================
// Types
// =============================================================================

export interface OctaveControlsProps {
  /** Current octave display number (0-8 standard range) */
  currentOctave: number;
  /** Called when octave changes */
  onOctaveChange: (direction: "up" | "down") => void;
  /** Minimum octave (default: 0) */
  minOctave?: number;
  /** Maximum octave (default: 8) */
  maxOctave?: number;
  /** Whether controls are disabled */
  disabled?: boolean;
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// Component
// =============================================================================

function OctaveControlsComponent({
  currentOctave,
  onOctaveChange,
  minOctave = 0,
  maxOctave = 8,
  disabled = false,
  testID,
}: OctaveControlsProps): React.ReactElement {
  const canGoUp = currentOctave < maxOctave;
  const canGoDown = currentOctave > minOctave;

  const handleUp = useCallback(() => {
    if (!disabled && canGoUp) {
      onOctaveChange("up");
    }
  }, [disabled, canGoUp, onOctaveChange]);

  const handleDown = useCallback(() => {
    if (!disabled && canGoDown) {
      onOctaveChange("down");
    }
  }, [disabled, canGoDown, onOctaveChange]);

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>Octave</Text>
      <View style={styles.controlRow}>
        <TouchableOpacity
          style={[
            styles.button,
            (!canGoDown || disabled) && styles.buttonDisabled,
          ]}
          onPress={handleDown}
          disabled={!canGoDown || disabled}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel="Octave down"
          accessibilityState={{ disabled: !canGoDown || disabled }}
          testID="octave-down"
        >
          <Feather
            name="chevron-down"
            size={24}
            color={
              canGoDown && !disabled ? colors.textPrimary : colors.textSecondary
            }
          />
        </TouchableOpacity>

        <View style={styles.octaveDisplay}>
          <Text
            style={[styles.octaveText, disabled && styles.octaveTextDisabled]}
          >
            {currentOctave}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (!canGoUp || disabled) && styles.buttonDisabled,
          ]}
          onPress={handleUp}
          disabled={!canGoUp || disabled}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel="Octave up"
          accessibilityState={{ disabled: !canGoUp || disabled }}
          testID="octave-up"
        >
          <Feather
            name="chevron-up"
            size={24}
            color={
              canGoUp && !disabled ? colors.textPrimary : colors.textSecondary
            }
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  button: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  octaveDisplay: {
    width: 48,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  octaveText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  octaveTextDisabled: {
    color: colors.textSecondary,
  },
});

// =============================================================================
// Export
// =============================================================================

export const OctaveControls = memo(OctaveControlsComponent);
