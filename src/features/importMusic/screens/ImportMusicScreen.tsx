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
  StatusBar,
  Text,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
// Sample MusicXML for Development Testing
// ============================================================================

const SAMPLE_MUSICXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN"
    "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>Sample Scale</work-title>
  </work>
  <identification>
    <creator type="composer">Sound First Demo</creator>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <direction placement="above">
        <direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>80</per-minute></metronome></direction-type>
        <sound tempo="80"/>
      </direction>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>F</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
    <measure number="2">
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>B</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`;

// Check if we're in development mode
const __DEV__ = process.env.NODE_ENV !== "production";

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

  // Development only: Load sample MusicXML for testing
  const handleLoadSample = useCallback(() => {
    if (!__DEV__) return;

    devLog("Loading sample MusicXML for development testing");

    // Create a mock score from the sample
    const sampleScore = {
      id: `sample-${Date.now()}`,
      metadata: {
        title: "Sample Scale",
        composer: "Sound First Demo",
        partCount: 1,
        measureCount: 2,
        keySignature: "C major",
        timeSignature: "4/4",
        tempo: 80,
        sourceType: "musicxml" as const,
        importedAt: new Date().toISOString(),
        confidence: 1,
      },
      parts: [],
    };

    // Navigate to ScoreViewer first (then user can tap Practice)
    navigation?.navigate("ScoreViewer", {
      score: sampleScore,
      rawMusicXml: SAMPLE_MUSICXML,
    });
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
          <>
            <ImportActionList
              actions={importActions}
              disabled={false}
              testID="import-music-actions"
            />

            {/* Development Only: Load Sample for Testing */}
            {__DEV__ && (
              <View style={styles.devSection}>
                <Text style={styles.devSectionTitle}>Development Testing</Text>
                <TouchableOpacity
                  style={styles.sampleButton}
                  onPress={handleLoadSample}
                  accessibilityRole="button"
                  accessibilityLabel="Load sample MusicXML"
                  testID="import-music-load-sample"
                >
                  <Feather name="play-circle" size={20} color={colors.white} />
                  <Text style={styles.sampleButtonText}>
                    Load Sample (C Scale)
                  </Text>
                </TouchableOpacity>
                <Text style={styles.devHint}>
                  Skips file picker - goes directly to practice
                </Text>
              </View>
            )}
          </>
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
  devSection: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  devSectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  sampleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  sampleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  devHint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});

// ============================================================================
// Export
// ============================================================================

export default ImportMusicScreen;
