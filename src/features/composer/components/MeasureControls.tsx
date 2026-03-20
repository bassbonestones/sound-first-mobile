/**
 * MeasureControls Component
 *
 * Buttons for measure management: add, delete, fill with rests.
 * Also shows measure validation status.
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
import type { MeasureValidation } from "../types";

// =============================================================================
// Types
// =============================================================================

export interface MeasureControlsProps {
  /** Current measure number (1-based) */
  currentMeasure: number;
  /** Total measure count */
  totalMeasures: number;
  /** Validation state of current measure */
  validation: MeasureValidation;
  /** Called when add measure is pressed */
  onAddMeasure: () => void;
  /** Called when delete measure is pressed */
  onDeleteMeasure: () => void;
  /** Called when fill with rests is pressed */
  onFillWithRests: () => void;
  /** Whether delete is allowed (not last measure) */
  canDelete?: boolean;
  /** Whether controls are disabled */
  disabled?: boolean;
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// Component
// =============================================================================

function MeasureControlsComponent({
  currentMeasure,
  totalMeasures,
  validation,
  onAddMeasure,
  onDeleteMeasure,
  onFillWithRests,
  canDelete = true,
  disabled = false,
  testID,
}: MeasureControlsProps): React.ReactElement {
  const handleAdd = useCallback(() => {
    if (!disabled) onAddMeasure();
  }, [disabled, onAddMeasure]);

  const handleDelete = useCallback(() => {
    if (!disabled && canDelete) onDeleteMeasure();
  }, [disabled, canDelete, onDeleteMeasure]);

  const handleFill = useCallback(() => {
    if (!disabled && !validation.isComplete) onFillWithRests();
  }, [disabled, validation.isComplete, onFillWithRests]);

  const showIncompleteWarning = !validation.isComplete;
  const beatsRemaining = validation.difference;

  return (
    <View style={styles.container} testID={testID}>
      {/* Measure indicator */}
      <View style={styles.measureIndicator}>
        <Text style={styles.measureLabel}>Measure</Text>
        <Text style={styles.measureNumber}>
          {currentMeasure} / {totalMeasures}
        </Text>
      </View>

      {/* Action buttons */}
      <View style={styles.buttonRow}>
        {/* Fill with rests */}
        {showIncompleteWarning && beatsRemaining < 0 && (
          <TouchableOpacity
            style={[
              styles.button,
              styles.fillButton,
              disabled && styles.buttonDisabled,
            ]}
            onPress={handleFill}
            disabled={disabled}
            accessibilityRole={"button" as AccessibilityRole}
            accessibilityLabel="Fill with rests"
            accessibilityHint="Add rests to complete the measure"
            accessibilityState={{ disabled }}
            testID="measure-fill"
          >
            <Feather name="pause" size={16} color={colors.primary} />
            <Text style={styles.fillButtonText}>Fill Rests</Text>
          </TouchableOpacity>
        )}

        {/* Add measure */}
        <TouchableOpacity
          style={[
            styles.button,
            styles.addButton,
            disabled && styles.buttonDisabled,
          ]}
          onPress={handleAdd}
          disabled={disabled}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel="Add measure at end"
          accessibilityState={{ disabled }}
          testID="measure-add"
        >
          <Feather name="plus" size={18} color={colors.success} />
        </TouchableOpacity>

        {/* Delete measure */}
        <TouchableOpacity
          style={[
            styles.button,
            styles.deleteButton,
            (!canDelete || disabled) && styles.buttonDisabled,
          ]}
          onPress={handleDelete}
          disabled={!canDelete || disabled}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel="Delete current measure"
          accessibilityState={{ disabled: !canDelete || disabled }}
          testID="measure-delete"
        >
          <Feather
            name="trash-2"
            size={16}
            color={canDelete && !disabled ? colors.error : colors.textSecondary}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  measureIndicator: {
    alignItems: "center",
  },
  measureLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  measureNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  validationContainer: {
    flex: 1,
  },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    gap: spacing.xs,
  },
  warningText: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: "600",
  },
  completeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    gap: spacing.xs,
  },
  completeText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
  },
  fillButton: {
    flexDirection: "row",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    gap: spacing.xs,
  },
  fillButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  addButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  deleteButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.errorLight,
    borderColor: colors.error,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});

// =============================================================================
// Export
// =============================================================================

export const MeasureControls = memo(MeasureControlsComponent);
