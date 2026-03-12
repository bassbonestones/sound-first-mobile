import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  View,
  Text,
  Picker,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from "react-native";
import ResetButton from "../components/ResetButton";
import { baseUrl } from "../api/client";
import { createShadow } from "../styles/theme";

export default function SelfDirectedScreen({ navigation }) {
  const [materials, setMaterials] = useState([]);
  const [focusCards, setFocusCards] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [selectedFocusCard, setSelectedFocusCard] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${baseUrl}/materials`).then((r) => r.json()),
      fetch(`${baseUrl}/focus-cards`).then((r) => r.json()),
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

  if (loading) return <ActivityIndicator size="large" style={styles.loading} />;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Self-Directed Practice</Text>

        <Text style={styles.label}>Select Material:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedMaterial}
            style={styles.picker}
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

        <Text style={styles.label}>Select Focus Card:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedFocusCard}
            style={styles.picker}
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

        <Text style={styles.label}>Goal:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={goal}
            style={styles.picker}
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
          accessibilityLabel="Start self-directed session"
          accessibilityRole="button"
          onPress={handleStart}
          style={[styles.startButton, createShadow("#000", 0, 4, 0.2, 8)]}
        >
          <Text style={styles.startButtonText}>
            Start Self-Directed Session
          </Text>
        </TouchableOpacity>
      </ScrollView>
      <ResetButton />
    </View>
  );
}

SelfDirectedScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1410",
  },
  loading: {
    flex: 1,
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
  label: {
    color: "#fffbe6",
    fontSize: 18,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  pickerContainer: {
    backgroundColor: "#3b2c1a",
    borderRadius: 12,
    marginBottom: 20,
    width: 240,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  picker: {
    height: 50,
    color: "#FFD700",
  },
  startButton: {
    backgroundColor: "#FFD700",
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginTop: 12,
  },
  startButtonText: {
    color: "#3b2c1a",
    fontWeight: "bold",
    fontSize: 20,
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
  },
});
