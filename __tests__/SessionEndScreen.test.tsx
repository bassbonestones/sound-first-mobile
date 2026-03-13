/**
 * SessionEndScreen tests
 *
 * Fully typed TypeScript test file.
 */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SessionEndScreen from "../src/screens/SessionEndScreen";

interface MockNavigation {
  reset: jest.Mock;
  replace: jest.Mock;
}

interface MockRoute {
  params?: {
    completedCount?: number;
    totalDuration?: number;
    sessionParams?: {
      userId: number;
      duration: number;
    };
  };
}

describe("SessionEndScreen", () => {
  const mockNavigation: MockNavigation = {
    reset: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders without crashing", () => {
      const route: MockRoute = { params: {} };
      const { getByText } = render(
        <SessionEndScreen navigation={mockNavigation} route={route} />,
      );
      expect(getByText("Session Complete!")).toBeTruthy();
    });

    it("displays completion icon", () => {
      const route: MockRoute = { params: {} };
      const { getByText } = render(
        <SessionEndScreen navigation={mockNavigation} route={route} />,
      );
      expect(getByText("🎉")).toBeTruthy();
    });

    it("displays completion message", () => {
      const route: MockRoute = { params: {} };
      const { getByText } = render(
        <SessionEndScreen navigation={mockNavigation} route={route} />,
      );
      expect(getByText("Great work on your practice today")).toBeTruthy();
    });

    it("renders both action buttons", () => {
      const route: MockRoute = { params: {} };
      const { getByText } = render(
        <SessionEndScreen navigation={mockNavigation} route={route} />,
      );
      expect(getByText("Keep Practicing")).toBeTruthy();
      expect(getByText("Go Home")).toBeTruthy();
    });

    it("renders button icons", () => {
      const route: MockRoute = { params: {} };
      const { getByText } = render(
        <SessionEndScreen navigation={mockNavigation} route={route} />,
      );
      expect(getByText("➕")).toBeTruthy();
      expect(getByText("🏠")).toBeTruthy();
    });
  });

  describe("Activity count display", () => {
    it("shows completed count from route params", () => {
      const route: MockRoute = { params: { completedCount: 5 } };
      const { getByText } = render(
        <SessionEndScreen navigation={mockNavigation} route={route} />,
      );
      expect(getByText("5")).toBeTruthy();
      expect(getByText("Activities")).toBeTruthy();
    });

    it("shows singular Activity for count of 1", () => {
      const route: MockRoute = { params: { completedCount: 1 } };
      const { getByText } = render(
        <SessionEndScreen navigation={mockNavigation} route={route} />,
      );
      expect(getByText("1")).toBeTruthy();
      expect(getByText("Activity")).toBeTruthy();
    });

    it("shows 0 activities with plural label", () => {
      const route: MockRoute = { params: { completedCount: 0 } };
      const { getByText } = render(
        <SessionEndScreen navigation={mockNavigation} route={route} />,
      );
      expect(getByText("0")).toBeTruthy();
      expect(getByText("Activities")).toBeTruthy();
    });

    it("handles large activity counts", () => {
      const route: MockRoute = { params: { completedCount: 100 } };
      const { getByText } = render(
        <SessionEndScreen navigation={mockNavigation} route={route} />,
      );
      expect(getByText("100")).toBeTruthy();
      expect(getByText("Activities")).toBeTruthy();
    });
  });

  describe("Duration display", () => {
    it("shows duration when provided", () => {
      const route: MockRoute = { params: { totalDuration: 15 } };
      const { getByText } = render(
        <SessionEndScreen navigation={mockNavigation} route={route} />,
      );
      expect(getByText("15")).toBeTruthy();
      expect(getByText("Minutes")).toBeTruthy();
    });

    it("hides duration when not provided", () => {
      const route: MockRoute = { params: { totalDuration: 0 } };
      const { queryByText } = render(
        <SessionEndScreen navigation={mockNavigation} route={route} />,
      );
      expect(queryByText("Minutes")).toBeNull();
    });

    it("shows duration for 1 minute", () => {
      const route: MockRoute = { params: { totalDuration: 1 } };
      const { getByText } = render(
        <SessionEndScreen navigation={mockNavigation} route={route} />,
      );
      expect(getByText("1")).toBeTruthy();
      expect(getByText("Minutes")).toBeTruthy();
    });

    it("handles large durations", () => {
      const route: MockRoute = { params: { totalDuration: 120 } };
      const { getByText } = render(
        <SessionEndScreen navigation={mockNavigation} route={route} />,
      );
      expect(getByText("120")).toBeTruthy();
    });

    it("shows both stats when both provided", () => {
      const route: MockRoute = {
        params: { completedCount: 10, totalDuration: 30 },
      };
      const { getByText } = render(
        <SessionEndScreen navigation={mockNavigation} route={route} />,
      );
      expect(getByText("10")).toBeTruthy();
      expect(getByText("Activities")).toBeTruthy();
      expect(getByText("30")).toBeTruthy();
      expect(getByText("Minutes")).toBeTruthy();
    });
  });

  describe("Navigation actions", () => {
    it("navigates home when Go Home is pressed", () => {
      const route: MockRoute = { params: {} };
      const { getByText } = render(
        <SessionEndScreen navigation={mockNavigation} route={route} />,
      );

      fireEvent.press(getByText("Go Home"));

      expect(mockNavigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: "Home" }],
      });
    });

    it("resets navigation stack with single home route", () => {
      const route: MockRoute = { params: {} };
      const { getByText } = render(
        <SessionEndScreen navigation={mockNavigation} route={route} />,
      );

      fireEvent.press(getByText("Go Home"));

      expect(mockNavigation.reset).toHaveBeenCalledTimes(1);
      const resetConfig = mockNavigation.reset.mock.calls[0][0];
      expect(resetConfig.index).toBe(0);
      expect(resetConfig.routes.length).toBe(1);
    });

    it("extends session when Keep Practicing is pressed", () => {
      const route: MockRoute = {
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

    it("passes sessionKey when extending", () => {
      const route: MockRoute = {
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
          sessionKey: expect.any(Number),
        }),
      );
    });
  });

  describe("Accessibility", () => {
    it("has accessibility labels on buttons", () => {
      const route: MockRoute = { params: {} };
      const { getByLabelText } = render(
        <SessionEndScreen navigation={mockNavigation} route={route} />,
      );

      expect(getByLabelText("Keep practicing")).toBeTruthy();
      expect(getByLabelText("Go home")).toBeTruthy();
    });

    it("has button accessibility role", () => {
      const route: MockRoute = { params: {} };
      const { getAllByRole } = render(
        <SessionEndScreen navigation={mockNavigation} route={route} />,
      );

      const buttons = getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Edge cases", () => {
    it("handles missing route params gracefully", () => {
      const route: MockRoute = {};
      const { getByText } = render(
        <SessionEndScreen navigation={mockNavigation} route={route} />,
      );
      // Should default to 0 completed
      expect(getByText("0")).toBeTruthy();
    });

    it("handles undefined route.params", () => {
      const route = { params: undefined } as unknown as MockRoute;
      const { getByText } = render(
        <SessionEndScreen navigation={mockNavigation} route={route} />,
      );
      expect(getByText("Session Complete!")).toBeTruthy();
      expect(getByText("0")).toBeTruthy();
    });

    it("handles empty sessionParams when extending", () => {
      const route: MockRoute = { params: {} };
      const { getByText } = render(
        <SessionEndScreen navigation={mockNavigation} route={route} />,
      );

      fireEvent.press(getByText("Keep Practicing"));

      expect(mockNavigation.replace).toHaveBeenCalledWith(
        "Session",
        expect.objectContaining({
          extendSession: true,
        }),
      );
    });

    it("preserves sessionParams when extending", () => {
      const route: MockRoute = {
        params: {
          sessionParams: { userId: 42, duration: 25 },
        },
      };
      const { getByText } = render(
        <SessionEndScreen navigation={mockNavigation} route={route} />,
      );

      fireEvent.press(getByText("Keep Practicing"));

      expect(mockNavigation.replace).toHaveBeenCalledWith(
        "Session",
        expect.objectContaining({
          userId: 42,
          duration: 25,
        }),
      );
    });
  });
});
