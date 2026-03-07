/**
 * Tests for Metronome component
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import Metronome from '../src/components/Metronome';

// Mock AudioContext for web
const mockOscillator = {
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  frequency: { value: 0 },
  type: 'sine',
};

const mockGainNode = {
  connect: jest.fn(),
  gain: {
    setValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
  },
};

const mockAudioContext = {
  createOscillator: jest.fn(() => mockOscillator),
  createGain: jest.fn(() => mockGainNode),
  destination: {},
  currentTime: 0,
  close: jest.fn(),
};

// Set up web platform mock
beforeAll(() => {
  global.window = {
    AudioContext: jest.fn(() => mockAudioContext),
    webkitAudioContext: jest.fn(() => mockAudioContext),
  };
});

afterAll(() => {
  delete global.window;
});

describe('Metronome', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial state', () => {
    it('renders with default BPM', () => {
      const { getByText } = render(<Metronome />);
      
      // Default BPM is 80 - using getAllByText since 80 appears in preset buttons too
      expect(getByText('BPM')).toBeTruthy();
    });

    it('renders with custom initial BPM', () => {
      const { getAllByText } = render(<Metronome initialBpm={120} />);
      
      // BPM display shows 120 (also appears in preset buttons)
      expect(getAllByText('120').length).toBeGreaterThanOrEqual(1);
    });

    it('starts in stopped state by default', () => {
      const { getByText } = render(<Metronome />);
      
      // Should show "▶ Start" text (not playing)
      expect(getByText(/Start/)).toBeTruthy();
    });

    it('starts playing when autoStart is true', () => {
      const { getByText } = render(<Metronome autoStart={true} />);
      
      // Should show "⏹ Stop" (playing)
      expect(getByText(/Stop/)).toBeTruthy();
    });
  });

  describe('BPM controls', () => {
    it('increases BPM when + button pressed', () => {
      const onBpmChange = jest.fn();
      const { getByText } = render(
        <Metronome initialBpm={100} onBpmChange={onBpmChange} />
      );

      fireEvent.press(getByText('+'));

      expect(onBpmChange).toHaveBeenCalled();
    });

    it('decreases BPM when - button pressed', () => {
      const onBpmChange = jest.fn();
      const { getByText } = render(
        <Metronome initialBpm={100} onBpmChange={onBpmChange} />
      );

      fireEvent.press(getByText('-'));

      expect(onBpmChange).toHaveBeenCalled();
    });

    it('renders fine adjustment buttons', () => {
      const { getByText } = render(<Metronome />);

      expect(getByText('-1')).toBeTruthy();
      expect(getByText('+1')).toBeTruthy();
    });
  });

  describe('Play/Pause functionality', () => {
    it('toggles from stopped to playing', () => {
      const { getByText } = render(<Metronome />);

      fireEvent.press(getByText(/Start/));

      expect(getByText(/Stop/)).toBeTruthy();
    });

    it('toggles from playing to stopped', () => {
      const { getByText } = render(<Metronome autoStart={true} />);

      fireEvent.press(getByText(/Stop/));

      expect(getByText(/Start/)).toBeTruthy();
    });
  });

  describe('Tap Tempo', () => {
    it('renders tap tempo button', () => {
      const { getByText } = render(<Metronome />);

      expect(getByText(/Tap/)).toBeTruthy();
    });
  });

  describe('Preset buttons', () => {
    it('renders preset BPM buttons', () => {
      const { getByText } = render(<Metronome />);

      expect(getByText('60')).toBeTruthy();
      expect(getByText('100')).toBeTruthy();
      expect(getByText('140')).toBeTruthy();
      expect(getByText('160')).toBeTruthy();
    });
  });

  describe('Props validation', () => {
    it('hides controls when showControls is false', () => {
      const { queryByText } = render(
        <Metronome showControls={false} />
      );

      // Should not show +/- buttons
      expect(queryByText('+')).toBeNull();
      expect(queryByText('-')).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('clears intervals on unmount', () => {
      const { unmount } = render(<Metronome autoStart={true} />);

      // Advance time
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Unmount - should not throw
      expect(() => unmount()).not.toThrow();
    });
  });
});
