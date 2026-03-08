/**
 * SoftGateRulesList - List of soft gate rules with CRUD operations
 */
import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import styles from "../../../styles";
import { useSoftGateRules } from "../hooks";
import SoftGateRuleEditModal from "./SoftGateRuleEditModal";
import SoftGateRuleCreateModal from "./SoftGateRuleCreateModal";

export default function SoftGateRulesList() {
  // Use extracted hook for state and CRUD operations
  const {
    rules,
    loading,
    selectedRule,
    setSelectedRule,
    deleteRule,
    fetchRules,
  } = useSoftGateRules();

  // Modal visibility state (UI-only)
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const renderRuleItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => {
        setSelectedRule(item);
        setShowEditModal(true);
      }}
    >
      <View style={styles.listItemHeader}>
        <Text style={styles.listItemTitle}>{item.dimension_name}</Text>
      </View>
      <View style={styles.listItemDetails}>
        <Text style={styles.listItemDetail}>
          Buffer: {item.frontier_buffer}
        </Text>
        <Text style={styles.listItemDetail}>Step: {item.promotion_step}</Text>
        <Text style={styles.listItemDetail}>
          Min Attempts: {item.min_attempts}
        </Text>
      </View>
      <Text style={styles.listItemSubtext}>
        Success: {item.success_required_count} of{" "}
        {item.success_window_count || "all"} @ rating ≥{" "}
        {item.success_rating_threshold}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Text style={styles.createButtonText}>+ Create Rule</Text>
      </TouchableOpacity>

      <FlatList
        data={rules}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderRuleItem}
        style={styles.list}
      />

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        {selectedRule && (
          <SoftGateRuleEditModal
            rule={selectedRule}
            onClose={() => {
              setShowEditModal(false);
              setSelectedRule(null);
            }}
            onSave={async () => {
              await fetchRules();
              setShowEditModal(false);
              setSelectedRule(null);
            }}
            onDelete={async () => {
              await deleteRule(selectedRule.id);
              setShowEditModal(false);
              setSelectedRule(null);
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
        <SoftGateRuleCreateModal
          onClose={() => setShowCreateModal(false)}
          onCreate={async () => {
            await fetchRules();
            setShowCreateModal(false);
          }}
        />
      </Modal>
    </View>
  );
}
