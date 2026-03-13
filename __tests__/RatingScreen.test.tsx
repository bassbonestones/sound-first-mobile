/**
 * RatingScreen tests
 *
 * Fully typed TypeScript test file.
 */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import RatingScreen from "../src/screens/RatingScreen";

// Mock Alert
const alertSpy = jest.spyOn(Alert, "alert");

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
    alertSpy.mockClear();
  });

  describe("Initial render", () => {
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

    it("renders the ResetButton", () => {
      const { getByTestId } = render(
        <RatingScreen navigation={mockNavigation} route={mockRoute} />,
      );
      expect(getByTestId("reset-button")).toBeTruthy();
    });
  });

  describe("Rating selection", () => {
    it("shows submit button after selecting a rating", () => {
      const { getByText, queryByText } = render(
        <RatingScreen navigation={mockNavigation} route={mockRoute} />,
      );

      fireEvent.press(getByText("4"));
      expect(getByText("Submit")).toBeTruthy();
    });

    it("allows selecting different ratings", () => {
      const { getByText, getByLabelText } = render(
        <RatingScreen navigation={mockNavigation} route={mockRoute} />,
      );

      fireEvent.press(getByText("3"));
      expect(getByLabelText("Rate 3 out of 5, selected")).toBeTruthy();

      fireEvent.press(getByText("5"));
      expect(getByLabelText("Rate 5 out of 5, selected")).toBeTruthy();
    });

    it("allows selecting rating 1", () => {
      const { getByText, getByLabelText } = render(
        <RatingScreen navigation={mockNavigation} route={mockRoute} />,
      );

      fireEvent.press(getByText("1"));
      expect(getByLabelText("Rate 1 out of 5, selected")).toBeTruthy();
    });

    it("allows selecting rating 2", () => {
      const { getByText, getByLabelText } = render(
        <RatingScreen navigation={mockNavigation} route={mockRoute} />,
      );

      fireEvent.press(getByText("2"));
      expect(getByLabelText("Rate 2 out of 5, selected")).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
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

    it("updates accessibility label when rating is selected", () => {
      const { getByText, getByLabelText, queryByLabelText } = render(
        <RatingScreen navigation={mockNavigation} route={mockRoute} />,
      );

      // Before selection
      expect(getByLabelText("Rate 4 out of 5")).toBeTruthy();

      // Select rating
      fireEvent.press(getByText("4"));

      // After selection - should have "selected" in label
      expect(getByLabelText("Rate 4 out of 5, selected")).toBeTruthy();
    });
  });

  describe("Submit functionality", () => {
    it("submits rating successfully", async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const { getByText } = render(
        <RatingScreen navigation={mockNavigation} route={mockRoute} />,
      );

      fireEvent.press(getByText("4"));
      fireEvent.press(getByText("Submit"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "http://localhost:8000/practice-attempt",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }),
        );
      });

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          "Submitted!",
          "Your practice attempt was recorded.",
        );
      });
    });

    it("navigates after successful submit", async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const { getByText } = render(
        <RatingScreen navigation={mockNavigation} route={mockRoute} />,
      );

      fireEvent.press(getByText("4"));
      fireEvent.press(getByText("Submit"));

      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith("Session");
      });
    });

    it("shows error alert on failed response", async () => {
      mockFetch.mockResolvedValue({ ok: false });

      const { getByText } = render(
        <RatingScreen navigation={mockNavigation} route={mockRoute} />,
      );

      fireEvent.press(getByText("4"));
      fireEvent.press(getByText("Submit"));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          "Error",
          "Failed to submit attempt.",
        );
      });
    });

    it("shows error alert on network error", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const { getByText } = render(
        <RatingScreen navigation={mockNavigation} route={mockRoute} />,
      );

      fireEvent.press(getByText("4"));
      fireEvent.press(getByText("Submit"));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith("Error", "Network error");
      });
    });

    it("does not navigate on error", async () => {
      mockFetch.mockResolvedValue({ ok: false });

      const { getByText } = render(
        <RatingScreen navigation={mockNavigation} route={mockRoute} />,
      );

      fireEvent.press(getByText("4"));
      fireEvent.press(getByText("Submit"));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });

      expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });

    it("includes rating in request body", async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const { getByText } = render(
        <RatingScreen navigation={mockNavigation} route={mockRoute} />,
      );

      fireEvent.press(getByText("3"));
      fireEvent.press(getByText("Submit"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
        const [, options] = mockFetch.mock.calls[0] as [
          string,
          { body: string },
        ];
        const body = JSON.parse(options.body);
        expect(body.rating).toBe(3);
      });
    });

    it("includes required fields in request body", async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const { getByText } = render(
        <RatingScreen navigation={mockNavigation} route={mockRoute} />,
      );

      fireEvent.press(getByText("5"));
      fireEvent.press(getByText("Submit"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
        const [, options] = mockFetch.mock.calls[0] as [
          string,
          { body: string },
        ];
        const body = JSON.parse(options.body);
        expect(body.user_id).toBeDefined();
        expect(body.material_id).toBeDefined();
        expect(body.key).toBeDefined();
        expect(body.timestamp).toBeDefined();
      });
    });
  });
});
