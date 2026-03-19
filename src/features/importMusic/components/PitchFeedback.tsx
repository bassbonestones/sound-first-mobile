/**
 * PitchFeedback Component
 *
 * Real-time pitch feedback visualization for practice mode.
 * Shows current pitch detection status, target note, and accuracy.
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";
import type { PitchMatchState } from "../types/practiceTypes";

// ============================================================================
// Types
// ============================================================================

export interface PitchFeedbackProps {
  /** Current pitch match state */
  pitchState: PitchMatchState;
  /** Whether pitch detection is active */
  isActive: boolean;
  /** Whether to show compact mode (for landscape) */
  compact?: boolean;
  /** Test ID */
  testID?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getPitchStatusColor(state: PitchMatchState): string {
  if (!state.isSounding) {
    return colors.textSecondary;
  }
  if (state.isMatching) {
    return colors.success;
  }
  if (state.detectedMidiNote !== null) {
    // Show how far off
    const deviation = Math.abs(state.centsDeviation);
    if (deviation < 15) return colors.success;
    if (deviation < 30) return colors.warning;
    return colors.error;
  }
  return colors.textSecondary;
}

function getDeviationIndicator(cents: number): string {
  if (cents > 30) return "↑↑";
  if (cents > 10) return "↑";
  if (cents < -30) return "↓↓";
  if (cents < -10) return "↓";
  return "●";
}

function formatCents(cents: number): string {
  const rounded = Math.round(cents);
  if (rounded === 0) return "In tune";
  if (rounded > 0) return `+${rounded}¢ sharp`;
  return `${rounded}¢ flat`;
}

// ============================================================================
// Sub-components
// ============================================================================

interface PitchMeterProps {
  cents: number;
  isMatching: boolean;
  isSounding: boolean;
}

function PitchMeter({
  cents,
  isMatching,
  isSounding,
}: PitchMeterProps): React.ReactElement {
  // Clamp cents to -50 to +50 range for display
  const clampedCents = Math.max(-50, Math.min(50, cents));
  // Convert to percentage (-50 to +50 -> 0% to 100%)
  const percent = ((clampedCents + 50) / 100) * 100;

  const indicatorColor = !isSounding
    ? colors.textSecondary
    : isMatching
      ? colors.success
      : Math.abs(cents) < 15
        ? colors.warning
        : colors.error;

  return (
    <View style={styles.meterContainer}>
      {/* Flat/Sharp labels */}
      <Text style={styles.meterLabel}>♭</Text>

      {/* Meter track */}
      <View style={styles.meterTrack}>
        {/* Center marker */}
        <View style={styles.meterCenter} />

        {/* Tolerance zone */}
        <View style={styles.meterTolerance} />

        {/* Indicator needle */}
        {isSounding && (
          <View
            style={[
              styles.meterIndicator,
              { left: `${percent}%`, backgroundColor: indicatorColor },
            ]}
          />
        )}
      </View>

      <Text style={styles.meterLabel}>♯</Text>
    </View>
  );
}

interface VolumeIndicatorProps {
  volume: number;
  isSounding: boolean;
}

