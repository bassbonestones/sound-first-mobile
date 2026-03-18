/**
 * MyScoresScreen
 *
 * Displays a list of saved scores that the user has imported.
 * Allows viewing, favoriting, and deleting scores.
 */

import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Pressable,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";
import { useMyScores } from "../hooks/useMyScores";
import type { StoredScoreSummary } from "../services/scoreStorageService";

// ============================================================================
// Types
// ============================================================================

export type MyScoresScreenProps = NativeStackScreenProps<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  "MyScores"
>;

// ============================================================================
// Score Card Component
// ============================================================================

interface ScoreCardProps {
  readonly score: StoredScoreSummary;
  readonly onPress: () => void;
  readonly onFavorite: () => void;
  readonly onDelete: () => void;
}

function ScoreCard({
  score,
  onPress,
  onFavorite,
  onDelete,
}: ScoreCardProps): React.ReactElement {
  // Format the date
  const formattedDate = useMemo(() => {
    const date = new Date(score.savedAt);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [score.savedAt]);

  // Get source icon
  const sourceIcon = useMemo(() => {
    switch (score.sourceType) {
      case "musicxml":
      case "mxl":
        return "file-text";
      case "photo":
      case "image":
        return "image";
      case "pdf":
        return "file";
      default:
        return "music";
    }
  }, [score.sourceType]);

  return (
    <Pressable
      style={styles.scoreCard}
      onPress={onPress}
      accessibilityLabel={`Open ${score.title ?? "Untitled"}`}
      testID={`score-card-${score.id}`}
    >
      {/* Icon */}
      <View style={styles.scoreIcon}>
        <Feather name={sourceIcon} size={24} color={colors.primary} />
      </View>

      {/* Content */}
      <View style={styles.scoreContent}>
        <Text style={styles.scoreTitle} numberOfLines={1}>
          {score.title ?? "Untitled Score"}
        </Text>
        {score.composer && (
          <Text style={styles.scoreComposer} numberOfLines={1}>
            {score.composer}
          </Text>
        )}
        <View style={styles.scoreMeta}>
          <Text style={styles.scoreMetaText}>
            {score.partCount} {score.partCount === 1 ? "part" : "parts"} •{" "}
            {score.measureCount} measures
          </Text>
          <Text style={styles.scoreDate}>{formattedDate}</Text>
        </View>
      </View>

      {/* Actions - use View to prevent nested buttons */}
      <View style={styles.scoreActions}>
        <Pressable
          style={styles.actionButton}
          onPress={(e) => {
            e?.stopPropagation?.();
            onFavorite();
          }}
          accessibilityRole="button"
          accessibilityLabel={
            score.isFavorite ? "Remove from favorites" : "Add to favorites"
          }
          testID={`favorite-button-${score.id}`}
        >
          <Feather
            name={score.isFavorite ? "star" : "star"}
            size={20}
            color={score.isFavorite ? colors.warning : colors.textSecondary}
            style={score.isFavorite ? styles.filledStar : undefined}
          />
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={(e) => {
            e?.stopPropagation?.();
            onDelete();
          }}
          accessibilityRole="button"
          accessibilityLabel="Delete score"
          testID={`delete-button-${score.id}`}
        >
          <Feather name="trash-2" size={20} color={colors.error} />
        </Pressable>
      </View>
    </Pressable>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

interface EmptyStateProps {
  readonly onImport: () => void;
}

function EmptyState({ onImport }: EmptyStateProps): React.ReactElement {
  return (
    <View style={styles.emptyState} testID="empty-state">
      <Feather name="music" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>No Scores Yet</Text>
      <Text style={styles.emptyMessage}>
        Import your first score to start practicing your own music.
      </Text>
      <TouchableOpacity
        style={styles.importButton}
        onPress={onImport}
        accessibilityRole="button"
        accessibilityLabel="Import music"
        testID="import-button"
      >
        <Feather name="plus" size={20} color={colors.surface} />
        <Text style={styles.importButtonText}>Import Music</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function MyScoresScreen({
  navigation,
}: MyScoresScreenProps): React.ReactElement {
  const {
    scores,
    isLoading,
    isRefreshing,
    error,
    refresh,
    deleteScore,
    toggleFavorite,
  } = useMyScores();

  // Navigate to import screen
  const handleImport = useCallback(() => {
    navigation?.navigate("ImportMusic");
  }, [navigation]);

  // Navigate to score viewer
  const handleOpenScore = useCallback(
    (score: StoredScoreSummary) => {
      // We need to load the full score to get rawMusicXml
      // For now, navigate with just the ID and let ScoreViewer fetch it
      navigation?.navigate("ScoreViewer", { scoreId: score.id });
    },
    [navigation],
  );

  // Handle delete with confirmation
  const handleDelete = useCallback(
    async (score: StoredScoreSummary) => {
      const title = score.title ?? "Untitled";

      // Use platform-appropriate confirmation
      if (Platform.OS === "web") {
        // eslint-disable-next-line no-restricted-globals
        const confirmed = confirm(
          `Are you sure you want to delete "${title}"?`,
        );
        if (confirmed) {
          const success = await deleteScore(score.id);
          if (!success) {
            // eslint-disable-next-line no-restricted-globals
            alert("Failed to delete score. Please try again.");
          }
        }
      } else {
        Alert.alert(
          "Delete Score",
          `Are you sure you want to delete "${title}"?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: async () => {
                const success = await deleteScore(score.id);
                if (!success) {
                  Alert.alert(
                    "Error",
                    "Failed to delete score. Please try again.",
                  );
                }
              },
            },
          ],
        );
      }
    },
    [deleteScore],
  );

  // Handle favorite toggle
  const handleFavorite = useCallback(
    async (score: StoredScoreSummary) => {
      await toggleFavorite(score.id);
    },
    [toggleFavorite],
  );

  // Handle back
  const handleBack = useCallback(() => {
    navigation?.goBack();
  }, [navigation]);

  // Render score card
  const renderItem = useCallback(
    ({ item }: { item: StoredScoreSummary }) => (
      <ScoreCard
        score={item}
        onPress={() => handleOpenScore(item)}
        onFavorite={() => handleFavorite(item)}
        onDelete={() => handleDelete(item)}
      />
    ),
    [handleOpenScore, handleFavorite, handleDelete],
  );

  // Key extractor
  const keyExtractor = useCallback((item: StoredScoreSummary) => item.id, []);

  // Item separator
  const ItemSeparator = useCallback(
    () => <View style={styles.separator} />,
    [],
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} testID="my-scores-screen">
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Scores</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading scores...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container} testID="my-scores-screen">
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Scores</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Failed to Load</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={refresh}
            accessibilityRole="button"
            accessibilityLabel="Retry"
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID="my-scores-screen">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Scores</Text>
        <TouchableOpacity
          onPress={handleImport}
          style={styles.addButton}
          accessibilityRole="button"
          accessibilityLabel="Import new score"
          testID="header-import-button"
        >
          <Feather name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Score List */}
      {scores.length === 0 ? (
        <EmptyState onImport={handleImport} />
      ) : (
        <FlatList
          data={scores}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={ItemSeparator}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
            />
          }
          testID="scores-list"
        />
      )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  addButton: {
    padding: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  errorTitle: {
    marginTop: spacing.md,
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  errorMessage: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.surface,
  },
  listContent: {
    padding: spacing.md,
  },
  separator: {
    height: spacing.sm,
  },
  scoreCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  scoreComposer: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scoreMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  scoreMetaText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  scoreDate: {
    fontSize: 12,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },
  scoreActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  filledStar: {
    // Workaround: Feather doesn't have a filled star,
    // so we just change color to indicate "filled"
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyTitle: {
    marginTop: spacing.lg,
    fontSize: 20,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  emptyMessage: {
    marginTop: spacing.sm,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    maxWidth: 280,
  },
  importButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  importButtonText: {
    marginLeft: spacing.sm,
    fontSize: 16,
    fontWeight: "600",
    color: colors.surface,
  },
});
