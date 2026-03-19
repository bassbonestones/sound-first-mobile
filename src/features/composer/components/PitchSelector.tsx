/**
 * PitchSelector Component
 *
 * A row of pitch buttons (C, D, E, F, G, A, B) for entering notes.
 * Tapping a pitch inserts a note at the current cursor position.
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
import { PITCH_NAMES, type PitchName } from "../types";

// =============================================================================
// Types
// =============================================================================

export interface PitchSelectorProps {
  /** Called when a pitch is tapped */
  onSelectPitch: (pitch: PitchName) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Optional highlighted pitch (for showing last entered) */
  highlightedPitch?: PitchName | null;
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// Component
// =============================================================================

function PitchSelectorComponent({
  onSelectPitch,
  disabled = false,
  highlightedPitch,
  testID,
}: PitchSelectorProps): React.ReactElement {
  const handlePress = useCallback(
    (pitch: PitchName) => {
      if (!disabled) {
        onSelectPitch(pitch);
      }
    },
    [disabled, onSelectPitch],
  );

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>Pitch</Text>
      <View style={styles.buttonRow}>
        {PITCH_NAMES.map((pitch) => {
          const isHighlighted = highlightedPitch === pitch;
          return (
            <TouchableOpacity
              key={pitch}
              style={[
                styles.button,
                isHighlighted && styles.buttonHighlighted,
                disabled && styles.buttonDisabled,
              ]}
              onPress={() => handlePress(pitch)}
              disabled={disabled}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel={`Note ${pitch}`}
              accessibilityState={{ disabled }}
              accessibilityHint="Insert this note at cursor position"
              testID={`pitch-${pitch}`}
            >
              <Text
                style={[
                  styles.pitchText,
                  isHighlighted && styles.pitchTextHighlighted,
                  disabled && styles.pitchTextDisabled,
                ]}
              >
                {pitch}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
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
    gap: spacing.xs,
  },
  button: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    minHeight: 56,
  },
  buttonHighlighted: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  pitchText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  pitchTextHighlighted: {
    color: colors.success,
  },
  pitchTextDisabled: {
    color: colors.textSecondary,
  },
});

// =============================================================================
// Export
// =============================================================================

export const PitchSelector = memo(PitchSelectorComponent);
