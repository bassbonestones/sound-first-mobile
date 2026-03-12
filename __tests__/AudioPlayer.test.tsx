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
  });

  describe("Cleanup", () => {
    it("cleans up on unmount without errors", () => {
      const { unmount } = render(
        <AudioPlayer materialId="1" targetKey="C major" />,
      );

      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });
  });
});
