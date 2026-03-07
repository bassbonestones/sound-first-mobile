/**
 * CapabilityExplorer - Browse/filter/inspect capabilities
 * Part of Admin console
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  Switch,
} from "react-native";
import { baseUrl } from "../../../../api/client";
import styles from "../../styles";

function CapabilityExplorer() {
  const [capabilities, setCapabilities] = useState([]);
  const [filteredCapabilities, setFilteredCapabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [domains, setDomains] = useState([]);
  const [selectedCapability, setSelectedCapability] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDomainManageModal, setShowDomainManageModal] = useState(false);
  const [dependencyGraph, setDependencyGraph] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  useEffect(() => {
    loadCapabilities();
  }, []);

  useEffect(() => {
    filterCapabilities();
  }, [capabilities, searchQuery, domainFilter]);

  const loadCapabilities = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/admin/capabilities`);
      if (!response.ok) throw new Error("Failed to load capabilities");
      const data = await response.json();
      setCapabilities(data.capabilities || []);

      // Extract unique domains
      const uniqueDomains = [
        ...new Set((data.capabilities || []).map((c) => c.domain)),
      ].sort();
      setDomains(uniqueDomains);
    } catch (err) {
      console.error("[AdminScreen] Load capabilities error:", err);
      // Fallback to v2 endpoint
      try {
        const fallback = await fetch(`${baseUrl}/capabilities/v2`);
        const data = await fallback.json();
        setCapabilities(data.capabilities || []);
        const uniqueDomains = [
          ...new Set((data.capabilities || []).map((c) => c.domain)),
        ].sort();
        setDomains(uniqueDomains);
      } catch (e) {
        console.error("[AdminScreen] Fallback failed:", e);
      }
    }
    setLoading(false);
  };

  const filterCapabilities = () => {
    let filtered = [...capabilities];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name?.toLowerCase().includes(query) ||
          c.display_name?.toLowerCase().includes(query) ||
          c.domain?.toLowerCase().includes(query),
      );
    }

    if (domainFilter !== "all") {
      filtered = filtered.filter((c) => c.domain === domainFilter);
    }

    // Sort by bit_index to maintain proper order
    filtered.sort((a, b) => (a.bit_index ?? 0) - (b.bit_index ?? 0));

    setFilteredCapabilities(filtered);
  };

  const viewCapabilityDetail = async (capability) => {
    setSelectedCapability(capability);
    setShowDetailModal(true);

    // Load dependency graph
    try {
      const response = await fetch(
        `${baseUrl}/admin/capabilities/${capability.id}/graph`,
      );
      if (response.ok) {
        const graph = await response.json();
        setDependencyGraph(graph);
      }
    } catch (err) {
      console.log("[AdminScreen] Could not load dependency graph");
    }
  };

  const handleEditCapability = (capability) => {
    setSelectedCapability(capability);
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleCapabilitySaved = async (updatedCapability) => {
    const capId = updatedCapability.id;
    // Reload capabilities from server to get fresh data
    try {
      const response = await fetch(`${baseUrl}/admin/capabilities`);
      if (response.ok) {
        const data = await response.json();
        const freshCapabilities = data.capabilities || [];
        setCapabilities(freshCapabilities);

        // Extract unique domains
        const uniqueDomains = [
          ...new Set(freshCapabilities.map((c) => c.domain)),
        ].sort();
        setDomains(uniqueDomains);

        // Find and set the fresh capability for detail view
        const freshCap = freshCapabilities.find((c) => c.id === capId);
        if (freshCap) {
          setSelectedCapability(freshCap);
        }
      }
    } catch (err) {
      console.error("[AdminScreen] Failed to reload capabilities:", err);
    }
    setShowEditModal(false);
    setShowDetailModal(true);
  };

  const handleArchiveCapability = async (capability) => {
    try {
      const response = await fetch(
        `${baseUrl}/admin/capabilities/${capability.id}/archive`,
        { method: "POST" },
      );
      if (response.ok) {
        const updated = { ...capability, is_active: false };
        setCapabilities((prev) =>
          prev.map((c) => (c.id === capability.id ? updated : c)),
        );
        setSelectedCapability(updated);
      }
    } catch (err) {
      console.log("[AdminScreen] Could not archive capability", err);
    }
  };

  const handleRestoreCapability = async (capability) => {
    try {
      const response = await fetch(
        `${baseUrl}/admin/capabilities/${capability.id}/restore`,
        { method: "POST" },
      );
      if (response.ok) {
        const updated = { ...capability, is_active: true };
        setCapabilities((prev) =>
          prev.map((c) => (c.id === capability.id ? updated : c)),
        );
        setSelectedCapability(updated);
      }
    } catch (err) {
      console.log("[AdminScreen] Could not restore capability", err);
    }
  };

  const handleDeleteCapability = async (capability) => {
    try {
      const response = await fetch(
        `${baseUrl}/admin/capabilities/${capability.id}`,
        { method: "DELETE" },
      );
      if (response.ok) {
        const data = await response.json();
        // Reload capabilities to get updated bit_indexes
        await loadCapabilities();
        setShowDetailModal(false);
        setSelectedCapability(null);
      }
    } catch (err) {
      console.log("[AdminScreen] Could not delete capability", err);
    }
  };

  const handleCreateCapability = async (createData) => {
    try {
      const response = await fetch(`${baseUrl}/admin/capabilities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createData),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // Reload capabilities to get the new one with all fields
        await loadCapabilities();
        setShowCreateModal(false);
        return { success: true };
      } else {
        return {
          success: false,
          error: data.detail || "Failed to create capability",
        };
      }
    } catch (err) {
      console.log("[AdminScreen] Could not create capability", err);
      return { success: false, error: "Network error" };
    }
  };

  const handleMoveCapability = async (capability, direction) => {
    // Only works when viewing a specific domain
    if (domainFilter === "all") return;

    // Get capabilities in this domain sorted by bit_index
    const domainCaps = capabilities
      .filter((c) => c.domain === domainFilter)
      .sort((a, b) => (a.bit_index ?? 0) - (b.bit_index ?? 0));

    const currentIndex = domainCaps.findIndex((c) => c.id === capability.id);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= domainCaps.length) return;

    // Swap positions
    const newOrder = [...domainCaps];
    [newOrder[currentIndex], newOrder[newIndex]] = [
      newOrder[newIndex],
      newOrder[currentIndex],
    ];

    // Send reorder request
    try {
      const response = await fetch(`${baseUrl}/admin/capabilities/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: domainFilter,
          capability_ids: newOrder.map((c) => c.id),
        }),
      });
      if (response.ok) {
        const data = await response.json();
        // Update local state with new bit_indexes
        const newBitIndexes = {};
        data.new_order.forEach((item) => {
          newBitIndexes[item.id] = item.bit_index;
        });
        setCapabilities((prev) =>
          prev.map((c) => ({
            ...c,
            bit_index: newBitIndexes[c.id] ?? c.bit_index,
          })),
        );
      }
    } catch (err) {
      console.log("[AdminScreen] Could not reorder capabilities", err);
    }
  };

  const handleRenameDomain = async (oldName, newName) => {
    try {
      const response = await fetch(`${baseUrl}/admin/domains/rename`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_name: oldName, new_name: newName }),
      });
      if (response.ok) {
        // Reload capabilities to get updated domains
        await loadCapabilities();
        return { success: true };
      } else {
        const data = await response.json();
        return {
          success: false,
          error: data.detail || "Failed to rename domain",
        };
      }
    } catch (err) {
      console.log("[AdminScreen] Could not rename domain", err);
      return { success: false, error: "Network error" };
    }
  };

  const handleExportToFile = async () => {
    setExporting(true);
    setExportStatus(null);
    try {
      const response = await fetch(`${baseUrl}/admin/capabilities/export`, {
        method: "POST",
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setExportStatus({
          type: "success",
          message: `Exported to ${data.filename}`,
        });
      } else {
        setExportStatus({
          type: "error",
          message: data.detail?.message || "Export failed",
        });
      }
    } catch (err) {
      console.error("[AdminScreen] Export error:", err);
      setExportStatus({
        type: "error",
        message: "Failed to connect to server",
      });
    }
    setExporting(false);
    // Clear status after 5 seconds
    setTimeout(() => setExportStatus(null), 5000);
  };

  const renderCapabilityItem = ({ item, index }) => {
    // Get domain capabilities sorted by bit_index for determining if up/down is possible
    const domainCaps =
      domainFilter !== "all"
        ? capabilities
            .filter((c) => c.domain === domainFilter)
            .sort((a, b) => (a.bit_index ?? 0) - (b.bit_index ?? 0))
        : [];
    const itemIndex = domainCaps.findIndex((c) => c.id === item.id);
    const canMoveUp = domainFilter !== "all" && itemIndex > 0;
    const canMoveDown =
      domainFilter !== "all" && itemIndex < domainCaps.length - 1;

    return (
      <View style={styles.listItem}>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => viewCapabilityDetail(item)}
        >
          <View style={styles.listItemHeader}>
            <Text style={styles.listItemTitle}>
              {item.display_name || item.name}
            </Text>
            <Text style={styles.listItemBadge}>{item.domain}</Text>
          </View>
          <View style={styles.listItemDetails}>
            <Text style={styles.listItemDetail}>
              Bit: {item.bit_index ?? "N/A"}
            </Text>
            <Text style={styles.listItemDetail}>
              Tier: {item.difficulty_tier || 1}
            </Text>
            <Text style={styles.listItemDetail}>
              Type: {item.requirement_type || "required"}
            </Text>
            <Text
              style={[
                styles.listItemDetail,
                { color: item.is_active !== false ? "#4CAF50" : "#f44336" },
              ]}
            >
              {item.is_active !== false ? "Active" : "Inactive"}
            </Text>
          </View>
          {item.prerequisite_names?.length > 0 && (
            <Text style={styles.listItemSubtext}>
              Prerequisites: {item.prerequisite_names.join(", ")}
            </Text>
          )}
          {item.soft_gate_requirements &&
            Object.keys(item.soft_gate_requirements).length > 0 && (
              <Text style={[styles.listItemSubtext, { color: "#9C27B0" }]}>
                Soft Gates:{" "}
                {Object.entries(item.soft_gate_requirements)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(", ")}
              </Text>
            )}
        </TouchableOpacity>
        {domainFilter !== "all" && (
          <View style={styles.reorderButtons}>
            <TouchableOpacity
              style={[
                styles.reorderButton,
                !canMoveUp && styles.reorderButtonDisabled,
              ]}
              onPress={() => canMoveUp && handleMoveCapability(item, "up")}
              disabled={!canMoveUp}
            >
              <Text style={styles.reorderButtonText}>▲</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.reorderButton,
                !canMoveDown && styles.reorderButtonDisabled,
              ]}
              onPress={() => canMoveDown && handleMoveCapability(item, "down")}
              disabled={!canMoveDown}
            >
              <Text style={styles.reorderButtonText}>▼</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading capabilities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {/* Search and Filters */}
      <View style={styles.filterBar}>
        <TextInput
          style={[styles.searchInput, { flex: 1 }]}
          placeholder="Search capabilities..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.addCapButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.addCapButtonText}>+ Add</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.domainManageButton}
          onPress={() => setShowDomainManageModal(true)}
        >
          <Text style={styles.domainManageButtonText}>✎ Domains</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.exportButton,
            exporting && styles.exportButtonDisabled,
          ]}
          onPress={handleExportToFile}
          disabled={exporting}
        >
          <Text style={styles.exportButtonText}>
            {exporting ? "Exporting..." : "💾 Export"}
          </Text>
        </TouchableOpacity>
      </View>

      {exportStatus && (
        <View
          style={[
            styles.exportStatus,
            exportStatus.type === "success"
              ? styles.exportStatusSuccess
              : styles.exportStatusError,
          ]}
        >
          <Text
            style={
              exportStatus.type === "success"
                ? styles.exportStatusSuccessText
                : styles.exportStatusErrorText
            }
          >
            {exportStatus.message}
          </Text>
        </View>
      )}

      <ScrollView
        horizontal
        style={styles.domainScroll}
        showsHorizontalScrollIndicator={false}
      >
        <TouchableOpacity
          style={[
            styles.domainChip,
            domainFilter === "all" && styles.domainChipActive,
          ]}
          onPress={() => setDomainFilter("all")}
        >
          <Text
            style={[
              styles.domainChipText,
              domainFilter === "all" && styles.domainChipTextActive,
            ]}
          >
            All ({capabilities.length})
          </Text>
        </TouchableOpacity>
        {domains.map((domain) => (
          <TouchableOpacity
            key={domain}
            style={[
              styles.domainChip,
              domainFilter === domain && styles.domainChipActive,
            ]}
            onPress={() => setDomainFilter(domain)}
          >
            <Text
              style={[
                styles.domainChipText,
                domainFilter === domain && styles.domainChipTextActive,
              ]}
            >
              {domain}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <Text style={styles.resultCount}>
        {filteredCapabilities.length} capabilities
      </Text>

      <FlatList
        data={filteredCapabilities}
        renderItem={renderCapabilityItem}
        keyExtractor={(item) => String(item.id || item.name)}
        style={styles.list}
      />

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <CapabilityDetailView
          capability={selectedCapability}
          dependencyGraph={dependencyGraph}
          onClose={() => setShowDetailModal(false)}
          onEdit={handleEditCapability}
          onArchive={handleArchiveCapability}
          onRestore={handleRestoreCapability}
          onDelete={handleDeleteCapability}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <CapabilityEditModal
          capability={selectedCapability}
          allCapabilities={capabilities}
          onClose={() => {
            setShowEditModal(false);
            setShowDetailModal(true);
          }}
          onSave={handleCapabilitySaved}
        />
      </Modal>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <CapabilityCreateModal
          domains={domains}
          allCapabilities={capabilities}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateCapability}
          initialDomain={domainFilter !== "all" ? domainFilter : null}
        />
      </Modal>

      {/* Domain Manage Modal */}
      <Modal
        visible={showDomainManageModal}
        animationType="slide"
        onRequestClose={() => setShowDomainManageModal(false)}
      >
        <DomainManageModal
          domains={domains}
          capabilities={capabilities}
          onClose={() => setShowDomainManageModal(false)}
          onRename={handleRenameDomain}
        />
      </Modal>
    </View>
  );
}

