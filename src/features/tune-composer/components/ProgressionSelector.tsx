/**
 * ProgressionSelector Component
 *
 * Dropdown selector for chord progressions.
 * Allows switching between progressions, creating new ones, and duplicating existing ones.
 *
 * Can be used with explicit props OR with ChordProgressionContext via the Connected variant.
 */

import React, { memo, useState, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  AccessibilityRole,
  ListRenderItemInfo,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";
import type { ChordProgression } from "../types";
import { PROGRESSION_PRESET_NAMES } from "../types";
import { useChordProgressionOptional } from "../contexts";

// =============================================================================
// Types
// =============================================================================

export interface ProgressionSelectorProps {
  /** All available progressions */
  progressions: ChordProgression[];
  /** ID of the currently active progression */
  activeProgressionId: string | undefined;
  /** Callback when a progression is selected */
  onSelectProgression: (id: string) => void;
  /** Callback to create a new progression */
  onCreateProgression: (name: string) => void;
  /** Callback to duplicate a progression */
  onDuplicateProgression: (sourceId: string, newName?: string) => void;
  /** Callback to delete a user progression */
  onDeleteProgression?: (id: string) => void;
  /** Callback to rename a progression */
  onRenameProgression?: (id: string, newName: string) => void;
  /** Whether edit mode is active */
  isEditMode: boolean;
  /** Callback to toggle edit mode */
  onToggleEditMode: () => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Test ID for testing */
  testID?: string;
}

type ModalMode = "select" | "create" | "duplicate" | "rename";

// =============================================================================
// Component
// =============================================================================

function ProgressionSelectorComponent({
  progressions,
  activeProgressionId,
  onSelectProgression,
  onCreateProgression,
  onDuplicateProgression,
  onDeleteProgression,
  onRenameProgression,
  isEditMode,
  onToggleEditMode,
  disabled = false,
  testID,
}: ProgressionSelectorProps): React.ReactElement {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("select");
  const [newName, setNewName] = useState("");
  const [duplicateSourceId, setDuplicateSourceId] = useState<string | null>(
    null,
  );
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);

  // Find active progression
  const activeProgression = progressions.find(
    (p) => p.id === activeProgressionId,
  );

  // Check if active progression is editable
  const canEditActive = activeProgression && !activeProgression.isSystemDefined;

  // Open modal in select mode
  const handleOpenModal = useCallback(() => {
    setModalMode("select");
    setModalVisible(true);
  }, []);

  // Close modal and reset state
  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setNewName("");
    setDuplicateSourceId(null);
    setRenameTargetId(null);
  }, []);

  // Select a progression
  const handleSelect = useCallback(
    (id: string) => {
      onSelectProgression(id);
      handleCloseModal();
    },
    [onSelectProgression, handleCloseModal],
  );

  // Start create flow
  const handleStartCreate = useCallback(() => {
    setModalMode("create");
    setNewName("");
  }, []);

  // Confirm create
  const handleConfirmCreate = useCallback(() => {
    const trimmedName = newName.trim();
    if (trimmedName) {
      onCreateProgression(trimmedName);
      handleCloseModal();
    }
  }, [newName, onCreateProgression, handleCloseModal]);

  // Start duplicate flow
  const handleStartDuplicate = useCallback(
    (sourceId: string) => {
      setModalMode("duplicate");
      setDuplicateSourceId(sourceId);
      const source = progressions.find((p) => p.id === sourceId);
      setNewName(source ? `${source.name} (Copy)` : "Copy");
    },
    [progressions],
  );

  // Confirm duplicate
  const handleConfirmDuplicate = useCallback(() => {
    if (duplicateSourceId) {
      const trimmedName = newName.trim();
      onDuplicateProgression(duplicateSourceId, trimmedName || undefined);
      handleCloseModal();
    }
  }, [duplicateSourceId, newName, onDuplicateProgression, handleCloseModal]);

  // Start rename flow
  const handleStartRename = useCallback(
    (id: string) => {
      const progression = progressions.find((p) => p.id === id);
      if (progression && !progression.isSystemDefined) {
        setModalMode("rename");
        setRenameTargetId(id);
        setNewName(progression.name);
      }
    },
    [progressions],
  );

  // Confirm rename
  const handleConfirmRename = useCallback(() => {
    if (renameTargetId && onRenameProgression) {
      const trimmedName = newName.trim();
      if (trimmedName) {
        onRenameProgression(renameTargetId, trimmedName);
        handleCloseModal();
      }
    }
  }, [renameTargetId, newName, onRenameProgression, handleCloseModal]);

  // Delete a progression
  const handleDelete = useCallback(
    (id: string) => {
      if (onDeleteProgression) {
        onDeleteProgression(id);
      }
    },
    [onDeleteProgression],
  );

  // Render a progression item in the list
  const renderProgressionItem = useCallback(
    ({ item }: ListRenderItemInfo<ChordProgression>) => {
      const isActive = item.id === activeProgressionId;
      const isSystem = item.isSystemDefined ?? false;
      const isInferred = item.isAutoInferred ?? false;

      return (
        <View style={styles.listItem} testID={`progression-item-${item.id}`}>
          <TouchableOpacity
            style={[styles.itemMain, isActive && styles.itemMainActive]}
            onPress={() => handleSelect(item.id)}
            accessibilityRole={"button" as AccessibilityRole}
            accessibilityLabel={`Select ${item.name} progression`}
            accessibilityState={{ selected: isActive }}
            testID={`progression-select-${item.id}`}
          >
            <View style={styles.itemContent}>
              <Text
                style={[styles.itemName, isActive && styles.itemNameActive]}
              >
                {item.name}
              </Text>
              {isActive && (
                <Feather name="check" size={16} color={colors.primary} />
              )}
            </View>
            <View style={styles.itemBadges}>
              {item.isDefault && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Default</Text>
                </View>
              )}
              {isInferred && (
                <View style={[styles.badge, styles.badgeInferred]}>
                  <Text style={styles.badgeText}>Auto</Text>
                </View>
              )}
              {isSystem && (
                <View style={[styles.badge, styles.badgeSystem]}>
                  <Text style={styles.badgeText}>System</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Action buttons */}
          <View style={styles.itemActions}>
            {!isSystem && onRenameProgression && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleStartRename(item.id)}
                accessibilityRole={"button" as AccessibilityRole}
                accessibilityLabel={`Rename ${item.name}`}
                testID={`progression-rename-${item.id}`}
              >
                <Feather name="edit-3" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleStartDuplicate(item.id)}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel={`Duplicate ${item.name}`}
              testID={`progression-duplicate-${item.id}`}
            >
              <Feather name="copy" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            {!isSystem && onDeleteProgression && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDelete(item.id)}
                accessibilityRole={"button" as AccessibilityRole}
                accessibilityLabel={`Delete ${item.name}`}
                testID={`progression-delete-${item.id}`}
              >
                <Feather name="trash-2" size={16} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    },
    [
      activeProgressionId,
      handleSelect,
      handleStartRename,
      handleStartDuplicate,
      handleDelete,
      onRenameProgression,
      onDeleteProgression,
    ],
  );

  // Render preset name suggestions
  const renderPresetSuggestions = useCallback(() => {
    return (
      <View style={styles.presetContainer}>
        <Text style={styles.presetLabel}>Suggestions:</Text>
        <View style={styles.presetChips}>
          {PROGRESSION_PRESET_NAMES.map((preset) => (
            <TouchableOpacity
              key={preset}
              style={styles.presetChip}
              onPress={() => setNewName(preset)}
              testID={`preset-${preset}`}
            >
              <Text style={styles.presetChipText}>{preset}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }, []);

  // Render modal content based on mode
  const renderModalContent = useCallback(() => {
    switch (modalMode) {
      case "select":
        return (
          <>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Progression</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseModal}
                accessibilityRole={"button" as AccessibilityRole}
                accessibilityLabel="Close"
                testID="modal-close"
              >
                <Feather name="x" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={progressions}
              renderItem={renderProgressionItem}
              keyExtractor={(item) => item.id}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              testID="progression-list"
            />

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleStartCreate}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel="Create new progression"
              testID="create-progression-button"
            >
              <Feather name="plus" size={18} color={colors.surface} />
              <Text style={styles.createButtonText}>New Progression</Text>
            </TouchableOpacity>
          </>
        );

      case "create":
        return (
          <>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setModalMode("select")}
                accessibilityRole={"button" as AccessibilityRole}
                accessibilityLabel="Back"
                testID="modal-back"
              >
                <Feather
                  name="arrow-left"
                  size={20}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Progression</Text>
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.formLabel}>Progression Name</Text>
              <TextInput
                style={styles.formInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Enter name..."
                placeholderTextColor={colors.textSecondary}
                autoFocus
                testID="progression-name-input"
              />
              {renderPresetSuggestions()}
            </View>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                !newName.trim() && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirmCreate}
              disabled={!newName.trim()}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel="Create progression"
              testID="confirm-create-button"
            >
              <Text style={styles.confirmButtonText}>Create</Text>
            </TouchableOpacity>
          </>
        );

      case "duplicate":
        return (
          <>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setModalMode("select")}
                accessibilityRole={"button" as AccessibilityRole}
                accessibilityLabel="Back"
                testID="modal-back"
              >
                <Feather
                  name="arrow-left"
                  size={20}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Duplicate Progression</Text>
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.formLabel}>New Name</Text>
              <TextInput
                style={styles.formInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Enter name..."
                placeholderTextColor={colors.textSecondary}
                autoFocus
                testID="duplicate-name-input"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                !newName.trim() && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirmDuplicate}
              disabled={!newName.trim()}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel="Duplicate progression"
              testID="confirm-duplicate-button"
            >
              <Text style={styles.confirmButtonText}>Duplicate</Text>
            </TouchableOpacity>
          </>
        );

      case "rename":
        return (
          <>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setModalMode("select")}
                accessibilityRole={"button" as AccessibilityRole}
                accessibilityLabel="Back"
                testID="modal-back"
              >
                <Feather
                  name="arrow-left"
                  size={20}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Rename Progression</Text>
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.formLabel}>New Name</Text>
              <TextInput
                style={styles.formInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Enter name..."
                placeholderTextColor={colors.textSecondary}
                autoFocus
                testID="rename-input"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                !newName.trim() && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirmRename}
              disabled={!newName.trim()}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel="Rename progression"
              testID="confirm-rename-button"
            >
              <Text style={styles.confirmButtonText}>Rename</Text>
            </TouchableOpacity>
          </>
        );
    }
  }, [
    modalMode,
    progressions,
    newName,
    handleCloseModal,
    handleStartCreate,
    handleConfirmCreate,
    handleConfirmDuplicate,
    handleConfirmRename,
    renderProgressionItem,
    renderPresetSuggestions,
  ]);

  return (
    <View style={styles.container} testID={testID}>
      {/* Selector button */}
      <View style={styles.selectorRow}>
        <TouchableOpacity
          style={[styles.selectorButton, disabled && styles.disabled]}
          onPress={handleOpenModal}
          disabled={disabled}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel={`Progression: ${activeProgression?.name ?? "None"}. Tap to change.`}
          testID="progression-selector-button"
        >
          <View style={styles.selectorContent}>
            <Feather name="list" size={16} color={colors.primary} />
            <Text style={styles.selectorLabel}>
              {activeProgression?.name ?? "No Progression"}
            </Text>
            <Feather
              name="chevron-down"
              size={16}
              color={colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {/* Edit mode toggle */}
        <TouchableOpacity
          style={[
            styles.editToggle,
            isEditMode && styles.editToggleActive,
            !canEditActive && styles.disabled,
          ]}
          onPress={onToggleEditMode}
          disabled={!canEditActive}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel={isEditMode ? "Exit edit mode" : "Enter edit mode"}
          accessibilityState={{ selected: isEditMode }}
          testID="edit-mode-toggle"
        >
          <Feather
            name="edit-2"
            size={16}
            color={isEditMode ? colors.surface : colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleCloseModal}
        testID="progression-modal"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>{renderModalContent()}</View>
        </View>
      </Modal>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  selectorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  selectorButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  selectorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  selectorLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  editToggle: {
    width: 36,
    height: 36,
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  editToggleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "80%",
    paddingBottom: spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
  closeButton: {
    padding: spacing.xs,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerSpacer: {
    width: 32,
  },

  // List styles
  list: {
    maxHeight: 300,
  },
  listContent: {
    paddingVertical: spacing.sm,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  itemMain: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
  },
  itemMainActive: {
    backgroundColor: colors.primaryLight,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  itemNameActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  itemBadges: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.primaryLight,
    borderRadius: 4,
  },
  badgeInferred: {
    backgroundColor: colors.warningLight,
  },
  badgeSystem: {
    backgroundColor: colors.border,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  itemActions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  actionButton: {
    padding: spacing.xs,
  },

  // Form styles
  formContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  formInput: {
    height: 44,
    backgroundColor: colors.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
  },
  presetContainer: {
    marginTop: spacing.md,
  },
  presetLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  presetChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  presetChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
  },
  presetChipText: {
    fontSize: 12,
    color: colors.primary,
  },

  // Buttons
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 8,
    gap: spacing.xs,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.surface,
  },
  confirmButton: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.surface,
  },
});

