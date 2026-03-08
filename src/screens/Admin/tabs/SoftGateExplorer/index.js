/**
 * SoftGateExplorer - Soft gate rules management
 * Part of Admin console
 */
import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import styles from "../../styles";
import { useSoftGateRules, useUserSoftGateState } from "./hooks";

function SoftGateExplorer() {
  const [activeSection, setActiveSection] = useState("rules");

  return (
    <View style={styles.section}>
      {/* Sub-tabs */}
      <View style={styles.subTabBar}>
        <TouchableOpacity
          style={[
            styles.subTab,
            activeSection === "rules" && styles.subTabActive,
          ]}
          onPress={() => setActiveSection("rules")}
        >
          <Text
            style={[
              styles.subTabText,
              activeSection === "rules" && styles.subTabTextActive,
            ]}
          >
            Rules
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.subTab,
            activeSection === "user_state" && styles.subTabActive,
          ]}
          onPress={() => setActiveSection("user_state")}
        >
          <Text
            style={[
              styles.subTabText,
              activeSection === "user_state" && styles.subTabTextActive,
            ]}
          >
            User State
          </Text>
        </TouchableOpacity>
      </View>

      {activeSection === "rules" && <SoftGateRulesList />}
      {activeSection === "user_state" && <UserSoftGateStateView />}
    </View>
  );
}

function SoftGateRulesList() {
  // Use extracted hook for state and CRUD operations
  const {
    rules,
    loading,
    selectedRule,
    setSelectedRule,
    deleteRule,
    fetchRules,
  } = useSoftGateRules();

  // Modal visibility state (UI-only)
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleDelete = async (ruleId) => {
    const result = await deleteRule(ruleId);
    if (!result.success) {
      alert(result.error || "Failed to delete rule");
    }
  };

  const renderRuleItem = ({ item }) => (
    <View style={styles.listItem}>
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={() => {
          setSelectedRule(item);
          setShowEditModal(true);
        }}
      >
        <View style={styles.listItemHeader}>
          <Text style={styles.listItemTitle}>{item.dimension_name}</Text>
        </View>
        <View style={styles.listItemDetails}>
          <Text style={styles.listItemDetail}>
            Buffer: {item.frontier_buffer}
          </Text>
          <Text style={styles.listItemDetail}>Step: {item.promotion_step}</Text>
          <Text style={styles.listItemDetail}>Min: {item.min_attempts}</Text>
        </View>
        <Text style={styles.listItemSubtext}>
          Success: {item.success_required_count}/
          {item.success_window_count || "∞"} @ rating ≥
          {item.success_rating_threshold}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.softGateContent}>
      <View style={styles.filterBar}>
        <Text style={styles.sectionHeader}>
          Soft Gate Rules ({rules.length})
        </Text>
        <TouchableOpacity
          style={styles.addCapButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.addCapButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rules}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderRuleItem}
        style={styles.list}
        ListEmptyComponent={
          <Text style={styles.noDataText}>No soft gate rules defined</Text>
        }
      />

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        {selectedRule && (
          <SoftGateRuleEditModal
            rule={selectedRule}
            onClose={() => {
              setShowEditModal(false);
              setSelectedRule(null);
            }}
            onSave={async () => {
              await fetchRules();
              setShowEditModal(false);
              setSelectedRule(null);
            }}
            onDelete={() => {
              handleDelete(selectedRule.id);
              setShowEditModal(false);
              setSelectedRule(null);
            }}
          />
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <SoftGateRuleCreateModal
          onClose={() => setShowCreateModal(false)}
          onCreate={async () => {
            await fetchRules();
            setShowCreateModal(false);
          }}
        />
      </Modal>
    </View>
  );
}

