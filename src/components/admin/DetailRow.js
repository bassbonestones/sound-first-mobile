/**
 * DetailRow - Label/value pair display component
 * 
 * Used in detail views to display information.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, fontSizes } from "../../styles/theme";

/**
 * DetailRow Component
 * 
 * @param {string} label - Field label
 * @param {any} value - Field value
 * @param {object} valueStyle - Additional style for value text
 */
export function DetailRow({ label, value, valueStyle }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={[styles.value, valueStyle]}>
        {value !== null && value !== undefined ? String(value) : "-"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    width: 140,
  },
  value: {
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    flex: 1,
    fontWeight: "500",
  },
});

export default DetailRow;
