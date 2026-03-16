/**
 * FocusCardCreateModal - Create modal for new focus card
 */
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import styles from "../../../styles";
import FormField from "./FormField";

interface FocusCardData {
  name: string;
  category: string;
  description: string;
  attention_cue: string;
  micro_cues: string[];
  prompts: Record<string, string>;
}

interface FocusCardCreateModalProps {
  categories: string[];
  onClose: () => void;
  onCreate: (data: FocusCardData) => Promise<void>;
}

export default function FocusCardCreateModal({
  categories,
  onClose,
  onCreate,
}: FocusCardCreateModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: categories[0] || "",
    description: "",
    attention_cue: "",
    micro_cues: "[]",
    prompts: "{}",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
    setSaveError(null);
  };

  const validateJSON = (str, fieldName) => {
    try {
      JSON.parse(str);
      return null;
    } catch (e) {
      return `Invalid JSON for ${fieldName}`;
    }
  };

  const handleCreate = async () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    const microCuesError = validateJSON(formData.micro_cues, "micro_cues");
    if (microCuesError) newErrors.micro_cues = microCuesError;
    const promptsError = validateJSON(formData.prompts, "prompts");
    if (promptsError) newErrors.prompts = promptsError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const finalCategory = showNewCategory ? newCategory : formData.category;
      await onCreate({
        name: formData.name,
        category: finalCategory,
        description: formData.description,
        attention_cue: formData.attention_cue,
        micro_cues: JSON.parse(formData.micro_cues),
        prompts: JSON.parse(formData.prompts),
      });
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
          <Text style={styles.detailModalTitle}>Create Focus Card</Text>
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
            label="Name"
            value={formData.name}
            onChangeText={(v) => updateField("name", v)}
            error={errors.name}
            placeholder="e.g., Pitch Center"
          />

          {/* Category Picker */}
          <View style={styles.formFieldContainer}>
            <Text style={styles.formFieldLabel}>Category</Text>
            {!showNewCategory ? (
              <View>
                <View style={styles.pickerContainer}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      accessibilityLabel={`Select ${cat} category`}
                      accessibilityRole="button"
                      style={[
                        styles.pickerOption,
                        formData.category === cat &&
                          styles.pickerOptionSelected,
                      ]}
                      onPress={() => updateField("category", cat)}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          formData.category === cat &&
                            styles.pickerOptionTextSelected,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    accessibilityLabel="Create new category"
                    accessibilityRole="button"
                    style={styles.pickerOption}
                    onPress={() => setShowNewCategory(true)}
                  >
                    <Text style={styles.pickerOptionText}>+ New</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                <TextInput
                  style={styles.formFieldInput}
                  value={newCategory}
                  onChangeText={setNewCategory}
                  placeholder="Enter new category"
                />
                <TouchableOpacity
                  accessibilityLabel="Cancel new category"
                  accessibilityRole="button"
                  style={styles.cancelNewButton}
                  onPress={() => {
                    setShowNewCategory(false);
                    setNewCategory("");
                  }}
                >
                  <Text style={styles.cancelNewButtonText}>
                    Cancel new category
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <FormField
            label="Description"
            value={formData.description}
            onChangeText={(v) => updateField("description", v)}
            multiline
            placeholder="Brief description of the focus card"
          />

          <FormField
            label="Attention Cue"
            value={formData.attention_cue}
            onChangeText={(v) => updateField("attention_cue", v)}
            multiline
            placeholder="Main attention cue for the student"
          />

          <View style={styles.formFieldContainer}>
            <Text style={styles.formFieldLabel}>Micro Cues (JSON Array)</Text>
            <TextInput
              style={[
                styles.formFieldInput,
                styles.jsonInput,
                errors.micro_cues && styles.formFieldInputError,
              ]}
              value={formData.micro_cues}
              onChangeText={(v) => updateField("micro_cues", v)}
              multiline
              numberOfLines={4}
              placeholder='["Cue 1", "Cue 2", "Cue 3"]'
            />
            {errors.micro_cues && (
              <Text style={styles.formFieldError}>{errors.micro_cues}</Text>
            )}
          </View>

          <View style={styles.formFieldContainer}>
            <Text style={styles.formFieldLabel}>Prompts (JSON Object)</Text>
            <TextInput
              style={[
                styles.formFieldInput,
                styles.jsonInput,
                errors.prompts && styles.formFieldInputError,
              ]}
              value={formData.prompts}
              onChangeText={(v) => updateField("prompts", v)}
              multiline
              numberOfLines={6}
              placeholder='{"listen": "...", "sing": "...", "imagine_instrument": "..."}'
            />
            {errors.prompts && (
              <Text style={styles.formFieldError}>{errors.prompts}</Text>
            )}
          </View>

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
            accessibilityLabel={saving ? "Creating" : "Create focus card"}
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
