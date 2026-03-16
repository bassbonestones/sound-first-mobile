/**
 * DetectionRuleEditor - Editor for capability detection rules
 *
 * Allows editing detection rules using dropdowns and buttons
 * instead of raw JSON.
 */
import React from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import styles from "../../../styles";

interface DetectionRule {
  type?: string;
  source?: string;
  threshold?: number;
  value?: string;
  semitones?: number;
  direction?: string;
  pattern?: string;
  match_type?: string;
  numerator?: number;
  denominator?: number;
  min?: number;
  max?: number;
  custom_function?: string;
  rules?: DetectionRule[];
  element_type?: string;
}

interface DetectionRuleOptions {
  types?: string[];
  sources?: string[];
  custom_functions?: string[];
}

interface DetectionRuleEditorProps {
  rule?: DetectionRule | null;
  options?: DetectionRuleOptions;
  onChange: (rule: DetectionRule | null) => void;
}

export default function DetectionRuleEditor({
  rule,
  options,
  onChange,
}: DetectionRuleEditorProps) {
  if (!options) {
    return (
      <View style={styles.formFieldContainer}>
        <Text style={styles.formFieldLabel}>Detection Rule</Text>
        <ActivityIndicator size="small" color="#2196F3" />
        <Text style={styles.prereqHint}>Loading detection options...</Text>
      </View>
    );
  }

  const { types, sources, custom_functions } = options;

  const createEmptyRule = () => ({
    type: "element",
    source: "notes",
    threshold: 1,
  });

  const updateRule = (field, value) => {
    if (!rule) return;
    const newRule = { ...rule, [field]: value };
    // Clear fields that don't apply to the current type
    if (field === "type") {
      // Reset type-specific fields when type changes
      delete newRule.value;
      delete newRule.semitones;
      delete newRule.direction;
      delete newRule.pattern;
      delete newRule.match_type;
      delete newRule.numerator;
      delete newRule.denominator;
      delete newRule.min;
      delete newRule.max;
      delete newRule.custom_function;
      delete newRule.rules;
      delete newRule.element_type;
    }
    onChange(newRule);
  };

  const addRule = () => {
    onChange(createEmptyRule());
  };

  const removeRule = () => {
    onChange(null);
  };

  // Add a sub-rule for compound type
  const addSubRule = () => {
    if (!rule) return;
    const currentRules = rule.rules || [];
    onChange({
      ...rule,
      rules: [
        ...currentRules,
        { type: "element", source: "notes", threshold: 1 },
      ],
    });
  };

  const updateSubRule = (index, field, value) => {
    if (!rule || !rule.rules) return;
    const newRules = [...rule.rules];
    newRules[index] = { ...newRules[index], [field]: value };
    onChange({ ...rule, rules: newRules });
  };

  const removeSubRule = (index) => {
    if (!rule || !rule.rules) return;
    const newRules = rule.rules.filter((_, i) => i !== index);
    onChange({ ...rule, rules: newRules.length > 0 ? newRules : undefined });
  };

  // Render type-specific fields
  const renderTypeFields = (
    currentRule,
    onUpdate,
    isSubRule = false,
    subIndex = null,
  ) => {
    if (!currentRule) return null;
    const ruleType = currentRule.type;

    const handleUpdate = (field, value) => {
      if (isSubRule && subIndex !== null) {
        updateSubRule(subIndex, field, value);
      } else {
        onUpdate(field, value);
      }
    };

    return (
      <>
        {/* Source - used by most types */}
        {["element", "value_match", "interval", "text_match", "range"].includes(
          ruleType,
        ) && (
          <View style={styles.detectionFieldRow}>
            <Text style={styles.detectionFieldLabel}>Source:</Text>
            <View style={styles.detectionPickerContainer}>
              {sources.map((src) => (
                <TouchableOpacity
                  key={src}
                  accessibilityLabel={`Select ${src.replace(/_/g, " ")} source`}
                  accessibilityRole="button"
                  style={[
                    styles.detectionPickerOption,
                    currentRule.source === src &&
                      styles.detectionPickerOptionSelected,
                  ]}
                  onPress={() => handleUpdate("source", src)}
                >
                  <Text
                    style={[
                      styles.detectionPickerOptionText,
                      currentRule.source === src &&
                        styles.detectionPickerOptionTextSelected,
                    ]}
                  >
                    {src.replace(/_/g, " ")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Element type - for element type */}
        {ruleType === "element" && (
          <View style={styles.detectionFieldRow}>
            <Text style={styles.detectionFieldLabel}>
              Element Type (optional):
            </Text>
            <TextInput
              style={styles.detectionFieldInput}
              value={currentRule.element_type || ""}
              onChangeText={(v) => handleUpdate("element_type", v || undefined)}
              placeholder="e.g., Staccato"
            />
          </View>
        )}

        {/* Value - for value_match */}
        {ruleType === "value_match" && (
          <View style={styles.detectionFieldRow}>
            <Text style={styles.detectionFieldLabel}>Value:</Text>
            <TextInput
              style={styles.detectionFieldInput}
              value={currentRule.value || ""}
              onChangeText={(v) => handleUpdate("value", v)}
              placeholder="Value to match"
            />
          </View>
        )}

        {/* Semitones - for interval */}
        {ruleType === "interval" && (
          <>
            <View style={styles.detectionFieldRow}>
              <Text style={styles.detectionFieldLabel}>Semitones:</Text>
              <TextInput
                style={styles.detectionFieldInput}
                value={String(currentRule.semitones || "")}
                onChangeText={(v) =>
                  handleUpdate("semitones", v ? Number(v) : undefined)
                }
                keyboardType="numeric"
                placeholder="e.g., 7 for perfect fifth"
              />
            </View>
            <View style={styles.detectionFieldRow}>
              <Text style={styles.detectionFieldLabel}>Direction:</Text>
              <View style={styles.detectionPickerContainer}>
                {["ascending", "descending", "any"].map((dir) => (
                  <TouchableOpacity
                    key={dir}
                    accessibilityLabel={`Select ${dir} direction`}
                    accessibilityRole="button"
                    style={[
                      styles.detectionPickerOption,
                      (currentRule.direction || "any") === dir &&
                        styles.detectionPickerOptionSelected,
                    ]}
                    onPress={() => handleUpdate("direction", dir)}
                  >
                    <Text
                      style={[
                        styles.detectionPickerOptionText,
                        (currentRule.direction || "any") === dir &&
                          styles.detectionPickerOptionTextSelected,
                      ]}
                    >
                      {dir}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Pattern - for text_match */}
        {ruleType === "text_match" && (
          <>
            <View style={styles.detectionFieldRow}>
              <Text style={styles.detectionFieldLabel}>Pattern:</Text>
              <TextInput
                style={styles.detectionFieldInput}
                value={currentRule.pattern || ""}
                onChangeText={(v) => handleUpdate("pattern", v)}
                placeholder="Text pattern or regex"
              />
            </View>
            <View style={styles.detectionFieldRow}>
              <Text style={styles.detectionFieldLabel}>Match Type:</Text>
              <View style={styles.detectionPickerContainer}>
                {["contains", "exact", "regex"].map((mt) => (
                  <TouchableOpacity
                    key={mt}
                    accessibilityLabel={`Select ${mt} match type`}
                    accessibilityRole="button"
                    style={[
                      styles.detectionPickerOption,
                      (currentRule.match_type || "contains") === mt &&
                        styles.detectionPickerOptionSelected,
                    ]}
                    onPress={() => handleUpdate("match_type", mt)}
                  >
                    <Text
                      style={[
                        styles.detectionPickerOptionText,
                        (currentRule.match_type || "contains") === mt &&
                          styles.detectionPickerOptionTextSelected,
                      ]}
                    >
                      {mt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Time signature fields */}
        {ruleType === "time_signature" && (
          <View style={styles.detectionFieldRow}>
            <Text style={styles.detectionFieldLabel}>Time Signature:</Text>
            <View style={localStyles.rowAlignCenter}>
              <TextInput
                style={[
                  styles.detectionFieldInput,
                  { width: 50, marginRight: 8 },
                ]}
                value={String(currentRule.numerator || "")}
                onChangeText={(v) =>
                  handleUpdate("numerator", v ? Number(v) : undefined)
                }
                keyboardType="numeric"
                placeholder="4"
              />
              <Text style={styles.detectionFieldLabel}>/</Text>
              <TextInput
                style={[
                  styles.detectionFieldInput,
                  { width: 50, marginLeft: 8 },
                ]}
                value={String(currentRule.denominator || "")}
                onChangeText={(v) =>
                  handleUpdate("denominator", v ? Number(v) : undefined)
                }
                keyboardType="numeric"
                placeholder="4"
              />
            </View>
          </View>
        )}

        {/* Range fields */}
        {ruleType === "range" && (
          <View style={styles.detectionFieldRow}>
            <Text style={styles.detectionFieldLabel}>Range:</Text>
            <View style={localStyles.rowAlignCenter}>
              <TextInput
                style={[
                  styles.detectionFieldInput,
                  { width: 60, marginRight: 8 },
                ]}
                value={String(currentRule.min || "")}
                onChangeText={(v) =>
                  handleUpdate("min", v ? Number(v) : undefined)
                }
                keyboardType="numeric"
                placeholder="Min"
              />
              <Text style={styles.detectionFieldLabel}>to</Text>
              <TextInput
                style={[
                  styles.detectionFieldInput,
                  { width: 60, marginLeft: 8 },
                ]}
                value={String(currentRule.max || "")}
                onChangeText={(v) =>
                  handleUpdate("max", v ? Number(v) : undefined)
                }
                keyboardType="numeric"
                placeholder="Max"
              />
            </View>
          </View>
        )}

        {/* Custom function */}
        {ruleType === "custom" && (
          <View style={styles.detectionFieldRow}>
            <Text style={styles.detectionFieldLabel}>Custom Function:</Text>
            <View style={styles.detectionPickerContainer}>
              {custom_functions.map((fn) => (
                <TouchableOpacity
                  key={fn}
                  accessibilityLabel={`Select ${fn} custom function`}
                  accessibilityRole="button"
                  style={[
                    styles.detectionPickerOption,
                    currentRule.custom_function === fn &&
                      styles.detectionPickerOptionSelected,
                  ]}
                  onPress={() => handleUpdate("custom_function", fn)}
                >
                  <Text
                    style={[
                      styles.detectionPickerOptionText,
                      currentRule.custom_function === fn &&
                        styles.detectionPickerOptionTextSelected,
                    ]}
                  >
                    {fn}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Threshold - for most types */}
        {ruleType !== "compound" && (
          <View style={styles.detectionFieldRow}>
            <Text style={styles.detectionFieldLabel}>Threshold:</Text>
            <TextInput
              style={[styles.detectionFieldInput, { width: 60 }]}
              value={String(currentRule.threshold || 1)}
              onChangeText={(v) => handleUpdate("threshold", v ? Number(v) : 1)}
              keyboardType="numeric"
              placeholder="1"
            />
          </View>
        )}
      </>
    );
  };

  return (
    <View style={styles.formFieldContainer}>
      <Text style={styles.formFieldLabel}>Detection Rule</Text>
      <Text style={styles.prereqHint}>
        Configure how this capability is detected in MusicXML files.
      </Text>

      {!rule ? (
        <TouchableOpacity
          accessibilityLabel="Add detection rule"
          accessibilityRole="button"
          style={styles.addPrereqButton}
          onPress={addRule}
        >
          <Text style={styles.addPrereqButtonText}>+ Add Detection Rule</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.detectionRuleContainer}>
          {/* Type selector */}
          <View style={styles.detectionFieldRow}>
            <Text style={styles.detectionFieldLabel}>Type:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.detectionPickerContainer}>
                {types.map((type) => (
                  <TouchableOpacity
                    key={type}
                    accessibilityLabel={`Select ${type.replace(/_/g, " ")} type`}
                    accessibilityRole="button"
                    style={[
                      styles.detectionPickerOption,
                      rule.type === type &&
                        styles.detectionPickerOptionSelected,
                    ]}
                    onPress={() => updateRule("type", type)}
                  >
                    <Text
                      style={[
                        styles.detectionPickerOptionText,
                        rule.type === type &&
                          styles.detectionPickerOptionTextSelected,
                      ]}
                    >
                      {type.replace(/_/g, " ")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Type-specific fields */}
          {renderTypeFields(rule, updateRule)}

          {/* Compound rules */}
          {rule.type === "compound" && (
            <View style={styles.compoundRulesContainer}>
              <Text style={styles.compoundRulesLabel}>Sub-rules:</Text>
              {(rule.rules || []).map((subRule, index) => (
                <View key={index} style={styles.subRuleContainer}>
                  <View style={styles.subRuleHeader}>
                    <Text style={styles.subRuleIndex}>Rule {index + 1}</Text>
                    <TouchableOpacity
                      accessibilityLabel={`Remove sub-rule ${index + 1}`}
                      accessibilityRole="button"
                      style={styles.subRuleRemove}
                      onPress={() => removeSubRule(index)}
                    >
                      <Text style={styles.subRuleRemoveText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.detectionFieldRow}>
                    <Text style={styles.detectionFieldLabel}>Type:</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      <View style={styles.detectionPickerContainer}>
                        {types
                          .filter((t) => t !== "compound")
                          .map((type) => (
                            <TouchableOpacity
                              key={type}
                              accessibilityLabel={`Select ${type.replace(/_/g, " ")} type for sub-rule`}
                              accessibilityRole="button"
                              style={[
                                styles.detectionPickerOption,
                                subRule.type === type &&
                                  styles.detectionPickerOptionSelected,
                              ]}
                              onPress={() => updateSubRule(index, "type", type)}
                            >
                              <Text
                                style={[
                                  styles.detectionPickerOptionText,
                                  subRule.type === type &&
                                    styles.detectionPickerOptionTextSelected,
                                ]}
                              >
                                {type.replace(/_/g, " ")}
                              </Text>
                            </TouchableOpacity>
                          ))}
                      </View>
                    </ScrollView>
                  </View>
                  {renderTypeFields(subRule, null, true, index)}
                </View>
              ))}
              <TouchableOpacity
                accessibilityLabel="Add sub-rule"
                accessibilityRole="button"
                style={styles.addSubRuleButton}
                onPress={addSubRule}
              >
                <Text style={styles.addSubRuleButtonText}>+ Add Sub-rule</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Remove rule button */}
          <TouchableOpacity
            accessibilityLabel="Remove detection rule"
            accessibilityRole="button"
            style={styles.removeRuleButton}
            onPress={removeRule}
          >
            <Text style={styles.removeRuleButtonText}>
              Remove Detection Rule
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  rowAlignCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
});
