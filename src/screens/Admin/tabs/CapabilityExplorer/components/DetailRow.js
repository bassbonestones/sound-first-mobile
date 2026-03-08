/**
 * DetailRow - Simple label/value row for detail views
 */
import React from "react";
import { View, Text } from "react-native";
import styles from "../../../styles";

export default function DetailRow({ label, value, valueStyle }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={[styles.detailValue, valueStyle]}>{value}</Text>
    </View>
  );
}
