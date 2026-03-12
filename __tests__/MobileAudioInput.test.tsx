/**
 * Tests for MobileAudioInput component
 *
 * Fully typed TypeScript test file.
 */

import React from "react";
import { render } from "@testing-library/react-native";
import MobileAudioInput from "../src/components/MobileAudioInput";
import type { UsePitchDetectionReturn } from "../src/hooks/usePitchDetection";

// Create default mock return value
const createMockPitchDetectionReturn = (
  overrides: Partial<UsePitchDetectionReturn> = {},
): UsePitchDetectionReturn => ({
  isListening: false,
  permissionGranted: true,
  error: null,
  currentPitch: null,
  volume: 0,
  isSounding: false,
  isAvailable: true,
  startListening: jest.fn().mockResolvedValue(undefined),
  stopListening: jest.fn(),
  ...overrides,
});

// Mock the usePitchDetection hook - must define inline since jest.mock is hoisted
jest.mock("../src/hooks/usePitchDetection", () => ({
  usePitchDetection: jest.fn(() => ({
    isListening: false,
    permissionGranted: true,
    error: null,
    currentPitch: null,
    volume: 0,
    isSounding: false,
    isAvailable: true,
    startListening: jest.fn().mockResolvedValue(undefined),
    stopListening: jest.fn(),
  })),
}));

// Import and cast to get typed mock reference
import { usePitchDetection } from "../src/hooks/usePitchDetection";
const mockUsePitchDetection = usePitchDetection as jest.MockedFunction<
  typeof usePitchDetection
>;

describe("MobileAudioInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("When audio is available", () => {
    it("renders without crashing when available", () => {
      mockUsePitchDetection.mockReturnValue(
        createMockPitchDetectionReturn({
          isListening: true,
          currentPitch: {
            noteName: "A4",
            midiNote: 69,
            cents: 0,
            frequency: 440,
          },
          volume: 0.5,
          isSounding: true,
        }),
      );

      render(<MobileAudioInput enabled={true} />);
    });

    it("renders debug info when showDebug is true", () => {
      mockUsePitchDetection.mockReturnValue(
        createMockPitchDetectionReturn({
          isListening: true,
          currentPitch: {
            noteName: "A4",
            midiNote: 69,
            cents: 0,
            frequency: 440,
          },
          volume: 0.5,
          isSounding: true,
        }),
      );

      const { queryByText } = render(
        <MobileAudioInput enabled={true} showDebug={true} />,
      );
      // Debug mode shows pitch and volume info
    });

    it("renders compact mode", () => {
      mockUsePitchDetection.mockReturnValue(
        createMockPitchDetectionReturn({
          isListening: true,
          currentPitch: {
            noteName: "A4",
            midiNote: 69,
            cents: 0,
            frequency: 440,
          },
          volume: 0.3,
          isSounding: true,
        }),
      );

      render(<MobileAudioInput enabled={true} compact={true} />);
    });
  });

  describe("When audio is not available", () => {
    it("shows unavailable message", () => {
      mockUsePitchDetection.mockReturnValue(
        createMockPitchDetectionReturn({
          isAvailable: false,
        }),
      );

      const { getByText } = render(<MobileAudioInput enabled={true} />);
      expect(getByText("Native audio not available.")).toBeTruthy();
    });

    it("shows hint about Expo Dev Client", () => {
      mockUsePitchDetection.mockReturnValue(
        createMockPitchDetectionReturn({
          isAvailable: false,
        }),
      );

      const { getByText } = render(<MobileAudioInput enabled={true} />);
      expect(getByText(/Expo Dev Client/)).toBeTruthy();
    });
  });

  describe("When there is an error", () => {
    it("shows error message", () => {
      mockUsePitchDetection.mockReturnValue(
        createMockPitchDetectionReturn({
          error: "Microphone permission denied",
        }),
      );

      const { getByText } = render(<MobileAudioInput enabled={true} />);
      expect(getByText("Microphone permission denied")).toBeTruthy();
    });
  });

  describe("Callback props", () => {
    it("passes callbacks to usePitchDetection", () => {
      const onVolumeChange = jest.fn();
      const onPitchDetected = jest.fn();
      const onSoundStart = jest.fn();
      const onSoundEnd = jest.fn();

      mockUsePitchDetection.mockReturnValue(
        createMockPitchDetectionReturn({
          isListening: true,
        }),
      );

      render(
        <MobileAudioInput
          enabled={true}
          onVolumeChange={onVolumeChange}
          onPitchDetected={onPitchDetected}
          onSoundStart={onSoundStart}
          onSoundEnd={onSoundEnd}
        />,
      );

      expect(mockUsePitchDetection).toHaveBeenCalledWith(
        expect.objectContaining({
          onVolumeChange,
          onPitchDetected,
          onSoundStart,
          onSoundEnd,
        }),
      );
    });

    it("passes threshold config to usePitchDetection", () => {
      mockUsePitchDetection.mockReturnValue(
        createMockPitchDetectionReturn({
          isListening: true,
        }),
      );

      render(
        <MobileAudioInput
          enabled={true}
          volumeThreshold={0.05}
          silenceDuration={2000}
          pitchMargin={50}
        />,
      );

      expect(mockUsePitchDetection).toHaveBeenCalledWith(
        expect.objectContaining({
          volumeThreshold: 0.05,
          silenceDuration: 2000,
          pitchMargin: 50,
        }),
      );
    });
  });
});
