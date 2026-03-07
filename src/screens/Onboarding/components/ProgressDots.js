/**
 * Progress Dots Component
 *
 * Displays step progress indicators at the bottom of onboarding screens.
 */

import React from "react";
import { View } from "react-native";

const TOTAL_STEPS = 2;

export default function ProgressDots({ currentStep }) {
  return (
    <View style={{ flexDirection: "row", marginTop: 16 }}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
        <View
          key={s}
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: currentStep === s ? "#FFD700" : "#3b2c1a",
            marginHorizontal: 4,
            borderWidth: 1,
            borderColor: "#FFD700",
          }}
        />
      ))}
    </View>
  );
}
