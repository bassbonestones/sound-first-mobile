/**
 * KeyBadge - Score badge for a single key
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export interface KeyBadgeProps {
  keyName: string;
  score: number;
  attempts: number;
  masteryThreshold?: number;
}

const KeyBadge = React.memo(function KeyBadge({
  keyName,
  score,
  attempts,
  masteryThreshold = 95,
}: KeyBadgeProps): React.JSX.Element {
  const isMastered = score >= masteryThreshold;
  const isStarted = attempts > 0;

  // Color gradient based on score
  const getScoreColor = (): string => {
    if (!isStarted) return "#444";
    if (isMastered) return "#4CAF50";
    if (score >= 80) return "#8BC34A";
    if (score >= 60) return "#FFC107";
    if (score >= 40) return "#FF9800";
    if (score >= 20) return "#FF5722";
    return "#F44336";
  };

  return (
    <View
      style={[styles.container, { borderColor: getScoreColor() }]}
      accessible={true}
      accessibilityLabel={`Key ${keyName}, ${isStarted ? `score ${score}%${isMastered ? ", mastered" : ""}` : "not started"}`}
      accessibilityRole="text"
    >
      <Text style={styles.keyName}>{keyName}</Text>
      <Text style={[styles.score, { color: getScoreColor() }]}>
        {isStarted ? score : "-"}
      </Text>
    </View>
  );
});

export default KeyBadge;

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  keyName: {
    color: "#888",
    fontSize: 10,
    fontWeight: "600",
  },
  score: {
    fontSize: 14,
    fontWeight: "bold",
  },
});
