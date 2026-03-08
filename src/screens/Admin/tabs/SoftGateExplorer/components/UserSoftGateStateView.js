/**
 * UserSoftGateStateView - User soft gate state viewer and editor
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
import { useUserSoftGateState } from "../hooks";
import UserSoftGateStateEditModal from "./UserSoftGateStateEditModal";

export default function UserSoftGateStateView() {
  // Use extracted hook for state and operations
  const {
    users,
    selectedUserId,
    selectedUser,
    states,
    loading,
    selectedState,
    setSelectedUserId,
    setSelectedState,
    fetchStates,
    resetStates,
  } = useUserSoftGateState();

  // Modal visibility state (UI-only)
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);

  const handleReset = async (dimensionNames = null) => {
    const result = await resetStates(dimensionNames);
    if (!result.success) {
      alert(result.error || "Failed to reset");
    }
  };

  const renderStateItem = ({ item }) => (
    <View style={styles.listItem}>
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={() => {
          setSelectedState(item);
          setShowEditModal(true);
        }}
      >
        <View style={styles.listItemHeader}>
          <Text style={styles.listItemTitle}>{item.dimension_name}</Text>
        </View>
        <View style={styles.softGateStateGrid}>
          <View style={styles.softGateStatCell}>
            <Text style={styles.softGateStatLabel}>Comfort</Text>
            <Text style={styles.softGateStatValue}>
              {item.comfortable_value.toFixed(2)}
            </Text>
          </View>
          <View style={styles.softGateStatCell}>
            <Text style={styles.softGateStatLabel}>Max Demo</Text>
            <Text style={styles.softGateStatValue}>
              {item.max_demonstrated_value.toFixed(2)}
            </Text>
          </View>
          <View style={styles.softGateStatCell}>
            <Text style={styles.softGateStatLabel}>EMA</Text>
            <Text style={styles.softGateStatValue}>
              {item.frontier_success_ema.toFixed(3)}
            </Text>
          </View>
          <View style={styles.softGateStatCell}>
            <Text style={styles.softGateStatLabel}>Attempts</Text>
            <Text style={styles.softGateStatValue}>
              {item.frontier_attempt_count_since_last_promo}
            </Text>
          </View>
        </View>
        {item.updated_at && (
          <Text style={styles.listItemSubtext}>
            Updated: {new Date(item.updated_at).toLocaleDateString()}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.softGateContent}>
      {/* User Picker */}
      <View style={styles.userPickerContainer}>
        <Text style={styles.userPickerLabel}>User:</Text>
        <TouchableOpacity
          style={styles.userPickerButton}
          onPress={() => setShowUserPicker(true)}
        >
          <Text style={styles.userPickerButtonText}>
            {selectedUser
              ? `${selectedUser.email} (ID: ${selectedUser.id})`
              : "Select user..."}
          </Text>
          <Text style={styles.userPickerArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Reset All Button */}
      <TouchableOpacity
        style={styles.resetAllButton}
        onPress={() => handleReset(null)}
      >
        <Text style={styles.resetAllButtonText}>Reset All Dimensions</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : (
        <FlatList
          data={states}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderStateItem}
          style={styles.list}
          ListEmptyComponent={
            <Text style={styles.noDataText}>
              No soft gate state for this user
            </Text>
          }
        />
      )}

      {/* User Picker Modal */}
      <Modal
        visible={showUserPicker}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowUserPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerModalOverlay}
          activeOpacity={1}
          onPress={() => setShowUserPicker(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select User</Text>
            <FlatList
              data={users}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerModalItem,
                    item.id === selectedUserId &&
                      styles.pickerModalItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedUserId(item.id);
                    setShowUserPicker(false);
                  }}
                >
                  <Text style={styles.pickerModalItemText}>
                    {item.email || `User ${item.id}`}
                  </Text>
                  <Text style={styles.pickerModalItemSubtext}>
                    ID: {item.id}{" "}
                    {item.instrument ? `• ${item.instrument}` : ""}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.pickerModalList}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        {selectedState && (
          <UserSoftGateStateEditModal
            state={selectedState}
            onClose={() => {
              setShowEditModal(false);
              setSelectedState(null);
            }}
            onSave={async () => {
              await fetchStates();
              setShowEditModal(false);
              setSelectedState(null);
            }}
            onReset={async () => {
              await handleReset([selectedState.dimension_name]);
              setShowEditModal(false);
              setSelectedState(null);
            }}
          />
        )}
      </Modal>
    </View>
  );
}
