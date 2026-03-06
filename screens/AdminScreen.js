/**
 * AdminScreen.js - Internal Admin Surface for Sound First
 *
 * Four sections:
 * 1. Capability Explorer - Browse/filter/inspect capabilities
 * 2. Material Explorer - Browse materials with analysis data
 * 3. User Progression Inspector - View user mastery state
 * 4. Session Diagnostics - Debug session generation
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Platform,
  ActivityIndicator,
  Switch,
} from "react-native";
import ResetButton from "../components/ResetButton";

// Backend URL helper
function getBackendUrl() {
  const LOCAL_IP = "192.168.1.19";
  if (Platform.OS === "android") return "http://10.0.2.2:8000";
  if (Platform.OS === "ios") return `http://${LOCAL_IP}:8000`;
  if (Platform.OS === "web") {
    return `http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:8000`;
  }
  return `http://${LOCAL_IP}:8000`;
}

const baseUrl = getBackendUrl();

// Tab navigation
const TABS = [
  { id: "capabilities", label: "Capabilities" },
  { id: "materials", label: "Materials" },
  { id: "users", label: "User Progress" },
  { id: "sessions", label: "Session Diag" },
];

export default function AdminScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState("capabilities");

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Console</Text>
        <ResetButton />
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === "capabilities" && <CapabilityExplorer />}
        {activeTab === "materials" && <MaterialExplorer />}
        {activeTab === "users" && <UserProgressionInspector />}
        {activeTab === "sessions" && <SessionDiagnostics />}
      </View>
    </View>
  );
}

// =============================================================================
// SECTION 1: CAPABILITY EXPLORER
// =============================================================================

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
      </View>
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
          <View style={styles.requirementTypeContainer}>
            {VALID_REQUIREMENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.requirementOption,
                  formData.requirement_type === type &&
                    styles.requirementOptionActive,
                ]}
                onPress={() => updateField("requirement_type", type)}
              >
                <Text
                  style={[
                    styles.requirementOptionText,
                    formData.requirement_type === type &&
                      styles.requirementOptionTextActive,
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
// SECTION 2: MATERIAL EXPLORER
// =============================================================================

function MaterialExplorer() {
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("1");

  useEffect(() => {
    loadMaterials();
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [materials, searchQuery]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/admin/materials`);
      if (!response.ok) throw new Error("Failed to load materials");
      const data = await response.json();
      setMaterials(data.materials || []);
    } catch (err) {
      console.error("[AdminScreen] Load materials error:", err);
      // Fallback to basic materials endpoint
      try {
        const fallback = await fetch(`${baseUrl}/materials`);
        const data = await fallback.json();
        setMaterials(data.materials || data || []);
      } catch (e) {
        console.error("[AdminScreen] Materials fallback failed:", e);
      }
    }
    setLoading(false);
  };

  const filterMaterials = () => {
    let filtered = [...materials];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((m) => m.title?.toLowerCase().includes(query));
    }

    setFilteredMaterials(filtered);
  };

  const viewMaterialDetail = async (material) => {
    setSelectedMaterial(material);
    setShowDetailModal(true);

    // Load analysis data
    try {
      const response = await fetch(
        `${baseUrl}/materials/${material.id}/analysis`,
      );
      if (response.ok) {
        const analysis = await response.json();
        setSelectedMaterial({ ...material, analysis });
      }
    } catch (err) {
      console.log("[AdminScreen] Could not load material analysis");
    }
  };

  const triggerAnalysis = async (materialId) => {
    try {
      const response = await fetch(
        `${baseUrl}/admin/materials/${materialId}/analyze`,
        {
          method: "POST",
        },
      );
      if (response.ok) {
        alert("Analysis triggered successfully");
        loadMaterials();
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      alert("Analysis failed");
    }
  };

  const renderMaterialItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => viewMaterialDetail(item)}
    >
      <View style={styles.listItemHeader}>
        <Text style={styles.listItemTitle}>{item.title}</Text>
        <Text style={styles.listItemBadge}>
          {item.original_key_center || "?"}
        </Text>
      </View>
      <View style={styles.listItemDetails}>
        <Text style={styles.listItemDetail}>ID: {item.id}</Text>
        {item.lowest_pitch && (
          <Text style={styles.listItemDetail}>
            Range: {item.lowest_pitch} - {item.highest_pitch}
          </Text>
        )}
        {item.difficulty_index != null && (
          <Text style={styles.listItemDetail}>
            Difficulty: {(item.difficulty_index * 100).toFixed(0)}%
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading materials...</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {/* Search */}
      <View style={styles.filterBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search materials..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* User selector for gate checks */}
      <View style={styles.userSelector}>
        <Text style={styles.userSelectorLabel}>Check gates for user:</Text>
        <TextInput
          style={styles.userIdInput}
          value={selectedUserId}
          onChangeText={setSelectedUserId}
          keyboardType="numeric"
          placeholder="User ID"
        />
      </View>

      <Text style={styles.resultCount}>
        {filteredMaterials.length} materials
      </Text>

      <FlatList
        data={filteredMaterials}
        renderItem={renderMaterialItem}
        keyExtractor={(item) => String(item.id)}
        style={styles.list}
      />

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <MaterialDetailView
          material={selectedMaterial}
          userId={selectedUserId}
          onClose={() => setShowDetailModal(false)}
          onTriggerAnalysis={triggerAnalysis}
        />
      </Modal>
    </View>
  );
}

