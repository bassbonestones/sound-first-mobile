/**
 * ExerciseTestScreen - Test exercises in isolation
 *
 * Quick way to test exercises without going through full session flow.
 */
import React, { useState, useMemo } from "react";
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
  WholeNoteLessonExercise,
} from "./Session/components/exercises";
import {
  getAvailablePatterns,
  PATTERNS_UP,
  PATTERNS_DOWN,
} from "../constants/rangeExpansionPatterns";
import StaffNotePicker from "../components/StaffNotePicker";

// Note/MIDI conversion helpers
const CHROMATIC_NOTES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
const FLAT_EQUIVALENTS = {
  "C#": "Db",
  "D#": "Eb",
  "F#": "Gb",
  "G#": "Ab",
  "A#": "Bb",
};

function parseNoteName(noteName) {
  if (!noteName) return null;
  const match = noteName.match(/^([A-Ga-g])([#b]?)(\d)$/);
  if (!match) return null;
  const [, letter, accidental, octaveStr] = match;
  return {
    letter: letter.toUpperCase(),
    accidental,
    octave: parseInt(octaveStr, 10),
  };
}

function noteToMidi(noteName) {
  const parsed = parseNoteName(noteName);
  if (!parsed) return 60;
  const letterIndex = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[
    parsed.letter
  ];
  let noteIndex = letterIndex;
  if (parsed.accidental === "#") noteIndex += 1;
  if (parsed.accidental === "b") noteIndex -= 1;
  return (parsed.octave + 1) * 12 + noteIndex;
}

/**
 * Lower a note chromatically while preserving the letter name.
 * Used for "di" → "do" relationships where di is a raised do.
 * B → Bb, C# → C, D → Db, etc.
 */
function chromaticLower(noteName) {
  const parsed = parseNoteName(noteName);
  if (!parsed) return noteName;

  let newAccidental;
  if (parsed.accidental === "#") {
    newAccidental = ""; // sharp becomes natural
  } else if (parsed.accidental === "b") {
    newAccidental = "bb"; // flat becomes double-flat (rare)
  } else {
    newAccidental = "b"; // natural becomes flat
  }

  return `${parsed.letter}${newAccidental}${parsed.octave}`;
}

function midiToNote(midi, preferFlats = true) {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  let noteName = CHROMATIC_NOTES[noteIndex];
  if (preferFlats && FLAT_EQUIVALENTS[noteName]) {
    noteName = FLAT_EQUIVALENTS[noteName];
  }
  return `${noteName}${octave}`;
}

// Smarter sharp/flat decision based on context
// Returns the best enharmonic spelling for a MIDI note given a reference note
function midiToNoteInContext(midi, referenceNote) {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  const sharpName = CHROMATIC_NOTES[noteIndex];
  const flatName = FLAT_EQUIVALENTS[sharpName] || sharpName;

  // If it's a natural note (no enharmonic choice), just return it
  if (sharpName === flatName) {
    return `${sharpName}${octave}`;
  }

  // Get reference base (letter + accidental, without octave)
  const refBase = referenceNote ? referenceNote.replace(/\d+$/, "") : "";

  // If reference already uses flat spelling (e.g., Eb), keep using flats
  if (refBase.includes("b")) {
    return `${flatName}${octave}`;
  }

  // If reference already uses sharp spelling (e.g., F#), keep using sharps
  if (refBase.includes("#")) {
    return `${sharpName}${octave}`;
  }

  // Get reference letter (without accidental or octave)
  const refLetter = referenceNote ? referenceNote.charAt(0).toUpperCase() : "";

  // If the sharp spelling would have the same letter as reference (e.g., D → D#),
  // that's musically awkward - use the flat spelling instead (Eb)
  if (sharpName.charAt(0) === refLetter) {
    return `${flatName}${octave}`;
  }

  // Default: use sharp/flat preference based on key context
  const useFlats = !shouldUseSharps(referenceNote);
  if (useFlats) {
    return `${flatName}${octave}`;
  }
  return `${sharpName}${octave}`;
}

// Determine if we should use sharps based on the root note
// Sharp keys: G, D, A, E, B, F#, C# (and their relative minors)
// Also use sharps if the note itself has a sharp
function shouldUseSharps(noteName) {
  if (!noteName) return false;
  if (noteName.includes("#")) return true;
  const letter = noteName.charAt(0).toUpperCase();
  // Natural notes that typically use sharps in their key signatures
  const sharpRoots = ["G", "D", "A", "E", "B"];
  return sharpRoots.includes(letter);
}

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
  {
    id: "whole_note_lesson",
    name: "Whole Note Lesson",
    icon: "🎵",
    description: "Learn the whole note: 4 beats, ends on the next ONE",
    component: WholeNoteLessonExercise,
    config: { bpm: 60 },
    mastery: { correct_streak: 3 },
    extraProps: {
      userFirstNote: "F3",
    },
  },
];

export default function ExerciseTestScreen() {
  const navigation = useNavigation();
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [result, setResult] = useState(null);

  // Range expansion config picker state
  const [selectedClef, setSelectedClef] = useState("treble");
  const [selectedTargetNote, setSelectedTargetNote] = useState("B3"); // Target pitch (new note to reach)
  const [selectedPatternId, setSelectedPatternId] = useState(null);
  const [showRangeConfig, setShowRangeConfig] = useState(false);
  const [pendingExercise, setPendingExercise] = useState(null);

  // Get patterns available for the pending exercise direction
  const availablePatterns = useMemo(() => {
    if (!pendingExercise) return [];
    const direction = pendingExercise.extraProps?.direction;
    return direction === "up" ? PATTERNS_UP : PATTERNS_DOWN;
  }, [pendingExercise]);

  // Auto-select first pattern when direction changes
  React.useEffect(() => {
    if (availablePatterns.length > 0 && !selectedPatternId) {
      setSelectedPatternId(availablePatterns[0].id);
    }
  }, [availablePatterns]);

  // Get the selected pattern
  const selectedPattern = useMemo(() => {
    if (!selectedPatternId || availablePatterns.length === 0) return null;
    return availablePatterns.find((p) => p.id === selectedPatternId);
  }, [selectedPatternId, availablePatterns]);

  // Calculate anchor note from target note based on pattern's targetInterval
  // The target note is the NEW note (highest for up, lowest for down)
  // The anchor is calculated by subtracting the pattern's targetInterval
  const anchorNote = useMemo(() => {
    if (!selectedPattern) return selectedTargetNote;

    // Special case: for chromatic raising patterns (di = raised do),
    // use chromaticLower to preserve the letter name (B → Bb, not A#)
    if (
      selectedPattern.direction === "up" &&
      selectedPattern.targetInterval === 1
    ) {
      return chromaticLower(selectedTargetNote);
    }

    const targetMidi = noteToMidi(selectedTargetNote);
    // targetInterval is positive for up patterns (e.g., 1, 2), negative for down (e.g., -1, -2)
    // anchor = target - targetInterval
    // For up: target=Bb, interval=2 → anchor = Bb - 2 = Ab
    // For down: target=D, interval=-1 → anchor = D - (-1) = Eb (not D#)
    const anchorMidi = targetMidi - selectedPattern.targetInterval;
    return midiToNoteInContext(anchorMidi, selectedTargetNote);
  }, [selectedTargetNote, selectedPattern]);

  // Calculate the actual starting pitch (first note of the pattern)
  // This uses anchor + first interval
  const startingPitch = useMemo(() => {
    if (!selectedPattern) return anchorNote;
    const firstInterval = selectedPattern.intervals[0] || 0;
    // If starting on the anchor (interval 0), use anchorNote directly
    // to preserve its spelling (e.g., Bb not A#)
    if (firstInterval === 0) return anchorNote;
    const anchorMidi = noteToMidi(anchorNote);
    return midiToNoteInContext(anchorMidi + firstInterval, anchorNote);
  }, [anchorNote, selectedPattern]);

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

  // Handle exercise selection - show config picker for range expansion
  const handleSelectExercise = (exercise) => {
    if (exercise.id.startsWith("range_expansion")) {
      setPendingExercise(exercise);
      setSelectedPatternId(null); // Reset pattern selection
      setShowRangeConfig(true);
    } else {
      setSelectedExercise(exercise);
    }
  };

  // Start range expansion with selected config
  const handleStartWithConfig = () => {
    if (pendingExercise && selectedPatternId) {
      const pattern = availablePatterns.find((p) => p.id === selectedPatternId);
      setSelectedExercise({
        ...pendingExercise,
        extraProps: {
          ...pendingExercise.extraProps,
          clef: selectedClef,
          userRangeLow: anchorNote,
          userRangeHigh: anchorNote,
          forcedPatternId: selectedPatternId,
        },
      });
      setShowRangeConfig(false);
      setPendingExercise(null);
    }
  };

  // Show range expansion config picker
  if (showRangeConfig && pendingExercise) {
    const selectedPattern = availablePatterns.find(
      (p) => p.id === selectedPatternId,
    );
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setShowRangeConfig(false);
              setPendingExercise(null);
            }}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Configure Exercise</Text>
        </View>

        <View style={{ flex: 1 }}>
          <ScrollView
            style={styles.configScroll}
            contentContainerStyle={styles.configContent}
          >
            <Text style={styles.configTitle}>
              {pendingExercise.icon} {pendingExercise.name}
            </Text>

            {/* Clef Selection */}
            <Text style={styles.sectionLabel}>Clef</Text>
            <View style={styles.optionRow}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedClef === "treble" && styles.optionButtonSelected,
                ]}
                onPress={() => setSelectedClef("treble")}
              >
                <Text style={styles.optionSymbol}>𝄞</Text>
                <Text style={styles.optionLabel}>Treble</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedClef === "bass" && styles.optionButtonSelected,
                ]}
                onPress={() => setSelectedClef("bass")}
              >
                <Text style={styles.optionSymbol}>𝄢</Text>
                <Text style={styles.optionLabel}>Bass</Text>
              </TouchableOpacity>
            </View>

            {/* Target Pitch Selection with Staff */}
            <Text style={styles.sectionLabel}>
              Target Pitch (new note to reach)
            </Text>
            <View style={styles.staffPickerContainer}>
              <StaffNotePicker
                clef={selectedClef}
                value={selectedTargetNote}
                onChange={setSelectedTargetNote}
              />
            </View>
            <Text style={styles.anchorLabel}>Starting from: {startingPitch}</Text>

            {/* Pattern Selection */}
            <Text style={styles.sectionLabel}>Exercise Pattern</Text>
            <View style={styles.patternList}>
              {availablePatterns.map((pattern) => (
                <TouchableOpacity
                  key={pattern.id}
                  style={[
                    styles.patternCard,
                    selectedPatternId === pattern.id &&
                      styles.patternCardSelected,
                  ]}
                  onPress={() => setSelectedPatternId(pattern.id)}
                >
                  <View style={styles.patternHeader}>
                    <Text style={styles.patternName}>{pattern.name}</Text>
                    <Text style={styles.patternSolfege}>{pattern.solfege}</Text>
                  </View>
                  <Text style={styles.patternDescription}>
                    {pattern.description}
                  </Text>
                  <Text style={styles.patternIntervals}>
                    Intervals: [{pattern.intervals.join(", ")}]
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Fixed Start Button */}
          <View style={styles.fixedBottomButton}>
            <TouchableOpacity
              style={[
                styles.startButton,
                !selectedPatternId && styles.startButtonDisabled,
              ]}
              onPress={handleStartWithConfig}
              disabled={!selectedPatternId}
            >
              <Text style={styles.startButtonText}>Start Exercise</Text>
            </TouchableOpacity>
          </View>
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
        <Text style={styles.menuSubtitle}>Test exercises in isolation</Text>

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
    alignItems: "center",
  },
  startButtonDisabled: {
    backgroundColor: "#555",
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  fixedBottomButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
    backgroundColor: "#1a1410",
    borderTopWidth: 1,
    borderTopColor: "#3b2c1a",
    alignItems: "center",
  },
  // Config picker styles
  configScroll: {
    flex: 1,
  },
  configContent: {
    padding: 20,
  },
  configTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#aaa",
    marginTop: 16,
    marginBottom: 12,
  },
  anchorLabel: {
    fontSize: 14,
    color: "#4CAF50",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  optionButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    minWidth: 100,
  },
  optionButtonSelected: {
    borderColor: "#4CAF50",
    backgroundColor: "#2a3a2a",
  },
  optionSymbol: {
    fontSize: 32,
    color: "#fff",
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
  },
  staffPickerContainer: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
  },
  patternList: {
    gap: 12,
  },
  patternCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  patternCardSelected: {
    borderColor: "#4CAF50",
    backgroundColor: "#2a3a2a",
  },
  patternHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  patternName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  patternSolfege: {
    fontSize: 14,
    color: "#4CAF50",
    fontStyle: "italic",
  },
  patternDescription: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 6,
  },
  patternIntervals: {
    fontSize: 12,
    color: "#666",
    fontFamily: "monospace",
  },
});
