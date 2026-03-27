/**
 * SaveNewFileModal - Input for saving a new tune file
 *
 * Prompts user for filename when saving a new composition.
 */
import React from "react";
import {
  Modal,
  Pressable,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { colors, spacing } from "../../../../constants";
import { modalStyles } from "./modalStyles";

export interface SaveNewFileModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Current filename value */
  filename: string;
  /** Called when filename changes */
  onFilenameChange: (filename: string) => void;
  /** Whether save is in progress */
  isSaving: boolean;
  /** Called when user confirms save */
  onConfirm: () => void;
  /** Called when user cancels */
  onCancel: () => void;
}

/**
 * Modal for entering a filename when saving a new tune
 */
export function SaveNewFileModal({
  visible,
  filename,
  onFilenameChange,
  isSaving,
  onConfirm,
  onCancel,
}: SaveNewFileModalProps): React.ReactElement {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => !isSaving && onCancel()}
    >
      <Pressable
        style={modalStyles.overlay}
        onPress={() => !isSaving && onCancel()}
      >
        <View
          style={[modalStyles.content, styles.saveNewModalContent]}
          onStartShouldSetResponder={() => true}
        >
          <Text style={modalStyles.title}>Save New File</Text>
          <Text style={modalStyles.message}>
            Enter a filename for the new tune (will be saved in beginner/).
          </Text>

          <TextInput
            style={styles.filenameInput}
            value={filename}
            onChangeText={onFilenameChange}
            placeholder="my_tune"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSaving}
            testID="save-new-filename-input"
          />

          <View style={styles.saveNewModalButtons}>
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
              style={[
                styles.confirmButton,
                isSaving && styles.confirmButtonDisabled,
              ]}
              onPress={onConfirm}
              disabled={isSaving}
            >
              <Text
                style={[
                  styles.confirmButtonText,
                  isSaving && modalStyles.textDisabled,
                ]}
              >
                {isSaving ? "Creating..." : "Create"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  saveNewModalContent: {
    width: "90%",
    maxWidth: 360,
  },
  filenameInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    marginTop: spacing.sm,
  },
  saveNewModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
