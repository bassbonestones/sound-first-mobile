import React, { useEffect, useRef, useMemo } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Platform,
  ViewStyle,
  StyleProp,
} from "react-native";

/**
 * EDMVisualizer - Exciting audio-reactive visualization
 *
 * Creates a dynamic, EDM-style audio spectrum display with:
 * - Multiple animated bars
 * - Neon glow effects
 * - Pulsing/bouncing animations
 * - Color changes based on pitch accuracy
 */

type PitchAccuracy = "correct" | "off" | "listening" | null;

interface ColorScheme {
  primary: string;
  secondary: string;
  glow: string;
}

interface NeonColors {
  correct: ColorScheme;
  off: ColorScheme;
  listening: ColorScheme;
  inactive: ColorScheme;
}

const NEON_COLORS: NeonColors = {
  correct: {
    primary: "#00FF88", // Bright neon green
    secondary: "#00CC66",
    glow: "rgba(0, 255, 136, 0.6)",
  },
  off: {
    primary: "#FF6B35", // Bright orange
    secondary: "#FF4500",
    glow: "rgba(255, 107, 53, 0.6)",
  },
  listening: {
    primary: "#00D4FF", // Cyan/electric blue
    secondary: "#0099CC",
    glow: "rgba(0, 212, 255, 0.6)",
  },
  inactive: {
    primary: "#4A4A5A",
    secondary: "#3A3A4A",
    glow: "rgba(74, 74, 90, 0.3)",
  },
};

interface AnimatedBarProps {
  index: number;
  volume: number;
  colorScheme: ColorScheme;
  maxHeight: number;
  width: number;
}

// Individual bar component with animation
function AnimatedBar({
  index,
  volume,
  colorScheme,
  maxHeight,
  width,
}: AnimatedBarProps): React.ReactElement {
  const heightAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  // Calculate this bar's target height based on position and volume
  // Create a more organic wave pattern
  const targetHeight = useMemo(() => {
    if (volume < 0.02) return 0.05; // Minimum visible height

    // Create varied heights across bars
    const baseHeight = volume;
    const positionFactor = Math.sin(
      (index / 16) * Math.PI * 2 + Date.now() / 200,
    );
    const randomVariation = 0.3 + Math.random() * 0.4;

    return Math.min(
      1,
      baseHeight * (0.6 + positionFactor * 0.4) * randomVariation,
    );
  }, [volume, index]);

  useEffect(() => {
    // Animate height with spring for bounce effect
    Animated.spring(heightAnim, {
      toValue: targetHeight,
      friction: 4,
      tension: 200,
      useNativeDriver: false,
    }).start();

    // Pulse glow based on volume
    Animated.timing(glowAnim, {
      toValue: volume > 0.1 ? 0.8 : 0.3,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [targetHeight, volume, heightAnim, glowAnim]);

  const barHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [maxHeight * 0.05, maxHeight],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.barContainer, { width }]}>
      <Animated.View
        style={[
          styles.bar,
          {
            height: barHeight,
            backgroundColor: colorScheme.primary,
            width: width - 2,
            // Glow effect via shadow (native only - web uses CSS)
            ...(Platform.OS !== "web"
              ? {
                  shadowColor: colorScheme.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: glowAnim as unknown as number,
                  shadowRadius: 8,
                }
              : {}),
            // Additional glow layers
            borderColor: colorScheme.glow,
            borderWidth: 1,
          },
        ]}
      />
      {/* Reflection effect */}
      <Animated.View
        style={[
          styles.barReflection,
          {
            height: Animated.multiply(barHeight, 0.3),
            backgroundColor: colorScheme.secondary,
            width: width - 2,
            opacity: 0.3,
          },
        ]}
      />
    </View>
  );
}

interface PulseRingProps {
  volume: number;
  colorScheme: ColorScheme;
  size: number;
}

// Circular pulse ring effect
function PulseRing({
  volume,
  colorScheme,
  size,
}: PulseRingProps): React.ReactElement {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (volume > 0.1) {
      // Pulse outward
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.2 + volume * 0.5,
          duration: 150,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]).start(() => {
        // Shrink back
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: Platform.OS !== "web",
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: Platform.OS !== "web",
          }),
        ]).start();
      });
    }
  }, [volume, scaleAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: colorScheme.primary,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    />
  );
}

interface EDMVisualizerProps {
  volume?: number;
  pitchAccuracy?: PitchAccuracy;
  barCount?: number;
  style?: StyleProp<ViewStyle>;
}

interface BarConfig {
  index: number;
  key: number;
}

const EDMVisualizer = React.memo(function EDMVisualizer({
  volume = 0,
  pitchAccuracy = null,
  barCount = 16,
  style,
}: EDMVisualizerProps): React.ReactElement {
  // Get color scheme based on state
  const colorScheme = useMemo<ColorScheme>(() => {
    if (volume < 0.02) return NEON_COLORS.inactive;
    switch (pitchAccuracy) {
      case "correct":
        return NEON_COLORS.correct;
      case "off":
        return NEON_COLORS.off;
      default:
        return NEON_COLORS.listening;
    }
  }, [volume, pitchAccuracy]);

  // Generate bar configs
  const bars = useMemo<BarConfig[]>(() => {
    return Array.from({ length: barCount }, (_, i) => ({
      index: i,
      key: i,
    }));
  }, [barCount]);

  const barWidth = 280 / barCount;
  const maxBarHeight = 120;

  return (
    <View style={[styles.container, style]}>
      {/* Background glow */}
      <View
        style={[styles.backgroundGlow, { backgroundColor: colorScheme.glow }]}
      />

      {/* Pulse rings */}
      <View style={styles.pulseContainer}>
        <PulseRing volume={volume} colorScheme={colorScheme} size={180} />
        <PulseRing volume={volume * 0.8} colorScheme={colorScheme} size={220} />
      </View>

      {/* Spectrum bars */}
      <View style={styles.barsWrapper}>
        {bars.map((bar) => (
          <AnimatedBar
            key={bar.key}
            index={bar.index}
            volume={volume}
            colorScheme={colorScheme}
            maxHeight={maxBarHeight}
            width={barWidth}
          />
        ))}
      </View>

      {/* Center orb */}
      <Animated.View
        style={[
          styles.centerOrb,
          {
            backgroundColor: colorScheme.primary,
            ...(Platform.OS !== "web"
              ? { shadowColor: colorScheme.primary }
              : {}),
            transform: [{ scale: 0.8 + volume * 0.4 }],
          },
        ]}
      />
    </View>
  );
});

