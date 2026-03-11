/**
 * UserProgressionInspector - View and EDIT user mastery state
 * Part of Admin console
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { baseUrl } from "../../../../api/client";
import styles from "../../styles";

// Cross-platform alert helper (Alert doesn't work on web)
const showAlert = (title, message, buttons) => {
  if (Platform.OS === "web") {
    // For web, use window.confirm for destructive actions
    const confirmButton = buttons?.find((b) => b.style === "destructive");
    const cancelButton = buttons?.find((b) => b.style === "cancel");
    if (confirmButton && cancelButton) {
      if (window.confirm(`${title}\n\n${message}`)) {
        confirmButton.onPress?.();
      }
    } else {
      window.alert(`${title}\n\n${message}`);
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

function UserProgressionInspector() {
  const [userId, setUserId] = useState("1");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [selectedInstrumentId, setSelectedInstrumentId] = useState(null);

  const instruments = userData?.instruments || [];

  const loadUserData = async (instrumentId = selectedInstrumentId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const url = instrumentId
        ? `${baseUrl}/admin/users/${userId}/progression?instrument_id=${instrumentId}`
        : `${baseUrl}/admin/users/${userId}/progression`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to load user data");
      const data = await response.json();
      setUserData(data);

      // Auto-select primary instrument if none selected
      if (
        instrumentId === null &&
        data.instruments &&
        data.instruments.length > 0
      ) {
        const primary = data.instruments.find((i) => i.is_primary);
        if (primary) {
          setSelectedInstrumentId(primary.id);
        }
      }
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

  const handleInstrumentChange = (instrumentId) => {
    setSelectedInstrumentId(instrumentId);
    loadUserData(instrumentId);
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
        <TouchableOpacity
          style={styles.loadButton}
          onPress={() => loadUserData()}
        >
          <Text style={styles.loadButtonText}>Load</Text>
        </TouchableOpacity>
      </View>

      {/* Instrument Selector - show after data loaded */}
      {userData && instruments.length > 0 && (
        <View style={localStyles.instrumentSelectorRow}>
          <Text style={localStyles.instrumentSelectorLabel}>Instrument:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={localStyles.instrumentScroll}
          >
            <TouchableOpacity
              style={[
                localStyles.instrumentChip,
                selectedInstrumentId === null &&
                  localStyles.instrumentChipSelected,
              ]}
              onPress={() => handleInstrumentChange(null)}
            >
              <Text
                style={[
                  localStyles.instrumentChipText,
                  selectedInstrumentId === null &&
                    localStyles.instrumentChipTextSelected,
                ]}
              >
                All (Global Only)
              </Text>
            </TouchableOpacity>
            {instruments.map((inst) => (
              <TouchableOpacity
                key={inst.id}
                style={[
                  localStyles.instrumentChip,
                  selectedInstrumentId === inst.id &&
                    localStyles.instrumentChipSelected,
                ]}
                onPress={() => handleInstrumentChange(inst.id)}
              >
                <Text
                  style={[
                    localStyles.instrumentChipText,
                    selectedInstrumentId === inst.id &&
                      localStyles.instrumentChipTextSelected,
                  ]}
                >
                  {inst.instrument_name}
                  {inst.is_primary ? " ★" : ""}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

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
            <UserOverviewTab
              userData={userData}
              userId={userId}
              onRefresh={() => loadUserData()}
            />
          )}
          {activeSubTab === "capabilities" && (
            <UserCapabilitiesTab
              userData={userData}
              userId={userId}
              selectedInstrumentId={selectedInstrumentId}
              onRefresh={() => loadUserData()}
            />
          )}
          {activeSubTab === "soft_gates" && (
            <UserSoftGatesTab
              userData={userData}
              userId={userId}
              onRefresh={() => loadUserData()}
            />
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

// =============================================================================
// OVERVIEW TAB - Now with editing
// =============================================================================

function UserOverviewTab({ userData, userId, onRefresh }) {
  const user = userData.user || {};
  const journey = userData.journey || {};
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [showInstrumentPicker, setShowInstrumentPicker] = useState(false);

  // Flat list of all instruments
  const INSTRUMENTS = [
    // Brass
    { name: "Trumpet", clef: "treble" },
    { name: "French Horn", clef: "treble" },
    { name: "Tenor Trombone", clef: "bass" },
    { name: "Bass Trombone", clef: "bass" },
    { name: "Euphonium", clef: "bass" },
    { name: "Tuba", clef: "bass" },
    // Woodwinds
    { name: "Flute", clef: "treble" },
    { name: "Clarinet", clef: "treble" },
    { name: "Oboe", clef: "treble" },
    { name: "Bassoon", clef: "bass" },
    { name: "Alto Saxophone", clef: "treble" },
    { name: "Tenor Saxophone", clef: "treble" },
    { name: "Baritone Saxophone", clef: "treble" },
    // Strings
    { name: "Violin", clef: "treble" },
    { name: "Viola", clef: "treble" },
    { name: "Cello", clef: "bass" },
    { name: "Double Bass", clef: "bass" },
    { name: "Guitar", clef: "treble" },
    // Keyboard
    { name: "Piano", clef: "treble" },
    // Voice
    { name: "Soprano", clef: "treble" },
    { name: "Alto", clef: "treble" },
    { name: "Tenor", clef: "treble" },
    { name: "Bass Voice", clef: "bass" },
    { name: "Voice (General)", clef: "treble" },
  ];

  const DAY0_STAGES = [
    { value: 0, label: "0 - Not Started" },
    { value: 1, label: "1 - Resonant Note" },
    { value: 2, label: "2 - Range Finding" },
    { value: 3, label: "3 - Completed" },
  ];

  const startEditing = () => {
    setEditValues({
      instrument: user.instrument || "",
      resonant_note: user.resonant_note || "",
      range_low: user.range_low || "",
      range_high: user.range_high || "",
      day0_completed: user.day0_completed || false,
      day0_stage: user.day0_stage || 0,
    });
    setEditing(true);
  };

  const saveChanges = async () => {
    // Validate: if day0_completed, require instrument, resonant note and range
    if (editValues.day0_completed) {
      if (!editValues.instrument || !editValues.instrument.trim()) {
        showAlert(
          "Validation Error",
          "Instrument is required when Day 0 is complete",
        );
        return;
      }
      if (!editValues.resonant_note || !editValues.resonant_note.trim()) {
        showAlert(
          "Validation Error",
          "Resonant note is required when Day 0 is complete",
        );
        return;
      }
      if (!editValues.range_low || !editValues.range_low.trim()) {
        showAlert(
          "Validation Error",
          "Range low is required when Day 0 is complete",
        );
        return;
      }
      if (!editValues.range_high || !editValues.range_high.trim()) {
        showAlert(
          "Validation Error",
          "Range high is required when Day 0 is complete",
        );
        return;
      }
    }

    setSaving(true);
    try {
      // Save user info
      const response = await fetch(`${baseUrl}/admin/users/${userId}/info`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });
      if (!response.ok) {
        showAlert("Error", "Failed to update user info");
        setSaving(false);
        return;
      }

      // If day0_completed was just set to true, grant day 0 capabilities
      const wasDay0Completed = user.day0_completed;
      if (editValues.day0_completed && !wasDay0Completed) {
        const grantResponse = await fetch(
          `${baseUrl}/admin/users/${userId}/grant-day0-capabilities`,
          { method: "POST" },
        );
        if (grantResponse.ok) {
          const result = await grantResponse.json();
          showAlert(
            "Success",
            `User info updated.\n\nDay 0 capabilities granted:\n${result.granted.join(", ") || "All already present"}`,
          );
        } else {
          showAlert(
            "Partial Success",
            "User info saved but failed to grant Day 0 capabilities",
          );
        }
      } else {
        showAlert("Success", "User info updated");
      }

      setEditing(false);
      onRefresh();
    } catch (err) {
      console.error("Failed to save:", err);
      showAlert("Error", "Failed to save changes");
    }
    setSaving(false);
  };

  const resetUser = () => {
    showAlert(
      "Reset User",
      "This will DELETE all user progress including:\n\n• Capabilities\n• Soft gate scores\n• Practice history\n• Module progress\n\nThis cannot be undone!",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                `${baseUrl}/admin/users/${userId}/reset`,
                { method: "POST" },
              );
              if (response.ok) {
                const result = await response.json();
                showAlert(
                  "Success",
                  `User reset complete.\n\nDeleted counts:\n${JSON.stringify(result.deleted_counts, null, 2)}`,
                );
                onRefresh();
              }
            } catch (err) {
              showAlert("Error", "Failed to reset user");
            }
          },
        },
      ],
    );
  };

  return (
    <View>
      {/* Action Buttons */}
      <View style={localStyles.actionBar}>
        {!editing ? (
          <>
            <TouchableOpacity
              style={localStyles.editButton}
              onPress={startEditing}
            >
              <Text style={localStyles.editButtonText}>Edit User Info</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={localStyles.resetButton}
              onPress={resetUser}
            >
              <Text style={localStyles.resetButtonText}>Reset User</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={localStyles.saveButton}
              onPress={saveChanges}
              disabled={saving}
            >
              <Text style={localStyles.saveButtonText}>
                {saving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={localStyles.cancelButton}
              onPress={() => setEditing(false)}
            >
              <Text style={localStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>User Info</Text>
        <DetailRow label="ID" value={String(user.id || "N/A")} />
        <DetailRow label="Email" value={user.email || "N/A"} />

        {editing ? (
          <>
            {/* Instrument Picker */}
            <View style={localStyles.dropdownRow}>
              <Text style={styles.detailLabel}>Instrument:</Text>
              <TouchableOpacity
                style={localStyles.instrumentButton}
                onPress={() => setShowInstrumentPicker(true)}
              >
                <Text style={localStyles.instrumentButtonText}>
                  {editValues.instrument || "Select Instrument"}
                </Text>
                <Text style={localStyles.instrumentArrow}>▼</Text>
              </TouchableOpacity>
            </View>
            <EditableRow
              label="Resonant Note"
              value={editValues.resonant_note}
              onChange={(v) =>
                setEditValues({ ...editValues, resonant_note: v })
              }
              placeholder="e.g. F3"
            />
            <EditableRow
              label="Range Low"
              value={editValues.range_low}
              onChange={(v) => setEditValues({ ...editValues, range_low: v })}
              placeholder="e.g. Bb2"
            />
            <EditableRow
              label="Range High"
              value={editValues.range_high}
              onChange={(v) => setEditValues({ ...editValues, range_high: v })}
              placeholder="e.g. F5"
            />
            <View style={localStyles.toggleRow}>
              <Text style={styles.detailLabel}>Day 0 Complete:</Text>
              <TouchableOpacity
                style={[
                  localStyles.toggleButton,
                  editValues.day0_completed && localStyles.toggleActive,
                ]}
                onPress={() =>
                  setEditValues({
                    ...editValues,
                    day0_completed: !editValues.day0_completed,
                  })
                }
              >
                <Text style={localStyles.toggleText}>
                  {editValues.day0_completed ? "Yes" : "No"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={localStyles.dropdownRow}>
              <Text style={styles.detailLabel}>Day 0 Stage:</Text>
              <View style={localStyles.stageButtons}>
                {DAY0_STAGES.map((stage) => (
                  <TouchableOpacity
                    key={stage.value}
                    style={[
                      localStyles.stageButton,
                      editValues.day0_stage === stage.value &&
                        localStyles.stageButtonActive,
                    ]}
                    onPress={() =>
                      setEditValues({ ...editValues, day0_stage: stage.value })
                    }
                  >
                    <Text
                      style={[
                        localStyles.stageButtonText,
                        editValues.day0_stage === stage.value &&
                          localStyles.stageButtonTextActive,
                      ]}
                    >
                      {stage.value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        ) : (
          <>
            <DetailRow label="Instrument" value={user.instrument || "N/A"} />
            <DetailRow
              label="Resonant Note"
              value={user.resonant_note || "N/A"}
            />
            <DetailRow
              label="Range"
              value={`${user.range_low || "?"} - ${user.range_high || "?"}`}
            />
            <DetailRow
              label="Day 0 Complete"
              value={user.day0_completed ? "Yes" : "No"}
            />
            <DetailRow
              label="Day 0 Stage"
              value={String(user.day0_stage || 0)}
            />
          </>
        )}
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

      {/* Instrument Picker Modal */}
      <Modal visible={showInstrumentPicker} transparent animationType="fade">
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <Text style={localStyles.modalTitle}>Select Instrument</Text>
            <ScrollView style={localStyles.modalScroll}>
              {INSTRUMENTS.map((inst) => (
                <TouchableOpacity
                  key={inst.name}
                  style={[
                    localStyles.instrumentOption,
                    editValues.instrument === inst.name &&
                      localStyles.instrumentOptionSelected,
                  ]}
                  onPress={() => {
                    setEditValues({ ...editValues, instrument: inst.name });
                    setShowInstrumentPicker(false);
                  }}
                >
                  <Text
                    style={[
                      localStyles.instrumentOptionText,
                      editValues.instrument === inst.name &&
                        localStyles.instrumentOptionTextSelected,
                    ]}
                  >
                    {inst.name}
                  </Text>
                  <Text style={localStyles.instrumentClef}>
                    {inst.clef === "bass" ? "𝄢 Bass" : "𝄞 Treble"}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={localStyles.modalCloseButton}
              onPress={() => setShowInstrumentPicker(false)}
            >
              <Text style={localStyles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// =============================================================================
// CAPABILITIES TAB - Now with add/remove/toggle mastery
// =============================================================================

function UserCapabilitiesTab({
  userData,
  userId,
  selectedInstrumentId,
  onRefresh,
}) {
  const caps = userData.capabilities || {};
  const mastered = caps.mastered || [];
  const introduced = caps.introduced || [];
  const [showAddModal, setShowAddModal] = useState(false);
  const [allCaps, setAllCaps] = useState([]);
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
    } catch (err) {
      console.error("Failed to load capabilities:", err);
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

  const handleAddCapability = async (capId, capIsGlobal, mastered) => {
    try {
      // For non-global caps, include the selected instrument_id
      const body = { capability_id: capId, mastered };
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
    } catch (err) {
      showAlert("Error", "Failed to add capability");
    }
  };

  const handleRemoveCapability = (capId, capName, capInstrumentId) => {
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
          } catch (err) {
            showAlert("Error", "Failed to remove capability");
          }
        },
      },
    ]);
  };

  const handleToggleMastery = async (capId, capInstrumentId) => {
    try {
      // Include instrument_id if the capability is instrument-specific
      const url = capInstrumentId
        ? `${baseUrl}/admin/users/${userId}/capabilities/${capId}/toggle-mastery?instrument_id=${capInstrumentId}`
        : `${baseUrl}/admin/users/${userId}/capabilities/${capId}/toggle-mastery`;
      const response = await fetch(url, { method: "PUT" });
      if (response.ok) {
        onRefresh();
      }
    } catch (err) {
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
                      cap.display_name || cap.name,
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
                      cap.display_name || cap.name,
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
                      <View style={localStyles.modalCapInfo}>
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

// =============================================================================
// SOFT GATES TAB - Now with editing
// =============================================================================

function UserSoftGatesTab({ userData, userId, onRefresh }) {
  const [allGates, setAllGates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingGate, setEditingGate] = useState(null);
  const [editValues, setEditValues] = useState({});

  const loadAllGates = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${baseUrl}/admin/users/${userId}/soft-gates/all`,
      );
      if (response.ok) {
        const data = await response.json();
        setAllGates(data.soft_gates);
      }
    } catch (err) {
      console.error("Failed to load soft gates:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAllGates();
  }, [userId]);

  const startEditingGate = (gate) => {
    setEditValues({
      comfortable_value: String(gate.comfortable_value || 0),
      max_demonstrated_value: String(gate.max_demonstrated_value || 0),
      frontier_success_ema: String(gate.frontier_success_ema || 0),
      frontier_attempt_count_since_last_promo: String(
        gate.frontier_attempt_count_since_last_promo || 0,
      ),
    });
    setEditingGate(gate.dimension_name);
  };

  const saveGateChanges = async (dimensionName) => {
    try {
      const response = await fetch(
        `${baseUrl}/admin/users/${userId}/soft-gates/${dimensionName}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comfortable_value: parseFloat(editValues.comfortable_value),
            max_demonstrated_value: parseFloat(
              editValues.max_demonstrated_value,
            ),
            frontier_success_ema: parseFloat(editValues.frontier_success_ema),
            frontier_attempt_count_since_last_promo: parseInt(
              editValues.frontier_attempt_count_since_last_promo,
            ),
          }),
        },
      );
      if (response.ok) {
        setEditingGate(null);
        loadAllGates();
      }
    } catch (err) {
      showAlert("Error", "Failed to save changes");
    }
  };

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
        <Text style={styles.detailSectionTitle}>Soft Envelope State</Text>
        <Text style={localStyles.helpText}>Tap a dimension to edit values</Text>
        {allGates.length > 0 ? (
          allGates.map((gate, idx) => (
            <View key={idx} style={localStyles.softGateCard}>
              <TouchableOpacity
                style={localStyles.softGateHeader}
                onPress={() =>
                  editingGate === gate.dimension_name
                    ? setEditingGate(null)
                    : startEditingGate(gate)
                }
              >
                <Text style={localStyles.softGateName}>
                  {gate.dimension_name}
                </Text>
                <Text style={localStyles.softGateExpand}>
                  {editingGate === gate.dimension_name ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>

              {editingGate === gate.dimension_name ? (
                <View style={localStyles.softGateEdit}>
                  <EditableRow
                    label="Comfort"
                    value={editValues.comfortable_value}
                    onChange={(v) =>
                      setEditValues({ ...editValues, comfortable_value: v })
                    }
                    keyboardType="decimal-pad"
                  />
                  <EditableRow
                    label="Max Demonstrated"
                    value={editValues.max_demonstrated_value}
                    onChange={(v) =>
                      setEditValues({
                        ...editValues,
                        max_demonstrated_value: v,
                      })
                    }
                    keyboardType="decimal-pad"
                  />
                  <EditableRow
                    label="Success EMA"
                    value={editValues.frontier_success_ema}
                    onChange={(v) =>
                      setEditValues({ ...editValues, frontier_success_ema: v })
                    }
                    keyboardType="decimal-pad"
                  />
                  <EditableRow
                    label="Attempts Since Promo"
                    value={editValues.frontier_attempt_count_since_last_promo}
                    onChange={(v) =>
                      setEditValues({
                        ...editValues,
                        frontier_attempt_count_since_last_promo: v,
                      })
                    }
                    keyboardType="number-pad"
                  />
                  <View style={localStyles.softGateActions}>
                    <TouchableOpacity
                      style={localStyles.saveButton}
                      onPress={() => saveGateChanges(gate.dimension_name)}
                    >
                      <Text style={localStyles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={localStyles.cancelButton}
                      onPress={() => setEditingGate(null)}
                    >
                      <Text style={localStyles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={localStyles.softGateValues}>
                  <Text style={localStyles.softGateValue}>
                    Comfort: {gate.comfortable_value?.toFixed(1) || 0}
                  </Text>
                  <Text style={localStyles.softGateValue}>
                    Max: {gate.max_demonstrated_value?.toFixed(1) || 0}
                  </Text>
                  <Text style={localStyles.softGateValue}>
                    EMA: {((gate.frontier_success_ema || 0) * 100).toFixed(0)}%
                  </Text>
                  <Text style={localStyles.softGateValue}>
                    Attempts:{" "}
                    {gate.frontier_attempt_count_since_last_promo || 0}
                  </Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No soft gate data available</Text>
        )}
      </View>
    </View>
  );
}

// =============================================================================
// CANDIDATES TAB (unchanged)
// =============================================================================

function UserCandidatesTab({ userId }) {
  const [candidates, setCandidates] = useState(null);
  const [availableModules, setAvailableModules] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCandidates = async () => {
    setLoading(true);
    try {
      // Load material candidates
      const response = await fetch(
        `${baseUrl}/admin/users/${userId}/session-candidates`,
      );
      if (response.ok) {
        const data = await response.json();
        setCandidates(data);
      }
      
      // Load available teaching modules
      const modulesResponse = await fetch(
        `${baseUrl}/modules/user/${userId}/available`,
      );
      if (modulesResponse.ok) {
        const modulesData = await modulesResponse.json();
        setAvailableModules(modulesData);
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
          Available Teaching Modules
        </Text>
        {availableModules?.length > 0 ? (
          <>
            <Text style={styles.candidateCount}>
              {availableModules.length} modules available
            </Text>
            {availableModules.map((mod, idx) => (
              <View key={idx} style={styles.candidateItem}>
                <Text style={styles.candidateTitle}>{mod.display_name}</Text>
                <Text style={styles.candidateReason}>
                  {mod.capability_name} • {mod.status === 'not_started' ? 'Not started' : mod.status === 'in_progress' ? `In progress (${mod.lessons_completed}/${mod.lesson_count})` : mod.status}
                </Text>
                {mod.prerequisite_capability_names?.length > 0 && (
                  <Text style={styles.candidateReason}>
                    Prereqs: {mod.prerequisite_capability_names.join(', ')}
                  </Text>
                )}
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.noDataText}>No teaching modules available (check prerequisites)</Text>
        )}
      </View>

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

function EditableRow({
  label,
  value,
  onChange,
  placeholder,
  keyboardType = "default",
}) {
  return (
    <View style={localStyles.editableRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <TextInput
        style={localStyles.editInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#666"
        keyboardType={keyboardType}
      />
    </View>
  );
}

// =============================================================================
// LOCAL STYLES
// =============================================================================

const localStyles = {
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  resetButton: {
    flex: 1,
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#666",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  editableRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  editInput: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#444",
    marginLeft: 8,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  toggleButton: {
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "#444",
    borderRadius: 4,
  },
  toggleActive: {
    backgroundColor: "#4CAF50",
  },
  toggleText: {
    color: "#fff",
    fontWeight: "600",
  },
  dropdownRow: {
    marginBottom: 8,
  },
  stageButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  stageButton: {
    width: 36,
    height: 36,
    backgroundColor: "#333",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#444",
  },
  stageButtonActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  stageButtonText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
  },
  stageButtonTextActive: {
    color: "#fff",
  },
  addButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 12,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  capRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  capInfo: {
    flex: 1,
  },
  capMeta: {
    color: "#666",
    fontSize: 10,
    marginTop: 2,
  },
  capName: {
    color: "#4CAF50",
    fontSize: 13,
  },
  capNameIntro: {
    color: "#aaa",
    fontSize: 13,
  },
  capActions: {
    flexDirection: "row",
    gap: 8,
  },
  capActionButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#333",
    borderRadius: 4,
  },
  capActionText: {
    color: "#2196F3",
    fontSize: 11,
  },
  removeButton: {
    backgroundColor: "#5c2a2a",
  },
  removeButtonText: {
    color: "#f44336",
    fontSize: 14,
    fontWeight: "bold",
  },
  helpText: {
    color: "#888",
    fontSize: 11,
    fontStyle: "italic",
    marginBottom: 8,
  },
  softGateCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    marginBottom: 8,
    overflow: "hidden",
  },
  softGateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#333",
  },
  softGateName: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "600",
  },
  softGateExpand: {
    color: "#888",
    fontSize: 12,
  },
  softGateValues: {
    padding: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  softGateValue: {
    color: "#aaa",
    fontSize: 12,
  },
  softGateEdit: {
    padding: 10,
  },
  softGateActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  searchInput: {
    backgroundColor: "#2a2a2a",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
    marginBottom: 8,
    fontSize: 14,
  },
  resultCount: {
    color: "#888",
    fontSize: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalCapRow: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  modalCapName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  modalCapDomain: {
    color: "#888",
    fontSize: 11,
    marginBottom: 8,
  },
  modalCapActions: {
    flexDirection: "row",
    gap: 8,
  },
  modalAddButton: {
    flex: 1,
    backgroundColor: "#333",
    padding: 8,
    borderRadius: 4,
    alignItems: "center",
  },
  modalAddText: {
    color: "#2196F3",
    fontSize: 12,
    fontWeight: "600",
  },
  modalMasterButton: {
    backgroundColor: "#2d4a2d",
  },
  modalMasterText: {
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "600",
  },
  modalCloseButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#333",
    borderRadius: 8,
    alignItems: "center",
  },
  modalCloseText: {
    color: "#fff",
    fontWeight: "600",
  },
  // Instrument picker styles
  instrumentSelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  instrumentSelectorLabel: {
    color: "#888",
    fontSize: 12,
    marginRight: 8,
  },
  instrumentScroll: {
    flexGrow: 0,
  },
  instrumentChip: {
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  instrumentChipSelected: {
    backgroundColor: "#1a3a5a",
    borderColor: "#2196F3",
  },
  instrumentChipText: {
    color: "#aaa",
    fontSize: 12,
  },
  instrumentChipTextSelected: {
    color: "#2196F3",
    fontWeight: "600",
  },
  instrumentButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#444",
    marginVertical: 6,
  },
  instrumentButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  instrumentArrow: {
    color: "#888",
    fontSize: 12,
  },
  instrumentOption: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  instrumentOptionSelected: {
    backgroundColor: "#1a3a1a",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  instrumentOptionText: {
    color: "#fff",
    fontSize: 14,
  },
  instrumentOptionTextSelected: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  instrumentClef: {
    color: "#888",
    fontSize: 12,
  },
};

export default UserProgressionInspector;
