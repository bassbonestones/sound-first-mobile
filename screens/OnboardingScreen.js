import React, { useState } from "react";
import { View, Text, TextInput, Alert, ScrollView, TouchableOpacity, Platform, Modal, FlatList } from "react-native";

// Instruments with visual icons
const instruments = [
  { name: "Piano", icon: "🎹" },
  { name: "Violin", icon: "🎻" },
  { name: "Flute", icon: "🪈" },
  { name: "Trumpet", icon: "🎺" },
  { name: "Tenor Trombone", icon: "📯" },
  { name: "Bass Trombone", icon: "📯" },
  { name: "Voice", icon: "🎤" },
  { name: "Saxophone", icon: "🎷" },
  { name: "Guitar", icon: "🎸" },
  { name: "Clarinet", icon: "🎵" },
  { name: "Other", icon: "🎼" }
];

// Note names for range pickers
const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const octaves = ["1", "2", "3", "4", "5", "6", "7"];

// Generate all notes for picker
const allNotes = [];
octaves.forEach(octave => {
  noteNames.forEach(note => {
    allNotes.push(`${note}${octave}`);
  });
});

// Default ranges by instrument family
const instrumentDefaults = {
  "Piano": { low: "A0", high: "C8", resonant: "C4" },
  "Violin": { low: "G3", high: "E7", resonant: "A4" },
  "Flute": { low: "C4", high: "C7", resonant: "D5" },
  "Trumpet": { low: "F#3", high: "C6", resonant: "Bb4" },
  "Tenor Trombone": { low: "E2", high: "Bb4", resonant: "Bb3" },
  "Bass Trombone": { low: "Bb1", high: "Bb4", resonant: "F3" },
  "Voice": { low: "A2", high: "A5", resonant: "E4" },
  "Saxophone": { low: "Bb3", high: "F#6", resonant: "D5" },
  "Guitar": { low: "E2", high: "E6", resonant: "G3" },
  "Clarinet": { low: "E3", high: "C7", resonant: "G4" },
  "Other": { low: "C3", high: "C6", resonant: "C4" }
};

const capabilityList = [
  { name: "Treble Clef", icon: "𝄞" },
  { name: "Bass Clef", icon: "𝄢" },
  { name: "Quarter Note", icon: "♩" },
  { name: "Triplets", icon: "♫₃" },
  { name: "Staccato", icon: "•" },
  { name: "Fermata", icon: "𝄐" },
];

