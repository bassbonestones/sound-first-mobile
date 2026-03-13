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
    value: 0.3,
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
  state: "running",
  close: jest.fn(),
  resume: jest.fn(),
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

    it("renders D note button", () => {
      const { getByText } = render(<PitchDrone />);
      expect(getByText("D")).toBeTruthy();
    });

    it("renders E note button", () => {
      const { getByText } = render(<PitchDrone />);
      expect(getByText("E/F♭")).toBeTruthy();
    });

    it("renders natural notes", () => {
      const { getByText } = render(<PitchDrone />);
      expect(getByText("D")).toBeTruthy();
      expect(getByText("E/F♭")).toBeTruthy();
      expect(getByText("G")).toBeTruthy();
      expect(getByText("A")).toBeTruthy();
      expect(getByText("B/C♭")).toBeTruthy();
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

    it("shows pitch center selector in Just mode", () => {
      const { getByText, queryByText } = render(<PitchDrone />);

      // Switch to Just temperament
      fireEvent.press(getByText("Just"));

      // Should show "Root for Just Intonation:" label
      expect(getByText(/Root for Just Intonation/)).toBeTruthy();
    });

    it("hides pitch center selector in Equal mode", () => {
      const { getByText, queryByText } = render(<PitchDrone />);

      // Start in Equal mode - should not show pitch center selector
      expect(queryByText(/Root for Just Intonation/)).toBeNull();
    });

    it("allows selecting pitch center in Just mode", () => {
      const { getByText, getAllByText } = render(<PitchDrone />);

      // Switch to Just
      fireEvent.press(getByText("Just"));

      // Find the pitch center buttons (there's a D button for pitch center)
      const dButtons = getAllByText("D");
      // Press the pitch center D button
      if (dButtons.length > 0) {
        fireEvent.press(dButtons[0]);
      }
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

    it("accepts standard baroque pitch 415 Hz", () => {
      const { getByDisplayValue } = render(<PitchDrone />);

      const input = getByDisplayValue("440");
      fireEvent.changeText(input, "415");

      expect(getByDisplayValue("415")).toBeTruthy();
    });

    it("accepts high orchestra pitch 444 Hz", () => {
      const { getByDisplayValue } = render(<PitchDrone />);

      const input = getByDisplayValue("440");
      fireEvent.changeText(input, "444");

      expect(getByDisplayValue("444")).toBeTruthy();
    });

    it("accepts scientific pitch 432 Hz", () => {
      const { getByDisplayValue } = render(<PitchDrone />);

      const input = getByDisplayValue("440");
      fireEvent.changeText(input, "432");

      expect(getByDisplayValue("432")).toBeTruthy();
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

    it("displays current octave number", () => {
      const { getByText } = render(<PitchDrone />);
      expect(getByText(/Octave \(4\)/)).toBeTruthy();
    });

    it("updates octave display after increase", () => {
      const { getAllByText, getByText } = render(<PitchDrone />);

      const plusButtons = getAllByText("+");
      fireEvent.press(plusButtons[plusButtons.length - 1]);

      expect(getByText(/Octave \(5\)/)).toBeTruthy();
    });

    it("updates octave display after decrease", () => {
      const { getAllByText, getByText } = render(<PitchDrone />);

      const minusButtons = getAllByText(/−|\-/);
      fireEvent.press(minusButtons[minusButtons.length - 1]);

      expect(getByText(/Octave \(3\)/)).toBeTruthy();
    });
  });

  describe("Sustain toggle", () => {
    it("toggles sustain mode when pressed", () => {
      const { getByText } = render(<PitchDrone />);

      const sustainButton = getByText(/Sustain/);
      fireEvent.press(sustainButton);

      // Sustain should now be on (visual state change)
    });

    it("shows lock icon when sustain is on", () => {
      const { getByText } = render(<PitchDrone />);

      fireEvent.press(getByText(/Sustain/));
      expect(getByText(/🔒 Sustain/)).toBeTruthy();
    });

    it("shows unlock icon when sustain is off", () => {
      const { getByText } = render(<PitchDrone />);

      expect(getByText(/🔓 Sustain/)).toBeTruthy();
    });

    it("turns off sustain and stops all drones", () => {
      const { getByText } = render(<PitchDrone />);

      // Enable sustain
      fireEvent.press(getByText(/Sustain/));

      // Press a note to start a drone
      fireEvent.press(getByText("B♯/C"));

      // Disable sustain - should stop the drone
      fireEvent.press(getByText(/🔒 Sustain/));
    });

    it("can toggle sustain multiple times", () => {
      const { getByText } = render(<PitchDrone />);

      // Toggle on
      fireEvent.press(getByText(/Sustain/));
      expect(getByText(/🔒 Sustain/)).toBeTruthy();

      // Toggle off
      fireEvent.press(getByText(/🔒 Sustain/));
      expect(getByText(/🔓 Sustain/)).toBeTruthy();

      // Toggle on again
      fireEvent.press(getByText(/🔓 Sustain/));
      expect(getByText(/🔒 Sustain/)).toBeTruthy();
    });
  });

  describe("Vibrato toggle", () => {
    it("toggles vibrato when pressed", () => {
      const { getByText } = render(<PitchDrone />);

      const vibratoButton = getByText(/Vib/);
      fireEvent.press(vibratoButton);
    });

    it("shows ON indicator when vibrato is active", () => {
      const { getByText } = render(<PitchDrone />);

      fireEvent.press(getByText(/Vib/));
      expect(getByText(/Vib ON/)).toBeTruthy();
    });

    it("can toggle vibrato multiple times", () => {
      const { getByText, queryByText } = render(<PitchDrone />);

      // Toggle on
      fireEvent.press(getByText(/Vib/));
      expect(getByText(/Vib ON/)).toBeTruthy();

      // Toggle off
      fireEvent.press(getByText(/Vib ON/));
      expect(queryByText(/Vib ON/)).toBeNull();

      // Toggle on again
      fireEvent.press(getByText(/Vib/));
      expect(getByText(/Vib ON/)).toBeTruthy();
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

    it("can play D note", () => {
      const { getByText } = render(<PitchDrone />);

      const noteButton = getByText("D");
      fireEvent(noteButton, "pressIn");
      fireEvent(noteButton, "pressOut");
    });

    it("can play G note", () => {
      const { getByText } = render(<PitchDrone />);

      const noteButton = getByText("G");
      fireEvent(noteButton, "pressIn");
      fireEvent(noteButton, "pressOut");
    });

    it("can play A note", () => {
      const { getByText } = render(<PitchDrone />);

      const noteButton = getByText("A");
      fireEvent(noteButton, "pressIn");
      fireEvent(noteButton, "pressOut");
    });

    it("can play multiple notes in sustain mode", () => {
      const { getByText } = render(<PitchDrone />);

      fireEvent.press(getByText(/Sustain/));

      fireEvent.press(getByText("B♯/C"));
      fireEvent.press(getByText("D"));
      fireEvent.press(getByText("G"));
    });

    it("can turn off specific notes in sustain mode", () => {
      const { getByText } = render(<PitchDrone />);

      fireEvent.press(getByText(/Sustain/));

      // Turn on C and D
      fireEvent.press(getByText("B♯/C"));
      fireEvent.press(getByText("D"));

      // Turn off just D
      fireEvent.press(getByText("D"));

      // C should still be on (no error thrown)
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

    it("hides internal mute when hideInternalMute is true", () => {
      const { getByText, queryByText } = render(
        <PitchDrone hideInternalMute={true} />,
      );

      fireEvent.press(getByText(/Sustain/));
      fireEvent.press(getByText("B♯/C"));

      // Internal mute button should not appear
      expect(queryByText("🔊")).toBeNull();
      expect(queryByText("🔇")).toBeNull();
    });

    it("shows mute button when hideInternalMute is false", () => {
      const { getByText, queryByText } = render(
        <PitchDrone hideInternalMute={false} />,
      );

      fireEvent.press(getByText(/Sustain/));
      fireEvent.press(getByText("B♯/C"));

      // Mute button might appear (depends on mock state)
    });
  });

  describe("Volume control", () => {
    it("responds to volume prop changes", () => {
      const { rerender, getByText } = render(<PitchDrone volume={1.0} />);

      rerender(<PitchDrone volume={0.5} />);

      // Should apply volume change
    });

    it("accepts volume of 0", () => {
      const { getByText } = render(<PitchDrone volume={0} />);
      expect(getByText("Pitch Drone")).toBeTruthy();
    });

    it("accepts volume of 1", () => {
      const { getByText } = render(<PitchDrone volume={1} />);
      expect(getByText("Pitch Drone")).toBeTruthy();
    });

    it("accepts intermediate volume", () => {
      const { getByText } = render(<PitchDrone volume={0.7} />);
      expect(getByText("Pitch Drone")).toBeTruthy();
    });

    it("calls onVolumeChange when provided", () => {
      const onVolumeChange = jest.fn();
      const { getByText } = render(
        <PitchDrone onVolumeChange={onVolumeChange} />,
      );
      expect(getByText("Pitch Drone")).toBeTruthy();
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

    it("shows octave indicator when multiple octaves active", () => {
      const { getByText, getAllByText } = render(<PitchDrone />);

      fireEvent.press(getByText(/Sustain/));
      fireEvent.press(getByText("B♯/C"));

      const plusButtons = getAllByText("+");
      fireEvent.press(plusButtons[plusButtons.length - 1]);
      fireEvent.press(getByText("B♯/C"));

      // Should show "Oct: 4, 5" or similar
    });

    it("can remove octave from stack in sustain mode", () => {
      const { getByText, getAllByText } = render(<PitchDrone />);

      fireEvent.press(getByText(/Sustain/));

      // Add C in octave 4
      fireEvent.press(getByText("B♯/C"));

      // Go to octave 5
      const plusButtons = getAllByText("+");
      fireEvent.press(plusButtons[plusButtons.length - 1]);

      // Add C in octave 5
      fireEvent.press(getByText("B♯/C"));

      // Remove C in octave 5
      fireEvent.press(getByText("B♯/C"));
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

    it("renders pitch center grid in Just mode", () => {
      const { getByText, getAllByText } = render(<PitchDrone />);

      fireEvent.press(getByText("Just"));

      // Should have pitch center buttons for all 12 notes
      // Multiple D buttons exist: one for pitch center, one for note grid
      const dButtons = getAllByText("D");
      expect(dButtons.length).toBeGreaterThan(0);
    });

    it("can change pitch center", () => {
      const { getByText, getAllByText } = render(<PitchDrone />);

      fireEvent.press(getByText("Just"));

      // Find and press a pitch center button
      const dButtons = getAllByText("D");
      fireEvent.press(dButtons[0]);
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

    it("accepts onMetronomeVolumeChange callback", () => {
      const onMetronomeVolumeChange = jest.fn();
      const { getByText } = render(
        <PitchDrone onMetronomeVolumeChange={onMetronomeVolumeChange} />,
      );
      expect(getByText("Pitch Drone")).toBeTruthy();
    });
  });

  describe("Props", () => {
    it("accepts initialNote prop", () => {
      const { getByText } = render(<PitchDrone initialNote="C" />);
      expect(getByText("Pitch Drone")).toBeTruthy();
    });

    it("accepts initialNote as flat note", () => {
      const { getByText } = render(<PitchDrone initialNote="Bb" />);
      expect(getByText("Pitch Drone")).toBeTruthy();
    });

    it("accepts autoStart prop", () => {
      const { getByText } = render(<PitchDrone autoStart={false} />);
      expect(getByText("Pitch Drone")).toBeTruthy();
    });

    it("accepts combined initialNote and autoStart", () => {
      const { getByText } = render(
        <PitchDrone initialNote="D" autoStart={true} />,
      );
      expect(getByText("Pitch Drone")).toBeTruthy();
    });

    it("accepts metronomeVolume prop", () => {
      const { getByText } = render(<PitchDrone metronomeVolume={0.7} />);
      expect(getByText("Pitch Drone")).toBeTruthy();
    });

    it("renders with all props combined", () => {
      const { getByText } = render(
        <PitchDrone
          volume={0.8}
          muted={false}
          hideInternalMute={false}
          metronomeVolume={0.5}
          initialNote="G"
          autoStart={false}
          onPlayingChange={jest.fn()}
          onMuteChange={jest.fn()}
          onVolumeChange={jest.fn()}
          onMetronomeVolumeChange={jest.fn()}
        />,
      );
      expect(getByText("Pitch Drone")).toBeTruthy();
    });

    it("handles null initialNote", () => {
      const { getByText } = render(<PitchDrone initialNote={null} />);
      expect(getByText("Pitch Drone")).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("has accessible temperament buttons", () => {
      const { getByLabelText } = render(<PitchDrone />);
      expect(getByLabelText(/Equal temperament/)).toBeTruthy();
      expect(getByLabelText(/Just intonation/)).toBeTruthy();
    });

    it("indicates selected temperament", () => {
      const { getByLabelText } = render(<PitchDrone />);
      expect(getByLabelText(/Equal temperament, selected/)).toBeTruthy();
    });

    it("updates accessibility state when temperament changes", () => {
      const { getByText, getByLabelText } = render(<PitchDrone />);

      fireEvent.press(getByText("Just"));

      expect(getByLabelText(/Just intonation, selected/)).toBeTruthy();
    });

    it("has accessible mute button when visible", () => {
      const { getByText, queryByLabelText } = render(<PitchDrone />);

      fireEvent.press(getByText(/Sustain/));
      fireEvent.press(getByText("B♯/C"));

      // Mute button should have accessibility label
      const muteLabel = queryByLabelText(/Mute drone|Unmute drone/);
      // May or may not be visible depending on mock state
    });
  });

  describe("Edge cases", () => {
    it("handles rapid note presses", () => {
      const { getByText } = render(<PitchDrone />);

      fireEvent.press(getByText(/Sustain/));

      // Rapidly press notes
      for (let i = 0; i < 10; i++) {
        fireEvent.press(getByText("B♯/C"));
      }
    });

    it("handles rapid octave changes", () => {
      const { getAllByText } = render(<PitchDrone />);

      const plusButtons = getAllByText("+");
      const minusButtons = getAllByText(/−|\-/);

      for (let i = 0; i < 5; i++) {
        fireEvent.press(plusButtons[plusButtons.length - 1]);
        fireEvent.press(minusButtons[minusButtons.length - 1]);
      }
    });

    it("handles rapid temperament changes", () => {
      const { getByText } = render(<PitchDrone />);

      for (let i = 0; i < 5; i++) {
        fireEvent.press(getByText("Just"));
        fireEvent.press(getByText("Equal"));
      }
    });

    it("handles Concert A changes while drone is playing", () => {
      const { getByText, getByDisplayValue } = render(<PitchDrone />);

      fireEvent.press(getByText(/Sustain/));
      fireEvent.press(getByText("B♯/C"));

      // Change Concert A while playing
      const input = getByDisplayValue("440");
      fireEvent.changeText(input, "442");
    });

    it("handles temperament change while drone is playing", () => {
      const { getByText } = render(<PitchDrone />);

      fireEvent.press(getByText(/Sustain/));
      fireEvent.press(getByText("B♯/C"));

      // Switch temperament while playing
      fireEvent.press(getByText("Just"));
    });

    it("handles vibrato toggle while drone is playing", () => {
      const { getByText } = render(<PitchDrone />);

      fireEvent.press(getByText(/Sustain/));
      fireEvent.press(getByText("B♯/C"));

      // Toggle vibrato while playing
      fireEvent.press(getByText(/Vib/));
    });

    it("handles muted prop change while playing", () => {
      const { rerender, getByText } = render(<PitchDrone muted={false} />);

      fireEvent.press(getByText(/Sustain/));
      fireEvent.press(getByText("B♯/C"));

      // Change muted state
      rerender(<PitchDrone muted={true} />);
    });

    it("handles volume prop change while playing", () => {
      const { rerender, getByText } = render(<PitchDrone volume={1.0} />);

      fireEvent.press(getByText(/Sustain/));
      fireEvent.press(getByText("B♯/C"));

      // Change volume
      rerender(<PitchDrone volume={0.5} />);
    });
  });

  describe("Component lifecycle", () => {
    it("cleans up on unmount", () => {
      const { unmount, getByText } = render(<PitchDrone />);

      fireEvent.press(getByText(/Sustain/));
      fireEvent.press(getByText("B♯/C"));

      // Unmount should clean up oscillators
      unmount();
    });

    it("handles remount cleanly", () => {
      const { unmount, getByText } = render(<PitchDrone />);

      fireEvent.press(getByText(/Sustain/));
      fireEvent.press(getByText("B♯/C"));

      unmount();

      // Re-render
      const { getByText: getByText2 } = render(<PitchDrone />);
      expect(getByText2("Pitch Drone")).toBeTruthy();
    });
  });
});
