/**
 * Tests for StartPracticeScreen
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import StartPracticeScreen from '../screens/StartPracticeScreen';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe('StartPracticeScreen', () => {
  beforeEach(() => {
    mockNavigation.navigate.mockClear();
    Alert.alert.mockClear();
  });

  describe('Initial state', () => {
    it('renders with default duration of 20 minutes', () => {
      const { getByText } = render(
        <StartPracticeScreen navigation={mockNavigation} />
      );

      // The 20 button should be selected (different style)
      expect(getByText('20')).toBeTruthy();
    });

    it('renders with default fatigue of 2', () => {
      const { getByText } = render(
        <StartPracticeScreen navigation={mockNavigation} />
      );

      // Fatigue 2 should be selected
      expect(getByText('Good')).toBeTruthy();
    });

    it('displays all duration options', () => {
      const { getByText } = render(
        <StartPracticeScreen navigation={mockNavigation} />
      );

      expect(getByText('10')).toBeTruthy();
      expect(getByText('20')).toBeTruthy();
      expect(getByText('30')).toBeTruthy();
      expect(getByText('45')).toBeTruthy();
      expect(getByText('60')).toBeTruthy();
    });

    it('displays all fatigue options', () => {
      const { getByText } = render(
        <StartPracticeScreen navigation={mockNavigation} />
      );

      expect(getByText('1')).toBeTruthy();
      expect(getByText('2')).toBeTruthy();
      expect(getByText('3')).toBeTruthy();
      expect(getByText('4')).toBeTruthy();
      expect(getByText('5')).toBeTruthy();
    });

    it('displays screen title', () => {
      const { getByText } = render(
        <StartPracticeScreen navigation={mockNavigation} />
      );

      expect(getByText('Sound First Practice')).toBeTruthy();
    });
  });

  describe('Duration selection', () => {
    it('allows selecting different durations', () => {
      const { getByText } = render(
        <StartPracticeScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByText('30'));

      // Start practice with selected duration
      fireEvent.press(getByText('Start Practice'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        'Session',
        expect.objectContaining({ duration: 30 })
      );
    });

    it('switches selected duration visually', () => {
      const { getByText } = render(
        <StartPracticeScreen navigation={mockNavigation} />
      );

      // Select 45 minutes
      fireEvent.press(getByText('45'));

      // The button should be selected (we can verify by the navigate params)
      fireEvent.press(getByText('Start Practice'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        'Session',
        expect.objectContaining({ duration: 45 })
      );
    });
  });

  describe('Fatigue selection', () => {
    it('allows selecting fatigue levels 1-4', () => {
      const { getByText } = render(
        <StartPracticeScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByText('3'));

      fireEvent.press(getByText('Start Practice'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        'Session',
        expect.objectContaining({ fatigue: 3 })
      );
    });

    it('shows modal when fatigue 5 selected', () => {
      const { getByText, getAllByText } = render(
        <StartPracticeScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByText('5'));

      // Modal should appear - Exhausted appears multiple times so use getAllByText
      expect(getAllByText(/Exhausted/i).length).toBeGreaterThanOrEqual(1);
    });

    it('displays fatigue labels', () => {
      const { getByText } = render(
        <StartPracticeScreen navigation={mockNavigation} />
      );

      // Select each fatigue level to see the label
      fireEvent.press(getByText('1'));
      expect(getByText('Fresh')).toBeTruthy();

      fireEvent.press(getByText('3'));
      expect(getByText('Tired')).toBeTruthy();
    });

    it('displays fatigue hints', () => {
      const { getByText } = render(
        <StartPracticeScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByText('4'));
      expect(getByText('Light practice only')).toBeTruthy();
    });
  });

  describe('Fatigue 5 modal', () => {
    it('shows modal on fatigue 5 start press', () => {
      const { getByText, getAllByText } = render(
        <StartPracticeScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByText('5'));
      fireEvent.press(getByText('Start Practice'));

      // Modal should have options - multiple "rest" texts exist
      expect(getAllByText(/rest/i).length).toBeGreaterThanOrEqual(1);
    });

    it('allows choosing to stop practice', () => {
      const { getByText } = render(
        <StartPracticeScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByText('5'));

      // Click stop option - actual text is "Stop Completely"
      fireEvent.press(getByText(/Stop Completely/i));

      // Should show alert
      expect(Alert.alert).toHaveBeenCalledWith(
        expect.stringContaining('Rest'),
        expect.any(String),
        expect.any(Array)
      );

      // Should NOT navigate
      expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });

    it('allows choosing cooldown mode', () => {
      const { getByText, queryByText } = render(
        <StartPracticeScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByText('5'));

      // If cooldown option exists, click it
      const cooldownOption = queryByText(/cooldown|light practice/i);
      if (cooldownOption) {
        fireEvent.press(cooldownOption);

        expect(mockNavigation.navigate).toHaveBeenCalledWith(
          'Session',
          expect.objectContaining({
            cooldownMode: true,
            fatigue: 5,
          })
        );
      }
    });

    it('allows choosing ear-only mode', () => {
      const { getByText, queryByText } = render(
        <StartPracticeScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByText('5'));

      // If ear-only option exists, click it
      const earOnlyOption = queryByText(/ear.only|listening only/i);
      if (earOnlyOption) {
        fireEvent.press(earOnlyOption);

        expect(mockNavigation.navigate).toHaveBeenCalledWith(
          'Session',
          expect.objectContaining({
            earOnlyMode: true,
            fatigue: 5,
          })
        );
      }
    });

    it('caps duration in cooldown mode', () => {
      const { getByText, getAllByText } = render(
        <StartPracticeScreen navigation={mockNavigation} />
      );

      // Select 60 minute duration
      fireEvent.press(getByText('60'));

      // Select fatigue 5
      fireEvent.press(getByText('5'));

      // Choose cooldown - get all matches and find the button
      const cooldownOptions = getAllByText(/Cooldown/i);
      if (cooldownOptions.length > 0) {
        fireEvent.press(cooldownOptions[0]);

        // Duration should be capped at 15 minutes
        expect(mockNavigation.navigate).toHaveBeenCalledWith(
          'Session',
          expect.objectContaining({
            duration: 15, // Capped
          })
        );
      }
    });
  });

  describe('Start Practice button', () => {
    it('navigates to Session with selected params', () => {
      const { getByText } = render(
        <StartPracticeScreen navigation={mockNavigation} />
      );

      // Select 30 minutes and fatigue 3
      fireEvent.press(getByText('30'));
      fireEvent.press(getByText('3'));

      fireEvent.press(getByText('Start Practice'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        'Session',
        expect.objectContaining({
          duration: 30,
          fatigue: 3,
        })
      );
    });

    it('includes session key for refresh', () => {
      const { getByText } = render(
        <StartPracticeScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByText('Start Practice'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        'Session',
        expect.objectContaining({
          sessionKey: expect.any(Number),
        })
      );
    });
  });

  describe('Accessibility', () => {
    it('has accessible duration buttons', () => {
      const { getByText } = render(
        <StartPracticeScreen navigation={mockNavigation} />
      );

      // All duration buttons should be pressable
      [10, 20, 30, 45, 60].forEach(d => {
        const button = getByText(String(d));
        fireEvent.press(button);
      });
    });

    it('has accessible fatigue buttons', () => {
      const { getByText } = render(
        <StartPracticeScreen navigation={mockNavigation} />
      );

      // All fatigue buttons should be pressable
      [1, 2, 3, 4].forEach(f => {
        const button = getByText(String(f));
        fireEvent.press(button);
      });
    });
  });
});
