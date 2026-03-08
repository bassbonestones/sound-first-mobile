/**
 * SessionScreenContent - Session screen UI connected to SessionContext
 * Uses useSession() for session state and useTools() for metronome/drone
 */
import React from "react";
import {
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Platform,
  View,
  Text,
  TextInput,
  Modal,
} from "react-native";
import Slider from "@react-native-community/slider";
import Metronome from "../../components/Metronome";
import PitchDrone from "../../components/PitchDrone";
import NotationDisplay, {
  NotationPlaceholder,
} from "../../components/NotationDisplay";
import HelpMenu from "../../components/HelpMenu";
import MiniLesson from "../../components/MiniLesson";
import AudioPlayer from "../../components/AudioPlayer";
import ResetButton from "../../components/ResetButton";
import { createShadow } from "../../styles/theme";
import { useSession } from "./context/SessionContext";
import useTools from "./hooks/useTools";
import { STEP_ICONS, STEP_LABELS } from "./data/stepTypes";

export default function SessionScreenContent() {
  // Get session state from context
  const {
    session,
    current,
    loading,
    error,
    mini,
    cooldownMode,
    earOnlyMode,
    curriculumSteps,
    currentStepIndex,
    curriculumLoading,
    strainDetected,
    rangeAttemptCount,
    getCurrentStep,
    showReflection,
    setShowReflection,
    reflection,
    setReflection,
    extended,
    setExtended,
    fatigueInput,
    setFatigueInput,
    rating,
    setRating,
    submitting,
    showHelpMenu,
    setShowHelpMenu,
    showMiniLesson,
    setShowMiniLesson,
    selectedCapabilityId,
    setSelectedCapabilityId,
    handleCompleteStep,
    handleReflectionSubmit,
    handleSkip,
    handleExtend,
    handleNext,
    navigation,
  } = useSession();

  // Get tools state from hook
  const {
    metronomeEnabled,
    setMetronomeEnabled,
    metronomeVisible,
    setMetronomeVisible,
    metronomeIsPlaying,
    setMetronomeIsPlaying,
    metronomeVolume,
    setMetronomeVolume,
    droneEnabled,
    setDroneEnabled,
    droneVisible,
    setDroneVisible,
    droneIsPlaying,
    setDroneIsPlaying,
    droneVolume,
    setDroneVolume,
    audioMuted,
    setAudioMuted,
    showVolumeModal,
    setShowVolumeModal,
    toggleMetronome,
    toggleDrone,
    startMuteLongPress,
    cancelMuteLongPress,
    handleMutePress,
  } = useTools(current);

  // Loading state
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#1a1a2e",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={{ color: "#FFD700", marginTop: 16, fontSize: 16 }}>
          Building your session...
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#1a1a2e",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ color: "#ff6b6b", fontSize: 18, textAlign: "center" }}>
          {error}
        </Text>
        <TouchableOpacity
          style={{
            marginTop: 20,
            backgroundColor: "#FFD700",
            paddingHorizontal: 30,
            paddingVertical: 12,
            borderRadius: 8,
          }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: "#1a1a2e", fontWeight: "bold", fontSize: 16 }}>
            Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No session data
  if (
    !session ||
    !session.mini_sessions ||
    session.mini_sessions.length === 0
  ) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#1a1a2e",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#FFD700", fontSize: 18 }}>
          No materials available. Try adjusting your settings.
        </Text>
        <TouchableOpacity
          style={{
            marginTop: 20,
            backgroundColor: "#FFD700",
            paddingHorizontal: 30,
            paddingVertical: 12,
            borderRadius: 8,
          }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: "#1a1a2e", fontWeight: "bold", fontSize: 16 }}>
            Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get current step from curriculum
  const currentStep = getCurrentStep();

  // Render rating row
  const renderRatingRow = () => (
    <View
      style={{
        flexDirection: "row",
        marginVertical: 12,
        justifyContent: "space-around",
        width: "100%",
      }}
    >
      {[1, 2, 3, 4, 5].map((r) => (
        <TouchableOpacity
          key={r}
          onPress={() => setRating(r)}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: rating === r ? "#FFD700" : "#333",
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 2,
            borderColor: rating === r ? "#FFD700" : "#555",
          }}
        >
          <Text
            style={{
              color: rating === r ? "#1a1a2e" : "#aaa",
              fontSize: 20,
              fontWeight: "bold",
            }}
          >
            {r}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a2e" }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 20,
          alignItems: "center",
        }}
      >
        {/* Progress indicator */}
        <View
          style={{
            width: "100%",
            height: 8,
            backgroundColor: "#333",
            borderRadius: 4,
            marginBottom: 20,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${((current + 1) / session.mini_sessions.length) * 100}%`,
              height: "100%",
              backgroundColor: "#FFD700",
              borderRadius: 4,
            }}
          />
        </View>

        {/* Session header */}
        <View style={{ marginBottom: 12, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 24,
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

        {/* Focus Card */}
        <View
          style={{
            backgroundColor: "#3b2c1a",
            borderRadius: 18,
            padding: 18,
            marginBottom: 18,
            width: 320,
            borderWidth: 2,
            borderColor: "#FFD700",
            ...createShadow("#000", 0, 4, 0.2, 8),
          }}
        >
          {mini.focus_card_category && (
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
          )}

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

          {mini.focus_card_attention_cue && (
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
                  color: "#fff",
                  fontSize: 14,
                  fontStyle: "italic",
                  lineHeight: 20,
                }}
              >
                {mini.focus_card_attention_cue}
              </Text>
            </View>
          )}

          {mini.focus_card_instruction && (
            <Text
              style={{
                color: "#ddd",
                fontSize: 13,
                marginTop: 4,
                lineHeight: 18,
              }}
            >
              {mini.focus_card_instruction}
            </Text>
          )}
        </View>

        {/* Material Card */}
        <View
          style={{
            backgroundColor: "#2a2a4a",
            borderRadius: 16,
            padding: 16,
            marginBottom: 18,
            width: 320,
            borderWidth: 1,
            borderColor: "#4a4a6a",
            ...createShadow("#000", 0, 2, 0.15, 4),
          }}
        >
          <Text
            style={{
              color: "#FFD700",
              fontSize: 18,
              fontWeight: "600",
              marginBottom: 8,
            }}
          >
            {mini.material_title || "Material"}
          </Text>

          {mini.key && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text style={{ color: "#888", fontSize: 13 }}>Key: </Text>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                {mini.key}
              </Text>
            </View>
          )}

          {/* Notation display or placeholder */}
          {mini.notation_url || mini.material_id ? (
            <NotationDisplay
              notationUrl={mini.notation_url}
              materialId={mini.material_id}
              keySignature={mini.key}
              style={{ marginTop: 8, borderRadius: 8, overflow: "hidden" }}
            />
          ) : (
            <NotationPlaceholder />
          )}
        </View>

        {/* Audio Player */}
        {mini.audio_url && (
          <View
            style={{
              width: 320,
              marginBottom: 18,
              backgroundColor: "#2a2a4a",
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: "#4a4a6a",
            }}
          >
            <AudioPlayer
              audioUrl={mini.audio_url}
              materialId={mini.material_id}
              keySignature={mini.key}
            />
          </View>
        )}

        {/* Curriculum Steps */}
        {curriculumSteps.length > 0 && (
          <View
            style={{
              width: 320,
              marginBottom: 18,
              backgroundColor: "#2a2a4a",
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: "#4a4a6a",
            }}
          >
            <Text
              style={{
                color: "#FFD700",
                fontSize: 16,
                fontWeight: "600",
                marginBottom: 12,
              }}
            >
              Curriculum Steps
            </Text>

            {curriculumSteps.map((step, idx) => {
              const isActive = idx === currentStepIndex;
              const isCompleted = step.is_completed;
              const icon = STEP_ICONS[step.type] || "📋";
              const label = STEP_LABELS[step.type] || step.type;

              return (
                <View
                  key={idx}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    marginBottom: 8,
                    borderRadius: 10,
                    backgroundColor: isActive
                      ? "#3a3a5a"
                      : isCompleted
                        ? "#2d3d2d"
                        : "#222",
                    borderWidth: isActive ? 2 : 1,
                    borderColor: isActive
                      ? "#FFD700"
                      : isCompleted
                        ? "#4CAF50"
                        : "#444",
                  }}
                >
                  <Text style={{ fontSize: 20, marginRight: 10 }}>{icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: isActive
                          ? "#FFD700"
                          : isCompleted
                            ? "#4CAF50"
                            : "#888",
                        fontSize: 14,
                        fontWeight: isActive ? "bold" : "normal",
                      }}
                    >
                      {label}
                    </Text>
                    {step.instruction && (
                      <Text
                        style={{
                          color: "#aaa",
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        {step.instruction}
                      </Text>
                    )}
                  </View>
                  {isCompleted && (
                    <Text style={{ fontSize: 16, color: "#4CAF50" }}>✓</Text>
                  )}
                </View>
              );
            })}

            {/* Step Complete Button */}
            {currentStep && !currentStep.is_completed && (
              <TouchableOpacity
                style={{
                  backgroundColor: "#FFD700",
                  borderRadius: 10,
                  paddingVertical: 14,
                  alignItems: "center",
                  marginTop: 12,
                }}
                onPress={() => handleCompleteStep(currentStepIndex, rating)}
              >
                <Text
                  style={{
                    color: "#1a1a2e",
                    fontSize: 16,
                    fontWeight: "bold",
                  }}
                >
                  Complete Step
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            width: 320,
            marginBottom: 18,
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "#333",
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: "center",
              marginRight: 8,
              borderWidth: 1,
              borderColor: "#555",
            }}
            onPress={handleSkip}
          >
            <Text style={{ color: "#aaa", fontSize: 14, fontWeight: "600" }}>
              Skip
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 2,
              backgroundColor: "#FFD700",
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: "center",
              marginLeft: 8,
            }}
            onPress={handleNext}
          >
            <Text
              style={{ color: "#1a1a2e", fontSize: 16, fontWeight: "bold" }}
            >
              {current < session.mini_sessions.length - 1 ? "Next" : "Finish"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tools Row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            width: 320,
            marginBottom: 18,
          }}
        >
          {/* Metronome Toggle */}
          <TouchableOpacity
            style={{
              backgroundColor: metronomeEnabled ? "#9C27B0" : "#333",
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 8,
              marginRight: 10,
              borderWidth: 1,
              borderColor: metronomeEnabled ? "#9C27B0" : "#555",
            }}
            onPress={toggleMetronome}
          >
            <Text
              style={{
                color: metronomeEnabled ? "#fff" : "#888",
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              🥁 Metronome
            </Text>
          </TouchableOpacity>

          {/* Drone Toggle */}
          <TouchableOpacity
            style={{
              backgroundColor: droneEnabled ? "#00BCD4" : "#333",
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 8,
              marginLeft: 10,
              borderWidth: 1,
              borderColor: droneEnabled ? "#00BCD4" : "#555",
            }}
            onPress={toggleDrone}
          >
            <Text
              style={{
                color: droneEnabled ? "#fff" : "#888",
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              🎶 Drone
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mute / Volume Control */}
        {(metronomeEnabled || droneEnabled) && (
          <Pressable
            onPressIn={startMuteLongPress}
            onPressOut={cancelMuteLongPress}
            onPress={handleMutePress}
            style={{
              backgroundColor: audioMuted ? "#ff6b6b" : "#333",
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 6,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 14 }}>
              {audioMuted ? "🔇 Unmute" : "🔊 Mute"} (hold for volume)
            </Text>
          </Pressable>
        )}

        {/* Metronome Component */}
        {metronomeEnabled && (
          <View
            style={{
              width: 320,
              marginBottom: 18,
              backgroundColor: "#2a2a4a",
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: "#9C27B0",
            }}
          >
            <Metronome
              visible={metronomeVisible}
              onVisibilityChange={setMetronomeVisible}
              onPlayStateChange={setMetronomeIsPlaying}
              muted={audioMuted}
              volume={metronomeVolume}
              initialTempo={mini.tempo || 80}
            />
          </View>
        )}

        {/* Drone Component */}
        {droneEnabled && (
          <View
            style={{
              width: 320,
              marginBottom: 18,
              backgroundColor: "#2a2a4a",
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: "#00BCD4",
            }}
          >
            <PitchDrone
              visible={droneVisible}
              onVisibilityChange={setDroneVisible}
              onPlayStateChange={setDroneIsPlaying}
              muted={audioMuted}
              volume={droneVolume}
              initialNote={mini.key || "C"}
            />
          </View>
        )}

        {/* Help Button */}
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 60,
            right: 20,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "#333",
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#555",
          }}
          onPress={() => setShowHelpMenu(true)}
        >
          <Text style={{ fontSize: 20 }}>❓</Text>
        </TouchableOpacity>

        {/* Reflection Modal */}
        <Modal
          visible={showReflection}
          animationType="slide"
          transparent={true}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.85)",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <View
              style={{
                backgroundColor: "#2a2a4a",
                borderRadius: 18,
                padding: 24,
                width: "100%",
                maxWidth: 360,
                borderWidth: 2,
                borderColor: "#FFD700",
              }}
            >
              <Text
                style={{
                  color: "#FFD700",
                  fontSize: 22,
                  fontWeight: "bold",
                  marginBottom: 16,
                  textAlign: "center",
                }}
              >
                How did it go?
              </Text>

              <Text
                style={{
                  color: "#ddd",
                  fontSize: 14,
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Rate your practice (1 = struggled, 5 = nailed it)
              </Text>

              {renderRatingRow()}

              <Text
                style={{
                  color: "#888",
                  fontSize: 13,
                  marginTop: 12,
                  marginBottom: 8,
                }}
              >
                How are you feeling? (Optional)
              </Text>

              <View style={{ flexDirection: "row", marginBottom: 16 }}>
                {["😫", "😐", "😊", "🔥"].map((emoji, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setFatigueInput(idx)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor:
                        fatigueInput === idx ? "#333" : "transparent",
                      alignItems: "center",
                      borderWidth: fatigueInput === idx ? 1 : 0,
                      borderColor: "#FFD700",
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {extended && (
                <TextInput
                  style={{
                    backgroundColor: "#1a1a2e",
                    borderRadius: 8,
                    color: "#fff",
                    padding: 12,
                    minHeight: 80,
                    textAlignVertical: "top",
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: "#444",
                  }}
                  placeholder="Notes (optional)..."
                  placeholderTextColor="#666"
                  value={reflection}
                  onChangeText={setReflection}
                  multiline
                />
              )}

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: "#333",
                    paddingVertical: 14,
                    borderRadius: 10,
                    alignItems: "center",
                    marginRight: 8,
                  }}
                  onPress={handleSkip}
                >
                  <Text style={{ color: "#888", fontSize: 14 }}>Skip</Text>
                </TouchableOpacity>

                {!extended && (
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: "#4a4a6a",
                      paddingVertical: 14,
                      borderRadius: 10,
                      alignItems: "center",
                      marginHorizontal: 8,
                    }}
                    onPress={handleExtend}
                  >
                    <Text style={{ color: "#ddd", fontSize: 14 }}>+ Notes</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={{
                    flex: 1.5,
                    backgroundColor: submitting ? "#888" : "#FFD700",
                    paddingVertical: 14,
                    borderRadius: 10,
                    alignItems: "center",
                    marginLeft: 8,
                    opacity: !rating ? 0.5 : 1,
                  }}
                  onPress={handleReflectionSubmit}
                  disabled={submitting || !rating}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#1a1a2e" />
                  ) : (
                    <Text
                      style={{
                        color: "#1a1a2e",
                        fontSize: 16,
                        fontWeight: "bold",
                      }}
                    >
                      Submit
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Help Menu Modal */}
        <HelpMenu
          visible={showHelpMenu}
          onClose={() => setShowHelpMenu(false)}
          focusCardId={mini.focus_card_id}
          capabilities={mini.capability_names || []}
          onOpenMiniLesson={(capId) => {
            setSelectedCapabilityId(capId);
            setShowHelpMenu(false);
            setShowMiniLesson(true);
          }}
        />

        {/* Mini Lesson Modal */}
        <MiniLesson
          visible={showMiniLesson}
          onClose={() => setShowMiniLesson(false)}
          capabilityId={selectedCapabilityId}
        />

        {/* Volume Control Modal */}
        <Modal
          visible={showVolumeModal}
          animationType="fade"
          transparent={true}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.85)",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <View
              style={{
                backgroundColor: "#2a2a4a",
                borderRadius: 16,
                padding: 24,
                width: "100%",
                maxWidth: 320,
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
                Volume Control
              </Text>

              {/* Metronome Volume */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    color: "#9C27B0",
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 8,
                  }}
                >
                  🥁 Metronome: {Math.round(metronomeVolume * 100)}%
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
