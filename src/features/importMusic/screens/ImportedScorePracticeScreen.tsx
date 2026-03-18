/**
 * ImportedScorePracticeScreen
 *
 * Practice screen for imported scores. Provides tempo control,
 * metronome, and beat tracking for practicing with notation.
 *
 * Navigation params:
 * - score: The imported score to practice
 * - rawMusicXml: MusicXML content for rendering
 */

import React, { useCallback, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as ScreenOrientation from "expo-screen-orientation";

import { colors, spacing } from "../../../constants";
import { ScorePreview, type ScorePreviewRef } from "../components";
import { useImportedScorePractice } from "../hooks/useImportedScorePractice";
import type { ImportedScore } from "../../../types/import";
import type { PracticeState } from "../hooks/useImportedScorePractice";

// ============================================================================
// Types
// ============================================================================

/**
 * Navigation params for ImportedScorePracticeScreen
 */
export interface ImportedScorePracticeParams {
  /** The imported score to practice */
  score: ImportedScore;
  /** Raw MusicXML content for rendering */
  rawMusicXml: string;
}

/**
 * Props for ImportedScorePracticeScreen
 */
export type ImportedScorePracticeScreenProps = NativeStackScreenProps<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  "ImportedScorePractice"
>;

// ============================================================================
// Sub-components
// ============================================================================

interface TempoControlProps {
  tempo: number;
  onTempoChange: (tempo: number) => void;
  disabled?: boolean;
}

function TempoControl({
  tempo,
  onTempoChange,
  disabled,
}: TempoControlProps): React.ReactElement {
  const decreaseTempo = useCallback(() => {
    onTempoChange(tempo - 5);
  }, [tempo, onTempoChange]);

  const increaseTempo = useCallback(() => {
    onTempoChange(tempo + 5);
  }, [tempo, onTempoChange]);

  return (
    <View style={styles.tempoControl}>
      <TouchableOpacity
        onPress={decreaseTempo}
        style={[styles.tempoButton, disabled && styles.disabledButton]}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Decrease tempo"
      >
        <Feather
          name="minus"
          size={20}
          color={disabled ? colors.textSecondary : colors.textPrimary}
        />
      </TouchableOpacity>
      <View style={styles.tempoDisplay}>
        <Text style={styles.tempoValue}>{tempo}</Text>
        <Text style={styles.tempoLabel}>BPM</Text>
      </View>
      <TouchableOpacity
        onPress={increaseTempo}
        style={[styles.tempoButton, disabled && styles.disabledButton]}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Increase tempo"
      >
        <Feather
          name="plus"
          size={20}
          color={disabled ? colors.textSecondary : colors.textPrimary}
        />
      </TouchableOpacity>
    </View>
  );
}

interface PlaybackControlsProps {
  practiceState: PracticeState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRestart: () => void;
  disabled?: boolean;
}

function PlaybackControls({
  practiceState,
  onStart,
  onPause,
  onResume,
  onStop,
  onRestart,
  disabled,
}: PlaybackControlsProps): React.ReactElement {
  const isPlaying =
    practiceState === "playing" || practiceState === "countdown";
  const isPaused = practiceState === "paused";

  return (
    <View style={styles.playbackControls}>
      {/* Stop/Reset button */}
      <TouchableOpacity
        onPress={practiceState === "idle" ? onRestart : onStop}
        style={[styles.playbackButton, styles.secondaryPlaybackButton]}
        accessibilityRole="button"
        accessibilityLabel={practiceState === "idle" ? "Restart" : "Stop"}
        disabled={disabled || practiceState === "idle"}
      >
        <Feather
          name="square"
          size={24}
          color={
            practiceState === "idle" ? colors.textSecondary : colors.textPrimary
          }
        />
      </TouchableOpacity>

      {/* Play/Pause button */}
      <TouchableOpacity
        onPress={isPlaying ? onPause : isPaused ? onResume : onStart}
        style={[
          styles.playbackButton,
          styles.primaryPlaybackButton,
          disabled && styles.disabledButton,
        ]}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? "Pause" : "Play"}
        disabled={disabled}
      >
        <Feather
          name={isPlaying ? "pause" : "play"}
          size={32}
          color={colors.background}
        />
      </TouchableOpacity>
    </View>
  );
}

interface ProgressDisplayProps {
  currentMeasure: number;
  currentBeat: number;
  totalMeasures: number;
  beatsPerMeasure: number;
  countdownRemaining: number;
  practiceState: PracticeState;
}

