/**
 * CompactTopBar Component
 *
 * Minimal top bar for small screens: back button, title, validation indicator, and settings gear.
 * All score settings (clef, time, key, tempo) are accessed via a single settings modal.
 */

import React, { memo, useCallback, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  ScrollView,
  AccessibilityRole,
  Alert,
  Platform,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";
import TimeSignaturePickerModal from "../../../components/Metronome/TimeSignaturePickerModal";
import { getKeyName, ALL_KEY_SIGNATURES } from "../constants";
import type { Clef, TimeSignature, KeySignature } from "../types";

// =============================================================================
// Types
// =============================================================================

export interface CompactTopBarProps {
  /** Score title */
  title: string;
  /** Called when title changes */
  onTitleChange: (title: string) => void;
  /** Current clef */
  clef: Clef;
  /** Called when clef changes */
  onClefChange: (clef: Clef) => void;
  /** Current time signature */
  timeSignature: TimeSignature;
  /** Called when time signature changes */
  onTimeSignatureChange: (ts: TimeSignature) => void;
  /** Whether time signature is locked (notes exist) */
  timeSignatureLocked?: boolean;
  /** Current key signature (-7 to +7) */
  keySignature: KeySignature;
  /** Called when key signature changes */
  onKeySignatureChange: (key: KeySignature) => void;
  /** Current tempo in BPM */
  tempo: number;
  /** Called when tempo changes */
  onTempoChange: (tempo: number) => void;
  /** Current zoom level (0.5-2.5) */
  zoom: number;
  /** Called when zoom changes */
  onZoomChange: (zoom: number) => void;
  /** Called when clear score is pressed */
  onClearScore?: () => void;
  /** Called when back is pressed */
  onBack?: () => void;
  /** Whether controls are disabled */
  disabled?: boolean;
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// Component
// =============================================================================

function CompactTopBarComponent({
  title: _title,
  onTitleChange: _onTitleChange,
  clef,
  onClefChange,
  timeSignature,
  onTimeSignatureChange,
  timeSignatureLocked = false,
  keySignature,
  onKeySignatureChange,
  tempo,
  onTempoChange,
  zoom,
  onZoomChange,
  onClearScore,
  onBack,
  disabled = false,
  testID,
}: CompactTopBarProps): React.ReactElement {
  // Modal states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempoInput, setTempoInput] = useState(tempo.toString());

  // Handlers
  const handleClefToggle = useCallback(() => {
    onClefChange(clef === "treble" ? "bass" : "treble");
  }, [clef, onClefChange]);

  const handleBeatsChange = useCallback(
    (beats: number) => {
      onTimeSignatureChange({ beats, beatUnit: timeSignature.beatUnit });
    },
    [onTimeSignatureChange, timeSignature.beatUnit],
  );

  const handleNoteValueChange = useCallback(
    (beatUnit: number) => {
      onTimeSignatureChange({ beats: timeSignature.beats, beatUnit });
    },
    [onTimeSignatureChange, timeSignature.beats],
  );

  const handleKeySelect = useCallback(
    (k: KeySignature) => {
      onKeySignatureChange(k);
      setShowKeyModal(false);
    },
    [onKeySignatureChange],
  );

  const handleTempoChange = useCallback(
    (delta: number) => {
      const newTempo = Math.max(20, Math.min(300, tempo + delta));
      onTempoChange(newTempo);
      setTempoInput(newTempo.toString());
    },
    [tempo, onTempoChange],
  );

  const handleTempoInputBlur = useCallback(() => {
    const parsed = parseInt(tempoInput, 10);
    if (!isNaN(parsed) && parsed >= 20 && parsed <= 300) {
      onTempoChange(parsed);
    } else {
      setTempoInput(tempo.toString());
    }
  }, [tempoInput, tempo, onTempoChange]);

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoom + 0.25, 2.5);
    onZoomChange(newZoom);
  }, [zoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoom - 0.25, 0.5);
    onZoomChange(newZoom);
  }, [zoom, onZoomChange]);

  const handleZoomReset = useCallback(() => {
    onZoomChange(1.0);
  }, [onZoomChange]);

  const tsDisplay = `${timeSignature.beats}/${timeSignature.beatUnit}`;
  const keyName = getKeyName(keySignature);

  return (
    <View style={styles.container} testID={testID}>
      {/* Back button */}
      {onBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel="Go back"
          testID="topbar-back"
        >
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      )}

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>
          Composer
        </Text>
      </View>

      {/* Settings gear button */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => setShowSettingsModal(true)}
        disabled={disabled}
        accessibilityRole={"button" as AccessibilityRole}
        accessibilityLabel="Score settings"
        testID="topbar-settings"
      >
        <Feather
          name="settings"
          size={22}
          color={disabled ? colors.textSecondary : colors.textPrimary}
        />
      </TouchableOpacity>

      {/* Unified Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.settingsModalContainer}>
          <View style={styles.settingsModalContent}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>Score Settings</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSettingsModal(false)}
                testID="settings-close"
              >
                <Feather name="x" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.settingsBody}>
              {/* Clef */}
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Clef</Text>
                <TouchableOpacity
                  style={styles.settingButton}
                  onPress={handleClefToggle}
                  testID="settings-clef"
                >
                  <Text style={styles.settingValue}>
                    {clef === "treble" ? "Treble 𝄞" : "Bass 𝄢"}
                  </Text>
                  <Feather
                    name="repeat"
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Time Signature */}
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Time</Text>
                <TouchableOpacity
                  style={styles.settingButton}
                  onPress={() => {
                    if (timeSignatureLocked) {
                      const title = "Time Signature Locked";
                      const message =
                        "Time signature cannot be changed when notes are present. For complex pieces with time signature changes, use a full-featured score editor like MuseScore.";
                      if (Platform.OS === "web") {
                        window.alert(`${title}\n\n${message}`);
                      } else {
                        Alert.alert(title, message);
                      }
                      return;
                    }
                    setShowTimeModal(true);
                  }}
                  testID="settings-time"
                >
                  <Text style={styles.settingValue}>
                    {tsDisplay}
                    {timeSignatureLocked ? " 🔒" : ""}
                  </Text>
                  <Feather
                    name={timeSignatureLocked ? "lock" : "chevron-right"}
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Key Signature */}
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Key</Text>
                <TouchableOpacity
                  style={styles.settingButton}
                  onPress={() => {
                    setShowKeyModal(true);
                  }}
                  testID="settings-key"
                >
                  <Text style={styles.settingValue}>{keyName}</Text>
                  <Feather
                    name="chevron-right"
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Tempo */}
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Tempo</Text>
                <View style={styles.tempoControls}>
                  <TouchableOpacity
                    style={styles.tempoButton}
                    onPress={() => handleTempoChange(-5)}
                    testID="settings-tempo-down"
                  >
                    <Feather
                      name="minus"
                      size={18}
                      color={colors.textPrimary}
                    />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.tempoInput}
                    value={tempoInput}
                    onChangeText={setTempoInput}
                    onBlur={handleTempoInputBlur}
                    keyboardType="number-pad"
                    maxLength={3}
                    textAlign="center"
                    testID="settings-tempo-input"
                  />
                  <TouchableOpacity
                    style={styles.tempoButton}
                    onPress={() => handleTempoChange(5)}
                    testID="settings-tempo-up"
                  >
                    <Feather name="plus" size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.bpmLabel}>BPM</Text>
                </View>
              </View>

              {/* Zoom */}
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Zoom</Text>
                <View style={styles.tempoControls}>
                  <TouchableOpacity
                    style={styles.tempoButton}
                    onPress={handleZoomOut}
                    disabled={zoom <= 0.5}
                    testID="settings-zoom-out"
                  >
                    <Feather
                      name="minus"
                      size={18}
                      color={
                        zoom <= 0.5 ? colors.textSecondary : colors.textPrimary
                      }
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.zoomDisplay}
                    onPress={handleZoomReset}
                    testID="settings-zoom-reset"
                  >
                    <Text style={styles.zoomText}>
                      {Math.round(zoom * 100)}%
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.tempoButton}
                    onPress={handleZoomIn}
                    disabled={zoom >= 2.5}
                    testID="settings-zoom-in"
                  >
                    <Feather
                      name="plus"
                      size={18}
                      color={
                        zoom >= 2.5 ? colors.textSecondary : colors.textPrimary
                      }
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Clear Score */}
              {onClearScore && (
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Clear</Text>
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => {
                      const title = "Clear Score?";
                      const message =
                        "This will remove all notes and reset to empty measures. This cannot be undone.";
                      if (Platform.OS === "web") {
                        if (window.confirm(`${title}\n\n${message}`)) {
                          onClearScore();
                          setShowSettingsModal(false);
                        }
                      } else {
                        Alert.alert(title, message, [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Clear",
                            style: "destructive",
                            onPress: () => {
                              onClearScore();
                              setShowSettingsModal(false);
                            },
                          },
                        ]);
                      }
                    }}
                    testID="settings-clear-score"
                  >
                    <Text style={styles.clearButtonText}>Clear Score</Text>
                    <Feather name="trash-2" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Time Signature Picker */}
      <TimeSignaturePickerModal
        visible={showTimeModal}
        onClose={() => setShowTimeModal(false)}
        beatsPerMeasure={timeSignature.beats}
        noteValue={timeSignature.beatUnit}
        onBeatsChange={handleBeatsChange}
        onNoteValueChange={handleNoteValueChange}
      />

      {/* Key Signature Modal */}
      <Modal
        visible={showKeyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowKeyModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowKeyModal(false)}
        >
          <View
            style={styles.keyModalContent}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.keyModalTitle}>Select Key</Text>
            <ScrollView style={styles.keyScroll}>
              {ALL_KEY_SIGNATURES.map((k) => {
                const isSelected = k === keySignature;
                const kName = getKeyName(k);
                return (
                  <TouchableOpacity
                    key={k}
                    style={[
                      styles.keyOption,
                      isSelected && styles.keyOptionSelected,
                    ]}
                    onPress={() => handleKeySelect(k as KeySignature)}
                    testID={`key-${k}`}
                  >
                    <Text style={styles.keyOptionText}>{kName}</Text>
                    {isSelected && (
                      <Feather name="check" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    height: 44,
  },
  backButton: {
    padding: spacing.xs,
  },
  titleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  settingsButton: {
    padding: spacing.xs,
  },
  // Settings Modal
  settingsModalContainer: {
    flex: 1,
    justifyContent: "flex-start",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  settingsModalContent: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    maxHeight: "70%",
  },
  settingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  settingsBody: {
    padding: spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  settingButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  tempoControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  tempoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  tempoInput: {
    width: 50,
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bpmLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  zoomDisplay: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 56,
    alignItems: "center",
  },
  zoomText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  // Key Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  keyModalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    width: "85%",
    maxWidth: 320,
    maxHeight: "70%",
  },
  keyModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  keyScroll: {
    maxHeight: 350,
  },
  keyOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  keyOptionSelected: {
    backgroundColor: colors.primaryLight,
  },
  keyOptionText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.error,
  },
});

// =============================================================================
// Export
// =============================================================================

export const CompactTopBar = memo(CompactTopBarComponent);
