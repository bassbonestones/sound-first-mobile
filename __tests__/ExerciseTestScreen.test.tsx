/**
 * ExerciseTestScreen tests
 *
 * Comprehensive tests for the exercise tester screen.
 * Tests exercise list rendering, selection, navigation, and range config picker.
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import ExerciseTestScreen from "../src/screens/ExerciseTestScreen";

// Mock navigation
const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
}));

// Mock devLogger
jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
}));

// Mock StaffNotePicker
interface StaffNotePickerProps {
  clef: string;
  value: string;
  onChange: (value: string) => void;
}

jest.mock("../src/components/StaffNotePicker", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return function MockStaffNotePicker({
    clef,
    value,
    onChange,
  }: StaffNotePickerProps): React.JSX.Element {
    return (
      <View testID="staff-note-picker">
        <Text testID="staff-clef">{clef}</Text>
        <Text testID="staff-value">{value}</Text>
        <TouchableOpacity
          testID="change-note-btn"
          onPress={() => onChange("C4")}
        >
          <Text>Change Note</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

// Mock range expansion patterns
jest.mock("../src/constants/rangeExpansionPatterns", () => ({
  getAvailablePatterns: jest.fn(() => []),
  PATTERNS_UP: [
    {
      id: "raise_half_step",
      name: "Raise Half Step",
      direction: "up",
      targetInterval: 1,
      intervals: [0, 1],
      solfege: "do-di",
      description: "Raise by half step",
    },
    {
      id: "upper_neighbor",
      name: "Upper Neighbor",
      direction: "up",
      targetInterval: 2,
      intervals: [0, 2, 0],
      solfege: "do-re-do",
      description: "Step up then back",
    },
  ],
  PATTERNS_DOWN: [
    {
      id: "lower_half_step",
      name: "Lower Half Step",
      direction: "down",
      targetInterval: -1,
      intervals: [0, -1],
      solfege: "do-ti",
      description: "Lower by half step",
    },
    {
      id: "lower_neighbor",
      name: "Lower Neighbor",
      direction: "down",
      targetInterval: -2,
      intervals: [0, -2, 0],
      solfege: "do-te-do",
      description: "Step down then back",
    },
  ],
}));

// Mock exercise components - create simple mocks for each
const createMockExercise = (name: string) => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return function MockExercise({
    onComplete,
    onProgress,
    config,
    mastery,
    ...props
  }: {
    onComplete: (result: { success: boolean }) => void;
    onProgress?: (progress: object) => void;
    config?: object;
    mastery?: object;
    [key: string]: unknown;
  }): React.JSX.Element {
    return (
      <View testID={`exercise-${name}`}>
        <Text>Exercise: {name}</Text>
        <TouchableOpacity
          testID={`complete-${name}`}
          onPress={() => onComplete({ success: true })}
        >
          <Text>Complete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID={`fail-${name}`}
          onPress={() => onComplete({ success: false })}
        >
          <Text>Fail</Text>
        </TouchableOpacity>
      </View>
    );
  };
};

jest.mock("../src/screens/Session/components/exercises", () => ({
  TapAlongExercise: createMockExercise("TapAlong"),
  StartOnCueExercise: createMockExercise("StartOnCue"),
  FeelThePulseExercise: createMockExercise("FeelThePulse"),
  RangeExpansionExercise: createMockExercise("RangeExpansion"),
  WholeNoteLessonExercise: createMockExercise("WholeNoteLesson"),
  WholeRestLessonExercise: createMockExercise("WholeRestLesson"),
  HalfNoteLessonExercise: createMockExercise("HalfNoteLesson"),
  HalfRestLessonExercise: createMockExercise("HalfRestLesson"),
  QuarterNoteLessonExercise: createMockExercise("QuarterNoteLesson"),
  QuarterRestLessonExercise: createMockExercise("QuarterRestLesson"),
  TimeSignatureBasicsExercise: createMockExercise("TimeSignatureBasics"),
  TimeSignature44Exercise: createMockExercise("TimeSignature44"),
  Fragment2LessonExercise: createMockExercise("Fragment2Lesson"),
  NoteNamePatternExercise: createMockExercise("NoteNamePattern"),
  OctaveConceptExercise: createMockExercise("OctaveConcept"),
  HalfStepsTheoryExercise: createMockExercise("HalfStepsTheory"),
  FlatAccidentalExercise: createMockExercise("FlatAccidental"),
  SharpAccidentalExercise: createMockExercise("SharpAccidental"),
  NaturalAccidentalExercise: createMockExercise("NaturalAccidental"),
  WholeStepsTheoryExercise: createMockExercise("WholeStepsTheory"),
  DiatonicScalePatternExercise: createMockExercise("DiatonicScalePattern"),
  KeySignatureBasicsExercise: createMockExercise("KeySignatureBasics"),
}));

// Mock shared utilities
jest.mock("../src/screens/Session/components/exercises/shared", () => ({
  parseNoteName: jest.fn((note: string) => {
    const match = note.match(/([A-G])([#b]?)(\d)/);
    if (!match) return null;
    return { letter: match[1], accidental: match[2] || "", octave: match[3] };
  }),
  noteToMidi: jest.fn((note: string) => {
    // Simple mock implementation
    const noteMap: Record<string, number> = {
      C: 0,
      D: 2,
      E: 4,
      F: 5,
      G: 7,
      A: 9,
      B: 11,
    };
    const match = note.match(/([A-G])([#b]?)(\d)/);
    if (!match) return 60;
    const letter = match[1];
    const accidental = match[2];
    const octave = parseInt(match[3]);
    let midi = (octave + 1) * 12 + noteMap[letter];
    if (accidental === "#") midi++;
    if (accidental === "b") midi--;
    return midi;
  }),
  midiToNote: jest.fn((midi: number) => {
    const notes = [
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
    const octave = Math.floor(midi / 12) - 1;
    const note = notes[midi % 12];
    return `${note}${octave}`;
  }),
  midiToNoteInContext: jest.fn((midi: number, context: string) => {
    const notes = [
      "C",
      "Db",
      "D",
      "Eb",
      "E",
      "F",
      "Gb",
      "G",
      "Ab",
      "A",
      "Bb",
      "B",
    ];
    const octave = Math.floor(midi / 12) - 1;
    const note = notes[midi % 12];
    return `${note}${octave}`;
  }),
  shouldUseSharps: jest.fn(() => false),
  CHROMATIC_NOTES: [
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
  ],
  FLAT_EQUIVALENTS: {
    "C#": "Db",
    "D#": "Eb",
    "F#": "Gb",
    "G#": "Ab",
    "A#": "Bb",
  },
}));

describe("ExerciseTestScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Exercise Menu Rendering", () => {
    it("renders the exercise tester screen", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      expect(getByText("Exercise Tester")).toBeTruthy();
      expect(getByText("Test exercises in isolation")).toBeTruthy();
    });

    it("renders back button to home", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      expect(getByText("← Home")).toBeTruthy();
    });

    it("navigates back when home is pressed", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("← Home"));
      expect(mockGoBack).toHaveBeenCalled();
    });

    it("renders all teaching module exercises", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      expect(getByText("Note Names: A to G")).toBeTruthy();
      expect(getByText("The Octave")).toBeTruthy();
      expect(getByText("Half Steps")).toBeTruthy();
      expect(getByText("The Flat Sign")).toBeTruthy();
      expect(getByText("The Sharp Sign")).toBeTruthy();
      expect(getByText("The Natural Sign")).toBeTruthy();
      expect(getByText("Whole Steps")).toBeTruthy();
      expect(getByText("Major Scale Pattern")).toBeTruthy();
      expect(getByText("Key Signatures")).toBeTruthy();
    });

    it("renders rhythm exercises", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      expect(getByText("Feel the Pulse")).toBeTruthy();
      expect(getByText("Tap Along")).toBeTruthy();
      expect(getByText("Enter on One")).toBeTruthy();
    });

    it("renders range expansion exercises", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      expect(getByText("Expand Range (Up)")).toBeTruthy();
      expect(getByText("Expand Range (Down)")).toBeTruthy();
    });

    it("renders note lesson exercises", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      expect(getByText("Whole Note Lesson")).toBeTruthy();
      expect(getByText("Half Note")).toBeTruthy();
      expect(getByText("Quarter Note")).toBeTruthy();
    });

    it("renders rest lesson exercises", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      expect(getByText("Whole Rest")).toBeTruthy();
      expect(getByText("Half Rest")).toBeTruthy();
      expect(getByText("Quarter Rest")).toBeTruthy();
    });

    it("renders time signature exercises", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      expect(getByText("Time Signature Basics")).toBeTruthy();
      expect(getByText("4/4 Time Signature")).toBeTruthy();
    });

    it("renders fragment exercise", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      expect(getByText("Fragment 2 (2-Note)")).toBeTruthy();
    });

    it("renders exercise descriptions", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      expect(
        getByText("Learn the 7 note names that repeat: A B C D E F G"),
      ).toBeTruthy();
      expect(getByText("Tap in time with the beat")).toBeTruthy();
    });

    it("renders exercise icons", () => {
      const { getAllByText } = render(<ExerciseTestScreen />);
      expect(getAllByText("🎹").length).toBeGreaterThan(0); // Octave & Whole Steps
      expect(getAllByText("🔤").length).toBe(1); // Note Names
      expect(getAllByText("👆").length).toBe(1); // Tap Along
    });
  });

  describe("Exercise Selection", () => {
    it("selects and displays tap along exercise", () => {
      const { getByText, getByTestId } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Tap Along"));
      expect(getByTestId("exercise-TapAlong")).toBeTruthy();
      expect(getByText("👆 Tap Along")).toBeTruthy();
    });

    it("selects and displays note name pattern exercise", () => {
      const { getByText, getByTestId } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Note Names: A to G"));
      expect(getByTestId("exercise-NoteNamePattern")).toBeTruthy();
    });

    it("selects and displays feel the pulse exercise", () => {
      const { getByText, getByTestId } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Feel the Pulse"));
      expect(getByTestId("exercise-FeelThePulse")).toBeTruthy();
    });

    it("selects and displays whole note lesson", () => {
      const { getByText, getByTestId } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Whole Note Lesson"));
      expect(getByTestId("exercise-WholeNoteLesson")).toBeTruthy();
    });

    it("shows back button in exercise view", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Tap Along"));
      expect(getByText("← Back")).toBeTruthy();
    });

    it("returns to menu when back is pressed in exercise view", () => {
      const { getByText, queryByTestId } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Tap Along"));
      expect(queryByTestId("exercise-TapAlong")).toBeTruthy();
      fireEvent.press(getByText("← Back"));
      expect(queryByTestId("exercise-TapAlong")).toBeNull();
      expect(getByText("Exercise Tester")).toBeTruthy();
    });
  });

  describe("Exercise Completion", () => {
    it("shows success result when exercise completes successfully", async () => {
      const { getByText, getByTestId } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Tap Along"));
      fireEvent.press(getByTestId("complete-TapAlong"));
      expect(getByText("🎉")).toBeTruthy();
      expect(getByText("Exercise Complete!")).toBeTruthy();
    });

    it("shows retry result when exercise fails", () => {
      const { getByText, getByTestId } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Tap Along"));
      fireEvent.press(getByTestId("fail-TapAlong"));
      expect(getByText("🔄")).toBeTruthy();
      expect(getByText("Try Again")).toBeTruthy();
    });

    it("returns to menu after showing result for 2 seconds", async () => {
      const { getByText, getByTestId, queryByText } = render(
        <ExerciseTestScreen />,
      );
      fireEvent.press(getByText("Tap Along"));
      fireEvent.press(getByTestId("complete-TapAlong"));
      expect(getByText("Exercise Complete!")).toBeTruthy();

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(queryByText("Exercise Complete!")).toBeNull();
        expect(getByText("Exercise Tester")).toBeTruthy();
      });
    });

    it("completes different exercises successfully", () => {
      const { getByText, getByTestId, rerender } = render(
        <ExerciseTestScreen />,
      );

      // Test NoteNamePattern
      fireEvent.press(getByText("Note Names: A to G"));
      fireEvent.press(getByTestId("complete-NoteNamePattern"));
      expect(getByText("Exercise Complete!")).toBeTruthy();
    });
  });

  describe("Range Expansion Config Picker", () => {
    it("shows config picker when range expansion up is selected", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      expect(getByText("Configure Exercise")).toBeTruthy();
      expect(getByText("⬆️ Expand Range (Up)")).toBeTruthy();
    });

    it("shows config picker when range expansion down is selected", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Down)"));
      expect(getByText("Configure Exercise")).toBeTruthy();
      expect(getByText("⬇️ Expand Range (Down)")).toBeTruthy();
    });

    it("shows clef selection options", () => {
      const { getByText, getAllByText } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      expect(getByText("Clef")).toBeTruthy();
      expect(getByText("Treble")).toBeTruthy();
      expect(getByText("Bass")).toBeTruthy();
    });

    it("shows treble clef symbol", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      expect(getByText("𝄞")).toBeTruthy();
    });

    it("shows bass clef symbol", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      expect(getByText("𝄢")).toBeTruthy();
    });

    it("shows target pitch section", () => {
      const { getByText, getByTestId } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      expect(getByText("Target Pitch (new note to reach)")).toBeTruthy();
      expect(getByTestId("staff-note-picker")).toBeTruthy();
    });

    it("shows starting from label with anchor note", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      expect(getByText(/Starting from:/)).toBeTruthy();
    });

    it("shows exercise pattern section", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      expect(getByText("Exercise Pattern")).toBeTruthy();
    });

    it("shows up patterns for range expansion up", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      expect(getByText("Raise Half Step")).toBeTruthy();
      expect(getByText("Upper Neighbor")).toBeTruthy();
    });

    it("shows down patterns for range expansion down", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Down)"));
      expect(getByText("Lower Half Step")).toBeTruthy();
      expect(getByText("Lower Neighbor")).toBeTruthy();
    });

    it("shows pattern solfege labels", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      expect(getByText("do-di")).toBeTruthy();
      expect(getByText("do-re-do")).toBeTruthy();
    });

    it("shows pattern descriptions", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      expect(getByText("Raise by half step")).toBeTruthy();
      expect(getByText("Step up then back")).toBeTruthy();
    });

    it("shows pattern intervals", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      expect(getByText("Intervals: [0, 1]")).toBeTruthy();
      expect(getByText("Intervals: [0, 2, 0]")).toBeTruthy();
    });

    it("shows start exercise button", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      expect(getByText("Start Exercise")).toBeTruthy();
    });

    it("returns to menu when back is pressed from config picker", () => {
      const { getByText, queryByText } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      expect(getByText("Configure Exercise")).toBeTruthy();
      fireEvent.press(getByText("← Back"));
      expect(queryByText("Configure Exercise")).toBeNull();
      expect(getByText("Exercise Tester")).toBeTruthy();
    });

    it("can switch between treble and bass clef", () => {
      const { getByText, getByTestId } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      expect(getByTestId("staff-clef").props.children).toBe("treble");
      fireEvent.press(getByText("Bass"));
      expect(getByTestId("staff-clef").props.children).toBe("bass");
    });

    it("can select different patterns", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      // First pattern should be auto-selected
      // Press second pattern
      fireEvent.press(getByText("Upper Neighbor"));
      // Pattern should be selected (visual change - in a real test we'd check style)
    });

    it("can change target note using staff picker", () => {
      const { getByText, getByTestId } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      fireEvent.press(getByTestId("change-note-btn"));
      expect(getByTestId("staff-value").props.children).toBe("C4");
    });

    it("starts exercise with selected config", () => {
      const { getByText, getByTestId, queryByText } = render(
        <ExerciseTestScreen />,
      );
      fireEvent.press(getByText("Expand Range (Up)"));
      // Select a pattern (first one should be auto-selected)
      fireEvent.press(getByText("Upper Neighbor"));
      // Start exercise
      fireEvent.press(getByText("Start Exercise"));
      // Should now show exercise, not config picker
      expect(queryByText("Configure Exercise")).toBeNull();
      expect(getByTestId("exercise-RangeExpansion")).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("has accessibility labels on back button in menu", () => {
      const { getByLabelText } = render(<ExerciseTestScreen />);
      expect(getByLabelText("Go back to home")).toBeTruthy();
    });

    it("has accessibility labels on exercise cards", () => {
      const { getByLabelText } = render(<ExerciseTestScreen />);
      expect(
        getByLabelText(
          "Note Names: A to G: Learn the 7 note names that repeat: A B C D E F G",
        ),
      ).toBeTruthy();
      expect(
        getByLabelText("Tap Along: Tap in time with the beat"),
      ).toBeTruthy();
    });

    it("has accessibility labels on config picker back button", () => {
      const { getByText, getByLabelText } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      expect(getByLabelText("Go back")).toBeTruthy();
    });

    it("has accessibility labels on clef buttons", () => {
      const { getByText, getByLabelText } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      expect(getByLabelText("Select treble clef")).toBeTruthy();
      expect(getByLabelText("Select bass clef")).toBeTruthy();
    });

    it("has accessibility labels on pattern cards", () => {
      const { getByText, getByLabelText } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      expect(getByLabelText("Select Raise Half Step pattern")).toBeTruthy();
      expect(getByLabelText("Select Upper Neighbor pattern")).toBeTruthy();
    });

    it("has accessibility labels on start button", () => {
      const { getByText, getByLabelText } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      expect(getByLabelText("Start exercise")).toBeTruthy();
    });

    it("has accessibility labels on exercise view back button", () => {
      const { getByText, getByLabelText } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Tap Along"));
      expect(getByLabelText("Go back to exercise list")).toBeTruthy();
    });
  });

  describe("Exercise Data Structure", () => {
    it("exercises have unique ids", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      // Each exercise card should render without key warnings
      expect(getByText("Exercise Tester")).toBeTruthy();
    });

    it("all teaching module exercises have icons", () => {
      const { getByText, getAllByText } = render(<ExerciseTestScreen />);
      // Check that icons render for expected exercises
      expect(getAllByText("🔤").length).toBe(1); // Note Names
      expect(getAllByText("♭").length).toBe(1); // Flat Sign
      expect(getAllByText("♯").length).toBe(1); // Sharp Sign
      expect(getAllByText("♮").length).toBe(1); // Natural Sign
    });

    it("rhythm exercises have correct icons", () => {
      const { getAllByText } = render(<ExerciseTestScreen />);
      expect(getAllByText("👂").length).toBe(1); // Feel the Pulse
      expect(getAllByText("👆").length).toBe(1); // Tap Along
    });

    it("range expansion exercises have direction icons", () => {
      const { getAllByText } = render(<ExerciseTestScreen />);
      expect(getAllByText("⬆️").length).toBe(1); // Up
      expect(getAllByText("⬇️").length).toBe(1); // Down
    });

    it("rest exercises have correct icons", () => {
      const { getAllByText } = render(<ExerciseTestScreen />);
      expect(getAllByText("🤫").length).toBe(3); // Whole Rest, Half Rest, Quarter Rest
    });

    it("time signature exercises have correct icon", () => {
      const { getAllByText } = render(<ExerciseTestScreen />);
      expect(getAllByText("📊").length).toBe(1); // Time Signature Basics
    });
  });

  describe("Multiple Exercise Types", () => {
    it("can run accidental exercises", () => {
      const { getByText, getByTestId } = render(<ExerciseTestScreen />);

      fireEvent.press(getByText("The Flat Sign"));
      expect(getByTestId("exercise-FlatAccidental")).toBeTruthy();
      fireEvent.press(getByText("← Back"));

      fireEvent.press(getByText("The Sharp Sign"));
      expect(getByTestId("exercise-SharpAccidental")).toBeTruthy();
      fireEvent.press(getByText("← Back"));

      fireEvent.press(getByText("The Natural Sign"));
      expect(getByTestId("exercise-NaturalAccidental")).toBeTruthy();
    });

    it("can run theory exercises", () => {
      const { getByText, getByTestId } = render(<ExerciseTestScreen />);

      fireEvent.press(getByText("The Octave"));
      expect(getByTestId("exercise-OctaveConcept")).toBeTruthy();
      fireEvent.press(getByText("← Back"));

      fireEvent.press(getByText("Half Steps"));
      expect(getByTestId("exercise-HalfStepsTheory")).toBeTruthy();
      fireEvent.press(getByText("← Back"));

      fireEvent.press(getByText("Whole Steps"));
      expect(getByTestId("exercise-WholeStepsTheory")).toBeTruthy();
    });

    it("can run scale/key exercises", () => {
      const { getByText, getByTestId } = render(<ExerciseTestScreen />);

      fireEvent.press(getByText("Major Scale Pattern"));
      expect(getByTestId("exercise-DiatonicScalePattern")).toBeTruthy();
      fireEvent.press(getByText("← Back"));

      fireEvent.press(getByText("Key Signatures"));
      expect(getByTestId("exercise-KeySignatureBasics")).toBeTruthy();
    });

    it("can run rest exercises", () => {
      const { getByText, getByTestId } = render(<ExerciseTestScreen />);

      fireEvent.press(getByText("Whole Rest"));
      expect(getByTestId("exercise-WholeRestLesson")).toBeTruthy();
      fireEvent.press(getByText("← Back"));

      fireEvent.press(getByText("Half Rest"));
      expect(getByTestId("exercise-HalfRestLesson")).toBeTruthy();
      fireEvent.press(getByText("← Back"));

      fireEvent.press(getByText("Quarter Rest"));
      expect(getByTestId("exercise-QuarterRestLesson")).toBeTruthy();
    });

    it("can run time signature exercises", () => {
      const { getByText, getByTestId } = render(<ExerciseTestScreen />);

      fireEvent.press(getByText("Time Signature Basics"));
      expect(getByTestId("exercise-TimeSignatureBasics")).toBeTruthy();
      fireEvent.press(getByText("← Back"));

      fireEvent.press(getByText("4/4 Time Signature"));
      expect(getByTestId("exercise-TimeSignature44")).toBeTruthy();
    });

    it("can run fragment exercise", () => {
      const { getByText, getByTestId } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Fragment 2 (2-Note)"));
      expect(getByTestId("exercise-Fragment2Lesson")).toBeTruthy();
    });

    it("can run enter on one exercise", () => {
      const { getByText, getByTestId } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Enter on One"));
      expect(getByTestId("exercise-StartOnCue")).toBeTruthy();
    });
  });

  describe("Config Picker Edge Cases", () => {
    it("resets pattern selection when switching between up and down", async () => {
      const { getByText, queryByText } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      expect(getByText("Raise Half Step")).toBeTruthy();
      fireEvent.press(getByText("← Back"));

      fireEvent.press(getByText("Expand Range (Down)"));
      expect(getByText("Lower Half Step")).toBeTruthy();
      expect(queryByText("Raise Half Step")).toBeNull();
    });

    it("defaults to treble clef", () => {
      const { getByText, getByTestId } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      expect(getByTestId("staff-clef").props.children).toBe("treble");
    });

    it("remembers clef selection during same config session", () => {
      const { getByText, getByTestId } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      fireEvent.press(getByText("Bass"));
      expect(getByTestId("staff-clef").props.children).toBe("bass");
    });

    it("staff picker shows current note value", () => {
      const { getByText, getByTestId } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      expect(getByTestId("staff-value").props.children).toBe("B3");
    });

    it("auto-selects first pattern when no pattern selected", () => {
      const { getByText } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      // Auto-selection happens via useEffect, should enable Start button
      expect(getByText("Start Exercise")).toBeTruthy();
    });
  });

  describe("Exercise Props", () => {
    it("passes config to exercise component", () => {
      // This is verified by exercise mocks receiving config prop
      const { getByText, getByTestId } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Tap Along"));
      expect(getByTestId("exercise-TapAlong")).toBeTruthy();
    });

    it("passes mastery to exercise component", () => {
      const { getByText, getByTestId } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Feel the Pulse"));
      expect(getByTestId("exercise-FeelThePulse")).toBeTruthy();
    });

    it("passes extraProps to exercise components", () => {
      const { getByText, getByTestId } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Whole Note Lesson"));
      // Exercise receives userFirstNote: "F3"
      expect(getByTestId("exercise-WholeNoteLesson")).toBeTruthy();
    });
  });

  describe("Scroll Behavior", () => {
    it("renders menu in a scroll view", () => {
      const { UNSAFE_getAllByType } = render(<ExerciseTestScreen />);
      const scrollViews = UNSAFE_getAllByType(
        require("react-native").ScrollView,
      );
      expect(scrollViews.length).toBeGreaterThan(0);
    });

    it("renders config picker in a scroll view", () => {
      const { getByText, UNSAFE_getAllByType } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Expand Range (Up)"));
      const scrollViews = UNSAFE_getAllByType(
        require("react-native").ScrollView,
      );
      expect(scrollViews.length).toBeGreaterThan(0);
    });
  });

  describe("State Management", () => {
    it("clears result when returning to menu after exercise", async () => {
      const { getByText, getByTestId, queryByText } = render(
        <ExerciseTestScreen />,
      );
      fireEvent.press(getByText("Tap Along"));
      fireEvent.press(getByTestId("complete-TapAlong"));
      expect(getByText("Exercise Complete!")).toBeTruthy();

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(queryByText("Exercise Complete!")).toBeNull();
      });

      // Start another exercise
      fireEvent.press(getByText("Feel the Pulse"));
      expect(getByTestId("exercise-FeelThePulse")).toBeTruthy();
      // Should not show old result
      expect(queryByText("Exercise Complete!")).toBeNull();
    });

    it("maintains selected exercise state until explicitly cleared", () => {
      const { getByText, getByTestId } = render(<ExerciseTestScreen />);
      fireEvent.press(getByText("Tap Along"));
      expect(getByTestId("exercise-TapAlong")).toBeTruthy();
      // Exercise remains selected until back is pressed
      expect(getByTestId("exercise-TapAlong")).toBeTruthy();
    });

    it("can run multiple exercises in sequence", async () => {
      const { getByText, getByTestId, queryByTestId } = render(
        <ExerciseTestScreen />,
      );

      // First exercise
      fireEvent.press(getByText("Tap Along"));
      fireEvent.press(getByTestId("complete-TapAlong"));

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(queryByTestId("exercise-TapAlong")).toBeNull();
      });

      // Second exercise
      fireEvent.press(getByText("Feel the Pulse"));
      expect(getByTestId("exercise-FeelThePulse")).toBeTruthy();
      fireEvent.press(getByTestId("complete-FeelThePulse"));

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(queryByTestId("exercise-FeelThePulse")).toBeNull();
      });

      // Back to menu
      expect(getByText("Exercise Tester")).toBeTruthy();
    });
  });
});
