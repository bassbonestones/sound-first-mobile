/**
 * UserProgressionInspector - View and EDIT user mastery state
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
  ActivityIndicator,
} from "react-native";
import { baseUrl } from "../../../../api/client";
import { devError } from "../../../../utils/devLogger";
import styles from "../../styles";
import { localStyles } from "./styles";
import { SUB_TABS } from "./constants";
import { UserOverviewTab } from "./UserOverviewTab";
import { UserCapabilitiesTab } from "./UserCapabilitiesTab";
import { UserSoftGatesTab } from "./UserSoftGatesTab";
import { UserCandidatesTab } from "./UserCandidatesTab";

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
      devError("[AdminScreen] Load user progression error:", err);
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
        devError("[AdminScreen] User data fallback failed:", e);
      }
    }
    setLoading(false);
  };

  const handleInstrumentChange = (instrumentId) => {
    setSelectedInstrumentId(instrumentId);
    loadUserData(instrumentId);
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
        <TouchableOpacity
          accessibilityLabel="Load user data"
          accessibilityRole="button"
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
              accessibilityLabel="Show all instruments, global capabilities only"
              accessibilityRole="button"
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
                accessibilityLabel={`Select ${inst.instrument_name}${inst.is_primary ? ", primary instrument" : ""}`}
                accessibilityRole="button"
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
            accessibilityLabel={`View ${tab.label}`}
            accessibilityRole="button"
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

export default UserProgressionInspector;
