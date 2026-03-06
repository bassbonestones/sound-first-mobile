import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import StaffNotePicker from "../components/StaffNotePicker";
import AudioInput from "../components/AudioInput";
import ResetButton from "../components/ResetButton";
import { getBackendUrl } from "../src/api/client";

// Instrument families with their instruments
const instrumentFamilies = {
  Brass: {
    icon: "🎺",
    instruments: [
      { name: "Trumpet", icon: "🎺", clef: "treble" },
      { name: "French Horn", icon: "🎵", clef: "treble" },
      { name: "Tenor Trombone", icon: "🎶", clef: "bass" },
      { name: "Bass Trombone", icon: "🎶", clef: "bass" },
      { name: "Euphonium", icon: "🎵", clef: "bass" },
      { name: "Tuba", icon: "🎵", clef: "bass" },
    ],
  },
  Woodwinds: {
    icon: "🎷",
    instruments: [
      { name: "Flute", icon: "🪈", clef: "treble" },
      { name: "Clarinet", icon: "🎵", clef: "treble" },
      { name: "Oboe", icon: "🎵", clef: "treble" },
      { name: "Bassoon", icon: "🎵", clef: "bass" },
      { name: "Alto Saxophone", icon: "🎷", clef: "treble" },
      { name: "Tenor Saxophone", icon: "🎷", clef: "treble" },
      { name: "Baritone Saxophone", icon: "🎷", clef: "treble" },
    ],
  },
  Strings: {
    icon: "🎻",
    instruments: [
      { name: "Violin", icon: "🎻", clef: "treble" },
      { name: "Viola", icon: "🎻", clef: "treble" }, // Actually alto clef but treble works
      { name: "Cello", icon: "🎻", clef: "bass" },
      { name: "Double Bass", icon: "🎻", clef: "bass" },
      { name: "Guitar", icon: "🎸", clef: "treble" },
    ],
  },
  Keyboard: {
    icon: "🎹",
    instruments: [
      { name: "Piano", icon: "🎹", clef: "treble" },
      { name: "Organ", icon: "🎹", clef: "treble" },
    ],
  },
  Voice: {
    icon: "🎤",
    instruments: [
      { name: "Soprano", icon: "🎤", clef: "treble" },
      { name: "Alto", icon: "🎤", clef: "treble" },
      { name: "Tenor", icon: "🎤", clef: "treble" },
      { name: "Bass Voice", icon: "🎤", clef: "bass" },
      { name: "Voice (General)", icon: "🎤", clef: "treble" },
    ],
  },
  Other: {
    icon: "🎼",
    instruments: [
      { name: "Mallet Percussion", icon: "🥁", clef: "treble" },
      { name: "Other", icon: "🎼", clef: "treble" },
    ],
  },
};

// Note names for reference
const noteNames = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

// Default starting notes by instrument (a comfortable, resonant note for that instrument)
const instrumentDefaults = {
  Piano: { startingNote: "C4", clef: "treble" },
  Organ: { startingNote: "C4", clef: "treble" },
  Violin: { startingNote: "A4", clef: "treble" },
  Viola: { startingNote: "D4", clef: "treble" },
  Cello: { startingNote: "G3", clef: "bass" },
  "Double Bass": { startingNote: "G2", clef: "bass" },
  Flute: { startingNote: "D5", clef: "treble" },
  Oboe: { startingNote: "A4", clef: "treble" },
  Clarinet: { startingNote: "G4", clef: "treble" },
  Bassoon: { startingNote: "F3", clef: "bass" },
  "Alto Saxophone": { startingNote: "G4", clef: "treble" },
  "Tenor Saxophone": { startingNote: "D4", clef: "treble" },
  "Baritone Saxophone": { startingNote: "G3", clef: "treble" },
  Trumpet: { startingNote: "Bb4", clef: "treble" },
  "French Horn": { startingNote: "F4", clef: "treble" },
  "Tenor Trombone": { startingNote: "Bb3", clef: "bass" },
  "Bass Trombone": { startingNote: "F3", clef: "bass" },
  Euphonium: { startingNote: "Bb3", clef: "bass" },
  Tuba: { startingNote: "F2", clef: "bass" },
  Soprano: { startingNote: "A4", clef: "treble" },
  Alto: { startingNote: "E4", clef: "treble" },
  Tenor: { startingNote: "A3", clef: "treble" },
  "Bass Voice": { startingNote: "E3", clef: "bass" },
  "Voice (General)": { startingNote: "E4", clef: "treble" },
  Guitar: { startingNote: "G3", clef: "treble" },
  "Mallet Percussion": { startingNote: "C4", clef: "treble" },
  Other: { startingNote: "C4", clef: "treble" },
};

