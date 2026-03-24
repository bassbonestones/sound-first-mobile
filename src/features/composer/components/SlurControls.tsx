/**
 * SlurControls Component
 *
 * Controls for creating and editing slurs/legato markings.
 * Provides a slur mode toggle, start slur, extend left/right, and done buttons.
 */

import React, { memo } from "react";
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

export interface SlurControlsProps {
  /** Whether slur mode is currently active */
  slurModeActive: boolean;
  /** Toggle slur mode on/off */
  onToggleSlurMode: () => void;
  /** Start a new slur from current note (creates 2-note slur) */
  onStartSlur: () => void;
  /** Extend slur start to previous note */
  onExtendSlurLeft: () => void;
  /** Extend slur end to next note */
  onExtendSlurRight: () => void;
  /** Remove slur from selected note */
  onRemoveSlur: () => void;
  /** Flip slur placement (above/below) */
  onFlipSlur: () => void;
  /** Exit slur mode */
  onDone: () => void;
  /** Whether there's a note selected */
  hasSelection: boolean;
  /** Whether we're currently editing a slur (just created or extending) */
  hasActiveSlur: boolean;
  /** Whether the selected note is part of an existing slur */
  selectedNoteHasSlur: boolean;
  /** Whether we can extend left (slur start can move earlier) */
  canExtendLeft: boolean;
  /** Whether we can extend right (slur end can move later) */
  canExtendRight: boolean;
  /** Whether controls are disabled */
  disabled?: boolean;
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// Component
// =============================================================================

function SlurControlsComponent({
  slurModeActive,
  onToggleSlurMode,
  onStartSlur,
  onExtendSlurLeft,
  onExtendSlurRight,
  onRemoveSlur,
  onFlipSlur,
  onDone,
  hasSelection,
  hasActiveSlur,
  selectedNoteHasSlur,
  canExtendLeft,
  canExtendRight,
  disabled = false,
  testID,
}: SlurControlsProps): React.ReactElement {
  const isDisabled = disabled || !hasSelection;

  // When not in slur mode, just show the toggle button
  if (!slurModeActive) {
    return (
      <View style={styles.container} testID={testID}>
        <TouchableOpacity
          style={[styles.toggleButton, isDisabled && styles.buttonDisabled]}
          onPress={onToggleSlurMode}
          disabled={isDisabled}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel="Enter slur mode"
          testID="slur-mode-toggle"
        >
          <Text style={styles.slurSymbol}>⌒</Text>
          <Text
            style={[styles.toggleLabel, isDisabled && styles.labelDisabled]}
          >
            Slur
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // In slur mode, show full controls
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.slurModeContainer}>
        {/* Mode indicator */}
        <View style={styles.modeIndicator}>
          <Text style={styles.slurSymbol}>⌒</Text>
          <Text style={styles.modeLabel}>Slur Mode</Text>
        </View>

        {/* Controls row */}
        <View style={styles.controlsRow}>
          {/* Start Slur (only if no active slur and selected note doesn't have a slur) */}
          {!hasActiveSlur && !selectedNoteHasSlur && (
            <TouchableOpacity
              style={[styles.actionButton, styles.startButton]}
              onPress={onStartSlur}
              disabled={disabled}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel="Start slur"
              testID="slur-start"
            >
              <Text style={styles.actionButtonText}>Start</Text>
            </TouchableOpacity>
          )}

          {/* Remove Slur (when selected note is part of an existing slur, but not actively editing) */}
          {!hasActiveSlur && selectedNoteHasSlur && (
            <TouchableOpacity
              style={[styles.actionButton, styles.removeButton]}
              onPress={onRemoveSlur}
              disabled={disabled}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel="Remove slur"
              testID="slur-remove"
            >
              <Text style={styles.actionButtonText}>Remove</Text>
            </TouchableOpacity>
          )}

          {/* Flip Slur (when there's an active slur or selected note has a slur) */}
          {(hasActiveSlur || selectedNoteHasSlur) && (
            <TouchableOpacity
              style={[styles.actionButton, styles.flipButton]}
              onPress={onFlipSlur}
              disabled={disabled}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel="Flip slur position"
              testID="slur-flip"
            >
              <Feather name="refresh-cw" size={14} color={colors.white} />
              <Text style={styles.flipButtonText}>Flip</Text>
            </TouchableOpacity>
          )}

          {/* Extend controls (only if active slur) */}
          {hasActiveSlur && (
            <>
              <TouchableOpacity
                style={[
                  styles.arrowButton,
                  !canExtendLeft && styles.buttonDisabled,
                ]}
                onPress={onExtendSlurLeft}
                disabled={!canExtendLeft}
                accessibilityRole={"button" as AccessibilityRole}
                accessibilityLabel="Extend slur left"
                testID="slur-extend-left"
              >
                <Feather
                  name="chevron-left"
                  size={20}
                  color={canExtendLeft ? colors.white : colors.textSecondary}
                />
              </TouchableOpacity>

              <Text style={styles.extendLabel}>Extend</Text>

              <TouchableOpacity
                style={[
                  styles.arrowButton,
                  !canExtendRight && styles.buttonDisabled,
                ]}
                onPress={onExtendSlurRight}
                disabled={!canExtendRight}
                accessibilityRole={"button" as AccessibilityRole}
                accessibilityLabel="Extend slur right"
                testID="slur-extend-right"
              >
                <Feather
                  name="chevron-right"
                  size={20}
                  color={canExtendRight ? colors.white : colors.textSecondary}
                />
              </TouchableOpacity>
            </>
          )}

          {/* Done button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.doneButton]}
            onPress={onDone}
            accessibilityRole={"button" as AccessibilityRole}
            accessibilityLabel="Done with slur"
            testID="slur-done"
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  slurSymbol: {
    fontSize: 18,
    color: colors.primary,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  labelDisabled: {
    color: colors.textSecondary,
  },
  slurModeContainer: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: spacing.sm,
  },
  modeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  modeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    minWidth: 60,
    alignItems: "center",
  },
  startButton: {
    backgroundColor: colors.primary,
  },
  removeButton: {
    backgroundColor: colors.error,
  },
  flipButton: {
    backgroundColor: colors.warning,
    flexDirection: "row",
    gap: 4,
  },
  flipButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  extendLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginHorizontal: spacing.xs,
  },
  doneButton: {
    backgroundColor: colors.success,
  },
  doneButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
});

// =============================================================================
// Export
// =============================================================================

export const SlurControls = memo(SlurControlsComponent);
