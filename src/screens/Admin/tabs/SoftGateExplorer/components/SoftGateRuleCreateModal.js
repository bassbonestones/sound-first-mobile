/**
 * SoftGateRuleCreateModal - Create form for new soft gate rules
 */
import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { baseUrl } from "../../../../../api/client";
import styles from "../../../styles";
import FormField from "./FormField";

export default function SoftGateRuleCreateModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    dimension_name: "",
    frontier_buffer: "1.0",
    promotion_step: "1.0",
    min_attempts: "10",
    success_rating_threshold: "4",
    success_required_count: "8",
    success_window_count: "",
    decay_halflife_days: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaveError(null);
  };

  const handleCreate = async () => {
    if (!formData.dimension_name.trim()) {
      setSaveError("Dimension name is required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${baseUrl}/admin/soft-gate-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dimension_name: formData.dimension_name,
          frontier_buffer: parseFloat(formData.frontier_buffer),
          promotion_step: parseFloat(formData.promotion_step),
          min_attempts: parseInt(formData.min_attempts),
          success_rating_threshold: parseInt(formData.success_rating_threshold),
          success_required_count: parseInt(formData.success_required_count),
          success_window_count: formData.success_window_count
            ? parseInt(formData.success_window_count)
            : null,
          decay_halflife_days: formData.decay_halflife_days
            ? parseFloat(formData.decay_halflife_days)
            : null,
        }),
      });

      if (response.ok) {
        await onCreate();
      } else {
        const error = await response.json();
        setSaveError(error.detail || "Failed to create rule");
      }
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.editModalPopup}>
        <View style={styles.detailModalHeader}>
          <Text style={styles.detailModalTitle}>Create Rule</Text>
          <TouchableOpacity
            accessibilityLabel="Close create modal"
            accessibilityRole="button"
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={[styles.closeButtonText, { color: "#fff" }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.editModalPopupContent}>
          <FormField
            label="Dimension Name"
            value={formData.dimension_name}
            onChangeText={(v) => updateField("dimension_name", v)}
            placeholder="e.g., tonal_complexity_stage"
          />
          <FormField
            label="Frontier Buffer"
            value={formData.frontier_buffer}
            onChangeText={(v) => updateField("frontier_buffer", v)}
            keyboardType="numeric"
          />
          <FormField
            label="Promotion Step"
            value={formData.promotion_step}
            onChangeText={(v) => updateField("promotion_step", v)}
            keyboardType="numeric"
          />
          <FormField
            label="Min Attempts"
            value={formData.min_attempts}
            onChangeText={(v) => updateField("min_attempts", v)}
            keyboardType="numeric"
          />
          <FormField
            label="Success Rating Threshold (1-5)"
            value={formData.success_rating_threshold}
            onChangeText={(v) => updateField("success_rating_threshold", v)}
            keyboardType="numeric"
          />
          <FormField
            label="Success Required Count"
            value={formData.success_required_count}
            onChangeText={(v) => updateField("success_required_count", v)}
            keyboardType="numeric"
          />
          <FormField
            label="Success Window Count (optional)"
            value={formData.success_window_count}
            onChangeText={(v) => updateField("success_window_count", v)}
            keyboardType="numeric"
            placeholder="Leave empty for unlimited"
          />
          <FormField
            label="Decay Halflife Days (optional)"
            value={formData.decay_halflife_days}
            onChangeText={(v) => updateField("decay_halflife_days", v)}
            keyboardType="numeric"
            placeholder="Leave empty for none"
          />

          {saveError && (
            <View style={styles.saveErrorContainer}>
              <Text style={styles.saveErrorText}>{saveError}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.editModalFooter}>
          <TouchableOpacity
            accessibilityLabel="Cancel"
            accessibilityRole="button"
            style={[styles.editModalButton, styles.cancelButton]}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel={saving ? "Creating" : "Create rule"}
            accessibilityRole="button"
            style={[
              styles.editModalButton,
              styles.saveButton,
              saving && styles.saveButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Create</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

SoftGateRuleCreateModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
};
