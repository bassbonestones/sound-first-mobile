/**
 * MeasureEditModal Component
 *
 * Modal for editing a specific measure during correction workflow.
 * For MVP, this allows adding notes and marking for professional review.
 * Future versions may include actual note editing capabilities.
 */

import React, { memo, useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";
import type { CorrectionMeasure, MeasureEdit } from "../types/correctionTypes";
import {
  getConfidenceSeverity,
  getConfidenceColor,
  formatConfidence,
} from "../types/correctionTypes";
import { ScorePreview, HighlightedMeasure } from "./ScorePreview";

// ============================================================================
// Types
// ============================================================================

export interface MeasureEditModalProps {
  /** Whether the modal is visible */
  readonly visible: boolean;
  /** The measure being edited */
  readonly measure: CorrectionMeasure | null;
  /** MusicXML content for preview */
  readonly musicXml?: string;
  /** Handler when save is pressed */
  readonly onSave: (
    measureNumber: number,
    partIndex: number,
    edit: MeasureEdit,
  ) => void;
  /** Handler when cancel/dismiss is pressed */
  readonly onCancel: () => void;
  /** Handler when approve is pressed (no edits) */
  readonly onApprove?: (measureNumber: number, partIndex: number) => void;
  /** Test ID */
  readonly testID?: string;
}

// ============================================================================
// Sub-components
// ============================================================================

interface MeasureInfoHeaderProps {
  readonly measure: CorrectionMeasure;
  readonly testID?: string;
}

const MeasureInfoHeader = memo(function MeasureInfoHeader({
  measure,
  testID,
}: MeasureInfoHeaderProps): React.ReactElement {
  const severity = getConfidenceSeverity(measure.confidence);
  const severityColor = getConfidenceColor(severity);

  return (
    <View style={styles.measureInfoHeader} testID={testID}>
      <View style={styles.measureTitleRow}>
        <Text style={styles.measureTitle}>
          Measure {measure.measureNumber}
          {measure.partIndex > 0 && (
            <Text style={styles.partText}> (Part {measure.partIndex + 1})</Text>
          )}
        </Text>
        <View
          style={[styles.confidenceBadge, { backgroundColor: severityColor }]}
        >
          <Text style={styles.confidenceText}>
            {formatConfidence(measure.confidence)} confidence
          </Text>
        </View>
      </View>
      <Text style={styles.reasonText}>{measure.reason}</Text>
    </View>
  );
});

// ============================================================================
// Main Component
// ============================================================================

function MeasureEditModalComponent({
  visible,
  measure,
  musicXml,
  onSave,
  onCancel,
  onApprove,
  testID = "measure-edit-modal",
}: MeasureEditModalProps): React.ReactElement {
  // Local state for edit form
  const [notes, setNotes] = useState("");
  const [needsReview, setNeedsReview] = useState(false);

  // Reset form when measure changes
  React.useEffect(() => {
    if (measure) {
      setNotes(measure.notes ?? "");
      setNeedsReview(false);
    }
  }, [measure]);

  // Highlighted measure for preview
  const highlightMeasures: HighlightedMeasure[] = useMemo(() => {
    if (!measure) return [];
    return [
      {
        measureNumber: measure.measureNumber,
        partIndex: measure.partIndex,
        color: "#FFA726",
        confidence: measure.confidence,
      },
    ];
  }, [measure]);

  // Handlers
  const handleSave = useCallback(() => {
    if (!measure) return;
    const edit: MeasureEdit = {
      notes: notes.trim() || undefined,
      needsReview,
    };
    onSave(measure.measureNumber, measure.partIndex, edit);
  }, [measure, notes, needsReview, onSave]);

  const handleApprove = useCallback(() => {
    if (!measure || !onApprove) return;
    onApprove(measure.measureNumber, measure.partIndex);
  }, [measure, onApprove]);

  const handleCancel = useCallback(() => {
    setNotes("");
    setNeedsReview(false);
    onCancel();
  }, [onCancel]);

  // Don't render if no measure
  if (!measure) {
    return (
      <Modal visible={false} testID={testID}>
        <View />
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
      testID={testID}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleCancel}
            accessibilityLabel="Cancel editing"
            accessibilityRole="button"
            testID={`${testID}-cancel`}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Edit Measure</Text>

          <TouchableOpacity
            onPress={handleSave}
            accessibilityLabel="Save changes"
            accessibilityRole="button"
            testID={`${testID}-save`}
          >
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Measure Info */}
          <MeasureInfoHeader
            measure={measure}
            testID={`${testID}-measure-info`}
          />

          {/* Score Preview (if musicXml provided) */}
          {musicXml && (
            <View style={styles.previewContainer}>
              <Text style={styles.sectionTitle}>Preview</Text>
              <ScorePreview
                musicXml={musicXml}
                highlightMeasures={highlightMeasures}
                height={200}
                initialZoom={1.5}
                showZoomControls={false}
                testID={`${testID}-preview`}
              />
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>

            {onApprove && (
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={handleApprove}
                accessibilityLabel="Approve this measure as correct"
                accessibilityRole="button"
                testID={`${testID}-quick-approve`}
              >
                <Feather name="check-circle" size={20} color="#388E3C" />
                <View style={styles.quickActionContent}>
                  <Text style={styles.quickActionTitle}>Looks Correct</Text>
                  <Text style={styles.quickActionDesc}>
                    Approve this measure without changes
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Notes Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Correction Notes</Text>
            <Text style={styles.sectionDesc}>
              Add notes about what needs to be fixed in this measure.
            </Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g., 'Quarter rest should be eighth rest'"
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              accessibilityLabel="Correction notes"
              accessibilityHint="Enter notes about what needs to be corrected"
              testID={`${testID}-notes-input`}
            />
          </View>

          {/* Professional Review Toggle */}
          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>
                  Request Professional Review
                </Text>
                <Text style={styles.toggleDesc}>
                  Flag this measure for review by a music educator
                </Text>
              </View>
              <Switch
                value={needsReview}
                onValueChange={setNeedsReview}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="white"
                accessibilityLabel="Request professional review"
                accessibilityRole="switch"
                accessibilityState={{ checked: needsReview }}
                testID={`${testID}-needs-review-toggle`}
              />
            </View>
          </View>

          {/* Future Note */}
          <View style={styles.futureNote}>
            <Feather name="info" size={16} color={colors.textTertiary} />
            <Text style={styles.futureNoteText}>
              Direct note editing coming soon! For now, add notes describing the
              needed corrections.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
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
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  cancelText: {
    fontSize: 17,
    color: colors.textSecondary,
  },
  saveText: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  measureInfoHeader: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  measureTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  measureTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  partText: {
    fontSize: 16,
    fontWeight: "400",
    color: colors.textSecondary,
  },
  confidenceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  reasonText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  previewContainer: {
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  notesInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 100,
  },
  quickActions: {
    marginBottom: spacing.md,
  },
  quickActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  quickActionDesc: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  toggleDesc: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  futureNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: `${colors.primary}14`,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  futureNoteText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export const MeasureEditModal = memo(MeasureEditModalComponent);
