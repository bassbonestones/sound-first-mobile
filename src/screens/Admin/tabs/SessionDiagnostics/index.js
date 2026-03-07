/**
 * SessionDiagnostics - Debug session generation
 * Part of Admin console
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { baseUrl } from "../../../../api/client";
import styles from "../../styles";

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
// SECTION 5: FOCUS CARD EXPLORER
// =============================================================================


export default SessionDiagnostics;
