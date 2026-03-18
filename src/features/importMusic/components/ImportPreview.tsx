/**
 * ImportPreview Component
 *
 * Displays a preview of an imported score with metadata and stats.
 */

import React, { memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";
import type {
  ImportPreviewModel,
  ImportValidationIssue,
} from "../../../types/import";

// ============================================================================
// Types
// ============================================================================

export interface ImportPreviewProps {
  /** Preview model to display */
  readonly preview: ImportPreviewModel;
  /** Validation issues to show */
  readonly validationIssues?: ImportValidationIssue[];
  /** Handler for primary action (e.g., continue to editor) */
  readonly onContinue?: () => void;
  /** Handler for review action (when review is needed) */
  readonly onReview?: () => void;
  /** Handler for dismiss/cancel */
  readonly onDismiss?: () => void;
  /** Test ID */
  readonly testID?: string;
}

// ============================================================================
// Component
// ============================================================================

function ImportPreviewComponent({
  preview,
  validationIssues = [],
  onContinue,
  onReview,
  onDismiss,
  testID = "import-preview",
}: ImportPreviewProps): React.ReactElement {
  const _hasWarnings =
    validationIssues.filter((i) => i.severity === "warning").length > 0;
  const hasErrors =
    validationIssues.filter((i) => i.severity === "error").length > 0;

  return (
    <View style={styles.container} testID={testID}>
      {/* Success header */}
      <View style={styles.successHeader}>
        <View style={styles.successIconContainer}>
          <Feather name="check-circle" size={32} color={colors.success} />
        </View>
        <Text style={styles.successTitle}>Import Successful!</Text>
      </View>

      {/* Score info */}
      <View style={styles.scoreInfo}>
        <Text style={styles.scoreTitle} numberOfLines={2}>
          {preview.title}
        </Text>
        {preview.subtitle && (
          <Text style={styles.scoreSubtitle} numberOfLines={1}>
            {preview.subtitle}
          </Text>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <StatItem
          icon="hash"
          label="Measures"
          value={preview.stats.measureCount.toString()}
          testID={`${testID}-stat-measures`}
        />
        <StatItem
          icon="layers"
          label="Parts"
          value={preview.stats.partCount.toString()}
          testID={`${testID}-stat-parts`}
        />
        {preview.stats.timeSignature && (
          <StatItem
            icon="clock"
            label="Time"
            value={preview.stats.timeSignature}
            testID={`${testID}-stat-time`}
          />
        )}
        {preview.stats.keySignature && (
          <StatItem
            icon="key"
            label="Key"
            value={preview.stats.keySignature}
            testID={`${testID}-stat-key`}
          />
        )}
        {preview.stats.tempo && (
          <StatItem
            icon="activity"
            label="Tempo"
            value={preview.stats.tempo}
            testID={`${testID}-stat-tempo`}
          />
        )}
      </View>

      {/* Review notice */}
      {preview.needsReview && (
        <View style={styles.reviewNotice}>
          <Feather name="alert-triangle" size={20} color={colors.warning} />
          <View style={styles.reviewNoticeText}>
            <Text style={styles.reviewNoticeTitle}>Review Recommended</Text>
            {preview.reviewReasons.map((reason, index) => (
              <Text key={index} style={styles.reviewNoticeReason}>
                • {reason}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Validation issues */}
      {validationIssues.length > 0 && (
        <View style={styles.issuesContainer}>
          <Text style={styles.issuesTitle}>
            {hasErrors ? "Issues Found" : "Notes"}
          </Text>
          <ScrollView style={styles.issuesList} nestedScrollEnabled>
            {validationIssues.slice(0, 5).map((issue, index) => (
              <ValidationIssueItem key={index} issue={issue} />
            ))}
            {validationIssues.length > 5 && (
              <Text style={styles.issuesMore}>
                +{validationIssues.length - 5} more
              </Text>
            )}
          </ScrollView>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {onDismiss && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Start over"
            testID={`${testID}-dismiss`}
          >
            <Text style={styles.secondaryButtonText}>Start Over</Text>
          </TouchableOpacity>
        )}

        {preview.needsReview && onReview ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onReview}
            accessibilityRole="button"
            accessibilityLabel="Review score"
            testID={`${testID}-review`}
          >
            <Text style={styles.primaryButtonText}>Review Score</Text>
            <Feather name="edit-3" size={18} color={colors.white} />
          </TouchableOpacity>
        ) : (
          onContinue && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onContinue}
              accessibilityRole="button"
              accessibilityLabel="Continue"
              testID={`${testID}-continue`}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
              <Feather name="arrow-right" size={18} color={colors.white} />
            </TouchableOpacity>
          )
        )}
      </View>
    </View>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface StatItemProps {
  readonly icon: keyof typeof Feather.glyphMap;
  readonly label: string;
  readonly value: string;
  readonly testID?: string;
}

function StatItem({
  icon,
  label,
  value,
  testID,
}: StatItemProps): React.ReactElement {
  return (
    <View style={styles.statItem} testID={testID}>
      <Feather name={icon} size={14} color={colors.textTertiary} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

interface ValidationIssueItemProps {
  readonly issue: ImportValidationIssue;
}

function ValidationIssueItem({
  issue,
}: ValidationIssueItemProps): React.ReactElement {
  const iconName =
    issue.severity === "error"
      ? "x-circle"
      : issue.severity === "warning"
        ? "alert-circle"
        : "info";

  const iconColor =
    issue.severity === "error"
      ? colors.error
      : issue.severity === "warning"
        ? colors.warning
        : colors.textTertiary;

  return (
    <View style={styles.issueItem}>
      <Feather name={iconName} size={14} color={iconColor} />
      <Text style={styles.issueMessage}>{issue.message}</Text>
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  successHeader: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  successIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.successLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.success,
  },
  scoreInfo: {
    alignItems: "center",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  scoreTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  scoreSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  statValue: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  reviewNotice: {
    flexDirection: "row",
    backgroundColor: colors.warningLight,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  reviewNoticeText: {
    flex: 1,
  },
  reviewNoticeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  reviewNoticeReason: {
    fontSize: 13,
    color: colors.warning,
    lineHeight: 18,
  },
  issuesContainer: {
    marginBottom: spacing.lg,
  },
  issuesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  issuesList: {
    maxHeight: 120,
  },
  issueItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  issueMessage: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  issuesMore: {
    fontSize: 12,
    color: colors.textTertiary,
    fontStyle: "italic",
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
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

export const ImportPreview = memo(ImportPreviewComponent);
