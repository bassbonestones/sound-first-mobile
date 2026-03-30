/**
 * MeasureKeySignatureModal Component
 *
 * Modal for setting or clearing key signature override on a specific measure.
 * Allows mid-piece key changes.
 */

import React, { useState, useCallback, memo } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  AccessibilityRole,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../../constants";
import type { KeySignature } from "../../types";
import { getKeyName } from "../../../composer/constants/keySignatures";

// =============================================================================
// Constants
// =============================================================================

// All valid key signature values from -7 (Cb) to +7 (C#)
const ALL_KEY_SIGNATURES: KeySignature[] = [
  -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7,
];

// =============================================================================
// Types
// =============================================================================

export interface MeasureKeySignatureModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Called when modal is closed */
  onClose: () => void;
  /** Current measure number (1-based, for display) */
  measureNumber: number;
  /** Current key signature override for the measure (undefined if inheriting) */
  currentKey: KeySignature | undefined;
  /** Effective key signature for the measure (including inheritance) */
  effectiveKey: KeySignature;
  /** Score-level default key signature */
  scoreKey: KeySignature;
  /** Called when key signature is set */
  onSetKey: (key: KeySignature) => void;
  /** Called when key signature is cleared (inherit from previous) */
  onClearKey: () => void;
}

// =============================================================================
// Component
// =============================================================================

function MeasureKeySignatureModalComponent({
  visible,
  onClose,
  measureNumber,
  currentKey,
  effectiveKey,
  scoreKey,
  onSetKey,
  onClearKey,
}: MeasureKeySignatureModalProps): React.ReactElement {
  const [pendingKey, setPendingKey] = useState<KeySignature>(effectiveKey);
  const hasOverride = currentKey !== undefined;

  // Reset pending key when modal opens
  React.useEffect(() => {
    if (visible) {
      setPendingKey(effectiveKey);
    }
  }, [visible, effectiveKey]);

  const handleApply = useCallback(() => {
    onSetKey(pendingKey);
    onClose();
  }, [pendingKey, onSetKey, onClose]);

  const handleClear = useCallback(() => {
    onClearKey();
    onClose();
  }, [onClearKey, onClose]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSelectKey = useCallback((key: KeySignature) => {
    setPendingKey(key);
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
            <Text style={styles.title}>Measure {measureNumber} Key</Text>
            <TouchableOpacity
              onPress={handleCancel}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel="Close"
              testID="measure-key-close"
            >
              <Feather name="x" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Status */}
          <View style={styles.statusRow}>
            {hasOverride ? (
              <Text style={styles.statusText}>
                {getKeyName(currentKey)} (key change)
              </Text>
            ) : (
              <Text style={styles.statusTextInherited}>
                {getKeyName(effectiveKey)} (inherited)
              </Text>
            )}
          </View>

          {/* Key Signature Picker */}
          <ScrollView
            style={styles.pickerContainer}
            contentContainerStyle={styles.pickerContent}
            showsVerticalScrollIndicator
          >
            {ALL_KEY_SIGNATURES.map((key) => {
              const isSelected = key === pendingKey;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.keyItem, isSelected && styles.keyItemSelected]}
                  onPress={() => handleSelectKey(key)}
                  accessibilityRole={"button" as AccessibilityRole}
                  accessibilityLabel={getKeyName(key)}
                  accessibilityState={{ selected: isSelected }}
                  testID={`measure-key-option-${key}`}
                >
                  <Text
                    style={[
                      styles.keyItemText,
                      isSelected && styles.keyItemTextSelected,
                    ]}
                  >
                    {getKeyName(key)}
                  </Text>
                  {isSelected && (
                    <Feather name="check" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            {hasOverride && (
              <TouchableOpacity
                style={[styles.button, styles.clearButton]}
                onPress={handleClear}
                accessibilityRole={"button" as AccessibilityRole}
                accessibilityLabel="Clear key signature and inherit from previous measure"
                testID="measure-key-clear"
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
              testID="measure-key-cancel"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.applyButton]}
              onPress={handleApply}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel={`Apply ${getKeyName(pendingKey)}`}
              testID="measure-key-apply"
            >
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
    maxHeight: 250,
    marginBottom: spacing.md,
  },
  pickerContent: {
    paddingVertical: spacing.xs,
  },
  keyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  keyItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  keyItemText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  keyItemTextSelected: {
    fontWeight: "600",
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
  applyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
  },
});

// =============================================================================
// Export
// =============================================================================

export const MeasureKeySignatureModal = memo(MeasureKeySignatureModalComponent);
