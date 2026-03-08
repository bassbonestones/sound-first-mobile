/**
 * CurriculumSteps - Displays curriculum steps with completion status
 */
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { STEP_ICONS, STEP_LABELS } from "../data/stepTypes";

export default function CurriculumSteps({
  curriculumSteps,
  currentStepIndex,
  currentStep,
  rating,
  onCompleteStep,
}) {
  if (curriculumSteps.length === 0) {
    return null;
  }

  return (
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
          onPress={() => onCompleteStep(currentStepIndex, rating)}
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
  );
}
