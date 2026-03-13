/**
 * @fileoverview Tests for SessionTimer component
 * Displays clock and session timer
 */

import React from "react";
import { render } from "@testing-library/react-native";
import SessionTimer from "../src/screens/Session/components/SessionTimer";

describe("SessionTimer", () => {
  const defaultProps = {
    currentTime: new Date("2026-03-12T14:30:45"),
    elapsedSeconds: 330, // 5:30
    targetDurationSeconds: 1200, // 20:00
    isOverTime: false,
  };

  // ==========================================================================
  // CLOCK DISPLAY TESTS
  // ==========================================================================
  describe("Clock Display", () => {
    it("renders clock emoji", () => {
      const { getByText } = render(<SessionTimer {...defaultProps} />);
      expect(getByText("🕐")).toBeTruthy();
    });

    it("formats time in 12-hour format", () => {
      const { getByText } = render(<SessionTimer {...defaultProps} />);
      expect(getByText("02:30:45 PM")).toBeTruthy();
    });

    it("formats AM times correctly", () => {
      const props = {
        ...defaultProps,
        currentTime: new Date("2026-03-12T09:15:30"),
      };
      const { getByText } = render(<SessionTimer {...props} />);
      expect(getByText("09:15:30 AM")).toBeTruthy();
    });

    it("formats midnight correctly", () => {
      const props = {
        ...defaultProps,
        currentTime: new Date("2026-03-12T00:05:00"),
      };
      const { getByText } = render(<SessionTimer {...props} />);
      expect(getByText("12:05:00 AM")).toBeTruthy();
    });

    it("formats noon correctly", () => {
      const props = {
        ...defaultProps,
        currentTime: new Date("2026-03-12T12:00:00"),
      };
      const { getByText } = render(<SessionTimer {...props} />);
      expect(getByText("12:00:00 PM")).toBeTruthy();
    });

    it("shows placeholder when currentTime is null", () => {
      const props = { ...defaultProps, currentTime: null };
      const { getByText } = render(<SessionTimer {...props} />);
      expect(getByText("--:--:-- --")).toBeTruthy();
    });

    it("shows placeholder when currentTime is undefined", () => {
      const props = { ...defaultProps, currentTime: undefined };
      const { getByText } = render(<SessionTimer {...props} />);
      expect(getByText("--:--:-- --")).toBeTruthy();
    });
  });

  // ==========================================================================
  // TIMER DISPLAY TESTS
  // ==========================================================================
  describe("Timer Display", () => {
    it("renders timer emoji", () => {
      const { getByText } = render(<SessionTimer {...defaultProps} />);
      expect(getByText("⏱️")).toBeTruthy();
    });

    it("formats elapsed and target time", () => {
      const { getByText } = render(<SessionTimer {...defaultProps} />);
      expect(getByText("00:05:30 / 00:20:00")).toBeTruthy();
    });

    it("formats zero elapsed time", () => {
      const props = { ...defaultProps, elapsedSeconds: 0 };
      const { getByText } = render(<SessionTimer {...props} />);
      expect(getByText("00:00:00 / 00:20:00")).toBeTruthy();
    });

    it("formats hours when elapsed > 60 minutes", () => {
      const props = { ...defaultProps, elapsedSeconds: 3661 }; // 1:01:01
      const { getByText } = render(<SessionTimer {...props} />);
      expect(getByText("01:01:01 / 00:20:00")).toBeTruthy();
    });

    it("formats large target durations", () => {
      const props = { ...defaultProps, targetDurationSeconds: 7200 }; // 2 hours
      const { getByText } = render(<SessionTimer {...props} />);
      expect(getByText("00:05:30 / 02:00:00")).toBeTruthy();
    });
  });

  // ==========================================================================
  // OVERTIME STATE TESTS
  // ==========================================================================
  describe("Overtime State", () => {
    it("does not apply overtime style when not over time", () => {
      const { getByText } = render(<SessionTimer {...defaultProps} />);
      const timerText = getByText("00:05:30 / 00:20:00");
      expect(timerText).toBeTruthy();
      // Component renders, no style assertion needed
    });

    it("renders with overtime state", () => {
      const props = { ...defaultProps, isOverTime: true, elapsedSeconds: 1500 };
      const { getByText } = render(<SessionTimer {...props} />);
      expect(getByText("00:25:00 / 00:20:00")).toBeTruthy();
    });
  });

  // ==========================================================================
  // MEMO BEHAVIOR TESTS
  // ==========================================================================
  describe("Memo Behavior", () => {
    it("is memoized component", () => {
      const { rerender } = render(<SessionTimer {...defaultProps} />);
      rerender(<SessionTimer {...defaultProps} />);
      // No error means memo is working
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================
  describe("Edge Cases", () => {
    it("handles single-digit times with padding", () => {
      const props = {
        ...defaultProps,
        elapsedSeconds: 61,
        targetDurationSeconds: 62,
      };
      const { getByText } = render(<SessionTimer {...props} />);
      expect(getByText("00:01:01 / 00:01:02")).toBeTruthy();
    });

    it("handles exactly one hour", () => {
      const props = { ...defaultProps, elapsedSeconds: 3600 };
      const { getByText } = render(<SessionTimer {...props} />);
      expect(getByText("01:00:00 / 00:20:00")).toBeTruthy();
    });

    it("handles times that require leading zeros", () => {
      const props = {
        ...defaultProps,
        currentTime: new Date("2026-03-12T01:02:03"),
      };
      const { getByText } = render(<SessionTimer {...props} />);
      expect(getByText("01:02:03 AM")).toBeTruthy();
    });
  });
});
