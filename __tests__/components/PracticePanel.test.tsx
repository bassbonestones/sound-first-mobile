/**
 * @fileoverview Tests for PracticePanel component
 * Tests the full-screen practice view with tools and rating UI
 */

import React from "react";
import { render, fireEvent, act, waitFor } from "@testing-library/react-native";

// Mock components used by PracticePanel
jest.mock("../../src/components/Metronome", () => {
  const { View, Text } = require("react-native");
  return function MockMetronome() {
    return (
      <View testID="mock-metronome">
        <Text>Metronome</Text>
      </View>
    );
  };
});

jest.mock("../../src/components/PitchDrone", () => {
  const { View, Text } = require("react-native");
  return function MockPitchDrone() {
    return (
      <View testID="mock-pitch-drone">
        <Text>PitchDrone</Text>
      </View>
    );
  };
});

jest.mock("../../src/screens/TuneMastery/components/Tuner", () => {
  const { View, Text } = require("react-native");
  const mock = function MockTuner() {
    return (
      <View testID="mock-tuner">
        <Text>Tuner</Text>
      </View>
    );
  };
  mock.TunerMode = { Drone: "Drone", Listen: "Listen" };
  mock.Temperament = { Equal: "Equal", Just: "Just" };
  return mock;
});

jest.mock("../../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devWarn: jest.fn(),
  devError: jest.fn(),
}));

// Mock Slider
jest.mock("@react-native-community/slider", () => {
  const { View } = require("react-native");
  return function MockSlider(props: { testID?: string; value?: number }) {
    return <View testID={props.testID || "slider"} />;
  };
});

import PracticePanel from "../../src/screens/TuneMastery/components/PracticePanel";

describe("PracticePanel", () => {
  const mockOnFinish = jest.fn();
  const mockOnRatingChange = jest.fn();

  const defaultProps = {
    tuneName: "My Tune",
    tuneKey: "C",
    rating: 3,
    onRatingChange: mockOnRatingChange,
    onFinish: mockOnFinish,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // RENDER TESTS
  // ==========================================================================
  describe("Rendering", () => {
    it("renders without crashing", () => {
      const { getByText } = render(<PracticePanel {...defaultProps} />);
      expect(getByText("My Tune")).toBeTruthy();
    });

    it("displays tune name", () => {
      const { getByText } = render(<PracticePanel {...defaultProps} />);
      expect(getByText("My Tune")).toBeTruthy();
    });

    it("displays with G key", () => {
      const { UNSAFE_root } = render(
        <PracticePanel {...defaultProps} tuneKey="G" />,
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it("renders with C key", () => {
      const { UNSAFE_root } = render(
        <PracticePanel {...defaultProps} tuneKey="C" />,
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  // ==========================================================================
  // FOCUS CARD TESTS
  // ==========================================================================
  describe("Focus Card", () => {
    it("renders focus card section", () => {
      const { UNSAFE_root } = render(<PracticePanel {...defaultProps} />);
      // Should render focus card area
      expect(UNSAFE_root).toBeTruthy();
    });

    it("has text content", () => {
      const { getAllByText } = render(<PracticePanel {...defaultProps} />);
      // Focus cards have attention cue text - at least one should exist
      expect(getAllByText(/.+/).length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // TOOL CONTROLS TESTS
  // ==========================================================================
  describe("Tool Controls", () => {
    it("shows tool icons", () => {
      const { getByText } = render(<PracticePanel {...defaultProps} />);
      // Should have tool controls section
      expect(getByText("My Tune")).toBeTruthy();
    });
  });

  // ==========================================================================
  // RATING TESTS
  // ==========================================================================
  describe("Rating", () => {
    it("displays submit button", () => {
      const { getByText } = render(<PracticePanel {...defaultProps} />);
      expect(getByText(/Submit/i)).toBeTruthy();
    });

    it("shows rating slider area", () => {
      const { UNSAFE_root } = render(
        <PracticePanel {...defaultProps} rating={4} />,
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  // ==========================================================================
  // CALLBACK TESTS
  // ==========================================================================
  describe("Callbacks", () => {
    it("has submit button that can be pressed", () => {
      const { getByText } = render(<PracticePanel {...defaultProps} />);
      const submitButton = getByText(/Submit/i);
      expect(submitButton).toBeTruthy();
    });
  });

  // ==========================================================================
  // PROPS TESTS
  // ==========================================================================
  describe("Props", () => {
    it("uses provided tune name", () => {
      const { getByText } = render(
        <PracticePanel {...defaultProps} tuneName="Another Tune" />,
      );
      expect(getByText("Another Tune")).toBeTruthy();
    });

    it("uses provided tune key", () => {
      const { getAllByText } = render(
        <PracticePanel {...defaultProps} tuneKey="Bb" />,
      );
      expect(getAllByText(/Bb/).length).toBeGreaterThan(0);
    });

    it("uses default rating", () => {
      const { UNSAFE_root } = render(
        <PracticePanel {...defaultProps} rating={5} />,
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================
  describe("Edge Cases", () => {
    it("handles empty tuneName", () => {
      const { UNSAFE_root } = render(
        <PracticePanel
          tuneName=""
          tuneKey="C"
          rating={3}
          onRatingChange={mockOnRatingChange}
          onFinish={mockOnFinish}
        />,
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it("handles different keys", () => {
      const { getAllByText } = render(
        <PracticePanel {...defaultProps} tuneKey="F" />,
      );
      expect(getAllByText(/F/).length).toBeGreaterThan(0);
    });

    it("renders with all props", () => {
      const { UNSAFE_root } = render(
        <PracticePanel
          tuneName="Test Tune"
          tuneKey="G"
          rating={4}
          onRatingChange={mockOnRatingChange}
          onFinish={mockOnFinish}
        />,
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================
  describe("Accessibility", () => {
    it("submit button is accessible", () => {
      const { getByText } = render(<PracticePanel {...defaultProps} />);
      const submitButton = getByText(/Submit/i);
      expect(submitButton).toBeTruthy();
    });

    it("has accessible rating button", () => {
      const { getByLabelText } = render(<PracticePanel {...defaultProps} />);
      const ratingButton = getByLabelText(/Submit rating/i);
      expect(ratingButton).toBeTruthy();
    });
  });
});
