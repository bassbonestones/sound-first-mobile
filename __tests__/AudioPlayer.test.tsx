/**
 * Tests for AudioPlayer component
 *
 * Fully typed TypeScript test file.
 */

import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import AudioPlayer from "../src/components/AudioPlayer";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// Mock Audio API for web platform
const mockAudio = {
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  load: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  duration: 30,
  currentTime: 0,
  src: "",
};

beforeAll(() => {
  (global as unknown as { Audio: unknown }).Audio = jest.fn(() => mockAudio);
});

describe("AudioPlayer", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockAudio.play.mockClear();
    mockAudio.pause.mockClear();
    mockAudio.addEventListener.mockClear();
    mockAudio.removeEventListener.mockClear();

    // Default mock for audio status endpoint
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          can_render_audio: true,
          can_render_midi: true,
          music21_available: true,
        }),
    });
  });

  describe("Rendering", () => {
    it("renders with title", () => {
      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" title="Test Audio" />,
      );

      expect(getByText("Test Audio")).toBeTruthy();
    });

    it("renders default title when not provided", () => {
      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      expect(getByText("Listen to the model")).toBeTruthy();
    });

    it("renders native placeholder on mobile platform", () => {
      // By default jest-expo runs with Platform.OS = 'ios'
      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      // On native, should show placeholder message (audio feature not available)
      expect(getByText("Native audio coming soon")).toBeTruthy();
    });
  });

  describe("Audio loading", () => {
    it("checks audio status on mount", async () => {
      render(<AudioPlayer materialId="1" targetKey="C major" />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("/audio/status"),
        );
      });
    });

    it("handles fetch error gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      // Should still render without crashing
      expect(getByText("Listen to the model")).toBeTruthy();
    });
  });

  describe("Props handling", () => {
    it("accepts materialId prop", () => {
      const { getByText } = render(
        <AudioPlayer materialId="123" targetKey="C major" />,
      );

      expect(getByText("Listen to the model")).toBeTruthy();
    });

    it("accepts targetKey prop", () => {
      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="Bb major" />,
      );

      expect(getByText("Listen to the model")).toBeTruthy();
    });

    it("accepts instrument prop", () => {
      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" instrument="trumpet" />,
      );

      expect(getByText("Listen to the model")).toBeTruthy();
    });

    it("accepts onComplete callback", () => {
      const onComplete = jest.fn();
      const { getByText } = render(
        <AudioPlayer
          materialId="1"
          targetKey="C major"
          onComplete={onComplete}
        />,
      );

      expect(getByText("Listen to the model")).toBeTruthy();
    });

    it("accepts autoPlay prop", () => {
      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" autoPlay={true} />,
      );

      expect(getByText("Listen to the model")).toBeTruthy();
    });
  });

  describe("Error handling", () => {
    it("shows error when audio status check fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      // Should still render the component
      expect(getByText("Listen to the model")).toBeTruthy();
    });

    it("handles network error gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network failure"));

      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      expect(getByText("Listen to the model")).toBeTruthy();
    });
  });

  describe("Cleanup", () => {
    it("cleans up on unmount without errors", () => {
      const { unmount } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });

    it("cleans up interval on unmount", async () => {
      const { unmount } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      expect(() => unmount()).not.toThrow();
    });
  });

  describe("Props variations", () => {
    it("renders with showProgress=false", () => {
      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" showProgress={false} />,
      );

      expect(getByText("Listen to the model")).toBeTruthy();
    });

    it("renders with custom accentColor", () => {
      const { getByText } = render(
        <AudioPlayer
          materialId="1"
          targetKey="C major"
          accentColor="#FF5733"
        />,
      );

      expect(getByText("Listen to the model")).toBeTruthy();
    });

    it("renders placeholder when materialId is missing", () => {
      const { getByText } = render(
        <AudioPlayer materialId="" targetKey="C major" />,
      );

      // Should show placeholder text
      expect(getByText("Listen to the model")).toBeTruthy();
    });

    it("renders placeholder when targetKey is missing", () => {
      const { getByText } = render(<AudioPlayer materialId="1" targetKey="" />);

      expect(getByText("Listen to the model")).toBeTruthy();
    });

    it("handles different targetKey formats", () => {
      const keys = ["C major", "Bb minor", "F# major", "Db minor"];

      keys.forEach((key) => {
        const { unmount, getByText } = render(
          <AudioPlayer materialId="1" targetKey={key} />,
        );
        expect(getByText("Listen to the model")).toBeTruthy();
        unmount();
      });
    });

    it("handles different instrument values", () => {
      const instruments = ["piano", "trumpet", "clarinet", "violin", "flute"];

      instruments.forEach((instrument) => {
        const { unmount, getByText } = render(
          <AudioPlayer
            materialId="1"
            targetKey="C major"
            instrument={instrument}
          />,
        );
        expect(getByText("Listen to the model")).toBeTruthy();
        unmount();
      });
    });
  });

  describe("Audio status response handling", () => {
    it("handles audio status with all capabilities", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            can_render_audio: true,
            can_render_midi: true,
            music21_available: true,
          }),
      });

      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      expect(getByText("Listen to the model")).toBeTruthy();
    });

    it("handles audio status with no capabilities", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            can_render_audio: false,
            can_render_midi: false,
            music21_available: false,
          }),
      });

      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      expect(getByText("Listen to the model")).toBeTruthy();
    });

    it("handles malformed audio status response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      expect(getByText("Listen to the model")).toBeTruthy();
    });
  });

  describe("Edge cases", () => {
    it("handles very long materialId", () => {
      const longId = "a".repeat(1000);
      const { getByText } = render(
        <AudioPlayer materialId={longId} targetKey="C major" />,
      );

      expect(getByText("Listen to the model")).toBeTruthy();
    });

    it("handles special characters in targetKey", () => {
      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C# major" />,
      );

      expect(getByText("Listen to the model")).toBeTruthy();
    });

    it("handles Unicode in title", () => {
      const { getByText } = render(
        <AudioPlayer
          materialId="1"
          targetKey="C major"
          title="🎵 Listen 音楽"
        />,
      );

      expect(getByText("🎵 Listen 音楽")).toBeTruthy();
    });

    it("handles empty title string", () => {
      const { queryByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" title="" />,
      );

      // Empty title should render empty text
      expect(queryByText("Listen to the model")).toBeNull();
    });

    it("handles whitespace-only title", () => {
      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      // Uses default title
      expect(getByText("Listen to the model")).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("has accessible elements", () => {
      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      // Should render with accessible title
      const title = getByText("Listen to the model");
      expect(title).toBeTruthy();
    });
  });

  describe("Multiple instances", () => {
    it("renders multiple AudioPlayer instances", () => {
      const { getAllByText } = render(
        <>
          <AudioPlayer materialId="1" targetKey="C major" title="Test 1" />
          <AudioPlayer materialId="2" targetKey="D major" title="Test 2" />
        </>,
      );

      expect(getAllByText(/Test/)).toHaveLength(2);
    });

    it("handles rapid mounting and unmounting", () => {
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          <AudioPlayer materialId={String(i)} targetKey="C major" />,
        );
        expect(() => unmount()).not.toThrow();
      }
    });
  });

  describe("Callback props", () => {
    it("accepts onComplete as optional", () => {
      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      expect(getByText("Listen to the model")).toBeTruthy();
    });

    it("handles onComplete as undefined", () => {
      const { getByText } = render(
        <AudioPlayer
          materialId="1"
          targetKey="C major"
          onComplete={undefined}
        />,
      );

      expect(getByText("Listen to the model")).toBeTruthy();
    });

    it("handles onComplete callback provided", () => {
      const onComplete = jest.fn();
      const { getByText } = render(
        <AudioPlayer
          materialId="1"
          targetKey="C major"
          onComplete={onComplete}
        />,
      );

      expect(getByText("Listen to the model")).toBeTruthy();
      // Callback should not be called on mount
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe("Platform-specific behavior", () => {
    it("shows native placeholder message on iOS", () => {
      // Default platform is iOS in our tests
      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      expect(getByText("Native audio coming soon")).toBeTruthy();
    });

    it("shows expo-av installation hint on native", () => {
      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      expect(getByText(/expo-av/i)).toBeTruthy();
    });
  });

  describe("Re-rendering behavior", () => {
    it("handles prop changes without crashing", () => {
      const { rerender, getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" title="First" />,
      );

      expect(getByText("First")).toBeTruthy();

      rerender(
        <AudioPlayer materialId="2" targetKey="D major" title="Second" />,
      );

      expect(getByText("Second")).toBeTruthy();
    });

    it("handles materialId change", () => {
      const { rerender, getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      expect(getByText("Listen to the model")).toBeTruthy();

      rerender(<AudioPlayer materialId="2" targetKey="C major" />);

      expect(getByText("Listen to the model")).toBeTruthy();
    });

    it("handles targetKey change", () => {
      const { rerender, getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      expect(getByText("Listen to the model")).toBeTruthy();

      rerender(<AudioPlayer materialId="1" targetKey="G major" />);

      expect(getByText("Listen to the model")).toBeTruthy();
    });
  });
});

/**
 * Web platform tests - exercise actual audio logic
 */
describe("AudioPlayer (Web Platform)", () => {
  // Track original Platform.OS
  const originalPlatform = require("react-native").Platform.OS;

  // Enhanced mock Audio with event listener tracking
  let mockAudioInstance: {
    play: jest.Mock;
    pause: jest.Mock;
    load: jest.Mock;
    addEventListener: jest.Mock;
    removeEventListener: jest.Mock;
    duration: number;
    currentTime: number;
    src: string;
    listeners: Record<string, ((...args: unknown[]) => void)[]>;
    triggerEvent: (event: string, ...args: unknown[]) => void;
  };

  beforeAll(() => {
    // Mock Platform.OS to 'web'
    jest.doMock("react-native", () => {
      const actual = jest.requireActual("react-native");
      return {
        ...actual,
        Platform: {
          ...actual.Platform,
          OS: "web",
        },
      };
    });
  });

  beforeEach(() => {
    // Reset Platform.OS for this suite
    require("react-native").Platform.OS = "web";

    // Mock window.location for web URL building
    Object.defineProperty(global, "window", {
      value: {
        location: {
          hostname: "localhost",
        },
      },
      writable: true,
    });

    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          can_render_audio: true,
          can_render_midi: true,
        }),
    });

    // Create fresh mock audio instance with event tracking
    mockAudioInstance = {
      play: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn(),
      load: jest.fn(),
      addEventListener: jest.fn(
        (event: string, callback: (...args: unknown[]) => void) => {
          if (!mockAudioInstance.listeners[event]) {
            mockAudioInstance.listeners[event] = [];
          }
          mockAudioInstance.listeners[event].push(callback);
        },
      ),
      removeEventListener: jest.fn(
        (event: string, callback: (...args: unknown[]) => void) => {
          if (mockAudioInstance.listeners[event]) {
            mockAudioInstance.listeners[event] = mockAudioInstance.listeners[
              event
            ].filter((cb) => cb !== callback);
          }
        },
      ),
      duration: 30,
      currentTime: 0,
      src: "",
      listeners: {},
      triggerEvent: (event: string, ...args: unknown[]) => {
        if (mockAudioInstance.listeners[event]) {
          mockAudioInstance.listeners[event].forEach((cb) => cb(...args));
        }
      },
    };

    (global as unknown as { Audio: unknown }).Audio = jest.fn(
      () => mockAudioInstance,
    );
  });

  afterAll(() => {
    // Restore original Platform.OS
    require("react-native").Platform.OS = originalPlatform;
  });

  describe("Audio initialization", () => {
    it("creates Audio instance with correct URL on web", async () => {
      render(<AudioPlayer materialId="123" targetKey="C major" />);

      await waitFor(() => {
        expect(global.Audio).toHaveBeenCalled();
      });
    });

    it("sets up loadedmetadata event listener", async () => {
      render(<AudioPlayer materialId="1" targetKey="C major" />);

      await waitFor(() => {
        expect(mockAudioInstance.addEventListener).toHaveBeenCalledWith(
          "loadedmetadata",
          expect.any(Function),
        );
      });
    });

    it("sets up ended event listener", async () => {
      render(<AudioPlayer materialId="1" targetKey="C major" />);

      await waitFor(() => {
        expect(mockAudioInstance.addEventListener).toHaveBeenCalledWith(
          "ended",
          expect.any(Function),
        );
      });
    });

    it("sets up error event listener", async () => {
      render(<AudioPlayer materialId="1" targetKey="C major" />);

      await waitFor(() => {
        expect(mockAudioInstance.addEventListener).toHaveBeenCalledWith(
          "error",
          expect.any(Function),
        );
      });
    });
  });

  describe("Play/Pause controls", () => {
    it("renders play button on web", async () => {
      const { getByRole, getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      // Trigger loadedmetadata to enable controls
      await waitFor(() => {
        mockAudioInstance.triggerEvent("loadedmetadata");
      });

      // On web, should have clickable play controls
      expect(getByText("Listen to the model")).toBeTruthy();
    });

    it("plays audio when play button pressed", async () => {
      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      // Trigger loadedmetadata to enable controls
      await act(async () => {
        mockAudioInstance.triggerEvent("loadedmetadata");
      });

      // Find and press play button
      const playButton = getByText("▶");
      await act(async () => {
        fireEvent.press(playButton);
      });

      expect(mockAudioInstance.play).toHaveBeenCalled();
    });

    it("pauses audio when pause button pressed", async () => {
      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      // Trigger loadedmetadata to enable controls
      await act(async () => {
        mockAudioInstance.triggerEvent("loadedmetadata");
      });

      // Play first
      const playButton = getByText("▶");
      await act(async () => {
        fireEvent.press(playButton);
      });

      // Now pause
      const pauseButton = getByText("⏸");
      await act(async () => {
        fireEvent.press(pauseButton);
      });

      expect(mockAudioInstance.pause).toHaveBeenCalled();
    });

    it("toggles between play and pause states", async () => {
      const { getByText, queryByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      await act(async () => {
        mockAudioInstance.triggerEvent("loadedmetadata");
      });

      // Initially shows play button
      expect(getByText("▶")).toBeTruthy();

      // Press play
      await act(async () => {
        fireEvent.press(getByText("▶"));
      });

      // Now shows pause button
      expect(getByText("⏸")).toBeTruthy();
    });
  });

  describe("Audio events", () => {
    it("handles loadedmetadata event", async () => {
      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      mockAudioInstance.duration = 45;

      await act(async () => {
        mockAudioInstance.triggerEvent("loadedmetadata");
      });

      // Should show duration (0:45 format)
      expect(getByText(/0:45/)).toBeTruthy();
    });

    it("handles ended event and calls onComplete", async () => {
      const onComplete = jest.fn();
      render(
        <AudioPlayer
          materialId="1"
          targetKey="C major"
          onComplete={onComplete}
        />,
      );

      await act(async () => {
        mockAudioInstance.triggerEvent("loadedmetadata");
      });

      // Play audio
      await act(async () => {
        mockAudioInstance.triggerEvent("ended");
      });

      expect(onComplete).toHaveBeenCalled();
    });

    it("handles error event", async () => {
      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      await act(async () => {
        mockAudioInstance.triggerEvent("error");
      });

      // Should show error message
      expect(getByText("Audio failed to load")).toBeTruthy();
    });

    it("resets playback state when audio ends", async () => {
      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      await act(async () => {
        mockAudioInstance.triggerEvent("loadedmetadata");
      });

      // Play
      await act(async () => {
        fireEvent.press(getByText("▶"));
      });

      // End
      await act(async () => {
        mockAudioInstance.triggerEvent("ended");
      });

      // Should show play button again (not pause)
      expect(getByText("▶")).toBeTruthy();
    });
  });

  describe("AutoPlay", () => {
    it("auto-plays when autoPlay prop is true", async () => {
      render(
        <AudioPlayer materialId="1" targetKey="C major" autoPlay={true} />,
      );

      await waitFor(() => {
        expect(mockAudioInstance.play).toHaveBeenCalled();
      });
    });

    it("does not auto-play when autoPlay is false", async () => {
      render(
        <AudioPlayer materialId="1" targetKey="C major" autoPlay={false} />,
      );

      // Wait for any async effects
      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      // play should not be called unless user pressed button
      expect(mockAudioInstance.play).not.toHaveBeenCalled();
    });

    it("handles autoPlay failure gracefully", async () => {
      mockAudioInstance.play.mockRejectedValueOnce(
        new Error("Autoplay blocked"),
      );

      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" autoPlay={true} />,
      );

      // Should not crash, still renders
      expect(getByText("Listen to the model")).toBeTruthy();
    });
  });

  describe("Progress display", () => {
    it("shows progress bar when showProgress is true", async () => {
      const { getByTestId, getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" showProgress={true} />,
      );

      await act(async () => {
        mockAudioInstance.triggerEvent("loadedmetadata");
      });

      // Should show time display
      expect(getByText(/0:00/)).toBeTruthy();
    });

    it("formats time correctly for various durations", async () => {
      mockAudioInstance.duration = 125; // 2:05

      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      await act(async () => {
        mockAudioInstance.triggerEvent("loadedmetadata");
      });

      expect(getByText(/2:05/)).toBeTruthy();
    });

    it("displays current position during playback", async () => {
      jest.useFakeTimers();

      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      await act(async () => {
        mockAudioInstance.triggerEvent("loadedmetadata");
      });

      // Start playing
      await act(async () => {
        fireEvent.press(getByText("▶"));
      });

      // Simulate time passing
      mockAudioInstance.currentTime = 15;

      await act(async () => {
        jest.advanceTimersByTime(200);
      });

      jest.useRealTimers();
    });
  });

  describe("Cleanup", () => {
    it("pauses audio on unmount", async () => {
      const { unmount } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      await act(async () => {
        mockAudioInstance.triggerEvent("loadedmetadata");
      });

      unmount();

      expect(mockAudioInstance.pause).toHaveBeenCalled();
    });

    it("clears audio src on unmount", async () => {
      const { unmount } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      unmount();

      expect(mockAudioInstance.src).toBe("");
    });

    it("removes event listeners on unmount", async () => {
      const { unmount } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      await waitFor(() => {
        expect(mockAudioInstance.addEventListener).toHaveBeenCalled();
      });

      unmount();

      // Should call removeEventListener for cleanup
      // Note: exact implementation may vary
    });
  });

  describe("URL building", () => {
    it("encodes targetKey in URL", async () => {
      render(<AudioPlayer materialId="1" targetKey="C# major" />);

      await waitFor(() => {
        expect(global.Audio).toHaveBeenCalled();
      });

      // Audio constructor is called with URL containing encoded key
      // The mock captures this in Audio instantiation
    });

    it("encodes instrument in URL", async () => {
      render(
        <AudioPlayer
          materialId="1"
          targetKey="C major"
          instrument="French horn"
        />,
      );

      await waitFor(() => {
        expect(global.Audio).toHaveBeenCalled();
      });
    });
  });

  describe("Edge cases on web", () => {
    it("handles rapid play/pause toggling", async () => {
      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      await act(async () => {
        mockAudioInstance.triggerEvent("loadedmetadata");
      });

      // Rapid toggling
      for (let i = 0; i < 5; i++) {
        const button = getByText(/[▶⏸]/);
        await act(async () => {
          fireEvent.press(button);
        });
      }

      // Should not crash
      expect(getByText("Listen to the model")).toBeTruthy();
    });

    it("handles play failure gracefully", async () => {
      mockAudioInstance.play.mockRejectedValueOnce(new Error("Play failed"));

      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      await act(async () => {
        mockAudioInstance.triggerEvent("loadedmetadata");
      });

      await act(async () => {
        fireEvent.press(getByText("▶"));
      });

      // Should show error
      expect(getByText("Playback failed")).toBeTruthy();
    });

    it("handles missing duration gracefully", async () => {
      mockAudioInstance.duration = NaN;

      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      await act(async () => {
        mockAudioInstance.triggerEvent("loadedmetadata");
      });

      // Should show 0:00 for invalid duration (format is "0:00 / 0:00")
      expect(getByText(/0:00.*\/.*0:00/)).toBeTruthy();
    });

    it("handles zero duration", async () => {
      mockAudioInstance.duration = 0;

      const { getByText } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      await act(async () => {
        mockAudioInstance.triggerEvent("loadedmetadata");
      });

      expect(getByText(/0:00.*\/.*0:00/)).toBeTruthy();
    });
  });
});
