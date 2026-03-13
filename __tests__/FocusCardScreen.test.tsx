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

  describe("Rendering", () => {
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

  describe("Content variations", () => {
    it("renders short focus card text", () => {
      const shortRoute: MockRoute = {
        params: {
          focusCard: "Relax",
        },
      };
      const { getByText } = render(<FocusCardScreen route={shortRoute} />);
      expect(getByText("Relax")).toBeTruthy();
    });

    it("renders long focus card text", () => {
      const longRoute: MockRoute = {
        params: {
          focusCard:
            "Remember to focus on proper breathing technique while maintaining good posture and keeping your embouchure relaxed throughout the entire exercise session",
        },
      };
      const { getByText } = render(<FocusCardScreen route={longRoute} />);
      expect(
        getByText(
          "Remember to focus on proper breathing technique while maintaining good posture and keeping your embouchure relaxed throughout the entire exercise session",
        ),
      ).toBeTruthy();
    });

    it("renders text with special characters", () => {
      const specialRoute: MockRoute = {
        params: {
          focusCard: "Practice scales: C, G, D, A & E major!",
        },
      };
      const { getByText } = render(<FocusCardScreen route={specialRoute} />);
      expect(getByText("Practice scales: C, G, D, A & E major!")).toBeTruthy();
    });

    it("renders text with numbers", () => {
      const numberRoute: MockRoute = {
        params: {
          focusCard: "Practice 8 bars at 120 BPM",
        },
      };
      const { getByText } = render(<FocusCardScreen route={numberRoute} />);
      expect(getByText("Practice 8 bars at 120 BPM")).toBeTruthy();
    });

    it("renders empty string focus card", () => {
      const emptyRoute: MockRoute = {
        params: {
          focusCard: "",
        },
      };
      const { getByText } = render(<FocusCardScreen route={emptyRoute} />);
      expect(getByText("Focus Card")).toBeTruthy();
    });

    it("renders multi-line focus card text", () => {
      const multiLineRoute: MockRoute = {
        params: {
          focusCard: "Line one\nLine two\nLine three",
        },
      };
      const { getByText } = render(<FocusCardScreen route={multiLineRoute} />);
      expect(getByText("Line one\nLine two\nLine three")).toBeTruthy();
    });
  });

  describe("Screen structure", () => {
    it("renders Focus Card title", () => {
      const { getByText } = render(<FocusCardScreen route={mockRoute} />);
      expect(getByText("Focus Card")).toBeTruthy();
    });

    it("renders both title and content", () => {
      const { getByText } = render(<FocusCardScreen route={mockRoute} />);
      expect(getByText("Focus Card")).toBeTruthy();
      expect(
        getByText("Practice long tones with proper breath support"),
      ).toBeTruthy();
    });

    it("renders title and content with proper hierarchy", () => {
      const { getAllByText, getByText } = render(
        <FocusCardScreen route={mockRoute} />,
      );

      // Title should exist
      const title = getByText("Focus Card");
      expect(title).toBeTruthy();

      // Content should exist
      const content = getByText(
        "Practice long tones with proper breath support",
      );
      expect(content).toBeTruthy();

      // Reset button should exist
      const reset = getByText("Reset");
      expect(reset).toBeTruthy();
    });
  });

  describe("Different focus card types", () => {
    it("renders technique-focused card", () => {
      const techniqueRoute: MockRoute = {
        params: {
          focusCard: "Focus on tongue placement for clean articulation",
        },
      };
      const { getByText } = render(<FocusCardScreen route={techniqueRoute} />);
      expect(
        getByText("Focus on tongue placement for clean articulation"),
      ).toBeTruthy();
    });

    it("renders rhythm-focused card", () => {
      const rhythmRoute: MockRoute = {
        params: {
          focusCard: "Keep the pulse steady throughout the phrase",
        },
      };
      const { getByText } = render(<FocusCardScreen route={rhythmRoute} />);
      expect(
        getByText("Keep the pulse steady throughout the phrase"),
      ).toBeTruthy();
    });

    it("renders ear training card", () => {
      const earRoute: MockRoute = {
        params: {
          focusCard: "Listen for the interval quality before responding",
        },
      };
      const { getByText } = render(<FocusCardScreen route={earRoute} />);
      expect(
        getByText("Listen for the interval quality before responding"),
      ).toBeTruthy();
    });

    it("renders mindset-focused card", () => {
      const mindsetRoute: MockRoute = {
        params: {
          focusCard: "Stay calm and breathe deeply between exercises",
        },
      };
      const { getByText } = render(<FocusCardScreen route={mindsetRoute} />);
      expect(
        getByText("Stay calm and breathe deeply between exercises"),
      ).toBeTruthy();
    });
  });
});
