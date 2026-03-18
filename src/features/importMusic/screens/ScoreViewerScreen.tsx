/**
 * ScoreViewerScreen
 *
 * Full-screen view of an imported score with notation rendering.
 * Shows the music notation using ScorePreview component and provides
 * actions for practice, editing, and navigation.
 *
 * Navigation params:
 * - score: The imported score to display
 * - rawMusicXml: MusicXML content for rendering
 */

import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";
import { ScorePreview } from "../components";
import { saveScore, getScore } from "../services/scoreStorageService";
import type { ImportedScore, UncertainMeasure } from "../../../types/import";

// ============================================================================
// Types
// ============================================================================

/**
 * Navigation params for ScoreViewerScreen
 */
export interface ScoreViewerParams {
  /** The imported score to display (direct import) */
  score?: ImportedScore;
  /** Raw MusicXML content for rendering (direct import) */
  rawMusicXml?: string;
  /** Score ID to load from storage (from My Scores) */
  scoreId?: string;
}

/**
 * Props for ScoreViewerScreen
 */
export type ScoreViewerScreenProps = NativeStackScreenProps<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  "ScoreViewer"
>;

// ============================================================================
// Component
// ============================================================================

export function ScoreViewerScreen({
  route,
  navigation,
}: ScoreViewerScreenProps): React.ReactElement {
  // Extract params
  const params = (route?.params ?? {}) as Partial<ScoreViewerParams>;
  const { scoreId } = params;

  // Get window dimensions for explicit WebView sizing (iOS needs this)
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Calculate score preview height:
  // Total height - safe area insets - header (~60) - info bar (~50) - action buttons (~80)
  const headerHeight = 60;
  const infoBarHeight = 50;
  const actionButtonsHeight = 80;
  const scorePreviewHeight = Math.max(
    200,
    windowHeight -
      insets.top -
      insets.bottom -
      headerHeight -
      infoBarHeight -
      actionButtonsHeight,
  );

  // State for score data (from params or loaded from storage)
  const [score, setScore] = useState<ImportedScore | null>(
    params.score ?? null,
  );
  const [rawMusicXml, setRawMusicXml] = useState<string | null>(
    params.rawMusicXml ?? null,
  );
  const [isLoadingScore, setIsLoadingScore] = useState(!!scoreId);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Track render state
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [isSaved, setIsSaved] = useState(!!scoreId); // Already saved if loading by ID
  const [isSaving, setIsSaving] = useState(false);

  // Load score from storage when scoreId is provided
  useEffect(() => {
    if (!scoreId) return;

    let cancelled = false;

    async function loadStoredScore() {
      setIsLoadingScore(true);
      setLoadError(null);

      const result = await getScore(scoreId);

      if (cancelled) return;

      if (result.success) {
        setScore(result.data.score);
        setRawMusicXml(result.data.rawMusicXml);
      } else {
        setLoadError(result.error.message);
      }

      setIsLoadingScore(false);
    }

    loadStoredScore();

    return () => {
      cancelled = true;
    };
  }, [scoreId]);

  // Handle render completion
  const handleRenderComplete = useCallback(() => {
    setIsRendered(true);
  }, []);

  // Handle render error
  const handleRenderError = useCallback((error: string) => {
    setRenderError(error);
  }, []);

  // Handle save button
  const handleSave = useCallback(async () => {
    if (!score || !rawMusicXml || isSaving || isSaved) return;

    setIsSaving(true);
    try {
      const result = await saveScore({ score, rawMusicXml });
      if (result.success) {
        setIsSaved(true);
        Alert.alert("Saved", "Score saved to your library.", [
          {
            text: "View Library",
            onPress: () => navigation?.navigate("MyScores"),
          },
          { text: "OK", style: "cancel" },
        ]);
      } else {
        Alert.alert("Save Failed", result.error.message, [{ text: "OK" }]);
      }
    } catch {
      Alert.alert("Save Failed", "Unable to save score. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setIsSaving(false);
    }
  }, [score, rawMusicXml, isSaving, isSaved, navigation]);

  // Handle practice button
  const handlePractice = useCallback(() => {
    if (!score || !rawMusicXml) return;

    navigation?.navigate("ImportedScorePractice", {
      score,
      rawMusicXml,
    });
  }, [score, rawMusicXml, navigation]);

  // Handle edit/review button
  const handleReview = useCallback(() => {
    if (!score || !rawMusicXml) return;

    // For direct MusicXML import, there are no uncertain measures
    // Uncertain measures come from OMR processing
    const uncertainMeasures: UncertainMeasure[] = [];

    navigation?.navigate("ScoreCorrection", {
      score,
      rawMusicXml,
      uncertainMeasures,
    });
  }, [score, rawMusicXml, navigation]);

  // Handle back button
  const handleBack = useCallback(() => {
    navigation?.goBack();
  }, [navigation]);

  // Loading state when fetching from storage
  if (isLoadingScore) {
    return (
      <SafeAreaView style={styles.container}>
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
          <Text style={styles.headerTitle}>Score</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.emptyTitle}>Loading Score...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state when loading failed
  if (loadError) {
    return (
      <SafeAreaView style={styles.container}>
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
          <Text style={styles.headerTitle}>Score</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyState}>
          <Feather name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.emptyTitle}>Failed to Load Score</Text>
          <Text style={styles.emptyMessage}>{loadError}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If no score provided, show placeholder
  if (!score || !rawMusicXml) {
    return (
      <SafeAreaView style={styles.container}>
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
          <Text style={styles.headerTitle}>Score</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyState}>
          <Feather name="music" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Score Available</Text>
          <Text style={styles.emptyMessage}>
            Import a score first to view it here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Extract metadata for display
  const title = score.metadata.title ?? "Untitled Score";
  const subtitle = score.metadata.composer ?? score.metadata.arranger ?? null;

  return (
    <SafeAreaView style={styles.container} testID="score-viewer-screen">
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
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={handleReview}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Review score"
        >
          <Feather name="edit-2" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Score Preview */}
      <View style={styles.previewContainer}>
        {renderError ? (
          <View style={styles.errorState}>
            <Feather name="alert-circle" size={48} color={colors.error} />
            <Text style={styles.errorTitle}>Unable to Display Score</Text>
            <Text style={styles.errorMessage}>{renderError}</Text>
          </View>
        ) : (
          <ScorePreview
            musicXml={rawMusicXml}
            height={scorePreviewHeight}
            showZoomControls={true}
            fixedWidth={1200}
            horizontalStaffline={true}
            onRenderComplete={handleRenderComplete}
            onError={handleRenderError}
            testID="score-viewer-preview"
          />
        )}
      </View>

      {/* Score Info Bar */}
      <View style={styles.infoBar}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Parts</Text>
          <Text style={styles.infoValue}>{score.parts.length}</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Measures</Text>
          <Text style={styles.infoValue}>{score.measureCount}</Text>
        </View>
        {score.metadata.timeSignature && (
          <>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>
                {score.metadata.timeSignature.displayName}
              </Text>
            </View>
          </>
        )}
        {score.metadata.keySignature && (
          <>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Key</Text>
              <Text style={styles.infoValue}>
                {score.metadata.keySignature.displayName}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          onPress={handleSave}
          style={[
            styles.actionButton,
            styles.secondaryButton,
            (isSaved || isSaving) && styles.disabledButton,
          ]}
          accessibilityRole="button"
          accessibilityLabel={isSaved ? "Score saved" : "Save to library"}
          disabled={!isRendered || isSaved || isSaving}
        >
          <Feather
            name={isSaved ? "check" : "bookmark"}
            size={20}
            color={isSaved ? colors.success : colors.primary}
          />
          <Text
            style={[styles.secondaryButtonText, isSaved && styles.savedText]}
          >
            {isSaving ? "Saving..." : isSaved ? "Saved" : "Save"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handlePractice}
          style={[styles.actionButton, styles.primaryButton]}
          accessibilityRole="button"
          accessibilityLabel="Practice this score"
          disabled={!isRendered}
        >
          <Feather name="play" size={20} color={colors.background} />
          <Text style={styles.primaryButtonText}>Practice</Text>
        </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  headerSpacer: {
    width: 32,
  },
  previewContainer: {
    flex: 1,
  },
  infoBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoItem: {
    alignItems: "center",
    paddingHorizontal: spacing.md,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  infoDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  actionBar: {
    flexDirection: "row",
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: 8,
    gap: spacing.xs,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.background,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  savedText: {
    color: colors.success,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  errorState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.error,
    marginTop: spacing.md,
  },
  errorMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});

// ============================================================================
// Export
// ============================================================================

export default ScoreViewerScreen;
