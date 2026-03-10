/**
 * TeachingModuleSession - Interactive teaching module lessons
 *
 * Renders the appropriate exercise component based on exercise_template_id
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
} from "react-native";
import { getExerciseComponent } from "./exercises";

/**
 * Intro screen shown before starting the exercise
 */
function LessonIntro({ mini, onStart, onSkip, onEndPractice }) {
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  return (
    <View style={styles.introContainer}>
      {/* Module Header */}
      <View style={styles.moduleHeader}>
        <Text style={styles.moduleLabel}>Teaching Module</Text>
        <Text style={styles.moduleName}>{mini.module_display_name}</Text>
      </View>

      {/* Lesson Card */}
      <View style={styles.lessonCard}>
        <Text style={styles.lessonIcon}>👂</Text>
        <Text style={styles.lessonName}>{mini.lesson_display_name}</Text>
        <Text style={styles.lessonDescription}>{mini.lesson_description}</Text>
      </View>

      {/* Hints */}
      {mini.hints && mini.hints.length > 0 && (
        <View style={styles.hintsCard}>
          <Text style={styles.hintsTitle}>💡 Tips</Text>
          {mini.hints.map((hint, index) => (
            <Text key={index} style={styles.hint}>
              • {hint}
            </Text>
          ))}
        </View>
      )}

      {/* Goal info */}
      <View style={styles.goalCard}>
        <Text style={styles.goalTitle}>🎯 Your Goal</Text>
        <Text style={styles.goalText}>
          Get {mini.mastery_config?.correct_streak || 8} correct answers in a
          row
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.startButton} onPress={onStart}>
          <Text style={styles.startButtonText}>Start Exercise</Text>
        </TouchableOpacity>
      </View>

      {/* End Practice Button */}
      <TouchableOpacity
        style={styles.endPracticeIntroButton}
        onPress={() => setShowEndConfirm(true)}
      >
        <Text style={styles.endPracticeIntroText}>End Practice</Text>
      </TouchableOpacity>

      {/* Capability Info */}
      <View style={styles.capabilityInfo}>
        <Text style={styles.capabilityLabel}>
          Building skill:{" "}
          <Text style={styles.capabilityName}>{mini.capability_name}</Text>
        </Text>
      </View>

      {/* End Practice Confirmation Modal */}
      <Modal
        visible={showEndConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEndConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>End Practice?</Text>
            <Text style={styles.modalText}>
             Your progress on completed exercises has been saved.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowEndConfirm(false)}
              >
                <Text style={styles.modalCancelText}>Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={onEndPractice}
              >
                <Text style={styles.modalConfirmText}>End Practice</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/**
 * Completion screen shown after mastering the exercise
 */
function LessonComplete({
  mini,
  result,
  onContinue,
  onEndPractice,
  onExtend,
  isLastItem,
}) {
  return (
    <View style={styles.completeContainer}>
      <Text style={styles.completeIcon}>🎉</Text>
      <Text style={styles.completeTitle}>Lesson Complete!</Text>
      <Text style={styles.completeLesson}>{mini.lesson_display_name}</Text>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Your Results</Text>
        <Text style={styles.statItem}>
          ✅ {result?.correctCount || 0} correct answers
        </Text>
        <Text style={styles.statItem}>
          📊 {result?.totalAttempts || 0} total attempts
        </Text>
        <Text style={styles.statItem}>
          🔥 {result?.streak || 0} final streak
        </Text>
      </View>

      <View style={styles.completeButtons}>
        {isLastItem ? (
          <>
            {/* When last item, show Extend and Finish options */}
            <TouchableOpacity style={styles.extendButton} onPress={onExtend}>
              <Text style={styles.extendButtonText}>+ Extend One More</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.finishButton} onPress={onContinue}>
              <Text style={styles.finishButtonText}>Finish Session</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* When not last item, show Continue and End Practice */}
            <TouchableOpacity
              style={styles.continueButton}
              onPress={onContinue}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.endPracticeButton}
              onPress={onEndPractice}
            >
              <Text style={styles.endPracticeButtonText}>End Practice</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

/**
 * Fallback for unsupported exercise types
 */
function UnsupportedExercise({ mini, onComplete, onSkip }) {
  return (
    <View style={styles.unsupportedContainer}>
      <Text style={styles.unsupportedIcon}>🚧</Text>
      <Text style={styles.unsupportedTitle}>Coming Soon</Text>
      <Text style={styles.unsupportedText}>
        The "{mini.exercise_template_id}" exercise type is not yet implemented.
      </Text>
      <Text style={styles.unsupportedLesson}>
        Lesson: {mini.lesson_display_name}
      </Text>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => onComplete({ success: true, skipped: true })}
        >
          <Text style={styles.startButtonText}>Mark Complete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Main component - manages lesson flow state
 */
export default function TeachingModuleSession({
  mini,
  userResonantNote,
  onRecordCompletion,
  onNavigate,
  onSkip,
  onEndPractice,
  onExtend,
  isLastItem,
}) {
  const [phase, setPhase] = useState("intro"); // 'intro' | 'exercise' | 'complete' | 'closing'
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState({ streak: 0, masteryRequired: 8 });

  // Get the exercise component for this lesson
  const ExerciseComponent = getExerciseComponent(mini.exercise_template_id);

  // Handle starting the exercise
  const handleStart = useCallback(() => {
    setPhase("exercise");
  }, []);

  // Handle closing/exiting - unmounts exercise BEFORE calling onSkip
  const handleClose = useCallback(() => {
    console.log("[TeachingModule] Closing - setting phase to closing");
    setPhase("closing");
    // Small delay to ensure exercise unmounts before navigation
    setTimeout(() => {
      onSkip?.();
    }, 50);
  }, [onSkip]);

  // Handle exercise completion (mastery achieved)
  // Record completion immediately to backend - don't wait for button clicks
  const handleExerciseComplete = useCallback(
    (exerciseResult) => {
      console.log(
        "[TeachingModule] Exercise complete, recording immediately:",
        exerciseResult,
      );
      setResult(exerciseResult);
      setPhase("complete");
      // Record completion right away, before user decides what to do next
      onRecordCompletion?.(exerciseResult);
    },
    [onRecordCompletion],
  );

  // Handle progress updates during exercise
  const handleProgress = useCallback((progressData) => {
    setProgress(progressData);
  }, []);

  // Handle continuing after completion (navigation only - completion already recorded)
  const handleContinue = useCallback(() => {
    console.log("[TeachingModule] handleContinue - navigating");
    onNavigate?.();
  }, [onNavigate]);

  // Dev skip handler - simulates completing with 8 correct in a row
  const handleDevSkip = useCallback(() => {
    handleExerciseComplete({
      success: true,
      streak: 8,
      totalAttempts: 8,
      correctCount: 8,
    });
  }, [handleExerciseComplete]);

  // Render based on phase
  if (phase === "intro") {
    return (
      <SafeAreaView style={styles.container}>
        <LessonIntro
          mini={mini}
          onStart={handleStart}
          onSkip={onSkip}
          onEndPractice={onEndPractice}
        />
      </SafeAreaView>
    );
  }

  if (phase === "complete") {
    return (
      <SafeAreaView style={styles.container}>
        <LessonComplete
          mini={mini}
          result={result}
          onContinue={handleContinue}
          onEndPractice={onEndPractice}
          onExtend={onExtend}
          isLastItem={isLastItem}
        />
      </SafeAreaView>
    );
  }

  // Closing phase - show nothing while exercise unmounts
  if (phase === "closing") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.closingContainer}>
          <Text style={styles.closingText}>Closing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Exercise phase
  if (!ExerciseComponent) {
    return (
      <SafeAreaView style={styles.container}>
        <UnsupportedExercise
          mini={mini}
          onComplete={handleExerciseComplete}
          onSkip={onSkip}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Exercise header */}
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseHeaderTitle}>
          {mini.lesson_display_name}
        </Text>
        <View style={styles.headerButtons}>
          {/* Dev skip button */}
          <TouchableOpacity
            style={styles.devSkipButton}
            onPress={handleDevSkip}
          >
            <Text style={styles.devSkipButtonText}>⏭ Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exitButton} onPress={handleClose}>
            <Text style={styles.exitButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Exercise component */}
      <ExerciseComponent
        config={mini.exercise_config}
        mastery={mini.mastery_config}
        onComplete={handleExerciseComplete}
        onProgress={handleProgress}
        userFirstNote={userResonantNote || "F3"}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },

  // Closing state
  closingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  closingText: {
    fontSize: 16,
    color: "#888",
  },

  // Intro styles
  introContainer: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  moduleHeader: {
    alignItems: "center",
    paddingVertical: 16,
    marginBottom: 16,
  },
  moduleLabel: {
    fontSize: 12,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  moduleName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFD700",
    marginTop: 4,
  },
  lessonCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  lessonIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  lessonName: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  lessonDescription: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 22,
  },
  hintsCard: {
    backgroundColor: "#2d3a2d",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  hintsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#a8d4a8",
    marginBottom: 12,
  },
  hint: {
    fontSize: 15,
    color: "#c8e8c8",
    marginBottom: 6,
    paddingLeft: 4,
  },
  goalCard: {
    backgroundColor: "#1e3a5f",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: "center",
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7eb8da",
    marginBottom: 8,
  },
  goalText: {
    fontSize: 18,
    color: "#fff",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  skipButton: {
    flex: 1,
    backgroundColor: "#444",
    padding: 16,
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
  },
  skipButtonText: {
    color: "#aaa",
    fontSize: 16,
    fontWeight: "600",
  },
  startButton: {
    flex: 2,
    backgroundColor: "#FFD700",
    padding: 16,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: "center",
  },
  startButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  capabilityInfo: {
    alignItems: "center",
  },
  capabilityLabel: {
    fontSize: 13,
    color: "#666",
  },
  capabilityName: {
    color: "#888",
    fontWeight: "500",
  },

  // Exercise header
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  exerciseHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFD700",
  },
  exitButton: {
    padding: 8,
  },
  exitButtonText: {
    fontSize: 20,
    color: "#888",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  devSkipButton: {
    backgroundColor: "#333",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#555",
  },
  devSkipButtonText: {
    fontSize: 12,
    color: "#888",
  },

  // Complete styles
  completeContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  completeIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  completeTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 8,
  },
  completeLesson: {
    fontSize: 18,
    color: "#aaa",
    marginBottom: 32,
  },
  statsCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    marginBottom: 32,
  },
  statsTitle: {
    fontSize: 16,
    color: "#888",
    marginBottom: 16,
    textAlign: "center",
  },
  statItem: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 8,
  },
  completeButtons: {
    width: "100%",
    gap: 12,
  },
  continueButton: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  continueButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
  endPracticeButton: {
    backgroundColor: "transparent",
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#666",
    alignItems: "center",
  },
  endPracticeButtonText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "500",
  },
  extendButton: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  extendButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
  finishButton: {
    backgroundColor: "transparent",
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#666",
    alignItems: "center",
  },
  finishButtonText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "500",
  },

  // Unsupported styles
  unsupportedContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  unsupportedIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  unsupportedTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 12,
  },
  unsupportedText: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 8,
  },
  unsupportedLesson: {
    fontSize: 14,
    color: "#666",
    marginBottom: 32,
  },

  // End practice intro button
  endPracticeIntroButton: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 8,
    backgroundColor: "#2a2a2a",
  },
  endPracticeIntroText: {
    color: "#aaa",
    fontSize: 15,
    fontWeight: "500",
  },

  // Confirmation modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#444",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: "#c0392b",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  modalConfirmText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
