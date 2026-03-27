/**
 * UserCapabilitiesTab - Add/remove/toggle mastery of capabilities
 */
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { baseUrl } from "../../../../api/client";
import { devError } from "../../../../utils/devLogger";
import styles from "../../styles";
import { localStyles } from "./styles";
import { showAlert } from "./utils";

interface Capability {
  id: number;
  name?: string;
  display_name?: string;
  domain?: string;
  is_global?: boolean;
  instrument_id?: number;
  user_has?: boolean;
}

interface UserCapabilitiesTabProps {
  userData: {
    capabilities?: {
      mastered?: Capability[];
      introduced?: Capability[];
    };
  };
  userId: string;
  selectedInstrumentId: number | null;
  onRefresh: () => void;
}

export function UserCapabilitiesTab({
  userData,
  userId,
  selectedInstrumentId,
  onRefresh,
}: UserCapabilitiesTabProps) {
  const caps = userData.capabilities || {};
  const mastered = caps.mastered || [];
  const introduced = caps.introduced || [];
  const [showAddModal, setShowAddModal] = useState(false);
  const [allCaps, setAllCaps] = useState<Capability[]>([]);
  const [loadingCaps, setLoadingCaps] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Get IDs the user already has
  const userCapIds = new Set([
    ...mastered.map((c) => c.id),
    ...introduced.map((c) => c.id),
  ]);

  const loadAllCapabilities = async () => {
    setLoadingCaps(true);
    try {
      const url = selectedInstrumentId
        ? `${baseUrl}/admin/users/${userId}/capabilities/available?instrument_id=${selectedInstrumentId}`
        : `${baseUrl}/admin/users/${userId}/capabilities/available`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAllCaps(data.capabilities);
      }
    } catch (_err) {
      devError("Failed to load capabilities:", _err);
    }
    setLoadingCaps(false);
  };

  // Filter capabilities: exclude user's caps and match search
  const filteredCaps = allCaps.filter((c) => {
    // Exclude caps user already has (using our local set as backup)
    if (c.user_has || userCapIds.has(c.id)) return false;
    // Match search query
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.display_name && c.display_name.toLowerCase().includes(q)) ||
      (c.domain && c.domain.toLowerCase().includes(q))
    );
  });

  const handleAddCapability = async (
    capId: number,
    capIsGlobal: boolean,
    mastered: boolean,
  ) => {
    try {
      // For non-global caps, include the selected instrument_id
      const body: {
        capability_id: number;
        mastered: boolean;
        instrument_id?: number;
      } = {
        capability_id: capId,
        mastered,
      };
      if (!capIsGlobal && selectedInstrumentId) {
        body.instrument_id = selectedInstrumentId;
      }

      const response = await fetch(
        `${baseUrl}/admin/users/${userId}/capabilities`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (response.ok) {
        showAlert("Success", "Capability added");
        setShowAddModal(false);
        onRefresh();
      } else {
        const errData = await response.json().catch(() => ({}));
        showAlert("Error", errData.detail || "Failed to add capability");
      }
    } catch (_err) {
      showAlert("Error", "Failed to add capability");
    }
  };

  const handleRemoveCapability = (
    capId: number,
    capName: string,
    capInstrumentId?: number,
  ) => {
    showAlert("Remove Capability", `Remove "${capName}" from this user?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            // Include instrument_id if the capability is instrument-specific
            const url = capInstrumentId
              ? `${baseUrl}/admin/users/${userId}/capabilities/${capId}?instrument_id=${capInstrumentId}`
              : `${baseUrl}/admin/users/${userId}/capabilities/${capId}`;
            const response = await fetch(url, { method: "DELETE" });
            if (response.ok) {
              onRefresh();
            }
          } catch (_err) {
            showAlert("Error", "Failed to remove capability");
          }
        },
      },
    ]);
  };

  const handleToggleMastery = async (
    capId: number,
    capInstrumentId?: number,
  ) => {
    try {
      // Include instrument_id if the capability is instrument-specific
      const url = capInstrumentId
        ? `${baseUrl}/admin/users/${userId}/capabilities/${capId}/toggle-mastery?instrument_id=${capInstrumentId}`
        : `${baseUrl}/admin/users/${userId}/capabilities/${capId}/toggle-mastery`;
      const response = await fetch(url, { method: "PUT" });
      if (response.ok) {
        onRefresh();
      }
    } catch (_err) {
      showAlert("Error", "Failed to toggle mastery");
    }
  };

  return (
    <View>
      {/* Add Capability Button */}
      <TouchableOpacity
        style={localStyles.addButton}
        onPress={() => {
          loadAllCapabilities();
          setShowAddModal(true);
        }}
      >
        <Text style={localStyles.addButtonText}>+ Add Capability</Text>
      </TouchableOpacity>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>
          Mastered Capabilities ({mastered.length})
        </Text>
        {mastered.length > 0 ? (
          mastered.map((cap, idx) => (
            <View key={idx} style={localStyles.capRow}>
              <View style={localStyles.capInfo}>
                <Text style={localStyles.capName}>
                  ✓ {cap.display_name || cap.name}
                </Text>
                <Text style={localStyles.capMeta}>
                  {cap.is_global === false
                    ? "🎸 Instrument-specific"
                    : "🌐 Global"}
                </Text>
              </View>
              <View style={localStyles.capActions}>
                <TouchableOpacity
                  style={localStyles.capActionButton}
                  onPress={() => handleToggleMastery(cap.id, cap.instrument_id)}
                >
                  <Text style={localStyles.capActionText}>Unmaster</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    localStyles.capActionButton,
                    localStyles.removeButton,
                  ]}
                  onPress={() =>
                    handleRemoveCapability(
                      cap.id,
                      cap.display_name || cap.name || "",
                      cap.instrument_id,
                    )
                  }
                >
                  <Text style={localStyles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No mastered capabilities yet</Text>
        )}
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>
          Introduced (not mastered) ({introduced.length})
        </Text>
        {introduced.length > 0 ? (
          introduced.map((cap, idx) => (
            <View key={idx} style={localStyles.capRow}>
              <View style={localStyles.capInfo}>
                <Text style={localStyles.capNameIntro}>
                  ○ {cap.display_name || cap.name}
                </Text>
                <Text style={localStyles.capMeta}>
                  {cap.is_global === false
                    ? "🎸 Instrument-specific"
                    : "🌐 Global"}
                </Text>
              </View>
              <View style={localStyles.capActions}>
                <TouchableOpacity
                  style={localStyles.capActionButton}
                  onPress={() => handleToggleMastery(cap.id, cap.instrument_id)}
                >
                  <Text style={localStyles.capActionText}>Master</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    localStyles.capActionButton,
                    localStyles.removeButton,
                  ]}
                  onPress={() =>
                    handleRemoveCapability(
                      cap.id,
                      cap.display_name || cap.name || "",
                      cap.instrument_id,
                    )
                  }
                >
                  <Text style={localStyles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>None</Text>
        )}
      </View>

      {/* Add Capability Modal */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <Text style={localStyles.modalTitle}>Add Capability</Text>
            {/* Search Bar */}
            <TextInput
              style={localStyles.searchInput}
              placeholder="Search capabilities..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {loadingCaps ? (
              <ActivityIndicator size="small" color="#2196F3" />
            ) : (
              <>
                <Text style={localStyles.resultCount}>
                  {filteredCaps.length} available
                </Text>
                <ScrollView style={localStyles.modalScroll}>
                  {filteredCaps.map((cap) => (
                    <View key={cap.id} style={localStyles.modalCapRow}>
                      <View>
                        <Text style={localStyles.modalCapName}>
                          {cap.display_name || cap.name}
                        </Text>
                        <Text style={localStyles.modalCapDomain}>
                          {cap.domain} •{" "}
                          {cap.is_global === false
                            ? "🎸 Instrument-specific"
                            : "🌐 Global"}
                        </Text>
                      </View>
                      <View style={localStyles.modalCapActions}>
                        <TouchableOpacity
                          style={localStyles.modalAddButton}
                          onPress={() =>
                            handleAddCapability(
                              cap.id,
                              cap.is_global !== false,
                              false,
                            )
                          }
                        >
                          <Text style={localStyles.modalAddText}>
                            Introduce
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            localStyles.modalAddButton,
                            localStyles.modalMasterButton,
                          ]}
                          onPress={() =>
                            handleAddCapability(
                              cap.id,
                              cap.is_global !== false,
                              true,
                            )
                          }
                        >
                          <Text style={localStyles.modalMasterText}>
                            + Mastered
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
            <TouchableOpacity
              style={localStyles.modalCloseButton}
              onPress={() => {
                setShowAddModal(false);
                setSearchQuery("");
              }}
            >
              <Text style={localStyles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default UserCapabilitiesTab;
