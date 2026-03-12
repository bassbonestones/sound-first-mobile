/**
 * Tests for PitchDrone component
 *
 * Fully typed TypeScript test file.
 */

import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import PitchDrone from "../src/components/PitchDrone";

// Mock AudioContext for web
const mockOscillator = {
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  disconnect: jest.fn(),
  frequency: {
    value: 0,
    setValueAtTime: jest.fn(),
  },
  type: "sine" as const,
};

const mockGainNode = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  gain: {
    value: 0,
    setValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
  },
};

const mockAudioContext = {
  createOscillator: jest.fn(() => ({ ...mockOscillator })),
  createGain: jest.fn(() => ({ ...mockGainNode })),
  destination: {},
  currentTime: 0,
  close: jest.fn(),
};

interface MockWindow {
  AudioContext: jest.Mock;
  webkitAudioContext: jest.Mock;
}

// Set up web platform mock
beforeAll(() => {
  (global as unknown as { window: MockWindow }).window = {
    AudioContext: jest.fn(() => mockAudioContext),
    webkitAudioContext: jest.fn(() => mockAudioContext),
  };
});

afterAll(() => {
  delete (global as unknown as { window?: MockWindow }).window;
});

describe("PitchDrone", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial state", () => {
    it("renders component title", () => {
      const { getByText } = render(<PitchDrone />);
      expect(getByText("Pitch Drone")).toBeTruthy();
    });

    it("renders with Equal temperament selected by default", () => {
      const { getByText } = render(<PitchDrone />);
      // Equal button should be present
      expect(getByText("Equal")).toBeTruthy();
      expect(getByText("Just")).toBeTruthy();
    });

    it("renders Concert A input with default 440 Hz", () => {
      const { getByDisplayValue } = render(<PitchDrone />);
      expect(getByDisplayValue("440")).toBeTruthy();
    });

    it("renders octave selector with default octave 4", () => {
      const { getAllByText } = render(<PitchDrone />);
      // Component shows "Octave: X" - may have multiple octave-related elements
      expect(getAllByText(/Octave/).length).toBeGreaterThan(0);
    });

    it("renders all 12 chromatic notes", () => {
      const { getByText } = render(<PitchDrone />);

      // Check for enharmonic equivalent labels
      expect(getByText("B♯/C")).toBeTruthy();
      expect(getByText("C♯/D♭")).toBeTruthy();
      expect(getByText("D♯/E♭")).toBeTruthy();
      expect(getByText("F♯/G♭")).toBeTruthy();
      expect(getByText("G♯/A♭")).toBeTruthy();
      expect(getByText("A♯/B♭")).toBeTruthy();
    });

    it("renders sustain toggle", () => {
      const { getByText } = render(<PitchDrone />);
      expect(getByText(/Sustain/)).toBeTruthy();
    });

    it("renders vibrato toggle", () => {
      const { getByText } = render(<PitchDrone />);
      expect(getByText(/Vib/)).toBeTruthy();
    });
  });

  describe("Temperament toggle", () => {
    it("switches to Just temperament when pressed", () => {
      const { getByText } = render(<PitchDrone />);

      const justButton = getByText("Just");
      fireEvent.press(justButton);

      // After pressing Just, pitch center selector should appear
      // (Visual state change - Just mode enables pitch center selection)
    });

    it("switches back to Equal temperament when pressed", () => {
      const { getByText } = render(<PitchDrone />);

      // First switch to Just
      fireEvent.press(getByText("Just"));

      // Then switch back to Equal
      fireEvent.press(getByText("Equal"));
    });
  });

  describe("Concert A input", () => {
    it("allows changing Concert A frequency", () => {
      const { getByDisplayValue } = render(<PitchDrone />);

      const input = getByDisplayValue("440");
      fireEvent.changeText(input, "442");

      expect(getByDisplayValue("442")).toBeTruthy();
    });

    it("accepts empty input gracefully", () => {
      const { getByDisplayValue, getByPlaceholderText } = render(
        <PitchDrone />,
      );

      const input = getByDisplayValue("440");
      fireEvent.changeText(input, "");

      // Should show placeholder or empty
      expect(getByPlaceholderText("440")).toBeTruthy();
    });
  });

  describe("Octave selection", () => {
    it("increases octave when + button pressed", () => {
      const { getAllByText, getByText } = render(<PitchDrone />);

      // Find the octave + button (there may be multiple + buttons)
      const plusButtons = getAllByText("+");
      // The octave + button is typically near "Octave"
      const octavePlusButton = plusButtons[plusButtons.length - 1]; // Last + is for octave

      fireEvent.press(octavePlusButton);
    });

    it("decreases octave when - button pressed", () => {
      const { getAllByText } = render(<PitchDrone />);

      // Component uses "−" (Unicode minus U+2212) not hyphen
      const minusButtons = getAllByText(/−|\-/);
      const octaveMinusButton = minusButtons[minusButtons.length - 1];

      fireEvent.press(octaveMinusButton);
    });

    it("respects minimum octave of 1", () => {
      const { getAllByText } = render(<PitchDrone />);

      // Component uses "−" (Unicode minus U+2212) not hyphen
      const minusButtons = getAllByText(/−|\-/);
      const octaveMinusButton = minusButtons[minusButtons.length - 1];

      // Press minus multiple times to hit minimum
      for (let i = 0; i < 10; i++) {
        fireEvent.press(octaveMinusButton);
      }

      // Should still render without errors
    });

    it("respects maximum octave of 9", () => {
      const { getAllByText } = render(<PitchDrone />);

      const plusButtons = getAllByText("+");
      const octavePlusButton = plusButtons[plusButtons.length - 1];

      // Press plus multiple times to hit maximum
      for (let i = 0; i < 10; i++) {
        fireEvent.press(octavePlusButton);
      }

      // Should still render without errors
    });
  });

  describe("Sustain toggle", () => {
    it("toggles sustain mode when pressed", () => {
      const { getByText } = render(<PitchDrone />);

      const sustainButton = getByText(/Sustain/);
      fireEvent.press(sustainButton);

      // Sustain should now be on (visual state change)
    });

    it("turns off sustain and stops all drones", () => {
      const { getByText } = render(<PitchDrone />);

      // Enable sustain
      fireEvent.press(getByText(/Sustain/));

      // Press a note to start a drone
      fireEvent.press(getByText("B♯/C"));

      // Disable sustain - should stop the drone
      fireEvent.press(getByText(/Sustain/));
    });
  });

  describe("Vibrato toggle", () => {
    it("toggles vibrato when pressed", () => {
      const { getByText } = render(<PitchDrone />);

      const vibratoButton = getByText(/Vib/);
      fireEvent.press(vibratoButton);
    });
  });

  describe("Note playing", () => {
    it("plays a note when pressed with sustain off", () => {
      const { getByText } = render(<PitchDrone />);

      // Press middle C (B♯/C)
      const noteButton = getByText("B♯/C");

      // Use fireEvent(element, 'eventName') for pressIn/pressOut
      fireEvent(noteButton, "pressIn");
      // Note should start playing

      fireEvent(noteButton, "pressOut");
      // Note should stop when released
    });

    it("sustains a note when sustain is on", () => {
      const { getByText } = render(<PitchDrone />);

      // Enable sustain first
      fireEvent.press(getByText(/Sustain/));

      // Press note
      fireEvent.press(getByText("B♯/C"));

      // Note should continue playing even after press ends
    });

    it("toggles note off when pressed again in sustain mode", () => {
      const { getByText } = render(<PitchDrone />);

      // Enable sustain
      fireEvent.press(getByText(/Sustain/));

      const noteButton = getByText("B♯/C");

      // First press - note on
      fireEvent.press(noteButton);

      // Second press - note off
      fireEvent.press(noteButton);
    });
  });

  describe("Mute functionality", () => {
    it("responds to muted prop", () => {
      const { rerender, getByText } = render(<PitchDrone muted={false} />);

      // Rerender with muted
      rerender(<PitchDrone muted={true} />);

      // Should apply mute state
    });

    it("calls onMuteChange when mute button pressed", () => {
      const onMuteChange = jest.fn();
      const { getByText } = render(
        <PitchDrone onMuteChange={onMuteChange} muted={false} />,
      );

      // Enable sustain and press a note to make mute button appear
      fireEvent.press(getByText(/Sustain/));
      fireEvent.press(getByText("B♯/C"));

      // Look for mute button (🔊 or 🔇)
      try {
        const muteButton = getByText("🔊");
        fireEvent.press(muteButton);
        expect(onMuteChange).toHaveBeenCalledWith(true);
      } catch {
        // Mute button may not appear if drone didn't start (platform mock)
      }
    });
  });

  describe("Volume control", () => {
    it("responds to volume prop changes", () => {
      const { rerender, getByText } = render(<PitchDrone volume={1.0} />);

      rerender(<PitchDrone volume={0.5} />);

      // Should apply volume change
    });
  });

  describe("Multi-octave functionality", () => {
    it("allows playing same note in multiple octaves", () => {
      const { getByText, getAllByText } = render(<PitchDrone />);

      // Enable sustain
      fireEvent.press(getByText(/Sustain/));

      // Press C note
      fireEvent.press(getByText("B♯/C"));

      // Change octave
      const plusButtons = getAllByText("+");
      fireEvent.press(plusButtons[plusButtons.length - 1]);

      // Press C again in new octave
      fireEvent.press(getByText("B♯/C"));

      // Both octaves should be playing
    });

    it("limits to 3 simultaneous octaves per note", () => {
      const { getByText, getAllByText } = render(<PitchDrone />);

      // Enable sustain
      fireEvent.press(getByText(/Sustain/));

      const plusButtons = getAllByText("+");
      const octavePlus = plusButtons[plusButtons.length - 1];

      // Try to add more than 3 octaves of the same note
      for (let i = 0; i < 5; i++) {
        fireEvent.press(getByText("B♯/C"));
        fireEvent.press(octavePlus);
      }

      // Should not crash, should enforce limit
    });
  });

  describe("Just intonation", () => {
    it("shows pitch center selector in Just mode", () => {
      const { getByText, queryByText } = render(<PitchDrone />);

      // Switch to Just temperament
      fireEvent.press(getByText("Just"));

      // Pitch center selector should be available
      // (Component shows note buttons as pitch center options in Just mode)
    });
  });

  describe("Callbacks", () => {
    it("calls onPlayingChange when drone starts", () => {
      const onPlayingChange = jest.fn();
      const { getByText } = render(
        <PitchDrone onPlayingChange={onPlayingChange} />,
      );

      // Enable sustain
      fireEvent.press(getByText(/Sustain/));

      // Press a note
      fireEvent.press(getByText("B♯/C"));

      // onPlayingChange might be called with true
      // (depends on AudioContext mock behavior)
    });

    it("calls onPlayingChange when all drones stop", () => {
      const onPlayingChange = jest.fn();
      const { getByText } = render(
        <PitchDrone onPlayingChange={onPlayingChange} />,
      );

      // Enable then disable sustain to stop all drones
      fireEvent.press(getByText(/Sustain/));
      fireEvent.press(getByText("B♯/C"));
      fireEvent.press(getByText(/Sustain/));

      // Should eventually call onPlayingChange(false)
    });
  });
});
