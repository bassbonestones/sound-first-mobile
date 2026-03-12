/**
 * SelectionPanel - Tune/Key dropdowns and Go button
 */
import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from "react-native";
import { ALL_KEYS } from "../../../hooks/useTuneMasteryData";

export default function SelectionPanel({
  tunes,
  selectedTuneId,
  selectedKey,
  onSelectTune,
  onSelectKey,
  onGo,
  isLearningPick,
}) {
  const [showTunePicker, setShowTunePicker] = useState(false);
  const [showKeyPicker, setShowKeyPicker] = useState(false);

  const selectedTune = tunes.find((t) => t.id === selectedTuneId);

  const tuneOptions = [{ id: null, name: "Engine Select" }, ...tunes];

  const keyOptions = [
    { key: null, label: "Engine Select" },
    ...ALL_KEYS.map((k) => ({ key: k, label: k })),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Tune Selector */}
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>Tune</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowTunePicker(true)}
            accessibilityLabel={`Select tune. Current: ${selectedTune?.name || "Engine Select"}`}
            accessibilityRole="button"
          >
            <Text style={styles.selectorText} numberOfLines={1}>
              {selectedTune?.name || "Engine Select"}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Key Selector */}
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>Key</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowKeyPicker(true)}
            accessibilityLabel={`Select key. Current: ${selectedKey || "Engine Select"}`}
            accessibilityRole="button"
          >
            <Text style={styles.selectorText}>
              {selectedKey || "Engine Select"}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pick Type Indicator */}
      <Text style={styles.pickTypeIndicator}>
        Next: {isLearningPick ? "Learning" : "Reinforcement"} pick
      </Text>

      {/* Go Button */}
      <TouchableOpacity
        style={[styles.goButton, tunes.length === 0 && styles.goButtonDisabled]}
        onPress={onGo}
        disabled={tunes.length === 0}
        accessibilityLabel="Start practice"
        accessibilityRole="button"
      >
        <Text style={styles.goButtonIcon}>▶</Text>
        <Text style={styles.goButtonText}>Go</Text>
      </TouchableOpacity>

      {/* Tune Picker Modal */}
      <Modal
        visible={showTunePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTunePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTunePicker(false)}
        >
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Select Tune</Text>
            <FlatList
              data={tuneOptions}
              keyExtractor={(item) => item.id || "engine"}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    selectedTuneId === item.id && styles.pickerItemSelected,
                  ]}
                  onPress={() => {
                    onSelectTune(item.id);
                    setShowTunePicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{item.name}</Text>
                  {selectedTuneId === item.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              style={styles.pickerList}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Key Picker Modal */}
      <Modal
        visible={showKeyPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowKeyPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowKeyPicker(false)}
        >
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Select Key</Text>
            <FlatList
              data={keyOptions}
              keyExtractor={(item) => item.key || "engine"}
              numColumns={4}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.keyPickerItem,
                    selectedKey === item.key && styles.keyPickerItemSelected,
                  ]}
                  onPress={() => {
                    onSelectKey(item.key);
                    setShowKeyPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.keyPickerItemText,
                      selectedKey === item.key &&
                        styles.keyPickerItemTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.keyPickerGrid}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

SelectionPanel.propTypes = {
  tunes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  selectedTuneId: PropTypes.string,
  selectedKey: PropTypes.string,
  onSelectTune: PropTypes.func.isRequired,
  onSelectKey: PropTypes.func.isRequired,
  onGo: PropTypes.func.isRequired,
  isLearningPick: PropTypes.bool.isRequired,
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#2a2a3e",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#444",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  selectorContainer: {
    flex: 1,
  },
  selectorLabel: {
    color: "#888",
    fontSize: 11,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  selector: {
    backgroundColor: "#3a3a4e",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorText: {
    color: "#FFFFFF",
    fontSize: 14,
    flex: 1,
  },
  dropdownArrow: {
    color: "#888",
    fontSize: 10,
    marginLeft: 8,
  },
  pickTypeIndicator: {
    color: "#666",
    fontSize: 11,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  goButton: {
    backgroundColor: "#FFD700",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 8,
  },
  goButtonDisabled: {
    opacity: 0.5,
  },
  goButtonIcon: {
    fontSize: 16,
    color: "#1a1a2e",
  },
  goButtonText: {
    color: "#1a1a2e",
    fontSize: 18,
    fontWeight: "bold",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  pickerContainer: {
    backgroundColor: "#2a2a3e",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    maxWidth: 400,
    maxHeight: "60%",
  },
  pickerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  pickerList: {
    maxHeight: 300,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  pickerItemSelected: {
    backgroundColor: "#3a3a4e",
  },
  pickerItemText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  checkmark: {
    color: "#FFD700",
    fontSize: 18,
  },

  // Key picker
  keyPickerGrid: {
    alignItems: "center",
  },
  keyPickerItem: {
    width: 70,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    margin: 4,
    backgroundColor: "#3a3a4e",
  },
  keyPickerItemSelected: {
    backgroundColor: "#FFD700",
  },
  keyPickerItemText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  keyPickerItemTextSelected: {
    color: "#1a1a2e",
    fontWeight: "bold",
  },
});