function getBackendUrl() {
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

// Note Picker Component
function NotePicker({ label, value, onChange, notes }) {
  const [visible, setVisible] = useState(false);
  
  return (
    <View style={{ flex: 1, marginHorizontal: 4 }}>
      <Text style={{ color: "#fffbe6", fontSize: 14, marginBottom: 4, textAlign: "center" }}>{label}</Text>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={{
          backgroundColor: "#3b2c1a",
          borderRadius: 12,
          borderWidth: 2,
          borderColor: "#FFD700",
          padding: 12,
          alignItems: "center"
        }}
      >
        <Text style={{ color: "#FFD700", fontSize: 18, fontWeight: "bold", fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif" }}>
          {value || "Select"}
        </Text>
      </TouchableOpacity>
      
      <Modal visible={visible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: "#1a1410", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "60%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "#3b2c1a" }}>
              <Text style={{ color: "#FFD700", fontSize: 18, fontWeight: "bold" }}>{label}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={{ color: "#FFD700", fontSize: 18 }}>Done</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={notes}
              keyExtractor={(item) => item}
              numColumns={4}
              contentContainerStyle={{ padding: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { onChange(item); setVisible(false); }}
                  style={{
                    flex: 1,
                    margin: 4,
                    padding: 12,
                    backgroundColor: value === item ? "#FFD700" : "#3b2c1a",
                    borderRadius: 8,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: value === item ? "#FFD700" : "#bfa76a"
                  }}
                >
                  <Text style={{ color: value === item ? "#3b2c1a" : "#FFD700", fontWeight: value === item ? "bold" : "normal" }}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function OnboardingScreen({ navigation }) {
  const [instrument, setInstrument] = useState("");
  const [rangeLow, setRangeLow] = useState("");
  const [rangeHigh, setRangeHigh] = useState("");
  const [resonantNote, setResonantNote] = useState("");
  const [capabilities, setCapabilities] = useState({});
  const [step, setStep] = useState(1); // Multi-step onboarding

  // Auto-fill defaults when instrument selected
  const selectInstrument = (inst) => {
    setInstrument(inst);
    const defaults = instrumentDefaults[inst] || instrumentDefaults["Other"];
    setRangeLow(defaults.low);
    setRangeHigh(defaults.high);
    setResonantNote(defaults.resonant);
  };

  const toggleCapability = (cap) => {
    setCapabilities((prev) => ({ ...prev, [cap]: !prev[cap] }));
  };

  const handleSubmit = async () => {
    if (!instrument) {
      Alert.alert("Please select your instrument");
      return;
    }
    try {
      const response = await fetch(`${getBackendUrl()}/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: 1,
          instrument,
          resonant_note: resonantNote,
          range_low: rangeLow,
          range_high: rangeHigh,
          comfortable_capabilities: Object.keys(capabilities).filter((k) => capabilities[k])
        })
      });
      if (!response.ok) throw new Error("Failed to save onboarding info");
      navigation.navigate("StartPractice", { instrument, resonantNote, rangeLow, rangeHigh, capabilities });
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  // Step 1: Instrument Selection
  if (step === 1) {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1a1410", padding: 24 }}>
        <Text style={{ fontSize: 32, fontWeight: "bold", color: "#FFD700", marginBottom: 8, fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif", textAlign: "center" }}>
          Welcome to Sound First
        </Text>
        <Text style={{ color: "#e6cfa7", fontSize: 18, marginBottom: 32, fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif", textAlign: "center" }}>
          What instrument do you play?
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", maxWidth: 400 }}>
          {instruments.map((inst) => (
            <TouchableOpacity
              key={inst.name}
              onPress={() => selectInstrument(inst.name)}
              style={{
                backgroundColor: instrument === inst.name ? "#FFD700" : "#3b2c1a",
                borderRadius: 16,
                padding: 16,
                margin: 8,
                borderWidth: 2,
                borderColor: instrument === inst.name ? "#FFD700" : "#bfa76a",
                width: 100,
                alignItems: "center",
                shadowColor: instrument === inst.name ? "#FFD700" : "#000",
                shadowOpacity: instrument === inst.name ? 0.4 : 0.1,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 }
              }}
            >
              <Text style={{ fontSize: 36, marginBottom: 4 }}>{inst.icon}</Text>
              <Text style={{ 
                color: instrument === inst.name ? "#3b2c1a" : "#FFD700", 
                fontWeight: "bold", 
                fontSize: 12, 
                textAlign: "center",
                fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif" 
              }}>
                {inst.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {instrument && (
          <TouchableOpacity
            onPress={() => setStep(2)}
            style={{ backgroundColor: "#FFD700", borderRadius: 28, paddingVertical: 16, paddingHorizontal: 48, marginTop: 32 }}
          >
            <Text style={{ color: "#3b2c1a", fontWeight: "bold", fontSize: 18 }}>Next →</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  }

  // Step 2: Range Selection
  if (step === 2) {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1a1410", padding: 24 }}>
        <TouchableOpacity onPress={() => setStep(1)} style={{ position: "absolute", top: 50, left: 20 }}>
          <Text style={{ color: "#FFD700", fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 36, marginBottom: 8 }}>{instruments.find(i => i.name === instrument)?.icon}</Text>
        <Text style={{ fontSize: 28, fontWeight: "bold", color: "#FFD700", marginBottom: 8, fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif" }}>
          {instrument}
        </Text>
        <Text style={{ color: "#e6cfa7", fontSize: 18, marginBottom: 32, fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif", textAlign: "center" }}>
          Set your comfortable playing range
        </Text>

        {/* Range Visualization */}
        <View style={{ 
          backgroundColor: "#3b2c1a", 
          borderRadius: 20, 
          padding: 20, 
          marginBottom: 24, 
          width: "100%", 
          maxWidth: 340,
          borderWidth: 2,
          borderColor: "#bfa76a"
        }}>
          <Text style={{ color: "#fffbe6", fontSize: 16, marginBottom: 16, textAlign: "center" }}>
            🎵 Comfortable Range
          </Text>
          
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <NotePicker label="Low Note" value={rangeLow} onChange={setRangeLow} notes={allNotes} />
            <Text style={{ color: "#FFD700", fontSize: 20, marginHorizontal: 8 }}>→</Text>
            <NotePicker label="High Note" value={rangeHigh} onChange={setRangeHigh} notes={allNotes} />
          </View>

          <View style={{ marginTop: 20, alignItems: "center" }}>
            <Text style={{ color: "#fffbe6", fontSize: 14, marginBottom: 8 }}>🔔 Most Resonant Note</Text>
            <TouchableOpacity
              onPress={() => {}}
              style={{
                backgroundColor: "#1a1410",
                borderRadius: 12,
                borderWidth: 2,
                borderColor: "#FFD700",
                paddingVertical: 10,
                paddingHorizontal: 24
              }}
            >
              <NotePicker label="" value={resonantNote} onChange={setResonantNote} notes={allNotes} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={{ color: "#bfa76a", fontSize: 14, textAlign: "center", marginBottom: 24, paddingHorizontal: 20 }}>
          We've pre-filled typical ranges for {instrument}. Adjust if needed — this helps us select appropriate keys and materials.
        </Text>

        <TouchableOpacity
          onPress={() => setStep(3)}
          style={{ backgroundColor: "#FFD700", borderRadius: 28, paddingVertical: 16, paddingHorizontal: 48 }}
        >
          <Text style={{ color: "#3b2c1a", fontWeight: "bold", fontSize: 18 }}>Next →</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Step 3: Musical Elements
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1a1410", padding: 24 }}>
      <TouchableOpacity onPress={() => setStep(2)} style={{ position: "absolute", top: 50, left: 20 }}>
        <Text style={{ color: "#FFD700", fontSize: 16 }}>← Back</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 28, fontWeight: "bold", color: "#FFD700", marginBottom: 8, fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif", textAlign: "center" }}>
        Musical Elements
      </Text>
      <Text style={{ color: "#e6cfa7", fontSize: 16, marginBottom: 24, fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif", textAlign: "center", paddingHorizontal: 20 }}>
        Tap any elements you already know — we'll introduce unfamiliar ones gradually
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginBottom: 32, maxWidth: 360 }}>
        {capabilityList.map((cap) => (
          <TouchableOpacity
            key={cap.name}
            onPress={() => toggleCapability(cap.name)}
            style={{
              backgroundColor: capabilities[cap.name] ? "#FFD700" : "#3b2c1a",
              borderRadius: 16,
              paddingVertical: 12,
              paddingHorizontal: 16,
              margin: 6,
              borderWidth: 2,
              borderColor: capabilities[cap.name] ? "#FFD700" : "#bfa76a",
              minWidth: 100,
              alignItems: "center",
              flexDirection: "row"
            }}
          >
            <Text style={{ fontSize: 20, marginRight: 8 }}>{cap.icon}</Text>
            <Text style={{ 
              color: capabilities[cap.name] ? "#3b2c1a" : "#FFD700", 
              fontWeight: "bold", 
              fontSize: 14,
              fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif" 
            }}>
              {cap.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={{ color: "#bfa76a", fontSize: 14, textAlign: "center", marginBottom: 24, paddingHorizontal: 20 }}>
        Don't worry if you're not sure — Sound First will teach you anything you need!
      </Text>

      <TouchableOpacity
        onPress={handleSubmit}
        style={{ 
          backgroundColor: "#FFD700", 
          borderRadius: 28, 
          paddingVertical: 16, 
          paddingHorizontal: 48, 
          shadowColor: "#FFD700", 
          shadowOpacity: 0.4, 
          shadowRadius: 12, 
          shadowOffset: { width: 0, height: 4 } 
        }}
      >
        <Text style={{ color: "#3b2c1a", fontWeight: "bold", fontSize: 20, fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif" }}>
          Start Practicing 🎵
        </Text>
      </TouchableOpacity>

      {/* Progress Dots */}
      <View style={{ flexDirection: "row", marginTop: 32 }}>
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: step === s ? "#FFD700" : "#3b2c1a",
              marginHorizontal: 4,
              borderWidth: 1,
              borderColor: "#FFD700"
            }}
          />
        ))}
      </View>
    </ScrollView>
  );
}

export default OnboardingScreen;
