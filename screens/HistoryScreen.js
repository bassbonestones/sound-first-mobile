import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";

function getBackendUrl(endpoint) {
  const LOCAL_IP = "192.168.1.19";
  return `http://${LOCAL_IP}:8000/${endpoint}`;
}

export default function HistoryScreen() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(getBackendUrl("practice-attempts?user_id=1"))
      .then((r) => r.json())
      .then((data) => {
        setAttempts(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: "#1a1410",
        padding: 32,
      }}
    >
      <Text
        style={{
          fontSize: 32,
          fontWeight: "bold",
          color: "#FFD700",
          marginBottom: 20,
          fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
        }}
      >
        Practice History
      </Text>
      <FlatList
        data={attempts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#3b2c1a",
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 2,
              borderColor: "#FFD700",
            }}
          >
            <Text
              style={{ color: "#FFD700", fontWeight: "bold", fontSize: 18 }}
            >
              Material:{" "}
              <Text style={{ color: "#fffbe6" }}>{item.material_id}</Text>
            </Text>
            <Text
              style={{ color: "#FFD700", fontWeight: "bold", fontSize: 16 }}
            >
              Focus Card:{" "}
              <Text style={{ color: "#fffbe6" }}>{item.focus_card_id}</Text>
            </Text>
            <Text style={{ color: "#FFD700" }}>
              Rating: <Text style={{ color: "#fffbe6" }}>{item.rating}</Text>
            </Text>
            <Text style={{ color: "#FFD700" }}>
              Fatigue: <Text style={{ color: "#fffbe6" }}>{item.fatigue}</Text>
            </Text>
            <Text style={{ color: "#FFD700" }}>
              Date: <Text style={{ color: "#fffbe6" }}>{item.timestamp}</Text>
            </Text>
          </View>
        )}
      />
    </ScrollView>
  );
}
