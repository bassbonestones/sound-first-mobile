/**
 * FormField - Reusable form input component
 * 
 * Used across admin screens for consistent form styling.
 */

import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { colors, spacing, fontSizes, borderRadius } from "../../styles/theme";

/**
 * FormField Component
 * 
 * @param {string} label - Field label
 * @param {string} value - Current value
 * @param {function} onChangeText - Change handler
 * @param {string} error - Error message (optional)
 * @param {string} placeholder - Placeholder text
 * @param {string} keyboardType - Keyboard type (default, numeric, etc.)
 * @param {string} autoCapitalize - Auto-capitalize mode
 * @param {boolean} multiline - Enable multiline input
 * @param {number} numberOfLines - Number of lines for multiline
 */
export function FormField({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "sentences",
  multiline = false,
  numberOfLines = 1,
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          error && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textDisabled}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        textAlignVertical={multiline ? "top" : "center"}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSizes.base,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
  },
  inputMultiline: {
    minHeight: 80,
    paddingTop: spacing.md,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    fontSize: fontSizes.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
});

export default FormField;
