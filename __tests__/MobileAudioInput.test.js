/**
 * Tests for MobileAudioInput component
 */

import React from "react";
import { render } from "@testing-library/react-native";
import MobileAudioInput from "../src/components/MobileAudioInput";

// Mock the usePitchDetection hook
jest.mock("../src/hooks/usePitchDetection", () => ({
  usePitchDetection: jest.fn(() => ({
    isListening: false,
    error: null,
    currentPitch: null,
    volume: 0,
    isSounding: false,
    isAvailable: true,
  })),
}));

import { usePitchDetection } from "../src/hooks/usePitchDetection";

describe("MobileAudioInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("When audio is available", () => {
    it("renders without crashing when available", () => {
      usePitchDetection.mockReturnValue({
        isListening: true,
        error: null,
        currentPitch: 440,
        volume: 0.5,
        isSounding: true,
        isAvailable: true,
      });

      render(<MobileAudioInput enabled={true} />);
    });

    it("renders debug info when showDebug is true", () => {
      usePitchDetection.mockReturnValue({
        isListening: true,
        error: null,
        currentPitch: 440,
        volume: 0.5,
        isSounding: true,
        isAvailable: true,
      });

      const { queryByText } = render(
        <MobileAudioInput enabled={true} showDebug={true} />,
      );
      // Debug mode shows pitch and volume info
    });

    it("renders compact mode", () => {
      usePitchDetection.mockReturnValue({
        isListening: true,
        error: null,
        currentPitch: 440,
        volume: 0.3,
        isSounding: true,
        isAvailable: true,
      });

      render(<MobileAudioInput enabled={true} compact={true} />);
    });
  });

  describe("When audio is not available", () => {
    it("shows unavailable message", () => {
      usePitchDetection.mockReturnValue({
        isListening: false,
        error: null,
        currentPitch: null,
        volume: 0,
        isSounding: false,
        isAvailable: false,
      });

      const { getByText } = render(<MobileAudioInput enabled={true} />);
      expect(getByText("Native audio not available.")).toBeTruthy();
    });

    it("shows hint about Expo Dev Client", () => {
      usePitchDetection.mockReturnValue({
        isListening: false,
        error: null,
        currentPitch: null,
        volume: 0,
        isSounding: false,
        isAvailable: false,
      });

      const { getByText } = render(<MobileAudioInput enabled={true} />);
      expect(getByText(/Expo Dev Client/)).toBeTruthy();
    });
  });

  describe("When there is an error", () => {
    it("shows error message", () => {
      usePitchDetection.mockReturnValue({
        isListening: false,
        error: "Microphone permission denied",
        currentPitch: null,
        volume: 0,
        isSounding: false,
        isAvailable: true,
      });

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

      usePitchDetection.mockReturnValue({
        isListening: true,
        error: null,
        currentPitch: null,
        volume: 0,
        isSounding: false,
        isAvailable: true,
      });

      render(
        <MobileAudioInput
          enabled={true}
          onVolumeChange={onVolumeChange}
          onPitchDetected={onPitchDetected}
          onSoundStart={onSoundStart}
          onSoundEnd={onSoundEnd}
        />,
      );

      expect(usePitchDetection).toHaveBeenCalledWith(
        expect.objectContaining({
          onVolumeChange,
          onPitchDetected,
          onSoundStart,
          onSoundEnd,
        }),
      );
    });

    it("passes threshold config to usePitchDetection", () => {
      usePitchDetection.mockReturnValue({
        isListening: true,
        error: null,
        currentPitch: null,
        volume: 0,
        isSounding: false,
        isAvailable: true,
      });

      render(
        <MobileAudioInput
          enabled={true}
          volumeThreshold={0.05}
          silenceDuration={2000}
          pitchMargin={50}
        />,
      );

      expect(usePitchDetection).toHaveBeenCalledWith(
        expect.objectContaining({
          volumeThreshold: 0.05,
          silenceDuration: 2000,
          pitchMargin: 50,
        }),
      );
    });
  });
});
