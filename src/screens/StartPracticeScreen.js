import React, { useState } from "react";
import {
  View,
  Text,
  Platform,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  StyleSheet,
} from "react-native";
import ResetButton from "../components/ResetButton";

// Fatigue level descriptions
const FATIGUE_LABELS = {
  1: "Fresh",
  2: "Good",
  3: "Tired",
  4: "Fatigued",
  5: "Exhausted",
};

const FATIGUE_HINTS = {
  1: "Ready for full practice",
  2: "Normal practice",
  3: "Avoid intense work",
  4: "Light practice only",
  5: "Consider resting",
};

export default function StartPracticeScreen({ navigation }) {
  const [duration, setDuration] = useState(20);
  const [fatigue, setFatigue] = useState(2);
  const [showFatigue5Modal, setShowFatigue5Modal] = useState(false);
  const durations = [10, 20, 30, 45, 60];

  const handleFatigueSelect = (f) => {
    setFatigue(f);
    if (f === 5) {
      setShowFatigue5Modal(true);
    }
  };

  const handleStartPractice = () => {
    if (fatigue === 5) {
      setShowFatigue5Modal(true);
    } else {
      navigation.navigate("Session", {
        duration,
        fatigue,
        sessionKey: Date.now(),
      });
    }
  };

  const handleFatigue5Choice = (choice) => {
    setShowFatigue5Modal(false);
    switch (choice) {
      case "stop":
        Alert.alert(
          "Rest Up! 💤",
          "Taking a break is the best choice when exhausted. Come back when you're feeling better.",
          [{ text: "OK" }],
        );
        break;
      case "cooldown":
        // Navigate with cooldown mode flag
        navigation.navigate("Session", {
          duration: Math.min(duration, 15), // Cap at 15 min for cooldown
          fatigue: 5,
          cooldownMode: true,
          sessionKey: Date.now(),
        });
        break;
      case "ear_only":
        // Navigate with ear-only mode flag
        navigation.navigate("Session", {
          duration: Math.min(duration, 20),
          fatigue: 5,
          earOnlyMode: true,
          sessionKey: Date.now(),
        });
        break;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Sound First Practice</Text>
        <Text style={styles.sectionLabel}>Practice Duration (minutes):</Text>
        <View style={styles.durationContainer}>
          {durations.map((d) => (
            <TouchableOpacity
              key={d}
              onPress={() => setDuration(d)}
              style={[
                styles.durationButton,
                duration === d ? styles.durationButtonSelected : null,
              ]}
            >
              <Text
                style={[
                  styles.durationText,
                  duration === d ? styles.durationTextSelected : null,
                ]}
              >
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>How fatigued are you?</Text>
        <View style={styles.fatigueContainer}>
          {[1, 2, 3, 4, 5].map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => handleFatigueSelect(f)}
              style={[
                styles.fatigueButton,
                {
                  backgroundColor:
                    fatigue === f
                      ? f >= 4
                        ? "#b71c1c"
                        : "#FFD700"
                      : "#3b2c1a",
                  borderColor:
                    fatigue === f
                      ? f >= 4
                        ? "#ff6b6b"
                        : "#FFD700"
                      : "#bfa76a",
                },
              ]}
            >
              <Text
                style={[
                  styles.fatigueNumber,
                  { color: fatigue === f ? "#fff" : "#FFD700" },
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fatigue level indicator */}
        <View style={styles.fatigueIndicator}>
          <Text
            style={[
              styles.fatigueStatus,
              { color: fatigue >= 4 ? "#ff6b6b" : "#bfa76a" },
            ]}
          >
            {FATIGUE_LABELS[fatigue]}
          </Text>
          <Text style={styles.fatigueHint}>{FATIGUE_HINTS[fatigue]}</Text>
        </View>

        {/* Fatigue 5 Modal - Exhausted Options */}
        <Modal
          visible={showFatigue5Modal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFatigue5Modal(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.85)",
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
            }}
          >
            <View
              style={{
                backgroundColor: "#2d2020",
                borderRadius: 20,
                padding: 24,
                width: "100%",
                maxWidth: 340,
                borderWidth: 2,
                borderColor: "#ff6b6b",
              }}
            >
              <Text
                style={{
                  color: "#ff6b6b",
                  fontSize: 24,
                  fontWeight: "bold",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                ⚠️ Exhausted
              </Text>
              <Text
                style={{
                  color: "#fffbe6",
                  fontSize: 15,
                  textAlign: "center",
                  marginBottom: 20,
                  lineHeight: 22,
                }}
              >
                Practicing while exhausted can reinforce bad habits. What would
                you like to do?
              </Text>

              {/* Option 1: Stop */}
              <TouchableOpacity
                onPress={() => handleFatigue5Choice("stop")}
                style={{
                  backgroundColor: "#4a1c1c",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#ff6b6b",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  🛑 Stop Completely
                </Text>
                <Text
                  style={{
                    color: "#ffaaaa",
                    fontSize: 12,
                    textAlign: "center",
                    marginTop: 4,
                  }}
                >
                  Rest is the best choice right now
                </Text>
              </TouchableOpacity>

              {/* Option 2: Cooldown */}
              <TouchableOpacity
                onPress={() => handleFatigue5Choice("cooldown")}
                style={{
                  backgroundColor: "#2d3d2d",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#6b8b6b",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  🌿 Cooldown Mode
                </Text>
                <Text
                  style={{
                    color: "#aaffaa",
                    fontSize: 12,
                    textAlign: "center",
                    marginTop: 4,
                  }}
                >
                  Very light playing, breathing exercises
                </Text>
              </TouchableOpacity>

              {/* Option 3: Ear Training */}
              <TouchableOpacity
                onPress={() => handleFatigue5Choice("ear_only")}
                style={{
                  backgroundColor: "#2d2d4d",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#6b6bbb",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  👂 Ear Training Only
                </Text>
                <Text
                  style={{
                    color: "#aaaaff",
                    fontSize: 12,
                    textAlign: "center",
                    marginTop: 4,
                  }}
                >
                  Listen and sing - no instrument
                </Text>
              </TouchableOpacity>

              {/* Cancel */}
              <TouchableOpacity
                onPress={() => {
                  setShowFatigue5Modal(false);
                  setFatigue(4); // Reset to fatigue 4 if they cancel
                }}
                style={{
                  backgroundColor: "#3d3d3d",
                  borderRadius: 12,
                  padding: 16,
                  marginTop: 4,
                  borderWidth: 1,
                  borderColor: "#666",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  ↩️ Cancel (set fatigue to 4)
                </Text>
                <Text
                  style={{
                    color: "#aaa",
                    fontSize: 12,
                    textAlign: "center",
                    marginTop: 4,
                  }}
                >
                  Go back and adjust settings
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>

      {/* Fixed bottom buttons */}
      <View
        style={{
          backgroundColor: "#1a1410",
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 24,
          borderTopWidth: 1,
          borderTopColor: "#3b2c1a",
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate("History")}
          style={{
            backgroundColor: "#3b2c1a",
            borderRadius: 28,
            paddingVertical: 14,
            paddingHorizontal: 48,
            marginBottom: 10,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#bfa76a",
          }}
        >
          <Text style={{ color: "#bfa76a", fontWeight: "bold", fontSize: 18 }}>
            Practice History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("SelfDirected")}
          style={{
            backgroundColor: "#3b2c1a",
            borderRadius: 28,
            paddingVertical: 14,
            paddingHorizontal: 48,
            marginBottom: 10,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#bfa76a",
          }}
        >
          <Text style={{ color: "#bfa76a", fontWeight: "bold", fontSize: 18 }}>
            Self-Directed Mode
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleStartPractice}
          style={{
            backgroundColor: "#4ADE80",
            borderRadius: 28,
            paddingVertical: 16,
            paddingHorizontal: 48,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#1a1410", fontWeight: "bold", fontSize: 20 }}>
            Start Practice
          </Text>
        </TouchableOpacity>
      </View>

      <ResetButton />
    </View>
  );
}

const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: "#1a1410",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1410",
    padding: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 20,
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
  },
  sectionLabel: {
    color: "#fffbe6",
    fontSize: 18,
    marginBottom: 10,
  },

  // Section styles
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  sectionSubtitle: {
    color: "#bfa76a",
    fontSize: 14,
    marginTop: -8,
    marginBottom: 12,
  },

  // Duration picker styles
  durationContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  durationButton: {
    backgroundColor: "#3b2c1a",
    borderRadius: 16,
    padding: 12,
    margin: 6,
    borderWidth: 2,
    borderColor: "#bfa76a",
  },
  durationButtonSelected: {
    backgroundColor: "#FFD700",
    borderColor: "#FFD700",
  },
  durationText: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: 18,
  },
  durationTextSelected: {
    color: "#3b2c1a",
  },

  // Fatigue picker styles
  fatigueContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  fatigueButton: {
    borderRadius: 16,
    padding: 12,
    margin: 6,
    borderWidth: 2,
    minWidth: 48,
    alignItems: "center",
  },
  fatigueNumber: {
    fontWeight: "bold",
    fontSize: 18,
  },

  // Fatigue indicator
  fatigueIndicator: {
    marginBottom: 20,
    alignItems: "center",
  },
  fatigueStatus: {
    fontSize: 14,
    fontWeight: "bold",
  },
  fatigueHint: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },
  fatigueButtonSelected: {
    backgroundColor: "#3b2c1a",
    borderColor: "#FFD700",
  },
  fatigueNumber: {
    fontSize: 20,
    fontWeight: "bold",
  },
  fatigueNumberSelected: {
    color: "#FFD700",
  },
  fatigueNumberUnselected: {
    color: "#bfa76a",
  },
  fatigueLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  fatigueLabelSelected: {
    color: "#FFD700",
  },
  fatigueLabelUnselected: {
    color: "#888",
  },

  // Fatigue status card
  fatigueCard: {
    backgroundColor: "#2d2015",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#3b2c1a",
  },
  fatigueStatus: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
  },
  fatigueHint: {
    color: "#888",
    fontSize: 14,
    marginTop: 4,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#2d2d2d",
    borderRadius: 16,
    padding: 24,
    margin: 24,
    maxWidth: 400,
    width: "90%",
    borderWidth: 1,
    borderColor: "#444",
  },
  modalTitle: {
    color: "#FFD700",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  modalSubtitle: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  modalOption: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  modalOptionStop: {
    backgroundColor: "#3d2d2d",
    borderColor: "#bb6b6b",
  },
  modalOptionReview: {
    backgroundColor: "#2d3d2d",
    borderColor: "#6bbb6b",
  },
  modalOptionEar: {
    backgroundColor: "#2d2d4d",
    borderColor: "#6b6bbb",
  },
  modalOptionCancel: {
    backgroundColor: "#3d3d3d",
    borderColor: "#666",
    marginTop: 4,
  },
  modalOptionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  modalOptionSubtitle: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },

  // Bottom buttons
  bottomButtons: {
    backgroundColor: "#1a1410",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#3b2c1a",
  },
  secondaryButton: {
    backgroundColor: "#3b2c1a",
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 48,
    marginBottom: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#bfa76a",
  },
  secondaryButtonText: {
    color: "#bfa76a",
    fontWeight: "bold",
    fontSize: 18,
  },
  primaryButton: {
    backgroundColor: "#4ADE80",
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#1a1410",
    fontWeight: "bold",
    fontSize: 20,
  },
});
