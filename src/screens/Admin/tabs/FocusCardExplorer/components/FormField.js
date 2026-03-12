/**
 * FormField - Reusable form input field with multiline support
 */
import React from "react";
import PropTypes from "prop-types";
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
  multiline = false,
}) {
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

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChangeText: PropTypes.func.isRequired,
  error: PropTypes.string,
  placeholder: PropTypes.string,
  keyboardType: PropTypes.string,
  autoCapitalize: PropTypes.string,
  multiline: PropTypes.bool,
};
