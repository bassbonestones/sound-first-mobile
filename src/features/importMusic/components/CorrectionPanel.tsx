/**
 * CorrectionPanel Component
 *
 * Displays all uncertain measures for review in a scrollable panel.
 * Shows progress, provides bulk actions, and coordinates the correction workflow.
 */

import React, { memo, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  AccessibilityInfo,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";
import type {
  CorrectionMeasure,
  CorrectionProgress,
  MeasureEdit,
} from "../types/correctionTypes";
import { MeasureCorrectionCard } from "./MeasureCorrectionCard";

// ============================================================================
// Types
// ============================================================================

export interface CorrectionPanelProps {
  /** Measures requiring correction */
  readonly measures: readonly CorrectionMeasure[];
  /** MusicXML content for preview (optional) */
  readonly musicXml?: string;
  /** Handler when a measure is approved */
  readonly onApprove?: (measureNumber: number, partIndex: number) => void;
  /** Handler when a measure is edited */
  readonly onEdit?: (
    measureNumber: number,
    partIndex: number,
    edit: MeasureEdit,
  ) => void;
  /** Handler when a measure is skipped */
  readonly onSkip?: (measureNumber: number, partIndex: number) => void;
  /** Handler when all measures are approved */
  readonly onApproveAll?: () => void;
  /** Handler when user is done reviewing */
  readonly onComplete?: () => void;
  /** Handler when user cancels */
  readonly onCancel?: () => void;
  /** Handler when measure is selected for editing */
  readonly onSelectMeasure?: (measureNumber: number, partIndex: number) => void;
  /** Currently selected measure (for preview highlighting) */
  readonly selectedMeasure?: {
    measureNumber: number;
    partIndex: number;
  } | null;
  /** Whether the panel is loading */
  readonly isLoading?: boolean;
  /** Test ID */
  readonly testID?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateProgress(
  measures: readonly CorrectionMeasure[],
): CorrectionProgress {
  const total = measures.length;
  const reviewed = measures.filter((m) => m.status !== "pending").length;
  const approved = measures.filter((m) => m.status === "approved").length;
  const edited = measures.filter((m) => m.status === "edited").length;
  const skipped = measures.filter((m) => m.status === "skipped").length;
  const percentComplete = total > 0 ? Math.round((reviewed / total) * 100) : 0;

  return { total, reviewed, approved, edited, skipped, percentComplete };
}

// ============================================================================
// Sub-components
// ============================================================================

interface ProgressHeaderProps {
  readonly progress: CorrectionProgress;
  readonly testID?: string;
}

const ProgressHeader = memo(function ProgressHeader({
  progress,
  testID,
}: ProgressHeaderProps): React.ReactElement {
  const { total, reviewed, approved, edited, skipped, percentComplete } =
    progress;

  const accessibilityLabel = useMemo(
    () =>
      `Progress: ${reviewed} of ${total} measures reviewed. ${approved} approved, ${edited} edited, ${skipped} skipped.`,
    [total, reviewed, approved, edited, skipped],
  );

  return (
    <View
      style={styles.progressHeader}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: percentComplete,
        text: `${percentComplete}% complete`,
      }}
      testID={testID}
    >
      <View style={styles.progressInfo}>
        <Text style={styles.progressTitle}>
          {reviewed} of {total} Reviewed
        </Text>
        <Text style={styles.progressPercent}>{percentComplete}%</Text>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[styles.progressFill, { width: `${percentComplete}%` }]}
          testID={`${testID}-fill`}
        />
      </View>

      <View style={styles.progressStats}>
        <View style={styles.statItem}>
          <View style={[styles.statDot, styles.statDotApproved]} />
          <Text style={styles.statText}>{approved} Approved</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, styles.statDotEdited]} />
          <Text style={styles.statText}>{edited} Edited</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, styles.statDotSkipped]} />
          <Text style={styles.statText}>{skipped} Skipped</Text>
        </View>
      </View>
    </View>
  );
});

interface BulkActionsProps {
  readonly onApproveAll: () => void;
  readonly onComplete: () => void;
  readonly hasPending: boolean;
  readonly allReviewed: boolean;
  readonly disabled?: boolean;
  readonly testID?: string;
}

const BulkActions = memo(function BulkActions({
  onApproveAll,
  onComplete,
  hasPending,
  allReviewed,
  disabled,
  testID,
}: BulkActionsProps): React.ReactElement {
  return (
    <View style={styles.bulkActions} testID={testID}>
      {hasPending && (
        <TouchableOpacity
          style={[styles.bulkButton, styles.bulkButtonSecondary]}
          onPress={onApproveAll}
          disabled={disabled}
          accessibilityLabel="Approve all remaining measures"
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          testID={`${testID}-approve-all`}
        >
          <Feather name="check-circle" size={18} color={colors.primary} />
          <Text style={styles.bulkButtonTextSecondary}>Approve All</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[
          styles.bulkButton,
          styles.bulkButtonPrimary,
          !allReviewed && styles.bulkButtonDisabled,
        ]}
        onPress={onComplete}
        disabled={disabled || !allReviewed}
        accessibilityLabel={
          allReviewed ? "Complete review" : "Review all measures to continue"
        }
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || !allReviewed }}
        testID={`${testID}-complete`}
      >
        <Text style={styles.bulkButtonTextPrimary}>
          {allReviewed ? "Done" : "Review All to Continue"}
        </Text>
        <Feather name="arrow-right" size={18} color="white" />
      </TouchableOpacity>
    </View>
  );
});

interface EmptyStateProps {
  readonly testID?: string;
}

