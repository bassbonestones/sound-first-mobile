/**
 * UserSoftGateStateEditModal - Edit form for user soft gate state
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

export default function UserSoftGateStateEditModal({
  state,
  onClose,
  onSave,
  onReset,
}) {
  const [formData, setFormData] = useState({
    comfortable_value: String(state.comfortable_value),
    max_demonstrated_value: String(state.max_demonstrated_value),
    frontier_success_ema: String(state.frontier_success_ema),
    frontier_attempt_count_since_last_promo: String(
      state.frontier_attempt_count_since_last_promo,
    ),
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaveError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `${baseUrl}/admin/user-soft-gate-state/${state.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comfortable_value: parseFloat(formData.comfortable_value),
            max_demonstrated_value: parseFloat(formData.max_demonstrated_value),
            frontier_success_ema: parseFloat(formData.frontier_success_ema),
            frontier_attempt_count_since_last_promo: parseInt(
              formData.frontier_attempt_count_since_last_promo,
            ),
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
          <Text style={styles.detailModalTitle}>{state.dimension_name}</Text>
          <TouchableOpacity
            accessibilityLabel="Close edit modal"
            accessibilityRole="button"
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={[styles.closeButtonText, { color: "#fff" }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.editModalPopupContent}>
          <FormField
            label="Comfortable Value"
            value={formData.comfortable_value}
            onChangeText={(v) => updateField("comfortable_value", v)}
            keyboardType="numeric"
          />
          <FormField
            label="Max Demonstrated Value"
            value={formData.max_demonstrated_value}
            onChangeText={(v) => updateField("max_demonstrated_value", v)}
            keyboardType="numeric"
          />
          <FormField
            label="Frontier Success EMA"
            value={formData.frontier_success_ema}
            onChangeText={(v) => updateField("frontier_success_ema", v)}
            keyboardType="numeric"
          />
          <FormField
            label="Frontier Attempts Since Promotion"
            value={formData.frontier_attempt_count_since_last_promo}
            onChangeText={(v) =>
              updateField("frontier_attempt_count_since_last_promo", v)
            }
            keyboardType="numeric"
          />

          {saveError && (
            <View style={styles.saveErrorContainer}>
              <Text style={styles.saveErrorText}>{saveError}</Text>
            </View>
          )}

          <TouchableOpacity
            accessibilityLabel="Reset this dimension"
            accessibilityRole="button"
            style={styles.resetDimensionButton}
            onPress={onReset}
          >
            <Text style={styles.resetDimensionButtonText}>
              Reset This Dimension
            </Text>
          </TouchableOpacity>
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
            accessibilityLabel={saving ? "Saving" : "Save changes"}
            accessibilityRole="button"
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
      </View>
    </View>
  );
}

UserSoftGateStateEditModal.propTypes = {
  state: PropTypes.shape({
    id: PropTypes.number,
    dimension_name: PropTypes.string,
    comfortable_value: PropTypes.number,
    max_demonstrated_value: PropTypes.number,
    frontier_success_ema: PropTypes.number,
    frontier_attempt_count_since_last_promo: PropTypes.number,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
};
