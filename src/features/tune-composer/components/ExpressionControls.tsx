/**
 * ExpressionControls Component
 *
 * Controls for adding expression/text markings on notes.
 * Common uses: tempo markings (Allegro, Andante), character (dolce, espressivo),
 * technique markings (pizz., arco), or any custom text.
 */

import React, { memo, useState, useCallback, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  AccessibilityRole,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";

// =============================================================================
// Types
// =============================================================================

export interface ExpressionControlsProps {
  /** Whether expression mode is currently active */
  expressionModeActive: boolean;
  /** Toggle expression mode on/off */
  onToggleExpressionMode: () => void;
  /** Current expression text on selected note */
  currentExpression: string;
  /** Set expression on current note */
  onSetExpression: (text: string) => void;
  /** Remove expression from current note */
  onRemoveExpression: () => void;
  /** Whether there's a note selected */
  hasSelection: boolean;
  /** Whether controls are disabled */
  disabled?: boolean;
  /** Test ID for testing */
  testID?: string;
}

// Common expression text presets
const TEMPO_PRESETS = [
  "Allegro",
  "Andante",
  "Adagio",
  "Presto",
  "Moderato",
  "Largo",
];
const CHARACTER_PRESETS = [
  "dolce",
  "espressivo",
  "cantabile",
  "con brio",
  "legato",
];
const TECHNIQUE_PRESETS = [
  "pizz.",
  "arco",
  "sul G",
  "sul ponticello",
  "con sordino",
];

// =============================================================================
// Component
// =============================================================================

function ExpressionControlsComponent({
  expressionModeActive,
  onToggleExpressionMode,
  currentExpression,
  onSetExpression,
  onRemoveExpression,
  hasSelection,
  disabled = false,
  testID,
}: ExpressionControlsProps): React.ReactElement {
  const [inputText, setInputText] = useState(currentExpression);
  const [activeCategory, setActiveCategory] = useState<
    "tempo" | "character" | "technique" | null
  >(null);
  const isDisabled = disabled || !hasSelection;

  // Sync input text with current expression when note changes
  useEffect(() => {
    setInputText(currentExpression);
  }, [currentExpression]);

  // Handle text change
  const handleTextChange = useCallback((text: string) => {
    setInputText(text);
  }, []);

  // Handle apply button
  const handleApply = useCallback(() => {
    if (inputText.trim()) {
      onSetExpression(inputText.trim());
    }
  }, [inputText, onSetExpression]);

  // Handle clear button
  const handleClear = useCallback(() => {
    setInputText("");
    onRemoveExpression();
  }, [onRemoveExpression]);

  // Handle preset selection
  const handlePresetSelect = useCallback(
    (preset: string) => {
      setInputText(preset);
      onSetExpression(preset);
    },
    [onSetExpression],
  );

  // Get presets for active category
  const getPresets = () => {
    switch (activeCategory) {
      case "tempo":
        return TEMPO_PRESETS;
      case "character":
        return CHARACTER_PRESETS;
      case "technique":
        return TECHNIQUE_PRESETS;
      default:
        return [];
    }
  };

  // When not in expression mode, just show the toggle button
  if (!expressionModeActive) {
    return (
      <View style={styles.container} testID={testID}>
        <TouchableOpacity
          style={[styles.toggleButton, isDisabled && styles.buttonDisabled]}
          onPress={onToggleExpressionMode}
          disabled={isDisabled}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel="Add expression text"
          testID="expression-mode-toggle"
        >
          <Feather name="type" size={16} color={colors.primary} />
          <Text
            style={[styles.toggleLabel, isDisabled && styles.labelDisabled]}
          >
            Expression
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // In expression mode, show full controls
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.expressionModeContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Feather name="type" size={16} color={colors.primary} />
          <Text style={styles.headerLabel}>Expression Text</Text>
        </View>

        {/* Text input row */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={handleTextChange}
            onSubmitEditing={handleApply}
            placeholder="Enter text..."
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!disabled}
            testID="expression-text-input"
          />
          <TouchableOpacity
            style={[
              styles.applyButton,
              !inputText.trim() && styles.buttonDisabled,
            ]}
            onPress={handleApply}
            disabled={!inputText.trim()}
            accessibilityRole={"button" as AccessibilityRole}
            accessibilityLabel="Apply expression"
            testID="expression-apply"
          >
            <Feather name="check" size={18} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.clearButton,
              !currentExpression && styles.buttonDisabled,
            ]}
            onPress={handleClear}
            disabled={!currentExpression}
            accessibilityRole={"button" as AccessibilityRole}
            accessibilityLabel="Clear expression"
            testID="expression-clear"
          >
            <Feather name="x" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Category buttons */}
        <View style={styles.categoryRow}>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              activeCategory === "tempo" && styles.categoryButtonActive,
            ]}
            onPress={() =>
              setActiveCategory(activeCategory === "tempo" ? null : "tempo")
            }
            accessibilityRole={"button" as AccessibilityRole}
            accessibilityLabel="Tempo presets"
            testID="expression-category-tempo"
          >
            <Text
              style={[
                styles.categoryButtonText,
                activeCategory === "tempo" && styles.categoryButtonTextActive,
              ]}
            >
              Tempo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              activeCategory === "character" && styles.categoryButtonActive,
            ]}
            onPress={() =>
              setActiveCategory(
                activeCategory === "character" ? null : "character",
              )
            }
            accessibilityRole={"button" as AccessibilityRole}
            accessibilityLabel="Character presets"
            testID="expression-category-character"
          >
            <Text
              style={[
                styles.categoryButtonText,
                activeCategory === "character" &&
                  styles.categoryButtonTextActive,
              ]}
            >
              Character
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              activeCategory === "technique" && styles.categoryButtonActive,
            ]}
            onPress={() =>
              setActiveCategory(
                activeCategory === "technique" ? null : "technique",
              )
            }
            accessibilityRole={"button" as AccessibilityRole}
            accessibilityLabel="Technique presets"
            testID="expression-category-technique"
          >
            <Text
              style={[
                styles.categoryButtonText,
                activeCategory === "technique" &&
                  styles.categoryButtonTextActive,
              ]}
            >
              Technique
            </Text>
          </TouchableOpacity>
        </View>

        {/* Preset buttons (if category selected) */}
        {activeCategory && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.presetScroll}
            contentContainerStyle={styles.presetContainer}
          >
            {getPresets().map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetButton,
                  currentExpression === preset && styles.presetButtonActive,
                ]}
                onPress={() => handlePresetSelect(preset)}
                accessibilityRole={"button" as AccessibilityRole}
                accessibilityLabel={`Select ${preset}`}
                testID={`expression-preset-${preset}`}
              >
                <Text
                  style={[
                    styles.presetButtonText,
                    currentExpression === preset &&
                      styles.presetButtonTextActive,
                  ]}
                >
                  {preset}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Exit button */}
        <TouchableOpacity
          style={styles.exitButton}
          onPress={onToggleExpressionMode}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel="Exit expression mode"
          testID="expression-exit"
        >
          <Text style={styles.exitButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  labelDisabled: {
    color: colors.textSecondary,
  },
  expressionModeContainer: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  headerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    flex: 1,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  textInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  applyButton: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  categoryButtonTextActive: {
    color: colors.white,
  },
  presetScroll: {
    marginBottom: spacing.sm,
  },
  presetContainer: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  presetButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
  },
  presetButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetButtonText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  presetButtonTextActive: {
    color: colors.white,
  },
  exitButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.success,
    borderRadius: 6,
    alignItems: "center",
  },
  exitButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
});

// =============================================================================
// Export
// =============================================================================

export const ExpressionControls = memo(ExpressionControlsComponent);
