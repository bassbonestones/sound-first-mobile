/**
 * FormField - Reusable form input component
 */
import React from "react";
import { View, Text, TextInput } from "react-native";
import styles from "../../../styles";

export default function FormField({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "sentences",
}) {
  return (
    <View style={styles.formFieldContainer}>
      <Text style={styles.formFieldLabel}>{label}</Text>
      <TextInput
        style={[styles.formFieldInput, error && styles.formFieldInputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
      {error && <Text style={styles.formFieldError}>{error}</Text>}
    </View>
  );
}
