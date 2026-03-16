/**
 * CapabilityCreateModal - Modal for creating new capabilities
 */
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import styles from "../../../styles";
import {
  VALID_REQUIREMENT_TYPES,
  VALID_MASTERY_TYPES,
  validateCapabilityForm,
} from "../validation";
import FormField from "./FormField";
import PrerequisiteSelector from "./PrerequisiteSelector";

interface Capability {
  id: number;
  name?: string;
  display_name?: string;
  domain?: string;
}

interface CreateResult {
  success: boolean;
  error?: string;
}

interface CapabilityCreateModalProps {
  domains: string[];
  allCapabilities: Capability[];
  onClose: () => void;
  onCreate: (data: Record<string, unknown>) => Promise<CreateResult>;
  initialDomain?: string;
}

export default function CapabilityCreateModal({
  domains,
  allCapabilities,
  onClose,
  onCreate,
  initialDomain,
}: CapabilityCreateModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    display_name: "",
    domain: initialDomain || "",
    subdomain: "",
    requirement_type: "required",
    difficulty_tier: 1,
    mastery_type: "single",
    mastery_count: 1,
    evidence_required_count: 1,
    evidence_distinct_materials: false,
    evidence_acceptance_threshold: 4,
    difficulty_weight: 1.0,
    soft_gate_requirements: "",
  });
  const [newDomain, setNewDomain] = useState("");
  const [useNewDomain, setUseNewDomain] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [selectedPrereqIds, setSelectedPrereqIds] = useState([]);
  const [showPrereqSelector, setShowPrereqSelector] = useState(false);
  const [prereqDomainFilter, setPrereqDomainFilter] = useState("all");
  const [prereqSearchQuery, setPrereqSearchQuery] = useState("");

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
    setSaveError(null);
  };

  const handleCreate = async () => {
    const finalDomain = useNewDomain ? newDomain.trim() : formData.domain;
    const finalFormData = { ...formData, domain: finalDomain };

    const validation = validateCapabilityForm(finalFormData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSaving(true);
    setSaveError(null);

    const result = await onCreate({
      name: formData.name.trim(),
      display_name: formData.display_name?.trim() || null,
      domain: finalDomain,
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
      prerequisite_ids: selectedPrereqIds,
      soft_gate_requirements: formData.soft_gate_requirements?.trim()
        ? JSON.parse(formData.soft_gate_requirements)
        : null,
    });

    setSaving(false);
    if (!result.success) {
      setSaveError(result.error);
    }
  };

  return (
    <View style={styles.editModalContainer}>
      <View style={styles.editModalHeader}>
        <Text style={styles.editModalTitle}>Create Capability</Text>
        <TouchableOpacity
          accessibilityLabel="Close create modal"
          accessibilityRole="button"
          style={styles.closeButton}
          onPress={onClose}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.editModalContent}>
        {/* Name */}
        <FormField
          label="Name (lowercase_with_underscores)"
          value={formData.name}
          onChangeText={(v) =>
            updateField("name", v.toLowerCase().replace(/[^a-z0-9_]/g, "_"))
          }
          error={errors.name}
          placeholder="e.g., my_new_capability"
        />

        {/* Display Name */}
        <FormField
          label="Display Name"
          value={formData.display_name}
          onChangeText={(v) => updateField("display_name", v)}
          placeholder="e.g., My New Capability"
        />

        {/* Domain Selection */}
        <View style={styles.formFieldContainer}>
          <Text style={styles.formFieldLabel}>Domain</Text>

          <View style={styles.domainToggleContainer}>
            <TouchableOpacity
              accessibilityLabel="Use existing domain"
              accessibilityRole="button"
              style={[
                styles.domainToggleButton,
                !useNewDomain && styles.domainToggleButtonActive,
              ]}
              onPress={() => setUseNewDomain(false)}
            >
              <Text
                style={[
                  styles.domainToggleText,
                  !useNewDomain && styles.domainToggleTextActive,
                ]}
              >
                Existing Domain
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Create new domain"
              accessibilityRole="button"
              style={[
                styles.domainToggleButton,
                useNewDomain && styles.domainToggleButtonActive,
              ]}
              onPress={() => setUseNewDomain(true)}
            >
              <Text
                style={[
                  styles.domainToggleText,
                  useNewDomain && styles.domainToggleTextActive,
                ]}
              >
                + New Domain
              </Text>
            </TouchableOpacity>
          </View>

          {!useNewDomain ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {domains.map((d) => (
                <TouchableOpacity
                  key={d}
                  accessibilityLabel={`Select ${d} domain`}
                  accessibilityRole="button"
                  style={[
                    styles.domainChip,
                    formData.domain === d && styles.domainChipActive,
                  ]}
                  onPress={() => updateField("domain", d)}
                >
                  <Text
                    style={[
                      styles.domainChipText,
                      formData.domain === d && styles.domainChipTextActive,
                    ]}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <TextInput
              style={styles.formFieldInput}
              value={newDomain}
              onChangeText={setNewDomain}
              placeholder="Enter new domain name"
            />
          )}
          {errors.domain && (
            <Text style={styles.formFieldError}>{errors.domain}</Text>
          )}
        </View>

        {/* Subdomain */}
        <FormField
          label="Subdomain (optional)"
          value={formData.subdomain}
          onChangeText={(v) => updateField("subdomain", v)}
          placeholder="e.g., basics"
        />

        {/* Requirement Type */}
        <View style={styles.formFieldContainer}>
          <Text style={styles.formFieldLabel}>Requirement Type</Text>
          <View style={styles.pickerContainer}>
            {VALID_REQUIREMENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                accessibilityLabel={`Select ${type} requirement type`}
                accessibilityRole="button"
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
        </View>

        {/* Difficulty Tier */}
        <FormField
          label="Difficulty Tier (1-5)"
          value={String(formData.difficulty_tier)}
          onChangeText={(v) => updateField("difficulty_tier", v)}
          error={errors.difficulty_tier}
          keyboardType="numeric"
        />

        {/* Prerequisites */}
        <View style={styles.formFieldContainer}>
          <Text style={styles.formFieldLabel}>Prerequisites</Text>
          <Text style={styles.prereqHint}>
            Capabilities that must be mastered before this one can be
            introduced.
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
                      accessibilityLabel={`Remove prerequisite ${prereq.display_name || prereq.name}`}
                      accessibilityRole="button"
                      style={styles.prereqChipRemove}
                      onPress={() => {
                        setSelectedPrereqIds((prev) =>
                          prev.filter((id) => id !== prereqId),
                        );
                        setSaveError(null);
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
            accessibilityLabel="Add prerequisite"
            accessibilityRole="button"
            style={styles.addPrereqButton}
            onPress={() => setShowPrereqSelector(true)}
          >
            <Text style={styles.addPrereqButtonText}>+ Add Prerequisite</Text>
          </TouchableOpacity>
        </View>

        {/* Prerequisite Selector Modal */}
        <Modal
          visible={showPrereqSelector}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPrereqSelector(false)}
        >
          <PrerequisiteSelector
            currentCapabilityId={null}
            allCapabilities={allCapabilities}
            selectedIds={selectedPrereqIds}
            onSelect={(id) => {
              if (!selectedPrereqIds.includes(id)) {
                setSelectedPrereqIds((prev) => [...prev, id]);
                setSaveError(null);
              }
            }}
            onClose={() => setShowPrereqSelector(false)}
            prereqDomainFilter={prereqDomainFilter}
            setPrereqDomainFilter={setPrereqDomainFilter}
            prereqSearchQuery={prereqSearchQuery}
            setPrereqSearchQuery={setPrereqSearchQuery}
          />
        </Modal>

        {/* Save Error */}
        {saveError && (
          <View style={styles.saveErrorContainer}>
            <Text style={styles.saveErrorText}>{saveError}</Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.editModalFooter}>
        <TouchableOpacity
          accessibilityLabel="Cancel"
          accessibilityRole="button"
          style={[styles.editModalButton, styles.cancelButton]}
          onPress={onClose}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel={saving ? "Creating" : "Create capability"}
          accessibilityRole="button"
          style={[
            styles.editModalButton,
            styles.saveButton,
            saving && styles.saveButtonDisabled,
          ]}
          onPress={handleCreate}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Creating..." : "Create"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
