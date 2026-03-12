/**
 * MaterialExplorer - Browse materials with analysis data
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
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import styles from "../../styles";
import { useMaterials, useUpload } from "./hooks";
import { SOFT_GATE_HELP } from "./softGateHelp";
import MaterialDetailView from "./components/MaterialDetailView";
import MaterialUploadContent from "./components/MaterialUploadContent";

function MaterialExplorer() {
  // Use extracted hooks for state and operations
  const {
    materials,
    filteredMaterials,
    loading,
    searchQuery,
    selectedMaterial,
    ingesting,
    exporting,
    actionStatus,
    setSearchQuery,
    setSelectedMaterial,
    setActionStatus,
    loadMaterials,
    fetchMaterialDetail,
    handleBatchIngest,
    handleExportToJson,
  } = useMaterials();

  const uploadHook = useUpload(loadMaterials);

  // UI-only state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("1");

  const viewMaterialDetail = async (material) => {
    setSelectedMaterial(material);
    setShowDetailModal(true);
    const withAnalysis = await fetchMaterialDetail(material);
    if (withAnalysis) {
      setSelectedMaterial(withAnalysis);
    }
  };

  const renderMaterialItem = ({ item }) => (
    <TouchableOpacity
      accessibilityLabel={`View material ${item.title}`}
      accessibilityRole="button"
      style={styles.listItem}
      onPress={() => viewMaterialDetail(item)}
    >
      <View style={localStyles.flexContainer}>
        <View style={styles.listItemHeader}>
          <Text style={styles.listItemTitle}>{item.title}</Text>
          {item.analysis?.difficulty_index != null && (
            <Text
              style={[
                styles.listItemBadge,
                {
                  backgroundColor:
                    item.analysis.difficulty_index < 0.3
                      ? "#e8f5e9"
                      : item.analysis.difficulty_index < 0.6
                        ? "#fff8e1"
                        : "#ffebee",
                  color:
                    item.analysis.difficulty_index < 0.3
                      ? "#2e7d32"
                      : item.analysis.difficulty_index < 0.6
                        ? "#f57c00"
                        : "#c62828",
                },
              ]}
            >
              {(item.analysis.difficulty_index * 100).toFixed(0)}%
            </Text>
          )}
        </View>
        <View style={styles.listItemDetails}>
          <Text style={styles.listItemDetail}>ID: {item.id}</Text>
          <Text style={styles.listItemDetail}>
            Key: {item.original_key_center || "?"}
          </Text>
          {item.analysis && (
            <>
              <Text style={styles.listItemDetail}>
                Range: {item.analysis.range_semitones || "?"}st
              </Text>
              <Text style={styles.listItemDetail}>
                Caps: {item.analysis.capability_count || "?"}
              </Text>
            </>
          )}
        </View>
        {item.analysis?.tonal_complexity_stage != null && (
          <Text style={styles.listItemSubtext}>
            Stages: T{item.analysis.tonal_complexity_stage} I
            {item.analysis.interval_sustained_stage}/
            {item.analysis.interval_hazard_stage} R
            {item.analysis.rhythm_complexity_stage ?? "?"} Range
            {item.analysis.range_usage_stage}
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
      {/* Search and Filter Bar */}
      <View style={styles.filterBar}>
        <TextInput
          style={[styles.searchInput, { flex: 1 }]}
          placeholder="Search materials..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          accessibilityLabel="Upload material"
          accessibilityRole="button"
          style={styles.uploadButton}
          onPress={uploadHook.openModal}
        >
          <Text style={styles.uploadButtonText}>+ Upload</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel={exporting ? "Exporting" : "Export to JSON"}
          accessibilityRole="button"
          style={[
            styles.exportButton,
            exporting && styles.exportButtonDisabled,
          ]}
          onPress={handleExportToJson}
          disabled={exporting}
        >
          <Text style={styles.exportButtonText}>
            {exporting ? "..." : "JSON"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Batch Actions */}
      <View style={styles.batchActionsBar}>
        <TouchableOpacity
          accessibilityLabel={
            ingesting ? "Ingesting" : "Batch ingest materials"
          }
          accessibilityRole="button"
          style={[
            styles.batchActionButton,
            ingesting && styles.batchActionButtonDisabled,
          ]}
          onPress={handleBatchIngest}
          disabled={ingesting}
        >
          <Text style={styles.batchActionButtonText}>
            {ingesting ? "Ingesting..." : "Batch Ingest"}
          </Text>
        </TouchableOpacity>
        <Text style={styles.batchActionHint}>
          User ID for gate check:{" "}
          <TextInput
            style={styles.userIdInput}
            value={selectedUserId}
            onChangeText={setSelectedUserId}
            keyboardType="numeric"
          />
        </Text>
      </View>

      {/* Action Status Banner */}
      {actionStatus && (
        <View
          style={[
            styles.statusBanner,
            actionStatus.type === "success"
              ? styles.statusSuccess
              : styles.statusError,
          ]}
        >
          <Text style={styles.statusText}>{actionStatus.message}</Text>
          <TouchableOpacity
            accessibilityLabel="Dismiss status message"
            accessibilityRole="button"
            onPress={() => setActionStatus(null)}
          >
            <Text style={styles.statusDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results Count */}
      <Text style={styles.resultCount}>
        {filteredMaterials.length} materials
      </Text>

      {/* Materials List */}
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
          onTriggerAnalysis={loadMaterials}
        />
      </Modal>

      {/* Upload Modal */}
      <Modal
        visible={uploadHook.showModal}
        animationType="slide"
        onRequestClose={uploadHook.closeModal}
      >
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={SOFT_GATE_HELP}
        />
      </Modal>
    </View>
  );
}

const localStyles = StyleSheet.create({
  flexContainer: {
    flex: 1,
  },
});

export default MaterialExplorer;