function MaterialDetailView({ material, userId, onClose, onTriggerAnalysis }) {
  const [gateStatus, setGateStatus] = useState(null);
  const [loadingGates, setLoadingGates] = useState(false);

  useEffect(() => {
    if (material && userId) {
      loadGateStatus();
    }
  }, [material, userId]);

  const loadGateStatus = async () => {
    setLoadingGates(true);
    try {
      const response = await fetch(
        `${baseUrl}/admin/materials/${material.id}/gate-check?user_id=${userId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setGateStatus(data);
      }
    } catch (err) {
      console.log("[AdminScreen] Gate check failed");
    }
    setLoadingGates(false);
  };

  if (!material) return null;

  const analysis = material.analysis || {};

  return (
    <ScrollView style={styles.detailContainer}>
      <View style={styles.detailHeader}>
        <Text style={styles.detailTitle}>{material.title}</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Basic Info</Text>
        <DetailRow label="ID" value={String(material.id)} />
        <DetailRow label="Title" value={material.title} />
        <DetailRow
          label="Original Key"
          value={material.original_key_center || "Unknown"}
        />
        <DetailRow
          label="Allowed Keys"
          value={material.allowed_keys || "Any"}
        />
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Analysis</Text>
        <DetailRow
          label="Lowest Pitch"
          value={analysis.lowest_pitch || "N/A"}
        />
        <DetailRow
          label="Highest Pitch"
          value={analysis.highest_pitch || "N/A"}
        />
        <DetailRow
          label="Range (semitones)"
          value={String(analysis.range_semitones || "N/A")}
        />
        <DetailRow
          label="Chromatic Complexity"
          value={analysis.chromatic_complexity?.toFixed(2) || "N/A"}
        />
        <DetailRow
          label="Rhythmic Complexity"
          value={analysis.rhythmic_complexity?.toFixed(2) || "N/A"}
        />
        <DetailRow
          label="Reading Complexity"
          value={analysis.reading_complexity?.toFixed(2) || "N/A"}
        />
        <DetailRow
          label="Measures"
          value={String(analysis.measure_count || "N/A")}
        />
        <DetailRow
          label="Duration (sec)"
          value={String(analysis.estimated_duration_seconds || "N/A")}
        />
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Soft Gate Stages</Text>
        <DetailRow
          label="Tonal Stage"
          value={String(analysis.tonal_complexity_stage ?? "N/A")}
        />
        <DetailRow
          label="Interval Stage"
          value={String(analysis.interval_size_stage ?? "N/A")}
        />
        <DetailRow
          label="Rhythm Stage"
          value={String(analysis.rhythm_complexity_stage ?? "N/A")}
        />
        <DetailRow
          label="Range Stage"
          value={String(analysis.range_usage_stage ?? "N/A")}
        />
        <DetailRow
          label="Difficulty Index"
          value={
            analysis.difficulty_index != null
              ? (analysis.difficulty_index * 100).toFixed(1) + "%"
              : "N/A"
          }
        />
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>
          Gate Status (User {userId})
        </Text>
        {loadingGates ? (
          <ActivityIndicator size="small" color="#2196F3" />
        ) : gateStatus ? (
          <>
            <DetailRow
              label="Hard Gates"
              value={gateStatus.passes_hard_gates ? "✓ PASS" : "✗ FAIL"}
              valueStyle={{
                color: gateStatus.passes_hard_gates ? "#4CAF50" : "#f44336",
              }}
            />
            {gateStatus.hard_gate_failures?.length > 0 && (
              <Text style={styles.failureList}>
                Failed: {gateStatus.hard_gate_failures.join(", ")}
              </Text>
            )}
            <DetailRow
              label="Soft Envelope"
              value={gateStatus.passes_soft_envelope ? "✓ PASS" : "✗ FAIL"}
              valueStyle={{
                color: gateStatus.passes_soft_envelope ? "#4CAF50" : "#f44336",
              }}
            />
            {gateStatus.soft_envelope_failures?.length > 0 && (
              <Text style={styles.failureList}>
                Failed: {gateStatus.soft_envelope_failures.join(", ")}
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.noDataText}>Gate status not available</Text>
        )}
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Required Capabilities</Text>
        {material.required_capabilities?.length > 0 ? (
          material.required_capabilities.map((cap, idx) => (
            <Text key={idx} style={styles.prerequisiteItem}>
              • {cap}
            </Text>
          ))
        ) : (
          <Text style={styles.noDataText}>Not available</Text>
        )}
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Teaches Capabilities</Text>
        {material.teaches_capabilities?.length > 0 ? (
          material.teaches_capabilities.map((cap, idx) => (
            <Text key={idx} style={styles.prerequisiteItem}>
              • {cap}
            </Text>
          ))
        ) : (
          <Text style={styles.noDataText}>Not available</Text>
        )}
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Actions</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onTriggerAnalysis(material.id)}
        >
          <Text style={styles.actionButtonText}>Re-run Analysis</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// =============================================================================
// SECTION 3: USER PROGRESSION INSPECTOR
// =============================================================================

function UserProgressionInspector() {
  const [userId, setUserId] = useState("1");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("overview");

  const loadUserData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${baseUrl}/admin/users/${userId}/progression`,
      );
      if (!response.ok) throw new Error("Failed to load user data");
      const data = await response.json();
      setUserData(data);
    } catch (err) {
      console.error("[AdminScreen] Load user progression error:", err);
      // Try fallback endpoints
      try {
        const [userRes, capRes, journeyRes] = await Promise.all([
          fetch(`${baseUrl}/users/${userId}`),
          fetch(`${baseUrl}/users/${userId}/capability-progress`),
          fetch(`${baseUrl}/users/${userId}/journey-stage`),
        ]);
        const user = await userRes.json();
        const caps = await capRes.json();
        const journey = await journeyRes.json();
        setUserData({
          user,
          capabilities: caps,
          journey,
        });
      } catch (e) {
        console.error("[AdminScreen] User data fallback failed:", e);
      }
    }
    setLoading(false);
  };

  const SUB_TABS = [
    { id: "overview", label: "Overview" },
    { id: "capabilities", label: "Capabilities" },
    { id: "soft_gates", label: "Soft Gates" },
    { id: "candidates", label: "Candidates" },
  ];

  return (
    <View style={styles.section}>
      {/* User Selection */}
      <View style={styles.userSelectRow}>
        <Text style={styles.userSelectLabel}>User ID:</Text>
        <TextInput
          style={styles.userIdInputLarge}
          value={userId}
          onChangeText={setUserId}
          keyboardType="numeric"
          placeholder="Enter user ID"
        />
        <TouchableOpacity style={styles.loadButton} onPress={loadUserData}>
          <Text style={styles.loadButtonText}>Load</Text>
        </TouchableOpacity>
      </View>

      {/* Sub-tabs */}
      <View style={styles.subTabBar}>
        {SUB_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.subTab,
              activeSubTab === tab.id && styles.subTabActive,
            ]}
            onPress={() => setActiveSubTab(tab.id)}
          >
            <Text
              style={[
                styles.subTabText,
                activeSubTab === tab.id && styles.subTabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading user data...</Text>
        </View>
      ) : userData ? (
        <ScrollView style={styles.userContent}>
          {activeSubTab === "overview" && (
            <UserOverviewTab userData={userData} />
          )}
          {activeSubTab === "capabilities" && (
            <UserCapabilitiesTab userData={userData} />
          )}
          {activeSubTab === "soft_gates" && (
            <UserSoftGatesTab userData={userData} />
          )}
          {activeSubTab === "candidates" && (
            <UserCandidatesTab userId={userId} />
          )}
        </ScrollView>
      ) : (
        <View style={styles.centered}>
          <Text style={styles.noDataText}>Enter a user ID and press Load</Text>
        </View>
      )}
    </View>
  );
}

