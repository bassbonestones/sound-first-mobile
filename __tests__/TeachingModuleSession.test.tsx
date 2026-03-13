/**
 * @fileoverview Tests for TeachingModuleSession component
 * Interactive teaching module lessons with intro, exercise, and complete phases
 */

import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";

// Mock getExerciseComponent
const MockExerciseComponent = ({
  onComplete,
  onProgress,
}: {
  onComplete: (result: object) => void;
  onProgress: (data: object) => void;
}) => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return (
    <View testID="exercise-component">
      <Text>Exercise Component</Text>
      <TouchableOpacity
        testID="complete-exercise"
        onPress={() =>
          onComplete({
            success: true,
            streak: 8,
            totalAttempts: 10,
            correctCount: 8,
          })
        }
      >
        <Text>Complete</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="update-progress"
        onPress={() => onProgress({ streak: 5, masteryRequired: 8 })}
      >
        <Text>Update Progress</Text>
      </TouchableOpacity>
    </View>
  );
};

jest.mock("../src/screens/Session/components/exercises", () => ({
  getExerciseComponent: jest.fn((templateId: string) => {
    if (templateId === "unsupported_type") return null;
    return MockExerciseComponent;
  }),
}));

// Mock UserContext
jest.mock("../src/context/UserContext", () => ({
  useUser: jest.fn(() => ({
    selectedInstrument: {
      range_low: "F3",
      range_high: "F5",
      clef: "treble",
    },
  })),
}));

// Mock devLogger
jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
}));

import TeachingModuleSession from "../src/screens/Session/components/TeachingModuleSession";

