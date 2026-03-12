/**
 * KeyBadge - Score badge for a single key
 */
import React from "react";
import PropTypes from "prop-types";
import { View, Text, StyleSheet } from "react-native";

export default function KeyBadge({
  keyName,
  score,
  attempts,
  masteryThreshold = 95,
}) {
  const isMastered = score >= masteryThreshold;
  const isStarted = attempts > 0;

  // Color gradient based on score
  const getScoreColor = () => {
    if (!isStarted) return "#444";
    if (isMastered) return "#4CAF50";
    if (score >= 80) return "#8BC34A";
    if (score >= 60) return "#FFC107";
    if (score >= 40) return "#FF9800";
    if (score >= 20) return "#FF5722";
    return "#F44336";
  };

  return (
    <View style={[styles.container, { borderColor: getScoreColor() }]}>
      <Text style={styles.keyName}>{keyName}</Text>
      <Text style={[styles.score, { color: getScoreColor() }]}>
        {isStarted ? score : "-"}
      </Text>
    </View>
  );
}

KeyBadge.propTypes = {
  keyName: PropTypes.string.isRequired,
  score: PropTypes.number.isRequired,
  attempts: PropTypes.number.isRequired,
  masteryThreshold: PropTypes.number,
};

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
