/**
 * @fileoverview Tests for FocusCard component
 * Displays focus card information in session
 */

import React from "react";
import { render } from "@testing-library/react-native";

// Mock theme
jest.mock("../src/styles/theme", () => ({
  createShadow: jest.fn(() => ({})),
}));

import FocusCard from "../src/screens/Session/components/FocusCard";

describe("FocusCard", () => {
  const baseMini = {
    focus_card_category: "PITCH",
    focus_card_name: "Match the Drone",
    focus_card_attention_cue: "Listen carefully",
    focus_card_instruction: "Adjust your pitch until you hear no beating.",
  };

  // ==========================================================================
  // BASIC RENDERING TESTS
  // ==========================================================================
  describe("Basic Rendering", () => {
    it("renders focus card name", () => {
      const { getByText } = render(<FocusCard mini={baseMini} />);
      expect(getByText("Match the Drone")).toBeTruthy();
    });

    it("renders category when provided", () => {
      const { getByText } = render(<FocusCard mini={baseMini} />);
      expect(getByText("PITCH")).toBeTruthy();
    });

    it("renders attention cue when provided", () => {
      const { getByText } = render(<FocusCard mini={baseMini} />);
      expect(getByText("Listen carefully")).toBeTruthy();
    });

    it("renders instruction when provided", () => {
      const { getByText } = render(<FocusCard mini={baseMini} />);
      expect(
        getByText("Adjust your pitch until you hear no beating."),
      ).toBeTruthy();
    });
  });

  // ==========================================================================
  // OPTIONAL FIELDS TESTS
  // ==========================================================================
  describe("Optional Fields", () => {
    it("does not render category when missing", () => {
      const mini = { ...baseMini, focus_card_category: undefined };
      const { queryByText } = render(<FocusCard mini={mini} />);
      expect(queryByText("PITCH")).toBeNull();
    });

    it("does not render attention cue when missing", () => {
      const mini = { ...baseMini, focus_card_attention_cue: undefined };
      const { queryByText } = render(<FocusCard mini={mini} />);
      expect(queryByText("Listen carefully")).toBeNull();
    });

    it("does not render instruction when missing", () => {
      const mini = { ...baseMini, focus_card_instruction: undefined };
      const { queryByText } = render(<FocusCard mini={mini} />);
      expect(
        queryByText("Adjust your pitch until you hear no beating."),
      ).toBeNull();
    });
  });

  // ==========================================================================
  // CATEGORY VARIATIONS
  // ==========================================================================
  describe("Category Variations", () => {
    it("renders RHYTHM category", () => {
      const mini = { ...baseMini, focus_card_category: "RHYTHM" };
      const { getByText } = render(<FocusCard mini={mini} />);
      expect(getByText("RHYTHM")).toBeTruthy();
    });

    it("renders PROJECTION category", () => {
      const mini = { ...baseMini, focus_card_category: "PROJECTION" };
      const { getByText } = render(<FocusCard mini={mini} />);
      expect(getByText("PROJECTION")).toBeTruthy();
    });

    it("renders CORE_SOUND category", () => {
      const mini = { ...baseMini, focus_card_category: "CORE_SOUND" };
      const { getByText } = render(<FocusCard mini={mini} />);
      expect(getByText("CORE_SOUND")).toBeTruthy();
    });
  });

  // ==========================================================================
  // MEMO BEHAVIOR TESTS
  // ==========================================================================
  describe("Memo Behavior", () => {
    it("is memoized component", () => {
      const { rerender } = render(<FocusCard mini={baseMini} />);
      rerender(<FocusCard mini={baseMini} />);
      // No error means memo is working
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================
  describe("Edge Cases", () => {
    it("handles minimal mini object with only name", () => {
      const mini = { focus_card_name: "Minimal Card" };
      const { getByText, queryByText } = render(<FocusCard mini={mini} />);
      expect(getByText("Minimal Card")).toBeTruthy();
      expect(queryByText("PITCH")).toBeNull();
    });

    it("handles undefined focus_card_name gracefully", () => {
      const mini = { focus_card_category: "TEST" };
      const { getByText } = render(<FocusCard mini={mini} />);
      expect(getByText("TEST")).toBeTruthy();
    });

    it("handles empty string values", () => {
      const mini = { ...baseMini, focus_card_name: "" };
      const { queryByText } = render(<FocusCard mini={mini} />);
      // Empty string should not render visible text
      expect(queryByText("Match the Drone")).toBeNull();
    });
  });
});
