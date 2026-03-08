/**
 * CapabilityDetailView - Shows details of a capability
 */
import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import styles from "../../../styles";
import DetailRow from "./DetailRow";

export default function CapabilityDetailView({
  capability,
  dependencyGraph,
  onClose,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!capability) return null;

  const isActive = capability.is_active !== false;

  const handleDeletePress = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete(capability);
  };

  return (
    <ScrollView style={styles.detailContainer}>
      <View style={styles.detailHeader}>
        <Text style={styles.detailTitle}>
          {capability.display_name || capability.name}
        </Text>
        <View style={styles.detailHeaderButtons}>
          {isActive ? (
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: "#f59e0b" }]}
              onPress={() => onArchive(capability)}
            >
              <Text style={styles.editButtonText}>Archive</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: "#10b981" }]}
              onPress={() => onRestore(capability)}
            >
              <Text style={styles.editButtonText}>Restore</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onEdit(capability)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: "#dc2626" }]}
            onPress={handleDeletePress}
          >
            <Text style={styles.editButtonText}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <View style={styles.deleteConfirmContainer}>
          <Text style={styles.deleteConfirmText}>
            Are you sure you want to permanently delete "{capability.name}"?
          </Text>
          <View style={styles.deleteConfirmButtons}>
            <TouchableOpacity
              style={[
                styles.deleteConfirmButton,
                { backgroundColor: "#6b7280" },
              ]}
              onPress={() => setShowDeleteConfirm(false)}
            >
              <Text style={styles.deleteConfirmButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.deleteConfirmButton,
                { backgroundColor: "#dc2626" },
              ]}
              onPress={confirmDelete}
            >
              <Text style={styles.deleteConfirmButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Basic Info</Text>
        <DetailRow label="Name" value={capability.name} />
        <DetailRow label="Display Name" value={capability.display_name} />
        <DetailRow label="Domain" value={capability.domain} />
        <DetailRow label="Subdomain" value={capability.subdomain || "None"} />
        <DetailRow
          label="Bit Index"
          value={String(capability.bit_index ?? "N/A")}
        />
        <DetailRow
          label="Active"
          value={capability.is_active !== false ? "Yes" : "No"}
        />
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Difficulty & Requirements</Text>
        <DetailRow
          label="Difficulty Tier"
          value={String(capability.difficulty_tier || 1)}
        />
        <DetailRow
          label="Difficulty Weight"
          value={String(capability.difficulty_weight || 1.0)}
        />
        <DetailRow
          label="Requirement Type"
          value={capability.requirement_type || "required"}
        />
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Evidence Rules</Text>
        <DetailRow
          label="Required Count"
          value={String(capability.evidence_required_count || 1)}
        />
        <DetailRow
          label="Distinct Materials"
          value={capability.evidence_distinct_materials ? "Yes" : "No"}
        />
        <DetailRow
          label="Acceptance Threshold"
          value={String(capability.evidence_acceptance_threshold || 4)}
        />
        <DetailRow
          label="Mastery Type"
          value={capability.mastery_type || "single"}
        />
        <DetailRow
          label="Mastery Count"
          value={String(capability.mastery_count || 1)}
        />
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Prerequisites</Text>
        {capability.prerequisite_names?.length > 0 ? (
          capability.prerequisite_names.map((prereq, idx) => (
            <Text key={idx} style={styles.prerequisiteItem}>
              • {prereq}
            </Text>
          ))
        ) : (
          <Text style={styles.noDataText}>No prerequisites</Text>
        )}
      </View>

      {dependencyGraph && (
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Dependency Graph</Text>
          <Text style={styles.graphText}>
            Depends on: {dependencyGraph.depends_on?.length || 0} capabilities
          </Text>
          <Text style={styles.graphText}>
            Required by: {dependencyGraph.required_by?.length || 0} capabilities
          </Text>
          {dependencyGraph.depends_on?.map((dep, idx) => (
            <Text key={idx} style={styles.dependencyItem}>
              ← {dep}
            </Text>
          ))}
          {dependencyGraph.required_by?.map((dep, idx) => (
            <Text key={idx} style={styles.dependencyItem}>
              → {dep}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Materials</Text>
        <Text style={styles.noDataText}>
          Load material associations from admin API
        </Text>
      </View>
    </ScrollView>
  );
}
