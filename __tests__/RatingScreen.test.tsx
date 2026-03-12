/**
 * RatingScreen tests
 *
 * Fully typed TypeScript test file.
 */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import RatingScreen from "../src/screens/RatingScreen";

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

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

interface MockNavigation {
  navigate: jest.Mock;
}

interface MockRoute {
  params: Record<string, unknown>;
}

describe("RatingScreen", () => {
  const mockNavigation: MockNavigation = {
    navigate: jest.fn(),
  };
  const mockRoute: MockRoute = { params: {} };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true });
  });

  it("renders without crashing", () => {
    const { getByText } = render(
      <RatingScreen navigation={mockNavigation} route={mockRoute} />,
    );
    expect(getByText("Rate Your Practice")).toBeTruthy();
  });

  it("displays rating buttons 1-5", () => {
    const { getByText } = render(
      <RatingScreen navigation={mockNavigation} route={mockRoute} />,
    );
    expect(getByText("1")).toBeTruthy();
    expect(getByText("2")).toBeTruthy();
    expect(getByText("3")).toBeTruthy();
    expect(getByText("4")).toBeTruthy();
    expect(getByText("5")).toBeTruthy();
  });

  it("shows submit button after selecting a rating", () => {
    const { getByText, queryByText } = render(
      <RatingScreen navigation={mockNavigation} route={mockRoute} />,
    );

    // Submit button should not be visible initially (or should be disabled)
    // Select rating 4
    fireEvent.press(getByText("4"));

    // Now submit should be visible
    expect(getByText("Submit")).toBeTruthy();
  });

  it("allows selecting different ratings", () => {
    const { getByText, getByLabelText } = render(
      <RatingScreen navigation={mockNavigation} route={mockRoute} />,
    );

    // Select rating 3
    fireEvent.press(getByText("3"));
    expect(getByLabelText("Rate 3 out of 5, selected")).toBeTruthy();

    // Change to rating 5
    fireEvent.press(getByText("5"));
    expect(getByLabelText("Rate 5 out of 5, selected")).toBeTruthy();
  });

  it("has proper accessibility labels on rating buttons", () => {
    const { getByLabelText } = render(
      <RatingScreen navigation={mockNavigation} route={mockRoute} />,
    );

    expect(getByLabelText("Rate 1 out of 5")).toBeTruthy();
    expect(getByLabelText("Rate 2 out of 5")).toBeTruthy();
    expect(getByLabelText("Rate 3 out of 5")).toBeTruthy();
    expect(getByLabelText("Rate 4 out of 5")).toBeTruthy();
    expect(getByLabelText("Rate 5 out of 5")).toBeTruthy();
  });

  it("renders the ResetButton", () => {
    const { getByTestId } = render(
      <RatingScreen navigation={mockNavigation} route={mockRoute} />,
    );
    expect(getByTestId("reset-button")).toBeTruthy();
  });
});
