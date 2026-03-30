/**
 * MeasureTempoModal Component
 *
 * Modal for setting or clearing tempo override on a specific measure.
 * Allows mid-piece tempo changes.
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
import { TempoSlider } from "../../../../components/TempoSlider";

// =============================================================================
// Types
// =============================================================================

export interface MeasureTempoModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Called when modal is closed */
  onClose: () => void;
  /** Current measure number (1-based, for display) */
  measureNumber: number;
  /** Current tempo override for the measure (undefined if inheriting) */
  currentTempo: number | undefined;
  /** Effective tempo for the measure (including inheritance) */
  effectiveTempo: number;
  /** Score-level default tempo */
  scoreTempo: number;
  /** Called when tempo is set */
  onSetTempo: (tempo: number) => void;
  /** Called when tempo is cleared (inherit from previous) */
  onClearTempo: () => void;
}

// =============================================================================
// Component
// =============================================================================

function MeasureTempoModalComponent({
  visible,
  onClose,
  measureNumber,
  currentTempo,
  effectiveTempo,
  scoreTempo,
  onSetTempo,
  onClearTempo,
}: MeasureTempoModalProps): React.ReactElement {
  const [pendingTempo, setPendingTempo] = useState(effectiveTempo);
  const hasOverride = currentTempo !== undefined;

  // Reset pending tempo when modal opens
  React.useEffect(() => {
    if (visible) {
      setPendingTempo(effectiveTempo);
    }
  }, [visible, effectiveTempo]);

  const handleApply = useCallback(() => {
    onSetTempo(pendingTempo);
    onClose();
  }, [pendingTempo, onSetTempo, onClose]);

  const handleClear = useCallback(() => {
    onClearTempo();
    onClose();
  }, [onClearTempo, onClose]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

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
            <Text style={styles.title}>Measure {measureNumber} Tempo</Text>
            <TouchableOpacity
              onPress={handleCancel}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel="Close"
              testID="measure-tempo-close"
            >
              <Feather name="x" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Status */}
          <View style={styles.statusRow}>
            {hasOverride ? (
              <Text style={styles.statusText}>
                ♩ = {currentTempo} (custom tempo)
              </Text>
            ) : (
              <Text style={styles.statusTextInherited}>
                ♩ = {effectiveTempo} (inherited)
              </Text>
            )}
          </View>

          {/* Tempo Slider */}
          <View style={styles.sliderContainer}>
            <TempoSlider
              tempo={pendingTempo}
              tempoRange={[20, 300]}
              onTempoChange={setPendingTempo}
              label="Tempo"
              accessibilityLabel={`Set tempo for measure ${measureNumber}`}
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            {hasOverride && (
              <TouchableOpacity
                style={[styles.button, styles.clearButton]}
                onPress={handleClear}
                accessibilityRole={"button" as AccessibilityRole}
                accessibilityLabel="Clear tempo override and inherit from previous measure"
                testID="measure-tempo-clear"
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
              testID="measure-tempo-cancel"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.applyButton]}
              onPress={handleApply}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel={`Set tempo to ${pendingTempo}`}
              testID="measure-tempo-apply"
            >
              <Feather name="check" size={16} color={colors.textOnPrimary} />
              <Text style={styles.applyButtonText}>Apply</Text>
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
    borderRadius: spacing.md,
    padding: spacing.lg,
    width: "85%",
    maxWidth: 400,
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
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  statusText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "500",
    textAlign: "center",
  },
  statusTextInherited: {
    fontSize: 16,
    color: colors.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
  },
  sliderContainer: {
    marginBottom: spacing.lg,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.sm,
    gap: spacing.xs,
  },
  clearButton: {
    backgroundColor: colors.warningBackground,
    marginRight: "auto",
  },
  clearButtonText: {
    color: colors.warning,
    fontWeight: "500",
  },
  cancelButton: {
    backgroundColor: colors.background,
  },
  cancelButtonText: {
    color: colors.textSecondary,
  },
  applyButton: {
    backgroundColor: colors.primary,
  },
  applyButtonText: {
    color: colors.textOnPrimary,
    fontWeight: "500",
  },
});

export const MeasureTempoModal = memo(MeasureTempoModalComponent);
