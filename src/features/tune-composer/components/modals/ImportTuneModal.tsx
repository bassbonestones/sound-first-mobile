/**
 * ImportTuneModal - File picker for importing tunes from preview folder
 *
 * Displays available MusicXML files and handles import loading state.
 */
import React from "react";
import {
  Modal,
  Pressable,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "../../../../constants";
import { modalStyles } from "./modalStyles";

export interface ImportTuneModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** List of available filenames */
  files: string[];
  /** Whether files are being loaded */
  isLoadingFiles: boolean;
  /** Whether a file is being imported */
  isImporting: boolean;
  /** Called when user selects a file to import */
  onSelectFile: (filename: string) => void;
  /** Called when user cancels */
  onCancel: () => void;
}

/**
 * Format filename for display (remove extension, replace underscores)
 */
function formatFilename(filename: string): string {
  return filename.replace(/\.musicxml$/i, "").replace(/_/g, " ");
}

/**
 * Modal for importing tunes from the preview folder
 */
export function ImportTuneModal({
  visible,
  files,
  isLoadingFiles,
  isImporting,
  onSelectFile,
  onCancel,
}: ImportTuneModalProps): React.ReactElement {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => !isImporting && onCancel()}
    >
      <Pressable
        style={modalStyles.overlay}
        onPress={() => !isImporting && onCancel()}
      >
        <View
          style={[modalStyles.content, styles.importModalContent]}
          onStartShouldSetResponder={() => true}
        >
          <Text style={modalStyles.title}>Import Tune</Text>
          <Text style={modalStyles.message}>
            Select a tune from the preview folder to load into the composer.
          </Text>

          {isLoadingFiles ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.loadingIndicator}
            />
          ) : files.length === 0 ? (
            <Text style={styles.emptyMessage}>
              No files available. Add MusicXML files to
              resources/materials/pending/
            </Text>
          ) : (
            <ScrollView
              style={styles.fileList}
              showsVerticalScrollIndicator={true}
            >
              {files.map((filename) => (
                <TouchableOpacity
                  key={filename}
                  style={styles.fileOption}
                  onPress={() => onSelectFile(filename)}
                  disabled={isImporting}
                >
                  <Feather
                    name="music"
                    size={16}
                    color={colors.primary}
                    style={styles.fileIcon}
                  />
                  <Text
                    style={[
                      styles.fileOptionText,
                      isImporting && modalStyles.textDisabled,
                    ]}
                    numberOfLines={2}
                  >
                    {formatFilename(filename)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {isImporting && (
            <View style={styles.importingOverlay}>
              <ActivityIndicator size="small" color={colors.white} />
              <Text style={styles.importingText}>Loading...</Text>
            </View>
          )}

          <TouchableOpacity
            style={modalStyles.cancel}
            onPress={onCancel}
            disabled={isImporting}
          >
            <Text
              style={[
                modalStyles.cancelText,
                isImporting && modalStyles.textDisabled,
              ]}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  importModalContent: {
    maxHeight: "70%",
  },
  loadingIndicator: {
    marginVertical: spacing.md,
  },
  fileList: {
    maxHeight: 300,
    marginVertical: spacing.sm,
  },
  fileOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fileIcon: {
    marginRight: spacing.sm,
  },
  fileOptionText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  importingOverlay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    marginVertical: spacing.sm,
  },
  importingText: {
    color: colors.white,
    fontSize: 14,
    marginLeft: spacing.sm,
  },
});
