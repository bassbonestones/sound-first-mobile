import React, { useState } from "react";
import { View, Text, Platform, ScrollView, TouchableOpacity } from "react-native";

export default function StartPracticeScreen({ navigation }) {
  const [duration, setDuration] = useState(20);
  const [fatigue, setFatigue] = useState(2);
  const durations = [10, 20, 30, 45, 60];
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
      <View style={{ flexDirection: "row", marginBottom: 20 }}>
        {[1, 2, 3, 4, 5].map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFatigue(f)}
            style={{ backgroundColor: fatigue === f ? "#FFD700" : "#3b2c1a", borderRadius: 16, padding: 12, margin: 6, borderWidth: 2, borderColor: fatigue === f ? "#FFD700" : "#bfa76a" }}
          >
            <Text style={{ color: fatigue === f ? "#3b2c1a" : "#FFD700", fontWeight: "bold", fontSize: 18 }}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        onPress={() => {
          // Add a unique key to force remount
          navigation.navigate("Session", { duration, fatigue, sessionKey: Date.now() });
        }}
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
    </ScrollView>
  );
}