function ProgressDisplay({
  currentMeasure,
  currentBeat,
  totalMeasures,
  beatsPerMeasure,
  countdownRemaining,
  practiceState,
}: ProgressDisplayProps): React.ReactElement {
  // Show countdown during countdown state
  if (practiceState === "countdown" && countdownRemaining > 0) {
    return (
      <View style={styles.progressDisplay}>
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownNumber}>{countdownRemaining}</Text>
          <Text style={styles.countdownLabel}>Get Ready</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.progressDisplay}>
      <View style={styles.progressItem}>
        <Text style={styles.progressLabel}>Measure</Text>
        <Text style={styles.progressValue}>
          {currentMeasure} / {totalMeasures}
        </Text>
      </View>
      <View style={styles.progressDivider} />
      <View style={styles.progressItem}>
        <Text style={styles.progressLabel}>Beat</Text>
        <View style={styles.beatIndicators}>
          {Array.from({ length: beatsPerMeasure }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.beatDot,
                i + 1 === currentBeat &&
                  practiceState === "playing" &&
                  styles.activeBeat,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ImportedScorePracticeScreen({
  route,
  navigation,
}: ImportedScorePracticeScreenProps): React.ReactElement {
  // Extract params
  const { score, rawMusicXml } = (route?.params ??
    {}) as Partial<ImportedScorePracticeParams>;

  // Get window dimensions for explicit WebView sizing (iOS needs this)
  const { width, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Calculate score preview height:
  // Total height - safe area insets - header (~60) - progress bar (~80) - tempo control (~80) - playback controls (~100)
  const headerHeight = 60;
  const progressHeight = 80;
  const tempoControlHeight = 80;
  const playbackControlsHeight = 100;
  const scorePreviewHeight = Math.max(
    200,
    windowHeight -
      insets.top -
      insets.bottom -
      headerHeight -
      progressHeight -
      tempoControlHeight -
      playbackControlsHeight,
  );

  // Track render state
  const [isRendered, setIsRendered] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Lock to landscape orientation when screen is focused (mobile only)
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "web") return;

      // Lock to landscape when focused
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE,
      ).catch((error) => {
        console.warn("Failed to lock orientation:", error);
      });

      return () => {
        // Lock back to portrait when leaving the screen
        // (unlockAsync just allows rotation, doesn't change orientation)
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP,
        )
          .then(() => {
            // Then unlock to allow normal rotation again
            ScreenOrientation.unlockAsync();
          })
          .catch(() => {
            // Ignore errors on cleanup
          });
      };
    }, []),
  );

  // Cursor following state
  const [cursorEnabled, setCursorEnabled] = useState(false);
  const scorePreviewRef = useRef<ScorePreviewRef>(null);

  // Beat tick callback - always advances cursor position (even when hidden)
  // This ensures cursor is at correct position if enabled mid-practice
  const handleBeatTick = useCallback(() => {
    if (scorePreviewRef.current) {
      scorePreviewRef.current.advanceCursorByBeat();
    }
  }, []);

  // Practice hook - passes beat tick callback for cursor syncing
  const {
    practiceState,
    config,
    progress,
    setTempo,
    start,
    pause,
    resume,
    stop,
    restart,
    totalMeasures,
  } = useImportedScorePractice(score ?? null, rawMusicXml ?? null, {
    onBeatTick: handleBeatTick,
  });

  // Toggle cursor following
  const toggleCursor = useCallback(() => {
    setCursorEnabled((prev) => {
      const newValue = !prev;
      // If turning off, hide cursor immediately
      if (!newValue && scorePreviewRef.current) {
        scorePreviewRef.current.hideCursor();
      }
      return newValue;
    });
  }, []);

  // Handle render completion
  const handleRenderComplete = useCallback(() => {
    setIsRendered(true);
  }, []);

  // Handle render error
  const handleRenderError = useCallback((error: string) => {
    setRenderError(error);
  }, []);

  // Reset cursor position on countdown (starting/restarting practice)
  // Don't reset on idle - let the score stay at the end position when practice finishes
  useEffect(() => {
    if (!scorePreviewRef.current) return;

    if (practiceState === "countdown") {
      scorePreviewRef.current.resetCursor();
    }
  }, [practiceState]);

  // Control cursor visibility based on cursor enabled state and practice state
  useEffect(() => {
    if (!scorePreviewRef.current) return;

    if (cursorEnabled && practiceState === "playing") {
      // Show cursor when enabled and playing
      scorePreviewRef.current.showCursor();
    } else if (!cursorEnabled) {
      // Hide cursor when disabled
      scorePreviewRef.current.hideCursor();
    }
    // paused state with cursorEnabled - keep cursor visible
  }, [cursorEnabled, practiceState]);

  // Control smooth scrolling based on practice state
  useEffect(() => {
    if (!scorePreviewRef.current) return;

    if (practiceState === "playing") {
      // Start smooth scrolling
      scorePreviewRef.current.startSyncedScroll();
    } else if (practiceState === "paused") {
      // Pause scrolling
      scorePreviewRef.current.pauseSyncedScroll();
    } else {
      // idle or countdown - stop scrolling
      scorePreviewRef.current.stopSyncedScroll();
    }
  }, [practiceState]);

  // Handle back button
  const handleBack = useCallback(() => {
    // Stop practice before navigating back
    stop();
    navigation?.goBack();
  }, [navigation, stop]);

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
          <Text style={styles.headerTitle}>Practice</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyState}>
          <Feather name="music" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Score Available</Text>
          <Text style={styles.emptyMessage}>
            Import a score first to practice it here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Extract metadata
  const title = score.metadata.title ?? "Untitled Score";
  const subtitle = score.metadata.composer ?? null;

  return (
    <SafeAreaView
      style={styles.container}
      testID="imported-score-practice-screen"
    >
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
          onPress={toggleCursor}
          style={[
            styles.headerButton,
            cursorEnabled && styles.activeHeaderButton,
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            cursorEnabled ? "Disable cursor" : "Enable cursor"
          }
          // @ts-expect-error - title works on web for tooltip
          title="Follow Along Cursor"
        >
          <Feather
            name="crosshair"
            size={20}
            color={cursorEnabled ? colors.primary : colors.textSecondary}
          />
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
            ref={scorePreviewRef}
            musicXml={rawMusicXml}
            height={scorePreviewHeight}
            showZoomControls={false}
            enableCursor={cursorEnabled}
            fixedWidth={1200}
            autoScrollToCursor={true}
            horizontalStaffline={true}
            onRenderComplete={handleRenderComplete}
            onError={handleRenderError}
            testID="practice-score-preview"
          />
        )}
      </View>

      {/* Progress Display */}
      <ProgressDisplay
        currentMeasure={progress.currentMeasure}
        currentBeat={progress.currentBeat}
        totalMeasures={totalMeasures}
        beatsPerMeasure={config.beatsPerMeasure}
        countdownRemaining={progress.countdownRemaining}
        practiceState={practiceState}
      />

      {/* Tempo Control */}
      <TempoControl
        tempo={config.tempo}
        onTempoChange={setTempo}
        disabled={practiceState === "playing" || practiceState === "countdown"}
      />

      {/* Playback Controls */}
      <PlaybackControls
        practiceState={practiceState}
        onStart={start}
        onPause={pause}
        onResume={resume}
        onStop={stop}
        onRestart={restart}
        disabled={!isRendered}
      />
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
    borderRadius: 20,
  },
  activeHeaderButton: {
    backgroundColor: colors.primaryLight,
  },
  headerSpacer: {
    width: 32,
  },
  previewContainer: {
    // Explicit height is passed to ScorePreview for iOS WebView compatibility
  },
  progressDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  progressItem: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  progressDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  beatIndicators: {
    flexDirection: "row",
    gap: 6,
  },
  beatDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  activeBeat: {
    backgroundColor: colors.primary,
    transform: [{ scale: 1.2 }],
  },
  countdownContainer: {
    alignItems: "center",
  },
  countdownNumber: {
    fontSize: 48,
    fontWeight: "700",
    color: colors.primary,
  },
  countdownLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  tempoControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  tempoButton: {
    padding: spacing.sm,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tempoDisplay: {
    alignItems: "center",
    minWidth: 80,
    paddingHorizontal: spacing.md,
  },
  tempoValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  tempoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  playbackControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  playbackButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 32,
  },
  primaryPlaybackButton: {
    width: 64,
    height: 64,
    backgroundColor: colors.primary,
  },
  secondaryPlaybackButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
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

export default ImportedScorePracticeScreen;
