import React, { useState } from "react";
import { View, Text, TextInput, Alert, ScrollView, TouchableOpacity, Platform } from "react-native";
import DropDownPicker from 'react-native-dropdown-picker';

const instruments = [
  "Piano",
  "Violin",
  "Flute",
  "Trumpet",
  "Tenor Trombone",
  "Bass Trombone",
  "Voice",
  "Other"
];

const capabilityList = [
  "Treble Clef",
  "Bass Clef",
  "Quarter Note",
  "Triplets",
  "Staccato Symbol",
  "Fermata Symbol",
];

function getBackendUrl() {
  // Set to your actual local IP address
  const LOCAL_IP = "192.168.1.118";
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000";
  } else if (Platform.OS === "ios") {
    return `http://${LOCAL_IP}:8000`;
  } else if (Platform.OS === "web") {
    return `http://${window.location.hostname}:8000`;
  }
  return `http://${LOCAL_IP}:8000`;
}

function OnboardingScreen({ navigation }) {
  const [instrument, setInstrument] = useState("");
  const [open, setOpen] = useState(false);
  const [dropdownItems, setDropdownItems] = useState(
    instruments.map(inst => ({ label: inst, value: inst }))
  );
  const [resonantNote, setResonantNote] = useState("");
  const [capabilities, setCapabilities] = useState({});

  const toggleCapability = (cap) => {
    setCapabilities((prev) => ({ ...prev, [cap]: !prev[cap] }));
  };

  const handleSubmit = async () => {
    if (!instrument || !resonantNote) {
      Alert.alert("Please select your instrument and resonant note");
      return;
    }
    try {
      const response = await fetch(`${getBackendUrl()}/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: 1, // Hardcoded for now
          instrument,
          resonant_note: resonantNote,
          comfortable_capabilities: Object.keys(capabilities).filter((k) => capabilities[k])
        })
      });
      if (!response.ok) throw new Error("Failed to save onboarding info");
      navigation.navigate("StartPractice", { instrument, resonantNote, capabilities });
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1a1410", padding: 32 }}>
      {/* Concert Hall Header */}
      <Text style={{ fontSize: 36, fontWeight: "bold", color: "#FFD700", marginBottom: 8, fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif", letterSpacing: 1 }}>Welcome to Sound First</Text>
      <Text style={{ color: "#e6cfa7", fontSize: 20, marginBottom: 24, fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif" }}>Your musical journey begins here</Text>

      {/* Instrument Picker */}
      <Text style={{ color: "#fffbe6", fontSize: 18, marginBottom: 8, textAlign: "center", width: "100%" }}>Instrument</Text>
      <View style={{ marginBottom: 24, width: 260, zIndex: 100 }}>
        <DropDownPicker
          open={open}
          value={instrument}
          items={dropdownItems}
          setOpen={setOpen}
          setValue={setInstrument}
          setItems={setDropdownItems}
          placeholder="Select..."
          style={{ backgroundColor: "#3b2c1a", borderColor: "#FFD700" }}
          dropDownContainerStyle={{ backgroundColor: "#3b2c1a", borderColor: "#FFD700" }}
          textStyle={{ color: "#FFD700", fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif", fontSize: 18 }}
          placeholderStyle={{ color: "#bfa76a" }}
          listItemLabelStyle={{ color: "#FFD700" }}
          selectedItemLabelStyle={{ color: "#3b2c1a", fontWeight: "bold" }}
          selectedItemContainerStyle={{ backgroundColor: "#FFD700" }}
          arrowIconStyle={{ tintColor: "#FFD700" }}
        />
      </View>

      {/* Resonant Note */}
      <Text style={{ color: "#fffbe6", fontSize: 18, marginBottom: 8, textAlign: "center", width: "100%" }}>Most Resonant Note</Text>
      <TextInput
        placeholder="e.g. Bb3"
        value={resonantNote}
        onChangeText={setResonantNote}
        style={{ backgroundColor: "#3b2c1a", color: "#FFD700", borderRadius: 12, borderWidth: 2, borderColor: "#FFD700", width: 180, padding: 12, marginBottom: 24, fontSize: 20, textAlign: "center", fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif" }}
        placeholderTextColor="#bfa76a"
      />

      {/* Capabilities */}
      <Text style={{ color: "#fffbe6", fontSize: 18, marginBottom: 8, textAlign: "center", width: "100%" }}>Musical Elements You Know</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginBottom: 32 }}>
        {capabilityList.map((cap) => (
          <TouchableOpacity
            key={cap}
            onPress={() => toggleCapability(cap)}
            style={{
              backgroundColor: capabilities[cap] ? "#FFD700" : "#3b2c1a",
              borderRadius: 24,
              paddingVertical: 10,
              paddingHorizontal: 18,
              margin: 8,
              borderWidth: 2,
              borderColor: capabilities[cap] ? "#FFD700" : "#bfa76a",
              minWidth: 120,
              alignItems: "center"
            }}
          >
            <Text style={{ color: capabilities[cap] ? "#3b2c1a" : "#FFD700", fontWeight: "bold", fontSize: 16, fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif" }}>{cap}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        style={{ backgroundColor: "#FFD700", borderRadius: 28, paddingVertical: 16, paddingHorizontal: 48, marginTop: 12, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
      >
        <Text style={{ color: "#3b2c1a", fontWeight: "bold", fontSize: 20, fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif" }}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export default OnboardingScreen;
