/**
 * FormField - Reusable form input component
 *
 * Used across admin screens for consistent form styling.
 */

import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  KeyboardTypeOptions,
} from "react-native";
import { colors, spacing, fontSizes, borderRadius } from "../../styles/theme";

/**
 * Props for FormField component
 */
export interface FormFieldProps {
  /** Field label */
  label: string;
  /** Current value */
  value?: string;
  /** Change handler */
  onChangeText: (text: string) => void;
  /** Error message (optional) */
  error?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Keyboard type (default, numeric, etc.) */
  keyboardType?: KeyboardTypeOptions;
  /** Auto-capitalize mode */
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  /** Enable multiline input */
  multiline?: boolean;
  /** Number of lines for multiline */
  numberOfLines?: number;
}

/**
 * FormField Component
 *
 * Provides a styled text input with label and optional error display.
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
}: FormFieldProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          error ? styles.inputError : undefined,
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

interface Styles {
  container: ViewStyle;
  label: TextStyle;
  input: ViewStyle & TextStyle;
  inputMultiline: ViewStyle;
  inputError: ViewStyle;
  error: TextStyle;
}

const styles = StyleSheet.create<Styles>({
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
