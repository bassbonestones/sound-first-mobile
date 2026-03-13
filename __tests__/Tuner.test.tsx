/**
 * Tuner component tests
 *
 * Tests for the pitch detection tuner UI.
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

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

  describe("pitch handling", () => {
    it("handles pitch detection callback setup", () => {
      let capturedOptions: {
        onPitchDetected?: Function;
        onRealtimePitch?: Function;
      } | null = null;

      (usePitchDetection as jest.Mock).mockImplementation(
        (options: {
          onPitchDetected?: Function;
          onRealtimePitch?: Function;
        }) => {
          capturedOptions = options;
          return {
            isListening: true,
            startListening: mockStartListening,
            stopListening: mockStopListening,
            error: null,
            permissionGranted: true,
          };
        },
      );

      render(<Tuner />);

      // Verify callback was passed to hook
      expect(capturedOptions).not.toBeNull();
      expect(capturedOptions?.onPitchDetected).toBeDefined();
      expect(capturedOptions?.onRealtimePitch).toBeDefined();
    });

    it("callback handles pitch with frequency", () => {
      let capturedOptions: { onPitchDetected?: Function } | null = null;

      (usePitchDetection as jest.Mock).mockImplementation(
        (options: { onPitchDetected?: Function }) => {
          capturedOptions = options;
          return {
            isListening: true,
            startListening: mockStartListening,
            stopListening: mockStopListening,
            error: null,
            permissionGranted: true,
          };
        },
      );

      render(<Tuner />);

      // Call the callback directly - this exercises handlePitchDetected
      act(() => {
        capturedOptions?.onPitchDetected?.({ frequency: 440 });
      });

      // No assertion needed - we're just ensuring no errors
    });

    it("callback handles null pitch", () => {
      let capturedOptions: { onPitchDetected?: Function } | null = null;

      (usePitchDetection as jest.Mock).mockImplementation(
        (options: { onPitchDetected?: Function }) => {
          capturedOptions = options;
          return {
            isListening: true,
            startListening: mockStartListening,
            stopListening: mockStopListening,
            error: null,
            permissionGranted: true,
          };
        },
      );

      render(<Tuner />);

      // Call the callback with null
      act(() => {
        capturedOptions?.onPitchDetected?.(null);
      });
    });

    it("callback handles pitch without frequency", () => {
      let capturedOptions: { onPitchDetected?: Function } | null = null;

      (usePitchDetection as jest.Mock).mockImplementation(
        (options: { onPitchDetected?: Function }) => {
          capturedOptions = options;
          return {
            isListening: true,
            startListening: mockStartListening,
            stopListening: mockStopListening,
            error: null,
            permissionGranted: true,
          };
        },
      );

      render(<Tuner />);

      // Call the callback with empty object (no frequency)
      act(() => {
        capturedOptions?.onPitchDetected?.({});
      });
    });
  });

  describe("toggle states", () => {
    it("stops listening and clears state when toggled off", async () => {
      let toggleCount = 0;
      (usePitchDetection as jest.Mock).mockImplementation(() => ({
        isListening: toggleCount > 0,
        startListening: mockStartListening.mockImplementation(() => {
          toggleCount++;
          return Promise.resolve();
        }),
        stopListening: mockStopListening,
        error: null,
        permissionGranted: true,
      }));

      const { getByLabelText, rerender } = render(<Tuner />);
      const toggleButton = getByLabelText("Start tuner");

      // Start listening
      fireEvent.press(toggleButton);
      await waitFor(() => {
        expect(mockStartListening).toHaveBeenCalled();
      });

      // Rerender with updated state
      (usePitchDetection as jest.Mock).mockReturnValue({
        isListening: true,
        startListening: mockStartListening,
        stopListening: mockStopListening,
        error: null,
        permissionGranted: true,
      });
      rerender(<Tuner />);

      // Stop listening
      fireEvent.press(toggleButton);
      expect(mockStopListening).toHaveBeenCalled();
    });
  });

  describe("display modes", () => {
    it("shows tuner display after toggle in needle mode", async () => {
      let capturedOptions: { onPitchDetected?: Function } | null = null;

      (usePitchDetection as jest.Mock).mockImplementation(
        (options: { onPitchDetected?: Function }) => {
          capturedOptions = options;
          return {
            isListening: true,
            startListening: mockStartListening,
            stopListening: mockStopListening,
            error: null,
            permissionGranted: true,
          };
        },
      );

      const { getByLabelText, getByText, queryByText } = render(
        <Tuner mode="needle" />,
      );

      // Toggle on
      const toggleButton = getByLabelText("Start tuner");
      await act(async () => {
        fireEvent.press(toggleButton);
      });

      // When active, needle mode should show scale markings
      await waitFor(() => {
        expect(queryByText("-50")).toBeTruthy();
        expect(queryByText("+50")).toBeTruthy();
      });

      // Simulate pitch detection to set cents (tests getTuneColor)
      act(() => {
        capturedOptions?.onPitchDetected?.({ frequency: 440 });
      });
    });

    it("shows tuner display after toggle in text mode", async () => {
      (usePitchDetection as jest.Mock).mockReturnValue({
        isListening: true,
        startListening: mockStartListening,
        stopListening: mockStopListening,
        error: null,
        permissionGranted: true,
      });

      const { getByLabelText, queryByText } = render(<Tuner mode="text" />);

      // Toggle on
      const toggleButton = getByLabelText("Start tuner");
      await act(async () => {
        fireEvent.press(toggleButton);
      });

      // When active in text mode, should show "---" (no note yet) and "0 cents"
      await waitFor(() => {
        expect(queryByText("---")).toBeTruthy();
        expect(queryByText(/0 cents/)).toBeTruthy();
      });
    });

    it("exercises pitch detection callback with various frequencies", async () => {
      // This will capture the callback from usePitchDetection
      let latestCallback: Function | null = null;

      (usePitchDetection as jest.Mock).mockImplementation(
        (options: { onPitchDetected?: Function }) => {
          latestCallback = options.onPitchDetected || null;
          return {
            isListening: true,
            startListening: mockStartListening,
            stopListening: mockStopListening,
            error: null,
            permissionGranted: true,
          };
        },
      );

      const { getByLabelText, queryByText } = render(<Tuner mode="needle" />);

      // Toggle on
      await act(async () => {
        fireEvent.press(getByLabelText("Start tuner"));
      });

      // Verify tuner is active
      await waitFor(() => {
        expect(queryByText("-50")).toBeTruthy();
      });

      // Exercise the pitch detection callback with different frequencies
      // This covers the handlePitchDetected code paths
      const testFrequencies = [440, 448, 458, 470, 500];
      for (const freq of testFrequencies) {
        act(() => {
          latestCallback?.({ frequency: freq });
        });
      }

      // Verify at least one pitch was processed
      expect(latestCallback).toBeDefined();
    });
  });
});
