import React, { useState, useEffect, useRef } from "react";
import {
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Platform,
  View,
  Text,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import Slider from "@react-native-community/slider";
import Metronome from "../components/Metronome";
import PitchDrone from "../components/PitchDrone";
import NotationDisplay, {
  NotationPlaceholder,
} from "../components/NotationDisplay";
import HelpMenu from "../components/HelpMenu";
import MiniLesson from "../components/MiniLesson";
import AudioPlayer from "../components/AudioPlayer";
import ResetButton from "../components/ResetButton";
import { baseUrl } from "../src/api/client";

function getBackendUrl(selfDirected = false) {
  const endpoint = selfDirected
    ? "generate-self-directed-session"
    : "generate-session";
  return `${baseUrl}/${endpoint}`;
}

// Step type icons for curriculum display
const STEP_ICONS = {
  LISTEN: "🎧",
  SING: "🎤",
  IMAGINE: "💭",
  PLAY: "🎹",
  REFLECT: "💡",
  RECOVERY: "😮‍💨",
};

const STEP_LABELS = {
  LISTEN: "Listen",
  SING: "Sing",
  IMAGINE: "Imagine",
  PLAY: "Play",
  REFLECT: "Reflect",
  RECOVERY: "Recovery",
};

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

  // Curriculum step state
  const [curriculumSteps, setCurriculumSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [strainDetected, setStrainDetected] = useState(false);
  const [rangeAttemptCount, setRangeAttemptCount] = useState(0);

  // Help menu and mini-lesson state
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [showMiniLesson, setShowMiniLesson] = useState(false);
  const [selectedCapabilityId, setSelectedCapabilityId] = useState(null);

  // Metronome state - available as optional tool for all materials
  // metronomeEnabled = whether the metronome component is mounted
  // metronomeVisible = whether the UI panel is shown
  // metronomeIsPlaying = whether the metronome is actually ticking
  // audioMuted = whether audio is muted (visual keeps running)
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [metronomeVisible, setMetronomeVisible] = useState(false);
  const [metronomeIsPlaying, setMetronomeIsPlaying] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);

  // Pitch Drone state - same pattern as metronome
  const [droneEnabled, setDroneEnabled] = useState(false);
  const [droneVisible, setDroneVisible] = useState(false);
  const [droneIsPlaying, setDroneIsPlaying] = useState(false);

  // Volume controls (0-1 scale)
  const [metronomeVolume, setMetronomeVolume] = useState(0.5);
  const [droneVolume, setDroneVolume] = useState(0.5);
  const [showVolumeModal, setShowVolumeModal] = useState(false);

  // Long-press timer ref for mute button
  const longPressTimerRef = useRef(null);

  // Reset metronome and drone when mini-session changes
  useEffect(() => {
    setMetronomeEnabled(false);
    setMetronomeVisible(false);
    setMetronomeIsPlaying(false);
    setDroneEnabled(false);
    setDroneVisible(false);
    setDroneIsPlaying(false);
    setAudioMuted(false);
  }, [current]);

  // Variable assignments after hooks
  const duration = route?.params?.duration || 20;
  const fatigue = route?.params?.fatigue || 2;
  const selfDirected = route?.params?.selfDirected || false;
  const cooldownMode = route?.params?.cooldownMode || false;
  const earOnlyMode = route?.params?.earOnlyMode || false;
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
      body = JSON.stringify({
        planned_duration_minutes: duration,
        fatigue,
        cooldown_mode: cooldownMode,
        ear_only_mode: earOnlyMode,
      });
    }
    console.log("[SessionScreen] About to fetch:", url, body);
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    })
      .then(async (res) => {
        console.log("[SessionScreen] Fetch response status:", res.status);
        if (!res.ok) {
          // Try to get error detail from response
          let errorDetail = `HTTP ${res.status}`;
          try {
            const errorData = await res.json();
            if (errorData.detail) {
              errorDetail = errorData.detail;
            }
          } catch (e) {
            // Couldn't parse error JSON, use status code
          }
          throw new Error(errorDetail);
        }
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
    cooldownMode,
    earOnlyMode,
    material_id,
    focus_card_id,
    goal,
    route?.params?.sessionKey,
  ]);

  // Load curriculum steps when mini-session changes
  useEffect(() => {
    if (!session || !session.mini_sessions || !session.mini_sessions[current])
      return;

    const mini = session.mini_sessions[current];
    if (!mini.mini_session_id) {
      // No mini_session_id from backend, use simple flow
      setCurriculumSteps([]);
      return;
    }

    setCurriculumLoading(true);
    const baseUrl =
      Platform.OS === "web"
        ? `http://${window.location.hostname}:8000`
        : `http://${LOCAL_IP}:8000`;

    fetch(`${baseUrl}/mini-sessions/${mini.mini_session_id}/curriculum`)
      .then((res) =>
        res.ok ? res.json() : Promise.reject("Failed to load curriculum"),
      )
      .then((data) => {
        setCurriculumSteps(data.steps || []);
        setCurrentStepIndex(data.current_step_index || 0);
        setCurriculumLoading(false);
      })
      .catch((err) => {
        console.warn("[SessionScreen] Curriculum load error:", err);
        setCurriculumSteps([]);
        setCurriculumLoading(false);
      });
  }, [session, current]);

  // Handle step completion
  const handleCompleteStep = async (
    stepIndex,
    stepRating = null,
    strain = false,
  ) => {
    const mini = session?.mini_sessions?.[current];
    if (!mini?.mini_session_id) return;

    const baseUrl =
      Platform.OS === "web"
        ? `http://${window.location.hostname}:8000`
        : `http://${LOCAL_IP}:8000`;

    try {
      const res = await fetch(
        `${baseUrl}/mini-sessions/${mini.mini_session_id}/steps/${stepIndex}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating: stepRating, strain_detected: strain }),
        },
      );

      const data = await res.json();

      // Track attempt count for range work
      if (data.attempt_count !== undefined) {
        setRangeAttemptCount(data.attempt_count);
      }

      if (data.status === "strain_detected") {
        setStrainDetected(true);
        Alert.alert("⚠️ Range Safety", data.message, [
          { text: "OK", onPress: () => handleSkip() },
        ]);
      } else if (data.status === "max_attempts") {
        Alert.alert(
          "Range Work Complete",
          `${data.message}\n\nYou made ${data.attempt_count} attempts. Consider resting before more range work.`,
          [{ text: "Continue", onPress: () => setShowReflection(true) }],
        );
        setCurriculumSteps((prev) =>
          prev.map((s, i) =>
            i === stepIndex
              ? { ...s, is_completed: true, rating: stepRating }
              : s,
          ),
        );
      } else if (data.status === "next_step") {
        // Update step completion state
        setCurriculumSteps((prev) =>
          prev.map((s, i) =>
            i === stepIndex
              ? { ...s, is_completed: true, rating: stepRating }
              : s,
          ),
        );
        setCurrentStepIndex(data.next_step_index);

        // Warn if approaching max attempts for range work
        if (data.is_range_work && data.attempt_count === 2) {
          Alert.alert(
            "Range Check",
            "This is your last attempt before auto-recovery. Only continue if you feel comfortable.",
            [{ text: "Got it" }],
          );
        }
      } else if (data.status === "completed") {
        setCurriculumSteps((prev) =>
          prev.map((s, i) =>
            i === stepIndex
              ? { ...s, is_completed: true, rating: stepRating }
              : s,
          ),
        );
        setShowReflection(true);
      }
    } catch (err) {
      console.error("[SessionScreen] Step completion error:", err);
    }
  };

  // Get current curriculum step
  const getCurrentStep = () => {
    if (curriculumSteps.length === 0) return null;
    return curriculumSteps[currentStepIndex] || null;
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ fontSize: 48, marginBottom: 16 }}>😕</Text>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: "#333",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          Couldn't start session
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "#666",
            textAlign: "center",
            marginBottom: 24,
            lineHeight: 20,
          }}
        >
          {error}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: "#2196F3",
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
          }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

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
      const baseUrl =
        Platform.OS === "web"
          ? `http://${window.location.hostname}:8000`
          : `http://${LOCAL_IP}:8000`;
      const res = await fetch(`${baseUrl}/practice-attempt`, {
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
      // Reset curriculum state for next mini-session
      setCurriculumSteps([]);
      setCurrentStepIndex(0);
      setStrainDetected(false);
      setRangeAttemptCount(0);
      if (current < session.mini_sessions.length - 1) setCurrent(current + 1);
      else navigation.navigate("StartPractice");
    }
  };

  const handleSkip = () => {
    setShowReflection(false);
    setReflection("");
    setExtended(false);
    // Reset curriculum state for next mini-session
    setCurriculumSteps([]);
    setCurrentStepIndex(0);
    setStrainDetected(false);
    setRangeAttemptCount(0);
    if (current < session.mini_sessions.length - 1) setCurrent(current + 1);
    else navigation.navigate("StartPractice");
  };

  const handleExtend = () => {
    setExtended(true);
    setShowReflection(false);
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
        {/* Practice Session Header + Dev Tools */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            marginBottom: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate("Admin")}
            style={{
              backgroundColor: "#2a2a4a",
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
              marginRight: 12,
            }}
          >
            <Text
              style={{ color: "#4facfe", fontSize: 12, fontWeight: "bold" }}
            >
              🛠️ Admin
            </Text>
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: "#FFD700",
              fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
            }}
          >
            Practice Session {current + 1} / {session.mini_sessions.length}
          </Text>
        </View>

        {/* Mode Indicator Banner */}
        {(cooldownMode || earOnlyMode) && (
          <View
            style={{
              backgroundColor: earOnlyMode ? "#2d2d4d" : "#2d3d2d",
              borderRadius: 12,
              padding: 10,
              marginBottom: 12,
              width: 320,
              borderWidth: 1,
              borderColor: earOnlyMode ? "#6b6bbb" : "#6b8b6b",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 18, marginRight: 8 }}>
              {earOnlyMode ? "👂" : "🌿"}
            </Text>
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "bold" }}>
              {earOnlyMode ? "Ear Training Mode" : "Cooldown Mode"}
            </Text>
            <Text style={{ color: "#aaa", fontSize: 12, marginLeft: 8 }}>
              {earOnlyMode ? "Listen & sing only" : "Light playing"}
            </Text>
          </View>
        )}

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
          {/* Category Badge */}
          {mini.focus_card_category ? (
            <View
              style={{
                backgroundColor: "#FFD700",
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 4,
                alignSelf: "flex-start",
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  color: "#3b2c1a",
                  fontSize: 12,
                  fontWeight: "bold",
                  fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
                }}
              >
                {mini.focus_card_category}
              </Text>
            </View>
          ) : null}

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

          {/* Attention Cue - Primary focus instruction */}
          {mini.focus_card_attention_cue ? (
            <View
              style={{
                backgroundColor: "#4a3a2a",
                borderRadius: 10,
                padding: 12,
                marginVertical: 8,
                borderLeftWidth: 3,
                borderLeftColor: "#FFD700",
              }}
            >
              <Text
                style={{
                  color: "#fffbe6",
                  fontSize: 16,
                  fontWeight: "600",
                  fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
                  lineHeight: 22,
                }}
              >
                {mini.focus_card_attention_cue}
              </Text>
            </View>
          ) : null}

          {/* Micro Cues - Quick reminders */}
          {mini.focus_card_micro_cues &&
          mini.focus_card_micro_cues.length > 0 ? (
            <View style={{ marginTop: 8 }}>
              <Text
                style={{
                  color: "#bfa76a",
                  fontSize: 12,
                  marginBottom: 6,
                  fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
                }}
              >
                MICRO CUES
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {mini.focus_card_micro_cues.map((cue, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: "#2d232e",
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      marginRight: 8,
                      marginBottom: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFD700",
                        fontSize: 13,
                        fontFamily:
                          Platform.OS === "ios" ? "Baskerville" : "serif",
                      }}
                    >
                      {cue}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {mini.focus_card_description ? (
            <Text
              style={{
                color: "#fffbe6",
                fontSize: 14,
                marginTop: 8,
                fontStyle: "italic",
                fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
              }}
            >
              {mini.focus_card_description}
            </Text>
          ) : null}

          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: "#5a4a3a",
              marginTop: 12,
              paddingTop: 10,
            }}
          >
            <Text
              style={{
                color: "#fffbe6",
                fontSize: 16,
                fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
              }}
            >
              Goal:{" "}
              <Text style={{ color: "#FFD700", fontWeight: "bold" }}>
                {mini.goal_label}
              </Text>
            </Text>
          </View>
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
              <Text style={{ color: "#fffbe6" }}>
                {mini.original_key_center}
              </Text>
            </Text>
          )}
          <Text style={{ color: "#FFD700", fontSize: 15, marginTop: 2 }}>
            Show Notation:{" "}
            <Text style={{ color: "#fffbe6" }}>
              {mini.show_notation ? "Yes" : "No"}
            </Text>
          </Text>

          {/* Notation Display */}
          {mini.show_notation && mini.resolved_musicxml ? (
            <View style={{ marginTop: 12 }}>
              <NotationDisplay
                musicxml={mini.resolved_musicxml}
                width={290}
                height={120}
              />
            </View>
          ) : !mini.show_notation ? (
            <View style={{ marginTop: 12 }}>
              <NotationPlaceholder message="Practice by ear - notation hidden" />
            </View>
          ) : null}
        </View>

        {/* Metronome - shows for tempo_build goals OR when user toggles it on */}
        {/* Keep mounted when enabled so audio continues; hide by positioning offscreen */}
        {(mini.goal_type === "tempo_build" || metronomeEnabled) && (
          <View
            style={{
              backgroundColor: "#2d232e",
              borderRadius: 14,
              padding: 14,
              marginBottom:
                mini.goal_type === "tempo_build" || metronomeVisible ? 14 : 0,
              width: 320,
              borderWidth: 2,
              borderColor:
                mini.goal_type === "tempo_build" ? "#FF9800" : "#9C27B0",
              // Hide by making it invisible and collapsing height when not visible
              // This keeps the component mounted and audio playing
              ...(!(mini.goal_type === "tempo_build" || metronomeVisible) && {
                height: 0,
                overflow: "hidden",
                opacity: 0,
                padding: 0,
                margin: 0,
                borderWidth: 0,
              }),
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  color:
                    mini.goal_type === "tempo_build" ? "#FF9800" : "#9C27B0",
                  fontSize: 16,
                  fontWeight: "bold",
                }}
              >
                {mini.goal_type === "tempo_build"
                  ? "⏱️ Tempo Build Mode"
                  : "🎵 Metronome"}
              </Text>
              {mini.goal_type !== "tempo_build" && (
                <TouchableOpacity onPress={() => setMetronomeVisible(false)}>
                  <Text style={{ color: "#888", fontSize: 18 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <Metronome
              initialBpm={80}
              minBpm={40}
              maxBpm={350}
              beatsPerMeasure={4}
              showControls={true}
              muted={audioMuted}
              volume={metronomeVolume}
              droneVolume={droneVolume}
              onPlayingChange={setMetronomeIsPlaying}
              onMuteChange={setAudioMuted}
              onVolumeChange={setMetronomeVolume}
              onDroneVolumeChange={setDroneVolume}
            />
          </View>
        )}

        {/* Pitch Drone - shows when user toggles it on */}
        {droneEnabled && (
          <View
            style={{
              backgroundColor: "#2d232e",
              borderRadius: 14,
              padding: 14,
              marginBottom: droneVisible ? 14 : 0,
              width: 320,
              borderWidth: 2,
              borderColor: "#00BCD4",
              // Hide by making it invisible and collapsing height when not visible
              ...(!droneVisible && {
                height: 0,
                overflow: "hidden",
                opacity: 0,
                padding: 0,
                margin: 0,
                borderWidth: 0,
              }),
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  color: "#00BCD4",
                  fontSize: 16,
                  fontWeight: "bold",
                }}
              >
                🎶 Pitch Drone
              </Text>
              <TouchableOpacity onPress={() => setDroneVisible(false)}>
                <Text style={{ color: "#888", fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <PitchDrone
              muted={audioMuted}
              volume={droneVolume}
              metronomeVolume={metronomeVolume}
              onPlayingChange={setDroneIsPlaying}
              onMuteChange={setAudioMuted}
              onVolumeChange={setDroneVolume}
              onMetronomeVolumeChange={setMetronomeVolume}
            />
          </View>
        )}

        {/* Session Controls */}
        {!showReflection && !extended && (
          <View style={{ width: 320 }}>
            {/* Curriculum Step Progress Bar */}
            {curriculumSteps.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}
                >
                  {curriculumSteps.map((step, index) => (
                    <View
                      key={index}
                      style={{
                        alignItems: "center",
                        marginHorizontal: 4,
                        opacity: index === currentStepIndex ? 1 : 0.5,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: step.is_completed
                            ? "#4CAF50"
                            : index === currentStepIndex
                              ? "#FFD700"
                              : "#3b2c1a",
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          justifyContent: "center",
                          alignItems: "center",
                          borderWidth: 2,
                          borderColor:
                            index === currentStepIndex ? "#FFD700" : "#5a4a3a",
                        }}
                      >
                        <Text style={{ fontSize: 16 }}>
                          {STEP_ICONS[step.step_type] || "📋"}
                        </Text>
                      </View>
                      <Text
                        style={{
                          color:
                            index === currentStepIndex ? "#FFD700" : "#bfa76a",
                          fontSize: 10,
                          marginTop: 2,
                          fontFamily:
                            Platform.OS === "ios" ? "Baskerville" : "serif",
                        }}
                      >
                        {STEP_LABELS[step.step_type] || step.step_type}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Current Step Instruction Card */}
            {getCurrentStep() && (
              <View
                style={{
                  backgroundColor: "#4a3a2a",
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 16,
                  borderWidth: 2,
                  borderColor: "#FFD700",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontSize: 24, marginRight: 8 }}>
                    {STEP_ICONS[getCurrentStep().step_type]}
                  </Text>
                  <Text
                    style={{
                      color: "#FFD700",
                      fontSize: 18,
                      fontWeight: "bold",
                      fontFamily:
                        Platform.OS === "ios" ? "Baskerville" : "serif",
                    }}
                  >
                    {STEP_LABELS[getCurrentStep().step_type]}
                  </Text>
                </View>
                <Text
                  style={{
                    color: "#fffbe6",
                    fontSize: 16,
                    lineHeight: 24,
                    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
                  }}
                >
                  {getCurrentStep().instruction}
                </Text>
                {getCurrentStep().prompt ? (
                  <Text
                    style={{
                      color: "#bfa76a",
                      fontSize: 14,
                      marginTop: 8,
                      fontStyle: "italic",
                      fontFamily:
                        Platform.OS === "ios" ? "Baskerville" : "serif",
                    }}
                  >
                    {getCurrentStep().prompt}
                  </Text>
                ) : null}

                {/* Audio Player for LISTEN steps */}
                {getCurrentStep().step_type === "LISTEN" && (
                  <View style={{ marginTop: 16 }}>
                    <AudioPlayer
                      materialId={mini?.material_id}
                      targetKey={mini?.target_key}
                      instrument="piano" // TODO: get from user profile
                      title="Listen to the model phrase"
                      accentColor="#FFD700"
                    />
                  </View>
                )}

                {/* Range Work Safety Panel */}
                {getCurrentStep().step_type === "PLAY" &&
                  mini.goal_type === "range_expansion" && (
                    <View
                      style={{
                        marginTop: 16,
                        backgroundColor:
                          rangeAttemptCount >= 2 ? "#4a1c1c" : "#2d2d3d",
                        borderRadius: 12,
                        padding: 14,
                        borderWidth: 2,
                        borderColor:
                          rangeAttemptCount >= 2 ? "#ff6b6b" : "#4a4a6a",
                      }}
                    >
                      {/* Attempt Counter */}
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 10,
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "bold",
                            fontSize: 14,
                          }}
                        >
                          🎯 Range Attempt
                        </Text>
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          {[1, 2, 3].map((n) => (
                            <View
                              key={n}
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                backgroundColor:
                                  n <= rangeAttemptCount
                                    ? "#ff6b6b"
                                    : "#3d3d5d",
                                marginLeft: 6,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Text
                                style={{
                                  color: "#fff",
                                  fontSize: 12,
                                  fontWeight: "bold",
                                }}
                              >
                                {n}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>

                      {rangeAttemptCount >= 2 && (
                        <Text
                          style={{
                            color: "#ff9999",
                            fontSize: 12,
                            marginBottom: 10,
                            textAlign: "center",
                          }}
                        >
                          ⚡ Final attempt - listen to your body
                        </Text>
                      )}

                      {/* Strain Button */}
                      <TouchableOpacity
                        onPress={() =>
                          handleCompleteStep(currentStepIndex, null, true)
                        }
                        style={{
                          backgroundColor: "#b71c1c",
                          borderRadius: 8,
                          padding: 12,
                          alignItems: "center",
                          flexDirection: "row",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "bold",
                            fontSize: 15,
                          }}
                        >
                          ⚠️ Felt Strain - Stop Now
                        </Text>
                      </TouchableOpacity>

                      <Text
                        style={{
                          color: "#999",
                          fontSize: 11,
                          textAlign: "center",
                          marginTop: 8,
                        }}
                      >
                        Tap if you feel any discomfort. Your safety is priority
                        #1.
                      </Text>
                    </View>
                  )}
              </View>
            )}

            {/* Step Navigation Buttons */}
            <View style={{ flexDirection: "row", justifyContent: "center" }}>
              {curriculumSteps.length > 0 ? (
                <TouchableOpacity
                  onPress={() => handleCompleteStep(currentStepIndex)}
                  disabled={curriculumLoading}
                  style={{
                    backgroundColor: curriculumLoading ? "#bfa76a" : "#FFD700",
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
                    style={{
                      color: "#3b2c1a",
                      fontWeight: "bold",
                      fontSize: 18,
                    }}
                  >
                    {currentStepIndex === curriculumSteps.length - 1
                      ? "Complete"
                      : "Next Step"}
                  </Text>
                </TouchableOpacity>
              ) : (
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
                    style={{
                      color: "#3b2c1a",
                      fontWeight: "bold",
                      fontSize: 18,
                    }}
                  >
                    Next
                  </Text>
                </TouchableOpacity>
              )}
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
            <Text style={{ marginTop: 10, color: "#fffbe6" }}>
              Rating (1-5):
            </Text>
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

        {/* Tool Buttons - Help and Metronome */}
        {mini && mini.material_id && (
          <View
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              flexDirection: "row",
              zIndex: 100,
            }}
          >
            {/* Metronome Toggle Button - only show if not tempo_build (which shows it automatically) */}
            {/* Disabled when drone panel is open (mutually exclusive) */}
            {mini.goal_type !== "tempo_build" && (
              <TouchableOpacity
                onPress={() => {
                  if (droneVisible) return; // Disabled when drone is open
                  console.log(
                    "[SessionScreen] Metronome toggle pressed, enabled:",
                    metronomeEnabled,
                    "visible:",
                    metronomeVisible,
                  );
                  if (!metronomeVisible) {
                    // Showing the metronome - also enable it if not already
                    setMetronomeVisible(true);
                    setMetronomeEnabled(true);
                  } else {
                    // Hiding the metronome UI - but it keeps playing
                    setMetronomeVisible(false);
                  }
                }}
                accessibilityLabel="Toggle Metronome"
                accessibilityHint={
                  droneVisible
                    ? "Close drone panel first"
                    : "Show or hide the metronome tool"
                }
                {...(Platform.OS === "web"
                  ? {
                      title: droneVisible
                        ? "Close drone panel first"
                        : metronomeIsPlaying
                          ? "Metronome running (tap to show/hide)"
                          : "Toggle Metronome",
                    }
                  : {})}
                style={{
                  backgroundColor: metronomeIsPlaying ? "#9C27B0" : "#333",
                  borderRadius: 24,
                  padding: 12,
                  marginRight: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 2 },
                  opacity: droneVisible ? 0.4 : 1,
                }}
              >
                <Text style={{ fontSize: 18 }}>🎵</Text>
              </TouchableOpacity>
            )}

            {/* Pitch Drone Toggle Button */}
            {/* Disabled when metronome panel is open (mutually exclusive) */}
            <TouchableOpacity
              onPress={() => {
                if (metronomeVisible) return; // Disabled when metronome is open
                console.log(
                  "[SessionScreen] Drone toggle pressed, enabled:",
                  droneEnabled,
                  "visible:",
                  droneVisible,
                );
                if (!droneVisible) {
                  setDroneVisible(true);
                  setDroneEnabled(true);
                } else {
                  setDroneVisible(false);
                }
              }}
              accessibilityLabel="Toggle Pitch Drone"
              accessibilityHint={
                metronomeVisible
                  ? "Close metronome panel first"
                  : "Show or hide the pitch drone tool"
              }
              {...(Platform.OS === "web"
                ? {
                    title: metronomeVisible
                      ? "Close metronome panel first"
                      : droneIsPlaying
                        ? "Drone playing (tap to show/hide)"
                        : "Toggle Pitch Drone",
                  }
                : {})}
              style={{
                backgroundColor: droneIsPlaying ? "#00BCD4" : "#333",
                borderRadius: 24,
                padding: 12,
                marginRight: 8,
                flexDirection: "row",
                alignItems: "center",
                shadowColor: "#000",
                shadowOpacity: 0.3,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
                opacity: metronomeVisible ? 0.4 : 1,
              }}
            >
              <Text style={{ fontSize: 18 }}>🎶</Text>
            </TouchableOpacity>

            {/* Mute Button - only show when metronome or drone is playing */}
            {/* Tap to toggle mute, long-press for volume controls */}
            {(metronomeIsPlaying || droneIsPlaying) && (
              <Pressable
                onPress={() => setAudioMuted(!audioMuted)}
                onLongPress={() => setShowVolumeModal(true)}
                delayLongPress={400}
                accessibilityLabel={audioMuted ? "Unmute" : "Mute"}
                accessibilityHint="Tap to mute/unmute, hold for volume controls"
                {...(Platform.OS === "web"
                  ? { title: "Tap: mute/unmute | Hold: volume controls" }
                  : {})}
                style={({ pressed }) => ({
                  backgroundColor: audioMuted
                    ? "#c0392b"
                    : pressed
                      ? "#444"
                      : "#333",
                  borderRadius: 24,
                  padding: 12,
                  marginRight: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 2 },
                })}
              >
                <Text style={{ fontSize: 18 }}>{audioMuted ? "🔇" : "🔊"}</Text>
              </Pressable>
            )}

            {/* Help Button */}
            <TouchableOpacity
              onPress={() => setShowHelpMenu(true)}
              style={{
                backgroundColor: "#333",
                borderRadius: 24,
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                shadowColor: "#000",
                shadowOpacity: 0.3,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              <Text style={{ fontSize: 18, marginRight: 4 }}>📚</Text>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                Help
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Help Menu Modal */}
        <HelpMenu
          visible={showHelpMenu}
          onClose={() => setShowHelpMenu(false)}
          materialId={mini?.material_id}
          onSelectCapability={(cap) => {
            setShowHelpMenu(false);
            setSelectedCapabilityId(cap.id);
            setShowMiniLesson(true);
          }}
        />

        {/* Mini-Lesson Modal */}
        <Modal
          visible={showMiniLesson}
          animationType="slide"
          onRequestClose={() => setShowMiniLesson(false)}
        >
          <MiniLesson
            capabilityId={selectedCapabilityId}
            userId={1}
            onComplete={(passed) => {
              setShowMiniLesson(false);
              setSelectedCapabilityId(null);
            }}
            onCancel={() => {
              setShowMiniLesson(false);
              setSelectedCapabilityId(null);
            }}
          />
        </Modal>

        {/* Volume Control Modal - appears on long-press of mute button */}
        <Modal
          visible={showVolumeModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowVolumeModal(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.7)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "#2d232e",
                borderRadius: 16,
                padding: 24,
                width: 300,
                shadowColor: "#000",
                shadowOpacity: 0.5,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 10,
              }}
            >
              <Text
                style={{
                  color: "#FFD700",
                  fontSize: 18,
                  fontWeight: "bold",
                  marginBottom: 20,
                  textAlign: "center",
                }}
              >
                🔊 Volume Controls
              </Text>

              {/* Metronome Volume */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    color: "#9C27B0",
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 8,
                  }}
                >
                  🎵 Metronome: {Math.round(metronomeVolume * 100)}%
                </Text>
                <Slider
                  style={{ width: "100%", height: 40 }}
                  minimumValue={0}
                  maximumValue={1}
                  value={metronomeVolume}
                  onValueChange={setMetronomeVolume}
                  minimumTrackTintColor="#9C27B0"
                  maximumTrackTintColor="#444"
                  thumbTintColor="#9C27B0"
                />
              </View>

              {/* Drone Volume */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    color: "#00BCD4",
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 8,
                  }}
                >
                  🎶 Drone: {Math.round(droneVolume * 100)}%
                </Text>
                <Slider
                  style={{ width: "100%", height: 40 }}
                  minimumValue={0}
                  maximumValue={1}
                  value={droneVolume}
                  onValueChange={setDroneVolume}
                  minimumTrackTintColor="#00BCD4"
                  maximumTrackTintColor="#444"
                  thumbTintColor="#00BCD4"
                />
              </View>

              {/* Close Button */}
              <TouchableOpacity
                onPress={() => setShowVolumeModal(false)}
                style={{
                  backgroundColor: "#FFD700",
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "#1a1a2e", fontWeight: "bold", fontSize: 16 }}
                >
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
      <ResetButton />
    </View>
  );
}
