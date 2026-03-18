/**
 * ImportActionList Component
 *
 * Displays a list of import action buttons for different import sources.
 */

import React, { memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AccessibilityRole,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";
import {
  IMPORT_ACTION_LABELS,
  IMPORT_ACTION_DESCRIPTIONS,
  FILE_TYPE_HINTS,
} from "../../../constants/import";
import type { ImportSourceType } from "../../../types/import";

// ============================================================================
// Types
// ============================================================================

export interface ImportAction {
  /** Action identifier */
  readonly id: ImportSourceType | "musicxml_group";
  /** Display label */
  readonly label: string;
  /** Description text */
  readonly description: string;
  /** Icon name from Feather icons */
  readonly icon: keyof typeof Feather.glyphMap;
  /** File type hint */
  readonly hint: string;
  /** Whether the action is disabled */
  readonly disabled?: boolean;
  /** Handler for action */
  readonly onPress: () => void;
}

export interface ImportActionListProps {
  /** List of actions to display */
  readonly actions: ImportAction[];
  /** Whether any import is in progress */
  readonly disabled?: boolean;
  /** Test ID prefix */
  readonly testID?: string;
}

// ============================================================================
// Default Actions Factory
// ============================================================================

/**
 * Create default import actions with handlers
 */
export function createDefaultImportActions(handlers: {
  onCamera: () => void;
  onImageLibrary: () => void;
  onPdf: () => void;
  onMusicXml: () => void;
}): ImportAction[] {
  return [
    {
      id: "photo",
      label: IMPORT_ACTION_LABELS.photo,
      description: IMPORT_ACTION_DESCRIPTIONS.photo,
      icon: "camera",
      hint: FILE_TYPE_HINTS.photo,
      onPress: handlers.onCamera,
    },
    {
      id: "image",
      label: IMPORT_ACTION_LABELS.image,
      description: IMPORT_ACTION_DESCRIPTIONS.image,
      icon: "image",
      hint: FILE_TYPE_HINTS.image,
      onPress: handlers.onImageLibrary,
    },
    {
      id: "pdf",
      label: IMPORT_ACTION_LABELS.pdf,
      description: IMPORT_ACTION_DESCRIPTIONS.pdf,
      icon: "file-text",
      hint: FILE_TYPE_HINTS.pdf,
      onPress: handlers.onPdf,
    },
    {
      id: "musicxml_group",
      label: IMPORT_ACTION_LABELS.musicxml,
      description: IMPORT_ACTION_DESCRIPTIONS.musicxml,
      icon: "music",
      hint: FILE_TYPE_HINTS.musicxml,
      onPress: handlers.onMusicXml,
    },
  ];
}

// ============================================================================
// Component
// ============================================================================

function ImportActionListComponent({
  actions,
  disabled = false,
  testID = "import-action-list",
}: ImportActionListProps): React.ReactElement {
  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.sectionTitle}>Import Music</Text>
      <Text style={styles.sectionSubtitle}>
        Choose how to add your sheet music
      </Text>

      <View style={styles.actionList}>
        {actions.map((action) => (
          <ImportActionButton
            key={action.id}
            action={action}
            disabled={disabled || action.disabled}
            testID={`${testID}-action-${action.id}`}
          />
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// Action Button Component
// ============================================================================

interface ImportActionButtonProps {
  readonly action: ImportAction;
  readonly disabled?: boolean;
  readonly testID?: string;
}

function ImportActionButton({
  action,
  disabled = false,
  testID,
}: ImportActionButtonProps): React.ReactElement {
  const accessibilityRole: AccessibilityRole = "button";

  return (
    <TouchableOpacity
      style={[styles.actionButton, disabled && styles.actionButtonDisabled]}
      onPress={action.onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={`${action.label}. ${action.description}`}
      accessibilityHint={action.hint}
      accessibilityState={{ disabled }}
      testID={testID}
    >
      <View style={styles.actionIconContainer}>
        <Feather
          name={action.icon}
          size={24}
          color={disabled ? colors.textTertiary : colors.primary}
        />
      </View>
      <View style={styles.actionTextContainer}>
        <Text
          style={[styles.actionLabel, disabled && styles.actionLabelDisabled]}
        >
          {action.label}
        </Text>
        <Text
          style={[
            styles.actionDescription,
            disabled && styles.actionDescriptionDisabled,
          ]}
        >
          {action.description}
        </Text>
        <Text style={styles.actionHint}>{action.hint}</Text>
      </View>
      <Feather
        name="chevron-right"
        size={20}
        color={disabled ? colors.textTertiary : colors.textSecondary}
      />
    </TouchableOpacity>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  actionList: {
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  actionLabelDisabled: {
    color: colors.textTertiary,
  },
  actionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  actionDescriptionDisabled: {
    color: colors.textTertiary,
  },
  actionHint: {
    fontSize: 12,
    color: colors.textTertiary,
  },
});

// ============================================================================
// Export
// ============================================================================

export const ImportActionList = memo(ImportActionListComponent);