export default EDMVisualizer;

// Medium version - smaller but keeps pulse rings and orb
export const EDMVisualizerMedium = React.memo(function EDMVisualizerMedium({
  volume = 0,
  pitchAccuracy = null,
  barCount = 12,
  style,
}: EDMVisualizerProps): React.ReactElement {
  const colorScheme = useMemo<ColorScheme>(() => {
    if (volume < 0.02) return NEON_COLORS.inactive;
    switch (pitchAccuracy) {
      case "correct":
        return NEON_COLORS.correct;
      case "off":
        return NEON_COLORS.off;
      default:
        return NEON_COLORS.listening;
    }
  }, [volume, pitchAccuracy]);

  const bars = useMemo<BarConfig[]>(() => {
    return Array.from({ length: barCount }, (_, i) => ({
      index: i,
      key: i,
    }));
  }, [barCount]);

  const barWidth = 140 / barCount;
  const maxBarHeight = 50;

  return (
    <View style={[styles.mediumContainer, style]}>
      {/* Background glow */}
      <View
        style={[styles.backgroundGlow, { backgroundColor: colorScheme.glow }]}
      />

      {/* Pulse rings - smaller */}
      <View style={styles.pulseContainer}>
        <PulseRing volume={volume} colorScheme={colorScheme} size={80} />
        <PulseRing volume={volume * 0.8} colorScheme={colorScheme} size={100} />
      </View>

      {/* Spectrum bars */}
      <View style={styles.mediumBarsWrapper}>
        {bars.map((bar) => (
          <AnimatedBar
            key={bar.key}
            index={bar.index}
            volume={volume}
            colorScheme={colorScheme}
            maxHeight={maxBarHeight}
            width={barWidth}
          />
        ))}
      </View>

      {/* Center orb - smaller */}
      <Animated.View
        style={[
          styles.mediumOrb,
          {
            backgroundColor: colorScheme.primary,
            ...(Platform.OS !== "web"
              ? { shadowColor: colorScheme.primary }
              : {}),
            transform: [{ scale: 0.8 + volume * 0.4 }],
          },
        ]}
      />
    </View>
  );
});

interface EDMVisualizerCompactProps extends EDMVisualizerProps {
  width?: number;
  height?: number;
}

// Compact version for inline use
export const EDMVisualizerCompact = React.memo(function EDMVisualizerCompact({
  volume = 0,
  pitchAccuracy = null,
  barCount = 8,
  width = 200,
  height = 60,
  style,
}: EDMVisualizerCompactProps): React.ReactElement {
  const colorScheme = useMemo<ColorScheme>(() => {
    if (volume < 0.02) return NEON_COLORS.inactive;
    switch (pitchAccuracy) {
      case "correct":
        return NEON_COLORS.correct;
      case "off":
        return NEON_COLORS.off;
      default:
        return NEON_COLORS.listening;
    }
  }, [volume, pitchAccuracy]);

  const bars = useMemo<BarConfig[]>(() => {
    return Array.from({ length: barCount }, (_, i) => ({
      index: i,
      key: i,
    }));
  }, [barCount]);

  const barWidth = width / barCount;

  return (
    <View style={[styles.compactContainer, { width, height }, style]}>
      <View style={[styles.compactBars, { height: height - 10 }]}>
        {bars.map((bar) => (
          <AnimatedBar
            key={bar.key}
            index={bar.index}
            volume={volume}
            colorScheme={colorScheme}
            maxHeight={height - 10}
            width={barWidth}
          />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: 300,
    height: 250,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a0a12",
    borderRadius: 20,
    overflow: "hidden",
    padding: 10,
  },
  backgroundGlow: {
    position: "absolute",
    width: "150%",
    height: "150%",
    borderRadius: 200,
    opacity: 0.15,
  },
  pulseContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  barsWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 140,
    paddingHorizontal: 10,
  },
  barContainer: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bar: {
    borderRadius: 3,
    marginHorizontal: 1,
  },
  barReflection: {
    borderRadius: 3,
    marginHorizontal: 1,
    marginTop: 2,
    transform: [{ scaleY: -1 }],
  },
  centerOrb: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    ...Platform.select({
      web: {},
      default: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 15,
      },
    }),
  },
  mediumContainer: {
    width: 160,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a0a12",
    borderRadius: 12,
    overflow: "hidden",
    padding: 6,
  },
  mediumBarsWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 55,
    paddingHorizontal: 5,
  },
  mediumOrb: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    ...Platform.select({
      web: {},
      default: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 10,
      },
    }),
  },
  compactContainer: {
    backgroundColor: "#0a0a12",
    borderRadius: 12,
    overflow: "hidden",
    padding: 5,
  },
  compactBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
  },
});
