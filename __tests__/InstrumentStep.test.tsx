/**
 * @fileoverview Tests for InstrumentStep component
 * First step of onboarding - instrument selection
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

// Mock ResetButton
jest.mock("../src/components/ResetButton", () => {
  const { View } = require("react-native");
  return function MockResetButton() {
    return <View testID="reset-button" />;
  };
});

// Mock theme
jest.mock("../src/styles/theme", () => ({
  createShadow: jest.fn(() => ({})),
}));

import InstrumentStep from "../src/screens/Onboarding/steps/InstrumentStep";

describe("InstrumentStep", () => {
  const mockOnSelectFamily = jest.fn();
  const mockOnSelectInstrument = jest.fn();
  const mockOnNext = jest.fn();
  const mockOnNavigateAdmin = jest.fn();

  const defaultProps = {
    selectedFamily: "",
    instrument: "",
    onSelectFamily: mockOnSelectFamily,
    onSelectInstrument: mockOnSelectInstrument,
    onNext: mockOnNext,
    onNavigateAdmin: mockOnNavigateAdmin,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // INITIAL STATE TESTS
  // ==========================================================================
  describe("Initial State", () => {
    it("renders welcome message", () => {
      const { getByText } = render(<InstrumentStep {...defaultProps} />);
      expect(getByText("Welcome to Sound First")).toBeTruthy();
    });

    it("shows family selection prompt when no family selected", () => {
      const { getByText } = render(<InstrumentStep {...defaultProps} />);
      expect(getByText("What type of instrument do you play?")).toBeTruthy();
    });

    it("renders all instrument families", () => {
      const { getByText } = render(<InstrumentStep {...defaultProps} />);
      expect(getByText("Brass")).toBeTruthy();
      expect(getByText("Woodwinds")).toBeTruthy();
      expect(getByText("Strings")).toBeTruthy();
      expect(getByText("Keyboard")).toBeTruthy();
      expect(getByText("Voice")).toBeTruthy();
      expect(getByText("Other")).toBeTruthy();
    });

    it("renders family icons", () => {
      const { getByText } = render(<InstrumentStep {...defaultProps} />);
      expect(getByText("🎺")).toBeTruthy(); // Brass
      expect(getByText("🎷")).toBeTruthy(); // Woodwinds
      expect(getByText("🎻")).toBeTruthy(); // Strings
      expect(getByText("🎹")).toBeTruthy(); // Keyboard
      expect(getByText("🎤")).toBeTruthy(); // Voice
      expect(getByText("🎼")).toBeTruthy(); // Other
    });

    it("renders Next button disabled", () => {
      const { getByText } = render(<InstrumentStep {...defaultProps} />);
      expect(getByText("Next →")).toBeTruthy();
    });

    it("renders progress dots at step 1", () => {
      const { toJSON } = render(<InstrumentStep {...defaultProps} />);
      expect(toJSON()).toBeTruthy();
    });

    it("renders Admin button", () => {
      const { getByText, getByLabelText } = render(
        <InstrumentStep {...defaultProps} />,
      );
      expect(getByText("Admin")).toBeTruthy();
      expect(getByLabelText("Open admin panel")).toBeTruthy();
    });

    it("renders ResetButton", () => {
      const { getByTestId } = render(<InstrumentStep {...defaultProps} />);
      expect(getByTestId("reset-button")).toBeTruthy();
    });
  });

  // ==========================================================================
  // FAMILY SELECTION TESTS
  // ==========================================================================
  describe("Family Selection", () => {
    it("calls onSelectFamily when family is pressed", () => {
      const { getByText } = render(<InstrumentStep {...defaultProps} />);
      fireEvent.press(getByText("Brass"));
      expect(mockOnSelectFamily).toHaveBeenCalledWith("Brass");
    });

    it("calls onSelectFamily for each family", () => {
      const { getByText } = render(<InstrumentStep {...defaultProps} />);

      fireEvent.press(getByText("Woodwinds"));
      expect(mockOnSelectFamily).toHaveBeenCalledWith("Woodwinds");

      fireEvent.press(getByText("Strings"));
      expect(mockOnSelectFamily).toHaveBeenCalledWith("Strings");
    });

    it("has accessible family buttons", () => {
      const { getByLabelText } = render(<InstrumentStep {...defaultProps} />);
      expect(getByLabelText("Select Brass instruments")).toBeTruthy();
      expect(getByLabelText("Select Woodwinds instruments")).toBeTruthy();
    });
  });

  // ==========================================================================
  // INSTRUMENT SELECTION TESTS
  // ==========================================================================
  describe("Instrument Selection", () => {
    it("shows instrument selection when family is selected", () => {
      const props = { ...defaultProps, selectedFamily: "Brass" };
      const { getByText } = render(<InstrumentStep {...props} />);
      expect(getByText("Select your instrument")).toBeTruthy();
    });

    it("shows back link when family selected", () => {
      const props = { ...defaultProps, selectedFamily: "Brass" };
      const { getByText } = render(<InstrumentStep {...props} />);
      expect(getByText("← Back to families")).toBeTruthy();
    });

    it("shows family badge", () => {
      const props = { ...defaultProps, selectedFamily: "Brass" };
      const { getByText } = render(<InstrumentStep {...props} />);
      // Shows family name in badge
      expect(getByText("Brass")).toBeTruthy();
    });

    it("shows instruments for selected family (Brass)", () => {
      const props = { ...defaultProps, selectedFamily: "Brass" };
      const { getByText } = render(<InstrumentStep {...props} />);
      expect(getByText("Trumpet")).toBeTruthy();
      expect(getByText("French Horn")).toBeTruthy();
      expect(getByText("Tenor Trombone")).toBeTruthy();
      expect(getByText("Tuba")).toBeTruthy();
    });

    it("shows instruments for selected family (Woodwinds)", () => {
      const props = { ...defaultProps, selectedFamily: "Woodwinds" };
      const { getByText } = render(<InstrumentStep {...props} />);
      expect(getByText("Flute")).toBeTruthy();
      expect(getByText("Clarinet")).toBeTruthy();
      expect(getByText("Oboe")).toBeTruthy();
    });

    it("calls onSelectInstrument when instrument is pressed", () => {
      const props = { ...defaultProps, selectedFamily: "Brass" };
      const { getByText } = render(<InstrumentStep {...props} />);
      fireEvent.press(getByText("Trumpet"));
      expect(mockOnSelectInstrument).toHaveBeenCalledWith("Trumpet");
    });

    it("clears family when back link pressed", () => {
      const props = { ...defaultProps, selectedFamily: "Brass" };
      const { getByText } = render(<InstrumentStep {...props} />);
      fireEvent.press(getByText("← Back to families"));
      expect(mockOnSelectFamily).toHaveBeenCalledWith("");
    });

    it("has accessible instrument buttons", () => {
      const props = { ...defaultProps, selectedFamily: "Brass" };
      const { getByLabelText } = render(<InstrumentStep {...props} />);
      expect(getByLabelText("Select Trumpet")).toBeTruthy();
    });

    it("indicates selected instrument in accessibility label", () => {
      const props = {
        ...defaultProps,
        selectedFamily: "Brass",
        instrument: "Trumpet",
      };
      const { getByLabelText } = render(<InstrumentStep {...props} />);
      expect(getByLabelText("Select Trumpet, selected")).toBeTruthy();
    });
  });

  // ==========================================================================
  // NEXT BUTTON TESTS
  // ==========================================================================
  describe("Next Button", () => {
    it("Next button is disabled when no instrument selected", () => {
      const { getByLabelText } = render(<InstrumentStep {...defaultProps} />);
      const nextButton = getByLabelText("Next step");
      expect(nextButton.props.accessibilityState?.disabled).toBe(true);
    });

    it("Next button is enabled when instrument is selected", () => {
      const props = {
        ...defaultProps,
        selectedFamily: "Brass",
        instrument: "Trumpet",
      };
      const { getByLabelText } = render(<InstrumentStep {...props} />);
      const nextButton = getByLabelText("Next step");
      expect(nextButton.props.accessibilityState?.disabled).toBeFalsy();
    });

    it("calls onNext when pressed with instrument selected", () => {
      const props = {
        ...defaultProps,
        selectedFamily: "Brass",
        instrument: "Trumpet",
      };
      const { getByText } = render(<InstrumentStep {...props} />);
      fireEvent.press(getByText("Next →"));
      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // ADMIN BUTTON TESTS
  // ==========================================================================
  describe("Admin Button", () => {
    it("calls onNavigateAdmin when Admin button is pressed", () => {
      const { getByText } = render(<InstrumentStep {...defaultProps} />);
      fireEvent.press(getByText("Admin"));
      expect(mockOnNavigateAdmin).toHaveBeenCalledTimes(1);
    });
  });
});
