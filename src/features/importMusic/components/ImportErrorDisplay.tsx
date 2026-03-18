/**
 * ImportErrorDisplay Component
 *
 * Displays import errors with user-friendly messages and recovery options.
 */

import React, { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";
import type { ImportError } from "../../../types/import";
import { formatErrorForUser, type FormattedUserError } from "../utils/errors";

// ============================================================================
// Types
// ============================================================================

export interface ImportErrorDisplayProps {
  /** Error to display */
  readonly error: ImportError;
  /** Handler for retry action */
  readonly onRetry?: () => void;
  /** Handler for dismiss action */
  readonly onDismiss?: () => void;
  /** Test ID */
  readonly testID?: string;
}

// ============================================================================
// Component
// ============================================================================

function ImportErrorDisplayComponent({
  error,
  onRetry,
  onDismiss,
  testID = "import-error",
}: ImportErrorDisplayProps): React.ReactElement {
  const formatted: FormattedUserError = formatErrorForUser(error);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.iconContainer}>
        <Feather
          name={error.severity === "warning" ? "alert-triangle" : "x-circle"}
          size={32}
          color={error.severity === "warning" ? colors.warning : colors.error}
        />
      </View>

      <Text style={styles.title}>{formatted.title}</Text>
      <Text style={styles.message}>{formatted.message}</Text>

      {formatted.hint && <Text style={styles.hint}>{formatted.hint}</Text>}

      <View style={styles.actions}>
        {onDismiss && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            testID={`${testID}-dismiss`}
          >
            <Text style={styles.secondaryButtonText}>Dismiss</Text>
          </TouchableOpacity>
        )}

        {formatted.canRetry && onRetry && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            testID={`${testID}-retry`}
          >
            <Feather name="refresh-cw" size={18} color={colors.white} />
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.errorLight,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.errorLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.error,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  hint: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.xs,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  secondaryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textSecondary,
  },
});

// ============================================================================
// Export
// ============================================================================

export const ImportErrorDisplay = memo(ImportErrorDisplayComponent);
