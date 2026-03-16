/**
 * SessionTimer - Displays clock and session timer
 *
 * Memoized to prevent unnecessary re-renders. Only re-renders when
 * currentTime, elapsedSeconds, targetDurationSeconds, or isOverTime change.
 *
 * Shows:
 * - Current time: 12:30:45 PM
 * - Session timer: 00:05:30 / 00:20:00 (elapsed / target)
 */
import React, { memo } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";

interface SessionTimerProps {
  currentTime?: Date | null;
  elapsedSeconds: number;
  targetDurationSeconds: number;
  isOverTime?: boolean;
}

/**
 * Format seconds to HH:MM:SS
 */
function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return `${hh}:${mm}:${ss}`;
}

/**
 * Format Date to 12-hour clock: HH:MM:SS AM/PM
 */
function formatClock(date) {
  if (!date) return "--:--:-- --";

  let hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return `${hh}:${mm}:${ss} ${ampm}`;
}

function SessionTimer({
  currentTime,
  elapsedSeconds,
  targetDurationSeconds,
  isOverTime,
}: SessionTimerProps) {
  return (
    <View style={styles.container}>
      {/* Current Time Clock */}
      <View style={styles.clockContainer}>
        <Text style={styles.clockLabel}>🕐</Text>
        <Text style={styles.clockText}>{formatClock(currentTime)}</Text>
      </View>

      {/* Session Timer */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerLabel}>⏱️</Text>
        <Text style={[styles.timerText, isOverTime && styles.timerOverTime]}>
          {formatTime(elapsedSeconds)} / {formatTime(targetDurationSeconds)}
        </Text>
      </View>
    </View>
  );
}

export default memo(SessionTimer);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 8,
    marginBottom: 12,
  },
  clockContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  clockLabel: {
    fontSize: 14,
    marginRight: 6,
  },
  clockText: {
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: "#aaa",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timerLabel: {
    fontSize: 14,
    marginRight: 6,
  },
  timerText: {
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: "#FFD700",
    fontWeight: "600",
  },
  timerOverTime: {
    color: "#ff6b6b",
  },
});
