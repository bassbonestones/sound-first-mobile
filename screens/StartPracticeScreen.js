import React, { useState } from "react";
import { View, Text, Platform, ScrollView, TouchableOpacity, Modal, Alert } from "react-native";

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
      navigation.navigate("Session", { duration, fatigue, sessionKey: Date.now() });
    }
  };

  const handleFatigue5Choice = (choice) => {
    setShowFatigue5Modal(false);
    switch (choice) {
      case "stop":
        Alert.alert(
          "Rest Up! 💤",
          "Taking a break is the best choice when exhausted. Come back when you're feeling better.",
          [{ text: "OK" }]
        );
        break;
      case "cooldown":
        // Navigate with cooldown mode flag
        navigation.navigate("Session", { 
          duration: Math.min(duration, 15), // Cap at 15 min for cooldown
          fatigue: 5, 
          cooldownMode: true,
          sessionKey: Date.now() 
        });
        break;
      case "ear_only":
        // Navigate with ear-only mode flag
        navigation.navigate("Session", { 
          duration: Math.min(duration, 20), 
          fatigue: 5, 
          earOnlyMode: true,
          sessionKey: Date.now() 
        });
        break;
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1a1410", padding: 32 }}>
      <Text style={{ fontSize: 32, fontWeight: "bold", color: "#FFD700", marginBottom: 20, fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif" }}>
        Sound First Practice
      </Text>
      <Text style={{ color: "#fffbe6", fontSize: 18, marginBottom: 10 }}>Practice Duration (minutes):</Text>
      <View style={{ flexDirection: "row", marginBottom: 20 }}>
        {durations.map((d) => (
          <TouchableOpacity
            key={d}
            onPress={() => setDuration(d)}
            style={{ backgroundColor: duration === d ? "#FFD700" : "#3b2c1a", borderRadius: 16, padding: 12, margin: 6, borderWidth: 2, borderColor: duration === d ? "#FFD700" : "#bfa76a" }}
          >
            <Text style={{ color: duration === d ? "#3b2c1a" : "#FFD700", fontWeight: "bold", fontSize: 18 }}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={{ color: "#fffbe6", fontSize: 18, marginBottom: 10 }}>How fatigued are you?</Text>
      <View style={{ flexDirection: "row", marginBottom: 8 }}>
        {[1, 2, 3, 4, 5].map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => handleFatigueSelect(f)}
            style={{ 
              backgroundColor: fatigue === f ? (f >= 4 ? "#b71c1c" : "#FFD700") : "#3b2c1a", 
              borderRadius: 16, 
              padding: 12, 
              margin: 6, 
              borderWidth: 2, 
              borderColor: fatigue === f ? (f >= 4 ? "#ff6b6b" : "#FFD700") : "#bfa76a",
              minWidth: 48,
              alignItems: "center",
            }}
          >
            <Text style={{ color: fatigue === f ? "#fff" : "#FFD700", fontWeight: "bold", fontSize: 18 }}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Fatigue level indicator */}
      <View style={{ marginBottom: 20, alignItems: "center" }}>
        <Text style={{ color: fatigue >= 4 ? "#ff6b6b" : "#bfa76a", fontSize: 14, fontWeight: "bold" }}>
          {FATIGUE_LABELS[fatigue]}
        </Text>
        <Text style={{ color: "#888", fontSize: 12, marginTop: 2 }}>
          {FATIGUE_HINTS[fatigue]}
        </Text>
      </View>
      
      <TouchableOpacity
        onPress={handleStartPractice}
        style={{ backgroundColor: "#FFD700", borderRadius: 28, paddingVertical: 16, paddingHorizontal: 48, marginTop: 12 }}
      >
        <Text style={{ color: "#3b2c1a", fontWeight: "bold", fontSize: 20 }}>Start Practice</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate("SelfDirected")}
        style={{ backgroundColor: "#bfa76a", borderRadius: 28, paddingVertical: 16, paddingHorizontal: 48, marginTop: 16 }}
      >
        <Text style={{ color: "#fffbe6", fontWeight: "bold", fontSize: 20 }}>Self-Directed Mode</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate("History")}
        style={{ backgroundColor: "#bfa76a", borderRadius: 28, paddingVertical: 16, paddingHorizontal: 48, marginTop: 16 }}
      >
        <Text style={{ color: "#fffbe6", fontWeight: "bold", fontSize: 20 }}>Practice History</Text>
      </TouchableOpacity>

      {/* Fatigue 5 Modal - Exhausted Options */}
      <Modal
        visible={showFatigue5Modal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFatigue5Modal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.85)",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}>
          <View style={{
            backgroundColor: "#2d2020",
            borderRadius: 20,
            padding: 24,
            width: "100%",
            maxWidth: 340,
            borderWidth: 2,
            borderColor: "#ff6b6b",
          }}>
            <Text style={{
              color: "#ff6b6b",
              fontSize: 24,
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: 8,
            }}>
              ⚠️ Exhausted
            </Text>
            <Text style={{
              color: "#fffbe6",
              fontSize: 15,
              textAlign: "center",
              marginBottom: 20,
              lineHeight: 22,
            }}>
              Practicing while exhausted can reinforce bad habits. What would you like to do?
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
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold", textAlign: "center" }}>
                🛑 Stop Completely
              </Text>
              <Text style={{ color: "#ffaaaa", fontSize: 12, textAlign: "center", marginTop: 4 }}>
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
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold", textAlign: "center" }}>
                🌿 Cooldown Mode
              </Text>
              <Text style={{ color: "#aaffaa", fontSize: 12, textAlign: "center", marginTop: 4 }}>
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
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold", textAlign: "center" }}>
                👂 Ear Training Only
              </Text>
              <Text style={{ color: "#aaaaff", fontSize: 12, textAlign: "center", marginTop: 4 }}>
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
                padding: 12,
                marginTop: 4,
              }}
            >
              <Text style={{ color: "#888", fontSize: 14, textAlign: "center" }}>
                Cancel (set fatigue to 4)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
