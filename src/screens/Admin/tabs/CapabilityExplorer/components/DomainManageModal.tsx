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
  StyleSheet,
} from "react-native";
import styles from "../../../styles";

interface Capability {
  domain: string;
}

interface RenameResult {
  success: boolean;
  error?: string;
}

interface DomainManageModalProps {
  domains: string[];
  capabilities: Capability[];
  onClose: () => void;
  onRename: (oldName: string, newName: string) => Promise<RenameResult>;
}

export default function DomainManageModal({
  domains,
  capabilities,
  onClose,
  onRename,
}: DomainManageModalProps) {
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
        <TouchableOpacity
          accessibilityLabel="Close domain management"
          accessibilityRole="button"
          style={styles.closeButton}
          onPress={onClose}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={localStyles.infoContainer}>
        <Text style={localStyles.infoText}>
          Domains are sorted alphabetically. Renaming a domain will update all
          capabilities in that domain and re-sort bit_indexes.
        </Text>
      </View>

      <ScrollView style={styles.editModalContent}>
        {domains.map((domain) => (
          <View key={domain} style={styles.domainReorderItem}>
            {editingDomain === domain ? (
              <View style={localStyles.flexContainer}>
                <TextInput
                  style={styles.domainEditInput}
                  value={editValue}
                  onChangeText={setEditValue}
                  autoFocus
                  placeholder="Domain name"
                />
                {saveError && (
                  <Text style={localStyles.errorText}>{saveError}</Text>
                )}
                <View style={localStyles.buttonRow}>
                  <TouchableOpacity
                    accessibilityLabel="Cancel rename"
                    accessibilityRole="button"
                    style={[
                      styles.domainEditActionButton,
                      { backgroundColor: "#6b7280" },
                    ]}
                    onPress={cancelEditing}
                    disabled={saving}
                  >
                    <Text style={localStyles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityLabel={saving ? "Saving" : "Save domain name"}
                    accessibilityRole="button"
                    style={[
                      styles.domainEditActionButton,
                      { backgroundColor: "#3b82f6" },
                    ]}
                    onPress={handleSaveRename}
                    disabled={saving}
                  >
                    <Text style={localStyles.buttonText}>
                      {saving ? "Saving..." : "Save"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <View style={localStyles.flexContainer}>
                  <Text style={styles.domainReorderName}>{domain}</Text>
                  <Text style={styles.domainReorderCount}>
                    {domainCounts[domain] || 0} capabilities
                  </Text>
                </View>
                <TouchableOpacity
                  accessibilityLabel={`Edit ${domain} domain name`}
                  accessibilityRole="button"
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
          accessibilityLabel="Close"
          accessibilityRole="button"
          style={[styles.editModalButton, styles.cancelButton]}
          onPress={onClose}
        >
          <Text style={styles.cancelButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  infoContainer: {
    padding: 16,
    backgroundColor: "#f0f0f0",
  },
  infoText: {
    color: "#666",
    fontSize: 12,
  },
  flexContainer: {
    flex: 1,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
  },
});
