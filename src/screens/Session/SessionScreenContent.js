/**
 * SessionScreenContent - Session screen UI connected to SessionContext
 * Uses useSession() for session state and useTools() for metronome/drone
 */
import React from "react";
import {
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  View,
  Text,
} from "react-native";
import HelpMenu from "../../components/HelpMenu";
import MiniLesson from "../../components/MiniLesson";
import ResetButton from "../../components/ResetButton";
import { useSession } from "./context/SessionContext";
import useTools from "./hooks/useTools";
import FocusCard from "./components/FocusCard";
import MaterialCard from "./components/MaterialCard";
import CurriculumSteps from "./components/CurriculumSteps";
import ToolsPanel from "./components/ToolsPanel";
import ReflectionModal from "./components/ReflectionModal";
import VolumeModal from "./components/VolumeModal";
import TeachingModuleSession from "./components/TeachingModuleSession";

import { baseUrl } from "../../api/client";

export default function SessionScreenContent() {
  // Get session state from context
  const {
    session,
    setSession,
    current,
    setCurrent,
    loading,
    error,
    mini,
    routeParams,
    cooldownMode,
    earOnlyMode,
    curriculumSteps,
    currentStepIndex,
    getCurrentStep,
    showReflection,
    reflection,
    setReflection,
    extended,
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
    metronomeVisible,
    setMetronomeVisible,
    setMetronomeIsPlaying,
    metronomeVolume,
    setMetronomeVolume,
    droneEnabled,
    droneVisible,
    setDroneVisible,
    setDroneIsPlaying,
    droneVolume,
    setDroneVolume,
    audioMuted,
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Building your session...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back</Text>
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
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          No materials available. Try adjusting your settings.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStep = getCurrentStep();

  // Check if current mini-session is a teaching module
  const isTeachingModule = mini?.session_type === "teaching_module";

  // Check if this is the last item in the session
  const isLastItem = current >= session.mini_sessions.length - 1;

  // Handle ending practice early (go home)
  const handleEndPractice = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Home" }],
    });
  };

  // Handle extending session with one more item
  const handleModuleExtend = async () => {
    console.log("[Session] handleModuleExtend called");
    console.log("[Session] current before extend:", current);
    try {
      // Fetch one more mini-session
      const url = `${baseUrl}/generate-session`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planned_duration_minutes: 5, // Short duration to get 1-2 items
          fatigue: routeParams?.fatigue || 2,
          cooldown_mode: routeParams?.cooldownMode || false,
          ear_only_mode: routeParams?.earOnlyMode || false,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to extend session");
      }

      const newSession = await response.json();
      console.log(
        "[Session] Extended session received, lesson:",
        newSession.mini_sessions?.[0]?.lesson_id,
      );

      if (newSession.mini_sessions && newSession.mini_sessions.length > 0) {
        // Append the first new mini-session to our current session
        const extendedMinis = [
          ...session.mini_sessions,
          newSession.mini_sessions[0],
        ];
        console.log(
          "[Session] Setting session with",
          extendedMinis.length,
          "items",
        );
        console.log(
          "[Session] New lesson at index",
          current + 1,
          ":",
          newSession.mini_sessions[0].lesson_id,
        );
        setSession({
          ...session,
          mini_sessions: extendedMinis,
        });
        // Move to the new item
        setCurrent(current + 1);
        console.log("[Session] current after extend:", current + 1);
      } else {
        // No more items available, end session
        navigation.navigate("SessionEnd", {
          completedCount: session.mini_sessions.length,
          totalDuration: routeParams?.duration || 20,
          sessionParams: {
            duration: routeParams?.duration || 20,
            fatigue: routeParams?.fatigue || 2,
            cooldownMode: routeParams?.cooldownMode,
            earOnlyMode: routeParams?.earOnlyMode,
          },
        });
      }
    } catch (err) {
      console.warn("[Session] Failed to extend session:", err);
      // On error, navigate to session end
      navigation.navigate("SessionEnd", {
        completedCount: session.mini_sessions.length,
        totalDuration: routeParams?.duration || 20,
        sessionParams: {
          duration: routeParams?.duration || 20,
          fatigue: routeParams?.fatigue || 2,
          cooldownMode: routeParams?.cooldownMode,
          earOnlyMode: routeParams?.earOnlyMode,
        },
      });
    }
  };

  // Handle teaching module completion
  // Record lesson completion to backend immediately when mastery achieved
  const recordLessonCompletion = async (result) => {
    console.log("[Session] recordLessonCompletion called");
    console.log("[Session] mini:", mini?.lesson_id);
    console.log("[Session] result:", JSON.stringify(result));

    if (mini?.lesson_id && result?.success) {
      try {
        const params = new URLSearchParams({
          streak: result.streak || 8,
          total_attempts: result.totalAttempts || 8,
          correct_count: result.correctCount || 8,
        });

        const url = `${baseUrl}/modules/user/1/lesson/${mini.lesson_id}/complete?${params}`;
        console.log("[Session] Calling:", url);

        const response = await fetch(url, { method: "POST" });
        const data = await response.json();
        console.log("[Session] Complete response:", JSON.stringify(data));
      } catch (err) {
        console.warn("[Session] Failed to record lesson completion:", err);
      }
    } else {
      console.log(
        "[Session] NOT recording - mini.lesson_id:",
        mini?.lesson_id,
        "result.success:",
        result?.success,
      );
    }
  };

  // Handle navigation after user clicks Continue/Finish button
  const handleModuleNavigate = () => {
    console.log(
      "[Session] handleModuleNavigate called, isLastItem:",
      isLastItem,
    );

    if (isLastItem) {
      // Navigate to session end screen
      navigation.navigate("SessionEnd", {
        completedCount: session.mini_sessions.length,
        totalDuration: routeParams?.duration || 20,
        sessionParams: {
          duration: routeParams?.duration || 20,
          fatigue: routeParams?.fatigue || 2,
          cooldownMode: routeParams?.cooldownMode,
          earOnlyMode: routeParams?.earOnlyMode,
        },
      });
    } else {
      // Move to next mini-session
      setCurrent(current + 1);
    }
  };

  // Teaching Module Session
  if (isTeachingModule) {
    return (
      <View style={styles.container}>
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${((current + 1) / session.mini_sessions.length) * 100}%`,
              },
            ]}
          />
        </View>

        <TeachingModuleSession
          key={`teaching-module-${current}`}
          mini={mini}
          userResonantNote={session.user_resonant_note}
          onRecordCompletion={recordLessonCompletion}
          onNavigate={handleModuleNavigate}
          onSkip={handleSkip}
          onEndPractice={handleEndPractice}
          onExtend={handleModuleExtend}
          isLastItem={isLastItem}
        />
      </View>
    );
  }

  // Material-based session (existing UI)
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${((current + 1) / session.mini_sessions.length) * 100}%`,
              },
            ]}
          />
        </View>

        {/* Session header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>
            Practice Session {current + 1} / {session.mini_sessions.length}
          </Text>
        </View>

        {/* Mode Indicator Banner */}
        {(cooldownMode || earOnlyMode) && (
          <View
            style={[
              styles.modeBanner,
              earOnlyMode ? styles.earOnlyBanner : styles.cooldownBanner,
            ]}
          >
            <Text style={styles.modeBannerIcon}>
              {earOnlyMode ? "👂" : "🌿"}
            </Text>
            <Text style={styles.modeBannerTitle}>
              {earOnlyMode ? "Ear Training Mode" : "Cooldown Mode"}
            </Text>
            <Text style={styles.modeBannerSubtitle}>
              {earOnlyMode ? "Listen & sing only" : "Light playing"}
            </Text>
          </View>
        )}

        {/* Focus Card */}
        <FocusCard mini={mini} />

        {/* Material Card with Notation & Audio */}
        <MaterialCard mini={mini} />

        {/* Curriculum Steps */}
        <CurriculumSteps
          curriculumSteps={curriculumSteps}
          currentStepIndex={currentStepIndex}
          currentStep={currentStep}
          rating={rating}
          onCompleteStep={handleCompleteStep}
        />

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {current < session.mini_sessions.length - 1 ? "Next" : "Finish"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tools Panel (Metronome/Drone) */}
        <ToolsPanel
          mini={mini}
          metronomeEnabled={metronomeEnabled}
          droneEnabled={droneEnabled}
          metronomeVisible={metronomeVisible}
          setMetronomeVisible={setMetronomeVisible}
          setMetronomeIsPlaying={setMetronomeIsPlaying}
          droneVisible={droneVisible}
          setDroneVisible={setDroneVisible}
          setDroneIsPlaying={setDroneIsPlaying}
          audioMuted={audioMuted}
          metronomeVolume={metronomeVolume}
          droneVolume={droneVolume}
          toggleMetronome={toggleMetronome}
          toggleDrone={toggleDrone}
          startMuteLongPress={startMuteLongPress}
          cancelMuteLongPress={cancelMuteLongPress}
          handleMutePress={handleMutePress}
        />

        {/* Help Button */}
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => setShowHelpMenu(true)}
        >
          <Text style={{ fontSize: 20 }}>❓</Text>
        </TouchableOpacity>

        {/* Reflection Modal */}
        <ReflectionModal
          visible={showReflection}
          rating={rating}
          setRating={setRating}
          fatigueInput={fatigueInput}
          setFatigueInput={setFatigueInput}
          extended={extended}
          reflection={reflection}
          setReflection={setReflection}
          submitting={submitting}
          onSkip={handleSkip}
          onExtend={handleExtend}
          onSubmit={handleReflectionSubmit}
          onEndPractice={handleEndPractice}
          isLastItem={isLastItem}
        />

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
        <VolumeModal
          visible={showVolumeModal}
          onClose={() => setShowVolumeModal(false)}
          metronomeVolume={metronomeVolume}
          setMetronomeVolume={setMetronomeVolume}
          droneVolume={droneVolume}
          setDroneVolume={setDroneVolume}
        />
      </ScrollView>
      <ResetButton />
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================
const styles = {
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    alignItems: "center",
  },
  centered: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    color: "#FFD700",
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 18,
    textAlign: "center",
  },
  emptyText: {
    color: "#FFD700",
    fontSize: 18,
  },
  backButton: {
    marginTop: 20,
    backgroundColor: "#FFD700",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#1a1a2e",
    fontWeight: "bold",
    fontSize: 16,
  },
  progressContainer: {
    width: "100%",
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    marginBottom: 20,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#FFD700",
    borderRadius: 4,
  },
  header: {
    marginBottom: 12,
    alignItems: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFD700",
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
  },
  modeBanner: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    width: 320,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  earOnlyBanner: {
    backgroundColor: "#2d2d4d",
    borderColor: "#6b6bbb",
  },
  cooldownBanner: {
    backgroundColor: "#2d3d2d",
    borderColor: "#6b8b6b",
  },
  modeBannerIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  modeBannerTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  modeBannerSubtitle: {
    color: "#aaa",
    fontSize: 12,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 320,
    marginBottom: 18,
  },
  skipButton: {
    flex: 1,
    backgroundColor: "#333",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#555",
  },
  skipButtonText: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "600",
  },
  nextButton: {
    flex: 2,
    backgroundColor: "#FFD700",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginLeft: 8,
  },
  nextButtonText: {
    color: "#1a1a2e",
    fontSize: 16,
    fontWeight: "bold",
  },
  helpButton: {
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
  },
};
