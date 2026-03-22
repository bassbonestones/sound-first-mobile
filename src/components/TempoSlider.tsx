/**
 * TempoSlider
 *
 * A tempo control component that respects BPM bounds from generated content.
 * Displays current tempo with slider constrained to valid range.
 */
import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import Slider from "@react-native-community/slider";

// =============================================================================
// Types
// =============================================================================

export interface TempoSliderProps {
  /** Current tempo in BPM */
  tempo: number;
  /** Tempo range [min, max] - if null, defaults to [40, 200] */
  tempoRange?: [number, number] | null;
  /** Called when tempo changes */
  onTempoChange: (bpm: number) => void;
  /** Optional label (default: "Tempo") */
  label?: string;
  /** Track color for filled portion */
  trackColor?: string;
  /** Thumb/handle color */
  thumbColor?: string;
  /** Whether the slider is disabled */
  disabled?: boolean;
  /** Custom container style */
  style?: ViewStyle;
  /** Accessibility label override */
  accessibilityLabel?: string;
}

// =============================================================================
// Constants
// =============================================================================

/** Default tempo range when none provided */
const DEFAULT_TEMPO_RANGE: [number, number] = [40, 200];

// =============================================================================
// Component
// =============================================================================

/**
 * TempoSlider - Adjustable tempo control within rhythm-appropriate bounds.
 *
 * Features:
 * - Respects tempo_range from generation response
 * - Shows current BPM with min/max labels
 * - Accessible with proper labels
 *
 * @example
 * <TempoSlider
 *   tempo={tempo}
 *   tempoRange={response?.tempo_range}
 *   onTempoChange={handleTempoChange}
 * />
 */
export function TempoSlider({
  tempo,
  tempoRange,
  onTempoChange,
  label = "Tempo",
  trackColor = "#FFD700",
  thumbColor = "#FFD700",
  disabled = false,
  style,
  accessibilityLabel,
}: TempoSliderProps): React.JSX.Element {
  const [minBpm, maxBpm] = tempoRange ?? DEFAULT_TEMPO_RANGE;

  // Clamp tempo to valid range on mount and when range changes
  const [localTempo, setLocalTempo] = useState(() =>
    Math.max(minBpm, Math.min(maxBpm, tempo)),
  );

  // Sync local tempo when props change
  useEffect(() => {
    const clamped = Math.max(minBpm, Math.min(maxBpm, tempo));
    setLocalTempo(clamped);
  }, [tempo, minBpm, maxBpm]);

  const handleValueChange = useCallback((value: number) => {
    const rounded = Math.round(value);
    setLocalTempo(rounded);
  }, []);

  const handleSlidingComplete = useCallback(
    (value: number) => {
      const rounded = Math.round(value);
      onTempoChange(rounded);
    },
    [onTempoChange],
  );

  const effectiveAccessibilityLabel =
    accessibilityLabel ??
    `${label} slider, ${localTempo} BPM, range ${minBpm} to ${maxBpm}`;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.tempoValue}>{localTempo} BPM</Text>
      </View>
      <View style={styles.sliderRow}>
        <Text style={styles.rangeLabel}>{minBpm}</Text>
        <Slider
          style={styles.slider}
          minimumValue={minBpm}
          maximumValue={maxBpm}
          value={localTempo}
          onValueChange={handleValueChange}
          onSlidingComplete={handleSlidingComplete}
          minimumTrackTintColor={trackColor}
          maximumTrackTintColor="#444"
          thumbTintColor={thumbColor}
          disabled={disabled}
          accessibilityLabel={effectiveAccessibilityLabel}
          accessibilityRole="adjustable"
        />
        <Text style={styles.rangeLabel}>{maxBpm}</Text>
      </View>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

interface Styles {
  container: ViewStyle;
  labelRow: ViewStyle;
  label: TextStyle;
  tempoValue: TextStyle;
  sliderRow: ViewStyle;
  slider: ViewStyle;
  rangeLabel: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    paddingVertical: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
  tempoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFD700",
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
  },
  rangeLabel: {
    fontSize: 12,
    color: "#666",
    minWidth: 30,
    textAlign: "center",
  },
});

export default TempoSlider;
