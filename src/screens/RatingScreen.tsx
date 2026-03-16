import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  Platform,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import ResetButton from "../components/ResetButton";

interface RatingScreenProps {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
  route?: {
    params?: Record<string, unknown>;
  };
}

export default function RatingScreen({ navigation, route }: RatingScreenProps) {
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Rate Your Practice</Text>
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((num) => (
            <TouchableOpacity
              key={num}
              onPress={() => setRating(num)}
              accessibilityLabel={`Rate ${num} out of 5${rating === num ? ", selected" : ""}`}
              accessibilityRole="button"
              accessibilityState={{ selected: rating === num }}
              style={[
                styles.ratingButton,
                rating === num && styles.ratingButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.ratingButtonText,
                  rating === num && styles.ratingButtonTextSelected,
                ]}
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
            accessibilityLabel={
              submitting ? "Submitting rating" : "Submit rating"
            }
            accessibilityRole="button"
            accessibilityState={{ disabled: submitting }}
            style={[
              styles.submitButton,
              submitting && styles.submitButtonDisabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#1a1410" />
            ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
      <ResetButton />
    </View>
  );
}

const styles = StyleSheet.create({
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
  ratingRow: {
    flexDirection: "row",
    marginBottom: 24,
  },
  ratingButton: {
    backgroundColor: "#3b2c1a",
    borderRadius: 16,
    padding: 16,
    margin: 8,
    borderWidth: 2,
    borderColor: "#bfa76a",
  },
  ratingButtonSelected: {
    backgroundColor: "#FFD700",
    borderColor: "#FFD700",
  },
  ratingButtonText: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: 22,
  },
  ratingButtonTextSelected: {
    color: "#3b2c1a",
  },
  submitButton: {
    backgroundColor: "#FFD700",
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginTop: 12,
  },
  submitButtonDisabled: {
    backgroundColor: "#bfa76a",
  },
  submitButtonText: {
    color: "#3b2c1a",
    fontWeight: "bold",
    fontSize: 20,
  },
});
