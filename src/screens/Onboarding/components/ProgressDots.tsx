/**
 * Progress Dots Component
 *
 * Displays step progress indicators at the bottom of onboarding screens.
 */

import React from "react";
import { View, StyleSheet } from "react-native";

const TOTAL_STEPS = 2;

interface ProgressDotsProps {
  currentStep: number;
}

export default function ProgressDots({ currentStep }: ProgressDotsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
        <View
          key={s}
          style={[styles.dot, currentStep === s && styles.dotActive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginTop: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3b2c1a",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  dotActive: {
    backgroundColor: "#FFD700",
  },
});
