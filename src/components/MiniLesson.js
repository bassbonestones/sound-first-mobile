import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import { devWarn } from "../utils/devLogger";
import { baseUrl } from "../api/client";

// Step type icons for mini-lesson
const LESSON_STEP_ICONS = {
  LISTEN: "🎧",
  EXPLAIN: "📖",
  VISUAL: "👁️",
  TRY_IT: "🎯",
  QUIZ: "❓",
};

const LESSON_STEP_LABELS = {
  LISTEN: "Listen",
  EXPLAIN: "Learn",
  VISUAL: "See It",
  TRY_IT: "Try It",
  QUIZ: "Quick Check",
};

/**
 * MiniLesson - Teaches a single capability to the user
 *
 * Flow: LISTEN → EXPLAIN → VISUAL → TRY_IT → QUIZ
 */
export default function MiniLesson({
  capabilityId,
  onComplete,
  onCancel,
  userId = 1,
}) {
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);

  useEffect(() => {
    fetchLesson();
  }, [capabilityId]);

  const fetchLesson = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${baseUrl}/capabilities/${capabilityId}/lesson`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLesson(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < lesson.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleQuizAnswer = async (answer) => {
    setSelectedAnswer(answer);
    const step = lesson.steps[currentStepIndex];
    const passed = answer === step.quiz_answer;
    setQuizPassed(passed);
    setQuizSubmitted(true);

    // Record quiz result
    try {
      await fetch(`${baseUrl}/capabilities/${capabilityId}/quiz-result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          passed: passed,
          answer_given: answer,
        }),
      });
    } catch (err) {
      devWarn("Failed to record quiz result:", err);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete(quizPassed);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4a90d9" />
        <Text style={styles.loadingText}>Loading lesson...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchLesson}
          accessibilityLabel="Retry loading lesson"
          accessibilityRole="button"
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        {onCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            accessibilityLabel="Cancel lesson"
            accessibilityRole="button"
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (!lesson || !lesson.steps || lesson.steps.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No lesson content available.</Text>
        {onCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            accessibilityLabel="Close lesson"
            accessibilityRole="button"
          >
            <Text style={styles.cancelButtonText}>Close</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const currentStep = lesson.steps[currentStepIndex];
  const isLastStep = currentStepIndex === lesson.steps.length - 1;
  const isQuizStep = currentStep.step_type === "QUIZ";
  const progress = ((currentStepIndex + 1) / lesson.steps.length) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Learning: {lesson.capability_name}
        </Text>
        <Text style={styles.headerDomain}>{lesson.domain}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      {/* Step Indicators */}
      <View style={styles.stepIndicators}>
        {lesson.steps.map((step, idx) => (
          <View
            key={idx}
            style={[
              styles.stepDot,
              idx === currentStepIndex && styles.stepDotActive,
              idx < currentStepIndex && styles.stepDotCompleted,
            ]}
          >
            <Text style={styles.stepDotIcon}>
              {LESSON_STEP_ICONS[step.step_type] || "📝"}
            </Text>
          </View>
        ))}
      </View>

      {/* Step Content */}
      <ScrollView style={styles.contentContainer}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepIcon}>
            {LESSON_STEP_ICONS[currentStep.step_type] || "📝"}
          </Text>
          <Text style={styles.stepLabel}>
            {LESSON_STEP_LABELS[currentStep.step_type] || currentStep.step_type}
          </Text>
        </View>

        <Text style={styles.stepInstruction}>{currentStep.instruction}</Text>

        {/* Step Type Specific Content */}
        {currentStep.step_type === "LISTEN" && currentStep.audio_url && (
          <View style={styles.mediaContainer}>
            <TouchableOpacity
              style={styles.playButton}
              accessibilityLabel="Play audio example"
              accessibilityRole="button"
            >
              <Text style={styles.playButtonText}>▶️ Play Audio Example</Text>
            </TouchableOpacity>
            <Text style={styles.mediaHint}>
              (Audio placeholder - add real audio playback)
            </Text>
          </View>
        )}

        {currentStep.step_type === "EXPLAIN" && (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationText}>{currentStep.prompt}</Text>
          </View>
        )}

        {currentStep.step_type === "VISUAL" && currentStep.visual_url && (
          <View style={styles.mediaContainer}>
            <View style={styles.notationPlaceholder}>
              <Text style={styles.notationPlaceholderText}>
                📄 Notation Example
              </Text>
              <Text style={styles.mediaHint}>{currentStep.visual_url}</Text>
            </View>
          </View>
        )}

        {currentStep.step_type === "TRY_IT" && (
          <View style={styles.tryItContainer}>
            <Text style={styles.tryItPrompt}>{currentStep.prompt}</Text>
            <Text style={styles.tryItHint}>
              Take a moment to experiment. No pressure!
            </Text>
          </View>
        )}

        {currentStep.step_type === "QUIZ" && (
          <View style={styles.quizContainer}>
            {!quizSubmitted ? (
              <>
                {currentStep.quiz_options &&
                  JSON.parse(currentStep.quiz_options).map((option, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.quizOption,
                        selectedAnswer === option && styles.quizOptionSelected,
                      ]}
                      onPress={() => handleQuizAnswer(option)}
                      accessibilityLabel={`Quiz option ${idx + 1}: ${option}`}
                      accessibilityRole="button"
                    >
                      <Text style={styles.quizOptionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
              </>
            ) : (
              <View style={styles.quizResult}>
                {quizPassed ? (
                  <>
                    <Text style={styles.quizResultIcon}>✅</Text>
                    <Text style={styles.quizResultText}>Correct!</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.quizResultIcon}>❌</Text>
                    <Text style={styles.quizResultText}>
                      Not quite. The answer is: {currentStep.quiz_answer}
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {currentStepIndex > 0 && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={handlePrevStep}
            accessibilityLabel="Go to previous step"
            accessibilityRole="button"
          >
            <Text style={styles.navButtonText}>← Back</Text>
          </TouchableOpacity>
        )}

        <View style={styles.spacer} />

        {isLastStep && isQuizStep && quizSubmitted ? (
          <TouchableOpacity
            style={[styles.navButton, styles.completeButton]}
            onPress={handleComplete}
            accessibilityLabel="Complete lesson"
            accessibilityRole="button"
          >
            <Text style={styles.completeButtonText}>Done ✓</Text>
          </TouchableOpacity>
        ) : isLastStep && !isQuizStep ? (
          <TouchableOpacity
            style={[styles.navButton, styles.completeButton]}
            onPress={handleComplete}
            accessibilityLabel="Complete lesson"
            accessibilityRole="button"
          >
            <Text style={styles.completeButtonText}>Done ✓</Text>
          </TouchableOpacity>
        ) : (
          !isQuizStep && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={handleNextStep}
              accessibilityLabel="Go to next step"
              accessibilityRole="button"
            >
              <Text style={styles.navButtonText}>Next →</Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {/* Cancel button */}
      {onCancel && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={onCancel}
          accessibilityLabel="Skip lesson for now"
          accessibilityRole="button"
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

MiniLesson.propTypes = {
  capabilityId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  onComplete: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  userId: PropTypes.number,
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
  },
  headerDomain: {
    fontSize: 14,
    color: "#aaaaaa",
    marginTop: 4,
    textTransform: "capitalize",
  },
  progressContainer: {
    height: 4,
    backgroundColor: "#333333",
    borderRadius: 2,
    marginBottom: 16,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#4a90d9",
    borderRadius: 2,
  },
  stepIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  stepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
  },
  stepDotActive: {
    backgroundColor: "#4a90d9",
    transform: [{ scale: 1.1 }],
  },
  stepDotCompleted: {
    backgroundColor: "#2e7d32",
  },
  stepDotIcon: {
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  stepIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  stepLabel: {
    fontSize: 22,
    fontWeight: "600",
    color: "#ffffff",
  },
  stepInstruction: {
    fontSize: 18,
    color: "#cccccc",
    marginBottom: 24,
    lineHeight: 26,
  },
  mediaContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  playButton: {
    backgroundColor: "#4a90d9",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  playButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  mediaHint: {
    color: "#777777",
    fontSize: 12,
    marginTop: 8,
  },
  notationPlaceholder: {
    backgroundColor: "#1e1e1e",
    padding: 40,
    borderRadius: 12,
    alignItems: "center",
  },
  notationPlaceholderText: {
    color: "#cccccc",
    fontSize: 18,
  },
  explanationContainer: {
    backgroundColor: "#1e1e1e",
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#4a90d9",
  },
  explanationText: {
    fontSize: 18,
    color: "#ffffff",
    lineHeight: 28,
  },
  tryItContainer: {
    backgroundColor: "#1a2f1a",
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#4caf50",
  },
  tryItPrompt: {
    fontSize: 18,
    color: "#ffffff",
    marginBottom: 12,
  },
  tryItHint: {
    fontSize: 14,
    color: "#81c784",
    fontStyle: "italic",
  },
  quizContainer: {
    marginTop: 20,
  },
  quizOption: {
    backgroundColor: "#1e1e1e",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  quizOptionSelected: {
    borderColor: "#4a90d9",
    backgroundColor: "#1e3a5f",
  },
  quizOptionText: {
    fontSize: 18,
    color: "#ffffff",
    textAlign: "center",
  },
  quizResult: {
    alignItems: "center",
    padding: 24,
  },
  quizResultIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  quizResultText: {
    fontSize: 20,
    color: "#ffffff",
    textAlign: "center",
  },
  navigationContainer: {
    flexDirection: "row",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#333333",
  },
  navButton: {
    backgroundColor: "#333333",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  navButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  completeButton: {
    backgroundColor: "#2e7d32",
  },
  completeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipButtonText: {
    color: "#777777",
    fontSize: 14,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#4a90d9",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: "center",
    marginBottom: 12,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    alignSelf: "center",
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: "#777777",
    fontSize: 14,
  },
  spacer: {
    flex: 1,
  },
};
