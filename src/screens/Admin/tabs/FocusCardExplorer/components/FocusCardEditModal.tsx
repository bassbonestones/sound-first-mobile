/**
 * FocusCardEditModal - Edit modal for focus card
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
import { baseUrl } from "../../../../../api/client";
import FormField from "./FormField";

interface FocusCard {
  id?: number;
  name?: string;
  category?: string;
  description?: string;
  attention_cue?: string;
  micro_cues?: string[];
  prompts?: Record<string, string>;
}

interface FocusCardEditModalProps {
  focusCard: FocusCard;
  categories: string[];
  onClose: () => void;
  onSave: () => Promise<void>;
}

export default function FocusCardEditModal({
  focusCard,
  categories,
  onClose,
  onSave,
}: FocusCardEditModalProps) {
  const [formData, setFormData] = useState({
    name: focusCard.name,
    category: focusCard.category || "",
    description: focusCard.description || "",
    attention_cue: focusCard.attention_cue || "",
    micro_cues: JSON.stringify(focusCard.micro_cues || [], null, 2),
    prompts: JSON.stringify(focusCard.prompts || {}, null, 2),
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

  const handleSave = async () => {
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
      const response = await fetch(
        `${baseUrl}/admin/focus-cards/${focusCard.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            category: finalCategory,
            description: formData.description,
            attention_cue: formData.attention_cue,
            micro_cues: JSON.parse(formData.micro_cues),
            prompts: JSON.parse(formData.prompts),
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
          <Text style={styles.detailModalTitle}>Edit Focus Card</Text>
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
            label="Name"
            value={formData.name}
            onChangeText={(v) => updateField("name", v)}
            error={errors.name}
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
          />

          <FormField
            label="Attention Cue"
            value={formData.attention_cue}
            onChangeText={(v) => updateField("attention_cue", v)}
            multiline
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
