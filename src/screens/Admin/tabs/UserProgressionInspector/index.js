/**
 * UserProgressionInspector - View user mastery state
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
} from "react-native";
import { baseUrl } from "../../../../api/client";
import styles from "../../styles";

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
// SECTION 4: SESSION DIAGNOSTICS
// =============================================================================

export default UserProgressionInspector;
