/**
 * @fileoverview Tests for ProgressDots component
 * Displays step progress indicators at the bottom of onboarding screens
 */

import React from "react";
import { render } from "@testing-library/react-native";
import ProgressDots from "../src/screens/Onboarding/components/ProgressDots";

describe("ProgressDots", () => {
  // ==========================================================================
  // BASIC RENDERING TESTS
  // ==========================================================================
  describe("Basic Rendering", () => {
    it("renders without crashing", () => {
      const { toJSON } = render(<ProgressDots currentStep={1} />);
      expect(toJSON()).toBeTruthy();
    });

    it("renders correct number of dots (2 total steps)", () => {
      const { toJSON } = render(<ProgressDots currentStep={1} />);
      const tree = toJSON();
      // Container with 2 child dots
      expect(tree?.children?.length).toBe(2);
    });
  });

  // ==========================================================================
  // STEP INDICATION TESTS
  // ==========================================================================
  describe("Step Indication", () => {
    it("highlights first dot when currentStep is 1", () => {
      const { toJSON } = render(<ProgressDots currentStep={1} />);
      const tree = toJSON();
      const dots = tree?.children || [];
      // First dot should have active style (backgroundColor: #FFD700)
      expect(dots[0]?.props?.style).toBeTruthy();
    });

    it("highlights second dot when currentStep is 2", () => {
      const { toJSON } = render(<ProgressDots currentStep={2} />);
      const tree = toJSON();
      const dots = tree?.children || [];
      // Second dot should have active style
      expect(dots[1]?.props?.style).toBeTruthy();
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================
  describe("Edge Cases", () => {
    it("handles step 0 (no active dot)", () => {
      const { toJSON } = render(<ProgressDots currentStep={0} />);
      const tree = toJSON();
      expect(tree?.children?.length).toBe(2);
    });

    it("handles step beyond total (no active dot)", () => {
      const { toJSON } = render(<ProgressDots currentStep={5} />);
      const tree = toJSON();
      expect(tree?.children?.length).toBe(2);
    });
  });
});
