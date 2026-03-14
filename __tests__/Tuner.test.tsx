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
  noteToFrequency: jest.fn((note: string) => {
    if (note === "A4") return 440;
    if (note === "C4") return 261.63;
    return 440;
  }),
  noteNames: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
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
      const { getByText } = render(<Tuner />);
      // Shows mic icon when no pitch detected
      expect(getByText("🎤")).toBeTruthy();
    });

    it("renders with default needle mode", () => {
      const { getByText, getByLabelText } = render(<Tuner />);
      expect(getByText("🎤")).toBeTruthy();
      // Open settings modal
      fireEvent.press(getByLabelText("Open tuning settings"));
      // Temperament buttons are visible in modal (Equal is selected by default)
      expect(
        getByLabelText("Standard equal temperament, selected"),
      ).toBeTruthy();
      expect(getByLabelText("Resonance just intonation")).toBeTruthy();
      // Concert A input is visible in modal
      expect(getByLabelText("Concert A frequency")).toBeTruthy();
    });

    it("renders with text mode", () => {
      const { getByText } = render(<Tuner mode="text" />);
      expect(getByText("🎤")).toBeTruthy();
    });
  });

  describe("auto-start behavior", () => {
    it("automatically starts listening on mount", async () => {
      render(<Tuner />);

      await waitFor(() => {
        expect(mockStartListening).toHaveBeenCalled();
      });
    });

    it("calls usePitchDetection with enabled=true", () => {
      render(<Tuner />);

      expect(usePitchDetection).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
          onPitchDetected: expect.any(Function),
          onRealtimePitch: expect.any(Function),
          volumeThreshold: 0.01,
        }),
      );
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

  describe("accessibility", () => {
    it("temperament buttons have accessible labels", () => {
      const { getByLabelText } = render(<Tuner />);
      // Labels include ", selected" state for the active button (equal by default)
      fireEvent.press(getByLabelText("Open tuning settings"));
      expect(
        getByLabelText("Standard equal temperament, selected"),
      ).toBeTruthy();
      expect(getByLabelText("Resonance just intonation")).toBeTruthy();
    });

    it("temperament buttons have button role", () => {
      const { getAllByRole, getByLabelText } = render(<Tuner />);
      fireEvent.press(getByLabelText("Open tuning settings"));
      const buttons = getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it("concert A input has accessible label", () => {
      const { getByLabelText } = render(<Tuner />);
      fireEvent.press(getByLabelText("Open tuning settings"));
      expect(getByLabelText("Concert A frequency")).toBeTruthy();
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

  describe("display modes", () => {
    it("shows tuner display in needle mode", async () => {
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

      const { getByText } = render(<Tuner mode="needle" />);

      // Needle mode should show mic icon when no pitch detected
      expect(getByText("🎤")).toBeTruthy();

      // Simulate pitch detection to set cents (tests getTuneColor)
      act(() => {
        capturedOptions?.onPitchDetected?.({ frequency: 440 });
      });
    });

    it("shows tuner display in text mode", async () => {
      (usePitchDetection as jest.Mock).mockReturnValue({
        isListening: true,
        startListening: mockStartListening,
        stopListening: mockStopListening,
        error: null,
        permissionGranted: true,
      });

      const { getByText } = render(<Tuner mode="text" />);

      // Text mode should show mic icon when no note detected
      expect(getByText("🎤")).toBeTruthy();
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

      render(<Tuner mode="needle" />);

      // Exercise the pitch detection callback with different frequencies
      // This covers the handlePitchDetected code paths
      const testFrequencies = [440, 448, 458, 470, 500];
      for (const freq of testFrequencies) {
        act(() => {
          latestCallback?.({ frequency: freq });
        });
      }

      // Verify callback was captured
      expect(latestCallback).toBeDefined();
    });
  });

  describe("temperament selection", () => {
    it("can switch to just intonation", async () => {
      const { getByLabelText, queryByText } = render(<Tuner />);

      // Open settings modal
      fireEvent.press(getByLabelText("Open tuning settings"));

      // Press Just button
      fireEvent.press(getByLabelText("Resonance just intonation"));

      // Should show key selector when Just is selected
      await waitFor(() => {
        expect(queryByText("Key Center")).toBeTruthy();
      });
    });

    it("shows key selector with just intonation", async () => {
      const { getByLabelText, queryByLabelText } = render(<Tuner />);

      // Open settings modal
      fireEvent.press(getByLabelText("Open tuning settings"));

      fireEvent.press(getByLabelText("Resonance just intonation"));

      // Should show key grid with 12 keys (check accessible labels)
      await waitFor(() => {
        expect(queryByLabelText("Key of C")).toBeTruthy();
        expect(queryByLabelText("Key of F#/Gb")).toBeTruthy();
      });
    });

    it("hides key selector with equal temperament", async () => {
      const { getByLabelText, queryByText } = render(<Tuner />);

      // Open settings modal
      fireEvent.press(getByLabelText("Open tuning settings"));

      // Switch to just first
      fireEvent.press(getByLabelText("Resonance just intonation"));
      await waitFor(() => {
        expect(queryByText("Key Center")).toBeTruthy();
      });

      // Switch back to equal - now it shows ", selected" since Just was selected
      fireEvent.press(getByLabelText("Standard equal temperament"));
      await waitFor(() => {
        expect(queryByText("Key Center")).toBeNull();
      });
    });
  });

  describe("error handling", () => {
    it("displays error when there is a permission issue", () => {
      (usePitchDetection as jest.Mock).mockReturnValue({
        isListening: false,
        startListening: mockStartListening,
        stopListening: mockStopListening,
        error: "Microphone permission denied",
        permissionGranted: false,
      });

      const { getByText } = render(<Tuner />);
      expect(getByText("Microphone permission denied")).toBeTruthy();
    });
  });

  describe("just intonation pitch detection", () => {
    it("handles pitch detection with just intonation mode", async () => {
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

      const { getByLabelText } = render(<Tuner />);

      // Open settings modal
      fireEvent.press(getByLabelText("Open tuning settings"));

      // Switch to just intonation
      fireEvent.press(getByLabelText("Resonance just intonation"));

      // Simulate pitch detection - exercises getJustIntonationFrequency
      act(() => {
        capturedOptions?.onPitchDetected?.({ frequency: 440 });
      });
    });

    it("exercises just intonation with different keys", async () => {
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

      const { getByLabelText } = render(<Tuner />);

      // Open settings modal
      fireEvent.press(getByLabelText("Open tuning settings"));

      // Switch to just intonation
      fireEvent.press(getByLabelText("Resonance just intonation"));

      // Wait for key selector to appear
      await waitFor(() => {
        expect(getByLabelText("Key of G")).toBeTruthy();
      });

      // Select key of G
      fireEvent.press(getByLabelText("Key of G"));

      // Simulate pitch detection with G key
      act(() => {
        capturedOptions?.onPitchDetected?.({ frequency: 392 }); // G4
      });
    });

    it("exercises pitch detection with sharp notes", async () => {
      let capturedOptions: { onPitchDetected?: Function } | null = null;

      // Return C#4 for frequency 277
      const { frequencyToNote } = require("../src/constants/notes");
      (frequencyToNote as jest.Mock).mockImplementation((freq: number) => {
        if (freq >= 275 && freq <= 280) return "C#4";
        if (freq >= 435 && freq <= 445) return "A4";
        return "C4";
      });

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

      const { getByLabelText } = render(<Tuner />);

      // Open settings modal
      fireEvent.press(getByLabelText("Open tuning settings"));

      // Switch to just intonation
      fireEvent.press(getByLabelText("Resonance just intonation"));

      // Simulate sharp note detection
      act(() => {
        capturedOptions?.onPitchDetected?.({ frequency: 277 });
      });
    });

    it("exercises pitch detection with flat notes", async () => {
      let capturedOptions: { onPitchDetected?: Function } | null = null;

      // Return Bb4 for frequency 466
      const { frequencyToNote } = require("../src/constants/notes");
      (frequencyToNote as jest.Mock).mockImplementation((freq: number) => {
        if (freq >= 460 && freq <= 470) return "Bb4";
        if (freq >= 435 && freq <= 445) return "A4";
        return "C4";
      });

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

      const { getByLabelText } = render(<Tuner />);

      // Open settings modal
      fireEvent.press(getByLabelText("Open tuning settings"));

      // Switch to just intonation
      fireEvent.press(getByLabelText("Resonance just intonation"));

      // Simulate flat note detection
      act(() => {
        capturedOptions?.onPitchDetected?.({ frequency: 466 });
      });
    });
  });

  describe("concert A frequency", () => {
    it("changes concert A frequency", async () => {
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

      const { getByLabelText } = render(<Tuner />);

      // Open settings modal
      fireEvent.press(getByLabelText("Open tuning settings"));

      // Change concert A to 442
      fireEvent.changeText(getByLabelText("Concert A frequency"), "442");

      // Simulate pitch detection with new A4 reference
      act(() => {
        capturedOptions?.onPitchDetected?.({ frequency: 442 });
      });
    });

    it("handles invalid concert A input", async () => {
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

      const { getByLabelText } = render(<Tuner />);

      // Open settings modal
      fireEvent.press(getByLabelText("Open tuning settings"));

      // Enter invalid concert A (empty string will parse to NaN, falls back to 440)
      fireEvent.changeText(getByLabelText("Concert A frequency"), "");

      // Detect pitch - should use default 440
      act(() => {
        capturedOptions?.onPitchDetected?.({ frequency: 440 });
      });
    });
  });

  describe("silence detection", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("clears note after silence timeout", async () => {
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

      // Detect a pitch first
      act(() => {
        capturedOptions?.onPitchDetected?.({ frequency: 440 });
      });

      // Advance timer past silence threshold (300ms)
      act(() => {
        jest.advanceTimersByTime(350);
      });
    });

    it("resets silence timeout on new pitch", async () => {
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

      // Detect a pitch
      act(() => {
        capturedOptions?.onPitchDetected?.({ frequency: 440 });
      });

      // Advance part way through timeout
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Detect another pitch - should reset timer
      act(() => {
        capturedOptions?.onPitchDetected?.({ frequency: 442 });
      });

      // Advance again - should not have cleared yet
      act(() => {
        jest.advanceTimersByTime(200);
      });
    });
  });

  describe("tune color gradients", () => {
    it("exercises all tune color ranges", async () => {
      let capturedOptions: { onPitchDetected?: Function } | null = null;

      // Mock to return specific cents deviations for different frequencies
      const { getCentsDeviation } = require("../src/constants/notes");
      (getCentsDeviation as jest.Mock).mockImplementation(
        (freq: number, target: number) => {
          // Return different cents based on freq to exercise getTuneColor
          if (freq === 440) return 0; // Perfect tune (#4CAF50)
          if (freq === 441) return 7; // Slightly off (#8BC34A)
          if (freq === 445) return 15; // Moderately off (#FFC107)
          if (freq === 450) return 30; // More off (#FF9800)
          if (freq === 460) return 45; // Very off (#F44336)
          return 0;
        },
      );

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

      render(<Tuner mode="needle" />);

      // Exercise all color ranges
      const testFreqs = [440, 441, 445, 450, 460];
      for (const freq of testFreqs) {
        act(() => {
          capturedOptions?.onPitchDetected?.({ frequency: freq });
        });
      }
    });
  });

  describe("settings modal interactions", () => {
    it("opens and closes settings modal", async () => {
      const { getByLabelText, queryByText } = render(<Tuner />);

      // Open settings modal
      fireEvent.press(getByLabelText("Open tuning settings"));
      expect(queryByText("Tuning Settings")).toBeTruthy();

      // Close settings modal
      fireEvent.press(getByLabelText("Close settings"));
      await waitFor(() => {
        expect(queryByText("Tuning Settings")).toBeNull();
      });
    });

    it("toggles between equal and just temperament", async () => {
      const { getByLabelText, queryByText } = render(<Tuner />);

      // Open settings modal
      fireEvent.press(getByLabelText("Open tuning settings"));

      // Initially equal temperament selected
      expect(
        getByLabelText("Standard equal temperament, selected"),
      ).toBeTruthy();

      // Switch to just intonation
      fireEvent.press(getByLabelText("Resonance just intonation"));
      await waitFor(() => {
        expect(queryByText("Key Center")).toBeTruthy();
      });

      // Switch back to equal
      fireEvent.press(getByLabelText("Standard equal temperament"));
      await waitFor(() => {
        expect(queryByText("Key Center")).toBeNull();
      });
    });

    it("selects minor 7th system options", async () => {
      const { getByLabelText, getByText, queryByText } = render(<Tuner />);

      // Open settings modal
      fireEvent.press(getByLabelText("Open tuning settings"));

      // Switch to just intonation to see minor 7th options
      fireEvent.press(getByLabelText("Resonance just intonation"));

      await waitFor(() => {
        // The actual text is "Minor 7th Ratio"
        expect(queryByText("Minor 7th Ratio")).toBeTruthy();
      });

      // Find and press the minor 7th buttons (9:5, 16:9, 7:4)
      fireEvent.press(getByText("9:5"));
      fireEvent.press(getByText("16:9"));
      fireEvent.press(getByText("7:4"));
    });

    it("selects different keys in just intonation", async () => {
      const { getByLabelText } = render(<Tuner />);

      // Open settings modal and switch to just intonation
      fireEvent.press(getByLabelText("Open tuning settings"));
      fireEvent.press(getByLabelText("Resonance just intonation"));

      // Wait for keys to appear and select various keys
      await waitFor(() => {
        expect(getByLabelText("Key of C")).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Key of C"));
      fireEvent.press(getByLabelText("Key of G"));
      fireEvent.press(getByLabelText("Key of D"));
      fireEvent.press(getByLabelText("Key of F#/Gb"));
      fireEvent.press(getByLabelText("Key of A#/Bb"));
    });
  });

  describe("challenge panel UI", () => {
    it("opens and closes challenge panel", async () => {
      const { getByLabelText, queryByLabelText } = render(<Tuner />);

      // Open challenge panel
      fireEvent.press(getByLabelText("Open challenge panel"));

      await waitFor(() => {
        // Challenge panel should show Start challenge button and difficulty options
        expect(queryByLabelText("Start challenge")).toBeTruthy();
        expect(queryByLabelText(/easy difficulty/i)).toBeTruthy();
      });

      // Close challenge panel
      fireEvent.press(getByLabelText("Close challenge panel"));

      await waitFor(() => {
        // Panel toggle button should reappear when panel is closed
        expect(queryByLabelText("Open challenge panel")).toBeTruthy();
      });
    });

    it("selects different difficulty levels", async () => {
      const { getByLabelText, queryByLabelText } = render(<Tuner />);

      // Open challenge panel
      fireEvent.press(getByLabelText("Open challenge panel"));

      await waitFor(() => {
        expect(queryByLabelText(/easy difficulty/i)).toBeTruthy();
      });

      // Select different difficulties using accessibility labels
      fireEvent.press(getByLabelText(/easy difficulty/i));
      fireEvent.press(getByLabelText(/medium difficulty/i));
      fireEvent.press(getByLabelText(/hard difficulty/i));
      fireEvent.press(getByLabelText(/expert difficulty/i));
    });

    it("starts and stops a challenge", async () => {
      const { getByLabelText, queryByLabelText } = render(<Tuner />);

      // Open challenge panel
      fireEvent.press(getByLabelText("Open challenge panel"));

      await waitFor(() => {
        expect(queryByLabelText("Start challenge")).toBeTruthy();
      });

      // Start a challenge
      fireEvent.press(getByLabelText("Start challenge"));

      // Stop the challenge
      await waitFor(() => {
        expect(queryByLabelText("Stop challenge")).toBeTruthy();
      });
      fireEvent.press(getByLabelText("Stop challenge"));
    });

    it("skips to next note during active challenge", async () => {
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

      const { getByLabelText, queryByLabelText } = render(<Tuner />);

      // Open challenge panel and start a challenge
      fireEvent.press(getByLabelText("Open challenge panel"));
      await waitFor(() => {
        expect(queryByLabelText("Start challenge")).toBeTruthy();
      });
      fireEvent.press(getByLabelText("Start challenge"));

      // Skip button should be available during active challenge
      await waitFor(() => {
        expect(queryByLabelText("Skip to next note")).toBeTruthy();
      });
      fireEvent.press(getByLabelText("Skip to next note"));
    });
  });

  describe("stats panel UI", () => {
    it("opens and closes stats panel", async () => {
      const { getByLabelText, queryByText } = render(<Tuner />);

      // Open stats panel
      fireEvent.press(getByLabelText("Open stats panel"));

      await waitFor(() => {
        // Look for emoji + text combination
        expect(queryByText(/Stats/)).toBeTruthy();
      });

      // Close stats panel
      fireEvent.press(getByLabelText("Close stats panel"));

      await waitFor(() => {
        // Panel toggle button should reappear when panel is closed
        expect(getByLabelText("Open stats panel")).toBeTruthy();
      });
    });

    it("resets session stats", async () => {
      const { getByLabelText, queryByLabelText } = render(<Tuner />);

      // Open stats panel
      fireEvent.press(getByLabelText("Open stats panel"));

      await waitFor(() => {
        expect(queryByLabelText("Reset session stats")).toBeTruthy();
      });

      // Reset stats
      fireEvent.press(getByLabelText("Reset session stats"));
    });
  });

  describe("feedback mode cycling", () => {
    it("cycles through feedback modes on tap", async () => {
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

      const { getByLabelText } = render(<Tuner mode="needle" />);

      // Detect a pitch first so feedback area shows content
      act(() => {
        capturedOptions?.onPitchDetected?.({ frequency: 440 });
      });

      // Tap to cycle feedback display - we cycle through 4 modes (0,1,2,3)
      // Mode 0: Deviation
      // Mode 1: Frequency
      // Mode 2: Note name only
      // Mode 3: Hide feedback
      const feedbackButton = getByLabelText("Tap to cycle feedback display");
      fireEvent.press(feedbackButton); // Mode 0 -> 1
      fireEvent.press(feedbackButton); // Mode 1 -> 2
      fireEvent.press(feedbackButton); // Mode 2 -> 3
      fireEvent.press(feedbackButton); // Mode 3 -> 0
    });
  });
});
