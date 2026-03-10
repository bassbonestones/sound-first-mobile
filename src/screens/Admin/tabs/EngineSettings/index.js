/**
 * EngineSettings - Configure session generation weights and parameters
 * Part of Admin console
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { baseUrl } from "../../../../api/client";
import styles from "../../styles";

function EngineSettings() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedValues, setEditedValues] = useState({});

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/admin/engine/config`);
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        setEditedValues({});
      }
    } catch (err) {
      console.error("[EngineSettings] Load error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleValueChange = (section, key, value) => {
    setEditedValues((prev) => ({
      ...prev,
      [`${section}.${key}`]: value,
    }));
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      // Build update object from edited values
      const update = {};
      for (const [path, value] of Object.entries(editedValues)) {
        const [section, key] = path.split(".");
        if (!update[section]) {
          update[section] = {};
        }
        update[section][key] = parseFloat(value);
      }

      const response = await fetch(`${baseUrl}/admin/engine/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });

      if (response.ok) {
        const result = await response.json();
        Alert.alert(
          "Saved",
          `Applied ${result.changes_applied.length} changes.\n\nNote: Changes are in-memory only and reset on server restart.`
        );
        loadConfig();
      }
    } catch (err) {
      console.error("[EngineSettings] Save error:", err);
      Alert.alert("Error", "Failed to save changes");
    }
    setSaving(false);
  };

  const resetToDefaults = async () => {
    Alert.alert(
      "Reset to Defaults",
      "This will reset all engine settings to their default values. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${baseUrl}/admin/engine/reset`, {
                method: "POST",
              });
              if (response.ok) {
                Alert.alert("Success", "Engine configuration reset to defaults");
                loadConfig();
              }
            } catch (err) {
              console.error("[EngineSettings] Reset error:", err);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading engine config...</Text>
      </View>
    );
  }

  if (!config) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noDataText}>Failed to load engine configuration</Text>
        <TouchableOpacity style={styles.loadButton} onPress={loadConfig}>
          <Text style={styles.loadButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasChanges = Object.keys(editedValues).length > 0;

  return (
    <ScrollView style={styles.section}>
      {/* Action Buttons */}
      <View style={localStyles.actionBar}>
        <TouchableOpacity
          style={[localStyles.saveButton, !hasChanges && localStyles.disabled]}
          onPress={saveChanges}
          disabled={!hasChanges || saving}
        >
          <Text style={localStyles.saveButtonText}>
            {saving ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={localStyles.resetButton} onPress={resetToDefaults}>
          <Text style={localStyles.resetButtonText}>Reset to Defaults</Text>
        </TouchableOpacity>
      </View>

      {hasChanges && (
        <Text style={localStyles.changesNote}>
          {Object.keys(editedValues).length} unsaved change(s)
        </Text>
      )}

      {/* Capability Weights */}
      <WeightSection
        title="Capability Weights"
        description="Controls which type of practice is selected"
        weights={config.capability_weights}
        section="capability_weights"
        editedValues={editedValues}
        onValueChange={handleValueChange}
      />

      {/* Difficulty Weights */}
      <WeightSection
        title="Difficulty Weights"
        description="Distance from comfort zone"
        weights={config.difficulty_weights}
        section="difficulty_weights"
        editedValues={editedValues}
        onValueChange={handleValueChange}
      />

      {/* Novelty vs Reinforcement */}
      <WeightSection
        title="Novelty vs Reinforcement"
        description="Balance between new and review material"
        weights={config.novelty_reinforcement}
        section="novelty_reinforcement"
        editedValues={editedValues}
        onValueChange={handleValueChange}
      />

      {/* Intensity Weights */}
      <WeightSection
        title="Intensity Weights"
        description="Size of mini-sessions"
        weights={config.intensity_weights}
        section="intensity_weights"
        editedValues={editedValues}
        onValueChange={handleValueChange}
      />

      {/* Time Budgets */}
      <WeightSection
        title="Time Budgets (minutes)"
        description="Average duration per capability type"
        weights={config.time_budgets}
        section="time_budgets"
        editedValues={editedValues}
        onValueChange={handleValueChange}
      />

      {/* Fatigue Modifiers (read-only for now) */}
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Fatigue Modifiers</Text>
        <Text style={localStyles.readOnlyNote}>
          View only - edit in session_config.py
        </Text>
        {Object.entries(config.fatigue_modifiers).map(([level, mods]) => (
          <View key={level} style={localStyles.fatigueLevel}>
            <Text style={localStyles.fatigueLevelTitle}>Level {level}</Text>
            {Object.keys(mods).length === 0 ? (
              <Text style={localStyles.fatigueValue}>No modifications</Text>
            ) : (
              Object.entries(mods).map(([cap, mod]) => (
                <Text key={cap} style={localStyles.fatigueValue}>
                  {cap}: ×{mod}
                </Text>
              ))
            )}
          </View>
        ))}
      </View>

      {/* Anti-Repetition Rules (read-only) */}
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Anti-Repetition Rules</Text>
        <Text style={localStyles.readOnlyNote}>
          View only - edit in session_config.py
        </Text>
        {Object.entries(config.anti_repetition).map(([key, value]) => (
          <View key={key} style={localStyles.ruleRow}>
            <Text style={localStyles.ruleLabel}>
              {key.replace(/_/g, " ")}:
            </Text>
            <Text style={localStyles.ruleValue}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Other Settings */}
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Other Settings</Text>
        <View style={localStyles.ruleRow}>
          <Text style={localStyles.ruleLabel}>Notation shown %:</Text>
          <Text style={localStyles.ruleValue}>
            {(config.notation_shown_percentage * 100).toFixed(0)}%
          </Text>
        </View>
        <View style={localStyles.ruleRow}>
          <Text style={localStyles.ruleLabel}>Wrap-up threshold:</Text>
          <Text style={localStyles.ruleValue}>
            {config.wrap_up_threshold_minutes} min
          </Text>
        </View>
        <View style={localStyles.ruleRow}>
          <Text style={localStyles.ruleLabel}>Teaching module time:</Text>
          <Text style={localStyles.ruleValue}>
            {config.teaching_module_time_per_lesson} min/lesson
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function WeightSection({
  title,
  description,
  weights,
  section,
  editedValues,
  onValueChange,
}) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);

  return (
    <View style={styles.detailSection}>
      <Text style={styles.detailSectionTitle}>{title}</Text>
      <Text style={localStyles.sectionDescription}>{description}</Text>
      <Text style={localStyles.totalLabel}>
        Total: {total.toFixed(2)} {total !== 1 && "(should sum to 1.0)"}
      </Text>

      {Object.entries(weights).map(([key, value]) => {
        const editKey = `${section}.${key}`;
        const editedValue = editedValues[editKey];
        const displayValue = editedValue !== undefined ? editedValue : value;
        const isEdited = editedValue !== undefined;

        return (
          <View key={key} style={localStyles.weightRow}>
            <Text style={localStyles.weightLabel}>{key}</Text>
            <View style={localStyles.weightInputContainer}>
              <TextInput
                style={[
                  localStyles.weightInput,
                  isEdited && localStyles.weightInputEdited,
                ]}
                value={String(displayValue)}
                onChangeText={(text) => onValueChange(section, key, text)}
                keyboardType="decimal-pad"
              />
              <View style={localStyles.barContainer}>
                <View
                  style={[
                    localStyles.bar,
                    { width: `${Math.min(parseFloat(displayValue) * 100, 100)}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const localStyles = {
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  resetButton: {
    flex: 1,
    backgroundColor: "#f44336",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  disabled: {
    opacity: 0.5,
  },
  changesNote: {
    color: "#FF9800",
    fontSize: 12,
    marginBottom: 12,
    textAlign: "center",
  },
  sectionDescription: {
    color: "#888",
    fontSize: 12,
    marginBottom: 8,
  },
  totalLabel: {
    color: "#666",
    fontSize: 11,
    marginBottom: 8,
    fontStyle: "italic",
  },
  weightRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  weightLabel: {
    width: 140,
    color: "#fff",
    fontSize: 13,
  },
  weightInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  weightInput: {
    width: 60,
    backgroundColor: "#2a2a2a",
    color: "#fff",
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#444",
    fontSize: 13,
    textAlign: "center",
  },
  weightInputEdited: {
    borderColor: "#FF9800",
    backgroundColor: "#3a3020",
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    backgroundColor: "#2196F3",
  },
  readOnlyNote: {
    color: "#888",
    fontSize: 11,
    fontStyle: "italic",
    marginBottom: 8,
  },
  fatigueLevel: {
    marginBottom: 8,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#444",
  },
  fatigueLevelTitle: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  fatigueValue: {
    color: "#aaa",
    fontSize: 12,
    marginLeft: 8,
  },
  ruleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  ruleLabel: {
    color: "#aaa",
    fontSize: 13,
  },
  ruleValue: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
};

export default EngineSettings;
