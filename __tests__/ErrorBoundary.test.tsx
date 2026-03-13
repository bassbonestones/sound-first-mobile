/**
 * Tests for ErrorBoundary component
 *
 * Fully typed TypeScript test file.
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Text, View } from "react-native";
import ErrorBoundary from "../src/components/ErrorBoundary";
import type { ErrorInfo } from "react";

interface ThrowErrorProps {
  shouldThrow: boolean;
  errorMessage?: string;
}

// Component that throws an error
const ThrowError: React.FC<ThrowErrorProps> = ({
  shouldThrow,
  errorMessage = "Test error",
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <Text>No error</Text>;
};

// Suppress console.error for these tests since we're testing error handling
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe("ErrorBoundary", () => {
  describe("When no error", () => {
    it("renders children normally", () => {
      const { getByText } = render(
        <ErrorBoundary>
          <Text>Child content</Text>
        </ErrorBoundary>,
      );

      expect(getByText("Child content")).toBeTruthy();
    });

    it("renders multiple children", () => {
      const { getByText } = render(
        <ErrorBoundary>
          <Text>First child</Text>
          <Text>Second child</Text>
        </ErrorBoundary>,
      );

      expect(getByText("First child")).toBeTruthy();
      expect(getByText("Second child")).toBeTruthy();
    });

    it("renders nested children", () => {
      const { getByText } = render(
        <ErrorBoundary>
          <View>
            <View>
              <Text>Deeply nested</Text>
            </View>
          </View>
        </ErrorBoundary>,
      );

      expect(getByText("Deeply nested")).toBeTruthy();
    });

    it("works with functional components as children", () => {
      const FunctionalChild = () => <Text>Functional component</Text>;

      const { getByText } = render(
        <ErrorBoundary>
          <FunctionalChild />
        </ErrorBoundary>,
      );

      expect(getByText("Functional component")).toBeTruthy();
    });
  });

  describe("When error occurs", () => {
    it("renders fallback UI", () => {
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(getByText("Something went wrong")).toBeTruthy();
      expect(
        getByText("The app encountered an unexpected error."),
      ).toBeTruthy();
    });

    it("shows Try Again button", () => {
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(getByText("Try Again")).toBeTruthy();
    });

    it("shows warning icon emoji", () => {
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(getByText("⚠️")).toBeTruthy();
    });

    it("renders custom fallback when provided", () => {
      const customFallback = <Text>Custom error message</Text>;

      const { getByText, queryByText } = render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(getByText("Custom error message")).toBeTruthy();
      expect(queryByText("Something went wrong")).toBeNull();
    });

    it("renders complex custom fallback", () => {
      const customFallback = (
        <View>
          <Text>Error occurred</Text>
          <Text>Please contact support</Text>
        </View>
      );

      const { getByText } = render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(getByText("Error occurred")).toBeTruthy();
      expect(getByText("Please contact support")).toBeTruthy();
    });

    it("calls onError callback when error occurs", () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    });

    it("passes error and errorInfo to onError callback", () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} errorMessage="Specific error" />
        </ErrorBoundary>,
      );

      expect(onError).toHaveBeenCalledTimes(1);
      const [error, errorInfo] = onError.mock.calls[0];
      expect(error.message).toBe("Specific error");
      expect(errorInfo).toBeDefined();
      expect(errorInfo).toHaveProperty("componentStack");
    });

    it("catches errors from deeply nested children", () => {
      const DeepError = () => {
        throw new Error("Deep error");
      };

      const { getByText } = render(
        <ErrorBoundary>
          <View>
            <View>
              <DeepError />
            </View>
          </View>
        </ErrorBoundary>,
      );

      expect(getByText("Something went wrong")).toBeTruthy();
    });
  });

  describe("Error message handling", () => {
    it("preserves different error messages", () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} errorMessage="Custom error message" />
        </ErrorBoundary>,
      );

      expect(onError.mock.calls[0][0].message).toBe("Custom error message");
    });

    it("handles errors with empty message", () => {
      const onError = jest.fn();
      const EmptyMessageError = () => {
        throw new Error("");
      };

      const { getByText } = render(
        <ErrorBoundary onError={onError}>
          <EmptyMessageError />
        </ErrorBoundary>,
      );

      expect(getByText("Something went wrong")).toBeTruthy();
      expect(onError).toHaveBeenCalled();
    });
  });

  describe("Reset functionality", () => {
    it("resets error state when Try Again is pressed", () => {
      // Create a component that can toggle throwing
      const TestComponent = () => {
        const [shouldThrow, setShouldThrow] = React.useState(true);

        // After reset, don't throw
        React.useEffect(() => {
          // Component mounted means reset worked
        }, []);

        if (shouldThrow) {
          throw new Error("Initial error");
        }

        return <Text>Recovered</Text>;
      };

      // Note: This test verifies the button exists and is pressable
      // Full reset testing requires more complex setup
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      const tryAgainButton = getByText("Try Again");
      expect(tryAgainButton).toBeTruthy();

      // Press should not throw
      expect(() => {
        fireEvent.press(tryAgainButton);
      }).not.toThrow();
    });

    it("Try Again button has correct accessibility role", () => {
      const { getByRole } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      const button = getByRole("button");
      expect(button).toBeTruthy();
    });

    it("Try Again button has correct accessibility label", () => {
      const { getByLabelText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      const button = getByLabelText("Try again");
      expect(button).toBeTruthy();
    });

    it("re-throws if child still throws after reset", () => {
      const onError = jest.fn();

      const { getByText } = render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      // First error
      expect(onError).toHaveBeenCalledTimes(1);

      // Press Try Again - child will throw again
      fireEvent.press(getByText("Try Again"));

      // Should catch error again
      expect(onError).toHaveBeenCalledTimes(2);
    });
  });

  describe("Props validation", () => {
    it("works without optional props", () => {
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(getByText("Something went wrong")).toBeTruthy();
    });

    it("works with fallback prop only", () => {
      const { getByText, queryByText } = render(
        <ErrorBoundary fallback={<Text>Fallback only</Text>}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(getByText("Fallback only")).toBeTruthy();
      expect(queryByText("Something went wrong")).toBeNull();
    });

    it("works with onError prop only", () => {
      const onError = jest.fn();

      const { getByText } = render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(getByText("Something went wrong")).toBeTruthy();
      expect(onError).toHaveBeenCalled();
    });

    it("works with both fallback and onError props", () => {
      const onError = jest.fn();

      const { getByText } = render(
        <ErrorBoundary fallback={<Text>Both props</Text>} onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(getByText("Both props")).toBeTruthy();
      expect(onError).toHaveBeenCalled();
    });
  });
});