const EmptyState = memo(function EmptyState({
  testID,
}: EmptyStateProps): React.ReactElement {
  return (
    <View
      style={styles.emptyState}
      accessibilityLabel="No uncertain measures found"
      testID={testID}
    >
      <Feather name="check-circle" size={48} color="#388E3C" />
      <Text style={styles.emptyTitle}>Looking Good!</Text>
      <Text style={styles.emptyText}>
        No measures flagged as uncertain. Your score is ready to use.
      </Text>
    </View>
  );
});

// ============================================================================
// Main Component
// ============================================================================

function CorrectionPanelComponent({
  measures,
  onApprove,
  onEdit: _onEdit,
  onSkip,
  onApproveAll,
  onComplete,
  onCancel,
  onSelectMeasure,
  selectedMeasure,
  isLoading = false,
  testID = "correction-panel",
}: CorrectionPanelProps): React.ReactElement {
  // Calculate progress
  const progress = useMemo(() => calculateProgress(measures), [measures]);
  const hasPending = progress.reviewed < progress.total;
  const allReviewed = progress.reviewed === progress.total;

  // Handlers
  const handleApprove = useCallback(
    (measureNumber: number, partIndex: number) => {
      onApprove?.(measureNumber, partIndex);
    },
    [onApprove],
  );

  const handleEdit = useCallback(
    (measureNumber: number, partIndex: number) => {
      onSelectMeasure?.(measureNumber, partIndex);
    },
    [onSelectMeasure],
  );

  const handleSkip = useCallback(
    (measureNumber: number, partIndex: number) => {
      onSkip?.(measureNumber, partIndex);
    },
    [onSkip],
  );

  const handleSelectMeasure = useCallback(
    (measureNumber: number, partIndex: number) => {
      onSelectMeasure?.(measureNumber, partIndex);
    },
    [onSelectMeasure],
  );

  const handleApproveAll = useCallback(() => {
    onApproveAll?.();
    AccessibilityInfo.announceForAccessibility(
      `All ${progress.total - progress.reviewed} remaining measures approved`,
    );
  }, [onApproveAll, progress]);

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  // Group measures by status for better UX
  const { pendingMeasures, reviewedMeasures } = useMemo(() => {
    const pending: CorrectionMeasure[] = [];
    const reviewed: CorrectionMeasure[] = [];

    for (const measure of measures) {
      if (measure.status === "pending") {
        pending.push(measure);
      } else {
        reviewed.push(measure);
      }
    }

    return { pendingMeasures: pending, reviewedMeasures: reviewed };
  }, [measures]);

  // Empty state
  if (measures.length === 0) {
    return (
      <View style={styles.container} testID={testID}>
        <EmptyState testID={`${testID}-empty`} />
      </View>
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      {/* Header with Cancel */}
      <View style={styles.header}>
        <Text style={styles.title}>Review Uncertain Measures</Text>
        {onCancel && (
          <TouchableOpacity
            onPress={onCancel}
            accessibilityLabel="Cancel review"
            accessibilityRole="button"
            testID={`${testID}-cancel`}
          >
            <Feather name="x" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Progress indicator */}
      <ProgressHeader progress={progress} testID={`${testID}-progress`} />

      {/* Measure list */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
        testID={`${testID}-list`}
      >
        {/* Pending measures first */}
        {pendingMeasures.length > 0 && (
          <View testID={`${testID}-pending-section`}>
            <Text style={styles.sectionTitle}>Needs Review</Text>
            {pendingMeasures.map((measure) => (
              <MeasureCorrectionCard
                key={`${measure.measureNumber}-${measure.partIndex}`}
                measure={measure}
                isActive={
                  selectedMeasure?.measureNumber === measure.measureNumber &&
                  selectedMeasure?.partIndex === measure.partIndex
                }
                onApprove={handleApprove}
                onEdit={handleEdit}
                onSkip={handleSkip}
                onPress={handleSelectMeasure}
                disabled={isLoading}
                testID={`${testID}-card-${measure.measureNumber}-${measure.partIndex}`}
              />
            ))}
          </View>
        )}

        {/* Reviewed measures */}
        {reviewedMeasures.length > 0 && (
          <View testID={`${testID}-reviewed-section`}>
            <Text style={styles.sectionTitle}>Reviewed</Text>
            {reviewedMeasures.map((measure) => (
              <MeasureCorrectionCard
                key={`${measure.measureNumber}-${measure.partIndex}`}
                measure={measure}
                isActive={
                  selectedMeasure?.measureNumber === measure.measureNumber &&
                  selectedMeasure?.partIndex === measure.partIndex
                }
                onPress={handleSelectMeasure}
                disabled={isLoading}
                testID={`${testID}-card-${measure.measureNumber}-${measure.partIndex}`}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bulk actions */}
      <BulkActions
        onApproveAll={handleApproveAll}
        onComplete={handleComplete}
        hasPending={hasPending}
        allReviewed={allReviewed}
        disabled={isLoading}
        testID={`${testID}-bulk-actions`}
      />
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  progressHeader: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressStats: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: spacing.md,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statDotApproved: {
    backgroundColor: "#388E3C",
  },
  statDotEdited: {
    backgroundColor: colors.primary,
  },
  statDotSkipped: {
    backgroundColor: colors.textSecondary,
  },
  statText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  bulkActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bulkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    minHeight: 44,
  },
  bulkButtonPrimary: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  bulkButtonSecondary: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  bulkButtonDisabled: {
    backgroundColor: colors.textDisabled,
  },
  bulkButtonTextPrimary: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
  },
  bulkButtonTextSecondary: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});

export const CorrectionPanel = memo(CorrectionPanelComponent);
