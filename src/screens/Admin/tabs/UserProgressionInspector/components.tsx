/**
 * Shared UI components for UserProgressionInspector tabs
 */
import React from "react";
import {
  View,
  Text,
  TextInput,
  TextStyle,
  KeyboardTypeOptions,
} from "react-native";
import styles from "../../styles";
import { localStyles } from "./styles";

interface DetailRowProps {
  label: string;
  value: string;
  valueStyle?: TextStyle;
}

/**
 * Read-only label/value row for displaying user data
 */
export function DetailRow({ label, value, valueStyle }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={[styles.detailValue, valueStyle]}>{value}</Text>
    </View>
  );
}

interface EditableRowProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
}

/**
 * Editable text input row for form editing
 */
export function EditableRow({
  label,
  value,
  onChange,
  placeholder,
  keyboardType = "default",
}: EditableRowProps) {
  return (
    <View style={localStyles.editableRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <TextInput
        style={localStyles.editInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#666"
        keyboardType={keyboardType}
      />
    </View>
  );
}
