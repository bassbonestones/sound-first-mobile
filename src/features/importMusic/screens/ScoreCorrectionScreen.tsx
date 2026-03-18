/**
 * ScoreCorrectionScreen
 *
 * Screen for reviewing and correcting imported scores with low confidence.
 * Shows uncertain measures and allows the user to approve, edit, or skip them.
 *
 * Navigation params:
 * - score: The imported score to correct
 * - uncertainMeasures: Measures flagged for review
 * - onComplete: Callback when correction is finished
 */

import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { colors, spacing } from "../../../constants";
import { CorrectionPanel, ScorePreview } from "../components";
import { useCorrection } from "../hooks/useCorrection";
import type { ImportedScore, UncertainMeasure } from "../../../types/import";
import type { CorrectionMeasure } from "../types/correctionTypes";

// ============================================================================
// Types
// ============================================================================

/**
 * Navigation params for ScoreCorrectionScreen
 */
export interface ScoreCorrectionParams {
  /** The imported score to review */
  score: ImportedScore;
  /** Raw MusicXML content for rendering */
  rawMusicXml: string;
  /** Measures flagged for review */
  uncertainMeasures: UncertainMeasure[];
  /** Callback when correction is complete */
  onComplete?: (correctedMeasures: CorrectionMeasure[]) => void;
  /** Callback when user cancels */
  onCancel?: () => void;
}

/**
 * Props for ScoreCorrectionScreen
 */
export type ScoreCorrectionScreenProps = NativeStackScreenProps<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  "ScoreCorrection"
>;

// ============================================================================
// Component
// ============================================================================

export function ScoreCorrectionScreen({
  route,
  navigation,
}: ScoreCorrectionScreenProps): React.ReactElement {
  // Extract params with defaults
  const {
    score,
    rawMusicXml,
    uncertainMeasures = [],
    onComplete,
    onCancel,
  } = (route?.params ?? {}) as Partial<ScoreCorrectionParams>;

  // Set up correction workflow
  const {
    measures,
    progress,
    selectedMeasure,
    isComplete,
    approve,
    edit,
    skip,
    approveAll,
    selectMeasure,
    clearSelection,
    complete,
  } = useCorrection({
    uncertainMeasures: uncertainMeasures,
    onComplete: (correctedMeasures) => {
      onComplete?.(correctedMeasures);
      navigation?.goBack();
    },
  });

  // Compute highlighted measures for preview
  const highlightedMeasures = useMemo(() => {
    // Show currently selected measure or first pending measure
    if (selectedMeasure) {
      return [
        {
          measureNumber: selectedMeasure.measureNumber,
          partIndex: selectedMeasure.partIndex,
          color: "primary" as const,
        },
      ];
    }

    const firstPending = measures.find((m) => m.status === "pending");
    if (firstPending) {
      return [
        {
          measureNumber: firstPending.measureNumber,
          partIndex: firstPending.partIndex,
          color: "warning" as const,
        },
      ];
    }

    return [];
  }, [measures, selectedMeasure]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    onCancel?.();
    navigation?.goBack();
  }, [navigation, onCancel]);

  // Handle done
  const handleDone = useCallback(() => {
    complete();
  }, [complete]);

  // If no score provided, show placeholder
  if (!score || !rawMusicXml) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Score to Review</Text>
          <Text style={styles.emptyMessage}>
            Import a score first, then review if needed.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID="score-correction-screen">
      <StatusBar barStyle="dark-content" />

      {/* Score preview with highlighted measures */}
      <View style={styles.previewSection}>
        <ScorePreview
          musicXml={rawMusicXml}
          highlightMeasures={highlightedMeasures}
          testID="score-correction-preview"
        />
      </View>

      {/* Correction panel */}
      <View style={styles.correctionSection}>
        <CorrectionPanel
          measures={measures}
          progress={progress}
          selectedMeasure={selectedMeasure}
          onApprove={approve}
          onEdit={edit}
          onSkip={skip}
          onApproveAll={approveAll}
          onSelect={selectMeasure}
          onClearSelection={clearSelection}
          onCancel={handleCancel}
          onDone={handleDone}
          isComplete={isComplete}
          testID="score-correction-panel"
        />
      </View>
    </SafeAreaView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  previewSection: {
    flex: 1,
    minHeight: 200,
  },
  correctionSection: {
    flex: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
});

// ============================================================================
// Default export
// ============================================================================

export default ScoreCorrectionScreen;
