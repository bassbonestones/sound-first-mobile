/**
 * MeasureTimeSignatureModal Component
 *
 * Modal for setting or clearing time signature override on a specific measure.
 * Allows mid-piece time signature changes.
 */

import React, { useState, useCallback, memo } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  AccessibilityRole,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../../constants";
import type { TimeSignature } from "../../types";

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format a time signature for display (e.g., "4/4", "6/8").
 */
function formatTimeSignature(timeSig: TimeSignature): string {
  return `${timeSig.beats}/${timeSig.beatUnit}`;
}

// =============================================================================
// Types
// =============================================================================

export interface MeasureTimeSignatureModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Called when modal is closed */
  onClose: () => void;
  /** Current measure number (1-based, for display) */
  measureNumber: number;
  /** Current time signature override for the measure (undefined if inheriting) */
  currentTime: TimeSignature | undefined;
  /** Effective time signature for the measure (including inheritance) */
  effectiveTime: TimeSignature;
  /** Duration of only pitched notes in the measure (excludes rests), in beats */
  pitchedNoteDuration?: number;
  /** Called when time signature is set */
  onSetTime: (time: TimeSignature) => void;
  /** Called when time signature is cleared (inherit from previous) */
  onClearTime: () => void;
}

// =============================================================================
// Component
// =============================================================================

