/**
 * HomeScreen tests
 */
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import HomeScreen from "../src/screens/HomeScreen";

// Mock navigation hooks
jest.mock("@react-navigation/native", () => ({
  useFocusEffect: jest.fn((callback) => callback()),
}));

// Mock UserContext
const mockLoadInstruments = jest.fn();
const mockSelectInstrument = jest.fn();

jest.mock("../src/context/UserContext", () => ({
  useUser: () => ({
    instruments: [
      { id: 1, instrument_name: "Trombone", day0_completed: true },
      { id: 2, instrument_name: "Trumpet", day0_completed: false },
    ],
    selectedInstrument: {
      id: 1,
      instrument_name: "Trombone",
      day0_completed: true,
    },
    loadInstruments: mockLoadInstruments,
    selectInstrument: mockSelectInstrument,
    loading: false,
  }),
}));

// Mock ErrorBoundary
jest.mock("../src/components/ErrorBoundary", () => {
  const React = require("react");
  return function MockErrorBoundary({ children }) {
    return <>{children}</>;
  };
});

// Mock ResetButton
jest.mock("../src/components/ResetButton", () => {
  const { View, Text } = require("react-native");
  return function MockResetButton() {
    return (
      <View testID="reset-button">
        <Text>Reset</Text>
      </View>
    );
  };
});

describe("HomeScreen", () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
    expect(getByText("Sound First")).toBeTruthy();
  });

  it("displays app title and subtitle", () => {
    const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
    expect(getByText("Sound First")).toBeTruthy();
    expect(getByText("Ear-First Music Practice")).toBeTruthy();
  });

  it("shows the Practice button", () => {
    const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
    expect(getByText("Start Practice")).toBeTruthy();
  });

  it("displays currently selected instrument", () => {
    const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
    expect(getByText("Practicing:")).toBeTruthy();
    expect(getByText("Trombone")).toBeTruthy();
  });

  it("loads instruments on focus", () => {
    render(<HomeScreen navigation={mockNavigation} />);
    expect(mockLoadInstruments).toHaveBeenCalled();
  });

  it("navigates to StartPractice when Practice pressed (day0 completed)", () => {
    const { getByText } = render(<HomeScreen navigation={mockNavigation} />);

    fireEvent.press(getByText("Start Practice"));

    expect(mockNavigation.navigate).toHaveBeenCalledWith(
      "StartPractice",
      expect.objectContaining({ instrumentId: 1 }),
    );
  });

  it("has accessibility label on instrument selector", () => {
    const { getByLabelText } = render(
      <HomeScreen navigation={mockNavigation} />,
    );
    expect(
      getByLabelText("Select instrument. Currently: Trombone"),
    ).toBeTruthy();
  });

  it("renders ResetButton", () => {
    const { getByTestId } = render(<HomeScreen navigation={mockNavigation} />);
    expect(getByTestId("reset-button")).toBeTruthy();
  });

  it("shows trombone emoji for trombone instrument", () => {
    const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
    // Trombone uses the trumpet emoji (🎺)
    expect(getByText("🎺")).toBeTruthy();
  });
});
