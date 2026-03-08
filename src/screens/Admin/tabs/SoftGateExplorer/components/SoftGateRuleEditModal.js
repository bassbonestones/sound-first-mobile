/**
 * SoftGateRuleEditModal - Edit form for soft gate rules
 */
import React, { useState } from "react";
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

export default function SoftGateRuleEditModal({
  rule,
  onClose,
  onSave,
  onDelete,
}) {
  const [formData, setFormData] = useState({
    dimension_name: rule.dimension_name,
    frontier_buffer: String(rule.frontier_buffer),
    promotion_step: String(rule.promotion_step),
    min_attempts: String(rule.min_attempts),
    success_rating_threshold: String(rule.success_rating_threshold),
    success_required_count: String(rule.success_required_count),
    success_window_count: rule.success_window_count
      ? String(rule.success_window_count)
      : "",
    decay_halflife_days: rule.decay_halflife_days
      ? String(rule.decay_halflife_days)
      : "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaveError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `${baseUrl}/admin/soft-gate-rules/${rule.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dimension_name: formData.dimension_name,
            frontier_buffer: parseFloat(formData.frontier_buffer),
            promotion_step: parseFloat(formData.promotion_step),
            min_attempts: parseInt(formData.min_attempts),
            success_rating_threshold: parseInt(
              formData.success_rating_threshold,
            ),
            success_required_count: parseInt(formData.success_required_count),
            success_window_count: formData.success_window_count
              ? parseInt(formData.success_window_count)
              : null,
            decay_halflife_days: formData.decay_halflife_days
              ? parseFloat(formData.decay_halflife_days)
              : null,
          }),
        },
      );

      if (response.ok) {
        await onSave();
      } else {
        const error = await response.json();
        setSaveError(error.detail || "Failed to save");
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
          <Text style={styles.detailModalTitle}>Edit Rule</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={[styles.closeButtonText, { color: "#fff" }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.editModalPopupContent}>
          <FormField
            label="Dimension Name"
            value={formData.dimension_name}
            onChangeText={(v) => updateField("dimension_name", v)}
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

          <TouchableOpacity
            style={[styles.deleteRuleButton]}
            onPress={() => setShowDeleteConfirm(true)}
          >
            <Text style={styles.deleteRuleButtonText}>Delete Rule</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.editModalFooter}>
          <TouchableOpacity
            style={[styles.editModalButton, styles.cancelButton]}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.editModalButton,
              styles.saveButton,
              saving && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>
                Delete rule "{rule.dimension_name}"?
              </Text>
              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.cancelConfirmButton]}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={styles.confirmButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.deleteConfirmButton]}
                  onPress={onDelete}
                >
                  <Text style={[styles.confirmButtonText, { color: "#fff" }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
