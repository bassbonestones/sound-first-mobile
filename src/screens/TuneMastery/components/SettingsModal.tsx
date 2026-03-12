/**
 * SettingsModal - Configure EMA alpha, tuner mode, temperament
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { DEFAULT_TUNES } from "../../../hooks/useTuneMasteryData";
import type { TunerMode, Temperament } from "./Tuner";

export interface TuneMasterySettings {
  emaAlpha?: number;
  tunerMode?: TunerMode;
  temperament?: Temperament;
  autoMetronome?: boolean;
  autoDrone?: boolean;
}

export interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  settings?: TuneMasterySettings;
  onUpdateSettings: (settings: TuneMasterySettings) => Promise<void>;
  onSeedTunes?: () => Promise<void>;
}

const SettingsModal = React.memo(function SettingsModal({
  visible,
  onClose,
  settings,
  onUpdateSettings,
  onSeedTunes,
}: SettingsModalProps): React.JSX.Element {
  const [emaAlpha, setEmaAlpha] = useState(String(settings?.emaAlpha || 0.3));
  const [tunerMode, setTunerMode] = useState<TunerMode>(
    settings?.tunerMode || "needle",
  );
  const [temperament, setTemperament] = useState<Temperament>(
    settings?.temperament || "equal",
  );
  const [autoMetronome, setAutoMetronome] = useState(
    settings?.autoMetronome || false,
  );
  const [autoDrone, setAutoDrone] = useState(settings?.autoDrone || false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Sync with settings when modal opens
  useEffect(() => {
    if (visible) {
      setEmaAlpha(String(settings?.emaAlpha || 0.3));
      setTunerMode(settings?.tunerMode || "needle");
      setTemperament(settings?.temperament || "equal");
      setAutoMetronome(settings?.autoMetronome || false);
      setAutoDrone(settings?.autoDrone || false);
    }
  }, [visible, settings]);

  const handleSave = useCallback(async () => {
    const alpha = parseFloat(emaAlpha);
    if (isNaN(alpha) || alpha < 0 || alpha > 1) {
      // Reset to default if invalid
      setEmaAlpha("0.3");
      return;
    }
    setIsSaving(true);
    try {
      await onUpdateSettings({
        emaAlpha: alpha,
        tunerMode,
        temperament,
        autoMetronome,
        autoDrone,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  }, [
    emaAlpha,
    tunerMode,
    temperament,
    autoMetronome,
    autoDrone,
    onUpdateSettings,
    onClose,
  ]);

  const handleSeedTunes = useCallback(() => {
    const message = `This will replace all existing tunes with ${DEFAULT_TUNES.length} default tunes (from Hot Cross Buns to Flight of the Bumblebee). Continue?`;

    const doSeed = async () => {
      setIsSeeding(true);
      try {
        await onSeedTunes?.();
        onClose();
      } finally {
        setIsSeeding(false);
      }
    };

    if (Platform.OS === "web") {
      if ((window as Window).confirm(message)) {
        doSeed();
      }
    } else {
      Alert.alert("Seed Default Tunes", message, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Seed Tunes",
          onPress: doSeed,
        },
      ]);
    }
  }, [onSeedTunes, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.content} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>Settings</Text>

          {/* EMA Alpha */}
          <View style={styles.section}>
            <Text style={styles.label}>EMA Alpha (0-1)</Text>
            <Text style={styles.hint}>
              Higher = faster adaptation to new ratings
            </Text>
            <TextInput
              style={styles.input}
              value={emaAlpha}
              onChangeText={setEmaAlpha}
              keyboardType="decimal-pad"
              placeholder="0.3"
              placeholderTextColor="#666"
              accessibilityLabel="EMA Alpha value, between 0 and 1"
              accessibilityHint="Higher values adapt faster to new ratings"
            />
          </View>

          {/* Tuner Mode */}
          <View style={styles.section}>
            <Text style={styles.label}>Tuner Display</Text>
            <View style={styles.optionRow}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  tunerMode === "needle" && styles.optionButtonSelected,
                ]}
                onPress={() => setTunerMode("needle")}
                accessibilityLabel="Needle tuner display"
                accessibilityRole="radio"
                accessibilityState={{ checked: tunerMode === "needle" }}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    tunerMode === "needle" && styles.optionButtonTextSelected,
                  ]}
                >
                  Needle
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  tunerMode === "text" && styles.optionButtonSelected,
                ]}
                onPress={() => setTunerMode("text")}
                accessibilityLabel="Text tuner display"
                accessibilityRole="radio"
                accessibilityState={{ checked: tunerMode === "text" }}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    tunerMode === "text" && styles.optionButtonTextSelected,
                  ]}
                >
                  Text
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Temperament */}
          <View style={styles.section}>
            <Text style={styles.label}>Temperament</Text>
            <View style={styles.optionRow}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  temperament === "equal" && styles.optionButtonSelected,
                ]}
                onPress={() => setTemperament("equal")}
                accessibilityLabel="Equal temperament"
                accessibilityRole="radio"
                accessibilityState={{ checked: temperament === "equal" }}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    temperament === "equal" && styles.optionButtonTextSelected,
                  ]}
                >
                  Equal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  temperament === "just" && styles.optionButtonSelected,
                ]}
                onPress={() => setTemperament("just")}
                accessibilityLabel="Just temperament"
                accessibilityRole="radio"
                accessibilityState={{ checked: temperament === "just" }}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    temperament === "just" && styles.optionButtonTextSelected,
                  ]}
                >
                  Just
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Auto-start Tools */}
          <View style={styles.section}>
            <Text style={styles.label}>Auto-start Tools</Text>
            <Text style={styles.hint}>
              Automatically expand when entering practice
            </Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  autoMetronome && styles.toggleButtonActive,
                ]}
                onPress={() => setAutoMetronome(!autoMetronome)}
                accessibilityLabel={`Auto-start metronome, ${autoMetronome ? "on" : "off"}`}
                accessibilityRole="switch"
                accessibilityState={{ checked: autoMetronome }}
              >
                <Text style={styles.toggleButtonText}>🥁 Metronome</Text>
                <Text
                  style={[
                    styles.toggleStatus,
                    autoMetronome && styles.toggleStatusActive,
                  ]}
                >
                  {autoMetronome ? "ON" : "OFF"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  autoDrone && styles.toggleButtonActive,
                ]}
                onPress={() => setAutoDrone(!autoDrone)}
                accessibilityLabel={`Auto-start pitch drone, ${autoDrone ? "on" : "off"}`}
                accessibilityRole="switch"
                accessibilityState={{ checked: autoDrone }}
              >
                <Text style={styles.toggleButtonText}>🎵 Pitch Drone</Text>
                <Text
                  style={[
                    styles.toggleStatus,
                    autoDrone && styles.toggleStatusActive,
                  ]}
                >
                  {autoDrone ? "ON" : "OFF"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Seed Default Tunes */}
          <View style={styles.section}>
            <Text style={styles.label}>Tune Library</Text>
            <Text style={styles.hint}>
              Load {DEFAULT_TUNES.length} default tunes (replaces existing)
            </Text>
            <TouchableOpacity
              style={[
                styles.seedButton,
                (isSaving || isSeeding) && styles.buttonDisabled,
              ]}
              onPress={handleSeedTunes}
              disabled={isSaving || isSeeding}
              accessibilityLabel={`Seed ${DEFAULT_TUNES.length} default tunes`}
              accessibilityHint="This will replace all existing tunes"
              accessibilityRole="button"
            >
              {isSeeding ? (
                <ActivityIndicator size="small" color="#1a1a2e" />
              ) : (
                <Text style={styles.seedButtonText}>Seed Default Tunes</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isSaving || isSeeding}
              accessibilityLabel="Cancel settings"
              accessibilityRole="button"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (isSaving || isSeeding) && styles.buttonDisabled,
              ]}
              onPress={handleSave}
              disabled={isSaving || isSeeding}
              accessibilityLabel="Save settings"
              accessibilityRole="button"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#1a1a2e" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    backgroundColor: "#2a2a3e",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  hint: {
    color: "#666",
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#3a3a4e",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#FFFFFF",
    fontSize: 16,
  },
  optionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  optionButton: {
    flex: 1,
    backgroundColor: "#3a3a4e",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionButtonSelected: {
    borderColor: "#FFD700",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
  },
  optionButtonText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
  },
  optionButtonTextSelected: {
    color: "#FFD700",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#3a3a4e",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#FFD700",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#1a1a2e",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  seedButton: {
    backgroundColor: "#3a3a4e",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  seedButtonText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "column",
    gap: 8,
    marginTop: 8,
  },
  toggleButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#3a3a4e",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  toggleButtonActive: {
    borderColor: "#4CAF50",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
  toggleButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  toggleStatus: {
    color: "#888",
    fontSize: 12,
    fontWeight: "bold",
  },
  toggleStatusActive: {
    color: "#4CAF50",
  },
});

export default SettingsModal;