function SoftGateRuleEditModal({ rule, onClose, onSave, onDelete }) {
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

function SoftGateRuleCreateModal({ onClose, onCreate }) {
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
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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

function UserSoftGateStateView() {
  // Use extracted hook for state and operations
  const {
    users,
    selectedUserId,
    selectedUser,
    states,
    loading,
    selectedState,
    setSelectedUserId,
    setSelectedState,
    fetchStates,
    resetStates,
  } = useUserSoftGateState();

  // Modal visibility state (UI-only)
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);

  const handleReset = async (dimensionNames = null) => {
    const result = await resetStates(dimensionNames);
    if (!result.success) {
      alert(result.error || "Failed to reset");
    }
  };

  const renderStateItem = ({ item }) => (
    <View style={styles.listItem}>
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={() => {
          setSelectedState(item);
          setShowEditModal(true);
        }}
      >
        <View style={styles.listItemHeader}>
          <Text style={styles.listItemTitle}>{item.dimension_name}</Text>
        </View>
        <View style={styles.softGateStateGrid}>
          <View style={styles.softGateStatCell}>
            <Text style={styles.softGateStatLabel}>Comfort</Text>
            <Text style={styles.softGateStatValue}>
              {item.comfortable_value.toFixed(2)}
            </Text>
          </View>
          <View style={styles.softGateStatCell}>
            <Text style={styles.softGateStatLabel}>Max Demo</Text>
            <Text style={styles.softGateStatValue}>
              {item.max_demonstrated_value.toFixed(2)}
            </Text>
          </View>
          <View style={styles.softGateStatCell}>
            <Text style={styles.softGateStatLabel}>EMA</Text>
            <Text style={styles.softGateStatValue}>
              {item.frontier_success_ema.toFixed(3)}
            </Text>
          </View>
          <View style={styles.softGateStatCell}>
            <Text style={styles.softGateStatLabel}>Attempts</Text>
            <Text style={styles.softGateStatValue}>
              {item.frontier_attempt_count_since_last_promo}
            </Text>
          </View>
        </View>
        {item.updated_at && (
          <Text style={styles.listItemSubtext}>
            Updated: {new Date(item.updated_at).toLocaleDateString()}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.softGateContent}>
      {/* User Picker */}
      <View style={styles.userPickerContainer}>
        <Text style={styles.userPickerLabel}>User:</Text>
        <TouchableOpacity
          style={styles.userPickerButton}
          onPress={() => setShowUserPicker(true)}
        >
          <Text style={styles.userPickerButtonText}>
            {selectedUser
              ? `${selectedUser.email} (ID: ${selectedUser.id})`
              : "Select user..."}
          </Text>
          <Text style={styles.userPickerArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Reset All Button */}
      <TouchableOpacity
        style={styles.resetAllButton}
        onPress={() => handleReset(null)}
      >
        <Text style={styles.resetAllButtonText}>Reset All Dimensions</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : (
        <FlatList
          data={states}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderStateItem}
          style={styles.list}
          ListEmptyComponent={
            <Text style={styles.noDataText}>
              No soft gate state for this user
            </Text>
          }
        />
      )}

      {/* User Picker Modal */}
      <Modal
        visible={showUserPicker}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowUserPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerModalOverlay}
          activeOpacity={1}
          onPress={() => setShowUserPicker(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select User</Text>
            <FlatList
              data={users}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerModalItem,
                    item.id === selectedUserId &&
                      styles.pickerModalItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedUserId(item.id);
                    setShowUserPicker(false);
                  }}
                >
                  <Text style={styles.pickerModalItemText}>
                    {item.email || `User ${item.id}`}
                  </Text>
                  <Text style={styles.pickerModalItemSubtext}>
                    ID: {item.id}{" "}
                    {item.instrument ? `• ${item.instrument}` : ""}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.pickerModalList}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        {selectedState && (
          <UserSoftGateStateEditModal
            state={selectedState}
            onClose={() => {
              setShowEditModal(false);
              setSelectedState(null);
            }}
            onSave={async () => {
              await fetchStates();
              setShowEditModal(false);
              setSelectedState(null);
            }}
            onReset={async () => {
              await handleReset([selectedState.dimension_name]);
              setShowEditModal(false);
              setSelectedState(null);
            }}
          />
        )}
      </Modal>
    </View>
  );
}

function UserSoftGateStateEditModal({ state, onClose, onSave, onReset }) {
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
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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
      </View>
    </View>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function FormField({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "sentences",
}) {
  return (
    <View style={styles.formFieldContainer}>
      <Text style={styles.formFieldLabel}>{label}</Text>
      <TextInput
        style={[styles.formFieldInput, error && styles.formFieldInputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
      {error && <Text style={styles.formFieldError}>{error}</Text>}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

export default SoftGateExplorer;
