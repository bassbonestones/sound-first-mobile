import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import ResetButton from "../components/ResetButton";

export default function RatingScreen({ navigation, route }) {
  const [rating, setRating] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Dummy data for now; replace with real session/mini-session data as needed
  const user_id = 1;
  const material_id = 1;
  const key = "Bb";
  const focus_card_id = 1;
  const fatigue = 2;
  const timestamp = new Date().toISOString();

  const submitAttempt = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:8000/practice-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id,
          material_id,
          key,
          focus_card_id,
          rating,
          fatigue,
          timestamp,
        }),
      });
      if (res.ok) {
        Alert.alert("Submitted!", "Your practice attempt was recorded.");
        navigation.navigate("Session");
      } else {
        Alert.alert("Error", "Failed to submit attempt.");
      }
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSubmitting(false);
    }
  };

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
        Rate Your Practice
      </Text>
      <View style={{ flexDirection: "row", marginBottom: 24 }}>
        {[1, 2, 3, 4, 5].map((num) => (
          <TouchableOpacity
            key={num}
            onPress={() => setRating(num)}
            style={{
              backgroundColor: rating === num ? "#FFD700" : "#3b2c1a",
              borderRadius: 16,
              padding: 16,
              margin: 8,
              borderWidth: 2,
              borderColor: rating === num ? "#FFD700" : "#bfa76a",
            }}
          >
            <Text
              style={{
                color: rating === num ? "#3b2c1a" : "#FFD700",
                fontWeight: "bold",
                fontSize: 22,
              }}
            >
              {num}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {rating && (
        <TouchableOpacity
          onPress={submitAttempt}
          disabled={submitting}
          style={{
            backgroundColor: submitting ? "#bfa76a" : "#FFD700",
            borderRadius: 24,
            paddingVertical: 16,
            paddingHorizontal: 48,
            marginTop: 12,
          }}
        >
          <Text style={{ color: "#3b2c1a", fontWeight: "bold", fontSize: 20 }}>
            {submitting ? "Submitting..." : "Submit"}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
    <ResetButton />
    </View>
  );
}
