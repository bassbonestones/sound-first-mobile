/**
 * CompactControls Component
 *
 * Unified compact control bar for small screens.
 * Combines minimal navigation (delete only) + overflow menu with measure controls.
 * Navigation uses swipe gestures on viewport, so only delete button shown here.
 */

import React, { memo, useCallback, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  AccessibilityRole,
  useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";
import type { MeasureValidation } from "../types";

// =============================================================================
// Types
// =============================================================================

export interface CompactControlsProps {
  /** Current measure number (1-based) */
  currentMeasure: number;
  /** Total measure count */
  totalMeasures: number;
  /** Validation state of current measure */
  validation: MeasureValidation;
  /** Called when delete is pressed */
  onDelete: () => void;
  /** Called when add measure is pressed */
  onAddMeasure: () => void;
  /** Called when delete measure is pressed */
  onDeleteMeasure: () => void;
  /** Called when delete last measure is pressed */
  onDeleteLastMeasure: () => void;
  /** Called when fill with rests is pressed */
  onFillWithRests: () => void;
  /** Called when add pickup is pressed (optional - tune composer only) */
  onAddPickup?: () => void;
  /** Whether a pickup measure exists (optional - tune composer only) */
  hasPickup?: boolean;
  /** Called when edit metadata is pressed (optional - tune composer only) */
  onEditMetadata?: () => void;
  /** Called when set measure tempo is pressed (optional - tune composer only) */
  onSetMeasureTempo?: () => void;
  /** Current measure's tempo override if any (optional - tune composer only) */
  measureTempo?: number;
  /** Whether there's a selected note (for delete) */
  hasSelection?: boolean;
  /** Whether delete measure is allowed */
  canDeleteMeasure?: boolean;
  /** Whether controls are disabled */
  disabled?: boolean;
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// Component
// =============================================================================

function CompactControlsComponent({
  currentMeasure,
  totalMeasures,
  validation,
  onDelete,
  onAddMeasure,
  onDeleteMeasure,
  onDeleteLastMeasure,
  onFillWithRests,
  onAddPickup,
  hasPickup = false,
  onEditMetadata,
  onSetMeasureTempo,
  measureTempo,
  hasSelection = false,
  canDeleteMeasure = true,
  disabled = false,
  testID,
}: CompactControlsProps): React.ReactElement {
  const [showMenu, setShowMenu] = useState(false);
  const { width } = useWindowDimensions();
  const showMeasureInfo = width >= 400;

  const handleDelete = useCallback(() => {
    // Delete doesn't require selection - it can find previous pitched note
    if (!disabled) onDelete();
  }, [disabled, onDelete]);

  const handleAddMeasure = useCallback(() => {
    if (!disabled) {
      onAddMeasure();
      setShowMenu(false);
    }
  }, [disabled, onAddMeasure]);

  const handleDeleteMeasure = useCallback(() => {
    if (!disabled && canDeleteMeasure) {
      onDeleteMeasure();
      setShowMenu(false);
    }
  }, [disabled, canDeleteMeasure, onDeleteMeasure]);

  const handleFillWithRests = useCallback(() => {
    if (!disabled && !validation.isComplete && validation.difference < 0) {
      onFillWithRests();
      setShowMenu(false);
    }
  }, [disabled, validation, onFillWithRests]);

  const handleAddPickup = useCallback(() => {
    if (!disabled && onAddPickup) {
      onAddPickup();
      setShowMenu(false);
    }
  }, [disabled, onAddPickup]);

  const handleEditMetadata = useCallback(() => {
    if (!disabled && onEditMetadata) {
      onEditMetadata();
      setShowMenu(false);
    }
  }, [disabled, onEditMetadata]);

  const handleSetMeasureTempo = useCallback(() => {
    if (!disabled && onSetMeasureTempo) {
      onSetMeasureTempo();
      setShowMenu(false);
    }
  }, [disabled, onSetMeasureTempo]);

  const canFill = !validation.isComplete && validation.difference < 0;

  return (
    <View style={styles.container} testID={testID}>
      {/* Measure indicator - hidden on narrow screens */}
      {showMeasureInfo && (
        <View style={styles.measureInfo}>
          <Text style={styles.measureText}>
            M{currentMeasure}/{totalMeasures}
          </Text>
        </View>
      )}

      {/* Delete note button */}
      <TouchableOpacity
        style={[
          styles.iconButton,
          styles.deleteButton,
          disabled && styles.buttonDisabled,
        ]}
        onPress={handleDelete}
        disabled={disabled}
        accessibilityRole={"button" as AccessibilityRole}
        accessibilityLabel="Delete note"
        accessibilityState={{ disabled }}
        testID="compact-delete"
      >
        <Feather
          name="trash-2"
          size={18}
          color={!disabled ? colors.error : colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Overflow menu button */}
      <TouchableOpacity
        style={[styles.iconButton, disabled && styles.buttonDisabled]}
        onPress={() => setShowMenu(true)}
        disabled={disabled}
        accessibilityRole={"button" as AccessibilityRole}
        accessibilityLabel="More options"
        testID="compact-more"
      >
        <Feather
          name="more-vertical"
          size={20}
          color={disabled ? colors.textSecondary : colors.textPrimary}
        />
      </TouchableOpacity>

      {/* Overflow Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setShowMenu(false)}
        >
          <View
            style={styles.menuContent}
            onStartShouldSetResponder={() => true}
          >
            {/* Fill with rests - only show if measure incomplete */}
            {canFill && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleFillWithRests}
                testID="menu-fill"
              >
                <Feather name="pause" size={18} color={colors.primary} />
                <Text style={styles.menuItemText}>Fill with Rests</Text>
              </TouchableOpacity>
            )}

            {/* Add measure */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleAddMeasure}
              testID="menu-add"
            >
              <Feather name="plus-square" size={18} color={colors.success} />
              <Text style={styles.menuItemText}>Add Measure at End</Text>
            </TouchableOpacity>

            {/* Add/Edit pickup measure - only show if onAddPickup is provided */}
            {onAddPickup && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleAddPickup}
                testID="menu-pickup"
              >
                <Feather name="skip-back" size={18} color={colors.primary} />
                <Text style={styles.menuItemText}>
                  {hasPickup ? "Edit Pickup Measure" : "Add Pickup Measure"}
                </Text>
              </TouchableOpacity>
            )}

            {/* Edit metadata - only show if onEditMetadata is provided */}
            {onEditMetadata && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleEditMetadata}
                testID="menu-metadata"
              >
                <Feather name="info" size={18} color={colors.primary} />
                <Text style={styles.menuItemText}>Edit Tune Info</Text>
              </TouchableOpacity>
            )}

            {/* Set measure tempo - only show if onSetMeasureTempo is provided */}
            {onSetMeasureTempo && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleSetMeasureTempo}
                testID="menu-tempo"
              >
                <Feather name="activity" size={18} color={colors.primary} />
                <Text style={styles.menuItemText}>
                  {measureTempo
                    ? `Tempo: ♩=${measureTempo}`
                    : "Set Measure Tempo"}
                </Text>
              </TouchableOpacity>
            )}

            {/* Delete last measure */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                !canDeleteMeasure && styles.menuItemDisabled,
              ]}
              onPress={() => {
                onDeleteLastMeasure();
                setShowMenu(false);
              }}
              disabled={!canDeleteMeasure}
              testID="menu-delete-last-measure"
            >
              <Feather
                name="minus-square"
                size={18}
                color={canDeleteMeasure ? colors.warning : colors.textSecondary}
              />
              <Text
                style={[
                  styles.menuItemText,
                  !canDeleteMeasure && styles.menuItemTextDisabled,
                ]}
              >
                Delete Last Measure
              </Text>
            </TouchableOpacity>

            {/* Delete current measure */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                !canDeleteMeasure && styles.menuItemDisabled,
              ]}
              onPress={handleDeleteMeasure}
              disabled={!canDeleteMeasure}
              testID="menu-delete-measure"
            >
              <Feather
                name="minus-square"
                size={18}
                color={canDeleteMeasure ? colors.error : colors.textSecondary}
              />
              <Text
                style={[
                  styles.menuItemText,
                  !canDeleteMeasure && styles.menuItemTextDisabled,
                ]}
              >
                Delete Current Measure
              </Text>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              style={[styles.menuItem, styles.cancelItem]}
              onPress={() => setShowMenu(false)}
              testID="menu-cancel"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
  },
  measureInfo: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.background,
    borderRadius: 4,
  },
  measureText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deleteButton: {
    // Delete could have special styling if needed
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  // Menu styles
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.sm,
    width: "75%",
    maxWidth: 280,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  menuItemTextDisabled: {
    color: colors.textSecondary,
  },
  cancelItem: {
    justifyContent: "center",
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textSecondary,
    textAlign: "center",
  },
});

// =============================================================================
// Export
// =============================================================================

export const CompactControls = memo(CompactControlsComponent);
