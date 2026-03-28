/**
 * AddPickupModal - Modal for adding a pickup (anacrusis) measure
 *
 * Allows user to specify pickup duration in 0.5 beat increments
 * using up/down buttons.
 */
import React, { useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { modalStyles } from "./modalStyles";
import { colors, spacing } from "../../../../constants";
import type { TimeSignature } from "../../types/tuneComposerTypes";
import { getBeatsPerMeasure } from "../../types/tuneComposerTypes";

export interface AddPickupModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Current time signature (determines max duration) */
  timeSignature: TimeSignature;
  /** Whether a pickup already exists */
  hasPickup: boolean;
  /** Current pickup duration if pickup exists */
  currentPickupDuration?: number;
  /** Called when user confirms with selected duration */
  onConfirm: (duration: number) => void;
  /** Called when user wants to remove existing pickup */
  onRemove: () => void;
  /** Called when user cancels */
  onCancel: () => void;
}

const STEP = 0.5;
const MIN_DURATION = 0.5;

/**
 * Format duration for display
 */
function formatDuration(beats: number): string {
  if (beats === 1) return "1 beat";
  if (beats === Math.floor(beats)) return `${beats} beats`;
  return `${beats} beats`;
}

/**
 * Modal for adding a pickup measure with duration stepper
 */
export function AddPickupModal({
  visible,
  timeSignature,
  hasPickup,
  currentPickupDuration,
  onConfirm,
  onRemove,
  onCancel,
}: AddPickupModalProps): React.ReactElement {
  const beatsPerMeasure = getBeatsPerMeasure(timeSignature);
  const maxDuration = beatsPerMeasure - STEP;

  // Initialize to current duration (if editing) or 1 beat
  const [duration, setDuration] = useState(() => {
    if (currentPickupDuration && currentPickupDuration > 0) {
      return Math.min(currentPickupDuration, maxDuration);
    }
    return Math.min(1, maxDuration);
  });

  const handleIncrease = useCallback(() => {
    setDuration((prev) => Math.min(prev + STEP, maxDuration));
  }, [maxDuration]);

  const handleDecrease = useCallback(() => {
    setDuration((prev) => Math.max(prev - STEP, MIN_DURATION));
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(duration);
  }, [duration, onConfirm]);

  const canIncrease = duration < maxDuration;
  const canDecrease = duration > MIN_DURATION;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.content}>
          <Text style={modalStyles.title}>
            {hasPickup ? "Edit Pickup Measure" : "Add Pickup Measure"}
          </Text>
          <Text style={modalStyles.message}>
            A pickup (anacrusis) is a partial measure before the first full
            measure.
          </Text>

          {/* Duration stepper */}
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={[
                styles.stepperButton,
                !canIncrease && styles.stepperButtonDisabled,
              ]}
              onPress={handleIncrease}
              disabled={!canIncrease}
              testID="pickup-increase"
              accessibilityLabel="Increase pickup duration"
            >
              <Feather
                name="chevron-up"
                size={28}
                color={canIncrease ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>

            <View style={styles.durationDisplay}>
              <Text style={styles.durationText}>{formatDuration(duration)}</Text>
              <Text style={styles.durationSubtext}>
                of {formatDuration(beatsPerMeasure)}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.stepperButton,
                !canDecrease && styles.stepperButtonDisabled,
              ]}
              onPress={handleDecrease}
              disabled={!canDecrease}
              testID="pickup-decrease"
              accessibilityLabel="Decrease pickup duration"
            >
              <Feather
                name="chevron-down"
                size={28}
                color={canDecrease ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Confirm button */}
          <TouchableOpacity
            style={modalStyles.option}
            onPress={handleConfirm}
            testID="pickup-confirm"
          >
            <Text style={modalStyles.optionText}>
              {hasPickup ? "Update Pickup" : "Add Pickup"}
            </Text>
          </TouchableOpacity>

          {/* Remove button (only show if pickup exists) */}
          {hasPickup && (
            <TouchableOpacity
              style={modalStyles.option}
              onPress={onRemove}
              testID="pickup-remove"
            >
              <Text style={[modalStyles.optionText, styles.removeText]}>
                Remove Pickup
              </Text>
            </TouchableOpacity>
          )}

          {/* Cancel button */}
          <TouchableOpacity
            style={modalStyles.cancel}
            onPress={onCancel}
            testID="pickup-cancel"
          >
            <Text style={modalStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  stepperContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  stepperButton: {
    width: 56,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  durationDisplay: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  durationText: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  durationSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  removeText: {
    color: colors.error,
  },
});
