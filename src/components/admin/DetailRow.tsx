/**
 * DetailRow - Label/value pair display component
 *
 * Used in detail views to display information.
 */

import React from "react";
import { View, Text, StyleSheet, TextStyle, ViewStyle } from "react-native";
import { colors, spacing, fontSizes } from "../../styles/theme";

/**
 * Props for DetailRow component
 */
export interface DetailRowProps {
  /** Field label */
  label: string;
  /** Field value */
  value?: string | number | boolean | null;
  /** Additional style for value text */
  valueStyle?: TextStyle;
}

/**
 * DetailRow Component
 *
 * Displays a labeled value in a horizontal row layout.
 */
export function DetailRow({
  label,
  value,
  valueStyle,
}: DetailRowProps): React.ReactElement {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={[styles.value, valueStyle]}>
        {value !== null && value !== undefined ? String(value) : "-"}
      </Text>
    </View>
  );
}

interface Styles {
  row: ViewStyle;
  label: TextStyle;
  value: TextStyle;
}

const styles = StyleSheet.create<Styles>({
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
