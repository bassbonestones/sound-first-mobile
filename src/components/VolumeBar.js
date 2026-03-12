import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { View, Text, StyleSheet, Animated, Platform } from "react-native";

/**
 * VolumeBar Component - Visual volume indicator
 *
 * Shows a horizontal bar that grows/shrinks based on volume level.
 * Can change color to indicate pitch accuracy (green = correct, orange = off).
 *
 * Props:
 * - volume: Volume level 0-1 (required)
 * - pitchAccuracy: "correct" | "off" | "listening" | null
 * - label: Optional label text above the bar
 * - height: Bar height in pixels (default 20)
 * - animated: Whether to animate volume changes (default true)
 * - showPeakHold: Show peak volume indicator (default false)
 * - style: Additional container styles
 */

const COLORS = {
  correct: "#4CAF50", // Green - playing correct pitch
  off: "#FF9800", // Orange - playing wrong pitch
  listening: "#4A90D9", // Blue - just listening/singing
  inactive: "#E0E0E0", // Grey - no sound
  background: "#F5F5F5", // Background color
  peak: "#FFC107", // Yellow - peak indicator
};

export default function VolumeBar({
  volume = 0,
  pitchAccuracy = null,
  label = null,
  height = 20,
  animated = true,
  showPeakHold = false,
  style,
}) {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const peakRef = useRef(0);
  const peakDecayRef = useRef(null);

  // Animated volume bar
  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: volume,
        duration: 50,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(volume);
    }

    // Track peak
    if (showPeakHold && volume > peakRef.current) {
      peakRef.current = volume;
      // Decay peak after a short delay
      if (peakDecayRef.current) {
        clearTimeout(peakDecayRef.current);
      }
      peakDecayRef.current = setTimeout(() => {
        peakRef.current = Math.max(0, peakRef.current - 0.1);
      }, 500);
    }
  }, [volume, animated, showPeakHold]);

  // Determine bar color
  const getBarColor = () => {
    if (volume < 0.02) return COLORS.inactive;

    switch (pitchAccuracy) {
      case "correct":
        return COLORS.correct;
      case "off":
        return COLORS.off;
      case "listening":
      default:
        return COLORS.listening;
    }
  };

  const barColor = getBarColor();

  // Interpolate width percentage
  const widthPercent = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.barBackground, { height }]}>
        <Animated.View
          style={[
            styles.barFill,
            {
              width: widthPercent,
              backgroundColor: barColor,
              height: "100%",
            },
          ]}
        />
        {showPeakHold && peakRef.current > 0.02 && (
          <View
            style={[
              styles.peakIndicator,
              {
                left: `${peakRef.current * 100}%`,
                height: "100%",
              },
            ]}
          />
        )}

        {/* Segment markers for visual reference */}
        <View style={[styles.segmentMarker, { left: "25%" }]} />
        <View style={[styles.segmentMarker, { left: "50%" }]} />
        <View style={[styles.segmentMarker, { left: "75%" }]} />
      </View>

      {/* Status indicator text */}
      {pitchAccuracy === "correct" && volume > 0.02 && (
        <Text style={[styles.statusText, { color: COLORS.correct }]}>
          Great pitch!
        </Text>
      )}
      {pitchAccuracy === "off" && volume > 0.02 && (
        <Text style={[styles.statusText, { color: COLORS.off }]}>
          Adjust your pitch
        </Text>
      )}
    </View>
  );
}

VolumeBar.propTypes = {
  volume: PropTypes.number,
  pitchAccuracy: PropTypes.oneOf(["correct", "off", "listening", null]),
  label: PropTypes.string,
  height: PropTypes.number,
  animated: PropTypes.bool,
  showPeakHold: PropTypes.bool,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

/**
 * CircularVolumeIndicator - Alternative circular volume display
 *
 * Shows volume as a pulsing circle that changes color with pitch accuracy.
 */
export function CircularVolumeIndicator({
  volume = 0,
  pitchAccuracy = null,
  size = 100,
  style,
}) {
  const animatedScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Pulse animation based on volume
    const baseScale = 0.5;
    const maxScale = 1.0;
    const targetScale = baseScale + volume * (maxScale - baseScale);

    Animated.spring(animatedScale, {
      toValue: targetScale,
      friction: 5,
      tension: 100,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [volume]);

  const getColor = () => {
    if (volume < 0.02) return COLORS.inactive;
    switch (pitchAccuracy) {
      case "correct":
        return COLORS.correct;
      case "off":
        return COLORS.off;
      default:
        return COLORS.listening;
    }
  };

  return (
    <View
      style={[styles.circularContainer, { width: size, height: size }, style]}
    >
      <Animated.View
        style={[
          styles.circularIndicator,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: getColor(),
            transform: [{ scale: animatedScale }],
            opacity: volume > 0.02 ? 0.8 : 0.3,
          },
        ]}
      />
      {volume > 0.02 && pitchAccuracy === "correct" && (
        <Text style={styles.circularText}></Text>
      )}
    </View>
  );
}

CircularVolumeIndicator.propTypes = {
  volume: PropTypes.number,
  pitchAccuracy: PropTypes.oneOf(["correct", "off", "listening", null]),
  size: PropTypes.number,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
    textAlign: "center",
  },
  barBackground: {
    width: "100%",
    backgroundColor: COLORS.background,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  barFill: {
    borderRadius: 10,
    position: "absolute",
    left: 0,
    top: 0,
  },
  peakIndicator: {
    position: "absolute",
    width: 3,
    backgroundColor: COLORS.peak,
    marginLeft: -1.5,
  },
  segmentMarker: {
    position: "absolute",
    width: 1,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  statusText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    fontWeight: "500",
  },
  circularContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  circularIndicator: {
    position: "absolute",
  },
  circularText: {
    fontSize: 24,
  },
});
