/**
 * FocusCardExplorer - Focus card management
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
import { useFocusCards } from "./hooks";
import { baseUrl } from "../../../../api/client";

function FocusCardExplorer() {
  // Use extracted hook for all state and CRUD operations
  const {
    focusCards,
    filteredFocusCards,
    loading,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    categories,
    selectedFocusCard,
    setSelectedFocusCard,
    createFocusCard,
    deleteFocusCard,
    fetchFocusCards,
  } = useFocusCards();

  // Modal visibility state (UI-only, not in hook)
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleDelete = async (focusCardId) => {
    const result = await deleteFocusCard(focusCardId);
    if (result.success) {
      setShowDetailModal(false);
      setSelectedFocusCard(null);
    } else {
      alert(result.error || "Failed to delete focus card");
    }
  };

  const handleCreate = async (createData) => {
    const result = await createFocusCard(createData);
    if (result.success) {
      setShowCreateModal(false);
    } else {
      throw new Error(result.error || "Failed to create focus card");
    }
  };

  const renderFocusCardItem = ({ item }) => (
    <View style={styles.listItem}>
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={() => {
          setSelectedFocusCard(item);
          setShowDetailModal(true);
        }}
      >
        <View style={styles.listItemHeader}>
          <Text style={styles.listItemTitle}>{item.name}</Text>
          <Text style={styles.listItemBadge}>
            {item.category || "Uncategorized"}
          </Text>
        </View>
        <View style={styles.listItemDetails}>
          <Text style={styles.listItemDetail}>
            {item.micro_cues?.length || 0} micro cues
          </Text>
          <Text style={styles.listItemDetail}>
            {Object.keys(item.prompts || {}).length} prompts
          </Text>
        </View>
        {item.description && (
          <Text style={styles.listItemSubtext} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading focus cards...</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {/* Search and Filters */}
      <View style={styles.filterBar}>
        <TextInput
          style={[styles.searchInput, { flex: 1 }]}
          placeholder="Search focus cards..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.addCapButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.addCapButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        style={styles.domainScroll}
        showsHorizontalScrollIndicator={false}
      >
        <TouchableOpacity
          style={[
            styles.domainChip,
            categoryFilter === "all" && styles.domainChipActive,
          ]}
          onPress={() => setCategoryFilter("all")}
        >
          <Text
            style={[
              styles.domainChipText,
              categoryFilter === "all" && styles.domainChipTextActive,
            ]}
          >
            All ({focusCards.length})
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.domainChip,
              categoryFilter === cat && styles.domainChipActive,
            ]}
            onPress={() => setCategoryFilter(cat)}
          >
            <Text
              style={[
                styles.domainChipText,
                categoryFilter === cat && styles.domainChipTextActive,
              ]}
            >
              {cat} ({focusCards.filter((fc) => fc.category === cat).length})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Result count */}
      <Text style={styles.resultCount}>
        {filteredFocusCards.length} focus card
        {filteredFocusCards.length !== 1 ? "s" : ""}
      </Text>

      {/* Focus Cards List */}
      <FlatList
        data={filteredFocusCards}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderFocusCardItem}
        style={styles.list}
        ListEmptyComponent={
          <Text style={styles.noDataText}>No focus cards found</Text>
        }
      />

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        {selectedFocusCard && (
          <FocusCardDetailView
            focusCard={selectedFocusCard}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedFocusCard(null);
            }}
            onEdit={() => {
              setShowDetailModal(false);
              setShowEditModal(true);
            }}
            onDelete={() => handleDelete(selectedFocusCard.id)}
          />
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        {selectedFocusCard && (
          <FocusCardEditModal
            focusCard={selectedFocusCard}
            categories={categories}
            onClose={() => {
              setShowEditModal(false);
              setSelectedFocusCard(null);
            }}
            onSave={async () => {
              await fetchFocusCards();
              setShowEditModal(false);
              setSelectedFocusCard(null);
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
        <FocusCardCreateModal
          categories={categories}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      </Modal>
    </View>
  );
}

function FocusCardDetailView({ focusCard, onClose, onEdit, onDelete }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.detailModal}>
        <View style={styles.detailModalHeader}>
          <Text style={styles.detailModalTitle}>{focusCard.name}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.detailModalContent}>
          <DetailRow label="ID" value={focusCard.id} />
          <DetailRow label="Category" value={focusCard.category || "None"} />
          <DetailRow
            label="Description"
            value={focusCard.description || "None"}
          />
          <DetailRow
            label="Attention Cue"
            value={focusCard.attention_cue || "None"}
          />

          <Text style={styles.detailSectionTitle}>Micro Cues</Text>
          {focusCard.micro_cues?.length > 0 ? (
            focusCard.micro_cues.map((cue, index) => (
              <Text key={index} style={styles.listItemText}>
                • {cue}
              </Text>
            ))
          ) : (
            <Text style={styles.listItemSubtext}>No micro cues defined</Text>
          )}

          <Text style={styles.detailSectionTitle}>Prompts</Text>
          {Object.keys(focusCard.prompts || {}).length > 0 ? (
            Object.entries(focusCard.prompts).map(([key, value]) => (
              <View key={key} style={styles.promptItem}>
                <Text style={styles.promptKey}>{key}:</Text>
                <Text style={styles.promptValue}>{value}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.listItemSubtext}>No prompts defined</Text>
          )}
        </ScrollView>

        <View style={styles.detailModalActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.modalEditButton]}
            onPress={onEdit}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => setShowDeleteConfirm(true)}
          >
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>Delete "{focusCard.name}"?</Text>
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

function FocusCardEditModal({ focusCard, categories, onClose, onSave }) {
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
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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

function FocusCardCreateModal({ categories, onClose, onCreate }) {
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
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function DetailRow({ label, value, valueStyle }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={[styles.detailValue, valueStyle]}>{value}</Text>
    </View>
  );
}

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
// SECTION 6: SOFT GATE EXPLORER
// =============================================================================

export default FocusCardExplorer;
