/**
 * SessionEndScreen tests
 */
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import SessionEndScreen from "../src/screens/SessionEndScreen";

describe("SessionEndScreen", () => {
  const mockNavigation = {
    reset: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    const route = { params: {} };
    const { getByText } = render(
      <SessionEndScreen navigation={mockNavigation} route={route} />,
    );
    expect(getByText("Session Complete!")).toBeTruthy();
  });

  it("displays completion icon", () => {
    const route = { params: {} };
    const { getByText } = render(
      <SessionEndScreen navigation={mockNavigation} route={route} />,
    );
    expect(getByText("🎉")).toBeTruthy();
  });

  it("displays completion message", () => {
    const route = { params: {} };
    const { getByText } = render(
      <SessionEndScreen navigation={mockNavigation} route={route} />,
    );
    expect(getByText("Great work on your practice today")).toBeTruthy();
  });

  it("shows completed count from route params", () => {
    const route = { params: { completedCount: 5 } };
    const { getByText } = render(
      <SessionEndScreen navigation={mockNavigation} route={route} />,
    );
    expect(getByText("5")).toBeTruthy();
    expect(getByText("Activities")).toBeTruthy();
  });

  it("shows singular Activity for count of 1", () => {
    const route = { params: { completedCount: 1 } };
    const { getByText } = render(
      <SessionEndScreen navigation={mockNavigation} route={route} />,
    );
    expect(getByText("1")).toBeTruthy();
    expect(getByText("Activity")).toBeTruthy();
  });

  it("shows duration when provided", () => {
    const route = { params: { totalDuration: 15 } };
    const { getByText } = render(
      <SessionEndScreen navigation={mockNavigation} route={route} />,
    );
    expect(getByText("15")).toBeTruthy();
    expect(getByText("Minutes")).toBeTruthy();
  });

  it("hides duration when not provided", () => {
    const route = { params: { totalDuration: 0 } };
    const { queryByText } = render(
      <SessionEndScreen navigation={mockNavigation} route={route} />,
    );
    expect(queryByText("Minutes")).toBeNull();
  });

  it("navigates home when Go Home is pressed", () => {
    const route = { params: {} };
    const { getByText } = render(
      <SessionEndScreen navigation={mockNavigation} route={route} />,
    );

    fireEvent.press(getByText("Go Home"));

    expect(mockNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: "Home" }],
    });
  });

  it("renders Keep Practicing button", () => {
    const route = { params: {} };
    const { getByText } = render(
      <SessionEndScreen navigation={mockNavigation} route={route} />,
    );
    expect(getByText("Keep Practicing")).toBeTruthy();
  });

  it("has accessibility labels on buttons", () => {
    const route = { params: {} };
    const { getByLabelText } = render(
      <SessionEndScreen navigation={mockNavigation} route={route} />,
    );

    expect(getByLabelText("Keep practicing")).toBeTruthy();
    expect(getByLabelText("Go home")).toBeTruthy();
  });

  it("handles missing route params gracefully", () => {
    const route = {};
    const { getByText } = render(
      <SessionEndScreen navigation={mockNavigation} route={route} />,
    );
    // Should default to 0 completed
    expect(getByText("0")).toBeTruthy();
  });

  it("extends session when Keep Practicing is pressed", () => {
    const route = {
      params: {
        sessionParams: { userId: 1, duration: 10 },
      },
    };
    const { getByText } = render(
      <SessionEndScreen navigation={mockNavigation} route={route} />,
    );

    fireEvent.press(getByText("Keep Practicing"));

    expect(mockNavigation.replace).toHaveBeenCalledWith(
      "Session",
      expect.objectContaining({
        userId: 1,
        duration: 10,
        extendSession: true,
      }),
    );
  });
});