function OnboardingScreen({ navigation, route }) {
  // Get initial step from route params (for dev navigation)
  const initialStep = route?.params?.step || 1;
  const clearFamily = route?.params?.clearFamily || false;

  const [selectedFamily, setSelectedFamily] = useState(clearFamily ? "" : "");
  const [instrument, setInstrument] = useState("");
  const [startingNote, setStartingNote] = useState("");
  const [playToSelectMode, setPlayToSelectMode] = useState(false);
  const [detectedPitch, setDetectedPitch] = useState(null);
  const [isSounding, setIsSounding] = useState(false); // Track if currently making sound
  const [step, setStep] = useState(initialStep); // Multi-step onboarding

  // Get clef for selected instrument
  const getClef = useCallback(() => {
    if (!selectedFamily || !instrument) return "treble";
    const family = instrumentFamilies[selectedFamily];
    if (!family) return instrumentDefaults[instrument]?.clef || "treble";
    const inst = family.instruments.find((i) => i.name === instrument);
    return inst?.clef || instrumentDefaults[instrument]?.clef || "treble";
  }, [selectedFamily, instrument]);

  // Get icon for selected instrument
  const getInstrumentIcon = useCallback(() => {
    if (!selectedFamily || !instrument) return "🎵";
    const family = instrumentFamilies[selectedFamily];
    if (!family) return "🎵";
    const inst = family.instruments.find((i) => i.name === instrument);
    return inst?.icon || "🎵";
  }, [selectedFamily, instrument]);

  // Select a family
  const selectFamily = (familyName) => {
    setSelectedFamily(familyName);
    setInstrument(""); // Clear instrument when family changes
    setStartingNote("");
  };

  // Auto-fill defaults when instrument selected
  const selectInstrument = (instName) => {
    setInstrument(instName);
    const defaults =
      instrumentDefaults[instName] || instrumentDefaults["Other"];
    setStartingNote(defaults.startingNote);
  };

  // Handle real-time pitch (during active sound) - show with cents
  const handleRealtimePitch = useCallback((pitchInfo) => {
    if (pitchInfo && pitchInfo.noteName) {
      setDetectedPitch({ ...pitchInfo, isRealtime: true });
      setIsSounding(true);
    }
  }, []);

  // Handle final pitch (after sound stops) - show just note name
  const handleFinalPitch = useCallback((pitchInfo) => {
    if (pitchInfo && pitchInfo.noteName) {
      setDetectedPitch({ ...pitchInfo, isRealtime: false });
      setIsSounding(false);
    }
  }, []);

  // Handle sound end - ensure state is cleared
  const handleSoundEnd = useCallback(() => {
    setIsSounding(false);
    // Force isRealtime to false on current detected pitch
    setDetectedPitch((prev) => (prev ? { ...prev, isRealtime: false } : null));
  }, []);

  // Confirm detected pitch as starting note
  const confirmDetectedPitch = useCallback(() => {
    if (detectedPitch?.noteName) {
      setStartingNote(detectedPitch.noteName);
      setPlayToSelectMode(false);
      setDetectedPitch(null);
    }
  }, [detectedPitch]);

  const handleSubmit = async () => {
    if (!instrument) {
      Alert.alert("Please select your instrument");
      return;
    }
    if (!startingNote) {
      Alert.alert("Please select your starting note");
      return;
    }
    try {
      const response = await fetch(`${getBackendUrl()}/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: 1,
          instrument,
          resonant_note: startingNote,
          // Range starts as just this single note - will expand as they discover more
          range_low: startingNote,
          range_high: startingNote,
          comfortable_capabilities: [], // We introduce concepts gradually, not upfront
        }),
      });
      if (!response.ok) throw new Error("Failed to save onboarding info");
      // Navigate to Day 0 First Note Experience for new users
      navigation.replace("FirstNote", {
        userId: 1,
        resonantNote: startingNote,
        instrument,
      });
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  // Step 1: Instrument Selection
  if (step === 1) {
    const familyNames = Object.keys(instrumentFamilies);
    const currentFamilyInstruments = selectedFamily
      ? instrumentFamilies[selectedFamily].instruments
      : [];
    const canProceed = !!instrument;

    return (
      <View style={{ flex: 1, backgroundColor: "#1a1410" }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: "center",
            padding: 24,
            paddingBottom: 180,
          }}
        >
          <Text
            style={{
              fontSize: 32,
              fontWeight: "bold",
              color: "#FFD700",
              marginBottom: 8,
              fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
              textAlign: "center",
              marginTop: 40,
            }}
          >
            Welcome to Sound First
          </Text>
          <Text
            style={{
              color: "#e6cfa7",
              fontSize: 18,
              marginBottom: 24,
              fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
              textAlign: "center",
            }}
          >
            {!selectedFamily
              ? "What type of instrument do you play?"
              : "Select your instrument"}
          </Text>

          {/* Family Selection */}
          {!selectedFamily && (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "center",
                maxWidth: 450,
              }}
            >
              {familyNames.map((familyName) => (
                <TouchableOpacity
                  key={familyName}
                  onPress={() => selectFamily(familyName)}
                  style={{
                    backgroundColor: "#3b2c1a",
                    borderRadius: 16,
                    padding: 16,
                    margin: 8,
                    borderWidth: 2,
                    borderColor: "#bfa76a",
                    width: 120,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 36, marginBottom: 4 }}>
                    {instrumentFamilies[familyName].icon}
                  </Text>
                  <Text
                    style={{
                      color: "#FFD700",
                      fontWeight: "bold",
                      fontSize: 14,
                      textAlign: "center",
                      fontFamily:
                        Platform.OS === "ios" ? "Baskerville" : "serif",
                    }}
                  >
                    {familyName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Instrument Selection within Family */}
          {selectedFamily && (
            <>
              <TouchableOpacity
                onPress={() => {
                  setSelectedFamily("");
                  setInstrument("");
                }}
                style={{ marginBottom: 16 }}
              >
                <Text style={{ color: "#bfa76a", fontSize: 14 }}>
                  ← Back to families
                </Text>
              </TouchableOpacity>

              <View
                style={{
                  backgroundColor: "#2a1f12",
                  borderRadius: 12,
                  padding: 8,
                  marginBottom: 16,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 24, marginRight: 8 }}>
                  {instrumentFamilies[selectedFamily].icon}
                </Text>
                <Text
                  style={{ color: "#FFD700", fontSize: 18, fontWeight: "bold" }}
                >
                  {selectedFamily}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  maxWidth: 400,
                }}
              >
                {currentFamilyInstruments.map((inst) => (
                  <TouchableOpacity
                    key={inst.name}
                    onPress={() => selectInstrument(inst.name)}
                    style={{
                      backgroundColor:
                        instrument === inst.name ? "#FFD700" : "#3b2c1a",
                      borderRadius: 16,
                      padding: 16,
                      margin: 8,
                      borderWidth: 2,
                      borderColor:
                        instrument === inst.name ? "#FFD700" : "#bfa76a",
                      width: 110,
                      alignItems: "center",
                      shadowColor:
                        instrument === inst.name ? "#FFD700" : "#000",
                      shadowOpacity: instrument === inst.name ? 0.4 : 0.1,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                    }}
                  >
                    <Text style={{ fontSize: 32, marginBottom: 4 }}>
                      {inst.icon}
                    </Text>
                    <Text
                      style={{
                        color: instrument === inst.name ? "#3b2c1a" : "#FFD700",
                        fontWeight: "bold",
                        fontSize: 11,
                        textAlign: "center",
                        fontFamily:
                          Platform.OS === "ios" ? "Baskerville" : "serif",
                      }}
                    >
                      {inst.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>

        {/* Fixed bottom area with button and progress dots */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 24,
            paddingBottom: 40,
            alignItems: "center",
            backgroundColor: "#1a1410",
          }}
        >
          <TouchableOpacity
            disabled={!canProceed}
            onPress={() => setStep(2)}
            style={{
              backgroundColor: canProceed ? "#FFD700" : "#5a4a2a",
              borderRadius: 28,
              paddingVertical: 16,
              paddingHorizontal: 48,
              opacity: canProceed ? 1 : 0.5,
            }}
          >
            <Text
              style={{
                color: canProceed ? "#3b2c1a" : "#8a7a5a",
                fontWeight: "bold",
                fontSize: 18,
              }}
            >
              Next →
            </Text>
          </TouchableOpacity>

          {/* Progress Dots */}
          <View style={{ flexDirection: "row", marginTop: 16 }}>
            {[1, 2].map((s) => (
              <View
                key={s}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: step === s ? "#FFD700" : "#3b2c1a",
                  marginHorizontal: 4,
                  borderWidth: 1,
                  borderColor: "#FFD700",
                }}
              />
            ))}
          </View>
        </View>
        <ResetButton />
        {/* Admin Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate("Admin")}
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            backgroundColor: "#3b2c1a",
            borderRadius: 8,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: "#FFD700",
          }}
        >
          <Text style={{ color: "#FFD700", fontSize: 12 }}>Admin</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Step 2: Starting Note Selection
  if (step === 2) {
    const canProceed = !!startingNote;

    // Play to Select Mode - use microphone to detect pitch
    if (playToSelectMode) {
      const canConfirm = !!detectedPitch;

      return (
        <View style={{ flex: 1, backgroundColor: "#1a1410" }}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              alignItems: "center",
              padding: 24,
              paddingBottom: 180,
              paddingTop: 60,
            }}
          >
            <TouchableOpacity
              onPress={() => setPlayToSelectMode(false)}
              style={{ position: "absolute", top: 50, left: 20 }}
            >
              <Text style={{ color: "#FFD700", fontSize: 16 }}>
                ← Back to staff
              </Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 36, marginBottom: 8 }}>
              {getInstrumentIcon()}
            </Text>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: "#FFD700",
                marginBottom: 8,
                fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
                textAlign: "center",
              }}
            >
              Play a note that feels great
            </Text>
            <Text
              style={{
                color: "#e6cfa7",
                fontSize: 16,
                marginBottom: 24,
                fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
                textAlign: "center",
                paddingHorizontal: 20,
              }}
            >
              Play around on your instrument and find a note that feels natural,
              resonant, and easy to play. When you find it, hold it steady.
            </Text>

            <AudioInput
              enabled={true}
              onRealtimePitch={handleRealtimePitch}
              onPitchDetected={handleFinalPitch}
              onSoundEnd={handleSoundEnd}
              showDebug={false}
              volumeThreshold={0.2}
            />

            {detectedPitch && (
              <View style={{ marginTop: 24, alignItems: "center" }}>
                <Text
                  style={{ color: "#e6cfa7", fontSize: 16, marginBottom: 8 }}
                >
                  {isSounding ? "I hear:" : "Detected:"}
                </Text>
                <View
                  style={{
                    backgroundColor: !isSounding
                      ? "#4a2d5a"
                      : detectedPitch.isInTune
                        ? "#2d5a2d"
                        : "#3b2c1a",
                    borderRadius: 16,
                    paddingVertical: 16,
                    paddingHorizontal: 32,
                    borderWidth: 2,
                    borderColor: "#FFD700",
                    minHeight: 90,
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#FFD700",
                      fontSize: 32,
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    {detectedPitch.noteName}
                  </Text>
                  <Text
                    style={{
                      color: "#e6cfa7",
                      fontSize: 14,
                      textAlign: "center",
                      marginTop: 4,
                      minHeight: 18,
                    }}
                  >
                    {detectedPitch.isRealtime
                      ? detectedPitch.isInTune
                        ? "In tune ✓"
                        : `${detectedPitch.cents > 0 ? "+" : ""}${detectedPitch.cents} cents`
                      : " "}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Fixed bottom area with button and progress dots */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: 24,
              paddingBottom: 40,
              alignItems: "center",
              backgroundColor: "#1a1410",
            }}
          >
            <TouchableOpacity
              disabled={!canConfirm}
              onPress={confirmDetectedPitch}
              style={{
                backgroundColor: canConfirm ? "#FFD700" : "#5a4a2a",
                borderRadius: 28,
                paddingVertical: 16,
                paddingHorizontal: 32,
                opacity: canConfirm ? 1 : 0.5,
              }}
            >
              <Text
                style={{
                  color: canConfirm ? "#3b2c1a" : "#8a7a5a",
                  fontWeight: "bold",
                  fontSize: 18,
                }}
              >
                Yes, that's my note! ✓
              </Text>
            </TouchableOpacity>

            {/* Progress Dots */}
            <View style={{ flexDirection: "row", marginTop: 16 }}>
              {[1, 2].map((s) => (
                <View
                  key={s}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: step === s ? "#FFD700" : "#3b2c1a",
                    marginHorizontal: 4,
                    borderWidth: 1,
                    borderColor: "#FFD700",
                  }}
                />
              ))}
            </View>
          </View>
          <ResetButton />
        </View>
      );
    }

    // Staff-based note selection mode
    return (
      <View style={{ flex: 1, backgroundColor: "#1a1410" }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: "center",
            padding: 24,
            paddingBottom: 180,
            paddingTop: 60,
          }}
        >
          <TouchableOpacity
            onPress={() => setStep(1)}
            style={{ position: "absolute", top: 50, left: 20 }}
          >
            <Text style={{ color: "#FFD700", fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 36, marginBottom: 8 }}>
            {getInstrumentIcon()}
          </Text>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "#FFD700",
              marginBottom: 8,
              fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
              textAlign: "center",
            }}
          >
            Choose your starting note
          </Text>
          <Text
            style={{
              color: "#e6cfa7",
              fontSize: 16,
              marginBottom: 24,
              fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
              textAlign: "center",
              paddingHorizontal: 20,
            }}
          >
            Pick a note that feels great, resonant, and easy to play. This will
            be your home base.
          </Text>

          <StaffNotePicker
            clef={getClef()}
            value={startingNote}
            onChange={setStartingNote}
            onPlayToSelect={() => setPlayToSelectMode(true)}
            instrument={instrument}
          />

          <Text
            style={{
              color: "#bfa76a",
              fontSize: 14,
              textAlign: "center",
              marginTop: 16,
              paddingHorizontal: 20,
            }}
          >
            Don't worry about picking the "perfect" note — you can always change
            it later!
          </Text>
        </ScrollView>

        {/* Fixed bottom area with button and progress dots */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 24,
            paddingBottom: 40,
            alignItems: "center",
            backgroundColor: "#1a1410",
          }}
        >
          <TouchableOpacity
            disabled={!canProceed}
            onPress={handleSubmit}
            style={{
              backgroundColor: canProceed ? "#FFD700" : "#5a4a2a",
              borderRadius: 28,
              paddingVertical: 16,
              paddingHorizontal: 48,
              opacity: canProceed ? 1 : 0.5,
              shadowColor: canProceed ? "#FFD700" : "transparent",
              shadowOpacity: 0.4,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
            }}
          >
            <Text
              style={{
                color: canProceed ? "#3b2c1a" : "#8a7a5a",
                fontWeight: "bold",
                fontSize: 20,
                fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
              }}
            >
              Start Practicing 🎵
            </Text>
          </TouchableOpacity>

          {/* Progress Dots */}
          <View style={{ flexDirection: "row", marginTop: 16 }}>
            {[1, 2].map((s) => (
              <View
                key={s}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: step === s ? "#FFD700" : "#3b2c1a",
                  marginHorizontal: 4,
                  borderWidth: 1,
                  borderColor: "#FFD700",
                }}
              />
            ))}
          </View>
        </View>
        <ResetButton />
      </View>
    );
  }
}

export default OnboardingScreen;
