/**
 * CurriculumSteps - Displays curriculum steps with completion status
 */
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { STEP_ICONS, STEP_LABELS } from "../data/stepTypes";
import { styles, colors } from "./styles";

interface CurriculumStep {
  type: string;
  is_completed?: boolean;
  instruction?: string;
}

interface CurriculumStepsProps {
  curriculumSteps: CurriculumStep[];
  currentStepIndex: number;
  currentStep?: CurriculumStep | null;
  rating?: number | null;
  onCompleteStep: (stepIndex: number, rating?: number | null) => void;
}

export default function CurriculumSteps({
  curriculumSteps,
  currentStepIndex,
  currentStep,
  rating,
  onCompleteStep,
}: CurriculumStepsProps) {
  if (curriculumSteps.length === 0) {
    return null;
  }

  const getStepItemStyle = (isActive, isCompleted) => [
    styles.stepItem,
    isActive && styles.stepItemActive,
    isCompleted && !isActive && styles.stepItemCompleted,
    !isActive && !isCompleted && styles.stepItemDefault,
  ];

  const getStepLabelStyle = (isActive, isCompleted) => [
    styles.stepLabel,
    isActive && styles.stepLabelActive,
    isCompleted && !isActive && styles.stepLabelCompleted,
    !isActive && !isCompleted && styles.stepLabelDefault,
  ];

  return (
    <View style={styles.cardContainer}>
      <Text style={styles.cardTitle}>Curriculum Steps</Text>

      {curriculumSteps.map((step, idx) => {
        const isActive = idx === currentStepIndex;
        const isCompleted = step.is_completed;
        const icon = STEP_ICONS[step.type] || "📋";
        const label = STEP_LABELS[step.type] || step.type;

        return (
          <View key={idx} style={getStepItemStyle(isActive, isCompleted)}>
            <Text style={styles.stepIcon}>{icon}</Text>
            <View style={styles.stepContent}>
              <Text style={getStepLabelStyle(isActive, isCompleted)}>
                {label}
              </Text>
              {step.instruction && (
                <Text style={styles.stepInstruction}>{step.instruction}</Text>
              )}
            </View>
            {isCompleted && <Text style={styles.stepCheckmark}>✓</Text>}
          </View>
        );
      })}

      {/* Step Complete Button */}
      {currentStep && !currentStep.is_completed && (
        <TouchableOpacity
          style={styles.completeStepButton}
          onPress={() => onCompleteStep(currentStepIndex, rating)}
          accessibilityLabel="Complete current step"
          accessibilityRole="button"
        >
          <Text style={styles.completeStepButtonText}>Complete Step</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