function UserOverviewTab({ userData }) {
  const user = userData.user || {};
  const journey = userData.journey || {};

  return (
    <View>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>User Info</Text>
        <DetailRow label="ID" value={String(user.id || "N/A")} />
        <DetailRow label="Email" value={user.email || "N/A"} />
        <DetailRow label="Instrument" value={user.instrument || "N/A"} />
        <DetailRow label="Resonant Note" value={user.resonant_note || "N/A"} />
        <DetailRow
          label="Range"
          value={`${user.range_low || "?"} - ${user.range_high || "?"}`}
        />
        <DetailRow
          label="Day 0 Complete"
          value={user.day0_completed ? "Yes" : "No"}
        />
        <DetailRow label="Day 0 Stage" value={String(user.day0_stage || 0)} />
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Journey Stage</Text>
        <DetailRow label="Stage" value={journey.stage || "unknown"} />
        <DetailRow
          label="Capabilities Mastered"
          value={String(journey.capabilities_mastered || 0)}
        />
        <DetailRow
          label="Materials Completed"
          value={String(journey.materials_completed || 0)}
        />
      </View>
    </View>
  );
}

function UserCapabilitiesTab({ userData }) {
  const caps = userData.capabilities || {};
  const mastered = caps.mastered || [];
  const introduced = caps.introduced || [];
  const all = caps.all || [];

  return (
    <View>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>
          Mastered Capabilities ({mastered.length})
        </Text>
        {mastered.length > 0 ? (
          mastered.slice(0, 20).map((cap, idx) => (
            <Text key={idx} style={styles.capabilityItem}>
              ✓ {cap.display_name || cap.name}
            </Text>
          ))
        ) : (
          <Text style={styles.noDataText}>No mastered capabilities yet</Text>
        )}
        {mastered.length > 20 && (
          <Text style={styles.moreText}>
            ... and {mastered.length - 20} more
          </Text>
        )}
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>
          Introduced (not mastered) ({introduced.length})
        </Text>
        {introduced.length > 0 ? (
          introduced.slice(0, 20).map((cap, idx) => (
            <Text key={idx} style={styles.capabilityItem}>
              ○ {cap.display_name || cap.name}
            </Text>
          ))
        ) : (
          <Text style={styles.noDataText}>None</Text>
        )}
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Recent Promotions</Text>
        {caps.recent_promotions?.length > 0 ? (
          caps.recent_promotions.map((promo, idx) => (
            <Text key={idx} style={styles.promotionItem}>
              {promo.capability_name} - {promo.promoted_at}
            </Text>
          ))
        ) : (
          <Text style={styles.noDataText}>No recent promotions</Text>
        )}
      </View>
    </View>
  );
}

