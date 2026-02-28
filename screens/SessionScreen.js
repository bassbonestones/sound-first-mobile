import React, { useState, useEffect } from "react";
import {
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  View,
  Text,
  TextInput,
} from "react-native";

function getBackendUrl(selfDirected = false) {
  // Set to your actual local IP address
  const LOCAL_IP = "192.168.1.19";
  const endpoint = selfDirected
    ? "generate-self-directed-session"
    : "generate-session";
  if (Platform.OS === "android") {
    return `http://10.0.2.2:8000/${endpoint}`;
  } else if (Platform.OS === "ios") {
    return `http://${LOCAL_IP}:8000/${endpoint}`;
  } else if (Platform.OS === "web") {
    // Use window.location.hostname for web to avoid CORS/network issues
    return `http://${window.location.hostname}:8000/${endpoint}`;
  } else {
    // fallback for other
    return `http://${LOCAL_IP}:8000/${endpoint}`;
  }
}

// All hooks must be at the very top
// (Removed invalid hooks outside the function component)
export default function SessionScreen({ navigation, route }) {
  // All hooks at the very top
  const [session, setSession] = useState(null);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReflection, setShowReflection] = useState(false);
  const [reflection, setReflection] = useState("");
  const [extended, setExtended] = useState(false);
  const [fatigueInput, setFatigueInput] = useState(2);
  const [rating, setRating] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Variable assignments after hooks
  const duration = route?.params?.duration || 20;
  const fatigue = route?.params?.fatigue || 2;
  const selfDirected = route?.params?.selfDirected || false;
  const material_id = route?.params?.material_id;
  const focus_card_id = route?.params?.focus_card_id;
  const goal = route?.params?.goal;

  useEffect(() => {
    const url = getBackendUrl(selfDirected);
    let body;
    if (selfDirected) {
      body = JSON.stringify({
        user_id: 1, // TODO: Replace with real user id
        planned_duration_minutes: duration,
        material_id,
        focus_card_id,
        goal_type: goal,
      });
    } else {
      body = JSON.stringify({ planned_duration_minutes: duration, fatigue });
    }
    console.log("[SessionScreen] About to fetch:", url, body);
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    })
      .then((res) => {
        console.log("[SessionScreen] Fetch response status:", res.status);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("[SessionScreen] Fetch response data:", data);
        setSession(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[SessionScreen] Session fetch error:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [
    duration,
    fatigue,
    selfDirected,
    material_id,
    focus_card_id,
    goal,
    route?.params?.sessionKey,
  ]);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  if (error)
    return <Text style={{ color: "red" }}>Error loading session: {error}</Text>;

  if (!session) return <Text>Error loading session (no data)</Text>;

  // Defensive: check mini_sessions exists and has at least one entry
  if (
    !session.mini_sessions ||
    !Array.isArray(session.mini_sessions) ||
    session.mini_sessions.length === 0
  ) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "red" }}>
          No mini sessions found in session response.
        </Text>
        <Text selectable style={{ fontSize: 10, marginTop: 10 }}>
          {JSON.stringify(session, null, 2)}
        </Text>
      </View>
    );
  }

  const mini = session.mini_sessions[current];
  // Defensive: check mini is defined
  if (!mini) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "red" }}>
          Mini session not found for index {current}.
        </Text>
        <Text selectable style={{ fontSize: 10, marginTop: 10 }}>
          {JSON.stringify(session, null, 2)}
        </Text>
      </View>
    );
  }

  const handleNext = () => {
    setShowReflection(true);
  };

  const handleReflectionSubmit = async () => {
    setSubmitting(true);
    try {
      // Send practice attempt to backend
      const res = await fetch("http://192.168.1.19:8000/practice-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: 1, // TODO: Replace with real user id
          material_id: mini.material_id,
          key: mini.key,
          focus_card_id: mini.focus_card_id,
          rating: rating || 3,
          fatigue: fatigueInput,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Failed to submit attempt");
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSubmitting(false);
      setShowReflection(false);
      setReflection("");
      setExtended(false);
      setFatigueInput(2);
      setRating(null);
      if (current < session.mini_sessions.length - 1) setCurrent(current + 1);
      else navigation.navigate("StartPractice");
    }
  };

  const handleSkip = () => {
    setShowReflection(false);
    setReflection("");
    setExtended(false);
    if (current < session.mini_sessions.length - 1) setCurrent(current + 1);
    else navigation.navigate("StartPractice");
  };

  const handleExtend = () => {
    setExtended(true);
    setShowReflection(false);
  };

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#1a1410",
        padding: 32,
      }}
    >
      {/* Practice Session Header */}
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          color: "#FFD700",
          marginBottom: 8,
          fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
        }}
      >
        Practice Session {current + 1} / {session.mini_sessions.length}
      </Text>

      {/* Focus Card Styled Card */}
      <View
        style={{
          backgroundColor: "#3b2c1a",
          borderRadius: 18,
          padding: 18,
          marginBottom: 18,
          width: 320,
          borderWidth: 2,
          borderColor: "#FFD700",
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        <Text
          style={{
            color: "#FFD700",
            fontSize: 22,
            fontWeight: "bold",
            marginBottom: 4,
            fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
          }}
        >
          {mini.focus_card_name}
        </Text>
        {mini.focus_card_description ? (
          <Text
            style={{
              color: "#fffbe6",
              fontSize: 14,
              marginBottom: 4,
              fontStyle: "italic",
              fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
            }}
          >
            {mini.focus_card_description}
          </Text>
        ) : null}
        <Text
          style={{
            color: "#fffbe6",
            fontSize: 16,
            marginBottom: 4,
            fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
          }}
        >
          Goal: {mini.goal_label}
        </Text>
      </View>

      {/* Material Prompt Card with Pitch Info */}
      <View
        style={{
          backgroundColor: "#2d232e",
          borderRadius: 14,
          padding: 14,
          marginBottom: 14,
          width: 320,
          borderWidth: 2,
          borderColor: "#FFD700",
        }}
      >
        <Text
          style={{
            color: "#FFD700",
            fontSize: 16,
            fontWeight: "bold",
            marginBottom: 2,
          }}
        >
          Material:
        </Text>
        <Text style={{ color: "#fffbe6", fontSize: 16, marginBottom: 2 }}>
          {mini.material_title}
        </Text>
        <Text style={{ color: "#FFD700", fontSize: 15, marginTop: 2 }}>
          Start on:{" "}
          <Text style={{ color: "#fffbe6" }}>{mini.starting_pitch}</Text>
        </Text>
        <Text style={{ color: "#FFD700", fontSize: 15, marginTop: 2 }}>
          Key: <Text style={{ color: "#fffbe6" }}>{mini.target_key}</Text>
        </Text>
        {mini.original_key_center && (
          <Text style={{ color: "#FFD700", fontSize: 15, marginTop: 2 }}>
            Original Key Center:{" "}
            <Text style={{ color: "#fffbe6" }}>{mini.original_key_center}</Text>
          </Text>
        )}
        <Text style={{ color: "#FFD700", fontSize: 15, marginTop: 2 }}>
          Show Notation:{" "}
          <Text style={{ color: "#fffbe6" }}>
            {mini.show_notation ? "Yes" : "No"}
          </Text>
        </Text>
        {mini.resolved_musicxml && (
          <Text style={{ color: "#FFD700", fontSize: 12, marginTop: 2 }}>
            MusicXML:{" "}
            <Text selectable style={{ color: "#fffbe6", fontSize: 10 }}>
              {mini.resolved_musicxml.slice(0, 100)}...
            </Text>
          </Text>
        )}
      </View>

      {/* Session Controls */}
      {!showReflection && !extended && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 16,
            marginBottom: 16,
          }}
        >
          <TouchableOpacity
            onPress={handleNext}
            style={{
              backgroundColor: "#FFD700",
              borderRadius: 24,
              paddingVertical: 14,
              paddingHorizontal: 32,
              marginHorizontal: 8,
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
            }}
          >
            <Text
              style={{ color: "#3b2c1a", fontWeight: "bold", fontSize: 18 }}
            >
              Next
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSkip}
            style={{
              backgroundColor: "#bfa76a",
              borderRadius: 24,
              paddingVertical: 14,
              paddingHorizontal: 32,
              marginHorizontal: 8,
            }}
          >
            <Text
              style={{ color: "#fffbe6", fontWeight: "bold", fontSize: 18 }}
            >
              Skip
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleExtend}
            style={{
              backgroundColor: "#bfa76a",
              borderRadius: 24,
              paddingVertical: 14,
              paddingHorizontal: 32,
              marginHorizontal: 8,
            }}
          >
            <Text
              style={{ color: "#fffbe6", fontWeight: "bold", fontSize: 18 }}
            >
              Extend
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Reflection Input */}
      {showReflection && (
        <View style={{ marginTop: 30, alignItems: "center", width: "100%" }}>
          <Text
            style={{
              fontSize: 18,
              color: "#FFD700",
              fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
            }}
          >
            How did that feel?
          </Text>
          <TextInput
            placeholder="Reflection or feedback..."
            value={reflection}
            onChangeText={setReflection}
            style={{
              backgroundColor: "#3b2c1a",
              color: "#FFD700",
              borderRadius: 12,
              borderWidth: 2,
              borderColor: "#FFD700",
              width: 240,
              marginVertical: 10,
              padding: 10,
              fontSize: 16,
              textAlign: "center",
              fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
            }}
            placeholderTextColor="#bfa76a"
          />
          <Text style={{ marginTop: 10, color: "#fffbe6" }}>
            Fatigue (1-5):
          </Text>
          <View style={{ flexDirection: "row", marginBottom: 10 }}>
            {[1, 2, 3, 4, 5].map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFatigueInput(f)}
                style={{
                  backgroundColor: fatigueInput === f ? "#FFD700" : "#3b2c1a",
                  borderRadius: 16,
                  padding: 10,
                  margin: 4,
                  borderWidth: 2,
                  borderColor: fatigueInput === f ? "#FFD700" : "#bfa76a",
                }}
              >
                <Text
                  style={{
                    color: fatigueInput === f ? "#3b2c1a" : "#FFD700",
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ marginTop: 10, color: "#fffbe6" }}>Rating (1-5):</Text>
          <View style={{ flexDirection: "row", marginBottom: 10 }}>
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => setRating(num)}
                style={{
                  backgroundColor: rating === num ? "#FFD700" : "#3b2c1a",
                  borderRadius: 16,
                  padding: 10,
                  margin: 4,
                  borderWidth: 2,
                  borderColor: rating === num ? "#FFD700" : "#bfa76a",
                }}
              >
                <Text
                  style={{
                    color: rating === num ? "#3b2c1a" : "#FFD700",
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={handleReflectionSubmit}
            disabled={submitting}
            style={{
              backgroundColor: submitting ? "#bfa76a" : "#FFD700",
              borderRadius: 24,
              paddingVertical: 14,
              paddingHorizontal: 40,
              marginTop: 12,
            }}
          >
            <Text
              style={{ color: "#3b2c1a", fontWeight: "bold", fontSize: 18 }}
            >
              {submitting ? "Submitting..." : "Submit Reflection"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Extended Practice */}
      {extended && (
        <View style={{ marginTop: 30, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 18,
              color: "#FFD700",
              fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
            }}
          >
            Extended Practice: Try again or explore further!
          </Text>
          <TouchableOpacity
            onPress={() => setExtended(false)}
            style={{
              backgroundColor: "#FFD700",
              borderRadius: 24,
              paddingVertical: 14,
              paddingHorizontal: 40,
              marginTop: 12,
            }}
          >
            <Text
              style={{ color: "#3b2c1a", fontWeight: "bold", fontSize: 18 }}
            >
              Done Extending
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
