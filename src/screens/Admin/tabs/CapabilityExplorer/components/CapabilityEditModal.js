/**
 * CapabilityEditModal - Modal for editing existing capabilities
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  ActivityIndicator,
} from "react-native";
import styles from "../../../styles";
import { baseUrl } from "../../../../../api/client";
import {
  VALID_REQUIREMENT_TYPES,
  VALID_MASTERY_TYPES,
  MIN_DIFFICULTY_WEIGHT,
  MAX_DIFFICULTY_WEIGHT,
  MIN_RATING,
  MAX_RATING,
  validateCapabilityForm,
} from "../validation";
import FormField from "./FormField";
import PrerequisiteSelector from "./PrerequisiteSelector";
import DetectionRuleEditor from "./DetectionRuleEditor";

export default function CapabilityEditModal({
  capability,
  allCapabilities,
  onClose,
  onSave,
}) {
  // Form state initialized from capability
  const [formData, setFormData] = useState({
    name: capability?.name || "",
    display_name: capability?.display_name || "",
    domain: capability?.domain || "",
    subdomain: capability?.subdomain || "",
    requirement_type: capability?.requirement_type || "required",
    difficulty_tier: capability?.difficulty_tier || 1,
    mastery_type: capability?.mastery_type || "single",
    mastery_count: capability?.mastery_count || 1,
    evidence_required_count: capability?.evidence_required_count || 1,
    evidence_distinct_materials:
      capability?.evidence_distinct_materials || false,
    evidence_acceptance_threshold:
      capability?.evidence_acceptance_threshold || 4,
    difficulty_weight: capability?.difficulty_weight || 1.0,
    is_global: capability?.is_global !== false, // Default to true if undefined
    soft_gate_requirements: capability?.soft_gate_requirements
      ? JSON.stringify(capability.soft_gate_requirements)
      : "",
  });

  // Detection rule state - separate from form to handle complex structure
  const [detectionRule, setDetectionRule] = useState(
    capability?.detection_rule || null,
  );
  const [detectionRuleOptions, setDetectionRuleOptions] = useState(null);

  // Fetch detection rule options on mount
  useEffect(() => {
    fetch(`${baseUrl}/admin/detection-rule-options`)
      .then((res) => res.json())
      .then((data) => setDetectionRuleOptions(data))
      .catch((err) =>
        console.error("Failed to fetch detection rule options:", err),
      );
  }, []);

  // Prerequisites state - track by ID
  const [selectedPrereqIds, setSelectedPrereqIds] = useState(() => {
    // Initialize from capability's prerequisite_ids directly
    return capability?.prerequisite_ids || [];
  });

  // Prerequisite selector state
  const [showPrereqSelector, setShowPrereqSelector] = useState(false);
  const [prereqDomainFilter, setPrereqDomainFilter] = useState("all");
  const [prereqSearchQuery, setPrereqSearchQuery] = useState("");

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user edits
    if (errors[field]) {
      setErrors((prev) => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
    // Clear save status on edit
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    // Validate
    const validation = validateCapabilityForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const requestBody = {
        name: formData.name.trim(),
        display_name: formData.display_name?.trim() || null,
        domain: formData.domain.trim(),
        subdomain: formData.subdomain?.trim() || null,
        requirement_type: formData.requirement_type,
        difficulty_tier: Number(formData.difficulty_tier),
        mastery_type: formData.mastery_type,
        mastery_count: Number(formData.mastery_count),
        evidence_required_count: Number(formData.evidence_required_count),
        evidence_distinct_materials: formData.evidence_distinct_materials,
        evidence_acceptance_threshold: Number(
          formData.evidence_acceptance_threshold,
        ),
        difficulty_weight: Number(formData.difficulty_weight),
        is_global: formData.is_global,
        prerequisite_ids: selectedPrereqIds,
        soft_gate_requirements: formData.soft_gate_requirements?.trim()
          ? JSON.parse(formData.soft_gate_requirements)
          : null,
        detection_rule:
          detectionRule && detectionRule.type ? detectionRule : null,
      };

      const response = await fetch(
        `${baseUrl}/admin/capabilities/${capability.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || result.message || "Failed to save capability",
        );
      }

      setSaveSuccess(true);

      // Call onSave with the updated capability after a brief delay
      setTimeout(() => {
        onSave({
          ...capability,
          ...formData,
          difficulty_tier: Number(formData.difficulty_tier),
          mastery_count: Number(formData.mastery_count),
          evidence_required_count: Number(formData.evidence_required_count),
          evidence_acceptance_threshold: Number(
            formData.evidence_acceptance_threshold,
          ),
          difficulty_weight: Number(formData.difficulty_weight),
          prerequisite_ids: selectedPrereqIds,
          detection_rule: detectionRule,
        });
      }, 500);
    } catch (err) {
      console.error("[CapabilityEditModal] Save error:", err);
      setSaveError(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (!capability) return null;

  return (
    <View style={styles.editModalContainer}>
      <View style={styles.editModalHeader}>
        <Text style={styles.editModalTitle}>Edit Capability</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.editModalContent}>
        {/* Read-only fields notice */}
        <View style={styles.readOnlyNotice}>
          <Text style={styles.readOnlyNoticeText}>
            ID ({capability.id}) and Bit Index ({capability.bit_index ?? "N/A"})
            are read-only.
          </Text>
        </View>

        {/* Name */}
        <FormField
          label="Name"
          value={formData.name}
          onChangeText={(v) => updateField("name", v)}
          error={errors.name}
          placeholder="e.g., articulation_staccato"
          autoCapitalize="none"
        />

        {/* Display Name */}
        <FormField
          label="Display Name"
          value={formData.display_name}
          onChangeText={(v) => updateField("display_name", v)}
          error={errors.display_name}
          placeholder="e.g., Staccato"
        />

        {/* Domain */}
        <FormField
          label="Domain"
          value={formData.domain}
          onChangeText={(v) => updateField("domain", v)}
          error={errors.domain}
          placeholder="e.g., articulations"
        />

        {/* Subdomain */}
        <FormField
          label="Subdomain (optional)"
          value={formData.subdomain}
          onChangeText={(v) => updateField("subdomain", v)}
          error={errors.subdomain}
          placeholder="e.g., basic"
        />

        {/* Requirement Type */}
        <View style={styles.formFieldContainer}>
          <Text style={styles.formFieldLabel}>Requirement Type</Text>
          <View style={styles.pickerContainer}>
            {VALID_REQUIREMENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.pickerOption,
                  formData.requirement_type === type &&
                    styles.pickerOptionSelected,
                ]}
                onPress={() => updateField("requirement_type", type)}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    formData.requirement_type === type &&
                      styles.pickerOptionTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.requirement_type && (
            <Text style={styles.formFieldError}>{errors.requirement_type}</Text>
          )}
        </View>

        {/* Difficulty Tier */}
        <FormField
          label="Difficulty Tier (1-5)"
          value={String(formData.difficulty_tier)}
          onChangeText={(v) => updateField("difficulty_tier", v)}
          error={errors.difficulty_tier}
          keyboardType="numeric"
        />

        {/* Difficulty Weight */}
        <FormField
          label={`Difficulty Weight (${MIN_DIFFICULTY_WEIGHT}-${MAX_DIFFICULTY_WEIGHT})`}
          value={String(formData.difficulty_weight)}
          onChangeText={(v) => updateField("difficulty_weight", v)}
          error={errors.difficulty_weight}
          keyboardType="decimal-pad"
        />

        {/* Mastery Type */}
        <View style={styles.formFieldContainer}>
          <Text style={styles.formFieldLabel}>Mastery Type</Text>
          <View style={styles.pickerContainer}>
            {VALID_MASTERY_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.pickerOption,
                  formData.mastery_type === type && styles.pickerOptionSelected,
                ]}
                onPress={() => updateField("mastery_type", type)}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    formData.mastery_type === type &&
                      styles.pickerOptionTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.mastery_type && (
            <Text style={styles.formFieldError}>{errors.mastery_type}</Text>
          )}
        </View>

        {/* Mastery Count */}
        <FormField
          label="Mastery Count"
          value={String(formData.mastery_count)}
          onChangeText={(v) => updateField("mastery_count", v)}
          error={errors.mastery_count}
          keyboardType="numeric"
        />

        {/* Evidence Required Count */}
        <FormField
          label="Evidence Required Count"
          value={String(formData.evidence_required_count)}
          onChangeText={(v) => updateField("evidence_required_count", v)}
          error={errors.evidence_required_count}
          keyboardType="numeric"
        />

        {/* Evidence Distinct Materials */}
        <View style={styles.formFieldContainer}>
          <View style={styles.switchRow}>
            <Text style={styles.formFieldLabel}>
              Evidence Distinct Materials
            </Text>
            <Switch
              value={formData.evidence_distinct_materials}
              onValueChange={(v) =>
                updateField("evidence_distinct_materials", v)
              }
              trackColor={{ false: "#ccc", true: "#81b0ff" }}
              thumbColor={
                formData.evidence_distinct_materials ? "#2196F3" : "#f4f3f4"
              }
            />
          </View>
          <Text style={styles.switchHint}>
            {formData.evidence_distinct_materials
              ? "Evidence must come from different materials"
              : "Evidence can come from the same material"}
          </Text>
        </View>

        {/* Is Global (vs Instrument-Specific) */}
        <View style={styles.formFieldContainer}>
          <View style={styles.switchRow}>
            <Text style={styles.formFieldLabel}>
              Global Capability
            </Text>
            <Switch
              value={formData.is_global}
              onValueChange={(v) => updateField("is_global", v)}
              trackColor={{ false: "#ccc", true: "#81b0ff" }}
              thumbColor={formData.is_global ? "#2196F3" : "#f4f3f4"}
            />
          </View>
          <Text style={styles.switchHint}>
            {formData.is_global
              ? "Learned once, applies to all instruments"
              : "Must be learned separately for each instrument"}
          </Text>
        </View>

        {/* Evidence Acceptance Threshold */}
        <FormField
          label={`Evidence Acceptance Threshold (${MIN_RATING}-${MAX_RATING})`}
          value={String(formData.evidence_acceptance_threshold)}
          onChangeText={(v) => updateField("evidence_acceptance_threshold", v)}
          error={errors.evidence_acceptance_threshold}
          keyboardType="numeric"
        />

        {/* Soft Gate Requirements */}
        <FormField
          label="Soft Gate Requirements (JSON)"
          value={formData.soft_gate_requirements}
          onChangeText={(v) => updateField("soft_gate_requirements", v)}
          error={errors.soft_gate_requirements}
          placeholder='{"interval_velocity_score": 0.5}'
          multiline={true}
        />
        <Text style={styles.prereqHint}>
          Optional JSON object specifying soft gate thresholds. User must reach
          comfortable_value for each dimension before mastering this capability.
        </Text>

        {/* Prerequisites Section */}
        <View style={styles.formFieldContainer}>
          <Text style={styles.formFieldLabel}>Prerequisites</Text>
          <Text style={styles.prereqHint}>
            Capabilities that must be mastered before this one can be
            introduced. Circular dependencies are automatically prevented.
          </Text>

          {/* Current prerequisites list */}
          <View style={styles.prereqList}>
            {selectedPrereqIds.length === 0 ? (
              <Text style={styles.prereqEmptyText}>
                No prerequisites selected
              </Text>
            ) : (
              selectedPrereqIds.map((prereqId) => {
                const prereq = allCapabilities.find((c) => c.id === prereqId);
                if (!prereq) return null;
                return (
                  <View key={prereqId} style={styles.prereqChip}>
                    <View style={styles.prereqChipContent}>
                      <Text style={styles.prereqChipText}>
                        {prereq.display_name || prereq.name}
                      </Text>
                      <Text style={styles.prereqChipDomain}>
                        {prereq.domain}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.prereqChipRemove}
                      onPress={() => {
                        setSelectedPrereqIds((prev) =>
                          prev.filter((id) => id !== prereqId),
                        );
                        setSaveError(null);
                        setSaveSuccess(false);
                      }}
                    >
                      <Text style={styles.prereqChipRemoveText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>

          {/* Add prerequisite button */}
          <TouchableOpacity
            style={styles.addPrereqButton}
            onPress={() => setShowPrereqSelector(true)}
          >
            <Text style={styles.addPrereqButtonText}>+ Add Prerequisite</Text>
          </TouchableOpacity>
          {errors.prerequisites && (
            <Text style={styles.formFieldError}>{errors.prerequisites}</Text>
          )}
        </View>

        {/* Prerequisite Selector Modal */}
        <Modal
          visible={showPrereqSelector}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPrereqSelector(false)}
        >
          <PrerequisiteSelector
            currentCapabilityId={capability.id}
            allCapabilities={allCapabilities}
            selectedIds={selectedPrereqIds}
            onSelect={(id) => {
              if (!selectedPrereqIds.includes(id)) {
                setSelectedPrereqIds((prev) => [...prev, id]);
                setSaveError(null);
                setSaveSuccess(false);
              }
            }}
            onClose={() => setShowPrereqSelector(false)}
            prereqDomainFilter={prereqDomainFilter}
            setPrereqDomainFilter={setPrereqDomainFilter}
            prereqSearchQuery={prereqSearchQuery}
            setPrereqSearchQuery={setPrereqSearchQuery}
          />
        </Modal>

        {/* Detection Rule Section */}
        <DetectionRuleEditor
          rule={detectionRule}
          options={detectionRuleOptions}
          onChange={(newRule) => {
            setDetectionRule(newRule);
            setSaveError(null);
            setSaveSuccess(false);
          }}
        />

        {/* Save Error */}
        {saveError && (
          <View style={styles.saveErrorContainer}>
            <Text style={styles.saveErrorText}>{saveError}</Text>
          </View>
        )}

        {/* Save Success */}
        {saveSuccess && (
          <View style={styles.saveSuccessContainer}>
            <Text style={styles.saveSuccessText}>Saved successfully!</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.editModalActions}>
          <TouchableOpacity
            style={[styles.editModalButton, styles.cancelButton]}
            onPress={onClose}
            disabled={saving}
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
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Spacer for bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