describe("TeachingModuleSession", () => {
  const mockOnRecordCompletion = jest.fn();
  const mockOnNavigate = jest.fn();
  const mockOnSkip = jest.fn();
  const mockOnEndPractice = jest.fn();
  const mockOnExtend = jest.fn();

  const baseMini = {
    module_display_name: "Note Reading",
    lesson_display_name: "Learn Quarter Notes",
    lesson_description: "Practice reading quarter notes on the staff",
    exercise_template_id: "quarter_note_lesson",
    exercise_config: { difficulty: "beginner" },
    mastery_config: { correct_streak: 8 },
    capability_name: "Quarter Note Recognition",
    hints: ["Take your time", "Count steadily"],
  };

  const defaultProps = {
    mini: baseMini,
    userResonantNote: "F3",
    onRecordCompletion: mockOnRecordCompletion,
    onNavigate: mockOnNavigate,
    onSkip: mockOnSkip,
    onEndPractice: mockOnEndPractice,
    onExtend: mockOnExtend,
    isLastItem: false,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ==========================================================================
  // INTRO PHASE TESTS
  // ==========================================================================
  describe("Intro Phase", () => {
    it("renders intro screen initially", () => {
      const { getByText } = render(<TeachingModuleSession {...defaultProps} />);
      expect(getByText("Teaching Module")).toBeTruthy();
    });

    it("displays module name", () => {
      const { getByText } = render(<TeachingModuleSession {...defaultProps} />);
      expect(getByText("Note Reading")).toBeTruthy();
    });

    it("displays lesson name", () => {
      const { getByText } = render(<TeachingModuleSession {...defaultProps} />);
      expect(getByText("Learn Quarter Notes")).toBeTruthy();
    });

    it("displays lesson description", () => {
      const { getByText } = render(<TeachingModuleSession {...defaultProps} />);
      expect(
        getByText("Practice reading quarter notes on the staff"),
      ).toBeTruthy();
    });

    it("displays lesson icon", () => {
      const { getByText } = render(<TeachingModuleSession {...defaultProps} />);
      expect(getByText("👂")).toBeTruthy();
    });

    it("displays hints when provided", () => {
      const { getByText } = render(<TeachingModuleSession {...defaultProps} />);
      expect(getByText("💡 Tips")).toBeTruthy();
      expect(getByText("• Take your time")).toBeTruthy();
      expect(getByText("• Count steadily")).toBeTruthy();
    });

    it("does not render hints section when no hints", () => {
      const mini = { ...baseMini, hints: [] };
      const { queryByText } = render(
        <TeachingModuleSession {...defaultProps} mini={mini} />,
      );
      expect(queryByText("💡 Tips")).toBeNull();
    });

    it("displays goal card", () => {
      const { getByText } = render(<TeachingModuleSession {...defaultProps} />);
      expect(getByText("🎯 Your Goal")).toBeTruthy();
      expect(getByText("Get 8 correct answers in a row")).toBeTruthy();
    });

    it("displays capability being built", () => {
      const { getByText } = render(<TeachingModuleSession {...defaultProps} />);
      expect(getByText(/Building skill:/)).toBeTruthy();
      expect(getByText("Quarter Note Recognition")).toBeTruthy();
    });

    it("renders Skip button", () => {
      const { getByText, getByLabelText } = render(
        <TeachingModuleSession {...defaultProps} />,
      );
      expect(getByText("Skip")).toBeTruthy();
      expect(getByLabelText("Skip this exercise")).toBeTruthy();
    });

    it("renders Start Exercise button", () => {
      const { getByText, getByLabelText } = render(
        <TeachingModuleSession {...defaultProps} />,
      );
      expect(getByText("Start Exercise")).toBeTruthy();
      expect(getByLabelText("Start exercise")).toBeTruthy();
    });

    it("renders End Practice button", () => {
      const { getByText, getByLabelText } = render(
        <TeachingModuleSession {...defaultProps} />,
      );
      expect(getByText("End Practice")).toBeTruthy();
      expect(getByLabelText("End practice session")).toBeTruthy();
    });

    it("calls onSkip when Skip is pressed", () => {
      const { getByText } = render(<TeachingModuleSession {...defaultProps} />);
      fireEvent.press(getByText("Skip"));
      expect(mockOnSkip).toHaveBeenCalledTimes(1);
    });

    it("transitions to exercise phase when Start Exercise is pressed", () => {
      const { getByText, getByTestId } = render(
        <TeachingModuleSession {...defaultProps} />,
      );
      fireEvent.press(getByText("Start Exercise"));
      expect(getByTestId("exercise-component")).toBeTruthy();
    });
  });

  // ==========================================================================
  // END PRACTICE CONFIRMATION MODAL
  // ==========================================================================
  describe("End Practice Confirmation Modal", () => {
    it("shows confirmation modal when End Practice is pressed", () => {
      const { getByText, getByLabelText } = render(
        <TeachingModuleSession {...defaultProps} />,
      );
      fireEvent.press(getByLabelText("End practice session"));
      expect(getByText("End Practice?")).toBeTruthy();
    });

    it("shows confirmation message", () => {
      const { getByText, getByLabelText } = render(
        <TeachingModuleSession {...defaultProps} />,
      );
      fireEvent.press(getByLabelText("End practice session"));
      expect(
        getByText("Your progress on completed exercises has been saved."),
      ).toBeTruthy();
    });

    it("closes modal when Continue is pressed", () => {
      const { getByText, getByLabelText, queryByText } = render(
        <TeachingModuleSession {...defaultProps} />,
      );
      fireEvent.press(getByLabelText("End practice session"));
      fireEvent.press(getByLabelText("Continue practicing"));
      expect(queryByText("End Practice?")).toBeNull();
    });

    it("calls onEndPractice when confirmed", () => {
      const { getByText, getByLabelText } = render(
        <TeachingModuleSession {...defaultProps} />,
      );
      fireEvent.press(getByLabelText("End practice session"));
      fireEvent.press(getByLabelText("Confirm end practice"));
      expect(mockOnEndPractice).toHaveBeenCalledTimes(1);
    });

    it("closes modal via onRequestClose (Android back)", () => {
      const { getByLabelText, queryByText, UNSAFE_root } = render(
        <TeachingModuleSession {...defaultProps} />,
      );
      fireEvent.press(getByLabelText("End practice session"));
      // Find the modal and trigger onRequestClose
      const modal = UNSAFE_root.findByType(
        require("react-native").Modal as any,
      );
      if (modal && modal.props.onRequestClose) {
        act(() => {
          modal.props.onRequestClose();
        });
      }
      expect(queryByText("End Practice?")).toBeNull();
    });
  });

  // ==========================================================================
  // EXERCISE PHASE TESTS
  // ==========================================================================
  describe("Exercise Phase", () => {
    const goToExercisePhase = (getByText: Function) => {
      fireEvent.press(getByText("Start Exercise"));
    };

    it("renders exercise component", () => {
      const { getByText, getByTestId } = render(
        <TeachingModuleSession {...defaultProps} />,
      );
      goToExercisePhase(getByText);
      expect(getByTestId("exercise-component")).toBeTruthy();
    });

    it("displays exercise header with lesson name", () => {
      const { getByText } = render(<TeachingModuleSession {...defaultProps} />);
      goToExercisePhase(getByText);
      expect(getByText("Learn Quarter Notes")).toBeTruthy();
    });

    it("has close button", () => {
      const { getByText, getByLabelText } = render(
        <TeachingModuleSession {...defaultProps} />,
      );
      goToExercisePhase(getByText);
      expect(getByLabelText("Close exercise")).toBeTruthy();
    });

    it("has dev skip button", () => {
      const { getByText, getByLabelText } = render(
        <TeachingModuleSession {...defaultProps} />,
      );
      goToExercisePhase(getByText);
      expect(getByText("⏭ Skip")).toBeTruthy();
      expect(getByLabelText("Skip to complete exercise")).toBeTruthy();
    });

    it("calls onSkip when close button is pressed after timeout", () => {
      const { getByText, getByLabelText } = render(
        <TeachingModuleSession {...defaultProps} />,
      );
      goToExercisePhase(getByText);
      fireEvent.press(getByLabelText("Close exercise"));
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(mockOnSkip).toHaveBeenCalledTimes(1);
    });

    it("transitions to complete phase when exercise completes", () => {
      const { getByText, getByTestId } = render(
        <TeachingModuleSession {...defaultProps} />,
      );
      goToExercisePhase(getByText);
      fireEvent.press(getByTestId("complete-exercise"));
      expect(getByText("🎉")).toBeTruthy();
      expect(getByText("Lesson Complete!")).toBeTruthy();
    });

    it("handles progress updates from exercise", () => {
      const { getByText, getByTestId } = render(
        <TeachingModuleSession {...defaultProps} />,
      );
      goToExercisePhase(getByText);
      // This triggers the handleProgress callback (line 345)
      fireEvent.press(getByTestId("update-progress"));
      // The component should handle the progress update without error
      expect(getByTestId("exercise-component")).toBeTruthy();
    });

    it("records completion when exercise completes", () => {
      const { getByText, getByTestId } = render(
        <TeachingModuleSession {...defaultProps} />,
      );
      goToExercisePhase(getByText);
      fireEvent.press(getByTestId("complete-exercise"));
      expect(mockOnRecordCompletion).toHaveBeenCalledWith({
        success: true,
        streak: 8,
        totalAttempts: 10,
        correctCount: 8,
      });
    });

    it("dev skip button triggers completion", () => {
      const { getByText, getByLabelText } = render(
        <TeachingModuleSession {...defaultProps} />,
      );
      goToExercisePhase(getByText);
      fireEvent.press(getByLabelText("Skip to complete exercise"));
      expect(getByText("Lesson Complete!")).toBeTruthy();
      expect(mockOnRecordCompletion).toHaveBeenCalledWith({
        success: true,
        streak: 8,
        totalAttempts: 8,
        correctCount: 8,
      });
    });
  });

  // ==========================================================================
  // COMPLETE PHASE TESTS
  // ==========================================================================
  describe("Complete Phase", () => {
    const goToCompletePhase = (getByText: Function, getByTestId: Function) => {
      fireEvent.press(getByText("Start Exercise"));
      fireEvent.press(getByTestId("complete-exercise"));
    };

    it("renders celebration emoji", () => {
      const { getByText, getByTestId } = render(
        <TeachingModuleSession {...defaultProps} />,
      );
      goToCompletePhase(getByText, getByTestId);
      expect(getByText("🎉")).toBeTruthy();
    });

    it("renders completion title", () => {
      const { getByText, getByTestId } = render(
        <TeachingModuleSession {...defaultProps} />,
      );
      goToCompletePhase(getByText, getByTestId);
      expect(getByText("Lesson Complete!")).toBeTruthy();
    });

    it("displays lesson name", () => {
      const { getByText, getByTestId, getAllByText } = render(
        <TeachingModuleSession {...defaultProps} />,
      );
      goToCompletePhase(getByText, getByTestId);
      const lessonNames = getAllByText("Learn Quarter Notes");
      expect(lessonNames.length).toBeGreaterThan(0);
    });

    it("displays results stats", () => {
      const { getByText, getByTestId } = render(
        <TeachingModuleSession {...defaultProps} />,
      );
      goToCompletePhase(getByText, getByTestId);
      expect(getByText("Your Results")).toBeTruthy();
      expect(getByText("✅ 8 correct answers")).toBeTruthy();
      expect(getByText("📊 10 total attempts")).toBeTruthy();
      expect(getByText("🔥 8 final streak")).toBeTruthy();
    });

    it("renders Continue button when not last item", () => {
      const { getByText, getByTestId, getByLabelText } = render(
        <TeachingModuleSession {...defaultProps} />,
      );
      goToCompletePhase(getByText, getByTestId);
      expect(getByText("Continue")).toBeTruthy();
      expect(getByLabelText("Continue to next exercise")).toBeTruthy();
    });

    it("renders End Practice button when not last item", () => {
      const { getByText, getByTestId, getByLabelText } = render(
        <TeachingModuleSession {...defaultProps} />,
      );
      goToCompletePhase(getByText, getByTestId);
      expect(getByLabelText("End practice session")).toBeTruthy();
    });

    it("calls onNavigate when Continue is pressed", () => {
      const { getByText, getByTestId } = render(
        <TeachingModuleSession {...defaultProps} />,
      );
      goToCompletePhase(getByText, getByTestId);
      fireEvent.press(getByText("Continue"));
      expect(mockOnNavigate).toHaveBeenCalledTimes(1);
    });

    it("calls onEndPractice when End Practice is pressed", () => {
      const { getByText, getByTestId, getByLabelText } = render(
        <TeachingModuleSession {...defaultProps} />,
      );
      goToCompletePhase(getByText, getByTestId);
      fireEvent.press(getByLabelText("End practice session"));
      expect(mockOnEndPractice).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // LAST ITEM BEHAVIOR
  // ==========================================================================
  describe("Last Item Behavior", () => {
    const goToCompletePhase = (getByText: Function, getByTestId: Function) => {
      fireEvent.press(getByText("Start Exercise"));
      fireEvent.press(getByTestId("complete-exercise"));
    };

    it("shows Extend and Finish buttons when last item", () => {
      const props = { ...defaultProps, isLastItem: true };
      const { getByText, getByTestId, getByLabelText } = render(
        <TeachingModuleSession {...props} />,
      );
      goToCompletePhase(getByText, getByTestId);
      expect(getByText("+ Extend One More")).toBeTruthy();
      expect(getByText("Finish Session")).toBeTruthy();
      expect(getByLabelText("Add one more exercise")).toBeTruthy();
      expect(getByLabelText("Finish session")).toBeTruthy();
    });

    it("calls onExtend when Extend is pressed", () => {
      const props = { ...defaultProps, isLastItem: true };
      const { getByText, getByTestId } = render(
        <TeachingModuleSession {...props} />,
      );
      goToCompletePhase(getByText, getByTestId);
      fireEvent.press(getByText("+ Extend One More"));
      expect(mockOnExtend).toHaveBeenCalledTimes(1);
    });

    it("calls onNavigate when Finish Session is pressed", () => {
      const props = { ...defaultProps, isLastItem: true };
      const { getByText, getByTestId } = render(
        <TeachingModuleSession {...props} />,
      );
      goToCompletePhase(getByText, getByTestId);
      fireEvent.press(getByText("Finish Session"));
      expect(mockOnNavigate).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // UNSUPPORTED EXERCISE TESTS
  // ==========================================================================
  describe("Unsupported Exercise", () => {
    it("shows unsupported message for unknown exercise type", () => {
      const mini = { ...baseMini, exercise_template_id: "unsupported_type" };
      const { getByText } = render(
        <TeachingModuleSession {...defaultProps} mini={mini} />,
      );
      fireEvent.press(getByText("Start Exercise"));
      expect(getByText("🚧")).toBeTruthy();
      expect(getByText("Coming Soon")).toBeTruthy();
    });

    it("displays exercise template id in unsupported message", () => {
      const mini = { ...baseMini, exercise_template_id: "unsupported_type" };
      const { getByText } = render(
        <TeachingModuleSession {...defaultProps} mini={mini} />,
      );
      fireEvent.press(getByText("Start Exercise"));
      expect(getByText(/unsupported_type/)).toBeTruthy();
    });

    it("has Skip and Mark Complete buttons for unsupported", () => {
      const mini = { ...baseMini, exercise_template_id: "unsupported_type" };
      const { getByText, getByLabelText } = render(
        <TeachingModuleSession {...defaultProps} mini={mini} />,
      );
      fireEvent.press(getByText("Start Exercise"));
      expect(getByLabelText("Skip this exercise")).toBeTruthy();
      expect(getByLabelText("Mark exercise as complete")).toBeTruthy();
    });

    it("calls onComplete with skipped:true when Mark Complete is pressed", () => {
      const mini = { ...baseMini, exercise_template_id: "unsupported_type" };
      const { getByText, getByLabelText } = render(
        <TeachingModuleSession {...defaultProps} mini={mini} />,
      );
      fireEvent.press(getByText("Start Exercise"));
      fireEvent.press(getByLabelText("Mark exercise as complete"));
      // This should trigger onComplete({ success: true, skipped: true })
      // which then records completion and shows complete phase
      expect(mockOnRecordCompletion).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, skipped: true }),
      );
    });
  });

  // ==========================================================================
  // DEFAULT VALUES TESTS
  // ==========================================================================
  describe("Default Values", () => {
    it("uses default mastery streak when not provided", () => {
      const mini = { ...baseMini, mastery_config: {} };
      const { getByText } = render(
        <TeachingModuleSession {...defaultProps} mini={mini} />,
      );
      expect(getByText("Get 8 correct answers in a row")).toBeTruthy();
    });

    it("handles missing hints array", () => {
      const mini = { ...baseMini, hints: undefined };
      const { queryByText } = render(
        <TeachingModuleSession {...defaultProps} mini={mini} />,
      );
      expect(queryByText("💡 Tips")).toBeNull();
    });
  });
});