// =============================================================================
// Export
// =============================================================================

export const ProgressionSelector = memo(ProgressionSelectorComponent);

// =============================================================================
// Connected Component (uses ChordProgressionContext)
// =============================================================================

export interface ProgressionSelectorConnectedProps {
  /** Test ID for testing */
  testID?: string;
}

/**
 * ProgressionSelector that gets its props from ChordProgressionContext.
 * Use this when the parent has wrapped with ChordProgressionProvider.
 */
function ProgressionSelectorConnectedComponent({
  testID,
}: ProgressionSelectorConnectedProps): React.ReactElement | null {
  const context = useChordProgressionOptional();

  // If no context provided, don't render
  if (!context) {
    return null;
  }

  return (
    <ProgressionSelector
      progressions={context.progressions}
      activeProgressionId={context.activeProgressionId}
      onSelectProgression={context.selectProgression}
      onCreateProgression={context.createProgression}
      onDuplicateProgression={context.duplicateProgression}
      onDeleteProgression={context.deleteProgression}
      onRenameProgression={context.renameProgression}
      isEditMode={context.isEditMode}
      onToggleEditMode={context.toggleEditMode}
      disabled={context.disabled}
      testID={testID}
    />
  );
}

export const ProgressionSelectorConnected = memo(
  ProgressionSelectorConnectedComponent,
);
