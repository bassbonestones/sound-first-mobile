/**
 * @fileoverview Tests for ReflectionModal component
 * Session reflection/rating modal
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

// Mock styles
jest.mock("../src/screens/Session/components/styles", () => ({
  styles: {
    modalBackdrop: {},
    modalContainer: {},
    modalTitle: {},
    modalSubtitle: {},
    helperText: {},
    ratingRow: {},
    ratingButton: {},
    ratingButtonSelected: {},
    ratingButtonText: {},
    ratingButtonTextSelected: {},
    fatigueRow: {},
    fatigueButton: {},
    fatigueButtonSelected: {},
    fatigueEmoji: {},
    textInput: {},
    buttonRow: {},
    skipButton: {},
    skipButtonText: {},
    extendButton: {},
    extendButtonText: {},
    submitButton: {},
    submitButtonDisabled: {},
    submitButtonText: {},
    endPracticeLink: {},
    endPracticeLinkText: {},
  },
  colors: {
    textDark: "#333",
  },
}));

import ReflectionModal from "../src/screens/Session/components/ReflectionModal";

describe("ReflectionModal", () => {
  const mockSetRating = jest.fn();
  const mockSetFatigueInput = jest.fn();
  const mockSetReflection = jest.fn();
  const mockOnSkip = jest.fn();
  const mockOnExtend = jest.fn();
  const mockOnSubmit = jest.fn();
  const mockOnEndPractice = jest.fn();

  const defaultProps = {
    visible: true,
    rating: null,
    setRating: mockSetRating,
    fatigueInput: null,
    setFatigueInput: mockSetFatigueInput,
    extended: false,
    reflection: "",
    setReflection: mockSetReflection,
    submitting: false,
    onSkip: mockOnSkip,
    onExtend: mockOnExtend,
    onSubmit: mockOnSubmit,
    onEndPractice: mockOnEndPractice,
    isLastItem: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // VISIBILITY TESTS
  // ==========================================================================
  describe("Visibility", () => {
    it("renders when visible is true", () => {
      const { getByText } = render(<ReflectionModal {...defaultProps} />);
      expect(getByText("How did it go?")).toBeTruthy();
    });

    it("does not render content when visible is false", () => {
      const { queryByText } = render(
        <ReflectionModal {...defaultProps} visible={false} />,
      );
      expect(queryByText("How did it go?")).toBeNull();
    });
  });

  // ==========================================================================
  // CONTENT TESTS
  // ==========================================================================
  describe("Content", () => {
    it("renders title", () => {
      const { getByText } = render(<ReflectionModal {...defaultProps} />);
      expect(getByText("How did it go?")).toBeTruthy();
    });

    it("renders subtitle", () => {
      const { getByText } = render(<ReflectionModal {...defaultProps} />);
      expect(
        getByText("Rate your practice (1 = struggled, 5 = nailed it)"),
      ).toBeTruthy();
    });

    it("renders fatigue helper text", () => {
      const { getByText } = render(<ReflectionModal {...defaultProps} />);
      expect(getByText("How are you feeling? (Optional)")).toBeTruthy();
    });
  });

  // ==========================================================================
  // RATING BUTTONS TESTS
  // ==========================================================================
  describe("Rating Buttons", () => {
    it("renders all 5 rating buttons", () => {
      const { getByText } = render(<ReflectionModal {...defaultProps} />);
      expect(getByText("1")).toBeTruthy();
      expect(getByText("2")).toBeTruthy();
      expect(getByText("3")).toBeTruthy();
      expect(getByText("4")).toBeTruthy();
      expect(getByText("5")).toBeTruthy();
    });

    it("calls setRating when rating button is pressed", () => {
      const { getByText } = render(<ReflectionModal {...defaultProps} />);
      fireEvent.press(getByText("3"));
      expect(mockSetRating).toHaveBeenCalledWith(3);
    });

    it("calls setRating with correct value for each button", () => {
      const { getByText } = render(<ReflectionModal {...defaultProps} />);

      fireEvent.press(getByText("1"));
      expect(mockSetRating).toHaveBeenLastCalledWith(1);

      fireEvent.press(getByText("5"));
      expect(mockSetRating).toHaveBeenLastCalledWith(5);
    });
  });

  // ==========================================================================
  // FATIGUE BUTTONS TESTS
  // ==========================================================================
  describe("Fatigue Buttons", () => {
    it("renders all 4 fatigue emojis", () => {
      const { getByText } = render(<ReflectionModal {...defaultProps} />);
      expect(getByText("😫")).toBeTruthy();
      expect(getByText("😐")).toBeTruthy();
      expect(getByText("😊")).toBeTruthy();
      expect(getByText("🔥")).toBeTruthy();
    });

    it("calls setFatigueInput when fatigue button is pressed", () => {
      const { getByText } = render(<ReflectionModal {...defaultProps} />);
      fireEvent.press(getByText("😫"));
      expect(mockSetFatigueInput).toHaveBeenCalledWith(0);
    });

    it("calls setFatigueInput with correct index", () => {
      const { getByText } = render(<ReflectionModal {...defaultProps} />);

      fireEvent.press(getByText("🔥"));
      expect(mockSetFatigueInput).toHaveBeenLastCalledWith(3);
    });
  });

  // ==========================================================================
  // NOTES INPUT TESTS
  // ==========================================================================
  describe("Notes Input", () => {
    it("does not render text input when not extended", () => {
      const { queryByPlaceholderText } = render(
        <ReflectionModal {...defaultProps} />,
      );
      expect(queryByPlaceholderText("Notes (optional)...")).toBeNull();
    });

    it("renders text input when extended", () => {
      const props = { ...defaultProps, extended: true };
      const { getByPlaceholderText } = render(<ReflectionModal {...props} />);
      expect(getByPlaceholderText("Notes (optional)...")).toBeTruthy();
    });

    it("calls setReflection when text changes", () => {
      const props = { ...defaultProps, extended: true };
      const { getByPlaceholderText } = render(<ReflectionModal {...props} />);
      fireEvent.changeText(
        getByPlaceholderText("Notes (optional)..."),
        "Great session!",
      );
      expect(mockSetReflection).toHaveBeenCalledWith("Great session!");
    });
  });

  // ==========================================================================
  // ACTION BUTTONS TESTS
  // ==========================================================================
  describe("Action Buttons", () => {
    it("renders Skip button", () => {
      const { getByText } = render(<ReflectionModal {...defaultProps} />);
      expect(getByText("Skip")).toBeTruthy();
    });

    it("renders + Notes button when not extended", () => {
      const { getByText } = render(<ReflectionModal {...defaultProps} />);
      expect(getByText("+ Notes")).toBeTruthy();
    });

    it("does not render + Notes button when extended", () => {
      const props = { ...defaultProps, extended: true };
      const { queryByText } = render(<ReflectionModal {...props} />);
      expect(queryByText("+ Notes")).toBeNull();
    });

    it("renders Submit button", () => {
      const { getByText } = render(<ReflectionModal {...defaultProps} />);
      expect(getByText("Submit")).toBeTruthy();
    });

    it("renders Finish button when isLastItem", () => {
      const props = { ...defaultProps, isLastItem: true, rating: 3 };
      const { getByText } = render(<ReflectionModal {...props} />);
      expect(getByText("Finish")).toBeTruthy();
    });

    it("calls onSkip when Skip is pressed", () => {
      const { getByText } = render(<ReflectionModal {...defaultProps} />);
      fireEvent.press(getByText("Skip"));
      expect(mockOnSkip).toHaveBeenCalledTimes(1);
    });

    it("calls onExtend when + Notes is pressed", () => {
      const { getByText } = render(<ReflectionModal {...defaultProps} />);
      fireEvent.press(getByText("+ Notes"));
      expect(mockOnExtend).toHaveBeenCalledTimes(1);
    });

    it("calls onSubmit when Submit is pressed with rating", () => {
      const props = { ...defaultProps, rating: 3 };
      const { getByText } = render(<ReflectionModal {...props} />);
      fireEvent.press(getByText("Submit"));
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // SUBMIT BUTTON DISABLED STATE
  // ==========================================================================
  describe("Submit Button Disabled State", () => {
    it("submit button is disabled when no rating", () => {
      const { getByLabelText } = render(<ReflectionModal {...defaultProps} />);
      const submitButton = getByLabelText("Submit rating");
      expect(submitButton.props.accessibilityState?.disabled).toBe(true);
    });

    it("submit button is disabled when submitting", () => {
      const props = { ...defaultProps, rating: 3, submitting: true };
      const { getByLabelText } = render(<ReflectionModal {...props} />);
      const submitButton = getByLabelText("Submit rating");
      expect(submitButton.props.accessibilityState?.disabled).toBe(true);
    });
  });

  // ==========================================================================
  // END PRACTICE LINK TESTS
  // ==========================================================================
  describe("End Practice Link", () => {
    it("renders End Practice link when not last item", () => {
      const { getByText } = render(<ReflectionModal {...defaultProps} />);
      expect(getByText("End Practice & Go Home")).toBeTruthy();
    });

    it("does not render End Practice link when last item", () => {
      const props = { ...defaultProps, isLastItem: true };
      const { queryByText } = render(<ReflectionModal {...props} />);
      expect(queryByText("End Practice & Go Home")).toBeNull();
    });

    it("calls onEndPractice when End Practice is pressed", () => {
      const { getByText } = render(<ReflectionModal {...defaultProps} />);
      fireEvent.press(getByText("End Practice & Go Home"));
      expect(mockOnEndPractice).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // SUBMITTING STATE TESTS
  // ==========================================================================
  describe("Submitting State", () => {
    it("shows ActivityIndicator when submitting", () => {
      const props = { ...defaultProps, rating: 3, submitting: true };
      const { queryByText, UNSAFE_queryByType } = render(
        <ReflectionModal {...props} />,
      );
      expect(queryByText("Submit")).toBeNull();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================
  describe("Accessibility", () => {
    it("has accessible rating buttons", () => {
      const { getByLabelText } = render(<ReflectionModal {...defaultProps} />);
      expect(getByLabelText("Rate 1 out of 5")).toBeTruthy();
      expect(getByLabelText("Rate 5 out of 5")).toBeTruthy();
    });

    it("has accessible fatigue buttons", () => {
      const { getByLabelText } = render(<ReflectionModal {...defaultProps} />);
      expect(getByLabelText("Select fatigue level exhausted")).toBeTruthy();
      expect(getByLabelText("Select fatigue level energized")).toBeTruthy();
    });

    it("has accessible skip button", () => {
      const { getByLabelText } = render(<ReflectionModal {...defaultProps} />);
      expect(getByLabelText("Skip reflection")).toBeTruthy();
    });

    it("has accessible notes button", () => {
      const { getByLabelText } = render(<ReflectionModal {...defaultProps} />);
      expect(getByLabelText("Add notes")).toBeTruthy();
    });

    it("has accessible submit button", () => {
      const { getByLabelText } = render(<ReflectionModal {...defaultProps} />);
      expect(getByLabelText("Submit rating")).toBeTruthy();
    });

    it("has accessible finish session label when last item", () => {
      const props = { ...defaultProps, isLastItem: true, rating: 3 };
      const { getByLabelText } = render(<ReflectionModal {...props} />);
      expect(getByLabelText("Finish session")).toBeTruthy();
    });

    it("has accessible end practice link", () => {
      const { getByLabelText } = render(<ReflectionModal {...defaultProps} />);
      expect(getByLabelText("End practice and go home")).toBeTruthy();
    });
  });
});