function CapabilityDetailView({
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

// =============================================================================
// CAPABILITY EDIT MODAL
// =============================================================================

// Validation constants
const VALID_REQUIREMENT_TYPES = ["required", "learnable_in_context"];
const VALID_MASTERY_TYPES = ["single", "any_of_pool", "multiple"];
const MIN_RATING = 1;
const MAX_RATING = 5;
const MIN_DIFFICULTY_WEIGHT = 0.1;
const MAX_DIFFICULTY_WEIGHT = 10.0;

/**
 * Validates capability form data
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
function validateCapabilityForm(formData) {
  const errors = {};

  // Required string fields
  if (!formData.name?.trim()) {
    errors.name = "Name is required";
  } else if (!/^[a-z0-9_]+$/.test(formData.name.trim())) {
    errors.name = "Name must be lowercase alphanumeric with underscores only";
  }

  if (!formData.domain?.trim()) {
    errors.domain = "Domain is required";
  }

  const diffTier = Number(formData.difficulty_tier);
  if (isNaN(diffTier) || diffTier < 1 || diffTier > 5) {
    errors.difficulty_tier = "Difficulty tier must be 1-5";
  }

  const diffWeight = Number(formData.difficulty_weight);
  if (
    isNaN(diffWeight) ||
    diffWeight < MIN_DIFFICULTY_WEIGHT ||
    diffWeight > MAX_DIFFICULTY_WEIGHT
  ) {
    errors.difficulty_weight = `Difficulty weight must be ${MIN_DIFFICULTY_WEIGHT}-${MAX_DIFFICULTY_WEIGHT}`;
  }

  const masteryCount = Number(formData.mastery_count);
  if (isNaN(masteryCount) || masteryCount < 1) {
    errors.mastery_count = "Mastery count must be at least 1";
  }

  const evidenceCount = Number(formData.evidence_required_count);
  if (isNaN(evidenceCount) || evidenceCount < 1) {
    errors.evidence_required_count =
      "Evidence required count must be at least 1";
  }

  const threshold = Number(formData.evidence_acceptance_threshold);
  if (isNaN(threshold) || threshold < MIN_RATING || threshold > MAX_RATING) {
    errors.evidence_acceptance_threshold = `Acceptance threshold must be ${MIN_RATING}-${MAX_RATING}`;
  }

  // Enum validations
  if (!VALID_REQUIREMENT_TYPES.includes(formData.requirement_type)) {
    errors.requirement_type = `Must be one of: ${VALID_REQUIREMENT_TYPES.join(", ")}`;
  }

  if (!VALID_MASTERY_TYPES.includes(formData.mastery_type)) {
    errors.mastery_type = `Must be one of: ${VALID_MASTERY_TYPES.join(", ")}`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

function CapabilityEditModal({ capability, allCapabilities, onClose, onSave }) {
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
      const response = await fetch(
        `${baseUrl}/admin/capabilities/${capability.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
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
            prerequisite_ids: selectedPrereqIds,
            soft_gate_requirements: formData.soft_gate_requirements?.trim()
              ? JSON.parse(formData.soft_gate_requirements)
              : null,
            detection_rule: detectionRule,
          }),
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

/**
 * Reusable form field component
 */
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

/**
 * Prerequisite Selector Component
 *
 * Allows selecting capabilities as prerequisites with:
 * - Domain filtering
 * - Search by name
 * - Excludes current capability and already selected ones
 * - Backend validates for circular dependencies
 */
function PrerequisiteSelector({
  currentCapabilityId,
  allCapabilities,
  selectedIds,
  onSelect,
  onClose,
  prereqDomainFilter,
  setPrereqDomainFilter,
  prereqSearchQuery,
  setPrereqSearchQuery,
}) {
  // Get unique domains for filter
  const domains = [...new Set(allCapabilities.map((c) => c.domain))].sort();

  // Filter available capabilities
  const availableCapabilities = allCapabilities.filter((cap) => {
    // Exclude self
    if (cap.id === currentCapabilityId) return false;
    // Exclude already selected
    if (selectedIds.includes(cap.id)) return false;
    // Apply domain filter
    if (prereqDomainFilter !== "all" && cap.domain !== prereqDomainFilter)
      return false;
    // Apply search filter
    if (prereqSearchQuery) {
      const query = prereqSearchQuery.toLowerCase();
      const matchesName = cap.name?.toLowerCase().includes(query);
      const matchesDisplayName = cap.display_name
        ?.toLowerCase()
        .includes(query);
      if (!matchesName && !matchesDisplayName) return false;
    }
    return true;
  });

  // Sort by domain then name
  availableCapabilities.sort((a, b) => {
    if (a.domain !== b.domain) return a.domain.localeCompare(b.domain);
    return (a.display_name || a.name).localeCompare(b.display_name || b.name);
  });

  return (
    <View style={styles.prereqSelectorOverlay}>
      <View style={styles.prereqSelectorContainer}>
        <View style={styles.prereqSelectorHeader}>
          <Text style={styles.prereqSelectorTitle}>Select Prerequisite</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.prereqSelectorSearch}>
          <TextInput
            style={styles.prereqSearchInput}
            placeholder="Search capabilities..."
            value={prereqSearchQuery}
            onChangeText={setPrereqSearchQuery}
            autoCapitalize="none"
          />
        </View>

        {/* Domain filter chips */}
        <ScrollView
          horizontal
          style={styles.prereqDomainScroll}
          showsHorizontalScrollIndicator={false}
        >
          <TouchableOpacity
            style={[
              styles.prereqDomainChip,
              prereqDomainFilter === "all" && styles.prereqDomainChipActive,
            ]}
            onPress={() => setPrereqDomainFilter("all")}
          >
            <Text
              style={[
                styles.prereqDomainChipText,
                prereqDomainFilter === "all" &&
                  styles.prereqDomainChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {domains.map((domain) => (
            <TouchableOpacity
              key={domain}
              style={[
                styles.prereqDomainChip,
                prereqDomainFilter === domain && styles.prereqDomainChipActive,
              ]}
              onPress={() => setPrereqDomainFilter(domain)}
            >
              <Text
                style={[
                  styles.prereqDomainChipText,
                  prereqDomainFilter === domain &&
                    styles.prereqDomainChipTextActive,
                ]}
              >
                {domain}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results */}
        <Text style={styles.prereqResultCount}>
          {availableCapabilities.length} available
        </Text>

        <FlatList
          data={availableCapabilities}
          keyExtractor={(item) => String(item.id)}
          style={styles.prereqSelectorList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.prereqSelectItem}
              onPress={() => {
                onSelect(item.id);
                onClose();
              }}
            >
              <Text style={styles.prereqSelectItemName}>
                {item.display_name || item.name}
              </Text>
              <View style={styles.prereqSelectItemMeta}>
                <Text style={styles.prereqSelectItemDomain}>{item.domain}</Text>
                <Text style={styles.prereqSelectItemId}>ID: {item.id}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.prereqEmptyText}>
              No matching capabilities found
            </Text>
          }
        />

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.prereqSelectorCancelButton}
          onPress={onClose}
        >
          <Text style={styles.prereqSelectorCancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Detection Rule Editor Component
 *
 * Allows editing detection rules using dropdowns and buttons
 * instead of raw JSON.
 */
function DetectionRuleEditor({ rule, options, onChange }) {
  if (!options) {
    return (
      <View style={styles.formFieldContainer}>
        <Text style={styles.formFieldLabel}>Detection Rule</Text>
        <ActivityIndicator size="small" color="#2196F3" />
        <Text style={styles.prereqHint}>Loading detection options...</Text>
      </View>
    );
  }

  const { types, sources, custom_functions } = options;

  const createEmptyRule = () => ({
    type: "element",
    source: "notes",
    threshold: 1,
  });

  const updateRule = (field, value) => {
    if (!rule) return;
    const newRule = { ...rule, [field]: value };
    // Clear fields that don't apply to the current type
    if (field === "type") {
      // Reset type-specific fields when type changes
      delete newRule.value;
      delete newRule.semitones;
      delete newRule.direction;
      delete newRule.pattern;
      delete newRule.match_type;
      delete newRule.numerator;
      delete newRule.denominator;
      delete newRule.min;
      delete newRule.max;
      delete newRule.custom_function;
      delete newRule.rules;
      delete newRule.element_type;
    }
    onChange(newRule);
  };

  const addRule = () => {
    onChange(createEmptyRule());
  };

  const removeRule = () => {
    onChange(null);
  };

  // Add a sub-rule for compound type
  const addSubRule = () => {
    if (!rule) return;
    const currentRules = rule.rules || [];
    onChange({
      ...rule,
      rules: [
        ...currentRules,
        { type: "element", source: "notes", threshold: 1 },
      ],
    });
  };

  const updateSubRule = (index, field, value) => {
    if (!rule || !rule.rules) return;
    const newRules = [...rule.rules];
    newRules[index] = { ...newRules[index], [field]: value };
    onChange({ ...rule, rules: newRules });
  };

  const removeSubRule = (index) => {
    if (!rule || !rule.rules) return;
    const newRules = rule.rules.filter((_, i) => i !== index);
    onChange({ ...rule, rules: newRules.length > 0 ? newRules : undefined });
  };

  // Render type-specific fields
  const renderTypeFields = (
    currentRule,
    onUpdate,
    isSubRule = false,
    subIndex = null,
  ) => {
    if (!currentRule) return null;
    const ruleType = currentRule.type;

    const handleUpdate = (field, value) => {
      if (isSubRule && subIndex !== null) {
        updateSubRule(subIndex, field, value);
      } else {
        onUpdate(field, value);
      }
    };

    return (
      <>
        {/* Source - used by most types */}
        {["element", "value_match", "interval", "text_match", "range"].includes(
          ruleType,
        ) && (
          <View style={styles.detectionFieldRow}>
            <Text style={styles.detectionFieldLabel}>Source:</Text>
            <View style={styles.detectionPickerContainer}>
              {sources.map((src) => (
                <TouchableOpacity
                  key={src}
                  style={[
                    styles.detectionPickerOption,
                    currentRule.source === src &&
                      styles.detectionPickerOptionSelected,
                  ]}
                  onPress={() => handleUpdate("source", src)}
                >
                  <Text
                    style={[
                      styles.detectionPickerOptionText,
                      currentRule.source === src &&
                        styles.detectionPickerOptionTextSelected,
                    ]}
                  >
                    {src.replace(/_/g, " ")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Element type - for element type */}
        {ruleType === "element" && (
          <View style={styles.detectionFieldRow}>
            <Text style={styles.detectionFieldLabel}>
              Element Type (optional):
            </Text>
            <TextInput
              style={styles.detectionFieldInput}
              value={currentRule.element_type || ""}
              onChangeText={(v) => handleUpdate("element_type", v || undefined)}
              placeholder="e.g., Staccato"
            />
          </View>
        )}

        {/* Value - for value_match */}
        {ruleType === "value_match" && (
          <View style={styles.detectionFieldRow}>
            <Text style={styles.detectionFieldLabel}>Value:</Text>
            <TextInput
              style={styles.detectionFieldInput}
              value={currentRule.value || ""}
              onChangeText={(v) => handleUpdate("value", v)}
              placeholder="Value to match"
            />
          </View>
        )}

        {/* Semitones - for interval */}
        {ruleType === "interval" && (
          <>
            <View style={styles.detectionFieldRow}>
              <Text style={styles.detectionFieldLabel}>Semitones:</Text>
              <TextInput
                style={styles.detectionFieldInput}
                value={String(currentRule.semitones || "")}
                onChangeText={(v) =>
                  handleUpdate("semitones", v ? Number(v) : undefined)
                }
                keyboardType="numeric"
                placeholder="e.g., 7 for perfect fifth"
              />
            </View>
            <View style={styles.detectionFieldRow}>
              <Text style={styles.detectionFieldLabel}>Direction:</Text>
              <View style={styles.detectionPickerContainer}>
                {["ascending", "descending", "any"].map((dir) => (
                  <TouchableOpacity
                    key={dir}
                    style={[
                      styles.detectionPickerOption,
                      (currentRule.direction || "any") === dir &&
                        styles.detectionPickerOptionSelected,
                    ]}
                    onPress={() => handleUpdate("direction", dir)}
                  >
                    <Text
                      style={[
                        styles.detectionPickerOptionText,
                        (currentRule.direction || "any") === dir &&
                          styles.detectionPickerOptionTextSelected,
                      ]}
                    >
                      {dir}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Pattern - for text_match */}
        {ruleType === "text_match" && (
          <>
            <View style={styles.detectionFieldRow}>
              <Text style={styles.detectionFieldLabel}>Pattern:</Text>
              <TextInput
                style={styles.detectionFieldInput}
                value={currentRule.pattern || ""}
                onChangeText={(v) => handleUpdate("pattern", v)}
                placeholder="Text pattern or regex"
              />
            </View>
            <View style={styles.detectionFieldRow}>
              <Text style={styles.detectionFieldLabel}>Match Type:</Text>
              <View style={styles.detectionPickerContainer}>
                {["contains", "exact", "regex"].map((mt) => (
                  <TouchableOpacity
                    key={mt}
                    style={[
                      styles.detectionPickerOption,
                      (currentRule.match_type || "contains") === mt &&
                        styles.detectionPickerOptionSelected,
                    ]}
                    onPress={() => handleUpdate("match_type", mt)}
                  >
                    <Text
                      style={[
                        styles.detectionPickerOptionText,
                        (currentRule.match_type || "contains") === mt &&
                          styles.detectionPickerOptionTextSelected,
                      ]}
                    >
                      {mt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Time signature fields */}
        {ruleType === "time_signature" && (
          <View style={styles.detectionFieldRow}>
            <Text style={styles.detectionFieldLabel}>Time Signature:</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TextInput
                style={[
                  styles.detectionFieldInput,
                  { width: 50, marginRight: 8 },
                ]}
                value={String(currentRule.numerator || "")}
                onChangeText={(v) =>
                  handleUpdate("numerator", v ? Number(v) : undefined)
                }
                keyboardType="numeric"
                placeholder="4"
              />
              <Text style={styles.detectionFieldLabel}>/</Text>
              <TextInput
                style={[
                  styles.detectionFieldInput,
                  { width: 50, marginLeft: 8 },
                ]}
                value={String(currentRule.denominator || "")}
                onChangeText={(v) =>
                  handleUpdate("denominator", v ? Number(v) : undefined)
                }
                keyboardType="numeric"
                placeholder="4"
              />
            </View>
          </View>
        )}

        {/* Range fields */}
        {ruleType === "range" && (
          <View style={styles.detectionFieldRow}>
            <Text style={styles.detectionFieldLabel}>Range:</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TextInput
                style={[
                  styles.detectionFieldInput,
                  { width: 60, marginRight: 8 },
                ]}
                value={String(currentRule.min || "")}
                onChangeText={(v) =>
                  handleUpdate("min", v ? Number(v) : undefined)
                }
                keyboardType="numeric"
                placeholder="Min"
              />
              <Text style={styles.detectionFieldLabel}>to</Text>
              <TextInput
                style={[
                  styles.detectionFieldInput,
                  { width: 60, marginLeft: 8 },
                ]}
                value={String(currentRule.max || "")}
                onChangeText={(v) =>
                  handleUpdate("max", v ? Number(v) : undefined)
                }
                keyboardType="numeric"
                placeholder="Max"
              />
            </View>
          </View>
        )}

        {/* Custom function */}
        {ruleType === "custom" && (
          <View style={styles.detectionFieldRow}>
            <Text style={styles.detectionFieldLabel}>Custom Function:</Text>
            <View style={styles.detectionPickerContainer}>
              {custom_functions.map((fn) => (
                <TouchableOpacity
                  key={fn}
                  style={[
                    styles.detectionPickerOption,
                    currentRule.custom_function === fn &&
                      styles.detectionPickerOptionSelected,
                  ]}
                  onPress={() => handleUpdate("custom_function", fn)}
                >
                  <Text
                    style={[
                      styles.detectionPickerOptionText,
                      currentRule.custom_function === fn &&
                        styles.detectionPickerOptionTextSelected,
                    ]}
                  >
                    {fn}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Threshold - for most types */}
        {ruleType !== "compound" && (
          <View style={styles.detectionFieldRow}>
            <Text style={styles.detectionFieldLabel}>Threshold:</Text>
            <TextInput
              style={[styles.detectionFieldInput, { width: 60 }]}
              value={String(currentRule.threshold || 1)}
              onChangeText={(v) => handleUpdate("threshold", v ? Number(v) : 1)}
              keyboardType="numeric"
              placeholder="1"
            />
          </View>
        )}
      </>
    );
  };

  return (
    <View style={styles.formFieldContainer}>
      <Text style={styles.formFieldLabel}>Detection Rule</Text>
      <Text style={styles.prereqHint}>
        Configure how this capability is detected in MusicXML files.
      </Text>

      {!rule ? (
        <TouchableOpacity style={styles.addPrereqButton} onPress={addRule}>
          <Text style={styles.addPrereqButtonText}>+ Add Detection Rule</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.detectionRuleContainer}>
          {/* Type selector */}
          <View style={styles.detectionFieldRow}>
            <Text style={styles.detectionFieldLabel}>Type:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.detectionPickerContainer}>
                {types.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.detectionPickerOption,
                      rule.type === type &&
                        styles.detectionPickerOptionSelected,
                    ]}
                    onPress={() => updateRule("type", type)}
                  >
                    <Text
                      style={[
                        styles.detectionPickerOptionText,
                        rule.type === type &&
                          styles.detectionPickerOptionTextSelected,
                      ]}
                    >
                      {type.replace(/_/g, " ")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Type-specific fields */}
          {renderTypeFields(rule, updateRule)}

          {/* Compound rules */}
          {rule.type === "compound" && (
            <View style={styles.compoundRulesContainer}>
              <Text style={styles.compoundRulesLabel}>Sub-rules:</Text>
              {(rule.rules || []).map((subRule, index) => (
                <View key={index} style={styles.subRuleContainer}>
                  <View style={styles.subRuleHeader}>
                    <Text style={styles.subRuleIndex}>Rule {index + 1}</Text>
                    <TouchableOpacity
                      style={styles.subRuleRemove}
                      onPress={() => removeSubRule(index)}
                    >
                      <Text style={styles.subRuleRemoveText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.detectionFieldRow}>
                    <Text style={styles.detectionFieldLabel}>Type:</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      <View style={styles.detectionPickerContainer}>
                        {types
                          .filter((t) => t !== "compound")
                          .map((type) => (
                            <TouchableOpacity
                              key={type}
                              style={[
                                styles.detectionPickerOption,
                                subRule.type === type &&
                                  styles.detectionPickerOptionSelected,
                              ]}
                              onPress={() => updateSubRule(index, "type", type)}
                            >
                              <Text
                                style={[
                                  styles.detectionPickerOptionText,
                                  subRule.type === type &&
                                    styles.detectionPickerOptionTextSelected,
                                ]}
                              >
                                {type.replace(/_/g, " ")}
                              </Text>
                            </TouchableOpacity>
                          ))}
                      </View>
                    </ScrollView>
                  </View>
                  {renderTypeFields(subRule, null, true, index)}
                </View>
              ))}
              <TouchableOpacity
                style={styles.addSubRuleButton}
                onPress={addSubRule}
              >
                <Text style={styles.addSubRuleButtonText}>+ Add Sub-rule</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Remove rule button */}
          <TouchableOpacity
            style={styles.removeRuleButton}
            onPress={removeRule}
          >
            <Text style={styles.removeRuleButtonText}>
              Remove Detection Rule
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// =============================================================================
// CAPABILITY CREATE MODAL
// =============================================================================

function CapabilityCreateModal({
  domains,
  allCapabilities,
  onClose,
  onCreate,
  initialDomain,
}) {
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
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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

// =============================================================================
// DOMAIN MANAGE MODAL
// =============================================================================

function DomainManageModal({ domains, capabilities, onClose, onRename }) {
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

// =============================================================================
// SECTION 2: MATERIAL EXPLORER
// =============================================================================


export default CapabilityExplorer;
