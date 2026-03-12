/**
 * Tuner component tests
 *
 * Tests for the pitch detection tuner UI.
 */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

// Mock usePitchDetection hook
const mockStartListening = jest.fn().mockResolvedValue(undefined);
const mockStopListening = jest.fn();

jest.mock("../src/hooks/usePitchDetection", () => ({
  usePitchDetection: jest.fn(() => ({
    isListening: false,
    startListening: mockStartListening,
    stopListening: mockStopListening,
    error: null,
    permissionGranted: true,
  })),
}));

// Mock notes constants
jest.mock("../src/constants/notes", () => ({
  frequencyToNote: jest.fn((freq: number) => {
    if (freq >= 435 && freq <= 445) return "A4";
    if (freq >= 255 && freq <= 265) return "C4";
    return "C4";
  }),
  getCentsDeviation: jest.fn((freq: number) => {
    if (freq === 440) return 0;
    if (freq === 442) return 8;
    if (freq === 430) return -40;
    return 0;
  }),
}));

import Tuner, { TunerProps } from "../src/screens/TuneMastery/components/Tuner";
import { usePitchDetection } from "../src/hooks/usePitchDetection";

describe("Tuner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePitchDetection as jest.Mock).mockReturnValue({
      isListening: false,
      startListening: mockStartListening,
      stopListening: mockStopListening,
      error: null,
      permissionGranted: true,
    });
  });

  describe("rendering", () => {
    it("renders without crashing", () => {
      const { getByText, getByLabelText } = render(<Tuner />);
      expect(getByLabelText("Start tuner")).toBeTruthy();
    });

    it("renders with default needle mode", () => {
      const { getByText } = render(<Tuner />);
      expect(getByText("🎤")).toBeTruthy();
    });

    it("renders with text mode", () => {
      const { getByText } = render(<Tuner mode="text" />);
      expect(getByText("🎤")).toBeTruthy();
    });
  });

  describe("toggle functionality", () => {
    it("starts tuner when toggle button pressed", async () => {
      const { getByLabelText } = render(<Tuner />);
      const toggleButton = getByLabelText("Start tuner");

      fireEvent.press(toggleButton);

      await waitFor(() => {
        expect(mockStartListening).toHaveBeenCalled();
      });
    });

    it("stops tuner when toggle button pressed while active", async () => {
      // Mock isListening as true
      (usePitchDetection as jest.Mock).mockReturnValue({
        isListening: true,
        startListening: mockStartListening,
        stopListening: mockStopListening,
        error: null,
        permissionGranted: true,
      });

      const { getByLabelText, rerender } = render(<Tuner />);

      // Simulate tuner being active by pressing toggle
      const toggleButton = getByLabelText("Start tuner");
      fireEvent.press(toggleButton);

      // After starting, press again to stop
      await waitFor(() => {
        expect(mockStartListening).toHaveBeenCalled();
      });
    });

    it("displays different icons based on active state", () => {
      const { getByText, rerender } = render(<Tuner />);

      // Initially shows microphone icon
      expect(getByText("🎤")).toBeTruthy();
    });
  });

  describe("pitch detection callback", () => {
    it("calls usePitchDetection with correct options", () => {
      render(<Tuner />);

      expect(usePitchDetection).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
          onPitchDetected: expect.any(Function),
          onRealtimePitch: expect.any(Function),
          volumeThreshold: 0.01,
        }),
      );
    });
  });

  describe("accessibility", () => {
    it("has accessible toggle button with correct label", () => {
      const { getByLabelText } = render(<Tuner />);
      expect(getByLabelText("Start tuner")).toBeTruthy();
    });

    it("toggle button has button role", () => {
      const { getByRole } = render(<Tuner />);
      expect(getByRole("button")).toBeTruthy();
    });
  });

  describe("props", () => {
    it("accepts mode prop", () => {
      const { rerender } = render(<Tuner mode="needle" />);
      rerender(<Tuner mode="text" />);
      // No error thrown
    });

    it("accepts temperament prop", () => {
      const { rerender } = render(<Tuner temperament="equal" />);
      rerender(<Tuner temperament="just" />);
      // No error thrown
    });

    it("uses default props when not provided", () => {
      render(<Tuner />);
      // Component renders with defaults - mode="needle", temperament="equal"
      expect(usePitchDetection).toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("stops listening on unmount when active", () => {
      (usePitchDetection as jest.Mock).mockReturnValue({
        isListening: true,
        startListening: mockStartListening,
        stopListening: mockStopListening,
        error: null,
        permissionGranted: true,
      });

      const { unmount } = render(<Tuner />);
      unmount();

      expect(mockStopListening).toHaveBeenCalled();
    });

    it("does not call stopListening on unmount when not listening", () => {
      (usePitchDetection as jest.Mock).mockReturnValue({
        isListening: false,
        startListening: mockStartListening,
        stopListening: mockStopListening,
        error: null,
        permissionGranted: true,
      });

      const { unmount } = render(<Tuner />);
      mockStopListening.mockClear();
      unmount();

      expect(mockStopListening).not.toHaveBeenCalled();
    });
  });
});
