/**
 * DomainManageModal - Modal for managing capability domains
 */
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import styles from "../../../styles";

export default function DomainManageModal({
  domains,
  capabilities,
  onClose,
  onRename,
}) {
  const [editingDomain, setEditingDomain] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Count capabilities per domain
  const domainCounts = {};
  capabilities.forEach((c) => {
    domainCounts[c.domain] = (domainCounts[c.domain] || 0) + 1;
  });

  const startEditing = (domain) => {
    setEditingDomain(domain);
    setEditValue(domain);
    setSaveError(null);
  };

  const cancelEditing = () => {
    setEditingDomain(null);
    setEditValue("");
    setSaveError(null);
  };

  const handleSaveRename = async () => {
    if (!editValue.trim()) {
      setSaveError("Domain name cannot be empty");
      return;
    }
    if (editValue.trim() === editingDomain) {
      cancelEditing();
      return;
    }

    setSaving(true);
    setSaveError(null);

    const result = await onRename(editingDomain, editValue.trim());

    setSaving(false);
    if (result.success) {
      setEditingDomain(null);
      setEditValue("");
    } else {
      setSaveError(result.error);
    }
  };

  return (
    <View style={styles.editModalContainer}>
      <View style={styles.editModalHeader}>
        <Text style={styles.editModalTitle}>Manage Domains</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={{ padding: 16, backgroundColor: "#f0f0f0" }}>
        <Text style={{ color: "#666", fontSize: 12 }}>
          Domains are sorted alphabetically. Renaming a domain will update all
          capabilities in that domain and re-sort bit_indexes.
        </Text>
      </View>

      <ScrollView style={styles.editModalContent}>
        {domains.map((domain) => (
          <View key={domain} style={styles.domainReorderItem}>
            {editingDomain === domain ? (
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.domainEditInput}
                  value={editValue}
                  onChangeText={setEditValue}
                  autoFocus
                  placeholder="Domain name"
                />
                {saveError && (
                  <Text
                    style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}
                  >
                    {saveError}
                  </Text>
                )}
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                  <TouchableOpacity
                    style={[
                      styles.domainEditActionButton,
                      { backgroundColor: "#6b7280" },
                    ]}
                    onPress={cancelEditing}
                    disabled={saving}
                  >
                    <Text style={{ color: "#fff", fontSize: 12 }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.domainEditActionButton,
                      { backgroundColor: "#3b82f6" },
                    ]}
                    onPress={handleSaveRename}
                    disabled={saving}
                  >
                    <Text style={{ color: "#fff", fontSize: 12 }}>
                      {saving ? "Saving..." : "Save"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <View style={{ flex: 1 }}>
                  <Text style={styles.domainReorderName}>{domain}</Text>
                  <Text style={styles.domainReorderCount}>
                    {domainCounts[domain] || 0} capabilities
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.domainEditButton}
                  onPress={() => startEditing(domain)}
                >
                  <Text style={styles.domainEditButtonText}>Edit</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.editModalFooter}>
        <TouchableOpacity
          style={[styles.editModalButton, styles.cancelButton]}
          onPress={onClose}
        >
          <Text style={styles.cancelButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
