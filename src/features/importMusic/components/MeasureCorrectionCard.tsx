/**
 * MeasureCorrectionCard Component
 *
 * Displays a single uncertain measure for review during the correction workflow.
 * Shows confidence indicator, issue description, and action buttons.
 */

import React, { memo, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AccessibilityInfo,
  ViewStyle,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";
import type { CorrectionMeasure } from "../types/correctionTypes";
import {
  getConfidenceSeverity,
  getConfidenceColor,
  formatConfidence,
} from "../types/correctionTypes";

// ============================================================================
// Types
// ============================================================================

export interface MeasureCorrectionCardProps {
  /** The measure data to display */
  readonly measure: CorrectionMeasure;
  /** Whether this card is currently selected/active */
  readonly isActive?: boolean;
  /** Handler when user approves the measure as-is */
  readonly onApprove?: (measureNumber: number, partIndex: number) => void;
  /** Handler when user wants to edit the measure */
  readonly onEdit?: (measureNumber: number, partIndex: number) => void;
  /** Handler when user skips the measure */
  readonly onSkip?: (measureNumber: number, partIndex: number) => void;
  /** Handler when card is tapped (for selection) */
  readonly onPress?: (measureNumber: number, partIndex: number) => void;
  /** Whether action buttons are disabled */
  readonly disabled?: boolean;
  /** Test ID */
  readonly testID?: string;
}

// ============================================================================
// Sub-components
// ============================================================================

interface ConfidenceBadgeProps {
  readonly confidence: number;
  readonly testID?: string;
}

const ConfidenceBadge = memo(function ConfidenceBadge({
  confidence,
  testID,
}: ConfidenceBadgeProps): React.ReactElement {
  const severity = useMemo(
    () => getConfidenceSeverity(confidence),
    [confidence],
  );
  const badgeColor = useMemo(() => getConfidenceColor(severity), [severity]);
  const confidenceText = useMemo(
    () => formatConfidence(confidence),
    [confidence],
  );

  const accessibilityLabel = useMemo(() => {
    const severityText =
      severity === "low" ? "low" : severity === "medium" ? "medium" : "high";
    return `Confidence ${confidenceText}, ${severityText} confidence`;
  }, [confidenceText, severity]);

  return (
    <View
      style={[styles.confidenceBadge, { backgroundColor: badgeColor }]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="text"
      testID={testID}
    >
      <Text style={styles.confidenceText}>{confidenceText}</Text>
    </View>
  );
});

interface ActionButtonProps {
  readonly icon: keyof typeof Feather.glyphMap;
  readonly label: string;
  readonly onPress: () => void;
  readonly variant: "approve" | "edit" | "skip";
  readonly disabled?: boolean;
  readonly testID?: string;
}

const ActionButton = memo(function ActionButton({
  icon,
  label,
  onPress,
  variant,
  disabled,
  testID,
}: ActionButtonProps): React.ReactElement {
  const buttonStyle = useMemo((): ViewStyle[] => {
    const base: ViewStyle[] = [styles.actionButton];
    if (disabled) {
      base.push(styles.actionButtonDisabled);
    } else {
      switch (variant) {
        case "approve":
          base.push(styles.actionButtonApprove);
          break;
        case "edit":
          base.push(styles.actionButtonEdit);
          break;
        case "skip":
          base.push(styles.actionButtonSkip);
          break;
      }
    }
    return base;
  }, [variant, disabled]);

  const iconColor = useMemo(() => {
    if (disabled) return colors.textDisabled;
    switch (variant) {
      case "approve":
        return "#388E3C";
      case "edit":
        return colors.primary;
      case "skip":
        return colors.textSecondary;
    }
  }, [variant, disabled]);

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      testID={testID}
    >
      <Feather name={icon} size={18} color={iconColor} />
      <Text
        style={[
          styles.actionButtonText,
          { color: iconColor },
          disabled && styles.actionButtonTextDisabled,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
});

// ============================================================================
// Main Component
// ============================================================================

function MeasureCorrectionCardComponent({
  measure,
  isActive = false,
  onApprove,
  onEdit,
  onSkip,
  onPress,
  disabled = false,
  testID = "measure-correction-card",
}: MeasureCorrectionCardProps): React.ReactElement {
  const { measureNumber, partIndex, confidence, reason, status } = measure;

  // Status indicator
  const statusInfo = useMemo(() => {
    switch (status) {
      case "approved":
        return {
          icon: "check-circle" as const,
          color: "#388E3C",
          text: "Approved",
        };
      case "edited":
        return {
          icon: "edit-2" as const,
          color: colors.primary,
          text: "Edited",
        };
      case "skipped":
        return {
          icon: "skip-forward" as const,
          color: colors.textSecondary,
          text: "Skipped",
        };
      default:
        return null;
    }
  }, [status]);

  // Handlers
  const handleApprove = useCallback(() => {
    onApprove?.(measureNumber, partIndex);
    AccessibilityInfo.announceForAccessibility(
      `Measure ${measureNumber} approved`,
    );
  }, [measureNumber, partIndex, onApprove]);

  const handleEdit = useCallback(() => {
    onEdit?.(measureNumber, partIndex);
  }, [measureNumber, partIndex, onEdit]);

  const handleSkip = useCallback(() => {
    onSkip?.(measureNumber, partIndex);
    AccessibilityInfo.announceForAccessibility(
      `Measure ${measureNumber} skipped`,
    );
  }, [measureNumber, partIndex, onSkip]);

  const handlePress = useCallback(() => {
    onPress?.(measureNumber, partIndex);
  }, [measureNumber, partIndex, onPress]);

  // Card accessibility
  const cardAccessibilityLabel = useMemo(() => {
    let label = `Measure ${measureNumber}`;
    if (partIndex > 0) {
      label += `, part ${partIndex + 1}`;
    }
    label += `. Confidence ${formatConfidence(confidence)}. ${reason}`;
    if (statusInfo) {
      label += `. Status: ${statusInfo.text}`;
    }
    return label;
  }, [measureNumber, partIndex, confidence, reason, statusInfo]);

  const isPending = status === "pending";

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isActive && styles.cardActive,
        !isPending && styles.cardReviewed,
      ]}
      onPress={handlePress}
      disabled={!onPress}
      accessibilityLabel={cardAccessibilityLabel}
      accessibilityRole="button"
      accessibilityHint="Tap to select this measure for review"
      testID={testID}
    >
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.measureInfo}>
          <Text style={styles.measureNumber}>
            Measure {measureNumber}
            {partIndex > 0 && (
              <Text style={styles.partIndex}> (Part {partIndex + 1})</Text>
            )}
          </Text>
          <ConfidenceBadge
            confidence={confidence}
            testID={`${testID}-confidence`}
          />
        </View>

        {statusInfo && (
          <View
            style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}
            accessibilityLabel={`Status: ${statusInfo.text}`}
            testID={`${testID}-status`}
          >
            <Feather name={statusInfo.icon} size={12} color="white" />
            <Text style={styles.statusText}>{statusInfo.text}</Text>
          </View>
        )}
      </View>

      {/* Reason */}
      <Text
        style={styles.reason}
        numberOfLines={2}
        accessibilityLabel={`Issue: ${reason}`}
        testID={`${testID}-reason`}
      >
        {reason}
      </Text>

      {/* Action Buttons (only for pending measures) */}
      {isPending && (
        <View style={styles.actions} testID={`${testID}-actions`}>
          <ActionButton
            icon="check"
            label="Looks Good"
            onPress={handleApprove}
            variant="approve"
            disabled={disabled}
            testID={`${testID}-approve`}
          />
          <ActionButton
            icon="edit-2"
            label="Edit"
            onPress={handleEdit}
            variant="edit"
            disabled={disabled}
            testID={`${testID}-edit`}
          />
          <ActionButton
            icon="skip-forward"
            label="Skip"
            onPress={handleSkip}
            variant="skip"
            disabled={disabled}
            testID={`${testID}-skip`}
          />
        </View>
      )}

      {/* Notes (if edited) */}
      {measure.notes && (
        <View style={styles.notesContainer} testID={`${testID}-notes`}>
          <Feather
            name="message-square"
            size={14}
            color={colors.textTertiary}
          />
          <Text style={styles.notesText} numberOfLines={1}>
            {measure.notes}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardActive: {
    borderColor: colors.primary,
    borderWidth: 2,
    ...Platform.select({
      web: { boxShadow: `0px 2px 4px rgba(0, 122, 255, 0.1)` },
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  cardReviewed: {
    opacity: 0.8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  measureInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  measureNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  partIndex: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textSecondary,
  },
  confidenceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "white",
  },
  reason: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  actionButtonDisabled: {
    opacity: 0.5,
    borderColor: colors.border,
  },
  actionButtonApprove: {
    borderColor: "#388E3C",
    backgroundColor: "rgba(56, 142, 60, 0.08)",
  },
  actionButtonEdit: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}14`,
  },
  actionButtonSkip: {
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  actionButtonTextDisabled: {
    color: colors.textDisabled,
  },
  notesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: colors.textTertiary,
    fontStyle: "italic",
  },
});

export const MeasureCorrectionCard = memo(MeasureCorrectionCardComponent);