function UserSoftGatesTab({ userData }) {
  const softGates = userData.soft_gates || [];

  return (
    <View>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Soft Envelope State</Text>
        {softGates.length > 0 ? (
          softGates.map((gate, idx) => (
            <View key={idx} style={styles.softGateItem}>
              <Text style={styles.softGateName}>{gate.dimension_name}</Text>
              <View style={styles.softGateValues}>
                <Text style={styles.softGateValue}>
                  Comfort: {gate.comfortable_value?.toFixed(1) || 0}
                </Text>
                <Text style={styles.softGateValue}>
                  Max: {gate.max_demonstrated_value?.toFixed(1) || 0}
                </Text>
                <Text style={styles.softGateValue}>
                  EMA: {(gate.frontier_success_ema * 100)?.toFixed(0) || 0}%
                </Text>
                <Text style={styles.softGateValue}>
                  Attempts: {gate.frontier_attempt_count_since_last_promo || 0}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No soft gate data available</Text>
        )}
      </View>
    </View>
  );
}

function UserCandidatesTab({ userId }) {
  const [candidates, setCandidates] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${baseUrl}/admin/users/${userId}/session-candidates`,
      );
      if (response.ok) {
        const data = await response.json();
        setCandidates(data);
      }
    } catch (err) {
      console.error("[AdminScreen] Load candidates error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCandidates();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color="#2196F3" />
      </View>
    );
  }

  return (
    <View>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>
          Candidate Pool for Next Session
        </Text>
        {candidates?.eligible_materials?.length > 0 ? (
          <>
            <Text style={styles.candidateCount}>
              {candidates.eligible_materials.length} eligible materials
            </Text>
            {candidates.eligible_materials.slice(0, 15).map((mat, idx) => (
              <View key={idx} style={styles.candidateItem}>
                <Text style={styles.candidateTitle}>{mat.title}</Text>
                <Text style={styles.candidateReason}>
                  {mat.eligibility_reason || "Passes all gates"}
                </Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.noDataText}>No eligible materials</Text>
        )}
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>
          Ineligible Materials (Sample)
        </Text>
        {candidates?.ineligible_sample?.length > 0 ? (
          candidates.ineligible_sample.slice(0, 10).map((mat, idx) => (
            <View key={idx} style={styles.candidateItem}>
              <Text style={styles.candidateTitle}>{mat.title}</Text>
              <Text style={styles.candidateReasonFail}>
                ✗ {mat.ineligibility_reason}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No sample available</Text>
        )}
      </View>
    </View>
  );
}

// =============================================================================
// SECTION 4: SESSION DIAGNOSTICS
// =============================================================================

function SessionDiagnostics() {
  const [userId, setUserId] = useState("1");
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingSession, setGeneratingSession] = useState(false);

  const generateTestSession = async () => {
    setGeneratingSession(true);
    try {
      const response = await fetch(
        `${baseUrl}/admin/users/${userId}/generate-diagnostic-session`,
        { method: "POST" },
      );
      if (response.ok) {
        const data = await response.json();
        setSessionData(data);
      }
    } catch (err) {
      console.error("[AdminScreen] Generate session error:", err);
      // Fallback - try regular session generation and capture diagnostics
      try {
        const fallback = await fetch(`${baseUrl}/generate-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: parseInt(userId),
            planned_duration_minutes: 30,
          }),
        });
        if (fallback.ok) {
          const sessionResult = await fallback.json();
          setSessionData({
            session: sessionResult,
            diagnostics: { message: "Generated via standard endpoint" },
          });
        }
      } catch (e) {
        console.error("[AdminScreen] Fallback session generation failed:", e);
      }
    }
    setGeneratingSession(false);
  };

  const loadLastSessionDiagnostics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${baseUrl}/admin/users/${userId}/last-session-diagnostics`,
      );
      if (response.ok) {
        const data = await response.json();
        setSessionData(data);
      }
    } catch (err) {
      console.error("[AdminScreen] Load session diagnostics error:", err);
    }
    setLoading(false);
  };

  return (
    <View style={styles.section}>
      {/* User Selection */}
      <View style={styles.userSelectRow}>
        <Text style={styles.userSelectLabel}>User ID:</Text>
        <TextInput
          style={styles.userIdInputLarge}
          value={userId}
          onChangeText={setUserId}
          keyboardType="numeric"
          placeholder="Enter user ID"
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={generateTestSession}
          disabled={generatingSession}
        >
          <Text style={styles.actionButtonText}>
            {generatingSession ? "Generating..." : "Generate Test Session"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={loadLastSessionDiagnostics}
          disabled={loading}
        >
          <Text style={styles.actionButtonText}>Load Last Session</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.diagnosticsContent}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        ) : sessionData ? (
          <SessionDiagnosticsView data={sessionData} />
        ) : (
          <View style={styles.centered}>
            <Text style={styles.noDataText}>
              Generate a test session or load the last session to see
              diagnostics
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function SessionDiagnosticsView({ data }) {
  const session = data.session || {};
  const diagnostics = data.diagnostics || {};
  const miniSessions = session.mini_sessions || [];

  return (
    <View>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Session Overview</Text>
        <DetailRow
          label="Session ID"
          value={String(session.session_id || "N/A")}
        />
        <DetailRow label="User ID" value={String(session.user_id || "N/A")} />
        <DetailRow
          label="Duration"
          value={`${session.planned_duration_minutes || "?"} min`}
        />
        <DetailRow label="Mini-Sessions" value={String(miniSessions.length)} />
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Target Capabilities</Text>
        {diagnostics.target_capabilities?.length > 0 ? (
          diagnostics.target_capabilities.map((cap, idx) => (
            <Text key={idx} style={styles.targetCapItem}>
              • {cap.name} (weight: {cap.weight?.toFixed(2) || "?"})
            </Text>
          ))
        ) : (
          <Text style={styles.noDataText}>No target capability data</Text>
        )}
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Hard Gates Applied</Text>
        {diagnostics.hard_gates?.length > 0 ? (
          diagnostics.hard_gates.map((gate, idx) => (
            <Text key={idx} style={styles.gateItem}>
              • {gate}
            </Text>
          ))
        ) : (
          <Text style={styles.noDataText}>Standard hard gates applied</Text>
        )}
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Soft Envelope Filters</Text>
        {diagnostics.soft_envelope_filters?.length > 0 ? (
          diagnostics.soft_envelope_filters.map((filter, idx) => (
            <View key={idx} style={styles.filterItem}>
              <Text style={styles.filterName}>{filter.dimension}</Text>
              <Text style={styles.filterValue}>
                Comfort: {filter.comfort}, Max Allowed: {filter.max_allowed}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No soft envelope data</Text>
        )}
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>
          Candidate Materials ({diagnostics.candidates_considered || "?"})
        </Text>
        {diagnostics.candidate_ranking?.length > 0 ? (
          diagnostics.candidate_ranking.slice(0, 10).map((candidate, idx) => (
            <View key={idx} style={styles.candidateRankItem}>
              <Text style={styles.candidateRankTitle}>
                {idx + 1}. {candidate.title}
              </Text>
              <Text style={styles.candidateRankReason}>
                Score: {candidate.score?.toFixed(2) || "?"} - {candidate.reason}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No ranking data</Text>
        )}
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Selected Mini-Sessions</Text>
        {miniSessions.map((mini, idx) => (
          <View key={idx} style={styles.miniSessionItem}>
            <Text style={styles.miniSessionTitle}>
              {idx + 1}. {mini.material_title}
            </Text>
            <Text style={styles.miniSessionDetail}>
              Key: {mini.target_key || "?"} | Focus: {mini.focus_card_name} |
              Goal: {mini.goal_type}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>Selection Reasons</Text>
        {diagnostics.selection_reasons?.length > 0 ? (
          diagnostics.selection_reasons.map((reason, idx) => (
            <Text key={idx} style={styles.reasonItem}>
              • {reason.material}: {reason.reason}
            </Text>
          ))
        ) : (
          <Text style={styles.noDataText}>No detailed reasons available</Text>
        )}
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
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#1a237e",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: "#2196F3",
  },
  tabText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#2196F3",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  section: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
  },
  filterBar: {
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  exportButton: {
    backgroundColor: "#673AB7",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  exportButtonDisabled: {
    backgroundColor: "#B39DDB",
  },
  exportButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  exportStatus: {
    marginHorizontal: 12,
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
  },
  exportStatusSuccess: {
    backgroundColor: "#e8f5e9",
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  exportStatusError: {
    backgroundColor: "#ffebee",
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  exportStatusSuccessText: {
    color: "#2e7d32",
    fontSize: 13,
  },
  exportStatusErrorText: {
    color: "#c62828",
    fontSize: 13,
  },
  searchInput: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
  },
  domainScroll: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    maxHeight: 50,
  },
  domainChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#e8e8e8",
    borderRadius: 16,
    marginRight: 8,
  },
  domainChipActive: {
    backgroundColor: "#2196F3",
  },
  domainChipText: {
    fontSize: 13,
    color: "#666",
  },
  domainChipTextActive: {
    color: "#fff",
  },
  resultCount: {
    padding: 12,
    color: "#666",
    fontSize: 13,
    backgroundColor: "#fff",
  },
  list: {
    flex: 1,
  },
  listItem: {
    backgroundColor: "#fff",
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  listItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  listItemBadge: {
    backgroundColor: "#e3f2fd",
    color: "#1976D2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 11,
    fontWeight: "500",
    overflow: "hidden",
  },
  listItemDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  listItemDetail: {
    fontSize: 12,
    color: "#666",
    marginRight: 12,
    marginBottom: 2,
  },
  listItemSubtext: {
    fontSize: 12,
    color: "#888",
    marginTop: 6,
    fontStyle: "italic",
  },
  // Detail View Styles
  detailContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  detailHeader: {
    backgroundColor: "#1a237e",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  detailTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "300",
  },
  detailSection: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 8,
  },
  deleteConfirmContainer: {
    backgroundColor: "#fef2f2",
    marginHorizontal: 12,
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  deleteConfirmText: {
    fontSize: 14,
    color: "#991b1b",
    marginBottom: 12,
    textAlign: "center",
  },
  deleteConfirmButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  deleteConfirmButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  deleteConfirmButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a237e",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    width: 140,
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    fontWeight: "500",
  },
  noDataText: {
    color: "#999",
    fontStyle: "italic",
    fontSize: 13,
  },
  prerequisiteItem: {
    fontSize: 13,
    color: "#333",
    marginBottom: 4,
    marginLeft: 8,
  },
  graphText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  dependencyItem: {
    fontSize: 12,
    color: "#666",
    marginLeft: 16,
    marginBottom: 2,
  },
  // User Selector
  userSelector: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  userSelectorLabel: {
    fontSize: 14,
    color: "#333",
    marginRight: 10,
  },
  userIdInput: {
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    width: 80,
  },
  // User Selection Row
  userSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  userSelectLabel: {
    fontSize: 14,
    color: "#333",
    marginRight: 10,
  },
  userIdInputLarge: {
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    width: 100,
    marginRight: 10,
  },
  loadButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  loadButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  // Sub-tabs
  subTabBar: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  subTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  subTabActive: {
    backgroundColor: "#fff",
    borderBottomWidth: 2,
    borderBottomColor: "#2196F3",
  },
  subTabText: {
    fontSize: 12,
    color: "#666",
  },
  subTabTextActive: {
    color: "#2196F3",
    fontWeight: "600",
  },
  userContent: {
    flex: 1,
  },
  capabilityItem: {
    fontSize: 13,
    color: "#333",
    marginBottom: 4,
    marginLeft: 8,
  },
  moreText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginTop: 8,
  },
  promotionItem: {
    fontSize: 13,
    color: "#4CAF50",
    marginBottom: 4,
    marginLeft: 8,
  },
  softGateItem: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  softGateName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  softGateValues: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  softGateValue: {
    fontSize: 12,
    color: "#666",
    marginRight: 12,
  },
  candidateCount: {
    fontSize: 13,
    color: "#666",
    marginBottom: 10,
  },
  candidateItem: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
  },
  candidateTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  candidateReason: {
    fontSize: 12,
    color: "#4CAF50",
    marginTop: 4,
  },
  candidateReasonFail: {
    fontSize: 12,
    color: "#f44336",
    marginTop: 4,
  },
  // Action buttons
  actionRow: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    gap: 10,
  },
  actionButton: {
    backgroundColor: "#e0e0e0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    flex: 1,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#2196F3",
  },
  actionButtonText: {
    fontWeight: "600",
    fontSize: 13,
    color: "#333",
  },
  diagnosticsContent: {
    flex: 1,
  },
  // Session diagnostics specific
  targetCapItem: {
    fontSize: 13,
    color: "#333",
    marginBottom: 4,
    marginLeft: 8,
  },
  gateItem: {
    fontSize: 13,
    color: "#333",
    marginBottom: 4,
    marginLeft: 8,
  },
  filterItem: {
    backgroundColor: "#f9f9f9",
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  filterName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
  },
  filterValue: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  candidateRankItem: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
  },
  candidateRankTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  candidateRankReason: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  miniSessionItem: {
    backgroundColor: "#e3f2fd",
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  miniSessionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1976D2",
  },
  miniSessionDetail: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  reasonItem: {
    fontSize: 13,
    color: "#333",
    marginBottom: 4,
    marginLeft: 8,
  },
  failureList: {
    fontSize: 12,
    color: "#f44336",
    marginLeft: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  // Edit button in detail header
  detailHeaderButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 12,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  // Edit Modal Styles
  editModalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  editModalHeader: {
    backgroundColor: "#1a237e",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editModalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  editModalContent: {
    flex: 1,
    padding: 16,
  },
  readOnlyNotice: {
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  readOnlyNoticeText: {
    fontSize: 13,
    color: "#856404",
    lineHeight: 18,
  },
  // Form Field Styles
  formFieldContainer: {
    marginBottom: 16,
  },
  formFieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  formFieldInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#333",
  },
  formFieldInputError: {
    borderColor: "#f44336",
    borderWidth: 2,
  },
  formFieldError: {
    color: "#f44336",
    fontSize: 12,
    marginTop: 4,
  },
  // Picker (segmented control style)
  pickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pickerOption: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  pickerOptionSelected: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  pickerOptionText: {
    fontSize: 13,
    color: "#333",
  },
  pickerOptionTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  // Switch row
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchHint: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontStyle: "italic",
  },
  // Save / Cancel buttons
  editModalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  editModalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  editModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  saveButtonDisabled: {
    backgroundColor: "#a5d6a7",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  // Save status
  saveErrorContainer: {
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  saveErrorText: {
    color: "#c62828",
    fontSize: 14,
  },
  saveSuccessContainer: {
    backgroundColor: "#e8f5e9",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  saveSuccessText: {
    color: "#2e7d32",
    fontSize: 14,
    fontWeight: "500",
  },
  // Prerequisite styles
  prereqHint: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 8,
  },
  prereqList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  prereqEmptyText: {
    color: "#999",
    fontSize: 13,
    fontStyle: "italic",
  },
  prereqChip: {
    backgroundColor: "#e3f2fd",
    borderRadius: 16,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  prereqChipContent: {
    flexDirection: "column",
    marginRight: 6,
  },
  prereqChipText: {
    fontSize: 13,
    color: "#1976d2",
    fontWeight: "500",
  },
  prereqChipDomain: {
    fontSize: 10,
    color: "#64b5f6",
  },
  prereqChipRemove: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#bbdefb",
    alignItems: "center",
    justifyContent: "center",
  },
  prereqChipRemoveText: {
    color: "#1976d2",
    fontWeight: "bold",
    fontSize: 14,
    lineHeight: 16,
  },
  addPrereqButton: {
    backgroundColor: "#1976d2",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  addPrereqButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  prereqSelectorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  prereqSelectorContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "90%",
    height: "70%",
    padding: 16,
  },
  prereqSelectorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  prereqSelectorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  prereqSelectorSearch: {
    marginBottom: 12,
  },
  prereqSearchInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  prereqDomainScroll: {
    minHeight: 40,
    maxHeight: 50,
    marginBottom: 12,
    flexShrink: 0,
  },
  prereqDomainChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  prereqDomainChipActive: {
    backgroundColor: "#1976d2",
  },
  prereqDomainChipText: {
    fontSize: 13,
    color: "#666",
  },
  prereqDomainChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  prereqResultCount: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
    flexShrink: 0,
  },
  prereqSelectorList: {
    flex: 1,
    marginTop: 4,
  },
  prereqSelectItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  prereqSelectItemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  prereqSelectItemMeta: {
    flexDirection: "row",
    gap: 8,
  },
  prereqSelectItemDomain: {
    fontSize: 11,
    color: "#1976d2",
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  prereqSelectItemId: {
    fontSize: 11,
    color: "#999",
  },
  // Reorder buttons
  reorderButtons: {
    flexDirection: "column",
    marginLeft: 8,
  },
  reorderButton: {
    width: 32,
    height: 28,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 2,
  },
  reorderButtonDisabled: {
    backgroundColor: "#f5f5f5",
    opacity: 0.5,
  },
  reorderButtonText: {
    fontSize: 14,
    color: "#333",
  },
  // Add capability button
  addCapButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addCapButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  // Domain manage button
  domainManageButton: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  domainManageButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  // Domain reorder item
  domainReorderItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  domainReorderName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  domainReorderCount: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  domainEditInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  domainEditButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  domainEditButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  domainEditActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  // Domain toggle buttons (Existing vs New)
  domainToggleContainer: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 10,
  },
  domainToggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  domainToggleButtonActive: {
    backgroundColor: "#e3f2fd",
    borderColor: "#2196F3",
  },
  domainToggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  domainToggleTextActive: {
    color: "#1976D2",
    fontWeight: "600",
  },
});
