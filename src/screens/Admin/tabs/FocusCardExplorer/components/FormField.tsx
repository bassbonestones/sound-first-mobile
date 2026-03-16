/**
 * FormField - Reusable form input field with multiline support
 */
import React from "react";
import { View, Text, TextInput, KeyboardTypeOptions } from "react-native";
import styles from "../../../styles";

interface FormFieldProps {
  label: string;
  value?: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
}

export default function FormField({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "sentences",
  multiline = false,
}: FormFieldProps) {
  return (
    <View style={styles.formFieldContainer}>
      <Text style={styles.formFieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.formFieldInput,
          error && styles.formFieldInputError,
          multiline && { minHeight: 60, textAlignVertical: "top" },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
      />
      {error && <Text style={styles.formFieldError}>{error}</Text>}
    </View>
  );
}
