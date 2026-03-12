/**
 * DetailRow - Simple label/value row for detail views
 */
import React from "react";
import PropTypes from "prop-types";
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

DetailRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  valueStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};
