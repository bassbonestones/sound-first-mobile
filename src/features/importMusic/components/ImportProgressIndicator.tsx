/**
 * ImportProgressIndicator Component
 *
 * Displays import progress with status message and progress bar.
 */

import React, { memo, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";
// STATUS_MESSAGES available in constants/import if needed
import type {
  ImportJobStatus,
  ImportJobStatusType,
} from "../../../types/import";

// ============================================================================
// Types
// ============================================================================

export interface ImportProgressIndicatorProps {
  /** Current import status */
  readonly status: ImportJobStatus;
  /** Handler for cancel action */
  readonly onCancel?: () => void;
  /** Test ID */
  readonly testID?: string;
}

// ============================================================================
// Component
// ============================================================================

function ImportProgressIndicatorComponent({
  status,
  onCancel,
  testID = "import-progress",
}: ImportProgressIndicatorProps): React.ReactElement {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animate progress bar
  useEffect(() => {
    if (status.progress !== null) {
      Animated.timing(progressAnim, {
        toValue: status.progress / 100,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [status.progress, progressAnim]);

  // Pulse animation for indeterminate progress
  useEffect(() => {
    if (status.progress === null && isActiveStatus(status.status)) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [status.progress, status.status, pulseAnim]);

  const statusIcon = getStatusIcon(status.status);
  const statusColor = getStatusColor(status.status);
  const canCancel = isActiveStatus(status.status);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <View style={styles.statusInfo}>
          {isActiveStatus(status.status) ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              testID={`${testID}-spinner`}
            />
          ) : (
            <Feather name={statusIcon} size={20} color={statusColor} />
          )}
          <Text
            style={[styles.statusText, { color: statusColor }]}
            accessibilityRole="text"
            accessibilityLabel={`Import status: ${status.message}`}
          >
            {status.message}
          </Text>
        </View>

        {canCancel && onCancel && (
          <TouchableOpacity
            onPress={onCancel}
            style={styles.cancelButton}
            accessibilityRole="button"
            accessibilityLabel="Cancel import"
            testID={`${testID}-cancel`}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          {status.progress !== null ? (
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          ) : (
            <Animated.View
              style={[styles.progressIndeterminate, { opacity: pulseAnim }]}
            />
          )}
        </View>
        {status.progress !== null && (
          <Text style={styles.progressText}>
            {Math.round(status.progress)}%
          </Text>
        )}
      </View>

      {/* Current file info */}
      {status.status !== "idle" &&
        status.status !== "succeeded" &&
        status.status !== "failed" && (
          <Text style={styles.detailText}>{getDetailText(status.status)}</Text>
        )}
    </View>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function isActiveStatus(status: ImportJobStatusType): boolean {
  return (
    status === "acquiring" ||
    status === "validating" ||
    status === "uploading" ||
    status === "parsing" ||
    status === "omr_processing" ||
    status === "omr_polling" ||
    status === "normalizing"
  );
}

function getStatusIcon(
  status: ImportJobStatusType,
): keyof typeof Feather.glyphMap {
  switch (status) {
    case "succeeded":
      return "check-circle";
    case "failed":
      return "x-circle";
    case "canceled":
      return "x-circle";
    default:
      return "loader";
  }
}

function getStatusColor(status: ImportJobStatusType): string {
  switch (status) {
    case "succeeded":
      return colors.success;
    case "failed":
    case "canceled":
      return colors.error;
    default:
      return colors.primary;
  }
}

function getDetailText(status: ImportJobStatusType): string {
  switch (status) {
    case "acquiring":
      return "Accessing file...";
    case "validating":
      return "Checking file format and size...";
    case "uploading":
      return "This may take a moment depending on your connection...";
    case "parsing":
      return "Reading musical content...";
    case "omr_processing":
    case "omr_polling":
      return "This may take up to a minute for complex scores...";
    case "normalizing":
      return "Almost done...";
    default:
      return "";
  }
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  statusInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  cancelText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: "500",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressIndeterminate: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    minWidth: 36,
    textAlign: "right",
  },
  detailText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
});

// ============================================================================
// Export
// ============================================================================

export const ImportProgressIndicator = memo(ImportProgressIndicatorComponent);
