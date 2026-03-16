/**
 * DetailRow - Simple label/value row for detail views
 */
import React from "react";
import { View, Text, StyleProp, TextStyle } from "react-native";
import styles from "../../../styles";

interface DetailRowProps {
  label: string;
  value?: string | number;
  valueStyle?: StyleProp<TextStyle>;
}

export default function DetailRow({
  label,
  value,
  valueStyle,
}: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={[styles.detailValue, valueStyle]}>{value}</Text>
    </View>
  );
}
