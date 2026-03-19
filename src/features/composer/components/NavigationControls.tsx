/**
 * NavigationControls Component
 *
 * Arrow buttons for cursor navigation (left/right/up/down)
 * and delete button for removing notes.
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

export interface NavigationControlsProps {
  /** Called when left arrow is pressed */
  onLeft: () => void;
  /** Called when right arrow is pressed */
  onRight: () => void;
  /** Called when up arrow is pressed (raise pitch) */
  onUp: () => void;
  /** Called when down arrow is pressed (lower pitch) */
  onDown: () => void;
  /** Called when delete is pressed */
  onDelete: () => void;
  /** Whether there's a note to the left */
  canGoLeft?: boolean;
  /** Whether there's space to the right */
  canGoRight?: boolean;
  /** Whether there's a selected note (for pitch/delete) */
  hasSelection?: boolean;
  /** Whether controls are disabled */
  disabled?: boolean;
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// Component
// =============================================================================

function NavigationControlsComponent({
  onLeft,
  onRight,
  onUp,
  onDown,
  onDelete,
  canGoLeft = true,
  canGoRight = true,
  hasSelection = false,
  disabled = false,
  testID,
}: NavigationControlsProps): React.ReactElement {
  const handleLeft = useCallback(() => {
    if (!disabled && canGoLeft) onLeft();
  }, [disabled, canGoLeft, onLeft]);

  const handleRight = useCallback(() => {
    if (!disabled && canGoRight) onRight();
  }, [disabled, canGoRight, onRight]);

  const handleUp = useCallback(() => {
    if (!disabled && hasSelection) onUp();
  }, [disabled, hasSelection, onUp]);

  const handleDown = useCallback(() => {
    if (!disabled && hasSelection) onDown();
  }, [disabled, hasSelection, onDown]);

  const handleDelete = useCallback(() => {
    if (!disabled && hasSelection) onDelete();
  }, [disabled, hasSelection, onDelete]);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.row}>
        {/* Up arrow */}
        <TouchableOpacity
          style={[
            styles.button,
            styles.arrowButton,
            (!hasSelection || disabled) && styles.buttonDisabled,
          ]}
          onPress={handleUp}
          disabled={!hasSelection || disabled}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel="Pitch up"
          accessibilityHint="Raise pitch by one diatonic step"
          accessibilityState={{ disabled: !hasSelection || disabled }}
          testID="nav-up"
        >
          <Feather
            name="chevron-up"
            size={28}
            color={
              hasSelection && !disabled
                ? colors.textPrimary
                : colors.textSecondary
            }
          />
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        {/* Left arrow */}
        <TouchableOpacity
          style={[
            styles.button,
            styles.arrowButton,
            (!canGoLeft || disabled) && styles.buttonDisabled,
          ]}
          onPress={handleLeft}
          disabled={!canGoLeft || disabled}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel="Previous note"
          accessibilityState={{ disabled: !canGoLeft || disabled }}
          testID="nav-left"
        >
          <Feather
            name="chevron-left"
            size={28}
            color={
              canGoLeft && !disabled ? colors.textPrimary : colors.textSecondary
            }
          />
        </TouchableOpacity>

        {/* Delete button in center */}
        <TouchableOpacity
          style={[
            styles.button,
            styles.deleteButton,
            (!hasSelection || disabled) && styles.buttonDisabled,
          ]}
          onPress={handleDelete}
          disabled={!hasSelection || disabled}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel="Delete note"
          accessibilityState={{ disabled: !hasSelection || disabled }}
          testID="nav-delete"
        >
          <Feather
            name="trash-2"
            size={20}
            color={
              hasSelection && !disabled ? colors.error : colors.textSecondary
            }
          />
        </TouchableOpacity>

        {/* Right arrow */}
        <TouchableOpacity
          style={[
            styles.button,
            styles.arrowButton,
            (!canGoRight || disabled) && styles.buttonDisabled,
          ]}
          onPress={handleRight}
          disabled={!canGoRight || disabled}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel="Next position"
          accessibilityState={{ disabled: !canGoRight || disabled }}
          testID="nav-right"
        >
          <Feather
            name="chevron-right"
            size={28}
            color={
              canGoRight && !disabled
                ? colors.textPrimary
                : colors.textSecondary
            }
          />
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        {/* Down arrow */}
        <TouchableOpacity
          style={[
            styles.button,
            styles.arrowButton,
            (!hasSelection || disabled) && styles.buttonDisabled,
          ]}
          onPress={handleDown}
          disabled={!hasSelection || disabled}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel="Pitch down"
          accessibilityHint="Lower pitch by one diatonic step"
          accessibilityState={{ disabled: !hasSelection || disabled }}
          testID="nav-down"
        >
          <Feather
            name="chevron-down"
            size={28}
            color={
              hasSelection && !disabled
                ? colors.textPrimary
                : colors.textSecondary
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
    padding: spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  arrowButton: {
    width: 52,
    height: 52,
    margin: spacing.xs / 2,
  },
  deleteButton: {
    width: 44,
    height: 44,
    margin: spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});

// =============================================================================
// Export
// =============================================================================

export const NavigationControls = memo(NavigationControlsComponent);
