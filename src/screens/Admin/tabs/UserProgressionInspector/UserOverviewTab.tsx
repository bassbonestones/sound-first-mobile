/**
 * UserOverviewTab - View and edit user info for Day 0 setup
 */
import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal } from "react-native";
import { baseUrl } from "../../../../api/client";
import { devError } from "../../../../utils/devLogger";
import styles from "../../styles";
import { localStyles } from "./styles";
import { INSTRUMENTS, DAY0_STAGES } from "./constants";
import { showAlert } from "./utils";
import { DetailRow, EditableRow } from "./components";

interface UserOverviewTabProps {
  userData: {
    user?: {
      id?: number;
      email?: string;
      instrument?: string;
      resonant_note?: string;
      range_low?: string;
      range_high?: string;
      day0_completed?: boolean;
      day0_stage?: number;
    };
    journey?: {
      stage?: string;
      capabilities_mastered?: number;
      materials_completed?: number;
    };
  };
  userId: string;
  onRefresh: () => void;
}

interface EditValues {
  instrument: string;
  resonant_note: string;
  range_low: string;
  range_high: string;
  day0_completed: boolean;
  day0_stage: number;
}

export function UserOverviewTab({
  userData,
  userId,
  onRefresh,
}: UserOverviewTabProps) {
  const user = userData.user || {};
  const journey = userData.journey || {};
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState<EditValues>({
    instrument: "",
    resonant_note: "",
    range_low: "",
    range_high: "",
    day0_completed: false,
    day0_stage: 0,
  });
  const [saving, setSaving] = useState(false);
  const [showInstrumentPicker, setShowInstrumentPicker] = useState(false);

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
      devError("Failed to save:", err);
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
            } catch (_err) {
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
              accessibilityLabel="Edit user info"
              accessibilityRole="button"
              style={localStyles.editButton}
              onPress={startEditing}
            >
              <Text style={localStyles.editButtonText}>Edit User Info</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Reset user progress"
              accessibilityRole="button"
              style={localStyles.resetButton}
              onPress={resetUser}
            >
              <Text style={localStyles.resetButtonText}>Reset User</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              accessibilityLabel="Save changes"
              accessibilityRole="button"
              style={localStyles.saveButton}
              onPress={saveChanges}
              disabled={saving}
            >
              <Text style={localStyles.saveButtonText}>
                {saving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Cancel editing"
              accessibilityRole="button"
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
              onChange={(v: string) =>
                setEditValues({ ...editValues, resonant_note: v })
              }
              placeholder="e.g. F3"
            />
            <EditableRow
              label="Range Low"
              value={editValues.range_low}
              onChange={(v: string) =>
                setEditValues({ ...editValues, range_low: v })
              }
              placeholder="e.g. Bb2"
            />
            <EditableRow
              label="Range High"
              value={editValues.range_high}
              onChange={(v: string) =>
                setEditValues({ ...editValues, range_high: v })
              }
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

export default UserOverviewTab;
