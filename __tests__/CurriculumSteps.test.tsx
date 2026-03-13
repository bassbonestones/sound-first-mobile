/**
 * @fileoverview Tests for CurriculumSteps component
 * Displays curriculum steps with completion status
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

// Mock styles
jest.mock("../src/screens/Session/components/styles", () => ({
  styles: {
    cardContainer: {},
    cardTitle: {},
    stepItem: {},
    stepItemActive: {},
    stepItemCompleted: {},
    stepItemDefault: {},
    stepIcon: {},
    stepContent: {},
    stepLabel: {},
    stepLabelActive: {},
    stepLabelCompleted: {},
    stepLabelDefault: {},
    stepInstruction: {},
    stepCheckmark: {},
    completeStepButton: {},
    completeStepButtonText: {},
  },
  colors: {},
}));

import CurriculumSteps from "../src/screens/Session/components/CurriculumSteps";

describe("CurriculumSteps", () => {
  const mockOnCompleteStep = jest.fn();

  const baseSteps = [
    { type: "LISTEN", is_completed: true },
    { type: "SING", is_completed: false, instruction: "Sing the melody" },
    { type: "PLAY", is_completed: false },
  ];

  const defaultProps = {
    curriculumSteps: baseSteps,
    currentStepIndex: 1,
    currentStep: baseSteps[1],
    rating: 3,
    onCompleteStep: mockOnCompleteStep,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // BASIC RENDERING TESTS
  // ==========================================================================
  describe("Basic Rendering", () => {
    it("renders section title", () => {
      const { getByText } = render(<CurriculumSteps {...defaultProps} />);
      expect(getByText("Curriculum Steps")).toBeTruthy();
    });

    it("renders all step types", () => {
      const { getByText } = render(<CurriculumSteps {...defaultProps} />);
      expect(getByText("Listen")).toBeTruthy();
      expect(getByText("Sing")).toBeTruthy();
      expect(getByText("Play")).toBeTruthy();
    });

    it("renders step icons", () => {
      const { getByText } = render(<CurriculumSteps {...defaultProps} />);
      expect(getByText("🎧")).toBeTruthy(); // LISTEN
      expect(getByText("🎤")).toBeTruthy(); // SING
      expect(getByText("🎹")).toBeTruthy(); // PLAY
    });

    it("renders instruction when provided", () => {
      const { getByText } = render(<CurriculumSteps {...defaultProps} />);
      expect(getByText("Sing the melody")).toBeTruthy();
    });

    it("renders checkmark for completed steps", () => {
      const { getByText } = render(<CurriculumSteps {...defaultProps} />);
      expect(getByText("✓")).toBeTruthy();
    });
  });

  // ==========================================================================
  // EMPTY STATE TESTS
  // ==========================================================================
  describe("Empty State", () => {
    it("returns null when curriculumSteps is empty", () => {
      const props = { ...defaultProps, curriculumSteps: [] };
      const { toJSON } = render(<CurriculumSteps {...props} />);
      expect(toJSON()).toBeNull();
    });
  });

  // ==========================================================================
  // COMPLETE STEP BUTTON TESTS
  // ==========================================================================
  describe("Complete Step Button", () => {
    it("renders Complete Step button for active incomplete step", () => {
      const { getByText, getByLabelText } = render(
        <CurriculumSteps {...defaultProps} />,
      );
      expect(getByText("Complete Step")).toBeTruthy();
      expect(getByLabelText("Complete current step")).toBeTruthy();
    });

    it("does not render button when current step is completed", () => {
      const props = {
        ...defaultProps,
        currentStepIndex: 0,
        currentStep: baseSteps[0], // completed step
      };
      const { queryByText } = render(<CurriculumSteps {...props} />);
      expect(queryByText("Complete Step")).toBeNull();
    });

    it("does not render button when currentStep is undefined", () => {
      const props = { ...defaultProps, currentStep: undefined };
      const { queryByText } = render(<CurriculumSteps {...props} />);
      expect(queryByText("Complete Step")).toBeNull();
    });

    it("calls onCompleteStep with correct arguments when pressed", () => {
      const { getByText } = render(<CurriculumSteps {...defaultProps} />);
      fireEvent.press(getByText("Complete Step"));
      expect(mockOnCompleteStep).toHaveBeenCalledWith(1, 3);
    });
  });

  // ==========================================================================
  // STEP TYPE VARIATIONS
  // ==========================================================================
  describe("Step Type Variations", () => {
    it("renders IMAGINE step", () => {
      const steps = [{ type: "IMAGINE", is_completed: false }];
      const props = {
        ...defaultProps,
        curriculumSteps: steps,
        currentStepIndex: 0,
        currentStep: steps[0],
      };
      const { getByText } = render(<CurriculumSteps {...props} />);
      expect(getByText("💭")).toBeTruthy();
      expect(getByText("Imagine")).toBeTruthy();
    });

    it("renders REFLECT step", () => {
      const steps = [{ type: "REFLECT", is_completed: false }];
      const props = {
        ...defaultProps,
        curriculumSteps: steps,
        currentStepIndex: 0,
        currentStep: steps[0],
      };
      const { getByText } = render(<CurriculumSteps {...props} />);
      expect(getByText("💡")).toBeTruthy();
      expect(getByText("Reflect")).toBeTruthy();
    });

    it("renders RECOVERY step", () => {
      const steps = [{ type: "RECOVERY", is_completed: false }];
      const props = {
        ...defaultProps,
        curriculumSteps: steps,
        currentStepIndex: 0,
        currentStep: steps[0],
      };
      const { getByText } = render(<CurriculumSteps {...props} />);
      expect(getByText("😮‍💨")).toBeTruthy();
      expect(getByText("Recovery")).toBeTruthy();
    });

    it("handles unknown step type with fallback", () => {
      const steps = [{ type: "UNKNOWN", is_completed: false }];
      const props = {
        ...defaultProps,
        curriculumSteps: steps,
        currentStepIndex: 0,
        currentStep: steps[0],
      };
      const { getByText } = render(<CurriculumSteps {...props} />);
      expect(getByText("📋")).toBeTruthy(); // Default icon
      expect(getByText("UNKNOWN")).toBeTruthy(); // Falls back to type string
    });
  });

  // ==========================================================================
  // MULTIPLE COMPLETED STEPS
  // ==========================================================================
  describe("Multiple Completed Steps", () => {
    it("renders multiple checkmarks for multiple completed steps", () => {
      const steps = [
        { type: "LISTEN", is_completed: true },
        { type: "SING", is_completed: true },
        { type: "PLAY", is_completed: false },
      ];
      const props = {
        ...defaultProps,
        curriculumSteps: steps,
        currentStepIndex: 2,
        currentStep: steps[2],
      };
      const { getAllByText } = render(<CurriculumSteps {...props} />);
      const checkmarks = getAllByText("✓");
      expect(checkmarks.length).toBe(2);
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================
  describe("Accessibility", () => {
    it("has accessible complete button", () => {
      const { getByRole } = render(<CurriculumSteps {...defaultProps} />);
      expect(getByRole("button")).toBeTruthy();
    });
  });
});
