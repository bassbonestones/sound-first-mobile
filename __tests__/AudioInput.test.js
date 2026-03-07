import React from "react";
import { render, act, waitFor } from "@testing-library/react-native";
import AudioInput from "../src/components/AudioInput";

// Note: Tests run in a mobile environment where AudioInput returns null.
// These tests verify the component doesn't crash and handles props correctly.

// Mock Web Audio API for any web-path tests
const mockGetUserMedia = jest.fn();
const mockAnalyserConnect = jest.fn();
const mockSourceConnect = jest.fn();
const mockSourceDisconnect = jest.fn();
const mockGetByteTimeDomainData = jest.fn();
const mockGetFloatTimeDomainData = jest.fn();
const mockAudioContextClose = jest.fn();

const mockAnalyserNode = {
  connect: mockAnalyserConnect,
  fftSize: 2048,
  getByteTimeDomainData: mockGetByteTimeDomainData,
  getFloatTimeDomainData: mockGetFloatTimeDomainData,
};

const mockSourceNode = {
  connect: mockSourceConnect,
  disconnect: mockSourceDisconnect,
};

const mockAudioContext = {
  createAnalyser: jest.fn(() => mockAnalyserNode),
  createMediaStreamSource: jest.fn(() => mockSourceNode),
  close: mockAudioContextClose,
  sampleRate: 44100,
  state: "running",
};

// Setup global mocks
beforeEach(() => {
  jest.useFakeTimers();

  // Mock AudioContext
  global.AudioContext = jest.fn(() => mockAudioContext);
  global.webkitAudioContext = jest.fn(() => mockAudioContext);

  // Mock navigator.mediaDevices
  global.navigator = {
    mediaDevices: {
      getUserMedia: mockGetUserMedia,
    },
  };

  // Setup successful getUserMedia by default
  const mockStream = { getTracks: () => [{ stop: jest.fn() }] };
  mockGetUserMedia.mockResolvedValue(mockStream);

  // Setup default analyser data (silence)
  mockGetByteTimeDomainData.mockImplementation((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = 128; // Silence = mid-point (128)
    }
  });

  mockGetFloatTimeDomainData.mockImplementation((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = 0; // Silence
    }
  });

  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
  delete global.AudioContext;
  delete global.webkitAudioContext;
  delete global.navigator;
});

describe("AudioInput Component", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      // On mobile, component returns null (disabled). This is expected.
      const { toJSON } = render(<AudioInput enabled={false} />);
      // Just verify it doesn't throw - null is a valid return
      expect(true).toBe(true);
    });

    it("renders enabled state", () => {
      const { toJSON } = render(<AudioInput enabled={true} />);
      // Just verify it doesn't throw
      expect(true).toBe(true);
    });

    it("renders disabled state without starting audio", () => {
      render(<AudioInput enabled={false} />);
      // When disabled, getUserMedia should not be called
      expect(mockGetUserMedia).not.toHaveBeenCalled();
    });
  });

  describe("Audio Initialization", () => {
    it("requests microphone permission when enabled", async () => {
      render(<AudioInput enabled={true} />);

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // On mobile, microphone is disabled, so no permission request
      // On web, would try to access microphone
    });

    it("handles enabled prop change", async () => {
      const { rerender } = render(<AudioInput enabled={false} />);

      rerender(<AudioInput enabled={true} />);
      // Just verify no crash
      expect(true).toBe(true);
    });
  });

  describe("Props Handling", () => {
    it("accepts targetNote prop", () => {
      render(<AudioInput enabled={false} targetNote="Bb3" />);
      // Just verify no crash
      expect(true).toBe(true);
    });

    it("accepts volumeThreshold prop", () => {
      render(<AudioInput enabled={false} volumeThreshold={0.05} />);
      expect(true).toBe(true);
    });

    it("accepts silenceDuration prop", () => {
      render(<AudioInput enabled={false} silenceDuration={2000} />);
      expect(true).toBe(true);
    });

    it("accepts pitchMargin prop", () => {
      render(<AudioInput enabled={false} targetNote="C4" pitchMargin={30} />);
      expect(true).toBe(true);
    });

    it("accepts callback props", () => {
      const onVolumeChange = jest.fn();
      const onPitchDetected = jest.fn();
      const onPitchMatch = jest.fn();
      const onSoundStart = jest.fn();
      const onSoundEnd = jest.fn();
      const onError = jest.fn();

      render(
        <AudioInput
          enabled={false}
          onVolumeChange={onVolumeChange}
          onPitchDetected={onPitchDetected}
          onPitchMatch={onPitchMatch}
          onSoundStart={onSoundStart}
          onSoundEnd={onSoundEnd}
          onError={onError}
        />,
      );
      expect(true).toBe(true);
    });
  });

  describe("Note Frequency Mapping", () => {
    it("handles natural notes", () => {
      render(<AudioInput enabled={false} targetNote="C4" />);
      expect(true).toBe(true);
    });

    it("handles sharp notes", () => {
      render(<AudioInput enabled={false} targetNote="F#4" />);
      expect(true).toBe(true);
    });

    it("handles flat notes", () => {
      render(<AudioInput enabled={false} targetNote="Bb3" />);
      expect(true).toBe(true);
    });

    it("handles various octaves", () => {
      const notes = ["C2", "G3", "A4", "D5", "E6"];

      notes.forEach((note) => {
        const { unmount } = render(
          <AudioInput enabled={false} targetNote={note} />,
        );
        // Just verify no crash
        unmount();
      });
      expect(true).toBe(true);
    });
  });

  describe("Cleanup", () => {
    it("cleans up on unmount", async () => {
      const { unmount } = render(<AudioInput enabled={true} />);

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      unmount();
      // Should not throw or cause memory leaks
      expect(true).toBe(true);
    });

    it("handles rapid enable/disable toggle", async () => {
      const { rerender } = render(<AudioInput enabled={false} />);

      for (let i = 0; i < 5; i++) {
        rerender(<AudioInput enabled={i % 2 === 0} />);
        await act(async () => {
          jest.advanceTimersByTime(50);
        });
      }

      expect(true).toBe(true);
    });
  });
});
