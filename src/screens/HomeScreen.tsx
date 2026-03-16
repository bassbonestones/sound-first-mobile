/**
 * HomeScreen - Main landing screen for the app
 *
 * Features:
 * - Practice button to start a session
 * - Instrument selector for multi-instrument users
 * - Dev navigation via ResetButton component
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import ErrorBoundary from "../components/ErrorBoundary";
import ResetButton from "../components/ResetButton";
import { useUser } from "../context/UserContext";

interface HomeScreenProps {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

// Helper to blur active element before navigation (fixes aria-hidden focus issue on web)
const blurActiveElement = () => {
  if (Platform.OS === "web" && document.activeElement) {
    document.activeElement.blur();
  }
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const {
    instruments,
    selectedInstrument,
    loadInstruments,
    selectInstrument,
    loading,
  } = useUser();
  const [showPicker, setShowPicker] = useState(false);

  // Navigation wrapper that blurs first on web
  const navigateTo = useCallback(
    (screen, params) => {
      blurActiveElement();
      navigation.navigate(screen, params);
    },
    [navigation],
  );

  // Load instruments when screen gets focus (handles navigation back from FirstNote/Onboarding)
  useFocusEffect(
    useCallback(() => {
      loadInstruments();
    }, [loadInstruments]),
  );

  const handleStartPractice = () => {
    // Check if selected instrument needs Day 0
    if (selectedInstrument && !selectedInstrument.day0_completed) {
      navigateTo("FirstNote", {
        userId: 1,
        instrumentId: selectedInstrument.id,
        resonantNote: selectedInstrument.resonant_note,
        instrument: selectedInstrument.instrument_name,
      });
    } else {
      navigateTo("StartPractice", {
        instrumentId: selectedInstrument?.id,
      });
    }
  };

  const handleSelectInstrument = (instrument) => {
    selectInstrument(instrument);
    setShowPicker(false);
  };

  const getInstrumentEmoji = (name) => {
    const lower = (name || "").toLowerCase();
    if (lower.includes("trombone")) return "🎺";
    if (lower.includes("trumpet")) return "🎺";
    if (lower.includes("clarinet")) return "🎵";
    if (lower.includes("flute")) return "🎶";
    if (lower.includes("saxophone") || lower.includes("sax")) return "🎷";
    if (lower.includes("piano")) return "🎹";
    if (lower.includes("violin") || lower.includes("viola")) return "🎻";
    if (lower.includes("guitar")) return "🎸";
    if (lower.includes("drum")) return "🥁";
    return "🎵";
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* App Logo/Title */}
          <View style={styles.header}>
            <Text style={styles.logo}>
              {getInstrumentEmoji(selectedInstrument?.instrument_name)}
            </Text>
            <Text style={styles.title}>Sound First</Text>
            <Text style={styles.subtitle}>Ear-First Music Practice</Text>
          </View>

          {/* Instrument Selector */}
          {instruments.length > 0 ? (
            <TouchableOpacity
              style={styles.instrumentSelector}
              onPress={() => setShowPicker(true)}
              accessibilityLabel={`Select instrument. Currently: ${selectedInstrument?.instrument_name || "none selected"}`}
              accessibilityHint="Opens instrument picker"
              accessibilityRole="button"
            >
              <Text style={styles.instrumentLabel}>Practicing:</Text>
              <View style={styles.instrumentValue}>
                <Text style={styles.instrumentName}>
                  {selectedInstrument?.instrument_name || "Select instrument"}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </View>
              {selectedInstrument && !selectedInstrument.day0_completed && (
                <Text style={styles.day0Badge}>Setup needed</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.addFirstInstrument}
              onPress={() => navigateTo("Onboarding")}
              accessibilityLabel="Add your first instrument"
              accessibilityHint="Opens instrument setup"
              accessibilityRole="button"
            >
              <Text style={styles.addFirstInstrumentIcon}>🎵</Text>
              <Text style={styles.addFirstInstrumentText}>
                Add Your Instrument
              </Text>
              <Text style={styles.addFirstInstrumentHint}>
                Get started by selecting your instrument
              </Text>
            </TouchableOpacity>
          )}

          {/* Main Practice Button */}
          <TouchableOpacity
            style={[
              styles.practiceButton,
              (!selectedInstrument || loading) && styles.practiceButtonDisabled,
            ]}
            onPress={handleStartPractice}
            activeOpacity={0.8}
            disabled={!selectedInstrument || loading}
            accessibilityLabel={
              selectedInstrument && !selectedInstrument.day0_completed
                ? "Set up instrument"
                : "Start practice"
            }
            accessibilityHint={
              selectedInstrument && !selectedInstrument.day0_completed
                ? "Begin instrument setup"
                : "Begin practice session"
            }
            accessibilityRole="button"
            accessibilityState={{ disabled: !selectedInstrument || loading }}
          >
            <Text style={styles.practiceButtonIcon}>
              {selectedInstrument && !selectedInstrument.day0_completed
                ? "🎯"
                : "▶️"}
            </Text>
            <Text style={styles.practiceButtonText}>
              {selectedInstrument && !selectedInstrument.day0_completed
                ? "Set Up Instrument"
                : "Start Practice"}
            </Text>
          </TouchableOpacity>

          {/* Quick Stats - placeholder for now */}
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Your Progress</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>-</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>-</Text>
                <Text style={styles.statLabel}>Total Sessions</Text>
              </View>
            </View>
          </View>

          {/* Tune Mastery Tool */}
          <TouchableOpacity
            style={styles.tuneMasteryButton}
            onPress={() => navigateTo("TuneMastery")}
            accessibilityLabel="Tune Mastery tool"
            accessibilityHint="Practice tunes in all 12 keys"
            accessibilityRole="button"
          >
            <Text style={styles.tuneMasteryIcon}>🎸</Text>
            <Text style={styles.tuneMasteryText}>Tune Mastery</Text>
          </TouchableOpacity>
        </View>

        {/* Instrument Picker Modal */}
        <Modal
          visible={showPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowPicker(false)}
          >
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerTitle}>Select Instrument</Text>
              <FlatList
                data={instruments}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      selectedInstrument?.id === item.id &&
                        styles.pickerItemSelected,
                    ]}
                    onPress={() => handleSelectInstrument(item)}
                  >
                    <Text style={styles.pickerItemEmoji}>
                      {getInstrumentEmoji(item.instrument_name)}
                    </Text>
                    <View style={styles.pickerItemInfo}>
                      <Text style={styles.pickerItemName}>
                        {item.instrument_name}
                      </Text>
                      {!item.day0_completed && (
                        <Text style={styles.setupBadge}>Needs setup</Text>
                      )}
                    </View>
                    {selectedInstrument?.id === item.id && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={styles.addInstrumentButton}
                onPress={() => {
                  setShowPicker(false);
                  navigateTo("Onboarding", { addingInstrument: true });
                }}
              >
                <Text style={styles.addInstrumentText}>
                  + Add New Instrument
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        <ResetButton />
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  // Header
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFD700",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    marginTop: 8,
  },

  // Practice Button
  practiceButton: {
    backgroundColor: "#FFD700",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 48,
    borderRadius: 16,
    marginBottom: 32,
    ...Platform.select({
      web: { boxShadow: "0px 4px 8px rgba(255, 215, 0, 0.3)" },
      default: {
        shadowColor: "#FFD700",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
  },
  practiceButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  practiceButtonText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a1a2e",
  },

  // Stats Card
  statsCard: {
    backgroundColor: "#2a2a3e",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    marginBottom: 32,
  },
  statsTitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFD700",
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#444",
  },

  // Tune Mastery Button
  tuneMasteryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2a2a3e",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  tuneMasteryIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  tuneMasteryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFD700",
  },

  // Practice Button Disabled
  practiceButtonDisabled: {
    opacity: 0.5,
  },

  // Instrument Selector
  instrumentSelector: {
    backgroundColor: "#2a2a3e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: "100%",
    alignItems: "center",
  },
  instrumentLabel: {
    fontSize: 12,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  instrumentValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  instrumentName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#888",
    marginLeft: 8,
  },
  day0Badge: {
    fontSize: 11,
    color: "#FFD700",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    overflow: "hidden",
  },

  // Modal / Picker
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContainer: {
    backgroundColor: "#2a2a3e",
    borderRadius: 16,
    width: "85%",
    maxHeight: "70%",
    padding: 20,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#1a1a2e",
  },
  pickerItemSelected: {
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  pickerItemEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  pickerItemInfo: {
    flex: 1,
  },
  pickerItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  primaryBadge: {
    fontSize: 10,
    color: "#4CAF50",
    marginTop: 4,
  },
  setupBadge: {
    fontSize: 10,
    color: "#FFD700",
    marginTop: 4,
  },
  checkmark: {
    fontSize: 20,
    color: "#FFD700",
  },
  addInstrumentButton: {
    borderTopWidth: 1,
    borderTopColor: "#444",
    paddingTop: 16,
    marginTop: 8,
    alignItems: "center",
  },
  addInstrumentText: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "600",
  },

  // Add First Instrument (when no instruments exist)
  addFirstInstrument: {
    backgroundColor: "#2a2a3e",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    width: "100%",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFD700",
    borderStyle: "dashed",
  },
  addFirstInstrumentIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  addFirstInstrumentText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 8,
  },
  addFirstInstrumentHint: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
});
