/**
 * UserSoftGatesTab - View and edit soft envelope state dimensions
 */
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { baseUrl } from "../../../../api/client";
import { devError } from "../../../../utils/devLogger";
import styles from "../../styles";
import { localStyles } from "./styles";
import { showAlert } from "./utils";
import { EditableRow } from "./components";

interface SoftGate {
  dimension_name: string;
  comfortable_value?: number;
  max_demonstrated_value?: number;
  frontier_success_ema?: number;
  frontier_attempt_count_since_last_promo?: number;
}

interface UserSoftGatesTabProps {
  userData: unknown;
  userId: string;
  onRefresh: () => void;
}

interface EditValues {
  comfortable_value: string;
  max_demonstrated_value: string;
  frontier_success_ema: string;
  frontier_attempt_count_since_last_promo: string;
}

export function UserSoftGatesTab({
  userData: _userData,
  userId,
  onRefresh: _onRefresh,
}: UserSoftGatesTabProps) {
  const [allGates, setAllGates] = useState<SoftGate[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingGate, setEditingGate] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditValues>({
    comfortable_value: "0",
    max_demonstrated_value: "0",
    frontier_success_ema: "0",
    frontier_attempt_count_since_last_promo: "0",
  });

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
      devError("Failed to load soft gates:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAllGates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const startEditingGate = (gate: SoftGate) => {
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

  const saveGateChanges = async (dimensionName: string) => {
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
    } catch (_err) {
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

export default UserSoftGatesTab;
