/**
 * TuningSettingsButton - Shared tuning settings UI component
 *
 * Displays a summary button showing current tuning settings (temperament, key, A=, m7)
 * and opens a modal for editing those settings.
 *
 * Used by both Tuner and PitchDrone components.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  StyleSheet,
  ViewStyle,
} from "react-native";

// ============================================================================
// Types & Constants (exported for use by parent components)
// ============================================================================

export type Temperament = "equal" | "just";
export type Minor7System = "classical" | "pythagorean" | "harmonic";

export const MINOR_7TH_RATIOS: Record<Minor7System, number> = {
  classical: 9 / 5, // ~1018 cents, +18 vs ET - Classical harmony
  pythagorean: 16 / 9, // ~996 cents, +4 vs ET - Modal/melodic
  harmonic: 7 / 4, // ~969 cents, -31 vs ET - Dominant 7 chords (natural harmonic series)
};

export const MINOR_7TH_LABELS: Record<Minor7System, string> = {
  classical: "9:5",
  pythagorean: "16:9",
  harmonic: "7:4",
};

// Key display names for the 12 chromatic notes
export const KEY_DISPLAY_NAMES = [
  "C",
  "C♯/D♭",
  "D",
  "D♯/E♭",
  "E",
  "F",
  "F♯/G♭",
  "G",
  "G♯/A♭",
  "A",
  "A♯/B♭",
  "B",
];

// ============================================================================
// Props Interface
// ============================================================================

export interface TuningSettingsButtonProps {
  // Current values
  temperament: Temperament;
  concertA: string;
  keyIndex: number;
  minor7System: Minor7System;

  // Change handlers
  onTemperamentChange: (temperament: Temperament) => void;
  onConcertAChange: (value: string) => void;
  onKeyIndexChange: (index: number) => void;
  onMinor7SystemChange: (system: Minor7System) => void;

  // Optional styling
  style?: ViewStyle;
}

// ============================================================================
// Component
// ============================================================================

export default function TuningSettingsButton({
  temperament,
  concertA,
  keyIndex,
  minor7System,
  onTemperamentChange,
  onConcertAChange,
  onKeyIndexChange,
  onMinor7SystemChange,
  style,
}: TuningSettingsButtonProps): React.ReactElement {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* Summary Button */}
      <TouchableOpacity
        style={[styles.settingsSummaryButton, style]}
        onPress={() => setShowModal(true)}
        accessibilityLabel="Open tuning settings"
        accessibilityRole="button"
      >
        <View style={styles.settingsSummaryMetrics}>
          {temperament === "equal" ? (
            <>
              <Text style={styles.settingsSummaryMetric}>ET</Text>
              <Text style={styles.settingsSummaryMetric}>A={concertA}Hz</Text>
            </>
          ) : (
            <>
              <Text style={styles.settingsSummaryMetric}>JI</Text>
              <Text style={styles.settingsSummaryMetric}>
                {KEY_DISPLAY_NAMES[keyIndex]}
              </Text>
              <Text style={styles.settingsSummaryMetric}>A={concertA}Hz</Text>
              <Text style={styles.settingsSummaryMetric}>
                m7: {MINOR_7TH_LABELS[minor7System]}
              </Text>
            </>
          )}
        </View>
        <Text style={styles.settingsSummaryIcon}>⚙️</Text>
      </TouchableOpacity>

      {/* Settings Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tuning Settings</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.modalCloseButton}
                accessibilityLabel="Close settings"
              >
                <Text style={styles.modalCloseText}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              {/* Temperament */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Temperament</Text>
                <View style={styles.temperamentToggle}>
                  <TouchableOpacity
                    onPress={() => onTemperamentChange("equal")}
                    style={[
                      styles.temperamentButtonLeft,
                      temperament === "equal"
                        ? styles.temperamentButtonActive
                        : styles.temperamentButtonInactive,
                    ]}
                    accessibilityLabel={`Standard equal temperament${temperament === "equal" ? ", selected" : ""}`}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.temperamentButtonText,
                        temperament === "equal"
                          ? styles.temperamentButtonTextActive
                          : styles.temperamentButtonTextInactive,
                      ]}
                    >
                      Standard (ET)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onTemperamentChange("just")}
                    style={[
                      styles.temperamentButtonRight,
                      temperament === "just"
                        ? styles.temperamentButtonActive
                        : styles.temperamentButtonInactive,
                    ]}
                    accessibilityLabel={`Resonance just intonation${temperament === "just" ? ", selected" : ""}`}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.temperamentButtonText,
                        temperament === "just"
                          ? styles.temperamentButtonTextActive
                          : styles.temperamentButtonTextInactive,
                      ]}
                    >
                      Resonance (JI)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Concert A */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Concert Pitch</Text>
                <View style={styles.concertARow}>
                  <Text style={styles.concertALabel}>A =</Text>
                  <TextInput
                    value={concertA}
                    onChangeText={onConcertAChange}
                    keyboardType="numeric"
                    style={styles.concertAInput}
                    placeholder="440"
                    placeholderTextColor="#666"
                    accessibilityLabel="Concert A frequency"
                  />
                  <Text style={styles.concertAUnit}>Hz</Text>
                </View>
              </View>

              {/* Key Selector (JI only) */}
              {temperament === "just" && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Key Center</Text>
                  <View style={styles.keyGrid}>
                    {[0, 1, 2].map((row) => (
                      <View key={row} style={styles.keyRow}>
                        {KEY_DISPLAY_NAMES.slice(row * 4, row * 4 + 4).map(
                          (keyName, colIndex) => {
                            const index = row * 4 + colIndex;
                            return (
                              <TouchableOpacity
                                key={keyName}
                                style={[
                                  styles.keyOption,
                                  keyIndex === index && styles.keyOptionActive,
                                ]}
                                onPress={() => onKeyIndexChange(index)}
                                accessibilityLabel={`Key of ${keyName}`}
                                accessibilityRole="button"
                              >
                                <Text
                                  style={[
                                    styles.keyOptionText,
                                    keyIndex === index &&
                                      styles.keyOptionTextActive,
                                  ]}
                                >
                                  {keyName}
                                </Text>
                              </TouchableOpacity>
                            );
                          },
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Minor 7th (JI only) */}
              {temperament === "just" && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Minor 7th Ratio</Text>
                  <View style={styles.m7SystemToggle}>
                    <TouchableOpacity
                      onPress={() => onMinor7SystemChange("classical")}
                      style={[
                        styles.m7ButtonLeft,
                        minor7System === "classical"
                          ? styles.m7ButtonActive
                          : styles.m7ButtonInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.m7ButtonText,
                          minor7System === "classical"
                            ? styles.m7ButtonTextActive
                            : styles.m7ButtonTextInactive,
                        ]}
                      >
                        9:5
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onMinor7SystemChange("pythagorean")}
                      style={[
                        styles.m7ButtonMiddle,
                        minor7System === "pythagorean"
                          ? styles.m7ButtonActive
                          : styles.m7ButtonInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.m7ButtonText,
                          minor7System === "pythagorean"
                            ? styles.m7ButtonTextActive
                            : styles.m7ButtonTextInactive,
                        ]}
                      >
                        16:9
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onMinor7SystemChange("harmonic")}
                      style={[
                        styles.m7ButtonRight,
                        minor7System === "harmonic"
                          ? styles.m7ButtonActive
                          : styles.m7ButtonInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.m7ButtonText,
                          minor7System === "harmonic"
                            ? styles.m7ButtonTextActive
                            : styles.m7ButtonTextInactive,
                        ]}
                      >
                        7:4
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  // Settings Summary Button
  settingsSummaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(156, 39, 176, 0.15)",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(156, 39, 176, 0.3)",
  },
  settingsSummaryMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    flex: 1,
    gap: 4,
  },
  settingsSummaryMetric: {
    color: "#E1BEE7",
    fontSize: 13,
    fontWeight: "500",
    backgroundColor: "rgba(156, 39, 176, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  settingsSummaryIcon: {
    fontSize: 16,
    marginLeft: 8,
  },

  // Settings Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1a1a2e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  modalCloseButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#9C27B0",
    borderRadius: 6,
  },
  modalCloseText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  modalBody: {
    padding: 16,
    alignItems: "center",
  },
  modalSection: {
    marginBottom: 24,
    alignItems: "center",
    width: "100%",
  },
  modalSectionTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },

  // Temperament Toggle
  temperamentToggle: {
    flexDirection: "row",
  },
  temperamentButtonLeft: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderWidth: 1,
    borderColor: "#9C27B0",
  },
  temperamentButtonRight: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: "#9C27B0",
  },
  temperamentButtonActive: {
    backgroundColor: "#9C27B0",
  },
  temperamentButtonInactive: {
    backgroundColor: "#2d232e",
  },
  temperamentButtonText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  temperamentButtonTextActive: {
    color: "#fff",
  },
  temperamentButtonTextInactive: {
    color: "#9C27B0",
  },

  // Concert A Input
  concertARow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  concertALabel: {
    color: "#bfa76a",
    fontSize: 12,
    marginRight: 4,
  },
  concertAInput: {
    backgroundColor: "#2d232e",
    color: "#FFD700",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    width: 60,
    textAlign: "center",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#444",
  },
  concertAUnit: {
    color: "#bfa76a",
    fontSize: 12,
    marginLeft: 4,
  },

  // Key Selector Grid
  keyGrid: {
    alignItems: "center",
    gap: 6,
  },
  keyRow: {
    flexDirection: "row",
    gap: 6,
  },
  keyOption: {
    width: 68,
    height: 32,
    borderRadius: 4,
    backgroundColor: "#2a2a3e",
    alignItems: "center",
    justifyContent: "center",
  },
  keyOptionActive: {
    backgroundColor: "#4CAF50",
  },
  keyOptionText: {
    color: "#888",
    fontSize: 11,
    fontWeight: "600",
  },
  keyOptionTextActive: {
    color: "#FFFFFF",
  },

  // Minor 7th System Toggle (blue themed, 3-part)
  m7SystemToggle: {
    flexDirection: "row",
  },
  m7ButtonLeft: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  m7ButtonMiddle: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: "#2196F3",
  },
  m7ButtonRight: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: "#2196F3",
  },
  m7ButtonActive: {
    backgroundColor: "#2196F3",
  },
  m7ButtonInactive: {
    backgroundColor: "#1a2a3e",
  },
  m7ButtonText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  m7ButtonTextActive: {
    color: "#FFFFFF",
  },
  m7ButtonTextInactive: {
    color: "#2196F3",
  },
});
