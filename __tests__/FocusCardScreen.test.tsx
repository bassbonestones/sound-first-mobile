/**
 * FocusCardScreen tests
 *
 * Fully typed TypeScript test file.
 */
import React from "react";
import { render } from "@testing-library/react-native";
import FocusCardScreen from "../src/screens/FocusCardScreen";

// Mock ResetButton
jest.mock("../src/components/ResetButton", () => {
  const { View, Text } = require("react-native");
  return function MockResetButton(): React.JSX.Element {
    return (
      <View testID="reset-button">
        <Text>Reset</Text>
      </View>
    );
  };
});

interface MockRoute {
  params: {
    focusCard: string;
  };
}

describe("FocusCardScreen", () => {
  const mockRoute: MockRoute = {
    params: {
      focusCard: "Practice long tones with proper breath support",
    },
  };

  it("renders without crashing", () => {
    const { getByText } = render(<FocusCardScreen route={mockRoute} />);
    expect(getByText("Focus Card")).toBeTruthy();
  });

  it("displays the focus card text from route params", () => {
    const { getByText } = render(<FocusCardScreen route={mockRoute} />);
    expect(
      getByText("Practice long tones with proper breath support"),
    ).toBeTruthy();
  });

  it("renders the ResetButton", () => {
    const { getByTestId } = render(<FocusCardScreen route={mockRoute} />);
    expect(getByTestId("reset-button")).toBeTruthy();
  });

  it("handles different focus card content", () => {
    const altRoute: MockRoute = {
      params: {
        focusCard: "Work on articulation exercises",
      },
    };
    const { getByText } = render(<FocusCardScreen route={altRoute} />);
    expect(getByText("Work on articulation exercises")).toBeTruthy();
  });
});
