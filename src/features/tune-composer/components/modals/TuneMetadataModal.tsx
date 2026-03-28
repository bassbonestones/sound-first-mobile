/**
 * TuneMetadataModal - Edit metadata for a tune
 *
 * Allows editing title, original key signature, and other metadata
 * stored alongside the MusicXML file.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
} from "react-native";
import { colors, spacing } from "../../../../constants";
import { modalStyles } from "./modalStyles";
import { TuneMetadata, formatFifths } from "../../types/tuneMetadataTypes";

export interface TuneMetadataModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Current metadata values */
  metadata: TuneMetadata;
  /** Called when save is requested */
  onSave: (metadata: TuneMetadata) => void;
  /** Called when modal is dismissed */
  onCancel: () => void;
  /** Whether save is in progress */
  isSaving?: boolean;
}

/**
 * Modal for editing tune metadata
 */
export function TuneMetadataModal({
  visible,
  metadata,
  onSave,
  onCancel,
  isSaving = false,
}: TuneMetadataModalProps): React.ReactElement {
  // Local state for editing
  const [title, setTitle] = useState(metadata.title);
  const [originalFifths, setOriginalFifths] = useState(metadata.originalFifths);
  const [composer, setComposer] = useState(metadata.composer || "");
  const [style, setStyle] = useState(metadata.style || "");
  const [notes, setNotes] = useState(metadata.notes || "");

  // Reset when metadata changes
  useEffect(() => {
    setTitle(metadata.title);
    setOriginalFifths(metadata.originalFifths);
    setComposer(metadata.composer || "");
    setStyle(metadata.style || "");
    setNotes(metadata.notes || "");
  }, [metadata]);

  // Handle save
  const handleSave = useCallback(() => {
    const updatedMetadata: TuneMetadata = {
      ...metadata,
      title: title.trim() || "Untitled Tune",
      originalFifths,
      composer: composer.trim() || undefined,
      style: style.trim() || undefined,
      notes: notes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };
    onSave(updatedMetadata);
  }, [metadata, title, originalFifths, composer, style, notes, onSave]);

  // Handle fifths adjustment
  const handleFifthsChange = useCallback((delta: number) => {
    setOriginalFifths((prev) => Math.max(-7, Math.min(7, prev + delta)));
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => !isSaving && onCancel()}
    >
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.content, styles.modalContent]}>
          <Text style={modalStyles.title}>Tune Metadata</Text>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <View style={styles.field}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter tune title"
                placeholderTextColor={colors.textSecondary}
                editable={!isSaving}
                testID="metadata-title-input"
              />
            </View>

            {/* Original Key Signature */}
            <View style={styles.field}>
              <Text style={styles.label}>Original Key Signature</Text>
              <View style={styles.fifthsStepper}>
                <TouchableOpacity
                  style={[
                    styles.stepperButton,
                    originalFifths <= -7 && styles.stepperButtonDisabled,
                  ]}
                  onPress={() => handleFifthsChange(-1)}
                  disabled={isSaving || originalFifths <= -7}
                  testID="metadata-fifths-minus"
                >
                  <Text style={styles.stepperButtonText}>−</Text>
                </TouchableOpacity>
                <View style={styles.fifthsDisplay}>
                  <Text
                    style={styles.fifthsText}
                    testID="metadata-fifths-value"
                  >
                    {formatFifths(originalFifths)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.stepperButton,
                    originalFifths >= 7 && styles.stepperButtonDisabled,
                  ]}
                  onPress={() => handleFifthsChange(1)}
                  disabled={isSaving || originalFifths >= 7}
                  testID="metadata-fifths-plus"
                >
                  <Text style={styles.stepperButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Composer (optional) */}
            <View style={styles.field}>
              <Text style={styles.label}>Composer / Arranger</Text>
              <TextInput
                style={styles.input}
                value={composer}
                onChangeText={setComposer}
                placeholder="Optional"
                placeholderTextColor={colors.textSecondary}
                editable={!isSaving}
                testID="metadata-composer-input"
              />
            </View>

            {/* Style (optional) */}
            <View style={styles.field}>
              <Text style={styles.label}>Style / Genre</Text>
              <TextInput
                style={styles.input}
                value={style}
                onChangeText={setStyle}
                placeholder="e.g., Folk, Jazz, Classical"
                placeholderTextColor={colors.textSecondary}
                editable={!isSaving}
                testID="metadata-style-input"
              />
            </View>

            {/* Notes (optional) */}
            <View style={styles.field}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any additional notes..."
                placeholderTextColor={colors.textSecondary}
                editable={!isSaving}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                testID="metadata-notes-input"
              />
            </View>
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={modalStyles.cancel}
              onPress={onCancel}
              disabled={isSaving}
            >
              <Text
                style={[
                  modalStyles.cancelText,
                  isSaving && modalStyles.textDisabled,
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text
                style={[
                  styles.saveButtonText,
                  isSaving && modalStyles.textDisabled,
                ]}
              >
                {isSaving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  scrollContent: {
    flexGrow: 0,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  notesInput: {
    minHeight: 80,
  },
  fifthsStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  stepperButtonText: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  fifthsDisplay: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  fifthsText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: colors.border,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
