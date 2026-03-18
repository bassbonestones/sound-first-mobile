/**
 * ImportMusicScreen
 *
 * Main screen for importing music into Sound First.
 * Supports multiple import sources:
 * - Camera (photo of sheet music)
 * - Image library (existing images)
 * - PDF documents
 * - MusicXML / MXL files
 */

import React, { useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";
import type { UncertainMeasure } from "../../../types/import";
import { useImportMusic } from "../hooks";
import {
  ImportActionList,
  ImportProgressIndicator,
  ImportPreview,
  ImportErrorDisplay,
  createDefaultImportActions,
} from "../components";

import { devLog } from "../../../utils/devLogger";

// ============================================================================
// Types
// ============================================================================

// For now, use a simplified navigation type
// In production, this would come from your navigation type definitions
type ImportMusicScreenNavigationProp = NativeStackNavigationProp<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  "ImportMusic"
>;

export interface ImportMusicScreenProps {
  /** Navigation prop */
  navigation?: ImportMusicScreenNavigationProp;
}

// ============================================================================
// Component
// ============================================================================

export function ImportMusicScreen({
  navigation,
}: ImportMusicScreenProps): React.ReactElement {
  const {
    // State
    status,
    error,
    score,
    preview,
    rawMusicXml,
    validationIssues,
    isImporting,

    // Actions
    importFromCamera,
    importFromImageLibrary,
    importPdf,
    importMusicXml: importMusicXmlAction,
    cancelImport,
    resetImportState,
  } = useImportMusic();

  // Determine current screen state
  const screenState = useMemo(() => {
    if (error) return "error";
    if (preview && score) return "preview";
    if (isImporting) return "importing";
    return "idle";
  }, [error, preview, score, isImporting]);

  // Create import actions
  const importActions = useMemo(
    () =>
      createDefaultImportActions({
        onCamera: importFromCamera,
        onImageLibrary: importFromImageLibrary,
        onPdf: importPdf,
        onMusicXml: importMusicXmlAction,
      }),
    [importFromCamera, importFromImageLibrary, importPdf, importMusicXmlAction],
  );

  // Handlers
  const handleContinue = useCallback(() => {
    if (!score || !rawMusicXml) {
      devLog("Cannot continue: missing score or rawMusicXml");
      resetImportState();
      return;
    }

    devLog("Continue with score:", score.id);

    // Navigate to ScoreViewer with the imported data
    navigation?.navigate("ScoreViewer", {
      score,
      rawMusicXml,
    });

    // Reset import state after navigating
    resetImportState();
  }, [score, rawMusicXml, navigation, resetImportState]);

  const handleReview = useCallback(() => {
    if (!score || !rawMusicXml) {
      devLog("Cannot review: missing score or rawMusicXml");
      return;
    }

    devLog("Review score:", score.id);

    // For direct MusicXML import, there are no uncertain measures
    // Uncertain measures come from OMR processing
    const uncertainMeasures: UncertainMeasure[] = [];

    // Navigate to ScoreCorrection for review
    navigation?.navigate("ScoreCorrection", {
      score,
      rawMusicXml,
      uncertainMeasures,
      onComplete: () => {
        // After correction, could navigate to ScoreViewer
        devLog("Correction complete for score:", score.id);
      },
    });
  }, [score, rawMusicXml, navigation]);

  const handleRetry = useCallback(() => {
    // Reset and let user try again
    resetImportState();
  }, [resetImportState]);

  const handleGoToMyScores = useCallback(() => {
    navigation?.navigate("MyScores");
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Import Music</Text>
        <TouchableOpacity
          onPress={handleGoToMyScores}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Go to My Scores"
          testID="import-music-my-scores-button"
        >
          <Feather name="folder" size={20} color={colors.primary} />
          <Text style={styles.headerButtonText}>My Scores</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Idle State - Show import actions */}
        {screenState === "idle" && (
          <ImportActionList
            actions={importActions}
            disabled={false}
            testID="import-music-actions"
          />
        )}

        {/* Importing State - Show progress */}
        {screenState === "importing" && (
          <View style={styles.stateContainer}>
            <ImportProgressIndicator
              status={status}
              onCancel={cancelImport}
              testID="import-music-progress"
            />
          </View>
        )}

        {/* Error State - Show error with retry option */}
        {screenState === "error" && error && (
          <View style={styles.stateContainer}>
            <ImportErrorDisplay
              error={error}
              onRetry={handleRetry}
              onDismiss={resetImportState}
              testID="import-music-error"
            />
          </View>
        )}

        {/* Preview State - Show import result */}
        {screenState === "preview" && preview && (
          <View style={styles.stateContainer}>
            <ImportPreview
              preview={preview}
              validationIssues={validationIssues}
              onContinue={handleContinue}
              onReview={handleReview}
              onDismiss={resetImportState}
              testID="import-music-preview"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  stateContainer: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
});

// ============================================================================
// Export
// ============================================================================

export default ImportMusicScreen;
