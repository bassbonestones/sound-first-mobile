/**
 * ImportResultPreview Component
 *
 * A lightweight preview component for displaying import results.
 * Use this for compact displays like toast notifications, history lists,
 * or anywhere a minimal preview is needed.
 *
 * For full preview with validation and actions, use ImportPreview instead.
 */

import React, { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";
import type {
  ImportPreviewModel,
  ImportSourceType,
} from "../../../types/import";

// ============================================================================
// Types
// ============================================================================

export interface ImportResultPreviewProps {
  /** Title of the imported score */
  readonly title: string;
  /** Subtitle (composer/arranger) if available */
  readonly subtitle?: string | null;
  /** Number of measures */
  readonly measureCount: number;
  /** Number of parts */
  readonly partCount: number;
  /** Source type for icon display */
  readonly sourceType?: ImportSourceType;
  /** Whether the import needs review */
  readonly needsReview?: boolean;
  /** Handler for when the preview is pressed */
  readonly onPress?: () => void;
  /** Test ID */
  readonly testID?: string;
}

/**
 * Create props from an ImportPreviewModel
 */
export function propsFromPreviewModel(
  preview: ImportPreviewModel,
  sourceType?: ImportSourceType,
  onPress?: () => void,
): ImportResultPreviewProps {
  return {
    title: preview.title,
    subtitle: preview.subtitle,
    measureCount: preview.stats.measureCount,
    partCount: preview.stats.partCount,
    sourceType,
    needsReview: preview.needsReview,
    onPress,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get icon name for source type
 */
function getSourceIcon(
  sourceType?: ImportSourceType,
): keyof typeof Feather.glyphMap {
  switch (sourceType) {
    case "photo":
      return "camera";
    case "image":
      return "image";
    case "pdf":
      return "file-text";
    case "musicxml":
    case "mxl":
      return "music";
    default:
      return "file";
  }
}

// ============================================================================
// Component
// ============================================================================

function ImportResultPreviewComponent({
  title,
  subtitle,
  measureCount,
  partCount,
  sourceType,
  needsReview = false,
  onPress,
  testID = "import-result-preview",
}: ImportResultPreviewProps): React.ReactElement {
  const Container = onPress ? TouchableOpacity : View;
  const containerProps = onPress
    ? {
        onPress,
        accessibilityRole: "button" as const,
        accessibilityLabel: `View imported score: ${title}`,
      }
    : {};

  return (
    <Container style={styles.container} testID={testID} {...containerProps}>
      {/* Source type icon */}
      <View style={styles.iconContainer}>
        <Feather
          name={getSourceIcon(sourceType)}
          size={24}
          color={colors.primary}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
        <View style={styles.statsRow}>
          <Text style={styles.stat}>
            {measureCount} {measureCount === 1 ? "measure" : "measures"}
          </Text>
          <Text style={styles.statDivider}>•</Text>
          <Text style={styles.stat}>
            {partCount} {partCount === 1 ? "part" : "parts"}
          </Text>
        </View>
      </View>

      {/* Status indicator */}
      <View style={styles.statusContainer}>
        {needsReview ? (
          <View style={styles.reviewBadge} testID={`${testID}-review-badge`}>
            <Feather name="alert-circle" size={16} color={colors.warning} />
          </View>
        ) : (
          <View style={styles.successBadge} testID={`${testID}-success-badge`}>
            <Feather name="check-circle" size={16} color={colors.success} />
          </View>
        )}
        {onPress && (
          <Feather name="chevron-right" size={20} color={colors.textTertiary} />
        )}
      </View>
    </Container>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stat: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  statDivider: {
    marginHorizontal: 6,
    color: colors.textTertiary,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: spacing.sm,
  },
  successBadge: {
    marginRight: spacing.xs,
  },
  reviewBadge: {
    marginRight: spacing.xs,
  },
});

// ============================================================================
// Export
// ============================================================================

export const ImportResultPreview = memo(ImportResultPreviewComponent);
