/**
 * ExerciseTestScreen - Test exercises in isolation
 *
 * Quick way to test exercises without going through full session flow.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

// Exercise components
import {
  TapAlongExercise,
  StartOnCueExercise,
  FeelThePulseExercise,
  RangeExpansionExercise,
} from "./Session/components/exercises";

const EXERCISES = [
  {
    id: "feel_the_pulse",
    name: "Feel the Pulse",
    icon: "👂",
    description: "Continue the beat internally after clicks stop",
    component: FeelThePulseExercise,
    config: {
      bpm: 72,
      prep_beats: 2,
      listening_beats: 8,
      silent_beats: 4,
    },
    mastery: { correct_streak: 3 },
  },
  {
    id: "tap_along",
    name: "Tap Along",
    icon: "👆",
    description: "Tap in time with the beat",
    component: TapAlongExercise,
    config: { bpm: 72 },
    mastery: { correct_streak: 8 },
  },
  {
    id: "start_on_cue",
    name: "Enter on One",
    icon: "🎵",
    description: "Play your note on beat 1",
    component: StartOnCueExercise,
    config: { bpm: 60 },
    mastery: { correct_streak: 3 },
  },
  {
    id: "range_expansion_up",
    name: "Expand Range (Up)",
    icon: "⬆️",
    description: "Extend your high note by one half step",
    component: RangeExpansionExercise,
    config: {},
    mastery: { correct_streak: 3 },
    extraProps: {
      direction: "up",
      userRangeLow: "Bb3",
      userRangeHigh: "Bb3",
      clef: "treble",
    },
  },
  {
    id: "range_expansion_down",
    name: "Expand Range (Down)",
    icon: "⬇️",
    description: "Extend your low note by one half step",
    component: RangeExpansionExercise,
    config: {},
    mastery: { correct_streak: 3 },
    extraProps: {
      direction: "down",
      userRangeLow: "Bb3",
      userRangeHigh: "Bb3",
      clef: "treble",
    },
  },
];

export default function ExerciseTestScreen() {
  const navigation = useNavigation();
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [result, setResult] = useState(null);
  const [selectedClef, setSelectedClef] = useState("treble");
  const [showClefPicker, setShowClefPicker] = useState(false);
  const [pendingExercise, setPendingExercise] = useState(null);

  const handleComplete = (exerciseResult) => {
    console.log("[ExerciseTest] Complete:", exerciseResult);
    setResult(exerciseResult);
    // Go back to menu after 2 seconds
    setTimeout(() => {
      setSelectedExercise(null);
      setResult(null);
    }, 2000);
  };

  const handleProgress = (progress) => {
    console.log("[ExerciseTest] Progress:", progress);
  };

  // Handle exercise selection - show clef picker for range expansion
  const handleSelectExercise = (exercise) => {
    if (exercise.id.startsWith("range_expansion")) {
      setPendingExercise(exercise);
      setShowClefPicker(true);
    } else {
      setSelectedExercise(exercise);
    }
  };

  // Start range expansion with selected clef
  const handleStartWithClef = () => {
    if (pendingExercise) {
      setSelectedExercise({
        ...pendingExercise,
        extraProps: {
          ...pendingExercise.extraProps,
          clef: selectedClef,
        },
      });
      setShowClefPicker(false);
      setPendingExercise(null);
    }
  };

  // Show clef picker
  if (showClefPicker && pendingExercise) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setShowClefPicker(false);
              setPendingExercise(null);
            }}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Clef</Text>
        </View>

        <View style={styles.clefPickerContainer}>
          <Text style={styles.clefPickerTitle}>
            {pendingExercise.icon} {pendingExercise.name}
          </Text>
          <Text style={styles.clefPickerSubtitle}>
            Choose your instrument's clef:
          </Text>

          <View style={styles.clefOptions}>
            <TouchableOpacity
              style={[
                styles.clefOption,
                selectedClef === "treble" && styles.clefOptionSelected,
              ]}
              onPress={() => setSelectedClef("treble")}
            >
              <Text style={styles.clefSymbol}>𝄞</Text>
              <Text style={styles.clefLabel}>Treble</Text>
              <Text style={styles.clefInstruments}>
                Trumpet, Sax, Flute, Violin, etc.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.clefOption,
                selectedClef === "bass" && styles.clefOptionSelected,
              ]}
              onPress={() => setSelectedClef("bass")}
            >
              <Text style={styles.clefSymbol}>𝄢</Text>
              <Text style={styles.clefLabel}>Bass</Text>
              <Text style={styles.clefInstruments}>
                Trombone, Tuba, Bass, Cello, etc.
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartWithClef}
          >
            <Text style={styles.startButtonText}>Start Exercise</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show exercise
  if (selectedExercise) {
    const ExerciseComponent = selectedExercise.component;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.exerciseHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedExercise(null)}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.exerciseTitle}>
            {selectedExercise.icon} {selectedExercise.name}
          </Text>
        </View>

        {result ? (
          <View style={styles.resultContainer}>
            <Text style={styles.resultIcon}>
              {result.success ? "🎉" : "🔄"}
            </Text>
            <Text style={styles.resultText}>
              {result.success ? "Exercise Complete!" : "Try Again"}
            </Text>
          </View>
        ) : (
          <View style={styles.exerciseContainer}>
            <ExerciseComponent
              config={selectedExercise.config}
              mastery={selectedExercise.mastery}
              onComplete={handleComplete}
              onProgress={handleProgress}
              {...(selectedExercise.extraProps || {})}
            />
          </View>
        )}
      </SafeAreaView>
    );
  }

  // Show exercise menu
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Home</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exercise Tester</Text>
      </View>

      <ScrollView style={styles.menuScroll}>
        <Text style={styles.menuSubtitle}>
          Test exercises in isolation
        </Text>

        {EXERCISES.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={styles.exerciseCard}
            onPress={() => handleSelectExercise(exercise)}
          >
            <View style={styles.exerciseIconContainer}>
              <Text style={styles.exerciseIcon}>{exercise.icon}</Text>
            </View>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseDescription}>
                {exercise.description}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    color: "#4a9eff",
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  menuScroll: {
    flex: 1,
    padding: 16,
  },
  menuSubtitle: {
    fontSize: 14,
    color: "#888",
    marginBottom: 20,
  },
  exerciseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exerciseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  exerciseIcon: {
    fontSize: 24,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  exerciseDescription: {
    fontSize: 14,
    color: "#888",
  },
  chevron: {
    fontSize: 24,
    color: "#666",
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  exerciseContainer: {
    flex: 1,
  },
  resultContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  resultIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  resultText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  // Clef picker styles
  clefPickerContainer: {
    flex: 1,
    padding: 24,
    alignItems: "center",
  },
  clefPickerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  clefPickerSubtitle: {
    fontSize: 16,
    color: "#888",
    marginBottom: 32,
  },
  clefOptions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 32,
  },
  clefOption: {
    width: 150,
    padding: 20,
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  clefOptionSelected: {
    borderColor: "#4CAF50",
    backgroundColor: "#2a3a2a",
  },
  clefSymbol: {
    fontSize: 48,
    color: "#fff",
    marginBottom: 8,
  },
  clefLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  clefInstruments: {
    fontSize: 11,
    color: "#888",
    textAlign: "center",
  },
  startButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
});
