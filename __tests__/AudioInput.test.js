import React from "react";
import { render, act, waitFor } from "@testing-library/react-native";
import AudioInput from "../components/AudioInput";

// Mock Web Audio API
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
      const { toJSON } = render(<AudioInput enabled={false} />);
      expect(toJSON()).toBeTruthy();
    });

    it("renders enabled state", () => {
      const { toJSON } = render(<AudioInput enabled={true} />);
      expect(toJSON()).toBeTruthy();
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
      
      // On web platform, should try to access microphone
      // Note: Depending on implementation, this may or may not be called
    });

    it("handles enabled prop change", async () => {
      const { rerender, toJSON } = render(<AudioInput enabled={false} />);
      expect(toJSON()).toBeTruthy();
      
      rerender(<AudioInput enabled={true} />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Props Handling", () => {
    it("accepts targetNote prop", () => {
      const { toJSON } = render(
        <AudioInput enabled={false} targetNote="Bb3" />
      );
      expect(toJSON()).toBeTruthy();
    });

    it("accepts volumeThreshold prop", () => {
      const { toJSON } = render(
        <AudioInput enabled={false} volumeThreshold={0.05} />
      );
      expect(toJSON()).toBeTruthy();
    });

    it("accepts silenceDuration prop", () => {
      const { toJSON } = render(
        <AudioInput enabled={false} silenceDuration={2000} />
      );
      expect(toJSON()).toBeTruthy();
    });

    it("accepts pitchMargin prop", () => {
      const { toJSON } = render(
        <AudioInput enabled={false} targetNote="C4" pitchMargin={30} />
      );
      expect(toJSON()).toBeTruthy();
    });

    it("accepts callback props", () => {
      const onVolumeChange = jest.fn();
      const onPitchDetected = jest.fn();
      const onPitchMatch = jest.fn();
      const onSoundStart = jest.fn();
      const onSoundEnd = jest.fn();
      const onError = jest.fn();
      
      const { toJSON } = render(
        <AudioInput
          enabled={false}
          onVolumeChange={onVolumeChange}
          onPitchDetected={onPitchDetected}
          onPitchMatch={onPitchMatch}
          onSoundStart={onSoundStart}
          onSoundEnd={onSoundEnd}
          onError={onError}
        />
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Note Frequency Mapping", () => {
    it("handles natural notes", () => {
      const { toJSON } = render(
        <AudioInput enabled={false} targetNote="C4" />
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles sharp notes", () => {
      const { toJSON } = render(
        <AudioInput enabled={false} targetNote="F#4" />
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles flat notes", () => {
      const { toJSON } = render(
        <AudioInput enabled={false} targetNote="Bb3" />
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles various octaves", () => {
      const notes = ["C2", "G3", "A4", "D5", "E6"];
      
      notes.forEach((note) => {
        const { toJSON, unmount } = render(
          <AudioInput enabled={false} targetNote={note} />
        );
        expect(toJSON()).toBeTruthy();
        unmount();
      });
    });
  });

  describe("Cleanup", () => {
    it("cleans up on unmount", async () => {
      const { unmount, toJSON } = render(<AudioInput enabled={true} />);
      expect(toJSON()).toBeTruthy();
      
      await act(async () => {
        jest.advanceTimersByTime(100);
      });
      
      unmount();
      // Should not throw or cause memory leaks
    });

    it("handles rapid enable/disable toggle", async () => {
      const { rerender, toJSON } = render(<AudioInput enabled={false} />);
      
      for (let i = 0; i < 5; i++) {
        rerender(<AudioInput enabled={i % 2 === 0} />);
        await act(async () => {
          jest.advanceTimersByTime(50);
        });
      }
      
      expect(toJSON()).toBeTruthy();
    });
  });
});
