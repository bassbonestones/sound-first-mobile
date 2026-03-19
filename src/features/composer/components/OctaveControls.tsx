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
  StyleSheet,
  AccessibilityRole,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";

// =============================================================================
// Types
// =============================================================================

export interface OctaveControlsProps {
  /** Called when octave changes */
  onOctaveChange: (direction: "up" | "down") => void;
  /** Whether controls are disabled */
  disabled?: boolean;
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// Component
// =============================================================================

function OctaveControlsComponent({
  onOctaveChange,
  disabled = false,
  testID,
}: OctaveControlsProps): React.ReactElement {
  const handleUp = useCallback(() => {
    if (!disabled) {
      onOctaveChange("up");
    }
  }, [disabled, onOctaveChange]);

  const handleDown = useCallback(() => {
    if (!disabled) {
      onOctaveChange("down");
    }
  }, [disabled, onOctaveChange]);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.controlRow}>
        <TouchableOpacity
          style={[styles.button, disabled && styles.buttonDisabled]}
          onPress={handleUp}
          disabled={disabled}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel="Octave up"
          accessibilityState={{ disabled }}
          testID="octave-up"
        >
          <Feather
            name="chevron-up"
            size={24}
            color={!disabled ? colors.textPrimary : colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, disabled && styles.buttonDisabled]}
          onPress={handleDown}
          disabled={disabled}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel="Octave down"
          accessibilityState={{ disabled }}
          testID="octave-down"
        >
          <Feather
            name="chevron-down"
            size={24}
            color={!disabled ? colors.textPrimary : colors.textSecondary}
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
    justifyContent: "center",
  },
  controlRow: {
    flexDirection: "column",
    alignItems: "center",
    gap: spacing.xs,
  },
  button: {
    width: 44,
    height: 36,
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
});

// =============================================================================
// Export
// =============================================================================

export const OctaveControls = memo(OctaveControlsComponent);
