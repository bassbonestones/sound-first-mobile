/**
 * MaterialDetailView - Shows detailed information about a material
 */
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { baseUrl } from "../../../../../api/client";
import { devLog, devError } from "../../../../../utils/devLogger";
import styles from "../../../styles";

function DetailRow({ label, value, valueStyle }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={[styles.detailValue, valueStyle]}>{value}</Text>
    </View>
  );
}

export default function MaterialDetailView({
  material,
  userId,
  onClose,
  onTriggerAnalysis,
}) {
  const [gateStatus, setGateStatus] = useState(null);
  const [loadingGates, setLoadingGates] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [reanalyzeResult, setReanalyzeResult] = useState(null);

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
      devLog("[AdminScreen] Gate check failed");
    }
    setLoadingGates(false);
  };

  const handleReanalyze = async (metrics = null) => {
    setReanalyzing(true);
    setReanalyzeResult(null);
    try {
      const response = await fetch(
        `${baseUrl}/materials/${material.id}/reanalyze`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metrics }),
        },
      );
      const data = await response.json();
      if (response.ok) {
        setReanalyzeResult({
          type: "success",
          message: `Updated: ${data.metrics_updated.join(", ")}`,
          data,
        });
        // Reload material analysis
        if (onTriggerAnalysis) {
          onTriggerAnalysis(material.id);
        }
      } else {
        setReanalyzeResult({
          type: "error",
          message: data.detail || "Reanalysis failed",
        });
      }
    } catch (err) {
      devError("[AdminScreen] Reanalyze error:", err);
      setReanalyzeResult({ type: "error", message: err.message });
    }
    setReanalyzing(false);
  };

  if (!material) return null;

  const analysis = material.analysis || {};

  return (
    <ScrollView style={styles.detailContainer}>
      <View style={styles.detailHeader}>
        <Text style={styles.detailTitle}>{material.title}</Text>
        <TouchableOpacity
          accessibilityLabel="Close material detail"
          accessibilityRole="button"
          style={styles.closeButton}
          onPress={onClose}
        >
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
          label="Interval Sustained"
          value={String(analysis.interval_sustained_stage ?? "N/A")}
        />
        <DetailRow
          label="Interval Hazard"
          value={String(analysis.interval_hazard_stage ?? "N/A")}
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
        <View style={styles.actionButtonRow}>
          <TouchableOpacity
            accessibilityLabel={
              reanalyzing ? "Analyzing" : "Reanalyze all metrics"
            }
            accessibilityRole="button"
            style={[
              styles.actionButton,
              reanalyzing && styles.actionButtonDisabled,
            ]}
            onPress={() => handleReanalyze(null)}
            disabled={reanalyzing}
          >
            <Text style={styles.actionButtonText}>
              {reanalyzing ? "Analyzing..." : "Reanalyze All"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Reanalyze soft gates only"
            accessibilityRole="button"
            style={[
              styles.actionButton,
              reanalyzing && styles.actionButtonDisabled,
            ]}
            onPress={() => handleReanalyze(["soft_gates"])}
            disabled={reanalyzing}
          >
            <Text style={styles.actionButtonText}>Soft Gates Only</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Reanalyze capabilities only"
            accessibilityRole="button"
            style={[
              styles.actionButton,
              reanalyzing && styles.actionButtonDisabled,
            ]}
            onPress={() => handleReanalyze(["capabilities"])}
            disabled={reanalyzing}
          >
            <Text style={styles.actionButtonText}>Capabilities Only</Text>
          </TouchableOpacity>
        </View>
        {reanalyzeResult && (
          <View
            style={[
              styles.statusBanner,
              reanalyzeResult.type === "success"
                ? styles.statusSuccess
                : styles.statusError,
            ]}
          >
            <Text style={styles.statusText}>{reanalyzeResult.message}</Text>
            {reanalyzeResult.data?.soft_gates && (
              <Text style={styles.statusText}>
                IVS: {reanalyzeResult.data.soft_gates.interval_velocity_score}
              </Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

MaterialDetailView.propTypes = {
  material: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    filename: PropTypes.string,
    key_center: PropTypes.string,
    time_signature: PropTypes.string,
    tempo_bpm: PropTypes.number,
    measure_count: PropTypes.number,
    range_low: PropTypes.string,
    range_high: PropTypes.string,
    capabilities: PropTypes.array,
    soft_gates: PropTypes.object,
  }),
  userId: PropTypes.number,
  onClose: PropTypes.func.isRequired,
  onTriggerAnalysis: PropTypes.func,
};
