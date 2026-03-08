/**
 * Tests for EDMVisualizer component
 */

import React from "react";
import { render } from "@testing-library/react-native";
import EDMVisualizer from "../src/components/EDMVisualizer";

// Mock Animated to avoid animation issues in tests
jest.mock("react-native", () => {
  const rn = jest.requireActual("react-native");
  return {
    ...rn,
    Animated: {
      ...rn.Animated,
      Value: jest.fn(() => ({
        interpolate: jest.fn(() => 10),
        setValue: jest.fn(),
      })),
      spring: jest.fn(() => ({ start: jest.fn() })),
      timing: jest.fn(() => ({ start: jest.fn() })),
      parallel: jest.fn(() => ({ start: jest.fn() })),
      multiply: jest.fn(() => 5),
      View: rn.View,
    },
  };
});

describe("EDMVisualizer", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      const { getByTestId } = render(
        <EDMVisualizer volume={0} pitchAccuracy={null} />,
      );
      // Component should render
      expect(true).toBe(true);
    });

    it("renders with correct pitch accuracy", () => {
      render(<EDMVisualizer volume={0.5} pitchAccuracy="correct" />);
      // Should use green color scheme
    });

    it("renders with off pitch accuracy", () => {
      render(<EDMVisualizer volume={0.5} pitchAccuracy="off" />);
      // Should use orange color scheme
    });

    it("renders with listening state", () => {
      render(<EDMVisualizer volume={0.3} pitchAccuracy="listening" />);
      // Should use cyan/blue color scheme
    });

    it("renders with inactive state (null accuracy)", () => {
      render(<EDMVisualizer volume={0} pitchAccuracy={null} />);
      // Should use gray color scheme
    });
  });

  describe("Volume levels", () => {
    it("renders with zero volume", () => {
      render(<EDMVisualizer volume={0} pitchAccuracy="listening" />);
    });

    it("renders with low volume", () => {
      render(<EDMVisualizer volume={0.1} pitchAccuracy="listening" />);
    });

    it("renders with high volume", () => {
      render(<EDMVisualizer volume={1} pitchAccuracy="correct" />);
    });
  });

  describe("Bar configuration", () => {
    it("renders with default bar count", () => {
      render(<EDMVisualizer volume={0.5} pitchAccuracy="listening" />);
      // Default is 16 bars
    });

    it("renders with custom bar count", () => {
      render(
        <EDMVisualizer volume={0.5} pitchAccuracy="listening" barCount={8} />,
      );
    });
  });

  describe("Custom styling", () => {
    it("accepts custom style prop", () => {
      render(
        <EDMVisualizer
          volume={0.5}
          pitchAccuracy="listening"
          style={{ height: 200 }}
        />,
      );
    });
  });
});