function VolumeIndicator({
  volume,
  isSounding,
}: VolumeIndicatorProps): React.ReactElement {
  // Clamp and scale volume
  const displayVolume = Math.min(1, Math.max(0, volume));
  const bars = 5;
  const activeBarCount = Math.ceil(displayVolume * bars);

  return (
    <View style={styles.volumeContainer}>
      {Array.from({ length: bars }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.volumeBar,
            {
              height: 6 + i * 3,
              backgroundColor:
                i < activeBarCount && isSounding
                  ? colors.primary
                  : colors.border,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function PitchFeedback({
  pitchState,
  isActive,
  compact = false,
  testID,
}: PitchFeedbackProps): React.ReactElement {
  const {
    targetNote,
    detectedNoteName,
    centsDeviation,
    isMatching,
    volume,
    isSounding,
  } = pitchState;

  const statusColor = useMemo(
    () => getPitchStatusColor(pitchState),
    [pitchState],
  );

  // Not active state
  if (!isActive) {
    return (
      <View
        style={[styles.container, compact && styles.containerCompact]}
        testID={testID}
      >
        <View style={styles.inactiveState}>
          <Feather name="mic-off" size={20} color={colors.textSecondary} />
          <Text style={styles.inactiveText}>Pitch detection off</Text>
        </View>
      </View>
    );
  }

  // Rest state (no target note expected)
  if (targetNote?.isRest) {
    return (
      <View
        style={[styles.container, compact && styles.containerCompact]}
        testID={testID}
      >
        <View style={styles.restState}>
          <Feather name="pause" size={20} color={colors.textSecondary} />
          <Text style={styles.restText}>Rest</Text>
        </View>
      </View>
    );
  }

  // Compact mode for landscape
  if (compact) {
    return (
      <View style={[styles.container, styles.containerCompact]} testID={testID}>
        <View style={styles.compactRow}>
          {/* Target */}
          <View style={styles.compactTarget}>
            <Text style={styles.compactLabel}>Target</Text>
            <Text style={styles.compactNote}>
              {targetNote?.noteName ?? "—"}
            </Text>
          </View>

          {/* Meter */}
          <View style={styles.compactMeter}>
            <PitchMeter
              cents={centsDeviation}
              isMatching={isMatching}
              isSounding={isSounding}
            />
          </View>

          {/* Detected */}
          <View style={styles.compactDetected}>
            <Text style={styles.compactLabel}>You</Text>
            <Text style={[styles.compactNote, { color: statusColor }]}>
              {isSounding && detectedNoteName ? detectedNoteName : "—"}
            </Text>
          </View>

          {/* Match indicator */}
          <View
            style={[
              styles.compactStatus,
              {
                backgroundColor: isMatching
                  ? colors.success + "20"
                  : colors.background,
              },
            ]}
          >
            <Feather
              name={isMatching ? "check" : isSounding ? "x" : "mic"}
              size={18}
              color={statusColor}
            />
          </View>
        </View>
      </View>
    );
  }

  // Full mode (portrait or more space)
  return (
    <View style={styles.container} testID={testID}>
      {/* Top row: Volume + Status */}
      <View style={styles.topRow}>
        <VolumeIndicator volume={volume} isSounding={isSounding} />
        <View
          style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}
        >
          <Feather
            name={
              isMatching ? "check-circle" : isSounding ? "alert-circle" : "mic"
            }
            size={14}
            color={statusColor}
          />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {isMatching
              ? "Match!"
              : isSounding
                ? getDeviationIndicator(centsDeviation)
                : "Listen..."}
          </Text>
        </View>
      </View>

      {/* Middle: Notes display */}
      <View style={styles.notesRow}>
        <View style={styles.noteBox}>
          <Text style={styles.noteLabel}>Target</Text>
          <Text style={styles.targetNote}>{targetNote?.noteName ?? "—"}</Text>
        </View>
        <View style={styles.arrowContainer}>
          <Feather
            name="arrow-right"
            size={24}
            color={isMatching ? colors.success : colors.textSecondary}
          />
        </View>
        <View style={styles.noteBox}>
          <Text style={styles.noteLabel}>Playing</Text>
          <Text style={[styles.detectedNote, { color: statusColor }]}>
            {isSounding && detectedNoteName ? detectedNoteName : "—"}
          </Text>
        </View>
      </View>

      {/* Pitch meter */}
      <PitchMeter
        cents={centsDeviation}
        isMatching={isMatching}
        isSounding={isSounding}
      />

      {/* Cents deviation text */}
      {isSounding && (
        <Text style={styles.centsText}>{formatCents(centsDeviation)}</Text>
      )}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  containerCompact: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  // Inactive/Rest states
  inactiveState: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  inactiveText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  restState: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  restText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  // Top row
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Volume indicator
  volumeContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    height: 20,
  },
  volumeBar: {
    width: 4,
    borderRadius: 2,
  },
  // Notes row
  notesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  noteBox: {
    alignItems: "center",
    minWidth: 80,
  },
  noteLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  targetNote: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  detectedNote: {
    fontSize: 28,
    fontWeight: "700",
  },
  arrowContainer: {
    paddingHorizontal: spacing.sm,
  },
  // Pitch meter
  meterContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  meterLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    width: 20,
    textAlign: "center",
  },
  meterTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    position: "relative",
    overflow: "hidden",
  },
  meterCenter: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.textSecondary,
    marginLeft: -1,
  },
  meterTolerance: {
    position: "absolute",
    left: "40%",
    right: "40%",
    top: 0,
    bottom: 0,
    backgroundColor: colors.success + "30",
    borderRadius: 4,
  },
  meterIndicator: {
    position: "absolute",
    top: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
  },
  centsText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
  },
  // Compact mode
  compactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  compactTarget: {
    alignItems: "center",
    minWidth: 50,
  },
  compactLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  compactNote: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  compactMeter: {
    flex: 1,
  },
  compactDetected: {
    alignItems: "center",
    minWidth: 50,
  },
  compactStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
