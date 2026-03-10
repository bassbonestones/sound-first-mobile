/**
 * CapabilityExplorer - Browse/filter/inspect capabilities
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
import useCapabilities from "./hooks/useCapabilities";

// Extracted components
import CapabilityDetailView from "./components/CapabilityDetailView";
import CapabilityEditModal from "./components/CapabilityEditModal";
import CapabilityCreateModal from "./components/CapabilityCreateModal";
import DomainManageModal from "./components/DomainManageModal";

function CapabilityExplorer() {
  // Use extracted hook for capabilities state and operations
  const {
    capabilities,
    filteredCapabilities,
    loading,
    searchQuery,
    setSearchQuery,
    domainFilter,
    setDomainFilter,
    domains,
    exporting,
    exportStatus,
    loadCapabilities,
    loadDependencyGraph,
    archiveCapability,
    restoreCapability,
    deleteCapability,
    createCapability,
    updateCapability,
    moveCapability,
    renameDomain,
    exportToFile,
  } = useCapabilities();

  // UI-only state
  const [selectedCapability, setSelectedCapability] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDomainManageModal, setShowDomainManageModal] = useState(false);
  const [dependencyGraph, setDependencyGraph] = useState(null);

  const viewCapabilityDetail = async (capability) => {
    setSelectedCapability(capability);
    setShowDetailModal(true);

    // Load dependency graph using hook
    const graph = await loadDependencyGraph(capability.id);
    if (graph) {
      setDependencyGraph(graph);
    }
  };

  const handleEditCapability = (capability) => {
    setSelectedCapability(capability);
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleCapabilitySaved = async (updatedCapability) => {
    // Modal already saved - just update UI and refresh list in background
    setSelectedCapability(updatedCapability);
    setShowEditModal(false);
    setShowDetailModal(true);
    // Refresh list in background to sync state
    loadCapabilities();
  };

  const handleArchiveCapability = async (capability) => {
    const result = await archiveCapability(capability);
    if (result.success) {
      setSelectedCapability(result.capability);
    }
  };

  const handleRestoreCapability = async (capability) => {
    const result = await restoreCapability(capability);
    if (result.success) {
      setSelectedCapability(result.capability);
    }
  };

  const handleDeleteCapability = async (capability) => {
    const result = await deleteCapability(capability);
    if (result.success) {
      setShowDetailModal(false);
      setSelectedCapability(null);
    }
  };

  const handleCreateCapability = async (createData) => {
    const result = await createCapability(createData);
    if (result.success) {
      setShowCreateModal(false);
    }
    return result;
  };

  const handleMoveCapability = async (capability, direction) => {
    await moveCapability(capability, direction);
  };

  const handleRenameDomain = async (oldName, newName) => {
    return await renameDomain(oldName, newName);
  };

  const handleExportToFile = async () => {
    await exportToFile();
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
            <Text style={[
              styles.listItemBadge,
              { backgroundColor: item.is_global !== false ? "#1565C0" : "#6A1B9A" }
            ]}>
              {item.is_global !== false ? "🌐 Global" : "🎸 Per-Inst"}
            </Text>
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

export default CapabilityExplorer;
