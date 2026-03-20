/**
 * ComposerTransport Component
 *
 * Playback controls: play/pause/stop, tempo display, position indicator.
 */

import React, { memo, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  AccessibilityRole,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";
import type {
  PlaybackState,
  PlaybackPosition,
} from "../hooks/useComposerPlayback";

// =============================================================================
// Types
// =============================================================================

export interface ComposerTransportProps {
  /** Current playback state */
  state: PlaybackState;
  /** Current playback position */
  position: PlaybackPosition;
  /** Current tempo in BPM */
  tempo: number;
  /** Total measure count */
  totalMeasures: number;
  /** Called when play is pressed */
  onPlay: () => void;
  /** Called when pause is pressed */
  onPause: () => void;
  /** Called when stop is pressed */
  onStop: () => void;
  /** Called when play from cursor is pressed */
  onPlayFromCursor?: () => void;
  /** Called when play measure is pressed */
  onPlayMeasure?: () => void;
  /** Whether controls are disabled */
  disabled?: boolean;
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// Component
// =============================================================================

function ComposerTransportComponent({
  state,
  position,
  tempo,
  totalMeasures,
  onPlay,
  onPause,
  onStop,
  onPlayFromCursor,
  onPlayMeasure,
  disabled = false,
  testID,
}: ComposerTransportProps): React.ReactElement {
  const isPlaying = state === "playing";
  const isPaused = state === "paused";
  const isStopped = state === "stopped";

  const handlePlayPause = useCallback(() => {
    if (disabled) return;
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  }, [disabled, isPlaying, onPause, onPlay]);

  const handleStop = useCallback(() => {
    if (disabled) return;
    onStop();
  }, [disabled, onStop]);

  const handlePlayFromCursor = useCallback(() => {
    if (disabled || !onPlayFromCursor) return;
    onPlayFromCursor();
  }, [disabled, onPlayFromCursor]);

  const handlePlayMeasure = useCallback(() => {
    if (disabled || !onPlayMeasure) return;
    onPlayMeasure();
  }, [disabled, onPlayMeasure]);

  // Format position display
  const positionDisplay = `${position.measureIndex + 1} / ${totalMeasures}`;

  return (
    <View style={styles.container} testID={testID}>
      {/* Position indicator */}
      <View style={styles.positionContainer}>
        <Text style={styles.positionLabel}>Position</Text>
        <Text style={styles.positionValue}>{positionDisplay}</Text>
      </View>

      {/* Main transport buttons */}
      <View style={styles.buttonsContainer}>
        {/* Stop button */}
        <TouchableOpacity
          style={[
            styles.button,
            styles.stopButton,
            (isStopped || disabled) && styles.buttonDisabled,
          ]}
          onPress={handleStop}
          disabled={isStopped || disabled}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel="Stop playback"
          accessibilityState={{ disabled: isStopped || disabled }}
          testID="transport-stop"
        >
          <Feather
            name="square"
            size={20}
            color={
              !isStopped && !disabled ? colors.error : colors.textSecondary
            }
          />
        </TouchableOpacity>

        {/* Play/Pause button */}
        <TouchableOpacity
          style={[
            styles.button,
            styles.playButton,
            disabled && styles.buttonDisabled,
          ]}
          onPress={handlePlayPause}
          disabled={disabled}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel={isPlaying ? "Pause" : "Play"}
          accessibilityState={{ disabled }}
          testID="transport-play"
        >
          <Feather
            name={isPlaying ? "pause" : "play"}
            size={28}
            color={disabled ? colors.textSecondary : colors.white}
          />
        </TouchableOpacity>

        {/* Play measure button (optional) */}
        {onPlayMeasure && (
          <TouchableOpacity
            style={[
              styles.button,
              styles.secondaryButton,
              disabled && styles.buttonDisabled,
            ]}
            onPress={handlePlayMeasure}
            disabled={disabled}
            accessibilityRole={"button" as AccessibilityRole}
            accessibilityLabel="Play current measure"
            accessibilityState={{ disabled }}
            testID="transport-play-measure"
          >
            <Feather
              name="repeat"
              size={18}
              color={disabled ? colors.textSecondary : colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Tempo display */}
      <View style={styles.tempoContainer}>
        <Text style={styles.tempoLabel}>Tempo</Text>
        <Text style={styles.tempoValue}>{tempo} BPM</Text>
      </View>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  positionContainer: {
    alignItems: "center",
    minWidth: 60,
  },
  positionLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  positionValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  buttonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  stopButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playButton: {
    width: 56,
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 28,
  },
  secondaryButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  tempoContainer: {
    alignItems: "center",
    minWidth: 60,
  },
  tempoLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tempoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
});

// =============================================================================
// Export
// =============================================================================

export const ComposerTransport = memo(ComposerTransportComponent);
