/**
 * SettingsModal - Configure EMA alpha, tuner mode, temperament
 */
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { DEFAULT_TUNES } from "../../../hooks/useTuneMasteryData";

export default function SettingsModal({
  visible,
  onClose,
  settings,
  onUpdateSettings,
  onSeedTunes,
}) {
  const [emaAlpha, setEmaAlpha] = useState(String(settings?.emaAlpha || 0.3));
  const [tunerMode, setTunerMode] = useState(settings?.tunerMode || "needle");
  const [temperament, setTemperament] = useState(
    settings?.temperament || "equal",
  );

  // Sync with settings when modal opens
  useEffect(() => {
    if (visible) {
      setEmaAlpha(String(settings?.emaAlpha || 0.3));
      setTunerMode(settings?.tunerMode || "needle");
      setTemperament(settings?.temperament || "equal");
    }
  }, [visible, settings]);

  const handleSave = () => {
    const alpha = parseFloat(emaAlpha);
    if (isNaN(alpha) || alpha < 0 || alpha > 1) {
      // Reset to default if invalid
      setEmaAlpha("0.3");
      return;
    }
    onUpdateSettings({
      emaAlpha: alpha,
      tunerMode,
      temperament,
    });
    onClose();
  };

  const handleSeedTunes = () => {
    const message = `This will replace all existing tunes with ${DEFAULT_TUNES.length} default tunes (from Hot Cross Buns to Flight of the Bumblebee). Continue?`;

    if (Platform.OS === "web") {
      if (window.confirm(message)) {
        onSeedTunes?.();
        onClose();
      }
    } else {
      Alert.alert("Seed Default Tunes", message, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Seed Tunes",
          onPress: () => {
            onSeedTunes?.();
            onClose();
          },
        },
      ]);
    }
  };

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

          {/* Seed Default Tunes */}
          <View style={styles.section}>
            <Text style={styles.label}>Tune Library</Text>
            <Text style={styles.hint}>
              Load {DEFAULT_TUNES.length} default tunes (replaces existing)
            </Text>
            <TouchableOpacity
              style={styles.seedButton}
              onPress={handleSeedTunes}
            >
              <Text style={styles.seedButtonText}>Seed Default Tunes</Text>
            </TouchableOpacity>
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

SettingsModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  settings: PropTypes.shape({
    emaAlpha: PropTypes.number,
    tunerMode: PropTypes.oneOf(["needle", "text"]),
    temperament: PropTypes.oneOf(["equal", "just"]),
  }),
  onUpdateSettings: PropTypes.func.isRequired,
  onSeedTunes: PropTypes.func,
};

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
});
