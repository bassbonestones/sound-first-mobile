import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  Picker,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import ResetButton from "../components/ResetButton";

function getBackendUrl(endpoint) {
  const LOCAL_IP = "192.168.1.19";
  if (Platform.OS === "android") {
    return `http://10.0.2.2:8000/${endpoint}`;
  } else if (Platform.OS === "ios") {
    return `http://${LOCAL_IP}:8000/${endpoint}`;
  } else {
    return `http://${LOCAL_IP}:8000/${endpoint}`;
  }
}

export default function SelfDirectedScreen({ navigation }) {
  const [materials, setMaterials] = useState([]);
  const [focusCards, setFocusCards] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [selectedFocusCard, setSelectedFocusCard] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(getBackendUrl("materials")).then((r) => r.json()),
      fetch(getBackendUrl("focus-cards")).then((r) => r.json()),
    ]).then(([mats, fcs]) => {
      setMaterials(mats);
      setFocusCards(fcs);
      setLoading(false);
    });
  }, []);

  const handleStart = () => {
    if (!selectedMaterial || !selectedFocusCard || !goal) {
      Alert.alert("Please select all fields");
      return;
    }
    navigation.navigate("Session", {
      selfDirected: true,
      material_id: selectedMaterial,
      focus_card_id: selectedFocusCard,
      goal,
    });
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1410" }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
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
          Self-Directed Practice
        </Text>
        <Text
          style={{
            color: "#fffbe6",
            fontSize: 18,
            marginBottom: 10,
            alignSelf: "flex-start",
          }}
        >
          Select Material:
        </Text>
        <View
          style={{
            backgroundColor: "#3b2c1a",
            borderRadius: 12,
            marginBottom: 20,
            width: 240,
            borderWidth: 2,
            borderColor: "#FFD700",
          }}
        >
          <Picker
            selectedValue={selectedMaterial}
            style={{ height: 50, color: "#FFD700" }}
            onValueChange={setSelectedMaterial}
          >
            <Picker.Item label="Select..." value="" color="#888" />
            {materials.map((mat) => (
              <Picker.Item
                key={mat.id}
                label={mat.title}
                value={mat.id}
                color="#fff"
              />
            ))}
          </Picker>
        </View>
        <Text
          style={{
            color: "#fffbe6",
            fontSize: 18,
            marginBottom: 10,
            alignSelf: "flex-start",
          }}
        >
          Select Focus Card:
        </Text>
        <View
          style={{
            backgroundColor: "#3b2c1a",
            borderRadius: 12,
            marginBottom: 20,
            width: 240,
            borderWidth: 2,
            borderColor: "#FFD700",
          }}
        >
          <Picker
            selectedValue={selectedFocusCard}
            style={{ height: 50, color: "#FFD700" }}
            onValueChange={setSelectedFocusCard}
          >
            <Picker.Item label="Select..." value="" color="#888" />
            {focusCards.map((fc) => (
              <Picker.Item
                key={fc.id}
                label={fc.name}
                value={fc.id}
                color="#fff"
              />
            ))}
          </Picker>
        </View>
        <Text
          style={{
            color: "#fffbe6",
            fontSize: 18,
            marginBottom: 10,
            alignSelf: "flex-start",
          }}
        >
          Goal:
        </Text>
        <View
          style={{
            backgroundColor: "#3b2c1a",
            borderRadius: 12,
            marginBottom: 20,
            width: 240,
            borderWidth: 2,
            borderColor: "#FFD700",
          }}
        >
          <Picker
            selectedValue={goal}
            style={{ height: 50, color: "#FFD700" }}
            onValueChange={setGoal}
          >
            <Picker.Item label="Select..." value="" color="#888" />
            <Picker.Item
              label="Repertoire Fluency"
              value="repertoire_fluency"
              color="#fff"
            />
            <Picker.Item
              label="Range Expansion"
              value="range_expansion"
              color="#fff"
            />
            <Picker.Item
              label="Articulation Development"
              value="articulation_development"
              color="#fff"
            />
          </Picker>
        </View>
        <TouchableOpacity
          onPress={handleStart}
          style={{
            backgroundColor: "#FFD700",
            borderRadius: 28,
            paddingVertical: 16,
            paddingHorizontal: 48,
            marginTop: 12,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <Text
            style={{
              color: "#3b2c1a",
              fontWeight: "bold",
              fontSize: 20,
              fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
            }}
          >
            Start Self-Directed Session
          </Text>
        </TouchableOpacity>
      </ScrollView>
      <ResetButton />
    </View>
  );
}