function MeasureTimeSignatureModalComponent({
  visible,
  onClose,
  measureNumber,
  currentTime,
  effectiveTime,
  pitchedNoteDuration = 0,
  onSetTime,
  onClearTime,
}: MeasureTimeSignatureModalProps): React.ReactElement {
  const [pendingTime, setPendingTime] = useState<TimeSignature>(effectiveTime);
  const hasOverride = currentTime !== undefined;

  // Reset pending time when modal opens
  React.useEffect(() => {
    if (visible) {
      setPendingTime(effectiveTime);
    }
  }, [visible, effectiveTime]);

  // Calculate if pitched notes would overflow with the selected time signature
  // Only count actual notes, not rests
  const pendingBeats = (pendingTime.beats * 4) / pendingTime.beatUnit; // Convert to quarter note beats
  const notesWillOverflow = pitchedNoteDuration > pendingBeats;

  const handleApply = useCallback(() => {
    onSetTime(pendingTime);
    onClose();
  }, [pendingTime, onSetTime, onClose]);

  const handleClear = useCallback(() => {
    onClearTime();
    onClose();
  }, [onClearTime, onClose]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleBeatsChange = useCallback((beats: number) => {
    setPendingTime((prev) => ({ ...prev, beats }));
  }, []);

  const handleBeatUnitChange = useCallback((beatUnit: number) => {
    setPendingTime((prev) => ({ ...prev, beatUnit }));
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Measure {measureNumber} Time</Text>
            <TouchableOpacity
              onPress={handleCancel}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel="Close"
              testID="measure-time-close"
            >
              <Feather name="x" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Status */}
          <View style={styles.statusRow}>
            {hasOverride ? (
              <Text style={styles.statusText}>
                {formatTimeSignature(currentTime)} (time change)
              </Text>
            ) : (
              <Text style={styles.statusTextInherited}>
                {formatTimeSignature(effectiveTime)} (inherited)
              </Text>
            )}
          </View>

          {/* Time Signature Stepper Controls */}
          <View style={styles.pickerContainer}>
            {/* Beats per measure */}
            <View style={styles.stepperSection}>
              <Text style={styles.stepperLabel}>Beats per measure</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() =>
                    handleBeatsChange(Math.max(1, pendingTime.beats - 1))
                  }
                  accessibilityRole={"button" as AccessibilityRole}
                  accessibilityLabel="Decrease beats"
                  testID="measure-time-beats-minus"
                >
                  <Text style={styles.stepperButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{pendingTime.beats}</Text>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() =>
                    handleBeatsChange(Math.min(12, pendingTime.beats + 1))
                  }
                  accessibilityRole={"button" as AccessibilityRole}
                  accessibilityLabel="Increase beats"
                  testID="measure-time-beats-plus"
                >
                  <Text style={styles.stepperButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Beat unit */}
            <View style={styles.stepperSection}>
              <Text style={styles.stepperLabel}>Beat note value</Text>
              <View style={styles.beatUnitRow}>
                {[2, 4, 8, 16].map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      styles.beatUnitButton,
                      pendingTime.beatUnit === unit &&
                        styles.beatUnitButtonSelected,
                    ]}
                    onPress={() => handleBeatUnitChange(unit)}
                    accessibilityRole={"button" as AccessibilityRole}
                    accessibilityLabel={`Beat unit ${unit}`}
                    accessibilityState={{
                      selected: pendingTime.beatUnit === unit,
                    }}
                    testID={`measure-time-unit-${unit}`}
                  >
                    <Text
                      style={[
                        styles.beatUnitText,
                        pendingTime.beatUnit === unit &&
                          styles.beatUnitTextSelected,
                      ]}
                    >
                      {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Preview */}
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Selected:</Text>
              <Text style={styles.previewValue}>
                {formatTimeSignature(pendingTime)}
              </Text>
            </View>
          </View>

          {/* Warning when notes would overflow */}
          {notesWillOverflow && (
            <View style={styles.warningRow}>
              <Feather name="alert-triangle" size={16} color={colors.warning} />
              <Text style={styles.warningText}>
                Notes exceed {formatTimeSignature(pendingTime)} capacity. Delete
                notes first.
              </Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            {hasOverride && (
              <TouchableOpacity
                style={[styles.button, styles.clearButton]}
                onPress={handleClear}
                accessibilityRole={"button" as AccessibilityRole}
                accessibilityLabel="Clear time signature and inherit from previous measure"
                testID="measure-time-clear"
              >
                <Feather name="rotate-ccw" size={16} color={colors.warning} />
                <Text style={styles.clearButtonText}>Inherit</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel="Cancel"
              testID="measure-time-cancel"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.applyButton,
                notesWillOverflow && styles.applyButtonDisabled,
              ]}
              onPress={handleApply}
              disabled={notesWillOverflow}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel={`Apply ${formatTimeSignature(pendingTime)}`}
              accessibilityState={{ disabled: notesWillOverflow }}
              testID="measure-time-apply"
            >
              <Text
                style={[
                  styles.applyButtonText,
                  notesWillOverflow && styles.applyButtonTextDisabled,
                ]}
              >
                Apply
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    width: "85%",
    maxWidth: 340,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  statusRow: {
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary,
    textAlign: "center",
  },
  statusTextInherited: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
    textAlign: "center",
  },
  pickerContainer: {
    marginBottom: spacing.md,
  },
  stepperSection: {
    marginBottom: spacing.md,
  },
  stepperLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  stepperRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.lg,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  stepperButtonText: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.primary,
  },
  stepperValue: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.textPrimary,
    minWidth: 60,
    textAlign: "center",
  },
  beatUnitRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
  },
  beatUnitButton: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  beatUnitButtonSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  beatUnitText: {
    fontSize: 18,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  beatUnitTextSelected: {
    fontWeight: "700",
    color: colors.primary,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  previewLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  previewValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    gap: spacing.xs,
  },
  clearButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.warning,
    marginRight: "auto",
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.warning,
  },
  cancelButton: {
    backgroundColor: colors.background,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  applyButton: {
    backgroundColor: colors.primary,
  },
  applyButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
  },
  applyButtonTextDisabled: {
    color: colors.white,
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.warningLight ?? "#FFF3CD",
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  warningText: {
    fontSize: 13,
    color: colors.warning,
    flex: 1,
  },
});

// =============================================================================
// Export
// =============================================================================

export const MeasureTimeSignatureModal = memo(
  MeasureTimeSignatureModalComponent,
);
